use crate::frameworks::entities::FrameworkModel;
use crate::frameworks::repositories::FrameworkRepository;
use crate::database::DatabaseManager;

/// Service for handling framework-related business logic
pub struct FrameworkService {
    repository: FrameworkRepository,
}

impl FrameworkService {
    pub fn new(db_manager: &DatabaseManager) -> Self {
        let repository = FrameworkRepository::new(db_manager.get_connection_clone());
        Self { repository }
    }

    /// Get all frameworks
    pub async fn get_all_frameworks(&self) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        self.repository.get_all().await
    }

    /// Get active frameworks
    pub async fn get_active_frameworks(&self) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        self.repository.get_active().await
    }

    /// Get a framework by ID
    pub async fn get_framework(&self, id: i32) -> Result<Option<FrameworkModel>, sea_orm::DbErr> {
        self.repository.get_by_id(id).await
    }

    /// Get a framework by name
    pub async fn get_framework_by_name(&self, name: &str) -> Result<Option<FrameworkModel>, sea_orm::DbErr> {
        self.repository.get_by_name(name).await
    }

    /// Create a new framework
    pub async fn create_framework(
        &self,
        name: String,
        category: String,
        description: Option<String>,
        version: Option<String>,
    ) -> Result<FrameworkModel, sea_orm::DbErr> {
        self.repository.create(name, category, description, version).await
    }

    /// Update an existing framework
    pub async fn update_framework(
        &self,
        id: i32,
        name: String,
        category: String,
        description: Option<String>,
        version: Option<String>,
    ) -> Result<Option<FrameworkModel>, sea_orm::DbErr> {
        self.repository.update(id, name, category, description, version).await
    }

    /// Delete a framework
    pub async fn delete_framework(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        self.repository.delete(id).await
    }

    /// Toggle framework active status
    pub async fn toggle_framework_active(&self, id: i32) -> Result<Option<FrameworkModel>, sea_orm::DbErr> {
        self.repository.toggle_active(id).await
    }

    /// Get frameworks by category
    pub async fn get_frameworks_by_category(&self, category: &str) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        self.repository.get_by_category(category).await
    }

    /// Get unique framework categories
    pub async fn get_framework_categories(&self) -> Result<Vec<String>, sea_orm::DbErr> {
        self.repository.get_categories().await
    }

    /// Search frameworks
    pub async fn search_frameworks(&self, query: &str) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        self.repository.search(query).await
    }
}
