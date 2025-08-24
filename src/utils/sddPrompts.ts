/**
 * SDD Prompt Templates for Amazon Q CLI
 * 
 * Provides structured prompt templates for different phases of
 * Spec-Driven Development workflow
 */

import { AmazonQPrompt } from './amazonQCLI';
import { Language } from '../types';

export interface SDDPromptContext {
  /** Feature name */
  featureName: string;
  /** Project name */
  projectName?: string;
  /** Technology stack */
  technologyStack?: string;
  /** Architecture type */
  architectureType?: string;
  /** Target language for output */
  language?: Language;
  /** Additional context */
  additionalContext?: Record<string, any>;
}

export interface FeatureSpecificationInput {
  /** Detailed feature description */
  description: string;
  /** Business objectives */
  businessObjectives?: string[];
  /** Target users */
  targetUsers?: string[];
  /** Success criteria */
  successCriteria?: string[];
}

export interface RequirementsInput {
  /** Feature specification content */
  specificationContent?: string;
  /** Stakeholder requirements */
  stakeholderRequirements?: string[];
  /** Technical constraints */
  technicalConstraints?: string[];
  /** Compliance requirements */
  complianceRequirements?: string[];
}

export interface DesignInput {
  /** Requirements document content */
  requirementsContent?: string;
  /** Existing architecture documentation */
  existingArchitecture?: string;
  /** Design patterns to follow */
  designPatterns?: string[];
  /** Integration points */
  integrationPoints?: string[];
}

export interface TasksInput {
  /** Design document content */
  designContent?: string;
  /** Team structure */
  teamStructure?: string;
  /** Timeline constraints */
  timelineConstraints?: string;
  /** Priority levels */
  priorityLevels?: string[];
}

/**
 * Generator for SDD-specific Amazon Q CLI prompts
 */
export class SDDPromptGenerator {
  
  /**
   * Generate prompt for feature specification initialization
   */
  public static createSpecificationPrompt(
    context: SDDPromptContext, 
    input: FeatureSpecificationInput
  ): AmazonQPrompt {
    const sections = [
      '# Feature Specification Generation Request',
      '',
      '## Context',
      `Project: ${context.projectName || 'Unspecified'}`,
      `Feature: ${context.featureName}`,
      `Technology: ${context.technologyStack || 'Not specified'}`,
      `Architecture: ${context.architectureType || 'Not specified'}`,
      '',
      '## Feature Description',
      input.description,
      ''
    ];

    if (input.businessObjectives && input.businessObjectives.length > 0) {
      sections.push('## Business Objectives');
      input.businessObjectives.forEach(obj => sections.push(`- ${obj}`));
      sections.push('');
    }

    if (input.targetUsers && input.targetUsers.length > 0) {
      sections.push('## Target Users');
      input.targetUsers.forEach(user => sections.push(`- ${user}`));
      sections.push('');
    }

    if (input.successCriteria && input.successCriteria.length > 0) {
      sections.push('## Success Criteria');
      input.successCriteria.forEach(criteria => sections.push(`- ${criteria}`));
      sections.push('');
    }

    sections.push(
      '## Request',
      'Please generate a comprehensive feature specification document that includes:',
      '1. Executive summary of the feature',
      '2. Detailed feature description and scope',
      '3. User stories and use cases',
      '4. Initial analysis of technical approach',
      '5. Dependencies and assumptions',
      '6. Acceptance criteria',
      '7. Next steps for requirements phase',
      '',
      'Format the output as a structured Markdown document suitable for technical review.',
      'Focus on clarity, completeness, and actionable next steps.'
    );

    return {
      content: sections.join('\n'),
      metadata: {
        feature: context.featureName,
        phase: 'specification',
        language: context.language || Language.ENGLISH,
        projectContext: {
          projectName: context.projectName,
          technologyStack: context.technologyStack,
          architectureType: context.architectureType,
          ...context.additionalContext
        }
      }
    };
  }

