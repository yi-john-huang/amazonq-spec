/**
 * Configuration Validator
 * 
 * Specialized validation for AMAZONQ.md configuration files and project settings
 */

import { ValidationResult, ValidationError, ValidationWarning } from '../types';
import { Logger } from '../utils/logger';

export interface ConfigurationValidationOptions {
  /** Required configuration sections */
  requiredSections?: string[];
  /** Project type for context-specific validation */
  projectType?: 'node' | 'python' | 'java' | 'generic';
  /** Check for completeness */
  validateCompleteness?: boolean;
  /** Validate markdown syntax */
  validateMarkdown?: boolean;
  /** Check for deprecated settings */
  checkDeprecated?: boolean;
}

export interface ConfigurationAnalysis {
  /** Detected sections */
  sections: string[];
  /** Configuration variables found */
  variables: Record<string, any>;
  /** Markdown structure quality score */
  structureScore: number;
  /** Estimated completeness percentage */
  completeness: number;
  /** Project type detected */
  detectedProjectType?: string;
}

/**
 * Validates AMAZONQ.md configuration files and project settings
 */
export class ConfigurationValidator {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Validate configuration content
   */
  public validateConfiguration(
    content: string,
    options: ConfigurationValidationOptions = {}
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Basic structure validation
      this.validateBasicStructure(content, errors, warnings);

      // Section validation
      if (options.requiredSections) {
        this.validateRequiredSections(content, options.requiredSections, errors, warnings);
      }

      // Markdown syntax validation
      if (options.validateMarkdown) {
        this.validateMarkdownSyntax(content, errors, warnings);
      }

      // Project-specific validation
      if (options.projectType) {
        this.validateProjectType(content, options.projectType, errors, warnings);
      }

      // Completeness validation
      if (options.validateCompleteness) {
        this.validateCompleteness(content, errors, warnings);
      }

      // Check for deprecated settings
      if (options.checkDeprecated) {
        this.checkDeprecatedSettings(content, warnings);
      }

      // Content quality validation
      this.validateContentQuality(content, errors, warnings);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        entityType: 'configuration',
        metadata: this.analyzeConfiguration(content)
      };

    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'CONFIGURATION_VALIDATION_ERROR',
          message: `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`,
          field: 'configuration_validation'
        }],
        warnings: [],
        entityType: 'configuration'
      };
    }
  }

  /**
   * Analyze configuration structure and content
   */
  public analyzeConfiguration(content: string): ConfigurationAnalysis {
    const sections = this.extractSections(content);
    const variables = this.extractVariables(content);
    const structureScore = this.calculateStructureScore(content, sections);
    const completeness = this.calculateCompleteness(content, sections);
    const detectedProjectType = this.detectProjectType(content);

    return {
      sections,
      variables,
      structureScore,
      completeness,
      detectedProjectType
    };
  }

  /**
   * Extract sections from configuration
   */
  public extractSections(content: string): string[] {
    const sectionPattern = /^#+\s+(.+)$/gm;
    const sections: string[] = [];
    let match;

    while ((match = sectionPattern.exec(content)) !== null) {
      sections.push(match[1].trim());
    }

    return sections;
  }

  /**
   * Extract configuration variables
   */
  public extractVariables(content: string): Record<string, any> {
    const variables: Record<string, any> = {};
    
    // Extract key-value pairs
    const kvPattern = /^([A-Z_][A-Z0-9_]*)\s*[:=]\s*(.+)$/gm;
    let match;

    while ((match = kvPattern.exec(content)) !== null) {
      const key = match[1].trim();
      const value = match[2].trim();
      variables[key] = this.parseValue(value);
    }

    // Extract YAML frontmatter if present
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (yamlMatch) {
      try {
        // Simple YAML parsing for basic key-value pairs
        const yamlContent = yamlMatch[1];
        const yamlLines = yamlContent.split('\n');
        
        for (const line of yamlLines) {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            variables[key] = this.parseValue(value);
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to parse YAML frontmatter: ${error}`);
      }
    }

    return variables;
  }

  /**
   * Validate basic configuration structure
   */
  private validateBasicStructure(
    content: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for minimum content length
    if (content.length < 100) {
      warnings.push({
        code: 'CONFIGURATION_TOO_SHORT',
        message: 'Configuration file seems incomplete or too short',
        field: 'content_length',
        suggestion: 'Add more detailed configuration sections'
      });
    }

    // Check for at least one heading
    if (!content.includes('#')) {
      errors.push({
        code: 'NO_HEADINGS',
        message: 'Configuration file should have structured headings',
        field: 'structure',
        suggestion: 'Add markdown headings to organize content'
      });
    }

    // Check for project name mention
    const hasProjectName = /project|name/i.test(content);
    if (!hasProjectName) {
      warnings.push({
        code: 'MISSING_PROJECT_NAME',
        message: 'Configuration should mention project name or description',
        field: 'project_info',
        suggestion: 'Add project name and description sections'
      });
    }
  }

  /**
   * Validate required sections are present
   */
  private validateRequiredSections(
    content: string,
    requiredSections: string[],
    errors: ValidationError[],
    _warnings: ValidationWarning[]
  ): void {
    const sections = this.extractSections(content);
    const sectionLower = sections.map(s => s.toLowerCase());

    for (const required of requiredSections) {
      const requiredLower = required.toLowerCase();
      const found = sectionLower.some(section => 
        section.includes(requiredLower) || requiredLower.includes(section)
      );

      if (!found) {
        errors.push({
          code: 'MISSING_REQUIRED_SECTION',
          message: `Required section not found: ${required}`,
          field: 'required_sections',
          expectedValue: required,
          suggestion: `Add a section with heading: # ${required}`
        });
      }
    }
  }

  /**
   * Validate markdown syntax
   */
  private validateMarkdownSyntax(
    content: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for malformed links
    const malformedLinks = content.match(/\[([^\]]*)\]\([^)]*\s[^)]*\)/g);
    if (malformedLinks) {
      malformedLinks.forEach(link => {
        warnings.push({
          code: 'MALFORMED_LINK',
          message: `Malformed markdown link: ${link}`,
          field: 'markdown_syntax',
          actualValue: link,
          suggestion: 'Ensure links have proper syntax [text](url)'
        });
      });
    }

    // Check for incomplete code blocks
    const codeBlockCount = (content.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      errors.push({
        code: 'INCOMPLETE_CODE_BLOCKS',
        message: 'Unmatched code block markers',
        field: 'markdown_syntax',
        suggestion: 'Ensure all code blocks are properly closed with ```'
      });
    }

    // Check for missing alt text in images
    const imagesWithoutAlt = content.match(/!\[\]\([^)]+\)/g);
    if (imagesWithoutAlt) {
      imagesWithoutAlt.forEach(img => {
        warnings.push({
          code: 'MISSING_IMAGE_ALT_TEXT',
          message: `Image missing alt text: ${img}`,
          field: 'accessibility',
          suggestion: 'Add descriptive alt text for images'
        });
      });
    }
  }

  /**
   * Validate project-specific requirements
   */
  private validateProjectType(
    content: string,
    projectType: string,
    _errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const contentLower = content.toLowerCase();

    switch (projectType) {
      case 'node':
        if (!contentLower.includes('package.json') && !contentLower.includes('npm')) {
          warnings.push({
            code: 'NODE_PROJECT_INDICATORS_MISSING',
            message: 'Node.js project should reference package.json or npm',
            field: 'project_type',
            suggestion: 'Add information about package.json and dependencies'
          });
        }
        break;

      case 'python':
        if (!contentLower.includes('requirements.txt') && !contentLower.includes('pip') && !contentLower.includes('python')) {
          warnings.push({
            code: 'PYTHON_PROJECT_INDICATORS_MISSING',
            message: 'Python project should reference requirements.txt or pip',
            field: 'project_type',
            suggestion: 'Add information about Python dependencies and setup'
          });
        }
        break;

      case 'java':
        if (!contentLower.includes('maven') && !contentLower.includes('gradle') && !contentLower.includes('pom.xml')) {
          warnings.push({
            code: 'JAVA_PROJECT_INDICATORS_MISSING',
            message: 'Java project should reference Maven or Gradle',
            field: 'project_type',
            suggestion: 'Add information about build system and dependencies'
          });
        }
        break;
    }
  }

  /**
   * Validate configuration completeness
   */
  private validateCompleteness(
    content: string,
    _errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const expectedSections = [
      'project', 'description', 'setup', 'usage', 
      'development', 'testing', 'deployment'
    ];
    const sections = this.extractSections(content);
    const sectionLower = sections.map(s => s.toLowerCase());
    
    const missingCount = expectedSections.filter(expected => 
      !sectionLower.some(section => section.includes(expected))
    ).length;

    const completeness = ((expectedSections.length - missingCount) / expectedSections.length) * 100;

    if (completeness < 50) {
      warnings.push({
        code: 'CONFIGURATION_INCOMPLETE',
        message: `Configuration appears incomplete (${Math.round(completeness)}% complete)`,
        field: 'completeness',
        suggestion: 'Consider adding more detailed sections about project setup, usage, and development'
      });
    }
  }

  /**
   * Check for deprecated settings
   */
  private checkDeprecatedSettings(
    content: string,
    warnings: ValidationWarning[]
  ): void {
    const deprecatedPatterns = [
      { pattern: /node_modules_path/i, message: 'node_modules_path is deprecated, use standard Node.js resolution' },
      { pattern: /python_path/i, message: 'python_path setting is deprecated, use virtual environments' },
      { pattern: /legacy_mode/i, message: 'legacy_mode is deprecated and should be removed' }
    ];

    for (const { pattern, message } of deprecatedPatterns) {
      if (pattern.test(content)) {
        warnings.push({
          code: 'DEPRECATED_SETTING',
          message,
          field: 'deprecated_settings',
          suggestion: 'Update configuration to use current best practices'
        });
      }
    }
  }

  /**
   * Validate content quality
   */
  private validateContentQuality(
    content: string,
    _errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for placeholder text
    const placeholders = content.match(/\[TODO\]|\[PLACEHOLDER\]|\[TBD\]|\[FILL.*?\]/gi);
    if (placeholders) {
      placeholders.forEach(placeholder => {
        warnings.push({
          code: 'PLACEHOLDER_TEXT',
          message: `Placeholder text found: ${placeholder}`,
          field: 'content_quality',
          suggestion: 'Replace placeholder text with actual content'
        });
      });
    }

    // Check for very short sections
    const sections = content.split(/^#+\s+/gm);
    sections.forEach((section, index) => {
      if (index > 0 && section.trim().length < 50) {
        warnings.push({
          code: 'SHORT_SECTION',
          message: `Section ${index} is very short and may need more detail`,
          field: 'section_detail',
          suggestion: 'Add more comprehensive information to sections'
        });
      }
    });

    // Check for broken internal references
    const internalLinks = content.match(/\[([^\]]*)\]\(#([^)]*)\)/g);
    if (internalLinks) {
      internalLinks.forEach(link => {
        const match = link.match(/\[([^\]]*)\]\(#([^)]*)\)/);
        if (match) {
          const anchor = match[2].toLowerCase().replace(/\s+/g, '-');
          const hasAnchor = content.toLowerCase().includes(anchor) || 
                           this.extractSections(content).some(s => 
                             s.toLowerCase().replace(/\s+/g, '-').includes(anchor)
                           );
          
          if (!hasAnchor) {
            warnings.push({
              code: 'BROKEN_INTERNAL_LINK',
              message: `Internal link may be broken: ${link}`,
              field: 'internal_links',
              suggestion: 'Verify internal links point to existing sections'
            });
          }
        }
      });
    }
  }

  /**
   * Calculate structure quality score
   */
  private calculateStructureScore(content: string, sections: string[]): number {
    let score = 0;

    // Base score for having sections
    if (sections.length > 0) score += 20;

    // Score for section hierarchy
    const hasH1 = /^# /gm.test(content);
    const hasH2 = /^## /gm.test(content);
    const hasH3 = /^### /gm.test(content);
    
    if (hasH1) score += 20;
    if (hasH2) score += 15;
    if (hasH3) score += 10;

    // Score for lists and structure
    if (content.includes('- ') || content.includes('* ')) score += 15;
    if (content.includes('1. ') || /^\d+\./gm.test(content)) score += 15;

    // Score for code blocks
    if (content.includes('```')) score += 10;

    // Score for links
    if (/\[([^\]]*)\]\(([^)]*)\)/.test(content)) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Calculate completeness percentage
   */
  private calculateCompleteness(content: string, sections: string[]): number {
    const expectedElements = [
      { check: () => content.length > 500, weight: 10 },
      { check: () => sections.length >= 3, weight: 15 },
      { check: () => content.includes('```'), weight: 10 },
      { check: () => /setup|install/i.test(content), weight: 15 },
      { check: () => /usage|example/i.test(content), weight: 15 },
      { check: () => /test|testing/i.test(content), weight: 10 },
      { check: () => /development|dev/i.test(content), weight: 10 },
      { check: () => /\[([^\]]*)\]\(([^)]*)\)/.test(content), weight: 5 },
      { check: () => !content.includes('[TODO]') && !content.includes('[TBD]'), weight: 10 }
    ];

    const totalWeight = expectedElements.reduce((sum, elem) => sum + elem.weight, 0);
    const achievedWeight = expectedElements
      .filter(elem => elem.check())
      .reduce((sum, elem) => sum + elem.weight, 0);

    return Math.round((achievedWeight / totalWeight) * 100);
  }

  /**
   * Detect project type from content
   */
  private detectProjectType(content: string): string | undefined {
    const contentLower = content.toLowerCase();

    if (contentLower.includes('package.json') || contentLower.includes('npm') || contentLower.includes('node.js')) {
      return 'node';
    }
    if (contentLower.includes('requirements.txt') || contentLower.includes('pip') || contentLower.includes('python')) {
      return 'python';
    }
    if (contentLower.includes('pom.xml') || contentLower.includes('maven') || contentLower.includes('gradle')) {
      return 'java';
    }
    if (contentLower.includes('cargo.toml') || contentLower.includes('rust')) {
      return 'rust';
    }
    if (contentLower.includes('go.mod') || contentLower.includes('golang')) {
      return 'go';
    }

    return undefined;
  }

  /**
   * Parse string value to appropriate type
   */
  private parseValue(value: string): any {
    const trimmed = value.trim();
    
    // Remove quotes
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // Boolean values
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    // Numeric values
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    if (/^\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);

    // Arrays (simple comma-separated)
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(item => item.trim());
    }

    return trimmed;
  }
}