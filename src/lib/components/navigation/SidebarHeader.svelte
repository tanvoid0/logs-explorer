<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/index.js';
  import { connectionState } from '$lib/stores/app-store';
  import { toastStore } from '$lib/stores/toast-store';

  const { className = "" } = $props<{className?: string}>();

  const dispatch = createEventDispatcher();

  function handleConnect() {
    dispatch('connect');
  }

  function handleDisconnect() {
    dispatch('disconnect');
  }

  function handleRefresh() {
    dispatch('refresh');
  }
</script>

<div class="p-4 border-b border-slate-200 dark:border-slate-700 {className}">
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span class="text-white font-bold text-sm">K8s</span>
      </div>
      <div>
        <h1 class="text-lg font-semibold text-slate-900 dark:text-white">
          Logs Explorer
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Kubernetes Management
        </p>
      </div>
    </div>

    <div class="flex items-center space-x-2">
      <!-- Connection Status -->
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 rounded-full {$connectionState.isConnected ? 'bg-green-500' : 'bg-red-500'}"></div>
        <span class="text-xs text-slate-600 dark:text-slate-400">
          {$connectionState.isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <!-- Connection Actions -->
      <div class="flex items-center space-x-1">
        {#if $connectionState.isConnected}
          <Button
            onclick={handleRefresh}
            variant="outline"
            size="sm"
            class="px-2 py-1 text-xs"
            title="Refresh connection"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </Button>
          <Button
            onclick={handleDisconnect}
            variant="outline"
            size="sm"
            class="px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Disconnect"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </Button>
        {:else}
          <Button
            onclick={handleConnect}
            size="sm"
            class="px-2 py-1 text-xs"
            title="Connect to Kubernetes"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </Button>
        {/if}
      </div>
    </div>
  </div>
</div>
