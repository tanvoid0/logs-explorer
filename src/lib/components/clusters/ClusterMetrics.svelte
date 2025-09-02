<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ActionButton } from '$lib/components/ui/action/index.js';

  const { 
    totalPods = 0, 
    runningPods = 0, 
    failedPods = 0, 
    totalServices = 0, 
    loadBalancers = 0, 
    namespacesCount = 0, 
    isLoading = false, 
    className = "" 
  } = $props<{
    totalPods?: number;
    runningPods?: number;
    failedPods?: number;
    totalServices?: number;
    loadBalancers?: number;
    namespacesCount?: number;
    isLoading?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleViewMetrics() {
    dispatch('viewMetrics');
  }

  function handleConfigure() {
    dispatch('configure');
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 {className}">
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center">
      <div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Cluster Metrics</h3>
    </div>
    <span class="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
      Live
    </span>
  </div>
  
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-sm text-slate-600 dark:text-slate-400">Total Pods:</span>
      <span class="text-sm font-medium text-slate-900 dark:text-white">
        {isLoading ? '...' : totalPods}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm text-slate-600 dark:text-slate-400">Running:</span>
      <span class="text-sm text-green-600 dark:text-green-400">
        {isLoading ? '...' : runningPods}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm text-slate-600 dark:text-slate-400">Failed:</span>
      <span class="text-sm text-red-600 dark:text-red-400">
        {isLoading ? '...' : failedPods}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm text-slate-600 dark:text-slate-400">Load Balancers:</span>
      <span class="text-sm font-medium text-slate-900 dark:text-white">
        {isLoading ? '...' : loadBalancers}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm text-slate-600 dark:text-slate-400">Services:</span>
      <span class="text-sm font-medium text-slate-900 dark:text-white">
        {isLoading ? '...' : totalServices}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm text-slate-600 dark:text-slate-400">Namespaces:</span>
      <span class="text-sm font-medium text-slate-900 dark:text-white">
        {isLoading ? '...' : namespacesCount}
      </span>
    </div>
  </div>
  
  <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
    <div class="flex space-x-2">
      <ActionButton 
        action="add"
        label="View Metrics"
        onclick={handleViewMetrics}
      />
      <ActionButton 
        action="edit"
        label="Configure"
        onclick={handleConfigure}
      />
    </div>
  </div>
</div>
