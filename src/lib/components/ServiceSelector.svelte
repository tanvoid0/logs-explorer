<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { K8sService } from '$lib/types/k8s';

  const { services, selectedServices, disabled } = $props<{
    services: K8sService[];
    selectedServices: string[];
    disabled: boolean;
  }>();

  const dispatch = createEventDispatcher();
  
  let searchQuery = $state("");
  let isDropdownOpen = $state(false);
  
  // Filter services based on search query
  let filteredServices = $derived.by(() => {
    if (!searchQuery.trim()) {
      return services;
    }
    return services.filter((service: K8sService) => 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  function handleServiceToggle(serviceName: string) {
    let newSelectedServices: string[];
    
    if (selectedServices.includes(serviceName)) {
      newSelectedServices = selectedServices.filter((name: string) => name !== serviceName);
    } else {
      newSelectedServices = [...selectedServices, serviceName];
    }
    
    dispatch('servicesChange', { services: newSelectedServices });
  }

  function clearAllServices() {
    dispatch('servicesChange', { services: [] });
  }

  function selectAllServices() {
    const allServiceNames = filteredServices.map((service: K8sService) => service.name);
    dispatch('servicesChange', { services: allServiceNames });
  }
  
  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
    if (!isDropdownOpen) {
      searchQuery = ""; // Clear search when closing
    }
  }
  
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.service-dropdown')) {
      isDropdownOpen = false;
      searchQuery = "";
    }
  }
  
  // Add click outside listener when dropdown is open
  $effect(() => {
    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });
</script>

<div class="space-y-2">
  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
    Services ({selectedServices.length} selected)
  </label>
  
  <!-- Dropdown Button -->
  <div class="relative service-dropdown">
    <button
      onclick={toggleDropdown}
      disabled={disabled}
      class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
    >
      <span class="truncate">
        {selectedServices.length === 0 
          ? 'Select services...' 
          : selectedServices.length === 1 
            ? selectedServices[0] 
            : `${selectedServices.length} services selected`
        }
      </span>
      <svg class="w-4 h-4 text-slate-400 transition-transform {isDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    <!-- Dropdown Menu -->
    {#if isDropdownOpen}
      <div class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-64 overflow-hidden">
        <!-- Search Input -->
        <div class="p-2 border-b border-slate-200 dark:border-slate-700">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search services..."
            class="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-between p-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onclick={selectAllServices}
            disabled={disabled || filteredServices.length === 0}
            class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select All
          </button>
          <button
            onclick={clearAllServices}
            disabled={disabled || selectedServices.length === 0}
            class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>
        
        <!-- Services List -->
        <div class="max-h-48 overflow-y-auto">
          {#if filteredServices.length === 0}
            <div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery ? 'No services match your search' : 'No services found'}
            </div>
          {:else}
            {#each filteredServices as service}
              <label class="flex items-center px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.name)}
                  onchange={() => handleServiceToggle(service.name)}
                  disabled={disabled}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div class="ml-3 flex-1 min-w-0">
                  <div class="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {service.name}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {service.type} • {service.ports}
                  </div>
                </div>
              </label>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Selected Services Tags -->
  {#if selectedServices.length > 0}
    <div class="flex flex-wrap gap-1">
      {#each selectedServices as serviceName}
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {serviceName}
          <button
            onclick={() => handleServiceToggle(serviceName)}
            disabled={disabled}
            class="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 disabled:opacity-50"
          >
            ×
          </button>
        </span>
      {/each}
    </div>
  {/if}
</div>
