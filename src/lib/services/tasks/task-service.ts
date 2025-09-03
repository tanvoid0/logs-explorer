import { invoke } from '@tauri-apps/api/core';
import type { Task, TaskStatus } from '$lib/types/task';
import { logger } from '$lib/utils/logger';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  groupId?: string;
  parentId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  groupId?: string;
  parentId?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  groupId?: string;
  parentId?: string;
  searchQuery?: string;
}

export class TaskService {
  private static instance: TaskService;

  private constructor() {
    logger.info('TaskService initialized');
  }

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  async getAllTasks(): Promise<Task[]> {
    const traceId = logger.startTrace('getAllTasks');
    
    try {
      logger.debug('API call: get_all_tasks');
      
      const tasks = await invoke<any[]>('get_all_tasks');
      
      logger.debug('API response: get_all_tasks', { count: tasks.length });
      logger.debug('Database operation: SELECT tasks', { count: tasks.length, traceId });
      
      const mappedTasks = this.mapDatabaseTasksToFrontend(tasks);
      
      logger.info(`Retrieved ${mappedTasks.length} tasks`, { traceId });
      logger.endTrace(true, { traceId });
      
      return mappedTasks;
    } catch (error) {
      logger.error('API call failed: get_all_tasks', error as Error, { traceId });
      logger.error('Database operation failed: SELECT tasks', error as Error, { traceId });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to fetch tasks');
    }
  }

  async getTasksByGroup(groupId: string): Promise<Task[]> {
    const traceId = logger.startTrace('getTasksByGroup', { groupId });
    
    try {
      logger.debug('API call: get_tasks_by_group', { groupId });
      
      const tasks = await invoke<any[]>('get_tasks_by_group', { groupId });
      
      logger.debug('API response: get_tasks_by_group', { count: tasks.length, groupId });
      logger.debug('Database operation: SELECT tasks', { count: tasks.length, groupId, traceId });
      
      const mappedTasks = this.mapDatabaseTasksToFrontend(tasks);
      
      logger.info(`Retrieved ${mappedTasks.length} tasks for group ${groupId}`, { traceId, groupId });
      logger.endTrace(true, { traceId });
      
      return mappedTasks;
    } catch (error) {
      logger.error('API call failed: get_tasks_by_group', error as Error, { traceId, groupId });
      logger.error('Database operation failed: SELECT tasks', error as Error, { traceId, groupId });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to fetch tasks for group');
    }
  }

  async getSubtasks(parentId: string): Promise<Task[]> {
    const traceId = logger.startTrace('getSubtasks', { parentId });
    
    try {
      logger.debug('API call: get_subtasks', { parentId });
      
      const tasks = await invoke<any[]>('get_subtasks', { parentId });
      
      logger.debug('API response: get_subtasks', { count: tasks.length, parentId });
      logger.debug('Database operation: SELECT tasks', { count: tasks.length, parentId, traceId });
      
      const mappedTasks = this.mapDatabaseTasksToFrontend(tasks);
      
      logger.info(`Retrieved ${mappedTasks.length} subtasks for parent ${parentId}`, { traceId, parentId });
      logger.endTrace(true, { traceId });
      
      return mappedTasks;
    } catch (error) {
      logger.error('API call failed: get_subtasks', error as Error, { traceId, parentId });
      logger.error('Database operation failed: SELECT tasks', error as Error, { traceId, parentId });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to fetch subtasks');
    }
  }

  async createTask(request: CreateTaskRequest): Promise<Task> {
    const traceId = logger.startTrace('createTask', { 
      groupId: request.groupId,
      parentId: request.parentId 
    });
    
    try {
      logger.debug('API call: add_task', request);
      
      const task = await invoke<any>('add_task', {
        groupId: request.groupId,
        title: request.title,
        description: request.description,
        status: request.status,
        priority: request.priority,
        dueDate: request.dueDate?.toISOString(),
        parentId: request.parentId
      });
      
      logger.debug('API response: add_task', { taskId: task.uuid });
      logger.debug('Database operation: INSERT tasks', { taskId: task.uuid, traceId });
      
      const mappedTask = this.mapDatabaseTaskToFrontend(task);
      
      logger.taskCreated(mappedTask.id, mappedTask, { traceId });
      logger.endTrace(true, { traceId });
      
      return mappedTask;
    } catch (error) {
      logger.error('API call failed: add_task', error as Error, { traceId });
      logger.error('Database operation failed: INSERT tasks', error as Error, { traceId });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to create task');
    }
  }

