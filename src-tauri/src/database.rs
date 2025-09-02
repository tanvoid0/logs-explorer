use sea_orm::{Database, DatabaseConnection};
use tauri::AppHandle;

#[derive(Clone)]
pub struct DatabaseManager {
    conn: DatabaseConnection,
}

impl DatabaseManager {
    pub async fn new(_app_handle: &AppHandle) -> Result<Self, sea_orm::DbErr> {
        // Use a simple path for now - in production you'd want to use proper app data dir
        let app_dir = std::env::current_dir().expect("Failed to get current directory").join("data");
        std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");
        
        let db_path = app_dir.join("logs-explorer.db");
        let database_url = format!("sqlite://{}?mode=rwc", db_path.display());
        
        let conn = Database::connect(&database_url).await?;
        
        Ok(DatabaseManager { conn })
    }
    
    /// Get a reference to the database connection
    pub fn get_connection(&self) -> &DatabaseConnection {
        &self.conn
    }
    
    /// Get a clone of the database connection for repositories
    pub fn get_connection_clone(&self) -> DatabaseConnection {
        self.conn.clone()
    }
}
