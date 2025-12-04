# Claude Code Guardian - User Guide

## Quick Start

Khi bắt đầu session, Claude Code sẽ tự động có quyền truy cập vào các tools của CCG. Bạn có thể sử dụng chúng bằng cách yêu cầu Claude thực hiện các tác vụ liên quan.

### Bắt đầu Session

```
session_init
```

Khởi tạo session, load memory và kiểm tra trạng thái hệ thống.

### Kết thúc Session

```
session_end
```

Lưu tất cả dữ liệu và dọn dẹp trước khi kết thúc.

---

## Tools Reference

### 1. Session Tools (Quản lý phiên)

| Tool | Mô tả |
|------|-------|
| `session_init` | Khởi tạo session mới |
| `session_end` | Kết thúc session, lưu dữ liệu |
| `session_status` | Xem trạng thái session hiện tại |

---

### 2. Memory Tools (Bộ nhớ)

Lưu trữ và truy xuất thông tin giữa các sessions.

#### `memory_store` - Lưu thông tin

| Parameter | Required | Mô tả |
|-----------|----------|-------|
| `content` | Yes | Nội dung cần lưu |
| `type` | Yes | Loại: `decision`, `fact`, `code_pattern`, `error`, `note`, `convention`, `architecture` |
| `importance` | Yes | Mức độ quan trọng (1-10) |
| `tags` | No | Mảng tags để phân loại |

**Ví dụ:**
```json
{
  "content": "Dự án sử dụng Vitest cho testing, không dùng Jest",
  "type": "convention",
  "importance": 8,
  "tags": ["testing", "convention"]
}
```

#### `memory_recall` - Tìm kiếm thông tin

| Parameter | Required | Mô tả |
|-----------|----------|-------|
| `query` | Yes | Từ khóa tìm kiếm |
| `type` | No | Lọc theo loại |
| `limit` | No | Số kết quả tối đa (mặc định: 10) |
| `minImportance` | No | Mức quan trọng tối thiểu |
| `tags` | No | Lọc theo tags |

**Ví dụ:**
```json
{
  "query": "authentication",
  "type": "decision",
  "minImportance": 7
}
```

#### Các tools khác

| Tool | Mô tả |
|------|-------|
| `memory_forget` | Xóa memory theo ID |
| `memory_summary` | Tổng quan về tất cả memories |
| `memory_list` | Liệt kê memories |

---

### 3. Guard Tools (Bảo vệ code)

Kiểm tra và phát hiện các vấn đề trong code.

#### `guard_validate` - Kiểm tra code

| Parameter | Required | Mô tả |
|-----------|----------|-------|
| `code` | Yes | Source code cần kiểm tra |
| `filename` | Yes | Tên file (để xác định loại file) |
| `strict` | No | Nếu `true`, warnings sẽ thành errors |
| `rules` | No | Chỉ định rules cụ thể |

**Các rules có sẵn:**

*Quality Rules:*
- `fake-test` - Phát hiện tests không có assertions
- `disabled-feature` - Phát hiện code bị comment out
- `empty-catch` - Phát hiện catch blocks rỗng
- `emoji-code` - Phát hiện emoji trong code

*Security Rules (OWASP Top 10):*
- `sql-injection` - Phát hiện SQL injection (CWE-89)
- `hardcoded-secrets` - Phát hiện API keys, passwords (CWE-798)
- `xss-vulnerability` - Phát hiện XSS risks (CWE-79)
- `command-injection` - Phát hiện OS command injection (CWE-78)
- `path-traversal` - Phát hiện path traversal (CWE-22)

*AI/LLM Security:*
- `prompt-injection` - Phát hiện prompt injection vulnerabilities

**Ví dụ:**
```json
{
  "code": "test('should work', () => { /* nothing */ })",
  "filename": "user.test.ts",
  "strict": true
}
```

#### `guard_check_test` - Kiểm tra test file

Phân tích file test để phát hiện fake tests.

```json
{
  "code": "...",
  "filename": "auth.test.ts"
}
```

#### Các tools khác

| Tool | Mô tả |
|------|-------|
| `guard_rules` | Liệt kê tất cả rules |
| `guard_toggle_rule` | Bật/tắt rule cụ thể |
| `guard_status` | Trạng thái guard module |

---

### 4. Workflow Tools (Quản lý công việc)

Theo dõi tiến độ và quản lý tasks.

#### `workflow_task_create` - Tạo task mới

