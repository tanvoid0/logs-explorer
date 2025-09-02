<script lang="ts">
  import { cn } from "$lib/utils";

  const { className = "", children } = $props<{
    className?: string;
    children?: () => any;
  }>();
</script>

<td class={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}>
  {@render children?.()}
</td>
