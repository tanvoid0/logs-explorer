<script lang="ts">
  import { logger } from '$lib/utils/logger';
  import { onMount } from 'svelte';
  import { k8sAPI, type K8sNamespace, type K8sDeployment, type K8sLog, type K8sPod } from '$lib/api/k8s';
  import { appStore, namespaceState } from '$lib/stores/app-store';
  import { connectionState } from '$lib/stores/app-store';
  import { toastStore } from '$lib/stores/toast-store';
  import LogsDisplay from "$lib/components/LogsDisplay.svelte";
  import LogsSearchPanel from "$lib/components/LogsSearchPanel.svelte";

  // Props for configuring the logs viewer
  let { 
    title = "Logs Viewer",
    description = "View and filter logs across your Kubernetes cluster",
    showNamespaceFilter = true,
    defaultNamespace = "",
    defaultDeployments = [],
    defaultSearchQuery = "",
    defaultSeverityFilter = "",
    defaultTraceIdFilter = "",
    defaultLogCount = 100,
    defaultSortOrder = 'newest' as 'newest' | 'oldest',
    showNamespaceLabel = true,
    onPinStartTime,
    onPinEndTime
  } = $props<{
    title?: string;
    description?: string;
    showNamespaceFilter?: boolean;
    defaultNamespace?: string;
    defaultDeployments?: string[];
    defaultSearchQuery?: string;
    defaultSeverityFilter?: string;
    defaultTraceIdFilter?: string;
    defaultLogCount?: number;
    defaultSortOrder?: 'newest' | 'oldest';
    showNamespaceLabel?: boolean;
    onPinStartTime?: () => void;
    onPinEndTime?: () => void;
  }>();

  // Data state
  let namespaces = $state<K8sNamespace[]>([]);
  let deployments = $state<K8sDeployment[]>([]);
  let pods = $state<K8sPod[]>([]);
  let selectedDeployments = $state<string[]>(defaultDeployments);
  let selectedPods = $state<string[]>([]);
  let logs = $state<K8sLog[]>([]);
  let logsLoading = $state(false);

  // Filter state
  let searchQuery = $state(defaultSearchQuery);
  let severityFilter = $state(defaultSeverityFilter);
  let traceIdFilter = $state(defaultTraceIdFilter);
  let startTime = $state<string | null>(null);
  let endTime = $state<string | null>(null);
  let pinnedStartLog = $state<string | null>(null);
  let pinnedEndLog = $state<string | null>(null);
  let isLiveMode = $state(false);
  let isStaticMode = $state(true);
  let logCount = $state(defaultLogCount);
  let sortOrder = $state<'newest' | 'oldest'>(defaultSortOrder);
  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Use default namespace from app store or prop
  let currentNamespace = $derived(defaultNamespace || $namespaceState.selected || 'default');

  onMount(() => {
    if ($connectionState.isConnected) {
      loadInitialData();
    }
  });

  async function loadInitialData() {
    try {
      // Load namespaces
      const namespaceList = await k8sAPI.getNamespaces();
      namespaces = namespaceList;

      // Load deployments for current namespace
      if (currentNamespace) {
        await loadDeploymentsForNamespace(currentNamespace);
        await loadPodsForNamespace(currentNamespace);
      }

      // Load initial logs
      await loadLogs();

    } catch (error) {
      logger.error('Failed to load initial data:', error);
      toastStore.error('Failed to load initial data');
    }
  }

  async function loadDeploymentsForNamespace(namespaceName: string) {
    try {
      const deploymentList = await k8sAPI.getDeployments(namespaceName);
      deployments = deploymentList;
    } catch (error) {
      logger.error('Failed to load deployments:', error);
      deployments = [];
    }
  }

  async function loadPodsForNamespace(namespaceName: string) {
    try {
      const podList = await k8sAPI.getPods(namespaceName);
      pods = podList;
    } catch (error) {
      logger.error('Failed to load pods:', error);
      pods = [];
    }
  }

  async function loadLogs() {
    if (!currentNamespace) return;
    
    try {
      logsLoading = true;
      
      // Prepare filter options
      const filterOptions: {
        deployments?: string[];
        pods?: string[];
        tail?: number;
        startTime?: string | null;
        endTime?: string | null;
      } = {
        tail: logCount
      };
      
      // Add deployment filter if deployments are selected
      if (selectedDeployments.length > 0) {
        filterOptions.deployments = selectedDeployments;
      }
      
      // Add pod filter if pods are selected
      if (selectedPods.length > 0) {
        filterOptions.pods = selectedPods;
      }

      // Add time filters
      if (startTime) {
        filterOptions.startTime = startTime;
      }
      if (endTime) {
        filterOptions.endTime = endTime;
      }
      
      const logData = await k8sAPI.getNamespaceLogs(currentNamespace, filterOptions);
      logs = logData;
      
      // Show toast if no logs found
      if (logData.length === 0) {
        const filterInfo = [];
        if (selectedDeployments.length > 0) filterInfo.push(`deployments: ${selectedDeployments.join(', ')}`);
        if (selectedPods.length > 0) filterInfo.push(`pods: ${selectedPods.join(', ')}`);
        if (searchQuery) filterInfo.push(`search: "${searchQuery}"`);
        if (severityFilter) filterInfo.push(`severity: ${severityFilter}`);
        if (traceIdFilter) filterInfo.push(`trace ID: ${traceIdFilter}`);
        
        const filterText = filterInfo.length > 0 ? ` with filters: ${filterInfo.join(', ')}` : '';
        toastStore.warning(`No logs found in namespace "${currentNamespace}"${filterText}`);
      }
    } catch (error) {
      logger.error('Failed to load logs:', error);
      toastStore.error(`Failed to load logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      logsLoading = false;
    }
  }

  // Event handlers
  function handleDeploymentsChange(event: CustomEvent<{deployments: string[]}>) {
    selectedDeployments = event.detail.deployments;
    loadLogs();
  }

  function handlePodsChange(event: CustomEvent<{pods: string[]}>) {
    selectedPods = event.detail.pods;
    loadLogs();
  }

  function handleSearch() {
    loadLogs();
  }

  function handleSeverityChange(event: CustomEvent<{severity: string}>) {
    severityFilter = event.detail.severity;
  }

  function handleTraceIdChange(event: CustomEvent<{traceId: string}>) {
    traceIdFilter = event.detail.traceId;
  }

  function handleModeChange(event: CustomEvent<{isLiveMode: boolean, isStaticMode: boolean}>) {
    isLiveMode = event.detail.isLiveMode;
    isStaticMode = event.detail.isStaticMode;
    
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

  function handleTimeChange(event: CustomEvent<{startTime: string | null, endTime: string | null}>) {
    startTime = event.detail.startTime;
    endTime = event.detail.endTime;
    loadLogs();
  }

  function handlePinStartTime() {
    // This will be handled by the LogsDisplay component when a log is selected
    onPinStartTime?.();
  }

  function handlePinEndTime() {
    // This will be handled by the LogsDisplay component when a log is selected
    onPinEndTime?.();
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
</script>

<div class="flex-1 flex flex-col min-h-0 h-screen overflow-hidden">
  <!-- Header -->
  <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-slate-900 dark:text-white">
            {title}
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 p-6 overflow-hidden">
    <div class="w-full h-full flex flex-col overflow-hidden">
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
        <!-- Namespace Filter Label -->
        {#if showNamespaceLabel}
          <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              <span class="text-sm font-medium text-blue-800 dark:text-blue-200">
                Filtered by namespace: <span class="font-semibold">{currentNamespace}</span>
              </span>
            </div>
          </div>
        {/if}

        <!-- Search Panel -->
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
          on:search={handleSearch}
          on:severityChange={handleSeverityChange}
          on:traceIdChange={handleTraceIdChange}
          on:timeChange={handleTimeChange}
          on:pinStartTime={handlePinStartTime}
          on:pinEndTime={handlePinEndTime}
          on:modeChange={handleModeChange}
        />

        <!-- Logs Display -->
        <LogsDisplay
          {logs}
          {logsLoading}
          isConnected={$connectionState.isConnected}
          {logCount}
          {sortOrder}
          {traceIdFilter}
          {severityFilter}
          namespace={currentNamespace}
          on:logCountChange={handleLogCountChange}
          on:sortOrderChange={handleSortOrderChange}
          on:traceIdChange={handleTraceIdChange}
          on:deploymentFilter={handleDeploymentFilter}
          on:severityChange={handleSeverityChange}
        />
      {/if}
    </div>
  </main>
</div>
