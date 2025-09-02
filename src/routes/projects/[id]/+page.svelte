<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button.svelte";
  import { projectsAPI, type Project } from "$lib/api/projects";
  import { k8sAPI } from "$lib/api/k8s";
  import { toastStore } from "$lib/stores/toast-store";
  import Icon from "@iconify/svelte";
  import FrameworkSelector from "$lib/components/FrameworkSelector.svelte";
  import ProjectDeploymentSelector from "$lib/components/ProjectDeploymentSelector.svelte";
  import CentralizedTerminal from "$lib/components/CentralizedTerminal.svelte";
  import PipelineExecutor from "$lib/components/PipelineExecutor.svelte";
  import TaskPage from "$lib/components/TaskPage.svelte";

  // Project state
  let project = $state<Project | null>(null);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let showEditModal = $state(false);
  let editingProject = $state<Project | null>(null);
  let newProjectName = $state("");
  let newProjectPath = $state("");
  let newProjectFramework = $state<string | null>(null);
  let newProjectDeployment = $state<string | null>(null);
  let isPathValid = $state(false);
  let pathValidationError = $state("");
  let validationTimeout: ReturnType<typeof setTimeout> | null = null;

  // Kubernetes state for deployments
  let deployments = $state<any[]>([]);
  let isLoadingDeployments = $state(false);
  let deploymentDetails = $state<any | null>(null);

  // Tab state
  let activeTab = $state('overview');

  // Get project ID from URL
  let projectId = $derived(parseInt($page.params.id || '0'));

  onMount(async () => {
    if (isNaN(projectId)) {
      error = "Invalid project ID";
      isLoading = false;
      return;
    }
    await loadProjectData();
    await loadDeploymentsData();
  });

  async function loadProjectData() {
    try {
      isLoading = true;
      error = null;
      project = await projectsAPI.getProject(projectId);
      
      if (!project) {
        error = "Project not found";
        return;
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      error = "Failed to load project";
      toastStore.error('Failed to load project');
    } finally {
      isLoading = false;
    }
  }

  async function loadDeploymentsData() {
    if (!project?.deployment) return;
    
    try {
      isLoadingDeployments = true;
      const currentNamespace = 'default'; // You might want to get this from app store
      deployments = await k8sAPI.getDeployments(currentNamespace);
      
      // Find the specific deployment for this project
      if (project && project.deployment) {
        const deploymentName = project.deployment;
        deploymentDetails = deployments.find(d => d.metadata.name === deploymentName);
      }
    } catch (err) {
      console.error('Failed to load deployment details:', err);
      deployments = [];
    } finally {
      isLoadingDeployments = false;
    }
  }

  function openEditModal() {
    if (!project) return;
    
    showEditModal = true;
    editingProject = project;
    newProjectName = project.name;
    newProjectPath = project.path;
    newProjectFramework = project.framework || null;
    newProjectDeployment = project.deployment || null;
    isPathValid = true;
  }

  async function validatePath() {
    if (!newProjectPath.trim()) {
      isPathValid = false;
      pathValidationError = "";
      newProjectFramework = null;
      return;
    }

    try {
      isPathValid = await projectsAPI.validateProjectPath(newProjectPath);
      pathValidationError = "";
      if (isPathValid) {
        await detectFramework();
      }
    } catch (err) {
      console.error('Failed to validate path:', err);
      isPathValid = false;
      pathValidationError = err instanceof Error ? err.message : 'Validation failed';
      newProjectFramework = null;
    }
  }

  function debouncedValidatePath() {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    validationTimeout = setTimeout(() => {
      validatePath();
    }, 500);
  }

  async function detectFramework() {
    if (!newProjectPath.trim()) return;

    try {
      const framework = await projectsAPI.detectFramework(newProjectPath);
      newProjectFramework = framework;
    } catch (err) {
      console.error('Failed to detect framework:', err);
      newProjectFramework = null;
    }
  }

  async function saveProject() {
    if (!editingProject) return;
    
    try {
      if (!newProjectName.trim() || !newProjectPath.trim()) {
        toastStore.error('Please fill in all fields');
        return;
      }

      if (!isPathValid) {
        toastStore.error('Please enter a valid directory path');
        return;
      }

      await projectsAPI.updateProject(
        editingProject.id!, 
        newProjectName, 
        newProjectPath, 
        newProjectFramework, 
        newProjectDeployment
      );
      
      toastStore.success('Project updated successfully');
      showEditModal = false;
      await loadProjectData();
    } catch (err) {
      console.error('Failed to save project:', err);
      toastStore.error(`Failed to save project: ${err}`);
    }
  }

  async function deleteProject() {
    if (!project) return;
    
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await projectsAPI.deleteProject(project.id!);
      toastStore.success('Project deleted successfully');
      goto('/projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
      toastStore.error(`Failed to delete project: ${err}`);
    }
  }

  async function toggleProjectStar() {
    if (!project) return;
    
    try {
      await projectsAPI.toggleProjectStar(project.id!);
      project.starred = !project.starred;
      toastStore.success(project.starred ? 'Project starred' : 'Project unstarred');
    } catch (err) {
      console.error('Failed to toggle project star:', err);
      toastStore.error('Failed to toggle project star');
    }
  }

  async function openProjectInExplorer() {
    if (!project) return;
    
    try {
      await projectsAPI.openProjectInExplorer(project.path);
    } catch (err) {
      console.error('Failed to open project in explorer:', err);
      toastStore.error('Failed to open project in explorer');
    }
  }

  async function openProjectInIde() {
    if (!project) return;
    
    try {
      await projectsAPI.openProjectInIde(project.path, project.framework || null);
    } catch (err) {
      console.error('Failed to open project in IDE:', err);
      toastStore.error('Failed to open project in IDE');
    }
  }

  function getFrameworkIcon(framework: string | null | undefined): string {
    if (!framework) return 'devicon:folder';
    
    const iconMap: Record<string, string> = {
      // Java Ecosystem
      'Maven': 'devicon:maven',
      'Gradle': 'devicon:gradle',
      
      // JavaScript/Node.js Ecosystem
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
      
      // Python Ecosystem
      'Python': 'devicon:python',
      'Poetry': 'devicon:python',
      
      // Other Languages
      'Go': 'devicon:go',
      'Rust': 'devicon:rust',
      'PHP': 'devicon:php',
      'Composer': 'devicon:composer',
      'Ruby': 'devicon:ruby',
      'Swift': 'devicon:swift',
      'Flutter': 'devicon:flutter',
      
      // .NET
      '.NET': 'devicon:dotnet',
      
      // DevOps & Infrastructure
      'Docker': 'devicon:docker',
      'Kubernetes': 'devicon:kubernetes',
      'Terraform': 'devicon:terraform',
      'Ansible': 'devicon:ansible',
      'Make': 'devicon:cmake',
      'CMake': 'devicon:cmake',
      'Tauri': 'devicon:rust',
      
      // Build Output
      'Build Output': 'devicon:folder'
    };
    
    return iconMap[framework] || 'devicon:folder';
  }

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
</script>

<div class="flex-1 flex flex-col min-h-0">
  <!-- Header -->
  <div class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button
          onclick={() => goto('/projects')}
          class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Back to Projects"
        >
          <Icon icon="mdi:arrow-left" class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
            {project?.name || 'Project Details'}
          </h1>
          <p class="text-slate-600 dark:text-slate-400">
            {project?.path || 'Loading...'}
          </p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          class="p-2 {project?.starred ? 'text-yellow-500' : 'text-slate-400'} hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                      onclick={toggleProjectStar}
          title={project?.starred ? 'Unstar project' : 'Star project'}
        >
          <Icon icon={project?.starred ? 'mdi:star' : 'mdi:star-outline'} class="w-5 h-5" />
        </button>
        <Button variant="outline" onclick={openEditModal}>
          <Icon icon="mdi:pencil" class="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button variant="outline" onclick={deleteProject} class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
          <Icon icon="mdi:delete" class="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-slate-400 dark:text-slate-500 mb-4">
          <svg class="mx-auto h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p class="text-slate-500 dark:text-slate-400">Loading project details...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-red-400 dark:text-red-500 mb-4">
          <Icon icon="mdi:alert-circle" class="w-12 h-12 mx-auto" />
        </div>
        <p class="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onclick={() => goto('/projects')}>
          Back to Projects
        </Button>
      </div>
    </div>
  {:else if project}
    <!-- Tab Navigation -->
    <div class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div class="px-6">
        <nav class="flex space-x-8">
          <button
            onclick={() => activeTab = 'overview'}
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'overview' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}"
          >
            Overview
          </button>
          <button
            onclick={() => activeTab = 'tasks'}
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'tasks' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}"
          >
            Tasks
          </button>
        </nav>
      </div>
    </div>
    <!-- Tab Content -->
    {#if activeTab === 'overview'}
      <!-- Project Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="w-full space-y-8">
        
        <!-- Project Overview Card -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-start space-x-6">
            <div class="flex-shrink-0">
              <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Icon icon={getFrameworkIcon(project.framework)} class="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {project.name}
              </h2>
              <p class="text-slate-600 dark:text-slate-400 mb-4 font-mono text-sm">
                {project.path}
              </p>
              
              <div class="flex flex-wrap gap-2 mb-4">
                {#if project.framework}
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <Icon icon={getFrameworkIcon(project.framework)} class="w-4 h-4 mr-1" />
                    {project.framework}
                  </span>
                {/if}
                {#if project.deployment}
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Icon icon="devicon:kubernetes" class="w-4 h-4 mr-1" />
                    {project.deployment}
                  </span>
                {/if}
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                  <Icon icon="mdi:calendar" class="w-4 h-4 mr-1" />
                  Added {formatDate(project.created_at)}
                </span>
              </div>
              
              <div class="flex space-x-2">
                <Button onclick={openProjectInExplorer}>
                  <Icon icon="mdi:folder-open" class="w-4 h-4 mr-2" />
                  Open in Explorer
                </Button>
                {#if project.framework}
                  <Button variant="outline" onclick={openProjectInIde}>
                    <Icon icon="mdi:code-braces" class="w-4 h-4 mr-2" />
                    Open in IDE
                  </Button>
                {/if}
                {#if project && project.deployment}
                  {@const deploymentName = project.deployment}
                  <Button variant="outline" onclick={() => goto(`/workloads/deployments/${deploymentName}`)}>
                    <Icon icon="devicon:kubernetes" class="w-4 h-4 mr-2" />
                    View Deployment
                  </Button>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Project Details Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Project Information -->
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Project Information
            </h3>
            <div class="space-y-4">
              <div>
                <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Project Name
                </div>
                <p class="text-slate-900 dark:text-white">{project.name}</p>
              </div>
              <div>
                <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Directory Path
                </div>
                <p class="text-slate-900 dark:text-white font-mono text-sm break-all">{project.path}</p>
              </div>
              <div>
                <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Framework
                </div>
                <p class="text-slate-900 dark:text-white">
                  {project.framework || 'Not detected'}
                </p>
              </div>
              <div>
                <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Kubernetes Deployment
                </div>
                <p class="text-slate-900 dark:text-white">
                  {project.deployment || 'Not configured'}
                </p>
              </div>
              <div>
                <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </div>
                <p class="text-slate-900 dark:text-white">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Icon icon="mdi:check-circle" class="w-3 h-3 mr-1" />
                    Active
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Timestamps -->
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Timestamps
            </h3>
            <div class="space-y-4">
              <div>
                <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Created
                </div>
                <p class="text-slate-900 dark:text-white">{formatDate(project.created_at)}</p>
              </div>
              <div>
                <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Last Updated
                </div>
                <p class="text-slate-900 dark:text-white">{formatDate(project.updated_at)}</p>
              </div>
              <div>
                <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Starred
                </div>
                <p class="text-slate-900 dark:text-white">
                  {project.starred ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Deployment Details -->
        {#if project.deployment && deploymentDetails}
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Deployment Details
            </h3>
            {#if isLoadingDeployments}
              <div class="flex items-center justify-center py-8">
                <Icon icon="mdi:loading" class="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
                <span class="text-slate-600 dark:text-slate-400">Loading deployment details...</span>
              </div>
            {:else}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Deployment Name
                  </div>
                  <p class="text-slate-900 dark:text-white">{deploymentDetails.metadata.name}</p>
                </div>
                <div>
                  <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Namespace
                  </div>
                  <p class="text-slate-900 dark:text-white">{deploymentDetails.metadata.namespace}</p>
                </div>
                <div>
                  <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Replicas
                  </div>
                  <p class="text-slate-900 dark:text-white">
                    {deploymentDetails.spec.replicas} / {deploymentDetails.status.replicas}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Available
                  </label>
                  <p class="text-slate-900 dark:text-white">{deploymentDetails.status.availableReplicas || 0}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Updated
                  </label>
                  <p class="text-slate-900 dark:text-white">{deploymentDetails.status.updatedReplicas || 0}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ready
                  </label>
                  <p class="text-slate-900 dark:text-white">{deploymentDetails.status.readyReplicas || 0}</p>
                </div>
              </div>
            {/if}
          </div>
        {/if}

                 <!-- Terminal -->
         {#if project}
           <CentralizedTerminal projectPath={project.path} workingDirectory={project.path} />
         {/if}

                    <!-- Quick Actions -->
           {#if project}
             <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
               <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                 Quick Actions
               </h3>
               <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <Button variant="outline" onclick={openProjectInExplorer} class="h-auto p-4 flex flex-col items-center">
                   <Icon icon="mdi:folder-open" class="w-6 h-6 mb-2" />
                   <span>Open in Explorer</span>
                 </Button>
                 {#if project.framework}
                   <Button variant="outline" onclick={openProjectInIde} class="h-auto p-4 flex flex-col items-center">
                     <Icon icon="mdi:code-braces" class="w-6 h-6 mb-2" />
                     <span>Open in IDE</span>
                   </Button>
                 {/if}
                 {#if project?.deployment}
                   <Button variant="outline" onclick={() => goto(`/workloads/deployments/${project?.deployment}`)} class="h-auto p-4 flex flex-col items-center">
                     <Icon icon="devicon:kubernetes" class="w-6 h-6 mb-2" />
                     <span>View Deployment</span>
                   </Button>
                 {/if}
                 <Button variant="outline" onclick={() => goto(`/logs?project=${project?.id}`)} class="h-auto p-4 flex flex-col items-center">
                   <Icon icon="mdi:file-document" class="w-6 h-6 mb-2" />
                   <span>View Logs</span>
                 </Button>
               </div>
             </div>
           {/if}

           <!-- Automation Pipelines Section -->
           {#if project}
             <div class="mt-8">
               <PipelineExecutor 
                 projectId={project.id || 0}
                 projectName={project.name}
                 projectPath={project.path}
                 projectFramework={project.framework}
                 projectNamespace="default"
               />
             </div>
           {/if}
        </div>
      </div>
    {:else if activeTab === 'tasks'}
      <!-- Tasks Tab Content -->
      <div class="flex-1 overflow-y-auto">
        <TaskPage 
          title="Project Tasks"
          subtitle="Manage tasks for {project.name}"
          initialFilters={{
            resourceLinkType: 'project',
            resourceLinkId: project.id?.toString() || ''
          }}
          emptyStateMessage="No task groups for this project"
          emptyStateDescription="Create your first task group to get started!"
        />
      </div>
    {/if}
  {/if}

  <!-- Edit Project Modal -->
  {#if showEditModal && editingProject}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">
          Edit Project
        </h3>
        
        <div class="space-y-4">
          <div>
            <label for="project-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              bind:value={newProjectName}
              placeholder="Enter project name"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label for="project-path" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Project Directory Path
            </label>
            <input
              id="project-path"
              type="text"
              bind:value={newProjectPath}
              oninput={debouncedValidatePath}
              onblur={validatePath}
              placeholder="/path/to/your/project"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent {isPathValid ? 'border-green-300 dark:border-green-600' : newProjectPath ? 'border-red-300 dark:border-red-600' : ''}"
            />
            {#if pathValidationError}
              <p class="text-xs text-red-600 dark:text-red-400 mt-1">
                {pathValidationError}
              </p>
            {/if}
          </div>
          
          <div>
            <label for="project-framework" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Framework
            </label>
            <FrameworkSelector bind:selectedFramework={newProjectFramework} disabled={false} />
          </div>
          
          <div>
            <label for="project-deployment" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Kubernetes Deployment
            </label>
            <ProjectDeploymentSelector 
              bind:selectedDeployment={newProjectDeployment} 
              deployments={deployments}
              folderName=""
              disabled={false}
            />
          </div>
          
          <div class="flex gap-2 justify-end">
            <Button variant="outline" 
              onclick={() => showEditModal = false}
            >
              Cancel
            </Button>
            <Button onclick={saveProject}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
