# Logger Migration Guide

## Overview

This guide explains how to migrate from `console.log` statements to our new flexible logging utility throughout the codebase.

## 🎯 Why Migrate?

### Benefits of Using Our Logger:
- **Structured Logging**: JSON format with timestamps, trace IDs, and context
- **File Output**: Automatic log file generation with rotation
- **Trace Correlation**: Track operations across the application
- **Environment Awareness**: Different log levels for dev vs production
- **Error Tracking**: Full stack traces and error context
- **Performance**: Optimized logging with excluded operations

### Problems with Console Statements:
- No persistence (lost on page refresh)
- No structured data
- No trace correlation
- No environment-specific behavior
- Hard to filter and search
- No error context preservation

## 🚀 Quick Migration

### Automated Migration
Run the automated migration script:
```bash
pnpm run migrate:logger
```

This will:
- ✅ Scan all source files for console statements
- ✅ Add logger imports where needed
- ✅ Convert console statements to logger calls
- ✅ Preserve existing functionality

### Manual Migration
If you prefer manual migration, follow these patterns:

#### Before (Console):
```typescript
console.log('User logged in', { userId: '123' });
console.error('API call failed', error);
console.warn('Rate limit approaching');
console.debug('Processing data', data);
```

#### After (Logger):
```typescript
import { logger } from '$lib/utils/logger';

logger.info('User logged in', { userId: '123' });
logger.error('API call failed', error, { userId: '123' });
logger.warn('Rate limit approaching', { current: 95, limit: 100 });
logger.debug('Processing data', { dataSize: data.length });
```

## 📋 Migration Patterns

### 1. Simple String Logging
```typescript
// Before
console.log('App starting up...');

// After
logger.info('App starting up...');
```

### 2. Object/Context Logging
```typescript
// Before
console.log('User action', { userId: '123', action: 'login' });

// After
logger.info('User action', { userId: '123', action: 'login' });
```

### 3. Error Logging
```typescript
// Before
console.error('Database connection failed', error);

// After
logger.error('Database connection failed', error, { 
  retryCount: 3,
  connectionString: 'db://localhost' 
});
```

### 4. Debug Information
```typescript
// Before
console.debug('API response', response);

// After
logger.debug('API response', { 
  status: response.status,
  size: response.data.length,
  endpoint: '/api/users' 
});
```

### 5. Warning Messages
```typescript
// Before
console.warn('Deprecated feature used');

// After
logger.warn('Deprecated feature used', { 
  feature: 'oldApi',
  suggested: 'newApi',
  version: '2.0.0' 
});
```

## 🔍 Advanced Logging Features

### Trace-based Logging
```typescript
const traceId = logger.startTrace('user-registration', { email: 'user@example.com' });

try {
  logger.info('Creating user account', { traceId });
  const user = await createUser(userData);
  
  logger.info('Sending welcome email', { traceId, userId: user.id });
  await sendWelcomeEmail(user.email);
  
  logger.endTrace(true, { traceId, userId: user.id });
} catch (error) {
  logger.error('User registration failed', error, { traceId });
  logger.endTrace(false, { traceId, error: error.message });
}
```

### Task-specific Logging
```typescript
// Task creation
logger.taskCreated(taskId, taskData, { userId: '123' });

// Task updates
logger.taskUpdated(taskId, oldData, newData, { userId: '123' });

// Task deletion
logger.taskDeleted(taskId, taskData, { userId: '123' });
```

### Generic Logging with Context
```typescript
logger.log('info', 'Operation completed', { 
  operation: 'data-import',
  recordsProcessed: 1000,
  duration: '2.5s'
});
```

## 📁 File Structure

### Logger Location
```
src/lib/utils/logger.ts          # Main logger utility
logs/                            # Generated log files
├── logs-explorer-frontend-YYYY-MM-DD.log
├── logs-explorer-frontend-error-YYYY-MM-DD.log
└── test-logging-YYYY-MM-DD.json
```

### Scripts
```
scripts/
├── test-logging.js              # Test logging functionality
├── debug-tasks.js               # Debug task persistence
├── open-logs.js                 # Open logs directory
└── migrate-to-logger.js         # Migrate console statements
```

## 🛠️ Available Scripts

### Testing and Debugging
```bash
# Test the logging system
pnpm run logs:test

# Debug task persistence
pnpm run debug:tasks

# Open logs directory
pnpm run logs:open
```

### Migration
```bash
# Automated migration
pnpm run migrate:logger
```

## 📊 Log Output Examples

