use std::process::{Command, Stdio};
use std::env;
use std::io::{BufRead, BufReader};

use tauri::Emitter;
use crate::process::{manager::CommandResult, timeout, validator};

pub fn execute_command(command: &str, args: &[String]) -> Result<String, String> {
    // Validate command and args
    validator::validate_command(command, args)?;
    
    // Determine the shell to use
    let shell = env::var("SHELL").unwrap_or_else(|_| {
        if cfg!(target_os = "windows") {
            "cmd".to_string()
        } else {
            "/bin/bash".to_string()
        }
    });
    
    let output = if cfg!(target_os = "windows") {
        // On Windows, use cmd with /c - pass command and args separately
        let mut cmd = Command::new("cmd");
        cmd.args(&["/c", command]);
        if !args.is_empty() {
            cmd.args(args);
        }
        cmd.output()
    } else {
        // On Unix-like systems, use the user's shell with login and interactive flags
        let mut cmd = Command::new(&shell);
        cmd.args(&["-i", "-c", command]);
        if !args.is_empty() {
            cmd.args(args);
        }
        cmd.env("TERM", "xterm-256color")
            .output()
    }.map_err(|e| format!("Failed to execute command '{}': {}", command, e))?;
    
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Command '{}' failed: {}", command, stderr))
    }
}

pub fn execute_command_in_directory(command: &str, args: &[String], working_directory: &str) -> Result<String, String> {
    use std::thread;
    use std::sync::{Arc, Mutex};
    use std::sync::mpsc;
    
    // Validate inputs
    validator::validate_command(command, args)?;
    validator::validate_working_directory(working_directory)?;
    
    // Validate that the working directory exists and is a directory
    let work_dir = std::path::Path::new(working_directory);
    if !work_dir.exists() {
        return Err(format!("Working directory does not exist: {}", working_directory));
    }
    if !work_dir.is_dir() {
        return Err(format!("Working directory is not a directory: {}", working_directory));
    }
    
    // Get timeout configuration
    let timeout_config = timeout::get_timeout_config(command);
    let (final_command, final_args) = timeout::get_command_with_timeout(command, args);
    
    // Determine the shell to use
    let shell = env::var("SHELL").unwrap_or_else(|_| {
        if cfg!(target_os = "windows") {
            "cmd".to_string()
        } else {
            "/bin/bash".to_string()
        }
    });
    
    let output = if cfg!(target_os = "windows") {
        // On Windows, use cmd with /c
        let mut cmd = Command::new("cmd");
        cmd.args(&["/c", &final_command]);
        if !final_args.is_empty() {
            cmd.args(&final_args);
        }
        cmd.current_dir(working_directory)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .and_then(|child| {
                let (tx, rx) = mpsc::channel();
                let child_arc = Arc::new(Mutex::new(child));
                let child_clone = Arc::clone(&child_arc);
                
                // Spawn a thread to wait for the process
                thread::spawn(move || {
                    let mut child_guard = child_clone.lock().expect("Failed to acquire lock for child process");
                    let result = child_guard.wait();
                    let _ = tx.send(result);
                });
                
                // Wait for result with timeout
                match rx.recv_timeout(timeout_config.duration) {
                    Ok(status_result) => {
                        let mut child_guard = child_arc.lock().expect("Failed to acquire lock for child process");
                        let output = child_guard.stdout.take().and_then(|mut stdout| {
                            use std::io::Read;
                            let mut buffer = Vec::new();
                            stdout.read_to_end(&mut buffer).ok()?;
                            Some(buffer)
                        });
                        let stderr = child_guard.stderr.take().and_then(|mut stderr| {
                            use std::io::Read;
                            let mut buffer = Vec::new();
                            stderr.read_to_end(&mut buffer).ok()?;
                            Some(buffer)
                        });
                        Ok((status_result?, output, stderr))
                    },
                    Err(_) => {
                        // Timeout occurred, kill the process
                        let mut child_guard = child_arc.lock().expect("Failed to acquire lock for child process");
                        let _ = child_guard.kill();
                        Err(std::io::Error::new(std::io::ErrorKind::TimedOut, "Command timed out"))
                    }
                }
            })
    } else {
        // On Unix-like systems, use the user's shell with login and interactive flags
        let mut cmd = Command::new(&shell);
        cmd.args(&["-i", "-c", &final_command]);
        if !final_args.is_empty() {
            cmd.args(&final_args);
        }
        cmd.current_dir(working_directory)
            .env("TERM", "xterm-256color")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .and_then(|child| {
                let (tx, rx) = mpsc::channel();
                let child_arc = Arc::new(Mutex::new(child));
                let child_clone = Arc::clone(&child_arc);
                
                // Spawn a thread to wait for the process
                thread::spawn(move || {
                    let mut child_guard = child_clone.lock().expect("Failed to acquire lock for child process");
                    let result = child_guard.wait();
                    let _ = tx.send(result);
                });
                
                // Wait for result with timeout
                match rx.recv_timeout(timeout_config.duration) {
                    Ok(status_result) => {
                        let mut child_guard = child_arc.lock().expect("Failed to acquire lock for child process");
                        let output = child_guard.stdout.take().and_then(|mut stdout| {
                            use std::io::Read;
                            let mut buffer = Vec::new();
                            stdout.read_to_end(&mut buffer).ok()?;
                            Some(buffer)
                        });
                        let stderr = child_guard.stderr.take().and_then(|mut stderr| {
                            use std::io::Read;
                            let mut buffer = Vec::new();
                            stderr.read_to_end(&mut buffer).ok()?;
                            Some(buffer)
                        });
                        Ok((status_result?, output, stderr))
                    },
                    Err(_) => {
                        // Timeout occurred, kill the process
                        let mut child_guard = child_arc.lock().expect("Failed to acquire lock for child process");
                        let _ = child_guard.kill();
                        Err(std::io::Error::new(std::io::ErrorKind::TimedOut, "Command timed out"))
                    }
                }
            })
    }.map_err(|e| format!("Failed to execute command '{}' in directory '{}': {}", command, working_directory, e))?;
    
    let (status, stdout, stderr) = output;
    
    if status.success() {
        let stdout_str = stdout.map(|bytes| String::from_utf8_lossy(&bytes).to_string()).unwrap_or_default();
        Ok(stdout_str)
    } else {
        let stderr_str = stderr.map(|bytes| String::from_utf8_lossy(&bytes).to_string()).unwrap_or_default();
        Err(format!("Command '{}' failed in directory '{}': {}", command, working_directory, stderr_str))
    }
}

