<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import TopNavbar from "$lib/components/TopNavbar.svelte";
  import ToastContainer from "$lib/components/ToastContainer.svelte";
  import { page } from "$app/stores";
  import { derived } from "svelte/store";
  import { appStore, connectionState } from "$lib/stores/app-store";
  import { toastStore } from "$lib/stores/toast-store";

  // Derive page title and description from current route
  const pageInfo = derived(page, ($page) => {
    const path = $page.url.pathname;
    
    switch (path) {
      case "/":
        return { title: "Dashboard", description: "Main dashboard and overview" };
      case "/overview":
        return { title: "Overview", description: "Kubernetes cluster overview and statistics" };
      case "/clusters":
        return { title: "Clusters", description: "Manage Kubernetes clusters and kubeconfigs" };
      case "/workloads":
        return { title: "Workloads", description: "Kubernetes workloads and resources" };
      case "/workloads/pods":
        return { title: "Pods", description: "Kubernetes pods management" };
      case "/projects":
        return { title: "Projects", description: "Manage local projects and development directories" };
      case "/sdk-manager":
        return { title: "SDK Manager", description: "Manage development tools and SDKs" };
      case "/settings":
        return { title: "Settings", description: "Application settings and configuration" };
      default:
        return { title: "", description: "" };
    }
  });

  // Auto-connect to Kubernetes on app startup (if enabled)
  let hasAttemptedConnection = false;
  
  onMount(async () => {
    console.log('App starting up...');
    
    // Wait a moment for the store to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Prevent multiple connection attempts
    if (hasAttemptedConnection) {
      console.log('Connection already attempted, skipping...');
      return;
    }
    
    // Check if auto-connect is enabled and we're not already connected
    if (!$connectionState.isConnected && !$connectionState.isConnecting) {
      hasAttemptedConnection = true;
      console.log('Auto-connect enabled, attempting to connect to Kubernetes...');
      
      try {
        // Attempt to connect automatically
        const success = await appStore.connect();
        if (success) {
          console.log('Successfully connected to Kubernetes on startup');
          toastStore.success('Connected to Kubernetes cluster');
        } else {
          console.log('Failed to connect to Kubernetes on startup');
          toastStore.info('Not connected to Kubernetes. Use the connection button to connect.');
        }
      } catch (error) {
        console.error('Error during startup connection attempt:', error);
        toastStore.info('Not connected to Kubernetes. Use the connection button to connect.');
      }
    } else {
      console.log('Auto-connect disabled or already connected, not attempting to connect');
    }
  });
</script>

<div class="flex h-screen bg-slate-50 dark:bg-slate-900">
  <Sidebar />
  <div class="flex-1 flex flex-col min-h-0">
    <TopNavbar pageTitle={$pageInfo.title} pageDescription={$pageInfo.description} />
    <div class="flex-1 overflow-y-auto">
      <slot />
    </div>
  </div>
</div>

<!-- Global Toast Container -->
<ToastContainer />
