# CCG Test - Run Tests

Run tests and check code quality.

## Usage

```
/ccg-test [action] [args]
```

## Actions

### (no action)
Run all tests:
- Call `testing_run` to execute tests
- Display results summary

### file [path]
Run tests for specific file:
- Call `testing_run` with file filter

### coverage
Run tests with coverage:
- Call `testing_coverage`
- Display coverage report

### browser [url]
Run browser test:
- Call `testing_browser_test` with URL
- Capture console, network, screenshots

### watch
Run tests in watch mode:
- Call `testing_watch`

## Instructions

When invoked:

1. If no action: Run `npm test -- --run`
2. If "file": Run `npm test -- --run [path]`
3. If "coverage": Run `npm run test:coverage`
4. If "browser": Call `testing_browser_test`

Display test results in formatted output.
