# Auto-Checkpoints and Diff

Automatic state snapshots and change comparison for safe refactoring.

## What It Does

CCG automatically creates checkpoints before risky operations, allowing you to:

- **Rollback** if something goes wrong
- **Compare changes** between checkpoints
- **Track progress** across refactoring sessions

## When Checkpoints Are Created

| Trigger | Description |
|---------|-------------|
| **Risky operation** | Before `git reset`, large deletions, config changes |
| **Large plan** | Before executing plans with 5+ file changes |
| **Manual request** | When you call `resource_checkpoint_create` |
| **Governor threshold** | When token usage hits 85% (critical mode) |

---

## MCP Tools Reference

### `resource_checkpoint_create`

Create a manual checkpoint.

```json
// Request
{
  "name": "before-auth-refactor",
  "reason": "before_risky_operation"
}

// Response
{
  "checkpointId": "cp-20251215-001",
  "name": "before-auth-refactor",
  "createdAt": "2025-12-15T11:00:00Z",
  "files": 12
}
```

**Reason options:**
- `manual` - User requested
- `before_risky_operation` - Safety checkpoint
- `task_complete` - End of task milestone

### `resource_checkpoint_list`

List all checkpoints.

```json
// Response
{
  "checkpoints": [
    {
      "id": "cp-20251215-001",
      "name": "before-auth-refactor",
      "createdAt": "2025-12-15T11:00:00Z",
      "reason": "before_risky_operation"
    },
    {
      "id": "cp-20251215-002",
      "name": "after-auth-refactor",
      "createdAt": "2025-12-15T12:30:00Z",
      "reason": "task_complete"
    }
  ]
}
```

### `resource_checkpoint_restore`

Restore to a previous checkpoint.

```json
// Request
{ "checkpointId": "cp-20251215-001" }

// Response
{
  "success": true,
  "restoredFrom": "cp-20251215-001",
  "filesRestored": 12
}
```

### `resource_checkpoint_delete`

Delete a checkpoint.

```json
// Request
{ "checkpointId": "cp-20251215-001" }

// Response
{ "success": true }
```

### `resource_checkpoint_diff`

Compare two checkpoints and show changes.

```json
// Request
{
  "fromCheckpointId": "cp-20251215-001",
  "toCheckpointId": "current"  // or another checkpoint ID
}

// Response
{
  "filesAdded": ["src/auth/refresh.ts"],
  "filesModified": ["src/auth/login.ts", "src/config/auth.ts"],
  "filesDeleted": [],
  "linesAdded": 45,
  "linesRemoved": 12,
  "tokenUsageDelta": 1500,
  "summary": "3 files changed, +45/-12 lines"
}
```

**Options:**
- `includeUnchanged: true` - Include unchanged files in diff
- `maxFiles: 50` - Limit files in diff output

---

## Governor and Auto-Checkpoints

CCG includes a token budget governor that triggers checkpoints automatically.

### `resource_governor_state`

Check current governor mode.

```json
// Response
{
  "mode": "normal",  // or "conservative" or "critical"
  "tokenUsage": 45,  // percentage
  "allowedActions": ["browser_open", "full_test_suite", "task_decompose"],
  "blockedActions": []
}
```

### Governor Modes

| Mode | Token Usage | Behavior |
|------|-------------|----------|
| **normal** | < 70% | All actions allowed |
| **conservative** | 70-84% | Delta-only responses, no browser testing |
| **critical** | >= 85% | Must checkpoint, only finish tasks |

### `resource_action_allowed`

Check if a specific action is allowed.

```json
// Request
{ "action": "full_test_suite" }

// Response
{
  "allowed": false,
  "reason": "Conservative mode: full test suites blocked",
  "mode": "conservative"
}
```

### Forced Checkpoint (Critical Mode)

When token usage hits 85%:

1. **Auto-checkpoint created** with reason `governor_critical`
2. **Timeline event recorded**: `checkpoint:governor_forced`
3. **Only allowed actions**:
   - Finish current task
   - Save work
   - Create checkpoint

---

## Reading Timeline for Checkpoints

Checkpoint events appear in session timeline:

```json
{
  "events": [
    {
      "type": "checkpoint:created",
      "checkpointId": "cp-001",
      "timestamp": "2025-12-15T11:00:00Z",
      "metadata": {
        "reason": "before_risky_operation",
        "name": "before-auth-refactor"
      }
    },
    {
      "type": "checkpoint:governor_forced",
      "checkpointId": "cp-002",
      "timestamp": "2025-12-15T12:00:00Z",
      "metadata": {
        "tokenUsage": 87,
        "mode": "critical"
      }
    }
  ]
}
```

Use `session_timeline` to review checkpoint history.

---

## Why Diff is On-Demand

The `resource_checkpoint_diff` tool computes differences on-demand rather than storing diffs because:

1. **Storage efficiency** - Checkpoints only store file snapshots, not diffs
2. **Flexible comparison** - Compare any two checkpoints, not just adjacent
3. **Current state comparison** - Compare checkpoint to live working tree

---

## Example Workflow

### Before Risky Refactor

```bash
# 1. Create checkpoint
resource_checkpoint_create {
  "name": "before-payment-refactor",
  "reason": "before_risky_operation"
}

# 2. Do refactoring work...

# 3. Compare changes
resource_checkpoint_diff {
  "fromCheckpointId": "cp-001",
  "toCheckpointId": "current"
}

# 4. If something went wrong, rollback
resource_checkpoint_restore {
  "checkpointId": "cp-001"
}
```

### Tracking Sprint Progress

```bash
# Start of sprint
resource_checkpoint_create { "name": "sprint-42-start" }

# Mid-sprint check
resource_checkpoint_diff {
  "fromCheckpointId": "sprint-42-start",
  "toCheckpointId": "current"
}
# → See all changes made so far

# End of sprint
resource_checkpoint_create { "name": "sprint-42-end" }
```

---

## Troubleshooting

### "Checkpoint not found"

- List checkpoints: `resource_checkpoint_list`
- Check checkpoint ID spelling
- Checkpoints may have been deleted

### "Cannot restore - files modified"

- Current working tree has uncommitted changes
- Either commit/stash changes, or force restore

### "Governor blocked my action"

- Check mode: `resource_governor_state`
- If critical mode, create checkpoint first
- Complete current task before starting new work

---

## Related Docs

- [Session Resume](SESSION_RESUME.md) - Session state management
- [Completion Gates](COMPLETION_GATES.md) - Task completion requirements
- [Latent Chain Guide](LATENT_CHAIN_GUIDE.md) - Works with checkpoints

---

*Last updated: December 2025*
