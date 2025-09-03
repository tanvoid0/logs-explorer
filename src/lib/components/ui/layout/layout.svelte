<script lang="ts">
  import Sidebar from './sidebar.svelte';
  
  const {
    showSidebar = true,
    sidebarProps = {},
    sidebarPosition = 'left',
    className = '',
    children = null
  } = $props<{
    showSidebar?: boolean;
    sidebarProps?: any;
    sidebarPosition?: 'left' | 'right';
    className?: string;
    children?: any;
  }>();

  // Calculate main content margin based on sidebar position and props
  const mainMargin = $derived(() => {
    if (!showSidebar) return '';
    
    const width = sidebarProps.width || 'md';
    const collapsed = sidebarProps.collapsed || false;
    
    const widthClasses = {
      sm: 'ml-16',
      md: 'ml-64',
      lg: 'ml-80',
      xl: 'ml-96',
      full: 'ml-0'
    };
    
    const collapsedWidth = 'ml-16';
    const margin = collapsed ? collapsedWidth : widthClasses[width as keyof typeof widthClasses];
    
    return sidebarPosition === 'left' ? margin : margin.replace('ml-', 'mr-');
  });
</script>

<div class="flex h-screen bg-slate-50 dark:bg-slate-900 {className}">
  {#if showSidebar}
    <Sidebar 
      position={sidebarPosition}
      {...sidebarProps}
    />
  {/if}
  
  <main class="flex-1 overflow-auto {mainMargin} transition-all duration-300 ease-in-out">
    {children}
  </main>
</div>
