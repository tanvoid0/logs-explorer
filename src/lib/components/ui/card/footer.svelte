<script lang="ts">
  import { cn } from "$lib/utils";

  const { className = "", children } = $props<{
    className?: string;
    children?: () => any;
  }>();
</script>

<div class={cn("flex items-center p-6 pt-0", className)}>
  {@render children?.()}
</div>
