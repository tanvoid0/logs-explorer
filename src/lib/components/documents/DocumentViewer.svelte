<script lang="ts">
  import type { DocumentModel } from '$lib/types/documents';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import Icon from '@iconify/svelte';

  const { document } = $props<{
    document: DocumentModel;
  }>();

  function renderMarkdown(text: string): string {
    // Simple markdown rendering for display
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  }

  function getDocumentStatus(doc: DocumentModel) {
    if (doc.is_draft) {
      return { text: 'Draft', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
    }
    return { text: 'Published', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
  }
</script>

<div class="document-viewer">
  <Card>
    <CardHeader>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <CardTitle className="text-2xl">{document.title}</CardTitle>
          <div class="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Created: {formatDate(document.created_at)}</span>
            <span>Updated: {formatDate(document.updated_at)}</span>
            {#if document.last_edited_at && document.last_edited_at !== document.updated_at}
              <span>Last Edited: {formatDate(document.last_edited_at)}</span>
            {/if}
          </div>
        </div>
        <span class="px-3 py-1 text-sm font-medium rounded-full {getDocumentStatus(document).class}">
          {getDocumentStatus(document).text}
        </span>
      </div>
    </CardHeader>
    
    <CardContent className="p-6">
      <!-- Tags -->
      {#if document.tags}
        <div class="mb-8">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tags:</h4>
          <div class="flex flex-wrap gap-2">
            {#each JSON.parse(document.tags as any) as tag}
              <span class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                {tag}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Content -->
      <div class="prose prose-lg max-w-none dark:prose-invert">
        {@html renderMarkdown(document.content)}
      </div>

      <!-- Draft Notice -->
      {#if document.is_draft && document.content_draft && document.content_draft !== document.content}
        <div class="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div class="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Icon icon="mdi:pencil" className="w-5 h-5" />
            <span class="font-medium">Draft Available</span>
          </div>
          <p class="text-yellow-700 dark:text-yellow-300 mt-1 text-sm">
            This document has unsaved draft changes. The draft content may differ from what's displayed above.
          </p>
        </div>
      {/if}
    </CardContent>
  </Card>
</div>

<style>
  .prose h1, .prose h2, .prose h3 {
    margin-top: 2rem;
    margin-bottom: 1.25rem;
    font-weight: 600;
  }

  .prose h1 {
    font-size: 2.25rem;
    line-height: 2.5rem;
  }

  .prose h2 {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }

  .prose h3 {
    font-size: 1.5rem;
    line-height: 2rem;
  }

  .prose p {
    margin-bottom: 1.25rem;
    line-height: 1.7;
    font-size: 1.125rem;
  }

  .prose ul, .prose ol {
    margin-bottom: 1.25rem;
    padding-left: 2rem;
  }

  .prose li {
    margin-bottom: 0.75rem;
    line-height: 1.6;
  }

  .prose blockquote {
    border-left: 4px solid #e5e7eb;
    padding: 1.5rem;
    margin: 2rem 0;
    font-style: italic;
    color: #6b7280;
    background-color: #f9fafb;
    border-radius: 0.5rem;
  }

  .prose code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    background-color: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  .prose pre {
    background-color: #1f2937;
    color: #f9fafb;
    padding: 1.5rem;
    border-radius: 0.75rem;
    overflow-x: auto;
    margin: 2rem 0;
  }

  .prose pre code {
    background-color: transparent;
    padding: 0;
    color: inherit;
  }

  .prose hr {
    margin: 2.5rem 0;
    border-color: #e5e7eb;
  }

  .prose table {
    width: 100%;
    border-collapse: collapse;
    margin: 2rem 0;
  }

  .prose th, .prose td {
    border: 1px solid #e5e7eb;
    padding: 1rem;
    text-align: left;
  }

  .prose th {
    background-color: #f9fafb;
    font-weight: 600;
  }

  .prose img {
    margin: 2rem 0;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
</style>
