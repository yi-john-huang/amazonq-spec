#!/bin/bash
{{!-- 
Kiro Spec Requirements Shell Script Template for Unix Systems
Integrates with Amazon Q CLI for requirements generation
--}}

# kiro-spec-requirements - Generate feature requirements with Amazon Q CLI
# Usage: kiro-spec-requirements <feature-name> [options]

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Script configuration
SCRIPT_NAME="kiro-spec-requirements"
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
${SCRIPT_NAME} - Generate feature requirements with Amazon Q CLI

USAGE:
    ${SCRIPT_NAME} <feature-name> [OPTIONS]

ARGUMENTS:
    feature-name          Name of the feature to generate requirements for

OPTIONS:
    -d, --details <text>  Additional feature details
    -s, --spec <path>     Path to existing specification file
    -p, --project <name>  Project name (default: ${PROJECT_NAME})
    --existing-spec       Indicates an existing spec file should be referenced
    --dry-run            Preview the prompt without executing
    -v, --verbose        Enable verbose output
    -h, --help           Show this help message

EXAMPLES:
    ${SCRIPT_NAME} user-authentication
    ${SCRIPT_NAME} payment-system --details "Support for multiple payment gateways"
    ${SCRIPT_NAME} api-gateway --spec /path/to/existing/spec.md

PREREQUISITES:
    - Feature must be initialized first with kiro-spec-init
    - Amazon Q CLI must be installed and configured

ENVIRONMENT:
    AMAZON_Q_CLI    Path to Amazon Q CLI binary (current: ${AMAZON_Q_CLI})
    KIRO_DIR        Kiro directory path (current: ${KIRO_DIR})

EOF
}

# Argument parsing
FEATURE_NAME=""
FEATURE_DETAILS=""
SPEC_PATH=""
PROJECT_NAME_OVERRIDE=""
EXISTING_SPEC=false
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--details)
            FEATURE_DETAILS="$2"
            shift 2
            ;;
        -s|--spec)
            SPEC_PATH="$2"
            shift 2
            ;;
        -p|--project)
            PROJECT_NAME_OVERRIDE="$2"
            shift 2
            ;;
        --existing-spec)
            EXISTING_SPEC=true
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
if [[ -n "$PROJECT_NAME_OVERRIDE" ]]; then
    PROJECT_NAME="$PROJECT_NAME_OVERRIDE"
fi

if [[ -z "$SPEC_PATH" ]]; then
    SPEC_PATH="${KIRO_DIR}/specs/${FEATURE_NAME}"
fi

# Verbose logging
if [[ "$VERBOSE" == true ]]; then
    log_info "Script: ${SCRIPT_NAME} v${SCRIPT_VERSION}"
    log_info "Feature Name: ${FEATURE_NAME}"
    log_info "Project Name: ${PROJECT_NAME}"
    log_info "Spec Path: ${SPEC_PATH}"
    log_info "Amazon Q CLI: ${AMAZON_Q_CLI}"
    [[ -n "$FEATURE_DETAILS" ]] && log_info "Feature Details: ${FEATURE_DETAILS}"
fi

# Check prerequisites
log_info "Checking prerequisites..."

# Check Amazon Q CLI
if [[ ! -x "$AMAZON_Q_CLI" ]]; then
    log_error "Amazon Q CLI not found or not executable: $AMAZON_Q_CLI"
    exit 1
fi

# Check template file
TEMPLATE_FILE="${TEMPLATE_DIR}/prompts/spec-requirements.hbs"
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

# Check for existing specification
SPEC_FILE="${SPEC_PATH}/specification.md"
REQUIREMENTS_FILE="${SPEC_PATH}/requirements.md"

if [[ -f "$SPEC_FILE" ]]; then
    EXISTING_SPEC=true
    log_info "Found existing specification: $SPEC_FILE"
elif [[ "$EXISTING_SPEC" == true ]]; then
    log_error "No existing specification found at: $SPEC_FILE"
    exit 1
fi

# Check if requirements already exist
if [[ -f "$REQUIREMENTS_FILE" ]]; then
    log_warning "Requirements file already exists: $REQUIREMENTS_FILE"
    read -p "Overwrite existing requirements? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operation cancelled"
        exit 0
    fi
fi

# Read existing specification if available
CURRENT_ANALYSIS=""
if [[ "$EXISTING_SPEC" == true && -f "$SPEC_FILE" ]]; then
    log_info "Reading existing specification..."
    # Extract relevant sections for analysis
    CURRENT_ANALYSIS=$(grep -A 20 "## Initial Analysis" "$SPEC_FILE" | head -20 || echo "No analysis section found")
fi

# Build template variables
TEMPLATE_VARS=""

# Generate prompt from template
log_info "Generating requirements prompt from template..."

PROMPT_FILE="/tmp/kiro-spec-requirements-${FEATURE_NAME}-$$.txt"
PROMPT_CONTENT=$(cat "$TEMPLATE_FILE")

# Replace variables
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{FEATURE_NAME\}\}/$FEATURE_NAME}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{PROJECT_NAME\}\}/$PROJECT_NAME}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{SPEC_PATH\}\}/$SPEC_PATH}"

if [[ -n "$FEATURE_DETAILS" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{FEATURE_DETAILS\}\}/$FEATURE_DETAILS}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{FEATURE_DETAILS\}\}/See existing specification for details}"
fi

# Handle conditional sections
if [[ "$EXISTING_SPEC" == true ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{#if EXISTING_SPEC\}\}/}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{\/if\}\}/}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{#else\}\}/<!-- ELSE BLOCK START"}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{else\}\}/ELSE BLOCK END -->"}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{#if EXISTING_SPEC\}\}/<!-- IF BLOCK START"}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{#else\}\}/IF BLOCK END -->"}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{else\}\}/<!-- ELSE BLOCK START"}"
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{\/if\}\}/ELSE BLOCK END -->"}"
fi

if [[ -n "$CURRENT_ANALYSIS" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{CURRENT_ANALYSIS\}\}/$CURRENT_ANALYSIS}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{CURRENT_ANALYSIS\}\}/No existing analysis available}"
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
log_info "Generating requirements with Amazon Q CLI..."

if ! "$AMAZON_Q_CLI" chat --file "$PROMPT_FILE"; then
    log_error "Amazon Q CLI execution failed"
    rm -f "$PROMPT_FILE"
    exit 1
fi

# Clean up
rm -f "$PROMPT_FILE"

log_success "Requirements generation completed!"
log_info "Feature: $FEATURE_NAME"
log_info "Next steps:"
log_info "  1. Review the generated requirements"
log_info "  2. Save requirements to: $REQUIREMENTS_FILE"
log_info "  3. Run: kiro-spec-design $FEATURE_NAME"

exit 0