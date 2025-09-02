<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from "$lib/components/ui/button.svelte";
  import NamespaceSelector from "$lib/components/NamespaceSelector.svelte";
  import DeploymentSelector from "./DeploymentSelector.svelte";
  import PodSelector from "./PodSelector.svelte";
import SeveritySelector from "./SeveritySelector.svelte";
import TimeFilter from "./TimeFilter.svelte";
  import type { K8sNamespace, K8sDeployment, K8sPod } from "$lib/types/k8s";
  
  const { namespaces = [], deployments = [], pods = [], selectedNamespace: initialSelectedNamespace = "", selectedDeployments: initialSelectedDeployments = [], selectedPods: initialSelectedPods = [], searchQuery: initialSearchQuery = "", severityFilter: initialSeverityFilter = "", traceIdFilter: initialTraceIdFilter = "", startTime: initialStartTime = null, endTime: initialEndTime = null, pinnedStartLog = null, pinnedEndLog = null, isLiveMode: initialIsLiveMode = false, isStaticMode: initialIsStaticMode = true, logsLoading = false, isConnected = false } = $props<{namespaces?: K8sNamespace[] ; deployments?: K8sDeployment[] ; pods?: K8sPod[] ; selectedNamespace?: string ; selectedDeployments?: string[] ; selectedPods?: string[] ; searchQuery?: string ; severityFilter?: string ; traceIdFilter?: string ; startTime?: string | null ; endTime?: string | null ; pinnedStartLog?: string | null ; pinnedEndLog?: string | null ; isLiveMode?: boolean ; isStaticMode?: boolean ; logsLoading?: boolean ; isConnected?: boolean  }>();

  let selectedNamespace = $state(initialSelectedNamespace);
  let selectedDeployments = $state(initialSelectedDeployments);
  let selectedPods = $state(initialSelectedPods);
  let searchQuery = $state(initialSearchQuery);
  let severityFilter = $state(initialSeverityFilter);
  let traceIdFilter = $state(initialTraceIdFilter);
  let startTime = $state(initialStartTime);
  let endTime = $state(initialEndTime);
  let isLiveMode = $state(initialIsLiveMode);
  let isStaticMode = $state(initialIsStaticMode);
  
  const dispatch = createEventDispatcher();
  
  // Removed handleNamespaceChange since we don't have namespace selector anymore
  
  function handleDeploymentsChange(event: CustomEvent<{deployments: string[]}>) {
    selectedDeployments = event.detail.deployments;
    dispatch('deploymentsChange', { deployments: selectedDeployments });
  }
  
  function handlePodsChange(event: CustomEvent<{pods: string[]}>) {
    selectedPods = event.detail.pods;
    dispatch('podsChange', { pods: selectedPods });
  }
  
  function handleSearch() {
    dispatch('search');
  }
  
  function handleSeverityChange(data: {severity: string}) {
    severityFilter = data.severity;
    dispatch('severityChange', { severity: severityFilter });
  }
  
  function handleTraceIdChange() {
    dispatch('traceIdChange', { traceId: traceIdFilter });
  }
  
  function clearTraceIdFilter() {
    traceIdFilter = "";
    dispatch('traceIdChange', { traceId: "" });
  }

  function clearDeploymentFilter(deploymentName: string) {
    selectedDeployments = selectedDeployments.filter((d: string) => d !== deploymentName);
    dispatch('deploymentsChange', { deployments: selectedDeployments });
  }

  function clearAllDeploymentFilters() {
    selectedDeployments = [];
    dispatch('deploymentsChange', { deployments: [] });
  }
  
  function toggleLiveMode() {
    isLiveMode = !isLiveMode;
    isStaticMode = !isLiveMode;
    dispatch('modeChange', { isLiveMode, isStaticMode });
  }
  
  function toggleStaticMode() {
    isStaticMode = !isStaticMode;
    isLiveMode = !isStaticMode;
    dispatch('modeChange', { isLiveMode, isStaticMode });
  }

  function handleTimeChange(event: CustomEvent<{startTime: string | null, endTime: string | null}>) {
    startTime = event.detail.startTime;
    endTime = event.detail.endTime;
    dispatch('timeChange', { startTime, endTime });
  }

  function handlePinStartTime() {
    dispatch('pinStartTime');
  }

  function handlePinEndTime() {
    dispatch('pinEndTime');
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
  <div class="space-y-4">
    <!-- Header with Icon -->
    <div class="flex items-center space-x-2 mb-3">
      <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"></path>
      </svg>
      <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Log Filters</h3>
    </div>

    <!-- Deployment, Pod, and Severity Selectors - Vertical Stack -->
    {#if isConnected}
      <div class="space-y-3">
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <div class="flex-1">
            <DeploymentSelector
              {deployments}
              {selectedDeployments}
              disabled={!isConnected}
              on:deploymentsChange={handleDeploymentsChange}
            />
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          <div class="flex-1">
            <PodSelector
              {pods}
              {selectedPods}
              disabled={!isConnected}
              on:podsChange={handlePodsChange}
            />
          </div>
        </div>
        
        <!-- Severity Filter with Icon -->
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <div class="flex-1">
            <SeveritySelector
              severityFilter={severityFilter}
              disabled={!isConnected}
              onSeverityChange={handleSeverityChange}
            />
          </div>
        </div>

        <!-- Time Filter -->
        <TimeFilter
          {startTime}
          {endTime}
          {pinnedStartLog}
          {pinnedEndLog}
          disabled={!isConnected}
          on:timeChange={handleTimeChange}
          on:pinStartTime={handlePinStartTime}
          on:pinEndTime={handlePinEndTime}
        />
      </div>
    {/if}
    
    <!-- Trace ID Filter -->
    <div class="space-y-2">
      <div class="flex items-center space-x-2">
        <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
        </svg>
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Trace ID:</span>
      </div>
      <input
        id="traceId"
        type="text"
        bind:value={traceIdFilter}
        placeholder="Enter trace ID to filter logs..."
        class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        onkeydown={(e) => e.key === 'Enter' && handleSearch()}
        disabled={!isConnected}
      />
    </div>
  </div>
</div>
