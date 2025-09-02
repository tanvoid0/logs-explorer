use tauri::command;
use crate::tasks::services::{TaskService, TaskGroupService};
use crate::database::DatabaseManager;

#[command]
pub async fn get_all_task_groups(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::tasks::entities::TaskGroupModel>, String> {
    let service = TaskGroupService::new(&db_manager);
    service.get_all_task_groups().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_task_groups_by_resource(
    resource_type: String,
    resource_id: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::tasks::entities::TaskGroupModel>, String> {
    let service = TaskGroupService::new(&db_manager);
    service.get_task_groups_by_resource(&resource_type, &resource_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn add_task_group(
    name: String,
    description: Option<String>,
    color: String,
    resource_link_type: Option<String>,
    resource_link_id: Option<String>,
    resource_link_name: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::tasks::entities::TaskGroupModel, String> {
    let service = TaskGroupService::new(&db_manager);
    service.create_task_group(name, description, color, resource_link_type, resource_link_id, resource_link_name).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_task_group(
    uuid: String,
    name: String,
    description: Option<String>,
    color: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskGroupModel>, String> {
    let service = TaskGroupService::new(&db_manager);
    service.update_task_group(&uuid, name, description, color).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_task_group(
    uuid: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<bool, String> {
    let service = TaskGroupService::new(&db_manager);
    service.delete_task_group(&uuid).await.map_err(|e| e.to_string())
}

#[command]
pub async fn link_task_group_to_resource(
    uuid: String,
    resource_type: String,
    resource_id: String,
    resource_name: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskGroupModel>, String> {
    let service = TaskGroupService::new(&db_manager);
    service.link_to_resource(&uuid, resource_type, resource_id, resource_name).await.map_err(|e| e.to_string())
}

#[command]
pub async fn unlink_task_group(
    uuid: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskGroupModel>, String> {
    let service = TaskGroupService::new(&db_manager);
    service.unlink_from_resource(&uuid).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_all_tasks(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    service.get_all_tasks().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_tasks_by_group(
    group_id: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    service.get_tasks_by_group(&group_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_subtasks(
    parent_id: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    service.get_subtasks(&parent_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn add_task(
    group_id: String,
    title: String,
    description: Option<String>,
    status: String,
    priority: String,
    due_date: Option<chrono::NaiveDateTime>,
    parent_id: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::tasks::entities::TaskModel, String> {
    let service = TaskService::new(&db_manager);
    let due_date_utc = due_date.map(|dt| chrono::DateTime::from_naive_utc_and_offset(dt, chrono::Utc));
    service.create_task(title, description, status, priority, due_date_utc, parent_id, Some(group_id)).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_task(
    uuid: String,
    title: String,
    description: Option<String>,
    status: String,
    priority: String,
    due_date: Option<chrono::NaiveDateTime>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    let due_date_utc = due_date.map(|dt| chrono::DateTime::from_naive_utc_and_offset(dt, chrono::Utc));
    service.update_task(&uuid, title, description, status, priority, due_date_utc).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_task(
    uuid: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<bool, String> {
    let service = TaskService::new(&db_manager);
    service.delete_task(&uuid).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_tasks_by_group(
    group_id: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<u64, String> {
    let service = TaskService::new(&db_manager);
    service.delete_tasks_by_group(&group_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn toggle_task_status(
    uuid: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    service.toggle_task_status(&uuid).await.map_err(|e| e.to_string())
}

#[command]
pub async fn move_task(
    uuid: String,
    group_id: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    service.move_task(&uuid, &group_id).await.map_err(|e| e.to_string())
}
