<script lang="ts">
  import type { K8sDeployment } from '$lib/types/k8s';

  const { 
    deployments, 
    selectedDeployment, 
    folderName, 
    disabled,
    onDeploymentChange
  } = $props<{
    deployments: K8sDeployment[];
    selectedDeployment: string | null;
    folderName: string;
    disabled: boolean;
    onDeploymentChange?: (deployment: string | null) => void;
  }>();
  
  let searchQuery = $state("");
  let isDropdownOpen = $state(false);
  
  // Filter deployments based on search query and folder name
  let filteredDeployments = $derived.by(() => {
    let filtered = deployments;
    
    // First filter by folder name if it exists
    if (folderName.trim()) {
      const folderNameLower = folderName.toLowerCase();
      filtered = filtered.filter((deployment: K8sDeployment) => 
        deployment.name.toLowerCase().includes(folderNameLower)
      );
    }
    
    // Then filter by search query if it exists
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((deployment: K8sDeployment) => 
        deployment.name.toLowerCase().includes(searchLower) ||
        deployment.status.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  });

  function handleDeploymentSelect(deploymentName: string) {
    const newSelection = selectedDeployment === deploymentName ? null : deploymentName;
    onDeploymentChange?.(newSelection);
    isDropdownOpen = false;
    searchQuery = "";
  }

  function clearDeployment() {
    onDeploymentChange?.(null);
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
    if (!target.closest('.project-deployment-selector-container')) {
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
    Linked Deployment (Optional)
  </label>
  
  <div class="project-deployment-selector-container relative">
    <button
      type="button"
      onclick={toggleDropdown}
      {disabled}
      class="w-full px-3 py-2 text-left bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm text-slate-900 dark:text-white">
          {#if selectedDeployment}
            {selectedDeployment}
          {:else}
            No deployment linked
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
            placeholder="Search deployments..."
            class="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <!-- Actions -->
        <div class="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div class="flex space-x-2">
            <button
              type="button"
              onclick={clearDeployment}
              class="text-xs px-2 py-1 bg-slate-600 text-white rounded hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              Clear Selection
            </button>
            {#if folderName.trim() && filteredDeployments.length > 0}
              <span class="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                Filtered by folder: "{folderName}"
              </span>
            {/if}
          </div>
        </div>
        
        <!-- Deployment Options -->
        <div class="py-1">
          {#if filteredDeployments.length === 0}
            <div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              {#if folderName.trim()}
                No deployments found matching "{folderName}"
              {:else}
                No deployments found
              {/if}
            </div>
          {:else}
            {#each filteredDeployments as deployment}
              <button
                type="button"
                onclick={() => handleDeploymentSelect(deployment.name)}
                class="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer {selectedDeployment === deployment.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''}"
              >
                <div class="flex items-center">
                  <div class="w-4 h-4 mr-3 flex items-center justify-center">
                    {#if selectedDeployment === deployment.name}
                      <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                    {:else}
                      <div class="w-4 h-4 border border-slate-300 dark:border-slate-600 rounded"></div>
                    {/if}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {deployment.name}
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">
                      {deployment.replicas} replicas • {deployment.status}
                    </div>
                  </div>
                </div>
              </button>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  <p class="text-xs text-slate-500 dark:text-slate-400">
    Link this project to a Kubernetes deployment for quick access to deployment details
  </p>
</div>
