<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { className = "", children } = $props<{
    className?: string;
    children?: () => any;
  }>();
</script>

<select
  class={cn(
    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300",
    className
  )}
>
  {@render children?.()}
</select>
