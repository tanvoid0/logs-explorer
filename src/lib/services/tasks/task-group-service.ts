import { invoke } from '@tauri-apps/api/core';
import type { TaskGroup } from '$lib/types/task';
import { logger } from '$lib/utils/logger';

export interface CreateTaskGroupRequest {
  name: string;
  description?: string;
  color: string;
  resourceLinkType?: string;
  resourceLinkId?: string;
  resourceLinkName?: string;
}

export interface UpdateTaskGroupRequest {
  name?: string;
  description?: string;
  color?: string;
}

export interface TaskGroupFilters {
  resourceLinkType?: string;
  resourceLinkId?: string;
  searchQuery?: string;
}

export class TaskGroupService {
  private static instance: TaskGroupService;

  private constructor() {
    logger.info('TaskGroupService initialized');
  }

  static getInstance(): TaskGroupService {
    if (!TaskGroupService.instance) {
      TaskGroupService.instance = new TaskGroupService();
    }
    return TaskGroupService.instance;
  }

  async getAllTaskGroups(): Promise<TaskGroup[]> {
    const traceId = logger.startTrace('getAllTaskGroups');
    
    try {
      logger.debug('API call: get_all_task_groups');
      
      const groups = await invoke<any[]>('get_all_task_groups');
      
      logger.debug('API response: get_all_task_groups', { count: groups.length });
      logger.debug('Database operation: SELECT task_groups', { count: groups.length, traceId });
      
      const mappedGroups = this.mapDatabaseGroupsToFrontend(groups);
      
      logger.info(`Retrieved ${mappedGroups.length} task groups`, { traceId });
      logger.endTrace(true, { traceId });
      
      return mappedGroups;
    } catch (error) {
      logger.error('API call failed: get_all_task_groups', error as Error, { traceId });
      logger.error('Database operation failed: SELECT task_groups', error as Error, { traceId });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to fetch task groups');
    }
  }

  async getTaskGroupsByResource(resourceType: string, resourceId: string): Promise<TaskGroup[]> {
    const traceId = logger.startTrace('getTaskGroupsByResource', { resourceType, resourceId });
    
    try {
      logger.debug('API call: get_task_groups_by_resource', { resourceType, resourceId });
      
      const groups = await invoke<any[]>('get_task_groups_by_resource', { resourceType, resourceId });
      
      logger.debug('API response: get_task_groups_by_resource', { count: groups.length, resourceType, resourceId });
      logger.debug('Database operation: SELECT task_groups', { count: groups.length, resourceType, resourceId, traceId });
      
      const mappedGroups = this.mapDatabaseGroupsToFrontend(groups);
      
      logger.info(`Retrieved ${mappedGroups.length} task groups for resource ${resourceType}:${resourceId}`, { traceId, resourceType, resourceId });
      logger.endTrace(true, { traceId });
      
      return mappedGroups;
    } catch (error) {
      logger.error('API call failed: get_task_groups_by_resource', error as Error, { traceId, resourceType, resourceId });
      logger.error('Database operation failed: SELECT task_groups', error as Error, { traceId, resourceType, resourceId });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to fetch task groups for resource');
    }
  }

  async createTaskGroup(request: CreateTaskGroupRequest): Promise<TaskGroup> {
    const traceId = logger.startTrace('createTaskGroup', { 
      resourceLinkType: request.resourceLinkType,
      resourceLinkId: request.resourceLinkId 
    });
    
    try {
      logger.debug('API call: add_task_group', request);
      
      const group = await invoke<any>('add_task_group', {
        name: request.name,
        description: request.description,
        color: request.color,
        resourceLinkType: request.resourceLinkType,
        resourceLinkId: request.resourceLinkId,
        resourceLinkName: request.resourceLinkName
      });
      
      logger.debug('API response: add_task_group', { groupId: group.uuid });
      logger.debug('Database operation: INSERT task_groups', { groupId: group.uuid, traceId });
      
      const mappedGroup = this.mapDatabaseGroupToFrontend(group);
      
      logger.info('Task group created', {
        groupId: mappedGroup.id,
        groupName: mappedGroup.name,
        resourceLinkType: request.resourceLinkType,
        resourceLinkId: request.resourceLinkId,
        traceId
      });
      
      logger.endTrace(true, { traceId });
      return mappedGroup;
    } catch (error) {
      logger.error('API call failed: add_task_group', error as Error, { traceId });
      logger.error('Database operation failed: INSERT task_groups', error as Error, { traceId });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to create task group');
    }
  }

  async updateTaskGroup(id: string, request: UpdateTaskGroupRequest): Promise<TaskGroup | null> {
    const traceId = logger.startTrace('updateTaskGroup', { groupId: id });
    
    try {
      logger.debug('API call: update_task_group', { groupId: id, ...request });
      
      const group = await invoke<any>('update_task_group', {
        uuid: id,
        name: request.name,
        description: request.description,
        color: request.color
      });
      
      logger.debug('API response: update_task_group', { groupId: id });
      logger.debug('Database operation: UPDATE task_groups', { groupId: id, traceId });
      
      if (group) {
        const mappedGroup = this.mapDatabaseGroupToFrontend(group);
        
        logger.info('Task group updated', {
          groupId: id,
          groupName: mappedGroup.name,
          changes: this.getChanges(request),
          traceId
        });
        
        logger.endTrace(true, { traceId });
        return mappedGroup;
      } else {
        logger.warn('Task group not found for update', { groupId: id, traceId });
        logger.endTrace(false, { traceId });
        return null;
      }
    } catch (error) {
      logger.error('API call failed: update_task_group', error as Error, { traceId, groupId: id });
      logger.error('Database operation failed: UPDATE task_groups', error as Error, { traceId, groupId: id });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to update task group');
    }
  }

