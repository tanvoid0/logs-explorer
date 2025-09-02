<script lang="ts">
  import { cn } from "$lib/utils";
  
  let { className = "" } = $props<{
  className?: string;
}>();
</script>

<th class={cn("h-12 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400 [&:has([role=checkbox])]:pr-0", className)}>
  <slot />
</th>
