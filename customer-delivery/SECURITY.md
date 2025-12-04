# CCG Security & Guard Rules

CCG includes a comprehensive Guard module with 10 security and quality rules that provide OWASP Top 10 coverage.

## Guard Status

| Setting | Value |
|---------|-------|
| **Total Rules** | 10 |
| **Enabled** | 10/10 |
| **Strict Mode** | ON |

## Rules by Category

### Security Rules (6)

#### 1. SQL Injection (`sql-injection`)

Detects potential SQL injection vulnerabilities.

**Patterns Detected**:
- String concatenation in SQL queries
- Unparameterized user input in queries
- Dynamic query building

**Example (Bad)**:
```javascript
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);
```

**Example (Good)**:
```javascript
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);
```

---

#### 2. XSS Vulnerability (`xss-vulnerability`)

Detects Cross-Site Scripting vulnerabilities.

**Patterns Detected**:
- innerHTML assignments with user data
- Unescaped output in templates
- document.write with dynamic content

**Example (Bad)**:
```javascript
element.innerHTML = userInput;
```

**Example (Good)**:
```javascript
element.textContent = userInput;
```

---

#### 3. Command Injection (`command-injection`)

Detects command injection vulnerabilities.

**Patterns Detected**:
- exec() with user input
- shell commands with concatenated strings
- spawn() with dynamic arguments

**Example (Bad)**:
```javascript
exec(`ls ${userPath}`);
```

**Example (Good)**:
```javascript
execFile('ls', [sanitizedPath]);
```

---

#### 4. Path Traversal (`path-traversal`)

Detects path traversal attacks.

**Patterns Detected**:
- `../` in file paths
- User input in file paths without validation
- Directory traversal attempts

**Example (Bad)**:
```javascript
fs.readFile(basePath + userInput);
```

**Example (Good)**:
```javascript
const safePath = path.resolve(basePath, userInput);
if (!safePath.startsWith(basePath)) throw new Error('Invalid path');
fs.readFile(safePath);
```

---

#### 5. Prompt Injection (`prompt-injection`)

Detects prompt injection attempts in AI applications.

**Patterns Detected**:
- Instruction override attempts
- System prompt manipulation
- Role-playing attacks

**Example (Bad)**:
```javascript
const prompt = `Analyze this: ${userInput}`;
```

**Example (Good)**:
```javascript
const sanitizedInput = sanitizePrompt(userInput);
const prompt = `Analyze this: ${sanitizedInput}`;
```

---

#### 6. Hardcoded Secrets (`hardcoded-secrets`)

Detects hardcoded credentials and secrets.

**Patterns Detected**:
- API keys in source code
- Passwords in strings
- Private keys embedded
- AWS/GCP credentials

**Example (Bad)**:
```javascript
const apiKey = "sk-1234567890abcdef";
```

**Example (Good)**:
```javascript
const apiKey = process.env.API_KEY;
```

---

### Quality Rules (2)

#### 7. Empty Catch (`empty-catch`)

Detects empty catch blocks that swallow errors.

**Example (Bad)**:
```javascript
try {
  doSomething();
} catch (e) {
  // Empty - errors silently ignored
}
```

**Example (Good)**:
```javascript
try {
  doSomething();
} catch (e) {
  logger.error('Operation failed', e);
}
```

---

#### 8. Disabled Feature (`disabled-feature`)

Detects commented-out or disabled features.

**Patterns Detected**:
- `// DISABLED:`
- `// TODO: re-enable`
- Commented feature flags

---

### Testing Rules (1)

#### 9. Fake Test (`fake-test`)

Detects tests without real assertions.

**Patterns Detected**:
- `expect(true).toBe(true)`
- Empty test bodies
- Tests with only comments

**Example (Bad)**:
```javascript
test('user auth', () => {
  expect(true).toBe(true);
});
```

**Example (Good)**:
```javascript
test('user auth', () => {
  const result = authenticate(user);
  expect(result.success).toBe(true);
  expect(result.token).toBeDefined();
});
```

---

### Convention Rules (1)

#### 10. Emoji in Code (`emoji-code`)

Detects emojis in source code (outside comments and strings).

---

## Using Guard

### Validate Code

```json
// Tool: guard_validate
{
  "code": "const query = 'SELECT * FROM users WHERE id = ' + userId;",
  "filename": "user.service.ts",
  "strict": true
}
```

### Check Test Quality

```json
// Tool: guard_check_test
{
  "code": "test('example', () => { expect(true).toBe(true); })",
  "filename": "example.test.ts"
}
```

### Toggle Rules

```json
// Tool: guard_toggle_rule
{
  "rule": "emoji-code",
  "enabled": false
}
```

---

## OWASP Top 10 Coverage

| OWASP Category | CCG Rule |
|----------------|----------|
| A03:2021 Injection | sql-injection, command-injection |
| A03:2021 Injection | prompt-injection |
| A07:2021 XSS | xss-vulnerability |
| A01:2021 Broken Access | path-traversal |
| A02:2021 Cryptographic Failures | hardcoded-secrets |

---

## Best Practices

1. **Enable Strict Mode** - Block code with security issues
2. **Run Before Commit** - Use pre-commit workflow
3. **Check Test Quality** - Ensure tests have real assertions
4. **Review All Warnings** - Even non-blocking issues
5. **Keep Rules Enabled** - All 10 rules for comprehensive coverage
