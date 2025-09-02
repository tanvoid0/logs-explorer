<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$lib/utils/navigation';
  import WorkloadCard from './WorkloadCard.svelte';

  const { totalPods = 0, runningPods = 0, pendingPods = 0, failedPods = 0, totalServices = 0, clusterIPServices = 0, loadBalancerServices = 0, nodePortServices = 0, isLoading = false, className = "" } = $props<{totalPods?: any; runningPods?: any; pendingPods?: any; failedPods?: any; totalServices?: any; clusterIPServices?: any; loadBalancerServices?: any; nodePortServices?: any; isLoading?: any; className?: any }>();

  const dispatch = createEventDispatcher();

  function handleNavigate(event: CustomEvent) {
    const route = event.detail.route;
    if (route) {
      goto(route);
    }
  }

  function handleViewDetails() {
    dispatch('viewDetails');
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 {className}">
  <!-- Pods Summary -->
  <WorkloadCard
    title="Pods"
    icon="📦"
    total={totalPods}
    metrics={[
      { label: 'Running', value: runningPods, color: 'text-green-600 dark:text-green-400' },
      { label: 'Pending', value: pendingPods, color: 'text-yellow-600 dark:text-yellow-400' },
      { label: 'Failed', value: failedPods, color: 'text-red-600 dark:text-red-400' }
    ]}
    description="View pods in deployment details"
    {isLoading}
  />

  <!-- Services Summary -->
  <WorkloadCard
    title="Services"
    icon="🔗"
    total={totalServices}
    metrics={[
      { label: 'ClusterIP', value: clusterIPServices, color: 'text-blue-600 dark:text-blue-400' },
      { label: 'LoadBalancer', value: loadBalancerServices, color: 'text-purple-600 dark:text-purple-400' },
      { label: 'NodePort', value: nodePortServices, color: 'text-orange-600 dark:text-orange-400' }
    ]}
    description="Services managed via deployments"
    {isLoading}
  />

  <!-- Deployments (estimated) -->
  <WorkloadCard
    title="Deployments"
    icon="🚀"
    total={Math.ceil(totalPods / 3)}
    metrics={[
      { label: 'Available', value: Math.ceil(runningPods / 3), color: 'text-green-600 dark:text-green-400' },
      { label: 'Updating', value: Math.ceil(pendingPods / 3), color: 'text-blue-600 dark:text-blue-400' },
      { label: 'Failed', value: Math.ceil(failedPods / 3), color: 'text-red-600 dark:text-red-400' }
    ]}
    actionLabel="View Deployments"
    actionRoute="/workloads/deployments"
    {isLoading}
    on:navigate={handleNavigate}
  />

  <!-- Jobs (estimated) -->
  <WorkloadCard
    title="Jobs"
    icon="⚡"
    total={Math.ceil(totalPods / 4)}
    metrics={[
      { label: 'Running', value: Math.ceil(pendingPods / 4), color: 'text-blue-600 dark:text-blue-400' },
      { label: 'Completed', value: Math.ceil(runningPods / 4), color: 'text-green-600 dark:text-green-400' },
      { label: 'Failed', value: Math.ceil(failedPods / 4), color: 'text-red-600 dark:text-red-400' }
    ]}
    actionLabel="View Jobs"
    actionRoute="/workloads/jobs"
    {isLoading}
    on:navigate={handleNavigate}
  />

  <!-- Config Maps (estimated) -->
  <WorkloadCard
    title="Config Maps"
    icon="⚙️"
    total={Math.ceil(totalServices * 1.5)}
    metrics={[
      { label: 'Active', value: Math.ceil(totalServices * 1.5), color: 'text-green-600 dark:text-green-400' },
      { label: 'Keys', value: Math.ceil(totalServices * 3), color: 'text-blue-600 dark:text-blue-400' }
    ]}
    actionLabel="View Config Maps"
    actionRoute="/workloads/configs"
    {isLoading}
    on:navigate={handleNavigate}
  />
</div>