  /**
   * Generate prompt for requirements document generation
   */
  public static createRequirementsPrompt(
    context: SDDPromptContext,
    input: RequirementsInput
  ): AmazonQPrompt {
    const sections = [
      '# Requirements Document Generation Request',
      '',
      '## Context',
      `Project: ${context.projectName || 'Unspecified'}`,
      `Feature: ${context.featureName}`,
      `Phase: Requirements Analysis`,
      ''
    ];

    if (input.specificationContent) {
      sections.push(
        '## Feature Specification',
        '```markdown',
        input.specificationContent,
        '```',
        ''
      );
    }

    if (input.stakeholderRequirements && input.stakeholderRequirements.length > 0) {
      sections.push('## Stakeholder Requirements');
      input.stakeholderRequirements.forEach(req => sections.push(`- ${req}`));
      sections.push('');
    }

    if (input.technicalConstraints && input.technicalConstraints.length > 0) {
      sections.push('## Technical Constraints');
      input.technicalConstraints.forEach(constraint => sections.push(`- ${constraint}`));
      sections.push('');
    }

    if (input.complianceRequirements && input.complianceRequirements.length > 0) {
      sections.push('## Compliance Requirements');
      input.complianceRequirements.forEach(req => sections.push(`- ${req}`));
      sections.push('');
    }

    sections.push(
      '## Request',
      'Please generate a comprehensive requirements document that includes:',
      '',
      '### Functional Requirements',
      '- Core functionality with detailed specifications',
      '- User interface requirements',
      '- Data requirements and validation rules',
      '- Integration requirements',
      '- Performance requirements',
      '',
      '### Non-Functional Requirements',
      '- Security requirements',
      '- Performance benchmarks',
      '- Scalability requirements',
      '- Availability and reliability requirements',
      '- Usability requirements',
      '',
      '### Business Rules & Validation',
      '- Business logic rules',
      '- Data validation rules',
      '- Workflow validation',
      '- Error handling requirements',
      '',
      '### Acceptance Criteria',
      '- Testable acceptance criteria for each requirement',
      '- Definition of done for the feature',
      '- Quality gates and review checkpoints',
      '',
      'Format as a structured Markdown document with clear numbering and cross-references.',
      'Ensure all requirements are specific, measurable, and testable.'
    );

    return {
      content: sections.join('\n'),
      metadata: {
        feature: context.featureName,
        phase: 'requirements',
        language: context.language || Language.ENGLISH,
        projectContext: {
          projectName: context.projectName,
          technologyStack: context.technologyStack,
          ...context.additionalContext
        }
      }
    };
  }

  /**
   * Generate prompt for design document generation
   */
  public static createDesignPrompt(
    context: SDDPromptContext,
    input: DesignInput
  ): AmazonQPrompt {
    const sections = [
      '# Design Document Generation Request',
      '',
      '## Context',
      `Project: ${context.projectName || 'Unspecified'}`,
      `Feature: ${context.featureName}`,
      `Phase: Technical Design`,
      `Technology Stack: ${context.technologyStack || 'Not specified'}`,
      `Architecture: ${context.architectureType || 'Not specified'}`,
      ''
    ];

    if (input.requirementsContent) {
      sections.push(
        '## Requirements Document',
        '```markdown',
        input.requirementsContent,
        '```',
        ''
      );
    }

    if (input.existingArchitecture) {
      sections.push(
        '## Existing Architecture',
        input.existingArchitecture,
        ''
      );
    }

    if (input.designPatterns && input.designPatterns.length > 0) {
      sections.push('## Required Design Patterns');
      input.designPatterns.forEach(pattern => sections.push(`- ${pattern}`));
      sections.push('');
    }

    if (input.integrationPoints && input.integrationPoints.length > 0) {
      sections.push('## Integration Points');
      input.integrationPoints.forEach(point => sections.push(`- ${point}`));
      sections.push('');
    }

    sections.push(
      '## Request',
      'Please generate a comprehensive technical design document that includes:',
      '',
      '### Architecture Overview',
      '- High-level architecture diagram (describe in text)',
      '- Component relationships and data flow',
      '- Technology stack justification',
      '- Integration architecture',
      '',
      '### Detailed Design',
      '- Component specifications',
      '- API design and interfaces',
      '- Data model and schema design',
      '- Security design considerations',
      '- Error handling and logging design',
      '',
      '### Implementation Strategy',
      '- Development phases and milestones',
      '- Risk mitigation strategies',
      '- Testing approach and strategy',
      '- Deployment considerations',
      '',
      '### Technical Specifications',
      '- Performance specifications',
      '- Scalability considerations',
      '- Monitoring and observability',
      '- Documentation requirements',
      '',
      'Format as a structured Markdown document with clear sections and subsections.',
      'Include code examples and pseudo-code where appropriate.',
      'Ensure the design addresses all requirements comprehensively.'
    );

    return {
      content: sections.join('\n'),
      metadata: {
        feature: context.featureName,
        phase: 'design',
        language: context.language || Language.ENGLISH,
        projectContext: {
          projectName: context.projectName,
          technologyStack: context.technologyStack,
          architectureType: context.architectureType,
          ...context.additionalContext
        }
      }
    };
  }

