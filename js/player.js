/* Player controls (keys, click/tap-to-walk, drag to turn the camera) + a follow camera that stays in the room. */
import * as THREE from 'three';
import { TAU, clamp, lerp, angleTo } from './util.js?v=2271898f';
import { ROOM } from './room.js?v=2271898f';

export const WALK_SPEED = 1.9;      // m/s
export const STRIDE = 1.15;         // metres per full walk cycle

/* push a circle (x,z,r) out of walls, boxes and circles */
export function collide(p, r, colliders) {
  p.x = clamp(p.x, ROOM.x0 + r + 0.1, ROOM.x1 - r - 0.1);
  p.z = clamp(p.z, ROOM.z0 + r + 0.1, ROOM.z1 - r - 0.15);
  for (const c of colliders) {
    if (c.box) {
      const [x0, z0, x1, z1] = c.box, cx = clamp(p.x, x0, x1), cz = clamp(p.z, z0, z1);
      const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-9) { const d = Math.sqrt(d2), k = (r - d) / d; p.x += dx * k; p.z += dz * k; }
        else { // centre inside the box: push out the shortest way
          const opts = [[x0 - r - p.x, 0], [x1 + r - p.x, 0], [0, z0 - r - p.z], [0, z1 + r - p.z]].sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
          p.x += opts[0][0]; p.z += opts[0][1];
        }
      }
    } else if (c.circle) {
      const [cx, cz, cr] = c.circle, dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz), m = cr + r;
      if (d < m && d > 1e-6) { p.x = cx + dx / d * m; p.z = cz + dz / d * m; }
    }
  }
}

/* steer a straight-line walk around round obstacles (the pouf, palms) */
export function steerDir(from, to, colliders, out) {
  let dx = to.x - from.x, dz = to.z - from.z;
  const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
  for (const c of colliders) {
    if (!c.circle) continue;
    const [cx, cz, cr] = c.circle, ox = cx - from.x, oz = cz - from.z;
    const t = ox * dx + oz * dz;
    if (t < 0 || t > len) continue;
    // (px, pz): from the closest point on our line to the obstacle centre; steer the other way
    const px = ox - dx * t, pz = oz - dz * t, dist = Math.hypot(px, pz), m = cr + 0.45;
    if (dist < m) {
      const w = (m - dist) / m * 1.8;
      const ax = dist > 1e-3 ? -px / dist : -dz, az = dist > 1e-3 ? -pz / dist : dx;
      // slide round it: add the tangent that still heads toward the goal
      let tx = -az, tz = ax; if (tx * dx + tz * dz < 0) { tx = -tx; tz = -tz; }
      dx += ax * w + tx * w * 0.9; dz += az * w + tz * w * 0.9;
    }
  }
  const l2 = Math.hypot(dx, dz) || 1;
  return out.set(dx / l2, 0, dz / l2);
}

