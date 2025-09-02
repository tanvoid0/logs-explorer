<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SearchInput } from '$lib/components/ui/search/index.js';
  import { BaseSelector } from '$lib/components/ui/selector/index.js';

  const { searchQuery = "", frameworkFilter = "", sortBy = "name", frameworks = [], className = "" } = $props<{
    searchQuery?: string;
    frameworkFilter?: string;
    sortBy?: string;
    frameworks?: string[];
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleSearchChange(value: string) {
    dispatch('searchChange', { value });
  }

  function handleFrameworkFilterChange(event: CustomEvent) {
    dispatch('frameworkFilterChange', { value: event.detail.value });
  }

  function handleSortByChange(event: CustomEvent) {
    dispatch('sortByChange', { value: event.detail.value });
  }
</script>

<div class="space-y-4 {className}">
  <!-- Search -->
  <div class="max-w-md">
    <SearchInput 
      value={searchQuery}
      placeholder="Search by name or path..."
      onSearch={handleSearchChange}
    />
  </div>

  <!-- Filters and Sorting -->
  <div class="flex items-center space-x-4">
    <div class="flex items-center space-x-2">
      <label for="framework-filter" class="text-sm font-medium text-slate-700 dark:text-slate-300">
        Framework:
      </label>
      <BaseSelector
        selectedValues={frameworkFilter ? [frameworkFilter] : []}
        onchange={handleFrameworkFilterChange}
        options={[
          { value: "", label: 'All Frameworks' },
          ...frameworks.map((framework: string) => ({ value: framework, label: framework }))
        ]}
      />
    </div>
    
    <div class="flex items-center space-x-2">
      <label for="sort-by" class="text-sm font-medium text-slate-700 dark:text-slate-300">
        Sort by:
      </label>
      <BaseSelector
        selectedValues={[sortBy]}
        onchange={handleSortByChange}
        options={[
          { value: 'name', label: 'Name' },
          { value: 'date_added', label: 'Date Added' },
          { value: 'date_updated', label: 'Date Updated' }
        ]}
      />
    </div>
  </div>
</div>
