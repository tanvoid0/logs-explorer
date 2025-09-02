<script lang="ts">
  import { onMount } from 'svelte';
  import { k8sAPI, type K8sPod } from '$lib/api/k8s';
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

  // Local state for UI

  // Local state for UI
  let pods = $state<K8sPod[]>([]);
  let isLoading = $state(false);
  let searchQuery = $state('');
  let statusFilter = $state('');

  // Computed filtered data
  let filteredPods = $derived(pods.filter(pod => {
    const matchesSearch = !searchQuery || 
      pod.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || pod.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }));

  // Get unique values for filters
  let podStatuses = $derived(Array.from(new Set(pods.map(p => p.status))).sort());

  // Statistics - calculated from filtered pods when filters are applied, otherwise from all pods
  let podStats = $derived({
    running: (() => {
      const podsToCount = (searchQuery || statusFilter) ? filteredPods : pods;
      return podsToCount.filter(pod => pod.status.toLowerCase() === 'running').length;
    })(),
    pending: (() => {
      const podsToCount = (searchQuery || statusFilter) ? filteredPods : pods;
      return podsToCount.filter(pod => pod.status.toLowerCase() === 'pending').length;
    })(),
    failed: (() => {
      const podsToCount = (searchQuery || statusFilter) ? filteredPods : pods;
      return podsToCount.filter(pod => 
        ['failed', 'error', 'crashloopbackoff'].includes(pod.status.toLowerCase())
      ).length;
    })(),
    total: pods.length // Always show total from all pods
  });

  onMount(async () => {
    // Auto-connect if not connected and auto-connect is enabled
    if (!$connectionState.isConnected && !$connectionState.isConnecting) {
      const success = await appStore.connect();
      if (success) {
        toastStore.success('Connected to Kubernetes cluster');
      } else {
        toastStore.error('Failed to connect to Kubernetes');
      }
    }
  });

  // Load pods when namespace changes
  $effect(() => {
    if ($connectionState.isConnected && $namespaceState.selected) {
      loadPods();
    } else {
      pods = [];
    }
  });

  async function loadPods() {
    if (!$connectionState.isConnected || !$namespaceState.selected) return;
    
    try {
      isLoading = true;
      console.log(`Loading pods for namespace: ${$namespaceState.selected}`);
      
      const loadedPods = await k8sAPI.getPods($namespaceState.selected);
      console.log(`Loaded ${loadedPods.length} pods for namespace ${$namespaceState.selected}`);
      
      pods = loadedPods;
    } catch (error) {
      console.error(`Failed to load pods for namespace ${$namespaceState.selected}:`, error);
      toastStore.error(`Failed to load pods: ${error instanceof Error ? error.message : 'Unknown error'}`);
      pods = [];
    } finally {
      isLoading = false;
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

  function handleViewPod(pod: K8sPod) {
    // Navigate to pod details page
    window.location.href = `/workloads/pods/${encodeURIComponent(pod.name)}`;
  }

  function handleViewLogs(pod: K8sPod) {
    // Navigate to logs page with pod filter
    window.location.href = `/logs?pod=${encodeURIComponent(pod.name)}`;
  }

  function handleExecuteCommand(pod: K8sPod) {
    // TODO: Implement pod exec/terminal
    console.log('Execute command in pod:', pod);
  }

  function handleCopyPodName(pod: K8sPod) {
    navigator.clipboard.writeText(pod.name).then(() => {
      toastStore.success(`Copied pod name: ${pod.name}`);
    }).catch(err => {
      console.error('Failed to copy pod name:', err);
      toastStore.error('Failed to copy pod name');
    });
  }

  function handleDeletePod(pod: K8sPod) {
    // TODO: Implement pod deletion with confirmation
    console.log('Delete pod:', pod);
  }

  function clearFilters() {
    searchQuery = "";
    statusFilter = "";
  }
</script>

<div class="flex-1 flex flex-col min-h-0">
  <WorkloadTabs />

  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto p-6">
    <div class="w-full">
      {#if !$connectionState.isConnected}
        <!-- Not Connected State -->
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
            Use the connection button in the sidebar to connect to a Kubernetes cluster
          </p>
                      <Button onclick={() => appStore.connect()}>
            Connect to Kubernetes
          </Button>
        </div>
      {:else if isLoading}
        <!-- Loading State -->
        <div class="text-center py-12">
          <div class="text-slate-400 dark:text-slate-500 mb-4">
            <svg class="mx-auto h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p class="text-slate-500 dark:text-slate-400">Loading pods...</p>
        </div>
      {:else}
        <!-- Pod Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <span class="text-2xl">🟢</span>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Running</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white">{podStats.running}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <span class="text-2xl">🟡</span>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white">{podStats.pending}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center">
              <div class="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <span class="text-2xl">🔴</span>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Failed</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white">{podStats.failed}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span class="text-2xl">📊</span>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white">{podStats.total}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Search and Filters -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <!-- Search and Filters -->
              <div class="flex flex-col sm:flex-row gap-4 flex-1">
                <!-- Search Input -->
                <div class="flex-1 min-w-0">
                  <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search pods by name or namespace..."
                    class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <!-- Status Filter -->
                <select
                  bind:value={statusFilter}
                  class="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  {#each podStatuses as status (status)}
                    <option value={status}>{status}</option>
                  {/each}
                </select>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2">
                {#if searchQuery || statusFilter}
                  <Button onclick={clearFilters}
                    variant="outline"
                    class="text-sm"
                  >
                    Clear Filters
                  </Button>
                {/if}
                <span class="text-sm text-slate-500 dark:text-slate-400">
                  {#if searchQuery || statusFilter}
                    {filteredPods.length} of {pods.length} pods (filtered)
                  {:else}
                    {pods.length} pods
                  {/if}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pods Table -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                  {#if searchQuery || statusFilter}
                    Pod List ({filteredPods.length} of {pods.length} pods)
                  {:else}
                    Pod List ({pods.length} pods)
                  {/if}
                </h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage and monitor your Kubernetes pods
                </p>
              </div>
              <div class="flex items-center space-x-2">
                <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Running</span>
                </div>
                <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
                  <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Pending</span>
                </div>
                <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
                  <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Failed</span>
                </div>
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
              <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
                {$namespaceState.selected ? 'No Pods Found' : 'Select a Namespace'}
              </h3>
              <p class="text-slate-500 dark:text-slate-400">
                                  {$namespaceState.selected
                    ? `No pods found in namespace "${$namespaceState.selected}"` 
                  : 'Please select a namespace from the sidebar to view pods'
                }
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
                  {#each filteredPods as pod (pod.name)}
                    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700">
                      <TableCell className="font-medium truncate">
                        <div class="flex items-center space-x-2">
                          <div class="w-2 h-2 rounded-full {pod.status.toLowerCase() === 'running' ? 'bg-green-500' : pod.status.toLowerCase() === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}"></div>
                          <span class="text-slate-900 dark:text-white">{pod.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(pod.status)} shadow-sm">
                          {pod.status}
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
                          <Button 
                            onclick={() => handleViewPod(pod)}
                            variant="ghost"
                            size="sm"
                            class="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                            title="View Pod Details"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                          </Button>
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
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
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
      {/if}
    </div>
  </main>
</div>
