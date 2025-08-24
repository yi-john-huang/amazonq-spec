/**
 * Amazon Q CLI Compatibility Validator
 * 
 * Validates prompts and content for compatibility with Amazon Q CLI
 */

import { ValidationResult, ValidationError, ValidationWarning } from '../types';
import { Logger } from '../utils/logger';
import { AmazonQPrompt } from '../utils/amazonQCLI';

export interface AmazonQValidationOptions {
  /** Maximum prompt length */
  maxPromptLength?: number;
  /** Check for optimal prompt structure */
  checkStructure?: boolean;
  /** Validate context file references */
  validateContextFiles?: boolean;
  /** Check for Amazon Q best practices */
  checkBestPractices?: boolean;
  /** Validate metadata format */
  validateMetadata?: boolean;
  /** Check for rate limiting considerations */
  checkRateLimiting?: boolean;
}

export interface AmazonQAnalysis {
  /** Prompt length in characters */
  promptLength: number;
  /** Number of sections in prompt */
  sectionCount: number;
  /** Estimated tokens (rough calculation) */
  estimatedTokens: number;
  /** Context files referenced */
  contextFiles: number;
  /** Complexity score for Amazon Q processing */
  complexityScore: number;
  /** Quality score for prompt structure */
  qualityScore: number;
  /** Rate limiting risk level */
  rateLimitRisk: 'low' | 'medium' | 'high';
}

/**
 * Validates content for Amazon Q CLI compatibility and best practices
 */
export class AmazonQCompatibilityValidator {
  constructor(private logger: Logger) {
    this.logger.debug('AmazonQCompatibilityValidator initialized');
  }

