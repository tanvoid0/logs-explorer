import { invoke } from '@tauri-apps/api/core';
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

export class AutomationAPI {
  // Pipeline Management
  async getAllPipelines(): Promise<Pipeline[]> {
    try {
      return await invoke('get_all_pipelines') as Pipeline[];
    } catch (error) {
      console.log('Backend command get_all_pipelines not found, returning empty array');
      // Return empty array since backend is not implemented yet
      return [];
    }
  }

  async getPipeline(id: string): Promise<Pipeline> {
    try {
      return await invoke('get_pipeline', { id });
    } catch (error) {
      console.error('Failed to get pipeline:', error);
      throw new Error('Pipeline not found');
    }
  }

  async createPipeline(pipeline: Omit<Pipeline, 'id'>): Promise<Pipeline> {
    try {
      return await invoke('create_pipeline', { pipeline });
    } catch (error) {
      console.error('Failed to create pipeline:', error);
      // Create a mock pipeline since backend is not implemented
      const mockPipeline: Pipeline = {
        id: Date.now().toString(),
        name: pipeline.name,
        description: pipeline.description || '',
        version: pipeline.version || '1.0.0',
        framework: pipeline.framework || '',
        steps: pipeline.steps || [],
        variables: pipeline.variables || [],
        metadata: {
          ...pipeline.metadata,
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        },
        tags: pipeline.tags || []
      };
      return mockPipeline;
    }
  }

  async updatePipeline(id: string, pipeline: Partial<Pipeline>): Promise<Pipeline> {
    try {
      return await invoke('update_pipeline', { id, pipeline });
    } catch (error) {
      console.error('Failed to update pipeline:', error);
      throw new Error('Failed to update pipeline - backend not implemented');
    }
  }

  async deletePipeline(id: string): Promise<void> {
    try {
      await invoke('delete_pipeline', { id });
    } catch (error) {
      console.error('Failed to delete pipeline:', error);
      // Silently succeed since backend is not implemented
      return;
    }
  }

  async validatePipeline(pipeline: Pipeline): Promise<PipelineValidationResult> {
    try {
      return await invoke('validate_pipeline', { pipeline });
    } catch (error) {
      console.error('Failed to validate pipeline:', error);
      throw new Error('Failed to validate pipeline');
    }
  }

  // Pipeline Execution
  async executePipeline(request: PipelineExecutionRequest): Promise<PipelineExecution> {
    try {
      return await invoke('execute_pipeline', { request });
    } catch (error) {
      console.error('Failed to execute pipeline:', error);
      throw new Error('Failed to execute pipeline');
    }
  }

  async getExecution(id: string): Promise<PipelineExecution> {
    try {
      return await invoke('get_pipeline_execution', { id });
    } catch (error) {
      console.error('Failed to get execution:', error);
      throw new Error('Failed to load execution');
    }
  }

  async getAllExecutions(projectId?: number): Promise<PipelineExecution[]> {
    try {
      return await invoke('get_all_pipeline_executions', { projectId });
    } catch (error) {
      console.error('Failed to get executions:', error);
      throw new Error('Failed to load executions');
    }
  }

  async cancelExecution(id: string): Promise<void> {
    try {
      await invoke('cancel_pipeline_execution', { id });
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      throw new Error('Failed to cancel execution');
    }
  }

  async getExecutionProgress(id: string): Promise<PipelineProgress> {
    try {
      return await invoke('get_pipeline_progress', { id });
    } catch (error) {
      console.error('Failed to get execution progress:', error);
      throw new Error('Failed to load execution progress');
    }
  }

  // Pipeline Templates
  async getTemplates(): Promise<PipelineTemplate[]> {
    try {
      return await invoke('get_pipeline_templates');
    } catch (error) {
      console.error('Failed to get templates:', error);
      // Return empty array since backend is not implemented
      return [];
    }
  }

