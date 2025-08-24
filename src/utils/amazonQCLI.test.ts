/**
 * Tests for Amazon Q CLI Wrapper
 */

import { AmazonQCLIWrapper, AmazonQPrompt, AmazonQResponse } from './amazonQCLI';
import { Logger } from './logger';
import { existsSync } from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock fs-extra
jest.mock('fs-extra', () => ({
  mkdirSync: jest.fn()
}));

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
  exec: jest.fn()
}));

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('AmazonQCLIWrapper', () => {
  let wrapper: AmazonQCLIWrapper;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
    logger.setLevel('error'); // Reduce test noise
    jest.clearAllMocks();
    
    // Mock CLI path exists
    mockExistsSync.mockImplementation((path) => {
      return path === '/usr/local/bin/q' || path.toString().includes('.tmp-amazonq');
    });
  });

  describe('constructor', () => {
    it('should create wrapper with default options', () => {
      wrapper = new AmazonQCLIWrapper(logger);
      
      const info = wrapper.getCLIInfo();
      expect(info.timeout).toBe(300000); // 5 minutes
      expect(info.debugEnabled).toBe(false);
      expect(info.dryRunMode).toBe(false);
    });

    it('should create wrapper with custom options', () => {
      wrapper = new AmazonQCLIWrapper(logger, {
        cliPath: '/custom/path/q',
        timeout: 60000,
        debug: true,
        dryRun: true
      });

      const info = wrapper.getCLIInfo();
      expect(info.cliPath).toBe('/custom/path/q');
      expect(info.timeout).toBe(60000);
      expect(info.debugEnabled).toBe(true);
      expect(info.dryRunMode).toBe(true);
    });

    it('should detect CLI path automatically', () => {
      mockExistsSync.mockReturnValue(true);
      wrapper = new AmazonQCLIWrapper(logger);
      
      const info = wrapper.getCLIInfo();
      expect(info.cliPath).toBeTruthy();
    });
  });

  describe('formatStructuredPrompt', () => {
    beforeEach(() => {
      wrapper = new AmazonQCLIWrapper(logger, { dryRun: true });
    });

    it('should format basic prompt', () => {
      const prompt: AmazonQPrompt = {
        content: 'Generate a feature specification for user authentication'
      };

      const formatted = wrapper.formatStructuredPrompt(prompt);
      
      expect(formatted).toContain('=== MAIN PROMPT ===');
      expect(formatted).toContain('Generate a feature specification for user authentication');
    });

    it('should format prompt with metadata', () => {
      const prompt: AmazonQPrompt = {
        content: 'Generate requirements document',
        metadata: {
          feature: 'user-auth',
          phase: 'requirements',
          language: 'English',
          projectContext: {
            technology: 'Node.js',
            architecture: 'microservices'
          }
        }
      };

      const formatted = wrapper.formatStructuredPrompt(prompt);
      
      expect(formatted).toContain('=== CONTEXT METADATA ===');
      expect(formatted).toContain('Feature: user-auth');
      expect(formatted).toContain('Phase: requirements');
      expect(formatted).toContain('Language: English');
      expect(formatted).toContain('technology: Node.js');
      expect(formatted).toContain('architecture: microservices');
    });

    it('should format prompt with context files', () => {
      const prompt: AmazonQPrompt = {
        content: 'Review the existing code',
        contextFiles: [
          'src/auth/user.js',
          'docs/requirements.md'
        ]
      };

      const formatted = wrapper.formatStructuredPrompt(prompt);
      
      expect(formatted).toContain('=== CONTEXT FILES ===');
      expect(formatted).toContain('src/auth/user.js');
      expect(formatted).toContain('docs/requirements.md');
    });
  });

  describe('executePrompt', () => {
    beforeEach(() => {
      wrapper = new AmazonQCLIWrapper(logger, { dryRun: true });
    });

    it('should execute prompt in dry run mode', async () => {
      const prompt: AmazonQPrompt = {
        content: 'Test prompt'
      };

      const response = await wrapper.executePrompt(prompt);
      
      expect(response.success).toBe(true);
      expect(response.content).toContain('[MOCK RESPONSE');
      expect(response.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle execution errors gracefully', async () => {
      wrapper = new AmazonQCLIWrapper(logger, { 
        cliPath: '/nonexistent/path',
        dryRun: false 
      });

      const prompt: AmazonQPrompt = {
        content: 'Test prompt'
      };

      const response = await wrapper.executePrompt(prompt);
      
      expect(response.success).toBe(false);
      expect(response.exitCode).toBe(-1);
      expect(response.parseErrors).toBeDefined();
    });
  });

  describe('executePromptSequence', () => {
    beforeEach(() => {
      wrapper = new AmazonQCLIWrapper(logger, { dryRun: true });
    });

    it('should execute multiple prompts in sequence', async () => {
      const prompts: AmazonQPrompt[] = [
        { content: 'First prompt' },
        { content: 'Second prompt' },
        { content: 'Third prompt' }
      ];

      const results = await wrapper.executePromptSequence(prompts);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should stop sequence on first failure', async () => {
      // Create wrapper that will fail
      wrapper = new AmazonQCLIWrapper(logger, { 
        cliPath: '/nonexistent/path',
        dryRun: false 
      });

      const prompts: AmazonQPrompt[] = [
        { content: 'First prompt' },
        { content: 'Second prompt' },
        { content: 'Third prompt' }
      ];

      const results = await wrapper.executePromptSequence(prompts);
      
      expect(results).toHaveLength(1); // Should stop after first failure
      expect(results[0].success).toBe(false);
    });
  });

  describe('validateResponse', () => {
    beforeEach(() => {
      wrapper = new AmazonQCLIWrapper(logger);
    });

    it('should validate successful response', () => {
      const response: AmazonQResponse = {
        content: 'Valid response content',
        success: true,
        exitCode: 0,
        stdout: 'Valid response content',
        stderr: '',
        executionTime: 1000
      };

      const errors = wrapper.validateResponse(response);
      expect(errors).toHaveLength(0);
    });

    it('should detect failed response', () => {
      const response: AmazonQResponse = {
        content: '',
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: 'Command failed',
        executionTime: 1000
      };

      const errors = wrapper.validateResponse(response);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Command failed with exit code 1');
    });

    it('should detect empty successful response', () => {
      const response: AmazonQResponse = {
        content: '',
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        executionTime: 1000
      };

      const errors = wrapper.validateResponse(response);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('successful but contains no content');
    });

    it('should detect timeout issues', () => {
      const response: AmazonQResponse = {
        content: 'Response',
        success: true,
        exitCode: 0,
        stdout: 'Response',
        stderr: '',
        executionTime: 400000 // Exceeds default timeout
      };

      const errors = wrapper.validateResponse(response);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('exceeded timeout');
    });
  });

  describe('checkCLIAvailability', () => {
    beforeEach(() => {
      wrapper = new AmazonQCLIWrapper(logger);
    });

    it('should detect CLI availability', async () => {
      // Mock successful exec
      const { exec } = require('child_process');
      exec.mockImplementation((_cmd: string, _options: any, callback: Function) => {
        callback(null, { stdout: 'Amazon Q CLI v1.0.0', stderr: '' });
      });

      const result = await wrapper.checkCLIAvailability();
      
      expect(result.available).toBe(true);
      expect(result.version).toBe('Amazon Q CLI v1.0.0');
    });

    it('should handle CLI unavailability', async () => {
      // Mock failed exec
      const { exec } = require('child_process');
      exec.mockImplementation((_cmd: string, _options: any, callback: Function) => {
        callback(new Error('Command not found'));
      });

      const result = await wrapper.checkCLIAvailability();
      
      expect(result.available).toBe(false);
      expect(result.error).toContain('Command not found');
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      wrapper = new AmazonQCLIWrapper(logger);
    });

    it('should clean up temporary files', async () => {
      await wrapper.cleanup();
      
      const info = wrapper.getCLIInfo();
      expect(info.tempFilesActive).toBe(0);
    });
  });

  describe('getCLIInfo', () => {
    it('should return CLI configuration information', () => {
      wrapper = new AmazonQCLIWrapper(logger, {
        cliPath: '/test/path',
        timeout: 60000,
        debug: true,
        dryRun: true
      });

      const info = wrapper.getCLIInfo();
      
      expect(info).toEqual({
        cliPath: '/test/path',
        timeout: 60000,
        workingDirectory: expect.any(String),
        debugEnabled: true,
        dryRunMode: true,
        tempFilesActive: 0
      });
    });
  });
});