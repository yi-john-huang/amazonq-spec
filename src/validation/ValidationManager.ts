/**
 * Comprehensive Validation System
 * 
 * Provides validation services for templates, configurations, scripts,
 * Amazon Q CLI compatibility, and installation completeness
 */

import { Logger } from '../utils/logger';
import { ValidationResult, ValidationError, ValidationWarning, ValidationType } from '../types';
import { TemplateValidator } from './TemplateValidator';
import { ConfigurationValidator } from './ConfigurationValidator';
import { ScriptValidator } from './ScriptValidator';
import { AmazonQCompatibilityValidator } from './AmazonQCompatibilityValidator';

export interface ValidationOptions {
  /** Enable strict validation mode */
  strict?: boolean;
  /** Validation priority */
  priority?: 'low' | 'medium' | 'high';
  /** Custom validation rules */
  customRules?: ValidationRule[];
  /** Validation context */
  context?: Record<string, any>;
}

export interface ValidationRule {
  /** Rule identifier */
  name: string;
  /** Rule description */
  description: string;
  /** Rule priority (1-10, higher = more important) */
  priority: number;
  /** Validation function */
  validate: (content: string, context?: Record<string, any>) => RuleExecutionResult;
}

export interface RuleExecutionResult {
  /** Whether rule passed */
  valid: boolean;
  /** Errors found */
  errors: ValidationError[];
  /** Warnings found */
  warnings: ValidationWarning[];
}

export interface ValidationSummary {
  /** Total items validated */
  totalItems: number;
  /** Successfully validated items */
  validItems: number;
  /** Failed validation items */
  invalidItems: number;
  /** Total validations performed */
  totalValidations: number;
  /** Successful validations */
  successfulValidations: number;
  /** Failed validations */
  failedValidations: number;
  /** Total errors found */
  totalErrors: number;
  /** Total warnings found */
  totalWarnings: number;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Individual validation results */
  results: ValidationResult[];
}

export interface ValidationMetrics {
  /** Performance metrics */
  averageExecutionTime: number;
  /** Rule execution counts */
  ruleExecutionCounts: Record<string, number>;
  /** Success rate percentage */
  successRate: number;
}

/**
 * Manages comprehensive validation across different file types and systems
 */
export class ValidationManager {
  private logger: Logger;
  private rules: Map<ValidationType, ValidationRule[]> = new Map();
  private templateValidator: TemplateValidator;
  private configurationValidator: ConfigurationValidator;
  private scriptValidator: ScriptValidator;
  private amazonQValidator: AmazonQCompatibilityValidator;

  constructor(logger: Logger) {
    this.logger = logger;
    
    // Initialize specialized validators
    this.templateValidator = new TemplateValidator(logger);
    this.configurationValidator = new ConfigurationValidator(logger);
    this.scriptValidator = new ScriptValidator(logger);
    this.amazonQValidator = new AmazonQCompatibilityValidator(logger);
    
    this.initializeDefaultRules();
  }