| Parameter | Required | Mô tả |
|-----------|----------|-------|
| `name` | Yes | Tên task |
| `description` | No | Mô tả chi tiết |
| `priority` | No | `low`, `medium`, `high`, `critical` |
| `parentId` | No | ID của task cha (subtask) |
| `estimatedTokens` | No | Ước tính tokens sử dụng |
| `tags` | No | Tags phân loại |

**Ví dụ:**
```json
{
  "name": "Implement user authentication",
  "description": "Add login/logout with JWT",
  "priority": "high",
  "tags": ["feature", "auth"]
}
```

#### `workflow_task_update` - Cập nhật task

```json
{
  "taskId": "task-123",
  "progress": 50,
  "status": "in_progress"
}
```

**Status values:** `pending`, `in_progress`, `paused`, `blocked`, `completed`, `failed`

#### `workflow_task_note` - Thêm ghi chú

```json
{
  "taskId": "task-123",
  "content": "Cần review lại phần validation",
  "type": "blocker"
}
```

**Note types:** `note`, `decision`, `blocker`, `idea`

#### Các tools khác

| Tool | Mô tả |
|------|-------|
| `workflow_task_start` | Bắt đầu làm task |
| `workflow_task_complete` | Đánh dấu hoàn thành |
| `workflow_task_pause` | Tạm dừng task |
| `workflow_task_fail` | Đánh dấu thất bại |
| `workflow_task_list` | Liệt kê tasks |
| `workflow_current` | Task đang làm |
| `workflow_status` | Tổng quan workflow |

---

### 5. Process Tools (Quản lý tiến trình)

Quản lý ports và processes.

#### `process_check_port` - Kiểm tra port

```json
{
  "port": 3000
}
```

#### `process_kill_on_port` - Kill process trên port

```json
{
  "port": 3000,
  "force": true
}
```

#### `process_spawn` - Khởi chạy process

```json
{
  "command": "npm",
  "args": ["run", "dev"],
  "port": 3000,
  "name": "dev-server",
  "cwd": "/path/to/project"
}
```

#### Các tools khác

| Tool | Mô tả |
|------|-------|
| `process_check_all_ports` | Kiểm tra tất cả ports đã cấu hình |
| `process_kill` | Kill process theo PID |
| `process_list` | Liệt kê processes |
| `process_cleanup` | Dọn dẹp processes của session |
| `process_status` | Trạng thái module |

---

### 6. Resource Tools (Quản lý tài nguyên)

Theo dõi token usage và checkpoints.

#### `resource_status` - Trạng thái tài nguyên

Xem token usage hiện tại và số checkpoints.

#### `resource_estimate_task` - Ước tính task

```json
{
  "description": "Refactor authentication module",
  "filesCount": 5,
  "linesEstimate": 200,
  "hasTests": true,
  "hasBrowserTesting": false
}
```

#### `resource_checkpoint_create` - Tạo checkpoint

```json
{
  "name": "before-refactor",
  "reason": "before_risky_operation"
}
```

**Reasons:** `manual`, `before_risky_operation`, `task_complete`

#### Các tools khác

| Tool | Mô tả |
|------|-------|
| `resource_update_tokens` | Cập nhật token usage |
| `resource_checkpoint_list` | Liệt kê checkpoints |
| `resource_checkpoint_restore` | Khôi phục từ checkpoint |
| `resource_checkpoint_delete` | Xóa checkpoint |

---

### 7. Testing Tools (Testing)

Chạy tests và browser automation.

#### `testing_run` - Chạy tests

```json
{
  "files": ["src/auth/*.test.ts"],
  "grep": "login",
  "coverage": true,
  "timeout": 30
}
```

#### `testing_run_affected` - Chạy tests bị ảnh hưởng

```json
{
  "files": ["src/auth/login.ts", "src/auth/logout.ts"]
}
```

#### Browser Testing Tools

| Tool | Mô tả |
|------|-------|
| `testing_browser_open` | Mở browser session |
| `testing_browser_screenshot` | Chụp screenshot |
| `testing_browser_logs` | Lấy console logs |
| `testing_browser_network` | Lấy network requests |
| `testing_browser_errors` | Lấy errors |
| `testing_browser_close` | Đóng browser session |

**Ví dụ browser workflow:**
```json
// 1. Mở browser
{ "url": "http://localhost:3000" }
// Response: { "sessionId": "session-abc" }

// 2. Chụp screenshot
{ "sessionId": "session-abc", "fullPage": true }

// 3. Xem logs
{ "sessionId": "session-abc" }

// 4. Đóng browser
{ "sessionId": "session-abc" }
```

