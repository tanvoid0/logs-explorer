<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
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
          { title: 'npm install', command: 'npm install', icon: 'devicon:npm-icon' },
          { title: 'npm run dev', command: 'npm run dev', icon: 'mdi:play' },
          { title: 'npm run build', command: 'npm run build', icon: 'mdi:hammer-wrench' },
          { title: 'npm run test', command: 'npm run test', icon: 'mdi:test-tube' },
          { title: 'npm run lint', command: 'npm run lint', icon: 'mdi:format-list-checks' }
        );
        break;
      
      case 'yarn':
        commands.push(
          { title: 'yarn install', command: 'yarn install', icon: 'devicon:yarn' },
          { title: 'yarn dev', command: 'yarn dev', icon: 'mdi:play' },
          { title: 'yarn build', command: 'yarn build', icon: 'mdi:hammer-wrench' },
          { title: 'yarn test', command: 'yarn test', icon: 'mdi:test-tube' },
          { title: 'yarn lint', command: 'yarn lint', icon: 'mdi:format-list-checks' }
        );
        break;
      
      case 'pnpm':
        commands.push(
          { title: 'pnpm install', command: 'pnpm install', icon: 'devicon:pnpm' },
          { title: 'pnpm dev', command: 'pnpm dev', icon: 'mdi:play' },
          { title: 'pnpm build', command: 'pnpm build', icon: 'mdi:hammer-wrench' },
          { title: 'pnpm test', command: 'pnpm test', icon: 'mdi:test-tube' },
          { title: 'pnpm lint', command: 'pnpm lint', icon: 'mdi:format-list-checks' }
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
    if (isRunning) return;
    
    try {
      isRunning = true;
      currentCommand = command;
      
      // Show the working directory in the output
      const workingDir = projectPath || 'current directory';
      output = `${workingDir} $ ${command}\n\n`;
      
      // Parse command and arguments, handling quotes properly
      const parts = parseCommand(command);
      const cmd = parts[0];
      const args = parts.slice(1);
      
      // Use the new execute_command_in_directory function if we have a project path
      let result: string;
      if (projectPath) {
        const { projectsAPI } = await import('../api/projects');
        result = await projectsAPI.executeCommandInProject(projectPath, cmd, args);
      } else {
        result = await invoke<string>('execute_command', { 
          command: cmd, 
          args: args 
        });
      }
      
      // Convert ANSI codes to HTML for proper display
      const htmlOutput = ansiConverter.toHtml(result);
      output += htmlOutput;
    } catch (error) {
      output += `Error: ${error}\n`;
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
    loadPackageJsonScripts();
    loadShellInfo();
  });
</script>

<div class="space-y-4">
  <!-- Terminal Header -->
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Terminal</h3>
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
        Package.json Scripts ({packageJsonScripts.length})
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
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
    <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Output</span>
        <div class="flex items-center space-x-2">
          {#if isRunning}
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xs text-green-600 dark:text-green-400">Running: {currentCommand}</span>
            </div>
          {/if}
          <Button variant="outline" onclick={clearOutput} size="sm">
            <Icon icon="mdi:delete" class="w-4 h-4 mr-2" />
            Clear
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
