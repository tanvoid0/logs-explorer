<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { logger } from '$lib/utils/logger.js';
  import Button from '$lib/components/ui/button.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/form/index.js';
  import { toastStore } from '$lib/stores/toast-store';
  import { invoke } from '@tauri-apps/api/core';
  import type { DocumentModel } from '$lib/types/documents';
  import Icon from '@iconify/svelte';

  const { 
    document = null, 
    onSave = () => {}, 
    onCancel = () => {} 
  } = $props<{
    document?: DocumentModel | null;
    onSave?: (document: DocumentModel) => void;
    onCancel?: () => void;
  }>();

  // State
  let title = $state('');
  let content = $state('');
  let contentDraft = $state('');
  let tags = $state<string[]>([]);
  let projectId = $state<number | null>(null);
  let isEditing = $state(false);
  let isSaving = $state(false);
  let showPreview = $state(true);
  let autoSaveTimer: NodeJS.Timeout | null = null;

  // Available tags
  const availableTags = [
    'documentation', 'api', 'guide', 'tutorial', 'reference', 'notes', 'planning', 'design'
  ];

  // Available projects (TODO: Load from API)
  const availableProjects = [
    { id: 1, name: 'Project A' },
    { id: 2, name: 'Project B' },
  ];

  onMount(() => {
    if (document) {
      // Edit mode
      title = document.title;
      content = document.content;
      contentDraft = document.content_draft || document.content;
      projectId = document.project_id;
      if (document.tags) {
        tags = JSON.parse(document.tags as any);
      }
    } else {
      // Create mode
      title = '';
      content = '';
      contentDraft = '';
      tags = [];
      projectId = null;
    }

    // Start auto-save for drafts
    startAutoSave();

    // Add keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveDocument();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  onDestroy(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
  });

  function startAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    autoSaveTimer = setTimeout(() => {
      if (document && contentDraft !== document.content) {
        saveDraft();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
  }

  // Mock functions for demonstration
  function renderMarkdown(content: string) {
    // This would normally use a markdown parser
    return content.replace(/\n/g, '<br>');
  }

  function saveDocument() {
    // Implementation would go here
  }

  function saveDraft() {
    // Implementation would go here
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">
      {document ? 'Edit Document' : 'Create Document'}
    </h2>
    
    <div class="flex items-center space-x-3">
      <Button 
        variant="outline" 
        onclick={onCancel}
        disabled={isSaving}
      >
        Cancel
      </Button>
      
      <Button 
        onclick={saveDocument}
        disabled={isSaving}
        loading={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Document'}
      </Button>
    </div>
  </div>

  <!-- Form -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Main Content -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Title -->
      <div>
        <label for="title" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Title
        </label>
        <Input
          id="title"
          type="text"
          placeholder="Enter document title..."
          value={title}
          onchange={(e) => title = e.target.value}
          class="w-full"
        />
      </div>

      <!-- Content -->
      <div>
        <label for="content" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Content
        </label>
        <textarea
          id="content"
          placeholder="Write your document content here..."
          value={contentDraft}
          onchange={(e) => contentDraft = e.target.value}
          class="w-full h-96 p-4 border border-slate-300 rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>

    <!-- Sidebar -->
    <div class="space-y-6">
      <!-- Project Selection -->
      <div>
        <label for="project" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Project (optional)
        </label>
        <select
          id="project"
          value={projectId || ''}
          onchange={(e) => projectId = e.target.value ? Number(e.target.value) : null}
          class="w-full p-3 border border-slate-300 rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">No Project</option>
          {#each availableProjects as project}
            <option value={project.id}>{project.name}</option>
          {/each}
        </select>
      </div>

      <!-- Tags -->
      <div>
        <label for="tags" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Tags (optional)
        </label>
        <div class="space-y-2">
          {#each availableTags as tag}
            <label class="flex items-center">
              <input
                type="checkbox"
                value={tag}
                checked={tags.includes(tag)}
                onchange={(e) => {
                  if (e.target.checked) {
                    tags = [...tags, tag];
                  } else {
                    tags = tags.filter(t => t !== tag);
                  }
                }}
                class="mr-2 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-slate-700 dark:text-slate-300">{tag}</span>
            </label>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Preview -->
  {#if showPreview}
    <div class="space-y-6">
      <h3 class="text-lg font-medium text-slate-900 dark:text-white">Preview</h3>
      
      <Card className="h-96 overflow-y-auto">
        <CardContent className="p-6">
          <!-- Tailwind-based prose styles instead of custom CSS -->
          <div class="prose prose-sm max-w-none dark:prose-invert [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:font-semibold [&_h1]:text-3xl [&_h1]:leading-9 [&_h2]:mt-6 [&_h2]:mb-4 [&_h2]:font-semibold [&_h2]:text-2xl [&_h2]:leading-8 [&_h3]:mt-6 [&_h3]:mb-4 [&_h3]:font-semibold [&_h3]:text-xl [&_h3]:leading-7 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:pl-6 [&_li]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_blockquote]:my-6 [&_blockquote]:italic [&_blockquote]:text-slate-500 [&_blockquote]:bg-slate-50 [&_blockquote]:p-4 [&_blockquote]:rounded-md [&_code]:font-mono [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-slate-800 [&_pre]:text-slate-50 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_hr]:my-8 [&_hr]:border-slate-200 [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_th]:border [&_th]:border-slate-200 [&_th]:p-3 [&_th]:text-left [&_th]:bg-slate-50 [&_th]:font-semibold [&_td]:border [&_td]:border-slate-200 [&_td]:p-3 [&_td]:text-left">
            {@html renderMarkdown(contentDraft)}
          </div>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
