use std::time::Duration;

pub struct TimeoutConfig {
    pub duration: Duration,
    pub is_long_running: bool,
}

pub fn get_timeout_config(command: &str) -> TimeoutConfig {
    // Check if this is a long-running command that should be limited
    let is_long_running = matches!(command, "ping" | "top" | "htop" | "watch" | "tail" | "less" | "more");
    
    let duration = if is_long_running {
        Duration::from_secs(15)
    } else {
        Duration::from_secs(30)
    };
    
    TimeoutConfig {
        duration,
        is_long_running,
    }
}

pub fn get_command_with_timeout(command: &str, args: &[String]) -> (String, Vec<String>) {
    let is_long_running = matches!(command, "ping" | "top" | "htop" | "watch" | "tail" | "less" | "more");
    
    if is_long_running {
        if command == "ping" {
            // Limit ping to 3 pings
            let mut new_args = vec!["-c".to_string(), "3".to_string()];
            new_args.extend(args.to_vec());
            (command.to_string(), new_args)
        } else if command == "tail" {
            // Limit tail to show last 50 lines
            let mut new_args = vec!["-n".to_string(), "50".to_string()];
            new_args.extend(args.to_vec());
            (command.to_string(), new_args)
        } else {
            // For other long-running commands, add a timeout
            let mut new_args = vec!["timeout".to_string(), "10s".to_string(), command.to_string()];
            new_args.extend(args.to_vec());
            ("timeout".to_string(), new_args)
        }
    } else {
        (command.to_string(), args.to_vec())
    }
}
