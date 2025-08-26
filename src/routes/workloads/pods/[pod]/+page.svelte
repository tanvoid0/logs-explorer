<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { k8sAPI, type K8sPod, type K8sDeployment } from '$lib/api/k8s';
  import { appStore, connectionState, namespaceState } from '$lib/stores/app-store';
  import { toastStore } from '$lib/stores/toast-store';
  import Button from "$lib/components/ui/button.svelte";
  import LogsDisplay from "$lib/components/LogsDisplay.svelte";
  import LogsSearchPanel from "$lib/components/LogsSearchPanel.svelte";
  import LogsViewerContent from "$lib/components/LogsViewerContent.svelte";
  import Table from "$lib/components/ui/table.svelte";
  import TableHeader from "$lib/components/ui/table-header.svelte";
  import TableBody from "$lib/components/ui/table-body.svelte";
  import TableRow from "$lib/components/ui/table-row.svelte";
  import TableHead from "$lib/components/ui/table-head.svelte";
  import TableCell from "$lib/components/ui/table-cell.svelte";
  import type { K8sLog } from '$lib/types/k8s';

  // Get pod name from URL params
  let podName = $state($page.params.pod || '');
  
  // Local state
  let pod = $state<K8sPod | null>(null);
  let isLoading = $state(false);
  let activeTab = $state('overview');
  let showDeleteConfirm = $state(false);
  let showScaleDialog = $state(false);
  let scaleReplicas = $state(1);
  let availableContainers = $state<string[]>([]);
  let selectedContainer = $state('');

  // Logs state for advanced components
  let logs = $state<K8sLog[]>([]);
  let logsLoading = $state(false);
  let searchQuery = $state('');
  let severityFilter = $state('');
  let traceIdFilter = $state('');
  let startTime = $state<string | null>(null);
  let endTime = $state<string | null>(null);
  let isLiveMode = $state(false);
  let isStaticMode = $state(true);
  let logCount = $state(100);
  let sortOrder = $state<'newest' | 'oldest'>('newest');
  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Deployments state for logs search panel
  let deployments = $state<K8sDeployment[]>([]);
  let selectedDeployments = $state<string[]>([]);

  // Namespaces state for logs search panel
  let namespaces = $state<{name: string, status: string, age: string}[]>([]);

  // Use reactive effects to watch for changes
  $effect(() => {
    if (podName && $namespaceState.selected) {
      loadPodDetails();
    }
  });

  onMount(() => {
    if (podName && $namespaceState.selected) {
      loadPodDetails();
    }
  });

  async function loadPodDetails() {
    if (!podName || !$namespaceState.selected) return;
    
    try {
      isLoading = true;
      const pods = await k8sAPI.getPods($namespaceState.selected);
      const foundPod = pods.find(p => p.name === podName);
      
      if (foundPod) {
        pod = foundPod;
        // Load available containers for this pod
        await loadPodContainers();
        // Load deployments for the namespace
        await loadDeployments();
        // Load namespaces for the namespace
        await loadNamespaces();
        // Load initial logs
        await loadPodLogs();
      } else {
        toastStore.error(`Pod ${podName} not found`);
      }
    } catch (error) {
      console.error('Failed to load pod details:', error);
      toastStore.error(`Failed to load pod details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isLoading = false;
    }
  }

  async function loadPodContainers() {
    if (!podName || !$namespaceState.selected) return;
    
    try {
      const containers = await k8sAPI.getPodContainers($namespaceState.selected, podName);
      availableContainers = containers;
      // Auto-select first container if available
      if (containers.length > 0 && !selectedContainer) {
        selectedContainer = containers[0];
      }
    } catch (error) {
      console.error('Failed to load pod containers:', error);
      // Don't show error toast for this as it's not critical
    }
  }

  async function loadDeployments() {
    if (!$namespaceState.selected) return;
    
    try {
      const deploymentList = await k8sAPI.getDeployments($namespaceState.selected);
      deployments = deploymentList;
    } catch (error) {
      console.error('Failed to load deployments:', error);
      deployments = [];
    }
  }

  async function loadNamespaces() {
    try {
      const namespaceList = await k8sAPI.getNamespaces();
      namespaces = namespaceList;
    } catch (error) {
      console.error('Failed to load namespaces:', error);
      namespaces = [];
    }
  }

  async function loadPodLogs() {
    if (!podName || !$namespaceState.selected) return;
    
    try {
      logsLoading = true;
      const logData = await k8sAPI.getLogs($namespaceState.selected, podName, {
        container: selectedContainer || undefined,
        tail: logCount,
        startTime: startTime || undefined,
        endTime: endTime || undefined
      });
      logs = logData;
    } catch (error) {
      console.error('Failed to load pod logs:', error);
      toastStore.error(`Failed to load logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      logsLoading = false;
    }
  }

  // Event handlers for LogsDisplay and LogsSearchPanel
  function handleLogCountChange(event: CustomEvent<{count: number}>) {
    logCount = event.detail.count;
    loadPodLogs();
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

  function handleModeChange(event: CustomEvent<{isLiveMode: boolean, isStaticMode: boolean}>) {
    isLiveMode = event.detail.isLiveMode;
    isStaticMode = event.detail.isStaticMode;
    
    if (isLiveMode) {
      refreshInterval = setInterval(() => {
        if ($connectionState.isConnected) {
          loadPodLogs();
        }
      }, 5000);
      loadPodLogs();
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    }
  }

  function handleSearch() {
    loadPodLogs();
  }

  function handleSeverityChange(event: CustomEvent<{severity: string}>) {
    severityFilter = event.detail.severity;
  }

  function handleTraceIdChange(event: CustomEvent<{traceId: string}>) {
    traceIdFilter = event.detail.traceId;
  }

  function handleTimeChange(event: CustomEvent<{startTime: string | null, endTime: string | null}>) {
    startTime = event.detail.startTime;
    endTime = event.detail.endTime;
    loadPodLogs();
  }

  function handleDeploymentFilter(event: CustomEvent<{deploymentName: string}>) {
    const deploymentName = event.detail.deploymentName;
    if (!selectedDeployments.includes(deploymentName)) {
      selectedDeployments = [...selectedDeployments, deploymentName];
    }
  }

  function handleDeploymentsChange(event: CustomEvent<{deployments: string[]}>) {
    selectedDeployments = event.detail.deployments;
  }

  function handleNamespaceChange(event: CustomEvent<{namespace: string}>) {
    // Not applicable for pod-specific logs since we're already in a specific pod
  }

  async function deletePod() {
    if (!pod) return;
    
    try {
      await k8sAPI.deletePod($namespaceState.selected, pod.name);
      toastStore.success(`Pod ${pod.name} deleted successfully`);
      // Navigate back to pods list
      window.history.back();
    } catch (error) {
      console.error('Failed to delete pod:', error);
      toastStore.error(`Failed to delete pod: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function restartPod() {
    if (!pod) return;
    
    try {
      await k8sAPI.restartPod($namespaceState.selected, pod.name);
      toastStore.success(`Pod ${pod.name} restarted successfully`);
      await loadPodDetails(); // Refresh pod details
    } catch (error) {
      console.error('Failed to restart pod:', error);
      toastStore.error(`Failed to restart pod: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function scaleDeployment() {
    if (!pod) return;
    
    try {
      // TODO: Implement deployment scaling via k8sAPI
      await k8sAPI.scaleDeployment($namespaceState.selected, pod.name, scaleReplicas);
      toastStore.success(`Deployment scaled to ${scaleReplicas} replicas`);
      showScaleDialog = false;
      await loadPodDetails(); // Refresh pod details
    } catch (error) {
      console.error('Failed to scale deployment:', error);
      toastStore.error(`Failed to scale deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
      case 'error':
      case 'crashloopbackoff':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toastStore.success('Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
      toastStore.error('Failed to copy to clipboard');
    });
  }

  // Extract deployment name from pod name
  function extractDeploymentName(podName: string): string | null {
    if (!podName) return null;
    
    // Common Kubernetes pod naming patterns:
    // - deployment-name-replicaset-hash-pod-id (e.g., myapp-abc123def4-xyz9w)
    // - deployment-name-pod-id (e.g., myapp-xyz9w)
    const parts = podName.split('-');
    
    if (parts.length >= 3) {
      // Remove replicaset hash and pod id to get deployment name
      const deploymentPart = parts.slice(0, -2).join('-');
      if (deploymentPart) {
        return deploymentPart;
      }
    } else if (parts.length >= 2) {
      // Fallback: just remove the last part (pod id)
      return parts.slice(0, -1).join('-');
    }
    
    return null;
  }

  // Auto-add deployment filter when opening logs tab
  function autoAddDeploymentFilter() {
    if (!pod?.name) return;
    
    const deploymentName = extractDeploymentName(pod.name);
    if (deploymentName && !selectedDeployments.includes(deploymentName)) {
      selectedDeployments = [...selectedDeployments, deploymentName];
    }
  }
</script>

<div class="flex-1 flex flex-col min-h-0">
  <!-- Header -->
  <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Button 
            onclick={() => window.history.back()}
            variant="outline"
            size="sm"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back
          </Button>
          
          <div>
            <h1 class="text-xl font-semibold text-slate-900 dark:text-white">
              {podName}
            </h1>
            {#if $namespaceState.selected}
              <p class="text-sm text-slate-500 dark:text-slate-400">
                in {$namespaceState.selected}
              </p>
            {/if}
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <Button 
            onclick={loadPodDetails}
            disabled={isLoading}
            variant="outline"
          >
            {#if isLoading}
              <svg class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            {:else}
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh
            {/if}
          </Button>
          
          <Button 
            onclick={() => restartPod()}
            variant="outline"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Restart
          </Button>
          
          <Button 
            onclick={() => showScaleDialog = true}
            variant="outline"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
            </svg>
            Scale
          </Button>
          
          <Button 
            onclick={() => showDeleteConfirm = true}
            variant="destructive"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete
          </Button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto p-6">
    <div class="w-full">
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
            Connect to a Kubernetes cluster to view pod details
          </p>
          <Button onclick={() => appStore.connect()}>
            Connect to Kubernetes
          </Button>
        </div>
      {:else if isLoading}
        <div class="text-center py-12">
          <div class="text-slate-400 dark:text-slate-500 mb-4">
            <svg class="mx-auto h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p class="text-slate-500 dark:text-slate-400">Loading pod details...</p>
        </div>
      {:else if !pod}
        <div class="text-center py-12">
          <div class="text-slate-400 dark:text-slate-500 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Pod Not Found
          </h3>
          <p class="text-slate-500 dark:text-slate-400">
            The pod "{podName}" was not found in namespace "{$namespaceState.selected}"
          </p>
        </div>
      {:else}
        <!-- Tabs -->
        <div class="mb-6">
          <nav class="flex space-x-8">
            <button
              onclick={() => activeTab = 'overview'}
              class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
            >
              Overview
            </button>
            <button
              onclick={() => activeTab = 'yaml'}
              class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'yaml' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
            >
              YAML
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        {#if activeTab === 'overview'}
          <!-- Overview Tab -->
          <div class="space-y-6">
            <!-- Pod Status Card -->
            <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Pod Status</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="text-sm font-medium text-slate-500 dark:text-slate-400">Status</label>
                  <div class="mt-1">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(pod.status)}">
                      {pod.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-500 dark:text-slate-400">Ready</label>
                  <p class="mt-1 text-sm text-slate-900 dark:text-white">{pod.ready}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-500 dark:text-slate-400">Restarts</label>
                  <p class="mt-1 text-sm text-slate-900 dark:text-white">{pod.restarts}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-500 dark:text-slate-400">Age</label>
                  <p class="mt-1 text-sm text-slate-900 dark:text-white">{pod.age}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-500 dark:text-slate-400">Namespace</label>
                  <p class="mt-1 text-sm text-slate-900 dark:text-white">{pod.namespace}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-500 dark:text-slate-400">Name</label>
                  <div class="mt-1 flex items-center space-x-2">
                    <p class="text-sm text-slate-900 dark:text-white">{pod?.name || ''}</p>
                    <button
                      onclick={() => copyToClipboard(pod?.name || '')}
                      class="text-slate-400 hover:text-slate-600"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
              <div class="flex flex-wrap gap-3">
                <Button onclick={() => window.location.href = `/logs?pod=${encodeURIComponent(podName)}`}>
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  View Logs
                </Button>
                
                <Button onclick={() => activeTab = 'yaml'} variant="outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                  </svg>
                  View YAML
                </Button>
                
                <Button onclick={() => restartPod()} variant="outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Restart Pod
                </Button>
                
                <Button onclick={() => showScaleDialog = true} variant="outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                  Scale Deployment
                </Button>
              </div>
            </div>
          </div>
        {:else if activeTab === 'yaml' && pod}
          <!-- YAML Tab -->
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Pod YAML</h3>
              <Button onclick={() => copyToClipboard('YAML content here')} variant="outline" size="sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Copy YAML
              </Button>
            </div>
            <div class="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
              <pre class="text-sm text-slate-900 dark:text-slate-100 overflow-x-auto">
                <code>
apiVersion: v1
kind: Pod
metadata:
  name: {pod.name}
  namespace: {pod.namespace}
spec:
  # Pod specification would go here
status:
  phase: {pod.status}
  # Additional status information
                </code>
              </pre>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </main>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Delete Pod
      </h3>
      <p class="text-slate-600 dark:text-slate-400 mb-6">
        Are you sure you want to delete the pod "{podName}"? This action cannot be undone.
      </p>
      <div class="flex justify-end space-x-3">
        <Button onclick={() => showDeleteConfirm = false} variant="outline">
          Cancel
        </Button>
        <Button onclick={() => { deletePod(); showDeleteConfirm = false; }} variant="destructive">
          Delete
        </Button>
      </div>
    </div>
  </div>
{/if}

<!-- Scale Dialog -->
{#if showScaleDialog}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Scale Deployment
      </h3>
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Number of Replicas
        </label>
        <input
          type="number"
          bind:value={scaleReplicas}
          min="0"
          max="100"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div class="flex justify-end space-x-3">
        <Button onclick={() => showScaleDialog = false} variant="outline">
          Cancel
        </Button>
        <Button onclick={() => { scaleDeployment(); showScaleDialog = false; }}>
          Scale
        </Button>
      </div>
    </div>
  </div>
{/if}
