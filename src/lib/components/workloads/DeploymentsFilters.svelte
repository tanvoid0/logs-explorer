<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';

  let { 
    searchQuery = "", 
    statusFilter = "", 
    deploymentStatuses = [], 
    hasFilters = false, 
    filteredCount = 0, 
    totalCount = 0, 
    isLoading = false, 
    isConnected = false, 
    className = "" 
  } = $props<{
    searchQuery?: string;
    statusFilter?: string;
    deploymentStatuses?: string[];
    hasFilters?: boolean;
    filteredCount?: number;
    totalCount?: number;
    isLoading?: boolean;
    isConnected?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch('searchChange', { value: target.value });
  }

  function handleStatusChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    dispatch('statusChange', { value: target.value });
  }

  function handleClearFilters() {
    dispatch('clearFilters');
  }

  function handleRefresh() {
    dispatch('refresh');
  }
</script>

<div class="flex flex-wrap items-center gap-3 {className}">
  <!-- Search Input -->
  <div class="flex items-center gap-2 flex-1 min-w-0">
    <input
      type="text"
      value={searchQuery}
      oninput={handleSearchChange}
      placeholder="Search deployments..."
      class="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      disabled={!isConnected}
    />
  </div>

  <!-- Status Filter -->
  <div class="flex items-center gap-2">
    <label class="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
      Status:
    </label>
    <select
      value={statusFilter}
      onchange={handleStatusChange}
      class="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">All Statuses</option>
      {#each deploymentStatuses as status}
        <option value={status}>{status}</option>
      {/each}
    </select>
  </div>

  <!-- Actions -->
  <div class="flex items-center gap-2">
    {#if hasFilters}
      <Button 
        onclick={handleClearFilters}
        variant="outline"
        class="px-3 py-1.5 text-sm"
      >
        Clear Filters
      </Button>
    {/if}
    <span class="text-sm text-slate-500 dark:text-slate-400">
      {filteredCount} of {totalCount} deployments
    </span>
    <Button 
      onclick={handleRefresh}
      disabled={isLoading || !isConnected}
      class="px-3 py-1.5 text-sm"
    >
      {#if isLoading}
        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {:else}
        Refresh
      {/if}
    </Button>
  </div>
</div>
