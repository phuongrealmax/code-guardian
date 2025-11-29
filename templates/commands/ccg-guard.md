# CCG Guard

Code validation and protection against common mistakes.

## Commands

### Guard Status
```
/ccg guard status
```
Show current guard rules and statistics.

### Validate Code
```
/ccg guard check [file]
```
Manually validate a file or the last modified file.

### Enable/Disable Rules
```
/ccg guard enable <rule>
/ccg guard disable <rule>
```
Enable or disable specific guard rules.

**Available Rules:**
- `fake-tests` - Block tests without assertions
- `disabled-features` - Block commented-out features
- `empty-catch` - Block empty catch blocks
- `emoji-code` - Block emoji in code
- `swallowed-exceptions` - Block ignored errors

### View Rule Details
```
/ccg guard rule <rule-name>
```
Show details about a specific rule.

### Strict Mode
```
/ccg guard strict on|off
```
Enable or disable strict mode (blocks vs warns).

## Guard Rules

### 1. Fake Tests (`fake-tests`)
Detects tests that don't actually test anything:
- Tests without assertions
- Tests that just call functions without checking results
- Skipped test blocks

```javascript
// BLOCKED: No assertions
it('should work', () => {
  myFunction();
});

// OK: Has assertions
it('should work', () => {
  expect(myFunction()).toBe(true);
});
```

### 2. Disabled Features (`disabled-features`)
Detects accidentally disabled functionality:
- Commented-out critical code
- `if (false)` blocks
- Empty function implementations

```javascript
// BLOCKED: Disabled auth
// function validateToken(token) {
//   return jwt.verify(token);
// }

// BLOCKED: Empty implementation
function validateToken(token) {
  return;  // Disabled for testing
}
```

### 3. Empty Catch (`empty-catch`)
Detects swallowed errors:

```javascript
// BLOCKED: Empty catch
try {
  await saveData();
} catch (e) {}

// OK: Handles error
try {
  await saveData();
} catch (e) {
  console.error('Save failed:', e);
  throw e;
}
```

### 4. Emoji in Code (`emoji-code`)
Prevents emoji that can cause encoding issues:

```javascript
// BLOCKED
const status = 'Complete';  // with emoji

// OK
const status = 'Complete';
```

### 5. Swallowed Exceptions (`swallowed-exceptions`)
Detects caught but ignored errors:

```javascript
// BLOCKED: Error ignored
catch (error) {
  // TODO: handle later
}

// OK: Error handled
catch (error) {
  logger.error(error);
  throw new AppError('Operation failed', error);
}
```

## Severity Levels

| Level | Action | Use |
|-------|--------|-----|
| `info` | Log only | Minor suggestions |
| `warning` | Warn user | Should be fixed |
| `error` | Highlight | Must be fixed |
| `block` | Prevent save | Critical issues |

## Statistics

The guard tracks:
- Total validations
- Issues found by rule
- Blocks prevented
- Auto-fixes applied

---

When these commands are invoked, use the `guard_*` MCP tools.
