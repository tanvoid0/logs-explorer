use tauri::command;
use crate::sdk::{detector, manager};

#[command]
pub async fn detect_sdk_manager(manager: String) -> Result<bool, String> {
    detector::detect_sdk_manager(&manager)
}

#[command]
pub async fn execute_command(command: String, args: Vec<String>) -> Result<String, String> {
    crate::process::executor::execute_command(&command, &args)
}



#[command]
pub async fn get_shell_info() -> Result<serde_json::Value, String> {
    manager::get_shell_info()
}
