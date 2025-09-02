<script lang="ts">
  import { cn } from "$lib/utils";

  const { 
    message = "Loading...", 
    size = "default", 
    className = "" 
  } = $props<{
    message?: string;
    size?: "sm" | "default" | "lg";
    className?: string;
  }>();

  const spinnerSizes: Record<string, string> = {
    sm: "w-4 h-4",
    default: "w-8 h-8",
    lg: "w-12 h-12"
  };

  const sizes: Record<string, string> = {
    sm: "text-sm",
    default: "text-base",
    lg: "text-lg"
  };
</script>

<div class={cn("flex flex-col items-center justify-center p-8", className)}>
  {#if size !== "sm"}
    <div class="flex justify-center mb-4">
      <div class="animate-spin rounded-full border-b-2 border-slate-600 {spinnerSizes[size]}"></div>
    </div>
  {/if}
  <p class="text-slate-600 dark:text-slate-400 {sizes[size]}">
    {message}
  </p>
</div>
