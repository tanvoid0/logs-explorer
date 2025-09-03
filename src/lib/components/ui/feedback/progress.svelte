<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { 
    value = 0, 
    max = 100, 
    size = "default", 
    variant = "default", 
    showLabel = true, 
    className = "",
    children
  } = $props<{
    value?: number;
    max?: number;
    size?: "sm" | "default" | "lg";
    variant?: "default" | "success" | "warning" | "error";
    showLabel?: boolean;
    className?: string;
    children?: () => any;
  }>();

  const percentage = $derived(Math.min(Math.max((value / max) * 100, 0), 100));

  const sizes = {
    sm: "h-2",
    default: "h-3",
    lg: "h-4"
  };

  const variants = {
    default: "bg-slate-200 dark:bg-slate-700",
    success: "bg-green-200 dark:bg-green-700",
    warning: "bg-yellow-200 dark:bg-yellow-700",
    error: "bg-red-200 dark:bg-red-700"
  };

  const progressVariants = {
    default: "bg-slate-600 dark:bg-slate-400",
    success: "bg-green-600 dark:bg-green-400",
    warning: "bg-yellow-600 dark:bg-yellow-400",
    error: "bg-red-600 dark:bg-red-400"
  };
</script>

<div class={cn("w-full", className)}>
  <div class="flex items-center justify-between mb-2">
    {#if showLabel}
      <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
        Progress
      </span>
      <span class="text-sm text-slate-500 dark:text-slate-400">
        {Math.round(percentage)}%
      </span>
    {/if}
  </div>
  
  <div class={cn(
    "w-full rounded-full overflow-hidden",
    sizes[size as keyof typeof sizes],
    variants[variant as keyof typeof variants]
  )}>
    <div 
      class={cn(
        "h-full transition-all duration-300 ease-in-out",
        progressVariants[variant as keyof typeof progressVariants]
      )}
      style="width: {percentage}%"
    ></div>
  </div>
  
  {#if children}
    <div class="mt-3">
      {@render children()}
    </div>
  {/if}
</div>
