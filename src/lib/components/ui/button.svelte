<script lang="ts">
  import { cn } from "$lib/utils";

  type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  type Size = "default" | "sm" | "lg" | "icon";

  const props = $props<{
    variant?: Variant;
    size?: Size;
    class?: string;
    className?: string;
    disabled?: boolean;
    title?: string;
    type?: "button" | "submit" | "reset";
    loading?: boolean;
    children?: () => any;
    onclick?: (event: MouseEvent) => void;
    onkeydown?: (event: KeyboardEvent) => void;
    onsubmit?: (event: SubmitEvent) => void;
  }>();
  
  const variant = (props.variant ?? "default") as Variant;
  const size = (props.size ?? "default") as Size;
  const className = props.class || props.className || "";
  const disabled = props.disabled;
  const title = props.title;
  const type = props.type ?? "button";
  const loading = props.loading ?? false;
  const children = props.children;
  const rest = props;

  const variants: Record<Variant, string> = {
    default: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
    destructive: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
    outline: "border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
    ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:bg-slate-100",
    link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
  };

  const sizes: Record<Size, string> = {
    default: "h-10 px-4 py-2 rounded-md",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10 rounded-md"
  };
</script>

<button
  type={type}
  class={cn(
    "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  )}
  disabled={disabled || loading}
  title={title}
  {...rest}
>
  {#if loading}
    <svg class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  {/if}
  {@render children?.()}
</button>
