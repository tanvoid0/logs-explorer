#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Event handler mappings from deprecated to new syntax
const eventMappings = {
  'on:click': 'onclick',
  'on:change': 'onchange', 
  'on:input': 'oninput',
  'on:keydown': 'onkeydown',
  'on:keyup': 'onkeyup',
  'on:submit': 'onsubmit',
  'on:focus': 'onfocus',
  'on:blur': 'onblur',
  'on:mouseenter': 'onmouseenter',
  'on:mouseleave': 'onmouseleave',
  'on:scroll': 'onscroll',
  'on:resize': 'onresize'
};

function fixDeprecatedEvents(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let changes = 0;

    // Replace deprecated event handlers
    Object.entries(eventMappings).forEach(([oldEvent, newEvent]) => {
      const regex = new RegExp(oldEvent.replace(':', '\\:'), 'g');
      const matches = content.match(regex);
      if (matches) {
        updatedContent = updatedContent.replace(regex, newEvent);
        changes += matches.length;
      }
    });

    if (changes > 0) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Fixed ${changes} deprecated events in: ${filePath}`);
      return changes;
    } else {
      console.log(`✅ No deprecated events found in: ${filePath}`);
      return 0;
    }

  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return 0;
  }
}

// Find all Svelte components
function findSvelteFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (item.endsWith('.svelte')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

console.log('Fixing deprecated event handlers in Svelte 5...\n');

const svelteFiles = findSvelteFiles('./src');
let totalChanges = 0;
let filesChanged = 0;

svelteFiles.forEach(file => {
  const changes = fixDeprecatedEvents(file);
  if (changes > 0) {
    filesChanged++;
    totalChanges += changes;
  }
});

console.log(`\nMigration complete!`);
console.log(`✅ Fixed ${totalChanges} deprecated event handlers`);
console.log(`✅ Updated ${filesChanged} files`);
console.log(`\nNote: Some components may need manual review for complex event patterns.`);