  /**
   * Validate Amazon Q prompt compatibility
   */
  public validatePrompt(
    prompt: AmazonQPrompt,
    options: AmazonQValidationOptions = {}
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Content length validation
      this.validateContentLength(prompt.content, options, errors, warnings);

      // Structure validation
      if (options.checkStructure !== false) {
        this.validatePromptStructure(prompt.content, errors, warnings);
      }

      // Context files validation
      if (options.validateContextFiles && prompt.contextFiles) {
        this.validateContextFiles(prompt.contextFiles, errors, warnings);
      }

      // Metadata validation
      if (options.validateMetadata && prompt.metadata) {
        this.validateMetadata(prompt.metadata, errors, warnings);
      }

      // Best practices validation
      if (options.checkBestPractices !== false) {
        this.validateBestPractices(prompt, errors, warnings);
      }

      // Rate limiting considerations
      if (options.checkRateLimiting) {
        this.validateRateLimiting(prompt, errors, warnings);
      }

      // Amazon Q specific format validation
      this.validateAmazonQFormat(prompt, errors, warnings);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        entityType: 'amazonq_prompt',
        metadata: this.analyzePrompt(prompt)
      };

    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'AMAZONQ_VALIDATION_ERROR',
          message: `Amazon Q validation failed: ${error instanceof Error ? error.message : String(error)}`,
          field: 'amazonq_validation'
        }],
        warnings: [],
        entityType: 'amazonq_prompt'
      };
    }
  }

  /**
   * Validate plain text content for Amazon Q compatibility
   */
  public validateContent(
    content: string,
    options: AmazonQValidationOptions = {}
  ): ValidationResult {
    const prompt: AmazonQPrompt = { content };
    return this.validatePrompt(prompt, options);
  }

  /**
   * Analyze Amazon Q prompt characteristics
   */
  public analyzePrompt(prompt: AmazonQPrompt): AmazonQAnalysis {
    const promptLength = prompt.content.length;
    const sectionCount = this.countSections(prompt.content);
    const estimatedTokens = this.estimateTokens(prompt.content);
    const contextFiles = prompt.contextFiles ? prompt.contextFiles.length : 0;
    const complexityScore = this.calculateComplexityScore(prompt);
    const qualityScore = this.calculateQualityScore(prompt);
    const rateLimitRisk = this.assessRateLimitRisk(prompt);

    return {
      promptLength,
      sectionCount,
      estimatedTokens,
      contextFiles,
      complexityScore,
      qualityScore,
      rateLimitRisk
    };
  }

  /**
   * Validate content length for Amazon Q limits
   */
  private validateContentLength(
    content: string,
    options: AmazonQValidationOptions,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const maxLength = options.maxPromptLength || 32000; // Conservative limit
    const currentLength = content.length;

    if (currentLength > maxLength) {
      errors.push({
        code: 'PROMPT_TOO_LONG',
        message: `Prompt exceeds maximum length: ${currentLength} > ${maxLength}`,
        field: 'content_length',
        actualValue: currentLength.toString(),
        expectedValue: `<= ${maxLength}`,
        suggestion: 'Break prompt into smaller parts or reduce content'
      });
    }

    // Warning for approaching limit
    if (currentLength > maxLength * 0.8) {
      warnings.push({
        code: 'PROMPT_APPROACHING_LIMIT',
        message: `Prompt is approaching length limit (${currentLength}/${maxLength})`,
        field: 'content_length',
        suggestion: 'Consider optimizing prompt length'
      });
    }

    // Too short warning
    if (currentLength < 50) {
      warnings.push({
        code: 'PROMPT_TOO_SHORT',
        message: 'Prompt may be too short to be effective',
        field: 'content_length',
        suggestion: 'Provide more context and detail in the prompt'
      });
    }
  }

  /**
   * Validate prompt structure for Amazon Q effectiveness
   */
  private validatePromptStructure(
    content: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for clear sections
    const hasSections = /#+\s+\w+|===+\s*\w+/.test(content);
    if (!hasSections) {
      warnings.push({
        code: 'NO_CLEAR_SECTIONS',
        message: 'Prompt lacks clear section structure',
        field: 'structure',
        suggestion: 'Use markdown headers or dividers to organize content'
      });
    }

    // Check for context section
    const hasContext = /context|background|situation/i.test(content);
    if (!hasContext) {
      warnings.push({
        code: 'MISSING_CONTEXT_SECTION',
        message: 'Prompt should include context or background information',
        field: 'structure',
        suggestion: 'Add a context section to provide background'
      });
    }

    // Check for clear request/task section
    const hasRequest = /request|task|please|generate|create|help/i.test(content);
    if (!hasRequest) {
      warnings.push({
        code: 'UNCLEAR_REQUEST',
        message: 'Prompt should clearly state what is being requested',
        field: 'structure',
        suggestion: 'Add a clear request section stating what you want Amazon Q to do'
      });
    }

    // Check for examples if complex
    if (content.length > 1000 && !content.includes('example') && !content.includes('```')) {
      warnings.push({
        code: 'MISSING_EXAMPLES',
        message: 'Complex prompts benefit from examples',
        field: 'structure',
        suggestion: 'Consider adding examples to clarify expectations'
      });
    }
  }

  /**
   * Validate context files
   */
  private validateContextFiles(
    contextFiles: string[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (contextFiles.length > 10) {
      warnings.push({
        code: 'TOO_MANY_CONTEXT_FILES',
        message: `Large number of context files (${contextFiles.length})`,
        field: 'context_files',
        suggestion: 'Consider reducing context files to most relevant ones'
      });
    }

    // Check for file path patterns
    contextFiles.forEach(file => {
      if (!file.startsWith('/') && !file.includes('./') && !file.includes('\\')) {
        warnings.push({
          code: 'RELATIVE_CONTEXT_PATH',
          message: `Context file path may be relative: ${file}`,
          field: 'context_files',
          suggestion: 'Use absolute paths for context files'
        });
      }

      if (file.length > 500) {
        warnings.push({
          code: 'LONG_CONTEXT_PATH',
          message: `Very long context file path: ${file.substring(0, 50)}...`,
          field: 'context_files',
          suggestion: 'Verify context file path is correct'
        });
      }
    });
  }

  /**
   * Validate metadata format
   */
  private validateMetadata(
    metadata: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check required metadata fields
    if (!metadata.feature && !metadata.phase) {
      warnings.push({
        code: 'MISSING_METADATA_CONTEXT',
        message: 'Metadata should include feature and phase information',
        field: 'metadata',
        suggestion: 'Add feature and phase to metadata for better tracking'
      });
    }

    // Check project context
    if (!metadata.projectContext) {
      warnings.push({
        code: 'MISSING_PROJECT_CONTEXT',
        message: 'Metadata should include project context',
        field: 'metadata',
        suggestion: 'Add project context to metadata for better results'
      });
    }

    // Validate metadata structure
    if (typeof metadata !== 'object') {
      errors.push({
        code: 'INVALID_METADATA_FORMAT',
        message: 'Metadata must be an object',
        field: 'metadata',
        actualValue: typeof metadata
      });
    }
  }

  /**
   * Validate Amazon Q best practices
   */
  private validateBestPractices(
    prompt: AmazonQPrompt,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const content = prompt.content;

    // Check for specificity
    const vagueWords = ['some', 'many', 'various', 'several', 'different'];
    const vagueCount = vagueWords.filter(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(content)
    ).length;

    if (vagueCount > 3) {
      warnings.push({
        code: 'VAGUE_LANGUAGE',
        message: 'Prompt contains vague language that may reduce effectiveness',
        field: 'best_practices',
        suggestion: 'Be more specific in your requests and descriptions'
      });
    }

    // Check for actionable language
    const actionWords = ['create', 'generate', 'analyze', 'explain', 'implement', 'design'];
    const hasActionWords = actionWords.some(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(content)
    );

    if (!hasActionWords) {
      warnings.push({
        code: 'NO_CLEAR_ACTION',
        message: 'Prompt should include clear action words',
        field: 'best_practices',
        suggestion: 'Use action verbs to clearly state what you want Amazon Q to do'
      });
    }

    // Check for constraints and requirements
    const hasConstraints = /requirement|constraint|must|should|need to/i.test(content);
    if (content.length > 500 && !hasConstraints) {
      warnings.push({
        code: 'MISSING_CONSTRAINTS',
        message: 'Complex prompts should include constraints or requirements',
        field: 'best_practices',
        suggestion: 'Specify requirements, constraints, or success criteria'
      });
    }

    // Check for output format specification
    if (!content.includes('format') && !content.includes('structure') && !content.includes('markdown')) {
      warnings.push({
        code: 'NO_FORMAT_SPECIFICATION',
        message: 'Consider specifying desired output format',
        field: 'best_practices',
        suggestion: 'Specify the desired format for Amazon Q response'
      });
    }
  }

  /**
   * Validate rate limiting considerations
   */
  private validateRateLimiting(
    prompt: AmazonQPrompt,
    _errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const analysis = this.analyzePrompt(prompt);

    if (analysis.rateLimitRisk === 'high') {
      warnings.push({
        code: 'HIGH_RATE_LIMIT_RISK',
        message: 'Prompt characteristics may trigger rate limiting',
        field: 'rate_limiting',
        suggestion: 'Consider breaking into smaller requests or reducing complexity'
      });
    }

    if (analysis.estimatedTokens > 8000) {
      warnings.push({
        code: 'HIGH_TOKEN_COUNT',
        message: `High estimated token count: ${analysis.estimatedTokens}`,
        field: 'rate_limiting',
        suggestion: 'Large prompts may have higher latency and cost'
      });
    }
  }

  /**
   * Validate Amazon Q specific format requirements
   */
  private validateAmazonQFormat(
    prompt: AmazonQPrompt,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const content = prompt.content;

    // Check for unsupported characters
    const unsupportedChars = content.match(/[\x00-\x1F\x7F-\x9F]/g);
    if (unsupportedChars) {
      errors.push({
        code: 'UNSUPPORTED_CHARACTERS',
        message: 'Prompt contains unsupported control characters',
        field: 'format',
        suggestion: 'Remove or replace control characters'
      });
    }

    // Check for extremely long lines
    const lines = content.split('\n');
    const longLines = lines.filter(line => line.length > 1000);
    if (longLines.length > 0) {
      warnings.push({
        code: 'VERY_LONG_LINES',
        message: `${longLines.length} lines exceed 1000 characters`,
        field: 'format',
        suggestion: 'Break long lines for better readability'
      });
    }

    // Check for balanced markdown
    const codeBlocks = (content.match(/```/g) || []).length;
    if (codeBlocks % 2 !== 0) {
      errors.push({
        code: 'UNMATCHED_CODE_BLOCKS',
        message: 'Unmatched code block markers in prompt',
        field: 'format',
        suggestion: 'Ensure all code blocks are properly closed'
      });
    }
  }

  /**
   * Count sections in prompt
   */
  private countSections(content: string): number {
    const headerPattern = /^#+\s+.+$/gm;
    const dividerPattern = /^=+\s*\w+/gm;
    const headers = (content.match(headerPattern) || []).length;
    const dividers = (content.match(dividerPattern) || []).length;
    return headers + dividers;
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(content: string): number {
    // Rough estimation: ~4 characters per token on average
    // This is a simplified calculation
    const words = content.split(/\s+/).length;
    const characters = content.length;
    
    // Use word count * 1.3 as token estimate (accounting for subword tokenization)
    const wordBasedEstimate = Math.ceil(words * 1.3);
    const charBasedEstimate = Math.ceil(characters / 4);
    
    // Return the higher estimate to be conservative
    return Math.max(wordBasedEstimate, charBasedEstimate);
  }

  /**
   * Calculate complexity score for Amazon Q processing
   */
  private calculateComplexityScore(prompt: AmazonQPrompt): number {
    let score = 0;
    const content = prompt.content;

    // Base complexity from length
    score += Math.min(content.length / 1000, 5);

    // Complexity from structure
    score += this.countSections(content) * 0.5;

    // Complexity from context files
    if (prompt.contextFiles) {
      score += prompt.contextFiles.length * 0.3;
    }

    // Complexity from code blocks
    const codeBlocks = (content.match(/```/g) || []).length / 2;
    score += codeBlocks * 0.5;

    // Complexity from technical terms
    const technicalTerms = content.match(/\b(API|database|algorithm|framework|architecture|implementation)\b/gi) || [];
    score += technicalTerms.length * 0.1;

    // Complexity from nested structure
    const nestedPatterns = (content.match(/^\s{2,}-|\s{4,}\w/gm) || []).length;
    score += nestedPatterns * 0.1;

    return Math.min(Math.round(score), 10);
  }

  /**
   * Calculate quality score for prompt structure
   */
  private calculateQualityScore(prompt: AmazonQPrompt): number {
    let score = 0;
    const content = prompt.content;

    // Points for clear structure
    if (/#+\s+\w+|===+\s*\w+/.test(content)) score += 20;

    // Points for context
    if (/context|background|situation/i.test(content)) score += 15;

    // Points for clear request
    if (/request|task|please|generate|create|help/i.test(content)) score += 15;

    // Points for examples
    if (content.includes('example') || content.includes('```')) score += 10;

    // Points for specificity
    const specificWords = ['specific', 'detailed', 'comprehensive', 'exactly'];
    if (specificWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(content))) {
      score += 10;
    }

    // Points for good length (not too short, not too long)
    if (content.length >= 200 && content.length <= 2000) score += 10;

    // Points for metadata
    if (prompt.metadata) score += 10;

    // Points for proper formatting
    if (!content.match(/[\x00-\x1F\x7F-\x9F]/g)) score += 5;

    // Points for balanced code blocks
    const codeBlocks = (content.match(/```/g) || []).length;
    if (codeBlocks === 0 || codeBlocks % 2 === 0) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Assess rate limiting risk
   */
  private assessRateLimitRisk(prompt: AmazonQPrompt): 'low' | 'medium' | 'high' {
    const analysis = {
      promptLength: prompt.content.length,
      sectionCount: this.countSections(prompt.content),
      estimatedTokens: this.estimateTokens(prompt.content),
      contextFiles: prompt.contextFiles ? prompt.contextFiles.length : 0,
      complexityScore: this.calculateComplexityScore(prompt)
    };

    let riskScore = 0;

    // Length risk
    if (analysis.promptLength > 10000) riskScore += 2;
    else if (analysis.promptLength > 5000) riskScore += 1;

    // Token risk
    if (analysis.estimatedTokens > 8000) riskScore += 2;
    else if (analysis.estimatedTokens > 4000) riskScore += 1;

    // Context files risk
    if (analysis.contextFiles > 5) riskScore += 1;
    if (analysis.contextFiles > 10) riskScore += 1;

    // Complexity risk
    if (analysis.complexityScore > 7) riskScore += 1;
    if (analysis.complexityScore > 9) riskScore += 1;

    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }
}