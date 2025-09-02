<script lang="ts">
  import { cn } from "$lib/utils";

  const { variant = "default", size = "default", className = "", label, children } = $props<{
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
    size?: "default" | "sm" | "lg";
    className?: string;
    label?: string;
    children?: () => any;
  }>();

  const variants = {
    default: "bg-slate-900 text-slate-50 hover:bg-slate-900/80 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/80",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-800/80",
    destructive: "bg-red-500 text-slate-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-slate-100 dark:hover:bg-red-900/80",
    outline: "text-slate-950 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-100",
    success: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600",
    warning: "bg-yellow-500 text-slate-900 hover:bg-yellow-600 dark:bg-yellow-600 dark:text-slate-900 dark:hover:bg-yellow-700"
  };

  const sizes = {
    default: "h-6 px-3 text-xs",
    sm: "h-5 px-2 text-xs",
    lg: "h-8 px-4 text-sm"
  };
</script>

<span class={cn("inline-flex items-center rounded-full font-medium", variants[variant as keyof typeof variants], sizes[size as keyof typeof sizes], className)}>
  {#if label}
    {label}
  {/if}
  {@render children?.()}
</span>
