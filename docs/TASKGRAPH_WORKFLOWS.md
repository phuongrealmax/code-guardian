# TaskGraph Workflows

DAG-based task orchestration with gated completion.

## What It Does

TaskGraph extends simple task lists into a **Directed Acyclic Graph (DAG)** where:

- Tasks can have **dependencies** (must complete before)
- Each node has a **phase** (analysis, plan, impl, review)
- Completion requires **gate validation**
- Progress is tracked through the graph

## When To Use

- **Complex features** with multiple interdependent tasks
- **Refactoring** where order matters
- **Team coordination** with parallel work streams
- **Audit requirements** needing completion evidence

---

## DAG Node Structure

### Node Phases

Each task node has a phase matching Latent Chain Mode:

| Phase | Description | Default Gate |
|-------|-------------|--------------|
| `analysis` | Understanding the problem | None |
| `plan` | Designing the solution | None |
| `impl` | Implementation work | test_pass, guard_pass |
| `review` | Final verification | test_pass |

### Node Schema

```json
{
  "id": "task-auth-impl",
  "name": "Implement auth changes",
  "phase": "impl",
  "status": "pending",
  "dependencies": ["task-auth-plan"],
  "gates": ["test_pass", "guard_pass"],
  "evidence": []
}
```

---

## Gate Policies

### GATE_POLICIES Constants

CCG defines default gate requirements per phase:

```typescript
const GATE_POLICIES = {
  analysis: [],                    // No gates
  plan: [],                        // No gates
  impl: ['test_pass', 'guard_pass'], // Tests + guard required
  review: ['test_pass']            // Tests required
};
```

### Custom Gate Policies

Override defaults when creating tasks:

```json
{
  "tool": "workflow_task_create",
  "args": {
    "name": "Hotfix critical bug",
    "phase": "impl",
    "gates": []  // Override: no gates for emergency
  }
}
```

---

## MCP Tools Reference

### `auto_workflow_start`

Start a workflow from a task description. Auto-decomposes into DAG.

```json
// Request
{
  "taskDescription": "Add user authentication with OAuth",
  "constraints": ["No breaking changes", "Must pass existing tests"],
  "files": ["src/auth/"]
}

// Response
{
  "workflowId": "wf-001",
  "nodes": [
    {
      "id": "task-001",
      "name": "Analyze existing auth",
      "phase": "analysis",
      "dependencies": []
    },
    {
      "id": "task-002",
      "name": "Plan OAuth integration",
      "phase": "plan",
      "dependencies": ["task-001"]
    },
    {
      "id": "task-003",
      "name": "Implement OAuth provider",
      "phase": "impl",
      "dependencies": ["task-002"],
      "gates": ["test_pass", "guard_pass"]
    },
    {
      "id": "task-004",
      "name": "Review and test",
      "phase": "review",
      "dependencies": ["task-003"],
      "gates": ["test_pass"]
    }
  ]
}
```

### `workflow_task_create`

Create a task node with dependencies and gates.

```json
// Request
{
  "name": "Implement login form",
  "phase": "impl",
  "dependencies": ["task-design-ui"],
  "gates": ["test_pass", "guard_pass"],
  "tags": ["frontend", "auth"]
}
```

### `workflow_task_complete`

Attempt to complete a node. Checks gates first.

```json
// Request
{ "taskId": "task-003" }

// Success response (all gates pass)
{
  "success": true,
  "status": "completed",
  "unlockedNodes": ["task-004"]  // Dependencies now available
}

// Gated response (gates not met)
{
  "success": false,
  "status": "gated",
  "blockingGates": ["test_pass"],
  "nextToolCalls": [...]
}
```

---

## Gated Completion

### How It Works

1. **Call `workflow_task_complete`**
2. **CCG checks gates** for the node's phase
3. **If gates pass**: Node marked complete, dependents unlocked
4. **If gates fail**: Node marked "gated", returns nextToolCalls

