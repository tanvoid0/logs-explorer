<script lang="ts">
  import { Badge } from '$lib/components/ui/feedback/index.js';

  const { 
    status = 'offline', 
    showLabel = true, 
    size = "default", 
    className = "" 
  } = $props<{
    status?: 'online' | 'offline' | 'loading' | 'error' | 'warning' | 'success';
    showLabel?: boolean;
    size?: "sm" | "default" | "lg";
    className?: string;
  }>();

  const statusConfig = {
    online: {
      color: 'success' as const,
      label: 'Online',
      icon: '●'
    },
    offline: {
      color: 'destructive' as const,
      label: 'Offline',
      icon: '●'
    },
    loading: {
      color: 'warning' as const,
      label: 'Loading',
      icon: '⟳'
    },
    error: {
      color: 'destructive' as const,
      label: 'Error',
      icon: '⚠'
    },
    warning: {
      color: 'warning' as const,
      label: 'Warning',
      icon: '⚠'
    },
    success: {
      color: 'success' as const,
      label: 'Success',
      icon: '✓'
    }
  };

  const config = $derived(statusConfig[status as keyof typeof statusConfig]);
</script>

<div class="flex items-center space-x-2 {className}">
  <Badge variant={config.color} {size}>
    <span class="mr-1">{config.icon}</span>
    {#if showLabel}
      {config.label}
    {/if}
  </Badge>
</div>
