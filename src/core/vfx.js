import * as THREE from 'three';

/**
 * High-performance, zero-allocation Particle & VFX System for Lantern Island 3D.
 * Manages jump dust puffs, landing shockwaves, dash ghost trails, speed lines,
 * and sparkling firefly collection bursts.
 */
export class VFXManager {
  constructor(scene) {
    this.scene = scene;

    // 1. Mote Pickup Sparkles Pool (60 particles)
    this.sparkleGeo = new THREE.SphereGeometry(0.12, 6, 6);
    this.sparkleMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.95
    });
    this.sparkles = [];
    for (let i = 0; i < 60; i++) {
      const mesh = new THREE.Mesh(this.sparkleGeo, this.sparkleMat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.sparkles.push({
        mesh,
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1.0
      });
    }

    // 2. Jump & Landing Cloud Puffs Pool (30 particles)
    this.puffGeo = new THREE.SphereGeometry(0.28, 8, 8);
    this.puffMat = new THREE.MeshBasicMaterial({
      color: 0xd9e2ec,
      transparent: true,
      opacity: 0.8
    });
    this.puffs = [];
    for (let i = 0; i < 30; i++) {
      const mesh = new THREE.Mesh(this.puffGeo, this.puffMat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.puffs.push({
        mesh,
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        scale: 1,
        life: 0,
        maxLife: 1.0
      });
    }

    // 3. Dash Speed Streaks & Ghost Trails (20 streaks)
    this.dashStreakGeo = new THREE.BoxGeometry(0.06, 0.06, 1.4);
    this.dashStreakMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.85
    });
    this.dashStreaks = [];
    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(this.dashStreakGeo, this.dashStreakMat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.dashStreaks.push({
        mesh,
        active: false,
        pos: new THREE.Vector3(),
        life: 0,
        maxLife: 0.35
      });
    }

    // 4. Landing Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.2, 0.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    this.landRing = new THREE.Mesh(ringGeo, ringMat);
    this.landRing.rotation.x = -Math.PI / 2;
    this.landRing.visible = false;
    this.scene.add(this.landRing);
    this.landRingAnim = null;

    // 5. Floating Popup Canvas (for "+1 Đốm Sáng" floating popups)
    this.popups = [];
    this.initPopupLayer();
  }

  initPopupLayer() {
    this.popupContainer = document.getElementById('vfx-popups');
    if (!this.popupContainer) {
      this.popupContainer = document.createElement('div');
      this.popupContainer.id = 'vfx-popups';
      this.popupContainer.style.position = 'fixed';
      this.popupContainer.style.top = '0';
      this.popupContainer.style.left = '0';
      this.popupContainer.style.width = '100vw';
      this.popupContainer.style.height = '100vh';
      this.popupContainer.style.pointerEvents = 'none';
      this.popupContainer.style.zIndex = '999';
      this.popupContainer.style.overflow = 'hidden';
      document.body.appendChild(this.popupContainer);
    }
  }

  /**
   * Spawns an explosion of golden fairy sparkles and a floating "+1" popup.
   */
  spawnMotePickup(pos, camera) {
    // 12 bursting sparkles
    for (let i = 0; i < 14; i++) {
      const p = this.sparkles.find((s) => !s.active);
      if (!p) break;
      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.set(pos[0], pos[1] + 0.6, pos[2]);
      const angle = (i * Math.PI * 2) / 14 + (Math.random() - 0.5) * 0.4;
      const speed = 2.5 + Math.random() * 3.0;
      p.vel.set(Math.cos(angle) * speed, 1.8 + Math.random() * 2.5, Math.sin(angle) * speed);
      p.life = 0;
      p.maxLife = 0.45 + Math.random() * 0.25;
      p.mesh.material.opacity = 1.0;
      p.mesh.scale.set(1.2, 1.2, 1.2);
    }

    // Screen popup: "+1 ✨"
    this.spawnTextPopup('+1 ✨', pos, camera, '#FDE047');
  }

  /**
   * Spawns dust cloud puffs under player feet during Jump.
   */
  spawnJumpPuff(pos) {
    for (let i = 0; i < 8; i++) {
      const p = this.puffs.find((s) => !s.active);
      if (!p) break;
      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.set(pos[0] + (Math.random() - 0.5) * 0.4, pos[1] + 0.1, pos[2] + (Math.random() - 0.5) * 0.4);
      const angle = (i * Math.PI * 2) / 8;
      const speed = 1.5 + Math.random() * 1.2;
      p.vel.set(Math.cos(angle) * speed, 0.4 + Math.random() * 0.6, Math.sin(angle) * speed);
      p.life = 0;
      p.maxLife = 0.35;
      p.scale = 0.6;
      p.mesh.material.opacity = 0.8;
    }
  }

  /**
   * Spawns ground impact shockwave and dust ring upon landing.
   */
  spawnLandingImpact(pos) {
    this.landRing.position.set(pos[0], pos[1] + 0.05, pos[2]);
    this.landRing.scale.set(1, 1, 1);
    this.landRing.visible = true;
    this.landRing.material.opacity = 0.9;
    this.landRingAnim = { radius: 1.0, opacity: 0.9 };

    // 6 dust puffs
    for (let i = 0; i < 6; i++) {
      const p = this.puffs.find((s) => !s.active);
      if (!p) break;
      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.set(pos[0], pos[1] + 0.05, pos[2]);
      const angle = (i * Math.PI * 2) / 6;
      p.vel.set(Math.cos(angle) * 2.2, 0.2, Math.sin(angle) * 2.2);
      p.life = 0;
      p.maxLife = 0.3;
      p.scale = 0.8;
      p.mesh.material.opacity = 0.7;
    }
  }

  /**
   * Spawns high-speed cyan dash streaks trailing behind the player.
   */
  spawnDashTrail(pos, dir) {
    for (let i = 0; i < 3; i++) {
      const streak = this.dashStreaks.find((s) => !s.active);
      if (!streak) break;
      streak.active = true;
      streak.mesh.visible = true;
      const offsetSide = (Math.random() - 0.5) * 0.8;
      const offsetUp = 0.3 + Math.random() * 1.2;
      const perpX = -dir[1] * offsetSide;
      const perpZ = dir[0] * offsetSide;
      streak.mesh.position.set(pos[0] + perpX, pos[1] + offsetUp, pos[2] + perpZ);
      streak.mesh.lookAt(pos[0] + perpX + dir[0], pos[1] + offsetUp, pos[2] + perpZ + dir[1]);
      streak.life = 0;
      streak.maxLife = 0.25;
      streak.mesh.material.opacity = 0.9;
    }
  }

  /**
   * Spawns floating 2D text projected from 3D world coordinates.
   */
  spawnTextPopup(text, worldPos, camera, color = '#FDE047') {
    if (!this.popupContainer || !camera) return;

    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'absolute';
    el.style.color = color;
    el.style.fontFamily = "'Montserrat', sans-serif";
    el.style.fontWeight = '900';
    el.style.fontSize = '22px';
    el.style.textShadow = '0 0 10px rgba(253, 224, 71, 0.8), 0 2px 4px #000';
    el.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%, -50%) scale(1)';

    this.popupContainer.appendChild(el);
    this.popups.push({
      el,
      worldPos: new THREE.Vector3(worldPos[0], worldPos[1] + 1.2, worldPos[2]),
      age: 0,
      maxAge: 0.6
    });
  }

  /**
   * Updates all active VFX particles and animations per frame.
   */
  update(dt, camera) {
    // 1. Update Sparkles
    for (const p of this.sparkles) {
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
        } else {
          p.vel.y -= 9.8 * dt; // Gravity on sparkles
          p.mesh.position.x += p.vel.x * dt;
          p.mesh.position.y += p.vel.y * dt;
          p.mesh.position.z += p.vel.z * dt;
          const prog = p.life / p.maxLife;
          p.mesh.material.opacity = 1.0 - prog;
          const s = (1.0 - prog * 0.5) * 1.2;
          p.mesh.scale.set(s, s, s);
        }
      }
    }

    // 2. Update Puffs
    for (const p of this.puffs) {
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
        } else {
          p.mesh.position.x += p.vel.x * dt;
          p.mesh.position.y += p.vel.y * dt;
          p.mesh.position.z += p.vel.z * dt;
          const prog = p.life / p.maxLife;
          p.mesh.material.opacity = (1.0 - prog) * 0.7;
          const s = (1.0 + prog * 1.5) * p.scale;
          p.mesh.scale.set(s, s, s);
        }
      }
    }

    // 3. Update Dash Streaks
    for (const s of this.dashStreaks) {
      if (s.active) {
        s.life += dt;
        if (s.life >= s.maxLife) {
          s.active = false;
          s.mesh.visible = false;
        } else {
          const prog = s.life / s.maxLife;
          s.mesh.material.opacity = (1.0 - prog) * 0.85;
          s.mesh.scale.set(1.0 - prog * 0.5, 1.0 - prog * 0.5, 1.0 + prog * 1.2);
        }
      }
    }

    // 4. Update Landing Ring
    if (this.landRingAnim) {
      this.landRingAnim.radius += dt * 8.0;
      this.landRingAnim.opacity -= dt * 3.5;
      this.landRing.scale.set(this.landRingAnim.radius, this.landRingAnim.radius, 1);
      this.landRing.material.opacity = Math.max(0, this.landRingAnim.opacity);
      if (this.landRingAnim.opacity <= 0) {
        this.landRing.visible = false;
        this.landRingAnim = null;
      }
    }

    // 5. Update Screen Popups
    if (camera) {
      const surviving = [];
      const tempVec = new THREE.Vector3();
      for (const pop of this.popups) {
        pop.age += dt;
        if (pop.age >= pop.maxAge) {
          if (pop.el.parentNode) pop.el.parentNode.removeChild(pop.el);
        } else {
          pop.worldPos.y += dt * 1.2; // Float up
          tempVec.copy(pop.worldPos).project(camera);
          // Only show if in front of camera
          if (tempVec.z < 1.0) {
            const screenX = (tempVec.x * 0.5 + 0.5) * window.innerWidth;
            const screenY = (-(tempVec.y * 0.5) + 0.5) * window.innerHeight;
            pop.el.style.left = `${screenX}px`;
            pop.el.style.top = `${screenY}px`;
            const prog = pop.age / pop.maxAge;
            pop.el.style.opacity = `${1.0 - prog}`;
            pop.el.style.transform = `translate(-50%, -50%) scale(${1.0 + prog * 0.4})`;
            surviving.push(pop);
          } else {
            if (pop.el.parentNode) pop.el.parentNode.removeChild(pop.el);
          }
        }
      }
      this.popups = surviving;
    }
  }
}
