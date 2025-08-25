#!/usr/bin/env powershell
<#
.SYNOPSIS
    Create technical design document with Amazon Q CLI

.PARAMETER FeatureName
    Name of the feature to create design for

.PARAMETER RequirementsPath
    Path to requirements file

.PARAMETER TechStack
    Technology stack override

.PARAMETER Architecture
    Architecture type override

.PARAMETER Approved
    Skip requirements approval confirmation

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
    [string]$RequirementsPath,
    
    [Parameter()]
    [string]$TechStack,
    
    [Parameter()]
    [string]$Architecture,
    
    [Parameter()]
    [switch]$Approved,
    
    [Parameter()]
    [switch]$DryRun,
    
    [Parameter()]
    [switch]$Verbose,
    
    [Parameter()]
    [switch]$Help
)

# Script configuration
$ScriptName = "kiro-spec-design.ps1"
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
$ScriptName - Create technical design document with Amazon Q CLI

USAGE:
    .\$ScriptName <feature-name> [OPTIONS]

WORKFLOW:
    This command implements the SDD approval gate:
    - Confirms requirements have been reviewed and approved
    - Only proceeds with design if prerequisites are met
    - Follows the Requirements → Design → Tasks workflow

PARAMETERS:
    -FeatureName <string>        Name of the feature to create design for
    -RequirementsPath <string>   Path to requirements file
    -TechStack <string>          Technology stack override
    -Architecture <string>       Architecture type override
    -Approved                    Skip requirements approval confirmation
    -DryRun                     Preview the prompt without executing
    -Verbose                    Enable verbose output
    -Help                       Show help message
"@
}

if ($Help) { Show-Help; exit 0 }

# Set defaults
$SpecPath = Join-Path $KiroDir "specs" $FeatureName
if (-not $RequirementsPath) { $RequirementsPath = Join-Path $SpecPath "requirements.md" }

if ($Verbose) {
    Write-Info "Feature Name: $FeatureName"
    Write-Info "Requirements Path: $RequirementsPath"
}

# Check prerequisites
Write-Info "Checking prerequisites..."

if (-not (Test-Path $AmazonQCLI -PathType Leaf)) {
    Write-Error "Amazon Q CLI not found: $AmazonQCLI"
    exit 1
}

$TemplateFile = Join-Path $TemplateDir "prompts" "spec-design.hbs"
if (-not (Test-Path $TemplateFile -PathType Leaf)) {
    Write-Error "Template file not found: $TemplateFile"
    exit 1
}

if (-not (Test-Path $SpecPath -PathType Container)) {
    Write-Error "Feature directory not found: $SpecPath"
    Write-Error "Please run kiro-spec-init first"
    exit 1
}

if (-not (Test-Path $RequirementsPath -PathType Leaf)) {
    Write-Error "Requirements file not found: $RequirementsPath"
    Write-Error "Please run kiro-spec-requirements first"
    exit 1
}

# Requirements approval gate
if (-not $Approved) {
    Write-Host ""
    Write-Warning "SDD Workflow Checkpoint: Requirements Review"
    Write-Host "Before proceeding with design, the requirements must be reviewed and approved."
    Write-Host ""
    Write-Host "Requirements file: $RequirementsPath"
    Write-Host ""
    
    do {
        $response = Read-Host "Have you reviewed and approved the requirements document? [y/N]"
        if ($response -match '^[Yy]') {
            $Approved = $true
            Write-Success "Requirements approved. Proceeding with design..."
            break
        } elseif ($response -match '^[Nn]' -or $response -eq '') {
            Write-Info "Please review and approve requirements before proceeding."
            exit 0
        } else {
            Write-Host "Please answer yes (y) or no (n)."
        }
    } while ($true)
}

