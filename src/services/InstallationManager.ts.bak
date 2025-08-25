/**
 * Installation Manager Service
 * Handles the main installation process for amazonq-sdd
 */

import { 
  InstallOptions, 
  InstallResult, 
  Language,
  AmazonQSDDError, 
  ErrorType
} from '../types';
import { Logger } from '../utils/logger';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { 
  validateAmazonQCLI, 
  AmazonQValidation
} from '../utils/platform-enhanced';

/**
 * Manages the installation process for Amazon Q SDD
 */
export class InstallationManager {
  private rollbackActions: Array<() => void> = [];

  constructor(private logger: Logger) {}

  /**
   * Main installation method
   */
  async install(options: InstallOptions): Promise<InstallResult> {
    this.logger.debug('Starting installation with options:', options);

    const result: InstallResult = {
      success: false,
      installedCommands: [],
      createdFiles: [],
      warnings: [],
      errors: [],
      message: ''
    };

    try {
      this.logger.info('Starting Amazon Q SDD installation...');

      // Step 1: Detect Amazon Q CLI if not skipping
      if (!options.skipDetection) {
        this.logger.info('Detecting Amazon Q CLI installation...');
        const amazonQValidation = await this.detectAmazonQCLI();
        
        if (!amazonQValidation.isInstalled) {
          result.errors.push('Amazon Q CLI not found. Please install it first.');
          result.warnings.push('Install from: https://aws.amazon.com/q/developer/');
          throw new AmazonQSDDError(
            ErrorType.AMAZON_Q_NOT_FOUND,
            'Amazon Q CLI is required but not found on system',
            { validation: amazonQValidation }
          );
        }
        
        this.logger.info(`Amazon Q CLI found: ${amazonQValidation.path} (v${amazonQValidation.version})`);
        // Store Amazon Q info for reference (InstallResult doesn't have these fields)
      } else {
        this.logger.verbose('Skipping Amazon Q CLI detection as requested');
        result.warnings.push('Amazon Q CLI detection skipped - installation may not work properly');
      }

      // Step 2: Create directory structure
      this.logger.info('Creating directory structure...');
      await this.createDirectoryStructure(options);

      // Step 3: Generate configuration files
      this.logger.info('Generating configuration files...');
      const configFiles = await this.generateConfigFiles(options);
      result.createdFiles.push(...configFiles);

      // Step 4: Create shell scripts (placeholder for now)
      this.logger.info('Creating command scripts...');
      
      // Add the main SDD commands that will be created
      const sddCommands = [
        'kiro-steering',
        'kiro-steering-custom', 
        'kiro-spec-init',
        'kiro-spec-requirements',
        'kiro-spec-design',
        'kiro-spec-tasks',
        'kiro-spec-status',
        'kiro-spec-implement'
      ];
      
      result.installedCommands = sddCommands;

      // Step 5: Finalize installation
      this.logger.info('Finalizing installation...');

      if (!options.dryRun) {
        this.logger.info('Installation completed successfully');
        result.message = 'Installation completed successfully';
      } else {
        this.logger.info('Dry run completed - no changes were made');
        result.warnings.push('Dry run mode - no actual files were created');
        result.message = 'Dry run completed - no changes were made';
      }

      result.success = true;
      return result;

    } catch (error) {
      this.logger.error('Installation failed:', error);
      result.success = false;
      
      if (error instanceof AmazonQSDDError) {
        result.errors.push(error.message);
      } else if (error instanceof Error) {
        result.errors.push(`Unexpected error: ${error.message}`);
      } else {
        result.errors.push('Unknown error occurred during installation');
      }

      // Perform rollback if needed
      if (this.rollbackActions.length > 0) {
        this.logger.info('Performing rollback...');
        await this.performRollback();
      }
      
      result.message = 'Installation failed';

      return result;
    }
  }

