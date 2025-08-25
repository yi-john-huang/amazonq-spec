/**
 * ConfigurationManager - Manages AMAZONQ.md configuration file generation and handling
 * Handles localization, validation, and configuration file backup/recovery
 */

// cSpell:ignore amazonq AMAZONQ kiro

import { writeFileSync, readFileSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { mkdirSync } from 'fs-extra';
import Handlebars from 'handlebars';
import { 
  Config, 
  Language, 
  LocalizedStrings,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  Platform
} from '../types';
import { Logger } from '../utils/logger';
import { LocalizationManager } from '../localization';

/**
 * Configuration template context for AMAZONQ.md generation
 */
export interface ConfigContext {
  projectName: string;
  language: Language;
  platform: Platform;
  amazonQCLIPath: string;
  kiroDirectory: string;
  timestamp: string;
  localization: LocalizedStrings;
  customSettings?: Record<string, any>;
}

/**
 * Manages configuration file generation, validation, and localization
 */
export class ConfigurationManager {
  private logger: Logger;
  private localizationManager: LocalizationManager;
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor(logger: Logger, localizationManager?: LocalizationManager) {
    this.logger = logger;
    this.localizationManager = localizationManager || new LocalizationManager(logger);
    this.setupHandlebarsHelpers();
  }

  /**
   * Generate AMAZONQ.md configuration file with project context
   */
  public generateAmazonQConfig(
    outputPath: string,
    config: Config
  ): { path: string; content: string } {
    this.logger.info('Generating AMAZONQ.md configuration file');

    const context: ConfigContext = {
      projectName: config.projectName,
      language: config.language,
      platform: this.detectPlatform(),
      amazonQCLIPath: config.amazonQCLIPath,
      kiroDirectory: config.kiroDirectory,
      timestamp: new Date().toISOString(),
      localization: config.localization,
      customSettings: config.customSettings
    };

    // Get the appropriate template based on language
    const template = this.getConfigTemplate(config.language);
    const content = template(context);

    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Write configuration file
    writeFileSync(outputPath, content, 'utf8');
    
    this.logger.info(`Generated AMAZONQ.md at: ${outputPath}`);
    
    return {
      path: outputPath,
      content
    };
  }

  /**
   * Handle multi-language localization for configuration files
   */
  public handleLocalization(
    outputDir: string,
    config: Config,
    languages: Language[] = [Language.ENGLISH, Language.JAPANESE, Language.CHINESE_TRADITIONAL]
  ): { [key: string]: string } {
    this.logger.info('Generating localized configuration files');

    const results: { [key: string]: string } = {};
    
    for (const language of languages) {
      const localization = this.getLocalizationStrings(language);
      const configWithLang: Config = {
        ...config,
        language,
        localization
      };

      const fileName = this.getLocalizedFileName(language);
      const outputPath = join(outputDir, fileName);
      
      const { content } = this.generateAmazonQConfig(outputPath, configWithLang);
      results[language] = content;
      
      this.logger.info(`Generated ${fileName} for language: ${language}`);
    }

    return results;
  }

  /**
   * Validate configuration file structure and content
   */
  public validateConfiguration(configPath: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
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

      const content = readFileSync(configPath, 'utf8');
      
      // Check for required sections
      const requiredSections = [
        '# Amazon Q CLI Configuration',
        '## Project Context',
        '## SDD Workflow',
        '## Commands'
      ];

      for (const section of requiredSections) {
        if (!content.includes(section)) {
          warnings.push({
            code: 'MISSING_SECTION',
            message: `Missing required section: ${section}`,
            field: 'content',
            suggestion: `Add the ${section} section to the configuration file`
          });
        }
      }

      // Check for Amazon Q CLI integration markers
      if (!content.includes('Amazon Q CLI') && !content.includes('amazonq')) {
        warnings.push({
          code: 'MISSING_AMAZONQ_INTEGRATION',
          message: 'Configuration file does not mention Amazon Q CLI integration',
          field: 'content',
          suggestion: 'Add Amazon Q CLI integration instructions'
        });
      }

      // Check for kiro directory references
      if (!content.includes('.kiro/')) {
        warnings.push({
          code: 'MISSING_KIRO_REFERENCE',
          message: 'Configuration file does not reference .kiro/ directory',
          field: 'content',
          suggestion: 'Add .kiro/ directory structure information'
        });
      }

      // Validate file encoding (should be UTF-8)
      try {
        const buffer = readFileSync(configPath);
        const hasUTF8BOM = buffer.length >= 3 && 
          buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
        
        if (hasUTF8BOM) {
          warnings.push({
            code: 'UTF8_BOM_PRESENT',
            message: 'File contains UTF-8 BOM which may cause issues',
            field: 'encoding',
            suggestion: 'Remove UTF-8 BOM from the file'
          });
        }
      } catch (error) {
        warnings.push({
          code: 'ENCODING_CHECK_FAILED',
          message: 'Could not validate file encoding',
          field: 'encoding'
        });
      }

      this.logger.info(`Configuration validation completed: ${errors.length} errors, ${warnings.length} warnings`);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        entityType: 'configuration',
        metadata: {
          fileSize: content.length,
          sections: requiredSections.filter(section => content.includes(section))
        }
      };

    } catch (error) {
      errors.push({
        code: 'VALIDATION_ERROR',
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
   * Backup existing configuration file before updates
   */
  public backupConfiguration(configPath: string): string | null {
    if (!existsSync(configPath)) {
      this.logger.debug('No existing configuration to backup');
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${configPath}.backup-${timestamp}`;
    
    try {
      copyFileSync(configPath, backupPath);
      this.logger.info(`Configuration backed up to: ${backupPath}`);
      return backupPath;
    } catch (error) {
      this.logger.error(`Failed to backup configuration: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Restore configuration from backup
   */
  public restoreConfiguration(backupPath: string, targetPath: string): boolean {
    if (!existsSync(backupPath)) {
      this.logger.error(`Backup file not found: ${backupPath}`);
      return false;
    }

    try {
      copyFileSync(backupPath, targetPath);
      this.logger.info(`Configuration restored from: ${backupPath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to restore configuration: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Update existing configuration with new settings
   */
  public updateConfiguration(
    configPath: string,
    updates: Partial<Config>
  ): boolean {
    try {
      // Backup existing configuration
      this.backupConfiguration(configPath);
      
      if (!existsSync(configPath)) {
        this.logger.warn('Configuration file does not exist, creating new one');
        // Create minimal config if none exists
        const defaultConfig: Config = {
          projectName: updates.projectName || 'Unknown Project',
          language: updates.language || Language.ENGLISH,
          amazonQCLIPath: updates.amazonQCLIPath || '/usr/local/bin/q',
          kiroDirectory: updates.kiroDirectory || '.kiro',
          localization: updates.localization || this.getLocalizationStrings(Language.ENGLISH),
          version: '1.0.0',
          installedAt: new Date(),
          customSettings: updates.customSettings
        };

        const { path } = this.generateAmazonQConfig(configPath, defaultConfig);
        return existsSync(path);
      }

      // Read existing configuration
      const existingContent = readFileSync(configPath, 'utf8');
      
      // Parse and update configuration (simplified approach)
      let updatedContent = existingContent;
      
      // Update project name if provided
      if (updates.projectName) {
        updatedContent = updatedContent.replace(
          /# .* - Amazon Q CLI Configuration/,
          `# ${updates.projectName} - Amazon Q CLI Configuration`
        );
      }

      // Update Amazon Q CLI path if provided
      if (updates.amazonQCLIPath) {
        updatedContent = updatedContent.replace(
          /Amazon Q CLI Path: .*/,
          `Amazon Q CLI Path: ${updates.amazonQCLIPath}`
        );
      }

      // Update .kiro directory if provided
      if (updates.kiroDirectory) {
        updatedContent = updatedContent.replace(
          /\.kiro\/*/g,
          `${updates.kiroDirectory}/`
        );
      }

      // Write updated configuration
      writeFileSync(configPath, updatedContent, 'utf8');
      
      this.logger.info(`Configuration updated: ${configPath}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Get configuration template based on language
   */
  private getConfigTemplate(language: Language): Handlebars.TemplateDelegate {
    const cacheKey = `config-${language}`;
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    const templateContent = this.getConfigTemplateContent(language);
    const template = Handlebars.compile(templateContent);
    
    this.templateCache.set(cacheKey, template);
    return template;
  }

  /**
   * Get configuration template content based on language
   */
  private getConfigTemplateContent(language: Language): string {
    // Try to load from external template files first
    const templateFiles = {
      [Language.ENGLISH]: 'templates/config/AMAZONQ.md.hbs',
      [Language.JAPANESE]: 'templates/config/AMAZONQ.ja.md.hbs', 
      [Language.CHINESE_TRADITIONAL]: 'templates/config/AMAZONQ.zh-TW.md.hbs'
    };

    const templatePath = templateFiles[language];
    if (existsSync(templatePath)) {
      try {
        const { readFileSync } = require('fs');
        return readFileSync(templatePath, 'utf8');
      } catch (error) {
        this.logger.warn(`Failed to load external template ${templatePath}, using built-in template`);
      }
    }

    // Fallback to built-in templates
    const templates = {
      [Language.ENGLISH]: `# {{projectName}} - Amazon Q CLI Configuration

*Generated on {{timestamp}}*

## Project Context

This project uses Amazon Q CLI for Spec-Driven Development (SDD) workflow.

**Amazon Q CLI Path:** {{amazonQCLIPath}}
**Kiro Directory:** {{kiroDirectory}}
**Language:** {{localization.messages.language_name}}
**Platform:** {{platform}}

## SDD Workflow

This project follows the Kiro-style Spec-Driven Development approach with these phases:

### Phase 0: Steering (Optional)
- \`/kiro:steering\` - Create/update steering documents  
- \`/kiro:steering-custom\` - Create custom steering for specialized contexts

### Phase 1: Specification Creation  
1. \`/kiro:spec-init [detailed description]\` - Initialize spec with detailed project description
2. \`/kiro:spec-requirements [feature]\` - Generate requirements document
3. \`/kiro:spec-design [feature]\` - Interactive: "Have you reviewed requirements.md? [y/N]"
4. \`/kiro:spec-tasks [feature]\` - Interactive: Confirms both requirements and design review

### Phase 2: Progress Tracking
- \`/kiro:spec-status [feature]\` - Check current progress and phases

## Commands

The following SDD commands are available for this project:

{{#each customSettings.availableCommands}}
- **{{name}}**: {{description}}
{{/each}}

## Directory Structure

\`\`\`
{{kiroDirectory}}/
├── specs/           # Feature specifications
├── steering/        # Project steering documents
└── templates/       # Custom templates
\`\`\`

## Development Guidelines

{{localization.help.development_guidelines}}

---

*This configuration was generated by amazonq-sdd package version {{version}}*
`,

      [Language.JAPANESE]: `# {{projectName}} - Amazon Q CLI設定

*{{timestamp}}に生成*

## プロジェクトコンテキスト

このプロジェクトはSpec-Driven Development (SDD)ワークフローにAmazon Q CLIを使用します。

**Amazon Q CLIパス:** {{amazonQCLIPath}}
**Kiroディレクトリ:** {{kiroDirectory}}  
**言語:** {{localization.messages.language_name}}
**プラットフォーム:** {{platform}}

## SDDワークフロー

このプロジェクトは以下のフェーズでKiroスタイルのSpec-Driven Development手法に従います：

### フェーズ0: ステアリング（任意）
- \`/kiro:steering\` - ステアリング文書の作成/更新
- \`/kiro:steering-custom\` - 特殊なコンテキスト用のカスタムステアリング作成

### フェーズ1: 仕様作成
1. \`/kiro:spec-init [詳細な説明]\` - 詳細なプロジェクト説明で仕様を初期化
2. \`/kiro:spec-requirements [機能]\` - 要件文書を生成
3. \`/kiro:spec-design [機能]\` - インタラクティブ: "requirements.mdを確認しましたか？ [y/N]"
4. \`/kiro:spec-tasks [機能]\` - インタラクティブ: 要件と設計の両方のレビューを確認

### フェーズ2: 進捗追跡
- \`/kiro:spec-status [機能]\` - 現在の進捗とフェーズを確認

## コマンド

このプロジェクトでは以下のSDDコマンドが利用可能です：

{{#each customSettings.availableCommands}}
- **{{name}}**: {{description}}
{{/each}}

## ディレクトリ構造

\`\`\`
{{kiroDirectory}}/
├── specs/           # 機能仕様
├── steering/        # プロジェクトステアリング文書
└── templates/       # カスタムテンプレート
\`\`\`

## 開発ガイドライン

{{localization.help.development_guidelines}}

---

*この設定はamazonq-sddパッケージバージョン{{version}}によって生成されました*
`,

      [Language.CHINESE_TRADITIONAL]: `# {{projectName}} - Amazon Q CLI 配置

*於 {{timestamp}} 生成*

## 專案內容

此專案使用 Amazon Q CLI 進行規格驅動開發 (SDD) 工作流程。

**Amazon Q CLI 路徑:** {{amazonQCLIPath}}
**Kiro 目錄:** {{kiroDirectory}}
**語言:** {{localization.messages.language_name}}
**平台:** {{platform}}

## SDD 工作流程

此專案遵循 Kiro 風格的規格驅動開發方法，包含以下階段：

### 階段 0: 導向（可選）
- \`/kiro:steering\` - 建立/更新導向文件
- \`/kiro:steering-custom\` - 為專門情境建立自訂導向

### 階段 1: 規格建立
1. \`/kiro:spec-init [詳細描述]\` - 使用詳細專案描述初始化規格
2. \`/kiro:spec-requirements [功能]\` - 生成需求文件
3. \`/kiro:spec-design [功能]\` - 互動式: "您是否已檢閱 requirements.md？ [y/N]"
4. \`/kiro:spec-tasks [功能]\` - 互動式: 確認需求和設計皆已檢閱

### 階段 2: 進度追蹤
- \`/kiro:spec-status [功能]\` - 檢查目前進度和階段

## 指令

此專案提供以下 SDD 指令：

{{#each customSettings.availableCommands}}
- **{{name}}**: {{description}}
{{/each}}

## 目錄結構

\`\`\`
{{kiroDirectory}}/
├── specs/           # 功能規格
├── steering/        # 專案導向文件
└── templates/       # 自訂範本
\`\`\`

## 開發指導原則

{{localization.help.development_guidelines}}

---

*此配置由 amazonq-sdd 套件版本 {{version}} 生成*
`
    };

    return templates[language];
  }

  /**
   * Get localized strings for a specific language
   */
  private getLocalizationStrings(language: Language): LocalizedStrings {
    return this.localizationManager.getStrings(language);
  }

  /**
   * Get localized file name based on language
   */
  private getLocalizedFileName(language: Language): string {
    const fileNames = {
      [Language.ENGLISH]: 'AMAZONQ.md',
      [Language.JAPANESE]: 'AMAZONQ.ja.md', 
      [Language.CHINESE_TRADITIONAL]: 'AMAZONQ.zh-TW.md'
    };

    return fileNames[language];
  }

  /**
   * Detect current platform
   */
  private detectPlatform(): Platform {
    const platform = process.platform;
    
    switch (platform) {
      case 'darwin':
        return Platform.MAC;
      case 'win32':
        return Platform.WINDOWS;
      case 'linux':
        return Platform.LINUX;
      default:
        return Platform.LINUX; // Default fallback
    }
  }

  /**
   * Set up Handlebars helpers for configuration templates
   */
  private setupHandlebarsHelpers(): void {
    // Helper to format dates
    Handlebars.registerHelper('formatDate', function(date: string | Date) {
      const d = new Date(date);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    });

    // Helper to check if array has items
    Handlebars.registerHelper('hasItems', function(array: any[]) {
      return array && array.length > 0;
    });

    // Helper to upper case strings
    Handlebars.registerHelper('upper', function(str: string) {
      return str ? str.toUpperCase() : '';
    });

    // Helper to lower case strings  
    Handlebars.registerHelper('lower', function(str: string) {
      return str ? str.toLowerCase() : '';
    });

    // Helper for conditional platform-specific content
    Handlebars.registerHelper('ifPlatform', (platform: Platform, targetPlatform: Platform, options: any) => {
      if (platform === targetPlatform) {
        return options.fn(options);
      }
      return options.inverse(options);
    });
  }
}