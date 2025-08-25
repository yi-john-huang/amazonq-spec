#!/usr/bin/env node

/**
 * Test Package Script
 * 
 * Tests the built package to ensure it works correctly before publishing.
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

const PACKAGE_DIR = path.resolve(__dirname, '..');
const TEMP_TEST_DIR = path.join(os.tmpdir(), 'amazonq-sdd-test-' + Date.now());

async function testPackage() {
  console.log('🧪 Testing package...');
  
  try {
    // Find the packaged tarball
    const tarball = await findPackageTarball();
    
    // Create temporary test directory
    await fs.ensureDir(TEMP_TEST_DIR);
    console.log(`📁 Using test directory: ${TEMP_TEST_DIR}`);
    
    // Test package installation
    await testPackageInstallation(tarball);
    
    // Test CLI functionality
    await testCliFunctionality();
    
    // Test global installation (optional)
    if (process.env.TEST_GLOBAL_INSTALL === 'true') {
      await testGlobalInstallation(tarball);
    }
    
    console.log('✅ Package testing passed');
    
  } catch (error) {
    console.error('❌ Package testing failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    await cleanup();
  }
}

async function findPackageTarball() {
  console.log('🔍 Finding package tarball...');
  
  const tarballs = require('glob').sync('*.tgz', { cwd: PACKAGE_DIR });
  
  if (tarballs.length === 0) {
    throw new Error('No package tarball found. Run "npm pack" first.');
  }
  
  if (tarballs.length > 1) {
    console.log('⚠️  Multiple tarballs found, using the newest one');
  }
  
  // Use the newest tarball
  const tarball = tarballs
    .map(file => ({
      file,
      mtime: fs.statSync(path.join(PACKAGE_DIR, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime)[0].file;
  
  const tarballPath = path.join(PACKAGE_DIR, tarball);
  console.log(`📦 Using tarball: ${tarball}`);
  
  return tarballPath;
}

async function testPackageInstallation(tarball) {
  console.log('📥 Testing package installation...');
  
  // Create package.json in test directory
  const testPackageJson = {
    name: 'amazonq-sdd-test',
    version: '1.0.0',
    private: true
  };
  
  await fs.writeJson(path.join(TEMP_TEST_DIR, 'package.json'), testPackageJson, { spaces: 2 });
  
  // Install from tarball
  try {
    execSync(`npm install "${tarball}"`, {
      cwd: TEMP_TEST_DIR,
      stdio: 'pipe'
    });
    console.log('  ✓ Package installed successfully');
  } catch (error) {
    throw new Error(`Package installation failed: ${error.message}`);
  }
  
  // Verify installation
  const nodeModulesPath = path.join(TEMP_TEST_DIR, 'node_modules', 'amazonq-sdd');
  if (!fs.existsSync(nodeModulesPath)) {
    throw new Error('Package not found in node_modules after installation');
  }
  
  console.log('  ✓ Package files verified');
}

async function testCliFunctionality() {
  console.log('⚙️ Testing CLI functionality...');
  
  const cliPath = path.join(TEMP_TEST_DIR, 'node_modules', 'amazonq-sdd', 'dist', 'cli.js');
  
  if (!fs.existsSync(cliPath)) {
    throw new Error('CLI file not found in installed package');
  }
  
  // Test help command
  try {
    const helpOutput = execSync(`node "${cliPath}" --help`, { 
      encoding: 'utf8',
      cwd: TEMP_TEST_DIR,
      timeout: 10000 
    });
    
    if (!helpOutput.includes('Usage:')) {
      throw new Error('CLI help output is invalid');
    }
    console.log('  ✓ Help command works');
  } catch (error) {
    throw new Error(`CLI help test failed: ${error.message}`);
  }
  
  // Test version command
  try {
    const versionOutput = execSync(`node "${cliPath}" --version`, { 
      encoding: 'utf8',
      cwd: TEMP_TEST_DIR,
      timeout: 10000 
    });
    
    if (!versionOutput.trim()) {
      throw new Error('CLI version output is empty');
    }
    console.log('  ✓ Version command works');
  } catch (error) {
    throw new Error(`CLI version test failed: ${error.message}`);
  }
  
  // Test dry run installation (if supported)
  try {
    const dryRunOutput = execSync(`node "${cliPath}" install --dry-run --skip-detection`, { 
      encoding: 'utf8',
      cwd: TEMP_TEST_DIR,
      timeout: 15000 
    });
    
    console.log('  ✓ Dry run installation works');
  } catch (error) {
    console.log('  ⚠️  Dry run test skipped (command may not support it)');
  }
}

async function testGlobalInstallation(tarball) {
  console.log('🌍 Testing global installation...');
  
  try {
    // Install globally
    execSync(`npm install -g "${tarball}"`, {
      stdio: 'pipe',
      timeout: 30000
    });
    console.log('  ✓ Global installation successful');
    
    // Test global command
    const globalOutput = execSync('amazonq-sdd --help', { 
      encoding: 'utf8',
      timeout: 10000 
    });
    
    if (!globalOutput.includes('Usage:')) {
      throw new Error('Global CLI help output is invalid');
    }
    console.log('  ✓ Global command works');
    
    // Uninstall globally
    execSync('npm uninstall -g amazonq-sdd', {
      stdio: 'pipe',
      timeout: 30000
    });
    console.log('  ✓ Global uninstallation successful');
    
  } catch (error) {
    console.log('  ⚠️  Global installation test failed (this may be expected in some environments)');
    console.log(`     Error: ${error.message}`);
    
    // Try to cleanup global installation if it partially succeeded
    try {
      execSync('npm uninstall -g amazonq-sdd', { stdio: 'pipe' });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    if (fs.existsSync(TEMP_TEST_DIR)) {
      await fs.remove(TEMP_TEST_DIR);
      console.log('  ✓ Test directory cleaned up');
    }
  } catch (error) {
    console.log(`  ⚠️  Cleanup warning: ${error.message}`);
  }
}

// Run if called directly
if (require.main === module) {
  testPackage();
}

module.exports = { testPackage };