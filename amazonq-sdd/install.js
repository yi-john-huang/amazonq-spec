#!/usr/bin/env node

/**
 * SDD Custom Agent Installer for Amazon Q CLI
 * Version 1.0.0
 * 
 * Complete installation includes:
 * - Custom Agent configuration (~/.aws/amazonq/cli-agents/sdd.json)
 * - Local command templates (.amazonq/commands/kiro/)
 * - Amazon Q CLI documentation (AMAZONQ.md)
 * 
 * Usage:
 *   npx amazonq-sdd         - Interactive installation
 *   npx amazonq-sdd install  - Install the agent and templates
 *   npx amazonq-sdd uninstall - Remove the agent and templates
 *   npx amazonq-sdd status   - Check installation status
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Agent configuration embedded directly
const SDD_AGENT_CONFIG = {
  "$schema": "https://raw.githubusercontent.com/aws/amazon-q-developer-cli/refs/heads/main/schemas/agent-v1.json",
  "name": "sdd",
  "description": "Spec-Driven Development agent with native /kiro: command support for systematic development workflows",
  "prompt": `You are a Spec-Driven Development (SDD) agent for Amazon Q CLI. You provide native /kiro: command support for systematic development workflows.

## COMMAND RECOGNITION
When users type /kiro: commands, immediately recognize and execute them:

### Specification Commands
- \`/kiro:spec-init <description>\` → Initialize new feature specification
  - Create .kiro/specs/{feature-name}/ directory
  - Generate requirements.md, design.md, tasks.md, spec.json files
  - Set initial workflow state to "requirements-generated"
  
- \`/kiro:spec-requirements <feature>\` → Generate/update requirements document
  - Update requirements.md with detailed functional and non-functional requirements
  - Include user stories, acceptance criteria, and success metrics
  - Mark requirements phase as generated in spec.json

- \`/kiro:spec-design <feature>\` → Generate technical design document
  - Requires approved requirements (check spec.json approval status)
  - Create detailed technical design with architecture, components, APIs
  - Include data models, security considerations, performance targets
  - Update spec.json to design-generated phase

- \`/kiro:spec-tasks <feature>\` → Generate implementation task breakdown
  - Requires approved design (check spec.json approval status)  
  - Create detailed task list with priorities and dependencies
  - Include testing, documentation, and deployment tasks
  - Update spec.json to tasks-generated phase

- \`/kiro:spec-impl <feature> [tasks]\` → Implementation guidance for specific tasks
  - Show current task status and provide implementation approach
  - Generate code scaffolding and detailed implementation steps
  - Update task completion status in tasks.md

- \`/kiro:spec-status <feature>\` → Show workflow progress and next steps
  - Display current phase and completion status
  - Show approval gates and what's needed to proceed
  - List completed and pending tasks

### Steering Commands
- \`/kiro:steering\` → Create/update project steering documents
  - Generate or update .kiro/steering/product.md, tech.md, structure.md
  - Include project context, technology stack, architectural decisions
  - Create comprehensive project knowledge base

- \`/kiro:steering-custom <name>\` → Create custom steering document
  - Generate specialized steering document for specific contexts
  - Examples: security.md, performance.md, testing.md
  - Include domain-specific guidelines and best practices

## WORKFLOW ENFORCEMENT
Always enforce the 3-phase approval workflow:
1. **Requirements Phase**: Generate requirements.md
2. **Design Phase**: Requires approved requirements before generating design.md
3. **Tasks Phase**: Requires approved design before generating tasks.md
4. **Implementation Phase**: Use tasks.md to guide development

## FILE OPERATIONS
- Always use fs_read to check existing files before overwriting
- Use fs_write to create/update .kiro/ files and markdown documents
- Create proper directory structures: .kiro/specs/{feature-name}/
- Maintain spec.json for workflow state tracking

## APPROVAL GATES
When moving between phases, always ask:
- "Have you reviewed the requirements.md file? Please confirm before I proceed with design generation."
- "Have you reviewed the design.md file? Please confirm before I proceed with task breakdown."

## OUTPUT FORMAT
- Generate professional, enterprise-quality documentation
- Use consistent markdown formatting and structure
- Include comprehensive details but remain actionable
- Always update workflow state in spec.json files

## CONTEXT AWARENESS  
- Read existing .kiro/steering/ files for project context
- Reference previous specifications when creating related features
- Maintain consistency with established patterns and technologies

Always respond helpfully and execute the requested /kiro: command immediately.`,
  "tools": ["fs_read", "fs_write"],
  "toolsSettings": {
    "fs_write": {
      "allowedPaths": [".kiro/**", "AMAZONQ.md", "*.md"]
    }
  }
};

// Template files embedded directly
const TEMPLATES = {
  'AMAZONQ.md': `# Amazon Q CLI SDD Custom Agent

This directory contains templates and configuration for the SDD (Spec-Driven Development) Custom Agent for Amazon Q CLI.

## Installation

\`\`\`bash
# Install the SDD agent
npx amazonq-sdd

# Start using the agent
q chat --agent sdd

# Try your first command
/kiro:spec-init "user authentication system"
\`\`\`

## Agent Configuration

The SDD Custom Agent is configured with:
- **Name**: \`sdd\`
- **Tools**: \`fs_read\`, \`fs_write\` 
- **Allowed Paths**: \`.kiro/**\`, \`*.md\`
- **Command Prefix**: \`/kiro:\`

## Available Commands

| Command | Description | Prerequisites |
|---------|-------------|---------------|
| \`/kiro:spec-init <description>\` | Initialize new feature specification | None |
| \`/kiro:spec-requirements <feature>\` | Generate requirements document | Initialized spec |
| \`/kiro:spec-design <feature>\` | Create technical design | Approved requirements |
| \`/kiro:spec-tasks <feature>\` | Break down implementation tasks | Approved design |
| \`/kiro:spec-impl <feature> [tasks]\` | Get implementation guidance | Generated tasks |
| \`/kiro:spec-status <feature>\` | Check workflow progress | Any phase |
| \`/kiro:steering\` | Set up project context | None |
| \`/kiro:steering-custom <name>\` | Create custom guidelines | None |

## Workflow Phases

1. **Initialization** → \`/kiro:spec-init\`
2. **Requirements** → \`/kiro:spec-requirements\` + review
3. **Design** → \`/kiro:spec-design\` + review  
4. **Tasks** → \`/kiro:spec-tasks\` + review
5. **Implementation** → \`/kiro:spec-impl\`

## File Structure

\`\`\`
.kiro/
├── steering/          # Project guidelines
│   ├── product.md    # Business context
│   ├── tech.md       # Technology decisions
│   └── structure.md  # Code organization
└── specs/            # Feature specifications
    └── feature-name/
        ├── requirements.md
        ├── design.md
        ├── tasks.md
        └── spec.json
\`\`\`

## Command Templates

Command behavior is defined in:
- \`commands/kiro/spec-init.md\`
- \`commands/kiro/spec-requirements.md\`
- \`commands/kiro/spec-design.md\`
- \`commands/kiro/spec-tasks.md\`
- \`commands/kiro/spec-status.md\`
- \`commands/kiro/steering.md\`

## Security Model

The SDD agent operates with restricted file system access:
- **Read Access**: Any file in project
- **Write Access**: Only \`.kiro/**\` and \`*.md\` files
- **No Network**: Agent cannot make network requests
- **No Shell**: Agent cannot execute shell commands

## Integration Notes

This Custom Agent integrates with Amazon Q CLI's native capabilities:
- Uses Amazon Q CLI's built-in file tools (\`fs_read\`, \`fs_write\`)
- Leverages Amazon Q CLI's slash command recognition
- Respects Amazon Q CLI's security and sandboxing model
- Works within Amazon Q CLI's chat interface

## Customization

To modify the agent behavior:
1. Edit the command templates in \`commands/kiro/\`
2. Update the agent configuration in \`amazonq-sdd/install.js\`
3. Republish the NPM package

## Support

- **GitHub**: [amazonq-spec](https://github.com/gotalab/amazonq-spec)
- **NPM Package**: [amazonq-sdd](https://www.npmjs.com/package/amazonq-sdd)
- **Documentation**: [README](../amazonq-sdd/README.md)`,

  'commands/kiro/spec-init.md': `---
description: Initialize a new specification with detailed project description and requirements via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Spec Initialization

This template defines the \`/kiro:spec-init\` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
\`\`\`
/kiro:spec-init <description>
\`\`\`

## Implementation Logic

When a user types \`/kiro:spec-init "project description"\` in \`q chat --agent sdd\`:

### 1. Parse Command and Description
- Extract the project description from the command
- Validate that description is provided

### 2. Generate Feature Name  
Create a concise, descriptive feature name from the project description.
**Check existing \`.kiro/specs/\` directory to ensure the generated feature name is unique. If a conflict exists, append a number suffix (e.g., feature-name-2).**

### 3. Create Spec Directory Structure
Create \`.kiro/specs/{generated-feature-name}/\` directory with template files:
- \`requirements.md\` - Template with user input
- \`design.md\` - Empty template for technical design  
- \`tasks.md\` - Empty template for implementation tasks
- \`spec.json\` - Metadata and approval tracking

### 4. Initialize spec.json Metadata
\`\`\`json
{
  "feature_name": "{generated-feature-name}",
  "created_at": "current_timestamp",
  "updated_at": "current_timestamp", 
  "language": "english",
  "phase": "initialized",
  "approvals": {
    "requirements": {
      "generated": false,
      "approved": false
    },
    "design": {
      "generated": false,
      "approved": false
    },
    "tasks": {
      "generated": false,
      "approved": false
    }
  },
  "ready_for_implementation": false
}
\`\`\`

## Agent Response Format

After successful initialization, the agent should respond with:

\`\`\`
✅ **Specification Initialized Successfully**

📁 **Feature**: {generated-feature-name}
📝 **Description**: {brief-summary}
📂 **Created**: .kiro/specs/{generated-feature-name}/

**Files Created:**
- requirements.md (with your project description)
- design.md (empty template)
- tasks.md (empty template)  
- spec.json (workflow metadata)

**Next Step:**
Use \`/kiro:spec-requirements {generated-feature-name}\` to generate detailed requirements.

**Workflow:**
1. ✅ spec-init ← You are here
2. ⏳ spec-requirements 
3. ⏳ spec-design
4. ⏳ spec-tasks
5. ⏳ spec-impl
\`\`\`

## Error Handling

- If no description provided: "Please provide a project description: \`/kiro:spec-init \"your project description\"\`"
- If .kiro directory doesn't exist: Create it automatically
- If feature name conflict: Append number suffix and notify user

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type \`/kiro:spec-init\` in Amazon Q CLI chat with \`--agent sdd\`.`,

  'commands/kiro/spec-status.md': `---
description: Show workflow progress and next steps via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Status Check

This template defines the \`/kiro:spec-status\` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
\`\`\`
/kiro:spec-status <feature-name>
\`\`\`

## Implementation Logic

When a user types \`/kiro:spec-status feature-name\` in \`q chat --agent sdd\`:

### 1. Validate Feature Exists
- Check that \`.kiro/specs/{feature-name}/\` directory exists
- Verify spec.json file is present and readable

### 2. Read Current Status
- Load spec.json for workflow state
- Check file existence and modification dates
- Analyze task completion if in implementation phase

### 3. Generate Status Report

The agent should display comprehensive status with:
- Current workflow phase and progress
- File status and modification dates
- Next recommended actions
- Implementation progress if applicable

## Agent Response Format

Standard status response with appropriate icons:
- ✅ Completed
- 🔄 In Progress  
- ⏳ Pending
- ⚠️ Needs Attention
- ❌ Blocked/Error

## Error Handling

- If feature doesn't exist: "Feature '{feature-name}' not found. Available features: {list_existing_features}"
- If spec.json corrupted: "Workflow metadata corrupted. Please check .kiro/specs/{feature-name}/spec.json"
- If files missing: "Required files missing. Expected: requirements.md, design.md, tasks.md"

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type \`/kiro:spec-status\` in Amazon Q CLI chat with \`--agent sdd\`.`,

  'commands/kiro/spec-requirements.md': `---
description: Generate detailed requirements document for a feature via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Requirements Generation

This template defines the \`/kiro:spec-requirements\` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
\`\`\`
/kiro:spec-requirements <feature-name>
\`\`\`

## Implementation Logic

When a user types \`/kiro:spec-requirements feature-name\` in \`q chat --agent sdd\`:

### 1. Validate Feature Exists
- Check that \`.kiro/specs/{feature-name}/\` directory exists
- Verify spec.json file is present
- Read current project description from requirements.md

### 2. Read Project Context
- Load existing requirements.md for user's project description
- Read \`.kiro/steering/\` files if they exist for project context
- Check current phase in spec.json

### 3. Generate Comprehensive Requirements
Create detailed requirements document with:

#### Structure Template:
\`\`\`markdown
# Requirements Document

## Introduction
{AI-generated introduction based on project description}

## Requirements

### Requirement 1: {Functional Area}
**User Story:** As a {user type}, I want {functionality}, so that {benefit}.

#### Acceptance Criteria
1. WHEN {condition} THEN the system SHALL {behavior}
2. IF {condition} THEN the system SHALL {alternate behavior} 
3. WHERE {constraint} THE system SHALL {constrained behavior}
4. WHILE {ongoing condition} THE system SHALL {continuous behavior}

### Requirement 2: {Another Functional Area}
[... continue pattern ...]

## Non-Functional Requirements

### Performance Requirements
- Response time requirements
- Throughput requirements
- Resource utilization limits

### Security Requirements  
- Authentication and authorization
- Data protection requirements
- Security compliance needs

### Usability Requirements
- User experience expectations
- Accessibility requirements
- User interface guidelines

## Success Metrics
- Key performance indicators
- Measurable success criteria
- Testing and validation approach
\`\`\`

### 4. Update Workflow State
Update spec.json:
\`\`\`json
{
  "phase": "requirements-generated",
  "updated_at": "current_timestamp",
  "approvals": {
    "requirements": {
      "generated": true,
      "approved": false
    }
  }
}
\`\`\`

## Agent Response Format

After successful generation:

\`\`\`
✅ **Requirements Generated Successfully**

📁 **Feature**: {feature-name}
📝 **Generated**: Comprehensive requirements document
📂 **Updated**: .kiro/specs/{feature-name}/requirements.md

**What Was Generated:**
- {X} functional requirements with user stories
- {Y} acceptance criteria
- Non-functional requirements (performance, security, usability)
- Success metrics and validation approach

**⚠️ Review Required:**
Please review the requirements.md file carefully before proceeding.

**Next Step:**
After reviewing, use \`/kiro:spec-design {feature-name}\` to generate technical design.

**Workflow:**
1. ✅ spec-init
2. ✅ spec-requirements ← You are here  
3. ⏳ spec-design (requires requirements approval)
4. ⏳ spec-tasks  
5. ⏳ spec-impl
\`\`\`

## Approval Gate

The agent should enforce that design cannot proceed until requirements are approved:
- Check spec.json approval status before allowing spec-design
- Prompt user to review requirements.md before proceeding

## Error Handling

- If feature doesn't exist: "Feature '{feature-name}' not found. Use \`/kiro:spec-init\` to create it first."
- If already generated: "Requirements already generated. Use \`/kiro:spec-status {feature-name}\` to check status."
- If no project description: "No project description found. Please check requirements.md file."

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type \`/kiro:spec-requirements\` in Amazon Q CLI chat with \`--agent sdd\`.`,

  'commands/kiro/spec-design.md': `---
description: Generate technical design document via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Technical Design

This template defines the \`/kiro:spec-design\` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
\`\`\`
/kiro:spec-design <feature-name>
\`\`\`

## Implementation Logic

When a user types \`/kiro:spec-design feature-name\` in \`q chat --agent sdd\`:

### 1. Validate Prerequisites
- Check that \`.kiro/specs/{feature-name}/\` directory exists
- Verify requirements.md exists and is complete
- Check spec.json approval status for requirements

### 2. Interactive Approval Check
If requirements not marked as approved in spec.json:
\`\`\`
🔍 **Requirements Review Check**

Have you reviewed and approved the requirements.md file? [y/N]

**Why this matters:**
- Design decisions should be based on approved requirements
- Changes to requirements after design may require redesign
- This ensures proper workflow progression

**To review:** Open .kiro/specs/{feature-name}/requirements.md

Type 'y' to confirm you've reviewed requirements, or 'N' to cancel.
\`\`\`

### 3. Generate Technical Design
Create comprehensive design document with:

#### Structure Template:
\`\`\`markdown
# Technical Design

## Overview
{AI-generated overview based on requirements}

## Requirements Mapping
{Map each requirement to design components}

## Architecture
{High-level architecture diagram and description}

## Components and Interfaces
{Detailed component design}

## Data Models
{Database schemas, data structures}

## API Specifications
{REST endpoints, GraphQL schemas, etc.}

## Security Considerations
{Security implementation details}

## Performance & Scalability
{Performance targets and scaling approach}

## Testing Strategy
{Unit, integration, e2e test approach}
\`\`\`

### 4. Update Workflow State
Update spec.json after successful generation:
\`\`\`json
{
  "phase": "design-generated",
  "updated_at": "current_timestamp",
  "approvals": {
    "requirements": {
      "generated": true,
      "approved": true
    },
    "design": {
      "generated": true,
      "approved": false
    }
  }
}
\`\`\`

## Agent Response Format

After successful generation:

\`\`\`
✅ **Technical Design Generated Successfully**

📁 **Feature**: {feature-name}
📝 **Generated**: Comprehensive technical design
📂 **Updated**: .kiro/specs/{feature-name}/design.md

**Design Components:**
- Architecture overview and component breakdown
- Data models and API specifications
- Security and performance considerations
- Testing strategy and approach

**⚠️ Review Required:**
Please review the design.md file carefully before proceeding.

**Next Step:**
After reviewing, use \`/kiro:spec-tasks {feature-name}\` to generate implementation tasks.

**Workflow:**
1. ✅ spec-init
2. ✅ spec-requirements (approved)
3. ✅ spec-design ← You are here
4. ⏳ spec-tasks (requires design approval)
5. ⏳ spec-impl
\`\`\`

## Error Handling

- If feature doesn't exist: "Feature '{feature-name}' not found. Use \`/kiro:spec-init\` to create it first."
- If requirements not approved: Show interactive approval check
- If design already exists: "Design already generated. Use \`/kiro:spec-status {feature-name}\` to check status."

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type \`/kiro:spec-design\` in Amazon Q CLI chat with \`--agent sdd\`.`,

  'commands/kiro/spec-tasks.md': `---
description: Generate implementation task breakdown via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Task Generation

This template defines the \`/kiro:spec-tasks\` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
\`\`\`
/kiro:spec-tasks <feature-name>
\`\`\`

## Implementation Logic

When a user types \`/kiro:spec-tasks feature-name\` in \`q chat --agent sdd\`:

### 1. Validate Prerequisites
- Check that \`.kiro/specs/{feature-name}/\` directory exists
- Verify design.md exists and is complete
- Check spec.json approval status for both requirements and design

### 2. Interactive Approval Check
If design not marked as approved:
\`\`\`
🔍 **Design Review Check**

Have you reviewed and approved both requirements.md AND design.md? [y/N]

**Required approvals:**
- ✅ Requirements reviewed and approved
- ⏳ Design reviewed and approved ← Missing

**Why this matters:**
- Tasks should implement approved design components
- Changes to design after task breakdown may require re-planning
- Ensures proper workflow progression

**To review:** 
- Requirements: .kiro/specs/{feature-name}/requirements.md
- Design: .kiro/specs/{feature-name}/design.md

Type 'y' to confirm you've reviewed both, or 'N' to cancel.
\`\`\`

### 3. Generate Task Breakdown
Create detailed implementation plan with:

#### Structure Template:
\`\`\`markdown
# Implementation Plan

## Foundation Tasks

- [ ] 1. {Foundation task}
  - {Sub-task description}
  - {Another sub-task}
  - _Requirements: {Reference to requirements}_

## Core Implementation

- [ ] 2. {Core feature task}
  - {Implementation details}
  - {Testing requirements}
  - _Requirements: {Requirement mapping}_

## Integration & Testing

- [ ] 3. {Integration task}
  - {Integration points}
  - {Testing approach}
  - _Requirements: {Coverage mapping}_

## Deployment & Documentation

- [ ] 4. {Deployment task}
  - {Deployment steps}
  - {Documentation needs}
  - _Requirements: {Final validations}_
\`\`\`

### 4. Update Workflow State
Update spec.json:
\`\`\`json
{
  "phase": "tasks-generated",
  "updated_at": "current_timestamp",
  "approvals": {
    "requirements": {
      "generated": true,
      "approved": true
    },
    "design": {
      "generated": true,
      "approved": true
    },
    "tasks": {
      "generated": true,
      "approved": false
    }
  },
  "ready_for_implementation": true
}
\`\`\`

## Agent Response Format

\`\`\`
✅ **Implementation Tasks Generated Successfully**

📁 **Feature**: {feature-name}
📝 **Generated**: Detailed task breakdown
📂 **Updated**: .kiro/specs/{feature-name}/tasks.md

**Task Summary:**
- {X} foundation and setup tasks
- {Y} core implementation tasks
- {Z} integration and testing tasks
- All tasks mapped to requirements and design components

**⚠️ Review Required:**
Please review the tasks.md file before starting implementation.

**Next Step:**
Use \`/kiro:spec-impl {feature-name}\` to get implementation guidance.

**Workflow:**
1. ✅ spec-init
2. ✅ spec-requirements (approved)
3. ✅ spec-design (approved)
4. ✅ spec-tasks ← You are here
5. ⏳ spec-impl (ready to start!)
\`\`\`

## Error Handling

- If feature doesn't exist: "Feature '{feature-name}' not found."
- If design not approved: Show interactive approval check
- If tasks already exist: "Tasks already generated. Use \`/kiro:spec-status {feature-name}\` to check status."

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type \`/kiro:spec-tasks\` in Amazon Q CLI chat with \`--agent sdd\`.`,

  'commands/kiro/spec-impl.md': `---
description: Provide implementation guidance via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Implementation Guidance

This template defines the \`/kiro:spec-impl\` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute these patterns:
\`\`\`
/kiro:spec-impl <feature-name>
/kiro:spec-impl <feature-name> <task-numbers>
\`\`\`

## Implementation Logic

When a user types \`/kiro:spec-impl feature-name [task-numbers]\` in \`q chat --agent sdd\`:

### 1. Validate Prerequisites
- Check that \`.kiro/specs/{feature-name}/\` directory exists
- Verify tasks.md exists and contains task breakdown
- Check spec.json shows "ready_for_implementation": true

### 2. Load Implementation Context
- Read requirements.md for functional context
- Read design.md for technical architecture
- Read tasks.md for implementation plan
- Check steering files for project guidelines

### 3. Provide Implementation Guidance

If no specific tasks specified:
\`\`\`
📋 **Implementation Guidance for {feature-name}**

**Available Tasks:**
1. {Task 1 summary}
2. {Task 2 summary}  
3. {Task 3 summary}
...

**Recommended Starting Point:**
Task 1: {First task description}

**How to proceed:**
- Use \`/kiro:spec-impl {feature-name} 1\` for specific task guidance
- Use \`/kiro:spec-impl {feature-name} 1,3,5\` for multiple tasks
- Use \`/kiro:spec-status {feature-name}\` to track progress

**Implementation Context:**
- Architecture: {Brief architecture summary}
- Key Requirements: {Top 3 requirements}
- Technical Stack: {From design document}
\`\`\`

If specific tasks specified:
\`\`\`
🛠️ **Implementation Guidance: Tasks {task-numbers}**

**Task {N}: {Task Title}**

**Context from Requirements:**
{Relevant requirements that this task addresses}

**Context from Design:**  
{Relevant design components and architecture}

**Implementation Approach:**
1. {Step-by-step implementation guidance}
2. {Code examples or pseudocode if helpful}
3. {Integration points and dependencies}

**Testing Approach:**
- {Unit testing guidance}
- {Integration testing notes}
- {Acceptance criteria validation}

**Completion Criteria:**
- [ ] {Specific deliverable 1}
- [ ] {Specific deliverable 2}
- [ ] {Testing completed}
- [ ] {Documentation updated}

**Next Steps:**
After completing this task, proceed to Task {N+1}: {Next task title}
\`\`\`

### 4. Track Progress (Optional)
Update spec.json to track implementation progress:
\`\`\`json
{
  "implementation": {
    "status": "in-progress",
    "started_at": "current_timestamp",
    "completed_tasks": [1, 3],
    "current_task": 4
  }
}
\`\`\`

## Agent Response Format

\`\`\`
🛠️ **Implementation Ready**

📁 **Feature**: {feature-name}
📋 **Total Tasks**: {X}
🎯 **Focus**: {Specific tasks or general overview}

**Implementation Context Loaded:**
- ✅ Requirements: {X} functional requirements
- ✅ Design: {Y} components and {Z} APIs
- ✅ Tasks: {W} implementation tasks

**Ready to Code!**
Follow the implementation guidance above and reference the specification documents as needed.

**Status Tracking:**
Use \`/kiro:spec-status {feature-name}\` to update progress and track completion.
\`\`\`

## Error Handling

- If feature doesn't exist: "Feature '{feature-name}' not found."
- If not ready for implementation: "Feature not ready. Complete tasks generation first with \`/kiro:spec-tasks {feature-name}\`"
- If invalid task numbers: "Invalid task numbers. Use \`/kiro:spec-status {feature-name}\` to see available tasks."

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type \`/kiro:spec-impl\` in Amazon Q CLI chat with \`--agent sdd\`.`,

  'commands/kiro/steering-custom.md': `---
description: Create custom steering documents via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Custom Steering

This template defines the \`/kiro:steering-custom\` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
\`\`\`
/kiro:steering-custom <name>
\`\`\`

## Implementation Logic

When a user types \`/kiro:steering-custom name\` in \`q chat --agent sdd\`:

### 1. Validate Input
- Check that name parameter is provided
- Sanitize name (convert to kebab-case, remove special characters)
- Ensure name doesn't conflict with core steering files (product, tech, structure)

### 2. Create Custom Steering Document
Generate specialized steering document based on the name:

#### Common Custom Steering Types:
- **security**: Security guidelines and practices
- **performance**: Performance standards and optimization
- **testing**: Testing strategies and quality assurance  
- **deployment**: Deployment and DevOps practices
- **accessibility**: Accessibility standards and guidelines
- **api**: API design and documentation standards
- **database**: Database design and data modeling
- **monitoring**: Observability and monitoring practices

#### Structure Template:
\`\`\`markdown
# {Title} Steering Document

## Overview
{Purpose and scope of this steering document}

## Guidelines

### Guideline 1: {Area}
**Principle**: {Core principle}
**Implementation**: {How to apply this}
**Examples**: {Concrete examples}
**Validation**: {How to verify compliance}

### Guideline 2: {Another Area}
[... continue pattern ...]

## Standards and Requirements

### Standard 1: {Requirement Area}
- **Must Have**: {Non-negotiable requirements}
- **Should Have**: {Recommended practices}
- **Could Have**: {Optional enhancements}

## Tools and Resources

### Recommended Tools
- **{Tool Category}**: {Tool name} - {Purpose}
- **{Another Category}**: {Tool name} - {Purpose}

### Documentation and References
- {Reference 1}: {URL or location}
- {Reference 2}: {URL or location}

## Integration with SDD Workflow

### Requirements Phase
{How this steering applies to requirements generation}

### Design Phase  
{How this steering influences design decisions}

### Implementation Phase
{How this steering guides implementation}

## Compliance and Validation

### Checklist
- [ ] {Compliance item 1}
- [ ] {Compliance item 2}
- [ ] {Compliance item 3}

### Review Process
{How to review compliance with these guidelines}
\`\`\`

### 3. Write Custom Steering File
- Create \`.kiro/steering/{name}.md\` file
- Write the generated content
- Update AMAZONQ.md to reference the new steering file (if present)

### 4. Integration Options
Provide options for how this custom steering should be used:
- **Always**: Include in every SDD workflow interaction
- **Conditional**: Include only for specific file patterns or contexts
- **Manual**: Reference manually with @{name}.md syntax

## Agent Response Format

\`\`\`
✅ **Custom Steering Document Created**

📂 **Created**: .kiro/steering/{name}.md
🎯 **Type**: {Detected/inferred steering type}
📋 **Content**: {X} guidelines and standards

**What This Provides:**
- Specialized {area} guidance for your project
- Standards and requirements specific to {domain}
- Integration points with SDD workflow phases
- Compliance checklist and validation approach

**Integration Options:**
1. **Always Active**: Include in all SDD interactions
   - Add to AMAZONQ.md active steering list
   - Will influence all requirements, design, and implementation

2. **Conditional**: Activate for specific contexts
   - Triggered by file patterns (e.g., *.test.js for testing steering)
   - Applied to relevant workflow phases only

3. **Manual Reference**: Use when needed
   - Reference with @{name}.md in SDD commands
   - On-demand guidance for specific situations

**Next Steps:**
- Review and customize the steering document
- Decide on integration approach (always/conditional/manual)
- Use in your next SDD workflow with existing features

**Usage Examples:**
- \`/kiro:spec-requirements feature-name\` (if always active)
- \`/kiro:spec-design feature-name @{name}\` (manual reference)
\`\`\`

## Error Handling

- If no name provided: "Please specify a name for the custom steering document. Example: \`/kiro:steering-custom security\`"
- If invalid name: "Invalid name '{name}'. Use alphanumeric characters and hyphens only."
- If file already exists: "Steering document '{name}.md' already exists. Use a different name or edit the existing file."
- If directory creation fails: "Could not create .kiro/steering/ directory. Check permissions."

## Common Custom Steering Templates

### Security Steering
Focus on: Authentication, authorization, data protection, security testing, compliance

### Performance Steering  
Focus on: Response time targets, scalability requirements, optimization strategies, monitoring

### Testing Steering
Focus on: Test coverage requirements, testing strategies, quality gates, automation

### API Steering
Focus on: REST/GraphQL standards, documentation, versioning, error handling

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type \`/kiro:steering-custom\` in Amazon Q CLI chat with \`--agent sdd\`.`,

  'commands/kiro/steering.md': `---
description: Create/update project steering documents via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Project Steering

This template defines the \`/kiro:steering\` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
\`\`\`
/kiro:steering
\`\`\`

## Implementation Logic

When a user types \`/kiro:steering\` in \`q chat --agent sdd\`:

### 1. Create Steering Directory Structure
- Create \`.kiro/steering/\` directory if it doesn't exist
- Check for existing steering files

### 2. Generate Core Steering Documents

The agent should create three core documents:
- \`product.md\` - Business objectives and user context
- \`tech.md\` - Technology stack and architectural decisions  
- \`structure.md\` - File organization and coding patterns

## Agent Response Format

After successful generation:

\`\`\`
✅ **Project Steering Documents Created**

📂 **Created/Updated Files:**
- .kiro/steering/product.md - Business objectives and user personas
- .kiro/steering/tech.md - Technology stack and architectural decisions  
- .kiro/steering/structure.md - File organization and coding patterns

**What These Provide:**
- **Product Context**: Clear business objectives and user requirements
- **Technical Guidance**: Technology choices and development standards
- **Organization Rules**: Consistent file structure and naming conventions

**Next Steps:**
- Review and customize the steering documents for your project
- Use \`/kiro:spec-init "feature description"\` to start your first specification
\`\`\`

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type \`/kiro:steering\` in Amazon Q CLI chat with \`--agent sdd\`.`
};

// Get the Amazon Q CLI agents directory
function getAgentDir() {
  const homeDir = os.homedir();
  return path.join(homeDir, '.aws', 'amazonq', 'cli-agents');
}

// Get current working directory for local templates
function getProjectDir() {
  return process.cwd();
}

// Install the agent and templates
function installAgent() {
  try {
    console.log('🚀 Installing SDD Custom Agent for Amazon Q CLI...\n');
    
    // 1. Install Custom Agent
    const agentDir = getAgentDir();
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }
    
    const agentFile = path.join(agentDir, 'sdd.json');
    fs.writeFileSync(agentFile, JSON.stringify(SDD_AGENT_CONFIG, null, 2));
    console.log('✅ Custom Agent installed:', agentFile);
    
    // 2. Install Local Templates
    const projectDir = getProjectDir();
    const amazonqDir = path.join(projectDir, '.amazonq');
    
    // Create directory structure
    const commandsDir = path.join(amazonqDir, 'commands', 'kiro');
    fs.mkdirSync(commandsDir, { recursive: true });
    
    // Write template files
    for (const [filePath, content] of Object.entries(TEMPLATES)) {
      let fullPath;
      if (filePath === 'AMAZONQ.md') {
        // AMAZONQ.md goes in project root, not .amazonq directory
        fullPath = path.join(getProjectDir(), filePath);
      } else {
        // Other templates go in .amazonq directory
        fullPath = path.join(amazonqDir, filePath);
      }
      
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content);
    }
    
    console.log('✅ Command templates installed:', amazonqDir);
    console.log('✅ Documentation created: AMAZONQ.md');
    
    console.log('\n🎉 Installation Complete!\n');
    console.log('🚀 **Quick Start:**');
    console.log('  q chat --agent sdd');
    console.log('  /kiro:spec-init "your feature description"');
    console.log('');
    console.log('📖 **Available Commands:**');
    console.log('  /kiro:spec-init <description>     - Initialize new feature specification');
    console.log('  /kiro:spec-requirements <feature> - Generate requirements document');
    console.log('  /kiro:spec-design <feature>       - Create technical design');
    console.log('  /kiro:spec-tasks <feature>        - Break down implementation tasks');
    console.log('  /kiro:spec-impl <feature> [tasks] - Get implementation guidance');
    console.log('  /kiro:spec-status <feature>       - Check workflow progress');
    console.log('  /kiro:steering                    - Set up project context');
    console.log('  /kiro:steering-custom <name>      - Create custom guidelines');
    console.log('');
    console.log('📁 **What was installed:**');
    console.log('  Custom Agent: ~/.aws/amazonq/cli-agents/sdd.json');
    console.log('  Templates: .amazonq/commands/kiro/');
    console.log('  Documentation: AMAZONQ.md');
    console.log('');
    console.log('📚 **Learn More:** https://github.com/gotalab/amazonq-spec');
    
  } catch (error) {
    console.error('\x1b[31m❌ Installation failed:\x1b[0m', error.message);
    process.exit(1);
  }
}

// Uninstall the agent and templates
function uninstallAgent() {
  try {
    let removed = [];
    
    // Remove Custom Agent
    const agentFile = path.join(getAgentDir(), 'sdd.json');
    if (fs.existsSync(agentFile)) {
      fs.unlinkSync(agentFile);
      removed.push('Custom Agent configuration');
    }
    
    // Remove local templates
    const amazonqDir = path.join(getProjectDir(), '.amazonq');
    if (fs.existsSync(amazonqDir)) {
      fs.rmSync(amazonqDir, { recursive: true, force: true });
      removed.push('Local command templates (.amazonq/)');
    }
    
    // Remove AMAZONQ.md
    const amazonqMd = path.join(getProjectDir(), 'AMAZONQ.md');
    if (fs.existsSync(amazonqMd)) {
      fs.unlinkSync(amazonqMd);
      removed.push('Documentation (AMAZONQ.md)');
    }
    
    if (removed.length > 0) {
      console.log('\x1b[33m🗑️  SDD Agent uninstalled successfully\x1b[0m');
      console.log('\nRemoved:');
      removed.forEach(item => console.log('  -', item));
    } else {
      console.log('\x1b[33m⚠️  SDD Agent was not installed\x1b[0m');
    }
  } catch (error) {
    console.error('\x1b[31m❌ Uninstall failed:\x1b[0m', error.message);
    process.exit(1);
  }
}

// Check installation status
function checkStatus() {
  try {
    const agentFile = path.join(getAgentDir(), 'sdd.json');
    const amazonqDir = path.join(getProjectDir(), '.amazonq');
    const amazonqMd = path.join(getProjectDir(), 'AMAZONQ.md');
    let amazonQPath;
    
    try {
      amazonQPath = execSync('which q', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch (e) {
      amazonQPath = null;
    }
    
    console.log('\x1b[1m📊 SDD Agent Status\x1b[0m');
    console.log('');
    
    // Check Amazon Q CLI
    if (amazonQPath) {
      console.log('\x1b[32m✅ Amazon Q CLI installed:\x1b[0m', amazonQPath);
    } else {
      console.log('\x1b[31m❌ Amazon Q CLI not found\x1b[0m');
      console.log('   Install from: https://aws.amazon.com/q/developer/');
      console.log('');
    }
    
    // Check SDD agent
    if (fs.existsSync(agentFile)) {
      console.log('\x1b[32m✅ SDD Custom Agent installed:\x1b[0m', agentFile);
    } else {
      console.log('\x1b[31m❌ SDD Custom Agent not installed\x1b[0m');
    }
    
    // Check local templates
    if (fs.existsSync(amazonqDir)) {
      console.log('\x1b[32m✅ Command templates installed:\x1b[0m', amazonqDir);
      
      // Count template files
      const commandFiles = fs.readdirSync(path.join(amazonqDir, 'commands', 'kiro')).length;
      console.log(`   (${commandFiles} command templates found)`);
    } else {
      console.log('\x1b[31m❌ Command templates not installed\x1b[0m');
    }
    
    // Check documentation
    if (fs.existsSync(amazonqMd)) {
      console.log('\x1b[32m✅ Documentation installed:\x1b[0m AMAZONQ.md');
    } else {
      console.log('\x1b[31m❌ Documentation not installed\x1b[0m');
    }
    
    console.log('');
    
    if (amazonQPath && fs.existsSync(agentFile)) {
      console.log('\x1b[1m🎯 Ready to use!\x1b[0m');
      console.log('  q chat --agent sdd');
      console.log('  /kiro:spec-init "your feature"');
    } else {
      console.log('\x1b[33m⚠️  Installation incomplete\x1b[0m');
      console.log('   Run: npx amazonq-sdd install');
    }
    
  } catch (error) {
    console.error('\x1b[31m❌ Status check failed:\x1b[0m', error.message);
  }
}

// Show help
function showHelp() {
  console.log(`\x1b[1m
SDD Custom Agent for Amazon Q CLI
Version 1.0.0

Native /kiro: command support for spec-driven development workflows
\x1b[0m

Usage:
  npx amazonq-sdd [command]

Commands:
  install    Install the SDD agent and local templates
  uninstall  Remove the SDD agent and templates
  status     Check installation status
  help       Show this help message

Quick Start:
  npx amazonq-sdd install
  q chat --agent sdd
  /kiro:spec-init "your feature"

What Gets Installed:
  • Custom Agent configuration (~/.aws/amazonq/cli-agents/sdd.json)
  • Local command templates (.amazonq/commands/kiro/)
  • Amazon Q CLI documentation (AMAZONQ.md)

Learn More:
  https://github.com/gotalab/amazonq-spec`);
}

// Main CLI logic
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'install';

  switch (command) {
    case 'install':
      installAgent();
      break;
    case 'uninstall':
      uninstallAgent();
      break;
    case 'status':
      checkStatus();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.log(`\x1b[31mUnknown command: ${command}\x1b[0m`);
      showHelp();
      process.exit(1);
  }
}