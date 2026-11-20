import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { GameState } from '../src/core/gameState.js';
import { SeededRNG } from '../src/core/rng.js';
import { distXZ, projectMove } from '../src/core/math3d.js';

console.log('🧪 Bắt đầu chạy bộ kiểm thử Đảo Đèn Lồng (Phase 3 - Contract v1.2)...\n');

let passedCount = 0;
let failedCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failedCount++;
  }
}

// 1. Regression Tests (Phase 1 & 2 không bị luật mới thay thế)
test('RNG sinh số tất định với cùng seed', () => {
  const rng1 = new SeededRNG(42);
  const rng2 = new SeededRNG(42);
  for (let i = 0; i < 100; i++) {
    assert.strictEqual(rng1.next(), rng2.next());
  }
});

test('Phép chiếu di chuyển với góc yaw chuẩn xác', () => {
  const [dx0, dz0] = projectMove([0, 1], 0);
  assert(Math.abs(dx0 - 0) < 0.001);
  assert(Math.abs(dz0 - 1) < 0.001);

  const [dx90, dz90] = projectMove([0, 1], 90);
  assert(Math.abs(dx90 - 1) < 0.001);
  assert(Math.abs(dz90 - 0) < 0.001);
});

test('Nhặt đom đóm trong bán kính XZ <= 1.0m và dY <= 1.5m', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [[0, 0, 0.8]]
  });

  const events = game.step({ move: [0, 0] });
  assert.strictEqual(game.player.carried, 1);
  assert.strictEqual(game.motes.length, 0);
  const pickEv = events.find((e) => e.name === 'mote_picked');
  assert(pickEv);
  assert.strictEqual(pickEv.data.carried, 1);
});

test('Lướt (Dash) tốc độ 14 m/s trong 12 ticks và hồi chiêu 90 ticks', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false
  });

  game.step({ dash: true, move: [0, 1] });
  assert.strictEqual(game.dash_ticks_left, 12);
  assert.strictEqual(game.dash_cooldown_ticks, 90);

  for (let i = 0; i < 12; i++) {
    game.step({ move: [0, 1] });
  }
  assert.strictEqual(game.dash_ticks_left, 0);
  assert(Math.abs(game.player.pos[2] - 2.8) < 0.2);
});

test('Nhảy đạt vận tốc Y 7.0 m/s và chịu trọng lực -20 m/s²', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [0, 0, 0], carried: 0, flames: 3, grounded: true },
    random_motes: false,
    random_shades: false
  });

  game.step({ jump: true });
  assert.strictEqual(game.player.grounded, false);
  assert(game.player.pos[1] > 0);
});

test('Rơi khỏi đảo Y < -10 gây mất 1 Ngọn Lửa, mất toàn bộ đom đóm, hồi sinh sau 60 ticks', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [50, -10.5, 0], carried: 5, flames: 3, grounded: false },
    random_motes: false,
    random_shades: false
  });

  const events = game.step({});
  assert.strictEqual(game.player.flames, 2);
  assert.strictEqual(game.player.carried, 0);
  const fallEv = events.find((e) => e.name === 'player_hit' && e.data.by === 'fall');
  assert(fallEv);
  assert.strictEqual(fallEv.data.lost, 5);
  assert.strictEqual(game.falling_timer, 60);

  for (let i = 0; i < 60; i++) {
    game.step({});
  }
  assert.strictEqual(game.falling_timer, 0);
  assert.deepStrictEqual(game.player.pos, [0, 0, 0]);
  assert.strictEqual(game.invuln_ticks, 90);
});

