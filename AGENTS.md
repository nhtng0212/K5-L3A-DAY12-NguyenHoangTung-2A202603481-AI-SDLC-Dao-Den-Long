# Hướng dẫn AI Agent (AGENTS.md) — Cập nhật Phase 2

Dự án: **Đảo Đèn Lồng (Lantern Island)** - Game 3D & AI-SDLC.
Phiên bản Test Contract hiện tại: **v1.1**.

## 1. Lệnh cơ bản
- Cài đặt: `npm install`
- Chạy giao diện 3D: `npm run dev`
- Chạy kiểm thử tự động: `npm test`
- Chạy chế độ headless theo Test Contract v1.1:
  `node src/headless.js --seed <int> --night <1|2|3> [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]`

## 2. Quy tắc cốt lõi Phase 2
1. **Chuẩn hóa số liệu Ticket-02:**
   - 60 tick/s, Y hướng lên, Y=0 mặt đất.
   - Nhảy 7.0 m/s, trọng lực -20.0 m/s^2.
   - Lướt (Dash): 14 m/s, 0.2s (12 ticks), hồi chiêu 1.5s (90 ticks).
   - Đèn: chi phí 10 đom đóm, bán kính tương tác 2.0m, vùng an toàn 6.0m.
   - Tỏa Sáng: chi phí 3 đom đóm, bán kính 5.0m, hồi chiêu 3.0s (180 ticks), choáng 120 ticks, đẩy lùi 4m trong 15 tick đầu.
   - Bóng Mực: tốc độ 4.0 m/s (Đêm 3: 4.5 m/s), phát hiện 12m, bỏ đuổi 18m, trạng thái: `spawning`, `wander`, `chase`, `recoil`, `stunned`.
   - Gió Lạc (Drifters): tốc độ 7 m/s, cướp tối đa 3 đom đóm, id D1, D2.
   - Bùa Gió (Charms): id C1, C2, hiệu lực 600 ticks, tốc độ 7.2 m/s, lướt không hồi chiêu, hồi lại sau 2700 ticks.
   - Rơi khỏi đảo ($Y < -10$): mất 1 Ngọn Lửa, mất toàn bộ đom đóm, hồi sinh ở điểm xuất phát sau 60 ticks.
2. **Thứ tự xử lý 1 tick bắt buộc:**
   Input (Pause) -> Giảm timers -> Di chuyển Mây & check rơi -> Nhặt motes & charms -> Tương tác đèn -> Cập nhật vùng an toàn -> Tỏa Sáng -> Di chuyển Shades & Drifters -> Contact/Hit -> Spawn theo lịch -> Xét thắng/thua -> Snapshot.
3. **Hiệu năng:**
   Chạy headless 21.600 tick phải hoàn thành trong $\le 30$ giây.
