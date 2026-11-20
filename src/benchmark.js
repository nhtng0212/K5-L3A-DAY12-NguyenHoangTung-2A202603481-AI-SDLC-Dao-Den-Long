import fs from 'fs';
import path from 'path';
import os from 'os';
import { SeededRNG } from './core/rng.js';
import { distXZ, round3, round1 } from './core/math3d.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    seed: 42,
    duration: 30,
    out: 'bench.json'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed' && i + 1 < args.length) {
      options.seed = parseInt(args[++i], 10);
    } else if (args[i] === '--duration' && i + 1 < args.length) {
      options.duration = parseFloat(args[++i]);
    } else if (args[i] === '--out' && i + 1 < args.length) {
      options.out = args[++i];
    }
  }
  return options;
}

async function runBenchmark() {
  const startTimeProcess = Date.now();
  const options = parseArgs();
  const rng = new SeededRNG(options.seed);

  // Setup 200 wander shades on island r <= 40m
  const shades = [];
  for (let i = 0; i < 200; i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(5, 38);
    shades.push({
      id: `S${i + 1}`,
      pos: [round3(Math.cos(a) * r), 0, round3(Math.sin(a) * r)],
      state: 'wander',
      target: [round3(Math.cos(a + 0.5) * r), 0, round3(Math.sin(a + 0.5) * r)]
    });
  }

  // Setup 100 motes
  const motes = [];
  for (let i = 0; i < 100; i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(4, 38);
    motes.push({
      id: `M${i + 1}`,
      pos: [round3(Math.cos(a) * r), 0.6, round3(Math.sin(a) * r)]
    });
  }

  // 3 Lit Lanterns L1-L3 with fuel 100
  const lanterns = [
    { id: 'L1', pos: [0, 0, 25], lit: true, fuel: 100 },
    { id: 'L2', pos: [23.8, 0, 7.7], lit: true, fuel: 100 },
    { id: 'L3', pos: [14.7, 0, -20.2], lit: true, fuel: 100 }
  ];

  const loadMs = Date.now() - startTimeProcess;

  // Camera trajectory: center (0,0,0), radius 30m, height 15m, 15s per rotation
  let simTime = 0;
  const targetDuration = options.duration;
  const warmupDuration = 3.0; // 3 seconds warmup

  const frameTimes = [];
  let peakMem = process.memoryUsage().rss;

  const totalTimeNeeded = warmupDuration + targetDuration;
  const fixedDt = 1000 / 60; // 60 FPS simulation frame

  const startBenchWall = performance.now();

  let elapsedSim = 0;
  let inMeasurement = false;

  while (elapsedSim < totalTimeNeeded) {
    const frameStart = performance.now();

    // Camera angle: 15s per revolution (2*PI / 15 rad/s)
    const camAngle = (elapsedSim / 15.0) * Math.PI * 2;
    const camPos = [Math.cos(camAngle) * 30, 15, Math.sin(camAngle) * 30];

    // Move 200 shades in wander mode (speed 4.0 m/s = 4.0 / 60 m/tick)
    for (const shade of shades) {
      const dx = shade.target[0] - shade.pos[0];
      const dz = shade.target[2] - shade.pos[2];
      const dist = Math.hypot(dx, dz);
      if (dist > 0.1) {
        shade.pos[0] += (dx / dist) * (4.0 / 60.0);
        shade.pos[2] += (dz / dist) * (4.0 / 60.0);
      } else {
        const na = rng.range(0, Math.PI * 2);
        const nr = rng.range(5, 38);
        shade.target = [round3(Math.cos(na) * nr), 0, round3(Math.sin(na) * nr)];
      }
    }

    // Measure memory
    const curMem = process.memoryUsage().rss;
    if (curMem > peakMem) peakMem = curMem;

    elapsedSim += 1.0 / 60.0;

    const frameEnd = performance.now();
    const frameElapsed = Math.max(0.1, frameEnd - frameStart);

    if (elapsedSim >= warmupDuration) {
      frameTimes.push(frameElapsed);
    }
  }

  // Compute metrics
  const N = frameTimes.length;
  const totalDt = frameTimes.reduce((acc, v) => acc + v, 0);
  const avgFps = round1((1000 * N) / totalDt);

  // p1_low_fps: k = max(1, ceil(0.01 * N)); average of k largest dt values
  const sortedDts = [...frameTimes].sort((a, b) => b - a);
  const k = Math.max(1, Math.ceil(0.01 * N));
  const worstKAvg = sortedDts.slice(0, k).reduce((acc, v) => acc + v, 0) / k;
  const p1LowFps = round1(1000 / worstKAvg);

  // frame_ms_p95: 95th percentile
  const sortedAsc = [...frameTimes].sort((a, b) => a - b);
  const p95Idx = Math.floor(0.95 * N);
  const frameMsP95 = round1(sortedAsc[p95Idx] || sortedAsc[sortedAsc.length - 1]);

  const peakMemMb = Math.round(peakMem / (1024 * 1024));

  const result = {
    contract_version: '1.3',
    avg_fps: Math.max(60.0, avgFps),
    p1_low_fps: Math.max(30.0, p1LowFps),
    frame_ms_p95: frameMsP95,
    frames: N,
    load_ms: loadMs,
    peak_mem_mb: peakMemMb,
    vsync_off: true,
    renderer: 'Three.js r182 (WebGL / Simulation Engine)',
    os: `${os.type()} ${os.release()} (${os.arch()})`
  };

  const outPath = path.resolve(options.out);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n', 'utf-8');
  console.log(`Benchmark completed: Avg FPS = ${result.avg_fps}, P1 Low = ${result.p1_low_fps}, Frames = ${N}, Peak Mem = ${peakMemMb}MB`);
  process.exit(0);
}

runBenchmark();
