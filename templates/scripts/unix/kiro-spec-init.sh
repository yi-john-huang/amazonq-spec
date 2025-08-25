#!/bin/bash
{{!-- 
Kiro Spec Init Shell Script Template for Unix Systems
Integrates with Amazon Q CLI for feature specification initialization
--}}

# kiro-spec-init - Initialize feature specification with Amazon Q CLI
# Usage: kiro-spec-init <feature-description> [options]

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Script configuration
SCRIPT_NAME="kiro-spec-init"
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
${SCRIPT_NAME} - Initialize feature specification with Amazon Q CLI

USAGE:
    ${SCRIPT_NAME} <feature-description> [OPTIONS]

ARGUMENTS:
    feature-description    Detailed description of the feature to initialize

OPTIONS:
    -n, --name <name>      Feature name (default: auto-generated from description)
    -p, --project <name>   Project name (default: ${PROJECT_NAME})
    -o, --output <dir>     Output directory (default: ${KIRO_DIR}/specs)
    -t, --tech <stack>     Technology stack
    -a, --arch <type>      Architecture type
    --dry-run             Preview the prompt without executing
    -v, --verbose         Enable verbose output
    -h, --help            Show this help message

EXAMPLES:
    ${SCRIPT_NAME} "User authentication with OAuth2 support"
    ${SCRIPT_NAME} "Payment processing module" --name payment-system
    ${SCRIPT_NAME} "API rate limiting" --tech "Node.js, Redis" --arch microservices

ENVIRONMENT:
    AMAZON_Q_CLI    Path to Amazon Q CLI binary (current: ${AMAZON_Q_CLI})
    KIRO_DIR        Kiro directory path (current: ${KIRO_DIR})

For more information, visit: https://github.com/your-org/amazonq-sdd
EOF
}

# Argument parsing
FEATURE_DESCRIPTION=""
FEATURE_NAME=""
PROJECT_NAME_OVERRIDE=""
OUTPUT_DIR=""
TECHNOLOGY_STACK=""
ARCHITECTURE_TYPE=""
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            FEATURE_NAME="$2"
            shift 2
            ;;
        -p|--project)
            PROJECT_NAME_OVERRIDE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
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
            if [[ -z "$FEATURE_DESCRIPTION" ]]; then
                FEATURE_DESCRIPTION="$1"
            else
                log_error "Too many arguments. Feature description already provided: '$FEATURE_DESCRIPTION'"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validation
if [[ -z "$FEATURE_DESCRIPTION" ]]; then
    log_error "Feature description is required"
    echo "Usage: $SCRIPT_NAME <feature-description> [options]"
    echo "Use --help for more information."
    exit 1
fi

