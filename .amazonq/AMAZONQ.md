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

## Customization

To modify the agent behavior:
1. Edit the command templates in `commands/kiro/`
2. Update the agent configuration in `amazonq-sdd/install.js`
3. Republish the NPM package

## Support

- **GitHub**: [amazonq-spec](https://github.com/gotalab/amazonq-spec)
- **NPM Package**: [amazonq-sdd](https://www.npmjs.com/package/amazonq-sdd)
- **Documentation**: [README](../amazonq-sdd/README.md)