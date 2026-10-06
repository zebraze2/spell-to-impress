/* Hairstyles: a scalp cap (its edge is the hairline) + wavy back panel + tapered locks.
   Every style takes any colour; textures are shared per colour. */
import * as THREE from 'three';
import { TAU, lerp, clamp, smooth, V3, gridGeo, ribbonTube, crSample, cached } from './util.js';
import { hairTex } from './textures.js';
import { headShape } from './doll.js';

export const HAIR_COLORS = [
  { id: 'brown', name: 'Brown', base: '#2a1a13', mid: '#47301f', hi: '#9c7a5c' },
  { id: 'black', name: 'Black', base: '#120d0c', mid: '#2a201d', hi: '#6d6470' },
  { id: 'chestnut', name: 'Chestnut', base: '#4a2414', mid: '#7a3e20', hi: '#c98a5a' },
  { id: 'red', name: 'Red', base: '#5a1a10', mid: '#a33a1e', hi: '#f08a5a' },
  { id: 'blonde', name: 'Blonde', base: '#a8834c', mid: '#d8b878', hi: '#fff0c8' },
  { id: 'platinum', name: 'Platinum', base: '#d9ccb6', mid: '#efe5d3', hi: '#fffaf0' },
  { id: 'pink', name: 'Pink', base: '#c9578a', mid: '#f08ab4', hi: '#ffd6ea' },
  { id: 'lavender', name: 'Lavender', base: '#7d62b8', mid: '#b59ae8', hi: '#efe2ff' },
  { id: 'blue', name: 'Blue', base: '#2c4f9e', mid: '#5c8be0', hi: '#cfe0ff' },
  { id: 'mint', name: 'Mint', base: '#3f9c88', mid: '#7fd6c0', hi: '#e0fff6' },
];

const MAT_CACHE = new Map();
export function hairMats(c) {
  let m = MAT_CACHE.get(c.id);
  if (m) return m;
  const tex = hairTex({ base: c.base, mid: c.mid, hi: c.hi, band: [0.10, 0.24], seed: 3 });
  const capTex = hairTex({ base: c.base, mid: c.mid, hi: c.hi, band: [0.30, 0.47], seed: 4 });
  capTex.repeat.set(3, 1);
  m = {
    outer: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42 }),
    cap: new THREE.MeshStandardMaterial({ map: capTex, roughness: 0.42, side: THREE.DoubleSide }),
    inner: new THREE.MeshStandardMaterial({ map: tex, color: '#9a8a86', roughness: 0.6, side: THREE.BackSide }),
    solid: new THREE.MeshStandardMaterial({ color: c.mid, roughness: 0.45 }),
  };
  MAT_CACHE.set(c.id, m);
  return m;
}

