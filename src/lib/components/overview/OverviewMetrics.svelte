<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card/index.js';

  const { 
    totalNamespaces = 0, 
    activeClusters = 0, 
    currentNamespace = "", 
    clusterStatus = "", 
    isConnected = false, 
    className = "" 
  } = $props<{
    totalNamespaces?: number;
    activeClusters?: number;
    currentNamespace?: string;
    clusterStatus?: string;
    isConnected?: boolean;
    className?: string;
  }>();

  const metrics = [
    {
      label: 'Total Namespaces',
      value: totalNamespaces,
      icon: '📁',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-slate-900 dark:text-white'
    },
    {
      label: 'Active Clusters',
      value: activeClusters,
      icon: '☸️',
      bgColor: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-slate-900 dark:text-white'
    },
    {
      label: 'Current Namespace',
      value: currentNamespace,
      icon: '🎯',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-slate-900 dark:text-white'
    },
    {
      label: 'Cluster Status',
      value: clusterStatus,
      icon: isConnected ? '✅' : '❌',
      bgColor: isConnected ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900',
      textColor: isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    }
  ];
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 {className}">
  {#each metrics as metric}
    <Card>
      <CardContent className="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
              {metric.label}
            </p>
            <p class="text-2xl font-bold {metric.textColor}">
              {metric.value}
            </p>
          </div>
          <div class="w-12 h-12 {metric.bgColor} rounded-lg flex items-center justify-center">
            <span class="text-2xl">{metric.icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  {/each}
</div>
