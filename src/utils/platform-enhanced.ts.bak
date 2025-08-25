/**
 * Enhanced platform detection and validation utilities
 * Provides comprehensive OS detection, path handling, and environment management
 */

import { platform as osPlatform, release, arch, homedir } from 'os';
import { existsSync, statSync } from 'fs';
import { join, resolve, normalize, isAbsolute } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Platform } from '../types';

const execAsync = promisify(exec);

/**
 * Platform information interface
 */
export interface PlatformInfo {
  platform: Platform;
  os: string;
  arch: string;
  version: string;
  isWSL: boolean;
  isDocker: boolean;
  shell: string;
  homePath: string;
  tempPath: string;
}

/**
 * Amazon Q CLI validation result
 */
export interface AmazonQValidation {
  isInstalled: boolean;
  path: string | null;
  version: string | null;
  isAccessible: boolean;
  errors: string[];
}

/**
 * Get comprehensive platform information
 */
export async function getPlatformInfo(): Promise<PlatformInfo> {
  const platform = await detectPlatform();
  const isWSL = await detectWSL();
  const isDocker = await detectDocker();
  const shell = await detectShell();
  
  return {
    platform,
    os: osPlatform(),
    arch: arch(),
    version: release(),
    isWSL,
    isDocker,
    shell,
    homePath: homedir(),
    tempPath: getTempDirectory(platform)
  };
}

/**
 * Enhanced platform detection with WSL and Docker support
 */
export async function detectPlatform(): Promise<Platform> {
  const platform = osPlatform();
  
  // Check for WSL (Windows Subsystem for Linux)
  if (platform === 'linux') {
    const isWSL = await detectWSL();
    if (isWSL) {
      // WSL should be treated as Windows for path compatibility
      return Platform.WINDOWS;
    }
  }
  
  switch (platform) {
    case 'darwin':
      return Platform.MAC;
    case 'win32':
      return Platform.WINDOWS;
    case 'linux':
    case 'freebsd':
    case 'openbsd':
    case 'sunos':
    case 'aix':
      return Platform.LINUX;
    default:
      // Default to Linux for unknown Unix-like systems
      return Platform.LINUX;
  }
}

/**
 * Detect if running in WSL environment
 */
export async function detectWSL(): Promise<boolean> {
  if (osPlatform() !== 'linux') {
    return false;
  }
  
  try {
    // Check for WSL-specific files
    if (existsSync('/proc/sys/fs/binfmt_misc/WSLInterop')) {
      return true;
    }
    
    // Check for WSL in kernel version
    const { stdout } = await execAsync('uname -r');
    return stdout.toLowerCase().includes('microsoft') || stdout.toLowerCase().includes('wsl');
  } catch {
    return false;
  }
}

/**
 * Detect if running in Docker container
 */
export async function detectDocker(): Promise<boolean> {
  try {
    return existsSync('/.dockerenv') || existsSync('/run/.containerenv');
  } catch {
    return false;
  }
}

/**
 * Detect the current shell
 */
export async function detectShell(): Promise<string> {
  const platform = await detectPlatform();
  
  if (platform === Platform.WINDOWS) {
    // Check for PowerShell Core first, then Windows PowerShell
    try {
      await execAsync('pwsh --version');
      return 'pwsh';
    } catch {
      return 'powershell';
    }
  }
  
  // Unix-like systems
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (shell.includes('fish')) return 'fish';
  if (shell.includes('sh')) return 'sh';
  
  // Default based on platform
  return platform === Platform.MAC ? 'zsh' : 'bash';
}

/**
 * Validate and detect Amazon Q CLI installation
 */
