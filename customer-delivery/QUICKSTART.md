# CCG Quick Start Guide

## Prerequisites

- Node.js >= 18.0.0
- Claude Code CLI installed
- npm or yarn

## Installation

### Option 1: NPM Install (Recommended)

```bash
npm install @anthropic-community/claude-code-guardian
```

### Option 2: Clone Repository

```bash
git clone https://github.com/anthropic-community/claude-code-guardian.git
cd claude-code-guardian
npm install
npm run build
```

## Configuration

### Add to Claude Code

#### Method 1: CLI Command

```bash
claude mcp add claude-code-guardian -- node /path/to/dist/index.js
```

#### Method 2: Configuration File

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "claude-code-guardian": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {}
    }
  }
}
```

## Verify Installation

Start Claude Code and verify CCG is loaded:

```
> session_init
```

Expected response:
```json
{
  "session": {
    "id": "...",
    "status": "active"
  },
  "modules": {
    "memory": { "enabled": true },
    "guard": { "enabled": true },
    "workflow": { "enabled": true }
  }
}
```

## Basic Usage

### 1. Store a Memory

```
> memory_store
{
  "content": "Project uses TypeScript with strict mode",
  "type": "convention",
  "importance": 8,
  "tags": ["typescript", "config"]
}
```

### 2. Validate Code

```
> guard_validate
{
  "code": "const query = 'SELECT * FROM users WHERE id = ' + id;",
  "filename": "user.service.ts"
}
```

### 3. Create a Task

```
> workflow_task_create
{
  "name": "Implement user authentication",
  "priority": "high",
  "description": "Add JWT-based auth"
}
```

### 4. Select an Agent

```
> agents_select
{
  "task": "Build a React dashboard component",
  "files": ["src/components/Dashboard.tsx"]
}
```

### 5. Start Latent Chain Mode

```
> latent_context_create
{
  "taskId": "auth-feature",
  "phase": "analysis"
}
```

### 6. Analyze & Optimize Code (NEW in v3.1)

```
> code_quick_analysis
{
  "maxFiles": 500,
  "maxHotspots": 10,
  "strategy": "mixed"
}
```

Response:
```json
{
  "scan": { "totalFiles": 847, "totalLinesApprox": 42000 },
  "hotspots": [
    {
      "path": "src/modules/guard/guard.service.ts",
      "score": 78,
      "reasons": ["Very high complexity", "Deep nesting: level 6"],
      "suggestedGoal": "refactor"
    }
  ]
}
```

### 7. Generate Refactor Plan

```
> code_refactor_plan
{
  "hotspots": [{"path": "src/server.ts", "reason": "High complexity"}],
  "goal": "readability",
  "constraints": ["No breaking changes"]
}
```

## Dashboard Setup

### Start API Server

```bash
npm run start:api
```

API runs on `http://localhost:3334`

### Start Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Dashboard runs on `http://localhost:3333`

### Dashboard Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Overview & stats |
| Memory | `/memory` | Manage memories |
| Guard | `/guard` | Security rules |
| Workflow | `/workflow` | Task management |
| Agents | `/agents` | View agents |
| Latent | `/latent` | Context management |
| Documents | `/documents` | Doc registry |
| Thinking | `/thinking` | Models & workflows |
| Settings | `/settings` | Configuration |

## Project Structure

```
claude-code-guardian/
├── src/
│   ├── server.ts          # MCP server
│   ├── api/                # HTTP API
│   ├── core/               # Core utilities
│   ├── modules/            # Feature modules
│   │   ├── memory/
│   │   ├── guard/
│   │   ├── workflow/
│   │   ├── agents/
│   │   ├── latent/
│   │   ├── thinking/
│   │   ├── auto-agent/
│   │   ├── documents/
│   │   ├── rag/
│   │   ├── resource/
│   │   ├── process/
│   │   ├── testing/
│   │   └── code-optimizer/  # NEW in v3.1
│   └── hooks/              # Hook handlers
├── dashboard/              # Next.js dashboard
├── templates/              # CLAUDE.md templates
├── dist/                   # Compiled output
└── .ccg/                   # Runtime data
    ├── memory.db           # SQLite database
    └── checkpoints/        # Saved states
```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build TypeScript |
| `npm run dev` | Watch mode |
| `npm run start` | Start MCP server |
| `npm run start:api` | Start HTTP API |
| `npm run test` | Run tests |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CCG_DATA_DIR` | `.ccg` | Data directory |
| `CCG_API_PORT` | `3334` | API server port |
| `CCG_STRICT_MODE` | `true` | Guard strict mode |

## Troubleshooting

### CCG not loading in Claude Code

1. Check `.mcp.json` configuration
2. Verify `dist/index.js` exists
3. Run `npm run build`

### Database errors

1. Check `.ccg/` directory permissions
2. Delete `.ccg/memory.db` to reset

### Dashboard not connecting

1. Verify API server is running on 3334
2. Check CORS settings
3. Clear browser cache

## Next Steps

1. Read [FEATURES.md](./FEATURES.md) for full module documentation
2. Review [AGENTS.md](./AGENTS.md) for agent details
3. Check [SECURITY.md](./SECURITY.md) for guard rules

## Support

- GitHub Issues: https://github.com/anthropic-community/claude-code-guardian/issues
- Documentation: https://github.com/anthropic-community/claude-code-guardian#readme
