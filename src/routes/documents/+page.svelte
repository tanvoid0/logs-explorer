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
import DocumentTree from '$lib/components/documents/DocumentTree.svelte';
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
  let isCreatingSampleData = $state(false);



  // Available tags and projects - will be loaded from database
  let availableTags = $state<string[]>([]);
  let availableProjects = $state<Array<{ id: number; name: string }>>([]);
  let tagCounts = $state<Record<string, number>>({});
  
  // UI state
  let showFilters = $state(false);

  onMount(() => {
    loadDocuments();
    loadProjects();
  });

  async function loadDocuments() {
    try {
      isLoading = true;
      logger.info('Loading documents...');
      
      const result = await invoke('get_all_documents');
      documents = result as DocumentModel[];
      filteredDocuments = [...documents];
      
      // Extract unique tags from documents
      tagCounts = extractTagsFromDocuments();
      
      logger.info(`Loaded ${documents.length} documents`);
    } catch (error) {
      logger.error('Failed to load documents:', error);
      toastStore.error('Failed to load documents');
    } finally {
      isLoading = false;
    }
  }

  async function loadProjects() {
    try {
      logger.info('Loading projects...');
      
      const result = await invoke('get_all_projects');
      availableProjects = result as Array<{ id: number; name: string }>;
      
      logger.info(`Loaded ${availableProjects.length} projects:`, availableProjects);
      
      // If no projects found, add a default project for testing
      if (availableProjects.length === 0) {
        logger.info('No projects found, adding default project for testing');
        availableProjects = [
          { id: 1, name: 'Sample Project' },
          { id: 2, name: 'Documentation' }
        ];
      }
    } catch (error) {
      logger.error('Failed to load projects:', error);
      toastStore.error('Failed to load projects');
      
      // Fallback to default projects if loading fails
      logger.info('Using fallback default projects');
      availableProjects = [
        { id: 1, name: 'Sample Project' },
        { id: 2, name: 'Documentation' }
      ];
    }
  }

  function extractTagsFromDocuments() {
    const allTags = new Set<string>();
    const tagCounts: Record<string, number> = {};
    
    logger.info(`Processing ${documents.length} documents for tags`);
    
    documents.forEach(doc => {
      logger.info(`Document ${doc.id}: ${doc.title} - tags:`, doc.tags);
      
      if (doc.tags) {
        try {
          const docTags = JSON.parse(doc.tags as any);
          logger.info(`Parsed tags for document ${doc.id}:`, docTags);
          
          if (Array.isArray(docTags)) {
            docTags.forEach((tag: string) => {
              allTags.add(tag);
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        } catch (e) {
          logger.warn(`Failed to parse tags for document ${doc.id}: ${e}`);
        }
      } else {
        logger.info(`Document ${doc.id} has no tags`);
      }
    });
    
    availableTags = Array.from(allTags).sort();
    logger.info(`Extracted ${availableTags.length} unique tags from documents:`, availableTags);
    logger.info(`Tag counts:`, tagCounts);
    
    // If no tags found in documents, provide some default tags for testing
    if (availableTags.length === 0) {
      logger.info('No tags found in documents, adding default tags for testing');
      const defaultTags = ['documentation', 'api', 'guide', 'tutorial', 'reference', 'notes', 'planning', 'design'];
      availableTags = defaultTags;
      defaultTags.forEach(tag => {
        tagCounts[tag] = 0; // These tags have 0 documents initially
      });
    }
    
    return tagCounts;
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

  async function createSampleData() {
    try {
      isCreatingSampleData = true;
      logger.info('Creating sample data...');
      
      // Create sample projects first
      const sampleProjects = [
        { name: 'Sample Project', path: '/tmp/sample-project', framework: 'Node.js' },
        { name: 'Documentation', path: '/tmp/documentation', framework: 'Vue.js' }
      ];
      
      const projectIds = [];
      for (const project of sampleProjects) {
        try {
          const projectId = await invoke('add_project', {
            name: project.name,
            path: project.path,
            framework: project.framework,
            deployment: null
          });
          projectIds.push(projectId);
          logger.info(`Created project: ${project.name} (ID: ${projectId})`);
        } catch (error) {
          logger.warn(`Project "${project.name}" might already exist: ${error}`);
          // Try to get existing project ID
          try {
            const projects = await invoke('get_all_projects') as Array<{ id: number; name: string }>;
            const existingProject = projects.find((p: { id: number; name: string }) => p.name === project.name);
            if (existingProject) {
              projectIds.push(existingProject.id);
            } else {
              projectIds.push(projectIds.length + 1); // Fallback ID
            }
          } catch (getError) {
            projectIds.push(projectIds.length + 1); // Fallback ID
          }
        }
      }
      
      // Create sample documents
      const sampleDocuments = [
        {
          title: 'Getting Started Guide',
          content: `# Getting Started Guide

Welcome to Logs Explorer! This guide will help you get started with the application.

## Features

- **Document Management**: Create, organize, and manage your knowledge base
- **Project Organization**: Group documents by projects
- **Smart Tagging**: Use tags to categorize and find documents quickly
- **Markdown Support**: Write rich content with markdown formatting

## Quick Start

1. Create your first document
2. Add tags to organize content
3. Group documents by projects
4. Use the search to find what you need

Happy documenting!`,
          tags: ['guide', 'documentation', 'getting-started'],
          projectId: projectIds[0] || 1
        },
        {
          title: 'API Reference',
          content: `# API Reference

This document contains the API reference for Logs Explorer.

## Endpoints

### Documents
- \`GET /documents\` - Get all documents
- \`POST /documents\` - Create a new document
- \`PUT /documents/:id\` - Update a document
- \`DELETE /documents/:id\` - Delete a document

### Projects
- \`GET /projects\` - Get all projects
- \`POST /projects\` - Create a new project

## Authentication

All API endpoints require authentication via JWT tokens.`,
          tags: ['api', 'reference', 'documentation'],
          projectId: projectIds[0] || 1
        },
        {
          title: 'Project Planning Notes',
          content: `# Project Planning Notes

## Current Sprint Goals

- [ ] Implement document search functionality
- [ ] Add document versioning
- [ ] Improve tag management
- [ ] Add export functionality

## Future Features

- Document templates
- Collaborative editing
- Advanced search filters
- Document analytics

## Notes

Remember to update the roadmap document with any new ideas or requirements.`,
          tags: ['planning', 'notes', 'project'],
          projectId: projectIds[1] || 2
        },
        {
          title: 'Design System',
          content: `# Design System

## Color Palette

- **Primary**: Blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

## Typography

- **Headings**: Inter, sans-serif
- **Body**: Inter, sans-serif
- **Monospace**: JetBrains Mono

## Components

- Buttons
- Input fields
- Cards
- Modals
- Navigation`,
          tags: ['design', 'ui', 'documentation'],
          projectId: projectIds[1] || 2
        },
        {
          title: 'Tutorial: Creating Your First Document',
          content: `# Tutorial: Creating Your First Document

Follow this step-by-step guide to create your first document in Logs Explorer.

## Step 1: Navigate to Documents

Click on the "Documents" section in the sidebar.

## Step 2: Create New Document

Click the "+ New" button in the top right corner.

## Step 3: Fill in Details

- **Title**: Enter a descriptive title
- **Content**: Write your content in markdown
- **Tags**: Add relevant tags (comma-separated)
- **Project**: Select a project (optional)

## Step 4: Save

Click "Create Document" to save your document.

## Next Steps

- Edit your document
- Add more tags
- Organize into projects
- Share with team members`,
          tags: ['tutorial', 'guide', 'getting-started'],
          projectId: null
        }
      ];
      
      for (const doc of sampleDocuments) {
        try {
          const result = await invoke('create_document', {
            title: doc.title,
            content: doc.content,
            projectId: doc.projectId,
            deploymentId: null,
            tags: doc.tags
          }) as DocumentModel;
          logger.info(`Created document: ${doc.title} (ID: ${result.id})`);
        } catch (error) {
          logger.error(`Failed to create document "${doc.title}":`, error);
        }
      }
      
      // Reload documents and projects
      await loadDocuments();
      await loadProjects();
      
      toastStore.success('Sample data created successfully!');
      logger.info('Sample data creation completed');
      
    } catch (error) {
      logger.error('Failed to create sample data:', error);
      toastStore.error('Failed to create sample data');
    } finally {
      isCreatingSampleData = false;
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
        <div class="flex gap-2">
          <Button 
            onclick={createSampleData} 
            size="sm" 
            variant="outline"
            disabled={isCreatingSampleData}
            className="flex-shrink-0"
          >
            <Icon icon="mdi:database-plus" className="w-4 h-4 mr-2" />
            {isCreatingSampleData ? 'Creating...' : 'Sample Data'}
          </Button>
          <Button onclick={() => showCreateModal = true} size="sm" className="flex-shrink-0">
            <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
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

          <!-- Document Tree Navigation -->
      <div class="flex-1 overflow-y-auto p-4">
        <DocumentTree
          documents={documents}
          projects={availableProjects}
          selectedDocument={selectedDocument}
          onDocumentSelect={openDocument}
          className="mb-4"
        />
        
        <!-- Filters Toggle -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onclick={() => showFilters = !showFilters}
            class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <span class="flex items-center gap-2">
              <Icon icon="mdi:filter-variant" class="w-4 h-4" />
              Advanced Filters
            </span>
            <Icon 
              icon={showFilters ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
              class="w-4 h-4" 
            />
          </button>
          
          {#if showFilters}
            <div class="mt-4">
              <DocumentFilters
                searchQuery={searchQuery}
                selectedTags={selectedTags}
                selectedProject={selectedProjectId}
                availableTags={availableTags}
                availableProjects={availableProjects}
                tagCounts={tagCounts}
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
          {/if}
        </div>
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
            <div class="flex flex-col gap-3">
              <Button onclick={() => showCreateModal = true} size="lg" class="mx-auto">
                <Icon icon="mdi:plus" class="w-5 h-5 mr-2" />
                Create Your First Document
              </Button>
              <Button 
                onclick={createSampleData} 
                size="sm" 
                variant="outline"
                disabled={isCreatingSampleData}
                class="mx-auto"
              >
                <Icon icon="mdi:database-plus" class="w-4 h-4 mr-2" />
                {isCreatingSampleData ? 'Creating Sample Data...' : 'Create Sample Data'}
              </Button>
            </div>
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
