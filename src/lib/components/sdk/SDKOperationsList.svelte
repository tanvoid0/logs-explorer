<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import type { SDKManagerOperation } from '$lib/types/sdk';

  const { recentOperations = [], className = "" } = $props<{recentOperations?: SDKManagerOperation[] ; className?: any }>();

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'mdi:check-circle';
      case 'failed': return 'mdi:close-circle';
      case 'running': return 'mdi:loading';
      case 'pending': return 'mdi:clock-outline';
      default: return 'mdi:help-circle';
    }
  }
</script>

<Card className={className}>
  <CardHeader>
    <CardTitle>Recent Operations</CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    <div class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each recentOperations as operation}
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <Icon 
                icon={getStatusIcon(operation.status)} 
                class="w-6 h-6 mr-3 {getStatusColor(operation.status)}" 
              />
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">
                  {operation.operation} {operation.sdk} {operation.version ? `(${operation.version})` : ''}
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Manager: {operation.manager} • {new Date(operation.timestamp).toLocaleString()}
                </p>
                {#if operation.error}
                  <p class="text-sm text-red-600 dark:text-red-400 mt-1">{operation.error}</p>
                {/if}
                {#if operation.output}
                  <details class="mt-2">
                    <summary class="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">Show Output</summary>
                    <pre class="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto">{operation.output}</pre>
                  </details>
                {/if}
              </div>
            </div>
            <span class="text-sm font-medium {getStatusColor(operation.status)}">
              {operation.status}
            </span>
          </div>
        </div>
      {/each}
    </div>
  </CardContent>
</Card>
