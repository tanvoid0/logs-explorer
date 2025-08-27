import { writable, derived } from 'svelte/store';
import { automationAPI } from '$lib/api/automation';
import type {
  Pipeline,
  PipelineExecution,
  PipelineProgress,
  PipelineTemplate,
  PipelineStats
} from '$lib/types/automation';

// Pipeline management store
export const pipelines = writable<Pipeline[]>([]);
export const isLoadingPipelines = writable(false);
export const pipelineError = writable<string | null>(null);

// Pipeline execution store
export const executions = writable<PipelineExecution[]>([]);
export const isLoadingExecutions = writable(false);
export const executionError = writable<string | null>(null);

// Active execution progress store
export const activeExecutions = writable<Map<string, PipelineProgress>>(new Map());

// Pipeline templates store
export const templates = writable<PipelineTemplate[]>([]);
export const isLoadingTemplates = writable(false);

// Pipeline statistics store
export const pipelineStats = writable<PipelineStats | null>(null);
export const isLoadingStats = writable(false);

// Selected pipeline for editing
export const selectedPipeline = writable<Pipeline | null>(null);

// Pipeline search and filter state
export const pipelineSearchQuery = writable('');
export const pipelineFilterFramework = writable<string | null>(null);
export const pipelineFilterCategory = writable<string | null>(null);
export const pipelineFilterTags = writable<string[]>([]);

// Derived stores
export const filteredPipelines = derived(
  [pipelines, pipelineSearchQuery, pipelineFilterFramework, pipelineFilterCategory, pipelineFilterTags],
  ([$pipelines, $query, $framework, $category, $tags]) => {
    return $pipelines.filter(pipeline => {
      // Search query filter
      if ($query && !pipeline.name.toLowerCase().includes($query.toLowerCase()) &&
          !pipeline.description?.toLowerCase().includes($query.toLowerCase())) {
        return false;
      }
      
      // Framework filter
      if ($framework && pipeline.framework !== $framework) {
        return false;
      }
      
      // Category filter
      if ($category && pipeline.metadata?.category !== $category) {
        return false;
      }
      
      // Tags filter
      if ($tags.length > 0 && !$tags.some(tag => pipeline.tags?.includes(tag))) {
        return false;
      }
      
      return true;
    });
  }
);

export const runningExecutions = derived(
  executions,
  ($executions) => $executions.filter(exec => 
    exec.status === 'running' || exec.status === 'pending'
  )
);

export const completedExecutions = derived(
  executions,
  ($executions) => $executions.filter(exec => 
    exec.status === 'completed' || exec.status === 'failed' || exec.status === 'cancelled'
  )
);

