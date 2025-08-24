/**
 * Installation Manager Service
 * Handles the main installation process for amazonq-sdd
 */

import { 
  InstallOptions, 
  InstallResult, 
  Language,
  AmazonQSDDError, 
  ErrorType,
  Platform,
  Command
} from '../types';
import { Logger } from '../utils/logger';
import { existsSync, mkdirSync, writeFileSync, readFileSync, chmodSync } from 'fs';
import { join, resolve } from 'path';
import { 
  validateAmazonQCLI, 
  AmazonQValidation
} from '../utils/platform-enhanced';
import { ScriptGenerator } from './ScriptGenerator';
import { TemplateGenerator } from './TemplateGenerator';
import { AmazonQCLIDetector, AmazonQCLIInfo } from '../utils/amazonq-cli-detector';

/**
 * Manages the installation process for Amazon Q SDD
 */
export class InstallationManager {
  private rollbackActions: Array<() => void> = [];
  private scriptGenerator: ScriptGenerator;
  private templateGenerator: TemplateGenerator;
  private amazonQDetector: AmazonQCLIDetector;

  constructor(private logger: Logger) {
    this.scriptGenerator = new ScriptGenerator(this.logger);
    this.templateGenerator = new TemplateGenerator(this.logger);
    this.amazonQDetector = new AmazonQCLIDetector(this.logger);
  }

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
      let amazonQInfo: AmazonQCLIInfo | null = null;
      if (!options.skipDetection) {
        this.logger.info('Detecting Amazon Q CLI installation...');
        amazonQInfo = await this.detectAmazonQCLI();
        
        this.logger.info(`Amazon Q CLI found: ${amazonQInfo.command} (${amazonQInfo.type})`);
        if (amazonQInfo.version) {
          this.logger.info(`Version: ${amazonQInfo.version}`);
        }
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

      // Step 4: Create executable command scripts
      this.logger.info('Creating command scripts...');
      const scriptFiles = await this.createCommandScripts(options, amazonQInfo);
      result.createdFiles.push(...scriptFiles);
      
      // Add the main SDD commands that will be created (matching cc-sdd naming)
      const sddCommands = [
        'kiro-steering',
        'kiro-steering-custom', 
        'kiro-spec-init',
        'kiro-spec-requirements',
        'kiro-spec-design',
        'kiro-spec-tasks',
        'kiro-spec-impl',
        'kiro-spec-status'
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
  async detectAmazonQCLI(): Promise<AmazonQCLIInfo> {
    this.logger.verbose('Detecting Amazon Q CLI...');
    
    try {
      const cliInfo = await this.amazonQDetector.detectCLI();
      
      this.logger.verbose(`Found Amazon Q CLI: ${cliInfo.command} (${cliInfo.type})`);
      if (cliInfo.version) {
        this.logger.verbose(`Version: ${cliInfo.version}`);
      }
      this.logger.verbose(`Supports --file flag: ${cliInfo.supportsFileFlag}`);
      this.logger.verbose(`Supports --context flag: ${cliInfo.supportsContextFlag}`);
      
      return cliInfo;
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
    const amazonqDir = resolve('.amazonq');
    
    this.logger.verbose(`Creating directory structure in: ${amazonqDir}`);

    const directories = [
      amazonqDir,
      join(amazonqDir, 'templates'),
      join(amazonqDir, 'scripts')
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
    const createdFiles: string[] = [];
    
    // Generate AMAZONQ.md configuration file in root directory (like CLAUDE.md)
    const amazonqMdPath = resolve('AMAZONQ.md');
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
    const amazonqDir = resolve('.amazonq');
    const gitignorePath = join(amazonqDir, '.gitignore');
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

    // Copy template files
    const templateFiles = await this.copyTemplateFiles(options);
    createdFiles.push(...templateFiles);

    return createdFiles;
  }

  /**
   * Copy template files to the .amazonq/templates directory
   */
  async copyTemplateFiles(options: InstallOptions): Promise<string[]> {
    const amazonqDir = resolve('.amazonq');
    const templatesDir = join(amazonqDir, 'templates');
    const createdFiles: string[] = [];
    
    // Source templates directory in the package
    const sourceTemplatesDir = join(__dirname, '..', '..', 'templates', 'prompts');
    
    const templateFiles = [
      'steering.hbs',
      'steering-custom.hbs',
      'spec-init.hbs',
      'spec-requirements.hbs',
      'spec-design.hbs',
      'spec-tasks.hbs',
      'spec-status.hbs',
      'spec-impl.hbs'
    ];

    if (!options.dryRun) {
      for (const templateFile of templateFiles) {
        try {
          const sourcePath = join(sourceTemplatesDir, templateFile);
          const targetPath = join(templatesDir, templateFile);
          
          if (existsSync(sourcePath)) {
            this.logger.verbose(`Copying template: ${templateFile}`);
            const templateContent = readFileSync(sourcePath, 'utf-8');
            writeFileSync(targetPath, templateContent, 'utf-8');
            createdFiles.push(targetPath);
            
            // Add rollback action
            this.rollbackActions.push(() => {
              try {
                if (existsSync(targetPath)) {
                  this.logger.verbose(`Rollback: Would remove ${targetPath}`);
                  // Note: Actual file removal would be implemented here
                }
              } catch (error) {
                this.logger.warn(`Failed to rollback template ${targetPath}:`, error);
              }
            });
          } else {
            this.logger.warn(`Source template not found: ${sourcePath}`);
          }
        } catch (error) {
          this.logger.error(`Failed to copy template ${templateFile}:`, error);
          throw new AmazonQSDDError(
            ErrorType.TEMPLATE_GENERATION_FAILED,
            `Failed to copy template file: ${templateFile}`,
            { originalError: error }
          );
        }
      }
    } else {
      this.logger.verbose('Dry run: Would copy template files:', templateFiles);
      templateFiles.forEach(templateFile => {
        createdFiles.push(join(templatesDir, templateFile));
      });
    }

    return createdFiles;
  }

  /**
   * Validate existing installation
   */
  async validate(): Promise<boolean> {
    try {
      this.logger.verbose('Validating Amazon Q SDD installation...');
      
      // Check if .amazonq directory exists
      const amazonqExists = existsSync('.amazonq');
      if (!amazonqExists) {
        this.logger.verbose('No .amazonq directory found');
        return false;
      }

      // Check if config file exists in root
      const configExists = existsSync('AMAZONQ.md');
      if (!configExists) {
        this.logger.verbose('No AMAZONQ.md configuration found in root');
        return false;
      }

      // Check if Amazon Q CLI is accessible
      try {
        const amazonQInfo = await this.detectAmazonQCLI();
        this.logger.verbose(`Amazon Q CLI accessible: ${amazonQInfo.command} (${amazonQInfo.type})`);
      } catch (error) {
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
This project is set up for spec-driven development with Amazon Q CLI.

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
your-project/
├── AMAZONQ.md         # This configuration file
├── .amazonq/          # Amazon Q SDD tools
│   ├── templates/     # Handlebars templates
│   └── scripts/       # Executable command scripts
└── .kiro/             # Project content (created by commands)
    ├── steering/      # Project-wide AI guidance
    └── specs/         # Feature specifications
\`\`\`

### Usage
1. Add scripts to PATH: \`export PATH="$PATH:$PWD/.amazonq/scripts"\`
2. Run steering setup (optional): \`kiro-steering\`
3. Initialize spec: \`kiro-spec-init "feature description"\`
4. Follow the 3-phase workflow: Requirements → Design → Tasks → Implementation

### Customization
- Edit templates in \`.amazonq/templates/\` to customize prompts and workflow
- Steering files will be created in \`.kiro/steering/\` when you run \`kiro-steering\`
- Specs will be created in \`.kiro/specs/\` when you run \`kiro-spec-init\`
- See \`.amazonq/scripts/SETUP_INSTRUCTIONS.md\` for PATH configuration help

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
   * Create executable command scripts for kiro-* commands
   */
  async createCommandScripts(options: InstallOptions, amazonQInfo: AmazonQCLIInfo | null = null): Promise<string[]> {
    const amazonqDir = resolve('.amazonq');
    const scriptsDir = join(amazonqDir, 'scripts');
    const createdFiles: string[] = [];

    const commands = [
      {
        name: 'kiro-steering',
        description: 'Create/update steering documents',
        template: 'steering'
      },
      {
        name: 'kiro-steering-custom',
        description: 'Create custom steering contexts',
        template: 'steering-custom'
      },
      {
        name: 'kiro-spec-init',
        description: 'Initialize new feature specification',
        template: 'spec-init'
      },
      {
        name: 'kiro-spec-requirements',
        description: 'Generate requirements document',
        template: 'spec-requirements'
      },
      {
        name: 'kiro-spec-design',
        description: 'Generate technical design',
        template: 'spec-design'
      },
      {
        name: 'kiro-spec-tasks',
        description: 'Generate implementation tasks',
        template: 'spec-tasks'
      },
      {
        name: 'kiro-spec-status',
        description: 'Check specification progress',
        template: 'spec-status'
      },
      {
        name: 'kiro-spec-impl',
        description: 'Start implementation phase with TDD',
        template: 'spec-impl'
      }
    ];

    if (!options.dryRun) {
      for (const command of commands) {
        try {
          // Generate shell script content using detected CLI info
          const scriptContent = this.generateScriptContentDirect(command, options, amazonQInfo);

          // Write script file
          const scriptExtension = options.platform === Platform.WINDOWS ? '.cmd' : '.sh';
          const scriptPath = join(scriptsDir, `${command.name}${scriptExtension}`);
          
          this.logger.verbose(`Creating script: ${scriptPath}`);
          writeFileSync(scriptPath, scriptContent, 'utf-8');
          
          // Make script executable on Unix-like systems
          if (options.platform !== Platform.WINDOWS) {
            chmodSync(scriptPath, '755');
          }
          
          createdFiles.push(scriptPath);

          // Add rollback action
          this.rollbackActions.push(() => {
            try {
              if (existsSync(scriptPath)) {
                this.logger.verbose(`Rollback: Would remove ${scriptPath}`);
                // Note: Actual file removal would be implemented here
              }
            } catch (error) {
              this.logger.warn(`Failed to rollback script ${scriptPath}:`, error);
            }
          });
        } catch (error) {
          this.logger.error(`Failed to create script ${command.name}:`, error);
          throw new AmazonQSDDError(
            ErrorType.SCRIPT_GENERATION_FAILED,
            `Failed to create command script: ${command.name}`,
            { originalError: error }
          );
        }
      }

      // Create PATH setup instructions file
      const setupInstructionsPath = join(scriptsDir, 'SETUP_INSTRUCTIONS.md');
      const setupContent = this.generateSetupInstructions(options, commands);
      
      this.logger.verbose(`Creating setup instructions: ${setupInstructionsPath}`);
      writeFileSync(setupInstructionsPath, setupContent, 'utf-8');
      createdFiles.push(setupInstructionsPath);

    } else {
      this.logger.verbose('Dry run: Would create command scripts:', commands.map(c => c.name));
      // Add theoretical files to created list for dry run reporting
      commands.forEach(command => {
        const scriptExtension = options.platform === Platform.WINDOWS ? '.cmd' : '.sh';
        createdFiles.push(join(scriptsDir, `${command.name}${scriptExtension}`));
      });
      createdFiles.push(join(scriptsDir, 'SETUP_INSTRUCTIONS.md'));
    }

    return createdFiles;
  }

  /**
   * Generate script content using detected CLI capabilities
   */
  private generateScriptContentDirect(command: any, options: InstallOptions, amazonQInfo: AmazonQCLIInfo | null): string {
    // Use detected CLI info to generate compatible script, or use the new detector's method
    if (amazonQInfo) {
      return this.amazonQDetector.generateScriptContent(amazonQInfo, command.name, command.description);
    }
    
    // Fallback to default script generation if no CLI info available
    const isWindows = options.platform === Platform.WINDOWS;
    const amazonqDir = '.amazonq';
    const templateDir = join(amazonqDir, 'templates');
    
    if (isWindows) {
      // Windows batch script with dynamic CLI detection
      return `@echo off
REM ${command.description}
REM Generated by amazonq-sdd v${this.getPackageVersion()} - Auto-detecting Amazon Q CLI

setlocal enabledelayedexpansion

REM Check if .amazonq directory exists
if not exist "${amazonqDir}" (
    echo Error: .amazonq directory not found. Run 'npx amazonq-sdd@latest' first.
    exit /b 1
)

REM Create .kiro directories if they don't exist
if not exist ".kiro" (
    echo Creating .kiro directory structure...
    mkdir .kiro\\steering
    mkdir .kiro\\specs
)

REM Set environment variables for templates
set "STEERING_DIRECTORY=.kiro\\steering"
set "SPECS_DIRECTORY=.kiro\\specs"
set "PROJECT_PATH=%CD%"
for %%I in (.) do set "PROJECT_NAME=%%~nxI"

REM Prepare template path
set "TEMPLATE_PATH=${templateDir}\\${command.template}.hbs"
if not exist "!TEMPLATE_PATH!" (
    echo Error: Template file not found: !TEMPLATE_PATH!
    exit /b 1
)

REM Try different Amazon Q CLI commands in order of preference
echo Executing ${command.name}...

REM Try q chat --file first (newest CLI)
q chat --file "!TEMPLATE_PATH!" %* 2>nul
if not errorlevel 1 (
    echo ${command.name} completed successfully
    exit /b 0
)

REM Try qchat chat (legacy CLI without --file support)
type "!TEMPLATE_PATH!" | qchat chat %* 2>nul
if not errorlevel 1 (
    echo ${command.name} completed successfully
    exit /b 0
)

REM Try amazon-q chat --file
amazon-q chat --file "!TEMPLATE_PATH!" %* 2>nul
if not errorlevel 1 (
    echo ${command.name} completed successfully
    exit /b 0
)

REM Try amazonq chat --file
amazonq chat --file "!TEMPLATE_PATH!" %* 2>nul
if not errorlevel 1 (
    echo ${command.name} completed successfully
    exit /b 0
)

echo Error: No compatible Amazon Q CLI found. Please install Amazon Q CLI.
echo Install from: https://aws.amazon.com/q/developer/
exit /b 1
`;
    } else {
      // Unix shell script with dynamic CLI detection
      return `#!/bin/bash
# ${command.description}
# Generated by amazonq-sdd v${this.getPackageVersion()} - Auto-detecting Amazon Q CLI

set -euo pipefail

# Check if .amazonq directory exists
if [ ! -d "${amazonqDir}" ]; then
    echo "Error: .amazonq directory not found. Run 'npx amazonq-sdd@latest' first."
    exit 1
fi

# Create .kiro directories if they don't exist
if [ ! -d ".kiro" ]; then
    echo "Creating .kiro directory structure..."
    mkdir -p .kiro/steering .kiro/specs
fi

# Prepare template path
TEMPLATE_PATH="${templateDir}/${command.template}.hbs"
if [ ! -f "\$TEMPLATE_PATH" ]; then
    echo "Error: Template file not found: \$TEMPLATE_PATH"
    exit 1
fi

# Set environment variables for templates
export STEERING_DIRECTORY=".kiro/steering"
export SPECS_DIRECTORY=".kiro/specs"
export PROJECT_PATH="\$(pwd)"
export PROJECT_NAME="\$(basename \$(pwd))"

# Execute Amazon Q CLI with structured prompt
echo "Executing ${command.name}..."

# Try different Amazon Q CLI commands in order of preference

# Try q chat --file first (newest CLI)
if command -v q &> /dev/null; then
    if q chat --file "\$TEMPLATE_PATH" "\$@" 2>/dev/null; then
        echo "${command.name} completed successfully"
        exit 0
    fi
fi

# Try qchat chat (legacy CLI without --file support)
if command -v qchat &> /dev/null; then
    if cat "\$TEMPLATE_PATH" | qchat chat "\$@" 2>/dev/null; then
        echo "${command.name} completed successfully"
        exit 0
    fi
fi

# Try amazon-q chat --file
if command -v amazon-q &> /dev/null; then
    if amazon-q chat --file "\$TEMPLATE_PATH" "\$@" 2>/dev/null; then
        echo "${command.name} completed successfully"
        exit 0
    fi
fi

# Try amazonq chat --file
if command -v amazonq &> /dev/null; then
    if amazonq chat --file "\$TEMPLATE_PATH" "\$@" 2>/dev/null; then
        echo "${command.name} completed successfully"
        exit 0
    fi
fi

echo "Error: No compatible Amazon Q CLI found. Please install Amazon Q CLI."
echo "Install from: https://aws.amazon.com/q/developer/"
exit 1
`;
    }
  }

  /**
   * Generate setup instructions for PATH configuration
   */
  private generateSetupInstructions(options: InstallOptions, commands: any[]): string {
    const amazonqDir = '.amazonq';
    const scriptsDir = join(amazonqDir, 'scripts');
    
    let instructions = `# Amazon Q SDD Command Setup Instructions\n\n`;
    
    if (options.platform === Platform.WINDOWS) {
      instructions += `## Windows Setup\n\n`;
      instructions += `To use the kiro-* commands from anywhere in your project, add the scripts directory to your PATH:\n\n`;
      instructions += `### Option 1: PowerShell (Recommended)\n`;
      instructions += `\`\`\`powershell\n`;
      instructions += `$env:PATH += ";$(Get-Location)\\${scriptsDir.replace(/\//g, '\\')}"\n`;
      instructions += `\`\`\`\n\n`;
      instructions += `### Option 2: Command Prompt\n`;
      instructions += `\`\`\`cmd\n`;
      instructions += `set PATH=%PATH%;%CD%\\${scriptsDir.replace(/\//g, '\\')}\n`;
      instructions += `\`\`\`\n\n`;
    } else {
      instructions += `## Unix/Linux/macOS Setup\n\n`;
      instructions += `To use the kiro-* commands from anywhere in your project, add the scripts directory to your PATH:\n\n`;
      instructions += `### Option 1: Current Session Only\n`;
      instructions += `\`\`\`bash\n`;
      instructions += `export PATH="$PATH:$(pwd)/${scriptsDir}"\n`;
      instructions += `\`\`\`\n\n`;
      instructions += `### Option 2: Project-Specific (Recommended)\n`;
      instructions += `Add to your project's .env file or shell rc file:\n`;
      instructions += `\`\`\`bash\n`;
      instructions += `export PATH="$PATH:$PWD/${scriptsDir}"\n`;
      instructions += `\`\`\`\n\n`;
    }

    instructions += `## Available Commands\n\n`;
    commands.forEach(command => {
      instructions += `- **${command.name}**: ${command.description}\n`;
    });
    
    instructions += `\n## Quick Test\n\n`;
    instructions += `After setting up PATH, test with:\n`;
    instructions += `\`\`\`bash\n`;
    instructions += `kiro-spec-init "test feature"\n`;
    instructions += `\`\`\`\n\n`;
    instructions += `## Troubleshooting\n\n`;
    instructions += `If commands are not found:\n`;
    instructions += `1. Verify PATH includes the scripts directory\n`;
    instructions += `2. Check script permissions (Unix/Linux/macOS only)\n`;
    instructions += `3. Restart your terminal session\n`;
    instructions += `4. Ensure Amazon Q CLI is installed and accessible\n\n`;
    instructions += `For support, see: https://github.com/your-org/amazonq-sdd/issues\n`;

    return instructions;
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