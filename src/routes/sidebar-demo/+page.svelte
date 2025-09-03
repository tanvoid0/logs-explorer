<script lang="ts">
  import { Sidebar, Layout } from '$lib/components/ui/layout';
  import { page } from '$app/stores';
  
  // Example navigation items
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', iconify: 'lucide:home' },
    { name: 'Analytics', href: '/analytics', iconify: 'lucide:bar-chart-3', badge: 'New' },
    { name: 'Users', href: '/users', iconify: 'lucide:users' },
    { name: 'Settings', href: '/settings', iconify: 'lucide:settings' },
    { 
      name: 'Projects', 
      href: '/projects', 
      iconify: 'lucide:folder',
      children: [
        { name: 'Active', href: '/projects/active', iconify: 'lucide:play-circle' },
        { name: 'Archived', href: '/projects/archived', iconify: 'lucide:archive' }
      ]
    }
  ];

  // Sidebar state
  let isCollapsed = $state(false);
  let sidebarPosition = $state<'left' | 'right'>('left');
  let sidebarWidth = $state<'sm' | 'md' | 'lg'>('md');

  function handleNavigate(href: string) {
    console.log('Navigating to:', href);
    // In a real app, you would use goto(href) here
  }

  function handleToggleCollapse(collapsed: boolean) {
    isCollapsed = collapsed;
    console.log('Sidebar collapsed:', collapsed);
  }

  function handleItemClick(item: any) {
    console.log('Item clicked:', item);
  }
</script>

<svelte:head>
  <title>Sidebar Demo - Logs Explorer</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-900">
  <!-- Demo Controls -->
  <div class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">Sidebar Component Demo</h1>
      
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex items-center space-x-2">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Position:</label>
          <select 
            bind:value={sidebarPosition}
            class="px-3 py-1 border border-slate-300 rounded-md text-sm"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
        
        <div class="flex items-center space-x-2">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Width:</label>
          <select 
            bind:value={sidebarWidth}
            class="px-3 py-1 border border-slate-300 rounded-md text-sm"
          >
            <option value="sm">Small (64px)</option>
            <option value="md">Medium (256px)</option>
            <option value="lg">Large (320px)</option>
          </select>
        </div>
        
        <button
          onclick={() => isCollapsed = !isCollapsed}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          {isCollapsed ? 'Expand' : 'Collapse'} Sidebar
        </button>
      </div>
    </div>
  </div>

  <!-- Layout with Sidebar -->
  <Layout
    showSidebar={true}
    sidebarProps={{
      variant: 'default',
      position: sidebarPosition,
      width: sidebarWidth,
      collapsible: true,
      collapsed: isCollapsed,
      showHeader: true,
      showFooter: false,
      navigationItems: navigationItems,
      activeRoute: $page.url.pathname,
      onNavigate: handleNavigate,
      onToggleCollapse: handleToggleCollapse
    }}
    sidebarPosition={sidebarPosition}
  >
    <!-- Main Content -->
    <div class="p-8">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-6">
          Welcome to the Sidebar Demo
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Feature Cards -->
          <div class="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <span class="text-2xl">🎨</span>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Responsive Design</h3>
            <p class="text-slate-600 dark:text-slate-400">
              Automatically adapts to mobile, tablet, and desktop screens with smooth transitions.
            </p>
          </div>
          
          <div class="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <span class="text-2xl">⚙️</span>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Customizable</h3>
            <p class="text-slate-600 dark:text-slate-400">
              Flexible positioning, sizing, and content options to fit any layout need.
            </p>
          </div>
          
          <div class="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <span class="text-2xl">🚀</span>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Modern Svelte 5</h3>
            <p class="text-slate-600 dark:text-slate-400">
              Built with the latest Svelte 5 runes and modern Tailwind CSS for optimal performance.
            </p>
          </div>
        </div>
        
        <div class="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-4">Features</h3>
          <ul class="space-y-2 text-slate-600 dark:text-slate-400">
            <li class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Collapsible sidebar with smooth animations</span>
            </li>
            <li class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Mobile-responsive with overlay and toggle button</span>
            </li>
            <li class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Custom header and footer content support</span>
            </li>
            <li class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Nested navigation items with children</span>
            </li>
            <li class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Iconify icon support for consistent iconography</span>
            </li>
            <li class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Badge support for notifications and counts</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Layout>
</div>
