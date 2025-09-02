<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ActionButton } from '$lib/components/ui/action/index.js';

  const { title = "", icon = "", total = 0, metrics = [], description = "", actionLabel = "", actionRoute = "", isLoading = false, className = "" } = $props<{title?: any; icon?: any; total?: any; metrics?: Array<{ label: string; value: number; color: string }> ; description?: any; actionLabel?: any; actionRoute?: any; isLoading?: any; className?: any }>();

  const dispatch = createEventDispatcher();

  function handleViewDetails() {
    if (actionRoute) {
      dispatch('navigate', { route: actionRoute });
    } else {
      dispatch('viewDetails');
    }
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 {className}">
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center">
      <span class="text-2xl mr-3">{icon}</span>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
    </div>
    <span class="text-2xl font-bold text-slate-900 dark:text-white">
      {isLoading ? '...' : total}
    </span>
  </div>
  
  <div class="space-y-2">
    {#each metrics as metric}
      <div class="flex justify-between text-sm">
        <span class="text-slate-600 dark:text-slate-400">{metric.label}:</span>
        <span class="{metric.color}">
          {isLoading ? '...' : metric.value}
        </span>
      </div>
    {/each}
  </div>
  
  {#if description}
    <p class="text-xs text-slate-500 dark:text-slate-400 mt-4">
      {description}
    </p>
  {/if}
  
  {#if actionLabel}
    <ActionButton 
      action="add"
      label={actionLabel}
      variant="outline"
      size="sm"
      className="w-full mt-4"
      onclick={handleViewDetails}
    />
  {/if}
</div>
