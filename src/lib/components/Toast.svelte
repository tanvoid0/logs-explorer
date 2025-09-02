<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  
  let { 
    message, 
    type = 'info', 
    duration = 5000, 
    show = false 
  } = $props<{
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    show?: boolean;
  }>();
  
  const dispatch = createEventDispatcher();
  
  let timeoutId: ReturnType<typeof setTimeout>;
  
  $effect(() => {
    if (show && duration > 0) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        show = false;
        dispatch('close');
      }, duration);
    }
  });
  
  function close() {
    show = false;
    dispatch('close');
  }
  
  function getIcon() {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  }
  
  function getClasses() {
    const baseClasses = 'fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-500 text-white`;
      case 'error':
        return `${baseClasses} bg-red-500 text-white`;
      case 'warning':
        return `${baseClasses} bg-yellow-500 text-white`;
      case 'info':
        return `${baseClasses} bg-blue-500 text-white`;
      default:
        return `${baseClasses} bg-gray-500 text-white`;
    }
  }
</script>

{#if show}
  <div class={getClasses()} class:translate-x-full={!show}>
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="text-lg font-bold">{getIcon()}</span>
        <span class="text-sm font-medium">{message}</span>
      </div>
      <Button 
        onclick={close}
        variant="ghost"
        size="sm"
        class="ml-4 text-white hover:text-gray-200 focus:outline-none"
      >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </Button>
    </div>
  </div>
{/if}
