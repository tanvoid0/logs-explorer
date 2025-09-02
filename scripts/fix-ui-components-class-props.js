#!/usr/bin/env node

/**
 * Fix UI Components Class Props
 * 
 * This script fixes the widespread issue where UI components are using
 * `class: class` syntax instead of `className: className` in Svelte 5.
 * 
 * The pattern to fix:
 * - Change `class: class,` to `className: className,`
 * - Change `class: class` to `className: className`
 * - Update prop destructuring to use `className` instead of `class`
 * - Update template usage to use `className` instead of `class`
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_COMPONENTS_DIR = path.join(__dirname, '../src/lib/components/ui');

// Patterns to fix
const FIX_PATTERNS = [
  // Fix prop destructuring: class: class -> className: className
  {
    pattern: /(\s+)(class: class)(,?)/g,
    replacement: '$1className: className$3'
  },
  // Fix prop destructuring: class: class -> className: className (no comma)
  {
    pattern: /(\s+)(class: class)(\s*\))/g,
    replacement: '$1className: className$3'
  },
  // Fix let destructuring: class: class -> className: className
  {
    pattern: /(\s+)(class: class)(,?)/g,
    replacement: '$1className: className$3'
  },
  // Fix template usage: {class} -> {className}
  {
    pattern: /(\{)(class)(\})/g,
    replacement: '$1className$3'
  },
  // Fix template usage: class={className} -> class={className} (already correct)
  {
    pattern: /class=\{className\}/g,
    replacement: 'class={className}'
  }
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
        content = content.replace(pattern, replacement);
        changes += matches.length;
      }
    });

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
  console.log('🔧 Fixing UI Components Class Props...\n');
  
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
