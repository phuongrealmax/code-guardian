# CCG Roadmap v2.0

> Generated: November 30, 2025 | Using CCG Latent Chain Mode

## Executive Summary

Claude Code Guardian (CCG) đã phát triển từ 9 modules ban đầu lên **11 modules** với nhiều tính năng enterprise-grade. Tài liệu này tổng hợp các improvement proposals và định hướng phát triển tiếp theo.

---

## Current State (v1.2.2)

### Implemented Features

| Module | Status | Key Features |
|--------|--------|--------------|
| Memory | ✅ Complete | Persistent SQLite, Zero Retention Mode, Project-scoped |
| Guard | ✅ Complete | 10 security rules (OWASP + AI), Custom rules support |
| Agents | ✅ Complete | Multi-agent, Delegation rules, Coordination |
| Commands | ✅ Complete | 14+ slash commands, Domain-specific |
| Workflow | ✅ Complete | Task CRUD, Progress tracking, Notes |
| Resource | ✅ Complete | Token tracking, Auto-checkpoints |
| Process | ✅ Complete | Port management, Process spawning |
| Testing | ✅ Complete | Test runner, Browser automation, Templates |
| Documents | ✅ Complete | Registry, Update detection |
| **Latent** | ✅ **NEW** | Latent Chain Mode, 70-80% token reduction |
| **Audit** | ✅ **NEW** | Immutable logs, SIEM export |

### Recent Improvements (v1.2.x)

| Version | Feature | Impact |
|---------|---------|--------|
| v1.2.2 | 3 Flow Commands (/latent-fix, /latent-feature, /latent-status) | UX friction -80% |
| v1.2.2 | Auto-attach Latent Context | Seamless workflow |
| v1.2.2 | Standardized Output Format (phase icons) | Consistency |
| v1.2.1 | Workflow-Latent auto-hook | Integration |
| v1.2.0 | Latent Chain Mode | Token reduction 70-80% |
| v1.1.0 | Security Rules (XSS, Command Injection, etc.) | OWASP compliance |
| v1.1.0 | Audit Logger with SIEM | SOC 2 / GDPR ready |
| v1.1.0 | CI/CD Templates | DevOps integration |

---

## Improvement Proposals Status

### From Enterprise Toolkit Analysis

| # | Proposal | Status | Priority |
|---|----------|--------|----------|
| 1 | Multi-Agent Architecture | ✅ Implemented | - |
| 2 | Project-Specific Memory | ✅ Implemented | - |
| 3 | Slash Commands Enhancement | ✅ Implemented | - |
| 4 | Test Templates Module | ✅ Implemented | - |
| 5 | **CLAUDE.md Parser & Validator** | ❌ Pending | HIGH |
| 6 | **Domain-Specific Validation Rules** | ❌ Pending | HIGH |
| 7 | **Installer & Setup Automation** | ❌ Pending | MEDIUM |
| 8 | API Convention Enforcement | ❌ Pending | LOW |

---

## Roadmap v2.0

### Phase 1: CLAUDE.md Intelligence (Q1 2026)

**Goal:** Tự động parse và enforce conventions từ CLAUDE.md

#### Features

```
CLAUDE.md Parser
├── Section Extractor
│   ├── SYSTEM OVERVIEW
│   ├── TECH STACK DETAILS
│   ├── ARCHITECTURE PRINCIPLES
│   ├── CODING STANDARDS
│   └── COMPLETION CRITERIA
├── Validator
│   ├── Completeness check
│   ├── Consistency check
│   └── Best practices suggestions
├── Generator
│   ├── From project analysis
│   ├── Domain templates
│   └── Interactive wizard
└── Enforcer
    ├── Code convention validation
    ├── Architecture compliance
    └── Pre-commit integration
```

#### MCP Tools

| Tool | Description |
|------|-------------|
| `claude_md_parse` | Parse CLAUDE.md thành structured data |
| `claude_md_validate` | Validate completeness & consistency |
| `claude_md_generate` | Generate từ project analysis |
| `claude_md_enforce` | Check code against CLAUDE.md rules |

#### Effort: ~2-3 weeks

---

### Phase 2: Domain-Specific Rules Engine (Q1 2026)

**Goal:** Validation rules theo domain (Trading, ERP, Orchestration)

#### Features

```
Domain Rules Engine
├── Rule Registry
│   ├── Load from config
│   ├── Load from memory
│   └── Hot reload
├── Domain Validators
│   ├── Trading
│   │   ├── max_leverage_check
│   │   ├── stop_loss_required
│   │   ├── risk_limit_validation
│   │   └── strategy_isolation
│   ├── ERP
│   │   ├── warehouse_scope_check
│   │   ├── negative_stock_prevention
│   │   ├── debt_tracking_validation
│   │   └── pricing_layer_check
│   └── Orchestration
│       ├── idempotency_check
│       ├── retry_safe_validation
│       ├── cost_awareness
│       └── observability_check
├── Risk Scorer
│   ├── Calculate risk score
│   ├── Weighted by domain
│   └── Threshold alerts
└── Compliance Reporter
    ├── Domain compliance %
    ├── Risk distribution
    └── Export formats (PDF, HTML)
```

#### MCP Tools

