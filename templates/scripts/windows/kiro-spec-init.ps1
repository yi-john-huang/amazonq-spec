#!/usr/bin/env powershell
<#
.SYNOPSIS
    Kiro Spec Init PowerShell Script Template for Windows Systems
    Integrates with Amazon Q CLI for feature specification initialization

.DESCRIPTION
    kiro-spec-init - Initialize feature specification with Amazon Q CLI
    Usage: kiro-spec-init.ps1 <feature-description> [options]

.PARAMETER FeatureDescription
    Detailed description of the feature to initialize

.PARAMETER Name
    Feature name (default: auto-generated from description)

.PARAMETER Project
    Project name (default: {{PROJECT_NAME}})

.PARAMETER Output
    Output directory (default: {{KIRO_DIRECTORY}}/specs)

.PARAMETER TechStack
    Technology stack

.PARAMETER Architecture
    Architecture type

.PARAMETER DryRun
    Preview the prompt without executing

.PARAMETER Verbose
    Enable verbose output

.PARAMETER Help
    Show help message

.EXAMPLE
    .\kiro-spec-init.ps1 "User authentication with OAuth2 support"

.EXAMPLE
    .\kiro-spec-init.ps1 "Payment processing module" -Name "payment-system"

.EXAMPLE
    .\kiro-spec-init.ps1 "API rate limiting" -TechStack "Node.js, Redis" -Architecture "microservices"
#>

param(
    [Parameter(Position=0, Mandatory=$true)]
    [string]$FeatureDescription,
    
    [Parameter()]
    [string]$Name,
    
    [Parameter()]
    [string]$Project,
    
    [Parameter()]
    [string]$Output,
    
    [Parameter()]
    [string]$TechStack,
    
    [Parameter()]
    [string]$Architecture,
    
    [Parameter()]
    [switch]$DryRun,
    
    [Parameter()]
    [switch]$Verbose,
    
    [Parameter()]
    [switch]$Help
)

# Script configuration
$ScriptName = "kiro-spec-init.ps1"
$ScriptVersion = "1.0.0"
$AmazonQCLI = "{{AMAZON_Q_CLI_PATH}}"
$KiroDir = "{{KIRO_DIRECTORY}}"
$DefaultProjectName = "{{PROJECT_NAME}}"
$TemplateDir = "{{TEMPLATE_DIRECTORY}}"

# Set error handling
$ErrorActionPreference = "Stop"

# Logging functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    Write-Error $Message
}

# Help function
function Show-Help {
    Write-Host @"
$ScriptName - Initialize feature specification with Amazon Q CLI

USAGE:
    .\$ScriptName <feature-description> [OPTIONS]

PARAMETERS:
    -FeatureDescription <string>  Detailed description of the feature to initialize
    -Name <string>               Feature name (default: auto-generated from description)
    -Project <string>            Project name (default: $DefaultProjectName)
    -Output <string>             Output directory (default: $KiroDir/specs)
    -TechStack <string>          Technology stack
    -Architecture <string>       Architecture type
    -DryRun                      Preview the prompt without executing
    -Verbose                     Enable verbose output
    -Help                        Show this help message

EXAMPLES:
    .\$ScriptName "User authentication with OAuth2 support"
    .\$ScriptName "Payment processing module" -Name "payment-system"
    .\$ScriptName "API rate limiting" -TechStack "Node.js, Redis" -Architecture "microservices"

ENVIRONMENT:
    AMAZON_Q_CLI    Path to Amazon Q CLI binary (current: $AmazonQCLI)
    KIRO_DIR        Kiro directory path (current: $KiroDir)

For more information, visit: https://github.com/your-org/amazonq-sdd
"@
}

# Show help if requested
if ($Help) {
    Show-Help
    exit 0
}

# Set defaults
if (-not $Project) { $Project = $DefaultProjectName }
if (-not $Output) { $Output = Join-Path $KiroDir "specs" }

# Generate feature name if not provided
if (-not $Name) {
    $Name = $FeatureDescription.ToLower() -replace '[^a-z0-9]', '-' -replace '--+', '-' -replace '^-|-$', ''
}

