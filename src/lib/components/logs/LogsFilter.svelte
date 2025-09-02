<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/index.js';
  import { Input } from '$lib/components/ui/form/index.js';
  import { Badge } from '$lib/components/ui/feedback/index.js';

  let { 
    severities = [], 
    pods = [], 
    namespaces = [], 
    selectedSeverity = "", 
    selectedPod = "", 
    selectedNamespace = "", 
    searchQuery = "", 
    className = "" 
  } = $props<{
    severities?: string[];
    pods?: string[];
    namespaces?: string[];
    selectedSeverity?: string;
    selectedPod?: string;
    selectedNamespace?: string;
    searchQuery?: string;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleSeverityChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    dispatch('severityChange', { severity: target.value });
  }

  function handlePodChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    dispatch('podChange', { pod: target.value });
  }

  function handleNamespaceChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    dispatch('namespaceChange', { namespace: target.value });
  }

  function handleSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch('searchChange', { query: target.value });
  }

  function handleClearFilters() {
    dispatch('clearFilters');
  }
</script>

<Card className={className}>
  <CardHeader>
    <CardTitle>Filters</CardTitle>
  </CardHeader>
  <CardContent>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Search -->
      <div class="space-y-2">
        <label for="search-input" class="text-sm font-medium">Search</label>
        <Input 
          id="search-input"
          type="search"
          placeholder="Search logs..."
          value={searchQuery}
          oninput={handleSearchChange}
        />
      </div>

      <!-- Severity -->
      <div class="space-y-2">
        <label for="severity-select" class="text-sm font-medium">Severity</label>
        <select 
          id="severity-select" 
          value={selectedSeverity} 
          onchange={handleSeverityChange}
          class="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white dark:ring-offset-slate-950 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">All Severities</option>
          {#each severities as severity}
            <option value={severity}>{severity}</option>
          {/each}
        </select>
      </div>

      <!-- Pod -->
      <div class="space-y-2">
        <label for="pod-select" class="text-sm font-medium">Pod</label>
        <select 
          id="pod-select" 
          value={selectedPod} 
          onchange={handlePodChange}
          class="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white dark:ring-offset-slate-950 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">All Pods</option>
          {#each pods as pod}
            <option value={pod}>{pod}</option>
          {/each}
        </select>
      </div>

      <!-- Namespace -->
      <div class="space-y-2">
        <label for="namespace-select" class="text-sm font-medium">Namespace</label>
        <select 
          id="namespace-select" 
          value={selectedNamespace} 
          onchange={handleNamespaceChange}
          class="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white dark:ring-offset-slate-950 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">All Namespaces</option>
          {#each namespaces as namespace}
            <option value={namespace}>{namespace}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Active Filters -->
    {#if selectedSeverity || selectedPod || selectedNamespace || searchQuery}
      <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium">Active Filters:</span>
            {#if selectedSeverity}
              <Badge variant="default" size="sm">
                Severity: {selectedSeverity}
              </Badge>
            {/if}
            {#if selectedPod}
              <Badge variant="default" size="sm">
                Pod: {selectedPod}
              </Badge>
            {/if}
            {#if selectedNamespace}
              <Badge variant="default" size="sm">
                Namespace: {selectedNamespace}
              </Badge>
            {/if}
            {#if searchQuery}
              <Badge variant="default" size="sm">
                Search: "{searchQuery}"
              </Badge>
            {/if}
          </div>
          <Button variant="outline" size="sm" onclick={handleClearFilters}>
            Clear All
          </Button>
        </div>
      </div>
    {/if}
  </CardContent>
</Card>
