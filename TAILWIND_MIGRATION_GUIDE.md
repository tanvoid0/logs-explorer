# Tailwind CSS Migration Guide

## Overview
This guide helps you migrate custom CSS to Tailwind CSS classes to maintain consistency across your UI kit and improve maintainability.

## Current Status ✅
- Tailwind CSS v4 is properly configured with `@tailwindcss/vite`
- `cn()` utility function is working correctly
- Builds are succeeding without issues
- Most UI components are already using Tailwind CSS

## Migration Principles

### 1. Replace Custom CSS with Tailwind Classes
Instead of:
```css
.prose h1 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 1.875rem;
  line-height: 2.25rem;
}
```

Use:
```html
<h1 class="mt-6 mb-4 font-semibold text-3xl leading-9">Title</h1>
```

### 2. Use the `cn()` Utility for Dynamic Classes
```svelte
<div class={cn(
  "base-classes",
  variantClasses[variant],
  sizeClasses[size],
  className
)}>
```

### 3. Leverage Tailwind's Design System
- Use semantic color names: `bg-slate-100`, `text-slate-900`
- Use consistent spacing scale: `p-4`, `m-2`, `gap-6`
- Use consistent sizing: `h-10`, `w-full`, `max-w-md`

## Common Conversions

### Typography
| Custom CSS | Tailwind Class |
|------------|----------------|
| `font-size: 1.875rem` | `text-3xl` |
| `line-height: 2.25rem` | `leading-9` |
| `font-weight: 600` | `font-semibold` |
| `margin-top: 1.5rem` | `mt-6` |
| `margin-bottom: 1rem` | `mb-4` |

### Spacing
| Custom CSS | Tailwind Class |
|------------|----------------|
| `padding: 1rem` | `p-4` |
| `margin: 1.5rem 0` | `my-6` |
| `padding-left: 1rem` | `pl-4` |
| `gap: 1.5rem` | `gap-6` |

### Colors
| Custom CSS | Tailwind Class |
|------------|----------------|
| `#e5e7eb` | `border-slate-200` |
| `#6b7280` | `text-slate-500` |
| `#f3f4f6` | `bg-slate-100` |
| `#1f2937` | `bg-slate-800` |

### Layout
| Custom CSS | Tailwind Class |
|------------|----------------|
| `width: 100%` | `w-full` |
| `border-radius: 0.375rem` | `rounded-md` |
| `overflow-x: auto` | `overflow-x-auto` |
| `border-collapse: collapse` | `border-collapse` |

## Components to Migrate

### High Priority (Frequently Used)
1. **MarkdownEditor.svelte** - Convert prose styles to Tailwind
2. **PipelineEditor.svelte** - Remove custom button styles
3. **DocumentViewer.svelte** - Convert layout styles

### Medium Priority
1. **ConfigTreeEditor.svelte** - Convert tree styles
2. **ConfigDataViewer.svelte** - Convert data display styles
3. **CentralizedTerminal.svelte** - Convert terminal styles

### Low Priority
1. **Page-level components** - Convert layout styles
2. **Form components** - Ensure consistent styling

## Migration Steps

### Step 1: Identify Custom CSS
```bash
grep -r "<style>" src/ --include="*.svelte"
```

### Step 2: Convert to Tailwind Classes
1. Replace margin/padding with Tailwind spacing classes
2. Replace colors with Tailwind color palette
3. Replace typography with Tailwind text classes
4. Replace layout with Tailwind layout classes

### Step 3: Test and Verify
1. Run `pnpm run build` to ensure no build errors
2. Check visual consistency across components
3. Verify responsive behavior

### Step 4: Remove Custom CSS
Once converted, remove the `<style>` block entirely.

## Example Migration

### Before (Custom CSS)
```svelte
<style>
  .prose h1 {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
    font-size: 1.875rem;
    line-height: 2.25rem;
  }
  
  .prose blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1.5rem 0;
    background-color: #f9fafb;
    border-radius: 0.375rem;
  }
</style>

<h1 class="prose">Title</h1>
<blockquote class="prose">Quote</blockquote>
```

### After (Tailwind Classes)
```svelte
<!-- No style block needed -->
<h1 class="mt-6 mb-4 font-semibold text-3xl leading-9">Title</h1>
<blockquote class="border-l-4 border-slate-200 pl-4 my-6 bg-slate-50 rounded-md">Quote</blockquote>
```

## Benefits of Migration

1. **Consistency**: All components use the same design system
2. **Maintainability**: No need to maintain custom CSS
3. **Performance**: Smaller bundle size, better tree-shaking
4. **Developer Experience**: Familiar classes, better IntelliSense
5. **Responsive Design**: Built-in responsive utilities
6. **Dark Mode**: Consistent dark mode support

## Best Practices

1. **Use semantic class names**: `bg-slate-100` instead of `bg-gray-100`
2. **Group related classes**: `"px-4 py-2 rounded-md"` for buttons
3. **Use the `cn()` utility**: For dynamic class combinations
4. **Leverage variants**: Create consistent component variants
5. **Document patterns**: Create reusable class combinations

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS v4 Guide](https://tailwindcss.com/docs/installation)
- [Svelte + Tailwind Integration](https://tailwindcss.com/docs/guides/svelte)
- [shadcn/ui Components](https://ui.shadcn.com/)
