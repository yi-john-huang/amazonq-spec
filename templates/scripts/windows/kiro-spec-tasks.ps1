#!/usr/bin/env powershell
<#
.SYNOPSIS
    Generate implementation task breakdown with Amazon Q CLI

.PARAMETER FeatureName
    Name of the feature to generate tasks for

.PARAMETER DesignPath
    Path to design document

.PARAMETER TeamSize
    Team size

.PARAMETER Timeline
    Project timeline

.PARAMETER Complexity
    Complexity level (low|medium|high)

.PARAMETER Approved
    Skip design approval confirmation

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
    [string]$DesignPath,
    
    [Parameter()]
    [string]$TeamSize = "1",
    
    [Parameter()]
    [string]$Timeline,
    
    [Parameter()]
    [ValidateSet("low", "medium", "high")]
    [string]$Complexity = "medium",
    
    [Parameter()]
    [switch]$Approved,
    
    [Parameter()]
    [switch]$DryRun,
    
    [Parameter()]
    [switch]$Verbose,
    
    [Parameter()]
    [switch]$Help
)

$ScriptName = "kiro-spec-tasks.ps1"
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
$ScriptName - Generate implementation task breakdown with Amazon Q CLI

WORKFLOW:
    This command implements the SDD approval gate:
    - Confirms both requirements AND design have been approved
    - Only proceeds with task breakdown if prerequisites are met
    - Follows the Requirements → Design → Tasks → Implementation workflow
"@
}

if ($Help) { Show-Help; exit 0 }

$SpecPath = Join-Path $KiroDir "specs" $FeatureName
$RequirementsPath = Join-Path $SpecPath "requirements.md"
if (-not $DesignPath) { $DesignPath = Join-Path $SpecPath "design.md" }

if ($Verbose) {
    Write-Info "Feature Name: $FeatureName"
    Write-Info "Team Size: $TeamSize"
    Write-Info "Complexity: $Complexity"
}

# Check prerequisites
Write-Info "Checking prerequisites..."

if (-not (Test-Path $AmazonQCLI -PathType Leaf)) {
    Write-Error "Amazon Q CLI not found: $AmazonQCLI"
    exit 1
}

$TemplateFile = Join-Path $TemplateDir "prompts" "spec-tasks.hbs"
if (-not (Test-Path $TemplateFile -PathType Leaf)) {
    Write-Error "Template file not found: $TemplateFile"
    exit 1
}

if (-not (Test-Path $RequirementsPath -PathType Leaf)) {
    Write-Error "Requirements file not found: $RequirementsPath"
    Write-Error "Please run kiro-spec-requirements first"
    exit 1
}

if (-not (Test-Path $DesignPath -PathType Leaf)) {
    Write-Error "Design file not found: $DesignPath"
    Write-Error "Please run kiro-spec-design first"
    exit 1
}

# Design approval gate
if (-not $Approved) {
    Write-Host ""
    Write-Warning "SDD Workflow Checkpoint: Requirements & Design Review"
    Write-Host "Before proceeding with task breakdown, both requirements AND design must be approved."
    Write-Host ""
    Write-Host "Requirements file: $RequirementsPath"
    Write-Host "Design file:       $DesignPath"
    Write-Host ""
    
    do {
        $response = Read-Host "Have you reviewed and approved BOTH requirements and design documents? [y/N]"
        if ($response -match '^[Yy]') {
            $Approved = $true
            Write-Success "Requirements and design approved. Proceeding with task breakdown..."
            break
        } elseif ($response -match '^[Nn]' -or $response -eq '') {
            Write-Info "Please review and approve both documents before proceeding."
            exit 0
        } else {
            Write-Host "Please answer yes (y) or no (n)."
        }
    } while ($true)
}

# Read design summary
$DesignSummary = "See full design document"
if (Test-Path $DesignPath) {
    $DesignSummary = ((Get-Content $DesignPath | Where-Object { $_ -match '^##' }) -join '; ')
}

# Detect development environment
$DevEnvironment = "Standard development environment"
if (Test-Path "package.json") { $DevEnvironment = "Node.js/npm environment" }
elseif (Test-Path "Cargo.toml") { $DevEnvironment = "Rust/Cargo environment" }
elseif (Test-Path "pom.xml") { $DevEnvironment = "Java/Maven environment" }

# Process template
Write-Info "Generating task breakdown prompt from template..."
$PromptContent = Get-Content $TemplateFile -Raw

$PromptContent = $PromptContent -replace '\{\{FEATURE_NAME\}\}', $FeatureName
$PromptContent = $PromptContent -replace '\{\{PROJECT_NAME\}\}', $DefaultProjectName
$PromptContent = $PromptContent -replace '\{\{SPEC_PATH\}\}', $SpecPath
$PromptContent = $PromptContent -replace '\{\{REQUIREMENTS_PATH\}\}', $RequirementsPath
$PromptContent = $PromptContent -replace '\{\{DESIGN_PATH\}\}', $DesignPath
$PromptContent = $PromptContent -replace '\{\{DESIGN_SUMMARY\}\}', $DesignSummary
$PromptContent = $PromptContent -replace '\{\{DEV_ENVIRONMENT\}\}', $DevEnvironment
$PromptContent = $PromptContent -replace '\{\{TEAM_SIZE\}\}', $TeamSize
$PromptContent = $PromptContent -replace '\{\{COMPLEXITY_LEVEL\}\}', $Complexity

if ($Timeline) {
    $PromptContent = $PromptContent -replace '\{\{TIMELINE\}\}', $Timeline
} else {
    $PromptContent = $PromptContent -replace '\{\{TIMELINE\}\}', 'Not specified'
}

# Handle approval conditional
if ($Approved) {
    $PromptContent = $PromptContent -replace '\{\{#if DESIGN_APPROVED\}\}', ''
    $PromptContent = $PromptContent -replace '\{\{/if\}\}', ''
    $PromptContent = $PromptContent -replace '\{\{#else\}\}', '<!-- ELSE START'
    $PromptContent = $PromptContent -replace '\{\{else\}\}', 'ELSE END -->'
} else {
    $PromptContent = $PromptContent -replace '\{\{#if DESIGN_APPROVED\}\}', '<!-- IF START'
    $PromptContent = $PromptContent -replace '\{\{#else\}\}', 'IF END -->'
    $PromptContent = $PromptContent -replace '\{\{else\}\}', '<!-- ELSE START'
    $PromptContent = $PromptContent -replace '\{\{/if\}\}', 'ELSE END -->'
}

# Execute
$TempDir = [System.IO.Path]::GetTempPath()
$PromptFile = Join-Path $TempDir "kiro-spec-tasks-$FeatureName-$([System.Guid]::NewGuid().ToString('N').Substring(0,8)).txt"
$PromptContent | Out-File -FilePath $PromptFile -Encoding UTF8

if ($DryRun) {
    Write-Info "DRY RUN - Prompt content:"
    Get-Content $PromptFile
    Remove-Item $PromptFile -Force
    exit 0
}

Write-Info "Generating task breakdown with Amazon Q CLI..."

try {
    & $AmazonQCLI chat --file $PromptFile
    if ($LASTEXITCODE -ne 0) { throw "Amazon Q CLI failed" }
} catch {
    Write-Error "Amazon Q CLI execution failed: $_"
    exit 1
} finally {
    Remove-Item $PromptFile -Force -ErrorAction SilentlyContinue
}

Write-Success "Task breakdown generation completed!"
Write-Info "Next steps: Review tasks and begin implementation"

exit 0