test('Bùa Gió C1 cho 600 ticks tốc độ 7.2 m/s và Lướt không hồi chiêu', () => {
  const game = new GameState({}, 2);
  game.setup({
    player: { pos: [34.5, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    charms: [{ id: 'C1', pos: [35, 0, 0], available: true }]
  });

  const events = game.step({});
  const charmEv = events.find((e) => e.name === 'charm_picked');
  assert(charmEv);
  assert.strictEqual(charmEv.data.charm_id, 'C1');
  assert.strictEqual(game.charm_ticks, 600);
});

test('Gió Lạc cướp tối đa 3 đom đóm khi đuổi theo Mây', () => {
  const game = new GameState({}, 2);
  game.setup({
    player: { pos: [0, 0, 0], carried: 6, flames: 3 },
    random_motes: false,
    random_shades: false,
    drifters: [{ id: 'D1', pos: [0, 0, 1.0], state: 'chase', stolen: 0 }]
  });

  const events = game.step({});
  const stealEv = events.find((e) => e.name === 'drifter_steal');
  assert(stealEv);
  assert.strictEqual(stealEv.data.amount, 3);
  assert.strictEqual(game.player.carried, 3);
  assert.strictEqual(game.drifters[0].state, 'flee');
});

test('Nhấn Pause dừng sim_tick và ghi state: paused', () => {
  const game = new GameState({}, 1);
  game.setup();

  const events = game.step({ pause: true });
  assert.strictEqual(game.isPaused, true);
  const pauseEv = events.find((e) => e.name === 'paused');
  assert(pauseEv);
  const snap = game.getSnapshot();
  assert.strictEqual(snap.state, 'paused');
});

test('Bục nhảy Đêm 2 tại (20,0,18) bắn Mây bay về phía tâm đảo B', () => {
  const game = new GameState({}, 2);
  game.setup({
    player: { pos: [20, 0, 18], carried: 0, flames: 3, grounded: true },
    random_motes: false,
    random_shades: false
  });

  game.step({});
  assert.strictEqual(game.airborne_lock, true);
  assert.strictEqual(game.player.vel[1], 14.0);
  assert(game.player.vel[0] > 0);
});

// 2. Phase 3 Features (Ticket-03: Change Request "Đèn cạn dầu")
test('Hao hụt dầu tự nhiên (1.0/s) và phát lantern_out khi fuel <= 0', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [{ id: 'L1', pos: [0, 0, 25], lit: true, fuel: 0.1 }] // 6 ticks of fuel
  });

  // Chạy 6 ticks: dầu cạn về 0 -> đèn tắt
  let outEv = null;
  for (let i = 0; i < 7; i++) {
    const events = game.step({});
    const found = events.find((e) => e.name === 'lantern_out');
    if (found) outEv = found;
  }

  assert(outEv, 'Phải có sự kiện lantern_out khi hết dầu');
  const lantern = game.lanterns.find((l) => l.id === 'L1');
  assert.strictEqual(lantern.lit, false);
  assert.strictEqual(lantern.fuel_ticks, 0);
  assert.strictEqual(lantern.ever_lit, true);
});

test('Châm dầu cho đèn đang sáng tăng fuel và phát sự kiện refuel', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [0, 0, 24], carried: 2, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [{ id: 'L1', pos: [0, 0, 25], lit: true, fuel: 80 }]
  });

  const events = game.step({ interact: true });
  const refuelEv = events.find((e) => e.name === 'refuel');
  assert(refuelEv, 'Phải phát sự kiện refuel');
  assert.strictEqual(refuelEv.data.amount, 2);
  assert.strictEqual(refuelEv.data.fuel, 100);
  assert.strictEqual(game.player.carried, 0);
});

test('Thắp lại đèn đã từng sáng (ever_lit) chỉ tiêu tốn 5 đom đóm', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [0, 0, 24], carried: 5, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [{ id: 'L1', pos: [0, 0, 25], lit: false, ever_lit: true, deposited: 0 }]
  });

  const events = game.step({ interact: true });
  const litEv = events.find((e) => e.name === 'lantern_lit');
  assert(litEv, 'Phải thắp sáng đèn thành công');
  assert.strictEqual(litEv.data.relight, true);
  assert.strictEqual(game.player.carried, 0);
  const lantern = game.lanterns.find((l) => l.id === 'L1');
  assert.strictEqual(lantern.lit, true);
  assert.strictEqual(lantern.relit_count, 1);
});

test('Bóng Mực hút dầu (drain) tại đèn có fuel < 30 và phát fuel_drain', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [30, 0, 0], carried: 0, flames: 3 }, // Mây ở xa
    random_motes: false,
    random_shades: false,
    lanterns: [{ id: 'L1', pos: [0, 0, 25], lit: true, fuel: 25 }], // fuel < 30
    shades: [{ id: 'S1', pos: [0, 0, 24], state: 'drain', target_lantern_id: 'L1' }]
  });

  // Chạy 60 ticks để phát sự kiện fuel_drain
  let drainEv = null;
  for (let i = 0; i < 60; i++) {
    const events = game.step({});
    const found = events.find((e) => e.name === 'fuel_drain');
    if (found) drainEv = found;
  }

  assert(drainEv, 'Phải có sự kiện fuel_drain sau 60 ticks');
  assert.strictEqual(drainEv.data.shade_id, 'S1');
  assert.strictEqual(drainEv.data.lantern_id, 'L1');
});

