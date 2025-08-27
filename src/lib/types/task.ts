export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export type ResourceLinkType = 'project' | 'NA';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  subtasks: Task[];
  parentId?: string;
}

export interface TaskGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  // Resource link (many-to-one relationship)
  resourceLink?: ResourceLink;
}

export interface ResourceLink {
  type: ResourceLinkType;
  resourceId: string;
  resourceName: string;
  linkedAt: Date;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: string[];
  groupId?: string;
  search?: string;
  // Filter by resource link
  resourceLinkType?: ResourceLinkType;
  resourceLinkId?: string;
}