export async function validateAmazonQCLI(): Promise<AmazonQValidation> {
  const result: AmazonQValidation = {
    isInstalled: false,
    path: null,
    version: null,
    isAccessible: false,
    errors: []
  };
  
  try {
    // Try to find Amazon Q CLI
    const platform = await detectPlatform();
    const qPath = await findAmazonQCLI(platform);
    
    if (!qPath) {
      result.errors.push('Amazon Q CLI not found in PATH or common locations');
      return result;
    }
    
    result.path = qPath;
    
    // Check if the binary is accessible
    if (!existsSync(qPath)) {
      result.errors.push(`Binary not found at: ${qPath}`);
      return result;
    }
    
    // Check permissions
    try {
      const stats = statSync(qPath);
      if (!stats.isFile()) {
        result.errors.push(`Path is not a file: ${qPath}`);
        return result;
      }
      
      // On Unix, check if executable
      if (platform !== Platform.WINDOWS) {
        const isExecutable = (stats.mode & 0o111) !== 0;
        if (!isExecutable) {
          result.errors.push(`Binary is not executable: ${qPath}`);
          return result;
        }
      }
    } catch (error) {
      result.errors.push(`Cannot access binary: ${error}`);
      return result;
    }
    
    // Try to get version
    try {
      const { stdout } = await execAsync(`"${qPath}" --version`);
      const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        result.version = versionMatch[1];
      }
    } catch (error) {
      result.errors.push(`Cannot execute binary: ${error}`);
      return result;
    }
    
    result.isInstalled = true;
    result.isAccessible = true;
    
  } catch (error) {
    result.errors.push(`Validation error: ${error}`);
  }
  
  return result;
}

/**
 * Find Amazon Q CLI binary in system
 */
