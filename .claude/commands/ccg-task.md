# CCG Task - Task Management

Manage coding tasks with progress tracking.

## Usage

```
/ccg-task [action] [args]
```

## Actions

### start "name"
Start a new task:
- Call `workflow_task_create` with the task name
- Set as current active task
- Begin tracking

### progress [0-100]
Update current task progress:
- Call `workflow_task_update` with progress percentage

### note "content"
Add note to current task:
- Call `workflow_note_add` with note content

### done
Complete current task:
- Call `workflow_task_complete`
- Show summary

### list
List all tasks:
- Call `workflow_task_list`
- Display formatted list

### show [id]
Show task details:
- Call `workflow_task_get` with optional ID

## Instructions

Parse the arguments and call appropriate MCP tools:

1. If action is "start": Call `workflow_task_create`
2. If action is "progress": Call `workflow_task_update`
3. If action is "note": Call `workflow_note_add`
4. If action is "done": Call `workflow_task_complete`
5. If action is "list": Call `workflow_task_list`
6. If no action: Show help
