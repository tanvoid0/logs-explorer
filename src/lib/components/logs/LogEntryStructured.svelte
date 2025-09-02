<script lang="ts">
  import { logger } from '$lib/utils/logger';
  import { createEventDispatcher } from 'svelte';
  import { toastStore } from '$lib/stores/toast-store';
  import { Button } from '../ui';

  const { structuredFields = null, className = "" } = $props<{
    structuredFields?: any;
    className?: string;
  }>();

  const dispatch = createEventDispatcher();

  let showFullMessage = $state(false);
  let showFullError = $state(false);
  let showFullStackTrace = $state(false);
  let showFullAdditionalFields = $state<Record<string, boolean>>({});

  function formatValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  function extractDeploymentName(): string | null {
    // First try to get from structured log data
    if (structuredFields?.logger) {
      return structuredFields.logger;
    }
    return null;
  }

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

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toastStore.success('Content copied to clipboard');
    } catch (err) {
      logger.error('Failed to copy text: ', err);
      toastStore.error('Failed to copy content to clipboard');
    }
  }

  function handleTraceIdClick(traceId: string) {
    dispatch('traceIdClick', { traceId });
  }

  function handleDeploymentClick(deploymentName: string) {
    dispatch('deploymentClick', { deploymentName });
  }
</script>

<div class="space-y-2 {className}">
  <!-- Main Message -->
  {#if structuredFields.message}
    <div class="text-sm text-slate-900 dark:text-white">
      <div class="p-2 bg-white dark:bg-slate-800 rounded border font-mono break-words overflow-wrap-anywhere">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            {#if structuredFields.message.length > 100 && !showFullMessage}
              <div>
                <span>{structuredFields.message.slice(0, 100)}...</span>
                <Button
                  onclick={() => showFullMessage = true}
                  class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                >
                  Show more
                </Button>
              </div>
            {:else}
              <div>
                {structuredFields.message}
                {#if structuredFields.message.length > 100 && showFullMessage}
                  <Button
                    onclick={() => showFullMessage = false}
                    class="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                  >
                    Show less
                  </Button>
                {/if}
              </div>
            {/if}
          </div>
          <Button
            onclick={() => copyToClipboard(structuredFields.message)}
            variant="ghost"
            size="sm"
            class="ml-2 p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex-shrink-0"
            title="Copy message"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </Button>
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
            <Button
              onclick={() => handleDeploymentClick(extractDeploymentName()!)}
              variant="ghost"
              class="ml-1 inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer hover:scale-105 transition-all duration-200"
              title="Click to filter by this deployment"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <span class="underline">{extractDeploymentName()}</span>
            </Button>
            <Button
              onclick={() => copyToClipboard(extractDeploymentName()!)}
              variant="ghost"
              size="sm"
              class="ml-1 p-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              title="Copy deployment name"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </Button>
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
