<script lang="ts">
  import type { DocumentModel } from '$lib/types/documents';
  import { Badge } from '$lib/components/ui/feedback/index.js';
  import Icon from '@iconify/svelte';

  const { 
    openTabs = [], 
    activeTabIndex = 0, 
    onTabSelect = () => {}, 
    onTabClose = () => {},
    className = ""
  } = $props<{
    openTabs: DocumentModel[];
    activeTabIndex: number;
    onTabSelect: (index: number) => void;
    onTabClose: (index: number) => void;
    className?: string;
  }>();

  function handleTabClick(index: number) {
    onTabSelect(index);
  }

  function handleTabClose(e: Event, index: number) {
    e.stopPropagation();
    onTabClose(index);
  }

  function getDocumentIcon(tags: any) {
    if (!tags) return 'mdi:file-document-outline';
    
    try {
      const tagArray = JSON.parse(tags);
      if (tagArray.includes('api')) return 'mdi:api';
      if (tagArray.includes('guide')) return 'mdi:book-open-variant';
      if (tagArray.includes('tutorial')) return 'mdi:school';
      if (tagArray.includes('reference')) return 'mdi:library';
      if (tagArray.includes('planning')) return 'mdi:clipboard-text';
      if (tagArray.includes('design')) return 'mdi:palette';
    } catch (e) {
      // Fallback to default icon
    }
    return 'mdi:file-document-outline';
  }

  function hasUnsavedChanges(doc: DocumentModel) {
    return doc.content_draft && doc.content_draft !== doc.content;
  }
</script>

{#if openTabs.length > 0}
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm {className}">
    <div class="flex items-center overflow-x-auto px-2">
      {#each openTabs as tab, index}
        <div
          onclick={() => handleTabClick(index)}
          class="group flex items-center px-4 py-3 border-r border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 {activeTabIndex === index ? 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-500 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}"
        >
          <!-- Document Icon -->
          <div class="flex items-center gap-2 mr-2">
            <div class="w-4 h-4 text-gray-500 dark:text-gray-400">
              <Icon icon={getDocumentIcon(tab.tags)} className="w-4 h-4" />
            </div>
            
            <!-- Unsaved Changes Indicator -->
            {#if hasUnsavedChanges(tab)}
              <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Unsaved changes"></div>
            {/if}
          </div>
          
          <!-- Tab Title -->
          <span class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {tab.title}
          </span>
          
          <!-- Close Button -->
          {#if openTabs.length > 1}
            <button
              onclick={(e) => handleTabClose(e, index)}
              class="ml-3 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              title="Close tab"
            >
              <Icon icon="mdi:close" className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          {/if}
        </div>
      {/each}
      
      <!-- Add New Tab Button -->
      <button
        class="flex items-center px-3 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-l border-gray-200 dark:border-gray-700"
        title="Create new document"
      >
        <Icon icon="mdi:plus" className="w-4 h-4" />
      </button>
    </div>
  </div>
{/if}
