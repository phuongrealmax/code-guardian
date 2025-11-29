# CLAUDE CODE GUARDIAN - TESTING STRATEGY

Tài liệu này quy định cách thức kiểm thử dự án CCG để đảm bảo tính ổn định và an toàn.

## 1. PHẠM VI KIỂM THỬ (SCOPE)

Chúng ta sẽ kiểm thử trên 3 cấp độ:
1.  **Unit Testing:** Kiểm tra logic của từng function/class riêng lẻ (đặc biệt là Guard Rules và Utils).
2.  **Integration Testing (via CLI):** Kiểm tra sự phối hợp giữa các module thông qua CLI.
3.  **User Acceptance Testing (UAT):** Kiểm thử thực tế trong môi trường Claude Code.

---

## 2. UNIT TEST STATUS

### Test Files Created
| File | Tests | Status |
| :--- | :--- | :--- |
| `tests/unit/guard.test.ts` | 16 tests | :white_check_mark: PASSED |
| `tests/unit/utils.test.ts` | 48 tests | :white_check_mark: PASSED |
| `tests/unit/config.test.ts` | 23 tests | :white_check_mark: PASSED |
| **Total** | **87 tests** | :white_check_mark: **ALL PASSED** |

### Test Coverage
- GuardService: EmptyCatchRule, FakeTestRule, EmojiCodeRule
- TokenEstimator: estimateTokens, estimateCodeTokens, estimateTaskComplexity
- StringUtils: toCamelCase, toKebabCase, toSnakeCase, truncate, pluralize, etc.
- ConfigManager: load, save, get/set, validate, watch, export/import

---

## 3. TEST CHECKLIST (MANUAL & CLI)

Sử dụng lệnh `ccg hook` hoặc các công cụ MCP Inspector để kiểm thử các kịch bản sau.

### A. Module: GUARD (Bảo vệ)

| ID | Kịch bản | Hành động / Lệnh CLI | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **G-01** | Chặn Empty Catch | Tạo file có `try { } catch (e) {}` | Hook trả về issues với rule "empty-catch" | :white_check_mark: |
| **G-02** | Chặn Fake Test | Tạo file test không có `expect()` | Hook trả về `blocked: true`, cảnh báo "no assertions" | :white_check_mark: |
| **G-03** | Chặn Emoji | Tạo file code chứa emoji | Hook trả về warning với rule "emoji-code" | :white_check_mark: |
| **G-04** | Chặn Disabled Code | Code chứa `if (false)` hoặc comment code | Hook trả về warning (disabled-feature rule) | :white_large_square: |

### B. Module: MEMORY (Bộ nhớ)

| ID | Kịch bản | Hành động / Lệnh CLI | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **M-01** | Lưu ký ức | Gọi tool `memory_store` | Ký ức được lưu vào SQLite, trả về ID | :white_large_square: |
| **M-02** | Tìm kiếm ký ức | Gọi tool `memory_recall` | Trả về ký ức vừa lưu với độ tương đồng cao | :white_large_square: |
| **M-03** | Quên ký ức | Gọi tool `memory_forget` | Ký ức bị xóa khỏi DB | :white_large_square: |

### C. Module: PROCESS (Quản lý Process)

| ID | Kịch bản | Hành động / Lệnh CLI | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **P-01** | Check Port trống | Gọi tool `check_port` (port 3000) | Trả về `available: true` (nếu chưa chạy gì) | :white_large_square: |
| **P-02** | Phát hiện Port | Chạy server ở port 3000, gọi lại tool | Trả về `available: false`, hiển thị PID | :white_large_square: |
| **P-03** | Kill Process | Gọi tool `kill_process` | Process bị tắt, port được giải phóng | :white_large_square: |

### D. Module: WORKFLOW (Quy trình)

| ID | Kịch bản | Hành động / Lệnh CLI | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **W-01** | Tạo Task | Gọi tool `task_create` | File JSON task được tạo trong `.ccg/tasks/` | :white_large_square: |
| **W-02** | Update Task | Gọi tool `task_update` (progress 50%) | File JSON task được cập nhật progress | :white_large_square: |
| **W-03** | Hoàn thành Task | Gọi tool `task_complete` | Trạng thái task chuyển sang `completed` | :white_large_square: |

### E. Module: RESOURCE & CHECKPOINT

| ID | Kịch bản | Hành động / Lệnh CLI | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **R-01** | Tạo Checkpoint | Gọi tool `checkpoint_create` | File backup được tạo trong `.ccg/checkpoints/` | :white_large_square: |
| **R-02** | Cảnh báo Token | Giả lập token usage > 85% | Hệ thống cảnh báo hoặc tự động tạo checkpoint | :white_large_square: |

---

## 4. LỆNH CHẠY TEST TỰ ĐỘNG

```bash
# Cài đặt dependencies
npm install

# Chạy toàn bộ unit test
npm test

# Chạy test một lần (không watch)
npm test -- --run

# Chạy test coverage
npm run test:coverage
```

---

## 5. IMPLEMENTATION NOTES

### Guard Module Tests (`tests/unit/guard.test.ts`)
- EmptyCatchRule: Detects empty catch blocks, allows blocks with error handling
- FakeTestRule: Detects tests without assertions, blocks in strict mode
- EmojiCodeRule: Warns about emoji in strings/code, skips markdown files
- Rule Management: Enable/disable rules, list rules, get status

### Utils Tests (`tests/unit/utils.test.ts`)
- TokenEstimator: Simple and code token estimation, task complexity analysis
- StringUtils: Case conversions (camel, pascal, kebab, snake), truncate, pluralize, formatDuration, formatBytes

### Config Tests (`tests/unit/config.test.ts`)
- Load/Save: Default config, user config merge, nested defaults preservation
- Get/Set: Path-based access, nested path creation
- Validation: Threshold order validation, required fields
- Watch: Config change callbacks, unsubscribe

---

## 6. KNOWN ISSUES

1. **ConfigManager.reset()** uses shallow copy - nested objects are not deeply cloned
2. **DEFAULT_CONFIG** is a shared object - tests that mutate it can affect other tests

---

*Last updated: 2025-11-29*
*Test run: 87/87 passed*
