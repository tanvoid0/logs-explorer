<script lang="ts">
  import { cn } from "$lib/utils";

  const { 
    type = "text",
    className = "",
    placeholder = "",
    disabled = false,
    ...rest 
  } = $props<{
    type?: string;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    [key: string]: any;
  }>();
</script>

<input
  type={type}
  class={cn(
    "flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white dark:ring-offset-slate-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  placeholder={placeholder}
  disabled={disabled}
  {...rest}
/>
