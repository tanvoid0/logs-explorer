<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from "$lib/components/ui/button.svelte";
  
  export let isConnected: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  function handleRecentLogs() {
    dispatch('quickAction', { 
      type: 'recent',
      config: { logCount: 100, isLiveMode: false, isStaticMode: true }
    });
  }
  
  function handleErrorLogs() {
    dispatch('quickAction', { 
      type: 'error',
      config: { logCount: 50, searchQuery: 'ERROR', isLiveMode: false, isStaticMode: true }
    });
  }
  
  function handleKubernetesLogs() {
    dispatch('quickAction', { 
      type: 'kubernetes',
      config: { logCount: 100, searchQuery: 'kube', isLiveMode: false, isStaticMode: true }
    });
  }
</script>

<div class="mb-8">
  <h2 class="text-lg font-medium text-slate-900 dark:text-white mb-4">Quick Actions</h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Button 
      variant="outline" 
      className="h-20 flex flex-col items-center justify-center"
      onclick={handleRecentLogs}
      disabled={!isConnected}
    >
      <span class="text-lg font-medium">View Recent Logs</span>
      <span class="text-sm text-slate-500">Last 24 hours</span>
    </Button>
    <Button 
      variant="outline" 
      className="h-20 flex flex-col items-center justify-center"
      onclick={handleErrorLogs}
      disabled={!isConnected}
    >
      <span class="text-lg font-medium">Error Logs</span>
      <span class="text-sm text-slate-500">Severity: ERROR</span>
    </Button>
    <Button 
      variant="outline" 
      className="h-20 flex flex-col items-center justify-center"
      onclick={handleKubernetesLogs}
      disabled={!isConnected}
    >
      <span class="text-lg font-medium">Kubernetes</span>
      <span class="text-sm text-slate-500">Cluster logs</span>
    </Button>
  </div>
</div>
