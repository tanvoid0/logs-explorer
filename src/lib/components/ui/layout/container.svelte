<script lang="ts">
  import { cn } from "$lib/utils";

  const { maxWidth = "default", className = "", children } = $props<{
    maxWidth?: "sm" | "default" | "lg" | "xl" | "2xl" | "full";
    className?: string;
    children?: () => any;
  }>();

  const maxWidths = {
    sm: "max-w-3xl",
    default: "max-w-7xl",
    lg: "max-w-7xl",
    xl: "max-w-7xl",
    "2xl": "max-w-7xl",
    full: "max-w-full"
  };
</script>

<div class={cn("mx-auto px-4 sm:px-6 lg:px-8", maxWidths[maxWidth as keyof typeof maxWidths], className)}>
  {@render children?.()}
</div>
