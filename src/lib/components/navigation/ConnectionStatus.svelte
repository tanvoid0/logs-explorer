<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from "$lib/components/ui/button.svelte";
  import type { AppState } from "$lib/stores/app-store";
  
  // Define the connection state type that includes autoConnect
  type ConnectionStateWithAutoConnect = AppState['connection'] & { autoConnectEnabled: boolean };
  
  const { connectionState, onConnect, onDisconnect } = $props<{
    connectionState: ConnectionStateWithAutoConnect;
    onConnect: () => void;
    onDisconnect: () => void;
  }>();
  
  const dispatch = createEventDispatcher();
  
  function handleConnect() {
    dispatch('connect');
    onConnect();
  }
  
  function handleDisconnect() {
    dispatch('disconnect');
    onDisconnect();
  }
</script>

<div class="flex items-center space-x-4">
  <div class="flex items-center space-x-2">
    {#if connectionState.isConnected}
      <span class="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full flex items-center space-x-1">
        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span>Connected</span>
        {#if connectionState.currentContext}
          <span class="text-xs opacity-75">({connectionState.currentContext})</span>
        {/if}
      </span>
    {:else}
      <span class="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full flex items-center space-x-1">
        <div class="w-2 h-2 rounded-full bg-red-500"></div>
        <span>Disconnected</span>
      </span>
    {/if}
  </div>
  
  <Button 
    variant={connectionState.isConnected ? "outline" : "default"}
    onclick={connectionState.isConnected ? handleDisconnect : handleConnect}
    disabled={connectionState.isConnecting}
  >
    {#if connectionState.isConnecting}
      <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Connecting...
    {:else}
      {connectionState.isConnected ? 'Disconnect' : 'Connect to Kubernetes'}
    {/if}
  </Button>
</div>
