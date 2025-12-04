# CCG Guard - Code Validation

Validate code against CCG rules.

## Usage

```
/ccg-guard [action] [args]
```

## Actions

### check [file]
Validate a file or current file:
- Call `guard_validate` with file content
- Display issues found

### status
Show guard status:
- Call `guard_status`
- Display rules and statistics

### enable [rule]
Enable a guard rule:
- Call `guard_rule_toggle` with rule name and enabled=true

### disable [rule]
Disable a guard rule:
- Call `guard_rule_toggle` with rule name and enabled=false

### rules
List all available rules:
- Call `guard_rules_list`

## Available Rules

- `fake-test` - Block tests without assertions
- `empty-catch` - Block empty catch blocks
- `emoji-code` - Block emoji in code
- `disabled-feature` - Block disabled code

## Instructions

Parse the arguments and call appropriate MCP tools:

1. If action is "check": Read file, call `guard_validate`
2. If action is "status": Call `guard_status`
3. If action is "enable/disable": Call `guard_rule_toggle`
4. If action is "rules": Call `guard_rules_list`
5. If no action: Show status