  async updateTask(id: string, request: UpdateTaskRequest): Promise<Task> {
    const traceId = logger.startTrace('updateTask', { taskId: id });
    
    try {
      // First get the current task to log changes
      const currentTask = await this.getTaskById(id);
      
      logger.debug('API call: update_task', { taskId: id, ...request });
      
      const task = await invoke<any>('update_task', {
        uuid: id,
        title: request.title,
        description: request.description,
        status: request.status,
        priority: request.priority,
        dueDate: request.dueDate?.toISOString(),
        groupId: request.groupId,
        parentId: request.parentId
      });
      
      logger.debug('API response: update_task', { taskId: id });
      logger.debug('Database operation: UPDATE tasks', { taskId: id, traceId });
      
      const mappedTask = this.mapDatabaseTaskToFrontend(task);
      
      logger.taskUpdated(id, currentTask, mappedTask, { traceId });
      logger.endTrace(true, { traceId });
      
      return mappedTask;
    } catch (error) {
      logger.error('API call failed: update_task', error as Error, { traceId, taskId: id });
      logger.error('Database operation failed: UPDATE tasks', error as Error, { traceId, taskId: id });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to update task');
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    const traceId = logger.startTrace('deleteTask', { taskId: id });
    
    try {
      // First get the current task to log what we're deleting
      const currentTask = await this.getTaskById(id);
      
      logger.debug('API call: delete_task', { taskId: id });
      
      const result = await invoke<boolean>('delete_task', { uuid: id });
      
      logger.debug('API response: delete_task', { taskId: id, result });
      logger.debug('Database operation: DELETE tasks', { taskId: id, result, traceId });
      
      if (result && currentTask) {
        logger.taskDeleted(id, currentTask, { traceId });
      }
      
      logger.endTrace(true, { traceId });
      return result;
    } catch (error) {
      logger.error('API call failed: delete_task', error as Error, { traceId, taskId: id });
      logger.error('Database operation failed: DELETE tasks', error as Error, { traceId, taskId: id });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to delete task');
    }
  }

  async toggleTaskStatus(id: string): Promise<Task> {
    const traceId = logger.startTrace('toggleTaskStatus', { taskId: id });
    
    try {
      const currentTask = await this.getTaskById(id);
      
      logger.debug('API call: toggle_task_status', { taskId: id });
      
      const task = await invoke<any>('toggle_task_status', { uuid: id });
      
      logger.debug('API response: toggle_task_status', { taskId: id });
      logger.debug('Database operation: UPDATE tasks', { taskId: id, traceId });
      
      const mappedTask = this.mapDatabaseTaskToFrontend(task);
      
      if (currentTask) {
        logger.taskUpdated(id, currentTask, mappedTask, { traceId });
      }
      
      logger.info('Task status toggled', { 
        taskId: id,
        oldStatus: currentTask?.status, 
        newStatus: mappedTask.status,
        traceId
      });
      
      logger.endTrace(true, { traceId });
      return mappedTask;
    } catch (error) {
      logger.error('API call failed: toggle_task_status', error as Error, { traceId, taskId: id });
      logger.error('Database operation failed: UPDATE tasks', error as Error, { traceId, taskId: id });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to toggle task status');
    }
  }

  async moveTask(id: string, newGroupId: string): Promise<Task> {
    const traceId = logger.startTrace('moveTask', { taskId: id, newGroupId });
    
    try {
      const currentTask = await this.getTaskById(id);
      
      logger.debug('API call: move_task', { taskId: id, newGroupId });
      
      const task = await invoke<any>('move_task', { uuid: id, groupId: newGroupId });
      
      logger.debug('API response: move_task', { taskId: id, newGroupId });
      logger.debug('Database operation: UPDATE tasks', { taskId: id, newGroupId, traceId });
      
      const mappedTask = this.mapDatabaseTaskToFrontend(task);
      
      if (currentTask) {
        logger.taskUpdated(id, currentTask, mappedTask, { traceId });
      }
      
      logger.info('Task moved', { 
        taskId: id,
        oldGroupId: currentTask?.groupId, 
        newGroupId,
        traceId
      });
      
      logger.endTrace(true, { traceId });
      return mappedTask;
    } catch (error) {
      logger.error('API call failed: move_task', error as Error, { traceId, taskId: id, newGroupId });
      logger.error('Database operation failed: UPDATE tasks', error as Error, { traceId, taskId: id, newGroupId });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to move task');
    }
  }

  async getTasksWithFilters(filters: TaskFilters): Promise<Task[]> {
    const traceId = logger.startTrace('getTasksWithFilters', { filters });
    
    try {
      logger.debug('API call: get_tasks_with_filters', { filters });
      
      const tasks = await invoke<any[]>('get_tasks_with_filters', { filters });
      
      logger.debug('API response: get_tasks_with_filters', { count: tasks.length, filters });
      logger.debug('Database operation: SELECT tasks', { count: tasks.length, filters, traceId });
      
      const mappedTasks = this.mapDatabaseTasksToFrontend(tasks);
      
      logger.info(`Retrieved ${mappedTasks.length} tasks with filters`, { traceId, filters });
      logger.endTrace(true, { traceId });
      
      return mappedTasks;
    } catch (error) {
      logger.error('API call failed: get_tasks_with_filters', error as Error, { traceId, filters });
      logger.error('Database operation failed: SELECT tasks', error as Error, { traceId, filters });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to fetch filtered tasks');
    }
  }

  // Helper method to get a single task by ID (for logging purposes)
  private async getTaskById(id: string): Promise<Task | null> {
    try {
      const allTasks = await this.getAllTasks();
      return allTasks.find(task => task.id === id) || null;
    } catch (error) {
      logger.warn(`Failed to get task by ID for logging: ${id}`, { taskId: id });
      return null;
    }
  }

  private mapDatabaseTasksToFrontend(tasks: any[]): Task[] {
    return tasks.map(task => this.mapDatabaseTaskToFrontend(task));
  }

  private mapDatabaseTaskToFrontend(task: any): Task {
    return {
      id: task.uuid,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      createdAt: new Date(task.created_at || Date.now()),
      updatedAt: new Date(task.updated_at || Date.now()),
      subtasks: [],
      parentId: task.parent_id,
      groupId: task.group_id
    };
  }
}

export const taskService = TaskService.getInstance();
