/**
 * Tests for enhanced platform detection and validation utilities
 */

import {
  getPlatformInfo,
  detectPlatform,
  detectWSL,
  detectDocker,
  validateAmazonQCLI,
  getAmazonQSearchPaths,
  resolveEnvironmentVariables,
  getPathSeparator,
  normalizePlatformPath,
  joinPaths,
  getTempDirectory,
  getConfigDirectory,
  getScriptExtension,
  getMakeExecutableCommand,
  getShellCommand,
  getEnvironmentPaths,
  addToPath,
  getShellProfilePath,
  isPathSafe
} from './platform-enhanced';
import { Platform } from '../types';

// Mock fs and child_process modules
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  statSync: jest.fn()
}));

jest.mock('child_process', () => ({
  exec: jest.fn()
}));

jest.mock('os', () => ({
  platform: jest.fn(),
  release: jest.fn(() => '10.0.0'),
  arch: jest.fn(() => 'x64'),
  homedir: jest.fn(() => '/home/test')
}));

import { existsSync, statSync } from 'fs';
import { exec } from 'child_process';
import { platform as osPlatform } from 'os';

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockStatSync = statSync as jest.MockedFunction<typeof statSync>;
const mockExec = exec as jest.MockedFunction<typeof exec>;
const mockOsPlatform = osPlatform as jest.MockedFunction<typeof osPlatform>;

