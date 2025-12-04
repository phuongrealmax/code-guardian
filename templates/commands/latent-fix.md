# Latent Fix (Flow A)

Quick fix cho file đang mở hoặc file được chỉ định. Tối đa 1-2 patches.

## Usage

```
/latent-fix [file-path] [--description "mô tả bug"]
```

**Arguments:**
- `file-path` (optional): File cần fix. Mặc định là file đang mở.
- `--description` (optional): Mô tả ngắn về bug/issue.

## Flow

Khi command được invoke:

### 1. Initialize
```
workflow_task_create: { name: "quick-fix:<filepath>", priority: "high" }
workflow_task_start: { taskId }
latent_context_create: {
  taskId: "fix-<timestamp>",
  phase: "analysis",
  files: ["<filepath>"],
  constraints: ["Minimal changes", "No side effects", "Maintain existing tests"]
}
```

### 2. Analysis Phase
- Đọc file, xác định vấn đề
- Output LatentResponse:
```
🔍 [analysis] <tên bug>
<1-2 câu mô tả root cause>

[Hot Spots] <file:line>
[Risks] <nếu có>
```
- Gọi `latent_context_update` với delta

### 3. Plan Phase
```
latent_phase_transition: { toPhase: "plan" }
```
- Tạo plan ngắn (danh sách patches)
- Output:
```
📋 [plan] <số patches cần làm>

[Patches]
1. <file:line> - <mô tả>
```

### 4. Impl Phase
```
latent_phase_transition: { toPhase: "impl" }
```
- Apply patches bằng `latent_apply_patch` hoặc Edit tool
- Sau mỗi patch, chạy affected tests nếu có

### 5. Review & Complete
```
latent_phase_transition: { toPhase: "review" }
guard_validate: { code, filename }
testing_run_affected: { files: [<modified files>] }
latent_complete_task: { summary: "..." }
workflow_task_complete: { taskId }
```

## Output Format

```
🔍 [analysis] Fix auth refresh bug
Token không được refresh trước khi hết hạn ở login.ts:45.

[Hot Spots] src/auth/login.ts:45-60

---

📋 [plan] 1 patch

[Patches]
1. src/auth/login.ts:48 - Thêm scheduleTokenRefresh() sau generateToken()

---

🔧 [impl] Applied 1/1 patches

---

✅ [review] Fix complete
Tests: 3 passed | Guard: No issues
```

## Examples

```
/latent-fix                                    # Fix file đang mở
/latent-fix src/auth/login.ts                  # Fix file cụ thể
/latent-fix src/api/users.ts --description "API trả 500 khi user null"
```

## MCP Tools Used

- `workflow_task_create`, `workflow_task_start`, `workflow_task_complete`
- `latent_context_create`, `latent_context_update`
- `latent_phase_transition`
- `latent_apply_patch` hoặc Edit tool
- `guard_validate`
- `testing_run_affected`
- `latent_complete_task`

---

*Quick fix với structured reasoning - max 1-2 patches, minimal overhead*
