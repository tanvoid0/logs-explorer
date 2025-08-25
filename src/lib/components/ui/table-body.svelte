<script lang="ts">
  import { cn } from "$lib/utils";
  
  let { class: className = "" } = $props<{
    class?: string;
  }>();
</script>

<tbody class={cn("[&_tr:last-child]:border-0", className)}>
  <slot />
</tbody>
