<script lang="ts">
  import type { K8sDeployment, K8sPod } from '$lib/api/k8s';

  const { 
    deployments = [], 
    pods = [], 
    isLoading = false, 
    className = "" 
  } = $props<{
    deployments?: K8sDeployment[];
    pods?: K8sPod[];
    isLoading?: boolean;
    className?: string;
  }>();

  function isDeploymentRunning(deployment: K8sDeployment): boolean {
    return deployment.status === 'Running' && deployment.replicas > 0;
  }
</script>

<div class="grid grid-cols-4 gap-4 mb-4 {className}">
  <!-- Total Deployments -->
  <div class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
    <div class="flex items-center">
      <div class="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
        <span class="text-sm">🚀</span>
      </div>
      <div class="ml-2">
        <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Total</p>
        <p class="text-lg font-bold text-slate-900 dark:text-white">
          {isLoading ? '...' : deployments.length}
        </p>
      </div>
    </div>
  </div>

  <!-- Running Deployments -->
  <div class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
    <div class="flex items-center">
      <div class="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
        <span class="text-sm">✅</span>
      </div>
      <div class="ml-2">
        <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Running</p>
        <p class="text-lg font-bold text-slate-900 dark:text-white">
          {isLoading ? '...' : deployments.filter((d: any) => isDeploymentRunning(d)).length}
        </p>
      </div>
    </div>
  </div>

  <!-- Updating Deployments -->
  <div class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
    <div class="flex items-center">
      <div class="p-1.5 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
        <span class="text-sm">🔄</span>
      </div>
      <div class="ml-2">
        <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Updating</p>
        <p class="text-lg font-bold text-slate-900 dark:text-white">
          {isLoading ? '...' : deployments.filter((d: any) => d.status === 'Updating').length}
        </p>
      </div>
    </div>
  </div>

  <!-- Total Pods -->
  <div class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
    <div class="flex items-center">
      <div class="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
        <span class="text-sm">📦</span>
      </div>
      <div class="ml-2">
        <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Pods</p>
        <p class="text-lg font-bold text-slate-900 dark:text-white">
          {isLoading ? '...' : pods.length}
        </p>
      </div>
    </div>
  </div>
</div>
