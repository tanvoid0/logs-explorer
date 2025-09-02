<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SearchInput } from '$lib/components/ui/search/index.js';
  import { BaseSelector } from '$lib/components/ui/selector/index.js';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { Card, CardContent } from '$lib/components/ui/card/index.js';

  const { searchQuery = "", selectedCategory = "", categories = [], className = "" } = $props<{
    searchQuery?: string;
    selectedCategory?: string;
    categories?: string[];
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleSearchChange(query: string) {
    dispatch('searchChange', { query });
  }

  function handleCategoryChange(event: CustomEvent) {
    const category = event.detail.values[0] || "";
    dispatch('categoryChange', { category });
  }

  function handleSearch() {
    dispatch('search');
  }

  function handleRefresh() {
    dispatch('refresh');
  }

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((category: string) => ({ value: category, label: category }))
  ];
</script>

<Card className={className}>
  <CardContent className="p-4">
    <div class="flex gap-4">
      <div class="flex-1">
        <SearchInput
          placeholder="Search frameworks..."
          value={searchQuery}
          onchange={handleSearchChange}
        />
      </div>
      
      <BaseSelector
        options={categoryOptions}
        selectedValues={selectedCategory ? [selectedCategory] : []}
        placeholder="Select category"
        onchange={handleCategoryChange}
      />
      
      <ActionButton
        action="refresh"
        label="Search"
        onclick={handleSearch}
      />
      
      <ActionButton
        action="refresh"
        label="Refresh"
        onclick={handleRefresh}
      />
    </div>
  </CardContent>
</Card>
