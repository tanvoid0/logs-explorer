<script lang="ts">
  import LogsViewerContent from "$lib/components/LogsViewerContent.svelte";
  import WorkloadTabs from "$lib/components/WorkloadTabs.svelte";
</script>

<div class="flex-1 flex flex-col min-h-0">
  <WorkloadTabs />

  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto min-h-0">
    <LogsViewerContent 
      title="Workload Logs"
      description="View and filter logs for your workloads"
      showNamespaceLabel={true}
    />
  </main>
</div>
