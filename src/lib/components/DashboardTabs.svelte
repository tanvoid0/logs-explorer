<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let activeTab: 'analytics' | 'metrics' = 'analytics';
  
  const dispatch = createEventDispatcher();
  
  const tabs = [
    { id: 'analytics', label: '📊 Analytics', icon: '📊' },
    { id: 'metrics', label: '📈 Metrics', icon: '📈' }
  ] as const;
  
  function switchTab(tab: typeof activeTab) {
    activeTab = tab;
    dispatch('tabChange', { tab });
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  }
</script>

<div class="mt-4">
  <nav class="flex space-x-8">
    {#each tabs as tab}
      <button
        onclick={() => switchTab(tab.id)}
        class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}"
      >
        {tab.label}
      </button>
    {/each}
  </nav>
</div>
