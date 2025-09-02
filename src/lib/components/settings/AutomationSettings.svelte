<script lang="ts">
  import { onMount } from 'svelte';
  import { logger } from '$lib/utils/logger';
  import { automationActions, pipelines, isLoadingPipelines, pipelineError } from '$lib/stores/automation-store';
  import { automationAPI } from '$lib/api/automation';
  import type { Pipeline } from '$lib/types/automation';
  import { toastStore } from '$lib/stores/toast-store';
  import { SettingsSection, SettingsModal } from '$lib/components/ui/settings/index.js';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { LoadingState, EmptyState } from '$lib/components/ui/display/index.js';
  import { Input } from '$lib/components/ui/form/index.js';
  import Button from '$lib/components/ui/button.svelte';
  import { Badge } from '$lib/components/ui/feedback/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  // Modal state
  let showPipelineEditor = $state(false);
  let editingPipeline = $state<Pipeline | null>(null);
  let showYamlImportModal = $state(false);
  let yamlContent = $state('');

  onMount(async () => {
    await loadAutomationData();
  });

  async function loadAutomationData() {
    try {
      await automationActions.loadPipelines();
    } catch (error) {
      logger.error('Failed to load automation data:', error);
    }
  }

  async function deletePipeline(pipelineId: string) {
    if (confirm('Are you sure you want to delete this pipeline? This action cannot be undone.')) {
      try {
        await automationActions.deletePipeline(pipelineId);
        toastStore.success('Pipeline deleted successfully');
      } catch (error) {
        logger.error('Failed to delete pipeline:', error);
        toastStore.error('Failed to delete pipeline');
      }
    }
  }

  function handlePipelineSave(pipeline: Pipeline) {
    showPipelineEditor = false;
    editingPipeline = null;
    toastStore.success(`Pipeline "${pipeline.name}" saved successfully`);
  }

  function handlePipelineCancel() {
    showPipelineEditor = false;
    editingPipeline = null;
  }

  async function importYamlPipeline() {
    if (!yamlContent.trim()) {
      toastStore.error('Please enter YAML content');
      return;
    }

    try {
      const pipeline = await automationAPI.importPipeline(yamlContent);
      await automationActions.createPipeline(pipeline);
      showYamlImportModal = false;
      yamlContent = '';
      toastStore.success('Pipeline imported successfully');
    } catch (error) {
      logger.error('Failed to import pipeline:', error);
      toastStore.error('Failed to import pipeline: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  function handleCancel() {
    showYamlImportModal = false;
    yamlContent = '';
  }

  function openCreatePipeline() {
    editingPipeline = null;
    showPipelineEditor = true;
  }

  function openEditPipeline(pipeline: Pipeline) {
    editingPipeline = pipeline;
    showPipelineEditor = true;
  }

  function openYamlImport() {
    showYamlImportModal = true;
  }

  function handleRefresh() {
    loadAutomationData();
  }
</script>

<SettingsSection 
  title="Automation Pipelines"
  description="Create and manage automation pipelines for your projects"
  icon="🤖"
>
  <!-- Pipeline Management -->
  <Card>
    <CardHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">
            Pipeline Management
          </CardTitle>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, edit, and manage automation pipelines
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <ActionButton 
            action="refresh"
            onclick={() => handleRefresh()}
            loading={$isLoadingPipelines}
          />
          <ActionButton 
            action="add"
            label="Create Pipeline"
            onclick={() => openCreatePipeline()}
          />
          <ActionButton 
            action="import"
            label="Import YAML"
            onclick={() => openYamlImport()}
          />
        </div>
      </div>
    </CardHeader>

    <CardContent className="p-6">
      {#if isLoadingPipelines}
        <LoadingState message="Loading pipelines..." />
      {:else if pipelineError}
        <div class="text-center py-12">
          <div class="text-red-400 dark:text-red-500 mb-4">
            <svg class="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <p class="text-red-500 dark:text-red-400 mb-4">Failed to load pipelines</p>
          <Button onclick={loadAutomationData}>
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Retry
          </Button>
        </div>
      {:else if $pipelines.length === 0}
        <EmptyState 
          title="No automation pipelines configured"
          description="Create your first pipeline to automate your development workflow."
          icon="🤖"
          showAction={true}
          actionLabel="Create Your First Pipeline"
          onaction={() => openCreatePipeline()}
        />
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each $pipelines as pipeline}
            <Card className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h4 class="font-medium text-slate-900 dark:text-white">{pipeline.name}</h4>
                    <p class="text-sm text-slate-500 dark:text-slate-400">{pipeline.description || 'No description'}</p>
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      class="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      onclick={() => openEditPipeline(pipeline)}
                      title="Edit Pipeline"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button
                      class="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      onclick={() => deletePipeline(pipeline.id)}
                      title="Delete Pipeline"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span>v{pipeline.version}</span>
                  {#if pipeline.framework}
                    <span>•</span>
                    <span>{pipeline.framework}</span>
                  {/if}
                  {#if pipeline.metadata?.category}
                    <span>•</span>
                    <span>{pipeline.metadata.category}</span>
                  {/if}
                </div>

                <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>{pipeline.steps.length} steps</span>
                  <span>{pipeline.variables.length} variables</span>
                </div>

                {#if pipeline.tags && pipeline.tags.length > 0}
                  <div class="flex flex-wrap gap-1 mt-3">
                    {#each pipeline.tags.slice(0, 3) as tag}
                      <Badge variant="secondary" size="sm">
                        {tag}
                      </Badge>
                    {/each}
                    {#if pipeline.tags.length > 3}
                      <Badge variant="outline" size="sm">
                        +{pipeline.tags.length - 3}
                      </Badge>
                    {/if}
                  </div>
                {/if}
              </CardContent>
            </Card>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
</SettingsSection>

<!-- Pipeline Editor Modal -->
{#if showPipelineEditor}
  <SettingsModal 
    isOpen={showPipelineEditor}
    title={editingPipeline ? "Edit Pipeline" : "Create Pipeline"}
    description="Configure automation pipeline settings"
    size="xl"
    on:close={handlePipelineCancel}
  >
    <!-- Pipeline Editor Component would go here -->
    <div class="p-4">
      <p class="text-slate-600 dark:text-slate-400">
        Pipeline editor component would be integrated here.
      </p>
      <div class="flex items-center justify-end space-x-3 pt-4">
        <Button 
          variant="outline"
          onclick={handlePipelineCancel}
        >
          Cancel
        </Button>
        <Button 
          onclick={() => {
            // Mock save for now
            handlePipelineSave({ id: 'mock', name: 'Test Pipeline' } as Pipeline);
          }}
        >
          Save Pipeline
        </Button>
      </div>
    </div>
  </SettingsModal>
{/if}

<!-- YAML Import Modal -->
<SettingsModal 
  isOpen={showYamlImportModal}
  title="Import Pipeline from YAML"
  description="Paste your pipeline YAML configuration to import it"
  size="lg"
  on:close={handleCancel}
>
  <div class="space-y-4">
    <div>
      <label for="yaml-content" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        YAML Content
      </label>
      <textarea
        id="yaml-content"
        rows="12"
        placeholder="Paste your pipeline YAML here..."
        value={yamlContent}
        oninput={(e: Event) => {
          const target = e.target as HTMLTextAreaElement;
          yamlContent = target.value;
        }}
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
      ></textarea>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Paste a valid pipeline YAML configuration to import it into your automation settings.
      </p>
    </div>
  </div>

  <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
    <Button 
      variant="outline"
      onclick={handleCancel}
    >
      Cancel
    </Button>
    <Button 
      onclick={importYamlPipeline}
      disabled={!yamlContent.trim()}
    >
      Import Pipeline
    </Button>
  </div>
</SettingsModal>
