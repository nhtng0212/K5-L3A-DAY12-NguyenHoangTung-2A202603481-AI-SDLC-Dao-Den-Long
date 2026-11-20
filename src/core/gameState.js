import { SeededRNG } from './rng.js';
import { distXZ, formatPos, projectMove, round3 } from './math3d.js';

export const TUNING_V11 = {
  player_speed: 6.0,
  dash_speed: 14.0,
  dash_duration_s: 0.2,
  dash_cooldown_s: 1.5,
  jump_speed: 7.0,
  gravity: -20.0,
  carry_capacity: 10,
  lantern_cost: 10,
  lantern_count_night1: 5,
  lantern_count_night2: 6,
  lantern_count_night3: 7,
  pickup_radius: 1.0,
  pickup_dy: 1.5,
  interact_radius: 2.0,
  pulse_cost: 3,
  pulse_radius: 5.0,
  pulse_cooldown_s: 3.0,
  pulse_stun_s: 2.0,
  pulse_push_m: 4.0,
  safe_radius: 6.0,
  shade_speed: 4.0,
  shade_speed_night3: 4.5,
  shade_detect_radius: 12.0,
  shade_abandon_radius: 18.0,
  shade_hit_radius: 1.0,
  shade_hit_dy: 1.5,
  invuln_s: 1.5,
  hit_drop_ratio: 0.5,
  fall_enabled: true,
  flames: 3,
  night1_duration_s: 300,
  night2_duration_s: 330,
  night3_duration_s: 360,
  score: {
    per_mote_deposited: 10,
    per_lantern: 100,
    per_stun: 5,
    per_second_left: 2,
    per_flame_left: 50
  }
};

export class GameState {
  constructor(tuning = {}, night = 1) {
    this.tuning = { ...TUNING_V11, ...tuning };
    if (tuning.score) {
      this.tuning.score = { ...TUNING_V11.score, ...tuning.score };
    }
    this.night = night || 1;
    this.reset();
  }

  reset() {
    this.tick = 0;
    this.sim_tick = 0;
    this.state = 'playing'; // 'playing', 'paused', 'won', 'lost'
    this.isPaused = false;
    this.score = 0;

    const durations = { 1: this.tuning.night1_duration_s, 2: this.tuning.night2_duration_s, 3: this.tuning.night3_duration_s };
    this.duration_s = durations[this.night] || 300;
    this.time_left_s = this.duration_s;

    this.player = {
      pos: [0, 0, 0],
      vel: [0, 0, 0],
      grounded: true,
      flames: this.tuning.flames,
      carried: 0,
      facing_yaw: 0
    };

    // Timers in ticks
    this.invuln_ticks = 0;
    this.dash_ticks_left = 0;
    this.dash_cooldown_ticks = 0;
    this.dash_dir = [0, 1];
    this.pulse_cooldown_ticks = 0;
    this.charm_ticks = 0;

    // Launch pad airborne lock
    this.airborne_lock = false;

    // Respawn from fall
    this.falling_timer = 0;

    // Wind state (Night 3)
    this.wind = { active: false, dir_deg: 0, ticks_left: 0, warning: false };
    this.wind_cycle_timer = 1800; // every 30s = 1800 ticks

    this.prevButtons = { interact: false, pulse: false, jump: false, dash: false, pause: false };

    this.lanterns = [];
    this.motes = [];
    this.shades = [];
    this.drifters = [];
    this.charms = [];

    this.nextShadeId = 1;
    this.nextDrifterId = 1;
    this.nextMoteId = 1;

    this.rng = new SeededRNG(1);
    this.setupMap();
  }

  setupMap() {
    if (this.night === 1) {
      this.startPos = [0, 0, 0];
      this.player.pos = [0, 0, 0];
      this.lanterns = [
        { id: 'L1', pos: [0, 0, 25], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L2', pos: [23.8, 0, 7.7], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L3', pos: [14.7, 0, -20.2], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L4', pos: [-14.7, 0, -20.2], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L5', pos: [-23.8, 0, 7.7], lit: false, deposited: 0, push_ticks: 0 }
      ];

      // Mote candidate spawn points: 8 at r=12m (every 45°), 16 at r=33m (every 22.5°)
      this.moteSpawnPoints = [];
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        this.moteSpawnPoints.push([round3(Math.cos(a) * 12), 0, round3(Math.sin(a) * 12)]);
      }
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        this.moteSpawnPoints.push([round3(Math.cos(a) * 33), 0, round3(Math.sin(a) * 33)]);
      }

