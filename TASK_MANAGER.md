# Task Manager

A simple yet interactive task manager with task groups, nested subtasks, and status management built with SvelteKit and Tailwind CSS.

## Features

### 🎯 Task Management
- **Task Groups**: Organize tasks into color-coded groups
- **Nested Subtasks**: Create unlimited levels of subtasks
- **Status Management**: Track task progress (Pending, In Progress, Completed, Cancelled)
- **Priority Levels**: Set task priorities (Low, Medium, High)
- **Resource Linking**: Link task groups to projects (many-to-one relationship)

### 🔍 Advanced Filtering
- **Search**: Find tasks by title or description
- **Status Filters**: Filter by task status
- **Priority Filters**: Filter by priority level
- **Resource Filters**: Filter by linked projects
- **Real-time Updates**: Filters update instantly as you type

### 📊 Progress Tracking
- **Overview Dashboard**: See total tasks, pending, in-progress, and completed counts
- **Progress Bar**: Visual representation of overall completion
- **Statistics**: Real-time task statistics

### 🎨 Interactive UI
- **Expandable Groups**: Collapse/expand task groups
- **Inline Editing**: Edit tasks and groups directly
- **Drag & Drop Ready**: UI designed for future drag-and-drop functionality
- **Dark Mode Support**: Full dark mode compatibility
- **Responsive Design**: Works on desktop and mobile

### 🔗 Project Integration
- **Project Tasks Tab**: View and manage tasks directly from project pages
- **Automatic Linking**: New task groups are automatically linked to the current project
- **Filtered Views**: See only tasks related to specific projects
- **Reusable Components**: Same task management interface across different contexts

### 💾 Data Persistence
- **localStorage**: All data is automatically saved to browser storage
- **Real-time Sync**: Changes are persisted immediately
- **Database Ready**: Easy to extend to a real database backend
- **No Mock Data**: Works with real user data only

## Components

### Core Components
- `TaskPage.svelte` - Reusable task page with configurable filters and options
- `TaskManager.svelte` - Main task manager interface (legacy)
- `TaskGroup.svelte` - Individual task group with collapsible tasks
- `TaskItem.svelte` - Individual task with subtask support
- `TaskFilters.svelte` - Search and filtering interface

### Data Management
- `task-store.ts` - Svelte stores for state management with localStorage persistence
- `task.ts` - TypeScript type definitions

## Usage

### Main Task Manager
1. Navigate to `/tasks` to access the main task manager
2. Create task groups and organize your tasks
3. Use filters to find specific tasks

### Project-Specific Tasks
1. Navigate to any project detail page
2. Click on the "Tasks" tab
3. View and manage tasks specific to that project
4. New task groups are automatically linked to the project

### Creating Task Groups
1. Click "New Group" button
2. Enter group name and optional description
3. Choose a color for the group
4. Click "Create Group"
5. If on a project page, the group is automatically linked to the project

### Adding Tasks
1. Click "Add Task" within a group
2. Enter task title and optional description
3. Click "Add Task"

### Adding Subtasks
1. Click the "+" button on any task
2. Enter subtask title and optional description
3. Click "Add Subtask"

### Managing Task Status
- Click the circular checkbox to toggle task status
- Status cycles: Pending → In Progress → Completed

### Editing Tasks and Groups
- Click the edit (pencil) icon to edit inline
- Make changes and click "Save" or press Ctrl+Enter
- Click "Cancel" or press Escape to cancel

### Filtering Tasks
- Use the search box to find tasks by title or description
- Click status buttons to filter by status
- Click priority buttons to filter by priority
- Use "Clear all" to reset filters

## Technical Details

### State Management
- Uses Svelte stores for reactive state management
- **localStorage persistence**: Data is automatically saved to browser storage
- **Database Ready**: Easy to extend to a real database (just replace the storage functions)
- Real-time updates across all components
- **No mock data**: Only works with real user-created data

### Data Structure
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  subtasks: Task[];
  parentId?: string;
}

interface TaskGroup {
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

interface ResourceLink {
  type: 'project' | 'NA';
  resourceId: string;
  resourceName: string;
  linkedAt: Date;
}
```

### Reusable TaskPage Component
The `TaskPage` component is highly configurable and can be used in different contexts:

```svelte
<TaskPage 
  title="Custom Title"
  subtitle="Custom subtitle"
  initialFilters={{
    resourceLinkType: 'project',
    resourceLinkId: '123'
  }}
  showAddGroupButton={true}
  showProgressOverview={true}
  showFilters={true}
  emptyStateMessage="Custom empty message"
  emptyStateDescription="Custom empty description"
/>
```

### Data Persistence
- **Automatic Saving**: All changes are saved to localStorage immediately
- **Automatic Loading**: Data is loaded from storage on app startup
- **Error Handling**: Graceful handling of storage errors
- **Date Serialization**: Proper handling of Date objects in storage

### Routing
- Access the main task manager at `/tasks`
- Access project-specific tasks via the "Tasks" tab on project detail pages
- Integrated into the main application navigation

## Future Enhancements

- **Drag & Drop**: Reorder tasks and groups
- **Due Dates**: Set and track task due dates
- **Tags**: Add custom tags to tasks
- **Export/Import**: Export tasks to various formats
- **Collaboration**: Share task lists with team members
- **Notifications**: Due date reminders and notifications
- **Time Tracking**: Track time spent on tasks
- **Attachments**: Add files to tasks
- **Comments**: Add comments to tasks
- **Templates**: Create task templates for recurring work
- **More Resource Types**: Link tasks to workloads, deployments, services, etc.
- **Database Integration**: Replace localStorage with real database backend

## Getting Started

1. **Main Task Manager**: Navigate to `/tasks` in the application
2. **Project Tasks**: Go to any project and click the "Tasks" tab
3. Start creating your own task groups and tasks
4. Use the filtering and search features to organize your work
5. All data is automatically saved and persisted

The task manager is fully integrated into the existing application and follows the same design patterns and styling conventions. It provides a consistent experience whether you're managing all tasks or project-specific tasks, with real data persistence and no mock data.
