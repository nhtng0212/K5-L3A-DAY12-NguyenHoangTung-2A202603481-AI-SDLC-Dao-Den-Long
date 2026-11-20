import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GameState } from './core/gameState.js';
import { VFXManager } from './core/vfx.js';
import {
  createBambooTexture,
  createTerracottaRoofTexture,
  createStonePlazaTexture,
  createSilkLanternTexture
} from './core/textures.js';

// --- Procedural Sound Synthesis ---
class AudioManager {
  constructor() {
    this.ctx = null;
    this.volume = parseFloat(localStorage.getItem('dao_vol') || '0.7');
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

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    localStorage.setItem('dao_vol', this.volume.toString());
  }

  playMoteChime() {
    if (!this.ctx || this.volume <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12);
      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playDepositSound() {
    if (!this.ctx || this.volume <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18);
      gain.gain.setValueAtTime(0.18 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  playLanternLitGong() {
    if (!this.ctx || this.volume <= 0) return;
    try {
      const now = this.ctx.currentTime;
      [329.63, 440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.2 * this.volume, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + 1.2);
      });
    } catch (e) {}
  }

  playPulseSound() {
    if (!this.ctx || this.volume <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
      gain.gain.setValueAtTime(0.25 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playDashSound() {
    if (!this.ctx || this.volume <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      gain.gain.setValueAtTime(0.2 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  playJumpSound() {
    if (!this.ctx || this.volume <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
      gain.gain.setValueAtTime(0.15 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playHitSound() {
    if (!this.ctx || this.volume <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
      gain.gain.setValueAtTime(0.25 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }
}

const audio = new AudioManager();

// --- 3D Application ---
class App {
  constructor() {
    this.container = document.getElementById('game-canvas');
    this.currentNight = 1;
    this.totalScore = 0;
    this.mouseSens = parseFloat(localStorage.getItem('dao_sens') || '0.4');
    this.colorblind = localStorage.getItem('dao_colorblind') === 'true';

    this.gameState = new GameState({}, this.currentNight);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1430);
    this.scene.fog = new THREE.FogExp2(0x1b2350, 0.012);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camYawDeg = 0;
    this.camPitchDeg = 24;
    this.camDistance = 15;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Initialize Procedural Textures
    this.bambooTex = createBambooTexture();
    this.roofTex = createTerracottaRoofTexture();
    this.stoneTex = createStonePlazaTexture();
    this.silkTex = createSilkLanternTexture();

    this.keys = {};
    this.mouse = { isDown: false, prevX: 0, prevY: 0 };
    this.walkCycle = 0;

    // Shared geometry & materials for instant zero-lag firefly spawning & pickups
    this.moteGeo = new THREE.SphereGeometry(0.25, 10, 10);
    this.moteMat = new THREE.MeshBasicMaterial({ color: 0xfff6c2 });
    this.moteGlowGeo = new THREE.SphereGeometry(0.5, 8, 8);
    this.moteGlowMat = new THREE.MeshBasicMaterial({ color: 0xffe58a, transparent: true, opacity: 0.35 });

    this.moteMeshes = new Map();
    this.shadeMeshes = new Map();
    this.drifterMeshes = new Map();
    this.charmMeshes = new Map();
    this.lanternMeshes = [];
    this.islandGroup = new THREE.Group();
    this.scene.add(this.islandGroup);

    this.vfx = new VFXManager(this.scene);
    this.jumpAnimScale = 1.0;
    this.landAnimSquash = 1.0;
    this.wasGrounded = true;

    this.gltfLoader = new GLTFLoader();
    this.models = {};

    this.initLights();
    this.buildWorld();
    this.buildPlayer();
    this.load3DAssets();
    this.initEvents();

    this.lastTime = performance.now();
    this.accumulatedTime = 0;
    this.tickInterval = 1000 / 60;

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initLights() {
    this.ambientLight = new THREE.AmbientLight(0x283556, 0.7);
    this.scene.add(this.ambientLight);

    this.moonLight = new THREE.DirectionalLight(0x7ea2f8, 1.2);
    this.moonLight.position.set(30, 60, 20);
    this.moonLight.castShadow = true;
    this.scene.add(this.moonLight);
  }

  buildWorld() {
    while (this.islandGroup.children.length > 0) {
      this.islandGroup.remove(this.islandGroup.children[0]);
    }
    this.lanternMeshes = [];

    if (this.currentNight === 1) {
      const grassGeo = new THREE.CylinderGeometry(40, 40.5, 2.5, 64);
      const grassMat = new THREE.MeshStandardMaterial({ color: 0x2f5d50, roughness: 0.8 });
      const grass = new THREE.Mesh(grassGeo, grassMat);
      grass.position.y = -1.25;
      grass.receiveShadow = true;
      this.islandGroup.add(grass);

      // Cobblestone Central Plaza
      const plazaGeo = new THREE.CircleGeometry(7.0, 32);
      const plazaMat = new THREE.MeshStandardMaterial({ map: this.stoneTex, roughness: 0.85 });
      const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
      plazaMesh.rotation.x = -Math.PI / 2;
      plazaMesh.position.y = 0.02;
      this.islandGroup.add(plazaMesh);

      const cliffGeo = new THREE.CylinderGeometry(40.5, 20, 20, 32);
      const cliffMat = new THREE.MeshStandardMaterial({ color: 0x1e2433, roughness: 0.95 });
      const cliff = new THREE.Mesh(cliffGeo, cliffMat);
      cliff.position.y = -12.5;
      this.islandGroup.add(cliff);
    } else if (this.currentNight === 2) {
      [ [0, 0], [70, 0] ].forEach(([cx, cz]) => {
        const grassGeo = new THREE.CylinderGeometry(28, 28.5, 2.5, 48);
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x2f5d50, roughness: 0.8 });
        const grass = new THREE.Mesh(grassGeo, grassMat);
        grass.position.set(cx, -1.25, cz);
        this.islandGroup.add(grass);
      });

      const bridgeGeo = new THREE.BoxGeometry(18, 0.4, 4);
      const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.7 });
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.set(35, -0.2, 0);
      this.islandGroup.add(bridge);

      const padGeo = new THREE.CylinderGeometry(1.0, 1.1, 0.3, 16);
      const padMat = new THREE.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0xc9b48a, emissiveIntensity: 0.5 });
      const pad1 = new THREE.Mesh(padGeo, padMat);
      pad1.position.set(20, 0.15, 18);
      const pad2 = new THREE.Mesh(padGeo, padMat);
      pad2.position.set(50, 0.15, -18);
      this.islandGroup.add(pad1, pad2);
    } else if (this.currentNight === 3) {
      const t0Geo = new THREE.CylinderGeometry(45, 45.5, 2.0, 64);
      const grassMat = new THREE.MeshStandardMaterial({ color: 0x2f5d50, roughness: 0.8 });
      const t0 = new THREE.Mesh(t0Geo, grassMat);
      t0.position.y = -1.0;
      this.islandGroup.add(t0);

      const t1Geo = new THREE.CylinderGeometry(24, 24, 3.0, 32);
      const t1 = new THREE.Mesh(t1Geo, grassMat);
      t1.position.set(0, 1.5, 0);
      this.islandGroup.add(t1);

      const t2Geo = new THREE.CylinderGeometry(8, 8, 3.0, 24);
      const t2 = new THREE.Mesh(t2Geo, grassMat);
      t2.position.set(0, 4.5, 0);
      this.islandGroup.add(t2);

      const towerGeo = new THREE.CylinderGeometry(2.0, 2.0, 8.0, 16);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.8 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(0, 10.0, 0);
      this.islandGroup.add(tower);

      const padGeo = new THREE.CylinderGeometry(1.0, 1.1, 0.3, 16);
      const padMat = new THREE.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0xc9b48a, emissiveIntensity: 0.5 });
      const pad3 = new THREE.Mesh(padGeo, padMat);
      pad3.position.set(0, 3.15, 13);
      this.islandGroup.add(pad3);
    }

    // Build Lanterns with Textures
    for (const lData of this.gameState.lanterns) {
      const group = new THREE.Group();
      group.position.set(lData.pos[0], lData.pos[1], lData.pos[2]);

      const baseGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.6, 8);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x5b5f6e, roughness: 0.85 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.3;
      group.add(base);

      const silkGeo = new THREE.CylinderGeometry(0.68, 0.68, 1.9, 16);
      const silkMat = new THREE.MeshStandardMaterial({
        map: this.silkTex,
        color: 0xffb347,
        emissive: 0x5b5f6e,
        emissiveIntensity: 0.25,
        roughness: 0.4
      });
      const silk = new THREE.Mesh(silkGeo, silkMat);
      silk.position.y = 2.4;
      group.add(silk);

      const roofGeo = new THREE.ConeGeometry(1.8, 0.8, 8);
      const roofMat = new THREE.MeshStandardMaterial({ map: this.roofTex, roughness: 0.6 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 3.7;
      group.add(roof);

      const light = new THREE.PointLight(0xffb347, 0.4, 12);
      light.position.y = 2.4;
      group.add(light);

      const ringGeo = new THREE.RingGeometry(5.85, 6.05, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffb347,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
      });
      const safeRing = new THREE.Mesh(ringGeo, ringMat);
      safeRing.rotation.x = -Math.PI / 2;
      safeRing.position.y = 0.06;
      group.add(safeRing);

      const fuelBarGeo = new THREE.PlaneGeometry(1.2, 0.15);
      const fuelBarMat = new THREE.MeshBasicMaterial({ color: 0xffb347, side: THREE.DoubleSide });
      const fuelBar = new THREE.Mesh(fuelBarGeo, fuelBarMat);
      fuelBar.position.y = 4.3;
      group.add(fuelBar);

      this.islandGroup.add(group);
      this.lanternMeshes.push({ id: lData.id, group, silk, silkMat, light, safeRing, fuelBar });
    }

    const waveGeo = new THREE.RingGeometry(0.1, 0.4, 48);
    const waveMat = new THREE.MeshBasicMaterial({ color: 0xffe9b0, side: THREE.DoubleSide, transparent: true, opacity: 0 });
    this.pulseWaveMesh = new THREE.Mesh(waveGeo, waveMat);
    this.pulseWaveMesh.rotation.x = -Math.PI / 2;
    this.pulseWaveMesh.position.y = 0.18;
    this.scene.add(this.pulseWaveMesh);
  }

  buildPlayer() {
    this.playerGroup = new THREE.Group();

    const tunicGeo = new THREE.CylinderGeometry(0.38, 0.52, 1.15, 16);
    const tunicMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.65 });
    const body = new THREE.Mesh(tunicGeo, tunicMat);
    body.position.y = 0.78;
    this.playerGroup.add(body);

    const sashGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.2, 16);
    const sashMat = new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.5 });
    const sash = new THREE.Mesh(sashGeo, sashMat);
    sash.position.y = 0.78;
    this.playerGroup.add(sash);

