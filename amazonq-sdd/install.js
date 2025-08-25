#!/usr/bin/env node

/**
 * SDD Custom Agent Installer for Amazon Q CLI
 * Version 1.0.0
 * 
 * Complete installation includes:
 * - Custom Agent configuration (~/.aws/amazonq/cli-agents/sdd.json)
 * - Local command templates (.amazonq/commands/kiro/)
 * - Amazon Q CLI documentation (AMAZONQ.md)
 * 
 * Usage:
 *   npx amazonq-sdd         - Interactive installation
 *   npx amazonq-sdd install  - Install the agent and templates
 *   npx amazonq-sdd uninstall - Remove the agent and templates
 *   npx amazonq-sdd status   - Check installation status
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Agent configuration embedded directly
const SDD_AGENT_CONFIG = {
  "$schema": "https://raw.githubusercontent.com/aws/amazon-q-developer-cli/refs/heads/main/schemas/agent-v1.json",
  "name": "sdd",
  "description": "Spec-Driven Development agent with native /kiro: command support for systematic development workflows",
  "prompt": `You are a Spec-Driven Development (SDD) agent for Amazon Q CLI. You provide native /kiro: command support for systematic development workflows.

## COMMAND RECOGNITION
When users type /kiro: commands, immediately recognize and execute them:

### Specification Commands
- \`/kiro:spec-init <description>\` → Initialize new feature specification
  - Create .kiro/specs/{feature-name}/ directory
  - Generate requirements.md, design.md, tasks.md, spec.json files
  - Set initial workflow state to "requirements-generated"
  
- \`/kiro:spec-requirements <feature>\` → Generate/update requirements document
  - Update requirements.md with detailed functional and non-functional requirements
  - Include user stories, acceptance criteria, and success metrics
  - Mark requirements phase as generated in spec.json

- \`/kiro:spec-design <feature>\` → Generate technical design document
  - Requires approved requirements (check spec.json approval status)
  - Create detailed technical design with architecture, components, APIs
  - Include data models, security considerations, performance targets
  - Update spec.json to design-generated phase

- \`/kiro:spec-tasks <feature>\` → Generate implementation task breakdown
  - Requires approved design (check spec.json approval status)  
  - Create detailed task list with priorities and dependencies
  - Include testing, documentation, and deployment tasks
  - Update spec.json to tasks-generated phase

- \`/kiro:spec-impl <feature> [tasks]\` → Implementation guidance for specific tasks
  - Show current task status and provide implementation approach
  - Generate code scaffolding and detailed implementation steps
  - Update task completion status in tasks.md

- \`/kiro:spec-status <feature>\` → Show workflow progress and next steps
  - Display current phase and completion status
  - Show approval gates and what's needed to proceed
  - List completed and pending tasks

### Steering Commands
- \`/kiro:steering\` → Create/update project steering documents
  - Generate or update .kiro/steering/product.md, tech.md, structure.md
  - Include project context, technology stack, architectural decisions
  - Create comprehensive project knowledge base

- \`/kiro:steering-custom <name>\` → Create custom steering document
  - Generate specialized steering document for specific contexts
  - Examples: security.md, performance.md, testing.md
  - Include domain-specific guidelines and best practices

## WORKFLOW ENFORCEMENT
Always enforce the 3-phase approval workflow:
1. **Requirements Phase**: Generate requirements.md
2. **Design Phase**: Requires approved requirements before generating design.md
3. **Tasks Phase**: Requires approved design before generating tasks.md
4. **Implementation Phase**: Use tasks.md to guide development

## FILE OPERATIONS
- Always use fs_read to check existing files before overwriting
- Use fs_write to create/update .kiro/ files and markdown documents
- Create proper directory structures: .kiro/specs/{feature-name}/
- Maintain spec.json for workflow state tracking

## APPROVAL GATES
When moving between phases, always ask:
- "Have you reviewed the requirements.md file? Please confirm before I proceed with design generation."
- "Have you reviewed the design.md file? Please confirm before I proceed with task breakdown."

## OUTPUT FORMAT
- Generate professional, enterprise-quality documentation
- Use consistent markdown formatting and structure
- Include comprehensive details but remain actionable
- Always update workflow state in spec.json files

## CONTEXT AWARENESS  
- Read existing .kiro/steering/ files for project context
- Reference previous specifications when creating related features
- Maintain consistency with established patterns and technologies

Always respond helpfully and execute the requested /kiro: command immediately.`,
  "tools": ["fs_read", "fs_write"],
  "toolsSettings": {
    "fs_write": {
      "allowedPaths": [".kiro/**", "AMAZONQ.md", "*.md"]
    }
  }
};

// Template files embedded directly
const TEMPLATES = {
  'AMAZONQ.md': `# Amazon Q CLI SDD Custom Agent

This directory contains templates and configuration for the SDD (Spec-Driven Development) Custom Agent for Amazon Q CLI.

## Installation

\`\`\`bash
# Install the SDD agent
npx amazonq-sdd

# Start using the agent
q chat --agent sdd

# Try your first command
/kiro:spec-init "user authentication system"
\`\`\`

## Agent Configuration

The SDD Custom Agent is configured with:
- **Name**: \`sdd\`
- **Tools**: \`fs_read\`, \`fs_write\` 
- **Allowed Paths**: \`.kiro/**\`, \`*.md\`
- **Command Prefix**: \`/kiro:\`

## Available Commands

| Command | Description | Prerequisites |
|---------|-------------|---------------|
| \`/kiro:spec-init <description>\` | Initialize new feature specification | None |
| \`/kiro:spec-requirements <feature>\` | Generate requirements document | Initialized spec |
| \`/kiro:spec-design <feature>\` | Create technical design | Approved requirements |
| \`/kiro:spec-tasks <feature>\` | Break down implementation tasks | Approved design |
| \`/kiro:spec-impl <feature> [tasks]\` | Get implementation guidance | Generated tasks |
| \`/kiro:spec-status <feature>\` | Check workflow progress | Any phase |
| \`/kiro:steering\` | Set up project context | None |
| \`/kiro:steering-custom <name>\` | Create custom guidelines | None |

## Workflow Phases

1. **Initialization** → \`/kiro:spec-init\`
2. **Requirements** → \`/kiro:spec-requirements\` + review
3. **Design** → \`/kiro:spec-design\` + review  
4. **Tasks** → \`/kiro:spec-tasks\` + review
5. **Implementation** → \`/kiro:spec-impl\`

## File Structure

\`\`\`
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
\`\`\`

## Command Templates

Command behavior is defined in:
- \`commands/kiro/spec-init.md\`
- \`commands/kiro/spec-requirements.md\`
- \`commands/kiro/spec-design.md\`
- \`commands/kiro/spec-tasks.md\`
- \`commands/kiro/spec-status.md\`
- \`commands/kiro/steering.md\`

## Security Model

The SDD agent operates with restricted file system access:
- **Read Access**: Any file in project
- **Write Access**: Only \`.kiro/**\` and \`*.md\` files
- **No Network**: Agent cannot make network requests
- **No Shell**: Agent cannot execute shell commands

## Integration Notes

This Custom Agent integrates with Amazon Q CLI's native capabilities:
- Uses Amazon Q CLI's built-in file tools (\`fs_read\`, \`fs_write\`)
- Leverages Amazon Q CLI's slash command recognition
- Respects Amazon Q CLI's security and sandboxing model
- Works within Amazon Q CLI's chat interface

## Customization

To modify the agent behavior:
1. Edit the command templates in \`commands/kiro/\`
2. Update the agent configuration in \`amazonq-sdd/install.js\`
3. Republish the NPM package

## Support

- **GitHub**: [amazonq-spec](https://github.com/gotalab/amazonq-spec)
- **NPM Package**: [amazonq-sdd](https://www.npmjs.com/package/amazonq-sdd)
- **Documentation**: [README](../amazonq-sdd/README.md)`,

  'commands/kiro/spec-init.md': `---
description: Initialize a new specification with detailed project description and requirements via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Spec Initialization

This template defines the \`/kiro:spec-init\` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
\`\`\`
/kiro:spec-init <description>
\`\`\`

## Implementation Logic

When a user types \`/kiro:spec-init "project description"\` in \`q chat --agent sdd\`:

### 1. Parse Command and Description
- Extract the project description from the command
- Validate that description is provided

### 2. Generate Feature Name  
Create a concise, descriptive feature name from the project description.
**Check existing \`.kiro/specs/\` directory to ensure the generated feature name is unique. If a conflict exists, append a number suffix (e.g., feature-name-2).**

### 3. Create Spec Directory Structure
Create \`.kiro/specs/{generated-feature-name}/\` directory with template files:
- \`requirements.md\` - Template with user input
- \`design.md\` - Empty template for technical design  
- \`tasks.md\` - Empty template for implementation tasks
- \`spec.json\` - Metadata and approval tracking

### 4. Initialize spec.json Metadata
\`\`\`json
{
  "feature_name": "{generated-feature-name}",
  "created_at": "current_timestamp",
  "updated_at": "current_timestamp", 
  "language": "english",
  "phase": "initialized",
  "approvals": {
    "requirements": {
      "generated": false,
      "approved": false
    },
    "design": {
      "generated": false,
      "approved": false
    },
    "tasks": {
      "generated": false,
      "approved": false
    }
  },
  "ready_for_implementation": false
}
\`\`\`

## Agent Response Format

After successful initialization, the agent should respond with:

\`\`\`
✅ **Specification Initialized Successfully**

📁 **Feature**: {generated-feature-name}
📝 **Description**: {brief-summary}
📂 **Created**: .kiro/specs/{generated-feature-name}/

**Files Created:**
- requirements.md (with your project description)
- design.md (empty template)
- tasks.md (empty template)  
- spec.json (workflow metadata)

**Next Step:**
Use \`/kiro:spec-requirements {generated-feature-name}\` to generate detailed requirements.

**Workflow:**
1. ✅ spec-init ← You are here
2. ⏳ spec-requirements 
3. ⏳ spec-design
4. ⏳ spec-tasks
5. ⏳ spec-impl
\`\`\`

## Error Handling

- If no description provided: "Please provide a project description: \`/kiro:spec-init \"your project description\"\`"
- If .kiro directory doesn't exist: Create it automatically
- If feature name conflict: Append number suffix and notify user

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type \`/kiro:spec-init\` in Amazon Q CLI chat with \`--agent sdd\`.`,

  'commands/kiro/spec-status.md': `---
description: Show workflow progress and next steps via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Status Check

This template defines the \`/kiro:spec-status\` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
\`\`\`
/kiro:spec-status <feature-name>
\`\`\`

## Implementation Logic

When a user types \`/kiro:spec-status feature-name\` in \`q chat --agent sdd\`:

### 1. Validate Feature Exists
- Check that \`.kiro/specs/{feature-name}/\` directory exists
- Verify spec.json file is present and readable

### 2. Read Current Status
- Load spec.json for workflow state
- Check file existence and modification dates
- Analyze task completion if in implementation phase

### 3. Generate Status Report

The agent should display comprehensive status with:
- Current workflow phase and progress
- File status and modification dates
- Next recommended actions
- Implementation progress if applicable

## Agent Response Format

Standard status response with appropriate icons:
- ✅ Completed
- 🔄 In Progress  
- ⏳ Pending
- ⚠️ Needs Attention
- ❌ Blocked/Error

## Error Handling

- If feature doesn't exist: "Feature '{feature-name}' not found. Available features: {list_existing_features}"
- If spec.json corrupted: "Workflow metadata corrupted. Please check .kiro/specs/{feature-name}/spec.json"
- If files missing: "Required files missing. Expected: requirements.md, design.md, tasks.md"

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type \`/kiro:spec-status\` in Amazon Q CLI chat with \`--agent sdd\`.`,

  'commands/kiro/steering.md': `---
description: Create/update project steering documents via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Project Steering

This template defines the \`/kiro:steering\` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
\`\`\`
/kiro:steering
\`\`\`

## Implementation Logic

When a user types \`/kiro:steering\` in \`q chat --agent sdd\`:

### 1. Create Steering Directory Structure
- Create \`.kiro/steering/\` directory if it doesn't exist
- Check for existing steering files

### 2. Generate Core Steering Documents

The agent should create three core documents:
- \`product.md\` - Business objectives and user context
- \`tech.md\` - Technology stack and architectural decisions  
- \`structure.md\` - File organization and coding patterns

## Agent Response Format

After successful generation:

\`\`\`
✅ **Project Steering Documents Created**

📂 **Created/Updated Files:**
- .kiro/steering/product.md - Business objectives and user personas
- .kiro/steering/tech.md - Technology stack and architectural decisions  
- .kiro/steering/structure.md - File organization and coding patterns

**What These Provide:**
- **Product Context**: Clear business objectives and user requirements
- **Technical Guidance**: Technology choices and development standards
- **Organization Rules**: Consistent file structure and naming conventions

**Next Steps:**
- Review and customize the steering documents for your project
- Use \`/kiro:spec-init "feature description"\` to start your first specification
\`\`\`

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type \`/kiro:steering\` in Amazon Q CLI chat with \`--agent sdd\`.`
};

// Get the Amazon Q CLI agents directory
function getAgentDir() {
  const homeDir = os.homedir();
  return path.join(homeDir, '.aws', 'amazonq', 'cli-agents');
}

// Get current working directory for local templates
function getProjectDir() {
  return process.cwd();
}

// Install the agent and templates
function installAgent() {
  try {
    console.log('🚀 Installing SDD Custom Agent for Amazon Q CLI...\n');
    
    // 1. Install Custom Agent
    const agentDir = getAgentDir();
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }
    
    const agentFile = path.join(agentDir, 'sdd.json');
    fs.writeFileSync(agentFile, JSON.stringify(SDD_AGENT_CONFIG, null, 2));
    console.log('✅ Custom Agent installed:', agentFile);
    
    // 2. Install Local Templates
    const projectDir = getProjectDir();
    const amazonqDir = path.join(projectDir, '.amazonq');
    
    // Create directory structure
    const commandsDir = path.join(amazonqDir, 'commands', 'kiro');
    fs.mkdirSync(commandsDir, { recursive: true });
    
    // Write template files
    for (const [filePath, content] of Object.entries(TEMPLATES)) {
      let fullPath;
      if (filePath === 'AMAZONQ.md') {
        // AMAZONQ.md goes in project root, not .amazonq directory
        fullPath = path.join(getProjectDir(), filePath);
      } else {
        // Other templates go in .amazonq directory
        fullPath = path.join(amazonqDir, filePath);
      }
      
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content);
    }
    
    console.log('✅ Command templates installed:', amazonqDir);
    console.log('✅ Documentation created: AMAZONQ.md');
    
    console.log('\n🎉 Installation Complete!\n');
    console.log('🚀 **Quick Start:**');
    console.log('  q chat --agent sdd');
    console.log('  /kiro:spec-init "your feature description"');
    console.log('');
    console.log('📖 **Available Commands:**');
    console.log('  /kiro:spec-init <description>     - Initialize new feature specification');
    console.log('  /kiro:spec-requirements <feature> - Generate requirements document');
    console.log('  /kiro:spec-design <feature>       - Create technical design');
    console.log('  /kiro:spec-tasks <feature>        - Break down implementation tasks');
    console.log('  /kiro:spec-impl <feature> [tasks] - Get implementation guidance');
    console.log('  /kiro:spec-status <feature>       - Check workflow progress');
    console.log('  /kiro:steering                    - Set up project context');
    console.log('  /kiro:steering-custom <name>      - Create custom guidelines');
    console.log('');
    console.log('📁 **What was installed:**');
    console.log('  Custom Agent: ~/.aws/amazonq/cli-agents/sdd.json');
    console.log('  Templates: .amazonq/commands/kiro/');
    console.log('  Documentation: AMAZONQ.md');
    console.log('');
    console.log('📚 **Learn More:** https://github.com/gotalab/amazonq-spec');
    
  } catch (error) {
    console.error('\x1b[31m❌ Installation failed:\x1b[0m', error.message);
    process.exit(1);
  }
}

// Uninstall the agent and templates
function uninstallAgent() {
  try {
    let removed = [];
    
    // Remove Custom Agent
    const agentFile = path.join(getAgentDir(), 'sdd.json');
    if (fs.existsSync(agentFile)) {
      fs.unlinkSync(agentFile);
      removed.push('Custom Agent configuration');
    }
    
    // Remove local templates
    const amazonqDir = path.join(getProjectDir(), '.amazonq');
    if (fs.existsSync(amazonqDir)) {
      fs.rmSync(amazonqDir, { recursive: true, force: true });
      removed.push('Local command templates (.amazonq/)');
    }
    
    // Remove AMAZONQ.md
    const amazonqMd = path.join(getProjectDir(), 'AMAZONQ.md');
    if (fs.existsSync(amazonqMd)) {
      fs.unlinkSync(amazonqMd);
      removed.push('Documentation (AMAZONQ.md)');
    }
    
    if (removed.length > 0) {
      console.log('\x1b[33m🗑️  SDD Agent uninstalled successfully\x1b[0m');
      console.log('\nRemoved:');
      removed.forEach(item => console.log('  -', item));
    } else {
      console.log('\x1b[33m⚠️  SDD Agent was not installed\x1b[0m');
    }
  } catch (error) {
    console.error('\x1b[31m❌ Uninstall failed:\x1b[0m', error.message);
    process.exit(1);
  }
}

// Check installation status
function checkStatus() {
  try {
    const agentFile = path.join(getAgentDir(), 'sdd.json');
    const amazonqDir = path.join(getProjectDir(), '.amazonq');
    const amazonqMd = path.join(getProjectDir(), 'AMAZONQ.md');
    let amazonQPath;
    
    try {
      amazonQPath = execSync('which q', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch (e) {
      amazonQPath = null;
    }
    
    console.log('\x1b[1m📊 SDD Agent Status\x1b[0m');
    console.log('');
    
    // Check Amazon Q CLI
    if (amazonQPath) {
      console.log('\x1b[32m✅ Amazon Q CLI installed:\x1b[0m', amazonQPath);
    } else {
      console.log('\x1b[31m❌ Amazon Q CLI not found\x1b[0m');
      console.log('   Install from: https://aws.amazon.com/q/developer/');
      console.log('');
    }
    
    // Check SDD agent
    if (fs.existsSync(agentFile)) {
      console.log('\x1b[32m✅ SDD Custom Agent installed:\x1b[0m', agentFile);
    } else {
      console.log('\x1b[31m❌ SDD Custom Agent not installed\x1b[0m');
    }
    
    // Check local templates
    if (fs.existsSync(amazonqDir)) {
      console.log('\x1b[32m✅ Command templates installed:\x1b[0m', amazonqDir);
      
      // Count template files
      const commandFiles = fs.readdirSync(path.join(amazonqDir, 'commands', 'kiro')).length;
      console.log(`   (${commandFiles} command templates found)`);
    } else {
      console.log('\x1b[31m❌ Command templates not installed\x1b[0m');
    }
    
    // Check documentation
    if (fs.existsSync(amazonqMd)) {
      console.log('\x1b[32m✅ Documentation installed:\x1b[0m AMAZONQ.md');
    } else {
      console.log('\x1b[31m❌ Documentation not installed\x1b[0m');
    }
    
    console.log('');
    
    if (amazonQPath && fs.existsSync(agentFile)) {
      console.log('\x1b[1m🎯 Ready to use!\x1b[0m');
      console.log('  q chat --agent sdd');
      console.log('  /kiro:spec-init "your feature"');
    } else {
      console.log('\x1b[33m⚠️  Installation incomplete\x1b[0m');
      console.log('   Run: npx amazonq-sdd install');
    }
    
  } catch (error) {
    console.error('\x1b[31m❌ Status check failed:\x1b[0m', error.message);
  }
}

// Show help
function showHelp() {
  console.log(`\x1b[1m
SDD Custom Agent for Amazon Q CLI
Version 1.0.0

Native /kiro: command support for spec-driven development workflows
\x1b[0m

Usage:
  npx amazonq-sdd [command]

Commands:
  install    Install the SDD agent and local templates
  uninstall  Remove the SDD agent and templates
  status     Check installation status
  help       Show this help message

Quick Start:
  npx amazonq-sdd install
  q chat --agent sdd
  /kiro:spec-init "your feature"

What Gets Installed:
  • Custom Agent configuration (~/.aws/amazonq/cli-agents/sdd.json)
  • Local command templates (.amazonq/commands/kiro/)
  • Amazon Q CLI documentation (AMAZONQ.md)

Learn More:
  https://github.com/gotalab/amazonq-spec`);
}

// Main CLI logic
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'install';

  switch (command) {
    case 'install':
      installAgent();
      break;
    case 'uninstall':
      uninstallAgent();
      break;
    case 'status':
      checkStatus();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.log(`\x1b[31mUnknown command: ${command}\x1b[0m`);
      showHelp();
      process.exit(1);
  }
}