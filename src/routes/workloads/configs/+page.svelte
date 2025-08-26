<script lang="ts">
  import { onMount } from "svelte";
  import { k8sAPI, type K8sNamespace, type K8sConfigMap, type K8sSecret } from "$lib/api/k8s";
  import { appStore, connectionState, namespaceState } from '$lib/stores/app-store';
  import Toast from "$lib/components/Toast.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import ConfigTreeEditor from "$lib/components/ConfigTreeEditor.svelte";
  import ConfigDataViewer from "$lib/components/ConfigDataViewer.svelte";
  import WorkloadTabs from "$lib/components/WorkloadTabs.svelte";

  // State
  let namespaces = $state<K8sNamespace[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state("");
  let typeFilter = $state("");

  // Config data
  let configMaps = $state<K8sConfigMap[]>([]);
  let secrets = $state<K8sSecret[]>([]);
  let selectedConfig = $state<K8sConfigMap | K8sSecret | null>(null);
  let isEditing = $state(false);
  let editingData = $state<Record<string, string>>({});

  // Toast notifications
  let toastMessage = $state("");
  let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');
  let showToast = $state(false);

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      isLoading = true;
      
      // Check connection status from store
      if (!$connectionState.isConnected) {
        console.log("Attempting to connect to Kubernetes...");
        const success = await appStore.connect();
        if (success) {
          console.log("Successfully connected to Kubernetes!");
        } else {
          console.log("Failed to connect to Kubernetes");
          return;
        }
      }
      
      // Load namespaces
      namespaces = await k8sAPI.getNamespaces();
      
      // Load configs for current namespace
      if ($namespaceState.selected) {
        console.log(`[Configs] Loading configs for namespace: ${$namespaceState.selected}`);
        try {
          const [loadedConfigMaps, loadedSecrets] = await Promise.all([
            k8sAPI.getConfigMaps($namespaceState.selected),
            k8sAPI.getSecrets($namespaceState.selected)
          ]);
          console.log(`[Configs] Loaded ${loadedConfigMaps.length} ConfigMaps and ${loadedSecrets.length} Secrets`);
          configMaps = loadedConfigMaps;
          secrets = loadedSecrets;
        } catch (error) {
          console.error('[Configs] Failed to load configs:', error);
          configMaps = [];
          secrets = [];
        }
      } else {
        console.log('[Configs] No namespace selected, setting configs to empty arrays');
        configMaps = [];
        secrets = [];
      }
      
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      isLoading = false;
    }
  }

  // Load configs when namespace changes
  $effect(() => {
    if ($connectionState.isConnected && $namespaceState.selected) {
      loadData();
    } else {
      configMaps = [];
      secrets = [];
    }
  });

  function selectConfig(config: K8sConfigMap | K8sSecret) {
    selectedConfig = config;
    editingData = { ...config.data };
    isEditing = false;
  }

  function startEditing() {
    if (selectedConfig) {
      editingData = { ...selectedConfig.data };
      isEditing = true;
    }
  }

  function cancelEditing() {
    if (selectedConfig) {
      editingData = { ...selectedConfig.data };
      isEditing = false;
    }
  }

  function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    toastMessage = message;
    toastType = type;
    showToast = true;
  }

  function getDataKeysCount(data: Record<string, string>): number {
    return Object.keys(data).length;
  }

  function formatAge(age: string): string {
    return age;
  }

  // Type for configs with type field
  type ConfigWithType = (K8sConfigMap | K8sSecret) & { type: 'ConfigMap' | 'Secret' };

  // Computed values for filtering
  let allConfigs = $derived(() => {
    const configMapsWithType: ConfigWithType[] = configMaps.map(cm => ({ ...cm, type: 'ConfigMap' as const }));
    const secretsWithType: ConfigWithType[] = secrets.map(secret => ({ ...secret, type: 'Secret' as const }));
    return [...configMapsWithType, ...secretsWithType];
  });

  let filteredConfigs = $derived(() => {
    return allConfigs().filter((config: ConfigWithType) => {
      const matchesSearch = !searchQuery || 
        config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.namespace.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = !typeFilter || config.type === typeFilter;
      
      const matchesNamespace = !$namespaceState.selected || config.namespace === $namespaceState.selected;
      
      return matchesSearch && matchesType && matchesNamespace;
    });
  });
