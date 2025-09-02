use crate::tasks::entities::TaskGroupModel;
use crate::tasks::repositories::TaskGroupRepository;
use crate::database::DatabaseManager;

/// Service for handling task group-related business logic
pub struct TaskGroupService {
    repository: TaskGroupRepository,
}

impl TaskGroupService {
    pub fn new(db_manager: &DatabaseManager) -> Self {
        let repository = TaskGroupRepository::new(db_manager.get_connection_clone());
        Self { repository }
    }

    /// Get all task groups
    pub async fn get_all_task_groups(&self) -> Result<Vec<TaskGroupModel>, sea_orm::DbErr> {
        self.repository.get_all().await
    }

    /// Get task groups by resource
    pub async fn get_task_groups_by_resource(
        &self,
        resource_type: &str,
        resource_id: &str,
    ) -> Result<Vec<TaskGroupModel>, sea_orm::DbErr> {
        self.repository.get_by_resource(resource_type, resource_id).await
    }

    /// Create a new task group
    pub async fn create_task_group(
        &self,
        name: String,
        description: Option<String>,
        color: String,
        resource_link_type: Option<String>,
        resource_link_id: Option<String>,
        resource_link_name: Option<String>,
    ) -> Result<TaskGroupModel, sea_orm::DbErr> {
        self.repository.create(name, description, color, resource_link_type, resource_link_id, resource_link_name).await
    }

    /// Update an existing task group
    pub async fn update_task_group(
        &self,
        uuid: &str,
        name: String,
        description: Option<String>,
        color: String,
    ) -> Result<Option<TaskGroupModel>, sea_orm::DbErr> {
        self.repository.update(uuid, name, description, color).await
    }

    /// Delete a task group
    pub async fn delete_task_group(&self, uuid: &str) -> Result<bool, sea_orm::DbErr> {
        self.repository.delete(uuid).await
    }

    /// Link a task group to a resource
    pub async fn link_to_resource(
        &self,
        uuid: &str,
        resource_type: String,
        resource_id: String,
        resource_name: String,
    ) -> Result<Option<TaskGroupModel>, sea_orm::DbErr> {
        self.repository.link_to_resource(uuid, resource_type, resource_id, resource_name).await
    }

    /// Unlink a task group from its resource
    pub async fn unlink_from_resource(&self, uuid: &str) -> Result<Option<TaskGroupModel>, sea_orm::DbErr> {
        self.repository.unlink_from_resource(uuid).await
    }
}
