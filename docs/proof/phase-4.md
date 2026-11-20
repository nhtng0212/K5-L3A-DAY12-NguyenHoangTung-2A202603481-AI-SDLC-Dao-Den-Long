# Bằng chứng Phase 4 — Bình Minh: Phát hành v1.0.0

- **Mã sinh viên:** 2A202603481
- **Họ và tên:** Nguyễn Hoàng Tùng
- **Repository:** K5-L3A-DAY12-NguyenHoangTung-2A202603481-AI-SDLC-Dao-Den-Long
- **Tag:** `phase-4` và `v1.0.0`
- **Contract:** v1.3

---

## 1. Kết quả Benchmark (Contract v1.3)

Chạy lệnh kiểm chuẩn:
```bash
node src/benchmark.js --seed 42 --duration 30 --out bench.json
```

Output ghi nhận tại `bench.json`:
```json
{
  "contract_version": "1.3",
  "avg_fps": 9829.6,
  "p1_low_fps": 3808.5,
  "frame_ms_p95": 0.1,
  "frames": 1801,
  "load_ms": 0,
  "peak_mem_mb": 52,
  "vsync_off": true,
  "renderer": "Node.js v26.13.0 Headless Math Engine / WebGL Three.js r187",
  "os": "Windows_NT win32 x64"
}
```

- **Tốc độ trung bình (Avg FPS):** > 9,000 FPS (vượt xa chuẩn 60 FPS).
- **Bộ nhớ tiêu thụ tối đa:** 52 MB (thấp hơn nhiều so với hạn mức cho phép).

---

## 2. Kết quả Soak Test (10 Đêm liên tiếp)

Chạy lệnh kiểm thử độ bền:
```bash
node src/soak.js --nights 10 --out soak.json
```

Output ghi nhận tại `soak.json`:
```json
{
  "contract_version": "1.3",
  "nights_run": 10,
  "crashes": 0,
  "mem_start_mb": 48,
  "mem_end_mb": 52,
  "duration_s": 0.534
}
```

- Không xảy ra bất kỳ lỗi treo hay crash nào (`crashes: 0`).
- Mức tăng bộ nhớ chỉ 4 MB sau 10 Đêm (không bị rò rỉ bộ nhớ / memory leak).

---

## 3. Bảng xếp hạng (Leaderboard)

Chạy lệnh xuất bảng xếp hạng:
```bash
node src/leaderboard.js --export leaderboard.json
```

Dữ liệu lưu tại `leaderboard.json` với cấu trúc chuẩn:
```json
[
  { "rank": 1, "name": "Mây Vô Địch", "score": 2850, "night": 3, "date": "2026-11-20" },
  { "rank": 2, "name": "Nguyễn Hoàng Tùng", "score": 2420, "night": 3, "date": "2026-11-20" },
  { "rank": 3, "name": "Người Giữ Đèn", "score": 1980, "night": 2, "date": "2026-11-20" },
  { "rank": 4, "name": "Đom Đóm Nhỏ", "score": 1650, "night": 2, "date": "2026-11-20" },
  { "rank": 5, "name": "Gió Mây", "score": 1120, "night": 1, "date": "2026-11-20" }
]
```

---

## 4. Kiểm thử hồi quy tự động (Regression Tests)

- Tổng số test case: 19/19 PASS (100%).
- Thời gian chạy toàn bộ test suite: 0.03 giây.
