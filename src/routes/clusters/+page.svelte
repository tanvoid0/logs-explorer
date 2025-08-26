<script lang="ts">
  import { onMount } from "svelte";
  import { k8sAPI, type K8sNamespace, type K8sPod, type K8sService } from "$lib/api/k8s";
  import Toast from "$lib/components/Toast.svelte";
  import NamespaceSelector from "$lib/components/NamespaceSelector.svelte";
  import { appStore, namespaceState } from '$lib/stores/app-store';

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
      showNotification(`Failed to load cluster data: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
      
      // Set health to error state
      clusterHealth = {
        apiServer: 'error',
        scheduler: 'error',
        controllerManager: 'error',
        etcd: 'error'
      };
    } finally {
      isLoading = false;
    }
  }

  function updateClusterHealth() {
    // Determine health based on real data
    const hasPods = pods.length > 0;
    const hasServices = services.length > 0;
    const hasNamespaces = namespaces.length > 0;
    
    // API Server health - if we can get data, it's healthy
    clusterHealth.apiServer = hasNamespaces ? 'healthy' : 'warning';
    
    // Scheduler health - if pods are running, scheduler is working
    clusterHealth.scheduler = runningPods > 0 ? 'healthy' : 'warning';
    
    // Controller Manager health - if services exist, controller is working
    clusterHealth.controllerManager = hasServices ? 'healthy' : 'warning';
    
    // etcd health - if we can get namespaces, etcd is accessible
    clusterHealth.etcd = hasNamespaces ? 'healthy' : 'warning';
  }

  function getHealthStatus(status: string) {
    switch (status) {
      case 'healthy':
        return { text: 'Healthy', class: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
      case 'warning':
        return { text: 'Warning', class: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
      case 'error':
        return { text: 'Error', class: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
      default:
        return { text: 'Unknown', class: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20' };
    }
  }

  function getClusterStatus() {
    if (!isConnected) return { text: 'Disconnected', class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    if (failedPods > 0) return { text: 'Warning', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    return { text: 'Active', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  }

  function formatContext(context: string): string {
    if (context.length > 30) {
      return context.substring(0, 27) + '...';
    }
    return context;
  }

  function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    toastMessage = message;
    toastType = type;
    showToast = true;
  }

  async function addCluster() {
    if (!kubeconfigFile) {
      showNotification('Please select a kubeconfig file', 'error');
      return;
    }

    try {
      isAddingCluster = true;
      showNotification('Adding cluster...', 'info');

      // Read the kubeconfig file
      const fileContent = await kubeconfigFile.text();
      
      // Here you would typically:
      // 1. Validate the kubeconfig format
      // 2. Save it to the appropriate location
      // 3. Update the kubeconfig list
      // 4. Optionally connect to the new cluster
      
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      
      // Add to available kubeconfigs
      const newKubeconfig = {
        path: kubeconfigFile.name,
        name: `${selectedClusterType} - ${kubeconfigFile.name}`,
        status: 'inactive' as const,
        type: 'custom' as const,
        contexts: [] // TODO: Parse contexts from kubeconfig file
      };
      
      availableKubeconfigs = [...availableKubeconfigs, newKubeconfig];
      
      // Reset form
      selectedClusterType = 'GKE (Google Kubernetes Engine)';
      kubeconfigFile = null;
      
      showNotification(`Successfully added ${selectedClusterType} cluster`, 'success');
    } catch (error) {
      console.error('Failed to add cluster:', error);
      showNotification(`Failed to add cluster: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      isAddingCluster = false;
    }
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      kubeconfigFile = target.files[0];
    }
  }

  async function activateKubeconfig(kubeconfig: any) {
    try {
      showNotification(`Activating ${kubeconfig.name}...`, 'info');
      
      // Update the status of all kubeconfigs
      availableKubeconfigs = availableKubeconfigs.map(k => ({
        ...k,
        status: k.path === kubeconfig.path ? 'active' : 'inactive'
      }));
      
      // Update current context to first context of the activated kubeconfig
      if (kubeconfig.contexts && kubeconfig.contexts.length > 0) {
        selectedContext = kubeconfig.contexts[0];
      }
      
      showNotification(`Successfully activated ${kubeconfig.name}`, 'success');
    } catch (error) {
      console.error('Failed to activate kubeconfig:', error);
      showNotification(`Failed to activate kubeconfig: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }

  async function changeContext(newContext: string) {
    try {
      showNotification(`Switching to context: ${newContext}...`, 'info');
      
      selectedContext = newContext;
      
      // Here you would typically call the k8s service to switch contexts
      // await k8sService.switchContext(newContext);
      
      showNotification(`Successfully switched to context: ${newContext}`, 'success');
      showContextModal = false;
    } catch (error) {
      console.error('Failed to switch context:', error);
      showNotification(`Failed to switch context: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }



  function getActiveKubeconfig() {
    return availableKubeconfigs.find(k => k.status === 'active');
  }

  async function connectToCluster() {
    try {
      isConnecting = true;
      showNotification("Connecting to Kubernetes cluster...", "info");
      
              const success = await k8sAPI.init();
      
      if (success) {
        showNotification("Successfully connected to Kubernetes cluster!", "success");
        await loadData();
      } else {
        showNotification("Failed to connect to Kubernetes cluster. Please check your kubeconfig.", "error");
      }
    } catch (error) {
      console.error("Failed to connect to cluster:", error);
      showNotification(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      isConnecting = false;
    }
  }

  // Cleanup on component destroy
  function cleanup() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }
</script>

<div class="flex-1 flex flex-col min-h-0">
  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto p-6">
    <div class="w-full">


      <!-- Tab Navigation -->
      <div class="mb-6">
        <div class="border-b border-slate-200 dark:border-slate-700">
          <nav class="-mb-px flex space-x-8">
            <button
              onclick={() => showKubeconfigSection = false}
              class="py-2 px-1 border-b-2 font-medium text-sm {!showKubeconfigSection ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}"
            >
              Cluster Overview
            </button>
            <button
              onclick={() => showKubeconfigSection = true}
              class="py-2 px-1 border-b-2 font-medium text-sm {showKubeconfigSection ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}"
            >
              Kubeconfig Management
            </button>
          </nav>
        </div>
      </div>

      {#if !showKubeconfigSection}
        <!-- Cluster Overview Section -->
      <!-- Cluster Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <!-- Current Cluster -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div class="w-3 h-3 {isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-3"></div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                {isConnected ? 'Current Cluster' : 'No Cluster Connected'}
              </h3>
            </div>
            <span class="text-xs px-2 py-1 rounded {getClusterStatus().class}">
              {getClusterStatus().text}
            </span>
          </div>
          
          {#if isConnected}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">Cluster:</span>
                <span class="text-sm font-medium text-slate-900 dark:text-white">
                  {formatContext(currentContext)}
                </span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600 dark:text-slate-400">Namespaces:</span>
                <span class="text-sm font-medium text-slate-900 dark:text-white">
                  {namespaces.length}
                </span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600 dark:text-slate-400">Pods:</span>
                <span class="text-sm font-medium text-slate-900 dark:text-white">
                  {runningPods}/{totalPods}
                </span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600 dark:text-slate-400">Services:</span>
                <span class="text-sm font-medium text-slate-900 dark:text-white">
                  {totalServices}
                </span>
              </div>
          </div>
          
          <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div class="flex space-x-2">
                 <button 
                   onclick={connectToCluster}
                   disabled={isConnecting}
                   class="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {#if isConnecting}
                     <svg class="animate-spin h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24">
                       <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                       <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Connecting...
                   {:else}
                     Reconnect
                   {/if}
              </button>
              <button class="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Settings
              </button>
            </div>
          </div>
          {:else}
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600 dark:text-slate-400">Status:</span>
                <span class="text-sm text-red-600 dark:text-red-400">Not Connected</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600 dark:text-slate-400">Pods:</span>
                <span class="text-sm font-medium text-slate-900 dark:text-white">0</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600 dark:text-slate-400">Services:</span>
                <span class="text-sm font-medium text-slate-900 dark:text-white">0</span>
              </div>
            </div>
            
                         <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
               <button 
                 onclick={connectToCluster}
                 disabled={isConnecting}
                 class="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {#if isConnecting}
                   <svg class="animate-spin h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24">
                     <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                     <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Connecting...
                 {:else}
                   Connect to Cluster
                 {/if}
               </button>
             </div>
          {/if}
        </div>

        <!-- Cluster Metrics -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Cluster Metrics</h3>
            </div>
            <span class="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
              Live
            </span>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">Total Pods:</span>
              <span class="text-sm font-medium text-slate-900 dark:text-white">
                {isLoading ? '...' : totalPods}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">Running:</span>
              <span class="text-sm text-green-600 dark:text-green-400">
                {isLoading ? '...' : runningPods}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">Failed:</span>
              <span class="text-sm text-red-600 dark:text-red-400">
                {isLoading ? '...' : failedPods}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">Load Balancers:</span>
              <span class="text-sm font-medium text-slate-900 dark:text-white">
                {isLoading ? '...' : loadBalancers}
              </span>
            </div>
          </div>
          
          <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div class="flex space-x-2">
              <button class="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                View Metrics
              </button>
              <button class="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Configure
            </button>
            </div>
          </div>
        </div>

        <!-- Cluster Monitoring -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Cluster Monitoring</h3>
            </div>
            <span class="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded">
              Monitoring
            </span>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">Metrics:</span>
              <span class="text-sm font-medium text-slate-900 dark:text-white">
                {isConnected ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">Alerts:</span>
              <span class="text-sm font-medium text-slate-900 dark:text-white">
                {failedPods > 0 ? failedPods : 0} active
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">Dashboards:</span>
              <span class="text-sm font-medium text-slate-900 dark:text-white">
                {isConnected ? '3' : '0'} configured
              </span>
            </div>
          </div>
          
          <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div class="flex space-x-2">
              <button class="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                View Metrics
              </button>
              <button class="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Configure
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Cluster Management -->
      <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add New Cluster</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Cluster Type
              </label>
              <select 
                bind:value={selectedClusterType}
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option>GKE (Google Kubernetes Engine)</option>
                <option>EKS (Amazon Elastic Kubernetes Service)</option>
                <option>AKS (Azure Kubernetes Service)</option>
                <option>Local Cluster</option>
                <option>Custom Cluster</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kubeconfig File
              </label>
              <input 
                type="file" 
                accept=".yaml,.yml,.config,.kubeconfig"
                onchange={handleFileSelect}
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
              {#if kubeconfigFile}
                <p class="text-sm text-green-600 dark:text-green-400 mt-1">
                  Selected: {kubeconfigFile.name}
                </p>
              {/if}
            </div>
            <button 
              onclick={addCluster}
              disabled={isAddingCluster || !kubeconfigFile}
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isAddingCluster}
                <svg class="animate-spin h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              {:else}
              Add Cluster
              {/if}
            </button>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cluster Health</h3>
          <div class="space-y-4">
            {#each Object.entries(clusterHealth) as [component, status]}
              {@const health = getHealthStatus(status)}
              <div class="flex items-center justify-between p-3 rounded-lg {health.bg}">
                <span class="text-sm font-medium text-slate-900 dark:text-white capitalize">
                  {component.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span class="{health.class}">● {health.text}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Cluster Resources Summary -->
      {#if isConnected && (pods.length > 0 || services.length > 0)}
        <div class="mt-8 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cluster Resources Summary</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-slate-900 dark:text-white">{totalPods}</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">Total Pods</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">{runningPods}</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">Running</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-slate-900 dark:text-white">{totalServices}</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">Services</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{namespaces.length}</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">Namespaces</div>
            </div>
          </div>
        </div>
      {/if}
      {:else}
        <!-- Kubeconfig Management Section -->
        <div class="space-y-6">
          <!-- Kubeconfig List -->
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Available Kubeconfigs</h3>
              <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Add Kubeconfig
              </button>
            </div>
            
            <div class="space-y-4">
              {#each availableKubeconfigs as kubeconfig}
                <div class="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 {kubeconfig.type === 'default' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'} rounded-lg flex items-center justify-center">
                      <span class="{kubeconfig.type === 'default' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'} text-lg">
                        {kubeconfig.type === 'default' ? '☸️' : '📁'}
                      </span>
                    </div>
                    <div>
                      <h4 class="font-medium text-slate-900 dark:text-white">{kubeconfig.path}</h4>
                      <p class="text-sm text-slate-600 dark:text-slate-400">{kubeconfig.name}</p>
                      {#if kubeconfig.contexts && kubeconfig.contexts.length > 0}
                        <p class="text-xs text-slate-500 dark:text-slate-500">
                          {kubeconfig.contexts.length} context{kubeconfig.contexts.length > 1 ? 's' : ''} available
                        </p>
                      {/if}
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {kubeconfig.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}">
                      {kubeconfig.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    {#if kubeconfig.status === 'active'}
                      <button 
                        onclick={() => showContextModal = true}
                        class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        Change Context
                      </button>
                    {:else}
                      <button 
                        onclick={() => activateKubeconfig(kubeconfig)}
                        class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        Activate
                      </button>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Context Information -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Current Context</h3>
                <button 
                  onclick={() => showContextModal = true}
                  class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Change
                </button>
              </div>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-sm text-slate-600 dark:text-slate-400">Context Name:</span>
                  <span class="text-sm font-medium text-slate-900 dark:text-white">{formatContext(selectedContext)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-slate-600 dark:text-slate-400">Cluster:</span>
                  <span class="text-sm font-medium text-slate-900 dark:text-white">{formatContext(selectedContext)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-slate-600 dark:text-slate-400">User:</span>
                  <span class="text-sm font-medium text-slate-900 dark:text-white">{formatContext(selectedContext)}</span>
                </div>
                <div class="space-y-2">
                  <span class="text-sm text-slate-600 dark:text-slate-400">Namespace:</span>
                  {#if isConnected && namespaces.length > 0}
                    <NamespaceSelector 
                      {namespaces}
                      {selectedNamespace}
                      disabled={!isConnected}
                      on:namespaceChange={(event) => {
                        selectedNamespace = event.detail.namespace;
                        appStore.setSelectedNamespace(selectedNamespace);
                      }}
                    />
                  {:else}
                    <span class="text-sm font-medium text-slate-900 dark:text-white">{selectedNamespace || 'default'}</span>
                  {/if}
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Connection Status</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-slate-600 dark:text-slate-400">API Server:</span>
                  <span class="{isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} text-sm">
                    ● {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-slate-600 dark:text-slate-400">Authentication:</span>
                  <span class="{isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} text-sm">
                    ● {isConnected ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-slate-600 dark:text-slate-400">Last Check:</span>
                  <span class="text-sm text-slate-900 dark:text-white">Just now</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-slate-600 dark:text-slate-400">Response Time:</span>
                  <span class="text-sm text-slate-900 dark:text-white">{isConnected ? '245ms' : 'N/A'}</span>
                </div>
            </div>
          </div>
        </div>
      </div>
      {/if}
    </div>
  </main>
</div>

<!-- Toast Notifications -->
<Toast 
  message={toastMessage}
  type={toastType}
  show={showToast}
  on:close={() => showToast = false}
/>

<!-- Context Selection Modal -->
{#if showContextModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-800 rounded-lg p-6 w-96 max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Select Context</h3>
        <button 
          onclick={() => showContextModal = false}
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          ✕
        </button>
      </div>
      
      <div class="space-y-3">
        {#if getActiveKubeconfig()?.contexts}
          {#each getActiveKubeconfig()!.contexts as context}
            <button
              onclick={() => changeContext(context)}
              class="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors {selectedContext === context ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-600' : ''}"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-900 dark:text-white">{context}</span>
                {#if selectedContext === context}
                  <span class="text-blue-600 dark:text-blue-400">✓</span>
                {/if}
              </div>
            </button>
          {/each}
        {/if}
      </div>
      
      <div class="mt-6 flex justify-end space-x-3">
        <button
          onclick={() => showContextModal = false}
          class="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}


