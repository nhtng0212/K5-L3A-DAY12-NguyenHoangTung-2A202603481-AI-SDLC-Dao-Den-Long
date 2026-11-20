import { SeededRNG } from './rng.js';
import { distXZ, formatPos, projectMove, round3 } from './math3d.js';

export const DEFAULT_TUNING = {
  player_speed: 6.0,
  carry_capacity: 10,
  lantern_cost: 5,
  lantern_count_night1: 5,
  pickup_radius: 1.5,
  interact_radius: 3.0,
  pulse_cost: 1,
  pulse_radius: 5.0,
  night1_duration_s: 300,
  flames: 3,
  invuln_s: 1.5,
  hit_drop_ratio: 0.5,
  pulse_stun_s: 3.0,
  pulse_push_m: 3.0,
  pulse_cooldown_s: 1.0,
  safe_radius: 4.0,
  shade_speed: 3.0,
  shade_hit_radius: 1.2,
  fall_enabled: false,
  score: {
    per_mote: 10,
    per_lantern: 200,
    per_stun: 20,
    per_second_left: 5,
    per_flame_left: 100
  }
};

export class GameState {
  constructor(tuning = {}) {
    this.tuning = { ...DEFAULT_TUNING, ...tuning };
    if (tuning.score) {
      this.tuning.score = { ...DEFAULT_TUNING.score, ...tuning.score };
    }
    this.reset();
  }

  reset() {
    this.tick = 0;
    this.sim_tick = 0;
    this.state = 'playing'; // 'playing', 'won', 'lost'
    this.score = 0;
    this.duration_s = this.tuning.night1_duration_s;
    this.time_left_s = this.duration_s;

    this.player = {
      pos: [0, 0, 0],
      flames: this.tuning.flames,
      carried: 0
    };

    this.invuln_ticks = 0;
    this.pulse_cooldown_ticks = 0;
    this.prevButtons = { interact: false, pulse: false, jump: false };

    // Default 5 lanterns for Night 1 arranged radially
    this.lanterns = [
      { id: 'L1', pos: [0, 0, 25], lit: false, deposited: 0 },
      { id: 'L2', pos: [23.776, 0, 7.725], lit: false, deposited: 0 },
      { id: 'L3', pos: [14.695, 0, -20.225], lit: false, deposited: 0 },
      { id: 'L4', pos: [-14.695, 0, -20.225], lit: false, deposited: 0 },
      { id: 'L5', pos: [-23.776, 0, 7.725], lit: false, deposited: 0 }
    ];

    this.motes = [];
    this.shades = [];
    this.pendingEvents = [];
    this.rng = new SeededRNG(1);
    this.islandRadius = 40.0;
  }

