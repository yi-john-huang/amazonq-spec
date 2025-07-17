#!/usr/bin/env python3
"""
Check Steering Drift Hook Script

This script monitors changes to the codebase and detects when steering documents
may be outdated. It runs as a PostToolUse hook and alerts when steering updates
are needed.
"""

import json
import sys
import os
import subprocess
from datetime import datetime
from pathlib import Path

def get_hook_input():
    """Read JSON input from stdin"""
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

def get_git_hash():
    """Get current git commit hash"""
    try:
        result = subprocess.run(['git', 'rev-parse', 'HEAD'], 
                              capture_output=True, text=True)
        return result.stdout.strip() if result.returncode == 0 else None
    except:
        return None

def get_steering_version():
    """Get steering version from spec metadata"""
    try:
        spec_dirs = Path('.claude/specs').glob('*/spec.json')
        for spec_file in spec_dirs:
            with open(spec_file, 'r') as f:
                spec_data = json.load(f)
                return spec_data.get('steering_version')
    except:
        pass
    return None

def check_steering_files_exist():
    """Check if steering files exist"""
    steering_files = [
        '.claude/steering/structure.md',
        '.claude/steering/tech.md',
        '.claude/steering/product.md'
    ]
    
    missing_files = []
    for file_path in steering_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
    
    return missing_files

def is_significant_change(tool_name, tool_input):
    """Determine if the change is significant enough to warrant steering update"""
    significant_patterns = [
        'package.json',
        'requirements.txt',
        'pom.xml',
        'Cargo.toml',
        'go.mod',
        'pyproject.toml',
        'README.md',
        'CHANGELOG.md',
        'src/',
        'lib/',
        'components/',
        'services/',
        'models/',
        'controllers/',
        'views/',
        'api/',
        'routes/',
    ]
    
    if tool_name in ['Write', 'Edit', 'MultiEdit']:
        file_path = tool_input.get('file_path', '')
        return any(pattern in file_path for pattern in significant_patterns)
    
    return False

def main():
    input_data = get_hook_input()
    
    # Only process relevant tool calls
    tool_name = input_data.get('tool_name', '')
    tool_input = input_data.get('tool_input', {})
    
    # Skip if not a significant change
    if not is_significant_change(tool_name, tool_input):
        sys.exit(0)
    
    # Check if steering files exist
    missing_files = check_steering_files_exist()
    if missing_files:
        output = {
            "decision": "block",
            "reason": f"Steering documents are missing: {', '.join(missing_files)}. Run '/steering-init' to create them before continuing development."
        }
        print(json.dumps(output))
        sys.exit(2)
    
    # Check steering version drift
    current_git_hash = get_git_hash()
    steering_version = get_steering_version()
    
    if current_git_hash and steering_version:
        # Get commits since steering version
        try:
            result = subprocess.run(
                ['git', 'rev-list', '--count', f'{steering_version}..HEAD'],
                capture_output=True, text=True
            )
            commits_since = int(result.stdout.strip()) if result.returncode == 0 else 0
        except:
            commits_since = 0
        
        # Alert if significant drift detected
        if commits_since > 10:  # Threshold for significant drift
            output = {
                "continue": True,
                "suppressOutput": False
            }
            print(json.dumps(output))
            print(f"⚠️  Steering documents may be outdated ({commits_since} commits since last update). Consider running '/steering-update' to keep context current.", file=sys.stderr)
            sys.exit(0)
    
    # Success - no steering issues detected
    output = {
        "continue": True,
        "suppressOutput": True
    }
    print(json.dumps(output))
    sys.exit(0)

if __name__ == "__main__":
    main()