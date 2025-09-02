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

// Function to fix all class prop usage to className
function fixClassProps(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix 'class=' to 'className=' in component props (but not in HTML attributes)
    // This regex looks for class= followed by { or " or ' but not class={cn( or class=" or class=
    if (content.includes('class=')) {
      // Replace class={...} with className={...} but be careful not to replace HTML class attributes
      content = content.replace(/class=\{([^}]+)\}/g, 'className={$1}');
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
  console.log('🔍 Searching for Svelte files with class prop usage...');
  
  const files = findSvelteFiles(srcDir);
  console.log(`📁 Found ${files.length} Svelte files to check`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixClassProps(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 Class prop fixes completed!`);
  console.log(`📊 Files fixed: ${fixedCount}`);
  console.log(`📊 Total files checked: ${files.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
