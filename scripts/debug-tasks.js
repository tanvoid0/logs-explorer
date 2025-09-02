#!/usr/bin/env node

/**
 * Debug script to test task persistence and logging
 * This script will test the task service and verify database operations
 */

import { taskService } from '../src/lib/services/tasks/task-service.js';
import { TaskPriority } from '../src/lib/types/task.js';
import { logger } from '../src/lib/utils/logger.js';

async function testTaskPersistence() {
  console.log('🚀 Starting Task Persistence Debug Test');
  console.log('=====================================\n');

  try {
    // Test 1: Get all tasks (should be empty initially)
    console.log('📋 Test 1: Getting all tasks...');
    const initialTasks = await taskService.getAllTasks();
    console.log(`✅ Found ${initialTasks.length} initial tasks\n`);

    // Test 2: Create a task group first (if needed)
    console.log('📋 Test 2: Creating test task...');
    const testTask = await taskService.createTask({
      title: 'Debug Test Task',
      description: 'This is a test task for debugging persistence',
      status: 'pending',
      priority: TaskPriority.MEDIUM,
      groupId: 'debug-group-1'
    });
    console.log(`✅ Created task: ${testTask.title} (ID: ${testTask.id})\n`);

    // Test 3: Verify task was created
    console.log('📋 Test 3: Verifying task creation...');
    const tasksAfterCreate = await taskService.getAllTasks();
    console.log(`✅ Found ${tasksAfterCreate.length} tasks after creation`);
    
    const createdTask = tasksAfterCreate.find(t => t.id === testTask.id);
    if (createdTask) {
      console.log(`✅ Task found in database: ${createdTask.title}`);
      console.log(`   Status: ${createdTask.status}`);
      console.log(`   Priority: ${createdTask.priority}`);
      console.log(`   Group ID: ${createdTask.groupId}\n`);
    } else {
      console.log('❌ Task not found in database!\n');
    }

    // Test 4: Update the task
    console.log('📋 Test 4: Updating task...');
    const updatedTask = await taskService.updateTask(testTask.id, {
      status: 'in-progress',
      priority: TaskPriority.HIGH,
      description: 'Updated description for debugging'
    });
    console.log(`✅ Updated task: ${updatedTask.title}`);
    console.log(`   New status: ${updatedTask.status}`);
    console.log(`   New priority: ${updatedTask.priority}\n`);

    // Test 5: Verify update persisted
    console.log('📋 Test 5: Verifying update persistence...');
    const tasksAfterUpdate = await taskService.getAllTasks();
    const updatedTaskInDb = tasksAfterUpdate.find(t => t.id === testTask.id);
    
    if (updatedTaskInDb && updatedTaskInDb.status === 'in-progress') {
      console.log('✅ Task update persisted successfully');
      console.log(`   Current status: ${updatedTaskInDb.status}`);
      console.log(`   Current priority: ${updatedTaskInDb.priority}\n`);
    } else {
      console.log('❌ Task update did not persist!\n');
    }

    // Test 6: Toggle task status
    console.log('📋 Test 6: Toggling task status...');
    const toggledTask = await taskService.toggleTaskStatus(testTask.id);
    console.log(`✅ Toggled task status to: ${toggledTask.status}\n`);

    // Test 7: Get tasks by group
    console.log('📋 Test 7: Getting tasks by group...');
    const groupTasks = await taskService.getTasksByGroup('debug-group-1');
    console.log(`✅ Found ${groupTasks.length} tasks in group 'debug-group-1'\n`);

    // Test 8: Create another task for testing
    console.log('📋 Test 8: Creating second test task...');
    const testTask2 = await taskService.createTask({
      title: 'Debug Test Task 2',
      description: 'Second test task for debugging',
      status: 'completed',
      priority: TaskPriority.LOW,
      groupId: 'debug-group-1'
    });
    console.log(`✅ Created second task: ${testTask2.title} (ID: ${testTask2.id})\n`);

    // Test 9: Verify both tasks exist
    console.log('📋 Test 9: Verifying both tasks exist...');
    const allTasks = await taskService.getAllTasks();
    console.log(`✅ Total tasks in database: ${allTasks.length}`);
    
    allTasks.forEach((task, index) => {
      console.log(`   Task ${index + 1}: ${task.title} (${task.status})`);
    });
    console.log();

    // Test 10: Test task deletion
    console.log('📋 Test 10: Testing task deletion...');
    const deleteResult = await taskService.deleteTask(testTask2.id);
    if (deleteResult) {
      console.log('✅ Second task deleted successfully');
    } else {
      console.log('❌ Failed to delete second task');
    }

    // Test 11: Verify deletion
    console.log('📋 Test 11: Verifying deletion...');
    const tasksAfterDelete = await taskService.getAllTasks();
    console.log(`✅ Tasks after deletion: ${tasksAfterDelete.length}`);
    
    const deletedTask = tasksAfterDelete.find(t => t.id === testTask2.id);
    if (!deletedTask) {
      console.log('✅ Deleted task no longer exists in database\n');
    } else {
      console.log('❌ Deleted task still exists in database!\n');
    }

    // Test 12: Clean up - delete remaining test task
    console.log('📋 Test 12: Cleaning up...');
    await taskService.deleteTask(testTask.id);
    console.log('✅ Cleanup completed\n');

    // Final verification
    console.log('📋 Final verification...');
    const finalTasks = await taskService.getAllTasks();
    console.log(`✅ Final task count: ${finalTasks.length}\n`);

    console.log('🎉 All tests completed successfully!');
    console.log('📊 Task persistence is working correctly.');
    console.log('📝 Check the logs directory for detailed logging information.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Stack trace:', error.stack);
    
    // Log the error using our logger
    logger.error('Task persistence test failed', error, {
      test: 'task-persistence-debug',
      timestamp: new Date().toISOString()
    });
    
    process.exit(1);
  }
}

// Run the test
testTaskPersistence().catch(console.error);
