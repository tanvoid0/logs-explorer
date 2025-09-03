<script lang="ts">
  import type { DocumentModel } from '$lib/types/documents';
  import DocumentCard from './DocumentCard.svelte';
  import { Badge } from '$lib/components/ui/feedback/index.js';
  import Icon from '@iconify/svelte';

  const { 
    documents = [], 
    selectedDocument = null, 
    onSelectDocument = () => {}, 
    onOpenInNew = () => {},
    className = ""
  } = $props<{
    documents: DocumentModel[];
    selectedDocument?: DocumentModel | null;
    onSelectDocument?: (doc: DocumentModel) => void;
    onOpenInNew?: (doc: DocumentModel) => void;
    className?: string;
  }>();

  function getDocumentStats() {
    const total = documents.length;
    const drafts = documents.filter((doc: DocumentModel) => doc.is_draft).length;
    const withProjects = documents.filter((doc: DocumentModel) => doc.project_id).length;
    const withTags = documents.filter((doc: DocumentModel) => doc.tags).length;
    
    return { total, drafts, withProjects, withTags };
  }

  const stats = getDocumentStats();
</script>

<div class="space-y-6 {className}">
  <!-- Stats Overview -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
          <Icon icon="mdi:file-document-multiple" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Documents</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
          <Icon icon="mdi:pencil" className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{stats.drafts}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Drafts</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
          <Icon icon="mdi:folder" className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{stats.withProjects}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">With Projects</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
          <Icon icon="mdi:tag" className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{stats.withTags}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Tagged</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Documents Grid -->
  {#if documents.length === 0}
    <div class="text-center py-16 px-4">
      <div class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon icon="mdi:file-document-outline" className="w-12 h-12 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No documents found</h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        Get started by creating your first document. You can organize them with tags and link them to projects.
      </p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each documents as doc}
        <DocumentCard
          document={doc}
          isSelected={selectedDocument?.id === doc.id}
          onSelect={onSelectDocument}
          onOpenInNew={onOpenInNew}
        />
      {/each}
    </div>
  {/if}
</div>
