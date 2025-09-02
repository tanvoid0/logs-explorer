# Database.rs Modular Refactoring Plan

## Current State Analysis

The current `database.rs` file (717 lines) contains database operations for multiple domains:

1. **Database Connection Management** - Connection setup and migration handling
2. **Task Management** - Task groups and tasks CRUD operations
3. **IDE Settings** - IDE configuration management
4. **Project Management** - Projects CRUD operations
5. **Framework Management** - Frameworks and framework detections
6. **Framework IDE Mappings** - Framework-to-IDE mappings

## Proposed Modular Structure

```
src-tauri/src/database/
├── mod.rs                          # Main database module
├── connection.rs                   # Database connection and migration management
├── tasks/
│   ├── mod.rs                      # Tasks module
│   ├── task_groups.rs              # Task group operations
│   └── tasks.rs                    # Task operations
├── settings/
│   ├── mod.rs                      # Settings module
│   ├── ide_configs.rs              # IDE configuration operations
│   └── framework_mappings.rs       # Framework IDE mapping operations
├── projects/
│   ├── mod.rs                      # Projects module
│   └── projects.rs                 # Project operations
└── frameworks/
    ├── mod.rs                      # Frameworks module
    ├── frameworks.rs               # Framework operations
    └── detections.rs               # Framework detection operations
```

## Detailed Module Breakdown

### 1. **Main Database Module** (`src-tauri/src/database/mod.rs`)

```rust
pub mod connection;
pub mod tasks;
pub mod settings;
pub mod projects;
pub mod frameworks;

pub use connection::DatabaseManager;
pub use tasks::*;
pub use settings::*;
pub use projects::*;
pub use frameworks::*;

// Re-export the main database manager for backward compatibility
pub use connection::DatabaseManager as Database;
```

### 2. **Connection Management** (`src-tauri/src/database/connection.rs`)

```rust
use sea_orm::{Database, DatabaseConnection};
use tauri::AppHandle;
use sea_orm_migration::MigrationTrait;

pub struct DatabaseManager {
    conn: DatabaseConnection,
}

impl DatabaseManager {
    pub async fn new(app_handle: &AppHandle) -> Result<Self, sea_orm::DbErr> {
        // Database connection setup
    }
    
    async fn run_migrations(conn: &DatabaseConnection) -> Result<(), sea_orm::DbErr> {
        // Migration execution
    }
    
    pub fn get_connection(&self) -> &DatabaseConnection {
        &self.conn
    }
}
```

### 3. **Tasks Module** (`src-tauri/src/database/tasks/`)

#### `mod.rs`
```rust
pub mod task_groups;
pub mod tasks;

pub use task_groups::*;
pub use tasks::*;
```

#### `task_groups.rs`
```rust
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, QueryOrder};
use chrono::Utc;
use crate::tasks::entities::task_group;

pub struct TaskGroupRepository {
    conn: sea_orm::DatabaseConnection,
}

impl TaskGroupRepository {
    pub fn new(conn: sea_orm::DatabaseConnection) -> Self {
        Self { conn }
    }
    
    pub async fn get_all(&self) -> Result<Vec<task_group::Model>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_by_resource(&self, resource_type: &str, resource_id: &str) -> Result<Vec<task_group::Model>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn add(&self, group: task_group::ActiveModel) -> Result<task_group::Model, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn update(&self, uuid: &str, name: &str, description: Option<&str>, color: &str) -> Result<Option<task_group::Model>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn delete(&self, uuid: &str) -> Result<bool, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn link_to_resource(&self, uuid: &str, resource_type: &str, resource_id: &str, resource_name: &str) -> Result<Option<task_group::Model>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn unlink(&self, uuid: &str) -> Result<Option<task_group::Model>, sea_orm::DbErr> {
        // Implementation
    }
}
```

#### `tasks.rs`
```rust
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, QueryOrder};
use chrono::{Utc, NaiveDateTime};
use crate::tasks::entities::task;

pub struct TaskRepository {
    conn: sea_orm::DatabaseConnection,
}

impl TaskRepository {
    pub fn new(conn: sea_orm::DatabaseConnection) -> Self {
        Self { conn }
    }
    
    pub async fn get_all(&self) -> Result<Vec<task::Model>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_by_group(&self, group_id: &str) -> Result<Vec<task::Model>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_subtasks(&self, parent_id: &str) -> Result<Vec<task::Model>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn add(&self, task: task::ActiveModel) -> Result<task::Model, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn update(&self, uuid: &str, title: &str, description: Option<&str>, status: &str, priority: &str, due_date: Option<NaiveDateTime>) -> Result<Option<task::Model>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn delete(&self, uuid: &str) -> Result<bool, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn delete_by_group(&self, group_id: &str) -> Result<u64, sea_orm::DbErr> {
        // Implementation
    }
}
```

