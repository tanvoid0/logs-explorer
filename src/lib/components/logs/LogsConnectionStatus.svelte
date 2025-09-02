<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { StatusIndicator } from '$lib/components/ui/status/index.js';
  import { ActionGroup } from '$lib/components/ui/action/index.js';
  import { Card, CardContent } from '$lib/components/ui/card/index.js';

  const { isConnected = false, className = "" } = $props<{
    isConnected?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  const actions = [
    { action: 'refresh' as const },
    { action: 'export' as const }
  ];

  function handleAction(event: CustomEvent) {
    const { action } = event.detail;
    dispatch('action', { action });
  }
</script>

<Card className={className}>
  <CardContent className="p-4">
    <div class="flex items-center justify-between">
      <StatusIndicator 
        status={isConnected ? 'online' : 'offline'}
        showLabel={true}
      />
      <ActionGroup 
        {actions}
        on:action={handleAction}
      />
    </div>
  </CardContent>
</Card>
