<script lang="ts">
  import { StatusIndicator } from '$lib/components/ui/status/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  const { clusterHealth = {
    apiServer: 'unknown',
    scheduler: 'unknown',
    controllerManager: 'unknown',
    etcd: 'unknown'
  }, className = "" } = $props<{
    clusterHealth?: {
      apiServer: string;
      scheduler: string;
      controllerManager: string;
      etcd: string;
    };
    className?: string;
  }>();

  function getHealthStatus(status: string) {
    switch (status) {
      case 'healthy':
        return { text: 'Healthy', variant: 'success' as const };
      case 'warning':
        return { text: 'Warning', variant: 'warning' as const };
      case 'error':
        return { text: 'Error', variant: 'error' as const };
      default:
        return { text: 'Unknown', variant: 'offline' as const };
    }
  }

  function formatComponentName(component: string): string {
    return component.replace(/([A-Z])/g, ' $1').trim();
  }
</script>

<Card className={className}>
  <CardHeader>
    <CardTitle>Cluster Health</CardTitle>
  </CardHeader>
  <CardContent>
    <div class="space-y-4">
      {#each Object.entries(clusterHealth) as [component, status] (component)}
        {@const health = getHealthStatus(status as string)}
        <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
          <span class="text-sm font-medium text-slate-900 dark:text-white capitalize">
            {formatComponentName(component)}
          </span>
          <StatusIndicator 
            status={health.variant}
            size="sm"
          />
        </div>
      {/each}
    </div>
  </CardContent>
</Card>
