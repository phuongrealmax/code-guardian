# CCG Memory

Store and recall information across sessions. Memory persists between conversations.

## Commands

### Store Memory
```
/ccg memory save "content" [--type fact|decision|pattern|error|note] [--importance 1-10] [--tags tag1,tag2]
```
Save information to memory.

**Types:**
- `fact` - Project facts and information
- `decision` - Architectural or design decisions
- `pattern` - Code patterns and conventions
- `error` - Error solutions and fixes
- `note` - General notes

**Examples:**
```
/ccg memory save "Using PostgreSQL with Prisma ORM" --type fact --importance 8
/ccg memory save "Auth uses JWT with 1h expiry" --type decision --importance 9
/ccg memory save "Always use camelCase for variables" --type pattern --tags conventions
```

### Recall Memory
```
/ccg memory search "query" [--type type] [--limit n]
```
Search stored memories.

**Examples:**
```
/ccg memory search "authentication"
/ccg memory search "database" --type decision
/ccg memory search "error" --limit 5
```

### List Recent
```
/ccg memory recent [--limit n]
```
Show recently accessed memories.

### View All
```
/ccg memory list [--type type]
```
List all memories, optionally filtered by type.

### Delete Memory
```
/ccg memory forget <memory-id>
```
Remove a specific memory.

### Memory Summary
```
/ccg memory summary
```
Show summary of stored memories by type.

## Memory Types

| Type | Use For | Example |
|------|---------|---------|
| `fact` | Project information | "Database is PostgreSQL" |
| `decision` | Design choices | "Using microservices architecture" |
| `pattern` | Code conventions | "Components use PascalCase" |
| `error` | Bug fixes | "Port 3000 conflict: kill node process" |
| `note` | General notes | "TODO: Review auth flow" |

## Importance Levels

- **1-3**: Low importance, general notes
- **4-6**: Medium importance, useful information
- **7-8**: High importance, key decisions
- **9-10**: Critical, must remember

Higher importance memories are kept longer and returned first in searches.

## Tips

1. **Be specific** - Clear, searchable content
2. **Use types correctly** - Helps with filtering
3. **Tag consistently** - Makes searching easier
4. **Set importance** - Prioritizes what to remember

---

When these commands are invoked, use the `memory_*` MCP tools.
