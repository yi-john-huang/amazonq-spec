#!/bin/bash
{{!-- 
Kiro Spec Design Shell Script Template for Unix Systems
Integrates with Amazon Q CLI for design document creation
--}}

# kiro-spec-design - Create technical design document with Amazon Q CLI
# Usage: kiro-spec-design <feature-name> [options]

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Script configuration
SCRIPT_NAME="kiro-spec-design"
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
${SCRIPT_NAME} - Create technical design document with Amazon Q CLI

USAGE:
    ${SCRIPT_NAME} <feature-name> [OPTIONS]

ARGUMENTS:
    feature-name              Name of the feature to create design for

OPTIONS:
    -r, --requirements <path> Path to requirements file
    -t, --tech <stack>        Technology stack override
    -a, --arch <type>         Architecture type override
    --approved                Skip requirements approval confirmation
    --dry-run                Preview the prompt without executing
    -v, --verbose            Enable verbose output
    -h, --help               Show this help message

EXAMPLES:
    ${SCRIPT_NAME} user-authentication
    ${SCRIPT_NAME} payment-system --approved
    ${SCRIPT_NAME} api-gateway --requirements /custom/path/requirements.md

PREREQUISITES:
    - Requirements must be completed and approved first
    - Run kiro-spec-requirements before this command

WORKFLOW:
    This command implements the SDD approval gate:
    - Confirms requirements have been reviewed and approved
    - Only proceeds with design if prerequisites are met
    - Follows the Requirements → Design → Tasks workflow

ENVIRONMENT:
    AMAZON_Q_CLI    Path to Amazon Q CLI binary (current: ${AMAZON_Q_CLI})
    KIRO_DIR        Kiro directory path (current: ${KIRO_DIR})

EOF
}

# Argument parsing
FEATURE_NAME=""
REQUIREMENTS_PATH=""
TECHNOLOGY_STACK=""
ARCHITECTURE_TYPE=""
REQUIREMENTS_APPROVED=false
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--requirements)
            REQUIREMENTS_PATH="$2"
            shift 2
            ;;
        -t|--tech)
            TECHNOLOGY_STACK="$2"
            shift 2
            ;;
        -a|--arch)
            ARCHITECTURE_TYPE="$2"
            shift 2
            ;;
        --approved)
            REQUIREMENTS_APPROVED=true
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

# Set defaults
SPEC_PATH="${KIRO_DIR}/specs/${FEATURE_NAME}"

if [[ -z "$REQUIREMENTS_PATH" ]]; then
    REQUIREMENTS_PATH="${SPEC_PATH}/requirements.md"
fi

# Verbose logging
if [[ "$VERBOSE" == true ]]; then
    log_info "Script: ${SCRIPT_NAME} v${SCRIPT_VERSION}"
    log_info "Feature Name: ${FEATURE_NAME}"
    log_info "Spec Path: ${SPEC_PATH}"
    log_info "Requirements Path: ${REQUIREMENTS_PATH}"
    log_info "Amazon Q CLI: ${AMAZON_Q_CLI}"
    [[ -n "$TECHNOLOGY_STACK" ]] && log_info "Technology Stack: ${TECHNOLOGY_STACK}"
    [[ -n "$ARCHITECTURE_TYPE" ]] && log_info "Architecture Type: ${ARCHITECTURE_TYPE}"
fi

# Check prerequisites
log_info "Checking prerequisites..."

# Check Amazon Q CLI
if [[ ! -x "$AMAZON_Q_CLI" ]]; then
    log_error "Amazon Q CLI not found or not executable: $AMAZON_Q_CLI"
    exit 1
fi

# Check template file
TEMPLATE_FILE="${TEMPLATE_DIR}/prompts/spec-design.hbs"
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
    log_error "Please run kiro-spec-requirements first to generate requirements"
    exit 1
fi

