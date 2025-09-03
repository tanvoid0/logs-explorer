<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TaskGroup as TaskGroupType } from '$lib/types/task';
  import { taskActions, tasks } from '$lib/stores/task-store';
  import TaskItem from './TaskItem.svelte';
  import Icon from '@iconify/svelte';
  import Button from "$lib/components/ui/button.svelte";
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  const { group } = $props<{
    group: TaskGroupType;
  }>();

  const dispatch = createEventDispatcher();

  let isExpanded = $state(true);
  let isEditing = $state(false);
  let editName = $state(group.name);
  let editDescription = $state(group.description || '');
  let showAddTask = $state(false);
  let newTaskTitle = $state('');
  let newTaskDescription = $state('');

  // Get tasks for this group - tasks that have this group's ID as their groupId
  const groupTasks = $derived($tasks.filter(task => task.groupId === group.id));

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

  async function handleAddTask() {
    if (newTaskTitle.trim()) {
      try {
        await taskActions.create(newTaskTitle.trim(), group.id, undefined, newTaskDescription.trim());
        newTaskTitle = '';
        newTaskDescription = '';
        showAddTask = false;
      } catch (error) {
        console.error('Failed to create task:', error);
      }
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

<Card className="mb-6">
  <!-- Group Header -->
  <CardHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3 flex-1">
        <!-- Expand/Collapse Button -->
        <Button
          onclick={() => isExpanded = !isExpanded}
          variant="ghost"
          size="sm"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} class="w-5 h-5" />
        </Button>

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
                onkeydown={handleKeydown}
              />
              <textarea
                bind:value={editDescription}
                class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Group description"
                rows="2"
              ></textarea>
              <div class="flex space-x-2">
                <button
                  onclick={handleSave}
                  class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  Save
                </button>
                <button
                  onclick={handleCancel}
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
          onclick={() => showAddTask = !showAddTask}
          class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center space-x-1"
        >
          <Icon icon="mdi:plus" class="w-4 h-4" />
          <span>Add Task</span>
        </button>
        <button
          onclick={handleEdit}
          class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Edit group"
        >
          <Icon icon="mdi:pencil" class="w-4 h-4" />
        </button>
        <button
          onclick={handleDelete}
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
          ></textarea>
          <div class="flex space-x-2">
            <button
              onclick={handleAddTask}
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Task
            </button>
            <button
              onclick={() => showAddTask = false}
              class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    {/if}
  </CardHeader>

  <!-- Tasks List -->
  {#if isExpanded}
    <CardContent className="p-4">
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
    </CardContent>
  {/if}
</Card>
