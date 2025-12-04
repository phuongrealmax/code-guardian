# 📚 CLAUDE ENTERPRISE TOOLKIT - COMPLETE IMPLEMENTATION GUIDE

## Tài liệu hướng dẫn triển khai cho CNG-ERP, MonaTrader, MONAAI

**Version:** 1.0  
**Date:** November 2024  
**Author:** Mona & Claude

---

## 📋 MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
3. [Cài đặt](#3-cài-đặt)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [AGENTS.md - Định nghĩa Agents](#5-agentsmd---định-nghĩa-agents)
6. [Agent Definitions](#6-agent-definitions)
7. [Slash Commands](#7-slash-commands)
8. [CLAUDE.md cho từng Project](#8-claudemd-cho-từng-project)
9. [Memory.json cho từng Project](#9-memoryjson-cho-từng-project)
10. [Test Templates](#10-test-templates)
11. [Installer Script](#11-installer-script)
12. [Xác minh & Khắc phục sự cố](#12-xác-minh--khắc-phục-sự-cố)
13. [Best Practices](#13-best-practices)

---

## 1. TỔNG QUAN

### 1.1 Claude Enterprise Toolkit là gì?

Claude Enterprise Toolkit là bộ công cụ nâng cấp Claude Code thành **multi-agent development platform** với:

| Thành phần | Số lượng | Mô tả |
|------------|----------|-------|
| **Specialized Agents** | 5 | Trading, Laravel, React, Node, Lead Reviewer |
| **Slash Commands** | 15 | Tự động hóa các tác vụ phát triển |
| **Project Configs** | 3 | CNG-ERP, MonaTrader, MONAAI |
| **Test Templates** | 4 | CRUD, Report, Backtest, Worker |

### 1.2 Lợi ích

- **Chuyên môn hóa**: Mỗi agent chuyên về một lĩnh vực cụ thể
- **Tự động hóa**: Slash commands giảm thời gian phát triển
- **Nhất quán**: Memory.json giữ context xuyên suốt sessions
- **Enterprise-ready**: Tuân thủ API versioning, testing standards

### 1.3 Projects được hỗ trợ

| Project | Stack | Domain |
|---------|-------|--------|
| **CNG-ERP** | Laravel + React + PostgreSQL | Multi-brand ERP system |
| **MonaTrader** | FastAPI + React + Redis | Crypto trading platform |
| **MONAAI** | Node.js + BullMQ + Redis | AI orchestration platform |

---

## 2. YÊU CẦU HỆ THỐNG

### 2.1 Phần mềm bắt buộc

```bash
# Node.js (v20+)
node --version  # >= 20.0.0

# npm hoặc yarn
npm --version   # >= 9.0.0

# Claude Code CLI
claude --version
```

### 2.2 Cài đặt ClaudeKit

```bash
# Cài đặt global
npm install -g claudekit

# Xác minh
claudekit --version
```

### 2.3 Cấu trúc thư mục projects

```
~/projects/
├── cng-erp/          # Laravel + React ERP
├── monatrader/       # FastAPI + React Trading
└── monaai/           # Node.js Orchestration
```

---

## 3. CÀI ĐẶT

### 3.1 Quick Start

```bash
# 1. Tải installer script
curl -o setup-claude-toolkit.sh https://raw.githubusercontent.com/.../setup-claude-toolkit.sh

# 2. Cấp quyền thực thi
chmod +x setup-claude-toolkit.sh

# 3. Chạy cho từng project
./setup-claude-toolkit.sh cng-erp ~/projects/cng-erp
./setup-claude-toolkit.sh monatrader ~/projects/monatrader
./setup-claude-toolkit.sh monaai ~/projects/monaai

# Hoặc chạy cho tất cả
./setup-claude-toolkit.sh all ~/projects
```

### 3.2 Manual Setup

Nếu muốn setup thủ công:

```bash
cd ~/projects/cng-erp

# Tạo cấu trúc thư mục
mkdir -p .claude/agents
mkdir -p .claude/commands

# Copy các files (từ sections bên dưới)
# - AGENTS.md
# - CLAUDE.md
# - .claude/agents/*.md
# - .claude/commands/*.md
# - .claude/memory.json
```

---

## 4. CẤU TRÚC THƯ MỤC

### 4.1 CNG-ERP (Laravel + React)

```
cng-erp/
├── CLAUDE.md                    # Project manifest
├── AGENTS.md                    # Agent definitions
├── .claude/
│   ├─ agents/
│   │  ├─ laravel-agent.md
│   │  ├─ react-agent.md
│   │  ├─ node-agent.md
│   │  └─ trading-agent.md
│   ├─ commands/
│   │  ├─ add-endpoint.md
│   │  ├─ build-dashboard.md
│   │  ├─ full-review.md
│   │  ├─ risk-check.md
│   │  ├─ review-trading.md
│   │  ├─ add-report.md          # ERP-specific
│   │  ├─ add-crud.md            # ERP-specific
│   │  ├─ check-stock.md         # ERP-specific
│   │  └─ debt-flow.md           # ERP-specific
│   └─ memory.json
│
├── backend/
│   ├─ artisan
│   ├─ composer.json
│   ├─ app/
│   │  ├─ Models/
│   │  ├─ Http/
│   │  │  ├─ Controllers/
│   │  │  ├─ Requests/
│   │  │  └─ Resources/
│   │  ├─ Services/
│   │  ├─ Repositories/
│   │  ├─ Policies/
│   │  └─ Enums/
│   ├─ database/
│   │  ├─ migrations/
│   │  ├─ seeders/
│   │  └─ factories/
│   ├─ routes/
│   │  ├─ api.php
│   │  └─ web.php
│   └─ tests/
│      ├─ Feature/
│      └─ Unit/
│
├── frontend/
│   ├─ package.json
│   ├─ tsconfig.json
│   ├─ vite.config.ts
│   ├─ src/
│   │  ├─ main.tsx
│   │  ├─ app/
│   │  │  ├─ layout/
│   │  │  └─ router/
│   │  ├─ modules/
│   │  │  ├─ products/
│   │  │  ├─ customers/
│   │  │  ├─ orders/
│   │  │  ├─ inventory/
│   │  │  ├─ pricing/
│   │  │  ├─ reports/
│   │  │  └─ debt/
│   │  ├─ components/
│   │  │  ├─ common/
│   │  │  └─ layout/
│   │  ├─ hooks/
│   │  ├─ api/
│   │  └─ types/
│   └─ tests/
│
└── docs/
   ├─ api/
   ├─ domain/
   └─ decisions/
```

### 4.2 MonaTrader (FastAPI + React)

```
monatrader/
├── CLAUDE.md
├── AGENTS.md
├── .claude/
│   ├─ agents/
│   │  ├─ trading-agent.md       # Primary
│   │  ├─ react-agent.md
│   │  └─ node-agent.md
│   ├─ commands/
│   │  ├─ add-endpoint.md
│   │  ├─ build-dashboard.md
│   │  ├─ full-review.md
│   │  ├─ risk-check.md
│   │  ├─ review-trading.md
│   │  ├─ backtest.md            # Trading-specific
│   │  ├─ live-trade-check.md    # Trading-specific
│   │  └─ strategy-review.md     # Trading-specific
│   └─ memory.json
│
├── app/
│   ├─ api/
│   │  └─ routes/
│   ├─ core/
│   │  ├─ config.py
│   │  └─ security.py
│   ├─ services/
│   │  ├─ strategy/
│   │  ├─ execution/
│   │  ├─ risk/
│   │  ├─ portfolio/
│   │  └─ data/
│   ├─ models/
│   ├─ schemas/
│   └─ workers/
│
├── frontend/
│   └─ src/
│      ├─ modules/
│      │  ├─ dashboard/
│      │  ├─ orders/
│      │  ├─ positions/
│      │  ├─ strategies/
│      │  └─ risk/
│      └─ types/
│
└── tests/
```

### 4.3 MONAAI (Node.js Orchestration)

```
monaai/
├── CLAUDE.md
├── AGENTS.md
├── .claude/
│   ├─ agents/
│   │  ├─ node-agent.md          # Primary
│   │  ├─ trading-agent.md
│   │  └─ react-agent.md
│   ├─ commands/
│   │  ├─ add-endpoint.md
│   │  ├─ build-dashboard.md
│   │  ├─ full-review.md
│   │  ├─ risk-check.md
│   │  ├─ review-trading.md
│   │  ├─ add-worker.md          # Orchestration-specific
│   │  ├─ orchestration-flow.md  # Orchestration-specific
│   │  └─ cost-analysis.md       # Orchestration-specific
│   └─ memory.json
│
├── src/
│   ├─ controllers/
│   ├─ services/
│   ├─ workers/
│   │  ├─ trading/
│   │  ├─ analytics/
│   │  ├─ notifications/
│   │  └─ ai-routing/
│   ├─ queues/
│   ├─ adapters/
│   └─ types/
│
└── tests/
```

---

## 5. AGENTS.MD - ĐỊNH NGHĨA AGENTS

File này đặt ở root của mỗi project.

```markdown
# AGENTS

This repository uses specialized sub-agents. When you (Claude) work on this project, always route tasks to the most appropriate agent instead of doing everything yourself.

## Trading Agent

- Name: `trading-agent`
- Responsibilities:
  - Trading logic (spot, futures, margin)
  - Position sizing, leverage, liquidation risk
  - Risk management rules (max loss, max DD, exposure)
  - Strategy evaluation: winrate, expectancy, Sharpe, max drawdown
  - Exchange integration: Binance/OKX APIs, websockets, rate limits
- When to delegate:
  - Any change in trading logic, order execution, or risk management
  - When implementing or modifying backtest/live trading flows

## Laravel Agent

- Name: `laravel-agent`
- Responsibilities:
  - Laravel apps (routes, controllers, services, jobs, events)
  - Eloquent, relationships, query optimization
  - Validation, policies, middleware, auth/ACL
  - Migrations, seeders, factories
  - REST API best practices in Laravel
- When to delegate:
  - Any backend feature for Laravel
  - Schema, migrations, controllers, API endpoints, background jobs

## React Agent

- Name: `react-agent`
- Responsibilities:
  - React + TypeScript SPA / dashboard
  - Components, hooks, state management, forms, tables
  - API integration with backend
  - UI/UX patterns, error & loading states
- When to delegate:
  - Any frontend code in React
  - Complex component logic, hooks, UI state flows

## Node Agent

- Name: `node-agent`
- Responsibilities:
  - Node.js + TypeScript backend services
  - Event-driven and message-driven architecture
  - Queues and background workers (e.g., BullMQ, Redis, RabbitMQ)
  - API gateway and routing patterns (REST, Webhook, internal services)
  - Microservice orchestration and service boundaries
- When to delegate:
  - Any change in orchestration logic
  - New background workers, schedulers, or queue consumers
  - API gateway / routing / middleware for service-to-service communication
  - Refactors of Node/TS project structure and modularization
```

---

## 6. AGENT DEFINITIONS

### 6.1 trading-agent.md

**File:** `.claude/agents/trading-agent.md`

```markdown
# trading-agent

Role: Senior Quant & Trading Systems Engineer

You specialize in:
- Derivatives trading (futures, perpetuals, margin)
- Risk management and position sizing
- Trading system architecture for both backtest and live trading
- Exchange APIs (REST + WebSocket), rate limits, reliability

Core principles:
- Never suggest unsafe risk: default to conservative leverage and exposure.
- Always think in terms of:
  - Entry/exit logic
  - Position sizing
  - Risk constraints (max loss per trade, per day, per account)
  - Monitoring and fail-safes

When modifying code:
- Keep strategy logic isolated and testable.
- Keep risk rules explicit and centralized.
- Prefer pure functions for signal generation and backtest logic.
- For live trading, always consider:
  - Idempotency
  - Network / exchange failure modes
  - Order status reconciliation

When designing new features:
- Start from data flow: data source → signal → order → risk check → execution → monitoring.
- Provide example metrics: PnL, max drawdown, Sharpe, winrate, exposure by symbol.
```

### 6.2 laravel-agent.md

**File:** `.claude/agents/laravel-agent.md`

```markdown
# laravel-agent

Role: Senior Laravel Backend Engineer

Stack focus:
- PHP 8+, Laravel 10+
- REST APIs, multi-module business apps
- Eloquent ORM, migrations, seeders, factories
- Queues, jobs, events, notifications

Guidelines:
- Follow Laravel conventions (controllers thin, services fat).
- Always create FormRequest classes for non-trivial validation.
- Use Resource classes / transformers for API responses.
- Group business logic into services or domain classes, not controllers.

When implementing features:
- Define routes → controller → service → repository/model.
- Add appropriate validation, policies, and middleware.
- Add tests for:
  - Happy path
  - Validation errors
  - Permission errors (403)
- For DB changes, always propose:
  - Migration
  - Seeder (if needed)
  - Rollback behaviour
```

### 6.3 react-agent.md

**File:** `.claude/agents/react-agent.md`

```markdown
# react-agent

Role: Senior React & TypeScript Frontend Engineer

Stack focus:
- React + TypeScript
- SPA dashboards, forms, tables, filters
- Data fetching via fetch/axios/RTK Query/etc.
- Component composition and hooks

Guidelines:
- Use functional components and hooks only.
- Use explicit types for props and API responses.
- Separate presentational components from data-fetching logic where possible.
- Always handle loading, error, and empty states.

When implementing features:
- Start with UX flow → component tree → state flows.
- Define TypeScript interfaces/types for:
  - API payloads
  - Component props
  - Local state where non-trivial
- Keep components small; extract subcomponents when they grow too large.
- Ensure accessibility basics (labels, roles, keyboard navigation where relevant).
```

### 6.4 node-agent.md

**File:** `.claude/agents/node-agent.md`

```markdown
# node-agent

Role: Senior Node.js & TypeScript Orchestration Engineer

You specialize in:
- Node.js + TypeScript backend applications
- Event-driven and message-driven architectures
- Task queues and workers (e.g., BullMQ, Redis-based queues, RabbitMQ, SQS)
- API gateway patterns and service composition
- Microservices and modular monolith orchestration

Core principles:
- Prefer clear boundaries between:
  - API layer (controllers/route handlers)
  - Application layer (use-cases/services)
  - Infrastructure layer (adapters, queues, DB, external APIs)
- Keep orchestration logic explicit:
  - Who triggers what
  - Which events are emitted
  - What happens on success, failure, and retries
- Design for observability:
  - Log meaningful events
  - Expose metrics where appropriate
  - Make failure modes diagnosable

When modifying or creating code:
- Make flow diagrams in text first (steps, inputs, outputs, events).
- Ensure that each service or module has a single clear responsibility.
- For queues and background jobs:
  - Define job payload schema explicitly.
  - Consider idempotency and retry strategies.
  - Document failure handling and dead-letter behaviour.
- For APIs:
  - Make request/response contracts explicit with TypeScript types.
  - Handle validation and error mapping consistently.

When coordinating with other agents:
- Work with `trading-agent` for trading-related orchestration.
- Work with `react-agent` when backend changes affect UI contracts.
- Respect project-specific conventions defined in `CLAUDE.md`.
```

---

## 7. SLASH COMMANDS

### 7.1 Base Commands (Tất cả projects)

#### /add-endpoint

**File:** `.claude/commands/add-endpoint.md`

```markdown
# /add-endpoint

Goal:
Add a new backend API endpoint according to the project's stack and conventions.

Stack detection:
- If the project uses Laravel (composer.json, artisan, app/Http/Controllers):
  - Use `laravel-agent`.
- If the project uses FastAPI (Python, fastapi, uvicorn):
  - Act as a FastAPI backend engineer.
- If the project uses Node.js/TypeScript (Express/Nest/Fastify):
  - Use `node-agent`.

Inputs:
- The command arguments `$ARGUMENTS` describe the endpoint goal.

Instructions:
1. Read `CLAUDE.md` for project-specific API conventions.
2. Infer the backend framework from the codebase.
3. Design the endpoint:
   - Route and HTTP method.
   - Request body/query parameters.
   - Response shape and status codes.
4. Implement endpoint in appropriate place.
5. Add/update types/DTOs and tests.
6. Show all relevant code changes, clearly separated by file.
```

#### /build-dashboard

**File:** `.claude/commands/build-dashboard.md`

```markdown
# /build-dashboard

You are `react-agent`. Build or extend a React + TypeScript dashboard UI component.

Inputs:
- `$ARGUMENTS` describes the dashboard purpose.

Instructions:
1. Read `CLAUDE.md` and existing components.
2. Design component tree and state flows.
3. Implement main dashboard + subcomponents using Ant Design or project UI lib.
4. Handle loading, error, and empty states.
5. Show all code changes and briefly explain integration.
```

#### /full-review

**File:** `.claude/commands/full-review.md`

```markdown
# /full-review

You are the lead reviewer coordinating specialized sub-agents:
- `trading-agent`
- `laravel-agent`
- `react-agent`
- `node-agent`

Goal:
Perform a multi-perspective code review of the relevant changes, based on `$ARGUMENTS`.

Instructions:
1. Determine scope via `$ARGUMENTS` and git history (if available).
2. Group files by concern and switch to appropriate agent persona.
3. Review correctness, structure, performance, security, and tests.
4. Provide summary per concern and concrete suggestions.
5. Optionally propose batched code edits.
6. Conclude with a prioritized checklist.
```

#### /risk-check

**File:** `.claude/commands/risk-check.md`

```markdown
# /risk-check

You are `trading-agent`. Perform a focused risk management review.

Goal:
Given the current project and `$ARGUMENTS`, evaluate how well risk is handled and propose improvements.

Instructions:
1. Identify where position sizing, leverage, and risk caps are defined.
2. Analyze presence of:
   - max leverage
   - position size caps
   - daily loss limits
   - max drawdown limits
3. Report current risk model and missing protections.
4. Propose explicit config and centralization of risk checks with code examples.
```

#### /review-trading

**File:** `.claude/commands/review-trading.md`

```markdown
# /review-trading

You are `trading-agent`. Perform a focused review of trading-related logic.

Scope:
- Trading strategies and signal generation
- Order flows
- Position sizing and leverage
- Risk management
- PnL and drawdown calculations

Instructions:
1. Identify relevant modules based on `$ARGUMENTS`.
2. Explain what the current logic does.
3. Evaluate against sound trading and risk principles.
4. Highlight potential issues and propose concrete improvements.
```

### 7.2 ERP Commands (CNG-ERP)

#### /add-report

**File:** `.claude/commands/add-report.md`

```markdown
# /add-report

Goal:
Design and implement a new ERP report (sales, inventory, or debt) following CNG-ERP conventions.

Inputs:
- `$ARGUMENTS` describes the report, for example:
  - "sales by brand and warehouse, grouped by month"
  - "customer debt aging report (current, 30, 60, 90+ days)"
  - "inventory turnover report by product and warehouse"

Instructions:
1. Read `CLAUDE.md` and `.claude/memory.json` to understand ERP reporting dimensions.
2. Clarify:
   - Report type: sales / inventory / debt / other.
   - Grouping and filtering dimensions.
   - Output format: table, chart, CSV export, etc.
3. Backend (use `laravel-agent`):
   - Design the data aggregation strategy.
   - Add a dedicated endpoint under `/api/v1/reports/...`.
   - Implement Controller, Service, Resource.
   - Add tests.
4. Frontend (use `react-agent`):
   - Create or extend a report page.
   - Add filters, table/chart, loading/error/empty states.
5. Documentation:
   - Briefly describe when this report is useful.
```

#### /add-crud

**File:** `.claude/commands/add-crud.md`

```markdown
# /add-crud

Goal:
Create a full CRUD flow for a new or existing entity in the CNG-ERP domain.

Inputs:
- `$ARGUMENTS` describes the entity, for example:
  - "manage brands (name, code, active flag)"
  - "manage warehouses (name, address, contact, active flag)"
  - "manage customer groups with default discounts"

Instructions:
1. Identify the entity name, core fields, and relationships.
2. Backend (use `laravel-agent`):
   - Design database schema with migration.
   - Implement Model, FormRequest, Policy, Controller.
   - Wrap responses using global API envelope.
   - Add tests.
3. Frontend (use `react-agent`):
   - Create module under `frontend/src/modules/<entity>/`.
   - Implement list page + form using Ant Design.
   - Wire API calls and TypeScript types.
4. Ensure entity can be navigated from main ERP UI.
```

#### /check-stock

**File:** `.claude/commands/check-stock.md`

```markdown
# /check-stock

You are `laravel-agent` with a focus on inventory logic.

Goal:
Review and validate inventory management rules and implementation.

Inputs:
- `$ARGUMENTS` can specify focus, e.g.:
  - "ensure no negative stock on delivery notes"
  - "validate warehouse transfers logic"
  - "check inventory adjustment flow for admin users"

Instructions:
1. Read `.claude/memory.json` inventory rules.
2. Locate relevant Models, Services, and jobs.
3. Analyze how stock is updated for each flow.
4. Report risks (race conditions, negative stock, missing validations).
5. Propose centralization, transactions, and constraints.
```

#### /debt-flow

**File:** `.claude/commands/debt-flow.md`

```markdown
# /debt-flow

You are `laravel-agent` with a focus on accounting logic.

Goal:
Review and, if needed, improve the customer debt tracking flow.

Inputs:
- `$ARGUMENTS` can specify:
  - "review entire customer debt flow"
  - "check how payments apply to invoices"
  - "validate debt aging report logic"

Instructions:
1. Read `.claude/memory.json` section `business_principles.debt`.
2. Identify tables for invoices, payments, credit notes, adjustments.
3. Analyze how debt is computed and aged.
4. Check for double-counting or missing entries.
5. Propose ledger structure and tests.
```

### 7.3 Trading Commands (MonaTrader)

#### /backtest

**File:** `.claude/commands/backtest.md`

```markdown
# /backtest

Goal:
Run or evaluate a backtest for a strategy.

Inputs:
- `$ARGUMENTS` describes the strategy and parameters.

Instructions:
1. trading-agent:
   - Review strategy logic and parameters.
   - Ensure risk and execution rules respected.
2. Run configurable backtest:
   - fee, slippage, leverage, mode.
3. Compute metrics:
   - PnL, max drawdown, winrate, Sharpe, expectancy.
4. Summarize strengths, weaknesses, and possible improvements.
```

#### /live-trade-check

**File:** `.claude/commands/live-trade-check.md`

```markdown
# /live-trade-check

Goal:
Validate system readiness for live trading.

Checklist:
- Exchange connectivity
- Data freshness
- Position sanity
- Risk engine active
- Cooldown status
- Exposure within limits

Instructions:
1. Check each item in the checklist.
2. Report status (OK / WARNING / CRITICAL).
3. Suggest fixes for any issues found.
```

#### /strategy-review

**File:** `.claude/commands/strategy-review.md`

```markdown
# /strategy-review

Goal:
Review trading strategy quality and safety.

Focus:
- Logic correctness
- Trend/volatility handling
- Stop-loss and take-profit
- Risk:reward profile
- Backtest stability across regimes

Instructions:
1. Analyze strategy code for logic errors.
2. Check for edge cases (gaps, low liquidity).
3. Evaluate risk:reward and position sizing.
4. Suggest improvements with code examples.
```

### 7.4 Orchestration Commands (MONAAI)

#### /add-worker

**File:** `.claude/commands/add-worker.md`

```markdown
# /add-worker

Goal:
Create a new queue worker with safe defaults.

Inputs:
- `$ARGUMENTS` describes the worker purpose.

Instructions:
1. node-agent:
   - Define queue name and job payload schema.
   - Implement processor with idempotency and retry policy.
   - Configure timeout and concurrency.
   - Add logging and metrics hooks.
2. Add tests for:
   - Job processing
   - Retry behavior
   - Idempotency
```

#### /orchestration-flow

**File:** `.claude/commands/orchestration-flow.md`

```markdown
# /orchestration-flow

Goal:
Design or verify an orchestration pipeline.

Instructions:
1. Map event flow and services involved.
2. Define queues and workers.
3. Document success and failure paths.
4. Suggest tests and observability points.
5. Provide text-based flow diagram.
```

#### /cost-analysis

**File:** `.claude/commands/cost-analysis.md`

```markdown
# /cost-analysis

Goal:
Review and reduce AI cost for orchestration flows.

Focus:
- Batching requests
- Model selection (small vs large)
- Prompt/context size
- Caching
- Token usage metrics

Instructions:
1. Analyze current AI usage patterns.
2. Identify high-cost flows.
3. Propose optimization strategies with estimated savings.
```

---

## 8. CLAUDE.MD CHO TỪNG PROJECT

### 8.1 CNG-ERP

**File:** `cng-erp/CLAUDE.md`

```markdown
# CNG-ERP — Project Manifest for Claude

You are the senior AI engineer assisting in development, maintenance, and refactoring of the CNG-ERP system.
Your objectives are: correctness, maintainability, stability, adherence to Laravel conventions, and safe structural evolution of the system.

This document defines:
- The project stack & architecture
- Coding standards and conventions
- Domain model & business rules
- Agents and delegation rules
- Testing expectations
- Security, validation, and API style
- Performance considerations

------------------------------------------------------------
# 1. SYSTEM OVERVIEW

CNG-ERP is an internal enterprise system used for multi-brand electrical equipment distribution.

Major features:
- Multi-brand product management
- Multi-warehouse inventory & transfers
- Order → Delivery Note → Invoice flows
- Customer management & pricing rules
- Debt tracking & reconciliation
- Reports for sales, inventory, financials

The system is a **SPA (Single Page Application)**:
- Backend API: **Laravel 10 + PHP 8.2**
- Frontend: **React + TypeScript + Ant Design**
- Database: **PostgreSQL**
- Authentication: **Laravel Sanctum (SPA tokens)**

------------------------------------------------------------
# 2. TECH STACK DETAILS

## Backend (Laravel)
- PHP 8.2+
- Laravel 10.x
- Sanctum for SPA token authentication
- Job queues: Laravel Queue (Redis)
- Database: PostgreSQL 14+
- Migrations + Seeders + Factories available

## Frontend
- React + TypeScript
- Ant Design as main UI component library
- Vite tooling
- React Query (or custom hooks) for API requests
- State management: local state + custom hooks

## CI/CD
- PHPStan level 7+
- PHPUnit for backend tests
- Jest/RTL for frontend tests

------------------------------------------------------------
# 3. ARCHITECTURE PRINCIPLES

### Backend Architectural Pattern (IMPORTANT)
**Use the following layering:**
- **Routes** → **Controllers** → **Services / Actions** → **Repositories / Models**
- Controllers: thin
- Services: where business logic lives
- Models: Eloquent ORM, relationships, attribute casts
- FormRequest: for any request that requires validation
- Policies: for all actions that require auth/permission checks

### Frontend Architectural Pattern
- UI components (Ant Design based)
- Feature-specific modules
- Strongly typed API clients
- Custom hooks for fetching/mutations/caching
- Reusable table & form components

### API Format (MUST FOLLOW)
Every API response should be wrapped as:

```json
{
  "data": ...,
  "message": "optional",
  "error": null
}
```

Errors:

```json
{
  "data": null,
  "error": { "message": "...", "code": "...", "fields": {...} }
}
```

------------------------------------------------------------
# 4. DOMAIN MODEL OVERVIEW

## 4.1. Products
- Each product belongs to a Brand
- Product may have Variants and Units
- Prices per brand & customer type

## 4.2. Customers
Types: Retail, Wholesale, Agent/Distributor
- Different types → different pricing levels

## 4.3. Orders → Delivery Notes → Invoices
The core flow:
Order (Draft) → Approved Order → Delivery Note → Invoice (final billing)

## 4.4. Inventory
- Warehouse-specific
- Stock changes on: Delivery Notes, Transfers, Adjustments
- Must prevent negative stock

## 4.5. Pricing & Discounts
Depends on: Brand, Customer type, Volume, Promotions

## 4.6. Customer Debt Tracking
- Total debt = unpaid invoices – payments
- Reports by customer, date range, salesperson

------------------------------------------------------------
# 5. CODING STANDARDS & CONVENTIONS

## Laravel Backend
- Always use FormRequest for validation
- Controllers should NOT contain business logic
- Use Resource classes for API responses
- Use Policies for authorization
- Use Eloquent scopes for reusable filters
- Use Enums for fixed sets

## React Frontend
- Use TypeScript everywhere
- Use Ant Design components
- Handle loading, error, empty states
- Use pagination, filters, sorting for tables

## Database
- Use timestamps and soft deletes
- Enforce foreign keys
- Add indexes for frequently filtered columns

------------------------------------------------------------
# 6. AGENT DELEGATION RULES

- Backend → `laravel-agent`
- Frontend → `react-agent`
- Database/schema → `laravel-agent`
- Queues/workers (if Node) → `node-agent`

When task touches both:
1. Let `laravel-agent` design the API
2. Let `react-agent` implement UI

------------------------------------------------------------
# 7. TESTING REQUIREMENTS

Backend:
- Controller test
- Service test
- Validation test
- Integration tests for critical paths

Frontend:
- Smoke tests for critical components
- Component unit tests (optional)

------------------------------------------------------------
# 8. SECURITY & VALIDATION

- Every API endpoint must use Auth + Validation + Policy
- Never return sensitive fields unless needed
- Prevent mass assignment
- Prevent negative stock

------------------------------------------------------------
# 9. PERFORMANCE GUIDELINES

- Avoid N+1 queries with `with()`
- Use indexes on filtered columns
- Use pagination everywhere
- Cache static data

------------------------------------------------------------
# 10. API VERSIONING

- All APIs: `/api/v1/...`
- Additive changes only
- Breaking changes → `/v1/...-v2` or `/api/v2`

------------------------------------------------------------
# 11. COMPLETION CRITERIA

A task is complete when:
- Code is correct
- Matches architecture & conventions
- Tests are included
- All API changes reflected in TypeScript types
- Response format follows global API spec
```

### 8.2 MonaTrader

**File:** `monatrader/CLAUDE.md`

```markdown
# MonaTrader — Project Manifest for Claude

You are the senior AI engineer supporting development of MonaTrader — a crypto trading platform including:

- multi-strategy backtesting
- real-time data ingestion
- live trading execution
- risk management layer
- dashboard & analytics

------------------------------------------------------------
# 1. SYSTEM OVERVIEW

Backend:
- **FastAPI (Python 3.11+)**
- Async architecture
- Multi-strategy engine
- Backtesting + live trading
- Risk Manager
- WebSocket for real-time data
- PostgreSQL + SQLModel/SQLAlchemy
- Redis (caching, rate-limits, event queue)

Frontend:
- **React + TypeScript + Ant Design**
- Real-time dashboards (PnL, positions, orders)
- Strategy builder UI
- System health monitoring

------------------------------------------------------------
# 2. TRADING DOMAIN MODEL

## 2.1. Strategy
- Pure function: signals in → actions out
- Must not execute orders directly
- Inputs: candles, indicators, market state, balance

## 2.2. Execution
- Order routing to exchange
- Retry logic, cancel/replace
- Fill reconciliation

## 2.3. Position Management
Track: size, avg price, unrealized/realized PnL, liquidation price, margin ratio
Enforce: max leverage, max exposure, max positions

## 2.4. Risk Manager
Must enforce:
- Daily max loss
- Max drawdown
- Exposure limits
- Stop-loss requirement
- Liquidation protection

## 2.5. Backtesting
- Vectorized where possible
- Deterministic
- Configurable: fee, slippage, execution type
- Metrics: Net PnL, Winrate, Max DD, Sharpe, Expectancy

------------------------------------------------------------
# 3. CODING STANDARDS

## Python / FastAPI
- Use type hints everywhere
- Use `async def` where relevant
- Services = class-based
- Controllers = routers under `/api/v1/`
- Schemas = Pydantic models

## React
- React + TS + AntD
- Real-time data via WebSocket hook
- Tables + charts via AntD + Recharts

------------------------------------------------------------
# 4. AGENT DELEGATION

- `trading-agent`: strategy, risk, backtesting, execution
- `react-agent`: dashboards, UI
- `node-agent`: orchestration workers if present

------------------------------------------------------------
# 5. TRADING SAFETY RULES

The system must enforce:
- Stop-loss requirement
- Max loss per day (auto-disable trading)
- Max leverage = system limit
- No doubling down when losing
- Never open new trades if data stale or exchange disconnected
- Cooldown after 3 consecutive losses

------------------------------------------------------------
# 6. VERSIONING RULES

- `/api/v1`
- Additive changes only
- Breaking changes require new version

------------------------------------------------------------
# 7. COMPLETION CRITERIA

- Strategy safe
- Risk rules respected
- No hidden leverage increase
- No unbounded exposure
- Tests updated
- UI updated
```

### 8.3 MONAAI

**File:** `monaai/CLAUDE.md`

```markdown
# MONAAI — AI Orchestration Platform (Project Manifest)

You are the senior AI engineer supporting MONAAI — a Node.js-based orchestration platform coordinating multiple AI agents, trading bots, analytics workers, and external services.

------------------------------------------------------------
# 1. SYSTEM OVERVIEW

MONAAI consists of:
- Node.js orchestration layer
- Event-driven pipelines
- Workers (BullMQ or RabbitMQ)
- Service integration:
  - Trading systems
  - Analytics systems
  - AI model inference
  - Notification systems

Objectives:
- Reliable job execution
- Scalable orchestration
- Cost awareness
- Multi-agent routing

------------------------------------------------------------
# 2. TECH STACK

Backend:
- Node.js 20+
- TypeScript
- NestJS or Express modular architecture
- Redis (queues)
- PostgreSQL for state
- Background workers
- Scheduler for periodic tasks

AI Integration:
- Claude API
- OpenAI API
- Custom model endpoints

------------------------------------------------------------
# 3. ARCHITECTURE PATTERNS

Use:
- Controllers → Services → Workers → Adapters
- Events: task.created, task.completed, task.failed
- Queue isolation: trading, analytics, notifications, ai-routing

Worker requirements:
- Idempotent
- Retry-safe
- Observable (logs + metrics)
- Timeout protected

------------------------------------------------------------
# 4. AGENT DELEGATION

- `node-agent`: main engineer
- `trading-agent`: when coordinating trading systems
- `react-agent`: if dashboard exists

------------------------------------------------------------
# 5. COST OPTIMIZATION RULES

- Use batching for AI requests
- Reduce context size
- Cache static prompts/templates
- Log token usage per job
- Use cheaper models whenever possible

------------------------------------------------------------
# 6. VERSIONING RULES

Same as CNG-ERP: /api/v1, additive changes only.

------------------------------------------------------------
# 7. TESTING

- Worker unit tests
- Orchestration flow tests
- Error scenario tests

------------------------------------------------------------
# 8. COMPLETION CRITERIA

- Workers are idempotent
- Retry policies defined
- Observability in place
- Cost metrics tracked
```

---

## 9. MEMORY.JSON CHO TỪNG PROJECT

### 9.1 CNG-ERP

**File:** `cng-erp/.claude/memory.json`

```json
{
  "project_facts": {
    "name": "CNG-ERP",
    "domain": "Multi-brand electrical equipment ERP",
    "backend_framework": "Laravel 10 (PHP 8.2)",
    "frontend_framework": "React + TypeScript + Ant Design",
    "database": "PostgreSQL",
    "auth": "Laravel Sanctum for SPA"
  },
  "business_principles": {
    "inventory": {
      "warehouse_scoped": true,
      "allow_negative_stock": false,
      "stock_changes_driven_by": [
        "delivery_notes",
        "warehouse_transfers",
        "stock_adjustments"
      ]
    },
    "pricing": {
      "depends_on": [
        "brand",
        "customer_type",
        "quantity",
        "promotions"
      ],
      "discount_layers": [
        "base_price",
        "customer_type_discount",
        "volume_discount",
        "promotion_discount"
      ]
    },
    "debt": {
      "tracked_per_customer": true,
      "sources": ["invoices"],
      "reductions": ["payments", "credit_notes", "adjustments"]
    }
  },
  "api_conventions": {
    "response_wrapper": true,
    "response_shape": {
      "success": { "data": "<payload>", "message": "optional", "error": null },
      "error": { "data": null, "error": { "message": "string", "code": "string", "fields": "optional" } }
    },
    "versioning": {
      "path_style": "/api/v1/...",
      "backward_compatible_by_default": true
    }
  },
  "reports": {
    "primary_axes": ["brand", "warehouse", "salesperson", "customer", "date_range"],
    "core_reports": ["sales_by_brand", "sales_by_warehouse", "inventory_snapshot", "customer_debt", "sales_by_salesperson"]
  }
}
```

### 9.2 MonaTrader

**File:** `monatrader/.claude/memory.json`

```json
{
  "domain": "Crypto trading system with backtesting and live trading",
  "risk": {
    "max_leverage": 5,
    "daily_loss_limit": 0.03,
    "drawdown_limit": 0.10,
    "required_stop_loss": true,
    "cooldown_after_losses": 3
  },
  "strategy_principles": {
    "isolation": true,
    "pure_functions": true,
    "no_order_execution_inside_strategy": true
  },
  "execution": {
    "requires_risk_approval": true,
    "circuit_breaker": true,
    "retry_policy": "exponential_backoff"
  },
  "backend_stack": "FastAPI + Pydantic + PostgreSQL + Redis",
  "frontend_stack": "React + TS + AntD + WebSocket",
  "reporting_axes": ["symbol", "timeframe", "strategy", "session", "day"]
}
```

### 9.3 MONAAI

**File:** `monaai/.claude/memory.json`

```json
{
  "domain": "AI orchestration and workflow automation",
  "queues": ["trading", "analytics", "notifications", "ai-routing"],
  "principles": {
    "idempotency": true,
    "observability": true,
    "retry_safe": true,
    "cost_aware": true
  },
  "ai_policy": {
    "prefer_small_models_first": true,
    "context_budgeting": true,
    "cache_static_prompts": true
  }
}
```

---

## 10. TEST TEMPLATES

### 10.1 Laravel CRUD Test Template

**File:** `tests/Feature/ExampleCrudTest.php`

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Brand;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BrandCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    // ==================== LIST ====================
    
    public function test_can_list_brands(): void
    {
        Brand::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/brands');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'code', 'active', 'created_at']
                ]
            ]);
    }

    public function test_list_brands_with_pagination(): void
    {
        Brand::factory()->count(25)->create();

        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/brands?page=1&per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data');
    }

    public function test_list_brands_with_filter(): void
    {
        Brand::factory()->create(['name' => 'CONIP', 'active' => true]);
        Brand::factory()->create(['name' => 'PIPO', 'active' => false]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/brands?active=true');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    // ==================== CREATE ====================

    public function test_can_create_brand(): void
    {
        $payload = [
            'name' => 'New Brand',
            'code' => 'NB',
            'active' => true
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/brands', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'New Brand');

        $this->assertDatabaseHas('brands', ['name' => 'New Brand']);
    }

    public function test_create_brand_validation_error(): void
    {
        $payload = ['name' => '']; // Missing required fields

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/brands', $payload);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'code']);
    }

    public function test_create_brand_duplicate_code(): void
    {
        Brand::factory()->create(['code' => 'EXISTING']);

        $payload = [
            'name' => 'New Brand',
            'code' => 'EXISTING',
            'active' => true
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/brands', $payload);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);
    }

    // ==================== READ ====================

    public function test_can_show_brand(): void
    {
        $brand = Brand::factory()->create();

        $response = $this->actingAs($this->user)
            ->getJson("/api/v1/brands/{$brand->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $brand->id);
    }

    public function test_show_brand_not_found(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/brands/99999');

        $response->assertNotFound();
    }

    // ==================== UPDATE ====================

    public function test_can_update_brand(): void
    {
        $brand = Brand::factory()->create(['name' => 'Old Name']);

        $payload = ['name' => 'New Name'];

        $response = $this->actingAs($this->user)
            ->putJson("/api/v1/brands/{$brand->id}", $payload);

        $response->assertOk()
            ->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('brands', ['id' => $brand->id, 'name' => 'New Name']);
    }

    // ==================== DELETE ====================

    public function test_can_delete_brand(): void
    {
        $brand = Brand::factory()->create();

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/v1/brands/{$brand->id}");

        $response->assertNoContent();
        $this->assertSoftDeleted('brands', ['id' => $brand->id]);
    }

    // ==================== AUTHORIZATION ====================

    public function test_unauthenticated_user_cannot_access(): void
    {
        $response = $this->getJson('/api/v1/brands');

        $response->assertUnauthorized();
    }
}
```

### 10.2 React Component Test Template

**File:** `frontend/src/modules/brands/__tests__/BrandList.test.tsx`

```tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandList } from '../BrandList';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock data
const mockBrands = [
  { id: 1, name: 'CONIP', code: 'CN', active: true },
  { id: 2, name: 'PIPO', code: 'PP', active: true },
  { id: 3, name: 'Liên Minh', code: 'LM', active: false },
];

// Mock server
const server = setupServer(
  rest.get('/api/v1/brands', (req, res, ctx) => {
    return res(ctx.json({ data: mockBrands }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('BrandList', () => {
  // ==================== RENDERING ====================

  it('renders loading state initially', () => {
    render(<BrandList />, { wrapper: createWrapper() });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders brands after loading', async () => {
    render(<BrandList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('CONIP')).toBeInTheDocument();
      expect(screen.getByText('PIPO')).toBeInTheDocument();
    });
  });

  it('renders empty state when no brands', async () => {
    server.use(
      rest.get('/api/v1/brands', (req, res, ctx) => {
        return res(ctx.json({ data: [] }));
      })
    );

    render(<BrandList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no brands found/i)).toBeInTheDocument();
    });
  });

  // ==================== ERROR HANDLING ====================

  it('renders error state on API failure', async () => {
    server.use(
      rest.get('/api/v1/brands', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<BrandList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  // ==================== INTERACTIONS ====================

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = jest.fn();
    render(<BrandList onEdit={onEdit} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('CONIP')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(mockBrands[0]);
  });

  it('shows delete confirmation modal', async () => {
    render(<BrandList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('CONIP')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  // ==================== FILTERING ====================

  it('filters brands by active status', async () => {
    render(<BrandList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('CONIP')).toBeInTheDocument();
    });

    const activeFilter = screen.getByLabelText(/active only/i);
    fireEvent.click(activeFilter);

    // Should trigger new API call with filter
    await waitFor(() => {
      expect(screen.queryByText('Liên Minh')).not.toBeInTheDocument();
    });
  });
});
```

### 10.3 Python Backtest Test Template

**File:** `tests/test_backtest.py`

```python
import pytest
from datetime import datetime, timedelta
from decimal import Decimal

from app.services.strategy.base import BaseStrategy
from app.services.backtest.engine import BacktestEngine
from app.services.risk.manager import RiskManager
from app.schemas.candle import Candle
from app.schemas.order import Order, OrderSide, OrderType


# ==================== FIXTURES ====================

@pytest.fixture
def sample_candles():
    """Generate sample OHLCV data for testing."""
    base_time = datetime(2024, 1, 1)
    candles = []
    
    prices = [100, 102, 101, 105, 103, 108, 106, 110, 107, 112]
    
    for i, price in enumerate(prices):
        candles.append(Candle(
            timestamp=base_time + timedelta(hours=i),
            open=Decimal(price),
            high=Decimal(price * 1.02),
            low=Decimal(price * 0.98),
            close=Decimal(price),
            volume=Decimal(1000)
        ))
    
    return candles


@pytest.fixture
def risk_manager():
    """Create RiskManager with test configuration."""
    return RiskManager(
        max_leverage=5,
        daily_loss_limit=Decimal("0.03"),
        max_drawdown=Decimal("0.10"),
        require_stop_loss=True
    )


@pytest.fixture
def backtest_engine(risk_manager):
    """Create BacktestEngine with test configuration."""
    return BacktestEngine(
        initial_balance=Decimal("10000"),
        fee_rate=Decimal("0.001"),
        slippage=Decimal("0.0005"),
        risk_manager=risk_manager
    )


# ==================== STRATEGY TESTS ====================

class TestSimpleStrategy:
    """Test a simple moving average crossover strategy."""
    
    def test_strategy_generates_signals(self, sample_candles):
        """Strategy should generate buy/sell signals."""
        strategy = SimpleMAStrategy(short_period=2, long_period=5)
        
        signals = []
        for candle in sample_candles:
            signal = strategy.on_candle(candle)
            if signal:
                signals.append(signal)
        
        assert len(signals) > 0
    
    def test_strategy_is_pure_function(self, sample_candles):
        """Strategy should be deterministic - same input = same output."""
        strategy1 = SimpleMAStrategy(short_period=2, long_period=5)
        strategy2 = SimpleMAStrategy(short_period=2, long_period=5)
        
        for candle in sample_candles:
            signal1 = strategy1.on_candle(candle)
            signal2 = strategy2.on_candle(candle)
            assert signal1 == signal2
    
    def test_strategy_does_not_execute_orders(self, sample_candles):
        """Strategy should only generate signals, not execute orders."""
        strategy = SimpleMAStrategy(short_period=2, long_period=5)
        
        for candle in sample_candles:
            signal = strategy.on_candle(candle)
            # Signal should be a recommendation, not an executed order
            if signal:
                assert hasattr(signal, 'action')
                assert not hasattr(signal, 'fill_price')


# ==================== BACKTEST ENGINE TESTS ====================

class TestBacktestEngine:
    """Test backtest engine functionality."""
    
    def test_backtest_runs_successfully(self, backtest_engine, sample_candles):
        """Backtest should complete without errors."""
        strategy = SimpleMAStrategy(short_period=2, long_period=5)
        
        result = backtest_engine.run(strategy, sample_candles)
        
        assert result is not None
        assert hasattr(result, 'total_pnl')
        assert hasattr(result, 'trades')
    
    def test_backtest_calculates_metrics(self, backtest_engine, sample_candles):
        """Backtest should calculate all required metrics."""
        strategy = SimpleMAStrategy(short_period=2, long_period=5)
        
        result = backtest_engine.run(strategy, sample_candles)
        
        assert 'net_pnl' in result.metrics
        assert 'max_drawdown' in result.metrics
        assert 'win_rate' in result.metrics
        assert 'sharpe_ratio' in result.metrics
        assert 'expectancy' in result.metrics
    
    def test_backtest_applies_fees(self, backtest_engine, sample_candles):
        """Backtest should correctly apply trading fees."""
        strategy = SimpleMAStrategy(short_period=2, long_period=5)
        
        result = backtest_engine.run(strategy, sample_candles)
        
        # Total fees should be positive if trades were made
        if len(result.trades) > 0:
            assert result.total_fees > 0
    
    def test_backtest_applies_slippage(self, sample_candles, risk_manager):
        """Backtest should apply slippage to fills."""
        engine_no_slippage = BacktestEngine(
            initial_balance=Decimal("10000"),
            fee_rate=Decimal("0"),
            slippage=Decimal("0"),
            risk_manager=risk_manager
        )
        
        engine_with_slippage = BacktestEngine(
            initial_balance=Decimal("10000"),
            fee_rate=Decimal("0"),
            slippage=Decimal("0.01"),  # 1% slippage
            risk_manager=risk_manager
        )
        
        strategy = SimpleMAStrategy(short_period=2, long_period=5)
        
        result_no_slip = engine_no_slippage.run(strategy, sample_candles)
        result_with_slip = engine_with_slippage.run(strategy, sample_candles)
        
        # Slippage should reduce PnL
        assert result_with_slip.net_pnl <= result_no_slip.net_pnl


# ==================== RISK MANAGER TESTS ====================

class TestRiskManager:
    """Test risk management functionality."""
    
    def test_rejects_order_without_stop_loss(self, risk_manager):
        """Risk manager should reject orders without stop loss."""
        order = Order(
            symbol="BTCUSDT",
            side=OrderSide.BUY,
            type=OrderType.MARKET,
            quantity=Decimal("0.1"),
            stop_loss=None  # No stop loss
        )
        
        result = risk_manager.validate_order(order)
        
        assert result.approved is False
        assert "stop_loss" in result.reason.lower()
    
    def test_rejects_order_exceeding_leverage(self, risk_manager):
        """Risk manager should reject orders exceeding max leverage."""
        order = Order(
            symbol="BTCUSDT",
            side=OrderSide.BUY,
            type=OrderType.MARKET,
            quantity=Decimal("100"),  # Very large position
            leverage=10,  # Exceeds max of 5
            stop_loss=Decimal("95")
        )
        
        result = risk_manager.validate_order(order, account_balance=Decimal("1000"))
        
        assert result.approved is False
        assert "leverage" in result.reason.lower()
    
    def test_blocks_trading_after_daily_loss_limit(self, risk_manager):
        """Risk manager should block trading after daily loss limit reached."""
        # Simulate losses
        risk_manager.record_loss(Decimal("350"))  # 3.5% loss
        
        order = Order(
            symbol="BTCUSDT",
            side=OrderSide.BUY,
            type=OrderType.MARKET,
            quantity=Decimal("0.1"),
            stop_loss=Decimal("95")
        )
        
        result = risk_manager.validate_order(order, account_balance=Decimal("10000"))
        
        assert result.approved is False
        assert "daily loss" in result.reason.lower()
    
    def test_applies_cooldown_after_consecutive_losses(self, risk_manager):
        """Risk manager should apply cooldown after consecutive losses."""
        # Record 3 consecutive losses
        for _ in range(3):
            risk_manager.record_trade_result(pnl=Decimal("-100"))
        
        assert risk_manager.is_in_cooldown() is True
    
    def test_calculates_max_position_size(self, risk_manager):
        """Risk manager should correctly calculate max position size."""
        account_balance = Decimal("10000")
        leverage = 5
        
        max_size = risk_manager.calculate_max_position_size(
            account_balance=account_balance,
            leverage=leverage
        )
        
        # Max position = balance * leverage
        assert max_size == account_balance * leverage


# ==================== REGRESSION TESTS ====================

class TestBacktestRegression:
    """Regression tests to ensure consistent backtest results."""
    
    def test_deterministic_results(self, backtest_engine, sample_candles):
        """Same inputs should produce same outputs."""
        strategy = SimpleMAStrategy(short_period=2, long_period=5)
        
        result1 = backtest_engine.run(strategy, sample_candles)
        result2 = backtest_engine.run(strategy, sample_candles)
        
        assert result1.net_pnl == result2.net_pnl
        assert result1.max_drawdown == result2.max_drawdown
        assert len(result1.trades) == len(result2.trades)
    
    def test_known_scenario_pnl(self):
        """Test PnL calculation with known scenario."""
        # Buy at 100, sell at 110, 1% fee each side
        # Expected: (110 - 100) - (100 * 0.01) - (110 * 0.01) = 10 - 1 - 1.1 = 7.9
        
        engine = BacktestEngine(
            initial_balance=Decimal("10000"),
            fee_rate=Decimal("0.01"),
            slippage=Decimal("0"),
            risk_manager=RiskManager(max_leverage=10, daily_loss_limit=Decimal("1"))
        )
        
        # Create minimal test case
        result = engine.simulate_trade(
            entry_price=Decimal("100"),
            exit_price=Decimal("110"),
            quantity=Decimal("1")
        )
        
        expected_pnl = Decimal("7.9")
        assert abs(result.pnl - expected_pnl) < Decimal("0.01")
```

### 10.4 Node.js Worker Test Template

**File:** `tests/workers/analytics-worker.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { AnalyticsWorker } from '../../src/workers/analytics-worker';
import { AnalyticsService } from '../../src/services/analytics-service';

// ==================== MOCKS ====================

jest.mock('../../src/services/analytics-service');

const mockRedis = new Redis({ maxRetriesPerRequest: null });
const QUEUE_NAME = 'test-analytics';

// ==================== FIXTURES ====================

const createTestJob = (data: Record<string, unknown>): Partial<Job> => ({
  id: `test-job-${Date.now()}`,
  data,
  attemptsMade: 0,
  opts: { attempts: 3 },
  updateProgress: jest.fn(),
  log: jest.fn(),
});

// ==================== TESTS ====================

describe('AnalyticsWorker', () => {
  let queue: Queue;
  let worker: AnalyticsWorker;
  let analyticsService: jest.Mocked<AnalyticsService>;

  beforeEach(async () => {
    queue = new Queue(QUEUE_NAME, { connection: mockRedis });
    analyticsService = new AnalyticsService() as jest.Mocked<AnalyticsService>;
    worker = new AnalyticsWorker(queue, analyticsService);
  });

  afterEach(async () => {
    await worker.close();
    await queue.close();
    jest.clearAllMocks();
  });

  // ==================== JOB PROCESSING ====================

  describe('Job Processing', () => {
    it('should process daily-pnl job successfully', async () => {
      const jobData = {
        type: 'daily-pnl',
        date: '2024-01-15',
        accountId: 'acc-123',
      };

      analyticsService.calculateDailyPnL.mockResolvedValue({
        date: '2024-01-15',
        pnl: 1500.50,
        trades: 25,
      });

      const job = createTestJob(jobData) as Job;
      const result = await worker.process(job);

      expect(result).toEqual({
        success: true,
        data: {
          date: '2024-01-15',
          pnl: 1500.50,
          trades: 25,
        },
      });
      expect(analyticsService.calculateDailyPnL).toHaveBeenCalledWith(
        'acc-123',
        '2024-01-15'
      );
    });

    it('should handle unknown job type', async () => {
      const job = createTestJob({ type: 'unknown-type' }) as Job;

      await expect(worker.process(job)).rejects.toThrow('Unknown job type');
    });

    it('should validate job payload', async () => {
      const job = createTestJob({ type: 'daily-pnl' }) as Job; // Missing required fields

      await expect(worker.process(job)).rejects.toThrow('Invalid job payload');
    });
  });

  // ==================== IDEMPOTENCY ====================

  describe('Idempotency', () => {
    it('should return cached result for duplicate job', async () => {
      const jobData = {
        type: 'daily-pnl',
        date: '2024-01-15',
        accountId: 'acc-123',
        idempotencyKey: 'unique-key-123',
      };

      analyticsService.calculateDailyPnL.mockResolvedValue({
        date: '2024-01-15',
        pnl: 1500.50,
        trades: 25,
      });

      // First call
      const job1 = createTestJob(jobData) as Job;
      await worker.process(job1);

      // Second call with same idempotency key
      const job2 = createTestJob(jobData) as Job;
      await worker.process(job2);

      // Service should only be called once
      expect(analyticsService.calculateDailyPnL).toHaveBeenCalledTimes(1);
    });

    it('should process jobs with different idempotency keys', async () => {
      const baseData = {
        type: 'daily-pnl',
        date: '2024-01-15',
        accountId: 'acc-123',
      };

      analyticsService.calculateDailyPnL.mockResolvedValue({
        date: '2024-01-15',
        pnl: 1500.50,
        trades: 25,
      });

      const job1 = createTestJob({ ...baseData, idempotencyKey: 'key-1' }) as Job;
      const job2 = createTestJob({ ...baseData, idempotencyKey: 'key-2' }) as Job;

      await worker.process(job1);
      await worker.process(job2);

      expect(analyticsService.calculateDailyPnL).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== RETRY BEHAVIOR ====================

  describe('Retry Behavior', () => {
    it('should retry on transient errors', async () => {
      const jobData = {
        type: 'daily-pnl',
        date: '2024-01-15',
        accountId: 'acc-123',
      };

      // Fail first 2 times, succeed on 3rd
      analyticsService.calculateDailyPnL
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({
          date: '2024-01-15',
          pnl: 1500.50,
          trades: 25,
        });

      const job = createTestJob(jobData) as Job;
      job.attemptsMade = 0;

      // First attempt fails
      await expect(worker.process(job)).rejects.toThrow('Connection timeout');

      // Second attempt fails
      job.attemptsMade = 1;
      await expect(worker.process(job)).rejects.toThrow('Connection timeout');

      // Third attempt succeeds
      job.attemptsMade = 2;
      const result = await worker.process(job);
      expect(result.success).toBe(true);
    });

    it('should not retry on validation errors', async () => {
      const job = createTestJob({ type: 'daily-pnl' }) as Job; // Invalid payload

      const error = await worker.process(job).catch(e => e);

      expect(error.message).toContain('Invalid');
      expect(error.unrecoverable).toBe(true); // Should not retry
    });
  });

  // ==================== ERROR HANDLING ====================

  describe('Error Handling', () => {
    it('should log errors with context', async () => {
      const logSpy = jest.spyOn(worker['logger'], 'error');

      const jobData = {
        type: 'daily-pnl',
        date: '2024-01-15',
        accountId: 'acc-123',
      };

      analyticsService.calculateDailyPnL.mockRejectedValue(
        new Error('Database connection failed')
      );

      const job = createTestJob(jobData) as Job;

      await expect(worker.process(job)).rejects.toThrow();

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: job.id,
          jobType: 'daily-pnl',
          error: 'Database connection failed',
        })
      );
    });

    it('should emit failed event on permanent failure', async () => {
      const failedHandler = jest.fn();
      worker.on('failed', failedHandler);

      const job = createTestJob({
        type: 'daily-pnl',
        date: 'invalid-date',
        accountId: 'acc-123',
      }) as Job;

      analyticsService.calculateDailyPnL.mockRejectedValue(
        new Error('Invalid date format')
      );

      await expect(worker.process(job)).rejects.toThrow();

      // After max retries, should emit failed
      expect(failedHandler).toHaveBeenCalled();
    });
  });

  // ==================== METRICS ====================

  describe('Metrics', () => {
    it('should track job processing time', async () => {
      const metricsSpy = jest.spyOn(worker['metrics'], 'recordDuration');

      const jobData = {
        type: 'daily-pnl',
        date: '2024-01-15',
        accountId: 'acc-123',
      };

      analyticsService.calculateDailyPnL.mockResolvedValue({
        date: '2024-01-15',
        pnl: 1500.50,
        trades: 25,
      });

      const job = createTestJob(jobData) as Job;
      await worker.process(job);

      expect(metricsSpy).toHaveBeenCalledWith(
        'analytics_job_duration',
        expect.any(Number),
        { type: 'daily-pnl' }
      );
    });

    it('should increment success counter', async () => {
      const metricsSpy = jest.spyOn(worker['metrics'], 'increment');

      const jobData = {
        type: 'daily-pnl',
        date: '2024-01-15',
        accountId: 'acc-123',
      };

      analyticsService.calculateDailyPnL.mockResolvedValue({
        date: '2024-01-15',
        pnl: 1500.50,
        trades: 25,
      });

      const job = createTestJob(jobData) as Job;
      await worker.process(job);

      expect(metricsSpy).toHaveBeenCalledWith(
        'analytics_jobs_completed',
        { type: 'daily-pnl', status: 'success' }
      );
    });
  });

  // ==================== TIMEOUT ====================

  describe('Timeout', () => {
    it('should timeout long-running jobs', async () => {
      jest.useFakeTimers();

      const jobData = {
        type: 'daily-pnl',
        date: '2024-01-15',
        accountId: 'acc-123',
      };

      // Simulate a long-running operation
      analyticsService.calculateDailyPnL.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 60000))
      );

      const job = createTestJob(jobData) as Job;
      const processPromise = worker.process(job);

      // Advance time past timeout
      jest.advanceTimersByTime(35000); // 35 seconds (default timeout is 30s)

      await expect(processPromise).rejects.toThrow('Job timeout');

      jest.useRealTimers();
    });
  });
});
```

---

## 11. INSTALLER SCRIPT

**File:** `setup-claude-toolkit.sh`

```bash
#!/usr/bin/env bash
set -e

# ============================================
# Claude Enterprise Toolkit Installer
# Supports: CNG-ERP, MonaTrader, MONAAI
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -------- Helpers --------

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

timestamp() {
  date +"%Y%m%d-%H%M%S"
}

backup_file() {
  local file="$1"
  if [ -f "$file" ]; then
    local ts
    ts=$(timestamp)
    local backup="${file}.bak.${ts}"
    log_info "Backup: $file -> $backup"
    cp "$file" "$backup"
  fi
}

ensure_dir() {
  local dir="$1"
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    log_info "Created directory: $dir"
  fi
}

check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check Node.js
  if ! command -v node >/dev/null 2>&1; then
    log_error "Node.js is not installed. Please install Node.js 20+"
    exit 1
  fi
  
  local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$node_version" -lt 20 ]; then
    log_warn "Node.js version is $node_version. Recommended: 20+"
  fi
  
  # Check npm
  if ! command -v npm >/dev/null 2>&1; then
    log_error "npm is not installed."
    exit 1
  fi
  
  # Check/Install claudekit
  if ! command -v claudekit >/dev/null 2>&1; then
    log_warn "'claudekit' is not installed. Installing..."
    npm install -g claudekit
    if ! command -v claudekit >/dev/null 2>&1; then
      log_error "Failed to install claudekit"
      exit 1
    fi
  fi
  
  log_success "All prerequisites met!"
}

run_claudekit_setup() {
  local project_dir="$1"
  if [ -f "$project_dir/CLAUDE.md" ] || [ -d "$project_dir/.claude" ]; then
    log_info "Project already has Claude config. Skipping 'claudekit setup'."
  else
    log_info "Running claudekit setup in $project_dir"
    (cd "$project_dir" && claudekit setup) || log_warn "claudekit setup failed. Continuing..."
  fi
}

# -------- Template Writers --------
# (Full content for each template function - abbreviated here for brevity)
# See the full script in the previous response

# -------- Main --------

usage() {
  cat << EOF
${BLUE}Claude Enterprise Toolkit Installer${NC}

Usage:
  $0 cng-erp       [project_dir]  # default ./cng-erp
  $0 monatrader    [project_dir]  # default ./monatrader
  $0 monaai        [project_dir]  # default ./monaai
  $0 all           [base_dir]     # default . (expects subdirs)

Examples:
  $0 cng-erp ~/projects/cng-erp
  $0 all ~/projects

EOF
}

if [ $# -lt 1 ]; then
  usage
  exit 1
fi

check_prerequisites

TARGET="$1"
BASE_DIR="${2:-.}"

case "$TARGET" in
  cng-erp)
    PROJECT_DIR="${2:-./cng-erp}"
    setup_cng_erp "$PROJECT_DIR"
    ;;
  monatrader)
    PROJECT_DIR="${2:-./monatrader}"
    setup_monatrader "$PROJECT_DIR"
    ;;
  monaai)
    PROJECT_DIR="${2:-./monaai}"
    setup_monaai "$PROJECT_DIR"
    ;;
  all)
    ROOT="${BASE_DIR}"
    setup_cng_erp "$ROOT/cng-erp"
    setup_monatrader "$ROOT/monatrader"
    setup_monaai "$ROOT/monaai"
    ;;
  *)
    usage
    exit 1
    ;;
esac

echo
echo -e "${GREEN}======== SETUP COMPLETE ========${NC}"
echo "Target: $TARGET"
echo "Directory: $BASE_DIR"
echo
echo -e "${BLUE}Next steps:${NC}"
echo "  1) cd <project_dir>"
echo "  2) Open Claude Code (CLI or VS Code)"
echo "  3) Try commands:"
echo "     /add-crud manage brands"
echo "     /backtest BTCUSDT breakout"
echo "     /add-worker analytics"
echo "================================"
```

---

## 12. XÁC MINH & KHẮC PHỤC SỰ CỐ

### 12.1 Xác minh cài đặt

```bash
# Kiểm tra cấu trúc files
ls -la .claude/
ls -la .claude/agents/
ls -la .claude/commands/

# Kiểm tra nội dung files
cat CLAUDE.md | head -20
cat AGENTS.md | head -20
cat .claude/memory.json | jq .

# Test trong Claude Code
cd ~/projects/cng-erp
claude
# Gõ: /add-crud manage test entity
```

### 12.2 Các lỗi thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `claudekit: command not found` | Chưa cài claudekit | `npm install -g claudekit` |
| Slash commands không hoạt động | Files không đúng vị trí | Kiểm tra `.claude/commands/` |
| Agent không được nhận diện | AGENTS.md thiếu hoặc sai | Kiểm tra format AGENTS.md |
| Memory không persist | memory.json lỗi syntax | Validate JSON format |

### 12.3 Debug mode

```bash
# Chạy Claude Code với debug
DEBUG=* claude

# Kiểm tra logs
cat ~/.claude/logs/latest.log
```

---

## 13. BEST PRACTICES

### 13.1 Khi sử dụng Agents

✅ **Nên làm:**
- Delegate rõ ràng cho đúng agent
- Cung cấp context đầy đủ trong `$ARGUMENTS`
- Review output của agent trước khi apply

❌ **Không nên:**
- Để một agent làm việc ngoài chuyên môn
- Bỏ qua suggestions về tests
- Apply code mà không review

### 13.2 Khi viết Slash Commands

✅ **Nên làm:**
- Mô tả rõ Goal và Instructions
- Chỉ định agent phù hợp
- Include test requirements

❌ **Không nên:**
- Viết commands quá chung chung
- Bỏ qua validation steps
- Quên mention CLAUDE.md conventions

### 13.3 Khi cập nhật Memory.json

✅ **Nên làm:**
- Cập nhật khi có business rules mới
- Document architectural decisions
- Keep JSON valid

❌ **Không nên:**
- Lưu sensitive data (passwords, keys)
- Lưu temporary data
- Làm file quá lớn (>100KB)

---

## APPENDIX

### A. Quick Reference Card

```
╔════════════════════════════════════════════════════════════════╗
║                 CLAUDE ENTERPRISE TOOLKIT                       ║
╠════════════════════════════════════════════════════════════════╣
║ AGENTS:                                                         ║
║   trading-agent   → Trading, risk, backtesting                 ║
║   laravel-agent   → Laravel backend                            ║
║   react-agent     → React frontend                             ║
║   node-agent      → Node.js orchestration                      ║
╠════════════════════════════════════════════════════════════════╣
║ BASE COMMANDS:                                                  ║
║   /add-endpoint      → Add API endpoint                        ║
║   /build-dashboard   → Create React dashboard                  ║
║   /full-review       → Multi-agent code review                 ║
║   /risk-check        → Risk management review                  ║
║   /review-trading    → Trading logic review                    ║
╠════════════════════════════════════════════════════════════════╣
║ ERP COMMANDS (CNG-ERP):                                        ║
║   /add-crud          → Full CRUD for entity                    ║
║   /add-report        → New ERP report                          ║
║   /check-stock       → Inventory validation                    ║
║   /debt-flow         → Debt tracking review                    ║
╠════════════════════════════════════════════════════════════════╣
║ TRADING COMMANDS (MonaTrader):                                 ║
║   /backtest          → Run strategy backtest                   ║
║   /live-trade-check  → System readiness check                  ║
║   /strategy-review   → Strategy quality review                 ║
╠════════════════════════════════════════════════════════════════╣
║ ORCHESTRATION COMMANDS (MONAAI):                               ║
║   /add-worker        → New queue worker                        ║
║   /orchestration-flow→ Pipeline design                         ║
║   /cost-analysis     → AI cost optimization                    ║
╚════════════════════════════════════════════════════════════════╝
```

### B. File Locations Summary

```
project/
├── CLAUDE.md              ← Project manifest (root)
├── AGENTS.md              ← Agent definitions (root)
└── .claude/
    ├── agents/
    │   ├── trading-agent.md
    │   ├── laravel-agent.md
    │   ├── react-agent.md
    │   └── node-agent.md
    ├── commands/
    │   ├── add-endpoint.md
    │   ├── build-dashboard.md
    │   ├── full-review.md
    │   ├── risk-check.md
    │   ├── review-trading.md
    │   └── [project-specific].md
    └── memory.json        ← Project memory
```

---

**END OF DOCUMENT**

*Version 1.0 - November 2024*
*Claude Enterprise Toolkit by Mona & Claude*
