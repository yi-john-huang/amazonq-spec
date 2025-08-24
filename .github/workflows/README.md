# GitHub Actions CI/CD Pipeline

This repository uses GitHub Actions for continuous integration and deployment.

## Workflows

### 1. Auto Tag on Merge
**File**: `.github/workflows/auto-tag.yml`  
**Triggers**: Push to main (when merging from develop)  
**Purpose**: Automatically create version tags

- Detects merges from develop to main
- Automatically increments patch version (z in vX.Y.Z)
- Updates package.json version
- Creates and pushes new tag
- Triggers release workflow

### 2. CI (Continuous Integration)
**File**: `.github/workflows/ci.yml`  
**Triggers**: Push to main/develop, Pull requests to main  
**Purpose**: Run tests, linting, and build validation

- Tests on Node.js 16.x, 18.x, and 20.x
- Cross-platform testing (Ubuntu, Windows, macOS)
- Type checking and linting
- Build validation

### 3. Merge Develop to Main
**File**: `.github/workflows/merge-develop.yml`  
**Triggers**: Manual dispatch, Weekly schedule (optional)  
**Purpose**: Create PR to merge develop into main

- Checks for changes in develop branch
- Creates pull request for review
- Can be triggered manually or on schedule
- Optional auto-merge capability

### 4. Release & Publish
**File**: `.github/workflows/release.yml`  
**Triggers**: Git tags (v*), Manual dispatch  
**Purpose**: Publish new versions to npm

- Automated version bumping
- GitHub release creation
- npm package publishing
- Artifact uploading

### 5. PR Check
**File**: `.github/workflows/pr-check.yml`  
**Triggers**: Pull request events  
**Purpose**: Validate pull requests

- Semantic PR title checking
- Bundle size validation
- Code quality checks
- Test coverage reporting

### 6. CodeQL Analysis
**File**: `.github/workflows/codeql.yml`  
**Triggers**: Push to main, PRs, Weekly schedule  
**Purpose**: Security and code quality analysis

- JavaScript/TypeScript analysis
- Security vulnerability scanning
- Code quality metrics

## Setup Requirements

### 1. GitHub Secrets
Add these secrets in your GitHub repository settings:

- **NPM_TOKEN**: Your npm authentication token
  1. Go to https://www.npmjs.com/
  2. Login and go to Access Tokens
  3. Generate a new Classic Token with "Automation" type
  4. Add it as `NPM_TOKEN` in GitHub Secrets

### 2. Repository Settings
Enable these in your repository settings:

- **Actions**: Allow all actions
- **Code scanning**: Enable CodeQL analysis
- **Dependabot**: Enable security updates

## Automated Versioning Workflow

### How It Works
1. **Development**: Work on `develop` branch
2. **Merge to Main**: 
   - Option A: Manually create PR from develop to main
   - Option B: Use "Merge Develop to Main" workflow
3. **Auto-tagging**: When PR is merged to main:
   - Auto-tag workflow detects the merge
   - Increments patch version (e.g., v0.1.0 → v0.1.1)
   - Updates package.json
   - Creates and pushes new tag
4. **Auto-release**: Tag creation triggers:
   - Release workflow automatically runs
   - Creates GitHub release
   - Publishes to npm

### Version Numbering
- Format: `vX.Y.Z`
- **X (Major)**: Breaking changes - update manually
- **Y (Minor)**: New features - update manually  
- **Z (Patch)**: Bug fixes - auto-increments on merge

### Manual Version Control
For minor or major version bumps:
```bash
# On develop branch
npm version minor  # or major
git push origin develop --follow-tags
```

## Usage

### Automatic Releases (Default Flow)
1. Create a new tag:
   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

2. The release workflow will automatically:
   - Build and test the project
   - Create a GitHub release
   - Publish to npm

### Manual Release
1. Go to Actions tab
2. Select "Release & Publish" workflow
3. Click "Run workflow"
4. Choose version type (patch/minor/major)
5. Click "Run workflow"

### Pull Request Process
1. Create a PR with semantic title (e.g., `feat: add new feature`)
2. CI checks will run automatically
3. Fix any issues reported
4. Merge when all checks pass

## Badge Examples
Add these to your README.md:

```markdown
![CI](https://github.com/yi-john-huang/amazonq-sdd/workflows/CI/badge.svg)
![npm version](https://img.shields.io/npm/v/amazonq-sdd)
![npm downloads](https://img.shields.io/npm/dm/amazonq-sdd)
![License](https://img.shields.io/npm/l/amazonq-sdd)
```

## Maintenance

### Dependabot
- Automatically creates PRs for dependency updates
- Runs weekly on Mondays
- Reviews npm and GitHub Actions dependencies

### Security
- CodeQL runs weekly security scans
- Trivy scans for vulnerabilities
- npm audit checks for package vulnerabilities