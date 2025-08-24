# amazonq-sdd

![CI](https://github.com/yi-john-huang/amazonq-sdd/workflows/CI/badge.svg)
![npm version](https://img.shields.io/npm/v/amazonq-sdd)
![npm downloads](https://img.shields.io/npm/dm/amazonq-sdd)
![License](https://img.shields.io/npm/l/amazonq-sdd)

Spec-driven development workflow for Amazon Q CLI users.

## Overview

`amazonq-sdd` brings the same systematic spec-driven development workflow that Claude Code users enjoy to Amazon Q CLI. This standalone NPM package provides shell script wrappers and structured prompts that integrate seamlessly with Amazon Q CLI's natural language processing capabilities.

> **Note**: This project is forked from the excellent [claude-code-spec](https://github.com/gotalab/claude-code-spec) repository by [gotalab](https://github.com/gotalab). We deeply appreciate their pioneering work in spec-driven development and their comprehensive implementation that served as the foundation for this Amazon Q CLI adaptation.

## Features

- ✅ **8 SDD Commands**: Complete spec-driven development workflow (spec-init, spec-requirements, spec-design, spec-tasks, spec-impl, spec-status, steering, steering-custom)
- ✅ **Amazon Q CLI Integration**: Shell script wrappers that work with `q chat` interface
- ✅ **Cross-Platform Support**: Works on macOS, Windows, and Linux
- ✅ **Multi-Language Support**: English, Japanese, and Traditional Chinese
- ✅ **3-Phase Approval Workflow**: Requirements → Design → Tasks → Implementation with human review gates
- ✅ **Project Memory**: Persistent `.kiro/` structure for project context

## Installation

```bash
# Install globally
npm install -g amazonq-sdd

# Or run directly with npx
npx amazonq-sdd@latest

# With language preference
npx amazonq-sdd@latest --lang en

# Preview changes without applying
npx amazonq-sdd@latest --dry-run
```

## Prerequisites

- Amazon Q CLI installed and configured
- Node.js 16+ 
- Git (for project tracking)

## Quick Start

1. Install the package in your project directory:
   ```bash
   npx amazonq-sdd@latest
   ```

2. Start with project steering (optional):
   ```bash
   kiro-steering
   ```

3. Initialize a new specification:
   ```bash
   kiro-spec-init "User authentication with OAuth and 2FA"
   ```

4. Follow the 3-phase workflow:
   ```bash
   kiro-spec-requirements user-auth
   kiro-spec-design user-auth -y  
   kiro-spec-tasks user-auth -y
   kiro-spec-impl user-auth 1.1,1.2
   ```

## Commands

| Command | Description |
|---------|-------------|
| `kiro-spec-init <description>` | Initialize new specification |
| `kiro-spec-requirements <name>` | Generate requirements document |
| `kiro-spec-design <name> [-y]` | Generate technical design |
| `kiro-spec-tasks <name> [-y]` | Generate implementation tasks |
| `kiro-spec-impl <name> <tasks>` | Implement specific tasks |
| `kiro-spec-status <name>` | Check progress and compliance |
| `kiro-steering` | Create/update project steering |
| `kiro-steering-custom <file>` | Create custom steering document |

## Project Structure

After installation, your project will have:

```
your-project/
├── AMAZONQ.md             # Project configuration file
├── .amazonq/              # Amazon Q SDD tools (created by installer)
│   ├── templates/         # Handlebars templates for prompts
│   ├── scripts/           # Executable kiro-* command scripts
│   └── .gitignore         # Git ignore rules
└── .kiro/                 # Project content (created by commands)
    ├── steering/          # Project knowledge documents
    └── specs/             # Feature specifications
```

**Note**: Amazon Q CLI does not automatically read configuration files. The `kiro-*` commands work by generating structured prompts that are passed directly to `q chat` with project context included in the prompt content.

## Development

```bash
# Clone the repository
git clone https://github.com/your-org/amazonq-sdd
cd amazonq-sdd

# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Test
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

This project is built upon the excellent foundation provided by:

- **[gotalab/claude-code-spec](https://github.com/gotalab/claude-code-spec)** - The original and comprehensive spec-driven development implementation for Claude Code. Their thoughtful architecture, thorough documentation, and innovative workflow design made this Amazon Q CLI adaptation possible.
- **Anthropic's Claude Code team** - For pioneering the spec-driven development workflow that has revolutionized AI-assisted development.

We are grateful for the open-source community and the collaborative spirit that enables projects like this to build upon each other's work.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- [claude-code-spec](https://github.com/gotalab/claude-code-spec) - **Original project by gotalab** - The pioneering spec-driven development implementation for Claude Code that inspired this Amazon Q CLI adaptation
- [Amazon Q Developer CLI](https://github.com/aws/amazon-q-developer-cli) - Official Amazon Q CLI
- [Claude Code](https://claude.ai/code) - Anthropic's official CLI for Claude that originated the SDD workflow