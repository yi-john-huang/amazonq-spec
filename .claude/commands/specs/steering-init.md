---
description: Initialize project steering documents for spec-driven development
allowed-tools: Bash, Read, Write, Glob, Grep
---

# Steering Initialization

Analyze the current project and generate comprehensive steering documents to establish the foundation for spec-driven development.

## Project Analysis

### Current Project Structure
- Project files: !`find . -type f -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.java" -o -name "*.go" -o -name "*.rs" | grep -v node_modules | grep -v .git | head -20`
- Configuration files: !`find . -maxdepth 2 -name "package.json" -o -name "requirements.txt" -o -name "pom.xml" -o -name "Cargo.toml" -o -name "go.mod" -o -name "pyproject.toml"`
- Documentation: !`find . -maxdepth 2 -name "README*" -o -name "CHANGELOG*" -o -name "LICENSE*"`

### Existing Documentation
- Main README: @README.md
- Package configuration: @package.json
- Python requirements: @requirements.txt
- Project documentation: @docs/

## Task: Generate Steering Documents

You must create three steering documents in `.claude/steering/`:

### 1. structure.md
- Document current architecture and key components
- Analyze code organization and module structure
- Identify main entry points and core logic
- Document directory structure and naming conventions
- Include architectural patterns and design decisions

### 2. tech.md
- Document technology stack and dependencies
- Identify development patterns and conventions
- Document build tools and deployment processes
- Include testing frameworks and quality tools
- Note technical constraints and limitations

### 3. product.md
- Document business context and project purpose
- Identify existing features and user workflows
- Document target audience and use cases
- Include project goals and success metrics
- Note any product constraints or requirements

## Instructions

1. **Analyze the codebase thoroughly** before generating documents
2. **Create comprehensive baseline understanding** of the current project
3. **Focus on factual observations** rather than assumptions
4. **Use clear, structured format** for easy reference
5. **Include examples** where helpful for understanding

Generate these documents to provide solid foundation for future spec-driven development.