#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Function to recursively find all Svelte files
function findSvelteFiles(dir) {
  const files = [];
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findSvelteFiles(fullPath));
    } else if (stat.isFile() && item.endsWith('.svelte')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix HTML class attributes
function fixHtmlClassAttributes(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix 'className=' to 'class=' in HTML attributes (but not in props)
    // This regex looks for className= followed by { or " or ' in HTML tags
    if (content.includes('className=')) {
      // Replace className={...} with class={...} in HTML attributes
      content = content.replace(/className=\{([^}]+)\}/g, 'class={$1}');
      hasChanges = true;
    }
    
    if (hasChanges) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  const srcDir = join(process.cwd(), 'src');
  console.log('🔍 Searching for Svelte files with HTML className attributes...');
  
  const files = findSvelteFiles(srcDir);
  console.log(`📁 Found ${files.length} Svelte files to check`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixHtmlClassAttributes(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 HTML class attribute fixes completed!`);
  console.log(`📊 Files fixed: ${fixedCount}`);
  console.log(`📊 Total files checked: ${files.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
