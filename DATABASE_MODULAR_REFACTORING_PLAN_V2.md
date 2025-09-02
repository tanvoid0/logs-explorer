# Database Modular Refactoring Plan V2 - Domain-Driven Structure

## Current Issue with Previous Approach

The previous approach was mixing concerns by putting all database operations in a separate `database/` module. This violates the domain-driven design principle where each domain should own its data access layer.

## Improved Domain-Driven Structure

```
src-tauri/src/
├── database.rs                      # Central database manager (connection only)
├── tasks/
│   ├── entities/                    # Task entities (existing)
│   ├── services/                    # Task services (existing)
│   └── repositories/                # NEW: Task database repositories
│       ├── mod.rs                   # Task repositories module
│       ├── task_groups.rs           # Task group repository
│       └── tasks.rs                 # Task repository
├── settings/
│   ├── entities/                    # Settings entities (existing)
│   ├── services/                    # Settings services (existing)
│   └── repositories/                # NEW: Settings database repositories
│       ├── mod.rs                   # Settings repositories module
│       ├── ide_configs.rs           # IDE config repository
│       └── framework_mappings.rs    # Framework mapping repository
├── projects/
│   ├── entities/                    # Project entities (existing)
│   ├── services/                    # Project services (existing)
│   └── repositories/                # NEW: Project database repositories
│       ├── mod.rs                   # Project repositories module
│       └── projects.rs              # Project repository
└── frameworks/
    ├── entities/                    # Framework entities (existing)
    ├── services/                    # Framework services (existing)
    └── repositories/                # NEW: Framework database repositories
        ├── mod.rs                   # Framework repositories module
        ├── frameworks.rs            # Framework repository
        └── detections.rs            # Framework detection repository
```

## Detailed Implementation

### 1. **Central Database Manager** (`src-tauri/src/database.rs`)

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
        let app_dir = std::env::current_dir().unwrap().join("data");
        std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");
        
        let db_path = app_dir.join("logs-explorer.db");
        let database_url = format!("sqlite://{}?mode=rwc", db_path.display());
        
        let conn = Database::connect(&database_url).await?;
        
        // Run migrations
        Self::run_migrations(&conn).await?;
        
        Ok(DatabaseManager { conn })
    }
    
    async fn run_migrations(conn: &DatabaseConnection) -> Result<(), sea_orm::DbErr> {
        // Migration execution logic
    }
    
    /// Get a reference to the database connection
    pub fn get_connection(&self) -> &DatabaseConnection {
        &self.conn
    }
    
    /// Get a clone of the database connection for repositories
    pub fn get_connection_clone(&self) -> DatabaseConnection {
        self.conn.clone()
    }
}
```

### 2. **Tasks Domain Repositories** (`src-tauri/src/tasks/repositories/`)

#### `mod.rs`
```rust
pub mod task_groups;
pub mod tasks;

pub use task_groups::TaskGroupRepository;
pub use tasks::TaskRepository;

// Factory function to create task repositories
pub fn create_task_repositories(conn: sea_orm::DatabaseConnection) -> (TaskGroupRepository, TaskRepository) {
    (
        TaskGroupRepository::new(conn.clone()),
        TaskRepository::new(conn)
    )
}
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
        task_group::Entity::find()
            .order_by_desc(task_group::Column::CreatedAt)
            .all(&self.conn)
            .await
    }
    
    // ... other methods
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
        task::Entity::find()
            .order_by_desc(task::Column::CreatedAt)
            .all(&self.conn)
            .await
    }
    
    // ... other methods
}
```

### 3. **Settings Domain Repositories** (`src-tauri/src/settings/repositories/`)

#### `mod.rs`
```rust
pub mod ide_configs;
pub mod framework_mappings;

pub use ide_configs::IdeConfigRepository;
pub use framework_mappings::FrameworkMappingRepository;

// Factory function to create settings repositories
pub fn create_settings_repositories(conn: sea_orm::DatabaseConnection) -> (IdeConfigRepository, FrameworkMappingRepository) {
    (
        IdeConfigRepository::new(conn.clone()),
        FrameworkMappingRepository::new(conn)
    )
}
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
        IdeConfigEntity::find()
            .order_by(IdeConfigColumn::Name, sea_orm::Order::Asc)
            .all(&self.conn)
            .await
    }
    
    // ... other methods
}
```

### 4. **Projects Domain Repositories** (`src-tauri/src/projects/repositories/`)

#### `mod.rs`
```rust
pub mod projects;

pub use projects::ProjectRepository;

