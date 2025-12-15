# Code Guardian Studio - Quickstart Guide

Get your first code analysis in under 3 minutes.

## Prerequisites

- Node.js 18+ installed
- A code project you want to analyze

## Installation & First Analysis

```bash
# 1. Install Code Guardian Studio globally
npm install -g codeguardian-studio

# 2. Navigate to your project
cd /path/to/your/project

# 3. Run quickstart
ccg quickstart
```

That's it! The quickstart command handles everything automatically.

## What Happens During Quickstart?

When you run `ccg quickstart`, here's what happens behind the scenes:

### 1. Auto-Initialization & Migration (5 seconds)
- Creates `.ccg/` directory for configuration and data
- Sets up hooks for Claude Code integration
- Configures MCP server settings
- **Auto-migrates** old configurations (if upgrading from previous version)
- **Validates** configuration and auto-fixes common issues

### 2. Codebase Scan (~30 seconds)
- Recursively scans your project files
- Identifies source code files (excludes node_modules, dist, etc.)
- Counts lines of code and file types

###  3. Metrics Analysis (~60 seconds)
- Calculates complexity scores for each file
- Measures nesting depth
- Counts branching (if/switch statements)
- Identifies TODO and FIXME comments

### 4. Hotspot Detection (~10 seconds)
- Ranks files by complexity + size
- Identifies files that need attention first
- Suggests optimization goals (refactor, simplify, add tests, etc.)

### 5. Report Generation (~5 seconds)
- Creates a local markdown report in `docs/reports/` (gitignored by default)
- Includes overview, hotspots table, and recommendations
- Report is human-readable, not JSON
- Reports are local to your machine and not committed to git

**Total time:** ~2 minutes for most projects (30k LOC or less)

## Understanding Your Report

The generated report includes:

### Overview Section
- **Files analyzed:** Total source files scanned
- **Avg complexity:** Average complexity score (lower is better)
- **Hotspots found:** Files that need attention

