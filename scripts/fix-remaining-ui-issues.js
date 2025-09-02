#!/usr/bin/env node

/**
 * Fix Remaining UI Component Issues
 * 
 * This script fixes the remaining issues in UI components:
 * 1. Template usage of 'class' instead of 'className'
 * 2. Missing className in prop types
 * 3. Incomplete class prop fixes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_COMPONENTS_DIR = path.join(__dirname, '../src/lib/components/ui');

// Patterns to fix
const FIX_PATTERNS = [
  // Fix template usage: {class} -> {className}
  {
    pattern: /(\{)(class)(\})/g,
    replacement: '$1className$3'
  },
  // Fix template usage: class={class} -> class={className}
  {
    pattern: /class=\{class\}/g,
    replacement: 'class={className}'
  },
  // Fix template usage: class={cn(..., class)} -> class={cn(..., className)}
  {
    pattern: /class=\{cn\([^)]*,\s*class\s*\)\}/g,
    replacement: (match) => match.replace(/,\s*class\s*\)/, ', className)')
  },
  // Fix template usage: class={cn(..., class)} -> class={cn(..., className)} (multiline)
  {
    pattern: /class=\{cn\(\s*[^}]*,\s*class\s*\)\}/gs,
    replacement: (match) => match.replace(/,\s*class\s*\)/, ', className)')
  }
];

// Components that need className added to props type
const COMPONENTS_NEEDING_CLASSNAME_TYPE = [
  'command-list.svelte',
  'command-separator.svelte',
  'command-shortcut.svelte',
  'popover-trigger.svelte',
  'progress.svelte',
  'radio-group.svelte',
  'scroll-area-scrollbar.svelte',
  'scroll-area.svelte'
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changes = 0;

    // Apply all fix patterns
    FIX_PATTERNS.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        if (typeof replacement === 'function') {
          content = content.replace(pattern, replacement);
        } else {
          content = content.replace(pattern, replacement);
        }
        changes += matches.length;
      }
    });

    // Fix specific components that need className in props type
    const fileName = path.basename(filePath);
    if (COMPONENTS_NEEDING_CLASSNAME_TYPE.includes(fileName)) {
      // Add className to props type if missing
      if (content.includes('$props<') && !content.includes('className?: string')) {
        content = content.replace(
          /(\$props<\{[^}]*)\}>/g,
          '$1; className?: string; }>'
        );
        changes++;
      }
    }

    // Write back if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${filePath} (${changes} changes)`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  let totalFiles = 0;
  let fixedFiles = 0;

  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.svelte')) {
        totalFiles++;
        if (fixFile(fullPath)) {
          fixedFiles++;
        }
      }
    }
  }

  walkDir(dirPath);
  return { totalFiles, fixedFiles };
}

function main() {
  console.log('🔧 Fixing Remaining UI Component Issues...\n');
  
  if (!fs.existsSync(UI_COMPONENTS_DIR)) {
    console.error(`❌ UI components directory not found: ${UI_COMPONENTS_DIR}`);
    process.exit(1);
  }

  const { totalFiles, fixedFiles } = processDirectory(UI_COMPONENTS_DIR);
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files fixed: ${fixedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - fixedFiles}`);
  
  if (fixedFiles > 0) {
    console.log(`\n✅ Successfully fixed ${fixedFiles} UI component files!`);
  } else {
    console.log(`\n✨ No files needed fixing.`);
  }
}

main();
