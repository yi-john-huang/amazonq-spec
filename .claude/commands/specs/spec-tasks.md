---
description: Generate implementation tasks for a specification
allowed-tools: Bash, Read, Write, Edit
---

# Implementation Tasks

Generate detailed implementation tasks for feature: **$ARGUMENTS**

## Approval Gate: Requirements & Design Check

**CRITICAL**: Tasks can only be generated after both requirements and design are approved.

### Approval Status Check
- Spec metadata: @.claude/specs/$ARGUMENTS/spec.json

**STOP HERE** if spec.json shows:
```json
"approvals": {
  "requirements": false,  // Must be true
  "design": false        // Must be true
}
```

**Required Actions**:
- If requirements not approved: Review and edit requirements.md directly
- If design not approved: Review and edit design.md directly

## Context Analysis

### Complete Spec Context (APPROVED)
- Requirements: @.claude/specs/$ARGUMENTS/requirements.md
- Design: @.claude/specs/$ARGUMENTS/design.md
- Current tasks: @.claude/specs/$ARGUMENTS/tasks.md
- Spec metadata: @.claude/specs/$ARGUMENTS/spec.json

### Steering Context
- Architecture patterns: @.claude/steering/structure.md
- Development practices: @.claude/steering/tech.md
- Product constraints: @.claude/steering/product.md

## Task: Generate Implementation Plan

**Prerequisites Verified**: Both requirements and design are approved and ready for task breakdown.

Create comprehensive implementation plan following Japanese format from Kiro example:

### 1. Tasks Document Structure
Create tasks.md in English following Kiro's proven format:

```markdown
# Implementation Plan

- [ ] 1. Project Setup and Core Structure
  - Create frontend (React/Vue/Next.js) and backend (FastAPI/Express) directory structure
  - Define TypeScript types and core data model interfaces
  - Set up development environment files (package.json, requirements.txt, docker-compose.yml)
  - _Requirements: 1.1, 1.2_

- [ ] 2. Database and Model Layer Implementation
- [ ] 2.1 Database Schema Design and Implementation
  - Define schemas using [ORM/Database] (Prisma/SQLAlchemy/Mongoose)
  - Create and run migration files
  - Implement database connection utilities
  - _Requirements: 2.1, 2.2_

- [ ] 2.2 Data Validation and Business Logic
  - Implement model validation functions
  - Implement and test business rules
  - Standardize error handling across models
  - _Requirements: 2.3_

- [ ] 3. API and Backend Services Implementation
- [ ] 3.1 Authentication and Authorization System
  - Implement JWT/session authentication with [Auth Library]
  - Create user registration and login endpoints
  - Implement access control middleware and route protection
  - _Requirements: 3.1, 3.2_

- [ ] 3.2 Core API Endpoints Implementation
  - Implement CRUD operations for main entities
  - Add input validation and sanitization
  - Create API documentation with OpenAPI/Swagger
  - _Requirements: 3.3, 3.4_

- [ ] 4. Frontend Component Implementation
- [ ] 4.1 Basic UI Component Creation
  - Select and configure component library ([Chakra UI/Material-UI/Tailwind])
  - Implement common components (Button, Input, Modal, Table)
  - Set up responsive design system and theme
  - _Requirements: 4.1, 4.2_

- [ ] 4.2 Feature-Specific Components
  - Implement main feature components based on requirements
  - Add form handling with validation ([Formik/React Hook Form])
  - Implement state management ([Redux/Zustand/Context])
  - _Requirements: 4.3, 4.4_

- [ ] 5. Integration and Testing
- [ ] 5.1 Test Suite Implementation
  - Create unit tests for backend services (Jest/pytest)
  - Implement API integration tests
  - Set up frontend component tests ([Testing Library])
  - _Requirements: All requirements test coverage_

- [ ] 5.2 End-to-End Testing and Deployment
  - Implement E2E tests ([Playwright/Cypress])
  - Set up CI/CD pipeline configuration
  - Configure production deployment and monitoring
  - _Requirements: 5.1, 5.2_
```

**Key Format Rules**:
- Hierarchical numbering: Major phases (1, 2, 3) and sub-tasks (1.1, 1.2)
- Each task contains 2-4 concrete, actionable items
- Specify technologies in brackets: [React], [FastAPI], [Prisma]
- End with requirement mapping: _Requirements: X.X, Y.Y_
- Tasks should be completable in 2-4 hours each
- Include testing tasks for each major component

### 2. Task Quality Guidelines
- **Hierarchical Structure**: Group related tasks into phases
- **Discrete Tasks**: Each task should be completable in 2-4 hours
- **Clear Acceptance Criteria**: Define what "done" means
- **Requirements Mapping**: Link tasks to specific requirements
- **Dependency Management**: Order tasks by dependencies
- **Testable Outcomes**: Each task should have verifiable results

### 3. Task Categories
Include tasks for:
- **Data Models**: Database schema and model creation
- **API Endpoints**: Backend service implementation
- **UI Components**: Frontend component development
- **Integration**: Service integration and workflow
- **Testing**: Unit, integration, and E2E tests
- **Documentation**: Code documentation and user guides

### 4. Requirements Mapping
For each task, reference the specific requirements from requirements.md:
- Map to user stories (要件1, 要件2, etc.)
- Include acceptance criteria references
- Ensure full requirements coverage

### 5. Progress Tracking
Include progress tracking section:
```markdown
## 進捗状況
- Created: [timestamp]
- Status: Ready for implementation
- Total tasks: [count]
- Completed: 0
- Remaining: [count]
```

### 6. Final Steps

After generating tasks, add a review notice at the end of tasks.md:
```markdown
---
## Review Checklist

Please review the generated tasks:
- [ ] Are tasks properly sized (2-4 hours each)?
- [ ] Are all requirements covered?
- [ ] Is the dependency order correct?
- [ ] Do technology choices match the design?

If everything looks good, you can start implementation.
If changes are needed, please edit this file directly.
---
```

### 7. Auto-Approval Option

Consider adding to spec.json:
```json
{
  "phase": "tasks-generated",
  "progress": {
    "requirements": 100,
    "design": 100, 
    "tasks": 100
  },
  "approvals": {
    "requirements": true,
    "design": true,
    "tasks": "pending_review"  // Human must verify before implementation
  },
  "updated_at": "current_timestamp"
}
```

This allows human review without requiring a separate review command.

## Instructions

1. **Analyze requirements and design** to understand full scope
2. **Create hierarchical task structure** with clear phases
3. **Define discrete, actionable tasks** with acceptance criteria
4. **Map all tasks to requirements** to ensure coverage
5. **Order tasks by dependencies** for logical implementation flow
6. **Include testing and documentation** tasks
7. **Update tracking metadata** upon completion

Generate tasks that provide clear roadmap for implementation.