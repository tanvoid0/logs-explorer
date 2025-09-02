<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card/index.js';
  import { ProgressBar } from '$lib/components/ui/status/index.js';

  const { completed = 0, total = 0, className = "" } = $props<{
    completed?: number;
    total?: number;
    className?: string;
  }>();

  function getProgressPercentage() {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }
</script>

<Card className={className}>
  <CardContent className="p-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Overall Progress</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          {getProgressPercentage()}% complete ({completed} of {total} tasks)
        </p>
      </div>
    </div>
    <ProgressBar 
      value={completed} 
      max={total} 
      variant="success"
    />
  </CardContent>
</Card>
