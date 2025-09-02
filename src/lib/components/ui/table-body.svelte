<script lang="ts">
  import { cn } from "$lib/utils";
  
  let { className = "" } = $props<{
  className?: string;
}>();
</script>

<tbody class={cn("[&_tr:last-child]:border-0", className)}>
  <slot />
</tbody>
