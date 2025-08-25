---
description: Show workflow progress and next steps via Amazon Q CLI Custom Agent
allowed-tools: fs_read, fs_write
model: amazon-q-developer
agent: sdd
---

# Amazon Q CLI Custom Agent: Status Check

This template defines the `/kiro:spec-status` command behavior for the SDD Custom Agent in Amazon Q CLI.

## Agent Command Recognition

The SDD Custom Agent should recognize and execute this pattern:
```
/kiro:spec-status <feature-name>
```

## Implementation Logic

When a user types `/kiro:spec-status feature-name` in `q chat --agent sdd`:

### 1. Validate Feature Exists
- Check that `.kiro/specs/{feature-name}/` directory exists
- Verify spec.json file is present and readable

### 2. Read Current Status
- Load spec.json for workflow state
- Check file existence and modification dates
- Analyze task completion if in implementation phase

### 3. Generate Status Report

#### Status Display Template:
```
📊 **Specification Status Report**

**Feature**: {feature-name}
**Created**: {created_date}
**Last Updated**: {updated_date}
**Current Phase**: {current_phase}

## Workflow Progress

### 1. Specification Initialization
✅ **COMPLETED** | Created {creation_date}
- Generated feature name and directory structure
- Created template files (requirements.md, design.md, tasks.md)
- Initialized workflow metadata

### 2. Requirements Generation  
{status_icon} **{STATUS}** | {completion_info}
- Requirements document: {file_status}
- Approval status: {approval_status}
- {additional_details}

### 3. Technical Design
{status_icon} **{STATUS}** | {completion_info} 
- Design document: {file_status}
- Approval status: {approval_status}
- Prerequisites: {requirements_approval_check}

### 4. Implementation Tasks
{status_icon} **{STATUS}** | {completion_info}
- Tasks document: {file_status}
- Approval status: {approval_status}
- Prerequisites: {design_approval_check}

### 5. Implementation Phase
{status_icon} **{STATUS}** | {completion_info}
- Ready for implementation: {ready_status}
- Task progress: {task_completion_summary}

## File Status

📁 **.kiro/specs/{feature-name}/**
- ✅ **requirements.md** | {file_size} | Modified: {mod_date}
- ✅ **design.md** | {file_size} | Modified: {mod_date}  
- ✅ **tasks.md** | {file_size} | Modified: {mod_date}
- ✅ **spec.json** | {file_size} | Modified: {mod_date}

## Next Actions

{next_action_section}
```

### 4. Context-Aware Next Actions

Based on current phase, provide specific guidance:

#### If Phase: "initialized"
```
🎯 **Next Step: Generate Requirements**

Use `/kiro:spec-requirements {feature-name}` to create detailed requirements document.

**What this will do:**
- Generate comprehensive user stories and acceptance criteria
- Define functional and non-functional requirements  
- Create success metrics and validation approach
```

#### If Phase: "requirements-generated" + not approved
```
🎯 **Next Step: Review Requirements**

Please review the requirements document:
📂 .kiro/specs/{feature-name}/requirements.md

**After review:**
Use `/kiro:spec-design {feature-name}` to generate technical design.
```

#### If Phase: "design-generated" + not approved  
```
🎯 **Next Step: Review Design**

Please review the technical design document:
📂 .kiro/specs/{feature-name}/design.md

**After review:**
Use `/kiro:spec-tasks {feature-name}` to generate implementation tasks.
```

#### If Phase: "tasks-generated" + not approved
```
🎯 **Next Step: Review Tasks**

Please review the implementation plan:
📂 .kiro/specs/{feature-name}/tasks.md

**After review:**
Use `/kiro:spec-impl {feature-name} [task-numbers]` to start implementation.
```

#### If Phase: "ready-for-implementation"
```
🎯 **Next Step: Start Implementation**

**Available Commands:**
- `/kiro:spec-impl {feature-name}` - General implementation guidance
- `/kiro:spec-impl {feature-name} 1.1,1.2` - Specific task guidance
- `/kiro:spec-impl {feature-name} foundation` - Phase-based guidance

**Quick Start:**
Review tasks.md and start with Phase 1 (Foundation) tasks.
```

### 5. Implementation Progress Tracking

If in implementation phase, analyze tasks.md for completion:

```javascript
// Parse tasks.md for checkbox status
const completedTasks = tasks.filter(task => task.completed).length;
const totalTasks = tasks.length;
const progressPercent = (completedTasks / totalTasks) * 100;
```

Display progress:
```
📈 **Implementation Progress**

**Overall**: {completed}/{total} tasks ({percent}%)

**By Phase:**
- Phase 1 (Foundation): {x}/{y} tasks ({percent}%)
- Phase 2 (Core Features): {x}/{y} tasks ({percent}%)  
- Phase 3 (Integration): {x}/{y} tasks ({percent}%)
- Phase 4 (Testing & Deployment): {x}/{y} tasks ({percent}%)

**Recently Completed:**
- [x] Task 1.1: Set up project infrastructure
- [x] Task 1.2: Configure development environment

**In Progress:**
- [ ] Task 2.1: Implement core functionality  

**Blocked/Issues:**
{any_identified_blockers}
```

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

## Helper Functions

### List Available Features
If no feature specified or feature not found:
```
📋 **Available Features**

{list_all_features_in_kiro_specs}

**Usage**: `/kiro:spec-status {feature-name}`
**Example**: `/kiro:spec-status user-authentication`
```

## Integration Notes

This template is embedded in the SDD Custom Agent configuration and executed when users type `/kiro:spec-status` in Amazon Q CLI chat with `--agent sdd`.