<script lang="ts">
  import { StatusIndicator } from '$lib/components/ui/status/index.js';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { Card, CardContent } from '$lib/components/ui/card/index.js';

  const { 
    isConnected = false, 
    currentContext = "", 
    isLoading = false, 
    lastUpdated = new Date(), 
    className = "",
    onRefresh
  } = $props<{
    isConnected?: any;
    currentContext?: any;
    isLoading?: any;
    lastUpdated?: any;
    className?: any;
    onRefresh?: () => void;
  }>();

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  function handleRefresh() {
    onRefresh?.();
  }
</script>

<Card className={className}>
  <CardContent className="p-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <StatusIndicator 
          status={isConnected ? 'online' : 'offline'}
          showLabel={true}
        />
        {#if currentContext}
          <span class="text-sm text-slate-600 dark:text-slate-400">({currentContext})</span>
        {/if}
      </div>
      
      <div class="flex items-center space-x-4">
        <span class="text-sm text-slate-600 dark:text-slate-400">
          Last updated: {formatTimeAgo(lastUpdated)}
        </span>
        <ActionButton 
          action="refresh"
          onclick={handleRefresh}
        />
      </div>
    </div>
  </CardContent>
</Card>
