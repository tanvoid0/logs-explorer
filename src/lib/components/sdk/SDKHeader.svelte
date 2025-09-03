<script lang="ts">
  import Icon from '@iconify/svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { createEventDispatcher } from 'svelte';

  const { 
    isLoading = false, 
    className = ""
  } = $props<{
    isLoading?: any; 
    className?: any;
  }>();

  const dispatch = createEventDispatcher();

  function handleRefresh() {
    dispatch('refresh');
  }

  function handleClearHistory() {
    dispatch('clearHistory');
  }

  function handleTestClick() {
    dispatch('testClick');
  }

  function handleEnvironmentCheck() {
    dispatch('environmentCheck');
  }
</script>

<div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 {className}">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">SDK Manager</h1>
      <p class="text-gray-600 dark:text-gray-400">Manage your development tools and SDKs</p>
    </div>
    <div class="flex gap-2">
      <Button
        variant="outline"
        disabled={isLoading}
        onclick={handleRefresh}
      >
        <Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
        Refresh
      </Button>
      <Button
        variant="destructive"
        onclick={handleClearHistory}
      >
        <Icon icon="mdi:delete" class="w-4 h-4 mr-2" />
        Clear History
      </Button>
      <Button
        variant="destructive"
        onclick={handleTestClick}
      >
        <Icon icon="mdi:pencil" class="w-4 h-4 mr-2" />
        Test Click
      </Button>
      <Button
        variant="outline"
        onclick={handleEnvironmentCheck}
      >
        <Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
        App/Browser Check
      </Button>
    </div>
  </div>
</div>
