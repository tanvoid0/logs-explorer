<script lang="ts">
  import { cn } from "$lib/utils";

  const { className = "", children } = $props<{
    className?: string;
    children?: () => any;
  }>();
</script>

<div class={cn("relative w-full overflow-auto", className)}>
  <table class="w-full caption-bottom text-sm">
    {@render children?.()}
  </table>
</div>
