<script lang="ts">
  import { onMount } from 'svelte';
  import { logger } from '$lib/utils/logger';
  import { ideSettingsAPI, type IdeConfig, type FrameworkIdeMapping } from '$lib/api/ide-settings';
  import { toastStore } from '$lib/stores/toast-store';
  import { SettingsSection, SettingsModal } from '$lib/components/ui/settings/index.js';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { LoadingState, EmptyState } from '$lib/components/ui/display/index.js';
  import { Input } from '$lib/components/ui/form/index.js';
  import Button from '$lib/components/ui/button.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  // Framework IDE mapping data
  let frameworkIdeMappings = $state<FrameworkIdeMapping[]>([]);
  let isLoading = $state(false);
  let ides = $state<IdeConfig[]>([]);
  let installedIdes = $state<string[]>([]);

  // Modal state
  let showAddFrameworkMappingModal = $state(false);
  let editingFrameworkMapping = $state<FrameworkIdeMapping | null>(null);
  let newFrameworkMappingFramework = $state("");
  let newFrameworkMappingIdeId = $state<number | null>(null);

  onMount(async () => {
    await loadFrameworkIdeMappingsData();
    await loadIdesData();
  });

  async function loadFrameworkIdeMappingsData() {
    try {
      isLoading = true;
      frameworkIdeMappings = await ideSettingsAPI.getAllFrameworkIdeMappings();
    } catch (error) {
      logger.error('Failed to load framework IDE mappings:', error);
      frameworkIdeMappings = [];
    } finally {
      isLoading = false;
    }
  }

  async function loadIdesData() {
    try {
      ides = await ideSettingsAPI.getAllIdes();
    } catch (error) {
      logger.error('Failed to load IDEs:', error);
      ides = [];
    }
  }

  function openAddFrameworkMappingModal() {
    logger.info('🔧 [DEBUG] Opening add framework mapping modal');
    showAddFrameworkMappingModal = true;
    newFrameworkMappingFramework = "";
    newFrameworkMappingIdeId = null;
    editingFrameworkMapping = null;
  }

  function openEditFrameworkMappingModal(mapping: FrameworkIdeMapping) {
    showAddFrameworkMappingModal = true;
    editingFrameworkMapping = mapping;
    newFrameworkMappingFramework = mapping.framework;
    newFrameworkMappingIdeId = mapping.ide_id;
  }

  async function saveFrameworkMapping() {
    logger.info('🔧 [DEBUG] saveFrameworkMapping called');
    logger.info('🔧 [DEBUG] Current form values:', {
      framework: newFrameworkMappingFramework,
      ideId: newFrameworkMappingIdeId,
      ideIdType: typeof newFrameworkMappingIdeId,
      frameworkTrimmed: newFrameworkMappingFramework.trim()
    });
    
    try {
      if (!newFrameworkMappingFramework.trim() || !newFrameworkMappingIdeId) {
        logger.warn('⚠️ [DEBUG] Validation failed - missing fields');
        toastStore.error('Please fill in all fields');
        return;
      }

      logger.info('✅ [DEBUG] Validation passed, proceeding with save');

      if (editingFrameworkMapping) {
        logger.info('🔧 [DEBUG] Editing existing mapping, deleting old one first');
        await ideSettingsAPI.deleteFrameworkIdeMapping(editingFrameworkMapping.framework);
      }
      
      logger.info('🔧 [DEBUG] Calling setFrameworkIdeMapping...');
      await ideSettingsAPI.setFrameworkIdeMapping(newFrameworkMappingFramework, newFrameworkMappingIdeId);
      logger.info('✅ [DEBUG] Framework mapping saved successfully');
      
      showAddFrameworkMappingModal = false;
      await loadFrameworkIdeMappingsData();
      toastStore.success(`Framework mapping for "${newFrameworkMappingFramework}" saved successfully`);
    } catch (error) {
      logger.error('❌ [DEBUG] Failed to save framework mapping:', error);
      toastStore.error(`Failed to save framework mapping: ${error}`);
    }
  }

  function handleCancel() {
    showAddFrameworkMappingModal = false;
    editingFrameworkMapping = null;
    newFrameworkMappingFramework = "";
    newFrameworkMappingIdeId = null;
  }

  async function deleteFrameworkMapping(framework: string) {
    if (confirm('Are you sure you want to delete this framework IDE mapping?')) {
      try {
        await ideSettingsAPI.deleteFrameworkIdeMapping(framework);
        await loadFrameworkIdeMappingsData();
        toastStore.success('Framework mapping deleted successfully');
      } catch (error) {
        logger.error('Failed to delete framework mapping:', error);
        toastStore.error(`Failed to delete framework mapping: ${error}`);
      }
    }
  }

  function getFrameworkIcon(framework: string): string {
    const iconMap: Record<string, string> = {
      'React': '⚛️',
      'Vue.js': '💚',
      'Angular': '🔴',
      'Node.js': '🟢',
      'Python': '🐍',
      'Java': '☕',
      'Maven': '🍃',
      'Gradle': '🟢',
      'Go': '🔵',
      'Rust': '🦀',
      'PHP': '🐘',
      'Ruby': '💎',
      'Swift': '🍎',
      'Flutter': '🦋',
      'Docker': '🐳',
      'Kubernetes': '☸️',
      'Svelte': '🟠',
      'Next.js': '⚡',
      'Nuxt.js': '🟢',
      'Vite': '⚡',
      'Webpack': '📦',
      'Rollup': '📦',
      '.NET': '🟣',
      'Terraform': '🟠',
      'Ansible': '🔴',
      'Make': '🔧',
      'CMake': '🔧',
      'Tauri': '🦀'
    };
    return iconMap[framework] || '📁';
  }

  function getIdeIcon(executable: string): string {
    const iconMap: Record<string, string> = {
      'code': '💻',
      'idea': '🟡',
      'webstorm': '🟠',
      'pycharm': '🟢',
      'goland': '🔵',
      'clion': '🟣',
      'rider': '🟤',
      'phpstorm': '🟡',
      'studio': '🟢',
      'subl': '🟠',
      'vim': '🟢',
      'nvim': '🟢',
      'emacs': '🟣',
      'atom': '🔵',
      'brackets': '🟢',
      'notepad++': '🔵',
      'gedit': '🟢',
      'kate': '🟣',
      'mousepad': '🟢'
    };
    return iconMap[executable] || '💻';
  }

  function isIdeInstalled(executable: string): boolean {
    return installedIdes.includes(executable);
  }

  // Get available IDEs for dropdown
  let availableIdes = $derived(ides.filter(ide => 
    installedIdes.length === 0 || isIdeInstalled(ide.executable)
  ));

  function handleRefresh() {
    loadFrameworkIdeMappingsData();
  }
