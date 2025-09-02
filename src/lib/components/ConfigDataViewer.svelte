<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  const { data = {}, title = 'Configuration Data' } = $props<{
    data?: Record<string, string>;
    title?: string;
  }>();

  let viewMode = $state<'tree' | 'json' | 'yaml'>('tree');

  function formatJson(data: Record<string, string>): string {
    return JSON.stringify(data, null, 2);
  }

  function formatYaml(data: Record<string, string>): string {
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join('\n');
  }

  function isJson(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  function formatValue(value: string): string {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }

  const dataEntries = $derived(Object.entries(data).map(([key, value]) => [String(key), String(value)]));
</script>

<div class="config-data-viewer">
  <div class="header">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    <div class="view-controls">
      <div class="flex rounded-md shadow-sm">
        <Button
          variant={viewMode === 'tree' ? 'default' : 'outline'}
          size="sm"
          class="rounded-l-md border-r-0 {viewMode === 'tree' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}"
          onclick={() => viewMode = 'tree'}
        >
          Tree
        </Button>
        <Button
          variant={viewMode === 'json' ? 'default' : 'outline'}
          size="sm"
          class="border-r-0 {viewMode === 'json' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}"
          onclick={() => viewMode = 'json'}
        >
          JSON
        </Button>
        <Button
          variant={viewMode === 'yaml' ? 'default' : 'outline'}
          size="sm"
          class="rounded-r-md {viewMode === 'yaml' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}"
          onclick={() => viewMode = 'yaml'}
        >
          YAML
        </Button>
      </div>
    </div>
  </div>

  <div class="content">
    {#if dataEntries.length === 0}
      <div class="empty-state text-center py-8">
        <div class="text-gray-500 dark:text-gray-400">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-lg font-medium">No configuration data</p>
          <p class="text-sm">This configuration is empty</p>
        </div>
      </div>
    {:else}
      {#if viewMode === 'tree'}
        <div class="tree-view space-y-2">
          {#each dataEntries as [key, value]}
            <div class="tree-item bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="key-section mb-2">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Key:</span>
                    <div class="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <code class="text-sm font-mono text-gray-900 dark:text-white">{key}</code>
                    </div>
                  </div>
                  <div class="value-section">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Value:</span>
                    <div class="mt-1">
                      {#if isJson(value)}
                        <pre class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm font-mono text-gray-900 dark:text-white overflow-x-auto">{formatValue(value)}</pre>
                      {:else}
                        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm font-mono text-gray-900 dark:text-white break-all">
                          {value}
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else if viewMode === 'json'}
        <div class="json-view">
          <pre class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-sm font-mono text-gray-900 dark:text-white overflow-x-auto max-h-96">{formatJson(data)}</pre>
        </div>
      {:else if viewMode === 'yaml'}
        <div class="yaml-view">
          <pre class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-sm font-mono text-gray-900 dark:text-white overflow-x-auto max-h-96">{formatYaml(data)}</pre>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .config-data-viewer {
    background-color: rgb(248 250 252);
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    border: 1px solid rgb(226 232 240);
  }

  @media (prefers-color-scheme: dark) {
    .config-data-viewer {
      background-color: rgb(17 24 39);
      border-color: rgb(55 65 81);
    }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid rgb(226 232 240);
  }

  @media (prefers-color-scheme: dark) {
    .header {
      border-bottom-color: rgb(55 65 81);
    }
  }

  .view-controls {
    display: flex;
    align-items: center;
  }

  .content {
    padding: 1rem;
  }

  .tree-view {
    max-height: 24rem;
    overflow-y: auto;
  }

  .tree-item {
    transition: all 0.2s;
  }

  .tree-item:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }

  .empty-state {
    border: 2px dashed rgb(203 213 225);
    border-radius: 0.5rem;
  }

  @media (prefers-color-scheme: dark) {
    .empty-state {
      border-color: rgb(75 85 99);
    }
  }

  .json-view pre,
  .yaml-view pre {
    white-space: pre-wrap;
  }
</style>
