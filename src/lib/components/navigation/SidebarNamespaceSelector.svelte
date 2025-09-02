<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { K8sNamespace } from '$lib/types/k8s';
  import { namespaceState } from '$lib/stores/app-store';

  const { namespaces = [], disabled = false, className = "" } = $props<{namespaces?: K8sNamespace[] ; disabled?: boolean ; className?: any }>();

  const dispatch = createEventDispatcher();

  // Get starred and ordered namespaces from store
  const starredNamespaces = $derived($namespaceState.starred);
  const namespaceOrder = $derived($namespaceState.order);
  const currentSelectedNamespace = $derived($namespaceState.selected);

  // State for custom dropdown
  let isOpen = $state(false);
  let searchQuery = $state("");
  let dropdownRef: HTMLDivElement;

  // Filter and sort namespaces
  let filteredNamespaces: K8sNamespace[] = $state(namespaces);
  
  $effect(() => {
    const allNamespaces = namespaces;
    
    // If no starred namespaces and no custom order, show all
    if (starredNamespaces.length === 0 && namespaceOrder.length === 0) {
      filteredNamespaces = allNamespaces;
      return;
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
    filteredNamespaces = [...sortedOrdered, ...starred, ...others];
  });

  // Filter namespaces based on search query
  let displayNamespaces: K8sNamespace[] = $state(filteredNamespaces);
  
  $effect(() => {
    if (!searchQuery) {
      displayNamespaces = filteredNamespaces;
    } else {
      displayNamespaces = filteredNamespaces.filter((ns: K8sNamespace) => 
        ns.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  });

  function handleNamespaceChange(namespace: string) {
    dispatch('namespaceChange', { namespace });
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
          if (searchInput) searchInput.focus();
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

  function getSelectedNamespaceDisplay() {
    if (!currentSelectedNamespace) return "All Namespaces";
    return currentSelectedNamespace;
  }
</script>

<div class="px-4 py-2 {className}">
  <div class="relative" bind:this={dropdownRef}>
    <button
      onclick={toggleDropdown}
      disabled={disabled}
      class="w-full flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span class="text-slate-900 dark:text-white">
        {getSelectedNamespaceDisplay()}
      </span>
      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    {#if isOpen}
      <div class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
        <!-- Search Input -->
        <div class="p-2 border-b border-slate-200 dark:border-slate-700">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search namespaces..."
            class="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Namespace List -->
        <div class="py-1">
          {#if displayNamespaces.length === 0}
            <div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              No namespaces found
            </div>
          {:else}
            {#each displayNamespaces as namespace: K8sNamespace (namespace.name)}
              <button
                onclick={() => handleNamespaceChange(namespace.name)}
                class="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 {currentSelectedNamespace === namespace.name ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-900 dark:text-white'}"
              >
                <div class="flex items-center justify-between">
                  <span>{namespace.name}</span>
                  {#if starredNamespaces.includes(namespace.name)}
                    <span class="text-yellow-500">⭐</span>
                  {/if}
                </div>
              </button>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<svelte:window onclick={handleClickOutside} />
