<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { appStore, connectionState, namespaceState } from '$lib/stores/app-store';
  import { toastStore } from '$lib/stores/toast-store';
  import { k8sAPI, type K8sJob } from '$lib/api/k8s';
  import Button from "$lib/components/ui/button.svelte";
  import WorkloadTabs from "$lib/components/WorkloadTabs.svelte";
  import Table from "$lib/components/ui/table.svelte";
  import TableHeader from "$lib/components/ui/table-header.svelte";
  import TableBody from "$lib/components/ui/table-body.svelte";
  import TableRow from "$lib/components/ui/table-row.svelte";
  import TableHead from "$lib/components/ui/table-head.svelte";
  import TableCell from "$lib/components/ui/table-cell.svelte";

  // Jobs data
  let jobs = $state<K8sJob[]>([]);
  let isLoading = $state(false);
  let groupedJobs = $state<Record<string, K8sJob[]>>({});
  let filteredGroupedJobs = $state<Record<string, K8sJob[]>>({});

  // Filtering
  let selectedAppFilter = $state<string>('all');
  let availableApps = $state<string[]>([]);

  // Statistics
  let totalJobs = $state(0);
  let runningJobs = $state(0);
  let completedJobs = $state(0);
  let failedJobs = $state(0);

  onMount(async () => {
    // Load initial data if connected
    if ($connectionState.isConnected) {
      await loadData();
    }
  });

  // Reactive effect to reload data when connection or namespace changes
  $effect(() => {
    if ($connectionState.isConnected && $namespaceState.selected) {
      console.log('Jobs: Connection or namespace changed, reloading data');
      loadData();
    }
  });

  async function loadData() {
    try {
      isLoading = true;
      
      // Check connection status
      if (!$connectionState.isConnected) {
        return;
      }
      
      // Only load jobs for the currently selected namespace
      if ($namespaceState.selected) {
        console.log(`Loading jobs for namespace: ${$namespaceState.selected}`);
        jobs = await k8sAPI.getJobs($namespaceState.selected);
        groupJobsByParent();
      } else {
        console.log('No namespace selected, clearing jobs data');
        jobs = [];
        groupedJobs = {};
      }
      
      updateStats();
    } catch (error) {
      console.error("Failed to load jobs data:", error);
      toastStore.error('Failed to load jobs data');
    } finally {
      isLoading = false;
    }
  }

  function groupJobsByParent() {
    const grouped: Record<string, K8sJob[]> = {};
    const apps = new Set<string>();
    
    jobs.forEach(job => {
      // Use the app.kubernetes.io/name label value for grouping, fallback to job name
      const serviceName = job.labels && job.labels['app.kubernetes.io/name'] 
        ? job.labels['app.kubernetes.io/name'] 
        : job.name;
      
      if (!grouped[serviceName]) {
        grouped[serviceName] = [];
      }
      grouped[serviceName].push(job);
      
      // Add to available apps for filtering
      apps.add(serviceName);
    });
    
    groupedJobs = grouped;
    availableApps = Array.from(apps).sort();
    applyFilter();
  }

  function applyFilter() {
    if (selectedAppFilter === 'all') {
      filteredGroupedJobs = groupedJobs;
    } else {
      const filtered: Record<string, K8sJob[]> = {};
      Object.entries(groupedJobs).forEach(([appName, jobList]) => {
        if (appName === selectedAppFilter) {
          filtered[appName] = jobList;
        }
      });
      filteredGroupedJobs = filtered;
    }
  }

  function updateStats() {
    totalJobs = jobs.length;
    runningJobs = jobs.filter(job => job.status === 'Running' || job.status === 'Pending').length;
    completedJobs = jobs.filter(job => job.status === 'Completed' || job.status === 'Succeeded').length;
    failedJobs = jobs.filter(job => job.status === 'Failed' || job.status === 'Error').length;
  }

  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'running':
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
      case 'succeeded':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function navigateToJobDetails(appName: string) {
    goto(`/workloads/jobs/${encodeURIComponent(appName)}`);
  }

  function getParentJobStats(parentJobName: string) {
    const parentJobs = groupedJobs[parentJobName] || [];
    const total = parentJobs.length;
    const completed = parentJobs.filter(job => job.status === 'Completed' || job.status === 'Succeeded').length;
    const failed = parentJobs.filter(job => job.status === 'Failed' || job.status === 'Error').length;
    const running = parentJobs.filter(job => job.status === 'Running' || job.status === 'Pending').length;
    
    return { total, completed, failed, running };
  }
