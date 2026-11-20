import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { GameState } from '../src/core/gameState.js';
import { SeededRNG } from '../src/core/rng.js';
import { distXZ, projectMove } from '../src/core/math3d.js';

console.log('🧪 Bắt đầu chạy bộ kiểm thử Đảo Đèn Lồng (Phase 1)...\n');

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

// 1. Test RNG
test('RNG sinh số tất định với cùng seed', () => {
  const rng1 = new SeededRNG(42);
  const rng2 = new SeededRNG(42);
  for (let i = 0; i < 100; i++) {
    assert.strictEqual(rng1.next(), rng2.next());
  }
});

// 2. Test Movement Projection
test('Phép chiếu di chuyển với góc yaw chuẩn xác', () => {
  // yaw = 0: move [0, 1] -> +Z direction [0, 1]
  const [dx0, dz0] = projectMove([0, 1], 0);
  assert(Math.abs(dx0 - 0) < 0.001);
  assert(Math.abs(dz0 - 1) < 0.001);

  // yaw = 90 deg: move [0, 1] -> +X direction [1, 0]
  const [dx90, dz90] = projectMove([0, 1], 90);
  assert(Math.abs(dx90 - 1) < 0.001);
  assert(Math.abs(dz90 - 0) < 0.001);
});

// 3. Test Nhặt Đom Đóm (Mote Pickup)
test('Nhặt đom đóm khi người chơi đi vào bán kính pickup_radius', () => {
  const game = new GameState({ pickup_radius: 2.0 });
  game.setup({
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [[0, 0, 1.0]]
  });

  const events = game.step({ move: [0, 0] });
  assert.strictEqual(game.player.carried, 1);
  assert.strictEqual(game.motes.length, 0);
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].name, 'mote_picked');
  assert.strictEqual(events[0].data.carried, 1);
});

