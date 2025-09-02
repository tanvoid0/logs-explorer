<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { Separator } from '$lib/components/ui/layout/index.js';

  const { 
    actions = [], 
    orientation = 'horizontal', 
    size = "default", 
    showSeparators = false, 
    className = "" 
  } = $props<{
    actions?: Array<{
      action: 'add' | 'edit' | 'delete' | 'save' | 'cancel' | 'refresh' | 'download' | 'upload' | 'export' | 'import';
      label?: string;
      disabled?: boolean;
      loading?: boolean;
      variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    }>;
    orientation?: 'horizontal' | 'vertical';
    size?: "sm" | "default" | "lg";
    showSeparators?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleActionClick(action: string, index: number) {
    dispatch('action', { action, index });
  }
</script>

<div class="flex {orientation === 'vertical' ? 'flex-col' : 'flex-row'} items-center space-{orientation === 'vertical' ? 'y' : 'x'}-2 {className}">
  {#each actions as action, index}
    <Button
      variant={action.variant || 'outline'}
      {size}
      disabled={action.disabled}
      loading={action.loading}
      onclick={() => handleActionClick(action.action, index)}
    >
      {action.label || action.action}
    </Button>
    
    {#if showSeparators && index < actions.length - 1}
      <Separator orientation={orientation === 'vertical' ? 'horizontal' : 'vertical'} />
    {/if}
  {/each}
</div>
