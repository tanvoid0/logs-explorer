import { writable, derived, get } from 'svelte/store';
import type { Task, TaskGroup, TaskStatus, TaskFilters, ResourceLink, ResourceLinkType } from '$lib/types/task';

// Create stores
export const taskGroups = writable<TaskGroup[]>([]);
export const tasks = writable<Task[]>([]);
export const taskFilters = writable<TaskFilters>({});

// Database persistence (localStorage for now, can be extended to real database)
const STORAGE_KEY = 'task-manager-data';

// Flag to prevent recursive storage operations
let isSaving = false;
// Flag to prevent multiple initializations
let isInitialized = false;

// Load data from storage
function loadFromStorage() {
  if (typeof window !== 'undefined' && !isInitialized) {
    try {
      isInitialized = true;
      console.log('Loading task data from storage...');
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log('Stored data:', stored);
      
      if (stored) {
        const data = JSON.parse(stored);
        console.log('Parsed data:', data);
        
        // Temporarily disable saving to prevent recursive operations
        isSaving = true;
        
        if (data.taskGroups) {
          // Convert date strings back to Date objects
          const groups = data.taskGroups.map((group: any) => ({
            ...group,
            createdAt: new Date(group.createdAt),
            updatedAt: new Date(group.updatedAt),
            resourceLink: group.resourceLink ? {
              ...group.resourceLink,
              linkedAt: new Date(group.resourceLink.linkedAt)
            } : undefined
          }));
          console.log('Setting task groups:', groups);
          taskGroups.set(groups);
        }
        if (data.tasks) {
          const taskList = data.tasks.map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined
          }));
          console.log('Setting tasks:', taskList);
          tasks.set(taskList);
        }
        
        // Re-enable saving after a short delay
        setTimeout(() => {
          isSaving = false;
        }, 100);
      } else {
        console.log('No stored data found');
      }
    } catch (error) {
      console.error('Failed to load task data from storage:', error);
      isSaving = false;
      isInitialized = false;
    }
  } else {
    console.log('Window not available or already initialized, skipping storage load');
  }
}