// scalp cap as a smooth parametric shell: its open edge IS the hairline, so it stays clean
export function capGeo({ lift = 0.06, top = 0.64 } = {}) {
  const f = V3(0, -0.12, 1).normalize(), r = V3(1, 0, 0), up = new THREE.Vector3().crossVectors(f, r).normalize();
  const d = new THREE.Vector3(), dirs = [];
  const alpha = psi => { const c = Math.cos(psi); return c >= 0 ? top + (1.26 - top) * Math.pow(1 - c, 1.2) : 1.26 + 1.32 * Math.pow(-c, 1.1); };
  const g = gridGeo(110, 44, (uu, vv, out) => {
    const psi = uu * TAU, th = lerp(alpha(psi), 3.08, Math.pow(vv, 0.85));
    d.copy(f).multiplyScalar(Math.cos(th)).addScaledVector(up, Math.sin(th) * Math.cos(psi)).addScaledVector(r, Math.sin(th) * Math.sin(psi)).normalize();
    dirs.push(d.clone());
    const edge = smooth(0, 0.2, vv);
    headShape(d.x, d.y, d.z, out, 0.003 + (0.012 + Math.max(0, d.y) * lift * 0.5) * (0.2 + 0.8 * edge));
    out.y += 0.004 * edge;
  });
  const uv = g.attributes.uv;
  dirs.forEach((q, k) => uv.setXY(k, Math.asin(clamp(q.z, -1, 1)) / Math.PI + 0.5, 1 - Math.abs(Math.asin(clamp(q.x, -1, 1))) / (Math.PI / 2)));
  uv.needsUpdate = true;
  return g;
}
export function backPanelGeo(o) {
  const nC = o.clumps || 9;
  return gridGeo(72, 60, (u, v, out) => {
    const a = u * 2 - 1;
    const clumpC = Math.round(a * nC / 2 + 0.5) - 0.5;
    const ac = lerp(a, clamp(clumpC / (nC / 2), -1, 1), smooth(0.72, 1, v) * 0.55);
    const lenF = 1 - o.tip * (0.5 - 0.5 * Math.cos(TAU * (a * nC / 2 + 0.5)));
    const vv = v * lenF;
    const y = lerp(o.top, o.bottom, vv);
    const [rx, rz, zc, pm] = crSample(o.shape, vv);
    const phi = ac * pm;
    const wave = o.wave * smooth(0.12, 0.4, vv) * Math.sin(vv * o.waves * TAU + a * 1.3) + 0.010 * Math.cos(nC * Math.PI * ac + 1.7) * smooth(0.05, 0.3, vv);
    const sx = Math.sin(phi), cz = Math.cos(phi);
    out.set(sx * (rx + wave), y, zc - cz * (rz + wave));
  }, true);
}
export function makeLock(pts, { w = 0.05, th = 0.016, taper = 0.62 } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => V3(...p)), false, 'catmullrom', 0.5);
  const geo = ribbonTube(curve, {
    segs: 44, radial: 10,
    width: t => w * (0.82 + 0.25 * Math.sin(Math.PI * Math.min(1, t * 1.6))) * (1 - smooth(taper, 1, t) * 0.94),
    thick: t => th * (1 - smooth(taper, 1, t) * 0.75),
    ref: (P, t, R) => R.set(P.x, (P.y - 0.05) * 0.25, P.z - 0.01)
  });
  const root = curve.getPointAt(0);
  geo.translate(-root.x, -root.y, -root.z);
  return { geo, root };
}
function lockMesh(d, group, pts, mat, opts, phase) {
  const { geo, root } = makeLock(pts, opts);
  const piv = new THREE.Group(); piv.position.copy(root);
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; piv.add(m);
  piv.userData.phase = phase; group.add(piv); d.locks.push(piv);
  return piv;
}

/* ---------- styles ---------- */
function longWaves(d, c) {
  const M = hairMats(c), group = new THREE.Group();
  const cap = new THREE.Mesh(cached('h_cap', () => capGeo()), M.cap); cap.castShadow = true; group.add(cap);
  const pg = cached('h_longpanel', () => backPanelGeo({
    top: 0.08, bottom: -0.66, tip: 0.13, wave: 0.02, waves: 3.2, clumps: 9,
    shape: [[0, 0.150, 0.157, 0.0, 1.95], [0.12, 0.166, 0.172, -0.004, 1.9], [0.3, 0.192, 0.158, -0.02, 1.7], [0.48, 0.215, 0.138, -0.035, 1.45], [0.72, 0.208, 0.122, -0.05, 1.32], [1, 0.195, 0.116, -0.06, 1.26]]
  }));
  const panel = new THREE.Mesh(pg, M.outer); panel.castShadow = true; group.add(panel);
  const panelIn = new THREE.Mesh(pg, M.inner); group.add(panelIn);
  d.hairPanel.push(panel, panelIn);
  for (const s of [-1, 1]) {
    const L = [
      [[s * 0.012, 0.172, 0.07], [s * 0.075, 0.135, 0.128], [s * 0.122, 0.055, 0.128], [s * 0.142, -0.04, 0.105], [s * 0.148, -0.13, 0.085], [s * 0.138, -0.23, 0.082], [s * 0.128, -0.33, 0.095], [s * 0.118, -0.44, 0.09], [s * 0.112, -0.52, 0.078]],
      [[s * 0.05, 0.17, 0.03], [s * 0.125, 0.11, 0.07], [s * 0.158, 0.0, 0.07], [s * 0.168, -0.11, 0.05], [s * 0.172, -0.22, 0.04], [s * 0.168, -0.33, 0.05], [s * 0.158, -0.45, 0.04], [s * 0.15, -0.56, 0.02]],
      [[s * 0.07, 0.15, -0.04], [s * 0.15, 0.06, -0.03], [s * 0.178, -0.06, -0.035], [s * 0.19, -0.18, -0.05], [s * 0.2, -0.3, -0.055], [s * 0.192, -0.42, -0.07], [s * 0.18, -0.55, -0.085]],
      [[s * 0.03, 0.165, -0.1], [s * 0.1, 0.09, -0.13], [s * 0.14, -0.04, -0.15], [s * 0.15, -0.18, -0.14], [s * 0.155, -0.32, -0.14], [s * 0.15, -0.46, -0.13], [s * 0.14, -0.6, -0.13]]
    ];
    L.forEach((pts, i) => {
      const wv = (i % 2 ? 1 : -1) * s;
      const wavy = pts.map((p, j) => j > 2 ? [p[0] * (1 + 0.04 * (j - 2)) + wv * 0.02 * Math.sin(j * 1.9), p[1], p[2] + 0.008 * Math.cos(j * 2.3)] : p);
      lockMesh(d, group, wavy, M.outer, { w: i === 0 ? 0.048 : 0.056, th: 0.021 }, i * 1.3 + (s > 0 ? 0.7 : 0));
    });
  }
  return group;
}

