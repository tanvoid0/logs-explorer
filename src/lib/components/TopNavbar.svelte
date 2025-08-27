<script lang="ts">
  import { appStore, connectionState, preferences } from '$lib/stores/app-store';
  import ConnectionStatus from './ConnectionStatus.svelte';

  // Props
  let { pageTitle = "", pageDescription = "" } = $props<{
    pageTitle?: string;
    pageDescription?: string;
  }>();

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

      <!-- Right: Connection Status -->
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
    </div>
  </div>
</header>
