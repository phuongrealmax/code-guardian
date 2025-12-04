1. Để Claude “đọc tài liệu và hiểu luật chơi” mỗi project

Bạn đã có đủ module cho chuyện này:

Documents Module – scan & phân loại docs (spec, guide, config, architecture…) 

PROJECT_DOCUMENTATION

Thinking Module – thinking models + workflows + code style RAG 

PROJECT_DOCUMENTATION

Memory Module – lưu quyết định, lỗi, convention, architecture theo domain (ERP, trading, API…) 

PROJECT_DOCUMENTATION

Cách dùng thực tế trong Claude Code (bạn nói, Claude làm):

Lần đầu mở project trong VS Code, bạn nói đại ý:

“Đọc toàn bộ tài liệu project, bật Thinking module & set workflow ưa dùng, rồi tóm tắt quy tắc cho mình.”

Claude nên tự gọi chuỗi tool kiểu:

documents_scan → quét repo, tự gắn type readme, spec, api, architecture, config, v.v. 

PROJECT_DOCUMENTATION

documents_find_by_type → lấy đúng những file quan trọng (spec, architecture, guide) cho nhiệm vụ hiện tại.

thinking_suggest_workflow → chọn workflow phù hợp, ví dụ:

feature-development khi thêm tính năng

bug-fix khi sửa lỗi

code-review / security-audit khi review 

PROJECT_DOCUMENTATION

thinking_get_style → lấy snippet code style chuẩn của project (React, Laravel, Node, v.v.) để Claude không viết lệch style. 

PROJECT_DOCUMENTATION

memory_store với type convention / architecture cho các rule quan trọng (ví dụ “mọi endpoint phải có test”, “không dùng innerHTML”, “stop loss bắt buộc”…). 

PROJECT_DOCUMENTATION

➡️ Kết quả: sau 1–2 lệnh đầu session, Claude đã có:

latent + memory về: kiến trúc, rules, phong cách code

workflow “mặc định” cho phiên làm việc (VD bug-fix workflow)

Từ đó trở đi, bạn chỉ cần nói mục tiêu, không phải nhắc lại guideline.

2. Để Claude tự chia việc & tự chạy latent chain + test

Ở đây bạn đã có combo:

Workflow Module → tạo task, theo dõi state (pending → in_progress → completed/failed) 

PROJECT_DOCUMENTATION

Latent Module → 4 phase (analysis → plan → impl → review) + context delta + 3 flow /latent-fix, /latent-feature, /latent-review 

PROJECT_DOCUMENTATION

Testing Module → testing_run, testing_run_affected, và browser automation nếu cần 

PROJECT_DOCUMENTATION

Guard Module → catch fake test, empty catch, disabled feature, OWASP rules… 

PROJECT_DOCUMENTATION

Hooks → auto nối Workflow ↔ Latent ↔ tools quan trọng (guard, testing) 

PROJECT_DOCUMENTATION

2.1. Kịch bản A – Sửa một bug trong file đang mở

Bạn chỉ cần:

“Bug ở file này, sửa giúp mình cho chạy đúng và có test.”

Claude nên làm (dựa vào doc của bạn):

Gọi Flow A: /latent-fix (đã define trong doc là quick fix 1–2 patch cho file đang mở). 

PROJECT_DOCUMENTATION

Hooks lo:

workflow_task_create + workflow_task_start

auto latent_context_create (phase analysis) cho task đó

Claude đọc file + context → trả LatentResponse:

summary 1–2 câu

contextDelta (hotSpots, decisions, risks)

actions rỗng hoặc list patch dự kiến 

PROJECT_DOCUMENTATION

Gọi latent_context_update → merge delta vào .ccg/latent-contexts.json. 

PROJECT_DOCUMENTATION

Chuyển phase:

latent_phase_transition → plan → Claude liệt kê patch cần làm

latent_phase_transition → impl → Claude dùng latent_apply_patch để sửa file (patch unified diff). 

PROJECT_DOCUMENTATION

Sau mỗi patch:

guard_validate file đó (fake-test, empty-catch, OWASP…)

testing_run_affected → chạy test liên quan. 

PROJECT_DOCUMENTATION

Nếu test fail → Claude quay lại impl, đọc log lỗi và sửa patch (vẫn qua latent_apply_patch).

Khi tất cả pass → latent_phase_transition → review + latent_complete_task + workflow_task_complete. 

PROJECT_DOCUMENTATION

Đối với bạn trong VS Code:
Bạn chỉ thấy output human-friendly với icon phase:

🔍 [analysis] …

📋 [plan] …

🔧 [impl] …

✅ [review] …

(đã định nghĩa ở phần Latent UX). 

PROJECT_DOCUMENTATION

2.2. Kịch bản B – Thêm/refactor tính năng nhiều file

Bạn nói:

“Refactor lại auth cho sạch, không phá API cũ, thêm test đầy đủ.”

Claude nên tự:

Gọi Flow B: /latent-feature "Refactor auth" --constraints "No breaking changes" 

PROJECT_DOCUMENTATION

Hooks:

workflow_task_create (tag auth, priority high)

auto latent_context_create (phase analysis, liệt kê src/auth/... trong codeMap.files)

