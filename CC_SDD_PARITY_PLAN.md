# CC-SDD Feature Parity Plan

## Current Status: AMAZONQ-SDD vs CC-SDD

### ✅ **Features We Have Correctly:**
1. **Kiro Commands Structure** - All 8 commands exist
2. **File Organization** - `.kiro/specs/` and `.kiro/steering/` directories  
3. **Template System** - Handlebars templates for all commands
4. **Multi-platform** - Works on macOS/Windows
5. **Auto-file Creation** - Saves Amazon Q responses automatically

### ❌ **Features We Need to Fix:**

#### 1. **Command Naming Mismatch:**
- **CC-SDD**: `/kiro:spec-impl` 
- **AMAZONQ-SDD**: `kiro-spec-implement.sh`
- **FIX**: Rename to `kiro-spec-impl.sh` for consistency

#### 2. **Missing Installation Options:**
- **CC-SDD**: `npx cc-sdd@latest --lang ja --os mac --dry-run --backup`
- **AMAZONQ-SDD**: Only basic `npx amazonq-sdd@latest init`
- **FIX**: Add language, OS, dry-run, backup options

#### 3. **Different Integration Method:**
- **CC-SDD**: Native slash commands in `.claude/commands/kiro/`
- **AMAZONQ-SDD**: External shell scripts calling Amazon Q CLI
- **STATUS**: This is intentional - we integrate with Amazon Q CLI, not Claude Code

#### 4. **Missing Language Templates:**
- **CC-SDD**: Supports English, Japanese, Traditional Chinese
- **AMAZONQ-SDD**: Only English templates
- **FIX**: Add multilingual template support

#### 5. **Installation CLI Options:**
- **CC-SDD**: Rich CLI with multiple options
- **AMAZONQ-SDD**: Simple `init` command only
- **FIX**: Add full CLI option parity

### 🎯 **Action Plan:**

1. **Rename Implementation Command**
   - Change `kiro-spec-implement` → `kiro-spec-impl`
   - Update template reference to match

2. **Add CLI Options**
   - Add `--lang en/ja/zh-TW` language selection
   - Add `--os mac/windows` OS selection
   - Add `--dry-run` preview mode
   - Add `--backup` backup existing files

3. **Add Multilingual Support**
   - Create Japanese templates
   - Create Traditional Chinese templates
   - Add language detection and selection

4. **Update Installation Process**
   - Make it work like `npx cc-sdd@latest --lang ja --os mac`
   - Remove the `init` subcommand requirement

5. **Add Missing Features**
   - Backup functionality
   - Better error handling
   - Progress indicators

### 🚀 **Target Result:**

```bash
# Should work exactly like cc-sdd:
npx amazonq-sdd@latest --lang ja --os mac --dry-run

# Creates same structure:
project/
├── .amazonq/              # Instead of .claude/ (Amazon Q equivalent)
├── .kiro/specs/          # Same as cc-sdd
├── .kiro/steering/       # Same as cc-sdd
└── AMAZONQ.md            # Instead of CLAUDE.md (Amazon Q equivalent)

# Same commands (but .sh instead of slash commands):
kiro-steering.sh
kiro-steering-custom.sh
kiro-spec-init.sh
kiro-spec-requirements.sh
kiro-spec-design.sh
kiro-spec-tasks.sh
kiro-spec-impl.sh          # Fixed name
kiro-spec-status.sh
```

### 📋 **Implementation Steps:**

1. Rename implementation command
2. Add CLI option parsing
3. Add multilingual templates
4. Update installation process
5. Add backup functionality
6. Update to version 0.2.0
7. Test complete parity

**Goal**: Full feature parity with cc-sdd while maintaining Amazon Q CLI integration.