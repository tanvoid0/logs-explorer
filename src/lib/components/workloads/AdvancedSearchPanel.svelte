<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";

  let { 
    searchQuery = $bindable(""), 
    isConnected = false, 
    logsLoading = false,
    onSearch
  } = $props<{
    searchQuery?: string;
    isConnected?: boolean;
    logsLoading?: boolean;
    onSearch?: (query: string) => void;
  }>();

  let showAdvancedSearch = false;
  let searchExamples = [
    {
      title: "Simple Text Search",
      query: "error",
      description: "Find logs containing 'error'"
    },
    {
      title: "Field-Specific Search",
      query: "pod:my-app",
      description: "Find logs from pods containing 'my-app'"
    },
    {
      title: "Exact Match",
      query: "level:=ERROR",
      description: "Find logs with exact level 'ERROR'"
    },
    {
      title: "Starts With",
      query: "message:^Starting",
      description: "Find logs starting with 'Starting'"
    },
    {
      title: "Ends With",
      query: "message:failed$",
      description: "Find logs ending with 'failed'"
    },
    {
      title: "Regex Pattern",
      query: "message:/\\d{4}-\\d{2}-\\d{2}/",
      description: "Find logs with date pattern"
    },
    {
      title: "Logical AND",
      query: "error AND pod:my-app",
      description: "Find errors from my-app pods"
    },
    {
      title: "Logical OR",
      query: "error OR warning",
      description: "Find errors or warnings"
    },
    {
      title: "Negation",
      query: "NOT debug",
      description: "Find logs not containing 'debug'"
    },
    {
      title: "Complex Query",
      query: "level:=ERROR AND (pod:api OR pod:web) AND NOT message:health",
      description: "Find errors from api or web pods, excluding health checks"
    }
  ];

  function handleSearch() {
    onSearch?.(searchQuery);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }

  function useExample(example: string) {
    searchQuery = example;
    handleSearch();
  }

  function clearSearch() {
    searchQuery = "";
    onSearch?.("");
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
  <div class="flex items-center justify-between mb-4">
    <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300">Advanced Search</h4>
    <button
      onclick={() => showAdvancedSearch = !showAdvancedSearch}
      class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
    >
      {showAdvancedSearch ? 'Hide' : 'Show'} Examples
    </button>
  </div>

  <!-- Search Input -->
  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
    <div class="flex items-start space-x-2">
      <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div class="text-sm text-blue-800 dark:text-blue-200">
        <div class="font-medium mb-1">Advanced Search Under Development</div>
        <div class="text-xs">Custom search functionality will be available in the next iteration. For now, use the "Load Logs" button to fetch logs with existing filters.</div>
      </div>
    </div>
  </div>
  
  <div class="flex items-center space-x-3 mb-4">
    <div class="flex-1 relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search functionality coming soon..."
        class="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-not-allowed"
        onkeydown={handleKeydown}
        disabled={true}
      />
    </div>
    <Button 
      onclick={handleSearch} 
      disabled={!isConnected || logsLoading} 
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
      title={searchQuery ? "Search with current query" : "Load all logs"}
    >
      {#if logsLoading}
        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading...</span>
      {:else}
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <span>{searchQuery ? "Search" : "Load Logs"}</span>
      {/if}
    </Button>
    {#if searchQuery}
      <button
        onclick={clearSearch}
        class="px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        title="Clear search"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    {/if}
  </div>

  <!-- Search Examples -->
  {#if showAdvancedSearch}
    <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
      <h5 class="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3">Search Examples</h5>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        {#each searchExamples as example}
          <div class="p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
               onclick={() => useExample(example.query)}>
            <div class="text-xs font-mono text-blue-600 dark:text-blue-400 mb-1">
              {example.query}
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-400">
              {example.description}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Search Syntax Help -->
  <div class="mt-4 text-xs text-slate-500 dark:text-slate-400">
    <div class="font-medium mb-2">Search Syntax:</div>
    <div class="space-y-1">
      <div><span class="font-mono">field:value</span> - Search specific field (pod, message, level, container, timestamp)</div>
      <div><span class="font-mono">=value</span> - Exact match</div>
      <div><span class="font-mono">^value</span> - Starts with</div>
      <div><span class="font-mono">value$</span> - Ends with</div>
      <div><span class="font-mono">/pattern/</span> - Regex pattern</div>
      <div><span class="font-mono">AND</span>, <span class="font-mono">OR</span>, <span class="font-mono">NOT</span> - Logical operators</div>
    </div>
  </div>
</div>
