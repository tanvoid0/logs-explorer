<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SearchInput } from '$lib/components/ui/search/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  let { 
    searchQuery = "", 
    loading = false, 
    className = "" 
  } = $props<{
    searchQuery?: string;
    loading?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function handleSearch(query: string) {
    dispatch('search', { query });
  }
</script>

<Card className={className}>
  <CardHeader>
    <CardTitle>Search Logs</CardTitle>
  </CardHeader>
  <CardContent>
    <SearchInput 
      placeholder="Search logs..."
      value={searchQuery}
      loading={loading}
      onSearch={handleSearch}
    />
  </CardContent>
</Card>
