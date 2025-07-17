---
description: Generate comprehensive requirements for a specification
allowed-tools: Bash, Read, Write, Edit
---

# Requirements Generation

Generate comprehensive requirements for feature: **$ARGUMENTS**

## Context Validation

### Steering Context
- Architecture context: @.claude/steering/structure.md
- Technical constraints: @.claude/steering/tech.md
- Product context: @.claude/steering/product.md

### Existing Spec Context
- Current spec directory: !`ls -la .claude/specs/$ARGUMENTS/`
- Current requirements: @.claude/specs/$ARGUMENTS/requirements.md
- Spec metadata: @.claude/specs/$ARGUMENTS/spec.json

## Task: Generate Detailed Requirements

Create comprehensive requirements document following Japanese format from Kiro example:

### 1. Requirements Structure
Generate requirements.md in English following Kiro's proven format:

```markdown
# Requirements Specification

## Overview
[Clear overview of the feature and its purpose]

## Requirements

### Requirement 1
**User Story:** As a [user type], I want to [do something], so that I can [achieve some goal]

#### Acceptance Criteria
1. WHEN [specific condition] THEN [specific expected outcome]
2. WHEN [specific condition] THEN [specific expected outcome]
3. IF [exception condition] THEN [expected error handling]

### Requirement 2
**User Story:** As a [user type], I want to [do something], so that I can [achieve some goal]

#### Acceptance Criteria
1. WHEN [specific condition] THEN [specific expected outcome]
2. WHEN [specific condition] THEN [specific expected outcome]
3. IF [exception condition] THEN [expected error handling]

### Requirement 3
[Additional requirements following same pattern]
```

### 2. Requirements Quality Guidelines
- **User-Centric**: Write from user perspective
- **Testable**: Each acceptance criterion should be verifiable
- **Specific**: Use concrete conditions and outcomes
- **Complete**: Cover all major user scenarios
- **Contextual**: Consider existing system integration

### 3. Integration Considerations
Based on steering context, consider:
- How this feature fits with existing architecture
- Technical constraints that affect requirements
- Existing user workflows that need integration
- Performance and scalability requirements

### 4. Update Metadata
Update spec.json with:
```json
{
  "phase": "requirements",
  "progress": {
    "requirements": 100,
    "design": 0,
    "tasks": 0
  },
  "updated_at": "current_timestamp"
}
```

## Instructions

1. **Analyze existing product context** to understand user needs
2. **Create user-focused requirements** with clear acceptance criteria
3. **Consider technical constraints** from steering documents
4. **Ensure requirements are testable** and specific
5. **Update tracking metadata** upon completion

Generate requirements that provide clear foundation for design phase.