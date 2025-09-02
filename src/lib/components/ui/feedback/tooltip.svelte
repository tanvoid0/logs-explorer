<script lang="ts">
  import { cn } from "$lib/utils";

  const { 
    content = "", 
    position = "top", 
    className = "",
    children
  } = $props<{
    content?: string;
    position?: "top" | "bottom" | "left" | "right";
    className?: string;
    children?: () => any;
  }>();

  const positions = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2"
  };

  const arrows = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-t-slate-900",
    bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-b-slate-900",
    left: "left-full top-1/2 transform -translate-y-1/2 border-l-slate-900",
    right: "right-full top-1/2 transform -translate-y-1/2 border-r-slate-900"
  };
</script>

<div class="relative group inline-block">
  {#if children}
    {@render children()}
  {:else}
    <span class="cursor-help underline decoration-dotted">
      Hover me
    </span>
  {/if}
  
  <div class={cn(
    "absolute z-50 px-3 py-2 text-sm text-white bg-slate-900 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
    positions[position as keyof typeof positions], className)}>
    {content}
    <div class={cn(
      "absolute w-0 h-0 border-4 border-transparent",
      arrows[position as keyof typeof arrows]
    )}></div>
  </div>
</div>
