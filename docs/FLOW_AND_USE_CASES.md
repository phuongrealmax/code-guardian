# CCG v3.0 - Application Flow & Use Cases

## Overview

Claude Code Guardian (CCG) is an MCP server that enhances Claude Code with persistent memory, code protection, workflow management, and multi-agent coordination.

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude Code                               │
│                            │                                     │
│                    MCP Protocol (stdio)                          │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   CCG MCP Server                         │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │                  EventBus                        │    │   │
│  │  │    (Central communication between modules)       │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │         │         │         │         │         │       │   │
│  │         ▼         ▼         ▼         ▼         ▼       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │ Memory  │ │  Guard  │ │Workflow │ │ Latent  │ ...   │   │
│  │  │ Module  │ │ Module  │ │ Module  │ │ Module  │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  │         │         │         │         │                 │   │
│  │         ▼         ▼         ▼         ▼                 │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              .ccg/ (Data Storage)                │    │   │
│  │  │  memory.json, tasks.json, agents.json, etc.      │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12 Modules Overview

| # | Module | Purpose | Key Tools |
|---|--------|---------|-----------|
| 1 | **Memory** | Persistent knowledge storage | `memory_store`, `memory_recall` |
| 2 | **Guard** | Code quality & security checks | `guard_validate`, `guard_check_test` |
| 3 | **Workflow** | Task & progress management | `workflow_task_*` |
| 4 | **Resource** | Token usage & checkpoints | `resource_*` |
| 5 | **Process** | Port & process management | `process_*` |
| 6 | **Testing** | Test runner & browser automation | `testing_*` |
| 7 | **Documents** | Documentation management | `documents_*` |
| 8 | **Agents** | Multi-agent coordination | `agents_*` |
| 9 | **Latent** | Hidden-state reasoning (70% token saving) | `latent_*` |
| 10 | **AutoAgent** | Task decomposition & auto-fix | `auto_*` |
| 11 | **Thinking** | Reasoning models & workflows | `thinking_*` |
| 12 | **RAG** | Semantic code search | `rag_*` |

---

## 11 Specialized Agents