### 4. **Settings Module** (`src-tauri/src/database/settings/`)

#### `mod.rs`
```rust
pub mod ide_configs;
pub mod framework_mappings;

pub use ide_configs::*;
pub use framework_mappings::*;
```

#### `ide_configs.rs`
```rust
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, QueryOrder};
use chrono::Utc;
use crate::settings::entities::{IdeConfigEntity, IdeConfigModel, IdeConfigActiveModel, IdeConfigColumn};

pub struct IdeConfigRepository {
    conn: sea_orm::DatabaseConnection,
}

impl IdeConfigRepository {
    pub fn new(conn: sea_orm::DatabaseConnection) -> Self {
        Self { conn }
    }
    
    pub async fn get_all(&self) -> Result<Vec<IdeConfigModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_default(&self) -> Result<Option<IdeConfigModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn add(&self, ide: IdeConfigActiveModel) -> Result<IdeConfigModel, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn update(&self, id: i32, name: &str, executable: &str) -> Result<Option<IdeConfigModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn delete(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn set_default(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        // Implementation
    }
}
```

#### `framework_mappings.rs`
```rust
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, QueryOrder};
use crate::settings::entities::{FrameworkIdeMappingEntity, FrameworkIdeMappingModel, FrameworkIdeMappingActiveModel, FrameworkIdeMappingColumn, IdeConfigModel, IdeConfigEntity};

pub struct FrameworkMappingRepository {
    conn: sea_orm::DatabaseConnection,
}

impl FrameworkMappingRepository {
    pub fn new(conn: sea_orm::DatabaseConnection) -> Self {
        Self { conn }
    }
    
    pub async fn get_all(&self) -> Result<Vec<FrameworkIdeMappingModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_by_framework(&self, framework: &str) -> Result<Option<IdeConfigModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn add(&self, mapping: FrameworkIdeMappingActiveModel) -> Result<FrameworkIdeMappingModel, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn delete(&self, framework: &str) -> Result<bool, sea_orm::DbErr> {
        // Implementation
    }
}
```

### 5. **Projects Module** (`src-tauri/src/database/projects/`)

#### `mod.rs`
```rust
pub mod projects;

pub use projects::*;
```

#### `projects.rs`
```rust
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, QueryOrder};
use chrono::Utc;
use crate::projects::entities::{ProjectEntity, ProjectModel, ProjectActiveModel, ProjectColumn};

pub struct ProjectRepository {
    conn: sea_orm::DatabaseConnection,
}

impl ProjectRepository {
    pub fn new(conn: sea_orm::DatabaseConnection) -> Self {
        Self { conn }
    }
    
    pub async fn get_all(&self) -> Result<Vec<ProjectModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_by_id(&self, id: i32) -> Result<Option<ProjectModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn add(&self, project: ProjectActiveModel) -> Result<ProjectModel, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn update(&self, id: i32, name: &str, path: &str, framework: Option<&str>, deployment: Option<&str>) -> Result<Option<ProjectModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn delete(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn toggle_star(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_with_filters(&self, framework_filter: Option<&str>, sort_by: &str, search_query: Option<&str>) -> Result<Vec<ProjectModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_frameworks(&self) -> Result<Vec<String>, sea_orm::DbErr> {
        // Implementation
    }
}
```

### 6. **Frameworks Module** (`src-tauri/src/database/frameworks/`)

#### `mod.rs`
```rust
pub mod frameworks;
pub mod detections;

pub use frameworks::*;
pub use detections::*;
```

#### `frameworks.rs`
```rust
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, QueryOrder, QuerySelect};
use chrono::Utc;
use crate::frameworks::entities::{FrameworkEntity, FrameworkModel, FrameworkActiveModel, FrameworkColumn};

pub struct FrameworkRepository {
    conn: sea_orm::DatabaseConnection,
}

impl FrameworkRepository {
    pub fn new(conn: sea_orm::DatabaseConnection) -> Self {
        Self { conn }
    }
    
    pub async fn get_all(&self) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_active(&self) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_by_id(&self, id: i32) -> Result<Option<FrameworkModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_by_name(&self, name: &str) -> Result<Option<FrameworkModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn add(&self, framework: FrameworkActiveModel) -> Result<FrameworkModel, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn update(&self, id: i32, name: &str, category: &str, description: Option<&str>, version: Option<&str>, website: Option<&str>, documentation_url: Option<&str>) -> Result<Option<FrameworkModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn delete(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn toggle_active(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_by_category(&self, category: &str) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_categories(&self) -> Result<Vec<String>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn search(&self, query: &str) -> Result<Vec<FrameworkModel>, sea_orm::DbErr> {
        // Implementation
    }
}
```

