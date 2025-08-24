#!/bin/bash
{{!-- 
Kiro Steering Shell Script Template for Unix Systems
Integrates with Amazon Q CLI for project steering documents
--}}

# kiro-steering - Create/update project steering documents with Amazon Q CLI
# Usage: kiro-steering [options]

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Script configuration
SCRIPT_NAME="kiro-steering"
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
${SCRIPT_NAME} - Create/update project steering documents with Amazon Q CLI

USAGE:
    ${SCRIPT_NAME} [OPTIONS]

OPTIONS:
    -p, --project <name>      Project name override (default: ${PROJECT_NAME})
    -t, --tech <stack>        Technology stack description
    -a, --arch <type>         Architecture type
    --team-size <number>      Development team size
    --stage <stage>           Development stage (planning|development|maintenance)
    --challenges <desc>       Known project challenges
    --update                  Update existing steering documents
    --dry-run                Preview the prompt without executing
    -v, --verbose            Enable verbose output
    -h, --help               Show this help message

EXAMPLES:
    ${SCRIPT_NAME}
    ${SCRIPT_NAME} --tech "Node.js, TypeScript, React" --arch microservices
    ${SCRIPT_NAME} --update --challenges "Legacy system integration"

STEERING DOCUMENTS:
    This command creates three core steering documents:
    - product.md      Business context and objectives
    - tech.md         Technical architecture and standards  
    - structure.md    Project organization and patterns

FEATURES:
    - Analyzes current codebase for context
    - Creates comprehensive project guidance
    - Provides AI development context
    - Updates existing steering when needed

ENVIRONMENT:
    AMAZON_Q_CLI    Path to Amazon Q CLI binary (current: ${AMAZON_Q_CLI})
    KIRO_DIR        Kiro directory path (current: ${KIRO_DIR})

EOF
}

# Argument parsing
PROJECT_NAME_OVERRIDE=""
TECHNOLOGY_STACK=""
ARCHITECTURE_TYPE=""
TEAM_SIZE=""
DEVELOPMENT_STAGE=""
PROJECT_CHALLENGES=""
UPDATE_EXISTING=false
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project)
            PROJECT_NAME_OVERRIDE="$2"
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
        --team-size)
            TEAM_SIZE="$2"
            shift 2
            ;;
        --stage)
            DEVELOPMENT_STAGE="$2"
            shift 2
            ;;
        --challenges)
            PROJECT_CHALLENGES="$2"
            shift 2
            ;;
        --update)
            UPDATE_EXISTING=true
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
            log_error "Unexpected argument: $1"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
done

# Set defaults
if [[ -n "$PROJECT_NAME_OVERRIDE" ]]; then
    PROJECT_NAME="$PROJECT_NAME_OVERRIDE"
fi

PROJECT_PATH=$(pwd)
STEERING_DIRECTORY="${KIRO_DIR}/steering"

# Auto-detect technology stack if not provided
if [[ -z "$TECHNOLOGY_STACK" ]]; then
    TECH_INDICATORS=""
    
    [[ -f "package.json" ]] && TECH_INDICATORS+="Node.js, "
    [[ -f "tsconfig.json" ]] && TECH_INDICATORS+="TypeScript, "
    [[ -f "Cargo.toml" ]] && TECH_INDICATORS+="Rust, "
    [[ -f "pom.xml" ]] && TECH_INDICATORS+="Java/Maven, "
    [[ -f "requirements.txt" ]] && TECH_INDICATORS+="Python, "
    [[ -f "go.mod" ]] && TECH_INDICATORS+="Go, "
    [[ -d "src/main/java" ]] && TECH_INDICATORS+="Java, "
    [[ -d "src/components" ]] && TECH_INDICATORS+="React/Frontend, "
    
    TECHNOLOGY_STACK=$(echo "$TECH_INDICATORS" | sed 's/, $//')
    [[ -z "$TECHNOLOGY_STACK" ]] && TECHNOLOGY_STACK="Not auto-detected"
fi

