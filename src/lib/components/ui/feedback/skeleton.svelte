<script lang="ts">
  import { cn } from "$lib/utils/index";

  type SkeletonVariant = "default" | "text" | "avatar" | "button" | "card";

  const { 
    className = "",
    variant = "default",
    lines = 1,
    animated = true
  } = $props<{
    className?: string;
    variant?: SkeletonVariant;
    lines?: number;
    animated?: boolean;
  }>();

  const variants: Record<SkeletonVariant, string> = {
    default: "h-4 bg-slate-200 dark:bg-slate-700 rounded",
    text: "h-4 bg-slate-200 dark:bg-slate-700 rounded",
    avatar: "w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full",
    button: "h-10 w-20 bg-slate-200 dark:bg-slate-700 rounded",
    card: "h-32 bg-slate-200 dark:bg-slate-700 rounded-lg"
  };

  const animationClass = animated ? "animate-pulse" : "";
  const variantClass = variants[variant as SkeletonVariant];
</script>

{#if variant === "text" && lines > 1}
  <div class={cn("space-y-2", className)}>
    {#each Array(lines) as _, i}
      <div class={cn(variantClass, animationClass, i === lines - 1 ? "w-3/4" : "w-full")}></div>
    {/each}
  </div>
{:else}
  <div class={cn(variantClass, animationClass, className)}></div>
{/if}
