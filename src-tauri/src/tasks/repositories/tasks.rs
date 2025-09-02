use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, QueryOrder};
use chrono::{Utc, NaiveDateTime};
use crate::tasks::entities::task;

pub struct TaskRepository {
    conn: sea_orm::DatabaseConnection,
}

impl TaskRepository {
    pub fn new(conn: sea_orm::DatabaseConnection) -> Self {
        Self { conn }
    }
    
    pub async fn get_all(&self) -> Result<Vec<task::Model>, sea_orm::DbErr> {
        task::Entity::find()
            .order_by_desc(task::Column::CreatedAt)
            .all(&self.conn)
            .await
    }
    
    pub async fn get_by_group(&self, group_id: &str) -> Result<Vec<task::Model>, sea_orm::DbErr> {
        task::Entity::find()
            .filter(task::Column::GroupId.eq(group_id))
            .order_by_desc(task::Column::CreatedAt)
            .all(&self.conn)
            .await
    }
    
    pub async fn get_subtasks(&self, parent_id: &str) -> Result<Vec<task::Model>, sea_orm::DbErr> {
        task::Entity::find()
            .filter(task::Column::ParentId.eq(parent_id))
            .order_by_desc(task::Column::CreatedAt)
            .all(&self.conn)
            .await
    }
    
    pub async fn add(&self, task: task::ActiveModel) -> Result<task::Model, sea_orm::DbErr> {
        task.insert(&self.conn).await
    }
    
    pub async fn update(&self, uuid: &str, title: &str, description: Option<&str>, status: &str, priority: &str, due_date: Option<NaiveDateTime>) -> Result<Option<task::Model>, sea_orm::DbErr> {
        let task = task::Entity::find()
            .filter(task::Column::Uuid.eq(uuid))
            .one(&self.conn)
            .await?;
            
        if let Some(task) = task {
            let mut task: task::ActiveModel = task.into();
            task.title = Set(title.to_string());
            task.description = Set(description.map(|s| s.to_string()));
            task.status = Set(status.to_string());
            task.priority = Set(priority.to_string());
            task.due_date = Set(due_date);
            task.updated_at = Set(Some(Utc::now().naive_utc()));
            task.update(&self.conn).await.map(Some)
        } else {
            Ok(None)
        }
    }
    
    pub async fn delete(&self, uuid: &str) -> Result<bool, sea_orm::DbErr> {
        let result = task::Entity::delete_many()
            .filter(task::Column::Uuid.eq(uuid))
            .exec(&self.conn)
            .await?;
        Ok(result.rows_affected > 0)
    }
    
    pub async fn delete_by_group(&self, group_id: &str) -> Result<u64, sea_orm::DbErr> {
        let result = task::Entity::delete_many()
            .filter(task::Column::GroupId.eq(group_id))
            .exec(&self.conn)
            .await?;
        Ok(result.rows_affected)
    }

    pub async fn update_group(&self, uuid: &str, group_id: &str) -> Result<Option<task::Model>, sea_orm::DbErr> {
        let task = task::Entity::find()
            .filter(task::Column::Uuid.eq(uuid))
            .one(&self.conn)
            .await?;
            
        if let Some(task) = task {
            let mut task: task::ActiveModel = task.into();
            task.group_id = Set(Some(group_id.to_string()));
            task.updated_at = Set(Some(Utc::now().naive_utc()));
            task.update(&self.conn).await.map(Some)
        } else {
            Ok(None)
        }
    }
}
