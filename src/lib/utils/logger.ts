import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { v4 as uuidv4 } from 'uuid';

export interface LogContext {
  traceId?: string;
  operation?: string;
  userId?: string;
  projectId?: string;
  taskId?: string;
  groupId?: string;
  error?: any; // Allow error property
  [key: string]: any; // Allow any additional properties
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  traceId: string;
  operation?: string;
  context?: Record<string, any>;
  file?: string;
  line?: number;
}

// Type for flexible log input
type LogInput = string | object | any[];

class Logger {
  private logger: winston.Logger;
  private currentTraceId: string | null = null;
  private currentOperation: string | null = null;

  constructor() {
    // Determine if we're in development mode
    const isDev = (import.meta as any).env?.DEV || 
                  (import.meta as any).env?.VITE_DEV === 'true' ||
                  window.location.hostname === 'localhost';

    const logDir = isDev ? './logs' : './logs';

    // Create console format
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, traceId, operation, ...context }) => {
        const traceInfo = traceId ? `[${traceId}]` : '';
        const operationInfo = operation ? `[${operation}]` : '';
        const contextInfo = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
        return `${timestamp} ${level} ${traceInfo}${operationInfo} ${message}${contextInfo}`;
      })
    );

    // Create file format (JSON)
    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    this.logger = winston.createLogger({
      level: isDev ? 'debug' : 'info',
      format: fileFormat,
      defaultMeta: { service: 'logs-explorer-frontend' },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: consoleFormat,
          level: isDev ? 'debug' : 'info'
        }),

        // Daily rotate file transport
        new DailyRotateFile({
          filename: `${logDir}/logs-explorer-frontend-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: fileFormat
        }),

        // Error file transport
        new DailyRotateFile({
          filename: `${logDir}/logs-explorer-frontend-error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: fileFormat
        })
      ]
    });

    // Log initialization
    this.info('Frontend logger initialized', {
      isDev,
      logDir,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  private getTraceId(): string {
    if (!this.currentTraceId) {
      this.currentTraceId = uuidv4();
    }
    return this.currentTraceId || uuidv4();
  }

  private getCallerInfo(): { file?: string; line?: number } {
    const stack = new Error().stack;
    if (stack) {
      const lines = stack.split('\n');
      // Skip the first few lines (Error, Logger methods, etc.)
      for (let i = 3; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('src/') && !line.includes('logger.ts')) {
          const match = line.match(/\((.+):(\d+):(\d+)\)/);
          if (match) {
            const filePath = match[1].split('/').pop() || match[1];
            return { file: filePath, line: parseInt(match[2]) };
          }
        }
      }
    }
    return {};
  }

  private createLogMeta(context?: LogContext) {
    const traceId = context?.traceId || this.getTraceId();
    const operation = context?.operation || this.currentOperation || undefined;
    const callerInfo = this.getCallerInfo();

    return {
      traceId,
      operation,
      ...callerInfo,
      ...context
    };
  }

  // Helper method to format log input
  private formatLogInput(input: LogInput): { message: string; context?: LogContext } {
    if (typeof input === 'string') {
      return { message: input };
    }
    
    if (Array.isArray(input)) {
      return { 
        message: 'Array logged', 
        context: { data: input } 
      };
    }
    
    if (input && typeof input === 'object') {
      // If it's an object with a message property, use that as the message
      if ('message' in input && typeof input.message === 'string') {
        const { message, ...rest } = input;
        return { 
          message, 
          context: rest 
        };
      }
      
      // Otherwise, use a generic message and put the object in context
      return { 
        message: 'Object logged', 
        context: { data: input } 
      };
    }
    
    // Fallback for other types
    return { 
      message: String(input) 
    };
  }

  // Start a new trace for an operation
  startTrace(operation: string, context?: Omit<LogContext, 'traceId' | 'operation'>): string {
    const traceId = uuidv4();
    this.currentTraceId = traceId;
    this.currentOperation = operation;

    this.info(`Starting operation: ${operation}`, {
      traceId,
      operation,
      ...context
    });

    return traceId;
  }

  // End the current trace
  endTrace(success: boolean = true, context?: Omit<LogContext, 'traceId' | 'operation'>) {
    if (this.currentOperation) {
      const status = success ? 'completed' : 'failed';
      this.info(`Operation ${status}: ${this.currentOperation}`, {
        traceId: this.currentTraceId || undefined,
        operation: this.currentOperation,
        success,
        ...context
      });
    }

    this.currentTraceId = null;
    this.currentOperation = null;
  }

  // Flexible logging methods that accept both strings and objects
  info(input: LogInput, context?: LogContext) {
    const { message, context: inputContext } = this.formatLogInput(input);
    const mergedContext = { ...inputContext, ...context };
    this.logger.info(message, this.createLogMeta(mergedContext));
  }

  debug(input: LogInput, context?: LogContext) {
    const { message, context: inputContext } = this.formatLogInput(input);
    const mergedContext = { ...inputContext, ...context };
    this.logger.debug(message, this.createLogMeta(mergedContext));
  }

  warn(input: LogInput, context?: LogContext) {
    const { message, context: inputContext } = this.formatLogInput(input);
    const mergedContext = { ...inputContext, ...context };
    this.logger.warn(message, this.createLogMeta(mergedContext));
  }

  error(input: LogInput, error?: Error | unknown, context?: LogContext) {
    const { message, context: inputContext } = this.formatLogInput(input);
    const mergedContext = { ...inputContext, ...context };
    const meta = this.createLogMeta(mergedContext);
    
    if (error) {
      if (error instanceof Error) {
        meta.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      } else {
        // Handle non-Error objects (strings, objects, etc.)
        meta.error = {
          name: 'UnknownError',
          message: String(error),
          stack: undefined
        };
      }
    }
    this.logger.error(message, meta);
  }

  // Convenience methods for common patterns
  log(level: 'info' | 'debug' | 'warn' | 'error', input: LogInput, context?: LogContext) {
    switch (level) {
      case 'info':
        this.info(input, context);
        break;
      case 'debug':
        this.debug(input, context);
        break;
      case 'warn':
        this.warn(input, context);
        break;
      case 'error':
        this.error(input, undefined, context);
        break;
    }
  }

  // Task-specific convenience methods (optional, for backward compatibility)
  taskCreated(taskId: string, taskData: any, context?: LogContext) {
    this.info('Task created', {
      ...context,
      taskId,
      taskTitle: taskData.title,
      taskStatus: taskData.status,
      taskPriority: taskData.priority,
      groupId: taskData.groupId,
      parentId: taskData.parentId
    });
  }

  taskUpdated(taskId: string, oldData: any, newData: any, context?: LogContext) {
    this.info('Task updated', {
      ...context,
      taskId,
      oldStatus: oldData.status,
      newStatus: newData.status,
      oldPriority: oldData.priority,
      newPriority: newData.priority,
      changes: this.getChanges(oldData, newData)
    });
  }

  taskDeleted(taskId: string, taskData: any, context?: LogContext) {
    this.info('Task deleted', {
      ...context,
      taskId,
      taskTitle: taskData.title,
      taskStatus: taskData.status,
      groupId: taskData.groupId
    });
  }

  private getChanges(oldData: any, newData: any): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    const fields = ['title', 'description', 'status', 'priority', 'dueDate', 'groupId', 'parentId'];
    
    for (const field of fields) {
      if (oldData[field] !== newData[field]) {
        changes[field] = { old: oldData[field], new: newData[field] };
      }
    }
    
    return changes;
  }

  // Get recent logs for debugging
  async getRecentLogs(limit: number = 100): Promise<LogEntry[]> {
    // This would need to be implemented with a log reader
    // For now, we'll return an empty array
    return [];
  }

  // Clear logs (for testing)
  async clearLogs(): Promise<void> {
    // This would need to be implemented with log file management
    this.info('Logs cleared');
  }
}

// Create singleton instance
export const logger = new Logger();

// Export types for use in other modules
// (Already exported above)
