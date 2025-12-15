# Completion Gates

Ensure tasks meet quality requirements before marking complete.

## What It Does

Completion Gates prevent tasks from being marked "complete" until they meet defined criteria:

- **Tests must pass** before feature completion
- **Guard validation** must succeed before code commit
- **Evidence must be collected** for audit trail

## Gate Statuses

| Status | Meaning |
|--------|---------|
| `completed` | All requirements met, task done |
| `pending` | Waiting for evidence/validation |
| `blocked` | Cannot proceed until issue resolved |

### Status Flow

```
pending → (evidence collected) → pending → (all gates pass) → completed
                                    ↓
                              (gate fails)
                                    ↓
                                blocked
```

---

## Evidence Schema

Evidence is structured proof that a requirement was met.

### Structure

```json
{
  "taskId": "fix-auth-bug",
  "type": "guard",  // or "test", "manual"
  "status": "passed",
  "timestamp": "2025-12-15T11:00:00Z",
  "details": {
    "ruleset": "security",
    "rulesChecked": 12,
    "warnings": 0,
    "errors": 0
  }
}
```

### Evidence Types

| Type | Source | Collected By |
|------|--------|--------------|
| `guard` | `guard_validate` | Auto when taskId provided |
| `test` | `testing_run` | Auto when taskId provided |
| `manual` | User assertion | Manual API call |

### Collecting Evidence

When calling guard or test tools, include `taskId` to auto-collect evidence:

```json
// Guard validation with evidence
{
  "tool": "guard_validate",
  "args": {
    "code": "...",
    "filename": "auth.ts",
    "ruleset": "security",
    "taskId": "fix-auth-bug"  // Evidence tagged to this task
  }
}

// Test run with evidence
{
  "tool": "testing_run",
  "args": {
    "files": ["tests/auth.test.ts"],
    "taskId": "fix-auth-bug"  // Evidence tagged to this task
  }
}
```

---

## nextToolCalls

When a task cannot complete, the response includes `nextToolCalls` - suggested actions to resolve blockers.

### Structure

```json
{
  "taskId": "fix-auth-bug",
  "status": "blocked",
  "blockingGates": ["test_pass"],
  "nextToolCalls": [
    {
      "tool": "testing_run",
      "args": { "files": ["tests/auth.test.ts"] },
      "priority": 1,
      "reason": "3 tests failing, need to pass before completion"
    },
    {
      "tool": "guard_validate",
      "args": { "filename": "auth.ts", "ruleset": "security" },
      "priority": 2,
      "reason": "Security validation required"
    }
  ]
}
```

### Priority Ordering

`nextToolCalls` are ordered by priority:

1. **Priority 1**: Critical blockers (failing tests)
2. **Priority 2**: Required validations (guard checks)
3. **Priority 3**: Recommended actions (documentation)

### Executing nextToolCalls

After resume or when blocked:

```javascript
// Get current task status
const status = await workflow_task_list({ status: ["blocked"] });

// Execute suggested tools in priority order
for (const call of status.nextToolCalls) {
  await callTool(call.tool, { ...call.args, taskId: call.taskId });
}

// Re-check completion
await workflow_task_complete({ taskId: "fix-auth-bug" });
```

---

## MCP Tools Reference

### `workflow_task_complete`

Attempt to mark task as complete. Will check gates first.

```json
// Request
{ "taskId": "fix-auth-bug" }

// Success response
{
  "success": true,
  "status": "completed",
  "evidence": [
    { "type": "guard", "status": "passed" },
    { "type": "test", "status": "passed" }
  ]
}

// Blocked response
{
  "success": false,
  "status": "blocked",
  "blockingGates": ["test_pass"],
  "nextToolCalls": [...]
}
```

### `workflow_task_update`

Update task progress and check gates.

```json
// Request
{
  "taskId": "fix-auth-bug",
  "status": "in_progress",
  "progress": 80
}
```

---

## Force Complete / Bypass

In some cases, you may need to bypass gates.

### When to Bypass

- **Emergency hotfix**: Critical production issue, tests can wait
- **Known flaky test**: Test failure unrelated to changes
- **Manual verification**: Human confirmed requirements met

### How to Bypass

```json
// Force complete with reason (logged for audit)
{
  "tool": "workflow_task_complete",
  "args": {
    "taskId": "fix-auth-bug",
    "force": true,
    "bypassReason": "Emergency hotfix, tests verified manually"
  }
}
```

### Audit Trail

Bypasses are logged:

```json
{
  "type": "gate:bypassed",
  "taskId": "fix-auth-bug",
  "timestamp": "2025-12-15T11:00:00Z",
  "metadata": {
    "bypassedGates": ["test_pass"],
    "reason": "Emergency hotfix, tests verified manually",
    "bypassedBy": "user"
  }
}
```

---

## Gate Policies

Default gate requirements by task type:

| Task Type | Required Gates |
|-----------|----------------|
| Feature | test_pass, guard_pass |
| Bug fix | test_pass |
| Refactor | test_pass, guard_pass |
| Hotfix | (none, but logged) |

Gates are checked automatically when calling `workflow_task_complete`.

---

## Example Workflow

### Task with Gates

```bash
# 1. Create task
workflow_task_create {
  "name": "Add password reset",
  "tags": ["feature", "auth"]
}

# 2. Work on implementation...

# 3. Run guard with taskId (auto-collects evidence)
guard_validate {
  "code": "...",
  "filename": "reset.ts",
  "ruleset": "security",
  "taskId": "task-001"
}

# 4. Run tests with taskId (auto-collects evidence)
testing_run {
  "files": ["tests/reset.test.ts"],
  "taskId": "task-001"
}

# 5. Attempt completion
workflow_task_complete { "taskId": "task-001" }
# → If all gates pass: completed
# → If gates fail: blocked + nextToolCalls
```

---

## Troubleshooting

### "Task blocked but I fixed the issue"

- Re-run the blocking validation with taskId
- New evidence will update gate status
- Try `workflow_task_complete` again

### "nextToolCalls is empty"

- All required evidence may be collected
- Check `blockingGates` for manual requirements
- May need to contact admin for unblocking

### "Evidence not recorded"

- Ensure `taskId` is passed to validation tools
- Check task exists: `workflow_task_list`

---

## Related Docs

- [Session Resume](SESSION_RESUME.md) - Resume with nextToolCalls
- [Guard Rulesets](GUARD_RULESETS.md) - Validation rulesets
- [Testing Observability](TESTING_OBSERVABILITY.md) - Test evidence
- [TaskGraph Workflows](TASKGRAPH_WORKFLOWS.md) - DAG-based gate policies

---

*Last updated: December 2025*
