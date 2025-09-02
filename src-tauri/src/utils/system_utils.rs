use tauri::command;
use std::env;

#[command]
pub async fn get_user_home() -> Result<String, String> {
    // Try to get HOME environment variable (Unix-like systems)
    if let Ok(home) = env::var("HOME") {
        return Ok(home);
    }
    
    // Try to get USERPROFILE environment variable (Windows)
    if let Ok(userprofile) = env::var("USERPROFILE") {
        return Ok(userprofile);
    }
    
    // Fallback: try to get the current user's home directory
    if let Ok(current_dir) = env::current_dir() {
        if let Some(home) = current_dir.to_str() {
            return Ok(home.to_string());
        }
    }
    
    // Last resort: return empty string
    Ok("".to_string())
}
