# Project Instructions for Claude

This project uses **Claude Code Guardian (CCG)** for enhanced development assistance.

## CCG Features

- **Memory** - I remember context between sessions
- **Guard** - Code validation and protection
- **Tasks** - Progress tracking and checkpoints
- **Testing** - Automated test running and browser checks
- **Process** - Port and process management
- **Documents** - Document registry and management
- **Latent Chain Mode** - Token-efficient hidden-state reasoning (70-80% token savings)

## How to Work With CCG

### Starting a Session
When you start working, CCG automatically:
1. Loads previous memory and context
2. Resumes any in-progress tasks
3. Checks for running processes

### Working on Tasks
1. Start a task: `/ccg task start "task name"`
2. I'll track progress, files modified, and decisions
3. Complete with: `/ccg task done`

### Memory
- I'll remember important decisions automatically
- You can ask me to remember: "Remember that we're using PostgreSQL"
- I'll recall relevant context when needed

### Guard Protection
I'll automatically check code for:
- Tests without assertions
- Disabled features
- Empty catch blocks
- Emoji in code
- Swallowed exceptions

If I detect issues, I'll warn or block depending on severity.

### Testing
- I can run tests after changes
- For UI work, I can open a browser and check for errors
- Use `/ccg test browser <url>` for visual testing

### Checkpoints
- Checkpoints are created automatically at token thresholds
- Manual checkpoint: `/ccg checkpoint`
- Restore if needed: `/ccg checkpoint restore <id>`

### Latent Chain Mode

For tasks with **2+ steps**, use Latent Chain Mode for massive token savings (70-80%).

#### MANDATORY RULES

> **Mọi task từ 2 bước trở lên → PHẢI dùng Latent Flow**
> **Nếu user không yêu cầu giải thích → max 2 câu summary**

#### 3 Flows (Quick Commands)

| Flow | Command | Use Case |
|------|---------|----------|
| **A** | `/latent-fix` | Quick fix 1-2 patches, file đang mở |
| **B** | `/latent-feature` | Feature/Refactor nhiều files |
| **C** | `/latent-review` | Review/Audit không sửa code |

**Status check:** `/latent-status`

#### Workflow (4 Phases)

```
ANALYSIS ──► PLAN ──► IMPL ──► REVIEW
   🔍          📋        🔧        ✅
```

1. **Start task**: Call `latent_context_create` with taskId, constraints, files
2. **Think structured**: Output với format chuẩn (xem bên dưới)
3. **Update context**: Call `latent_context_update` with delta ONLY
4. **Transition phases**: Call `latent_phase_transition` when phase complete
5. **Apply changes**: Call `latent_apply_patch` in impl phase
6. **Complete**: Call `latent_complete_task`

#### Output Format (Human-Readable)

**TRONG EDITOR, output như sau (KHÔNG phải JSON):**

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

#### LatentResponse JSON (cho context update)

```json
{
  "summary": "Brief 1-2 sentence (max 200 chars)",
  "contextDelta": {
    "codeMap": { "hotSpots": ["file:line"] },
    "decisions": [{ "id": "D001", "summary": "...", "rationale": "..." }],
    "risks": ["identified risk"]
  },
  "actions": [
    { "type": "edit_file", "target": "src/file.ts", "description": "..." }
  ]
}
```

#### Strict Rules
- Summary **max 2 câu** (200 chars) - NO essays
- **Send delta only** - never repeat full context
- **Decision IDs** - D001, D002 for tracking
- **Always complete** - don't leave contexts hanging
- **Phase icons**: 🔍 analysis, 📋 plan, 🔧 impl, ✅ review

## Slash Commands

| Command | Description |
|---------|-------------|
| `/ccg` | Show dashboard |
| `/ccg status` | Detailed status |
| `/ccg task` | Task management |
| `/ccg memory` | Memory management |
| `/ccg test` | Testing |
| `/ccg process` | Process management |
| `/ccg checkpoint` | Checkpoint management |
| `/ccg docs` | Document management |
| `/ccg latent` | Latent Chain Mode |
| `/latent-fix` | **Flow A**: Quick fix file đang mở |
| `/latent-feature` | **Flow B**: Feature/Refactor nhiều files |
| `/latent-review` | **Flow C**: Review/Audit code |
| `/latent-status` | Quick latent status check |

## Project Conventions

<!-- Customize these for your project -->

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Tests: `*.test.ts` or `*.spec.ts`

### Code Style
- Variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

### No Emoji in Code
Emoji can cause encoding issues. Use text descriptions instead.

## Important Project Context

<!-- Add project-specific context here -->

### Architecture
- [Describe your architecture]

### Key Decisions
- [List important decisions]

### Common Tasks
- [List common development tasks]

## 8. Tool-First & MCP-Only Mode (BẮT BUỘC)

Trong project này, Claude phải tuân thủ các nguyên tắc sau:

### 8.1 MỌI hành động liên quan tới:

- Phân tích nhiệm vụ (analysis)
- Lập kế hoạch (plan)
- Sửa code (impl)
- Chạy test
- Chạy guard
- Cập nhật memory / latent context

**ĐỀU PHẢI được phản ánh thông qua MCP tools của CCG.**

### 8.2 Claude KHÔNG ĐƯỢC:

- Sửa code trực tiếp trong editor mà KHÔNG thông qua `latent_apply_patch`
- Tự nghĩ xong rồi chỉ nói "đã sửa" mà không có bất kỳ MCP call nào
- Bỏ qua `guard_validate` / `testing_run` khi patch code

### 8.3 Nếu một bước chỉ là giải thích cho người dùng:

- Được phép trả lời text
- Nhưng mọi thay đổi thực sự (code, config, docs, test) phải được thực hiện qua MCP

### 8.4 Nếu vì bất kỳ lý do gì Claude đã sửa trực tiếp mà không dùng MCP:

Claude phải ngay lập tức:

1. Tóm tắt thay đổi
2. Dùng `latent_apply_patch` để "sync lại" diff vào MCP context
3. Chạy `guard_validate` + `testing_run_affected`

### 8.5 Logging Reasoning Steps (Observer Pattern)

Trước / sau mỗi cụm thay đổi lớn (nhiều file, refactor, quyết định kiến trúc):

- Claude **PHẢI** gọi `latent_step_log` để CCG có thể log đầy đủ tiến trình
- Kể cả khi step đó không sửa code, MCP vẫn biết "Phase này Claude vừa quyết định cái gì"

### 8.6 Mandatory MCP Flow

| Action | Required MCP Call(s) |
|--------|---------------------|
| Bắt đầu task ≥2 bước | `latent_context_create` |
| Mỗi bước reasoning | `latent_step_log` hoặc `latent_context_update` |
| Chuyển phase | `latent_phase_transition` |
| Sửa code | `latent_apply_patch` |
| Sau mỗi patch | `guard_validate` + `testing_run_affected` |
| Hoàn thành task | `latent_complete_task` |

---

## Getting Help

- `/ccg help` - General help
- `/ccg help <module>` - Module-specific help
- Ask me directly about any CCG feature

---

*This file helps Claude understand how to work with your project and CCG.*
