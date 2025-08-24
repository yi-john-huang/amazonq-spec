/**
 * Prompt Templates Index
 * 
 * Exports all available SDD command prompt templates for easy access
 */

// cSpell:ignore spec kiro

export interface PromptTemplate {
  name: string;
  description: string;
  templatePath: string;
  requiredVariables: string[];
  optionalVariables: string[];
  category: 'spec' | 'steering' | 'utility';
}

/**
 * Available SDD command prompt templates
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  'spec-init': {
    name: 'spec-init',
    description: 'Initialize a new feature specification with proper structure and initial analysis',
    templatePath: 'templates/prompts/spec-init.hbs',
    requiredVariables: [
      'FEATURE_DESCRIPTION',
      'PROJECT_NAME',
      'FEATURE_NAME'
    ],
    optionalVariables: [
      'TECHNOLOGY_STACK',
      'PROJECT_PATH',
      'ARCHITECTURE_TYPE'
    ],
    category: 'spec'
  },

  'spec-requirements': {
    name: 'spec-requirements',
    description: 'Generate comprehensive functional and non-functional requirements',
    templatePath: 'templates/prompts/spec-requirements.hbs',
    requiredVariables: [
      'FEATURE_NAME',
      'PROJECT_NAME',
      'FEATURE_DETAILS'
    ],
    optionalVariables: [
      'SPEC_PATH',
      'EXISTING_SPEC',
      'CURRENT_ANALYSIS'
    ],
    category: 'spec'
  },

  'spec-design': {
    name: 'spec-design',
    description: 'Create detailed technical design document based on approved requirements',
    templatePath: 'templates/prompts/spec-design.hbs',
    requiredVariables: [
      'FEATURE_NAME',
      'PROJECT_NAME',
      'REQUIREMENTS_SUMMARY'
    ],
    optionalVariables: [
      'SPEC_PATH',
      'REQUIREMENTS_PATH',
      'REQUIREMENTS_APPROVED',
      'ARCHITECTURE_TYPE',
      'TECHNOLOGY_STACK',
      'CODEBASE_STRUCTURE',
      'INTEGRATION_POINTS',
      'DESIGN_CONSTRAINTS'
    ],
    category: 'spec'
  },

  'spec-tasks': {
    name: 'spec-tasks',
    description: 'Break down approved design into concrete, actionable implementation tasks',
    templatePath: 'templates/prompts/spec-tasks.hbs',
    requiredVariables: [
      'FEATURE_NAME',
      'PROJECT_NAME',
      'DESIGN_SUMMARY'
    ],
    optionalVariables: [
      'SPEC_PATH',
      'REQUIREMENTS_PATH',
      'DESIGN_PATH',
      'DESIGN_APPROVED',
      'DEV_ENVIRONMENT',
      'TEAM_SIZE',
      'TIMELINE',
      'COMPLEXITY_LEVEL'
    ],
    category: 'spec'
  },

  'spec-impl': {
    name: 'spec-impl',
    description: 'Provide detailed implementation guidance for specific tasks or components',
    templatePath: 'templates/prompts/spec-impl.hbs',
    requiredVariables: [
      'FEATURE_NAME',
      'PROJECT_NAME',
      'CURRENT_TASK',
      'TASK_DESCRIPTION'
    ],
    optionalVariables: [
      'TASK_ID',
      'ACCEPTANCE_CRITERIA',
      'TASK_DEPENDENCIES',
      'IMPLEMENTATION_PHASE',
      'SPEC_PATH',
      'DESIGN_PATH',
      'TASKS_PATH',
      'CURRENT_PROGRESS',
      'TECHNOLOGY_STACK',
      'ARCHITECTURE_TYPE',
      'CODE_STYLE',
      'TESTING_FRAMEWORK',
      'SPECIFIC_COMPONENT',
      'COMPONENT_REQUIREMENTS',
      'IMPLEMENTATION_CHALLENGES',
      'EXISTING_CODE',
      'CODE_LANGUAGE'
    ],
    category: 'spec'
  }
};

/**
 * Get all template names
 */
export function getTemplateNames(): string[] {
  return Object.keys(PROMPT_TEMPLATES);
}

/**
 * Get template by name
 */
export function getTemplate(name: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES[name];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: 'spec' | 'steering' | 'utility'): PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES).filter(template => template.category === category);
}

/**
 * Validate that all required variables are provided for a template
 */
export function validateTemplateVariables(
  templateName: string, 
  variables: Record<string, any>
): { valid: boolean; missing: string[] } {
  const template = getTemplate(templateName);
  if (!template) {
    return { valid: false, missing: [`Template '${templateName}' not found`] };
  }

  const missing = template.requiredVariables.filter(variable => 
    !variables.hasOwnProperty(variable) || 
    variables[variable] === undefined || 
    variables[variable] === null || 
    variables[variable] === ''
  );

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Get template metadata for validation
 */
export function getTemplateMetadata(templateName: string) {
  const template = getTemplate(templateName);
  if (!template) {
    return null;
  }

  return {
    name: template.name,
    description: template.description,
    requiredVariables: template.requiredVariables,
    optionalVariables: template.optionalVariables,
    category: template.category,
    totalVariables: template.requiredVariables.length + template.optionalVariables.length
  };
}