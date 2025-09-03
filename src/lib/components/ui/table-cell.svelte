<script lang="ts">
  import { cn } from "$lib/utils/index";
  
  let { className = "" } = $props<{
  className?: string;
}>();
</script>

<td class={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}>
  <slot />
</td>
