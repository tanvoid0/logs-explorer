<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from '$app/navigation';
  
  onMount(() => {
    // Redirect to workloads overview by default
    goto('/workloads');
  });
</script>

<div class="flex-1 flex flex-col min-h-0">
  <div class="flex-1 overflow-y-auto p-6 min-h-0">
    <div class="w-full">
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-slate-600 dark:text-slate-400">Redirecting to Workloads...</p>
      </div>
    </div>
  </div>
</div>




