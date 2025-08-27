<script lang="ts">
  import { onMount } from "svelte";
  import { k8sAPI, type K8sNamespace, type K8sDeployment, type K8sPod } from "$lib/api/k8s";
  import { appStore, connectionState, namespaceState } from '$lib/stores/app-store';
  import Toast from "$lib/components/Toast.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import WorkloadTabs from "$lib/components/WorkloadTabs.svelte";
  import Table from "$lib/components/ui/table.svelte";
  import TableHeader from "$lib/components/ui/table-header.svelte";
  import TableBody from "$lib/components/ui/table-body.svelte";
  import TableRow from "$lib/components/ui/table-row.svelte";
  import TableHead from "$lib/components/ui/table-head.svelte";
  import TableCell from "$lib/components/ui/table-cell.svelte";

  // State
  let namespaces = $state<K8sNamespace[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state("");
  let statusFilter = $state("");

  // Use live data from store (with fallback to manual loading)
  let deployments = $state<K8sDeployment[]>([]);
  let pods = $state<K8sPod[]>([]);

  // Toast notifications
  let toastMessage = $state("");
  let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');
  let showToast = $state(false);

  // Computed values
  let filteredDeployments = $derived(
    deployments.filter(deployment => {
      const matchesSearch = !searchQuery || 
        deployment.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || deployment.status === statusFilter;
      
      // Filter by current namespace from sidebar
      const matchesNamespace = !$namespaceState.selected || deployment.namespace === $namespaceState.selected;
      
      return matchesSearch && matchesStatus && matchesNamespace;
    })
  );

  let deploymentStatuses = $derived(
    Array.from(new Set(deployments.map(d => d.status)))
  );

  function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    toastMessage = message;
    toastType = type;
    showToast = true;
  }

  function clearFilters() {
    searchQuery = "";
    statusFilter = "";
  }

  onMount(async () => {
    await initializeData();
  });

  // Reload data when namespace changes
  $effect(() => {
    if ($namespaceState.selected) {
      loadData();
    }
  });

  async function initializeData() {
    try {
      isLoading = true;
      
      // Check connection status from store
      if (!$connectionState.isConnected) {
        showNotification("Attempting to connect to Kubernetes...", "info");
        const success = await appStore.connect();
        if (success) {
          showNotification("Successfully connected to Kubernetes!", "success");
        } else {
          showNotification("Failed to connect to Kubernetes. Please check your kubeconfig.", "error");
          return;
        }
      }
      
      // Load namespaces (this doesn't need to be live)
      namespaces = await k8sAPI.getNamespaces();
      
      // Load deployments and pods for current namespace
      await loadData();
      
    } catch (error) {
      console.error("Failed to initialize data:", error);
      showNotification(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      isLoading = false;
    }
  }

  async function loadData() {
    try {
      // Load deployments for current namespace
      if ($namespaceState.selected) {
        console.log('[Deployments] Loading deployments for namespace:', $namespaceState.selected);
        try {
          const loadedDeployments = await k8sAPI.getDeployments($namespaceState.selected);
          console.log('[Deployments] Successfully loaded deployments');
          deployments = loadedDeployments;
          
          // Also load pods for the namespace
          try {
            const loadedPods = await k8sAPI.getPods($namespaceState.selected);
            console.log('[Deployments] Successfully loaded pods');
            pods = loadedPods;
          } catch (error) {
            console.error('[Deployments] Failed to load pods:', error);
            pods = [];
          }
        } catch (error) {
          console.error('[Deployments] Failed to load deployments:', error);
          deployments = [];
          pods = [];
        }
      } else {
        console.log('[Deployments] No namespace selected, setting deployments to empty array');
        deployments = [];
        pods = [];
      }
      
      showNotification(`Loaded ${deployments.length} deployments`, "success");
    } catch (error) {
      console.error("Failed to load deployments data:", error);
      showNotification(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'Running': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Updating': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Stopped': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getReplicaStatusColor(ready: number, replicas: number) {
    if (ready === replicas) return 'text-green-600 dark:text-green-400';
    if (ready > 0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  function isDeploymentRunning(deployment: K8sDeployment): boolean {
    // A deployment is only considered running if it has replicas > 0 AND status is 'Running'
    return deployment.status === 'Running' && deployment.replicas > 0;
  }

  async function stopDeployment(name: string) {
    try {
      await k8sAPI.scaleDeployment($namespaceState.selected, name, 0);
      showNotification(`Stopped deployment ${name} (scaled to 0 replicas)`, "success");
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to stop deployment:', error);
      showNotification(`Failed to stop deployment: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  }

  async function startDeployment(name: string) {
    try {
      await k8sAPI.scaleDeployment($namespaceState.selected, name, 1);
      showNotification(`Started deployment ${name} (scaled to 1 replica)`, "success");
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to start deployment:', error);
      showNotification(`Failed to start deployment: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  }



  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showNotification('Failed to copy to clipboard', 'error');
    }
  }

  function truncateImageName(imageName: string, maxLength: number = 30): string {
    if (imageName.length <= maxLength) {
      return imageName;
    }
    
    // Split by '/' to handle registry/repository/image:tag format
    const parts = imageName.split('/');
    
    if (parts.length === 1) {
      // Simple image name, truncate from middle
      const half = Math.floor(maxLength / 2);
      return imageName.substring(0, half - 2) + '...' + imageName.substring(imageName.length - half + 2);
    }
    
    if (parts.length === 2) {
      // repository/image:tag format
      const [repo, image] = parts;
      const tagIndex = image.indexOf(':');
      const imageNameOnly = tagIndex > 0 ? image.substring(0, tagIndex) : image;
      const tag = tagIndex > 0 ? image.substring(tagIndex) : '';
      
      const availableLength = maxLength - tag.length - 3; // 3 for '...'
      if (repo.length + imageNameOnly.length <= availableLength) {
        return imageName;
      }
      
      const repoLength = Math.min(repo.length, Math.floor(availableLength / 2));
      const imageLength = availableLength - repoLength;
      
      return repo.substring(0, repoLength) + '...' + imageNameOnly.substring(0, imageLength) + tag;
    }
    
    if (parts.length >= 3) {
      // registry/repository/image:tag format
      const registry = parts[0];
      const image = parts[parts.length - 1];
      const tagIndex = image.indexOf(':');
      const imageNameOnly = tagIndex > 0 ? image.substring(0, tagIndex) : image;
      const tag = tagIndex > 0 ? image.substring(tagIndex) : '';
      
      const availableLength = maxLength - tag.length - 6; // 6 for '...' and '...'
      if (availableLength <= 0) {
        return imageNameOnly.substring(0, maxLength - 3) + '...' + tag;
      }
      
      const registryLength = Math.min(registry.length, Math.floor(availableLength / 3));
      const imageLength = availableLength - registryLength;
      
      return registry.substring(0, registryLength) + '...' + imageNameOnly.substring(0, imageLength) + tag;
    }
    
    // Fallback: simple middle truncation
    const half = Math.floor(maxLength / 2);
    return imageName.substring(0, half - 2) + '...' + imageName.substring(imageName.length - half + 2);
  }

  function restartDeployment(name: string) {
    // TODO: Implement restart logic
    showNotification(`Restarting deployment ${name}...`, "info");
  }







  function handleViewDeployment(deploymentName: string) {
    // Navigate to deployment details page
    window.location.href = `/workloads/deployments/${encodeURIComponent(deploymentName)}`;
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


</script>

<div class="flex-1 flex flex-col min-h-0">
  <WorkloadTabs />


  <!-- Deployments Content -->
  <div class="flex-1 overflow-y-auto p-6">
    <div class="w-full">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Kubernetes Deployments
        </h1>
        <p class="text-slate-600 dark:text-slate-400">
          Manage and monitor your Kubernetes deployments
          {#if $namespaceState.selected}
            <span class="font-medium">in namespace: {$namespaceState.selected}</span>
          {/if}
        </p>

      </div>



      <!-- Deployments Table -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
          <!-- Header with Title and Stats -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                Deployments ({filteredDeployments.length})
              </h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Application deployments and scaling
              </p>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Running</span>
              </div>
              <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
                <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Updating</span>
              </div>
              <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
                <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Failed</span>
              </div>
            </div>
          </div>

          <!-- Stats Cards Row -->
          <div class="grid grid-cols-4 gap-4 mb-4">
            <div class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
              <div class="flex items-center">
                <div class="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <span class="text-sm">🚀</span>
                </div>
                <div class="ml-2">
                  <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Total</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">
                    {isLoading ? '...' : deployments.length}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
              <div class="flex items-center">
                <div class="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                  <span class="text-sm">✅</span>
                </div>
                <div class="ml-2">
                  <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Running</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">
                    {isLoading ? '...' : deployments.filter(d => isDeploymentRunning(d)).length}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
              <div class="flex items-center">
                <div class="p-1.5 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <span class="text-sm">🔄</span>
                </div>
                <div class="ml-2">
                  <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Updating</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">
                    {isLoading ? '...' : deployments.filter(d => d.status === 'Updating').length}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
              <div class="flex items-center">
                <div class="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <span class="text-sm">📦</span>
                </div>
                <div class="ml-2">
                  <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Pods</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">
                    {isLoading ? '...' : pods.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Search and Filters Row -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Search Input -->
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search deployments..."
                class="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={!$connectionState.isConnected}
              />
            </div>

            <!-- Status Filter -->
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Status:
              </label>
              <select
                bind:value={statusFilter}
                class="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                {#each deploymentStatuses as status}
                  <option value={status}>{status}</option>
                {/each}
              </select>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              {#if searchQuery || statusFilter}
                <Button 
                  onclick={clearFilters}
                  variant="outline"
                  class="px-3 py-1.5 text-sm"
                >
                  Clear Filters
                </Button>
              {/if}
              <span class="text-sm text-slate-500 dark:text-slate-400">
                {filteredDeployments.length} of {deployments.length} deployments
              </span>
              <Button 
                onclick={loadData}
                disabled={isLoading || !$connectionState.isConnected}
                class="px-3 py-1.5 text-sm"
              >
                {#if isLoading}
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                {:else}
                  Refresh
                {/if}
              </Button>
            </div>
          </div>
        </div>

        {#if isLoading}
          <div class="p-6 text-center">
            <div class="flex items-center justify-center space-x-2 text-slate-600 dark:text-slate-400">
              <svg class="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-lg font-medium">Loading deployments...</span>
            </div>
          </div>
        {:else if filteredDeployments.length === 0}
          <div class="p-6 text-center">
            <div class="text-slate-400 dark:text-slate-500 mb-4">
              <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">No deployments found</h3>
            <p class="text-slate-500 dark:text-slate-400">
              {searchQuery || statusFilter ? 'Try adjusting your filters.' : 'No deployments are currently running in this namespace.'}
            </p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <Table class="w-full min-w-full">
              <TableHeader>
                <TableRow class="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableHead class="w-1/4 font-semibold text-slate-700 dark:text-slate-300">Deployment</TableHead>
                  <TableHead class="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                  <TableHead class="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Replicas</TableHead>
                  <TableHead class="w-2/5 font-semibold text-slate-700 dark:text-slate-300">Image</TableHead>
                  <TableHead class="w-1/6 font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {#each filteredDeployments as deployment (deployment.name)}
                  <TableRow class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700">
                    <TableCell class="font-medium truncate">
                      <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 rounded-full {isDeploymentRunning(deployment) ? 'bg-green-500' : deployment.status.toLowerCase() === 'updating' ? 'bg-yellow-500' : deployment.replicas === 0 ? 'bg-gray-400' : 'bg-red-500'}"></div>
                        <button 
                          onclick={() => handleViewDeployment(deployment.name)}
                          class="text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer text-left"
                          title="Click to view deployment details"
                        >
                          {deployment.name}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span class="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full {getStatusColor(deployment.replicas === 0 ? 'Stopped' : deployment.status)} shadow-sm">
                        {deployment.replicas === 0 ? 'Stopped' : deployment.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div class="text-sm">
                        <span class="font-medium font-mono {getReplicaStatusColor(deployment.ready, deployment.replicas)}">
                          {deployment.ready}/{deployment.replicas}
                        </span>
                        <span class="text-slate-500 dark:text-slate-400 ml-1 text-xs">
                          ({deployment.available} available)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell class="text-slate-600 dark:text-slate-400">
                      <button 
                        onclick={() => copyToClipboard(deployment.image)}
                        class="font-mono text-sm hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-all duration-200 hover:scale-105 cursor-pointer block w-full text-left"
                        title="Click to copy image to clipboard: {deployment.image}"
                      >
                        {truncateImageName(deployment.image, 30)}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center space-x-1">
                        {#if isDeploymentRunning(deployment)}
                          <!-- Stop button - only show when running -->
                          <button 
                            onclick={() => stopDeployment(deployment.name)}
                            class="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Stop Deployment (Scale to 0)"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
                            </svg>
                          </button>
                        {:else if deployment.replicas === 0}
                          <!-- Start button - only show when stopped (0 replicas) -->
                          <button 
                            onclick={() => startDeployment(deployment.name)}
                            class="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Start Deployment (Scale to 1)"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </button>
                        {/if}
                        
                        {#if (deployment.status === 'Running' && deployment.replicas > 0) || deployment.status === 'Updating'}
                          <!-- Restart button - only show when running or updating -->
                          <button 
                            onclick={() => restartDeployment(deployment.name)}
                            class="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Restart Deployment"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                          </button>
                        {/if}
                        
                        <button 
                          onclick={() => handleViewDeployment(deployment.name)}
                          class="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                          title="View Deployment Details"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
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
  </div>
</div>

<!-- Toast Notifications -->
<Toast 
  message={toastMessage}
  type={toastType}
  show={showToast}
  on:close={() => showToast = false}
/>
