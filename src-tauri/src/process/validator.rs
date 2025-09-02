use std::path::Path;
use std::fs;

pub fn validate_command(command: &str, args: &[String]) -> Result<(), String> {
    // Validate command to prevent command injection
    if command.contains(";") || command.contains("&") || command.contains("|") || command.contains("`") || command.contains("$(") {
        return Err("Invalid command: contains shell operators".to_string());
    }
    
    // Validate args to prevent command injection
    for arg in args {
        if arg.contains(";") || arg.contains("&") || arg.contains("|") || arg.contains("`") || arg.contains("$(") {
            return Err("Invalid argument: contains shell operators".to_string());
        }
    }
    
    Ok(())
}

pub fn validate_working_directory(cwd: &str) -> Result<(), String> {
    // Validate working directory
    if cwd.contains(";") || cwd.contains("&") || cwd.contains("|") || cwd.contains("`") || cwd.contains("$(") {
        return Err("Invalid working directory: contains shell operators".to_string());
    }
    
    Ok(())
}

pub fn validate_path(path: &str) -> Result<(), String> {
    // Check for path traversal attempts
    if path.contains("..") || path.contains("~") {
        return Err("Invalid path: contains path traversal characters".to_string());
    }
    
    // Ensure path is absolute and within allowed directories
    let path_obj = Path::new(path);
    if !path_obj.is_absolute() {
        return Err("Path must be absolute".to_string());
    }
    
    // Check if path exists and is a file
    if !path_obj.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    
    if !path_obj.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }
    
    // Check file size to prevent reading large files
    if let Ok(metadata) = fs::metadata(path) {
        if metadata.len() > 10 * 1024 * 1024 { // 10MB limit
            return Err("File too large (maximum 10MB)".to_string());
        }
    }
    
    Ok(())
}

pub fn validate_file_size(path: &str, max_size: u64) -> Result<(), String> {
    if let Ok(metadata) = fs::metadata(path) {
        if metadata.len() > max_size {
            return Err(format!("File too large (maximum {} bytes)", max_size));
        }
    }
    
    Ok(())
}
