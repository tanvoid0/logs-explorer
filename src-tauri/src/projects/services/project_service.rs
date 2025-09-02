use sea_orm::*;
use crate::database::DatabaseManager;
use crate::projects::entities::{ProjectEntity, ProjectModel, ProjectActiveModel};
use std::path::Path;

pub struct ProjectService {
    db_manager: DatabaseManager,
}

impl ProjectService {
    pub fn new(db_manager: &DatabaseManager) -> Self {
        Self {
            db_manager: db_manager.clone(),
        }
    }

    pub async fn get_all_projects(&self) -> Result<Vec<ProjectModel>, DbErr> {
        let db = self.db_manager.get_connection();
        ProjectEntity::find()
            .all(db)
            .await
    }

    pub async fn get_project(&self, id: i32) -> Result<Option<ProjectModel>, DbErr> {
        let db = self.db_manager.get_connection();
        ProjectEntity::find_by_id(id)
            .one(db)
            .await
    }

    pub async fn create_project(
        &self,
        name: String,
        path: String,
        framework: Option<String>,
        deployment: Option<String>,
    ) -> Result<i32, DbErr> {
        let db = self.db_manager.get_connection();
        
        let project = ProjectActiveModel {
            name: Set(name),
            path: Set(path),
            framework: Set(framework),
            deployment: Set(deployment),
            starred: Set(false),
            created_at: Set(Some(chrono::Utc::now().naive_utc())),
            updated_at: Set(Some(chrono::Utc::now().naive_utc())),
            ..Default::default()
        };

        let result = project.insert(db).await?;
        Ok(result.id)
    }

    pub async fn update_project(
        &self,
        id: i32,
        name: Option<String>,
        path: Option<String>,
        framework: Option<String>,
        deployment: Option<String>,
    ) -> Result<Option<ProjectModel>, DbErr> {
        let db = self.db_manager.get_connection();
        
        let project = ProjectEntity::find_by_id(id)
            .one(db)
            .await?;

        if let Some(project_model) = project {
            let mut project_active: ProjectActiveModel = project_model.into();
            
            if let Some(name) = name {
                project_active.name = Set(name);
            }
            if let Some(path) = path {
                project_active.path = Set(path);
            }
            if let Some(framework) = framework {
                project_active.framework = Set(Some(framework));
            }
            if let Some(deployment) = deployment {
                project_active.deployment = Set(Some(deployment));
            }
            
            project_active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
            
            let updated_project = project_active.update(db).await?;
            Ok(Some(updated_project))
        } else {
            Ok(None)
        }
    }

    pub async fn delete_project(&self, id: i32) -> Result<i32, DbErr> {
        let db = self.db_manager.get_connection();
        let result = ProjectEntity::delete_by_id(id)
            .exec(db)
            .await?;
        Ok(result.rows_affected as i32)
    }

    pub async fn toggle_project_star(&self, id: i32) -> Result<i32, DbErr> {
        let db = self.db_manager.get_connection();
        
        let project = ProjectEntity::find_by_id(id)
            .one(db)
            .await?;

        if let Some(project_model) = project {
            let starred = project_model.starred;
            let mut project_active: ProjectActiveModel = project_model.into();
            project_active.starred = Set(!starred);
            project_active.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
            
            project_active.update(db).await?;
            Ok(id)
        } else {
            Err(DbErr::RecordNotFound("Project not found".to_string()))
        }
    }

    pub async fn get_projects_with_filters(
        &self,
        framework_filter: Option<String>,
        sort_by: String,
        search_query: Option<String>,
    ) -> Result<Vec<ProjectModel>, DbErr> {
        let db = self.db_manager.get_connection();
        
        let mut projects = ProjectEntity::find().all(db).await?;

        // Apply framework filter
        if let Some(framework) = framework_filter {
            projects = projects.into_iter()
                .filter(|p| p.framework.as_ref().map_or(false, |f| f == &framework))
                .collect();
        }

        // Apply search query
        if let Some(query_str) = search_query {
            let query_lower = query_str.to_lowercase();
            projects = projects.into_iter()
                .filter(|p| {
                    p.name.to_lowercase().contains(&query_lower) ||
                    p.path.to_lowercase().contains(&query_lower)
                })
                .collect();
        }

        // Apply sorting
        projects.sort_by(|a, b| {
            match sort_by.as_str() {
                "name" => a.name.cmp(&b.name),
                "name_desc" => b.name.cmp(&a.name),
                "path" => a.path.cmp(&b.path),
                "created_at" => b.created_at.unwrap_or_default().cmp(&a.created_at.unwrap_or_default()),
                "starred" => b.starred.cmp(&a.starred),
                _ => a.name.cmp(&b.name),
            }
        });

        Ok(projects)
    }

    pub async fn get_frameworks(&self) -> Result<Vec<String>, DbErr> {
        let db = self.db_manager.get_connection();
        let all_projects = ProjectEntity::find().all(db).await?;
        
        let mut frameworks: Vec<String> = all_projects.into_iter()
            .filter_map(|p| p.framework)
            .collect();
        
        frameworks.sort();
        frameworks.dedup();
        Ok(frameworks)
    }

    pub async fn validate_project_path(&self, path: &str) -> Result<bool, DbErr> {
        // Check if path exists and is a directory
        let path_obj = Path::new(path);
        if !path_obj.exists() || !path_obj.is_dir() {
            return Ok(false);
        }

        // Check if path is already in use by another project
        let db = self.db_manager.get_connection();
        let all_projects = ProjectEntity::find().all(db).await?;
        let existing_project = all_projects.into_iter().find(|p| p.path == path);

        Ok(existing_project.is_none())
    }

    pub async fn generate_project_name(&self, path: &str) -> Result<String, DbErr> {
        let path_obj = Path::new(path);
        let name = path_obj
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown Project")
            .to_string();
        
        Ok(name)
    }

    pub async fn detect_framework(&self, path: &str) -> Result<Option<String>, DbErr> {
        let path_obj = Path::new(path);
        
        // Check for common framework indicators
        let framework_indicators = [
            ("package.json", "Node.js"),
            ("requirements.txt", "Python"),
            ("pom.xml", "Java/Maven"),
            ("build.gradle", "Java/Gradle"),
            ("Cargo.toml", "Rust"),
            ("go.mod", "Go"),
            ("composer.json", "PHP"),
            ("Gemfile", "Ruby"),
            ("angular.json", "Angular"),
            ("vue.config.js", "Vue.js"),
            ("next.config.js", "Next.js"),
            ("nuxt.config.js", "Nuxt.js"),
            ("svelte.config.js", "Svelte"),
            ("vite.config.js", "Vite"),
            ("webpack.config.js", "Webpack"),
            ("tsconfig.json", "TypeScript"),
            ("Dockerfile", "Docker"),
            ("docker-compose.yml", "Docker Compose"),
        ];

        for (file, framework) in framework_indicators.iter() {
            if path_obj.join(file).exists() {
                return Ok(Some((*framework).to_string()));
            }
        }

        // Check for framework-specific directories
        let framework_dirs = [
            ("node_modules", "Node.js"),
            ("vendor", "PHP"),
            ("target", "Java/Maven"),
            ("build", "Java/Gradle"),
            ("dist", "Build Output"),
            ("public", "Web Assets"),
            ("src", "Source Code"),
        ];

        for (dir, framework) in framework_dirs.iter() {
            if path_obj.join(dir).exists() {
                return Ok(Some((*framework).to_string()));
            }
        }

        Ok(None)
    }
}
