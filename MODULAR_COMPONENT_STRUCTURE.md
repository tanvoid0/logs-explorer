# Modular Component Structure

This document describes the new modular and organized component structure for the Logs Explorer application.

## Overview

The component system is now organized by functionality, making it easier to:
- Find related components
- Maintain consistency across modules
- Reuse components effectively
- Keep pages clean and simple

## Directory Structure

```
src/lib/components/
├── ui/                    # Core UI components
│   ├── card/             # Card components
│   ├── form/             # Form components (Button, Input, Select)
│   ├── feedback/         # Feedback components (Badge, Alert)
│   ├── data/             # Data display components (Table)
│   ├── layout/           # Layout components (Container, Separator)
│   └── index.ts          # UI components index
├── navigation/           # Navigation components
│   ├── Sidebar.svelte
│   ├── TopNavbar.svelte
│   ├── ConnectionStatus.svelte
│   ├── PageTitle.svelte
│   ├── WorkloadTabs.svelte
│   ├── QuickActions.svelte
│   └── index.ts
├── terminal/             # Terminal components
│   ├── CentralizedTerminal.svelte
│   ├── NonBlockingTerminal.svelte
│   ├── SimpleTerminal.svelte
│   ├── Terminal.svelte
│   ├── TerminalManager.svelte
│   └── index.ts
├── pipeline/             # Pipeline components
│   ├── PipelineEditor.svelte
│   ├── PipelineExecutor.svelte
│   └── index.ts
├── sdk/                  # SDK management components
│   ├── SDKManager.svelte
│   ├── SDKManagerCard.svelte
│   └── index.ts
├── tasks/                # Task management components
│   ├── TaskPage.svelte
│   ├── TaskManager.svelte
│   ├── ProjectTaskManager.svelte
│   ├── TaskGroup.svelte
│   ├── TaskItem.svelte
│   ├── TaskFilters.svelte
│   └── index.ts
├── workloads/            # Workload management components
│   ├── LogsViewer.svelte
│   ├── LogsViewerContent.svelte
│   ├── LogsDisplay.svelte
│   ├── LogEntry.svelte
│   ├── LogsSearchPanel.svelte
│   ├── AdvancedSearchPanel.svelte
│   ├── AdvancedFilter.svelte
│   ├── TimeFilter.svelte
│   ├── SeveritySelector.svelte
│   ├── PodSelector.svelte
│   ├── ServiceSelector.svelte
│   ├── DeploymentSelector.svelte
│   ├── NamespaceSelector.svelte
│   ├── ProjectDeploymentSelector.svelte
│   ├── FrameworkSelector.svelte
│   ├── ConfigTreeEditor.svelte
│   ├── ConfigDataViewer.svelte
│   └── index.ts
├── logs/                 # Specialized log components
│   ├── LogEntryCompact.svelte
│   ├── LogsViewer.svelte
│   ├── LogsFilter.svelte
│   └── index.ts
├── toast/                # Toast notification components
│   ├── Toast.svelte
│   ├── ToastContainer.svelte
│   └── index.ts
└── index.ts              # Main components index
```

## Import Patterns

### Before (Inconsistent)
```svelte
<script>
  import Sidebar from "$lib/components/Sidebar.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import LogEntry from "$lib/components/LogEntry.svelte";
  import Toast from "$lib/components/Toast.svelte";
</script>
```

### After (Consistent)
```svelte
<script>
  import { Sidebar } from "$lib/components/navigation/index.js";
  import { Button } from "$lib/components/ui/form/index.js";
  import { LogEntry } from "$lib/components/workloads/index.js";
  import { Toast } from "$lib/components/toast/index.js";
</script>
```

### Alternative: Import from main index
```svelte
<script>
  import { 
    Sidebar, 
    Button, 
    LogEntry, 
    Toast 
  } from "$lib/components/index.js";
</script>
```

## Component Categories

### 1. Navigation Components (`/navigation/`)
Components responsible for navigation, layout, and user interface structure.

**Components:**
- `Sidebar` - Main navigation sidebar
- `TopNavbar` - Top navigation bar
- `ConnectionStatus` - Kubernetes connection status
- `PageTitle` - Page title component
- `WorkloadTabs` - Workload navigation tabs
- `QuickActions` - Quick action buttons

**Usage:**
```svelte
<script>
  import { Sidebar, TopNavbar, ConnectionStatus } from "$lib/components/navigation/index.js";
</script>

<TopNavbar pageTitle="Dashboard" />
<Sidebar />
<ConnectionStatus />
```

### 2. Terminal Components (`/terminal/`)
Components for terminal functionality and command execution.

**Components:**
- `CentralizedTerminal` - Main terminal interface
- `NonBlockingTerminal` - Non-blocking terminal
- `SimpleTerminal` - Simple terminal display
- `Terminal` - Basic terminal component
- `TerminalManager` - Terminal management

**Usage:**
```svelte
<script>
  import { CentralizedTerminal } from "$lib/components/terminal/index.js";
</script>

<CentralizedTerminal />
```

### 3. Pipeline Components (`/pipeline/`)
Components for pipeline editing and execution.

**Components:**
- `PipelineEditor` - Pipeline visual editor
- `PipelineExecutor` - Pipeline execution interface

