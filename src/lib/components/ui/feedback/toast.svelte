<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { 
    variant = "default", 
    title = "", 
    description = "", 
    className = "",
    children
  } = $props<{
    variant?: "default" | "success" | "warning" | "error";
    title?: string;
    description?: string;
    className?: string;
    children?: () => any;
  }>();

  const variants = {
    default: "bg-white border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100",
    success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100",
    error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100"
  };
</script>

<div class={cn(
  "relative w-full rounded-lg border p-4 shadow-lg",
  variants[variant as keyof typeof variants],
  className
)}>
  {#if title || description}
    <div class="flex flex-col space-y-1">
      {#if title}
        <h4 class="text-sm font-semibold">{title}</h4>
      {/if}
      {#if description}
        <p class="text-sm opacity-90">{description}</p>
      {/if}
    </div>
  {/if}
  
  {#if children}
    <div class="mt-2">
      {@render children()}
    </div>
  {/if}
</div>