#### `detections.rs`
```rust
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait, QueryOrder, QuerySelect, PaginatorTrait};
use crate::frameworks::entities::{FrameworkDetectionEntity, FrameworkDetectionModel, FrameworkDetectionActiveModel, FrameworkDetectionColumn};

pub struct FrameworkDetectionRepository {
    conn: sea_orm::DatabaseConnection,
}

impl FrameworkDetectionRepository {
    pub fn new(conn: sea_orm::DatabaseConnection) -> Self {
        Self { conn }
    }
    
    pub async fn get_all(&self) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_by_project_path(&self, project_path: &str) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_by_framework(&self, framework_id: i32) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn add(&self, detection: FrameworkDetectionActiveModel) -> Result<FrameworkDetectionModel, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn update(&self, id: i32, confidence_score: f64, detected_files: Option<String>, metadata: Option<String>) -> Result<Option<FrameworkDetectionModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn delete(&self, id: i32) -> Result<bool, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_total_count(&self) -> Result<u64, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_unique_projects_count(&self) -> Result<u64, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_top_detected(&self, limit: u64) -> Result<Vec<(String, u64)>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_high_confidence(&self, threshold: f64) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        // Implementation
    }
    
    pub async fn get_recent(&self, limit: u64) -> Result<Vec<FrameworkDetectionModel>, sea_orm::DbErr> {
        // Implementation
    }
}
```

## Updated Service Layer Integration

### Example: Task Service Integration

```rust
// src-tauri/src/tasks/services/task_service.rs
use crate::database::tasks::{TaskRepository, TaskGroupRepository};

pub struct TaskService {
    task_repo: TaskRepository,
    group_repo: TaskGroupRepository,
}

impl TaskService {
    pub fn new(db_manager: &crate::database::DatabaseManager) -> Self {
        let conn = db_manager.get_connection().clone();
        Self {
            task_repo: TaskRepository::new(conn.clone()),
            group_repo: TaskGroupRepository::new(conn),
        }
    }
    
    pub async fn get_all_task_groups(&self) -> Result<Vec<task_group::Model>, sea_orm::DbErr> {
        self.group_repo.get_all().await
    }
    
    pub async fn create_task_group(&self, name: String, description: Option<String>, color: String, resource_link_type: Option<String>, resource_link_id: Option<String>, resource_link_name: Option<String>) -> Result<task_group::Model, sea_orm::DbErr> {
        let group = task_group::ActiveModel {
            uuid: Set(Uuid::new_v4().to_string()),
            name: Set(name),
            description: Set(description),
            color: Set(color),
            resource_link_type: Set(resource_link_type),
            resource_link_id: Set(resource_link_id),
            resource_link_name: Set(resource_link_name),
            created_at: Set(Some(Utc::now().naive_utc())),
            updated_at: Set(Some(Utc::now().naive_utc())),
            linked_at: Set(None),
            ..Default::default()
        };
        
        self.group_repo.add(group).await
    }
    
    // ... other methods
}
```

## Benefits of This Modularization

### 1. **Domain Separation**
- Each domain has its own repository
- Clear boundaries between different data operations
- Easier to understand and maintain

### 2. **Improved Testability**
- Each repository can be tested independently
- Mock repositories easily
- Better unit test coverage

### 3. **Enhanced Maintainability**
- Changes to one domain don't affect others
- Easier to add new database operations
- Better code organization

### 4. **Better Code Reusability**
- Repositories can be shared across services
- Common patterns can be extracted
- Reduced code duplication

### 5. **Reduced Complexity**
- Smaller, focused files
- Clear module structure
- Easier to navigate

## Migration Strategy

### Phase 1: Create New Structure
1. Create the new module directories
2. Move existing code to appropriate repositories
3. Update imports and exports

### Phase 2: Update Service Layer
1. Update services to use new repositories
2. Maintain backward compatibility
3. Add proper error handling

### Phase 3: Clean Up
1. Remove old database.rs file
2. Update documentation
3. Add comprehensive tests

## Implementation Priority

1. **High Priority**: Connection management and core repositories
2. **Medium Priority**: Complex query repositories (projects, frameworks)
3. **Low Priority**: Simple CRUD repositories (tasks, settings)

This modularization will significantly improve the maintainability and scalability of the database layer while following Rust best practices for module organization.
