# Testing Observability

Prioritized failure output for faster debugging.

## What It Does

When tests fail or browser sessions encounter errors, CCG prioritizes the most useful diagnostic information:

1. **Console errors** - JavaScript errors, exceptions
2. **Network failures** - Failed API calls, 4xx/5xx responses
3. **Trace data** - Stack traces, call chains
4. **Screenshots** - Visual state (lowest priority)

This ordering helps you find root causes faster.

---

## Failure Output Priority

### Priority Order

| Priority | Source | Why First |
|----------|--------|-----------|
| 1 | Console errors | Direct error messages, stack traces |
| 2 | Network failures | API/backend issues causing failures |
| 3 | Trace/performance | Timing issues, async problems |
| 4 | Screenshots | Visual confirmation (often noise) |

### Example Output

```
FAILURE: auth.test.ts > should login user

[Console Errors]
TypeError: Cannot read property 'token' of undefined
    at AuthService.login (src/auth/service.ts:45)
    at async LoginForm.handleSubmit (src/components/Login.tsx:23)

[Network Failures]
POST /api/auth/login → 500 Internal Server Error
Response: {"error": "Database connection failed"}

[Trace]
LoginForm.handleSubmit
  → AuthService.login
    → fetch('/api/auth/login')
      → (500 error)

[Screenshot]
(Available: .ccg/screenshots/auth-test-failure-001.png)
```

---

## testing:failure Event

When a test fails, CCG emits a `testing:failure` event to the session timeline.

### Event Structure

```json
{
  "type": "testing:failure",
  "timestamp": "2025-12-15T11:00:00Z",
  "metadata": {
    "testFile": "tests/auth.test.ts",
    "testName": "should login user",
    "duration": 1234,
    "errors": [
      {
        "type": "console",
        "message": "TypeError: Cannot read property 'token' of undefined",
        "stack": "at AuthService.login..."
      }
    ],
    "networkFailures": [
      {
        "url": "/api/auth/login",
        "method": "POST",
        "status": 500
      }
    ],
    "healthScore": 35
  }
}
```

### Using Failure Events

Query timeline to find failures:

```json
// Get recent failures
session_timeline { "limit": 50 }
// Filter for type: "testing:failure"
```

---

## Health Score

Browser sessions and test runs include a **health score** (0-100).

### Calculation

| Factor | Weight | Impact |
|--------|--------|--------|
| Console errors | 40% | -10 per error |
| Network failures | 30% | -15 per 4xx/5xx |
| JavaScript exceptions | 20% | -20 per exception |
| Slow requests (>3s) | 10% | -5 per slow request |

### Interpreting Scores

| Score | Health | Action |
|-------|--------|--------|
| 80-100 | Good | Minor issues or none |
| 50-79 | Degraded | Some failures, investigate |
| 20-49 | Poor | Multiple issues, fix before proceeding |
| 0-19 | Critical | Major failures, stop and debug |

### Example

```json
{
  "healthScore": 45,
  "breakdown": {
    "consoleErrors": 2,      // -20
    "networkFailures": 1,    // -15
    "exceptions": 1,         // -20
    "slowRequests": 0        // 0
  }
}
```

---

## MCP Tools Reference

### `testing_browser_analysis`

Get comprehensive analysis of browser session.

```json
// Request
{ "sessionId": "browser-001" }

// Response
{
  "healthScore": 65,
  "consoleErrors": [
    { "level": "error", "message": "..." }
  ],
  "networkFailures": [
    { "url": "/api/data", "status": 500 }
  ],
  "recommendations": [
    "Fix API endpoint /api/data returning 500",
    "Check AuthService for undefined token"
  ]
}
```

**Use this instead of individual log/network/error tools** - it prioritizes issues and provides actionable recommendations.

### `testing_browser_logs`

Get console logs from browser session.

```json
// Request
{ "sessionId": "browser-001" }

// Response
{
  "logs": [
    { "level": "error", "message": "TypeError: ...", "timestamp": "..." },
    { "level": "warn", "message": "Deprecated API used", "timestamp": "..." }
  ]
}
```

### `testing_browser_network`

Get network requests from browser session.

```json
// Request
{ "sessionId": "browser-001" }

// Response
{
  "requests": [
    { "url": "/api/auth", "method": "POST", "status": 200, "duration": 150 },
    { "url": "/api/data", "method": "GET", "status": 500, "duration": 2340 }
  ]
}
```

### `testing_browser_errors`

Get JavaScript errors from browser session.

```json
// Request
{ "sessionId": "browser-001" }

// Response
{
  "errors": [
    {
      "message": "TypeError: Cannot read property 'token' of undefined",
      "stack": "at AuthService.login...",
      "url": "http://localhost:3000/login"
    }
  ]
}
```

---

## Common Triage Workflow

### 1. Start Browser Session

```json
testing_browser_open { "url": "http://localhost:3000" }
// → { "sessionId": "browser-001" }
```

### 2. Perform Actions (manual or automated)

User interacts with the app or tests run.

### 3. Get Analysis

```json
testing_browser_analysis { "sessionId": "browser-001" }
```

### 4. Follow Recommendations

The analysis provides prioritized recommendations:

```json
{
  "recommendations": [
    "Fix API endpoint /api/data returning 500",  // Priority 1
    "Check AuthService for undefined token",      // Priority 2
    "Consider caching slow request to /api/list" // Priority 3
  ]
}
```

### 5. Fix and Re-test

After fixing issues, run tests again with taskId for evidence:

```json
testing_run {
  "files": ["tests/auth.test.ts"],
  "taskId": "fix-auth-bug"
}
```

---

## Evidence Collection

Test results are automatically collected as evidence when `taskId` is provided:

```json
{
  "taskId": "fix-auth-bug",
  "type": "test",
  "status": "failed",  // or "passed"
  "timestamp": "2025-12-15T11:00:00Z",
  "details": {
    "testFile": "tests/auth.test.ts",
    "passed": 12,
    "failed": 3,
    "healthScore": 45
  }
}
```

This evidence feeds into [Completion Gates](COMPLETION_GATES.md).

---

## Troubleshooting

### "No errors but test still fails"

- Check assertion messages (not console errors)
- Look at network responses for unexpected data
- Verify test expectations match current behavior

### "Health score is 0"

- Major JavaScript exception crashed the page
- Check browser errors first
- May need to fix critical issue before further testing

### "Network failures but API works in browser"

- Check for CORS issues in test environment
- Verify test server is running
- Check for auth token differences

---

## Related Docs

- [Completion Gates](COMPLETION_GATES.md) - Test evidence for gate completion
- [Guard Rulesets](GUARD_RULESETS.md) - Code validation for tests
- [User Guide](USER_GUIDE.md) - Testing module reference

---

*Last updated: December 2025*
