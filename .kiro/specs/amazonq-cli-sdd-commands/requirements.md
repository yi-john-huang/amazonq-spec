# Requirements Document - EARS Format

## Introduction
This feature creates a production-ready `amazonq-sdd` NPM package that provides native `/kiro:` command support in Amazon Q CLI through Custom Agents. The package enables Amazon Q CLI users to leverage the same systematic spec-driven development workflow that Claude Code users enjoy, but with native integration through Amazon Q CLI's Custom Agent system.

The `amazonq-sdd` package delivers a single-command installation (`npx amazonq-sdd`) that:
1. Installs an SDD Custom Agent configuration to `~/.aws/amazonq/cli-agents/sdd.json`
2. Creates local customizable templates in `.amazonq/commands/kiro/`
3. Generates comprehensive `AMAZONQ.md` documentation
4. Enables immediate use with `q chat --agent sdd` to execute commands like `/kiro:spec-init`

## Functional Requirements

### REQ-001: NPX Installation
WHEN a user executes `npx amazonq-sdd`, the system SHALL download and execute a single installer file.

### REQ-002: Installation Output
WHEN the installation process completes successfully, the system SHALL:
- Write SDD Custom Agent configuration to `~/.aws/amazonq/cli-agents/sdd.json`
- Create local templates in `.amazonq/commands/kiro/`
- Generate `AMAZONQ.md` documentation file

### REQ-003: Amazon Q CLI Detection
IF Amazon Q CLI is not detected in the system PATH, THEN the installer SHALL display clear instructions for Amazon Q CLI installation.

### REQ-004: Post-Installation Availability
WHEN the installation completes successfully, the system SHALL enable immediate use of `q chat --agent sdd` for accessing SDD commands.

### REQ-005: Standalone Package
WHILE maintaining full functionality, the installer SHALL include all necessary configurations and templates embedded within a single installer file.

### REQ-006: Command Recognition
WHEN users type `/kiro:<command>` in a `q chat --agent sdd` session, the Custom Agent SHALL recognize and execute the command using local template guidance.

### REQ-007: File System Permissions
WHERE the Custom Agent performs file operations, the system SHALL restrict access to:
- `.kiro/**` paths
- `*.md` files
- `.amazonq/**` paths

### REQ-008: Template Reference
WHEN the Custom Agent executes commands, the system SHALL reference local templates in `.amazonq/commands/kiro/` for command behavior and implementation logic.

### REQ-009: Error Handling
IF users enter unrecognized `/kiro:` commands, THEN the agent SHALL provide helpful suggestions for correct command syntax.

### REQ-010: Workflow State Persistence
WHILE processing SDD commands, the agent SHALL maintain workflow state through spec.json files in each feature directory under `.kiro/specs/`.

### REQ-011: Template Customization
WHERE users require custom behavior, the system SHALL allow editing of templates in `.amazonq/commands/kiro/` to modify command behavior.

### REQ-012: Command Suite Support
The Custom Agent SHALL support all eight SDD commands:
- `/kiro:spec-init`
- `/kiro:spec-requirements`
- `/kiro:spec-design`
- `/kiro:spec-tasks`
- `/kiro:spec-impl`
- `/kiro:spec-status`
- `/kiro:steering`
- `/kiro:steering-custom`

### REQ-013: Command Functionality Parity
WHEN users execute any SDD command, the Custom Agent SHALL provide functionality equivalent to the original shell script implementations.

### REQ-014: Workflow Gate Enforcement
IF workflow gates are required (e.g., design phase requires approved requirements), THEN the agent SHALL enforce these constraints with clear user prompts.

### REQ-015: Directory Structure Creation
WHEN commands generate files, the system SHALL create the standard SDD directory structures:
- `.kiro/specs/{feature-name}/` for specifications
- `.kiro/steering/` for steering documents

### REQ-016: Documentation Quality
WHILE generating documentation through Amazon Q CLI tools, the agent SHALL produce professional, enterprise-quality content that maintains workflow integrity.

### REQ-017: Specification Initialization
WHEN users execute `/kiro:spec-init`, the system SHALL create spec.json files with phase tracking and approval state management.

### REQ-018: Phase Progression Control
IF users attempt to skip workflow phases, THEN the agent SHALL prevent progression and prompt for required approvals.

### REQ-019: Requirements Review Gate
WHEN users run `/kiro:spec-design` without approved requirements, the agent SHALL display the prompt: "Have you reviewed requirements.md? [y/N]".

### REQ-020: State Update Tracking
WHEN workflow states change, the system SHALL update spec.json files with:
- Current phase information
- Timestamp of state change
- Approval status

### REQ-021: Status Reporting
WHERE users request workflow status via `/kiro:spec-status`, the system SHALL provide clear progress reporting including current phase and pending approvals.

