<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { Container } from '$lib/components/ui/layout/index.js';
  import LogEntryCompact from './LogEntryCompact.svelte';
  import type { K8sLog } from '$lib/types/k8s';

  let { 
    logs = [], 
    title = "Logs", 
    loading = false, 
    error = null, 
    className = "" 
  } = $props<{
    logs?: K8sLog[];
    title?: string;
    loading?: boolean;
    error?: string | null;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleFilterBySeverity(event: CustomEvent) {
    dispatch('filterBySeverity', event.detail);
  }

  function handleFilterByPod(event: CustomEvent) {
    dispatch('filterByPod', event.detail);
  }
</script>

<Container maxWidth="full" className={className}>
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {#if loading}
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100"></div>
        </div>
      {:else if error}
        <div class="text-red-600 dark:text-red-400 text-center py-8">
          {error}
        </div>
      {:else if logs.length === 0}
        <div class="text-slate-500 dark:text-slate-400 text-center py-8">
          No logs found
        </div>
      {:else}
        <div class="space-y-2 max-h-96 overflow-y-auto">
          {#each logs as log (log.timestamp + log.pod + log.message)}
            <LogEntryCompact 
              {log}
              on:filterBySeverity={handleFilterBySeverity}
              on:filterByPod={handleFilterByPod}
            />
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
</Container>
