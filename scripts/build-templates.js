#!/usr/bin/env node

/**
 * Build Templates Script
 * 
 * Copies Handlebars templates to the distribution directory and compiles them
 * for inclusion in the published package.
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const TEMPLATE_SRC_DIR = path.resolve(__dirname, '..', 'templates');
const TEMPLATE_DEST_DIR = path.resolve(__dirname, '..', 'dist', 'templates');

async function buildTemplates() {
  console.log('🔨 Building templates...');
  
  try {
    // Ensure destination directory exists
    await fs.ensureDir(TEMPLATE_DEST_DIR);
    
    // Check if templates directory exists
    if (!fs.existsSync(TEMPLATE_SRC_DIR)) {
      console.log('📁 No templates directory found, creating structure...');
      await fs.ensureDir(TEMPLATE_SRC_DIR);
      await createDefaultTemplates();
    }
    
    // Copy all template files
    console.log(`📂 Copying templates from ${TEMPLATE_SRC_DIR} to ${TEMPLATE_DEST_DIR}`);
    await fs.copy(TEMPLATE_SRC_DIR, TEMPLATE_DEST_DIR, {
      filter: (src) => {
        // Only copy template files and necessary metadata
        return src.endsWith('.hbs') || 
               src.endsWith('.json') || 
               src.endsWith('.md') ||
               fs.lstatSync(src).isDirectory();
      }
    });
    
    // Generate template manifest
    await generateTemplateManifest();
    
    console.log('✅ Templates built successfully');
    
  } catch (error) {
    console.error('❌ Failed to build templates:', error);
    process.exit(1);
  }
}

async function createDefaultTemplates() {
  console.log('🏗️  Creating default template structure...');
  
  const templateDirs = [
    'prompts',
    'scripts/unix',
    'scripts/windows', 
    'config'
  ];
  
  for (const dir of templateDirs) {
    await fs.ensureDir(path.join(TEMPLATE_SRC_DIR, dir));
  }
  
  // Create a basic template manifest
  const manifest = {
    version: '1.0.0',
    templates: [],
    lastUpdated: new Date().toISOString(),
    description: 'Amazon Q SDD template collection'
  };
  
  await fs.writeJson(path.join(TEMPLATE_SRC_DIR, 'manifest.json'), manifest, { spaces: 2 });
  console.log('📝 Created template manifest');
}

async function generateTemplateManifest() {
  console.log('📋 Generating template manifest...');
  
  const templates = [];
  
  // Find all template files
  const templateFiles = glob.sync('**/*.hbs', { cwd: TEMPLATE_SRC_DIR });
  
  for (const templateFile of templateFiles) {
    const fullPath = path.join(TEMPLATE_SRC_DIR, templateFile);
    const stats = await fs.stat(fullPath);
    
    templates.push({
      path: templateFile,
      name: path.basename(templateFile, '.hbs'),
      category: path.dirname(templateFile),
      size: stats.size,
      lastModified: stats.mtime.toISOString()
    });
  }
  
  const manifest = {
    version: require('../package.json').version,
    templates,
    totalTemplates: templates.length,
    lastUpdated: new Date().toISOString(),
    description: 'Amazon Q SDD template collection',
    categories: [...new Set(templates.map(t => t.category))]
  };
  
  await fs.writeJson(path.join(TEMPLATE_DEST_DIR, 'manifest.json'), manifest, { spaces: 2 });
  console.log(`📄 Generated manifest with ${templates.length} templates`);
}

// Run if called directly
if (require.main === module) {
  buildTemplates();
}

module.exports = { buildTemplates };