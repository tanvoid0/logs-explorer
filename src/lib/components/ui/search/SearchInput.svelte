<script lang="ts">
  import { cn } from "$lib/utils/index";
  import Button from "../button.svelte";

  const { 
    placeholder = "Search...", 
    value = "", 
    size = "default", 
    loading = false, 
    disabled = false,
    className = "",
    onSearch,
    onClear,
    onchange
  } = $props<{
    placeholder?: string;
    value?: string;
    size?: "sm" | "default" | "lg";
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    onSearch?: (query: string) => void;
    onClear?: () => void;
    onchange?: (query: string) => void;
  }>();

  let searchValue = $state(value);

  function handleSearch() {
    if (onSearch) {
      onSearch(searchValue);
    }
  }

  function handleClear() {
    searchValue = "";
    if (onClear) {
      onClear();
    }
  }

  function handleInputChange() {
    if (onchange) {
      onchange(searchValue);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }
</script>

<div class={cn("relative flex items-center space-x-2", className)}>
  <div class="relative flex-1">
    <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
    </svg>
    <input
      type="text"
      placeholder={placeholder}
      bind:value={searchValue}
      onkeydown={handleKeyDown}
      onchange={handleInputChange}
      class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md bg-white text-sm transition-colors placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:placeholder:text-slate-400 dark:focus:ring-slate-500"
      disabled={disabled || loading}
    />
  </div>
  
  <Button 
    variant="outline" 
    size={size}
    onclick={handleSearch}
    loading={loading}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
    </svg>
  </Button>
  
  {#if searchValue}
    <Button 
      variant="ghost" 
      size={size}
      onclick={handleClear}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </Button>
  {/if}
</div>
