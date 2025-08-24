/**
 * Unit tests for type definitions and type guards
 */

import {
  Command,
  Template,
  Script,
  Config,
  InstallOptions,
  ValidationResult,
  Platform,
  Language,
  InstallationPhase,
  CommandType,
  ErrorType,
  AmazonQSDDError,
  isPlatform,
  isLanguage,
  isCommandType
} from './index';

describe('Type Guards', () => {
  describe('isPlatform', () => {
    it('should return true for valid platforms', () => {
      expect(isPlatform(Platform.MAC)).toBe(true);
      expect(isPlatform(Platform.WINDOWS)).toBe(true);
      expect(isPlatform(Platform.LINUX)).toBe(true);
      expect(isPlatform('mac')).toBe(true);
      expect(isPlatform('windows')).toBe(true);
      expect(isPlatform('linux')).toBe(true);
    });

    it('should return false for invalid platforms', () => {
      expect(isPlatform('unix')).toBe(false);
      expect(isPlatform('android')).toBe(false);
      expect(isPlatform(123)).toBe(false);
      expect(isPlatform(null)).toBe(false);
      expect(isPlatform(undefined)).toBe(false);
    });
  });

  describe('isLanguage', () => {
    it('should return true for valid languages', () => {
      expect(isLanguage(Language.ENGLISH)).toBe(true);
      expect(isLanguage(Language.JAPANESE)).toBe(true);
      expect(isLanguage(Language.CHINESE_TRADITIONAL)).toBe(true);
      expect(isLanguage('en')).toBe(true);
      expect(isLanguage('ja')).toBe(true);
      expect(isLanguage('zh-TW')).toBe(true);
    });

    it('should return false for invalid languages', () => {
      expect(isLanguage('fr')).toBe(false);
      expect(isLanguage('de')).toBe(false);
      expect(isLanguage('zh-CN')).toBe(false);
      expect(isLanguage(123)).toBe(false);
      expect(isLanguage(null)).toBe(false);
    });
  });

  describe('isCommandType', () => {
    it('should return true for valid command types', () => {
      expect(isCommandType(CommandType.SPEC_INIT)).toBe(true);
      expect(isCommandType(CommandType.SPEC_REQUIREMENTS)).toBe(true);
      expect(isCommandType(CommandType.STEERING)).toBe(true);
      expect(isCommandType('spec-init')).toBe(true);
      expect(isCommandType('steering-custom')).toBe(true);
    });

    it('should return false for invalid command types', () => {
      expect(isCommandType('spec-invalid')).toBe(false);
      expect(isCommandType('random-command')).toBe(false);
      expect(isCommandType(123)).toBe(false);
      expect(isCommandType(null)).toBe(false);
    });
  });
});

describe('AmazonQSDDError', () => {
  it('should create error with correct properties', () => {
    const error = new AmazonQSDDError(
      ErrorType.AMAZON_Q_NOT_FOUND,
      'Amazon Q CLI not found',
      { path: '/usr/local/bin/q' }
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AmazonQSDDError);
    expect(error.name).toBe('AmazonQSDDError');
    expect(error.type).toBe(ErrorType.AMAZON_Q_NOT_FOUND);
    expect(error.message).toBe('Amazon Q CLI not found');
    expect(error.details).toEqual({ path: '/usr/local/bin/q' });
  });

  it('should work without details', () => {
    const error = new AmazonQSDDError(
      ErrorType.VALIDATION_FAILED,
      'Validation failed'
    );

    expect(error.details).toBeUndefined();
  });
});

