<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const { 
    timestamp = "", 
    level = "info", 
    service = "", 
    pod = "", 
    namespace = "", 
    className = "" 
  } = $props<{
    timestamp?: string;
    level?: string;
    service?: string;
    pod?: string;
    namespace?: string;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warn': return 'text-yellow-600 dark:text-yellow-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      case 'debug': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }

  function getLevelBgColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'error': return 'bg-red-100 dark:bg-red-900/20';
      case 'warn': return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'info': return 'bg-blue-100 dark:bg-blue-900/20';
      case 'debug': return 'bg-gray-100 dark:bg-gray-900/20';
      default: return 'bg-gray-100 dark:bg-gray-900/20';
    }
  }
</script>

<div class="flex items-center justify-between text-sm {className}">
  <div class="flex items-center space-x-4">
    <span class="text-gray-500 dark:text-gray-400">{timestamp}</span>
    <span class="px-2 py-1 rounded text-xs font-medium {getLevelColor(level)} {getLevelBgColor(level)}">
      {level.toUpperCase()}
    </span>
    {#if service}
      <span class="text-gray-700 dark:text-gray-300 font-medium">{service}</span>
    {/if}
  </div>
  
  <div class="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
    {#if namespace}
      <span>{namespace}</span>
    {/if}
    {#if pod}
      <span>/</span>
      <span>{pod}</span>
    {/if}
  </div>
</div>