// Factory function to create project repositories
pub fn create_project_repositories(conn: sea_orm::DatabaseConnection) -> ProjectRepository {
    ProjectRepository::new(conn)
}
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
        ProjectEntity::find()
            .order_by_desc(ProjectColumn::CreatedAt)
            .all(&self.conn)
            .await
    }
    
    // ... other methods
}
```

### 5. **Frameworks Domain Repositories** (`src-tauri/src/frameworks/repositories/`)

#### `mod.rs`
```rust
pub mod frameworks;
pub mod detections;

pub use frameworks::FrameworkRepository;
pub use detections::FrameworkDetectionRepository;

// Factory function to create framework repositories
pub fn create_framework_repositories(conn: sea_orm::DatabaseConnection) -> (FrameworkRepository, FrameworkDetectionRepository) {
    (
        FrameworkRepository::new(conn.clone()),
        FrameworkDetectionRepository::new(conn)
    )
}
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
        FrameworkEntity::find()
            .order_by(FrameworkColumn::Name, sea_orm::Order::Asc)
            .all(&self.conn)
            .await
    }
    
    // ... other methods
}
```

## Updated Service Layer Integration

### Example: Task Service with Repositories

```rust
// src-tauri/src/tasks/services/task_service.rs
use crate::database::DatabaseManager;
use crate::tasks::repositories::{TaskRepository, TaskGroupRepository, create_task_repositories};
use crate::tasks::entities::{task_group, task};
use uuid::Uuid;
use chrono::Utc;

pub struct TaskService {
    task_repo: TaskRepository,
    group_repo: TaskGroupRepository,
}

impl TaskService {
    pub fn new(db_manager: &DatabaseManager) -> Self {
        let conn = db_manager.get_connection_clone();
        let (group_repo, task_repo) = create_task_repositories(conn);
        
        Self {
            task_repo,
            group_repo,
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

### Example: Settings Service with Repositories

```rust
// src-tauri/src/settings/services/ide_settings_service.rs
use crate::database::DatabaseManager;
use crate::settings::repositories::{IdeConfigRepository, create_settings_repositories};
use crate::settings::entities::{IdeConfigModel, IdeConfigActiveModel};
use chrono::Utc;

pub struct IdeSettingsService {
    ide_repo: IdeConfigRepository,
}

impl IdeSettingsService {
    pub fn new(db_manager: &DatabaseManager) -> Self {
        let conn = db_manager.get_connection_clone();
        let (ide_repo, _) = create_settings_repositories(conn);
        
        Self {
            ide_repo,
        }
    }
    
    pub async fn get_all_ides(&self) -> Result<Vec<IdeConfigModel>, sea_orm::DbErr> {
        self.ide_repo.get_all().await
    }
    
    pub async fn create_ide(&self, name: String, executable: String) -> Result<IdeConfigModel, sea_orm::DbErr> {
        let ide = IdeConfigActiveModel {
            name: Set(name),
            executable: Set(executable),
            is_default: Set(false),
            created_at: Set(Some(Utc::now().naive_utc())),
            updated_at: Set(Some(Utc::now().naive_utc())),
            ..Default::default()
        };
        
        self.ide_repo.add(ide).await
    }
    
    // ... other methods
}
```

## Benefits of This Domain-Driven Approach

### 1. **Proper Separation of Concerns**
- Each domain owns its data access layer
- Database operations are co-located with domain logic
- Clear boundaries between domains

### 2. **Better Maintainability**
- Changes to a domain don't affect others
- Easier to understand domain-specific database operations
- Reduced coupling between modules

### 3. **Improved Testability**
- Each repository can be tested independently
- Domain-specific test data and scenarios
- Better isolation for unit tests

### 4. **Enhanced Scalability**
- Easy to add new domains
- Clear patterns for database operations
- Consistent repository structure

### 5. **Domain-Driven Design Compliance**
- Follows DDD principles
- Each domain is self-contained
- Clear domain boundaries

## Migration Strategy

### Phase 1: Create Domain Repositories
1. Create repository modules in each domain
2. Move database operations from central database.rs
3. Update domain services to use repositories

### Phase 2: Update Service Layer
1. Update all services to use new repositories
2. Maintain backward compatibility
3. Add proper error handling

### Phase 3: Clean Up
1. Remove old database operations from central database.rs
2. Update documentation
3. Add comprehensive tests

## Implementation Priority

1. **High Priority**: Tasks domain (most complex)
2. **Medium Priority**: Settings and Projects domains
3. **Low Priority**: Frameworks domain (most straightforward)

This domain-driven approach properly separates concerns and follows Rust best practices for module organization while maintaining clean architecture principles.
