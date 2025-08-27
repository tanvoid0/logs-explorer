<script lang="ts">
  import { onMount } from 'svelte';
  import { appStore, connectionState } from '$lib/stores/app-store';
  import { k8sAPI, type K8sNamespace, type K8sDeployment, type K8sLog, type K8sPod } from '$lib/api/k8s';
  import LogsSearchPanel from '$lib/components/LogsSearchPanel.svelte';
  import LogsDisplay from '$lib/components/LogsDisplay.svelte';
  import AdvancedSearchPanel from '$lib/components/AdvancedSearchPanel.svelte';
  import { createEventDispatcher } from 'svelte';
  import Button from "$lib/components/ui/button.svelte";
  import { toastStore } from '$lib/stores/toast-store';

  const dispatch = createEventDispatcher();

  // Props
  let {
    defaultPods = [],
    title = "Logs",
    description = "View and filter logs",
    defaultNamespace = "",
    showNamespaceLabel = true
  } = $props();

  // State
  let logs = $state<K8sLog[]>([]);
  let logsLoading = $state(false);
  let logsLoadingMore = $state(false);
  let logCount = $state(50);
  let sortOrder = $state<'newest' | 'oldest'>('newest');
  let currentPage = $state(1);
  let hasNextPage = $state(false);
  let hasPreviousPage = $state(false);
  let isLiveMode = $state(false);
  let isStaticMode = $state(true);
  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Filter state
  let selectedDeployments = $state<string[]>([]);
  let selectedPods = $state<string[]>(defaultPods);
  let searchQuery = $state("");
  let severityFilter = $state("");
  let traceIdFilter = $state("");
  let startTime = $state<string | null>(null);
  let endTime = $state<string | null>(null);
  let pinnedStartLog = $state<string | null>(null);
  let pinnedEndLog = $state<string | null>(null);

  // Data
  let namespaces = $state<K8sNamespace[]>([]);
  let deployments = $state<K8sDeployment[]>([]);
  let pods = $state<K8sPod[]>([]);

  // Derived state
  let currentNamespace = $derived(defaultNamespace || $appStore.namespace.selected || 'default');
  let isConnected = $derived($connectionState.isConnected);
  
  // Reactive effect to load logs when connection or namespace changes
  $effect(() => {
    if (isConnected && currentNamespace && namespaces.length > 0) {
      loadLogs(1);
    }
  });

  // Load initial data
  onMount(async () => {
    await loadNamespaces();
    await loadDeployments();
    await loadPods();
    
    // Load initial logs if connected
    if (isConnected && currentNamespace) {
      await loadLogs(1);
    }
  });

  async function loadNamespaces() {
    try {
      namespaces = await k8sAPI.getNamespaces();
    } catch (error) {
      console.error('Failed to load namespaces:', error);
    }
  }

  async function loadDeployments() {
    if (!currentNamespace) return;
    
    try {
      deployments = await k8sAPI.getDeployments(currentNamespace);
    } catch (error) {
      console.error('Failed to load deployments:', error);
    }
  }

  async function loadPods() {
    if (!currentNamespace) return;
    
    try {
      pods = await k8sAPI.getPods(currentNamespace);
    } catch (error) {
      console.error('Failed to load pods:', error);
    }
  }

  async function loadLogs(page: number = 1, append: boolean = false) {
    if (!currentNamespace || !isConnected) return;

    if (append) {
      logsLoadingMore = true;
    } else {
      logsLoading = true;
      currentPage = page;
    }

    try {
      const result = await k8sAPI.getNamespaceLogs(currentNamespace, {
        deployments: selectedDeployments.length > 0 ? selectedDeployments : undefined,
        pods: selectedPods.length > 0 ? selectedPods : undefined,
        tail: logCount,
        page: page,
        search: searchQuery || undefined,
        severity: severityFilter || undefined,
        traceId: traceIdFilter || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      });

      if (append) {
        // Append new logs to existing logs
        logs = [...logs, ...result];
        currentPage = page;
      } else {
        // Replace logs (initial load or filter change)
        logs = result;
        currentPage = page;
      }
      
      // Show toast if no logs found (only on initial load)
      if (result.length === 0 && !append) {
        const filterInfo = [];
        if (selectedDeployments.length > 0) filterInfo.push(`deployments: ${selectedDeployments.join(', ')}`);
        if (selectedPods.length > 0) filterInfo.push(`pods: ${selectedPods.join(', ')}`);
        if (searchQuery) filterInfo.push(`search: "${searchQuery}"`);
        if (severityFilter) filterInfo.push(`severity: ${severityFilter}`);
        if (traceIdFilter) filterInfo.push(`trace ID: ${traceIdFilter}`);
        
        const filterText = filterInfo.length > 0 ? ` with filters: ${filterInfo.join(', ')}` : '';
        toastStore.warning(`No logs found in namespace "${currentNamespace}"${filterText}`);
      }
      
      // Update pagination state
      hasNextPage = result.length === logCount;
      hasPreviousPage = page > 1;
    } catch (error) {
      console.error('Failed to load logs:', error);
      if (!append) {
        logs = [];
      }
      toastStore.error(`Failed to load logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (append) {
        logsLoadingMore = false;
      } else {
        logsLoading = false;
      }
    }
  }

  // Event handlers
  function handleDeploymentsChange(event: CustomEvent<{deployments: string[]}>) {
    selectedDeployments = event.detail.deployments;
    loadLogs(1); // Reset to first page when filters change
  }

  function handlePodsChange(event: CustomEvent<{pods: string[]}>) {
    selectedPods = event.detail.pods;
    loadLogs(1); // Reset to first page when filters change
  }

  function handleSearch(event: CustomEvent<{query: string}>) {
    searchQuery = event.detail.query;
    loadLogs(1); // Reset to first page when filters change
  }

  function handleSeverityChange(event: CustomEvent<{severity: string}>) {
    severityFilter = event.detail.severity;
    loadLogs(1); // Reset to first page when filters change
  }

  function handleTraceIdChange(event: CustomEvent<{traceId: string}>) {
    traceIdFilter = event.detail.traceId;
    loadLogs(1); // Reset to first page when filters change
  }

  function handleTimeChange(event: CustomEvent<{startTime: string | null, endTime: string | null}>) {
    startTime = event.detail.startTime;
    endTime = event.detail.endTime;
    loadLogs(1); // Reset to first page when filters change
  }

  function handleLoadMoreNext() {
    if (hasNextPage && !logsLoadingMore) {
      loadLogs(currentPage + 1, true);
    }
  }

  function handleLoadMorePrevious() {
    if (hasPreviousPage && !logsLoadingMore) {
      loadLogs(currentPage - 1, true);
    }
  }

  function handlePinStartTime() {
    // This will be handled by the LogsDisplay component when a log is selected
    dispatch('pinStartTime');
  }

  function handlePinEndTime() {
    // This will be handled by the LogsDisplay component when a log is selected
    dispatch('pinEndTime');
  }

  function handleNextPage() {
    loadLogs(currentPage + 1);
  }

  function handlePreviousPage() {
    loadLogs(currentPage - 1);
  }

  function handleModeChange(event: CustomEvent<{isLiveMode: boolean, isStaticMode: boolean}>) {
    isLiveMode = event.detail.isLiveMode;
    isStaticMode = !isLiveMode;

    if (isLiveMode) {
      refreshInterval = setInterval(() => {
        if ($connectionState.isConnected) {
          loadLogs();
        }
      }, 5000);
      loadLogs();
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    }
  }

  function handleLogCountChange(event: CustomEvent<{count: number}>) {
    logCount = event.detail.count;
    loadLogs();
  }

  function handleSortOrderChange(event: CustomEvent<{sortOrder: 'newest' | 'oldest'}>) {
    sortOrder = event.detail.sortOrder;
    logs = sortLogs([...logs]);
  }

  function sortLogs(logsToSort: K8sLog[]) {
    return logsToSort.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
  }

  function handleDeploymentFilter(event: CustomEvent<{deploymentName: string}>) {
    const deploymentName = event.detail.deploymentName;
    if (!selectedDeployments.includes(deploymentName)) {
      selectedDeployments = [...selectedDeployments, deploymentName];
    }
  }

  function handleSeverityFilter(event: CustomEvent<{severity: string}>) {
    severityFilter = event.detail.severity;
  }
</script>

    <div class="w-full px-4">
  <!-- Page Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
    <p class="text-slate-600 dark:text-slate-400 mt-1">{description}</p>
  </div>

  {#if !$connectionState.isConnected}
    <div class="text-center py-12">
      <div class="text-slate-400 dark:text-slate-500 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
        Not Connected to Kubernetes
      </h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Connect to a Kubernetes cluster to view logs
      </p>
      <button 
        onclick={() => appStore.connect()}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Connect to Kubernetes
      </button>
    </div>
  {:else}
    <!-- Responsive layout: Stack on mobile, side-by-side on larger screens -->
    <div class="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <!-- Left Side: Filter Panel -->
      <div class="w-full lg:w-80 lg:flex-shrink-0">
        <div class="sticky top-6 space-y-4">
          <!-- Active Filters Card -->
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300">Active Filters</h4>
              <button
                onclick={() => {
                  selectedDeployments = [];
                  selectedPods = [];
                  severityFilter = "";
                  traceIdFilter = "";
                  searchQuery = "";
                  dispatch('deploymentsChange', { deployments: [] });
                  dispatch('podsChange', { pods: [] });
                  dispatch('severityChange', { severity: "" });
                  dispatch('traceIdChange', { traceId: "" });
                }}
                class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear All
              </button>
            </div>
            
            <div class="flex flex-wrap gap-2">
              <!-- Namespace Filter -->
              {#if currentNamespace && showNamespaceLabel}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  Namespace: {currentNamespace}
                </span>
              {/if}
              
              <!-- Deployment Filters -->
              {#each selectedDeployments as deployment}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                  {deployment}
                  <button
                    onclick={() => {
                      selectedDeployments = selectedDeployments.filter(d => d !== deployment);
                      dispatch('deploymentsChange', { deployments: selectedDeployments });
                    }}
                    class="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              {/each}
              
              <!-- Pod Filters -->
              {#each selectedPods as pod}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                  {pod}
                  <button
                    onclick={() => {
                      selectedPods = selectedPods.filter(p => p !== pod);
                      dispatch('podsChange', { pods: selectedPods });
                    }}
                    class="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                  >
                    ×
                  </button>
                </span>
              {/each}
              
              <!-- Severity Filter -->
              {#if severityFilter}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  Severity: {severityFilter}
                  <button
                    onclick={() => {
                      severityFilter = "";
                      dispatch('severityChange', { severity: "" });
                    }}
                    class="ml-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
                  >
                    ×
                  </button>
                </span>
              {/if}
              
              <!-- Trace ID Filter -->
              {#if traceIdFilter}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  Trace: {traceIdFilter}
                  <button
                    onclick={() => {
                      traceIdFilter = "";
                      dispatch('traceIdChange', { traceId: "" });
                    }}
                    class="ml-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                  >
                    ×
                  </button>
                </span>
              {/if}
              
              <!-- Search Filter -->
              {#if searchQuery}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  Search: {searchQuery}
                  <button
                    onclick={() => {
                      searchQuery = "";
                    }}
                    class="ml-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                  >
                    ×
                  </button>
                </span>
              {/if}
              
              <!-- No Filters Applied -->
              {#if !currentNamespace && selectedDeployments.length === 0 && selectedPods.length === 0 && !severityFilter && !traceIdFilter && !searchQuery}
                <span class="text-sm text-slate-500 dark:text-slate-400 italic">
                  No filters applied
                </span>
              {/if}
            </div>
          </div>

          <!-- Advanced Search Panel -->
          <AdvancedSearchPanel
            bind:searchQuery
            {isConnected}
            {logsLoading}
            on:search={handleSearch}
          />

          <!-- Log Filters Card -->
          <LogsSearchPanel
            {namespaces}
            {deployments}
            {pods}
            selectedNamespace={currentNamespace}
            {selectedDeployments}
            {selectedPods}
            {searchQuery}
            {severityFilter}
            {traceIdFilter}
            {startTime}
            {endTime}
            {pinnedStartLog}
            {pinnedEndLog}
            {isLiveMode}
            {isStaticMode}
            logsLoading={logsLoading}
            isConnected={$connectionState.isConnected}
            on:deploymentsChange={handleDeploymentsChange}
            on:podsChange={handlePodsChange}
            on:severityChange={handleSeverityChange}
            on:traceIdChange={handleTraceIdChange}
            on:timeChange={handleTimeChange}
            on:pinStartTime={handlePinStartTime}
            on:pinEndTime={handlePinEndTime}
            on:modeChange={handleModeChange}
          />
        </div>
      </div>

      <!-- Right Side: Logs Display -->
      <div class="flex-1 min-w-0">
        <!-- Logs Display -->
        <div>
          <LogsDisplay
            {logs}
            {logsLoading}
            {logsLoadingMore}
            {isConnected}
            {logCount}
            {sortOrder}
            {traceIdFilter}
            {severityFilter}
            {hasNextPage}
            {hasPreviousPage}
            on:logCountChange={handleLogCountChange}
            on:sortOrderChange={handleSortOrderChange}
            on:severityChange={handleSeverityChange}
            on:nextPage={handleNextPage}
            on:previousPage={handlePreviousPage}
            on:loadMoreNext={handleLoadMoreNext}
            on:loadMorePrevious={handleLoadMorePrevious}
            on:loadLogs={() => loadLogs(1)}
          />
        </div>
      </div>
    </div>
  {/if}
</div>
