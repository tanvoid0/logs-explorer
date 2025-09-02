<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { sdkStore, sdkManagers, installedSDKs, availableManagers, installedSDKsByType, recentOperations, isLoading, error } from '$lib/stores/sdk-store';
  import type { SDKManager, SDKDetectionResult, SDKManagerOperation } from '$lib/types/sdk';

  let activeTab = $state('overview');
  let selectedSDK = $state<string | null>(null);
  let selectedManager = $state<string | null>(null);
  let installVersion = $state('');
  let showInstallDialog = $state(false);
  let hasInitialized = false;

  onMount(() => {
    // Don't automatically refresh - let user manually refresh when needed
    hasInitialized = true;
  });

  function getSDKIcon(sdkName: string): string {
    const iconMap: Record<string, string> = {
      node: 'logos:nodejs-icon',
      python: 'logos:python',
      rust: 'logos:rust',
      go: 'logos:go',
      java: 'logos:java',
      ruby: 'logos:ruby',
      php: 'logos:php',
      dotnet: 'logos:dotnet',
      flutter: 'logos:flutter',
      dart: 'logos:dart',
      kotlin: 'logos:kotlin',
      scala: 'logos:scala',
      elixir: 'logos:elixir',
      erlang: 'logos:erlang',
      haskell: 'logos:haskell',
      ocaml: 'logos:ocaml',
      clojure: 'logos:clojure',
      groovy: 'logos:groovy',
      maven: 'logos:maven',
      gradle: 'logos:gradle',
      sbt: 'logos:sbt',
      cargo: 'logos:rust',
      npm: 'logos:npm-icon',
      yarn: 'logos:yarn',
      pnpm: 'logos:pnpm',
      pip: 'logos:python',
      poetry: 'logos:python',
      conda: 'logos:conda',
      brew: 'logos:homebrew',
      apt: 'logos:ubuntu',
      yum: 'logos:redhat',
      dnf: 'logos:fedora',
      pacman: 'logos:archlinux'
    };
    return iconMap[sdkName] || 'mdi:code-braces';
  }

  function getManagerIcon(managerName: string): string {
    const iconMap: Record<string, string> = {
      sdkman: 'mdi:package-variant',
      nvm: 'logos:nodejs-icon',
      pyenv: 'logos:python',
      rvm: 'logos:ruby',
      rbenv: 'logos:ruby',
      gvm: 'logos:go',
      rustup: 'logos:rust',
      asdf: 'mdi:package-variant-closed',
      volta: 'logos:nodejs-icon',
      fnm: 'logos:nodejs-icon',
      n: 'logos:nodejs-icon',
      conda: 'logos:conda',
      mamba: 'logos:conda',
      pipenv: 'logos:python',
      poetry: 'logos:python',
      cargo: 'logos:rust',
      go: 'logos:go',
      brew: 'logos:homebrew',
      apt: 'logos:ubuntu',
      yum: 'logos:redhat',
      dnf: 'logos:fedora',
      pacman: 'logos:archlinux'
    };
    return iconMap[managerName] || 'mdi:package-variant';
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'mdi:check-circle';
      case 'failed': return 'mdi:close-circle';
      case 'running': return 'mdi:loading';
      case 'pending': return 'mdi:clock-outline';
      default: return 'mdi:help-circle';
    }
  }

  async function handleInstallSDK() {
    if (!selectedSDK) return;
    
    try {
      await sdkStore.installSDK(selectedSDK, installVersion || undefined);
      showInstallDialog = false;
      installVersion = '';
      selectedSDK = null;
    } catch (err) {
      console.error('Failed to install SDK:', err);
    }
  }

  async function handleSwitchVersion(sdkName: string, version: string) {
    try {
      await sdkStore.switchSDKVersion(sdkName, version);
    } catch (err) {
      console.error('Failed to switch version:', err);
    }
  }

  async function handleUninstallSDK(sdkName: string, version?: string) {
    if (!confirm(`Are you sure you want to uninstall ${sdkName}${version ? ` version ${version}` : ''}?`)) {
      return;
    }
    
    try {
      await sdkStore.uninstallSDK(sdkName, version);
    } catch (err) {
      console.error('Failed to uninstall SDK:', err);
    }
  }

  function openInstallDialog(sdkName: string) {
    selectedSDK = sdkName;
    showInstallDialog = true;
  }

  // Debug function to check environment
  function checkEnvironment() {
    console.log('DEBUG: checkEnvironment function called!');
    
    const isTauri = typeof window !== 'undefined' && 
      ("__TAURI__" in window || !!(window as any).__TAURI_INTERNALS);
    
    const environment = isTauri ? "Desktop App" : "Browser";
    const message = isTauri 
      ? "🚀 Running in Tauri Desktop App" 
      : "🌐 Running in Browser";
    
    console.log('=== ENVIRONMENT DEBUG INFO ===');
    console.log('Environment:', environment);
    console.log('Message:', message);
    console.log('window.__TAURI__:', (window as any).__TAURI__);
    console.log('window.__TAURI_INTERNALS:', (window as any).__TAURI_INTERNALS);
    console.log('window.location.href:', window.location?.href);
    console.log('window.location.protocol:', window.location?.protocol);
    console.log('window.location.hostname:', window.location?.hostname);
    console.log('window.location.port:', window.location?.port);
    console.log('================================');
    
    alert(`${message}\n\nCheck console for detailed logs.`);
  }
