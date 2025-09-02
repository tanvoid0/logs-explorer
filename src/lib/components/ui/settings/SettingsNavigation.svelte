<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { Badge } from '$lib/components/ui/feedback/index.js';

  const { 
    currentSection = 'namespaces',
    className = ""
  } = $props<{
    currentSection?: 'namespaces' | 'general' | 'connection' | 'ides' | 'framework-ides' | 'automation';
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  const sections = [
    {
      id: 'namespaces' as const,
      label: 'Namespaces',
      description: 'Manage Kubernetes namespaces',
      icon: '📁',
      badge: null
    },
    {
      id: 'general' as const,
      label: 'General',
      description: 'General application settings',
      icon: '⚙️',
      badge: null
    },
    {
      id: 'connection' as const,
      label: 'Connection',
      description: 'Kubernetes connection settings',
      icon: '🔗',
      badge: null
    },
    {
      id: 'ides' as const,
      label: 'IDEs',
      description: 'Configure integrated development environments',
      icon: '💻',
      badge: null
    },
    {
      id: 'framework-ides' as const,
      label: 'Framework IDEs',
      description: 'Framework to IDE mappings',
      icon: '🔧',
      badge: null
    },
    {
      id: 'automation' as const,
      label: 'Automation',
      description: 'Pipeline and automation settings',
      icon: '🤖',
      badge: null
    }
  ];

  function handleSectionClick(sectionId: typeof currentSection) {
    if (sectionId !== currentSection) {
      dispatch('change', { section: sectionId });
    }
  }
</script>

<nav class="space-y-1 {className}">
  {#each sections as section}
    <button
      type="button"
      onclick={() => handleSectionClick(section.id)}
      class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {currentSection === section.id 
        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' 
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}"
    >
      <span class="mr-3 text-lg">{section.icon}</span>
      <div class="flex-1 text-left">
        <div class="flex items-center">
          <span class="font-medium">{section.label}</span>
          {#if section.badge}
            <Badge variant="secondary" size="sm" className="ml-2">
              {section.badge}
            </Badge>
          {/if}
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {section.description}
        </p>
      </div>
    </button>
  {/each}
</nav>
