#!/usr/bin/env node

/**
 * Build Executable Script
 * 
 * Creates executable binary files and sets up proper permissions
 * for cross-platform CLI distribution.
 */

const fs = require('fs-extra');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const CLI_FILE = path.join(DIST_DIR, 'cli.js');
const BIN_DIR = path.join(DIST_DIR, 'bin');

async function buildExecutable() {
  console.log('🔨 Building executable...');
  
  try {
    // Ensure CLI file exists
    if (!fs.existsSync(CLI_FILE)) {
      console.error('❌ CLI file not found at:', CLI_FILE);
      console.error('Make sure to run TypeScript compilation first');
      process.exit(1);
    }
    
    // Create bin directory
    await fs.ensureDir(BIN_DIR);
    
    // Create Unix executable
    await createUnixExecutable();
    
    // Create Windows executable
    await createWindowsExecutable();
    
    // Update CLI file shebang
    await updateCliShebang();
    
    console.log('✅ Executable built successfully');
    
  } catch (error) {
    console.error('❌ Failed to build executable:', error);
    process.exit(1);
  }
}

async function createUnixExecutable() {
  const executablePath = path.join(BIN_DIR, 'amazonq-sdd');
  
  const shebangScript = `#!/usr/bin/env node

// Amazon Q SDD CLI Executable
// This file is generated automatically during build

const path = require('path');
const cliPath = path.join(__dirname, '..', 'cli.js');

// Check if the CLI file exists
if (!require('fs').existsSync(cliPath)) {
  console.error('❌ Amazon Q SDD CLI not found. Please reinstall the package.');
  process.exit(1);
}

// Execute the main CLI
require(cliPath);
`;

  await fs.writeFile(executablePath, shebangScript, { mode: 0o755 });
  console.log('🐧 Created Unix executable:', executablePath);
}

async function createWindowsExecutable() {
  const cmdPath = path.join(BIN_DIR, 'amazonq-sdd.cmd');
  
  const cmdScript = `@echo off
setlocal

rem Amazon Q SDD CLI Windows Executable
rem This file is generated automatically during build

set CLI_PATH=%~dp0..\\cli.js

if not exist "%CLI_PATH%" (
  echo ❌ Amazon Q SDD CLI not found. Please reinstall the package.
  exit /b 1
)

node "%CLI_PATH%" %*
endlocal
`;

  await fs.writeFile(cmdPath, cmdScript);
  console.log('🪟 Created Windows executable:', cmdPath);
}

async function updateCliShebang() {
  const cliContent = await fs.readFile(CLI_FILE, 'utf8');
  
  // Add or update shebang
  const shebang = '#!/usr/bin/env node\n';
  
  let updatedContent;
  if (cliContent.startsWith('#!')) {
    // Replace existing shebang
    updatedContent = cliContent.replace(/^#!.*\n/, shebang);
  } else {
    // Add shebang at the beginning
    updatedContent = shebang + cliContent;
  }
  
  await fs.writeFile(CLI_FILE, updatedContent);
  
  // Make CLI file executable on Unix systems
  if (process.platform !== 'win32') {
    await fs.chmod(CLI_FILE, 0o755);
  }
  
  console.log('🔧 Updated CLI file with proper shebang');
}

// Run if called directly
if (require.main === module) {
  buildExecutable();
}

module.exports = { buildExecutable };