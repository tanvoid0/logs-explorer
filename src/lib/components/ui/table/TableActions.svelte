<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { BaseSelector } from '$lib/components/ui/selector/index.js';

  const { 
    selectedItems = [], 
    totalItems = 0, 
    actions = [], 
    showBulkActions = true, 
    showSelectAll = true, 
    className = "" 
  } = $props<{
    selectedItems?: any[];
    totalItems?: number;
    actions?: Array<{
      key: string;
      label: string;
      action: 'add' | 'edit' | 'delete' | 'save' | 'refresh' | 'download' | 'upload' | 'export' | 'import';
      variant?: 'default' | 'outline' | 'destructive';
      size?: 'default' | 'sm' | 'lg';
      disabled?: boolean;
      bulkOnly?: boolean;
    }>;
    showBulkActions?: boolean;
    showSelectAll?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleAction(actionKey: string) {
    dispatch('action', { action: actionKey, items: selectedItems });
  }

  function handleSelectAll() {
    if (selectedItems.length === totalItems) {
      dispatch('selectAll', { selected: false });
    } else {
      dispatch('selectAll', { selected: true });
    }
  }

  function handleBulkAction(event: CustomEvent) {
    const action = event.detail.value;
    dispatch('bulkAction', { action, items: selectedItems });
  }

  function getBulkActionOptions() {
    return actions
      .filter((action: any) => action.bulkOnly)
      .map((action: any) => ({ value: action.key, label: action.label }));
  }

  function getIndividualActions() {
    return actions.filter((action: any) => !action.bulkOnly);
  }
</script>

<div class="flex items-center justify-between gap-4 {className}">
  <!-- Selection Info and Controls -->
  <div class="flex items-center gap-4">
    {#if showSelectAll && totalItems > 0}
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedItems.length === totalItems}
          indeterminate={selectedItems.length > 0 && selectedItems.length < totalItems}
          onchange={handleSelectAll}
          class="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
        />
        <span class="text-sm text-slate-600 dark:text-slate-400">
          {selectedItems.length} of {totalItems} selected
        </span>
      </div>
    {/if}

    {#if showBulkActions && selectedItems.length > 0}
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-600 dark:text-slate-400">Bulk actions:</span>
        <BaseSelector
          options={getBulkActionOptions()}
          selectedValues={[]}
          placeholder="Select action"
          size="sm"
          onchange={handleBulkAction}
        />
      </div>
    {/if}
  </div>

  <!-- Individual Action Buttons -->
  <div class="flex items-center gap-2">
    {#each getIndividualActions() as action}
      <ActionButton
        action={action.action}
        label={action.label}
        variant={action.variant || 'default'}
        size={action.size || 'sm'}
        disabled={action.disabled}
        onclick={() => handleAction(action.key)}
      />
    {/each}
  </div>
</div>
