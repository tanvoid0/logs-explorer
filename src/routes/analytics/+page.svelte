<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    // Redirect to dashboard with analytics tab
    goto('/?tab=analytics');
  });
</script>

<div class="flex-1 flex flex-col min-h-0">
  <div class="flex-1 overflow-y-auto p-6 min-h-0">
    <div class="max-w-7xl mx-auto">
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-slate-600 dark:text-slate-400">Redirecting to Dashboard...</p>
      </div>
    </div>
  </div>
</div>
