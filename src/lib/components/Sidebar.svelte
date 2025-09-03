<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from "svelte";
  import { browser } from '$app/environment';
  import { Sidebar } from "$lib/components/ui/layout";
  import Button from "$lib/components/ui/button.svelte";
  import NamespaceSelector from "$lib/components/NamespaceSelector.svelte";
  import { k8sAPI, type K8sNamespace } from "$lib/api/k8s";
  import { appStore, connectionState, namespaceState } from "$lib/stores/app-store";
  import { toastStore } from "$lib/stores/toast-store";
  import { IconButton, Heading, Text, Container } from "$lib/components/ui";
  
  // Loading state
  let isLoading = $state(false);
  
  // Collapsible state
  let isCollapsed = $state(false);

  // Navigation items
  const navigationItems = [
    { name: 'Overview', href: '/overview', icon: '📊' },
    { name: 'Logs', href: '/logs', icon: '📋' },
    { name: 'Workloads', href: '/workloads', icon: '☸️' },
    { name: 'Tasks', href: '/tasks', icon: '✅' },
    { name: 'Projects', href: '/projects', icon: '📁' },
    { name: 'Documents', href: '/documents', icon: '📄' },
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

  function handleNamespaceChange(namespace: string) {
    console.log('Sidebar: Received namespace change event:', namespace);
    
    // The appStore.setSelectedNamespace is already called in the NamespaceSelector
    // so we don't need to call it again here
    
    if (namespace) {
      toastStore.success(`Switched to namespace: ${namespace}`);
    } else {
      toastStore.info('Cleared namespace selection');
    }
  }
  
  function toggleCollapse() {
    isCollapsed = !isCollapsed;
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

<!-- Sidebar component - just the sidebar, no layout wrapper -->
<aside class="bg-slate-800 text-white h-full flex flex-col transition-all duration-300 ease-in-out {isCollapsed ? 'w-16' : 'w-64'}">
  <!-- Header -->
  <Container variant="header" className="p-4 border-b border-slate-700">
    <div class="flex items-center {isCollapsed ? 'justify-center' : 'space-x-2'}">
      <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span class="text-white font-bold text-sm">LE</span>
      </div>
      {#if !isCollapsed}
        <div>
          <Heading level="h1" variant="emphasized" className="text-lg">Logs Explorer</Heading>
          <Text variant="muted" className="text-xs">The Kubernetes IDE</Text>
        </div>
      {/if}
    </div>
  </Container>

  <!-- Navigation Controls -->
  <Container variant="header" className="p-3 border-b border-slate-700">
    <div class="flex items-center {isCollapsed ? 'justify-center' : 'space-x-2'}">
      {#if !isCollapsed}
        <IconButton
          variant="ghost"
          size="sm"
          onclick={goBack}
          disabled={!canGoBack}
          title="Go Back"
          aria-label="Go Back"
          className="w-8 h-8 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </IconButton>
        
        <IconButton
          variant="ghost"
          size="sm"
          onclick={goForward}
          disabled={!canGoForward}
          title="Go Forward"
          aria-label="Go Forward"
          className="w-8 h-8 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </IconButton>
        
        <div class="flex-1"></div>
        
        <IconButton
          variant="ghost"
          size="sm"
          onclick={() => navigateTo('/overview')}
          title="Go to Overview"
          aria-label="Go to Overview"
          className="w-8 h-8 bg-slate-700 hover:bg-slate-600"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </IconButton>
      {/if}
      
      <!-- Collapse toggle button - always visible -->
      <button
        onclick={toggleCollapse}
        class="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center transition-colors"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {#if isCollapsed}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        {/if}
      </button>
    </div>
  </Container>
  
      <!-- Navigation Items -->
    <div class="flex-1 overflow-y-auto py-4">
      <div class="px-4">
        {#if !isCollapsed}
          <Heading level="h2" variant="muted" className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Navigation
          </Heading>
        {/if}
        
        <ul class="space-y-1">
          {#each navigationItems as item}
            <li>
              <!-- Navigation Item -->
              <Button
                variant="ghost"
                onclick={() => navigateTo(item.href)}
                className="w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-slate-700 {isActive(item.href) ? 'bg-slate-700 text-white' : 'text-slate-300'}"
                title={isCollapsed ? item.name : ''}
              >
                <div class="flex items-center space-x-3">
                  <span class="text-lg">{item.icon}</span>
                  {#if !isCollapsed}
                    <span class="font-medium">{item.name}</span>
                  {/if}
                </div>
              </Button>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  
      <!-- Footer with Connection Status and Namespace Selector -->
    {#if !isCollapsed}
      <Container variant="header" className="p-4 border-t border-slate-700 space-y-4">
        <!-- Connection Status -->
        <div class="space-y-2">
          <Heading level="h3" variant="muted" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Connection
          </Heading>
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
              <Button 
                onclick={handleRefresh}
                disabled={isLoading}
                variant="default"
                size="sm"
                className="w-full flex items-center justify-center px-3 py-2 text-xs"
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
              </Button>
            </div>
          {/if}
        </div>

        <!-- Namespace Selector -->
        {#if $connectionState.isConnected}
          <div class="space-y-2">
            <Heading level="h3" variant="muted" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Namespace
            </Heading>
            <div class="bg-slate-700/50 rounded-lg p-3">
              {#if $namespaceState.available.length > 0}
                <NamespaceSelector 
                  namespaces={$namespaceState.available.map(name => ({ name, status: 'Active', age: '' }))}
                  selectedNamespace={$namespaceState.selected}
                  disabled={!$connectionState.isConnected}
                  variant="sidebar"
                  onNamespaceChange={handleNamespaceChange}
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
            <Button 
              variant="ghost"
              size="sm"
              onclick={handleRefresh}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-3 py-2 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            </Button>
          </div>
        {/if}
      </Container>
    {:else}
      <!-- Collapsed footer - just connection status indicator -->
      <div class="mt-auto p-2 border-t border-slate-700">
        {#if $connectionState.isConnected}
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse mx-auto" title="Connected to Kubernetes"></div>
        {:else}
          <div class="w-2 h-2 rounded-full bg-red-400 mx-auto" title="Disconnected from Kubernetes"></div>
        {/if}
      </div>
    {/if}
</aside>
