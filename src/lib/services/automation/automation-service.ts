import { invoke } from '@tauri-apps/api/core';
import { logger } from '$lib/utils/logger';
import type {
  Pipeline,
  PipelineExecution,
  PipelineExecutionRequest,
  PipelineProgress,
  PipelineTemplate,
  PipelineValidationResult,
  PipelineStats,
  PipelineSearchOptions
} from '$lib/types/automation';

export interface CreatePipelineRequest {
  name: string;
  description?: string;
  version?: string;
  framework?: string;
  steps: any[];
  variables?: any[];
  metadata?: any;
  tags?: string[];
}

export interface UpdatePipelineRequest {
  name?: string;
  description?: string;
  version?: string;
  framework?: string;
  steps?: any[];
  variables?: any[];
  metadata?: any;
  tags?: string[];
}

export class AutomationService {
  private static instance: AutomationService;

  private constructor() {}

  static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  // Pipeline Management
  async getAllPipelines(): Promise<Pipeline[]> {
    try {
      return await invoke<Pipeline[]>('get_all_pipelines');
    } catch (error) {
      logger.info('Backend command get_all_pipelines not found, returning empty array');
      // Return empty array since backend is not implemented yet
      return [];
    }
  }

  async getPipeline(id: string): Promise<Pipeline> {
    try {
      return await invoke<Pipeline>('get_pipeline', { id });
    } catch (error) {
      logger.error('Failed to get pipeline:', error);
      throw new Error('Pipeline not found');
    }
  }

  async createPipeline(request: CreatePipelineRequest): Promise<Pipeline> {
    try {
      return await invoke<Pipeline>('create_pipeline', { pipeline: request });
    } catch (error) {
      logger.error('Failed to create pipeline:', error);
      // Create a mock pipeline since backend is not implemented
      const mockPipeline: Pipeline = {
        id: Date.now().toString(),
        name: request.name,
        description: request.description || '',
        version: request.version || '1.0.0',
        framework: request.framework || '',
        steps: request.steps || [],
        variables: request.variables || [],
        metadata: {
          ...request.metadata,
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        },
        tags: request.tags || []
      };
      return mockPipeline;
    }
  }

  async updatePipeline(id: string, request: UpdatePipelineRequest): Promise<Pipeline> {
    try {
      return await invoke<Pipeline>('update_pipeline', { id, pipeline: request });
    } catch (error) {
      logger.error('Failed to update pipeline:', error);
      throw new Error('Failed to update pipeline - backend not implemented');
    }
  }

  async deletePipeline(id: string): Promise<void> {
    try {
      await invoke<void>('delete_pipeline', { id });
    } catch (error) {
      logger.error('Failed to delete pipeline:', error);
      // Silently succeed since backend is not implemented
      return;
    }
  }

  async validatePipeline(pipeline: Pipeline): Promise<PipelineValidationResult> {
    try {
      return await invoke<PipelineValidationResult>('validate_pipeline', { pipeline });
    } catch (error) {
      logger.error('Failed to validate pipeline:', error);
      throw new Error('Failed to validate pipeline');
    }
  }

  // Pipeline Execution
  async executePipeline(request: PipelineExecutionRequest): Promise<PipelineExecution> {
    try {
      return await invoke<PipelineExecution>('execute_pipeline', { request });
    } catch (error) {
      logger.error('Failed to execute pipeline:', error);
      throw new Error('Failed to execute pipeline');
    }
  }

  async getExecution(id: string): Promise<PipelineExecution> {
    try {
      return await invoke<PipelineExecution>('get_pipeline_execution', { id });
    } catch (error) {
      logger.error('Failed to get pipeline execution:', error);
      throw new Error('Failed to fetch pipeline execution');
    }
  }

  async getAllExecutions(): Promise<PipelineExecution[]> {
    try {
      return await invoke<PipelineExecution[]>('get_all_pipeline_executions');
    } catch (error) {
      logger.error('Failed to get all pipeline executions:', error);
      throw new Error('Failed to fetch pipeline executions');
    }
  }

  async getExecutionsByPipeline(pipelineId: string): Promise<PipelineExecution[]> {
    try {
      return await invoke<PipelineExecution[]>('get_pipeline_executions_by_pipeline', { pipelineId });
    } catch (error) {
      logger.error('Failed to get pipeline executions by pipeline:', error);
      throw new Error('Failed to fetch pipeline executions');
    }
  }

