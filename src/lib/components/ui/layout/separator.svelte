<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { orientation = "horizontal", className = "" } = $props<{
    orientation?: "horizontal" | "vertical";
    className?: string;
  }>();

  const orientations = {
    horizontal: "h-px w-full",
    vertical: "h-full w-px"
  };
</script>

<div
  role="separator"
  aria-orientation={orientation}
  class={cn("shrink-0 bg-slate-200 dark:bg-slate-700", orientations[orientation as keyof typeof orientations], className)}
></div>
