import { writable, derived, get } from 'svelte/store';
import type { Task, TaskGroup, TaskStatus, TaskFilters, ResourceLink, ResourceLinkType } from '$lib/types/task';
import { TaskGroupService } from '$lib/services/tasks/task-group-service';
import { TaskService } from '$lib/services/tasks/task-service';

// Simple fallback logger to prevent initialization issues
const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data),
  error: (msg: string, error?: any, data?: any) => console.error(`[ERROR] ${msg}`, error, data),
  debug: (msg: string, data?: any) => console.log(`[DEBUG] ${msg}`, data),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data)
};

// Create stores
export const taskGroups = writable<TaskGroup[]>([]);
export const tasks = writable<Task[]>([]);
export const taskFilters = writable<TaskFilters>({});

// Service instances - lazy initialization
let taskGroupService: TaskGroupService | null = null;
let taskService: TaskService | null = null;

// Lazy getter for services
function getTaskGroupService(): TaskGroupService {
  try {
    if (!taskGroupService) {
      taskGroupService = TaskGroupService.getInstance();
    }
    return taskGroupService;
  } catch (error) {
    logger.error('Failed to get TaskGroupService instance', error as Error);
    throw new Error('TaskGroupService not available');
  }
}

function getTaskService(): TaskService {
  try {
    if (!taskService) {
      taskService = TaskService.getInstance();
    }
    return taskService;
  } catch (error) {
    logger.error('Failed to get TaskService instance', error as Error);
    throw new Error('TaskService not available');
  }
}

// Flag to prevent multiple initializations
let isInitialized = false;

// Helper function to generate unique IDs (for temporary use before database save)
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

// Task group actions - now using database
export const taskGroupActions = {
  create: async (name: string, description?: string, color?: string, resourceLink?: ResourceLink): Promise<TaskGroup> => {
    try {
      logger.info('Creating task group via database', { name, description, color });
      
      const newGroup = await getTaskGroupService().createTaskGroup({
        name,
        description,
        color: color || '#3B82F6',
        resourceLinkType: resourceLink?.type,
        resourceLinkId: resourceLink?.resourceId,
        resourceLinkName: resourceLink?.resourceName
      });
      
      // Update local store with the new group from database
      taskGroups.update(groups => [...groups, newGroup]);
      
      logger.info('Task group created successfully', { groupId: newGroup.id, groupName: newGroup.name });
      return newGroup;
    } catch (error) {
      logger.error('Failed to create task group', error as Error, { name, description, color });
      throw new Error('Failed to create task group');
    }
  },

  update: async (id: string, updates: Partial<TaskGroup>): Promise<void> => {
    try {
      logger.info('Updating task group via database', { groupId: id, updates });
      
      await getTaskGroupService().updateTaskGroup(id, updates);
      
      // Update local store
      taskGroups.update(groups =>
        groups.map(group =>
          group.id === id
            ? { ...group, ...updates, updatedAt: new Date() }
            : group
        )
      );
      
      logger.info('Task group updated successfully', { groupId: id });
    } catch (error) {
      logger.error('Failed to update task group', error as Error, { groupId: id, updates });
      throw new Error('Failed to update task group');
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      logger.info('Deleting task group via database', { groupId: id });
      
      await getTaskGroupService().deleteTaskGroup(id);
      
      // Update local store
      taskGroups.update(groups => groups.filter(group => group.id !== id));
      // Also remove tasks from this group
      tasks.update(taskList => taskList.filter(task => task.parentId !== id));
      
      logger.info('Task group deleted successfully', { groupId: id });
    } catch (error) {
      logger.error('Failed to delete task group', error as Error, { groupId: id });
      throw new Error('Failed to delete task group');
    }
  },

  // Link to resource
  linkToResource: async (groupId: string, link: ResourceLink): Promise<void> => {
    try {
      logger.info('Linking task group to resource via database', { groupId, link });
      
      // Update local store with resource link
      taskGroups.update(groups =>
        groups.map(group =>
          group.id === groupId
            ? { ...group, resourceLink: link, updatedAt: new Date() }
            : group
        )
      );
      
      logger.info('Task group linked to resource successfully', { groupId, resourceType: link.type, resourceId: link.resourceId });
    } catch (error) {
      logger.error('Failed to link task group to resource', error as Error, { groupId, link });
      throw new Error('Failed to link task group to resource');
    }
  },

  // Unlink from resource
  unlinkFromResource: async (groupId: string): Promise<void> => {
    try {
      logger.info('Unlinking task group from resource via database', { groupId });
      
      // Update local store to remove resource link
      taskGroups.update(groups =>
        groups.map(group =>
          group.id === groupId
            ? { ...group, resourceLink: undefined, updatedAt: new Date() }
            : group
        )
      );
      
      logger.info('Task group unlinked from resource successfully', { groupId });
    } catch (error) {
      logger.error('Failed to unlink task group from resource', error as Error, { groupId });
      throw new Error('Failed to unlink task group from resource');
    }
  },

  // Get groups linked to a specific resource
  getGroupsForResource: async (resourceType: ResourceLinkType, resourceId: string): Promise<TaskGroup[]> => {
    try {
      logger.info('Getting task groups for resource via database', { resourceType, resourceId });
      
      const groups = await getTaskGroupService().getTaskGroupsByResource(resourceType, resourceId);
      
      logger.info(`Retrieved ${groups.length} task groups for resource`, { resourceType, resourceId });
      return groups;
    } catch (error) {
      logger.error('Failed to get task groups for resource', error as Error, { resourceType, resourceId });
      throw new Error('Failed to get task groups for resource');
    }
  },

  // Convenience method for project linking
  linkToProject: async (groupId: string, projectId: string, projectName: string): Promise<void> => {
    return taskGroupActions.linkToResource(groupId, {
      type: 'project',
      resourceId: projectId,
      resourceName: projectName,
      linkedAt: new Date()
    });
  }
};

