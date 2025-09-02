<script lang="ts">
  import type { Project } from '$lib/api/projects';

  const { project = null, className = "" } = $props<{
    project?: Project | null;
    className?: string;
  }>();

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 {className}">
  <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
    Timestamps
  </h3>
  <div class="space-y-4">
    <div>
      <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Created
      </div>
      <p class="text-slate-900 dark:text-white">{formatDate(project?.created_at)}</p>
    </div>
    <div>
      <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Last Updated
      </div>
      <p class="text-slate-900 dark:text-white">{formatDate(project?.updated_at)}</p>
    </div>
    <div>
      <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Starred
      </div>
      <p class="text-slate-900 dark:text-white">
        {project?.starred ? '⭐ Yes' : '☆ No'}
      </p>
    </div>
  </div>
</div>
