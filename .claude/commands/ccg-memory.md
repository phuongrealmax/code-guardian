# CCG Memory - Persistent Memory

Store and recall information across sessions.

## Usage

```
/ccg-memory [action] [args]
```

## Actions

### store "key" "value"
Store a memory item:
- Call `memory_store` with key and content
- Confirm stored with ID

### recall "query"
Search and recall memories:
- Call `memory_recall` with search query
- Display matching items

### list [category]
List stored memories:
- Call `memory_list` with optional category filter

### forget [id]
Delete a memory:
- Call `memory_forget` with memory ID

### categories
List memory categories:
- Call `memory_categories`

## Categories

- `code` - Code snippets and patterns
- `decision` - Architecture decisions
- `bug` - Bug fixes and solutions
- `note` - General notes
- `context` - Project context

## Instructions

When invoked:

1. If "store": Call `memory_store`
2. If "recall": Call `memory_recall`
3. If "list": Call `memory_list`
4. If "forget": Call `memory_forget`
5. If no action: Show recent memories
