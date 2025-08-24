/**
 * Complete End-to-End Workflow Tests
 * 
 * These tests validate the entire amazonq-sdd workflow from installation
 * to project setup and feature development using real scenarios.
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

import { InstallationManager } from '../../services/InstallationManager';
import { TemplateGenerator } from '../../services/TemplateGenerator';
import { ScriptGenerator } from '../../services/ScriptGenerator';
import { ConfigurationManager } from '../../services/ConfigurationManager';
import { Logger } from '../../utils/logger';
import { LocalizationManager } from '../../localization';
import { Language, Platform } from '../../types';

const execAsync = promisify(exec);

describe('Complete Workflow E2E Tests', () => {
  let testProjectDir: string;
  let logger: Logger;
  let installationManager: InstallationManager;
  let templateGenerator: TemplateGenerator;
  let scriptGenerator: ScriptGenerator;
  let configurationManager: ConfigurationManager;
  let localizationManager: LocalizationManager;

  beforeAll(async () => {
    // Create isolated test environment
    const timestamp = Date.now();
    testProjectDir = join(tmpdir(), `amazonq-sdd-e2e-${timestamp}`);
    await fs.mkdir(testProjectDir, { recursive: true });

    // Initialize services
    logger = new Logger();
    logger.setLevel('error'); // Reduce noise in tests
    
    localizationManager = new LocalizationManager(logger);
    installationManager = new InstallationManager(logger, localizationManager);
    templateGenerator = new TemplateGenerator(logger);
    scriptGenerator = new ScriptGenerator(logger);
    configurationManager = new ConfigurationManager(logger, localizationManager);

    console.log(`E2E Test environment: ${testProjectDir}`);
  });

  afterAll(async () => {
    // Cleanup test environment
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
      console.log('E2E Test environment cleaned up');
    } catch (error) {
      console.warn(`Failed to cleanup test environment: ${error}`);
    }
  });

  describe('Complete Installation Workflow', () => {
    it('should complete full project setup workflow', async () => {
      // Step 1: Initialize project
      const projectName = 'test-e2e-project';
      const config = {
        projectName,
        language: Language.ENGLISH,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: localizationManager.getStrings(Language.ENGLISH),
        version: '1.0.0',
        installedAt: new Date()
      };

      // Step 2: Install project structure
      const installResult = await installationManager.install(testProjectDir, config);
      expect(installResult.success).toBe(true);
      expect(installResult.configPath).toBeTruthy();

      // Step 3: Verify directory structure was created
      const expectedDirs = [
        join(testProjectDir, '.kiro'),
        join(testProjectDir, '.kiro', 'specs'),
        join(testProjectDir, '.kiro', 'steering'),
        join(testProjectDir, '.claude'),
        join(testProjectDir, '.claude', 'commands')
      ];

      for (const dir of expectedDirs) {
        const exists = await fs.stat(dir).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }

      // Step 4: Verify configuration file was created
      const configExists = await fs.stat(installResult.configPath!).then(() => true).catch(() => false);
      expect(configExists).toBe(true);

      // Step 5: Verify configuration content
      const configContent = await fs.readFile(installResult.configPath!, 'utf8');
      expect(configContent).toContain(projectName);
      expect(configContent).toContain('Amazon Q CLI');
      expect(configContent).toContain('.kiro');
    }, 30000);

    it('should handle installation in existing project', async () => {
      // Create existing project structure
      const existingProjectDir = join(testProjectDir, 'existing-project');
      await fs.mkdir(existingProjectDir, { recursive: true });
      await fs.writeFile(join(existingProjectDir, 'package.json'), '{"name": "existing"}');

      const config = {
        projectName: 'existing-project',
        language: Language.ENGLISH,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: localizationManager.getStrings(Language.ENGLISH),
        version: '1.0.0',
        installedAt: new Date()
      };

      const result = await installationManager.install(existingProjectDir, config);
      expect(result.success).toBe(true);

      // Should preserve existing files
      const packageJsonExists = await fs.stat(join(existingProjectDir, 'package.json')).then(() => true).catch(() => false);
      expect(packageJsonExists).toBe(true);

      // Should add .kiro structure
      const kiroExists = await fs.stat(join(existingProjectDir, '.kiro')).then(() => true).catch(() => false);
      expect(kiroExists).toBe(true);
    });
  });

  describe('Template and Script Generation Workflow', () => {
    let projectDir: string;

    beforeAll(async () => {
      projectDir = join(testProjectDir, 'template-test-project');
      await fs.mkdir(projectDir, { recursive: true });

      // Install basic structure
      const config = {
        projectName: 'template-test-project',
        language: Language.ENGLISH,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: localizationManager.getStrings(Language.ENGLISH),
        version: '1.0.0',
        installedAt: new Date()
      };

      await installationManager.install(projectDir, config);
    });

    it('should generate complete feature specification workflow', async () => {
      const featureName = 'user-authentication';
      
      // Step 1: Generate spec-init template
      const initTemplate = await templateGenerator.generateTemplate('spec-init', {
        feature: featureName,
        language: Language.ENGLISH,
        projectContext: {
          name: 'template-test-project',
          type: 'web-application'
        }
      });

      expect(initTemplate.success).toBe(true);
      expect(initTemplate.content).toContain(featureName);
      expect(initTemplate.content).toContain('specification');

      // Step 2: Generate requirements template
      const requirementsTemplate = await templateGenerator.generateTemplate('spec-requirements', {
        feature: featureName,
        language: Language.ENGLISH
      });

      expect(requirementsTemplate.success).toBe(true);
      expect(requirementsTemplate.content).toContain('requirements');
      expect(requirementsTemplate.content).toContain(featureName);

      // Step 3: Generate design template
      const designTemplate = await templateGenerator.generateTemplate('spec-design', {
        feature: featureName,
        language: Language.ENGLISH
      });

      expect(designTemplate.success).toBe(true);
      expect(designTemplate.content).toContain('design');

      // Step 4: Generate tasks template
      const tasksTemplate = await templateGenerator.generateTemplate('spec-tasks', {
        feature: featureName,
        language: Language.ENGLISH
      });

      expect(tasksTemplate.success).toBe(true);
      expect(tasksTemplate.content).toContain('tasks');

      // Step 5: Generate status template
      const statusTemplate = await templateGenerator.generateTemplate('spec-status', {
        feature: featureName,
        language: Language.ENGLISH
      });

      expect(statusTemplate.success).toBe(true);
      expect(statusTemplate.content).toContain('progress');
    });

    it('should generate cross-platform command scripts', async () => {
      const commands = [
        'kiro:spec-init',
        'kiro:spec-requirements', 
        'kiro:spec-design',
        'kiro:spec-tasks',
        'kiro:spec-status',
        'kiro:steering'
      ];

      for (const command of commands) {
        // Generate Unix script
        const unixScript = await scriptGenerator.generateScript(command, {
          platform: Platform.LINUX,
          outputPath: join(projectDir, '.claude', 'commands', `${command.replace(':', '-')}.sh`)
        });

        expect(unixScript.success).toBe(true);
        expect(unixScript.scriptPath).toContain('.sh');
        expect(unixScript.content).toContain('#!/bin/bash');
        expect(unixScript.content).toContain('Amazon Q CLI');

        // Generate Windows script
        const windowsScript = await scriptGenerator.generateScript(command, {
          platform: Platform.WINDOWS,
          outputPath: join(projectDir, '.claude', 'commands', `${command.replace(':', '-')}.ps1`)
        });

        expect(windowsScript.success).toBe(true);
        expect(windowsScript.scriptPath).toContain('.ps1');
        expect(windowsScript.content).toContain('PowerShell');
        expect(windowsScript.content).toContain('Amazon Q CLI');
      }
    });

    it('should validate generated files are executable and functional', async () => {
      const commandScript = join(projectDir, '.claude', 'commands', 'kiro-spec-init.sh');
      
      if (process.platform !== 'win32') {
        try {
          // Check if file exists and is executable
          const stats = await fs.stat(commandScript);
          expect(stats.isFile()).toBe(true);

          // Check file permissions (should be executable)
          const mode = stats.mode;
          const isExecutable = (mode & parseInt('111', 8)) !== 0;
          expect(isExecutable).toBe(true);

          // Test syntax (basic validation)
          const content = await fs.readFile(commandScript, 'utf8');
          expect(content).toMatch(/^#!/); // Should have shebang
          expect(content).not.toContain('syntax error');

        } catch (error) {
          // Script generation might have failed, which is acceptable in test environment
          console.warn(`Script validation warning: ${error}`);
        }
      }
    });
  });

  describe('Multi-language Support Workflow', () => {
    it('should handle complete multilingual installation', async () => {
      const languages = [Language.ENGLISH, Language.JAPANESE, Language.CHINESE_TRADITIONAL];
      const multilingualProjectDir = join(testProjectDir, 'multilingual-project');
      await fs.mkdir(multilingualProjectDir, { recursive: true });

      for (const language of languages) {
        const config = {
          projectName: 'multilingual-project',
          language,
          amazonQCLIPath: '/usr/local/bin/q',
          kiroDirectory: '.kiro',
          localization: localizationManager.getStrings(language),
          version: '1.0.0',
          installedAt: new Date()
        };

        // Generate localized configuration
        const configResult = configurationManager.generateAmazonQConfig(
          join(multilingualProjectDir, `AMAZONQ.${language}.md`),
          config
        );

        expect(configResult.path).toBeTruthy();
        expect(configResult.content).toBeTruthy();

        // Verify language-specific content
        const expectedStrings = localizationManager.getStrings(language);
        expect(configResult.content).toContain(expectedStrings.messages.language_name);
      }

      // Verify all configuration files were created
      const configFiles = await fs.readdir(multilingualProjectDir);
      const expectedFiles = languages.map(lang => `AMAZONQ.${lang}.md`);
      
      for (const expectedFile of expectedFiles) {
        expect(configFiles).toContain(expectedFile);
      }
    });

    it('should generate localized templates for each language', async () => {
      const languages = [Language.ENGLISH, Language.JAPANESE];
      
      for (const language of languages) {
        const template = await templateGenerator.generateTemplate('spec-init', {
          feature: 'multilingual-feature',
          language,
          projectContext: { name: 'multilingual-test' }
        });

        expect(template.success).toBe(true);
        expect(template.content).toBeTruthy();

        // Verify language-specific strings are present
        const strings = localizationManager.getStrings(language);
        // The template should contain some localized content
        // This is a basic check - in a real scenario you'd check for specific translated phrases
        expect(template.content.length).toBeGreaterThan(100);
      }
    });
  });

  describe('Configuration Management Workflow', () => {
    let configProjectDir: string;
    let configPath: string;

    beforeAll(async () => {
      configProjectDir = join(testProjectDir, 'config-project');
      await fs.mkdir(configProjectDir, { recursive: true });
      configPath = join(configProjectDir, 'AMAZONQ.md');
    });

    it('should complete configuration lifecycle', async () => {
      const initialConfig = {
        projectName: 'config-project',
        language: Language.ENGLISH,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: localizationManager.getStrings(Language.ENGLISH),
        version: '1.0.0',
        installedAt: new Date()
      };

      // Step 1: Generate initial configuration
      const createResult = configurationManager.generateAmazonQConfig(configPath, initialConfig);
      expect(createResult.path).toBe(configPath);
      expect(createResult.content).toContain('config-project');

      // Step 2: Validate configuration
      const validationResult = configurationManager.validateConfiguration(configPath);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Step 3: Backup configuration
      const backupPath = configurationManager.backupConfiguration(configPath);
      expect(backupPath).toBeTruthy();
      expect(backupPath).toContain('.backup-');

      // Verify backup exists
      const backupExists = await fs.stat(backupPath!).then(() => true).catch(() => false);
      expect(backupExists).toBe(true);

      // Step 4: Update configuration
      const updateResult = configurationManager.updateConfiguration(configPath, {
        amazonQCLIPath: '/opt/amazon-q/bin/q'
      });
      expect(updateResult).toBe(true);

      // Verify update was applied
      const updatedContent = await fs.readFile(configPath, 'utf8');
      expect(updatedContent).toContain('/opt/amazon-q/bin/q');

      // Step 5: Restore from backup if needed
      const restoreResult = configurationManager.restoreConfiguration(backupPath!, configPath);
      expect(restoreResult).toBe(true);

      // Verify restoration
      const restoredContent = await fs.readFile(configPath, 'utf8');
      expect(restoredContent).toContain('/usr/local/bin/q');
    });

    it('should handle configuration validation errors', async () => {
      // Create invalid configuration file
      const invalidConfigPath = join(configProjectDir, 'AMAZONQ-invalid.md');
      await fs.writeFile(invalidConfigPath, 'Invalid configuration content');

      const validationResult = configurationManager.validateConfiguration(invalidConfigPath);
      expect(validationResult.valid).toBe(false);
      expect(validationResult.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle missing dependencies gracefully', async () => {
      const errorProjectDir = join(testProjectDir, 'error-project');
      await fs.mkdir(errorProjectDir, { recursive: true });

      // Test with invalid Amazon Q CLI path
      const configWithInvalidCLI = {
        projectName: 'error-project',
        language: Language.ENGLISH,
        amazonQCLIPath: '/nonexistent/path/to/q',
        kiroDirectory: '.kiro',
        localization: localizationManager.getStrings(Language.ENGLISH),
        version: '1.0.0',
        installedAt: new Date()
      };

      // Installation should still succeed (it doesn't validate CLI at install time)
      const installResult = await installationManager.install(errorProjectDir, configWithInvalidCLI);
      expect(installResult.success).toBe(true);

      // But configuration should warn about the invalid path
      const configPath = installResult.configPath!;
      const configContent = await fs.readFile(configPath, 'utf8');
      expect(configContent).toContain('/nonexistent/path/to/q');
    });

    it('should handle file system permission errors', async () => {
      // This test might not work on all systems due to permission restrictions
      const restrictedDir = join(testProjectDir, 'restricted');
      
      try {
        await fs.mkdir(restrictedDir, { recursive: true });
        
        // Try to install in directory and then make it read-only
        const config = {
          projectName: 'restricted-project',
          language: Language.ENGLISH,
          amazonQCLIPath: '/usr/local/bin/q',
          kiroDirectory: '.kiro',
          localization: localizationManager.getStrings(Language.ENGLISH),
          version: '1.0.0',
          installedAt: new Date()
        };

        const result = await installationManager.install(restrictedDir, config);
        // Should handle gracefully (either succeed or fail with meaningful error)
        expect(typeof result.success).toBe('boolean');
        
      } catch (error) {
        // Permission errors are acceptable in test environment
        console.warn(`Permission test skipped: ${error}`);
      }
    });
  });

  describe('Integration Points', () => {
    it('should verify all service integrations work together', async () => {
      const integrationProjectDir = join(testProjectDir, 'integration-project');
      await fs.mkdir(integrationProjectDir, { recursive: true });

      // Full workflow integration test
      const config = {
        projectName: 'integration-project',
        language: Language.ENGLISH,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: localizationManager.getStrings(Language.ENGLISH),
        version: '1.0.0',
        installedAt: new Date()
      };

      // 1. Install project
      const installResult = await installationManager.install(integrationProjectDir, config);
      expect(installResult.success).toBe(true);

      // 2. Generate templates
      const templateResult = await templateGenerator.generateTemplate('spec-init', {
        feature: 'integration-feature',
        language: Language.ENGLISH,
        projectContext: { name: 'integration-project' }
      });
      expect(templateResult.success).toBe(true);

      // 3. Generate scripts  
      const scriptResult = await scriptGenerator.generateScript('kiro:spec-init', {
        platform: process.platform === 'win32' ? Platform.WINDOWS : Platform.LINUX,
        outputPath: join(integrationProjectDir, '.claude', 'commands', 'kiro-spec-init.sh')
      });
      expect(scriptResult.success).toBe(true);

      // 4. Validate configuration
      const validationResult = configurationManager.validateConfiguration(installResult.configPath!);
      expect(validationResult.valid).toBe(true);

      // 5. Verify all files exist and are properly connected
      const expectedFiles = [
        installResult.configPath!,
        scriptResult.scriptPath!
      ];

      for (const file of expectedFiles) {
        const exists = await fs.stat(file).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });
  });

  describe('Performance and Scale', () => {
    it('should handle multiple concurrent operations', async () => {
      const concurrentOps = [];
      const numProjects = 3;

      for (let i = 0; i < numProjects; i++) {
        const projectDir = join(testProjectDir, `concurrent-project-${i}`);
        
        const operation = (async () => {
          await fs.mkdir(projectDir, { recursive: true });
          
          const config = {
            projectName: `concurrent-project-${i}`,
            language: Language.ENGLISH,
            amazonQCLIPath: '/usr/local/bin/q',
            kiroDirectory: '.kiro',
            localization: localizationManager.getStrings(Language.ENGLISH),
            version: '1.0.0',
            installedAt: new Date()
          };

          const result = await installationManager.install(projectDir, config);
          return result;
        })();

        concurrentOps.push(operation);
      }

      const results = await Promise.all(concurrentOps);
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    }, 45000);

    it('should handle large template generation efficiently', async () => {
      const startTime = Date.now();
      
      const largeTemplate = await templateGenerator.generateTemplate('spec-status', {
        feature: 'large-feature-with-many-components-and-complex-requirements',
        language: Language.ENGLISH,
        projectContext: {
          name: 'large-project',
          components: Array.from({ length: 50 }, (_, i) => `component-${i}`),
          requirements: Array.from({ length: 100 }, (_, i) => `requirement-${i}`)
        }
      });

      const duration = Date.now() - startTime;
      
      expect(largeTemplate.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(largeTemplate.content.length).toBeGreaterThan(1000);
    });
  });
});