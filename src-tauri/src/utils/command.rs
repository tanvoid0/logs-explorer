use std::process::Command;

/// Execute a command in a specific directory
pub async fn execute_command_in_directory(
    command: String,
    args: Vec<String>,
    working_directory: String
) -> Result<String, String> {
    let output = Command::new(&command)
        .args(&args)
        .current_dir(working_directory)
        .output()
        .map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Execute a command with full options
pub async fn execute_command(
    command: String,
    args: Vec<String>,
    working_directory: Option<String>,
    env: Option<std::collections::HashMap<String, String>>
) -> Result<String, String> {
    let mut cmd = Command::new(&command);
    cmd.args(&args);
    
    if let Some(wd) = working_directory {
        cmd.current_dir(wd);
    }
    
    if let Some(env_vars) = env {
        for (key, value) in env_vars {
            cmd.env(key, value);
        }
    }
    
    let output = cmd.output().map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Check if a command exists in the system
pub async fn check_command_exists(command: &str) -> Result<bool, String> {
    let output = Command::new("which")
        .arg(command)
        .output()
        .map_err(|e| e.to_string())?;
    
    Ok(output.status.success())
}

/// Get command help information
pub async fn get_command_help(command: &str) -> Result<String, String> {
    let output = Command::new(command)
        .arg("--help")
        .output()
        .map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
