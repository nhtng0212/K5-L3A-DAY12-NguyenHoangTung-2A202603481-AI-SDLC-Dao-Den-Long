# Đảo Đèn Lồng (Lantern Island) — Bản Phát Hành v1.0.0

> **Học viên:** Nguyễn Hoàng Tùng - **MSSV:** 2A202603481  
> **Lớp:** K5-L3A  
> **Repo:** [K5-L3A-DAY12-NguyenHoangTung-2A202603481-AI-SDLC-Dao-Den-Long](https://github.com/nhtng0212/K5-L3A-DAY12-NguyenHoangTung-2A202603481-AI-SDLC-Dao-Den-Long)  
> **Video Demo:** [Xem Video Demo (.mp4)](docs/demo/demo.mp4) *(Đính kèm Release v1.0.0)*

---

## 1. Giới thiệu Dự án
**Đảo Đèn Lồng** là trò chơi 3D góc nhìn thứ ba mang phong cách cổ tích, ấm áp. Người chơi điều khiển **Mây** — người giữ đèn nhỏ tuổi đội nón lá mang theo chiếc đèn lồng nhỏ. Trong đêm sương đen bao phủ qua 3 hòn đảo (Đảo Bến, Đảo Cau, Đảo Chuông), Mây phải chạy khắp nơi gom đom đóm thắp sáng và châm dầu cho các Đèn Lồng Lớn, né tránh Bóng Mực và Gió Lạc để bảo vệ hòn đảo sáng rực rỡ cho tới lúc Bình Minh.

Dự án áp dụng quy trình **AI SDLC** qua 4 Phase hoàn chỉnh, tuân thủ nghiêm ngặt **Test Contract v1.3** với kiến trúc tách rời giữa Game Simulation Logic (deterministic, 60 tick/s) và Three.js WebGL View.

---

## 2. Cài Đặt & Chạy Nhanh (Tối đa 3 lệnh)

Chạy mượt mà trên Windows, macOS và Linux:

```bash
# Lệnh 1: Cài đặt dependencies
npm install

# Lệnh 2: Khởi chạy game giao diện 3D trên trình duyệt
npm run dev

# Lệnh 3: Chạy bộ kiểm thử tự động
npm test
```

Sau khi chạy `npm run dev`, mở trình duyệt tại `http://localhost:5173`.

---

## 3. Điều Khiển & Phím Tắt

- **W, A, S, D**: Di chuyển Mây theo góc nhìn camera.
- **Kéo Chuột**: Xoay góc nhìn camera 3D xung quanh Mây.
- **Space**: Nhảy (vận tốc Y 7.0 m/s, trọng lực -20 m/s²).
- **Shift / Q**: Lướt (Dash — 14 m/s trong 12 ticks, hồi chiêu 90 ticks).
- **E**: Nạp đom đóm vào Đèn Lớn / Châm dầu cho đèn đang sáng.
- **F / X**: Tỏa Sáng (Pulse — tiêu hao 3 đom đóm, làm choáng và đẩy lùi Bóng Mực).
- **Esc / P**: Mở menu Tạm dừng & Cài đặt.

---

## 4. Các Lệnh Kiểm Thử & Đo Đạc (Test Contract v1.3)

### 4.1. Chạy Chế Độ Headless CLI
```bash
node src/headless.js --seed 42 --night 1 --ticks 180 --out docs/proof/sample_headless.jsonl --snapshot-every 60
```

### 4.2. Chạy Benchmark Hiệu Năng
```bash
node src/benchmark.js --seed 42 --duration 30 --out bench.json
```
- Khởi tạo 200 Bóng Mực wander, 100 đom đóm, 3 đèn sáng, camera bay vòng tròn 30m.
- Đo FPS trung bình, P1 Low, Load Time, Peak Memory. Kết quả lưu tại `bench.json`.

### 4.3. Chạy Soak Test Độ Ổn Định
```bash
node src/soak.js --seed 7 --nights 10 --out soak.json
```
- Chạy liên tục 10 Đêm trong cùng 1 tiến trình kiểm tra crash và rò rỉ bộ nhớ.
- Đạt chuẩn: `crashes = 0` và `mem_end <= 1.2 * mem_start`. Kết quả lưu tại `soak.json`.

### 4.4. Xuất Bảng Xếp Hạng Cục Bộ
```bash
node src/leaderboard.js --export leaderboard_export.json
```

---

## 5. Dễ Tiếp Cận (Accessibility) & Sáng Tạo

1. **Chế độ Mù Màu (Colorblind Mode):**
   - Bảng màu dễ phân biệt: Mắt & viền Bóng Mực chuyển sang `#00B3FF`, cảnh báo chuyển sang `#FFFFFF` kèm icon `⚠`.
   - Đèn tắt bị xẹp 20% kích thước và đèn sắp cạn dầu nhấp nháy chậm 1 Hz giúp nhận diện trực quan không phụ thuộc vào màu sắc.
2. **Âm thanh thủ tục (Web Audio API Synthesizer):**
   - Toàn bộ âm thanh nhặt đom đóm, chuông nạp đèn, nhảy, lướt, va chạm, cảnh báo 10s cuối được tạo thủ tục thời gian thực, không tải file âm thanh ngoài.
3. **Cài đặt cá nhân hóa:**
   - Hỗ trợ đổi phím điều khiển, tùy chỉnh âm lượng và độ nhạy chuột được lưu vĩnh viễn trên trình duyệt (`localStorage`).

---

## 6. Tài Liệu Dự Án

- [AGENTS.md](AGENTS.md): Hướng dẫn điều phối AI Agent.
- [CHANGELOG.md](CHANGELOG.md): Toàn bộ nhật ký cập nhật qua 4 Phase.
- [docs/notes/retro.md](docs/notes/retro.md): Báo cáo tổng kết dự án & đánh giá sử dụng AI.
- [docs/notes/adr-001-lantern-fuel-and-win-rules.md](docs/notes/adr-001-lantern-fuel-and-win-rules.md): Quyết định kiến trúc ADR-001.
- [docs/proof/phase-1.md](docs/proof/phase-1.md), [phase-2.md](docs/proof/phase-2.md), [phase-3.md](docs/proof/phase-3.md): Hồ sơ bằng chứng nghiệm thu.
- [bench.json](bench.json) & [soak.json](soak.json): Kết quả đo đạc benchmark và soak test thực tế.
- [CREDITS.md](CREDITS.md) & [LICENSE](LICENSE): Bản quyền & giấy phép MIT.
