<script lang="ts">
  import { onMount } from 'svelte';
  import Terminal from './Terminal.svelte';
  import Button from './ui/button.svelte';
  import Icon from '@iconify/svelte';

  let { projectPath = '', framework = null } = $props<{
    projectPath?: string;
    framework?: string | null;
  }>();

  interface TerminalTab {
    id: string;
    title: string;
    command: string;
    isActive: boolean;
  }

  let terminals = $state<TerminalTab[]>([]);
  let activeTabId = $state<string | null>(null);
  let showTerminalManager = $state(false);

  onMount(() => {
    // Initialize with a default terminal
    addTerminal('Terminal', '');
  });

  function addTerminal(title: string, command: string) {
    const id = `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTerminal: TerminalTab = {
      id,
      title,
      command,
      isActive: false
    };

    terminals = [...terminals, newTerminal];
    setActiveTab(id);
  }

  function setActiveTab(tabId: string) {
    terminals = terminals.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    }));
    activeTabId = tabId;
  }

  function closeTerminal(tabId: string) {
    terminals = terminals.filter(tab => tab.id !== tabId);
    
    if (terminals.length === 0) {
      showTerminalManager = false;
      activeTabId = null;
    } else if (activeTabId === tabId) {
      setActiveTab(terminals[0].id);
    }
  }

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
      
      case 'java':
      case 'maven':
        commands.push(
          { title: 'mvn clean install', command: 'mvn clean install', icon: 'devicon:maven' },
          { title: 'mvn spring-boot:run', command: 'mvn spring-boot:run', icon: 'mdi:play' },
          { title: 'mvn test', command: 'mvn test', icon: 'mdi:test-tube' },
          { title: 'mvn compile', command: 'mvn compile', icon: 'mdi:hammer-wrench' }
        );
        break;
      
      case 'gradle':
        commands.push(
          { title: 'gradle build', command: './gradlew build', icon: 'devicon:gradle' },
          { title: 'gradle bootRun', command: './gradlew bootRun', icon: 'mdi:play' },
          { title: 'gradle test', command: './gradlew test', icon: 'mdi:test-tube' },
          { title: 'gradle clean', command: './gradlew clean', icon: 'mdi:hammer-wrench' }
        );
        break;
      
      case 'php':
      case 'composer':
        commands.push(
          { title: 'composer install', command: 'composer install', icon: 'devicon:composer' },
          { title: 'php artisan serve', command: 'php artisan serve', icon: 'mdi:play' },
          { title: 'php artisan test', command: 'php artisan test', icon: 'mdi:test-tube' },
          { title: 'composer test', command: 'composer test', icon: 'mdi:test-tube' }
        );
        break;
      
      case 'ruby':
      case 'rails':
        commands.push(
          { title: 'bundle install', command: 'bundle install', icon: 'devicon:ruby' },
          { title: 'rails server', command: 'rails server', icon: 'mdi:play' },
          { title: 'rails test', command: 'rails test', icon: 'mdi:test-tube' },
          { title: 'rubocop', command: 'rubocop', icon: 'mdi:format-list-checks' }
        );
        break;
      
      case 'docker':
        commands.push(
          { title: 'docker build', command: 'docker build -t app .', icon: 'devicon:docker' },
          { title: 'docker run', command: 'docker run -p 3000:3000 app', icon: 'mdi:play' },
          { title: 'docker-compose up', command: 'docker-compose up', icon: 'mdi:play' },
          { title: 'docker-compose down', command: 'docker-compose down', icon: 'mdi:stop' }
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

  function runFrameworkCommand(title: string, command: string) {
    addTerminal(title, command);
    showTerminalManager = true;
  }

  async function loadPackageJsonScripts() {
    if (!framework || !['node.js', 'react', 'vue.js', 'angular', 'next.js', 'nuxt.js', 'svelte', 'vite', 'webpack'].includes(framework.toLowerCase())) {
      return [];
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const packageJsonContent = await invoke<string>('read_file', { 
        path: `${projectPath}/package.json` 
      });
      
      if (packageJsonContent) {
        const packageJson = JSON.parse(packageJsonContent);
        return Object.keys(packageJson.scripts || {}).map(scriptName => ({
          title: `npm run ${scriptName}`,
          command: `npm run ${scriptName}`,
          icon: 'devicon:npm-icon'
        }));
      }
    } catch (error) {
      console.error('Failed to load package.json scripts:', error);
    }

    return [];
  }

  let packageJsonScripts = $state<Array<{ title: string; command: string; icon: string }>>([]);

  onMount(async () => {
    packageJsonScripts = await loadPackageJsonScripts();
  });
</script>

<div class="space-y-4">
  <!-- Terminal Manager Toggle -->
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Terminal</h3>
    <Button variant="outline" 
      onclick={() => showTerminalManager = !showTerminalManager}
    >
      <Icon icon="mdi:terminal" class="w-4 h-4 mr-2" />
      {showTerminalManager ? 'Hide Terminal' : 'Show Terminal'}
    </Button>
  </div>

  {#if showTerminalManager}
    <!-- Framework Commands -->
    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h4 class="text-md font-medium text-slate-900 dark:text-white mb-4">
        Framework Commands
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {#each getFrameworkCommands() as command}
          <Button variant="outline" 
            onclick={() => runFrameworkCommand(command.title, command.command)}
            class="h-auto p-3 flex flex-col items-center text-sm"
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
              onclick={() => runFrameworkCommand(script.title, script.command)}
              class="h-auto p-3 flex flex-col items-center text-sm"
            >
              <Icon icon={script.icon} class="w-5 h-5 mb-1" />
              <span class="text-xs">{script.title}</span>
            </Button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Terminal Tabs -->
    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <!-- Tab Headers -->
      <div class="flex items-center border-b border-slate-200 dark:border-slate-700">
        {#each terminals as terminal}
          <div class="flex items-center">
            <button
              onclick={() => setActiveTab(terminal.id)}
              class="flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors {terminal.isActive 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}"
            >
              <Icon icon="mdi:terminal" class="w-4 h-4" />
              <span class="text-sm font-medium">{terminal.title}</span>
            </button>
            <button
              onclick={() => closeTerminal(terminal.id)}
              class="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
            >
              <Icon icon="mdi:close" class="w-3 h-3" />
            </button>
          </div>
        {/each}
        <button
          onclick={() => addTerminal('New Terminal', '')}
          class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          title="New Terminal"
        >
          <Icon icon="mdi:plus" class="w-4 h-4" />
        </button>
      </div>

      <!-- Terminal Content -->
      <div class="h-96">
        {#each terminals as terminal}
          {#if terminal.isActive}
            <Terminal
              title={terminal.title}
              cwd={projectPath}
              command={terminal.command}
              onClose={() => closeTerminal(terminal.id)}
            />
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
