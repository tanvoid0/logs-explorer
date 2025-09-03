<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { 
    orientation = "horizontal", 
    className = "",
    children
  } = $props<{
    orientation?: "horizontal" | "vertical";
    className?: string;
    children?: () => any;
  }>();

  const orientations = {
    horizontal: "w-full h-px",
    vertical: "h-full w-px"
  };
</script>

<div class={cn("flex items-center", className)}>
  <div class="flex-1 border-t border-slate-300 dark:border-slate-600"></div>
  {#if children}
    <div class="px-3 text-sm text-slate-500 dark:text-slate-400">
      {@render children()}
    </div>
  {/if}
  <div class="flex-1 border-t border-slate-300 dark:border-slate-600"></div>
</div>
