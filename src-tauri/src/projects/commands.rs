use tauri::command;
use crate::projects::services::ProjectService;
use crate::database::DatabaseManager;

#[command]
pub async fn get_all_projects(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::projects::entities::ProjectModel>, String> {
    let service = ProjectService::new(&db_manager);
    service.get_all_projects().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_project(
    id: i32,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::projects::entities::ProjectModel>, String> {
    let service = ProjectService::new(&db_manager);
    service.get_project(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn add_project(
    name: String,
    path: String,
    framework: Option<String>,
    deployment: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<i32, String> {
    let service = ProjectService::new(&db_manager);
    service.create_project(name, path, framework, deployment).await.map_err(|e| e.to_string())
}

#[command]
pub async fn update_project(
    id: i32,
    name: Option<String>,
    path: Option<String>,
    framework: Option<String>,
    deployment: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<crate::projects::entities::ProjectModel>, String> {
    let service = ProjectService::new(&db_manager);
    service.update_project(id, name, path, framework, deployment).await.map_err(|e| e.to_string())
}

#[command]
pub async fn delete_project(
    id: i32,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<i32, String> {
    let service = ProjectService::new(&db_manager);
    service.delete_project(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn toggle_project_star(
    id: i32,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<i32, String> {
    let service = ProjectService::new(&db_manager);
    service.toggle_project_star(id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_projects_with_filters(
    framework_filter: Option<String>,
    sort_by: String,
    search_query: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::projects::entities::ProjectModel>, String> {
    let service = ProjectService::new(&db_manager);
    service.get_projects_with_filters(framework_filter, sort_by, search_query).await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_frameworks(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<String>, String> {
    let service = ProjectService::new(&db_manager);
    service.get_frameworks().await.map_err(|e| e.to_string())
}

#[command]
pub async fn validate_project_path(
    path: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<bool, String> {
    let service = ProjectService::new(&db_manager);
    service.validate_project_path(&path).await.map_err(|e| e.to_string())
}

#[command]
pub async fn generate_project_name(
    path: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<String, String> {
    let service = ProjectService::new(&db_manager);
    service.generate_project_name(&path).await.map_err(|e| e.to_string())
}

#[command]
pub async fn detect_framework(
    path: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Option<String>, String> {
    let service = ProjectService::new(&db_manager);
    service.detect_framework(&path).await.map_err(|e| e.to_string())
}

#[command]
pub async fn open_project_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[command]
pub async fn select_directory() -> Result<Option<String>, String> {
    // This would typically use a native file dialog
    // For now, return None as placeholder
    Ok(None)
}

#[command]
pub async fn open_project_with_framework_ide(
    project_path: String,
    framework: String
) -> Result<(), String> {
    // This would integrate with IDE settings to open the project
    // For now, just log the action
    println!("Opening project {} with framework {} IDE", project_path, framework);
    Ok(())
}

#[command]
pub async fn execute_command_in_directory(
    command: String,
    args: Vec<String>,
    working_directory: String
) -> Result<String, String> {
    crate::utils::execute_command_in_directory(command, args, working_directory).await
}


