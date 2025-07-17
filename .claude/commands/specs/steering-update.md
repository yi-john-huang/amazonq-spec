---
description: Update steering documents based on recent project changes
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Steering Update

Update steering documents to reflect recent project changes and maintain accuracy for spec-driven development.

## Change Analysis

### Recent Changes
- Git log: !`git log --oneline -10`
- Modified files: !`git diff --name-only HEAD~5`
- Added files: !`git diff --name-status HEAD~5 | grep "^A"`
- Deleted files: !`git diff --name-status HEAD~5 | grep "^D"`

### Current Project State
- Current structure: !`find . -type f -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.java" -o -name "*.go" -o -name "*.rs" | grep -v node_modules | grep -v .git | head -20`
- Dependencies: !`find . -maxdepth 2 -name "package.json" -o -name "requirements.txt" -o -name "pom.xml" -o -name "Cargo.toml" -o -name "go.mod" -o -name "pyproject.toml"`

## Current Steering Documents

### Existing Steering Context
- Current structure: @.claude/steering/structure.md
- Current tech stack: @.claude/steering/tech.md
- Current product context: @.claude/steering/product.md

## Task: Update Steering Documents

Analyze the changes and update the steering documents accordingly:

### 1. Update structure.md
- Review architectural changes and component additions/removals
- Update code organization if directories or modules changed
- Reflect new patterns or refactoring decisions
- Update entry points if they changed

### 2. Update tech.md  
- Add new dependencies or remove obsolete ones
- Update development patterns if conventions changed
- Reflect new build tools or deployment changes
- Update testing frameworks or quality tools

### 3. Update product.md
- Add new features or remove deprecated ones
- Update user workflows if they changed
- Reflect new use cases or target audience changes
- Update project goals or success metrics

## Instructions

1. **Compare current state** with existing steering documents
2. **Identify meaningful changes** that affect project context
3. **Update only sections** that have actually changed
4. **Maintain consistency** with existing document structure
5. **Preserve historical context** while reflecting current reality

Focus on keeping steering documents current and accurate for ongoing spec-driven development.