```
┌────────────────────────────────────────────────────────────────┐
│                    CCG Agent Ecosystem                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │   Trading   │  │   Laravel   │  │    React    │           │
│   │   Agent     │  │    Agent    │  │    Agent    │           │
│   │ (Quant/Fin) │  │  (PHP/API)  │  │ (Frontend)  │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │    Node     │  │   Python    │  │   DevOps    │           │
│   │   Agent     │  │    Agent    │  │    Agent    │           │
│   │ (Backend)   │  │  (AI/ML)    │  │  (CI/CD)    │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │  Database   │  │  MCP Core   │  │  Module     │           │
│   │   Agent     │  │   Agent     │  │  Architect  │           │
│   │   (DBA)     │  │ (Protocol)  │  │  (Design)   │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐                             │
│   │   Tester    │  │   UI/UX     │                             │
│   │   Agent     │  │    Agent    │                             │
│   │   (QA)      │  │  (Design)   │                             │
│   └─────────────┘  └─────────────┘                             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Use Cases by Domain

### Use Case 1: Trading/Finance Project

**Scenario:** Build a cryptocurrency trading bot with backtesting

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: Trading Bot Development                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. agents_select                                            │
│     task: "Build crypto trading bot"                         │
│     → Returns: trading-agent (100% confidence)               │
│                                                              │
│  2. workflow_task_create                                     │
│     name: "Implement trading strategy"                       │
│     priority: "high"                                         │
│                                                              │
│  3. latent_context_create                                    │
│     taskId: "trading-bot"                                    │
│     constraints: ["Risk management required",                │
│                   "No live trading in dev"]                  │
│                                                              │
│  4. [Analysis Phase]                                         │
│     - Review exchange APIs                                   │
│     - Define risk parameters                                 │
│     - latent_context_update with decisions                   │
│                                                              │
│  5. [Implementation Phase]                                   │
│     - latent_apply_patch for strategy code                   │
│     - guard_validate (check for hardcoded keys)              │
│                                                              │
│  6. [Testing Phase]                                          │
│     - testing_run for backtesting suite                      │
│     - Verify no security issues                              │
│                                                              │
│  7. memory_store                                             │
│     content: "Trading strategy uses MACD + RSI"              │
│     type: "decision"                                         │
│     importance: 9                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Use Case 2: Laravel/PHP API Project

**Scenario:** Build REST API with authentication

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: Laravel API Development                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. agents_select                                            │
│     task: "Build REST API with Laravel"                      │
│     → Returns: laravel-agent (100% confidence)               │
│                                                              │
│  2. agents_coordinate                                        │
│     task: "API with database design"                         │
│     agentIds: ["laravel-agent", "database-agent"]            │
│     mode: "sequential"                                       │
│                                                              │
│  3. [Database Agent First]                                   │
│     - Design schema for users, tokens                        │
│     - Create migration files                                 │
│                                                              │
│  4. [Laravel Agent Second]                                   │
│     - Implement controllers, models                          │
│     - Add Sanctum authentication                             │
│                                                              │
│  5. guard_validate                                           │
│     - Check for SQL injection                                │
│     - Check for hardcoded secrets                            │
│                                                              │
│  6. testing_run                                              │
│     - Run PHPUnit tests                                      │
│     - Verify auth endpoints                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Use Case 3: React Frontend Project

**Scenario:** Build responsive dashboard with state management

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: React Dashboard Development                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. agents_select                                            │
│     task: "Build React dashboard"                            │
│     → Returns: react-agent (100% confidence)                 │
│                                                              │
│  2. agents_coordinate                                        │
│     task: "Dashboard with UI/UX review"                      │
│     agentIds: ["react-agent", "uiux-agent"]                  │
│     mode: "review"                                           │
│                                                              │
│  3. [React Agent Implements]                                 │
│     - Create components with TypeScript                      │
│     - Setup state management (Zustand/Redux)                 │
│     - Add responsive layouts                                 │
│                                                              │
│  4. [UI/UX Agent Reviews]                                    │
│     - Check accessibility (WCAG)                             │
│     - Verify responsive breakpoints                          │
│     - Suggest UX improvements                                │
│                                                              │
│  5. testing_browser_open                                     │
│     url: "http://localhost:3000"                             │
│                                                              │
│  6. testing_browser_screenshot                               │
│     - Capture desktop view                                   │
│     - Capture mobile view                                    │
│                                                              │
│  7. guard_validate                                           │
│     - Check for XSS vulnerabilities                          │
│     - Verify no console.logs in prod                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Use Case 4: Python/ML Project

**Scenario:** Build ML prediction API

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: Python ML API Development                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. agents_select                                            │
│     task: "Build ML prediction API with FastAPI"             │
│     → Returns: python-agent (75% confidence)                 │
│                                                              │
│  2. auto_decompose_task                                      │
│     taskName: "ML Prediction API"                            │
│     → Subtasks:                                              │
│       - Data preprocessing pipeline                          │
│       - Model training script                                │
│       - FastAPI endpoints                                    │
│       - Docker deployment                                    │
│                                                              │
│  3. thinking_get_model                                       │
│     modelName: "chain-of-thought"                            │
│     → Step-by-step reasoning for ML pipeline                 │
│                                                              │
│  4. [Implementation]                                         │
│     - Create data pipelines with pandas                      │
│     - Train model with scikit-learn/PyTorch                  │
│     - Build FastAPI endpoints                                │
│                                                              │
│  5. agents_coordinate                                        │
│     agentIds: ["python-agent", "devops-agent"]               │
│     mode: "sequential"                                       │
│     → DevOps agent creates Dockerfile                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Use Case 5: DevOps/Infrastructure

**Scenario:** Setup CI/CD pipeline with Kubernetes

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: DevOps Pipeline Setup                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. agents_select                                            │
│     task: "Setup CI/CD with Kubernetes"                      │
│     → Returns: devops-agent (100% confidence)                │
│                                                              │
│  2. thinking_get_workflow                                    │
│     workflowName: "deploy"                                   │
│     → Get deployment checklist                               │
│                                                              │
│  3. [Implementation]                                         │
│     - Create Dockerfile                                      │
│     - Write K8s manifests                                    │
│     - Setup GitHub Actions                                   │
│                                                              │
│  4. guard_validate                                           │
│     - Check for hardcoded secrets                            │
│     - Verify no sensitive data in configs                    │
│                                                              │
│  5. process_check_all_ports                                  │
│     → Verify no port conflicts                               │
│                                                              │
│  6. memory_store                                             │
│     content: "K8s namespace: production"                     │
│     type: "convention"                                       │
│     tags: ["devops", "kubernetes"]                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Use Case 6: Database Design

**Scenario:** Design optimized database schema

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: Database Schema Design                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. agents_select                                            │
│     task: "Design PostgreSQL schema with optimization"       │
│     → Returns: database-agent (75% confidence)               │
│                                                              │
│  2. latent_context_create                                    │
│     taskId: "db-schema"                                      │
│     phase: "analysis"                                        │
│     constraints: ["ACID compliance",                         │
│                   "Support 1M+ records"]                     │
│                                                              │
│  3. [Analysis Phase]                                         │
│     - Analyze data relationships                             │
│     - Identify query patterns                                │
│     - latent_context_update with decisions                   │
│                                                              │
│  4. [Plan Phase]                                             │
│     - Design normalized schema                               │
│     - Plan indexes for hot queries                           │
│     - Design partitioning strategy                           │
│                                                              │
│  5. [Implementation Phase]                                   │
│     - Create migration files                                 │
│     - Add indexes                                            │
│     - Setup constraints                                      │
│                                                              │
│  6. memory_store                                             │
│     type: "architecture"                                     │
│     content: "Users table partitioned by created_at"         │
│     importance: 8                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Use Case 7: MCP Server Development

**Scenario:** Build custom MCP tools

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: MCP Tool Development                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. agents_select                                            │
│     task: "Build MCP tools with JSON-RPC"                    │
│     → Returns: mcp-core-agent (70% confidence)               │
│                                                              │
│  2. agents_coordinate                                        │
│     agentIds: ["mcp-core-agent", "module-architect-agent"]   │
│     mode: "sequential"                                       │
│                                                              │
│  3. [Module Architect First]                                 │
│     - Design tool interfaces                                 │
│     - Plan EventBus integration                              │
│     - Define service patterns                                │
│                                                              │
│  4. [MCP Core Agent Second]                                  │
│     - Implement tool handlers                                │
│     - Setup JSON-RPC responses                               │
│     - Add input schema validation                            │
│                                                              │
│  5. guard_validate                                           │
│     - Check for prompt injection                             │
│     - Verify input validation                                │
│                                                              │
│  6. testing_run                                              │
│     - Run tool unit tests                                    │
│     - Test with mock Claude requests                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Use Case 8: Testing & QA

**Scenario:** Comprehensive test suite implementation

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: Test Suite Implementation                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. agents_select                                            │
│     task: "Write comprehensive tests with Jest"              │
│     → Returns: tester-agent (100% confidence)                │
│                                                              │
│  2. thinking_get_workflow                                    │
│     workflowName: "code-review"                              │
│     → Get testing checklist                                  │
│                                                              │
│  3. [Unit Tests]                                             │
│     - Write tests for each function                          │
│     - Add edge case coverage                                 │
│     - Mock external dependencies                             │
│                                                              │
│  4. [Integration Tests]                                      │
│     - Test API endpoints                                     │
│     - Test database operations                               │
│     - Test service interactions                              │
│                                                              │
│  5. [E2E Tests with Playwright]                              │
│     - testing_browser_open                                   │
│     - Test critical user flows                               │
│     - testing_browser_screenshot                             │
│                                                              │
│  6. guard_check_test                                         │
│     - Verify no fake tests                                   │
│     - Check assertion coverage                               │
│                                                              │
│  7. testing_run                                              │
│     coverage: true                                           │
│     → Generate coverage report                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Use Case 9: UI/UX Design Implementation

**Scenario:** Implement design system with accessibility

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: UI/UX Design System                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. agents_select                                            │
│     task: "Implement Tailwind design system"                 │
│     → Returns: uiux-agent (95% confidence)                   │
│                                                              │
│  2. agents_coordinate                                        │
│     agentIds: ["uiux-agent", "react-agent"]                  │
│     mode: "parallel"                                         │
│                                                              │
│  3. [UI/UX Agent]                                            │
│     - Define color palette                                   │
│     - Setup typography scale                                 │
│     - Create spacing system                                  │
│     - Design component variants                              │
│                                                              │
│  4. [React Agent]                                            │
│     - Implement component library                            │
│     - Add Storybook documentation                            │
│     - Create reusable hooks                                  │
│                                                              │
│  5. guard_validate                                           │
│     - Check for accessibility                                │
│     - Verify no hardcoded colors                             │
│                                                              │
│  6. testing_browser_open                                     │
│     → Visual regression testing                              │
│                                                              │
│  7. thinking_save_snippet                                    │
│     category: "React Component"                              │
│     code: "<Button variant='primary'>..."                    │
│     → Save as style reference                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Latent Chain Mode Flow

### 4-Phase Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                  Latent Chain Mode                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│   │    🔍    │───▶│    📋    │───▶│    🔧    │───▶│   ✅   ││
│   │ Analysis │    │   Plan   │    │   Impl   │    │ Review ││
│   └──────────┘    └──────────┘    └──────────┘    └────────┘│
│        │               │               │               │     │
│        ▼               ▼               ▼               ▼     │
│   - Read code     - Design      - Apply        - Run tests  │
│   - Find issues     patches       patches      - Validate   │
│   - Identify      - Order       - Track        - Complete   │
│     hot spots       changes       artifacts      task       │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Context Delta (Not Full Text!)          │   │
│   │   {                                                  │   │
│   │     "codeMap": { "hotSpots": ["file:line"] },        │   │
│   │     "decisions": [{ "id": "D001", "summary": "..." }],│   │
│   │     "risks": ["potential issue"]                     │   │
│   │   }                                                  │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   Token Savings: 70-80% compared to traditional approach    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Quick Commands

| Command | Use Case | Phases |
|---------|----------|--------|
| `/latent-fix` | Quick bug fix | analysis → impl → review |
| `/latent-feature` | New feature | all 4 phases |
| `/latent-review` | Code review | analysis → review only |

---

## Multi-Agent Coordination Modes

### Sequential Mode
```
Agent A ──────▶ Agent B ──────▶ Agent C
   │               │               │
   ▼               ▼               ▼
 Output A      Output B        Output C
 (input B)     (input C)       (final)
