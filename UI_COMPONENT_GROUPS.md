# UI Component Groups

This document explains how the new UI component groups help simplify page structure and reduce complexity by providing focused, reusable components instead of complex monolithic components.

## Overview

The UI component system is now organized into logical groups that handle specific functionality, making pages cleaner and more maintainable. Instead of having complex components with multiple responsibilities, we now have focused components that can be composed together.

## Component Groups

### 1. Search Components (`/ui/search/`)

**Purpose**: Handle all search-related functionality consistently across the application.

**Components**:
- `SearchInput` - Reusable search input with loading states and clear functionality
- `SearchExamples` - Display search examples and tips

**Before (Complex)**:
```svelte
<!-- Complex search component with multiple responsibilities -->
<LogsSearchPanel 
  namespaces={namespaces}
  deployments={deployments}
  pods={pods}
  selectedNamespace={selectedNamespace}
  selectedDeployments={selectedDeployments}
  selectedPods={selectedPods}
  searchQuery={searchQuery}
  severityFilter={severityFilter}
  traceIdFilter={traceIdFilter}
  startTime={startTime}
  endTime={endTime}
  pinnedStartLog={pinnedStartLog}
  pinnedEndLog={pinnedEndLog}
  isLiveMode={isLiveMode}
  isStaticMode={isStaticMode}
  logsLoading={logsLoading}
  isConnected={isConnected}
  on:deploymentsChange={handleDeploymentsChange}
  on:podsChange={handlePodsChange}
  on:search={handleSearch}
  on:severityChange={handleSeverityChange}
  on:traceIdChange={handleTraceIdChange}
  on:modeChange={handleModeChange}
  on:timeChange={handleTimeChange}
  on:pinStartTime={handlePinStartTime}
  on:pinEndTime={handlePinEndTime}
/>
```

**After (Simple)**:
```svelte
<!-- Clean, focused search components -->
<SearchInput 
  placeholder="Search logs..."
  value={searchQuery}
  loading={logsLoading}
  on:search={handleSearch}
/>

<SearchExamples 
  examples={searchExamples}
  on:useExample={handleUseExample}
/>
```

### 2. Selector Components (`/ui/selector/`)

**Purpose**: Provide consistent dropdown and multi-select functionality.

**Components**:
- `BaseSelector` - Reusable selector with search, multi-select, and clear functionality

**Before (Multiple Selectors)**:
```svelte
<!-- Multiple complex selector components -->
<NamespaceSelector 
  namespaces={namespaces}
  selectedNamespace={selectedNamespace}
  disabled={disabled}
  variant="default"
  onNamespaceChange={handleNamespaceChange}
/>

<DeploymentSelector 
  deployments={deployments}
  selectedDeployments={selectedDeployments}
  onDeploymentsChange={handleDeploymentsChange}
/>

<PodSelector 
  pods={pods}
  selectedPods={selectedPods}
  onPodsChange={handlePodsChange}
/>
```

**After (Unified)**:
```svelte
<!-- Single, consistent selector component -->
<BaseSelector
  label="Namespace"
  placeholder="Select namespace..."
  options={namespaces.map(ns => ({ value: ns.name, label: ns.name }))}
  selectedValues={selectedNamespace ? [selectedNamespace] : []}
  on:change={handleNamespaceChange}
/>

<BaseSelector
  label="Deployments"
  placeholder="Select deployments..."
  options={deployments.map(dep => ({ value: dep.name, label: dep.name }))}
  selectedValues={selectedDeployments}
  multiple={true}
  on:change={handleDeploymentsChange}
/>
```

### 3. Status Components (`/ui/status/`)

**Purpose**: Display status information consistently across the application.

**Components**:
- `StatusIndicator` - Show connection status, loading states, etc.
- `ProgressBar` - Display progress with different variants

**Before (Inconsistent)**:
```svelte
<!-- Inconsistent status displays -->
{#if connectionState.isConnected}
  <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
    <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
    Connected
  </span>
{:else}
  <span class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
    <div class="w-2 h-2 rounded-full bg-red-500"></div>
    Disconnected
  </span>
{/if}

<div class="w-full bg-gray-200 rounded-full h-2.5">
  <div class="bg-blue-600 h-2.5 rounded-full" style="width: {progress}%"></div>
</div>
```

**After (Consistent)**:
```svelte
<!-- Consistent status components -->
<StatusIndicator 
  status={connectionState.isConnected ? 'online' : 'offline'}
/>

<ProgressBar 
  value={progress} 
  max={100} 
  variant="success"
  label="Upload Progress"
/>
```

### 4. Action Components (`/ui/action/`)

**Purpose**: Provide pre-configured action buttons and action groups.

**Components**:
- `ActionButton` - Pre-configured buttons for common actions
- `ActionGroup` - Group related actions together