# Set defaults
if [[ -z "$FEATURE_NAME" ]]; then
    # Generate feature name from description (lowercase, replace spaces with hyphens)
    FEATURE_NAME=$(echo "$FEATURE_DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
fi

if [[ -n "$PROJECT_NAME_OVERRIDE" ]]; then
    PROJECT_NAME="$PROJECT_NAME_OVERRIDE"
fi

if [[ -z "$OUTPUT_DIR" ]]; then
    OUTPUT_DIR="${KIRO_DIR}/specs"
fi

# Verbose logging
if [[ "$VERBOSE" == true ]]; then
    log_info "Script: ${SCRIPT_NAME} v${SCRIPT_VERSION}"
    log_info "Feature Description: ${FEATURE_DESCRIPTION}"
    log_info "Feature Name: ${FEATURE_NAME}"
    log_info "Project Name: ${PROJECT_NAME}"
    log_info "Output Directory: ${OUTPUT_DIR}"
    log_info "Amazon Q CLI: ${AMAZON_Q_CLI}"
    [[ -n "$TECHNOLOGY_STACK" ]] && log_info "Technology Stack: ${TECHNOLOGY_STACK}"
    [[ -n "$ARCHITECTURE_TYPE" ]] && log_info "Architecture Type: ${ARCHITECTURE_TYPE}"
fi

# Check prerequisites
log_info "Checking prerequisites..."

# Check Amazon Q CLI
if [[ ! -x "$AMAZON_Q_CLI" ]]; then
    log_error "Amazon Q CLI not found or not executable: $AMAZON_Q_CLI"
    log_error "Please install Amazon Q CLI and update the path"
    exit 1
fi

# Test Amazon Q CLI
if ! "$AMAZON_Q_CLI" --version >/dev/null 2>&1; then
    log_error "Amazon Q CLI is not working properly"
    exit 1
fi

# Check template directory
TEMPLATE_FILE="${TEMPLATE_DIR}/prompts/spec-init.hbs"
if [[ ! -f "$TEMPLATE_FILE" ]]; then
    log_error "Template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Create output directory
if [[ ! -d "$OUTPUT_DIR" ]]; then
    log_info "Creating output directory: $OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"
fi

# Check if feature already exists
FEATURE_DIR="${OUTPUT_DIR}/${FEATURE_NAME}"
if [[ -d "$FEATURE_DIR" ]]; then
    log_warning "Feature directory already exists: $FEATURE_DIR"
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operation cancelled"
        exit 0
    fi
fi

# Build template variables
PROJECT_PATH=$(pwd)
TEMPLATE_VARS="{"
TEMPLATE_VARS+="\"FEATURE_DESCRIPTION\": \"$FEATURE_DESCRIPTION\","
TEMPLATE_VARS+="\"FEATURE_NAME\": \"$FEATURE_NAME\","
TEMPLATE_VARS+="\"PROJECT_NAME\": \"$PROJECT_NAME\","
TEMPLATE_VARS+="\"PROJECT_PATH\": \"$PROJECT_PATH\""

if [[ -n "$TECHNOLOGY_STACK" ]]; then
    TEMPLATE_VARS+=",\"TECHNOLOGY_STACK\": \"$TECHNOLOGY_STACK\""
fi

if [[ -n "$ARCHITECTURE_TYPE" ]]; then
    TEMPLATE_VARS+=",\"ARCHITECTURE_TYPE\": \"$ARCHITECTURE_TYPE\""
fi

TEMPLATE_VARS+="}"

# Generate prompt from template
log_info "Generating prompt from template..."

# Use a simple template processor or call a Node.js script
PROMPT_FILE="/tmp/kiro-spec-init-${FEATURE_NAME}-$$.txt"

# Process template with variables (simplified - in real implementation, use proper template engine)
PROMPT_CONTENT=$(cat "$TEMPLATE_FILE")

# Replace variables
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{FEATURE_DESCRIPTION\}\}/$FEATURE_DESCRIPTION}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{FEATURE_NAME\}\}/$FEATURE_NAME}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{PROJECT_NAME\}\}/$PROJECT_NAME}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{PROJECT_PATH\}\}/$PROJECT_PATH}"

if [[ -n "$TECHNOLOGY_STACK" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TECHNOLOGY_STACK\}\}/$TECHNOLOGY_STACK}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TECHNOLOGY_STACK\}\}/Not specified}"
fi

if [[ -n "$ARCHITECTURE_TYPE" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{ARCHITECTURE_TYPE\}\}/$ARCHITECTURE_TYPE}"
else
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{ARCHITECTURE_TYPE\}\}/Not specified}"
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
log_info "Executing Amazon Q CLI..."

if ! "$AMAZON_Q_CLI" chat --file "$PROMPT_FILE"; then
    log_error "Amazon Q CLI execution failed"
    rm -f "$PROMPT_FILE"
    exit 1
fi

# Clean up
rm -f "$PROMPT_FILE"

log_success "Feature specification initialization completed!"
log_info "Feature: $FEATURE_NAME"
log_info "Next steps:"
log_info "  1. Review the generated specification"
log_info "  2. Run: kiro-spec-requirements $FEATURE_NAME"
log_info "  3. Continue with the SDD workflow"

exit 0