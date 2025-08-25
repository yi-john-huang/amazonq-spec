#!/usr/bin/env powershell
<#
.SYNOPSIS
    Generate feature requirements with Amazon Q CLI

.PARAMETER FeatureName
    Name of the feature to generate requirements for

.PARAMETER Details
    Additional feature details

.PARAMETER SpecPath
    Path to existing specification file

.PARAMETER Project
    Project name override

.PARAMETER ExistingSpec
    Indicates an existing spec file should be referenced

.PARAMETER DryRun
    Preview the prompt without executing

.PARAMETER Verbose
    Enable verbose output

.PARAMETER Help
    Show help message
#>

param(
    [Parameter(Position=0, Mandatory=$true)]
    [string]$FeatureName,
    
    [Parameter()]
    [string]$Details,
    
    [Parameter()]
    [string]$SpecPath,
    
    [Parameter()]
    [string]$Project,
    
    [Parameter()]
    [switch]$ExistingSpec,
    
    [Parameter()]
    [switch]$DryRun,
    
    [Parameter()]
    [switch]$Verbose,
    
    [Parameter()]
    [switch]$Help
)

# Script configuration
$ScriptName = "kiro-spec-requirements.ps1"
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
$ScriptName - Generate feature requirements with Amazon Q CLI

USAGE:
    .\$ScriptName <feature-name> [OPTIONS]

PARAMETERS:
    -FeatureName <string>    Name of the feature to generate requirements for
    -Details <string>        Additional feature details
    -SpecPath <string>       Path to existing specification file
    -Project <string>        Project name override
    -ExistingSpec           Indicates an existing spec file should be referenced
    -DryRun                 Preview the prompt without executing
    -Verbose                Enable verbose output
    -Help                   Show help message

EXAMPLES:
    .\$ScriptName user-authentication
    .\$ScriptName payment-system -Details "Support for multiple payment gateways"
"@
}

if ($Help) { Show-Help; exit 0 }

# Set defaults
if (-not $Project) { $Project = $DefaultProjectName }
if (-not $SpecPath) { $SpecPath = Join-Path $KiroDir "specs" $FeatureName }

# Verbose logging
if ($Verbose) {
    Write-Info "Feature Name: $FeatureName"
    Write-Info "Project Name: $Project"
    Write-Info "Spec Path: $SpecPath"
}

# Check prerequisites
Write-Info "Checking prerequisites..."

if (-not (Test-Path $AmazonQCLI -PathType Leaf)) {
    Write-Error "Amazon Q CLI not found: $AmazonQCLI"
    exit 1
}

$TemplateFile = Join-Path $TemplateDir "prompts" "spec-requirements.hbs"
if (-not (Test-Path $TemplateFile -PathType Leaf)) {
    Write-Error "Template file not found: $TemplateFile"
    exit 1
}

if (-not (Test-Path $SpecPath -PathType Container)) {
    Write-Error "Feature directory not found: $SpecPath"
    Write-Error "Please run kiro-spec-init first"
    exit 1
}

# Check for existing specification
$SpecFile = Join-Path $SpecPath "specification.md"
$RequirementsFile = Join-Path $SpecPath "requirements.md"

if (Test-Path $SpecFile -PathType Leaf) {
    $ExistingSpec = $true
    Write-Info "Found existing specification: $SpecFile"
}

if (Test-Path $RequirementsFile -PathType Leaf) {
    Write-Warning "Requirements file already exists: $RequirementsFile"
    $response = Read-Host "Overwrite existing requirements? [y/N]"
    if ($response -notmatch '^[Yy]$') {
        Write-Info "Operation cancelled"
        exit 0
    }
}

# Process template
Write-Info "Generating requirements prompt from template..."
$PromptContent = Get-Content $TemplateFile -Raw

# Replace variables
$PromptContent = $PromptContent -replace '\{\{FEATURE_NAME\}\}', $FeatureName
$PromptContent = $PromptContent -replace '\{\{PROJECT_NAME\}\}', $Project
$PromptContent = $PromptContent -replace '\{\{SPEC_PATH\}\}', $SpecPath

if ($Details) {
    $PromptContent = $PromptContent -replace '\{\{FEATURE_DETAILS\}\}', $Details
} else {
    $PromptContent = $PromptContent -replace '\{\{FEATURE_DETAILS\}\}', 'See existing specification for details'
}

# Handle conditional sections for existing spec
if ($ExistingSpec) {
    $PromptContent = $PromptContent -replace '\{\{#if EXISTING_SPEC\}\}', ''
    $PromptContent = $PromptContent -replace '\{\{/if\}\}', ''
    $PromptContent = $PromptContent -replace '\{\{#else\}\}', '<!-- ELSE START'
    $PromptContent = $PromptContent -replace '\{\{else\}\}', 'ELSE END -->'
} else {
    $PromptContent = $PromptContent -replace '\{\{#if EXISTING_SPEC\}\}', '<!-- IF START'
    $PromptContent = $PromptContent -replace '\{\{#else\}\}', 'IF END -->'
    $PromptContent = $PromptContent -replace '\{\{else\}\}', '<!-- ELSE START'
    $PromptContent = $PromptContent -replace '\{\{/if\}\}', 'ELSE END -->'
}

# Create temp file and execute
$TempDir = [System.IO.Path]::GetTempPath()
$PromptFile = Join-Path $TempDir "kiro-spec-requirements-$FeatureName-$([System.Guid]::NewGuid().ToString('N').Substring(0,8)).txt"
$PromptContent | Out-File -FilePath $PromptFile -Encoding UTF8

if ($DryRun) {
    Write-Info "DRY RUN - Prompt content:"
    Write-Host "----------------------------------------"
    Get-Content $PromptFile
    Write-Host "----------------------------------------"
    Remove-Item $PromptFile -Force
    exit 0
}

Write-Info "Generating requirements with Amazon Q CLI..."

try {
    & $AmazonQCLI chat --file $PromptFile
    if ($LASTEXITCODE -ne 0) { throw "Amazon Q CLI failed" }
} catch {
    Write-Error "Amazon Q CLI execution failed: $_"
    exit 1
} finally {
    Remove-Item $PromptFile -Force -ErrorAction SilentlyContinue
}

Write-Success "Requirements generation completed!"
Write-Info "Next steps: Review requirements and run .\kiro-spec-design.ps1 $FeatureName"

exit 0