**Before (Repetitive)**:
```svelte
<!-- Repetitive button creation -->
<Button variant="default" onclick={handleAdd}>
  <span class="mr-2">➕</span>
  Add Item
</Button>

<Button variant="outline" onclick={handleEdit}>
  <span class="mr-2">✏️</span>
  Edit
</Button>

<Button variant="destructive" onclick={handleDelete}>
  <span class="mr-2">🗑️</span>
  Delete
</Button>

<div class="flex space-x-2">
  <Button variant="outline" onclick={handleRefresh}>Refresh</Button>
  <Button variant="outline" onclick={handleExport}>Export</Button>
</div>
```

**After (Simple)**:
```svelte
<!-- Simple, pre-configured action components -->
<ActionButton action="add" label="Add Item" onclick={handleAdd} />

<ActionGroup 
  actions={[
    { action: 'refresh' },
    { action: 'export' }
  ]}
  on:action={handleAction}
/>
```

### 5. Display Components (`/ui/display/`)

**Purpose**: Handle common display states consistently.

**Components**:
- `EmptyState` - Show when there's no data
- `LoadingState` - Show loading states

**Before (Repetitive)**:
```svelte
<!-- Repetitive empty and loading states -->
{#if loading}
  <div class="text-center py-8">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
    <p class="text-slate-600">Loading...</p>
  </div>
{:else if items.length === 0}
  <div class="text-center py-12">
    <div class="text-6xl mb-4">📭</div>
    <h3 class="text-lg font-semibold mb-2">No items found</h3>
    <p class="text-slate-600 mb-6">There's nothing to display here yet.</p>
    <Button onclick={handleAdd}>Add Item</Button>
  </div>
{:else}
  <!-- Content -->
{/if}
```

**After (Reusable)**:
```svelte
<!-- Reusable display components -->
{#if loading}
  <LoadingState message="Loading items..." />
{:else if items.length === 0}
  <EmptyState 
    title="No items found"
    description="There's nothing to display here yet."
    showAction={true}
    actionLabel="Add Item"
    on:action={handleAdd}
  />
{:else}
  <!-- Content -->
{/if}
```

## Page Simplification Examples

### Example 1: Logs Page

**Before (Complex)**:
```svelte
<script>
  import LogsViewer from '$lib/components/workloads/LogsViewer.svelte';
  import LogsSearchPanel from '$lib/components/workloads/LogsSearchPanel.svelte';
  import AdvancedSearchPanel from '$lib/components/workloads/AdvancedSearchPanel.svelte';
  import LogsDisplay from '$lib/components/workloads/LogsDisplay.svelte';
  // ... many more imports
</script>

<LogsViewer 
  title="Logs Viewer"
  description="View and filter logs across your Kubernetes cluster"
  showNamespaceFilter={true}
  defaultNamespace=""
  defaultDeployments={[]}
  defaultSearchQuery=""
  defaultSeverityFilter=""
  defaultTraceIdFilter=""
  defaultLogCount={100}
  defaultSortOrder="newest"
  showNamespaceLabel={true}
  on:filterBySeverity={handleSeverityFilter}
  on:filterByPod={handlePodFilter}
  on:filterByDeployment={handleDeploymentFilter}
  on:filterByNamespace={handleNamespaceFilter}
  on:search={handleSearch}
  on:timeChange={handleTimeChange}
  on:modeChange={handleModeChange}
/>
```

**After (Simple)**:
```svelte
<script>
  import { SearchInput, SearchExamples } from '$lib/components/ui/search/index.js';
  import { BaseSelector } from '$lib/components/ui/selector/index.js';
  import { StatusIndicator } from '$lib/components/ui/status/index.js';
  import { ActionGroup } from '$lib/components/ui/action/index.js';
  import { EmptyState, LoadingState } from '$lib/components/ui/display/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
</script>

<Card>
  <CardHeader>
    <CardTitle>Logs</CardTitle>
  </CardHeader>
  <CardContent>
    <!-- Search -->
    <SearchInput 
      placeholder="Search logs..."
      value={searchQuery}
      loading={logsLoading}
      on:search={handleSearch}
    />
    
    <!-- Filters -->
    <div class="grid grid-cols-3 gap-4 mt-4">
      <BaseSelector
        label="Namespace"
        options={namespaceOptions}
        selectedValues={selectedNamespace ? [selectedNamespace] : []}
        on:change={handleNamespaceChange}
      />
      <BaseSelector
        label="Severity"
        options={severityOptions}
        selectedValues={selectedSeverity ? [selectedSeverity] : []}
        on:change={handleSeverityChange}
      />
      <BaseSelector
        label="Pods"
        options={podOptions}
        selectedValues={selectedPods}
        multiple={true}
        on:change={handlePodsChange}
      />
    </div>
    
    <!-- Actions -->
    <ActionGroup 
      actions={[
        { action: 'refresh' },
        { action: 'export' }
      ]}
      on:action={handleAction}
    />
    
    <!-- Content -->
    {#if logsLoading}
      <LoadingState message="Loading logs..." />
    {:else if logs.length === 0}
      <EmptyState 
        title="No logs found"
        description="Try adjusting your search criteria."
        icon="📋"
      />
    {:else}
      <!-- Log entries -->
      {#each logs as log}
        <LogEntry {log} />
      {/each}
    {/if}
  </CardContent>
</Card>
```

