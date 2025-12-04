# Latent Review

Quick latent review of code using structured hidden-state reasoning.

## Usage

```
/latent-review [path]
```

**Arguments:**
- `path` (optional): File or folder to review. Defaults to current file.

## Flow

When this command is invoked:

1. **Create Context**: Call `latent_context_create` with:
   ```json
   {
     "taskId": "review-<timestamp>",
     "phase": "analysis",
     "files": ["<target-path>"],
     "constraints": ["Identify issues", "Suggest improvements"]
   }
   ```

2. **Analysis Phase**:
   - Read the target file(s)
   - Identify hotSpots (problematic code locations)
   - Document risks and issues
   - Output LatentResponse with findings

3. **Transition to Plan**:
   ```json
   { "toPhase": "plan", "summary": "Analysis complete" }
   ```

4. **Plan Phase**:
   - Create actionable improvement items
   - Prioritize by impact
   - Output structured plan

5. **Complete or Wait**:
   - If quick review: call `latent_complete_task`
   - If user wants impl: wait for `/latent phase impl`

## Output Format

```json
{
  "summary": "Reviewed <file>, found N issues",
  "contextDelta": {
    "codeMap": {
      "hotSpots": ["file.ts:42-50", "file.ts:78"],
      "components": ["ComponentA", "ServiceB"]
    },
    "decisions": [
      { "id": "R001", "summary": "Refactor nested loops", "rationale": "O(n^3) complexity" },
      { "id": "R002", "summary": "Add error handling", "rationale": "Missing try-catch" }
    ],
    "risks": ["Breaking change if API modified"]
  },
  "actions": [
    { "type": "refactor", "target": "file.ts:42-50", "description": "Extract to helper" },
    { "type": "add_test", "target": "file.test.ts", "description": "Add edge case tests" }
  ]
}
```

## Examples

```
/latent-review                          # Review current file
/latent-review src/auth/login.ts        # Review specific file
/latent-review src/api/                 # Review entire folder
```

## MCP Tools Used

- `latent_context_create` - Initialize review context
- `latent_context_update` - Record findings
- `latent_phase_transition` - Move to plan phase
- `latent_complete_task` - Finish review

---

*Quick review with 70-80% token savings vs traditional verbose analysis*
