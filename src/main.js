import * as THREE from 'three';
import { GameState } from './core/gameState.js';

// --- Web Audio Procedural Sound Effects ---
class AudioManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMoteChime() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playDepositSound() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.2); // E5
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playLanternLitGong() {
    this.init();
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + 1.2);
    });
  }

  playPulseSound() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playHitSound() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

const audio = new AudioManager();

// --- Game Application ---
class App {
  constructor() {
    this.container = document.getElementById('game-canvas');
    this.gameState = new GameState();
    this.gameState.setup();

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070913);
    this.scene.fog = new THREE.FogExp2(0x0b0e1e, 0.015);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camYawDeg = 0;
    this.camPitchDeg = 20;
    this.camDistance = 14;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Input state
    this.keys = {};
    this.mouse = { isDown: false, prevX: 0, prevY: 0 };

    // Meshes cache
    this.moteMeshes = new Map();
    this.shadeMeshes = new Map();
    this.lanternMeshes = [];
    this.pulseWaveMesh = null;

    this.initLights();
    this.buildWorld();
    this.buildPlayer();
    this.initEvents();

    // Game loop timing (fixed 60 tick/sec simulation)
    this.lastTime = performance.now();
    this.accumulatedTime = 0;
    this.tickInterval = 1000 / 60;

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initLights() {
    // Ambient moonlight
    const ambient = new THREE.AmbientLight(0x232d4b, 0.9);
    this.scene.add(ambient);

    // Directional moonlight from above
    const moonLight = new THREE.DirectionalLight(0x6b8afd, 1.2);
    moonLight.position.set(20, 50, 30);
    moonLight.castShadow = true;
    this.scene.add(moonLight);
  }

