# Lib.rs Modular Refactoring Plan

## Current State Analysis

The current `lib.rs` file (1622 lines) contains multiple responsibilities:

1. **Tauri Application Setup** - Main application entry point
2. **Command Handlers** - Multiple domain-specific command handlers
3. **Process Management** - Complex process execution and management logic
4. **SDK Management** - SDK detection and command execution
5. **Global State** - Running processes management

## Proposed Modular Structure

```
src-tauri/src/
├── lib.rs                          # Main entry point (simplified)
├── app/
│   ├── mod.rs                      # App module declarations
│   ├── builder.rs                  # Tauri app builder configuration
│   └── handlers.rs                 # Command handler registration
├── commands/
│   ├── mod.rs                      # Commands module
│   ├── ide_commands.rs             # IDE settings commands
│   ├── project_commands.rs         # Project management commands
│   ├── task_commands.rs            # Task management commands
│   ├── sdk_commands.rs             # SDK management commands
│   └── process_commands.rs         # Process management commands
├── process/
│   ├── mod.rs                      # Process module
│   ├── manager.rs                  # Process manager with global state
│   ├── executor.rs                 # Command execution logic
│   ├── validator.rs                # Command validation
│   └── timeout.rs                  # Timeout handling
├── sdk/
│   ├── mod.rs                      # SDK module
│   ├── detector.rs                 # SDK detection logic
│   └── manager.rs                  # SDK management
└── utils/
    ├── mod.rs                      # Utils module
    ├── shell.rs                    # Shell utilities
    ├── platform.rs                 # Platform-specific utilities
    └── validation.rs               # Input validation utilities
```

## Detailed Module Breakdown

### 1. **App Module** (`src-tauri/src/app/`)

#### `mod.rs`
```rust
pub mod builder;
pub mod handlers;

pub use builder::*;
pub use handlers::*;
```

#### `builder.rs`
```rust
use tauri::Builder;

pub fn create_app() -> Builder {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
}
```

#### `handlers.rs`
```rust
use tauri::generate_handler;

pub fn register_handlers() -> Vec<tauri::InvokeHandler> {
    vec![
        generate_handler![
            // IDE commands
            crate::commands::ide_commands::*,
            // Project commands
            crate::commands::project_commands::*,
            // Task commands
            crate::commands::task_commands::*,
            // SDK commands
            crate::commands::sdk_commands::*,
            // Process commands
            crate::commands::process_commands::*,
        ]
    ]
}
```

### 2. **Commands Module** (`src-tauri/src/commands/`)

#### `mod.rs`
```rust
pub mod ide_commands;
pub mod project_commands;
pub mod task_commands;
pub mod sdk_commands;
pub mod process_commands;

pub use ide_commands::*;
pub use project_commands::*;
pub use task_commands::*;
pub use sdk_commands::*;
pub use process_commands::*;
```

#### `ide_commands.rs`
```rust
use tauri::command;
use crate::database;
use crate::settings;

#[tauri::command]
pub async fn get_all_ides(app_handle: tauri::AppHandle) -> Result<Vec<settings::IdeConfig>, String> {
    let db = database::DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = settings::IdeSettingsService::new(db);
    service.get_all_ides().await.map_err(|e| e.to_string())
}

// ... other IDE commands
```

#### `project_commands.rs`
```rust
use tauri::command;
use crate::database;
use crate::projects;

#[tauri::command]
pub async fn get_all_projects(app_handle: tauri::AppHandle) -> Result<Vec<projects::Project>, String> {
    let db = database::DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = projects::ProjectService::new(db);
    service.get_all_projects().await.map_err(|e| e.to_string())
}

// ... other project commands
```

#### `task_commands.rs`
```rust
use tauri::command;
use crate::database;
use crate::tasks;
use crate::utils;

#[tauri::command]
pub async fn get_all_task_groups(app_handle: tauri::AppHandle) -> Result<Vec<tasks::TaskGroupModel>, String> {
    let db = database::DatabaseManager::new(&app_handle).await.map_err(|e| e.to_string())?;
    let service = tasks::TaskGroupService::new(db);
    service.get_all_task_groups().await.map_err(|e| e.to_string())
}

// ... other task commands
```

#### `sdk_commands.rs`
```rust
use tauri::command;
use crate::sdk::detector;
use crate::process::executor;

#[tauri::command]
pub fn detect_sdk_manager(manager: String) -> Result<bool, String> {
    detector::detect_sdk_manager(&manager)
}

#[tauri::command]
pub fn execute_command(command: String, args: Vec<String>) -> Result<String, String> {
    executor::execute_command(&command, &args)
}

// ... other SDK commands
```

#### `process_commands.rs`
```rust
use tauri::command;
use crate::process::{manager, executor, validator};

#[tauri::command]
pub fn start_process(command: String, cwd: String, args: Vec<String>) -> Result<serde_json::Value, String> {
    validator::validate_command(&command, &args)?;
    manager::start_process(&command, &cwd, &args)
}

#[tauri::command]
pub fn cancel_process(process_id: String) -> Result<(), String> {
    manager::cancel_process(&process_id)
}

// ... other process commands
```

### 3. **Process Module** (`src-tauri/src/process/`)

#### `mod.rs`
```rust
pub mod manager;
pub mod executor;
pub mod validator;
pub mod timeout;

pub use manager::*;
pub use executor::*;
pub use validator::*;
pub use timeout::*;
```

