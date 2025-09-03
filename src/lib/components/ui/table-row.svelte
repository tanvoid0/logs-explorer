<script lang="ts">
  import { cn } from "$lib/utils/index";
  
  let { className = "" } = $props<{
  className?: string;
}>();
</script>

<tr class={cn("border-b transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 data-[state=selected]:bg-slate-50 dark:data-[state=selected]:bg-slate-800", className)}>
  <slot />
</tr>