</script>

<svelte:head>
  <title>Configurations & Secrets - Kubernetes Logs Explorer</title>
</svelte:head>

<div class="configs-page">
  <WorkloadTabs />
  <!-- Header -->
  <div class="header">
    <div class="header-content">
      <div class="title-section">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Configurations & Secrets</h1>
        <p class="text-gray-600 dark:text-gray-400">Manage ConfigMaps and Secrets across your Kubernetes clusters</p>
      </div>
      
      <div class="connection-status">
        {#if $connectionState.isConnected}
          <div class="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <span class="text-sm font-medium">Connected to {$connectionState.currentContext || 'default'}</span>
          </div>
        {:else}
          <div class="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <div class="w-2 h-2 bg-red-500 rounded-full"></div>
            <span class="text-sm font-medium">Disconnected</span>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters">
    <div class="filter-group">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search configs..."
        class="search-input"
      />
    </div>
    
    <div class="filter-group">
      <select bind:value={typeFilter} class="type-filter">
        <option value="">All Types</option>
        <option value="ConfigMap">ConfigMaps</option>
        <option value="Secret">Secrets</option>
      </select>
    </div>
  </div>

  <!-- Content -->
  <div class="content">
    {#if isLoading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading configurations...</p>
      </div>
    {:else if filteredConfigs().length === 0}
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <h3>No configurations found</h3>
        <p>
          {searchQuery || typeFilter 
            ? 'Try adjusting your search or filters.' 
            : 'No ConfigMaps or Secrets found in the current namespace.'}
        </p>
      </div>
    {:else}
      <div class="configs-grid">
        {#each filteredConfigs() as config (config.name)}
          <div class="config-card" class:selected={selectedConfig?.name === config.name}>
            <div class="config-header">
              <div class="config-type-badge" class:configmap={config.type === 'ConfigMap'} class:secret={config.type === 'Secret'}>
                {config.type}
              </div>
              <h3 class="config-name">{config.name}</h3>
            </div>
            
            <div class="config-details">
              <p class="config-namespace">Namespace: {config.namespace}</p>
              <p class="config-keys">Keys: {getDataKeysCount(config.data)}</p>
              <p class="config-age">Age: {formatAge(config.age)}</p>
            </div>
            
            <div class="config-actions">
              <Button onclick={() => selectConfig(config)} class="view-btn">
                View
              </Button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Config Details Modal -->
  {#if selectedConfig}
    <div class="modal-overlay" onclick={() => selectedConfig = null}>
      <div class="modal-content" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2 class="modal-title">
            {configMaps.includes(selectedConfig as K8sConfigMap) ? 'ConfigMap' : 'Secret'}: {selectedConfig.name}
          </h2>
          <div class="flex items-center space-x-2">
            <button class="edit-btn" onclick={() => startEditing()}>Edit</button>
            <button class="close-btn" onclick={() => selectedConfig = null}>×</button>
          </div>
        </div>
        
        <div class="modal-body">
          {#if isEditing}
            <ConfigTreeEditor 
              data={editingData} 
              on:save={(event) => {
                // TODO: Implement save functionality
                showNotification('Changes saved successfully!', 'success');
                isEditing = false;
              }}
              on:cancel={() => cancelEditing()}
            />
          {:else}
            <ConfigDataViewer 
              data={selectedConfig.data}
            />
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Toast Notifications -->
<Toast 
  message={toastMessage}
  type={toastType}
  show={showToast}
  on:close={() => showToast = false}
/>

<style>
  .configs-page {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .header {
    background-color: white;
    border-bottom: 1px solid rgb(229 231 235);
    padding: 1.5rem;
  }

  .dark .header {
    background-color: rgb(31 41 55);
    border-bottom-color: rgb(55 65 81);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-section h1 {
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 700;
    color: rgb(17 24 39);
    margin-bottom: 0.25rem;
  }

  .dark .title-section h1 {
    color: white;
  }

  .title-section p {
    color: rgb(75 85 99);
  }

  .dark .title-section p {
    color: rgb(156 163 175);
  }

  .connection-status {
    display: flex;
    align-items: center;
  }

  .filters {
    background-color: white;
    border-bottom: 1px solid rgb(229 231 235);
    padding: 1rem;
    display: flex;
    gap: 1rem;
  }

  .dark .filters {
    background-color: rgb(31 41 55);
    border-bottom-color: rgb(55 65 81);
  }

  .filter-group {
    flex: 1;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgb(209 213 219);
    border-radius: 0.375rem;
    background-color: white;
    color: rgb(17 24 39);
  }

  .search-input::placeholder {
    color: rgb(107 114 128);
  }

  .search-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgb(59 130 246);
    border-color: transparent;
  }

  .dark .search-input {
    border-color: rgb(75 85 99);
    background-color: rgb(55 65 81);
    color: white;
  }

  .dark .search-input::placeholder {
    color: rgb(156 163 175);
  }

  .type-filter {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgb(209 213 219);
    border-radius: 0.375rem;
    background-color: white;
    color: rgb(17 24 39);
  }

  .type-filter:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgb(59 130 246);
    border-color: transparent;
  }

  .dark .type-filter {
    border-color: rgb(75 85 99);
    background-color: rgb(55 65 81);
    color: white;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 16rem;
    color: rgb(75 85 99);
  }

  .dark .loading {
    color: rgb(156 163 175);
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 4px solid rgb(191 219 254);
    border-top-color: rgb(37 99 235);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 16rem;
    text-align: center;
  }

  .empty-icon {
    font-size: 3.75rem;
    line-height: 1;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 600;
    color: rgb(17 24 39);
    margin-bottom: 0.5rem;
  }

  .dark .empty-state h3 {
    color: white;
  }

  .empty-state p {
    color: rgb(75 85 99);
  }

  .dark .empty-state p {
    color: rgb(156 163 175);
  }

  .configs-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .configs-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1024px) {
    .configs-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .config-card {
    background-color: white;
    border: 1px solid rgb(229 231 235);
    border-radius: 0.5rem;
    padding: 1.5rem;
    transition: box-shadow 0.2s;
    cursor: pointer;
  }

  .config-card:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }

  .dark .config-card {
    background-color: rgb(31 41 55);
    border-color: rgb(55 65 81);
  }

  .config-card.selected {
    box-shadow: 0 0 0 2px rgb(59 130 246);
  }

  .config-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .config-type-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 600;
    border-radius: 9999px;
  }

  .config-type-badge.configmap {
    background-color: rgb(219 234 254);
    color: rgb(30 64 175);
  }

  .dark .config-type-badge.configmap {
    background-color: rgb(30 58 138);
    color: rgb(191 219 254);
  }

  .config-type-badge.secret {
    background-color: rgb(254 226 226);
    color: rgb(153 27 27);
  }

  .dark .config-type-badge.secret {
    background-color: rgb(127 29 29);
    color: rgb(254 202 202);
  }

  .config-name {
    font-size: 1.125rem;
    line-height: 1.75rem;
    font-weight: 600;
    color: rgb(17 24 39);
  }

  .dark .config-name {
    color: white;
  }

  .config-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .config-details p {
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgb(75 85 99);
  }

  .dark .config-details p {
    color: rgb(156 163 175);
  }

  .config-actions {
    display: flex;
    justify-content: flex-end;
  }

  .view-btn {
    padding: 0.5rem 1rem;
    background-color: rgb(37 99 235);
    color: white;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
  }

  .view-btn:hover {
    background-color: rgb(29 78 216);
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgb(0 0 0 / 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }

  .modal-content {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    max-width: 56rem;
    width: 100%;
    margin: 0 1rem;
    max-height: 90vh;
    overflow: hidden;
  }

  .dark .modal-content {
    background-color: rgb(31 41 55);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid rgb(229 231 235);
  }

  .dark .modal-header {
    border-bottom-color: rgb(55 65 81);
  }

  .modal-title {
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 600;
    color: rgb(17 24 39);
  }

  .dark .modal-title {
    color: white;
  }

  .close-btn {
    color: rgb(156 163 175);
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 700;
  }

  .close-btn:hover {
    color: rgb(75 85 99);
  }

  .dark .close-btn:hover {
    color: rgb(209 213 219);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    max-height: calc(90vh - 7.5rem);
  }
</style>

