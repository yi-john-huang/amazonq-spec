/**
 * Unit tests for InstallationManager
 */

import { InstallationManager } from '../InstallationManager';
import { Logger } from '../../utils/logger';
import { 
  InstallOptions, 
  Language, 
  Platform, 
  AmazonQSDDError, 
  ErrorType 
} from '../../types';
import { validateAmazonQCLI, AmazonQValidation } from '../../utils/platform-enhanced';
import * as fs from 'fs';
// Path is mocked inline

// Mock dependencies
jest.mock('../../utils/platform-enhanced');
jest.mock('../../utils/logger');
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn()
}));
jest.mock('path', () => ({
  resolve: jest.fn((...paths) => paths.join('/')),
  join: jest.fn((...paths) => paths.join('/'))
}));

describe('InstallationManager', () => {
  let installationManager: InstallationManager;
  let mockLogger: jest.Mocked<Logger>;
  let mockValidateAmazonQCLI: jest.MockedFunction<typeof validateAmazonQCLI>;

  const mockAmazonQValidation: AmazonQValidation = {
    isInstalled: true,
    path: '/usr/local/bin/q',
    version: '1.2.3',
    isAccessible: true,
    errors: []
  };

  const defaultOptions: InstallOptions = {
    language: Language.ENGLISH,
    platform: Platform.MAC,
    kiroDirectory: '.kiro',
    dryRun: false,
    force: false,
    verbose: false,
    skipDetection: false
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup logger mock
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      verbose: jest.fn()
    } as any;

    // Setup fs mocks with defaults
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('{"version": "0.1.0"}');

    // Setup platform validation mock
    mockValidateAmazonQCLI = validateAmazonQCLI as jest.MockedFunction<typeof validateAmazonQCLI>;
    mockValidateAmazonQCLI.mockResolvedValue(mockAmazonQValidation);

    // Create InstallationManager instance
    installationManager = new InstallationManager(mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with logger', () => {
      expect(installationManager).toBeInstanceOf(InstallationManager);
    });
  });

  describe('install', () => {

    it('should complete installation successfully', async () => {
      const result = await installationManager.install(defaultOptions);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.installedCommands).toEqual([
        'kiro-steering',
        'kiro-steering-custom', 
        'kiro-spec-init',
        'kiro-spec-requirements',
        'kiro-spec-design',
        'kiro-spec-tasks',
        'kiro-spec-status',
        'kiro-spec-implement'
      ]);
      expect(result.createdFiles).toContain('.kiro/config/AMAZONQ.md');
      expect(result.message).toBe('Installation completed successfully');
    });

    it('should handle dry run mode', async () => {
      const options = { ...defaultOptions, dryRun: true };
      const result = await installationManager.install(options);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Dry run mode - no actual files were created');
      expect(result.message).toBe('Dry run completed - no changes were made');
      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should skip Amazon Q CLI detection when requested', async () => {
      const options = { ...defaultOptions, skipDetection: true };
      const result = await installationManager.install(options);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Amazon Q CLI detection skipped - installation may not work properly');
      expect(mockValidateAmazonQCLI).not.toHaveBeenCalled();
    });

    it('should fail when Amazon Q CLI is not found', async () => {
      mockValidateAmazonQCLI.mockResolvedValue({
        isInstalled: false,
        path: null,
        version: null,
        isAccessible: false,
        errors: ['Command not found']
      });

      const result = await installationManager.install(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Amazon Q CLI not found. Please install it first.');
      expect(result.warnings).toContain('Install from: https://aws.amazon.com/q/developer/');
    });

    it('should create all required directories', async () => {
      await installationManager.install(defaultOptions);

      expect(fs.mkdirSync).toHaveBeenCalledWith('.kiro', { recursive: true });
      expect(fs.mkdirSync).toHaveBeenCalledWith('.kiro/steering', { recursive: true });
      expect(fs.mkdirSync).toHaveBeenCalledWith('.kiro/specs', { recursive: true });
      expect(fs.mkdirSync).toHaveBeenCalledWith('.kiro/templates', { recursive: true });
      expect(fs.mkdirSync).toHaveBeenCalledWith('.kiro/scripts', { recursive: true });
      expect(fs.mkdirSync).toHaveBeenCalledWith('.kiro/config', { recursive: true });
    });

    it('should create AMAZONQ.md configuration file', async () => {
      await installationManager.install(defaultOptions);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '.kiro/config/AMAZONQ.md',
        expect.stringContaining('# Amazon Q SDD Configuration'),
        'utf-8'
      );
    });

    it('should create .gitignore file when it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        return !path.toString().includes('.gitignore');
      });

      await installationManager.install(defaultOptions);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '.kiro/.gitignore',
        expect.stringContaining('# Amazon Q SDD - Generated files'),
        'utf-8'
      );
    });

    it('should not create .gitignore if it already exists', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        return path.toString().includes('.gitignore');
      });

      await installationManager.install(defaultOptions);

      const gitignoreCalls = (fs.writeFileSync as jest.Mock).mock.calls
        .filter(call => call[0].includes('.gitignore'));
      expect(gitignoreCalls).toHaveLength(0);
    });

    it('should handle custom kiro directory', async () => {
      const options = { ...defaultOptions, kiroDirectory: 'custom-dir' };
      await installationManager.install(options);

      expect(fs.mkdirSync).toHaveBeenCalledWith('custom-dir', { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'custom-dir/config/AMAZONQ.md',
        expect.any(String),
        'utf-8'
      );
    });

    it('should handle installation errors and perform rollback', async () => {
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await installationManager.install(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Installation failed');
      expect(result.errors).toContain('Unexpected error: Permission denied');
    });

    it('should handle AmazonQSDDError correctly', async () => {
      mockValidateAmazonQCLI.mockRejectedValue(
        new AmazonQSDDError(ErrorType.AMAZON_Q_NOT_FOUND, 'CLI detection failed')
      );

      const result = await installationManager.install(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to detect Amazon Q CLI');
    });
  });

  describe('detectAmazonQCLI', () => {
    it('should return validation result when CLI is found', async () => {
      const validation = await installationManager.detectAmazonQCLI();

      expect(validation).toEqual(mockAmazonQValidation);
      expect(mockValidateAmazonQCLI).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const errorValidation: AmazonQValidation = {
        isInstalled: false,
        path: null,
        version: null,
        isAccessible: false,
        errors: ['Command not found', 'PATH not configured']
      };
      mockValidateAmazonQCLI.mockResolvedValue(errorValidation);

      const validation = await installationManager.detectAmazonQCLI();

      expect(validation).toEqual(errorValidation);
      expect(mockLogger.verbose).toHaveBeenCalledWith('Amazon Q CLI not found');
      expect(mockLogger.verbose).toHaveBeenCalledWith('Detection errors:');
    });

    it('should throw AmazonQSDDError when validation throws', async () => {
      mockValidateAmazonQCLI.mockRejectedValue(new Error('Network error'));

      await expect(installationManager.detectAmazonQCLI()).rejects.toThrow(AmazonQSDDError);
    });
  });

  describe('createDirectoryStructure', () => {
    it('should create all required directories', async () => {
      // Reset mock to avoid interference from other tests
      (fs.mkdirSync as jest.Mock).mockClear();
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {}); // Reset implementation
      
      await installationManager.createDirectoryStructure(defaultOptions);

      const expectedDirectories = [
        '.kiro',
        '.kiro/steering',
        '.kiro/specs', 
        '.kiro/templates',
        '.kiro/scripts',
        '.kiro/config'
      ];

      expectedDirectories.forEach(dir => {
        expect(fs.mkdirSync).toHaveBeenCalledWith(dir, { recursive: true });
      });
    });

    it('should skip existing directories', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await installationManager.createDirectoryStructure(defaultOptions);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(mockLogger.verbose).toHaveBeenCalledWith(
        expect.stringContaining('Directory already exists')
      );
    });

    it('should handle dry run mode', async () => {
      const options = { ...defaultOptions, dryRun: true };
      await installationManager.createDirectoryStructure(options);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(mockLogger.verbose).toHaveBeenCalledWith(
        'Dry run: Would create directories:',
        expect.any(Array)
      );
    });
  });

  describe('generateConfigFiles', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.readFileSync as jest.Mock).mockReturnValue('{"version": "0.1.0"}');
    });

    it('should generate AMAZONQ.md with correct content', async () => {
      const files = await installationManager.generateConfigFiles(defaultOptions);

      expect(files).toContain('.kiro/config/AMAZONQ.md');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '.kiro/config/AMAZONQ.md',
        expect.stringContaining('# Amazon Q SDD Configuration'),
        'utf-8'
      );
    });

    it('should generate .gitignore when it does not exist', async () => {
      const files = await installationManager.generateConfigFiles(defaultOptions);

      expect(files).toContain('.kiro/.gitignore');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '.kiro/.gitignore',
        expect.stringContaining('# Amazon Q SDD - Generated files'),
        'utf-8'
      );
    });

    it('should handle dry run mode', async () => {
      const options = { ...defaultOptions, dryRun: true };
      const files = await installationManager.generateConfigFiles(options);

      expect(files).toContain('.kiro/config/AMAZONQ.md');
      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(mockLogger.verbose).toHaveBeenCalledWith(
        'Dry run: Would create file:',
        expect.any(String)
      );
    });

    it('should include language in configuration', async () => {
      const options = { ...defaultOptions, language: Language.JAPANESE };
      await installationManager.generateConfigFiles(options);

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls
        .find(call => call[0].includes('AMAZONQ.md'));
      expect(writeCall[1]).toContain('日本語');
    });

    it('should include custom directory in configuration', async () => {
      const options = { ...defaultOptions, kiroDirectory: 'custom-kiro' };
      await installationManager.generateConfigFiles(options);

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls
        .find(call => call[0].includes('AMAZONQ.md'));
      expect(writeCall[1]).toContain('custom-kiro/');
    });
  });

  describe('validate', () => {
    it('should return true for valid installation', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.includes('.kiro') || pathStr.includes('AMAZONQ.md');
      });

      const isValid = await installationManager.validate();

      expect(isValid).toBe(true);
      expect(mockValidateAmazonQCLI).toHaveBeenCalled();
    });

    it('should return false when .kiro directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        return !path.toString().includes('.kiro');
      });

      const isValid = await installationManager.validate();

      expect(isValid).toBe(false);
      expect(mockLogger.verbose).toHaveBeenCalledWith('No .kiro directory found');
    });

    it('should return false when AMAZONQ.md does not exist', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.includes('.kiro') && !pathStr.includes('AMAZONQ.md');
      });

      const isValid = await installationManager.validate();

      expect(isValid).toBe(false);
      expect(mockLogger.verbose).toHaveBeenCalledWith('No AMAZONQ.md configuration found');
    });

    it('should return false when Amazon Q CLI is not accessible', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockValidateAmazonQCLI.mockResolvedValue({
        isInstalled: false,
        path: null,
        version: null,
        isAccessible: false,
        errors: ['Command not found']
      });

      const isValid = await installationManager.validate();

      expect(isValid).toBe(false);
      expect(mockLogger.verbose).toHaveBeenCalledWith('Amazon Q CLI not accessible');
    });

    it('should return false and log error when validation throws', async () => {
      (fs.existsSync as jest.Mock).mockImplementation(() => {
        throw new Error('File system error');
      });

      const isValid = await installationManager.validate();

      expect(isValid).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Validation failed:', expect.any(Error));
    });
  });

  describe('private methods', () => {
    describe('getLanguageDisplay', () => {
      it('should return correct display names for supported languages', async () => {
        await installationManager.generateConfigFiles({
          ...defaultOptions,
          language: Language.CHINESE_TRADITIONAL
        });

        const writeCall = (fs.writeFileSync as jest.Mock).mock.calls
          .find(call => call[0].includes('AMAZONQ.md'));
        expect(writeCall[1]).toContain('繁體中文');
      });
    });

    describe('getPackageVersion', () => {
      it('should read version from package.json', async () => {
        (fs.readFileSync as jest.Mock).mockReturnValue('{"version": "1.2.3"}');

        await installationManager.generateConfigFiles(defaultOptions);

        const writeCall = (fs.writeFileSync as jest.Mock).mock.calls
          .find(call => call[0].includes('AMAZONQ.md'));
        expect(writeCall[1]).toContain('amazonq-sdd v1.2.3');
      });

      it('should fallback to 0.1.0 when package.json cannot be read', async () => {
        (fs.readFileSync as jest.Mock).mockImplementation(() => {
          throw new Error('File not found');
        });

        await installationManager.generateConfigFiles(defaultOptions);

        const writeCall = (fs.writeFileSync as jest.Mock).mock.calls
          .find(call => call[0].includes('AMAZONQ.md'));
        expect(writeCall[1]).toContain('amazonq-sdd v0.1.0');
      });
    });

    describe('generateGitignore', () => {
      it('should generate proper .gitignore content', async () => {
        await installationManager.generateConfigFiles(defaultOptions);

        const gitignoreCall = (fs.writeFileSync as jest.Mock).mock.calls
          .find(call => call[0].includes('.gitignore'));
        
        expect(gitignoreCall[1]).toContain('# Amazon Q SDD - Generated files');
        expect(gitignoreCall[1]).toContain('!steering/');
        expect(gitignoreCall[1]).toContain('*secret*');
      });
    });
  });

  describe('error scenarios', () => {
    it('should handle filesystem errors gracefully', async () => {
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const result = await installationManager.install(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Unexpected error: EACCES: permission denied');
    });

    it('should handle Amazon Q CLI validation errors', async () => {
      mockValidateAmazonQCLI.mockImplementation(() => {
        throw new AmazonQSDDError(ErrorType.AMAZON_Q_NOT_FOUND, 'CLI validation failed');
      });

      const result = await installationManager.install(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to detect Amazon Q CLI');
    });
  });

  describe('rollback functionality', () => {
    it('should prepare rollback actions during installation', async () => {
      // Clear logger to isolate this test
      (mockLogger.info as jest.Mock).mockClear();
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // Force an error after directory creation
      (fs.writeFileSync as jest.Mock).mockImplementation((path) => {
        if (path.toString().includes('AMAZONQ.md')) {
          throw new Error('Write failed');
        }
      });

      const result = await installationManager.install(defaultOptions);

      expect(result.success).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith('Performing rollback...');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined options gracefully', async () => {
      // Reset mocks for clean test
      (fs.writeFileSync as jest.Mock).mockClear();
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {}); // Reset to normal behavior
      
      const minimalOptions: InstallOptions = {
        skipDetection: true // Skip detection to avoid Amazon Q CLI requirement
      };
      
      const result = await installationManager.install(minimalOptions);

      if (!result.success) {
        console.log('Errors:', result.errors);
        console.log('Warnings:', result.warnings);
      }
      
      expect(result.success).toBe(true);
      expect(fs.mkdirSync).toHaveBeenCalledWith('.kiro', { recursive: true });
    });

    it('should handle non-English languages in configuration', async () => {
      // Reset mocks for clean test
      (fs.writeFileSync as jest.Mock).mockClear();
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {}); // Normal behavior
      
      const options = { ...defaultOptions, language: Language.JAPANESE };
      await installationManager.generateConfigFiles(options);

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls
        .find(call => call[0].includes('AMAZONQ.md'));
      expect(writeCall[1]).toContain('**Language**: 日本語');
    });

    it('should handle force option (though not currently implemented)', async () => {
      // Reset mocks for clean test
      (fs.writeFileSync as jest.Mock).mockClear();
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {}); // Normal behavior
      
      const options = { ...defaultOptions, force: true };
      const result = await installationManager.install(options);

      expect(result.success).toBe(true);
    });
  });
});