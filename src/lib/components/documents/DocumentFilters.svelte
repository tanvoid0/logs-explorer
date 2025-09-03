<script lang="ts">
  import { Input } from '$lib/components/ui/form/index.js';
  import { Badge } from '$lib/components/ui/feedback/index.js';
  import Button from '$lib/components/ui/button.svelte';
  import Icon from '@iconify/svelte';

  const { 
    searchQuery = '', 
    selectedTags = [], 
    selectedProject = null,
    availableTags = [],
    availableProjects = [],
    onSearchChange = () => {},
    onTagToggle = () => {},
    onProjectChange = () => {},
    onClearFilters = () => {},
    className = ""
  } = $props<{
    searchQuery: string;
    selectedTags: string[];
    selectedProject: number | null;
    availableTags: string[];
    availableProjects: Array<{ id: number; name: string }>;
    onSearchChange: (query: string) => void;
    onTagToggle: (tag: string) => void;
    onProjectChange: (projectId: number | null) => void;
    onClearFilters: () => void;
    className?: string;
  }>();

  function handleClearFilters() {
    onClearFilters();
  }

  function hasActiveFilters() {
    return searchQuery.trim() !== '' || selectedTags.length > 0 || selectedProject !== null;
  }
</script>

<div class="space-y-6 {className}">
  <!-- Search Bar -->
  <div class="relative">
    <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
    <Input
      type="text"
      placeholder="Search documents by title or content..."
      value={searchQuery}
      oninput={(e: Event) => onSearchChange((e.target as HTMLInputElement).value)}
              class="pl-10 pr-4 py-3 text-base"
    />
    {#if searchQuery.trim() !== ''}
      <button
        onclick={() => onSearchChange('')}
        class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
        title="Clear search"
      >
        <Icon icon="mdi:close" className="w-4 h-4 text-gray-400" />
      </button>
    {/if}
  </div>

  <!-- Active Filters Display -->
  {#if hasActiveFilters()}
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Active filters:</span>
      
      {#if searchQuery.trim() !== ''}
        <Badge variant="outline" className="text-sm">
          <Icon icon="mdi:magnify" className="w-3 h-3 mr-1" />
          "{searchQuery}"
          <button
            onclick={() => onSearchChange('')}
            class="ml-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
          >
            <Icon icon="mdi:close" className="w-3 h-3" />
          </button>
        </Badge>
      {/if}
      
      {#each selectedTags as tag}
        <Badge variant="outline" className="text-sm">
          <Icon icon="mdi:tag" className="w-3 h-3 mr-1" />
          {tag}
          <Button
            onclick={() => onTagToggle(tag)}
            className="ml-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
          >
            <Icon icon="mdi:close" className="w-3 h-3" />
          </Button>
        </Badge>
      {/each}
      
      {#if selectedProject !== null}
        <Badge variant="outline" className="text-sm">
          <Icon icon="mdi:folder" className="w-3 h-3 mr-1" />
          {availableProjects.find((p: any) => p.id === selectedProject)?.name || 'Unknown Project'}
          <Button
            onclick={() => onProjectChange(null)}
            className="ml-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
          >
            <Icon icon="mdi:close" className="w-3 h-3" />
          </Button>
        </Badge>
      {/if}
      
      <Button variant="outline" size="sm" onclick={handleClearFilters} className="ml-2">
        <Icon icon="mdi:filter-remove" className="w-4 h-4 mr-1" />
        Clear All
      </Button>
    </div>
  {/if}

  <!-- Filter Options -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Project Filter -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Filter by Project
      </label>
      <div class="space-y-2">
        <Button
          onclick={() => onProjectChange(null)}
          className="w-full text-left px-3 py-2 rounded-lg transition-colors {selectedProject === null ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}"
        >
          <div class="flex items-center gap-2">
            <Icon icon="mdi:folder-outline" className="w-4 h-4" />
            <span>All Projects</span>
            {#if selectedProject === null}
              <Icon icon="mdi:check" className="w-4 h-4 ml-auto text-blue-600" />
            {/if}
          </div>
        </Button>
        
        {#each availableProjects as project}
          <Button
            onclick={() => onProjectChange(project.id)}
            className="w-full text-left px-3 py-2 rounded-lg transition-colors {selectedProject === project.id ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}"
          >
            <div class="flex items-center gap-2">
              <Icon icon="mdi:folder" className="w-4 h-4" />
              <span>{project.name}</span>
              {#if selectedProject === project.id}
                <Icon icon="mdi:check" className="w-4 h-4 ml-auto text-blue-600" />
              {/if}
            </div>
          </Button>
        {/each}
      </div>
    </div>

    <!-- Tags Filter -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Filter by Tags
      </label>
      <div class="flex flex-wrap gap-2">
        {#each availableTags as tag}
          <Button
            onclick={() => onTagToggle(tag)}
            className="px-3 py-2 text-sm rounded-lg transition-colors {selectedTags.includes(tag) ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
          >
            <div class="flex items-center gap-2">
              <Icon icon="mdi:tag" className="w-3 h-3" />
              {tag}
              {#if selectedTags.includes(tag)}
                <Icon icon="mdi:check" className="w-3 h-3 text-blue-600" />
              {/if}
            </div>
          </Button>
        {/each}
      </div>
    </div>
  </div>
</div>