### Example 2: Task Management Page

**Before (Complex)**:
```svelte
<script>
  import TaskPage from '$lib/components/tasks/TaskPage.svelte';
  // ... many imports
</script>

<TaskPage 
  title="Task Manager"
  subtitle="Organize your tasks with groups and subtasks"
  initialFilters={initialFilters}
  showAddGroupButton={true}
  showProgressOverview={true}
  showFilters={true}
  emptyStateMessage="No task groups yet"
  emptyStateDescription="Create your first task group to get started!"
  on:groupAdded={handleGroupAdded}
  on:groupUpdated={handleGroupUpdated}
  on:groupDeleted={handleGroupDeleted}
  on:taskAdded={handleTaskAdded}
  on:taskUpdated={handleTaskUpdated}
  on:taskDeleted={handleTaskDeleted}
/>
```

**After (Simple)**:
```svelte
<script>
  import { SearchInput } from '$lib/components/ui/search/index.js';
  import { BaseSelector } from '$lib/components/ui/selector/index.js';
  import { ProgressBar } from '$lib/components/ui/status/index.js';
  import { ActionButton, ActionGroup } from '$lib/components/ui/action/index.js';
  import { EmptyState } from '$lib/components/ui/display/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
</script>

<Card>
  <CardHeader>
    <CardTitle>Task Manager</CardTitle>
  </CardHeader>
  <CardContent>
    <!-- Progress Overview -->
    <ProgressBar 
      value={completedTasks} 
      max={totalTasks} 
      label="Overall Progress"
      variant="success"
    />
    
    <!-- Search and Filters -->
    <div class="flex gap-4 mt-4">
      <SearchInput 
        placeholder="Search tasks..."
        value={searchQuery}
        on:search={handleSearch}
      />
      <BaseSelector
        label="Status"
        options={statusOptions}
        selectedValues={selectedStatus ? [selectedStatus] : []}
        on:change={handleStatusChange}
      />
    </div>
    
    <!-- Actions -->
    <ActionGroup 
      actions={[
        { action: 'add', label: 'New Task Group' },
        { action: 'refresh' },
        { action: 'export' }
      ]}
      on:action={handleAction}
    />
    
    <!-- Content -->
    {#if taskGroups.length === 0}
      <EmptyState 
        title="No task groups yet"
        description="Create your first task group to get started!"
        showAction={true}
        actionLabel="Create Task Group"
        on:action={handleCreateGroup}
      />
    {:else}
      {#each taskGroups as group}
        <TaskGroup {group} />
      {/each}
    {/if}
  </CardContent>
</Card>
```

## Benefits of Component Groups

### 1. **Reduced Complexity**
- Pages are simpler and easier to understand
- Each component has a single responsibility
- Less prop drilling and complex state management

### 2. **Better Reusability**
- Components can be used across different pages
- Consistent behavior and styling
- Easy to maintain and update

### 3. **Improved Developer Experience**
- Faster development with pre-configured components
- Consistent patterns across the application
- Better code organization

### 4. **Enhanced Maintainability**
- Changes to functionality are isolated to specific components
- Easier to test individual components
- Clear separation of concerns

### 5. **Better Performance**
- Smaller, focused components
- Better tree-shaking
- More efficient re-renders

## Migration Strategy

### Phase 1: Identify Complex Components
1. Look for components with many props (>10)
2. Identify components with multiple responsibilities
3. Find repetitive patterns across components

### Phase 2: Create Component Groups
1. Extract common functionality into focused components
2. Create reusable component groups
3. Establish consistent patterns

### Phase 3: Refactor Pages
1. Replace complex components with component groups
2. Simplify page structure
3. Improve maintainability

### Phase 4: Test and Optimize
1. Test all functionality
2. Optimize performance
3. Update documentation

## Best Practices

### 1. **Component Design**
- Keep components focused on a single responsibility
- Use consistent prop patterns
- Provide sensible defaults

### 2. **Composition Over Configuration**
- Prefer composition of simple components over complex configuration
- Use component groups to build complex functionality
- Keep pages clean and simple

### 3. **Consistent Patterns**
- Use the same patterns across similar functionality
- Maintain consistent naming conventions
- Follow established component structure

### 4. **Documentation**
- Document component purposes and usage
- Provide examples for common use cases
- Keep documentation up to date

## Conclusion

The new UI component groups provide a much cleaner and more maintainable approach to building pages. By breaking down complex components into focused, reusable pieces, we can:

- **Simplify page structure** - Pages become much cleaner and easier to understand
- **Improve reusability** - Components can be used across different parts of the application
- **Enhance maintainability** - Changes are isolated to specific components
- **Boost developer productivity** - Faster development with pre-configured components

This approach follows the principle of composition over configuration, making the codebase more modular, maintainable, and scalable.
