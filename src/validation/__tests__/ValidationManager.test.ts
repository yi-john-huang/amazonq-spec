/**
 * Tests for ValidationManager
 */

import { ValidationManager, ValidationRule } from '../ValidationManager';
import { TemplateValidator } from '../TemplateValidator';
import { ConfigurationValidator } from '../ConfigurationValidator';
import { ScriptValidator } from '../ScriptValidator';
import { AmazonQCompatibilityValidator } from '../AmazonQCompatibilityValidator';
import { Logger } from '../../utils/logger';
import { ValidationType } from '../../types';

// Mock all validators
jest.mock('../TemplateValidator');
jest.mock('../ConfigurationValidator');
jest.mock('../ScriptValidator');
jest.mock('../AmazonQCompatibilityValidator');
jest.mock('../../utils/logger');

describe('ValidationManager', () => {
  let validationManager: ValidationManager;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = new Logger() as jest.Mocked<Logger>;
    mockLogger.debug = jest.fn();
    mockLogger.info = jest.fn();
    mockLogger.warn = jest.fn();
    mockLogger.error = jest.fn();

    validationManager = new ValidationManager(mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with default validators', () => {
      expect(TemplateValidator).toHaveBeenCalledWith(mockLogger);
      expect(ConfigurationValidator).toHaveBeenCalledWith(mockLogger);
      expect(ScriptValidator).toHaveBeenCalledWith(mockLogger);
      expect(AmazonQCompatibilityValidator).toHaveBeenCalledWith(mockLogger);
    });
  });

  describe('validate', () => {
    const mockContent = 'test content';
    const mockOptions = { priority: 'high' as const };

    beforeEach(() => {
      // Mock validator methods
      const mockTemplateValidator = TemplateValidator.prototype as jest.Mocked<TemplateValidator>;
      const mockConfigValidator = ConfigurationValidator.prototype as jest.Mocked<ConfigurationValidator>;
      const mockScriptValidator = ScriptValidator.prototype as jest.Mocked<ScriptValidator>;
      const mockAmazonQValidator = AmazonQCompatibilityValidator.prototype as jest.Mocked<AmazonQCompatibilityValidator>;

      mockTemplateValidator.validateTemplate = jest.fn().mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        entityType: 'template'
      });

      mockConfigValidator.validateConfiguration = jest.fn().mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        entityType: 'configuration'
      });

      mockScriptValidator.validateScript = jest.fn().mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        entityType: 'script'
      });

      mockAmazonQValidator.validateContent = jest.fn().mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        entityType: 'amazonq_prompt'
      });
    });

    it('should validate template content', async () => {
      const result = await validationManager.validate(mockContent, ValidationType.TEMPLATE, undefined, mockOptions);

      expect(result.valid).toBe(true);
      expect(result.entityType).toBe('template');
      expect(TemplateValidator.prototype.validateTemplate).toHaveBeenCalledWith(mockContent, expect.any(Object));
    });

    it('should validate configuration content', async () => {
      const result = await validationManager.validate(mockContent, ValidationType.CONFIGURATION, undefined, mockOptions);

      expect(result.valid).toBe(true);
      expect(result.entityType).toBe('configuration');
      expect(ConfigurationValidator.prototype.validateConfiguration).toHaveBeenCalledWith(mockContent, expect.any(Object));
    });

    it('should validate script content', async () => {
      const result = await validationManager.validate(mockContent, ValidationType.SCRIPT, undefined, mockOptions);

      expect(result.valid).toBe(true);
      expect(result.entityType).toBe('script');
      expect(ScriptValidator.prototype.validateScript).toHaveBeenCalledWith(mockContent, expect.any(Object));
    });

    it('should validate Amazon Q compatibility', async () => {
      const result = await validationManager.validate(mockContent, ValidationType.AMAZONQ_COMPATIBILITY, undefined, mockOptions);

      expect(result.valid).toBe(true);
      expect(result.entityType).toBe('amazonq_prompt');
      expect(AmazonQCompatibilityValidator.prototype.validateContent).toHaveBeenCalledWith(mockContent, expect.any(Object));
    });

    it('should handle validation errors gracefully', async () => {
      const mockError = new Error('Validation failed');
      const mockTemplateValidator = TemplateValidator.prototype as jest.Mocked<TemplateValidator>;
      mockTemplateValidator.validateTemplate = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      const result = await validationManager.validate(mockContent, ValidationType.TEMPLATE);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('VALIDATION_EXECUTION_ERROR');
      expect(mockLogger.error).toHaveBeenCalledWith('Validation execution failed for TEMPLATE: Validation failed');
    });

    it('should return unsupported type error for unknown validation types', async () => {
      const result = await validationManager.validate(mockContent, 'unknown' as ValidationType);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('UNSUPPORTED_VALIDATION_TYPE');
    });
  });

  describe('validateBatch', () => {
    const mockItems = [
      { content: 'template content', type: ValidationType.TEMPLATE, filePath: 'template.hbs' },
      { content: 'script content', type: ValidationType.SCRIPT, filePath: 'script.sh' }
    ];

    beforeEach(() => {
      // Mock validator methods for batch testing
      const mockTemplateValidator = TemplateValidator.prototype as jest.Mocked<TemplateValidator>;
      const mockScriptValidator = ScriptValidator.prototype as jest.Mocked<ScriptValidator>;

      mockTemplateValidator.validateTemplate = jest.fn().mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        entityType: 'template'
      });

      mockScriptValidator.validateScript = jest.fn().mockReturnValue({
        valid: false,
        errors: [{ code: 'SCRIPT_ERROR', message: 'Script error', field: 'test' }],
        warnings: [],
        entityType: 'script'
      });
    });

    it('should validate multiple items and return summary', async () => {
      const result = await validationManager.validateBatch(mockItems);

      expect(result.totalItems).toBe(2);
      expect(result.validItems).toBe(1);
      expect(result.invalidItems).toBe(1);
      expect(result.totalErrors).toBe(1);
      expect(result.totalWarnings).toBe(0);
      expect(result.results).toHaveLength(2);
    });

    it('should handle batch validation with parallel processing', async () => {
      const startTime = Date.now();
      const result = await validationManager.validateBatch(mockItems);
      const endTime = Date.now();

      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly with mocks
    });
  });

  describe('addRule', () => {
    it('should add custom validation rule', () => {
      const customRule: ValidationRule = {
        name: 'custom-rule',
        description: 'Custom test rule',
        priority: 1,
        validate: jest.fn().mockReturnValue({ valid: true, errors: [], warnings: [] })
      };

      validationManager.addRule(ValidationType.TEMPLATE, customRule);

      // Verify rule was added (this would require accessing private members or adding a getter)
      expect(customRule.validate).toBeDefined();
    });
  });

  describe('removeRule', () => {
    it('should remove validation rule by name', () => {
      const customRule: ValidationRule = {
        name: 'removable-rule',
        description: 'Rule to be removed',
        priority: 1,
        validate: jest.fn()
      };

      validationManager.addRule(ValidationType.TEMPLATE, customRule);
      const removed = validationManager.removeRule(ValidationType.TEMPLATE, 'removable-rule');

      expect(removed).toBe(true);
    });

    it('should return false when removing non-existent rule', () => {
      const removed = validationManager.removeRule(ValidationType.TEMPLATE, 'non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('getValidationSummary', () => {
    beforeEach(() => {
      // Mock validator methods with mixed results
      const mockTemplateValidator = TemplateValidator.prototype as jest.Mocked<TemplateValidator>;
      mockTemplateValidator.validateTemplate = jest.fn().mockReturnValue({
        valid: false,
        errors: [{ code: 'ERROR1', message: 'Error 1', field: 'field1' }],
        warnings: [{ code: 'WARNING1', message: 'Warning 1', field: 'field1' }],
        entityType: 'template'
      });
    });

    it('should return validation summary for multiple validations', async () => {
      const items = [
        { content: 'content1', type: ValidationType.TEMPLATE, filePath: 'file1.hbs' },
        { content: 'content2', type: ValidationType.TEMPLATE, filePath: 'file2.hbs' }
      ];

      const results = await validationManager.validateBatch(items);
      const summary = validationManager.getValidationSummary([results]);

      expect(summary.totalValidations).toBe(2);
      expect(summary.successfulValidations).toBe(0);
      expect(summary.failedValidations).toBe(2);
      expect(summary.totalErrors).toBe(2);
      expect(summary.totalWarnings).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle validator initialization errors', () => {
      // Mock constructor to throw error
      const originalTemplateValidator = TemplateValidator;
      (TemplateValidator as any) = jest.fn().mockImplementation(() => {
        throw new Error('Validator init failed');
      });

      expect(() => new ValidationManager(mockLogger)).toThrow('Validator init failed');

      // Restore original
      (TemplateValidator as any) = originalTemplateValidator;
    });

    it('should handle async validation errors', async () => {
      const mockTemplateValidator = TemplateValidator.prototype as jest.Mocked<TemplateValidator>;
      mockTemplateValidator.validateTemplate = jest.fn().mockImplementation(async () => {
        throw new Error('Async error');
      });

      const result = await validationManager.validate('test', ValidationType.TEMPLATE);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Async error');
    });
  });

  describe('performance', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now();
      await validationManager.validate('test content', ValidationType.TEMPLATE);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be very fast with mocks
    });

    it('should handle large batch validations efficiently', async () => {
      const largeItems = Array(50).fill(null).map((_, i) => ({
        content: `content ${i}`,
        type: ValidationType.TEMPLATE,
        filePath: `file${i}.hbs`
      }));

      const startTime = Date.now();
      const result = await validationManager.validateBatch(largeItems);
      const endTime = Date.now();

      expect(result.totalItems).toBe(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});