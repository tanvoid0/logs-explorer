// Test script to verify task persistence
console.log('Testing task persistence...');

// Check if localStorage is available
if (typeof localStorage !== 'undefined') {
  console.log('localStorage is available');
  
  // Check for existing task data
  const storedData = localStorage.getItem('task-manager-data');
  console.log('Stored task data:', storedData);
  
  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData);
      console.log('Parsed task data:', parsedData);
      console.log('Task groups count:', parsedData.taskGroups?.length || 0);
      console.log('Tasks count:', parsedData.tasks?.length || 0);
      
      // Check if the data structure is correct
      if (parsedData.taskGroups) {
        console.log('Task groups structure is correct');
        parsedData.taskGroups.forEach((group, index) => {
          console.log(`Group ${index + 1}:`, {
            id: group.id,
            name: group.name,
            tasksCount: group.tasks?.length || 0
          });
        });
      }
      
      if (parsedData.tasks) {
        console.log('Tasks structure is correct');
        parsedData.tasks.forEach((task, index) => {
          console.log(`Task ${index + 1}:`, {
            id: task.id,
            title: task.title,
            parentId: task.parentId,
            status: task.status
          });
        });
      }
    } catch (error) {
      console.error('Error parsing stored data:', error);
    }
  } else {
    console.log('No stored task data found - this is normal for a fresh installation');
  }
  
  // Test creating some sample data
  const testData = {
    taskGroups: [
      {
        id: 'test-group-1',
        name: 'Test Group',
        description: 'A test group for persistence verification',
        color: '#3B82F6',
        tasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    tasks: [
      {
        id: 'test-task-1',
        title: 'Test Task',
        description: 'A test task for persistence verification',
        status: 'pending',
        priority: 'medium',
        parentId: 'test-group-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: []
      }
    ]
  };
  
  console.log('Saving test data...');
  localStorage.setItem('task-manager-data', JSON.stringify(testData));
  console.log('Test data saved successfully');
  
  // Verify the data was saved
  const savedData = localStorage.getItem('task-manager-data');
  console.log('Verified saved data:', savedData);
  
  // Test that the data can be parsed back
  try {
    const parsedSavedData = JSON.parse(savedData);
    console.log('Successfully parsed saved data:', parsedSavedData);
    console.log('Test data verification complete!');
  } catch (error) {
    console.error('Error parsing saved data:', error);
  }
  
} else {
  console.log('localStorage is not available - this might be running in a non-browser environment');
}

// Test the task store functions if they're available
if (typeof window !== 'undefined' && window.taskStore) {
  console.log('Task store is available in window object');
} else {
  console.log('Task store not available in window object - this is normal');
}