Giai đoạn analysis:

đọc spec/api/architecture qua documents_find_by_type

dùng thinking_suggest_workflow('feature-development') để lấy SOP chi tiết (design → coding → test → docs…) 

PROJECT_DOCUMENTATION

update latent context: constraints, risks, decisions, hotSpots

plan:

Claude tạo list subtask ngay trong AgentLatentContext.artifacts (patches, files)

có thể ghi note vào workflow_task_note nếu cần human đọc. 

PROJECT_DOCUMENTATION

impl:

đi từng patch: latent_apply_patch cho từng file

mỗi patch xong → guard_validate + testing_run_affected

nếu risk cao (touch auth, tiền…) → dùng thêm thinking_get_workflow('security-audit') + guard rule security. 

PROJECT_DOCUMENTATION

review:

summary thay đổi

list decisions cuối cùng (D001, D002…) trong latent context

update memory_store:

type decision – các quyết định kiến trúc / quy ước quan trọng

type code_pattern – snippet refactor chuẩn

type error – các lỗi đã tránh/sửa trong quá trình. 

PROJECT_DOCUMENTATION

2.3. Kịch bản C – Chỉ review / audit (không sửa code)

Bạn nói:

“Review giúp folder src/api/v1 xem có vấn đề security hoặc fake test không.”

Claude sẽ:

Gọi Flow C: /latent-review src/api/v1 

PROJECT_DOCUMENTATION

latent_context_create (analysis) + guard_validate toàn vùng đó.

Dùng thinking_get_workflow('security-audit') để follow checklist. 

PROJECT_DOCUMENTATION

Output cuối: chỉ 🔍 + 📋 + ✅, không patch; tập trung vào:

danh sách hotSpots

issue guard bắt được

đề xuất test/doc cần bổ sung

3. Để Claude “tự học từ lỗi” và không lặp lại

Ở đây ta chơi combo:

Memory Module (type error, decision, code_pattern) 

PROJECT_DOCUMENTATION

Guard Module – rule về fake test, empty catch, disabled-feature, security…

Latent Module – decisions, risks, artifacts.patches được lưu theo task trong latent-contexts.json. 

PROJECT_DOCUMENTATION

3.1. Khi sửa một lỗi cụ thể

Trong Flow A/B, sau khi fix xong 1 bug:

Claude nên gọi memory_store:

type: 'error'

content: mô tả bug, nguyên nhân, patch đã áp dụng, file liên quan

tags: auth, sql-injection, fake-test, v.v. 

PROJECT_DOCUMENTATION

Đồng thời, tạo decision trong latent context:

id: "E123" (hoặc Dxxx)

summary: "Không cho phép innerHTML với dữ liệu user"

rationale: "XSS risk, rule OWASP" 

PROJECT_DOCUMENTATION

3.2. Khi lần sau đụng vào vùng tương tự

Ngay đầu phase analysis của task mới, Claude nên:

Gọi memory_recall với:

tags theo domain (vd: auth, trading, sql, api)

giới hạn top N memories liên quan. 

PROJECT_DOCUMENTATION

Merge các “bài học cũ” vào AgentLatentContext.constraints / risks:

“Tránh pattern X từng gây lỗi Y”

“Luôn thêm test loại Z khi sửa module này”

→ Claude được “tiêm” kinh nghiệm trước khi viết code.

3.3. Guard chặn lại nếu Claude “quên bài”

Giả sử Claude lỡ viết lại 1 pattern xấu:

Test giả (không assert) → fake-test rule

innerHTML = userInput → xss-vulnerability

catch rỗng → empty-catch

comment tắt 1 đoạn logic → disabled-feature 

PROJECT_DOCUMENTATION

guard_validate sẽ trả blocked: true + issues, và Claude:

Không được commit patch đó

Phải sửa đến khi pass guard

Đây chính là “hàng rào cứng” để đảm bảo không lặp lại sai lầm kiểu cũ.

4. Tóm lại: Ứng dụng thực tế vào dự án hiện tại

Với CCG v1.3.0, để đạt đúng mục tiêu bạn nói:

“Claude code chỉ cần đọc tài liệu, tự phân việc để làm, tự test, tự cải tiến để không gặp lỗi tương tự”

Bạn cần:

Trong project:

Bật các module: memory, guard, workflow, testing, documents, latent, thinking trong .ccg/config.json. 

PROJECT_DOCUMENTATION

Chạy MCP server claude-code-guardian qua .mcp.json. 

PROJECT_DOCUMENTATION

Trong CLAUDE.md / PROJECT instructions:

Bắt buộc:

Mọi task nhiều bước → dùng /latent-fix, /latent-feature, /latent-review.

Sau khi sửa bug → lưu vào memory_store type error + decision.

Trước khi sửa vùng code quan trọng → memory_recall + thinking_suggest_workflow.

Luôn guard_validate + testing_run sau patch.

Trong thực tế VS Code:

Đầu buổi: yêu cầu Claude scan docs + chọn workflow.

Khi làm: chỉ cần nói “sửa bug này”, “thêm feature này”, “review folder này” → để Claude tự chơi 3 Flow latent + guard + testing.

Cuối cùng: để Claude tổng hợp “lessons learned” vào Memory.