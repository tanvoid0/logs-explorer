<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SearchInput } from '$lib/components/ui/search/index.js';
  import { BaseSelector } from '$lib/components/ui/selector/index.js';
  import { Card, CardContent } from '$lib/components/ui/card/index.js';

  const { searchQuery = "", selectedStatus = "", statusOptions = [], className = "" } = $props<{
    searchQuery?: string;
    selectedStatus?: string;
    statusOptions?: Array<{ value: string; label: string }>;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleSearchChange(query: string) {
    dispatch('search', { query });
  }

  function handleStatusChange(event: CustomEvent) {
    const status = event.detail.value?.[0] || "";
    dispatch('statusChange', { status });
  }
</script>

<Card className={className}>
  <CardContent className="p-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SearchInput 
        placeholder="Search tasks..."
        value={searchQuery}
        onchange={handleSearchChange}
      />
      <BaseSelector
        label="Status"
        options={statusOptions}
        selectedValues={selectedStatus ? [selectedStatus] : []}
        onchange={handleStatusChange}
      />
    </div>
  </CardContent>
</Card>
