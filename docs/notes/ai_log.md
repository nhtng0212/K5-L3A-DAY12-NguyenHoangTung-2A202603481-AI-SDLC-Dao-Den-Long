# Nhật ký dùng AI (AI Usage Log)

## Phase 1 (PRD-0)
- **Model:** Gemini 3.8 Flash (Medium) / Antigravity Agent
- **Mục tiêu:**
  1. Phân tích yêu cầu PRD-0 và Test Contract v1.0.
  2. Xây dựng cấu trúc dự án, core deterministic simulation logic.
  3. Xây dựng CLI headless runner theo đúng hợp đồng `game.contract.json`.
  4. Xây dựng giao diện Three.js 3D chơi được trên web browser.
  5. Viết bộ kiểm thử unit & scenario, chạy nghiệm thu và trích xuất bằng chứng.
- **Chiến lược tiết kiệm token:**
  - Lập tài liệu giả định và thiết kế kiến trúc chuẩn trước khi viết code.
  - Sử dụng các lệnh ghép và batch file writes để tránh vòng lặp kiểm tra dư thừa.
  - Tách bạch core logic và 3D rendering để test headless độc lập, không tốn tài nguyên GPU/DOM.
- **Ước tính token Phase 1:** ~25,000 tokens.
