<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { k8sAPI, type K8sNamespace } from "$lib/api/k8s";
  import { appStore, connectionState, namespaceState, preferences } from '$lib/stores/app-store';

  // Settings navigation
  type SettingsSection = 'namespaces' | 'general' | 'connection';
  
  let currentSection = $state<SettingsSection>('namespaces');
  
  // Namespace settings
  let allNamespaces = $state<K8sNamespace[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state("");

  onMount(async () => {
    await loadNamespacesData();
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
    }
  ];
</script>

<div class="flex-1 flex flex-col min-h-0">
  <!-- Main Content -->
  <div class="flex-1 overflow-y-auto p-6">
    <div class="max-w-7xl mx-auto">
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
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