# Set other defaults
[[ -z "$TEAM_SIZE" ]] && TEAM_SIZE="Not specified"
[[ -z "$DEVELOPMENT_STAGE" ]] && DEVELOPMENT_STAGE="development"
[[ -z "$ARCHITECTURE_TYPE" ]] && ARCHITECTURE_TYPE="Not specified"

# Verbose logging
if [[ "$VERBOSE" == true ]]; then
    log_info "Script: ${SCRIPT_NAME} v${SCRIPT_VERSION}"
    log_info "Project Name: ${PROJECT_NAME}"
    log_info "Project Path: ${PROJECT_PATH}"
    log_info "Steering Directory: ${STEERING_DIRECTORY}"
    log_info "Technology Stack: ${TECHNOLOGY_STACK}"
    log_info "Architecture: ${ARCHITECTURE_TYPE}"
    log_info "Team Size: ${TEAM_SIZE}"
    log_info "Development Stage: ${DEVELOPMENT_STAGE}"
    [[ -n "$PROJECT_CHALLENGES" ]] && log_info "Challenges: ${PROJECT_CHALLENGES}"
fi

# Check prerequisites
log_info "Checking prerequisites..."

# Check Amazon Q CLI
if [[ ! -x "$AMAZON_Q_CLI" ]]; then
    log_error "Amazon Q CLI not found or not executable: $AMAZON_Q_CLI"
    exit 1
fi

# Check template file
TEMPLATE_FILE="${TEMPLATE_DIR}/prompts/steering.hbs"
if [[ ! -f "$TEMPLATE_FILE" ]]; then
    log_error "Template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Create steering directory if it doesn't exist
if [[ ! -d "$STEERING_DIRECTORY" ]]; then
    log_info "Creating steering directory: $STEERING_DIRECTORY"
    mkdir -p "$STEERING_DIRECTORY"
fi

# Check for existing steering documents
EXISTING_STEERING=""
STEERING_FILES=("product.md" "tech.md" "structure.md")

for file in "${STEERING_FILES[@]}"; do
    STEERING_PATH="${STEERING_DIRECTORY}/${file}"
    if [[ -f "$STEERING_PATH" ]]; then
        EXISTING_STEERING+="Found: $file\n"
    fi
done

if [[ -n "$EXISTING_STEERING" && "$UPDATE_EXISTING" != true ]]; then
    log_warning "Existing steering documents found:"
    echo -e "$EXISTING_STEERING"
    read -p "Update existing steering documents? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        UPDATE_EXISTING=true
    else
        log_info "Use --update flag to update existing documents"
    fi
fi

# Analyze current codebase
log_info "Analyzing codebase for context..."

# Get codebase summary
CODEBASE_SUMMARY=""
if [[ -f "README.md" ]]; then
    CODEBASE_SUMMARY+="README.md found. "
fi

# Count file types
JS_FILES=$(find . -name "*.js" -not -path "./node_modules/*" 2>/dev/null | wc -l || echo "0")
TS_FILES=$(find . -name "*.ts" -not -path "./node_modules/*" 2>/dev/null | wc -l || echo "0")
PY_FILES=$(find . -name "*.py" 2>/dev/null | wc -l || echo "0")
JAVA_FILES=$(find . -name "*.java" 2>/dev/null | wc -l || echo "0")

if [[ "$JS_FILES" -gt 0 ]]; then
    CODEBASE_SUMMARY+="$JS_FILES JavaScript files. "
fi
if [[ "$TS_FILES" -gt 0 ]]; then
    CODEBASE_SUMMARY+="$TS_FILES TypeScript files. "
fi
if [[ "$PY_FILES" -gt 0 ]]; then
    CODEBASE_SUMMARY+="$PY_FILES Python files. "
fi
if [[ "$JAVA_FILES" -gt 0 ]]; then
    CODEBASE_SUMMARY+="$JAVA_FILES Java files. "
fi

[[ -z "$CODEBASE_SUMMARY" ]] && CODEBASE_SUMMARY="No specific file patterns detected"

