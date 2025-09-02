<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { automationActions, selectedPipeline } from '$lib/stores/automation-store';
  import { toastStore } from '$lib/stores/toast-store';
  import type { Pipeline, PipelineStep, PipelineVariable } from '$lib/types/automation';
  import Icon from '@iconify/svelte';

  const props = $props<{
    pipeline?: Pipeline | null;
    onSave?: (pipeline: Pipeline) => void;
    onCancel?: () => void;
  }>();

  const pipeline = $derived(props.pipeline ?? null);
  const onSave = $derived(props.onSave ?? (() => {}));
  const onCancel = $derived(props.onCancel ?? (() => {}));

  // Form state
  let name = $state('');
  let description = $state('');
  let version = $state('1.0.0');
  let framework = $state<string | null>(null);
  let category = $state('');
  let tags = $state<string[]>([]);
  let newTag = $state('');

  // Variables
  let variables = $state<PipelineVariable[]>([]);
  let showAddVariable = $state(false);
  let newVariable: PipelineVariable = $state({
    name: '',
    description: '',
    type: 'string',
    required: false
  });

  // Steps
  let steps = $state<PipelineStep[]>([]);
  let showAddStep = $state(false);
  let newStep: PipelineStep = $state({
    id: '',
    name: '',
    type: 'command',
    command: ''
  });

  // Validation
  let validationErrors = $state<string[]>([]);
  let isSaving = $state(false);

  // Available frameworks
  const frameworks = [
    'react', 'vue', 'angular', 'svelte', 'node', 'python', 'java', 'go', 'rust', 'php', 'dotnet'
  ];

  // Available categories
  const categories = [
    'build', 'deploy', 'test', 'lint', 'format', 'security', 'database', 'migration', 'backup', 'monitoring'
  ];

  $effect(() => {
    if (pipeline) {
      // Edit mode
      name = pipeline.name;
      description = pipeline.description || '';
      version = pipeline.version;
      framework = pipeline.framework || null;
      category = pipeline.metadata?.category || '';
      tags = pipeline.tags || [];
      variables = [...pipeline.variables];
      steps = [...pipeline.steps];
    } else {
      // Create mode
      generateStepId();
    }
  });

  function generateStepId() {
    newStep.id = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function addVariable() {
    if (!newVariable.name.trim()) {
      toastStore.error('Variable name is required');
      return;
    }

    if (variables.some(v => v.name === newVariable.name)) {
      toastStore.error('Variable name must be unique');
      return;
    }

    variables = [...variables, { ...newVariable }];
    newVariable = {
      name: '',
      description: '',
      type: 'string',
      required: false
    };
    showAddVariable = false;
  }

  function removeVariable(index: number) {
    variables = variables.filter((_, i) => i !== index);
  }

  function addStep() {
    if (!newStep.name.trim()) {
      toastStore.error('Step name is required');
      return;
    }

    if (!newStep.id.trim()) {
      generateStepId();
    }

    if (steps.some(s => s.id === newStep.id)) {
      toastStore.error('Step ID must be unique');
      return;
    }

    steps = [...steps, { ...newStep }];
    newStep = {
      id: '',
      name: '',
      type: 'command',
      command: ''
    };
    showAddStep = false;
  }

  function removeStep(index: number) {
    steps = steps.filter((_, i) => i !== index);
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index > 0) {
      const newSteps = [...steps];
      [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
      steps = newSteps;
    } else if (direction === 'down' && index < steps.length - 1) {
      const newSteps = [...steps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      steps = newSteps;
    }
  }

  function addTag() {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      tags = [...tags, newTag.trim()];
      newTag = '';
    }
  }

  function removeTag(tag: string) {
    tags = tags.filter(t => t !== tag);
  }

  function validatePipeline(): boolean {
    validationErrors = [];

    if (!name.trim()) {
      validationErrors.push('Pipeline name is required');
    }

    if (!version.trim()) {
      validationErrors.push('Version is required');
    }

    if (steps.length === 0) {
      validationErrors.push('At least one step is required');
    }

    // Validate steps
    steps.forEach((step, index) => {
      if (!step.name.trim()) {
        validationErrors.push(`Step ${index + 1}: Name is required`);
      }

      if (step.type === 'command' && !step.command?.trim()) {
        validationErrors.push(`Step ${index + 1}: Command is required`);
      }

      if (step.type === 'script' && !step.script?.trim()) {
        validationErrors.push(`Step ${index + 1}: Script content is required`);
      }

      // Validate dependencies
      if (step.dependsOn) {
        step.dependsOn.forEach(depId => {
          if (!steps.some(s => s.id === depId)) {
            validationErrors.push(`Step ${index + 1}: Invalid dependency '${depId}'`);
          }
        });
      }
    });

    return validationErrors.length === 0;
  }

  async function savePipeline() {
    if (!validatePipeline()) {
      toastStore.error('Please fix validation errors');
      return;
    }

    try {
      isSaving = true;

      const pipelineData: Pipeline = {
        id: pipeline?.id || `pipeline_${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        version: version.trim(),
        framework: framework || undefined,
        tags,
        variables,
        steps,
        metadata: {
          author: 'Current User', // TODO: Get from user context
          created: pipeline?.metadata?.created || new Date().toISOString(),
          updated: new Date().toISOString(),
          category: category || undefined
        }
      };

      if (pipeline) {
        await automationActions.updatePipeline(pipeline.id, pipelineData);
        toastStore.success('Pipeline updated successfully');
      } else {
        const newPipeline = await automationActions.createPipeline(pipelineData);
        toastStore.success('Pipeline created successfully');
      }

      onSave(pipelineData);
    } catch (error) {
      console.error('Failed to save pipeline:', error);
      toastStore.error('Failed to save pipeline');
    } finally {
      isSaving = false;
    }
  }

  function getStepTypeIcon(type: string): string {
    switch (type) {
      case 'command': return 'mdi:console';
      case 'script': return 'mdi:script-text';
      case 'validation': return 'mdi:check-circle';
      case 'wait': return 'mdi:clock-outline';
      case 'notification': return 'mdi:bell-outline';
      default: return 'mdi:help-circle';
    }
  }

  function getVariableTypeIcon(type: string): string {
    switch (type) {
      case 'string': return 'mdi:format-text';
      case 'number': return 'mdi:numeric';
      case 'boolean': return 'mdi:checkbox-marked';
      case 'select': return 'mdi:format-list-bulleted';
      default: return 'mdi:help-circle';
    }
  }
</script>

<div class="pipeline-editor">
  <div class="editor-header">
    <h2>{pipeline ? 'Edit Pipeline' : 'Create New Pipeline'}</h2>
    <div class="header-actions">
      <Button variant="outline" onclick={onCancel}>
        <Icon icon="mdi:close" class="w-4 h-4 mr-2" />
        Cancel
      </Button>
      <Button onclick={savePipeline} disabled={isSaving}>
        <Icon icon="mdi:content-save" class="w-4 h-4 mr-2" />
        {isSaving ? 'Saving...' : 'Save Pipeline'}
      </Button>
    </div>
  </div>

  {#if validationErrors.length > 0}
    <div class="validation-errors">
      <h3>Validation Errors:</h3>
      <ul>
        {#each validationErrors as error}
          <li class="error">{error}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="editor-content">
    <!-- Basic Information -->
    <div class="section">
      <h3>Basic Information</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="name">Pipeline Name *</label>
          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="Enter pipeline name"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="version">Version *</label>
          <input
            id="version"
            type="text"
            bind:value={version}
            placeholder="1.0.0"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="framework">Framework</label>
          <select id="framework" bind:value={framework} class="form-select">
            <option value={null}>Any Framework</option>
            {#each frameworks as fw}
              <option value={fw}>{fw}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" bind:value={category} class="form-select">
            <option value="">No Category</option>
            {#each categories as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          bind:value={description}
          placeholder="Describe what this pipeline does..."
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="tags-input">Tags</label>
        <div class="tags-input">
          <div class="tags-list">
            {#each tags as tag}
              <span class="tag">
                {tag}
                <Button variant="ghost" size="sm" onclick={() => removeTag(tag)} class="tag-remove">
                  <Icon icon="mdi:close" class="w-3 h-3" />
                </Button>
              </span>
            {/each}
          </div>
          <div class="tag-input">
            <input
              id="tags-input"
              type="text"
              bind:value={newTag}
              placeholder="Add tag..."
              class="form-input"
              onkeydown={(e) => e.key === 'Enter' && addTag()}
            />
            <Button size="sm" onclick={addTag}>
              <Icon icon="mdi:plus" class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Variables -->
    <div class="section">
      <div class="section-header">
        <h3>Variables</h3>
        <Button variant="outline" size="sm" onclick={() => showAddVariable = true}>
          <Icon icon="mdi:plus" class="w-4 h-4 mr-2" />
          Add Variable
        </Button>
      </div>

      {#if variables.length > 0}
        <div class="variables-list">
          {#each variables as variable, index}
            <div class="variable-item">
              <div class="variable-header">
                <Icon icon={getVariableTypeIcon(variable.type)} class="w-4 h-4" />
                <span class="variable-name">{variable.name}</span>
                {#if variable.required}
                  <span class="required-badge">Required</span>
                {/if}
                <Button variant="ghost" size="sm" onclick={() => removeVariable(index)} class="remove-btn">
                  <Icon icon="mdi:delete" class="w-4 h-4" />
                </Button>
              </div>
              {#if variable.description}
                <p class="variable-description">{variable.description}</p>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-state">No variables defined. Variables allow you to make your pipeline configurable.</p>
      {/if}

      {#if showAddVariable}
        <div class="add-variable-modal">
          <h4>Add Variable</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="var-name">Name *</label>
              <input
                id="var-name"
                type="text"
                bind:value={newVariable.name}
                placeholder="Variable name"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="var-type">Type</label>
              <select id="var-type" bind:value={newVariable.type} class="form-select">
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
              </select>
            </div>

            <div class="form-group">
              <label for="var-default">Default Value</label>
              <input
                id="var-default"
                type="text"
                bind:value={newVariable.defaultValue}
                placeholder="Default value"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={newVariable.required} />
                Required
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="var-description">Description</label>
            <textarea
              id="var-description"
              bind:value={newVariable.description}
              placeholder="Describe this variable..."
              class="form-textarea"
              rows="2"
            ></textarea>
          </div>

          <div class="modal-actions">
            <Button variant="outline" onclick={() => showAddVariable = false}>Cancel</Button>
            <Button onclick={addVariable}>Add Variable</Button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Steps -->
    <div class="section">
      <div class="section-header">
        <h3>Steps</h3>
        <Button variant="outline" size="sm" onclick={() => showAddStep = true}>
          <Icon icon="mdi:plus" class="w-4 h-4 mr-2" />
          Add Step
        </Button>
      </div>

      {#if steps.length > 0}
        <div class="steps-list">
          {#each steps as step, index}
            <div class="step-item">
              <div class="step-header">
                <div class="step-info">
                  <Icon icon={getStepTypeIcon(step.type)} class="w-4 h-4" />
                  <span class="step-name">{step.name}</span>
                  <span class="step-type">({step.type})</span>
                </div>
                <div class="step-actions">
                  <Button variant="ghost" size="sm" onclick={() => moveStep(index, 'up')} disabled={index === 0}>
                    <Icon icon="mdi:arrow-up" class="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onclick={() => moveStep(index, 'down')} disabled={index === steps.length - 1}>
                    <Icon icon="mdi:arrow-down" class="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onclick={() => removeStep(index)}>
                    <Icon icon="mdi:delete" class="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {#if step.description}
                <p class="step-description">{step.description}</p>
              {/if}
              {#if step.command}
                <div class="step-command">
                  <code>{step.command}</code>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-state">No steps defined. Steps are the actions your pipeline will perform.</p>
      {/if}

      {#if showAddStep}
        <div class="add-step-modal">
          <h4>Add Step</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="step-name">Name *</label>
              <input
                id="step-name"
                type="text"
                bind:value={newStep.name}
                placeholder="Step name"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="step-type">Type</label>
              <select id="step-type" bind:value={newStep.type} class="form-select">
                <option value="command">Command</option>
                <option value="script">Script</option>
                <option value="validation">Validation</option>
                <option value="wait">Wait</option>
                <option value="notification">Notification</option>
              </select>
            </div>

            <div class="form-group">
              <label for="step-id">ID</label>
              <input
                id="step-id"
                type="text"
                bind:value={newStep.id}
                placeholder="Auto-generated if empty"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="step-timeout">Timeout (seconds)</label>
              <input
                id="step-timeout"
                type="number"
                bind:value={newStep.timeout}
                placeholder="No timeout"
                class="form-input"
              />
            </div>
          </div>

          {#if newStep.type === 'command'}
            <div class="form-group">
              <label for="step-command">Command *</label>
              <textarea
                id="step-command"
                bind:value={newStep.command}
                placeholder="Enter command to execute..."
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>
          {/if}

          {#if newStep.type === 'script'}
            <div class="form-group">
              <label for="step-script-type">Script Type</label>
              <select id="step-script-type" bind:value={newStep.scriptType} class="form-select">
                <option value="bash">Bash</option>
                <option value="python">Python</option>
                <option value="node">Node.js</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div class="form-group">
              <label for="step-script">Script Content *</label>
              <textarea
                id="step-script"
                bind:value={newStep.script}
                placeholder="Enter script content..."
                class="form-textarea"
                rows="6"
              ></textarea>
            </div>
          {/if}

          <div class="form-group">
            <label for="step-description">Description</label>
            <textarea
              id="step-description"
              bind:value={newStep.description}
              placeholder="Describe what this step does..."
              class="form-textarea"
              rows="2"
            ></textarea>
          </div>

          <div class="modal-actions">
            <Button variant="outline" onclick={() => showAddStep = false}>Cancel</Button>
            <Button onclick={addStep}>Add Step</Button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .pipeline-editor {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .editor-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .validation-errors {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 1rem;
    margin: 1rem;
  }

  .validation-errors h3 {
    margin: 0 0 0.5rem 0;
    color: #dc2626;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .validation-errors ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .validation-errors .error {
    color: #dc2626;
    font-size: 0.875rem;
  }

  .editor-content {
    padding: 1.5rem;
  }

  .section {
    margin-bottom: 2rem;
  }

  .section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .tags-input {
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 0.5rem;
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    background: #e5e7eb;
    color: #374151;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .tag-remove {
    margin-left: 0.25rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
  }

  .tag-remove:hover {
    color: #dc2626;
  }

  .tag-input {
    display: flex;
    gap: 0.5rem;
  }

  .variables-list,
  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .variable-item,
  .step-item {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
    background: #f9fafb;
  }

  .variable-header,
  .step-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .variable-name,
  .step-name {
    font-weight: 500;
    color: #374151;
  }

  .step-type {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .required-badge {
    background: #dc2626;
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .variable-description,
  .step-description {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .step-command {
    margin-top: 0.5rem;
    background: #1f2937;
    color: #f9fafb;
    padding: 0.5rem;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
  }

  .step-actions {
    display: flex;
    gap: 0.25rem;
    margin-left: auto;
  }

  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 0.25rem;
    border-radius: 4px;
  }

  .remove-btn:hover {
    background: #f3f4f6;
    color: #dc2626;
  }

  .empty-state {
    text-align: center;
    color: #6b7280;
    font-style: italic;
    padding: 2rem;
    background: #f9fafb;
    border-radius: 6px;
  }

  .add-variable-modal,
  .add-step-modal {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1.5rem;
    background: #f9fafb;
    margin-top: 1rem;
  }

  .add-variable-modal h4,
  .add-step-modal h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
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
</style>
