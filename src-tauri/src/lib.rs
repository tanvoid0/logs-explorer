mod k8s;
mod database;

// Kubernetes API commands

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            k8s::init_k8s,
            k8s::k8s_health_check,
            k8s::k8s_get_namespaces,
            k8s::k8s_get_pods,
            k8s::k8s_get_services,
            k8s::k8s_get_deployments,
            k8s::k8s_get_configmaps,
            k8s::k8s_get_secrets,
            k8s::k8s_get_logs,
            k8s::k8s_get_namespace_logs,
            k8s::k8s_get_pod_containers,
            k8s::k8s_delete_pod,
            k8s::k8s_restart_pod,
            k8s::k8s_scale_deployment,
            k8s::k8s_get_jobs,
            k8s::k8s_get_job_pods,
            // IDE settings commands
            get_all_ides,
            add_ide,
            update_ide,
            delete_ide,
            set_default_ide,
            get_default_ide,
            open_ide,
            detect_installed_ides,
            // Project commands
            get_all_projects,
            add_project,
            update_project,
            delete_project,
            toggle_project_star,
            get_projects_with_filters,
            get_frameworks,
            get_project,
            validate_project_path,
            generate_project_name,
            detect_framework,
            open_project_in_explorer,
            select_directory,
            // Framework IDE mapping commands
            set_framework_ide_mapping,
            get_framework_ide_mapping,
            get_all_framework_ide_mappings,
            delete_framework_ide_mapping,
            open_ide_with_path,
                    // SDK Manager commands
        execute_command,
        execute_command_in_directory,
        detect_sdk_manager,
        // Process Management commands
        start_process,
        read_process_output,
        is_process_running,
        get_process_exit_code,
        kill_process,
        read_file,
        get_shell_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// IDE Settings Commands
#[tauri::command]
fn get_all_ides(app_handle: tauri::AppHandle) -> Result<Vec<database::IdeConfig>, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_all_ides().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_ide(app_handle: tauri::AppHandle, name: String, executable: String) -> Result<i64, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.add_ide(&name, &executable).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_ide(app_handle: tauri::AppHandle, id: i32, name: String, executable: String) -> Result<usize, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.update_ide(id, &name, &executable).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_ide(app_handle: tauri::AppHandle, id: i32) -> Result<usize, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.delete_ide(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_default_ide(app_handle: tauri::AppHandle, id: i32) -> Result<usize, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.set_default_ide(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_default_ide(app_handle: tauri::AppHandle) -> Result<Option<database::IdeConfig>, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_default_ide().map_err(|e| e.to_string())
}

#[tauri::command]
fn open_ide(executable: String) -> Result<(), String> {
    use std::process::Command;
    
    // Try to open the IDE
    let result = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(&["/C", "start", "", &executable])
            .spawn()
    } else {
        Command::new(&executable)
            .spawn()
    };
    
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open IDE '{}': {}", executable, e))
    }
}

#[tauri::command]
fn detect_installed_ides() -> Result<Vec<String>, String> {
    use std::process::Command;
    
    let common_ides = vec![
        "code",           // VS Code
        "idea",           // IntelliJ IDEA
        "webstorm",       // WebStorm
        "pycharm",        // PyCharm
        "goland",         // GoLand
        "clion",          // CLion
        "rider",          // Rider
        "phpstorm",       // PhpStorm
        "studio",         // Android Studio
        "subl",           // Sublime Text
        "vim",            // Vim
        "nvim",           // Neovim
        "emacs",          // Emacs
        "atom",           // Atom
        "brackets",       // Brackets
        "notepad++",      // Notepad++
        "gedit",          // Gedit
        "kate",           // Kate
        "mousepad",       // Mousepad
        "leafpad",        // Leafpad
    ];
    
    let mut installed_ides = Vec::new();
    
    for ide in common_ides {
        let result = if cfg!(target_os = "windows") {
            Command::new("where")
                .arg(ide)
                .output()
        } else {
            Command::new("which")
                .arg(ide)
                .output()
        };
        
        if let Ok(output) = result {
            if output.status.success() {
                installed_ides.push(ide.to_string());
            }
        }
    }
    
    Ok(installed_ides)
}

