# CCG Latent Chain Mode

Latent Chain Mode for structured, token-efficient reasoning with hidden-state management.

## Commands

### Start Latent Task
```
/ccg latent start "<task description>" [--constraints "rule1,rule2"] [--files "file1,file2"]
```
Create a new AgentLatentContext and begin analysis phase.

**Examples:**
```
/ccg latent start "Fix authentication timeout bug"
/ccg latent start "Refactor payment module" --constraints "No breaking changes,Pass all tests"
/ccg latent start "Add dark mode" --files "src/theme.ts,src/App.tsx"
```

**What happens:**
1. Creates `AgentLatentContext` with unique taskId
2. Sets phase to `analysis`
3. Records initial constraints and files
4. Claude begins analysis with structured output

### Quick Review (Analysis + Plan)
```
/ccg latent review [file-or-folder]
```
Quick latent review of current file or specified path.

**Examples:**
```
/ccg latent review                    # Review current file
/ccg latent review src/auth/         # Review auth folder
/ccg latent review src/api/users.ts  # Review specific file
```

**Flow:**
1. `latent_context_create` with analysis phase
2. Identify hotSpots and risks
3. Transition to plan phase
4. Output structured plan
5. `latent_complete_task` or wait for impl

### Transition Phase
```
/ccg latent phase <phase> [--summary "summary"]
```
Move to next phase in workflow.

**Phases:** `analysis` | `plan` | `impl` | `review`

**Examples:**
```
/ccg latent phase plan --summary "Identified root cause in token validation"
/ccg latent phase impl
/ccg latent phase review --summary "Applied 3 patches, ready for verification"
```

### Update Context
```
/ccg latent update <type> "<content>"
```
Add information to current context.

**Types:**
- `decision` - Record a decision (auto-assigns ID)
- `risk` - Add identified risk
- `hotspot` - Mark code location
- `constraint` - Add new constraint

**Examples:**
```
/ccg latent update decision "Use JWT refresh tokens for session management"
/ccg latent update risk "May affect active user sessions"
/ccg latent update hotspot "src/auth/token.ts:45-60"
```

### Apply Patch
```
/ccg latent patch "<file>" [--dry-run]
```
Apply a code change using unified diff.

**Examples:**
```
/ccg latent patch "src/auth/token.ts"           # Apply with generated diff
/ccg latent patch "src/config.ts" --dry-run    # Validate only
```

### Complete Task
```
/ccg latent done [--summary "summary"]
```
Mark current latent task as complete.

**Examples:**
```
/ccg latent done
/ccg latent done --summary "Fixed token refresh, all tests pass"
```

### Show Context
```
/ccg latent show [task-id] [--history]
```
Display current latent context.

**Examples:**
```
/ccg latent show                    # Current context
/ccg latent show fix-auth-bug      # Specific task
/ccg latent show --history         # Include change history
```

### List Contexts
```
/ccg latent list
```
List all active latent contexts.

### Status
```
/ccg latent status
```
Show Latent module statistics.

### Delete Context
```
/ccg latent delete <task-id>
```
Remove a latent context.

## Workflow

```
┌─────────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  ANALYSIS   │ ──► │  PLAN   │ ──► │  IMPL   │ ──► │ REVIEW  │
│             │     │         │     │         │     │         │
│ /latent     │     │ /latent │     │ /latent │     │ /latent │
│  start      │     │  phase  │     │  patch  │     │  done   │
└─────────────┘     └─────────┘     └─────────┘     └─────────┘
```

## Output Format (LatentResponse)

When in Latent Mode, Claude outputs structured JSON:

```json
{
  "summary": "Brief 1-2 sentence summary",
  "contextDelta": {
    "codeMap": { "hotSpots": ["file:line"] },
    "decisions": [{ "id": "D001", "summary": "...", "rationale": "..." }],
    "risks": ["..."]
  },
  "actions": [
    { "type": "edit_file", "target": "src/file.ts", "description": "..." }
  ]
}
```

## Best Practices

1. **Start with /latent start** - Always create context first
2. **Keep summaries short** - Max 2 sentences
3. **Use decision IDs** - D001, D002 for tracking
4. **Transition phases explicitly** - Use /latent phase
5. **Apply patches, don't paste** - Use /latent patch
6. **Complete tasks** - Don't leave contexts hanging

## Token Savings

| Without Latent | With Latent | Savings |
|----------------|-------------|---------|
| ~2000 tokens/update | ~100 tokens/delta | **95%** |
| Full context each time | Delta only | - |
| Verbose explanations | Structured JSON | - |

---

When these commands are invoked, use the appropriate `latent_*` MCP tools:
- `latent_context_create`
- `latent_context_get`
- `latent_context_update`
- `latent_phase_transition`
- `latent_apply_patch`
- `latent_validate_response`
- `latent_complete_task`
- `latent_list_contexts`
- `latent_delete_context`
- `latent_status`
