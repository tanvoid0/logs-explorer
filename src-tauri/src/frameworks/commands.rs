use tauri::command;
use crate::database::DatabaseManager;
use crate::frameworks::services::{FrameworkService, FrameworkDetectionService};

// Framework commands

#[command]
pub async fn get_all_frameworks(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::frameworks::entities::FrameworkModel>, String> {
    let service = FrameworkService::new(&db_manager);
    service.get_all_frameworks().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_active_frameworks(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::frameworks::entities::FrameworkModel>, String> {
    let service = FrameworkService::new(&db_manager);
    service.get_active_frameworks().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_framework(id: i32, db_manager: tauri::State<'_, DatabaseManager>) -> Result<Option<crate::frameworks::entities::FrameworkModel>, String> {
    let service = FrameworkService::new(&db_manager);
    service.get_framework(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_framework_by_name(name: String, db_manager: tauri::State<'_, DatabaseManager>) -> Result<Option<crate::frameworks::entities::FrameworkModel>, String> {
    let service = FrameworkService::new(&db_manager);
    service.get_framework_by_name(&name).await.map_err(|e| e.to_string())
}

#[command]
pub async fn create_framework(
    name: String,
    category: String,
    description: Option<String>,
    version: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::frameworks::entities::FrameworkModel, String> {
    let service = FrameworkService::new(&db_manager);
    service.create_framework(name, category, description, version).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_framework(
    id: i32,
    name: String,
    category: String,
    description: Option<String>,
    version: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::frameworks::entities::FrameworkModel>, String> {
    let service = FrameworkService::new(&db_manager);
    service.update_framework(id, name, category, description, version).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_framework(id: i32, db_manager: tauri::State<'_, DatabaseManager>) -> Result<bool, String> {
    let service = FrameworkService::new(&db_manager);
    service.delete_framework(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn toggle_framework_active(id: i32, db_manager: tauri::State<'_, DatabaseManager>) -> Result<Option<crate::frameworks::entities::FrameworkModel>, String> {
    let service = FrameworkService::new(&db_manager);
    service.toggle_framework_active(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_frameworks_by_category(category: String, db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::frameworks::entities::FrameworkModel>, String> {
    let service = FrameworkService::new(&db_manager);
    service.get_frameworks_by_category(&category).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_framework_categories(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<String>, String> {
    let service = FrameworkService::new(&db_manager);
    service.get_framework_categories().await.map_err(|e| e.to_string())
}

#[command]
pub async fn search_frameworks(query: String, db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::frameworks::entities::FrameworkModel>, String> {
    let service = FrameworkService::new(&db_manager);
    service.search_frameworks(&query).await.map_err(|e| e.to_string())
}

// Framework Detection commands

#[command]
pub async fn get_all_framework_detections(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::frameworks::entities::FrameworkDetectionModel>, String> {
    let service = FrameworkDetectionService::new(&db_manager);
    service.get_all_framework_detections().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_framework_detections_by_project_path(project_path: String, db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::frameworks::entities::FrameworkDetectionModel>, String> {
    let service = FrameworkDetectionService::new(&db_manager);
    service.get_framework_detections_by_project_path(&project_path).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_framework_detections_by_framework(framework_id: i32, db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::frameworks::entities::FrameworkDetectionModel>, String> {
    let service = FrameworkDetectionService::new(&db_manager);
    service.get_framework_detections_by_framework(framework_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn create_framework_detection(
    project_path: String,
    framework_id: i32,
    confidence_score: f64,
    detected_files: Vec<String>,
    metadata: Option<serde_json::Value>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::frameworks::entities::FrameworkDetectionModel, String> {
    let service = FrameworkDetectionService::new(&db_manager);
    service.create_framework_detection(project_path, framework_id, confidence_score, detected_files, metadata).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_framework_detection(
    id: i32,
    confidence_score: f64,
    detected_files: Vec<String>,
    metadata: Option<serde_json::Value>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::frameworks::entities::FrameworkDetectionModel>, String> {
    let service = FrameworkDetectionService::new(&db_manager);
    service.update_framework_detection(id, confidence_score, detected_files, metadata).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_framework_detection(id: i32, db_manager: tauri::State<'_, DatabaseManager>) -> Result<bool, String> {
    let service = FrameworkDetectionService::new(&db_manager);
    service.delete_framework_detection(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_detection_stats(db_manager: tauri::State<'_, DatabaseManager>) -> Result<serde_json::Value, String> {
    let service = FrameworkDetectionService::new(&db_manager);
    service.get_detection_stats().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_high_confidence_framework_detections(threshold: f64, db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::frameworks::entities::FrameworkDetectionModel>, String> {
    let service = FrameworkDetectionService::new(&db_manager);
    service.get_high_confidence_framework_detections(threshold).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_recent_framework_detections(limit: i32, db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::frameworks::entities::FrameworkDetectionModel>, String> {
    let service = FrameworkDetectionService::new(&db_manager);
    service.get_recent_framework_detections(limit).await.map_err(|e| e.to_string())
}
