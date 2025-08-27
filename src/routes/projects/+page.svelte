<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button.svelte";
  import { projectsAPI, type Project } from "$lib/api/projects";
  import { appStore, namespaceState } from "$lib/stores/app-store";
  import { toastStore } from "$lib/stores/toast-store";
  import Icon from "@iconify/svelte";
  import FrameworkSelector from "$lib/components/FrameworkSelector.svelte";
  import ProjectDeploymentSelector from "$lib/components/ProjectDeploymentSelector.svelte";
  import { k8sAPI } from "$lib/api/k8s";

  // Project state
  let projects = $state<Project[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state("");
  let frameworkFilter = $state<string | null>(null);
  let sortBy = $state<string>("name");
  let frameworks = $state<string[]>([]);
  let showAddProjectModal = $state(false);
  let editingProject = $state<Project | null>(null);
  let newProjectName = $state("");
  let newProjectPath = $state("");
  let newProjectFramework = $state<string | null>(null);
  let newProjectDeployment = $state<string | null>(null);
  let isPathValid = $state(false);
  let isGeneratingName = $state(false);
  let isDetectingFramework = $state(false);
  let pathValidationError = $state("");
  let validationTimeout: ReturnType<typeof setTimeout> | null = null;

  // Kubernetes state for deployments - loaded only when needed
  let deployments = $state<any[]>([]);
  let isLoadingDeployments = $state(false);
  let hasLoadedDeployments = $state(false);

  onMount(async () => {
    await loadProjectsData();
    await loadFrameworksData();
    // Don't load deployments automatically - only when needed for project creation/editing
  });

  async function loadProjectsData() {
    try {
      isLoading = true;
      projects = await projectsAPI.getProjectsWithFilters(frameworkFilter, sortBy, searchQuery || null);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toastStore.error('Failed to load projects');
      projects = [];
    } finally {
      isLoading = false;
    }
  }

  async function loadFrameworksData() {
    try {
      frameworks = await projectsAPI.getFrameworks();
    } catch (error) {
      console.error('Failed to load frameworks:', error);
      frameworks = [];
    }
  }

  async function loadDeploymentsData() {
    // Only load deployments if we haven't loaded them yet and we're connected
    if (hasLoadedDeployments) {
      return;
    }

    try {
      isLoadingDeployments = true;
      const isConnected = await appStore.ensureConnected();
      if (isConnected) {
        const currentNamespace = $namespaceState.selected || 'default';
        deployments = await k8sAPI.getDeployments(currentNamespace);
        hasLoadedDeployments = true;
      } else {
        deployments = [];
      }
    } catch (error) {
      console.error('Failed to load deployments:', error);
      deployments = [];
    } finally {
      isLoadingDeployments = false;
    }
  }

  function openAddProjectModal() {
    showAddProjectModal = true;
    newProjectName = "";
    newProjectPath = "";
    newProjectFramework = null;
    newProjectDeployment = null;
    editingProject = null;
    isPathValid = false;
    pathValidationError = "";
    // Load deployments when opening the modal
    loadDeploymentsData();
  }

  function openEditProjectModal(project: Project) {
    showAddProjectModal = true;
    editingProject = project;
    newProjectName = project.name;
    newProjectPath = project.path;
    newProjectFramework = project.framework || null;
    newProjectDeployment = project.deployment || null;
    isPathValid = true;
    // Load deployments when opening the modal
    loadDeploymentsData();
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
        if (!editingProject) {
          await generateProjectName();
        }
        await detectFramework();
      }
    } catch (error) {
      console.error('Failed to validate path:', error);
      isPathValid = false;
      pathValidationError = error instanceof Error ? error.message : 'Validation failed';
      newProjectFramework = null;
    }
  }

  function debouncedValidatePath() {
    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    // Set new timeout for validation
    validationTimeout = setTimeout(() => {
      validatePath();
    }, 500); // 500ms delay
  }

  async function generateProjectName() {
    if (!newProjectPath.trim() || editingProject) return;

    try {
      isGeneratingName = true;
      const generatedName = await projectsAPI.generateProjectName(newProjectPath);
      newProjectName = generatedName;
    } catch (error) {
      console.error('Failed to generate project name:', error);
      newProjectName = "New Project";
    } finally {
      isGeneratingName = false;
    }
  }

  async function detectFramework() {
    if (!newProjectPath.trim()) return;

    try {
      isDetectingFramework = true;
      const framework = await projectsAPI.detectFramework(newProjectPath);
      newProjectFramework = framework;
    } catch (error) {
      console.error('Failed to detect framework:', error);
      newProjectFramework = null;
    } finally {
      isDetectingFramework = false;
    }
  }

  async function saveProject() {
    try {
      if (!newProjectName.trim() || !newProjectPath.trim()) {
        toastStore.error('Please fill in all fields');
        return;
      }

      if (!isPathValid) {
        toastStore.error('Please enter a valid directory path');
        return;
      }

      // Check for duplicate paths (case-insensitive)
      const normalizedPath = newProjectPath.toLowerCase();
      const existingProject = projects.find(p => 
        p.path.toLowerCase() === normalizedPath && 
        (!editingProject || p.id !== editingProject.id)
      );

      if (existingProject) {
        toastStore.error('A project with this path already exists');
        return;
      }

      if (editingProject) {
        await projectsAPI.updateProject(editingProject.id!, newProjectName, newProjectPath, newProjectFramework, newProjectDeployment);
        toastStore.success('Project updated successfully');
      } else {
        await projectsAPI.addProject(newProjectName, newProjectPath, newProjectFramework, newProjectDeployment);
        toastStore.success('Project added successfully');
      }
      
      showAddProjectModal = false;
      await loadProjectsData();
    } catch (error) {
      console.error('Failed to save project:', error);
      toastStore.error(`Failed to save project: ${error}`);
    }
  }

  async function deleteProject(id: number) {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await projectsAPI.deleteProject(id);
        toastStore.success('Project deleted successfully');
        await loadProjectsData();
      } catch (error) {
        console.error('Failed to delete project:', error);
        toastStore.error(`Failed to delete project: ${error}`);
      }
    }
  }

  async function openProjectInExplorer(path: string) {
    try {
      await projectsAPI.openProjectInExplorer(path);
    } catch (error) {
      console.error('Failed to open project in explorer:', error);
      toastStore.error(`Failed to open project: ${error}`);
    }
  }

  async function openProjectInIde(project: Project) {
    try {
      if (!project.framework) {
        toastStore.error('No framework detected for this project. Please detect the framework first.');
        return;
      }
      await projectsAPI.openProjectInIde(project.path, project.framework);
      toastStore.success(`Opening project in IDE for ${project.framework}`);
    } catch (error) {
      console.error('Failed to open project in IDE:', error);
      toastStore.error(`Failed to open project in IDE: ${error}`);
    }
  }

  function viewDeploymentDetails(deploymentName: string) {
    // Navigate to deployment details page
    window.location.href = `/workloads/deployments/${deploymentName}`;
  }

  function handleFrameworkChange(event: CustomEvent) {
    newProjectFramework = event.detail.framework;
  }

  function handleDeploymentChange(event: CustomEvent) {
    newProjectDeployment = event.detail.deployment;
  }

  async function handleSearchChange() {
    await loadProjectsData();
  }

  async function handleFrameworkFilterChange() {
    await loadProjectsData();
  }

  async function handleSortByChange() {
    await loadProjectsData();
  }

  async function toggleProjectStar(project: Project) {
    try {
      await projectsAPI.toggleProjectStar(project.id!);
      await loadProjectsData(); // Reload to get updated star status
    } catch (error) {
      console.error('Failed to toggle project star:', error);
      toastStore.error('Failed to toggle project star');
    }
  }

  async function selectDirectory() {
    try {
      const selectedPath = await projectsAPI.selectDirectory();
      if (selectedPath) {
        newProjectPath = selectedPath;
        await validatePath();
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
      toastStore.error(`Failed to select directory: ${error}`);
    }
  }

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
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
</script>

<div class="flex-1 flex flex-col min-h-0">
  <!-- Main Content -->
  <div class="flex-1 overflow-y-auto p-6">
    <div class="w-full">
      <div class="space-y-8">
        <!-- Header -->
        <div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Projects
          </h2>
          <p class="text-slate-600 dark:text-slate-400">
            Manage your local projects and development directories
          </p>
        </div>

        <!-- Search and Add Button -->
        <div class="flex items-center justify-between">
          <div class="max-w-md">
            <label for="search" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Search Projects
            </label>
            <input
              id="search"
              type="text"
              bind:value={searchQuery}
              oninput={handleSearchChange}
              placeholder="Search by name or path..."
              class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button onclick={openAddProjectModal}>
            Add Project
          </Button>
        </div>

        <!-- Filters and Sorting -->
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <label for="framework-filter" class="text-sm font-medium text-slate-700 dark:text-slate-300">
              Framework:
            </label>
            <select
              id="framework-filter"
              bind:value={frameworkFilter}
              onchange={handleFrameworkFilterChange}
              class="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={null}>All Frameworks</option>
              {#each frameworks as framework}
                <option value={framework}>{framework}</option>
              {/each}
            </select>
          </div>
          
          <div class="flex items-center space-x-2">
            <label for="sort-by" class="text-sm font-medium text-slate-700 dark:text-slate-300">
              Sort by:
            </label>
            <select
              id="sort-by"
              bind:value={sortBy}
              onchange={handleSortByChange}
              class="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="date_added">Date Added</option>
              <option value="date_updated">Date Updated</option>
            </select>
          </div>
        </div>

        <!-- Projects List -->
        {#if isLoading}
          <div class="text-center py-12">
            <div class="text-slate-400 dark:text-slate-500 mb-4">
              <svg class="mx-auto h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p class="text-slate-500 dark:text-slate-400">Loading projects...</p>
          </div>
        {:else if projects.length === 0}
          <div class="text-center py-12">
            <div class="text-slate-400 dark:text-slate-500 mb-4">
              <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <p class="text-slate-500 dark:text-slate-400 mb-4">
              {searchQuery ? 'No projects found matching your search' : 'No projects added yet'}
            </p>
            {#if !searchQuery}
              <Button onclick={openAddProjectModal}>
                Add Your First Project
              </Button>
            {/if}
          </div>
        {:else}
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-medium text-slate-900 dark:text-white">
                Projects ({projects.length})
              </h3>
            </div>
            
            <div class="p-6">
              <div class="space-y-4">
                {#each projects as project}
                  <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                    <div class="flex-1 min-w-0">
                                             <div class="flex items-center space-x-3">
                         <div class="flex-shrink-0">
                           <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                             <Icon icon={getFrameworkIcon(project.framework)} class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                           </div>
                         </div>
                                                 <div class="flex-1 min-w-0">
                           <button
                             onclick={() => goto(`/projects/${project.id}`)}
                             class="font-medium text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 text-left w-full"
                             title="View project details"
                           >
                             {project.name}
                           </button>
                           <div class="text-sm text-slate-500 dark:text-slate-400 truncate">
                             {project.path}
                           </div>
                           <div class="flex items-center space-x-2 text-xs text-slate-400 dark:text-slate-500">
                             <span>Added: {formatDate(project.created_at)}</span>
                             {#if project.framework}
                               <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                 <Icon icon={getFrameworkIcon(project.framework)} class="w-3 h-3 mr-1" />
                                 {project.framework}
                               </span>
                             {/if}
                             {#if project.deployment}
                               <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                 <Icon icon="devicon:kubernetes" class="w-3 h-3 mr-1" />
                                 {project.deployment}
                               </span>
                             {/if}
                           </div>
                         </div>
                      </div>
                    </div>
                    
                    <div class="flex items-center space-x-1">
                      <button
                        class="p-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        onclick={() => goto(`/projects/${project.id}`)}
                        title="View Details"
                      >
                        <Icon icon="mdi:eye" class="w-4 h-4" />
                      </button>
                      <button
                        class="p-2 {project.starred ? 'text-yellow-500' : 'text-slate-400'} hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                        onclick={() => toggleProjectStar(project)}
                        title={project.starred ? 'Unstar project' : 'Star project'}
                      >
                        <Icon icon={project.starred ? 'mdi:star' : 'mdi:star-outline'} class="w-4 h-4" />
                      </button>
                      <button
                        class="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        onclick={() => openProjectInExplorer(project.path)}
                        title="Open in Explorer"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                      </button>
                      {#if project.framework}
                        <button
                          class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          onclick={() => openProjectInIde(project)}
                          title="Open in IDE"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                        </button>
                      {/if}
                      {#if project.deployment}
                        <button
                          class="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          onclick={() => viewDeploymentDetails(project.deployment!)}
                          title="View Deployment"
                        >
                          <Icon icon="devicon:kubernetes" class="w-4 h-4" />
                        </button>
                      {/if}
                      <button
                        class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        onclick={() => openEditProjectModal(project)}
                        title="Edit Project"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        class="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        onclick={() => deleteProject(project.id!)}
                        title="Delete Project"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Add/Edit Project Modal -->
  {#if showAddProjectModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">
          {editingProject ? 'Edit Project' : 'Add Project'}
        </h3>
        
        <div class="space-y-4">
          <div>
            <label for="project-path" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Project Directory Path
            </label>
            <div class="flex space-x-2">
              <input
                id="project-path"
                type="text"
                bind:value={newProjectPath}
                oninput={debouncedValidatePath}
                onblur={validatePath}
                placeholder="/path/to/your/project"
                class="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent {isPathValid ? 'border-green-300 dark:border-green-600' : newProjectPath ? 'border-red-300 dark:border-red-600' : ''}"
              />
              <button
                type="button"
                onclick={selectDirectory}
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
              <input
                id="project-name"
                type="text"
                bind:value={newProjectName}
                placeholder="My Awesome Project"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              on:frameworkChange={handleFrameworkChange}
            />
            <div class="flex justify-end">
              <button
                type="button"
                onclick={detectFramework}
                disabled={isDetectingFramework || !newProjectPath}
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-md transition-colors flex items-center space-x-2"
              >
                {#if isDetectingFramework}
                  <Icon icon="mdi:loading" class="w-4 h-4 animate-spin" />
                {:else}
                  <Icon icon="mdi:magnify" class="w-4 h-4" />
                {/if}
                <span>Detect</span>
              </button>
            </div>
          </div>

          <ProjectDeploymentSelector 
            deployments={deployments}
            selectedDeployment={newProjectDeployment}
            folderName={newProjectName}
            disabled={false}
            on:deploymentChange={handleDeploymentChange}
          />
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <Button 
            variant="outline"
            onclick={() => showAddProjectModal = false}
          >
            Cancel
          </Button>
          <Button 
            onclick={saveProject}
            disabled={!newProjectName.trim() || !newProjectPath.trim() || !isPathValid}
          >
            {editingProject ? 'Update' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
