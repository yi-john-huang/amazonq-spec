# End-to-End Validation Guide

This document describes the comprehensive validation system for the amazonq-sdd package, ensuring quality, reliability, and functionality across all supported platforms and use cases.

## Overview

The validation system includes multiple layers of testing and verification:

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - Service integration testing
3. **End-to-End Tests** - Complete workflow validation
4. **System Validation** - Package installation and deployment
5. **Cross-Platform Validation** - Multi-platform compatibility
6. **Performance Validation** - Speed and resource usage
7. **Security Validation** - Code security and safety

## Running Validation

### Quick Validation
```bash
npm test                    # Run all unit and integration tests
npm run test:e2e           # Run end-to-end Jest tests
npm run validate:e2e       # Run system-level validation
```

### Comprehensive Validation
```bash
npm run build              # Build the package
npm run package           # Create distribution package
npm run validate:e2e      # Run complete system validation
```

### Validation Components

#### 1. Package Validation
Ensures the built package contains all required files and meets size requirements:

- ✅ Required files present (CLI, templates, docs)
- ✅ Package size within limits (< 200KB compressed)
- ✅ TypeScript declarations included
- ✅ Template manifest generated
- ✅ Executable permissions set correctly

#### 2. CLI Functionality Validation
Tests all CLI commands and options:

```bash
# Commands tested:
amazonq-sdd --help         # Help display
amazonq-sdd --version      # Version information
amazonq-sdd install        # Project installation
amazonq-sdd install --dry-run  # Dry run mode
```

**Validation Criteria:**
- ✅ Help output contains usage instructions
- ✅ Version matches package.json
- ✅ Install command creates proper project structure
- ✅ Dry run mode doesn't modify files
- ✅ Error handling for invalid options

#### 3. Project Workflow Validation
Tests the complete project setup and usage workflow:

**Installation Flow:**
1. Create new project directory
2. Run `amazonq-sdd install`
3. Verify directory structure created
4. Verify configuration file generated
5. Verify command scripts generated

**Expected Structure:**
```
project/
├── AMAZONQ.md              # Main configuration
├── .kiro/                  # SDD workflow directory
│   ├── specs/             # Feature specifications
│   └── steering/          # Project steering docs
└── .claude/               # Claude Code integration
    └── commands/          # Generated command scripts
        ├── kiro-spec-init.sh
        ├── kiro-spec-init.ps1
        ├── kiro-spec-requirements.sh
        ├── kiro-spec-requirements.ps1
        └── ... (other commands)
```

#### 4. Template Generation Validation
Validates all template generation functionality:

**Template Categories:**
- **Prompt Templates** - Amazon Q prompts for SDD phases
- **Configuration Templates** - Project configuration files
- **Script Templates** - Cross-platform command scripts

**Validation Tests:**
- ✅ All templates generate successfully
- ✅ Template variables are properly substituted
- ✅ Generated content meets minimum quality standards
- ✅ Multi-language template support works
- ✅ Template manifest is accurate and complete

#### 5. Configuration Management Validation
Tests configuration file generation and management:

- ✅ Configuration file creation
- ✅ Multi-language configuration support
- ✅ Configuration validation and error detection
- ✅ Configuration backup and restore
- ✅ Configuration updates and migration

#### 6. Cross-Platform Validation
Ensures compatibility across different platforms:

**Platforms Tested:**
- macOS (Darwin)
- Linux (Ubuntu, CentOS)
- Windows 10/11

**Validation Areas:**
- ✅ Package installation
- ✅ CLI execution
- ✅ Script generation (Bash/PowerShell)
- ✅ File permissions
- ✅ Path handling (Unix vs Windows)
- ✅ Amazon Q CLI path detection

#### 7. Performance Validation
Measures and validates performance characteristics:

**Metrics:**
- Installation time: < 30 seconds
- Template generation: < 5 seconds
- CLI response time: < 10 seconds
- Package size: < 200KB compressed, < 1MB uncompressed
- Memory usage: < 100MB during operation

**Concurrent Operations:**
- Multiple simultaneous installations
- Batch template generation
- Parallel project setup

#### 8. Security Validation
Ensures the package is secure and safe to use:

