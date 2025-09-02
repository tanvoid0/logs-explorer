<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';
  import { LoadingState } from '$lib/components/ui/display/index.js';

  const { 
    isConnected = false, 
    isConnecting = false, 
    isLoading = false, 
    className = "" 
  } = $props<{
    isConnected?: boolean;
    isConnecting?: boolean;
    isLoading?: boolean;
    className?: string;
  }>();

  function handleConnect() {
    // This will be handled by the parent component
  }
</script>

{#if !isConnected}
  <!-- Not Connected State -->
  <div class="text-center py-12 {className}">
    <div class="text-slate-400 dark:text-slate-500 mb-4">
      <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
      </svg>
    </div>
    <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
      Not Connected to Kubernetes
    </h3>
    <p class="text-slate-500 dark:text-slate-400 mb-4">
      Use the connection button in the sidebar to connect to a Kubernetes cluster
    </p>
    <Button onclick={handleConnect}>
      Connect to Kubernetes
    </Button>
  </div>
{:else if isLoading}
  <!-- Loading State -->
  <LoadingState message="Loading pods..." className={className} />
{/if}