#### Các tools khác

| Tool | Mô tả |
|------|-------|
| `testing_cleanup` | Dọn dẹp test data |
| `testing_status` | Trạng thái testing module |

---

### 8. Documents Tools (Quản lý tài liệu)

Quản lý và theo dõi tài liệu dự án.

#### `documents_search` - Tìm kiếm tài liệu

```json
{
  "query": "authentication API"
}
```

#### `documents_find_by_type` - Tìm theo loại

```json
{
  "type": "api"
}
```

**Document types:** `readme`, `spec`, `api`, `guide`, `changelog`, `architecture`, `config`, `other`

#### `documents_should_update` - Kiểm tra nên update không

Trước khi tạo tài liệu mới, kiểm tra xem có document nào liên quan cần update không.

```json
{
  "topic": "API Authentication",
  "content": "New auth documentation..."
}
```

#### `documents_create` - Tạo tài liệu mới

```json
{
  "path": "docs/api/auth.md",
  "content": "# Authentication API\n...",
  "type": "api",
  "description": "API authentication documentation",
  "tags": ["api", "auth"]
}
```

#### Các tools khác

| Tool | Mô tả |
|------|-------|
| `documents_update` | Cập nhật tài liệu |
| `documents_register` | Đăng ký document vào registry |
| `documents_scan` | Quét project tìm documents |
| `documents_list` | Liệt kê tất cả documents |
| `documents_status` | Trạng thái module |

---

### 9. Agents Tools (Multi-Agent)

Quản lý hệ thống multi-agent với các specialized agents.

#### `agents_select` - Chọn agent phù hợp

```json
{
  "task": "Implement trading strategy backtest",
  "files": ["strategy.py", "backtest.py"],
  "domain": "trading"
}
```

**Response:** Agent phù hợp nhất với confidence score.

#### `agents_coordinate` - Phối hợp nhiều agents

```json
{
  "task": "Full-stack feature review",
  "agentIds": ["react-agent", "laravel-agent"],
  "mode": "review"
}
```

**Modes:** `sequential`, `parallel`, `review`

#### Các tools khác

| Tool | Mô tả |
|------|-------|
| `agents_list` | Liệt kê tất cả agents |
| `agents_get` | Chi tiết 1 agent |
| `agents_register` | Đăng ký agent mới |
| `agents_reload` | Reload từ AGENTS.md |
| `agents_status` | Trạng thái module |

---

### 10. Latent Chain Mode Tools (Hidden-State Reasoning)

Latent Chain Mode giúp giảm 70-80% token usage bằng cách chỉ gửi delta thay vì full context.

#### Khi nào dùng?

- Task có **2+ bước** trở lên
- Bug fix phức tạp
- Feature mới cần thiết kế
- Refactoring lớn

#### 3 Flow Commands (Quick Start)

| Command | Use Case |
|---------|----------|
| `/latent-fix` | Quick fix 1-2 patches, file đang mở |
| `/latent-feature` | Feature/Refactor nhiều files |
| `/latent-review` | Review/Audit không sửa code |
| `/latent-status` | Quick status check |

#### `latent_context_create` - Tạo context mới

```json
{
  "taskId": "fix-auth-bug",
  "phase": "analysis",
  "constraints": ["No breaking changes", "Must pass tests"],
  "files": ["src/auth/login.ts"]
}
```

#### `latent_context_update` - Update với delta (KEY!)

```json
{
  "taskId": "fix-auth-bug",
  "delta": {
    "codeMap": { "hotSpots": ["src/auth/login.ts:45"] },
    "decisions": [{ "id": "D001", "summary": "Use JWT", "rationale": "Industry standard" }],
    "risks": ["Token expiry handling"]
  }
}
```

**Quan trọng:** Chỉ gửi delta, KHÔNG full context!

#### `latent_phase_transition` - Chuyển phase

```json
{
  "taskId": "fix-auth-bug",
  "toPhase": "plan",
  "summary": "Analysis complete, identified root cause"
}
```

**4 Phases:**
```
🔍 analysis → 📋 plan → 🔧 impl → ✅ review
```

#### `latent_apply_patch` - Apply code changes

```json
{
  "taskId": "fix-auth-bug",
  "target": "src/auth/login.ts",
  "patch": "--- a/src/auth/login.ts\n+++ b/src/auth/login.ts\n@@ -45,3 +45,5 @@..."
}
```

#### `latent_complete_task` - Hoàn thành task

