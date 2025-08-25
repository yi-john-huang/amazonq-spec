/**
 * Tests for TemplateGenerator class
 */

import { TemplateGenerator } from './TemplateGenerator';
import { Logger } from '../utils/logger';
import { Language } from '../types';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

describe('TemplateGenerator', () => {
  let generator: TemplateGenerator;
  let logger: Logger;
  let testOutputDir: string;

  beforeEach(() => {
    logger = new Logger();
    logger.setLevel('error'); // Reduce noise in tests
    generator = new TemplateGenerator(logger);
    testOutputDir = join(__dirname, '..', '..', 'test-templates');
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  describe('generatePromptTemplates', () => {
    it('should generate templates for all SDD commands', async () => {
      const templates = await generator.generatePromptTemplates(
        testOutputDir, 
        Language.ENGLISH
      );

      expect(templates).toHaveLength(8);
      expect(templates[0].commandName).toBe('kiro-steering');
      expect(templates[0].promptText).toContain('steering documents');
      expect(templates[0].version).toBe('1.0.0');
    });

    it('should create template files in output directory', async () => {
      await generator.generatePromptTemplates(testOutputDir, Language.ENGLISH);
      
      expect(existsSync(testOutputDir)).toBe(true);
      expect(existsSync(join(testOutputDir, 'kiro-steering.hbs'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'kiro-spec-init.hbs'))).toBe(true);
    });
  });

  describe('adaptForAmazonQCLI', () => {
    it('should adapt template for Amazon Q CLI format', async () => {
      const templates = await generator.generatePromptTemplates(
        testOutputDir,
        Language.ENGLISH
      );
      
      const original = templates[0];
      const adapted = generator.adaptForAmazonQCLI(original);

      expect(adapted.promptText).toContain('Amazon Q CLI Prompt');
      expect(adapted.metadata.tags).toContain('amazonq-compatible');
      expect(adapted.promptText).not.toBe(original.promptText);
    });
  });

  describe('validateTemplate', () => {
    it('should validate template syntax', async () => {
      const templates = await generator.generatePromptTemplates(
        testOutputDir,
        Language.ENGLISH
      );
      
      const validation = generator.validateTemplate(templates[0]);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.entityType).toBe('template');
    });

    it('should warn about templates not adapted for Amazon Q CLI', async () => {
      const templates = await generator.generatePromptTemplates(
        testOutputDir,
        Language.ENGLISH
      );
      
      const validation = generator.validateTemplate(templates[0]);
      
      expect(validation.warnings.some(w => w.code === 'NOT_AMAZONQ_ADAPTED')).toBe(true);
    });
  });

  describe('compileTemplate', () => {
    it('should compile and cache templates', async () => {
      const templates = await generator.generatePromptTemplates(
        testOutputDir,
        Language.ENGLISH
      );
      
      const compiled = generator.compileTemplate(templates[0]);
      expect(compiled).toBeDefined();
      expect(typeof compiled).toBe('function');
      
      // Should use cache on second call
      const compiled2 = generator.compileTemplate(templates[0]);
      expect(compiled2).toBe(compiled);
    });
  });

  describe('renderTemplate', () => {
    it('should render template with context', async () => {
      const templates = await generator.generatePromptTemplates(
        testOutputDir,
        Language.ENGLISH
      );
      
      const context = {
        version: '1.0.0',
        arguments: [{ name: 'test', description: 'Test argument' }]
      };
      
      const rendered = generator.renderTemplate(templates[0], context);
      expect(rendered).toContain('1.0.0');
      expect(rendered).toContain('spec-driven development');
    });
  });

  describe('cache management', () => {
    it('should clear template cache', async () => {
      const templates = await generator.generatePromptTemplates(
        testOutputDir,
        Language.ENGLISH
      );
      
      // Compile to populate cache
      generator.compileTemplate(templates[0]);
      
      // Clear cache
      generator.clearCache();
      
      // Should work after clearing cache
      const compiled = generator.compileTemplate(templates[0]);
      expect(compiled).toBeDefined();
    });
  });
});