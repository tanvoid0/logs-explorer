<script lang="ts">
  import { cn } from "$lib/utils";

  const { className = "", children } = $props<{
    className?: string;
    children?: () => any;
  }>();
</script>

<thead class={cn("[&_tr]:border-b", className)}>
  {@render children?.()}
</thead>
