#!/usr/bin/env node

/**
 * Migration script to replace raw HTML elements with UI kit components
 * This script helps identify and replace raw button, input, and card elements
 * with the proper shadcn-style UI components.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');

// Patterns to search for raw HTML elements
const patterns = {
  rawButtons: /<button[^>]*class="[^"]*(?:bg-blue-|bg-red-|bg-green-|bg-slate-|bg-gray-|px-\d+|py-\d+|rounded|hover:)[^"]*"[^>]*>/g,
  rawInputs: /<input[^>]*class="[^"]*(?:border|rounded|px-\d+|py-\d+|bg-white|bg-slate-)[^"]*"[^>]*>/g,
  rawCards: /<div[^>]*class="[^"]*(?:bg-white|bg-slate-|border|rounded-lg)[^"]*"[^>]*>/g,
  rawTextareas: /<textarea[^>]*class="[^"]*(?:border|rounded|px-\d+|py-\d+)[^"]*"[^>]*>/g
};

// UI Kit component mappings
const componentMappings = {
  button: {
    import: 'import Button from "$lib/components/ui/button.svelte";',
    replacement: (match, className) => {
      if (className.includes('bg-blue-')) {
        return '<Button className="' + className.replace(/bg-blue-\d+/, '') + '">';
      } else if (className.includes('border')) {
        return '<Button variant="outline" className="' + className.replace(/border[^"]*/, '') + '">';
      }
      return '<Button className="' + className + '">';
    }
  },
  input: {
    import: 'import { Input } from "$lib/components/ui/form/index.js";',
    replacement: (match, className) => '<Input className="' + className + '" />'
  },
  card: {
    import: 'import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";',
    replacement: (match, className) => '<Card><CardHeader><CardTitle>Title</CardTitle></CardHeader><CardContent>'
  }
};

function findSvelteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findSvelteFiles(fullPath));
    } else if (item.endsWith('.svelte')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for raw button elements
  const buttonMatches = content.match(patterns.rawButtons);
  if (buttonMatches) {
    issues.push({
      type: 'raw-button',
      count: buttonMatches.length,
      examples: buttonMatches.slice(0, 3)
    });
  }
  
  // Check for raw input elements
  const inputMatches = content.match(patterns.rawInputs);
  if (inputMatches) {
    issues.push({
      type: 'raw-input',
      count: inputMatches.length,
      examples: inputMatches.slice(0, 3)
    });
  }
  
  // Check for raw card elements
  const cardMatches = content.match(patterns.rawCards);
  if (cardMatches) {
    issues.push({
      type: 'raw-card',
      count: cardMatches.length,
      examples: cardMatches.slice(0, 3)
    });
  }
  
  return issues.length > 0 ? { file: filePath, issues } : null;
}

function main() {
  console.log('🔍 Scanning for raw HTML elements that should use UI kit components...\n');
  
  const srcDir = path.join(projectRoot, 'src');
  const svelteFiles = findSvelteFiles(srcDir);
  
  const filesWithIssues = [];
  
  for (const file of svelteFiles) {
    const analysis = analyzeFile(file);
    if (analysis) {
      filesWithIssues.push(analysis);
    }
  }
  
  if (filesWithIssues.length === 0) {
    console.log('✅ No raw HTML elements found! All components are using the UI kit.');
    return;
  }
  
  console.log(`Found ${filesWithIssues.length} files with raw HTML elements:\n`);
  
  for (const file of filesWithIssues) {
    const relativePath = path.relative(projectRoot, file.file);
    console.log(`📁 ${relativePath}`);
    
    for (const issue of file.issues) {
      console.log(`  - ${issue.type}: ${issue.count} instances`);
      if (issue.examples.length > 0) {
        console.log(`    Examples:`);
        issue.examples.forEach(example => {
          console.log(`      ${example.substring(0, 80)}...`);
        });
      }
    }
    console.log('');
  }
  
  console.log('📋 Migration Checklist:');
  console.log('1. Replace raw <button> elements with <Button> component');
  console.log('2. Replace raw <input> elements with <Input> component');
  console.log('3. Replace raw <textarea> elements with <Textarea> component');
  console.log('4. Replace card-like <div> elements with <Card> components');
  console.log('5. Update imports to use UI kit components');
  console.log('6. Ensure consistent prop naming (className vs class)');
  console.log('7. Test all components after migration');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
