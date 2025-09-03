<script lang="ts">
  import { cn } from "$lib/utils";
  import Button from "../button.svelte";

  const { 
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    itemsPerPage = 10,
    showInfo = true,
    className = "",
    onPageChange
  } = $props<{
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    itemsPerPage?: number;
    showInfo?: boolean;
    className?: string;
    onPageChange?: (page: number) => void;
  }>();

  const startItem = $derived.by(() => (currentPage - 1) * itemsPerPage + 1);
  const endItem = $derived.by(() => Math.min(currentPage * itemsPerPage, totalItems));

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange?.(page);
    }
  }

  function getVisiblePages(): number[] {
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
</script>

<div class={cn("flex items-center justify-between", className)}>
  {#if showInfo}
    <div class="text-sm text-slate-600 dark:text-slate-400">
      Showing {startItem} to {endItem} of {totalItems} results
    </div>
  {/if}
  
  <div class="flex items-center space-x-2">
    <Button
      variant="outline"
      size="sm"
      disabled={currentPage === 1}
      onclick={() => handlePageChange(currentPage - 1)}
    >
      Previous
    </Button>
    
    {#each getVisiblePages() as page}
      {#if page === -1}
        <span class="px-2 text-slate-400">...</span>
      {:else}
        <Button
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onclick={() => handlePageChange(page)}
        >
          {page}
        </Button>
      {/if}
    {/each}
    
    <Button
      variant="outline"
      size="sm"
      disabled={currentPage === totalPages}
      onclick={() => handlePageChange(currentPage + 1)}
    >
      Next
    </Button>
  </div>
</div>
