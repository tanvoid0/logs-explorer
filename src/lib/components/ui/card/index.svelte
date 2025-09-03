<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { variant = "default", className = "", children } = $props<{
    variant?: "default" | "outlined" | "elevated";
    className?: string;
    children?: () => any;
  }>();

  const variants = {
    default: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
    outlined: "bg-transparent border border-slate-200 dark:border-slate-700",
    elevated: "bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
  };
</script>

<div class={cn("rounded-lg", variants[variant as keyof typeof variants], className)}>
  {@render children?.()}
</div>
