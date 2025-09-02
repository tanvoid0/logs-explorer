<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Icon from "@iconify/svelte";
  import type { Project } from '$lib/api/projects';

  const { project = null, className = "" } = $props<{
    project?: Project | null;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleOpenInExplorer() {
    dispatch('openInExplorer');
  }

  function handleOpenInIde() {
    dispatch('openInIde');
  }

  function handleViewDeployment() {
    dispatch('viewDeployment');
  }

  function handleViewLogs() {
    dispatch('viewLogs');
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 {className}">
  <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
    Quick Actions
  </h3>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <Button variant="outline" onclick={handleOpenInExplorer} class="h-auto p-4 flex flex-col items-center">
      <Icon icon="mdi:folder-open" class="w-6 h-6 mb-2" />
      <span>Open in Explorer</span>
    </Button>
    {#if project?.framework}
      <Button variant="outline" onclick={handleOpenInIde} class="h-auto p-4 flex flex-col items-center">
        <Icon icon="mdi:code-braces" class="w-6 h-6 mb-2" />
        <span>Open in IDE</span>
      </Button>
    {/if}
    {#if project?.deployment}
      <Button variant="outline" onclick={handleViewDeployment} class="h-auto p-4 flex flex-col items-center">
        <Icon icon="devicon:kubernetes" class="w-6 h-6 mb-2" />
        <span>View Deployment</span>
      </Button>
    {/if}
    <Button variant="outline" onclick={handleViewLogs} class="h-auto p-4 flex flex-col items-center">
      <Icon icon="mdi:file-document" class="w-6 h-6 mb-2" />
      <span>View Logs</span>
    </Button>
  </div>
</div>
