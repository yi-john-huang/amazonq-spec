/**
 * TemplateGenerator - Generates Handlebars templates for Amazon Q CLI integration
 * Handles prompt template creation, adaptation, validation, and caching
 */

// cSpell:ignore amazonq QCLI kiro AMAZONQ

import Handlebars from 'handlebars';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { 
  Template, 
  Command, 
  ValidationResult,
  Language, 
  Platform
} from '../types';
import { Logger } from '../utils/logger';

export class TemplateGenerator {
  private logger: Logger;
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();
  private templateMetadata: Map<string, Template> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
    this.registerHandlebarsHelpers();
  }

  /**
   * Generate prompt templates for all 8 SDD commands
   */
  async generatePromptTemplates(
    outputDir: string, 
    language: Language = Language.ENGLISH
  ): Promise<Template[]> {
    this.logger.verbose('Generating prompt templates for all SDD commands');
    
    const templates: Template[] = [];
    const sddCommands = this.getSddCommands();

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    for (const command of sddCommands) {
      try {
        this.logger.verbose(`Generating template for: ${command.name}`);
        
        const template = await this.generateTemplate(command, language);
        const templatePath = join(outputDir, `${command.name}.hbs`);
        
        // Write template to file
        writeFileSync(templatePath, template.promptText, 'utf-8');
        
        templates.push(template);
        this.templateMetadata.set(command.name, template);
        
        this.logger.verbose(`Template generated: ${templatePath}`);
      } catch (error) {
        this.logger.error(`Failed to generate template for ${command.name}:`, error);
        throw error;
      }
    }

    this.logger.info(`Generated ${templates.length} prompt templates`);
    return templates;
  }

  /**
   * Adapt templates for Amazon Q CLI format
   */
  adaptForAmazonQCLI(template: Template): Template {
    this.logger.verbose(`Adapting template ${template.commandName} for Amazon Q CLI`);
    
    // Amazon Q CLI uses chat format - wrap prompts in structured format
    const adaptedContent = this.wrapForAmazonQChat(template.promptText, template.metadata);
    
    const adaptedTemplate: Template = {
      ...template,
      promptText: adaptedContent,
      metadata: {
        ...template.metadata,
        tags: [...template.metadata.tags, 'amazonq-compatible']
      }
    };

    this.logger.verbose(`Template adapted for Amazon Q CLI format`);
    return adaptedTemplate;
  }

  /**
   * Validate template with Amazon Q CLI compatibility checks
   */
  validateTemplate(template: Template): ValidationResult {
    this.logger.verbose(`Validating template: ${template.commandName}`);
    
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      entityType: 'template'
    };

    // Check template syntax
    try {
      Handlebars.compile(template.promptText);
      this.logger.verbose('Template compilation successful');
    } catch (error) {
      result.valid = false;
      result.errors.push({
        code: 'TEMPLATE_SYNTAX_ERROR',
        message: `Handlebars syntax error: ${error}`,
        field: 'promptText',
        actualValue: template.promptText.substring(0, 100) + '...',
        expectedValue: 'valid Handlebars template'
      });
    }

    // Check Amazon Q CLI compatibility
    if (!template.metadata.tags.includes('amazonq-compatible')) {
      result.warnings.push({
        code: 'NOT_AMAZONQ_ADAPTED',
        message: 'Template not yet adapted for Amazon Q CLI',
        field: 'metadata',
        suggestion: 'Run adaptForAmazonQCLI() to make compatible'
      });
    }

    // Check required variables
    const requiredVars = this.extractTemplateVariables(template.promptText);
    if (requiredVars.length === 0) {
      result.warnings.push({
        code: 'NO_VARIABLES',
        message: 'Template contains no variables - may be static',
        field: 'promptText',
        suggestion: 'Consider adding variables for customization'
      });
    }

    // Check content length for Amazon Q CLI limits
    if (template.promptText.length > 8000) {
      result.warnings.push({
        code: 'CONTENT_TOO_LONG',
        message: 'Template content may exceed Amazon Q CLI limits',
        field: 'promptText',
        suggestion: 'Consider breaking into smaller templates'
      });
    }

    this.logger.verbose(`Template validation ${result.valid ? 'passed' : 'failed'} with ${result.errors.length} errors, ${result.warnings.length} warnings`);
    return result;
  }

  /**
   * Compile template with caching for performance
   */
  compileTemplate(template: Template): Handlebars.TemplateDelegate {
    const cacheKey = `${template.commandName}-${template.version}`;
    
    if (this.templateCache.has(cacheKey)) {
      this.logger.verbose(`Using cached template: ${cacheKey}`);
      return this.templateCache.get(cacheKey)!;
    }

    try {
      this.logger.verbose(`Compiling template: ${cacheKey}`);
      const compiled = Handlebars.compile(template.promptText);
      this.templateCache.set(cacheKey, compiled);
      return compiled;
    } catch (error) {
      this.logger.error(`Failed to compile template ${template.commandName}:`, error);
      throw new Error(`Template compilation failed: ${error}`);
    }
  }

  /**
   * Render template with provided context
   */
  renderTemplate(template: Template, context: any): string {
    const compiled = this.compileTemplate(template);
    
    try {
      const rendered = compiled(context);
      this.logger.verbose(`Template rendered successfully: ${template.commandName}`);
      return rendered;
    } catch (error) {
      this.logger.error(`Failed to render template ${template.commandName}:`, error);
      throw new Error(`Template rendering failed: ${error}`);
    }
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
    this.logger.verbose('Template cache cleared');
  }

  /**
   * Get SDD command definitions
   */
  private getSddCommands(): Command[] {
    return [
      {
        name: 'kiro-steering',
        description: 'Create or update steering documents for project context',
        arguments: [],
        templatePath: 'templates/kiro-steering.hbs',
        scriptTemplatePath: 'scripts/kiro-steering.sh',
        platforms: [Platform.MAC, Platform.LINUX, Platform.WINDOWS],
        requiresApproval: false
      },
      {
        name: 'kiro-steering-custom',
        description: 'Create custom steering contexts for specialized workflows',
        arguments: [{
          name: 'context-name',
          type: 'string',
          required: true,
          description: 'Name of the custom steering context'
        }],
        templatePath: 'templates/kiro-steering-custom.hbs',
        scriptTemplatePath: 'scripts/kiro-steering-custom.sh',
        platforms: [Platform.MAC, Platform.LINUX, Platform.WINDOWS],
        requiresApproval: false
      },
      {
        name: 'kiro-spec-init',
        description: 'Initialize a new feature specification',
        arguments: [{
          name: 'feature-description',
          type: 'string',
          required: true,
          description: 'Description of the feature to implement'
        }],
        templatePath: 'templates/kiro-spec-init.hbs',
        scriptTemplatePath: 'scripts/kiro-spec-init.sh',
        platforms: [Platform.MAC, Platform.LINUX, Platform.WINDOWS],
        requiresApproval: false
      },
      {
        name: 'kiro-spec-requirements',
        description: 'Generate requirements document for a feature',
        arguments: [{
          name: 'feature-name',
          type: 'string',
          required: true,
          description: 'Name of the feature to generate requirements for'
        }],
        templatePath: 'templates/kiro-spec-requirements.hbs',
        scriptTemplatePath: 'scripts/kiro-spec-requirements.sh',
        platforms: [Platform.MAC, Platform.LINUX, Platform.WINDOWS],
        requiresApproval: false
      },
      {
        name: 'kiro-spec-design',
        description: 'Generate technical design document',
        arguments: [{
          name: 'feature-name',
          type: 'string',
          required: true,
          description: 'Name of the feature to generate design for'
        }],
        templatePath: 'templates/kiro-spec-design.hbs',
        scriptTemplatePath: 'scripts/kiro-spec-design.sh',
        platforms: [Platform.MAC, Platform.LINUX, Platform.WINDOWS],
        requiresApproval: false
      },
      {
        name: 'kiro-spec-tasks',
        description: 'Generate implementation tasks breakdown',
        arguments: [{
          name: 'feature-name',
          type: 'string',
          required: true,
          description: 'Name of the feature to generate tasks for'
        }],
        templatePath: 'templates/kiro-spec-tasks.hbs',
        scriptTemplatePath: 'scripts/kiro-spec-tasks.sh',
        platforms: [Platform.MAC, Platform.LINUX, Platform.WINDOWS],
        requiresApproval: false
      },
      {
        name: 'kiro-spec-status',
        description: 'Check specification progress and status',
        arguments: [{
          name: 'feature-name',
          type: 'string',
          required: false,
          description: 'Name of the feature to check status for (optional)'
        }],
        templatePath: 'templates/kiro-spec-status.hbs',
        scriptTemplatePath: 'scripts/kiro-spec-status.sh',
        platforms: [Platform.MAC, Platform.LINUX, Platform.WINDOWS],
        requiresApproval: false
      },
      {
        name: 'kiro-spec-implement',
        description: 'Start implementation phase with guided assistance',
        arguments: [{
          name: 'feature-name',
          type: 'string',
          required: true,
          description: 'Name of the feature to implement'
        }],
        templatePath: 'templates/kiro-spec-implement.hbs',
        scriptTemplatePath: 'scripts/kiro-spec-implement.sh',
        platforms: [Platform.MAC, Platform.LINUX, Platform.WINDOWS],
        requiresApproval: false
      }
    ];
  }

  /**
   * Generate individual template for a command
   */
  private async generateTemplate(
    command: Command, 
    language: Language
  ): Promise<Template> {
    const templateContent = this.generateTemplateContent(command, language);
    
    const template: Template = {
      id: `${command.name}-${Date.now()}`,
      commandName: command.name,
      promptText: templateContent,
      variables: this.generateTemplateVariables(command),
      version: '1.0.0',
      metadata: {
        amazonQVersion: '>=1.0.0',
        requiredFeatures: ['chat', 'files'],
        category: this.getTemplateCategory(command.name),
        estimatedTime: 60,
        tags: ['spec-driven-development', 'amazonq']
      }
    };

    return template;
  }

  /**
   * Generate template content based on command type
   */
  private generateTemplateContent(
    command: Command, 
    language: Language
  ): string {
    const basePrompt = this.getBasePrompt(language);
    const commandSpecific = this.getCommandSpecificPrompt(command.name, language);
    const contextInstructions = this.getContextInstructions(command, language);
    
    return `${basePrompt}

## Command: ${command.name}

${commandSpecific}

${contextInstructions}

## Input Parameters
{{#each arguments}}
- **{{this.name}}**: {{this.description}}
{{/each}}

## Project Context
{{#if projectContext}}
**Project**: {{projectContext.name}}
**Description**: {{projectContext.description}}
**Tech Stack**: {{projectContext.techStack}}
{{/if}}

## Steering Context
{{#if steeringFiles}}
{{#each steeringFiles}}
### {{this.name}}
{{this.content}}

{{/each}}
{{/if}}

## Previous Specifications
{{#if previousSpecs}}
{{#each previousSpecs}}
**{{this.feature}}**: {{this.status}} - {{this.summary}}
{{/each}}
{{/if}}

---
*Generated by amazonq-sdd v{{version}} for Amazon Q CLI integration*
`;
  }

  /**
   * Get base prompt for language
   */
  private getBasePrompt(language: Language): string {
    const prompts = {
      [Language.ENGLISH]: 'You are an AI assistant helping with spec-driven development. Please provide clear, structured responses following established patterns.',
      [Language.JAPANESE]: 'あなたはスペック駆動開発を支援するAIアシスタントです。確立されたパターンに従って、明確で構造化された回答を提供してください。',
      [Language.CHINESE_TRADITIONAL]: '您是協助規格驅動開發的AI助手。請遵循既定模式，提供清晰、結構化的回應。'
    };
    return prompts[language] || prompts[Language.ENGLISH];
  }

  /**
   * Get command-specific prompt
   */
  private getCommandSpecificPrompt(commandName: string, language: Language): string {
    const prompts: Record<string, Record<Language, string>> = {
      'kiro-steering': {
        [Language.ENGLISH]: 'Generate steering documents that provide project context and development guidelines.',
        [Language.JAPANESE]: 'プロジェクトのコンテキストと開発ガイドラインを提供するステアリング文書を生成してください。',
        [Language.CHINESE_TRADITIONAL]: '生成提供專案背景和開發指南的引導文件。'
      },
      'kiro-spec-init': {
        [Language.ENGLISH]: 'Initialize a new feature specification with clear objectives and scope.',
        [Language.JAPANESE]: '明確な目標とスコープを持つ新しい機能仕様を初期化してください。',
        [Language.CHINESE_TRADITIONAL]: '以清晰的目標和範圍初始化新的功能規格。'
      },
      'kiro-spec-requirements': {
        [Language.ENGLISH]: 'Generate detailed requirements using EARS format (WHEN/IF/WHILE/WHERE...THEN/SHALL).',
        [Language.JAPANESE]: 'EARS形式（WHEN/IF/WHILE/WHERE...THEN/SHALL）を使用して詳細な要件を生成してください。',
        [Language.CHINESE_TRADITIONAL]: '使用EARS格式（WHEN/IF/WHILE/WHERE...THEN/SHALL）生成詳細需求。'
      }
    };

    const commandPrompts = prompts[commandName];
    if (!commandPrompts) {
      return 'Please assist with this development task following best practices.';
    }

    return commandPrompts[language] || commandPrompts[Language.ENGLISH];
  }

  /**
   * Get context instructions for command
   */
  private getContextInstructions(command: Command, language: Language): string {
    if (language === Language.JAPANESE) {
      return `### 実行手順
1. 提供されたコンテキストを分析してください
2. ${command.description}を実行してください
3. 構造化された出力を提供してください
4. 次のステップを提案してください`;
    } else if (language === Language.CHINESE_TRADITIONAL) {
      return `### 執行步驟
1. 分析提供的背景資訊
2. 執行${command.description}
3. 提供結構化的輸出
4. 建議下一步驟`;
    } else {
      return `### Instructions
1. Analyze the provided context
2. ${command.description}
3. Provide structured output
4. Suggest next steps`;
    }
  }

  /**
   * Wrap template content for Amazon Q CLI chat format
   */
  private wrapForAmazonQChat(content: string, metadata: any): string {
    return `# Amazon Q CLI Prompt

## Context
This is a spec-driven development command for ${metadata.command || 'development'}.

## Task
${content}

## Response Format
Please provide your response in markdown format with clear sections and actionable items.

---
*This prompt is optimized for Amazon Q CLI chat interface*
`;
  }

  /**
   * Extract template variables from Handlebars content
   */
  private extractTemplateVariables(content: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variable.startsWith('#') && !variable.startsWith('/') && !variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables;
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    Handlebars.registerHelper('json', function(context) {
      return JSON.stringify(context, null, 2);
    });

    Handlebars.registerHelper('uppercase', function(str: string) {
      return str ? str.toUpperCase() : '';
    });

    Handlebars.registerHelper('lowercase', function(str: string) {
      return str ? str.toLowerCase() : '';
    });

    Handlebars.registerHelper('formatDate', function(date: Date) {
      return date ? date.toISOString().split('T')[0] : '';
    });

    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    Handlebars.registerHelper('ne', function(a, b) {
      return a !== b;
    });

    this.logger.verbose('Handlebars helpers registered');
  }

  /**
   * Generate template variables from command arguments
   */
  private generateTemplateVariables(command: Command): any[] {
    return command.arguments.map(arg => ({
      name: arg.name.toUpperCase().replace(/-/g, '_'),
      type: arg.type === 'string' ? 'string' : arg.type,
      required: arg.required,
      defaultValue: arg.defaultValue
    }));
  }

  /**
   * Get template category based on command name
   */
  private getTemplateCategory(commandName: string): 'spec' | 'steering' | 'utility' {
    if (commandName.includes('steering')) {
      return 'steering';
    } else if (commandName.includes('spec')) {
      return 'spec';
    } else {
      return 'utility';
    }
  }
}