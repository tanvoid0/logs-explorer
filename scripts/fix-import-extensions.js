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

// Function to fix import extensions in a file
function fixImportExtensions(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix $lib/utils.ts -> $lib/utils
    if (content.includes('$lib/utils.ts')) {
      content = content.replace(/\$lib\/utils\.ts/g, '$lib/utils');
      hasChanges = true;
    }
    
    // Fix ./index.ts -> ./index
    if (content.includes('./index.ts')) {
      content = content.replace(/\.\/index\.ts/g, './index');
      hasChanges = true;
    }
    
    // Fix ../index.ts -> ../index
    if (content.includes('../index.ts')) {
      content = content.replace(/\.\.\/index\.ts/g, '../index');
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
  console.log('🔍 Searching for files with import extension issues...');
  
  const files = findFiles(srcDir);
  console.log(`📁 Found ${files.length} files to check`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixImportExtensions(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 Import extension fixes completed!`);
  console.log(`📊 Files fixed: ${fixedCount}`);
  console.log(`📊 Total files checked: ${files.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
