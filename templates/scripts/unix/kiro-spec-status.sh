#!/bin/bash
{{!-- 
Kiro Spec Status Shell Script Template for Unix Systems
Integrates with Amazon Q CLI for specification status checking
--}}

# kiro-spec-status - Check feature specification status with Amazon Q CLI
# Usage: kiro-spec-status <feature-name> [options]

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Script configuration
SCRIPT_NAME="kiro-spec-status"
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
${SCRIPT_NAME} - Check feature specification status with Amazon Q CLI

USAGE:
    ${SCRIPT_NAME} <feature-name> [OPTIONS]

ARGUMENTS:
    feature-name              Name of the feature to check status for

OPTIONS:
    --issues <description>    Known issues to address in analysis
    --concerns <description>  Team concerns to consider
    --timeline <constraints>  Timeline constraints to factor in
    --detailed               Show detailed file analysis
    --dry-run               Preview the prompt without executing
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    ${SCRIPT_NAME} user-authentication
    ${SCRIPT_NAME} payment-system --detailed
    ${SCRIPT_NAME} api-gateway --issues "Performance concerns with current approach"

FEATURES:
    - Analyzes completion status of all SDD phases
    - Validates document quality and workflow compliance
    - Identifies gaps and missing elements
    - Provides next steps recommendations
    - Checks traceability between specification phases

ENVIRONMENT:
    AMAZON_Q_CLI    Path to Amazon Q CLI binary (current: ${AMAZON_Q_CLI})
    KIRO_DIR        Kiro directory path (current: ${KIRO_DIR})

EOF
}

# Argument parsing
FEATURE_NAME=""
CURRENT_ISSUES=""
TEAM_CONCERNS=""
TIMELINE_CONSTRAINTS=""
DETAILED=false
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --issues)
            CURRENT_ISSUES="$2"
            shift 2
            ;;
        --concerns)
            TEAM_CONCERNS="$2"
            shift 2
            ;;
        --timeline)
            TIMELINE_CONSTRAINTS="$2"
            shift 2
            ;;
        --detailed)
            DETAILED=true
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

# Set paths
SPEC_DIRECTORY="${KIRO_DIR}/specs/${FEATURE_NAME}"
SPEC_PATH="${SPEC_DIRECTORY}/specification.md"
REQUIREMENTS_PATH="${SPEC_DIRECTORY}/requirements.md"
DESIGN_PATH="${SPEC_DIRECTORY}/design.md"
TASKS_PATH="${SPEC_DIRECTORY}/tasks.md"

# Verbose logging
if [[ "$VERBOSE" == true ]]; then
    log_info "Script: ${SCRIPT_NAME} v${SCRIPT_VERSION}"
    log_info "Feature Name: ${FEATURE_NAME}"
    log_info "Spec Directory: ${SPEC_DIRECTORY}"
    log_info "Amazon Q CLI: ${AMAZON_Q_CLI}"
    [[ -n "$CURRENT_ISSUES" ]] && log_info "Issues: ${CURRENT_ISSUES}"
    [[ -n "$TEAM_CONCERNS" ]] && log_info "Concerns: ${TEAM_CONCERNS}"
    [[ -n "$TIMELINE_CONSTRAINTS" ]] && log_info "Timeline: ${TIMELINE_CONSTRAINTS}"
fi

# Check prerequisites
log_info "Checking prerequisites..."

# Check Amazon Q CLI
if [[ ! -x "$AMAZON_Q_CLI" ]]; then
    log_error "Amazon Q CLI not found or not executable: $AMAZON_Q_CLI"
    exit 1
fi

# Check template file
TEMPLATE_FILE="${TEMPLATE_DIR}/prompts/spec-status.hbs"
if [[ ! -f "$TEMPLATE_FILE" ]]; then
    log_error "Template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Check if feature directory exists
if [[ ! -d "$SPEC_DIRECTORY" ]]; then
    log_error "Feature directory not found: $SPEC_DIRECTORY"
    log_error "Please run kiro-spec-init first to initialize the feature"
    exit 1
fi

# Analyze current state
log_info "Analyzing specification state..."

# Check file existence and provide basic analysis
FILE_STATUS=""

if [[ "$DETAILED" == true ]]; then
    log_info "Performing detailed file analysis..."
fi

# Check each specification file
if [[ -f "$SPEC_PATH" ]]; then
    SPEC_SIZE=$(wc -l < "$SPEC_PATH" 2>/dev/null || echo "0")
    FILE_STATUS+="✓ Specification: $SPEC_PATH ($SPEC_SIZE lines)\n"
    if [[ "$DETAILED" == true ]]; then
        log_info "  - Specification found with $SPEC_SIZE lines"
    fi
else
    FILE_STATUS+="✗ Specification: Missing\n"
    if [[ "$DETAILED" == true ]]; then
        log_warning "  - Specification file not found"
    fi
fi

if [[ -f "$REQUIREMENTS_PATH" ]]; then
    REQ_SIZE=$(wc -l < "$REQUIREMENTS_PATH" 2>/dev/null || echo "0")
    FILE_STATUS+="✓ Requirements: $REQUIREMENTS_PATH ($REQ_SIZE lines)\n"
    if [[ "$DETAILED" == true ]]; then
        log_info "  - Requirements found with $REQ_SIZE lines"
    fi
