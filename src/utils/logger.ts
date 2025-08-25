/**
 * Logger utility for consistent output formatting
 * Provides different log levels and colored output
 */

import chalk from 'chalk';

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'verbose' | 'debug';

/**
 * Logger class for managing console output
 */
export class Logger {
  private level: LogLevel = 'info';
  private readonly levelPriority: Record<LogLevel, number> = {
    silent: 0,
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5
  };

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  /**
   * Set the current log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Check if a message should be logged based on current level
   */
  private shouldLog(messageLevel: LogLevel): boolean {
    return this.levelPriority[messageLevel] <= this.levelPriority[this.level];
  }

  /**
   * Format timestamp for log messages
   */
  private getTimestamp(): string {
    if (this.level !== 'debug') {
      return '';
    }
    const now = new Date();
    return chalk.gray(`[${now.toISOString()}] `);
  }

  /**
   * Log debug message (most verbose)
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(
        this.getTimestamp() + chalk.gray('[DEBUG]'),
        chalk.gray(message),
        ...args.map(arg => chalk.gray(typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg))
      );
    }
  }

  /**
   * Log verbose message
   */
  verbose(message: string, ...args: any[]): void {
    if (this.shouldLog('verbose')) {
      console.log(
        this.getTimestamp() + chalk.blue('[VERBOSE]'),
        message,
        ...args
      );
    }
  }

  /**
   * Log info message (default level)
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(message, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(
        chalk.yellow('⚠️ '),
        chalk.yellow(message),
        ...args.map(arg => chalk.yellow(typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg))
      );
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown): void {
    if (this.shouldLog('error')) {
      console.error(chalk.red('❌'), chalk.red(message));
      
      if (error && this.level === 'debug') {
        if (error instanceof Error) {
          console.error(chalk.red('   Error:', error.message));
          if (error.stack) {
            console.error(chalk.gray('   Stack:'));
            console.error(chalk.gray(error.stack.split('\n').map(line => '     ' + line).join('\n')));
          }
        } else {
          console.error(chalk.red('   Details:', JSON.stringify(error, null, 2)));
        }
      }
    }
  }

  /**
   * Log success message (always shown unless silent)
   */
  success(message: string): void {
    if (this.level !== 'silent') {
      console.log(chalk.green('✅'), chalk.green(message));
    }
  }

  /**
   * Create a spinner for long-running operations
   */
  spinner(message: string): { stop: () => void; succeed: (msg?: string) => void; fail: (msg?: string) => void } {
    if (this.level === 'silent') {
      return {
        stop: () => {},
        succeed: () => {},
        fail: () => {}
      };
    }

    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    let interval: NodeJS.Timeout | null = null;

    const start = () => {
      if (this.shouldLog('info')) {
        interval = setInterval(() => {
          process.stdout.write(`\r${chalk.cyan(frames[i])} ${message}`);
          i = (i + 1) % frames.length;
        }, 80);
      }
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
        process.stdout.write('\r' + ' '.repeat(message.length + 3) + '\r');
      }
    };

    const succeed = (msg?: string) => {
      stop();
      if (this.shouldLog('info')) {
        console.log(chalk.green('✅'), msg || message);
      }
    };

    const fail = (msg?: string) => {
      stop();
      if (this.shouldLog('error')) {
        console.log(chalk.red('❌'), chalk.red(msg || message));
      }
    };

    start();
    return { stop, succeed, fail };
  }

  /**
   * Create a progress bar for tracking operations
   */
  progress(total: number, label: string = 'Progress'): { update: (current: number) => void; complete: () => void } {
    let current = 0;
    
    const update = (value: number) => {
      if (!this.shouldLog('info')) return;
      
      current = Math.min(value, total);
      const percentage = Math.round((current / total) * 100);
      const barLength = 30;
      const filled = Math.round((current / total) * barLength);
      const empty = barLength - filled;
      
      const bar = chalk.green('█').repeat(filled) + chalk.gray('░').repeat(empty);
      process.stdout.write(`\r${label}: ${bar} ${percentage}%`);
      
      if (current === total) {
        process.stdout.write('\n');
      }
    };

    const complete = () => {
      update(total);
    };

    return { update, complete };
  }

  /**
   * Log a section header
   */
  section(title: string): void {
    if (this.shouldLog('info')) {
      console.log();
      console.log(chalk.cyan.bold(`═══ ${title} ═══`));
      console.log();
    }
  }

  /**
   * Log a subsection header
   */
  subsection(title: string): void {
    if (this.shouldLog('info')) {
      console.log();
      console.log(chalk.cyan(`▶ ${title}`));
    }
  }

  /**
   * Log a list item
   */
  listItem(item: string, indent: number = 1): void {
    if (this.shouldLog('info')) {
      const indentation = '  '.repeat(indent);
      console.log(`${indentation}${chalk.gray('•')} ${item}`);
    }
  }

  /**
   * Log a key-value pair
   */
  keyValue(key: string, value: string | number | boolean, indent: number = 1): void {
    if (this.shouldLog('info')) {
      const indentation = '  '.repeat(indent);
      console.log(`${indentation}${chalk.gray(key + ':')} ${value}`);
    }
  }

  /**
   * Create a blank line
   */
  newline(): void {
    if (this.shouldLog('info')) {
      console.log();
    }
  }
}