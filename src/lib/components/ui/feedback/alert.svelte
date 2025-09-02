<script lang="ts">
  import { cn } from "$lib/utils";

  const { variant = "default", className = "", children } = $props<{
    variant?: "default" | "destructive" | "warning" | "info";
    className?: string;
    children?: () => any;
  }>();

  const variants = {
    default: "bg-slate-50 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700",
    destructive: "bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-800",
    warning: "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-100 dark:border-yellow-800",
    info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-800"
  };
</script>

<div class={cn("relative w-full rounded-lg border p-4", variants[variant as keyof typeof variants], className)}>
  {@render children?.()}
</div>
