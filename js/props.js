/* Boutique furniture, all modelled in code. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TAU, rng, V3, smoothSeams, canvasTex } from './util.js?v=2271898f';
import { TEX } from './textures.js?v=2271898f';

export const M = {
  wall: new THREE.MeshStandardMaterial({ color: '#f3e2dc', map: TEX.damask, roughness: 0.92 }),
  trim: new THREE.MeshStandardMaterial({ color: '#fffaf6', roughness: 0.6 }),
  nicheIn: new THREE.MeshStandardMaterial({ color: '#ecb9c5', roughness: 0.9, side: THREE.BackSide }),
  nicheBack: new THREE.MeshStandardMaterial({ map: TEX.stripe, roughness: 0.9 }),
  shelf: new THREE.MeshStandardMaterial({ color: '#fffdfb', roughness: 0.45 }),
  gold: new THREE.MeshStandardMaterial({ color: '#e9c48a', metalness: 1, roughness: 0.28 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#f4f6fa', metalness: 1, roughness: 0.12 }),
  white: new THREE.MeshStandardMaterial({ color: '#fffaf8', roughness: 0.35 }),
  velvet: new THREE.MeshStandardMaterial({ color: '#f4a9c4', roughness: 0.85 }),
  lilac: new THREE.MeshStandardMaterial({ color: '#d9c6f2', roughness: 0.6 }),
  mirror: new THREE.MeshStandardMaterial({ map: TEX.mirror, roughness: 0.05, metalness: 0.4 }),
  hidden: new THREE.MeshBasicMaterial({ visible: false }),
};
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };
const rbox = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 2, r);

export function makePalm() {
  const g = new THREE.Group();
  const potPts = [[0.001, 0], [0.16, 0], [0.19, 0.04], [0.23, 0.32], [0.255, 0.4], [0.262, 0.43], [0.24, 0.44], [0.22, 0.42], [0.001, 0.4]].map(p => new THREE.Vector2(p[0], p[1]));
  g.add(new THREE.Mesh(smoothSeams(new THREE.LatheGeometry(potPts, 48)), M.white));
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.236, 0.01, 8, 48), M.gold); band.rotation.x = Math.PI / 2; band.position.y = 0.33; g.add(band);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.235, 32), new THREE.MeshStandardMaterial({ color: '#5b4034', roughness: 1 })); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.415; g.add(soil);
  const leafMat = new THREE.MeshStandardMaterial({ map: TEX.leaf, roughness: 0.55, side: THREE.DoubleSide, alphaTest: 0.5 });
  const stemMat = new THREE.MeshStandardMaterial({ color: '#4f8a52', roughness: 0.7 });
  const r = rng(9), N = 13;
  for (let i = 0; i < N; i++) {
    const a = i / N * TAU + r() * 0.35, up = i < 4 ? 0.85 + r() * 0.15 : 0.3 + r() * 0.55, len = 0.85 + r() * 0.45;
    const dir = V3(Math.sin(a), 0, Math.cos(a));
    const p0 = V3(0, 0.4, 0), p1 = p0.clone().addScaledVector(dir, 0.05 * len).add(V3(0, 0.5 * up + 0.25, 0)), p2 = p0.clone().addScaledVector(dir, 0.16 * len * (1.2 - up)).add(V3(0, 0.7 * up + 0.38, 0));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, p1, p2]), 10, 0.011, 6), stemMat));
    const fl = 0.95 * len, lg = new THREE.PlaneGeometry(0.62, fl, 8, 18), lp = lg.attributes.position;
    for (let k = 0; k < lp.count; k++) {
      const x = lp.getX(k), t = (lp.getY(k) + fl / 2) / fl, arch = (1 - up) * 0.9 + 0.35, along = fl * t, ang = arch * t * 1.6;
      lp.setXYZ(k, x * (1 - 0.15 * t), Math.sin(ang) / Math.max(ang, 1e-3) * along * Math.cos(ang * 0.5), (1 - Math.cos(ang)) / Math.max(ang, 1e-3) * along - Math.abs(x) * 0.28);
    }
    lg.computeVertexNormals();
    const leaf = new THREE.Mesh(lg, leafMat);
    leaf.position.copy(p2); leaf.lookAt(p2.clone().add(dir)); leaf.rotateX(0.35 + (1 - up) * 1.0); leaf.rotateY((r() - .5) * 0.5);
    g.add(leaf);
  }
  return g;
}
export function makeSconce() {
  const g = new THREE.Group();
  g.add(mesh(rbox(0.075, 0.17, 0.02, 0.012), M.gold));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, -0.04, 0.01), V3(0, -0.07, 0.07), V3(0, -0.02, 0.12)]), 16, 0.008, 8), M.gold));
  g.add(mesh(new THREE.CylinderGeometry(0.028, 0.018, 0.03, 16), M.gold, 0, -0.005, 0.12));
  const bulb = mesh(new THREE.SphereGeometry(0.026, 16, 12), new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffd59a', emissiveIntensity: 2.2 }), 0, 0.035, 0.12); bulb.scale.set(1, 1.35, 1); g.add(bulb);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: '#ffd7a8', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(0.42, 0.42, 1); glow.position.set(0, 0.04, 0.1); g.add(glow);
  return g;
}
export function makeChandelier() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.0, 8), M.gold, 0, 0.5, 0));
  for (const [r, y] of [[0.55, 0], [0.32, 0.22]]) {
    const ring = mesh(new THREE.TorusGeometry(r, 0.018, 10, 48), M.gold, 0, y, 0); ring.rotation.x = Math.PI / 2; g.add(ring);
    const n = Math.round(r * 26);
    const crystal = new THREE.MeshStandardMaterial({ color: '#fff6fb', roughness: 0.05, metalness: 0.1, emissive: '#ffe6f2', emissiveIntensity: 0.35 });
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, c = mesh(new THREE.OctahedronGeometry(0.03, 0), crystal, Math.cos(a) * r, y - 0.07, Math.sin(a) * r); c.scale.set(0.7, 1.5, 0.7); g.add(c);
      if (i % 3 === 0) { const b = mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffe1b8', emissiveIntensity: 2 }), Math.cos(a) * r, y + 0.04, Math.sin(a) * r); g.add(b); }
    }
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: '#ffe3c4', transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(2.2, 2.2, 1); g.add(glow);
  return g;
}
/* salon chair + hood dryer (hair station), facing +z */
export function makeSalonChair() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.04, 32), M.chrome, 0, 0.02, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 12), M.chrome, 0, 0.2, 0));
  g.add(mesh(rbox(0.56, 0.14, 0.52, 0.06), M.white, 0, 0.44, 0.02));
  const back = mesh(rbox(0.56, 0.66, 0.14, 0.07), M.white, 0, 0.78, -0.22); back.rotation.x = -0.12; g.add(back);
  for (let i = -1; i <= 1; i++) { const t = mesh(new THREE.SphereGeometry(0.018, 10, 8), M.lilac, i * 0.16, 0.86, -0.14); g.add(t); }
  for (const s of [-1, 1]) g.add(mesh(rbox(0.08, 0.16, 0.44, 0.035), M.white, s * 0.3, 0.58, 0.0));
  // hood dryer on an arm
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 10), M.chrome, 0.0, 0.75, -0.42));
  const arm = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10), M.chrome, 0, 1.46, -0.28); arm.rotation.x = Math.PI / 2; g.add(arm);
  const dome = mesh(new THREE.SphereGeometry(0.27, 32, 16, 0, TAU, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: '#e7d9f6', roughness: 0.25, side: THREE.DoubleSide }), 0, 1.5, -0.12);
  dome.rotation.x = 0.35; g.add(dome);
  const rim = mesh(new THREE.TorusGeometry(0.26, 0.015, 8, 40), M.white, 0, 1.43, -0.04); rim.rotation.x = Math.PI / 2 + 0.35; g.add(rim);
  return g;
}
/* makeup vanity with bulb mirror + stool, facing +z (the mirror is at the back) */
export function makeVanity() {
  const g = new THREE.Group();
  g.add(mesh(rbox(1.3, 0.06, 0.5, 0.02), M.white, 0, 0.78, 0));
  for (const s of [-1, 1]) g.add(mesh(rbox(0.36, 0.72, 0.46, 0.02), M.white, s * 0.45, 0.39, 0));
  for (const s of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.018, 10, 8), M.gold, s * 0.45, 0.55, 0.235));
  const frame = mesh(rbox(1.0, 0.9, 0.05, 0.04), M.white, 0, 1.33, -0.2); g.add(frame);
  g.add(mesh(new THREE.PlaneGeometry(0.84, 0.74), M.mirror, 0, 1.33, -0.17));
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffeacc', emissiveIntensity: 1.6 });
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.03, 12, 8), bulbMat, s * 0.47, 0.96 + i * 0.185, -0.15));
  // pots, lipsticks, brushes
  const cols = ['#f06aa0', '#c9b3f2', '#ffd27a', '#a8e2cc'];
  cols.forEach((c, i) => { const p = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 16), new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 }), -0.45 + i * 0.12, 0.835, 0.08); g.add(p); });
  for (let i = 0; i < 3; i++) { const l = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 10), M.gold, 0.3 + i * 0.05, 0.855, 0.1); g.add(l); }
  const stool = new THREE.Group();
  stool.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 24), M.velvet, 0, 0.42, 0));
  const ringS = mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 32), M.gold, 0, 0.35, 0); ringS.rotation.x = Math.PI / 2; stool.add(ringS);
  stool.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.35, 10), M.gold, 0, 0.175, 0));
  stool.position.set(0, 0, 0.62); g.add(stool);
  return g;
}
/* round tufted pouf with a palm in the middle (room centrepiece) */
export function makePouf(r = 0.95) {
  const g = new THREE.Group();
  const seatPts = [[0.001, 0], [r, 0], [r + 0.04, 0.12], [r + 0.02, 0.36], [r - 0.06, 0.44], [0.4, 0.46], [0.3, 0.6], [0.001, 0.6]].map(p => new THREE.Vector2(p[0], p[1]));
  g.add(new THREE.Mesh(smoothSeams(new THREE.LatheGeometry(seatPts, 64)), M.velvet));
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.add(mesh(new THREE.SphereGeometry(0.02, 8, 6), M.gold, Math.cos(a) * (r + 0.03), 0.26, Math.sin(a) * (r + 0.03))); }
  // a low vase of roses (low, so it never blocks the camera)
  const vasePts = [[0.001, 0], [0.12, 0], [0.16, 0.08], [0.15, 0.18], [0.1, 0.24], [0.13, 0.28], [0.12, 0.3]].map(p => new THREE.Vector2(p[0], p[1]));
  const vase = new THREE.Mesh(smoothSeams(new THREE.LatheGeometry(vasePts, 40)), M.white); vase.position.y = 0.6; g.add(vase);
  const leafM = new THREE.MeshStandardMaterial({ color: '#6fae6a', roughness: 0.6 });
  const roseCols = ['#ff8fb8', '#ffffff', '#f6a9c4', '#ffd0e0', '#e86a8a'];
  const rnd = rng(4);
  for (let i = 0; i < 16; i++) {
    const a = rnd() * TAU, rr = Math.sqrt(rnd()) * 0.22, x = Math.cos(a) * rr, z = Math.sin(a) * rr, y = 0.94 + (0.22 - rr) * 0.5 + rnd() * 0.04;
    const rose = mesh(new THREE.SphereGeometry(0.055, 14, 10), new THREE.MeshStandardMaterial({ color: roseCols[i % roseCols.length], roughness: 0.55 }), x, y, z); rose.scale.set(1, 0.8, 1); g.add(rose);
    const lf = mesh(new THREE.SphereGeometry(0.04, 8, 6), leafM, x * 1.15, y - 0.05, z * 1.15); lf.scale.set(1.6, 0.4, 1); g.add(lf);
  }
  return g;
}
/* double doors to the runway, with an arch and a sign */
export function makeRunwayDoors() {
  const g = new THREE.Group();
  const doorMat = new THREE.MeshStandardMaterial({ color: '#f7d6e2', roughness: 0.45 });
  for (const s of [-1, 1]) {
    g.add(mesh(rbox(0.9, 2.5, 0.08, 0.03), doorMat, s * 0.46, 1.25, 0));
    for (const y of [0.7, 1.75]) g.add(mesh(rbox(0.62, y === 0.7 ? 0.8 : 0.9, 0.02, 0.01), M.white, s * 0.46, y, 0.05));
    g.add(mesh(new THREE.SphereGeometry(0.035, 12, 8), M.gold, s * 0.08, 1.2, 0.07));
  }
  const arch = mesh(new THREE.TorusGeometry(0.98, 0.07, 12, 48, Math.PI), M.white, 0, 2.5, 0.02); g.add(arch);
  for (const s of [-1, 1]) g.add(mesh(rbox(0.16, 2.5, 0.14, 0.03), M.white, s * 0.98, 1.25, 0.02));
  const sign = canvasTex(512, 128, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff9fcb'); gr.addColorStop(1, '#e2488b');
    c.fillStyle = gr; c.beginPath(); c.roundRect(4, 4, w - 8, h - 8, 50); c.fill();
    c.fillStyle = '#fff'; c.font = '700 70px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('RUNWAY', w / 2, h / 2 + 4);
  });
  const sg = mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshStandardMaterial({ map: sign, emissive: '#ff8fbf', emissiveIntensity: 0.35, roughness: 0.4 }), 0, 3.15, 0.06); g.add(sg);
  return g;
}
export function makeMirror(w = 1.1, h = 2.2) {
  const g = new THREE.Group();
  const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(w / 2, h - w / 2); shape.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); shape.lineTo(-w / 2, 0);
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.02, bevelSegments: 3 }), M.gold); g.add(frame);
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), M.mirror); glass.position.z = 0.065; glass.scale.setScalar(0.94); glass.position.y = 0.06; g.add(glass);
  return g;
}
