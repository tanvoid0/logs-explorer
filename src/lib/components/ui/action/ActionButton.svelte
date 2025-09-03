<script lang="ts">
  import { cn } from "$lib/utils";
  import Button from "../button.svelte";
  import Icon from '@iconify/svelte';

  type ActionType = "add" | "edit" | "delete" | "save" | "cancel" | "close" | "refresh" | "export" | "import" | "clearHistory" | "testClick" | "environmentCheck" | "openManagerDocs" | "installSDK" | "uninstallSDK" | "deploymentsChange" | "severityChange" | "logCountChange" | "sortOrderChange" | "traceIdChange" | "deploymentFilter" | "search";

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
    import: { icon: "mdi:upload", defaultLabel: "Import", defaultVariant: "outline" },
    clearHistory: { icon: "mdi:history", defaultLabel: "Clear History", defaultVariant: "outline" },
    testClick: { icon: "mdi:test-tube", defaultLabel: "Test", defaultVariant: "outline" },
    environmentCheck: { icon: "mdi:check-circle", defaultLabel: "Check Environment", defaultVariant: "outline" },
    openManagerDocs: { icon: "mdi:book-open", defaultLabel: "Open Docs", defaultVariant: "outline" },
    installSDK: { icon: "mdi:download", defaultLabel: "Install", defaultVariant: "default" },
    uninstallSDK: { icon: "mdi:delete", defaultLabel: "Uninstall", defaultVariant: "destructive" },
    deploymentsChange: { icon: "mdi:deployment", defaultLabel: "Deployments", defaultVariant: "outline" },
    severityChange: { icon: "mdi:alert-circle", defaultLabel: "Severity", defaultVariant: "outline" },
    logCountChange: { icon: "mdi:counter", defaultLabel: "Log Count", defaultVariant: "outline" },
    sortOrderChange: { icon: "mdi:sort", defaultLabel: "Sort Order", defaultVariant: "outline" },
    traceIdChange: { icon: "mdi:identifier", defaultLabel: "Trace ID", defaultVariant: "outline" },
    deploymentFilter: { icon: "mdi:filter", defaultLabel: "Deployment Filter", defaultVariant: "outline" },
    search: { icon: "mdi:magnify", defaultLabel: "Search", defaultVariant: "outline" }
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
