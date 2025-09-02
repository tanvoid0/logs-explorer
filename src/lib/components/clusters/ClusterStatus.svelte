<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { StatusIndicator } from '$lib/components/ui/status/index.js';
  import { ActionButton } from '$lib/components/ui/action/index.js';

  const { isConnected = false, isConnecting = false, currentContext = "", clusterHealth = {
    apiServer: 'unknown',
    scheduler: 'unknown',
    controllerManager: 'unknown',
    etcd: 'unknown'
  }, className = "" } = $props<{
    isConnected?: boolean;
    isConnecting?: boolean;
    currentContext?: string;
    clusterHealth?: {
      apiServer: string;
      scheduler: string;
      controllerManager: string;
      etcd: string;
    };
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function getHealthStatus(status: string) {
    switch (status) {
      case 'healthy':
        return { text: 'Healthy', variant: 'success' as const };
      case 'warning':
        return { text: 'Warning', variant: 'warning' as const };
      case 'error':
        return { text: 'Error', variant: 'destructive' as const };
      default:
        return { text: 'Unknown', variant: 'secondary' as const };
    }
  }

  function getClusterStatus() {
    if (!isConnected) return { text: 'Disconnected', variant: 'error' as const };
    return { text: 'Active', variant: 'success' as const };
  }

  function handleConnect() {
    dispatch('connect');
  }

  function handleRefresh() {
    dispatch('refresh');
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 {className}">
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center">
      <div class="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Cluster Status</h3>
    </div>
    <StatusIndicator 
      status={getClusterStatus().variant}
    />
  </div>
  
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-sm text-slate-600 dark:text-slate-400">Connection:</span>
      <span class="{isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} text-sm">
        ● {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
    {#if currentContext}
      <div class="flex items-center justify-between">
        <span class="text-sm text-slate-600 dark:text-slate-400">Context:</span>
        <span class="text-sm font-medium text-slate-900 dark:text-white">{currentContext}</span>
      </div>
    {/if}
    <div class="flex items-center justify-between">
      <span class="text-sm text-slate-600 dark:text-slate-400">Last Check:</span>
      <span class="text-sm text-slate-900 dark:text-white">Just now</span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm text-slate-600 dark:text-slate-400">Response Time:</span>
      <span class="text-sm text-slate-900 dark:text-white">{isConnected ? '245ms' : 'N/A'}</span>
    </div>
  </div>
  
  <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
    <div class="flex space-x-2">
      <ActionButton 
        action="add"
        label="Connect to Cluster"
        disabled={isConnecting}
        onclick={handleConnect}
      />
      <ActionButton 
        action="refresh"
        onclick={handleRefresh}
      />
    </div>
  </div>
</div>