# Requirements approval gate
if [[ "$REQUIREMENTS_APPROVED" != true ]]; then
    echo ""
    log_warning "SDD Workflow Checkpoint: Requirements Review"
    echo "Before proceeding with design, the requirements must be reviewed and approved."
    echo ""
    echo "Requirements file: $REQUIREMENTS_PATH"
    echo ""
    echo "Please review the requirements document and ensure:"
    echo "  ✓ All functional requirements are clearly defined"
    echo "  ✓ Non-functional requirements are specified"
    echo "  ✓ Business rules are documented"
    echo "  ✓ Acceptance criteria are testable"
    echo "  ✓ Requirements are complete and approved"
    echo ""
    
    while true; do
        read -p "Have you reviewed and approved the requirements document? [y/N] " -r
        case $REPLY in
            [Yy]* )
                REQUIREMENTS_APPROVED=true
                log_success "Requirements approved. Proceeding with design..."
                break
                ;;
            [Nn]* | "" )
                log_info "Please review and approve requirements before proceeding with design."
                log_info "You can also use --approved flag to skip this confirmation."
                exit 0
                ;;
            * )
                echo "Please answer yes (y) or no (n)."
                ;;
        esac
    done
fi

# Check for existing design
DESIGN_FILE="${SPEC_PATH}/design.md"
if [[ -f "$DESIGN_FILE" ]]; then
    log_warning "Design file already exists: $DESIGN_FILE"
    read -p "Overwrite existing design? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operation cancelled"
        exit 0
    fi
fi

# Read and summarize requirements
log_info "Reading requirements document..."
REQUIREMENTS_SUMMARY=""
if [[ -f "$REQUIREMENTS_PATH" ]]; then
    # Extract key sections from requirements
    REQUIREMENTS_SUMMARY=$(head -50 "$REQUIREMENTS_PATH" | grep -E "^##|^###|^- " | head -10 | tr '\n' ' ')
    if [[ -z "$REQUIREMENTS_SUMMARY" ]]; then
        REQUIREMENTS_SUMMARY="See full requirements document at $REQUIREMENTS_PATH"
    fi
fi

# Detect project context
PROJECT_PATH=$(pwd)
if [[ -z "$TECHNOLOGY_STACK" ]]; then
    # Try to auto-detect from package.json, Cargo.toml, etc.
    if [[ -f "package.json" ]]; then
        TECHNOLOGY_STACK="Node.js/JavaScript"
    elif [[ -f "Cargo.toml" ]]; then
        TECHNOLOGY_STACK="Rust"
    elif [[ -f "pom.xml" ]]; then
        TECHNOLOGY_STACK="Java/Maven"
    elif [[ -f "requirements.txt" ]]; then
        TECHNOLOGY_STACK="Python"
    else
        TECHNOLOGY_STACK="Not specified"
    fi
fi

if [[ -z "$ARCHITECTURE_TYPE" ]]; then
    ARCHITECTURE_TYPE="Not specified"
fi

# Generate prompt from template
log_info "Generating design prompt from template..."

PROMPT_FILE="/tmp/kiro-spec-design-${FEATURE_NAME}-$$.txt"
PROMPT_CONTENT=$(cat "$TEMPLATE_FILE")

# Replace variables
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{FEATURE_NAME\}\}/$FEATURE_NAME}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{PROJECT_NAME\}\}/$PROJECT_NAME}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{SPEC_PATH\}\}/$SPEC_PATH}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{REQUIREMENTS_PATH\}\}/$REQUIREMENTS_PATH}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{REQUIREMENTS_SUMMARY\}\}/$REQUIREMENTS_SUMMARY}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TECHNOLOGY_STACK\}\}/$TECHNOLOGY_STACK}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{ARCHITECTURE_TYPE\}\}/$ARCHITECTURE_TYPE}"

# Handle conditional approval section
if [[ "$REQUIREMENTS_APPROVED" == true ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{#if REQUIREMENTS_APPROVED\}\}/}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{\/if\}\}/}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{#else\}\}/<!-- ELSE BLOCK START"}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{else\}\}/ELSE BLOCK END -->"}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{#if REQUIREMENTS_APPROVED\}\}/<!-- IF BLOCK START"}"
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
log_info "Generating design with Amazon Q CLI..."

if ! "$AMAZON_Q_CLI" chat --file "$PROMPT_FILE"; then
    log_error "Amazon Q CLI execution failed"
    rm -f "$PROMPT_FILE"
    exit 1
fi

# Clean up
rm -f "$PROMPT_FILE"

log_success "Design generation completed!"
log_info "Feature: $FEATURE_NAME"
log_info "Next steps:"
log_info "  1. Review the generated design document"
log_info "  2. Save design to: $DESIGN_FILE"
log_info "  3. Run: kiro-spec-tasks $FEATURE_NAME"

exit 0