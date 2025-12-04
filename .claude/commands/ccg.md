# CCG - Claude Code Guardian Dashboard

Show the current CCG status and quick actions.

## Instructions

When this command is invoked:

1. Call the `guard_status` tool to get Guard module status
2. Call the `workflow_task_list` tool to get active tasks
3. Call the `resource_token_status` tool to get token usage
4. Call the `process_list` tool to get running processes

Display a formatted dashboard:

```
=== CCG STATUS ===

GUARD: [enabled/disabled] - [X] rules active
  - Issues found: [count]
  - Blocks: [count]

TASKS: [count] active
  - Current: [task name] ([progress]%)

TOKENS: [usage]% used
  - Warning: [threshold]%

PROCESSES: [count] tracked
  - Ports: [list]

Quick Actions:
  /ccg-task start "name"  - Start new task
  /ccg-guard check        - Validate code
  /ccg-checkpoint         - Create checkpoint
  /ccg-test               - Run tests
```
