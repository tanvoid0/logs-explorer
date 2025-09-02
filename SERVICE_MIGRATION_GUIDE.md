# Service Migration Guide

This guide helps you migrate from the old API structure to the new modular services architecture.

## Overview

The new service architecture provides:
- **Modular Design**: Each domain has its own service class
- **Singleton Pattern**: Services are singletons for consistent state
- **Type Safety**: Full TypeScript interfaces for all operations
- **Error Handling**: Consistent error handling across all services
- **Reusability**: Services can be used across multiple components

## Service Structure

```
src/lib/services/
├── index.ts                    # Centralized exports
├── tasks/
│   ├── task-service.ts         # Task management
│   └── task-group-service.ts   # Task group management
├── projects/
│   └── project-service.ts      # Project management
├── frameworks/
│   └── framework-service.ts    # Framework management
├── settings/
│   └── settings-service.ts     # Settings management
├── sdk/
│   └── sdk-service.ts          # SDK management
├── process/
│   └── process-service.ts      # Process management
├── automation/
│   └── automation-service.ts   # Automation management
└── k8s/
    └── k8s-service.ts          # Kubernetes management
```

## Migration Steps

### 1. Update Imports

**Before:**
```typescript
import { projectsAPI } from '$lib/api/projects';
import { frameworksAPI } from '$lib/api/frameworks';
import { invoke } from '@tauri-apps/api/core';
```

**After:**
```typescript
import { projectService, frameworkService } from '$lib/services';
// Or import individual services:
import { projectService } from '$lib/services/projects/project-service';
```

### 2. Update Service Calls

#### Projects

**Before:**
```typescript
const projects = await projectsAPI.getAllProjects();
const project = await projectsAPI.addProject(name, path, framework);
```

**After:**
```typescript
const projects = await projectService.getAllProjects();
const project = await projectService.createProject({
  name,
  path,
  framework
});
```

#### Tasks

**Before:**
```typescript
// Direct invoke calls in store
const groups = await invoke('get_all_task_groups');
const tasks = await invoke('get_all_tasks');
```

**After:**
```typescript
import { taskService, taskGroupService } from '$lib/services';

const groups = await taskGroupService.getAllTaskGroups();
const tasks = await taskService.getAllTasks();
```

#### Frameworks

**Before:**
```typescript
const frameworks = await getAllFrameworks();
const framework = await getFramework(id);
```

**After:**
```typescript
const frameworks = await frameworkService.getAllFrameworks();
const framework = await frameworkService.getFramework(id);
```

### 3. Update Store Usage

**Before:**
```typescript
// In task-store.ts
async function loadFromDatabase() {
  const groups = await invoke('get_all_task_groups');
  const allTasks = await invoke('get_all_tasks');
  // ... rest of logic
}
```

**After:**
```typescript
// In task-store.ts
import { taskService, taskGroupService } from '$lib/services';

async function loadFromDatabase() {
  const groups = await taskGroupService.getAllTaskGroups();
  const allTasks = await taskService.getAllTasks();
  // ... rest of logic
}
```

### 4. Update Component Usage

**Before:**
```typescript
// In component
import { projectsAPI } from '$lib/api/projects';

async function handleAddProject() {
  try {
    const projectId = await projectsAPI.addProject(name, path, framework);
    // handle success
  } catch (error) {
    // handle error
  }
}
```

**After:**
```typescript
// In component
import { projectService } from '$lib/services';

async function handleAddProject() {
  try {
    const projectId = await projectService.createProject({
      name,
      path,
      framework
    });
    // handle success
  } catch (error) {
    // handle error
  }
}
```

## Service Features

### Error Handling

All services provide consistent error handling:

```typescript
try {
  const result = await projectService.createProject(request);
  // Success
} catch (error) {
  // Error is already logged by the service
  // You can show user-friendly message
  console.error('User-friendly error message:', error.message);
}
```

### Type Safety

All services use TypeScript interfaces:

```typescript
interface CreateProjectRequest {
  name: string;
  path: string;
  framework?: string;
  deployment?: string;
}

const request: CreateProjectRequest = {
  name: 'My Project',
  path: '/path/to/project',
  framework: 'react'
};

const projectId = await projectService.createProject(request);
```

### Singleton Pattern

Services are singletons, so you get the same instance everywhere:

```typescript
import { projectService } from '$lib/services';
import { projectService as projectService2 } from '$lib/services/projects/project-service';

// These are the same instance
console.log(projectService === projectService2); // true
```

## Migration Checklist

- [ ] Update all imports to use new service structure
- [ ] Replace direct `invoke` calls with service methods
- [ ] Update store files to use services instead of direct API calls
- [ ] Update component files to use services
- [ ] Test all functionality after migration
- [ ] Remove old API files if no longer needed

## Backward Compatibility

The old API files are still available during migration:
- `src/lib/api/projects.ts`
- `src/lib/api/frameworks.ts`
- `src/lib/api/automation.ts`

You can gradually migrate components one by one while keeping the old APIs functional.

## Benefits of New Architecture

1. **Better Organization**: Each domain has its own service
2. **Type Safety**: Full TypeScript support with interfaces
3. **Error Handling**: Consistent error handling across all services
4. **Reusability**: Services can be used across multiple components
5. **Maintainability**: Easier to maintain and extend
6. **Testing**: Easier to unit test individual services
7. **Documentation**: Better self-documenting code with interfaces

## Example Migration

Here's a complete example of migrating a component:

**Before:**
```typescript
// ProjectList.svelte
<script lang="ts">
  import { projectsAPI } from '$lib/api/projects';
  import { onMount } from 'svelte';

  let projects: any[] = [];

  onMount(async () => {
    try {
      projects = await projectsAPI.getAllProjects();
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  });

  async function addProject(name: string, path: string) {
    try {
      const projectId = await projectsAPI.addProject(name, path);
      projects = await projectsAPI.getAllProjects();
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  }
</script>
```

**After:**
```typescript
// ProjectList.svelte
<script lang="ts">
  import { projectService } from '$lib/services';
  import type { Project } from '$lib/services/projects/project-service';
  import { onMount } from 'svelte';

  let projects: Project[] = [];

  onMount(async () => {
    try {
      projects = await projectService.getAllProjects();
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  });

  async function addProject(name: string, path: string) {
    try {
      const projectId = await projectService.createProject({
        name,
        path
      });
      projects = await projectService.getAllProjects();
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  }
</script>
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure you're importing from the correct path
2. **Type Errors**: Check that you're using the correct interfaces
3. **Method Not Found**: Ensure the backend command is implemented
4. **Error Handling**: Services throw errors, so wrap calls in try-catch

### Getting Help

- Check the service interfaces for available methods
- Look at the backend commands list in `MISSING_BACKEND_COMMANDS.md`
- Review existing service implementations for examples
- Check the TypeScript compiler for type errors
