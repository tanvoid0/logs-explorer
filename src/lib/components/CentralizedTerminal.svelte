<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { terminalStore, activeProcess, runningProcesses, processHistory } from '$lib/stores/terminal-store';
  import Button from '$lib/components/ui/button.svelte';
  import type { TerminalProcess } from '$lib/stores/terminal-store';
  import AnsiToHtml from 'ansi-to-html';
  import { toastStore } from '$lib/stores/toast-store';
  import { invoke } from '@tauri-apps/api/core';

  // Props
  const { projectPath = '', workingDirectory = '' } = $props();

  // Local state
  let outputContainer: HTMLDivElement;
  let commandInput: HTMLInputElement;
  let currentCommand = $state('');
  let isRunning = $state(false);
  let terminalStatus = $state<'idle' | 'running' | 'success' | 'error' | 'cancelled'>('idle');
  let selectedProcessId = $state<string | null>(null);

  // ANSI converter
  const ansiConverter = new AnsiToHtml({
    colors: {
      0: '#000000',
      1: '#e06c75',
      2: '#98c379',
      3: '#d19a66',
      4: '#61afef',
      5: '#c678dd',
      6: '#56b6c2',
      7: '#abb2bf',
      8: '#5c6370',
      9: '#e06c75',
      10: '#98c379',
      11: '#d19a66',
      12: '#61afef',
      13: '#c678dd',
      14: '#56b6c2',
      15: '#ffffff'
    }
  });

  // Framework-specific commands
  const frameworkCommands = {
    'node': {
      install: 'npm install',
      start: 'npm start',
      dev: 'npm run dev',
      build: 'npm run build',
      test: 'npm test'
    },
    'python': {
      install: 'pip install -r requirements.txt',
      start: 'python main.py',
      dev: 'python -m flask run',
      test: 'python -m pytest'
    },
    'java': {
      install: 'mvn clean install',
      start: 'mvn spring-boot:run',
      build: 'mvn clean package',
      test: 'mvn test'
    }
  };

  // Reactive statements
  $effect(() => {
    console.log('🔥 CENTRALIZED TERMINAL: Process history updated:', $processHistory.length, 'processes');
    console.log('🔥 CENTRALIZED TERMINAL: Active process:', $activeProcess);
    console.log('🔥 CENTRALIZED TERMINAL: Running processes:', $runningProcesses.length);
    
    // Update local state based on active process
    if ($activeProcess) {
      isRunning = $activeProcess.status === 'running';
      selectedProcessId = $activeProcess.id;
      
      // Update terminal status
      terminalStatus = $activeProcess.status;
      
      // Auto-clear status after delay
      if (terminalStatus === 'success' || terminalStatus === 'cancelled') {
        setTimeout(() => {
          terminalStatus = 'idle';
        }, 3000);
      } else if (terminalStatus === 'error') {
        setTimeout(() => {
          terminalStatus = 'idle';
        }, 5000);
      }
    } else {
      isRunning = false;
      selectedProcessId = null;
      terminalStatus = 'idle';
    }
  });

  // Methods
  async function runCommand(command: string) {
    if (!command.trim()) return;
    
    console.log('🔥 CENTRALIZED TERMINAL: Running command:', command);
    console.log('🔥 CENTRALIZED TERMINAL: Working directory:', workingDirectory || projectPath);
    
    try {
      await terminalStore.startProcess(command, [], workingDirectory || projectPath);
      currentCommand = command;
      console.log('🔥 CENTRALIZED TERMINAL: Command started successfully');
    } catch (error) {
      console.error('🔥 CENTRALIZED TERMINAL: Failed to start process:', error);
      toastStore.error('Failed to start command');
    }
  }

  async function cancelCurrentProcess() {
    console.log('🔥 CENTRALIZED TERMINAL: Cancel requested');
    console.log('🔥 CENTRALIZED TERMINAL: selectedProcessId:', selectedProcessId);
    console.log('🔥 CENTRALIZED TERMINAL: activeProcess:', $activeProcess);
    console.log('🔥 CENTRALIZED TERMINAL: runningProcesses:', $runningProcesses);
    
    // Try to cancel the selected process, or the active process, or any running process
    let processToCancel = selectedProcessId;
    
    if (!processToCancel && $activeProcess) {
      processToCancel = $activeProcess.id;
      console.log('🔥 CENTRALIZED TERMINAL: Using active process ID:', processToCancel);
    }
    
    if (!processToCancel && $runningProcesses.length > 0) {
      processToCancel = $runningProcesses[0].id;
      console.log('🔥 CENTRALIZED TERMINAL: Using first running process ID:', processToCancel);
    }
    
    if (processToCancel) {
      console.log('🔥 CENTRALIZED TERMINAL: Cancelling process:', processToCancel);
      
      try {
        const result = await terminalStore.cancelProcess(processToCancel);
        console.log('🔥 CENTRALIZED TERMINAL: Cancel result:', result);
        
        if (result.success) {
          toastStore.success('Command cancelled');
        } else {
          toastStore.error('Failed to cancel command');
        }
      } catch (error) {
        console.error('🔥 CENTRALIZED TERMINAL: Failed to cancel process:', error);
        toastStore.error('Failed to cancel command');
      }
    } else {
      console.log('🔥 CENTRALIZED TERMINAL: No process found to cancel');
      toastStore.error('No running process to cancel');
    }
  }

  function clearOutput() {
    if (selectedProcessId) {
      terminalStore.clearProcessOutput(selectedProcessId);
    }
  }

  async function debugProcesses() {
    console.log('🔥 CENTRALIZED TERMINAL: === DEBUG INFO ===');
    console.log('🔥 CENTRALIZED TERMINAL: selectedProcessId:', selectedProcessId);
    console.log('🔥 CENTRALIZED TERMINAL: activeProcess:', $activeProcess);
    console.log('🔥 CENTRALIZED TERMINAL: runningProcesses:', $runningProcesses);
    console.log('🔥 CENTRALIZED TERMINAL: processHistory:', $processHistory);
    
    try {
      const runningProcesses = await invoke('get_running_processes');
      console.log('🔥 CENTRALIZED TERMINAL: Backend running processes:', runningProcesses);
    } catch (error) {
      console.error('🔥 CENTRALIZED TERMINAL: Failed to get backend processes:', error);
    }
    
    console.log('🔥 CENTRALIZED TERMINAL: === END DEBUG ===');
  }

  function selectProcess(processId: string) {
    terminalStore.setActiveProcess(processId);
  }

  function removeProcess(processId: string) {
    terminalStore.removeProcess(processId);
  }

  function createNewTab() {
    console.log('🔥 CENTRALIZED TERMINAL: Creating new tab');
    
    // Create a new empty process
    const processId = `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newProcess: TerminalProcess = {
      id: processId,
      command: '',
      args: [],
      workingDirectory: workingDirectory || projectPath,
      status: 'idle',
      output: '',
      startTime: new Date()
    };
    
    // Add to store and set as active
    terminalStore.addProcess(newProcess);
    terminalStore.setActiveProcess(processId);
    
    console.log('🔥 CENTRALIZED TERMINAL: New tab created:', processId);
  }

  // Keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'c' && isRunning) {
      event.preventDefault();
      setTimeout(() => cancelCurrentProcess(), 0);
    }
  }

  // Lifecycle
  onMount(() => {
    console.log('🔥 CENTRALIZED TERMINAL: Component mounted');
    document.addEventListener('keydown', handleKeydown);
    
    // Set the most recent running process as active, or the most recent completed process
    const processes = $processHistory;
    if (processes.length > 0) {
      const running = processes.find(p => p.status === 'running');
      if (running) {
        terminalStore.setActiveProcess(running.id);
      } else {
        terminalStore.setActiveProcess(processes[0].id);
      }
    }
  });

  onDestroy(() => {
    console.log('🔥 CENTRALIZED TERMINAL: Component destroyed');
    document.removeEventListener('keydown', handleKeydown);
  });

  // Auto-scroll to bottom when output changes
  $effect(() => {
    if ($activeProcess && outputContainer) {
      setTimeout(() => {
        outputContainer.scrollTop = outputContainer.scrollHeight;
      }, 0);
    }
  });
</script>

<div class="terminal-container {terminalStatus}">
  <!-- Terminal Header -->
  <div class="terminal-header">
    <div class="terminal-title">
      <span class="icon">💻</span>
      Terminal
      {#if terminalStatus !== 'idle'}
        <span class="status-badge {terminalStatus}">
          <span class="status-dot"></span>
          {terminalStatus}
        </span>
      {/if}
    </div>
    
    <div class="terminal-controls">
      {#if isRunning}
        <Button 
          variant="destructive"
          size="sm"
          onclick={() => setTimeout(() => cancelCurrentProcess(), 0)}
          title="Stop Command (Ctrl+C)"
          class="stop-btn"
        >
          ⏹️ Stop (Ctrl+C)
        </Button>
      {/if}
      <Button variant="ghost" size="sm" onclick={clearOutput} title="Clear Output">
        🗑️ Clear
      </Button>
      <Button variant="ghost" size="sm" onclick={debugProcesses} title="Debug Processes" class="debug-btn">
        🐛 Debug
      </Button>
    </div>
  </div>

  <!-- Process History Tabs -->
  <div class="process-tabs">
    {#if $processHistory.length > 0}
      {#each $processHistory as process}
        <Button 
          variant="ghost"
          onclick={() => selectProcess(process.id)}
          title="{process.command} - {process.status}"
          class="process-tab {process.id === selectedProcessId ? 'active' : ''} {process.status}"
        >
          <span class="tab-icon">
            {#if process.status === 'idle'}
              ➕
            {:else if process.status === 'running'}
              🔄
            {:else if process.status === 'success'}
              ✅
            {:else if process.status === 'error'}
              ❌
            {:else if process.status === 'cancelled'}
              ⏹️
            {/if}
          </span>
          <span class="tab-command">
            {#if process.status === 'idle' && !process.command}
              New Tab
            {:else}
              {process.command}
            {/if}
          </span>
                      <button 
              class="remove-tab"
              onclick={(e) => { e.stopPropagation(); removeProcess(process.id); }}
              title="Remove from history"
              type="button"
            >
              ×
            </button>
          </Button>
      {/each}
    {/if}
    
    <!-- New Tab Button -->
    <button 
      class="new-tab-btn"
      onclick={createNewTab}
      title="Create new terminal tab"
    >
      <span class="tab-icon">➕</span>
      <span class="tab-command">New Tab</span>
    </button>
  </div>

  <!-- Terminal Output -->
  <div class="terminal-output" bind:this={outputContainer}>
    {#if $activeProcess}
      {@html ansiConverter.toHtml($activeProcess.output || '')}
    {:else}
      <div class="no-output">
        <p>No active process. Start a command to see output here.</p>
      </div>
    {/if}
  </div>

  <!-- Command Input -->
  <div class="command-input-container">
    <input
      bind:this={commandInput}
      bind:value={currentCommand}
      placeholder="Enter command..."
      disabled={isRunning}
      onkeydown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const cmd = currentCommand.trim();
          if (cmd) {
            runCommand(cmd);
            currentCommand = '';
          }
        }
      }}
    />
    
    <button 
      class="run-btn" 
      disabled={isRunning || !currentCommand.trim()}
      onclick={() => {
        const cmd = currentCommand.trim();
        if (cmd) {
          runCommand(cmd);
          currentCommand = '';
        }
      }}
    >
      ▶️ Run
    </button>
  </div>

  <!-- Framework Quick Actions -->
  <div class="quick-actions">
    <h4>Quick Actions</h4>
    <div class="action-buttons">
      {#each Object.entries(frameworkCommands) as [framework, commands]}
        <div class="framework-group">
          <span class="framework-name">{framework}</span>
          {#each Object.entries(commands) as [action, command]}
            <button 
              class="action-btn"
              disabled={isRunning}
              onclick={() => runCommand(command)}
              title="{action}: {command}"
            >
              {action}
            </button>
          {/each}
        </div>
      {/each}
    </div>
    
    <!-- Debug Actions -->
    <div class="debug-actions">
      <h4>Debug Actions</h4>
      <div class="action-buttons">
        <button 
          class="action-btn debug-btn"
          onclick={() => runCommand('echo "Test command 1"')}
          title="Test command 1"
        >
          Test 1
        </button>
        <button 
          class="action-btn debug-btn"
          onclick={() => runCommand('echo "Test command 2"')}
          title="Test command 2"
        >
          Test 2
        </button>
        <button 
          class="action-btn debug-btn"
          onclick={() => runCommand('sleep 5 && echo "Long test completed"')}
          title="Long running test"
        >
          Long Test
        </button>
        <button 
          class="action-btn debug-btn"
          onclick={() => runCommand('nonexistentcommand')}
          title="Error test"
        >
          Error Test
        </button>
        <button 
          class="action-btn debug-btn"
          onclick={() => {
            console.log('🔥 DEBUG: Current process history:', $processHistory);
            console.log('🔥 DEBUG: Current active process:', $activeProcess);
            console.log('🔥 DEBUG: Current running processes:', $runningProcesses);
          }}
          title="Log debug info"
        >
          Debug Log
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .terminal-container {
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: #1a1a1a;
    color: #ffffff;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.4;
    transition: all 0.3s ease;
  }

  .terminal-container.running {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #1a1a1a 0%, #1e3a8a 100%);
  }

  .terminal-container.success {
    border-color: #10b981;
    background: linear-gradient(135deg, #1a1a1a 0%, #065f46 100%);
  }

  .terminal-container.error {
    border-color: #ef4444;
    background: linear-gradient(135deg, #1a1a1a 0%, #7f1d1d 100%);
  }

  .terminal-container.cancelled {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #1a1a1a 0%, #92400e 100%);
  }

  .terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #2d2d2d;
    border-bottom: 1px solid #404040;
    border-radius: 6px 6px 0 0;
  }

  .terminal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-badge.running {
    background: #1e40af;
    color: #dbeafe;
  }

  .status-badge.success {
    background: #065f46;
    color: #d1fae5;
  }

  .status-badge.error {
    background: #7f1d1d;
    color: #fecaca;
  }

  .status-badge.cancelled {
    background: #92400e;
    color: #fed7aa;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .terminal-controls {
    display: flex;
    gap: 8px;
  }

  .stop-btn, .clear-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .stop-btn {
    background: #dc2626;
    color: white;
  }

  .stop-btn:hover {
    background: #b91c1c;
  }

  .clear-btn {
    background: #6b7280;
    color: white;
  }

  .clear-btn:hover {
    background: #4b5563;
  }

  .process-tabs {
    display: flex;
    gap: 2px;
    padding: 8px 16px 0;
    background: #2d2d2d;
    border-bottom: 1px solid #404040;
    overflow-x: auto;
  }

  .process-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    border-radius: 6px 6px 0 0;
    background: #404040;
    color: #d1d5db;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .process-tab.active {
    background: #1a1a1a;
    color: white;
  }

  .process-tab.running {
    background: #1e40af;
    color: #dbeafe;
  }

  .process-tab.success {
    background: #065f46;
    color: #d1fae5;
  }

  .process-tab.error {
    background: #7f1d1d;
    color: #fecaca;
  }

  .process-tab.cancelled {
    background: #92400e;
    color: #fed7aa;
  }

  .tab-icon {
    font-size: 10px;
  }

  .tab-command {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .remove-tab {
    padding: 0;
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    font-size: 12px;
    cursor: pointer;
    opacity: 0.6;
  }

  .remove-tab:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  .new-tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px dashed #6b7280;
    border-radius: 6px 6px 0 0;
    background: transparent;
    color: #9ca3af;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .new-tab-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  .terminal-output {
    height: 300px;
    padding: 16px;
    overflow-y: auto;
    background: #1a1a1a;
  }

  .terminal-output :global(pre) {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .no-output {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6b7280;
    font-style: italic;
  }

  .command-input-container {
    display: flex;
    gap: 8px;
    padding: 16px;
    background: #2d2d2d;
    border-top: 1px solid #404040;
  }

  .command-input-container input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #404040;
    border-radius: 4px;
    background: #1a1a1a;
    color: white;
    font-family: inherit;
    font-size: 14px;
  }

  .command-input-container input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .command-input-container input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .run-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: #3b82f6;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .run-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .run-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .quick-actions {
    padding: 16px;
    background: #2d2d2d;
    border-top: 1px solid #404040;
  }

  .quick-actions h4 {
    margin: 0 0 12px 0;
    color: #d1d5db;
    font-size: 14px;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .framework-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .framework-name {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 500;
  }

  .action-btn {
    padding: 4px 8px;
    border: 1px solid #404040;
    border-radius: 4px;
    background: #1a1a1a;
    color: #d1d5db;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover:not(:disabled) {
    background: #404040;
    border-color: #6b7280;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