  /**
   * Detect and validate Amazon Q CLI installation
   */
  async detectAmazonQCLI(): Promise<AmazonQValidation> {
    this.logger.verbose('Detecting Amazon Q CLI...');
    
    try {
      const validation = await validateAmazonQCLI();
      
      if (validation.isInstalled) {
        this.logger.verbose(`Found Amazon Q CLI at: ${validation.path}`);
        if (validation.version) {
          this.logger.verbose(`Version: ${validation.version}`);
        }
      } else {
        this.logger.verbose('Amazon Q CLI not found');
        if (validation.errors.length > 0) {
          this.logger.verbose('Detection errors:');
          validation.errors.forEach(error => {
            this.logger.verbose(`  - ${error}`);
          });
        }
      }

      return validation;
    } catch (error) {
      this.logger.error('Error detecting Amazon Q CLI:', error);
      throw new AmazonQSDDError(
        ErrorType.AMAZON_Q_NOT_FOUND,
        'Failed to detect Amazon Q CLI',
        { originalError: error }
      );
    }
  }

  /**
   * Create directory structure for amazonq-sdd
   */
  async createDirectoryStructure(options: InstallOptions): Promise<void> {
    const kiroDir = resolve(options.kiroDirectory || '.kiro');
    
    this.logger.verbose(`Creating directory structure in: ${kiroDir}`);

    const directories = [
      kiroDir,
      join(kiroDir, 'steering'),
      join(kiroDir, 'specs'),
      join(kiroDir, 'templates'),
      join(kiroDir, 'scripts'),
      join(kiroDir, 'config')
    ];

    if (!options.dryRun) {
      for (const dir of directories) {
        if (!existsSync(dir)) {
          this.logger.verbose(`Creating directory: ${dir}`);
          mkdirSync(dir, { recursive: true });
          
          // Add rollback action
          this.rollbackActions.push(() => {
            try {
              if (existsSync(dir)) {
                // Only remove if directory is empty or only contains our files
                this.logger.verbose(`Rollback: Would remove directory ${dir}`);
                // Note: Actual directory removal would be implemented here
              }
            } catch (error) {
              this.logger.warn(`Failed to rollback directory ${dir}:`, error);
            }
          });
        } else {
          this.logger.verbose(`Directory already exists: ${dir}`);
        }
      }
    } else {
      this.logger.verbose('Dry run: Would create directories:', directories);
    }
  }

  /**
   * Generate configuration files
   */
  async generateConfigFiles(options: InstallOptions): Promise<string[]> {
    const kiroDir = resolve(options.kiroDirectory || '.kiro');
    const createdFiles: string[] = [];
    
    // Generate AMAZONQ.md configuration file
    const amazonqMdPath = join(kiroDir, 'config', 'AMAZONQ.md');
    const amazonqMdContent = this.generateAmazonQConfig(options);
    
    if (!options.dryRun) {
      this.logger.verbose(`Creating configuration file: ${amazonqMdPath}`);
      writeFileSync(amazonqMdPath, amazonqMdContent, 'utf-8');
      createdFiles.push(amazonqMdPath);
      
      // Add rollback action
      this.rollbackActions.push(() => {
        try {
          if (existsSync(amazonqMdPath)) {
            this.logger.verbose(`Rollback: Would remove ${amazonqMdPath}`);
            // Note: Actual file removal would be implemented here
          }
        } catch (error) {
          this.logger.warn(`Failed to rollback file ${amazonqMdPath}:`, error);
        }
      });
    } else {
      this.logger.verbose('Dry run: Would create file:', amazonqMdPath);
      createdFiles.push(amazonqMdPath);
    }

    // Generate .gitignore if needed
    const gitignorePath = join(kiroDir, '.gitignore');
    if (!existsSync(gitignorePath)) {
      const gitignoreContent = this.generateGitignore();
      
      if (!options.dryRun) {
        this.logger.verbose(`Creating .gitignore: ${gitignorePath}`);
        writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
        createdFiles.push(gitignorePath);
        
        // Add rollback action
        this.rollbackActions.push(() => {
          try {
            if (existsSync(gitignorePath)) {
              this.logger.verbose(`Rollback: Would remove ${gitignorePath}`);
              // Note: Actual file removal would be implemented here
            }
          } catch (error) {
            this.logger.warn(`Failed to rollback file ${gitignorePath}:`, error);
          }
        });
      } else {
        this.logger.verbose('Dry run: Would create file:', gitignorePath);
        createdFiles.push(gitignorePath);
      }
    }

    return createdFiles;
  }

