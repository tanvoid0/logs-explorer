<script lang="ts">
  import { onMount } from 'svelte';
  import { logger } from '$lib/utils/logger.js';
  import Button from '$lib/components/ui/button.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  import { Input, Textarea } from '$lib/components/ui/form/index.js';
  import { toastStore } from '$lib/stores/toast-store';
  import { invoke } from '@tauri-apps/api/core';
  import type { DocumentModel } from '$lib/types/documents';
  import Icon from '@iconify/svelte';
  import MarkdownEditor from '$lib/components/documents/MarkdownEditor.svelte';

  // State
  let documents = $state<DocumentModel[]>([]);
  let filteredDocuments = $state<DocumentModel[]>([]);
  let isLoading = $state(false);
  let searchQuery = $state('');
  let selectedTags = $state<string[]>([]);
  let selectedDocument = $state<DocumentModel | null>(null);
  let openTabs = $state<DocumentModel[]>([]);
  let activeTabIndex = $state(0);
  let showCreateModal = $state(false);

  // Form state
  let newDocumentTitle = $state('');
  let newDocumentContent = $state('');
  let newDocumentTags = $state<string[]>([]);
  let newDocumentProjectId = $state<number | null>(null);
  let parentDocumentId = $state<number | null>(null);

  // Available tags for filtering
  const availableTags = [
    'documentation', 'api', 'guide', 'tutorial', 'reference', 'notes', 'planning', 'design'
  ];

  onMount(() => {
    loadDocuments();
  });

  async function loadDocuments() {
    try {
      isLoading = true;
      logger.info('Loading documents...');
      
      const result = await invoke('get_all_documents');
      documents = result as DocumentModel[];
      filteredDocuments = [...documents];
      
      logger.info(`Loaded ${documents.length} documents`);
    } catch (error) {
      logger.error('Failed to load documents:', error);
      toastStore.error('Failed to load documents');
    } finally {
      isLoading = false;
    }
  }

  function filterDocuments() {
    let filtered = [...documents];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.content.toLowerCase().includes(query)
      );
    }

    // Apply tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(doc => {
        if (doc.tags) {
          const docTags = JSON.parse(doc.tags as any);
          return selectedTags.some(tag => docTags.includes(tag));
        }
        return false;
      });
    }

    filteredDocuments = filtered;
  }

  function openDocument(doc: DocumentModel) {
    // Check if document is already open
    const existingTabIndex = openTabs.findIndex(tab => tab.id === doc.id);
    if (existingTabIndex !== -1) {
      activeTabIndex = existingTabIndex;
      return;
    }

    // Open new tab
    openTabs = [...openTabs, doc];
    activeTabIndex = openTabs.length - 1;
    selectedDocument = doc;
  }

  function closeTab(index: number) {
    if (openTabs.length <= 1) {
      // Don't close the last tab
      return;
    }

    openTabs = openTabs.filter((_, i) => i !== index);
    
    if (activeTabIndex >= index && activeTabIndex > 0) {
      activeTabIndex = activeTabIndex - 1;
    }
    
    if (openTabs.length > 0) {
      selectedDocument = openTabs[activeTabIndex];
    } else {
      selectedDocument = null;
    }
  }

  async function openInNewWindow(doc: DocumentModel) {
    try {
      // For now, just open in a new tab
      // TODO: Implement actual Tauri window management
      openDocument(doc);
      toastStore.info('Document opened in new tab');
    } catch (error) {
      logger.error('Failed to open document in new window', { error, document: doc.title });
      toastStore.error('Failed to open document in new window');
    }
  }

  async function createDocument() {
    if (!newDocumentContent.trim()) {
      toastStore.error('Document content is required');
      return;
    }

    try {
      logger.info('Creating new document...');
      
      // Use provided title or generate from first line (first 100 chars)
      let title = newDocumentTitle.trim();
      if (!title) {
        const firstLine = newDocumentContent.trim().split('\n')[0];
        title = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
      }
      
      const result = await invoke('create_document', {
        title: title,
        content: newDocumentContent.trim(),
        projectId: newDocumentProjectId,
        deploymentId: null,
        tags: newDocumentTags.length > 0 ? newDocumentTags : null
      });

      const newDoc = result as DocumentModel;
      documents = [newDoc, ...documents];
      filteredDocuments = [newDoc, ...filteredDocuments];

      // Reset form
      newDocumentTitle = '';
      newDocumentContent = '';
      newDocumentTags = [];
      newDocumentProjectId = null;
      parentDocumentId = null;
      showCreateModal = false;

      // Open the new document
      openDocument(newDoc);

      toastStore.success('Document created successfully');
      logger.info('Document created:', newDoc);
    } catch (error) {
      logger.error('Failed to create document:', error);
      toastStore.error('Failed to create document');
    }
  }

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
    filterDocuments();
  }

  function getDocumentStatus(doc: DocumentModel) {
    if (doc.is_draft) {
      return { text: 'Draft', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
    }
    return { text: 'Published', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  }

  function truncateContent(content: string, maxLength: number = 100) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  // Watch for changes to apply filters
  $effect(() => {
    filterDocuments();
  });

  $effect(() => {
    filterDocuments();
  });

  $effect(() => {
    filterDocuments();
  });
</script>

<svelte:head>
  <title>Documents - Logs Explorer</title>
</svelte:head>

<div class="flex h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Sidebar -->
  <div class="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
    <!-- Sidebar Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Documents</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Manage your documents</p>
    </div>

    <!-- Search Bar -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="relative">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
        <Input
          type="text"
          placeholder="Search documents..."
          bind:value={searchQuery}
          className="pl-9"
        />
      </div>
    </div>

    <!-- Quick Tag Filters -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Filters:</h3>
      <div class="flex flex-wrap gap-1">
        {#each availableTags as tag}
          <button
            onclick={() => toggleTag(tag)}
            class="px-2 py-1 text-xs rounded-full transition-colors {selectedTags.includes(tag) 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
          >
            {tag}
          </button>
        {/each}
      </div>
    </div>

    <!-- Create Button -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <Button onclick={() => showCreateModal = true} className="w-full">
        <Icon icon="mdi:plus" class="w-4 h-4 mr-2" />
        New Document
      </Button>
    </div>

    <!-- Documents List -->
    <div class="flex-1 overflow-y-auto">
      {#if isLoading}
        <div class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      {:else if filteredDocuments.length === 0}
        <div class="text-center py-8 px-4">
          <Icon icon="mdi:file-document-outline" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
          </p>
        </div>
      {:else}
        <div class="p-2">
          {#each filteredDocuments as doc}
            <div
              onclick={() => openDocument(doc)}
              class="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 {selectedDocument?.id === doc.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : ''}"
            >
              <div class="flex items-start justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {doc.title}
                </h4>
                <span class="px-2 py-1 text-xs font-medium rounded-full {getDocumentStatus(doc).class} ml-2 flex-shrink-0">
                  {getDocumentStatus(doc).text}
                </span>
              </div>
              
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                {truncateContent(doc.content, 80)}
              </p>
              
              <div class="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>{formatDate(doc.updated_at)}</span>
                <div class="flex gap-1">
                  <button
                    onclick={(e) => { e.stopPropagation(); openInNewWindow(doc); }}
                    class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Open in new window"
                  >
                    <Icon icon="mdi:open-in-new" class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col">
    <!-- Tab Bar -->
    {#if openTabs.length > 0}
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center overflow-x-auto px-2">
          {#each openTabs as tab, index}
            <div
              onclick={() => { activeTabIndex = index; selectedDocument = tab; }}
              class="flex items-center px-6 py-3 border-r border-gray-200 dark:border-gray-700 cursor-pointer transition-colors {activeTabIndex === index ? 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}"
            >
              <span class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-36">
                {tab.title}
              </span>
              {#if openTabs.length > 1}
                <button
                  onclick={(e) => { e.stopPropagation(); closeTab(index); }}
                  class="ml-3 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                  title="Close tab"
                >
                  <Icon icon="mdi:close" class="w-3.5 h-3.5 text-gray-400" />
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Document Editor -->
    <div class="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
      {#if selectedDocument}
        <div class="h-full p-6">
          <MarkdownEditor 
            document={selectedDocument}
          />
        </div>
      {:else}
        <div class="flex items-center justify-center h-full p-8">
          <div class="text-center">
            <Icon icon="mdi:file-document-outline" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Document Selected
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Select a document from the sidebar to start editing
            </p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Create Document Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Document</h2>
        
        <form onsubmit={(e) => { e.preventDefault(); createDocument(); }} class="space-y-4">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title (optional - auto-generated from content)
            </label>
            <Input
              id="title"
              type="text"
              bind:value={newDocumentTitle}
              placeholder="Enter custom title or leave blank for auto-generation..."
            />
          </div>

          <div>
            <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Document Content *
            </label>
            <Textarea
              id="content"
              bind:value={newDocumentContent}
              placeholder="Enter initial content (markdown supported)..."
              rows={6}
            />
          </div>

          <div>
            <label for="tags" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <div class="flex flex-wrap gap-2">
              {#each availableTags as tag}
                <button
                  type="button"
                  onclick={() => {
                    if (newDocumentTags.includes(tag)) {
                      newDocumentTags = newDocumentTags.filter(t => t !== tag);
                    } else {
                      newDocumentTags = [...newDocumentTags, tag];
                    }
                  }}
                  class="px-3 py-1 text-sm rounded-full transition-colors {newDocumentTags.includes(tag) 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
                >
                  {tag}
                </button>
              {/each}
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onclick={() => showCreateModal = false}>
              Cancel
            </Button>
            <Button type="submit">
              Create Document
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
