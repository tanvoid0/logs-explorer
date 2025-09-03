<script lang="ts">
  import { cn } from "$lib/utils/index";

  type Variant = "default" | "card" | "section" | "header";

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
    default: "",
    card: "bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700",
    section: "p-6",
    header: "p-4 border-b border-slate-200 dark:border-slate-700"
  };

  const variantClass = variants[variant as Variant];
</script>

<div class={cn(variantClass, className)}>
  {@render children?.()}
</div>
