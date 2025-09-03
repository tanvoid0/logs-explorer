# Reusable Sidebar & Layout Components

This directory contains modern, reusable sidebar and layout components built with Svelte 5 runes and Tailwind CSS.

## Components

### Sidebar.svelte

A fully-featured, responsive sidebar component with the following capabilities:

- **Responsive Design**: Automatically adapts to mobile, tablet, and desktop screens
- **Flexible Positioning**: Left or right side positioning
- **Customizable Width**: Small (64px), Medium (256px), Large (320px), Extra Large (384px), or Full width
- **Collapsible**: Optional collapse/expand functionality
- **Custom Content**: Customizable header and footer content
- **Navigation Items**: Support for nested navigation with icons, badges, and children
- **Mobile Support**: Mobile overlay with toggle button
- **Modern Svelte 5**: Built with runes and callback props (no createEventDispatcher)

### Layout.svelte

A layout wrapper component that automatically handles sidebar positioning and main content margins.

## Usage

### Basic Sidebar

```svelte
<script lang="ts">
  import { Sidebar } from '$lib/components/ui/layout';
  
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', iconify: 'lucide:home' },
    { name: 'Users', href: '/users', iconify: 'lucide:users' },
    { name: 'Settings', href: '/settings', iconify: 'lucide:settings' }
  ];
  
  function handleNavigate(href: string) {
    // Handle navigation
    goto(href);
  }
</script>

<Sidebar
  navigationItems={navigationItems}
  activeRoute={$page.url.pathname}
  onNavigate={handleNavigate}
/>
```

### Sidebar with Custom Header/Footer

```svelte
<script lang="ts">
  import { Sidebar } from '$lib/components/ui/layout';
  
  // Custom header content
  const headerContent = `
    <div class="flex items-center space-x-2">
      <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span class="text-white font-bold text-sm">LE</span>
      </div>
      <div>
        <h1 class="text-lg font-semibold">My App</h1>
        <p class="text-xs text-slate-400">Application Description</p>
      </div>
    </div>
  `;
  
  // Custom footer content
  const footerContent = `
    <div class="p-4">
      <p class="text-sm text-slate-400">Footer content here</p>
    </div>
  `;
</script>

<Sidebar
  showHeader={true}
  showFooter={true}
  headerContent={headerContent}
  footerContent={footerContent}
  navigationItems={navigationItems}
  activeRoute={$page.url.pathname}
  onNavigate={handleNavigate}
/>
```

### Using Layout Component

```svelte
<script lang="ts">
  import { Layout } from '$lib/components/ui/layout';
  
  let isCollapsed = $state(false);
  
  function handleToggleCollapse(collapsed: boolean) {
    isCollapsed = collapsed;
  }
</script>

<Layout
  showSidebar={true}
  sidebarProps={{
    variant: 'default',
    position: 'left',
    width: 'md',
    collapsible: true,
    collapsed: isCollapsed,
    navigationItems: navigationItems,
    activeRoute: $page.url.pathname,
    onNavigate: handleNavigate,
    onToggleCollapse: handleToggleCollapse
  }}
  sidebarPosition="left"
>
  <!-- Main content here -->
  <div class="p-8">
    <h1>Main Content</h1>
    <p>This content will automatically adjust its margin based on the sidebar.</p>
  </div>
</Layout>
```

## Props

### Sidebar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'minimal' \| 'compact'` | `'default'` | Sidebar variant style |
| `position` | `'left' \| 'right'` | `'left'` | Sidebar position |
| `width` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Sidebar width |
| `collapsible` | `boolean` | `false` | Whether sidebar can be collapsed |
| `collapsed` | `boolean` | `false` | Initial collapsed state |
| `showHeader` | `boolean` | `true` | Show sidebar header |
| `showFooter` | `boolean` | `false` | Show sidebar footer |
| `className` | `string` | `''` | Additional CSS classes |
| `headerContent` | `any` | `null` | Custom header content |
| `footerContent` | `any` | `null` | Custom footer content |
| `navigationItems` | `Array<NavigationItem>` | `[]` | Navigation items |
| `activeRoute` | `string` | `''` | Currently active route |
| `onNavigate` | `(href: string) => void` | `undefined` | Navigation callback |
| `onToggleCollapse` | `(collapsed: boolean) => void` | `undefined` | Collapse toggle callback |

### Navigation Item Structure

```typescript
interface NavigationItem {
  name: string;
  href?: string;
  icon?: string;           // Emoji or text icon
  iconify?: string;        // Iconify icon name
  badge?: string | number; // Optional badge
  disabled?: boolean;      // Whether item is disabled
  onClick?: () => void;    // Custom click handler
  children?: NavigationItem[]; // Nested items
}
```

### Layout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showSidebar` | `boolean` | `true` | Whether to show sidebar |
| `sidebarProps` | `object` | `{}` | Props to pass to Sidebar component |
| `sidebarPosition` | `'left' \| 'right'` | `'left'` | Sidebar position |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `any` | `null` | Main content |

## Features

### Responsive Behavior

- **Desktop**: Full sidebar with optional collapse
- **Tablet**: Adaptive sidebar with touch-friendly controls
- **Mobile**: Overlay sidebar with hamburger menu toggle

### Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Focus management

### Performance

- Built with Svelte 5 runes for optimal reactivity
- Efficient event handling with callback props
- Minimal re-renders
- Smooth animations with CSS transitions

## Migration from Old Sidebar

The new sidebar component follows the migration pattern from `createEventDispatcher` to callback props:

```svelte
// Old way (deprecated)
<OldSidebar on:navigate={handleNavigate} on:toggleCollapse={handleToggle} />

// New way (recommended)
<Sidebar onNavigate={handleNavigate} onToggleCollapse={handleToggle} />
```

## Examples

See `src/routes/sidebar-demo/+page.svelte` for a complete working example with all features.

## Styling

The sidebar uses Tailwind CSS classes and follows the design system established in the project. Custom styling can be applied through the `className` prop or by modifying the component's base classes.

## Browser Support

- Modern browsers with ES2020+ support
- Svelte 5+ required
- Tailwind CSS v4+ required