    const headGeo = new THREE.SphereGeometry(0.34, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.48;
    this.playerGroup.add(head);

    // Conical Hat with Woven Bamboo Texture
    const hatGeo = new THREE.ConeGeometry(0.95, 0.48, 32);
    const hatMat = new THREE.MeshStandardMaterial({
      map: this.bambooTex,
      color: 0xc9b48a,
      roughness: 0.85
    });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.82;
    this.playerGroup.add(hat);

    this.miniLantern = new THREE.Group();
    this.miniLantern.position.set(0.45, 1.55, 0);
    const miniGeo = new THREE.OctahedronGeometry(0.16, 0);
    const miniMat = new THREE.MeshStandardMaterial({ color: 0xffe9b0, emissive: 0xffb347, emissiveIntensity: 0.9 });
    this.miniLantern.add(new THREE.Mesh(miniGeo, miniMat));
    this.playerLight = new THREE.PointLight(0xffe9b0, 2.0, 9);
    this.miniLantern.add(this.playerLight);
    this.playerGroup.add(this.miniLantern);

    this.scene.add(this.playerGroup);
  }

  load3DAssets() {
    const assets = [
      { name: 'may', url: '/models/May.glb' },
      { name: 'scenery', url: '/models/Scenery.glb' },
      { name: 'fox', url: '/models/Fox.glb' }
    ];
    assets.forEach((item) => {
      this.gltfLoader.load(
        item.url,
        (gltf) => {
          this.models[item.name] = gltf.scene;
          if (item.name === 'scenery') {
            gltf.scene.position.set(0, 0, -18);
            this.islandGroup.add(gltf.scene);
          } else if (item.name === 'fox') {
            gltf.scene.position.set(4, 0, -4);
            gltf.scene.scale.set(0.015, 0.015, 0.015);
            gltf.scene.rotation.y = -Math.PI / 4;
            this.islandGroup.add(gltf.scene);
          } else if (item.name === 'may') {
            while (this.playerGroup.children.length > 0) {
              this.playerGroup.remove(this.playerGroup.children[0]);
            }
            this.playerGroup.add(gltf.scene);
            this.playerLight = new THREE.PointLight(0xffe9b0, 2.0, 9);
            this.playerLight.position.set(0.48, 1.45, 0.35);
            this.playerGroup.add(this.playerLight);
          }
        },
        undefined,
        () => {
          // Fallback smoothly to procedural meshes
        }
      );
    });
  }