  /**
   * Generate prompt for task breakdown generation
   */
  public static createTasksPrompt(
    context: SDDPromptContext,
    input: TasksInput
  ): AmazonQPrompt {
    const sections = [
      '# Task Breakdown Generation Request',
      '',
      '## Context',
      `Project: ${context.projectName || 'Unspecified'}`,
      `Feature: ${context.featureName}`,
      `Phase: Implementation Planning`,
      ''
    ];

    if (input.designContent) {
      sections.push(
        '## Design Document',
        '```markdown',
        input.designContent,
        '```',
        ''
      );
    }

    if (input.teamStructure) {
      sections.push(
        '## Team Structure',
        input.teamStructure,
        ''
      );
    }

    if (input.timelineConstraints) {
      sections.push(
        '## Timeline Constraints',
        input.timelineConstraints,
        ''
      );
    }

    if (input.priorityLevels && input.priorityLevels.length > 0) {
      sections.push('## Priority Levels');
      input.priorityLevels.forEach(level => sections.push(`- ${level}`));
      sections.push('');
    }

    sections.push(
      '## Request',
      'Please generate a comprehensive task breakdown that includes:',
      '',
      '### Development Phases',
      'Organize tasks into logical implementation phases:',
      '1. Foundation/Setup Phase',
      '2. Core Implementation Phase',
      '3. Integration Phase',
      '4. Testing & Validation Phase',
      '5. Documentation & Deployment Phase',
      '',
      '### Task Details',
      'For each task, provide:',
      '- Clear task description and scope',
      '- Acceptance criteria and definition of done',
      '- Estimated effort and duration',
      '- Dependencies and prerequisites',
      '- Required skills and team members',
      '- Risk level and mitigation strategies',
      '',
      '### Implementation Guidelines',
      '- Code standards and best practices',
      '- Testing requirements and coverage goals',
      '- Review and approval processes',
      '- Integration and deployment procedures',
      '',
      '### Progress Tracking',
      '- Milestones and checkpoints',
      '- Success metrics and KPIs',
      '- Review and validation criteria',
      '- Communication and reporting structure',
      '',
      'Format as a structured Markdown document with clear task numbering.',
      'Ensure tasks are actionable, measurable, and properly sequenced.',
      'Include time estimates and priority levels for each task.'
    );

    return {
      content: sections.join('\n'),
      metadata: {
        feature: context.featureName,
        phase: 'tasks',
        language: context.language || Language.ENGLISH,
        projectContext: {
          projectName: context.projectName,
          technologyStack: context.technologyStack,
          teamStructure: input.teamStructure,
          ...context.additionalContext
        }
      }
    };
  }

