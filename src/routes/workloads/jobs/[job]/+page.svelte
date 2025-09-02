<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { k8sAPI, type K8sJob } from '$lib/api/k8s';
  import { appStore, connectionState, namespaceState } from '$lib/stores/app-store';
  import { toastStore } from '$lib/stores/toast-store';
  import Button from "$lib/components/ui/button.svelte";
  import Table from "$lib/components/ui/table.svelte";
  import TableHeader from "$lib/components/ui/table-header.svelte";
  import TableBody from "$lib/components/ui/table-body.svelte";
  import TableRow from "$lib/components/ui/table-row.svelte";
  import TableHead from "$lib/components/ui/table-head.svelte";
  import TableCell from "$lib/components/ui/table-cell.svelte";

  // Get app name from URL params
  let appName = $state($page.params.job || '');
  
  // Local state
  let jobs = $state<K8sJob[]>([]);
  let filteredJobs = $state<K8sJob[]>([]);
  let isLoading = $state(false);
  
  // Search and sorting state
  let searchQuery = $state('');
  let sortField = $state<keyof K8sJob>('name');
  let sortDirection = $state<'asc' | 'desc'>('asc');

  // Use reactive effects to watch for changes
  $effect(() => {
    if (appName && $namespaceState.selected) {
      loadAppDetails();
    }
  });

  // Apply filters when search or sort changes
  $effect(() => {
    if (jobs.length > 0) {
      applyFiltersAndSort();
    }
  });

  onMount(() => {
    if (appName && $namespaceState.selected) {
      loadAppDetails();
    }
  });

  async function loadAppDetails() {
    if (!appName || !$namespaceState.selected) return;
    
    try {
      isLoading = true;
      const allJobs = await k8sAPI.getJobs($namespaceState.selected);
      
      // Filter jobs by app.kubernetes.io/name label value
      const appJobs = allJobs.filter(job => 
        job.labels && job.labels['app.kubernetes.io/name'] === appName
      );
      
      if (appJobs.length > 0) {
        jobs = appJobs;
        applyFiltersAndSort();
      } else {
        toastStore.error(`No jobs found for app ${appName}`);
      }
    } catch (error) {
      console.error('Failed to load app details:', error);
      toastStore.error(`Failed to load app details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isLoading = false;
    }
  }

  // Filter and sort jobs
  function applyFiltersAndSort() {
    let filtered = [...jobs];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.name.toLowerCase().includes(query) ||
        job.status.toLowerCase().includes(query) ||
        job.age.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle numeric fields
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
    
    filteredJobs = filtered;
  }

  // Handle column sorting
  function handleSort(field: keyof K8sJob) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
    applyFiltersAndSort();
  }

  // Handle search input
  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;
    applyFiltersAndSort();
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
      case 'completed':
      case 'succeeded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
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
              {appName}
            </h1>
            {#if $namespaceState.selected}
              <p class="text-sm text-slate-500 dark:text-slate-400">
                in {$namespaceState.selected}
              </p>
            {/if}
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <Button onclick={loadAppDetails}
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
            Connect to a Kubernetes cluster to view job details
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
          <p class="text-slate-500 dark:text-slate-400">Loading job details...</p>
        </div>
      {:else if jobs.length === 0}
        <div class="text-center py-12">
          <div class="text-slate-400 dark:text-slate-500 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No Jobs Found
          </h3>
          <p class="text-slate-500 dark:text-slate-400">
            No jobs found for app "{appName}" in namespace "{$namespaceState.selected}"
          </p>
        </div>
      {:else}
        <!-- App Information -->
        <div class="space-y-6">
          <!-- App Status Card -->
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">App: {appName}</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Jobs</div>
                <p class="mt-1 text-sm text-slate-900 dark:text-white">{jobs.length}</p>
              </div>
              <div>
                <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Running</div>
                <p class="mt-1 text-sm text-blue-600 dark:text-blue-400">{jobs.filter(j => j.status === 'Running' || j.status === 'Pending').length}</p>
              </div>
              <div>
                <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</div>
                <p class="mt-1 text-sm text-green-600 dark:text-green-400">{jobs.filter(j => j.status === 'Completed' || j.status === 'Succeeded').length}</p>
              </div>
              <div>
                <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Failed</div>
                <p class="mt-1 text-sm text-red-600 dark:text-red-400">{jobs.filter(j => j.status === 'Failed' || j.status === 'Error').length}</p>
              </div>
            </div>
          </div>

          <!-- Jobs List -->
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Jobs</h3>
              <Button onclick={loadAppDetails}
                disabled={isLoading}
                variant="outline"
                size="sm"
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
            </div>

            <!-- Search Input -->
            <div class="mb-4">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search jobs by name, status, or age..."
                  value={searchQuery}
                  oninput={handleSearch}
                  class="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md leading-5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
              </div>
              {#if searchQuery}
                <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Showing {filteredJobs.length} of {jobs.length} jobs
                </p>
              {/if}
            </div>

            <div class="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button 
                        onclick={() => handleSort('name')}
                        class="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span>Job Name</span>
                        {#if sortField === 'name'}
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {#if sortDirection === 'asc'}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                            {:else}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            {/if}
                          </svg>
                        {/if}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onclick={() => handleSort('status')}
                        class="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span>Status</span>
                        {#if sortField === 'status'}
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {#if sortDirection === 'asc'}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                            {:else}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            {/if}
                          </svg>
                        {/if}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onclick={() => handleSort('completions')}
                        class="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span>Completions</span>
                        {#if sortField === 'completions'}
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {#if sortDirection === 'asc'}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                            {:else}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            {/if}
                          </svg>
                        {/if}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onclick={() => handleSort('successful')}
                        class="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span>Successful</span>
                        {#if sortField === 'successful'}
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {#if sortDirection === 'asc'}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                            {:else}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            {/if}
                          </svg>
                        {/if}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onclick={() => handleSort('failed')}
                        class="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span>Failed</span>
                        {#if sortField === 'failed'}
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {#if sortDirection === 'asc'}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                            {:else}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            {/if}
                          </svg>
                        {/if}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onclick={() => handleSort('age')}
                        class="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span>Age</span>
                        {#if sortField === 'age'}
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {#if sortDirection === 'asc'}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                            {:else}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            {/if}
                          </svg>
                        {/if}
                      </button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {#each filteredJobs as job}
                    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <TableCell>
                        <div class="font-medium text-slate-900 dark:text-white">
                          {job.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(job.status)}">
                          {job.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span class="text-slate-900 dark:text-white">
                          {job.completions}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span class="text-green-600 dark:text-green-400">
                          {job.successful}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span class="text-red-600 dark:text-red-400">
                          {job.failed}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span class="text-slate-900 dark:text-white">
                          {job.age}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div class="flex items-center space-x-2">
                          <Button onclick={() => copyToClipboard(job.name)}
                            variant="outline"
                            size="sm"
                          >
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                            Copy
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  {/each}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </main>
</div>
