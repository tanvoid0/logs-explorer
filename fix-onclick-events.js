#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Function to recursively find all Svelte files
function findSvelteFiles(dir, files = []) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findSvelteFiles(fullPath, files);
    } else if (extname(item) === '.svelte') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix on:click instances in a file
function fixOnClickInFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace on:click with onclick
    let newContent = content.replace(/on:click=/g, 'onclick=');
    
    // Only write if content changed
    if (newContent !== originalContent) {
      writeFileSync(filePath, newContent, 'utf8');
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
console.log('🔍 Finding all Svelte files...');
const svelteFiles = findSvelteFiles('./src');

console.log(`📁 Found ${svelteFiles.length} Svelte files`);

let fixedCount = 0;
for (const file of svelteFiles) {
  if (fixOnClickInFile(file)) {
    fixedCount++;
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files with on:click instances`);
console.log('✨ All on:click instances have been converted to onclick');