#### `manager.rs`
```rust
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use std::process::Child;

// Global storage for running processes
static RUNNING_PROCESSES: Lazy<Mutex<HashMap<String, Child>>> = Lazy::new(|| Mutex::new(HashMap::new()));

pub fn start_process(command: &str, cwd: &str, args: &[String]) -> Result<serde_json::Value, String> {
    // Process start logic
}

pub fn cancel_process(process_id: &str) -> Result<(), String> {
    // Process cancellation logic
}

pub fn get_running_processes() -> Result<Vec<String>, String> {
    // Get running processes logic
}
```

#### `executor.rs`
```rust
use std::process::{Command, Stdio};
use std::env;
use crate::process::timeout::TimeoutConfig;

pub fn execute_command(command: &str, args: &[String]) -> Result<String, String> {
    // Command execution logic
}

pub fn execute_command_in_directory(
    command: &str, 
    args: &[String], 
    working_directory: &str
) -> Result<String, String> {
    // Directory-based command execution
}

pub fn execute_command_live(
    command: &str,
    args: &[String],
    working_directory: Option<&str>,
    process_id: &str,
    window: tauri::Window
) -> Result<CommandResult, String> {
    // Live command execution
}
```

#### `validator.rs`
```rust
pub fn validate_command(command: &str, args: &[String]) -> Result<(), String> {
    // Command validation logic
}

pub fn validate_working_directory(cwd: &str) -> Result<(), String> {
    // Working directory validation
}
```

#### `timeout.rs`
```rust
use std::time::Duration;

pub struct TimeoutConfig {
    pub duration: Duration,
    pub is_long_running: bool,
}

pub fn get_timeout_config(command: &str) -> TimeoutConfig {
    // Timeout configuration logic
}
```

### 4. **SDK Module** (`src-tauri/src/sdk/`)

#### `mod.rs`
```rust
pub mod detector;
pub mod manager;

pub use detector::*;
pub use manager::*;
```

#### `detector.rs`
```rust
use std::process::Command;
use std::env;
use std::path::Path;

pub fn detect_sdk_manager(manager: &str) -> Result<bool, String> {
    // SDK detection logic
}
```

#### `manager.rs`
```rust
pub fn get_shell_info() -> Result<serde_json::Value, String> {
    // Shell information logic
}
```

### 5. **Utils Module** (`src-tauri/src/utils/`)

#### `mod.rs`
```rust
pub mod shell;
pub mod platform;
pub mod validation;

pub use shell::*;
pub use platform::*;
pub use validation::*;
```

#### `shell.rs`
```rust
use std::env;

pub fn get_default_shell() -> String {
    env::var("SHELL").unwrap_or_else(|_| {
        if cfg!(target_os = "windows") {
            "cmd".to_string()
        } else {
            "/bin/bash".to_string()
        }
    })
}
```

#### `platform.rs`
```rust
pub fn is_windows() -> bool {
    cfg!(target_os = "windows")
}

pub fn get_platform_specific_command(command: &str) -> String {
    if is_windows() {
        format!("cmd /c {}", command)
    } else {
        command.to_string()
    }
}
```

#### `validation.rs`
```rust
pub fn validate_path(path: &str) -> Result<(), String> {
    // Path validation logic
}

pub fn validate_file_size(path: &str, max_size: u64) -> Result<(), String> {
    // File size validation
}
```

## Refactored lib.rs

The new `lib.rs` would be much simpler:

```rust
// Core modules
pub mod database;
pub mod migrations;

// Domain modules
pub mod tasks;
pub mod projects;
pub mod frameworks;
pub mod settings;
pub mod k8s;

// New modular structure
pub mod app;
pub mod commands;
pub mod process;
pub mod sdk;
pub mod utils;

// Common utilities
pub mod utils as common_utils;

use app::{create_app, register_handlers};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = create_app();
    
    builder
        .invoke_handler(register_handlers())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Benefits of This Modularization

### 1. **Separation of Concerns**
- Each module has a single responsibility
- Clear boundaries between different functionalities
- Easier to understand and maintain

### 2. **Improved Testability**
- Each module can be tested independently
- Mock dependencies easily
- Better unit test coverage

### 3. **Enhanced Maintainability**
- Changes to one domain don't affect others
- Easier to add new features
- Better code organization

### 4. **Better Code Reusability**
- Common utilities can be shared
- Process management can be reused
- Platform-specific code is isolated

### 5. **Reduced Complexity**
- Smaller, focused files
- Clear module structure
- Easier to navigate

## Migration Strategy

### Phase 1: Create New Structure
1. Create the new module directories
2. Move existing code to appropriate modules
3. Update imports and exports

### Phase 2: Refactor Commands
1. Split command handlers by domain
2. Extract common patterns
3. Improve error handling

### Phase 3: Extract Process Management
1. Move process logic to dedicated module
2. Improve timeout handling
3. Add better error handling

### Phase 4: Clean Up
1. Remove old code from lib.rs
2. Update documentation
3. Add comprehensive tests

## Implementation Priority

1. **High Priority**: Process management module (most complex)
2. **Medium Priority**: Command handlers (most numerous)
3. **Low Priority**: Utility modules (easiest to extract)

This modularization will significantly improve the maintainability and scalability of the codebase while following Rust best practices for module organization.
