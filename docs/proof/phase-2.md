# Bằng Chứng Kiểm Chứng — Phase 2 (Ticket-02)

- **MSSV:** 2A202603481
- **Họ và tên:** Nguyễn Hoàng Tùng
- **Tag:** `phase-2`
- **Phiên bản Contract:** v1.1

---

## 1. Bảng Nghiệm Thu Tính Năng Phase 2

| STT | Tính năng Ticket-02 | Kịch bản kiểm chứng | Kết quả |
|---|---|---|---|
| 1 | **Chuẩn hóa số liệu** | Chạy kiểm thử tốc độ chạy (6.0m/s), nhảy (7.0m/s, g=-20), chi phí đèn (10), vùng an toàn (6.0m) | **ĐẠT** |
| 2 | **Lướt (Dash)** | Test lướt 14 m/s trong 12 ticks, hồi chiêu 90 ticks | **ĐẠT** |
| 3 | **Rơi khỏi đảo** | Test Y < -10: mất 1 Ngọn Lửa, mất sạch đom đóm, hồi sinh sau 60 ticks | **ĐẠT** |
| 4 | **Bùa Gió (Charms)** | Nhặt C1 cho 600 ticks tốc độ 7.2 m/s, Lướt không hồi chiêu | **ĐẠT** |
| 5 | **Gió Lạc (Drifters)** | Xuất hiện Đêm 2 & 3, cướp tối đa 3 đom đóm khi đuổi theo Mây | **ĐẠT** |
| 6 | **Bản đồ 3 Đêm & Bục Nhảy** | Đêm 1 (Đảo Bến), Đêm 2 (Đảo Cau + bục nhảy bắn sang tâm đảo đối diện), Đêm 3 (Đảo Chuông 3 tầng) | **ĐẠT** |
| 7 | **Tạm dừng (Pause)** | Nhấn Esc/P dừng sim_tick, snapshot ghi state: paused | **ĐẠT** |
| 8 | **Test Contract v1.1 Headless** | Xuất đúng schema snapshot (night, wind, player.vel, motes[], drifters[], charms[]) | **ĐẠT** |
| 9 | **Hiệu năng 21.600 tick** | Chạy đủ 21.600 tick mất 0.02 giây (yêu cầu <= 30 giây) | **ĐẠT (vượt 1500 lần)** |
| 10 | **Hồi quy Phase 1** | Toàn bộ tính năng cốt lõi của Phase 1 vẫn hoạt động chính xác | **ĐẠT** |

---

## 2. Kết Quả Kiểm Thử Tự Động (`npm test`)

```text
> dao-den-long@1.0.0 test
> node tests/runner.js

🧪 Bắt đầu chạy bộ kiểm thử Đảo Đèn Lồng (Phase 2 - Contract v1.1)...

  ✅ [PASS] RNG sinh số tất định với cùng seed
  ✅ [PASS] Phép chiếu di chuyển với góc yaw chuẩn xác
  ✅ [PASS] Nhặt đom đóm trong bán kính XZ <= 1.0m và dY <= 1.5m
  ✅ [PASS] Nạp đom đóm vào đèn và thắp sáng khi đủ lantern_cost = 10
  ✅ [PASS] Lướt (Dash) tốc độ 14 m/s trong 12 ticks và hồi chiêu 90 ticks
  ✅ [PASS] Nhảy đạt vận tốc Y 7.0 m/s và chịu trọng lực -20 m/s²
  ✅ [PASS] Rơi khỏi đảo Y < -10 gây mất 1 Ngọn Lửa, mất toàn bộ đom đóm, hồi sinh sau 60 ticks
  ✅ [PASS] Nhặt Bùa Gió C1 cho 600 ticks tốc độ 7.2 m/s và Lướt không hồi chiêu
  ✅ [PASS] Gió Lạc cướp tối đa 3 đom đóm khi đuổi theo Mây
  ✅ [PASS] Nhấn Pause dừng sim_tick và ghi state: paused
  ✅ [PASS] Bục nhảy Đêm 2 tại (20,0,18) bắn Mây bay về phía tâm đảo B
  ✅ [PASS] CLI Headless chạy Đêm 2 xuất Snapshot chuẩn Contract v1.1
    (Thời gian chạy 21.600 tick: 0.02s)
  ✅ [PASS] Hiệu năng: Chạy headless 21.600 tick đạt tiêu chuẩn DoD (<= 30 giây)

========================================
Kết quả: 13 PASS / 0 FAIL
========================================
```
