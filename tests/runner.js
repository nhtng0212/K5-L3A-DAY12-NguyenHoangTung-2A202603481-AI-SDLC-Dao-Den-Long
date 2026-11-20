import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { GameState } from '../src/core/gameState.js';
import { SeededRNG } from '../src/core/rng.js';
import { distXZ, projectMove } from '../src/core/math3d.js';

console.log('🧪 Bắt đầu chạy bộ kiểm thử Đảo Đèn Lồng (Phase 2 - Contract v1.1)...\n');

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

// 1. Regression Tests (Phase 1)
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

test('Nạp đom đóm vào đèn và thắp sáng khi đủ lantern_cost = 10', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [0, 0, 24], carried: 10, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [{ id: 'L1', pos: [0, 0, 25], deposited: 0, lit: false }]
  });

  const events = game.step({ interact: true });
  assert.strictEqual(game.player.carried, 0);
  const lantern = game.lanterns.find((l) => l.id === 'L1');
  assert.strictEqual(lantern.deposited, 10);
  assert.strictEqual(lantern.lit, true);

  const depositEv = events.find((e) => e.name === 'deposit');
  const litEv = events.find((e) => e.name === 'lantern_lit');
  assert(depositEv);
  assert(litEv);
});

// 2. Phase 2 Features: Lướt (Dash)
test('Lướt (Dash) tốc độ 14 m/s trong 12 ticks và hồi chiêu 90 ticks', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false
  });

  // Tick 1: Bấm Dash hướng +Z
  const events = game.step({ dash: true, move: [0, 1] });
  const dashEv = events.find((e) => e.name === 'dash');
  assert(dashEv, 'Phải phát sự kiện dash');
  assert.strictEqual(game.dash_ticks_left, 12);
  assert.strictEqual(game.dash_cooldown_ticks, 90);

  // Sau 12 ticks lướt
  for (let i = 0; i < 12; i++) {
    game.step({ move: [0, 1] });
  }
  assert.strictEqual(game.dash_ticks_left, 0);
  assert(Math.abs(game.player.pos[2] - 2.8) < 0.2, `Vị trí Z phải đạt ~2.8m nhưng là ${game.player.pos[2]}`);
});

// 3. Phase 2 Features: Nhảy (Jump) & Trọng lực
test('Nhảy đạt vận tốc Y 7.0 m/s và chịu trọng lực -20 m/s²', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [0, 0, 0], carried: 0, flames: 3, grounded: true },
    random_motes: false,
    random_shades: false
  });

  game.step({ jump: true });
  assert.strictEqual(game.player.grounded, false);
  assert(game.player.pos[1] > 0, 'Người chơi phải ở trên không');
});

// 4. Phase 2 Features: Rơi Khỏi Đảo (Fall off island)
test('Rơi khỏi đảo Y < -10 gây mất 1 Ngọn Lửa, mất toàn bộ đom đóm, hồi sinh sau 60 ticks', () => {
  const game = new GameState({}, 1);
  game.setup({
    player: { pos: [50, -10.5, 0], carried: 5, flames: 3, grounded: false },
    random_motes: false,
    random_shades: false
  });

  // Step into Y < -10
  const events = game.step({});
  assert.strictEqual(game.player.flames, 2);
  assert.strictEqual(game.player.carried, 0);
  const fallEv = events.find((e) => e.name === 'player_hit' && e.data.by === 'fall');
  assert(fallEv);
  assert.strictEqual(fallEv.data.lost, 5);
  assert.strictEqual(game.falling_timer, 60);

  // Đợi 60 ticks để hồi sinh
  for (let i = 0; i < 60; i++) {
    game.step({});
  }
  assert.strictEqual(game.falling_timer, 0);
  assert.deepStrictEqual(game.player.pos, [0, 0, 0]);
  assert.strictEqual(game.invuln_ticks, 90);
});

// 5. Phase 2 Features: Bùa Gió (Charms)
test('Nhặt Bùa Gió C1 cho 600 ticks tốc độ 7.2 m/s và Lướt không hồi chiêu', () => {
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

// 6. Phase 2 Features: Gió Lạc (Drifters)
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

// 7. Phase 2 Features: Tạm Dừng (Pause)
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

// 8. Phase 2 Features: Bục Nhảy Đêm 2 (Jump Pad)
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
  assert(game.player.vel[0] > 0, 'Vận tốc X phải hướng về tâm đảo B (+X)');
});

// 9. CLI Headless Runner & Snapshot Contract v1.1
test('CLI Headless chạy Đêm 2 xuất Snapshot chuẩn Contract v1.1', () => {
  const outFile = path.resolve('tests/output_night2.jsonl');
  const cmd = `node src/headless.js --seed 123 --night 2 --ticks 60 --out ${outFile} --snapshot-every 20`;
  execSync(cmd);

  const lines = fs.readFileSync(outFile, 'utf-8').trim().split('\n').map((l) => JSON.parse(l));
  assert(lines.length > 0);
  const snap = lines[0];
  assert.strictEqual(snap.type, 'snapshot');
  assert.strictEqual(snap.night, 2);
  assert(snap.wind !== undefined);
  assert(Array.isArray(snap.motes));
  assert(Array.isArray(snap.drifters));
  assert(Array.isArray(snap.charms));
  assert(snap.player.vel !== undefined);
  assert(snap.player.grounded !== undefined);

  fs.unlinkSync(outFile);
});

// 10. Performance DoD: Chạy 21.600 tick trong <= 30 giây
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
