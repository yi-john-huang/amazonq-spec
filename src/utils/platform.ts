/**
 * Platform detection and utilities
 * Handles OS detection and platform-specific operations
 */

import { platform as osPlatform } from 'os';
import { Platform } from '../types';

/**
 * Detect the current platform
 */
export async function detectPlatform(): Promise<Platform> {
  const platform = osPlatform();
  
  switch (platform) {
    case 'darwin':
      return Platform.MAC;
    case 'win32':
      return Platform.WINDOWS;
    case 'linux':
    case 'freebsd':
    case 'openbsd':
      return Platform.LINUX;
    default:
      // Default to Linux for unknown Unix-like systems
      return Platform.LINUX;
  }
}

/**
 * Get the file extension for shell scripts on the current platform
 */
export function getScriptExtension(platform: Platform): string {
  switch (platform) {
    case Platform.WINDOWS:
      return '.ps1';
    case Platform.MAC:
    case Platform.LINUX:
      return '.sh';
    default:
      return '.sh';
  }
}

/**
 * Get the shell command to make a file executable
 */
export function getChmodCommand(platform: Platform, filePath: string): string | null {
  switch (platform) {
    case Platform.MAC:
    case Platform.LINUX:
      return `chmod +x "${filePath}"`;
    case Platform.WINDOWS:
      // Windows doesn't need chmod
      return null;
    default:
      return null;
  }
}

/**
 * Get the default shell for the platform
 */
export function getDefaultShell(platform: Platform): string {
  switch (platform) {
    case Platform.WINDOWS:
      return 'powershell';
    case Platform.MAC:
      // macOS Catalina+ uses zsh by default
      return 'zsh';
    case Platform.LINUX:
      return 'bash';
    default:
      return 'bash';
  }
}

/**
 * Get the user's home directory path
 */
export function getHomePath(platform: Platform): string {
  const homeVar = platform === Platform.WINDOWS ? 'USERPROFILE' : 'HOME';
  return process.env[homeVar] || '~';
}

/**
 * Get the path separator for the platform
 */
export function getPathSeparator(platform: Platform): string {
  return platform === Platform.WINDOWS ? '\\' : '/';
}

/**
 * Normalize a path for the current platform
 */
export function normalizePath(path: string, platform: Platform): string {
  const separator = getPathSeparator(platform);
  const wrongSeparator = separator === '/' ? '\\' : '/';
  return path.replace(new RegExp(`\\${wrongSeparator}`, 'g'), separator);
}

/**
 * Get common binary paths for the platform
 */
export function getCommonBinaryPaths(platform: Platform): string[] {
  switch (platform) {
    case Platform.WINDOWS:
      return [
        'C:\\Program Files\\Amazon\\Q',
        'C:\\Program Files (x86)\\Amazon\\Q',
        '%LOCALAPPDATA%\\Amazon\\Q',
        '%APPDATA%\\Amazon\\Q',
        '%ProgramFiles%\\Amazon\\Q'
      ];
    case Platform.MAC:
      return [
        '/usr/local/bin',
        '/opt/homebrew/bin',
        '/usr/bin',
        '/Applications/Amazon Q.app/Contents/MacOS',
        '~/Applications/Amazon Q.app/Contents/MacOS',
        '~/.local/bin'
      ];
    case Platform.LINUX:
      return [
        '/usr/local/bin',
        '/usr/bin',
        '/opt/amazon-q',
        '~/.local/bin',
        '/snap/bin'
      ];
    default:
      return ['/usr/local/bin', '/usr/bin'];
  }
}

/**
 * Get the command to check if Amazon Q CLI exists
 */
export function getAmazonQCheckCommand(platform: Platform): string {
  switch (platform) {
    case Platform.WINDOWS:
      return 'where.exe q';
    case Platform.MAC:
    case Platform.LINUX:
      return 'which q';
    default:
      return 'which q';
  }
}

/**
 * Get environment variable syntax for the platform
 */
export function getEnvVarSyntax(platform: Platform, varName: string): string {
  switch (platform) {
    case Platform.WINDOWS:
      return `$env:${varName}`;
    case Platform.MAC:
    case Platform.LINUX:
      return `$${varName}`;
    default:
      return `$${varName}`;
  }
}

/**
 * Check if the platform supports ANSI colors in terminal
 */
export function supportsColor(platform: Platform): boolean {
  // Most modern terminals support colors
  if (process.env.NO_COLOR) {
    return false;
  }
  
  if (platform === Platform.WINDOWS) {
    // Windows 10+ supports ANSI colors
    const osRelease = require('os').release();
    const majorVersion = parseInt(osRelease.split('.')[0], 10);
    return majorVersion >= 10;
  }
  
  return true;
}

/**
 * Get platform-specific configuration directory
 */
export function getConfigDirectory(platform: Platform): string {
  switch (platform) {
    case Platform.WINDOWS:
      return process.env.APPDATA || `${getHomePath(platform)}\\AppData\\Roaming`;
    case Platform.MAC:
      return `${getHomePath(platform)}/Library/Application Support`;
    case Platform.LINUX:
      return process.env.XDG_CONFIG_HOME || `${getHomePath(platform)}/.config`;
    default:
      return `${getHomePath(platform)}/.config`;
  }
}

/**
 * Get the command prefix for running scripts
 */
export function getScriptPrefix(platform: Platform): string {
  switch (platform) {
    case Platform.WINDOWS:
      return 'powershell.exe -ExecutionPolicy Bypass -File';
    case Platform.MAC:
    case Platform.LINUX:
      return 'bash';
    default:
      return 'sh';
  }
}