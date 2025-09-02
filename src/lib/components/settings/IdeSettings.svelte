<script lang="ts">
  import { onMount } from 'svelte';
  import { logger } from '$lib/utils/logger';
  import { ideSettingsAPI, type IdeConfig } from '$lib/api/ide-settings';
  import { toastStore } from '$lib/stores/toast-store';
  import { SettingsSection, SettingsModal } from '$lib/components/ui/settings/index.js';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { LoadingState, EmptyState } from '$lib/components/ui/display/index.js';
  import { Input } from '$lib/components/ui/form/index.js';
  import Button from '$lib/components/ui/button.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  // IDE data
  let ides = $state<IdeConfig[]>([]);
  let isLoading = $state(false);
  let installedIdes = $state<string[]>([]);
  let isDetectingIdes = $state(false);

  // Modal state
  let showAddIdeModal = $state(false);
  let editingIde = $state<IdeConfig | null>(null);
  let newIdeName = $state("");
  let newIdeExecutable = $state("");

  // Computed sorted IDEs
  let sortedIdes = $derived(ides.sort((a, b) => {
    // Default IDE first
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    // Then by name
    return a.name.localeCompare(b.name);
  }));

  onMount(async () => {
    await loadIdesData();
  });

  async function loadIdesData() {
    try {
      isLoading = true;
      logger.info('🔧 [DEBUG] Loading IDEs...');
      ides = await ideSettingsAPI.getAllIdes();
      logger.info('✅ [DEBUG] Loaded IDEs:', ides);
    } catch (error) {
      logger.error('❌ [DEBUG] Failed to load IDEs:', error);
      ides = [];
    } finally {
      isLoading = false;
    }
  }

  async function detectInstalledIdes() {
    try {
      isDetectingIdes = true;
      installedIdes = await ideSettingsAPI.detectInstalledIdes();
    } catch (error) {
      logger.error('Failed to detect IDEs:', error);
      installedIdes = [];
    } finally {
      isDetectingIdes = false;
    }
  }

  function openAddIdeModal() {
    showAddIdeModal = true;
    newIdeName = "";
    newIdeExecutable = "";
    editingIde = null;
  }

  function openEditIdeModal(ide: IdeConfig) {
    showAddIdeModal = true;
    editingIde = ide;
    newIdeName = ide.name;
    newIdeExecutable = ide.executable;
  }

  async function saveIde() {
    try {
      if (editingIde) {
        await ideSettingsAPI.updateIde(editingIde.id!, newIdeName, newIdeExecutable);
      } else {
        await ideSettingsAPI.addIde(newIdeName, newIdeExecutable);
      }
      showAddIdeModal = false;
      await loadIdesData();
      toastStore.success(`IDE "${newIdeName}" saved successfully`);
    } catch (error) {
      logger.error('Failed to save IDE:', error);
      toastStore.error('Failed to save IDE');
    }
  }

  function handleCancel() {
    showAddIdeModal = false;
    editingIde = null;
    newIdeName = "";
    newIdeExecutable = "";
  }

  async function deleteIde(id: number) {
    if (confirm('Are you sure you want to delete this IDE?')) {
      try {
        await ideSettingsAPI.deleteIde(id);
        await loadIdesData();
        toastStore.success('IDE deleted successfully');
      } catch (error) {
        logger.error('Failed to delete IDE:', error);
        toastStore.error('Failed to delete IDE');
      }
    }
  }

  async function setDefaultIde(id: number) {
    try {
      await ideSettingsAPI.setDefaultIde(id);
      await loadIdesData();
      toastStore.success('Default IDE updated');
    } catch (error) {
      logger.error('Failed to set default IDE:', error);
      toastStore.error('Failed to set default IDE');
    }
  }

  async function openIde(executable: string) {
    try {
      await ideSettingsAPI.openIde(executable);
    } catch (error) {
      logger.error('Failed to open IDE:', error);
      toastStore.error(`Failed to open IDE: ${error}`);
    }
  }

  function isIdeInstalled(executable: string): boolean {
    return installedIdes.includes(executable);
  }

  function isIdeConfigured(executable: string): boolean {
    return ides.some(ide => ide.executable === executable);
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
      'mousepad': '🟢',
      'leafpad': '🟢',
      'pluma': '🟢',
      'xed': '🟢',
      'nano': '🟢',
      'micro': '🟢',
      'helix': '🟢',
      'kakoune': '🟢',
      'joe': '🟢',
      'mcedit': '🟢',
      'ne': '🟢',
      'ee': '🟢',
      'pe': '🟢',
      'te': '🟢',
      'zile': '🟢',
      'mg': '🟢',
      'jove': '🟢',
      'jed': '🟢',
      'elvis': '🟢',
      'le': '🟢',
      'yudit': '🟢',
      'bvi': '🟢',
      'bvi-plus': '🟢',
      'nvi': '🟢',
      'nvi2': '🟢',
      'stevie': '🟢',
      'vile': '🟢',
      'xvi': '🟢',
      'elwin': '🟢',
      'calvin': '🟢',
      'mined': '🟢',
      'dte': '🟢',
      'le3': '🟢',
      'qemacs': '🟢',
      'uemacs': '🟢',
      'mg2a': '🟢',
      'mg3a': '🟢',
      'mg4a': '🟢',
      'mg5a': '🟢',
      'mg6a': '🟢',
      'mg7a': '🟢',
      'mg8a': '🟢',
      'mg9a': '🟢',
      'mg10a': '🟢',
      'mg11a': '🟢',
      'mg12a': '🟢',
      'mg13a': '🟢',
      'mg14a': '🟢',
      'mg15a': '🟢',
      'mg16a': '🟢',
      'mg17a': '🟢',
      'mg18a': '🟢',
      'mg19a': '🟢',
      'mg20a': '🟢',
      'mg21a': '🟢',
      'mg22a': '🟢',
      'mg23a': '🟢',
      'mg24a': '🟢',
      'mg25a': '🟢',
      'mg26a': '🟢',
      'mg27a': '🟢',
      'mg28a': '🟢',
      'mg29a': '🟢',
      'mg30a': '🟢',
      'mg31a': '🟢',
      'mg32a': '🟢',
      'mg33a': '🟢',
      'mg34a': '🟢',
      'mg35a': '🟢',
      'mg36a': '🟢',
      'mg37a': '🟢',
      'mg38a': '🟢',
      'mg39a': '🟢',
      'mg40a': '🟢',
      'mg41a': '🟢',
      'mg42a': '🟢',
      'mg43a': '🟢',
      'mg44a': '🟢',
      'mg45a': '🟢',
      'mg46a': '🟢',
      'mg47a': '🟢',
      'mg48a': '🟢',
      'mg49a': '🟢',
      'mg50a': '🟢',
      'mg51a': '🟢',
      'mg52a': '🟢',
      'mg53a': '🟢',
      'mg54a': '🟢',
      'mg55a': '🟢',
      'mg56a': '🟢',
      'mg57a': '🟢',
      'mg58a': '🟢',
      'mg59a': '🟢',
      'mg60a': '🟢',
      'mg61a': '🟢',
      'mg62a': '🟢',
      'mg63a': '🟢',
      'mg64a': '🟢',
      'mg65a': '🟢',
      'mg66a': '🟢',
      'mg67a': '🟢',
      'mg68a': '🟢',
      'mg69a': '🟢',
      'mg70a': '🟢',
      'mg71a': '🟢',
      'mg72a': '🟢',
      'mg73a': '🟢',
      'mg74a': '🟢',
      'mg75a': '🟢',
      'mg76a': '🟢',
      'mg77a': '🟢',
      'mg78a': '🟢',
      'mg79a': '🟢',
      'mg80a': '🟢',
      'mg81a': '🟢',
      'mg82a': '🟢',
      'mg83a': '🟢',
      'mg84a': '🟢',
      'mg85a': '🟢',
      'mg86a': '🟢',
      'mg87a': '🟢',
      'mg88a': '🟢',
      'mg89a': '🟢',
      'mg90a': '🟢',
      'mg91a': '🟢',
      'mg92a': '🟢',
      'mg93a': '🟢',
      'mg94a': '🟢',
      'mg95a': '🟢',
      'mg96a': '🟢',
      'mg97a': '🟢',
      'mg98a': '🟢',
      'mg99a': '🟢',
      'mg100a': '🟢'
    };
    return iconMap[executable] || '💻';
  }

  function handleRefresh() {
    loadIdesData();
  }

  function handleDetectIdes() {
    detectInstalledIdes();
  }
