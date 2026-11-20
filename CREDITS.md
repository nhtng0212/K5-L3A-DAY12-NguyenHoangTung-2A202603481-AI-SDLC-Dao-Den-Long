# CREDITS

Dự án: Đảo Đèn Lồng (Lantern Island 3D)

## Thư viện & Công cụ
- Thư viện đồ họa 3D: [Three.js](https://threejs.org/) (Giấy phép MIT)
- Build tool: [Vite](https://vitejs.dev/) (Giấy phép MIT)
- Trợ lý AI hỗ trợ phát triển: Antigravity Agent (Google DeepMind)

## Tài nguyên 3D & Kết cấu (3D Models & Textures)
- Mô hình nhân vật Mây (`May.glb`), Đèn Lồng Chùa Cổ (`PagodaLantern.glb`), Bóng Mực (`InkShade.glb`), Cổng Làng & Rừng Trúc (`Scenery.glb`): Thiết kế và xuất tự động qua Three.js GLTFExporter, mã nguồn mở theo giấy phép MIT.
- Mô hình sinh vật đồng hành (`Fox.glb`) & Mẫu thử (`Duck.glb`): Khronos glTF Sample Assets ([Khronos Group](https://github.com/KhronosGroup/glTF-Sample-Assets)), giấy phép CC0 1.0 Universal / Public Domain.
- Kết cấu Procedural (Vải lụa hoa văn, Ngói âm dương mũi hài, Nón lá đan nan trúc, Đá phiến hoa cương): Tự động tổng hợp thời gian thực bằng HTML5 2D Canvas Engine chuyển sang Three.js CanvasTexture, 100% nguyên bản, độc lập và chạy offline.

## Âm thanh (Audio)
- Toàn bộ hiệu ứng âm thanh (Mote Chime, Đong dầu vào đèn, Chiêng thắp đèn, Sóng Tỏa Sáng, Lướt gió, Nhảy, Va chạm): Tự động tổng hợp thuật toán thời gian thực bằng Web Audio API (Sine / Triangle / Sawtooth Synthesizer), không dùng file âm thanh bên ngoài, 100% nguyên bản.
