use tauri::command;
use crate::database::DatabaseManager;
use crate::frameworks::{FrameworkService, FrameworkDetectionService};

// Framework Management Commands
#[command]
pub async fn get_all_frameworks(app_handle: tauri::AppHandle) -> Result<Vec<crate::frameworks::Framework>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkService::new(db);
    service.get_all_frameworks().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_active_frameworks(app_handle: tauri::AppHandle) -> Result<Vec<crate::frameworks::Framework>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkService::new(db);
    service.get_active_frameworks().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_framework(app_handle: tauri::AppHandle, id: i32) -> Result<Option<crate::frameworks::Framework>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkService::new(db);
    service.get_framework(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_framework_by_name(app_handle: tauri::AppHandle, name: String) -> Result<Option<crate::frameworks::Framework>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkService::new(db);
    service.get_framework_by_name(&name).await.map_err(|e| e.to_string())
}

#[command]
pub async fn create_framework(
    app_handle: tauri::AppHandle, 
    name: String, 
    category: String, 
    description: Option<String>, 
    version: Option<String>, 
    website: Option<String>, 
    documentation_url: Option<String>
) -> Result<crate::frameworks::Framework, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkService::new(db);
    service.create_framework(name, category, description, version, website, documentation_url).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_framework(
    app_handle: tauri::AppHandle, 
    id: i32, 
    name: String, 
    category: String, 
    description: Option<String>, 
    version: Option<String>, 
    website: Option<String>, 
    documentation_url: Option<String>
) -> Result<Option<crate::frameworks::Framework>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkService::new(db);
    service.update_framework(id, name, category, description, version, website, documentation_url).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_framework(app_handle: tauri::AppHandle, id: i32) -> Result<bool, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkService::new(db);
    service.delete_framework(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn toggle_framework_active(app_handle: tauri::AppHandle, id: i32) -> Result<bool, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkService::new(db);
    service.toggle_framework_active(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_frameworks_by_category(app_handle: tauri::AppHandle, category: String) -> Result<Vec<crate::frameworks::Framework>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkService::new(db);
    service.get_frameworks_by_category(&category).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_framework_categories(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkService::new(db);
    service.get_framework_categories().await.map_err(|e| e.to_string())
}

#[command]
pub async fn search_frameworks(app_handle: tauri::AppHandle, query: String) -> Result<Vec<crate::frameworks::Framework>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkService::new(db);
    service.search_frameworks(&query).await.map_err(|e| e.to_string())
}

// Framework Detection Commands
#[command]
pub async fn get_all_framework_detections(app_handle: tauri::AppHandle) -> Result<Vec<crate::frameworks::FrameworkDetection>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkDetectionService::new(db);
    service.get_all_detections().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_detections_by_project_path(app_handle: tauri::AppHandle, project_path: String) -> Result<Vec<crate::frameworks::FrameworkDetection>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkDetectionService::new(db);
    service.get_detections_by_project_path(&project_path).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_detections_by_framework(app_handle: tauri::AppHandle, framework_id: i32) -> Result<Vec<crate::frameworks::FrameworkDetection>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkDetectionService::new(db);
    service.get_detections_by_framework(framework_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn create_framework_detection(
    app_handle: tauri::AppHandle,
    framework_id: i32,
    project_path: String,
    detection_method: String,
    confidence_score: f64,
    detected_files: Option<Vec<String>>,
    metadata: Option<serde_json::Value>
) -> Result<crate::frameworks::FrameworkDetection, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkDetectionService::new(db);
    service.create_detection(framework_id, project_path, detection_method, confidence_score, detected_files, metadata).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_framework_detection(
    app_handle: tauri::AppHandle,
    id: i32,
    confidence_score: f64,
    detected_files: Option<Vec<String>>,
    metadata: Option<serde_json::Value>
) -> Result<Option<crate::frameworks::FrameworkDetection>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkDetectionService::new(db);
    service.update_detection(id, confidence_score, detected_files, metadata).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_framework_detection(app_handle: tauri::AppHandle, id: i32) -> Result<bool, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkDetectionService::new(db);
    service.delete_detection(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_framework_detection_stats(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkDetectionService::new(db);
    service.get_detection_stats().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_high_confidence_detections(app_handle: tauri::AppHandle, threshold: f64) -> Result<Vec<crate::frameworks::FrameworkDetection>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkDetectionService::new(db);
    service.get_high_confidence_detections(threshold).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_recent_detections(app_handle: tauri::AppHandle, limit: u64) -> Result<Vec<crate::frameworks::FrameworkDetection>, String> {
    let db = DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = FrameworkDetectionService::new(db);
    service.get_recent_detections(limit).await.map_err(|e| e.to_string())
}