| Tool | Description |
|------|-------------|
| `domain_rules_load` | Load rules for domain |
| `domain_validate` | Validate code against domain rules |
| `domain_risk_score` | Calculate risk score |
| `domain_compliance_report` | Generate compliance report |

#### Effort: ~3-4 weeks

---

### Phase 3: CLI & Setup Automation (Q2 2026)

**Goal:** One-command setup và project management

#### Features

```
CCG CLI v2
├── Init Commands
│   ├── ccg init --template=trading
│   ├── ccg init --template=erp
│   ├── ccg init --template=orchestration
│   └── ccg init --interactive
├── Doctor Commands
│   ├── ccg doctor --project=.
│   ├── ccg doctor --fix
│   └── ccg doctor --report
├── Migration Commands
│   ├── ccg migrate --from=1.x
│   ├── ccg migrate --backup
│   └── ccg migrate --dry-run
└── Verify Commands
    ├── ccg verify --all
    ├── ccg verify --config
    └── ccg verify --modules
```

#### Features

- **Auto-backup** trước khi modify configs
- **Template library** cho các domain phổ biến
- **Interactive wizard** cho first-time setup
- **Health checks** với actionable suggestions

#### Effort: ~2 weeks

---

### Phase 4: Advanced Features (Q2-Q3 2026)

#### 4.1 API Convention Enforcement

```
API Rules
├── Response Wrapper Check
│   └── { data, message, error }
├── Error Format Check
│   └── { message, code, fields }
├── Versioning Check
│   └── /api/v1/...
└── Breaking Change Detector
    └── Warn on incompatible changes
```

#### 4.2 Smart Caching

```
Context Caching
├── Project Context Cache
│   ├── File structure
│   ├── Dependencies
│   └── Recent changes
├── Memory Query Cache
│   └── LRU cache for recalls
└── Latent Context Snapshots
    └── Quick restore points
```

#### 4.3 Analytics Dashboard

```
CCG Analytics
├── Usage Metrics
│   ├── Token savings from Latent Mode
│   ├── Guard blocks/warnings
│   └── Memory access patterns
├── Project Health Score
│   ├── Security compliance %
│   ├── Test coverage
│   └── Documentation quality
└── Trends
    ├── Issue trends over time
    └── Most common patterns
```

---

## Priority Matrix

```
                    HIGH IMPACT
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │  CLAUDE.md Parser │  Domain Rules     │
    │  (Phase 1)        │  (Phase 2)        │
    │                   │                   │
LOW ├───────────────────┼───────────────────┤ HIGH
EFFORT                  │                  EFFORT
    │                   │                   │
    │  CLI Automation   │  Analytics        │
    │  (Phase 3)        │  (Phase 4)        │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                    LOW IMPACT
```

**Recommended Order:**
1. Phase 1 (CLAUDE.md) - High impact, medium effort
2. Phase 3 (CLI) - Medium impact, low effort
3. Phase 2 (Domain Rules) - High impact, high effort
4. Phase 4 (Advanced) - Nice to have

---

## Technical Debt & Maintenance

### Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| MCP Server crash on unhandled rejections | High | ✅ Fixed in v1.1 |
| Async event handlers without await | Medium | ✅ Fixed |
| Missing try/catch in EventBus emit | Medium | ✅ Fixed |

### Recommended Refactoring

1. **Module Interface Standardization**
   - All modules should implement `CCGModule` interface
   - Consistent `initialize()`, `cleanup()`, `getStatus()` methods

2. **Error Handling Strategy**
   - Centralized error types
   - Consistent error response format
   - Better error recovery

3. **Testing Coverage**
   - Unit tests for all modules (currently partial)
   - Integration tests for MCP tools
   - E2E tests for workflows

---

## Success Metrics

### v2.0 Goals

| Metric | Current | Target |
|--------|---------|--------|
| Token reduction (Latent Mode) | 70-80% | Maintain |
| Setup time | ~10 min | < 2 min (with CLI) |
| Guard rules | 10 | 20+ (with domain rules) |
| User friction (commands) | Medium | Low (3 Flows) |
| Documentation coverage | 80% | 95% |

---

## Contributing

### Adding New Features

1. Create proposal in `docs/proposals/`
2. Discuss in GitHub Issues
3. Implement with test coverage
4. Update documentation
5. Add to changelog

### Code Standards

- TypeScript strict mode
- JSDoc for public APIs
- Unit tests for services
- Guard validation before commit

---

## Appendix

### Memory IDs Referenced

| Proposal | Memory ID |
|----------|-----------|
| Multi-Agent | bf8c61b8-1b4b-4833-b7a6-a062255fbc49 |
| Project Memory | ba491f88-9df3-4a17-87cc-f2073fe16ea2 |
| Slash Commands | e99e03d3-0365-4d5c-b698-efc2d0c21af8 |
| Test Templates | 859eb42c-10c6-46fb-9716-48f7771621c9 |
| CLAUDE.md Parser | aaf4f04e-543f-482d-b035-5162792d89ed |
| Domain Rules | 45a8610c-c4aa-4df8-8ae3-8a83a1013309 |
| CLI Automation | f4edd408-8e3b-47ba-8f5a-5423f0546544 |
| API Convention | 9b25be52-3594-4bcc-87e0-b3b7f821a598 |

---

*Generated using CCG Latent Chain Mode - demonstrating self-improvement capabilities*
