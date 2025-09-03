<script lang="ts">
  import { cn } from '$lib/utils';
  import { Button, IconButton, Heading, Text, Container } from '$lib/components/ui';
  import Icon from '@iconify/svelte';
  
  const {
    variant = 'default',
    position = 'left',
    width = 'md',
    collapsible = false,
    collapsed = false,
    showHeader = true,
    showFooter = false,
    className = '',
    headerContent = null,
    footerContent = null,
    navigationItems = [],
    activeRoute = '',
    onNavigate = undefined,
    onToggleCollapse = undefined
  } = $props<{
    variant?: 'default' | 'minimal' | 'compact';
    position?: 'left' | 'right';
    width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    collapsible?: boolean;
    collapsed?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;
    className?: string;
    headerContent?: any;
    footerContent?: any;
    navigationItems?: Array<{
      name: string;
      href?: string;
      icon?: string;
      iconify?: string;
      badge?: string | number;
      disabled?: boolean;
      onClick?: () => void;
      children?: Array<{
        name: string;
        href?: string;
        icon?: string;
        iconify?: string;
        badge?: string | number;
        disabled?: boolean;
        onClick?: () => void;
      }>;
    }>;
    activeRoute?: string;
    onNavigate?: (href: string) => void;
    onToggleCollapse?: (collapsed: boolean) => void;
  }>();

  // No more createEventDispatcher - using callback props instead

  // Responsive state
  let isMobile = $state(false);
  let isTablet = $state(false);
  let isDesktop = $state(false);

  // Collapse state
  let isCollapsed = $state(collapsed);

  // Mobile sidebar state
  let isMobileOpen = $state(false);

  // Check screen size on mount and resize
  function checkScreenSize() {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      isMobile = width < 768;
      isTablet = width >= 768 && width < 1024;
      isDesktop = width >= 1024;
    }
  }

  // Handle navigation
  function handleNavigate(href: string) {
    if (onNavigate) {
      onNavigate(href);
    }
  }

  // Handle item click
  function handleItemClick(item: any) {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      handleNavigate(item.href);
    }
  }

  // Handle collapse toggle
  function handleToggleCollapse() {
    isCollapsed = !isCollapsed;
    if (onToggleCollapse) {
      onToggleCollapse(isCollapsed);
    }
  }

  // Handle mobile toggle
  function handleMobileToggle() {
    isMobileOpen = !isMobileOpen;
  }

  // Close mobile sidebar when clicking outside
  function handleOutsideClick(event: MouseEvent) {
    if (isMobile && isMobileOpen && event.target) {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-sidebar]')) {
        isMobileOpen = false;
      }
    }
  }

  // Check if route is active
  function isActive(route: string): boolean {
    if (!activeRoute || !route) return false;
    if (route === '/') return activeRoute === '/';
    return activeRoute.startsWith(route);
  }

  // Width classes based on variant and size
  const widthClasses = {
    sm: 'w-16',
    md: 'w-64',
    lg: 'w-80',
    xl: 'w-96',
    full: 'w-full'
  } as const;

  // Collapsed width
  const collapsedWidth = 'w-16';

  // Position classes
  const positionClasses = {
    left: 'left-0',
    right: 'right-0'
  } as const;

  // Sidebar width
  const sidebarWidth = $derived(isCollapsed ? collapsedWidth : widthClasses[width as keyof typeof widthClasses]);

  // Check screen size on mount
  $effect(() => {
    checkScreenSize();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkScreenSize);
      window.addEventListener('click', handleOutsideClick);
      
      return () => {
        window.removeEventListener('resize', checkScreenSize);
        window.removeEventListener('click', handleOutsideClick);
      };
    }
  });

  // Update collapsed state when prop changes
  $effect(() => {
    isCollapsed = collapsed;
  });
</script>