      // Shade spawn points: 12 points at r=37m (15°, 45°, ...)
      this.shadeSpawnPoints = [];
      for (let i = 0; i < 12; i++) {
        const a = ((15 + i * 30) * Math.PI) / 180;
        this.shadeSpawnPoints.push([round3(Math.cos(a) * 37), 0, round3(Math.sin(a) * 37)]);
      }
    } else if (this.night === 2) {
      this.startPos = [0, 0, 0];
      this.player.pos = [0, 0, 0];
      // 6 Lanterns: L1..L6
      this.lanterns = [
        { id: 'L1', pos: [0, 0, 20], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L2', pos: [17, 0, -10], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L3', pos: [-17, 0, -10], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L4', pos: [70, 0, 20], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L5', pos: [87, 0, -10], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L6', pos: [53, 0, -10], lit: false, deposited: 0, push_ticks: 0 }
      ];

      this.moteSpawnPoints = [];
      [ [0,0], [70,0] ].forEach(([cx, cz]) => {
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          this.moteSpawnPoints.push([round3(cx + Math.cos(a) * 10), 0, round3(cz + Math.sin(a) * 10)]);
        }
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          this.moteSpawnPoints.push([round3(cx + Math.cos(a) * 22), 0, round3(cz + Math.sin(a) * 22)]);
        }
      });

      this.shadeSpawnPoints = [];
      [ [0,0], [70,0] ].forEach(([cx, cz]) => {
        for (let i = 0; i < 8; i++) {
          const a = ((22.5 + i * 45) * Math.PI) / 180;
          this.shadeSpawnPoints.push([round3(cx + Math.cos(a) * 26), 0, round3(cz + Math.sin(a) * 26)]);
        }
      });

      this.charms = [{ id: 'C1', pos: [35, 0, 0], available: true, respawn_ticks: 0 }];
    } else if (this.night === 3) {
      this.startPos = [0, 0, 0];
      this.player.pos = [0, 0, 0];
      // 7 Lanterns: L1..L7
      this.lanterns = [
        { id: 'L1', pos: [0, 6, 6], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L2', pos: [18, 3, 10], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L3', pos: [-18, 3, 10], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L4', pos: [35, 0, -10], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L5', pos: [-35, 0, -10], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L6', pos: [20, 0, -35], lit: false, deposited: 0, push_ticks: 0 },
        { id: 'L7', pos: [-20, 0, -35], lit: false, deposited: 0, push_ticks: 0 }
      ];

      this.moteSpawnPoints = [];
      // Tier 0: 18 at r=34m
      for (let i = 0; i < 18; i++) {
        const a = (i * 20 * Math.PI) / 180;
        this.moteSpawnPoints.push([round3(Math.cos(a) * 34), 0, round3(Math.sin(a) * 34)]);
      }
      // Tier 1: 8 at r=18m
      for (let i = 0; i < 8; i++) {
        const a = ((20 + i * 20) * Math.PI) / 180;
        this.moteSpawnPoints.push([round3(Math.cos(a) * 18), 3, round3(Math.sin(a) * 18)]);
      }
      // Tier 2: 4 at r=5m
      for (let i = 0; i < 4; i++) {
        const a = ((45 + i * 90) * Math.PI) / 180;
        this.moteSpawnPoints.push([round3(Math.cos(a) * 5), 6, round3(Math.sin(a) * 5)]);
      }

      this.shadeSpawnPoints = [];
      for (let i = 0; i < 16; i++) {
        const a = (i * 22.5 * Math.PI) / 180;
        this.shadeSpawnPoints.push([round3(Math.cos(a) * 43), 0, round3(Math.sin(a) * 43)]);
      }

      this.charms = [
        { id: 'C1', pos: [30, 0, 25], available: true, respawn_ticks: 0 },
        { id: 'C2', pos: [-30, 0, 25], available: true, respawn_ticks: 0 }
      ];
    }
  }

  getGroundHeight(x, z) {
    if (this.night === 1) {
      const d = Math.hypot(x, z);
      return d <= 40.0 ? 0.0 : -999.0;
    } else if (this.night === 2) {
      const dA = Math.hypot(x, z);
      if (dA <= 28.0) return 0.0;
      const dB = Math.hypot(x - 70.0, z);
      if (dB <= 28.0) return 0.0;
      // Bridge: x in [26, 44], z in [-2, 2]
      if (x >= 26.0 && x <= 44.0 && z >= -2.0 && z <= 2.0) return 0.0;
      return -999.0;
    } else if (this.night === 3) {
      const d = Math.hypot(x, z);
      if (d > 45.0) return -999.0;

      // Bell tower cylinder r=2m on Tier 2
      if (d <= 2.0) return 6.0;

      // Tier 2: r <= 8m, Y = 6
      if (d <= 8.0) return 6.0;

      // Tier 1: r in [12, 24] on z > 0, Y = 3
      if (d >= 12.0 && d <= 24.0 && z > 0) return 3.0;

      // 2 Ramps at 30° and 150° connecting r=30 (Y=0) to r=24 (Y=3)
      for (const rampAngleDeg of [30, 150]) {
        const ra = (rampAngleDeg * Math.PI) / 180;
        const rx = Math.cos(ra);
        const rz = Math.sin(ra);
        const proj = x * rx + z * rz;
        const perp = Math.abs(-x * rz + z * rx);
        if (perp <= 1.5 && proj >= 24.0 && proj <= 30.0) {
          const t = (30.0 - proj) / 6.0; // 0 at r=30, 1 at r=24
          return t * 3.0;
        }
      }

      // Tier 0: Y = 0
      return 0.0;
    }
    return 0.0;
  }

  setup(scenario = {}, seed = 1) {
    this.reset();
    this.rng = new SeededRNG(seed);

    if (scenario.time_left_s !== undefined) {
      this.duration_s = scenario.time_left_s;
      this.time_left_s = scenario.time_left_s;
    }

    if (scenario.player) {
      const p = scenario.player;
      if (p.pos) this.player.pos = [...p.pos];
      if (p.vel) this.player.vel = [...p.vel];
      if (p.grounded !== undefined) this.player.grounded = p.grounded;
      if (p.flames !== undefined) this.player.flames = p.flames;
      if (p.carried !== undefined) this.player.carried = p.carried;
      if (p.invuln_ticks !== undefined) this.invuln_ticks = p.invuln_ticks;
      if (p.dash_cd_ticks !== undefined) this.dash_cooldown_ticks = p.dash_cd_ticks;
      if (p.pulse_cd_ticks !== undefined) this.pulse_cooldown_ticks = p.pulse_cd_ticks;
      if (p.charm_ticks !== undefined) this.charm_ticks = p.charm_ticks;
    }

    if (scenario.lanterns && Array.isArray(scenario.lanterns)) {
      for (const update of scenario.lanterns) {
        const found = this.lanterns.find((l) => l.id === update.id);
        if (found) {
          if (update.pos) found.pos = [...update.pos];
          if (update.deposited !== undefined) found.deposited = update.deposited;
          if (update.lit !== undefined) found.lit = update.lit;
        } else {
          this.lanterns.push({
            id: update.id,
            pos: update.pos ? [...update.pos] : [0, 0, 0],
            deposited: update.deposited || 0,
            lit: update.lit || false,
            push_ticks: 0
          });
        }
      }
    }

    // Motes
    if (scenario.motes !== undefined) {
      this.motes = scenario.motes.map((m, idx) => ({
        id: `M${idx + 1}`,
        pos: Array.isArray(m) ? [...m] : [...(m.pos || [0, 0, 0])],
        kind: m.kind || 'random',
        ttl_ticks: m.ttl_s ? Math.round(m.ttl_s * 60) : 0,
        can_pick_now: true
      }));
      this.nextMoteId = this.motes.length + 1;
    } else if (scenario.random_motes !== false) {
      // Spawn 20 initial motes at 20 distinct points
      this.motes = [];
      const shuffled = [...this.moteSpawnPoints].sort(() => this.rng.next() - 0.5);
      const initialCount = Math.min(20, shuffled.length);
      for (let i = 0; i < initialCount; i++) {
        this.motes.push({
          id: `M${this.nextMoteId++}`,
          pos: [...shuffled[i]],
          kind: 'random',
          ttl_ticks: 0,
          can_pick_now: true
        });
      }
    }

    // Shades
    if (scenario.shades !== undefined) {
      this.shades = scenario.shades.map((s, idx) => ({
        id: s.id || `S${idx + 1}`,
        pos: [...s.pos],
        state: s.state || 'chase',
        state_ticks_left: s.state_ticks_left || 0,
        push_dir: [0, 0],
        push_ticks_left: 0,
        recoil_dir: [0, 0],
        recoil_ticks_left: 0
      }));
      this.nextShadeId = this.shades.length + 1;
    }

    // Drifters
    if (scenario.drifters !== undefined) {
      this.drifters = scenario.drifters.map((d, idx) => ({
        id: d.id || `D${idx + 1}`,
        pos: [...d.pos],
        state: d.state || 'idle',
        stolen: d.stolen || 0,
        flee_ticks_left: 0,
        drop_vanish_ticks: 0,
        wander_angle: this.rng.range(0, Math.PI * 2)
      }));
      this.nextDrifterId = this.drifters.length + 1;
    }

    // Charms
    if (scenario.charms !== undefined) {
      this.charms = scenario.charms.map((c) => ({
        id: c.id,
        pos: c.pos ? [...c.pos] : [0, 0, 0],
        available: c.available !== undefined ? c.available : true,
        respawn_ticks: c.respawn_s ? Math.round(c.respawn_s * 60) : 0
      }));
    }
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.isPaused ? 'paused' : this.state,
      night: this.night,
      time_left_s: round3(Math.max(0, this.time_left_s)),
      score: this.score,
      wind: {
        active: this.wind.active,
        dir_deg: round3(this.wind.dir_deg)
      },
      player: {
        pos: formatPos(this.player.pos),
        vel: formatPos(this.player.vel),
        grounded: this.player.grounded,
        flames: this.player.flames,
        carried: this.player.carried,
        invuln: this.invuln_ticks > 0,
        dash_cd_s: round3(this.dash_cooldown_ticks / 60.0),
        pulse_cd_s: round3(this.pulse_cooldown_ticks / 60.0),
        charm_s: round3(this.charm_ticks / 60.0)
      },
      lanterns: this.lanterns.map((l) => ({
        id: l.id,
        pos: formatPos(l.pos),
        lit: l.lit,
        deposited: l.deposited
      })),
      shades: this.shades.map((s) => ({
        id: s.id,
        pos: formatPos(s.pos),
        state: s.state
      })),
      motes: this.motes.map((m) => ({
        id: m.id,
        pos: formatPos(m.pos),
        kind: m.kind,
        ttl_s: round3(m.ttl_ticks / 60.0)
      })),
      drifters: this.drifters.map((d) => ({
        id: d.id,
        pos: formatPos(d.pos),
        state: d.state,
        stolen: d.stolen
      })),
      charms: this.charms.map((c) => ({
        id: c.id,
        available: c.available,
        respawn_s: round3(c.respawn_ticks / 60.0)
      })),
      motes_active: this.motes.length
    };
  }

  step(frame = {}) {
    this.tick += 1;
    const currentTick = this.tick;
    const events = [];

    // 1. Read input & Pause Handling (Step 1)
    const pauseTrigger = !!frame.pause && !this.prevButtons.pause;
    if (pauseTrigger) {
      this.isPaused = !this.isPaused;
      events.push({
        type: 'event',
        tick: currentTick,
        name: this.isPaused ? 'paused' : 'resumed'
      });
      if (this.isPaused) {
        this.prevButtons.pause = !!frame.pause;
        return events; // Stop execution of this step if paused
      }
    }
    this.prevButtons.pause = !!frame.pause;

    if (this.isPaused || this.state !== 'playing') {
      return events;
    }

    this.sim_tick += 1;
    this.time_left_s = Math.max(0, this.duration_s - this.sim_tick / 60.0);

    const jumpTrigger = !!frame.jump && !this.prevButtons.jump;
    const dashTrigger = !!frame.dash && !this.prevButtons.dash;
    const interactTrigger = !!frame.interact && !this.prevButtons.interact;
    const pulseTrigger = !!frame.pulse && !this.prevButtons.pulse;
    this.prevButtons = {
      interact: !!frame.interact,
      pulse: !!frame.pulse,
      jump: !!frame.jump,
      dash: !!frame.dash,
      pause: !!frame.pause
    };

    // 2. Decrease counters (Step 2)
    if (this.dash_ticks_left > 0) this.dash_ticks_left--;
    if (this.dash_cooldown_ticks > 0) this.dash_cooldown_ticks--;
    if (this.pulse_cooldown_ticks > 0) this.pulse_cooldown_ticks--;
    if (this.invuln_ticks > 0) this.invuln_ticks--;
    if (this.charm_ticks > 0) this.charm_ticks--;

    for (const c of this.charms) {
      if (!c.available) {
        c.respawn_ticks--;
        if (c.respawn_ticks <= 0) {
          c.available = true;
          c.respawn_ticks = 0;
        }
      }
    }

    // TTL for dropped motes
    const survivingMotes = [];
    for (const m of this.motes) {
      m.can_pick_now = true;
      if (m.kind === 'dropped') {
        m.ttl_ticks--;
        if (m.ttl_ticks > 0) survivingMotes.push(m);
      } else {
        survivingMotes.push(m);
      }
    }
    this.motes = survivingMotes;

    // Respawn fall timer
    if (this.falling_timer > 0) {
      this.falling_timer--;
      if (this.falling_timer <= 0) {
        // Respawn at start position
        this.player.pos = [...this.startPos];
        this.player.vel = [0, 0, 0];
        this.player.grounded = true;
        this.invuln_ticks = 90;
      }
      return events;
    }

    // 3. Move May (jump, dash, jump pads, wind) & check fall (Step 3)
    const move = frame.move || [0, 0];
    const camYaw = frame.cam_yaw_deg || 0;
    const [pdx, pdz] = projectMove(move, camYaw);

    if (pdx !== 0 || pdz !== 0) {
      this.player.facing_yaw = (Math.atan2(pdx, pdz) * 180) / Math.PI;
    }

    // Dash start trigger
    if (dashTrigger && (this.dash_cooldown_ticks <= 0 || this.charm_ticks > 0) && this.dash_ticks_left <= 0) {
      this.dash_ticks_left = 12; // 0.2s = 12 ticks
      this.dash_cooldown_ticks = 90; // 1.5s = 90 ticks
      if (pdx !== 0 || pdz !== 0) {
        this.dash_dir = [pdx, pdz];
      } else {
        const fa = (this.player.facing_yaw * Math.PI) / 180;
        this.dash_dir = [Math.sin(fa), Math.cos(fa)];
      }
      this.player.vel[1] = 0; // maintain height in mid-air
      events.push({ type: 'event', tick: currentTick, name: 'dash' });
    }

    // Jump trigger
    if (jumpTrigger && this.player.grounded && this.dash_ticks_left <= 0 && !this.airborne_lock) {
      this.player.vel[1] = this.tuning.jump_speed;
      this.player.grounded = false;
    }

    // Airborne gravity and integration
    if (this.dash_ticks_left > 0) {
      // Dash movement
      const dSpeed = this.tuning.dash_speed / 60.0;
      this.player.pos[0] += this.dash_dir[0] * dSpeed;
      this.player.pos[2] += this.dash_dir[1] * dSpeed;
      this.player.vel[0] = this.dash_dir[0] * this.tuning.dash_speed;
      this.player.vel[2] = this.dash_dir[1] * this.tuning.dash_speed;
    } else if (this.airborne_lock) {
      // Jump pad ballistic flight
      this.player.pos[0] += this.player.vel[0] / 60.0;
      this.player.pos[2] += this.player.vel[2] / 60.0;
      this.player.pos[1] += this.player.vel[1] / 60.0;
      this.player.vel[1] += this.tuning.gravity / 60.0;
    } else {
      // Normal run movement
      const curSpeed = this.charm_ticks > 0 ? 7.2 : this.tuning.player_speed;
      this.player.pos[0] += pdx * (curSpeed / 60.0);
      this.player.pos[2] += pdz * (curSpeed / 60.0);
      this.player.vel[0] = pdx * curSpeed;
      this.player.vel[2] = pdz * curSpeed;

      // Apply wind (Night 3)
      if (this.wind.active) {
        const wa = (this.wind.dir_deg * Math.PI) / 180;
        this.player.pos[0] += Math.sin(wa) * (2.0 / 60.0);
        this.player.pos[2] += Math.cos(wa) * (2.0 / 60.0);
      }

      if (!this.player.grounded) {
        this.player.pos[1] += this.player.vel[1] / 60.0;
        this.player.vel[1] += this.tuning.gravity / 60.0;
      }
    }

    // Check ground collision
    const groundY = this.getGroundHeight(this.player.pos[0], this.player.pos[2]);
    if (groundY > -900) {
      if (this.player.pos[1] <= groundY) {
        this.player.pos[1] = groundY;
        this.player.vel[1] = 0;
        this.player.grounded = true;
        this.airborne_lock = false;
      } else {
        this.player.grounded = false;
      }
    } else {
      this.player.grounded = false;
    }

    // Check jump pads (Night 2 and 3)
    if (this.night === 2 && this.player.grounded) {
      // Pad 1 at (20, 0, 18) -> shoot towards island B (70, 0, 0)
      if (Math.hypot(this.player.pos[0] - 20, this.player.pos[2] - 18) <= 1.0) {
        const dx = 50, dz = -18, dLen = Math.hypot(dx, dz);
        this.player.vel = [(dx / dLen) * 24.0, 14.0, (dz / dLen) * 24.0];
        this.player.grounded = false;
        this.airborne_lock = true;
      }
      // Pad 2 at (50, 0, -18) -> shoot towards island A (0, 0, 0)
      if (Math.hypot(this.player.pos[0] - 50, this.player.pos[2] - (-18)) <= 1.0) {
        const dx = -50, dz = 18, dLen = Math.hypot(dx, dz);
        this.player.vel = [(dx / dLen) * 24.0, 14.0, (dz / dLen) * 24.0];
        this.player.grounded = false;
        this.airborne_lock = true;
      }
    } else if (this.night === 3 && this.player.grounded) {
      // Pad at (0, 3, 13) -> shoot towards -Z at Y=12, horizontal 8 m/s
      if (Math.hypot(this.player.pos[0] - 0, this.player.pos[2] - 13) <= 1.0 && Math.abs(this.player.pos[1] - 3.0) <= 0.5) {
        this.player.vel = [0, 12.0, -8.0];
        this.player.grounded = false;
        this.airborne_lock = true;
      }
    }

    // Check fall off island (Y < -10)
    if (this.player.pos[1] < -10.0 && this.tuning.fall_enabled) {
      this.player.flames = Math.max(0, this.player.flames - 1);
      const lostMotes = this.player.carried;
      this.player.carried = 0;
      this.falling_timer = 60; // wait 60 ticks before respawn
      this.airborne_lock = false;

      events.push({
        type: 'event',
        tick: currentTick,
        name: 'player_hit',
        data: {
          by: 'fall',
          flames: this.player.flames,
          dropped: 0,
          lost: lostMotes
        }
      });

      if (this.player.flames <= 0) {
        this.state = 'lost';
        events.push({
          type: 'event',
          tick: currentTick,
          name: 'game_over',
          data: { result: 'lost', reason: 'no_flames' }
        });
        return events;
      }
    }

    // 4. Pickup motes and charms (Step 4)
    const pR = this.tuning.pickup_radius;
    const pDY = this.tuning.pickup_dy;
    const remainingMotes = [];
    for (const m of this.motes) {
      if (m.can_pick_now && distXZ(this.player.pos, m.pos) <= pR && Math.abs(this.player.pos[1] - m.pos[1]) <= pDY) {
        if (this.player.carried < this.tuning.carry_capacity) {
          this.player.carried += 1;
          events.push({
            type: 'event',
            tick: currentTick,
            name: 'mote_picked',
            data: { carried: this.player.carried }
          });
        } else {
          remainingMotes.push(m);
        }
      } else {
        remainingMotes.push(m);
      }
    }
    this.motes = remainingMotes;

    // Charm pickup
    for (const c of this.charms) {
      if (c.available && distXZ(this.player.pos, c.pos) <= pR && Math.abs(this.player.pos[1] - c.pos[1]) <= pDY) {
        c.available = false;
        c.respawn_ticks = 2700;
        this.charm_ticks = 600;
        events.push({
          type: 'event',
          tick: currentTick,
          name: 'charm_picked',
          data: { charm_id: c.id, charm_ticks: 600 }
        });
      }
    }

    // 5. Interact with lanterns (Step 5)
    if (interactTrigger && this.player.carried > 0) {
      let candidate = null;
      let candDist = Infinity;
      for (const l of this.lanterns) {
        if (!l.lit) {
          const d = distXZ(this.player.pos, l.pos);
          if (d <= this.tuning.interact_radius) {
            if (d < candDist || (Math.abs(d - candDist) < 0.0001 && (!candidate || l.id < candidate.id))) {
              candDist = d;
              candidate = l;
            }
          }
        }
      }

      if (candidate) {
        const needed = this.tuning.lantern_cost - candidate.deposited;
        const depositAmount = Math.min(this.player.carried, needed);
        if (depositAmount > 0) {
          candidate.deposited += depositAmount;
          this.player.carried -= depositAmount;
          this.score += depositAmount * this.tuning.score.per_mote_deposited;
          events.push({
            type: 'event',
            tick: currentTick,
            name: 'deposit',
            data: {
              lantern_id: candidate.id,
              amount: depositAmount,
              deposited: candidate.deposited
            }
          });

          if (candidate.deposited >= this.tuning.lantern_cost) {
            candidate.lit = true;
            candidate.push_ticks = 30; // 30 ticks push out
            this.score += this.tuning.score.per_lantern;
            events.push({
              type: 'event',
              tick: currentTick,
              name: 'lantern_lit',
              data: { lantern_id: candidate.id }
            });

            if (this.lanterns.every((l) => l.lit)) {
              this.state = 'won';
              const secsLeft = Math.max(0, Math.floor(this.time_left_s));
              this.score += secsLeft * this.tuning.score.per_second_left + this.player.flames * this.tuning.score.per_flame_left;
              events.push({
                type: 'event',
                tick: currentTick,
                name: 'game_over',
                data: { result: 'won', reason: 'all_lit' }
              });
              return events;
            }
          }
        }
      }
    }

    // 6. Update safe zone (Step 6)
    const safeR = this.tuning.safe_radius;
    for (const l of this.lanterns) {
      if (l.lit) {
        if (l.push_ticks > 0) l.push_ticks--;
        for (const s of this.shades) {
          const sd = distXZ(s.pos, l.pos);
          if (sd < safeR) {
            const outX = s.pos[0] - l.pos[0];
            const outZ = s.pos[2] - l.pos[2];
            const outLen = Math.hypot(outX, outZ);
            if (outLen > 0.001) {
              s.pos[0] = l.pos[0] + (outX / outLen) * safeR;
              s.pos[2] = l.pos[2] + (outZ / outLen) * safeR;
            } else {
              s.pos[0] = l.pos[0] + safeR;
            }
          }
        }
      }
    }

    // 7. Pulse (Step 7)
    if (pulseTrigger && this.pulse_cooldown_ticks <= 0) {
      if (this.player.carried >= this.tuning.pulse_cost) {
        this.player.carried -= this.tuning.pulse_cost;
        this.pulse_cooldown_ticks = Math.round(this.tuning.pulse_cooldown_s * 60);

        const stunnedIds = [];
        const pulseCenter = [this.player.pos[0], this.player.pos[1] + 0.8, this.player.pos[2]];

        for (const shade of this.shades) {
          const shadeCenter = [shade.pos[0], shade.pos[1] + 0.7, shade.pos[2]];
          const dist3D = Math.hypot(
            pulseCenter[0] - shadeCenter[0],
            pulseCenter[1] - shadeCenter[1],
            pulseCenter[2] - shadeCenter[2]
          );

          if (dist3D <= this.tuning.pulse_radius) {
            shade.state = 'stunned';
            shade.state_ticks_left = 120;
            shade.push_ticks_left = 15;
            let pdx = shade.pos[0] - this.player.pos[0];
            let pdz = shade.pos[2] - this.player.pos[2];
            const pLen = Math.hypot(pdx, pdz);
            if (pLen > 0.001) {
              shade.push_dir = [pdx / pLen, pdz / pLen];
            } else {
              shade.push_dir = [1, 0];
            }
            stunnedIds.push(shade.id);
            this.score += this.tuning.score.per_stun;
          }
        }

        // Drifters hit by Pulse
        for (const drifter of this.drifters) {
          const dist3D = Math.hypot(
            pulseCenter[0] - drifter.pos[0],
            pulseCenter[1] - drifter.pos[1],
            pulseCenter[2] - drifter.pos[2]
          );
          if (dist3D <= this.tuning.pulse_radius) {
            if (drifter.state === 'chase') {
              drifter.state = 'flee';
              drifter.flee_ticks_left = 240;
            } else if (drifter.state === 'flee' && drifter.stolen > 0) {
              events.push({
                type: 'event',
                tick: currentTick,
                name: 'drifter_drop',
                data: { drifter_id: drifter.id, amount: drifter.stolen }
              });
              for (let i = 0; i < drifter.stolen; i++) {
                this.motes.push({
                  id: `M${this.nextMoteId++}`,
                  pos: [drifter.pos[0], drifter.pos[1], drifter.pos[2]],
                  kind: 'dropped',
                  ttl_ticks: 480,
                  can_pick_now: false
                });
              }
              drifter.stolen = 0;
              drifter.drop_vanish_ticks = 120;
            }
          }
        }

        events.push({
          type: 'event',
          tick: currentTick,
          name: 'pulse',
          data: { stunned_ids: stunnedIds }
        });
      }
    }

    // 8. Move Shades & Drifters (Step 8)
    const baseShadeSpeed = (this.night === 3 ? this.tuning.shade_speed_night3 : this.tuning.shade_speed) / 60.0;
    for (const shade of this.shades) {
      if (shade.state === 'stunned') {
        shade.state_ticks_left--;
        if (shade.push_ticks_left > 0) {
          shade.push_ticks_left--;
          shade.pos[0] += shade.push_dir[0] * (4.0 / 15.0);
          shade.pos[2] += shade.push_dir[1] * (4.0 / 15.0);
        }
        if (shade.state_ticks_left <= 0) {
          shade.state = 'wander';
        }
      } else if (shade.state === 'recoil') {
        shade.recoil_ticks_left--;
        shade.pos[0] += shade.recoil_dir[0] * (2.0 / 60.0);
        shade.pos[2] += shade.recoil_dir[1] * (2.0 / 60.0);
        if (shade.recoil_ticks_left <= 0) {
          shade.state = 'wander';
        }
      } else {
        const dPlayer = distXZ(shade.pos, this.player.pos);
        if (shade.state === 'chase') {
          if (dPlayer > this.tuning.shade_abandon_radius) {
            shade.state = 'wander';
          } else {
            const dx = this.player.pos[0] - shade.pos[0];
            const dz = this.player.pos[2] - shade.pos[2];
            const len = Math.hypot(dx, dz);
            if (len > 0.001) {
              shade.pos[0] += (dx / len) * baseShadeSpeed;
              shade.pos[2] += (dz / len) * baseShadeSpeed;
            }
          }
        } else {
          // Wander or spawning
          if (dPlayer <= this.tuning.shade_detect_radius) {
            shade.state = 'chase';
          } else {
            shade.state = 'wander';
          }
        }
      }
    }

    // Drifters movement
    const survivingDrifters = [];
    for (const d of this.drifters) {
      if (d.drop_vanish_ticks > 0) {
        d.drop_vanish_ticks--;
        if (d.drop_vanish_ticks > 0) survivingDrifters.push(d);
        continue;
      }
      if (d.state === 'flee') {
        d.flee_ticks_left--;
        const dx = d.pos[0] - this.player.pos[0];
        const dz = d.pos[2] - this.player.pos[2];
        const len = Math.hypot(dx, dz);
        if (len > 0.001) {
          d.pos[0] += (dx / len) * (7.0 / 60.0);
          d.pos[2] += (dz / len) * (7.0 / 60.0);
        }
        if (d.flee_ticks_left > 0) survivingDrifters.push(d);
      } else {
        const distToM = distXZ(d.pos, this.player.pos);
        if (this.player.carried >= 5 && distToM <= 15.0) {
          d.state = 'chase';
          const dx = this.player.pos[0] - d.pos[0];
          const dz = this.player.pos[2] - d.pos[2];
          const len = Math.hypot(dx, dz);
          if (len > 0.001) {
            d.pos[0] += (dx / len) * (7.0 / 60.0);
            d.pos[2] += (dz / len) * (7.0 / 60.0);
          }
        } else {
          d.state = 'idle';
          d.pos[0] += Math.cos(d.wander_angle) * (2.0 / 60.0);
          d.pos[2] += Math.sin(d.wander_angle) * (2.0 / 60.0);
        }
        survivingDrifters.push(d);
      }
    }
    this.drifters = survivingDrifters;

    // 9. Contact / Hit: Drifters steal first, then Shades hit (Step 9)
    for (const d of this.drifters) {
      if (d.state === 'chase' && distXZ(d.pos, this.player.pos) <= 1.2) {
        const stealAmount = Math.min(3, this.player.carried);
        this.player.carried -= stealAmount;
        d.stolen = stealAmount;
        d.state = 'flee';
        d.flee_ticks_left = 240;
        events.push({
          type: 'event',
          tick: currentTick,
          name: 'drifter_steal',
          data: { drifter_id: d.id, amount: stealAmount, carried: this.player.carried }
        });
      }
    }

    // Shades hit
    let flameLostThisTick = false;
    for (const shade of [...this.shades].sort((a, b) => a.id.localeCompare(b.id))) {
      const dXZ = distXZ(shade.pos, this.player.pos);
      const dY = Math.abs(shade.pos[1] - this.player.pos[1]);

      if (dXZ <= this.tuning.shade_hit_radius && dY <= this.tuning.shade_hit_dy && shade.state === 'chase') {
        // Shade recoils
        shade.state = 'recoil';
        shade.recoil_ticks_left = 60;
        const rdx = shade.pos[0] - this.player.pos[0];
        const rdz = shade.pos[2] - this.player.pos[2];
        const rLen = Math.hypot(rdx, rdz);
        shade.recoil_dir = rLen > 0.001 ? [rdx / rLen, rdz / rLen] : [1, 0];

        if (this.invuln_ticks <= 0 && !flameLostThisTick) {
          flameLostThisTick = true;
          this.player.flames = Math.max(0, this.player.flames - 1);
          const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
          this.player.carried -= dropped;
          this.invuln_ticks = 90;

          // Scatter dropped motes in 1.5 - 2.5m ring
          for (let di = 0; di < dropped; di++) {
            const da = (di * Math.PI * 2) / dropped;
            const dr = 2.0;
            this.motes.push({
              id: `M${this.nextMoteId++}`,
              pos: [
                round3(this.player.pos[0] + Math.cos(da) * dr),
                this.player.pos[1],
                round3(this.player.pos[2] + Math.sin(da) * dr)
              ],
              kind: 'dropped',
              ttl_ticks: 480,
              can_pick_now: false
            });
          }

          events.push({
            type: 'event',
            tick: currentTick,
            name: 'player_hit',
            data: {
              by: 'shade',
              flames: this.player.flames,
              dropped: dropped,
              lost: 0
            }
          });

          if (this.player.flames <= 0) {
            this.state = 'lost';
            events.push({
              type: 'event',
              tick: currentTick,
              name: 'game_over',
              data: { result: 'lost', reason: 'no_flames' }
            });
            return events;
          }
        }
      }
    }

    // 10. Spawn motes, Shades, Drifters per schedule (Step 10)
    // Mote spawn at tick 240, 480... if count < 30
    if (currentTick % 240 === 0 && this.motes.length < 30 && this.moteSpawnPoints.length > 0) {
      const emptyPoints = this.moteSpawnPoints.filter(
        (sp) => !this.motes.some((m) => distXZ(m.pos, sp) < 1.0)
      );
      if (emptyPoints.length > 0) {
        const chosen = emptyPoints[Math.floor(this.rng.next() * emptyPoints.length)];
        this.motes.push({
          id: `M${this.nextMoteId++}`,
          pos: [...chosen],
          kind: 'random',
          ttl_ticks: 0,
          can_pick_now: false // only interact from next tick
        });
      }
    }

    // Shade spawn schedule
    const maxShades = this.night === 1 ? 6 : this.night === 2 ? 8 : 10;
    const spawnInterval = this.night === 1 ? 480 : this.night === 2 ? 420 : 360;

    let shouldSpawnShades = 0;
    if (currentTick === 300) shouldSpawnShades = 2;
    else if (currentTick > 300 && (currentTick - 300) % spawnInterval === 0) shouldSpawnShades = 1;

    if (shouldSpawnShades > 0) {
      for (let s = 0; s < shouldSpawnShades; s++) {
        if (this.shades.length < maxShades && this.shadeSpawnPoints.length > 0) {
          const validPoints = this.shadeSpawnPoints.filter((sp) => distXZ(sp, this.player.pos) >= 15.0);
          if (validPoints.length > 0) {
            const pt = validPoints[Math.floor(this.rng.next() * validPoints.length)];
            const newShadeId = `S${this.nextShadeId++}`;
            this.shades.push({
              id: newShadeId,
              pos: [...pt],
              state: 'spawning',
              state_ticks_left: 60,
              push_dir: [0, 0],
              push_ticks_left: 0,
              recoil_dir: [0, 0],
              recoil_ticks_left: 0
            });
            events.push({
              type: 'event',
              tick: currentTick,
              name: 'shade_spawned',
              data: { id: newShadeId }
            });
          }
        }
      }
    }

    // Drifter spawn schedule (Night 2 and 3)
    if (this.night >= 2 && currentTick % 1200 === 0 && this.drifters.length < 2) {
      const dId = `D${this.nextDrifterId++}`;
      const pt = this.shadeSpawnPoints[Math.floor(this.rng.next() * this.shadeSpawnPoints.length)] || [30, 0, 30];
      this.drifters.push({
        id: dId,
        pos: [...pt],
        state: 'idle',
        stolen: 0,
        flee_ticks_left: 0,
        drop_vanish_ticks: 0,
        wander_angle: this.rng.range(0, Math.PI * 2)
      });
    }

    // Wind updates (Night 3)
    if (this.night === 3) {
      this.wind_cycle_timer--;
      if (this.wind_cycle_timer <= 120 && !this.wind.warning) {
        this.wind.warning = true;
      }
      if (this.wind_cycle_timer <= 0) {
        this.wind.active = true;
        this.wind.ticks_left = 300; // 5 seconds
        this.wind.dir_deg = this.rng.range(0, 360);
        this.wind_cycle_timer = 1800; // reset 30s cycle
        this.wind.warning = false;
      }
      if (this.wind.active) {
        this.wind.ticks_left--;
        if (this.wind.ticks_left <= 0) {
          this.wind.active = false;
        }
      }
    }

    // 11. Check win / lose (Step 11)
    if (this.time_left_s <= 0 && this.state === 'playing') {
      this.state = 'lost';
      events.push({
        type: 'event',
        tick: currentTick,
        name: 'game_over',
        data: { result: 'lost', reason: 'dawn' }
      });
    }

    return events;
  }
}