  setup(scenario = {}, seed = 1) {
    this.reset();
    this.rng = new SeededRNG(seed);

    if (scenario.time_left_s !== undefined) {
      this.duration_s = scenario.time_left_s;
      this.time_left_s = scenario.time_left_s;
    }

    if (scenario.player) {
      if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
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
            lit: update.lit || false
          });
        }
      }
    }

    // Motes setup
    if (scenario.motes !== undefined) {
      this.motes = scenario.motes.map((m, idx) => ({
        id: `M${idx + 1}`,
        pos: Array.isArray(m) ? [...m] : [...(m.pos || [0, 0, 0])]
      }));
    } else if (scenario.random_motes !== false) {
      // Spawn 25 default motes deterministically
      this.motes = [];
      for (let i = 0; i < 25; i++) {
        const angle = this.rng.range(0, Math.PI * 2);
        const dist = this.rng.range(4, this.islandRadius - 3);
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        this.motes.push({
          id: `M${i + 1}`,
          pos: [round3(x), 0, round3(z)]
        });
      }
    }

    // Shades setup
    if (scenario.shades !== undefined) {
      this.shades = scenario.shades.map((s, idx) => ({
        id: s.id || `S${idx + 1}`,
        pos: [...s.pos],
        state: s.state || 'chase',
        stun_ticks: 0
      }));
    } else if (scenario.random_shades !== false) {
      // Spawn 3 default shades
      this.shades = [];
      const angles = [0.5, 2.6, 4.7];
      for (let i = 0; i < 3; i++) {
        const dist = 30;
        const x = Math.cos(angles[i]) * dist;
        const z = Math.sin(angles[i]) * dist;
        this.shades.push({
          id: `S${i + 1}`,
          pos: [round3(x), 0, round3(z)],
          state: 'chase',
          stun_ticks: 0
        });
      }
    }
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.state,
      time_left_s: round3(Math.max(0, this.time_left_s)),
      score: this.score,
      player: {
        pos: formatPos(this.player.pos),
        flames: this.player.flames,
        carried: this.player.carried
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
      motes_active: this.motes.length
    };
  }

  step(frame = {}) {
    if (this.state !== 'playing') {
      return [];
    }

    const currentTick = this.tick + 1;
    this.tick = currentTick;
    this.sim_tick = currentTick;
    this.time_left_s = this.duration_s - currentTick / 60.0;

    const events = [];

    // 1. Process player movement
    const move = frame.move || [0, 0];
    const camYaw = frame.cam_yaw_deg || 0;
    const [dx, dz] = projectMove(move, camYaw);
    const speedPerTick = this.tuning.player_speed / 60.0;

    this.player.pos[0] += dx * speedPerTick;
    this.player.pos[2] += dz * speedPerTick;

    // Island boundary clamp
    const playerDist = Math.hypot(this.player.pos[0], this.player.pos[2]);
    if (playerDist > this.islandRadius) {
      const scale = this.islandRadius / playerDist;
      this.player.pos[0] *= scale;
      this.player.pos[2] *= scale;
    }

    // 2. Button edge triggers
    const interactTrigger = !!frame.interact && !this.prevButtons.interact;
    const pulseTrigger = !!frame.pulse && !this.prevButtons.pulse;
    this.prevButtons = {
      interact: !!frame.interact,
      pulse: !!frame.pulse,
      jump: !!frame.jump
    };

    // 3. Mote collection
    const pickupR = this.tuning.pickup_radius;
    const remainingMotes = [];
    for (const mote of this.motes) {
      const dist = distXZ(this.player.pos, mote.pos);
      if (dist <= pickupR && this.player.carried < this.tuning.carry_capacity) {
        this.player.carried += 1;
        this.score += this.tuning.score.per_mote;
        events.push({
          type: 'event',
          tick: currentTick,
          name: 'mote_picked',
          data: { carried: this.player.carried }
        });
      } else {
        remainingMotes.push(mote);
      }
    }
    this.motes = remainingMotes;

    // 4. Deposit into lantern
    if (interactTrigger && this.player.carried > 0) {
      let nearestLantern = null;
      let minDist = Infinity;
      for (const lantern of this.lanterns) {
        if (!lantern.lit) {
          const d = distXZ(this.player.pos, lantern.pos);
          if (d <= this.tuning.interact_radius && d < minDist) {
            minDist = d;
            nearestLantern = lantern;
          }
        }
      }

      if (nearestLantern) {
        const needed = this.tuning.lantern_cost - nearestLantern.deposited;
        const depositAmount = Math.min(this.player.carried, needed);
        if (depositAmount > 0) {
          nearestLantern.deposited += depositAmount;
          this.player.carried -= depositAmount;
          events.push({
            type: 'event',
            tick: currentTick,
            name: 'deposit',
            data: {
              lantern_id: nearestLantern.id,
              amount: depositAmount,
              deposited: nearestLantern.deposited
            }
          });

          if (nearestLantern.deposited >= this.tuning.lantern_cost) {
            nearestLantern.lit = true;
            this.score += this.tuning.score.per_lantern;
            events.push({
              type: 'event',
              tick: currentTick,
              name: 'lantern_lit',
              data: { lantern_id: nearestLantern.id }
            });

            // Check if all lanterns are lit
            const allLit = this.lanterns.every((l) => l.lit);
            if (allLit) {
              this.state = 'won';
              const secondsLeft = Math.max(0, Math.floor(this.time_left_s));
              this.score +=
                secondsLeft * this.tuning.score.per_second_left +
                this.player.flames * this.tuning.score.per_flame_left;
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

    // 5. Pulse (Tỏa sáng)
    if (pulseTrigger && this.pulse_cooldown_ticks <= 0) {
      if (this.player.carried >= this.tuning.pulse_cost) {
        this.player.carried -= this.tuning.pulse_cost;
        this.pulse_cooldown_ticks = Math.round(this.tuning.pulse_cooldown_s * 60);

        const stunnedIds = [];
        const pulseR = this.tuning.pulse_radius;
        const pushDist = this.tuning.pulse_push_m;
        const stunDurationTicks = Math.round(this.tuning.pulse_stun_s * 60);

        for (const shade of this.shades) {
          const d = distXZ(this.player.pos, shade.pos);
          if (d <= pulseR) {
            shade.state = 'stunned';
            shade.stun_ticks = stunDurationTicks;
            stunnedIds.push(shade.id);
            this.score += this.tuning.score.per_stun;

            // Push away
            let pushDx = shade.pos[0] - this.player.pos[0];
            let pushDz = shade.pos[2] - this.player.pos[2];
            const pushLen = Math.hypot(pushDx, pushDz);
            if (pushLen > 0.0001) {
              shade.pos[0] += (pushDx / pushLen) * pushDist;
              shade.pos[2] += (pushDz / pushLen) * pushDist;
            } else {
              shade.pos[0] += pushDist;
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
    } else if (this.pulse_cooldown_ticks > 0) {
      this.pulse_cooldown_ticks--;
    }

    // 6. Update Shades (Move, Safe Zone, Hit Player)
    const shadeSpeedPerTick = this.tuning.shade_speed / 60.0;
    const hitRadius = this.tuning.shade_hit_radius;
    const safeR = this.tuning.safe_radius;

    for (const shade of this.shades) {
      if (shade.state === 'stunned') {
        shade.stun_ticks--;
        if (shade.stun_ticks <= 0) {
          shade.state = 'chase';
        }
      } else if (shade.state === 'chase') {
        // Move towards player
        const dxToPlayer = this.player.pos[0] - shade.pos[0];
        const dzToPlayer = this.player.pos[2] - shade.pos[2];
        const distToPlayer = Math.hypot(dxToPlayer, dzToPlayer);

        if (distToPlayer > 0.001) {
          shade.pos[0] += (dxToPlayer / distToPlayer) * shadeSpeedPerTick;
          shade.pos[2] += (dzToPlayer / distToPlayer) * shadeSpeedPerTick;
        }

        // Check lit lantern safe zone
        for (const lantern of this.lanterns) {
          if (lantern.lit) {
            const dLantern = distXZ(shade.pos, lantern.pos);
            if (dLantern < safeR) {
              // Push out of safe zone
              const outDx = shade.pos[0] - lantern.pos[0];
              const outDz = shade.pos[2] - lantern.pos[2];
              const outLen = Math.hypot(outDx, outDz);
              if (outLen > 0.0001) {
                shade.pos[0] = lantern.pos[0] + (outDx / outLen) * safeR;
                shade.pos[2] = lantern.pos[2] + (outDz / outLen) * safeR;
              } else {
                shade.pos[0] = lantern.pos[0] + safeR;
              }
            }
          }
        }

        // Check hit player
        const distAfterMove = distXZ(this.player.pos, shade.pos);
        if (distAfterMove <= hitRadius && this.invuln_ticks <= 0) {
          this.player.flames = Math.max(0, this.player.flames - 1);
          const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
          this.player.carried -= dropped;
          this.invuln_ticks = Math.round(this.tuning.invuln_s * 60);

          events.push({
            type: 'event',
            tick: currentTick,
            name: 'player_hit',
            data: {
              by: 'shade',
              flames: this.player.flames,
              dropped: dropped
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

    if (this.invuln_ticks > 0) {
      this.invuln_ticks--;
    }

    // 7. Check timeout
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
