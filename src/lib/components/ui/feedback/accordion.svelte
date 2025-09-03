<script lang="ts">
  import { cn } from "$lib/utils";

  type AccordionItem = {
    title: string;
    content: string | (() => any);
    icon?: string;
    disabled?: boolean;
  };

  const { 
    items = [],
    multiple = false,
    defaultOpen = [],
    className = "",
    onToggle
  } = $props<{
    items: AccordionItem[];
    multiple?: boolean;
    defaultOpen?: number[];
    className?: string;
    onToggle?: (index: number, isOpen: boolean) => void;
  }>();

  let openItems = $state<Set<number>>(new Set(defaultOpen));

  function toggleItem(index: number) {
    const item = items[index];
    if (item?.disabled) return;

    if (multiple) {
      const newOpenItems = new Set(openItems);
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index);
      } else {
        newOpenItems.add(index);
      }
      openItems = newOpenItems;
    } else {
      openItems = openItems.has(index) ? new Set() : new Set([index]);
    }

    onToggle?.(index, openItems.has(index));
  }

  function isItemOpen(index: number): boolean {
    return openItems.has(index);
  }
</script>

<div class={cn("space-y-2", className)}>
  {#each items as item, index}
    <div class="border border-slate-200 dark:border-slate-700 rounded-lg">
      <button
        class={cn(
          "w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
          item.disabled && "opacity-50 cursor-not-allowed",
          isItemOpen(index) && "bg-slate-50 dark:bg-slate-800"
        )}
        onclick={() => toggleItem(index)}
        disabled={item.disabled}
      >
        <div class="flex items-center space-x-2">
          {#if item.icon}
            <span class="text-slate-500">{item.icon}</span>
          {/if}
          <span class="font-medium text-slate-900 dark:text-white">
            {item.title}
          </span>
        </div>
        
        <svg
          class={cn(
            "w-5 h-5 text-slate-500 transition-transform",
            isItemOpen(index) && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {#if isItemOpen(index)}
        <div class="px-4 pb-3 border-t border-slate-200 dark:border-slate-700">
          <div class="pt-3 text-slate-600 dark:text-slate-400">
            {#if typeof item.content === "string"}
              {item.content}
            {:else}
              {@render item.content()}
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>
