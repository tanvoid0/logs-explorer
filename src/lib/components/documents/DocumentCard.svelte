<script lang="ts">
  import type { DocumentModel } from '$lib/types/documents';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/feedback/index.js';
  import Icon from '@iconify/svelte';

  const { 
    document, 
    isSelected = false, 
    onSelect = () => {}, 
    onOpenInNew = () => {},
    className = ""
  } = $props<{
    document: DocumentModel;
    isSelected?: boolean;
    onSelect?: (doc: DocumentModel) => void;
    onOpenInNew?: (doc: DocumentModel) => void;
    className?: string;
  }>();

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  }

  function getDocumentStatus(doc: DocumentModel) {
    if (doc.is_draft) {
      return { text: 'Draft', variant: 'secondary' as const, icon: 'mdi:pencil' };
    }
    return { text: 'Published', variant: 'success' as const, icon: 'mdi:check-circle' };
  }

  function truncateContent(content: string, maxLength: number = 120) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
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

  function handleCardClick() {
    onSelect(document);
  }

  function handleOpenInNew(e: Event) {
    e.stopPropagation();
    onOpenInNew(document);
  }
</script>

<div 
  class="group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] {isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'} {className}"
  onclick={handleCardClick}
>
  <CardHeader className="pb-3">
    <div class="flex items-start justify-between">
      <div class="flex items-start gap-3 flex-1 min-w-0">
        <div class="flex-shrink-0 mt-1">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
            <Icon icon={getDocumentIcon(document.tags)} className="w-5 h-5" />
          </div>
        </div>
        
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {document.title}
          </h3>
          
          <div class="flex items-center gap-2 mt-2">
            <Badge variant={getDocumentStatus(document).variant} className="text-xs">
              <Icon icon={getDocumentStatus(document).icon} className="w-3 h-3 mr-1" />
              {getDocumentStatus(document).text}
            </Badge>
            
            {#if document.project_id}
              <Badge variant="outline" className="text-xs">
                <Icon icon="mdi:folder" className="w-3 h-3 mr-1" />
                Project
              </Badge>
            {/if}
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onclick={handleOpenInNew}
          class="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
          title="Open in new window"
        >
          <Icon icon="mdi:open-in-new" className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  </CardHeader>
  
  <CardContent className="pt-0">
    <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
      {truncateContent(document.content, 100)}
    </p>
    
    <!-- Tags -->
    {#if document.tags}
      <div class="flex flex-wrap gap-1 mb-3">
        {#each JSON.parse(document.tags as any).slice(0, 3) as tag}
          <span class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            {tag}
          </span>
        {/each}
        {#if JSON.parse(document.tags as any).length > 3}
          <span class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-500 rounded-full">
            +{JSON.parse(document.tags as any).length - 3}
          </span>
        {/if}
      </div>
    {/if}
    
    <!-- Footer -->
    <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      <span class="flex items-center gap-1">
        <Icon icon="mdi:clock-outline" className="w-3 h-3" />
        {formatDate(document.updated_at)}
      </span>
      
      {#if document.content_draft && document.content_draft !== document.content}
        <span class="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <Icon icon="mdi:pencil" className="w-3 h-3" />
          Has draft
        </span>
      {/if}
    </div>
  </CardContent>
</div>
