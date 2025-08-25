<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from './ui/button.svelte';

  export interface FilterCondition {
    id: string;
    field: string;
    operator: string;
    value: string;
    enabled: boolean;
  }

  export interface FilterGroup {
    id: string;
    conditions: FilterCondition[];
    operator: 'AND' | 'OR';
    enabled: boolean;
  }

  const { filterGroups: initialFilterGroups = [] } = $props<{
    filterGroups?: FilterGroup[];
  }>();
  
  let filterGroups = $state<FilterGroup[]>(initialFilterGroups);

  const dispatch = createEventDispatcher<{
    filtersChange: FilterGroup[];
    applyFilters: FilterGroup[];
    clearFilters: void;
  }>();

  // Available fields for filtering
  const availableFields = [
    { value: 'message', label: 'Message', type: 'text' },
    { value: 'level', label: 'Log Level', type: 'select', options: ['INFO', 'WARNING', 'ERROR', 'DEBUG'] },
    { value: 'namespace', label: 'Namespace', type: 'text' },
    { value: 'pod', label: 'Pod Name', type: 'text' },
    { value: 'container', label: 'Container', type: 'text' },
    { value: 'timestamp', label: 'Timestamp', type: 'datetime' },
    { value: 'severity', label: 'Severity', type: 'select', options: ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'] },
    { value: 'logger', label: 'Logger', type: 'text' },
    { value: 'requestId', label: 'Request ID', type: 'text' },
    { value: 'traceId', label: 'Trace ID', type: 'text' },
    { value: 'userId', label: 'User ID', type: 'text' },
    { value: 'method', label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] },
    { value: 'url', label: 'URL', type: 'text' },
    { value: 'statusCode', label: 'Status Code', type: 'number' },
    { value: 'duration', label: 'Duration (ms)', type: 'number' },
    { value: 'error', label: 'Error Message', type: 'text' },
    { value: 'stackTrace', label: 'Stack Trace', type: 'text' }
  ];

  // Available operators
  const availableOperators = [
    { value: 'equals', label: 'Equals', description: 'Exact match' },
    { value: 'not_equals', label: 'Not Equals', description: 'Exact non-match' },
    { value: 'contains', label: 'Contains', description: 'Contains text' },
    { value: 'not_contains', label: 'Not Contains', description: 'Does not contain text' },
    { value: 'starts_with', label: 'Starts With', description: 'Begins with text' },
    { value: 'ends_with', label: 'Ends With', description: 'Ends with text' },
    { value: 'regex', label: 'Regex', description: 'Regular expression' },
    { value: 'not_regex', label: 'Not Regex', description: 'Does not match regex' },
    { value: 'greater_than', label: 'Greater Than', description: 'Numeric comparison' },
    { value: 'less_than', label: 'Less Than', description: 'Numeric comparison' },
    { value: 'greater_than_equal', label: 'Greater Than or Equal', description: 'Numeric comparison' },
    { value: 'less_than_equal', label: 'Less Than or Equal', description: 'Numeric comparison' },
    { value: 'in', label: 'In List', description: 'Value in comma-separated list' },
    { value: 'not_in', label: 'Not In List', description: 'Value not in comma-separated list' },
    { value: 'is_null', label: 'Is Null/Empty', description: 'Field is null or empty' },
    { value: 'is_not_null', label: 'Is Not Null/Empty', description: 'Field is not null or empty' }
  ];

  let showAdvancedFilter = $state(false);

  function addFilterGroup() {
    const newGroup: FilterGroup = {
      id: crypto.randomUUID(),
      operator: 'AND',
      enabled: true,
      conditions: [{
        id: crypto.randomUUID(),
        field: 'message',
        operator: 'contains',
        value: '',
        enabled: true
      }]
    };
    
    filterGroups = [...filterGroups, newGroup];
    dispatch('filtersChange', filterGroups);
  }

  function removeFilterGroup(groupId: string) {
    filterGroups = filterGroups.filter(group => group.id !== groupId);
    dispatch('filtersChange', filterGroups);
  }

  function addCondition(groupId: string) {
    filterGroups = filterGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: [...group.conditions, {
            id: crypto.randomUUID(),
            field: 'message',
            operator: 'contains',
            value: '',
            enabled: true
          }]
        };
      }
      return group;
    });
    dispatch('filtersChange', filterGroups);
  }

  function removeCondition(groupId: string, conditionId: string) {
    filterGroups = filterGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.filter(condition => condition.id !== conditionId)
        };
      }
      return group;
    });
    dispatch('filtersChange', filterGroups);
  }

  function updateCondition(groupId: string, conditionId: string, updates: Partial<FilterCondition>) {
    filterGroups = filterGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.map(condition => {
            if (condition.id === conditionId) {
              return { ...condition, ...updates };
            }
            return condition;
          })
        };
      }
      return group;
    });
    dispatch('filtersChange', filterGroups);
  }

  function updateFilterGroup(groupId: string, updates: Partial<FilterGroup>) {
    filterGroups = filterGroups.map(group => {
      if (group.id === groupId) {
        return { ...group, ...updates };
      }
      return group;
    });
    dispatch('filtersChange', filterGroups);
  }

  function clearAllFilters() {
    filterGroups = [];
    dispatch('clearFilters');
  }

  function applyFilters() {
    dispatch('applyFilters', filterGroups);
  }

  function getFieldType(fieldName: string) {
    const field = availableFields.find(f => f.value === fieldName);
    return field?.type || 'text';
  }

  function getFieldOptions(fieldName: string) {
    const field = availableFields.find(f => f.value === fieldName);
    return field?.options || [];
  }

  function isOperatorDisabled(operator: string, fieldType: string) {
    if (fieldType === 'select') {
      return !['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'].includes(operator);
    }
    if (fieldType === 'number') {
      return !['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_equal', 'less_than_equal', 'in', 'not_in', 'is_null', 'is_not_null'].includes(operator);
    }
    if (fieldType === 'datetime') {
      return !['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_equal', 'less_than_equal', 'is_null', 'is_not_null'].includes(operator);
    }
    return false;
  }

  function shouldShowValueInput(operator: string) {
    return !['is_null', 'is_not_null'].includes(operator);
  }
