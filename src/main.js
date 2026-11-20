import * as THREE from 'three';
import { GameState } from './core/gameState.js';

// --- Procedural Sound Synthesis (Web Audio API) ---
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
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12); // E6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playDepositSound() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  playLanternLitGong() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [329.63, 440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.2, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + 1.2);
      });
    } catch (e) {}
  }

  playPulseSound() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playHitSound() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }
}

const audio = new AudioManager();

// --- Main 3D Game Class ---
class App {
  constructor() {
    this.container = document.getElementById('game-canvas');
    this.gameState = new GameState();
    this.gameState.setup();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x0a0f24, 0.014);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camYawDeg = 0;
    this.camPitchDeg = 24;
    this.camDistance = 15;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Input state
    this.keys = {};
    this.mouse = { isDown: false, prevX: 0, prevY: 0 };
    this.walkCycle = 0;

    // Cached elements for HUD optimization
    this.hudElements = {
      flames: document.getElementById('flames-container'),
      timer: document.getElementById('hud-timer'),
      lanterns: document.getElementById('hud-lanterns'),
      score: document.getElementById('hud-score'),
      motes: document.getElementById('hud-motes'),
      pulseBtn: document.getElementById('pulse-btn')
    };
    this.lastHudState = {};

    // Meshes cache
    this.moteMeshes = new Map();
    this.shadeMeshes = new Map();
    this.lanternMeshes = [];
    this.pulseWaveAnim = null;

    this.initLights();
    this.buildWorld();
    this.buildPlayer();
    this.initEvents();

    this.lastTime = performance.now();
    this.accumulatedTime = 0;
    this.tickInterval = 1000 / 60;

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initLights() {
    // Soft fairy-tale ambient moonlight
    const ambient = new THREE.AmbientLight(0x283556, 1.2);
    this.scene.add(ambient);

    // Warm celestial moon
    const moon = new THREE.DirectionalLight(0x7ea2f8, 1.4);
    moon.position.set(25, 45, 20);
    moon.castShadow = true;
    moon.shadow.mapSize.width = 1024;
    moon.shadow.mapSize.height = 1024;
    moon.shadow.camera.near = 10;
    moon.shadow.camera.far = 100;
    moon.shadow.camera.left = -40;
    moon.shadow.camera.right = 40;
    moon.shadow.camera.top = 40;
    moon.shadow.camera.bottom = -40;
    this.scene.add(moon);
  }

