<script lang="ts">
  import { onMount } from "svelte";
  import { k8sAPI, type K8sService } from "$lib/api/k8s";
  import { appStore, connectionState, namespaceState } from "$lib/stores/app-store";
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
  let services = $state<K8sService[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state("");
  let typeFilter = $state("");
  let statusFilter = $state("");

  // Toast notifications
  let toastMessage = $state("");
  let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');
  let showToast = $state(false);

  // Computed values
  let filteredServices = $derived(services.filter(service => {
    const matchesSearch = !searchQuery || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !typeFilter || service.type_ === typeFilter;
    
    return matchesSearch && matchesType;
  }));

  let serviceTypes = $derived(Array.from(new Set(services.map(s => s.type_))));

  function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    toastMessage = message;
    toastType = type;
    showToast = true;
  }

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
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
      
      // Load services for selected namespace
      if ($namespaceState.selected) {
        services = await k8sAPI.getServices($namespaceState.selected);
      }
      
      showNotification(`Loaded ${services.length} services`, "success");
    } catch (error) {
      console.error("Failed to load services data:", error);
      showNotification(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      isLoading = false;
    }
  }

  function handleNamespaceChange(event: CustomEvent<{namespace: string}>) {
    appStore.setSelectedNamespace(event.detail.namespace);
    loadData();
  }

  function getServiceTypeColor(type: string) {
    switch (type) {
      case 'ClusterIP': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'NodePort': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'LoadBalancer': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'ExternalName': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'Running': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function formatPorts(ports: any) {
    if (!ports) return 'None';
    if (!Array.isArray(ports)) return 'None';
    if (ports.length === 0) return 'None';
    return ports.map(port => `${port.port}:${port.targetPort} (${port.protocol})`).join(', ');
  }

  function formatEndpoints(endpoints: any) {
    if (!endpoints) return 'None';
    if (!Array.isArray(endpoints)) return 'None';
    if (endpoints.length === 0) return 'None';
    return endpoints.map(ep => ep.ip).join(', ');
  }

  function formatPortsDisplay(ports: string): string {
    if (!ports || ports === 'None') return 'None';
    
    // Parse the ports string (format: "80:8080,443:8443")
    const portPairs = ports.split(',').map(pair => {
      const [servicePort, targetPort] = pair.trim().split(':');
      return { servicePort, targetPort };
    });
    
    return portPairs.map(pair => 
      `${pair.servicePort} → ${pair.targetPort}`
    ).join(', ');
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
</script>

<div class="flex-1 flex flex-col min-h-0">
  <WorkloadTabs />
  <!-- Sticky Filters Bar -->
  <div class="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
    <div class="p-4">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search Input -->
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search services..."
            class="flex-1 px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled={!$connectionState.isConnected}
          />
        </div>

        <!-- Type Filter -->
        <div class="flex items-center gap-2">
          <label for="type-filter" class="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Type:
          </label>
          <select
            id="type-filter"
            bind:value={typeFilter}
            class="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {#each serviceTypes as type}
              <option value={type}>{type}</option>
            {/each}
          </select>
        </div>



        <!-- Refresh Button -->
        <Button onclick={loadData}
          disabled={isLoading || !$connectionState.isConnected}
          class="px-3 py-1 text-sm"
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

  <!-- Services Content -->
  <div class="flex-1 overflow-y-auto p-6">
    <div class="w-full">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Kubernetes Services
        </h1>
        <p class="text-slate-600 dark:text-slate-400">
          Manage and monitor your Kubernetes services
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span class="text-xl">🔗</span>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Services</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : services.length}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span class="text-xl">🌐</span>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">ClusterIP</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : services.filter(s => s.type_ === 'ClusterIP').length}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <span class="text-xl">🔗</span>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">NodePort</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : services.filter(s => s.type_ === 'NodePort').length}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span class="text-xl">⚖️</span>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">LoadBalancer</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : services.filter(s => s.type_ === 'LoadBalancer').length}
              </p>
            </div>
          </div>
        </div>
      </div>

              <!-- Services Table -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                  Services ({filteredServices.length})
                </h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Network services and load balancers
                </p>
              </div>
              <div class="flex items-center space-x-2">
                <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>ClusterIP</span>
                </div>
                <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>NodePort</span>
                </div>
                <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
                  <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>LoadBalancer</span>
                </div>
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
              <span class="text-lg font-medium">Loading services...</span>
            </div>
          </div>
        {:else if filteredServices.length === 0}
          <div class="p-6 text-center">
            <div class="text-slate-400 dark:text-slate-500 mb-4">
              <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">No services found</h3>
            <p class="text-slate-500 dark:text-slate-400">
              {searchQuery || typeFilter || statusFilter ? 'Try adjusting your filters.' : 'No services are currently running in this namespace.'}
            </p>
          </div>
        {:else}
                      <div class="overflow-x-auto">
              <Table className="w-full min-w-full">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <TableHead className="w-1/4 font-semibold text-slate-700 dark:text-slate-300">Service</TableHead>
                    <TableHead className="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="w-1/3 font-semibold text-slate-700 dark:text-slate-300">Ports</TableHead>
                    <TableHead className="w-1/6 font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {#each filteredServices as service}
                    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700">
                      <TableCell className="font-medium truncate">
                        <div class="flex items-center space-x-2">
                          <div class="w-2 h-2 rounded-full {service.type_ === 'ClusterIP' ? 'bg-blue-500' : service.type_ === 'NodePort' ? 'bg-green-500' : 'bg-purple-500'}"></div>
                          <span class="text-slate-900 dark:text-white">{service.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span class="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shadow-sm">
                          Active
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        <Button 
                          onclick={() => copyToClipboard(service.ports)}
                          variant="ghost"
                          size="sm"
                          class="font-mono text-sm hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-all duration-200 hover:scale-105 cursor-pointer block w-full text-left"
                          title="Click to copy ports to clipboard: {service.ports}"
                        >
                          {formatPortsDisplay(service.ports)}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div class="flex items-center space-x-1">
                          <button 
                            class="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                            title="View Service"
                            aria-label="View service {service.name}"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                          </button>
                          <button 
                            class="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Edit Service"
                            aria-label="Edit service {service.name}"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <button 
                            class="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Delete Service"
                            aria-label="Delete service {service.name}"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
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