  async deleteTaskGroup(id: string): Promise<boolean> {
    const traceId = logger.startTrace('deleteTaskGroup', { groupId: id });
    
    try {
      logger.debug('API call: delete_task_group', { groupId: id });
      
      const result = await invoke<boolean>('delete_task_group', { uuid: id });
      
      logger.debug('API response: delete_task_group', { groupId: id, result });
      logger.debug('Database operation: DELETE task_groups', { groupId: id, result, traceId });
      
      if (result) {
        logger.info('Task group deleted', { groupId: id, traceId });
      }
      
      logger.endTrace(true, { traceId });
      return result;
    } catch (error) {
      logger.error('API call failed: delete_task_group', error as Error, { traceId, groupId: id });
      logger.error('Database operation failed: DELETE task_groups', error as Error, { traceId, groupId: id });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to delete task group');
    }
  }

  async linkTaskGroupToResource(groupId: string, resourceType: string, resourceId: string, resourceName: string): Promise<TaskGroup | null> {
    const traceId = logger.startTrace('linkTaskGroupToResource', { groupId, resourceType, resourceId });
    
    try {
      logger.debug('API call: link_task_group_to_resource', { groupId, resourceType, resourceId, resourceName });
      
      const group = await invoke<any>('link_task_group_to_resource', {
        uuid: groupId,
        resourceType,
        resourceId,
        resourceName
      });
      
      logger.debug('API response: link_task_group_to_resource', { groupId });
      logger.debug('Database operation: UPDATE task_groups', { groupId, resourceType, resourceId, traceId });
      
      if (group) {
        const mappedGroup = this.mapDatabaseGroupToFrontend(group);
        
        logger.info('Task group linked to resource', {
          groupId,
          groupName: mappedGroup.name,
          resourceType,
          resourceId,
          resourceName,
          traceId
        });
        
        logger.endTrace(true, { traceId });
        return mappedGroup;
      } else {
        logger.warn('Task group not found for linking', { groupId, traceId });
        logger.endTrace(false, { traceId });
        return null;
      }
    } catch (error) {
      logger.error('API call failed: link_task_group_to_resource', error as Error, { traceId, groupId, resourceType, resourceId });
      logger.error('Database operation failed: UPDATE task_groups', error as Error, { traceId, groupId, resourceType, resourceId });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to link task group to resource');
    }
  }

  async unlinkTaskGroup(groupId: string): Promise<TaskGroup | null> {
    const traceId = logger.startTrace('unlinkTaskGroup', { groupId });
    
    try {
      logger.debug('API call: unlink_task_group', { groupId });
      
      const group = await invoke<any>('unlink_task_group', { uuid: groupId });
      
      logger.debug('API response: unlink_task_group', { groupId });
      logger.debug('Database operation: UPDATE task_groups', { groupId, traceId });
      
      if (group) {
        const mappedGroup = this.mapDatabaseGroupToFrontend(group);
        
        logger.info('Task group unlinked from resource', {
          groupId,
          groupName: mappedGroup.name,
          traceId
        });
        
        logger.endTrace(true, { traceId });
        return mappedGroup;
      } else {
        logger.warn('Task group not found for unlinking', { groupId, traceId });
        logger.endTrace(false, { traceId });
        return null;
      }
    } catch (error) {
      logger.error('API call failed: unlink_task_group', error as Error, { traceId, groupId });
      logger.error('Database operation failed: UPDATE task_groups', error as Error, { traceId, groupId });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to unlink task group');
    }
  }

  async getTaskGroupsWithFilters(filters: TaskGroupFilters): Promise<TaskGroup[]> {
    const traceId = logger.startTrace('getTaskGroupsWithFilters', { filters });
    
    try {
      logger.debug('API call: get_task_groups_with_filters', { filters });
      
      const groups = await invoke<any[]>('get_task_groups_with_filters', { filters });
      
      logger.debug('API response: get_task_groups_with_filters', { count: groups.length, filters });
      logger.debug('Database operation: SELECT task_groups', { count: groups.length, filters, traceId });
      
      const mappedGroups = this.mapDatabaseGroupsToFrontend(groups);
      
      logger.info(`Retrieved ${mappedGroups.length} task groups with filters`, { traceId, filters });
      logger.endTrace(true, { traceId });
      
      return mappedGroups;
    } catch (error) {
      logger.error('API call failed: get_task_groups_with_filters', error as Error, { traceId, filters });
      logger.error('Database operation failed: SELECT task_groups', error as Error, { traceId, filters });
      logger.endTrace(false, { traceId });
      
      throw new Error('Failed to fetch filtered task groups');
    }
  }

  private getChanges(request: UpdateTaskGroupRequest): Record<string, any> {
    const changes: Record<string, any> = {};
    if (request.name !== undefined) changes.name = request.name;
    if (request.description !== undefined) changes.description = request.description;
    if (request.color !== undefined) changes.color = request.color;
    return changes;
  }

  private mapDatabaseGroupsToFrontend(groups: any[]): TaskGroup[] {
    return groups.map(group => this.mapDatabaseGroupToFrontend(group));
  }

  private mapDatabaseGroupToFrontend(group: any): TaskGroup {
    return {
      id: group.uuid,
      name: group.name,
      description: group.description,
      color: group.color,
      tasks: [],
      createdAt: new Date(group.created_at || Date.now()),
      updatedAt: new Date(group.updated_at || Date.now()),
      resourceLink: group.resource_link_type ? {
        type: group.resource_link_type,
        resourceId: group.resource_link_id,
        resourceName: group.resource_link_name,
        linkedAt: new Date(group.resource_link_created_at || Date.now())
      } : undefined
    };
  }
}

export const taskGroupService = TaskGroupService.getInstance();
