#!/bin/bash
{{!-- 
Kiro Spec Tasks Shell Script Template for Unix Systems
Integrates with Amazon Q CLI for task breakdown generation
--}}

# kiro-spec-tasks - Generate implementation task breakdown with Amazon Q CLI
# Usage: kiro-spec-tasks <feature-name> [options]

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Script configuration
SCRIPT_NAME="kiro-spec-tasks"
SCRIPT_VERSION="1.0.0"
AMAZON_Q_CLI="{{AMAZON_Q_CLI_PATH}}"
KIRO_DIR="{{KIRO_DIRECTORY}}"
PROJECT_NAME="{{PROJECT_NAME}}"
TEMPLATE_DIR="{{TEMPLATE_DIRECTORY}}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Help function
show_help() {
    cat << EOF
${SCRIPT_NAME} - Generate implementation task breakdown with Amazon Q CLI

USAGE:
    ${SCRIPT_NAME} <feature-name> [OPTIONS]

ARGUMENTS:
    feature-name              Name of the feature to generate tasks for

OPTIONS:
    -d, --design <path>       Path to design document
    -t, --team-size <num>     Team size (default: auto-detect or 1)
    --timeline <duration>     Project timeline (e.g., "2 weeks", "1 month")
    --complexity <level>      Complexity level (low|medium|high)
    --approved                Skip design approval confirmation
    --dry-run                Preview the prompt without executing
    -v, --verbose            Enable verbose output
    -h, --help               Show this help message

EXAMPLES:
    ${SCRIPT_NAME} user-authentication
    ${SCRIPT_NAME} payment-system --approved --timeline "3 weeks"
    ${SCRIPT_NAME} api-gateway --complexity high --team-size 3

PREREQUISITES:
    - Design document must be completed and approved first
    - Both requirements and design phases must be complete

WORKFLOW:
    This command implements the SDD approval gate:
    - Confirms both requirements AND design have been approved
    - Only proceeds with task breakdown if prerequisites are met
    - Follows the Requirements → Design → Tasks → Implementation workflow

ENVIRONMENT:
    AMAZON_Q_CLI    Path to Amazon Q CLI binary (current: ${AMAZON_Q_CLI})
    KIRO_DIR        Kiro directory path (current: ${KIRO_DIR})

EOF
}

# Argument parsing
FEATURE_NAME=""
DESIGN_PATH=""
TEAM_SIZE=""
TIMELINE=""
COMPLEXITY=""
DESIGN_APPROVED=false
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--design)
            DESIGN_PATH="$2"
            shift 2
            ;;
        -t|--team-size)
            TEAM_SIZE="$2"
            shift 2
            ;;
        --timeline)
            TIMELINE="$2"
            shift 2
            ;;
        --complexity)
            COMPLEXITY="$2"
            shift 2
            ;;
        --approved)
            DESIGN_APPROVED=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            log_error "Unknown option: $1"
            echo "Use --help for usage information."
            exit 1
            ;;
        *)
            if [[ -z "$FEATURE_NAME" ]]; then
                FEATURE_NAME="$1"
            else
                log_error "Too many arguments. Feature name already provided: '$FEATURE_NAME'"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validation
if [[ -z "$FEATURE_NAME" ]]; then
    log_error "Feature name is required"
    echo "Usage: $SCRIPT_NAME <feature-name> [options]"
    echo "Use --help for more information."
    exit 1
fi

# Validate complexity level if provided
if [[ -n "$COMPLEXITY" && ! "$COMPLEXITY" =~ ^(low|medium|high)$ ]]; then
    log_error "Complexity must be one of: low, medium, high"
    exit 1
fi

# Set defaults
SPEC_PATH="${KIRO_DIR}/specs/${FEATURE_NAME}"
REQUIREMENTS_PATH="${SPEC_PATH}/requirements.md"

if [[ -z "$DESIGN_PATH" ]]; then
    DESIGN_PATH="${SPEC_PATH}/design.md"
fi

if [[ -z "$TEAM_SIZE" ]]; then
    TEAM_SIZE="1"
fi

if [[ -z "$COMPLEXITY" ]]; then
    COMPLEXITY="medium"
fi

# Verbose logging
if [[ "$VERBOSE" == true ]]; then
    log_info "Script: ${SCRIPT_NAME} v${SCRIPT_VERSION}"
    log_info "Feature Name: ${FEATURE_NAME}"
    log_info "Spec Path: ${SPEC_PATH}"
    log_info "Design Path: ${DESIGN_PATH}"
    log_info "Team Size: ${TEAM_SIZE}"
    log_info "Complexity: ${COMPLEXITY}"
    [[ -n "$TIMELINE" ]] && log_info "Timeline: ${TIMELINE}"
fi

# Check prerequisites
log_info "Checking prerequisites..."

# Check Amazon Q CLI
if [[ ! -x "$AMAZON_Q_CLI" ]]; then
    log_error "Amazon Q CLI not found or not executable: $AMAZON_Q_CLI"
    exit 1
fi

# Check template file
TEMPLATE_FILE="${TEMPLATE_DIR}/prompts/spec-tasks.hbs"
if [[ ! -f "$TEMPLATE_FILE" ]]; then
    log_error "Template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Check if feature exists
if [[ ! -d "$SPEC_PATH" ]]; then
    log_error "Feature directory not found: $SPEC_PATH"
    log_error "Please run kiro-spec-init first to initialize the feature"
    exit 1
fi

# Check if requirements exist
if [[ ! -f "$REQUIREMENTS_PATH" ]]; then
    log_error "Requirements file not found: $REQUIREMENTS_PATH"
    log_error "Please run kiro-spec-requirements first"
    exit 1
fi

