#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');

function findSvelteFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'build') {
      findSvelteFiles(fullPath, files);
    } else if (item.endsWith('.svelte')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixTableComponents(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix <Table class= to <Table className=
  const tableClassRegex = /<Table\s+class=/g;
  if (tableClassRegex.test(content)) {
    content = content.replace(tableClassRegex, '<Table className=');
    modified = true;
    console.log(`Fixed Table class= in ${path.relative(projectRoot, filePath)}`);
  }
  
  // Fix <TableRow class= to <TableRow className=
  const tableRowClassRegex = /<TableRow\s+class=/g;
  if (tableRowClassRegex.test(content)) {
    content = content.replace(tableRowClassRegex, '<TableRow className=');
    modified = true;
    console.log(`Fixed TableRow class= in ${path.relative(projectRoot, filePath)}`);
  }
  
  // Fix <TableHead class= to <TableHead className=
  const tableHeadClassRegex = /<TableHead\s+class=/g;
  if (tableHeadClassRegex.test(content)) {
    content = content.replace(tableHeadClassRegex, '<TableHead className=');
    modified = true;
    console.log(`Fixed TableHead class= in ${path.relative(projectRoot, filePath)}`);
  }
  
  // Fix <TableCell class= to <TableCell className=
  const tableCellClassRegex = /<TableCell\s+class=/g;
  if (tableCellClassRegex.test(content)) {
    content = content.replace(tableCellClassRegex, '<TableCell className=');
    modified = true;
    console.log(`Fixed TableCell class= in ${path.relative(projectRoot, filePath)}`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  return modified;
}

function main() {
  console.log('🔧 Fixing Table component usage...');
  
  const svelteFiles = findSvelteFiles(path.join(projectRoot, 'src'));
  let fixedCount = 0;
  
  for (const file of svelteFiles) {
    if (fixTableComponents(file)) {
      fixedCount++;
    }
  }
  
  console.log(`✅ Fixed Table component usage in ${fixedCount} files`);
}

main();
