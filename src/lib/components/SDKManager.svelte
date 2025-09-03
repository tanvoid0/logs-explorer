<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { sdkStore, sdkManagers, installedSDKs, availableManagers, installedSDKsByType, recentOperations, isLoading, error } from '$lib/stores/sdk-store';
  import type { SDKManager, SDKDetectionResult, SDKManagerOperation } from '$lib/types/sdk';
  import { Heading, Text, Container } from "$lib/components/ui";

  let activeTab = $state('overview');
  let selectedSDK = $state<string | null>(null);
  let selectedManager = $state<string | null>(null);
  let installVersion = $state('');
  let showInstallDialog = $state(false);
  let hasInitialized = false;

  onMount(() => {
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
  <Container variant="header" className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <div>
        <Heading level="h1" variant="emphasized" className="text-2xl">SDK Manager</Heading>
        <Text variant="muted" className="text-gray-600 dark:text-gray-400">Manage your development tools and SDKs</Text>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" onclick={() => sdkStore.refreshAll()} disabled={$isLoading}>
          <Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" onclick={() => sdkStore.clearOperations()}>
          <Icon icon="mdi:delete" class="w-4 h-4 mr-2" />
          Clear History
        </Button>
        <Button variant="outline" onclick={() => console.log('DEBUG: Button clicked!')} class="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40">
          <Icon icon="mdi:test-tube" class="w-4 h-4 mr-2" />
          Test Click
        </Button>
        <Button variant="outline" onclick={checkEnvironment} class="bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40">
          <Icon icon="mdi:bug" class="w-4 h-4 mr-2" />
          App/Browser Check
        </Button>
      </div>
    </div>
  </Container>

  <!-- Error Display -->
  {#if $error}
    <Container className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 mx-4 mt-4 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <Icon icon="mdi:alert-circle" class="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
          <Text className="text-red-800 dark:text-red-200">{$error}</Text>
        </div>
        <Button variant="ghost" size="sm" onclick={() => sdkStore.clearError()}>
          <Icon icon="mdi:close" class="w-4 h-4" />
        </Button>
      </div>
    </Container>
  {/if}

  <!-- Loading Indicator -->
  {#if $isLoading}
    <Container class="flex items-center justify-center p-8">
      <Icon icon="mdi:loading" class="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
      <Text class="ml-2 text-gray-600 dark:text-gray-400">Loading...</Text>
    </Container>
  {/if}

  <!-- Navigation Tabs -->
  <Container variant="header" class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <nav class="flex space-x-8 px-4">
      {#each ['overview', 'managers', 'sdks', 'operations'] as tab}
        <Button
          variant="ghost"
          size="sm"
          onclick={() => activeTab = tab}
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === tab 
            ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}"
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </Button>
      {/each}
    </nav>
  </Container>

  <!-- Content -->
  <div class="flex-1 overflow-auto p-4">
    {#if activeTab === 'overview'}
      <!-- Overview Tab -->
      ...
    {:else if activeTab === 'managers'}
      <!-- Managers Tab -->
      ...
    {:else if activeTab === 'sdks'}
      <!-- SDKs Tab -->
      ...
    {:else if activeTab === 'operations'}
      <!-- Operations Tab -->
      ...
    {/if}
  </div>

  <!-- Install Dialog -->
  {#if showInstallDialog}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Install {selectedSDK}</h3>
        <div class="space-y-4">
          <div>
            <label for="version" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Version (leave empty for latest)</label>
            <input id="version" type="text" bind:value={installVersion} placeholder="e.g., 18.17.0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div class="flex gap-2 justify-end">
            <Button variant="outline" onclick={() => { showInstallDialog = false; installVersion = ''; selectedSDK = null; }}>Cancel</Button>
            <Button onclick={handleInstallSDK} disabled={$isLoading}>
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