function spaceBuns(d, c) {
  const M = hairMats(c), group = new THREE.Group();
  const cap = new THREE.Mesh(cached('h_cap2', () => capGeo({ lift: 0.02 })), M.cap); cap.castShadow = true; group.add(cap);
  for (const s of [-1, 1]) {
    const C = V3(s * 0.088, 0.158, -0.012);
    const geo = cached('h_bun' + s, () => {
      const pts = [];
      for (let i = 0; i <= 70; i++) {
        const t = i / 70, th = lerp(2.5, 0.2, t), ps = t * TAU * 3.6 * s, r = 0.058;
        pts.push(V3(C.x + Math.sin(th) * Math.cos(ps) * r, C.y + Math.cos(th) * r * 0.95, C.z + Math.sin(th) * Math.sin(ps) * r));
      }
      return ribbonTube(new THREE.CatmullRomCurve3(pts), { segs: 140, radial: 8, width: t => 0.024 * (1 - 0.4 * t), thick: t => 0.018 * (1 - 0.3 * t), ref: (P, t, R) => R.copy(P).sub(C) });
    });
    const bun = new THREE.Mesh(geo, M.outer); bun.castShadow = true; group.add(bun);
    const core = new THREE.Mesh(cached('h_core', () => new THREE.SphereGeometry(0.05, 24, 18)), M.cap); core.position.copy(C); group.add(core);
  }
  const pg = cached('h_bunpanel', () => backPanelGeo({ top: 0.06, bottom: -0.3, tip: 0.18, wave: 0.01, waves: 2.2, clumps: 7, shape: [[0, 0.150, 0.157, 0.0, 1.9], [0.35, 0.165, 0.165, -0.01, 1.7], [1, 0.17, 0.14, -0.03, 1.45]] }));
  const panel = new THREE.Mesh(pg, M.outer); panel.castShadow = true; group.add(panel, new THREE.Mesh(pg, M.inner));
  for (const s of [-1, 1]) lockMesh(d, group, [[s * 0.04, 0.165, 0.08], [s * 0.115, 0.08, 0.125], [s * 0.142, -0.02, 0.105], [s * 0.15, -0.12, 0.08], [s * 0.146, -0.2, 0.07]], M.outer, { w: 0.026, th: 0.012, taper: 0.5 }, s);
  return group;
}

