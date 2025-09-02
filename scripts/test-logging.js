#!/usr/bin/env node

/**
 * Test script for the logging system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple logger for testing without the full TypeScript setup
class SimpleLogger {
  constructor() {
    this.logs = [];
  }

  info(message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      context,
      traceId: context.traceId || 'test-trace'
    };
    this.logs.push(logEntry);
    console.log(`[INFO] ${message}`, context);
  }

  debug(message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      context,
      traceId: context.traceId || 'test-trace'
    };
    this.logs.push(logEntry);
    console.log(`[DEBUG] ${message}`, context);
  }

  warn(message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      context,
      traceId: context.traceId || 'test-trace'
    };
    this.logs.push(logEntry);
    console.log(`[WARN] ${message}`, context);
  }

  error(message, error = null, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error ? { name: error.name, message: error.message, stack: error.stack } : null,
      context,
      traceId: context.traceId || 'test-trace'
    };
    this.logs.push(logEntry);
    console.log(`[ERROR] ${message}`, error, context);
  }

  startTrace(operation, context = {}) {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.info(`Starting operation: ${operation}`, { ...context, traceId, operation });
    return traceId;
  }

  endTrace(success = true, context = {}) {
    const status = success ? 'completed' : 'failed';
    this.info(`Operation ${status}`, context);
  }

  taskCreated(taskId, taskData, context = {}) {
    this.info('Task created', {
      ...context,
      taskId,
      taskTitle: taskData.title,
      taskStatus: taskData.status,
      taskPriority: taskData.priority,
      groupId: taskData.groupId
    });
  }

  taskUpdated(taskId, oldData, newData, context = {}) {
    this.info('Task updated', {
      ...context,
      taskId,
      oldStatus: oldData.status,
      newStatus: newData.status,
      oldPriority: oldData.priority,
      newPriority: newData.priority
    });
  }

  taskDeleted(taskId, taskData, context = {}) {
    this.info('Task deleted', {
      ...context,
      taskId,
      taskTitle: taskData.title,
      taskStatus: taskData.status,
      groupId: taskData.groupId
    });
  }

  log(level, message, context = {}) {
    switch (level) {
      case 'info':
        this.info(message, context);
        break;
      case 'debug':
        this.debug(message, context);
        break;
      case 'warn':
        this.warn(message, context);
        break;
      case 'error':
        this.error(message, undefined, context);
        break;
    }
  }

  getLogs() {
    return this.logs;
  }
}

const logger = new SimpleLogger();

async function testLogging() {
  console.log('🧪 Testing Logging System');
  console.log('========================\n');

  try {
    // Test basic logging levels
    console.log('📝 Testing basic logging levels...');
    logger.info('This is an info message', { test: 'basic-logging' });
    logger.debug('This is a debug message', { test: 'basic-logging' });
    logger.warn('This is a warning message', { test: 'basic-logging' });
    logger.error('This is an error message', new Error('Test error'), { test: 'basic-logging' });
    console.log('✅ Basic logging levels tested\n');

    // Test trace logging
    console.log('🔍 Testing trace logging...');
    const traceId = logger.startTrace('test-operation', { 
      userId: 'test-user',
      projectId: 'test-project'
    });
    
    logger.info('Operation step 1', { step: 1, traceId });
    logger.debug('Operation step 2', { step: 2, traceId });
    logger.warn('Operation step 3', { step: 3, traceId });
    
    logger.endTrace(true, { result: 'success', traceId });
    console.log('✅ Trace logging tested\n');

    // Test task-specific logging
    console.log('📋 Testing task-specific logging...');
    const testTask = {
      id: 'test-task-1',
      title: 'Test Task',
      status: 'pending',
      priority: 'medium',
      groupId: 'test-group'
    };
    
    logger.taskCreated(testTask.id, testTask, { test: 'task-logging' });
    logger.taskUpdated(testTask.id, testTask, { ...testTask, status: 'completed' }, { test: 'task-logging' });
    logger.taskDeleted(testTask.id, testTask, { test: 'task-logging' });
    console.log('✅ Task-specific logging tested\n');

    // Test generic logging with various contexts
    console.log('🔄 Testing generic logging with contexts...');
    logger.log('info', 'Generic info message', { 
      operation: 'test',
      userId: 'user-123',
      timestamp: new Date().toISOString()
    });
    
    logger.log('debug', 'Generic debug message', { 
      operation: 'test',
      data: { key: 'value', number: 42 }
    });
    
    logger.log('warn', 'Generic warning message', { 
      operation: 'test',
      warning: 'Something might be wrong'
    });
    
    logger.log('error', 'Generic error message', new Error('Generic test error'), { 
      operation: 'test',
      severity: 'high'
    });
    console.log('✅ Generic logging tested\n');

    // Test error logging with stack traces
    console.log('🚨 Testing error logging...');
    const testError = new Error('This is a test error with stack trace');
    testError.stack = 'Error: This is a test error with stack trace\n    at testLogging (test-logging.js:45:15)\n    at async main (test-logging.js:60:10)';
    
    logger.error('Test error occurred', testError, { 
      test: 'error-logging',
      context: 'error-test'
    });
    console.log('✅ Error logging tested\n');

    // Save logs to file
    const logsDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logsDir, `test-logging-${new Date().toISOString().split('T')[0]}.json`);
    
    fs.writeFileSync(logFile, JSON.stringify(logger.getLogs(), null, 2));
    console.log(`📁 Logs saved to: ${logFile}`);

    console.log('🎉 All logging tests completed successfully!');
    console.log('📁 Check the logs directory for the generated log files.');
    console.log('💡 Run "pnpm run logs:open" to open the logs directory.');

  } catch (error) {
    console.error('❌ Logging test failed:', error);
    process.exit(1);
  }
}

// Run the test
testLogging().catch(console.error);
