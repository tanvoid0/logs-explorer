<script lang="ts">
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { BaseSelector } from '$lib/components/ui/selector/index.js';

  const { 
    currentPage = 1, 
    totalPages = 1, 
    totalItems = 0, 
    pageSize = 10, 
    pageSizeOptions = [10, 25, 50, 100], 
    showPageSizeSelector = true, 
    showPageInfo = true, 
    className = "",
    onPageChange,
    onPageSizeChange
  } = $props<{
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    showPageSizeSelector?: boolean;
    showPageInfo?: boolean;
    className?: string;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  }>();

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) {
      onPageChange?.(page);
    }
  }

  function handlePageSizeChange(event: CustomEvent) {
    const newPageSize = Number(event.detail.value);
    onPageSizeChange?.(newPageSize);
  }

  function getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  function getStartItem(): number {
    return (currentPage - 1) * pageSize + 1;
  }

  function getEndItem(): number {
    return Math.min(currentPage * pageSize, totalItems);
  }
</script>

<div class="flex items-center justify-between {className}">
  <!-- Page Info -->
  {#if showPageInfo}
    <div class="text-sm text-slate-600 dark:text-slate-400">
      Showing {getStartItem()} to {getEndItem()} of {totalItems} items
    </div>
  {/if}

  <!-- Page Size Selector -->
  {#if showPageSizeSelector}
    <div class="flex items-center gap-2">
      <span class="text-sm text-slate-600 dark:text-slate-400">Show:</span>
      <BaseSelector
        options={pageSizeOptions.map((size: number) => ({ value: String(size), label: String(size) }))}
        selectedValues={[String(pageSize)]}
        size="sm"
        onchange={handlePageSizeChange}
      />
      <span class="text-sm text-slate-600 dark:text-slate-400">per page</span>
    </div>
  {/if}

  <!-- Pagination Controls -->
  <div class="flex items-center gap-1">
    <!-- Previous Button -->
    <ActionButton
      action="add"
      label="Previous"
      variant="outline"
      size="sm"
      disabled={currentPage === 1}
      onclick={() => handlePageChange(currentPage - 1)}
    />

    <!-- Page Numbers -->
    {#each getPageNumbers() as pageNum}
      {#if pageNum === -1}
        <span class="px-3 py-1 text-sm text-slate-400">...</span>
      {:else}
        <button
          class="px-3 py-1 text-sm border rounded-md transition-colors {pageNum === currentPage 
            ? 'bg-blue-500 text-white border-blue-500' 
            : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}"
          onclick={() => handlePageChange(pageNum)}
        >
          {pageNum}
        </button>
      {/if}
    {/each}

    <!-- Next Button -->
    <ActionButton
      action="add"
      label="Next"
      variant="outline"
      size="sm"
      disabled={currentPage === totalPages}
      onclick={() => handlePageChange(currentPage + 1)}
    />
  </div>
</div>
