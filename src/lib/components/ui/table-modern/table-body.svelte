<script lang="ts">
  import { cn } from "$lib/utils";

  const { className = "", children } = $props<{
    className?: string;
    children?: () => any;
  }>();
</script>

<tbody class={cn("[&_tr:last-child]:border-0", className)}>
  {@render children?.()}
</tbody>
