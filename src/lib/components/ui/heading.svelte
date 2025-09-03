<script lang="ts">
  import { cn } from "$lib/utils/index";

  type Level = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  type Variant = "default" | "muted" | "emphasized";

  const { 
    level = "h1",
    variant = "default",
    className = "",
    children 
  } = $props<{
    level?: Level;
    variant?: Variant;
    className?: string;
    children?: () => any;
  }>();

  const variants: Record<Variant, string> = {
    default: "text-slate-900 dark:text-white",
    muted: "text-slate-600 dark:text-slate-400",
    emphasized: "text-slate-900 dark:text-white font-semibold"
  };

  const levels: Record<Level, string> = {
    h1: "text-2xl font-bold",
    h2: "text-xl font-semibold",
    h3: "text-lg font-semibold",
    h4: "text-base font-medium",
    h5: "text-sm font-medium",
    h6: "text-xs font-medium"
  };

  const variantClass = variants[variant as Variant];
  const levelClass = levels[level as Level];
</script>

<svelte:element this={level} class={cn(variantClass, levelClass, className)}>
  {@render children?.()}
</svelte:element>
