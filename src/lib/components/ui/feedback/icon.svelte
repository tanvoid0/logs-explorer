<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { 
    name = "", 
    size = "default", 
    className = "",
    children
  } = $props<{
    name?: string;
    size?: "sm" | "default" | "lg" | "xl";
    className?: string;
    children?: () => any;
  }>();

  const sizes = {
    sm: "w-4 h-4",
    default: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8"
  };
</script>

{#if children}
  <span class={cn("inline-flex items-center", sizes[size as keyof typeof sizes], className)}>
    {@render children()}
  </span>
{:else}
  <svg 
    class={cn("fill-current", sizes[size as keyof typeof sizes], className)}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <!-- Default icon content -->
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
{/if}
