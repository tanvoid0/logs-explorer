<script lang="ts">
  import type { MetricData } from '../stores/metrics-store';

  export let title: string;
  export let metric: MetricData;
  export let icon: string;
  export let iconBgColor: string = 'bg-blue-100 dark:bg-blue-900';
  export let iconTextColor: string = 'text-blue-600 dark:text-blue-400';

  $: changeColor = metric.changeType === 'increase' 
    ? 'text-green-600 dark:text-green-400' 
    : metric.changeType === 'decrease' 
    ? 'text-red-600 dark:text-red-400' 
    : 'text-slate-600 dark:text-slate-400';

  $: changeIcon = metric.changeType === 'increase' 
    ? '↗' 
    : metric.changeType === 'decrease' 
    ? '↘' 
    : '→';

  $: formattedValue = metric.unit === '%' 
    ? `${metric.value.toFixed(1)}%` 
    : `${metric.value.toFixed(1)} ${metric.unit}`;

  $: formattedChange = metric.changeType === 'stable' 
    ? 'No change' 
    : `${changeIcon} ${Math.abs(metric.change).toFixed(1)}% from last hour`;
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
  <div class="flex items-center">
    <div class="p-2 {iconBgColor} rounded-lg">
      <span class="text-2xl">{icon}</span>
    </div>
    <div class="ml-4 flex-1">
      <p class="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
      <p class="text-2xl font-bold text-slate-900 dark:text-white">{formattedValue}</p>
      <p class="text-xs {changeColor}">{formattedChange}</p>
    </div>
  </div>
</div>
