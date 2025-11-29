# CCG Task Management

Manage your coding tasks with progress tracking, notes, and checkpoints.

## Commands

### Start a Task
```
/ccg task start "task name" [--priority high|medium|low]
```
Start working on a new task. This will:
- Create a task entry
- Set it as the current active task
- Begin tracking progress and files modified

**Examples:**
```
/ccg task start "Implement user authentication"
/ccg task start "Fix login bug" --priority high
```

### Update Progress
```
/ccg task progress <percentage>
```
Update the current task's progress (0-100).

**Examples:**
```
/ccg task progress 50
/ccg task progress 75
```

### Add a Note
```
/ccg task note "note content" [--type note|decision|blocker|idea]
```
Add a note to the current task.

**Examples:**
```
/ccg task note "Decided to use JWT for tokens" --type decision
/ccg task note "Need to check database schema" --type blocker
```

### Complete Task
```
/ccg task done [task-id]
```
Mark a task as completed.

### Pause Task
```
/ccg task pause
```
Pause the current task. Progress will be saved.

### Resume Task
```
/ccg task resume [task-id]
```
Resume a paused task.

### List Tasks
```
/ccg task list [--status pending|in_progress|completed|all]
```
List tasks with optional status filter.

### Task Details
```
/ccg task show [task-id]
```
Show details of a specific task or current task.

## Task Workflow

```
+----------+     +-------------+     +-----------+
|  Start   | --> | In Progress | --> | Completed |
+----------+     +-------------+     +-----------+
                       |
                       v
                 +-----------+
                 |  Paused   |
                 +-----------+
```

## Best Practices

1. **Start with a clear task name** - Be specific about what you're doing
2. **Update progress regularly** - Helps with time estimation
3. **Add notes for decisions** - Document why you made choices
4. **Mark blockers** - Track what's preventing progress
5. **Complete tasks** - Don't leave tasks hanging

---

When these commands are invoked, use the appropriate `workflow_*` MCP tools.
