<script lang="ts">
  import { appStore, connectionState, preferences } from '$lib/stores/app-store';
  import ConnectionStatus from './ConnectionStatus.svelte';
  import { page } from '$app/stores';

  // Props
  let { pageTitle = "", pageDescription = "" } = $props<{
    pageTitle?: string;
    pageDescription?: string;
  }>();

  // Determine if connection status should be shown based on current route
  const shouldShowConnectionStatus = $derived.by(() => {
    const path = $page.url.pathname;
    // Only show connection status on Kubernetes-related pages
    return path.startsWith('/workloads') || 
           path.startsWith('/clusters') || 
           path.startsWith('/overview') ||
           path === '/';
  });

  async function handleConnect() {
    await appStore.connect();
  }

  async function handleDisconnect() {
    await appStore.disconnect();
  }
</script>

<header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
  <div class="px-6 py-4">
    <div class="flex items-center justify-between">
      <!-- Left: Page Title -->
      <div class="flex items-center">
        {#if pageTitle}
          <div>
            <h1 class="text-xl font-semibold text-slate-900 dark:text-white">
              {pageTitle}
            </h1>
            {#if pageDescription}
              <p class="text-sm text-slate-600 dark:text-slate-400">
                {pageDescription}
              </p>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Right: Connection Status (only on relevant pages) -->
      {#if shouldShowConnectionStatus}
        <div class="flex items-center space-x-4">
          <ConnectionStatus 
            connectionState={{
              ...$connectionState,
              autoConnectEnabled: $preferences.autoConnect
            }}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      {/if}
    </div>
  </div>
</header>
