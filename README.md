# Code Guardian Studio

> AI-powered code refactor engine for large repositories, built on Claude Code + MCP.

**Website & Docs:** https://codeguardian.studio

---

## What is Code Guardian Studio?

Code Guardian Studio (CCG) is an MCP server that transforms Claude Code into an intelligent refactoring assistant. It scans your codebase, finds hotspots, generates optimization reports, and helps you refactor safely.

### Key Stats (from dogfooding CCG on itself)

| Metric | Value |
|--------|-------|
| Lines Analyzed | 68,000 |
| Files Scanned | 212 |
| Hotspots Found | 20 |
| Analysis Time | < 1 minute |

## Quick Start

```bash
# Install globally
npm install -g @anthropic-community/claude-code-guardian

# Initialize in your project
ccg init

# Run code optimization analysis
ccg code-optimize --report
```

## Features

### Code Optimizer (8 tools)
- `code_scan_repository` - Map your entire codebase
- `code_metrics` - Calculate complexity, nesting, branch scores
- `code_hotspots` - Find files that need attention
- `code_refactor_plan` - Generate step-by-step refactor plans
- `code_record_optimization` - Log optimization sessions
- `code_generate_report` - Create Markdown reports
- `code_quick_analysis` - Scan + metrics + hotspots in one call
- `code_optimizer_status` - Check module status

### Additional Modules
- **Memory** - Persistent storage across sessions
- **Guard** - Block dangerous patterns (fake tests, empty catches, etc.)
- **Workflow** - Task management and tracking
- **Latent Chain** - Multi-phase reasoning for complex tasks
- **Agents** - Specialized agent coordination
- **Thinking** - Structured reasoning models
- **Documents** - Documentation management
- **Testing** - Test runner integration

## Pricing

| Plan | Price | Best For |
|------|-------|----------|
| Dev | Free | Solo devs & side projects |
| Team | $39/mo | Product teams & agencies |
| Enterprise | Custom | Large orgs & compliance |

## Links

- **Website:** https://codeguardian.studio
- **Case Study:** https://codeguardian.studio/case-study
- **Partners:** https://codeguardian.studio/partners
- **GitHub:** https://github.com/phuongrealmax/claude-code-guardian

## License

MIT

---

Built with Claude. Protected by Guardian.
