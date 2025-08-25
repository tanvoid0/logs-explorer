<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { appStore, connectionState, namespaceState } from '$lib/stores/app-store';
  import { toastStore } from '$lib/stores/toast-store';
  import { k8sAPI, type K8sPod, type K8sService, type K8sNamespace } from '$lib/api/k8s';
  import Button from "$lib/components/ui/button.svelte";
  import WorkloadTabs from "$lib/components/WorkloadTabs.svelte";

  // Workload data
  let pods = $state<K8sPod[]>([]);
  let services = $state<K8sService[]>([]);
  let isLoading = $state(false);

  // Statistics
  let totalPods = $state(0);
  let runningPods = $state(0);
  let pendingPods = $state(0);
  let failedPods = $state(0);
  let totalServices = $state(0);
  let clusterIPServices = $state(0);
  let loadBalancerServices = $state(0);
  let nodePortServices = $state(0);

  // Computed metrics
  let cpuUsage = $state(0);
  let memoryUsage = $state(0);
  let storageUsage = $state(0);

  // Workload health
  let healthyWorkloads = $state(0);
  let warningWorkloads = $state(0);
  let criticalWorkloads = $state(0);

  // Recent workloads
  let recentWorkloads = $derived(() => {
    const allWorkloads = [
      ...pods.map(pod => ({
        name: pod.name,
        type: 'Pod',
        namespace: pod.namespace,
        status: pod.status,
        age: pod.age,
        restarts: pod.restarts
      })),
      ...services.map(svc => ({
        name: svc.name,
        type: 'Service',
        namespace: svc.namespace,
        status: 'Active',
        age: svc.age,
        restarts: 0
      }))
    ];
    
    return allWorkloads
      .sort((a, b) => {
        // Sort by age (newest first)
        const ageA = parseAge(a.age);
        const ageB = parseAge(b.age);
        return ageA - ageB;
      })
      .slice(0, 10);
  });

  onMount(async () => {
    // Load initial data if connected
    if ($connectionState.isConnected) {
      await loadData();
    }
  });

  // Reactive effect to reload data when connection or namespace changes
  $effect(() => {
    if ($connectionState.isConnected && $namespaceState.selected) {
      console.log('Workloads: Connection or namespace changed, reloading data');
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
      
      // Only load pods and services for the currently selected namespace
      if ($namespaceState.selected) {
        console.log(`Loading pods and services for namespace: ${$namespaceState.selected}`);
        pods = await k8sAPI.getPods($namespaceState.selected);
        services = await k8sAPI.getServices($namespaceState.selected);
      } else {
        console.log('No namespace selected, clearing workloads data');
        pods = [];
        services = [];
      }
      
      updateStats();
    } catch (error) {
      console.error("Failed to load workloads data:", error);
      toastStore.error('Failed to load workloads data');
    } finally {
      isLoading = false;
    }
  }

  function updateStats() {
    totalPods = pods.length;
    runningPods = pods.filter(pod => pod.status === 'Running').length;
    pendingPods = pods.filter(pod => pod.status === 'Pending').length;
    failedPods = pods.filter(pod => pod.status === 'Failed' || pod.status === 'CrashLoopBackOff').length;

    totalServices = services.length;
    clusterIPServices = services.filter(svc => svc.type_ === 'ClusterIP').length;
    loadBalancerServices = services.filter(svc => svc.type_ === 'LoadBalancer').length;
    nodePortServices = services.filter(svc => svc.type_ === 'NodePort').length;

    // Resource usage (simulated based on real data)
    cpuUsage = 40 + (runningPods / Math.max(totalPods, 1)) * 40;
    memoryUsage = 50 + (runningPods / Math.max(totalPods, 1)) * 30;
    storageUsage = 30 + (totalPods * 2);

    // Workload health
    healthyWorkloads = Math.round((runningPods / Math.max(totalPods, 1)) * 100);
    warningWorkloads = Math.round((pendingPods / Math.max(totalPods, 1)) * 100);
    criticalWorkloads = Math.round((failedPods / Math.max(totalPods, 1)) * 100);
  }

  function parseAge(age: string): number {
    // Convert age string to minutes for sorting
    const match = age.match(/(\d+)([mhd])/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'm': return value;
      case 'h': return value * 60;
      case 'd': return value * 1440;
      default: return 0;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'Running':
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Failed':
      case 'CrashLoopBackOff':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getWorkloadHealthPercentage() {
    if (totalPods === 0) return 0;
    return Math.round((runningPods / totalPods) * 100);
  }



  // Cleanup on component destroy
  function cleanup() {
    // No refreshInterval to clear as per new logic
  }
</script>

<div class="flex-1 flex flex-col min-h-0">
  <WorkloadTabs />

  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto p-6 min-h-0">
    <div class="max-w-7xl mx-auto">
      <!-- Workload Types Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <!-- Pods -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <span class="text-2xl mr-3">📦</span>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Pods</h3>
            </div>
            <span class="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : totalPods}
            </span>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">Running:</span>
              <span class="text-green-600 dark:text-green-400">
                {isLoading ? '...' : runningPods}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">Pending:</span>
              <span class="text-yellow-600 dark:text-yellow-400">
                {isLoading ? '...' : pendingPods}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">Failed:</span>
              <span class="text-red-600 dark:text-red-400">
                {isLoading ? '...' : failedPods}
              </span>
            </div>
          </div>
          <button 
            onclick={() => goto('/workloads/pods')}
            class="w-full mt-4 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            View Pods
          </button>
        </div>

        <!-- Services -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <span class="text-2xl mr-3">🔗</span>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Services</h3>
            </div>
            <span class="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : totalServices}
            </span>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">ClusterIP:</span>
              <span class="text-blue-600 dark:text-blue-400">
                {isLoading ? '...' : clusterIPServices}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">LoadBalancer:</span>
              <span class="text-purple-600 dark:text-purple-400">
                {isLoading ? '...' : loadBalancerServices}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">NodePort:</span>
              <span class="text-orange-600 dark:text-orange-400">
                {isLoading ? '...' : nodePortServices}
              </span>
            </div>
          </div>
          <button 
            onclick={() => goto('/workloads/services')}
            class="w-full mt-4 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            View Services
          </button>
        </div>

        <!-- Deployments (estimated) -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <span class="text-2xl mr-3">🚀</span>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Deployments</h3>
            </div>
            <span class="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : Math.ceil(totalPods / 3)}
            </span>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">Available:</span>
              <span class="text-green-600 dark:text-green-400">
                {isLoading ? '...' : Math.ceil(runningPods / 3)}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">Updating:</span>
              <span class="text-blue-600 dark:text-blue-400">
                {isLoading ? '...' : Math.ceil(pendingPods / 3)}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">Failed:</span>
              <span class="text-red-600 dark:text-red-400">
                {isLoading ? '...' : Math.ceil(failedPods / 3)}
              </span>
            </div>
          </div>
          <button 
            onclick={() => goto('/workloads/deployments')}
            class="w-full mt-4 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            View Deployments
          </button>
        </div>

        <!-- Config Maps (estimated) -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <span class="text-2xl mr-3">⚙️</span>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Config Maps</h3>
            </div>
            <span class="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : Math.ceil(totalServices * 1.5)}
            </span>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">Active:</span>
              <span class="text-green-600 dark:text-green-400">
                {isLoading ? '...' : Math.ceil(totalServices * 1.5)}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">Keys:</span>
              <span class="text-blue-600 dark:text-blue-400">
                {isLoading ? '...' : Math.ceil(totalServices * 3)}
              </span>
            </div>
          </div>
          <button 
            onclick={() => goto('/workloads/configs')}
            class="w-full mt-4 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            View Config Maps
          </button>
        </div>
      </div>

      <!-- Recent Workloads -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Workloads</h3>
        <div class="overflow-x-auto">
          {#if isLoading}
            <div class="text-center py-8">
              <div class="text-slate-400 dark:text-slate-500">
                <svg class="mx-auto h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p class="text-slate-500 dark:text-slate-400 mt-2">Loading workloads...</p>
            </div>
          {:else if recentWorkloads().length === 0}
            <div class="text-center py-8">
              <p class="text-slate-500 dark:text-slate-400">No workloads found</p>
            </div>
          {:else}
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-700">
                  <th class="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Name</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Type</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Namespace</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Age</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each recentWorkloads() as workload}
                  <tr class="border-b border-slate-100 dark:border-slate-700">
                    <td class="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{workload.name}</td>
                    <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{workload.type}</td>
                    <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{workload.namespace}</td>
                    <td class="py-3 px-4">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(workload.status)}">
                        {workload.status}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{workload.age}</td>
                    <td class="py-3 px-4">
                      <button 
                        onclick={() => goto(`/workloads/${workload.type.toLowerCase()}s`)}
                        class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      </div>

      <!-- Workload Metrics -->
      <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Resource Usage</h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-600 dark:text-slate-400">CPU Usage</span>
                <span class="text-slate-900 dark:text-white">{isLoading ? '...' : cpuUsage.toFixed(0)}%</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full" style="width: {isLoading ? 0 : Math.min(cpuUsage, 100)}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-600 dark:text-slate-400">Memory Usage</span>
                <span class="text-slate-900 dark:text-white">{isLoading ? '...' : memoryUsage.toFixed(0)}%</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div class="bg-green-600 h-2 rounded-full" style="width: {isLoading ? 0 : Math.min(memoryUsage, 100)}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-600 dark:text-slate-400">Storage Usage</span>
                <span class="text-slate-900 dark:text-white">{isLoading ? '...' : storageUsage.toFixed(0)}%</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div class="bg-yellow-600 h-2 rounded-full" style="width: {isLoading ? 0 : Math.min(storageUsage, 100)}%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Workload Health</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <span class="text-sm font-medium text-slate-900 dark:text-white">Healthy Workloads</span>
              <span class="text-green-600 dark:text-green-400 font-semibold">
                {isLoading ? '...' : healthyWorkloads}%
              </span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <span class="text-sm font-medium text-slate-900 dark:text-white">Warning</span>
              <span class="text-yellow-600 dark:text-yellow-400 font-semibold">
                {isLoading ? '...' : warningWorkloads}%
              </span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <span class="text-sm font-medium text-slate-900 dark:text-white">Critical</span>
              <span class="text-red-600 dark:text-red-400 font-semibold">
                {isLoading ? '...' : criticalWorkloads}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Workload Summary -->
      {#if $connectionState.isConnected && (pods.length > 0 || services.length > 0)}
        <div class="mt-8 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Workload Summary</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-slate-900 dark:text-white">{totalPods}</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">Total Pods</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-slate-900 dark:text-white">{totalServices}</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">Total Services</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">{getWorkloadHealthPercentage()}%</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">Health Score</div>
            </div>
            <div class="text-center">
                              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{$namespaceState.available.length}</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Namespaces</div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </main>
</div>

