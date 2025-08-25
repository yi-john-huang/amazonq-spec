#!/usr/bin/env node

/**
 * Validate Build Script
 * 
 * Validates that the build output is correct and complete before packaging.
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PACKAGE_JSON = path.resolve(__dirname, '..', 'package.json');

async function validateBuild() {
  console.log('🔍 Validating build output...');
  
  try {
    const packageJson = await fs.readJson(PACKAGE_JSON);
    
    // Validate required files exist
    await validateRequiredFiles(packageJson);
    
    // Validate TypeScript compilation
    await validateTypeScriptOutput();
    
    // Validate CLI executable
    await validateCliExecutable();
    
    // Validate templates
    await validateTemplates();
    
    // Validate package structure
    await validatePackageStructure(packageJson);
    
    // Generate build report
    await generateBuildReport();
    
    console.log('✅ Build validation passed');
    
  } catch (error) {
    console.error('❌ Build validation failed:', error.message);
    process.exit(1);
  }
}

async function validateRequiredFiles(packageJson) {
  console.log('📋 Checking required files...');
  
  const requiredFiles = [
    packageJson.main, // dist/index.js
    packageJson.bin['amazonq-sdd'], // dist/cli.js
  ];
  
  for (const file of requiredFiles) {
    const fullPath = path.resolve(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Required file missing: ${file}`);
    }
    console.log(`  ✓ ${file}`);
  }
}

async function validateTypeScriptOutput() {
  console.log('🔧 Validating TypeScript compilation...');
  
  // Check if all TypeScript files were compiled
  const tsFiles = require('glob').sync('src/**/*.ts', { 
    cwd: path.resolve(__dirname, '..'),
    ignore: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts']
  });
  
  for (const tsFile of tsFiles) {
    const jsFile = tsFile.replace(/^src/, 'dist').replace(/\.ts$/, '.js');
    const fullPath = path.resolve(__dirname, '..', jsFile);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Compiled JS file missing: ${jsFile} (from ${tsFile})`);
    }
  }
  
  console.log(`  ✓ Compiled ${tsFiles.length} TypeScript files`);
}

async function validateCliExecutable() {
  console.log('⚙️ Validating CLI executable...');
  
  const cliPath = path.resolve(__dirname, '..', 'dist', 'cli.js');
  
  // Check if file is executable
  try {
    const stats = await fs.stat(cliPath);
    if (process.platform !== 'win32' && !(stats.mode & 0o111)) {
      throw new Error('CLI file is not executable');
    }
    console.log('  ✓ CLI file is executable');
  } catch (error) {
    throw new Error(`CLI executable check failed: ${error.message}`);
  }
  
  // Test CLI help command
  try {
    const output = execSync(`node "${cliPath}" --help`, { 
      encoding: 'utf8',
      timeout: 5000 
    });
    if (!output.includes('Usage:')) {
      throw new Error('CLI help output is invalid');
    }
    console.log('  ✓ CLI help command works');
  } catch (error) {
    throw new Error(`CLI help test failed: ${error.message}`);
  }
}

async function validateTemplates() {
  console.log('📄 Validating templates...');
  
  const templateDir = path.join(DIST_DIR, 'templates');
  
  if (fs.existsSync(templateDir)) {
    const manifestPath = path.join(templateDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Template manifest missing');
    }
    
    const manifest = await fs.readJson(manifestPath);
    console.log(`  ✓ Found ${manifest.totalTemplates} templates`);
  } else {
    console.log('  ⚠️  No templates directory found (this may be expected)');
  }
}

async function validatePackageStructure(packageJson) {
  console.log('📦 Validating package structure...');
  
  // Check files array matches actual files
  for (const filePattern of packageJson.files || []) {
    const files = require('glob').sync(filePattern, { 
      cwd: path.resolve(__dirname, '..') 
    });
    
    if (files.length === 0) {
      console.log(`  ⚠️  No files match pattern: ${filePattern}`);
    } else {
      console.log(`  ✓ ${files.length} files match pattern: ${filePattern}`);
    }
  }
  
  // Validate package.json integrity
  if (!packageJson.name || !packageJson.version) {
    throw new Error('Package name or version missing');
  }
  
  console.log(`  ✓ Package: ${packageJson.name}@${packageJson.version}`);
}

async function generateBuildReport() {
  console.log('📊 Generating build report...');
  
  const packageJson = await fs.readJson(PACKAGE_JSON);
  
  // Collect build statistics
  const stats = {
    packageName: packageJson.name,
    version: packageJson.version,
    buildDate: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    files: {}
  };
  
  // Get file sizes
  const distFiles = require('glob').sync('**/*', { 
    cwd: DIST_DIR,
    nodir: true 
  });
  
  let totalSize = 0;
  for (const file of distFiles) {
    const filePath = path.join(DIST_DIR, file);
    const stat = await fs.stat(filePath);
    stats.files[file] = {
      size: stat.size,
      modified: stat.mtime.toISOString()
    };
    totalSize += stat.size;
  }
  
  stats.totalSize = totalSize;
  stats.fileCount = distFiles.length;
  
  // Write build report
  const reportPath = path.join(DIST_DIR, 'build-report.json');
  await fs.writeJson(reportPath, stats, { spaces: 2 });
  
  console.log(`  ✓ Build report: ${Math.round(totalSize / 1024)}KB, ${distFiles.length} files`);
}

// Run if called directly
if (require.main === module) {
  validateBuild();
}

module.exports = { validateBuild };