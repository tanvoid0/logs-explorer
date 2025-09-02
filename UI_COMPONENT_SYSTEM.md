# UI Component System

This document describes the new modular and reusable UI component system for the Logs Explorer application.

## Overview

The UI system is designed to be:
- **Modular**: Components are organized by functionality
- **Reusable**: Components can be used across different parts of the application
- **Consistent**: All components follow the same design patterns
- **Configurable**: Easy to customize through Tailwind CSS classes
- **Type-safe**: Full TypeScript support with proper type definitions

## Folder Structure

```
src/lib/components/ui/
├── card/                 # Card components
│   ├── index.svelte     # Main card component
│   ├── header.svelte    # Card header
│   ├── title.svelte     # Card title
│   ├── description.svelte # Card description
│   ├── content.svelte   # Card content
│   ├── footer.svelte    # Card footer
│   └── index.ts         # Export file
├── form/                 # Form components
│   ├── button.svelte    # Button component
│   ├── input.svelte     # Input component
│   ├── select.svelte    # Select component
│   └── index.ts         # Export file
├── feedback/             # Feedback components
│   ├── badge.svelte     # Badge component
│   ├── alert.svelte     # Alert component
│   └── index.ts         # Export file
├── data/                 # Data display components
│   ├── table.svelte     # Data table
│   ├── table-row.svelte # Table row
│   ├── table-cell.svelte # Table cell
│   ├── table-head.svelte # Table head
│   ├── table-body.svelte # Table body
│   ├── table-header.svelte # Table header
│   └── index.ts         # Export file
├── layout/               # Layout components
│   ├── container.svelte # Container component
│   ├── separator.svelte # Separator component
│   └── index.ts         # Export file
└── index.ts             # Main export file
```

## Component Categories

### Card Components
Used for grouping related content in a visually distinct container.

```svelte
<script>
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card/index.js';
</script>

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

### Form Components
Interactive elements for user input and actions.

```svelte
<script>
  import { Button, Input, Select } from '$lib/components/ui/form/index.js';
</script>

<Input type="text" placeholder="Enter text..." />
<Select>
  <option value="option1">Option 1</option>
</Select>
<Button variant="default">Click me</Button>
```

### Feedback Components
Components for displaying status, notifications, and user feedback.

```svelte
<script>
  import { Badge, Alert } from '$lib/components/ui/feedback/index.js';
</script>

<Badge variant="success">Success</Badge>
<Alert variant="warning">Warning message</Alert>
```

### Layout Components
Structural components for organizing content.

```svelte
<script>
  import { Container, Separator } from '$lib/components/ui/layout/index.js';
</script>

<Container maxWidth="xl">
  <div>Content</div>
  <Separator />
  <div>More content</div>
</Container>
```

## Usage Patterns

### Importing Components

```svelte
<!-- Import specific components -->
import { Card, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

<!-- Import from main UI index -->
import { Card, Button, Badge } from '$lib/components/ui/index.js';
```

### Component Composition

Components are designed to be composable. For example, a card can contain any combination of header, content, and footer:

```svelte
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Customization

All components accept a `className` prop for custom styling:

```svelte
<Card className="bg-blue-50 border-blue-200">
  <CardContent className="p-8">
    Custom styled content
  </CardContent>
</Card>
```

## Design Principles

### 1. Consistency
- All components use the same color palette
- Consistent spacing and typography
- Unified interaction patterns

### 2. Accessibility
- Proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility

### 3. Responsive Design
- Mobile-first approach
- Flexible layouts
- Adaptive components

### 4. Dark Mode Support
- All components support dark mode
- Automatic theme switching
- Consistent contrast ratios

## Tailwind CSS Integration

The component system is built on Tailwind CSS, making it easy to:
- Customize the design system
- Add new variants
- Maintain consistency
- Switch themes

### Customization Example

To change the color scheme, simply update the Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    }
  }
}
```

## Best Practices

### 1. Component Organization
- Keep components focused on a single responsibility
- Use descriptive names
- Group related components in folders

### 2. Props Design
- Use TypeScript for type safety
- Provide sensible defaults
- Keep props minimal and focused

### 3. Event Handling
- Use Svelte's event dispatcher
- Provide clear event names
- Include relevant data in events

### 4. Styling
- Use Tailwind classes for styling
- Avoid inline styles
- Leverage the `cn` utility for conditional classes

## Migration Guide

### From Old Components

1. **Replace direct imports**:
   ```svelte
   // Old
   import Button from '$lib/components/ui/button.svelte';
   
   // New
   import { Button } from '$lib/components/ui/form/index.js';
   ```

2. **Update component usage**:
   ```svelte
   // Old
   <Button variant="primary">Click me</Button>
   
   // New
   <Button variant="default">Click me</Button>
   ```

3. **Use new composition patterns**:
   ```svelte
   // Old
   <div class="card">
     <div class="card-header">...</div>
   </div>
   
   // New
   <Card>
     <CardHeader>...</CardHeader>
   </Card>
   ```

## Future Enhancements

1. **Component Library**: Create a comprehensive component library
2. **Storybook Integration**: Add Storybook for component documentation
3. **Theme System**: Implement a more robust theme system
4. **Animation Library**: Add consistent animations
5. **Icon System**: Integrate with an icon library

## Contributing

When adding new components:

1. Follow the existing folder structure
2. Use TypeScript for type definitions
3. Include proper JSDoc comments
4. Add examples to the showcase page
5. Update this documentation

## Examples

See `src/routes/ui-showcase/+page.svelte` for a comprehensive example of all components in action.
