<script lang="ts">
  import { cn } from "$lib/utils/index";

  type Variant = "default" | "ghost" | "outline";
  type Size = "sm" | "default" | "lg";

  const { 
    variant = "default",
    size = "default",
    className = "",
    disabled = false,
    title = "",
    children,
    onclick,
    onkeydown,
    "aria-label": ariaLabel
  } = $props<{
    variant?: Variant;
    size?: Size;
    className?: string;
    disabled?: boolean;
    title?: string;
    children?: () => any;
    onclick?: (event: MouseEvent) => void;
    onkeydown?: (event: KeyboardEvent) => void;
    "aria-label"?: string;
  }>();

  const variants: Record<Variant, string> = {
    default: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
    ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
    outline: "border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
  };

  const sizes: Record<Size, string> = {
    sm: "p-1",
    default: "p-2",
    lg: "p-3"
  };

  const variantClass = variants[variant as Variant];
  const sizeClass = sizes[size as Size];
</script>

<button
  class={cn(
    "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variantClass,
    sizeClass,
    className
  )}
  {disabled}
  {title}
  {onclick}
  {onkeydown}
  aria-label={ariaLabel}
>
  {@render children?.()}
</button>
