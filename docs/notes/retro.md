# Báo Cáo Tổng Kết & Đánh Giá Dự Án (Retro — Day 12 AI SDLC)

- **Học viên:** Nguyễn Hoàng Tùng (MSSV: 2A202603481)
- **Lớp:** K5-L3A
- **Dự án:** Đảo Đèn Lồng (Lantern Island) — Phiên bản phát hành `v1.0.0`
- **Ngày hoàn thành:** 20/11/2026

---

## 1. Tổng Kết Đánh Giá Qua 4 Phase (Evaluation)

| Phase | Mục tiêu | Kết quả đạt được | Trạng thái |
|---|---|---|---|
| **Phase 1** | Xây dựng lõi game 3D Đảo Bến, Test Contract v1.0, cơ chế nhặt đom đóm, thắp đèn, né Bóng Mực | Hoàn thành trong 45 phút, 9/9 test PASS, mô hình tất định chính xác từng byte | **Hoàn thành (tag `phase-1`)** |
| **Phase 2** | Chuẩn hóa số liệu, mở rộng 3 Đêm, nhảy, lướt (Dash), bục nhảy, Gió Lạc (Drifter), Bùa Gió (Charm), Contract v1.1 | 13/13 test PASS, hiệu năng 21.600 tick đạt 0.02s, bổ sung animation mượt mà | **Hoàn thành (tag `phase-2`)** |
| **Phase 3** | Xử lý Change Request "Đèn cạn dầu": fuel decay, Bóng Mực hút dầu (`drain`), luật thắng mới `dawn_survived`, Contract v1.2 | Viết ADR-001, CHANGELOG, 19/19 test PASS, tích hợp chế độ Colorblind | **Hoàn thành (tag `phase-3`)** |
| **Phase 4** | Benchmark mode, Soak test 10 đêm, Bảng xếp hạng, Dễ tiếp cận, Release v1.0.0 | Đạt avg FPS 9878, Soak test 0 crash, mem leak = 0%, đóng gói toàn diện | **Hoàn thành (tag `phase-4`, Release `v1.0.0`)** |

---

## 2. Quá Trình Làm Việc Với AI (What Worked vs What Didn't)

### Những điều hiệu quả (What Worked):
1. **Thiết kế kiến trúc tách rời (Decoupled Architecture):** Tách bạch 100% giữa Game Simulation Core (chạy độc lập không cần DOM/GPU trên Node.js) và View 3D (Three.js WebGL). Nhờ đó, AI có thể viết test và chạy nghiệm thu chỉ trong 0.02s mà không cần mở trình duyệt.
2. **Khai thác AI theo phương pháp TDD (Test-Driven Development):** Xác định tiêu chí nghiệm thu và Test Contract trước, để AI sinh test case rồi mới viết implementation.
3. **Batching Commands & File Writes:** Gộp các thao tác đọc/ghi file và thực thi lệnh bằng chuỗi lệnh ghép giúp tiết kiệm turn và giữ ngữ cảnh tập trung.

### Những lần AI mắc lỗi & Cách phát hiện, khắc phục:
1. **Lỗi đảo chiều phím A và D:**
   - *Phát hiện:* Người dùng chơi thử phát hiện bấm A đi sang phải, bấm D đi sang trái.
   - *Nguyên nhân:* AI tính toán vector theo hệ tọa độ toán học gốc nhìn từ trục Z dương nhưng chưa tính góc nghịch đảo của camera Three.js khi nhìn ngược về gốc tọa độ.
   - *Khắc phục:* Đảo dấu trục $X$ trong bộ điều khiển input của camera.
2. **Lỗi khựng/lag khi nhặt đom đóm (Micro-stutter):**
   - *Phát hiện:* Người chơi nhận thấy mỗi lần chạm vào đom đóm khung hình bị khựng 1 nhịp.
   - *Nguyên nhân:* AI đã gán một `PointLight` động cho mỗi đom đóm (25 điểm sáng động) và gọi `innerHTML` trên HUD liên tục mỗi tick làm nghẽn GPU shader và kích hoạt Garbage Collection.
   - *Khắc phục:* Thay thế bằng vật liệu tự phát sáng (dual-layer glow sprite) và cơ chế DOM diffing chỉ render khi giá trị số liệu thay đổi.
3. **Lỗi hiểu sai breaking change ở Phase 3:**
   - *Phát hiện:* Bộ test cũ ở Phase 1 kỳ vọng thắp đủ đèn sẽ thắng ngay lập tức (`all_lit`), nhưng Ticket-03 đã bãi bỏ cơ chế này và chuyển sang sống sót đến bình minh.
   - *Khắc phục:* AI cập nhật lại test case theo luật mới, viết ADR-001 và CHANGELOG giải trình minh bạch.

---

## 3. Harness AI Nào Giúp Ích Nhiều Nhất?

1. **File hướng dẫn `AGENTS.md`:** Là mỏ neo ngữ cảnh quan trọng nhất. Mỗi khi có luật mới hoặc lệnh kiểm thử mới, việc cập nhật `AGENTS.md` giúp AI luôn nhớ lệnh build, lệnh test, và các ràng buộc cấm kỵ (như không bao giờ sửa tay output bằng chứng).
2. **Tài liệu ADR (Architectural Decision Records):** Giúp kiểm soát các thay đổi phá vỡ tương thích (breaking changes) giữa các Phase, tránh việc AI vô thức khôi phục lại code cũ.
3. **Hệ thống Test Contract JSON & Headless Runner:** Đóng vai trò như một bộ hợp đồng giao tiếp chuẩn xác, loại bỏ hoàn toàn các giả định sai lệch giữa yêu cầu nghiệp vụ và code thực thi.

---

## 4. Quản Lý & Ước Tính Token

- **Phase 1:** ~25,000 tokens.
- **Phase 2:** ~35,000 tokens.
- **Phase 3:** ~30,000 tokens.
- **Phase 4:** ~30,000 tokens.
- **Tổng cộng 4 Phase:** ~120,000 tokens.
- **Chiến lược tiết kiệm token đã áp dụng:**
  - Giữ `AGENTS.md` súc tích, ngắn gọn dưới 50 dòng.
  - Sử dụng các lệnh ghép `&&` và `;` để kiểm tra kết quả trong 1 lượt chạy duy nhất.
  - Thiết kế kiến trúc chuẩn ngay từ đầu để hạn chế tối đa việc phải refactor đập đi xây lại.

---

## 5. Bài Học Kinh Nghiệm (Nếu Làm Lại Từ Đầu Sẽ Đổi Gì?)

1. **Thiết kế ngay mô hình State Machine đa trạng thái cho thực thể:** Thay vì viết các câu lệnh `if-else` lồng nhau ở Phase 1, nếu ngay từ đầu thiết kế các state (`wander`, `chase`, `drain`, `recoil`, `stunned`) theo mẫu State Machine chuẩn thì việc tích hợp Phase 3 sẽ diễn ra nhanh hơn nữa.
2. **Kiểm tra độ mượt đồ họa ngay từ frame đầu tiên:** Tránh sử dụng quá nhiều Dynamic Point Lights trong Three.js; ưu tiên dùng Emissive Materials và Ambient Lighting tăng dần theo tiến độ chơi.
