<script lang="ts">
  import TableRow from '$lib/components/ui/table-row.svelte';
  import TableCell from '$lib/components/ui/table-cell.svelte';
  import TableHead from '$lib/components/ui/table-head.svelte';
  import TableBody from '$lib/components/ui/table-body.svelte';
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
    className = "",
    onSearchChange,
    onFilterChange,
    onPageChange,
    onPageSizeChange,
    onSelectionChange,
    onAction
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
    onSearchChange?: (query: string) => void;
    onFilterChange?: (filters: Filter[]) => void;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onSelectionChange?: (selectedItems: any[]) => void;
    onAction?: (action: string, items: any[]) => void;
  }>();

  // Event handlers now use callback props

  let internalSearchQuery = $state(searchQuery);
  let internalFilters = $state(filters);
  let internalCurrentPage = $state(currentPage);
  let internalPageSize = $state(pageSize);
  let internalSelectedItems = $state(selectedItems);

  function handleSearchChange(query: string) {
    internalSearchQuery = query;
    onSearchChange?.(internalSearchQuery);
  }

  function handleFilterChange(key: string, value: any) {
    // Find and update the specific filter
    const filterIndex = internalFilters.findIndex((f: Filter) => f.key === key);
    if (filterIndex !== -1) {
      internalFilters[filterIndex].value = value;
    }
    onFilterChange?.(internalFilters);
  }

  function handlePageChange(page: number) {
    internalCurrentPage = page;
    onPageChange?.(internalCurrentPage);
  }

  function handlePageSizeChange(pageSize: number) {
    internalPageSize = pageSize;
    onPageSizeChange?.(internalPageSize);
  }

  function handleSelectionChange(selectedItems: any[]) {
    internalSelectedItems = selectedItems;
    onSelectionChange?.(internalSelectedItems);
  }

  function handleAction(action: string, items: any[]) {
    onAction?.(action, items);
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
        onAction={handleAction}
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
              <TableHead className="w-12">
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
                    onSelectionChange?.(internalSelectedItems);
                  }}
                />
              </TableHead>
            {/if}
            {#each columns as column}
              <TableHead className={column.sortable ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700' : ''}>
                {column.label}
              </TableHead>
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
                        onSelectionChange?.(internalSelectedItems);
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
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  {/if}
</div>
