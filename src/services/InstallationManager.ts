/**
 * Installation Manager Service
 * Handles the main installation process for amazonq-sdd
 */

import { InstallOptions, InstallResult, Platform, AmazonQSDDError, Config } from '../types';
import { Logger } from '../utils/logger';
import { existsSync } from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { getAmazonQCheckCommand, getCommonBinaryPaths } from '../utils/platform';

const execAsync = promisify(exec);

/**
 * Manages the installation process for Amazon Q SDD
 */
export class InstallationManager {
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
      // Step 1: Detect Amazon Q CLI if not skipping
      if (!options.skipDetection) {
        const amazonQPath = await this.detectAmazonQCLI();
        if (!amazonQPath) {
          result.warnings.push('Amazon Q CLI not detected. Some features may not work.');
        } else {
          this.logger.verbose(`Amazon Q CLI detected at: ${amazonQPath}`);
        }
      }

      // Step 2: Create directory structure
      await this.createDirectoryStructure(options.kiroDirectory || '.kiro');
      result.createdFiles.push(options.kiroDirectory || '.kiro');

      // Step 3: Generate configuration files
      await this.generateConfigFiles({
        projectName: 'amazonq-sdd-project',
        language: options.language!,
        amazonQCLIPath: await this.detectAmazonQCLI() || 'q',
        kiroDirectory: options.kiroDirectory || '.kiro',
        localization: {
          messages: {},
          errors: {},
          commands: {},
          help: {}
        },
        version: '1.0.0',
        installedAt: new Date()
      });

      // TODO: Implement actual installation logic in later tasks
      // This is a placeholder for Task 3
      
      if (options.dryRun) {
        result.message = 'Dry run completed. No files were modified.';
        result.warnings.push('This was a dry run. Run without --dry-run to apply changes.');
      } else {
        result.message = 'Installation completed successfully';
        result.installedCommands = [
          'kiro-spec-init',
          'kiro-spec-requirements',
          'kiro-spec-design',
          'kiro-spec-tasks',
          'kiro-spec-impl',
          'kiro-spec-status',
          'kiro-steering',
          'kiro-steering-custom'
        ];
      }

      result.success = true;
      return result;

    } catch (error) {
      this.logger.error('Installation failed:', error);
      
      if (error instanceof AmazonQSDDError) {
        result.errors.push(error.message);
      } else if (error instanceof Error) {
        result.errors.push(error.message);
      } else {
        result.errors.push('Unknown error occurred');
      }
      
      result.message = 'Installation failed';
      return result;
    }
  }

  /**
   * Detect Amazon Q CLI installation
   */
  async detectAmazonQCLI(): Promise<string | null> {
    this.logger.debug('Detecting Amazon Q CLI...');

    try {
      // Try using which/where command
      const platform = process.platform === 'win32' ? Platform.WINDOWS : 
                       process.platform === 'darwin' ? Platform.MAC : Platform.LINUX;
      const checkCommand = getAmazonQCheckCommand(platform);
      
      const { stdout } = await execAsync(checkCommand);
      const path = stdout.trim();
      
      if (path && existsSync(path)) {
        this.logger.debug(`Amazon Q CLI found at: ${path}`);
        return path;
      }
    } catch (error) {
      this.logger.debug('Amazon Q CLI not found via which/where command');
    }

    // Check common installation paths
    const platform = process.platform === 'win32' ? Platform.WINDOWS : 
                     process.platform === 'darwin' ? Platform.MAC : Platform.LINUX;
    const commonPaths = getCommonBinaryPaths(platform);
    
    for (const basePath of commonPaths) {
      const fullPath = join(basePath.replace(/^~/, process.env.HOME || ''), 'q');
      if (existsSync(fullPath)) {
        this.logger.debug(`Amazon Q CLI found at: ${fullPath}`);
        return fullPath;
      }
    }

    this.logger.debug('Amazon Q CLI not found');
    return null;
  }

  /**
   * Create the .kiro directory structure
   */
  async createDirectoryStructure(kiroPath: string): Promise<void> {
    this.logger.debug(`Creating directory structure at: ${kiroPath}`);
    
    // TODO: Implement in Task 5
    // This is a placeholder for Task 3
    this.logger.verbose('Directory structure creation will be implemented in Task 5');
  }

  /**
   * Generate configuration files
   */
  async generateConfigFiles(config: Config): Promise<void> {
    this.logger.debug('Generating configuration files');
    this.logger.verbose(`Generating config for project: ${config.projectName}`);
    
    // TODO: Implement in Task 5
    // This is a placeholder for Task 3
    this.logger.verbose('Configuration file generation will be implemented in Task 5');
  }

  /**
   * Validate an existing installation
   */
  async validate(): Promise<boolean> {
    this.logger.debug('Validating installation...');
    
    try {
      // Check if Amazon Q CLI exists
      const amazonQPath = await this.detectAmazonQCLI();
      if (!amazonQPath) {
        this.logger.warn('Amazon Q CLI not found');
        return false;
      }

      // Check if .kiro directory exists
      if (!existsSync('.kiro')) {
        this.logger.warn('.kiro directory not found');
        return false;
      }

      // TODO: Add more validation in later tasks
      
      this.logger.debug('Installation validation passed');
      return true;
      
    } catch (error) {
      this.logger.error('Validation failed:', error);
      return false;
    }
  }
}