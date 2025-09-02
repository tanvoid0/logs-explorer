<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const { selectedFramework = $bindable(), disabled } = $props<{
    selectedFramework: string | null;
    disabled: boolean;
  }>();

  const dispatch = createEventDispatcher();
  
  let searchQuery = $state("");
  let isDropdownOpen = $state(false);
  
  // Common frameworks list
  const frameworks = [
    // Java Ecosystem
    'Maven',
    'Gradle',
    
    // JavaScript/Node.js Ecosystem
    'Node.js',
    'Yarn',
    'pnpm',
    'React',
    'Vue.js',
    'Angular',
    'Next.js',
    'Nuxt.js',
    'Svelte',
    'Vite',
    'Webpack',
    'Rollup',
    
    // Python Ecosystem
    'Python',
    'Poetry',
    'Django',
    'Flask',
    'FastAPI',
    
    // Other Languages
    'Go',
    'Rust',
    'PHP',
    'Composer',
    'Ruby',
    'Swift',
    'Flutter',
    'Dart',
    
    // .NET
    '.NET',
    'ASP.NET',
    
    // DevOps & Infrastructure
    'Docker',
    'Kubernetes',
    'Terraform',
    'Ansible',
    'Make',
    'CMake',
    'Tauri',
    
    // Build Output
    'Build Output'
  ];
  
  // Filter frameworks based on search query
  let filteredFrameworks = $derived.by(() => {
    if (!searchQuery.trim()) {
      return frameworks;
    }
    return frameworks.filter((framework: string) => 
      framework.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  function handleFrameworkSelect(framework: string) {
    const newSelection = selectedFramework === framework ? null : framework;
    dispatch('frameworkChange', { framework: newSelection });
    isDropdownOpen = false;
    searchQuery = "";
  }

  function clearFramework() {
    dispatch('frameworkChange', { framework: null });
  }
  
  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
    if (!isDropdownOpen) {
      searchQuery = "";
    }
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isDropdownOpen = false;
      searchQuery = "";
    }
  }
  
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.framework-selector-container')) {
      isDropdownOpen = false;
      searchQuery = "";
    }
  }
  
  $effect(() => {
    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<div class="space-y-2">
  <label for="framework-selector" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
    Framework
  </label>
  
  <div class="framework-selector-container relative">
    <button
      id="framework-selector"
      type="button"
      onclick={toggleDropdown}
      {disabled}
      class="w-full px-3 py-2 text-left bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm text-slate-900 dark:text-white">
          {#if selectedFramework}
            {selectedFramework}
          {:else}
            Auto-detected or enter manually
          {/if}
        </span>
        <svg class="w-4 h-4 text-slate-400 transform {isDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </button>

    {#if isDropdownOpen && !disabled}
      <div class="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
        <!-- Search Input -->
        <div class="p-2 border-b border-slate-200 dark:border-slate-700">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search frameworks..."
            class="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <!-- Actions -->
        <div class="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div class="flex space-x-2">
            <button
              type="button"
              onclick={clearFramework}
              class="text-xs px-2 py-1 bg-slate-600 text-white rounded hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              Clear Selection
            </button>
          </div>
        </div>
        
        <!-- Framework Options -->
        <div class="py-1">
          {#if filteredFrameworks.length === 0}
            <div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              No frameworks found
            </div>
          {:else}
            {#each filteredFrameworks as framework}
              <button
                type="button"
                onclick={() => handleFrameworkSelect(framework)}
                class="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer {selectedFramework === framework ? 'bg-blue-50 dark:bg-blue-900/20' : ''}"
              >
                <div class="flex items-center">
                  <div class="w-4 h-4 mr-3 flex items-center justify-center">
                    {#if selectedFramework === framework}
                      <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                    {:else}
                      <div class="w-4 h-4 border border-slate-300 dark:border-slate-600 rounded"></div>
                    {/if}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {framework}
                    </div>
                  </div>
                </div>
              </button>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  <p class="text-xs text-slate-500 dark:text-slate-400">
    Framework will be auto-detected when path changes, or use the detect button
  </p>
</div>
