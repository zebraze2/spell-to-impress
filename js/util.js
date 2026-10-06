/* Small math + geometry helpers shared by the doll, clothes and room.
   Everything in the game is built from code: lathes, parametric grids and ribbons. */
import * as THREE from 'three';

export const TAU = Math.PI * 2;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function hexA(hex, a) { const c = new THREE.Color(hex); return `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},${a})`; }
/* lighten (amt>0) or darken (amt<0) a hex colour */
export function shade(hex, amt) {
  const c = new THREE.Color(hex), t = amt < 0 ? 0 : 1, k = Math.abs(amt);
  c.r += (t - c.r) * k; c.g += (t - c.g) * k; c.b += (t - c.b) * k;
  return '#' + c.getHexString();
}
/* shortest signed angle from a to b */
export function angleTo(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }

// recompute normals and weld them across UV seams / poles so shading is seamless
export function smoothSeams(geo) {
  geo.computeVertexNormals();
  const P = geo.attributes.position.array, N = geo.attributes.normal.array, cnt = P.length / 3;
  const head = new Int32Array(8192).fill(-1), next = new Int32Array(cnt), mask = 8191, done = new Uint8Array(cnt);
  const key = i => { const x = Math.round(P[i * 3] * 2e4), y = Math.round(P[i * 3 + 1] * 2e4), z = Math.round(P[i * 3 + 2] * 2e4); return ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & mask; };
  for (let i = 0; i < cnt; i++) { const k = key(i); next[i] = head[k]; head[k] = i; }
  const same = (a, b) => Math.abs(P[a * 3] - P[b * 3]) < 5e-5 && Math.abs(P[a * 3 + 1] - P[b * 3 + 1]) < 5e-5 && Math.abs(P[a * 3 + 2] - P[b * 3 + 2]) < 5e-5;
  const grp = [];
  for (let i = 0; i < cnt; i++) {
    if (done[i]) continue;
    grp.length = 0;
    for (let j = head[key(i)]; j !== -1; j = next[j]) if (!done[j] && same(i, j)) grp.push(j);
    if (grp.length < 2) { done[i] = 1; continue; }
    let x = 0, y = 0, z = 0;
    for (const j of grp) { x += N[j * 3]; y += N[j * 3 + 1]; z += N[j * 3 + 2]; done[j] = 1; }
    const l = Math.hypot(x, y, z) || 1;
    for (const j of grp) { N[j * 3] = x / l; N[j * 3 + 1] = y / l; N[j * 3 + 2] = z / l; }
  }
  geo.attributes.normal.needsUpdate = true;
  return geo;
}

const GEO_CACHE = new Map();
export const cached = (k, fn) => { let g = GEO_CACHE.get(k); if (!g) GEO_CACHE.set(k, g = fn()); return g; };

// sample a list of keyframes [t, a, b, c...] with Catmull-Rom so profiles stay smooth
export function crSample(keys, t) {
  const n = keys.length;
  let i = 0; while (i < n - 2 && keys[i + 1][0] < t) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
  const u = clamp((t - k1[0]) / ((k2[0] - k1[0]) || 1), 0, 1), u2 = u * u, u3 = u2 * u;
  const out = [];
  for (let c = 1; c < k1.length; c++) {
    const p0 = k0[c], p1 = k1[c], p2 = k2[c], p3 = k3[c];
    out.push(0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3));
  }
  return out;
}

// LatheGeometry with an elliptical, offset cross-section.  keys: [y, rx, rz, zOffset] (y ascending)
export function bodyLathe(keys, { samples = 40, segs = 48, phiStart = Math.PI } = {}) {
  const y0 = keys[0][0], y1 = keys[keys.length - 1][0], prof = [];
  for (let j = 0; j <= samples; j++) {
    const y = lerp(y0, y1, j / samples), [rx, rz, zo] = crSample(keys, y);
    prof.push({ y, rx: Math.max(rx, 1e-4), rz: Math.max(rz, 1e-4), zo });
  }
  const geo = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p.rx, p.y)), segs, phiStart);
  const pos = geo.attributes.position, np = prof.length;
  for (let i = 0; i < pos.count; i++) {
    const p = prof[i % np];
    pos.setZ(i, pos.getZ(i) * (p.rz / p.rx) + p.zo);
  }
  return smoothSeams(geo);
}

