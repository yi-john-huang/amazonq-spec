/**
 * Amazon Q CLI Command Execution Wrapper
 * 
 * Provides utilities for executing Amazon Q CLI commands, formatting prompts,
 * handling responses, and managing CLI interactions
 */

import { spawn, exec } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { mkdirSync } from 'fs-extra';
import { promisify } from 'util';
import { Logger } from './logger';

const execAsync = promisify(exec);

export interface AmazonQCLIOptions {
  /** Path to Amazon Q CLI binary */
  cliPath?: string;
  /** Command timeout in milliseconds */
  timeout?: number;
  /** Working directory for command execution */
  workingDirectory?: string;
  /** Environment variables */
  environment?: Record<string, string>;
  /** Enable debug logging */
  debug?: boolean;
  /** Dry run mode - don't actually execute commands */
  dryRun?: boolean;
}

export interface AmazonQPrompt {
  /** Main prompt content */
  content: string;
  /** Additional context files */
  contextFiles?: string[];
  /** Prompt metadata */
  metadata?: {
    feature?: string;
    phase?: string;
    language?: string;
    projectContext?: Record<string, any>;
  };
}

export interface AmazonQResponse {
  /** Response content from Amazon Q */
  content: string;
  /** Execution success status */
  success: boolean;
  /** Command exit code */
  exitCode: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Any parsing errors */
  parseErrors?: string[];
}

export interface CommandExecutionResult {
  /** The command that was executed */
  command: string;
  /** Command arguments */
  args: string[];
  /** Execution result */
  result: AmazonQResponse;
  /** Temporary files created during execution */
  tempFiles: string[];
}

/**
 * Manages Amazon Q CLI command execution with structured prompt formatting
 */
export class AmazonQCLIWrapper {
  private logger: Logger;
  private options: Required<AmazonQCLIOptions>;
  private tempFiles: Set<string> = new Set();

  constructor(logger: Logger, options: AmazonQCLIOptions = {}) {
    this.logger = logger;
    this.options = {
      cliPath: options.cliPath || this.detectCLIPath(),
      timeout: options.timeout || 300000, // 5 minutes default
      workingDirectory: options.workingDirectory || process.cwd(),
      environment: { ...process.env, ...(options.environment || {}) } as Record<string, string>,
      debug: options.debug || false,
      dryRun: options.dryRun || false
    };

    this.validateCLI();
  }

