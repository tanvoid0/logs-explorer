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

  async function saveDraft() {
    if (!document) return;

    try {
      logger.info('Saving draft...');
      
      const result = await invoke('update_draft', {
        id: document.id,
        contentDraft: contentDraft
      });

      if (result) {
        logger.info('Draft saved successfully');
        // Don't show toast for auto-save
      }
    } catch (error) {
      logger.error('Failed to save draft:', error);
      // Don't show error toast for auto-save
    }
  }

  async function saveDocument() {
    if (!title.trim()) {
      toastStore.error('Document title is required');
      return;
    }

    try {
      isSaving = true;
      logger.info('Saving document...');

      if (document) {
        // Update existing document
        const result = await invoke('save_document', {
          id: document.id,
          title: title.trim(),
          content: contentDraft,
          tags: tags.length > 0 ? tags : null
        });

        if (result) {
          toastStore.success('Document saved successfully');
          onSave(result);
        }
      } else {
        // Create new document
        const result = await invoke('create_document', {
          title: title.trim(),
          content: contentDraft,
          projectId: projectId,
          deploymentId: null,
          tags: tags.length > 0 ? tags : null
        });

        toastStore.success('Document created successfully');
        onSave(result);
      }
    } catch (error) {
      logger.error('Failed to save document:', error);
      toastStore.error('Failed to save document');
    } finally {
      isSaving = false;
    }
  }

  function toggleTag(tag: string) {
    if (tags.includes(tag)) {
      tags = tags.filter(t => t !== tag);
    } else {
      tags = [...tags, tag];
    }
  }

  function handleContentChange() {
    startAutoSave();
  }

  function togglePreview() {
    showPreview = !showPreview;
  }

  function renderMarkdown(text: string): string {
    // Simple markdown rendering for preview
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');
  }
</script>

<div class="markdown-editor bg-white dark:bg-gray-800 rounded-lg shadow-sm">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8 p-6 border-b border-gray-200 dark:border-gray-700">
    <div class="flex-1">
      <input
        type="text"
        bind:value={title}
        placeholder="Document title..."
        class="text-2xl font-bold border-none p-0 bg-transparent focus:ring-0 w-full"
      />
    </div>
    
    <div class="flex items-center gap-3">
      <Button variant="outline" onclick={togglePreview}>
        <Icon icon={showPreview ? "mdi:eye-off" : "mdi:eye"} className="w-4 h-4 mr-2" />
        {showPreview ? 'Hide Preview' : 'Show Preview'}
      </Button>
      
      <Button variant="outline" onclick={onCancel}>
        Cancel
      </Button>
      
      <Button onclick={saveDocument} disabled={isSaving}>
        <Icon icon="mdi:content-save" className="w-4 h-4 mr-2" />
        {isSaving ? 'Saving...' : 'Save'}
        <span class="ml-2 text-xs opacity-70">Ctrl+S</span>
      </Button>
    </div>
  </div>

  <!-- Metadata -->
  <div class="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Project
      </label>
      <select
        bind:value={projectId}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value={null}>No Project</option>
        {#each availableProjects as project}
          <option value={project.id}>{project.name}</option>
        {/each}
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Tags
      </label>
      <div class="flex flex-wrap gap-2">
        {#each availableTags as tag}
          <button
            type="button"
            onclick={() => toggleTag(tag)}
            class="px-3 py-1 text-sm rounded-full transition-colors {tags.includes(tag) 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
          >
            {tag}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Editor and Preview -->
  <div class="grid grid-cols-1 {showPreview ? 'lg:grid-cols-2' : ''} gap-8 p-6">
    <!-- Editor -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Editor</h3>
        {#if document && contentDraft !== document.content}
          <span class="text-sm text-yellow-600 dark:text-yellow-400 flex items-center">
            <Icon icon="mdi:pencil" class="w-4 h-4 mr-1" />
            Draft
          </span>
        {/if}
      </div>
      
      <textarea
        bind:value={contentDraft}
        oninput={handleContentChange}
        placeholder="Write your markdown content here..."
        class="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      ></textarea>
      
      <div class="text-sm text-gray-500 dark:text-gray-400">
        <p>Supports Markdown syntax: # Headers, **bold**, *italic*, `code`, etc.</p>
        <p class="mt-1">💡 <strong>Keyboard Shortcut:</strong> Press <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+S</kbd> to save quickly</p>
        {#if document && contentDraft !== document.content}
          <p class="text-yellow-600 dark:text-yellow-400 mt-1">
            Auto-saving draft... Click Save to commit changes.
          </p>
        {/if}
      </div>
    </div>

    <!-- Preview -->
    {#if showPreview}
      <div class="space-y-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Preview</h3>
        
        <Card className="h-96 overflow-y-auto">
          <CardContent className="p-6">
            <div class="prose prose-sm max-w-none dark:prose-invert [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:font-semibold [&_h1]:text-3xl [&_h1]:leading-9 [&_h2]:mt-6 [&_h2]:mb-4 [&_h2]:font-semibold [&_h2]:text-2xl [&_h2]:leading-8 [&_h3]:mt-6 [&_h3]:mb-4 [&_h3]:font-semibold [&_h3]:text-xl [&_h3]:leading-7 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:pl-6 [&_li]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_blockquote]:my-6 [&_blockquote]:italic [&_blockquote]:text-slate-500 [&_blockquote]:bg-slate-50 [&_blockquote]:p-4 [&_blockquote]:rounded-md [&_code]:font-mono [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-slate-800 [&_pre]:text-slate-50 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_hr]:my-8 [&_hr]:border-slate-200 [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_th]:border [&_th]:border-slate-200 [&_th]:p-3 [&_th]:text-left [&_th]:bg-slate-50 [&_th]:font-semibold [&_td]:border [&_td]:border-slate-200 [&_td]:p-3 [&_td]:text-left">
              {@html renderMarkdown(contentDraft)}
            </div>
          </CardContent>
        </Card>
      </div>
    {/if}
  </div>
</div>