else
    FILE_STATUS+="✗ Requirements: Missing\n"
    if [[ "$DETAILED" == true ]]; then
        log_warning "  - Requirements file not found"
    fi
fi

if [[ -f "$DESIGN_PATH" ]]; then
    DESIGN_SIZE=$(wc -l < "$DESIGN_PATH" 2>/dev/null || echo "0")
    FILE_STATUS+="✓ Design: $DESIGN_PATH ($DESIGN_SIZE lines)\n"
    if [[ "$DETAILED" == true ]]; then
        log_info "  - Design found with $DESIGN_SIZE lines"
    fi
else
    FILE_STATUS+="✗ Design: Missing\n"
    if [[ "$DETAILED" == true ]]; then
        log_warning "  - Design file not found"
    fi
fi

if [[ -f "$TASKS_PATH" ]]; then
    TASKS_SIZE=$(wc -l < "$TASKS_PATH" 2>/dev/null || echo "0")
    FILE_STATUS+="✓ Tasks: $TASKS_PATH ($TASKS_SIZE lines)\n"
    if [[ "$DETAILED" == true ]]; then
        log_info "  - Tasks found with $TASKS_SIZE lines"
    fi
else
    FILE_STATUS+="✗ Tasks: Missing\n"
    if [[ "$DETAILED" == true ]]; then
        log_warning "  - Tasks file not found"
    fi
fi

# Generate prompt from template
log_info "Generating status analysis prompt from template..."

PROMPT_FILE="/tmp/kiro-spec-status-${FEATURE_NAME}-$$.txt"
PROMPT_CONTENT=$(cat "$TEMPLATE_FILE")

# Replace variables
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{FEATURE_NAME\}\}/$FEATURE_NAME}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{PROJECT_NAME\}\}/$PROJECT_NAME}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{SPEC_DIRECTORY\}\}/$SPEC_DIRECTORY}"

# Handle optional paths
if [[ -f "$SPEC_PATH" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{SPEC_PATH\}\}/$SPEC_PATH}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{SPEC_PATH\}\}/Not found}"
fi

if [[ -f "$REQUIREMENTS_PATH" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{REQUIREMENTS_PATH\}\}/$REQUIREMENTS_PATH}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{REQUIREMENTS_PATH\}\}/Not found}"
fi

if [[ -f "$DESIGN_PATH" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{DESIGN_PATH\}\}/$DESIGN_PATH}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{DESIGN_PATH\}\}/Not found}"
fi

if [[ -f "$TASKS_PATH" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TASKS_PATH\}\}/$TASKS_PATH}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TASKS_PATH\}\}/Not found}"
fi

# Handle conditional sections
if [[ -n "$CURRENT_ISSUES" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{CURRENT_ISSUES\}\}/$CURRENT_ISSUES}"
else
    # Remove the conditional block if no issues
    PROMPT_CONTENT=$(echo "$PROMPT_CONTENT" | sed '/{{#if CURRENT_ISSUES}}/,/{{\/if}}/d')
fi

if [[ -n "$TEAM_CONCERNS" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TEAM_CONCERNS\}\}/$TEAM_CONCERNS}"
else
    # Remove the conditional block if no concerns
    PROMPT_CONTENT=$(echo "$PROMPT_CONTENT" | sed '/{{#if TEAM_CONCERNS}}/,/{{\/if}}/d')
fi

if [[ -n "$TIMELINE_CONSTRAINTS" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TIMELINE_CONSTRAINTS\}\}/$TIMELINE_CONSTRAINTS}"
else
    # Remove the conditional block if no timeline constraints
    PROMPT_CONTENT=$(echo "$PROMPT_CONTENT" | sed '/{{#if TIMELINE_CONSTRAINTS}}/,/{{\/if}}/d')
fi

echo "$PROMPT_CONTENT" > "$PROMPT_FILE"

# Add file status analysis to the prompt
echo "" >> "$PROMPT_FILE"
echo "## Current File Status Analysis" >> "$PROMPT_FILE"
echo -e "$FILE_STATUS" >> "$PROMPT_FILE"

if [[ "$DRY_RUN" == true ]]; then
    log_info "DRY RUN - Current file status:"
    echo "----------------------------------------"
    echo -e "$FILE_STATUS"
    echo "----------------------------------------"
    log_info "Prompt content:"
    echo "----------------------------------------"
    cat "$PROMPT_FILE"
    echo "----------------------------------------"
    log_info "Would execute: $AMAZON_Q_CLI chat --file \"$PROMPT_FILE\""
    rm -f "$PROMPT_FILE"
    exit 0
fi

# Show brief status before Amazon Q analysis
echo ""
log_info "Current specification status:"
echo -e "$FILE_STATUS"

# Execute with Amazon Q CLI
log_info "Analyzing specification status with Amazon Q CLI..."

if ! "$AMAZON_Q_CLI" chat --file "$PROMPT_FILE"; then
    log_error "Amazon Q CLI execution failed"
    rm -f "$PROMPT_FILE"
    exit 1
fi

# Clean up
rm -f "$PROMPT_FILE"

log_success "Status analysis completed!"
log_info "Feature: $FEATURE_NAME"

exit 0