<script lang="ts">
  import { cn } from "$lib/utils";

  const { className = "", children } = $props<{
    className?: string;
    children?: () => any;
  }>();
</script>

<h3 class={cn("text-lg font-semibold leading-none tracking-tight", className)}>
  {@render children?.()}
</h3>
