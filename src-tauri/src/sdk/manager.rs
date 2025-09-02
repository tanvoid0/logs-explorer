use std::env;

pub fn get_shell_info() -> Result<serde_json::Value, String> {
    let shell = env::var("SHELL").unwrap_or_else(|_| {
        if cfg!(target_os = "windows") {
            "cmd".to_string()
        } else {
            "/bin/bash".to_string()
        }
    });
    
    let home = env::var("HOME").or_else(|_| env::var("USERPROFILE"))
        .unwrap_or_else(|_| "Unknown".to_string());
    
    let path = env::var("PATH").unwrap_or_else(|_| "Unknown".to_string());
    
    Ok(serde_json::json!({
        "shell": shell,
        "home": home,
        "path": path,
        "os": if cfg!(target_os = "windows") { "windows" } else { "unix" }
    }))
}
