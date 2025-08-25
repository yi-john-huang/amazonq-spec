#!/usr/bin/env node

/**
 * Version Check Script
 * 
 * Validates version consistency across the codebase and provides version utilities.
 */

const fs = require('fs-extra');
const path = require('path');

const PACKAGE_JSON = path.resolve(__dirname, '..', 'package.json');
const SRC_INDEX = path.resolve(__dirname, '..', 'src', 'index.ts');
const README_PATH = path.resolve(__dirname, '..', 'README.md');
const CHANGELOG_PATH = path.resolve(__dirname, '..', 'CHANGELOG.md');

async function checkVersion() {
  console.log('📋 Checking version consistency...');
  
  try {
    const packageJson = await fs.readJson(PACKAGE_JSON);
    const currentVersion = packageJson.version;
    
    console.log(`📦 Package version: ${currentVersion}`);
    
    // Check if version follows semantic versioning
    validateSemanticVersion(currentVersion);
    
    // Check version consistency in source code
    await checkSourceCodeVersion(currentVersion);
    
    // Check changelog for version entry
    await checkChangelogVersion(currentVersion);
    
    // Generate version info
    await generateVersionInfo(currentVersion);
    
    console.log('✅ Version check passed');
    
  } catch (error) {
    console.error('❌ Version check failed:', error.message);
    process.exit(1);
  }
}

function validateSemanticVersion(version) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  
  if (!semverRegex.test(version)) {
    throw new Error(`Version "${version}" does not follow semantic versioning format`);
  }
  
  console.log('  ✓ Version follows semantic versioning');
}

async function checkSourceCodeVersion(expectedVersion) {
  console.log('🔍 Checking source code version references...');
  
  // Check if there's a version export in index.ts
  if (fs.existsSync(SRC_INDEX)) {
    const indexContent = await fs.readFile(SRC_INDEX, 'utf8');
    
    // Look for version exports or constants
    const versionMatch = indexContent.match(/(?:export const version|VERSION)\s*=\s*['"`]([^'"`]+)['"`]/);
    
    if (versionMatch) {
      const sourceVersion = versionMatch[1];
      if (sourceVersion !== expectedVersion) {
        throw new Error(`Source code version "${sourceVersion}" does not match package.json version "${expectedVersion}"`);
      }
      console.log('  ✓ Source code version matches');
    } else {
      console.log('  ℹ️  No version constant found in source code');
    }
  }
  
  // Check for version references in CLI files
  const cliFiles = require('glob').sync('src/**/*.ts', { 
    cwd: path.resolve(__dirname, '..') 
  });
  
  for (const file of cliFiles) {
    const content = await fs.readFile(path.resolve(__dirname, '..', file), 'utf8');
    
    // Look for hardcoded version strings that might be outdated
    const hardcodedVersions = content.match(/['"`]v?\d+\.\d+\.\d+['"`]/g);
    if (hardcodedVersions) {
      console.log(`  ⚠️  Found potential hardcoded versions in ${file}:`, hardcodedVersions);
    }
  }
}

async function checkChangelogVersion(currentVersion) {
  console.log('📝 Checking changelog...');
  
  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.log('  ⚠️  CHANGELOG.md not found - creating template');
    await createChangelogTemplate(currentVersion);
    return;
  }
  
  const changelogContent = await fs.readFile(CHANGELOG_PATH, 'utf8');
  
  // Check if current version is documented
  const versionPattern = new RegExp(`##.*${currentVersion.replace(/\./g, '\\.')}`, 'i');
  
  if (!versionPattern.test(changelogContent)) {
    console.log(`  ⚠️  Version ${currentVersion} not found in changelog`);
    await addVersionToChangelog(currentVersion);
  } else {
    console.log('  ✓ Version found in changelog');
  }
}

async function createChangelogTemplate(version) {
  const template = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [${version}] - ${new Date().toISOString().split('T')[0]}

### Added
- Initial release of Amazon Q SDD
- Complete CLI workflow for spec-driven development
- Amazon Q CLI integration
- Cross-platform support

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A
`;
  
  await fs.writeFile(CHANGELOG_PATH, template, 'utf8');
  console.log('  ✓ Created CHANGELOG.md template');
}

async function addVersionToChangelog(version) {
  const changelogContent = await fs.readFile(CHANGELOG_PATH, 'utf8');
  
  const versionEntry = `## [${version}] - ${new Date().toISOString().split('T')[0]}

### Added
- Version ${version} release

### Changed
- N/A

### Fixed
- N/A

`;
  
  // Insert after the main header
  const updatedChangelog = changelogContent.replace(
    /(# Changelog\n\n.*?\n\n)/s,
    `$1${versionEntry}`
  );
  
  await fs.writeFile(CHANGELOG_PATH, updatedChangelog, 'utf8');
  console.log(`  ✓ Added version ${version} to changelog`);
}

async function generateVersionInfo(version) {
  console.log('📊 Generating version info...');
  
  const versionInfo = {
    version,
    buildDate: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    gitHash: getGitHash(),
    isDirty: isGitDirty()
  };
  
  // Write version info for runtime use
  const versionInfoPath = path.resolve(__dirname, '..', 'src', 'version-info.json');
  await fs.writeJson(versionInfoPath, versionInfo, { spaces: 2 });
  
  console.log(`  ✓ Generated version info: ${version} (${versionInfo.gitHash})`);
  
  return versionInfo;
}

function getGitHash() {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function isGitDirty() {
  try {
    const { execSync } = require('child_process');
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    return status.length > 0;
  } catch (error) {
    return false;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'bump':
      bumpVersion(process.argv[3] || 'patch');
      break;
    case 'info':
      showVersionInfo();
      break;
    default:
      checkVersion();
  }
}

async function bumpVersion(type) {
  const { execSync } = require('child_process');
  
  try {
    console.log(`🚀 Bumping ${type} version...`);
    const output = execSync(`npm version ${type} --no-git-tag-version`, { encoding: 'utf8' });
    const newVersion = output.trim();
    
    console.log(`📦 New version: ${newVersion}`);
    
    // Run version check to update related files
    await checkVersion();
    
  } catch (error) {
    console.error('❌ Version bump failed:', error.message);
    process.exit(1);
  }
}

async function showVersionInfo() {
  const packageJson = await fs.readJson(PACKAGE_JSON);
  const versionInfo = await generateVersionInfo(packageJson.version);
  
  console.log('\n📋 Version Information:');
  console.log(`   Package: ${packageJson.name}`);
  console.log(`   Version: ${versionInfo.version}`);
  console.log(`   Build Date: ${versionInfo.buildDate}`);
  console.log(`   Node Version: ${versionInfo.nodeVersion}`);
  console.log(`   Platform: ${versionInfo.platform}/${versionInfo.arch}`);
  console.log(`   Git Hash: ${versionInfo.gitHash}${versionInfo.isDirty ? ' (dirty)' : ''}`);
}

module.exports = { checkVersion, generateVersionInfo };