  async cancelExecution(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('cancel_pipeline_execution', { id });
    } catch (error) {
      logger.error('Failed to cancel pipeline execution:', error);
      throw new Error('Failed to cancel pipeline execution');
    }
  }

  async getExecutionProgress(id: string): Promise<PipelineProgress> {
    try {
      return await invoke<PipelineProgress>('get_pipeline_execution_progress', { id });
    } catch (error) {
      logger.error('Failed to get pipeline execution progress:', error);
      throw new Error('Failed to fetch pipeline execution progress');
    }
  }

  // Pipeline Templates
  async getAllTemplates(): Promise<PipelineTemplate[]> {
    try {
      return await invoke<PipelineTemplate[]>('get_all_pipeline_templates');
    } catch (error) {
      logger.error('Failed to get pipeline templates:', error);
      throw new Error('Failed to fetch pipeline templates');
    }
  }

  async getTemplate(id: string): Promise<PipelineTemplate> {
    try {
      return await invoke<PipelineTemplate>('get_pipeline_template', { id });
    } catch (error) {
      logger.error('Failed to get pipeline template:', error);
      throw new Error('Failed to fetch pipeline template');
    }
  }

  async createTemplate(template: Omit<PipelineTemplate, 'id'>): Promise<PipelineTemplate> {
    try {
      return await invoke<PipelineTemplate>('create_pipeline_template', { template });
    } catch (error) {
      logger.error('Failed to create pipeline template:', error);
      throw new Error('Failed to create pipeline template');
    }
  }

  async updateTemplate(id: string, template: Partial<PipelineTemplate>): Promise<PipelineTemplate> {
    try {
      return await invoke<PipelineTemplate>('update_pipeline_template', { id, template });
    } catch (error) {
      logger.error('Failed to update pipeline template:', error);
      throw new Error('Failed to update pipeline template');
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      await invoke<void>('delete_pipeline_template', { id });
    } catch (error) {
      logger.error('Failed to delete pipeline template:', error);
      throw new Error('Failed to delete pipeline template');
    }
  }

  // Pipeline Search and Filtering
  async searchPipelines(options: PipelineSearchOptions): Promise<Pipeline[]> {
    try {
      return await invoke<Pipeline[]>('search_pipelines', { options });
    } catch (error) {
      logger.error('Failed to search pipelines:', error);
      throw new Error('Failed to search pipelines');
    }
  }

  async getPipelinesByFramework(framework: string): Promise<Pipeline[]> {
    try {
      return await invoke<Pipeline[]>('get_pipelines_by_framework', { framework });
    } catch (error) {
      logger.error('Failed to get pipelines by framework:', error);
      throw new Error('Failed to fetch pipelines by framework');
    }
  }

  async getPipelinesByTag(tag: string): Promise<Pipeline[]> {
    try {
      return await invoke<Pipeline[]>('get_pipelines_by_tag', { tag });
    } catch (error) {
      logger.error('Failed to get pipelines by tag:', error);
      throw new Error('Failed to fetch pipelines by tag');
    }
  }

  // Pipeline Statistics and Analytics
  async getPipelineStats(): Promise<PipelineStats> {
    try {
      return await invoke<PipelineStats>('get_pipeline_stats');
    } catch (error) {
      logger.error('Failed to get pipeline stats:', error);
      throw new Error('Failed to fetch pipeline stats');
    }
  }

  async getPipelineExecutionStats(pipelineId: string): Promise<any> {
    try {
      return await invoke<any>('get_pipeline_execution_stats', { pipelineId });
    } catch (error) {
      logger.error('Failed to get pipeline execution stats:', error);
      throw new Error('Failed to fetch pipeline execution stats');
    }
  }

  // Pipeline Import/Export
  async exportPipeline(id: string): Promise<string> {
    try {
      return await invoke<string>('export_pipeline', { id });
    } catch (error) {
      logger.error('Failed to export pipeline:', error);
      throw new Error('Failed to export pipeline');
    }
  }

  async importPipeline(pipelineData: string): Promise<Pipeline> {
    try {
      return await invoke<Pipeline>('import_pipeline', { pipelineData });
    } catch (error) {
      logger.error('Failed to import pipeline:', error);
      throw new Error('Failed to import pipeline');
    }
  }

  // Pipeline Scheduling
  async schedulePipeline(pipelineId: string, schedule: any): Promise<any> {
    try {
      return await invoke<any>('schedule_pipeline', { pipelineId, schedule });
    } catch (error) {
      logger.error('Failed to schedule pipeline:', error);
      throw new Error('Failed to schedule pipeline');
    }
  }

  async getScheduledPipelines(): Promise<any[]> {
    try {
      return await invoke<any[]>('get_scheduled_pipelines');
    } catch (error) {
      logger.error('Failed to get scheduled pipelines:', error);
      throw new Error('Failed to fetch scheduled pipelines');
    }
  }

  async cancelScheduledPipeline(scheduleId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('cancel_scheduled_pipeline', { scheduleId });
    } catch (error) {
      logger.error('Failed to cancel scheduled pipeline:', error);
      throw new Error('Failed to cancel scheduled pipeline');
    }
  }
}

export const automationService = AutomationService.getInstance();
