<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { k8sAPI, type K8sNamespace } from "$lib/api/k8s";
  import { appStore, connectionState, namespaceState, preferences } from '$lib/stores/app-store';
  import { ideSettingsAPI, type IdeConfig, type FrameworkIdeMapping } from "$lib/api/ide-settings";
  import Icon from "@iconify/svelte";

  // Settings navigation
  type SettingsSection = 'namespaces' | 'general' | 'connection' | 'ides' | 'framework-ides';
  
  let currentSection = $state<SettingsSection>('namespaces');
  
  // Namespace settings
  let allNamespaces = $state<K8sNamespace[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state("");

  // IDE settings
  let ides = $state<IdeConfig[]>([]);
  let isLoadingIdes = $state(false);
  let showAddIdeModal = $state(false);
  let editingIde = $state<IdeConfig | null>(null);
  let newIdeName = $state("");
  let newIdeExecutable = $state("");
  let installedIdes = $state<string[]>([]);
  let isDetectingIdes = $state(false);

  // Framework IDE mapping settings
  let frameworkIdeMappings = $state<FrameworkIdeMapping[]>([]);
  let isLoadingFrameworkMappings = $state(false);
  let showAddFrameworkMappingModal = $state(false);
  let editingFrameworkMapping = $state<FrameworkIdeMapping | null>(null);
  let newFrameworkMappingFramework = $state("");
  let newFrameworkMappingIdeId = $state<number | null>(null);

  onMount(async () => {
    await loadNamespacesData();
    await loadIdesData();
    await loadFrameworkIdeMappingsData();
  });

  // Auto-detect IDEs when IDE settings tab is opened
  $effect(() => {
    if (currentSection === 'ides') {
      detectInstalledIdes();
    }
  });

  async function loadNamespacesData() {
    try {
      // Check if connected and load namespaces
      allNamespaces = await k8sAPI.getNamespaces();
    } catch (error) {
      console.error('Failed to load namespaces:', error);
      allNamespaces = []; // Set to empty array on error, no mock data
    } finally {
      isLoading = false;
    }
  }

  async function loadIdesData() {
    try {
      isLoadingIdes = true;
      console.log('🔧 [DEBUG] Loading IDEs...');
      ides = await ideSettingsAPI.getAllIdes();
      console.log('✅ [DEBUG] Loaded IDEs:', ides);
      console.log('🔧 [DEBUG] IDE IDs:', ides.map(ide => ({ id: ide.id, name: ide.name, idType: typeof ide.id })));
    } catch (error) {
      console.error('❌ [DEBUG] Failed to load IDEs:', error);
      ides = [];
    } finally {
      isLoadingIdes = false;
    }
  }

  async function loadFrameworkIdeMappingsData() {
    try {
      isLoadingFrameworkMappings = true;
      frameworkIdeMappings = await ideSettingsAPI.getAllFrameworkIdeMappings();
    } catch (error) {
      console.error('Failed to load framework IDE mappings:', error);
      frameworkIdeMappings = [];
    } finally {
      isLoadingFrameworkMappings = false;
    }
  }

  function openAddIdeModal() {
    showAddIdeModal = true;
    newIdeName = "";
    newIdeExecutable = "";
    editingIde = null;
  }

  function openEditIdeModal(ide: IdeConfig) {
    showAddIdeModal = true;
    editingIde = ide;
    newIdeName = ide.name;
    newIdeExecutable = ide.executable;
  }

  async function saveIde() {
    try {
      if (editingIde) {
        await ideSettingsAPI.updateIde(editingIde.id!, newIdeName, newIdeExecutable);
      } else {
        await ideSettingsAPI.addIde(newIdeName, newIdeExecutable);
      }
      showAddIdeModal = false;
      await loadIdesData();
    } catch (error) {
      console.error('Failed to save IDE:', error);
    }
  }

  async function deleteIde(id: number) {
    if (confirm('Are you sure you want to delete this IDE?')) {
      try {
        await ideSettingsAPI.deleteIde(id);
        await loadIdesData();
      } catch (error) {
        console.error('Failed to delete IDE:', error);
      }
    }
  }

  async function setDefaultIde(id: number) {
    try {
      await ideSettingsAPI.setDefaultIde(id);
      await loadIdesData();
    } catch (error) {
      console.error('Failed to set default IDE:', error);
    }
  }

  async function openIde(executable: string) {
    try {
      await ideSettingsAPI.openIde(executable);
    } catch (error) {
      console.error('Failed to open IDE:', error);
      alert(`Failed to open IDE: ${error}`);
    }
  }

  async function detectInstalledIdes() {
    try {
      isDetectingIdes = true;
      installedIdes = await ideSettingsAPI.detectInstalledIdes();
    } catch (error) {
      console.error('Failed to detect IDEs:', error);
      alert(`Failed to detect IDEs: ${error}`);
    } finally {
      isDetectingIdes = false;
    }
  }

  function isIdeInstalled(executable: string): boolean {
    return installedIdes.includes(executable);
  }

  function isIdeConfigured(executable: string): boolean {
    return ides.some(ide => ide.executable === executable);
  }

  // Framework IDE mapping functions
  function openAddFrameworkMappingModal() {
    console.log('🔧 [DEBUG] Opening add framework mapping modal');
    showAddFrameworkMappingModal = true;
    newFrameworkMappingFramework = "";
    newFrameworkMappingIdeId = null;
    editingFrameworkMapping = null;
    console.log('🔧 [DEBUG] Modal state reset:', {
      showModal: showAddFrameworkMappingModal,
      framework: newFrameworkMappingFramework,
      ideId: newFrameworkMappingIdeId,
      editing: editingFrameworkMapping
    });
  }

  function openEditFrameworkMappingModal(mapping: FrameworkIdeMapping) {
    showAddFrameworkMappingModal = true;
    editingFrameworkMapping = mapping;
    newFrameworkMappingFramework = mapping.framework;
    newFrameworkMappingIdeId = mapping.ide_id;
  }

  async function saveFrameworkMapping() {
    console.log('🔧 [DEBUG] saveFrameworkMapping called');
    console.log('🔧 [DEBUG] Current form values:', {
      framework: newFrameworkMappingFramework,
      ideId: newFrameworkMappingIdeId,
      ideIdType: typeof newFrameworkMappingIdeId,
      frameworkTrimmed: newFrameworkMappingFramework.trim()
    });
    
    try {
      if (!newFrameworkMappingFramework.trim() || !newFrameworkMappingIdeId) {
        console.warn('⚠️ [DEBUG] Validation failed - missing fields');
        alert('Please fill in all fields');
        return;
      }

      console.log('✅ [DEBUG] Validation passed, proceeding with save');

      if (editingFrameworkMapping) {
        console.log('🔧 [DEBUG] Editing existing mapping, deleting old one first');
        await ideSettingsAPI.deleteFrameworkIdeMapping(editingFrameworkMapping.framework);
      }
      
      console.log('🔧 [DEBUG] Calling setFrameworkIdeMapping...');
      await ideSettingsAPI.setFrameworkIdeMapping(newFrameworkMappingFramework, newFrameworkMappingIdeId);
      console.log('✅ [DEBUG] Framework mapping saved successfully');
      
      showAddFrameworkMappingModal = false;
      await loadFrameworkIdeMappingsData();
    } catch (error) {
      console.error('❌ [DEBUG] Failed to save framework mapping:', error);
      alert(`Failed to save framework mapping: ${error}`);
    }
  }

  async function deleteFrameworkMapping(framework: string) {
    if (confirm('Are you sure you want to delete this framework IDE mapping?')) {
      try {
        await ideSettingsAPI.deleteFrameworkIdeMapping(framework);
        await loadFrameworkIdeMappingsData();
      } catch (error) {
        console.error('Failed to delete framework mapping:', error);
        alert(`Failed to delete framework mapping: ${error}`);
      }
    }
  }

  function getFrameworkIcon(framework: string): string {
    const iconMap: Record<string, string> = {
      'React': 'devicon:react',
      'Vue.js': 'devicon:vuejs',
      'Angular': 'devicon:angularjs',
      'Node.js': 'devicon:nodejs',
      'Python': 'devicon:python',
      'Java': 'devicon:java',
      'Maven': 'devicon:maven',
      'Gradle': 'devicon:gradle',
      'Go': 'devicon:go',
      'Rust': 'devicon:rust',
      'PHP': 'devicon:php',
      'Ruby': 'devicon:ruby',
      'Swift': 'devicon:swift',
      'Flutter': 'devicon:flutter',
      'Docker': 'devicon:docker',
      'Kubernetes': 'devicon:kubernetes',
      'Svelte': 'devicon:svelte',
      'Next.js': 'devicon:nextjs',
      'Nuxt.js': 'devicon:nuxtjs',
      'Vite': 'devicon:vitejs',
      'Webpack': 'devicon:webpack',
      'Rollup': 'devicon:rollupjs',
      '.NET': 'devicon:dotnet',
      'Terraform': 'devicon:terraform',
      'Ansible': 'devicon:ansible',
      'Make': 'devicon:cmake',
      'CMake': 'devicon:cmake',
      'Tauri': 'devicon:rust'
    };
    return iconMap[framework] || 'devicon:folder';
  }

  function getIdeIcon(executable: string): string {
    const iconMap: Record<string, string> = {
      'code': '💻',
      'idea': '🟡',
      'webstorm': '🟠',
      'pycharm': '🟢',
      'goland': '🔵',
      'clion': '🟣',
      'rider': '🟤',
      'phpstorm': '🟡',
      'studio': '🟢',
      'subl': '🟠',
      'vim': '🟢',
      'nvim': '🟢',
      'emacs': '🟣',
      'atom': '🔵',
      'brackets': '🟢',
      'notepad++': '🔵',
      'gedit': '🟢',
      'kate': '🟣',
      'mousepad': '🟢',
      'leafpad': '🟢'
    };
    return iconMap[executable] || '⚙️';
  }

  const sortedIdes = $derived([...ides].sort((a, b) => {
    // First, sort by default status (default first)
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    
    // Then, sort by installation status (installed first)
    const aInstalled = installedIdes.length === 0 || isIdeInstalled(a.executable);
    const bInstalled = installedIdes.length === 0 || isIdeInstalled(b.executable);
    
    if (aInstalled && !bInstalled) return -1;
    if (!aInstalled && bInstalled) return 1;
    
    // Finally, sort alphabetically by name
    return a.name.localeCompare(b.name);
  }));

  function toggleStar(namespaceName: string) {
    appStore.toggleStarredNamespace(namespaceName);
  }

  function moveDown(index: number) {
    if (index < filteredNamespaces.length - 1) {
      const newOrder = filteredNamespaces.map(ns => ns.name);
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      appStore.setNamespaceOrder(newOrder);
    }
  }

  function moveUp(index: number) {
    if (index > 0) {
      const newOrder = filteredNamespaces.map(ns => ns.name);
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      appStore.setNamespaceOrder(newOrder);
    }
  }

  function testButtonClick() {
    console.log('Test button clicked!');
  }

  function clearAllSettings() {
    appStore.clearAllData();
  }

  let filteredNamespaces = $derived(allNamespaces.filter(ns => 
    ns.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const aStarred = $namespaceState.starred.includes(a.name);
    const bStarred = $namespaceState.starred.includes(b.name);
    
    // Starred namespaces first
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    
    // Then by custom order
    const aOrderIndex = $namespaceState.order.indexOf(a.name);
    const bOrderIndex = $namespaceState.order.indexOf(b.name);
    
    if (aOrderIndex !== -1 && bOrderIndex !== -1) {
      return aOrderIndex - bOrderIndex;
    }
    if (aOrderIndex !== -1) return -1;
    if (bOrderIndex !== -1) return 1;
    
    // Finally alphabetically
    return a.name.localeCompare(b.name);
  }));

  const settingsSections = [
    {
      id: 'namespaces' as SettingsSection,
      name: 'Namespace Settings',
      description: 'Manage namespace favorites and ordering',
      icon: '🏷️'
    },
    {
      id: 'connection' as SettingsSection,
      name: 'Connection Settings',
      description: 'Manage Kubernetes connection preferences',
      icon: '🔗'
    },
    {
      id: 'general' as SettingsSection,
      name: 'General Settings',
      description: 'General application settings',
      icon: '⚙️'
    },
    {
      id: 'ides' as SettingsSection,
      name: 'IDE Settings',
      description: 'Configure IDE executables for project opening',
      icon: '💻'
    },
    {
      id: 'framework-ides' as SettingsSection,
      name: 'Framework IDE Mappings',
      description: 'Set default IDEs for specific frameworks',
      icon: '🔗'
    }
  ];
