---
description: Generate technical design document with approval gate via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Technical Design Generation

This template defines the `/kiro:spec-design` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
```
/kiro:spec-design <feature-name>
```

## Implementation Logic

When a user types `/kiro:spec-design feature-name` in `q chat --agent sdd`:

### 1. Validate Prerequisites
- Check that `.kiro/specs/{feature-name}/` directory exists
- Verify requirements.md exists and has content
- **CRITICAL: Check spec.json for requirements approval status**

### 2. Approval Gate Enforcement
```javascript
if (spec.approvals.requirements.approved !== true) {
  return "⚠️ **Requirements must be approved first**\n\nPlease review requirements.md and confirm:\nHave you reviewed the requirements.md file? [y/N]";
}
```

### 3. Read Requirements and Context
- Load requirements.md for functional requirements
- Read `.kiro/steering/tech.md` if exists for technology stack
- Read `.kiro/steering/structure.md` if exists for architectural patterns
- Check current phase in spec.json

### 4. Generate Comprehensive Technical Design
Create detailed design document with:

#### Structure Template:
```markdown
# Technical Design Document

## Overview
{AI-generated technical summary based on requirements}

## Architecture

### System Architecture
- High-level system components
- Component relationships and data flow
- External system integrations

### Technology Stack
- Programming languages and frameworks
- Databases and data storage
- Infrastructure and deployment platform
- Third-party libraries and services

## Detailed Design

### Core Components

#### Component 1: {Name}
**Purpose**: {Description}
**Responsibilities**:
- {Responsibility 1}
- {Responsibility 2}

**Interfaces**:
- Input: {Data structures and formats}
- Output: {Data structures and formats}
- APIs: {Endpoint definitions}

#### Component 2: {Name}
[... continue pattern ...]

### Data Design

#### Data Models
```sql/json
{Data structure definitions}
```

#### Database Schema
- Tables/Collections and relationships
- Indexes and performance considerations
- Data migration strategy

### API Design

#### REST Endpoints
```
GET /api/{resource}
POST /api/{resource}  
PUT /api/{resource}/{id}
DELETE /api/{resource}/{id}
```

#### Authentication & Authorization
- Authentication mechanism
- Authorization levels and permissions
- Security token handling

## Security Considerations

### Security Requirements
- Authentication and session management
- Data encryption (at rest and in transit)
- Input validation and sanitization
- Rate limiting and abuse prevention

### Compliance
- Relevant security standards
- Privacy requirements (GDPR, etc.)
- Audit logging requirements

## Performance and Scalability

### Performance Targets
- Response time requirements
- Throughput expectations
- Concurrent user limits

### Scalability Strategy
- Horizontal vs vertical scaling approach
- Caching strategy
- Database optimization
- CDN and static asset handling

## Deployment and Operations

### Deployment Strategy
- Environment configuration (dev/staging/prod)
- CI/CD pipeline requirements
- Rolling deployment approach

### Monitoring and Observability
- Application metrics
- Error tracking and alerting
- Performance monitoring
- Health checks and status endpoints

## Testing Strategy

### Unit Testing
- Test coverage requirements
- Testing frameworks and tools
- Mock strategy for dependencies

### Integration Testing
- API testing approach
- Database testing strategy
- External service mocking

### End-to-End Testing
- User workflow testing
- Performance testing
- Security testing

## Future Considerations

### Technical Debt
- Known limitations and shortcuts
- Future refactoring opportunities

### Extensibility
- Plugin architecture considerations
- API versioning strategy
- Backward compatibility approach
```

### 5. Update Workflow State
Update spec.json:
```json
{
  "phase": "design-generated", 
  "updated_at": "current_timestamp",
  "approvals": {
    "design": {
      "generated": true,
      "approved": false
    }
  }
}
```

## Agent Response Format

After successful generation:

```
✅ **Technical Design Generated Successfully**

📁 **Feature**: {feature-name}
📝 **Generated**: Comprehensive technical design document
📂 **Updated**: .kiro/specs/{feature-name}/design.md

**What Was Generated:**
- System architecture and technology stack
- {X} core components with detailed interfaces
- Data models and API design
- Security, performance, and deployment considerations
- Comprehensive testing strategy

**⚠️ Review Required:**
Please review the design.md file carefully before proceeding.

**Next Step:**
After reviewing, use `/kiro:spec-tasks {feature-name}` to generate implementation tasks.

**Workflow:**
1. ✅ spec-init
2. ✅ spec-requirements ✅ approved
3. ✅ spec-design ← You are here
4. ⏳ spec-tasks (requires design approval)
5. ⏳ spec-impl
```

## Interactive Approval Gate

If requirements not approved, show interactive prompt:
```
⚠️ **Approval Required**

The requirements document must be reviewed and approved before generating design.

**Have you reviewed the requirements.md file?** [y/N]

📂 File location: .kiro/specs/{feature-name}/requirements.md

If you need to make changes, edit the requirements.md file first, then return here.
```

## Error Handling

- If feature doesn't exist: "Feature '{feature-name}' not found. Use `/kiro:spec-init` to create it first."
- If no requirements: "Requirements not found. Use `/kiro:spec-requirements {feature-name}` first."  
- If requirements not approved: Show approval gate prompt
- If already generated: "Design already generated. Use `/kiro:spec-status {feature-name}` to check status."

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type `/kiro:spec-design` in Amazon Q CLI chat with `--agent sdd`.