describe('Type Structures', () => {
  describe('Command interface', () => {
    it('should accept valid Command objects', () => {
      const command: Command = {
        name: 'spec-init',
        description: 'Initialize a new specification',
        arguments: [
          {
            name: 'description',
            type: 'string',
            required: true,
            description: 'Feature description'
          }
        ],
        templatePath: 'templates/spec-init.hbs',
        scriptTemplatePath: 'scripts/spec-init.sh',
        platforms: [Platform.MAC, Platform.LINUX],
        requiresApproval: false
      };

      expect(command.name).toBe('spec-init');
      expect(command.arguments).toHaveLength(1);
      expect(command.platforms).toContain(Platform.MAC);
    });
  });

  describe('Template interface', () => {
    it('should accept valid Template objects', () => {
      const template: Template = {
        id: 'spec-init-001',
        commandName: 'spec-init',
        promptText: 'Initialize a specification for: {{description}}',
        variables: [
          {
            name: 'FEATURE_NAME',
            type: 'string',
            required: true,
            defaultValue: 'unnamed-feature'
          }
        ],
        metadata: {
          amazonQVersion: '1.0.0',
          requiredFeatures: ['chat'],
          category: 'spec',
          tags: ['initialization', 'specification']
        },
        version: '1.0.0'
      };

      expect(template.id).toBe('spec-init-001');
      expect(template.variables).toHaveLength(1);
      expect(template.metadata.category).toBe('spec');
    });
  });

  describe('Script interface', () => {
    it('should accept valid Script objects', () => {
      const script: Script = {
        commandName: 'spec-init',
        platform: Platform.MAC,
        scriptContent: '#!/bin/bash\nq chat "$@"',
        executable: true,
        aliasName: 'kiro-spec-init',
        fileExtension: '.sh'
      };

      expect(script.commandName).toBe('spec-init');
      expect(script.platform).toBe(Platform.MAC);
      expect(script.executable).toBe(true);
    });
  });

  describe('Config interface', () => {
    it('should accept valid Config objects', () => {
      const config: Config = {
        projectName: 'test-project',
        language: Language.ENGLISH,
        amazonQCLIPath: '/usr/local/bin/q',
        kiroDirectory: '.kiro',
        localization: {
          messages: { welcome: 'Welcome' },
          errors: { notFound: 'Not found' },
          commands: { init: 'Initialize' },
          help: { usage: 'Usage information' }
        },
        version: '1.0.0',
        installedAt: new Date(),
        customSettings: { theme: 'dark' }
      };

      expect(config.projectName).toBe('test-project');
      expect(config.language).toBe(Language.ENGLISH);
      expect(config.customSettings?.theme).toBe('dark');
    });
  });

  describe('InstallOptions interface', () => {
    it('should accept valid InstallOptions objects', () => {
      const options: InstallOptions = {
        language: Language.JAPANESE,
        platform: Platform.WINDOWS,
        kiroDirectory: '.kiro-custom',
        dryRun: true,
        force: false,
        verbose: true,
        skipDetection: false
      };

      expect(options.language).toBe(Language.JAPANESE);
      expect(options.dryRun).toBe(true);
      expect(options.kiroDirectory).toBe('.kiro-custom');
    });

    it('should work with partial options', () => {
      const options: InstallOptions = {
        language: Language.ENGLISH
      };

      expect(options.language).toBe(Language.ENGLISH);
      expect(options.platform).toBeUndefined();
    });
  });

  describe('ValidationResult interface', () => {
    it('should accept valid ValidationResult objects', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          {
            code: 'INVALID_PATH',
            message: 'Path does not exist',
            field: 'amazonQCLIPath',
            actualValue: '/invalid/path',
            expectedValue: 'valid file path'
          }
        ],
        warnings: [
          {
            code: 'DEPRECATED_VERSION',
            message: 'Version is deprecated',
            field: 'version',
            suggestion: 'Update to latest version'
          }
        ],
        entityType: 'config',
        metadata: { timestamp: new Date() }
      };

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.entityType).toBe('config');
    });
  });
});

describe('Enum Values', () => {
  it('should have correct Platform enum values', () => {
    expect(Platform.MAC).toBe('mac');
    expect(Platform.WINDOWS).toBe('windows');
    expect(Platform.LINUX).toBe('linux');
  });

  it('should have correct Language enum values', () => {
    expect(Language.ENGLISH).toBe('en');
    expect(Language.JAPANESE).toBe('ja');
    expect(Language.CHINESE_TRADITIONAL).toBe('zh-TW');
  });

  it('should have correct CommandType enum values', () => {
    expect(CommandType.SPEC_INIT).toBe('spec-init');
    expect(CommandType.SPEC_REQUIREMENTS).toBe('spec-requirements');
    expect(CommandType.SPEC_DESIGN).toBe('spec-design');
    expect(CommandType.SPEC_TASKS).toBe('spec-tasks');
    expect(CommandType.SPEC_IMPL).toBe('spec-impl');
    expect(CommandType.SPEC_STATUS).toBe('spec-status');
    expect(CommandType.STEERING).toBe('steering');
    expect(CommandType.STEERING_CUSTOM).toBe('steering-custom');
  });

  it('should have correct InstallationPhase enum values', () => {
    expect(InstallationPhase.DETECTING).toBe('detecting');
    expect(InstallationPhase.VALIDATING).toBe('validating');
    expect(InstallationPhase.GENERATING).toBe('generating');
    expect(InstallationPhase.INSTALLING).toBe('installing');
    expect(InstallationPhase.CONFIGURING).toBe('configuring');
    expect(InstallationPhase.COMPLETED).toBe('completed');
    expect(InstallationPhase.FAILED).toBe('failed');
  });

  it('should have correct ErrorType enum values', () => {
    expect(ErrorType.AMAZON_Q_NOT_FOUND).toBe('AMAZON_Q_NOT_FOUND');
    expect(ErrorType.INVALID_PLATFORM).toBe('INVALID_PLATFORM');
    expect(ErrorType.TEMPLATE_GENERATION_FAILED).toBe('TEMPLATE_GENERATION_FAILED');
    expect(ErrorType.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
  });
});