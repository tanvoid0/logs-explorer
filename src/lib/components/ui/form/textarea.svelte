<script lang="ts">
  import { cn } from "$lib/utils";

  let { 
    value = $bindable(""),
    className = "",
    rows = 3,
    placeholder = "",
    disabled = false,
    ...restProps 
  } = $props<{
    value?: string;
    className?: string;
    rows?: number;
    placeholder?: string;
    disabled?: boolean;
    [key: string]: any;
  }>();
</script>

<textarea
  class={cn(
    "flex min-h-[80px] w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white dark:ring-offset-slate-950 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  placeholder={placeholder}
  rows={rows}
  disabled={disabled}
  bind:value
  {...restProps}
></textarea>
