#!/usr/bin/env node

/**
 * Main CLI entry point for amazonq-sdd
 * Handles command-line argument parsing and orchestrates the installation process
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Language, Platform, InstallOptions, ErrorType, AmazonQSDDError } from './types';
import { Logger } from './utils/logger';
import { detectPlatform, validateAmazonQCLI, getPlatformInfo } from './utils/platform';
import { InstallationManager } from './services/InstallationManager';

// Read package.json for version information
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

// Initialize logger
const logger = new Logger();

// Create commander program
const program = new Command();

/**
 * Configure CLI with commands and options
 */
program
  .name('amazonq-sdd')
  .description('Spec-driven development workflow for Amazon Q CLI users')
  .version(packageJson.version, '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help information');

/**
 * Main install command (default)
 */
program
  .option(
    '-l, --lang <language>',
    'Language preference (en, ja, zh-TW)',
    'en'
  )
  .option(
    '-o, --os <platform>',
    'Operating system (mac, windows, linux)',
    undefined
  )
  .option(
    '-k, --kiro-dir <path>',
    'Custom .kiro directory location',
    '.kiro'
  )
  .option(
    '-d, --dry-run',
    'Preview changes without applying them',
    false
  )
  .option(
    '-f, --force',
    'Force overwrite existing files',
    false
  )
  .option(
    '--verbose',
    'Enable verbose output for debugging',
    false
  )
  .option(
    '--debug',
    'Enable debug mode with detailed logging',
    false
  )
  .option(
    '--skip-detection',
    'Skip Amazon Q CLI detection',
    false
  )
  .action(async (options) => {
    try {
      // Set up logging based on flags
      if (options.debug) {
        logger.setLevel('debug');
        logger.debug('Debug mode enabled');
      } else if (options.verbose) {
        logger.setLevel('verbose');
        logger.verbose('Verbose output enabled');
      }

      // Display welcome message
      console.log(chalk.cyan.bold('\n🚀 Amazon Q SDD Installer\n'));
      
      // Parse and validate language option
      const language = parseLanguage(options.lang);
      logger.verbose(`Language selected: ${language}`);

      // Detect or parse platform
      let platform: Platform;
      if (options.os) {
        platform = parsePlatform(options.os);
        logger.verbose(`Platform specified: ${platform}`);
      } else {
        platform = await detectPlatform();
        logger.verbose(`Platform detected: ${platform}`);
      }

      // Create installation options
      const installOptions: InstallOptions = {
        language,
        platform,
        kiroDirectory: options.kiroDir,
        dryRun: options.dryRun,
        force: options.force,
        verbose: options.verbose || options.debug,
        skipDetection: options.skipDetection
      };

      // Display configuration
      if (options.dryRun) {
        console.log(chalk.yellow('🔍 Running in dry-run mode (no changes will be made)\n'));
      }

      console.log(chalk.gray('Configuration:'));
      console.log(chalk.gray(`  • Language: ${getLanguageDisplay(language)}`));
      console.log(chalk.gray(`  • Platform: ${platform}`));
      console.log(chalk.gray(`  • Directory: ${options.kiroDir}`));
      console.log();

      // Initialize installation manager
      const installer = new InstallationManager(logger);
      
      // Run installation
      console.log(chalk.cyan('📦 Installing Amazon Q SDD templates...\n'));
      const result = await installer.install(installOptions);

      // Display results
      if (result.success) {
        console.log(chalk.green.bold('\n✅ Installation completed successfully!\n'));
        
        if (result.installedCommands.length > 0) {
          console.log(chalk.cyan('Installed commands:'));
          result.installedCommands.forEach((cmd: string) => {
            console.log(chalk.gray(`  • ${cmd}`));
          });
        }

        if (result.warnings.length > 0) {
          console.log(chalk.yellow('\n⚠️  Warnings:'));
          result.warnings.forEach((warning: string) => {
            console.log(chalk.yellow(`  • ${warning}`));
          });
        }

        console.log(chalk.cyan('\n📚 Next steps:'));
        console.log(chalk.gray('  1. Run `kiro-steering` to set up project context'));
        console.log(chalk.gray('  2. Run `kiro-spec-init "your feature"` to start'));
        console.log(chalk.gray('  3. Follow the SDD workflow with generated commands'));
        
      } else {
        console.log(chalk.red.bold('\n❌ Installation failed\n'));
        
        if (result.errors.length > 0) {
          console.log(chalk.red('Errors:'));
          result.errors.forEach((error: string) => {
            console.log(chalk.red(`  • ${error}`));
          });
        }
        
        process.exit(1);
      }

    } catch (error) {
      handleError(error);
    }
  });

/**
 * Init command (alias for main action)
 */
program
  .command('init')
  .description('Initialize Amazon Q SDD in current project')
  .option('-l, --lang <language>', 'Language preference', 'en')
  .option('-o, --os <platform>', 'Operating system')
  .option('--dry-run', 'Preview changes without applying')
  .action(async (options) => {
    // Redirect to main action
    const args = process.argv.slice(0, 2);
    Object.entries(options).forEach(([key, value]) => {
      if (value === true) {
        args.push(`--${key}`);
      } else if (value) {
        args.push(`--${key}`, String(value));
      }
    });
    await program.parseAsync(args);
  });

/**
 * Validate command - check installation integrity
 */
