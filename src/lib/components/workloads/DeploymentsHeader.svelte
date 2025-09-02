<script lang="ts">
  const { selectedNamespace = "", className = "" } = $props<{
    selectedNamespace?: string;
    className?: string;
  }>();
</script>

<div class="mb-6 {className}">
  <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
    Kubernetes Deployments
  </h1>
  <p class="text-slate-600 dark:text-slate-400">
    Manage and monitor your Kubernetes deployments
    {#if selectedNamespace}
      <span class="font-medium">in namespace: {selectedNamespace}</span>
    {/if}
  </p>
</div>