// Task actions - now using database
export const taskActions = {
  create: async (title: string, groupId?: string, parentId?: string, description?: string, priority: 'low' | 'medium' | 'high' = 'medium', dueDate?: Date): Promise<Task> => {
    try {
      logger.info('Creating task via database', { title, groupId, parentId, description, priority, dueDate });
      
      const newTask = await getTaskService().createTask({
        title,
        description,
        status: 'pending',
        priority,
        dueDate,
        groupId,
        parentId
      });
      
      // Update local store
      tasks.update(taskList => [...taskList, newTask]);
      
      logger.info('Task created successfully', { taskId: newTask.id, title });
      return newTask;
    } catch (error) {
      logger.error('Failed to create task', error as Error, { title, groupId, parentId });
      throw new Error('Failed to create task');
    }
  },

  update: async (id: string, updates: Partial<Task>): Promise<void> => {
    try {
      logger.info('Updating task via database', { taskId: id, updates });
      
      await getTaskService().updateTask(id, updates);
      
      // Update local store
      tasks.update(taskList => updateTaskInList(taskList, id, updates));
      
      logger.info('Task updated successfully', { taskId: id });
    } catch (error) {
      logger.error('Failed to update task', error as Error, { taskId: id, updates });
      throw new Error('Failed to update task');
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      logger.info('Deleting task via database', { taskId: id });
      
      await getTaskService().deleteTask(id);
      
      // Update local store
      tasks.update(taskList => deleteTaskFromList(taskList, id));
      
      logger.info('Task deleted successfully', { taskId: id });
    } catch (error) {
      logger.error('Failed to delete task', error as Error, { taskId: id });
      throw new Error('Failed to delete task');
    }
  },

  updateStatus: async (id: string, status: TaskStatus): Promise<void> => {
    return taskActions.update(id, { status });
  },

  updatePriority: async (id: string, priority: 'low' | 'medium' | 'high'): Promise<void> => {
    return taskActions.update(id, { priority });
  },

  toggleStatus: async (id: string): Promise<void> => {
    try {
      const currentTask = get(tasks).find(task => task.id === id);
      if (!currentTask) {
        logger.error('Task not found for status toggle', { taskId: id });
        return;
      }

      // Cycle through statuses: pending -> in-progress -> completed -> pending
      const statusOrder: TaskStatus[] = ['pending', 'in-progress', 'completed'];
      const currentIndex = statusOrder.indexOf(currentTask.status);
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

      await taskActions.updateStatus(id, nextStatus);
      logger.info('Task status toggled successfully', { taskId: id, newStatus: nextStatus });
    } catch (error) {
      logger.error('Failed to toggle task status', error as Error, { taskId: id });
      throw new Error('Failed to toggle task status');
    }
  },

  addSubtask: async (parentId: string, title: string, description: string): Promise<Task> => {
    try {
      logger.info('Adding subtask via database', { parentId, title, description });
      
      const newSubtask = await getTaskService().createTask({
        title,
        description,
        status: 'pending',
        priority: 'medium',
        parentId
      });
      
      // Update local store to add subtask to parent
      tasks.update(taskList => updateTaskInList(taskList, parentId, {
        subtasks: [...(get(tasks).find(t => t.id === parentId)?.subtasks || []), newSubtask]
      }));
      
      logger.info('Subtask added successfully', { subtaskId: newSubtask.id, parentId, title });
      return newSubtask;
    } catch (error) {
      logger.error('Failed to add subtask', error as Error, { parentId, title, description });
      throw new Error('Failed to add subtask');
    }
  }
};

