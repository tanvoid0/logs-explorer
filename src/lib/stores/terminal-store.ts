import { writable, derived } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface TerminalProcess {
  id: string;
  command: string;
  args: string[];
  workingDirectory?: string;
  status: 'idle' | 'running' | 'success' | 'error' | 'cancelled';
  output: string;
  startTime: Date;
  endTime?: Date;
  exitCode?: number;
  errorMessage?: string;
}

export interface TerminalState {
  processes: Map<string, TerminalProcess>;
  activeProcessId: string | null;
  isListenerActive: boolean;
}

// Create the main store
const createTerminalStore = () => {
  const { subscribe, set, update } = writable<TerminalState>({
    processes: new Map(),
    activeProcessId: null,
    isListenerActive: false
  });

  let unsubscribe: (() => void) | null = null;

  // Initialize the event listener
  const initializeListener = async () => {
    if (unsubscribe) {
      console.log('🔥 TERMINAL STORE: Listener already active');
      return;
    }

    try {
      console.log('🔥 TERMINAL STORE: Setting up centralized event listener...');
      
      unsubscribe = await listen('command_output', (event) => {
        const { processId, line } = event.payload as { processId: string; line: string };
        console.log('🔥 TERMINAL STORE: Received output for process:', processId, line);
        
        update(state => {
          const process = state.processes.get(processId);
          if (process) {
            process.output += line + '\n';
            state.processes.set(processId, { ...process });
          }
          return state;
        });
      });

      update(state => ({ ...state, isListenerActive: true }));
      console.log('🔥 TERMINAL STORE: Centralized event listener active');
    } catch (error) {
      console.error('🔥 TERMINAL STORE: Failed to set up event listener:', error);
    }
  };

  // Cleanup the event listener
  const cleanupListener = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
      update(state => ({ ...state, isListenerActive: false }));
      console.log('🔥 TERMINAL STORE: Event listener cleaned up');
    }
  };

  return {
    subscribe,
    
    // Initialize the store and event listener
    initialize: async () => {
      await initializeListener();
    },

    // Cleanup when app shuts down
    cleanup: () => {
      cleanupListener();
    },

    // Start a new process
    startProcess: async (command: string, args: string[] = [], workingDirectory?: string) => {
      const processId = `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const process: TerminalProcess = {
        id: processId,
        command,
        args,
        workingDirectory,
        status: 'running',
        output: '',
        startTime: new Date()
      };

      update(state => {
        state.processes.set(processId, process);
        state.activeProcessId = processId;
        return state;
      });

      console.log('🔥 TERMINAL STORE: Starting process:', processId, command, args);

      try {
        const result = await invoke<{
          success: boolean;
          output: string;
          command_type: string;
          is_native: boolean;
          exit_code?: number;
          error_message?: string;
        }>('execute_command_live', { 
          command, 
          args,
          workingDirectory: workingDirectory || null,
          processId // Pass processId to backend
        });

        update(state => {
          const process = state.processes.get(processId);
          if (process) {
            process.status = result.success ? 'success' : 'error';
            process.endTime = new Date();
            process.exitCode = result.exit_code;
            process.errorMessage = result.error_message;
            state.processes.set(processId, { ...process });
          }
          return state;
        });

        console.log('🔥 TERMINAL STORE: Process completed:', processId, result.success);
      } catch (error) {
        console.error('🔥 TERMINAL STORE: Process failed:', processId, error);
        
        update(state => {
          const process = state.processes.get(processId);
          if (process) {
            process.status = 'error';
            process.endTime = new Date();
            process.errorMessage = error as string;
            state.processes.set(processId, { ...process });
          }
          return state;
        });
      }
    },

    // Cancel a specific process
    cancelProcess: async (processId: string) => {
      console.log('🔥 TERMINAL STORE: Cancelling process:', processId);
      
      try {
        const result = await invoke('cancel_process', { processId });
        console.log('🔥 TERMINAL STORE: Cancel result:', result);
        
        update(state => {
          const process = state.processes.get(processId);
          if (process) {
            process.status = 'cancelled';
            process.endTime = new Date();
            state.processes.set(processId, { ...process });
            console.log('🔥 TERMINAL STORE: Updated process status to cancelled:', processId);
          } else {
            console.log('🔥 TERMINAL STORE: Process not found in store:', processId);
          }
          return state;
        });
        
        return { success: true };
      } catch (error) {
        console.error('🔥 TERMINAL STORE: Failed to cancel process:', processId, error);
        
        // Check if the process is still running in the store
        update(state => {
          const process = state.processes.get(processId);
          if (process) {
            // If the process is still running, mark it as cancelled anyway
            // since the user wants to stop it
            if (process.status === 'running') {
              process.status = 'cancelled';
              process.endTime = new Date();
              process.errorMessage = `Cancellation failed: ${error}`;
              state.processes.set(processId, { ...process });
              console.log('🔥 TERMINAL STORE: Marked process as cancelled despite backend error:', processId);
            }
          }
          return state;
        });
        
        // Don't throw the error, just log it and return success
        // This prevents the UI from showing error toasts for cancellation
        console.log('🔥 TERMINAL STORE: Cancellation completed (with backend error):', processId);
        return { success: true };
      }
    },

    // Cancel all running processes
    cancelAllProcesses: async () => {
      console.log('🔥 TERMINAL STORE: Cancelling all processes');
      
      try {
        await invoke('cancel_all_processes');
        
        update(state => {
          state.processes.forEach((process, id) => {
            if (process.status === 'running') {
              process.status = 'cancelled';
              process.endTime = new Date();
              state.processes.set(id, { ...process });
            }
          });
          return state;
        });
      } catch (error) {
        console.error('🔥 TERMINAL STORE: Failed to cancel all processes:', error);
      }
    },

    // Set active process (for UI focus)
    setActiveProcess: (processId: string | null) => {
      update(state => ({ ...state, activeProcessId: processId }));
    },

    // Clear process output
    clearProcessOutput: (processId: string) => {
      update(state => {
        const process = state.processes.get(processId);
        if (process) {
          process.output = '';
          state.processes.set(processId, { ...process });
        }
        return state;
      });
    },

    // Remove a process from history
    removeProcess: (processId: string) => {
      update(state => {
        state.processes.delete(processId);
        if (state.activeProcessId === processId) {
          state.activeProcessId = null;
        }
        return state;
      });
    },

    // Add a new process (for manual tab creation)
    addProcess: (process: TerminalProcess) => {
      update(state => {
        state.processes.set(process.id, process);
        state.activeProcessId = process.id;
        return state;
      });
    },

    // Get a specific process
    getProcess: (processId: string) => {
      let currentState: TerminalState | undefined;
      subscribe(state => { currentState = state; })();
      return currentState?.processes.get(processId);
    },

    // Get all processes
    getAllProcesses: () => {
      let currentState: TerminalState | undefined;
      subscribe(state => { currentState = state; })();
      return currentState ? Array.from(currentState.processes.values()) : [];
    },

    // Get running processes
    getRunningProcesses: () => {
      let currentState: TerminalState | undefined;
      subscribe(state => { currentState = state; })();
      return currentState ? Array.from(currentState.processes.values()).filter(p => p.status === 'running') : [];
    }
  };
};

export const terminalStore = createTerminalStore();

// Derived stores for common use cases
export const activeProcess = derived(terminalStore, ($store) => {
  if (!$store.activeProcessId) return null;
  return $store.processes.get($store.activeProcessId) || null;
});

export const runningProcesses = derived(terminalStore, ($store) => {
  return Array.from($store.processes.values()).filter(p => p.status === 'running');
});

export const processHistory = derived(terminalStore, ($store) => {
  return Array.from($store.processes.values()).sort((a, b) => 
    b.startTime.getTime() - a.startTime.getTime()
  );
});

// Initialize the store when the module is imported
terminalStore.initialize();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    terminalStore.cleanup();
  });
}
