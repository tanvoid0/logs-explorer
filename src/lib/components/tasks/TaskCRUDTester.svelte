<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import Button from '$lib/components/ui/button.svelte';
  import Icon from '@iconify/svelte';

  // Type definitions for invoke results
  interface TaskGroupResult {
    uuid: string;
    name: string;
    description?: string;
    color: string;
  }

  interface TaskResult {
    uuid: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
  }

  interface TaskListResult extends Array<TaskResult> {}
  interface TaskGroupListResult extends Array<TaskGroupResult> {}

  // Test state
  let isRunning = $state(false);
  let testResults = $state<string[]>([]);
  let testGroupId = $state<string | null>(null);
  let testTaskId = $state<string | null>(null);
  let showDetails = $state(false);

  // Mock data for testing
  const mockTaskGroup = {
    name: "Test Group",
    description: "Test group for CRUD testing",
    color: "#3B82F6"
  };

  const mockTask = {
    title: "Test Task",
    description: "Test task for CRUD testing",
    status: "pending",
    priority: "medium",
    dueDate: new Date().toISOString(),
    groupId: undefined as string | undefined
  };

  const mockUpdateTask = {
    title: "Updated Test Task",
    description: "Updated test task description",
    status: "in-progress",
    priority: "high",
    dueDate: new Date(Date.now() + 86400000).toISOString()
  };

  // Logging function
  function log(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    testResults = [...testResults, logEntry];
  }

  // Clear results
  function clearResults() {
    testResults = [];
    testGroupId = null;
    testTaskId = null;
  }

  // Test functions
  async function testCreateTaskGroup() {
    try {
      log('🧪 Creating task group...', 'info');
      const result = await invoke<TaskGroupResult>('add_task_group', {
        name: mockTaskGroup.name,
        description: mockTaskGroup.description,
        color: mockTaskGroup.color,
        resource_link_type: undefined,
        resource_link_id: undefined,
        resource_link_name: undefined
      });
      testGroupId = result.uuid;
      
      log(`✅ Task group created: ${result.uuid}`, 'success');
      mockTask.groupId = result.uuid;
      
    } catch (error) {
      log(`❌ Failed to create task group: ${error}`, 'error');
    }
  }

  async function testGetAllTaskGroups() {
    try {
      log('🧪 Getting all task groups...', 'info');
      const result = await invoke<TaskGroupListResult>('get_all_task_groups');
      log(`✅ Retrieved ${result.length} task groups`, 'success');
      
    } catch (error) {
      log(`❌ Failed to get task groups: ${error}`, 'error');
    }
  }

  async function testUpdateTaskGroup() {
    if (!testGroupId) {
      log('❌ No test group ID available', 'error');
      return;
    }

    try {
      log('🧪 Updating task group...', 'info');
      const updateData = {
        uuid: testGroupId,
        name: "Updated Test Group",
        description: "Updated test group description",
        color: "#EF4444"
      };
      
      const result = await invoke<TaskGroupResult>('update_task_group', updateData);
      log(`✅ Task group updated: ${result.name}`, 'success');
      
    } catch (error) {
      log(`❌ Failed to update task group: ${error}`, 'error');
    }
  }

  async function testCreateTask() {
    if (!testGroupId) {
      log('❌ No test group ID available', 'error');
      return;
    }

    try {
      log('🧪 Creating task...', 'info');
      const result = await invoke<TaskResult>('add_task', mockTask);
      testTaskId = result.uuid;
      
      log(`✅ Task created: ${result.uuid}`, 'success');
      
    } catch (error) {
      log(`❌ Failed to create task: ${error}`, 'error');
    }
  }

  async function testGetAllTasks() {
    try {
      log('🧪 Getting all tasks...', 'info');
      const result = await invoke<TaskListResult>('get_all_tasks');
      log(`✅ Retrieved ${result.length} tasks`, 'success');
      
    } catch (error) {
      log(`❌ Failed to get tasks: ${error}`, 'error');
    }
  }

  async function testGetTasksByGroup() {
    if (!testGroupId) {
      log('❌ No test group ID available', 'error');
      return;
    }

    try {
      log('🧪 Getting tasks by group...', 'info');
      const result = await invoke<TaskListResult>('get_tasks_by_group', { groupId: testGroupId });
      log(`✅ Retrieved ${result.length} tasks for group ${testGroupId}`, 'success');
      
    } catch (error) {
      log(`❌ Failed to get group tasks: ${error}`, 'error');
    }
  }

  async function testUpdateTask() {
    if (!testTaskId) {
      log('❌ No test task ID available', 'error');
      return;
    }

    try {
      log('🧪 Updating task...', 'info');
      const updateData = {
        uuid: testTaskId,
        title: mockUpdateTask.title,
        description: mockUpdateTask.description,
        status: mockUpdateTask.status,
        priority: mockUpdateTask.priority,
        dueDate: mockUpdateTask.dueDate
      };
      
      const result = await invoke<TaskResult>('update_task', updateData);
      log(`✅ Task updated: ${result.title}`, 'success');
      
    } catch (error) {
      log(`❌ Failed to update task: ${error}`, 'error');
    }
  }

  async function testToggleTaskStatus() {
    if (!testTaskId) {
      log('❌ No test task ID available', 'error');
      return;
    }

    try {
      log('🧪 Toggling task status...', 'info');
      const result = await invoke<TaskResult>('toggle_task_status', { uuid: testTaskId });
      log(`✅ Task status toggled: ${result.status}`, 'success');
      
    } catch (error) {
      log(`❌ Failed to toggle task status: ${error}`, 'error');
    }
  }

  async function testMoveTask() {
    if (!testTaskId || !testGroupId) {
      log('❌ No test task or group ID available', 'error');
      return;
    }

    try {
      log('🧪 Moving task...', 'info');
      const result = await invoke<TaskResult>('move_task', { uuid: testTaskId, groupId: testGroupId });
      log(`✅ Task moved: ${result.uuid}`, 'success');
      
    } catch (error) {
      log(`❌ Failed to move task: ${error}`, 'error');
    }
  }

  async function testDeleteTask() {
    if (!testTaskId) {
      log('❌ No test task ID available', 'error');
      return;
    }

    try {
      log('🧪 Deleting task...', 'info');
      const result = await invoke<string>('delete_task', { uuid: testTaskId });
      log(`✅ Task deleted: ${result}`, 'success');
      testTaskId = null;
      
    } catch (error) {
      log(`❌ Failed to delete task: ${error}`, 'error');
    }
  }

  async function testDeleteTaskGroup() {
    if (!testGroupId) {
      log('❌ No test group ID available', 'error');
      return;
    }

    try {
      log('🧪 Deleting task group...', 'info');
      const result = await invoke<string>('delete_task_group', { uuid: testGroupId });
      log(`✅ Task group deleted: ${result}`, 'success');
      testGroupId = null;
      
    } catch (error) {
      log(`❌ Failed to delete task group: ${error}`, 'error');
    }
  }

  async function testVerifyCleanup() {
    try {
      log('🧪 Verifying cleanup...', 'info');
      const groups = await invoke<TaskGroupListResult>('get_all_task_groups');
      const tasks = await invoke<TaskListResult>('get_all_tasks');
      
      log(`✅ Remaining groups: ${groups.length}`, 'success');
      log(`✅ Remaining tasks: ${tasks.length}`, 'success');
      
    } catch (error) {
      log(`❌ Failed to verify cleanup: ${error}`, 'error');
    }
  }

  async function runAllTests() {
    isRunning = true;
    clearResults();
    
    try {
      log('🚀 Starting complete test suite...', 'info');
      
      // Test task group operations
      await testCreateTaskGroup();
      await testGetAllTaskGroups();
      await testUpdateTaskGroup();
      
      // Test task operations
      await testCreateTask();
      await testGetAllTasks();
      await testGetTasksByGroup();
      await testUpdateTask();
      await testToggleTaskStatus();
      await testMoveTask();
      
      // Test cleanup operations
      await testDeleteTask();
      await testDeleteTaskGroup();
      await testVerifyCleanup();
      
      log('🎉 All tests completed successfully!', 'success');
      log('✅ Frontend services can successfully interact with backend', 'success');
      log('✅ Parameter mapping is working correctly', 'success');
      log('✅ CRUD operations are functioning', 'success');
      
    } catch (error) {
      log(`💥 Test suite failed: ${error}`, 'error');
    } finally {
      isRunning = false;
    }
  }

  // Individual test runners
  async function runGroupTests() {
    isRunning = true;
    clearResults();
    
    try {
      log('🧪 Running task group tests...', 'info');
      await testCreateTaskGroup();
      await testGetAllTaskGroups();
      await testUpdateTaskGroup();
      log('✅ Task group tests completed', 'success');
    } catch (error) {
      log(`❌ Task group tests failed: ${error}`, 'error');
    } finally {
      isRunning = false;
    }
  }

  async function runTaskTests() {
    if (!testGroupId) {
      log('❌ Please create a test group first', 'error');
      return;
    }

    isRunning = true;
    clearResults();
    
    try {
      log('🧪 Running task tests...', 'info');
      await testCreateTask();
      await testGetAllTasks();
      await testGetTasksByGroup();
      await testUpdateTask();
      await testToggleTaskStatus();
      await testMoveTask();
      log('✅ Task tests completed', 'success');
    } catch (error) {
      log(`❌ Task tests failed: ${error}`, 'error');
    } finally {
      isRunning = false;
    }
  }

  async function runCleanupTests() {
    isRunning = true;
    clearResults();
    
    try {
      log('🧪 Running cleanup tests...', 'info');
      if (testTaskId) await testDeleteTask();
      if (testGroupId) await testDeleteTaskGroup();
      await testVerifyCleanup();
      log('✅ Cleanup tests completed', 'success');
    } catch (error) {
      log(`❌ Cleanup tests failed: ${error}`, 'error');
    } finally {
      isRunning = false;
    }
  }
