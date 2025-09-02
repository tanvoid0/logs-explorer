<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Task, TaskStatus } from '$lib/types/task';
  import { taskActions } from '$lib/stores/task-store';
  import Icon from '@iconify/svelte';
  import Button from '$lib/components/ui/button.svelte';
  import TaskItem from './TaskItem.svelte';

  const { task, depth = 0, showSubtasks = true } = $props<{
    task: Task;
    depth?: number;
    showSubtasks?: boolean;
  }>();

  const dispatch = createEventDispatcher();

  let isExpanded = $state(true);
  let isEditing = $state(false);
  let editTitle = $state(task.title);
  let editDescription = $state(task.description || '');
  let showAddSubtask = $state(false);
  let newSubtaskTitle = $state('');
  let newSubtaskDescription = $state('');

  const statusColors = {
    'pending': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  const priorityColors = {
    'low': 'text-gray-500',
    'medium': 'text-yellow-600',
    'high': 'text-red-600'
  };

  const priorityIcons = {
    'low': 'mdi:flag-outline',
    'medium': 'mdi:flag',
    'high': 'mdi:flag-variant'
  };

  function handleStatusToggle() {
    taskActions.toggleStatus(task.id);
  }

  function handleEdit() {
    isEditing = true;
    editTitle = task.title;
    editDescription = task.description || '';
  }

  function handleSave() {
    taskActions.update(task.id, {
      title: editTitle,
      description: editDescription
    });
    isEditing = false;
  }

  function handleCancel() {
    isEditing = false;
    editTitle = task.title;
    editDescription = task.description || '';
  }

  function handleDelete() {
    if (confirm('Are you sure you want to delete this task?')) {
      taskActions.delete(task.id);
    }
  }

  function handleAddSubtask() {
    if (newSubtaskTitle.trim()) {
      taskActions.addSubtask(task.id, newSubtaskTitle.trim(), newSubtaskDescription.trim());
      newSubtaskTitle = '';
      newSubtaskDescription = '';
      showAddSubtask = false;
    }
  }

  function handlePriorityChange(priority: 'low' | 'medium' | 'high') {
    taskActions.update(task.id, { priority });
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }
</script>

<div class="task-item border border-gray-200 dark:border-gray-700 rounded-lg mb-2 bg-white dark:bg-gray-800 shadow-sm">
  <div class="p-4" style="padding-left: {depth * 20 + 16}px;">
    <!-- Task Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3 flex-1">
        <!-- Expand/Collapse Button -->
        {#if task.subtasks.length > 0}
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onclick={() => isExpanded = !isExpanded}
          >
            <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} class="w-5 h-5" />
          </button>
        {:else}
          <div class="w-5"></div>
        {/if}

        <!-- Status Toggle -->
        <button
          class="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors {task.status === 'completed' ? 'bg-green-500 border-green-500' : ''}"
          onclick={handleStatusToggle}
        >
          {#if task.status === 'completed'}
            <Icon icon="mdi:check" class="w-3 h-3 text-white" />
          {/if}
        </button>

        <!-- Task Content -->
        <div class="flex-1 min-w-0">
          {#if isEditing}
            <div class="space-y-2">
              <input
                type="text"
                bind:value={editTitle}
                class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Task title"
              />
              <textarea
                bind:value={editDescription}
                class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Task description (optional)"
                rows="2"
              ></textarea>
              <div class="flex space-x-2">
                <button
                  class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                  onclick={handleSave}
                >
                  Save
                </button>
                <button
                  class="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
                  onclick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          {:else}
            <div class="flex items-center space-x-2">
              <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 {task.status === 'completed' ? 'line-through text-gray-500' : ''}">
                {task.title}
              </h3>
              {#if task.dueDate}
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  Due: {formatDate(task.dueDate)}
                </span>
              {/if}
            </div>
            {#if task.description}
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 {task.status === 'completed' ? 'line-through' : ''}">
                {task.description}
              </p>
            {/if}
          {/if}
        </div>
      </div>

      <!-- Task Actions -->
      <div class="flex items-center space-x-2 ml-4">
        <!-- Priority -->
        <div class="relative">
          <button
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            onclick={() => dispatch('priorityMenu', { taskId: task.id, priority: task.priority })}
          >
            <Icon 
              icon={priorityIcons[task.priority as keyof typeof priorityIcons]} 
              class="w-4 h-4 {priorityColors[task.priority as keyof typeof priorityColors]}" 
            />
          </button>
        </div>

        <!-- Status Badge -->
        <span class="px-2 py-1 text-xs font-medium rounded-full {statusColors[task.status as keyof typeof statusColors]}">
          {task.status.replace('-', ' ')}
        </span>

        <!-- Action Buttons -->
        <div class="flex items-center space-x-1">
          <button
            onclick={() => showAddSubtask = !showAddSubtask}
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Add subtask"
          >
            <Icon icon="mdi:plus" class="w-4 h-4" />
          </button>
          <button
            onclick={handleEdit}
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Edit task"
          >
            <Icon icon="mdi:pencil" class="w-4 h-4" />
          </button>
          <button
            onclick={handleDelete}
            class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete task"
          >
            <Icon icon="mdi:delete" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Add Subtask Form -->
    {#if showAddSubtask}
      <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
        <div class="space-y-2">
          <input
            type="text"
            bind:value={newSubtaskTitle}
            class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Subtask title"
          />
          <textarea
            bind:value={newSubtaskDescription}
            class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Subtask description (optional)"
            rows="2"
          ></textarea>
          <div class="flex space-x-2">
            <button
              onclick={handleAddSubtask}
              class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Add Subtask
            </button>
            <button
              onclick={() => showAddSubtask = false}
              class="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Subtasks -->
  {#if showSubtasks && task.subtasks.length > 0 && isExpanded}
    <div class="subtasks">
      {#each task.subtasks as subtask (subtask.id)}
        <TaskItem 
          task={subtask} 
          depth={depth + 1} 
          showSubtasks={showSubtasks}
        />
      {/each}
    </div>
  {/if}
</div>
