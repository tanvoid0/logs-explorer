<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { LoadingState, EmptyState } from '$lib/components/ui/display/index.js';
  import Button from '$lib/components/ui/button.svelte';
  import Table from "$lib/components/ui/table.svelte";
  import TableHeader from "$lib/components/ui/table-header.svelte";
  import TableBody from "$lib/components/ui/table-body.svelte";
  import TableRow from "$lib/components/ui/table-row.svelte";
  import TableHead from "$lib/components/ui/table-head.svelte";
  import TableCell from "$lib/components/ui/table-cell.svelte";
  import type { K8sDeployment } from '$lib/api/k8s';

  const { 
    deployments = [], 
    filteredDeployments = [], 
    isLoading = false, 
    hasFilters = false, 
    className = "" 
  } = $props<{
    deployments?: K8sDeployment[];
    filteredDeployments?: K8sDeployment[];
    isLoading?: boolean;
    hasFilters?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function getStatusColor(status: string) {
    switch (status) {
      case 'Running': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Updating': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Stopped': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getReplicaStatusColor(ready: number, replicas: number) {
    if (ready === replicas) return 'text-green-600 dark:text-green-400';
    if (ready > 0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  function isDeploymentRunning(deployment: K8sDeployment): boolean {
    return deployment.status === 'Running' && deployment.replicas > 0;
  }

  function truncateImageName(imageName: string, maxLength: number = 30): string {
    if (imageName.length <= maxLength) {
      return imageName;
    }
    
    const parts = imageName.split('/');
    
    if (parts.length === 1) {
      const half = Math.floor(maxLength / 2);
      return imageName.substring(0, half - 2) + '...' + imageName.substring(imageName.length - half + 2);
    }
    
    if (parts.length === 2) {
      const [repo, image] = parts;
      const tagIndex = image.indexOf(':');
      const imageNameOnly = tagIndex > 0 ? image.substring(0, tagIndex) : image;
      const tag = tagIndex > 0 ? image.substring(tagIndex) : '';
      
      const availableLength = maxLength - tag.length - 3;
      if (repo.length + imageNameOnly.length <= availableLength) {
        return imageName;
      }
      
      const repoLength = Math.min(repo.length, Math.floor(availableLength / 2));
      const imageLength = availableLength - repoLength;
      
      return repo.substring(0, repoLength) + '...' + imageNameOnly.substring(0, imageLength) + tag;
    }
    
    if (parts.length >= 3) {
      const registry = parts[0];
      const image = parts[parts.length - 1];
      const tagIndex = image.indexOf(':');
      const imageNameOnly = tagIndex > 0 ? image.substring(0, tagIndex) : image;
      const tag = tagIndex > 0 ? image.substring(tagIndex) : '';
      
      const availableLength = maxLength - tag.length - 6;
      if (availableLength <= 0) {
        return imageNameOnly.substring(0, maxLength - 3) + '...' + tag;
      }
      
      const registryLength = Math.min(registry.length, Math.floor(availableLength / 3));
      const imageLength = availableLength - registryLength;
      
      return registry.substring(0, registryLength) + '...' + imageNameOnly.substring(0, imageLength) + tag;
    }
    
    const half = Math.floor(maxLength / 2);
    return imageName.substring(0, half - 2) + '...' + imageName.substring(imageName.length - half + 2);
  }

  function handleViewDeployment(deployment: K8sDeployment) {
    dispatch('viewDeployment', { deployment });
  }

  function handleStopDeployment(deployment: K8sDeployment) {
    dispatch('stopDeployment', { deployment });
  }

  function handleStartDeployment(deployment: K8sDeployment) {
    dispatch('startDeployment', { deployment });
  }

  function handleRestartDeployment(deployment: K8sDeployment) {
    dispatch('restartDeployment', { deployment });
  }

  function handleCopyImage(deployment: K8sDeployment) {
    dispatch('copyImage', { deployment });
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm {className}">
  <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
    <!-- Header with Title and Stats -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          Deployments ({filteredDeployments.length})
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Application deployments and scaling
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Running</span>
        </div>
        <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
          <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span>Updating</span>
        </div>
        <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
          <div class="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Failed</span>
        </div>
      </div>
    </div>
  </div>

  {#if isLoading}
    <LoadingState message="Loading deployments..." />
  {:else if filteredDeployments.length === 0}
    <EmptyState 
      title="No deployments found"
      description={hasFilters ? 'Try adjusting your filters.' : 'No deployments are currently running in this namespace.'}
      icon="🚀"
    />
  {:else}
    <div class="overflow-x-auto">
      <Table className="w-full min-w-full">
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <TableHead className="w-1/4 font-semibold text-slate-700 dark:text-slate-300">Deployment</TableHead>
            <TableHead className="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
            <TableHead className="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Replicas</TableHead>
            <TableHead className="w-2/5 font-semibold text-slate-700 dark:text-slate-300">Image</TableHead>
            <TableHead className="w-1/6 font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each filteredDeployments as deployment (deployment.name)}
            <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700">
              <TableCell className="font-medium truncate">
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 rounded-full {isDeploymentRunning(deployment) ? 'bg-green-500' : deployment.status.toLowerCase() === 'updating' ? 'bg-yellow-500' : deployment.replicas === 0 ? 'bg-gray-400' : 'bg-red-500'}"></div>
                  <Button 
                    onclick={() => handleViewDeployment(deployment)}
                    variant="ghost"
                    class="text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer text-left"
                    title="Click to view deployment details"
                  >
                    {deployment.name}
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <span class="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full {getStatusColor(deployment.replicas === 0 ? 'Stopped' : deployment.status)} shadow-sm">
                  {deployment.replicas === 0 ? 'Stopped' : deployment.status}
                </span>
              </TableCell>
              <TableCell>
                <div class="text-sm">
                  <span class="font-medium font-mono {getReplicaStatusColor(deployment.ready, deployment.replicas)}">
                    {deployment.ready}/{deployment.replicas}
                  </span>
                  <span class="text-slate-500 dark:text-slate-400 ml-1 text-xs">
                    ({deployment.available} available)
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-400">
                <button 
                  onclick={() => handleCopyImage(deployment)}
                  class="font-mono text-sm hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-all duration-200 hover:scale-105 cursor-pointer block w-full text-left"
                  title="Click to copy image to clipboard: {deployment.image}"
                >
                  {truncateImageName(deployment.image, 30)}
                </button>
              </TableCell>
              <TableCell>
                <div class="flex items-center space-x-1">
                  {#if isDeploymentRunning(deployment)}
                    <!-- Stop button - only show when running -->
                    <button 
                      onclick={() => handleStopDeployment(deployment)}
                      class="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Stop Deployment (Scale to 0)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
                      </svg>
                    </button>
                  {:else if deployment.replicas === 0}
                    <!-- Start button - only show when stopped (0 replicas) -->
                    <button 
                      onclick={() => handleStartDeployment(deployment)}
                      class="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Start Deployment (Scale to 1)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </button>
                  {/if}
                  
                  {#if (deployment.status === 'Running' && deployment.replicas > 0) || deployment.status === 'Updating'}
                    <!-- Restart button - only show when running or updating -->
                    <button 
                      onclick={() => handleRestartDeployment(deployment)}
                      class="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Restart Deployment"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                    </button>
                  {/if}
                  
                  <button 
                    onclick={() => handleViewDeployment(deployment)}
                    class="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                    title="View Deployment Details"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </button>
                </div>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>