</script>

<div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
  <!-- Header -->
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">SDK Manager</h1>
        <p class="text-gray-600 dark:text-gray-400">Manage your development tools and SDKs</p>
      </div>
      <div class="flex gap-2">
        <Button 
          variant="outline" 
          onclick={() => sdkStore.refreshAll()}
          disabled={$isLoading}
        >
          <Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button 
          variant="outline" 
          onclick={() => sdkStore.clearOperations()}
        >
          <Icon icon="mdi:delete" class="w-4 h-4 mr-2" />
          Clear History
        </Button>
        <Button 
          variant="outline" 
          onclick={() => console.log('DEBUG: Button clicked!')}
          class="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40"
        >
          <Icon icon="mdi:test-tube" class="w-4 h-4 mr-2" />
          Test Click
        </Button>
        <Button 
          variant="outline" 
          onclick={checkEnvironment}
          class="bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40"
        >
          <Icon icon="mdi:bug" class="w-4 h-4 mr-2" />
          App/Browser Check
        </Button>
      </div>
    </div>
  </div>

  <!-- Error Display -->
  {#if $error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 mx-4 mt-4 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <Icon icon="mdi:alert-circle" class="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
          <span class="text-red-800 dark:text-red-200">{$error}</span>
        </div>
        <Button variant="ghost" size="sm" onclick={() => sdkStore.clearError()}>
          <Icon icon="mdi:close" class="w-4 h-4" />
        </Button>
      </div>
    </div>
  {/if}

  <!-- Loading Indicator -->
  {#if $isLoading}
    <div class="flex items-center justify-center p-8">
      <Icon icon="mdi:loading" class="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
      <span class="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
    </div>
  {/if}

  <!-- Navigation Tabs -->
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <nav class="flex space-x-8 px-4">
      {#each ['overview', 'managers', 'sdks', 'operations'] as tab}
        <button
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === tab 
            ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}"
          onclick={() => activeTab = tab}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      {/each}
    </nav>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-auto p-4">
    {#if activeTab === 'overview'}
      <!-- Overview Tab -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Available Managers -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available SDK Managers ({$availableManagers.length})
          </h3>
          <div class="space-y-3">
            {#each $availableManagers as manager}
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex items-center">
                  <Icon icon={getManagerIcon(manager.name)} class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">{manager.name}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {manager.version} • {manager.supportedSDKs.length} SDKs
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onclick={() => sdkStore.openManagerDocs(manager.name)}
                >
                  <Icon icon="mdi:open-in-new" class="w-4 h-4" />
                </Button>
              </div>
            {/each}
          </div>
        </div>

        <!-- Installed SDKs -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Installed SDKs ({$installedSDKs.filter(s => s.isInstalled).length})
          </h3>
          <div class="space-y-3">
            {#each $installedSDKs.filter(s => s.isInstalled) as sdk}
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex items-center">
                  <Icon icon={getSDKIcon(sdk.sdk)} class="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">{sdk.sdk}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {sdk.version} • {sdk.manager || 'System'}
                    </div>
                  </div>
                </div>
                <div class="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onclick={() => openInstallDialog(sdk.sdk)}
                  >
                    <Icon icon="mdi:plus" class="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onclick={() => handleUninstallSDK(sdk.sdk)}
                  >
                    <Icon icon="mdi:delete" class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

    {:else if activeTab === 'managers'}
      <!-- Managers Tab -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">SDK Managers</h3>
        </div>
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each $sdkManagers as manager}
            <div class="p-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <Icon icon={getManagerIcon(manager.name)} class="w-8 h-8 text-blue-600 dark:text-blue-400 mr-4" />
                  <div>
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white">{manager.name}</h4>
                    <p class="text-gray-500 dark:text-gray-400">
                      {manager.isAvailable ? 'Available' : 'Not Available'} 
                      {#if manager.version}• {manager.version}{/if}
                    </p>
                    <p class="text-sm text-gray-400 dark:text-gray-500">
                      Supports: {manager.supportedSDKs.join(', ')}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  {#if manager.isAvailable}
                    <Button 
                      variant="outline"
                      onclick={() => sdkStore.openManagerDocs(manager.name)}
                    >
                      <Icon icon="mdi:book-open" class="w-4 h-4 mr-2" />
                      Docs
                    </Button>
                  {/if}
                  <div class="w-3 h-3 rounded-full {manager.isAvailable ? 'bg-green-500' : 'bg-gray-400'}"></div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

    {:else if activeTab === 'sdks'}
      <!-- SDKs Tab -->
      <div class="space-y-6">
        {#each Object.entries($installedSDKsByType) as [type, sdks]}
          {#if sdks.length > 0}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {type} SDKs ({sdks.length})
                </h3>
              </div>
              <div class="divide-y divide-gray-200 dark:divide-gray-700">
                {#each sdks as sdk}
                  <div class="p-6">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <Icon icon={getSDKIcon(sdk.sdk)} class="w-8 h-8 text-green-600 dark:text-green-400 mr-4" />
                        <div>
                          <h4 class="text-lg font-medium text-gray-900 dark:text-white">{sdk.sdk}</h4>
                          <p class="text-gray-500 dark:text-gray-400">
                            Version: {sdk.version || 'Unknown'} • Manager: {sdk.manager || 'System'}
                          </p>
                          {#if sdk.path}
                            <p class="text-sm text-gray-400 dark:text-gray-500">Path: {sdk.path}</p>
                          {/if}
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <Button 
                          variant="outline"
                          onclick={() => openInstallDialog(sdk.sdk)}
                        >
                          <Icon icon="mdi:plus" class="w-4 h-4 mr-2" />
                          Install Version
                        </Button>
                        <Button 
                          variant="outline"
                          onclick={() => handleUninstallSDK(sdk.sdk)}
                        >
                          <Icon icon="mdi:delete" class="w-4 h-4 mr-2" />
                          Uninstall
                        </Button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>

    {:else if activeTab === 'operations'}
      <!-- Operations Tab -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Operations</h3>
        </div>
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each $recentOperations as operation}
            <div class="p-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <Icon 
                    icon={getStatusIcon(operation.status)} 
                    class="w-6 h-6 mr-3 {getStatusColor(operation.status)}" 
                  />
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-white">
                      {operation.operation} {operation.sdk} {operation.version ? `(${operation.version})` : ''}
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Manager: {operation.manager} • {new Date(operation.timestamp).toLocaleString()}
                    </p>
                    {#if operation.error}
                      <p class="text-sm text-red-600 dark:text-red-400 mt-1">{operation.error}</p>
                    {/if}
                    {#if operation.output}
                      <details class="mt-2">
                        <summary class="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">Show Output</summary>
                        <pre class="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto">{operation.output}</pre>
                      </details>
                    {/if}
                  </div>
                </div>
                <span class="text-sm font-medium {getStatusColor(operation.status)}">
                  {operation.status}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Install Dialog -->
  {#if showInstallDialog}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Install {selectedSDK}
        </h3>
        <div class="space-y-4">
          <div>
            <label for="version" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Version (leave empty for latest)
            </label>
            <input
              id="version"
              type="text"
              bind:value={installVersion}
              placeholder="e.g., 18.17.0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div class="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onclick={() => {
                showInstallDialog = false;
                installVersion = '';
                selectedSDK = null;
              }}
            >
              Cancel
            </Button>
            <Button 
              onclick={handleInstallSDK}
              disabled={$isLoading}
            >
              {#if $isLoading}
                <Icon icon="mdi:loading" class="w-4 h-4 animate-spin mr-2" />
              {/if}
              Install
            </Button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