</script>

<div class="flex-1 flex flex-col min-h-0">
  <WorkloadTabs />

  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto p-6 min-h-0">
    <div class="w-full">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Jobs</h1>
          {#if $namespaceState.selected}
            <p class="text-sm text-slate-500 dark:text-slate-400">
              in {$namespaceState.selected}
            </p>
          {/if}
        </div>
        
        <Button 
          onclick={loadData}
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

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <!-- Total Jobs -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-2xl mr-3">⚡</span>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Total Jobs</h3>
            </div>
            <span class="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : totalJobs}
            </span>
          </div>
        </div>

        <!-- Running Jobs -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-2xl mr-3">🔄</span>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Running</h3>
            </div>
            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {isLoading ? '...' : runningJobs}
            </span>
          </div>
        </div>

        <!-- Completed Jobs -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-2xl mr-3">✅</span>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Completed</h3>
            </div>
            <span class="text-2xl font-bold text-green-600 dark:text-green-400">
              {isLoading ? '...' : completedJobs}
            </span>
          </div>
        </div>

        <!-- Failed Jobs -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-2xl mr-3">❌</span>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Failed</h3>
            </div>
            <span class="text-2xl font-bold text-red-600 dark:text-red-400">
              {isLoading ? '...' : failedJobs}
            </span>
          </div>
        </div>
      </div>

      <!-- Filter Section -->
      {#if availableApps.length > 0}
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div class="flex items-center space-x-4">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
              Filter by Service:
            </label>
            <select 
              bind:value={selectedAppFilter}
              onchange={applyFilter}
              class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Services ({availableApps.length})</option>
              {#each availableApps as app}
                <option value={app}>{app}</option>
              {/each}
            </select>
            {#if selectedAppFilter !== 'all'}
              <Button 
                onclick={() => { selectedAppFilter = 'all'; applyFilter(); }}
                variant="outline"
                size="sm"
              >
                Clear Filter
              </Button>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Jobs Table -->
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
            Connect to a Kubernetes cluster to view jobs
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
          <p class="text-slate-500 dark:text-slate-400">Loading jobs...</p>
        </div>
      {:else if Object.keys(filteredGroupedJobs).length === 0}
        <div class="text-center py-12">
          <div class="text-slate-400 dark:text-slate-500 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No Jobs Found
          </h3>
          <p class="text-slate-500 dark:text-slate-400">
            No jobs found in namespace "{$namespaceState.selected}"
          </p>
        </div>
      {:else}

        
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completions</TableHead>
                <TableHead>Successful</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Labels</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each Object.entries(filteredGroupedJobs) as [serviceName, jobs]}
                {@const stats = getParentJobStats(serviceName)}
                <TableRow class="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <TableCell>
                    <div class="font-medium text-slate-900 dark:text-white">
                      {jobs[0]?.labels && jobs[0].labels['app.kubernetes.io/name'] ? jobs[0].labels['app.kubernetes.io/name'] : serviceName}
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">
                      {stats.total} jobs • {stats.completed} completed • {stats.failed} failed
                    </div>
                  </TableCell>
                  <TableCell>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(jobs[0]?.status || 'Unknown')}">
                      {jobs[0]?.status || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span class="text-slate-900 dark:text-white">
                      {jobs.reduce((sum, job) => sum + job.completions, 0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span class="text-green-600 dark:text-green-400">
                      {jobs.reduce((sum, job) => sum + job.successful, 0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span class="text-red-600 dark:text-red-400">
                      {jobs.reduce((sum, job) => sum + job.failed, 0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span class="text-slate-900 dark:text-white">
                      {jobs[0]?.age || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div class="text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                      {#if jobs[0]?.labels}
                        {#each Object.entries(jobs[0].labels) as [key, value]}
                          <div class="mb-1 last:mb-0">
                            <span class="font-medium">{key}</span>=<span class="text-slate-500">{value}</span>
                          </div>
                        {/each}
                      {:else}
                        <div class="text-slate-400">No labels</div>
                      {/if}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      onclick={() => navigateToJobDetails(serviceName)}
                      variant="outline"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </div>
      {/if}
    </div>
  </main>
</div>