export function makeController(dom, camera) {
  const keys = new Set();
  const C = {
    yaw: 0, pitch: 0.36, dist: 3.7, targetDist: 3.7,
    moveTo: null, onArrive: null, dragging: false, enabled: true, focus: null,
    camPos: new THREE.Vector3(), camLook: new THREE.Vector3(), clickHandler: null,
  };
  addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    keys.add(e.key.toLowerCase());
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
  });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());

  let down = null;
  const pointers = new Map();
  dom.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) down = { x: e.clientX, y: e.clientY, moved: false };
    dom.setPointerCapture(e.pointerId);
  });
  dom.addEventListener('pointermove', e => {
    const prev = pointers.get(e.pointerId); if (!prev) return;
    if (pointers.size === 2) {           // pinch to zoom
      const [a, b] = [...pointers.values()], before = Math.hypot(a.x - b.x, a.y - b.y);
      prev.x = e.clientX; prev.y = e.clientY;
      const [c, d] = [...pointers.values()], after = Math.hypot(c.x - d.x, c.y - d.y);
      C.targetDist = clamp(C.targetDist * before / Math.max(after, 1), 2.2, 6.5);
      if (down) down.moved = true;
      return;
    }
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    prev.x = e.clientX; prev.y = e.clientY;
    if (!down) return;
    if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true;
    if (down.moved && C.enabled) { C.yaw -= dx * 0.0062; C.pitch = clamp(C.pitch + dy * 0.004, 0.08, 0.95); C.dragging = true; }
  });
  const up = e => {
    pointers.delete(e.pointerId);
    if (down && !down.moved && C.enabled && C.clickHandler) C.clickHandler(e);
    if (pointers.size === 0) { down = null; C.dragging = false; }
  };
  dom.addEventListener('pointerup', up); dom.addEventListener('pointercancel', up);
  dom.addEventListener('wheel', e => { e.preventDefault(); C.targetDist = clamp(C.targetDist * (1 + Math.sign(e.deltaY) * 0.1), 2.2, 6.5); }, { passive: false });

  C.keys = keys;
  /* desired move direction from keys, relative to the camera */
  C.keyDir = out => {
    let f = 0, s = 0;
    if (keys.has('w') || keys.has('arrowup')) f += 1;
    if (keys.has('s') || keys.has('arrowdown')) f -= 1;
    if (keys.has('a') || keys.has('arrowleft')) s -= 1;
    if (keys.has('d') || keys.has('arrowright')) s += 1;
    if (!f && !s) return null;
    const fx = -Math.sin(C.yaw), fz = -Math.cos(C.yaw), rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw);
    out.set(fx * f + rx * s, 0, fz * f + rz * s).normalize();
    return out;
  };
  /* place the camera behind/around the target; focus mode frames her face or whole body for the menus */
  C.updateCamera = (target, heading, dt) => {
    let dist = C.dist = lerp(C.dist, C.targetDist, 1 - Math.exp(-dt * 8));
    let lookY = 1.2, pitch = C.pitch, yaw = C.yaw, side = 0;
    if (C.focus) {
      const F = C.focus;
      yaw = heading; pitch = F.pitch; dist = F.dist; lookY = F.y; side = F.side || 0;
    }
    // a wall behind the camera: first tilt up to look down from higher, then pull in along the view direction
    const bx = target.x + Math.cos(yaw) * side, bz = target.z - Math.sin(yaw) * side, by = target.y + lookY;
    const lim = (p, d, lo, hi) => d > 1e-4 ? (hi - p) / d : d < -1e-4 ? (lo - p) / d : Infinity;
    let dx, dy, dz, room;
    for (let k = 0; k < 8; k++) {
      dx = Math.sin(yaw) * Math.cos(pitch); dy = Math.sin(pitch); dz = Math.cos(yaw) * Math.cos(pitch);
      room = Math.min(lim(bx, dx, ROOM.x0 + 0.3, ROOM.x1 - 0.3), lim(bz, dz, ROOM.z0 + 0.3, ROOM.z1 - 0.3), lim(by, dy, 0.5, ROOM.h - 0.4));
      if (room >= Math.min(dist, 2.6) || C.focus || pitch > 1.15) break;
      pitch += 0.1;
    }
    C.shownPitch = (C.shownPitch ?? pitch) + (pitch - (C.shownPitch ?? pitch)) * (1 - Math.exp(-dt * 4));
    pitch = C.focus ? pitch : C.shownPitch;
    dx = Math.sin(yaw) * Math.cos(pitch); dy = Math.sin(pitch); dz = Math.cos(yaw) * Math.cos(pitch);
    dist = Math.max(0.6, Math.min(dist, lim(bx, dx, ROOM.x0 + 0.3, ROOM.x1 - 0.3), lim(bz, dz, ROOM.z0 + 0.3, ROOM.z1 - 0.3), lim(by, dy, 0.5, ROOM.h - 0.4)));
    const want = new THREE.Vector3(bx + dx * dist, by + dy * dist, bz + dz * dist);
    want.x = clamp(want.x, ROOM.x0 + 0.3, ROOM.x1 - 0.3);
    want.z = clamp(want.z, ROOM.z0 + 0.3, ROOM.z1 - 0.3);
    want.y = clamp(want.y, 0.5, ROOM.h - 0.4);
    const look = new THREE.Vector3(target.x + Math.cos(yaw) * side, target.y + lookY - (C.focus ? 0 : 0.15), target.z - Math.sin(yaw) * side);
    const k = 1 - Math.exp(-dt * (C.focus ? 5 : 10));
    if (!C.camInit) { C.camPos.copy(want); C.camLook.copy(look); C.camInit = true; }
    C.camPos.lerp(want, k); C.camLook.lerp(look, k);
    camera.position.copy(C.camPos); camera.lookAt(C.camLook);
  };
  return C;
}

/* move a doll one step toward a point (or along a direction), with collisions; returns distance moved */
const _d = new THREE.Vector3();
export function stepDoll(d, dir, speed, dt, colliders) {
  const p = d.root.position, x0 = p.x, z0 = p.z;
  p.x += dir.x * speed * dt; p.z += dir.z * speed * dt;
  collide(p, 0.26, colliders);
  const moved = Math.hypot(p.x - x0, p.z - z0);
  if (moved > 1e-4) {
    const want = Math.atan2(dir.x, dir.z);
    d.root.rotation.y += angleTo(d.root.rotation.y, want) * (1 - Math.exp(-dt * 12));
  }
  d.anim.phase += moved * TAU / STRIDE;
  return moved;
}
