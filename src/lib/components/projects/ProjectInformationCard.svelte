<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { Project } from '$lib/api/projects';

  const { project = null, className = "" } = $props<{
    project?: Project | null;
    className?: string;
  }>();
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 {className}">
  <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
    Project Information
  </h3>
  <div class="space-y-4">
    <div>
      <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Project Name
      </div>
      <p class="text-slate-900 dark:text-white">{project?.name}</p>
    </div>
    <div>
      <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Directory Path
      </div>
      <p class="text-slate-900 dark:text-white font-mono text-sm break-all">{project?.path}</p>
    </div>
    <div>
      <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Framework
      </div>
      <p class="text-slate-900 dark:text-white">
        {project?.framework || 'Not detected'}
      </p>
    </div>
    <div>
      <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Kubernetes Deployment
      </div>
      <p class="text-slate-900 dark:text-white">
        {project?.deployment || 'Not configured'}
      </p>
    </div>
    <div>
      <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Status
      </div>
      <p class="text-slate-900 dark:text-white">
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <Icon icon="mdi:check-circle" class="w-3 h-3 mr-1" />
          Active
        </span>
      </p>
    </div>
  </div>
</div>
