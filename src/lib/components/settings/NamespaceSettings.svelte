<script lang="ts">
  import { onMount } from 'svelte';
  import { logger } from '$lib/utils/logger';
  import { k8sAPI, type K8sNamespace } from '$lib/api/k8s';
  import { appStore, namespaceState } from '$lib/stores/app-store';
  import { toastStore } from '$lib/stores/toast-store';
  import { SettingsSection } from '$lib/components/ui/settings/index.js';
  import { SearchInput } from '$lib/components/ui/search/index.js';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { LoadingState, EmptyState } from '$lib/components/ui/display/index.js';

  // Namespace data
  let allNamespaces = $state<K8sNamespace[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state("");

  // Computed filtered namespaces
  let filteredNamespaces = $derived(allNamespaces.filter(ns =>
    ns.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const aStarred = $namespaceState.starred.includes(a.name);
    const bStarred = $namespaceState.starred.includes(b.name);

    // Starred namespaces first
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;

    // Then by custom order for starred namespaces
    if (aStarred && bStarred) {
      const aOrderIndex = $namespaceState.order.indexOf(a.name);
      const bOrderIndex = $namespaceState.order.indexOf(b.name);
      if (aOrderIndex !== -1 && bOrderIndex !== -1) {
        return aOrderIndex - bOrderIndex;
      }
    }

    // Finally by name
    return a.name.localeCompare(b.name);
  }));

  onMount(async () => {
    await loadNamespacesData();
  });

  async function loadNamespacesData() {
    try {
      isLoading = true;
      // Check if connected and load namespaces
      allNamespaces = await k8sAPI.getNamespaces();
    } catch (error) {
      logger.error('Failed to load namespaces:', error);
      allNamespaces = []; // Set to empty array on error, no mock data
    } finally {
      isLoading = false;
    }
  }

  function toggleStar(namespaceName: string) {
    appStore.toggleStarredNamespace(namespaceName);
  }

  function moveNamespaceUp(index: number) {
    if (index > 0) {
      const newOrder = filteredNamespaces.map(ns => ns.name);
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      appStore.setNamespaceOrder(newOrder);
    }
  }

  function moveNamespaceDown(index: number) {
    if (index < filteredNamespaces.length - 1) {
      const newOrder = filteredNamespaces.map(ns => ns.name);
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      appStore.setNamespaceOrder(newOrder);
    }
  }

  function clearAllSettings() {
    if (confirm('Are you sure you want to clear all namespace settings? This will remove all starred namespaces and custom ordering.')) {
      // Clear namespace order
      appStore.setNamespaceOrder([]);
      toastStore.success('Namespace settings cleared');
    }
  }

  function handleSearch(query: string) {
    searchQuery = query;
  }

  function handleRefresh() {
    loadNamespacesData();
  }
</script>

<SettingsSection 
  title="Namespace Settings"
  description="Manage your favorite namespaces and their display order"
  icon="📁"
>
  <!-- Search and Actions -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex-1 max-w-md">
      <SearchInput 
        placeholder="Search namespaces..."
        value={searchQuery}
        onSearch={handleSearch}
      />
    </div>
    <div class="flex items-center space-x-2">
      <ActionButton 
        action="refresh"
        onclick={() => handleRefresh()}
        loading={isLoading}
      />
      <ActionButton 
        action="delete"
        label="Clear All"
        onclick={() => clearAllSettings()}
      />
    </div>
  </div>

  <!-- Namespace List -->
  {#if isLoading}
    <LoadingState message="Loading namespaces..." />
  {:else if filteredNamespaces.length === 0}
    <EmptyState 
      title="No namespaces found"
      description={searchQuery ? "Try adjusting your search criteria." : "No namespaces available in the cluster."}
      icon="📁"
    />
  {:else}
    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
        <span>Namespaces ({filteredNamespaces.length})</span>
        <span class="text-xs">Star namespaces to prioritize them, use arrows to reorder starred namespaces</span>
      </div>

      {#each filteredNamespaces as namespace, index}
        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <div class="flex items-center space-x-3">
            <button
              type="button"
              onclick={() => toggleStar(namespace.name)}
              class="text-slate-400 hover:text-yellow-500 {$namespaceState.starred.includes(namespace.name) ? 'text-yellow-500' : ''}"
              title="Toggle star"
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
                type="button"
                onclick={() => moveNamespaceUp(index)}
                disabled={index === 0}
                class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onclick={() => moveNamespaceDown(index)}
                disabled={index === filteredNamespaces.length - 1}
                class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move down"
              >
                ↓
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</SettingsSection>
