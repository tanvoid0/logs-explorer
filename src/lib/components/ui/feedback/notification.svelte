<script lang="ts">
  import { cn } from "$lib/utils";

  const { 
    variant = "default", 
    title = "", 
    message = "", 
    className = "",
    children
  } = $props<{
    variant?: "default" | "success" | "warning" | "error" | "info";
    title?: string;
    message?: string;
    className?: string;
    children?: () => any;
  }>();

  const variants = {
    default: "bg-white border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100",
    success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100",
    error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100",
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100"
  };
</script>

<div class={cn(
  "rounded-lg border p-4 shadow-sm",
  variants[variant as keyof typeof variants], className)}>
  {#if title}
    <h4 class="font-medium mb-1">{title}</h4>
  {/if}
  
  {#if message}
    <p class="text-sm opacity-90">{message}</p>
  {/if}
  
  {#if children}
    <div class="mt-3">
      {@render children()}
    </div>
  {/if}
</div>
