# Đảo Đèn Lồng (Lantern Island) - Day 12 AI SDLC

> Sinh vien: Nguyen Hoang Tung - MSSV: 2A202603481
> Demo Video: [Link demo video](docs/demo/demo.mp4) (se hoan thien o Phase 4)

---

## 1. Huong dan cai dat va chay (Toi da 3 lenh)

```bash
# Lenh 1: Cai dat goi thu vien
npm install

# Lenh 2: Chay game giao dien 3D tren trinh duyet
npm run dev

# Lenh 3: Chay toan bo kiem thu tu dong
npm test
```

Sau khi chay `npm run dev`, mo trinh duyet tai `http://localhost:5173`.

---

## 2. Dieu khien va Co che game

- **W, A, S, D**: Di chuyen May.
- **Keo chuot**: Xoay goc nhin camera 3D.
- **E**: Nap dom dom vao Den Long Lon (khi dung cach den <= 3m).
- **F hoac Space**: Toa sang (Pulse) xua duoi va lam choang Bong Muc trong ban kinh 5m (tieu hao 1 dom dom).
- **Nut Choi Lai**: Reset man choi khi Thang hoac Thua.

---

## 3. Cach tinh diem (Scoring System)

- Nhat dom dom: +10 diem / con.
- Thap sang Den Lon: +200 diem / den.
- Lam choang Bong Muc: +20 diem / lan.
- Thuong khi thang: `(so giay con lai * 5) + (so ngon lua mau con lai * 100)`.

---

## 4. Test Contract v1.0 va Che do Headless

Cau hinh tuning tai file `game.contract.json`.
Che do headless chay khong can GPU/DOM:

```bash
node src/headless.js --seed 42 --night 1 --ticks 180 --out docs/proof/sample_headless.jsonl --snapshot-every 60
```

Hoac chay voi scenario va inputs:

```bash
node src/headless.js --seed 123 --night 1 --scenario scenario.json --inputs inputs.json --ticks 300 --out output.jsonl
```

---

## 5. Sang tao cua toi (My Creations)

1. **Hinh tuong May gan lien voi non la truyen thong**: Non la gan chiec den long nho tren chop non toa anh sang am ap.
2. **Am thanh tu sinh bang Web Audio API**: Khong can file mp3/wav ngoai, tu tao chuong ngan, tieng gong thap den, tieng song toa sang va tieng canh bao.
3. **Vong sang bao ve quanh den (Safe Zone)**: Khi den sang, xuat hien quan sang tren mat dat ngan khong cho Bong Muc tien vao.
4. **Bao toan Test Contract**: Toan bo tinh nang sang tao do hoa/am thanh nam o lop hien thi web, khong lam anh huong den output cua che do headless.

---

## 6. Tai lieu bo sung

- [AGENTS.md](AGENTS.md): Quy uoc va lenh cho AI agent.
- [docs/notes/assumptions.md](docs/notes/assumptions.md): Gia dinh thiet ke Phase 1.
- [docs/notes/ai_log.md](docs/notes/ai_log.md): Nhat ky su dung AI va uoc tinh token.
- [docs/proof/phase-1.md](docs/proof/phase-1.md): Bang chung kiem chung chi tiet.
- [CREDITS.md](CREDITS.md): Ghi nguon thu vien va asset.
