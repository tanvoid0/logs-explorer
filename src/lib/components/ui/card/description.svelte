<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { className = "", children } = $props<{
    className?: string;
    children?: () => any;
  }>();
</script>

<p class={cn("text-sm text-slate-600 dark:text-slate-400", className)}>
  {@render children?.()}
</p>
