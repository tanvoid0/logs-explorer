<script lang="ts">
  import { page } from '$app/stores';
  import LogsViewerContent from "$lib/components/LogsViewerContent.svelte";

  // Get pod filter from URL query parameter
  let podFilter = $state('');
  
  // Extract pod filter from URL
  $effect(() => {
    const urlParams = new URLSearchParams($page.url.search);
    podFilter = urlParams.get('pod') || '';
  });
</script>

<div class="flex-1 flex flex-col min-h-0">
  <!-- Header -->
  <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-slate-900 dark:text-white">
            {podFilter ? `Pod Logs - ${podFilter}` : "Logs Explorer"}
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {podFilter ? `View logs for pod ${podFilter}` : "View and filter logs across your Kubernetes cluster"}
          </p>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto min-h-0">
    <LogsViewerContent 
      title={podFilter ? `Pod Logs - ${podFilter}` : "Logs Explorer"}
      description={podFilter ? `View logs for pod ${podFilter}` : "View and filter logs across your Kubernetes cluster"}
      defaultPods={podFilter ? [podFilter] : []}
      showNamespaceLabel={true}
    />
  </main>
</div>
