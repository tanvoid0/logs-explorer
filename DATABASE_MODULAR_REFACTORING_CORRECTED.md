# Database Modular Refactoring - Corrected Domain-Driven Approach

## Issue with Previous Approach

The previous approach incorrectly placed repositories in a separate `database/` module, which violates domain-driven design principles. Repositories should be co-located with their respective domains.

## Corrected Domain-Driven Structure

```
src-tauri/src/
├── database.rs                      # Central database manager (connection only)
├── tasks/
│   ├── entities/                    # Task entities
│   ├── services/                    # Task services
│   ├── repositories/                # ✅ Task database repositories
│   │   ├── mod.rs                   # Task repositories module
│   │   ├── task_groups.rs           # Task group repository
│   │   └── tasks.rs                 # Task repository
│   ├── commands.rs                  # Task Tauri commands
│   └── utils/                       # Task utilities
├── settings/
│   ├── entities/                    # Settings entities
│   ├── services/                    # Settings services
│   ├── repositories/                # ✅ Settings database repositories
│   │   ├── mod.rs                   # Settings repositories module
│   │   ├── ide_configs.rs           # IDE config repository
│   │   └── framework_mappings.rs    # Framework mapping repository
│   └── commands.rs                  # Settings Tauri commands
├── projects/
│   ├── entities/                    # Project entities
│   ├── services/                    # Project services
│   ├── repositories/                # ✅ Project database repositories
│   │   ├── mod.rs                   # Project repositories module
│   │   └── projects.rs              # Project repository
│   └── commands.rs                  # Project Tauri commands
└── frameworks/
    ├── entities/                    # Framework entities
    ├── services/                    # Framework services
    ├── repositories/                # ✅ Framework database repositories
    │   ├── mod.rs                   # Framework repositories module
    │   ├── frameworks.rs            # Framework repository
    │   └── detections.rs            # Framework detection repository
    └── commands.rs                  # Framework Tauri commands
```

## Key Principles

### 1. **Domain Ownership**
- Each domain owns its data access layer (repositories)
- Repositories are co-located with domain entities, services, and commands
- Clear domain boundaries and responsibilities

### 2. **Central Database Manager**
- `database.rs` only handles connection management and migrations
- Provides connection sharing via `get_connection()` and `get_connection_clone()`
- No domain-specific operations

### 3. **Repository Pattern**
- Each domain has its own repository modules
- Factory functions for easy instantiation
- Consistent patterns across domains

## Implementation Strategy

### Phase 1: Create Domain Repositories
1. Create `repositories/` directories in each domain module
2. Move database operations from central `database.rs` to domain repositories
3. Update domain services to use new repositories

### Phase 2: Update Service Layer
1. Update services to use domain-specific repositories
2. Maintain backward compatibility
3. Add proper error handling

### Phase 3: Clean Up
1. Remove old database operations from central `database.rs`
2. Update documentation
3. Add comprehensive tests

## Benefits of Corrected Approach

### 1. **Proper Domain Cohesion**
- ✅ Repositories are co-located with domain logic
- ✅ Easy to find and understand domain-specific operations
- ✅ Clear boundaries between domains

### 2. **Better Maintainability**
- ✅ Changes to a domain include all related code
- ✅ Easier to understand domain-specific database operations
- ✅ Reduced coupling between modules

### 3. **Enhanced Testability**
- ✅ Each repository can be tested independently
- ✅ Domain-specific test data and scenarios
- ✅ Better isolation for unit tests

### 4. **Domain-Driven Design Compliance**
- ✅ Follows DDD principles
- ✅ Each domain is self-contained
- ✅ Clear domain boundaries

## Next Steps

1. **Create Domain Repositories**: Implement repositories in each domain module
2. **Update Services**: Modify services to use domain-specific repositories
3. **Add Tests**: Comprehensive unit and integration tests
4. **Documentation**: Update API documentation and usage examples

This corrected approach properly follows domain-driven design principles and Rust best practices for module organization.
