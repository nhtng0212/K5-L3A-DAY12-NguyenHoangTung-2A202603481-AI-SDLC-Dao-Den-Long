# Bằng Chứng Kiểm Chứng — Phase 3 (Ticket-03)

- **MSSV:** 2A202603481
- **Họ và tên:** Nguyễn Hoàng Tùng
- **Tag:** `phase-3`
- **Phiên bản Contract:** v1.2

---

## 1. Bảng Nghiệm Thu Thay Đổi Cốt Lõi (Phase 3)

| STT | Yêu cầu Change Request | Kịch bản kiểm chứng | Kết quả |
|---|---|---|---|
| 1 | **Hao hụt dầu tự nhiên (1.0/s)** | Đèn sáng bị trừ 1/60 fuel mỗi tick; khi $fuel \le 0$ thì đèn tắt và phát `lantern_out` | **ĐẠT** |
| 2 | **Châm dầu đèn đang sáng** | Bấm `interact` gần đèn sáng, nạp đom đóm làm tăng fuel (tối đa 100), phát `refuel` | **ĐẠT** |
| 3 | **Thắp lại đèn (Relight)** | Đèn đã từng sáng (`ever_lit: true`) chỉ tiêu tốn 5 đom đóm, phát `lantern_lit { relight: true }` | **ĐẠT** |
| 4 | **Bóng Mực hút dầu (`drain`)** | Đèn có $fuel < 30$ bị mất vùng an toàn; Bóng Mực tiếp cận $\le 2m$ chuyển sang `drain`, phát `fuel_drain` mỗi 60 ticks | **ĐẠT** |
| 5 | **Thưởng Tỏa Sáng trúng drain** | Tỏa Sáng trúng Bóng Mực đang `drain` được thưởng +15 điểm (thay vì +5) | **ĐẠT** |
| 6 | **Luật thắng mới (`dawn_survived`)** | Hết thời gian sống sót và số đèn đang sáng $\ge 60\%$ (Đêm 1: 3/5, Đêm 2: 4/6, Đêm 3: 5/7) $\to$ Thắng `dawn_survived` | **ĐẠT** |
| 7 | **Bãi bỏ thắng sớm** | Thắp đủ 100% đèn không kích hoạt thắng sớm, màn chơi tiếp tục tới bình minh | **ĐẠT** |
| 8 | **Sức chứa tăng dần** | `capacity = min(20, 10 + 2 * successful_lights)` tăng sau mỗi lần thắp đèn thành công | **ĐẠT** |
| 9 | **Test Contract v1.2 Headless** | Đầy đủ trường `fuel`, `ever_lit`, `relit_count`, `capacity`, sự kiện `refuel`, `lantern_out`, `fuel_drain` | **ĐẠT** |
| 10 | **Hồi quy & Quyết định thiết kế** | Toàn bộ 19 test pass; có tài liệu ADR và CHANGELOG ghi nhận breaking changes | **ĐẠT** |

---

## 2. Kết Quả Kiểm Thử Tự Động (`npm test`)

```text
> dao-den-long@1.0.0 test
> node tests/runner.js

🧪 Bắt đầu chạy bộ kiểm thử Đảo Đèn Lồng (Phase 3 - Contract v1.2)...

  ✅ [PASS] RNG sinh số tất định với cùng seed
  ✅ [PASS] Phép chiếu di chuyển với góc yaw chuẩn xác
  ✅ [PASS] Nhặt đom đóm trong bán kính XZ <= 1.0m và dY <= 1.5m
  ✅ [PASS] Lướt (Dash) tốc độ 14 m/s trong 12 ticks và hồi chiêu 90 ticks
  ✅ [PASS] Nhảy đạt vận tốc Y 7.0 m/s và chịu trọng lực -20 m/s²
  ✅ [PASS] Rơi khỏi đảo Y < -10 gây mất 1 Ngọn Lửa, mất toàn bộ đom đóm, hồi sinh sau 60 ticks
  ✅ [PASS] Bùa Gió C1 cho 600 ticks tốc độ 7.2 m/s và Lướt không hồi chiêu
  ✅ [PASS] Gió Lạc cướp tối đa 3 đom đóm khi đuổi theo Mây
  ✅ [PASS] Nhấn Pause dừng sim_tick và ghi state: paused
  ✅ [PASS] Bục nhảy Đêm 2 tại (20,0,18) bắn Mây bay về phía tâm đảo B
  ✅ [PASS] Hao hụt dầu tự nhiên (1.0/s) và phát lantern_out khi fuel <= 0
  ✅ [PASS] Châm dầu cho đèn đang sáng tăng fuel và phát sự kiện refuel
  ✅ [PASS] Thắp lại đèn đã từng sáng (ever_lit) chỉ tiêu tốn 5 đom đóm
  ✅ [PASS] Bóng Mực hút dầu (drain) tại đèn có fuel < 30 và phát fuel_drain
  ✅ [PASS] Tỏa Sáng trúng Bóng Mực đang drain thưởng +15 điểm
  ✅ [PASS] Luật Thắng Mới: Sống sót đến bình minh với >= 60% đèn sáng (dawn_survived)
  ✅ [PASS] Sức chứa tăng dần theo successful_lights (10 + 2 * lights, tối đa 20)
  ✅ [PASS] CLI Headless chạy Đêm 1 xuất Snapshot chuẩn Contract v1.2
    (Thời gian chạy 21.600 tick: 0.02s)
  ✅ [PASS] Hiệu năng: Chạy headless 21.600 tick đạt tiêu chuẩn DoD (<= 30 giây)

========================================
Kết quả: 19 PASS / 0 FAIL
========================================
```