describe('Platform Enhanced Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.TEST_VAR;
    delete process.env.USERPROFILE;
    delete process.env.APPDATA;
  });

  describe('detectPlatform', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should detect macOS correctly', async () => {
      mockOsPlatform.mockReturnValue('darwin');

      const platform = await detectPlatform();
      expect(platform).toBe(Platform.MAC);
    });

    it('should detect Windows correctly', async () => {
      mockOsPlatform.mockReturnValue('win32');

      const platform = await detectPlatform();
      expect(platform).toBe(Platform.WINDOWS);
    });

    it('should detect Linux correctly', async () => {
      mockOsPlatform.mockReturnValue('linux');

      // Mock WSL detection to return false
      mockExistsSync.mockReturnValue(false);
      mockExec.mockImplementation((_command: string, callback: any) => {
        callback(new Error('Command not found'));
        return {} as any; // Return mock ChildProcess
      });

      const platform = await detectPlatform();
      expect(platform).toBe(Platform.LINUX);
    });

    it('should default unknown platforms to Linux', async () => {
      mockOsPlatform.mockReturnValue('unknown' as any);

      const platform = await detectPlatform();
      expect(platform).toBe(Platform.LINUX);
    });
  });

  describe('detectWSL', () => {
    it('should return false for non-Linux platforms', async () => {
      mockOsPlatform.mockReturnValue('darwin');

      const isWSL = await detectWSL();
      expect(isWSL).toBe(false);
    });

    it('should detect WSL via special file', async () => {
      mockOsPlatform.mockReturnValue('linux');

      mockExistsSync.mockReturnValue(true);

      const isWSL = await detectWSL();
      expect(isWSL).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith('/proc/sys/fs/binfmt_misc/WSLInterop');
    });

    it('should detect WSL via kernel version', async () => {
      mockOsPlatform.mockReturnValue('linux');

      mockExistsSync.mockReturnValue(false);
      mockExec.mockImplementation((_command: string, callback: any) => {
        callback(null, { stdout: '5.10.16.3-microsoft-standard-WSL2' });
        return {} as any; // Return mock ChildProcess
      });

      const isWSL = await detectWSL();
      expect(isWSL).toBe(true);
    });
  });

  describe('detectDocker', () => {
    it('should detect Docker via .dockerenv', async () => {
      mockExistsSync.mockImplementation((path) => path === '/.dockerenv');

      const isDocker = await detectDocker();
      expect(isDocker).toBe(true);
    });

    it('should detect Docker via .containerenv', async () => {
      mockExistsSync.mockImplementation((path) => path === '/run/.containerenv');

      const isDocker = await detectDocker();
      expect(isDocker).toBe(true);
    });

    it('should return false if no Docker indicators', async () => {
      mockExistsSync.mockReturnValue(false);

      const isDocker = await detectDocker();
      expect(isDocker).toBe(false);
    });
  });

  describe('validateAmazonQCLI', () => {
    it('should return not found when binary does not exist', async () => {
      mockExistsSync.mockReturnValue(false);
      mockExec.mockImplementation((_command: string, callback: any) => {
        callback(new Error('Command not found'));
        return {} as any; // Return mock ChildProcess
      });

      const validation = await validateAmazonQCLI();
      expect(validation.isInstalled).toBe(false);
      expect(validation.path).toBe(null);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate successful installation', async () => {
      const mockPath = '/usr/local/bin/q';
      mockOsPlatform.mockReturnValue('linux'); // Ensure we're testing on Linux
      
      mockExec.mockImplementation((command: string, callback: any) => {
        if (command.includes('which')) {
          callback(null, { stdout: mockPath });
        } else if (command.includes('--version')) {
          callback(null, { stdout: 'Amazon Q CLI v1.2.3' });
        } else {
          callback(new Error('Command not found'));
        }
        return {} as any; // Return mock ChildProcess
      });

      mockExistsSync.mockImplementation((path: any) => String(path) === mockPath);
      mockStatSync.mockReturnValue({
        isFile: () => true,
        mode: 0o755
      } as any);

      const validation = await validateAmazonQCLI();
      expect(validation.isInstalled).toBe(true);
      expect(validation.path).toBe(mockPath);
      expect(validation.version).toBe('1.2.3');
      expect(validation.isAccessible).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('getAmazonQSearchPaths', () => {
    it('should return Windows paths for Windows platform', () => {
      const paths = getAmazonQSearchPaths(Platform.WINDOWS);
      expect(paths).toContain('C:\\Program Files\\Amazon\\Q\\q.exe');
      expect(paths).toContain('%LOCALAPPDATA%\\Amazon\\Q\\q.exe');
    });

    it('should return macOS paths for Mac platform', () => {
      const paths = getAmazonQSearchPaths(Platform.MAC);
      expect(paths).toContain('/usr/local/bin/q');
      expect(paths).toContain('/opt/homebrew/bin/q');
    });

    it('should return Linux paths for Linux platform', () => {
      const paths = getAmazonQSearchPaths(Platform.LINUX);
      expect(paths).toContain('/usr/local/bin/q');
      expect(paths).toContain('/usr/bin/q');
    });
  });

  describe('resolveEnvironmentVariables', () => {
    beforeEach(() => {
      process.env.TEST_VAR = 'test_value';
      process.env.USERPROFILE = 'C:\\Users\\test';
    });

    it('should resolve Windows environment variables', () => {
      const path = '%USERPROFILE%\\Documents\\%TEST_VAR%';
      const resolved = resolveEnvironmentVariables(path, Platform.WINDOWS);
      expect(resolved).toContain('C:\\Users\\test');
      expect(resolved).toContain('test_value');
    });

    it('should resolve Unix environment variables', () => {
      const path = '$HOME/Documents/$TEST_VAR';
      const resolved = resolveEnvironmentVariables(path, Platform.LINUX);
      expect(resolved).toContain('test_value');
    });

    it('should resolve Unix environment variables with braces', () => {
      const path = '${HOME}/Documents/${TEST_VAR}';
      const resolved = resolveEnvironmentVariables(path, Platform.LINUX);
      expect(resolved).toContain('test_value');
    });

    it('should handle home directory substitution', () => {
      const path = '~/Documents/file.txt';
      const resolved = resolveEnvironmentVariables(path, Platform.LINUX);
      expect(resolved.startsWith('~')).toBe(false);
    });
  });

  describe('Path utilities', () => {
    it('should return correct path separators', () => {
      expect(getPathSeparator(Platform.WINDOWS)).toBe('\\');
      expect(getPathSeparator(Platform.MAC)).toBe('/');
      expect(getPathSeparator(Platform.LINUX)).toBe('/');
    });

    it('should normalize paths correctly', () => {
      const windowsPath = 'C:/Users/test\\Documents';
      const normalized = normalizePlatformPath(windowsPath, Platform.WINDOWS);
      expect(normalized).toContain('\\');
      expect(normalized).not.toContain('/');
    });

    it('should join paths with correct separators', () => {
      const joined = joinPaths(Platform.WINDOWS, 'C:', 'Users', 'test', 'Documents');
      expect(joined).toContain('\\');
      
      const joinedUnix = joinPaths(Platform.LINUX, '/home', 'user', 'documents');
      expect(joinedUnix).toContain('/');
    });
  });

  describe('Directory utilities', () => {
    it('should return correct temp directories', () => {
      // Save original env
      const originalTmpDir = process.env.TMPDIR;
      const originalTemp = process.env.TEMP;
      const originalTmp = process.env.TMP;
      
      // Test Windows with TEMP env var
      process.env.TEMP = 'C:\\Windows\\Temp';
      const windowsTemp = getTempDirectory(Platform.WINDOWS);
      expect(windowsTemp.toLowerCase()).toContain('temp');
      
      // Test Linux without TMPDIR (should default to /tmp)
      delete process.env.TMPDIR;
      const linuxTemp = getTempDirectory(Platform.LINUX);
      expect(linuxTemp).toBe('/tmp');
      
      // Restore original env
      if (originalTmpDir) process.env.TMPDIR = originalTmpDir;
      if (originalTemp) process.env.TEMP = originalTemp;
      if (originalTmp) process.env.TMP = originalTmp;
    });

    it('should return correct config directories', () => {
      const windowsConfig = getConfigDirectory(Platform.WINDOWS);
      expect(windowsConfig).toContain('AppData');
      
      const macConfig = getConfigDirectory(Platform.MAC);
      expect(macConfig).toContain('Library/Application Support');
      
      const linuxConfig = getConfigDirectory(Platform.LINUX);
      expect(linuxConfig).toContain('.config');
    });
  });

  describe('Script utilities', () => {
    it('should return correct script extensions', () => {
      expect(getScriptExtension(Platform.WINDOWS)).toBe('.ps1');
      expect(getScriptExtension(Platform.MAC)).toBe('.sh');
      expect(getScriptExtension(Platform.LINUX)).toBe('.sh');
    });

    it('should return correct chmod commands', () => {
      const windowsCmd = getMakeExecutableCommand(Platform.WINDOWS, 'script.ps1');
      expect(windowsCmd).toBe(null);
      
      const unixCmd = getMakeExecutableCommand(Platform.LINUX, 'script.sh');
      expect(unixCmd).toContain('chmod +x');
    });

    it('should return correct shell commands', () => {
      const windowsCmd = getShellCommand(Platform.WINDOWS, 'script.ps1');
      expect(windowsCmd).toContain('powershell.exe');
      
      const unixCmd = getShellCommand(Platform.LINUX, 'script.sh');
      expect(unixCmd).toContain('bash');
    });
  });

  describe('Environment PATH utilities', () => {
    const originalPath = process.env.PATH;

    beforeEach(() => {
      process.env.PATH = '/usr/local/bin:/usr/bin:/bin';
    });

    afterEach(() => {
      process.env.PATH = originalPath;
    });

    it('should parse environment paths correctly', () => {
      const paths = getEnvironmentPaths(Platform.LINUX);
      expect(paths).toContain('/usr/local/bin');
      expect(paths).toContain('/usr/bin');
      expect(paths).toContain('/bin');
    });

    it('should add new paths to PATH', () => {
      const newPath = addToPath(Platform.LINUX, '/opt/new/bin');
      expect(newPath.startsWith('/opt/new/bin:')).toBe(true);
    });
  });

  describe('Shell profile utilities', () => {
    it('should return correct profile paths', () => {
      const zshProfile = getShellProfilePath(Platform.MAC, 'zsh');
      expect(zshProfile).toContain('.zshrc');
      
      const bashProfile = getShellProfilePath(Platform.LINUX, 'bash');
      expect(bashProfile).toContain('.bashrc');
      
      const fishProfile = getShellProfilePath(Platform.LINUX, 'fish');
      expect(fishProfile).toContain('config.fish');
    });
  });

  describe('Path safety', () => {
    it('should identify unsafe paths', () => {
      expect(isPathSafe('../../../etc/passwd')).toBe(false);
      expect(isPathSafe('/etc/passwd')).toBe(false);
      expect(isPathSafe('folder/../../../etc')).toBe(false);
    });

    it('should identify safe paths', () => {
      expect(isPathSafe('documents/file.txt')).toBe(true);
      expect(isPathSafe('folder/subfolder/file')).toBe(true);
    });
  });

  describe('getPlatformInfo', () => {
    it('should return comprehensive platform information', async () => {
      mockExistsSync.mockReturnValue(false);
      mockExec.mockImplementation((_command: string, callback: any) => {
        callback(new Error('Command not found'));
        return {} as any; // Return mock ChildProcess
      });

      const info = await getPlatformInfo();
      
      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('os');
      expect(info).toHaveProperty('arch');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('isWSL');
      expect(info).toHaveProperty('isDocker');
      expect(info).toHaveProperty('shell');
      expect(info).toHaveProperty('homePath');
      expect(info).toHaveProperty('tempPath');
      
      expect(typeof info.isWSL).toBe('boolean');
      expect(typeof info.isDocker).toBe('boolean');
    });
  });
});