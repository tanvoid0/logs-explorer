use chrono::{DateTime, Utc};
use uuid::Uuid;
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait};

use crate::tasks::entities::{TaskModel, TaskActiveModel, TaskColumn, TaskEntity};
use crate::tasks::repositories::TaskRepository;
use crate::database::DatabaseManager;

/// Service for handling task-related business logic
pub struct TaskService {
    db_manager: DatabaseManager,
}

impl TaskService {
    pub fn new(db_manager: &DatabaseManager) -> Self {
        Self { db_manager: db_manager.clone() }
    }

    /// Get all tasks
    pub async fn get_all_tasks(&self) -> Result<Vec<TaskModel>, sea_orm::DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repository = TaskRepository::new(conn);
        repository.get_all().await
    }

    /// Get tasks by group ID
    pub async fn get_tasks_by_group(&self, group_id: &str) -> Result<Vec<TaskModel>, sea_orm::DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repository = TaskRepository::new(conn);
        repository.get_by_group(group_id).await
    }

    /// Get subtasks for a parent task
    pub async fn get_subtasks(&self, parent_id: &str) -> Result<Vec<TaskModel>, sea_orm::DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repository = TaskRepository::new(conn);
        repository.get_subtasks(parent_id).await
    }

    /// Create a new task
    pub async fn create_task(
        &self,
        title: String,
        description: Option<String>,
        status: String,
        priority: String,
        due_date: Option<DateTime<Utc>>,
        parent_id: Option<String>,
        group_id: Option<String>,
    ) -> Result<TaskModel, sea_orm::DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repository = TaskRepository::new(conn);
        
        let now = Utc::now().naive_utc();
        let task = TaskActiveModel {
            uuid: sea_orm::Set(Uuid::new_v4().to_string()),
            title: sea_orm::Set(title),
            description: sea_orm::Set(description),
            status: sea_orm::Set(status),
            priority: sea_orm::Set(priority),
            due_date: sea_orm::Set(due_date.map(|dt| dt.naive_utc())),
            parent_id: sea_orm::Set(parent_id),
            group_id: sea_orm::Set(group_id),
            created_at: sea_orm::Set(Some(now)),
            updated_at: sea_orm::Set(Some(now)),
            ..Default::default()
        };
        
        repository.add(task).await
    }

    /// Update an existing task
    pub async fn update_task(
        &self,
        uuid: &str,
        title: String,
        description: Option<String>,
        status: String,
        priority: String,
        due_date: Option<DateTime<Utc>>,
    ) -> Result<Option<TaskModel>, sea_orm::DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repository = TaskRepository::new(conn);
        
        repository.update(
            uuid,
            &title,
            description.as_deref(),
            &status,
            &priority,
            due_date.map(|dt| dt.naive_utc())
        ).await
    }

    /// Delete a task
    pub async fn delete_task(&self, uuid: &str) -> Result<bool, sea_orm::DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repository = TaskRepository::new(conn);
        repository.delete(uuid).await
    }

    /// Delete all tasks in a group
    pub async fn delete_tasks_by_group(&self, group_id: &str) -> Result<u64, sea_orm::DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repository = TaskRepository::new(conn);
        repository.delete_by_group(group_id).await
    }

    /// Toggle task status
    pub async fn toggle_status(&self, uuid: &str) -> Result<Option<TaskModel>, sea_orm::DbErr> {
        let conn = self.db_manager.get_connection_clone();
        
        // First get the current task
        let task = TaskEntity::find()
            .filter(TaskColumn::Uuid.eq(uuid))
            .one(&conn)
            .await?;
            
        if let Some(task) = task {
            let new_status = if task.status == "completed" { "pending" } else { "completed" };
            let repository = TaskRepository::new(conn);
            repository.update(
                uuid,
                &task.title,
                task.description.as_deref(),
                &new_status,
                &task.priority,
                task.due_date
            ).await
        } else {
            Ok(None)
        }
    }

    /// Toggle task status (alias for toggle_status)
    pub async fn toggle_task_status(&self, uuid: &str) -> Result<Option<TaskModel>, sea_orm::DbErr> {
        self.toggle_status(uuid).await
    }

    /// Move task to a different group
    pub async fn move_task(&self, uuid: &str, group_id: &str) -> Result<Option<TaskModel>, sea_orm::DbErr> {
        let conn = self.db_manager.get_connection_clone();
        let repository = TaskRepository::new(conn);
        repository.update_group(uuid, group_id).await
    }
}