// Save data to storage
function saveToStorage() {
  if (typeof window !== 'undefined' && !isSaving) {
    try {
      isSaving = true;
      const currentGroups = get(taskGroups);
      const currentTasks = get(tasks);
      const data = {
        taskGroups: currentGroups,
        tasks: currentTasks
      };
      console.log('Saving data to storage:', data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Failed to save task data to storage:', error);
    } finally {
      // Re-enable saving after a short delay to prevent rapid successive saves
      setTimeout(() => {
        isSaving = false;
      }, 100);
    }
  }
}

// Subscribe to changes and save to storage
taskGroups.subscribe(() => {
  if (!isSaving) {
    console.log('Task groups changed, saving to storage...');
    saveToStorage();
  }
});

tasks.subscribe(() => {
  if (!isSaving) {
    console.log('Tasks changed, saving to storage...');
    saveToStorage();
  }
});

// Helper function to generate unique IDs
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper function to find task by ID (including nested subtasks)
const findTaskById = (taskList: Task[], id: string): Task | null => {
  for (const task of taskList) {
    if (task.id === id) return task;
    if (task.subtasks.length > 0) {
      const found = findTaskById(task.subtasks, id);
      if (found) return found;
    }
  }
  return null;
};

// Helper function to update task (including nested subtasks)
const updateTaskInList = (taskList: Task[], id: string, updates: Partial<Task>): Task[] => {
  return taskList.map(task => {
    if (task.id === id) {
      return { ...task, ...updates, updatedAt: new Date() };
    }
    if (task.subtasks.length > 0) {
      return {
        ...task,
        subtasks: updateTaskInList(task.subtasks, id, updates)
      };
    }
    return task;
  });
};

// Helper function to delete task (including nested subtasks)
const deleteTaskFromList = (taskList: Task[], id: string): Task[] => {
  return taskList.filter(task => {
    if (task.id === id) return false;
    if (task.subtasks.length > 0) {
      task.subtasks = deleteTaskFromList(task.subtasks, id);
    }
    return true;
  });
};

// Task group actions
export const taskGroupActions = {
  create: (name: string, description?: string, color?: string, resourceLink?: ResourceLink) => {
    const newGroup: TaskGroup = {
      id: generateId(),
      name,
      description,
      color: color || '#3B82F6',
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      resourceLink
    };
    
    console.log('Creating new task group:', newGroup);
    taskGroups.update(groups => [...groups, newGroup]);
    return newGroup;
  },

  update: (id: string, updates: Partial<TaskGroup>) => {
    console.log('Updating task group:', id, updates);
    taskGroups.update(groups =>
      groups.map(group =>
        group.id === id
          ? { ...group, ...updates, updatedAt: new Date() }
          : group
      )
    );
  },

  delete: (id: string) => {
    console.log('Deleting task group:', id);
    taskGroups.update(groups => groups.filter(group => group.id !== id));
    // Also remove tasks from this group
    tasks.update(taskList => taskList.filter(task => task.parentId !== id));
  },

  // Link to resource
  linkToResource: (groupId: string, link: ResourceLink) => {
    console.log('Linking task group to resource:', groupId, link);
    taskGroupActions.update(groupId, { resourceLink: link });
  },

  // Unlink from resource
  unlinkFromResource: (groupId: string) => {
    console.log('Unlinking task group from resource:', groupId);
    taskGroupActions.update(groupId, { resourceLink: undefined });
  },

  // Get groups linked to a specific resource
  getGroupsForResource: (resourceType: ResourceLinkType, resourceId: string): TaskGroup[] => {
    return get(taskGroups).filter(group => 
      group.resourceLink?.type === resourceType && group.resourceLink?.resourceId === resourceId
    );
  },

  // Convenience method for project linking
  linkToProject: (groupId: string, projectId: string, projectName: string) => {
    const link: ResourceLink = {
      type: 'project',
      resourceId: projectId,
      resourceName: projectName,
      linkedAt: new Date()
    };
    taskGroupActions.linkToResource(groupId, link);
  },

  // Convenience method for unlinking from project
  unlinkFromProject: (groupId: string) => {
    taskGroupActions.unlinkFromResource(groupId);
  }
};

// Task actions
export const taskActions = {
  create: (title: string, groupId: string, parentId?: string, description?: string) => {
    const newTask: Task = {
      id: generateId(),
      title,
      description,
      status: 'pending',
      priority: 'medium',
      dueDate: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      subtasks: [],
      parentId
    };

    console.log('Creating new task:', newTask);

    if (parentId) {
      // Add as subtask
      tasks.update(taskList => updateTaskInList(taskList, parentId, {
        subtasks: [...(findTaskById(taskList, parentId)?.subtasks || []), newTask]
      }));
    } else {
      // Add as main task
      tasks.update(taskList => [...taskList, newTask]);
    }

    return newTask;
  },

  update: (id: string, updates: Partial<Task>) => {
    console.log('Updating task:', id, updates);
    tasks.update(taskList => updateTaskInList(taskList, id, updates));
  },

  delete: (id: string) => {
    console.log('Deleting task:', id);
    tasks.update(taskList => deleteTaskFromList(taskList, id));
  },

  toggleStatus: (id: string) => {
    tasks.update(taskList => {
      const task = findTaskById(taskList, id);
      if (!task) return taskList;

      const statusOrder: TaskStatus[] = ['pending', 'in-progress', 'completed'];
      const currentIndex = statusOrder.indexOf(task.status);
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

      return updateTaskInList(taskList, id, { status: nextStatus });
    });
  },

  addSubtask: (parentId: string, title: string, description?: string) => {
    return taskActions.create(title, '', parentId, description);
  }
};

// Helper function for filtering tasks recursively
function filterTasksRecursive(taskList: Task[], filters: TaskFilters): Task[] {
  let filtered = taskList;

  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(task => {
      const matchesStatus = filters.status!.includes(task.status);
      const subtasksMatch = task.subtasks.length > 0 
        ? filterTasksRecursive(task.subtasks, filters).length > 0 
        : true;
      return matchesStatus || subtasksMatch;
    }).map(task => ({
      ...task,
      subtasks: filterTasksRecursive(task.subtasks, filters)
    }));
  }

  if (filters.priority && filters.priority.length > 0) {
    filtered = filtered.filter(task => {
      const matchesPriority = filters.priority!.includes(task.priority);
      const subtasksMatch = task.subtasks.length > 0 
        ? filterTasksRecursive(task.subtasks, filters).length > 0 
        : true;
      return matchesPriority || subtasksMatch;
    }).map(task => ({
      ...task,
      subtasks: filterTasksRecursive(task.subtasks, filters)
    }));
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                           (task.description && task.description.toLowerCase().includes(searchTerm));
      const subtasksMatch = task.subtasks.length > 0 
        ? filterTasksRecursive(task.subtasks, filters).length > 0 
        : true;
      return matchesSearch || subtasksMatch;
    }).map(task => ({
      ...task,
      subtasks: filterTasksRecursive(task.subtasks, filters)
    }));
  }

  return filtered;
}

// Derived stores
export const filteredTasks = derived(
  [tasks, taskFilters],
  ([$tasks, $filters]) => {
    return filterTasksRecursive($tasks, $filters);
  }
);

export const taskStats = derived(tasks, ($tasks) => {
  const calculateStats = (taskList: Task[]) => {
    let stats = { pending: 0, 'in-progress': 0, completed: 0, cancelled: 0, total: 0 };
    
    for (const task of taskList) {
      stats[task.status]++;
      stats.total++;
      if (task.subtasks.length > 0) {
        const subtaskStats = calculateStats(task.subtasks);
        stats.pending += subtaskStats.pending;
        stats['in-progress'] += subtaskStats['in-progress'];
        stats.completed += subtaskStats.completed;
        stats.cancelled += subtaskStats.cancelled;
        stats.total += subtaskStats.total;
      }
    }
    
    return stats;
  };

  return calculateStats($tasks);
});

// Initialize storage loading when the module is loaded
if (typeof window !== 'undefined') {
  // Don't auto-load on module load, wait for explicit initialization
  console.log('Task store module loaded, waiting for explicit initialization');
} else {
  // If we're in SSR, wait for the browser to be ready
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM loaded, but waiting for explicit initialization');
    });
  }
}

// Export a manual initialization function for components to call
export const initializeTaskStore = () => {
  if (!isInitialized) {
    console.log('Manual initialization of task store');
    loadFromStorage();
  } else {
    console.log('Task store already initialized, skipping');
  }
};

// Export a function to check if data is loaded
export const isDataLoaded = () => {
  const groups = get(taskGroups);
  const taskList = get(tasks);
  console.log('Current store state - Groups:', groups.length, 'Tasks:', taskList.length);
  return groups.length > 0 || taskList.length > 0;
};
