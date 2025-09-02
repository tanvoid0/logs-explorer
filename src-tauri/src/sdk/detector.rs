use std::process::Command;
use std::env;
use std::path::Path;

pub fn detect_sdk_manager(manager: &str) -> Result<bool, String> {
    // Get user's home directory
    let home_dir = env::var("HOME").or_else(|_| env::var("USERPROFILE"))
        .map_err(|_| "Could not determine home directory".to_string())?;
    
    match manager {
        "sdkman" => {
            // Check if SDKMAN directory exists
            let sdkman_dir = Path::new(&home_dir).join(".sdkman");
            Ok(sdkman_dir.exists() && sdkman_dir.is_dir())
        },
        "nvm" => {
            // Check if NVM directory exists
            let nvm_dir = Path::new(&home_dir).join(".nvm");
            Ok(nvm_dir.exists() && nvm_dir.is_dir())
        },
        "pyenv" => {
            // Try to run pyenv --version
            match Command::new("pyenv").arg("--version").output() {
                Ok(output) => Ok(output.status.success()),
                Err(_) => Ok(false)
            }
        },
        "rvm" => {
            // Try to run rvm --version
            match Command::new("rvm").arg("--version").output() {
                Ok(output) => Ok(output.status.success()),
                Err(_) => Ok(false)
            }
        },
        "gvm" => {
            // Try to run gvm version
            match Command::new("gvm").arg("version").output() {
                Ok(output) => Ok(output.status.success()),
                Err(_) => Ok(false)
            }
        },
        _ => Ok(false)
    }
}
