#!/usr/bin/env python3
"""
Update Spec Progress Hook Script

This script monitors task completion in spec files and automatically updates
progress tracking. It runs as a PostToolUse hook when spec files are modified.
"""

import json
import sys
import re
from datetime import datetime
from pathlib import Path

def get_hook_input():
    """Read JSON input from stdin"""
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

def is_spec_file(file_path):
    """Check if the modified file is a spec file"""
    return '.claude/specs/' in file_path and file_path.endswith('.md')

def get_spec_name_from_path(file_path):
    """Extract spec name from file path"""
    # Path format: .claude/specs/[spec-name]/[file].md
    path_parts = Path(file_path).parts
    if len(path_parts) >= 3 and path_parts[1] == 'specs':
        return path_parts[2]
    return None

def count_tasks_in_file(file_path):
    """Count total and completed tasks in a tasks.md file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find checkbox patterns: - [ ] or - [x] or - [X]
        total_tasks = len(re.findall(r'- \[[xX ]\]', content))
        completed_tasks = len(re.findall(r'- \[[xX]\]', content))
        
        return total_tasks, completed_tasks
    except:
        return 0, 0

def update_spec_metadata(spec_name, phase_progress=None):
    """Update spec.json metadata file"""
    spec_json_path = Path(f'.claude/specs/{spec_name}/spec.json')
    
    if not spec_json_path.exists():
        return
    
    try:
        with open(spec_json_path, 'r', encoding='utf-8') as f:
            spec_data = json.load(f)
        
        # Ensure approvals field exists (backward compatibility)
        if 'approvals' not in spec_data:
            spec_data['approvals'] = {
                'requirements': False,
                'design': False,
                'tasks': False
            }
        
        # Ensure ready_for_implementation field exists
        if 'ready_for_implementation' not in spec_data:
            spec_data['ready_for_implementation'] = False
        
        # Update timestamp
        spec_data['updated_at'] = datetime.now().isoformat()
        
        # Update phase progress if provided
        if phase_progress:
            spec_data['progress'].update(phase_progress)
            
            # Determine current phase based on progress and approvals
            approvals = spec_data['approvals']
            progress = spec_data['progress']
            
            if approvals['tasks'] and progress['tasks'] > 0:
                spec_data['phase'] = 'implementation'
                spec_data['ready_for_implementation'] = True
            elif approvals['design'] and progress['design'] > 0:
                spec_data['phase'] = 'tasks-ready'
            elif approvals['requirements'] and progress['requirements'] > 0:
                spec_data['phase'] = 'design-ready'
            elif progress['requirements'] > 0:
                spec_data['phase'] = 'requirements-complete'
            else:
                spec_data['phase'] = 'requirements'
        
        # Write back to file
        with open(spec_json_path, 'w', encoding='utf-8') as f:
            json.dump(spec_data, f, indent=2)
            
    except Exception as e:
        print(f"Error updating spec metadata: {e}", file=sys.stderr)

def update_tasks_progress_section(file_path, total_tasks, completed_tasks):
    """Update progress section in tasks.md file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find and update progress section
        progress_pattern = r'## 進捗状況\n.*?(?=\n##|\Z)'
        progress_replacement = f"""## 進捗状況
- Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- Total tasks: {total_tasks}
- Completed: {completed_tasks}
- Remaining: {total_tasks - completed_tasks}
- Progress: {(completed_tasks / total_tasks * 100):.1f}%"""
        
        if re.search(progress_pattern, content, re.DOTALL):
            content = re.sub(progress_pattern, progress_replacement, content, flags=re.DOTALL)
        else:
            # Add progress section if it doesn't exist
            content += f"\n\n{progress_replacement}"
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
    except Exception as e:
        print(f"Error updating tasks progress: {e}", file=sys.stderr)

def main():
    input_data = get_hook_input()
    
    # Only process file modification tools
    tool_name = input_data.get('tool_name', '')
    tool_input = input_data.get('tool_input', {})
    
    if tool_name not in ['Write', 'Edit', 'MultiEdit']:
        sys.exit(0)
    
    file_path = tool_input.get('file_path', '')
    
    # Only process spec files
    if not is_spec_file(file_path):
        sys.exit(0)
    
    spec_name = get_spec_name_from_path(file_path)
    if not spec_name:
        sys.exit(0)
    
    # Determine file type and update accordingly
    file_name = Path(file_path).name
    
    if file_name == 'tasks.md':
        # Count tasks and update progress
        total_tasks, completed_tasks = count_tasks_in_file(file_path)
        
        if total_tasks > 0:
            # Update tasks.md progress section
            update_tasks_progress_section(file_path, total_tasks, completed_tasks)
            
            # Update spec metadata
            tasks_progress = (completed_tasks / total_tasks) * 100
            update_spec_metadata(spec_name, {'tasks': int(tasks_progress)})
            
            print(f"Updated task progress for {spec_name}: {completed_tasks}/{total_tasks} tasks completed")
    
    elif file_name == 'requirements.md':
        # Mark requirements as completed
        update_spec_metadata(spec_name, {'requirements': 100})
        print(f"Marked requirements as completed for {spec_name}")
    
    elif file_name == 'design.md':
        # Mark design as completed
        update_spec_metadata(spec_name, {'design': 100})
        print(f"Marked design as completed for {spec_name}")
    
    # Success
    sys.exit(0)

if __name__ == "__main__":
    main()