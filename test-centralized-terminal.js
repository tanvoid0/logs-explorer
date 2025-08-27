#!/usr/bin/env node

/**
 * Test script for debugging centralized terminal issues
 * 
 * This script helps test:
 * 1. Process creation and tab generation
 * 2. Process cancellation
 * 3. Multiple concurrent processes
 * 4. Process persistence across navigation
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testTerminal() {
  console.log('🧪 Testing Centralized Terminal System\n');

  // Test 1: Quick command that should create a tab
  console.log('📋 Test 1: Quick command (should create tab)');
  try {
    const result = await execAsync('echo "Hello from test script"');
    console.log('✅ Quick command result:', result.stdout.trim());
  } catch (error) {
    console.log('❌ Quick command failed:', error.message);
  }

  // Test 2: Long-running command that can be cancelled
  console.log('\n📋 Test 2: Long-running command (can be cancelled)');
  try {
    const longProcess = exec('ping -c 10 127.0.0.1', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Long process error:', error.message);
      } else {
        console.log('✅ Long process completed:', stdout.trim());
      }
    });
    
    console.log('🔄 Long process started with PID:', longProcess.pid);
    
    // Let it run for 2 seconds then cancel
    setTimeout(() => {
      console.log('🛑 Cancelling long process...');
      longProcess.kill('SIGTERM');
    }, 2000);
    
  } catch (error) {
    console.log('❌ Failed to start long process:', error.message);
  }

  // Test 3: Multiple concurrent processes
  console.log('\n📋 Test 3: Multiple concurrent processes');
  const processes = [];
  
  for (let i = 1; i <= 3; i++) {
    const process = exec(`echo "Process ${i} started at $(date)" && sleep 3 && echo "Process ${i} completed"`, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Process ${i} error:`, error.message);
      } else {
        console.log(`✅ Process ${i} output:`, stdout.trim());
      }
    });
    
    processes.push(process);
    console.log(`🔄 Process ${i} started with PID:`, process.pid);
  }

  // Test 4: Error command
  console.log('\n📋 Test 4: Error command (should show error status)');
  try {
    const errorProcess = exec('nonexistentcommand', (error, stdout, stderr) => {
      if (error) {
        console.log('✅ Error command failed as expected:', error.message);
      } else {
        console.log('❌ Error command succeeded unexpectedly');
      }
    });
  } catch (error) {
    console.log('❌ Failed to start error command:', error.message);
  }

  // Test 5: Framework-specific commands
  console.log('\n📋 Test 5: Framework-specific commands');
  const frameworkCommands = [
    'npm --version',
    'node --version',
    'python3 --version',
    'echo "Testing framework commands"'
  ];

  for (const cmd of frameworkCommands) {
    try {
      const result = await execAsync(cmd);
      console.log(`✅ ${cmd}:`, result.stdout.trim());
    } catch (error) {
      console.log(`❌ ${cmd}:`, error.message);
    }
  }

  console.log('\n🧪 Test completed!');
  console.log('\n📝 Expected behavior:');
  console.log('- Each command should create a tab in the terminal');
  console.log('- Long-running commands should be cancellable');
  console.log('- Multiple processes should run concurrently');
  console.log('- Error commands should show error status');
  console.log('- Process history should persist across navigation');
  
  console.log('\n🔍 Debug information:');
  console.log('- Check browser console for "🔥" prefixed logs');
  console.log('- Look for process creation and cancellation logs');
  console.log('- Verify tabs are appearing in the terminal UI');
  console.log('- Test navigation away and back to see process persistence');
}

// Run the test
testTerminal().catch(console.error);
