<script lang="ts">
  const { 
    severityFilter, 
    disabled,
    onSeverityChange
  } = $props<{
    severityFilter: string;
    disabled: boolean;
    onSeverityChange?: (severity: string) => void;
  }>();
  
  let isDropdownOpen = $state(false);
  
  const severityOptions = [
    { value: "", label: "All Severities", icon: "📊" },
    { value: "ERROR", label: "Error", icon: "🚨" },
    { value: "WARNING", label: "Warning", icon: "⚠️" },
    { value: "INFO", label: "Info", icon: "ℹ️" },
    { value: "DEBUG", label: "Debug", icon: "🔍" }
  ];
  
  function handleSeveritySelect(severity: string) {
    onSeverityChange?.(severity);
    isDropdownOpen = false;
  }
  
  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isDropdownOpen = false;
    }
  }
  
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.severity-selector-container')) {
      isDropdownOpen = false;
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
  
  function getCurrentSeverityLabel() {
    const option = severityOptions.find(opt => opt.value === severityFilter);
    return option ? `${option.icon} ${option.label}` : "All Severities";
  }
</script>

<div class="space-y-2">
  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
    Severity Level
  </label>
  
  <div class="severity-selector-container relative">
    <button
      type="button"
      onclick={toggleDropdown}
      {disabled}
      class="w-full px-3 py-2 text-left bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm text-slate-900 dark:text-white">
          {getCurrentSeverityLabel()}
        </span>
        <svg class="w-4 h-4 text-slate-400 transform {isDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </button>

    {#if isDropdownOpen && !disabled}
      <div class="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg">
        <!-- Severity Options -->
        <div class="py-1">
          {#each severityOptions as option}
            <button
              type="button"
              onclick={() => handleSeveritySelect(option.value)}
              class="w-full flex items-center px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer {severityFilter === option.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}"
            >
              <span class="text-sm font-medium">
                {option.icon} {option.label}
              </span>
              {#if severityFilter === option.value}
                <svg class="ml-auto w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