  initEvents() {
    window.addEventListener('keydown', (e) => {
      audio.init();
      this.keys[e.code] = true;
      if (e.code === 'KeyE') this.interactTriggered = true;
      if (e.code === 'KeyF' || e.code === 'KeyX') this.pulseTriggered = true;
      if (e.code === 'ShiftLeft' || e.code === 'KeyQ') this.dashTriggered = true;
      if (e.code === 'Space') this.jumpTriggered = true;
      if (e.code === 'Escape' || e.code === 'KeyP') this.togglePause();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

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
        this.camYawDeg -= deltaX * this.mouseSens;
        this.camPitchDeg = Math.max(6, Math.min(65, this.camPitchDeg + deltaY * (this.mouseSens * 0.75)));
        this.mouse.prevX = e.clientX;
        this.mouse.prevY = e.clientY;
      }
    });

    document.getElementById('dash-btn').addEventListener('click', () => {
      audio.init();
      this.dashTriggered = true;
    });

    document.getElementById('pulse-btn').addEventListener('click', () => {
      audio.init();
      this.pulseTriggered = true;
    });

    document.getElementById('start-night-btn').addEventListener('click', () => {
      document.getElementById('intro-modal').style.display = 'none';
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('restart-night-btn').addEventListener('click', () => {
      this.restartNight();
    });

    document.getElementById('retry-btn').addEventListener('click', () => {
      this.restartNight();
    });

    document.getElementById('next-night-btn').addEventListener('click', () => {
      this.startNextNight();
    });

    document.getElementById('vol-slider').addEventListener('input', (e) => {
      audio.setVolume(parseFloat(e.target.value));
    });

    document.getElementById('sens-slider').addEventListener('input', (e) => {
      this.mouseSens = parseFloat(e.target.value);
      localStorage.setItem('dao_sens', this.mouseSens.toString());
    });

    const cbToggle = document.getElementById('colorblind-toggle');
    if (cbToggle) {
      cbToggle.checked = this.colorblind;
      cbToggle.addEventListener('change', (e) => {
        this.colorblind = e.target.checked;
        localStorage.setItem('dao_colorblind', this.colorblind.toString());
      });
    }
  }

  togglePause() {
    this.gameState.step({ pause: true });
    const pauseModal = document.getElementById('pause-modal');
    pauseModal.style.display = this.gameState.isPaused ? 'flex' : 'none';
  }

  restartNight() {
    document.getElementById('pause-modal').style.display = 'none';
    document.getElementById('result-modal').style.display = 'none';
    this.gameState.reset();
    this.buildWorld();
  }

  startNextNight() {
    document.getElementById('result-modal').style.display = 'none';
    this.currentNight = Math.min(3, this.currentNight + 1);
    this.gameState = new GameState({}, this.currentNight);
    this.buildWorld();
    const intros = {
      2: { title: 'ĐÊM 2 — ĐẢO CAU', desc: 'Hai hòn đảo nối bằng cầu tre. Hãy châm dầu giữ đèn và coi chừng Gió Lạc!' },
      3: { title: 'ĐÊM 3 — ĐẢO CHUÔNG', desc: 'Đảo 3 tầng hiểm trở. Giữ sáng ít nhất 5/7 đèn cho tới bình minh!' }
    };
    if (intros[this.currentNight]) {
      document.getElementById('intro-title').textContent = intros[this.currentNight].title;
      document.getElementById('intro-desc').textContent = intros[this.currentNight].desc;
      document.getElementById('intro-modal').style.display = 'flex';
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateSimulation() {
    let moveX = 0, moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX += 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX -= 1;

    if (moveX !== 0 || moveZ !== 0) this.walkCycle += 0.25;

    const frame = {
      move: [moveX, moveZ],
      cam_yaw_deg: this.camYawDeg,
      interact: !!this.interactTriggered,
      pulse: !!this.pulseTriggered,
      jump: !!this.jumpTriggered,
      dash: !!this.dashTriggered,
      pause: false
    };

    this.interactTriggered = false;
    this.pulseTriggered = false;
    this.jumpTriggered = false;
    this.dashTriggered = false;

    const events = this.gameState.step(frame);

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (ev.name === 'mote_picked') {
        audio.playMoteChime();
        this.vfx.spawnMotePickup(this.gameState.player.pos, this.camera);
      } else if (ev.name === 'deposit' || ev.name === 'refuel') {
        audio.playDepositSound();
      } else if (ev.name === 'lantern_lit') {
        audio.playLanternLitGong();
      } else if (ev.name === 'pulse') {
        audio.playPulseSound();
        this.triggerPulseWave();
      } else if (ev.name === 'dash') {
        audio.playDashSound();
        this.vfx.spawnDashTrail(this.gameState.player.pos, this.gameState.dash_dir || [0, 1]);
      } else if (ev.name === 'jump') {
        audio.playJumpSound();
        this.vfx.spawnJumpPuff(this.gameState.player.pos);
        this.jumpAnimScale = 1.35;
      } else if (ev.name === 'player_hit') {
        audio.playHitSound();
      } else if (ev.name === 'game_over') {
        this.showResultModal(ev.data);
      }
    }

    if (!this.wasGrounded && this.gameState.player.grounded) {
      this.vfx.spawnLandingImpact(this.gameState.player.pos);
      this.landAnimSquash = 0.72;
    }
    this.wasGrounded = this.gameState.player.grounded;

    this.updateHUD();
  }

  triggerPulseWave() {
    if (!this.pulseWaveMesh) return;
    this.pulseWaveMesh.position.set(this.gameState.player.pos[0], this.gameState.player.pos[1] + 0.18, this.gameState.player.pos[2]);
    this.pulseWaveAnim = { radius: 0.5, opacity: 0.95 };
  }

  updateHUD() {
    const flames = this.gameState.player.flames;
    const fContainer = document.getElementById('flames-container');
    for (let i = 0; i < 3; i++) {
      if (fContainer.children[i]) {
        if (i < flames) fContainer.children[i].classList.remove('flame-lost');
        else fContainer.children[i].classList.add('flame-lost');
      }
    }

    const timeLeft = Math.max(0, this.gameState.time_left_s);
    const secsInt = Math.floor(timeLeft);
    const timerElem = document.getElementById('hud-timer');
    timerElem.textContent = `${String(Math.floor(secsInt / 60)).padStart(2, '0')}:${String(secsInt % 60).padStart(2, '0')}`;
    if (secsInt <= 30) {
      timerElem.classList.add('timer-alert');
      if (this.colorblind) timerElem.textContent = `⚠ ${timerElem.textContent}`;
    } else {
      timerElem.classList.remove('timer-alert');
    }

    const litCount = this.gameState.lanterns.filter((l) => l.lit).length;
    document.getElementById('hud-lanterns').textContent = `Đèn sáng: ${litCount} / ${this.gameState.lanterns.length}`;
    document.getElementById('hud-score').textContent = this.gameState.score;

    const carried = this.gameState.player.carried;
    const cap = this.gameState.player.capacity;
    document.getElementById('mote-bar-text').textContent = `Đom đóm: ${carried} / ${cap}`;
    const slots = document.getElementById('mote-slots').children;
    for (let i = 0; i < 10; i++) {
      if (i < carried) slots[i].classList.add('filled');
      else slots[i].classList.remove('filled');
    }

    const dashBtn = document.getElementById('dash-btn');
    const dashCdText = document.getElementById('dash-cd-text');
    if (this.gameState.dash_cooldown_ticks <= 0 || this.gameState.charm_ticks > 0) {
      dashBtn.classList.remove('ability-cd');
      dashCdText.textContent = this.gameState.charm_ticks > 0 ? 'BÙA GIÓ (0s)' : 'SẴN SÀNG';
    } else {
      dashBtn.classList.add('ability-cd');
      dashCdText.textContent = `${(this.gameState.dash_cooldown_ticks / 60).toFixed(1)}s`;
    }

    const pulseBtn = document.getElementById('pulse-btn');
    const pulseCdText = document.getElementById('pulse-cd-text');
    if (this.gameState.pulse_cooldown_ticks <= 0) {
      if (carried >= 3) {
        pulseBtn.classList.remove('ability-cd');
        pulseCdText.textContent = 'SẴN SÀNG (3)';
      } else {
        pulseBtn.classList.add('ability-cd');
        pulseCdText.textContent = 'CẦN 3 ĐỐM';
      }
    } else {
      pulseBtn.classList.add('ability-cd');
      pulseCdText.textContent = `${(this.gameState.pulse_cooldown_ticks / 60).toFixed(1)}s`;
    }

    const prompt = document.getElementById('interact-prompt');
    let nearLantern = null;
    for (const l of this.gameState.lanterns) {
      if (Math.hypot(this.gameState.player.pos[0] - l.pos[0], this.gameState.player.pos[2] - l.pos[2]) <= 2.0) {
        if (!l.lit || (l.lit && l.fuel_ticks < 6000)) {
          nearLantern = l;
          break;
        }
      }
    }
    if (nearLantern) {
      prompt.style.display = 'block';
      if (!nearLantern.lit) {
        const cost = nearLantern.ever_lit ? 5 : 10;
        prompt.textContent = `E — ${nearLantern.ever_lit ? 'Thắp lại' : 'Nạp ánh sáng'} (${nearLantern.deposited}/${cost})`;
      } else {
        const fuelVal = Math.round(nearLantern.fuel_ticks / 60);
        prompt.textContent = `E — Châm dầu (Dầu: ${fuelVal}/100)`;
      }
    } else {
      prompt.style.display = 'none';
    }
  }

  showResultModal(data) {
    const modal = document.getElementById('result-modal');
    const title = document.getElementById('result-title');
    const desc = document.getElementById('result-desc');
    const scoreElem = document.getElementById('result-score');
    const nextBtn = document.getElementById('next-night-btn');

    if (data.result === 'won') {
      title.textContent = '🌅 SỐNG SÓT ĐẾN BÌNH MINH!';
      title.style.color = '#F2C14E';
      desc.textContent = `Bạn đã giữ vững các ngọn đèn ở Đêm ${this.currentNight} cho tới bình minh!`;
      scoreElem.textContent = `Tổng Điểm: ${this.gameState.score}`;
      if (this.currentNight >= 3) {
        title.textContent = '🏆 CHIẾN THẮNG TRỌN VẸN 3 ĐÊM!';
        desc.textContent = 'Sương đen tan biến hoàn toàn, ánh dương rực rỡ chiếu rọi khắp Đảo Đèn Lồng!';
        nextBtn.style.display = 'none';
      } else {
        nextBtn.style.display = 'inline-block';
      }
    } else {
      title.textContent = '💀 THẤT BẠI';
      title.style.color = '#FF5A5F';
      desc.textContent = data.reason === 'no_flames' ? 'Mây đã bị Bóng Mực dập tắt ngọn lửa...' : 'Bình minh đã đến nhưng số đèn sáng không đủ 60%...';
      scoreElem.textContent = `Điểm: ${this.gameState.score}`;
      nextBtn.style.display = 'none';
    }
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

    const dtSec = Math.min(0.1, dt * 0.001);
    this.syncMeshes(now * 0.001, dtSec);
    this.updateCamera();
    this.vfx.update(dtSec, this.camera);

    this.renderer.render(this.scene, this.camera);
  }

  syncMeshes(timeSec, dtSec = 0.016) {
    const pPos = this.gameState.player.pos;
    const walkBob = this.gameState.player.grounded ? Math.abs(Math.sin(this.walkCycle)) * 0.12 : 0;
    this.playerGroup.position.set(pPos[0], pPos[1] + walkBob, pPos[2]);

    // Face movement direction
    const targetYaw = (this.gameState.player.facing_yaw * Math.PI) / 180;
    this.playerGroup.rotation.y = targetYaw;

    // Dash tilt and camera speed FOV kick
    if (this.gameState.dash_ticks_left > 0) {
      this.playerGroup.rotation.x = 0.35;
    } else {
      this.playerGroup.rotation.x = 0;
    }

    // Jump & Land Squash/Stretch
    if (this.jumpAnimScale > 1.0) {
      this.jumpAnimScale = Math.max(1.0, this.jumpAnimScale - dtSec * 2.2);
      const stretch = this.jumpAnimScale;
      const squashXZ = 1 / Math.sqrt(stretch);
      this.playerGroup.scale.set(squashXZ, stretch, squashXZ);
    } else if (this.landAnimSquash < 1.0) {
      this.landAnimSquash = Math.min(1.0, this.landAnimSquash + dtSec * 3.5);
      const squash = this.landAnimSquash;
      const stretchXZ = 1 / Math.sqrt(squash);
      this.playerGroup.scale.set(stretchXZ, squash, stretchXZ);
    } else {
      this.playerGroup.scale.set(1, 1, 1);
    }

    const targetFOV = this.gameState.dash_ticks_left > 0 ? 64 : 55;
    if (Math.abs(this.camera.fov - targetFOV) > 0.1) {
      this.camera.fov += (targetFOV - this.camera.fov) * 0.25;
      this.camera.updateProjectionMatrix();
    }

    if (this.miniLantern) {
      this.miniLantern.rotation.z = Math.sin(timeSec * 5) * 0.15;
    }

    const litCount = this.gameState.lanterns.filter((l) => l.lit).length;
    const progress = litCount / this.gameState.lanterns.length;
    this.ambientLight.intensity = 0.15 + 0.55 * progress;

    for (let i = 0; i < this.gameState.lanterns.length; i++) {
      const lData = this.gameState.lanterns[i];
      const mObj = this.lanternMeshes[i];
      if (mObj) {
        const fuelVal = lData.fuel_ticks / 60.0;
        if (lData.lit) {
          mObj.silk.scale.set(1, 1, 1);
          mObj.fuelBar.visible = true;
          mObj.fuelBar.scale.x = Math.max(0.01, fuelVal / 100.0);
          mObj.fuelBar.lookAt(this.camera.position);

          if (fuelVal < 30) {
            const blink = Math.sin(timeSec * Math.PI * 2) > 0;
            mObj.silkMat.emissiveIntensity = blink ? 0.9 : 0.2;
            mObj.fuelBar.material.color.setHex(0xff5a5f);
            mObj.safeRing.material.opacity = 0;
          } else {
            mObj.silkMat.emissive.setHex(0xffb347);
            mObj.silkMat.emissiveIntensity = 0.9 + Math.sin(timeSec * 3 + i) * 0.2;
            mObj.fuelBar.material.color.setHex(0xffb347);
            mObj.safeRing.material.opacity = 0.6;
          }
          mObj.light.intensity = 2.4;
        } else {
          mObj.fuelBar.visible = false;
          mObj.silk.scale.set(0.8, 0.8, 0.8);
          mObj.silkMat.emissive.setHex(0x5b5f6e);
          mObj.silkMat.emissiveIntensity = 0.1;
          mObj.light.intensity = 0.2;
          mObj.safeRing.material.opacity = 0;
        }
      }
    }

    const activeIds = new Set();
    for (let i = 0; i < this.gameState.motes.length; i++) {
      const mote = this.gameState.motes[i];
      activeIds.add(mote.id);
      let mesh = this.moteMeshes.get(mote.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.moteGeo, this.moteMat);
        const glow = new THREE.Mesh(this.moteGlowGeo, this.moteGlowMat);
        mesh.add(glow);
        this.scene.add(mesh);
        this.moteMeshes.set(mote.id, mesh);
      }
      const bob = Math.sin(timeSec * 3.5 + mote.pos[0] * 2) * 0.35 + 0.6;
      mesh.position.set(mote.pos[0], mote.pos[1] + bob, mote.pos[2]);
    }
    for (const [id, mesh] of this.moteMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.moteMeshes.delete(id);
      }
    }

    const activeShadeIds = new Set();
    const shadeEyeColor = this.colorblind ? 0x00b3ff : 0xe879f9;
    const shadeEmissive = this.colorblind ? 0x00b3ff : 0x7a3cff;

    for (let i = 0; i < this.gameState.shades.length; i++) {
      const shade = this.gameState.shades[i];
      activeShadeIds.add(shade.id);
      let mItem = this.shadeMeshes.get(shade.id);
      if (!mItem) {
        const group = new THREE.Group();
        const bodyGeo = new THREE.SphereGeometry(0.75, 16, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x120a1a, roughness: 0.9, emissive: shadeEmissive, emissiveIntensity: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.8;
        group.add(body);

        const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: shadeEyeColor });
        const lEye = new THREE.Mesh(eyeGeo, eyeMat);
        lEye.position.set(-0.25, 0.95, 0.6);
        const rEye = new THREE.Mesh(eyeGeo, eyeMat);
        rEye.position.set(0.25, 0.95, 0.6);
        group.add(lEye, rEye);

        this.scene.add(group);
        mItem = { group, bodyMat, eyeMat };
        this.shadeMeshes.set(shade.id, mItem);
      }

      mItem.group.position.set(shade.pos[0], shade.pos[1], shade.pos[2]);
      mItem.eyeMat.color.setHex(shadeEyeColor);

      if (shade.state === 'stunned') {
        mItem.bodyMat.emissive.setHex(0x3a3450);
        mItem.bodyMat.emissiveIntensity = 1.0;
      } else if (shade.state === 'drain') {
        mItem.bodyMat.emissive.setHex(0xff5a5f);
        mItem.bodyMat.emissiveIntensity = 0.8 + Math.sin(timeSec * 8) * 0.4;
      } else {
        mItem.bodyMat.emissive.setHex(shadeEmissive);
        mItem.bodyMat.emissiveIntensity = 0.6;
      }
    }
    for (const [id, mItem] of this.shadeMeshes.entries()) {
      if (!activeShadeIds.has(id)) {
        this.scene.remove(mItem.group);
        this.shadeMeshes.delete(id);
      }
    }

