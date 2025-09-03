use sea_orm::{Database, DatabaseConnection};
use sea_orm_migration::prelude::*;
use tauri::AppHandle;

#[derive(Clone)]
pub struct DatabaseManager {
    conn: DatabaseConnection,
}

impl DatabaseManager {
    pub async fn new(_app_handle: &AppHandle) -> Result<Self, sea_orm::DbErr> {
        // Use a path outside src-tauri to avoid file watching issues
        let app_dir = std::env::current_dir()
            .expect("Failed to get current directory")
            .parent()
            .expect("Failed to get parent directory")
            .join("data");
        std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");
        
        let db_path = app_dir.join("logs-explorer.db");
        let database_url = format!("sqlite://{}?mode=rwc", db_path.display());
        
        let conn = Database::connect(&database_url).await?;
        
        // Run migrations to ensure database schema is up to date
        Self::run_migrations(&conn).await?;
        
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

    async fn run_migrations(conn: &DatabaseConnection) -> Result<(), sea_orm::DbErr> {
        // Run all migrations using the generated registry
        let migrations = crate::migrations::get_migrations();
        
        // Create a schema manager for running migrations
        let schema_manager = sea_orm_migration::SchemaManager::new(conn);
        
        for migration in migrations {
            migration.up(&schema_manager).await?;
        }
        Ok(())
    }
}
