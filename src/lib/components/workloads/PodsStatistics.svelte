<script lang="ts">
  const { stats, className = "" } = $props<{
    stats: {
      running: number;
      pending: number;
      failed: number;
      total: number;
    };
    className?: string;
  }>();
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 {className}">
  <!-- Running Pods -->
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
    <div class="flex items-center">
      <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
        <span class="text-2xl">🟢</span>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Running</p>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">{stats.running}</p>
      </div>
    </div>
  </div>

  <!-- Pending Pods -->
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
    <div class="flex items-center">
      <div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
        <span class="text-2xl">🟡</span>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
      </div>
    </div>
  </div>

  <!-- Failed Pods -->
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
    <div class="flex items-center">
      <div class="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
        <span class="text-2xl">🔴</span>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Failed</p>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">{stats.failed}</p>
      </div>
    </div>
  </div>

  <!-- Total Pods -->
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
    <div class="flex items-center">
      <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
        <span class="text-2xl">📊</span>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total</p>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
      </div>
    </div>
  </div>
</div>
