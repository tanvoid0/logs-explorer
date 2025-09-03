<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import { SettingsModal } from '$lib/components/ui/settings/index.js';
  import { Input } from '$lib/components/ui/form/index.js';
  import Button from '$lib/components/ui/button.svelte';
  import FrameworkSelector from '$lib/components/workloads/FrameworkSelector.svelte';
  import ProjectDeploymentSelector from '$lib/components/workloads/ProjectDeploymentSelector.svelte';
  import type { Project } from '$lib/api/projects';

  let { 
    isOpen = false, 
    editingProject = null, 
    newProjectName = $bindable(""), 
    newProjectPath = $bindable(""), 
    newProjectFramework = $bindable(null), 
    newProjectDeployment = $bindable(null), 
    isPathValid = false, 
    isGeneratingName = false, 
    isDetectingFramework = false, 
    pathValidationError = "", 
    deployments = [] 
  } = $props<{
    isOpen?: boolean;
    editingProject?: Project | null;
    newProjectName?: string;
    newProjectPath?: string;
    newProjectFramework?: string | null;
    newProjectDeployment?: string | null;
    isPathValid?: boolean;
    isGeneratingName?: boolean;
    isDetectingFramework?: boolean;
    pathValidationError?: string;
    deployments?: any[];
  }>();

  const dispatch = createEventDispatcher();

  function getFrameworkIcon(framework: string | null | undefined): string {
    if (!framework) return 'devicon:folder';
    
    const iconMap: Record<string, string> = {
      'Maven': 'devicon:maven',
      'Gradle': 'devicon:gradle',
      'Node.js': 'devicon:nodejs',
      'Yarn': 'devicon:yarn',
      'pnpm': 'devicon:pnpm',
      'React': 'devicon:react',
      'Vue.js': 'devicon:vuejs',
      'Angular': 'devicon:angularjs',
      'Next.js': 'devicon:nextjs',
      'Nuxt.js': 'devicon:nuxtjs',
      'Svelte': 'devicon:svelte',
      'Vite': 'devicon:vitejs',
      'Webpack': 'devicon:webpack',
      'Rollup': 'devicon:rollupjs',
      'Python': 'devicon:python',
      'Poetry': 'devicon:python',
      'Go': 'devicon:go',
      'Rust': 'devicon:rust',
      'PHP': 'devicon:php',
      'Composer': 'devicon:composer',
      'Ruby': 'devicon:ruby',
      'Swift': 'devicon:swift',
      'Flutter': 'devicon:flutter',
      '.NET': 'devicon:dotnet',
      'Docker': 'devicon:docker',
      'Kubernetes': 'devicon:kubernetes',
      'Terraform': 'devicon:terraform',
      'Ansible': 'devicon:ansible',
      'Make': 'devicon:cmake',
      'CMake': 'devicon:cmake',
      'Tauri': 'devicon:rust',
      'Build Output': 'devicon:folder'
    };
    
    return iconMap[framework] || 'devicon:folder';
  }

  function handleClose() {
    dispatch('close');
  }

  function handlePathInput(event: Event) {
    const target = event.target as HTMLInputElement;
    newProjectPath = target.value;
    dispatch('pathInput', { value: newProjectPath });
  }

  function handlePathBlur() {
    dispatch('pathBlur');
  }

  function handleSelectDirectory() {
    dispatch('selectDirectory');
  }

  function handleNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    newProjectName = target.value;
    dispatch('nameInput', { value: newProjectName });
  }

  function handleFrameworkChange(framework: string | null) {
    newProjectFramework = framework;
    dispatch('frameworkChange', { framework: newProjectFramework });
  }

  function handleDetectFramework() {
    dispatch('detectFramework');
  }

  function handleDeploymentChange(deployment: string | null) {
    newProjectDeployment = deployment;
    dispatch('deploymentChange', { deployment: newProjectDeployment });
  }

  function handleSave() {
    dispatch('save');
  }
</script>

<SettingsModal 
  isOpen={isOpen}
  title={editingProject ? "Edit Project" : "Add Project"}
  description="Configure project settings and directory path"
  size="lg"
  on:close={handleClose}
>
  <div class="space-y-4">
    <div>
      <label for="project-path" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Project Directory Path
      </label>
      <div class="flex space-x-2">
        <Input
          id="project-path"
          type="text"
          value={newProjectPath}
          oninput={handlePathInput}
          onblur={handlePathBlur}
          placeholder="/path/to/your/project"
          class={isPathValid ? 'border-green-300 dark:border-green-600' : newProjectPath ? 'border-red-300 dark:border-red-600' : ''}
        />
        <button
          type="button"
          onclick={handleSelectDirectory}
          class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          title="Browse for directory"
        >
          <Icon icon="mdi:folder-open" class="w-4 h-4" />
        </button>
      </div>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Enter the full path to your project directory (e.g., /home/user/projects/my-app or C:\Users\user\projects\my-app)
      </p>
      {#if pathValidationError}
        <p class="text-xs text-red-600 dark:text-red-400 mt-1">
          {pathValidationError}
        </p>
      {:else if newProjectPath && !isPathValid}
        <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          Validating path...
        </p>
      {:else if newProjectPath && isPathValid}
        <p class="text-xs text-green-600 dark:text-green-400 mt-1">
          ✓ Valid directory path
        </p>
      {/if}
      
      {#if newProjectFramework}
        <div class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
          <div class="flex items-center space-x-2">
            <Icon icon={getFrameworkIcon(newProjectFramework)} class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span class="text-sm text-blue-800 dark:text-blue-200">
              Detected framework: <span class="font-medium">{newProjectFramework}</span>
            </span>
          </div>
        </div>
      {:else if isDetectingFramework}
        <div class="mt-2 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md">
          <div class="flex items-center space-x-2">
            <svg class="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-sm text-slate-600 dark:text-slate-400">
              Detecting framework...
            </span>
          </div>
        </div>
      {/if}
    </div>
    
    <div>
      <label for="project-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Project Name
      </label>
      <div class="relative">
        <Input
          id="project-name"
          type="text"
          value={newProjectName}
          oninput={handleNameInput}
          placeholder="My Awesome Project"
        />
        {#if isGeneratingName}
          <div class="absolute right-2 top-2">
            <svg class="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        {/if}
      </div>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {editingProject ? 'Edit the project name' : 'Project name will be auto-generated from the directory name'}
      </p>
    </div>

    <div class="space-y-2">
      <FrameworkSelector 
        selectedFramework={newProjectFramework}
        disabled={false}
        onFrameworkChange={handleFrameworkChange}
      />
      <div class="flex justify-end">
        <Button
          onclick={handleDetectFramework}
          disabled={isDetectingFramework || !newProjectPath}
          variant="outline"
          size="sm"
        >
          {#if isDetectingFramework}
            <Icon icon="mdi:loading" class="w-4 h-4 animate-spin" />
          {:else}
            <Icon icon="mdi:magnify" class="w-4 h-4" />
          {/if}
          <span>Detect</span>
        </Button>
      </div>
    </div>

    <ProjectDeploymentSelector 
      deployments={deployments}
      selectedDeployment={newProjectDeployment}
      folderName={newProjectName}
      disabled={false}
      onDeploymentChange={handleDeploymentChange}
    />
  </div>

  <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
    <Button 
      variant="outline"
      onclick={handleClose}
    >
      Cancel
    </Button>
    <Button 
      onclick={handleSave}
      disabled={!newProjectName.trim() || !newProjectPath.trim() || !isPathValid}
    >
      {editingProject ? 'Update' : 'Add'}
    </Button>
  </div>
</SettingsModal>
