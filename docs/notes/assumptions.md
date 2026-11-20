# Đặc Tả & Tiêu Chí Nghiệm Thu (Acceptance Criteria) — Phase 2

Ticket: **TICKET-02 — "Ba hòn đảo" (Phase 2)**
Contract: **v1.1**

## 1. Tiêu Chí Nghiệm Thu Các Tính Năng Mới (Phần 3)

### AC-01: Gió Lạc (Drifters)
- **AC-01.1:** Xuất hiện ở Đêm 2 và Đêm 3 (tối đa 2 con), sinh tại tick 1200, 2400... id D1, D2...
- **AC-01.2:** Trạng thái: `idle` (lượn 2 m/s) -> `chase` khi Mây mang $\ge 5$ đom đóm và cách $\le 15m$.
- **AC-01.3:** Chạm Mây (khoảng cách $XZ \le 1.2m$): cướp $\min(3, \text{carried})$ đom đóm, phát sự kiện `drifter_steal`, chuyển sang `flee` bay xa Mây 7 m/s trong 240 tick rồi biến mất.
- **AC-01.4:** Tỏa Sáng trúng Gió Lạc đang chase -> chuyển sang flee không cướp.
- **AC-01.5:** Tỏa Sáng trúng Gió Lạc đang flee có mang đồ -> thả lại toàn bộ đom đóm tại chỗ (phát `drifter_drop`), biến mất sau 120 tick.
- **AC-01.6:** Gió Lạc không làm mất máu Mây, không bị vùng an toàn đèn chặn, cướp bất chấp Mây đang bất tử.

### AC-02: Bùa Gió (Charms)
- **AC-02.1:** Xuất hiện tại vị trí quy định: Đêm 2 tại (35,0,0); Đêm 3 tại (30,0,25) và (-30,0,25). Id C1, C2.
- **AC-02.2:** Nhặt khi $XZ \le 1.0m, dY \le 1.5m$. Phát sự kiện `charm_picked {charm_id, charm_ticks: 600}`.
- **AC-02.3:** Trong 600 ticks: Tốc độ chạy tăng lên 7.2 m/s, Lướt không có thời gian hồi chiêu.
- **AC-02.4:** Bùa hồi sinh lại sau 2700 ticks.

### AC-03: Nhảy, Lướt & Rơi Khỏi Đảo
- **AC-03.1:** Nhảy (vận tốc Y 7.0 m/s, trọng lực -20 m/s^2), chỉ nhảy khi chạm đất (`grounded`).
- **AC-03.2:** Lướt (Dash): tốc độ 14 m/s trong 12 ticks (0.2s), hồi chiêu 90 ticks (1.5s). Khi lướt trên không giữ nguyên độ cao (vận tốc Y = 0).
- **AC-03.3:** Rơi khỏi đảo ($Y < -10$): mất 1 Ngọn Lửa, mất toàn bộ đom đóm mang theo. Đứng im 60 ticks rồi hồi sinh tại vị trí xuất phát, bất tử 90 ticks. Nếu hết máu thì thua ngay.

### AC-04: Bản Đồ 3 Đêm & Bục Nhảy
- **AC-04.1:** Đêm 1: Đảo Bến (bán kính 40m, 5 đèn L1..L5).
- **AC-04.2:** Đêm 2: Đảo Cau (2 đảo A và B bán kính 28m cách nhau 70m, nối cầu tre rộng 4m). 2 bục nhảy bắn Mây sang tâm đảo đối diện. 6 đèn L1..L6.
- **AC-04.3:** Đêm 3: Đảo Chuông (3 tầng: Y=0, Y=3, Y=6, 2 dốc nghiêng, 1 bục nhảy lên tầng 2). 7 đèn L1..L7. Gió mạnh mỗi 30s thổi 5s.

### AC-05: Tạm Dừng (Pause)
- **AC-05.1:** Nhấn Esc / P kích hoạt tạm dừng. Snapshot ghi `state: "paused"`.
- **AC-05.2:** Khi tạm dừng: `tick` tăng nhưng `sim_tick`, `time_left_s`, cooldowns, spawn, TTL đều đứng yên.
