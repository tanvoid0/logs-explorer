<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';

  let { 
    searchQuery = "", 
    statusFilter = "", 
    podStatuses = [], 
    hasFilters = false, 
    filteredCount = 0, 
    totalCount = 0, 
    className = "",
    onSearchChange,
    onStatusChange,
    onClearFilters
  } = $props<{
    searchQuery?: string;
    statusFilter?: string;
    podStatuses?: string[];
    hasFilters?: boolean;
    filteredCount?: number;
    totalCount?: number;
    className?: string;
    onSearchChange?: (value: string) => void;
    onStatusChange?: (value: string) => void;
    onClearFilters?: () => void;
  }>();

  function handleSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    onSearchChange?.(target.value);
  }

  function handleStatusChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onStatusChange?.(target.value);
  }

  function handleClearFilters() {
    onClearFilters?.();
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mb-6 {className}">
  <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4 flex-1">
        <!-- Search Input -->
        <div class="flex-1 min-w-0">
          <input
            type="text"
            value={searchQuery}
            oninput={handleSearchChange}
            placeholder="Search pods by name or namespace..."
            class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Status Filter -->
        <select
          value={statusFilter}
          onchange={handleStatusChange}
          class="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {#each podStatuses as status (status)}
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
            class="text-sm"
          >
            Clear Filters
          </Button>
        {/if}
        <span class="text-sm text-slate-500 dark:text-slate-400">
          {#if hasFilters}
            {filteredCount} of {totalCount} pods (filtered)
          {:else}
            {totalCount} pods
          {/if}
        </span>
      </div>
    </div>
  </div>
</div>
