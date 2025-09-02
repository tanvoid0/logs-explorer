<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { BaseSelector } from '$lib/components/ui/selector/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import type { K8sNamespace, K8sDeployment, K8sPod } from '$lib/api/k8s';

  const { namespaces = [], deployments = [], pods = [], selectedNamespace = "", selectedDeployments = [], selectedPods = [], selectedSeverity = "", className = "" } = $props<{namespaces?: K8sNamespace[] ; deployments?: K8sDeployment[] ; pods?: K8sPod[] ; selectedNamespace?: any; selectedDeployments?: string[] ; selectedPods?: string[] ; selectedSeverity?: any; className?: any }>();

  const dispatch = createEventDispatcher();

  const severityOptions = [
    { value: '', label: 'All Severities' },
    { value: 'ERROR', label: 'Error' },
    { value: 'WARN', label: 'Warning' },
    { value: 'INFO', label: 'Info' },
    { value: 'DEBUG', label: 'Debug' }
  ];

  function handleNamespaceChange(event: CustomEvent) {
    const namespace = event.detail.values[0] || '';
    dispatch('namespaceChange', { namespace });
  }

  function handleDeploymentsChange(event: CustomEvent) {
    const deployments = event.detail.values;
    dispatch('deploymentsChange', { deployments });
  }

  function handlePodsChange(event: CustomEvent) {
    const pods = event.detail.values;
    dispatch('podsChange', { pods });
  }

  function handleSeverityChange(event: CustomEvent) {
    const severity = event.detail.values[0] || '';
    dispatch('severityChange', { severity });
  }
</script>

<Card className={className}>
  <CardHeader>
    <CardTitle>Filters</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <BaseSelector
      label="Namespace"
      placeholder="Select namespace..."
      options={namespaces.map((ns: K8sNamespace) => ({ value: ns.name, label: ns.name }))}
      selectedValues={selectedNamespace ? [selectedNamespace] : []}
      onchange={handleNamespaceChange}
    />
    
    <BaseSelector
      label="Deployments"
      placeholder="Select deployments..."
      options={deployments.map((dep: K8sDeployment) => ({ value: dep.name, label: dep.name }))}
      selectedValues={selectedDeployments}
      onchange={handleDeploymentsChange}
    />
    
    <BaseSelector
      label="Pods"
      placeholder="Select pods..."
      options={pods.map((pod: K8sPod) => ({ value: pod.name, label: pod.name }))}
      selectedValues={selectedPods}
      onchange={handlePodsChange}
    />
    
    <BaseSelector
      label="Severity"
      placeholder="Select severity..."
      options={severityOptions}
      selectedValues={selectedSeverity ? [selectedSeverity] : []}
      onchange={handleSeverityChange}
    />
  </CardContent>
</Card>
