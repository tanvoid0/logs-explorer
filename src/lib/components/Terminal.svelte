<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Terminal } from '@xterm/xterm';
  import Button from '$lib/components/ui/button.svelte';
  import { FitAddon } from '@xterm/addon-fit';
  import { WebLinksAddon } from '@xterm/addon-web-links';
  import { invoke } from '@tauri-apps/api/core';

  let { 
    title = 'Terminal', 
    cwd = '', 
    command = '', 
    onClose = () => {} 
  } = $props<{
    title?: string;
    cwd?: string;
    command?: string;
    onClose?: () => void;
  }>();

  let terminalContainer: HTMLDivElement;
  let terminal: Terminal;
  let fitAddon: FitAddon;
  let processId: number | null = null;
  let isRunning = $state(false);
  let output = $state('');

  onMount(() => {
    initializeTerminal();
    if (command) {
      runCommand();
    }
  });

  onDestroy(() => {
    if (processId !== null) {
      invoke('kill_process', { pid: processId });
    }
    if (terminal) {
      terminal.dispose();
    }
  });

  function initializeTerminal() {
    terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff'
      }
    });

    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());

    terminal.open(terminalContainer);
    fitAddon.fit();

    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalContainer);

    // Write initial message
    terminal.writeln(`\x1b[1;32m${title}\x1b[0m`);
    terminal.writeln(`\x1b[1;36mWorking directory: ${cwd}\x1b[0m`);
    terminal.writeln('');
  }

  async function runCommand() {
    if (!command || isRunning) return;

    try {
      isRunning = true;
      terminal.writeln(`\x1b[1;33m$ ${command}\x1b[0m`);
      terminal.writeln('');

      // Start the command process
      const result = await invoke<{ pid: number; success: boolean }>('start_process', {
        command,
        cwd,
        args: []
      });

      processId = result.pid;

      if (result.success) {
        // Start reading output
        await readProcessOutput();
      } else {
        terminal.writeln('\x1b[1;31mFailed to start process\x1b[0m');
        isRunning = false;
      }
    } catch (error) {
      terminal.writeln(`\x1b[1;31mError: ${error}\x1b[0m`);
      isRunning = false;
    }
  }

  async function readProcessOutput() {
    if (processId === null) return;

    try {
      while (isRunning) {
        const output = await invoke<string>('read_process_output', { pid: processId });
        
        if (output) {
          terminal.write(output);
        }

        // Check if process is still running
        const status = await invoke<boolean>('is_process_running', { pid: processId });
        if (!status) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Process finished
      const exitCode = await invoke<number>('get_process_exit_code', { pid: processId });
      terminal.writeln('');
      terminal.writeln(`\x1b[1;36mProcess finished with exit code: ${exitCode}\x1b[0m`);
      
      if (exitCode === 0) {
        terminal.writeln('\x1b[1;32m✓ Command completed successfully\x1b[0m');
      } else {
        terminal.writeln('\x1b[1;31m✗ Command failed\x1b[0m');
      }
    } catch (error) {
      terminal.writeln(`\x1b[1;31mError reading output: ${error}\x1b[0m`);
    } finally {
      isRunning = false;
      processId = null;
    }
  }

  function stopCommand() {
    if (processId !== null) {
      invoke('kill_process', { pid: processId });
      terminal.writeln('\x1b[1;33mProcess stopped by user\x1b[0m');
      isRunning = false;
      processId = null;
    }
  }

  function clearTerminal() {
    terminal.clear();
    terminal.writeln(`\x1b[1;32m${title}\x1b[0m`);
    terminal.writeln(`\x1b[1;36mWorking directory: ${cwd}\x1b[0m`);
    terminal.writeln('');
  }
</script>

<div class="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
  <!-- Terminal Header -->
  <div class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
    <div class="flex items-center space-x-2">
      <div class="w-3 h-3 rounded-full bg-red-500"></div>
      <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
      <div class="w-3 h-3 rounded-full bg-green-500"></div>
      <span class="text-gray-300 text-sm font-medium ml-2">{title}</span>
      {#if isRunning}
        <div class="flex items-center space-x-1">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-green-400 text-xs">Running</span>
        </div>
      {/if}
    </div>
    
    <div class="flex items-center space-x-2">
      <Button
        onclick={clearTerminal}
        variant="ghost"
        size="sm"
        class="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
        title="Clear terminal"
      >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </Button>
      {#if isRunning}
        <button
          onclick={stopCommand}
          class="p-1 text-red-400 hover:text-red-200 hover:bg-red-900/20 rounded"
          title="Stop command"
          aria-label="Stop command"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
          </svg>
        </button>
      {/if}
      <button
        onclick={onClose}
        class="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
        title="Close terminal"
        aria-label="Close terminal"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  </div>

  <!-- Terminal Content -->
  <div bind:this={terminalContainer} class="flex-1 p-2"></div>
</div>

<style>
  :global(.xterm) {
    padding: 8px;
  }
  
  :global(.xterm-viewport) {
    background-color: transparent !important;
  }
</style>
