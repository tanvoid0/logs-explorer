<script lang="ts">
  import { cn } from "$lib/utils/index";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{
    change: { value: number };
    input: { value: number };
  }>();

  const { 
    value = 0,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    showValue = true,
    showLabels = false,
    minLabel = "",
    maxLabel = "",
    className = ""
  } = $props<{
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    showValue?: boolean;
    showLabels?: boolean;
    minLabel?: string;
    maxLabel?: string;
    className?: string;
  }>();

  let internalValue = $state(value);
  let isDragging = $state(false);

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    internalValue = newValue;
    dispatch('input', { value: newValue });
  }

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    internalValue = newValue;
    dispatch('change', { value: newValue });
  }

  function handleMouseDown() {
    isDragging = true;
  }

  function handleMouseUp() {
    isDragging = false;
  }

  // Update internal value when prop changes
  $effect(() => {
    internalValue = value;
  });

  // Calculate percentage for styling
  const percentage = $derived.by(() => {
    return ((internalValue - min) / (max - min)) * 100;
  });

  // Add event listeners for drag state
  if (typeof window !== 'undefined') {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
  }
</script>

<div class={cn("space-y-2", className)}>
  {#if showLabels && (minLabel || maxLabel)}
    <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400">
      <span>{minLabel || min}</span>
      <span>{maxLabel || max}</span>
    </div>
  {/if}
  
  <div class="relative">
    <input
      type="range"
      {min}
      {max}
      {step}
      {disabled}
      value={internalValue}
      oninput={handleInput}
      onchange={handleChange}
      onmousedown={handleMouseDown}
      ontouchstart={handleMouseDown}
      class={cn(
        "w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed",
        isDragging && "cursor-grabbing"
      )}
      style="background: linear-gradient(to right, #3b82f6 0%, #3b82f6 {percentage}%, #e2e8f0 {percentage}%, #e2e8f0 100%)"
    />
    
    <!-- Custom thumb styling -->
    <div
      class={cn(
        "absolute top-1/2 w-4 h-4 bg-blue-600 rounded-full shadow transform -translate-y-1/2 pointer-events-none",
        disabled && "opacity-50"
      )}
      style="left: {percentage}%"
    ></div>
  </div>
  
  {#if showValue}
    <div class="text-center">
      <span class="text-sm font-medium text-slate-900 dark:text-white">
        {internalValue}
      </span>
    </div>
  {/if}
</div>

<style>
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #2563eb;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  input[type="range"]::-moz-range-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #2563eb;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  input[type="range"]::-ms-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #2563eb;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>
