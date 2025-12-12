# Latent Chain Mode - User Guide

> Hướng dẫn sử dụng Latent Chain Mode trong Claude Code Guardian
>
> **Version 1.3.0** | Updated: December 12, 2025

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [3 Flow Commands](#3-flow-commands)
3. [Flow chuẩn 5 bước](#flow-chuẩn-5-bước)
4. [Diff-Based Editing (NEW!)](#diff-based-editing-new)
5. [Output Format với Phase Icons](#output-format)
6. [Auto-Attach Feature](#auto-attach-feature)
7. [Ví dụ thực tế](#ví-dụ-thực-tế)
8. [Prompt Pattern cho Claude](#prompt-pattern-cho-claude)
9. [Tips & Best Practices](#tips--best-practices)

---

## Tổng quan

### Latent Chain Mode là gì?

Latent Chain Mode là phương pháp làm việc mô phỏng **hidden-state reasoning** (suy luận ẩn), lấy cảm hứng từ các paper nghiên cứu của Stanford/Princeton/UIUC.

### Lợi ích chính

| Benefit | Mô tả |
|---------|-------|
| **70-80% Token Reduction** | Chỉ gửi delta (thay đổi), không full context |
| **3-4x Speed** | Nhanh hơn cho multi-agent workflows |
| **Structured Thinking** | 4 phase rõ ràng: analysis → plan → impl → review |
| **Traceable Decisions** | Mọi decision được track với ID |

### Khi nào dùng?

- Task có **2+ bước** trở lên
- Bug fix phức tạp
- Feature mới cần thiết kế
- Refactoring lớn
- Code review có nhiều file

---

## 3 Flow Commands

> **NEW in v1.2.2** - Quick commands cho các use cases phổ biến

### Bảng tổng hợp

| Flow | Command | Use Case | Phases |
|------|---------|----------|--------|
| **A** | `/latent-fix` | Quick fix 1-2 patches, file đang mở | analysis → plan → impl → review |
| **B** | `/latent-feature` | Feature/Refactor nhiều files | deep analysis → detailed plan → iterative impl → review |
| **C** | `/latent-review` | Review/Audit code (không sửa) | analysis → plan → structured output |

### Flow A: `/latent-fix`

**Dùng khi:** Bug đơn giản, chỉ 1-2 files cần sửa

```bash
/latent-fix                     # Fix file đang mở
/latent-fix src/auth/login.ts   # Fix file cụ thể
```

**Quy trình tự động:**
1. 🔍 Analysis: Xác định vấn đề
2. 📋 Plan: Liệt kê 1-2 patches
3. 🔧 Impl: Apply patches
4. ✅ Review: Verify & complete

### Flow B: `/latent-feature`

**Dùng khi:** Feature mới hoặc refactoring lớn

```bash
/latent-feature "Add dark mode toggle"
/latent-feature "Refactor auth" --constraints "No breaking changes"
```

**Quy trình tự động:**
1. 🔍 Deep Analysis: Nghiên cứu codebase
2. 📋 Detailed Plan: Sub-tasks với dependencies
3. 🔧 Iterative Impl: Apply patches theo thứ tự
4. ✅ Comprehensive Review: Tests + validation

### Flow C: `/latent-review`

**Dùng khi:** Review/Audit code mà không sửa

```bash
/latent-review                     # Review file đang mở
/latent-review src/auth/           # Review folder
/latent-review src/api/users.ts    # Review file cụ thể
```

**Output structured:**
- Hot spots identified
- Risks & issues
- Recommendations (không tự động sửa)

### `/latent-status`

Quick check trạng thái latent context hiện tại:

```bash
/latent-status                  # Show current context
/latent-status fix-auth-bug     # Show specific context
```

---

## Output Format

> **NEW in v1.2.2** - Standardized output với phase icons

### Phase Icons

| Phase | Icon | Ý nghĩa |
|-------|------|---------|
| analysis | 🔍 | Đang phân tích vấn đề |
| plan | 📋 | Đang lên kế hoạch |
| impl | 🔧 | Đang thực hiện |
| review | ✅ | Kiểm tra hoàn thành |

### Format chuẩn trong Editor

```
🔍 [analysis] <tiêu đề ngắn>
<1-2 câu mô tả>

[Hot Spots] file:line, file:line
[Decisions] D001: ..., D002: ...
[Risks] nếu có

---

📋 [plan] <số patches/tasks>

[Patches] hoặc [Sub-tasks]
1. file:line - mô tả
2. file:line - mô tả

---

🔧 [impl] Patch N/M: <name>
Applied: <count> | Tests: <status>

---

✅ [review] Complete
Files: N | Patches: M | Tests: passed
```

### Ví dụ output thực tế

```
🔍 [analysis] Token expiry bug in auth module
Token không được refresh, gây logout sau 1h.

[Hot Spots] src/auth/token.ts:45-60
[Decisions] D001: Add token refresh mechanism
[Risks] Active sessions may be affected

---

📋 [plan] 2 patches

[Patches]
1. src/auth/token.ts:45 - Add refresh logic
2. src/config/auth.ts:12 - Configurable expiry

---

🔧 [impl] Patch 1/2: token.ts
Applied: 1 | Tests: pending

🔧 [impl] Patch 2/2: auth.ts
Applied: 2 | Tests: running...

---

✅ [review] Complete
Files: 2 | Patches: 2 | Tests: 47 passed
```

---

## Auto-Attach Feature

> **NEW in v1.2.2** - Tự động attach latent context

### Cách hoạt động

CCG tự động tạo và attach latent context khi:

1. **Có workflow task đang chạy** (`workflow_task_start`)
2. **Claude gọi một trong các tools:**
   - `guard_validate`
   - `testing_run`
   - Write operations (Edit, Write)
3. **Chưa có latent context** cho task đó

### Configuration

```json
{
  "modules": {
    "latent": {
      "enabled": true,
      "autoAttach": true   // Enable auto-attach (default: true)
    }
  }
}
```

### Tắt Auto-Attach

Nếu muốn control manual:

```json
{
  "modules": {
    "latent": {
      "autoAttach": false
    }
  }
}
```

### Implementation

Xem: `src/hooks/pre-tool-call.hook.ts` (line 330-420)

---

## Flow chuẩn 5 bước

### Bước 0: Khởi động

1. Restart MCP server để load Latent Module
2. Kiểm tra config trong `.ccg/config.json`:

```json
{
  "modules": {
    "latent": {
      "enabled": true,
      "maxContexts": 50,
      "autoMerge": true,
      "persist": true,
      "persistPath": ".ccg/latent-contexts.json"
    }
  }
}
```

### Bước 1: Bắt đầu task → `latent_context_create`

Khi bắt đầu việc lớn, tạo context:

```json
{
  "tool": "latent_context_create",
  "args": {
    "taskId": "fix-auth-refresh",
    "phase": "analysis",
    "constraints": [
      "Không breaking change",
      "Phải pass toàn bộ test hiện tại"
    ],
    "files": ["src/auth/login.ts"]
  }
}
```

**Output:**
- Tạo `AgentLatentContext` mới
- Lưu vào `.ccg/latent-contexts.json`
- Version = 1

### Bước 2: Suy nghĩ → Trả về LatentResponse

Thay vì viết essay dài, Claude trả về JSON ngắn gọn:

```json
{
  "summary": "Xác định root cause ở login.ts:45-60, thiếu logic refresh token.",
  "contextDelta": {
    "codeMap": {
      "hotSpots": ["src/auth/login.ts:45-60"]
    },
    "decisions": [
      {
        "id": "D001",
        "summary": "Root cause: không refresh token",
        "rationale": "Token hết hạn sau 1h, không có cơ chế refresh."
      }
    ],
    "risks": ["Có thể ảnh hưởng session hiện tại"]
  },
  "actions": []
}
```

Sau đó gọi tool để merge:

```json
{
  "tool": "latent_context_update",
  "args": {
    "taskId": "fix-auth-refresh",
    "delta": {
      "codeMap": { "hotSpots": ["src/auth/login.ts:45-60"] },
      "decisions": [{ "id": "D001", "summary": "...", "rationale": "..." }],
      "risks": ["Có thể ảnh hưởng session hiện tại"]
    }
  }
}
```

### Bước 3: Chuyển phase → `latent_phase_transition`

Khi hoàn thành 1 phase:

```json
{
  "tool": "latent_phase_transition",
  "args": {
    "taskId": "fix-auth-refresh",
    "toPhase": "plan",
    "summary": "Hoàn tất phân tích, đã xác định nguyên nhân và phạm vi ảnh hưởng."
  }
}
```

**Flow chuẩn:**

```
┌─────────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  ANALYSIS   │ ──► │  PLAN   │ ──► │  IMPL   │ ──► │ REVIEW  │
│             │     │         │     │         │     │         │
│ - Đọc yêu   │     │ - Tasks │     │ - Patch │     │ - Check │
│   cầu       │     │ - Thứ   │     │ - Code  │     │ - Test  │
│ - Hot spots │     │   tự    │     │         │     │ - Done? │
│ - Decisions │     │ - Deps  │     │         │     │         │
└─────────────┘     └─────────┘     └─────────┘     └─────────┘
       │                  │               │
       └──────────────────┴───────────────┘
              (có thể quay lại nếu cần)
```

**Valid transitions:**
- analysis → plan, impl
- plan → impl, review
- impl → review, plan (quay lại nếu phát hiện vấn đề)
- review → impl, analysis (quay lại nếu cần fix)

### Bước 4: Sửa code → `latent_apply_patch`

Trong phase `impl`, dùng patch thay vì paste code:

```json
{
  "tool": "latent_apply_patch",
  "args": {
    "taskId": "fix-auth-refresh",
    "target": "src/auth/login.ts",
    "patch": "--- a/src/auth/login.ts\n+++ b/src/auth/login.ts\n@@ -45,3 +45,5 @@\n-const token = generateToken();\n+const token = generateToken();\n+scheduleTokenRefresh(token, 50 * 60 * 1000);\n"
  }
}
```

---

## Diff-Based Editing (NEW!)

> **v1.3.0** - Advanced patch application system

### Tại sao dùng Diff-Based Editing?

| Traditional | Diff-Based |
|-------------|------------|
| Paste full file content | Chỉ gửi thay đổi (diff) |
| ~500-2000 tokens/file | ~50-200 tokens/patch |
| Dễ conflict | Auto-merge thông minh |
| Phải đọc lại cả file | Chỉ focus vào phần sửa |

### Unified Diff Format

CCG sử dụng **unified diff format** chuẩn:

```diff
--- a/src/auth/token.ts
+++ b/src/auth/token.ts
@@ -45,3 +45,5 @@
 const token = generateToken();
-// TODO: Add refresh logic
+scheduleTokenRefresh(token, 50 * 60 * 1000);
+logger.info('Token refresh scheduled');
```

**Giải thích:**
- `---` / `+++`: File gốc vs file mới
- `@@`: Vị trí thay đổi (line 45, 3 dòng context)
- ` ` (space): Dòng không đổi
- `-`: Dòng bị xóa
- `+`: Dòng được thêm

### PatchApplicator

CCG tự động xử lý patches:

1. **Thử git apply** trước (nếu có git)
2. **Fallback manual patch** nếu không có git
3. **Tạo file mới** nếu patch tạo file

```typescript
// Internal API
const applicator = new PatchApplicator(projectRoot, logger);
const result = await applicator.applyPatch({
  target: 'src/auth/token.ts',
  patch: unifiedDiff,
  dryRun: false // Set true để preview
});
```

### Dry Run Mode

Kiểm tra patch trước khi apply:

```json
{
  "tool": "latent_apply_patch",
  "args": {
    "taskId": "fix-auth",
    "target": "src/auth/token.ts",
    "patch": "...",
    "dryRun": true
  }
}
```

### DeltaMerger

Context được merge thông minh, không replace:

```json
// Update 1
{ "delta": { "risks": ["Risk A"] } }

// Update 2
{ "delta": { "risks": ["Risk B"] } }

// Kết quả: risks = ["Risk A", "Risk B"]
// Không phải: risks = ["Risk B"]
```

**Merge rules:**
- **Arrays**: Append + deduplicate
- **Objects**: Deep merge
- **Primitives**: Replace

### Best Practices cho Diff-Based Editing

1. **Giữ patch nhỏ** - 1 patch = 1 thay đổi logic
2. **Thêm context** - Ít nhất 3 dòng context trước/sau
3. **Test dryRun** - Luôn preview trước patch phức tạp
4. **Track artifacts** - Update context sau mỗi patch

```json
// Sau khi apply patch
{
  "tool": "latent_context_update",
  "args": {
    "taskId": "fix-auth",
    "delta": {
      "artifacts": {
        "patches": ["src/auth/token.ts"]
      }
    }
  }
}
```

Sau đó update artifacts:

```json
{
  "tool": "latent_context_update",
  "args": {
    "taskId": "fix-auth-refresh",
    "delta": {
      "artifacts": {
        "patches": ["src/auth/login.ts"]
      }
    }
  }
}
```

### Bước 5: Kết thúc → `latent_complete_task`

Khi mọi thứ OK:

```json
{
  "tool": "latent_complete_task",
  "args": {
    "taskId": "fix-auth-refresh",
    "summary": "Đã fix bug refresh token, tests passed."
  }
}
```

---

## Ví dụ thực tế

### Ví dụ: Fix bug authentication

**Yêu cầu:** "User bị logout sau 1h dù không inactive"

#### Phase 1: Analysis

```json
// latent_context_create
{
  "taskId": "fix-session-timeout",
  "phase": "analysis",
  "constraints": ["Không breaking change", "Pass all tests"],
  "files": ["src/auth/session.ts", "src/auth/token.ts"]
}

// latent_context_update (sau khi phân tích)
{
  "delta": {
    "codeMap": {
      "hotSpots": ["src/auth/token.ts:78-92"],
      "components": ["AuthService", "TokenManager"]
    },
    "decisions": [{
      "id": "D001",
      "summary": "Token expiry hardcoded 1h, không refresh",
      "rationale": "Tìm thấy `expiresIn: 3600` ở line 82"
    }],
    "risks": ["Active sessions có thể bị ảnh hưởng"]
  }
}
```

#### Phase 2: Plan

```json
// latent_phase_transition
{ "toPhase": "plan", "summary": "Đã xác định root cause" }

// latent_context_update
{
  "delta": {
    "decisions": [{
      "id": "D002",
      "summary": "Thêm refresh token mechanism",
      "rationale": "Refresh 5 phút trước khi hết hạn"
    }, {
      "id": "D003",
      "summary": "Update config cho expiry time",
      "rationale": "Cho phép customize qua env"
    }]
  }
}
```

#### Phase 3: Impl

```json
// latent_phase_transition
{ "toPhase": "impl" }

// latent_apply_patch (patch 1)
{
  "target": "src/auth/token.ts",
  "patch": "..." // unified diff
}

// latent_apply_patch (patch 2)
{
  "target": "src/config/auth.config.ts",
  "patch": "..." // unified diff
}

// latent_context_update
{
  "delta": {
    "artifacts": {
      "patches": ["src/auth/token.ts", "src/config/auth.config.ts"]
    }
  }
}
```

#### Phase 4: Review

```json
// latent_phase_transition
{ "toPhase": "review", "summary": "Đã apply 2 patches" }

// Kiểm tra constraints
// - "Không breaking change" ✓
// - "Pass all tests" ✓

// latent_complete_task
{
  "taskId": "fix-session-timeout",
  "summary": "Fixed session timeout: added token refresh mechanism + configurable expiry"
}
```

---

## Prompt Pattern cho Claude

### Thêm vào Project Instructions

```markdown
## Latent Chain Mode

Khi làm việc với CCG, ưu tiên **Latent Chain Mode** cho các task từ 2 bước trở lên.

### Quy tắc bắt buộc:

1. **Bắt đầu task** → Gọi `latent_context_create`
2. **Output format** → Dùng LatentResponse (summary + contextDelta + actions)
3. **Update context** → Gọi `latent_context_update` với delta, KHÔNG lặp full context
4. **Sửa code** → Dùng `latent_apply_patch`, không paste code trực tiếp
5. **Chuyển phase** → Dùng `latent_phase_transition` khi hoàn thành 1 phase
6. **Kết thúc** → Gọi `latent_complete_task`

### Quy tắc văn bản:

- Summary tối đa **2 câu** (200 chars)
- KHÔNG viết essay giải thích
- KHÔNG lặp thông tin đã có trong context
- Mọi decision phải có ID (D001, D002...)

### 4 Phases:

| Phase | Mục tiêu | Output |
|-------|----------|--------|
| analysis | Hiểu vấn đề | hotSpots, risks, decisions |
| plan | Lên kế hoạch | tasks list, dependencies |
| impl | Thực hiện | patches, code changes |
| review | Kiểm tra | verify constraints, tests |
```

### Slash Command Suggestion

Khi user nói `/latent-start <task>`, Claude nên:

1. Gọi `latent_context_create`
2. Chạy analysis phase
3. Output kế hoạch ngắn gọn

---

## Tips & Best Practices

### DO ✓

- **Keep summary short** - 1-2 câu max
- **Use decision IDs** - D001, D002... để track
- **Send delta only** - Không full context
- **Transition explicitly** - Dùng tool để chuyển phase
- **Track patches** - Ghi lại trong artifacts

### DON'T ✗

- Viết giải thích dài
- Lặp thông tin từ context
- Gửi full context mỗi lần update
- Skip phase transition
- Paste code thay vì apply patch

### Debugging

```json
// Xem context hiện tại
{ "tool": "latent_context_get", "args": { "taskId": "xxx" } }

// Xem với history
{ "tool": "latent_context_get", "args": { "taskId": "xxx", "includeHistory": true } }

// List tất cả contexts
{ "tool": "latent_list_contexts" }

// Module status
{ "tool": "latent_status" }

// Xóa context cũ
{ "tool": "latent_delete_context", "args": { "taskId": "xxx" } }
```

### Token Budget Warning

Khi token gần threshold (70-85%):
- Chỉ gửi `contextDelta` tối thiểu
- Không include actions
- Ưu tiên complete task nhanh

---

## Tham khảo

- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) - Full module docs
- [USER_GUIDE.md](USER_GUIDE.md) - User guide với tools reference
- [paper.md](paper.md) - Latent Chain Mode specification
- [improve_UX.md](improve_UX.md) - UX analysis và proposals
- [src/modules/latent/](../src/modules/latent/) - Source code
- [templates/commands/](../templates/commands/) - Slash command templates

### Slash Command Files

| File | Command |
|------|---------|
| `latent-fix.md` | `/latent-fix` - Quick fix |
| `latent-feature.md` | `/latent-feature` - Feature/Refactor |
| `latent-review.md` | `/latent-review` - Code review |
| `latent-status.md` | `/latent-status` - Status check |
| `ccg-latent.md` | `/ccg latent` - Full latent commands |

---

## Changelog

### v1.3.0 (2025-12-12)
- **NEW**: Diff-Based Editing with `PatchApplicator`
- **NEW**: `DeltaMerger` for intelligent context merging
- **NEW**: Unified diff format support
- **NEW**: Dry run mode for patch preview
- **Updated**: Best practices for diff-based workflows
- **Updated**: Examples with unified diff format

### v1.2.2 (2025-11-30)
- **NEW**: 3 Flow Commands (`/latent-fix`, `/latent-feature`, `/latent-review`)
- **NEW**: `/latent-status` quick status check
- **NEW**: Auto-Attach feature in pre-tool-call hook
- **NEW**: Standardized output format with phase icons
- **Updated**: TOC với các sections mới
- **Updated**: Examples với real output format

### v1.0 (2025-11-30)
- Initial release

---

*Claude Code Guardian - Latent Chain Mode v1.3.0*
