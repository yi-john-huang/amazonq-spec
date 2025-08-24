#!/usr/bin/env powershell
<#
.SYNOPSIS
    Check feature specification status with Amazon Q CLI

.PARAMETER FeatureName
    Name of the feature to check status for

.PARAMETER Issues
    Known issues to address in analysis

.PARAMETER Concerns
    Team concerns to consider

.PARAMETER Timeline
    Timeline constraints to factor in

.PARAMETER Detailed
    Show detailed file analysis

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
    [string]$Issues,
    
    [Parameter()]
    [string]$Concerns,
    
    [Parameter()]
    [string]$Timeline,
    
    [Parameter()]
    [switch]$Detailed,
    
    [Parameter()]
    [switch]$DryRun,
    
    [Parameter()]
    [switch]$Verbose,
    
    [Parameter()]
    [switch]$Help
)

$ScriptName = "kiro-spec-status.ps1"
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
$ScriptName - Check feature specification status with Amazon Q CLI

FEATURES:
    - Analyzes completion status of all SDD phases
    - Validates document quality and workflow compliance
    - Identifies gaps and missing elements
    - Provides next steps recommendations
    - Checks traceability between specification phases
"@
}

if ($Help) { Show-Help; exit 0 }

$SpecDirectory = Join-Path $KiroDir "specs" $FeatureName
$SpecPath = Join-Path $SpecDirectory "specification.md"
$RequirementsPath = Join-Path $SpecDirectory "requirements.md"
$DesignPath = Join-Path $SpecDirectory "design.md"
$TasksPath = Join-Path $SpecDirectory "tasks.md"

if ($Verbose) {
    Write-Info "Feature Name: $FeatureName"
    Write-Info "Spec Directory: $SpecDirectory"
}

# Check prerequisites
Write-Info "Checking prerequisites..."

if (-not (Test-Path $AmazonQCLI -PathType Leaf)) {
    Write-Error "Amazon Q CLI not found: $AmazonQCLI"
    exit 1
}

$TemplateFile = Join-Path $TemplateDir "prompts" "spec-status.hbs"
if (-not (Test-Path $TemplateFile -PathType Leaf)) {
    Write-Error "Template file not found: $TemplateFile"
    exit 1
}

if (-not (Test-Path $SpecDirectory -PathType Container)) {
    Write-Error "Feature directory not found: $SpecDirectory"
    Write-Error "Please run kiro-spec-init first"
    exit 1
}

# Analyze file status
Write-Info "Analyzing specification state..."
$FileStatus = ""

if (Test-Path $SpecPath -PathType Leaf) {
    $SpecSize = (Get-Content $SpecPath).Count
    $FileStatus += "✓ Specification: $SpecPath ($SpecSize lines)`n"
    if ($Detailed) { Write-Info "  - Specification found with $SpecSize lines" }
} else {
    $FileStatus += "✗ Specification: Missing`n"
    if ($Detailed) { Write-Warning "  - Specification file not found" }
}

if (Test-Path $RequirementsPath -PathType Leaf) {
    $ReqSize = (Get-Content $RequirementsPath).Count
    $FileStatus += "✓ Requirements: $RequirementsPath ($ReqSize lines)`n"
    if ($Detailed) { Write-Info "  - Requirements found with $ReqSize lines" }
} else {
    $FileStatus += "✗ Requirements: Missing`n"
    if ($Detailed) { Write-Warning "  - Requirements file not found" }
}

if (Test-Path $DesignPath -PathType Leaf) {
    $DesignSize = (Get-Content $DesignPath).Count
    $FileStatus += "✓ Design: $DesignPath ($DesignSize lines)`n"
    if ($Detailed) { Write-Info "  - Design found with $DesignSize lines" }
} else {
    $FileStatus += "✗ Design: Missing`n"
    if ($Detailed) { Write-Warning "  - Design file not found" }
}

