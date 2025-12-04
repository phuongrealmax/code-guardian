# CCG Code Optimizer Module

> NEW in v3.1 - Analyze and optimize large codebases

## Overview

The Code Optimizer module provides tools for repository analysis, code metrics calculation, hotspot detection, and refactoring plan generation.

## Tools (7 tools)

| Tool | Description |
|------|-------------|
| `code_scan_repository` | Scan repository structure and statistics |
| `code_metrics` | Calculate code metrics (LOC, complexity, nesting) |
| `code_hotspots` | Detect code hotspots for prioritization |
| `code_refactor_plan` | Generate Latent-compatible refactor plans |
| `code_record_optimization` | Record completed optimization sessions |
| `code_quick_analysis` | Quick scan + metrics + hotspots in one call |
| `code_optimizer_status` | Get module status |

## Quick Start

### 1. Scan Repository

```json
// Tool: code_scan_repository
{
  "rootPath": ".",
  "includePatterns": ["src/**/*.ts"],
  "excludePatterns": ["**/node_modules/**", "**/dist/**"],
  "maxFiles": 1000
}
```

Returns:
- Total files and approximate line counts
- Top 50 largest files
- Top 50 largest folders

### 2. Calculate Metrics

```json
// Tool: code_metrics
{
  "files": ["src/server.ts", "src/core/config.ts"],
  "maxFileSizeBytes": 512000
}
```

Metrics per file:
- Lines (total, code, comments, blank)
- Nesting depth (max)
- Branch keywords (if, switch, for, while, catch, ternary)
- TODO/FIXME counts
- Complexity score (weighted composite)

### 3. Detect Hotspots

```json
// Tool: code_hotspots
{
  "metrics": [...], // From code_metrics
  "maxResults": 20,
  "strategy": "mixed" // size | complexity | mixed
}
```

Returns ranked hotspots with:
- Composite score
- Reasons (e.g., "Very high complexity", "Deep nesting")
- Suggested goal (refactor, add-tests, split-module)

### 4. Generate Refactor Plan

```json
// Tool: code_refactor_plan
{
  "hotspots": [
    { "path": "src/server.ts", "reason": "High complexity" }
  ],
  "goal": "readability", // readability | performance | architecture | testing | mixed
  "maxStepsPerFile": 5,
  "constraints": ["No breaking changes"]
}
```

Generates Latent-compatible plan with phases:
- `analysis` - Understand the code
- `plan` - Design changes
- `impl` - Implement changes
- `review` - Verify results

### 5. Quick Analysis (All-in-One)

```json
// Tool: code_quick_analysis
{
  "maxFiles": 500,
  "maxHotspots": 10,
  "strategy": "mixed"
}
```

Combines scan + metrics + hotspots in one call.

## Integration with Other Modules

### With Latent Chain Mode

```
1. code_quick_analysis -> identify hotspots
2. latent_context_create -> start refactor session
3. code_refactor_plan -> generate steps
4. For each step:
   - latent_phase_transition -> change phase
   - Read/Edit -> make changes
   - latent_apply_patch -> apply changes
5. testing_run -> verify changes
6. code_record_optimization -> save results
```

### With Guard

After generating patches, validate with Guard:

```json
// Tool: guard_validate
{
  "code": "...",
  "filename": "refactored.ts",
  "strict": true
}
```

### With Memory

Store refactoring decisions:

```json
// Tool: memory_store
{
  "content": "Refactored server.ts: extracted middleware, reduced nesting from 6 to 3",
  "type": "architecture",
  "importance": 8,
  "tags": ["refactor", "server"]
}
```

## Example Workflow

```
User: "Analyze this repo and suggest what to refactor"

Claude:
1. code_scan_repository -> found 847 files, ~42k lines
2. code_metrics -> analyzed 200 source files
3. code_hotspots -> found 15 hotspots

Top 5 Hotspots:
1. src/modules/guard/guard.service.ts (score: 78)
   - Very high complexity: 65
   - Deep nesting: level 6
   - Suggested: refactor

2. src/server.ts (score: 72)
   - Large file: 650 lines
   - Complex branching: score 45
   - Suggested: split-module

...

4. code_refactor_plan -> generated 47 steps for 15 files
   Estimated effort: 4-8 hours
```

## Scoring Strategies

### Size Strategy
Prioritizes large files by line count.

### Complexity Strategy
Prioritizes files with:
- High nesting depth
- Many branch keywords
- High complexity score

### Mixed Strategy (Recommended)
Balanced scoring considering:
- 25% size
- 30% complexity
- 20% nesting
- 15% branching
- 10% technical debt (TODOs/FIXMEs)

## Configuration

```typescript
const DEFAULT_CONFIG = {
  enabled: true,
  defaultExcludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
  ],
  maxFilesToScan: 5000,
  maxFileSizeBytes: 512 * 1024, // 512KB
  cacheResults: true,
  cacheTTLSeconds: 300, // 5 minutes
};
```

