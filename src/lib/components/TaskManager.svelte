<script lang="ts">
  import { onMount } from 'svelte';
  import { taskGroups, taskGroupActions, filteredTasks, taskStats } from '$lib/stores/task-store';
  import TaskGroup from './TaskGroup.svelte';
  import TaskFilters from './TaskFilters.svelte';
  import Icon from '@iconify/svelte';

  let showAddGroup = $state(false);
  let newGroupName = $state('');
  let newGroupDescription = $state('');
  let newGroupColor = $state('#3B82F6');

  const colorOptions = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
    '#6B7280', '#84CC16', '#06B6D4', '#F97316', '#A855F7', '#F43F5E'
  ];

  function handleAddGroup() {
    if (newGroupName.trim()) {
      taskGroupActions.create(newGroupName.trim(), newGroupDescription.trim(), newGroupColor);
      newGroupName = '';
      newGroupDescription = '';
      newGroupColor = '#3B82F6';
      showAddGroup = false;
    }
  }

  function handleUpdateGroup(event: CustomEvent) {
    taskGroupActions.update(event.detail.id, {
      name: event.detail.name,
      description: event.detail.description
    });
  }

  function handleDeleteGroup(event: CustomEvent) {
    taskGroupActions.delete(event.detail);
  }

  function getProgressPercentage() {
    const total = $taskStats.total;
    const completed = $taskStats.completed;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  onMount(() => {
    // Component mounted
  });
</script>

<div class="task-manager max-w-7xl mx-auto p-6">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Task Manager</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Organize your tasks with groups and subtasks</p>
      </div>
      <button
        onclick={() => showAddGroup = !showAddGroup}
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2"
      >
        <Icon icon="mdi:plus" class="w-4 h-4" />
        <span>New Group</span>
      </button>
    </div>

    <!-- Progress Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{$taskStats.total}</p>
          </div>
          <Icon icon="mdi:clipboard-text" class="w-8 h-8 text-blue-500" />
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{$taskStats.pending}</p>
          </div>
          <Icon icon="mdi:clock-outline" class="w-8 h-8 text-gray-500" />
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{$taskStats['in-progress']}</p>
          </div>
          <Icon icon="mdi:progress-clock" class="w-8 h-8 text-blue-500" />
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{$taskStats.completed}</p>
          </div>
          <Icon icon="mdi:check-circle" class="w-8 h-8 text-green-500" />
        </div>
      </div>
    </div>

    <!-- Overall Progress Bar -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{getProgressPercentage()}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
          style="width: {getProgressPercentage()}%"
        ></div>
      </div>
    </div>
  </div>

  <!-- Add Group Form -->
  {#if showAddGroup}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Group</h3>
      <div class="space-y-4">
        <div>
          <label for="group-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Group Name
          </label>
          <input
            id="group-name"
            type="text"
            bind:value={newGroupName}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter group name..."
          />
        </div>
        
        <div>
          <label for="group-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (optional)
          </label>
          <textarea
            id="group-description"
            bind:value={newGroupDescription}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter group description..."
            rows="3"
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div class="flex flex-wrap gap-2">
            {#each colorOptions as color}
              <button
                onclick={() => newGroupColor = color}
                class="w-8 h-8 rounded-full border-2 transition-all {newGroupColor === color ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-gray-300 dark:border-gray-600 hover:scale-105'}"
                style="background-color: {color}"
                aria-label="Select color {color}"
              ></button>
            {/each}
          </div>
        </div>
        
        <div class="flex space-x-3">
          <button
            onclick={handleAddGroup}
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Create Group
          </button>
          <button
            onclick={() => showAddGroup = false}
            class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <!-- Filters Sidebar -->
    <div class="lg:col-span-1">
      <TaskFilters />
    </div>

    <!-- Tasks Content -->
    <div class="lg:col-span-3">
      {#if $taskGroups.length === 0}
        <div class="text-center py-12">
          <Icon icon="mdi:clipboard-text-outline" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No task groups yet</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">Create your first task group to get started!</p>
          <button
            onclick={() => showAddGroup = true}
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Create First Group
          </button>
        </div>
      {:else}
        <div class="space-y-6">
          {#each $taskGroups as group (group.id)}
            <TaskGroup 
              {group} 
              on:updateGroup={handleUpdateGroup}
              on:deleteGroup={handleDeleteGroup}
            />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
