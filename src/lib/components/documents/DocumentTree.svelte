<script lang="ts">
  import type { DocumentModel } from '$lib/types/documents';
  import Icon from '@iconify/svelte';
  import { Input } from '$lib/components/ui/form/index.js';

  const { 
    documents = [],
    projects = [],
    selectedDocument = null,
    onDocumentSelect = () => {},
    className = ""
  } = $props<{
    documents: DocumentModel[];
    projects: Array<{ id: number; name: string }>;
    selectedDocument: DocumentModel | null;
    onDocumentSelect: (doc: DocumentModel) => void;
    className?: string;
  }>();

  // Search state
  let searchQuery = $state('');
  let expandedProjects = $state<Set<number>>(new Set());

  // Computed tree structure
  let documentTree = $derived(() => {
    const tree: Array<{
      type: 'project';
      id: number;
      name: string;
      documents: DocumentModel[];
      expanded: boolean;
    } | {
      type: 'uncategorized';
      documents: DocumentModel[];
      expanded: boolean;
    }> = [];

    // Group documents by project
    const projectDocs = new Map<number, DocumentModel[]>();
    const uncategorizedDocs: DocumentModel[] = [];

    documents.forEach((doc: DocumentModel) => {
      if (doc.project_id && projects.find((p: { id: number; name: string }) => p.id === doc.project_id)) {
        if (!projectDocs.has(doc.project_id)) {
          projectDocs.set(doc.project_id, []);
        }
        projectDocs.get(doc.project_id)!.push(doc);
      } else {
        uncategorizedDocs.push(doc);
      }
    });

    // Add project sections
    projects.forEach((project: { id: number; name: string }) => {
      const docs = projectDocs.get(project.id) || [];
      if (docs.length > 0) {
        tree.push({
          type: 'project',
          id: project.id,
          name: project.name,
          documents: docs,
          expanded: expandedProjects.has(project.id)
        });
      }
    });

    // Add uncategorized section if there are documents
    if (uncategorizedDocs.length > 0) {
      tree.push({
        type: 'uncategorized',
        documents: uncategorizedDocs,
        expanded: expandedProjects.has(-1) // Use -1 for uncategorized
      });
    }

    return tree;
  });

  // Filtered tree based on search
  let filteredTree = $derived(() => {
    if (!searchQuery.trim()) {
      return documentTree();
    }

    const query = searchQuery.toLowerCase();
    return documentTree().map((section: any) => {
      if (section.type === 'project') {
        const filteredDocs = section.documents.filter((doc: DocumentModel) =>
          doc.title.toLowerCase().includes(query) ||
          doc.content.toLowerCase().includes(query)
        );
        return { ...section, documents: filteredDocs };
      } else {
        const filteredDocs = section.documents.filter((doc: DocumentModel) =>
          doc.title.toLowerCase().includes(query) ||
          doc.content.toLowerCase().includes(query)
        );
        return { ...section, documents: filteredDocs };
      }
    }).filter((section: any) => section.documents.length > 0);
  });

  function toggleProject(projectId: number) {
    if (expandedProjects.has(projectId)) {
      expandedProjects.delete(projectId);
    } else {
      expandedProjects.add(projectId);
    }
    expandedProjects = new Set(expandedProjects);
  }

  function toggleUncategorized() {
    const uncategorizedId = -1;
    if (expandedProjects.has(uncategorizedId)) {
      expandedProjects.delete(uncategorizedId);
    } else {
      expandedProjects.add(uncategorizedId);
    }
    expandedProjects = new Set(expandedProjects);
  }

  function getDocumentIcon(doc: DocumentModel) {
    if (doc.is_draft) return 'mdi:pencil';
    if (doc.tags) {
      try {
        const tags = JSON.parse(doc.tags as any);
        if (Array.isArray(tags) && tags.length > 0) {
          if (tags.includes('api')) return 'mdi:api';
          if (tags.includes('guide')) return 'mdi:book-open-variant';
          if (tags.includes('tutorial')) return 'mdi:school';
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    return 'mdi:file-document-outline';
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
</script>

<div class="space-y-4 {className}">
  <!-- Search -->
  <div class="relative">
    <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <Input
      type="text"
      placeholder="Search documents..."
      value={searchQuery}
      oninput={(e: Event) => searchQuery = (e.target as HTMLInputElement).value}
      class="pl-10 pr-4 py-2 text-sm"
    />
  </div>

  <!-- Document Tree -->
  <div class="space-y-2">
    {#if filteredTree().length === 0}
      <div class="text-center py-8 text-gray-500 dark:text-gray-400">
        <Icon icon="mdi:file-document-multiple-outline" class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p class="text-sm">No documents found</p>
        {#if searchQuery.trim()}
          <p class="text-xs">Try adjusting your search</p>
        {:else}
          <p class="text-xs">Create your first document or use the "Sample Data" button to get started</p>
        {/if}
      </div>
    {:else}
      {#each filteredTree() as section}
        {#if section.type === 'project'}
          <!-- Project Section -->
          <div class="space-y-1">
            <button
              onclick={() => toggleProject(section.id)}
              class="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <Icon 
                icon={section.expanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} 
                class="w-4 h-4 flex-shrink-0" 
              />
              <Icon icon="mdi:folder" class="w-4 h-4 text-blue-500" />
              <span class="flex-1 text-left truncate">{section.name}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                {section.documents.length}
              </span>
            </button>
            
            {#if section.expanded}
              <div class="ml-6 space-y-1">
                {#each section.documents as doc}
                  <button
                    onclick={() => onDocumentSelect(doc)}
                    class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors {selectedDocument?.id === doc.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''}"
                  >
                    <Icon icon={getDocumentIcon(doc)} class="w-4 h-4 flex-shrink-0" />
                    <span class="flex-1 text-left truncate">{doc.title || 'Untitled'}</span>
                    {#if doc.is_draft}
                      <Icon icon="mdi:pencil" class="w-3 h-3 text-amber-500" />
                    {/if}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <!-- Uncategorized Section -->
          <div class="space-y-1">
            <button
              onclick={toggleUncategorized}
              class="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <Icon 
                icon={section.expanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} 
                class="w-4 h-4 flex-shrink-0" 
              />
              <Icon icon="mdi:file-document-multiple" class="w-4 h-4 text-gray-500" />
              <span class="flex-1 text-left truncate">Uncategorized</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                {section.documents.length}
              </span>
            </button>
            
            {#if section.expanded}
              <div class="ml-6 space-y-1">
                {#each section.documents as doc}
                  <button
                    onclick={() => onDocumentSelect(doc)}
                    class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors {selectedDocument?.id === doc.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''}"
                  >
                    <Icon icon={getDocumentIcon(doc)} class="w-4 h-4 flex-shrink-0" />
                    <span class="flex-1 text-left truncate">{doc.title || 'Untitled'}</span>
                    {#if doc.is_draft}
                      <Icon icon="mdi:pencil" class="w-3 h-3 text-amber-500" />
                    {/if}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>
