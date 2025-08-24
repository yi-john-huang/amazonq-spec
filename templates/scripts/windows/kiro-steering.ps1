#!/usr/bin/env powershell
<#
.SYNOPSIS
    Create/update project steering documents with Amazon Q CLI

.PARAMETER Project
    Project name override

.PARAMETER TechStack
    Technology stack description

.PARAMETER Architecture
    Architecture type

.PARAMETER TeamSize
    Development team size

.PARAMETER Stage
    Development stage (planning|development|maintenance)

.PARAMETER Challenges
    Known project challenges

.PARAMETER Update
    Update existing steering documents

.PARAMETER DryRun
    Preview the prompt without executing

.PARAMETER Verbose
    Enable verbose output

.PARAMETER Help
    Show help message
#>

param(
    [Parameter()]
    [string]$Project,
    
    [Parameter()]
    [string]$TechStack,
    
    [Parameter()]
    [string]$Architecture,
    
    [Parameter()]
    [string]$TeamSize,
    
    [Parameter()]
    [ValidateSet("planning", "development", "maintenance")]
    [string]$Stage = "development",
    
    [Parameter()]
    [string]$Challenges,
    
    [Parameter()]
    [switch]$Update,
    
    [Parameter()]
    [switch]$DryRun,
    
    [Parameter()]
    [switch]$Verbose,
    
    [Parameter()]
    [switch]$Help
)

$ScriptName = "kiro-steering.ps1"
$AmazonQCLI = "{{AMAZON_Q_CLI_PATH}}"
$KiroDir = "{{KIRO_DIRECTORY}}"
$DefaultProjectName = "{{PROJECT_NAME}}"
$TemplateDir = "{{TEMPLATE_DIRECTORY}}"

$ErrorActionPreference = "Stop"

function Write-Info { param([string]$Message); Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param([string]$Message); Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message); Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message); Write-Host "[ERROR] $Message" -ForegroundColor Red; Write-Error $Message }

function Show-Help {
    Write-Host @"
$ScriptName - Create/update project steering documents with Amazon Q CLI

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
"@
}

if ($Help) { Show-Help; exit 0 }

# Set defaults
if (-not $Project) { $Project = $DefaultProjectName }
$ProjectPath = (Get-Location).Path
$SteeringDirectory = Join-Path $KiroDir "steering"

# Auto-detect technology stack
if (-not $TechStack) {
    $TechIndicators = @()
    if (Test-Path "package.json") { $TechIndicators += "Node.js" }
    if (Test-Path "tsconfig.json") { $TechIndicators += "TypeScript" }
    if (Test-Path "Cargo.toml") { $TechIndicators += "Rust" }
    if (Test-Path "pom.xml") { $TechIndicators += "Java/Maven" }
    if (Test-Path "requirements.txt") { $TechIndicators += "Python" }
    if (Test-Path "go.mod") { $TechIndicators += "Go" }
    if (Test-Path "src/components" -PathType Container) { $TechIndicators += "React/Frontend" }
    
    $TechStack = if ($TechIndicators.Count -gt 0) { $TechIndicators -join ", " } else { "Not auto-detected" }
}

if (-not $TeamSize) { $TeamSize = "Not specified" }
if (-not $Architecture) { $Architecture = "Not specified" }

if ($Verbose) {
    Write-Info "Project: $Project"
    Write-Info "Technology Stack: $TechStack"
    Write-Info "Architecture: $Architecture"
}

# Check prerequisites
Write-Info "Checking prerequisites..."

if (-not (Test-Path $AmazonQCLI -PathType Leaf)) {
    Write-Error "Amazon Q CLI not found: $AmazonQCLI"
    exit 1
}

$TemplateFile = Join-Path $TemplateDir "prompts" "steering.hbs"
if (-not (Test-Path $TemplateFile -PathType Leaf)) {
    Write-Error "Template file not found: $TemplateFile"
    exit 1
}

# Create steering directory
if (-not (Test-Path $SteeringDirectory -PathType Container)) {
    Write-Info "Creating steering directory: $SteeringDirectory"
    New-Item -ItemType Directory -Path $SteeringDirectory -Force | Out-Null
}

# Check for existing steering
$SteeringFiles = @("product.md", "tech.md", "structure.md")
$ExistingSteering = ""

foreach ($file in $SteeringFiles) {
    $SteeringPath = Join-Path $SteeringDirectory $file
    if (Test-Path $SteeringPath -PathType Leaf) {
        $ExistingSteering += "Found: $file`n"
    }
}

if ($ExistingSteering -and -not $Update) {
    Write-Warning "Existing steering documents found:"
    Write-Host $ExistingSteering
    $response = Read-Host "Update existing steering documents? [y/N]"
    if ($response -match '^[Yy]') {
        $Update = $true
    } else {
        Write-Info "Use -Update flag to update existing documents"
    }
}

# Analyze codebase
Write-Info "Analyzing codebase for context..."

$CodebaseSummary = ""
if (Test-Path "README.md") { $CodebaseSummary += "README.md found. " }