# Check if design exists
if [[ ! -f "$DESIGN_PATH" ]]; then
    log_error "Design file not found: $DESIGN_PATH"
    log_error "Please run kiro-spec-design first"
    exit 1
fi

# Design approval gate - confirm BOTH requirements AND design are approved
if [[ "$DESIGN_APPROVED" != true ]]; then
    echo ""
    log_warning "SDD Workflow Checkpoint: Requirements & Design Review"
    echo "Before proceeding with task breakdown, both requirements AND design must be reviewed and approved."
    echo ""
    echo "Requirements file: $REQUIREMENTS_PATH"
    echo "Design file:       $DESIGN_PATH"
    echo ""
    echo "Please ensure BOTH documents have been reviewed and that:"
    echo "  ✓ Requirements are complete, clear, and approved"
    echo "  ✓ Design addresses all requirements"
    echo "  ✓ Technical approach is sound and feasible"
    echo "  ✓ Architecture decisions are documented"
    echo "  ✓ Both requirements and design are approved for implementation"
    echo ""
    
    while true; do
        read -p "Have you reviewed and approved BOTH requirements and design documents? [y/N] " -r
        case $REPLY in
            [Yy]* )
                DESIGN_APPROVED=true
                log_success "Requirements and design approved. Proceeding with task breakdown..."
                break
                ;;
            [Nn]* | "" )
                log_info "Please review and approve both requirements and design before proceeding."
                log_info "You can also use --approved flag to skip this confirmation."
                exit 0
                ;;
            * )
                echo "Please answer yes (y) or no (n)."
                ;;
        esac
    done
fi

# Check for existing tasks
TASKS_FILE="${SPEC_PATH}/tasks.md"
if [[ -f "$TASKS_FILE" ]]; then
    log_warning "Tasks file already exists: $TASKS_FILE"
    read -p "Overwrite existing tasks? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operation cancelled"
        exit 0
    fi
fi

# Read and summarize design
log_info "Reading design document..."
DESIGN_SUMMARY=""
if [[ -f "$DESIGN_PATH" ]]; then
    # Extract key sections from design
    DESIGN_SUMMARY=$(grep -E "^##|^###" "$DESIGN_PATH" | head -10 | sed 's/^#*//' | tr '\n' '; ')
    if [[ -z "$DESIGN_SUMMARY" ]]; then
        DESIGN_SUMMARY="See full design document at $DESIGN_PATH"
    fi
fi

# Detect development environment
DEV_ENVIRONMENT="Standard development environment"
if [[ -f "package.json" ]]; then
    DEV_ENVIRONMENT="Node.js/npm environment"
elif [[ -f "Cargo.toml" ]]; then
    DEV_ENVIRONMENT="Rust/Cargo environment"
elif [[ -f "pom.xml" ]]; then
    DEV_ENVIRONMENT="Java/Maven environment"
elif [[ -f "requirements.txt" ]]; then
    DEV_ENVIRONMENT="Python environment"
fi

# Generate prompt from template
log_info "Generating task breakdown prompt from template..."

PROMPT_FILE="/tmp/kiro-spec-tasks-${FEATURE_NAME}-$$.txt"
PROMPT_CONTENT=$(cat "$TEMPLATE_FILE")

# Replace variables
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{FEATURE_NAME\}\}/$FEATURE_NAME}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{PROJECT_NAME\}\}/$PROJECT_NAME}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{SPEC_PATH\}\}/$SPEC_PATH}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{REQUIREMENTS_PATH\}\}/$REQUIREMENTS_PATH}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{DESIGN_PATH\}\}/$DESIGN_PATH}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{DESIGN_SUMMARY\}\}/$DESIGN_SUMMARY}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{DEV_ENVIRONMENT\}\}/$DEV_ENVIRONMENT}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TEAM_SIZE\}\}/$TEAM_SIZE}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{COMPLEXITY_LEVEL\}\}/$COMPLEXITY}"

if [[ -n "$TIMELINE" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TIMELINE\}\}/$TIMELINE}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TIMELINE\}\}/Not specified}"
fi

# Handle conditional approval section
if [[ "$DESIGN_APPROVED" == true ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{#if DESIGN_APPROVED\}\}/}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{\/if\}\}/}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{#else\}\}/<!-- ELSE BLOCK START"}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{else\}\}/ELSE BLOCK END -->"}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{#if DESIGN_APPROVED\}\}/<!-- IF BLOCK START"}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{#else\}\}/IF BLOCK END -->"}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{else\}\}/<!-- ELSE BLOCK START"}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{\/if\}\}/ELSE BLOCK END -->"}"
fi

echo "$PROMPT_CONTENT" > "$PROMPT_FILE"

if [[ "$DRY_RUN" == true ]]; then
    log_info "DRY RUN - Prompt content:"
    echo "----------------------------------------"
    cat "$PROMPT_FILE"
    echo "----------------------------------------"
    log_info "Would execute: $AMAZON_Q_CLI chat --file \"$PROMPT_FILE\""
    rm -f "$PROMPT_FILE"
    exit 0
fi

# Execute with Amazon Q CLI
log_info "Generating task breakdown with Amazon Q CLI..."

if ! "$AMAZON_Q_CLI" chat --file "$PROMPT_FILE"; then
    log_error "Amazon Q CLI execution failed"
    rm -f "$PROMPT_FILE"
    exit 1
fi

# Clean up
rm -f "$PROMPT_FILE"

log_success "Task breakdown generation completed!"
log_info "Feature: $FEATURE_NAME"
log_info "Next steps:"
log_info "  1. Review the generated task breakdown"
log_info "  2. Save tasks to: $TASKS_FILE"
log_info "  3. Begin implementation with: kiro-spec-impl $FEATURE_NAME"
log_info "  4. Track progress with: kiro-spec-status $FEATURE_NAME"

exit 0