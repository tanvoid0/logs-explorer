# Svelte 5 Migration Guide: createEventDispatcher → Callback Props

## Overview
This guide documents the migration from the deprecated `createEventDispatcher` to Svelte 5's callback props approach.

## Migration Pattern

### Before (Svelte 4)
```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  function handleClick() {
    dispatch('click', { data: 'value' });
  }
</script>

<button on:click={handleClick}>Click me</button>
```

### After (Svelte 5)
```svelte
<script>
  export let onClick = undefined;
  
  function handleClick() {
    if (onClick) onClick({ data: 'value' });
  }
</script>

<button on:click={handleClick}>Click me</button>
```

## Usage in Parent Components

### Before (Svelte 4)
```svelte
<ChildComponent on:click={handleChildClick} />
```

### After (Svelte 5)
```svelte
<ChildComponent {onClick} />
```

## Migration Checklist

### Components to Migrate:
1. ✅ LogsDisplay.svelte
2. ✅ LogEntry.svelte
3. ⏳ LogsViewerContent.svelte
4. ⏳ LogsViewer.svelte
5. ⏳ LogsSearchPanel.svelte
6. ✅ NamespaceSelector.svelte
7. ⏳ DeploymentSelector.svelte
8. ⏳ PodSelector.svelte
9. ⏳ ServiceSelector.svelte
10. ✅ SeveritySelector.svelte
11. ⏳ AdvancedSearchPanel.svelte
12. ⏳ AdvancedFilter.svelte
13. ⏳ TimeFilter.svelte
14. ⏳ QuickActions.svelte
15. ⏳ ConnectionStatus.svelte
16. ⏳ FrameworkSelector.svelte
17. ⏳ ProjectDeploymentSelector.svelte
18. ⏳ ConfigTreeEditor.svelte
19. ⏳ TaskGroup.svelte
20. ⏳ TaskItem.svelte
21. ⏳ Toast.svelte
22. ⏳ LogEntryCompact.svelte

### Event Types to Migrate:
- `logCountChange` → `onLogCountChange`
- `sortOrderChange` → `onSortOrderChange`
- `severityChange` → `onSeverityChange`
- `traceIdChange` → `onTraceIdChange`
- `deploymentFilter` → `onDeploymentFilter`
- `nextPage` → `onNextPage`
- `previousPage` → `onPreviousPage`
- `loadMoreNext` → `onLoadMoreNext`
- `loadMorePrevious` → `onLoadMorePrevious`
- `pinStartTime` → `onPinStartTime`
- `pinEndTime` → `onPinEndTime`
- `loadLogs` → `onLoadLogs`
- `search` → `onSearch`
- `deploymentsChange` → `onDeploymentsChange`
- `podsChange` → `onPodsChange`
- `timeChange` → `onTimeChange`
- `modeChange` → `onModeChange`
- `filterByTraceId` → `onFilterByTraceId`
- `filterByDeployment` → `onFilterByDeployment`
- `filterBySeverity` → `onFilterBySeverity`

## Benefits of Migration
1. **Better TypeScript Support**: Callback props are more type-safe
2. **Improved Performance**: No event bubbling overhead
3. **Future-Proof**: Uses the recommended Svelte 5 pattern
4. **Cleaner API**: More explicit parent-child communication
5. **Better IDE Support**: Better autocomplete and refactoring support

## Migration Steps
1. Replace `createEventDispatcher()` with callback props
2. Update event dispatching to callback invocation
3. Update parent components to use callback props instead of event listeners
4. Remove `createEventDispatcher` imports
5. Test all functionality to ensure no regressions
