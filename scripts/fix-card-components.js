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

function fixCardComponents(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix <Card class= to <Card className=
  const cardClassRegex = /<Card\s+class=/g;
  if (cardClassRegex.test(content)) {
    content = content.replace(cardClassRegex, '<Card className=');
    modified = true;
    console.log(`Fixed Card class= in ${path.relative(projectRoot, filePath)}`);
  }
  
  // Fix <CardContent class= to <CardContent className=
  const cardContentClassRegex = /<CardContent\s+class=/g;
  if (cardContentClassRegex.test(content)) {
    content = content.replace(cardContentClassRegex, '<CardContent className=');
    modified = true;
    console.log(`Fixed CardContent class= in ${path.relative(projectRoot, filePath)}`);
  }
  
  // Fix <CardHeader class= to <CardHeader className=
  const cardHeaderClassRegex = /<CardHeader\s+class=/g;
  if (cardHeaderClassRegex.test(content)) {
    content = content.replace(cardHeaderClassRegex, '<CardHeader className=');
    modified = true;
    console.log(`Fixed CardHeader class= in ${path.relative(projectRoot, filePath)}`);
  }
  
  // Fix <CardTitle class= to <CardTitle className=
  const cardTitleClassRegex = /<CardTitle\s+class=/g;
  if (cardTitleClassRegex.test(content)) {
    content = content.replace(cardTitleClassRegex, '<CardTitle className=');
    modified = true;
    console.log(`Fixed CardTitle class= in ${path.relative(projectRoot, filePath)}`);
  }
  
  // Fix <CardDescription class= to <CardDescription className=
  const cardDescriptionClassRegex = /<CardDescription\s+class=/g;
  if (cardDescriptionClassRegex.test(content)) {
    content = content.replace(cardDescriptionClassRegex, '<CardDescription className=');
    modified = true;
    console.log(`Fixed CardDescription class= in ${path.relative(projectRoot, filePath)}`);
  }
  
  // Fix <CardFooter class= to <CardFooter className=
  const cardFooterClassRegex = /<CardFooter\s+class=/g;
  if (cardFooterClassRegex.test(content)) {
    content = content.replace(cardFooterClassRegex, '<CardFooter className=');
    modified = true;
    console.log(`Fixed CardFooter class= in ${path.relative(projectRoot, filePath)}`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  return modified;
}

function main() {
  console.log('🔧 Fixing Card component usage...');
  
  const svelteFiles = findSvelteFiles(path.join(projectRoot, 'src'));
  let fixedCount = 0;
  
  for (const file of svelteFiles) {
    if (fixCardComponents(file)) {
      fixedCount++;
    }
  }
  
  console.log(`✅ Fixed Card component usage in ${fixedCount} files`);
}

main();
