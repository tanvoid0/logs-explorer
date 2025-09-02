<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from "$lib/components/ui/button.svelte";
  import { Card, CardContent } from "$lib/components/ui/card/index.js";

  let { 
    startTime = $bindable(null), 
    endTime = $bindable(null), 
    disabled = false, 
    pinnedStartLog = null, 
    pinnedEndLog = null 
  } = $props<{
    startTime?: string | null;
    endTime?: string | null;
    disabled?: boolean;
    pinnedStartLog?: string | null;
    pinnedEndLog?: string | null;
  }>();

  const dispatch = createEventDispatcher();

  // Preset time ranges
  const timePresets = [
    { label: '5m', value: '5m', description: 'Last 5 minutes' },
    { label: '1h', value: '1h', description: 'Last hour' },
    { label: '3h', value: '3h', description: 'Last 3 hours' },
    { label: '1d', value: '1d', description: 'Last day' },
    { label: '3d', value: '3d', description: 'Last 3 days' },
    { label: '1w', value: '1w', description: 'Last week' }
  ];

  function setTimePreset(preset: string) {
    const now = new Date();
    let startDate: Date;

    switch (preset) {
      case '5m':
        startDate = new Date(now.getTime() - 5 * 60 * 1000);
        break;
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '3h':
        startDate = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        break;
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '3d':
        startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case '1w':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    startTime = startDate.toISOString().slice(0, 16); // Format for datetime-local input
    endTime = null; // End time is null for relative time ranges
    dispatchTimeChange();
  }

  function clearTimeFilter() {
    startTime = null;
    endTime = null;
    dispatchTimeChange();
  }

  function dispatchTimeChange() {
    dispatch('timeChange', { startTime, endTime });
  }

  function handleStartTimeChange() {
    dispatchTimeChange();
  }

  function handleEndTimeChange() {
    dispatchTimeChange();
  }

  function pinStartTime() {
    dispatch('pinStartTime');
  }

  function pinEndTime() {
    dispatch('pinEndTime');
  }

  // Check if a preset is currently active
  function isPresetActive(preset: string): boolean {
    if (!startTime || endTime !== null) return false;
    
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    
    switch (preset) {
      case '5m':
        return Math.abs(diffMs - 5 * 60 * 1000) < 1000; // Within 1 second
      case '1h':
        return Math.abs(diffMs - 60 * 60 * 1000) < 1000;
      case '3h':
        return Math.abs(diffMs - 3 * 60 * 60 * 1000) < 1000;
      case '1d':
        return Math.abs(diffMs - 24 * 60 * 60 * 1000) < 1000;
      case '3d':
        return Math.abs(diffMs - 3 * 24 * 60 * 60 * 1000) < 1000;
      case '1w':
        return Math.abs(diffMs - 7 * 24 * 60 * 60 * 1000) < 1000;
      default:
        return false;
    }
  }

  function getActivePreset(): string | null {
    for (const preset of timePresets) {
      if (isPresetActive(preset.value)) {
        return preset.value;
      }
    }
    return null;
  }
</script>

<div class="space-y-3">
  <!-- Time Filter Header -->
  <div class="flex items-center space-x-2">
    <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Time Range:</span>
  </div>

  <!-- Preset Buttons -->
  <div class="flex flex-wrap gap-2">
    {#each timePresets as preset}
      <Button
        variant={isPresetActive(preset.value) ? "default" : "outline"}
        size="sm"
        onclick={() => setTimePreset(preset.value)}
        disabled={disabled}
        title={preset.description}
        class="text-xs"
      >
        {preset.label}
      </Button>
    {/each}
    
    <Button
      variant="outline"
      size="sm"
      onclick={clearTimeFilter}
      disabled={disabled}
      title="Clear time filter"
      class="text-xs"
    >
      Clear
    </Button>
  </div>

  <!-- Custom Time Range -->
  <div class="space-y-2">
    <div class="text-xs text-slate-600 dark:text-slate-400">
      Custom time range:
    </div>
    
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label for="startTime" class="block text-xs text-slate-600 dark:text-slate-400 mb-1">
          Start Time
        </label>
        <input
          id="startTime"
          type="datetime-local"
          value={startTime || ''}
          on:change={(e) => {
            const target = e.target as HTMLInputElement;
            startTime = target.value || null;
            handleStartTimeChange();
          }}
          class="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        />
      </div>
      
      <div>
        <label for="endTime" class="block text-xs text-slate-600 dark:text-slate-400 mb-1">
          End Time (optional)
        </label>
        <input
          id="endTime"
          type="datetime-local"
          value={endTime || ''}
          on:change={(e) => {
            const target = e.target as HTMLInputElement;
            endTime = target.value || null;
            handleEndTimeChange();
          }}
          class="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        />
      </div>
    </div>
  </div>

  <!-- Pin Buttons -->
  <div class="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      onclick={pinStartTime}
      disabled={disabled}
      title="Pin start time from selected log"
      class="text-xs flex-1"
    >
      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"></path>
      </svg>
      Pin Start
    </Button>
    
    <Button
      variant="outline"
      size="sm"
      onclick={pinEndTime}
      disabled={disabled}
      title="Pin end time from selected log"
      class="text-xs flex-1"
    >
      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
      </svg>
      Pin End
    </Button>
  </div>

  <!-- Active Filter Display -->
  {#if startTime || endTime}
    <Card className="bg-slate-50 dark:bg-slate-700">
      <CardContent className="p-2">
        <div class="text-xs text-slate-600 dark:text-slate-400">
          <div class="font-medium mb-1">Active Time Filter:</div>
          {#if getActivePreset()}
            <div>Preset: {getActivePreset()}</div>
          {:else}
            <div>Start: {startTime ? new Date(startTime).toLocaleString() : 'None'}</div>
            <div>End: {endTime ? new Date(endTime).toLocaleString() : 'Now'}</div>
          {/if}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Pinned Logs Display -->
  {#if pinnedStartLog || pinnedEndLog}
    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
      <CardContent className="p-2">
        <div class="text-xs text-slate-600 dark:text-slate-400">
          <div class="font-medium mb-1 text-blue-800 dark:text-blue-200">Pinned Logs:</div>
          {#if pinnedStartLog}
            <div class="text-blue-700 dark:text-blue-300">Start: {new Date(pinnedStartLog).toLocaleString()}</div>
          {/if}
          {#if pinnedEndLog}
            <div class="text-blue-700 dark:text-blue-300">End: {new Date(pinnedEndLog).toLocaleString()}</div>
          {/if}
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
