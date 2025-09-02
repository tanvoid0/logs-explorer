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

// Function to fix className to class in Button components
function fixClassNameToClass(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix className to class in Button components
    // Look for Button components with className prop
    const buttonRegex = /<Button([^>]*?)className=([^>]*?)>/g;
    if (buttonRegex.test(content)) {
      content = content.replace(buttonRegex, (match, beforeProps, classNameValue) => {
        // Replace className with class
        return `<Button${beforeProps}class=${classNameValue}>`;
      });
      hasChanges = true;
    }
    
    // Also fix any standalone className props that might be in Button components
    if (content.includes('className=') && content.includes('<Button')) {
      content = content.replace(/className=/g, 'class=');
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
  console.log('🔍 Searching for files with className issues in Button components...');
  
  const files = findFiles(srcDir);
  console.log(`📁 Found ${files.length} files to check`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixClassNameToClass(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 className to class fixes completed!`);
  console.log(`📊 Files fixed: ${fixedCount}`);
  console.log(`📊 Total files checked: ${files.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
