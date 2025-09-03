<script lang="ts">
  import { cn } from "$lib/utils/index";

  const variantClasses = {
    default: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    error: "bg-red-600"
  } as const;

  type Variant = keyof typeof variantClasses;

  const sizeClasses = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3"
  } as const;

  const { 
    value = 0, 
    max = 100, 
    variant = "default",
    size = "default",
    className = "" 
  } = $props<{
    value?: number;
    max?: number;
    variant?: Variant;
    size?: "sm" | "default" | "lg";
    className?: string;
  }>();

  const percentage = $derived(max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0);
</script>

<div class={cn("w-full bg-gray-200 rounded-full dark:bg-gray-700", sizeClasses[size], className)}>
  <div 
    class={cn("rounded-full transition-all duration-300", variantClasses[variant])}
    style="width: {percentage}%"
  ></div>
</div>
