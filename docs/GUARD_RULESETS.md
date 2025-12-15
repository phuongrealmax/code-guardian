# Guard Rulesets

Predefined rule collections for different code contexts.

## What It Does

Guard Rulesets are curated collections of validation rules optimized for specific types of code:

- **frontend** - React/Vue components, UI code
- **backend** - API handlers, server code
- **security** - Security-focused audit
- **testing** - Test file validation
- **default** - General code (all rules)

## When To Use

| Context | Ruleset | Key Checks |
|---------|---------|------------|
| React components | `frontend` | Empty catches, disabled features, console.log |
| NestJS controllers | `backend` | SQL injection, error handling, auth checks |
| Before commit | `security` | Hardcoded secrets, injection vulnerabilities |
| Test files | `testing` | Fake tests, missing assertions |
| General code | `default` | All enabled rules |

---

## Ruleset Details

### frontend

Optimized for UI components and client-side code.

**Rules included:**
- `blockSwallowedExceptions` - Empty catch blocks
- `blockDisabledFeatures` - Commented out code, .skip()
- `blockConsoleLog` - Production console.log statements
- `blockInlineStyles` - Prefer CSS classes

**Rules excluded:**
- SQL injection (not relevant)
- Server-only patterns

### backend

Optimized for API handlers and server code.

**Rules included:**
- `blockSqlInjection` - SQL injection patterns
- `blockSwallowedExceptions` - Empty catch blocks
- `blockHardcodedSecrets` - API keys, passwords
- `blockNoAuth` - Missing auth middleware
- `blockUnvalidatedInput` - Unsanitized user input

**Rules excluded:**
- UI-specific rules

### security

Comprehensive security audit.

**Rules included (all security rules):**
- `blockSqlInjection`
- `blockHardcodedSecrets`
- `blockXSS` - Cross-site scripting patterns
- `blockPathTraversal` - Directory traversal
- `blockCommandInjection` - Shell injection
- `blockInsecureRandom` - Weak random generation

### testing

Test file validation.

**Rules included:**
- `blockFakeTests` - Tests without assertions
- `blockSkippedTests` - it.skip, describe.skip
- `blockEmptyTests` - Empty test bodies
- `blockNoAssertions` - Missing expect/assert

### default

All enabled rules applied.

---

## MCP Tools Reference

### `guard_validate`

Validate code with optional ruleset.

```json
// Request with ruleset
{
  "code": "const handler = (req, res) => { ... }",
  "filename": "userController.ts",
  "ruleset": "backend",
  "taskId": "fix-auth-bug"  // Optional: tags evidence
}

// Response
{
  "valid": false,
  "errors": [
    {
      "rule": "blockSqlInjection",
      "message": "Potential SQL injection: unsanitized query parameter",
      "line": 15,
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "rule": "blockSwallowedExceptions",
      "message": "Empty catch block at line 42",
      "line": 42,
      "severity": "warning"
    }
  ],
  "ruleset": "backend",
  "rulesChecked": 8
}
```

### `guard_validate` with strict mode

Treat warnings as blocking errors.

```json
{
  "code": "...",
  "filename": "critical.ts",
  "ruleset": "security",
  "strict": true  // Warnings become errors
}
```

### `guard_rules`

List all available rules.

```json
// Response
{
  "rules": [
    {
      "name": "blockFakeTests",
      "description": "Detect tests without assertions",
      "enabled": true,
      "severity": "error",
      "rulesets": ["testing", "default"]
    },
    {
      "name": "blockSqlInjection",
      "description": "Detect SQL injection vulnerabilities",
      "enabled": true,
      "severity": "error",
      "rulesets": ["backend", "security", "default"]
    }
  ]
}
```

### `guard_toggle_rule`

Enable or disable specific rule.

```json
// Request
{
  "rule": "blockConsoleLog",
  "enabled": false
}

// Response
{ "success": true, "rule": "blockConsoleLog", "enabled": false }
```

### `guard_check_test`

Specialized test file analysis.

```json
// Request
{
  "code": "describe('Auth', () => { it('works', () => {}) })",
  "filename": "auth.test.ts"
}

// Response
{
  "valid": false,
  "fakeTests": [
    {
      "name": "works",
      "line": 1,
      "reason": "No assertions found"
    }
  ]
}
```

---

## How failingRules Feed Gates

When `taskId` is provided, validation results become evidence:

```json
// Validation call
guard_validate {
  "code": "...",
  "filename": "auth.ts",
  "ruleset": "security",
  "taskId": "fix-auth-bug"
}

// Creates evidence
{
  "taskId": "fix-auth-bug",
  "type": "guard",
  "status": "failed",  // or "passed"
  "details": {
    "ruleset": "security",
    "failingRules": ["blockHardcodedSecrets"],
    "errors": 1,
    "warnings": 0
  }
}
```

This evidence is checked by [Completion Gates](COMPLETION_GATES.md). Tasks cannot complete until guard passes.

---

## Ruleset Selection Guide

### By File Type

| File Pattern | Suggested Ruleset |
|--------------|-------------------|
| `*.tsx`, `*.jsx` | `frontend` |
| `*.controller.ts` | `backend` |
| `*.service.ts` | `backend` |
| `*.test.ts`, `*.spec.ts` | `testing` |
| `*.config.ts` | `security` |
| Other | `default` |

### By Workflow Stage

| Stage | Ruleset | Why |
|-------|---------|-----|
| Development | `default` | Catch general issues |
| Pre-commit | `security` | Security audit |
| CI/CD | Varies by file type | Targeted checks |
| Code review | `default` + `security` | Comprehensive |

---

## Example Workflows

### Frontend Component Validation

```json
guard_validate {
  "code": "export const Button = ({ onClick }) => ...",
  "filename": "Button.tsx",
  "ruleset": "frontend"
}
```

### Backend API Security Check

```json
guard_validate {
  "code": "router.post('/users', async (req, res) => ...)",
  "filename": "userRoutes.ts",
  "ruleset": "security",
  "strict": true
}
```

### Test Quality Check

```json
guard_check_test {
  "code": "describe('UserService', () => ...)",
  "filename": "user.service.test.ts"
}
```

---

## Troubleshooting

### "Rule not found in ruleset"

- Check available rules: `guard_rules`
- Some rules only apply to specific rulesets
- Use `default` ruleset for all rules

### "Too many false positives"

- Switch to more specific ruleset
- Disable problematic rules: `guard_toggle_rule`
- Use `strict: false` (default) for warnings

### "Guard passes but security issue exists"

- Guard catches common patterns, not all vulnerabilities
- Combine with manual security review
- Consider additional security tools

---

## Related Docs

- [Completion Gates](COMPLETION_GATES.md) - Guard evidence for gate completion
- [Testing Observability](TESTING_OBSERVABILITY.md) - Test validation
- [User Guide](USER_GUIDE.md) - Guard module reference

---

*Last updated: December 2025*
