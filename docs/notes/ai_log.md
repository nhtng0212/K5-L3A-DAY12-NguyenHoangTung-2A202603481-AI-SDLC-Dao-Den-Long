# Nhật ký dùng AI (AI Usage Log)

## Phase 1 (PRD-0)
- **Model:** Gemini 3.8 Flash / Antigravity Agent
- **Ước tính token:** ~25,000 tokens.
- **Hoạt động:** Phân tích PRD-0, thiết lập kiến trúc tách rời Core Logic và 3D Rendering, cài đặt Test Contract v1.0, 9/9 test PASS.

## Phase 2 (Ticket-02 — "Ba hòn đảo")
- **Model:** Gemini 3.8 Flash / Antigravity Agent
- **Ước tính token:** ~35,000 tokens.
- **Hoạt động:** Chuẩn hóa số liệu, cơ chế lướt, nhảy, rơi đảo, Gió Lạc, Bùa Gió, bản đồ 3 đêm, bục nhảy, nâng cấp Test Contract v1.1, 13/13 test PASS.

## Phase 3 (Ticket-03 — Change Request "Đèn cạn dầu")
- **Model:** Gemini 3.8 Flash / Antigravity Agent
- **Ước tính token:** ~30,000 tokens.
- **Hoạt động:**
  1. Viết tài liệu ADR-001 (Quyết định kiến trúc cho mô hình nhiên liệu và luật thắng).
  2. Viết CHANGELOG ghi rõ các breaking changes.
  3. Cài đặt hệ thống nhiên liệu đèn (fuel decay, refuel, relight cost 5 motes, lantern_out).
  4. Cài đặt Bóng Mực hút dầu (`drain`), mất vùng an toàn khi fuel < 30, thưởng +15 điểm khi pulse trúng drain.
  5. Cài đặt luật thắng mới (`dawn_survived` khi đạt $\ge 60\%$ đèn sáng tại bình minh).
  6. Sức chứa tăng dần: `10 + 2 * successful_lights` (tối đa 20).
  7. Chế độ mù màu (Colorblind mode) trong giao diện & 3D.
  8. Nâng cấp Test Contract lên v1.2, đạt 19/19 test PASS.
- **Tổng token ước tính 3 Phase:** ~90,000 tokens.
