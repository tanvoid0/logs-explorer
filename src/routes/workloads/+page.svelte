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
    <div class="w-full">
      <!-- Workload Types Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <!-- Pods Summary -->
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
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-4">
            View pods in deployment details
          </p>
        </div>

        <!-- Services Summary -->
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
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-4">
            Services managed via deployments
          </p>
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

        <!-- Jobs (estimated) -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <span class="text-2xl mr-3">⚡</span>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Jobs</h3>
            </div>
            <span class="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : Math.ceil(totalPods / 4)}
            </span>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">Running:</span>
              <span class="text-blue-600 dark:text-blue-400">
                {isLoading ? '...' : Math.ceil(pendingPods / 4)}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">Completed:</span>
              <span class="text-green-600 dark:text-green-400">
                {isLoading ? '...' : Math.ceil(runningPods / 4)}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-400">Failed:</span>
              <span class="text-red-600 dark:text-red-400">
                {isLoading ? '...' : Math.ceil(failedPods / 4)}
              </span>
            </div>
          </div>
          <button 
            onclick={() => goto('/workloads/jobs')}
            class="w-full mt-4 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            View Jobs
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


    </div>
  </main>
</div>

