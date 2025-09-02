<script lang="ts">
  import { appStore, preferences } from '$lib/stores/app-store';
  import { SettingsSection } from '$lib/components/ui/settings/index.js';

  function handleDefaultLogCountChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    appStore.setDefaultLogCount(parseInt(target.value));
  }

  function handleRefreshIntervalChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    appStore.setRefreshInterval(parseInt(target.value) * 1000);
  }

  function handleSortOrderChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    appStore.setSortOrder(target.value as 'newest' | 'oldest');
  }
</script>

<SettingsSection 
  title="General Settings"
  description="General application settings and preferences"
  icon="⚙️"
>
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
    <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">
      Application Preferences
    </h3>
    
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="font-medium text-slate-900 dark:text-white">Default Log Count</div>
          <div class="text-sm text-slate-500 dark:text-slate-400">Number of logs to fetch by default</div>
        </div>
        <select 
          class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          value={$preferences.defaultLogCount}
          onchange={handleDefaultLogCountChange}
        >
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="500">500</option>
        </select>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <div class="font-medium text-slate-900 dark:text-white">Auto-refresh Interval</div>
          <div class="text-sm text-slate-500 dark:text-slate-400">Interval for live mode auto-refresh (seconds)</div>
        </div>
        <select 
          class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          value={$preferences.refreshInterval / 1000}
          onchange={handleRefreshIntervalChange}
        >
          <option value="5">5 seconds</option>
          <option value="10">10 seconds</option>
          <option value="30">30 seconds</option>
          <option value="60">1 minute</option>
        </select>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <div class="font-medium text-slate-900 dark:text-white">Default Sort Order</div>
          <div class="text-sm text-slate-500 dark:text-slate-400">Default sorting for log entries</div>
        </div>
        <select 
          class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          value={$preferences.sortOrder}
          onchange={handleSortOrderChange}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  </div>
</SettingsSection>