// Filter tasks based on current filters
function filterTasksRecursive(taskList: Task[], filters: TaskFilters): Task[] {
  let filtered = [...taskList];

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

// Initialize store by loading data from database
export const initializeTaskStore = async (): Promise<void> => {
  if (isInitialized) {
    logger.info('Task store already initialized, skipping');
    return;
  }

  try {
    logger.info('Initializing task store from database...');
    
    // Check if services are available
    const groupService = getTaskGroupService();
    const taskServiceInstance = getTaskService();
    
    // Load task groups and tasks from database
    const [groups, taskList] = await Promise.all([
      groupService.getAllTaskGroups(),
      taskServiceInstance.getAllTasks()
    ]);
    
    // Update stores with data from database
    taskGroups.set(groups);
    tasks.set(taskList);
    
    isInitialized = true;
    logger.info('Task store initialized successfully', { 
      groupCount: groups.length, 
      taskCount: taskList.length 
    });
  } catch (error) {
    logger.error('Failed to initialize task store from database', error as Error);
    // Set empty arrays to prevent errors
    taskGroups.set([]);
    tasks.set([]);
    // Don't throw error, just log it and continue with empty stores
    console.warn('Task store initialization failed, continuing with empty stores');
  }
};

// Export a function to check if data is loaded
export const isDataLoaded = (): boolean => {
  const groups = get(taskGroups);
  const taskList = get(tasks);
  logger.debug('Current store state', { 
    groupCount: groups.length, 
    taskCount: taskList.length 
  });
  return groups.length > 0 || taskList.length > 0;
};

// Export a function to refresh data from database
export const refreshTaskStore = async (): Promise<void> => {
  try {
    logger.info('Refreshing task store from database...');
    
    const groupService = getTaskGroupService();
    const taskServiceInstance = getTaskService();
    
    const [groups, taskList] = await Promise.all([
      groupService.getAllTaskGroups(),
      taskServiceInstance.getAllTasks()
    ]);
    
    taskGroups.set(groups);
    tasks.set(taskList);
    
    logger.info('Task store refreshed successfully', { 
      groupCount: groups.length, 
      taskCount: taskList.length 
    });
  } catch (error) {
    logger.error('Failed to refresh task store from database', error as Error);
    // Don't throw error, just log it
    console.warn('Task store refresh failed');
  }
};
