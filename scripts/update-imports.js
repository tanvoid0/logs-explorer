#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import mapping from old to new structure
const importMappings = {
  // Navigation components
  'Sidebar': 'navigation',
  'TopNavbar': 'navigation',
  'ConnectionStatus': 'navigation',
  'PageTitle': 'navigation',
  'WorkloadTabs': 'navigation',
  'QuickActions': 'navigation',
  
  // Terminal components
  'CentralizedTerminal': 'terminal',
  'NonBlockingTerminal': 'terminal',
  'SimpleTerminal': 'terminal',
  'Terminal': 'terminal',
  'TerminalManager': 'terminal',
  
  // Pipeline components
  'PipelineEditor': 'pipeline',
  'PipelineExecutor': 'pipeline',
  
  // SDK components
  'SDKManager': 'sdk',
  'SDKManagerCard': 'sdk',
  
  // Task components
  'TaskPage': 'tasks',
  'TaskManager': 'tasks',
  'ProjectTaskManager': 'tasks',
  'TaskGroup': 'tasks',
  'TaskItem': 'tasks',
  'TaskFilters': 'tasks',
  
  // Workload components
  'LogsViewer': 'workloads',
  'LogsViewerContent': 'workloads',
  'LogsDisplay': 'workloads',
  'LogEntry': 'workloads',
  'LogsSearchPanel': 'workloads',
  'AdvancedSearchPanel': 'workloads',
  'AdvancedFilter': 'workloads',
  'TimeFilter': 'workloads',
  'SeveritySelector': 'workloads',
  'PodSelector': 'workloads',
  'ServiceSelector': 'workloads',
  'DeploymentSelector': 'workloads',
  'NamespaceSelector': 'workloads',
  'ProjectDeploymentSelector': 'workloads',
  'FrameworkSelector': 'workloads',
  'ConfigTreeEditor': 'workloads',
  'ConfigDataViewer': 'workloads',
  
  // Toast components
  'Toast': 'toast',
  'ToastContainer': 'toast',
  
  // UI components (already organized)
  'Button': 'ui/form',
  'Input': 'ui/form',
  'Select': 'ui/form',
  'Card': 'ui/card',
  'CardHeader': 'ui/card',
  'CardTitle': 'ui/card',
  'CardDescription': 'ui/card',
  'CardContent': 'ui/card',
  'CardFooter': 'ui/card',
  'Badge': 'ui/feedback',
  'Alert': 'ui/feedback',
  'Container': 'ui/layout',
  'Separator': 'ui/layout',
  'DataTable': 'ui/table-modern',
  'TableRow': 'ui/table-modern',
  'TableCell': 'ui/table-modern',
  'TableHead': 'ui/table-modern',
  'TableBody': 'ui/table-modern',
  'TableHeader': 'ui/table-modern'
};

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Find all import statements
    const importRegex = /import\s+(\{[^}]*\}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importStatement = match[0];
      const imports = match[1];
      const fromPath = match[2];
      
      // Skip if it's already using the new structure
      if (fromPath.includes('$lib/components/') && !fromPath.includes('$lib/components/ui/')) {
        continue;
      }
      
      // Parse the imports
      if (imports.startsWith('{') && imports.endsWith('}')) {
        const componentNames = imports.slice(1, -1).split(',').map(s => s.trim());
        const newImports = {};
        
        componentNames.forEach(name => {
          if (importMappings[name]) {
            newImports[name] = importMappings[name];
          }
        });
        
        // Group by module
        const moduleGroups = {};
        Object.entries(newImports).forEach(([component, module]) => {
          if (!moduleGroups[module]) {
            moduleGroups[module] = [];
          }
          moduleGroups[module].push(component);
        });
        
        // Create new import statements
        const newImportStatements = Object.entries(moduleGroups).map(([module, components]) => {
          return `import { ${components.join(', ')} } from '$lib/components/${module}/index.js';`;
        });
        
        if (newImportStatements.length > 0) {
          content = content.replace(importStatement, newImportStatements.join('\n'));
          updated = true;
        }
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function findSvelteFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (item.endsWith('.svelte')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
const svelteFiles = findSvelteFiles(srcDir);

console.log(`Found ${svelteFiles.length} Svelte files to process...`);

svelteFiles.forEach(file => {
  updateImportsInFile(file);
});

console.log('Import update complete!');