</script>

<div class="space-y-4">
  <!-- Filter Toggle -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2">
      <Button
        variant="outline"
        onclick={() => showAdvancedFilter = !showAdvancedFilter}
        class="flex items-center space-x-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
        </svg>
        <span>Advanced Filters</span>
        {#if filterGroups.length > 0}
          <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {filterGroups.reduce((total, group) => total + group.conditions.length, 0)}
          </span>
        {/if}
      </Button>
      
      {#if filterGroups.length > 0}
        <Button variant="outline" onclick={clearAllFilters} class="text-red-600 hover:text-red-700">
          Clear All
        </Button>
      {/if}
    </div>
    
    {#if showAdvancedFilter && filterGroups.length > 0}
      <Button onclick={applyFilters} class="bg-blue-600 hover:bg-blue-700 text-white">
        Apply Filters
      </Button>
    {/if}
  </div>

  {#if showAdvancedFilter}
    <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
      <!-- Filter Groups -->
      <div class="space-y-4">
        {#each filterGroups as group, groupIndex}
          <div class="border border-slate-200 dark:border-slate-600 rounded-lg p-3">
            <!-- Group Header -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                                 <input
                   type="checkbox"
                   checked={group.enabled}
                   onchange={(e) => updateFilterGroup(group.id, { enabled: (e.target as HTMLInputElement).checked })}
                   class="rounded border-slate-300 dark:border-slate-600"
                 />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Group {groupIndex + 1}
                </span>
                                 <select
                   value={group.operator}
                   onchange={(e) => updateFilterGroup(group.id, { operator: (e.target as HTMLSelectElement).value as 'AND' | 'OR' })}
                   class="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800"
                 >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              </div>
              
              <div class="flex items-center space-x-2">
                <button
                  onclick={() => addCondition(group.id)}
                  class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + Add Condition
                </button>
                {#if filterGroups.length > 1}
                  <button
                    onclick={() => removeFilterGroup(group.id)}
                    class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove Group
                  </button>
                {/if}
              </div>
            </div>

            <!-- Conditions -->
            <div class="space-y-2">
              {#each group.conditions as condition, conditionIndex}
                <div class="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-slate-700 rounded">
                                     <input
                     type="checkbox"
                     checked={condition.enabled}
                     onchange={(e) => updateCondition(group.id, condition.id, { enabled: (e.target as HTMLInputElement).checked })}
                     class="rounded border-slate-300 dark:border-slate-600"
                   />
                   
                   <select
                     value={condition.field}
                     onchange={(e) => updateCondition(group.id, condition.id, { field: (e.target as HTMLSelectElement).value })}
                     class="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 min-w-24"
                   >
                     {#each availableFields as field}
                       <option value={field.value}>{field.label}</option>
                     {/each}
                   </select>
                   
                   <select
                     value={condition.operator}
                     onchange={(e) => updateCondition(group.id, condition.id, { operator: (e.target as HTMLSelectElement).value })}
                     class="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 min-w-28"
                   >
                     {#each availableOperators as operator}
                       <option 
                         value={operator.value} 
                         disabled={isOperatorDisabled(operator.value, getFieldType(condition.field))}
                       >
                         {operator.label}
                       </option>
                     {/each}
                   </select>
                   
                   {#if shouldShowValueInput(condition.operator)}
                     {#if getFieldType(condition.field) === 'select'}
                       <select
                         value={condition.value}
                         onchange={(e) => updateCondition(group.id, condition.id, { value: (e.target as HTMLSelectElement).value })}
                         class="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 flex-1"
                       >
                         <option value="">Select value...</option>
                         {#each getFieldOptions(condition.field) as option}
                           <option value={option}>{option}</option>
                         {/each}
                       </select>
                     {:else if getFieldType(condition.field) === 'datetime'}
                       <input
                         type="datetime-local"
                         value={condition.value}
                         onchange={(e) => updateCondition(group.id, condition.id, { value: (e.target as HTMLInputElement).value })}
                         class="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 flex-1"
                       />
                     {:else}
                       <input
                         type={getFieldType(condition.field)}
                         value={condition.value}
                         onchange={(e) => updateCondition(group.id, condition.id, { value: (e.target as HTMLInputElement).value })}
                         placeholder="Enter value..."
                         class="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 flex-1"
                       />
                     {/if}
                   {/if}
                  
                  {#if group.conditions.length > 1}
                    <button
                      onclick={() => removeCondition(group.id, condition.id)}
                      class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      ×
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
        
        <!-- Add Group Button -->
        <button
          onclick={addFilterGroup}
          class="w-full p-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          + Add Filter Group
        </button>
      </div>
    </div>
  {/if}
</div>
