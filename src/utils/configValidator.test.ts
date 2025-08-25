/**
 * Tests for ConfigValidator utility
 */

import { ConfigValidator } from './configValidator';
import { Logger } from './logger';
import { writeFileSync, rmSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;
  let logger: Logger;
  let testDir: string;

  beforeEach(() => {
    logger = new Logger();
    logger.setLevel('error');
    validator = new ConfigValidator(logger);
    testDir = join(__dirname, '..', '..', 'test-configs-validator');

    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  describe('validateConfigFile', () => {
    it('should validate a well-formed configuration file', () => {
      const configContent = `# Test Project - Amazon Q CLI Configuration

## Project Context
This project uses Amazon Q CLI for SDD workflow.

## SDD Workflow
Kiro-style Spec-Driven Development approach.

## Available Commands
- kiro:spec-init

## Directory Structure
\`\`\`
.kiro/specs/
\`\`\`

## Development Guidelines
Follow the workflow guidelines.

## Integration Details
{{AMAZON_Q_CLI_PATH}}

## Variables Test
{{PROJECT_NAME}} {{VERSION}} {{TIMESTAMP}}
`;

      const configPath = join(testDir, 'valid-config.md');
      writeFileSync(configPath, configContent, 'utf8');

      const result = validator.validateConfigFile(configPath);

      expect(result.valid).toBe(true);
      expect(result.entityType).toBe('config');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing configuration file', () => {
      const nonExistentPath = join(testDir, 'missing-config.md');

      const result = validator.validateConfigFile(nonExistentPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('CONFIG_FILE_NOT_FOUND');
    });

    it('should detect missing required sections', () => {
      const incompleteConfig = `# Test Project - Amazon Q CLI Configuration

Some content but missing required sections.
`;

      const configPath = join(testDir, 'incomplete-config.md');
      writeFileSync(configPath, incompleteConfig, 'utf8');

      const result = validator.validateConfigFile(configPath);

      expect(result.valid).toBe(true); // Warnings don't make it invalid by default
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === 'MISSING_REQUIRED_SECTION')).toBe(true);
    });

    it('should detect unmatched Handlebars brackets', () => {
      const malformedConfig = `# Test - Amazon Q CLI Configuration

## Project Context
{{PROJECT_NAME} - missing closing bracket

## SDD Workflow
Test content

## Available Commands
Commands here

## Directory Structure
Structure here

## Development Guidelines  
Guidelines here
`;

      const configPath = join(testDir, 'malformed-config.md');
      writeFileSync(configPath, malformedConfig, 'utf8');

      const result = validator.validateConfigFile(configPath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'UNMATCHED_HANDLEBARS_BRACKETS')).toBe(true);
    });

    it('should detect missing core variables', () => {
      const configWithoutVariables = `# Test - Amazon Q CLI Configuration

## Project Context
Static content without variables

## SDD Workflow  
Test content

## Available Commands
Commands here

## Directory Structure
Structure here

## Development Guidelines
Guidelines here
`;

      const configPath = join(testDir, 'no-variables-config.md');
      writeFileSync(configPath, configWithoutVariables, 'utf8');

      const result = validator.validateConfigFile(configPath);

      expect(result.warnings.some(w => w.code === 'MISSING_CORE_VARIABLE')).toBe(true);
    });

    it('should detect missing Amazon Q CLI references', () => {
      const configWithoutAmazonQ = `# Test Project Configuration

## Project Context
Regular project configuration

## Workflow
Some workflow

## Commands
Some commands

## Directory Structure
Structure here

## Guidelines
Guidelines here
`;

      const configPath = join(testDir, 'no-amazonq-config.md');
      writeFileSync(configPath, configWithoutAmazonQ, 'utf8');

      const result = validator.validateConfigFile(configPath);

      expect(result.warnings.some(w => w.code === 'MISSING_AMAZONQ_REFERENCE')).toBe(true);
    });

    it('should detect missing SDD workflow references', () => {
      const configWithoutSDD = `# Test Project - Amazon Q CLI Configuration  

## Project Context
This project uses Amazon Q CLI.

## Workflow  
Regular workflow

## Commands
Commands here

## Directory Structure
Structure here

## Guidelines
Guidelines here
`;

      const configPath = join(testDir, 'no-sdd-config.md');
      writeFileSync(configPath, configWithoutSDD, 'utf8');

      const result = validator.validateConfigFile(configPath);

      expect(result.warnings.some(w => w.code === 'MISSING_SDD_REFERENCE')).toBe(true);
    });

    it('should detect duplicate sections', () => {
      const configWithDuplicates = `# Test - Amazon Q CLI Configuration

## Project Context
First context section

## Project Context  
Duplicate context section

## SDD Workflow
Test content

## Available Commands
Commands here

## Directory Structure
Structure here

## Development Guidelines
Guidelines here
`;

      const configPath = join(testDir, 'duplicate-sections-config.md');
      writeFileSync(configPath, configWithDuplicates, 'utf8');

      const result = validator.validateConfigFile(configPath);

      expect(result.warnings.some(w => w.code === 'DUPLICATE_SECTION')).toBe(true);
    });

    it('should detect short configuration files', () => {
      const shortConfig = `# Test

Short config.
`;

      const configPath = join(testDir, 'short-config.md');
      writeFileSync(configPath, shortConfig, 'utf8');

      const result = validator.validateConfigFile(configPath);

      expect(result.warnings.some(w => w.code === 'CONFIGURATION_TOO_SHORT')).toBe(true);
    });

    it('should detect placeholder text', () => {
      const configWithPlaceholders = `# Test - Amazon Q CLI Configuration

## Project Context
TODO: Add project description

## SDD Workflow
FIXME: Update workflow description

## Available Commands
Commands here

## Directory Structure  
Structure here

## Development Guidelines
Guidelines here
`;

      const configPath = join(testDir, 'placeholder-config.md');
      writeFileSync(configPath, configWithPlaceholders, 'utf8');

      const result = validator.validateConfigFile(configPath);

      expect(result.warnings.some(w => w.code === 'CONTAINS_PLACEHOLDER')).toBe(true);
    });

    it('should validate in strict mode', () => {
      const incompleteConfig = `# Test - Amazon Q CLI Configuration

Minimal content.
`;

      const configPath = join(testDir, 'strict-config.md');
      writeFileSync(configPath, incompleteConfig, 'utf8');

      const result = validator.validateConfigFile(configPath, { strict: true });

      expect(result.valid).toBe(false); // Strict mode converts warnings to errors
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should skip specific validation checks when disabled', () => {
      const configContent = `# Test - Amazon Q CLI Configuration

{{UNCLOSED_VARIABLE

## Project Context
Content here

## SDD Workflow
Content here

## Available Commands  
Commands here

## Directory Structure
Structure here

## Development Guidelines
Guidelines here
`;

      const configPath = join(testDir, 'syntax-error-config.md');
      writeFileSync(configPath, configContent, 'utf8');

      const result = validator.validateConfigFile(configPath, { 
        checkSyntax: false,
        checkVariables: false 
      });

      // Should not detect syntax errors when syntax checking is disabled
      expect(result.errors.some(e => e.code === 'UNMATCHED_HANDLEBARS_BRACKETS')).toBe(false);
    });

    it('should provide metadata about the configuration file', () => {
      const configContent = `# Test - Amazon Q CLI Configuration

## Project Context  
{{PROJECT_NAME}}

## SDD Workflow
Content here

## Available Commands
Commands here

## Directory Structure
Structure here

## Development Guidelines
Guidelines here
`;

      const configPath = join(testDir, 'metadata-config.md');
      writeFileSync(configPath, configContent, 'utf8');

      const result = validator.validateConfigFile(configPath);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.fileSize).toBeGreaterThan(0);
      expect(result.metadata!.lineCount).toBeGreaterThan(0);
      expect(result.metadata!.hasHandlebarsVariables).toBe(true);
      expect(result.metadata!.encoding).toBe('UTF-8');
    });
  });
});