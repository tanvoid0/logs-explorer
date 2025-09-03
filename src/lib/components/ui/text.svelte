<script lang="ts">
  import { cn } from "$lib/utils/index";

  type Variant = "default" | "muted" | "small" | "large";

  const { 
    variant = "default",
    className = "",
    children 
  } = $props<{
    variant?: Variant;
    className?: string;
    children?: () => any;
  }>();

  const variants: Record<Variant, string> = {
    default: "text-slate-700 dark:text-slate-300",
    muted: "text-slate-500 dark:text-slate-400",
    small: "text-sm text-slate-600 dark:text-slate-400",
    large: "text-base text-slate-700 dark:text-slate-300"
  };

  const variantClass = variants[variant as Variant];
</script>

<p class={cn(variantClass, className)}>
  {@render children?.()}
</p>
