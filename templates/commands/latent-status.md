# Latent Status

Quick status check cho Latent Chain Mode và current workflow.

## Usage

```
/latent-status [--verbose]
```

**Arguments:**
- `--verbose` (optional): Hiển thị chi tiết history và all contexts

## Flow

Khi command được invoke:

### 1. Get Status
```
latent_status: {}
workflow_current: {}
workflow_status: {}
resource_status: {}
```

### 2. Output Format

**Standard output:**
```
📊 Latent Status

[Current Task]
ID: fix-auth-bug
Phase: impl (3/4)
Progress: 65%

[Context]
Files: 3 | Hot Spots: 2 | Decisions: 4 | Risks: 1

[Resources]
Tokens: 45% (45K/100K)
Checkpoints: 2 available

[Workflow]
Tasks: 1 in_progress, 3 pending
```

**Verbose output (--verbose):**
```
📊 Latent Status (Verbose)

[Current Task]
ID: fix-auth-bug
Phase: impl (3/4)
Progress: 65%
Started: 10:30 AM
Duration: 25 min

[Context Details]
Files:
  - src/auth/login.ts
  - src/auth/token.ts
  - src/utils/jwt.ts

Hot Spots:
  - src/auth/login.ts:45-60
  - src/auth/token.ts:23

Decisions:
  D001: Use refresh tokens ✓
  D002: Add token expiry check ✓
  D003: Implement auto-refresh (in progress)
  D004: Add logging (pending)

Risks:
  - May affect active sessions

[History]
  v1: Created context
  v2: Added decisions D001, D002
  v3: Transitioned to plan
  v4: Added hot spots
  v5: Transitioned to impl

[All Contexts]
  1. fix-auth-bug (impl) - 65%
  2. refactor-api (paused) - 30%

[Resources]
Tokens: 45% (45,234/100,000)
Checkpoints:
  - cp-001 (10:15 AM) - Before auth changes
  - cp-002 (10:45 AM) - After token fix

[Workflow Summary]
In Progress: 1
  - UX Improvement Implementation (65%)

Pending: 3
  - Update docs
  - Add tests
  - Deploy preparation
```

## Quick Actions

Dựa trên status, suggest actions:

```
[Suggested Actions]
- Token usage 45%: OK, continue working
- Current phase impl: Use /latent-fix patch to apply changes
- 1 risk identified: Review before completing
```

If context approaching limits:
```
⚠️ [Warning]
Token usage: 85%
Recommend: Create checkpoint before continuing

Run: /ccg checkpoint create "before-next-phase"
```

## Examples

```
/latent-status              # Quick overview
/latent-status --verbose    # Full details with history
```

## MCP Tools Used

- `latent_status`
- `latent_context_get` (với --verbose)
- `latent_list_contexts`
- `workflow_current`
- `workflow_status`
- `workflow_task_list`
- `resource_status`
- `resource_checkpoint_list`

---

*Quick status check - know where you are in the workflow*
