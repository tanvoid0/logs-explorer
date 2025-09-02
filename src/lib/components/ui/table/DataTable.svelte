<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { TableRow, TableCell, TableHead, TableBody, TableHeader } from '$lib/components/ui/table-modern/index.js';
  import TableFilters from './TableFilters.svelte';
  import TablePagination from './TablePagination.svelte';
  import TableActions from './TableActions.svelte';

  interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: Record<string, any>) => string;
  }

  interface Filter {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number';
    options?: Array<{ value: string; label: string }>;
    value: string | number | null;
  }

  interface Action {
    key: string;
    label: string;
    action: 'add' | 'edit' | 'delete' | 'save' | 'refresh' | 'download' | 'upload' | 'export' | 'import';
    variant?: 'default' | 'outline' | 'destructive';
    size?: 'default' | 'sm' | 'lg';
    disabled?: boolean;
    bulkOnly?: boolean;
  }

  const {
    data = [],
    columns = [],
    title = "",
    emptyMessage = "No data found",
    loading = false,
    searchQuery = "",
    filters = [],
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    pageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    selectedItems = [],
    actions = [],
    showFilters = true,
    showPagination = true,
    showActions = true,
    showSearch = true,
    className = ""
  } = $props<{
    data?: Record<string, any>[];
    columns?: Column[];
    title?: string;
    emptyMessage?: string;
    loading?: boolean;
    searchQuery?: string;
    filters?: Filter[];
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    selectedItems?: any[];
    actions?: Action[];
    showFilters?: boolean;
    showPagination?: boolean;
    showActions?: boolean;
    showSearch?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher<{
    searchChange: { query: string };
    filterChange: { filters: Filter[] };
    pageChange: { page: number };
    pageSizeChange: { pageSize: number };
    selectionChange: { selectedItems: any[] };
    action: { action: string; items: any[] };
  }>();

  let internalSearchQuery = $state(searchQuery);
  let internalFilters = $state(filters);
  let internalCurrentPage = $state(currentPage);
  let internalPageSize = $state(pageSize);
  let internalSelectedItems = $state(selectedItems);

  function handleSearchChange(event: CustomEvent) {
    internalSearchQuery = event.detail.query;
    dispatch('searchChange', { query: internalSearchQuery });
  }

  function handleFilterChange(key: string, value: any) {
    // Find and update the specific filter
    const filterIndex = internalFilters.findIndex((f: Filter) => f.key === key);
    if (filterIndex !== -1) {
      internalFilters[filterIndex].value = value;
    }
    dispatch('filterChange', { filters: internalFilters });
  }

  function handlePageChange(event: CustomEvent) {
    internalCurrentPage = event.detail.page;
    dispatch('pageChange', { page: internalCurrentPage });
  }

  function handlePageSizeChange(event: CustomEvent) {
    internalPageSize = event.detail.pageSize;
    dispatch('pageSizeChange', { pageSize: internalPageSize });
  }

  function handleSelectionChange(event: CustomEvent) {
    internalSelectedItems = event.detail.selectedItems;
    dispatch('selectionChange', { selectedItems: internalSelectedItems });
  }

  function handleAction(event: CustomEvent) {
    dispatch('action', event.detail);
  }
</script>

<div class="w-full {className}">
  {#if title}
    <div class="mb-4">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
    </div>
  {/if}

  {#if showActions && actions.length > 0}
    <div class="mb-4">
      <TableActions 
        {actions}
        {selectedItems}
        on:action={handleAction}
      />
    </div>
  {/if}

  {#if showFilters && filters.length > 0}
    <div class="mb-4">
      <TableFilters 
        {filters}
        onFilterChange={handleFilterChange}
      />
    </div>
  {/if}

  <div class="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700">
    <div class="overflow-x-auto">
      <table class="w-full">
        <TableHead>
          <TableRow>
                         {#if showActions && actions.some((a: Action) => a.bulkOnly)}
              <TableHeader className="w-12">
                <input 
                  type="checkbox" 
                  class="rounded border-slate-300 dark:border-slate-600"
                  checked={internalSelectedItems.length === data.length && data.length > 0}
                  onchange={(e) => {
                    if (e.currentTarget.checked) {
                      internalSelectedItems = [...data];
                    } else {
                      internalSelectedItems = [];
                    }
                    dispatch('selectionChange', { selectedItems: internalSelectedItems });
                  }}
                />
              </TableHeader>
            {/if}
            {#each columns as column}
              <TableHeader className={column.sortable ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700' : ''}>
                {column.label}
              </TableHeader>
            {/each}
          </TableRow>
        </TableHead>
        <TableBody>
                     {#if loading}
             <TableRow>
               <TableCell className="text-center py-8">
                 <div class="flex items-center justify-center">
                   <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                   <span class="ml-2 text-slate-600 dark:text-slate-400">Loading...</span>
                 </div>
               </TableCell>
             </TableRow>
           {:else if data.length === 0}
             <TableRow>
               <TableCell className="text-center py-8">
                 <div class="text-slate-500 dark:text-slate-400">{emptyMessage}</div>
               </TableCell>
             </TableRow>
          {:else}
            {#each data as item, index}
              <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-700">
                {#if showActions && actions.some((a: Action) => a.bulkOnly)}
                  <TableCell className="w-12">
                    <input 
                      type="checkbox" 
                      class="rounded border-slate-300 dark:border-slate-600"
                      checked={internalSelectedItems.includes(item)}
                      onchange={(e) => {
                        if (e.currentTarget.checked) {
                          internalSelectedItems = [...internalSelectedItems, item];
                        } else {
                          internalSelectedItems = internalSelectedItems.filter((i: any) => i !== item);
                        }
                        dispatch('selectionChange', { selectedItems: internalSelectedItems });
                      }}
                    />
                  </TableCell>
                {/if}
                {#each columns as column}
                  <TableCell>
                    {#if column.render}
                      {@html column.render(item)}
                    {:else}
                      {item[column.key] || ''}
                    {/if}
                  </TableCell>
                {/each}
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </table>
    </div>
  </div>

  {#if showPagination && totalPages > 1}
    <div class="mt-4">
      <TablePagination 
        {currentPage}
        {totalPages}
        {totalItems}
        {pageSize}
        {pageSizeOptions}
        on:pageChange={handlePageChange}
        on:pageSizeChange={handlePageSizeChange}
      />
    </div>
  {/if}
</div>
