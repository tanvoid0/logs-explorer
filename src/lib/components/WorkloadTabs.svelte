<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/button.svelte';

  // Tab navigation
  const tabs = [
    { id: 'overview', label: 'Overview', route: '/workloads', icon: '☸️' },
    { id: 'deployments', label: 'Deployments', route: '/workloads/deployments', icon: '🚀' },
    { id: 'jobs', label: 'Jobs', route: '/workloads/jobs', icon: '⚡' },
    { id: 'configs', label: 'Configs', route: '/workloads/configs', icon: '⚙️' }
  ];

  function navigateToTab(tabRoute: string) {
    goto(tabRoute);
  }

  function isActiveTab(tabRoute: string): boolean {
    const currentPath = $page.url.pathname;
    // Special handling for overview tab (exact match for /workloads)
    if (tabRoute === '/workloads') {
      return currentPath === '/workloads';
    }
    // For other tabs, check if current path starts with the tab route
    return currentPath.startsWith(tabRoute);
  }
</script>

<!-- Tab Navigation -->
<div class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
  <div class="px-6">
    <nav class="flex space-x-8">
      {#each tabs as tab}
        <button
          onclick={() => navigateToTab(tab.route)}
          class="flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors {isActiveTab(tab.route) 
            ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}"
        >
          <span class="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      {/each}
    </nav>
  </div>
</div>