</script>

<SettingsSection 
  title="IDE Settings"
  description="Configure IDE executables for opening projects directly from the application"
  icon="💻"
>
  <!-- Detected IDEs Section -->
  <Card className="mb-6">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Detected IDEs ({installedIdes.length})</CardTitle>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            IDEs found on your system that can be added to the configuration
          </p>
        </div>
        <ActionButton 
          action="refresh"
          label="Detect IDEs"
          onclick={() => handleDetectIdes()}
          loading={isDetectingIdes}
        />
      </div>
    </CardHeader>
    <CardContent>
      {#if installedIdes.length === 0}
        <EmptyState 
          title="No IDEs detected"
          description="Click 'Detect IDEs' to scan your system for installed IDEs."
          icon="🔍"
        />
      {:else}
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {#each installedIdes as executable}
            {@const isConfigured = isIdeConfigured(executable)}
            <div class="flex flex-col items-center">
              <div 
                class="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer w-full"
                onclick={() => openIde(executable)}
                title="Open {executable}"
              >
                <div class="text-2xl mb-2">{getIdeIcon(executable)}</div>
                <div class="flex items-center space-x-2 mb-2">
                  <span class="text-green-500 text-sm">✓</span>
                  <span class="font-mono text-sm text-slate-900 dark:text-white text-center">
                    {executable}
                  </span>
                </div>
              </div>
              {#if !isConfigured}
                <button 
                  class="mt-2 p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  onclick={() => {
                    newIdeName = executable.charAt(0).toUpperCase() + executable.slice(1);
                    newIdeExecutable = executable;
                    showAddIdeModal = true;
                    editingIde = null;
                  }}
                  title="Add IDE"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>

  <!-- Configured IDEs Section -->
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Configured IDEs</CardTitle>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage IDE executables for project opening
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
            label="Add IDE"
            onclick={() => openAddIdeModal()}
          />
        </div>
      </div>
    </CardHeader>

    <CardContent>
      {#if isLoading}
        <LoadingState message="Loading IDEs..." />
      {:else if ides.length === 0}
        <EmptyState 
          title="No IDEs configured"
          description="Add your first IDE to start opening projects directly from the application."
          icon="💻"
          showAction={true}
          actionLabel="Add Your First IDE"
          onaction={() => openAddIdeModal()}
        />
      {:else}
        <div class="space-y-3">
          {#each sortedIdes as ide}
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                  <span class="text-lg">{getIdeIcon(ide.executable)}</span>
                  {#if ide.is_default}
                    <span class="text-yellow-500 text-sm">⭐</span>
                  {/if}
                  <span class="font-medium text-slate-900 dark:text-white">
                    {ide.name}
                  </span>
                  {#if installedIdes.length > 0}
                    {#if isIdeInstalled(ide.executable)}
                      <span class="text-green-500 text-sm" title="IDE is installed and available">✓</span>
                    {:else}
                      <span class="text-red-500 text-sm" title="IDE is not installed or not in PATH">✗</span>
                    {/if}
                  {/if}
                </div>
                <div class="text-sm text-slate-500 dark:text-slate-400 font-mono">
                  {ide.executable}
                </div>
              </div>
              
              <div class="flex items-center space-x-1">
                {#if installedIdes.length === 0 || isIdeInstalled(ide.executable)}
                  <button
                    class="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    onclick={() => openIde(ide.executable)}
                    title="Open IDE"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                  </button>
                {/if}
                {#if !ide.is_default}
                  <button
                    class="p-2 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                    onclick={() => setDefaultIde(ide.id!)}
                    title="Set as Default"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </button>
                {/if}
                <button
                  class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  onclick={() => openEditIdeModal(ide)}
                  title="Edit IDE"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button
                  class="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  onclick={() => deleteIde(ide.id!)}
                  title="Delete IDE"
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

<!-- Add/Edit IDE Modal -->
<SettingsModal 
  isOpen={showAddIdeModal}
  title={editingIde ? "Edit IDE" : "Add IDE"}
  description="Configure IDE name and executable path"
  on:close={handleCancel}
>
  <div class="space-y-4">
    <div>
      <label for="ide-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        IDE Name
      </label>
      <Input
        id="ide-name"
        type="text"
        placeholder="e.g., Visual Studio Code"
        value={newIdeName}
        oninput={(e: Event) => {
          const target = e.target as HTMLInputElement;
          newIdeName = target.value;
        }}
      />
    </div>
    
    <div>
      <label for="ide-executable" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Executable
      </label>
      <Input
        id="ide-executable"
        type="text"
        placeholder="e.g., code"
        value={newIdeExecutable}
        oninput={(e: Event) => {
          const target = e.target as HTMLInputElement;
          newIdeExecutable = target.value;
        }}
      />
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        The command to launch the IDE (must be available in PATH)
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
      onclick={saveIde}
      disabled={!newIdeName.trim() || !newIdeExecutable.trim()}
    >
      {editingIde ? 'Update' : 'Add'} IDE
    </Button>
  </div>
</SettingsModal>
