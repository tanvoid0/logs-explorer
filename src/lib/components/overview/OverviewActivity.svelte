<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { EmptyState } from '$lib/components/ui/display/index.js';

  const { activities = [], className = "" } = $props<{
    activities?: Array<{
      type: 'connection' | 'warning' | 'error' | 'search' | 'namespace';
      message: string;
      timestamp: Date;
      severity: 'info' | 'warning' | 'error' | 'success';
    }>;
    className?: string;
  }>();

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  }

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      default: return 'ℹ';
    }
  }

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
</script>

<Card className={className}>
  <CardHeader>
    <CardTitle>Recent Activity</CardTitle>
  </CardHeader>
  <CardContent>
    {#if activities.length === 0}
      <EmptyState 
        title="No recent activity"
        description="Activity will appear here as you interact with the cluster."
        icon="📊"
      />
    {:else}
      <div class="space-y-3">
        {#each activities as activity}
          <div class="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
            <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
              <span class="text-sm font-bold {getSeverityColor(activity.severity)}">
                {getSeverityIcon(activity.severity)}
              </span>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-slate-900 dark:text-white">
                {activity.message}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </CardContent>
</Card>