// 4. Test Nạp Ánh Sáng và Thắp Đèn (Deposit & Lit)
test('Nạp đom đóm vào đèn và thắp sáng khi đủ lantern_cost', () => {
  const game = new GameState({ interact_radius: 3.0, lantern_cost: 3 });
  game.setup({
    player: { pos: [0, 0, 24], carried: 3, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [{ id: 'L1', pos: [0, 0, 25], deposited: 0, lit: false }]
  });

  // Step 1: Nhấn interact
  const events = game.step({ interact: true });
  assert.strictEqual(game.player.carried, 0);
  const lantern = game.lanterns.find((l) => l.id === 'L1');
  assert.strictEqual(lantern.deposited, 3);
  assert.strictEqual(lantern.lit, true);

  const depositEv = events.find((e) => e.name === 'deposit');
  const litEv = events.find((e) => e.name === 'lantern_lit');
  assert(depositEv, 'Phải có sự kiện deposit');
  assert(litEv, 'Phải có sự kiện lantern_lit');
});

// 5. Test Tỏa Sáng (Pulse)
test('Tỏa sáng làm choáng và đẩy lùi Bóng Mực', () => {
  const game = new GameState({ pulse_cost: 1, pulse_radius: 5.0, pulse_push_m: 4.0 });
  game.setup({
    player: { pos: [0, 0, 0], carried: 2, flames: 3 },
    random_motes: false,
    random_shades: false,
    shades: [{ id: 'S1', pos: [0, 0, 3] }]
  });

  const events = game.step({ pulse: true });
  assert.strictEqual(game.player.carried, 1);
  const shade = game.shades.find((s) => s.id === 'S1');
  assert.strictEqual(shade.state, 'stunned');
  assert(shade.pos[2] >= 7.0, 'Bóng mực phải bị đẩy lùi xa người chơi');

  const pulseEv = events.find((e) => e.name === 'pulse');
  assert(pulseEv);
  assert.deepStrictEqual(pulseEv.data.stunned_ids, ['S1']);
});

// 6. Test Bóng Mực Tấn Công (Shade Hit & Flames Loss)
test('Bóng mực chạm vào người chơi gây mất máu và rơi đom đóm', () => {
  const game = new GameState({ shade_hit_radius: 1.5, hit_drop_ratio: 0.5 });
  game.setup({
    player: { pos: [0, 0, 0], carried: 4, flames: 3 },
    random_motes: false,
    random_shades: false,
    shades: [{ id: 'S1', pos: [0, 0, 1.0] }]
  });

  const events = game.step({});
  assert.strictEqual(game.player.flames, 2);
  assert.strictEqual(game.player.carried, 2); // 4 - floor(4*0.5) = 2

  const hitEv = events.find((e) => e.name === 'player_hit');
  assert(hitEv);
  assert.strictEqual(hitEv.data.flames, 2);
  assert.strictEqual(hitEv.data.dropped, 2);
});

// 7. Test Điều Kiện Thắng (Thắp đủ 5 đèn)
test('Thắp sáng cả 5 đèn kích hoạt game_over result won', () => {
  const game = new GameState({ lantern_cost: 1 });
  game.setup({
    player: { pos: [0, 0, 24], carried: 1, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [
      { id: 'L1', pos: [0, 0, 25], deposited: 0, lit: false },
      { id: 'L2', pos: [10, 0, 0], deposited: 1, lit: true },
      { id: 'L3', pos: [20, 0, 0], deposited: 1, lit: true },
      { id: 'L4', pos: [30, 0, 0], deposited: 1, lit: true },
      { id: 'L5', pos: [40, 0, 0], deposited: 1, lit: true }
    ]
  });

  const events = game.step({ interact: true });
  assert.strictEqual(game.state, 'won');
  const winEv = events.find((e) => e.name === 'game_over');
  assert(winEv);
  assert.strictEqual(winEv.data.result, 'won');
  assert.strictEqual(winEv.data.reason, 'all_lit');
});

// 8. Test Chế Độ Headless CLI & Tính Tất Định (Determinism)
test('Chạy CLI headless 2 lần độc lập sinh output giống hệt nhau (Determinism)', () => {
  const out1 = path.resolve('tests/output_run1.jsonl');
  const out2 = path.resolve('tests/output_run2.jsonl');

  const cmd1 = `node src/headless.js --seed 123 --night 1 --ticks 100 --out ${out1} --snapshot-every 20`;
  const cmd2 = `node src/headless.js --seed 123 --night 1 --ticks 100 --out ${out2} --snapshot-every 20`;

  execSync(cmd1);
  execSync(cmd2);

  const content1 = fs.readFileSync(out1, 'utf-8');
  const content2 = fs.readFileSync(out2, 'utf-8');

  assert.strictEqual(content1, content2, 'Hai lần chạy phải ra kết quả hoàn toàn trùng khớp');
  // Clean up
  fs.unlinkSync(out1);
  fs.unlinkSync(out2);
});

// 9. Test CLI Headless với Scenario và Inputs
test('CLI Headless chạy với scenario và inputs file', () => {
  const scenarioFile = path.resolve('tests/test_scenario.json');
  const inputsFile = path.resolve('tests/test_inputs.json');
  const outFile = path.resolve('tests/test_out.jsonl');

  fs.writeFileSync(
    scenarioFile,
    JSON.stringify({
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      motes: [[0, 0, 3]],
      lanterns: [{ id: 'L1', pos: [0, 0, 10], deposited: 0 }]
    })
  );

  fs.writeFileSync(
    inputsFile,
    JSON.stringify({
      frames: [
        { tick: 0, move: [0, 1], cam_yaw_deg: 0 },
        { tick: 35, move: [0, 0] }
      ]
    })
  );

  execSync(`node src/headless.js --seed 999 --night 1 --scenario ${scenarioFile} --inputs ${inputsFile} --ticks 50 --out ${outFile} --snapshot-every 10`);

  const lines = fs.readFileSync(outFile, 'utf-8').trim().split('\n').map((l) => JSON.parse(l));
  assert(lines.length > 0);
  assert.strictEqual(lines[0].type, 'snapshot');
  assert.strictEqual(lines[lines.length - 1].type, 'end');

  // Verify mote was picked during forward movement
  const pickedEv = lines.find((l) => l.type === 'event' && l.name === 'mote_picked');
  assert(pickedEv, 'Người chơi phải nhặt được đom đóm');

  fs.unlinkSync(scenarioFile);
  fs.unlinkSync(inputsFile);
  fs.unlinkSync(outFile);
});

console.log(`\n========================================`);
console.log(`Kết quả: ${passedCount} PASS / ${failedCount} FAIL`);
console.log(`========================================\n`);

if (failedCount > 0) {
  process.exit(1);
}
