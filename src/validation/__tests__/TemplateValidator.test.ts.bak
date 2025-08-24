/**
 * Tests for TemplateValidator
 */

import { TemplateValidator } from '../TemplateValidator';
import { Logger } from '../../utils/logger';

jest.mock('../../utils/logger');

describe('TemplateValidator', () => {
  let validator: TemplateValidator;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = new Logger() as jest.Mocked<Logger>;
    mockLogger.debug = jest.fn();
    mockLogger.info = jest.fn();
    mockLogger.warn = jest.fn();
    mockLogger.error = jest.fn();

    validator = new TemplateValidator(mockLogger);
  });

  describe('validateTemplate', () => {
    it('should validate a simple template successfully', () => {
      const template = '# {{title}}\n\nWelcome {{name}}!';
      const result = validator.validateTemplate(template);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.entityType).toBe('template');
    });

    it('should detect unmatched braces', () => {
      const template = '{{title} - missing closing brace';
      const result = validator.validateTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'UNMATCHED_BRACES',
          message: expect.stringContaining('Unmatched Handlebars braces')
        })
      );
    });

    it('should detect malformed expressions', () => {
      const template = '{{title{extra} - malformed expression';
      const result = validator.validateTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MALFORMED_EXPRESSION'
        })
      );
    });

    it('should validate required variables', () => {
      const template = '{{name}} is working on {{project}}';
      const options = {
        requiredVariables: ['name', 'project', 'version']
      };
      const result = validator.validateTemplate(template, options);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_REQUIRED_VARIABLE',
          expectedValue: 'version'
        })
      );
    });

    it('should warn about undeclared variables', () => {
      const template = '{{name}} is working on {{undeclared}}';
      const options = {
        allowedVariables: ['name']
      };
      const result = validator.validateTemplate(template, options);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'UNDECLARED_VARIABLE',
          actualValue: 'undeclared'
        })
      );
    });

    it('should validate helpers when enabled', () => {
      const template = '{{#each items}}{{name}}{{/each}}';
      const options = { validateHelpers: true };
      const result = validator.validateTemplate(template, options);

      expect(result.valid).toBe(true); // 'each' is a built-in helper
    });

    it('should warn about custom helpers', () => {
      const template = '{{#customHelper data}}Content{{/customHelper}}';
      const options = { validateHelpers: true };
      const result = validator.validateTemplate(template, options);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'CUSTOM_HELPER_USAGE',
          actualValue: 'customHelper'
        })
      );
    });

    it('should detect unclosed if blocks', () => {
      const template = '{{#if condition}}Content without closing';
      const options = { validateHelpers: true };
      const result = validator.validateTemplate(template, options);

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'UNCLOSED_IF_BLOCK'
        })
      );
    });

    it('should validate config templates', () => {
      const template = '# Project Config\n\n{{projectName}}';
      const options = { templateType: 'config' as const };
      const result = validator.validateTemplate(template, options);

      expect(result.valid).toBe(true);
    });

    it('should validate prompt templates', () => {
      const template = '## Task Description\n\n{{description}}\n\n===\n\nPlease help with this task.';
      const options = { templateType: 'prompt' as const };
      const result = validator.validateTemplate(template, options);

      expect(result.valid).toBe(true);
    });

    it('should validate script templates', () => {
      const template = '#!/bin/bash\n\necho "Running {{scriptName}}"';
      const options = { templateType: 'script' as const };
      const result = validator.validateTemplate(template, options);

      expect(result.valid).toBe(true);
    });

    it('should handle validation errors gracefully', () => {
      const template = null as any; // Force error
      const result = validator.validateTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'TEMPLATE_VALIDATION_ERROR'
        })
      );
    });
  });

  describe('extractVariables', () => {
    it('should extract simple variables', () => {
      const template = 'Hello {{name}} and {{friend}}!';
      const variables = validator.extractVariables(template);

      expect(variables).toContain('name');
      expect(variables).toContain('friend');
      expect(variables).toHaveLength(2);
    });

    it('should handle nested variables', () => {
      const template = '{{user.name}} works at {{company.name}}';
      const variables = validator.extractVariables(template);

      expect(variables).toContain('user.name');
      expect(variables).toContain('company.name');
    });

    it('should ignore helpers and comments', () => {
      const template = '{{#each items}}{{!-- comment --}}{{name}}{{/each}}';
      const variables = validator.extractVariables(template);

      expect(variables).toContain('name');
      expect(variables).not.toContain('each');
      expect(variables).not.toContain('!-- comment --');
    });

    it('should handle whitespace in variables', () => {
      const template = '{{ spaced_var }} and {{normal}}';
      const variables = validator.extractVariables(template);

      expect(variables).toContain('spaced_var');
      expect(variables).toContain('normal');
    });
  });

  describe('extractHelpers', () => {
    it('should extract helper names', () => {
      const template = '{{#if condition}}{{#each items}}content{{/each}}{{/if}}';
      const helpers = validator.extractHelpers(template);

      expect(helpers).toContain('if');
      expect(helpers).toContain('each');
    });

    it('should handle helpers with parameters', () => {
      const template = '{{#with user as |u|}}{{u.name}}{{/with}}';
      const helpers = validator.extractHelpers(template);

      expect(helpers).toContain('with');
    });
  });

  describe('extractPartials', () => {
    it('should extract partial names', () => {
      const template = '{{> header}} Content {{> footer}}';
      const partials = validator.extractPartials(template);

      expect(partials).toContain('header');
      expect(partials).toContain('footer');
    });

    it('should handle partials with parameters', () => {
      const template = '{{> user-card user=currentUser}}';
      const partials = validator.extractPartials(template);

      expect(partials).toContain('user-card');
    });
  });

  describe('analyzeTemplate', () => {
    it('should provide comprehensive analysis', () => {
      const template = `# {{title}}
      
{{#each items}}
  - {{name}}: {{description}}
{{/each}}

{{> footer}}`;

      const analysis = validator.analyzeTemplate(template);

      expect(analysis.variables).toContain('title');
      expect(analysis.variables).toContain('name');
      expect(analysis.variables).toContain('description');
      expect(analysis.helpers).toContain('each');
      expect(analysis.partials).toContain('footer');
      expect(analysis.complexity).toBeGreaterThan(0);
      expect(analysis.lineCount).toBeGreaterThan(0);
      expect(analysis.characterCount).toBe(template.length);
    });

    it('should calculate complexity appropriately', () => {
      const simpleTemplate = '{{name}}';
      const complexTemplate = `
{{#if user}}
  {{#each user.items}}
    {{#with item}}
      {{name}} - {{description}}
    {{/with}}
  {{/each}}
{{/if}}`;

      const simpleAnalysis = validator.analyzeTemplate(simpleTemplate);
      const complexAnalysis = validator.analyzeTemplate(complexTemplate);

      expect(complexAnalysis.complexity).toBeGreaterThan(simpleAnalysis.complexity);
    });
  });

  describe('template type validation', () => {
    describe('config templates', () => {
      it('should require markdown structure', () => {
        const template = 'Plain text config without headers';
        const options = { templateType: 'config' as const };
        const result = validator.validateTemplate(template, options);

        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            code: 'MISSING_MARKDOWN_STRUCTURE'
          })
        );
      });

      it('should suggest common config variables', () => {
        const template = '# Config\n\nBasic config without common variables';
        const options = { templateType: 'config' as const };
        const result = validator.validateTemplate(template, options);

        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            code: 'MISSING_COMMON_CONFIG_VAR'
          })
        );
      });
    });

    describe('prompt templates', () => {
      it('should warn about missing structure markers', () => {
        const template = 'Simple prompt without structure';
        const options = { templateType: 'prompt' as const };
        const result = validator.validateTemplate(template, options);

        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            code: 'MISSING_PROMPT_STRUCTURE'
          })
        );
      });

      it('should warn about very long prompts', () => {
        const longTemplate = 'x'.repeat(6000);
        const options = { templateType: 'prompt' as const };
        const result = validator.validateTemplate(longTemplate, options);

        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            code: 'PROMPT_TEMPLATE_TOO_LONG'
          })
        );
      });
    });

    describe('script templates', () => {
      it('should warn about missing shebang', () => {
        const template = 'echo "Hello {{name}}"';
        const options = { templateType: 'script' as const };
        const result = validator.validateTemplate(template, options);

        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            code: 'MISSING_SHEBANG'
          })
        );
      });

      it('should accept templates with {{shebang}} variable', () => {
        const template = '{{shebang}}\necho "Hello {{name}}"';
        const options = { templateType: 'script' as const };
        const result = validator.validateTemplate(template, options);

        const shebangWarnings = result.warnings.filter(w => w.code === 'MISSING_SHEBANG');
        expect(shebangWarnings).toHaveLength(0);
      });
    });
  });

  describe('structure validation', () => {
    it('should warn about large templates', () => {
      const largeTemplate = 'x'.repeat(150000); // >100KB
      const result = validator.validateTemplate(largeTemplate);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'LARGE_TEMPLATE'
        })
      );
    });

    it('should detect encoding issues', () => {
      const templateWithBadEncoding = 'Hello \uFFFD World';
      const result = validator.validateTemplate(templateWithBadEncoding);

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ENCODING_ISSUES'
        })
      );
    });

    it('should detect mixed line endings', () => {
      const mixedLineEndings = 'Line 1\nLine 2\r\nLine 3';
      const result = validator.validateTemplate(mixedLineEndings);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'MIXED_LINE_ENDINGS'
        })
      );
    });
  });
});