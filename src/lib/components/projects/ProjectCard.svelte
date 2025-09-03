<script lang="ts">
  import { goto } from '$lib/utils/navigation';
  import Icon from '@iconify/svelte';
  import { Badge } from '$lib/components/ui/feedback/index.js';
  import { Card, CardContent } from '$lib/components/ui/card/index.js';
  import Button from '$lib/components/ui/button.svelte';
  import type { Project } from '$lib/api/projects';

  const { 
    project, 
    className = "",
    onToggleStar,
    onOpenInExplorer,
    onOpenInIde,
    onViewDeployment,
    onEdit,
    onDelete
  } = $props<{
    project?: Project;
    className?: string;
    onToggleStar?: (project: any) => void;
    onOpenInExplorer?: (path: string) => void;
    onOpenInIde?: (project: any) => void;
    onViewDeployment?: (deployment: string) => void;
    onEdit?: (project: any) => void;
    onDelete?: (project: any) => void;
  }>();

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
    return new Date(dateString).toLocaleDateString();
  }

  function handleViewDetails() {
    goto(`/projects/${project.id}`);
  }

  function handleToggleStar() {
    onToggleStar?.(project);
  }

  function handleOpenInExplorer() {
    onOpenInExplorer?.(project.path);
  }

  function handleOpenInIde() {
    onOpenInIde?.(project);
  }

  function handleViewDeployment() {
    if (project.deployment) {
      onViewDeployment?.(project.deployment);
    }
  }

  function handleEdit() {
    onEdit?.(project);
  }

  function handleDelete() {
    onDelete?.(project);
  }
</script>

<Card className="hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors {className}">
  <CardContent className="p-4">
    <div class="flex items-center justify-between">
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Icon icon={getFrameworkIcon(project.framework)} class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <Button
              onclick={handleViewDetails}
              variant="ghost"
              class="font-medium text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 text-left w-full"
              title="View project details"
            >
              {project.name}
            </Button>
            <div class="text-sm text-slate-500 dark:text-slate-400 truncate">
              {project.path}
            </div>
            <div class="flex items-center space-x-2 text-xs text-slate-400 dark:text-slate-500">
              <span>Added: {formatDate(project.created_at)}</span>
              {#if project.framework}
                <Badge variant="secondary" size="sm">
                  <Icon icon={getFrameworkIcon(project.framework)} class="w-3 h-3 mr-1" />
                  {project.framework}
                </Badge>
              {/if}
              {#if project.deployment}
                <Badge variant="success" size="sm">
                  <Icon icon="devicon:kubernetes" class="w-3 h-3 mr-1" />
                  {project.deployment}
                </Badge>
              {/if}
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          class="p-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
          onclick={handleViewDetails}
          title="View Details"
        >
          <Icon icon="mdi:eye" class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="p-2 {project.starred ? 'text-yellow-500' : 'text-slate-400'} hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
          onclick={handleToggleStar}
          title={project.starred ? 'Unstar project' : 'Star project'}
        >
          <Icon icon={project.starred ? 'mdi:star' : 'mdi:star-outline'} class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
          onclick={handleOpenInExplorer}
          title="Open in Explorer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
        </Button>
        {#if project.framework}
          <Button
            variant="ghost"
            size="sm"
            class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            onclick={handleOpenInIde}
            title="Open in IDE"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </Button>
        {/if}
        {#if project.deployment}
          <Button
            variant="ghost"
            size="sm"
            class="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            onclick={handleViewDeployment}
            title="View Deployment"
          >
            <Icon icon="devicon:kubernetes" class="w-4 h-4" />
          </Button>
        {/if}
        <Button
          variant="ghost"
          size="sm"
          class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          onclick={handleEdit}
          title="Edit Project"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          onclick={handleDelete}
          title="Delete Project"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
