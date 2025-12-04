# CCG Specialized Agents

CCG includes 11 specialized agents that can be automatically selected based on task context.

## Agent Selection

Use `agents_select` to automatically choose the best agent:

```json
{
  "task": "Implement JWT authentication for the API",
  "domain": "backend",
  "files": ["src/auth/login.ts"]
}
```

## Available Agents

---

### 1. Trading Agent

**ID**: `trading-agent`
**Role**: Senior Quant & Trading Systems Engineer

#### Specializations
- Trading logic
- Risk management
- Position sizing
- Backtesting
- Exchange APIs
- Strategy evaluation

#### Responsibilities
- Design and implement trading algorithms
- Build risk management systems
- Develop backtesting frameworks
- Integrate with exchange APIs
- Evaluate trading strategies

---

### 2. Laravel Agent

**ID**: `laravel-agent`
**Role**: Senior Laravel Backend Engineer

#### Specializations
- Laravel
- PHP
- Eloquent ORM
- REST APIs
- Migrations
- Validation
- Policies

#### Responsibilities
- Build Laravel applications
- Design database schemas with Eloquent
- Create RESTful APIs
- Implement validation and policies
- Manage migrations

---

### 3. React Agent

**ID**: `react-agent`
**Role**: Senior React & TypeScript Frontend Engineer

#### Specializations
- React
- TypeScript
- Components
- Hooks
- State management
- UI/UX patterns

#### Responsibilities
- Build React components
- Implement custom hooks
- Manage application state
- Create responsive UIs

---

### 4. Node Agent

**ID**: `node-agent`
**Role**: Senior Node.js & TypeScript Orchestration Engineer

#### Specializations
- Node.js
- TypeScript
- Event-driven architecture
- Message queues
- Workers
- API gateway

#### Responsibilities
- Build Node.js services
- Design event-driven systems
- Implement message queues
- Create API gateways
- Manage worker processes

---

### 5. UI/UX Agent

**ID**: `uiux-agent`
**Role**: Senior UI/UX Designer & Frontend Specialist

#### Specializations
- UI Design
- UX Patterns
- Responsive Design
- Tailwind CSS
- Accessibility (a11y)
- Design Systems
- Animations
- Mobile-first

#### Responsibilities
- Design user interfaces
- Create design systems
- Implement accessibility features
- Build responsive layouts
- Create animations
- Ensure mobile-first approach

---

### 6. Tester Agent

**ID**: `tester-agent`
**Role**: Senior QA & Test Automation Engineer

#### Specializations
- Unit Testing
- Integration Testing
- E2E Testing
- Jest
- Vitest
- Playwright
- Cypress
- TDD
- BDD

#### Responsibilities
- Write unit tests
- Create integration tests
- Build E2E test suites
- Implement TDD/BDD workflows
- Ensure test coverage

---

### 7. Python Agent

**ID**: `python-agent`
**Role**: Senior Python & AI/ML Engineer

#### Specializations
- Python
- FastAPI
- Django
- Machine Learning
- Data Science
- Pandas
- PyTorch
- async/await

#### Responsibilities
- Build Python applications
- Develop ML models
- Create FastAPI/Django services
- Implement data pipelines
- Handle async operations

---

### 8. DevOps Agent

**ID**: `devops-agent`
**Role**: Senior DevOps & Platform Engineer

#### Specializations
- Docker
- Kubernetes
- CI/CD
- GitHub Actions
- Terraform
- AWS
- GCP
- Linux
- Nginx

#### Responsibilities
- Build CI/CD pipelines
- Manage container orchestration
- Configure infrastructure as code
- Deploy to cloud platforms
- Manage server configurations

---

### 9. Database Agent

**ID**: `database-agent`
**Role**: Senior Database Architect & DBA

#### Specializations
- PostgreSQL
- MySQL
- MongoDB
- Redis
- Schema Design
- Query Optimization
- Migrations
- Indexing
- Prisma

#### Responsibilities
- Design database schemas
- Optimize query performance
- Manage migrations
- Implement indexing strategies
- Configure caching with Redis

---

### 10. MCP Core Agent

**ID**: `mcp-core-agent`
**Role**: Senior MCP Server & Protocol Engineer

#### Specializations
- MCP Protocol
- Tool Registration
- JSON-RPC
- Server Lifecycle
- Transport Layer
- Resource Management

#### Responsibilities
- Build MCP servers
- Register tools and resources
- Implement JSON-RPC handlers
- Manage server lifecycle
- Handle transport protocols

---

### 11. Module Architect Agent

**ID**: `module-architect-agent`
**Role**: Senior Software Architect & Module Designer

#### Specializations
- Module Architecture
- EventBus Patterns
- Service Design
- Dependency Injection
- Plugin Systems
- TypeScript Patterns

#### Responsibilities
- Design module architecture
- Implement event-driven patterns
- Create service layers
- Build plugin systems
- Apply design patterns

---

## Agent Coordination

Use `agents_coordinate` to combine multiple agents:

```json
{
  "task": "Build a trading dashboard with authentication",
  "agentIds": ["trading-agent", "react-agent", "node-agent"],
  "mode": "sequential"
}
```

### Coordination Modes

| Mode | Description |
|------|-------------|
| `sequential` | Agents work one after another |
| `parallel` | All agents work simultaneously |
| `review` | First agent does work, others review |

---

## Registering Custom Agents

```json
{
  "id": "custom-agent",
  "name": "Custom Agent",
  "role": "Your custom role",
  "specializations": ["skill1", "skill2"],
  "responsibilities": ["task1", "task2"],
  "principles": ["principle1"]
}
```

Use `agents_register` to add your custom agent.

---

## Code Optimization Mode

When running code optimization tasks, CCG automatically coordinates the right agents based on the optimization phase.

### Agent Mapping for Code Optimization

| Phase | Primary Agent | Support Agents |
|-------|---------------|----------------|
| **Scan & Metrics** | Module Architect | - |
| **Hotspot Detection** | Module Architect | Language-specific (based on file types) |
| **Refactor Planning** | Module Architect | Tester Agent |
| **Implementation** | Language-specific | Module Architect (review) |
| **Validation** | Tester Agent | DevOps Agent (if CI changes) |
| **Recording** | Module Architect | - |

### Language-Specific Agent Selection

| File Extension | Agent Selected |
|----------------|----------------|
| `.ts`, `.tsx`, `.js`, `.jsx` | Node Agent |
| `.py` | Python Agent |
| `.php` | Laravel Agent |
| `.go`, `.rs`, `.java` | Node Agent (general) |

### Example: Code Optimization Coordination

```json
{
  "task": "Optimize the authentication module",
  "agentIds": ["module-architect-agent", "node-agent", "tester-agent"],
  "mode": "sequential"
}
```

### Automatic Agent Selection for Hotspots

When `code_hotspots` identifies files to refactor, CCG can automatically select the appropriate agents:

```
Hotspot: src/modules/guard/guard.service.ts
  -> Primary: node-agent (TypeScript)
  -> Review: module-architect-agent
  -> Test: tester-agent

Hotspot: src/api/handlers.py
  -> Primary: python-agent
  -> Review: module-architect-agent
  -> Test: tester-agent
```
