<script lang="ts">
  import { logger } from '$lib/utils/logger';
  import { createEventDispatcher } from 'svelte';
  import { toastStore } from '$lib/stores/toast-store';
  import type { K8sLog } from '$lib/types/k8s';

  const { log, viewMode = 'detailed', parsedLog = null, structuredFields = null, className = "" } = $props();

  const dispatch = createEventDispatcher();

  let showFullMessage = $state(false);

  // Copy functionality
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toastStore.success('Content copied to clipboard');
    } catch (err) {
      logger.error('Failed to copy text: ', err);
      toastStore.error('Failed to copy content to clipboard');
    }
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

  function handleTraceIdClick(traceId: string) {
    dispatch('traceIdClick', { traceId });
  }
</script>

{#if viewMode === 'lean'}
  <!-- Lean Content - Just the extracted/parsed message -->
  <div class="text-sm text-slate-900 dark:text-white break-words overflow-wrap-anywhere {className}">
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
  <div class="text-xs text-slate-900 dark:text-white font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere {className}">
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
  <div class="text-sm text-slate-900 dark:text-white {className}">
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
{:else}
  <!-- Default Content - Raw message or structured display -->
  <div class="text-sm text-slate-900 dark:text-white font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere {className}">
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
{/if}