  /**
   * Validate content based on type and options
   */
  public async validate(
    content: string,
    type: ValidationType,
    _filePath?: string,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    try {
      this.logger.debug(`Starting validation for type: ${type}`);
      
      switch (type) {
        case ValidationType.TEMPLATE:
          return this.templateValidator.validateTemplate(content, this.mapOptions(options));
          
        case ValidationType.CONFIGURATION:
          return this.configurationValidator.validateConfiguration(content, this.mapOptions(options));
          
        case ValidationType.SCRIPT:
          return this.scriptValidator.validateScript(content, this.mapOptions(options));
          
        case ValidationType.AMAZONQ_COMPATIBILITY:
          return this.amazonQValidator.validateContent(content, this.mapOptions(options));
          
        case ValidationType.INSTALLATION:
          return this.validateInstallation(content);
          
        default:
          return {
            valid: false,
            errors: [{
              code: 'UNSUPPORTED_VALIDATION_TYPE',
              message: `Validation type not supported: ${type}`,
              field: 'validation_type'
            }],
            warnings: [],
            entityType: 'template'
          };
      }
    } catch (error) {
      this.logger.error(`Validation execution failed for ${type}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        valid: false,
        errors: [{
          code: 'VALIDATION_EXECUTION_ERROR',
          message: `Validation execution failed: ${error instanceof Error ? error.message : String(error)}`,
          field: 'validation_execution'
        }],
        warnings: [],
        entityType: 'template'
      };
    }
  }

  /**
   * Validate multiple items in batch
   */
  public async validateBatch(
    items: Array<{content: string; type: ValidationType; filePath?: string}>,
    options: ValidationOptions = {}
  ): Promise<ValidationSummary> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];

    // Process all validations in parallel
    const validationPromises = items.map(item => 
      this.validate(item.content, item.type, item.filePath, options)
    );

    const validationResults = await Promise.all(validationPromises);
    results.push(...validationResults);

    const executionTime = Date.now() - startTime;
    const validItems = results.filter(r => r.valid).length;
    const invalidItems = results.filter(r => !r.valid).length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      totalItems: items.length,
      validItems,
      invalidItems,
      totalValidations: results.length,
      successfulValidations: validItems,
      failedValidations: invalidItems,
      totalErrors,
      totalWarnings,
      executionTime,
      results
    };
  }

  /**
   * Add custom validation rule
   */
  public addRule(type: ValidationType, rule: ValidationRule): void {
    if (!this.rules.has(type)) {
      this.rules.set(type, []);
    }
    this.rules.get(type)!.push(rule);
    this.logger.debug(`Added custom rule '${rule.name}' for type: ${type}`);
  }

  /**
   * Remove validation rule
   */
  public removeRule(type: ValidationType, ruleName: string): boolean {
    const rules = this.rules.get(type);
    if (!rules) return false;

    const initialLength = rules.length;
    const filtered = rules.filter(rule => rule.name !== ruleName);
    this.rules.set(type, filtered);

    const removed = filtered.length < initialLength;
    if (removed) {
      this.logger.debug(`Removed rule '${ruleName}' for type: ${type}`);
    }
    return removed;
  }

  /**
   * Get validation statistics
   */
  public getValidationStats(): Record<string, any> {
    return {
      availableValidationTypes: Object.values(ValidationType),
      customRulesCount: Array.from(this.rules.values()).reduce((sum, rules) => sum + rules.length, 0),
      validatorsInitialized: {
        template: !!this.templateValidator,
        configuration: !!this.configurationValidator,
        script: !!this.scriptValidator,
        amazonQCompatibility: !!this.amazonQValidator
      }
    };
  }

  /**
   * Get validation summary from multiple validation summaries
   */
  public getValidationSummary(summaries: ValidationSummary[]): ValidationSummary {
    const totalValidations = summaries.reduce((sum, s) => sum + s.totalValidations, 0);
    const successfulValidations = summaries.reduce((sum, s) => sum + s.successfulValidations, 0);
    const failedValidations = summaries.reduce((sum, s) => sum + s.failedValidations, 0);
    const totalErrors = summaries.reduce((sum, s) => sum + s.totalErrors, 0);
    const totalWarnings = summaries.reduce((sum, s) => sum + s.totalWarnings, 0);
    const totalItems = summaries.reduce((sum, s) => sum + s.totalItems, 0);
    const validItems = summaries.reduce((sum, s) => sum + s.validItems, 0);
    const invalidItems = summaries.reduce((sum, s) => sum + s.invalidItems, 0);
    const executionTime = summaries.reduce((sum, s) => sum + s.executionTime, 0);

    return {
      totalValidations,
      successfulValidations,
      failedValidations,
      totalErrors,
      totalWarnings,
      totalItems,
      validItems,
      invalidItems,
      executionTime,
      results: summaries.flatMap(s => s.results)
    };
  }

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    // Basic rules are handled by specialized validators
    // Custom rules can be added via addRule()
    this.logger.debug('Validation manager initialized with specialized validators');
  }

  /**
   * Map generic options to specific validator options
   */
  private mapOptions(options: ValidationOptions): any {
    return {
      strict: options.strict || false,
      priority: options.priority || 'medium',
      ...options.context
    };
  }

  /**
   * Validate installation completeness
   */
  private validateInstallation(content: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic installation validation
    if (!content || content.trim().length === 0) {
      errors.push({
        code: 'EMPTY_INSTALLATION_CONTENT',
        message: 'Installation content is empty',
        field: 'content'
      });
    }

    // Check for required installation markers
    const requiredMarkers = ['.kiro', 'AMAZONQ', 'spec-'];
    const hasMarkers = requiredMarkers.some(marker => content.includes(marker));
    
    if (!hasMarkers) {
      warnings.push({
        code: 'MISSING_INSTALLATION_MARKERS',
        message: 'Content does not appear to be installation-related',
        field: 'content',
        suggestion: 'Ensure content contains installation indicators'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      entityType: 'installation',
      metadata: {
        contentLength: content.length,
        hasInstallationMarkers: hasMarkers
      }
    };
  }
}