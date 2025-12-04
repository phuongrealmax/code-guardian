# Claude Code Guardian (CCG) v3.0

> Enterprise-grade MCP Server for Claude Code with Memory, Guard, Workflow, Agents & More

## Overview

Claude Code Guardian (CCG) is a unified Model Context Protocol (MCP) server that enhances Claude Code with persistent memory, code quality guards, workflow management, specialized agents, and advanced reasoning capabilities.

## Live System Status

| Component | Status | Details |
|-----------|--------|---------|
| **Memory Module** | Active | 34 memories stored |
| **Guard Module** | Active | 10 rules enabled (strict mode) |
| **Workflow Module** | Active | Task management ready |
| **Agents Module** | Active | 11 specialized agents |
| **Latent Module** | Active | 3 contexts, 667 avg tokens saved |
| **Thinking Module** | Active | 6 models, 7 workflows |
| **AutoAgent Module** | Active | All services enabled |
| **Documents Module** | Active | 45 documents indexed |
| **RAG Module** | Ready | Semantic search available |
| **Resource Module** | Active | 7 checkpoints saved |

## Key Features

### 1. Persistent Memory (34 memories)
- Store decisions, facts, code patterns, errors, notes
- Importance-based ranking (1-10)
- Tag-based categorization and search
- SQLite-backed persistent storage

### 2. Code Guard (10 rules)
- **Security Rules**: SQL Injection, XSS, Command Injection, Path Traversal, Prompt Injection, Hardcoded Secrets
- **Quality Rules**: Empty Catch, Disabled Feature
- **Testing Rules**: Fake Test Detection
- **Convention Rules**: Emoji in Code

### 3. Workflow Management
- Task creation, tracking, and completion
- Priority levels: low, medium, high, critical
- Status tracking: pending, in_progress, paused, blocked, completed, failed
- Notes and decision logging

### 4. Specialized Agents (11 agents)
- Trading Agent - Quant & Trading Systems
- Laravel Agent - PHP Backend
- React Agent - Frontend Development
- Node Agent - Orchestration Engineering
- Python Agent - AI/ML Engineering
- DevOps Agent - Platform Engineering
- Database Agent - Database Architecture
- UI/UX Agent - Design & Accessibility
- Tester Agent - QA & Test Automation
- MCP Core Agent - Protocol Engineering
- Module Architect Agent - Software Architecture

### 5. Latent Chain Mode
- 4-phase workflow: Analysis -> Plan -> Impl -> Review
- Context delta updates (only send changes)
- Average 667 tokens saved per context
- Automatic phase transitions

### 6. Thinking Models (6 models)
- Chain-of-Thought (CoT)
- Tree of Thoughts (ToT)
- ReAct (Reasoning + Acting)
- Self-Consistency
- Problem Decomposition
- First Principles Thinking

### 7. Standard Workflows (7 SOPs)
- Pre-Commit Checklist
- Code Review Checklist
- Safe Refactoring Workflow
- Deployment Workflow
- Bug Fix Workflow
- Feature Development Workflow
- Security Audit Checklist

### 8. AutoAgent
- Task Decomposition - Break complex tasks into subtasks
- Tool Router - 13 routing rules for optimal tool selection
- AutoFix Loop - Automatic error recovery
- Error Memory - Learn from past fixes

## Architecture

```
Claude Code <--MCP--> CCG Server <---> Modules
                         |
                         +-- Memory (SQLite)
                         +-- Guard (10 rules)
                         +-- Workflow (tasks)
                         +-- Agents (11 agents)
                         +-- Latent (contexts)
                         +-- Thinking (models)
                         +-- AutoAgent (services)
                         +-- Documents (registry)
                         +-- RAG (semantic search)
                         +-- Resource (checkpoints)
                         +-- Process (port management)
                         +-- Testing (browser automation)
```

## Tool Count: 113+ MCP Tools

| Module | Tools |
|--------|-------|
| Session | 3 |
| Memory | 6 |
| Guard | 5 |
| Workflow | 12 |
| Agents | 7 |
| Latent | 11 |
| Thinking | 9 |
| AutoAgent | 7 |
| Documents | 9 |
| RAG | 6 |
| Resource | 7 |
| Process | 8 |
| Testing | 10 |

## Quick Start

```bash
# Install
npm install @anthropic-community/claude-code-guardian

# Add to Claude Code
claude mcp add claude-code-guardian -- node path/to/dist/index.js

# Or use .mcp.json
{
  "mcpServers": {
    "claude-code-guardian": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

## Dashboard

CCG includes a Next.js 14 dashboard for visual management:

- **API Server**: Port 3334 (REST + WebSocket)
- **Dashboard**: Port 3333 (Next.js App Router)

```bash
# Start API server
npm run start:api

# Start dashboard
cd dashboard && npm run dev
```

## Requirements

- Node.js >= 18.0.0
- Claude Code CLI
- SQLite3 (bundled via better-sqlite3)

## License

MIT License

## Links

- [Features Documentation](./FEATURES.md)
- [Agents Documentation](./AGENTS.md)
- [Security Rules](./SECURITY.md)
- [Quick Start Guide](./QUICKSTART.md)
