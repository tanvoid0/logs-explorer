<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import TopNavbar from "$lib/components/TopNavbar.svelte";
  import ToastContainer from "$lib/components/ToastContainer.svelte";
  import { page } from "$app/stores";
  import { derived } from "svelte/store";
  import { appStore } from "$lib/stores/app-store";

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
      case "/tasks":
        return { title: "Task Manager", description: "Organize tasks with groups and subtasks" };
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

  onMount(async () => {
    console.log('App starting up...');
    // Attempt to connect to cluster on app startup (only if autoConnect is enabled)
    const state = $appStore;
    if (state.preferences.autoConnect && !state.connection.hasAttemptedConnection) {
      await appStore.connect();
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
