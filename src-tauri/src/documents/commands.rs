use tauri::command;
use crate::documents::services::DocumentService;
use crate::database::DatabaseManager;

#[command]
pub async fn get_all_documents(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::documents::entities::DocumentModel>, String> {
    let service = DocumentService::new(&db_manager);
    service.get_all_documents().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_document(
    id: i32,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::documents::entities::DocumentModel>, String> {
    let service = DocumentService::new(&db_manager);
    service.get_document(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_document_by_uuid(
    uuid: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::documents::entities::DocumentModel>, String> {
    let service = DocumentService::new(&db_manager);
    service.get_document_by_uuid(&uuid).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_documents_by_project(
    project_id: i32,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::documents::entities::DocumentModel>, String> {
    let service = DocumentService::new(&db_manager);
    service.get_documents_by_project(project_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_documents_by_deployment(
    deployment_id: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::documents::entities::DocumentModel>, String> {
    let service = DocumentService::new(&db_manager);
    service.get_documents_by_deployment(&deployment_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn create_document(
    title: String,
    content: String,
    project_id: Option<i32>,
    deployment_id: Option<String>,
    tags: Option<Vec<String>>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::documents::entities::DocumentModel, String> {
    let service = DocumentService::new(&db_manager);
    service.create_document(title, content, project_id, deployment_id, tags).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_draft(
    id: i32,
    content_draft: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::documents::entities::DocumentModel>, String> {
    let service = DocumentService::new(&db_manager);
    service.update_draft(id, content_draft).await.map_err(|e| e.to_string())
}

#[command]
pub async fn save_document(
    id: i32,
    title: Option<String>,
    content: Option<String>,
    tags: Option<Vec<String>>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::documents::entities::DocumentModel>, String> {
    let service = DocumentService::new(&db_manager);
    service.save_document(id, title, content, tags).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_document_metadata(
    id: i32,
    title: Option<String>,
    project_id: Option<i32>,
    deployment_id: Option<String>,
    tags: Option<Vec<String>>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::documents::entities::DocumentModel>, String> {
    let service = DocumentService::new(&db_manager);
    service.update_metadata(id, title, project_id, deployment_id, tags).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_document(
    id: i32,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<bool, String> {
    let service = DocumentService::new(&db_manager);
    service.delete_document(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn open_document_in_new_window(
    document_id: i32,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::documents::entities::DocumentModel, String> {
    let service = DocumentService::new(&db_manager);
    service.get_document(document_id).await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Document not found".to_string())
}

#[command]
pub async fn search_documents(
    query: String,
    project_id: Option<i32>,
    tags: Option<Vec<String>>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::documents::entities::DocumentModel>, String> {
    let service = DocumentService::new(&db_manager);
    service.search_documents(&query, project_id, tags).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_document_stats(db_manager: tauri::State<'_, DatabaseManager>) -> Result<serde_json::Value, String> {
    let service = DocumentService::new(&db_manager);
    let stats = service.get_document_stats().await.map_err(|e| e.to_string())?;
    
    // Convert to serializable format
    let result = serde_json::json!({
        "total": stats.total,
        "drafts": stats.drafts,
        "linked_to_projects": stats.linked_to_projects,
        "linked_to_deployments": stats.linked_to_deployments,
    });
    
    Ok(result)
}
