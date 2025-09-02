<script lang="ts">
  const { 
    value = 0, 
    max = 100, 
    showLabel = true, 
    label = "", 
    variant = "default", 
    size = "default", 
    className = "" 
  } = $props<{
    value?: number;
    max?: number;
    showLabel?: boolean;
    label?: string;
    variant?: "default" | "success" | "warning" | "destructive";
    size?: "sm" | "default" | "lg";
    className?: string;
  }>();

  const variants = {
    default: "bg-slate-200 dark:bg-slate-700",
    success: "bg-green-200 dark:bg-green-700",
    warning: "bg-yellow-200 dark:bg-yellow-700",
    destructive: "bg-red-200 dark:bg-red-700"
  };

  const progressVariants = {
    default: "bg-slate-600 dark:bg-slate-400",
    success: "bg-green-600 dark:bg-green-400",
    warning: "bg-yellow-600 dark:bg-yellow-400",
    destructive: "bg-red-600 dark:bg-red-400"
  };

  const sizes = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3"
  };

  const percentage = $derived(Math.min(Math.max((value / max) * 100, 0), 100));
  const displayLabel = $derived(label || `${Math.round(percentage)}%`);
</script>

<div class="w-full {className}">
  {#if showLabel}
    <div class="flex justify-between items-center mb-1">
      <span class="text-sm text-slate-600 dark:text-slate-400">{displayLabel}</span>
      <span class="text-sm text-slate-600 dark:text-slate-400">{value}/{max}</span>
    </div>
  {/if}
  
  <div class="w-full {variants[variant as keyof typeof variants]} rounded-full overflow-hidden {sizes[size as keyof typeof sizes]}">
    <div 
      class="h-full {progressVariants[variant as keyof typeof progressVariants]} transition-all duration-300 ease-out"
      style="width: {percentage}%"
    ></div>
  </div>
</div>
