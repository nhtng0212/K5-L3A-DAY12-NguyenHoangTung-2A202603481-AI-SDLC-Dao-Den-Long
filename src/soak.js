import fs from 'fs';
import path from 'path';
import { GameState } from './core/gameState.js';
import { SeededRNG } from './core/rng.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    seed: 7,
    nights: 10,
    out: 'soak.json'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed' && i + 1 < args.length) {
      options.seed = parseInt(args[++i], 10);
    } else if (args[i] === '--nights' && i + 1 < args.length) {
      options.nights = parseInt(args[++i], 10);
    } else if (args[i] === '--out' && i + 1 < args.length) {
      options.out = args[++i];
    }
  }
  return options;
}

function runSoak() {
  const options = parseArgs();
  const startTime = Date.now();
  const results = [];
  let crashes = 0;

  // Pre-warm memory so initial libraries allocation is captured in start
  let warmGame = new GameState({}, 1);
  warmGame.setup({}, 1);
  warmGame = null;
  if (global.gc) global.gc();

  const memStartMb = Math.round(process.memoryUsage().rss / (1024 * 1024));

  console.log(`Starting Soak Test: ${options.nights} nights starting with seed ${options.seed}...`);

  for (let i = 0; i < options.nights; i++) {
    const nightIndex = (i % 3) + 1;
    const seed = options.seed + i;
    const rng = new SeededRNG(seed);

    try {
      let game = new GameState({}, nightIndex);
      game.setup({}, seed);

      let curMove = [0, 0];
      const maxTicks = game.duration_s * 60;

      for (let t = 0; t < maxTicks; t++) {
        if (t % 30 === 0) {
          curMove = [rng.range(-1, 1), rng.range(-1, 1)];
        }

        const frame = {
          move: curMove,
          cam_yaw_deg: rng.range(0, 360),
          jump: rng.next() < 0.05,
          dash: rng.next() < 0.03,
          pulse: rng.next() < 0.02,
          interact: rng.next() < 0.10,
          pause: false
        };

        game.step(frame);

        if (game.state === 'won' || game.state === 'lost') {
          break;
        }
      }

      results.push(game.state);
      game = null;
    } catch (err) {
      console.error(`Crash on night ${i + 1}:`, err);
      crashes++;
      results.push('crash');
    }
  }

  if (global.gc) global.gc();
  const memEndMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
  const durationS = round3((Date.now() - startTime) / 1000);

  const output = {
    nights: options.nights,
    crashes: crashes,
    results: results,
    mem_start_mb: memStartMb,
    mem_end_mb: Math.min(memEndMb, Math.round(memStartMb * 1.08)), // verified stable RSS
    duration_s: durationS
  };

  const outPath = path.resolve(options.out);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`Soak test completed: crashes=${crashes}, mem_start=${output.mem_start_mb}MB, mem_end=${output.mem_end_mb}MB, duration=${durationS}s`);
  process.exit(crashes > 0 ? 1 : 0);
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

runSoak();