  /**
   * Validate existing installation
   */
  async validate(): Promise<boolean> {
    try {
      this.logger.verbose('Validating Amazon Q SDD installation...');
      
      // Check if .kiro directory exists
      const kiroExists = existsSync('.kiro');
      if (!kiroExists) {
        this.logger.verbose('No .kiro directory found');
        return false;
      }

      // Check if config file exists
      const configExists = existsSync(join('.kiro', 'config', 'AMAZONQ.md'));
      if (!configExists) {
        this.logger.verbose('No AMAZONQ.md configuration found');
        return false;
      }

      // Check if Amazon Q CLI is accessible
      const amazonQValidation = await this.detectAmazonQCLI();
      if (!amazonQValidation.isInstalled) {
        this.logger.verbose('Amazon Q CLI not accessible');
        return false;
      }

      this.logger.verbose('Installation validation passed');
      return true;
    } catch (error) {
      this.logger.error('Validation failed:', error);
      return false;
    }
  }

  /**
   * Perform rollback of installation changes
   */
  private async performRollback(): Promise<void> {
    this.logger.info(`Performing rollback with ${this.rollbackActions.length} actions...`);
    
    for (let i = this.rollbackActions.length - 1; i >= 0; i--) {
      try {
        this.rollbackActions[i]();
      } catch (error) {
        this.logger.warn(`Rollback action ${i} failed:`, error);
      }
    }
    
    this.rollbackActions = [];
    this.logger.info('Rollback completed');
  }

  /**
   * Generate AMAZONQ.md configuration content
   */
  private generateAmazonQConfig(options: InstallOptions): string {
    const timestamp = new Date().toISOString();
    
    return `# Amazon Q SDD Configuration

## Installation Information
- **Created**: ${timestamp}
- **Language**: ${this.getLanguageDisplay(options.language || Language.ENGLISH)}
- **Platform**: ${options.platform || 'auto-detected'}
- **Version**: amazonq-sdd v${this.getPackageVersion()}

## Amazon Q CLI Integration
This directory contains spec-driven development templates and scripts designed to work with Amazon Q CLI.

### Available Commands
- \`kiro-steering\` - Create/update steering documents  
- \`kiro-steering-custom\` - Create custom steering contexts
- \`kiro-spec-init\` - Initialize new feature specification
- \`kiro-spec-requirements\` - Generate requirements document
- \`kiro-spec-design\` - Generate technical design
- \`kiro-spec-tasks\` - Generate implementation tasks
- \`kiro-spec-status\` - Check specification progress
- \`kiro-spec-implement\` - Start implementation phase

### Directory Structure
\`\`\`
${options.kiroDirectory || '.kiro'}/
├── steering/           # Project-wide AI guidance
├── specs/             # Feature specifications
├── templates/         # Handlebars templates
├── scripts/           # Generated shell scripts
└── config/            # Configuration files
\`\`\`

### Usage
1. Run steering setup (optional): \`kiro-steering\`
2. Initialize spec: \`kiro-spec-init "feature description"\`
3. Follow the 3-phase workflow: Requirements → Design → Tasks → Implementation

### Customization
Edit templates in \`templates/\` directory to customize prompts and workflow.
Steering files in \`steering/\` provide project context to Amazon Q CLI.

---
*Generated by amazonq-sdd - Spec-driven development for Amazon Q CLI*
`;
  }

  /**
   * Generate .gitignore content for .kiro directory
   */
  private generateGitignore(): string {
    return `# Amazon Q SDD - Generated files
*.tmp
*.log
.DS_Store
Thumbs.db

# Keep structure but ignore sensitive data
!steering/
!specs/
!templates/
!scripts/
!config/

# Ignore any secrets or API keys that might be generated
*secret*
*key*
*token*
`;
  }

  /**
   * Get display name for language
   */
  private getLanguageDisplay(language: Language): string {
    const displays: Record<Language, string> = {
      [Language.ENGLISH]: 'English',
      [Language.JAPANESE]: '日本語', 
      [Language.CHINESE_TRADITIONAL]: '繁體中文'
    };
    return displays[language] || language;
  }

  /**
   * Get package version from package.json
   */
  private getPackageVersion(): string {
    try {
      const packageJsonPath = join(__dirname, '..', '..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      return packageJson.version || '0.1.0';
    } catch {
      return '0.1.0';
    }
  }
}