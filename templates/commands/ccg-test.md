# CCG Testing

Run tests and perform browser checks.

## Commands

### Run Tests
```
/ccg test [file-pattern]
```
Run tests, optionally filtered by pattern.

**Examples:**
```
/ccg test                    # Run all tests
/ccg test auth               # Run auth-related tests
/ccg test --coverage         # Run with coverage
```

### Run Affected Tests
```
/ccg test affected
```
Run only tests affected by recent changes.

### Browser Testing
```
/ccg test browser <url>
```
Open a browser session for testing.

**Examples:**
```
/ccg test browser http://localhost:3000
/ccg test browser http://localhost:3000/login
```

### Take Screenshot
```
/ccg test screenshot [selector]
```
Capture screenshot of current browser session.

**Examples:**
```
/ccg test screenshot              # Full page
/ccg test screenshot "#main"      # Specific element
/ccg test screenshot --full       # Full page scroll
```

### Get Console Logs
```
/ccg test console
```
Show console output from browser session.

### Get Network Requests
```
/ccg test network [--errors]
```
Show network requests from browser session.

### Close Browser
```
/ccg test browser close
```
Close the current browser session.

### Cleanup
```
/ccg test cleanup
```
Clean up test data and temporary files.

### Test Status
```
/ccg test status
```
Show testing module status and last results.

## Browser Testing Workflow

```
1. /ccg test browser http://localhost:3000
   -> Opens browser, captures console & network

2. Interact with the page...

3. /ccg test screenshot
   -> Captures current state

4. /ccg test console
   -> Check for errors

5. /ccg test browser close
   -> Cleanup
```

## Test Results

Results include:
- Passed tests
- Failed tests
- Skipped tests
- Coverage (if enabled)

## Tips

1. **Run affected tests** after changes to save time
2. **Use browser testing** for UI components
3. **Check console logs** for runtime errors
4. **Cleanup regularly** to avoid stale test data

---

When these commands are invoked, use the `testing_*` MCP tools.
