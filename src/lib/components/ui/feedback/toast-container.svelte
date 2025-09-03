<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { className = "", children } = $props<{
    className?: string;
    children?: () => any;
  }>();
</script>

<div class={cn(
  "fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full",
  className
)}>
  {@render children?.()}
</div>
