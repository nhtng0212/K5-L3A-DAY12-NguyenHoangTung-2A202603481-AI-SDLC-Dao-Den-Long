# Quyết Định Kiến Trúc (ADR-001): Chuyển Đổi Mô Hình Trạng Thái Đèn & Luật Thắng

- **Trạng thái:** Được chấp thuận (Approved)
- **Ngày:** 20/11/2026
- **Tác giả:** Nguyễn Hoàng Tùng (MSSV: 2A202603481)
- **Phạm vi:** Phase 3 — Ticket-03 (Change Request: "Đèn cạn dầu")

---

## 1. Ngữ cảnh & Vấn đề (Context)
Ở Phase 1 và 2, mục tiêu của trò chơi là "thắp sáng toàn bộ Đèn Lớn" để chiến thắng ngay lập tức (`game_over.result = won, reason = all_lit`).
Tuy nhiên, qua đợt thử nghiệm (playtest), người chơi thành thạo có thể thắp đủ đèn trong vòng chưa tới 2 phút, khiến nửa sau màn chơi bị nhàm chán và thiếu kịch tính.

Khách hàng ban hành Change Request **TICKET-03** với các yêu cầu thay thế cốt lõi:
1. Đèn sau khi sáng sẽ bị cạn dầu theo thời gian (`1.0 đơn vị/s`).
2. Bóng Mực có thể tiếp cận và hút dầu (`5.0 đơn vị/s`) từ các đèn yếu dầu ($fuel < 30$).
3. Bỏ luật thắng sớm: Mục tiêu chuyển thành "bảo vệ đảo sáng tới bình minh", đạt chiến thắng khi hết giờ nếu số đèn còn sáng đạt $\ge 60\%$.

---

## 2. Quyết định Thiết kế (Design Decisions)

### 2.1. Quản lý Nhiên liệu (Fuel State Machine)
- Để tránh sai số tích lũy của số thực (floating point drift) trong 60 tick/giây, nhiên liệu được lưu trữ nội bộ bằng **đơn vị nguyên 1/60**:
  - `fuel_max = 6000` (tương đương 100.0 đơn vị).
  - Hao hụt tự nhiên: `fuel -= 1` mỗi tick.
  - Hút dầu bởi Bóng Mực: `fuel -= 5` mỗi tick cho mỗi Bóng Mực đang ở trạng thái `drain`.
- Khi xuất snapshot Test Contract v1.2, giá trị được chia cho 60 và làm tròn 1 chữ số thập phân (`round1`).
- Khi $fuel \le 0$: Đèn tự động tắt (`lit = false`), đặt cờ `ever_lit = true`, phát sự kiện `lantern_out`.
- Lần thắp lại đối với đèn đã từng sáng (`ever_lit`) chỉ tiêu tốn 5 đom đóm (`relight_cost = 5`).

### 2.2. Trạng thái Bóng Mực: Bổ sung trạng thái `drain`
- Khi Bóng Mực ở trạng thái `wander`, ưu tiên tìm đèn sáng gần nhất có $fuel < 30$ (mất vùng an toàn).
- Khi cách đèn $\le 2.0m$: chuyển sang `drain`, đứng yên hút dầu.
- Chuyển trạng thái từ `drain`:
  - Sang `chase` khi Mây đến gần $\le 6.0m$.
  - Sang `stunned` khi trúng Tỏa Sáng (được thưởng +15 điểm thay vì +5).
  - Sang `wander` khi đèn tắt, hoặc khi đèn được châm dầu $\ge 30$, hoặc bị đẩy ra $> 2.0m$.

### 2.3. Điều Kiện Thắng Mới (`dawn_survived`)
- Loại bỏ hoàn toàn sự kiện thắng sớm `all_lit`.
- Trò chơi luôn chạy đến hết thời gian quy định của Đêm (240s / 270s / 300s).
- Tại tick cuối cùng (bình minh):
  - Nếu `flames <= 0`: Thua (`no_flames`).
  - Nếu số đèn đang sáng $\ge \lceil 0.6 \times \text{tổng đèn} \rceil$: Thắng (`dawn_survived`).
  - Ngược lại: Thua (`dawn`).

### 2.4. Sức chứa nâng cấp (Progressive Capacity)
- `capacity = Math.min(20, 10 + 2 * successful_lights)`.
- Giúp người chơi tích cực thắp và giữ đèn để nâng cao khả năng mang vác đom đóm.

---

## 3. Hệ quả & Cập nhật Test (Consequences)
- Phá vỡ tương thích (breaking change) đối với các test kỳ vọng game thắng ngay khi thắp đủ 5 đèn. Test này được cập nhật có ghi chú lý do rõ ràng.
- Toàn bộ cơ chế mới được kiểm thử bằng các kịch bản headless tự động riêng biệt trong `tests/runner.js`.
