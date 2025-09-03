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

// Function to update imports in a file
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Update the old import pattern
    const oldPattern = /import\s+\{\s*cn\s*\}\s+from\s+["']\$lib\/utils["'];?/g;
    const newImport = "import { cn } from \"$lib/utils/index\";";
    
    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, newImport);
      updated = true;
      console.log(`✅ Updated: ${filePath}`);
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    
    return updated;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  console.log('🔍 Searching for .svelte files...');
  
  const svelteFiles = findSvelteFiles(srcDir);
  console.log(`📁 Found ${svelteFiles.length} .svelte files`);
  
  let updatedCount = 0;
  
  for (const file of svelteFiles) {
    if (updateImports(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 Updated ${updatedCount} files`);
  console.log(`📊 Skipped ${svelteFiles.length - updatedCount} files (no changes needed)`);
}

// Run the script
main();