// Actions
export const automationActions = {
  // Pipeline management
  async loadPipelines() {
    try {
      isLoadingPipelines.set(true);
      pipelineError.set(null);
      const data = await automationAPI.getAllPipelines();
      pipelines.set(data);
    } catch (error) {
      console.error('Failed to load pipelines:', error);
      // Set empty array instead of error for now since backend is not implemented
      pipelines.set([]);
      pipelineError.set(null);
    } finally {
      isLoadingPipelines.set(false);
    }
  },

  async createPipeline(pipeline: Omit<Pipeline, 'id'>) {
    try {
      const newPipeline = await automationAPI.createPipeline(pipeline);
      pipelines.update(current => [...current, newPipeline]);
      return newPipeline;
    } catch (error) {
      console.error('Failed to create pipeline:', error);
      // For now, create a mock pipeline since backend is not implemented
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
      pipelines.update(current => [...current, mockPipeline]);
      return mockPipeline;
    }
  },

  async updatePipeline(id: string, updates: Partial<Pipeline>) {
    try {
      const updatedPipeline = await automationAPI.updatePipeline(id, updates);
      pipelines.update(current => 
        current.map(p => p.id === id ? updatedPipeline : p)
      );
      return updatedPipeline;
    } catch (error) {
      console.error('Failed to update pipeline:', error);
      // For now, update locally since backend is not implemented
      pipelines.update(current => 
        current.map(p => p.id === id ? { 
          ...p, 
          ...updates, 
          metadata: {
            ...p.metadata,
            updated: new Date().toISOString()
          }
        } : p)
      );
      return { 
        ...pipelines.get().find(p => p.id === id)!, 
        ...updates, 
        metadata: {
          ...pipelines.get().find(p => p.id === id)!.metadata,
          updated: new Date().toISOString()
        }
      };
    }
  },

  async deletePipeline(id: string) {
    try {
      await automationAPI.deletePipeline(id);
      pipelines.update(current => current.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete pipeline:', error);
      // For now, delete locally since backend is not implemented
      pipelines.update(current => current.filter(p => p.id !== id));
    }
  },

  // Pipeline execution
  async loadExecutions(projectId?: number) {
    try {
      isLoadingExecutions.set(true);
      executionError.set(null);
      const data = await automationAPI.getAllExecutions(projectId);
      executions.set(data);
    } catch (error) {
      executionError.set(error instanceof Error ? error.message : 'Failed to load executions');
      console.error('Failed to load executions:', error);
    } finally {
      isLoadingExecutions.set(false);
    }
  },

  async executePipeline(pipelineId: string, projectId: number, variables: Record<string, any>) {
    try {
      const execution = await automationAPI.executePipeline({
        pipelineId,
        projectId,
        variables
      });
      
      executions.update(current => [execution, ...current]);
      
      // Start monitoring progress
      this.monitorExecutionProgress(execution.id);
      
      return execution;
    } catch (error) {
      throw error;
    }
  },

  async cancelExecution(id: string) {
    try {
      await automationAPI.cancelExecution(id);
      executions.update(current => 
        current.map(exec => 
          exec.id === id 
            ? { ...exec, status: 'cancelled', completedAt: new Date().toISOString() }
            : exec
        )
      );
      
      // Remove from active executions
      activeExecutions.update(current => {
        const newMap = new Map(current);
        newMap.delete(id);
        return newMap;
      });
    } catch (error) {
      throw error;
    }
  },

  // Progress monitoring
  async monitorExecutionProgress(executionId: string) {
    const updateProgress = async () => {
      try {
        const progress = await automationAPI.getExecutionProgress(executionId);
        
        activeExecutions.update(current => {
          const newMap = new Map(current);
          newMap.set(executionId, progress);
          return newMap;
        });

        // Update execution status
        executions.update(current => 
          current.map(exec => 
            exec.id === executionId 
              ? { ...exec, status: progress.status }
              : exec
          )
        );

        // Stop monitoring if execution is complete
        if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') {
          setTimeout(() => {
            activeExecutions.update(current => {
              const newMap = new Map(current);
              newMap.delete(executionId);
              return newMap;
            });
          }, 5000); // Keep progress for 5 seconds after completion
          return;
        }

        // Continue monitoring
        setTimeout(updateProgress, 1000);
      } catch (error) {
        console.error('Failed to update execution progress:', error);
        // Retry after 5 seconds
        setTimeout(updateProgress, 5000);
      }
    };

    updateProgress();
  },

  // Templates
  async loadTemplates() {
    try {
      isLoadingTemplates.set(true);
      const data = await automationAPI.getTemplates();
      templates.set(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Set empty array since backend is not implemented
      templates.set([]);
    } finally {
      isLoadingTemplates.set(false);
    }
  },

  async createFromTemplate(templateId: string, name: string, variables?: Record<string, any>) {
    try {
      const newPipeline = await automationAPI.createFromTemplate(templateId, name, variables);
      pipelines.update(current => [...current, newPipeline]);
      return newPipeline;
    } catch (error) {
      console.error('Failed to create from template:', error);
      // For now, create a mock pipeline since backend is not implemented
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
      pipelines.update(current => [...current, mockPipeline]);
      return mockPipeline;
    }
  },

  // Statistics
  async loadStats(pipelineId?: string) {
    try {
      isLoadingStats.set(true);
      const data = await automationAPI.getPipelineStats(pipelineId);
      pipelineStats.set(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set null since backend is not implemented
      pipelineStats.set(null);
    } finally {
      isLoadingStats.set(false);
    }
  },

  // Search and filtering
  clearFilters() {
    pipelineSearchQuery.set('');
    pipelineFilterFramework.set(null);
    pipelineFilterCategory.set(null);
    pipelineFilterTags.set([]);
  },

  // Utility functions
  getPipelineById(id: string): Pipeline | undefined {
    let result: Pipeline | undefined;
    pipelines.subscribe(pipelines => {
      result = pipelines.find(p => p.id === id);
    })();
    return result;
  },

  getExecutionById(id: string): PipelineExecution | undefined {
    let result: PipelineExecution | undefined;
    executions.subscribe(executions => {
      result = executions.find(e => e.id === id);
    })();
    return result;
  },

  getActiveProgress(executionId: string): PipelineProgress | undefined {
    let result: PipelineProgress | undefined;
    activeExecutions.subscribe(active => {
      result = active.get(executionId);
    })();
    return result;
  }
};
