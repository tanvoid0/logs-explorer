use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct IdeConfig {
    pub id: Option<i32>,
    pub name: String,
    pub executable: String,
    pub is_default: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: Option<i32>,
    pub name: String,
    pub path: String,
    pub framework: Option<String>,
    pub deployment: Option<String>,
    pub starred: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FrameworkIdeMapping {
    pub id: Option<i32>,
    pub framework: String,
    pub ide_id: i32,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(app_handle: &AppHandle) -> Result<Self> {
        let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");
        
        let db_path = app_dir.join("logs-explorer.db");
        let conn = Connection::open(db_path)?;
        
        let db = Database { conn };
        db.init()?;
        Ok(db)
    }
    
    fn init(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS ide_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                executable TEXT NOT NULL,
                is_default BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS framework_ide_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                framework TEXT NOT NULL UNIQUE,
                ide_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ide_id) REFERENCES ide_configs (id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                path TEXT NOT NULL UNIQUE,
                framework TEXT,
                deployment TEXT,
                starred BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // Migrate existing projects table if framework column doesn't exist
        self.migrate_projects_table()?;
        
        // Insert default IDEs if table is empty
        let count: i32 = self.conn.query_row("SELECT COUNT(*) FROM ide_configs", [], |row| row.get(0))?;
        
        if count == 0 {
            self.insert_default_ides()?;
        }
        
        Ok(())
    }
    
    fn migrate_projects_table(&self) -> Result<()> {
        // Check if framework column exists
        let mut table_info = self.conn.prepare("PRAGMA table_info(projects)")?;
        let columns: Vec<String> = table_info.query_map([], |row| {
            Ok(row.get::<_, String>(1)?)
        })?.collect::<Result<Vec<String>>>()?;
        
        // If framework column doesn't exist, add it
        if !columns.contains(&"framework".to_string()) {
            self.conn.execute(
                "ALTER TABLE projects ADD COLUMN framework TEXT",
                [],
            )?;
        }
        
        // If deployment column doesn't exist, add it
        if !columns.contains(&"deployment".to_string()) {
            self.conn.execute(
                "ALTER TABLE projects ADD COLUMN deployment TEXT",
                [],
            )?;
        }
        if !columns.contains(&"starred".to_string()) {
            self.conn.execute(
                "ALTER TABLE projects ADD COLUMN starred BOOLEAN DEFAULT 0",
                [],
            )?;
        }
        
        Ok(())
    }
    
    fn insert_default_ides(&self) -> Result<()> {
        let default_ides = vec![
            ("VS Code", "code"),
            ("IntelliJ IDEA", "idea"),
            ("WebStorm", "webstorm"),
            ("PyCharm", "pycharm"),
            ("GoLand", "goland"),
            ("CLion", "clion"),
            ("Rider", "rider"),
            ("PhpStorm", "phpstorm"),
            ("Android Studio", "studio"),
            ("Sublime Text", "subl"),
            ("Vim", "vim"),
            ("Neovim", "nvim"),
        ];
        
        for (name, executable) in default_ides {
            self.conn.execute(
                "INSERT INTO ide_configs (name, executable) VALUES (?, ?)",
                [name, executable],
            )?;
        }
        
        Ok(())
    }
    
    pub fn get_all_ides(&self) -> Result<Vec<IdeConfig>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, executable, is_default, created_at, updated_at 
             FROM ide_configs 
             ORDER BY name"
        )?;
        
        let ide_iter = stmt.query_map([], |row| {
            Ok(IdeConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                executable: row.get(2)?,
                is_default: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;
        
        ide_iter.collect()
    }
    
    pub fn add_ide(&self, name: &str, executable: &str) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO ide_configs (name, executable) VALUES (?, ?)",
            [name, executable],
        )?;
        
        Ok(self.conn.last_insert_rowid())
    }
    
    pub fn update_ide(&self, id: i32, name: &str, executable: &str) -> Result<usize> {
        self.conn.execute(
            "UPDATE ide_configs SET name = ?, executable = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [name, executable, &id.to_string()],
        )
    }
    
    pub fn delete_ide(&self, id: i32) -> Result<usize> {
        self.conn.execute("DELETE FROM ide_configs WHERE id = ?", [id])
    }
    
    pub fn set_default_ide(&self, id: i32) -> Result<usize> {
        // First, unset all defaults
        self.conn.execute("UPDATE ide_configs SET is_default = 0", [])?;
        
        // Then set the new default
        self.conn.execute(
            "UPDATE ide_configs SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [id],
        )
    }
    
    pub fn get_default_ide(&self) -> Result<Option<IdeConfig>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, executable, is_default, created_at, updated_at 
             FROM ide_configs 
             WHERE is_default = 1 
             LIMIT 1"
        )?;
        
        let mut ide_iter = stmt.query_map([], |row| {
            Ok(IdeConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                executable: row.get(2)?,
                is_default: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;
        
        Ok(ide_iter.next().transpose()?)
    }

    // Project methods
    pub fn get_all_projects(&self) -> Result<Vec<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, path, framework, deployment, starred, created_at, updated_at 
             FROM projects 
             ORDER BY starred DESC, name"
        )?;
        
        let project_iter = stmt.query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                framework: row.get(3)?,
                deployment: row.get(4)?,
                starred: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        project_iter.collect()
    }
    
    pub fn add_project(&self, name: &str, path: &str, framework: Option<&str>, deployment: Option<&str>) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO projects (name, path, framework, deployment) VALUES (?, ?, ?, ?)",
            [name, path, framework.unwrap_or(""), deployment.unwrap_or("")],
        )?;
        
        Ok(self.conn.last_insert_rowid())
    }
    
    pub fn update_project(&self, id: i32, name: &str, path: &str, framework: Option<&str>, deployment: Option<&str>) -> Result<usize> {
        self.conn.execute(
            "UPDATE projects SET name = ?, path = ?, framework = ?, deployment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [name, path, framework.unwrap_or(""), deployment.unwrap_or(""), &id.to_string()],
        )
    }
    
    pub fn delete_project(&self, id: i32) -> Result<usize> {
        self.conn.execute("DELETE FROM projects WHERE id = ?", [id])
    }

    pub fn toggle_project_star(&self, id: i32) -> Result<usize> {
        self.conn.execute(
            "UPDATE projects SET starred = NOT starred, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [id]
        )
    }

    pub fn get_projects_with_filters(&self, framework_filter: Option<&str>, sort_by: &str, search_query: Option<&str>) -> Result<Vec<Project>> {
        let mut query = String::from(
            "SELECT id, name, path, framework, deployment, starred, created_at, updated_at FROM projects WHERE 1=1"
        );
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        // Add framework filter
        if let Some(framework) = framework_filter {
            query.push_str(" AND framework = ?");
            params.push(Box::new(framework.to_string()));
        }

        // Add search query
        if let Some(query_str) = search_query {
            query.push_str(" AND (name LIKE ? OR path LIKE ?)");
            let search_pattern = format!("%{}%", query_str);
            params.push(Box::new(search_pattern.clone()));
            params.push(Box::new(search_pattern));
        }

        // Add sorting
        match sort_by {
            "name" => query.push_str(" ORDER BY starred DESC, name"),
            "date_added" => query.push_str(" ORDER BY starred DESC, created_at DESC"),
            "date_updated" => query.push_str(" ORDER BY starred DESC, updated_at DESC"),
            _ => query.push_str(" ORDER BY starred DESC, name"), // default
        }

        let mut stmt = self.conn.prepare(&query)?;
        
        let project_iter = stmt.query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                framework: row.get(3)?,
                deployment: row.get(4)?,
                starred: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        project_iter.collect()
    }

    pub fn get_frameworks(&self) -> Result<Vec<String>> {
        let mut stmt = self.conn.prepare(
            "SELECT DISTINCT framework FROM projects WHERE framework IS NOT NULL AND framework != '' ORDER BY framework"
        )?;
        
        let framework_iter = stmt.query_map([], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;
        
        framework_iter.collect()
    }
    
    pub fn get_project(&self, id: i32) -> Result<Option<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, path, framework, deployment, starred, created_at, updated_at 
             FROM projects 
             WHERE id = ? 
             LIMIT 1"
        )?;
        
        let mut project_iter = stmt.query_map([id], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                framework: row.get(3)?,
                deployment: row.get(4)?,
                starred: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        
        Ok(project_iter.next().transpose()?)
    }

    // Framework IDE Mapping methods
    pub fn set_framework_ide_mapping(&self, framework: &str, ide_id: i32) -> Result<usize> {
        self.conn.execute(
            "INSERT OR REPLACE INTO framework_ide_mappings (framework, ide_id, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
            [framework, &ide_id.to_string()],
        )
    }
    
    pub fn get_framework_ide_mapping(&self, framework: &str) -> Result<Option<IdeConfig>> {
        let mut stmt = self.conn.prepare(
            "SELECT i.id, i.name, i.executable, i.is_default, i.created_at, i.updated_at 
             FROM ide_configs i
             INNER JOIN framework_ide_mappings f ON i.id = f.ide_id
             WHERE f.framework = ? 
             LIMIT 1"
        )?;
        
        let mut ide_iter = stmt.query_map([framework], |row| {
            Ok(IdeConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                executable: row.get(2)?,
                is_default: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;
        
        Ok(ide_iter.next().transpose()?)
    }
    
    pub fn get_all_framework_ide_mappings(&self) -> Result<Vec<FrameworkIdeMapping>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, framework, ide_id, created_at, updated_at 
             FROM framework_ide_mappings 
             ORDER BY framework"
        )?;
        
        let mapping_iter = stmt.query_map([], |row| {
            Ok(FrameworkIdeMapping {
                id: row.get(0)?,
                framework: row.get(1)?,
                ide_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;
        
        mapping_iter.collect()
    }
    
    pub fn delete_framework_ide_mapping(&self, framework: &str) -> Result<usize> {
        self.conn.execute("DELETE FROM framework_ide_mappings WHERE framework = ?", [framework])
    }
}