# Check for existing design
$DesignFile = Join-Path $SpecPath "design.md"
if (Test-Path $DesignFile -PathType Leaf) {
    Write-Warning "Design file already exists: $DesignFile"
    $response = Read-Host "Overwrite existing design? [y/N]"
    if ($response -notmatch '^[Yy]$') {
        Write-Info "Operation cancelled"
        exit 0
    }
}

# Auto-detect technology stack
if (-not $TechStack) {
    $TechStack = "Not specified"
    if (Test-Path "package.json") { $TechStack = "Node.js/JavaScript" }
    elseif (Test-Path "Cargo.toml") { $TechStack = "Rust" }
    elseif (Test-Path "pom.xml") { $TechStack = "Java/Maven" }
    elseif (Test-Path "requirements.txt") { $TechStack = "Python" }
}

if (-not $Architecture) { $Architecture = "Not specified" }

# Read requirements summary
$RequirementsSummary = "See full requirements document"
if (Test-Path $RequirementsPath) {
    $RequirementsSummary = (Get-Content $RequirementsPath | Select-Object -First 10) -join " "
}

# Process template
Write-Info "Generating design prompt from template..."
$PromptContent = Get-Content $TemplateFile -Raw

$PromptContent = $PromptContent -replace '\{\{FEATURE_NAME\}\}', $FeatureName
$PromptContent = $PromptContent -replace '\{\{PROJECT_NAME\}\}', $DefaultProjectName
$PromptContent = $PromptContent -replace '\{\{SPEC_PATH\}\}', $SpecPath
$PromptContent = $PromptContent -replace '\{\{REQUIREMENTS_PATH\}\}', $RequirementsPath
$PromptContent = $PromptContent -replace '\{\{REQUIREMENTS_SUMMARY\}\}', $RequirementsSummary
$PromptContent = $PromptContent -replace '\{\{TECHNOLOGY_STACK\}\}', $TechStack
$PromptContent = $PromptContent -replace '\{\{ARCHITECTURE_TYPE\}\}', $Architecture

# Handle approval conditional
if ($Approved) {
    $PromptContent = $PromptContent -replace '\{\{#if REQUIREMENTS_APPROVED\}\}', ''
    $PromptContent = $PromptContent -replace '\{\{/if\}\}', ''
    $PromptContent = $PromptContent -replace '\{\{#else\}\}', '<!-- ELSE START'
    $PromptContent = $PromptContent -replace '\{\{else\}\}', 'ELSE END -->'
} else {
    $PromptContent = $PromptContent -replace '\{\{#if REQUIREMENTS_APPROVED\}\}', '<!-- IF START'
    $PromptContent = $PromptContent -replace '\{\{#else\}\}', 'IF END -->'
    $PromptContent = $PromptContent -replace '\{\{else\}\}', '<!-- ELSE START'
    $PromptContent = $PromptContent -replace '\{\{/if\}\}', 'ELSE END -->'
}

# Execute
$TempDir = [System.IO.Path]::GetTempPath()
$PromptFile = Join-Path $TempDir "kiro-spec-design-$FeatureName-$([System.Guid]::NewGuid().ToString('N').Substring(0,8)).txt"
$PromptContent | Out-File -FilePath $PromptFile -Encoding UTF8

if ($DryRun) {
    Write-Info "DRY RUN - Prompt content:"
    Write-Host "----------------------------------------"
    Get-Content $PromptFile
    Write-Host "----------------------------------------"
    Remove-Item $PromptFile -Force
    exit 0
}

Write-Info "Generating design with Amazon Q CLI..."

try {
    & $AmazonQCLI chat --file $PromptFile
    if ($LASTEXITCODE -ne 0) { throw "Amazon Q CLI failed" }
} catch {
    Write-Error "Amazon Q CLI execution failed: $_"
    exit 1
} finally {
    Remove-Item $PromptFile -Force -ErrorAction SilentlyContinue
}

Write-Success "Design generation completed!"
Write-Info "Next steps: Review design and run .\kiro-spec-tasks.ps1 $FeatureName"

exit 0