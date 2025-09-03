<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';
  import { Input, Textarea } from '$lib/components/ui/form/index.js';
  import { Badge } from '$lib/components/ui/feedback/index.js';
  import Icon from '@iconify/svelte';

  const { 
    isOpen = false, 
    onClose = () => {}, 
    onCreate = () => {},
    availableTags = [],
    availableProjects = [],
    className = ""
  } = $props<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (document: { title: string; content: string; tags: string[]; projectId: number | null }) => void;
    availableTags: string[];
    availableProjects: Array<{ id: number; name: string }>;
    className?: string;
  }>();

  // Form state
  let title = $state('');
  let content = $state('');
  let selectedTags = $state<string[]>([]);
  let selectedProjectId = $state<number | null>(null);
  let isSubmitting = $state(false);

  function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }

    isSubmitting = true;
    
    // Use provided title or generate from first line
    let finalTitle = title.trim();
    if (!finalTitle) {
      const firstLine = content.trim().split('\n')[0];
      finalTitle = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
    }

    onCreate({
      title: finalTitle,
      content: content.trim(),
      tags: selectedTags,
      projectId: selectedProjectId
    });

    // Reset form
    title = '';
    content = '';
    selectedTags = [];
    selectedProjectId = null;
    isSubmitting = false;
  }

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
  }

  function handleClose() {
    if (!isSubmitting) {
      onClose();
    }
  }

  function handleBackdropClick(e: Event) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }
</script>

{#if isOpen}
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 {className}"
    onclick={handleBackdropClick}
  >
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Create New Document</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Start writing your document with markdown support
          </p>
        </div>
        
        <button
          onclick={handleClose}
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          disabled={isSubmitting}
        >
          <Icon icon="mdi:close" className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <!-- Form -->
      <form onsubmit={handleSubmit} class="p-6 space-y-6">
        <!-- Title -->
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title
            <span class="text-gray-400 ml-1">(optional - auto-generated from content)</span>
          </label>
          <Input
            id="title"
            type="text"
            bind:value={title}
            placeholder="Enter custom title or leave blank for auto-generation..."
            class="w-full"
          />
        </div>

        <!-- Content -->
        <div>
          <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content <span class="text-red-500">*</span>
          </label>
          <Textarea
            id="content"
            bind:value={content}
            placeholder="Write your document content here... (markdown supported)"
            rows={8}
            class="w-full font-mono text-sm"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 Supports Markdown: # Headers, **bold**, *italic*, `code`, lists, and more
          </p>
        </div>

        <!-- Project Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project (optional)
          </label>
          <div class="space-y-2">
            <button
              type="button"
              onclick={() => selectedProjectId = null}
              class="w-full text-left px-3 py-2 rounded-lg transition-colors {selectedProjectId === null ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}"
            >
              <div class="flex items-center gap-2">
                <Icon icon="mdi:folder-outline" className="w-4 h-4" />
                <span>No Project</span>
                {#if selectedProjectId === null}
                  <Icon icon="mdi:check" className="w-4 h-4 ml-auto text-blue-600" />
                {/if}
              </div>
            </button>
            
            {#each availableProjects as project}
              <button
                type="button"
                onclick={() => selectedProjectId = project.id}
                class="w-full text-left px-3 py-2 rounded-lg transition-colors {selectedProjectId === project.id ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}"
              >
                <div class="flex items-center gap-2">
                  <Icon icon="mdi:folder" className="w-4 h-4" />
                  <span>{project.name}</span>
                  {#if selectedProjectId === project.id}
                    <Icon icon="mdi:check" className="w-4 h-4 ml-auto text-blue-600" />
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags (optional)
          </label>
          <div class="flex flex-wrap gap-2">
            {#each availableTags as tag}
              <button
                type="button"
                onclick={() => toggleTag(tag)}
                class="px-3 py-2 text-sm rounded-lg transition-colors {selectedTags.includes(tag) ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
              >
                <div class="flex items-center gap-2">
                  <Icon icon="mdi:tag" className="w-3 h-3" />
                  {tag}
                  {#if selectedTags.includes(tag)}
                    <Icon icon="mdi:check" className="w-3 h-3 text-blue-600" />
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            type="button" 
            variant="outline" 
            onclick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            disabled={!content.trim() || isSubmitting}
            class="min-w-24"
          >
            {#if isSubmitting}
              <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            {:else}
              <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
              Create Document
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
