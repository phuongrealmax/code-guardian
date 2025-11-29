# Project Instructions for Claude

This project uses **Claude Code Guardian (CCG)** for enhanced development assistance.

## CCG Features

- **Memory** - I remember context between sessions
- **Guard** - Code validation and protection
- **Tasks** - Progress tracking and checkpoints
- **Testing** - Automated test running and browser checks
- **Process** - Port and process management
- **Documents** - Document registry and management

## How to Work With CCG

### Starting a Session
When you start working, CCG automatically:
1. Loads previous memory and context
2. Resumes any in-progress tasks
3. Checks for running processes

### Working on Tasks
1. Start a task: `/ccg task start "task name"`
2. I'll track progress, files modified, and decisions
3. Complete with: `/ccg task done`

### Memory
- I'll remember important decisions automatically
- You can ask me to remember: "Remember that we're using PostgreSQL"
- I'll recall relevant context when needed

### Guard Protection
I'll automatically check code for:
- Tests without assertions
- Disabled features
- Empty catch blocks
- Emoji in code
- Swallowed exceptions

If I detect issues, I'll warn or block depending on severity.

### Testing
- I can run tests after changes
- For UI work, I can open a browser and check for errors
- Use `/ccg test browser <url>` for visual testing

### Checkpoints
- Checkpoints are created automatically at token thresholds
- Manual checkpoint: `/ccg checkpoint`
- Restore if needed: `/ccg checkpoint restore <id>`

## Slash Commands

| Command | Description |
|---------|-------------|
| `/ccg` | Show dashboard |
| `/ccg status` | Detailed status |
| `/ccg task` | Task management |
| `/ccg memory` | Memory management |
| `/ccg test` | Testing |
| `/ccg process` | Process management |
| `/ccg checkpoint` | Checkpoint management |
| `/ccg docs` | Document management |

## Project Conventions

<!-- Customize these for your project -->

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Tests: `*.test.ts` or `*.spec.ts`

### Code Style
- Variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

### No Emoji in Code
Emoji can cause encoding issues. Use text descriptions instead.

## Important Project Context

<!-- Add project-specific context here -->

### Architecture
- [Describe your architecture]

### Key Decisions
- [List important decisions]

### Common Tasks
- [List common development tasks]

## Getting Help

- `/ccg help` - General help
- `/ccg help <module>` - Module-specific help
- Ask me directly about any CCG feature

---

*This file helps Claude understand how to work with your project and CCG.*
