<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SearchExamples } from '$lib/components/ui/search/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  let { className = "" } = $props<{ className?: string }>();

  const dispatch = createEventDispatcher();

  const searchExamples = [
    {
      title: "Error Logs",
      query: "level:ERROR",
      description: "Find all error logs",
      category: "Basic"
    },
    {
      title: "Pod Specific",
      query: "pod:my-app",
      description: "Find logs from specific pod",
      category: "Basic"
    },
    {
      title: "Time Range",
      query: "timestamp:[2024-01-01 TO 2024-01-02]",
      description: "Find logs in time range",
      category: "Advanced"
    }
  ];

  function handleUseExample(event: CustomEvent) {
    dispatch('useExample', { query: event.detail.query });
  }
</script>

<Card className={className}>
  <CardHeader>
    <CardTitle>Search Examples</CardTitle>
  </CardHeader>
  <CardContent>
    <SearchExamples 
      examples={searchExamples}
      on:useExample={handleUseExample}
    />
  </CardContent>
</Card>