  /**
   * Generate prompt for implementation guidance
   */
  public static createImplementationPrompt(
    context: SDDPromptContext,
    taskDescription: string,
    codeContext?: string[]
  ): AmazonQPrompt {
    const sections = [
      '# Implementation Guidance Request',
      '',
      '## Context',
      `Project: ${context.projectName || 'Unspecified'}`,
      `Feature: ${context.featureName}`,
      `Phase: Implementation`,
      '',
      '## Task Description',
      taskDescription,
      ''
    ];

    if (codeContext && codeContext.length > 0) {
      sections.push('## Existing Code Context');
      codeContext.forEach(code => {
        sections.push('```');
        sections.push(code);
        sections.push('```');
        sections.push('');
      });
    }

    sections.push(
      '## Request',
      'Please provide implementation guidance that includes:',
      '',
      '### Code Implementation',
      '- Step-by-step implementation approach',
      '- Code examples and templates',
      '- Best practices and patterns to follow',
      '- Error handling and edge cases',
      '',
      '### Testing Strategy',
      '- Unit test examples and patterns',
      '- Integration test considerations',
      '- Test data and mock requirements',
      '- Coverage expectations',
      '',
      '### Integration Guidelines',
      '- API integration patterns',
      '- Database integration approaches',
      '- Configuration and environment setup',
      '- Dependency management',
      '',
      '### Quality Assurance',
      '- Code review checklist',
      '- Performance considerations',
      '- Security best practices',
      '- Documentation requirements',
      '',
      'Provide practical, actionable guidance with concrete examples.',
      'Focus on maintainable, testable, and scalable implementation approaches.'
    );

    return {
      content: sections.join('\n'),
      contextFiles: codeContext ? [] : undefined, // Context files would be added externally
      metadata: {
        feature: context.featureName,
        phase: 'implementation',
        language: context.language || Language.ENGLISH,
        projectContext: {
          projectName: context.projectName,
          technologyStack: context.technologyStack,
          ...context.additionalContext
        }
      }
    };
  }

  /**
   * Generate prompt for status and progress review
   */
  public static createStatusPrompt(
    context: SDDPromptContext,
    completedTasks: string[],
    currentProgress: string,
    blockers?: string[]
  ): AmazonQPrompt {
    const sections = [
      '# Status Review and Next Steps Request',
      '',
      '## Context',
      `Project: ${context.projectName || 'Unspecified'}`,
      `Feature: ${context.featureName}`,
      `Phase: Progress Review`,
      '',
      '## Current Progress',
      currentProgress,
      ''
    ];

    if (completedTasks.length > 0) {
      sections.push('## Completed Tasks');
      completedTasks.forEach(task => sections.push(`- ✅ ${task}`));
      sections.push('');
    }

    if (blockers && blockers.length > 0) {
      sections.push('## Current Blockers');
      blockers.forEach(blocker => sections.push(`- ⚠️ ${blocker}`));
      sections.push('');
    }

    sections.push(
      '## Request',
      'Please provide a comprehensive status analysis that includes:',
      '',
      '### Progress Assessment',
      '- Overall progress evaluation',
      '- Completed milestones and achievements',
      '- Quality assessment of deliverables',
      '- Alignment with original requirements and design',
      '',
      '### Next Steps Identification',
      '- Immediate next tasks and priorities',
      '- Upcoming milestones and deadlines',
      '- Resource requirements and allocation',
      '- Risk assessment and mitigation plans',
      '',
      '### Blocker Resolution',
      '- Analysis of current blockers and challenges',
      '- Recommended solutions and workarounds',
      '- Escalation requirements if needed',
      '- Timeline impact assessment',
      '',
      '### Recommendations',
      '- Process improvements and optimizations',
      '- Quality enhancement suggestions',
      '- Team coordination recommendations',
      '- Documentation and communication updates',
      '',
      'Provide actionable insights and clear recommendations for moving forward.',
      'Focus on maintaining quality while meeting project timelines and objectives.'
    );

    return {
      content: sections.join('\n'),
      metadata: {
        feature: context.featureName,
        phase: 'status',
        language: context.language || Language.ENGLISH,
        projectContext: {
          projectName: context.projectName,
          completedTasks: completedTasks.length,
          hasBlockers: (blockers && blockers.length > 0),
          ...context.additionalContext
        }
      }
    };
  }
}