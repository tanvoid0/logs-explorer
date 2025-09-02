<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Icon from "@iconify/svelte";
  import type { Project } from '$lib/api/projects';

  const { project = null, className = "" } = $props<{
    project?: Project | null;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

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

  function handleOpenInExplorer() {
    dispatch('openInExplorer');
  }

  function handleOpenInIde() {
    dispatch('openInIde');
  }

  function handleViewDeployment() {
    dispatch('viewDeployment');
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 {className}">
  <div class="flex items-start space-x-6">
    <div class="flex-shrink-0">
      <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
        <Icon icon={getFrameworkIcon(project?.framework)} class="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
    </div>
    <div class="flex-1 min-w-0">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {project?.name}
      </h2>
      <p class="text-slate-600 dark:text-slate-400 mb-4 font-mono text-sm">
        {project?.path}
      </p>
      
      <div class="flex flex-wrap gap-2 mb-4">
        {#if project?.framework}
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Icon icon={getFrameworkIcon(project.framework)} class="w-4 h-4 mr-1" />
            {project.framework}
          </span>
        {/if}
        {#if project?.deployment}
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Icon icon="devicon:kubernetes" class="w-4 h-4 mr-1" />
            {project.deployment}
          </span>
        {/if}
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
          <Icon icon="mdi:calendar" class="w-4 h-4 mr-1" />
          Added {formatDate(project?.created_at)}
        </span>
      </div>
      
      <div class="flex space-x-2">
        <Button onclick={handleOpenInExplorer}>
          <Icon icon="mdi:folder-open" class="w-4 h-4 mr-2" />
          Open in Explorer
        </Button>
        {#if project?.framework}
          <Button variant="outline" onclick={handleOpenInIde}>
            <Icon icon="mdi:code-braces" class="w-4 h-4 mr-2" />
            Open in IDE
          </Button>
        {/if}
        {#if project?.deployment}
          <Button variant="outline" onclick={handleViewDeployment}>
            <Icon icon="devicon:kubernetes" class="w-4 h-4 mr-2" />
            View Deployment
          </Button>
        {/if}
      </div>
    </div>
  </div>
</div>
