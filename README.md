# amazonq-spec

> **Fork of [gotalab/claude-code-spec](https://github.com/gotalab/claude-code-spec)** with Amazon Q CLI support

This repository contains two approaches to spec-driven development:

1. **Original Project**: Complete TypeScript implementation for Claude Code (preserved in this fork)
2. **New: amazonq-sdd NPM Package**: Single-command installer for Amazon Q CLI users

## 🚀 Quick Start (Amazon Q CLI Users)

If you use Amazon Q CLI and want native `/kiro:` commands, use our NPM package:

```bash
# Install the SDD agent (one command!)
npx amazonq-sdd

# Start using immediately  
q chat --agent sdd

# Try your first command
/kiro:spec-init "user authentication system"
```

**That's it!** No build process, no dependencies, no configuration.

### 📦 NPM Package Features

- ✅ **Zero Configuration**: Works immediately after installation
- ✅ **Native `/kiro:` Commands**: Work directly in Amazon Q CLI chat
- ✅ **No Dependencies**: Single 12KB installer file
- ✅ **8 SDD Commands**: Complete workflow from spec-init to implementation
- ✅ **Professional Output**: Enterprise-quality documentation generated

[**📖 Full NPM Package Documentation →**](./amazonq-sdd/)

## 📚 Original Project (Claude Code)

This fork preserves the complete original implementation by [gotalab](https://github.com/gotalab):

- **TypeScript Implementation**: Full-featured SDD system for Claude Code
- **Shell Script Wrappers**: `kiro-*` commands for various platforms
- **Template System**: Handlebars templates for prompts
- **Multi-language Support**: English, Japanese, Traditional Chinese

### Installation (Original Project)

```bash
# Clone this repository
git clone https://github.com/gotalab/amazonq-spec.git
cd amazonq-spec

# Install dependencies
npm install

# Build the project
npm run build

# Install globally
npm install -g .
```

## 🎯 Which Approach Should You Use?

| Use Case | Recommendation |
|----------|----------------|
| **Amazon Q CLI user** | Use `npx amazonq-sdd` (instant setup) |
| **Claude Code user** | Use original project (full features) |
| **Want to contribute/modify** | Fork and modify original project |
| **Just want to try SDD** | Use `npx amazonq-sdd` (quickest) |

## 🔄 Fork Relationship

This repository is a fork of the excellent [gotalab/claude-code-spec](https://github.com/gotalab/claude-code-spec) project. We deeply appreciate their pioneering work in spec-driven development.

**What we added:**
- `amazonq-sdd/` directory containing NPM package for Amazon Q CLI
- Amazon Q CLI Custom Agent implementation
- Single-file installer approach

**What we preserved:**
- All original TypeScript source code
- All original documentation and examples
- All original functionality for Claude Code users
- Full attribution to original authors

## 🤝 Contributing

### For NPM Package (amazonq-sdd)
- Edit files in `amazonq-sdd/` directory
- Submit PRs against this repository
- Focus on Amazon Q CLI integration

### For Original Project
- Consider contributing to [gotalab/claude-code-spec](https://github.com/gotalab/claude-code-spec)
- Or submit PRs here that benefit both implementations

## 📄 License

MIT License - Same as original project

## 🙏 Acknowledgments

**Massive thanks to:**

- **[gotalab](https://github.com/gotalab)** and contributors to [claude-code-spec](https://github.com/gotalab/claude-code-spec) - The foundational work that made this Amazon Q CLI adaptation possible
- **Anthropic's Claude Code team** - For pioneering the spec-driven development workflow
- **Amazon Q team** - For building extensible Custom Agent support

## 🔗 Links

- **NPM Package**: [@amazonq-sdd](https://www.npmjs.com/package/amazonq-sdd)
- **Original Project**: [gotalab/claude-code-spec](https://github.com/gotalab/claude-code-spec)
- **Amazon Q CLI**: [Official Documentation](https://aws.amazon.com/q/developer/)
- **Claude Code**: [Anthropic's Official CLI](https://claude.ai/code)

---

**Choose your path: `npx amazonq-sdd` for instant setup, or explore the full original project for advanced features.**