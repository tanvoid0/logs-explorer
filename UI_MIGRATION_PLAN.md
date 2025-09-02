# UI Migration Plan

This document outlines the plan for migrating from the current component structure to the new modular UI system.

## What We've Accomplished

### ✅ New Modular UI System
- **Organized folder structure**: Components are now grouped by functionality
- **Consistent design patterns**: All components follow the same styling approach
- **Type-safe components**: Full TypeScript support with proper type definitions
- **Reusable components**: Components can be used across different parts of the application
- **Clean imports**: Index files make imports cleaner and more organized

### ✅ New Component Categories
1. **Card Components** (`/card/`)
   - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

2. **Form Components** (`/form/`)
   - `Button`, `Input`, `Select`

3. **Feedback Components** (`/feedback/`)
   - `Badge`, `Alert`

4. **Data Components** (`/data/`)
   - `DataTable`, `TableRow`, `TableCell`, `TableHead`, `TableBody`, `TableHeader`

5. **Layout Components** (`/layout/`)
   - `Container`, `Separator`

6. **Logs Components** (`/logs/`)
   - `LogEntryCompact`, `LogsViewer`, `LogsFilter`

## Current State Analysis

### Large Components That Need Refactoring

1. **LogEntry.svelte** (804 lines)
   - **Issues**: Too many responsibilities, complex logic, hard to maintain
   - **Solution**: Break into smaller, focused components
   - **New Components**:
     - `LogEntryCompact.svelte` (already created)
     - `LogEntryDetailed.svelte` (for detailed view)
     - `LogEntryRaw.svelte` (for raw JSON view)
     - `LogEntryStructured.svelte` (for structured log data)

2. **CentralizedTerminal.svelte** (786 lines)
   - **Issues**: Complex terminal management, multiple responsibilities
   - **Solution**: Split into focused components
   - **New Components**:
     - `TerminalContainer.svelte` (main container)
     - `TerminalToolbar.svelte` (toolbar with actions)
     - `TerminalOutput.svelte` (output display)
     - `TerminalInput.svelte` (input handling)

3. **PipelineEditor.svelte** (904 lines)
   - **Issues**: Complex pipeline editing logic
   - **Solution**: Break into smaller components
   - **New Components**:
     - `PipelineCanvas.svelte` (visual editor)
     - `PipelineToolbar.svelte` (editing tools)
     - `PipelineNode.svelte` (individual nodes)
     - `PipelineConnection.svelte` (node connections)

4. **SDKManager.svelte** (511 lines)
   - **Issues**: Complex SDK management logic
   - **Solution**: Split into focused components
   - **New Components**:
     - `SDKList.svelte` (SDK listing)
     - `SDKInstallForm.svelte` (installation form)
     - `SDKStatus.svelte` (status display)

## Migration Strategy

### Phase 1: Immediate Actions (High Priority)

1. **Update Import Statements**
   ```bash
   # Find all files using old imports
   find src -name "*.svelte" -exec grep -l "ui/button.svelte" {} \;
   find src -name "*.svelte" -exec grep -l "ui/card.svelte" {} \;
   ```

2. **Replace Old Imports**
   ```svelte
   // Old
   import Button from '$lib/components/ui/button.svelte';
   
   // New
   import { Button } from '$lib/components/ui/form/index.js';
   ```

3. **Update Component Usage**
   - Replace old component props with new ones
   - Update event handling patterns
   - Use new composition patterns

### Phase 2: Component Refactoring (Medium Priority)

1. **Break Down Large Components**
   - Start with `LogEntry.svelte` (highest impact)
   - Create focused sub-components
   - Maintain backward compatibility during transition

2. **Create Specialized Components**
   - `LogEntryDetailed.svelte` for detailed log view
   - `LogEntryStructured.svelte` for structured logs
   - `TerminalContainer.svelte` for terminal management

3. **Implement New Patterns**
   - Use composition over inheritance
   - Implement proper event handling
   - Add proper TypeScript types

### Phase 3: Cleanup (Low Priority)

1. **Remove Unused Components**
   - Identify components not used anywhere
   - Remove deprecated components
   - Clean up old imports

2. **Optimize Performance**
   - Implement proper memoization
   - Optimize re-renders
   - Add lazy loading where appropriate

## Specific Component Migration Examples

### LogEntry Component Migration

**Current Structure**:
```svelte
<!-- LogEntry.svelte (804 lines) -->
<script>
  // Complex logic for parsing, formatting, filtering
</script>

<!-- Multiple view modes in one component -->
{#if viewMode === 'compact'}
  <!-- Compact view -->
{:else if viewMode === 'detailed'}
  <!-- Detailed view -->
{:else if viewMode === 'raw'}
  <!-- Raw view -->
{/if}
```

**New Structure**:
```svelte
<!-- LogEntryCompact.svelte (already created) -->
<script>
  // Focused on compact display only
</script>

<!-- LogEntryDetailed.svelte (to be created) -->
<script>
  // Focused on detailed display only
</script>

<!-- LogEntryRaw.svelte (to be created) -->
<script>
  // Focused on raw JSON display only
</script>
```

### Terminal Component Migration

**Current Structure**:
```svelte
<!-- CentralizedTerminal.svelte (786 lines) -->
<script>
  // Terminal management, output handling, input processing
</script>
```

**New Structure**:
```svelte
<!-- TerminalContainer.svelte -->
<script>
  import TerminalToolbar from './TerminalToolbar.svelte';
  import TerminalOutput from './TerminalOutput.svelte';
  import TerminalInput from './TerminalInput.svelte';
</script>

<TerminalToolbar />
<TerminalOutput />
<TerminalInput />
```

## Benefits of Migration

### 1. Maintainability
- Smaller, focused components are easier to understand
- Clear separation of concerns
- Easier to test individual components

### 2. Reusability
- Components can be used in different contexts
- Consistent behavior across the application
- Reduced code duplication

### 3. Performance
- Better tree-shaking
- Smaller bundle sizes
- More efficient re-renders

### 4. Developer Experience
- Clear component organization
- Easy to find and use components
- Better TypeScript support

## Implementation Timeline

### Week 1: Foundation
- ✅ Create new UI component system
- ✅ Set up folder structure
- ✅ Create basic components

### Week 2: Migration
- Update import statements across the application
- Replace old component usage with new patterns
- Test functionality

### Week 3: Refactoring
- Break down large components
- Create specialized sub-components
- Maintain backward compatibility

### Week 4: Cleanup
- Remove unused components
- Optimize performance
- Update documentation

## Risk Mitigation

### 1. Backward Compatibility
- Keep old components during transition
- Use feature flags for gradual rollout
- Maintain existing APIs where possible

### 2. Testing
- Create comprehensive tests for new components
- Test integration with existing functionality
- Ensure no regressions

### 3. Documentation
- Update component documentation
- Create migration guides
- Provide examples and best practices

## Success Metrics

### 1. Code Quality
- Reduced component complexity
- Improved maintainability scores
- Better test coverage

### 2. Performance
- Smaller bundle sizes
- Faster load times
- Better runtime performance

### 3. Developer Experience
- Faster development cycles
- Reduced bugs
- Better code reviews

## Next Steps

1. **Review and approve** this migration plan
2. **Start with Phase 1** (import updates)
3. **Create detailed tickets** for each component refactoring
4. **Set up monitoring** for performance improvements
5. **Plan team training** on new component patterns

## Resources

- [UI Component System Documentation](./UI_COMPONENT_SYSTEM.md)
- [Component Showcase](./src/routes/ui-showcase/+page.svelte)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Svelte Component Best Practices](https://svelte.dev/docs#template-syntax-component-directives)
