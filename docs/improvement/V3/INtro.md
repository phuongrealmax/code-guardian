0. Đặt mục tiêu: “CCG v3.0” mạnh hơn gì?

Định nghĩa rõ “vượt trội hơn”:

Code logic dự án lớn

Biết chia task lớn thành graph nhiều subtask.

Giữ được state / context qua nhiều vòng tool-calls.

Không bị lạc logic khi dự án phức tạp.

Xử lý lỗi “thật sự” tốt

Không chỉ parse error message, mà có loop: reproduce → patch → test → rollback.

Học từ lỗi cũ (ErrorMemory) và tái sử dụng fix pattern.

Hiểu được toàn bộ project

Có index semantic cho code + docs, giống RAG nội bộ.

Query kiểu: “tìm nơi nào xử lý payment + retry logic + logging”.

Quan sát được (observability)

Biết task nào fail, tại sao fail, tốn bao nhiêu tokens, chạy mấy vòng fix.

Dựa trên đó, mình cải tiến từ lõi CCG đang có: Memory / Guard / Latent / Thinking / AutoAgent / Workflow… 

PROJECT_DOCUMENTATION

1. Nâng AutoAgent lên “Planner” thực thụ (AutoAgent 2.0)

Hiện AutoAgent đã có:

TaskDecomposer (phân rã),

ToolRouter,

AutoFixLoop,

ErrorMemory. 

PROJECT_DOCUMENTATION

1.1. Thêm “Task Graph” thay vì list subtasks

Hiện decomposeTask chủ yếu trả về list subtasks có dependsOn. Hãy nâng cấp thành Directed Acyclic Graph (DAG):

interface AutoAgentTaskNode {
  id: string;
  name: string;
  phase: 'analysis' | 'plan' | 'impl' | 'test' | 'review';
  estimateTokens?: number;
  estimateTimeMinutes?: number;
  dependsOn: string[];
  toolsHint?: string[];
}

interface AutoAgentTaskGraph {
  taskId: string;
  nodes: AutoAgentTaskNode[];
}


Viết thêm module: auto-agent/task-graph.ts để:

Topo sort,

Detect cycle,

Biết node nào ready để chạy.

1.2. Auto-execute graph + checkpoint

Dùng sẵn Workflow + Resource (checkpoint) của CCG:

Mỗi node trong graph → 1 workflow task con.

Sau mỗi node quan trọng → tạo checkpoint với resource_checkpoint_create. 

PROJECT_DOCUMENTATION

Thêm MCP tool mới:

auto_run_graph – Auto chạy từng node:

Attach latent context

Gọi các tool phù hợp

Nếu fail → hợp tác với auto_fix_loop → thử sửa → nếu vẫn fail → đánh dấu graph partial_failed.

2. “CCG-RAG” – Module RAG cho code & docs

Hiện CCG có Documents module + Memory module, nhưng chưa có semantic index / vector search. 

PROJECT_DOCUMENTATION

2.1. Thêm module mới: modules/rag/

Chức năng:

Crawl:

Code (ts, js, py, php, etc.)

Docs (md, txt, rst)

Chunk theo logic:

đối với code → theo function/class

đối với docs → theo heading.

Tạo embedding:

Gọi external embedding API (OpenAI, Claude, DeepSeek… tuỳ em)

Lưu vào file .ccg/rag-index.json hoặc SQLite.

Interface gợi ý:

interface RAGChunk {
  id: string;
  filePath: string;
  kind: 'code' | 'doc';
  symbol?: string;      // function/class name
  heading?: string;     // for docs
  content: string;
  embedding: number[];
}

interface RAGQueryResult {
  chunk: RAGChunk;
  score: number;
}


Thêm tools MCP:

rag_build_index – scan project, build index.

rag_query – query theo natural language + optional filters (file, domain).

rag_related_code – nhận vào file + line → trả về các nơi có logic tương tự.

2.2. Tích hợp với Latent & Thinking

Trong analysis phase của Latent:

Auto gọi rag_query theo task description để tìm hot spots thêm. 

PROJECT_DOCUMENTATION

Trong Thinking module:

Khi chọn model/workflow, dùng kết quả RAG để “biết repo này pattern như thế nào”.

=> CCG lúc này sẽ hiểu project tốt hơn cả Autogen & LangGraph RAG mặc định.

3. Runtime Sandbox: chạy code, test, đo lỗi thật

Testing module hiện có test runner + browser automation. 

PROJECT_DOCUMENTATION

3.1. Thêm “Sandbox Executor” module

Mục tiêu:

Cho phép AutoAgent/Latent thực sự chạy code (unit test, lệnh nhỏ) trong môi trường isolation.

Module mới: modules/executor/:

interface ExecRequest {
  command: string;      // "npm test", "pytest tests/test_user.py"
  cwd?: string;
  timeoutMs?: number;
  env?: Record<string,string>;
}

interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}


Tools MCP:

executor_run (generic)

executor_run_safe (whitelist lệnh: test, lint, build…)

3.2. Gắn với AutoFixLoop

Hiện AutoFixLoop dựa trên parsing error message. 

PROJECT_DOCUMENTATION


Nâng cấp:

Mỗi lần patch xong:

Gọi executor_run_safe với npm test hoặc command user cấu hình.

Nếu test fail:

Lưu stdout/stderr vào ErrorMemory.

