---
description: Create/update project steering documents via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Project Steering

This template defines the `/kiro:steering` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
```
/kiro:steering
```

## Implementation Logic

When a user types `/kiro:steering` in `q chat --agent sdd`:

### 1. Create Steering Directory Structure
- Create `.kiro/steering/` directory if it doesn't exist
- Check for existing steering files

### 2. Generate Core Steering Documents

#### Create product.md
```markdown
# Product Steering Document

## Product Vision
{AI-generated based on project context or ask user}

## Business Objectives
- Primary business goals
- Key performance indicators  
- Success metrics

## Target Users
### Primary Users
- User persona descriptions
- Key use cases and workflows
- Pain points being addressed

### Secondary Users  
- Additional user segments
- Their specific needs and requirements

## Product Scope
### In Scope (v1.0)
- Core features and functionality
- Essential user workflows
- Must-have integrations

### Out of Scope (Future)
- Features for later releases
- Nice-to-have functionality
- Potential future integrations

## Market Context
### Competitive Landscape
- Key competitors and alternatives
- Differentiation factors
- Market positioning

### Business Constraints
- Budget limitations
- Timeline requirements
- Resource availability
- Regulatory/compliance needs

## Product Principles
- Design philosophy
- User experience principles  
- Quality standards
- Performance expectations
```

#### Create tech.md
```markdown
# Technology Steering Document

## Architecture Philosophy
{AI-generated based on project analysis}

## Technology Stack

### Frontend/Client
- **Framework**: {Technology choice with rationale}
- **State Management**: {Solution and reasoning}
- **Styling**: {CSS approach and tools}
- **Build Tools**: {Bundler and development tools}

### Backend/Server
- **Runtime**: {Language/platform choice}
- **Framework**: {Web framework selection}
- **Database**: {Database technology and rationale}
- **Authentication**: {Auth mechanism}

### Infrastructure
- **Hosting**: {Cloud provider or hosting solution}
- **CI/CD**: {Continuous integration approach}
- **Monitoring**: {Observability and monitoring tools}
- **Security**: {Security tools and practices}

## Architectural Decisions

### Decision 1: {Technology Choice}
**Context**: {Why this decision was needed}
**Decision**: {What was chosen}
**Rationale**: {Why this choice was made}
**Consequences**: {Trade-offs and implications}

### Decision 2: {Another Choice}
[... continue pattern ...]

## Development Guidelines

### Code Standards
- Code style and formatting rules
- Naming conventions
- Documentation requirements
- Testing standards

### Security Practices
- Authentication and authorization patterns
- Data protection requirements
- Security review process
- Vulnerability management

### Performance Standards
- Response time requirements
- Scalability expectations
- Resource usage limits
- Optimization strategies

## Tool Ecosystem
- Development environment setup
- Required IDE extensions/plugins
- Testing frameworks and tools
- Deployment and monitoring tools

## Technical Constraints
- Browser/platform compatibility
- Performance requirements
- Security compliance needs
- Integration limitations
```

#### Create structure.md
```markdown
# Project Structure Steering Document

## Directory Organization

### Root Structure
```
project-root/
├── src/                    # Source code
├── tests/                  # Test files
├── docs/                   # Documentation
├── config/                 # Configuration files
├── scripts/                # Build and utility scripts
└── .kiro/                  # SDD workflow files
```

### Source Code Organization
```
src/
├── components/             # Reusable UI components
├── pages/                  # Page-level components
├── services/               # Business logic and API calls
├── utils/                  # Utility functions
├── types/                  # Type definitions
└── assets/                 # Static assets
```

## File Naming Conventions

### Components
- **React Components**: PascalCase (UserProfile.tsx)
- **Utility Functions**: camelCase (formatDate.ts)
- **Constants**: UPPER_SNAKE_CASE (API_ENDPOINTS.ts)
- **Types/Interfaces**: PascalCase (UserData.ts)

### Files and Directories
- **Directories**: kebab-case (user-management/)
- **Configuration**: kebab-case (eslint.config.js)
- **Documentation**: kebab-case (api-guide.md)

## Code Organization Patterns

### Component Structure
```typescript
// ComponentName.tsx
export interface ComponentNameProps {
  // Props interface
}

const ComponentName: React.FC<ComponentNameProps> = ({ props }) => {
  // Component logic
  return (
    // JSX
  );
};

export default ComponentName;
```

### Service Layer Pattern
```typescript
// services/userService.ts
export class UserService {
  // Service methods
}

export const userService = new UserService();
```

## Import/Export Guidelines
- Use absolute imports with path mapping
- Group imports: external → internal → relative
- Use named exports for utilities, default for components
- Avoid circular dependencies

## Testing Organization
```
tests/
├── unit/                   # Unit tests
├── integration/            # Integration tests
├── e2e/                    # End-to-end tests
└── fixtures/               # Test data and mocks
```

## Documentation Structure
- README.md: Project overview and setup
- API.md: API documentation
- CONTRIBUTING.md: Development guidelines
- DEPLOYMENT.md: Deployment instructions

## Configuration Management
- Environment-specific configs
- Secure secret management
- Build-time vs runtime configuration
- Development vs production settings
```

### 3. Update AMAZONQ.md Reference
Create or update AMAZONQ.md with steering information.

### 4. Provide Interactive Guidance
If this is first-time setup, ask user for project details to customize the steering documents.

## Agent Response Format

After successful generation:

```
✅ **Project Steering Documents Created**

📂 **Created/Updated Files:**
- .kiro/steering/product.md - Business objectives and user personas
- .kiro/steering/tech.md - Technology stack and architectural decisions  
- .kiro/steering/structure.md - File organization and coding patterns

**What These Provide:**
- **Product Context**: Clear business objectives and user requirements
- **Technical Guidance**: Technology choices and development standards
- **Organization Rules**: Consistent file structure and naming conventions

**Benefits for SDD Workflow:**
- Requirements generation will reference product context
- Design decisions will align with technology choices
- Implementation will follow established patterns

**Next Steps:**
- Review and customize the steering documents for your project
- Use `/kiro:spec-init "feature description"` to start your first specification
- All future specs will reference these steering guidelines

**Customization:**
Use `/kiro:steering-custom <name>` to create specialized steering documents (e.g., security, performance, testing).
```

## Interactive Customization

For new projects, prompt for key details:
```
🎯 **Project Setup Questions**

To customize your steering documents:

1. **What type of project is this?** (web app, mobile app, API, etc.)
2. **What's your preferred technology stack?** (React/Vue, Node.js/Python, etc.)
3. **Who are your primary users?** (developers, end users, business users, etc.)
4. **What are your main business objectives?**

I'll customize the steering documents based on your answers.

**Skip customization?** Type `/kiro:steering --default` for generic templates.
```

## Error Handling

- If .kiro directory doesn't exist: Create automatically
- If steering files exist: Ask whether to update or preserve existing content
- If write permissions missing: Provide clear error and suggested fix

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type `/kiro:steering` in Amazon Q CLI chat with `--agent sdd`.