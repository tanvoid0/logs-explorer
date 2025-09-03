<script lang="ts">
  import { cn } from "$lib/utils";
  import Button from "../button.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
  }>();

  const { 
    isOpen = false,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "destructive",
    className = ""
  } = $props<{
    isOpen?: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive" | "warning";
    className?: string;
  }>();

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }
</script>

{#if isOpen}
  <div 
    class={cn("fixed inset-0 z-50 flex items-center justify-center", className)}
    on:click={handleBackdropClick}
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
    
    <!-- Dialog -->
    <div class="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p class="text-slate-600 dark:text-slate-400 mt-2">
          {message}
        </p>
      </div>
      
      <div class="flex justify-end space-x-3">
        <Button 
          variant="outline" 
          onclick={handleCancel}
        >
          {cancelText}
        </Button>
        <Button 
          variant={variant} 
          onclick={handleConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </div>
  </div>
{/if}