### taskgraph:node:gated Event

When a node is gated, CCG emits a timeline event:

```json
{
  "type": "taskgraph:node:gated",
  "timestamp": "2025-12-15T11:00:00Z",
  "metadata": {
    "nodeId": "task-003",
    "phase": "impl",
    "blockingGates": ["test_pass"],
    "evidence": [
      { "type": "test", "status": "failed" }
    ],
    "nextToolCalls": [
      { "tool": "testing_run", "args": {...} }
    ]
  }
}
```

### Resolving Gated Nodes

1. **Execute nextToolCalls** to collect passing evidence
2. **Call `workflow_task_complete` again**
3. **If gates now pass**, node completes

---

## bypassGates

In emergencies, bypass gate requirements.

### Usage

```json
{
  "tool": "workflow_task_complete",
  "args": {
    "taskId": "task-003",
    "bypassGates": true,
    "bypassReason": "Emergency production fix"
  }
}
```

### Audit Trail

Bypass creates audit event:

```json
{
  "type": "taskgraph:gate:bypassed",
  "timestamp": "2025-12-15T11:00:00Z",
  "metadata": {
    "nodeId": "task-003",
    "bypassedGates": ["test_pass"],
    "reason": "Emergency production fix",
    "bypassedBy": "user"
  }
}
```

### Best Practices

- **Document bypass reason** - Required for audit
- **Review bypasses** - Check audit log regularly
- **Limit bypass access** - Consider team permissions

---

## Example Workflow

### 1. Start Workflow

```json
auto_workflow_start {
  "taskDescription": "Add password reset feature",
  "constraints": ["Use existing email service"]
}
```

### 2. View DAG

```json
workflow_task_list {}
// Shows all nodes with dependencies
```

### 3. Work Through Nodes

```json
// Complete analysis (no gates)
workflow_task_complete { "taskId": "task-001" }

// Complete planning (no gates)
workflow_task_complete { "taskId": "task-002" }

// Implementation (gates required)
// First, do the work...

// Run tests with taskId for evidence
testing_run { "files": [...], "taskId": "task-003" }

// Run guard with taskId for evidence
guard_validate { "code": ..., "taskId": "task-003" }

// Now complete (gates will be checked)
workflow_task_complete { "taskId": "task-003" }
```

### 4. Handle Gated Node

If `workflow_task_complete` returns gated:

```json
// Response
{
  "success": false,
  "status": "gated",
  "blockingGates": ["test_pass"],
  "nextToolCalls": [
    { "tool": "testing_run", "args": {...} }
  ]
}

// Execute suggested tool
testing_run { ... }

// Retry completion
workflow_task_complete { "taskId": "task-003" }
```

---

## DAG Visualization

View workflow as graph:

```
┌─────────────┐
│  Analysis   │
│  (task-001) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Plan     │
│  (task-002) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Impl     │ ← Gates: test_pass, guard_pass
│  (task-003) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Review    │ ← Gates: test_pass
│  (task-004) │
└─────────────┘
```

---

## Troubleshooting

### "Cannot complete: dependencies not met"

- Check dependent nodes: `workflow_task_list`
- Complete dependencies first
- Dependencies must be in "completed" status

### "Node stuck in gated state"

- Check blocking gates: `workflow_task_list`
- Run required validations with taskId
- Check evidence was collected correctly

### "Workflow not progressing"

- Check for cycles in dependencies (not allowed in DAG)
- Verify task IDs match between dependencies

---

## Related Docs

- [Completion Gates](COMPLETION_GATES.md) - Gate mechanics and evidence
- [Session Resume](SESSION_RESUME.md) - Resume workflows after disconnect
- [Latent Chain Guide](LATENT_CHAIN_GUIDE.md) - Phase-based reasoning
- [Auto-Checkpoints](AUTO_CHECKPOINTS_AND_DIFF.md) - Checkpoints during workflows

---

*Last updated: December 2025*
