<script lang="ts">
  import { cn } from "$lib/utils";

  type StatusType = "default" | "online" | "offline" | "away" | "busy" | "pending";

  const { 
    status = "default", 
    size = "default", 
    className = "",
    children
  } = $props<{
    status?: StatusType;
    size?: "sm" | "default" | "lg";
    className?: string;
    children?: () => any;
  }>();

  const statusConfig: Record<StatusType, { color: string; label: string }> = {
    default: { color: "bg-slate-400", label: "Default" },
    online: { color: "bg-green-400", label: "Online" },
    offline: { color: "bg-slate-400", label: "Offline" },
    away: { color: "bg-yellow-400", label: "Away" },
    busy: { color: "bg-red-400", label: "Busy" },
    pending: { color: "bg-blue-400", label: "Pending" }
  };

  const sizes = {
    sm: "w-2 h-2",
    default: "w-3 h-3",
    lg: "w-4 h-4"
  };

  const config = $derived(statusConfig[status as StatusType]);
</script>

<div class={cn("flex items-center space-x-2", className)}>
  <div class={cn(
    "rounded-full",
    sizes[size as keyof typeof sizes],
    config.color
  )}></div>
  
  {#if children}
    <span class="text-sm text-slate-700 dark:text-slate-300">
      {@render children()}
    </span>
  {:else}
    <span class="text-sm text-slate-700 dark:text-slate-300">
      {config.label}
    </span>
  {/if}
</div>
