<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { automationActions, pipelines, activeExecutions } from '$lib/stores/automation-store';
  import { toastStore } from '$lib/stores/toast-store';
  import type { Pipeline, PipelineExecution, PipelineProgress } from '$lib/types/automation';
  import Icon from '@iconify/svelte';

  const props = $props<{
    projectId: number;
    projectName: string;
    projectPath: string;
    projectFramework?: string | null;
    projectNamespace?: string;
  }>();

  const projectId = $derived(props.projectId);
  const projectName = $derived(props.projectName);
  const projectPath = $derived(props.projectPath);
  const projectFramework = $derived(props.projectFramework ?? null);
  const projectNamespace = $derived(props.projectNamespace ?? 'default');

  // State
  let availablePipelines = $state<Pipeline[]>([]);
  let selectedPipeline = $state<Pipeline | null>(null);
  let showExecutionModal = $state(false);
  let showProgressModal = $state(false);
  let currentExecution = $state<PipelineExecution | null>(null);
  let variableValues = $state<Record<string, any>>({});
  let isLoading = $state(false);

  // Progress tracking
  let progress = $state<PipelineProgress | null>(null);
  let progressInterval: ReturnType<typeof setInterval> | null = null;

  onMount(async () => {
    await loadPipelines();
  });

  async function loadPipelines() {
    try {
      isLoading = true;
      await automationActions.loadPipelines();
      
      // Filter pipelines by framework if specified
      if (projectFramework) {
        availablePipelines = $pipelines.filter(p => 
          !p.framework || p.framework === projectFramework
        );
      } else {
        availablePipelines = $pipelines;
      }
    } catch (error) {
      console.error('Failed to load pipelines:', error);
      toastStore.error('Failed to load pipelines');
    } finally {
      isLoading = false;
    }
  }

  function openExecutionModal(pipeline: Pipeline) {
    selectedPipeline = pipeline;
    showExecutionModal = true;
    
    // Initialize variable values with defaults
    variableValues = {};
    pipeline.variables.forEach(variable => {
      if (variable.defaultValue !== undefined) {
        variableValues[variable.name] = variable.defaultValue;
      }
    });
  }

  async function executePipeline() {
    if (!selectedPipeline) return;

    try {
      isLoading = true;
      
      // Add runtime variables
      const executionVariables = {
        ...variableValues,
        PROJECT_NAME: projectName,
        PROJECT_PATH: projectPath,
        PROJECT_NAMESPACE: projectNamespace,
        PROJECT_FRAMEWORK: projectFramework || '',
        USER_HOME: process.env.HOME || process.env.USERPROFILE || '',
        CURRENT_TIMESTAMP: new Date().toISOString()
      };

      const execution = await automationActions.executePipeline(
        selectedPipeline.id,
        projectId,
        executionVariables
      );

      currentExecution = execution;
      showExecutionModal = false;
      showProgressModal = true;

      // Start progress monitoring
      startProgressMonitoring(execution.id);

      toastStore.success(`Pipeline "${selectedPipeline.name}" started successfully`);
    } catch (error) {
      console.error('Failed to execute pipeline:', error);
      toastStore.error('Failed to execute pipeline');
    } finally {
      isLoading = false;
    }
  }

  function startProgressMonitoring(executionId: string) {
    // Clear any existing interval
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    // Update progress immediately
    updateProgress(executionId);

    // Set up interval for progress updates
    progressInterval = setInterval(() => {
      updateProgress(executionId);
    }, 1000);
  }

  async function updateProgress(executionId: string) {
    try {
      const currentProgress = $activeExecutions.get(executionId);
      if (currentProgress) {
        progress = currentProgress;
        
        // Stop monitoring if execution is complete
        if (currentProgress.status === 'completed' || 
            currentProgress.status === 'failed' || 
            currentProgress.status === 'cancelled') {
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
        }
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }

  async function cancelExecution() {
    if (!currentExecution) return;

    try {
      await automationActions.cancelExecution(currentExecution.id);
      toastStore.success('Pipeline execution cancelled');
      
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      toastStore.error('Failed to cancel execution');
    }
  }

  function closeProgressModal() {
    showProgressModal = false;
    currentExecution = null;
    progress = null;
    
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'running': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'mdi:clock-outline';
      case 'running': return 'mdi:play-circle';
      case 'completed': return 'mdi:check-circle';
      case 'failed': return 'mdi:close-circle';
      case 'cancelled': return 'mdi:cancel';
      default: return 'mdi:help-circle';
    }
  }

  function formatDuration(duration?: number): string {
    if (!duration) return '0s';
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
</script>

<div class="pipeline-executor">
  <div class="executor-header">
    <h3>Automation Pipelines</h3>
    <Button variant="outline" size="sm" on:click={loadPipelines} disabled={isLoading}>
      <Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
      Refresh
    </Button>
  </div>

  {#if isLoading && availablePipelines.length === 0}
    <div class="loading-state">
      <Icon icon="mdi:loading" class="w-6 h-6 animate-spin" />
      <span>Loading pipelines...</span>
    </div>
  {:else if availablePipelines.length === 0}
    <div class="empty-state">
      <Icon icon="mdi:playlist-remove" class="w-12 h-12 text-gray-400" />
      <h4>No pipelines available</h4>
      <p>No automation pipelines are configured for this project framework.</p>
      <Button variant="outline" on:click={() => window.location.href = '/settings'}>
        <Icon icon="mdi:cog" class="w-4 h-4 mr-2" />
        Go to Settings
      </Button>
    </div>
  {:else}
    <div class="pipelines-grid">
      {#each availablePipelines as pipeline}
        <div class="pipeline-card">
          <div class="pipeline-header">
            <div class="pipeline-info">
              <h4>{pipeline.name}</h4>
              <p class="pipeline-description">{pipeline.description || 'No description'}</p>
            </div>
            <div class="pipeline-meta">
              <span class="version">v{pipeline.version}</span>
              {#if pipeline.framework}
                <span class="framework">{pipeline.framework}</span>
              {/if}
            </div>
          </div>
          
          <div class="pipeline-details">
            <div class="detail-item">
              <Icon icon="mdi:format-list-bulleted" class="w-4 h-4" />
              <span>{pipeline.steps.length} steps</span>
            </div>
            <div class="detail-item">
              <Icon icon="mdi:variable" class="w-4 h-4" />
              <span>{pipeline.variables.length} variables</span>
            </div>
            {#if pipeline.metadata?.category}
              <div class="detail-item">
                <Icon icon="mdi:tag" class="w-4 h-4" />
                <span>{pipeline.metadata.category}</span>
              </div>
            {/if}
          </div>

          {#if pipeline.tags && pipeline.tags.length > 0}
            <div class="pipeline-tags">
              {#each pipeline.tags.slice(0, 3) as tag}
                <span class="tag">{tag}</span>
              {/each}
              {#if pipeline.tags.length > 3}
                <span class="tag-more">+{pipeline.tags.length - 3}</span>
              {/if}
            </div>
          {/if}

          <div class="pipeline-actions">
            <Button on:click={() => openExecutionModal(pipeline)}>
              <Icon icon="mdi:play" class="w-4 h-4 mr-2" />
              Run Pipeline
            </Button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Execution Modal -->
  {#if showExecutionModal && selectedPipeline}
    <div class="modal-overlay" on:click={() => showExecutionModal = false}>
      <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
          <h3>Run Pipeline: {selectedPipeline.name}</h3>
          <button class="modal-close" on:click={() => showExecutionModal = false}>
            <Icon icon="mdi:close" class="w-5 h-5" />
          </button>
        </div>

        <div class="modal-body">
          <p class="pipeline-description">{selectedPipeline.description}</p>
          
          {#if selectedPipeline.variables.length > 0}
            <div class="variables-section">
              <h4>Pipeline Variables</h4>
              <div class="variables-list">
                {#each selectedPipeline.variables as variable}
                  <div class="variable-item">
                    <label for={variable.name}>
                      {variable.name}
                      {#if variable.required}
                        <span class="required">*</span>
                      {/if}
                    </label>
                    {#if variable.description}
                      <p class="variable-description">{variable.description}</p>
                    {/if}
                    
                    {#if variable.type === 'boolean'}
                      <label class="checkbox-label">
                        <input
                          type="checkbox"
                          bind:checked={variableValues[variable.name]}
                        />
                        {variable.name}
                      </label>
                    {:else if variable.type === 'select' && variable.options}
                      <select
                        id={variable.name}
                        bind:value={variableValues[variable.name]}
                        class="form-select"
                        required={variable.required}
                      >
                        <option value="">Select {variable.name}</option>
                        {#each variable.options as option}
                          <option value={option}>{option}</option>
                        {/each}
                      </select>
                    {:else if variable.type === 'number'}
                      <input
                        type="number"
                        id={variable.name}
                        bind:value={variableValues[variable.name]}
                        placeholder={variable.defaultValue?.toString() || `Enter ${variable.name}`}
                        class="form-input"
                        required={variable.required}
                      />
                    {:else}
                      <input
                        type="text"
                        id={variable.name}
                        bind:value={variableValues[variable.name]}
                        placeholder={variable.defaultValue?.toString() || `Enter ${variable.name}`}
                        class="form-input"
                        required={variable.required}
                      />
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <p class="no-variables">This pipeline has no configurable variables.</p>
          {/if}

          <div class="runtime-variables">
            <h4>Runtime Variables</h4>
            <p class="runtime-info">These variables will be automatically provided:</p>
            <div class="runtime-list">
              <div class="runtime-item">
                <span class="variable-name">PROJECT_NAME</span>
                <span class="variable-value">{projectName}</span>
              </div>
              <div class="runtime-item">
                <span class="variable-name">PROJECT_PATH</span>
                <span class="variable-value">{projectPath}</span>
              </div>
              <div class="runtime-item">
                <span class="variable-name">PROJECT_NAMESPACE</span>
                <span class="variable-value">{projectNamespace}</span>
              </div>
              {#if projectFramework}
                <div class="runtime-item">
                  <span class="variable-name">PROJECT_FRAMEWORK</span>
                  <span class="variable-value">{projectFramework}</span>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <Button variant="outline" on:click={() => showExecutionModal = false}>
            Cancel
          </Button>
          <Button on:click={executePipeline} disabled={isLoading}>
            <Icon icon="mdi:play" class="w-4 h-4 mr-2" />
            {isLoading ? 'Starting...' : 'Run Pipeline'}
          </Button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Progress Modal -->
  {#if showProgressModal && currentExecution && progress}
    <div class="modal-overlay">
      <div class="modal-content progress-modal" on:click|stopPropagation>
        <div class="modal-header">
          <h3>Pipeline Execution Progress</h3>
          <button class="modal-close" on:click={closeProgressModal}>
            <Icon icon="mdi:close" class="w-5 h-5" />
          </button>
        </div>

        <div class="modal-body">
          <div class="execution-info">
            <div class="execution-header">
              <Icon icon={getStatusIcon(progress.status)} class="w-6 h-6 {getStatusColor(progress.status)}" />
              <div class="execution-details">
                <h4>{selectedPipeline?.name}</h4>
                <p class="execution-status {getStatusColor(progress.status)}">
                  {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
                </p>
              </div>
            </div>

            <div class="progress-bar">
              <div class="progress-fill" style="width: {progress.progress}%"></div>
            </div>
            <p class="progress-text">{progress.progress}% complete ({progress.completedSteps}/{progress.totalSteps} steps)</p>

            {#if progress.estimatedTimeRemaining}
              <p class="eta">Estimated time remaining: {formatDuration(progress.estimatedTimeRemaining * 1000)}</p>
            {/if}
          </div>

          <div class="steps-progress">
            <h4>Step Progress</h4>
            <div class="steps-list">
              {#each progress.steps as step}
                <div class="step-item">
                  <div class="step-header">
                    <Icon icon={getStatusIcon(step.status)} class="w-4 h-4 {getStatusColor(step.status)}" />
                    <span class="step-name">{step.name}</span>
                    {#if step.duration}
                      <span class="step-duration">{formatDuration(step.duration)}</span>
                    {/if}
                  </div>
                  {#if step.message}
                    <p class="step-message">{step.message}</p>
                  {/if}
                  {#if step.progress !== undefined}
                    <div class="step-progress-bar">
                      <div class="step-progress-fill" style="width: {step.progress}%"></div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          {#if progress.status === 'running'}
            <Button variant="outline" on:click={cancelExecution}>
              <Icon icon="mdi:cancel" class="w-4 h-4 mr-2" />
              Cancel Execution
            </Button>
          {:else}
            <Button on:click={closeProgressModal}>
              Close
            </Button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .pipeline-executor {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .executor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .executor-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
  }

  .loading-state {
    gap: 1rem;
  }

  .empty-state {
    gap: 1rem;
  }

  .empty-state h4 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
  }

  .empty-state p {
    margin: 0;
    color: #6b7280;
  }

  .pipelines-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    padding: 1.5rem;
  }

  .pipeline-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
    background: #f9fafb;
    transition: all 0.2s ease;
  }

  .pipeline-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  }

  .pipeline-header {
    margin-bottom: 1rem;
  }

  .pipeline-info h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
  }

  .pipeline-description {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .pipeline-meta {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .version,
  .framework {
    background: #e5e7eb;
    color: #374151;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .pipeline-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .pipeline-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .tag {
    background: #dbeafe;
    color: #1e40af;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .tag-more {
    background: #f3f4f6;
    color: #6b7280;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .pipeline-actions {
    display: flex;
    justify-content: flex-end;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .progress-modal {
    max-width: 800px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .modal-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    color: #6b7280;
  }

  .modal-close:hover {
    background: #f3f4f6;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .variables-section {
    margin-bottom: 2rem;
  }

  .variables-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .variables-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .variable-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .variable-item label {
    font-weight: 500;
    color: #374151;
  }

  .required {
    color: #dc2626;
  }

  .variable-description {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    margin: 0;
  }

  .no-variables {
    text-align: center;
    color: #6b7280;
    font-style: italic;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 6px;
  }

  .runtime-variables {
    margin-top: 2rem;
  }

  .runtime-variables h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .runtime-info {
    margin: 0 0 1rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .runtime-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .runtime-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    background: #f9fafb;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .variable-name {
    font-weight: 500;
    color: #374151;
  }

  .variable-value {
    color: #6b7280;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  /* Progress Styles */
  .execution-info {
    margin-bottom: 2rem;
  }

  .execution-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .execution-details h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .execution-status {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: #3b82f6;
    transition: width 0.3s ease;
  }

  .progress-text {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .eta {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .steps-progress h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .step-item {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
    background: #f9fafb;
  }

  .step-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .step-name {
    font-weight: 500;
    color: #374151;
    flex: 1;
  }

  .step-duration {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .step-message {
    margin: 0 0 0.5rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .step-progress-bar {
    width: 100%;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
  }

  .step-progress-fill {
    height: 100%;
    background: #10b981;
    transition: width 0.3s ease;
  }

  /* Status Colors */
  .text-yellow-600 { color: #d97706; }
  .text-blue-600 { color: #2563eb; }
  .text-green-600 { color: #059669; }
  .text-red-600 { color: #dc2626; }
  .text-gray-600 { color: #4b5563; }

  /* Animation */
  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
