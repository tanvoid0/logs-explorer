#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all .svelte files
function findSvelteFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findSvelteFiles(fullPath, files);
    } else if (item.endsWith('.svelte')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix onclick attributes in a file
function fixOnclickAttributes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace onclick={...} with on:click={...}
    const onclickRegex = /onclick\s*=\s*{([^}]+)}/g;
    const onclickReplacement = 'on:click={$1}';
    
    if (onclickRegex.test(content)) {
      content = content.replace(onclickRegex, onclickReplacement);
      modified = true;
      console.log(`Fixed onclick attributes in: ${filePath}`);
    }
    
    // Replace onclick="..." with on:click="..."
    const onclickStringRegex = /onclick\s*=\s*"([^"]+)"/g;
    const onclickStringReplacement = 'on:click="$1"';
    
    if (onclickStringRegex.test(content)) {
      content = content.replace(onclickStringRegex, onclickStringReplacement);
      modified = true;
      console.log(`Fixed onclick string attributes in: ${filePath}`);
    }
    
    // Replace onclick={onclick} with on:click={onclick} (for Button components)
    const onclickPropRegex = /onclick\s*=\s*{onclick}/g;
    const onclickPropReplacement = 'on:click={onclick}';
    
    if (onclickPropRegex.test(content)) {
      content = content.replace(onclickPropRegex, onclickPropReplacement);
      modified = true;
      console.log(`Fixed onclick prop in: ${filePath}`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('Source directory not found:', srcDir);
    process.exit(1);
  }
  
  console.log('Finding Svelte files...');
  const svelteFiles = findSvelteFiles(srcDir);
  console.log(`Found ${svelteFiles.length} Svelte files`);
  
  let fixedCount = 0;
  
  for (const file of svelteFiles) {
    if (fixOnclickAttributes(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\nFixed onclick attributes in ${fixedCount} files`);
  console.log('Migration complete!');
}

main();
