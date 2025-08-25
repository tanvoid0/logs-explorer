# Interactive Configurations & Secrets Management

This document describes the new interactive ConfigMaps and Secrets management features in the Kubernetes Logs Explorer application.

## Features

### 1. Global Namespace Selection
- Users can select a namespace from a dropdown to filter configurations
- The selected namespace is stored globally and persists across sessions
- "All Namespaces" option allows viewing configurations across all namespaces

### 2. Interactive Tree Editor
- **ConfigTreeEditor Component**: Provides a tree-based interface for editing configuration data
- **Key-Value Pairs**: Add, edit, and remove key-value pairs in a structured format
- **JSON Formatting**: Automatically detects and formats JSON values for better readability
- **Real-time Validation**: Validates input and provides immediate feedback

### 3. Formatted Data Viewer
- **ConfigDataViewer Component**: Displays configuration data in multiple formats
- **View Modes**:
  - **Tree View**: Hierarchical display of key-value pairs
  - **JSON View**: Formatted JSON representation
  - **YAML View**: YAML format for easy reading
- **Smart Formatting**: Automatically detects and formats JSON values

### 4. Real-time Editing
- **Inline Editing**: Edit configuration values directly in the interface
- **Save/Cancel**: Save changes to Kubernetes or cancel to revert
- **Live Updates**: Changes are immediately reflected in the UI
- **Error Handling**: Comprehensive error handling with user-friendly notifications

## Components

### ConfigTreeEditor.svelte
A reusable component for editing configuration data as a tree structure.

**Features:**
- Add new key-value pairs
- Edit existing values
- Remove keys
- JSON value detection and formatting
- Save/Cancel functionality

**Props:**
- `data`: Record<string, string> - The configuration data to edit
- `readOnly`: boolean - Whether the editor is read-only
- `title`: string - The title for the editor

**Events:**
- `change`: Fired when data changes
- `save`: Fired when save is clicked
- `cancel`: Fired when cancel is clicked

### ConfigDataViewer.svelte
A component for displaying configuration data in multiple formats.

**Features:**
- Multiple view modes (Tree, JSON, YAML)
- Automatic JSON detection and formatting
- Responsive design
- Empty state handling

**Props:**
- `data`: Record<string, string> - The configuration data to display
- `title`: string - The title for the viewer

## Backend Integration

### Kubernetes Service
The `KubernetesService` class has been extended with new methods:

- `getConfigMaps(namespace?)`: Retrieve ConfigMaps from Kubernetes
- `getSecrets(namespace?)`: Retrieve Secrets from Kubernetes
- `updateConfigMap(namespace, name, data)`: Update a ConfigMap
- `updateSecret(namespace, name, data)`: Update a Secret

### Rust Backend
New Tauri commands have been added to the Rust backend:

- `k8s_get_configmaps`: Get ConfigMaps from Kubernetes
- `k8s_get_secrets`: Get Secrets from Kubernetes
- `k8s_update_configmap`: Update a ConfigMap
- `k8s_update_secret`: Update a Secret

## Usage

### Viewing Configurations
1. Navigate to the "Configurations & Secrets" page
2. Select a namespace from the dropdown (optional)
3. Choose a configuration from the list
4. View the data in Tree, JSON, or YAML format

### Editing Configurations
1. Select a configuration from the list
2. Click the "Edit" button
3. Use the tree editor to modify key-value pairs
4. Click "Save" to apply changes or "Cancel" to revert

### Adding New Keys
1. In edit mode, click "Add Key"
2. Enter the key name and value
3. Click "Add" to add the new key-value pair

### Removing Keys
1. In edit mode, click the "Remove" button next to any key
2. The key will be removed from the configuration

## Technical Details

### Type Safety
- Full TypeScript support with proper type definitions
- Svelte 5 runes for reactive state management
- Proper error handling and type checking

### State Management
- Uses Svelte's built-in state management
- Reactive updates with `$derived` and `$effect`
- Persistent namespace selection

### Error Handling
- Comprehensive error handling for API calls
- User-friendly error messages
- Fallback to mock data for testing

### Security
- Secrets are properly base64 encoded/decoded
- Temporary files are cleaned up after operations
- Input validation and sanitization

## Future Enhancements

1. **Bulk Operations**: Edit multiple configurations at once
2. **Version History**: Track changes to configurations
3. **Templates**: Pre-defined configuration templates
4. **Validation**: Schema validation for configuration data
5. **Diff View**: Compare different versions of configurations
6. **Export/Import**: Export configurations to files
7. **Search**: Advanced search within configuration values
8. **Audit Log**: Track who made changes and when

## Testing

The application includes fallback mock data for testing when the Kubernetes backend is not available. This allows developers to test the UI functionality without requiring a Kubernetes cluster.
