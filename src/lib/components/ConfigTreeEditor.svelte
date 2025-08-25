<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from './ui/button.svelte';

  const { data = {}, readOnly = false, title = 'Configuration Data' } = $props<{
    data?: Record<string, string>;
    readOnly?: boolean;
    title?: string;
  }>();

  const dispatch = createEventDispatcher();

  let editingData = $state<Record<string, string>>({});
  let newKey = $state('');
  let newValue = $state('');
  let isAdding = $state(false);

  // Initialize editing data
  $effect(() => {
    editingData = { ...data };
  });

  function addKeyValue() {
    if (newKey.trim() && newValue.trim()) {
      editingData[newKey.trim()] = newValue.trim();
      newKey = '';
      newValue = '';
      isAdding = false;
      dispatch('change', editingData);
    }
  }

  function removeKey(key: string) {
    delete editingData[key];
    editingData = { ...editingData };
    dispatch('change', editingData);
  }

  function updateValue(key: string, value: string) {
    editingData[key] = value;
    editingData = { ...editingData };
    dispatch('change', editingData);
  }

  function saveChanges() {
    dispatch('save', editingData);
  }

  function cancelChanges() {
    editingData = { ...data };
    dispatch('cancel');
  }

  function formatValue(value: string): string {
    try {
      // Try to parse as JSON for better formatting
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If not JSON, return as is
      return value;
    }
  }

  function isJson(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  const dataEntries = $derived(Object.entries(editingData));
</script>

<div class="config-tree-editor">
  <div class="header">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    {#if !readOnly}
      <div class="actions">
        <Button 
          variant="outline" 
          size="sm" 
          onclick={() => isAdding = !isAdding}
          disabled={isAdding}
        >
          {isAdding ? 'Cancel' : 'Add Key'}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onclick={saveChanges}
        >
          Save
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onclick={cancelChanges}
        >
          Cancel
        </Button>
      </div>
    {/if}
  </div>

  <div class="content">
    {#if isAdding && !readOnly}
      <div class="add-form bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key
            </label>
            <input
              type="text"
              bind:value={newKey}
              placeholder="Enter key name"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value
            </label>
            <input
              type="text"
              bind:value={newValue}
              placeholder="Enter value"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <Button size="sm" onclick={addKeyValue}>
            Add
          </Button>
          <Button variant="outline" size="sm" onclick={() => isAdding = false}>
            Cancel
          </Button>
        </div>
      </div>
    {/if}

    {#if dataEntries.length === 0}
      <div class="empty-state text-center py-8">
        <div class="text-gray-500 dark:text-gray-400">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-lg font-medium">No configuration data</p>
          <p class="text-sm">Add some key-value pairs to get started</p>
        </div>
      </div>
    {:else}
      <div class="config-entries space-y-2">
        {#each dataEntries as [key, value]}
          <div class="config-entry bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="key-section mb-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Key
                  </label>
                  <input
                    type="text"
                    value={key}
                    readonly
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>
                <div class="value-section">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Value
                  </label>
                  {#if readOnly}
                    <div class="value-display">
                      {#if isJson(value)}
                        <pre class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm font-mono text-gray-900 dark:text-white overflow-x-auto">{formatValue(value)}</pre>
                      {:else}
                        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm font-mono text-gray-900 dark:text-white break-all">
                          {value}
                        </div>
                      {/if}
                    </div>
                  {:else}
                                         <textarea
                       value={value}
                       oninput={(e) => updateValue(key, (e.target as HTMLTextAreaElement).value)}
                       rows={isJson(value) ? 6 : 2}
                       class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm resize-y"
                       placeholder="Enter value"
                     />
                  {/if}
                </div>
              </div>
              {#if !readOnly}
                <div class="ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => removeKey(key)}
                    class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </Button>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .config-tree-editor {
    background-color: rgb(248 250 252);
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    border: 1px solid rgb(226 232 240);
  }

  @media (prefers-color-scheme: dark) {
    .config-tree-editor {
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

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .content {
    padding: 1rem;
  }

  .config-entries {
    max-height: 24rem;
    overflow-y: auto;
  }

  .config-entry {
    transition: all 0.2s;
  }

  .config-entry:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }

  .value-display {
    max-height: 12rem;
    overflow-y: auto;
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
</style>

