<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { k8sAPI, type K8sDeployment, type K8sPod } from '$lib/api/k8s';
  import { appStore, connectionState, namespaceState } from '$lib/stores/app-store';
  import { toastStore } from '$lib/stores/toast-store';
  import Button from "$lib/components/ui/button.svelte";
  import WorkloadTabs from "$lib/components/WorkloadTabs.svelte";
  import Table from "$lib/components/ui/table.svelte";
  import TableHeader from "$lib/components/ui/table-header.svelte";
  import TableBody from "$lib/components/ui/table-body.svelte";
  import TableRow from "$lib/components/ui/table-row.svelte";
  import TableHead from "$lib/components/ui/table-head.svelte";
  import TableCell from "$lib/components/ui/table-cell.svelte";

  // Get deployment name from URL params
  let deploymentName = $state($page.params.deployment || '');
  
  // Local state
  let deployment = $state<K8sDeployment | null>(null);
  let pods = $state<K8sPod[]>([]);
  let isLoading = $state(false);
  let activeTab = $state('overview');
  let showDeleteConfirm = $state(false);
  let showScaleDialog = $state(false);
  let scaleReplicas = $state(1);

  // Use reactive effects to watch for changes
  $effect(() => {
    if (deploymentName && $namespaceState.selected) {
      loadDeploymentDetails();
    }
  });

  onMount(() => {
    if (deploymentName && $namespaceState.selected) {
      loadDeploymentDetails();
    }
  });

  async function loadDeploymentDetails() {
    if (!deploymentName || !$namespaceState.selected) return;
    
    try {
      isLoading = true;
      const deployments = await k8sAPI.getDeployments($namespaceState.selected);
      const foundDeployment = deployments.find(d => d.name === deploymentName);
      
      if (foundDeployment) {
        deployment = foundDeployment;
        // Load pods for this deployment
        await loadDeploymentPods();
      } else {
        toastStore.error(`Deployment ${deploymentName} not found`);
      }
    } catch (error) {
      console.error('Failed to load deployment details:', error);
      toastStore.error(`Failed to load deployment details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isLoading = false;
    }
  }

  async function loadDeploymentPods() {
    if (!deploymentName || !$namespaceState.selected) return;
    
    try {
      const allPods = await k8sAPI.getPods($namespaceState.selected);
      // Filter pods that belong to this deployment
      pods = allPods.filter(pod => {
        const podNameParts = pod.name.split('-');
        
        // Check if pod belongs to this deployment
        // Common pattern: deployment-name-replicaset-hash-pod-id
        if (podNameParts.length >= 3) {
          const podDeploymentName = podNameParts.slice(0, -2).join('-');
          return podDeploymentName === deploymentName;
        } else if (podNameParts.length >= 2) {
          const podDeploymentName = podNameParts.slice(0, -1).join('-');
          return podDeploymentName === deploymentName;
        }
        
        return false;
      });
    } catch (error) {
      console.error('Failed to load deployment pods:', error);
      pods = [];
    }
  }

  async function deleteDeployment() {
    if (!deployment) return;
    
    try {
      // TODO: Implement deployment deletion when API is available
      toastStore.success(`Deployment ${deployment.name} deleted successfully`);
      // Navigate back to deployments list
      window.history.back();
    } catch (error) {
      console.error('Failed to delete deployment:', error);
      toastStore.error(`Failed to delete deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function restartDeployment() {
    if (!deployment) return;
    
    try {
      // TODO: Implement deployment restart when API is available
      toastStore.success(`Deployment ${deployment.name} restarted successfully`);
      await loadDeploymentDetails(); // Refresh deployment details
    } catch (error) {
      console.error('Failed to restart deployment:', error);
      toastStore.error(`Failed to restart deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function scaleDeployment() {
    if (!deployment) return;
    
    try {
      await k8sAPI.scaleDeployment($namespaceState.selected, deployment.name, scaleReplicas);
      toastStore.success(`Deployment scaled to ${scaleReplicas} replicas`);
      showScaleDialog = false;
      await loadDeploymentDetails(); // Refresh deployment details
    } catch (error) {
      console.error('Failed to scale deployment:', error);
      toastStore.error(`Failed to scale deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'updating':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getPodStatusColor(status: string): string {
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

  function getPodEffectiveStatus(pod: K8sPod): { status: string; color: string; indicatorColor: string } {
    // Parse ready value (e.g., "0/1", "1/1", "2/3")
    const readyParts = pod.ready.split('/');
    const readyCount = parseInt(readyParts[0]);
    const totalCount = parseInt(readyParts[1]);
    
    // If pod is "Running" but not ready (0 containers ready), this indicates a problem
    // - likely image issues, configuration problems, or application crashes
    if (pod.status.toLowerCase() === 'running' && readyCount === 0) {
      return {
        status: 'Container Not Ready',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        indicatorColor: 'bg-red-500'
      };
    }
    
    // If pod is not ready (0 containers ready) and not running, show as "Not Ready"
    if (readyCount === 0) {
      return {
        status: 'Not Ready',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        indicatorColor: 'bg-yellow-500'
      };
    }
    
    // If some containers are ready but not all, show as "Partially Ready"
    if (readyCount > 0 && readyCount < totalCount) {
      return {
        status: 'Partially Ready',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        indicatorColor: 'bg-orange-500'
      };
    }
    
    // If all containers are ready, use the original status logic
    switch (pod.status.toLowerCase()) {
      case 'running':
        return {
          status: 'Running',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          indicatorColor: 'bg-green-500'
        };
      case 'pending':
        return {
          status: 'Pending',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          indicatorColor: 'bg-yellow-500'
        };
      case 'failed':
      case 'error':
      case 'crashloopbackoff':
        return {
          status: pod.status,
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          indicatorColor: 'bg-red-500'
        };
      default:
        return {
          status: pod.status,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          indicatorColor: 'bg-gray-500'
        };
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

  function handleViewPod(pod: K8sPod) {
    // Navigate to pod details page
    window.location.href = `/workloads/pods/${encodeURIComponent(pod.name)}`;
  }

  function handleViewLogs(pod: K8sPod) {
    // Navigate to logs page with pod filter
    window.location.href = `/logs?pod=${encodeURIComponent(pod.name)}`;
  }

  function handleCopyPodName(pod: K8sPod) {
    navigator.clipboard.writeText(pod.name).then(() => {
      toastStore.success(`Copied pod name: ${pod.name}`);
    }).catch(err => {
      console.error('Failed to copy pod name:', err);
      toastStore.error('Failed to copy pod name');
    });
  }
</script>

<div class="flex-1 flex flex-col min-h-0">
  <!-- Header -->
  <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Button onclick={() => window.history.back()}
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
              {deploymentName}
            </h1>
            {#if $namespaceState.selected}
              <p class="text-sm text-slate-500 dark:text-slate-400">
                in {$namespaceState.selected}
              </p>
            {/if}
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <Button onclick={loadDeploymentDetails}
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
          
          <Button onclick={() => restartDeployment()}
            variant="outline"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Restart
          </Button>
          
          <Button onclick={() => showScaleDialog = true}
            variant="outline"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
            </svg>
            Scale
          </Button>
          
          <Button onclick={() => showDeleteConfirm = true}
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
            Connect to a Kubernetes cluster to view deployment details
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
          <p class="text-slate-500 dark:text-slate-400">Loading deployment details...</p>
        </div>
      {:else if !deployment}
        <div class="text-center py-12">
          <div class="text-slate-400 dark:text-slate-500 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Deployment Not Found
          </h3>
          <p class="text-slate-500 dark:text-slate-400">
            The deployment "{deploymentName}" was not found in namespace "{$namespaceState.selected}"
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
            <!-- Deployment Status Card -->
            <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Deployment Status</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Status</div>
                  <div class="mt-1">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(deployment.status)}">
                      {deployment.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Replicas</div>
                  <p class="mt-1 text-sm text-slate-900 dark:text-white">{deployment.ready}/{deployment.replicas}</p>
                </div>
                <div>
                  <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Available</div>
                  <p class="mt-1 text-sm text-slate-900 dark:text-white">{deployment.available}</p>
                </div>
                <div>
                  <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Updated</div>
                  <p class="mt-1 text-sm text-slate-900 dark:text-white">{deployment.updated}</p>
                </div>
                <div>
                  <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Age</div>
                  <p class="mt-1 text-sm text-slate-900 dark:text-white">{deployment.age}</p>
                </div>
                <div>
                  <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Strategy</div>
                  <p class="mt-1 text-sm text-slate-900 dark:text-white">{deployment.strategy}</p>
                </div>
              </div>
            </div>

            <!-- Image Information -->
            <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Container Image</h3>
              <div class="flex items-center justify-between">
                                 <div class="flex-1">
                   <p class="text-sm font-mono text-slate-900 dark:text-white break-all">{deployment?.image || ''}</p>
                 </div>
                                 <Button onclick={() => copyToClipboard(deployment?.image || '')}
                   variant="outline"
                   size="sm"
                 >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Copy
                </Button>
              </div>
            </div>

                         <!-- Quick Actions -->
             <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
               <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
               <div class="flex flex-wrap gap-3">
                 <Button onclick={() => activeTab = 'yaml'} variant="outline">
                   <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                   </svg>
                   View YAML
                 </Button>
                 
                 <Button onclick={() => restartDeployment()} variant="outline">
                   <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                   </svg>
                   Restart Deployment
                 </Button>
                 
                 <Button onclick={() => showScaleDialog = true} variant="outline">
                   <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                   </svg>
                   Scale Deployment
                 </Button>
               </div>
             </div>

             <!-- Pods Table -->
             <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
               <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                 <div class="flex items-center justify-between">
                   <div>
                     <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                       Pods for Deployment: {deployment.name} ({pods.length})
                     </h3>
                     <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                       Pods managed by this deployment
                     </p>
                   </div>
                 </div>
               </div>

               {#if pods.length === 0}
                 <div class="p-6 text-center">
                   <div class="text-slate-400 dark:text-slate-500 mb-4">
                     <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                     </svg>
                   </div>
                   <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">No Pods Found</h3>
                   <p class="text-slate-500 dark:text-slate-400">
                     No pods found for deployment "{deployment.name}"
                   </p>
                 </div>
               {:else}
                 <div class="overflow-x-auto">
                   <Table className="w-full min-w-full">
                     <TableHeader>
                       <TableRow className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                         <TableHead className="w-1/3 font-semibold text-slate-700 dark:text-slate-300">Name</TableHead>
                         <TableHead className="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                         <TableHead className="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Ready</TableHead>
                         <TableHead className="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Restarts</TableHead>
                         <TableHead className="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Age</TableHead>
                         <TableHead className="w-1/6 font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {#each pods as pod (pod.name)}
                         <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700">
                           {@const effectiveStatus = getPodEffectiveStatus(pod)}
                           <TableCell className="font-medium truncate">
                             <div class="flex items-center space-x-2">
                               <div class="w-2 h-2 rounded-full {effectiveStatus.indicatorColor}"></div>
                               <span class="text-slate-900 dark:text-white">{pod.name}</span>
                             </div>
                           </TableCell>
                           <TableCell>
                             <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium {effectiveStatus.color} shadow-sm">
                               {effectiveStatus.status}
                             </span>
                           </TableCell>
                           <TableCell className="text-slate-600 dark:text-slate-400">
                             <span class="font-mono text-sm">{pod.ready}</span>
                           </TableCell>
                           <TableCell className="text-slate-600 dark:text-slate-400">
                             <span class="font-mono text-sm">{pod.restarts}</span>
                           </TableCell>
                           <TableCell className="text-slate-600 dark:text-slate-400">
                             <span class="font-mono text-sm">{pod.age}</span>
                           </TableCell>
                           <TableCell>
                             <div class="flex items-center space-x-1">
                               <button 
                                 onclick={() => handleViewPod(pod)}
                                 class="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                                 title="View Pod Details"
                                 aria-label="View Pod Details"
                               >
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                 </svg>
                               </button>
                               <button 
                                 onclick={() => handleViewLogs(pod)}
                                 class="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                                 title="View Pod Logs"
                                 aria-label="View Pod Logs"
                               >
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                 </svg>
                               </button>
                               <button 
                                 onclick={() => handleCopyPodName(pod)}
                                 class="p-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:scale-105"
                                 title="Copy Pod Name"
                                 aria-label="Copy Pod Name"
                               >
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 0 002 2z"></path>
                                 </svg>
                               </button>
                             </div>
                           </TableCell>
                         </TableRow>
                       {/each}
                     </TableBody>
                   </Table>
                 </div>
               {/if}
             </div>
          </div>
        
        {:else if activeTab === 'yaml' && deployment}
          <!-- YAML Tab -->
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Deployment YAML</h3>
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
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {deployment.name}
  namespace: {deployment.namespace}
spec:
  replicas: {deployment.replicas}
  strategy:
    type: {deployment.strategy}
  selector:
    matchLabels:
      app: {deployment.name}
  template:
    metadata:
      labels:
        app: {deployment.name}
    spec:
      containers:
      - name: {deployment.name}
        image: {deployment.image}
status:
  replicas: {deployment.replicas}
  readyReplicas: {deployment.ready}
  availableReplicas: {deployment.available}
  updatedReplicas: {deployment.updated}
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
        Delete Deployment
      </h3>
      <p class="text-slate-600 dark:text-slate-400 mb-6">
        Are you sure you want to delete the deployment "{deploymentName}"? This action cannot be undone.
      </p>
      <div class="flex justify-end space-x-3">
        <Button onclick={() => showDeleteConfirm = false} variant="outline">
          Cancel
        </Button>
        <Button onclick={() => { deleteDeployment(); showDeleteConfirm = false; }} variant="destructive">
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
        <label for="scale-replicas" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Number of Replicas
        </label>
        <input
          id="scale-replicas"
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
