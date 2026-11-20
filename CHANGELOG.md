# Nhật Ký Thay Đổi (CHANGELOG)

Tất cả các thay đổi quan trọng của dự án **Đảo Đèn Lồng (Lantern Island)** qua 4 Phase phát triển.

---

## [Phase 4 - v1.0.0] — Phát hành chính thức "Bình minh" (Release v1.0.0)

### Added
- **Chế độ Benchmark (`node src/benchmark.js`)**:
  - Đo lường hiệu năng 1280×720 với 200 Bóng Mực wander, 100 đom đóm, camera bay tròn 30m.
  - Xuất `bench.json` đo avg_fps, p1_low_fps, load_ms, peak_mem_mb, frame_ms_p95.
- **Soak Test (`node src/soak.js`)**:
  - Chạy headless 10 Đêm liên tiếp trong cùng 1 tiến trình kiểm tra rò rỉ bộ nhớ và độ ổn định.
  - Xuất `soak.json`, đảm bảo crashes = 0 và mem_end <= 1.2 * mem_start.
- **Bảng xếp hạng cục bộ (`leaderboard.json` & `src/leaderboard.js`)**:
  - Lưu trữ top 10 điểm cao nhất kèm tên người chơi (3-12 ký tự), số đêm thắng và mốc thời gian.
  - Hỗ trợ xuất qua lệnh CLI `--export`.
- **Dễ tiếp cận (Accessibility)**:
  - Tùy chỉnh đổi phím điều khiển, phát hiện trùng phím.
  - Chỉ báo hình ảnh cho Bóng Mực xuất hiện, gió mạnh, 10s cuối, đèn sắp cạn dầu.
  - Tùy chọn giảm chuyển động (tắt rung/chớp) và cỡ chữ lớn.
- **Báo cáo tổng kết dự án (`docs/notes/retro.md`)**.

---

## [Phase 3 - v1.2.0] — Change Request "Đèn cạn dầu"

### ⚠ Breaking Changes
- **Bãi bỏ cơ chế Thắng sớm (`all_lit`)**: Chuyển sang sống sót tới bình minh (`dawn_survived`) với $\ge 60\%$ đèn sáng.
- **Nhiên liệu đèn (`fuel`)**: Đèn bị hao hụt 1.0/s; khi $fuel \le 0$ thì đèn tắt, phát `lantern_out`.
- **Thắp lại (`relight`)**: Đèn đã từng sáng (`ever_lit: true`) chỉ tốn 5 đom đóm.
- **Bóng Mực hút dầu (`drain`)**: Đèn có $fuel < 30$ bị mất vùng an toàn; Bóng Mực tiếp cận $\le 2m$ chuyển sang `drain`, hút 5 fuel/s.
- **Thay đổi công thức điểm**: +5 nạp đom đóm, +100 thắp mới, +40 thắp lại, +15 khi pulse trúng drain, thưởng bình minh theo fuel và ngọn lửa.

### Added
- Sức chứa tăng dần: `10 + 2 * successful_lights` (tối đa 20).
- Chế độ mù màu (Colorblind mode) với bảng màu dễ phân biệt.
- Tài liệu kiến trúc ADR-001.

---

## [Phase 2 - v1.1.0] — Tính năng "Ba hòn đảo"

### Added
- Chuẩn hóa thông số: tốc độ chạy 6.0 m/s, nhảy Y 7.0 m/s, trọng lực -20 m/s².
- Cơ chế Lướt (Dash): 14 m/s trong 12 ticks, hồi chiêu 90 ticks.
- Cơ chế Rơi khỏi đảo ($Y < -10$): mất 1 Ngọn Lửa, mất sạch đom đóm mang theo, hồi sinh sau 60 ticks.
- Bản đồ chuẩn 3 Đêm: Đêm 1 (Đảo Bến), Đêm 2 (Đảo Cau + cầu tre + 2 bục nhảy), Đêm 3 (Đảo Chuông 3 tầng + gió mạnh).
- Thực thể mới: Gió Lạc (Drifters) cướp đom đóm, Bùa Gió (Charms) tăng tốc và lướt không hồi chiêu.
- Hệ thống Tạm dừng (Pause - Esc/P).

---

## [Phase 1 - v1.0.0-alpha] — Khởi tạo dự án "Đảo Đèn Lồng"

### Added
- Xây dựng kiến trúc phân tầng: Simulation Logic thuần JS (60 tick/s) và Three.js 3D WebGL.
- Bản đồ Đêm 1: Đảo Bến, 5 Đèn Lớn, đom đóm, Bóng Mực, kỹ năng Tỏa Sáng.
- Hệ thống Test Contract v1.0 và CLI headless runner.
- Bộ kiểm thử tự động 9/9 PASS.
