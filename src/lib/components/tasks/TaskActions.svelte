<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ActionButton } from '$lib/components/ui/action/index.js';

  const { showAddGroup = false, className = "" } = $props<{showAddGroup?: any; className?: any }>();

  const dispatch = createEventDispatcher();

  const actions = [
    { action: 'add' as const, label: 'New Task Group' },
    { action: 'refresh' as const },
    { action: 'export' as const }
  ];

  function handleAction(event: CustomEvent) {
    const { action } = event.detail;
    dispatch('action', { action });
  }
</script>

<div class={className}>
  <div class="flex gap-2">
    {#each actions as action}
      <ActionButton
        action={action.action}
        label={action.label}
        onclick={() => dispatch('action', { action: action.action })}
      />
    {/each}
  </div>
</div>
