# CCG GitHub Action

Run Code Guardian Studio analysis on your pull requests with automatic PR comments.

## Quick Start

Add this workflow to your repository:

```yaml
# .github/workflows/ccg-analysis.yml
name: CCG Code Analysis

on:
  pull_request:
    branches: [main, master]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: codeguardian/ccg-action@v1
        with:
          threshold: 70
          strategy: mixed
          comment-on-pr: true
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `threshold` | Fail if any hotspot score exceeds this value (0-100) | `70` |
| `include` | Glob patterns for files to include (comma-separated) | `**/*.ts,**/*.tsx,**/*.js,**/*.jsx` |
| `exclude` | Glob patterns for files to exclude (comma-separated) | `node_modules/**,dist/**,build/**,.git/**` |
| `strategy` | Analysis strategy: `size`, `complexity`, or `mixed` | `mixed` |
| `fail-on-issues` | Fail the action if any issues are found | `true` |
| `comment-on-pr` | Post analysis results as PR comment | `true` |
| `max-hotspots` | Maximum number of hotspots to report | `20` |
| `guard-rules` | Guard rules to enable (comma-separated, or "all") | `all` |

## Outputs

| Output | Description |
|--------|-------------|
| `hotspots-count` | Number of hotspots found |
| `avg-complexity` | Average complexity score |
| `max-complexity` | Maximum complexity score found |
| `total-issues` | Total number of guard issues found |
| `files-analyzed` | Number of files analyzed |
| `report-path` | Path to the generated report file |
| `passed` | Whether the analysis passed all thresholds |

## Example Workflows

### Basic Analysis

```yaml
- uses: codeguardian/ccg-action@v1
```

### Strict Mode (Lower Threshold)

```yaml
- uses: codeguardian/ccg-action@v1
  with:
    threshold: 50
    fail-on-issues: true
```

### TypeScript Only

```yaml
- uses: codeguardian/ccg-action@v1
  with:
    include: "**/*.ts,**/*.tsx"
    exclude: "node_modules/**,**/*.test.ts,**/*.spec.ts"
```

### Security Focus

```yaml
- uses: codeguardian/ccg-action@v1
  with:
    guard-rules: "hardcoded-secrets,sql-injection,xss-vulnerability"
    fail-on-issues: true
```

### Silent Mode (No PR Comments)

```yaml
- uses: codeguardian/ccg-action@v1
  with:
    comment-on-pr: false
```

## PR Comment Format

When `comment-on-pr: true`, CCG posts a formatted comment showing:

```markdown
## 🛡️ Code Guardian Analysis

| Metric | Value |
|--------|-------|
| Files Analyzed | 45 |
| Hotspots Found | 3 |
| Avg Complexity | 42 |
| Max Complexity | 78 |

### Top Hotspots

| File | Score | Issue | Action |
|------|-------|-------|--------|
| `src/api/handler.ts` | 78 | High complexity | refactor |
| `src/utils/parser.ts` | 65 | Deep nesting | simplify |

### Guard Issues

- ⚠️ `src/config.ts`: Potential hardcoded secret detected
```

## Using Outputs

Access action outputs in subsequent steps:

```yaml
- uses: codeguardian/ccg-action@v1
  id: ccg

- name: Check Results
  run: |
    echo "Hotspots: ${{ steps.ccg.outputs.hotspots-count }}"
    echo "Passed: ${{ steps.ccg.outputs.passed }}"

- name: Fail if Critical
  if: steps.ccg.outputs.max-complexity > 90
  run: exit 1
```

## Local Development

The action uses Docker. To test locally:

```bash
cd ccg-action
docker build -t ccg-action .
docker run -v $(pwd):/github/workspace ccg-action 70 "**/*.ts" "node_modules/**" mixed true true 20 all
```

## Troubleshooting

### Action Timeout

Large repositories may exceed the default timeout. Increase it:

```yaml
- uses: codeguardian/ccg-action@v1
  timeout-minutes: 10
```

### No Files Analyzed

Check your `include` patterns match your file structure:

```yaml
- uses: codeguardian/ccg-action@v1
  with:
    include: "src/**/*.ts,lib/**/*.js"
```

### Permission Denied

Ensure the action has write permissions for PR comments:

```yaml
permissions:
  pull-requests: write
  contents: read
```

## Related

- [VS Code Extension](VS_CODE_EXTENSION.md) - View reports in your editor
- [Quickstart Guide](QUICKSTART.md) - Get started with CCG
- [User Guide](USER_GUIDE.md) - Complete documentation

---

*Part of [Code Guardian Studio](https://codeguardian.studio)*
