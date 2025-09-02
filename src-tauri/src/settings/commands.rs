use tauri::command;
use crate::settings::services::SettingsService;
use crate::database::DatabaseManager;

// IDE Settings Commands
#[command]
pub async fn get_all_ide_settings(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::settings::entities::IDESettingsModel>, String> {
    let service = SettingsService::new(&db_manager);
    service.get_all_ide_settings().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_ide_settings_by_framework(
    framework: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::settings::entities::IDESettingsModel>, String> {
    let service = SettingsService::new(&db_manager);
    service.get_ide_settings_by_framework(&framework).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_default_ide_settings(
    framework: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::settings::entities::IDESettingsModel>, String> {
    let service = SettingsService::new(&db_manager);
    service.get_default_ide_settings(&framework).await.map_err(|e| e.to_string())
}

#[command]
pub async fn create_ide_settings(
    name: String,
    executable: String,
    framework: String,
    is_default: bool,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::settings::entities::IDESettingsModel, String> {
    let service = SettingsService::new(&db_manager);
    service.create_ide_settings(name, executable, framework, is_default).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_ide_settings(
    id: i32,
    name: Option<String>,
    executable: Option<String>,
    framework: Option<String>,
    is_default: Option<bool>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::settings::entities::IDESettingsModel>, String> {
    let service = SettingsService::new(&db_manager);
    service.update_ide_settings(id, name, executable, framework, is_default).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_ide_settings(
    id: i32,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<bool, String> {
    let service = SettingsService::new(&db_manager);
    service.delete_ide_settings(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn set_default_ide_settings(
    id: i32,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::settings::entities::IDESettingsModel, String> {
    let service = SettingsService::new(&db_manager);
    service.set_default_ide_settings(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn open_project_with_ide_settings(
    project_path: String,
    framework: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<(), String> {
    let service = SettingsService::new(&db_manager);
    service.open_project_with_framework_ide(&project_path, &framework).await.map_err(|e| e.to_string())
}

#[command]
pub async fn validate_ide_path(
    path: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<bool, String> {
    let service = SettingsService::new(&db_manager);
    service.validate_ide_path(&path).await.map_err(|e| e.to_string())
}

#[command]
pub async fn detect_installed_ides(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<String>, String> {
    let service = SettingsService::new(&db_manager);
    service.detect_installed_ides().await.map_err(|e| e.to_string())
}

// App Settings Commands
#[command]
pub async fn get_all_app_settings(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::settings::entities::AppSettingsModel>, String> {
    let service = SettingsService::new(&db_manager);
    service.get_all_app_settings().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_app_settings_by_category(
    category: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::settings::entities::AppSettingsModel>, String> {
    let service = SettingsService::new(&db_manager);
    service.get_app_settings_by_category(&category).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_app_setting(
    key: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::settings::entities::AppSettingsModel>, String> {
    let service = SettingsService::new(&db_manager);
    service.get_app_setting(&key).await.map_err(|e| e.to_string())
}

#[command]
pub async fn create_app_settings(
    key: String,
    value: String,
    category: String,
    description: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::settings::entities::AppSettingsModel, String> {
    let service = SettingsService::new(&db_manager);
    service.create_app_settings(key, value, category, description).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_app_settings(
    key: String,
    value: Option<String>,
    category: Option<String>,
    description: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::settings::entities::AppSettingsModel>, String> {
    let service = SettingsService::new(&db_manager);
    service.update_app_settings(&key, value, category, description).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_app_settings(
    key: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<bool, String> {
    let service = SettingsService::new(&db_manager);
    service.delete_app_settings(&key).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_app_settings_categories(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<String>, String> {
    let service = SettingsService::new(&db_manager);
    service.get_app_settings_categories().await.map_err(|e| e.to_string())
}

// Settings Utilities
#[command]
pub async fn export_settings(_db_manager: tauri::State<'_, DatabaseManager>) -> Result<String, String> {
    // This would export all settings to JSON
    // For now, return a placeholder
    Ok("{}".to_string())
}

#[command]
pub async fn import_settings(
    _settings_data: String,
    _db_manager: tauri::State<'_, DatabaseManager>
) -> Result<bool, String> {
    // This would import settings from JSON
    // For now, return success
    Ok(true)
}

#[command]
pub async fn reset_settings_to_default(_db_manager: tauri::State<'_, DatabaseManager>) -> Result<bool, String> {
    // This would reset all settings to defaults
    // For now, return success
    Ok(true)
}