## Best Practices

1. **Start with quick_analysis** - Get overview before deep diving
2. **Use mixed strategy** - Most balanced for general refactoring
3. **Set constraints** - Avoid breaking changes, maintain API
4. **Follow the phases** - Analysis -> Plan -> Impl -> Review
5. **Record results** - Use code_record_optimization for future reference
6. **Run tests after each step** - Catch regressions early

---

## Prompt Recipes

Ready-to-use prompts for common optimization tasks.

### 1. Quick Codebase Assessment

```
Analyze this repository and give me a summary of:
1. Total size and file count
2. Top 5 hotspots that need attention
3. Overall code health score
```

### 2. Technical Debt Reduction

```
I want to reduce technical debt in this project. Please:
1. Run code_quick_analysis to find hotspots
2. Focus on files with high TODO/FIXME counts
3. Generate a refactor plan with goal "readability"
4. Prioritize high-complexity files
```

### 3. Prepare for Code Review

```
Before submitting this PR, analyze the changed files:
1. Calculate metrics for modified files
2. Check if complexity increased
3. Identify any new hotspots created
4. Suggest improvements if needed
```

### 4. Legacy Code Modernization

```
Help me modernize this legacy codebase:
1. Scan the repository structure
2. Identify files with deep nesting (> 4 levels)
3. Find files with high branch complexity
4. Create a phased refactoring plan
5. Start with the highest-impact, lowest-risk changes
```

### 5. Performance Optimization Focus

```
I need to optimize this codebase for performance:
1. Run analysis with "complexity" strategy
2. Focus on files with high loop counts (for, while)
3. Generate refactor plan with goal "performance"
4. Identify potential N+1 query patterns
```

### 6. Test Coverage Improvement

```
Help me improve test coverage:
1. Identify files with high complexity but no test files
2. Find hotspots with suggested goal "add-tests"
3. Create a plan to add tests to critical paths
4. Start with the most complex untested code
```

### 7. Module Splitting

```
This file is too large. Help me split it:
1. Run code_metrics on the specific file
2. Identify logical groupings of functions
3. Generate a refactor plan with goal "architecture"
4. Suggest new module structure
5. Use Latent Chain Mode to execute the split
```

### 8. Continuous Improvement Workflow

```
Set up a continuous improvement process:
1. Run weekly code_quick_analysis
2. Track hotspot scores over time
3. Record each optimization session
4. Compare before/after metrics
5. Store decisions in memory for future reference
```

---

## CLI Usage

CCG provides a `code-optimize` command for terminal/CI usage:

```bash
# Basic analysis
ccg code-optimize

# Generate report
ccg code-optimize --report

# Custom options
ccg code-optimize \
  --strategy complexity \
  --max-files 500 \
  --max-hotspots 10 \
  --output docs/my-report.md \
  --report

# JSON output (for scripting)
ccg code-optimize --json

# CI mode (exit code 1 if hotspots exceed threshold)
ccg code-optimize --ci --threshold 60
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-r, --report` | Generate markdown report | false |
| `-s, --strategy <type>` | Scoring strategy (size, complexity, mixed) | mixed |
| `-m, --max-files <n>` | Maximum files to scan | 1000 |
| `-t, --max-hotspots <n>` | Maximum hotspots to return | 20 |
| `-o, --output <path>` | Custom report output path | auto |
| `-j, --json` | Output as JSON | false |
| `--ci` | CI mode with exit codes | false |
| `--threshold <n>` | Hotspot score threshold for CI | 50 |

---

## GitHub Actions Integration

Add code optimization to your CI pipeline:

```yaml
# .github/workflows/code-quality.yml
name: Code Quality

on: [push, pull_request]

jobs:
  code-optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - run: npm install -g @anthropic-community/claude-code-guardian

      - run: ccg init --profile minimal || true

      - name: Run Code Optimizer
        run: ccg code-optimize --ci --threshold 70

      - name: Generate Report
        if: always()
        run: ccg code-optimize --report --output optimization-report.md

      - uses: actions/upload-artifact@v4
        with:
          name: optimization-report
          path: optimization-report.md
```

See [templates/ci-cd/github-actions.yml](../templates/ci-cd/github-actions.yml) for a complete CI template.

---

## Troubleshooting

### Scan is slow

- Reduce `maxFiles` parameter
- Add more patterns to `excludePatterns`
- Exclude large folders like `node_modules`, `dist`, `.git`

### Metrics showing 0 for some files

- Check file size limit (`maxFileSizeBytes`)
- Ensure file is a source code file (not binary)
- Verify file encoding is UTF-8

### Hotspots not matching expectations

- Try different `strategy` (size, complexity, mixed)
- Adjust `thresholds` parameters
- Check if files are being excluded by patterns
