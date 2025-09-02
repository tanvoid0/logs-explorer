<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ModalBuilder from './ModalBuilder.svelte';
  import { Alert } from '$lib/components/ui/feedback/index.js';

  const { isOpen = false, title = "Confirm Action", message = "Are you sure you want to proceed?", confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "default", loading = false, className = "" } = $props<{isOpen?: boolean; title?: string; message?: string; confirmLabel?: string; cancelLabel?: string; variant?: "default" | "warning" | "destructive"; loading?: boolean; className?: string }>();

  const dispatch = createEventDispatcher();

  const variantConfig = {
    default: {
      icon: "ℹ️",
      alertVariant: "default" as const,
      confirmVariant: "default" as const
    },
    warning: {
      icon: "⚠️",
      alertVariant: "warning" as const,
      confirmVariant: "outline" as const
    },
    destructive: {
      icon: "🗑️",
      alertVariant: "destructive" as const,
      confirmVariant: "destructive" as const
    }
  };

  const config = variantConfig[variant as keyof typeof variantConfig];

  const actions = [
    {
      key: "cancel",
      label: cancelLabel,
      variant: "outline" as const,
      size: "default" as const
    },
    {
      key: "confirm",
      label: confirmLabel,
      variant: config.confirmVariant,
      size: "default" as const,
      primary: true,
      loading
    }
  ];

  function handleClose() {
    dispatch('close');
  }

  function handleAction(event: CustomEvent) {
    const { action } = event.detail;
    dispatch('action', { action });
  }
</script>

<ModalBuilder
  {isOpen}
  {title}
  size="sm"
  {actions}
  {loading}
  {className}
  on:close={handleClose}
  on:action={handleAction}
>
  <div class="space-y-4">
    <div class="flex items-start space-x-3">
      <span class="text-2xl">{config.icon}</span>
      <div class="flex-1">
        <Alert
          variant={config.alertVariant}
        >
          <div>
            <p class="text-sm text-slate-700 dark:text-slate-200">{message}</p>
          </div>
        </Alert>
      </div>
    </div>
  </div>
</ModalBuilder>