function ponytail(d, c) {
  const M = hairMats(c), group = new THREE.Group();
  const cap = new THREE.Mesh(cached('h_cap3', () => capGeo({ lift: 0.015, top: 0.6 })), M.cap); cap.castShadow = true; group.add(cap);
  // the tail hangs from a pivot at the back of the crown so it can swing
  const tail = new THREE.Group(); tail.position.set(0, 0.155, -0.125); group.add(tail);
  tail.userData.phase = 0.4; d.locks.push(tail);
  const strands = [
    [[0, 0, 0], [0, 0.03, -0.07], [0, -0.04, -0.13], [0.01, -0.16, -0.14], [-0.01, -0.29, -0.12], [0.01, -0.41, -0.1], [0, -0.5, -0.08]],
    [[0.02, 0, 0], [0.04, 0.02, -0.06], [0.05, -0.06, -0.11], [0.06, -0.18, -0.11], [0.05, -0.3, -0.09], [0.06, -0.4, -0.07]],
    [[-0.02, 0, 0], [-0.04, 0.02, -0.06], [-0.05, -0.06, -0.11], [-0.06, -0.18, -0.11], [-0.05, -0.3, -0.09], [-0.06, -0.38, -0.07]],
    [[0, 0.005, 0.01], [0.0, 0.0, -0.05], [0.0, -0.08, -0.09], [0.02, -0.2, -0.08], [0.0, -0.33, -0.06], [0.02, -0.44, -0.04]],
  ];
  strands.forEach((pts, i) => {
    const geo = cached('h_tail' + i, () => makeLock(pts, { w: i === 0 ? 0.062 : 0.05, th: 0.03, taper: 0.55 }).geo);
    const m = new THREE.Mesh(geo, M.outer); m.castShadow = true; m.position.set(...pts[0]); tail.add(m);
  });
  const tie = new THREE.Mesh(cached('h_tie', () => new THREE.TorusGeometry(0.03, 0.013, 10, 24)), d.person.tieMat || new THREE.MeshStandardMaterial({ color: '#ff6fa8', roughness: 0.4 }));
  tie.position.set(0, 0.155, -0.13); tie.rotation.x = 0.9; group.add(tie);
  // a soft wisp at each temple
  for (const s of [-1, 1]) lockMesh(d, group, [[s * 0.11, 0.1, 0.1], [s * 0.135, 0.02, 0.11], [s * 0.14, -0.07, 0.1], [s * 0.132, -0.15, 0.095]], M.outer, { w: 0.018, th: 0.008, taper: 0.4 }, s * 2);
  return group;
}

function bob(d, c) {
  const M = hairMats(c), group = new THREE.Group();
  const cap = new THREE.Mesh(cached('h_cap4', () => capGeo({ lift: 0.07, top: 0.52 })), M.cap); cap.castShadow = true; group.add(cap);
  const pg = cached('h_bobpanel', () => backPanelGeo({
    top: 0.09, bottom: -0.2, tip: 0.05, wave: 0.006, waves: 1.2, clumps: 11,
    shape: [[0, 0.155, 0.162, 0.0, 2.25], [0.3, 0.185, 0.18, -0.01, 2.15], [0.7, 0.2, 0.18, -0.005, 2.05], [1, 0.19, 0.165, 0.0, 2.0]]
  }));
  const panel = new THREE.Mesh(pg, M.outer); panel.castShadow = true; group.add(panel, new THREE.Mesh(pg, M.inner));
  d.hairPanel.push(panel);
  // blunt bangs across the forehead
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.034;
    lockMesh(d, group, [[x * 0.6, 0.19, 0.06], [x * 0.85, 0.16, 0.135], [x, 0.1, 0.162], [x * 1.02, 0.065, 0.166]], M.outer, { w: 0.03, th: 0.01, taper: 0.8 }, i);
  }
  for (const s of [-1, 1]) lockMesh(d, group, [[s * 0.1, 0.15, 0.08], [s * 0.16, 0.06, 0.1], [s * 0.18, -0.06, 0.085], [s * 0.178, -0.18, 0.07]], M.outer, { w: 0.05, th: 0.018, taper: 0.75 }, s);
  return group;
}

export const HAIR_STYLES = [
  { id: 'waves', name: 'Long waves', build: longWaves },
  { id: 'buns', name: 'Space buns', build: spaceBuns },
  { id: 'ponytail', name: 'Ponytail', build: ponytail },
  { id: 'bob', name: 'Bob + bangs', build: bob },
];
export function hairStyle(id) { return HAIR_STYLES.find(s => s.id === id) || HAIR_STYLES[0]; }
export function hairColor(id) { return HAIR_COLORS.find(s => s.id === id) || HAIR_COLORS[0]; }
