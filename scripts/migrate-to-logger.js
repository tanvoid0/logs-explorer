#!/usr/bin/env node

/**
 * Script to migrate console statements to use our new logging utility
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patterns to match console statements
const CONSOLE_PATTERNS = [
  /console\.log\s*\(\s*([^)]+)\s*\)/g,
  /console\.error\s*\(\s*([^)]+)\s*\)/g,
  /console\.warn\s*\(\s*([^)]+)\s*\)/g,
  /console\.info\s*\(\s*([^)]+)\s*\)/g,
  /console\.debug\s*\(\s*([^)]+)\s*\)/g
];

// Mapping of console methods to logger methods
const CONSOLE_TO_LOGGER = {
  'console.log': 'logger.info',
  'console.error': 'logger.error',
  'console.warn': 'logger.warn',
  'console.info': 'logger.info',
  'console.debug': 'logger.debug'
};

// Files to exclude from migration
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /\.svelte-kit/,
  /scripts\/test-logging\.js/, // Our test script
  /scripts\/migrate-to-logger\.js/ // This script itself
];

// File extensions to process
const INCLUDED_EXTENSIONS = ['.js', '.ts', '.svelte'];

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function shouldIncludeFile(filePath) {
  const ext = path.extname(filePath);
  return INCLUDED_EXTENSIONS.includes(ext);
}

function addLoggerImport(content, filePath) {
  // Check if logger is already imported
  if (content.includes("import { logger }") || content.includes("from '$lib/utils/logger'")) {
    return content;
  }

  // Find the best place to add the import
  const lines = content.split('\n');
  let insertIndex = 0;

  // Find the first import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      insertIndex = i + 1;
    } else if (lines[i].trim() && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('/*')) {
      break;
    }
  }

  // Add the logger import
  const loggerImport = "import { logger } from '$lib/utils/logger';";
  lines.splice(insertIndex, 0, loggerImport);

  return lines.join('\n');
}

function migrateConsoleStatements(content, filePath) {
  let migratedContent = content;
  let changes = 0;

  // Add logger import if needed
  if (content.includes('console.')) {
    migratedContent = addLoggerImport(migratedContent, filePath);
  }

  // Replace console statements
  for (const [consoleMethod, loggerMethod] of Object.entries(CONSOLE_TO_LOGGER)) {
    const pattern = new RegExp(`${consoleMethod.replace('.', '\\.')}\\s*\\(\\s*([^)]+)\\s*\\)`, 'g');
    
    migratedContent = migratedContent.replace(pattern, (match, args) => {
      changes++;
      
      // Handle different argument patterns
      const trimmedArgs = args.trim();
      
      // If it's a simple string, just pass it directly
      if (trimmedArgs.startsWith('"') || trimmedArgs.startsWith("'") || trimmedArgs.startsWith('`')) {
        return `${loggerMethod}(${trimmedArgs})`;
      }
      
      // If it's a template literal or complex expression, wrap it in a context object
      if (trimmedArgs.includes('${') || trimmedArgs.includes('+') || trimmedArgs.includes(',')) {
        return `${loggerMethod}('${consoleMethod} statement', { value: ${trimmedArgs} })`;
      }
      
      // Default case
      return `${loggerMethod}(${trimmedArgs})`;
    });
  }

  return { content: migratedContent, changes };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: migratedContent, changes } = migrateConsoleStatements(content, filePath);
    
    if (changes > 0) {
      fs.writeFileSync(filePath, migratedContent);
      console.log(`✅ Migrated ${changes} console statements in ${filePath}`);
      return changes;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function walkDirectory(dir) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!shouldExcludeFile(fullPath)) {
          files.push(...walkDirectory(fullPath));
        }
      } else if (stat.isFile() && shouldIncludeFile(fullPath) && !shouldExcludeFile(fullPath)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

function main() {
  console.log('🔄 Starting console statement migration to logger...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = walkDirectory(srcDir);
  
  console.log(`📁 Found ${files.length} files to process\n`);
  
  let totalChanges = 0;
  let processedFiles = 0;
  
  for (const file of files) {
    const changes = processFile(file);
    if (changes > 0) {
      totalChanges += changes;
      processedFiles++;
    }
  }
  
  console.log(`\n🎉 Migration completed!`);
  console.log(`📊 Files processed: ${processedFiles}`);
  console.log(`📊 Total console statements migrated: ${totalChanges}`);
  
  if (totalChanges > 0) {
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review the changes in the migrated files`);
    console.log(`   2. Test the application to ensure logging works correctly`);
    console.log(`   3. Run 'pnpm run logs:test' to verify the logging system`);
    console.log(`   4. Check the logs directory for generated log files`);
  } else {
    console.log(`\n✅ No console statements found to migrate!`);
  }
}

// Run the migration
try {
  main();
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
