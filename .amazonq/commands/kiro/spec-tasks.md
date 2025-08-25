---
description: Generate implementation task breakdown with approval gate via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Implementation Tasks Generation

This template defines the `/kiro:spec-tasks` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
```
/kiro:spec-tasks <feature-name>
```

## Implementation Logic

When a user types `/kiro:spec-tasks feature-name` in `q chat --agent sdd`:

### 1. Validate Prerequisites
- Check that `.kiro/specs/{feature-name}/` directory exists
- Verify requirements.md and design.md exist with content
- **CRITICAL: Check spec.json for both requirements AND design approval status**

### 2. Approval Gate Enforcement
```javascript
if (spec.approvals.requirements.approved !== true || spec.approvals.design.approved !== true) {
  return "⚠️ **Both requirements and design must be approved first**\n\nPlease review both documents and confirm:\nHave you reviewed requirements.md and design.md? [y/N]";
}
```

### 3. Read Design and Requirements
- Load design.md for technical architecture
- Load requirements.md for functional requirements
- Read `.kiro/steering/` files for project context
- Check current phase in spec.json

### 4. Generate Comprehensive Task Breakdown
Create detailed implementation plan with:

#### Structure Template:
```markdown
# Implementation Plan

## Overview
{AI-generated implementation summary based on design and requirements}

## Phase 1: Foundation and Setup

### 1.1 Project Infrastructure
- [ ] **Priority: High** | **Est: 2h** | Set up project structure and build system
  - Initialize project with chosen technology stack  
  - Configure build tools, linters, and formatters
  - Set up version control hooks and CI/CD pipeline
  - **Dependencies**: None
  - **Deliverable**: Working build and deployment pipeline

- [ ] **Priority: High** | **Est: 1h** | Set up development environment
  - Configure local development setup
  - Set up debugging and testing tools
  - Create environment configuration files
  - **Dependencies**: 1.1
  - **Deliverable**: Runnable development environment

### 1.2 Core Data Layer
- [ ] **Priority: High** | **Est: 4h** | Implement data models
  - Create database schema/data structures
  - Implement data access layer/repositories
  - Set up database migrations and seed data
  - **Dependencies**: 1.1
  - **Deliverable**: Data layer with CRUD operations

### 1.3 Authentication & Security
- [ ] **Priority: High** | **Est: 6h** | Implement authentication system
  - Set up user authentication mechanism
  - Implement authorization and role management
  - Add security middleware and input validation
  - **Dependencies**: 1.2
  - **Deliverable**: Secure authentication system

## Phase 2: Core Feature Development

### 2.1 {Primary Feature Area}
- [ ] **Priority: High** | **Est: 8h** | Implement {core functionality}
  - {Specific implementation details from design}
  - {API endpoints or user interface components}
  - {Business logic and data processing}
  - **Dependencies**: 1.2, 1.3
  - **Deliverable**: {Functional core feature}

- [ ] **Priority: Medium** | **Est: 4h** | Add {secondary functionality}
  - {Additional feature details}
  - **Dependencies**: 2.1
  - **Deliverable**: {Enhanced functionality}

### 2.2 {Secondary Feature Area}
- [ ] **Priority: Medium** | **Est: 6h** | Implement {feature}
  - {Implementation details}
  - **Dependencies**: 2.1
  - **Deliverable**: {Working feature}

## Phase 3: Integration and Polish

### 3.1 API Integration
- [ ] **Priority: High** | **Est: 4h** | Implement external API connections
  - Connect to third-party services
  - Handle API errors and rate limiting
  - Add monitoring and logging
  - **Dependencies**: 2.1, 2.2
  - **Deliverable**: Working API integrations

### 3.2 User Experience
- [ ] **Priority: Medium** | **Est: 6h** | Polish user interface
  - Implement responsive design
  - Add loading states and error handling
  - Optimize performance and accessibility
  - **Dependencies**: 2.1, 2.2
  - **Deliverable**: Production-ready UI

## Phase 4: Testing and Deployment

### 4.1 Testing Implementation
- [ ] **Priority: High** | **Est: 8h** | Implement comprehensive testing
  - Write unit tests for all components
  - Create integration tests for API endpoints
  - Add end-to-end tests for critical user flows
  - **Dependencies**: All previous phases
  - **Deliverable**: Test suite with >80% coverage

### 4.2 Documentation
- [ ] **Priority: Medium** | **Est: 4h** | Create documentation
  - API documentation
  - User guides and tutorials
  - Deployment and maintenance guides
  - **Dependencies**: 4.1
  - **Deliverable**: Complete documentation

### 4.3 Production Deployment
- [ ] **Priority: High** | **Est: 4h** | Deploy to production
  - Set up production environment
  - Configure monitoring and alerting
  - Perform security audit and testing
  - **Dependencies**: 4.1, 4.2
  - **Deliverable**: Live production system

## Task Summary

**Total Estimated Time**: {X} hours
**Critical Path Tasks**: 1.1 → 1.2 → 1.3 → 2.1 → 4.1 → 4.3
**High Priority Tasks**: {count} tasks
**Medium Priority Tasks**: {count} tasks

## Success Criteria

### Phase Completion Gates
- **Phase 1 Complete**: All infrastructure and security foundations working
- **Phase 2 Complete**: Core features functional and tested  
- **Phase 3 Complete**: Integrations working, UI polished
- **Phase 4 Complete**: Production deployment successful

### Quality Gates
- All tests passing with >80% coverage
- Security audit completed with no critical issues
- Performance targets met (from design document)
- Documentation complete and reviewed

## Risk Mitigation

### Technical Risks
- **Risk**: {Identified technical risk}
  **Mitigation**: {Mitigation strategy}

### Schedule Risks  
- **Risk**: External API dependencies may cause delays
  **Mitigation**: Implement mock services for parallel development

### Resource Risks
- **Risk**: Skill gaps in chosen technology
  **Mitigation**: Allocate time for learning and research in estimates
```

