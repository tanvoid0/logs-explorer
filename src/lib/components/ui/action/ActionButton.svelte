<script lang="ts">
  import { cn } from "$lib/utils";
  import Button from "../button.svelte";
  import Icon from '@iconify/svelte';

  type ActionType = "add" | "edit" | "delete" | "save" | "cancel" | "close" | "refresh" | "export" | "import";

  const { 
    action, 
    label, 
    variant, 
    size = "default", 
    disabled = false, 
    className = "",
    loading = false,
    children,
    onclick,
    onkeydown,
    onsubmit
  } = $props<{
    action: ActionType;
    label?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    disabled?: boolean;
    className?: string;
    loading?: boolean;
    children?: () => any;
    onclick?: (event: MouseEvent) => void;
    onkeydown?: (event: KeyboardEvent) => void;
    onsubmit?: (event: SubmitEvent) => void;
  }>();

  const actionConfig: Record<ActionType, { icon: string; defaultLabel: string; defaultVariant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" }> = {
    add: { icon: "mdi:plus", defaultLabel: "Add", defaultVariant: "default" },
    edit: { icon: "mdi:pencil", defaultLabel: "Edit", defaultVariant: "outline" },
    delete: { icon: "mdi:delete", defaultLabel: "Delete", defaultVariant: "destructive" },
    save: { icon: "mdi:content-save", defaultLabel: "Save", defaultVariant: "default" },
    cancel: { icon: "mdi:close", defaultLabel: "Cancel", defaultVariant: "outline" },
    close: { icon: "mdi:close", defaultLabel: "Close", defaultVariant: "ghost" },
    refresh: { icon: "mdi:refresh", defaultLabel: "Refresh", defaultVariant: "outline" },
    export: { icon: "mdi:download", defaultLabel: "Export", defaultVariant: "outline" },
    import: { icon: "mdi:upload", defaultLabel: "Import", defaultVariant: "outline" }
  };

  const config = $derived(actionConfig[action as ActionType]);
  const displayLabel = $derived(label || config.defaultLabel);
  const displayVariant = $derived(variant || config.defaultVariant);
</script>

<Button
  variant={displayVariant}
  size={size}
  disabled={disabled}
  className={className}
  loading={loading}
  {onclick}
  {onkeydown}
  {onsubmit}
>
  <Icon icon={config.icon} class="w-4 h-4 mr-2" />
  {#if children}
    {@render children()}
  {:else}
    {displayLabel}
  {/if}
</Button>
