use tauri::command;
use crate::process::{manager, executor};

#[command]
pub async fn start_process(
    command: String,
    cwd: String,
    args: Vec<String>
) -> Result<serde_json::Value, String> {
    manager::start_process(&command, &cwd, &args)
}

#[command]
pub async fn read_process_output(process_id: String) -> Result<String, String> {
    manager::read_process_output(&process_id)
}

#[command]
pub async fn is_process_running(process_id: String) -> Result<bool, String> {
    manager::is_process_running(&process_id)
}

#[command]
pub async fn get_process_exit_code(process_id: String) -> Result<i32, String> {
    manager::get_process_exit_code(&process_id)
}

#[command]
pub async fn kill_process(process_id: String) -> Result<(), String> {
    manager::kill_process(&process_id)
}

#[command]
pub async fn execute_command_live(
    command: String,
    args: Vec<String>,
    working_directory: Option<String>,
    process_id: String,
    window: tauri::Window
) -> Result<manager::CommandResult, String> {
    executor::execute_command_live(&command, &args, working_directory.as_deref(), &process_id, window)
}

#[command]
pub async fn cancel_command(process_id: String) -> Result<(), String> {
    manager::cancel_process(&process_id)
}

#[command]
pub async fn cancel_process(process_id: String) -> Result<(), String> {
    manager::cancel_process(&process_id)
}

#[command]
pub async fn cancel_all_processes() -> Result<(), String> {
    manager::cancel_all_processes()
}

#[command]
pub async fn get_running_processes() -> Result<Vec<String>, String> {
    manager::get_running_processes()
}


