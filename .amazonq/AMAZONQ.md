# Amazon Q CLI SDD Custom Agent

This directory contains templates and configuration for the SDD (Spec-Driven Development) Custom Agent for Amazon Q CLI.

## Installation

```bash
# Install the SDD agent
npx amazonq-sdd

# Start using the agent
q chat --agent sdd

# Try your first command
/kiro:spec-init "user authentication system"
```

## Agent Configuration

The SDD Custom Agent is configured with:
- **Name**: `sdd`
- **Tools**: All available tools (`*`)
- **Access Level**: Unrestricted system access
- **Languages**: JavaScript, Java, Go, Python, and all supported languages
- **Command Prefix**: `/kiro:`

## Available Commands

| Command | Description | Prerequisites |
|---------|-------------|---------------|
| `/kiro:spec-init <description>` | Initialize new feature specification | None |
| `/kiro:spec-requirements <feature>` | Generate requirements document | Initialized spec |
| `/kiro:spec-design <feature>` | Create technical design | Approved requirements |
| `/kiro:spec-tasks <feature>` | Break down implementation tasks | Approved design |
| `/kiro:spec-impl <feature> [tasks]` | Get implementation guidance | Generated tasks |
| `/kiro:spec-status <feature>` | Check workflow progress | Any phase |
| `/kiro:steering` | Set up project context | None |
| `/kiro:steering-custom <name>` | Create custom guidelines | None |

## Workflow Phases

1. **Initialization** → `/kiro:spec-init`
2. **Requirements** → `/kiro:spec-requirements` + review
3. **Design** → `/kiro:spec-design` + review  
4. **Tasks** → `/kiro:spec-tasks` + review
5. **Implementation** → `/kiro:spec-impl`

## File Structure

```
.kiro/
├── steering/              # Project guidelines
│   ├── product.md        # Business context
│   ├── tech.md           # Technology decisions
│   ├── structure.md      # Code organization
│   └── linus-review.md   # Linus Torvalds code review philosophy
└── specs/                # Feature specifications
    └── feature-name/
        ├── requirements.md
        ├── design.md
        ├── tasks.md
        └── spec.json
```

## Command Templates

Command behavior is defined in:
- `commands/kiro/spec-init.md`
- `commands/kiro/spec-requirements.md`
- `commands/kiro/spec-design.md`
- `commands/kiro/spec-tasks.md`
- `commands/kiro/spec-status.md`
- `commands/kiro/steering.md`

## Security Model

The SDD agent operates with unrestricted system access:
- **File Access**: Full file system read/write/delete access
- **Command Execution**: Any shell command or system operation
- **Network Access**: HTTP requests, API interactions, web scraping
- **Tool Access**: All Amazon Q CLI tools and capabilities without restrictions

## Integration Notes

This Custom Agent integrates with Amazon Q CLI's native capabilities:
- Uses all available Amazon Q CLI tools without restrictions (`tools: "*"`)
- Leverages Amazon Q CLI's slash command recognition
- Provides unrestricted development and system operation support
- Full access to Amazon Q CLI's capabilities
- Works within Amazon Q CLI's chat interface

## Code Review with Linus Torvalds Philosophy

The SDD agent includes Linus Torvalds' legendary code review approach via the `linus-review.md` steering document:

### Key Principles
- **"Good Taste"**: Eliminate special cases through better design
- **Data Structure Focus**: "Bad programmers worry about the code. Good programmers worry about data structures."
- **Simplicity**: Functions must be short, minimal indentation, single purpose
- **Never Break Userspace**: Maintain backward compatibility at all costs
- **Pragmatism**: Solve real problems, not theoretical ones

### 5-Layer Analysis Process
1. **Data Structure Analysis**: Focus on core data relationships
2. **Special Case Identification**: Eliminate if/else branches through redesign
3. **Complexity Review**: Reduce concepts and indentation levels
4. **Breaking Change Analysis**: Ensure backward compatibility
5. **Practicality Validation**: Verify problems are real and solutions proportionate

### Code Review Output Format
```
【Taste Score】
🟢 Good taste / 🟡 Passable / 🔴 Garbage

【Fatal Issues】
- [Direct identification of worst problems]

【Improvement Direction】
"Eliminate this special case"
"These 10 lines can become 3 lines"  
"Data structure is wrong, should be..."
```

### Usage
The Linus review philosophy is automatically applied during:
- Requirements validation
- Technical design review
- Implementation guidance  
- Direct code review requests

Simply ask: "Review this code with Linus's standards" or reference `@linus-review.md` in your requests.

## Customization

To modify the agent behavior:
1. Edit the command templates in `commands/kiro/`
2. Update the agent configuration in `amazonq-sdd/install.js`
3. Republish the NPM package

## Support

- **GitHub**: [amazonq-spec](https://github.com/gotalab/amazonq-spec)
- **NPM Package**: [amazonq-sdd](https://www.npmjs.com/package/amazonq-sdd)
- **Documentation**: [README](../amazonq-sdd/README.md)