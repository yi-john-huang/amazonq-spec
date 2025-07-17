---
description: Initialize a new specification directory and metadata (initialization only)
allowed-tools: Bash, Read, Write, Glob
---

# Spec Initialization

Initialize a new specification structure for feature: **$ARGUMENTS**

## Steering Context Validation

### Check Steering Documents
- Structure context: @.claude/steering/structure.md
- Technical constraints: @.claude/steering/tech.md  
- Product context: @.claude/steering/product.md

### Verify Steering Exists
- Steering files: !`ls -la .claude/steering/`

**FLEXIBILITY**: For new features or empty projects, steering documents are recommended but not required. If steering documents are missing or empty, you may proceed directly to spec generation phase.

## Task: Initialize Specification Structure

**SCOPE**: This command only initializes the directory structure and metadata. Content generation happens in subsequent phases with proper review.

### 1. Create Spec Directory
Create `.claude/specs/{the summary of feature name: $ARGUMENTS}/` directory with empty template files:
- `requirements.md` - Empty template for user stories
- `design.md` - Empty template for technical design  
- `tasks.md` - Empty template for implementation tasks
- `spec.json` - Metadata and approval tracking

### 2. Initialize spec.json Metadata
Create initial metadata with approval tracking:
```json
{
  "feature_name": "{the summary of feature name: $ARGUMENTS}",
  "created_at": "current_timestamp",
  "updated_at": "current_timestamp",
  "language": "japanese",
  "phase": "initialized",
  "approvals": {
    "requirements": false,
    "design": false,
    "tasks": false
  },
  "progress": {
    "requirements": 0,
    "design": 0,
    "tasks": 0
  },
  "steering_version": "current_git_hash",
  "ready_for_implementation": false
}
```

### 3. Create Empty Template Files

#### requirements.md (Empty Template)
```markdown
# Requirements Document

## Introduction
<!-- Feature overview will be generated in /spec-requirements phase -->

## Requirements
<!-- User stories will be generated in /spec-requirements phase -->

---
**STATUS**: Ready for requirements generation
**NEXT STEP**: Run `/spec-requirements $ARGUMENTS` to generate requirements
```

#### design.md (Empty Template)
```markdown
# Design Document

## Overview
<!-- Technical design will be generated after requirements approval -->

---
**STATUS**: Waiting for requirements approval
**NEXT STEP**: Complete and approve requirements first
```

#### tasks.md (Empty Template)
```markdown
# Implementation Plan

<!-- Implementation tasks will be generated after design approval -->

---
**STATUS**: Waiting for design approval  
**NEXT STEP**: Complete and approve design first
```

### 4. Update CLAUDE.md Reference
Add the new spec to the active specifications list.

## Next Steps After Initialization

Follow the proper spec-driven development workflow:

**For new features or when no content exists:**
1. **Generate requirements**: `/spec-requirements $ARGUMENTS`

**Standard workflow (after requirements exist):**
1. **Generate requirements**: `/spec-requirements $ARGUMENTS`
2. **Review requirements**: `/spec-review-requirements $ARGUMENTS`
3. **Generate design**: `/spec-design $ARGUMENTS` (after requirements approval)
4. **Review design**: `/spec-review-design $ARGUMENTS`
5. **Generate tasks**: `/spec-tasks $ARGUMENTS` (after design approval)
6. **Review tasks**: `/spec-review-tasks $ARGUMENTS`
7. **Start implementation**: After all approvals are complete

## Instructions

1. **Check steering documents** - recommended but not required for new features
2. **Create directory structure only** - no content generation
3. **Set up approval tracking** in metadata
4. **Provide clear next steps** for the user
5. **Enable flexible workflow** - allow direct progression to requirements when appropriate

This ensures the proper spec-driven development workflow with mandatory review phases between each step.