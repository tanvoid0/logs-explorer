<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import LogEntry from "$lib/components/LogEntry.svelte";
  import type { K8sLog } from "$lib/types/k8s";
  
  const {
    logs = [],
    logsLoading = false,
    logsLoadingMore = false,
    isConnected = false,
    logCount = 50,
    sortOrder = 'newest',
    traceIdFilter = "",
    severityFilter = "",
    hasNextPage = false,
    hasPreviousPage = false,
    pinnedStartLog = null,
    pinnedEndLog = null,
    namespace = "",
    onLogCountChange,
    onSortOrderChange,
    onSeverityChange,
    onTraceIdChange,
    onDeploymentFilter,
    onNextPage,
    onPreviousPage,
    onLoadMoreNext,
    onLoadMorePrevious,
    onLoadLogs
  } = $props<{
    logs?: K8sLog[];
    logsLoading?: boolean;
    logsLoadingMore?: boolean;
    isConnected?: boolean;
    logCount?: number;
    sortOrder?: 'newest' | 'oldest';
    traceIdFilter?: string;
    severityFilter?: string;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    pinnedStartLog?: string | null;
    pinnedEndLog?: string | null;
    namespace?: string;
    onLogCountChange?: (count: number) => void;
    onSortOrderChange?: (sortOrder: 'newest' | 'oldest') => void;
    onSeverityChange?: (severity: string) => void;
    onTraceIdChange?: (traceId: string) => void;
    onDeploymentFilter?: (deploymentName: string) => void;
    onNextPage?: () => void;
    onPreviousPage?: () => void;
    onLoadMoreNext?: () => void;
    onLoadMorePrevious?: () => void;
    onLoadLogs?: () => void;
  }>();
  
  // Filter logs based on severity
  let filteredLogs = $derived(logs.filter((log: K8sLog) => {
    if (!severityFilter) return true;
    
    const logLevel = log.level?.toUpperCase();
    const filterLevel = severityFilter.toUpperCase();
    
    // Define severity hierarchy (higher number = higher priority)
    const severityLevels: Record<string, number> = {
      'DEBUG': 0,
      'INFO': 1,
      'WARNING': 2,
      'ERROR': 3,
      'FATAL': 4
    };
    
    const logSeverity = severityLevels[logLevel] ?? 0;
    const filterSeverity = severityLevels[filterLevel] ?? 0;
    
    // Show logs with severity >= filter severity
    return logSeverity >= filterSeverity;
  }));
  
  let logsContainerRef: HTMLElement | null = null;
  let viewMode: 'detailed' | 'compact' | 'raw' | 'lean' = 'detailed';
  
  function setLogCount(count: number) {
    onLogCountChange?.(count);
  }
  
  function scrollToTop() {
    if (logsContainerRef) {
      logsContainerRef.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  function scrollToBottom() {
    if (logsContainerRef) {
      logsContainerRef.scrollTo({ top: logsContainerRef.scrollHeight, behavior: 'smooth' });
    }
  }
  
  function toggleSortOrder() {
    const newOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
    onSortOrderChange?.(newOrder);
  }
  
  function clearSeverityFilter() {
    onSeverityChange?.("");
  }
  
  function handleTraceIdFilter(event: CustomEvent<{traceId: string}>) {
    onTraceIdChange?.(event.detail.traceId);
  }
  
  function handleDeploymentFilter(event: CustomEvent<{deploymentName: string}>) {
    onDeploymentFilter?.(event.detail.deploymentName);
  }
  
  function handleSeverityFilter(event: CustomEvent<{severity: string}>) {
    onSeverityChange?.(event.detail.severity);
  }
  
  function handleNextPage() {
    onNextPage?.();
  }
  
  function handlePreviousPage() {
    onPreviousPage?.();
  }

  function handleLoadMoreNext() {
    onLoadMoreNext?.();
  }

  function handleLoadMorePrevious() {
    onLoadMorePrevious?.();
  }

  function handlePinStartTime(event: CustomEvent<{timestamp: string}>) {
    // This event is not handled by the new props, so it's removed.
    // If it needs to be handled, it should be added to the props.
  }

  function handlePinEndTime(event: CustomEvent<{timestamp: string}>) {
    // This event is not handled by the new props, so it's removed.
    // If it needs to be handled, it should be added to the props.
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 max-w-full">
  <!-- Header with Controls -->
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 max-w-full">
    <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-medium text-slate-900 dark:text-white">
          Logs {filteredLogs.length > 0 ? `(${filteredLogs.length})` : ''}
        </h3>
        
        <!-- Controls -->
        <div class="flex items-center space-x-2 lg:space-x-4 flex-wrap gap-2">
          <!-- View Mode Controls -->
          <div class="flex items-center space-x-1">
            <span class="text-xs text-slate-600 dark:text-slate-400 mr-2">View:</span>
            <button
              onclick={() => viewMode = 'detailed'}
              class="flex items-center space-x-1 px-2 py-1 text-xs rounded {viewMode === 'detailed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}"
              disabled={!isConnected || filteredLogs.length === 0}
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
              </svg>
              <span>Detail</span>
            </button>
            <button
              onclick={() => viewMode = 'compact'}
              class="flex items-center space-x-1 px-2 py-1 text-xs rounded {viewMode === 'compact' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}"
              disabled={!isConnected || filteredLogs.length === 0}
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
              <span>Compact</span>
            </button>
            <button
              onclick={() => viewMode = 'raw'}
              class="flex items-center space-x-1 px-2 py-1 text-xs rounded {viewMode === 'raw' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}"
              disabled={!isConnected || filteredLogs.length === 0}
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              <span>Raw</span>
            </button>
            <button
              onclick={() => viewMode = 'lean'}
              class="flex items-center space-x-1 px-2 py-1 text-xs rounded {viewMode === 'lean' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}"
              disabled={!isConnected || filteredLogs.length === 0}
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 18h16"></path>
              </svg>
              <span>Lean</span>
            </button>
          </div>
          
          <!-- Log Count Control -->
          <div class="flex items-center space-x-2">
            <span class="text-xs text-slate-600 dark:text-slate-400">Count:</span>
            <select
              value={logCount}
              onchange={(e) => setLogCount(Number((e.target as HTMLSelectElement).value))}
              class="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              disabled={!isConnected}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
          
          <!-- Scroll Controls -->
          <div class="flex items-center space-x-1">
            <button
              onclick={scrollToTop}
              class="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              disabled={!isConnected || filteredLogs.length === 0}
              title="Scroll to top"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
            <button
              onclick={scrollToBottom}
              class="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              disabled={!isConnected || filteredLogs.length === 0}
              title="Scroll to bottom"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
          
          <!-- Sort Controls -->
          <div class="flex items-center space-x-2">
            <button
              onclick={toggleSortOrder}
              class="flex items-center space-x-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              disabled={!isConnected || filteredLogs.length === 0}
            >
              <span>Sort:</span>
              <span class="font-medium">
                {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
              </span>
              <span class="text-xs">
                {sortOrder === 'newest' ? '↓' : '↑'}
              </span>
            </button>
          </div>
          
          <!-- Pagination Controls -->
          <div class="flex items-center space-x-1">
            <button
              onclick={handlePreviousPage}
              disabled={!isConnected || !hasPreviousPage || logsLoading}
              class="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <button
              onclick={handleNextPage}
              disabled={!isConnected || !hasNextPage || logsLoading}
              class="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Logs Content -->
    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 max-w-full overflow-hidden" bind:this={logsContainerRef}>
      <div class="p-3 max-w-full">
        <!-- Load More Previous Button (at top) -->
        {#if logs.length > 0 && hasPreviousPage}
          <div class="flex justify-center mb-4">
            <button
              onclick={handleLoadMorePrevious}
              disabled={!isConnected || logsLoadingMore}
              class="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if logsLoadingMore}
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              {:else}
                <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
                Load More Previous
              {/if}
            </button>
          </div>
        {/if}

        <!-- Logs List -->
        <div class="min-h-0">
          {#if logsLoading}
            <div class="flex items-center justify-center py-8">
              <div class="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading logs...</span>
              </div>
            </div>
          {:else if logs.length === 0}
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <div class="text-slate-400 dark:text-slate-500 mb-4">
                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No logs loaded
              </h3>
              <p class="text-slate-600 dark:text-slate-400 max-w-md mb-6">
                Load logs from your selected namespace and filters.
              </p>
              <button
                onclick={onLoadLogs}
                disabled={!isConnected || logsLoading}
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if logsLoading}
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                {:else}
                  <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  Load Logs
                {/if}
              </button>
              <div class="mt-4 flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Make sure you have selected a namespace and are connected to your cluster</span>
              </div>
            </div>
          {:else}
            <div class="space-y-2">
              {#each filteredLogs as log, index (index)}
                <LogEntry 
                  {log} 
                  {viewMode} 
                  on:severityClick={handleSeverityFilter}
                  on:pinStartTime={handlePinStartTime}
                  on:pinEndTime={handlePinEndTime}
                />
              {/each}
            </div>
          {/if}
        </div>

        <!-- Load More Next Button (at bottom) -->
        {#if logs.length > 0 && hasNextPage}
          <div class="flex justify-center mt-4">
            <button
              onclick={handleLoadMoreNext}
              disabled={!isConnected || logsLoadingMore}
              class="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if logsLoadingMore}
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              {:else}
                <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
                Load More Next
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
