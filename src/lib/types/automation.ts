// Automation Pipeline Types
// This defines the structure for YAML-based automation pipelines

export interface PipelineStep {
  id: string;
  name: string;
  description?: string;
  type: 'command' | 'script' | 'validation' | 'wait' | 'notification';
  command?: string;
  script?: string;
  scriptType?: 'bash' | 'python' | 'node' | 'custom';
  timeout?: number; // in seconds
  retries?: number;
  retryDelay?: number; // in seconds
  dependsOn?: string[]; // step IDs this step depends on
  parallel?: boolean; // can run in parallel with other steps
  condition?: string; // conditional execution (e.g., "PROJECT_FRAMEWORK == 'react'")
  environment?: Record<string, string>; // step-specific environment variables
  workingDirectory?: string; // relative to project path
  expectedExitCode?: number; // default 0
  validation?: {
    type: 'file_exists' | 'command_success' | 'custom';
    value: string;
    message?: string;
  };
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  version: string;
  framework?: string; // optional framework filter
  tags?: string[];
  variables: PipelineVariable[];
  steps: PipelineStep[];
  metadata?: {
    author?: string;
    created?: string;
    updated?: string;
    category?: string;
  };
}

export interface PipelineVariable {
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  defaultValue?: string | number | boolean;
  required: boolean;
  options?: string[]; // for select type
  validation?: {
    pattern?: string; // regex pattern
    min?: number;
    max?: number;
    message?: string;
  };
}

// Runtime variables that are automatically provided
export interface RuntimeVariables {
  PROJECT_NAME: string;
  PROJECT_PATH: string;
  PROJECT_NAMESPACE: string;
  PROJECT_FRAMEWORK?: string;
  PROJECT_DEPLOYMENT?: string;
  USER_HOME: string;
  CURRENT_TIMESTAMP: string;
  PIPELINE_ID: string;
  PIPELINE_NAME: string;
}

// Pipeline execution types
export interface PipelineExecution {
  id: string;
  pipelineId: string;
  projectId: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  variables: Record<string, string | number | boolean>;
  steps: PipelineStepExecution[];
  logs: PipelineLog[];
  metadata?: {
    triggeredBy?: string;
    triggerType?: 'manual' | 'scheduled' | 'webhook';
    environment?: string;
  };
}

export interface PipelineStepExecution {
  id: string;
  stepId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number; // in milliseconds
  exitCode?: number;
  output?: string;
  error?: string;
  retries: number;
  maxRetries: number;
  logs: PipelineLog[];
  validation?: {
    passed: boolean;
    message?: string;
  };
}

export interface PipelineLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  stepId?: string;
  executionId: string;
}

// Pipeline template for creating new pipelines
export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  framework?: string;
  template: Omit<Pipeline, 'id'>;
  tags: string[];
}

// Pipeline execution request
export interface PipelineExecutionRequest {
  pipelineId: string;
  projectId: number;
  variables: Record<string, string | number | boolean>;
  options?: {
    dryRun?: boolean;
    timeout?: number;
    parallel?: boolean;
  };
}

// Pipeline execution progress
export interface PipelineProgress {
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStep?: string;
  completedSteps: number;
  totalSteps: number;
  estimatedTimeRemaining?: number; // in seconds
  steps: PipelineStepProgress[];
}

export interface PipelineStepProgress {
  stepId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress?: number; // 0-100 for long-running steps
  message?: string;
  startTime?: string;
  duration?: number;
}

// Pipeline validation result
export interface PipelineValidationResult {
  isValid: boolean;
  errors: PipelineValidationError[];
  warnings: PipelineValidationWarning[];
}

export interface PipelineValidationError {
  type: 'syntax' | 'semantic' | 'dependency' | 'variable';
  message: string;
  stepId?: string;
  line?: number;
  column?: number;
}

export interface PipelineValidationWarning {
  type: 'performance' | 'security' | 'best_practice';
  message: string;
  stepId?: string;
  suggestion?: string;
}

// Pipeline statistics
export interface PipelineStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecuted?: string;
  mostUsedVariables: Array<{
    name: string;
    count: number;
  }>;
  stepSuccessRates: Array<{
    stepId: string;
    name: string;
    successRate: number;
    totalRuns: number;
  }>;
}

// Pipeline search and filter options
export interface PipelineSearchOptions {
  query?: string;
  framework?: string;
  tags?: string[];
  category?: string;
  author?: string;
  status?: 'active' | 'draft' | 'archived';
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created' | 'updated' | 'usage';
  sortOrder?: 'asc' | 'desc';
}
