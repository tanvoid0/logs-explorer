<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { className = "", children } = $props<{
    className?: string;
    children?: () => any;
  }>();
</script>

<div class={cn("flex flex-col space-y-1.5 p-6", className)}>
  {@render children?.()}
</div>