# Analyze directory structure
CODE_PATTERNS=""
[[ -d "src/" ]] && CODE_PATTERNS+="src/ directory for source code. "
[[ -d "test/" || -d "tests/" ]] && CODE_PATTERNS+="Dedicated test directory. "
[[ -d "docs/" ]] && CODE_PATTERNS+="Documentation directory. "
[[ -d "scripts/" ]] && CODE_PATTERNS+="Scripts directory. "
[[ -f ".gitignore" ]] && CODE_PATTERNS+="Git version control. "
[[ -f "Dockerfile" ]] && CODE_PATTERNS+="Docker containerization. "

# Generate prompt from template
log_info "Generating steering prompt from template..."

PROMPT_FILE="/tmp/kiro-steering-${PROJECT_NAME//[^a-zA-Z0-9]/_}-$$.txt"
PROMPT_CONTENT=$(cat "$TEMPLATE_FILE")

# Replace variables
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{PROJECT_NAME\}\}/$PROJECT_NAME}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{PROJECT_PATH\}\}/$PROJECT_PATH}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{STEERING_DIRECTORY\}\}/$STEERING_DIRECTORY}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TECHNOLOGY_STACK\}\}/$TECHNOLOGY_STACK}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{ARCHITECTURE_TYPE\}\}/$ARCHITECTURE_TYPE}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{TEAM_SIZE\}\}/$TEAM_SIZE}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{DEVELOPMENT_STAGE\}\}/$DEVELOPMENT_STAGE}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{CODEBASE_SUMMARY\}\}/$CODEBASE_SUMMARY}"
PROMPT_CONTENT="${PROMPT_CONTENT//\{\{CODE_PATTERNS\}\}/$CODE_PATTERNS}"

# Handle optional sections
if [[ -n "$PROJECT_CHALLENGES" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{PROJECT_CHALLENGES\}\}/$PROJECT_CHALLENGES}"
else
    # Remove the conditional block if no challenges
    PROMPT_CONTENT=$(echo "$PROMPT_CONTENT" | sed '/{{#if PROJECT_CHALLENGES}}/,/{{\/if}}/d')
fi

if [[ -n "$EXISTING_STEERING" ]]; then
    PROMPT_CONTENT="${PROMPT_CONTENT//\{\{EXISTING_STEERING\}\}/$EXISTING_STEERING}"
else
    # Remove the conditional block if no existing steering
    PROMPT_CONTENT=$(echo "$PROMPT_CONTENT" | sed '/{{#if EXISTING_STEERING}}/,/{{\/if}}/d')
fi

echo "$PROMPT_CONTENT" > "$PROMPT_FILE"

if [[ "$DRY_RUN" == true ]]; then
    log_info "DRY RUN - Codebase analysis:"
    echo "Technology Stack: $TECHNOLOGY_STACK"
    echo "Codebase Summary: $CODEBASE_SUMMARY"
    echo "Code Patterns: $CODE_PATTERNS"
    echo "----------------------------------------"
    log_info "Prompt content:"
    echo "----------------------------------------"
    cat "$PROMPT_FILE"
    echo "----------------------------------------"
    log_info "Would execute: $AMAZON_Q_CLI chat --file \"$PROMPT_FILE\""
    rm -f "$PROMPT_FILE"
    exit 0
fi

# Execute with Amazon Q CLI
log_info "Generating steering documents with Amazon Q CLI..."

if ! "$AMAZON_Q_CLI" chat --file "$PROMPT_FILE"; then
    log_error "Amazon Q CLI execution failed"
    rm -f "$PROMPT_FILE"
    exit 1
fi

# Clean up
rm -f "$PROMPT_FILE"

log_success "Steering document generation completed!"
log_info "Project: $PROJECT_NAME"
log_info "Steering directory: $STEERING_DIRECTORY"
log_info ""
log_info "Expected steering documents:"
log_info "  - product.md    (Business context and objectives)"
log_info "  - tech.md       (Technical architecture and standards)"
log_info "  - structure.md  (Project organization and patterns)"
log_info ""
log_info "These documents will guide AI development work on your project."

exit 0