  /**
   * Execute Amazon Q CLI command with structured prompt
   */
  public async executePrompt(prompt: AmazonQPrompt): Promise<AmazonQResponse> {
    const startTime = Date.now();
    let tempPromptFile: string | null = null;

    try {
      // Create temporary prompt file
      tempPromptFile = await this.createPromptFile(prompt);
      
      // Build command arguments
      const args = this.buildCommandArgs(tempPromptFile, prompt);
      
      if (this.options.dryRun) {
        this.logger.info(`[DRY RUN] Would execute: ${this.options.cliPath} ${args.join(' ')}`);
        return this.createMockResponse(prompt, Date.now() - startTime);
      }

      // Execute command
      const result = await this.executeCommand(args);
      const executionTime = Date.now() - startTime;

      // Parse and validate response
      const response = this.parseResponse(result, executionTime);
      
      this.logger.debug(`Amazon Q CLI execution completed in ${executionTime}ms`);
      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Amazon Q CLI execution failed: ${error}`);
      
      return {
        content: '',
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        executionTime,
        parseErrors: [`Execution failed: ${error}`]
      };
    } finally {
      // Clean up temporary files
      if (tempPromptFile) {
        await this.cleanupTempFile(tempPromptFile);
      }
    }
  }

  /**
   * Execute multiple prompts in sequence
   */
  public async executePromptSequence(prompts: AmazonQPrompt[]): Promise<AmazonQResponse[]> {
    const results: AmazonQResponse[] = [];
    
    for (let i = 0; i < prompts.length; i++) {
      this.logger.info(`Executing prompt ${i + 1} of ${prompts.length}`);
      const result = await this.executePrompt(prompts[i]);
      results.push(result);
      
      // Stop on first failure unless continuing is explicitly requested
      if (!result.success) {
        this.logger.warn(`Prompt ${i + 1} failed, stopping sequence`);
        break;
      }
    }
    
    return results;
  }

  /**
   * Format prompt with structured sections and metadata
   */
  public formatStructuredPrompt(prompt: AmazonQPrompt): string {
    const sections: string[] = [];

    // Add metadata if present
    if (prompt.metadata) {
      sections.push('=== CONTEXT METADATA ===');
      if (prompt.metadata.feature) sections.push(`Feature: ${prompt.metadata.feature}`);
      if (prompt.metadata.phase) sections.push(`Phase: ${prompt.metadata.phase}`);
      if (prompt.metadata.language) sections.push(`Language: ${prompt.metadata.language}`);
      if (prompt.metadata.projectContext) {
        sections.push('Project Context:');
        for (const [key, value] of Object.entries(prompt.metadata.projectContext)) {
          sections.push(`  ${key}: ${value}`);
        }
      }
      sections.push('');
    }

    // Add main prompt content
    sections.push('=== MAIN PROMPT ===');
    sections.push(prompt.content);

    // Add context files if present
    if (prompt.contextFiles && prompt.contextFiles.length > 0) {
      sections.push('');
      sections.push('=== CONTEXT FILES ===');
      sections.push('The following files provide additional context:');
      prompt.contextFiles.forEach(file => {
        sections.push(`- ${file}`);
      });
    }

    return sections.join('\n');
  }

  /**
   * Validate Amazon Q CLI response format
   */
  public validateResponse(response: AmazonQResponse): string[] {
    const errors: string[] = [];

    if (!response.success && response.exitCode !== 0) {
      errors.push(`Command failed with exit code ${response.exitCode}`);
    }

    if (!response.content && response.success) {
      errors.push('Response marked as successful but contains no content');
    }

    if (response.stderr && !response.stderr.includes('INFO') && !response.stderr.includes('DEBUG')) {
      errors.push(`Command produced error output: ${response.stderr}`);
    }

    if (response.executionTime > this.options.timeout) {
      errors.push('Command execution exceeded timeout');
    }

    return errors;
  }

  /**
   * Check if Amazon Q CLI is available and properly configured
   */
  public async checkCLIAvailability(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const result = await execAsync(`"${this.options.cliPath}" --version`, {
        timeout: 5000,
        cwd: this.options.workingDirectory
      });

      return {
        available: true,
        version: result.stdout.trim()
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get CLI configuration information
   */
  public getCLIInfo(): Record<string, any> {
    return {
      cliPath: this.options.cliPath,
      timeout: this.options.timeout,
      workingDirectory: this.options.workingDirectory,
      debugEnabled: this.options.debug,
      dryRunMode: this.options.dryRun,
      tempFilesActive: this.tempFiles.size
    };
  }

  /**
   * Clean up all temporary files
   */
  public async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.tempFiles).map(file => this.cleanupTempFile(file));
    await Promise.all(cleanupPromises);
    this.tempFiles.clear();
    this.logger.debug('Amazon Q CLI wrapper cleanup completed');
  }

  /**
   * Create temporary prompt file
   */
  private async createPromptFile(prompt: AmazonQPrompt): Promise<string> {
    const tempDir = join(this.options.workingDirectory, '.tmp-amazonq');
    const timestamp = Date.now();
    const tempFile = join(tempDir, `prompt-${timestamp}.txt`);

    try {
      // Ensure temp directory exists
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }

      // Write formatted prompt to file
      const formattedPrompt = this.formatStructuredPrompt(prompt);
      writeFileSync(tempFile, formattedPrompt, 'utf8');

      this.tempFiles.add(tempFile);
      this.logger.debug(`Created temporary prompt file: ${tempFile}`);
      
      return tempFile;
    } catch (error) {
      throw new Error(`Failed to create temporary prompt file: ${error}`);
    }
  }

  /**
   * Build command arguments for Amazon Q CLI
   */
  private buildCommandArgs(promptFile: string, prompt: AmazonQPrompt): string[] {
    const args: string[] = [];

    // Add chat command
    args.push('chat');

    // Add prompt file
    args.push('--file', promptFile);

    // Add context files if present
    if (prompt.contextFiles) {
      prompt.contextFiles.forEach(file => {
        if (existsSync(file)) {
          args.push('--context', file);
        } else {
          this.logger.warn(`Context file not found: ${file}`);
        }
      });
    }

    // Add metadata as arguments if present
    if (prompt.metadata) {
      if (prompt.metadata.feature) {
        args.push('--feature', prompt.metadata.feature);
      }
      if (prompt.metadata.language) {
        args.push('--language', prompt.metadata.language);
      }
    }

    return args;
  }

  /**
   * Execute Amazon Q CLI command
   */
  private async executeCommand(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const command = this.options.cliPath;
      const child = spawn(command, args, {
        cwd: this.options.workingDirectory,
        env: this.options.environment,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        if (this.options.debug) {
          this.logger.debug(`Amazon Q stdout: ${output.trim()}`);
        }
      });

      child.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        if (this.options.debug) {
          this.logger.debug(`Amazon Q stderr: ${output.trim()}`);
        }
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0
        });
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);
    });
  }

  /**
   * Parse Amazon Q CLI response
   */
  private parseResponse(result: { stdout: string; stderr: string; exitCode: number }, executionTime: number): AmazonQResponse {
    const parseErrors: string[] = [];

    // Extract content from stdout
    let content = result.stdout.trim();

    // Clean up common CLI output artifacts
    content = this.cleanResponseContent(content);

    // Validate response
    const validationErrors = this.validateResponseContent(content);
    parseErrors.push(...validationErrors);

    return {
      content,
      success: result.exitCode === 0 && parseErrors.length === 0,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      executionTime,
      parseErrors: parseErrors.length > 0 ? parseErrors : undefined
    };
  }

  /**
   * Clean response content from CLI artifacts
   */
  private cleanResponseContent(content: string): string {
    // Remove CLI status messages
    const lines = content.split('\n');
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim().toLowerCase();
      return !trimmed.startsWith('connecting') &&
             !trimmed.startsWith('waiting') &&
             !trimmed.startsWith('processing') &&
             !trimmed.includes('status:') &&
             !trimmed.match(/^\[.*\]$/); // Remove status brackets
    });

    return cleanedLines.join('\n').trim();
  }

  /**
   * Validate response content
   */
  private validateResponseContent(content: string): string[] {
    const errors: string[] = [];

    if (!content) {
      errors.push('Response content is empty');
    }

    if (content.includes('ERROR') || content.includes('FAILED')) {
      errors.push('Response contains error indicators');
    }

    if (content.length < 10) {
      errors.push('Response content is too short to be meaningful');
    }

    return errors;
  }

  /**
   * Create mock response for dry run mode
   */
  private createMockResponse(prompt: AmazonQPrompt, executionTime: number): AmazonQResponse {
    const mockContent = `[MOCK RESPONSE for prompt about: ${prompt.content.substring(0, 50)}...]`;
    
    return {
      content: mockContent,
      success: true,
      exitCode: 0,
      stdout: mockContent,
      stderr: '',
      executionTime
    };
  }

  /**
   * Detect Amazon Q CLI path
   */
  private detectCLIPath(): string {
    // Common locations for Amazon Q CLI
    const commonPaths = [
      '/usr/local/bin/q',
      '/usr/bin/q',
      'C:\\Program Files\\Amazon\\Q\\q.exe',
      'C:\\Program Files (x86)\\Amazon\\Q\\q.exe'
    ];

    for (const path of commonPaths) {
      if (existsSync(path)) {
        return path;
      }
    }

    // Fallback to PATH lookup
    return 'q';
  }

  /**
   * Validate CLI availability
   */
  private validateCLI(): void {
    if (!this.options.cliPath) {
      throw new Error('Amazon Q CLI path not specified and could not be auto-detected');
    }

    if (!existsSync(this.options.cliPath) && this.options.cliPath !== 'q') {
      this.logger.warn(`Amazon Q CLI not found at specified path: ${this.options.cliPath}`);
    }
  }

  /**
   * Clean up temporary file
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        this.tempFiles.delete(filePath);
        this.logger.debug(`Cleaned up temporary file: ${filePath}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to clean up temporary file ${filePath}: ${error}`);
    }
  }
}