<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
  import { LoadingState, EmptyState } from '$lib/components/ui/display/index.js';
  import LogEntryCompact from './LogEntryCompact.svelte';
  import type { K8sLog } from '$lib/types/k8s';

  let { 
    logs = [], 
    loading = false, 
    className = "" 
  } = $props<{
    logs?: K8sLog[];
    loading?: boolean;
    className?: string;
  }>();
</script>

<Card className={className}>
  <CardHeader>
    <CardTitle>Logs</CardTitle>
    <CardDescription>
      {logs.length > 0 ? `${logs.length} log entries found` : 'No logs found'}
    </CardDescription>
  </CardHeader>
  <CardContent>
    {#if loading}
      <LoadingState message="Loading logs..." />
    {:else if logs.length === 0}
      <EmptyState 
        title="No logs found"
        description="Try adjusting your search criteria or filters."
        icon="📋"
      />
    {:else}
      <div class="space-y-2">
        {#each logs as log}
          <LogEntryCompact {log} />
        {/each}
      </div>
    {/if}
  </CardContent>
</Card>
