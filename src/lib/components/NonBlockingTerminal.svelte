<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import Button from './ui/button.svelte';
  import Icon from '@iconify/svelte';
  import AnsiToHtml from 'ansi-to-html';

  let { projectPath = '', framework = null } = $props<{
    projectPath?: string;
    framework?: string | null;
  }>();

  let output = $state('');
  let isRunning = $state(false);
  let currentCommand = $state('');
  let packageJsonScripts = $state<Array<{ title: string; command: string; icon: string }>>([]);
  let selectedCommand = $state('');
  let shellInfo = $state<any>(null);
  let unsubscribe: (() => void) | null = null;
  
  // Terminal status for visual feedback
  let terminalStatus = $state<'idle' | 'running' | 'success' | 'error' | 'cancelled'>('idle');
  
  // ANSI to HTML converter
  const ansiConverter = new AnsiToHtml({
    fg: '#000000',
    bg: '#ffffff',
    newline: true,
    escapeXML: true,
    stream: true
  });

  function getFrameworkCommands(): Array<{ title: string; command: string; icon: string }> {
    const commands: Array<{ title: string; command: string; icon: string }> = [];

    switch (framework?.toLowerCase()) {
      case 'node.js':
      case 'react':
      case 'vue.js':
      case 'angular':
      case 'next.js':
      case 'nuxt.js':
      case 'svelte':
      case 'vite':
      case 'webpack':
        commands.push(
          { title: 'npm install', command: 'npm install', icon: 'devicon:nodejs' },
          { title: 'npm run dev', command: 'npm run dev', icon: 'mdi:play' },
          { title: 'npm run build', command: 'npm run build', icon: 'mdi:hammer-wrench' },
          { title: 'npm test', command: 'npm test', icon: 'mdi:test-tube' },
          { title: 'npm run lint', command: 'npm run lint', icon: 'mdi:format-list-checks' }
        );
        break;
      
      case 'python':
      case 'poetry':
        commands.push(
          { title: 'pip install', command: 'pip install -r requirements.txt', icon: 'devicon:python' },
          { title: 'poetry install', command: 'poetry install', icon: 'devicon:python' },
          { title: 'python main.py', command: 'python main.py', icon: 'mdi:play' },
          { title: 'pytest', command: 'pytest', icon: 'mdi:test-tube' },
          { title: 'flake8', command: 'flake8', icon: 'mdi:format-list-checks' }
        );
        break;
      
      case 'go':
        commands.push(
          { title: 'go mod tidy', command: 'go mod tidy', icon: 'devicon:go' },
          { title: 'go run', command: 'go run .', icon: 'mdi:play' },
          { title: 'go build', command: 'go build', icon: 'mdi:hammer-wrench' },
          { title: 'go test', command: 'go test ./...', icon: 'mdi:test-tube' },
          { title: 'go vet', command: 'go vet ./...', icon: 'mdi:format-list-checks' }
        );
        break;
      
      case 'rust':
      case 'cargo':
        commands.push(
          { title: 'cargo build', command: 'cargo build', icon: 'devicon:rust' },
          { title: 'cargo run', command: 'cargo run', icon: 'mdi:play' },
          { title: 'cargo test', command: 'cargo test', icon: 'mdi:test-tube' },
          { title: 'cargo check', command: 'cargo check', icon: 'mdi:format-list-checks' },
          { title: 'cargo clippy', command: 'cargo clippy', icon: 'mdi:format-list-checks' }
        );
        break;
      
      case 'maven':
        commands.push(
          { title: 'mvn clean', command: 'mvn clean', icon: 'devicon:maven' },
          { title: 'mvn compile', command: 'mvn compile', icon: 'mdi:hammer-wrench' },
          { title: 'mvn test', command: 'mvn test', icon: 'mdi:test-tube' },
          { title: 'mvn package', command: 'mvn package', icon: 'mdi:package-variant' },
          { title: 'mvn install', command: 'mvn install', icon: 'mdi:download' },
          { title: 'mvn spring-boot:run', command: 'mvn spring-boot:run', icon: 'mdi:play' },
          { title: 'mvn dependency:tree', command: 'mvn dependency:tree', icon: 'mdi:tree' },
          { title: 'mvn clean install', command: 'mvn clean install', icon: 'mdi:refresh' }
        );
        break;
      
      default:
        commands.push(
          { title: 'ls', command: 'ls -la', icon: 'mdi:folder-open' },
          { title: 'pwd', command: 'pwd', icon: 'mdi:map-marker' },
          { title: 'git status', command: 'git status', icon: 'devicon:git' }
        );
    }

    return commands;
  }

  async function runCommand(command: string) {
    console.log('🔥 FRONTEND: runCommand called with:', command);
    if (isRunning) {
      console.log('🔥 FRONTEND: Command already running, returning');
      return;
    }
    
    try {
      console.log('🔥 FRONTEND: Starting command execution...');
      isRunning = true;
      currentCommand = command;
      terminalStatus = 'running';
      
      // Show the working directory in the output
      const workingDir = projectPath || 'current directory';
      output = `${workingDir} $ ${command}\n\n`;
      
      // Parse command and arguments, handling quotes properly
      const parts = parseCommand(command);
      const cmd = parts[0];
      const args = parts.slice(1);
      
      console.log('🔥 FRONTEND: Running command:', command);
      console.log('🔥 FRONTEND: Parsed command:', cmd);
      console.log('🔥 FRONTEND: Parsed args:', args);
      console.log('🔥 FRONTEND: Working directory:', projectPath);
      
      // Use the new execute_command_live function
      console.log('🔥 FRONTEND: Invoking execute_command_live...');
      const result = await invoke<{
        success: boolean;
        output: string;
        command_type: string;
        is_native: boolean;
        exit_code?: number;
        error_message?: string;
      }>('execute_command_live', { 
        command: cmd, 
        args: args,
        workingDirectory: projectPath || null
      });
      
      console.log('🔥 FRONTEND: Command completed:', result);
      
      // Convert ANSI codes to HTML for proper display
      if (result.output) {
        const htmlOutput = ansiConverter.toHtml(result.output);
        output += htmlOutput;
      }
      
      // Add completion message and set status
      if (result.success) {
        output += `\n✅ Command completed successfully`;
        if (result.exit_code !== undefined) {
          output += ` (exit code: ${result.exit_code})`;
        }
        terminalStatus = 'success';
        // Auto-clear success status after 3 seconds
        setTimeout(() => {
          if (terminalStatus === 'success') {
            terminalStatus = 'idle';
          }
        }, 3000);
      } else {
        output += `\n❌ Command failed`;
        if (result.exit_code !== undefined) {
          output += ` (exit code: ${result.exit_code})`;
        }
        if (result.error_message) {
          output += `\nError: ${result.error_message}`;
        }
        terminalStatus = 'error';
        // Auto-clear error status after 5 seconds
        setTimeout(() => {
          if (terminalStatus === 'error') {
            terminalStatus = 'idle';
          }
        }, 5000);
      }
      
    } catch (error) {
      console.error('🔥 FRONTEND: Command execution error:', error);
      output += `\n❌ Error: ${error}\n`;
      terminalStatus = 'error';
    } finally {
      isRunning = false;
      currentCommand = '';
    }
  }

  function parseCommand(command: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        continue;
      }
      
      if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        continue;
      }
      
      if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
          current = '';
        }
        continue;
      }
      
      current += char;
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    return parts;
  }

  function clearOutput() {
    output = '';
    terminalStatus = 'idle';
  }

  async function cancelCommand() {
    if (!isRunning) return;
    
    try {
      console.log('🔥 FRONTEND: Cancelling command...');
      
      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cancellation timeout')), 5000);
      });
      
      // Race between cancellation and timeout
      await Promise.race([
        invoke('cancel_command'),
        timeoutPromise
      ]);
      
      output += '\n⚠️ Command cancelled by user (Ctrl+C)\n';
      isRunning = false;
      currentCommand = '';
      terminalStatus = 'cancelled';
      // Auto-clear cancelled status after 3 seconds
      setTimeout(() => {
        if (terminalStatus === 'cancelled') {
          terminalStatus = 'idle';
        }
      }, 3000);
    } catch (error) {
      console.error('🔥 FRONTEND: Error cancelling command:', error);
      output += `\n❌ Error cancelling command: ${error}\n`;
      // Even if cancellation fails, reset the state
      isRunning = false;
      currentCommand = '';
      terminalStatus = 'error';
    }
  }

  async function loadPackageJsonScripts() {
    if (!framework || !['node.js', 'react', 'vue.js', 'angular', 'next.js', 'nuxt.js', 'svelte', 'vite', 'webpack'].includes(framework.toLowerCase())) {
      return;
    }

    try {
      const packageJsonContent = await invoke<string>('read_file', { 
        path: `${projectPath}/package.json` 
      });
      
      if (packageJsonContent) {
        const packageJson = JSON.parse(packageJsonContent);
        
        packageJsonScripts = Object.keys(packageJson.scripts || {}).map(scriptName => ({
          title: scriptName,
          command: `npm run ${scriptName}`,
          icon: 'devicon:nodejs'
        }));
      }
    } catch (error) {
      console.error('Failed to load package.json scripts:', error);
      packageJsonScripts = [];
    }
  }

  async function loadShellInfo() {
    try {
      shellInfo = await invoke('get_shell_info');
    } catch (error) {
      console.error('Failed to load shell info:', error);
    }
  }

  onMount(() => {
    // Set up event listener for real-time command output
    console.log('🔥 FRONTEND: Setting up command output listener...');
    
    // Use a more robust event listener setup with retry mechanism
    const setupEventListener = async (retryCount = 0) => {
      try {
        console.log(`🔥 FRONTEND: Setting up event listener (attempt ${retryCount + 1})...`);
        
        const unsub = await listen('command_output', (event) => {
          const line = event.payload as string;
          console.log('🔥 FRONTEND: Received command output:', line);
          
          // Convert ANSI codes to HTML and append to output
          const htmlLine = ansiConverter.toHtml(line);
          console.log('🔥 FRONTEND: Adding to output:', htmlLine);
          output += htmlLine + '\n';
          console.log('🔥 FRONTEND: Output length after update:', output.length);
        });
        
        console.log('🔥 FRONTEND: Command output listener set up successfully');
        unsubscribe = unsub;
      } catch (error) {
        console.error('🔥 FRONTEND: Failed to set up command output listener:', error);
        
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`🔥 FRONTEND: Retrying in ${delay}ms...`);
          setTimeout(() => setupEventListener(retryCount + 1), delay);
        } else {
          console.error('🔥 FRONTEND: Failed to set up event listener after 3 attempts');
        }
      }
    };
    
    // Set up the event listener
    setupEventListener();

    // Set up keyboard shortcuts
    const handleKeydown = async (event: KeyboardEvent) => {
      // Ctrl+C to cancel command
      if (event.ctrlKey && event.key === 'c' && isRunning) {
        event.preventDefault();
        // Use setTimeout to prevent blocking the UI
        setTimeout(() => {
          cancelCommand();
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeydown);

    loadPackageJsonScripts();
    loadShellInfo();

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
</script>

<div class="space-y-4">
  <!-- Terminal Header -->
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Non-Blocking Terminal</h3>
    <div class="flex items-center space-x-2">
      {#if projectPath}
        <div class="text-xs text-blue-600 dark:text-blue-400 font-medium">
          Working Directory: {projectPath}
        </div>
      {/if}
      {#if shellInfo}
        <div class="text-xs text-slate-500 dark:text-slate-400">
          Shell: {shellInfo.shell}
        </div>
      {/if}
    </div>
  </div>

  <!-- Framework Commands -->
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
    <h4 class="text-md font-medium text-slate-900 dark:text-white mb-4">
      Framework Commands
    </h4>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {#each getFrameworkCommands() as command}
        <Button variant="outline" 
          onclick={() => selectedCommand = command.command}
          disabled={isRunning}
          class="h-auto p-3 flex flex-col items-center text-sm {selectedCommand === command.command ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''}"
        >
          <Icon icon={command.icon} class="w-5 h-5 mb-1" />
          <span class="text-xs">{command.title}</span>
        </Button>
      {/each}
    </div>
  </div>

  <!-- Package.json Scripts -->
  {#if packageJsonScripts.length > 0}
    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h4 class="text-md font-medium text-slate-900 dark:text-white mb-4">
        Package.json Scripts
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {#each packageJsonScripts as script}
          <Button variant="outline" 
            onclick={() => selectedCommand = script.command}
            disabled={isRunning}
            class="h-auto p-3 flex flex-col items-center text-sm {selectedCommand === script.command ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''}"
          >
            <Icon icon={script.icon} class="w-5 h-5 mb-1" />
            <span class="text-xs">{script.title}</span>
          </Button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Terminal Output -->
  <div class="bg-white dark:bg-slate-800 rounded-lg border transition-all duration-300 {
    terminalStatus === 'running' ? 'border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' :
    terminalStatus === 'success' ? 'border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-900/20' :
    terminalStatus === 'error' ? 'border-red-300 dark:border-red-600 bg-red-50/50 dark:bg-red-900/20' :
    terminalStatus === 'cancelled' ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/20' :
    'border-slate-200 dark:border-slate-700'
  }">
    <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Output</span>
          {#if terminalStatus !== 'idle'}
            <div class="flex items-center space-x-1">
              {#if terminalStatus === 'running'}
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span class="text-xs text-blue-600 dark:text-blue-400">Running</span>
              {:else if terminalStatus === 'success'}
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span class="text-xs text-green-600 dark:text-green-400">Success</span>
              {:else if terminalStatus === 'error'}
                <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                <span class="text-xs text-red-600 dark:text-red-400">Error</span>
              {:else if terminalStatus === 'cancelled'}
                <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span class="text-xs text-yellow-600 dark:text-yellow-400">Cancelled</span>
              {/if}
            </div>
          {/if}
        </div>
        <div class="flex items-center space-x-2">
          {#if isRunning}
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xs text-green-600 dark:text-green-400">Running: {currentCommand}</span>
              <Button variant="outline" 
                onclick={() => {
                  // Use setTimeout to prevent blocking the UI
                  setTimeout(() => {
                    cancelCommand();
                  }, 0);
                }} 
                size="sm"
                class="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <Icon icon="mdi:stop" class="w-4 h-4 mr-1" />
                Stop (Ctrl+C)
              </Button>
            </div>
          {/if}
          <Button variant="outline" onclick={clearOutput} size="sm">
            <Icon icon="mdi:delete" class="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button variant="outline" 
            onclick={() => {
              console.log('🔥 FRONTEND: Testing output update...');
              output += '🧪 Test output: ' + new Date().toLocaleTimeString() + '\n';
              console.log('🔥 FRONTEND: Output length after test:', output.length);
            }} 
            size="sm"
            class="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
          >
            <Icon icon="mdi:test-tube" class="w-4 h-4 mr-2" />
            Test Output
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Command Input -->
    <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
      <div class="flex items-center space-x-2">
        <input
          type="text"
          bind:value={selectedCommand}
          placeholder="Enter command or select from below..."
          class="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isRunning}
          onkeydown={(e) => {
            if (e.key === 'Enter' && !isRunning && selectedCommand.trim()) {
              runCommand(selectedCommand);
            }
          }}
        />
        <Button onclick={() => runCommand(selectedCommand)}
          disabled={isRunning || !selectedCommand.trim()}
          size="sm"
        >
          <Icon icon="mdi:play" class="w-4 h-4 mr-2" />
          Run
        </Button>
      </div>
    </div>
    
    <div class="p-4">
      <div class="text-sm font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
        {@html output || 'No output yet. Run a command to see results.'}
      </div>
    </div>
  </div>
</div>
