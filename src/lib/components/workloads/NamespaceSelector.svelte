<script lang="ts">
  import { onMount } from 'svelte';
  import { logger } from '$lib/utils/logger';
  import type { K8sNamespace } from '$lib/types/k8s';
  import { appStore, namespaceState } from '$lib/stores/app-store';

  const {
    namespaces = [],
    selectedNamespace = 'default',
    disabled = false,
    variant = 'default',
    onNamespaceChange = undefined
  } = $props<{
    namespaces?: K8sNamespace[];
    selectedNamespace?: string;
    disabled?: boolean;
    variant?: 'default' | 'sidebar';
    onNamespaceChange?: ((data: { namespace: string }) => void) | undefined;
  }>();

  // Get starred and ordered namespaces from store
  const starredNamespaces = $derived($namespaceState.starred);
  const namespaceOrder = $derived($namespaceState.order);
  
  // Use the store's selected namespace as the source of truth
  const currentSelectedNamespace = $derived($namespaceState.selected);

  // State for custom dropdown
  let isOpen = $state(false);
  let searchQuery = $state("");
  let dropdownRef: HTMLDivElement;

  // Filter and sort namespaces
  const filteredNamespaces = $derived(() => {
    const allNamespaces = namespaces;
    
    // If no starred namespaces and no custom order, show all
    if (starredNamespaces.length === 0 && namespaceOrder.length === 0) {
      return allNamespaces;
    }

    // Create a map for quick lookup
    const namespaceMap = new Map(allNamespaces.map((ns: K8sNamespace) => [ns.name, ns]));
    
    // Start with ordered namespaces
    const ordered: K8sNamespace[] = [];
    const starred: K8sNamespace[] = [];
    const others: K8sNamespace[] = [];

    allNamespaces.forEach((ns: K8sNamespace) => {
      if (namespaceOrder.includes(ns.name)) {
        ordered.push(ns);
      } else if (starredNamespaces.includes(ns.name)) {
        starred.push(ns);
      } else {
        others.push(ns);
      }
    });

    // Sort ordered namespaces by their order
    const sortedOrdered = namespaceOrder
      .map(name => namespaceMap.get(name))
      .filter(Boolean) as K8sNamespace[];

    // Combine: ordered first, then starred, then others
    return [...sortedOrdered, ...starred, ...others];
  });

  // Filter namespaces based on search query
  let displayNamespaces: K8sNamespace[] = $state(filteredNamespaces());
  
  $effect(() => {
    if (!searchQuery) {
      displayNamespaces = filteredNamespaces();
    } else {
      displayNamespaces = filteredNamespaces().filter((ns: K8sNamespace) => 
        ns.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  });

  function handleNamespaceChange(namespace: string) {
    logger.info('NamespaceSelector: Changing namespace to:', { namespace });
    appStore.setSelectedNamespace(namespace);
    if (onNamespaceChange) onNamespaceChange({ namespace });
    isOpen = false;
    searchQuery = "";
  }

  function toggleDropdown() {
    if (!disabled) {
      isOpen = !isOpen;
      if (isOpen) {
        searchQuery = "";
        // Focus the search input after a brief delay
        setTimeout(() => {
          const searchInput = dropdownRef?.querySelector('input');
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      isOpen = false;
      searchQuery = "";
    }
  }

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen = false;
      searchQuery = "";
    }
  }

  // Close dropdown when clicking outside
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="relative" bind:this={dropdownRef}>
  <!-- Trigger Button -->
  <button
    type="button"
    onclick={toggleDropdown}
    disabled={disabled}
    class="flex items-center justify-between w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed {variant === 'sidebar' ? 'text-left' : ''}"
  >
    <span class="truncate">
      {currentSelectedNamespace || selectedNamespace || 'Select namespace'}
    </span>
    <svg class="w-4 h-4 ml-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  </button>

  <!-- Dropdown Menu -->
  {#if isOpen}
    <div class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-hidden">
      <!-- Search Input -->
      <div class="p-2 border-b border-slate-200 dark:border-slate-700">
        <input
          type="text"
          placeholder="Search namespaces..."
          value={searchQuery}
          oninput={handleSearchInput}
          class="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Namespace List -->
      <div class="max-h-48 overflow-y-auto">
        {#if displayNamespaces.length === 0}
          <div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
            No namespaces found
          </div>
        {:else}
          {#each displayNamespaces as namespace}
            <button
              type="button"
              onclick={() => handleNamespaceChange(namespace.name)}
              class="w-full px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none {currentSelectedNamespace === namespace.name ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}"
            >
              <div class="flex items-center justify-between">
                <span class="truncate">{namespace.name}</span>
                {#if starredNamespaces.includes(namespace.name)}
                  <span class="text-yellow-500 ml-2">⭐</span>
                {/if}
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
