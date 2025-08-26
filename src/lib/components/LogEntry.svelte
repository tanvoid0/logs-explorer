<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { K8sLog } from '$lib/types/k8s';
  import { toastStore } from '$lib/stores/toast-store';

  const { log, viewMode = 'detailed' } = $props<{ log: K8sLog, viewMode?: 'detailed' | 'compact' | 'raw' | 'lean' }>();

  // Parse structured log if it's JSON
  let parsedLog = $derived.by(() => {
    try {
      // Try to parse the message as JSON
      const parsed = JSON.parse(log.message);
      return {
        isStructured: true,
        data: parsed,
        rawMessage: log.message
      };
    } catch {
      // If not JSON, return as plain message
      return {
        isStructured: false,
        data: null,
        rawMessage: log.message
      };
    }
  });

  // Extract common structured log fields
  let structuredFields = $derived.by(() => {
    if (!parsedLog.isStructured || !parsedLog.data) {
      return null;
    }

    const data = parsedLog.data;
    return {
      severity: data.severity || data.level || data.logLevel,
      time: data.time || data.timestamp || data.ts,
      message: data.message || data.msg || data.text,
      logger: data.logger || data.component || data.service,
      requestId: data.requestId || data.request_id || data.trace_id,
      traceId: data['logging.googleapis.com/trace'] || data.requestId || data.request_id || data.trace_id,
      userId: data.userId || data.user_id || data.user,
      error: data.error || data.err || data.exception,
      stackTrace: data.stackTrace || data.stack_trace || data.stack,
      method: data.method || data.httpMethod,
      url: data.url || data.path || data.endpoint,
      statusCode: data.statusCode || data.status_code || data.status,
      duration: data.duration || data.elapsed || data.responseTime,
      other: Object.keys(data).reduce((acc, key) => {
        // Exclude known fields
        const knownFields = ['severity', 'level', 'logLevel', 'time', 'timestamp', 'ts', 
                           'message', 'msg', 'text', 'logger', 'component', 'service',
                           'requestId', 'request_id', 'trace_id', 'logging.googleapis.com/trace',
                           'userId', 'user_id', 'user', 'error', 'err', 'exception', 
                           'stackTrace', 'stack_trace', 'stack', 'method', 'httpMethod', 
                           'url', 'path', 'endpoint', 'statusCode', 'status_code', 'status', 
                           'duration', 'elapsed', 'responseTime'];
        
        if (!knownFields.includes(key) && data[key] !== undefined && data[key] !== null) {
          acc[key] = data[key];
        }
        return acc;
      }, {} as Record<string, any>)
    };
  });

  function formatValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  function getSeverityColor(severity: string): string {
    const s = severity?.toUpperCase();
    switch (s) {
      case 'ERROR': case 'FATAL': case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'WARN': case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'INFO': case 'INFORMATION':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DEBUG': case 'TRACE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
    }
  }
  
  function getContainerBackgroundColor(severity: string): string {
    const s = severity?.toUpperCase();
    switch (s) {
      case 'ERROR': case 'FATAL': case 'CRITICAL':
        return 'bg-red-50 dark:bg-red-950/30 border-l-4 border-red-400 dark:border-red-600';
      case 'WARN': case 'WARNING':
        return 'bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-400 dark:border-yellow-600';
      case 'INFO': case 'INFORMATION':
        return 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 dark:border-blue-600';
      case 'DEBUG': case 'TRACE':
        return 'bg-gray-50 dark:bg-gray-950/30 border-l-4 border-gray-400 dark:border-gray-600';
      default:
        return 'bg-slate-50 dark:bg-slate-700 border-l-4 border-slate-300 dark:border-slate-600';
    }
  }

  let showRawMessage = $state(false);
  let showFullMessage = $state(false);
  let showFullError = $state(false);
  let showFullStackTrace = $state(false);
  let showFullAdditionalFields = $state<Record<string, boolean>>({});

  // Copy functionality
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toastStore.success('Content copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toastStore.error('Failed to copy content to clipboard');
    }
  }

  // Dispatch events for filtering
  const dispatch = createEventDispatcher();

  function handleTraceIdClick(traceId: string) {
    dispatch('filterByTraceId', { traceId });
  }
  
  function handleDeploymentClick(deploymentName: string) {
    dispatch('filterByDeployment', { deploymentName });
  }
  
  function handleSeverityClick(severity: string) {
    dispatch('filterBySeverity', { severity });
  }

  function handlePinStartTime() {
    dispatch('pinStartTime', { timestamp: log.timestamp });
  }

  function handlePinEndTime() {
    dispatch('pinEndTime', { timestamp: log.timestamp });
  }
  
  // Extract deployment name from log
  function extractDeploymentName(): string | null {
    // First try to get from structured log data
    if (structuredFields?.logger) {
      return structuredFields.logger;
    }
    
    // Try to extract from pod name (common pattern: deployment-name-replicaset-pod-id)
    const podName = log.pod;
    if (podName) {
      // Common patterns: 
      // - deployment-name-abc123def4-xyz9w (deployment-replicaset-pod)
      // - deployment-name-xyz9w (deployment-pod)
      const parts = podName.split('-');
      if (parts.length >= 3) {
        // Remove replicaset and pod suffix to get deployment name
        const deploymentPart = parts.slice(0, -2).join('-'); // Remove last 2 parts (replicaset-pod)
        if (deploymentPart) {
          return deploymentPart;
        }
      } else if (parts.length >= 2) {
        // Fallback: just remove the last part
        return parts.slice(0, -1).join('-');
      }
    }
    
    return null;
  }

  // Extract just the trace ID from Google Cloud trace format
  function extractTraceId(fullTrace: string): string {
    if (fullTrace.includes('projects/') && fullTrace.includes('traces/')) {
      // Extract from "projects/project-id/traces/trace-id" format
      const parts = fullTrace.split('/');
      const traceIndex = parts.indexOf('traces');
      if (traceIndex !== -1 && parts[traceIndex + 1]) {
        return parts[traceIndex + 1];
      }
    }
    return fullTrace;
  }
