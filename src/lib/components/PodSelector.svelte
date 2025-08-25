<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { K8sPod } from '$lib/types/k8s';

  const { pods, selectedPods, disabled } = $props<{
    pods: K8sPod[];
    selectedPods: string[];
    disabled: boolean;
  }>();

  const dispatch = createEventDispatcher();
  
  let searchQuery = $state("");
  let isDropdownOpen = $state(false);
  
  // Filter pods based on search query
  let filteredPods = $derived.by(() => {
    if (!searchQuery.trim()) {
      return pods;
    }
    return pods.filter((pod: K8sPod) => 
      pod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pod.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  function handlePodToggle(podName: string) {
    let newSelectedPods: string[];
    
    if (selectedPods.includes(podName)) {
      newSelectedPods = selectedPods.filter((name: string) => name !== podName);
    } else {
      newSelectedPods = [...selectedPods, podName];
    }
    
    dispatch('podsChange', { pods: newSelectedPods });
  }

  function clearAllPods() {
    dispatch('podsChange', { pods: [] });
  }

  function selectAllPods() {
    const allPodNames = filteredPods.map((pod: K8sPod) => pod.name);
    dispatch('podsChange', { pods: allPodNames });
  }
  
  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
    if (!isDropdownOpen) {
      searchQuery = "";
    }
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isDropdownOpen = false;
      searchQuery = "";
    }
  }
  
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.pod-selector-container')) {
      isDropdownOpen = false;
      searchQuery = "";
    }
  }
  
  $effect(() => {
    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<div class="space-y-2">
  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
    Pods ({selectedPods.length} selected)
  </label>
  
  <div class="pod-selector-container relative">
    <button
      type="button"
      onclick={toggleDropdown}
      {disabled}
      class="w-full px-3 py-2 text-left bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm text-slate-900 dark:text-white">
          {#if selectedPods.length === 0}
            Select pods...
          {:else if selectedPods.length === 1}
            {selectedPods[0]}
          {:else}
            {selectedPods.length} pods selected
          {/if}
        </span>
        <svg class="w-4 h-4 text-slate-400 transform {isDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </button>

    {#if isDropdownOpen && !disabled}
      <div class="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
        <!-- Search Input -->
        <div class="p-2 border-b border-slate-200 dark:border-slate-700">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search pods..."
            class="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <!-- Actions -->
        <div class="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div class="flex space-x-2">
            <button
              type="button"
              onclick={selectAllPods}
              class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              Select All
            </button>
            <button
              type="button"
              onclick={clearAllPods}
              class="text-xs px-2 py-1 bg-slate-600 text-white rounded hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              Clear All
            </button>
          </div>
        </div>
        
        <!-- Pod Options -->
        <div class="py-1">
          {#if filteredPods.length === 0}
            <div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              No pods found
            </div>
          {:else}
            {#each filteredPods as pod}
              <label class="flex items-center px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPods.includes(pod.name)}
                  onchange={() => handlePodToggle(pod.name)}
                  class="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-slate-800"
                />
                <div class="ml-3 flex-1 min-w-0">
                  <div class="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {pod.name}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    Status: {pod.status} • Ready: {pod.ready} • Restarts: {pod.restarts}
                  </div>
                </div>
              </label>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
