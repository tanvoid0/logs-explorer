<script lang="ts">
  import { onMount } from "svelte";
  import { k8sAPI, type K8sNamespace, type K8sPod, type K8sService } from "$lib/api/k8s";
  import { appStore, connectionState, namespaceState } from "$lib/stores/app-store";
  import { toastStore } from "$lib/stores/toast-store";
  import TopNavbar from "$lib/components/TopNavbar.svelte";

  // Dynamic data
  let isConnected = $state(false);
  let currentContext = $state("");
  let namespaces = $state<K8sNamespace[]>([]);
  let pods = $state<K8sPod[]>([]);
  let services = $state<K8sService[]>([]);
  let isLoading = $state(false);
  let hasLoadedData = $state(false);

  // Computed statistics - showing relevant cluster metrics
  let totalNamespaces = $derived(namespaces.length);
  let currentNamespace = $derived($namespaceState.selected || 'None selected');
  let activeClusters = $derived(isConnected ? 1 : 0);
  let clusterStatus = $derived(isConnected ? 'Healthy' : 'Disconnected');

  // Recent activity
  let recentActivity = $state<Array<{
    type: 'connection' | 'warning' | 'error' | 'search' | 'namespace';
    message: string;
    timestamp: Date;
    severity: 'info' | 'warning' | 'error' | 'success';
  }>>([]);

  onMount(async () => {
    // Don't automatically load data - let user manually refresh when needed
    updateConnectionStatus();
  });

  // Reactive effect to update connection status when it changes
  $effect(() => {
    updateConnectionStatus();
  });

  function updateConnectionStatus() {
    isConnected = $connectionState.isConnected;
    currentContext = $connectionState.currentContext || "";
    
    if (isConnected && !hasLoadedData) {
      // Only load data if we're connected and haven't loaded yet
      loadData();
    } else if (!isConnected) {
      // Clear data when disconnected
      namespaces = [];
      pods = [];
      services = [];
      recentActivity = [];
      hasLoadedData = false;
    }
  }

  async function loadData() {
    try {
      // Ensure we're connected before attempting to load data
      const connected = await appStore.ensureConnected();
      if (!connected) {
        console.log('Overview: Not connected to Kubernetes, skipping data load');
        return;
      }

      isLoading = true;
      
      // Check connection status
      isConnected = await k8sAPI.healthCheck();
      currentContext = $connectionState.currentContext || "default";
      
      if (!isConnected) {
        toastStore.error("Failed to connect to Kubernetes. Please check your kubeconfig.");
        // Clear data when disconnected
        namespaces = [];
        pods = [];
        services = [];
        recentActivity = [];
        hasLoadedData = false;
        return;
      }
      
      // Load only namespace list - don't load pods/services automatically
      // This prevents the performance issue of loading ALL namespace data
      namespaces = await k8sAPI.getNamespaces();
      
      console.log(`Loaded ${namespaces.length} namespaces (pods/services not loaded automatically)`);
      
      // Initialize empty arrays - will be populated on-demand
      pods = [];
      services = [];
      
      // Update recent activity
      updateRecentActivity();
      
      hasLoadedData = true;
      toastStore.success('Overview data loaded successfully');
    } catch (error) {
      console.error("Failed to load overview data:", error);
      toastStore.error('Failed to load overview data');
    } finally {
      isLoading = false;
    }
  }

  function updateRecentActivity() {
    const now = new Date();
    
    // Add connection success
    recentActivity = [
      {
        type: 'connection',
        message: `Connected to cluster: ${currentContext}`,
        timestamp: now,
        severity: 'success'
      },
      {
        type: 'namespace',
        message: `Loaded ${namespaces.length} namespaces`,
        timestamp: now,
        severity: 'info'
      }
    ];
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
  pageTitle="Overview" 
  pageDescription="Kubernetes cluster overview and statistics" 
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
        Connect to a Kubernetes cluster to view overview data
      </p>
      <button
        onclick={handleRefresh}
        disabled={isLoading}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if isLoading}
          <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        {:else}
          Connect to Kubernetes
        {/if}
      </button>
    </div>
  {:else}
    <!-- Overview Content -->
    <div class="space-y-6">
      <!-- Header with Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Cluster Status -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Cluster Status</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{clusterStatus}</p>
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
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{totalNamespaces}</p>
            </div>
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
          </div>
          <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Current: {currentNamespace}
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">Recent Activity</h3>
        <div class="space-y-3">
          {#each recentActivity as activity}
            <div class="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div class="flex-shrink-0">
                {#if activity.severity === 'success'}
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                {:else if activity.severity === 'warning'}
                  <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                {:else if activity.severity === 'error'}
                  <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                {:else}
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                {/if}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-slate-900 dark:text-white">{activity.message}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {activity.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
