/**
 * Tests for ConfigurationManager class
 */

import { ConfigurationManager } from './ConfigurationManager';
import { Logger } from '../utils/logger';
import { Language, Config } from '../types';
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('ConfigurationManager', () => {
  let manager: ConfigurationManager;
  let logger: Logger;
  let testOutputDir: string;

  beforeEach(() => {
    logger = new Logger();
    logger.setLevel('error'); // Reduce noise in tests
    manager = new ConfigurationManager(logger);
    testOutputDir = join(__dirname, '..', '..', 'test-configs');
    
    // Ensure test directory exists
    if (!existsSync(testOutputDir)) {
      mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  describe('generateAmazonQConfig', () => {
    it('should generate AMAZONQ.md configuration file', () => {
      const config: Config = {
        projectName: 'Test Project',
        language: Language.ENGLISH,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: {
          messages: { language_name: 'English' },
          errors: {},
          commands: {},
          help: { development_guidelines: 'Test guidelines' }
        },
        version: '1.0.0',
        installedAt: new Date(),
        customSettings: {
          availableCommands: [
            { name: 'spec-init', description: 'Initialize specification' }
          ]
        }
      };

      const outputPath = join(testOutputDir, 'AMAZONQ.md');
      const result = manager.generateAmazonQConfig(outputPath, config);

      expect(result.path).toBe(outputPath);
      expect(result.content).toContain('Test Project - Amazon Q CLI Configuration');
      expect(result.content).toContain('/usr/local/bin/q');
      expect(result.content).toContain('.kiro');
      expect(existsSync(outputPath)).toBe(true);
    });

    it('should handle different languages', () => {
      const config: Config = {
        projectName: 'テストプロジェクト',
        language: Language.JAPANESE,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: {
          messages: { language_name: '日本語' },
          errors: {},
          commands: {},
          help: { development_guidelines: 'テストガイドライン' }
        },
        version: '1.0.0',
        installedAt: new Date()
      };

      const outputPath = join(testOutputDir, 'AMAZONQ.ja.md');
      const result = manager.generateAmazonQConfig(outputPath, config);

      expect(result.content).toContain('テストプロジェクト - Amazon Q CLI設定');
      expect(result.content).toContain('日本語');
      expect(result.content).toContain('テストガイドライン');
    });

    it('should create directory if it does not exist', () => {
      const config: Config = {
        projectName: 'Test Project',
        language: Language.ENGLISH,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: {
          messages: { language_name: 'English' },
          errors: {},
          commands: {},
          help: { development_guidelines: 'Test guidelines' }
        },
        version: '1.0.0',
        installedAt: new Date()
      };

      const nestedDir = join(testOutputDir, 'nested', 'path');
      const outputPath = join(nestedDir, 'AMAZONQ.md');
      
      manager.generateAmazonQConfig(outputPath, config);

      expect(existsSync(outputPath)).toBe(true);
    });
  });

  describe('handleLocalization', () => {
    it('should generate multiple localized configuration files', () => {
      const config: Config = {
        projectName: 'Multi-Language Project',
        language: Language.ENGLISH,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: {
          messages: { language_name: 'English' },
          errors: {},
          commands: {},
          help: { development_guidelines: 'Test guidelines' }
        },
        version: '1.0.0',
        installedAt: new Date()
      };

      const results = manager.handleLocalization(
        testOutputDir,
        config,
        [Language.ENGLISH, Language.JAPANESE]
      );

      expect(Object.keys(results)).toHaveLength(2);
      expect(results[Language.ENGLISH]).toContain('Multi-Language Project - Amazon Q CLI Configuration');
      expect(results[Language.JAPANESE]).toContain('Multi-Language Project - Amazon Q CLI設定');
      
      expect(existsSync(join(testOutputDir, 'AMAZONQ.md'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'AMAZONQ.ja.md'))).toBe(true);
    });

    it('should handle all supported languages', () => {
      const config: Config = {
        projectName: 'Full Localization Test',
        language: Language.ENGLISH,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: {
          messages: { language_name: 'English' },
          errors: {},
          commands: {},
          help: { development_guidelines: 'Test guidelines' }
        },
        version: '1.0.0',
        installedAt: new Date()
      };

      const results = manager.handleLocalization(testOutputDir, config);

      expect(Object.keys(results)).toHaveLength(3);
      expect(existsSync(join(testOutputDir, 'AMAZONQ.md'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'AMAZONQ.ja.md'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'AMAZONQ.zh-TW.md'))).toBe(true);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate a properly formatted configuration file', () => {
      const configContent = `# Test Project - Amazon Q CLI Configuration

## Project Context

This project uses Amazon Q CLI for Spec-Driven Development (SDD) workflow.

Amazon Q CLI Path: /usr/local/bin/q

## SDD Workflow

This project follows the Kiro-style Spec-Driven Development approach.

## Commands

The following SDD commands are available.
`;

      const configPath = join(testOutputDir, 'valid-config.md');
      writeFileSync(configPath, configContent, 'utf8');

      const validation = manager.validateConfiguration(configPath);

      expect(validation.valid).toBe(true);
      expect(validation.entityType).toBe('config');
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing configuration file', () => {
      const nonExistentPath = join(testOutputDir, 'does-not-exist.md');
      
      const validation = manager.validateConfiguration(nonExistentPath);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].code).toBe('CONFIG_FILE_NOT_FOUND');
    });

    it('should warn about missing required sections', () => {
      const incompleteConfig = `# Test Project - Amazon Q CLI Configuration

Some content but missing required sections.
`;

      const configPath = join(testOutputDir, 'incomplete-config.md');
      writeFileSync(configPath, incompleteConfig, 'utf8');

      const validation = manager.validateConfiguration(configPath);

      expect(validation.valid).toBe(true); // Warnings don't make it invalid
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.code === 'MISSING_SECTION')).toBe(true);
    });

    it('should warn about missing Amazon Q CLI integration', () => {
      const configWithoutAmazonQ = `# Test Project - Configuration

## Project Context
Regular project configuration

## SDD Workflow
Some workflow

## Commands
Some commands
`;

      const configPath = join(testOutputDir, 'no-amazonq-config.md');
      writeFileSync(configPath, configWithoutAmazonQ, 'utf8');

      const validation = manager.validateConfiguration(configPath);

      expect(validation.warnings.some(w => w.code === 'MISSING_AMAZONQ_INTEGRATION')).toBe(true);
    });

    it('should warn about missing kiro directory references', () => {
      const configWithoutKiro = `# Test Project - Amazon Q CLI Configuration

## Project Context
This project uses Amazon Q CLI

## SDD Workflow
Some workflow

## Commands
Some commands
`;

      const configPath = join(testOutputDir, 'no-kiro-config.md');
      writeFileSync(configPath, configWithoutKiro, 'utf8');

      const validation = manager.validateConfiguration(configPath);

      expect(validation.warnings.some(w => w.code === 'MISSING_KIRO_REFERENCE')).toBe(true);
    });
  });

  describe('backupConfiguration', () => {
    it('should create backup of existing configuration', () => {
      const originalContent = '# Original Configuration\n\nSome content here.';
      const configPath = join(testOutputDir, 'original-config.md');
      
      writeFileSync(configPath, originalContent, 'utf8');

      const backupPath = manager.backupConfiguration(configPath);

      expect(backupPath).toBeTruthy();
      expect(backupPath).toContain('.backup-');
      expect(existsSync(backupPath!)).toBe(true);
      
      const backupContent = readFileSync(backupPath!, 'utf8');
      expect(backupContent).toBe(originalContent);
    });

    it('should return null when no file exists to backup', () => {
      const nonExistentPath = join(testOutputDir, 'does-not-exist.md');
      
      const backupPath = manager.backupConfiguration(nonExistentPath);

      expect(backupPath).toBeNull();
    });
  });

  describe('restoreConfiguration', () => {
    it('should restore configuration from backup', () => {
      const backupContent = '# Backup Configuration\n\nBackup content here.';
      const backupPath = join(testOutputDir, 'backup-config.md');
      const targetPath = join(testOutputDir, 'restored-config.md');
      
      writeFileSync(backupPath, backupContent, 'utf8');

      const success = manager.restoreConfiguration(backupPath, targetPath);

      expect(success).toBe(true);
      expect(existsSync(targetPath)).toBe(true);
      
      const restoredContent = readFileSync(targetPath, 'utf8');
      expect(restoredContent).toBe(backupContent);
    });

    it('should return false when backup file does not exist', () => {
      const nonExistentBackup = join(testOutputDir, 'no-backup.md');
      const targetPath = join(testOutputDir, 'target.md');
      
      const success = manager.restoreConfiguration(nonExistentBackup, targetPath);

      expect(success).toBe(false);
    });
  });

  describe('updateConfiguration', () => {
    it('should update existing configuration with new settings', () => {
      const originalConfig = `# Old Project - Amazon Q CLI Configuration

Amazon Q CLI Path: /old/path

## Project Context
Old project info

## SDD Workflow
Old workflow

## Commands
Old commands
`;

      const configPath = join(testOutputDir, 'update-config.md');
      writeFileSync(configPath, originalConfig, 'utf8');

      const updates = {
        projectName: 'Updated Project',
        amazonQCLIPath: '/new/path/to/q'
      };

      const success = manager.updateConfiguration(configPath, updates);

      expect(success).toBe(true);
      
      const updatedContent = readFileSync(configPath, 'utf8');
      expect(updatedContent).toContain('Updated Project - Amazon Q CLI Configuration');
      expect(updatedContent).toContain('Amazon Q CLI Path: /new/path/to/q');
    });

    it('should create new configuration if none exists', () => {
      const newConfigPath = join(testOutputDir, 'new-config.md');
      
      const updates = {
        projectName: 'New Project',
        amazonQCLIPath: '/usr/local/bin/q',
        language: Language.ENGLISH as Language
      };

      const success = manager.updateConfiguration(newConfigPath, updates);

      expect(success).toBe(true);
      expect(existsSync(newConfigPath)).toBe(true);
      
      const content = readFileSync(newConfigPath, 'utf8');
      expect(content).toContain('New Project - Amazon Q CLI Configuration');
    });

    it('should handle kiro directory updates', () => {
      const originalConfig = `# Project - Amazon Q CLI Configuration

## Project Context
Uses .kiro/ directory structure

## Directory Structure
\`.kiro/specs/\` contains specifications
`;

      const configPath = join(testOutputDir, 'kiro-update-config.md');
      writeFileSync(configPath, originalConfig, 'utf8');

      const updates = {
        kiroDirectory: '.custom-kiro'
      };

      const success = manager.updateConfiguration(configPath, updates);

      expect(success).toBe(true);
      
      const updatedContent = readFileSync(configPath, 'utf8');
      expect(updatedContent).toContain('.custom-kiro/');
      expect(updatedContent).not.toContain('.kiro/');
    });
  });

  describe('private helper methods', () => {
    it('should handle Handlebars template compilation and caching', () => {
      const config: Config = {
        projectName: 'Cache Test Project',
        language: Language.ENGLISH,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: {
          messages: { language_name: 'English' },
          errors: {},
          commands: {},
          help: { development_guidelines: 'Test guidelines' }
        },
        version: '1.0.0',
        installedAt: new Date()
      };

      // Generate twice to test caching
      const outputPath1 = join(testOutputDir, 'cache-test-1.md');
      const outputPath2 = join(testOutputDir, 'cache-test-2.md');
      
      const result1 = manager.generateAmazonQConfig(outputPath1, config);
      const result2 = manager.generateAmazonQConfig(outputPath2, config);

      expect(result1.content).toContain('Cache Test Project');
      expect(result2.content).toContain('Cache Test Project');
      expect(existsSync(outputPath1)).toBe(true);
      expect(existsSync(outputPath2)).toBe(true);
    });

    it('should generate different content for different languages', () => {
      const baseConfig = {
        projectName: 'Multilingual Test',
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        version: '1.0.0',
        installedAt: new Date()
      };

      // Test English
      const englishConfig: Config = {
        ...baseConfig,
        language: Language.ENGLISH,
        localization: {
          messages: { language_name: 'English' },
          errors: {},
          commands: {},
          help: { development_guidelines: 'English guidelines' }
        }
      };

      // Test Japanese  
      const japaneseConfig: Config = {
        ...baseConfig,
        language: Language.JAPANESE,
        localization: {
          messages: { language_name: '日本語' },
          errors: {},
          commands: {},
          help: { development_guidelines: '日本語ガイドライン' }
        }
      };

      const englishPath = join(testOutputDir, 'english-test.md');
      const japanesePath = join(testOutputDir, 'japanese-test.md');
      
      const englishResult = manager.generateAmazonQConfig(englishPath, englishConfig);
      const japaneseResult = manager.generateAmazonQConfig(japanesePath, japaneseConfig);

      expect(englishResult.content).toContain('Amazon Q CLI Configuration');
      expect(japaneseResult.content).toContain('Amazon Q CLI設定');
      expect(englishResult.content).toContain('English');
      expect(japaneseResult.content).toContain('日本語');
    });
  });
});