import * as THREE from 'three';

/**
 * Procedural High-Fidelity Texture Generators
 * Creates crisp, beautiful textures offline without external binary dependencies.
 */

export function createBambooTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base warm straw color
  ctx.fillStyle = '#C9B48A';
  ctx.fillRect(0, 0, 512, 512);

  // Concentric weave rings
  ctx.strokeStyle = '#A89265';
  ctx.lineWidth = 3;
  for (let r = 10; r < 360; r += 14) {
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Radial bamboo ribs
  ctx.strokeStyle = '#8C754A';
  ctx.lineWidth = 2;
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI * 2) / 36;
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.lineTo(256 + Math.cos(a) * 360, 256 + Math.sin(a) * 360);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createTerracottaRoofTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#6B2D1B';
  ctx.fillRect(0, 0, 512, 512);

  // Roof tile rows
  for (let y = 0; y < 512; y += 32) {
    ctx.fillStyle = y % 64 === 0 ? '#8B3A22' : '#5A2415';
    ctx.fillRect(0, y, 512, 30);
    ctx.fillStyle = '#3E160C';
    ctx.fillRect(0, y + 30, 512, 2);

    for (let x = 0; x < 512; x += 40) {
      ctx.fillStyle = '#9C4328';
      ctx.beginPath();
      ctx.arc(x + 20, y + 15, 12, 0, Math.PI);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

export function createStonePlazaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#222A38';
  ctx.fillRect(0, 0, 512, 512);

  // Cobblestone grid
  ctx.strokeStyle = '#181E29';
  ctx.lineWidth = 4;
  for (let y = 0; y < 512; y += 48) {
    const offset = (y / 48) % 2 === 0 ? 0 : 24;
    for (let x = 0; x < 512; x += 48) {
      ctx.fillStyle = (x + y) % 96 === 0 ? '#2B3545' : '#26303E';
      ctx.fillRect(x + offset + 2, y + 2, 44, 44);
      ctx.strokeRect(x + offset + 2, y + 2, 44, 44);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function createSilkLanternTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Gradient orange silk
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#FFA834');
  grad.addColorStop(0.5, '#FFC266');
  grad.addColorStop(1, '#FF8C1A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  // Vertical bamboo struts
  ctx.fillStyle = '#5A2A0C';
  for (let x = 0; x < 256; x += 32) {
    ctx.fillRect(x, 0, 3, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