</script>

<div class="flex-1 flex flex-col min-h-0">
  <!-- Main Content -->
  <div class="flex-1 overflow-y-auto p-6">
    <div class="w-full">
      <div class="flex gap-8">
        <!-- Sidebar -->
        <div class="w-64 flex-shrink-0">
          <nav class="space-y-2">
            {#each settingsSections as section}
              <button
                onclick={() => currentSection = section.id}
                class="w-full text-left p-3 rounded-lg transition-colors {currentSection === section.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}"
              >
                <div class="flex items-center space-x-3">
                  <span class="text-lg">{section.icon}</span>
                  <div>
                    <div class="font-medium text-slate-900 dark:text-white">
                      {section.name}
                    </div>
                    <div class="text-sm text-slate-500 dark:text-slate-400">
                      {section.description}
                    </div>
                  </div>
                </div>
              </button>
            {/each}
          </nav>
        </div>

        <!-- Content Area -->
        <div class="flex-1">
          {#if currentSection === 'namespaces'}
            <!-- Namespace Settings -->
            <div class="space-y-8">
              <div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Namespace Settings
                </h2>
                <p class="text-slate-600 dark:text-slate-400">
                  Manage your favorite namespaces and their display order
                </p>
              </div>

              <!-- Search -->
              <div>
                <div class="max-w-md">
                  <label for="search" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Search Namespaces
                  </label>
                  <input
                    id="search"
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search namespaces..."
                    class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {#if isLoading}
                <div class="text-center py-12">
                  <div class="text-slate-400 dark:text-slate-500 mb-4">
                    <svg class="mx-auto h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p class="text-slate-500 dark:text-slate-400">Loading namespaces...</p>
                </div>
              {:else}
                <!-- Unified Namespace List -->
                <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 class="text-lg font-medium text-slate-900 dark:text-white">
                      Namespaces ({filteredNamespaces.length})
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Star namespaces to prioritize them, use arrows to reorder starred namespaces
                    </p>
                  </div>
                  
                  <div class="p-6">
                    <div class="space-y-2">
                      {#each filteredNamespaces as namespace, index}
                        <div
                          class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          <div class="flex items-center space-x-3">
                            <div class="text-sm font-medium text-slate-500 dark:text-slate-400 w-6">
                              {index + 1}
                            </div>
                            <button
                              onclick={() => toggleStar(namespace.name)}
                              class="text-slate-400 hover:text-yellow-500 {$namespaceState.starred.includes(namespace.name) ? 'text-yellow-500' : ''}"
                            >
                              {$namespaceState.starred.includes(namespace.name) ? '⭐' : '☆'}
                            </button>
                            <div>
                              <div class="font-medium text-slate-900 dark:text-white">
                                {namespace.name}
                              </div>
                              <div class="text-sm text-slate-500 dark:text-slate-400">
                                {namespace.status} • {namespace.age}
                              </div>
                            </div>
                          </div>
                          
                          {#if $namespaceState.starred.includes(namespace.name)}
                            <div class="flex items-center space-x-1">
                              <button
                                onclick={() => moveUp(index)}
                                disabled={index === 0}
                                class="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ↑
                              </button>
                              <button
                                onclick={() => moveDown(index)}
                                disabled={index === filteredNamespaces.length - 1}
                                class="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ↓
                              </button>
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>

                <!-- Clear Settings -->
                <div class="mt-8">
                  <Button variant="outline" onclick={clearAllSettings} class="text-red-600 hover:text-red-700">
                    Clear All Namespace Settings
                  </Button>
                </div>
              {/if}
            </div>

          {:else if currentSection === 'connection'}
            <!-- Connection Settings -->
            <div class="space-y-8">
              <div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Connection Settings
                </h2>
                <p class="text-slate-600 dark:text-slate-400">
                  Manage Kubernetes connection preferences and auto-connect behavior
                </p>
              </div>

              <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">
                  Auto-Connect Preferences
                </h3>
                
                <div class="space-y-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-slate-900 dark:text-white">Enable Auto-Connect</div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">
                        Automatically connect to Kubernetes when the app starts
                      </div>
                    </div>
                                     <label class="relative inline-flex items-center cursor-pointer">
                       <input 
                         type="checkbox" 
                         class="sr-only peer"
                         checked={$preferences.autoConnect}
                         onchange={(e) => {
                           const target = e.target as HTMLInputElement;
                           appStore.setAutoConnect(target.checked);
                         }}
                       />
                       <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                     </label>
                  </div>

                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-slate-900 dark:text-white">Connection Status</div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">
                        Current connection state
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      {#if $connectionState.isConnected}
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Connected
                        </span>
                      {:else if $connectionState.isConnecting}
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Connecting...
                        </span>
                      {:else}
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Disconnected
                        </span>
                      {/if}
                    </div>
                  </div>

                  {#if $connectionState.currentContext}
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="font-medium text-slate-900 dark:text-white">Current Context</div>
                        <div class="text-sm text-slate-500 dark:text-slate-400">
                          Active Kubernetes context
                        </div>
                      </div>
                      <span class="text-sm font-medium text-slate-900 dark:text-white">
                        {$connectionState.currentContext}
                      </span>
                    </div>
                  {/if}

                  {#if $connectionState.lastConnected}
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="font-medium text-slate-900 dark:text-white">Last Connected</div>
                        <div class="text-sm text-slate-500 dark:text-slate-400">
                          When the last successful connection was made
                        </div>
                      </div>
                      <span class="text-sm text-slate-600 dark:text-slate-400">
                        {new Date($connectionState.lastConnected).toLocaleString()}
                      </span>
                    </div>
                  {/if}

                  {#if $connectionState.error}
                    <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                      <div class="flex items-center">
                        <span class="text-red-600 dark:text-red-400 mr-2">⚠️</span>
                        <span class="text-sm text-red-800 dark:text-red-200">
                          Connection Error: {$connectionState.error}
                        </span>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>

              <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">
                  Connection Actions
                </h3>
                
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-slate-900 dark:text-white">Test Connection</div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">
                        Test the current Kubernetes connection
                      </div>
                    </div>
                    <Button 
                      onclick={() => appStore.connect()}
                      disabled={$connectionState.isConnecting}
                    >
                      {$connectionState.isConnecting ? 'Connecting...' : 'Test Connection'}
                    </Button>
                  </div>

                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-slate-900 dark:text-white">Clear Connection Data</div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">
                        Clear stored connection preferences and data
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      onclick={() => {
                        localStorage.removeItem('k8s-auto-connect');
                        localStorage.removeItem('k8s-last-connected');
                        appStore.setAutoConnect(false);
                      }}
                    >
                      Clear Data
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          {:else if currentSection === 'general'}
            <!-- General Settings -->
            <div class="space-y-8">
              <div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  General Settings
                </h2>
                <p class="text-slate-600 dark:text-slate-400">
                  General application settings and preferences
                </p>
              </div>

              <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">
                  Application Preferences
                </h3>
                
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-slate-900 dark:text-white">Default Log Count</div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">Number of logs to fetch by default</div>
                    </div>
                    <select 
                      class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      value={$preferences.defaultLogCount}
                      onchange={(e) => {
                        const target = e.target as HTMLSelectElement;
                        appStore.setDefaultLogCount(parseInt(target.value));
                      }}
                    >
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                      <option value="500">500</option>
                    </select>
                  </div>

                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-slate-900 dark:text-white">Auto-refresh Interval</div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">Interval for live mode auto-refresh (seconds)</div>
                    </div>
                    <select 
                      class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      value={$preferences.refreshInterval / 1000}
                      onchange={(e) => {
                        const target = e.target as HTMLSelectElement;
                        appStore.setRefreshInterval(parseInt(target.value) * 1000);
                      }}
                    >
                      <option value="5">5 seconds</option>
                      <option value="10">10 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                    </select>
                  </div>

                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-slate-900 dark:text-white">Default Sort Order</div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">Default sorting for log entries</div>
                    </div>
                    <select 
                      class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      value={$preferences.sortOrder}
                      onchange={(e) => {
                        const target = e.target as HTMLSelectElement;
                        appStore.setSortOrder(target.value as 'newest' | 'oldest');
                      }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

          {:else if currentSection === 'ides'}
            <!-- IDE Settings -->
            <div class="space-y-8">
              <div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  IDE Settings
                </h2>
                <p class="text-slate-600 dark:text-slate-400">
                  Configure IDE executables for opening projects directly from the application
                </p>
              </div>



              <!-- Detected IDEs Section -->
              <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-lg font-medium text-slate-900 dark:text-white">
                        Detected IDEs ({installedIdes.length})
                      </h3>
                      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        IDEs found on your system that can be added to the configuration
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onclick={detectInstalledIdes}
                      disabled={isDetectingIdes}
                    >
                      {isDetectingIdes ? 'Detecting...' : 'Detect IDEs'}
                    </Button>
                  </div>
                </div>
                <div class="p-6">
                  {#if installedIdes.length === 0}
                    <div class="text-center py-8">
                      <p class="text-slate-500 dark:text-slate-400 mb-4">
                        No IDEs detected yet. Click "Detect IDEs" to scan your system.
                      </p>
                    </div>
                  {:else}
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {#each installedIdes as executable}
                        {@const isConfigured = isIdeConfigured(executable)}
                        <div class="flex flex-col items-center">
                          <div 
                            class="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer w-full"
                            onclick={() => openIde(executable)}
                            title="Open {executable}"
                          >
                            <div class="text-2xl mb-2">{getIdeIcon(executable)}</div>
                            <div class="flex items-center space-x-2 mb-2">
                              <span class="text-green-500 text-sm">✓</span>
                              <span class="font-mono text-sm text-slate-900 dark:text-white text-center">
                                {executable}
                              </span>
                            </div>
                          </div>
                          {#if !isConfigured}
                            <button 
                              class="mt-2 p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              onclick={() => {
                                newIdeName = executable.charAt(0).toUpperCase() + executable.slice(1);
                                newIdeExecutable = executable;
                                showAddIdeModal = true;
                                editingIde = null;
                              }}
                              title="Add IDE"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                              </svg>
                            </button>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Configured IDEs Section -->
              <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-lg font-medium text-slate-900 dark:text-white">
                        Configured IDEs
                      </h3>
                      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage IDE executables for project opening
                      </p>
                    </div>
                    <Button onclick={openAddIdeModal}>
                      Add IDE
                    </Button>
                  </div>
                </div>

                <div class="p-6">
                  {#if isLoadingIdes}
                    <div class="text-center py-12">
                      <div class="text-slate-400 dark:text-slate-500 mb-4">
                        <svg class="mx-auto h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <p class="text-slate-500 dark:text-slate-400">Loading IDEs...</p>
                    </div>
                  {:else if ides.length === 0}
                    <div class="text-center py-12">
                      <div class="text-slate-400 dark:text-slate-500 mb-4">
                        <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <p class="text-slate-500 dark:text-slate-400 mb-4">No IDEs configured</p>
                      <Button onclick={openAddIdeModal}>
                        Add Your First IDE
                      </Button>
                    </div>
                  {:else}
                    <div class="space-y-3">
                      {#each sortedIdes as ide}
                        <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                          <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-2">
                              <span class="text-lg">{getIdeIcon(ide.executable)}</span>
                              {#if ide.is_default}
                                <span class="text-yellow-500 text-sm">⭐</span>
                              {/if}
                              <span class="font-medium text-slate-900 dark:text-white">
                                {ide.name}
                              </span>
                              {#if installedIdes.length > 0}
                                {#if isIdeInstalled(ide.executable)}
                                  <span class="text-green-500 text-sm" title="IDE is installed and available">✓</span>
                                {:else}
                                  <span class="text-red-500 text-sm" title="IDE is not installed or not in PATH">✗</span>
                                {/if}
                              {/if}
                            </div>
                            <div class="text-sm text-slate-500 dark:text-slate-400 font-mono">
                              {ide.executable}
                            </div>
                          </div>
                          
                                                 <div class="flex items-center space-x-1">
                         {#if installedIdes.length === 0 || isIdeInstalled(ide.executable)}
                           <button
                             class="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                             onclick={() => openIde(ide.executable)}
                             title="Open IDE"
                           >
                             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                             </svg>
                           </button>
                         {/if}
                         {#if !ide.is_default}
                           <button
                             class="p-2 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                             onclick={() => setDefaultIde(ide.id!)}
                             title="Set as Default"
                           >
                             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                             </svg>
                           </button>
                         {/if}
                         <button
                           class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                           onclick={() => openEditIdeModal(ide)}
                           title="Edit IDE"
                         >
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                           </svg>
                         </button>
                         <button
                           class="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                           onclick={() => deleteIde(ide.id!)}
                           title="Delete IDE"
                         >
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                           </svg>
                         </button>
                       </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>


            </div>

          {:else if currentSection === 'framework-ides'}
            <!-- Framework IDE Mapping Settings -->
            <div class="space-y-8">
              <div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Framework IDE Mappings
                </h2>
                <p class="text-slate-600 dark:text-slate-400">
                  Set default IDEs for specific frameworks. When you open a project, it will automatically use the appropriate IDE based on the detected framework.
                </p>
                <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                  <p class="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Only configured and available IDEs will be shown in the mapping options. Make sure to add and configure your IDEs in the IDE Settings section first.
                  </p>
                </div>
              </div>

              <!-- Framework IDE Mappings Section -->
              <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-lg font-medium text-slate-900 dark:text-white">
                        Framework IDE Mappings
                      </h3>
                      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Configure which IDE to use for each framework type
                      </p>
                    </div>
                    <Button onclick={openAddFrameworkMappingModal}>
                      Add Mapping
                    </Button>
                  </div>
                </div>

                <div class="p-6">
                  {#if isLoadingFrameworkMappings}
                    <div class="text-center py-12">
                      <div class="text-slate-400 dark:text-slate-500 mb-4">
                        <svg class="mx-auto h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <p class="text-slate-500 dark:text-slate-400">Loading framework mappings...</p>
                    </div>
                  {:else if frameworkIdeMappings.length === 0}
                    <div class="text-center py-12">
                      <div class="text-slate-400 dark:text-slate-500 mb-4">
                        <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <p class="text-slate-500 dark:text-slate-400 mb-4">No framework IDE mappings configured</p>
                      <Button onclick={openAddFrameworkMappingModal}>
                        Add Your First Mapping
                      </Button>
                    </div>
                  {:else}
                    <div class="space-y-3">
                      {#each frameworkIdeMappings as mapping}
                        {@const ide = ides.find(i => i.id === mapping.ide_id)}
                        <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                          <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-2">
                              <Icon icon={getFrameworkIcon(mapping.framework)} class="w-5 h-5" />
                              <span class="font-medium text-slate-900 dark:text-white">
                                {mapping.framework}
                              </span>
                            </div>
                            <div class="flex items-center space-x-2">
                              <span class="text-slate-400">→</span>
                              <span class="text-lg">{getIdeIcon(ide?.executable || '')}</span>
                              <span class="font-medium text-slate-900 dark:text-white">
                                {ide?.name || 'Unknown IDE'}
                              </span>
                            </div>
                          </div>
                          
                          <div class="flex items-center space-x-1">
                            <button
                              class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              onclick={() => openEditFrameworkMappingModal(mapping)}
                              title="Edit Mapping"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              class="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              onclick={() => deleteFrameworkMapping(mapping.framework)}
                              title="Delete Mapping"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Add/Edit IDE Modal -->
  {#if showAddIdeModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">
          {editingIde ? 'Edit IDE' : 'Add IDE'}
        </h3>
        
        <div class="space-y-4">
          <div>
            <label for="ide-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              IDE Name
            </label>
            <input
              id="ide-name"
              type="text"
              bind:value={newIdeName}
              placeholder="e.g., VS Code, IntelliJ IDEA"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label for="ide-executable" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Executable
            </label>
            <input
              id="ide-executable"
              type="text"
              bind:value={newIdeExecutable}
              placeholder="e.g., code, intellij-idea, /usr/bin/code"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter the command name (e.g., "code") or full path to the executable
            </p>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <Button 
            variant="outline"
            onclick={() => showAddIdeModal = false}
          >
            Cancel
          </Button>
          <Button 
            onclick={saveIde}
            disabled={!newIdeName.trim() || !newIdeExecutable.trim()}
          >
            {editingIde ? 'Update' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Add/Edit Framework IDE Mapping Modal -->
  {#if showAddFrameworkMappingModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">
          {editingFrameworkMapping ? 'Edit Framework IDE Mapping' : 'Add Framework IDE Mapping'}
        </h3>
        
        <div class="space-y-4">
          <div>
            <label for="framework-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Framework
            </label>
            <select
              id="framework-name"
              bind:value={newFrameworkMappingFramework}
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a framework</option>
              <option value="React">React</option>
              <option value="Vue.js">Vue.js</option>
              <option value="Angular">Angular</option>
              <option value="Node.js">Node.js</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="Maven">Maven</option>
              <option value="Gradle">Gradle</option>
              <option value="Go">Go</option>
              <option value="Rust">Rust</option>
              <option value="PHP">PHP</option>
              <option value="Ruby">Ruby</option>
              <option value="Swift">Swift</option>
              <option value="Flutter">Flutter</option>
              <option value="Docker">Docker</option>
              <option value="Kubernetes">Kubernetes</option>
              <option value="Svelte">Svelte</option>
              <option value="Next.js">Next.js</option>
              <option value="Nuxt.js">Nuxt.js</option>
              <option value="Vite">Vite</option>
              <option value="Webpack">Webpack</option>
              <option value="Rollup">Rollup</option>
              <option value=".NET">.NET</option>
              <option value="Terraform">Terraform</option>
              <option value="Ansible">Ansible</option>
              <option value="Make">Make</option>
              <option value="CMake">CMake</option>
              <option value="Tauri">Tauri</option>
            </select>
          </div>
          
          <div>
            <label for="ide-selection" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              IDE
            </label>
            {#if ides.filter(ide => installedIdes.length === 0 || isIdeInstalled(ide.executable)).length === 0}
              <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                <p class="text-sm text-yellow-800 dark:text-yellow-200">
                  No configured IDEs are currently available. Please add and configure IDEs in the IDE Settings section first.
                </p>
              </div>
            {:else}
              <select
                id="ide-selection"
                bind:value={newFrameworkMappingIdeId}
                onchange={() => console.log('🔧 [DEBUG] IDE dropdown changed to:', { value: newFrameworkMappingIdeId, type: typeof newFrameworkMappingIdeId })}
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={null}>Select an IDE</option>
                {#each ides.filter(ide => installedIdes.length === 0 || isIdeInstalled(ide.executable)) as ide}
                  <option value={ide.id}>{ide.name} ({ide.executable}) - ID: {ide.id}</option>
                {/each}
              </select>
            {/if}
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <Button 
            variant="outline"
            onclick={() => showAddFrameworkMappingModal = false}
          >
            Cancel
          </Button>
          <Button 
            onclick={saveFrameworkMapping}
            disabled={!newFrameworkMappingFramework.trim() || !newFrameworkMappingIdeId || ides.filter(ide => installedIdes.length === 0 || isIdeInstalled(ide.executable)).length === 0}
          >
            {editingFrameworkMapping ? 'Update' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
