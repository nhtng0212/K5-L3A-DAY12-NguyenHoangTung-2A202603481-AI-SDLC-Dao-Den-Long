/**
 * Math utilities for 3D coordinates and vector projections on XZ plane.
 */

export function round3(val) {
  return Math.round(val * 1000) / 1000;
}

export function round1(val) {
  return Math.round(val * 10) / 10;
}

export function formatPos(pos) {
  return [round3(pos[0]), round3(pos[1]), round3(pos[2])];
}

export function distXZ(a, b) {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.hypot(dx, dz);
}

export function projectMove(move, camYawDeg) {
  const x = Math.max(-1, Math.min(1, move[0] || 0));
  const z = Math.max(-1, Math.min(1, move[1] || 0));

  if (x === 0 && z === 0) {
    return [0, 0];
  }

  const theta = (camYawDeg * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  let nx = x * cosT + z * sinT;
  let nz = -x * sinT + z * cosT;

  const len = Math.hypot(nx, nz);
  if (len > 1.0) {
    nx /= len;
    nz /= len;
  }

  return [nx, nz];
}
