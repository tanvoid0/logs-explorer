<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { Input } from '$lib/components/ui/form/index.js';
  import { BaseSelector } from '$lib/components/ui/selector/index.js';

  let { selectedClusterType = 'GKE (Google Kubernetes Engine)', kubeconfigFile = null, isAddingCluster = false, className = "" } = $props<{
    selectedClusterType?: string;
    kubeconfigFile?: File | null;
    isAddingCluster?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  const clusterTypes = [
    'GKE (Google Kubernetes Engine)',
    'EKS (Amazon Elastic Kubernetes Service)',
    'AKS (Azure Kubernetes Service)',
    'Local Cluster',
    'Custom Cluster'
  ];

  function handleClusterTypeChange(event: CustomEvent) {
    selectedClusterType = event.detail.values[0];
    dispatch('clusterTypeChange', { clusterType: selectedClusterType });
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      kubeconfigFile = target.files[0];
      dispatch('fileSelect', { file: kubeconfigFile });
    }
  }

  function handleAddCluster() {
    dispatch('addCluster');
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 {className}">
  <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add New Cluster</h3>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Cluster Type
      </label>
      <BaseSelector
        label="cluster-type"
        selectedValues={[selectedClusterType]}
        onchange={handleClusterTypeChange}
        options={clusterTypes.map(type => ({ value: type, label: type }))}
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Kubeconfig File
      </label>
      <input 
        type="file" 
        accept=".yaml,.yml,.config,.kubeconfig"
        onchange={handleFileSelect}
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
      />
      {#if kubeconfigFile}
        <p class="text-sm text-green-600 dark:text-green-400 mt-1">
          Selected: {kubeconfigFile.name}
        </p>
      {/if}
    </div>
    <ActionButton 
      action="add"
      label="Add Cluster"
      disabled={isAddingCluster || !kubeconfigFile}
      onclick={handleAddCluster}
    />
  </div>
</div>
