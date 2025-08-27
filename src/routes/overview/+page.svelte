<script lang="ts">
  import { onMount } from "svelte";
  import { k8sAPI, type K8sNamespace, type K8sPod, type K8sService } from "$lib/api/k8s";
  import { appStore, connectionState, namespaceState } from "$lib/stores/app-store";
  import { toastStore } from "$lib/stores/toast-store";

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
      // Add error to recent activity
      addActivity('error', 'Failed to load cluster data', 'error');
    } finally {
      isLoading = false;
    }
  }

  function updateRecentActivity() {
    const now = new Date();
    
    // Add connection activity
    if (isConnected && recentActivity.length === 0) {
      addActivity('connection', `Connected to cluster: ${currentContext}`, 'success');
    }
    
    // Add namespace activity
    if (namespaces.length > 0) {
      addActivity('namespace', `Loaded ${namespaces.length} namespaces`, 'info');
    }
    
    // Add cluster status activity
    if (isConnected) {
      addActivity('connection', `Cluster status: ${clusterStatus}`, 'success');
    }
  }

  function addActivity(type: 'connection' | 'warning' | 'error' | 'search' | 'namespace', message: string, severity: 'info' | 'warning' | 'error' | 'success') {
    recentActivity = [
      {
        type,
        message,
        timestamp: new Date(),
        severity
      },
      ...recentActivity.slice(0, 9) // Keep only last 10 activities
    ];
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  }

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      default: return 'ℹ';
    }
  }

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
</script>

<div class="w-full">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Kubernetes Overview</h1>
    <p class="text-slate-600 dark:text-slate-400">Real-time cluster status and resource overview</p>
  </div>

  <!-- Connection Status -->
  <div class="mb-8">
    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}"></div>
            <span class="text-lg font-semibold text-slate-900 dark:text-white">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {#if currentContext}
            <span class="text-sm text-slate-600 dark:text-slate-400">({currentContext})</span>
          {/if}
        </div>
        
        <div class="flex items-center space-x-4">
          <span class="text-sm text-slate-600 dark:text-slate-400">
            Last updated: {formatTimeAgo(new Date())}
          </span>
          <button
            onclick={loadData}
            disabled={isLoading}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {#if isLoading}
              <svg class="animate-spin h-4 w-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            {:else}
              Refresh
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Key Metrics -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Namespaces</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{totalNamespaces}</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <span class="text-2xl">📁</span>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Active Clusters</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{activeClusters}</p>
        </div>
        <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
          <span class="text-2xl">☸️</span>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Current Namespace</p>
          <p class="text-lg font-bold text-slate-900 dark:text-white truncate">{currentNamespace}</p>
        </div>
        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <span class="text-2xl">🎯</span>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Cluster Status</p>
          <p class="text-lg font-bold {isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">{clusterStatus}</p>
        </div>
        <div class="w-12 h-12 {isConnected ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} rounded-lg flex items-center justify-center">
          <span class="text-2xl">{isConnected ? '✅' : '❌'}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
    <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
    
    {#if recentActivity.length === 0}
      <div class="text-center py-8">
        <p class="text-slate-500 dark:text-slate-400">No recent activity</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each recentActivity as activity}
          <div class="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
            <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
              <span class="text-sm font-bold {getSeverityColor(activity.severity)}">
                {getSeverityIcon(activity.severity)}
              </span>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-slate-900 dark:text-white">{activity.message}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
