<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { page, goto } from '$lib/utils/navigation';
  import { Button } from '../ui';

  const { className = "" } = $props<{className?: any }>();

  const dispatch = createEventDispatcher();

  // Navigation items
  const navigationItems = [
    { name: 'Overview', href: '/overview', icon: '📊' },
    { name: 'Logs', href: '/logs', icon: '📋' },
    { name: 'Workloads', href: '/workloads', icon: '☸️' },
    { name: 'Tasks', href: '/tasks', icon: '✅' },
    { name: 'Projects', href: '/projects', icon: '📁' },
    { name: 'SDK Manager', href: '/sdk-manager', icon: '🔧' },
    { name: 'Settings', href: '/settings', icon: '⚙️' }
  ];

  function handleNavigation(href: string) {
    dispatch('navigate', { href });
    goto(href);
  }

  function isActive(href: string): boolean {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
  }
</script>

<nav class="flex-1 px-4 py-2 {className}">
  <ul class="space-y-1">
    {#each navigationItems as item}
      <li>
        <Button
          onclick={() => handleNavigation(item.href)}
          class="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors {isActive(item.href) ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700'}"
          title={item.name}
        >
          <span class="text-lg">{item.icon}</span>
          <span>{item.name}</span>
        </Button>
      </li>
    {/each}
  </ul>
</nav>
