<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { EmptyState } from '$lib/components/ui/display/index.js';
  import Table from "$lib/components/ui/table.svelte";
  import TableHeader from "$lib/components/ui/table-header.svelte";
  import TableBody from "$lib/components/ui/table-body.svelte";
  import TableRow from "$lib/components/ui/table-row.svelte";
  import TableHead from "$lib/components/ui/table-head.svelte";
  import TableCell from "$lib/components/ui/table-cell.svelte";
  import type { K8sPod } from '$lib/api/k8s';

  const { 
    pods = [], 
    filteredPods = [], 
    hasFilters = false, 
    selectedNamespace = "", 
    className = "" 
  } = $props<{
    pods?: K8sPod[];
    filteredPods?: K8sPod[];
    hasFilters?: boolean;
    selectedNamespace?: string;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
      case 'error':
      case 'crashloopbackoff':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function handleViewPod(pod: K8sPod) {
    dispatch('viewPod', { pod });
  }

  function handleViewLogs(pod: K8sPod) {
    dispatch('viewLogs', { pod });
  }

  function handleCopyPodName(pod: K8sPod) {
    dispatch('copyPodName', { pod });
  }

  function handleExecuteCommand(pod: K8sPod) {
    dispatch('executeCommand', { pod });
  }

  function handleDeletePod(pod: K8sPod) {
    dispatch('deletePod', { pod });
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm {className}">
  <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          {#if hasFilters}
            Pod List ({filteredPods.length} of {pods.length} pods)
          {:else}
            Pod List ({pods.length} pods)
          {/if}
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage and monitor your Kubernetes pods
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Running</span>
        </div>
        <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
          <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span>Pending</span>
        </div>
        <div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
          <div class="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Failed</span>
        </div>
      </div>
    </div>
  </div>
  
  {#if pods.length === 0}
    <EmptyState 
      title={selectedNamespace ? 'No Pods Found' : 'Select a Namespace'}
      description={selectedNamespace
        ? `No pods found in namespace "${selectedNamespace}"` 
        : 'Please select a namespace from the sidebar to view pods'
      }
      icon="📦"
    />
  {:else}
    <div class="overflow-x-auto">
      <Table className="w-full min-w-full">
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <TableHead className="w-1/3 font-semibold text-slate-700 dark:text-slate-300">Name</TableHead>
            <TableHead className="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
            <TableHead className="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Ready</TableHead>
            <TableHead className="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Restarts</TableHead>
            <TableHead className="w-1/8 font-semibold text-slate-700 dark:text-slate-300">Age</TableHead>
            <TableHead className="w-1/6 font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each filteredPods as pod (pod.name)}
            <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700">
              <TableCell className="font-medium truncate">
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 rounded-full {pod.status.toLowerCase() === 'running' ? 'bg-green-500' : pod.status.toLowerCase() === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}"></div>
                  <span class="text-slate-900 dark:text-white">{pod.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(pod.status)} shadow-sm">
                  {pod.status}
                </span>
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-400">
                <span class="font-mono text-sm">{pod.ready}</span>
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-400">
                <span class="font-mono text-sm">{pod.restarts}</span>
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-400">
                <span class="font-mono text-sm">{pod.age}</span>
              </TableCell>
              <TableCell>
                <div class="flex items-center space-x-1">
                  <button 
                    onclick={() => handleViewPod(pod)}
                    class="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                    title="View Pod Details"
                    aria-label="View Pod Details"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </button>
                  <button 
                    onclick={() => handleViewLogs(pod)}
                    class="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                    title="View Pod Logs"
                    aria-label="View Pod Logs"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </button>
                  <button 
                    onclick={() => handleCopyPodName(pod)}
                    class="p-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Copy Pod Name"
                    aria-label="Copy Pod Name"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
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