# Verbose logging
if ($Verbose) {
    Write-Info "Script: $ScriptName v$ScriptVersion"
    Write-Info "Feature Description: $FeatureDescription"
    Write-Info "Feature Name: $Name"
    Write-Info "Project Name: $Project"
    Write-Info "Output Directory: $Output"
    Write-Info "Amazon Q CLI: $AmazonQCLI"
    if ($TechStack) { Write-Info "Technology Stack: $TechStack" }
    if ($Architecture) { Write-Info "Architecture Type: $Architecture" }
}

# Check prerequisites
Write-Info "Checking prerequisites..."

# Check Amazon Q CLI
if (-not (Test-Path $AmazonQCLI -PathType Leaf)) {
    Write-Error "Amazon Q CLI not found: $AmazonQCLI"
    Write-Error "Please install Amazon Q CLI and update the path"
    exit 1
}

# Test Amazon Q CLI
try {
    & $AmazonQCLI --version | Out-Null
} catch {
    Write-Error "Amazon Q CLI is not working properly"
    exit 1
}

# Check template directory
$TemplateFile = Join-Path $TemplateDir "prompts" "spec-init.hbs"
if (-not (Test-Path $TemplateFile -PathType Leaf)) {
    Write-Error "Template file not found: $TemplateFile"
    exit 1
}

# Create output directory
if (-not (Test-Path $Output -PathType Container)) {
    Write-Info "Creating output directory: $Output"
    New-Item -ItemType Directory -Path $Output -Force | Out-Null
}

# Check if feature already exists
$FeatureDir = Join-Path $Output $Name
if (Test-Path $FeatureDir -PathType Container) {
    Write-Warning "Feature directory already exists: $FeatureDir"
    $response = Read-Host "Continue anyway? [y/N]"
    if ($response -notmatch '^[Yy]$') {
        Write-Info "Operation cancelled"
        exit 0
    }
}

# Read template file
Write-Info "Generating prompt from template..."
$PromptContent = Get-Content $TemplateFile -Raw

# Replace variables
$ProjectPath = (Get-Location).Path
$PromptContent = $PromptContent -replace '\{\{FEATURE_DESCRIPTION\}\}', $FeatureDescription
$PromptContent = $PromptContent -replace '\{\{FEATURE_NAME\}\}', $Name
$PromptContent = $PromptContent -replace '\{\{PROJECT_NAME\}\}', $Project
$PromptContent = $PromptContent -replace '\{\{PROJECT_PATH\}\}', $ProjectPath

if ($TechStack) {
    $PromptContent = $PromptContent -replace '\{\{TECHNOLOGY_STACK\}\}', $TechStack
} else {
    $PromptContent = $PromptContent -replace '\{\{TECHNOLOGY_STACK\}\}', 'Not specified'
}

if ($Architecture) {
    $PromptContent = $PromptContent -replace '\{\{ARCHITECTURE_TYPE\}\}', $Architecture
} else {
    $PromptContent = $PromptContent -replace '\{\{ARCHITECTURE_TYPE\}\}', 'Not specified'
}

# Create temporary prompt file
$TempDir = [System.IO.Path]::GetTempPath()
$PromptFile = Join-Path $TempDir "kiro-spec-init-$Name-$([System.Guid]::NewGuid().ToString('N').Substring(0,8)).txt"
$PromptContent | Out-File -FilePath $PromptFile -Encoding UTF8

if ($DryRun) {
    Write-Info "DRY RUN - Prompt content:"
    Write-Host "----------------------------------------"
    Get-Content $PromptFile
    Write-Host "----------------------------------------"
    Write-Info "Would execute: $AmazonQCLI chat --file `"$PromptFile`""
    Remove-Item $PromptFile -Force
    exit 0
}

# Execute with Amazon Q CLI
Write-Info "Executing Amazon Q CLI..."

try {
    & $AmazonQCLI chat --file $PromptFile
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "Amazon Q CLI exited with code $exitCode"
    }
} catch {
    Write-Error "Amazon Q CLI execution failed: $_"
    Remove-Item $PromptFile -Force -ErrorAction SilentlyContinue
    exit 1
} finally {
    # Clean up
    Remove-Item $PromptFile -Force -ErrorAction SilentlyContinue
}

Write-Success "Feature specification initialization completed!"
Write-Info "Feature: $Name"
Write-Info "Next steps:"
Write-Info "  1. Review the generated specification"
Write-Info "  2. Run: .\kiro-spec-requirements.ps1 $Name"
Write-Info "  3. Continue with the SDD workflow"

exit 0