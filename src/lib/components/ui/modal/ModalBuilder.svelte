<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  interface ModalAction {
    key: string;
    label: string;
    variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    primary?: boolean;
  }

  const { 
    isOpen = false, 
    title = "", 
    description = "", 
    size = "default", 
    showCloseButton = true, 
    showBackdrop = true, 
    closeOnBackdropClick = true, 
    closeOnEscape = true, 
    actions = [], 
    loading = false, 
    className = "" 
  } = $props<{
    isOpen?: boolean;
    title?: string;
    description?: string;
    size?: "sm" | "default" | "lg" | "xl" | "full";
    showCloseButton?: boolean;
    showBackdrop?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
    actions?: ModalAction[];
    loading?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  const sizeClasses = {
    sm: "max-w-md",
    default: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4"
  };

  function handleClose() {
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (closeOnBackdropClick && event.key === 'Enter' && event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (closeOnEscape && event.key === 'Escape') {
      handleClose();
    }
  }

  function handleAction(actionKey: string) {
    dispatch('action', { action: actionKey });
  }

  function getPrimaryAction() {
    return actions.find((action: ModalAction) => action.primary) || actions[0];
  }

  function getSecondaryActions() {
    return actions.filter((action: ModalAction) => !action.primary);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center {showBackdrop ? 'bg-black bg-opacity-50' : ''} p-4 {className}"
    onclick={handleBackdropClick}
    onkeydown={handleBackdropKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <Card className="w-full {sizeClasses[size as keyof typeof sizeClasses]} max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <CardTitle>{title}</CardTitle>
            {#if description}
              <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
            {/if}
          </div>
          {#if showCloseButton}
            <Button 
              variant="ghost" 
              size="sm"
              onclick={handleClose}
              class="h-8 w-8 p-0 ml-4"
              disabled={loading}
            >
              <span class="sr-only">Close</span>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </Button>
          {/if}
        </div>
      </CardHeader>
      
      <CardContent>
        {#if loading}
          <div class="flex items-center justify-center py-8">
            <div class="w-8 h-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
            <span class="ml-2 text-slate-600 dark:text-slate-400">Loading...</span>
          </div>
        {:else}
          <slot />
        {/if}
      </CardContent>

      {#if actions.length > 0}
        <div class="flex items-center justify-end gap-3 p-6 pt-0 border-t border-slate-200 dark:border-slate-700">
          {#each getSecondaryActions() as action}
            <Button
              variant={action.variant || 'outline'}
              size={action.size || 'default'}
              disabled={action.disabled || loading}
              loading={action.loading}
              onclick={() => handleAction(action.key)}
            >
              {action.label}
            </Button>
          {/each}
          
          {#if getPrimaryAction()}
            {@const primaryAction = getPrimaryAction()}
            <Button
              variant={primaryAction.variant || 'default'}
              size={primaryAction.size || 'default'}
              disabled={primaryAction.disabled || loading}
              loading={primaryAction.loading}
              onclick={() => handleAction(primaryAction.key)}
            >
              {primaryAction.label}
            </Button>
          {/if}
        </div>
      {/if}
    </Card>
  </div>
{/if}
