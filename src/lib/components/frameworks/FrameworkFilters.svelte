<script lang="ts">
  import { SearchInput } from '$lib/components/ui/search/index.js';
  import { BaseSelector } from '$lib/components/ui/selector/index.js';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { Card, CardContent } from '$lib/components/ui/card/index.js';

  const { 
    searchQuery = "", 
    selectedCategory = "", 
    categories = [], 
    className = "",
    onSearchChange,
    onCategoryChange,
    onSearch,
    onRefresh
  } = $props<{
    searchQuery?: string;
    selectedCategory?: string;
    categories?: string[];
    className?: string;
    onSearchChange?: (query: string) => void;
    onCategoryChange?: (category: string) => void;
    onSearch?: () => void;
    onRefresh?: () => void;
  }>();

  function handleSearchChange(query: string) {
    onSearchChange?.(query);
  }

  function handleCategoryChange(event: CustomEvent) {
    const category = event.detail.values[0] || "";
    onCategoryChange?.(category);
  }

  function handleSearch() {
    onSearch?.();
  }

  function handleRefresh() {
    onRefresh?.();
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