<!-- Mobile overlay -->
{#if isMobile && isMobileOpen}
  <div 
    class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    onclick={() => isMobileOpen = false}
  />
{/if}

<!-- Sidebar -->
<aside
  data-sidebar
  class={cn(
    'fixed top-0 h-full bg-slate-800 text-white transition-all duration-300 ease-in-out z-50',
    positionClasses[position as keyof typeof positionClasses],
    sidebarWidth,
    isMobile && !isMobileOpen && '-translate-x-full',
    isMobile && isMobileOpen && 'translate-x-0',
    !isMobile && 'translate-x-0',
    className
  )}
>
  <!-- Header -->
  {#if showHeader}
    <Container variant="header" className="p-4 border-b border-slate-700">
      {#if headerContent}
        {headerContent}
      {:else}
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">LE</span>
          </div>
          {#if !isCollapsed}
            <div>
              <Heading level="h1" variant="emphasized" className="text-lg">Logs Explorer</Heading>
              <Text variant="muted" className="text-xs">The Kubernetes IDE</Text>
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Collapse toggle button -->
      {#if collapsible && !isMobile}
        <IconButton
          variant="ghost"
          size="sm"
          onclick={handleToggleCollapse}
          className="absolute top-4 right-4 w-8 h-8 bg-slate-700 hover:bg-slate-600"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon 
            icon={isCollapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'} 
            class="w-4 h-4" 
          />
        </IconButton>
      {/if}
      
      <!-- Mobile close button -->
      {#if isMobile}
        <IconButton
          variant="ghost"
          size="sm"
          onclick={handleMobileToggle}
          className="absolute top-4 right-4 w-8 h-8 bg-slate-700 hover:bg-slate-600"
          title="Close sidebar"
        >
          <Icon icon="lucide:x" class="w-4 h-4" />
        </IconButton>
      {/if}
    </Container>
  {/if}

  <!-- Navigation -->
  <div class="flex-1 overflow-y-auto py-4">
    <div class="px-4">
      {#if !isCollapsed}
        <Heading level="h2" variant="muted" className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Navigation
        </Heading>
      {/if}
      
      <ul class="space-y-1">
        {#each navigationItems as item}
          <li>
            <Button
              variant="ghost"
              onclick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                isCollapsed ? 'justify-center' : 'justify-start',
                isActive(item.href || '') 
                  ? 'bg-slate-700 text-white' 
                  : 'text-slate-300 hover:bg-slate-700',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div class={cn(
                'flex items-center',
                isCollapsed ? 'justify-center' : 'space-x-3'
              )}>
                <!-- Icon -->
                {#if item.iconify}
                  <Icon icon={item.iconify} class="w-5 h-5" />
                {:else if item.icon}
                  <span class="text-lg">{item.icon}</span>
                {/if}
                
                <!-- Text and badge (hidden when collapsed) -->
                {#if !isCollapsed}
                  <span class="font-medium">{item.name}</span>
                  {#if item.badge}
                    <span class="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  {/if}
                {/if}
              </div>
            </Button>
            
            <!-- Sub-items (only shown when not collapsed) -->
            {#if item.children && !isCollapsed}
              <ul class="ml-6 mt-1 space-y-1">
                {#each item.children as child}
                  <li>
                    <Button
                      variant="ghost"
                      onclick={() => handleItemClick(child)}
                      disabled={child.disabled}
                      className={cn(
                        'w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                        isActive(child.href || '') 
                          ? 'bg-slate-600 text-white' 
                          : 'text-slate-400 hover:bg-slate-700',
                        child.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div class="flex items-center space-x-3">
                        {#if child.iconify}
                          <Icon icon={child.iconify} class="w-4 h-4" />
                        {:else if child.icon}
                          <span class="text-sm">{child.icon}</span>
                        {/if}
                        <span class="font-medium">{child.name}</span>
                        {#if child.badge}
                          <span class="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            {child.badge}
                          </span>
                        {/if}
                      </div>
                    </Button>
                  </li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <!-- Footer -->
  {#if showFooter && footerContent}
    <Container variant="header" className="p-4 border-t border-slate-700">
      {footerContent}
    </Container>
  {/if}
</aside>

<!-- Mobile toggle button (when sidebar is closed) -->
{#if isMobile && !isMobileOpen}
  <button
    onclick={handleMobileToggle}
    class="fixed top-4 left-4 z-30 p-2 bg-slate-800 text-white rounded-md shadow-lg lg:hidden"
    title="Open sidebar"
  >
    <Icon icon="lucide:menu" class="w-5 h-5" />
  </button>
{/if}