Giải nghĩa error → tạo patch mới → chạy lại.

Nếu fail vượt maxRetries:

Gọi resource_checkpoint_restore để rollback. 

PROJECT_DOCUMENTATION

==> Lúc này CCG không chỉ “đoán fix” mà thực sự chạy test + rollback → chất lượng xử lý lỗi nhảy vọt.

4. Orchestrator: multi-agent & multi-task “thật”

Agents module hiện chỉ chọn agent + điều phối cơ bản. 

PROJECT_DOCUMENTATION

4.1. Thêm “AgentOrchestrator” trên nền Agents + Workflow

Ý tưởng:

Một Feature lớn → Workflow task cha.

Mỗi bước (frontend, backend, infra, test) → assign cho agent tương ứng qua agents_select. 

PROJECT_DOCUMENTATION

Orchestrator:

Tạo subtask, gán agent, track status.

Dùng Latent context riêng cho từng agent, nhưng liên kết bằng taskId gốc.

Thêm file:

modules/agents/agent-orchestrator.ts

Thêm tool:

agents_orchestrate_feature:

Input: feature description + affected domains (frontend/backend/api/test).

Output: plan gồm nhiều subtasks + mapping agent.

4.2. Hỗ trợ “parallel execution”

Khi có nhiều subtasks không phụ thuộc nhau:

Cho phép chạy song song (theo level MCP client).

Orchestrator giữ state & merge kết quả.

==> Như vậy CCG tiệm cận Autogen 2.0 / LangGraph về multi-agent workflow nhưng vẫn giữ lợi thế Guard + Latent + AutoAgent.

5. Observability & Dashboard: biến Audit + Resource thành “dev console”

CCG đã có AuditLogger, Resource Module (tokens + checkpoints), Workflow (tasks). 

PROJECT_DOCUMENTATION

5.1. Thêm “Metrics & Telemetry” layer

Tao module mới modules/metrics/:

Lưu:

Token sử dụng per task

Thời gian chạy từng node (AutoAgent graph)

Số lần retry, tỉ lệ fix thành công (AutoFixLoop)

Số lần Guard chặn / cảnh báo

Interface đơn giản:

interface MetricEvent {
  timestamp: string;
  category: 'autoAgent' | 'latent' | 'guard' | 'testing' | 'process';
  name: string;
  value: number;
  tags?: Record<string,string>;
}


Ghi vào .ccg/metrics.json (hoặc SQLite).

5.2. Thêm “/ccg dashboard” command

Tool MCP: metrics_summary

Slash command:

/ccg dashboard → trả về:

Top 5 lỗi lặp lại nhiều nhất

Tỉ lệ fix thành công AutoFixLoop

Tokens/tác vụ trung bình

Số task hoàn thành / fail tuần này

Đây là điểm nhiều kit khác không có (Onyx, Autogen không cho dev một “error intelligence” rõ ràng như vậy).

6. Latent++: unify Latent + Thinking + AutoAgent thành 1 pipeline

Hiện 3 module này đã có đầy đủ:

Latent: phase-based, context delta, patch actions.

Thinking: thinking models, workflows, code-style RAG.

AutoAgent: decomposition, routing, fix loop. 

PROJECT_DOCUMENTATION

6.1. Định nghĩa “Standard Pipeline”

Cho mỗi /latent-feature hoặc /ccg auto decompose:

Thinking chọn “model + workflow” phù hợp (vd: decomposition + feature-development).

AutoAgent dùng workflow đó để tạo TaskGraph.

Latent tạo context & quản lý phases (analysis → plan → impl → review).

RAG (module mới) support analysis & plan bằng việc tìm code/doc liên quan.

Executor + Testing + Guard lo phần impl & review.

Viết 1 file orchestrator: modules/pipelines/feature-pipeline.ts chứa logic:

export async function runFeaturePipeline(input: FeatureRequest) {
  // 1. thinking_suggest_model + thinking_suggest_workflow
  // 2. auto_decompose_task -> TaskGraph
  // 3. latent_context_create
  // 4. rag_query hỗ trợ analysis
  // 5. auto_run_graph + executor_run_safe + guard_validate
  // 6. metrics + audit log
}


==> Về mặt kiến trúc, đây chính là Agent OS Pipeline mà Antigravity/Autogen làm – nhưng em build trên nền CCG.

7. Lộ trình thực tế (Roadmap để em làm dần)
Phase 1 – “Deep Brain”

 Module RAG (code + docs) + tools rag_build_index, rag_query.

 Hook RAG vào Latent (analysis) & Thinking (model/workflow suggestion).

Phase 2 – “Agent Planner”

 Nâng AutoAgent thành TaskGraph (DAG) + auto_run_graph.

 Tích hợp với Workflow + Resource (checkpoint).

Phase 3 – “Runtime & Fix”

 Module Executor/Sandbox + executor_run_safe.

 Nâng AutoFixLoop: chạy test thực, rollback checkpoint, log vào ErrorMemory.

Phase 4 – “Orchestrator & Metrics”

 AgentOrchestrator: orchestrate nhiều agents theo feature.

 Metrics module + metrics_summary + /ccg dashboard.

Phase 5 – “Unified Pipeline”

 Tạo feature-pipeline.ts: pipeline chuẩn nối Thinking + AutoAgent + Latent + RAG + Executor + Guard + Metrics.