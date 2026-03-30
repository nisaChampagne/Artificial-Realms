#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const path = require('path');

// Ensure the builds directory exists
const buildsDir = path.join(__dirname, '..', 'builds');
if (!existsSync(buildsDir)) {
  mkdirSync(buildsDir, { recursive: true });
}

console.log('Building Windows installer...');

try {
  console.log('Building for Windows x64...');
  
  // Set the command to run
  const command = 'npm run make -- --platform=win32 --arch=x64';
  
  // Execute the command
  execSync(command, { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('Successfully built Windows installer!');
  console.log('Output can be found in the out/ directory');
} catch (error) {
  console.error('Failed to build Windows installer:', error.message);
  process.exit(1);
}
