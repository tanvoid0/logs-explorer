<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Badge } from '$lib/components/ui/feedback/index.js';
  import type { K8sLog } from '$lib/types/k8s';

  let { 
    log, 
    showTimestamp = true, 
    showPod = true, 
    showSeverity = true, 
    className = "" 
  } = $props<{
    log: K8sLog;
    showTimestamp?: boolean;
    showPod?: boolean;
    showSeverity?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function getSeverityColor(severity: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
    const s = severity?.toUpperCase();
    switch (s) {
      case 'ERROR': case 'FATAL': case 'CRITICAL':
        return 'destructive';
      case 'WARN': case 'WARNING':
        return 'warning';
      case 'INFO': case 'INFORMATION':
        return 'default';
      case 'DEBUG': case 'TRACE':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  function handleSeverityClick(severity: string) {
    dispatch('filterBySeverity', { severity });
  }

  function handlePodClick(pod: string) {
    dispatch('filterByPod', { pod });
  }
</script>

<div class="flex items-center space-x-2 text-sm {className}">
  {#if showTimestamp}
    <span class="text-slate-500 dark:text-slate-400 font-mono text-xs">
      {formatTimestamp(log.timestamp)}
    </span>
  {/if}

  {#if showSeverity}
    <button
      onclick={() => handleSeverityClick(log.level)}
      class="cursor-pointer hover:opacity-80"
    >
      <Badge 
        variant={getSeverityColor(log.level)}
        size="sm"
      >
        {log.level}
      </Badge>
    </button>
  {/if}

  {#if showPod && log.pod}
    <span 
      class="text-slate-600 dark:text-slate-300 cursor-pointer hover:underline"
      onclick={() => handlePodClick(log.pod)}
    >
      {log.pod}
    </span>
  {/if}

  <span class="text-slate-900 dark:text-slate-100 flex-1 min-w-0">
    {log.message}
  </span>
</div>
