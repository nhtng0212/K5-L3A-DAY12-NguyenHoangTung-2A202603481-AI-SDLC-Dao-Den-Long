# Hướng dẫn AI Agent (AGENTS.md)

Dự án: **Đảo Đèn Lồng (Lantern Island)** - Game 3D & AI-SDLC.

## 1. Lệnh cơ bản
- Cài đặt: `npm install`
- Chạy giao diện 3D: `npm run dev` (mở trình duyệt xem Three.js 3D)
- Chạy kiểm thử tự động: `npm test`
- Chạy chế độ headless theo Test Contract v1.0:
  `node src/headless.js --seed <int> --night 1 [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]`

## 2. Kiến trúc & Nguyên tắc cốt lõi
1. **Tách biệt Core Logic và Render:**
   - Thư mục `src/core/`: Chứa toàn bộ mô phỏng vật lý, di chuyển, va chạm, trạng thái đom đóm, đèn, Bóng Mực và điểm số.
   - Core không phụ thuộc vào `window`, `document`, DOM, WebGL.
   - Core chạy ở tốc độ cố định **60 tick/giây (1 tick = 1/60s)**.
   - Mọi tính toán tọa độ làm tròn 3 chữ số thập phân (`toFixed(3)` hoặc tương đương).
2. **Tính tất định (Determinism):**
   - Không dùng `Math.random()` trực tiếp trong logic game.
   - Sử dụng bộ tạo số ngẫu nhiên có seed (`src/core/rng.js`) để đảm bảo cùng seed, scenario, inputs ra cùng kết quả 100%.
3. **Quy ước Test Contract v1.0:**
   - Trục Y hướng lên; mặt đất đảo ở Y = 0; người chơi xuất phát tại `(0, 0, 0)`.
   - Khoảng cách tính trên mặt phẳng ngang XZ (`Math.hypot(dx, dz) <= radius`).
   - Hướng di chuyển với góc yaw $\theta$: $x' = x \cos\theta + z \sin\theta$, $z' = -x \sin\theta + z \cos\theta$.
   - Các nút `interact`, `pulse`, `jump` chỉ kích hoạt tại rising edge (từ false sang true).
4. **Không bao giờ sửa tay output:** Mọi bằng chứng phải được sinh trực tiếp bằng lệnh chạy thực tế.