### Console Output
```
2025-09-01 12:49:44 [INFO] [trace-123] [user-registration] User logged in {"userId":"123"}
```

### File Output (JSON)
```json
{
  "timestamp": "2025-09-01T12:49:44.923Z",
  "level": "INFO",
  "message": "User logged in",
  "traceId": "trace-123",
  "operation": "user-registration",
  "userId": "123",
  "file": "auth-service.ts",
  "line": 45
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Development mode (more verbose logging)
NODE_ENV=development

# Production mode (less verbose logging)
NODE_ENV=production
```

### Log Levels
- **TRACE**: Most detailed logging
- **DEBUG**: Debug information
- **INFO**: General information
- **WARN**: Warning messages
- **ERROR**: Error messages

### File Rotation
- **Max file size**: 20MB
- **Retention**: 14 days for regular logs, 30 days for error logs
- **Compression**: Automatic gzip compression

## 🎯 Best Practices

### 1. Use Descriptive Messages
```typescript
// Good
logger.info('User authentication successful', { userId: '123', method: 'oauth' });

// Avoid
logger.info('OK', { userId: '123' });
```

### 2. Include Relevant Context
```typescript
// Good
logger.error('API call failed', error, { 
  endpoint: '/api/users',
  method: 'POST',
  userId: '123',
  retryCount: 3 
});

// Avoid
logger.error('Failed', error);
```

### 3. Use Trace IDs for Operations
```typescript
const traceId = logger.startTrace('data-import', { file: 'users.csv' });

logger.info('Starting import', { traceId, recordCount: 1000 });
logger.info('Processing records', { traceId, processed: 500 });
logger.info('Import completed', { traceId, success: true });

logger.endTrace(true, { traceId, imported: 1000 });
```

### 4. Log Errors with Context
```typescript
try {
  await processData();
} catch (error) {
  logger.error('Data processing failed', error, {
    dataType: 'user-profiles',
    source: 'api',
    timestamp: new Date().toISOString()
  });
}
```

### 5. Use Appropriate Log Levels
```typescript
// TRACE - Very detailed debugging
logger.trace('Function entry', { params: { id: 123 } });

// DEBUG - Debug information
logger.debug('API response received', { status: 200, size: 1024 });

// INFO - General information
logger.info('User logged in', { userId: '123' });

// WARN - Warning messages
logger.warn('Rate limit approaching', { current: 95, limit: 100 });

// ERROR - Error messages
logger.error('Database connection failed', error, { retryCount: 3 });
```

## 🔄 Migration Checklist

### Before Migration
- [ ] Backup your code
- [ ] Run tests to establish baseline
- [ ] Review existing console statements

### During Migration
- [ ] Run `pnpm run migrate:logger`
- [ ] Review generated changes
- [ ] Test application functionality
- [ ] Verify log output

### After Migration
- [ ] Run `pnpm run logs:test`
- [ ] Check log files in `logs/` directory
- [ ] Verify trace correlation works
- [ ] Test error logging
- [ ] Update documentation

## 🚨 Common Issues

### 1. Import Not Added
If the logger import wasn't added automatically:
```typescript
import { logger } from '$lib/utils/logger';
```

### 2. Complex Expressions
For complex console statements, wrap in context:
```typescript
// Before
console.log('Processing', data.length, 'items for user', userId);

// After
logger.info('Processing items', { 
  count: data.length, 
  userId: userId 
});
```

### 3. Template Literals
Convert template literals to structured logging:
```typescript
// Before
console.log(`User ${userId} logged in at ${new Date()}`);

// After
logger.info('User logged in', { 
  userId: userId, 
  timestamp: new Date().toISOString() 
});
```

## 📈 Monitoring and Analysis

### Log Analysis
- **Error rates**: Monitor error frequency
- **Performance**: Track operation durations
- **User behavior**: Analyze user actions
- **System health**: Monitor application state

### Tools Integration
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Grafana**: Metrics and visualization
- **Prometheus**: Metrics collection
- **Custom dashboards**: Build your own

## 🎉 Benefits Achieved

After migration, you'll have:
- ✅ **Structured logging** with JSON format
- ✅ **File persistence** with automatic rotation
- ✅ **Trace correlation** across operations
- ✅ **Environment-aware** logging levels
- ✅ **Error context** preservation
- ✅ **Performance optimization**
- ✅ **Easy debugging** and troubleshooting
- ✅ **Production-ready** logging infrastructure

This migration ensures consistent, reliable logging throughout your application while providing the foundation for advanced monitoring and debugging capabilities.
