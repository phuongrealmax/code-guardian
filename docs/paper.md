# 📘 HƯỚNG DẪN CHO CLAUDE

# **"LATENT CHAIN MODE" – PHONG CÁCH PAPER STANFORD/PRINCETON/UIUC**

# (Tài liệu chính thức dùng trong dự án của Mona)

Tài liệu này mô tả **cách Claude phải suy nghĩ, giao tiếp và phối hợp với các MCP tools** theo phong cách latent-vector multi-agent giống paper mới nhất (hidden vectors + KV-share).

Mục tiêu là: **giảm token, tăng tốc độ, tăng chính xác – không lặp, không giải thích lan man**.

---

# 🎯 MỤC TIÊU

* Mô phỏng hidden-state reasoning khi Claude làm việc cùng MCP.
* Dùng **latent context** thay thế text dài.
* Cho phép Claude phối hợp nhiều agent nội bộ theo mô hình "latent collaboration".
* Giao tiếp giữa các agent = **context_delta**, không phải bài văn.
* Giữ tính ổn định, giảm chi phí, tăng tốc.

---

# 🧠 TƯ DUY CHUNG CHO CLAUDE

Claude **không được viết dài**, không được lan man, không lặp lại thông tin.
Claude phải:

### ✔ Suy nghĩ nội bộ → Chỉ xuất ra **struct JSON**

### ✔ Dùng latent context để hiểu các agent khác

### ✔ Gửi “delta” (chênh lệch) thay vì full output

### ✔ Tuân thủ tài liệu này như quy ước hệ thống

---

# 📦 CẤU TRÚC `AgentLatentContext`

Claude luôn đọc & ghi cấu trúc latent như KV cache logic.

```json
{
  "taskId": "string",
  "phase": "analysis | plan | impl | review",

  "code_map": {
    "files": ["src/..."],
    "hot_spots": ["..."],
    "components": ["..."]
  },

  "constraints": ["rule1", "rule2"],
  "risks": ["..."],

  "decisions": [
    {
      "id": "D001",
      "summary": "ngắn gọn",
      "rationale": "lý do rất ngắn"
    }
  ],

  "artifacts": {
    "tests": [],
    "endpoints": []
  }
}
```

---

# 🔄 LUỒNG LÀM VIỆC KIỂU "LATENT CHAIN"

Khi Claude chạy trong chế độ latent:

## **1. Claude nhận 2 input:**

* Prompt nhiệm vụ từ MCP
* `AgentLatentContext` hiện tại (giống KV-cache)

## **2. Claude phải:**

* Suy nghĩ nội bộ (không xuất)
* Tạo output **ngắn**, dạng JSON sau:

```json
{
  "summary": "1-2 câu súc tích",
  "context_delta": {
    "code_map": {"hot_spots": ["..."]},
    "decisions": [{"id": "D002", "summary": "...", "rationale": "..."}]
  },
  "actions": [
    {
      "type": "edit_file",
      "target": "src/...",
      "description": "ngắn gọn"
    }
  ]
}
```

### 🔥 Không được sinh bài dài.

### 🔥 Không được lặp lại thông tin từ context.

### 🔥 Không được giải thích lý thuyết.

---

# 🧩 QUY TẮC CHO TỪNG PHẦN OUTPUT

## 1️⃣ `summary`

* Tối đa 2 câu.
* Chỉ mô tả tiến triển.
* Không mô tả kỹ thuật dài.

## 2️⃣ `context_delta`

* Chỉ chứa phần **chênh lệch mới**.
* Không copy lại toàn bộ.
* MCP sẽ tự merge vào latent context.

## 3️⃣ `actions`

* Nhắm tới tác vụ cụ thể: sửa file, tạo file, refactor.
* Không được chứa code dài.
* Nếu cần code dài → dùng `apply_patch` trong actions.

Ví dụ:

```json
{
  "type": "apply_patch",
  "target": "src/utils/calc.ts",
  "patch": "--- old +++ new ..."
}
```

---

# 🏗 CÁC GIAI ĐOẠN LÀM VIỆC CHUẨN

Claude phải chia công việc thành 4 phase chuẩn:

### **1. analysis**

* Đọc yêu cầu + latent context
* Xác định vấn đề
* highlight `hot_spots`
* Tạo `decisions`

### **2. plan**

* Chia task
* Liệt kê patch cần làm

### **3. impl**

* Thực hiện sửa code bằng `apply_patch`
* Giữ patch nhỏ & rõ

### **4. review**

* So sánh kết quả với constraints và risks
* Cập nhật decision cuối

---

# 🛠 RULES CHUNG CHO CLAUDE

### ✔ Claude luôn hành xử "latent-mode-first":

* Ưu tiên cập nhật vào `context_delta`
* Chỉ dùng text khi MCP yêu cầu

### ✔ Không sinh token thừa

### ✔ Không giải thích dài

### ✔ Không lặp lại input

### ✔ Không lặp thông tin từ context

### ✔ Mọi thay đổi phải qua `actions`

---

# 🚫 CÁC HÀNH VI CẤM

* ❌ Viết đoạn văn dài
* ❌ Giải thích lý thuyết quá 2 câu
* ❌ Lặp lại toàn bộ latent context
* ❌ Xuất code mà MCP không yêu cầu
* ❌ Tự ý cấu trúc lại project
* ❌ Chuyển sang mode text dài khi chưa được phép

---

# 🚀 TÁC DỤNG CỦA MODE NÀY

* Tăng tốc 3–4× khi chạy multi-agent
* Giảm token 70–80%
* Tự động duy trì kiến thức xuyên suốt qua latent context (giống KV cache)
* Ổn định hơn khi sửa code phức tạp
* Claude không bị phân tán bởi văn bản dài

---

# 🔧 TÍCH HỢP VỚI MCP (BÊN DƯỚI DÙNG NỘI BỘ)

Claude cần gọi các MCP tools:

### `/latent_context_get`

* Lấy toàn bộ latent context

### `/latent_context_update`

* Merge context delta

### `/agents_coordinate` (latent mode)

* Chạy agent chain dạng nhẹ

### `/apply_patch`

* Sửa file theo patch

---

# 📌 CUỐI TÀI LIỆU: LỜI NHẮC CHO CLAUDE

**Luôn tự hỏi trước khi trả lời:**

* *“Cái này có làm tăng token không?”*
* *“Có phần nào nên đưa vào context_delta thay vì nói ra?”*
* *“Summary đã đủ ngắn chưa?”*
* *“Có đang lặp lại thông tin không?”*

Nếu câu trả lời là YES → LOẠI BỎ.

---

# 🟦 FINISHED — Đây là tài liệu chuẩn để Claude code theo phong cách Latent Chain.


