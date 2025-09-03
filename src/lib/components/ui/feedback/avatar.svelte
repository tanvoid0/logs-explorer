<script lang="ts">
  import { cn } from "$lib/utils/index";

  const { 
    src = "", 
    alt = "", 
    size = "default", 
    variant = "default", 
    className = "",
    children
  } = $props<{
    src?: string;
    alt?: string;
    size?: "sm" | "default" | "lg" | "xl";
    variant?: "default" | "rounded" | "square";
    className?: string;
    children?: () => any;
  }>();

  const sizes = {
    sm: "w-8 h-8",
    default: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const variants = {
    default: "rounded-full",
    rounded: "rounded-lg",
    square: "rounded-none"
  };
</script>

<div class={cn(
  "inline-block overflow-hidden bg-slate-100 dark:bg-slate-700",
  sizes[size as keyof typeof sizes],
  variants[variant as keyof typeof variants], className)}>
  {#if src}
    <img 
      src={src} 
      alt={alt} 
      class="w-full h-full object-cover"
    />
  {:else if children}
    <div class="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-400">
      {@render children()}
    </div>
  {:else}
    <div class="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-400">
      <svg class="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z"/>
      </svg>
    </div>
  {/if}
</div>