**Security Checks:**
- ✅ No dangerous code patterns (eval, exec, system calls)
- ✅ No hardcoded secrets or credentials
- ✅ Proper file permissions
- ✅ Input sanitization
- ✅ Path traversal prevention
- ✅ Safe template rendering

#### 9. Integration Validation
Tests integration with external systems:

**Amazon Q CLI Integration:**
- Detects Amazon Q CLI presence
- Tests basic CLI commands (when available)
- Graceful degradation when CLI not available
- Mock testing for CI/CD environments

**Node.js Version Compatibility:**
- Node.js 16.x (LTS)
- Node.js 18.x (LTS)
- Node.js 20.x (Latest)

## Validation Configuration

The validation system uses `validation-config.json` to define validation criteria and thresholds. Key sections include:

```json
{
  "validation": {
    "packageValidation": {
      "requiredFiles": [...],
      "maxPackageSize": "200KB"
    },
    "performanceValidation": {
      "maxInstallationTime": 30000,
      "maxTemplateGenerationTime": 5000
    },
    "securityValidation": {
      "disallowedPatterns": [...]
    }
  }
}
```

## Validation Reports

The validation system generates comprehensive reports:

### Report Structure
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "testEnvironment": {
    "nodeVersion": "v18.17.0",
    "platform": "darwin",
    "arch": "x64"
  },
  "results": [
    {
      "testName": "Package installation",
      "success": true,
      "message": "Package installed successfully",
      "timestamp": "..."
    }
  ],
  "summary": {
    "total": 25,
    "passed": 25,
    "failed": 0,
    "duration": 45000
  }
}
```

### Report Analysis
- **Green Build**: All tests pass, ready for release
- **Yellow Build**: Minor issues or warnings, review recommended
- **Red Build**: Critical failures, must fix before release

## Continuous Integration

The validation system integrates with GitHub Actions:

```yaml
# .github/workflows/validation.yml
name: Comprehensive Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [16.x, 18.x, 20.x]
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npm run validate:e2e
```

## Troubleshooting

### Common Issues

**Package Installation Fails:**
```bash
# Check Node.js version
node --version

# Check npm configuration
npm config list

# Try clean install
rm -rf node_modules package-lock.json
npm install
```

**CLI Commands Don't Work:**
```bash
# Check executable permissions
ls -la dist/cli.js

# Test direct execution
node dist/cli.js --help

# Check PATH configuration
echo $PATH
```

**Template Generation Fails:**
```bash
# Verify templates directory
ls -la templates/

# Check template manifest
cat templates/manifest.json

# Test individual template
node -e "const t = require('./dist/services/TemplateGenerator.js'); console.log(t)"
```

**Cross-Platform Issues:**
```bash
# Windows: Use PowerShell
powershell -ExecutionPolicy Bypass -File script.ps1

# Unix: Check script permissions
chmod +x script.sh
./script.sh

# Check line endings
file script.sh  # Should not show CRLF on Unix
```

## Contributing to Validation

When adding new features, ensure you also add corresponding validation:

1. **Unit Tests** - Test individual functions
2. **Integration Tests** - Test feature integration
3. **E2E Tests** - Test complete user workflows
4. **Update Validation Config** - Add new validation criteria
5. **Update Documentation** - Document new validation procedures

### Validation Test Structure
```typescript
describe('New Feature Validation', () => {
  beforeAll(async () => {
    // Setup test environment
  });

  it('should validate core functionality', async () => {
    // Test implementation
    expect(result.success).toBe(true);
  });

  it('should handle error conditions', async () => {
    // Error handling tests
  });

  afterAll(async () => {
    // Cleanup
  });
});
```

## Quality Gates

Before release, all validation must pass:

- ✅ All unit tests pass (100% critical, >90% overall)
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ System validation passes
- ✅ Cross-platform validation passes
- ✅ Performance benchmarks met
- ✅ Security scan clean
- ✅ Documentation updated

## Monitoring

Post-release monitoring includes:

- Package download and installation metrics
- User-reported issues and error patterns
- Performance monitoring in real-world usage
- Compatibility reports across Node.js versions
- Security vulnerability scanning

---

This validation system ensures the amazonq-sdd package maintains high quality and reliability across all supported environments and use cases.