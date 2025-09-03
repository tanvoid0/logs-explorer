<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { appStore, connectionState, namespaceState } from '$lib/stores/app-store';
  import { toastStore } from '$lib/stores/toast-store';
  import { k8sAPI, type K8sPod, type K8sService, type K8sNamespace } from '$lib/api/k8s';
  import Button from "$lib/components/ui/button.svelte";
  import WorkloadTabs from "$lib/components/WorkloadTabs.svelte";
  import TopNavbar from "$lib/components/TopNavbar.svelte";

  // Workload data
  let pods = $state<K8sPod[]>([]);
  let services = $state<K8sService[]>([]);
  let isLoading = $state(false);
  let hasLoadedData = $state(false);

  // Statistics
  let totalPods = $state(0);
  let runningPods = $state(0);
  let pendingPods = $state(0);
  let failedPods = $state(0);
  let totalServices = $state(0);
  let clusterIPServices = $state(0);
  let loadBalancerServices = $state(0);
  let nodePortServices = $state(0);

  // Track previous namespace to avoid unnecessary reloads
  let previousNamespace = $state<string>('');

  onMount(async () => {
    // Only load data if we're connected and have a namespace
    if ($connectionState.isConnected && $namespaceState.selected) {
      await loadData();
    }
  });

  // Optimized reactive effect - only reload when namespace actually changes
  $effect(() => {
    const currentNamespace = $namespaceState.selected;
    const isConnected = $connectionState.isConnected;
    
    // Only reload if:
    // 1. We're connected
    // 2. We have a namespace
    // 3. The namespace has actually changed
    // 4. We haven't loaded data for this namespace yet
    if (isConnected && currentNamespace && currentNamespace !== previousNamespace) {
      console.log(`Workloads: Namespace changed from "${previousNamespace}" to "${currentNamespace}", reloading data`);
      previousNamespace = currentNamespace;
      loadData();
    }
  });

  async function loadData() {
    try {
      // Ensure we're connected before attempting to load data
      const isConnected = await appStore.ensureConnected();
      if (!isConnected) {
        console.log('Workloads: Not connected to Kubernetes, skipping data load');
        return;
      }

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
        hasLoadedData = true;
      } else {
        console.log('No namespace selected, clearing workloads data');
        pods = [];
        services = [];
        hasLoadedData = false;
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

  async function handleRefresh() {
    await loadData();
  }

  function handleNamespaceChange() {
    // The effect will handle reloading data when namespace changes
  }
</script>

<!-- Top Navigation Bar -->
<TopNavbar 
  pageTitle="Workloads" 
  pageDescription="Kubernetes workloads and resources" 
/>

<!-- Main Content -->
<div class="p-6">
  <!-- Connection Status Check -->
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
        Connect to a Kubernetes cluster to view workload data
      </p>
      <Button onclick={() => appStore.connect()}>
        Connect to Kubernetes
      </Button>
    </div>
  {:else}
    <!-- Workload Content -->
    <div class="space-y-6">
      <!-- Header with Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Pod Stats -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Pods</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{totalPods}</p>
            </div>
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2 flex items-center space-x-2 text-sm">
            <span class="text-green-600 dark:text-green-400">{runningPods} running</span>
            <span class="text-yellow-600 dark:text-yellow-400">{pendingPods} pending</span>
            <span class="text-red-600 dark:text-red-400">{failedPods} failed</span>
          </div>
        </div>

        <!-- Service Stats -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Services</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{totalServices}</p>
            </div>
            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2 flex items-center space-x-2 text-sm">
            <span class="text-blue-600 dark:text-blue-400">{clusterIPServices} ClusterIP</span>
            <span class="text-purple-600 dark:text-purple-400">{loadBalancerServices} LoadBalancer</span>
            <span class="text-orange-600 dark:text-orange-400">{nodePortServices} NodePort</span>
          </div>
        </div>
      </div>

      <!-- Workload Tabs -->
      <WorkloadTabs />
    </div>
  {/if}
</div>

