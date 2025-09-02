<script lang="ts">
  import { cn } from "$lib/utils";
  import Button from "../button.svelte";

  const { 
    title = "Settings", 
    description = "", 
    loading = false, 
    className = "",
    onsave,
    onreset,
    children
  } = $props<{
    title?: string;
    description?: string;
    loading?: boolean;
    className?: string;
    onsave?: () => void;
    onreset?: () => void;
    children?: () => any;
  }>();

  function handleSave() {
    if (onsave) {
      onsave();
    }
  }

  function handleReset() {
    if (onreset) {
      onreset();
    }
  }
</script>

<div class={cn("space-y-6", className)}>
  <div class="border-b border-slate-200 dark:border-slate-700 pb-4">
    <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
    {#if description}
      <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
    {/if}
  </div>

  <div class="space-y-4">
    {@render children?.()}
  </div>

  <div class="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
    <Button 
      type="button"
      variant="outline"
      onclick={handleReset}
      disabled={loading}
    >
      Reset
    </Button>
    <Button 
      type="submit"
      loading={loading}
      onclick={handleSave}
    >
      Save Changes
    </Button>
  </div>
</div>
