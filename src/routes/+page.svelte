<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  
  // Reusable components
  import DashboardTabs from "$lib/components/DashboardTabs.svelte";
  import ConnectionStatus from "$lib/components/ConnectionStatus.svelte";
  import MetricCard from "$lib/components/MetricCard.svelte";
  import MetricsChart from "$lib/components/MetricsChart.svelte";

  
  // Services and stores
  import { k8sAPI, type K8sNamespace, type K8sService, type K8sLog, type K8sDeployment } from "$lib/api/k8s";
  import { appStore, connectionState, namespaceState, preferences } from "$lib/stores/app-store";


  import { toastStore } from "$lib/stores/toast-store";

  // Tab navigation
  type DashboardTab = 'analytics' | 'metrics';
  let activeTab = $state<DashboardTab>('analytics');



  // Analytics data - loaded on demand
  let analyticsData = $state({
    totalPods: 0,
    runningPods: 0,
    totalServices: 0,
    clusterIPServices: 0,
    loadBalancerServices: 0,
    nodePortServices: 0,
    totalRequests: 0,
    responseTime: 0,
    errorRate: 0,
    activeUsers: 0,
    networkInbound: 0,
    networkOutbound: 0
  });

  // Loading states for on-demand data
  let isAnalyticsLoading = $state(false);

  onMount(async () => {
    // Load initial data if already connected
    if ($connectionState.isConnected) {
      await loadInitialData();
    }
  });

  async function loadInitialData() {
    try {
      console.log('Loading initial data...');
      
      // Check connection status first
      if (!$connectionState.isConnected) {
        console.log('Not connected, attempting to connect...');
        const success = await appStore.connect();
        if (!success) {
          console.log('Failed to connect to Kubernetes');
          return;
        }
      }
      
      // Load only namespaces - essential for navigation
      await appStore.loadNamespaces();
      console.log("Loaded namespaces through appStore");
      
      // Don't load deployments or analytics data upfront
      // These will be loaded on-demand when user clicks specific tabs
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  }

  async function loadAnalyticsData() {
    try {
      if (!$namespaceState.selected) return;
      
      isAnalyticsLoading = true;
      
      const pods = await k8sAPI.getPods($namespaceState.selected);
      const services = await k8sAPI.getServices($namespaceState.selected);
      
      analyticsData = {
        totalPods: pods.length,
        runningPods: pods.filter((pod: any) => pod.status === 'Running').length,
        totalServices: services.length,
        clusterIPServices: services.filter((service: any) => service.type_ === 'ClusterIP').length,
        loadBalancerServices: services.filter((service: any) => service.type_ === 'LoadBalancer').length,
        nodePortServices: services.filter((service: any) => service.type_ === 'NodePort').length,
        totalRequests: 0,
        responseTime: 0,
        errorRate: 0,
        activeUsers: 0,
        networkInbound: 0,
        networkOutbound: 0
      };
    } catch (error) {
      console.error("Failed to load analytics data:", error);
      toastStore.error("Failed to load analytics data");
    } finally {
      isAnalyticsLoading = false;
    }
  }

  // Connection functions
  async function connectToK8s() {
    try {
      const success = await appStore.connect();
      if (success) {
        await loadInitialData();
      }
    } catch (error) {
      console.error('Failed to connect to Kubernetes:', error);
    }
  }

  async function disconnectFromK8s() {
    try {
      await appStore.disconnect();
      // Clear data when disconnected
      analyticsData = {
        totalPods: 0,
        runningPods: 0,
        totalServices: 0,
        clusterIPServices: 0,
        loadBalancerServices: 0,
        nodePortServices: 0,
        totalRequests: 0,
        responseTime: 0,
        errorRate: 0,
        activeUsers: 0,
        networkInbound: 0,
        networkOutbound: 0
      };
    } catch (error) {
      console.error('Failed to disconnect from Kubernetes:', error);
    }
  }





  // Tab navigation functions
  function handleTabChange(event: CustomEvent<{tab: DashboardTab}>) {
    activeTab = event.detail.tab;
    
    // Load data for the selected tab on-demand
    if (activeTab === 'analytics' && $connectionState.isConnected) {
      loadAnalyticsData();
    }
    // Note: Metrics tab currently shows placeholder until server integration is implemented
  }

  // Show error toast when there's an error (if needed in future)
  // $effect(() => {
  //   if (errorState) {
  //     toastStore.error(errorState);
  //   }
  // });
</script>

<div class="flex-1 flex flex-col min-h-0">
  <!-- Header -->
  <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
    <div class="px-6 py-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-semibold text-slate-900 dark:text-white">
            Dashboard
          </h1>
        </div>
        
        <ConnectionStatus 
          connectionState={{
            ...$connectionState,
            autoConnectEnabled: $preferences.autoConnect
          }}
          onConnect={connectToK8s}
          onDisconnect={disconnectFromK8s}
        />
      </div>

      <!-- Tab Navigation -->
      <DashboardTabs {activeTab} on:tabChange={handleTabChange} />
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto p-6 min-h-0">
    {#if activeTab === 'analytics'}
      <!-- Analytics Tab -->
      <div class="max-w-7xl mx-auto">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Analytics Dashboard</h2>
          <p class="text-slate-600 dark:text-slate-400">Real-time analytics and performance insights</p>
        </div>

        {#if !$connectionState.isConnected}
          <div class="text-center py-12">
            <p class="text-slate-600 dark:text-slate-400 mb-4">
              Connect to a Kubernetes cluster to view analytics.
            </p>
          </div>
        {:else}
          <!-- Load Analytics Button -->
          {#if analyticsData.totalPods === 0 && analyticsData.totalServices === 0}
            <div class="text-center py-12">
              <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 max-w-md mx-auto">
                <div class="text-slate-400 dark:text-slate-500 mb-4">
                  <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Load Analytics Data
                </h3>
                <p class="text-slate-500 dark:text-slate-400 mb-6">
                  Click the button below to load cluster analytics and metrics.
                </p>
                <button
                  onclick={loadAnalyticsData}
                  disabled={isAnalyticsLoading}
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {#if isAnalyticsLoading}
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  {:else}
                    <svg class="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Load Analytics
                  {/if}
                </button>
              </div>
            </div>
          {:else}
            <!-- Key Metrics - Show when data is loaded -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Pods"
                metric={{ value: analyticsData.totalPods, unit: '', change: 0, changeType: 'stable', timestamp: new Date() }}
                icon="📦"
                iconBgColor="bg-blue-100 dark:bg-blue-900"
              />
              
              <MetricCard
                title="Running Pods"
                metric={{ value: analyticsData.runningPods, unit: '', change: 0, changeType: 'stable', timestamp: new Date() }}
                icon="✅"
                iconBgColor="bg-green-100 dark:bg-green-900"
              />
              
              <MetricCard
                title="Total Services"
                metric={{ value: analyticsData.totalServices, unit: '', change: 0, changeType: 'stable', timestamp: new Date() }}
                icon="🔗"
                iconBgColor="bg-purple-100 dark:bg-purple-900"
              />
              
              <MetricCard
                title="Load Balancers"
                metric={{ value: analyticsData.loadBalancerServices, unit: '', change: 0, changeType: 'stable', timestamp: new Date() }}
                icon="⚖️"
                iconBgColor="bg-yellow-100 dark:bg-yellow-900"
              />
            </div>
          {/if}
        {/if}

        <!-- Performance Charts - Only show when connected and have data -->
        {#if $connectionState.isConnected && (analyticsData.totalPods > 0 || analyticsData.totalServices > 0)}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Pod Status Distribution</h3>
              <div class="text-center py-8">
                <p class="text-slate-600 dark:text-slate-400">
                  Pod status metrics will be available when connected to a cluster with running pods.
                </p>
              </div>
            </div>
            
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Service Types</h3>
              <div class="text-center py-8">
                <p class="text-slate-600 dark:text-slate-400">
                  Service type distribution will be available when connected to a cluster with services.
                </p>
              </div>
            </div>
          </div>
        {/if}
      </div>

    {:else if activeTab === 'metrics'}
      <!-- Metrics Tab -->
      <!-- TODO: Implement real Kubernetes metrics integration with metrics-server or Prometheus -->
      <!-- This section is hidden until proper server-side metrics API is implemented -->
      <div class="max-w-7xl mx-auto">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Kubernetes Metrics</h2>
          <p class="text-slate-600 dark:text-slate-400">Real-time cluster metrics and monitoring data</p>
        </div>

        <div class="text-center py-12">
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 max-w-md mx-auto">
            <div class="text-slate-400 dark:text-slate-500 mb-4">
              <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Metrics Coming Soon
            </h3>
            <p class="text-slate-500 dark:text-slate-400 mb-4">
              Real-time cluster metrics will be available once integrated with Kubernetes metrics-server or Prometheus.
            </p>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              This feature requires server-side implementation
            </p>
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>




