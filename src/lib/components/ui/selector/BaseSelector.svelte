<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { 
    options = [], 
    selectedValues = [], 
    placeholder = "Select option", 
    size = "default", 
    disabled = false, 
    label = "",
    className = "",
    onchange,
    onChange
  } = $props<{
    options: Array<{ value: string; label: string }>;
    selectedValues: string[];
    placeholder?: string;
    size?: "sm" | "default" | "lg";
    disabled?: boolean;
    label?: string;
    className?: string;
    onchange?: (event: CustomEvent) => void;
    onChange?: (event: CustomEvent) => void;
  }>();

  const sizes = {
    sm: "h-8 px-2 text-xs",
    default: "h-10 px-3 text-sm",
    lg: "h-12 px-4 text-base"
  };

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(target.selectedOptions).map(option => option.value);
    
    const customEvent = new CustomEvent('change', { detail: { value: selectedOptions } });
    
    if (onchange) {
      onchange(customEvent);
    }
    if (onChange) {
      onChange(customEvent);
    }
  }
</script>

{#if label}
  <label for="selector-{label}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    {label}
  </label>
{/if}

<select
  id="selector-{label}"
  multiple
  class={cn(
    "w-full border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
    sizes[size as keyof typeof sizes],
    className
  )}
  value={selectedValues}
  onchange={handleChange}
  disabled={disabled}
>
  <option value="" disabled>{placeholder}</option>
  {#each options as option}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
