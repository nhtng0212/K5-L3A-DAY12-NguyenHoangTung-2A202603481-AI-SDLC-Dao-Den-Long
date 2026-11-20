# Giả định & Thiết kế Phase 1 (PRD-0)

Tài liệu này ghi lại các giả định cho những điểm PRD-0 để mở hoặc chưa quy định cụ thể, nhằm đảm bảo tính nhất quán và kiểm chứng được.

## 1. Giả định về Cơ chế Game (Gameplay Mechanics)
- **Hòn đảo (Đảo Bến - Đêm 1):**
  - Đảo hình tròn bán kính 40 mét, tâm tại `(0, 0, 0)`, cao độ $Y = 0$.
  - 5 Đèn Lồng Lớn đặt tại các vị trí đối xứng quanh đảo:
    - L1: `(0, 0, 25)`
    - L2: `(23.776, 0, 7.725)`
    - L3: `(14.695, 0, -20.225)`
    - L4: `(-14.695, 0, -20.225)`
    - L5: `(-23.776, 0, 7.725)`
  - Mỗi đèn cần 5 đom đóm (`lantern_cost = 5`) để thắp sáng (`lit = true`).
  - Đèn đã thắp sáng tạo ra vùng an toàn bán kính `safe_radius = 4.0m`. Bóng Mực không thể tiến vào vùng này (bị đẩy ra ranh giới).

- **Đom đóm (Motes):**
  - Mặc định sinh 25 đom đóm rải rác trên đảo nếu `random_motes = true`.
  - Tự động nhặt khi người chơi cách đom đóm $\le 1.5m$ (`pickup_radius`).
  - Sức chứa tối đa của Mây: 10 đom đóm (`carry_capacity = 10`). Đầy giỏ thì không nhặt thêm cho tới khi nạp vào đèn.

- **Nạp ánh sáng (Deposit):**
  - Khi Mây đứng cách đèn $\le 3.0m$ (`interact_radius`) và nhấn `interact` (rising edge):
    - Toàn bộ đom đóm đang mang (hoặc số lượng cần thiết để hoàn thành đèn) được nạp vào đèn.
    - Nếu nạp đủ 5 đom đóm, đèn chuyển trạng thái `lit = true`, phát sự kiện `lantern_lit`.

- **Bóng Mực (Shades):**
  - Mặc định sinh 3 Bóng Mực nếu `random_shades = true`.
  - Tốc độ di chuyển: 3.0 m/s (`shade_speed = 3.0`, tức $0.05$ m/tick).
  - Trạng thái Bóng Mực: `chase` (đuổi theo người chơi), `stunned` (bị choáng khi trúng pulse).
  - Khi khoảng cách tới Mây $\le 1.2m$ (`shade_hit_radius`) và Mây không trong thời gian bất tử (`invuln`):
    - Mây mất 1 ngọn lửa máu (`flames` giảm 1).
    - Đánh rơi đom đóm theo tỉ lệ `hit_drop_ratio = 0.5` (làm tròn xuống: $\lfloor carried \times 0.5 \rfloor$).
    - Kích hoạt thời gian bất tử 1.5s (90 ticks).
    - Phát sự kiện `player_hit`.

- **Tỏa sáng (Pulse):**
  - Nhấn `pulse` (rising edge):
    - Điều kiện: có ít nhất 1 đom đóm (`pulse_cost = 1`) và cooldown đã hết (`pulse_cooldown_s = 1.0s` = 60 ticks).
    - Tiêu hao 1 đom đóm mang theo.
    - Mọi Bóng Mực trong bán kính 5.0m (`pulse_radius`) bị choáng trong 3.0s (180 ticks, `pulse_stun_s = 3.0`) và bị đẩy lùi 3.0m xa khỏi Mây (`pulse_push_m = 3.0`).
    - Phát sự kiện `pulse` kèm danh sách `stunned_ids`.

- **Thắng / Thua & Tính điểm:**
  - Thắng: Khi cả 5 đèn đều được thắp sáng (`all_lit`).
  - Thua: Hết máu (`flames == 0`, reason: `no_flames`) hoặc hết thời gian 300s (reason: `dawn`).
  - Công thức điểm:
    - Nhặt mỗi đom đóm: +10 điểm.
    - Thắp sáng mỗi đèn: +200 điểm.
    - Choáng mỗi Bóng Mực: +20 điểm.
    - Khi thắng: cộng thêm `thời gian còn lại (s) * 5` và `flames còn lại * 100`.