    const activeDrifters = new Set();
    for (let i = 0; i < this.gameState.drifters.length; i++) {
      const d = this.gameState.drifters[i];
      activeDrifters.add(d.id);
      let dMesh = this.drifterMeshes.get(d.id);
      if (!dMesh) {
        const dGeo = new THREE.TorusGeometry(0.6, 0.15, 8, 24);
        const dMat = new THREE.MeshBasicMaterial({ color: 0x8fa3b8, transparent: true, opacity: 0.85 });
        dMesh = new THREE.Mesh(dGeo, dMat);
        this.scene.add(dMesh);
        this.drifterMeshes.set(d.id, dMesh);
      }
      dMesh.rotation.y += 0.05;
      dMesh.position.set(d.pos[0], d.pos[1] + 1.2, d.pos[2]);
    }
    for (const [id, dMesh] of this.drifterMeshes.entries()) {
      if (!activeDrifters.has(id)) {
        this.scene.remove(dMesh);
        this.drifterMeshes.delete(id);
      }
    }

    const activeCharms = new Set();
    for (let i = 0; i < this.gameState.charms.length; i++) {
      const c = this.gameState.charms[i];
      if (c.available) {
        activeCharms.add(c.id);
        let cMesh = this.charmMeshes.get(c.id);
        if (!cMesh) {
          const cGeo = new THREE.BoxGeometry(0.5, 0.8, 0.08);
          const cMat = new THREE.MeshStandardMaterial({ color: 0xc8102e, emissive: 0xf2c14e, emissiveIntensity: 0.5 });
          cMesh = new THREE.Mesh(cGeo, cMat);
          this.scene.add(cMesh);
          this.charmMeshes.set(c.id, cMesh);
        }
        cMesh.rotation.y = timeSec * 2;
        cMesh.position.set(c.pos[0], c.pos[1] + 0.8 + Math.sin(timeSec * 4) * 0.2, c.pos[2]);
      }
    }
    for (const [id, cMesh] of this.charmMeshes.entries()) {
      if (!activeCharms.has(id)) {
        this.scene.remove(cMesh);
        this.charmMeshes.delete(id);
      }
    }

    if (this.pulseWaveAnim && this.pulseWaveMesh) {
      this.pulseWaveAnim.radius += 0.4;
      this.pulseWaveAnim.opacity -= 0.04;
      this.pulseWaveMesh.scale.set(this.pulseWaveAnim.radius, this.pulseWaveAnim.radius, 1);
      this.pulseWaveMesh.material.opacity = Math.max(0, this.pulseWaveAnim.opacity);
      if (this.pulseWaveAnim.opacity <= 0) this.pulseWaveAnim = null;
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
