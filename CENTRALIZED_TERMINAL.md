# Centralized Terminal System

## Overview

The centralized terminal system solves the problem of terminal processes being tied to individual component instances. With this system, processes continue running even when you navigate away from the terminal page, and you can return to see their current state and output.

## Key Features

### 1. **Process Persistence Across Navigation**
- Processes continue running when you navigate away from the terminal page
- When you return, you see the current state and all accumulated output
- No need to restart commands or lose progress

### 2. **Multiple Process Management**
- Support for multiple concurrent processes from different pages
- Each process has a unique ID for proper routing of output
- Process history with status indicators (running, success, error, cancelled)

### 3. **Centralized Event Listening**
- Single event listener in the terminal store handles all process output
- Output is routed to the correct process based on process ID
- No duplicate listeners or memory leaks

### 4. **Process History with Tabs**
- Visual tabs showing all processes (running and completed)
- Color-coded status indicators
- Ability to switch between processes and view their output
- Remove processes from history

## Architecture

### Backend (Rust/Tauri)

#### Process Storage
```rust
// Global storage for running processes with process IDs
static RUNNING_PROCESSES: Lazy<Mutex<HashMap<String, std::process::Child>>> = 
    Lazy::new(|| Mutex::new(HashMap::new()));
```

#### Key Functions
- `execute_command_live(command, args, working_directory, process_id, window)` - Starts a new process with a unique ID
- `cancel_process(process_id)` - Cancels a specific process
- `cancel_all_processes()` - Cancels all running processes
- `get_running_processes()` - Returns list of running process IDs

#### Event Emission
```rust
// Emit output with process ID for proper routing
window.emit("command_output", serde_json::json!({
    "processId": process_id,
    "line": line
}))
```

### Frontend (Svelte)

#### Terminal Store (`src/lib/stores/terminal-store.ts`)
```typescript
interface TerminalProcess {
  id: string;
  command: string;
  args: string[];
  workingDirectory?: string;
  status: 'running' | 'success' | 'error' | 'cancelled';
  output: string;
  startTime: Date;
  endTime?: Date;
  exitCode?: number;
  errorMessage?: string;
}
```

#### Key Features
- **Centralized Event Listener**: Single listener for all `command_output` events
- **Process Management**: Start, cancel, and track processes
- **State Management**: Reactive stores for processes, active process, and history
- **Auto-initialization**: Store initializes when imported

#### Store Methods
- `startProcess(command, args, workingDirectory)` - Start a new process
- `cancelProcess(processId)` - Cancel a specific process
- `cancelAllProcesses()` - Cancel all running processes
- `setActiveProcess(processId)` - Set the active process for UI focus
- `clearProcessOutput(processId)` - Clear output for a process
- `removeProcess(processId)` - Remove process from history

#### Derived Stores
- `activeProcess` - Currently selected process
- `runningProcesses` - All currently running processes
- `processHistory` - All processes sorted by start time

### Centralized Terminal Component (`src/lib/components/CentralizedTerminal.svelte`)

#### Features
- **Process Tabs**: Visual tabs for all processes with status indicators
- **Status Highlighting**: Color-coded borders and backgrounds based on process status
- **Keyboard Shortcuts**: Ctrl+C to cancel running process
- **Framework Quick Actions**: Pre-defined commands for common frameworks
- **Auto-scroll**: Automatically scrolls to bottom when new output arrives

#### Status Types
- **Running**: Blue border/background with spinner icon
- **Success**: Green border/background with checkmark
- **Error**: Red border/background with X icon
- **Cancelled**: Orange border/background with stop icon

## Usage

### Basic Usage
```svelte
<script>
  import CentralizedTerminal from '$lib/components/CentralizedTerminal.svelte';
</script>

<CentralizedTerminal 
  projectPath="/path/to/project" 
  workingDirectory="/path/to/project" 
/>
```

### Programmatic Usage
```typescript
import { terminalStore } from '$lib/stores/terminal-store';

// Start a process
await terminalStore.startProcess('npm install', [], '/path/to/project');

// Cancel a specific process
await terminalStore.cancelProcess('process_123');

// Cancel all processes
await terminalStore.cancelAllProcesses();
```

## Benefits

### 1. **Improved User Experience**
- No lost progress when navigating
- Can run multiple commands simultaneously
- Easy switching between processes
- Visual feedback for process status

### 2. **Better Resource Management**
- Centralized process tracking
- Proper cleanup of completed processes
- No memory leaks from multiple listeners

### 3. **Enhanced Functionality**
- Process history and management
- Individual process cancellation
- Status tracking and visual indicators
- Framework-specific quick actions

### 4. **Developer Experience**
- Clean separation of concerns
- Reusable terminal store
- Type-safe process management
- Easy to extend and customize

## Migration from NonBlockingTerminal

The centralized terminal system replaces the previous `NonBlockingTerminal` component. Key differences:

1. **Process Persistence**: Processes continue running across navigation
2. **Multiple Processes**: Support for concurrent processes with tabs
3. **Centralized Management**: Single store manages all processes
4. **Better UI**: Process tabs, status indicators, and improved styling

## Future Enhancements

1. **Process Groups**: Group related processes together
2. **Process Templates**: Save and reuse common command sequences
3. **Output Filtering**: Filter output by type (stdout/stderr)
4. **Process Dependencies**: Define process execution order
5. **Remote Process Support**: Execute commands on remote systems
6. **Process Logging**: Persistent storage of process history
7. **Custom Themes**: User-configurable terminal themes
8. **Process Scheduling**: Schedule commands to run at specific times

## Troubleshooting

### Common Issues

1. **Process not showing output**
   - Check browser console for event listener errors
   - Verify process ID is being passed correctly
   - Ensure terminal store is initialized

2. **Process cancellation not working**
   - Check if process ID exists in backend storage
   - Verify cancellation permissions
   - Check for backend errors in console

3. **Multiple processes interfering**
   - Each process should have a unique ID
   - Check for process ID conflicts
   - Verify event routing is working correctly

### Debug Information

The system includes extensive logging:
- Backend: Process creation, output emission, cancellation
- Frontend: Event reception, store updates, component lifecycle
- Console logs prefixed with "🔥" for easy identification
