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

  function handleBack() {
    dispatch('back');
  }

  function handleStar() {
    dispatch('star');
  }

  function handleEdit() {
    dispatch('edit');
  }

  function handleDelete() {
    dispatch('delete');
  }
</script>

<div class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 {className}">
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <button
        onclick={handleBack}
        class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        title="Back to Projects"
      >
        <Icon icon="mdi:arrow-left" class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          {project?.name || 'Project Details'}
        </h1>
        <p class="text-slate-600 dark:text-slate-400">
          {project?.path || 'Loading...'}
        </p>
      </div>
    </div>
    
    <div class="flex items-center space-x-2">
      <button
        class="p-2 {project?.starred ? 'text-yellow-500' : 'text-slate-400'} hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
        onclick={handleStar}
        title={project?.starred ? 'Unstar project' : 'Star project'}
      >
        <Icon icon={project?.starred ? 'mdi:star' : 'mdi:star-outline'} class="w-5 h-5" />
      </button>
      <Button variant="outline" onclick={handleEdit}>
        <Icon icon="mdi:pencil" class="w-4 h-4 mr-2" />
        Edit
      </Button>
      <Button variant="outline" onclick={handleDelete} class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
        <Icon icon="mdi:delete" class="w-4 h-4 mr-2" />
        Delete
      </Button>
    </div>
  </div>
</div>
