<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { Card, CardContent } from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/feedback/index.js';
  import type { Framework } from '$lib/api/frameworks';

  const { 
    framework = null, 
    className = "" 
  } = $props<{
    framework?: Framework;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleToggleActive() {
    if (framework) {
      dispatch('toggleActive', { id: framework.id });
    }
  }

  function handleDelete() {
    if (framework) {
      dispatch('delete', { id: framework.id });
    }
  }

  function handleEdit() {
    if (framework) {
      dispatch('edit', { framework });
    }
  }
</script>

<Card className={className}>
  <CardContent className="p-6">
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <h3 class="text-xl font-semibold text-slate-900 dark:text-white">
            {framework?.name}
          </h3>
          <Badge 
            variant={framework?.is_active ? 'success' : 'secondary'}
            label={framework?.is_active ? 'Active' : 'Inactive'}
          />
        </div>
        
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Category: {framework?.category}
        </p>
        
        {#if framework?.description}
          <p class="text-slate-700 dark:text-slate-300 mb-2">
            {framework.description}
          </p>
        {/if}
        
        <div class="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
          {#if framework?.version}
            <span>Version: {framework.version}</span>
          {/if}
          {#if framework?.website}
            <a 
              href={framework.website} 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Website
            </a>
          {/if}
          {#if framework?.documentation_url}
            <a 
              href={framework.documentation_url} 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Documentation
            </a>
          {/if}
        </div>
      </div>
      
      <div class="flex gap-2">
        <ActionButton
          action="edit"
          label={framework?.is_active ? 'Deactivate' : 'Activate'}
          variant={framework?.is_active ? 'destructive' : 'default'}
          size="sm"
          onclick={handleToggleActive}
        />
        <ActionButton
          action="delete"
          label="Delete"
          variant="destructive"
          size="sm"
          onclick={handleDelete}
        />
      </div>
    </div>
  </CardContent>
</Card>
