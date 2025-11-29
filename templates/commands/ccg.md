# Claude Code Guardian

Claude Code Guardian (CCG) helps you code better by providing memory, guard rails, task tracking, and more.

## Quick Status

Show current CCG status:
- Memory items loaded
- Current task progress
- Token usage
- Active processes

## Commands

### Dashboard
```
/ccg
```
Show the main CCG dashboard with quick actions.

### Status
```
/ccg status
```
Show detailed status of all modules.

### Help
```
/ccg help [module]
```
Show help for CCG or a specific module.

## Modules

- **Memory** - `/ccg memory` - Store and recall information
- **Task** - `/ccg task` - Manage tasks and progress
- **Guard** - `/ccg guard` - Code validation rules
- **Test** - `/ccg test` - Run tests and browser checks
- **Process** - `/ccg process` - Manage ports and processes
- **Checkpoint** - `/ccg checkpoint` - Save and restore progress
- **Docs** - `/ccg docs` - Document management

## Quick Actions

| Command | Description |
|---------|-------------|
| `/ccg` | Dashboard |
| `/ccg status` | Full status |
| `/ccg task start "name"` | Start a task |
| `/ccg task done` | Complete current task |
| `/ccg checkpoint` | Create checkpoint |
| `/ccg test` | Run tests |
| `/ccg process list` | List processes |

---

When this command is invoked, use the `session_status` MCP tool to get current status and display it in a friendly format.
