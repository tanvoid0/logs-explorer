<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TaskGroup as TaskGroupType } from '$lib/types/task';
  import { taskActions, filteredTasks } from '$lib/stores/task-store';
  import TaskItem from './TaskItem.svelte';
  import Icon from '@iconify/svelte';

  export let group: TaskGroupType;

  const dispatch = createEventDispatcher();

  let isExpanded = true;
  let isEditing = false;
  let editName = group.name;
  let editDescription = group.description || '';
  let showAddTask = false;
  let newTaskTitle = '';
  let newTaskDescription = '';

  // Get tasks for this group
  $: groupTasks = $filteredTasks.filter(task => !task.parentId);

  function handleEdit() {
    isEditing = true;
    editName = group.name;
    editDescription = group.description || '';
  }

  function handleSave() {
    // Update group
    dispatch('updateGroup', {
      id: group.id,
      name: editName,
      description: editDescription
    });
    isEditing = false;
  }

  function handleCancel() {
    isEditing = false;
    editName = group.name;
    editDescription = group.description || '';
  }

  function handleDelete() {
    if (confirm('Are you sure you want to delete this group and all its tasks?')) {
      dispatch('deleteGroup', group.id);
    }
  }

  function handleAddTask() {
    if (newTaskTitle.trim()) {
      taskActions.create(newTaskTitle.trim(), group.id, undefined, newTaskDescription.trim());
      newTaskTitle = '';
      newTaskDescription = '';
      showAddTask = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  }
</script>

<div class="task-group border border-gray-200 dark:border-gray-700 rounded-lg mb-6 bg-white dark:bg-gray-800 shadow-sm">
  <!-- Group Header -->
  <div class="p-4 border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3 flex-1">
        <!-- Expand/Collapse Button -->
        <button
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          on:click={() => isExpanded = !isExpanded}
        >
          <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} class="w-5 h-5" />
        </button>

        <!-- Group Color Indicator -->
        <div 
          class="w-4 h-4 rounded-full flex-shrink-0" 
          style="background-color: {group.color}"
        ></div>

        <!-- Group Content -->
        <div class="flex-1 min-w-0">
          {#if isEditing}
            <div class="space-y-2">
              <input
                type="text"
                bind:value={editName}
                class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                placeholder="Group name"
                on:keydown={handleKeydown}
              />
              <textarea
                bind:value={editDescription}
                class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Group description (optional)"
                rows="2"
                on:keydown={handleKeydown}
              />
              <div class="flex space-x-2">
                <button
                  on:click={handleSave}
                  class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  Save
                </button>
                <button
                  on:click={handleCancel}
                  class="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          {:else}
            <div class="flex items-center space-x-2">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {group.name}
              </h2>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                ({groupTasks.length} tasks)
              </span>
            </div>
            {#if group.description}
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {group.description}
              </p>
            {/if}
          {/if}
        </div>
      </div>

      <!-- Group Actions -->
      <div class="flex items-center space-x-2 ml-4">
        <button
          on:click={() => showAddTask = !showAddTask}
          class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center space-x-1"
        >
          <Icon icon="mdi:plus" class="w-4 h-4" />
          <span>Add Task</span>
        </button>
        <button
          on:click={handleEdit}
          class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Edit group"
        >
          <Icon icon="mdi:pencil" class="w-4 h-4" />
        </button>
        <button
          on:click={handleDelete}
          class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Delete group"
        >
          <Icon icon="mdi:delete" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Add Task Form -->
    {#if showAddTask}
      <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
        <div class="space-y-3">
          <input
            type="text"
            bind:value={newTaskTitle}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Task title"
          />
          <textarea
            bind:value={newTaskDescription}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Task description (optional)"
            rows="3"
          />
          <div class="flex space-x-2">
            <button
              on:click={handleAddTask}
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Task
            </button>
            <button
              on:click={() => showAddTask = false}
              class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Tasks List -->
  {#if isExpanded}
    <div class="p-4">
      {#if groupTasks.length === 0}
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <Icon icon="mdi:clipboard-text-outline" class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No tasks in this group yet.</p>
          <p class="text-sm">Click "Add Task" to get started!</p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each groupTasks as task (task.id)}
            <TaskItem {task} />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
