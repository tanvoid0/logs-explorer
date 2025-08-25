<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import type { K8sNamespace } from '$lib/types/k8s';
  import { appStore, namespaceState } from '$lib/stores/app-store';

  export let namespaces: K8sNamespace[];
  export let selectedNamespace: string;
  export let disabled: boolean;
  export let variant: 'default' | 'sidebar' = 'default';

  const dispatch = createEventDispatcher();

  // Get starred and ordered namespaces
  const starredNamespaces = $namespaceState.starred;
  const namespaceOrder = $namespaceState.order;

  // State for custom dropdown
  let isOpen = false;
  let searchQuery = "";
  let dropdownRef: HTMLDivElement;

  // Filter and sort namespaces
  $: filteredNamespaces = (() => {
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
  })();

  // Filter namespaces based on search query
  $: displayNamespaces = (() => {
    if (!searchQuery) return filteredNamespaces;
    return filteredNamespaces.filter(ns => 
      ns.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  })();

  function handleNamespaceChange(namespace: string) {
            appStore.setSelectedNamespace(namespace);
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
    if (!selectedNamespace) return "All Namespaces";
    const ns = filteredNamespaces.find(n => n.name === selectedNamespace);
    if (!ns) return selectedNamespace;
    return `${starredNamespaces.includes(ns.name) ? '⭐' : '⚙️'} ${ns.name}`;
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  // Dynamic classes based on variant
  const containerClasses = variant === 'sidebar' 
    ? 'flex flex-col space-y-1' 
    : 'flex items-center space-x-2';
  
  const labelClasses = variant === 'sidebar'
    ? 'text-xs font-medium text-slate-300'
    : 'text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap';
  
  const selectClasses = variant === 'sidebar'
    ? 'w-full px-2 py-1 text-sm border border-slate-600 rounded-md bg-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
    : 'px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-0 cursor-pointer';

  const dropdownClasses = variant === 'sidebar'
    ? 'absolute z-[9999] w-full bottom-full mb-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto'
    : 'absolute z-[9999] w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto';

  const optionClasses = variant === 'sidebar'
    ? 'px-3 py-2 text-sm text-slate-200 hover:bg-slate-600 cursor-pointer'
    : 'px-3 py-2 text-sm text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer';

  const searchClasses = variant === 'sidebar'
    ? 'w-full px-3 py-2 text-sm bg-slate-600 border-b border-slate-500 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
    : 'w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500';
</script>

<div class={containerClasses}>
  <label class={labelClasses}>
    {variant === 'sidebar' ? 'Select Namespace:' : 'Namespace:'}
  </label>
  
  <div class="relative" bind:this={dropdownRef}>
    <!-- Custom Dropdown Button -->
    <button
      type="button"
      onclick={toggleDropdown}
      disabled={disabled}
      class={selectClasses}
    >
      <div class="flex items-center justify-between">
        <span class="truncate">{getSelectedNamespaceDisplay()}</span>
        <svg 
          class="w-4 h-4 transition-transform {isOpen ? 'rotate-180' : ''}" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>

    <!-- Dropdown Menu -->
    {#if isOpen}
      <div class={dropdownClasses}>
        <!-- Search Input -->
        <div class="sticky top-0 bg-inherit border-b border-inherit">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search namespaces..."
            class={searchClasses}
            onkeydown={(e) => {
              if (e.key === 'Escape') {
                isOpen = false;
                searchQuery = "";
              }
            }}
          />
        </div>

        <!-- Options -->
        <div class="py-1">
          <!-- All Namespaces Option -->
          <div 
            class={optionClasses}
            onclick={() => handleNamespaceChange("")}
          >
            <span class="flex items-center">
              <span class="mr-2">🌐</span>
              All Namespaces
            </span>
          </div>

          <!-- Namespace Options -->
          {#each displayNamespaces as namespace}
            <div 
              class={optionClasses}
              onclick={() => handleNamespaceChange(namespace.name)}
            >
              <span class="flex items-center">
                <span class="mr-2">{starredNamespaces.includes(namespace.name) ? '⭐' : '⚙️'}</span>
                <span class="flex-1">{namespace.name}</span>
                <span class="text-xs opacity-70">({namespace.status})</span>
              </span>
            </div>
          {/each}

          {#if displayNamespaces.length === 0 && searchQuery}
            <div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              No namespaces found matching "{searchQuery}"
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