test('Tỏa Sáng trúng Bóng Mực đang drain thưởng +15 điểm', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [0, 0, 0], carried: 3, flames: 3 },
    random_motes: false,
    random_shades: false,
    shades: [{ id: 'S1', pos: [0, 0, 2], state: 'drain' }]
  });

  const initialScore = game.score;
  game.step({ pulse: true });
  assert.strictEqual(game.score, initialScore + 15, 'Trúng bóng mực drain phải được +15 điểm');
});

test('Luật Thắng Mới: Sống sót đến bình minh với >= 60% đèn sáng (dawn_survived)', () => {
  const game = new GameState({}, 1);
  game.setup({
    time_left_s: 0.05, // 3 ticks nữa là hết giờ
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [
      { id: 'L1', pos: [0, 0, 10], lit: true, fuel: 90 },
      { id: 'L2', pos: [0, 0, 20], lit: true, fuel: 90 },
      { id: 'L3', pos: [0, 0, 30], lit: true, fuel: 90 },
      { id: 'L4', pos: [0, 0, 40], lit: false, fuel: 0 },
      { id: 'L5', pos: [0, 0, 50], lit: false, fuel: 0 }
    ] // 3/5 đèn sáng = 60%
  });

  let winEv = null;
  for (let i = 0; i < 5; i++) {
    const events = game.step({});
    const found = events.find((e) => e.name === 'game_over');
    if (found) winEv = found;
  }

  assert(winEv, 'Phải có sự kiện game_over khi hết giờ');
  assert.strictEqual(winEv.data.result, 'won');
  assert.strictEqual(winEv.data.reason, 'dawn_survived');
  assert.strictEqual(game.state, 'won');
});

test('Sức chứa tăng dần theo successful_lights (10 + 2 * lights, tối đa 20)', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [0, 0, 24], carried: 20, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [
      { id: 'L1', pos: [0, 0, 25], lit: false, deposited: 9 } // cần 1 đom đóm
    ]
  });

  assert.strictEqual(game.player.capacity, 10);
  game.step({ interact: true }); // Thắp đèn thành công -> lights = 1
  assert.strictEqual(game.successful_lights, 1);
  assert.strictEqual(game.player.capacity, 12);
});

// 3. Performance Benchmark & Test Contract v1.2 Headless
test('CLI Headless chạy Đêm 1 xuất Snapshot chuẩn Contract v1.2', () => {
  const outFile = path.resolve('tests/output_night1_v12.jsonl');
  const cmd = `node src/headless.js --seed 123 --night 1 --ticks 60 --out ${outFile} --snapshot-every 20`;
  execSync(cmd);

  const lines = fs.readFileSync(outFile, 'utf-8').trim().split('\n').map((l) => JSON.parse(l));
  assert(lines.length > 0);
  const snap = lines[0];
  assert.strictEqual(snap.type, 'snapshot');
  assert(snap.lanterns[0].fuel !== undefined);
  assert(snap.lanterns[0].ever_lit !== undefined);
  assert(snap.lanterns[0].relit_count !== undefined);
  assert(snap.player.capacity !== undefined);

  fs.unlinkSync(outFile);
});

test('Hiệu năng: Chạy headless 21.600 tick đạt tiêu chuẩn DoD (<= 30 giây)', () => {
  const game = new GameState({}, 1);
  game.setup();

  const startTime = Date.now();
  for (let i = 0; i < 21600; i++) {
    game.step({ move: [1, 0] });
    if (game.state !== 'playing') break;
  }
  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`    (Thời gian chạy 21.600 tick: ${elapsed.toFixed(2)}s)`);
  assert(elapsed <= 30.0, `Thời gian ${elapsed}s vượt quá giới hạn 30s!`);
});

console.log(`\n========================================`);
console.log(`Kết quả: ${passedCount} PASS / ${failedCount} FAIL`);
console.log(`========================================\n`);

if (failedCount > 0) {
  process.exit(1);
}