### 5. Update Workflow State
Update spec.json:
```json
{
  "phase": "tasks-generated",
  "updated_at": "current_timestamp", 
  "approvals": {
    "tasks": {
      "generated": true,
      "approved": false
    }
  },
  "ready_for_implementation": false
}
```

## Agent Response Format

After successful generation:

```
✅ **Implementation Tasks Generated Successfully**

📁 **Feature**: {feature-name}
📝 **Generated**: Comprehensive implementation plan
📂 **Updated**: .kiro/specs/{feature-name}/tasks.md

**What Was Generated:**
- {X} total tasks across 4 phases
- {Y} hours estimated total effort
- Task priorities, dependencies, and deliverables
- Quality gates and success criteria
- Risk mitigation strategies

**Task Breakdown:**
- **Phase 1**: Foundation ({X} tasks, {Y} hours)
- **Phase 2**: Core Features ({X} tasks, {Y} hours)  
- **Phase 3**: Integration ({X} tasks, {Y} hours)
- **Phase 4**: Testing & Deployment ({X} tasks, {Y} hours)

**⚠️ Review Required:**
Please review the tasks.md file carefully before starting implementation.

**Next Step:**
After reviewing, use `/kiro:spec-impl {feature-name} [task-numbers]` to get implementation guidance.

**Workflow:**
1. ✅ spec-init
2. ✅ spec-requirements ✅ approved
3. ✅ spec-design ✅ approved  
4. ✅ spec-tasks ← You are here
5. ⏳ spec-impl (ready to start!)
```

## Interactive Approval Gate

If prerequisites not approved:
```
⚠️ **Approvals Required**

Both requirements and design must be reviewed and approved before generating tasks.

**Have you reviewed both requirements.md and design.md?** [y/N]

📂 Files to review:
- .kiro/specs/{feature-name}/requirements.md
- .kiro/specs/{feature-name}/design.md

If you need to make changes, edit the files first, then return here.
```

## Error Handling

- If feature doesn't exist: "Feature '{feature-name}' not found. Use `/kiro:spec-init` to create it first."
- If missing prerequisites: "Requirements and design must be generated first. Use `/kiro:spec-status {feature-name}` to check progress."
- If not approved: Show approval gate prompt
- If already generated: "Tasks already generated. Use `/kiro:spec-status {feature-name}` to check status."

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type `/kiro:spec-tasks` in Amazon Q CLI chat with `--agent sdd`.