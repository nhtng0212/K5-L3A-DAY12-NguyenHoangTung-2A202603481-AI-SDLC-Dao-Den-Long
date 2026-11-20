import fs from 'fs';
import path from 'path';
import { GameState } from './core/gameState.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    seed: 1,
    night: 1,
    scenario: null,
    inputs: null,
    ticks: 0,
    out: null,
    snapshotEvery: 10
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--seed' && i + 1 < args.length) {
      options.seed = parseInt(args[++i], 10);
    } else if (arg === '--night' && i + 1 < args.length) {
      options.night = parseInt(args[++i], 10);
    } else if (arg === '--scenario' && i + 1 < args.length) {
      options.scenario = args[++i];
    } else if (arg === '--inputs' && i + 1 < args.length) {
      options.inputs = args[++i];
    } else if (arg === '--ticks' && i + 1 < args.length) {
      options.ticks = parseInt(args[++i], 10);
    } else if (arg === '--out' && i + 1 < args.length) {
      options.out = args[++i];
    } else if (arg === '--snapshot-every' && i + 1 < args.length) {
      options.snapshotEvery = parseInt(args[++i], 10);
    }
  }

  return options;
}

function loadScenario(filePath) {
  if (!filePath) return {};
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading scenario file ${filePath}:`, err.message);
    process.exit(2);
  }
}

function loadInputs(filePath) {
  if (!filePath) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.frames)) {
      console.error(`Invalid inputs file format: missing 'frames' array in ${filePath}`);
      process.exit(2);
    }
    let prevTick = -1;
    for (const frame of parsed.frames) {
      if (typeof frame.tick !== 'number' || frame.tick <= prevTick) {
        console.error(`Invalid inputs frames: non-increasing tick ${frame.tick}`);
        process.exit(2);
      }
      prevTick = frame.tick;
    }
    return parsed.frames;
  } catch (err) {
    console.error(`Error loading inputs file ${filePath}:`, err.message);
    process.exit(2);
  }
}

function run() {
  const options = parseArgs();

  if (!options.out) {
    console.error('Error: --out is required');
    process.exit(1);
  }

  if (isNaN(options.ticks) || options.ticks < 0) {
    console.error('Error: --ticks must be a non-negative integer');
    process.exit(1);
  }

  let tuning = {};
  try {
    const contractPath = path.resolve(process.cwd(), 'game.contract.json');
    if (fs.existsSync(contractPath)) {
      const contract = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
      if (contract.tuning) {
        tuning = contract.tuning;
      }
    }
  } catch (err) {}

  const scenario = loadScenario(options.scenario);
  const inputFrames = loadInputs(options.inputs);

  const game = new GameState(tuning, options.night);
  game.setup(scenario, options.seed);

  const outLines = [];

  // Snapshot tick 0
  outLines.push(JSON.stringify(game.getSnapshot()));

  let currentInput = {
    move: [0, 0],
    cam_yaw_deg: 0,
    interact: false,
    pulse: false,
    jump: false,
    dash: false,
    pause: false
  };

  let frameIdx = 0;
  const maxTicks = options.ticks;
  let finalTicks = 0;

  for (let k = 0; k < maxTicks; k++) {
    while (frameIdx < inputFrames.length && inputFrames[frameIdx].tick === k) {
      const f = inputFrames[frameIdx];
      if (f.move !== undefined) currentInput.move = f.move;
      if (f.cam_yaw_deg !== undefined) currentInput.cam_yaw_deg = f.cam_yaw_deg;
      if (f.interact !== undefined) currentInput.interact = f.interact;
      if (f.pulse !== undefined) currentInput.pulse = f.pulse;
      if (f.jump !== undefined) currentInput.jump = f.jump;
      if (f.dash !== undefined) currentInput.dash = f.dash;
      if (f.pause !== undefined) currentInput.pause = f.pause;
      frameIdx++;
    }

    const events = game.step(currentInput);
    finalTicks = game.tick;

    for (const ev of events) {
      outLines.push(JSON.stringify(ev));
    }

    if (options.snapshotEvery > 0 && finalTicks % options.snapshotEvery === 0) {
      outLines.push(JSON.stringify(game.getSnapshot()));
    }

    if (game.state === 'won' || game.state === 'lost') {
      break;
    }
  }

  const endLine = {
    type: 'end',
    ticks: finalTicks,
    state: game.state,
    score: game.score
  };
  outLines.push(JSON.stringify(endLine));

  try {
    const outDir = path.dirname(path.resolve(options.out));
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(options.out, outLines.join('\n') + '\n', 'utf-8');
  } catch (err) {
    console.error(`Error writing output file ${options.out}:`, err.message);
    process.exit(1);
  }

  process.exit(0);
}

run();