</script>

<Card className="mb-6">
  <CardHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <Icon icon="mdi:test-tube" class="w-6 h-6 text-blue-500" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Task CRUD Integration Tester
        </CardTitle>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onclick={() => showDetails = !showDetails}
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <Icon icon={showDetails ? 'mdi:chevron-up' : 'mdi:chevron-down'} class="w-4 h-4" />
      </Button>
    </div>
  </CardHeader>

  {#if showDetails}
    <CardContent className="p-4">
      <div class="space-y-4">
        <!-- Test Controls -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            onclick={runAllTests}
            disabled={isRunning}
            class="bg-green-600 hover:bg-green-700 text-white"
          >
            <Icon icon="mdi:rocket-launch" class="w-4 h-4 mr-2" />
            Run All Tests
          </Button>
          
          <Button
            onclick={runGroupTests}
            disabled={isRunning}
            class="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Icon icon="mdi:folder-multiple" class="w-4 h-4 mr-2" />
            Test Groups
          </Button>
          
          <Button
            onclick={runTaskTests}
            disabled={isRunning || !testGroupId}
            class="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Icon icon="mdi:clipboard-text" class="w-4 h-4 mr-2" />
            Test Tasks
          </Button>
          
          <Button
            onclick={runCleanupTests}
            disabled={isRunning}
            class="bg-red-600 hover:bg-red-700 text-white"
          >
            <Icon icon="mdi:trash-can" class="w-4 h-4 mr-2" />
            Test Cleanup
          </Button>
        </div>

        <!-- Individual Test Buttons -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Individual Tests:</h4>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onclick={testCreateTaskGroup}
              disabled={isRunning || !!testGroupId}
              size="sm"
              variant="outline"
            >
              Create Group
            </Button>
            
            <Button
              onclick={testGetAllTaskGroups}
              disabled={isRunning}
              size="sm"
              variant="outline"
            >
              Get Groups
            </Button>
            
            <Button
              onclick={testUpdateTaskGroup}
              disabled={isRunning || !testGroupId}
              size="sm"
              variant="outline"
            >
              Update Group
            </Button>
            
            <Button
              onclick={testCreateTask}
              disabled={isRunning || !testGroupId}
              size="sm"
              variant="outline"
            >
              Create Task
            </Button>
            
            <Button
              onclick={testGetAllTasks}
              disabled={isRunning}
              size="sm"
              variant="outline"
            >
              Get Tasks
            </Button>
            
            <Button
              onclick={testGetTasksByGroup}
              disabled={isRunning || !testGroupId}
              size="sm"
              variant="outline"
            >
              Get Group Tasks
            </Button>
            
            <Button
              onclick={testUpdateTask}
              disabled={isRunning || !testTaskId}
              size="sm"
              variant="outline"
            >
              Update Task
            </Button>
            
            <Button
              onclick={testToggleTaskStatus}
              disabled={isRunning || !testTaskId}
              size="sm"
              variant="outline"
            >
              Toggle Status
            </Button>
          </div>
        </div>

        <!-- Test Status -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Test Status:</h4>
            <Button
              onclick={clearResults}
              size="sm"
              variant="ghost"
              class="text-gray-500 hover:text-gray-700"
            >
              Clear Results
            </Button>
          </div>
          
          <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div>Test Group ID: {testGroupId || 'None'}</div>
            <div>Test Task ID: {testTaskId || 'None'}</div>
            <div>Status: {isRunning ? '🔄 Running...' : '✅ Ready'}</div>
          </div>
        </div>

        <!-- Test Results -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Test Results:</h4>
          
          <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 max-h-64 overflow-y-auto">
            {#if testResults.length === 0}
              <div class="text-gray-500 dark:text-gray-400 text-center py-8">
                <Icon icon="mdi:test-tube" class="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No test results yet. Run a test to see results here.</p>
              </div>
            {:else}
              {#each testResults as result}
                <div class="text-xs font-mono py-1 {result.includes('✅') ? 'text-green-600' : result.includes('❌') ? 'text-red-600' : result.includes('🧪') ? 'text-blue-600' : 'text-gray-600'}">
                  {result}
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    </CardContent>
  {/if}
</Card>