**Usage:**
```svelte
<script>
  import { PipelineEditor, PipelineExecutor } from "$lib/components/pipeline/index.js";
</script>

<PipelineEditor />
<PipelineExecutor />
```

### 4. SDK Components (`/sdk/`)
Components for SDK management and installation.

**Components:**
- `SDKManager` - Main SDK management interface
- `SDKManagerCard` - SDK management card

**Usage:**
```svelte
<script>
  import { SDKManager } from "$lib/components/sdk/index.js";
</script>

<SDKManager />
```

### 5. Task Components (`/tasks/`)
Components for task management and execution.

**Components:**
- `TaskPage` - Main task page
- `TaskManager` - Task management interface
- `ProjectTaskManager` - Project-specific task manager
- `TaskGroup` - Task grouping component
- `TaskItem` - Individual task item
- `TaskFilters` - Task filtering interface

**Usage:**
```svelte
<script>
  import { TaskPage, TaskManager } from "$lib/components/tasks/index.js";
</script>

<TaskPage />
<TaskManager />
```

### 6. Workload Components (`/workloads/`)
Components for managing Kubernetes workloads and resources.

**Components:**
- `LogsViewer` - Log viewing interface
- `LogsViewerContent` - Log viewer content
- `LogsDisplay` - Log display component
- `LogEntry` - Individual log entry
- `LogsSearchPanel` - Log search interface
- `AdvancedSearchPanel` - Advanced search functionality
- `AdvancedFilter` - Advanced filtering
- `TimeFilter` - Time-based filtering
- `SeveritySelector` - Log severity selection
- `PodSelector` - Pod selection interface
- `ServiceSelector` - Service selection
- `DeploymentSelector` - Deployment selection
- `NamespaceSelector` - Namespace selection
- `ProjectDeploymentSelector` - Project deployment selection
- `FrameworkSelector` - Framework selection
- `ConfigTreeEditor` - Configuration tree editor
- `ConfigDataViewer` - Configuration data viewer

**Usage:**
```svelte
<script>
  import { 
    LogsViewer, 
    LogsSearchPanel, 
    PodSelector 
  } from "$lib/components/workloads/index.js";
</script>

<LogsViewer />
<LogsSearchPanel />
<PodSelector />
```

### 7. Logs Components (`/logs/`)
Specialized components for log viewing and filtering.

**Components:**
- `LogEntryCompact` - Compact log entry display
- `LogsViewerCompact` - Compact log viewer
- `LogsFilter` - Log filtering interface

**Usage:**
```svelte
<script>
  import { LogEntryCompact, LogsFilter } from "$lib/components/logs/index.js";
</script>

<LogEntryCompact {log} />
<LogsFilter />
```

### 8. Toast Components (`/toast/`)
Components for user notifications and feedback.

**Components:**
- `Toast` - Individual toast notification
- `ToastContainer` - Toast container

**Usage:**
```svelte
<script>
  import { Toast, ToastContainer } from "$lib/components/toast/index.js";
</script>

<ToastContainer />
<Toast message="Success!" />
```

## Benefits of This Structure

### 1. **Consistency**
- All components follow the same import pattern
- Consistent naming conventions
- Uniform file organization

### 2. **Maintainability**
- Easy to find related components
- Clear separation of concerns
- Reduced cognitive load

### 3. **Reusability**
- Components are grouped by functionality
- Easy to identify reusable components
- Clear component responsibilities

### 4. **Scalability**
- Easy to add new components to appropriate modules
- Clear structure for new features
- Organized growth

### 5. **Developer Experience**
- Intuitive file organization
- Easy to understand component relationships
- Faster development cycles

## Migration Guide

### Step 1: Update Import Statements
Use the provided script to automatically update imports:
```bash
node scripts/update-imports.js
```

### Step 2: Manual Review
Review and test the updated imports to ensure everything works correctly.

### Step 3: Update Documentation
Update any component documentation to reflect the new structure.

## Best Practices

### 1. **Import Organization**
```svelte
<script>
  // UI Components
  import { Button, Card } from "$lib/components/ui/index.js";
  
  // Navigation Components
  import { Sidebar, TopNavbar } from "$lib/components/navigation/index.js";
  
  // Feature-specific Components
  import { LogsViewer } from "$lib/components/workloads/index.js";
</script>
```

### 2. **Component Naming**
- Use descriptive, consistent names
- Follow the established naming conventions
- Group related components together

### 3. **File Organization**
- Keep components in their appropriate modules
- Use index files for clean imports
- Maintain consistent file structure

### 4. **Documentation**
- Document component purposes
- Include usage examples
- Maintain up-to-date documentation

## Future Enhancements

1. **Component Library**: Create a comprehensive component library
2. **Storybook Integration**: Add Storybook for component documentation
3. **Automated Testing**: Add comprehensive component tests
4. **Performance Optimization**: Implement lazy loading for components
5. **Type Safety**: Enhance TypeScript definitions

## Conclusion

This modular structure provides a solid foundation for:
- Consistent component usage across the application
- Easy maintenance and updates
- Clear component relationships
- Scalable architecture
- Better developer experience

The organized structure makes it easy to find, use, and maintain components while keeping pages clean and simple.