export async function findAmazonQCLI(platform: Platform): Promise<string | null> {
  // Try 'which' or 'where' command first
  try {
    const command = platform === Platform.WINDOWS ? 'where.exe q' : 'which q';
    const { stdout } = await execAsync(command);
    const path = stdout.trim().split('\n')[0]; // Take first result if multiple
    if (path && existsSync(path)) {
      return path;
    }
  } catch {
    // Command not found, continue with manual search
  }
  
  // Check common installation paths
  const paths = getAmazonQSearchPaths(platform);
  for (const searchPath of paths) {
    const fullPath = resolveEnvironmentVariables(searchPath, platform);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  return null;
}

/**
 * Get Amazon Q CLI search paths for the platform
 */
export function getAmazonQSearchPaths(platform: Platform): string[] {
  const paths: string[] = [];
  
  switch (platform) {
    case Platform.WINDOWS:
      paths.push(
        'C:\\Program Files\\Amazon\\Q\\q.exe',
        'C:\\Program Files (x86)\\Amazon\\Q\\q.exe',
        '%LOCALAPPDATA%\\Amazon\\Q\\q.exe',
        '%APPDATA%\\Amazon\\Q\\q.exe',
        '%ProgramFiles%\\Amazon\\Q\\q.exe',
        '%USERPROFILE%\\.amazonq\\bin\\q.exe',
        '%USERPROFILE%\\AppData\\Local\\Programs\\amazonq\\q.exe'
      );
      break;
      
    case Platform.MAC:
      paths.push(
        '/usr/local/bin/q',
        '/opt/homebrew/bin/q',
        '/usr/bin/q',
        '/Applications/Amazon Q.app/Contents/MacOS/q',
        '/Applications/Amazon Q.app/Contents/Resources/q',
        '~/Applications/Amazon Q.app/Contents/MacOS/q',
        '~/.local/bin/q',
        '~/.amazonq/bin/q',
        '/opt/amazonq/bin/q'
      );
      break;
      
    case Platform.LINUX:
      paths.push(
        '/usr/local/bin/q',
        '/usr/bin/q',
        '/opt/amazon-q/bin/q',
        '/opt/amazonq/bin/q',
        '~/.local/bin/q',
        '~/.amazonq/bin/q',
        '/snap/bin/q',
        '/var/lib/snapd/snap/bin/q',
        '/usr/share/amazonq/bin/q'
      );
      break;
  }
  
  return paths;
}

/**
 * Resolve environment variables in paths
 */
export function resolveEnvironmentVariables(path: string, platform: Platform): string {
  let resolved = path;
  
  // Handle home directory
  if (resolved.startsWith('~')) {
    resolved = resolved.replace(/^~/, homedir());
  }
  
  // Handle environment variables
  if (platform === Platform.WINDOWS) {
    // Windows style: %VAR%
    resolved = resolved.replace(/%([^%]+)%/g, (match, varName) => {
      return process.env[varName] || match;
    });
  } else {
    // Unix style: $VAR or ${VAR}
    resolved = resolved.replace(/\$\{?([A-Z_][A-Z0-9_]*)\}?/gi, (match, varName) => {
      return process.env[varName] || match;
    });
  }
  
  return normalize(resolved);
}

/**
 * Get platform-specific path separator
 */
export function getPathSeparator(platform: Platform): string {
  return platform === Platform.WINDOWS ? '\\' : '/';
}

/**
 * Normalize path for the platform
 */
export function normalizePlatformPath(path: string, platform: Platform): string {
  const separator = getPathSeparator(platform);
  const normalized = normalize(path);
  
  if (platform === Platform.WINDOWS) {
    return normalized.replace(/\//g, separator);
  } else {
    return normalized.replace(/\\/g, separator);
  }
}

/**
 * Join paths with platform-specific separator
 */
export function joinPaths(platform: Platform, ...paths: string[]): string {
  const joined = join(...paths);
  return normalizePlatformPath(joined, platform);
}

/**
 * Get temporary directory for the platform
 */
export function getTempDirectory(platform: Platform): string {
  if (platform === Platform.WINDOWS) {
    return process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp';
  } else {
    return process.env.TMPDIR || '/tmp';
  }
}

/**
 * Get platform-specific config directory
 */
export function getConfigDirectory(platform: Platform): string {
  switch (platform) {
    case Platform.WINDOWS:
      return process.env.APPDATA || joinPaths(platform, homedir(), 'AppData', 'Roaming');
    case Platform.MAC:
      return joinPaths(platform, homedir(), 'Library', 'Application Support');
    case Platform.LINUX:
      return process.env.XDG_CONFIG_HOME || joinPaths(platform, homedir(), '.config');
    default:
      return joinPaths(platform, homedir(), '.config');
  }
}

/**
 * Get script file extension for the platform
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
 * Get command to make file executable
 */
export function getMakeExecutableCommand(platform: Platform, filePath: string): string | null {
  if (platform === Platform.WINDOWS) {
    // Windows doesn't need chmod
    return null;
  }
  return `chmod +x "${filePath}"`;
}

/**
 * Get shell invocation command
 */
export function getShellCommand(platform: Platform, scriptPath: string): string {
  switch (platform) {
    case Platform.WINDOWS:
      return `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`;
    case Platform.MAC:
    case Platform.LINUX:
      return `bash "${scriptPath}"`;
    default:
      return `sh "${scriptPath}"`;
  }
}

/**
 * Check if path is absolute
 */
export function isAbsolutePath(path: string): boolean {
  return isAbsolute(path);
}

/**
 * Resolve path to absolute
 */
export function resolvePath(...paths: string[]): string {
  return resolve(...paths);
}

/**
 * Get environment PATH variable as array
 */
export function getEnvironmentPaths(platform: Platform): string[] {
  const pathVar = platform === Platform.WINDOWS ? process.env.Path || process.env.PATH : process.env.PATH;
  const separator = platform === Platform.WINDOWS ? ';' : ':';
  return (pathVar || '').split(separator).filter(p => p.length > 0);
}

/**
 * Add path to environment PATH
 */
export function addToPath(platform: Platform, newPath: string): string {
  const paths = getEnvironmentPaths(platform);
  if (!paths.includes(newPath)) {
    paths.unshift(newPath);
  }
  const separator = platform === Platform.WINDOWS ? ';' : ':';
  return paths.join(separator);
}

/**
 * Get shell profile file path
 */
export function getShellProfilePath(platform: Platform, shell: string): string {
  const home = homedir();
  
  if (platform === Platform.WINDOWS) {
    return joinPaths(platform, home, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1');
  }
  
  switch (shell) {
    case 'zsh':
      return joinPaths(platform, home, '.zshrc');
    case 'bash':
      // Check for .bash_profile on macOS, .bashrc on Linux
      if (platform === Platform.MAC) {
        return joinPaths(platform, home, '.bash_profile');
      }
      return joinPaths(platform, home, '.bashrc');
    case 'fish':
      return joinPaths(platform, home, '.config', 'fish', 'config.fish');
    default:
      return joinPaths(platform, home, '.profile');
  }
}

/**
 * Validate if a path is safe (no path traversal)
 */
export function isPathSafe(path: string): boolean {
  const normalized = normalize(path);
  return !normalized.includes('..') && !normalized.startsWith('/');
}