// Project Commands
#[tauri::command]
fn get_all_projects(app_handle: tauri::AppHandle) -> Result<Vec<database::Project>, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_all_projects().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_project(app_handle: tauri::AppHandle, name: String, path: String, framework: Option<String>, deployment: Option<String>) -> Result<i64, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.add_project(&name, &path, framework.as_deref(), deployment.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_project(app_handle: tauri::AppHandle, id: i32, name: String, path: String, framework: Option<String>, deployment: Option<String>) -> Result<usize, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.update_project(id, &name, &path, framework.as_deref(), deployment.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_project(app_handle: tauri::AppHandle, id: i32) -> Result<usize, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.delete_project(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_project_star(app_handle: tauri::AppHandle, id: i32) -> Result<usize, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.toggle_project_star(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_projects_with_filters(
    app_handle: tauri::AppHandle, 
    framework_filter: Option<String>, 
    sort_by: String, 
    search_query: Option<String>
) -> Result<Vec<database::Project>, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_projects_with_filters(
        framework_filter.as_deref(), 
        &sort_by, 
        search_query.as_deref()
    ).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_frameworks(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_frameworks().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_project(app_handle: tauri::AppHandle, id: i32) -> Result<Option<database::Project>, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_project(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn validate_project_path(path: String) -> Result<bool, String> {
    use std::path::Path;
    use std::fs;
    
    // Trim whitespace
    let path = path.trim();
    
    // Check if path is empty
    if path.is_empty() {
        return Err("Path cannot be empty".to_string());
    }
    
    // Check for invalid characters (platform-specific)
    #[cfg(target_os = "windows")]
    {
        let invalid_chars = ['<', '>', ':', '"', '|', '?', '*'];
        if path.chars().any(|c| invalid_chars.contains(&c)) {
            return Err("Path contains invalid characters".to_string());
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        if path.contains('\0') {
            return Err("Path contains null character".to_string());
        }
    }
    
    // Check path length limits
    if path.len() > 4096 {
        return Err("Path is too long (maximum 4096 characters)".to_string());
    }
    
    // Try to create a Path object
    let path_obj = Path::new(path);
    
    // Check if path is absolute (recommended for projects)
    if !path_obj.is_absolute() {
        return Err("Path should be absolute (full path)".to_string());
    }
    
    // Check if path exists
    if !path_obj.exists() {
        return Err("Directory does not exist".to_string());
    }
    
    // Check if it's actually a directory
    if !path_obj.is_dir() {
        return Err("Path is not a directory".to_string());
    }
    
    // Check if we have read permissions
    match fs::metadata(path_obj) {
        Ok(metadata) => {
            if !metadata.permissions().readonly() {
                // Try to check if we can read the directory
                match fs::read_dir(path_obj) {
                    Ok(_) => {
                        // Directory is readable
                    }
                    Err(e) => {
                        return Err(format!("Cannot read directory: {}", e));
                    }
                }
            }
        }
        Err(e) => {
            return Err(format!("Cannot access directory: {}", e));
        }
    }
    
    // Check if directory is not a system directory (optional safety check)
    let path_str = path_obj.to_string_lossy().to_lowercase();
    let system_dirs = [
        "/system", "/bin", "/sbin", "/usr", "/etc", "/var", "/tmp", "/proc", "/sys",
        "c:\\windows", "c:\\system32", "c:\\program files", "c:\\program files (x86)"
    ];
    
    for system_dir in &system_dirs {
        if path_str.contains(system_dir) {
            return Err("Cannot use system directories".to_string());
        }
    }
    
    Ok(true)
}

#[tauri::command]
fn generate_project_name(path: String) -> Result<String, String> {
    use std::path::Path;
    
    let path = Path::new(&path);
    if let Some(file_name) = path.file_name() {
        if let Some(name) = file_name.to_str() {
            // Convert to human-friendly name
            let mut friendly_name = name
                .replace(['_', '-', ' '], " ") // Replace underscores, hyphens, and spaces with spaces
                .split_whitespace()
                .map(|word| {
                    let mut chars = word.chars();
                    match chars.next() {
                        None => String::new(),
                        Some(first) => first.to_uppercase().chain(chars).collect(),
                    }
                })
                .collect::<Vec<_>>()
                .join(" ");
            
            // If the result is empty or just whitespace, use a fallback
            if friendly_name.trim().is_empty() {
                friendly_name = "Project".to_string();
            }
            
            return Ok(friendly_name);
        }
    }
    
    Err("Could not generate project name from path".to_string())
}

#[tauri::command]
fn detect_framework(path: String) -> Result<Option<String>, String> {
    use std::path::Path;
    use std::fs;
    
    let project_path = Path::new(&path);
    
    // Check for common framework files
    let framework_files = [
        // Java/Maven
        ("pom.xml", "Maven"),
        ("build.gradle", "Gradle"),
        ("gradle.properties", "Gradle"),
        ("gradlew", "Gradle"),
        ("gradlew.bat", "Gradle"),
        
        // Node.js
        ("package.json", "Node.js"),
        ("package-lock.json", "Node.js"),
        ("yarn.lock", "Yarn"),
        ("pnpm-lock.yaml", "pnpm"),
        
        // Python
        ("requirements.txt", "Python"),
        ("pyproject.toml", "Python"),
        ("setup.py", "Python"),
        ("Pipfile", "Python"),
        ("poetry.lock", "Poetry"),
        
        // .NET
        ("*.csproj", ".NET"),
        ("*.vbproj", ".NET"),
        ("*.fsproj", ".NET"),
        ("*.sln", ".NET"),
        ("packages.config", ".NET"),
        
        // Go
        ("go.mod", "Go"),
        ("go.sum", "Go"),
        
        // Rust
        ("Cargo.toml", "Rust"),
        ("Cargo.lock", "Rust"),
        
        // PHP
        ("composer.json", "Composer"),
        ("composer.lock", "Composer"),
        
        // Ruby
        ("Gemfile", "Ruby"),
        ("Gemfile.lock", "Ruby"),
        
        // Swift
        ("Package.swift", "Swift"),
        
        // Flutter/Dart
        ("pubspec.yaml", "Flutter"),
        ("pubspec.lock", "Flutter"),
        
        // React/Vue/Angular (additional checks)
        ("angular.json", "Angular"),
        ("vue.config.js", "Vue.js"),
        ("next.config.js", "Next.js"),
        ("nuxt.config.js", "Nuxt.js"),
        ("vite.config.js", "Vite"),
        ("vite.config.ts", "Vite"),
        ("webpack.config.js", "Webpack"),
        ("rollup.config.js", "Rollup"),
        
        // Docker
        ("Dockerfile", "Docker"),
        ("docker-compose.yml", "Docker"),
        ("docker-compose.yaml", "Docker"),
        
        // Kubernetes
        ("kustomization.yaml", "Kubernetes"),
        ("kustomization.yml", "Kubernetes"),
        
        // Terraform
        ("*.tf", "Terraform"),
        ("*.tfvars", "Terraform"),
        
        // Ansible
        ("ansible.cfg", "Ansible"),
        ("inventory", "Ansible"),
        
        // Make
        ("Makefile", "Make"),
        ("makefile", "Make"),
        
        // CMake
        ("CMakeLists.txt", "CMake"),
        
        // Svelte
        ("svelte.config.js", "Svelte"),
        ("svelte.config.ts", "Svelte"),
        
        // Tauri
        ("tauri.conf.json", "Tauri"),
        ("src-tauri", "Tauri"),
    ];
    
    for (file_pattern, framework) in framework_files.iter() {
        if file_pattern.starts_with("*.") {
            // Handle wildcard patterns
            let extension = &file_pattern[1..]; // Remove the "*"
            if let Ok(entries) = fs::read_dir(project_path) {
                for entry in entries {
                    if let Ok(entry) = entry {
                        if let Some(file_name) = entry.file_name().to_str() {
                            if file_name.ends_with(extension) {
                                return Ok(Some(framework.to_string()));
                            }
                        }
                    }
                }
            }
        } else {
            // Check for specific files
            let file_path = project_path.join(file_pattern);
            if file_path.exists() {
                return Ok(Some(framework.to_string()));
            }
        }
    }
    
    // Check for src-tauri directory (Tauri specific)
    let tauri_path = project_path.join("src-tauri");
    if tauri_path.exists() && tauri_path.is_dir() {
        return Ok(Some("Tauri".to_string()));
    }
    
    // Check for common directories that might indicate framework
    let common_dirs = [
        ("node_modules", "Node.js"),
        ("vendor", "Composer"),
        ("target", "Maven/Rust"),
        ("build", "Gradle"),
        ("dist", "Build Output"),
        ("out", "Build Output"),
    ];
    
    for (dir_name, framework) in common_dirs.iter() {
        let dir_path = project_path.join(dir_name);
        if dir_path.exists() && dir_path.is_dir() {
            return Ok(Some(framework.to_string()));
        }
    }
    
    // Check package.json content for more specific framework detection
    let package_json_path = project_path.join("package.json");
    if package_json_path.exists() {
        if let Ok(content) = fs::read_to_string(package_json_path) {
            if content.contains("\"react\"") || content.contains("\"react-dom\"") {
                return Ok(Some("React".to_string()));
            }
            if content.contains("\"vue\"") {
                return Ok(Some("Vue.js".to_string()));
            }
            if content.contains("\"@angular/") {
                return Ok(Some("Angular".to_string()));
            }
            if content.contains("\"next\"") {
                return Ok(Some("Next.js".to_string()));
            }
            if content.contains("\"nuxt\"") {
                return Ok(Some("Nuxt.js".to_string()));
            }
            if content.contains("\"svelte\"") {
                return Ok(Some("Svelte".to_string()));
            }
        }
    }
    
    Ok(None)
}

#[tauri::command]
fn open_project_in_explorer(path: String) -> Result<(), String> {
    use std::process::Command;
    
    let result = if cfg!(target_os = "windows") {
        Command::new("explorer")
            .arg(&path)
            .spawn()
    } else if cfg!(target_os = "macos") {
        Command::new("open")
            .arg(&path)
            .spawn()
    } else {
        // Linux - try common file managers
        let file_managers = ["xdg-open", "nautilus", "dolphin", "thunar", "pcmanfm"];
        
        for manager in file_managers.iter() {
            if let Ok(_) = Command::new("which").arg(manager).output() {
                if let Ok(_) = Command::new(manager).arg(&path).spawn() {
                    return Ok(());
                }
            }
        }
        
        // Fallback to xdg-open
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
    };
    
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open project in explorer: {}", e))
    }
}

#[tauri::command]
fn select_directory() -> Result<Option<String>, String> {
    use std::process::Command;
    
    let result = if cfg!(target_os = "windows") {
        // Use PowerShell to show folder browser dialog
        Command::new("powershell")
            .args([
                "-Command",
                "Add-Type -AssemblyName System.Windows.Forms; $folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog; $folderBrowser.Description = 'Select Project Directory'; $folderBrowser.ShowNewFolderButton = $false; if ($folderBrowser.ShowDialog() -eq 'OK') { $folderBrowser.SelectedPath }"
            ])
            .output()
    } else if cfg!(target_os = "macos") {
        // Use osascript to show folder browser dialog
        Command::new("osascript")
            .args([
                "-e",
                "choose folder with prompt \"Select Project Directory\""
            ])
            .output()
    } else {
        // Linux - try zenity, kdialog, or fallback to command line
        let file_managers = ["zenity", "kdialog"];
        
        for manager in file_managers.iter() {
            if let Ok(_) = Command::new("which").arg(manager).output() {
                let args = if *manager == "zenity" {
                    vec!["--file-selection", "--directory", "--title=Select Project Directory"]
                } else {
                    vec!["--getexistingdirectory", "--title=Select Project Directory"]
                };
                
                if let Ok(output) = Command::new(manager).args(args).output() {
                    if output.status.success() {
                        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                        if !path.is_empty() {
                            return Ok(Some(path));
                        }
                    }
                }
            }
        }
        
        // Fallback - return None to indicate no dialog available
        return Ok(None);
    };
    
    match result {
        Ok(output) => {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    Ok(Some(path))
                } else {
                    Ok(None)
                }
            } else {
                Ok(None)
            }
        }
        Err(_) => Ok(None)
    }
}

// Framework IDE Mapping Commands
#[tauri::command]
fn set_framework_ide_mapping(app_handle: tauri::AppHandle, framework: String, ide_id: i32) -> Result<usize, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.set_framework_ide_mapping(&framework, ide_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_framework_ide_mapping(app_handle: tauri::AppHandle, framework: String) -> Result<Option<database::IdeConfig>, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_framework_ide_mapping(&framework).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_all_framework_ide_mappings(app_handle: tauri::AppHandle) -> Result<Vec<database::FrameworkIdeMapping>, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.get_all_framework_ide_mappings().map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_framework_ide_mapping(app_handle: tauri::AppHandle, framework: String) -> Result<usize, String> {
    let db = database::Database::new(&app_handle).map_err(|e| e.to_string())?;
    db.delete_framework_ide_mapping(&framework).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_ide_with_path(executable: String, path: String) -> Result<(), String> {
    use std::process::Command;
    use std::path::Path;
    
    // Validate that the project path exists and is a directory
    let project_path = Path::new(&path);
    if !project_path.exists() {
        return Err(format!("Project path does not exist: {}", path));
    }
    if !project_path.is_dir() {
        return Err(format!("Project path is not a directory: {}", path));
    }
    
    // Try to open the IDE with the project path, changing to the project directory first
    let result = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(&["/C", "start", "", &executable, &path])
            .current_dir(&path)
            .spawn()
    } else {
        Command::new(&executable)
            .arg(&path)
            .current_dir(&path)
            .spawn()
    };
    
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open IDE with path: {}", e))
    }
}

// SDK Manager Commands
#[tauri::command]
fn execute_command(command: String, args: Vec<String>) -> Result<String, String> {
    use std::process::Command;
    use std::env;
    
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
        let full_command = if args.is_empty() {
            command.clone()
        } else {
            format!("{} {}", command, args.join(" "))
        };
        Command::new("cmd")
            .args(&["/c", &full_command])
            .output()
    } else {
        // On Unix-like systems, use the user's shell with login and interactive flags
        let full_command = if args.is_empty() {
            command.clone()
        } else {
            format!("{} {}", command, args.join(" "))
        };
        Command::new(&shell)
            .args(&["-i", "-c", &full_command])
            .env("TERM", "xterm-256color")
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

#[tauri::command]
fn execute_command_in_directory(command: String, args: Vec<String>, working_directory: String) -> Result<String, String> {
    use std::process::{Command, Stdio};
    use std::env;
    use std::path::Path;
    use std::time::Duration;
use std::thread;
use std::sync::{Arc, Mutex};
use std::sync::mpsc;
    
    // Validate that the working directory exists and is a directory
    let work_dir = Path::new(&working_directory);
    if !work_dir.exists() {
        return Err(format!("Working directory does not exist: {}", working_directory));
    }
    if !work_dir.is_dir() {
        return Err(format!("Working directory is not a directory: {}", working_directory));
    }
    
    // Check if this is a long-running command that should be limited
    let is_long_running = matches!(command.as_str(), "ping" | "top" | "htop" | "watch" | "tail" | "less" | "more");
    
    // Determine the shell to use
    let shell = env::var("SHELL").unwrap_or_else(|_| {
        if cfg!(target_os = "windows") {
            "cmd".to_string()
        } else {
            "/bin/bash".to_string()
        }
    });
    
    let full_command = if args.is_empty() {
        command.clone()
    } else {
        format!("{} {}", command, args.join(" "))
    };
    
    // For long-running commands, add a timeout or limit
    let final_command = if is_long_running {
        if command == "ping" {
            // Limit ping to 3 pings
            format!("{} -c 3 {}", command, args.join(" "))
        } else if command == "tail" {
            // Limit tail to show last 50 lines
            format!("{} -n 50 {}", command, args.join(" "))
        } else {
            // For other long-running commands, add a timeout
            format!("timeout 10s {}", full_command)
        }
    } else {
        full_command
    };
    
    let output = if cfg!(target_os = "windows") {
        // On Windows, use cmd with /c
        Command::new("cmd")
            .args(&["/c", &final_command])
            .current_dir(&working_directory)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .and_then(|mut child| {
                // Set a timeout for the process
                let timeout_duration = if is_long_running { Duration::from_secs(15) } else { Duration::from_secs(30) };
                
                let (tx, rx) = mpsc::channel();
                let child_arc = Arc::new(Mutex::new(child));
                let child_clone = Arc::clone(&child_arc);
                
                // Spawn a thread to wait for the process
                thread::spawn(move || {
                    let mut child_guard = child_clone.lock().unwrap();
                    let result = child_guard.wait();
                    let _ = tx.send(result);
                });
                
                // Wait for result with timeout
                match rx.recv_timeout(timeout_duration) {
                    Ok(status_result) => {
                        let mut child_guard = child_arc.lock().unwrap();
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
                        let mut child_guard = child_arc.lock().unwrap();
                        let _ = child_guard.kill();
                        Err(std::io::Error::new(std::io::ErrorKind::TimedOut, "Command timed out"))
                    }
                }
            })
    } else {
        // On Unix-like systems, use the user's shell with login and interactive flags
        Command::new(&shell)
            .args(&["-i", "-c", &final_command])
            .current_dir(&working_directory)
            .env("TERM", "xterm-256color")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .and_then(|mut child| {
                // Set a timeout for the process
                let timeout_duration = if is_long_running { Duration::from_secs(15) } else { Duration::from_secs(30) };
                
                let (tx, rx) = mpsc::channel();
                let child_arc = Arc::new(Mutex::new(child));
                let child_clone = Arc::clone(&child_arc);
                
                // Spawn a thread to wait for the process
                thread::spawn(move || {
                    let mut child_guard = child_clone.lock().unwrap();
                    let result = child_guard.wait();
                    let _ = tx.send(result);
                });
                
                // Wait for result with timeout
                match rx.recv_timeout(timeout_duration) {
                    Ok(status_result) => {
                        let mut child_guard = child_arc.lock().unwrap();
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
                        let mut child_guard = child_arc.lock().unwrap();
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

#[tauri::command]
fn detect_sdk_manager(manager: String) -> Result<bool, String> {
    use std::process::Command;
    use std::env;
    use std::path::Path;
    
    // Get user's home directory
    let home_dir = env::var("HOME").or_else(|_| env::var("USERPROFILE"))
        .map_err(|_| "Could not determine home directory".to_string())?;
    
    match manager.as_str() {
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

// Process Management for Terminal
use std::collections::HashMap;
use std::sync::Mutex;
use std::io::{BufRead, BufReader};
use std::process::{Command, Child, Stdio};

// Global storage for running processes
lazy_static::lazy_static! {
    static ref RUNNING_PROCESSES: Mutex<HashMap<u32, Child>> = Mutex::new(HashMap::new());
}

#[tauri::command]
fn start_process(command: String, cwd: String, args: Vec<String>) -> Result<serde_json::Value, String> {
    use std::process::Stdio;
    use std::env;
    
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
        cmd.args(&["/c", &command])
           .args(&args);
        cmd
    } else {
        // On Unix-like systems, use the user's shell with login and interactive flags
        let mut cmd = Command::new(&shell);
        cmd.args(&["-i", "-c", &format!("cd '{}' && {}", cwd, command)])
           .env("TERM", "xterm-256color"); // Set terminal type
        cmd
    };
    
    cmd.current_dir(&cwd)
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());
    
    let mut child = cmd.spawn()
        .map_err(|e| format!("Failed to start process '{}': {}", command, e))?;
    
    let pid = child.id();
    
    // Store the process
    RUNNING_PROCESSES.lock().unwrap().insert(pid, child);
    
    Ok(serde_json::json!({
        "pid": pid,
        "success": true
    }))
}

#[tauri::command]
fn read_process_output(pid: u32) -> Result<String, String> {
    let mut processes = RUNNING_PROCESSES.lock().unwrap();
    
    if let Some(child) = processes.get_mut(&pid) {
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

#[tauri::command]
fn is_process_running(pid: u32) -> Result<bool, String> {
    let mut processes = RUNNING_PROCESSES.lock().unwrap();
    
    if let Some(child) = processes.get_mut(&pid) {
        match child.try_wait() {
            Ok(Some(_)) => {
                // Process has finished, remove it
                processes.remove(&pid);
                Ok(false)
            },
            Ok(None) => Ok(true),
            Err(_) => {
                // Process has finished, remove it
                processes.remove(&pid);
                Ok(false)
            }
        }
    } else {
        Ok(false)
    }
}

#[tauri::command]
fn get_process_exit_code(pid: u32) -> Result<i32, String> {
    let mut processes = RUNNING_PROCESSES.lock().unwrap();
    
    if let Some(child) = processes.get_mut(&pid) {
        match child.wait() {
            Ok(status) => {
                processes.remove(&pid);
                Ok(status.code().unwrap_or(-1))
            },
            Err(e) => {
                processes.remove(&pid);
                Err(format!("Failed to get exit code: {}", e))
            }
        }
    } else {
        Err("Process not found".to_string())
    }
}

#[tauri::command]
fn kill_process(pid: u32) -> Result<(), String> {
    let mut processes = RUNNING_PROCESSES.lock().unwrap();
    
    if let Some(mut child) = processes.remove(&pid) {
        if let Err(e) = child.kill() {
            return Err(format!("Failed to kill process: {}", e));
        }
    }
    
    Ok(())
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    use std::fs;
    
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file '{}': {}", path, e))
}

#[tauri::command]
fn get_shell_info() -> Result<serde_json::Value, String> {
    use std::env;
    
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
