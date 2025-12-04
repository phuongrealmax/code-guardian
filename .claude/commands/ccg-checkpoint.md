# CCG Checkpoint - Save Progress

Create a checkpoint to save current progress.

## Usage

```
/ccg-checkpoint [action] [args]
```

## Actions

### (no action)
Create a new checkpoint:
- Call `resource_checkpoint_create`
- Include current task, modified files, notes

### list
List all checkpoints:
- Call `resource_checkpoint_list`

### restore [id]
Restore from checkpoint:
- Call `resource_checkpoint_restore` with checkpoint ID

### show [id]
Show checkpoint details:
- Call `resource_checkpoint_get` with checkpoint ID

## Instructions

When invoked:

1. If no action: Call `resource_checkpoint_create` with current context
2. If "list": Call `resource_checkpoint_list`
3. If "restore": Call `resource_checkpoint_restore`
4. If "show": Call `resource_checkpoint_get`

Display confirmation with checkpoint ID and contents summary.
