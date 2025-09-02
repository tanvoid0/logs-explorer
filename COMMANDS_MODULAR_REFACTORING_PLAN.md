# Commands Modular Refactoring Plan - Domain-Driven Approach

## Current Issue

The current approach has all Tauri commands in a separate `commands/` module, which violates domain-driven design principles. Commands should be co-located with their respective domains.

## Improved Domain-Driven Structure

```
src-tauri/src/
├── lib.rs                           # Main entry point
├── database.rs                      # Central database manager
├── tasks/
│   ├── entities/                    # Task entities
│   ├── services/                    # Task services
│   ├── repositories/                # Task database repositories
│   ├── commands.rs                  # ✅ NEW: Task-related Tauri commands
│   └── utils/                       # Task utilities
├── settings/
│   ├── entities/                    # Settings entities
│   ├── services/                    # Settings services
│   ├── repositories/                # Settings database repositories
│   └── commands.rs                  # ✅ NEW: Settings-related Tauri commands
├── projects/
│   ├── entities/                    # Project entities
│   ├── services/                    # Project services
│   ├── repositories/                # Project database repositories
│   └── commands.rs                  # ✅ NEW: Project-related Tauri commands
├── sdk/
│   ├── detector.rs                  # SDK detection logic
│   ├── manager.rs                   # SDK management logic
│   └── commands.rs                  # ✅ NEW: SDK-related Tauri commands
├── process/
│   ├── manager.rs                   # Process management
│   ├── executor.rs                  # Command execution
│   ├── validator.rs                 # Input validation
│   ├── timeout.rs                   # Timeout handling
│   └── commands.rs                  # ✅ NEW: Process-related Tauri commands
└── commands.rs                      # ✅ NEW: Central commands registry
```

## Detailed Implementation

### 1. **Central Commands Registry** (`src-tauri/src/commands.rs`)

```rust
use tauri::generate_handler;

// Import all domain commands
use crate::tasks::commands::*;
use crate::settings::commands::*;
use crate::projects::commands::*;
use crate::sdk::commands::*;
use crate::process::commands::*;

/// Register all Tauri command handlers from all domains
pub fn register_all_handlers() -> Vec<tauri::InvokeHandler> {
    vec![
        generate_handler![
            // Task commands
            get_all_task_groups,
            get_task_groups_by_resource,
            add_task_group,
            update_task_group,
            delete_task_group,
            link_task_group_to_resource,
            unlink_task_group,
            get_all_tasks,
            get_tasks_by_group,
            get_subtasks,
            add_task,
            update_task,
            delete_task,
            delete_tasks_by_group,
            
            // Settings commands
            get_all_ides,
            add_ide,
            update_ide,
            delete_ide,
            set_default_ide,
            get_default_ide,
            open_ide,
            detect_installed_ides,
            get_all_framework_ide_mappings,
            add_framework_ide_mapping,
            delete_framework_ide_mapping,
            
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
            
            // SDK commands
            detect_sdk_manager,
            execute_command,
            execute_command_in_directory,
            get_shell_info,
            
            // Process commands
            start_process,
            read_process_output,
            is_process_running,
            get_process_exit_code,
            kill_process,
            read_file,
            execute_command_live,
            cancel_command,
            cancel_process,
            cancel_all_processes,
            get_running_processes,
        ]
    ]
}
```

### 2. **Tasks Domain Commands** (`src-tauri/src/tasks/commands.rs`)

```rust
use tauri::command;
use crate::tasks::services::{TaskService, TaskGroupService};
use crate::database::DatabaseManager;

#[command]
pub async fn get_all_task_groups(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::tasks::entities::task_group::Model>, String> {
    let service = TaskGroupService::new(&db_manager);
    service.get_all_task_groups().await.map_err(|e| e.to_string())
}

#[command]
pub async fn get_task_groups_by_resource(
    resource_type: String,
    resource_id: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<Vec<crate::tasks::entities::task_group::Model>, String> {
    let service = TaskGroupService::new(&db_manager);
    service.get_task_groups_by_resource(&resource_type, &resource_id).await.map_err(|e| e.to_string())
}

#[command]
pub async fn add_task_group(
    name: String,
    description: Option<String>,
    color: String,
    resource_link_type: Option<String>,
    resource_link_id: Option<String>,
    resource_link_name: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::tasks::entities::task_group::Model, String> {
    let service = TaskGroupService::new(&db_manager);
    service.create_task_group(name, description, color, resource_link_type, resource_link_id, resource_link_name).await.map_err(|e| e.to_string())
}

// ... other task commands
```

### 3. **Settings Domain Commands** (`src-tauri/src/settings/commands.rs`)

```rust
use tauri::command;
use crate::settings::services::IdeSettingsService;
use crate::database::DatabaseManager;

#[command]
pub async fn get_all_ides(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::settings::entities::IdeConfigModel>, String> {
    let service = IdeSettingsService::new(&db_manager);
    service.get_all_ides().await.map_err(|e| e.to_string())
}

#[command]
pub async fn add_ide(
    name: String,
    executable: String,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::settings::entities::IdeConfigModel, String> {
    let service = IdeSettingsService::new(&db_manager);
    service.create_ide(name, executable).await.map_err(|e| e.to_string())
}

// ... other settings commands
```

### 4. **Projects Domain Commands** (`src-tauri/src/projects/commands.rs`)