pub fn execute_command_live(
    command: &str,
    args: &[String],
    working_directory: Option<&str>,
    process_id: &str,
    window: tauri::Window
) -> Result<CommandResult, String> {
    println!("=== EXECUTE COMMAND LIVE ===");
    println!("Command: {}", command);
    println!("Args: {:?}", args);
    println!("Working directory: {:?}", working_directory);
    println!("Process ID: {}", process_id);
    
    // Validate command and args
    validator::validate_command(command, args)?;
    
    // Parse the command
    let (cmd, cmd_args) = parse_command(command);
    
    if cmd.is_empty() {
        return Ok(CommandResult {
            success: true,
            output: "".to_string(),
            command_type: "empty".to_string(),
            is_native: false,
            exit_code: None,
            error_message: None,
        });
    }
    
    // Determine the shell to use
    let shell = env::var("SHELL").unwrap_or_else(|_| {
        if cfg!(target_os = "windows") {
            "cmd".to_string()
        } else {
            "/bin/bash".to_string()
        }
    });
    
    // Use the actual command and args instead of string concatenation
    let final_command = if !cmd_args.is_empty() {
        cmd
    } else {
        command.to_string()
    };
    
    let final_args = if !cmd_args.is_empty() {
        cmd_args
    } else {
        args.to_vec()
    };
    
    println!("Final command: {}", final_command);
    println!("Final args: {:?}", final_args);
    
    // Spawn the process
    let child = if cfg!(target_os = "windows") {
        let mut cmd = Command::new("cmd");
        cmd.args(&["/c", &final_command]);
        if !final_args.is_empty() {
            cmd.args(&final_args);
        }
        
        if let Some(ref cwd) = working_directory {
            cmd.current_dir(cwd);
        }
        
        cmd.stdout(Stdio::piped())
           .stderr(Stdio::piped())
           .spawn()
    } else {
        let mut cmd = Command::new(&shell);
        cmd.args(&["-i", "-c", &final_command]);
        if !final_args.is_empty() {
            cmd.args(&final_args);
        }
        
        if let Some(ref cwd) = working_directory {
            cmd.current_dir(cwd);
        }
        
        cmd.env("TERM", "xterm-256color")
           .stdout(Stdio::piped())
           .stderr(Stdio::piped())
           .spawn()
    }.map_err(|e| {
        println!("Failed to spawn command: {}", e);
        e.to_string()
    })?;

    // Store the process with process_id
    use crate::process::manager::RUNNING_PROCESSES;
    RUNNING_PROCESSES.lock()
        .map_err(|_| "Failed to acquire lock for storing process".to_string())?
        .insert(process_id.to_string(), child);

    let mut output = String::new();
    
    // Get the child process from storage
    let mut processes = RUNNING_PROCESSES.lock()
        .map_err(|_| "Failed to acquire lock for reading process".to_string())?;
    let child = processes.get_mut(process_id).ok_or("Process not found")?;
    
    // Read stdout in real-time
    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        
        for line in reader.lines() {
            if let Ok(line) = line {
                output.push_str(&line);
                output.push('\n');
                println!("STDOUT Live output for {}: {}", process_id, line);
                
                // Emit real-time output to frontend with process_id
                let payload = serde_json::json!({
                    "processId": process_id,
                    "line": line
                });
                
                if let Err(e) = window.emit("command_output", payload) {
                    println!("Failed to emit stdout for {}: {}", process_id, e);
                } else {
                    println!("Emitted stdout for {}: {}", process_id, line);
                }
            }
        }
    }

    // Read stderr in real-time
    if let Some(stderr) = child.stderr.take() {
        let reader = BufReader::new(stderr);
        
        for line in reader.lines() {
            if let Ok(line) = line {
                println!("STDERR Live output for {}: {}", process_id, line);
                
                // Emit stderr to frontend with process_id
                let payload = serde_json::json!({
                    "processId": process_id,
                    "line": line
                });
                
                if let Err(e) = window.emit("command_output", payload) {
                    println!("Failed to emit stderr for {}: {}", process_id, e);
                } else {
                    println!("Emitted stderr for {}: {}", process_id, line);
                }
            }
        }
    }

    // Wait for the process to finish
    let status = match child.wait() {
        Ok(status) => status,
        Err(e) => {
            // If we can't wait for the process, try to kill it and return error
            let _ = child.kill();
            return Err(format!("Process error: {}", e));
        }
    };
    
    // Remove the process from storage
    processes.remove(process_id);
    
    if status.success() {
        Ok(CommandResult {
            success: true,
            output: output.trim().to_string(),
            command_type: "native".to_string(),
            is_native: true,
            exit_code: status.code(),
            error_message: None,
        })
    } else {
        let exit_code = status.code();
        Ok(CommandResult {
            success: false,
            output: format!("Command failed with exit code: {}", status),
            command_type: "native".to_string(),
            is_native: true,
            exit_code,
            error_message: Some(format!("Command failed with exit code: {}", status)),
        })
    }
}

fn parse_command(command: &str) -> (String, Vec<String>) {
    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.is_empty() {
        return (String::new(), Vec::new());
    }
    
    let cmd = parts[0].to_string();
    let args: Vec<String> = parts[1..].iter().map(|s| s.to_string()).collect();
    
    (cmd, args)
}
