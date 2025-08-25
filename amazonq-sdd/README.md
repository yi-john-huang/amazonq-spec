# amazonq-sdd

> **One-command installation** for SDD Custom Agent in Amazon Q CLI  
> Native `/kiro:` commands for spec-driven development workflows

[![npm version](https://img.shields.io/npm/v/amazonq-sdd.svg)](https://www.npmjs.com/package/amazonq-sdd)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)

## 🚀 Quick Start

```bash
# Install the SDD agent (one command!)
npx amazonq-sdd

# Start using immediately
q chat --agent sdd

# Try your first command
/kiro:spec-init "user authentication system"
```

That's it! No configuration, no setup scripts, no complexity.

## ✨ What You Get

### Complete Installation Package

When you run `npx amazonq-sdd`, you get:
- **Custom Agent**: Installed to `~/.aws/amazonq/cli-agents/sdd.json`
- **Command Templates**: Local files in `.amazonq/commands/kiro/`
- **Documentation**: `AMAZONQ.md` with full usage guide
- **Customization Ready**: Edit templates to modify agent behavior

### 8 Powerful Commands

| Command | What it does |
|---------|--------------|
| `/kiro:spec-init <description>` | Start a new feature specification |
| `/kiro:spec-requirements <feature>` | Generate requirements document |
| `/kiro:spec-design <feature>` | Create technical design |
| `/kiro:spec-tasks <feature>` | Break down implementation tasks |
| `/kiro:spec-impl <feature> [tasks]` | Get implementation guidance |
| `/kiro:spec-status <feature>` | Check workflow progress |
| `/kiro:steering` | Set up project context |
| `/kiro:steering-custom <name>` | Create custom guidelines |

### Installation Structure

After running `npx amazonq-sdd`, your project will have:

```
your-project/
├── .amazonq/                    # Local customization (NEW!)
│   ├── commands/kiro/          # Command behavior templates
│   │   ├── spec-init.md
│   │   ├── spec-status.md
│   │   └── steering.md
│   └── AMAZONQ.md              # Full documentation
└── .kiro/                      # Created when you use commands
    ├── steering/               # Project guidelines
    │   ├── product.md    
    │   ├── tech.md       
    │   └── structure.md  
    └── specs/                  # Feature specifications
        └── feature-name/
            ├── requirements.md
            ├── design.md
            ├── tasks.md
            └── spec.json
```

### Customization Support

Edit `.amazonq/commands/kiro/*.md` files to customize:
- Command behavior and prompts
- Output formats and templates  
- Workflow enforcement rules
- Error messages and help text

## 📖 Usage Examples

### Complete Feature Development

```bash
# 1. Start Amazon Q with SDD agent
q chat --agent sdd

# 2. Initialize a new feature
/kiro:spec-init "OAuth 2.0 authentication"
# Creates: .kiro/specs/oauth-2-0-authentication/

# 3. Generate requirements
/kiro:spec-requirements oauth-2-0-authentication

# 4. Create technical design (after reviewing requirements)
/kiro:spec-design oauth-2-0-authentication

# 5. Break down tasks (after reviewing design)
/kiro:spec-tasks oauth-2-0-authentication

# 6. Check status anytime
/kiro:spec-status oauth-2-0-authentication
```

## 🔧 NPX Commands

```bash
# Install the agent
npx amazonq-sdd install

# Check status
npx amazonq-sdd status

# Uninstall if needed
npx amazonq-sdd uninstall

# Get help
npx amazonq-sdd help
```

## 📋 Requirements

- [Amazon Q CLI](https://aws.amazon.com/q/developer/) installed
- Node.js 14+ (for NPX)
- AWS credentials configured

## 🐛 Troubleshooting

### "Amazon Q CLI not found"
Install Amazon Q CLI first: https://aws.amazon.com/q/developer/

### "Agent not loading"
```bash
# Verify installation
npx amazonq-sdd status

# Reinstall if needed
npx amazonq-sdd uninstall
npx amazonq-sdd install
```

### "Commands not recognized"
- Use exact `/kiro:` prefix (with colon)
- Check spelling of command names
- Ensure you started with `q chat --agent sdd`

## 🎯 Why amazonq-sdd?

- **Zero Configuration**: Works immediately after installation
- **Native Integration**: Commands work directly in Amazon Q CLI chat
- **No Dependencies**: No shell scripts, no external tools
- **Professional Output**: Enterprise-quality documentation generated
- **Workflow Enforcement**: Built-in phase progression and approvals

## 🔒 Security

- File access restricted to `.kiro/` and markdown files only
- No shell execution or system commands
- Leverages Amazon Q CLI's built-in security model
- Open source and auditable

## 📄 License

MIT - See [LICENSE](../LICENSE) file

## 🤝 Contributing

Contributions welcome! 

**For Users:** Customize behavior by editing the local templates in `.amazonq/commands/kiro/`

**For Developers:** 
- Agent configuration is embedded in `install.js` as `SDD_AGENT_CONFIG`
- Command templates are embedded in `install.js` as `TEMPLATES` object
- Both are installed locally for user customization

## 🔗 Links

- [GitHub Repository](https://github.com/gotalab/amazonq-spec)
- [NPM Package](https://www.npmjs.com/package/amazonq-sdd)
- [Issue Tracker](https://github.com/gotalab/amazonq-spec/issues)

## Acknowledgments

This NPM package is built upon the excellent foundation provided by:

- **[gotalab/claude-code-spec](https://github.com/gotalab/claude-code-spec)** - The original and comprehensive spec-driven development implementation for Claude Code
- **Anthropic's Claude Code team** - For pioneering the spec-driven development workflow

---

**Made with ❤️ for systematic development workflows**