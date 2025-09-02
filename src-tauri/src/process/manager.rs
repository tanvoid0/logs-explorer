use std::process::Child;
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

/// Global storage for running processes
pub static RUNNING_PROCESSES: Lazy<Mutex<HashMap<String, Child>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub output: String,
    pub command_type: String,
    pub is_native: bool,
    pub exit_code: Option<i32>,
    pub error_message: Option<String>,
}

pub fn start_process(command: &str, cwd: &str, args: &[String]) -> Result<serde_json::Value, String> {
    use std::process::{Command, Stdio};
    use std::env;
    use crate::process::validator;
    
    // Validate command and args
    validator::validate_command(command, args)?;
    validator::validate_working_directory(cwd)?;
    
    // Determine the shell to use
    let shell = env::var("SHELL").unwrap_or_else(|_| {
        if cfg!(target_os = "windows") {
            "cmd".to_string()
        } else {
            "/bin/bash".to_string()
        }
    });
    
    let mut cmd = if cfg!(target_os = "windows") {
        // On Windows, use cmd with /c
        let mut cmd = Command::new("cmd");
        cmd.args(&["/c", command]);
        if !args.is_empty() {
            cmd.args(args);
        }
        cmd
    } else {
        // On Unix-like systems, use the user's shell with login and interactive flags
        let mut cmd = Command::new(&shell);
        cmd.args(&["-i", "-c", command]);
        if !args.is_empty() {
            cmd.args(args);
        }
        cmd.env("TERM", "xterm-256color"); // Set terminal type
        cmd
    };
    
    cmd.current_dir(cwd)
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());
    
    let child = cmd.spawn()
        .map_err(|e| format!("Failed to start process '{}': {}", command, e))?;
    
    let process_id = format!("process_{}", child.id());
    
    // Store the process
    RUNNING_PROCESSES.lock()
        .map_err(|_| "Failed to acquire lock for storing process".to_string())?
        .insert(process_id.clone(), child);
    
    Ok(serde_json::json!({
        "process_id": process_id,
        "success": true
    }))
}

pub fn cancel_process(process_id: &str) -> Result<(), String> {
    println!("🔍 BACKEND: Attempting to cancel process: {}", process_id);
    
    // Try to get the lock without blocking
    let processes_guard = RUNNING_PROCESSES.try_lock()
        .map_err(|_| "Failed to acquire lock - processes may be busy".to_string())?;
    let mut processes = processes_guard;
    
    // Debug: Print all running processes
    println!("🔍 BACKEND: Current running processes:");
    for (pid, _) in processes.iter() {
        println!("  - Process ID: {}", pid);
    }
    
    if let Some(mut child) = processes.remove(process_id) {
        println!("🔍 BACKEND: Found process to cancel: {}", process_id);
        
        // Try to kill the process with multiple attempts
        
        // First attempt: try to kill normally
        if let Err(e) = child.kill() {
            println!("🔍 BACKEND: First kill attempt failed for {}: {}", process_id, e);
            
            // Second attempt: try to wait a bit and kill again
            std::thread::sleep(std::time::Duration::from_millis(100));
            if let Err(e2) = child.kill() {
                println!("🔍 BACKEND: Second kill attempt failed for {}: {}", process_id, e2);
                return Err(format!("Failed to kill process after multiple attempts: {}", e));
            }
        }
        
        println!("🔍 BACKEND: Process {} cancelled successfully", process_id);
        Ok(())
    } else {
        println!("🔍 BACKEND: Process {} not found in running processes", process_id);
        Err(format!("Process {} not found", process_id))
    }
}

pub fn get_running_processes() -> Result<Vec<String>, String> {
    let processes_guard = RUNNING_PROCESSES.try_lock()
        .map_err(|_| "Failed to acquire lock - processes may be busy".to_string())?;
    let processes = processes_guard;
    
    let process_ids: Vec<String> = processes.keys().cloned().collect();
    Ok(process_ids)
}

pub fn cancel_all_processes() -> Result<(), String> {
    // Try to get the lock without blocking
    let processes_guard = RUNNING_PROCESSES.try_lock()
        .map_err(|_| "Failed to acquire lock - processes may be busy".to_string())?;
    let mut processes = processes_guard;
    
    if processes.is_empty() {
        println!("No running processes to cancel");
        return Ok(());
    }
    
    println!("Cancelling {} running processes", processes.len());
    
    // Kill all running processes
    for (process_id, child) in processes.iter_mut() {
        println!("Cancelling process: {}", process_id);
        if let Err(e) = child.kill() {
            println!("Failed to kill process {}: {}", process_id, e);
        }
    }
    
    // Clear all processes
    processes.clear();
    
    println!("All processes cancelled successfully");
    Ok(())
}

pub fn read_process_output(process_id: &str) -> Result<String, String> {
    use std::io::{BufRead, BufReader};
    
    let mut processes = RUNNING_PROCESSES.lock()
        .map_err(|_| "Failed to acquire lock for reading process output".to_string())?;
    
    if let Some(child) = processes.get_mut(process_id) {
        if let Some(stdout) = child.stdout.take() {
            let reader = BufReader::new(stdout);
            let mut output = String::new();
            
            for line in reader.lines() {
                if let Ok(line) = line {
                    output.push_str(&line);
                    output.push('\n');
                }
            }
            
            return Ok(output);
        }
    }
    
    Ok(String::new())
}

pub fn is_process_running(process_id: &str) -> Result<bool, String> {
    let mut processes = RUNNING_PROCESSES.lock()
        .map_err(|_| "Failed to acquire lock for checking process status".to_string())?;
    
    if let Some(child) = processes.get_mut(process_id) {
        match child.try_wait() {
            Ok(Some(_)) => {
                // Process has finished, remove it
                processes.remove(process_id);
                Ok(false)
            },
            Ok(None) => Ok(true),
            Err(_) => {
                // Process has finished, remove it
                processes.remove(process_id);
                Ok(false)
            }
        }
    } else {
        Ok(false)
    }
}

pub fn get_process_exit_code(process_id: &str) -> Result<i32, String> {
    let mut processes = RUNNING_PROCESSES.lock()
        .map_err(|_| "Failed to acquire lock for getting process exit code".to_string())?;
    
    if let Some(child) = processes.get_mut(process_id) {
        match child.wait() {
            Ok(status) => {
                processes.remove(process_id);
                Ok(status.code().unwrap_or(-1))
            },
            Err(e) => {
                processes.remove(process_id);
                Err(format!("Failed to get exit code: {}", e))
            }
        }
    } else {
        Err("Process not found".to_string())
    }
}

pub fn kill_process(process_id: &str) -> Result<(), String> {
    let mut processes = RUNNING_PROCESSES.lock()
        .map_err(|_| "Failed to acquire lock for killing process".to_string())?;
    
    if let Some(mut child) = processes.remove(process_id) {
        if let Err(e) = child.kill() {
            return Err(format!("Failed to kill process: {}", e));
        }
    }
    
    Ok(())
}
