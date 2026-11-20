# Nhật Ký Thay Đổi (CHANGELOG)

## [Phase 3 - v1.2.0] — Change Request "Đèn cạn dầu"

### ⚠ Breaking Changes (Thay đổi phá vỡ tương thích cũ)
1. **Bãi bỏ cơ chế Thắng sớm (`all_lit`)**:
   - Thắp đủ toàn bộ đèn không còn kết thúc màn chơi ngay lập tức.
   - Trò chơi chuyển sang sống sót đến bình minh (`time_left_s <= 0`) với ít nhất 60% số đèn còn sáng (`reason: dawn_survived`).
2. **Nhiên liệu Đèn Lớn (`fuel`)**:
   - Đèn sáng không còn duy trì vĩnh viễn; bị hao hụt 1.0 đơn vị/giây.
   - Khi $fuel \le 0$, đèn tự tắt, sinh sự kiện `lantern_out`.
   - Đèn đang sáng nhận thêm đom đóm để châm dầu (nạp lại tối đa 100).
   - Thắp lại đèn đã từng sáng (`ever_lit`) chỉ tốn 5 đom đóm (thay vì 10).
3. **Bóng Mực hút dầu (`drain`)**:
   - Đèn có $fuel < 30$ bị mất vùng an toàn.
   - Bóng Mực có trạng thái mới `drain`, hút 5.0 đơn vị dầu/giây.
4. **Thay đổi công thức tính điểm**:
   - Nạp đom đóm: +5 điểm.
   - Thắp lần đầu: +100 điểm.
   - Thắp lại: +40 điểm.
   - Tỏa sáng trúng bóng mực: +5 điểm (nếu đang drain: +15 điểm).
   - Bỏ thưởng thời gian; thưởng bình minh: +50/đèn + floor(fuel), +50/ngọn lửa.

### Added (Tính năng mới)
- Sức chứa tăng dần: `10 + 2 * successful_lights` (tối đa 20).
- Chế độ mù màu (Colorblind mode) với bảng màu dễ phân biệt.
- Sự kiện mới: `refuel`, `lantern_out`, `fuel_drain`, `lantern_lit { relight }`, `game_over { reason: "dawn_survived" }`.
