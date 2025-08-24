/**
 * Configuration Validator Utility
 * 
 * Provides validation and syntax checking for AMAZONQ.md configuration files
 */

// cSpell:ignore amazonq AMAZONQ

import { readFileSync, existsSync } from 'fs';
import { ValidationResult, ValidationError, ValidationWarning } from '../types';
import { Logger } from './logger';

export interface ConfigValidationOptions {
  strict?: boolean;
  checkSyntax?: boolean;
  checkStructure?: boolean;
  checkVariables?: boolean;
}

export class ConfigValidator {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Validate AMAZONQ.md configuration file
   */
  public validateConfigFile(
    configPath: string, 
    options: ConfigValidationOptions = {}
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Set default options
    const opts = {
      strict: false,
      checkSyntax: true,
      checkStructure: true,
      checkVariables: true,
      ...options
    };

    try {
      // Check file existence
      if (!existsSync(configPath)) {
        errors.push({
          code: 'CONFIG_FILE_NOT_FOUND',
          message: `Configuration file not found: ${configPath}`,
          field: 'configPath',
          actualValue: configPath
        });

        return {
          valid: false,
          errors,
          warnings,
          entityType: 'configuration'
        };
      }

      // Read file content
      const content = readFileSync(configPath, 'utf8');
      this.logger.debug(`Validating configuration file: ${configPath} (${content.length} characters)`);

      // Validate file structure
      if (opts.checkStructure) {
        this.validateStructure(content, errors, warnings, opts.strict);
      }

      // Validate syntax
      if (opts.checkSyntax) {
        this.validateSyntax(content, errors, warnings, opts.strict);
      }

      // Validate template variables
      if (opts.checkVariables) {
        this.validateVariables(content, errors, warnings, opts.strict);
      }

      // Additional validations
      this.validateContent(content, errors, warnings, opts.strict);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        entityType: 'configuration',
        metadata: {
          fileSize: content.length,
          lineCount: content.split('\n').length,
          hasHandlebarsVariables: /\{\{[^}]+\}\}/.test(content),
          encoding: 'UTF-8'
        }
      };

    } catch (error) {
      errors.push({
        code: 'VALIDATION_EXCEPTION',
        message: `Failed to validate configuration: ${error instanceof Error ? error.message : String(error)}`,
        field: 'configPath',
        actualValue: configPath
      });

      return {
        valid: false,
        errors,
        warnings,
        entityType: 'configuration'
      };
    }
  }

  /**
   * Validate configuration file structure
   */
  private validateStructure(
    content: string, 
    errors: ValidationError[], 
    warnings: ValidationWarning[],
    strict: boolean
  ): void {
    const requiredSections = [
      '# .* - Amazon Q CLI Configuration',
      '## Project Context',
      '## SDD Workflow',
      '## Available Commands',
      '## Directory Structure',
      '## Development Guidelines'
    ];

    // Optional sections for reference
    // const optionalSections = [
    //   '## Integration Details',
    //   '## Localization', 
    //   '## Configuration Management',
    //   '## Support & Documentation'
    // ];

    // Check required sections
    for (const sectionPattern of requiredSections) {
      const regex = new RegExp(sectionPattern, 'i');
      if (!regex.test(content)) {
        const error: ValidationError = {
          code: 'MISSING_REQUIRED_SECTION',
          message: `Missing required section: ${sectionPattern}`,
          field: 'structure',
          expectedValue: sectionPattern
        };

        if (strict) {
          errors.push(error);
        } else {
          warnings.push({
            code: error.code,
            message: error.message,
            field: error.field,
            suggestion: `Add the required section to the configuration file`
          });
        }
      }
    }

    // Check section ordering
    const sectionHeaders = content.match(/^## .+$/gm) || [];
    if (sectionHeaders.length < 4) {
      warnings.push({
        code: 'INSUFFICIENT_SECTIONS',
        message: `Found only ${sectionHeaders.length} sections, recommended minimum is 6`,
        field: 'structure',
        suggestion: 'Add more detailed sections for better documentation'
      });
    }

    // Check for duplicate sections
    const sectionCounts = new Map<string, number>();
    sectionHeaders.forEach(header => {
      const normalizedHeader = header.trim(); // Normalize by trimming whitespace
      const count = sectionCounts.get(normalizedHeader) || 0;
      sectionCounts.set(normalizedHeader, count + 1);
      
      if (count > 0) {
        warnings.push({
          code: 'DUPLICATE_SECTION',
          message: `Duplicate section found: ${normalizedHeader}`,
          field: 'structure',
          suggestion: 'Merge duplicate sections or use subsections'
        });
      }
    });
  }

  /**
   * Validate markdown and template syntax
   */
  private validateSyntax(
    content: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    _strict: boolean
  ): void {
    // Check for unmatched Handlebars brackets
    const openBrackets = (content.match(/\{\{/g) || []).length;
    const closeBrackets = (content.match(/\}\}/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      errors.push({
        code: 'UNMATCHED_HANDLEBARS_BRACKETS',
        message: `Unmatched Handlebars brackets: ${openBrackets} opening, ${closeBrackets} closing`,
        field: 'syntax',
        actualValue: `${openBrackets}:${closeBrackets}`,
        expectedValue: 'equal counts'
      });
    }

    // Check for malformed Handlebars expressions (simplified check)
    // Look for incomplete expressions like {{{ or }}} or mismatched patterns
    const incompleteExpressions = content.match(/\{\{\{+|\}\}\}+/g);
    if (incompleteExpressions) {
      incompleteExpressions.forEach(expr => {
        errors.push({
          code: 'MALFORMED_HANDLEBARS_EXPRESSION',
          message: `Malformed Handlebars expression: ${expr}`,
          field: 'syntax',
          actualValue: expr
        });
      });
    }

    // Check for common markdown syntax issues
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for unmatched markdown links
      const openLinks = (line.match(/\[/g) || []).length;
      const closeLinks = (line.match(/\]/g) || []).length;
      // Note: Link parentheses validation could be added here if needed
      // const openParens = (line.match(/\(/g) || []).length;
      // const closeParens = (line.match(/\)/g) || []).length;

      if (openLinks !== closeLinks) {
        warnings.push({
          code: 'UNMATCHED_MARKDOWN_LINKS',
          message: `Line ${lineNumber}: Unmatched square brackets in markdown links`,
          field: 'syntax',
          suggestion: 'Check markdown link syntax'
        });
      }

      // Check for potential encoding issues
      if (/[^\x00-\x7F]/.test(line) && !/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(line)) {
        warnings.push({
          code: 'POTENTIAL_ENCODING_ISSUE',
          message: `Line ${lineNumber}: Contains non-ASCII characters that may cause encoding issues`,
          field: 'encoding',
          suggestion: 'Verify file is saved as UTF-8'
        });
      }
    });
  }

  /**
   * Validate Handlebars template variables
   */
  private validateVariables(
    content: string,
    _errors: ValidationError[],
    warnings: ValidationWarning[],
    _strict: boolean
  ): void {
    // Extract all Handlebars variables
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      const variable = match[1].trim();
      variables.add(variable);
    }

    // List of expected core variables
    const expectedVariables = [
      'PROJECT_NAME',
      'TIMESTAMP',
      'VERSION',
      'TECHNOLOGY_STACK',
      'ARCHITECTURE_TYPE',
      'AMAZON_Q_CLI_PATH',
      'KIRO_DIRECTORY',
      'LANGUAGE_NAME',
      'PLATFORM'
    ];

    // Check for missing core variables
    for (const expectedVar of expectedVariables) {
      if (!variables.has(expectedVar)) {
        warnings.push({
          code: 'MISSING_CORE_VARIABLE',
          message: `Missing expected core variable: {{${expectedVar}}}`,
          field: 'variables',
          suggestion: `Add {{${expectedVar}}} variable to the appropriate section`
        });
      }
    }

    // Check for potentially undefined variables
    const potentiallyUndefinedPatterns = [
      /\{\{#if\s+([^}]+)\}\}/g,
      /\{\{#each\s+([^}]+)\}\}/g
    ];

    potentiallyUndefinedPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const variable = match[1].trim();
        if (!variables.has(variable) && !expectedVariables.includes(variable)) {
          warnings.push({
            code: 'POTENTIALLY_UNDEFINED_VARIABLE',
            message: `Variable referenced in conditional but not defined: ${variable}`,
            field: 'variables',
            suggestion: `Ensure ${variable} is properly defined in template context`
          });
        }
      }
    });

    // Check for unused helper patterns
    const helperPatterns = [
      /#if\s+/g,
      /#each\s+/g,
      /#unless\s+/g
    ];

    helperPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        const helperName = pattern.source.replace(/[#\\s+]/g, '');
        warnings.push({
          code: 'HANDLEBARS_HELPER_USED',
          message: `Uses Handlebars helper: ${helperName}`,
          field: 'variables',
          suggestion: 'Ensure helper is properly registered and data is provided'
        });
      }
    });
  }

  /**
   * Validate content quality and completeness
   */
  private validateContent(
    content: string,
    _errors: ValidationError[],
    warnings: ValidationWarning[],
    _strict: boolean
  ): void {
    // Check for Amazon Q CLI references
    if (!content.toLowerCase().includes('amazon q') && !content.toLowerCase().includes('amazonq')) {
      warnings.push({
        code: 'MISSING_AMAZONQ_REFERENCE',
        message: 'Configuration file does not mention Amazon Q CLI',
        field: 'content',
        suggestion: 'Add Amazon Q CLI integration information'
      });
    }

    // Check for SDD workflow references
    if (!content.toLowerCase().includes('sdd') && !content.toLowerCase().includes('spec-driven')) {
      warnings.push({
        code: 'MISSING_SDD_REFERENCE',
        message: 'Configuration file does not mention SDD workflow',
        field: 'content',
        suggestion: 'Add Spec-Driven Development workflow information'
      });
    }

    // Check for Kiro references
    if (!content.toLowerCase().includes('kiro')) {
      warnings.push({
        code: 'MISSING_KIRO_REFERENCE',
        message: 'Configuration file does not mention Kiro methodology',
        field: 'content',
        suggestion: 'Add Kiro-style development information'
      });
    }

    // Check content length
    if (content.length < 1000) {
      warnings.push({
        code: 'CONFIGURATION_TOO_SHORT',
        message: `Configuration file is quite short (${content.length} characters)`,
        field: 'content',
        suggestion: 'Consider adding more detailed documentation'
      });
    }

    // Check for placeholder text
    const placeholders = [
      'TODO',
      'FIXME',
      'XXX',
      '[placeholder]',
      '[to be filled]'
    ];

    placeholders.forEach(placeholder => {
      if (content.toLowerCase().includes(placeholder.toLowerCase())) {
        warnings.push({
          code: 'CONTAINS_PLACEHOLDER',
          message: `Contains placeholder text: ${placeholder}`,
          field: 'content',
          suggestion: 'Replace placeholder with actual content'
        });
      }
    });

    // Check for broken internal links
    const internalLinks = content.match(/\[([^\]]+)\]\(#([^)]+)\)/g);
    if (internalLinks) {
      internalLinks.forEach(link => {
        const match = link.match(/\[([^\]]+)\]\(#([^)]+)\)/);
        if (match) {
          const anchor = match[2];
          const anchorPattern = new RegExp(`## .*${anchor}`, 'i');
          if (!anchorPattern.test(content)) {
            warnings.push({
              code: 'BROKEN_INTERNAL_LINK',
              message: `Internal link points to non-existent anchor: ${anchor}`,
              field: 'content',
              suggestion: `Ensure section header exists for anchor: ${anchor}`
            });
          }
        }
      });
    }
  }
}