<script lang="ts">
  import { cn } from "$lib/utils";
  import Table from "./table.svelte";
  import TableHeader from "./table-header.svelte";
  import TableBody from "./table-body.svelte";
  import TableRow from "./table-row.svelte";
  import TableHead from "./table-head.svelte";
  import TableCell from "./table-cell.svelte";

  // Props
  let { 
    data = [], 
    columns = [],
    class: className = "",
    title = "",
    emptyMessage = "No data found",
    loading = false
  } = $props<{
    data: Record<string, any>[];
    columns: Array<{
      key: string;
      label: string;
      sortable?: boolean;
      render?: (item: Record<string, any>) => string;
    }>;
    class?: string;
    title?: string;
    emptyMessage?: string;
    loading?: boolean;
  }>();

  // Local state
  let sortKey = $state("");
  let sortDirection = $state<"asc" | "desc">("asc");

  // Computed sorted data
  let sortedData = $derived(() => {
    if (!sortKey) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  });

  function handleSort(key: string) {
    if (sortKey === key) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDirection = "asc";
    }
  }

  function getSortIcon(key: string) {
    if (sortKey !== key) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  }
</script>

<div class={cn("space-y-4", className)}>
  <!-- Header -->
  {#if title}
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
        {title} ({sortedData.length} items)
      </h3>
    </div>
  {/if}

  <!-- Table -->
  <Table>
    <TableHeader>
      <TableRow>
        {#each columns as column}
          <TableHead 
            class={column.sortable ? "cursor-pointer select-none" : ""}
            on:click={() => column.sortable && handleSort(column.key)}
          >
            <div class="flex items-center space-x-1">
              <span>{column.label}</span>
              {#if column.sortable}
                <span class="text-xs">{getSortIcon(column.key)}</span>
              {/if}
            </div>
          </TableHead>
        {/each}
      </TableRow>
    </TableHeader>
    <TableBody>
      {#if loading}
        <TableRow>
          <TableCell class="text-center py-8">
            <div class="flex items-center justify-center space-x-2">
              <div class="w-4 h-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
              <span class="text-slate-500">Loading...</span>
            </div>
          </TableCell>
        </TableRow>
      {:else if sortedData.length === 0}
        <TableRow>
          <TableCell class="text-center py-8">
            <div class="text-slate-500 dark:text-slate-400">
              {emptyMessage}
            </div>
          </TableCell>
        </TableRow>
      {:else}
        {#each sortedData as item (item.name || item.id || String(item))}
          <TableRow>
            {#each columns as column}
              <TableCell>
                {#if column.render}
                  {@html column.render(item)}
                {:else}
                  {item[column.key]}
                {/if}
              </TableCell>
            {/each}
          </TableRow>
        {/each}
      {/if}
    </TableBody>
  </Table>
</div>