program
  .command('validate')
  .description('Validate existing Amazon Q SDD installation')
  .action(async () => {
    try {
      console.log(chalk.cyan('\n🔍 Validating Amazon Q SDD installation...\n'));
      
      const installer = new InstallationManager(logger);
      const isValid = await installer.validate();
      
      if (isValid) {
        console.log(chalk.green('✅ Installation is valid and complete'));
      } else {
        console.log(chalk.yellow('⚠️  Installation has issues that need to be fixed'));
        console.log(chalk.gray('Run `amazonq-sdd --force` to reinstall'));
      }
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Info command - display system information
 */
program
  .command('info')
  .description('Display system and installation information')
  .action(async () => {
    try {
      console.log(chalk.cyan.bold('\n📋 System Information\n'));
      
      const platformInfo = await getPlatformInfo();
      const amazonQValidation = await validateAmazonQCLI();
      
      console.log(chalk.gray('System:'));
      console.log(chalk.gray(`  • Platform: ${platformInfo.platform} (${platformInfo.os})`));
      console.log(chalk.gray(`  • Architecture: ${platformInfo.arch}`));
      console.log(chalk.gray(`  • OS Version: ${platformInfo.version}`));
      console.log(chalk.gray(`  • Node.js: ${process.version}`));
      console.log(chalk.gray(`  • NPM: ${process.env.npm_version || 'unknown'}`));
      console.log(chalk.gray(`  • Shell: ${platformInfo.shell}`));
      if (platformInfo.isWSL) {
        console.log(chalk.yellow('  • WSL: Detected'));
      }
      if (platformInfo.isDocker) {
        console.log(chalk.yellow('  • Docker: Detected'));
      }
      
      console.log(chalk.gray('\nAmazon Q CLI:'));
      if (amazonQValidation.isInstalled) {
        console.log(chalk.gray(`  • Path: ${amazonQValidation.path}`));
        console.log(chalk.gray(`  • Version: ${amazonQValidation.version || 'unknown'}`));
        console.log(chalk.green('  • Status: Installed and accessible ✓'));
      } else {
        console.log(chalk.yellow('  • Status: Not found'));
        if (amazonQValidation.errors.length > 0) {
          console.log(chalk.red('  • Issues:'));
          amazonQValidation.errors.forEach(error => {
            console.log(chalk.red(`    - ${error}`));
          });
        }
        console.log(chalk.gray('  • Install from: https://aws.amazon.com/q/developer/'));
      }
      
      console.log(chalk.gray('\nPackage:'));
      console.log(chalk.gray(`  • Version: ${packageJson.version}`));
      console.log(chalk.gray(`  • Name: ${packageJson.name}`));
      
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Parse language option to Language enum
 */
function parseLanguage(lang: string): Language {
  const langMap: Record<string, Language> = {
    'en': Language.ENGLISH,
    'english': Language.ENGLISH,
    'ja': Language.JAPANESE,
    'japanese': Language.JAPANESE,
    'zh-tw': Language.CHINESE_TRADITIONAL,
    'zh_tw': Language.CHINESE_TRADITIONAL,
    'chinese': Language.CHINESE_TRADITIONAL
  };

  const normalized = lang.toLowerCase();
  const language = langMap[normalized];
  
  if (!language) {
    console.log(chalk.yellow(`Warning: Unknown language '${lang}', defaulting to English`));
    return Language.ENGLISH;
  }
  
  return language;
}

/**
 * Parse platform option to Platform enum
 */
function parsePlatform(os: string): Platform {
  const platformMap: Record<string, Platform> = {
    'mac': Platform.MAC,
    'macos': Platform.MAC,
    'darwin': Platform.MAC,
    'windows': Platform.WINDOWS,
    'win': Platform.WINDOWS,
    'win32': Platform.WINDOWS,
    'linux': Platform.LINUX,
    'ubuntu': Platform.LINUX,
    'debian': Platform.LINUX
  };

  const normalized = os.toLowerCase();
  const platform = platformMap[normalized];
  
  if (!platform) {
    throw new AmazonQSDDError(
      ErrorType.INVALID_PLATFORM,
      `Unknown platform: ${os}. Valid options: mac, windows, linux`
    );
  }
  
  return platform;
}

/**
 * Get display name for language
 */
function getLanguageDisplay(language: Language): string {
  const displays: Record<Language, string> = {
    [Language.ENGLISH]: 'English',
    [Language.JAPANESE]: '日本語',
    [Language.CHINESE_TRADITIONAL]: '繁體中文'
  };
  return displays[language] || language;
}

/**
 * Handle errors with user-friendly messages
 */
function handleError(error: unknown): void {
  console.error();
  
  if (error instanceof AmazonQSDDError) {
    // Handle known errors
    console.error(chalk.red(`❌ Error: ${error.message}`));
    
    if (error.type === ErrorType.AMAZON_Q_NOT_FOUND) {
      console.error(chalk.yellow('\n💡 Tip: Install Amazon Q CLI from:'));
      console.error(chalk.cyan('   https://aws.amazon.com/q/developer/'));
    } else if (error.type === ErrorType.PERMISSION_DENIED) {
      console.error(chalk.yellow('\n💡 Tip: Try running with sudo or as administrator'));
    }
    
    if (error.details && logger.getLevel() === 'debug') {
      console.error(chalk.gray('\nDetails:'));
      console.error(chalk.gray(JSON.stringify(error.details, null, 2)));
    }
  } else if (error instanceof Error) {
    // Handle unexpected errors
    console.error(chalk.red(`❌ Unexpected error: ${error.message}`));
    
    if (logger.getLevel() === 'debug') {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
  } else {
    // Handle unknown errors
    console.error(chalk.red('❌ An unknown error occurred'));
    console.error(error);
  }
  
  console.error(chalk.gray('\nFor more information, run with --debug flag'));
  process.exit(1);
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (process.argv.length === 2) {
  program.help();
}