```rust
use tauri::command;
use crate::projects::services::ProjectService;
use crate::database::DatabaseManager;

#[command]
pub async fn get_all_projects(db_manager: tauri::State<'_, DatabaseManager>) -> Result<Vec<crate::projects::entities::ProjectModel>, String> {
    let service = ProjectService::new(&db_manager);
    service.get_all_projects().await.map_err(|e| e.to_string())
}

#[command]
pub async fn add_project(
    name: String,
    path: String,
    framework: Option<String>,
    deployment: Option<String>,
    db_manager: tauri::State<'_, DatabaseManager>
) -> Result<crate::projects::entities::ProjectModel, String> {
    let service = ProjectService::new(&db_manager);
    service.create_project(name, path, framework, deployment).await.map_err(|e| e.to_string())
}

// ... other project commands
```

### 5. **SDK Domain Commands** (`src-tauri/src/sdk/commands.rs`)

```rust
use tauri::command;
use crate::sdk::{detector, manager};

#[command]
pub async fn detect_sdk_manager(manager: String) -> Result<bool, String> {
    detector::detect_sdk_manager(&manager)
}

#[command]
pub async fn execute_command(command: String, args: Vec<String>) -> Result<String, String> {
    crate::process::executor::execute_command(&command, &args)
}

#[command]
pub async fn execute_command_in_directory(
    command: String,
    args: Vec<String>,
    working_directory: String
) -> Result<String, String> {
    crate::process::executor::execute_command_in_directory(&command, &args, &working_directory)
}

#[command]
pub async fn get_shell_info() -> Result<serde_json::Value, String> {
    manager::get_shell_info()
}
```

### 6. **Process Domain Commands** (`src-tauri/src/process/commands.rs`)

```rust
use tauri::command;
use crate::process::{manager, executor, validator};

#[command]
pub async fn start_process(
    command: String,
    cwd: String,
    args: Vec<String>
) -> Result<serde_json::Value, String> {
    manager::start_process(&command, &cwd, &args)
}

#[command]
pub async fn read_process_output(process_id: String) -> Result<String, String> {
    manager::read_process_output(&process_id)
}

#[command]
pub async fn is_process_running(process_id: String) -> Result<bool, String> {
    manager::is_process_running(&process_id)
}

#[command]
pub async fn get_process_exit_code(process_id: String) -> Result<i32, String> {
    manager::get_process_exit_code(&process_id)
}

#[command]
pub async fn kill_process(process_id: String) -> Result<(), String> {
    manager::kill_process(&process_id)
}

#[command]
pub async fn read_file(path: String) -> Result<String, String> {
    executor::read_file(&path)
}

#[command]
pub async fn execute_command_live(
    command: String,
    args: Vec<String>,
    working_directory: Option<String>,
    process_id: String,
    window: tauri::Window
) -> Result<manager::CommandResult, String> {
    executor::execute_command_live(&command, &args, working_directory.as_deref(), &process_id, window)
}

#[command]
pub async fn cancel_command(process_id: String) -> Result<(), String> {
    manager::cancel_process(&process_id)
}

#[command]
pub async fn cancel_process(process_id: String) -> Result<(), String> {
    manager::cancel_process(&process_id)
}

#[command]
pub async fn cancel_all_processes() -> Result<(), String> {
    manager::cancel_all_processes()
}

#[command]
pub async fn get_running_processes() -> Result<Vec<String>, String> {
    manager::get_running_processes()
}
```

### 7. **Updated Main Entry Point** (`src-tauri/src/lib.rs`)

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

// Infrastructure modules
pub mod process;
pub mod sdk;

// Common utilities
pub mod utils;

// Central commands registry
pub mod commands;

use tauri::Builder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init());

    builder
        .invoke_handler(commands::register_all_handlers())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Benefits of This Approach

### 1. **Domain Cohesion**
- ✅ Commands are co-located with their domain logic
- ✅ Easy to find and understand domain-specific operations
- ✅ Clear boundaries between domains

### 2. **Better Maintainability**
- ✅ Changes to a domain include all related code
- ✅ Easier to understand domain-specific commands
- ✅ Reduced coupling between modules

### 3. **Improved Organization**
- ✅ Logical grouping by domain
- ✅ Consistent patterns across domains
- ✅ Easy to navigate and understand

### 4. **Enhanced Testability**
- ✅ Domain-specific command testing
- ✅ Better isolation for unit tests
- ✅ Easier to mock domain dependencies

### 5. **Scalability**
- ✅ Easy to add new domains
- ✅ Clear patterns for command organization
- ✅ Consistent structure across domains

## Migration Strategy

### Phase 1: Create Domain Commands
1. Create `commands.rs` files in each domain module
2. Move relevant commands from `commands/` module
3. Update imports and dependencies

### Phase 2: Create Central Registry
1. Create `src-tauri/src/commands.rs`
2. Import all domain commands
3. Register all handlers in one place

### Phase 3: Update Main Entry Point
1. Update `lib.rs` to use central commands registry
2. Remove old `commands/` module
3. Update documentation

### Phase 4: Clean Up
1. Remove old command files
2. Update tests
3. Add comprehensive documentation

## Implementation Priority

1. **High Priority**: Tasks domain commands (most complex)
2. **Medium Priority**: Settings and Projects domain commands
3. **Low Priority**: SDK and Process domain commands (most straightforward)

This domain-driven approach properly separates concerns and follows Rust best practices for module organization while maintaining clean architecture principles.
