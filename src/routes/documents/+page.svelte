<script lang="ts">
  import { onMount } from 'svelte';
  import { logger } from '$lib/utils/logger.js';
  import Button from '$lib/components/ui/button.svelte';
  import { toastStore } from '$lib/stores/toast-store';
  import { invoke } from '@tauri-apps/api/core';
  import type { DocumentModel } from '$lib/types/documents';
  import Icon from '@iconify/svelte';
  import MarkdownEditor from '$lib/components/documents/MarkdownEditor.svelte';
  import DocumentList from '$lib/components/documents/DocumentList.svelte';
  import DocumentFilters from '$lib/components/documents/DocumentFilters.svelte';
  import DocumentTabs from '$lib/components/documents/DocumentTabs.svelte';
  import CreateDocumentModal from '$lib/components/documents/CreateDocumentModal.svelte';


  // State
  let documents = $state<DocumentModel[]>([]);
  let filteredDocuments = $state<DocumentModel[]>([]);
  let isLoading = $state(false);
  let searchQuery = $state('');
  let selectedTags = $state<string[]>([]);
  let selectedProjectId = $state<number | null>(null);
  let selectedDocument = $state<DocumentModel | null>(null);
  let openTabs = $state<DocumentModel[]>([]);
  let activeTabIndex = $state(0);
  let showCreateModal = $state(false);



  // Available tags for filtering
  const availableTags = [
    'documentation', 'api', 'guide', 'tutorial', 'reference', 'notes', 'planning', 'design'
  ];

  // Available projects (TODO: Load from API)
  const availableProjects = [
    { id: 1, name: 'Project A' },
    { id: 2, name: 'Project B' },
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

    // Apply project filter
    if (selectedProjectId !== null) {
      filtered = filtered.filter(doc => doc.project_id === selectedProjectId);
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

  async function createDocument(documentData: { title: string; content: string; tags: string[]; projectId: number | null }) {
    try {
      logger.info('Creating new document...');
      
      const result = await invoke('create_document', {
        title: documentData.title,
        content: documentData.content,
        projectId: documentData.projectId,
        deploymentId: null,
        tags: documentData.tags.length > 0 ? documentData.tags : null
      });

      const newDoc = result as DocumentModel;
      documents = [newDoc, ...documents];
      filteredDocuments = [newDoc, ...filteredDocuments];

      // Close modal
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
  <div class="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
    <!-- Sidebar Header -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Documents</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Organize and manage your knowledge</p>
        </div>
        <Button onclick={() => showCreateModal = true} size="sm" className="flex-shrink-0">
          <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
          New
        </Button>
      </div>
      
      <!-- Quick Stats -->
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="text-lg font-semibold text-gray-900 dark:text-white">{documents.length}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Total</div>
        </div>
        <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="text-lg font-semibold text-gray-900 dark:text-white">{documents.filter(d => d.is_draft).length}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Drafts</div>
        </div>
        <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="text-lg font-semibold text-gray-900 dark:text-white">{documents.filter(d => d.project_id).length}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Projects</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex-1 overflow-y-auto p-4">
      <DocumentFilters
        searchQuery={searchQuery}
        selectedTags={selectedTags}
        selectedProject={selectedProjectId}
        availableTags={availableTags}
        availableProjects={availableProjects}
        onSearchChange={(query) => searchQuery = query}
        onTagToggle={toggleTag}
        onProjectChange={(projectId) => selectedProjectId = projectId}
        onClearFilters={() => {
          searchQuery = '';
          selectedTags = [];
          selectedProjectId = null;
        }}
      />
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col">
    <!-- Tab Bar -->
    <DocumentTabs
      openTabs={openTabs}
      activeTabIndex={activeTabIndex}
      onTabSelect={(index) => { activeTabIndex = index; selectedDocument = openTabs[index]; }}
      onTabClose={closeTab}
    />

    <!-- Content Area -->
    <div class="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
      {#if selectedDocument}
        <!-- Document Editor -->
        <div class="h-full p-6">
          <MarkdownEditor 
            document={selectedDocument}
          />
        </div>
      {:else if openTabs.length === 0}
        <!-- Welcome Screen -->
        <div class="flex items-center justify-center h-full p-8">
          <div class="text-center max-w-md">
            <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon icon="mdi:file-document-multiple" className="w-12 h-12 text-white" />
            </div>
            <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Welcome to Documents
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Create, organize, and manage your documents with powerful markdown editing, 
              smart tagging, and project organization.
            </p>
            <Button onclick={() => showCreateModal = true} size="lg" class="mx-auto">
              <Icon icon="mdi:plus" class="w-5 h-5 mr-2" />
              Create Your First Document
            </Button>
          </div>
        </div>
      {:else}
        <!-- Document List View -->
        <div class="h-full p-6">
          <DocumentList
            documents={filteredDocuments}
            selectedDocument={selectedDocument}
            onSelectDocument={openDocument}
            onOpenInNew={openInNewWindow}
          />
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
        
        <div class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">Use the new CreateDocumentModal component</p>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Create Document Modal -->
<CreateDocumentModal
  isOpen={showCreateModal}
  onClose={() => showCreateModal = false}
  onCreate={createDocument}
  availableTags={availableTags}
  availableProjects={availableProjects}
/>

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