</script>

<div class="{viewMode === 'lean' || viewMode === 'raw' ? 'p-1' : viewMode === 'compact' ? 'p-2' : 'p-3'} rounded-md {getContainerBackgroundColor(structuredFields?.severity || log.level)} max-w-full overflow-hidden">
  {#if viewMode === 'compact'}
    <!-- Compact Header - Single line -->
    <div class="flex items-center justify-between text-xs mb-1 min-w-0">
      <div class="flex items-center space-x-2 min-w-0 flex-1">
        <!-- Severity Badge -->
        <button
          onclick={() => handleSeverityClick(structuredFields?.severity || log.level)}
          class="text-xs font-medium px-1 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity {getSeverityColor(structuredFields?.severity || log.level)}"
          title="Click to filter by this severity level"
        >
          {structuredFields?.severity || log.level}
        </button>
        
        <!-- Timestamp -->
        <span class="text-slate-500 dark:text-slate-400">
          {new Date(structuredFields?.time || log.timestamp).toLocaleTimeString()}
        </span>
        
        <!-- Deployment (compact) -->
        {#if extractDeploymentName()}
          <button
            onclick={() => handleDeploymentClick(extractDeploymentName()!)}
            class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            title="Filter by deployment"
          >
            {extractDeploymentName()}
          </button>
        {/if}
        
        <!-- Pin Buttons (compact) -->
        <div class="flex items-center space-x-1">
          <button
            onclick={handlePinStartTime}
            class="p-0.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="Pin as start time"
          >
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"></path>
            </svg>
          </button>
          <button
            onclick={handlePinEndTime}
            class="p-0.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
            title="Pin as end time"
          >
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Pod Info (compact) -->
      <div class="text-slate-500 dark:text-slate-400 truncate max-w-32 lg:max-w-48 flex-shrink-0">
        {log.namespace}/{log.pod}
      </div>
    </div>
  {:else}
    <!-- Detailed Header -->
    <div class="flex items-start justify-between mb-2 min-w-0">
      <div class="flex items-center space-x-2 min-w-0 flex-1">
        <!-- Severity Badge -->
        <button
          onclick={() => handleSeverityClick(structuredFields?.severity || log.level)}
          class="inline-flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full cursor-pointer hover:scale-105 transition-all duration-200 shadow-sm {getSeverityColor(structuredFields?.severity || log.level)}"
          title="Click to filter by this severity level"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"></path>
          </svg>
          <span>{structuredFields?.severity || log.level}</span>
        </button>
        
        <!-- Timestamp -->
        <span class="text-xs text-slate-500 dark:text-slate-400">
          {new Date(structuredFields?.time || log.timestamp).toLocaleString()}
        </span>
        
        <!-- Pin Buttons -->
        <div class="flex items-center space-x-1">
          <button
            onclick={handlePinStartTime}
            class="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="Pin as start time"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"></path>
            </svg>
          </button>
          <button
            onclick={handlePinEndTime}
            class="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
            title="Pin as end time"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            </svg>
          </button>
        </div>

      </div>
      
      <!-- Pod/Namespace Info -->
      <div class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-32 lg:max-w-48 flex-shrink-0">
        {log.namespace}/{log.pod}
        {#if log.container !== 'app'}
          <span class="text-slate-400">/{log.container}</span>
        {/if}
      </div>
    </div>
  

  {/if}

  <!-- Content -->
  {#if viewMode === 'lean'}
    <!-- Lean Content - Just the extracted/parsed message -->
    <div class="text-sm text-slate-900 dark:text-white break-words overflow-wrap-anywhere">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          {#if structuredFields?.message}
            {#if structuredFields.message.length > 100 && !showFullMessage}
              <div>
                <span>{structuredFields.message.slice(0, 100)}...</span>
                <button
                  onclick={() => showFullMessage = true}
                  class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                >
                  Show more
                </button>
              </div>
            {:else}
              <div>
                {structuredFields.message}
                {#if structuredFields.message.length > 100 && showFullMessage}
                  <button
                    onclick={() => showFullMessage = false}
                    class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                  >
                    Show less
                  </button>
                {/if}
              </div>
            {/if}
          {:else}
            {#if parsedLog.rawMessage.length > 100 && !showFullMessage}
              <div>
                <span>{parsedLog.rawMessage.slice(0, 100)}...</span>
                <button
                  onclick={() => showFullMessage = true}
                  class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                >
                  Show more
                </button>
              </div>
            {:else}
              <div>
                {parsedLog.rawMessage}
                {#if parsedLog.rawMessage.length > 100 && showFullMessage}
                  <button
                    onclick={() => showFullMessage = false}
                    class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                  >
                    Show less
                  </button>
                {/if}
              </div>
            {/if}
          {/if}
        </div>
        <button
          onclick={() => copyToClipboard(structuredFields?.message || parsedLog.rawMessage)}
          class="ml-2 p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex-shrink-0"
          title="Copy message"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </button>
      </div>
    </div>
  {:else if viewMode === 'raw'}
    <!-- Raw Content - timestamp + level + message -->
    <div class="text-xs text-slate-900 dark:text-white font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <span class="text-slate-500 dark:text-slate-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
          <span class="text-slate-600 dark:text-slate-300">[{log.level}]</span>
          {#if parsedLog.rawMessage.length > 100 && !showFullMessage}
            <div>
              <span>{parsedLog.rawMessage.slice(0, 100)}...</span>
              <button
                onclick={() => showFullMessage = true}
                class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
              >
                Show more
              </button>
            </div>
          {:else}
            <div>
              {parsedLog.rawMessage}
              {#if parsedLog.rawMessage.length > 100 && showFullMessage}
                <button
                  onclick={() => showFullMessage = false}
                  class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                >
                  Show less
                </button>
              {/if}
            </div>
          {/if}
        </div>
        <button
          onclick={() => copyToClipboard(`[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level}] ${parsedLog.rawMessage}`)}
          class="ml-2 p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex-shrink-0"
          title="Copy raw log"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </button>
      </div>
    </div>
  {:else if viewMode === 'compact'}
    <!-- Compact Content - Just the message -->
    <div class="text-sm text-slate-900 dark:text-white">
      <div class="flex items-start space-x-2">
        {#if structuredFields?.message}
          <div class="break-words overflow-wrap-anywhere flex-1">
            {#if structuredFields.message.length > 100 && !showFullMessage}
              <span>{structuredFields.message.slice(0, 100)}...</span>
              <button
                onclick={() => showFullMessage = true}
                class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
              >
                Show more
              </button>
            {:else}
              <span>{structuredFields.message}</span>
              {#if structuredFields.message.length > 100 && showFullMessage}
                <button
                  onclick={() => showFullMessage = false}
                  class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                >
                  Show less
                </button>
              {/if}
            {/if}
          </div>
        {:else}
          <div class="break-words overflow-wrap-anywhere flex-1">
            {#if parsedLog.rawMessage.length > 100 && !showFullMessage}
              <span>{parsedLog.rawMessage.slice(0, 100)}...</span>
              <button
                onclick={() => showFullMessage = true}
                class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
              >
                Show more
              </button>
            {:else}
              <span>{parsedLog.rawMessage}</span>
              {#if parsedLog.rawMessage.length > 100 && showFullMessage}
                <button
                  onclick={() => showFullMessage = false}
                  class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                >
                  Show less
                </button>
              {/if}
            {/if}
          </div>
        {/if}
        
        <!-- Copy button for compact view -->
        <button
          onclick={() => copyToClipboard(structuredFields?.message || parsedLog.rawMessage)}
          class="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex-shrink-0"
          title="Copy message"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </button>
        
        <!-- Show trace ID inline for compact view -->
        {#if structuredFields?.traceId}
          <button
            onclick={() => handleTraceIdClick(extractTraceId(structuredFields.traceId))}
            class="flex-shrink-0 inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-mono cursor-pointer hover:scale-105 transition-all duration-200"
            title="Filter by trace ID"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            <span class="underline">trace:{extractTraceId(structuredFields.traceId).slice(0, 8)}...</span>
          </button>
        {/if}
      </div>
    </div>
  {:else if showRawMessage || !parsedLog.isStructured}
    <!-- Raw Message -->
    <div class="text-sm text-slate-900 dark:text-white font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere">
      {#if parsedLog.rawMessage.length > 100 && !showFullMessage}
        <div>
          <span>{parsedLog.rawMessage.slice(0, 100)}...</span>
          <button
            onclick={() => showFullMessage = true}
            class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
          >
            Show more
          </button>
        </div>
      {:else}
        <div>
          {parsedLog.rawMessage}
          {#if parsedLog.rawMessage.length > 100 && showFullMessage}
            <button
              onclick={() => showFullMessage = false}
              class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
            >
              Show less
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {:else if structuredFields}
    <!-- Structured Log Display - Compact -->
    <div class="space-y-2">
            <!-- Main Message -->
      {#if structuredFields.message}
        <div class="text-sm text-slate-900 dark:text-white">
          <div class="p-2 bg-white dark:bg-slate-800 rounded border font-mono break-words overflow-wrap-anywhere">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                {#if structuredFields.message.length > 100 && !showFullMessage}
                  <div>
                    <span>{structuredFields.message.slice(0, 100)}...</span>
                    <button
                      onclick={() => showFullMessage = true}
                      class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                    >
                      Show more
                    </button>
                  </div>
                {:else}
                  <div>
                    {structuredFields.message}
                    {#if structuredFields.message.length > 100 && showFullMessage}
                      <button
                        onclick={() => showFullMessage = false}
                        class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                      >
                        Show less
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>
              <button
                onclick={() => copyToClipboard(structuredFields.message)}
                class="ml-2 p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex-shrink-0"
                title="Copy message"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Compact Information Lines -->
      <div class="space-y-1 text-xs">
        <!-- First line: Deployment, Logger, Request ID, Trace ID -->
        {#if extractDeploymentName() || structuredFields.logger || structuredFields.requestId || structuredFields.traceId}
          <div class="flex items-center space-x-4 flex-wrap gap-2">
            {#if extractDeploymentName()}
              <div class="flex items-center">
                <span class="font-medium text-slate-600 dark:text-slate-400">Deployment:</span>
                <button
                  onclick={() => handleDeploymentClick(extractDeploymentName()!)}
                  class="ml-1 inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer hover:scale-105 transition-all duration-200"
                  title="Click to filter by this deployment"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                  <span class="underline">{extractDeploymentName()}</span>
                </button>
                <button
                  onclick={() => copyToClipboard(extractDeploymentName()!)}
                  class="ml-1 p-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  title="Copy deployment name"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </button>
              </div>
            {/if}
            
            {#if structuredFields.logger}
              <div class="flex items-center">
                <span class="font-medium text-slate-600 dark:text-slate-400">Logger:</span>
                <span class="ml-1 text-slate-900 dark:text-white">{structuredFields.logger}</span>
              </div>
            {/if}
            
            {#if structuredFields.requestId}
              <div class="flex items-center">
                <span class="font-medium text-slate-600 dark:text-slate-400">Request ID:</span>
                <span class="ml-1 text-slate-900 dark:text-white font-mono">{structuredFields.requestId}</span>
              </div>
            {/if}
            
            {#if structuredFields.traceId}
              <div class="flex items-center">
                <span class="font-medium text-slate-600 dark:text-slate-400">Trace ID:</span>
                <button
                  onclick={() => handleTraceIdClick(extractTraceId(structuredFields.traceId))}
                  class="ml-1 inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-mono cursor-pointer hover:scale-105 transition-all duration-200"
                  title="Click to filter by this trace ID"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  <span class="underline">{extractTraceId(structuredFields.traceId)}</span>
                </button>
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- Second line: User ID, Method, URL -->
        {#if structuredFields.userId || structuredFields.method || structuredFields.url}
          <div class="flex items-center space-x-4 flex-wrap gap-2">
            {#if structuredFields.userId}
              <div class="flex items-center">
                <span class="font-medium text-slate-600 dark:text-slate-400">User ID:</span>
                <span class="ml-1 text-slate-900 dark:text-white">{structuredFields.userId}</span>
              </div>
            {/if}
            
            {#if structuredFields.method}
              <div class="flex items-center">
                <span class="font-medium text-slate-600 dark:text-slate-400">Method:</span>
                <span class="ml-1 text-slate-900 dark:text-white">{structuredFields.method}</span>
              </div>
            {/if}
            
            {#if structuredFields.url}
              <div class="flex items-center">
                <span class="font-medium text-slate-600 dark:text-slate-400">URL:</span>
                <span class="ml-1 text-slate-900 dark:text-white font-mono">{structuredFields.url}</span>
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- Third line: Status Code, Duration -->
        {#if structuredFields.statusCode || structuredFields.duration}
          <div class="flex items-center space-x-4 flex-wrap gap-2">
            {#if structuredFields.statusCode}
              <div class="flex items-center">
                <span class="font-medium text-slate-600 dark:text-slate-400">Status:</span>
                <span class="ml-1 text-slate-900 dark:text-white">{structuredFields.statusCode}</span>
              </div>
            {/if}
            
            {#if structuredFields.duration}
              <div class="flex items-center">
                <span class="font-medium text-slate-600 dark:text-slate-400">Duration:</span>
                <span class="ml-1 text-slate-900 dark:text-white">{structuredFields.duration}ms</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Error Information -->
      {#if structuredFields.error}
        <div class="text-sm">
          <span class="font-medium text-red-600 dark:text-red-400">Error:</span>
          <div class="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 font-mono text-red-900 dark:text-red-100 break-words overflow-wrap-anywhere">
            {#if formatValue(structuredFields.error).length > 100 && !showFullError}
              <div>
                <span>{formatValue(structuredFields.error).slice(0, 100)}...</span>
                <button
                  onclick={() => showFullError = true}
                  class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                >
                  Show more
                </button>
              </div>
            {:else}
              <div>
                {formatValue(structuredFields.error)}
                {#if formatValue(structuredFields.error).length > 100 && showFullError}
                  <button
                    onclick={() => showFullError = false}
                    class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                  >
                    Show less
                  </button>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Stack Trace -->
      {#if structuredFields.stackTrace}
        <div class="text-sm">
          <span class="font-medium text-red-600 dark:text-red-400">Stack Trace:</span>
          <div class="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 font-mono text-xs text-red-900 dark:text-red-100 whitespace-pre-wrap break-words overflow-wrap-anywhere">
            {#if formatValue(structuredFields.stackTrace).length > 100 && !showFullStackTrace}
              <div>
                <span>{formatValue(structuredFields.stackTrace).slice(0, 100)}...</span>
                <button
                  onclick={() => showFullStackTrace = true}
                  class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                >
                  Show more
                </button>
              </div>
            {:else}
              <div>
                {formatValue(structuredFields.stackTrace)}
                {#if formatValue(structuredFields.stackTrace).length > 100 && showFullStackTrace}
                  <button
                    onclick={() => showFullStackTrace = false}
                    class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                  >
                    Show less
                  </button>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Other Fields -->
      {#if Object.keys(structuredFields.other).length > 0}
        <details class="text-sm">
          <summary class="flex items-center justify-between font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white">
            <span>Additional Fields ({Object.keys(structuredFields.other).length})</span>
            <button
              onclick={(e) => {
                e.stopPropagation();
                copyToClipboard(JSON.stringify(structuredFields.other, null, 2));
              }}
              class="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 flex-shrink-0"
              title="Copy all additional fields as JSON"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </button>
          </summary>
          <div class="mt-2 space-y-2">
            {#each Object.entries(structuredFields.other) as [key, value]}
              <div class="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="text-slate-900 dark:text-white text-xs break-words overflow-wrap-anywhere font-mono">
                      {#if formatValue(value).length > 100 && !showFullAdditionalFields[key]}
                        <div>
                          <span class="font-medium text-blue-600 dark:text-blue-400">{key}:</span>
                          <span class="ml-1">{formatValue(value).slice(0, 100)}...</span>
                          <button
                            onclick={() => showFullAdditionalFields[key] = true}
                            class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                          >
                            Show more
                          </button>
                        </div>
                      {:else}
                        <div>
                          <span class="font-medium text-blue-600 dark:text-blue-400">{key}:</span>
                          <span class="ml-1">{formatValue(value)}</span>
                          {#if formatValue(value).length > 100 && showFullAdditionalFields[key]}
                            <button
                              onclick={() => showFullAdditionalFields[key] = false}
                              class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                            >
                              Show less
                            </button>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  </div>
                  <button
                    onclick={() => copyToClipboard(`${key}: ${formatValue(value)}`)}
                    class="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 flex-shrink-0"
                    title="Copy {key}: {formatValue(value)}"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </details>
      {/if}
    </div>
  {/if}
</div>
