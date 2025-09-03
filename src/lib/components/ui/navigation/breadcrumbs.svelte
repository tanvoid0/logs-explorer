<script lang="ts">
  import { cn } from "$lib/utils";

  type BreadcrumbItem = {
    label: string;
    path?: string;
    icon?: string;
  };

  const { 
    items = [],
    separator = "/",
    className = "",
    showHome = true,
    onNavigate
  } = $props<{
    items: BreadcrumbItem[];
    separator?: string;
    className?: string;
    showHome?: boolean;
    onNavigate?: (path: string, index: number) => void;
  }>();

  const allItems = $derived.by(() => {
    if (showHome) {
      return [{ label: "Home", path: "/" }, ...items];
    }
    return items;
  });

  function handleItemClick(item: BreadcrumbItem, index: number) {
    if (item.path) {
      onNavigate?.(item.path, index);
    }
  }

  function isLastItem(index: number): boolean {
    return index === allItems.length - 1;
  }
</script>

<nav class={cn("flex items-center space-x-2 text-sm", className)} aria-label="Breadcrumb">
  {#each allItems as item, index}
    <div class="flex items-center">
      {#if index > 0}
        <span class="mx-2 text-slate-400 dark:text-slate-500">{separator}</span>
      {/if}
      
      {#if item.path && !isLastItem(index)}
        <button
          class="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          onclick={() => handleItemClick(item, index)}
        >
          {#if item.icon}
            <span class="mr-1">{item.icon}</span>
          {/if}
          {item.label}
        </button>
      {:else}
        <span class="text-slate-900 dark:text-white font-medium">
          {#if item.icon}
            <span class="mr-1">{item.icon}</span>
          {/if}
          {item.label}
        </span>
      {/if}
    </div>
  {/each}
</nav>