### REQ-022: Directory Creation
WHEN the agent writes files, the system SHALL ensure proper directory structures exist or create them as needed:
- `.kiro/specs/{feature}/` for feature specifications
- `.kiro/steering/` for steering documents

### REQ-023: File Existence Check
WHEN generating content, the agent SHALL use fs_read to check for existing files before performing write operations.

### REQ-024: Permission Error Handling
IF directory or file permissions are insufficient, THEN the agent SHALL provide clear error messages with suggested resolution steps.

### REQ-025: Markdown Formatting
WHEN creating documentation templates, the agent SHALL generate professional markdown with consistent formatting and structure.

### REQ-026: File Conflict Resolution
WHERE file conflicts exist, the agent SHALL prompt users for resolution rather than silently overwriting existing content.

### REQ-027: Zero Dependencies
WHEN users install via NPX, the system SHALL download only a single installer file with embedded agent configuration and templates, requiring no external dependencies.

### REQ-028: Built-in Modules Only
WHEN the installer executes, the system SHALL use only Node.js built-in modules:
- fs (file system)
- path (path utilities)
- os (operating system)
- child_process (process execution)

### REQ-029: External Tool Dependency
IF the installer requires external tools, THEN it SHALL only depend on Amazon Q CLI being available in the system PATH.

### REQ-030: Package Contents
WHEN packaging for NPM, the package SHALL contain only:
- install.js (main installer)
- package.json (package metadata)
- README.md (documentation)
- LICENSE (legal information)

### REQ-031: Package Size Limit
WHILE maintaining full functionality, the package SHALL remain under 35KB total size.

### REQ-032: Installation Feedback
WHEN users run the installer, the system SHALL provide clear, real-time feedback about:
- Installation progress
- Current operation being performed
- Completion status
- Next steps for usage

### REQ-033: Getting Started Guide
WHEN installation completes, the system SHALL display instructions for starting the first specification with example commands.

### REQ-034: Error Message Clarity
IF errors occur during installation or operation, THEN the system SHALL provide actionable error messages with suggested fixes.

### REQ-035: Help Command
WHEN users execute `npx amazonq-sdd help`, the system SHALL display comprehensive usage information including all available commands and options.

### REQ-036: Documentation Links
WHILE maintaining standalone operation, the package SHALL include links to full documentation and support resources.

### REQ-037: Platform Support
WHEN users install on macOS, Windows, or Linux, the installer SHALL function identically across all supported platforms.

### REQ-038: Path Resolution
WHEN determining Amazon Q CLI configuration paths, the system SHALL correctly locate the agents directory using platform-appropriate methods.

### REQ-039: Platform-Specific Errors
IF platform-specific issues arise, THEN the installer SHALL provide platform-appropriate error messages and solutions.

### REQ-040: Cross-Platform Paths
WHEN creating file paths, the system SHALL use Node.js path utilities to ensure cross-platform compatibility.

### REQ-041: Platform Conventions
WHILE maintaining consistency, the system SHALL respect platform-specific conventions including:
- Path separators (/ vs \)
- Home directory locations
- File permissions models

## Non-Functional Requirements

### REQ-NFR-001: Installation Success Rate
The system SHALL achieve an installation success rate greater than 99% across all supported platforms.

### REQ-NFR-002: Time to First Command
The time from executing `npx amazonq-sdd` to first working `/kiro:spec-init` command SHALL be less than 30 seconds.

### REQ-NFR-003: Package Size
The total package size SHALL not exceed 35KB.

### REQ-NFR-004: Dependency Count
The package SHALL maintain zero external runtime dependencies.

### REQ-NFR-005: User Satisfaction
The system SHALL achieve user satisfaction scores greater than 4.5 out of 5 for setup experience.

### REQ-NFR-006: Feature Parity
The system SHALL maintain complete feature parity with Claude Code SDD implementation.

### REQ-NFR-007: Template Customization
The system SHALL verify that local template customization capability functions correctly.

### REQ-NFR-008: Template Compliance
Agent behavior SHALL match template specifications with 100% accuracy.

## Constraints

### REQ-CON-001: Amazon Q CLI Dependency
The system SHALL require Amazon Q CLI to be installed and available in the system PATH.

### REQ-CON-002: Node.js Version
The system SHALL support Node.js version 14.0.0 or higher.

### REQ-CON-003: File System Access
The system SHALL only modify files within user-accessible directories.

### REQ-CON-004: Network Access
The NPX installation SHALL require network access only for initial package download.

## Assumptions

### REQ-ASM-001: User Permissions
Users SHALL have write permissions to their home directory and project directories.

### REQ-ASM-002: Amazon Q CLI Configuration
Amazon Q CLI SHALL support Custom Agent configurations in JSON format.

### REQ-ASM-003: Template Processing
Amazon Q CLI SHALL be capable of interpreting and executing commands based on local template files.