# Latent Feature (Flow B)

Refactor hoặc thêm feature mới, có thể ảnh hưởng nhiều files.

## Usage

```
/latent-feature "<feature description>" [--files "file1,file2"] [--constraints "rule1,rule2"]
```

**Arguments:**
- `feature description` (required): Mô tả feature/refactor cần làm
- `--files` (optional): Danh sách files liên quan
- `--constraints` (optional): Các ràng buộc (no breaking changes, etc.)

## Flow

Khi command được invoke:

### 1. Initialize
```
workflow_task_create: {
  name: "<feature name>",
  priority: "high",
  description: "<full description>"
}
workflow_task_start: { taskId }
latent_context_create: {
  taskId: "feature-<timestamp>",
  phase: "analysis",
  files: [<scanned or provided files>],
  constraints: [<provided or default>]
}
```

### 2. Analysis Phase (Deep)
- Scan project structure nếu chưa có files
- Đọc tất cả files liên quan
- Xác định dependencies, hot spots
- Output:
```
🔍 [analysis] <feature name>
<2-3 câu mô tả scope và approach>

[Files] <số files affected>
[Components] <main components>
[Hot Spots] <critical locations>
[Risks] <identified risks>
```

### 3. Plan Phase (Detailed)
```
latent_phase_transition: { toPhase: "plan", summary: "..." }
```
- Chia thành sub-tasks
- Xác định thứ tự implement
- Thêm notes vào workflow
```
workflow_task_note: { taskId, content: "<sub-task>", type: "note" }
```
- Output:
```
📋 [plan] <số sub-tasks>

[Sub-tasks]
1. [  ] <task 1 - file/component>
2. [  ] <task 2 - file/component>
...

[Order] <implementation order>
[Dependencies] <nếu có>
```

### 4. Impl Phase (Iterative)
```
latent_phase_transition: { toPhase: "impl" }
```

Cho mỗi sub-task:
1. Mark in progress
2. Apply patches: `latent_apply_patch` hoặc Edit
3. Run affected tests: `testing_run_affected`
4. Update progress: `workflow_task_update`
5. Output status:
```
🔧 [impl] Sub-task N/M: <name>
Applied patches: <count>
Tests: <status>
```

### 5. Review Phase
```
latent_phase_transition: { toPhase: "review" }
```
- Tổng hợp decisions, risks
- Validate tất cả changes
- Output:
```
📝 [review] Feature complete

[Summary]
- Files modified: N
- Patches applied: M
- Tests: passed/failed

[Decisions]
D001: ...
D002: ...

[Risks Mitigated]
- ...

[Next Steps] (nếu có)
```

### 6. Complete
```
latent_complete_task: { summary: "..." }
workflow_task_complete: { taskId }
```

## Output Format

```
🔍 [analysis] Add dark mode support
Cần thêm theme context, update 15 components, modify CSS variables.

[Files] 18 files affected
[Components] ThemeProvider, useTheme, Button, Card, ...
[Hot Spots] src/theme/context.tsx, src/styles/variables.css
[Risks] Breaking change nếu không backward compatible

---

📋 [plan] 4 sub-tasks

[Sub-tasks]
1. [  ] ThemeProvider + useTheme hook
2. [  ] CSS variables cho dark/light
3. [  ] Update core components (Button, Card, Input)
4. [  ] Update remaining components

[Order] 1 → 2 → 3 → 4
[Dependencies] Sub-task 3,4 phụ thuộc vào 1,2

---

🔧 [impl] Sub-task 1/4: ThemeProvider
Applied patches: 2
Tests: 5 passed

🔧 [impl] Sub-task 2/4: CSS variables
Applied patches: 1
Tests: 3 passed

...

---

📝 [review] Feature complete

[Summary]
- Files modified: 18
- Patches applied: 12
- Tests: 45 passed

[Decisions]
D001: Use CSS variables for theming (not JS)
D002: Default to system preference

[Next Steps]
- Add toggle in settings UI
```

## Examples

```
/latent-feature "Add user authentication"
/latent-feature "Refactor payment module" --constraints "No breaking changes"
/latent-feature "Add dark mode" --files "src/theme/,src/components/"
```

## MCP Tools Used

- `workflow_task_create`, `workflow_task_start`, `workflow_task_update`, `workflow_task_complete`
- `workflow_task_note`
- `latent_context_create`, `latent_context_get`, `latent_context_update`
- `latent_phase_transition`
- `latent_apply_patch`
- `guard_validate`
- `testing_run`, `testing_run_affected`
- `latent_complete_task`
- `documents_scan` (nếu cần scan project)

---

*Feature/Refactor với full latent workflow - structured, trackable, token-efficient*
