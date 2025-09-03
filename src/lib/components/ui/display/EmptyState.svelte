<script lang="ts">
  import { cn } from "$lib/utils/index";
  import Button from "../button.svelte";

  const { 
    title = "No data found", 
    description = "There are no items to display at the moment.", 
    icon = "📭", 
    showAction = false, 
    actionLabel = "Add Item", 
    actionIcon = "➕", 
    className = "",
    onaction,
    children
  } = $props<{
    title?: string;
    description?: string;
    icon?: string;
    showAction?: boolean;
    actionLabel?: string;
    actionIcon?: string;
    className?: string;
    onaction?: () => void;
    children?: () => any;
  }>();

  function handleAction() {
    if (onaction) {
      onaction();
    }
  }
</script>

<div class={cn("text-center py-12", className)}>
  <div class="text-6xl mb-4">{icon}</div>
  <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
  <p class="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">{description}</p>
  
  {#if showAction}
    <Button onclick={handleAction}>
      <span class="mr-2">{actionIcon}</span>
      {actionLabel}
    </Button>
  {/if}
  
  {#if children}
    <div class="mt-6">
      {@render children()}
    </div>
  {/if}
</div>
