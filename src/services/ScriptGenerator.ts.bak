/**
 * ScriptGenerator - Generates cross-platform shell scripts for Amazon Q CLI integration
 * Handles wrapper script creation, command aliases, validation, and permission management
 */

import { existsSync, writeFileSync, chmodSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { 
  Script, 
  Command, 
  ValidationResult,
  Platform,
  Template
} from '../types';
import { Logger } from '../utils/logger';
import { 
  getScriptExtension,
  getPathSeparator 
} from '../utils/platform-enhanced';

export class ScriptGenerator {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Generate wrapper scripts for all commands on all platforms
   */
  async generateWrapperScripts(
    commands: Command[],
    templates: Template[],
    outputDir: string,
    amazonQPath: string
  ): Promise<Script[]> {
    this.logger.verbose('Generating wrapper scripts for all platforms');
    
    const scripts: Script[] = [];
    const platforms = [Platform.MAC, Platform.LINUX, Platform.WINDOWS];

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    for (const platform of platforms) {
      const platformDir = join(outputDir, platform);
      if (!existsSync(platformDir)) {
        mkdirSync(platformDir, { recursive: true });
      }

      for (const command of commands) {
        try {
          this.logger.verbose(`Generating ${platform} script for: ${command.name}`);
          
          const template = templates.find(t => t.commandName === command.name);
          if (!template) {
            this.logger.warn(`No template found for command: ${command.name}`);
            continue;
          }

          const script = await this.generateScript(
            command, 
            template, 
            platform, 
            platformDir, 
            amazonQPath
          );
          
          scripts.push(script);
          this.logger.verbose(`Script generated: ${command.name}${getScriptExtension(platform)}`);
        } catch (error) {
          this.logger.error(`Failed to generate script for ${command.name} on ${platform}:`, error);
          throw error;
        }
      }
    }

    this.logger.info(`Generated ${scripts.length} wrapper scripts across ${platforms.length} platforms`);
    return scripts;
  }

  /**
   * Create command aliases for easy access
   */
  createCommandAliases(
    commands: Command[],
    platform: Platform,
    scriptsDir: string,
    outputPath: string
  ): string {
    this.logger.verbose(`Creating command aliases for ${platform}`);
    
    const aliases = this.generateAliasContent(commands, platform, scriptsDir);
    
    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Write aliases to file
    writeFileSync(outputPath, aliases, 'utf-8');
    
    // Make executable on Unix systems
    if (platform !== Platform.WINDOWS) {
      try {
        chmodSync(outputPath, 0o755);
        this.logger.verbose(`Made alias file executable: ${outputPath}`);
      } catch (error) {
        this.logger.warn(`Failed to make alias file executable: ${error}`);
      }
    }

    this.logger.verbose(`Command aliases created: ${outputPath}`);
    return aliases;
  }

  /**
   * Validate generated scripts for syntax and compatibility
   */
  validateScripts(scripts: Script[]): ValidationResult {
    this.logger.verbose(`Validating ${scripts.length} scripts`);
    
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      entityType: 'script'
    };

    for (const script of scripts) {
      // Check script content for basic syntax
      const syntaxCheck = this.validateScriptSyntax(script);
      if (!syntaxCheck.valid) {
        result.valid = false;
        result.errors.push(...syntaxCheck.errors);
      }
      result.warnings.push(...syntaxCheck.warnings);

      // Check Amazon Q CLI integration
      if (!script.scriptContent.includes('Amazon Q CLI')) {
        result.warnings.push({
          code: 'MISSING_AMAZONQ_INTEGRATION',
          message: 'Script does not appear to integrate with Amazon Q CLI',
          field: 'scriptContent',
          suggestion: 'Ensure script calls Amazon Q CLI properly'
        });
      }

      // Check executable flag
      if (script.platform !== Platform.WINDOWS && !script.executable) {
        result.warnings.push({
          code: 'NOT_MARKED_EXECUTABLE',
          message: 'Script is not marked as executable',
          field: 'executable',
          suggestion: 'Set executable flag to true for Unix scripts'
        });
      }
    }

    this.logger.verbose(`Script validation ${result.valid ? 'passed' : 'failed'} with ${result.errors.length} errors, ${result.warnings.length} warnings`);
    return result;
  }

  /**
   * Set executable permissions for Unix systems
   */
  makeExecutable(scriptPath: string, platform: Platform): boolean {
    if (platform === Platform.WINDOWS) {
      this.logger.verbose('Windows detected - no chmod needed');
      return true;
    }

    try {
      chmodSync(scriptPath, 0o755);
      this.logger.verbose(`Made script executable: ${scriptPath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to make script executable: ${scriptPath}`, error);
      return false;
    }
  }

  /**
   * Generate individual script for a command and platform
   */
  private async generateScript(
    command: Command,
    template: Template,
    platform: Platform,
    outputDir: string,
    amazonQPath: string
  ): Promise<Script> {
    const scriptExtension = getScriptExtension(platform);
    const scriptFilename = `${command.name}${scriptExtension}`;
    const scriptPath = join(outputDir, scriptFilename);
    const scriptContent = this.generateScriptContent(
      command,
      template,
      platform,
      amazonQPath
    );

    // Write script to file
    writeFileSync(scriptPath, scriptContent, 'utf-8');

    // Make executable on Unix systems
    this.makeExecutable(scriptPath, platform);

    const script: Script = {
      commandName: command.name,
      platform,
      scriptContent: scriptContent,
      executable: platform !== Platform.WINDOWS,
      aliasName: command.name,
      fileExtension: scriptExtension as '.sh' | '.ps1' | '.bat'
    };

    return script;
  }

  /**
   * Generate script content based on platform and command
   */
  private generateScriptContent(
    command: Command,
    template: Template,
    platform: Platform,
    amazonQPath: string
  ): string {
    const templatePath = this.getTemplateRelativePath(template.commandName);
    
    if (platform === Platform.WINDOWS) {
      return this.generatePowerShellScript(command, templatePath, amazonQPath);
    } else {
      return this.generateBashScript(command, templatePath, amazonQPath, platform);
    }
  }

  /**
   * Generate PowerShell script for Windows
   */
  private generatePowerShellScript(
    command: Command,
    templatePath: string,
    amazonQPath: string
  ): string {
    const argsList = command.arguments.map(arg => {
      const paramName = this.toPascalCase(arg.name);
      return `    [Parameter(${arg.required ? 'Mandatory=$true' : 'Mandatory=$false'})]
    [string]$${paramName}${arg.defaultValue ? ` = "${arg.defaultValue}"` : ''}`;
    }).join(',\n');

    const argsHandling = command.arguments.map(arg => {
      const paramName = this.toPascalCase(arg.name);
      return `    if ($${paramName}) { $args += "--${arg.name}", $${paramName} }`;
    }).join('\n');

    return `#!/usr/bin/env powershell
<#
.SYNOPSIS
    ${command.description}
.DESCRIPTION
    Amazon Q CLI wrapper for ${command.name} - Spec-driven development command
.PARAMETER Help
    Show help information
${command.arguments.map(arg => `.PARAMETER ${this.toPascalCase(arg.name)}
    ${arg.description}`).join('\n')}
.EXAMPLE
    .\\${command.name}.ps1 ${command.arguments.filter(arg => arg.required).map(arg => `-${this.toPascalCase(arg.name)} "value"`).join(' ')}
#>

param(
${argsList}${argsList ? ',' : ''}
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Get-Help $PSCommandPath -Detailed
    exit 0
}

try {
    # Check if Amazon Q CLI is available
    if (-not (Get-Command "${amazonQPath}" -ErrorAction SilentlyContinue)) {
        Write-Error "Amazon Q CLI not found at: ${amazonQPath}"
        Write-Host "Please install Amazon Q CLI from: https://aws.amazon.com/q/developer/" -ForegroundColor Yellow
        exit 1
    }

    # Build arguments array
    $args = @()
${argsHandling}

    # Build template context
    $context = @{
        command = "${command.name}"
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        platform = "windows"
        user = $env:USERNAME
        workingDirectory = $PWD
    }

    # Add command arguments to context
${command.arguments.map(arg => {
      const paramName = this.toPascalCase(arg.name);
      return `    if ($${paramName}) { $context["${arg.name}"] = $${paramName} }`;
    }).join('\n')}

    # Prepare prompt for Amazon Q CLI
    $prompt = @"
# ${command.description}

Please assist with this spec-driven development task:

**Command:** ${command.name}
**Platform:** Windows
**Timestamp:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Working Directory:** $PWD

${command.arguments.map(arg => `**${arg.name}:** $${this.toPascalCase(arg.name)}`).join('\n')}

Please provide guidance and assistance for this development workflow step.

**Template Path:** ${templatePath}

---
*Generated by amazonq-sdd - Amazon Q CLI integration*
"@

    # Execute Amazon Q CLI with the prompt
    Write-Host "🚀 Executing ${command.name} via Amazon Q CLI..." -ForegroundColor Cyan
    Write-Host "Using template: ${templatePath}" -ForegroundColor Gray
    
    & "${amazonQPath}" --prompt $prompt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ ${command.name} completed successfully" -ForegroundColor Green
    } else {
        Write-Error "❌ ${command.name} failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }

} catch {
    Write-Error "❌ Error executing ${command.name}: $($_.Exception.Message)"
    Write-Host "For support, visit: https://github.com/your-org/amazonq-sdd" -ForegroundColor Yellow
    exit 1
}
`;
  }

  /**
   * Generate Bash script for Unix systems
   */
  private generateBashScript(
    command: Command,
    templatePath: string,
    amazonQPath: string,
    platform: Platform
  ): string {
    const argParsing = command.arguments.map(arg => {
      const varName = arg.name.toUpperCase().replace(/-/g, '_');
      return `        --${arg.name}|--${arg.name}=*)
            ${varName}="\${1#*=}"
            if [[ "\${1}" != *"="* ]]; then
                shift
                ${varName}="$1"
            fi
            ;;`;
    }).join('\n');

    const argValidation = command.arguments.filter(arg => arg.required).map(arg => {
      const varName = arg.name.toUpperCase().replace(/-/g, '_');
      return `if [[ -z "\${${varName}}" ]]; then
    echo "Error: --${arg.name} is required" >&2
    show_help
    exit 1
fi`;
    }).join('\n\n');

    const contextBuilding = command.arguments.map(arg => {
      const varName = arg.name.toUpperCase().replace(/-/g, '_');
      return `[[ -n "\${${varName}}" ]] && context+=("${arg.name}=\${${varName}}")`;
    }).join('\n    ');

    return `#!/bin/bash
# ${command.description}
# Amazon Q CLI wrapper for ${command.name} - Spec-driven development command

set -euo pipefail

# Script configuration
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AMAZONQ_CLI="${amazonQPath}"
TEMPLATE_PATH="${templatePath}"

# Command arguments
${command.arguments.map(arg => {
      const varName = arg.name.toUpperCase().replace(/-/g, '_');
      return `${varName}="${arg.defaultValue || ''}"`;
    }).join('\n')}

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
CYAN='\\033[0;36m'
GRAY='\\033[0;37m'
NC='\\033[0m' # No Color

# Show help function
show_help() {
    cat << EOF
${command.description}

Usage: $SCRIPT_NAME [OPTIONS]

Options:
${command.arguments.map(arg => `    --${arg.name.padEnd(20)} ${arg.description}${arg.required ? ' (required)' : ''}`).join('\n')}
    --help               Show this help message
    --version            Show version information

Examples:
    $SCRIPT_NAME ${command.arguments.filter(arg => arg.required).map(arg => `--${arg.name} "example-value"`).join(' ')}

For more information, visit: https://github.com/your-org/amazonq-sdd
EOF
}

# Show version function
show_version() {
    echo "$SCRIPT_NAME v1.0.0"
    echo "Amazon Q SDD - Spec-driven development for Amazon Q CLI"
}

# Check if Amazon Q CLI is available
check_amazonq_cli() {
    if ! command -v "$AMAZONQ_CLI" > /dev/null 2>&1; then
        echo -e "\${RED}❌ Error: Amazon Q CLI not found at: $AMAZONQ_CLI\${NC}" >&2
        echo -e "\${YELLOW}💡 Please install Amazon Q CLI from: https://aws.amazon.com/q/developer/\${NC}" >&2
        exit 1
    fi
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
${argParsing}
            --help|-h)
                show_help
                exit 0
                ;;
            --version|-v)
                show_version
                exit 0
                ;;
            *)
                echo -e "\${RED}Unknown option: $1\${NC}" >&2
                show_help
                exit 1
                ;;
        esac
        shift
    done
}

# Validate required arguments
validate_args() {
${argValidation}
}

# Build context for Amazon Q CLI
build_context() {
    local context=()
    context+=("command=${command.name}")
    context+=("timestamp=$(date '+%Y-%m-%d %H:%M:%S')")
    context+=("platform=${platform}")
    context+=("user=$(whoami)")
    context+=("working_directory=$(pwd)")
    ${contextBuilding}
    
    printf '%s\\n' "\${context[@]}"
}

# Main execution function
main() {
    echo -e "\${CYAN}🚀 Executing ${command.name} via Amazon Q CLI...\${NC}"
    echo -e "\${GRAY}Using template: $TEMPLATE_PATH\${NC}"
    
    # Build prompt for Amazon Q CLI
    local prompt
    prompt=$(cat << EOF
# ${command.description}

Please assist with this spec-driven development task:

**Command:** ${command.name}
**Platform:** ${platform}
**Timestamp:** $(date '+%Y-%m-%d %H:%M:%S')
**Working Directory:** $(pwd)

${command.arguments.map(arg => {
      const varName = arg.name.toUpperCase().replace(/-/g, '_');
      return `**${arg.name}:** \${${varName}}`;
    }).join('\n')}

Please provide guidance and assistance for this development workflow step.

**Template Path:** $TEMPLATE_PATH

---
*Generated by amazonq-sdd - Amazon Q CLI integration*
EOF
)

    # Execute Amazon Q CLI with the prompt
    if "$AMAZONQ_CLI" --prompt "$prompt"; then
        echo -e "\${GREEN}✅ ${command.name} completed successfully\${NC}"
    else
        local exit_code=$?
        echo -e "\${RED}❌ ${command.name} failed with exit code $exit_code\${NC}" >&2
        echo -e "\${YELLOW}For support, visit: https://github.com/your-org/amazonq-sdd\${NC}" >&2
        exit $exit_code
    fi
}

# Script execution
parse_args "$@"
check_amazonq_cli
validate_args
main

# End of script
`;
  }

  /**
   * Generate alias file content for platform
   */
  private generateAliasContent(
    commands: Command[],
    platform: Platform,
    _scriptsDir: string
  ): string {
    const pathSep = getPathSeparator(platform);
    const scriptExt = getScriptExtension(platform);
    
    if (platform === Platform.WINDOWS) {
      return this.generatePowerShellAliases(commands, scriptExt);
    } else {
      return this.generateBashAliases(commands, scriptExt, pathSep);
    }
  }

  /**
   * Generate PowerShell aliases
   */
  private generatePowerShellAliases(
    commands: Command[],
    scriptExt: string
  ): string {
    const aliases = commands.map(cmd => 
      `Set-Alias -Name "${cmd.name}" -Value "$PSScriptRoot\\${cmd.name}${scriptExt}"`
    ).join('\n');

    return `# Amazon Q SDD Command Aliases (PowerShell)
# Generated on $(Get-Date)

${aliases}

# Export all aliases
Export-ModuleMember -Alias *

Write-Host "🚀 Amazon Q SDD commands loaded!" -ForegroundColor Cyan
Write-Host "Available commands: ${commands.map(cmd => cmd.name).join(', ')}" -ForegroundColor Gray
`;
  }

  /**
   * Generate Bash aliases
   */
  private generateBashAliases(
    commands: Command[],
    scriptExt: string,
    pathSep: string
  ): string {
    const scriptDir = '$(dirname "${BASH_SOURCE[0]}")';
    const aliases = commands.map(cmd => 
      `alias ${cmd.name}="${scriptDir}${pathSep}${cmd.name}${scriptExt}"`
    ).join('\n');

    return `#!/bin/bash
# Amazon Q SDD Command Aliases
# Generated on $(date)

${aliases}

# Function to show available commands
amazonq-sdd-commands() {
    echo "🚀 Available Amazon Q SDD commands:"
    echo "${commands.map(cmd => `    ${cmd.name.padEnd(25)} - ${cmd.description}`).join('\n    echo "')}"
}

echo "🚀 Amazon Q SDD commands loaded!"
echo "Run 'amazonq-sdd-commands' to see all available commands"
`;
  }

  /**
   * Validate individual script syntax
   */
  private validateScriptSyntax(script: Script): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      entityType: 'script'
    };

    // Check for basic script structure
    if (!script.scriptContent.includes('#!/')) {
      result.warnings.push({
        code: 'MISSING_SHEBANG',
        message: 'Script does not have a shebang line',
        field: 'scriptContent',
        suggestion: 'Add shebang line at the beginning'
      });
    }

    // Check for Amazon Q CLI reference
    if (!script.scriptContent.includes(script.commandName)) {
      result.warnings.push({
        code: 'MISSING_COMMAND_REFERENCE',
        message: 'Script does not reference the command name',
        field: 'scriptContent',
        suggestion: 'Ensure script properly references the command'
      });
    }

    // Platform-specific checks
    if (script.platform === Platform.WINDOWS) {
      if (!script.scriptContent.includes('powershell')) {
        result.warnings.push({
          code: 'MISSING_POWERSHELL_REFERENCE',
          message: 'Windows script should reference PowerShell',
          field: 'scriptContent',
          suggestion: 'Ensure script is properly formatted for PowerShell'
        });
      }
    } else {
      if (!script.scriptContent.includes('bash') && !script.scriptContent.includes('sh')) {
        result.warnings.push({
          code: 'MISSING_SHELL_REFERENCE',
          message: 'Unix script should reference bash or sh',
          field: 'scriptContent',
          suggestion: 'Ensure script uses proper shell'
        });
      }
    }

    return result;
  }

  /**
   * Get relative template path
   */
  private getTemplateRelativePath(commandName: string): string {
    return `../templates/${commandName}.hbs`;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}