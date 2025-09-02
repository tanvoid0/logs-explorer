<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import LogEntry from "$lib/components/LogEntry.svelte";
  import type { K8sLog } from "$lib/types/k8s";
  
  const { 
    logs = [], 
    logsLoading = false, 
    logsLoadingMore = false, 
    isConnected = false, 
    logCount = 50, 
    sortOrder = 'newest', 
    traceIdFilter = "", 
    severityFilter = "", 
    hasNextPage = false, 
    hasPreviousPage = false, 
    pinnedStartLog = null, 
    pinnedEndLog = null, 
    namespace = '', 
    onLogCountChange = undefined, 
    onSortOrderChange = undefined, 
    onSeverityChange = undefined, 
    onTraceIdChange = undefined, 
    onDeploymentFilter = undefined, 
    onNextPage = undefined, 
    onPreviousPage = undefined, 
    onLoadMoreNext = undefined, 
    onLoadMorePrevious = undefined, 
    onPinStartTime = undefined, 
    onPinEndTime = undefined, 
    onLoadLogs = undefined 
  } = $props<{
    logs?: K8sLog[];
    logsLoading?: boolean;
    logsLoadingMore?: boolean;
    isConnected?: boolean;
    logCount?: number;
    sortOrder?: 'newest' | 'oldest';
    traceIdFilter?: string;
    severityFilter?: string;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    pinnedStartLog?: string | null;
    pinnedEndLog?: string | null;
    namespace?: string;
    onLogCountChange?: ((data: { count: number }) => void) | undefined;
    onSortOrderChange?: ((data: { sortOrder: 'newest' | 'oldest' }) => void) | undefined;
    onSeverityChange?: ((data: { severity: string }) => void) | undefined;
    onTraceIdChange?: ((data: { traceId: string }) => void) | undefined;
    onDeploymentFilter?: ((data: { deploymentName: string }) => void) | undefined;
    onNextPage?: (() => void) | undefined;
    onPreviousPage?: (() => void) | undefined;
    onLoadMoreNext?: (() => void) | undefined;
    onLoadMorePrevious?: (() => void) | undefined;
    onPinStartTime?: ((data: { timestamp: string }) => void) | undefined;
    onPinEndTime?: ((data: { timestamp: string }) => void) | undefined;
    onLoadLogs?: (() => void) | undefined;
  }>();
  
  // Filter logs based on severity
  const filteredLogs = $derived(logs.filter((log: K8sLog) => {
    if (!severityFilter) return true;
    
    const logLevel = log.level?.toUpperCase();
    const filterLevel = severityFilter.toUpperCase();
    
    // Define severity hierarchy (higher number = higher priority)
    const severityLevels: Record<string, number> = {
      'DEBUG': 0,
      'INFO': 1,
      'WARNING': 2,
      'ERROR': 3,
      'FATAL': 4
    };
    
    const logSeverity = severityLevels[logLevel] ?? 0;
    const filterSeverity = severityLevels[filterLevel] ?? 0;
    
    // Show logs with severity >= filter severity
    return logSeverity >= filterSeverity;
  }));
  
  let logsContainerRef: HTMLElement | null = null;
  let viewMode: 'detailed' | 'compact' | 'raw' | 'lean' = 'detailed';
  
  function setLogCount(count: number) {
    if (onLogCountChange) onLogCountChange({ count });
  }
  
  function scrollToTop() {
    if (logsContainerRef) {
      logsContainerRef.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  function scrollToBottom() {
    if (logsContainerRef) {
      logsContainerRef.scrollTo({ top: logsContainerRef.scrollHeight, behavior: 'smooth' });
    }
  }
  
  function toggleSortOrder() {
    const newOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
    if (onSortOrderChange) onSortOrderChange({ sortOrder: newOrder });
  }
  
  function clearSeverityFilter() {
    if (onSeverityChange) onSeverityChange({ severity: "" });
  }
  
  function handleTraceIdFilter(event: CustomEvent<{traceId: string}>) {
    if (onTraceIdChange) onTraceIdChange({ traceId: event.detail.traceId });
  }
  
  function handleDeploymentFilter(event: CustomEvent<{deploymentName: string}>) {
    if (onDeploymentFilter) onDeploymentFilter({ deploymentName: event.detail.deploymentName });
  }
  
  function handleSeverityFilter(data: {severity: string}) {
    if (onSeverityChange) onSeverityChange({ severity: data.severity });
  }
  
  function handleNextPage() {
    if (onNextPage) onNextPage();
  }
  
  function handlePreviousPage() {
    if (onPreviousPage) onPreviousPage();
  }
  
  function handleLoadMoreNext() {
    if (onLoadMoreNext) onLoadMoreNext();
  }
  
  function handleLoadMorePrevious() {
    if (onLoadMorePrevious) onLoadMorePrevious();
  }
  
  function handlePinStartTime(event: CustomEvent<{timestamp: string}>) {
    if (onPinStartTime) onPinStartTime({ timestamp: event.detail.timestamp });
  }
  
  function handlePinEndTime(event: CustomEvent<{timestamp: string}>) {
    if (onPinEndTime) onPinEndTime({ timestamp: event.detail.timestamp });
  }
  
  function handleLoadLogs() {
    if (onLoadLogs) onLoadLogs();
  }
</script>

<div class="logs-display">
  <!-- Header Controls -->
  <div class="logs-header">
    <div class="logs-controls">
      <div class="logs-count">
        <label for="logCount">Log Count:</label>
        <select 
          id="logCount"
          value={logCount} 
          onchange={(e) => setLogCount(parseInt((e.target as HTMLSelectElement).value))}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </div>
      
      <div class="logs-sort">
        <Button 
          variant="outline" 
          size="sm"
          onclick={toggleSortOrder}
        >
          {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
        </Button>
      </div>
      
      <div class="logs-view-mode">
        <label for="viewMode">View Mode:</label>
        <select 
          id="viewMode"
          bind:value={viewMode}
        >
          <option value="detailed">Detailed</option>
          <option value="compact">Compact</option>
          <option value="raw">Raw</option>
          <option value="lean">Lean</option>
        </select>
      </div>
    </div>
    
    <div class="logs-actions">
      <Button 
        variant="outline" 
        size="sm"
        onclick={scrollToTop}
      >
        ↑ Top
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onclick={scrollToBottom}
      >
        ↓ Bottom
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onclick={handleLoadLogs}
        disabled={logsLoading}
      >
        {logsLoading ? 'Loading...' : 'Refresh'}
      </Button>
    </div>
  </div>
  
  <!-- Logs Container -->
  <div 
    class="logs-container"
    bind:this={logsContainerRef}
  >
    {#if logsLoading && logs.length === 0}
      <div class="logs-loading">
        <div class="loading-spinner"></div>
        <p>Loading logs...</p>
      </div>
    {:else if filteredLogs.length === 0}
      <div class="logs-empty">
        <p>No logs found</p>
        {#if severityFilter}
          <Button 
            variant="outline" 
            size="sm"
            onclick={clearSeverityFilter}
          >
            Clear Filter
          </Button>
        {/if}
      </div>
    {:else}
      <!-- Load More Previous -->
      {#if hasPreviousPage}
        <div class="load-more-previous">
          <Button 
            variant="outline" 
            size="sm"
            onclick={handleLoadMorePrevious}
            disabled={logsLoadingMore}
          >
            {logsLoadingMore ? 'Loading...' : 'Load More Previous'}
          </Button>
        </div>
      {/if}
      
      <!-- Log Entries -->
      <div class="log-entries">
        {#each filteredLogs as log (log.timestamp + log.pod + log.container)}
          <LogEntry 
            {log}
            {viewMode}
            on:traceIdClick={handleTraceIdFilter}
            on:deploymentClick={handleDeploymentFilter}
            on:pinStartTime={handlePinStartTime}
            on:pinEndTime={handlePinEndTime}
          />
        {/each}
      </div>
      
      <!-- Load More Next -->
      {#if hasNextPage}
        <div class="load-more-next">
          <Button 
            variant="outline" 
            size="sm"
            onclick={handleLoadMoreNext}
            disabled={logsLoadingMore}
          >
            {logsLoadingMore ? 'Loading...' : 'Load More Next'}
          </Button>
        </div>
      {/if}
    {/if}
  </div>
  
  <!-- Pagination -->
  {#if hasNextPage || hasPreviousPage}
    <div class="logs-pagination">
      <Button 
        variant="outline" 
        size="sm"
        onclick={handlePreviousPage}
        disabled={!hasPreviousPage}
      >
        ← Previous
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onclick={handleNextPage}
        disabled={!hasNextPage}
      >
        Next →
      </Button>
    </div>
  {/if}
</div>

<style>
  .logs-display {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }
  
  .logs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .logs-controls {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  
  .logs-count,
  .logs-view-mode {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .logs-actions {
    display: flex;
    gap: 8px;
  }
  
  .logs-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    max-height: 600px;
  }
  
  .logs-loading,
  .logs-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #6b7280;
  }
  
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .log-entries {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .load-more-previous,
  .load-more-next {
    display: flex;
    justify-content: center;
    padding: 16px;
  }
  
  .logs-pagination {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  /* Dark mode support */
  :global(.dark) .logs-display {
    background: #1f2937;
    border-color: #374151;
  }
  
  :global(.dark) .logs-header {
    background: #111827;
    border-color: #374151;
  }
  
  :global(.dark) .logs-loading,
  :global(.dark) .logs-empty {
    color: #9ca3af;
  }
  
  :global(.dark) .logs-pagination {
    background: #111827;
    border-color: #374151;
  }
</style>
