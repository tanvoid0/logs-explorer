<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  
  let { 
    isConnected = false,
    onQuickAction
  } = $props<{ 
    isConnected?: boolean;
    onQuickAction?: (type: string, config: any) => void;
  }>();
  
  function handleRecentLogs() {
    onQuickAction?.('recent', { 
      logCount: 100, 
      isLiveMode: false, 
      isStaticMode: true 
    });
  }
  
  function handleErrorLogs() {
    onQuickAction?.('error', { 
      logCount: 50, 
      searchQuery: 'ERROR', 
      isLiveMode: false, 
      isStaticMode: true 
    });
  }
  
  function handleKubernetesLogs() {
    onQuickAction?.('kubernetes', { 
      logCount: 100, 
      searchQuery: 'kube', 
      isLiveMode: false, 
      isStaticMode: true 
    });
  }
</script>

<div class="mb-8">
  <h2 class="text-lg font-medium text-slate-900 dark:text-white mb-4">Quick Actions</h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Button variant="outline" 
      class="h-20 flex flex-col items-center justify-center"
      onclick={handleRecentLogs}
      disabled={!isConnected}
    >
      <span class="text-lg font-medium">View Recent Logs</span>
      <span class="text-sm text-slate-500">Last 24 hours</span>
    </Button>
    <Button variant="outline" 
      class="h-20 flex flex-col items-center justify-center"
      onclick={handleErrorLogs}
      disabled={!isConnected}
    >
      <span class="text-lg font-medium">Error Logs</span>
      <span class="text-sm text-slate-500">Severity: ERROR</span>
    </Button>
    <Button variant="outline" 
      class="h-20 flex flex-col items-center justify-center"
      onclick={handleKubernetesLogs}
      disabled={!isConnected}
    >
      <span class="text-lg font-medium">Kubernetes</span>
      <span class="text-sm text-slate-500">Cluster logs</span>
    </Button>
  </div>
</div>
