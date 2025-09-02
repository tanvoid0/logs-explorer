<script lang="ts">
  const { podFilter = "", className = "" } = $props<{
    podFilter?: string;
    className?: string;
  }>();
</script>

<div class="mb-8 {className}">
  <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">
    {podFilter ? `Pod Logs - ${podFilter}` : "Logs Explorer"}
  </h1>
  <p class="text-slate-600 dark:text-slate-400">
    {podFilter ? `View logs for pod ${podFilter}` : "View and filter logs across your Kubernetes cluster"}
  </p>
</div>
