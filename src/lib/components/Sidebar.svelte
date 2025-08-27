<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from "svelte";
  import { browser } from '$app/environment';
  import Button from "$lib/components/ui/button.svelte";
  import NamespaceSelector from "$lib/components/NamespaceSelector.svelte";
  import { k8sAPI, type K8sNamespace } from "$lib/api/k8s";
  import { appStore, connectionState, namespaceState } from "$lib/stores/app-store";
  import { toastStore } from "$lib/stores/toast-store";
  
  // Loading state
  let isLoading = false;

  // Navigation items
  const navigationItems = [
    { name: 'Overview', href: '/overview', icon: '📊' },
    { name: 'Logs', href: '/logs', icon: '📋' },
    { name: 'Workloads', href: '/workloads', icon: '☸️' },
    { name: 'Tasks', href: '/tasks', icon: '✅' },
    { name: 'Projects', href: '/projects', icon: '📁' },
    { name: 'SDK Manager', href: '/sdk-manager', icon: '🔧' },
    { name: 'Settings', href: '/settings', icon: '⚙️' }
  ];

  onMount(() => {
    // Load initial data if already connected
    if ($connectionState.isConnected) {
      loadNamespacesData();
    }

    // Add keyboard shortcuts for navigation
    if (browser) {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Alt + Left Arrow for back
        if (event.altKey && event.key === 'ArrowLeft') {
          event.preventDefault();
          goBack();
        }
        // Alt + Right Arrow for forward
        if (event.altKey && event.key === 'ArrowRight') {
          event.preventDefault();
          goForward();
        }
        // Alt + Home for overview
        if (event.altKey && event.key === 'Home') {
          event.preventDefault();
          navigateTo('/overview');
        }
        // Alt + L for logs
        if (event.altKey && event.key === 'l') {
          event.preventDefault();
          navigateTo('/logs');
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      // Cleanup
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  });

  // Watch for connection changes
  $effect(() => {
    if ($connectionState.isConnected) {
      console.log('Sidebar: Connection state changed to connected');
      loadNamespacesData();
    }
  });

  let isLoadingNamespaces = false;
  
  async function loadNamespacesData() {
    // Prevent multiple simultaneous namespace loads
    if (isLoadingNamespaces) {
      console.log('Sidebar: Namespaces already loading, skipping...');
      return;
    }
    
    try {
      isLoadingNamespaces = true;
      console.log('Sidebar: Loading namespaces via appStore...');
      await appStore.loadNamespaces();
    } catch (error) {
      console.error('Sidebar: Failed to load namespaces:', error);
      toastStore.error('Failed to load namespaces');
    } finally {
      isLoadingNamespaces = false;
    }
  }

  async function handleRefresh() {
    try {
      isLoading = true;
      toastStore.info("Refreshing context and namespaces...");
      
      // Check connection status first
      if (!$connectionState.isConnected) {
        toastStore.info("Attempting to connect to Kubernetes...");
        const success = await appStore.connect();
        if (!success) {
          toastStore.error("Failed to connect to Kubernetes. Please check your kubeconfig.");
          return;
        }
      }
      
      // Reload namespaces
      await loadNamespacesData();
      
      // Reload default namespace if not set
      if (!$namespaceState.selected && $namespaceState.available.length > 0) {
        const defaultNamespace = $namespaceState.available.find(ns => ns === 'default') || $namespaceState.available[0];
        if (defaultNamespace) {
          appStore.setSelectedNamespace(defaultNamespace);
          toastStore.success(`Set default namespace to: ${defaultNamespace}`);
        }
      }
      
      toastStore.success("Context refreshed successfully!");
    } catch (error) {
      console.error('Failed to refresh context:', error);
      toastStore.error(`Failed to refresh: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isLoading = false;
    }
  }

  function handleNamespaceChange(event: CustomEvent<{namespace: string}>) {
    const namespace = event.detail.namespace;
    console.log('Sidebar: Received namespace change event:', namespace);
    
    // The appStore.setSelectedNamespace is already called in the NamespaceSelector
    // so we don't need to call it again here
    
    if (namespace) {
      toastStore.success(`Switched to namespace: ${namespace}`);
    } else {
      toastStore.info('Cleared namespace selection');
    }
  }
  
  function isActive(route: string): boolean {
    const currentPath = $page.url.pathname;
    
    // Exact match
    if (currentPath === route) {
      return true;
    }
    
    // For parent routes, check if current path starts with the route
    if (route !== '/' && currentPath.startsWith(route)) {
      return true;
    }
    
    return false;
  }
  
  function navigateTo(route: string) {
    goto(route);
  }

  // Navigation history management
  let canGoBack = $state(false);
  let canGoForward = $state(false);
  let navigationHistory = $state<string[]>([]);
  let currentHistoryIndex = $state(-1);

  // Check navigation state
  function updateNavigationState() {
    if (browser) {
      // Basic check for back navigation
      canGoBack = window.history.length > 1;
      
      // For forward navigation, we'll track it manually
      canGoForward = currentHistoryIndex < navigationHistory.length - 1;
    }
  }

  // Navigation functions
  function goBack() {
    if (browser && canGoBack) {
      window.history.back();
    }
  }

  function goForward() {
    if (browser && canGoForward) {
      window.history.forward();
    }
  }

  // Track navigation history
  $effect(() => {
    if (browser) {
      const currentPath = $page.url.pathname;
      
      // Add to history if it's a new path
      if (navigationHistory.length === 0 || navigationHistory[currentHistoryIndex] !== currentPath) {
        // Remove any forward history if we navigated to a new page
        if (currentHistoryIndex < navigationHistory.length - 1) {
          navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
        }
        
        navigationHistory = [...navigationHistory, currentPath];
        currentHistoryIndex = navigationHistory.length - 1;
      }
      
      updateNavigationState();
    }
  });
</script>

<nav class="w-64 bg-slate-800 text-white h-full flex flex-col">
  <!-- Header -->
  <div class="p-4 border-b border-slate-700">
    <div class="flex items-center space-x-2">
      <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span class="text-white font-bold text-sm">LE</span>
      </div>
      <div>
        <h1 class="text-lg font-semibold">Logs Explorer</h1>
        <p class="text-xs text-slate-400">The Kubernetes IDE</p>
      </div>
    </div>
  </div>

  <!-- Navigation Controls -->
  <div class="p-3 border-b border-slate-700">
    <div class="flex items-center space-x-2">
      <button
        onclick={goBack}
        disabled={!canGoBack}
        class="flex items-center justify-center w-8 h-8 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Go Back"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button
        onclick={goForward}
        disabled={!canGoForward}
        class="flex items-center justify-center w-8 h-8 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Go Forward"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      <div class="flex-1"></div>
      
      <button
        onclick={() => navigateTo('/overview')}
        class="flex items-center justify-center w-8 h-8 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
        title="Go to Overview"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Navigation Items -->
  <div class="flex-1 overflow-y-auto py-4">
    <div class="px-4">
      <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Navigation
      </h2>
      
      <ul class="space-y-1">
        {#each navigationItems as item}
          <li>
            <!-- Navigation Item -->
            <button
              onclick={() => navigateTo(item.href)}
              class="w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-slate-700 {isActive(item.href) ? 'bg-slate-700 text-white' : 'text-slate-300'}"
            >
              <div class="flex items-center space-x-3">
                <span class="text-lg">{item.icon}</span>
                <span class="font-medium">{item.name}</span>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
  
  <!-- Footer with Connection Status and Namespace Selector -->
  <div class="p-4 border-t border-slate-700 space-y-4">
    <!-- Connection Status -->
    <div class="space-y-2">
      <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Connection
      </div>
      {#if $connectionState.isConnected}
        <div class="flex items-center space-x-2 bg-green-900/30 px-3 py-2 rounded-lg border border-green-700/50">
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-green-300 truncate">
              {$connectionState.currentContext || 'Kubernetes'}
            </div>
            <div class="text-xs text-green-400">Connected</div>
          </div>
        </div>
      {:else}
        <div class="space-y-2">
          <div class="flex items-center space-x-2 bg-red-900/30 px-3 py-2 rounded-lg border border-red-700/50">
            <div class="w-2 h-2 rounded-full bg-red-400"></div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-red-300">Disconnected</div>
              <div class="text-xs text-red-400">No cluster connection</div>
            </div>
          </div>
          <button 
            onclick={handleRefresh}
            disabled={isLoading}
            class="w-full flex items-center justify-center px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isLoading}
              <svg class="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            {:else}
              <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Connect to Cluster
            {/if}
          </button>
        </div>
      {/if}
    </div>

    <!-- Namespace Selector -->
    {#if $connectionState.isConnected}
      <div class="space-y-2">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Namespace
        </div>
        <div class="bg-slate-700/50 rounded-lg p-3">
          {#if $namespaceState.available.length > 0}
            <NamespaceSelector 
              namespaces={$namespaceState.available.map(name => ({ name, status: 'Active', age: '' }))}
              selectedNamespace={$namespaceState.selected}
              disabled={!$connectionState.isConnected}
              variant="sidebar"
              on:namespaceChange={handleNamespaceChange}
            />
          {:else}
            <div class="text-sm text-slate-400">
              Loading namespaces... ({$namespaceState.available.length} available)
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Refresh Button - Compact -->
    {#if $connectionState.isConnected}
      <div class="pt-1">
        <button 
          onclick={handleRefresh}
          disabled={isLoading}
          class="w-full flex items-center justify-center px-3 py-2 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isLoading}
            <svg class="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Refreshing...
          {:else}
            <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Context ({$namespaceState.available.length} namespaces)
          {/if}
        </button>
      </div>
    {/if}
  </div>
</nav>
