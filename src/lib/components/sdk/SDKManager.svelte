<script lang="ts">
  import { onMount } from 'svelte';
  import { logger } from '$lib/utils/logger';
  import { sdkStore, sdkManagers, installedSDKs, availableManagers, installedSDKsByType, recentOperations, isLoading, error } from '$lib/stores/sdk-store';
  import { Alert } from '$lib/components/ui/feedback/index.js';
  import { LoadingState } from '$lib/components/ui/display/index.js';
  import SDKHeader from './SDKHeader.svelte';
  import SDKOverview from './SDKOverview.svelte';
  import SDKManagersList from './SDKManagersList.svelte';
  import SDKSList from './SDKSList.svelte';
  import SDKOperationsList from './SDKOperationsList.svelte';
  import SDKInstallModal from './SDKInstallModal.svelte';

  let activeTab = $state('overview');
  let selectedSDK = $state<string | null>(null);
  let showInstallDialog = $state(false);
  let hasInitialized = $state(false);

  onMount(() => {
    // Don't automatically refresh - let user manually refresh when needed
    hasInitialized = true;
  });

  async function handleInstallSDK(event: CustomEvent) {
    const { sdk, version } = event.detail;
    
    try {
      await sdkStore.installSDK(sdk, version || undefined);
      showInstallDialog = false;
      selectedSDK = null;
    } catch (err) {
      logger.error('Failed to install SDK:', err);
    }
  }

  async function handleSwitchVersion(sdkName: string, version: string) {
    try {
      await sdkStore.switchSDKVersion(sdkName, version);
    } catch (err) {
      logger.error('Failed to switch version:', err);
    }
  }

  async function handleUninstallSDK(event: CustomEvent) {
    const { sdkName } = event.detail;
    
    if (!confirm(`Are you sure you want to uninstall ${sdkName}?`)) {
      return;
    }
    
    try {
      await sdkStore.uninstallSDK(sdkName);
    } catch (err) {
      logger.error('Failed to uninstall SDK:', err);
    }
  }

  function openInstallDialog(event: CustomEvent) {
    const { sdkName } = event.detail;
    selectedSDK = sdkName;
    showInstallDialog = true;
  }

  function handleRefresh() {
    sdkStore.refreshAll();
  }

  function handleClearHistory() {
    sdkStore.clearOperations();
  }

  function handleTestClick() {
    logger.info('DEBUG: Button clicked!');
  }

  function handleEnvironmentCheck() {
    logger.info('DEBUG: checkEnvironment function called!');
    
    const isTauri = typeof window !== 'undefined' && 
      ("__TAURI__" in window || !!(window as any).__TAURI_INTERNALS);
    
    const environment = isTauri ? "Desktop App" : "Browser";
    const message = isTauri 
      ? "🚀 Running in Tauri Desktop App" 
      : "🌐 Running in Browser";
    
    logger.info({ message: '=== ENVIRONMENT DEBUG INFO ===' });
    logger.info({ message: 'Environment:', data: environment });
    logger.info({ message: 'Message:', data: message });
    logger.info({ message: 'window.__TAURI__:', data: (window as any).__TAURI__ });
    logger.info({ message: 'window.__TAURI_INTERNALS:', data: (window as any).__TAURI_INTERNALS });
    logger.info({ message: 'window.location.href:', data: window.location?.href });
    logger.info({ message: 'window.location.protocol:', data: window.location?.protocol });
    logger.info({ message: 'window.location.hostname:', data: window.location?.hostname });
    logger.info({ message: 'window.location.port:', data: window.location?.port });
    logger.info({ message: '================================' });
    
    alert(`${message}\n\nCheck console for detailed logs.`);
  }

  function handleOpenManagerDocs(event: CustomEvent) {
    const { managerName } = event.detail;
    sdkStore.openManagerDocs(managerName);
  }

  function handleModalClose() {
    showInstallDialog = false;
    selectedSDK = null;
  }
</script>

<div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
  <!-- Header -->
  <SDKHeader
    isLoading={$isLoading}
    on:refresh={handleRefresh}
    on:clearHistory={handleClearHistory}
    on:testClick={handleTestClick}
    on:environmentCheck={handleEnvironmentCheck}
  />

  <!-- Error Display -->
  {#if $error}
    <Alert
      variant="destructive"
      className="mx-4 mt-4"
    >
      {$error}
    </Alert>
  {/if}

  <!-- Loading Indicator -->
  {#if $isLoading}
    <LoadingState message="Loading..." />
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
      <SDKOverview
        availableManagers={$availableManagers}
        installedSDKs={$installedSDKs}
        on:openManagerDocs={handleOpenManagerDocs}
        on:installSDK={openInstallDialog}
        on:uninstallSDK={handleUninstallSDK}
      />
    {:else if activeTab === 'managers'}
      <SDKManagersList
        sdkManagers={$sdkManagers}
        on:openManagerDocs={handleOpenManagerDocs}
      />
    {:else if activeTab === 'sdks'}
      <SDKSList
        installedSDKsByType={$installedSDKsByType}
        on:installSDK={openInstallDialog}
        on:uninstallSDK={handleUninstallSDK}
      />
    {:else if activeTab === 'operations'}
      <SDKOperationsList
        recentOperations={$recentOperations}
      />
    {/if}
  </div>
</div>

<!-- Install Modal -->
<SDKInstallModal
  isOpen={showInstallDialog}
  selectedSDK={selectedSDK || ""}
  loading={$isLoading}
  on:close={handleModalClose}
  on:install={handleInstallSDK}
/>