// a rounded capsule-style limb along -y: keys [d, r] with d = distance down the limb
export function limbLathe(len, keys, { segs = 28, samples = 34 } = {}) {
  const r0 = keys[0][1], r1 = keys[keys.length - 1][1], pts = [];
  for (let k = 0; k <= 8; k++) { const a = -Math.PI / 2 + (k / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.cos(a) * r1, -len + Math.sin(a) * r1)); }
  for (let j = 1; j < samples; j++) { const d = len * (1 - j / samples); pts.push(new THREE.Vector2(crSample(keys, d)[0], -d)); }
  for (let k = 0; k <= 8; k++) { const a = (k / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.cos(a) * r0, Math.sin(a) * r0)); }
  pts[0].x = 1e-4; pts[pts.length - 1].x = 1e-4;
  return smoothSeams(new THREE.LatheGeometry(pts, segs));
}

// an open tube along -y (sleeves, trouser legs): keys [d, r]; open at both ends
export function tubeLathe(len, keys, { segs = 28, samples = 24, y0 = 0 } = {}) {
  const pts = [];
  for (let j = samples; j >= 0; j--) { const d = len * (j / samples); pts.push(new THREE.Vector2(crSample(keys, d)[0], y0 - d)); }
  return smoothSeams(new THREE.LatheGeometry(pts, segs));
}

// grid surface from a parametric function fn(u, v, target)
export function gridGeo(nu, nv, fn, flip = false) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2), idx = [];
  const p = new THREE.Vector3(); let k = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    fn(i / nu, j / nv, p); pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z;
    uv[k * 2] = i / nu; uv[k * 2 + 1] = 1 - j / nv; k++;
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    if (flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return smoothSeams(g);
}

// flattened, tapered tube along a curve (hair locks, ribbons, straps)
export function ribbonTube(curve, { width = () => 0.03, thick = () => 0.01, segs = 40, radial = 10, ref = null } = {}) {
  const P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), R = new THREE.Vector3();
  return gridGeo(radial, segs, (u, v, out) => {
    curve.getPointAt(Math.min(v, 0.9999), P); curve.getTangentAt(Math.min(v, 0.9999), T);
    if (ref) ref(P, v, R); else R.set(P.x, 0, P.z);
    N.copy(R).addScaledVector(T, -R.dot(T)); if (N.lengthSq() < 1e-8) N.set(0, 0, 1); N.normalize();
    B.crossVectors(T, N).normalize();
    const a = u * TAU, w = width(v), th = thick(v);
    out.copy(P).addScaledVector(B, Math.cos(a) * w).addScaledVector(N, Math.sin(a) * th);
  });
}

// texture coordinates that follow the real arc length of a lathe-like grid (so prints don't stretch)
export function arcUV(geo, nu, nv, scale) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  let acc = 0, pR = 0, pY = 0;
  for (let j = 0; j <= nv; j++) {
    let R = 0, Y = 0;
    for (let i = 0; i <= nu; i++) { const k = j * (nu + 1) + i; R += Math.hypot(p.getX(k), p.getZ(k)); Y += p.getY(k); }
    R /= nu + 1; Y /= nu + 1;
    if (j > 0) acc += Math.hypot(R - pR, Y - pY);
    pR = R; pY = Y;
    for (let i = 0; i <= nu; i++) uv.setXY(j * (nu + 1) + i, (i / nu - 0.5) * TAU * R / scale, -acc / scale);
  }
  uv.needsUpdate = true; return geo;
}

export function canvasTex(w, h, draw, { srgb = true, repeat = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

export function shadowy(o, cast = true) { o.traverse(m => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = true; } }); return o; }