  buildWorld() {
    // 1. Island surface
    const islandGeo = new THREE.CylinderGeometry(40, 42, 6, 64);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x1a2e22,
      roughness: 0.85,
      metalness: 0.1
    });
    this.islandMesh = new THREE.Mesh(islandGeo, islandMat);
    this.islandMesh.position.y = -3;
    this.islandMesh.receiveShadow = true;
    this.scene.add(this.islandMesh);

    // Island rim stone accent
    const rimGeo = new THREE.TorusGeometry(40, 0.8, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.9 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.1;
    this.scene.add(rimMesh);

    // 2. Floating sea of clouds underneath
    const cloudGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0x11162b,
      transparent: true,
      opacity: 0.7,
      wireframe: false
    });
    this.cloudPlane = new THREE.Mesh(cloudGeo, cloudMat);
    this.cloudPlane.rotation.x = -Math.PI / 2;
    this.cloudPlane.position.y = -15;
    this.scene.add(this.cloudPlane);

    // 3. 5 Big Lanterns (Đèn Lồng Lớn)
    for (const lanternData of this.gameState.lanterns) {
      const group = new THREE.Group();
      group.position.set(lanternData.pos[0], 0, lanternData.pos[2]);

      // Base pedestal
      const baseGeo = new THREE.CylinderGeometry(1.2, 1.5, 1.0, 8);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = 0.5;
      group.add(baseMesh);

      // Wooden pillars
      const pillarGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      for (let i = 0; i < 4; i++) {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        const a = (i * Math.PI) / 2;
        pillar.position.set(Math.cos(a) * 0.7, 2.4, Math.sin(a) * 0.7);
        group.add(pillar);
      }

      // Lantern Core
      const coreGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.8, 16);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xff8c00,
        emissive: 0x221100,
        emissiveIntensity: 0.2,
        roughness: 0.3
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.y = 2.4;
      group.add(coreMesh);

      // Pagoda roof
      const roofGeo = new THREE.ConeGeometry(1.6, 1.2, 8);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
      const roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.y = 3.9;
      group.add(roofMesh);

      // Light source (dim when unlit, bright when lit)
      const light = new THREE.PointLight(0xffa726, 0.4, 8);
      light.position.y = 2.4;
      group.add(light);

      // Ring indicating safe zone (becomes visible when lit)
      const ringGeo = new THREE.RingGeometry(3.9, 4.1, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
      });
      const safeRing = new THREE.Mesh(ringGeo, ringMat);
      safeRing.rotation.x = -Math.PI / 2;
      safeRing.position.y = 0.05;
      group.add(safeRing);

      this.scene.add(group);
      this.lanternMeshes.push({ id: lanternData.id, group, coreMat, light, safeRing });
    }

    // 4. Pulse shockwave mesh (initially hidden)
    const waveGeo = new THREE.RingGeometry(0.1, 0.5, 32);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xffe082,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    this.pulseWaveMesh = new THREE.Mesh(waveGeo, waveMat);
    this.pulseWaveMesh.rotation.x = -Math.PI / 2;
    this.pulseWaveMesh.position.y = 0.15;
    this.scene.add(this.pulseWaveMesh);
  }

  buildPlayer() {
    this.playerGroup = new THREE.Group();

    // Body (Mây - tunic)
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.1, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.75;
    this.playerGroup.add(bodyMesh);

    // Head
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.45;
    this.playerGroup.add(headMesh);

    // Conical Hat (Nón Lá)
    const hatGeo = new THREE.ConeGeometry(0.9, 0.45, 24);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
    const hatMesh = new THREE.Mesh(hatGeo, hatMat);
    hatMesh.position.y = 1.8;
    this.playerGroup.add(hatMesh);

    // Hanging small lantern on hat tip
    const miniLanternGroup = new THREE.Group();
    miniLanternGroup.position.set(0.4, 1.5, 0);

    const miniGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const miniMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    const miniMesh = new THREE.Mesh(miniGeo, miniMat);
    miniLanternGroup.add(miniMesh);

    this.playerLight = new THREE.PointLight(0xffb74d, 1.8, 7);
    miniLanternGroup.add(this.playerLight);

    this.playerGroup.add(miniLanternGroup);
    this.scene.add(this.playerGroup);
  }

  initEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      audio.init();
      this.keys[e.code] = true;
      if (e.code === 'KeyE') this.interactTriggered = true;
      if (e.code === 'KeyF' || e.code === 'Space') this.pulseTriggered = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse camera orbit
    window.addEventListener('mousedown', (e) => {
      audio.init();
      this.mouse.isDown = true;
      this.mouse.prevX = e.clientX;
      this.mouse.prevY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mouse.isDown) {
        const deltaX = e.clientX - this.mouse.prevX;
        const deltaY = e.clientY - this.mouse.prevY;
        this.camYawDeg -= deltaX * 0.4;
        this.camPitchDeg = Math.max(5, Math.min(65, this.camPitchDeg + deltaY * 0.3));
        this.mouse.prevX = e.clientX;
        this.mouse.prevY = e.clientY;
      }
    });

    // UI Buttons
    document.getElementById('pulse-btn').addEventListener('click', () => {
      audio.init();
      this.pulseTriggered = true;
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
      this.restart();
    });
  }

  restart() {
    document.getElementById('end-modal').style.display = 'none';
    this.gameState.setup();
    // Clear dynamic meshes
    for (const mesh of this.moteMeshes.values()) this.scene.remove(mesh);
    this.moteMeshes.clear();
    for (const mesh of this.shadeMeshes.values()) this.scene.remove(mesh);
    this.shadeMeshes.clear();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateSimulation() {
    // Read keyboard for movement vector [x, z]
    let moveX = 0;
    let moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    const frame = {
      move: [moveX, moveZ],
      cam_yaw_deg: this.camYawDeg,
      interact: !!this.interactTriggered,
      pulse: !!this.pulseTriggered,
      jump: !!this.keys['KeyJ']
    };

    this.interactTriggered = false;
    this.pulseTriggered = false;

    // Step deterministic core game state
    const events = this.gameState.step(frame);

    // Audio & Visual Event Feedback
    for (const ev of events) {
      if (ev.name === 'mote_picked') {
        audio.playMoteChime();
      } else if (ev.name === 'deposit') {
        audio.playDepositSound();
      } else if (ev.name === 'lantern_lit') {
        audio.playLanternLitGong();
      } else if (ev.name === 'pulse') {
        audio.playPulseSound();
        this.triggerPulseWave();
      } else if (ev.name === 'player_hit') {
        audio.playHitSound();
      } else if (ev.name === 'game_over') {
        this.showGameOverModal(ev.data);
      }
    }

    this.updateHUD();
  }

  triggerPulseWave() {
    if (!this.pulseWaveMesh) return;
    this.pulseWaveMesh.position.set(
      this.gameState.player.pos[0],
      0.15,
      this.gameState.player.pos[2]
    );
    this.pulseWaveAnim = { radius: 0.5, opacity: 0.9 };
  }

  updateHUD() {
    // Flames
    const flamesContainer = document.getElementById('flames-container');
    const flames = this.gameState.player.flames;
    flamesContainer.innerHTML = [1, 2, 3]
      .map((i) => `<span class="flame-icon ${i <= flames ? '' : 'flame-lost'}">🔥</span>`)
      .join('');

    // Timer
    const timeLeft = Math.max(0, this.gameState.time_left_s);
    const mins = Math.floor(timeLeft / 60);
    const secs = Math.floor(timeLeft % 60);
    document.getElementById('hud-timer').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Lanterns
    const litCount = this.gameState.lanterns.filter((l) => l.lit).length;
    document.getElementById('hud-lanterns').textContent = `Đèn Lớn: ${litCount} / 5`;

    // Score & Motes
    document.getElementById('hud-score').textContent = this.gameState.score;
    document.getElementById('hud-motes').textContent = `Đom đóm: ${this.gameState.player.carried} / ${this.gameState.tuning.carry_capacity}`;

    // Pulse button styling
    const pulseBtn = document.getElementById('pulse-btn');
    if (this.gameState.player.carried >= this.gameState.tuning.pulse_cost) {
      pulseBtn.classList.add('pulse-ready');
      pulseBtn.style.opacity = '1.0';
    } else {
      pulseBtn.classList.remove('pulse-ready');
      pulseBtn.style.opacity = '0.5';
    }
  }

  showGameOverModal(data) {
    const modal = document.getElementById('end-modal');
    const title = document.getElementById('end-title');
    const desc = document.getElementById('end-desc');
    const score = document.getElementById('end-score');

    if (data.result === 'won') {
      title.textContent = '🎉 CHIẾN THẮNG!';
      title.style.color = '#34d399';
      desc.textContent =
        'Mây đã thắp sáng cả 5 Đèn Lồng Lớn! Toàn bộ Đảo Bến bừng sáng trong đêm ấm áp.';
    } else {
      title.textContent = '💀 THẤT BẠI';
      title.style.color = '#f87171';
      if (data.reason === 'no_flames') {
        desc.textContent = 'Mây đã bị Bóng Mực dập tắt hết ngọn lửa sống...';
      } else {
        desc.textContent = 'Bình minh đã đến trước khi đèn được thắp đủ...';
      }
    }
    score.textContent = `Điểm cuối cùng: ${this.gameState.score}`;
    modal.style.display = 'flex';
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;
    this.accumulatedTime += dt;

    // Fixed tick update
    while (this.accumulatedTime >= this.tickInterval) {
      this.updateSimulation();
      this.accumulatedTime -= this.tickInterval;
    }

    // Render Sync
    this.syncMeshes(now * 0.001);
    this.updateCamera();

    this.renderer.render(this.scene, this.camera);
  }

  syncMeshes(timeSec) {
    // 1. Player mesh sync
    const pPos = this.gameState.player.pos;
    this.playerGroup.position.set(pPos[0], pPos[1], pPos[2]);

    // Face camera direction
    this.playerGroup.rotation.y = (this.camYawDeg * Math.PI) / 180 + Math.PI;

    // 2. Lanterns sync
    for (const lanternData of this.gameState.lanterns) {
      const meshObj = this.lanternMeshes.find((m) => m.id === lanternData.id);
      if (meshObj) {
        if (lanternData.lit) {
          meshObj.coreMat.emissive.setHex(0xff7700);
          meshObj.coreMat.emissiveIntensity = 1.0 + Math.sin(timeSec * 4) * 0.2;
          meshObj.light.intensity = 2.5;
          meshObj.safeRing.material.opacity = 0.5 + Math.sin(timeSec * 3) * 0.15;
        } else {
          const ratio = lanternData.deposited / this.gameState.tuning.lantern_cost;
          meshObj.coreMat.emissive.setHex(0xaa4400);
          meshObj.coreMat.emissiveIntensity = 0.2 + ratio * 0.5;
          meshObj.light.intensity = 0.4 + ratio * 0.8;
          meshObj.safeRing.material.opacity = 0;
        }
      }
    }

    // 3. Motes sync (floating fireflies)
    const currentMoteIds = new Set(this.gameState.motes.map((m) => m.id));
    // Remove dead motes
    for (const [id, mesh] of this.moteMeshes.entries()) {
      if (!currentMoteIds.has(id)) {
        this.scene.remove(mesh);
        this.moteMeshes.delete(id);
      }
    }
    // Add / update active motes
    for (const mote of this.gameState.motes) {
      let mesh = this.moteMeshes.get(mote.id);
      if (!mesh) {
        const geo = new THREE.SphereGeometry(0.2, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        mesh = new THREE.Mesh(geo, mat);
        const light = new THREE.PointLight(0xffea00, 0.8, 3);
        mesh.add(light);
        this.scene.add(mesh);
        this.moteMeshes.set(mote.id, mesh);
      }
      const bob = Math.sin(timeSec * 3 + mote.pos[0]) * 0.3 + 0.6;
      mesh.position.set(mote.pos[0], bob, mote.pos[2]);
    }

    // 4. Shades sync
    const currentShadeIds = new Set(this.gameState.shades.map((s) => s.id));
    for (const [id, mesh] of this.shadeMeshes.entries()) {
      if (!currentShadeIds.has(id)) {
        this.scene.remove(mesh);
        this.shadeMeshes.delete(id);
      }
    }
    for (const shade of this.gameState.shades) {
      let mesh = this.shadeMeshes.get(shade.id);
      if (!mesh) {
        const group = new THREE.Group();
        const geo = new THREE.SphereGeometry(0.7, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x180928,
          roughness: 0.9,
          emissive: 0x3b0764,
          emissiveIntensity: 0.5
        });
        const shadeBody = new THREE.Mesh(geo, mat);
        shadeBody.position.y = 0.7;
        group.add(shadeBody);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.25, 0.85, 0.55);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.25, 0.85, 0.55);
        group.add(leftEye, rightEye);

        this.scene.add(group);
        mesh = { group, bodyMat: mat };
        this.shadeMeshes.set(shade.id, mesh);
      }

      mesh.group.position.set(shade.pos[0], 0, shade.pos[2]);
      if (shade.state === 'stunned') {
        mesh.bodyMat.emissive.setHex(0xfef08a);
        mesh.bodyMat.emissiveIntensity = 1.0;
      } else {
        mesh.bodyMat.emissive.setHex(0x3b0764);
        mesh.bodyMat.emissiveIntensity = 0.5;
      }
    }

    // 5. Pulse wave animation
    if (this.pulseWaveAnim && this.pulseWaveMesh) {
      this.pulseWaveAnim.radius += 0.35;
      this.pulseWaveAnim.opacity -= 0.035;
      this.pulseWaveMesh.scale.set(
        this.pulseWaveAnim.radius,
        this.pulseWaveAnim.radius,
        1
      );
      this.pulseWaveMesh.material.opacity = Math.max(0, this.pulseWaveAnim.opacity);
      if (this.pulseWaveAnim.opacity <= 0) {
        this.pulseWaveAnim = null;
      }
    }
  }

  updateCamera() {
    const pPos = this.gameState.player.pos;
    const yawRad = (this.camYawDeg * Math.PI) / 180;
    const pitchRad = (this.camPitchDeg * Math.PI) / 180;

    const hDist = this.camDistance * Math.cos(pitchRad);
    const vDist = this.camDistance * Math.sin(pitchRad);

    const camX = pPos[0] - Math.sin(yawRad) * hDist;
    const camZ = pPos[2] - Math.cos(yawRad) * hDist;
    const camY = pPos[1] + vDist + 2;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(pPos[0], pPos[1] + 1.2, pPos[2]);
  }
}

// Start game
new App();
