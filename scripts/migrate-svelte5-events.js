#!/usr/bin/env node

/**
 * Svelte 5 Migration Script: createEventDispatcher → Callback Props
 * 
 * This script helps migrate Svelte components from createEventDispatcher to callback props.
 * It analyzes components and provides migration suggestions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common event patterns to migrate
const EVENT_PATTERNS = {
  'logCountChange': 'onLogCountChange',
  'sortOrderChange': 'onSortOrderChange', 
  'severityChange': 'onSeverityChange',
  'traceIdChange': 'onTraceIdChange',
  'deploymentFilter': 'onDeploymentFilter',
  'nextPage': 'onNextPage',
  'previousPage': 'onPreviousPage',
  'loadMoreNext': 'onLoadMoreNext',
  'loadMorePrevious': 'onLoadMorePrevious',
  'pinStartTime': 'onPinStartTime',
  'pinEndTime': 'onPinEndTime',
  'loadLogs': 'onLoadLogs',
  'search': 'onSearch',
  'deploymentsChange': 'onDeploymentsChange',
  'podsChange': 'onPodsChange',
  'timeChange': 'onTimeChange',
  'modeChange': 'onModeChange',
  'namespaceChange': 'onNamespaceChange',
  'filterByTraceId': 'onFilterByTraceId',
  'filterByDeployment': 'onFilterByDeployment',
  'filterBySeverity': 'onFilterBySeverity',
  'click': 'onClick',
  'change': 'onChange',
  'submit': 'onSubmit',
  'close': 'onClose',
  'open': 'onOpen',
  'select': 'onSelect',
  'deselect': 'onDeselect',
  'toggle': 'onToggle',
  'refresh': 'onRefresh',
  'delete': 'onDelete',
  'edit': 'onEdit',
  'save': 'onSave',
  'cancel': 'onCancel',
  'confirm': 'onConfirm',
  'reject': 'onReject',
  'approve': 'onApprove',
  'start': 'onStart',
  'stop': 'onStop',
  'pause': 'onPause',
  'resume': 'onResume'
};

function findSvelteFiles(dir) {
  const files = [];
  
  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.svelte')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

function analyzeComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const analysis = {
    file: filePath,
    hasCreateEventDispatcher: false,
    events: [],
    dispatchCalls: [],
    eventListeners: [],
    suggestions: []
  };
  
  // Check for createEventDispatcher import
  if (content.includes('createEventDispatcher')) {
    analysis.hasCreateEventDispatcher = true;
    analysis.suggestions.push('Remove createEventDispatcher import');
  }
  
  // Find dispatch calls
  const dispatchRegex = /dispatch\(['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = dispatchRegex.exec(content)) !== null) {
    const eventName = match[1];
    analysis.dispatchCalls.push(eventName);
    
    if (EVENT_PATTERNS[eventName]) {
      analysis.events.push({
        old: eventName,
        new: EVENT_PATTERNS[eventName]
      });
      analysis.suggestions.push(`Replace dispatch('${eventName}') with callback prop ${EVENT_PATTERNS[eventName]}`);
    }
  }
  
  // Find event listeners (on:eventName)
  const eventListenerRegex = /on:([a-zA-Z]+)/g;
  while ((match = eventListenerRegex.exec(content)) !== null) {
    const eventName = match[1];
    analysis.eventListeners.push(eventName);
    
    if (EVENT_PATTERNS[eventName]) {
      analysis.suggestions.push(`Replace on:${eventName} with ${EVENT_PATTERNS[eventName]} prop`);
    }
  }
  
  return analysis;
}

function generateMigrationTemplate(analysis) {
  const template = [];
  
  template.push(`// Migration for ${path.basename(analysis.file)}`);
  template.push('');
  
  if (analysis.hasCreateEventDispatcher) {
    template.push('// 1. Remove createEventDispatcher import');
    template.push('// import { createEventDispatcher } from \'svelte\';');
    template.push('');
  }
  
  if (analysis.events.length > 0) {
    template.push('// 2. Add callback props');
    analysis.events.forEach(event => {
      template.push(`export let ${event.new}: ((data: any) => void) | undefined = undefined;`);
    });
    template.push('');
    
    template.push('// 3. Replace dispatch calls with callback invocations');
    analysis.events.forEach(event => {
      template.push(`// Replace: dispatch('${event.old}', data)`);
      template.push(`// With: if (${event.new}) ${event.new}(data)`);
    });
    template.push('');
  }
  
  if (analysis.eventListeners.length > 0) {
    template.push('// 4. Update parent components to use callback props');
    analysis.eventListeners.forEach(eventName => {
      const callbackName = EVENT_PATTERNS[eventName] || `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`;
      template.push(`// Replace: on:${eventName}={handler}`);
      template.push(`// With: ${callbackName}={handler}`);
    });
  }
  
  return template.join('\n');
}

async function main() {
  console.log('🔍 Analyzing Svelte components for createEventDispatcher usage...\n');
  
  // Find all Svelte components
  const srcDir = path.join(__dirname, '..', 'src');
  const components = findSvelteFiles(srcDir);
  const componentsToMigrate = [];
  
  components.forEach(componentPath => {
    const analysis = analyzeComponent(componentPath);
    if (analysis.hasCreateEventDispatcher || analysis.dispatchCalls.length > 0) {
      componentsToMigrate.push(analysis);
    }
  });
  
  console.log(`Found ${componentsToMigrate.length} components to migrate:\n`);
  
  componentsToMigrate.forEach(analysis => {
    console.log(`📁 ${path.basename(analysis.file)}`);
    console.log(`   Events: ${analysis.events.map(e => `${e.old} → ${e.new}`).join(', ') || 'None'}`);
    console.log(`   Dispatch calls: ${analysis.dispatchCalls.join(', ') || 'None'}`);
    console.log(`   Event listeners: ${analysis.eventListeners.join(', ') || 'None'}`);
    console.log('');
    
    if (analysis.suggestions.length > 0) {
      console.log('   Suggestions:');
      analysis.suggestions.forEach(suggestion => {
        console.log(`   - ${suggestion}`);
      });
      console.log('');
    }
  });
  
  // Generate migration templates
  console.log('📝 Migration templates:\n');
  componentsToMigrate.forEach(analysis => {
    console.log(generateMigrationTemplate(analysis));
    console.log('---\n');
  });
  
  console.log('✅ Analysis complete! Use the suggestions above to migrate your components.');
}

main().catch(console.error);
