# CCG Docs - Document Management

Manage project documentation.

## Usage

```
/ccg-docs [action] [args]
```

## Actions

### scan
Scan and register all docs:
- Call `documents_scan`
- Register found documents

### list
List registered documents:
- Call `documents_list`
- Show doc registry

### update [path]
Mark document as needing update:
- Call `documents_mark_stale` with path

### check
Check for stale documents:
- Call `documents_check_stale`
- Show docs that need updating

### generate [type]
Generate documentation:
- Call `documents_generate` with type (api, readme, etc.)

## Document Types

- `readme` - Project README
- `api` - API documentation
- `spec` - Technical specifications
- `changelog` - Change log

## Instructions

When invoked:

1. If "scan": Call `documents_scan`
2. If "list": Call `documents_list`
3. If "update": Call `documents_mark_stale`
4. If "check": Call `documents_check_stale`
5. If "generate": Call `documents_generate`