### Hotspots Table
- **Rank:** Priority order (fix #1 first)
- **Score:** Combined complexity + size score (0-100)
- **File:** Path to the problematic file
- **Reason:** Why it's flagged (e.g., "Very high complexity: 85, Deep nesting: level 8")
- **Goal:** Suggested action (simplify, refactor, add-tests, split-module)

### Recommendations
- Step-by-step suggestions to improve code quality
- Links to specific files and line numbers

## Next Steps

After your first analysis:

1. **Open the report:**
   ```bash
   # Report path is shown at the end of quickstart
   # Example: docs/reports/optimization-2025-12-05-quickstart-123456.md
   ```

2. **Start fixing hotspots (highest score first):**
   - Focus on files with score > 70 first
   - Break down large functions
   - Reduce nesting depth
   - Extract complex logic into smaller functions

3. **Run analysis again to track improvements:**
   ```bash
   ccg code-optimize --report
   ```

4. **Compare before/after:**
   - Check if avg complexity decreased
   - See how many hotspots you resolved

## Example Output

```
⚡ CCG Quickstart - Get started in 3 minutes!

This will guide you through your first code analysis.

✓ CCG initialized

Starting Quick Analysis...

Scanning your codebase for optimization opportunities...

═════════════════════════════════════════════════

ANALYSIS COMPLETE

Files analyzed: 42
Avg complexity: 12.3
Hotspots found: 5

⚠  Top issues to address:

  1. src/services/payment-processor.ts
     simplify: Very high complexity: 78, Deep nesting: level 9

  2. src/utils/data-transformer.ts
     refactor: High complexity: 65, Large file: 450 lines

  3. src/api/user-controller.ts
     add-tests: No tests found, High complexity: 52

═════════════════════════════════════════════════

Generating detailed report...

✓ Report saved: docs/reports/optimization-2025-12-05-quickstart-1764901234567.md

NEXT STEPS:

  1. Open the report: docs/reports/optimization-2025-12-05-quickstart-1764901234567.md
  2. Start fixing hotspots (highest score first)
  3. Run analysis again to track improvement

Tip: Use ccg code-optimize --help for more options
```

## Advanced Usage

Once you're comfortable with quickstart, explore more options:

### Run Analysis with Custom Options
```bash
# Focus on complexity instead of size
ccg code-optimize --strategy complexity --report

# Scan more files (default: 1000)
ccg code-optimize --max-files 5000 --report

# Output as JSON for scripts
ccg code-optimize --json > analysis.json
```

### See All Advanced Options
```bash
ccg code-optimize --help-advanced
```

### CI/CD Integration
```bash
# Fail build if hotspots exceed threshold
ccg code-optimize --ci --threshold 70
```

### Track Progress Over Time (Team Tier)
With a Team license, reports automatically track your progress:
```bash
# First analysis
ccg code-optimize --report

# ... make improvements ...

# Second analysis - shows before/after comparison!
ccg code-optimize --report
```

Team reports include:
- **Tech Debt Summary**: Hotspot count/score deltas
- **Before vs After**: Visual comparison between sessions
- **ROI Notes**: Estimated time savings

To upgrade: `ccg activate` or visit [codeguardian.studio/pricing](https://codeguardian.studio/pricing)

## Common Questions

### Where is my data stored?
- Configuration: `.ccg/config.json`
- Reports: `docs/reports/` (local, gitignored by default)
- Analysis cache: `.ccg/optimizer-cache.json` (optional)

### Can I customize the analysis?
Yes! Edit `.ccg/config.json` after initialization. See [User Guide](USER_GUIDE.md) for details.

### Does it work offline?
Yes! **Dev tier** runs entirely locally with no cloud dependencies.

Team/Enterprise licenses cache validation for 24 hours, so you can work offline after initial verification.

### What languages are supported?
- JavaScript/TypeScript (best support)
- Python, Java, Go, Rust, C/C++
- Any language with recognizable syntax (basic metrics)

### How do I use this with Claude Code?
After `ccg quickstart`, the MCP server is automatically configured. Just:
1. Start Claude Code: `claude`
2. CCG tools are available via MCP
3. Ask Claude to analyze your code

## Troubleshooting

### "No source files found"
- Make sure you're in a project directory with code files
- Check if your files are in excluded patterns (node_modules, dist, etc.)

### "Command not found: ccg"
- Run `npm install -g codeguardian-studio` again
- Check that npm global bin is in your PATH

### Analysis takes too long
- Try reducing max-files: `ccg code-optimize --max-files 500 --report`
- Exclude large directories in `.ccg/config.json`

## Upgrading from Previous Versions

If you're upgrading from a previous version of CCG, the quickstart command handles migration automatically:

```bash
# Run quickstart - auto-detects and migrates old config
ccg quickstart
# → Found config v0.9.0, current is v1.3.0
# → Migrating configuration...
# → Migration complete!
```

### Migration Paths Supported

| From | To | Auto-Migrated |
|------|-----|---------------|
| 0.x | 1.0.0 | Module restructuring, new defaults |
| 1.0.0 | 1.2.0 | AutoAgent, Latent modules |
| 1.2.0 | 1.3.0 | Context profiles, Security STRIDE |

### Manual Configuration Check

```bash
# Validate configuration
ccg doctor

# Auto-fix configuration issues
ccg doctor --fix
```

---

## After Refresh or Reconnect

If your browser refreshes or you get disconnected:

1. **Check for resume offer** - CCG will offer to restore your session
2. **Resume if available** - Restores tasks, progress, and context
3. **Check nextToolCalls** - If tasks were blocked, see suggested next actions
4. **Continue where you left off** - All timeline events are preserved

See [Session Resume](SESSION_RESUME.md) for details on recovery workflows.

---

## Learn More

- [User Guide](USER_GUIDE.md) - Complete documentation
- [Latent Chain Guide](LATENT_CHAIN_GUIDE.md) - Advanced reasoning mode
- [Session Resume](SESSION_RESUME.md) - Recovery after disconnects
- [Completion Gates](COMPLETION_GATES.md) - Task completion requirements
- [Code Guardian Website](https://codeguardian.studio) - Case studies and examples

---

**Ready to optimize your codebase?**

```bash
ccg quickstart
```
