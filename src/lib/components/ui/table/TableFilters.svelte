<script lang="ts">
  import { cn } from "$lib/utils/index";
  import Button from "../button.svelte";
  import BaseSelector from "../selector/BaseSelector.svelte";

  const { 
    filters = [], 
    className = "",
    onToggleFilters,
    onExport,
    onFilterChange,
    onClearFilters
  } = $props<{
    filters: Array<{
      key: string;
      label: string;
      type: 'text' | 'select' | 'date' | 'boolean';
      options?: Array<{ value: string; label: string }>;
      value?: any;
    }>;
    className?: string;
    onToggleFilters?: () => void;
    onExport?: () => void;
    onFilterChange?: (key: string, value: any) => void;
    onClearFilters?: () => void;
  }>();

  function handleFilterChange(key: string, value: any) {
    if (onFilterChange) {
      onFilterChange(key, value);
    }
  }
</script>

<div class={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4", className)}>
  <div class="flex items-center gap-2">
    <Button 
      variant="outline" 
      size="sm"
      onclick={onToggleFilters}
    >
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
      </svg>
      Filters
    </Button>
    
    <Button 
      variant="outline" 
      size="sm"
      onclick={onExport}
    >
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
      Export
    </Button>
  </div>

  {#if filters.length > 0}
    <div class="flex flex-wrap items-center gap-4">
      {#each filters as filter, index}
        <div class="flex flex-col space-y-2">
          <label for={`filter-${filter.key}-${index}`} class="text-sm font-medium text-slate-700 dark:text-slate-300">
            {filter.label}
          </label>
          
          {#if filter.type === 'select' && filter.options}
            <BaseSelector
              options={filter.options}
              selectedValues={filter.value ? [String(filter.value)] : []}
              placeholder={`Select ${filter.label}`}
              size="sm"
              onchange={(event) => handleFilterChange(filter.key, event.detail.value)}
            />
          {:else if filter.type === 'text'}
            <input
              id={`filter-${filter.key}-${index}`}
              type="text"
              placeholder={`Enter ${filter.label}`}
              value={filter.value || ''}
              oninput={(event) => handleFilterChange(filter.key, (event.target as HTMLInputElement).value)}
              class="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          {:else if filter.type === 'date'}
            <input
              id={`filter-${filter.key}-${index}`}
              type="date"
              value={filter.value || ''}
              onchange={(event) => handleFilterChange(filter.key, (event.target as HTMLInputElement).value)}
              class="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          {:else if filter.type === 'boolean'}
            <select
              id={`filter-${filter.key}-${index}`}
              value={filter.value || ''}
              onchange={(event) => handleFilterChange(filter.key, (event.target as HTMLSelectElement).value)}
              class="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          {/if}
        </div>
      {/each}
      
      <Button 
        variant="outline" 
        size="sm"
        onclick={onClearFilters}
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        Clear
      </Button>
    </div>
  {/if}
</div>
