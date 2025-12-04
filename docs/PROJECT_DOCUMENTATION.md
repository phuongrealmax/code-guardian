# Claude Code Guardian (CCG) - Project Documentation

> Version 2.1.0 | Updated: December 1, 2025

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Infrastructure](#core-infrastructure)
4. [Modules](#modules)
5. [MCP-First Mode](#mcp-first-mode) (NEW)
6. [MCP Tools Reference](#mcp-tools-reference)
7. [Configuration](#configuration)
8. [Usage Guide](#usage-guide)
9. [Development](#development)

---

## Overview

### What is Claude Code Guardian?

Claude Code Guardian (CCG) is an MCP (Model Context Protocol) server that enhances Claude's coding capabilities with:

- **Persistent Memory** - Store decisions, facts, patterns across sessions
- **Code Validation** - Guard against fake tests, empty catches, disabled features
- **Multi-Agent Architecture** - Specialized agents for different domains
- **Project-Scoped Context** - Domain-specific business rules and conventions
- **Workflow Management** - Task tracking and progress monitoring
- **Resource Management** - Token usage and checkpoint system
- **Process Management** - Port and process lifecycle control
- **Testing Support** - Test templates and browser automation
- **Document Management** - Document registry and update detection

### Key Features

| Feature | Description |
|---------|-------------|
| Memory Module | Persistent SQLite-backed memory with search, recall, and **zero retention mode** |
| Guard Module | Code validation with **10 security rules** (OWASP Top 10 + AI security) |
| Agents Module | Multi-agent system with delegation rules |
| Commands Module | Slash command registry with templates |
| Workflow Module | Task creation, tracking, progress |
| Resource Module | Token tracking, auto-checkpoints |
| Process Module | Port management, process spawning |
| Testing Module | Test runner, browser automation, templates |
| Documents Module | Document registry, update detection |
| **Latent Module** | **Latent Chain Mode - 3 Flows (/latent-fix, /latent-feature, /latent-review), auto-attach, step logging, 70-80% token reduction** |
| **Thinking Module** | **6 Thinking Models (CoT, ToT, ReAct, etc.), 7 Workflows/SOPs, Code Style RAG** |
| **AutoAgent Module** | **Autonomous agent capabilities - TaskDecomposer, ToolRouter, AutoFixLoop, ErrorMemory** |
| **MCP-First Mode** | **NEW: Enforced MCP tool usage for all code changes, auto-attach latent context, step logging observer pattern** |
| **Audit Logger** | **Immutable audit trail with SIEM export (JSON, Syslog, CEF)** |
| **CI/CD Templates** | **GitHub Actions, GitLab CI, Pre-commit hooks** |

### Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Protocol**: MCP (Model Context Protocol)
- **Database**: SQLite (better-sqlite3)
- **Browser**: Playwright (optional)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude Code                               │
│                    (MCP Client)                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ MCP Protocol (stdio)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CCG MCP Server                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Core Infrastructure                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐  │   │
│  │  │ EventBus │ │  Logger  │ │ConfigMgr   │ │ StateMgr │  │   │
│  │  └──────────┘ └──────────┘ └────────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      Modules                              │   │
│  │  ┌────────┐ ┌───────┐ ┌────────┐ ┌──────────┐          │   │
│  │  │ Memory │ │ Guard │ │ Agents │ │ Commands │          │   │
│  │  └────────┘ └───────┘ └────────┘ └──────────┘          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐   │   │
│  │  │ Workflow │ │ Resource │ │ Process │ │  Testing  │   │   │
│  │  └──────────┘ └──────────┘ └─────────┘ └───────────┘   │   │
│  │  ┌───────────┐ ┌────────────────────────────────────┐  │   │
│  │  │ Documents │ │ Latent (Latent Chain Mode)         │  │   │
│  │  └───────────┘ └────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Thinking (Models, Workflows, Code Style)          │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ AutoAgent (Decompose, Route, AutoFix, Memory) NEW │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Persistent Storage                          │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │  memory.db   │  │ project-memory  │  │   checkpoints    │   │
│  │   (SQLite)   │  │    (.json)      │  │     (.json)      │   │
│  └──────────────┘  └─────────────────┘  └──────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  latent-contexts.json (Latent Chain Mode contexts)       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
claude-code-guardian/
├── src/
│   ├── core/                    # Core infrastructure
│   │   ├── types.ts            # Type definitions
│   │   ├── event-bus.ts        # Event system
│   │   ├── logger.ts           # Logging utility
│   │   ├── config-manager.ts   # Configuration management
│   │   ├── state-manager.ts    # Session state
│   │   ├── audit-logger.ts     # Immutable audit trail (NEW)
│   │   └── index.ts            # Core exports
│   │
│   ├── modules/                 # Feature modules
│   │   ├── memory/             # Memory module
│   │   │   ├── memory.types.ts
│   │   │   ├── memory.service.ts
│   │   │   ├── memory.tools.ts
│   │   │   ├── project-memory.ts  # Project-scoped memory
│   │   │   └── index.ts
│   │   │
│   │   ├── guard/              # Code validation
│   │   │   ├── guard.types.ts
│   │   │   ├── guard.service.ts
│   │   │   ├── guard.tools.ts
│   │   │   ├── rules/          # Validation rules
│   │   │   └── index.ts
│   │   │
│   │   ├── agents/             # Multi-agent system
│   │   │   ├── agents.types.ts
│   │   │   ├── agents.service.ts
│   │   │   ├── agents.tools.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── commands/           # Slash commands
│   │   │   ├── commands.types.ts
│   │   │   ├── commands.service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── workflow/           # Task management
│   │   ├── resource/           # Token & checkpoints
│   │   ├── process/            # Port & process management
│   │   ├── testing/            # Test runner & templates
│   │   ├── documents/          # Document registry
│   │   ├── latent/             # Latent Chain Mode (NEW)
│   │   │   ├── latent.types.ts # Types & interfaces
│   │   │   ├── latent.service.ts # Core service
│   │   │   ├── latent.tools.ts # MCP tools
│   │   │   └── index.ts
│   │   ├── thinking/           # Thinking Models & Workflows
│   │   │   ├── thinking.types.ts # Types & interfaces
│   │   │   ├── thinking.data.ts  # Models & workflows data
│   │   │   ├── thinking.service.ts # Core service
│   │   │   ├── thinking.tools.ts # MCP tools
│   │   │   ├── thinking.module.ts # Module class
│   │   │   └── index.ts
│   │   ├── auto-agent/         # AutoAgent Module (NEW)
│   │   │   ├── auto-agent.types.ts # Type definitions
│   │   │   ├── task-decomposer.ts  # Task decomposition service
│   │   │   ├── tool-router.ts      # Tool routing service
│   │   │   ├── auto-fix-loop.ts    # Self-healing error correction
│   │   │   ├── error-memory.ts     # Error pattern memory
│   │   │   ├── auto-agent.service.ts # Main orchestrator
│   │   │   ├── auto-agent.tools.ts # MCP tools
│   │   │   └── index.ts
│   │   └── index.ts            # Module exports
│   │
│   ├── hooks/                   # Hook handlers
│   │   ├── session-start.hook.ts
│   │   ├── pre-tool-call.hook.ts
│   │   ├── post-tool-call.hook.ts
│   │   ├── session-end.hook.ts
│   │   └── index.ts
│   │
│   ├── bin/                     # CLI tools
│   │   ├── ccg.ts              # Main CLI
│   │   └── hook-command.ts     # Hook executor
│   │
│   ├── server.ts               # MCP server factory
│   └── index.ts                # Entry point
│
├── templates/                   # Configuration templates
│   ├── ci-cd/                  # CI/CD templates (NEW)
│   │   ├── github-actions.yml  # GitHub Actions workflow
│   │   ├── gitlab-ci.yml       # GitLab CI pipeline
│   │   └── pre-commit-config.yaml
│   ├── commands/               # Slash command templates
│   └── examples/               # Config examples
├── schemas/                     # JSON schemas
├── docs/                        # Documentation
├── dist/                        # Compiled output
└── .ccg/                        # Runtime data directory
    └── audit/                  # Audit logs (NEW)
```

---

## Core Infrastructure

### EventBus

Central event system for inter-module communication.

```typescript
// Event Types
type CCGEventType =
  | 'session:start' | 'session:end'
  | 'task:create' | 'task:complete'
  | 'guard:warning' | 'guard:block'
  | 'memory:store' | 'memory:recall'
  | 'agent:registered' | 'agent:selected'
  | 'resource:checkpoint'
  // ... more events

// Usage
eventBus.emit({
  type: 'memory:store',
  timestamp: new Date(),
  data: { id: 'mem-123', type: 'decision' }
});

eventBus.on('memory:store', (event) => {
  console.log('Memory stored:', event.data);
});
```

### Logger

Structured logging with levels and context.

```typescript
const logger = new Logger('info', 'ModuleName');

logger.debug('Debug message', { data: 'value' });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

### ConfigManager

Configuration loading and management.

```typescript
const config = await configManager.load();
const memoryConfig = await configManager.get('modules.memory');
```

### StateManager

Session state management.

```typescript
const session = stateManager.createSession();
stateManager.getSession();
stateManager.endSession();
```

### AuditLogger (NEW)

Immutable audit trail for compliance (SOC 2, GDPR, HIPAA).

#### Features
- **Append-only logging** - No modification or deletion allowed
- **Hash chain integrity** - Each entry links to previous via cryptographic hash
- **Tamper detection** - Verify log integrity
- **SIEM export** - JSON, Syslog (RFC 5424), CEF (ArcSight) formats

#### Usage
```typescript
import { AuditLogger, initAuditLogger } from './core/audit-logger';

// Initialize
const auditLogger = await initAuditLogger({
  enabled: true,
  logPath: '.ccg/audit/audit.log',
  format: 'json',
  hashAlgorithm: 'sha256'
});

// Log an action
await auditLogger.log(
  'guard:validate',           // action
  { type: 'system', id: 'ccg' },  // actor
  { type: 'file', id: 'app.ts' }, // resource
  { rules: ['xss', 'sql-injection'] }, // details
  'success'                   // outcome
);

// Verify integrity
const valid = await auditLogger.verifyIntegrity();

// Export for SIEM (Splunk, Datadog, etc.)
const syslog = await auditLogger.exportSIEM('syslog');
const cef = await auditLogger.exportSIEM('cef');
```

#### Audit Entry Structure
```typescript
interface AuditEntry {
  id: string;
  timestamp: string;
  sequence: number;
  action: AuditAction;
  actor: { type: 'user' | 'system' | 'agent'; id: string };
  resource: { type: string; id: string };
  details: Record<string, unknown>;
  outcome: 'success' | 'failure' | 'blocked';
  previousHash: string;  // Hash chain
  hash: string;          // SHA-256 of entry
}
```

#### Supported SIEM Formats
| Format | Description | Use Case |
|--------|-------------|----------|
| JSON | Structured JSON | Splunk, Elasticsearch |
| Syslog | RFC 5424 | Traditional SIEM |
| CEF | Common Event Format | ArcSight, QRadar |

---

## Modules

### 1. Memory Module

Persistent memory storage with SQLite backend.

#### Features
- Store decisions, facts, code patterns, errors
- Search and recall with relevance scoring
- Duplicate detection and merging
- Importance-based retention
- **Zero Retention Mode** - GDPR compliance, no disk persistence
- **Retention Policy** - Auto-delete memories older than N days

#### Types
```typescript
type MemoryType =
  | 'decision'      // Choices made
  | 'fact'          // Learned information
  | 'code_pattern'  // Reusable code
  | 'error'         // Mistakes to avoid
  | 'note'          // General notes
  | 'convention'    // Project rules
  | 'architecture'; // System design
```

#### Configuration
```typescript
interface MemoryModuleConfig {
  enabled: boolean;
  maxItems: number;
  autoSave: boolean;
  persistPath: string;
  compressionEnabled: boolean;
  zeroRetention?: boolean;    // GDPR: Memory only, no disk
  retentionDays?: number;     // Auto-cleanup after N days
}
```

#### Zero Retention Mode (GDPR Compliance)
```json
{
  "modules": {
    "memory": {
      "enabled": true,
      "zeroRetention": true,
      "retentionDays": 30
    }
  }
}
```
When `zeroRetention: true`, memories exist only in RAM and are not persisted to SQLite. Perfect for handling sensitive data.

#### Project-Scoped Memory

Domain-specific memory with business principles.

```typescript
// Supported domains
type ProjectDomain =
  | 'erp'           // ERP systems
  | 'trading'       // Trading platforms
  | 'orchestration' // Worker/queue systems
  | 'ecommerce'     // E-commerce
  | 'cms'           // Content management
  | 'api'           // API services
  | 'general';      // Generic

// Business principles per domain
const ERP_PRINCIPLES = [
  'All inventory operations must be warehouse-scoped',
  'Negative stock is not allowed by default',
  'Customer debt must be tracked per transaction'
];

const TRADING_PRINCIPLES = [
  'Max leverage must be configurable and enforced',
  'Stop loss is required for all positions',
  'Strategy logic must be isolated and testable'
];
```

### 2. Guard Module

Code validation and security enforcement with **10 built-in rules**.

#### Quality Rules
| Rule | Description | Category |
|------|-------------|----------|
| `fake-test` | Detect tests without assertions | Testing |
| `disabled-feature` | Find commented/disabled code | Security |
| `empty-catch` | Find empty catch blocks | Quality |
| `emoji-code` | Detect emojis in code | Convention |

#### Security Rules (OWASP Top 10)
| Rule | Description | CWE |
|------|-------------|-----|
| `sql-injection` | Detect SQL injection patterns | CWE-89 |
| `hardcoded-secrets` | Find API keys, passwords, tokens | CWE-798 |
| `xss-vulnerability` | Detect XSS risks (innerHTML, etc.) | CWE-79 |
| `command-injection` | Detect OS command injection | CWE-78 |
| `path-traversal` | Detect path traversal attacks | CWE-22 |

#### AI/LLM Security Rules
| Rule | Description |
|------|-------------|
| `prompt-injection` | Detect prompt injection vulnerabilities in AI code |

#### Rule Configuration
```typescript
interface GuardRules {
  // Quality rules
  blockFakeTests: boolean;
  blockDisabledFeatures: boolean;
  blockEmptyCatch: boolean;
  blockEmojiInCode: boolean;

  // Security rules (default: true)
  blockSqlInjection?: boolean;
  blockHardcodedSecrets?: boolean;
  blockXss?: boolean;
  blockCommandInjection?: boolean;
  blockPathTraversal?: boolean;

  // AI Security (default: true)
  blockPromptInjection?: boolean;
}
```

#### Validation Result
```typescript
interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  blocked: boolean;
  suggestions: string[];
}
```

#### Example: Security Scan
```typescript
// This code will be BLOCKED by CCG Guard
const userInput = req.body.name;
document.innerHTML = userInput;           // XSS blocked
exec(`ls ${req.query.dir}`);              // Command injection blocked
fs.readFile(req.params.path);             // Path traversal blocked
const prompt = `User: ${userInput}`;      // Prompt injection blocked
```

### 3. Agents Module

Multi-agent architecture for specialized task handling.

#### Built-in Agents

| Agent | Role | Specializations |
|-------|------|-----------------|
| `trading-agent` | Quant & Trading Engineer | Trading logic, risk management, backtesting |
| `laravel-agent` | Laravel Backend Engineer | PHP, Eloquent, REST APIs, migrations |
| `react-agent` | React Frontend Engineer | React, TypeScript, components, hooks |
| `node-agent` | Node.js Orchestration Engineer | Workers, queues, event-driven |

#### Delegation Rules
```typescript
interface DelegationRule {
  id: string;
  pattern: string;           // Pattern to match
  matchType: 'keyword' | 'file_pattern' | 'domain' | 'regex';
  priority: number;          // Higher = more specific
}
```

#### Agent Selection
```typescript
// Select best agent for a task
const selection = agentsModule.selectAgent({
  task: 'Implement trading strategy backtest',
  files: ['strategy.py', 'backtest.py'],
  domain: 'trading'
});
// Returns: { agent: trading-agent, confidence: 0.85, reason: '...' }
```

#### Cross-Agent Coordination
```typescript
const result = agentsModule.coordinateAgents({
  task: 'Full-stack feature review',
  agentIds: ['react-agent', 'laravel-agent'],
  mode: 'review'  // 'sequential' | 'parallel' | 'review'
});
```

### 4. Commands Module

Slash command registry and execution.

#### Built-in Commands

**Base Commands (All projects)**
| Command | Description |
|---------|-------------|
| `/add-endpoint` | Create API endpoint with tests |
| `/build-dashboard` | Create dashboard component |
| `/full-review` | Comprehensive code review |
| `/risk-check` | Security risk analysis |

**ERP Commands**
| Command | Description |
|---------|-------------|
| `/add-crud` | Generate CRUD operations |
| `/add-report` | Create report with filters |
| `/check-stock` | Validate inventory code |
| `/debt-flow` | Review debt tracking |

**Trading Commands**
| Command | Description |
|---------|-------------|
| `/backtest` | Create/review backtest |
| `/live-trade-check` | Pre-deployment safety |
| `/strategy-review` | Review strategy code |

**Orchestration Commands**
| Command | Description |
|---------|-------------|
| `/add-worker` | Create background worker |
| `/orchestration-flow` | Design/review flow |
| `/cost-analysis` | Analyze API costs |

#### Command Execution
```typescript
const result = commandsModule.executeCommand('/add-endpoint users POST');
// Returns expanded prompt with arguments substituted
```

### 5. Workflow Module

Task management and progress tracking.

#### Task States
```
pending → in_progress → completed
              ↓
           paused
              ↓
           blocked → failed
```

#### Task Operations
```typescript
// Create task
const task = await workflowModule.createTask({
  name: 'Implement auth',
  priority: 'high',
  tags: ['auth', 'security']
});

// Start task
await workflowModule.startTask(task.id);

// Update progress
await workflowModule.updateProgress(task.id, 50);

// Complete task
await workflowModule.completeTask(task.id);
```

### 6. Resource Module

Token usage tracking and checkpoints.

#### Features
- Token usage monitoring
- Auto-checkpoints at thresholds (70%, 85%, 95%)
- Manual checkpoint creation
- Checkpoint restoration

#### Checkpoints
```typescript
// Create checkpoint
await resourceModule.createCheckpoint({
  name: 'Before refactoring',
  reason: 'before_risky_operation'
});

// List checkpoints
const checkpoints = await resourceModule.listCheckpoints();

// Restore from checkpoint
await resourceModule.restoreCheckpoint(checkpointId);
```

### 7. Process Module

Port and process lifecycle management.

#### Features
- Port availability checking
- Process spawning with tracking
- Automatic cleanup on session end
- Kill processes on port

#### Operations
```typescript
// Check port
const status = await processModule.checkPort(3000);

// Spawn process
const result = await processModule.spawn({
  command: 'npm',
  args: ['run', 'dev'],
  port: 3000,
  name: 'dev-server'
});

// Kill on port
await processModule.killOnPort(3000);
```

### 8. Testing Module

Test execution and browser automation.

#### Test Templates

| Template | Stack | Type |
|----------|-------|------|
| Laravel CRUD Test | PHP/PHPUnit | CRUD operations |
| React Component Test | Jest/RTL | Component testing |
| Python Backtest Test | pytest | Trading strategy |
| Node.js Worker Test | Jest | Background jobs |

#### Browser Testing
```typescript
// Open browser
const session = await testingModule.openBrowser('http://localhost:3000');

// Take screenshot
const screenshot = await testingModule.screenshot(session.id);

// Get console logs
const logs = await testingModule.getConsoleLogs(session.id);

// Close browser
await testingModule.closeBrowser(session.id);
```

### 9. Documents Module

Document registry and management.

#### Features
- Automatic document discovery
- Document type detection
- Update detection (prevent duplicates)
- Search by content or type

#### Document Types
```typescript
type DocumentType =
  | 'readme'       // README files
  | 'spec'         // Specifications
  | 'api'          // API documentation
  | 'guide'        // How-to guides
  | 'changelog'    // Change logs
  | 'architecture' // Architecture docs
  | 'config'       // Configuration docs
  | 'other';       // Miscellaneous
```

### 10. Latent Module (NEW)

**Latent Chain Mode** - Hidden-state reasoning inspired by Stanford/Princeton/UIUC research papers.

#### Key Benefits
- **70-80% Token Reduction** - Send only changes (delta), not full context
- **3-4x Speed Improvement** - For multi-agent workflows
- **KV-Cache Pattern** - AgentLatentContext acts like hidden state
- **4-Phase Workflow** - Structured approach to complex tasks

#### Core Concept

Instead of verbose text responses, Claude outputs structured JSON:

```typescript
// LatentResponse - What Claude outputs
interface LatentResponse {
  summary: string;           // Max 1-2 sentences
  contextDelta: ContextDelta; // Only changes, not full context
  actions: LatentAction[];    // Concrete actions to execute
  phaseCompleted?: LatentPhase;
  nextPhase?: LatentPhase;
  taskComplete?: boolean;
}
```

#### AgentLatentContext Structure

The "KV-cache" for hidden-state reasoning:

```typescript
interface AgentLatentContext {
  taskId: string;
  phase: 'analysis' | 'plan' | 'impl' | 'review';

  codeMap: {
    files: string[];      // Files involved
    hotSpots: string[];   // Areas needing attention
    components: string[]; // Affected components
  };

  constraints: string[];  // Rules to follow
  risks: string[];        // Identified risks

  decisions: [{
    id: string;           // e.g., "D001"
    summary: string;      // Brief summary
    rationale: string;    // Short reason
    phase: LatentPhase;
  }];

  artifacts: {
    tests: string[];
    endpoints: string[];
    patches: AppliedPatch[];
  };

  version: number;        // For concurrency control
}
```

#### Context Delta (Key Feature!)

Instead of sending full context, send only **what changed**:

```typescript
interface ContextDelta {
  phase?: LatentPhase;
  codeMap?: Partial<CodeMap>;
  constraints?: string[];      // New constraints to ADD
  risks?: string[];            // New risks to ADD
  decisions?: LatentDecision[]; // New decisions to ADD
  artifacts?: Partial<TaskArtifacts>;

  remove?: {                   // Items to REMOVE
    constraints?: string[];
    risks?: string[];
    decisions?: string[];      // By ID
  };
}
```

**Example - Token Savings:**
```json
// WITHOUT Latent Mode: Send full context every time (~2000 tokens)
{
  "taskId": "fix-auth",
  "phase": "impl",
  "codeMap": { "files": [...20 files...], "hotSpots": [...], ... },
  "constraints": [...10 rules...],
  "decisions": [...15 decisions...],
  // ... full context
}

// WITH Latent Mode: Send only delta (~100 tokens)
{
  "contextDelta": {
    "codeMap": { "hotSpots": ["src/auth/login.ts:45"] },
    "decisions": [{ "id": "D016", "summary": "Use JWT refresh", "rationale": "Security best practice" }]
  }
}
```

#### 4-Phase Workflow

```
┌─────────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  ANALYSIS   │ ──► │  PLAN   │ ──► │  IMPL   │ ──► │ REVIEW  │
│             │     │         │     │         │     │         │
│ - Read req  │     │ - Tasks │     │ - Patch │     │ - Check │
│ - Hot spots │     │ - Order │     │ - Code  │     │ - Verify│
│ - Decisions │     │ - Deps  │     │ - Test  │     │ - Done? │
└─────────────┘     └─────────┘     └─────────┘     └─────────┘
                          │               │
                          └───────────────┘
                         (can go back for fixes)
```

#### Latent Actions

```typescript
type LatentActionType =
  | 'edit_file'      // Modify existing file
  | 'create_file'    // Create new file
  | 'delete_file'    // Remove file
  | 'apply_patch'    // Apply unified diff
  | 'run_command'    // Execute command
  | 'run_tests'      // Run test suite
  | 'refactor'       // Refactoring task
  | 'add_dependency' // Add package
  | 'custom';        // Custom action

interface LatentAction {
  type: LatentActionType;
  target: string;       // File path, command, etc.
  description: string;  // Brief description
  patch?: string;       // For apply_patch
  command?: string;     // For run_command
  order?: number;       // Execution order
}
```

#### Configuration

```typescript
interface LatentModuleConfig {
  enabled: boolean;
  maxContexts: number;        // Max contexts in memory (default: 50)
  autoMerge: boolean;         // Auto-merge deltas (default: true)
  persist: boolean;           // Save to disk (default: true)
  persistPath?: string;       // Default: .ccg/latent-contexts.json
  strictValidation: boolean;  // Strict response validation
  maxSummaryLength: number;   // Max summary chars (default: 200)
  maxDecisions: number;       // Max decisions per context (default: 100)
  cleanupAfterMs: number;     // Auto-cleanup after (default: 24h)
}
```

#### Usage Example

```typescript
// 1. Create context at task start
const ctx = await latent.createContext({
  taskId: 'fix-auth-bug',
  phase: 'analysis',
  constraints: ['No breaking changes', 'Must pass tests'],
  files: ['src/auth/login.ts']
});

// 2. Update with delta (not full context!)
await latent.updateContext({
  taskId: 'fix-auth-bug',
  delta: {
    codeMap: { hotSpots: ['src/auth/login.ts:45-60'] },
    decisions: [{
      id: 'D001',
      summary: 'Root cause: token not refreshed',
      rationale: 'Expires after 1h, no refresh logic'
    }],
    risks: ['May affect existing sessions']
  }
});

// 3. Transition phase
await latent.transitionPhase({
  taskId: 'fix-auth-bug',
  toPhase: 'plan',
  summary: 'Analysis complete, identified root cause'
});

// 4. Apply patch during impl
await latent.applyPatch({
  taskId: 'fix-auth-bug',
  target: 'src/auth/login.ts',
  patch: `--- a/src/auth/login.ts
+++ b/src/auth/login.ts
@@ -45,3 +45,5 @@
-const token = generateToken();
+const token = generateToken();
+scheduleTokenRefresh(token, 50 * 60 * 1000);`
});

// 5. Complete task
await latent.completeTask('fix-auth-bug', 'Fixed token refresh bug');
```

#### Rules for Latent Mode

**DO:**
- Keep summary to 1-2 sentences max
- Send only delta, not full context
- Use structured actions
- Track decisions with IDs

**DON'T:**
- Write long explanations
- Repeat information from context
- Send full context on every update
- Output code without actions

#### Workflow Integration

The Latent Module integrates automatically with Workflow Module:

```typescript
// When workflow_task_create is called:
// → Auto-creates AgentLatentContext
// → Sets phase to 'analysis'
// → Records task name/description as D001 decision

// When workflow_task_complete is called:
// → Auto-completes matching latent context
// → Saves final state
```

**Hook Implementation** (in `post-tool-call.hook.ts`):
- `autoCreateLatentContext()` - Creates context on task creation
- `autoCompleteLatentContext()` - Completes context on task done

#### 3 Flows (Quick Commands) - NEW in v1.2.2

| Flow | Command | Use Case |
|------|---------|----------|
| **A** | `/latent-fix` | Quick fix 1-2 patches, file đang mở |
| **B** | `/latent-feature` | Feature/Refactor nhiều files |
| **C** | `/latent-review` | Review/Audit không sửa code |

**Status check:** `/latent-status`

**Mandatory Rules:**
> Mọi task từ 2 bước trở lên → PHẢI dùng Latent Flow
> Nếu user không yêu cầu giải thích → max 2 câu summary

#### Output Format (Human-Readable) - NEW in v1.2.2

**Trong editor, output theo format chuẩn với phase icons:**

```
🔍 [analysis] <tiêu đề ngắn>
<1-2 câu mô tả>

[Hot Spots] file:line, file:line
[Decisions] D001: ..., D002: ...
[Risks] nếu có

---

📋 [plan] <số patches/tasks>

[Patches] hoặc [Sub-tasks]
1. file:line - mô tả
2. file:line - mô tả

---

🔧 [impl] Patch N/M: <name>
Applied: <count> | Tests: <status>

---

✅ [review] Complete
Files: N | Patches: M | Tests: passed
```

**Phase Icons:**
- 🔍 `analysis` - Phân tích vấn đề
- 📋 `plan` - Lên kế hoạch
- 🔧 `impl` - Thực hiện
- ✅ `review` - Kiểm tra hoàn thành

#### Auto-Attach Latent Context (MCP-First Mode) - Updated v2.1.0

CCG tự động attach latent context khi:
1. Có workflow task đang chạy
2. Claude gọi bất kỳ tool trong `autoAttachTriggerTools`
3. Chưa có latent context cho task đó
4. Write operations (edit_file, write_file, create_file, str_replace_editor)

**Configuration:**
```json
{
  "modules": {
    "latent": {
      "enabled": true,
      "autoAttach": true,  // Enable auto-attach (default: true)
      "autoAttachTriggerTools": [
        "guard_validate",
        "guard_check_test",
        "testing_run",
        "testing_run_affected",
        "write_file",
        "edit_file",
        "create_file",
        "str_replace_editor",
        "memory_store",
        "workflow_task_start"
      ]
    }
  }
}
```

**Implementation:** `src/hooks/pre-tool-call.hook.ts` (line 330-493)

**MCP-First Mode Constraints:**
- Auto-attach với constraint: "MCP-First Mode: All changes must go through MCP tools"
- Auto-update context khi có file mới
- Log event `latent:context:created` với `mcpFirstMode: true`

#### Step Logging (Observer Pattern) - NEW in v2.1.0

Tool `latent_step_log` cho phép log các bước reasoning mà không cần thay đổi code:

```typescript
// Log a reasoning step
await latent.stepLog({
  taskId: 'fix-auth-bug',
  phase: 'analysis',
  description: 'Identified root cause: token validation skips expiry check',
  affectedFiles: ['src/auth/token.ts', 'src/auth/validate.ts'],
  decisions: ['D001: Add expiry check before token use'],
  risks: ['May affect existing sessions'],
  nextAction: 'Transition to plan phase to design fix'
});
```

**Use Cases:**
- Bắt đầu một nhóm thay đổi lớn (multi-file, refactor)
- Đưa ra quyết định kiến trúc quan trọng
- Chuyển giữa các phase
- Hoàn thành một milestone trong task

**Auto-Context Creation:**
Nếu taskId chưa có context, `latent_step_log` sẽ tự động tạo context mới.

#### Slash Commands

| Command | Description |
|---------|-------------|
| `/latent-fix` | **Flow A**: Quick fix file đang mở |
| `/latent-feature` | **Flow B**: Feature/Refactor nhiều files |
| `/latent-review` | **Flow C**: Review/Audit code |
| `/latent-status` | Quick status check |
| `/ccg latent start "<task>"` | Create context, begin analysis |
| `/ccg latent phase <phase>` | Transition to phase |
| `/ccg latent update <type> "<content>"` | Add decision/risk/hotspot |
| `/ccg latent patch "<file>"` | Apply code change |
| `/ccg latent done` | Complete task |
| `/ccg latent show [task-id]` | Display context |
| `/ccg latent list` | List all contexts |

**Flow A - Quick Fix** (`/latent-fix`):
```
/latent-fix                     # Fix file đang mở
/latent-fix src/auth/login.ts   # Fix specific file
```
Flow: analysis → plan (1-2 patches) → impl → review

**Flow B - Feature** (`/latent-feature`):
```
/latent-feature "Add dark mode"
/latent-feature "Refactor auth" --constraints "No breaking changes"
```
Flow: deep analysis → detailed plan with sub-tasks → iterative impl → comprehensive review

**Flow C - Review** (`/latent-review`):
```
/latent-review                     # Review current file
/latent-review src/auth/           # Review folder
/latent-review src/api/users.ts    # Review specific file
```
Flow: analysis → identify hotSpots/risks → plan → structured output (no code changes)

#### Documentation Files

| File | Description |
|------|-------------|
| `docs/LATENT_CHAIN_GUIDE.md` | Comprehensive user guide (Vietnamese) |
| `docs/improve_UX.md` | UX improvement proposals and analysis |
| `templates/CLAUDE.md` | Project instructions with Latent Mode rules |
| `templates/commands/ccg-latent.md` | All latent slash commands |
| `templates/commands/latent-fix.md` | **NEW**: Flow A - Quick fix command |
| `templates/commands/latent-feature.md` | **NEW**: Flow B - Feature command |
| `templates/commands/latent-status.md` | **NEW**: Status check command |
| `templates/commands/latent-review.md` | Flow C - Quick review command |

### 11. Thinking Module (NEW)

**Thinking Module** - Thinking Models, Standard Workflows/SOPs, and Code Style RAG.

Inspired by [ClaudeMCP Memory Bridge](../docs/paper.md), this module provides structured reasoning frameworks to enhance Claude's problem-solving capabilities.

#### 3 Pillars

| Pillar | Description |
|--------|-------------|
| **Thinking Models** | 6 reasoning frameworks for complex problems |
| **Workflows/SOPs** | 7 standardized procedures for common tasks |
| **Code Style RAG** | Save and retrieve code snippets for style consistency |

#### 6 Thinking Models

| Model | Description | Best For |
|-------|-------------|----------|
| `chain-of-thought` | Sequential step-by-step reasoning | Math, logic puzzles, multi-step problems |
| `tree-of-thoughts` | Explore multiple solution branches | Design decisions, optimization |
| `react` | Reason + Act pattern with observations | Tool use, API integration, debugging |
| `self-consistency` | Multiple independent attempts → consensus | Critical decisions, high-stakes problems |
| `decomposition` | Break into manageable sub-problems | Large features, complex refactors |
| `first-principles` | Strip to fundamentals → build up | Architecture design, performance |

#### Model Selection

```typescript
// Get specific model
const cot = await thinking.getThinkingModel('chain-of-thought');

// Suggest best model for task
const suggestion = await thinking.suggestModel({
  task: 'Design a caching strategy for API responses',
  complexity: 'high'
});
// Returns: { model: 'tree-of-thoughts', confidence: 0.85, reason: '...' }
```

#### 7 Standard Workflows

| Workflow | Description | Trigger |
|----------|-------------|---------|
| `pre-commit` | Run before git commit | Quality & security checks |
| `code-review` | Comprehensive code review | PR review, architecture check |
| `refactoring` | Safe code transformation | Technical debt cleanup |
| `deploy` | Pre-deployment checklist | Production deployments |
| `bug-fix` | Structured debugging approach | Bug investigation |
| `feature-development` | End-to-end feature building | New features |
| `security-audit` | Security-focused review | Security assessments |

#### Workflow Usage

```typescript
// Get specific workflow
const preCommit = await thinking.getWorkflow('pre-commit');
// Returns steps: ['lint', 'type-check', 'run tests', 'security scan', 'review changes']

// Suggest workflow for task
const suggestion = await thinking.suggestWorkflow({
  task: 'Review this PR for security issues',
  context: 'authentication module'
});
// Returns: { workflow: 'security-audit', confidence: 0.9 }
```

#### Code Style RAG

Save and retrieve code snippets to maintain consistent coding style across the project.

```typescript
// Save a snippet
await thinking.saveSnippet({
  category: 'react-component',
  name: 'functional-component',
  code: `
interface Props {
  title: string;
  onClick: () => void;
}

export const Button: React.FC<Props> = ({ title, onClick }) => {
  return <button onClick={onClick}>{title}</button>;
};
  `,
  description: 'Standard functional component pattern',
  tags: ['react', 'typescript', 'component']
});

// Get style reference
const reference = await thinking.getStyleReference({
  category: 'react-component',
  context: 'Need to create a new button component'
});
// Returns matching snippets with relevance scores
```

#### Configuration

```typescript
interface ThinkingModuleConfig {
  enabled: boolean;
  maxSnippetsPerCategory: number;  // Default: 10
  autoSuggestWorkflows: boolean;   // Default: true
}
```

#### MCP Tools

| Tool | Description |
|------|-------------|
| `thinking_get_model` | Get specific thinking model with steps |
| `thinking_suggest_model` | Suggest best model for task |
| `thinking_list_models` | List all available models |
| `thinking_get_workflow` | Get specific workflow with steps |
| `thinking_suggest_workflow` | Suggest best workflow for task |
| `thinking_list_workflows` | List all available workflows |
| `thinking_save_snippet` | Save code snippet for style reference |
| `thinking_get_style` | Get style reference for category |
| `thinking_list_snippets` | List snippets by category |
| `thinking_status` | Get module status and stats |

### 12. AutoAgent Module (NEW)

**AutoAgent Module** - Autonomous agent capabilities for automatic task decomposition, tool routing, error fixing, and learning.

#### Key Benefits
- **Automatic Task Decomposition** - Break complex tasks into subtasks
- **Intelligent Tool Routing** - Auto-select appropriate MCP tools
- **Self-Healing Errors** - Automatic error correction with retry logic
- **Error Pattern Learning** - Remember errors and fixes for future recall

#### 4 Sub-Services

| Service | Description |
|---------|-------------|
| **TaskDecomposer** | Breaks complex tasks into ordered subtasks with complexity scoring (1-10) |
| **ToolRouter** | Rule-based automatic MCP tool selection with 15+ default routing rules |
| **AutoFixLoop** | Self-healing error correction with configurable retries and rollback |
| **ErrorMemory** | Stores errors/fixes with similarity matching for future recall |

#### TaskDecomposer

Automatically decomposes complex tasks into manageable subtasks.

**Complexity Scoring (1-10):**
```typescript
// Keyword weights for complexity analysis
const COMPLEXITY_KEYWORDS = {
  // High complexity (0.7-0.9)
  'refactor': 0.8, 'migrate': 0.9, 'redesign': 0.9, 'architecture': 0.85,

  // Medium complexity (0.4-0.6)
  'implement': 0.5, 'add': 0.4, 'create': 0.4, 'enhance': 0.45,

  // Low complexity (0.1-0.3)
  'fix': 0.3, 'bug': 0.3, 'typo': 0.1, 'rename': 0.2
};
```

**Phase Templates:**
| Task Type | Phases |
|-----------|--------|
| `feature` | Analysis → Plan → Implement → Tests → Review |
| `bugfix` | Reproduce → Plan Fix → Apply Fix → Verify |
| `refactor` | Analyze → Plan → Tests First → Apply → Verify |
| `review` | Read → Check Patterns → Document |

**Usage:**
```typescript
// Decompose a task
const result = await autoAgent.decomposeTask({
  taskName: 'Implement user authentication with OAuth2',
  taskDescription: 'Add OAuth2 login with Google and GitHub providers',
  context: {
    files: ['src/auth/'],
    constraints: ['No breaking changes'],
    domain: 'security'
  }
});

// Result
{
  success: true,
  taskId: 'abc-123',
  complexity: {
    score: 7,
    suggestDecompose: true,
    estimatedSubtasks: 5
  },
  subtasks: [
    { id: '1', name: 'Analysis', phase: 'analysis', order: 1, tools: ['memory_recall'] },
    { id: '2', name: 'Plan', phase: 'plan', order: 2, dependsOn: ['1'] },
    { id: '3', name: 'Implement', phase: 'impl', order: 3, dependsOn: ['2'] },
    // ...
  ]
}
```

#### ToolRouter

Automatically suggests appropriate MCP tools based on action and context.

**Default Routing Rules (15+):**
| Rule | Pattern | Tools |
|------|---------|-------|
| Edit Code | `edit\|modify\|change\|fix` | `latent_apply_patch`, `guard_validate` |
| Testing | `test\|spec\|verify` | `testing_run`, `testing_run_affected` |
| Validate | `validate\|check\|security` | `guard_validate`, `guard_check_test` |
| Remember | `remember\|store\|save` | `memory_store` |
| Recall | `recall\|previous\|history` | `memory_recall` |
| Latent Chain | `latent\|context\|phase` | `latent_context_*` |
| Analysis | `analyze\|review\|examine` | `thinking_suggest_model` |

**Phase-Specific Tools:**
```typescript
const PHASE_TOOLS = {
  'analysis': ['memory_recall', 'documents_search', 'thinking_suggest_model'],
  'plan': ['thinking_get_workflow', 'workflow_task_create'],
  'impl': ['latent_apply_patch', 'guard_validate', 'testing_run_affected'],
  'review': ['guard_validate', 'testing_run', 'memory_store']
};
```

**Usage:**
```typescript
// Get tool suggestions
const result = autoAgent.routeTools({
  action: 'validate code for security issues',
  context: { phase: 'review', files: ['src/auth/login.ts'] }
});

// Result
{
  success: true,
  suggestedTools: [
    { name: 'guard_validate', reason: 'Validate', priority: 9 },
    { name: 'guard_check_test', reason: 'Validate', priority: 9 },
    { name: 'testing_run', reason: 'Phase: review', priority: 3 }
  ],
  matchedRules: ['rule-validate'],
  confidence: 0.7
}
```

#### AutoFixLoop

Self-healing error correction with configurable retries and rollback.

**Error Pattern Matching:**
```typescript
// Common error patterns and fix generators
const ERROR_FIX_PATTERNS = [
  // TypeScript errors
  { pattern: /Cannot find name '(\w+)'/, fixType: 'patch', description: 'Import missing name' },
  { pattern: /Property '(\w+)' does not exist/, fixType: 'patch', description: 'Add missing property' },
  { pattern: /Type '(.+)' is not assignable/, fixType: 'patch', description: 'Fix type mismatch' },

  // Build errors
  { pattern: /Module not found: Can't resolve '(.+)'/, fixType: 'dependency', command: 'npm install' },

  // Guard errors
  { pattern: /Guard blocked: (.+)/, fixType: 'patch', description: 'Fix guard issue' }
];
```

**Configuration:**
```typescript
interface AutoFixLoopConfig {
  enabled: boolean;
  maxRetries: number;            // Default: 3
  retryDelayMs: number;          // Default: 1000
  autoRollbackOnFail: boolean;   // Default: true
}
```

**Usage:**
```typescript
// Start fix loop
const result = await autoAgent.startFixLoop({
  error: {
    type: 'build',
    message: "Property 'id' does not exist on type 'User'",
    file: 'src/user/user.service.ts',
    line: 45
  },
  context: { taskId: 'fix-user-bug' },
  maxRetries: 3
});

// Result
{
  success: true,
  status: 'success',
  totalAttempts: 2,
  attempts: [
    { attemptNumber: 1, fix: 'Add id property to User type', result: 'failed' },
    { attemptNumber: 2, fix: 'Update User interface', result: 'success' }
  ],
  rolledBack: false
}
```

#### ErrorMemory

Specialized memory for errors and their fixes with similarity matching.

**Features:**
- **Similarity Matching** - Jaccard-like algorithm for error message comparison
- **Deduplication** - Configurable threshold (default: 0.8)
- **Pattern Detection** - Extracts patterns from error messages
- **Success Rate Tracking** - Tracks fix success rates per pattern

**Similarity Scoring:**
```typescript
// Error similarity calculation
calculateSimilarity(a, b): number {
  // Type match: 30%
  // File match: 20%
  // Message similarity: 40% (Jaccard on words)
  // Code match: 10%
}
```

**Usage:**
```typescript
// Store error and fix
await autoAgent.storeError({
  error: { type: 'build', message: 'Cannot find module xyz' },
  fix: { type: 'dependency', target: 'xyz', description: 'npm install xyz' },
  success: true,
  tags: ['dependency', 'npm']
});

// Recall similar errors
const result = await autoAgent.recallErrors({
  error: { type: 'build', message: 'Cannot find module abc' },
  limit: 5,
  minSimilarity: 0.5
});

// Result
{
  matchCount: 3,
  matches: [
    { errorType: 'build', similarity: 0.85, fixDescription: 'npm install xyz' },
    // ...
  ],
  suggestedFix: { type: 'dependency', description: 'npm install abc' },
  confidence: 0.85
}
```

#### Configuration

```typescript
interface AutoAgentModuleConfig {
  enabled: boolean;

  decomposer: {
    maxSubtasks: number;              // Max subtasks per task (default: 10)
    autoDecompose: boolean;           // Auto-decompose on task create (default: true)
    minComplexityForDecompose: number; // 1-10, threshold (default: 4)
  };

  router: {
    enabled: boolean;
    routingRules: ToolRoutingRule[];  // Custom rules
    fallbackAgent?: string;
  };

  fixLoop: {
    enabled: boolean;
    maxRetries: number;               // Default: 3
    retryDelayMs: number;             // Default: 1000
    autoRollbackOnFail: boolean;      // Default: true
  };

  errorMemory: {
    enabled: boolean;
    maxErrors: number;                // Default: 100
    deduplicateThreshold: number;     // 0-1, default: 0.8
    autoRecall: boolean;              // Default: true
  };
}
```

#### MCP Tools

| Tool | Description |
|------|-------------|
| `auto_decompose_task` | Decompose complex task into subtasks |
| `auto_analyze_complexity` | Get complexity score without decomposing |
| `auto_route_tools` | Get tool recommendations for an action |
| `auto_fix_loop` | Start automatic error correction |
| `auto_fix_status` | Check fix loop status |
| `auto_store_error` | Store error and fix pattern |
| `auto_recall_errors` | Recall similar errors from memory |
| `auto_agent_status` | Get module status |

#### Slash Commands

```
/ccg auto decompose "task description" [--force]
/ccg auto complexity "task description"
/ccg auto route "action" [--phase impl]
/ccg auto fix "error message" --type build
/ccg auto store-error "error" --fix "fix description"
/ccg auto recall "error message" [--limit 5]
/ccg auto status
```

---

## MCP-First Mode (NEW in v2.1.0)

**MCP-First Mode** enforces that Claude must use MCP tools for all significant code changes and reasoning steps. This ensures complete visibility and auditability of Claude's actions.

### Core Principles

1. **MỌI hành động liên quan tới:**
   - Phân tích nhiệm vụ (analysis)
   - Lập kế hoạch (plan)
   - Sửa code (impl)
   - Chạy test
   - Chạy guard
   - Cập nhật memory / latent context

   **ĐỀU PHẢI được phản ánh thông qua MCP tools của CCG.**

2. **Claude KHÔNG ĐƯỢC:**
   - Sửa code trực tiếp trong editor mà KHÔNG thông qua `latent_apply_patch`
   - Tự nghĩ xong rồi chỉ nói "đã sửa" mà không có bất kỳ MCP call nào
   - Bỏ qua `guard_validate` / `testing_run` khi patch code

### Mandatory MCP Flow

| Action | Required MCP Call(s) |
|--------|---------------------|
| Bắt đầu task ≥2 bước | `latent_context_create` |
| Mỗi bước reasoning | `latent_step_log` hoặc `latent_context_update` |
| Chuyển phase | `latent_phase_transition` |
| Sửa code | `latent_apply_patch` |
| Sau mỗi patch | `guard_validate` + `testing_run_affected` |
| Hoàn thành task | `latent_complete_task` |

### MCP Tool Priority Matrix

Khi có nhiều cách làm, Claude ưu tiên:

| Priority | Approach |
|----------|----------|
| 1 (highest) | MCP tool + Latent context |
| 2 | MCP tool without Latent |
| 3 | Native tool (only when MCP has no equivalent) |
| 4 (lowest) | Manual text response (only for explanation) |

### Recovery Flow (When Claude "Forgets" MCP)

Nếu Claude đã sửa code trực tiếp (không qua MCP), Claude PHẢI ngay lập tức:

1. **Acknowledge**: "Tôi vừa sửa trực tiếp, cần sync lại với MCP"
2. **Sync**: Gọi `latent_apply_patch` với diff tương ứng
3. **Validate**: Gọi `guard_validate` cho file đã sửa
4. **Test**: Gọi `testing_run_affected` với file đã sửa
5. **Update**: Gọi `latent_context_update` để cập nhật context

### Configuration Files

| File | Description |
|------|-------------|
| `templates/CLAUDE.md` | Section 8: Tool-First & MCP-Only Mode rules |
| `templates/AUTO_AGENT_RULES.md` | Section 10: Tool-First & MCP-Only Mode enforcement |
| `docs/improvement/AUTO_AGENT_RULES.md` | Full Auto-Agent rules with MCP enforcement |

### Technical Implementation

**Pre-Tool-Call Hook** (`src/hooks/pre-tool-call.hook.ts`):
- Auto-detect trigger tools from config
- Auto-attach latent context with MCP-First constraint
- Auto-update context with new files
- Emit events for tracking

**Latent Step Log** (`latent_step_log` tool):
- Observer pattern for reasoning steps
- Auto-create context if not exists
- Parse decisions in "D001: summary" format
- Track files, risks, next actions

---

## MCP Tools Reference

### Session Tools

| Tool | Description |
|------|-------------|
| `session_init` | Initialize CCG session |
| `session_end` | End session, save data |
| `session_status` | Get current status |

### Memory Tools

| Tool | Description |
|------|-------------|
| `memory_store` | Store new memory |
| `memory_recall` | Search memories |
| `memory_forget` | Delete memory |
| `memory_summary` | Get summary |
| `memory_list` | List all memories |

### Guard Tools

| Tool | Description |
|------|-------------|
| `guard_validate` | Validate code |
| `guard_check_test` | Check test for fakes |
| `guard_rules` | List rules |
| `guard_toggle_rule` | Enable/disable rule |
| `guard_status` | Get status |

### Agent Tools

| Tool | Description |
|------|-------------|
| `agents_list` | List all agents |
| `agents_get` | Get agent details |
| `agents_select` | Select agent for task |
| `agents_register` | Register new agent |
| `agents_coordinate` | Coordinate multiple agents |
| `agents_reload` | Reload from files |
| `agents_status` | Get status |

### Workflow Tools

| Tool | Description |
|------|-------------|
| `workflow_task_create` | Create task |
| `workflow_task_start` | Start task |
| `workflow_task_update` | Update progress |
| `workflow_task_complete` | Mark complete |
| `workflow_task_pause` | Pause task |
| `workflow_task_fail` | Mark failed |
| `workflow_task_note` | Add note |
| `workflow_task_list` | List tasks |
| `workflow_current` | Get current task |
| `workflow_status` | Get status |

### Resource Tools

| Tool | Description |
|------|-------------|
| `resource_status` | Get token status |
| `resource_update_tokens` | Update usage |
| `resource_estimate_task` | Estimate tokens |
| `resource_checkpoint_create` | Create checkpoint |
| `resource_checkpoint_list` | List checkpoints |
| `resource_checkpoint_restore` | Restore checkpoint |
| `resource_checkpoint_delete` | Delete checkpoint |

### Process Tools

| Tool | Description |
|------|-------------|
| `process_check_port` | Check port status |
| `process_check_all_ports` | Check all ports |
| `process_kill_on_port` | Kill process on port |
| `process_kill` | Kill by PID |
| `process_spawn` | Spawn process |
| `process_list` | List processes |
| `process_cleanup` | Cleanup all |
| `process_status` | Get status |

### Testing Tools

| Tool | Description |
|------|-------------|
| `testing_run` | Run tests |
| `testing_run_affected` | Run affected tests |
| `testing_browser_open` | Open browser |
| `testing_browser_screenshot` | Take screenshot |
| `testing_browser_logs` | Get console logs |
| `testing_browser_network` | Get network requests |
| `testing_browser_errors` | Get errors |
| `testing_browser_close` | Close browser |
| `testing_cleanup` | Cleanup test data |
| `testing_status` | Get status |

### Document Tools

| Tool | Description |
|------|-------------|
| `documents_search` | Search documents |
| `documents_find_by_type` | Find by type |
| `documents_should_update` | Check if update needed |
| `documents_update` | Update document |
| `documents_create` | Create document |
| `documents_register` | Register existing |
| `documents_scan` | Scan project |
| `documents_list` | List all |
| `documents_status` | Get status |

### Latent Chain Mode Tools

| Tool | Description |
|------|-------------|
| `latent_context_create` | Create new AgentLatentContext for a task |
| `latent_context_get` | Get context (optionally with history) |
| `latent_context_update` | **KEY**: Merge context delta (not full replace) |
| `latent_phase_transition` | Transition between phases (analysis/plan/impl/review) |
| `latent_apply_patch` | Apply unified diff patch to file |
| `latent_validate_response` | Validate LatentResponse format |
| `latent_complete_task` | Mark task as complete |
| `latent_list_contexts` | List all active contexts |
| `latent_delete_context` | Delete a context |
| `latent_status` | Get module status and statistics |
| `latent_step_log` | **NEW**: Log reasoning steps (Observer Pattern) - auto-creates context if not exists |

### Thinking Module Tools

| Tool | Description |
|------|-------------|
| `thinking_get_model` | Get specific thinking model (CoT, ToT, ReAct, etc.) |
| `thinking_suggest_model` | Suggest best thinking model for a task |
| `thinking_list_models` | List all 6 available thinking models |
| `thinking_get_workflow` | Get specific workflow/SOP with steps |
| `thinking_suggest_workflow` | Suggest best workflow for a task |
| `thinking_list_workflows` | List all 7 available workflows |
| `thinking_save_snippet` | Save code snippet for style reference |
| `thinking_get_style` | Get style reference snippets for category |
| `thinking_list_snippets` | List all snippets or by category |
| `thinking_status` | Get Thinking module status and statistics |

### AutoAgent Module Tools (NEW)

| Tool | Description |
|------|-------------|
| `auto_decompose_task` | Decompose complex task into subtasks with dependencies |
| `auto_analyze_complexity` | Get complexity score (1-10) without decomposing |
| `auto_route_tools` | Get tool recommendations for an action |
| `auto_fix_loop` | Start automatic error correction with retries |
| `auto_fix_status` | Check current fix loop status |
| `auto_store_error` | Store error and fix pattern in memory |
| `auto_recall_errors` | Recall similar errors with suggested fixes |
| `auto_agent_status` | Get AutoAgent module status and statistics |

---

## Configuration

### Main Configuration (`.ccg/config.json`)

```json
{
  "version": "1.0.0",
  "project": {
    "name": "my-project",
    "type": "typescript-node",
    "root": "."
  },
  "modules": {
    "memory": {
      "enabled": true,
      "maxItems": 1000,
      "autoSave": true,
      "persistPath": ".ccg/memory.db"
    },
    "guard": {
      "enabled": true,
      "strictMode": false,
      "rules": {
        "blockFakeTests": true,
        "blockDisabledFeatures": true,
        "blockEmptyCatch": true,
        "blockEmojiInCode": true
      }
    },
    "agents": {
      "enabled": true,
      "agentsFilePath": "AGENTS.md",
      "agentsDir": ".claude/agents",
      "autoReload": true,
      "enableCoordination": true
    },
    "workflow": {
      "enabled": true,
      "autoTrackTasks": true
    },
    "resource": {
      "enabled": true,
      "checkpoints": {
        "auto": true,
        "thresholds": [70, 85, 95]
      }
    },
    "process": {
      "enabled": true,
      "ports": {
        "dev": 3000,
        "api": 8080
      }
    },
    "testing": {
      "enabled": true,
      "testCommand": "npm test"
    },
    "documents": {
      "enabled": true,
      "updateInsteadOfCreate": true
    },
    "latent": {
      "enabled": true,
      "maxContexts": 50,
      "autoMerge": true,
      "persist": true,
      "persistPath": ".ccg/latent-contexts.json",
      "maxSummaryLength": 200,
      "maxDecisions": 100
    }
  }
}
```

### MCP Configuration (`.mcp.json`)

```json
{
  "mcpServers": {
    "claude-code-guardian": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "CCG_PROJECT_ROOT": ".",
        "CCG_LOG_LEVEL": "info"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CCG_PROJECT_ROOT` | Project root directory | `process.cwd()` |
| `CCG_LOG_LEVEL` | Log level (debug/info/warn/error) | `info` |
| `CCG_CONFIG_PATH` | Custom config path | `.ccg/config.json` |

---

## Usage Guide

### Installation

```bash
# Clone repository
git clone https://github.com/anthropics/claude-code-guardian.git
cd claude-code-guardian

# Install dependencies
npm install

# Build
npm run build

# Initialize in your project
npx ccg init
```

### Basic Workflow

1. **Session Start**
   - CCG loads memory and pending tasks
   - Returns session ID and status

2. **During Session**
   - Store important decisions in memory
   - Track tasks with workflow
   - Validate code with guard
   - Select appropriate agents for tasks

3. **Session End**
   - Memory is persisted
   - Tasks are saved
   - Processes are cleaned up

### Best Practices

1. **Memory Usage**
   - Store decisions with importance 8-10 for critical items
   - Use tags for easy recall
   - Let CCG handle duplicate detection

2. **Task Management**
   - Create tasks for multi-step work
   - Update progress regularly
   - Add notes for context

3. **Code Validation**
   - Run guard before commits
   - Enable strict mode for critical projects
   - Review blocked items carefully

4. **Agent Selection**
   - Provide task context for better matching
   - Use domain hints when applicable
   - Let coordination handle cross-domain tasks

---

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Running Locally

```bash
# Start server
npm start

# With debug logging
CCG_LOG_LEVEL=debug npm start
```

### Adding a New Module

1. Create directory in `src/modules/<module-name>/`
2. Create type definitions (`*.types.ts`)
3. Create service class (`*.service.ts`)
4. Create MCP tools (`*.tools.ts`)
5. Create index with module class (`index.ts`)
6. Register in `src/modules/index.ts`
7. Add to server tool routing in `src/server.ts`

### Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

---

## CI/CD Templates (NEW)

CCG provides ready-to-use CI/CD templates for continuous security validation.

### GitHub Actions

Copy `templates/ci-cd/github-actions.yml` to `.github/workflows/ccg-ci.yml`

```yaml
# Key features:
# - Security validation with CCG Guard
# - OWASP Top 10 rule scanning
# - Test analysis for fake tests
# - Dependency audit
# - PR review comments

jobs:
  validate:
    - name: Run CCG Guard Validation
      run: ccg guard --rules sql-injection,xss,command-injection --strict

  security:
    - name: Security Scan
      run: ccg guard --rules prompt-injection,path-traversal,hardcoded-secrets
```

### GitLab CI

Copy `templates/ci-cd/gitlab-ci.yml` to `.gitlab-ci.yml`

```yaml
stages:
  - validate
  - build
  - test
  - security
  - deploy

ccg:validate:
  stage: validate
  script:
    - ccg validate "$file" --strict

security:ccg-scan:
  stage: security
  script:
    - ccg guard --rules sql-injection,xss-vulnerability --strict
```

### Pre-commit Hooks

Copy `templates/ci-cd/pre-commit-config.yaml` to `.pre-commit-config.yaml`

```yaml
repos:
  - repo: local
    hooks:
      # CCG Code Validation
      - id: ccg-validate
        name: CCG Validate
        entry: ccg validate --strict
        files: \.(ts|js|py)$

      # CCG Security Scan
      - id: ccg-security
        name: CCG Security Scan
        entry: ccg guard --rules sql-injection,xss-vulnerability,command-injection

      # CCG Prompt Injection Check
      - id: ccg-prompt-check
        name: CCG Prompt Injection Check
        entry: ccg guard --rules prompt-injection
        files: (ai|llm|prompt|chat|gpt|claude)\.(ts|js|py)$
```

### Installation

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

---

## Appendix

### File Locations

| Item | Path |
|------|------|
| Memory Database | `.ccg/memory.db` |
| Project Memory | `.ccg/project-memory.json` |
| Checkpoints | `.ccg/checkpoints/` |
| Tasks | `.ccg/tasks.json` |
| Documents Registry | `.ccg/documents.json` |
| Config | `.ccg/config.json` |
| **Latent Contexts** | **`.ccg/latent-contexts.json`** |
| **Code Snippets** | **`.ccg/code-snippets.json`** |
| **Error Memory** | **`.ccg/error-memory.json`** |
| **Audit Logs** | **`.ccg/audit/audit.log`** |
| **Audit State** | **`.ccg/audit/audit.log.state`** |

### Template Files

| Item | Path |
|------|------|
| **CLAUDE.md Template** | **`templates/CLAUDE.md`** |
| **Auto-Agent Rules** | **`templates/AUTO_AGENT_RULES.md`** (NEW) |
| **Latent Fix Command** | **`templates/commands/latent-fix.md`** |
| **Latent Feature Command** | **`templates/commands/latent-feature.md`** |
| **Latent Review Command** | **`templates/commands/latent-review.md`** |
| **Latent Status Command** | **`templates/commands/latent-status.md`** |
| **CCG Auto Command** | **`templates/commands/ccg-auto.md`** |
| **CCG Latent Command** | **`templates/commands/ccg-latent.md`** |

### Event Reference

```typescript
// Session events
'session:start' | 'session:end' | 'session:pause' | 'session:resume'

// Task events
'task:create' | 'task:start' | 'task:progress' | 'task:complete' | 'task:fail'

// Guard events
'guard:warning' | 'guard:block' | 'guard:pass'

// Resource events
'resource:warning' | 'resource:critical' | 'resource:checkpoint'

// Memory events
'memory:store' | 'memory:recall' | 'memory:forget'

// Agent events
'agent:registered' | 'agent:updated' | 'agent:removed' | 'agent:selected'

// Process events
'process:spawn' | 'process:kill' | 'process:port-conflict'

// Document events
'document:create' | 'document:update' | 'document:register'

// Latent Chain Mode events
'latent:context:created' | 'latent:context:updated'
'latent:phase:transition' | 'latent:patch:applied'
'latent:task:completed' | 'latent:validation:failed'
'latent:step:logged'  // NEW: Step logging event

// Thinking Module events
'thinking:model_accessed' | 'thinking:model_suggested'
'thinking:workflow_accessed' | 'thinking:workflow_suggested'
'thinking:snippet_saved' | 'thinking:style_retrieved'

// AutoAgent Module events (NEW)
'auto-agent:task:decomposed' | 'auto-agent:tool:routed'
'auto-agent:fix:started' | 'auto-agent:fix:attempt'
'auto-agent:fix:success' | 'auto-agent:fix:failed' | 'auto-agent:fix:rollback'
'auto-agent:error:stored' | 'auto-agent:error:recalled'
```

---

## Changelog

### v2.1.0 (2025-12-01) - MCP-First Mode

- **NEW**: **MCP-First Mode** - Enforced MCP tool usage for all code changes
  - Claude MUST use MCP tools for all significant actions
  - Added `latent_step_log` tool for Observer Pattern reasoning
  - Enhanced pre-tool-call hook with auto-attach MCP-First constraints
  - Added configurable `autoAttachTriggerTools` in latent config
  - Updated `CLAUDE.md` with Section 8: Tool-First & MCP-Only Mode
  - Updated `AUTO_AGENT_RULES.md` with Section 10: MCP enforcement rules

- **NEW**: **Step Logging (Observer Pattern)**
  - `latent_step_log` tool logs reasoning steps without code changes
  - Auto-creates context if taskId doesn't exist
  - Parses decisions in "D001: summary" format
  - Tracks files, risks, and next actions

- **Enhanced**: **Auto-Attach Latent Context**
  - Configurable trigger tools via `autoAttachTriggerTools`
  - Default triggers: `guard_validate`, `testing_run`, write operations, etc.
  - MCP-First constraint added to auto-created contexts
  - Auto-update context with new files

- **Documentation**:
  - Added MCP-First Mode section to PROJECT_DOCUMENTATION.md
  - Added `templates/AUTO_AGENT_RULES.md`
  - Updated Table of Contents

- **Types**:
  - Added `StepLogParams` interface
  - Added `autoAttach` and `autoAttachTriggerTools` to `LatentModuleConfig`

### v2.0.0 (2025-11-30) - AutoAgent Module
- **NEW**: **AutoAgent Module** - Autonomous agent capabilities
  - **TaskDecomposer**: Break complex tasks into subtasks with complexity scoring (1-10)
  - **ToolRouter**: Rule-based automatic MCP tool selection with 15+ routing rules
  - **AutoFixLoop**: Self-healing error correction with configurable retries and rollback
  - **ErrorMemory**: Store errors/fixes with similarity matching for future recall
  - 8 new MCP tools (`auto_*`)
  - New slash commands (`/ccg auto *`)
  - Event-driven integration with workflow module
- **Integration**: Full integration with MCP server (94+ total tools)
- **Module Count**: 12 feature modules

### v1.3.0 (2025-11-30) - Thinking Module
- **NEW**: **Thinking Module** - Structured reasoning frameworks
  - 6 Thinking Models: Chain-of-Thought, Tree-of-Thoughts, ReAct, Self-Consistency, Decomposition, First-Principles
  - 7 Standard Workflows/SOPs: pre-commit, code-review, refactoring, deploy, bug-fix, feature-development, security-audit
  - Code Style RAG: Save and retrieve code snippets for style consistency
  - 10 new MCP tools (`thinking_*`)
- **Integration**: Full integration with MCP server (86 total tools)
- **Inspired by**: ClaudeMCP Memory Bridge architecture

### v1.2.2 (2025-11-30) - UX Improvements
- **NEW**: **3 Flow Commands** for streamlined latent workflows
  - `/latent-fix` - Flow A: Quick fix 1-2 patches
  - `/latent-feature` - Flow B: Feature/Refactor nhiều files
  - `/latent-status` - Quick status check
- **NEW**: **Auto-Attach Latent Context** in pre-tool-call hook
  - Automatically creates latent context when workflow task is active
  - Triggers on `guard_validate`, `testing_run`, write operations
  - Configurable via `modules.latent.autoAttach`
- **NEW**: **Standardized Output Format** with phase icons
  - 🔍 analysis, 📋 plan, 🔧 impl, ✅ review
  - Human-readable format in editor (not JSON)
- **Updated**: `CLAUDE.md` with mandatory Latent Flow rules
- **Updated**: Slash commands table with new commands
- **Docs**: Added `docs/improve_UX.md` - UX analysis and proposals

### v1.2.1 (2025-11-30)
- **Integration**: Workflow-Latent auto-hook
  - Auto-create latent context on `workflow_task_create`
  - Auto-complete context on `workflow_task_complete`
- **Commands**: Added `/latent-review` quick review slash command
- **Docs**: Added `LATENT_CHAIN_GUIDE.md` comprehensive user guide
- **Templates**: Updated `CLAUDE.md` with Latent Mode instructions

### v1.2.0 (2025-11-30)
- **NEW**: **Latent Chain Mode** - Hidden-state reasoning module
  - 70-80% token reduction via context delta
  - 4-phase workflow (analysis → plan → impl → review)
  - 10 new MCP tools (`latent_*`)
  - AgentLatentContext as KV-cache pattern
  - Patch application support
  - History tracking and persistence

### v1.1.0 (2025-11-30)
- **Security**: Added 4 new OWASP Top 10 rules (XSS, Command Injection, Path Traversal, Prompt Injection)
- **Compliance**: Added Immutable Audit Logger with SIEM export (JSON, Syslog, CEF)
- **GDPR**: Added Zero Retention Mode for Memory module
- **DevOps**: Added CI/CD templates (GitHub Actions, GitLab CI, Pre-commit)
- **Memory**: Added automatic retention policy with configurable days

### v1.0.0 (2025-11-29)
- Initial release with 9 modules
- Memory, Guard, Agents, Commands, Workflow, Resource, Process, Testing, Documents

---

**Claude Code Guardian** - Enhancing Claude's coding capabilities with memory, security validation, compliance, and multi-agent intelligence.
