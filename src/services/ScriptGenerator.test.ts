/**
 * Tests for ScriptGenerator class
 */

import { ScriptGenerator } from './ScriptGenerator';
import { Logger } from '../utils/logger';
import { Language, Platform } from '../types';
import { TemplateGenerator } from './TemplateGenerator';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

describe('ScriptGenerator', () => {
  let generator: ScriptGenerator;
  let templateGenerator: TemplateGenerator;
  let logger: Logger;
  let testOutputDir: string;

  beforeEach(() => {
    logger = new Logger();
    logger.setLevel('error'); // Reduce noise in tests
    generator = new ScriptGenerator(logger);
    templateGenerator = new TemplateGenerator(logger);
    testOutputDir = join(__dirname, '..', '..', 'test-scripts');
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  describe('generateWrapperScripts', () => {
    it('should generate wrapper scripts for all platforms', async () => {
      // Generate test templates
      const templateDir = join(testOutputDir, 'templates');
      const templates = await templateGenerator.generatePromptTemplates(
        templateDir,
        Language.ENGLISH
      );

      // Generate test commands
      const commands = [
        {
          name: 'kiro-spec-init',
          description: 'Initialize a new feature specification',
          arguments: [{
            name: 'feature-description',
            type: 'string' as const,
            required: true,
            description: 'Description of the feature'
          }],
          templatePath: 'templates/kiro-spec-init.hbs',
          scriptTemplatePath: 'scripts/kiro-spec-init.sh',
          platforms: [Platform.MAC, Platform.LINUX, Platform.WINDOWS],
          requiresApproval: false
        }
      ];

      const scripts = await generator.generateWrapperScripts(
        commands,
        templates,
        testOutputDir,
        '/usr/local/bin/q'
      );

      // Should generate 3 scripts (one per platform)
      expect(scripts).toHaveLength(3);
      
      const macScript = scripts.find(s => s.platform === Platform.MAC);
      const linuxScript = scripts.find(s => s.platform === Platform.LINUX);
      const windowsScript = scripts.find(s => s.platform === Platform.WINDOWS);

      expect(macScript).toBeDefined();
      expect(linuxScript).toBeDefined();
      expect(windowsScript).toBeDefined();

      expect(macScript!.commandName).toBe('kiro-spec-init');
      expect(macScript!.executable).toBe(true);
      expect(macScript!.fileExtension).toBe('.sh');

      expect(windowsScript!.executable).toBe(false);
      expect(windowsScript!.fileExtension).toBe('.ps1');
    });

    it('should generate valid bash scripts for Unix platforms', async () => {
      const templateDir = join(testOutputDir, 'templates');
      const templates = await templateGenerator.generatePromptTemplates(
        templateDir,
        Language.ENGLISH
      );

      const commands = [{
        name: 'kiro-steering',
        description: 'Create steering documents',
        arguments: [],
        templatePath: 'templates/kiro-steering.hbs',
        scriptTemplatePath: 'scripts/kiro-steering.sh',
        platforms: [Platform.MAC],
        requiresApproval: false
      }];

      const scripts = await generator.generateWrapperScripts(
        commands,
        templates,
        testOutputDir,
        '/usr/local/bin/q'
      );

      const macScript = scripts.find(s => s.platform === Platform.MAC);
      expect(macScript!.scriptContent).toContain('#!/bin/bash');
      expect(macScript!.scriptContent).toContain('Amazon Q CLI');
      expect(macScript!.scriptContent).toContain('kiro-steering');
    });

    it('should generate valid PowerShell scripts for Windows', async () => {
      const templateDir = join(testOutputDir, 'templates');
      const templates = await templateGenerator.generatePromptTemplates(
        templateDir,
        Language.ENGLISH
      );

      const commands = [{
        name: 'kiro-steering',
        description: 'Create steering documents',
        arguments: [],
        templatePath: 'templates/kiro-steering.hbs',
        scriptTemplatePath: 'scripts/kiro-steering.ps1',
        platforms: [Platform.WINDOWS],
        requiresApproval: false
      }];

      const scripts = await generator.generateWrapperScripts(
        commands,
        templates,
        testOutputDir,
        'C:\\Program Files\\Amazon\\Q\\q.exe'
      );

      const windowsScript = scripts.find(s => s.platform === Platform.WINDOWS);
      expect(windowsScript!.scriptContent).toContain('#!/usr/bin/env powershell');
      expect(windowsScript!.scriptContent).toContain('Amazon Q CLI');
      expect(windowsScript!.scriptContent).toContain('kiro-steering');
    });
  });

  describe('createCommandAliases', () => {
    it('should create bash aliases for Unix platforms', () => {
      const commands = [{
        name: 'kiro-spec-init',
        description: 'Initialize spec',
        arguments: [],
        templatePath: 'templates/kiro-spec-init.hbs',
        scriptTemplatePath: 'scripts/kiro-spec-init.sh',
        platforms: [Platform.MAC],
        requiresApproval: false
      }];

      const aliasPath = join(testOutputDir, 'aliases.sh');
      const aliases = generator.createCommandAliases(
        commands,
        Platform.MAC,
        '/test/scripts',
        aliasPath
      );

      expect(aliases).toContain('alias kiro-spec-init=');
      expect(aliases).toContain('Amazon Q SDD commands loaded');
      expect(existsSync(aliasPath)).toBe(true);
    });

    it('should create PowerShell aliases for Windows', () => {
      const commands = [{
        name: 'kiro-spec-init',
        description: 'Initialize spec',
        arguments: [],
        templatePath: 'templates/kiro-spec-init.hbs',
        scriptTemplatePath: 'scripts/kiro-spec-init.ps1',
        platforms: [Platform.WINDOWS],
        requiresApproval: false
      }];

      const aliasPath = join(testOutputDir, 'aliases.ps1');
      const aliases = generator.createCommandAliases(
        commands,
        Platform.WINDOWS,
        'C:\\test\\scripts',
        aliasPath
      );

      expect(aliases).toContain('Set-Alias -Name "kiro-spec-init"');
      expect(aliases).toContain('Amazon Q SDD Command Aliases');
      expect(existsSync(aliasPath)).toBe(true);
    });
  });

  describe('validateScripts', () => {
    it('should validate script syntax and structure', () => {
      const validScript = {
        commandName: 'test-command',
        platform: Platform.MAC,
        scriptContent: '#!/bin/bash\necho "test-command"\necho "Amazon Q CLI"',
        executable: true,
        aliasName: 'test-command',
        fileExtension: '.sh' as const
      };

      const scripts = [validScript];
      const validation = generator.validateScripts(scripts);

      expect(validation.valid).toBe(true);
      expect(validation.entityType).toBe('script');
    });

    it('should detect missing shebang lines', () => {
      const invalidScript = {
        commandName: 'test-command',
        platform: Platform.MAC,
        scriptContent: 'echo "no shebang"',
        executable: true,
        aliasName: 'test-command',
        fileExtension: '.sh' as const
      };

      const validation = generator.validateScripts([invalidScript]);

      expect(validation.warnings.some(w => w.code === 'MISSING_SHEBANG')).toBe(true);
    });

    it('should detect missing Amazon Q CLI integration', () => {
      const scriptWithoutAmazonQ = {
        commandName: 'test-command',
        platform: Platform.MAC,
        scriptContent: '#!/bin/bash\necho "test-command"',
        executable: true,
        aliasName: 'test-command',
        fileExtension: '.sh' as const
      };

      const validation = generator.validateScripts([scriptWithoutAmazonQ]);

      expect(validation.warnings.some(w => w.code === 'MISSING_AMAZONQ_INTEGRATION')).toBe(true);
    });
  });

  describe('makeExecutable', () => {
    it('should return true for Windows (no chmod needed)', () => {
      const result = generator.makeExecutable('/test/path', Platform.WINDOWS);
      expect(result).toBe(true);
    });
  });
});