</script>

<SettingsSection 
  title="Framework IDE Mappings"
  description="Set default IDEs for specific frameworks. When you open a project, it will automatically use the appropriate IDE based on the detected framework."
  icon="🔧"
>
  <!-- Info Alert -->
  <div class="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
    <p class="text-sm text-blue-800 dark:text-blue-200">
      <strong>Note:</strong> Only configured and available IDEs will be shown in the mapping options. Make sure to add and configure your IDEs in the IDE Settings section first.
    </p>
  </div>

  <!-- Framework IDE Mappings Section -->
  <Card>
    <CardHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">
            Framework IDE Mappings
          </CardTitle>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure which IDE to use for each framework type
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <ActionButton 
            action="refresh"
            onclick={() => handleRefresh()}
            loading={isLoading}
          />
          <ActionButton 
            action="add"
            label="Add Mapping"
            onclick={() => openAddFrameworkMappingModal()}
          />
        </div>
      </div>
    </CardHeader>

    <CardContent className="p-6">
      {#if isLoading}
        <LoadingState message="Loading framework mappings..." />
      {:else if frameworkIdeMappings.length === 0}
        <EmptyState 
          title="No framework IDE mappings configured"
          description="Add your first mapping to automatically open projects with the right IDE."
          icon="🔧"
          showAction={true}
          actionLabel="Add Your First Mapping"
          onaction={() => openAddFrameworkMappingModal()}
        />
      {:else}
        <div class="space-y-3">
          {#each frameworkIdeMappings as mapping}
            {@const ide = ides.find(i => i.id === mapping.ide_id)}
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                  <span class="text-lg">{getFrameworkIcon(mapping.framework)}</span>
                  <span class="font-medium text-slate-900 dark:text-white">
                    {mapping.framework}
                  </span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-slate-400">→</span>
                  <span class="text-lg">{getIdeIcon(ide?.executable || '')}</span>
                  <span class="font-medium text-slate-900 dark:text-white">
                    {ide?.name || 'Unknown IDE'}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center space-x-1">
                <button
                  class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  onclick={() => openEditFrameworkMappingModal(mapping)}
                  title="Edit Mapping"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button
                  class="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  onclick={() => deleteFrameworkMapping(mapping.framework)}
                  title="Delete Mapping"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
</SettingsSection>

<!-- Add/Edit Framework Mapping Modal -->
<SettingsModal 
  isOpen={showAddFrameworkMappingModal}
  title={editingFrameworkMapping ? "Edit Framework Mapping" : "Add Framework Mapping"}
  description="Configure which IDE to use for a specific framework"
  on:close={handleCancel}
>
  <div class="space-y-4">
    <div>
      <label for="framework-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Framework Name
      </label>
      <Input
        id="framework-name"
        type="text"
        placeholder="e.g., React, Node.js, Python"
        value={newFrameworkMappingFramework}
        oninput={(e: Event) => {
          const target = e.target as HTMLInputElement;
          newFrameworkMappingFramework = target.value;
        }}
      />
    </div>
    
    <div>
      <label for="ide-select" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        IDE
      </label>
      <select
        id="ide-select"
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        value={newFrameworkMappingIdeId || ""}
        onchange={(e: Event) => {
          const target = e.target as HTMLSelectElement;
          newFrameworkMappingIdeId = target.value ? parseInt(target.value) : null;
        }}
      >
        <option value="">Select an IDE...</option>
        {#each availableIdes as ide}
          <option value={ide.id}>
            {ide.name} ({ide.executable})
          </option>
        {/each}
      </select>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Choose the IDE to use for this framework
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
      onclick={saveFrameworkMapping}
      disabled={!newFrameworkMappingFramework.trim() || !newFrameworkMappingIdeId || availableIdes.length === 0}
    >
      {editingFrameworkMapping ? 'Update' : 'Add'} Mapping
    </Button>
  </div>
</SettingsModal>