if (Test-Path $TasksPath -PathType Leaf) {
    $TasksSize = (Get-Content $TasksPath).Count
    $FileStatus += "✓ Tasks: $TasksPath ($TasksSize lines)`n"
    if ($Detailed) { Write-Info "  - Tasks found with $TasksSize lines" }
} else {
    $FileStatus += "✗ Tasks: Missing`n"
    if ($Detailed) { Write-Warning "  - Tasks file not found" }
}

# Process template
Write-Info "Generating status analysis prompt from template..."
$PromptContent = Get-Content $TemplateFile -Raw

$PromptContent = $PromptContent -replace '\{\{FEATURE_NAME\}\}', $FeatureName
$PromptContent = $PromptContent -replace '\{\{PROJECT_NAME\}\}', $DefaultProjectName
$PromptContent = $PromptContent -replace '\{\{SPEC_DIRECTORY\}\}', $SpecDirectory

# Handle file paths
if (Test-Path $SpecPath) { $PromptContent = $PromptContent -replace '\{\{SPEC_PATH\}\}', $SpecPath }
else { $PromptContent = $PromptContent -replace '\{\{SPEC_PATH\}\}', 'Not found' }

if (Test-Path $RequirementsPath) { $PromptContent = $PromptContent -replace '\{\{REQUIREMENTS_PATH\}\}', $RequirementsPath }
else { $PromptContent = $PromptContent -replace '\{\{REQUIREMENTS_PATH\}\}', 'Not found' }

if (Test-Path $DesignPath) { $PromptContent = $PromptContent -replace '\{\{DESIGN_PATH\}\}', $DesignPath }
else { $PromptContent = $PromptContent -replace '\{\{DESIGN_PATH\}\}', 'Not found' }

if (Test-Path $TasksPath) { $PromptContent = $PromptContent -replace '\{\{TASKS_PATH\}\}', $TasksPath }
else { $PromptContent = $PromptContent -replace '\{\{TASKS_PATH\}\}', 'Not found' }

# Handle optional context
if ($Issues) {
    $PromptContent = $PromptContent -replace '\{\{CURRENT_ISSUES\}\}', $Issues
} else {
    $PromptContent = $PromptContent -replace '\{\{#if CURRENT_ISSUES\}\}[\s\S]*?\{\{/if\}\}', ''
}

if ($Concerns) {
    $PromptContent = $PromptContent -replace '\{\{TEAM_CONCERNS\}\}', $Concerns
} else {
    $PromptContent = $PromptContent -replace '\{\{#if TEAM_CONCERNS\}\}[\s\S]*?\{\{/if\}\}', ''
}

if ($Timeline) {
    $PromptContent = $PromptContent -replace '\{\{TIMELINE_CONSTRAINTS\}\}', $Timeline
} else {
    $PromptContent = $PromptContent -replace '\{\{#if TIMELINE_CONSTRAINTS\}\}[\s\S]*?\{\{/if\}\}', ''
}

# Create temp file
$TempDir = [System.IO.Path]::GetTempPath()
$PromptFile = Join-Path $TempDir "kiro-spec-status-$FeatureName-$([System.Guid]::NewGuid().ToString('N').Substring(0,8)).txt"
$PromptContent | Out-File -FilePath $PromptFile -Encoding UTF8

# Add file status to prompt
Add-Content -Path $PromptFile -Value "`n## Current File Status Analysis"
Add-Content -Path $PromptFile -Value $FileStatus

if ($DryRun) {
    Write-Info "DRY RUN - Current file status:"
    Write-Host $FileStatus
    Write-Info "Prompt content:"
    Get-Content $PromptFile
    Remove-Item $PromptFile -Force
    exit 0
}

# Show status before analysis
Write-Info "Current specification status:"
Write-Host $FileStatus

Write-Info "Analyzing specification status with Amazon Q CLI..."

try {
    & $AmazonQCLI chat --file $PromptFile
    if ($LASTEXITCODE -ne 0) { throw "Amazon Q CLI failed" }
} catch {
    Write-Error "Amazon Q CLI execution failed: $_"
    exit 1
} finally {
    Remove-Item $PromptFile -Force -ErrorAction SilentlyContinue
}

Write-Success "Status analysis completed!"

exit 0