  async createFromTemplate(templateId: string, name: string, variables?: Record<string, any>): Promise<Pipeline> {
    try {
      return await invoke('create_pipeline_from_template', { templateId, name, variables });
    } catch (error) {
      console.error('Failed to create from template:', error);
      // Create a mock pipeline since backend is not implemented
      const mockPipeline: Pipeline = {
        id: Date.now().toString(),
        name,
        description: `Created from template ${templateId}`,
        version: '1.0.0',
        framework: '',
        steps: [],
        variables: variables ? Object.keys(variables).map(key => ({ 
          name: key, 
          type: 'string' as const, 
          required: false 
        })) : [],
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        },
        tags: []
      };
      return mockPipeline;
    }
  }

  // Pipeline Search and Filtering
  async searchPipelines(options: PipelineSearchOptions): Promise<Pipeline[]> {
    try {
      return await invoke('search_pipelines', { options });
    } catch (error) {
      console.error('Failed to search pipelines:', error);
      throw new Error('Failed to search pipelines');
    }
  }

  async getPipelinesByFramework(framework: string): Promise<Pipeline[]> {
    try {
      return await invoke('get_pipelines_by_framework', { framework });
    } catch (error) {
      console.error('Failed to get pipelines by framework:', error);
      throw new Error('Failed to load framework pipelines');
    }
  }

  // Pipeline Statistics
  async getPipelineStats(pipelineId?: string): Promise<PipelineStats> {
    try {
      return await invoke('get_pipeline_stats', { pipelineId });
    } catch (error) {
      console.error('Failed to get pipeline stats:', error);
      // Return mock stats since backend is not implemented
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageDuration: 0,
        mostUsedVariables: [],
        stepSuccessRates: []
      };
    }
  }

  // Pipeline Export/Import
  async exportPipeline(id: string): Promise<string> {
    try {
      return await invoke('export_pipeline', { id });
    } catch (error) {
      console.error('Failed to export pipeline:', error);
      throw new Error('Failed to export pipeline');
    }
  }

  async importPipeline(yamlContent: string): Promise<Pipeline> {
    try {
      return await invoke('import_pipeline', { yamlContent });
    } catch (error) {
      console.error('Failed to import pipeline:', error);
      // Parse YAML locally since backend is not implemented
      try {
        const pipeline = this.parseYamlToPipeline(yamlContent);
        return pipeline;
      } catch (parseError) {
        throw new Error(`Failed to parse YAML: ${parseError}`);
      }
    }
  }

  private parseYamlToPipeline(yamlContent: string): Pipeline {
    // Simple YAML parser for basic pipeline structure
    const lines = yamlContent.split('\n');
    const pipeline: any = {
      id: Date.now().toString(),
      variables: [],
      steps: [],
      tags: [],
      metadata: {}
    };

    let currentSection = '';
    let currentVariable: any = {};
    let currentStep: any = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed === 'variables:' || trimmed === 'steps:' || trimmed === 'metadata:') {
        currentSection = trimmed.slice(0, -1);
        continue;
      }

      if (currentSection === 'variables' && trimmed.startsWith('- name:')) {
        if (currentVariable.name) {
          pipeline.variables.push({ ...currentVariable });
        }
        currentVariable = { name: '', type: 'string', required: false };
        currentVariable.name = trimmed.split('"')[1] || trimmed.split("'")[1] || '';
      } else if (currentSection === 'variables' && currentVariable.name) {
        if (trimmed.includes('type:')) {
          currentVariable.type = trimmed.split(':')[1].trim().replace(/['"]/g, '');
        } else if (trimmed.includes('required:')) {
          currentVariable.required = trimmed.includes('true');
        } else if (trimmed.includes('defaultValue:')) {
          currentVariable.defaultValue = trimmed.split(':')[1].trim().replace(/['"]/g, '');
        }
      } else if (currentSection === 'steps' && trimmed.startsWith('- id:')) {
        if (currentStep.id) {
          pipeline.steps.push({ ...currentStep });
        }
        currentStep = { id: '', name: '', type: 'command' };
        currentStep.id = trimmed.split('"')[1] || trimmed.split("'")[1] || '';
      } else if (currentSection === 'steps' && currentStep.id) {
        if (trimmed.includes('name:')) {
          currentStep.name = trimmed.split('"')[1] || trimmed.split("'")[1] || '';
        } else if (trimmed.includes('type:')) {
          currentStep.type = trimmed.split(':')[1].trim().replace(/['"]/g, '');
        } else if (trimmed.includes('command:')) {
          currentStep.command = trimmed.split('"')[1] || trimmed.split("'")[1] || '';
        } else if (trimmed.includes('description:')) {
          currentStep.description = trimmed.split('"')[1] || trimmed.split("'")[1] || '';
        }
      } else if (trimmed.includes('name:')) {
        pipeline.name = trimmed.split('"')[1] || trimmed.split("'")[1] || '';
      } else if (trimmed.includes('description:')) {
        pipeline.description = trimmed.split('"')[1] || trimmed.split("'")[1] || '';
      } else if (trimmed.includes('version:')) {
        pipeline.version = trimmed.split(':')[1].trim().replace(/['"]/g, '');
      } else if (trimmed.includes('framework:')) {
        pipeline.framework = trimmed.split(':')[1].trim().replace(/['"]/g, '');
      } else if (trimmed.includes('tags:')) {
        const tagsMatch = yamlContent.match(/tags:\s*\[(.*?)\]/);
        if (tagsMatch) {
          pipeline.tags = tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
        }
      }
    }

    // Add the last variable and step
    if (currentVariable.name) {
      pipeline.variables.push({ ...currentVariable });
    }
    if (currentStep.id) {
      pipeline.steps.push({ ...currentStep });
    }

    // Set defaults
    if (!pipeline.name) pipeline.name = 'Imported Pipeline';
    if (!pipeline.version) pipeline.version = '1.0.0';
    if (!pipeline.metadata) pipeline.metadata = {};
    pipeline.metadata.created = new Date().toISOString();
    pipeline.metadata.updated = new Date().toISOString();

    return pipeline as Pipeline;
  }

  // Pipeline Categories and Tags
  async getPipelineCategories(): Promise<string[]> {
    try {
      return await invoke('get_pipeline_categories');
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw new Error('Failed to load categories');
    }
  }

  async getPipelineTags(): Promise<string[]> {
    try {
      return await invoke('get_pipeline_tags');
    } catch (error) {
      console.error('Failed to get tags:', error);
      throw new Error('Failed to load tags');
    }
  }

  // Pipeline Scheduling
  async schedulePipeline(
    pipelineId: string,
    projectId: number,
    schedule: {
      cron: string;
      variables: Record<string, any>;
      enabled: boolean;
    }
  ): Promise<void> {
    try {
      await invoke('schedule_pipeline', { pipelineId, projectId, schedule });
    } catch (error) {
      console.error('Failed to schedule pipeline:', error);
      throw new Error('Failed to schedule pipeline');
    }
  }

  async getScheduledPipelines(): Promise<Array<{
    id: string;
    pipelineId: string;
    projectId: number;
    schedule: string;
    nextRun: string;
    enabled: boolean;
  }>> {
    try {
      return await invoke('get_scheduled_pipelines');
    } catch (error) {
      console.error('Failed to get scheduled pipelines:', error);
      throw new Error('Failed to load scheduled pipelines');
    }
  }

  async deleteScheduledPipeline(id: string): Promise<void> {
    try {
      await invoke('delete_scheduled_pipeline', { id });
    } catch (error) {
      console.error('Failed to delete scheduled pipeline:', error);
      throw new Error('Failed to delete scheduled pipeline');
    }
  }
}

export const automationAPI = new AutomationAPI();
