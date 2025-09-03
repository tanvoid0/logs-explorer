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
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::tasks::entities::TaskGroupModel>, String> {
    let service = TaskGroupService::new(&db_manager);
    
    // Extract parameters from the request object
    let resource_type = request["resourceType"].as_str().ok_or("Missing resourceType")?.to_string();
    let resource_id = request["resourceId"].as_str().ok_or("Missing resourceId")?.to_string();
    
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
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskGroupModel>, String> {
    let service = TaskGroupService::new(&db_manager);
    
    // Extract parameters from the request object
    let uuid = request["uuid"].as_str().ok_or("Missing uuid")?.to_string();
    let name = request["name"].as_str().ok_or("Missing name")?.to_string();
    let description = request["description"].as_str().map(|s| s.to_string());
    let color = request["color"].as_str().ok_or("Missing color")?.to_string();
    
    service.update_task_group(&uuid, name, description, color).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_task_group(
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<bool, String> {
    let service = TaskGroupService::new(&db_manager);
    
    // Extract parameters from the request object
    let uuid = request["uuid"].as_str().ok_or("Missing uuid")?.to_string();
    
    service.delete_task_group(&uuid).await.map_err(|e| e.to_string())
}

#[command]
pub async fn link_task_group_to_resource(
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskGroupModel>, String> {
    let service = TaskGroupService::new(&db_manager);
    
    // Extract parameters from the request object
    let uuid = request["uuid"].as_str().ok_or("Missing uuid")?.to_string();
    let resource_type = request["resourceType"].as_str().ok_or("Missing resourceType")?.to_string();
    let resource_id = request["resourceId"].as_str().ok_or("Missing resourceId")?.to_string();
    let resource_name = request["resourceName"].as_str().ok_or("Missing resourceName")?.to_string();
    
    service.link_to_resource(&uuid, resource_type, resource_id, resource_name).await.map_err(|e| e.to_string())
}

#[command]
pub async fn unlink_task_group(
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskGroupModel>, String> {
    let service = TaskGroupService::new(&db_manager);
    
    // Extract parameters from the request object
    let uuid = request["uuid"].as_str().ok_or("Missing uuid")?.to_string();
    
    service.unlink_from_resource(&uuid).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_all_tasks(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    service.get_all_tasks().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_tasks_by_group(
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    
    // Extract parameters from the request object
    let group_id = request["groupId"].as_str().ok_or("Missing groupId")?.to_string();
    
    service.get_tasks_by_group(&group_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_subtasks(
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    
    // Extract parameters from the request object
    let parent_id = request["parentId"].as_str().ok_or("Missing parentId")?.to_string();
    
    service.get_subtasks(&parent_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn add_task(
    group_id: String,
    title: String,
    description: Option<String>,
    status: String,
    priority: String,
    due_date: Option<String>,
    parent_id: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::tasks::entities::TaskModel, String> {
    let service = TaskService::new(&db_manager);
    
    let due_date_utc = due_date
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
        .map(|dt| dt.naive_utc())
        .map(|dt| chrono::DateTime::from_naive_utc_and_offset(dt, chrono::Utc));
    
    service.create_task(title, description, status, priority, due_date_utc, parent_id, Some(group_id)).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_task(
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    
    // Extract parameters from the request object
    let uuid = request["uuid"].as_str().ok_or("Missing uuid")?.to_string();
    let title = request["title"].as_str().ok_or("Missing title")?.to_string();
    let description = request["description"].as_str().map(|s| s.to_string());
    let status = request["status"].as_str().ok_or("Missing status")?.to_string();
    let priority = request["priority"].as_str().ok_or("Missing priority")?.to_string();
    let due_date = request["dueDate"].as_str()
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.naive_utc());
    
    let due_date_utc = due_date.map(|dt| chrono::DateTime::from_naive_utc_and_offset(dt, chrono::Utc));
    service.update_task(&uuid, title, description, status, priority, due_date_utc).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_task(
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<bool, String> {
    let service = TaskService::new(&db_manager);
    
    // Extract parameters from the request object
    let uuid = request["uuid"].as_str().ok_or("Missing uuid")?.to_string();
    
    service.delete_task(&uuid).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_tasks_by_group(
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<u64, String> {
    let service = TaskService::new(&db_manager);
    
    // Extract parameters from the request object
    let group_id = request["groupId"].as_str().ok_or("Missing groupId")?.to_string();
    
    service.delete_tasks_by_group(&group_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn toggle_task_status(
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    
    // Extract parameters from the request object
    let uuid = request["uuid"].as_str().ok_or("Missing uuid")?.to_string();
    
    service.toggle_task_status(&uuid).await.map_err(|e| e.to_string())
}

#[command]
pub async fn move_task(
    request: serde_json::Value,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::tasks::entities::TaskModel>, String> {
    let service = TaskService::new(&db_manager);
    
    // Extract parameters from the request object
    let uuid = request["uuid"].as_str().ok_or("Missing uuid")?.to_string();
    let group_id = request["groupId"].as_str().ok_or("Missing groupId")?.to_string();
    
    service.move_task(&uuid, &group_id).await.map_err(|e| e.to_string())
}
