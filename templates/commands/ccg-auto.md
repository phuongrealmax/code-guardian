# CCG Auto-Agent Module

Autonomous agent capabilities for automatic task decomposition, tool routing, error fixing, and learning.

## Commands

### Decompose a Task
```
/ccg auto decompose "task description" [--force]
```
Automatically break down a complex task into manageable subtasks.

**Examples:**
```
/ccg auto decompose "Implement user authentication with OAuth2"
/ccg auto decompose "Refactor database layer" --force
```

**What it does:**
- Analyzes task complexity (score 1-10)
- Identifies task type (feature, bugfix, refactor, review)
- Generates ordered subtasks with dependencies
- Suggests tools for each subtask phase

### Analyze Complexity
```
/ccg auto complexity "task description"
```
Get complexity analysis without decomposing.

**Examples:**
```
/ccg auto complexity "Add unit tests for user service"
/ccg auto complexity "Migrate from REST to GraphQL"
```

### Route to Tools
```
/ccg auto route "action description" [--phase analysis|plan|impl|review]
```
Get tool recommendations for an action.

**Examples:**
```
/ccg auto route "validate code for security issues"
/ccg auto route "implement API endpoint" --phase impl
```

### Start Auto-Fix Loop
```
/ccg auto fix "error message" --type build|test|guard|runtime
```
Attempt automatic error correction with retry logic.

**Examples:**
```
/ccg auto fix "Property 'id' does not exist on type" --type build
/ccg auto fix "Test failed: expected 3 but got 2" --type test
```

**What it does:**
- Recalls similar errors from memory
- Generates fix suggestions
- Attempts fixes up to maxRetries times
- Optionally rolls back on failure

### Store Error Pattern
```
/ccg auto store-error "error message" --fix "fix description" [--success]
```
Store an error and its fix for future reference.

**Examples:**
```
/ccg auto store-error "Cannot find module 'xyz'" --fix "Added missing dependency" --success
```

### Recall Similar Errors
```
/ccg auto recall "error message" [--limit 5]
```
Find similar errors and suggested fixes from memory.

**Examples:**
```
/ccg auto recall "TypeScript compilation error"
/ccg auto recall "undefined is not a function" --limit 10
```

### Check Status
```
/ccg auto status
```
Get AutoAgent module status including all sub-services.

## Sub-Services

### TaskDecomposer
- Breaks complex tasks into subtasks
- Uses keyword-based complexity scoring
- Provides phase templates (feature, bugfix, refactor, review)

### ToolRouter
- Rule-based automatic tool selection
- Phase-aware routing
- Domain-specific tool recommendations

### AutoFixLoop
- Automatic error correction
- Configurable retry logic
- Rollback support

### ErrorMemory
- Stores errors and fixes
- Similarity matching
- Pattern detection

## Configuration

In `.ccg/config.json`:
```json
{
  "modules": {
    "autoAgent": {
      "enabled": true,
      "decomposer": {
        "maxSubtasks": 10,
        "autoDecompose": true,
        "minComplexityForDecompose": 4
      },
      "router": {
        "enabled": true,
        "routingRules": []
      },
      "fixLoop": {
        "enabled": true,
        "maxRetries": 3,
        "retryDelayMs": 1000,
        "autoRollbackOnFail": true
      },
      "errorMemory": {
        "enabled": true,
        "maxErrors": 100,
        "deduplicateThreshold": 0.8,
        "autoRecall": true
      }
    }
  }
}
```

## Best Practices

1. **Start with decomposition** - Break complex tasks before diving in
2. **Use routing** - Let the system suggest appropriate tools
3. **Enable auto-fix** - Let the system attempt fixes before asking
4. **Store patterns** - Document error fixes for future reference
5. **Recall before fixing** - Check if similar errors were solved before

---

When these commands are invoked, use the appropriate `auto_*` MCP tools.
