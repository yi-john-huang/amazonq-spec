/**
 * Tests for prompt templates index
 */

import { 
  PROMPT_TEMPLATES, 
  getTemplateNames, 
  getTemplate, 
  getTemplatesByCategory,
  validateTemplateVariables,
  getTemplateMetadata
} from '../../templates/prompts/index';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Prompt Templates Index', () => {
  describe('PROMPT_TEMPLATES', () => {
    it('should contain all expected SDD command templates', () => {
      const expectedTemplates = [
        'spec-init',
        'spec-requirements', 
        'spec-design',
        'spec-tasks',
        'spec-impl',
        'spec-status',
        'steering',
        'steering-custom'
      ];

      expectedTemplates.forEach(templateName => {
        expect(PROMPT_TEMPLATES[templateName]).toBeDefined();
        expect(PROMPT_TEMPLATES[templateName].name).toBe(templateName);
      });
    });

    it('should have valid template file paths', () => {
      Object.values(PROMPT_TEMPLATES).forEach(template => {
        const templatePath = join(__dirname, '..', '..', template.templatePath);
        expect(existsSync(templatePath)).toBe(true);
      });
    });

    it('should have required properties for each template', () => {
      Object.values(PROMPT_TEMPLATES).forEach(template => {
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.templatePath).toBeTruthy();
        expect(Array.isArray(template.requiredVariables)).toBe(true);
        expect(Array.isArray(template.optionalVariables)).toBe(true);
        expect(['spec', 'steering', 'utility']).toContain(template.category);
      });
    });

    it('should have proper template categories', () => {
      const specTemplates = Object.values(PROMPT_TEMPLATES).filter(t => t.category === 'spec');
      const steeringTemplates = Object.values(PROMPT_TEMPLATES).filter(t => t.category === 'steering');
      expect(specTemplates.length).toBe(6); // spec-init, spec-requirements, spec-design, spec-tasks, spec-impl, spec-status
      expect(steeringTemplates.length).toBe(2); // steering, steering-custom
    });
  });

  describe('getTemplateNames', () => {
    it('should return all template names', () => {
      const names = getTemplateNames();
      expect(names).toContain('spec-init');
      expect(names).toContain('spec-requirements');
      expect(names).toContain('spec-design');
      expect(names).toContain('spec-tasks');
      expect(names).toContain('spec-impl');
      expect(names).toContain('spec-status');
      expect(names).toContain('steering');
      expect(names).toContain('steering-custom');
      expect(names.length).toBe(8);
    });
  });

  describe('getTemplate', () => {
    it('should return template for valid name', () => {
      const template = getTemplate('spec-init');
      expect(template).toBeDefined();
      expect(template!.name).toBe('spec-init');
      expect(template!.description).toContain('Initialize');
    });

    it('should return undefined for invalid name', () => {
      const template = getTemplate('non-existent');
      expect(template).toBeUndefined();
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return all spec templates', () => {
      const specTemplates = getTemplatesByCategory('spec');
      expect(specTemplates.length).toBe(6);
      specTemplates.forEach(template => {
        expect(template.category).toBe('spec');
      });
    });

    it('should return steering templates', () => {
      const steeringTemplates = getTemplatesByCategory('steering');
      expect(steeringTemplates).toHaveLength(2);
      steeringTemplates.forEach(template => {
        expect(template.category).toBe('steering');
      });
    });

    it('should return empty array for categories with no templates', () => {
      const utilityTemplates = getTemplatesByCategory('utility');
      expect(utilityTemplates).toHaveLength(0);
    });
  });

  describe('validateTemplateVariables', () => {
    it('should validate spec-init template variables', () => {
      const validVariables = {
        FEATURE_DESCRIPTION: 'Test feature description',
        PROJECT_NAME: 'Test Project',
        FEATURE_NAME: 'test-feature',
        TECHNOLOGY_STACK: 'Node.js, TypeScript'
      };

      const validation = validateTemplateVariables('spec-init', validVariables);
      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it('should detect missing required variables', () => {
      const incompleteVariables = {
        PROJECT_NAME: 'Test Project'
        // Missing FEATURE_DESCRIPTION and FEATURE_NAME
      };

      const validation = validateTemplateVariables('spec-init', incompleteVariables);
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('FEATURE_DESCRIPTION');
      expect(validation.missing).toContain('FEATURE_NAME');
    });

    it('should detect empty string as missing variable', () => {
      const emptyVariables = {
        FEATURE_DESCRIPTION: '',
        PROJECT_NAME: 'Test Project',
        FEATURE_NAME: 'test-feature'
      };

      const validation = validateTemplateVariables('spec-init', emptyVariables);
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('FEATURE_DESCRIPTION');
    });

    it('should detect null/undefined as missing variable', () => {
      const nullVariables = {
        FEATURE_DESCRIPTION: null,
        PROJECT_NAME: 'Test Project',
        FEATURE_NAME: undefined
      };

      const validation = validateTemplateVariables('spec-init', nullVariables);
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('FEATURE_DESCRIPTION');
      expect(validation.missing).toContain('FEATURE_NAME');
    });

    it('should handle invalid template name', () => {
      const variables = { some: 'variable' };
      const validation = validateTemplateVariables('non-existent', variables);
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain("Template 'non-existent' not found");
    });

    it('should validate spec-requirements template variables', () => {
      const validVariables = {
        FEATURE_NAME: 'user-authentication',
        PROJECT_NAME: 'My App',
        FEATURE_DETAILS: 'Detailed feature description'
      };

      const validation = validateTemplateVariables('spec-requirements', validVariables);
      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it('should validate spec-design template variables', () => {
      const validVariables = {
        FEATURE_NAME: 'user-authentication',
        PROJECT_NAME: 'My App',
        REQUIREMENTS_SUMMARY: 'Summary of requirements'
      };

      const validation = validateTemplateVariables('spec-design', validVariables);
      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it('should validate spec-status template variables', () => {
      const validVariables = {
        FEATURE_NAME: 'user-authentication',
        PROJECT_NAME: 'My App',
        SPEC_DIRECTORY: '.kiro/specs/user-auth'
      };

      const validation = validateTemplateVariables('spec-status', validVariables);
      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it('should validate steering template variables', () => {
      const validVariables = {
        PROJECT_NAME: 'My App',
        PROJECT_PATH: '/path/to/project',
        STEERING_DIRECTORY: '.kiro/steering'
      };

      const validation = validateTemplateVariables('steering', validVariables);
      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it('should validate steering-custom template variables', () => {
      const validVariables = {
        STEERING_NAME: 'database',
        PROJECT_NAME: 'My App',
        STEERING_DIRECTORY: '.kiro/steering',
        SPECIFIC_CONTEXT: 'Database operations and migrations',
        STEERING_PURPOSE: 'Provide guidance for database-related development',
        PROBLEMS_SOLVED: 'Consistency in database code and migrations',
        APPLIES_TO: 'Database models, migrations, queries',
        DOES_NOT_APPLY_TO: 'Frontend UI components',
        ACTIVATION_PATTERN: '*.model.ts, *.migration.ts files'
      };

      const validation = validateTemplateVariables('steering-custom', validVariables);
      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });
  });

  describe('getTemplateMetadata', () => {
    it('should return metadata for valid template', () => {
      const metadata = getTemplateMetadata('spec-init');
      expect(metadata).toBeDefined();
      expect(metadata!.name).toBe('spec-init');
      expect(metadata!.description).toContain('Initialize');
      expect(metadata!.requiredVariables).toContain('FEATURE_DESCRIPTION');
      expect(metadata!.category).toBe('spec');
      expect(typeof metadata!.totalVariables).toBe('number');
    });

    it('should return null for invalid template', () => {
      const metadata = getTemplateMetadata('non-existent');
      expect(metadata).toBeNull();
    });

    it('should calculate total variables correctly', () => {
      const metadata = getTemplateMetadata('spec-init');
      const template = PROMPT_TEMPLATES['spec-init'];
      const expectedTotal = template.requiredVariables.length + template.optionalVariables.length;
      expect(metadata!.totalVariables).toBe(expectedTotal);
    });
  });

  describe('template consistency', () => {
    it('should have consistent naming patterns', () => {
      const templateNames = getTemplateNames();
      templateNames.forEach(name => {
        expect(name).toMatch(/^(spec-[a-z]+|steering(-[a-z]+)?)$/);
      });
    });

    it('should have proper variable naming conventions', () => {
      Object.values(PROMPT_TEMPLATES).forEach(template => {
        [...template.requiredVariables, ...template.optionalVariables].forEach(variable => {
          expect(variable).toMatch(/^[A-Z_]+$/);
          expect(variable.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have descriptions that match template purposes', () => {
      expect(PROMPT_TEMPLATES['spec-init'].description).toContain('Initialize');
      expect(PROMPT_TEMPLATES['spec-requirements'].description).toContain('requirements');
      expect(PROMPT_TEMPLATES['spec-design'].description).toContain('design');
      expect(PROMPT_TEMPLATES['spec-tasks'].description).toContain('tasks');
      expect(PROMPT_TEMPLATES['spec-impl'].description).toContain('implementation');
      expect(PROMPT_TEMPLATES['spec-status'].description).toContain('status');
      expect(PROMPT_TEMPLATES['steering'].description).toContain('steering');
      expect(PROMPT_TEMPLATES['steering-custom'].description).toContain('custom');
    });
  });
});