# Count file types
$JSFiles = (Get-ChildItem -Recurse -Include "*.js" -Exclude "node_modules" -ErrorAction SilentlyContinue).Count
$TSFiles = (Get-ChildItem -Recurse -Include "*.ts" -Exclude "node_modules" -ErrorAction SilentlyContinue).Count
$PyFiles = (Get-ChildItem -Recurse -Include "*.py" -ErrorAction SilentlyContinue).Count
$JavaFiles = (Get-ChildItem -Recurse -Include "*.java" -ErrorAction SilentlyContinue).Count

if ($JSFiles -gt 0) { $CodebaseSummary += "$JSFiles JavaScript files. " }
if ($TSFiles -gt 0) { $CodebaseSummary += "$TSFiles TypeScript files. " }
if ($PyFiles -gt 0) { $CodebaseSummary += "$PyFiles Python files. " }
if ($JavaFiles -gt 0) { $CodebaseSummary += "$JavaFiles Java files. " }

if (-not $CodebaseSummary) { $CodebaseSummary = "No specific file patterns detected" }

# Analyze structure
$CodePatterns = ""
if (Test-Path "src" -PathType Container) { $CodePatterns += "src/ directory for source code. " }
if ((Test-Path "test" -PathType Container) -or (Test-Path "tests" -PathType Container)) { $CodePatterns += "Dedicated test directory. " }
if (Test-Path "docs" -PathType Container) { $CodePatterns += "Documentation directory. " }
if (Test-Path ".gitignore") { $CodePatterns += "Git version control. " }
if (Test-Path "Dockerfile") { $CodePatterns += "Docker containerization. " }

# Process template
Write-Info "Generating steering prompt from template..."
$PromptContent = Get-Content $TemplateFile -Raw

$PromptContent = $PromptContent -replace '\{\{PROJECT_NAME\}\}', $Project
$PromptContent = $PromptContent -replace '\{\{PROJECT_PATH\}\}', $ProjectPath
$PromptContent = $PromptContent -replace '\{\{STEERING_DIRECTORY\}\}', $SteeringDirectory
$PromptContent = $PromptContent -replace '\{\{TECHNOLOGY_STACK\}\}', $TechStack
$PromptContent = $PromptContent -replace '\{\{ARCHITECTURE_TYPE\}\}', $Architecture
$PromptContent = $PromptContent -replace '\{\{TEAM_SIZE\}\}', $TeamSize
$PromptContent = $PromptContent -replace '\{\{DEVELOPMENT_STAGE\}\}', $Stage
$PromptContent = $PromptContent -replace '\{\{CODEBASE_SUMMARY\}\}', $CodebaseSummary
$PromptContent = $PromptContent -replace '\{\{CODE_PATTERNS\}\}', $CodePatterns

# Handle optional sections
if ($Challenges) {
    $PromptContent = $PromptContent -replace '\{\{PROJECT_CHALLENGES\}\}', $Challenges
} else {
    $PromptContent = $PromptContent -replace '\{\{#if PROJECT_CHALLENGES\}\}[\s\S]*?\{\{/if\}\}', ''
}

if ($ExistingSteering) {
    $PromptContent = $PromptContent -replace '\{\{EXISTING_STEERING\}\}', $ExistingSteering
} else {
    $PromptContent = $PromptContent -replace '\{\{#if EXISTING_STEERING\}\}[\s\S]*?\{\{/if\}\}', ''
}

# Execute
$TempDir = [System.IO.Path]::GetTempPath()
$PromptFile = Join-Path $TempDir "kiro-steering-$($Project -replace '[^a-zA-Z0-9]','_')-$([System.Guid]::NewGuid().ToString('N').Substring(0,8)).txt"
$PromptContent | Out-File -FilePath $PromptFile -Encoding UTF8

if ($DryRun) {
    Write-Info "DRY RUN - Codebase analysis:"
    Write-Host "Technology Stack: $TechStack"
    Write-Host "Codebase Summary: $CodebaseSummary"
    Write-Host "Code Patterns: $CodePatterns"
    Write-Info "Prompt content:"
    Get-Content $PromptFile
    Remove-Item $PromptFile -Force
    exit 0
}

Write-Info "Generating steering documents with Amazon Q CLI..."

try {
    & $AmazonQCLI chat --file $PromptFile
    if ($LASTEXITCODE -ne 0) { throw "Amazon Q CLI failed" }
} catch {
    Write-Error "Amazon Q CLI execution failed: $_"
    exit 1
} finally {
    Remove-Item $PromptFile -Force -ErrorAction SilentlyContinue
}

Write-Success "Steering document generation completed!"
Write-Info "Project: $Project"
Write-Info "Steering directory: $SteeringDirectory"
Write-Info ""
Write-Info "Expected steering documents:"
Write-Info "  - product.md    (Business context and objectives)"
Write-Info "  - tech.md       (Technical architecture and standards)"
Write-Info "  - structure.md  (Project organization and patterns)"

exit 0