use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, QueryOrder};
use chrono::Utc;
use crate::tasks::entities::task_group;

pub struct TaskGroupRepository {
    conn: sea_orm::DatabaseConnection,
}

impl TaskGroupRepository {
    pub fn new(conn: sea_orm::DatabaseConnection) -> Self {
        Self { conn }
    }
    
    pub async fn get_all(&self) -> Result<Vec<task_group::Model>, sea_orm::DbErr> {
        task_group::Entity::find()
            .order_by_desc(task_group::Column::CreatedAt)
            .all(&self.conn)
            .await
    }
    
    pub async fn get_by_resource(&self, resource_type: &str, resource_id: &str) -> Result<Vec<task_group::Model>, sea_orm::DbErr> {
        task_group::Entity::find()
            .filter(task_group::Column::ResourceLinkType.eq(resource_type))
            .filter(task_group::Column::ResourceLinkId.eq(resource_id))
            .order_by_desc(task_group::Column::CreatedAt)
            .all(&self.conn)
            .await
    }
    
    pub async fn add(&self, group: task_group::ActiveModel) -> Result<task_group::Model, sea_orm::DbErr> {
        group.insert(&self.conn).await
    }
    
    pub async fn update(&self, uuid: &str, name: &str, description: Option<&str>, color: &str) -> Result<Option<task_group::Model>, sea_orm::DbErr> {
        let group = task_group::Entity::find()
            .filter(task_group::Column::Uuid.eq(uuid))
            .one(&self.conn)
            .await?;
            
        if let Some(group) = group {
            let mut group: task_group::ActiveModel = group.into();
            group.name = Set(name.to_string());
            group.description = Set(description.map(|s| s.to_string()));
            group.color = Set(color.to_string());
            group.updated_at = Set(Some(Utc::now().naive_utc()));
            group.update(&self.conn).await.map(Some)
        } else {
            Ok(None)
        }
    }
    
    pub async fn delete(&self, uuid: &str) -> Result<bool, sea_orm::DbErr> {
        let result = task_group::Entity::delete_many()
            .filter(task_group::Column::Uuid.eq(uuid))
            .exec(&self.conn)
            .await?;
        Ok(result.rows_affected > 0)
    }
    
    pub async fn link_to_resource(&self, uuid: &str, resource_type: &str, resource_id: &str, resource_name: &str) -> Result<Option<task_group::Model>, sea_orm::DbErr> {
        let group = task_group::Entity::find()
            .filter(task_group::Column::Uuid.eq(uuid))
            .one(&self.conn)
            .await?;
            
        if let Some(group) = group {
            let mut group: task_group::ActiveModel = group.into();
            group.resource_link_type = Set(Some(resource_type.to_string()));
            group.resource_link_id = Set(Some(resource_id.to_string()));
            group.resource_link_name = Set(Some(resource_name.to_string()));
            group.linked_at = Set(Some(Utc::now().naive_utc()));
            group.updated_at = Set(Some(Utc::now().naive_utc()));
            group.update(&self.conn).await.map(Some)
        } else {
            Ok(None)
        }
    }
    
    pub async fn unlink(&self, uuid: &str) -> Result<Option<task_group::Model>, sea_orm::DbErr> {
        let group = task_group::Entity::find()
            .filter(task_group::Column::Uuid.eq(uuid))
            .one(&self.conn)
            .await?;
            
        if let Some(group) = group {
            let mut group: task_group::ActiveModel = group.into();
            group.resource_link_type = Set(None);
            group.resource_link_id = Set(None);
            group.resource_link_name = Set(None);
            group.linked_at = Set(None);
            group.updated_at = Set(Some(Utc::now().naive_utc()));
            group.update(&self.conn).await.map(Some)
        } else {
            Ok(None)
        }
    }
}
