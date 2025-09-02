<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { Alert } from '$lib/components/ui/feedback/index.js';

  let { 
    isConnected = false, 
    selectedNamespace = "", 
    isLoading = false, 
    className = "" 
  } = $props<{
    isConnected?: boolean;
    selectedNamespace?: string;
    isLoading?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleConnect() {
    dispatch('connect');
  }

  function handleRefresh() {
    dispatch('refresh');
  }
</script>

{#if !isConnected}
  <Alert 
    variant="warning"
    className={className}
  >
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-medium">Not Connected</h3>
        <p class="text-sm">Not connected to Kubernetes. Connect to view workload data.</p>
      </div>
      <ActionButton 
        action="add"
        label="Connect"
        onclick={handleConnect}
      />
    </div>
  </Alert>
{:else if selectedNamespace}
  <div class="mb-6 flex items-center justify-between {className}">
    <div class="text-sm text-slate-600 dark:text-slate-400">
      Showing data for namespace: <span class="font-medium text-slate-900 dark:text-white">{selectedNamespace}</span>
    </div>
    <ActionButton 
      action="refresh"
      loading={isLoading}
      disabled={isLoading}
      onclick={handleRefresh}
    />
  </div>
{/if}
