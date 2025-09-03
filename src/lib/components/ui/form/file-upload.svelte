<script lang="ts">
  import { cn } from "$lib/utils";
  import Button from "../button.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{
    fileSelect: { files: FileList };
    fileDrop: { files: FileList };
    fileRemove: { index: number };
  }>();

  const { 
    multiple = false,
    accept = "",
    maxSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 5,
    disabled = false,
    className = "",
    placeholder = "Drop files here or click to browse"
  } = $props<{
    multiple?: boolean;
    accept?: string;
    maxSize?: number;
    maxFiles?: number;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
  }>();

  let dragActive = $state(false);
  let selectedFiles = $state<File[]>([]);
  let fileInput: HTMLInputElement;

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const files = Array.from(target.files);
      const validFiles = files.filter(file => {
        if (file.size > maxSize) {
          console.warn(`File ${file.name} is too large (${file.size} bytes)`);
          return false;
        }
        return true;
      });
      
      if (multiple) {
        selectedFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles);
      } else {
        selectedFiles = validFiles.slice(0, 1);
      }
      
      dispatch('fileSelect', { files: target.files });
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
    
    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files);
      const validFiles = files.filter(file => {
        if (file.size > maxSize) {
          console.warn(`File ${file.name} is too large (${file.size} bytes)`);
          return false;
        }
        return true;
      });
      
      if (multiple) {
        selectedFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles);
      } else {
        selectedFiles = validFiles.slice(0, 1);
      }
      
      dispatch('fileDrop', { files: event.dataTransfer.files });
    }
  }

  function removeFile(index: number) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
    dispatch('fileRemove', { index });
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function openFileDialog() {
    fileInput?.click();
  }
</script>

<div class={cn("space-y-4", className)}>
  <!-- File Input (Hidden) -->
  <input
    bind:this={fileInput}
    type="file"
    {multiple}
    {accept}
    class="hidden"
    onchange={handleFileSelect}
    {disabled}
  />
  
  <!-- Drop Zone -->
  <div
    class={cn(
      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
      dragActive 
        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
        : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500",
      disabled && "opacity-50 cursor-not-allowed"
    )}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    <div class="space-y-4">
      <div class="text-4xl">📁</div>
      <div>
        <p class="text-lg font-medium text-slate-900 dark:text-white">
          {placeholder}
        </p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {multiple ? `Up to ${maxFiles} files` : 'Single file'} • Max size: {formatFileSize(maxSize)}
        </p>
      </div>
      <Button
        variant="outline"
        onclick={openFileDialog}
        disabled={disabled}
      >
        Browse Files
      </Button>
    </div>
  </div>
  
  <!-- Selected Files -->
  {#if selectedFiles.length > 0}
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-slate-900 dark:text-white">
        Selected Files ({selectedFiles.length})
      </h4>
      {#each selectedFiles as file, index}
        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">📄</span>
            <div>
              <p class="text-sm font-medium text-slate-900 dark:text-white">
                {file.name}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onclick={() => removeFile(index)}
            disabled={disabled}
          >
            ✕
          </Button>
        </div>
      {/each}
    </div>
  {/if}
</div>