```json
{
  "taskId": "fix-auth-bug",
  "summary": "Fixed token expiry bug"
}
```

#### Các tools khác

| Tool | Mô tả |
|------|-------|
| `latent_context_get` | Xem context hiện tại |
| `latent_validate_response` | Validate LatentResponse format |
| `latent_list_contexts` | Liệt kê tất cả contexts |
| `latent_delete_context` | Xóa context |
| `latent_status` | Trạng thái module |

---

## Recommended Workflows

### Workflow 1: Bắt đầu session mới

```
1. session_init          -> Load memory, check processes
2. workflow_task_list    -> Xem tasks còn dang dở
3. memory_recall         -> Nhớ lại context quan trọng
```

### Workflow 2: Làm feature mới

```
1. workflow_task_create  -> Tạo task cho feature
2. workflow_task_start   -> Bắt đầu task
3. resource_checkpoint_create -> Checkpoint trước khi code
4. ... code ...
5. guard_validate        -> Kiểm tra code
6. testing_run           -> Chạy tests
7. workflow_task_complete -> Hoàn thành task
8. memory_store          -> Lưu decisions quan trọng
```

### Workflow 3: Debug UI issues

```
1. testing_browser_open  -> Mở browser
2. testing_browser_logs  -> Xem console errors
3. testing_browser_screenshot -> Chụp UI
4. testing_browser_network -> Xem network requests
5. ... fix issues ...
6. testing_browser_close -> Đóng browser
```

### Workflow 4: Kết thúc session

```
1. workflow_task_pause   -> Pause task đang làm (nếu có)
2. memory_store          -> Lưu context quan trọng
3. session_end           -> Save all và cleanup
```

### Workflow 5: Latent Mode cho complex tasks

```
1. latent_context_create -> Tạo context với constraints
2. [analysis phase]      -> Xác định hot spots, decisions
3. latent_context_update -> Update delta (chỉ thay đổi!)
4. latent_phase_transition -> Chuyển sang plan
5. [plan phase]          -> Lên kế hoạch patches
6. latent_phase_transition -> Chuyển sang impl
7. latent_apply_patch    -> Apply từng patch
8. latent_phase_transition -> Chuyển sang review
9. guard_validate        -> Kiểm tra code
10. testing_run          -> Chạy tests
11. latent_complete_task -> Hoàn thành
```

**Hoặc dùng Quick Commands:**
```
/latent-fix              -> Quick fix file đang mở
/latent-feature "..."    -> Feature mới
/latent-review           -> Review code
```

---

## Best Practices

### Memory

- **DO:** Lưu decisions quan trọng với importance >= 7
- **DO:** Sử dụng tags nhất quán
- **DON'T:** Lưu code thực tế (chỉ lưu patterns/snippets nhỏ)

### Guard

- **DO:** Chạy `guard_validate` trước mỗi commit
- **DO:** Fix tất cả blocking issues
- **DON'T:** Disable rules chỉ để bỏ qua warnings

### Workflow

- **DO:** Tạo task cho mỗi feature/bug
- **DO:** Update progress thường xuyên
- **DO:** Add notes cho blockers và decisions

### Testing

- **DO:** Chạy affected tests sau mỗi thay đổi
- **DO:** Cleanup browser sessions sau khi dùng
- **DON'T:** Để browser sessions mở quá lâu

### Resource

- **DO:** Tạo checkpoint trước risky operations
- **DO:** Monitor token usage
- **DON'T:** Ignore high token warnings

### Latent Mode

- **DO:** Luôn dùng cho task 2+ bước
- **DO:** Gửi delta only, không full context
- **DO:** Track decisions với IDs (D001, D002...)
- **DO:** Dùng phase icons trong output (🔍📋🔧✅)
- **DON'T:** Viết essay giải thích dài
- **DON'T:** Skip phase transitions
- **DON'T:** Paste code trực tiếp, dùng apply_patch

---

## Troubleshooting

### Memory không load

```
1. Kiểm tra file .ccg/memory.db có tồn tại
2. Chạy session_init lại
```

### Port bị chiếm

```
1. process_check_port { "port": 3000 }
2. process_kill_on_port { "port": 3000, "force": true }
```

### Tests fail không rõ lý do

```
1. testing_run với coverage để xem coverage
2. testing_browser_open để test manual
3. testing_browser_logs để xem console errors
```

### Guard block code

```
1. Đọc kỹ error message
2. guard_rules để xem rules đang active
3. Fix issues thay vì disable rules
```