  buildWorld() {
    // 1. Lush Multi-layered Floating Island
    const islandGroup = new THREE.Group();

    // Grass Top Layer
    const grassGeo = new THREE.CylinderGeometry(40, 40.5, 2.5, 64);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x1b3826,
      roughness: 0.8,
      metalness: 0.05
    });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.position.y = -1.25;
    grassMesh.receiveShadow = true;
    islandGroup.add(grassMesh);

    // Stone cliff bedrock underneath
    const rockGeo = new THREE.CylinderGeometry(40.5, 20, 18, 32);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x1e2433,
      roughness: 0.95,
      metalness: 0.1
    });
    const rockMesh = new THREE.Mesh(rockGeo, rockMat);
    rockMesh.position.y = -11.5;
    islandGroup.add(rockMesh);

    // Island rim decorative ring
    const rimGeo = new THREE.TorusGeometry(40, 0.6, 12, 64);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.05;
    islandGroup.add(rimMesh);

    // Cobblestone Central Plaza
    const plazaGeo = new THREE.CircleGeometry(7.0, 32);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0x273142, roughness: 0.85 });
    const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
    plazaMesh.rotation.x = -Math.PI / 2;
    plazaMesh.position.y = 0.02;
    islandGroup.add(plazaMesh);

    // Stone paths radiating to 5 lanterns
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 + Math.PI / 2;
      const pathGeo = new THREE.PlaneGeometry(2.4, 25);
      const pathMat = new THREE.MeshStandardMaterial({ color: 0x222a38, roughness: 0.9 });
      const pathMesh = new THREE.Mesh(pathGeo, pathMat);
      pathMesh.rotation.x = -Math.PI / 2;
      pathMesh.rotation.z = -angle + Math.PI / 2;
      pathMesh.position.set(Math.cos(angle) * 12.5, 0.015, Math.sin(angle) * 12.5);
      islandGroup.add(pathMesh);
    }

    this.scene.add(islandGroup);

    // 2. Animated Sea of Clouds Below
    const cloudGeo = new THREE.PlaneGeometry(350, 350, 32, 32);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0x0c1224,
      transparent: true,
      opacity: 0.75
    });
    this.cloudPlane = new THREE.Mesh(cloudGeo, cloudMat);
    this.cloudPlane.rotation.x = -Math.PI / 2;
    this.cloudPlane.position.y = -22;
    this.scene.add(this.cloudPlane);

    // 3. Ancient Multi-Tiered Pagoda Lanterns (5 Đèn Lớn)
    for (const lanternData of this.gameState.lanterns) {
      const lanternGroup = new THREE.Group();
      lanternGroup.position.set(lanternData.pos[0], 0, lanternData.pos[2]);

      // Ornate stone pedestal
      const pedBaseGeo = new THREE.CylinderGeometry(1.5, 1.8, 0.6, 8);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
      const pedBase = new THREE.Mesh(pedBaseGeo, stoneMat);
      pedBase.position.y = 0.3;
      lanternGroup.add(pedBase);

      const pedColGeo = new THREE.CylinderGeometry(1.1, 1.3, 0.8, 8);
      const pedCol = new THREE.Mesh(pedColGeo, stoneMat);
      pedCol.position.y = 0.9;
      lanternGroup.add(pedCol);

      // 4 Wooden carved pillars
      const pillarGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.6, 8);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c2b16, roughness: 0.7 });
      for (let p = 0; p < 4; p++) {
        const pa = (p * Math.PI) / 2 + Math.PI / 4;
        const pillar = new THREE.Mesh(pillarGeo, woodMat);
        pillar.position.set(Math.cos(pa) * 0.8, 2.5, Math.sin(pa) * 0.8);
        lanternGroup.add(pillar);
      }

      // Glowing Inner Silk Lantern
      const silkGeo = new THREE.CylinderGeometry(0.68, 0.68, 1.9, 16);
      const silkMat = new THREE.MeshStandardMaterial({
        color: 0xff8f00,
        emissive: 0x331100,
        emissiveIntensity: 0.25,
        roughness: 0.4
      });
      const silkMesh = new THREE.Mesh(silkGeo, silkMat);
      silkMesh.position.y = 2.5;
      lanternGroup.add(silkMesh);

      // Double-Tiered Pagoda Eaves / Roof
      const roofLowerGeo = new THREE.ConeGeometry(1.8, 0.7, 8);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.6 });
      const roofLower = new THREE.Mesh(roofLowerGeo, roofMat);
      roofLower.position.y = 3.65;
      lanternGroup.add(roofLower);

      const roofUpperGeo = new THREE.ConeGeometry(1.3, 0.8, 8);
      const roofUpper = new THREE.Mesh(roofUpperGeo, roofMat);
      roofUpper.position.y = 4.25;
      lanternGroup.add(roofUpper);

      // Gold spire finial
      const spireGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7, roughness: 0.2 });
      const spire = new THREE.Mesh(spireGeo, goldMat);
      spire.position.y = 4.8;
      lanternGroup.add(spire);

      // Lantern light
      const light = new THREE.PointLight(0xff9800, 0.5, 9);
      light.position.y = 2.5;
      lanternGroup.add(light);

      // Sacred Safe Zone Halo Ring
      const safeRingGeo = new THREE.RingGeometry(3.85, 4.05, 48);
      const safeRingMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
      });
      const safeRing = new THREE.Mesh(safeRingGeo, safeRingMat);
      safeRing.rotation.x = -Math.PI / 2;
      safeRing.position.y = 0.06;
      lanternGroup.add(safeRing);

      this.scene.add(lanternGroup);
      this.lanternMeshes.push({
        id: lanternData.id,
        group: lanternGroup,
        silkMat,
        light,
        safeRing
      });
    }

    // 4. Pulse shockwave ring
    const waveGeo = new THREE.RingGeometry(0.1, 0.4, 48);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    this.pulseWaveMesh = new THREE.Mesh(waveGeo, waveMat);
    this.pulseWaveMesh.rotation.x = -Math.PI / 2;
    this.pulseWaveMesh.position.y = 0.18;
    this.scene.add(this.pulseWaveMesh);
  }

  buildPlayer() {
    this.playerGroup = new THREE.Group();

    // Body (Mây - Indigo traditional tunic)
    const tunicGeo = new THREE.CylinderGeometry(0.38, 0.52, 1.15, 16);
    const tunicMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.65 });
    this.playerBody = new THREE.Mesh(tunicGeo, tunicMat);
    this.playerBody.position.y = 0.78;
    this.playerGroup.add(this.playerBody);

    // Golden waist sash
    const sashGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.2, 16);
    const sashMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const sash = new THREE.Mesh(sashGeo, sashMat);
    sash.position.y = 0.78;
    this.playerGroup.add(sash);

    // Cute stylized head
    const headGeo = new THREE.SphereGeometry(0.34, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.48;
    this.playerGroup.add(head);

    // Vietnamese Conical Hat (Nón Lá) with subtle weave rim
    const hatGeo = new THREE.ConeGeometry(0.95, 0.48, 32);
    const hatMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.85,
      bumpScale: 0.05
    });
    this.playerHat = new THREE.Mesh(hatGeo, hatMat);
    this.playerHat.position.y = 1.82;
    this.playerGroup.add(this.playerHat);

    // Hanging Mini Lantern from hat apex
    this.miniLanternHolder = new THREE.Group();
    this.miniLanternHolder.position.set(0.45, 1.55, 0);

    // Small hanging cord
    const cordGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 4);
    const cordMat = new THREE.MeshBasicMaterial({ color: 0xb45309 });
    const cord = new THREE.Mesh(cordGeo, cordMat);
    cord.position.y = 0.22;
    this.miniLanternHolder.add(cord);

    // Mini glowing lantern
    const miniLanternGeo = new THREE.OctahedronGeometry(0.16, 0);
    const miniLanternMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
      roughness: 0.3
    });
    const miniLanternMesh = new THREE.Mesh(miniLanternGeo, miniLanternMat);
    this.miniLanternHolder.add(miniLanternMesh);

    // Warm personal light source
    this.playerLight = new THREE.PointLight(0xfbbf24, 2.0, 9);
    this.playerLight.position.set(0, 0, 0);
    this.miniLanternHolder.add(this.playerLight);

    this.playerGroup.add(this.miniLanternHolder);
    this.scene.add(this.playerGroup);
  }

  initEvents() {
    window.addEventListener('keydown', (e) => {
      audio.init();
      this.keys[e.code] = true;
      if (e.code === 'KeyE') this.interactTriggered = true;
      if (e.code === 'KeyF' || e.code === 'Space') this.pulseTriggered = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Camera control
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
        this.camPitchDeg = Math.max(6, Math.min(65, this.camPitchDeg + deltaY * 0.3));
        this.mouse.prevX = e.clientX;
        this.mouse.prevY = e.clientY;
      }
    });

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
    for (const mesh of this.moteMeshes.values()) this.scene.remove(mesh);
    this.moteMeshes.clear();
    for (const mesh of this.shadeMeshes.values()) this.scene.remove(mesh.group);
    this.shadeMeshes.clear();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateSimulation() {
    // Correct movement orientation:
    // W: Forward into scene
    // S: Backward towards screen
    // A: Left relative to screen
    // D: Right relative to screen
    let moveX = 0;
    let moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX += 1; // Corrected Left
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX -= 1; // Corrected Right

    const isMoving = moveX !== 0 || moveZ !== 0;
    if (isMoving) {
      this.walkCycle += 0.25;
    }

    const frame = {
      move: [moveX, moveZ],
      cam_yaw_deg: this.camYawDeg,
      interact: !!this.interactTriggered,
      pulse: !!this.pulseTriggered,
      jump: !!this.keys['KeyJ']
    };

    this.interactTriggered = false;
    this.pulseTriggered = false;

    // Run deterministic core step
    const events = this.gameState.step(frame);

    // Audio triggers without lag
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
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
      0.18,
      this.gameState.player.pos[2]
    );
    this.pulseWaveAnim = { radius: 0.5, opacity: 0.95 };
  }

  // Optimized HUD update (zero DOM layout thrashing)
  updateHUD() {
    const flames = this.gameState.player.flames;
    if (this.lastHudState.flames !== flames) {
      this.lastHudState.flames = flames;
      const spans = this.hudElements.flames.children;
      for (let i = 0; i < 3; i++) {
        if (spans[i]) {
          if (i < flames) spans[i].classList.remove('flame-lost');
          else spans[i].classList.add('flame-lost');
        }
      }
    }

    const timeLeft = Math.max(0, this.gameState.time_left_s);
    const secsInt = Math.floor(timeLeft);
    if (this.lastHudState.secsInt !== secsInt) {
      this.lastHudState.secsInt = secsInt;
      const mins = Math.floor(secsInt / 60);
      const secs = secsInt % 60;
      this.hudElements.timer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const litCount = this.gameState.lanterns.filter((l) => l.lit).length;
    if (this.lastHudState.litCount !== litCount) {
      this.lastHudState.litCount = litCount;
      this.hudElements.lanterns.textContent = `Đèn Lớn: ${litCount} / 5`;
    }

    const score = this.gameState.score;
    if (this.lastHudState.score !== score) {
      this.lastHudState.score = score;
      this.hudElements.score.textContent = score;
    }

    const carried = this.gameState.player.carried;
    if (this.lastHudState.carried !== carried) {
      this.lastHudState.carried = carried;
      this.hudElements.motes.textContent = `Đom đóm: ${carried} / ${this.gameState.tuning.carry_capacity}`;
      if (carried >= this.gameState.tuning.pulse_cost) {
        this.hudElements.pulseBtn.classList.add('pulse-ready');
        this.hudElements.pulseBtn.style.opacity = '1.0';
      } else {
        this.hudElements.pulseBtn.classList.remove('pulse-ready');
        this.hudElements.pulseBtn.style.opacity = '0.5';
      }
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
        'Mây đã thắp sáng cả 5 Đèn Lồng Lớn! Sương đen tan biến, hòn đảo bừng sáng trong đêm ấm áp!';
    } else {
      title.textContent = '💀 THẤT BẠI';
      title.style.color = '#f87171';
      desc.textContent =
        data.reason === 'no_flames'
          ? 'Mây đã bị Bóng Mực dập tắt hết ngọn lửa...'
          : 'Bình minh đã đến trước khi kịp thắp sáng hòn đảo...';
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

    while (this.accumulatedTime >= this.tickInterval) {
      this.updateSimulation();
      this.accumulatedTime -= this.tickInterval;
    }

    this.syncMeshes(now * 0.001);
    this.updateCamera();

    this.renderer.render(this.scene, this.camera);
  }

  syncMeshes(timeSec) {
    // 1. Sync Player position & walk bobbing animation
    const pPos = this.gameState.player.pos;
    const walkBob = Math.abs(Math.sin(this.walkCycle)) * 0.12;
    this.playerGroup.position.set(pPos[0], pPos[1] + walkBob, pPos[2]);
    this.playerGroup.rotation.y = (this.camYawDeg * Math.PI) / 180 + Math.PI;

    // Mini lantern swaying animation
    if (this.miniLanternHolder) {
      this.miniLanternHolder.rotation.z = Math.sin(timeSec * 5) * 0.15;
      this.miniLanternHolder.rotation.x = Math.cos(timeSec * 4) * 0.12;
    }

    // 2. Sync 5 Lanterns
    for (let i = 0; i < this.gameState.lanterns.length; i++) {
      const lData = this.gameState.lanterns[i];
      const mObj = this.lanternMeshes[i];
      if (mObj) {
        if (lData.lit) {
          mObj.silkMat.emissive.setHex(0xff7700);
          mObj.silkMat.emissiveIntensity = 0.9 + Math.sin(timeSec * 3 + i) * 0.2;
          mObj.light.intensity = 2.4;
          mObj.safeRing.material.opacity = 0.55 + Math.sin(timeSec * 3) * 0.15;
        } else {
          const ratio = lData.deposited / this.gameState.tuning.lantern_cost;
          mObj.silkMat.emissive.setHex(0xb45309);
          mObj.silkMat.emissiveIntensity = 0.2 + ratio * 0.45;
          mObj.light.intensity = 0.4 + ratio * 0.7;
          mObj.safeRing.material.opacity = 0;
        }
      }
    }

    // 3. Sync Motes (Lightweight Glowing Sprites/Spheres - Zero Lag)
    const activeIds = new Set();
    for (let i = 0; i < this.gameState.motes.length; i++) {
      const mote = this.gameState.motes[i];
      activeIds.add(mote.id);
      let mesh = this.moteMeshes.get(mote.id);
      if (!mesh) {
        const geo = new THREE.SphereGeometry(0.25, 10, 10);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xffea00,
          wireframe: false
        });
        mesh = new THREE.Mesh(geo, mat);

        // Soft outer glow sphere
        const glowGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.35
        });
        mesh.add(new THREE.Mesh(glowGeo, glowMat));

        this.scene.add(mesh);
        this.moteMeshes.set(mote.id, mesh);
      }
      const bob = Math.sin(timeSec * 3.5 + mote.pos[0] * 2) * 0.35 + 0.7;
      mesh.position.set(mote.pos[0], bob, mote.pos[2]);
    }

    // Clean up collected motes instantly
    for (const [id, mesh] of this.moteMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.moteMeshes.delete(id);
      }
    }

    // 4. Sync Ink Shades (Bóng Mực - Menacing dark phantoms with purple eyes)
    const activeShadeIds = new Set();
    for (let i = 0; i < this.gameState.shades.length; i++) {
      const shade = this.gameState.shades[i];
      activeShadeIds.add(shade.id);
      let mItem = this.shadeMeshes.get(shade.id);
      if (!mItem) {
        const group = new THREE.Group();

        // Dark shadowy body
        const bodyGeo = new THREE.SphereGeometry(0.75, 16, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0x0f0717,
          roughness: 0.9,
          emissive: 0x2e0854,
          emissiveIntensity: 0.6
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.8;
        group.add(body);

        // Tendril bumps
        for (let t = 0; t < 5; t++) {
          const tGeo = new THREE.SphereGeometry(0.25, 8, 8);
          const tMesh = new THREE.Mesh(tGeo, bodyMat);
          const ta = (t * Math.PI * 2) / 5;
          tMesh.position.set(Math.cos(ta) * 0.5, 0.4, Math.sin(ta) * 0.5);
          group.add(tMesh);
        }

        // Glowing fierce eyes
        const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe879f9 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.25, 0.95, 0.6);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.25, 0.95, 0.6);
        group.add(leftEye, rightEye);

        this.scene.add(group);
        mItem = { group, bodyMat, eyeMat };
        this.shadeMeshes.set(shade.id, mItem);
      }

      mItem.group.position.set(shade.pos[0], 0, shade.pos[2]);

      // Look at player
      const dx = this.gameState.player.pos[0] - shade.pos[0];
      const dz = this.gameState.player.pos[2] - shade.pos[2];
      mItem.group.rotation.y = Math.atan2(dx, dz);

      if (shade.state === 'stunned') {
        mItem.bodyMat.emissive.setHex(0xfef08a);
        mItem.bodyMat.emissiveIntensity = 1.0;
        mItem.eyeMat.color.setHex(0xffffff);
      } else {
        mItem.bodyMat.emissive.setHex(0x2e0854);
        mItem.bodyMat.emissiveIntensity = 0.6;
        mItem.eyeMat.color.setHex(0xe879f9);
      }
    }

    for (const [id, mItem] of this.shadeMeshes.entries()) {
      if (!activeShadeIds.has(id)) {
        this.scene.remove(mItem.group);
        this.shadeMeshes.delete(id);
      }
    }

    // 5. Expanding pulse wave
    if (this.pulseWaveAnim && this.pulseWaveMesh) {
      this.pulseWaveAnim.radius += 0.4;
      this.pulseWaveAnim.opacity -= 0.04;
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
    const camY = pPos[1] + vDist + 2.2;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(pPos[0], pPos[1] + 1.2, pPos[2]);
  }
}

new App();
