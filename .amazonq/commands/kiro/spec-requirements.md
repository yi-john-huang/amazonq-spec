---
description: Generate detailed requirements document for a feature via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Requirements Generation

This template defines the `/kiro:spec-requirements` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
```
/kiro:spec-requirements <feature-name>
```

## Implementation Logic

When a user types `/kiro:spec-requirements feature-name` in `q chat --agent sdd`:

### 1. Validate Feature Exists
- Check that `.kiro/specs/{feature-name}/` directory exists
- Verify spec.json file is present
- Read current project description from requirements.md

### 2. Read Project Context
- Load existing requirements.md for user's project description
- Read `.kiro/steering/` files if they exist for project context
- Check current phase in spec.json

### 3. Generate Comprehensive Requirements
Create detailed requirements document with:

#### Structure Template:
```markdown
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
```

### 4. Update Workflow State
Update spec.json:
```json
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
```

## Agent Response Format

After successful generation:

```
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
After reviewing, use `/kiro:spec-design {feature-name}` to generate technical design.

**Workflow:**
1. ✅ spec-init
2. ✅ spec-requirements ← You are here  
3. ⏳ spec-design (requires requirements approval)
4. ⏳ spec-tasks  
5. ⏳ spec-impl
```

## Approval Gate

The agent should enforce that design cannot proceed until requirements are approved:
- Check spec.json approval status before allowing spec-design
- Prompt user to review requirements.md before proceeding

## Error Handling

- If feature doesn't exist: "Feature '{feature-name}' not found. Use `/kiro:spec-init` to create it first."
- If already generated: "Requirements already generated. Use `/kiro:spec-status {feature-name}` to check status."
- If no project description: "No project description found. Please check requirements.md file."

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type `/kiro:spec-requirements` in Amazon Q CLI chat with `--agent sdd`.