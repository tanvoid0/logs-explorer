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

// Function to fix class reserved keyword issues
function fixClassReservedKeyword(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix 'class = ""' to 'className = ""' in props
    if (content.includes('class = ""')) {
      content = content.replace(/class = ""/g, 'className = ""');
      hasChanges = true;
    }
    
    // Fix 'class = ""' to 'className = ""' in destructuring
    if (content.includes('class = ""')) {
      content = content.replace(/class = ""/g, 'className = ""');
      hasChanges = true;
    }
    
    // Fix 'class?: string' to 'className?: string' in type definitions
    if (content.includes('class?: string')) {
      content = content.replace(/class\?: string/g, 'className?: string');
      hasChanges = true;
    }
    
    // Fix 'class?: any' to 'className?: any' in type definitions
    if (content.includes('class?: any')) {
      content = content.replace(/class\?: any/g, 'className?: any');
      hasChanges = true;
    }
    
    // Fix 'class: class = ""' to 'class: className = ""' in destructuring
    if (content.includes('class: class = ""')) {
      content = content.replace(/class: class = ""/g, 'class: className = ""');
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
  console.log('🔍 Searching for files with class reserved keyword issues...');
  
  const files = findFiles(srcDir);
  console.log(`📁 Found ${files.length} files to check`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixClassReservedKeyword(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 Class reserved keyword fixes completed!`);
  console.log(`📊 Files fixed: ${fixedCount}`);
  console.log(`📊 Total files checked: ${files.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
