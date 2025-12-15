# Session Resume Guide

Preserve your work across browser refreshes, disconnections, and restarts.

## What It Does

Session Resume automatically saves your CCG session state and allows you to continue exactly where you left off. This includes:

- Active tasks and their progress
- Timeline of events (phase transitions, checkpoints, completions)
- Memory entries created during the session
- Latent chain contexts

## When To Use

- **After browser refresh**: Reconnect and resume ongoing work
- **After network disconnect**: Pick up where you left off
- **Next day continuation**: Resume complex multi-day tasks
- **After Claude Code restart**: Restore session context

---

## CLI Usage

### Resume from Previous Session

```bash
# Resume from most recent session (auto-detected)
ccg --resume

# Resume from specific session file
ccg --resume .ccg/sessions/session-abc123.json

# Short form
ccg -r session-abc123.json
```

### What Gets Restored

| Data | Restored? | Notes |
|------|-----------|-------|
| Active tasks | Yes | Task ID, status, progress |
| Timeline events | Yes | Full event history |
| Checkpoints | Yes | All checkpoint references |
| Memory entries | Yes | Loaded from memory.db |
| Latent contexts | Yes | If persisted to file |

---

## MCP Tools Reference

### `session_status`

Get current session state.

```json
{
  "sessionId": "cd6d78fb-...",
  "createdAt": "2025-12-15T11:14:37.627Z",
  "timelineCount": 42,
  "latestCheckpointId": "cp-001",
  "dirty": false,
  "autoSaveEnabled": true
}
```

### `session_save`

Manually save current session state.

```json
// Request
{ "reason": "Before risky refactor" }

// Response
{
  "success": true,
  "savedTo": ".ccg/sessions/session-abc123.json"
}
```

### `session_resume`

Resume from a previous session.

```json
// Request
{ "sessionFile": ".ccg/sessions/session-abc123.json" }

// Response - omit sessionFile to use most recent
{
  "success": true,
  "sessionId": "abc123",
  "restoredTasks": 3,
  "restoredTimeline": 42
}
```

### `session_offer`

Check if a previous session is available (called on reconnect).

```json
// Response when session available
{
  "available": true,
  "sessionId": "abc123",
  "lastActivity": "2025-12-15T10:30:00Z",
  "taskCount": 3,
  "recommendation": "Resume to continue task 'fix-auth-bug'"
}
```

### `session_timeline`

View recent session events.

```json
// Request
{ "limit": 50 }

// Response
{
  "events": [
    {
      "type": "task:completed",
      "taskId": "task-001",
      "timestamp": "2025-12-15T11:00:00Z",
      "metadata": { "duration": 1200 }
    },
    {
      "type": "checkpoint:created",
      "checkpointId": "cp-001",
      "timestamp": "2025-12-15T11:05:00Z"
    }
  ]
}
```

### `session_replay`

Replay timeline events in dry-run mode for debugging.

```json
// Request
{ "from": 0, "to": 10 }

// Response
{
  "replayed": 10,
  "events": [...]
}
```

### `session_export`

Export session state to a JSON file for backup or sharing.

```json
// Request (optional outputPath)
{ "outputPath": ".ccg/sessions/export-2025-12-15.json" }

// Response
{
  "success": true,
  "exportedTo": ".ccg/sessions/export-2025-12-15.json"
}
```

### `session_init`

Initialize a new session at conversation start.

```json
// Response
{
  "sessionId": "new-session-id",
  "createdAt": "2025-12-15T12:00:00Z"
}
```

### `session_end`

End current session and save all data.

```json
// Request
{ "reason": "User requested end" }

// Response
{
  "success": true,
  "savedTo": ".ccg/sessions/session-xyz.json"
}
```

---

## Browser Reconnect Flow

When you reconnect after a disconnect:

1. **CCG checks for resume offer** via `session_offer`
2. **If available**, you'll see a prompt:
   ```
   Previous session found (3 tasks in progress)
   Last activity: 10 minutes ago
   → Resume to continue "fix-auth-bug"?
   ```
3. **Accept to resume**: Session state is restored
4. **Decline**: Start fresh session

### What To Do After Reconnect

1. Check `session_offer` response
2. If tasks were in progress, call `session_resume`
3. Review timeline with `session_timeline` to see what was done
4. Continue from `nextToolCalls` if provided (see [Completion Gates](COMPLETION_GATES.md))

---

## Timeline Events

The session timeline tracks important events:

| Event Type | Description |
|------------|-------------|
| `task:started` | Task began |
| `task:completed` | Task finished |
| `task:failed` | Task failed |
| `phase:transition` | Latent chain phase change |
| `checkpoint:created` | Checkpoint saved |
| `checkpoint:restored` | Checkpoint restored |
| `guard:blocked` | Code blocked by guard |
| `testing:failure` | Test failed |

### Timeline Metadata

Each event includes metadata-only (no sensitive code):

```json
{
  "type": "task:completed",
  "taskId": "fix-auth-bug",
  "timestamp": "2025-12-15T11:00:00Z",
  "metadata": {
    "duration": 1200,
    "filesChanged": 3,
    "testsRun": 47
  }
}
```

---

## Troubleshooting

### "No session found to resume"

- Check `.ccg/sessions/` directory exists
- Verify session files are present
- Try listing: `ls .ccg/sessions/`

### "Session file corrupted"

- Delete the corrupted file
- Start fresh with `ccg init`
- Previous memory entries are preserved in `memory.db`

### "Tasks not restored"

- Ensure `autoSaveEnabled: true` in session status
- Check that session was saved before disconnect
- Use `session_timeline` to verify events were recorded

---

## Best Practices

1. **Don't rely solely on auto-save** - Call `session_save` before risky operations
2. **Check timeline after resume** - Verify what was completed
3. **Use meaningful task IDs** - Makes resume offers clearer
4. **Export important sessions** - Backup complex multi-day work

---

## Related Docs

- [Completion Gates](COMPLETION_GATES.md) - Handle `nextToolCalls` after resume
- [Auto-Checkpoints and Diff](AUTO_CHECKPOINTS_AND_DIFF.md) - Checkpoint management
- [User Guide](USER_GUIDE.md) - Complete CCG documentation

---

*Last updated: December 2025*
