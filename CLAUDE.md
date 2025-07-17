# Claude Code Spec-Driven Development

This project implements Kiro-style Spec-Driven Development for Claude Code using hooks and slash commands.

## Project Context

### Active Specifications
- Current spec: Check `.claude/specs/` for active specifications
- **pdf-drawing-explanation-app** - Phase: initialized
- Use `/spec-status [feature-name]` to check progress

### Project Steering
- Product context: `.claude/steering/product.md`
- Technical constraints: `.claude/steering/tech.md`
- Architecture decisions: `.claude/steering/structure.md`

## Spec-Driven Development Workflow

### Phase 0: Steering Generation (Recommended)
```
/steering-init     # Generate initial steering documents
/steering-update   # Update steering after changes
```

**Note**: For new features or empty projects, steering is recommended but not required. You can proceed directly to spec-requirements if needed.

### Phase 1: Specification Creation
```
/spec-init [feature-name]           # Initialize spec structure only
/spec-requirements [feature-name]   # Generate requirements → Review → Edit if needed
/spec-design [feature-name]         # Generate technical design → Review → Edit if needed
/spec-tasks [feature-name]          # Generate implementation tasks → Review → Edit if needed
```

### Phase 2: Progress Tracking
```
/spec-status [feature-name]         # Check current progress and phases
```

## Streamlined Review Process

Each generation command includes a review checkpoint at the end:

1. **After Requirements**: Review generated requirements, edit directly if changes needed
2. **After Design**: Review technical design against requirements, edit as necessary
3. **After Tasks**: Verify task breakdown and estimates, adjust before implementation

**No separate review commands needed** - Simply read the generated content and edit the markdown files directly. The next phase will check that the previous phase was completed before proceeding.

## Development Rules

1. **Consider steering**: Run `/steering-init` before major development (optional for new features)
2. **Follow the 3-phase workflow**: Requirements → Design → Implementation
3. **Update task status**: Mark tasks as completed when working on them
4. **Keep steering current**: Run `/steering-update` after significant changes
5. **Check spec compliance**: Use `/spec-status` to verify alignment

## Automation

This project uses Claude Code hooks to:
- Automatically track task progress
- Check spec compliance
- Preserve context during compaction
- Detect steering drift

## Getting Started

1. Initialize steering documents: `/steering-init`
2. Create your first spec: `/spec-init [your-feature-name]`
3. Follow the workflow through requirements, design, and tasks