<script lang="ts">
  import { onMount } from "svelte";
  import { k8sAPI, type K8sNamespace, type K8sPod, type K8sService } from "$lib/api/k8s";
  import Toast from "$lib/components/ui/feedback/toast.svelte";
  import NamespaceSelector from "$lib/components/NamespaceSelector.svelte";
  import { appStore, namespaceState } from '$lib/stores/app-store';
  import Button from "$lib/components/ui/button.svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
  import TopNavbar from "$lib/components/TopNavbar.svelte";

  // Dynamic data
  let isConnected = $state(false);
  let currentContext = $state("");
  let namespaces = $state<K8sNamespace[]>([]);
  let pods = $state<K8sPod[]>([]);
  let services = $state<K8sService[]>([]);
  let isLoading = $state(true);
  let isConnecting = $state(false);
  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Toast notifications
  let toastMessage = $state("");
  let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');
  let showToast = $state(false);

  // Cluster health status
  let clusterHealth = $state({
    apiServer: 'unknown',
    scheduler: 'unknown',
    controllerManager: 'unknown',
    etcd: 'unknown'
  });

  // Kubeconfig management
  // TODO: Implement kubeconfig management with file system access
  // This will allow users to add, remove, and switch between different kubeconfig files
  let availableKubeconfigs = $state<Array<{ path: string; name: string; status: string; type: string; contexts: string[] }>>([]);
  let showKubeconfigSection = $state(false);
  let selectedNamespace = $state($namespaceState.selected);
  let showContextModal = $state(false);
  let selectedContext = $state('');

  // Add cluster form
  let selectedClusterType = $state('GKE (Google Kubernetes Engine)');
  let kubeconfigFile = $state<File | null>(null);
  let isAddingCluster = $state(false);

  // Cluster metrics
  let totalPods = $derived(pods.length);
  let runningPods = $derived(pods.filter(pod => pod.status === 'Running').length);
  let failedPods = $derived(pods.filter(pod => pod.status === 'Failed' || pod.status === 'CrashLoopBackOff').length);
  let totalServices = $derived(services.length);
  let loadBalancers = $derived(services.filter(svc => svc.type_ === 'LoadBalancer').length);

  onMount(async () => {
    await loadData();
    // Live data is now handled by the liveDataStore
    // No more polling needed
  });

  async function loadData() {
    try {
      isLoading = true;
      
      // Check connection status
      isConnected = await k8sAPI.healthCheck();
      currentContext = "default"; // TODO: Implement context management
      
      if (isConnected) {
        // Load real data
        namespaces = await k8sAPI.getNamespaces();
        // For now, load pods and services from all namespaces
        const allPods: K8sPod[] = [];
        const allServices: K8sService[] = [];
        
        for (const ns of namespaces) {
          try {
            const nsPods = await k8sAPI.getPods(ns.name);
            const nsServices = await k8sAPI.getServices(ns.name);
            allPods.push(...nsPods);
            allServices.push(...nsServices);
          } catch (error) {
            console.warn(`Failed to load data for namespace ${ns.name}:`, error);
          }
        }
        
        pods = allPods;
        services = allServices;
        
        // Update cluster health based on real data
        updateClusterHealth();
        
        showNotification(`Loaded ${pods.length} pods and ${services.length} services`, "success");
      } else {
        // Clear data when disconnected
        namespaces = [];
        pods = [];
        services = [];
        clusterHealth = {
          apiServer: 'unknown',
          scheduler: 'unknown',
          controllerManager: 'unknown',
          etcd: 'unknown'
        };
      }
    } catch (error) {
      console.error("Failed to load cluster data:", error);
      showNotification("Failed to load cluster data", "error");
    } finally {
      isLoading = false;
    }
  }

  function updateClusterHealth() {
    // Simple health check based on data availability
    if (namespaces.length > 0) {
      clusterHealth.apiServer = 'healthy';
    } else {
      clusterHealth.apiServer = 'unhealthy';
    }
    
    if (pods.length > 0) {
      clusterHealth.scheduler = 'healthy';
    } else {
      clusterHealth.scheduler = 'unhealthy';
    }
    
    if (services.length > 0) {
      clusterHealth.controllerManager = 'healthy';
    } else {
      clusterHealth.controllerManager = 'unhealthy';
    }
    
    // ETCD health is harder to determine without direct API access
    clusterHealth.etcd = 'unknown';
  }

  function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    toastMessage = message;
    toastType = type;
    showToast = true;
    
    setTimeout(() => {
      showToast = false;
    }, 3000);
  }

  function handleRefresh() {
    loadData();
  }

  function handleNamespaceChange() {
    // The effect will handle reloading data when namespace changes
  }
</script>

<!-- Top Navigation Bar -->
<TopNavbar 
  pageTitle="Clusters" 
  pageDescription="Manage Kubernetes clusters and kubeconfigs" 
/>

<!-- Main Content -->
<div class="p-6">
  <!-- Connection Status Check -->
  {#if !isConnected}
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
        Connect to a Kubernetes cluster to view cluster data
      </p>
      <Button onclick={handleRefresh}>
        Connect to Kubernetes
      </Button>
    </div>
  {:else}
    <!-- Cluster Content -->
    <div class="space-y-6">
      <!-- Header with Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Cluster Status -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Cluster Status</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{isConnected ? 'Connected' : 'Disconnected'}</p>
            </div>
            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Context: {currentContext}
          </div>
        </div>

        <!-- Namespaces -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Namespaces</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{namespaces.length}</p>
            </div>
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Available namespaces
          </div>
        </div>

        <!-- Pods -->
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
            <span class="text-red-600 dark:text-red-400">{failedPods} failed</span>
          </div>
        </div>

        <!-- Services -->
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
          <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {loadBalancers} LoadBalancers
          </div>
        </div>
      </div>

      <!-- Cluster Health -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">Cluster Health</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {#each Object.entries(clusterHealth) as [component, status]}
            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <span class="text-sm font-medium text-slate-900 dark:text-white capitalize">
                {component.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
                status === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                status === 'unhealthy' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }">
                {status}
              </span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Toast Notification -->
{#if showToast}
  <Toast 
    title={toastType === 'error' ? 'Error' : toastType === 'success' ? 'Success' : toastType === 'warning' ? 'Warning' : 'Info'}
    description={toastMessage}
    variant={toastType === 'error' ? 'error' : toastType === 'success' ? 'success' : toastType === 'warning' ? 'warning' : 'default'}
  />
{/if}


