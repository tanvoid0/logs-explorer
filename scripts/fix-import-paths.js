#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Function to recursively find all files in a directory
function findFiles(dir, extensions = ['.svelte', '.ts', '.js']) {
  const files = [];
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.includes(extname(item))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix import paths in a file
function fixImportPaths(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix $lib/utils.js -> $lib/utils.ts
    if (content.includes('$lib/utils.js')) {
      content = content.replace(/\$lib\/utils\.js/g, '$lib/utils.ts');
      hasChanges = true;
    }
    
    // Fix ./index.js -> ./index.ts
    if (content.includes('./index.js')) {
      content = content.replace(/\.\/index\.js/g, './index.ts');
      hasChanges = true;
    }
    
    // Fix ../index.js -> ../index.ts
    if (content.includes('../index.js')) {
      content = content.replace(/\.\.\/index\.js/g, '../index.ts');
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
  console.log('🔍 Searching for files with import path issues...');
  
  const files = findFiles(srcDir);
  console.log(`📁 Found ${files.length} files to check`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixImportPaths(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 Import path fixes completed!`);
  console.log(`📊 Files fixed: ${fixedCount}`);
  console.log(`📊 Total files checked: ${files.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
