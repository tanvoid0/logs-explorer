<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import Button from '$lib/components/ui/button.svelte';

  const { isOpen = false, title = "", description = "", size = "default", showCloseButton = true, className = "" } = $props<{isOpen?: boolean; title?: string; description?: string; size?: "sm" | "default" | "lg" | "xl" ; showCloseButton?: boolean; className?: string }>();

  const dispatch = createEventDispatcher();

  const sizeClasses = {
    sm: "max-w-md",
    default: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl"
  };

  function handleClose() {
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
</script>

{#if isOpen}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 {className}"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <Card className="w-full {sizeClasses[size as keyof typeof sizeClasses]} max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
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
              class="h-8 w-8 p-0"
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
        <slot />
      </CardContent>
    </Card>
  </div>
{/if}
