<script lang="ts">
  import { cn } from "$lib/utils/index";

  type Size = "default" | "sm" | "lg";

  const { 
    size = "default", 
    className = "", 
    disabled = false,
    value = "",
    children,
    onchange
  } = $props<{
    size?: Size;
    className?: string;
    disabled?: boolean;
    value?: string | number;
    children?: () => any;
    onchange?: (event: Event) => void;
  }>();

  const sizes: Record<Size, string> = {
    default: "h-10 px-3 py-2 text-sm",
    sm: "h-9 px-2 py-1 text-xs",
    lg: "h-11 px-4 py-3 text-base"
  };

  const sizeClass = sizes[size as Size];
</script>

<select
  class={cn(
    "flex w-full rounded-md border border-slate-200 bg-white ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300",
    sizeClass,
    className
  )}
  {disabled}
  {value}
  {onchange}
>
  {@render children?.()}
</select>