```

### Parallel Mode
```
        ┌──────▶ Agent A ──────┐
        │                      │
Task ───┼──────▶ Agent B ──────┼───▶ Merge Results
        │                      │
        └──────▶ Agent C ──────┘
```

### Review Mode
```
Agent A ──────▶ Agent B ──────▶ Agent C
   │               │               │
   ▼               ▼               ▼
 Implement      Review          Approve
               (feedback)      (or reject)
```

---

## Common Workflows

### 1. Session Start
```bash
session_init → memory_recall → workflow_task_list
```

### 2. Feature Development
```bash
workflow_task_create → agents_select → latent_context_create
→ [4 phases] → guard_validate → testing_run → memory_store
```

### 3. Bug Fix (Quick)
```bash
/latent-fix → [auto analysis] → [apply patch] → testing_run
```

### 4. Code Review
```bash
/latent-review → agents_coordinate(mode: review) → guard_validate
```

### 5. Session End
```bash
workflow_task_pause → memory_store → session_end
```

---

## Best Practices Summary

| Do | Don't |
|----|-------|
| Use agents_select for task matching | Hardcode agent selection |
| Send delta only in Latent Mode | Send full context every time |
| Create checkpoints before risky ops | Skip checkpoints |
| Run guard_validate before commit | Ignore security warnings |
| Store important decisions in memory | Rely on context window |
| Use appropriate coordination mode | Always use sequential |
| Follow 4-phase workflow | Skip phases |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Agent not found | `agents_reload` to refresh |
| Latent context lost | `latent_list_contexts` to check |
| Memory not persisting | Check `.ccg/` directory permissions |
| Port conflict | `process_kill_on_port` |
| Tests failing | `testing_browser_logs` for errors |
| Guard blocking | Fix issues, don't disable rules |

---

*Generated by CCG v3.0 - Claude Code Guardian*
