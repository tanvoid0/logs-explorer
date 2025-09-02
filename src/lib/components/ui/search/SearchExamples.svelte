<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/feedback/index.js';

  const { examples = [], showCategories = true, className = "" } = $props<{
    examples?: Array<{
      title: string;
      query: string;
      description: string;
      category?: string;
    }>;
    showCategories?: boolean;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  function useExample(example: string) {
    dispatch('useExample', { query: example });
  }

  // Group examples by category if showCategories is true
  const groupedExamples = $derived(showCategories 
    ? examples.reduce((acc: Record<string, typeof examples>, example: typeof examples[0]) => {
        const category = example.category || 'General';
        if (!acc[category]) acc[category] = [];
        acc[category].push(example);
        return acc;
      }, {} as Record<string, typeof examples>)
    : { 'Examples': examples }
  );
</script>

<Card className={className}>
  <CardHeader>
    <CardTitle className="text-sm">Search Examples</CardTitle>
  </CardHeader>
  <CardContent>
    {#each Object.entries(groupedExamples) as [category, categoryExamples]}
      <div class="mb-4 last:mb-0">
        {#if showCategories && Object.keys(groupedExamples).length > 1}
          <h4 class="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
            {category}
          </h4>
        {/if}
        
        <div class="space-y-2">
          {#each (categoryExamples as typeof examples) as example}
            <button 
              type="button"
              class="w-full text-left p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              onclick={() => useExample(example.query)}
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h5 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                    {example.title}
                  </h5>
                  <p class="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    {example.description}
                  </p>
                  <code class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded font-mono text-slate-800 dark:text-slate-200">
                    {example.query}
                  </code>
                </div>
                <Badge variant="secondary" size="sm" className="ml-2">
                  Use
                </Badge>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </CardContent>
</Card>
