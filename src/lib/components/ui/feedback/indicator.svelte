<script lang="ts">
  import { cn } from "$lib/utils";

  const { 
    variant = "default", 
    size = "default", 
    className = "",
    children
  } = $props<{
    variant?: "default" | "success" | "warning" | "error" | "info";
    size?: "sm" | "default" | "lg";
    className?: string;
    children?: () => any;
  }>();

  const variants = {
    default: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    default: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };
</script>

<span class={cn(
  "inline-flex items-center rounded-full font-medium",
  variants[variant as keyof typeof variants],
  sizes[size as keyof typeof sizes], className)}>
  {#if children}
    {@render children()}
  {:else}
    {variant.charAt(0).toUpperCase() + variant.slice(1)}
  {/if}
</span>
