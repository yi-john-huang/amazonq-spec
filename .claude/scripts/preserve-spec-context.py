#!/usr/bin/env python3
"""
Preserve Spec Context Hook Script

This script ensures that spec-related context is preserved during compaction.
It runs as a PreCompact hook to maintain steering and active spec information.
"""

import json
import sys
from pathlib import Path

def get_hook_input():
    """Read JSON input from stdin"""
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

def get_active_specs():
    """Get list of active specifications"""
    active_specs = []
    
    try:
        specs_dir = Path('.claude/specs')
        if specs_dir.exists():
            for spec_dir in specs_dir.iterdir():
                if spec_dir.is_dir():
                    spec_json = spec_dir / 'spec.json'
                    if spec_json.exists():
                        with open(spec_json, 'r', encoding='utf-8') as f:
                            spec_data = json.load(f)
                            active_specs.append({
                                'name': spec_data.get('feature_name', spec_dir.name),
                                'phase': spec_data.get('phase', 'unknown'),
                                'progress': spec_data.get('progress', {}),
                                'updated_at': spec_data.get('updated_at', ''),
                                'implementation_ready': spec_data.get('implementation_ready', False)
                            })
    except Exception as e:
        print(f"Error reading specs: {e}", file=sys.stderr)
    
    return active_specs

def get_steering_summary():
    """Get summary of steering documents"""
    steering_info = {
        'structure_exists': False,
        'tech_exists': False,
        'product_exists': False,
        'last_updated': 'unknown'
    }
    
    steering_files = [
        ('.claude/steering/structure.md', 'structure_exists'),
        ('.claude/steering/tech.md', 'tech_exists'),
        ('.claude/steering/product.md', 'product_exists')
    ]
    
    for file_path, key in steering_files:
        if Path(file_path).exists():
            steering_info[key] = True
    
    return steering_info

def generate_context_preservation_instructions():
    """Generate instructions for context preservation during compaction"""
    active_specs = get_active_specs()
    steering_info = get_steering_summary()
    
    context_instructions = []
    
    # Steering context preservation
    if any(steering_info[key] for key in ['structure_exists', 'tech_exists', 'product_exists']):
        context_instructions.append(
            "CRITICAL: Preserve steering context from .claude/steering/ directory - "
            "this contains essential project architecture, technology, and product context."
        )
    
    # Active specs context preservation
    if active_specs:
        context_instructions.append(
            f"CRITICAL: Preserve active specifications context for {len(active_specs)} specs:"
        )
        
        for spec in active_specs:
            phase_desc = spec['phase']
            progress_desc = f"Requirements: {spec['progress'].get('requirements', 0)}%, " \
                          f"Design: {spec['progress'].get('design', 0)}%, " \
                          f"Tasks: {spec['progress'].get('tasks', 0)}%"
            
            context_instructions.append(
                f"  - {spec['name']}: Phase={phase_desc}, Progress=({progress_desc}), "
                f"Ready={spec['implementation_ready']}"
            )
    
    # Workflow context preservation
    context_instructions.append(
        "CRITICAL: Preserve spec-driven development workflow context - "
        "this project uses Kiro-style 3-phase approach (Requirements→Design→Tasks→Implementation)."
    )
    
    # Command context preservation
    context_instructions.append(
        "CRITICAL: Preserve available slash commands context: "
        "/steering-init, /steering-update, /spec-init, /spec-requirements, /spec-design, /spec-tasks, /spec-status"
    )
    
    return "\n".join(context_instructions)

def main():
    input_data = get_hook_input()
    
    # Generate context preservation instructions
    instructions = generate_context_preservation_instructions()
    
    # Output instructions to stderr so they're visible during compaction
    print("🔄 Preserving spec-driven development context during compaction...", file=sys.stderr)
    print(instructions, file=sys.stderr)
    
    # Success - continue with compaction
    output = {
        "continue": True,
        "suppressOutput": False
    }
    print(json.dumps(output))
    sys.exit(0)

if __name__ == "__main__":
    main()