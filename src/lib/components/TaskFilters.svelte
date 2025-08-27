<script lang="ts">
  import { taskFilters, taskStats } from '$lib/stores/task-store';
  import type { TaskStatus } from '$lib/types/task';
  import Icon from '@iconify/svelte';

  let searchTerm = '';
  let selectedStatuses: TaskStatus[] = [];
  let selectedPriorities: string[] = [];

  const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-gray-500' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ];

  function updateFilters() {
    $taskFilters = {
      search: searchTerm || undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      priority: selectedPriorities.length > 0 ? selectedPriorities : undefined
    };
  }

  function toggleStatus(status: TaskStatus) {
    if (selectedStatuses.includes(status)) {
      selectedStatuses = selectedStatuses.filter(s => s !== status);
    } else {
      selectedStatuses = [...selectedStatuses, status];
    }
    updateFilters();
  }

  function togglePriority(priority: string) {
    if (selectedPriorities.includes(priority)) {
      selectedPriorities = selectedPriorities.filter(p => p !== priority);
    } else {
      selectedPriorities = [...selectedPriorities, priority];
    }
    updateFilters();
  }

  function clearFilters() {
    searchTerm = '';
    selectedStatuses = [];
    selectedPriorities = [];
    updateFilters();
  }

  // Watch for changes and update filters
  $: if (searchTerm !== undefined) updateFilters();
</script>

<div class="task-filters bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
    <button
      on:click={clearFilters}
      class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
    >
      Clear all
    </button>
  </div>

  <!-- Search -->
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Search Tasks
    </label>
    <div class="relative">
      <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        bind:value={searchTerm}
        class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Search by title or description..."
      />
    </div>
  </div>

  <!-- Status Filters -->
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Status
    </label>
    <div class="flex flex-wrap gap-2">
      {#each statusOptions as option}
        <button
          on:click={() => toggleStatus(option.value)}
          class="px-3 py-1 rounded-full text-sm font-medium transition-colors {selectedStatuses.includes(option.value) ? option.color + ' ring-2 ring-blue-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
        >
          {option.label}
          <span class="ml-1 text-xs opacity-75">
            ({$taskStats[option.value]})
          </span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Priority Filters -->
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Priority
    </label>
    <div class="flex flex-wrap gap-2">
      {#each priorityOptions as option}
        <button
          on:click={() => togglePriority(option.value)}
          class="px-3 py-1 rounded-full text-sm font-medium transition-colors {selectedPriorities.includes(option.value) ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
        >
          <Icon 
            icon={option.value === 'low' ? 'mdi:flag-outline' : option.value === 'medium' ? 'mdi:flag' : 'mdi:flag-variant'} 
            class="w-4 h-4 inline mr-1 {option.color}" 
          />
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Active Filters Summary -->
  {#if selectedStatuses.length > 0 || selectedPriorities.length > 0 || searchTerm}
    <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Icon icon="mdi:filter" class="w-4 h-4" />
        <span>Active filters:</span>
        {#if searchTerm}
          <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
            Search: "{searchTerm}"
          </span>
        {/if}
        {#each selectedStatuses as status}
          <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
            {status}
          </span>
        {/each}
        {#each selectedPriorities as priority}
          <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
            {priority} priority
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>
