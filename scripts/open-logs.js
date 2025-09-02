#!/usr/bin/env node

/**
 * Script to open the logs directory
 */

import { exec } from 'child_process';
import { platform } from 'os';
import { join } from 'path';

const logsDir = join(process.cwd(), 'logs');

console.log('📁 Opening logs directory...');
console.log(`📍 Path: ${logsDir}`);

const os = platform();

let command;

switch (os) {
  case 'darwin': // macOS
    command = `open "${logsDir}"`;
    break;
  case 'win32': // Windows
    command = `explorer "${logsDir}"`;
    break;
  default: // Linux and others
    command = `xdg-open "${logsDir}"`;
    break;
}

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Failed to open logs directory:', error.message);
    console.log('💡 You can manually navigate to:', logsDir);
    return;
  }
  
  if (stderr) {
    console.warn('⚠️  Warning:', stderr);
  }
  
  console.log('✅ Logs directory opened successfully!');
});
