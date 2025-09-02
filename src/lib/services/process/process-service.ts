import { invoke } from '@tauri-apps/api/core';
import { logger } from '$lib/utils/logger';

export interface ProcessExecution {
  id: string;
  command: string;
  args: string[];
  workingDirectory: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  exitCode?: number;
  output?: string;
  error?: string;
  startTime: string;
  endTime?: string;
  pid?: number;
}

export interface ProcessExecutionRequest {
  command: string;
  args?: string[];
  workingDirectory?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface ProcessValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProcessStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  recentExecutions: ProcessExecution[];
}

export class ProcessService {
  private static instance: ProcessService;

  private constructor() {}

  static getInstance(): ProcessService {
    if (!ProcessService.instance) {
      ProcessService.instance = new ProcessService();
    }
    return ProcessService.instance;
  }

  // Process Execution
  async executeCommand(request: ProcessExecutionRequest): Promise<ProcessExecution> {
    try {
      return await invoke<ProcessExecution>('execute_command', {
        command: request.command,
        args: request.args || [],
        workingDirectory: request.workingDirectory || '',
        timeout: request.timeout || 30000,
        env: request.env || {}
      });
    } catch (error) {
      logger.error('Failed to execute command:', error);
      throw new Error('Failed to execute command');
    }
  }

  async executeCommandInDirectory(
    command: string,
    args: string[],
    workingDirectory: string
  ): Promise<string> {
    try {
      return await invoke<string>('execute_command_in_directory', {
        command,
        args,
        workingDirectory
      });
    } catch (error) {
      logger.error('Failed to execute command in directory:', error);
      throw new Error('Failed to execute command in directory');
    }
  }

  async getExecution(id: string): Promise<ProcessExecution> {
    try {
      return await invoke<ProcessExecution>('get_process_execution', { id });
    } catch (error) {
      logger.error('Failed to get process execution:', error);
      throw new Error('Failed to fetch process execution');
    }
  }

  async getAllExecutions(): Promise<ProcessExecution[]> {
    try {
      return await invoke<ProcessExecution[]>('get_all_process_executions');
    } catch (error) {
      logger.error('Failed to get all process executions:', error);
      throw new Error('Failed to fetch process executions');
    }
  }

  async getRecentExecutions(limit: number = 10): Promise<ProcessExecution[]> {
    try {
      return await invoke<ProcessExecution[]>('get_recent_process_executions', { limit });
    } catch (error) {
      logger.error('Failed to get recent process executions:', error);
      throw new Error('Failed to fetch recent process executions');
    }
  }

  async cancelExecution(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('cancel_process_execution', { id });
    } catch (error) {
      logger.error('Failed to cancel process execution:', error);
      throw new Error('Failed to cancel process execution');
    }
  }

  async killProcess(pid: number): Promise<boolean> {
    try {
      return await invoke<boolean>('kill_process', { pid });
    } catch (error) {
      logger.error('Failed to kill process:', error);
      throw new Error('Failed to kill process');
    }
  }

  // Process Validation
  async validateCommand(command: string, args: string[] = []): Promise<ProcessValidationResult> {
    try {
      return await invoke<ProcessValidationResult>('validate_command', { command, args });
    } catch (error) {
      logger.error('Failed to validate command:', error);
      throw new Error('Failed to validate command');
    }
  }

  async validateWorkingDirectory(path: string): Promise<boolean> {
    try {
      return await invoke<boolean>('validate_working_directory', { path });
    } catch (error) {
      logger.error('Failed to validate working directory:', error);
      throw new Error('Failed to validate working directory');
    }
  }

  async checkCommandExists(command: string): Promise<boolean> {
    try {
      return await invoke<boolean>('check_command_exists', { command });
    } catch (error) {
      logger.error('Failed to check if command exists:', error);
      throw new Error('Failed to check if command exists');
    }
  }

  // Process Management
  async getRunningProcesses(): Promise<ProcessExecution[]> {
    try {
      return await invoke<ProcessExecution[]>('get_running_processes');
    } catch (error) {
      logger.error('Failed to get running processes:', error);
      throw new Error('Failed to fetch running processes');
    }
  }

  async getProcessStats(): Promise<ProcessStats> {
    try {
      return await invoke<ProcessStats>('get_process_stats');
    } catch (error) {
      logger.error('Failed to get process stats:', error);
      throw new Error('Failed to fetch process stats');
    }
  }

  async clearExecutionHistory(): Promise<boolean> {
    try {
      return await invoke<boolean>('clear_execution_history');
    } catch (error) {
      logger.error('Failed to clear execution history:', error);
      throw new Error('Failed to clear execution history');
    }
  }

  // Process Monitoring
  async startProcessMonitoring(): Promise<void> {
    try {
      return await invoke<void>('start_process_monitoring');
    } catch (error) {
      logger.error('Failed to start process monitoring:', error);
      throw new Error('Failed to start process monitoring');
    }
  }

  async stopProcessMonitoring(): Promise<void> {
    try {
      return await invoke<void>('stop_process_monitoring');
    } catch (error) {
      logger.error('Failed to stop process monitoring:', error);
      throw new Error('Failed to stop process monitoring');
    }
  }

  async isProcessMonitoringActive(): Promise<boolean> {
    try {
      return await invoke<boolean>('is_process_monitoring_active');
    } catch (error) {
      logger.error('Failed to check process monitoring status:', error);
      throw new Error('Failed to check process monitoring status');
    }
  }

  // Utility Methods
  async getSystemInfo(): Promise<any> {
    try {
      return await invoke<any>('get_system_info');
    } catch (error) {
      logger.error('Failed to get system info:', error);
      throw new Error('Failed to fetch system info');
    }
  }

  async getAvailableCommands(): Promise<string[]> {
    try {
      return await invoke<string[]>('get_available_commands');
    } catch (error) {
      logger.error('Failed to get available commands:', error);
      throw new Error('Failed to fetch available commands');
    }
  }

  async getCommandHelp(command: string): Promise<string> {
    try {
      return await invoke<string>('get_command_help', { command });
    } catch (error) {
      logger.error('Failed to get command help:', error);
      throw new Error('Failed to fetch command help');
    }
  }

  async formatCommandOutput(output: string, format: 'text' | 'json' | 'xml' = 'text'): Promise<string> {
    try {
      return await invoke<string>('format_command_output', { output, format });
    } catch (error) {
      logger.error('Failed to format command output:', error);
      throw new Error('Failed to format command output');
    }
  }
}

export const processService = ProcessService.getInstance();
