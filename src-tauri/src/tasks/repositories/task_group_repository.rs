use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, DatabaseConnection};
use chrono::Utc;
use uuid::Uuid;

use crate::tasks::entities::{TaskGroupEntity, TaskGroupModel, TaskGroupActiveModel, TaskGroupColumn};

/// Repository for task group database operations
pub struct TaskGroupRepository {
    conn: DatabaseConnection,
}

impl TaskGroupRepository {
    pub fn new(conn: DatabaseConnection) -> Self {
        Self { conn }
    }

    /// Get all task groups
    pub async fn get_all(&self) -> Result<Vec<TaskGroupModel>, sea_orm::DbErr> {
        TaskGroupEntity::find().all(&self.conn).await
    }

    /// Get task groups by resource
    pub async fn get_by_resource(
        &self,
        resource_type: &str,
        resource_id: &str,
    ) -> Result<Vec<TaskGroupModel>, sea_orm::DbErr> {
        TaskGroupEntity::find()
            .filter(TaskGroupColumn::ResourceLinkType.eq(resource_type))
            .filter(TaskGroupColumn::ResourceLinkId.eq(resource_id))
            .all(&self.conn)
            .await
    }

    /// Create a new task group
    pub async fn create(
        &self,
        name: String,
        description: Option<String>,
        color: String,
        resource_link_type: Option<String>,
        resource_link_id: Option<String>,
        resource_link_name: Option<String>,
    ) -> Result<TaskGroupModel, sea_orm::DbErr> {
        let group = TaskGroupActiveModel {
            id: sea_orm::ActiveValue::NotSet,
            uuid: sea_orm::ActiveValue::Set(Uuid::new_v4().to_string()),
            name: sea_orm::ActiveValue::Set(name),
            description: sea_orm::ActiveValue::Set(description),
            color: sea_orm::ActiveValue::Set(color),
            resource_link_type: sea_orm::ActiveValue::Set(resource_link_type),
            resource_link_id: sea_orm::ActiveValue::Set(resource_link_id),
            resource_link_name: sea_orm::ActiveValue::Set(resource_link_name),
            linked_at: sea_orm::ActiveValue::Set(Some(Utc::now().naive_utc())),
            created_at: sea_orm::ActiveValue::Set(Some(Utc::now().naive_utc())),
            updated_at: sea_orm::ActiveValue::Set(Some(Utc::now().naive_utc())),
        };

        group.insert(&self.conn).await
    }

    /// Update an existing task group
    pub async fn update(
        &self,
        uuid: &str,
        name: String,
        description: Option<String>,
        color: String,
    ) -> Result<Option<TaskGroupModel>, sea_orm::DbErr> {
        let group = TaskGroupEntity::find()
            .filter(TaskGroupColumn::Uuid.eq(uuid))
            .one(&self.conn)
            .await?;

        if let Some(group) = group {
            let mut group: TaskGroupActiveModel = group.into();
            group.name = Set(name);
            group.description = Set(description);
            group.color = Set(color);
            group.updated_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(group.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }

    /// Delete a task group
    pub async fn delete(&self, uuid: &str) -> Result<bool, sea_orm::DbErr> {
        let result = TaskGroupEntity::delete_many()
            .filter(TaskGroupColumn::Uuid.eq(uuid))
            .exec(&self.conn)
            .await?;
        
        Ok(result.rows_affected > 0)
    }

    /// Link a task group to a resource
    pub async fn link_to_resource(
        &self,
        uuid: &str,
        resource_type: String,
        resource_id: String,
        resource_name: String,
    ) -> Result<Option<TaskGroupModel>, sea_orm::DbErr> {
        let group = TaskGroupEntity::find()
            .filter(TaskGroupColumn::Uuid.eq(uuid))
            .one(&self.conn)
            .await?;

        if let Some(group) = group {
            let mut group: TaskGroupActiveModel = group.into();
            group.resource_link_type = Set(Some(resource_type));
            group.resource_link_id = Set(Some(resource_id));
            group.resource_link_name = Set(Some(resource_name));
            group.linked_at = Set(Some(Utc::now().naive_utc()));
            group.updated_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(group.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }

    /// Unlink a task group from its resource
    pub async fn unlink_from_resource(&self, uuid: &str) -> Result<Option<TaskGroupModel>, sea_orm::DbErr> {
        let group = TaskGroupEntity::find()
            .filter(TaskGroupColumn::Uuid.eq(uuid))
            .one(&self.conn)
            .await?;

        if let Some(group) = group {
            let mut group: TaskGroupActiveModel = group.into();
            group.resource_link_type = Set(None);
            group.resource_link_id = Set(None);
            group.resource_link_name = Set(None);
            group.linked_at = Set(None);
            group.updated_at = Set(Some(Utc::now().naive_utc()));
            
            Ok(Some(group.update(&self.conn).await?))
        } else {
            Ok(None)
        }
    }
}
