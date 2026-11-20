# Nhật ký dùng AI (AI Usage Log)

## Phase 1 (PRD-0)
- **Model:** Gemini 3.8 Flash / Antigravity Agent
- **Ước tính token:** ~25,000 tokens.
- **Hoạt động:** Phân tích PRD-0, thiết lập kiến trúc tách rời Core Logic và 3D Rendering, cài đặt Test Contract v1.0, 9/9 test PASS.

## Phase 2 (Ticket-02 — "Ba hòn đảo")
- **Model:** Gemini 3.8 Flash / Antigravity Agent
- **Ước tính token:** ~35,000 tokens.
- **Hoạt động:**
  1. Chuẩn hóa bộ số liệu theo Phần 1: Tốc độ di chuyển, nhảy, trọng lực, chi phí đèn (10), hồi chiêu tỏa sáng.
  2. Bổ sung cơ chế mới: Lướt (Dash 14m/s), rơi khỏi đảo ($Y < -10$), bùa gió (Charm C1/C2), Gió Lạc (Drifters D1/D2 cướp đom đóm).
  3. Xây dựng bản đồ chuẩn 3 Đêm: Đảo Bến, Đảo Cau (2 đảo + cầu tre + bục nhảy), Đảo Chuông (3 tầng + tháp chuông + gió mạnh).
  4. Nâng cấp Test Contract lên v1.1: Snapshot đầy đủ các mảng `motes`, `drifters`, `charms`, `wind`, `player.vel`.
  5. Kiểm tra hồi quy toàn diện: Đạt 13/13 test PASS, hiệu năng 21.600 tick chỉ mất 0.02s (yêu cầu $\le 30s$).
- **Tổng token ước tính 2 Phase:** ~60,000 tokens.
