/* The doll: one shared jointed body (bones = THREE.Groups) that clothes, hair and the face attach to.
   Rigid parts swing at the joints, like Roblox avatars, so a procedural walk works with any outfit.
   The same body (black, no face) is the shop mannequin. */
import * as THREE from 'three';
import { TAU, lerp, clamp, smooth, V3, smoothSeams, cached, crSample, bodyLathe, limbLathe, gridGeo } from './util.js';
import { FACE, faceTextures, faceParams, LOOKS } from './face.js';

/* ---------------- body geometry (shared by every doll) ---------------- */
export function headShape(x, y, z, out, inflate = 0) {
  let sx = 1, sz = 1;
  if (y < 0) { const t = -y; sx = 1 - 0.26 * t * t - 0.07 * t; sz = 1 - 0.12 * t * t; }
  sx *= 1 + 0.06 * Math.exp(-(((y + 0.28) / 0.3) ** 2));
  let zz = z * sz;
  if (zz > 0) zz *= 0.9;
  if (y < -0.45 && z > 0) zz += 0.08 * ((-y - 0.45) / 0.55) * z;
  if (z < 0) zz *= 1.07;
  return out.set(x * sx * (0.146 + inflate), y * (y < 0 ? 0.149 + inflate : 0.178 + inflate), zz * (0.152 + inflate));
}
function headGeo() {
  const g = new THREE.SphereGeometry(1, 72, 56), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { headShape(p.getX(i), p.getY(i), p.getZ(i), v); p.setXYZ(i, v.x, v.y, v.z); }
  return smoothSeams(g);
}
function faceDecalGeo(head) {
  const p = head.attributes.position, n = head.attributes.normal, idx = head.index.array;
  const pos = [], uv = [], nor = [];
  for (let t = 0; t < idx.length; t += 3) {
    const ids = [idx[t], idx[t + 1], idx[t + 2]];
    if (!ids.every(i => n.getZ(i) > 0.12 && p.getY(i) > -0.19)) continue;
    for (const i of ids) {
      pos.push(p.getX(i) + n.getX(i) * 0.0012, p.getY(i) + n.getY(i) * 0.0012, p.getZ(i) + n.getZ(i) * 0.0012);
      uv.push(p.getX(i) / FACE.W + 0.5, (p.getY(i) - FACE.Y0) / FACE.W + 0.5);
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}
function mittenGeo(side) {
  const g = new THREE.SphereGeometry(1, 22, 18), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = (1 - y) / 2;
    const wz = 0.0245 * (1 - 0.32 * t * t) + 0.004 * Math.sin(t * Math.PI);
    const wx = 0.0125 * (1 - 0.35 * t) * (1 + 0.15 * Math.sin(t * Math.PI));
    p.setXYZ(i, x * wx + side * 0.002 * Math.sin(t * Math.PI), -0.004 - t * 0.088, z * wz + 0.002);
  }
  return smoothSeams(g);
}
export { mittenGeo };
function footGeo() {
  return gridGeo(18, 22, (u, v, out) => {
    const a = u * TAU, z = lerp(-0.04, 0.115, v);
    const yb = -0.068 + 0.03 * (1 - smooth(0.2, 0.6, v));
    const hw = 0.022 * (0.8 + 0.3 * Math.sin(Math.PI * Math.min(1, v * 1.1))) * Math.sqrt(Math.max(0, 1 - Math.pow((v - .5) / .5, 8)));
    const top = 0.028 * (1 - 0.6 * smooth(0.5, 1, v)) * Math.sqrt(Math.max(0, 1 - Math.pow((v - .5) / .5, 8)));
    out.set(Math.cos(a) * hw, yb + (Math.sin(a) > 0 ? Math.sin(a) * top : Math.sin(a) * 0.004), z);
  });
}

export const PELVIS_KEYS = [[-0.105, 0.022, 0.022, 0], [-0.085, 0.07, 0.06, -0.002], [-0.05, 0.111, 0.083, -0.005], [0.02, 0.127, 0.09, -0.007], [0.09, 0.114, 0.083, -0.003], [0.15, 0.096, 0.073, 0], [0.215, 0.087, 0.067, 0.002]];
export const CHEST_KEYS = [[-0.045, 0.087, 0.067, 0.002], [0, 0.088, 0.068, 0.002], [0.07, 0.097, 0.074, 0.004], [0.13, 0.107, 0.083, 0.009], [0.18, 0.111, 0.088, 0.014], [0.225, 0.117, 0.077, 0.008], [0.262, 0.126, 0.067, 0], [0.296, 0.108, 0.059, -0.004], [0.322, 0.067, 0.05, -0.004], [0.338, 0.046, 0.042, -0.002], [0.36, 0.042, 0.04, 0]];
export const ARM_KEYS = [[0, 0.0445], [0.06, 0.0415], [0.16, 0.0345], [0.27, 0.0292]];
export const FARM_KEYS = [[0, 0.0292], [0.05, 0.0312], [0.15, 0.0265], [0.235, 0.0205]];
export const THIGH_KEYS = [[0, 0.074], [0.08, 0.07], [0.25, 0.059], [0.40, 0.047], [0.46, 0.0435]];
export const SHIN_KEYS = [[0, 0.0435], [0.1, 0.0498], [0.22, 0.0425], [0.36, 0.031], [0.44, 0.0255]];
export function ringAt(keys, y) { const [rx, rz, zo] = crSample(keys, y); return { rx, rz, zo }; }

const G = {
  pelvis: () => cached('b_pelvis', () => bodyLathe(PELVIS_KEYS)),
  chest: () => cached('b_chest', () => bodyLathe(CHEST_KEYS)),
  neck: () => cached('b_neck', () => bodyLathe([[-0.03, 0.045, 0.043, 0], [0.06, 0.04, 0.039, 0.004], [0.16, 0.038, 0.037, 0.008]], { segs: 32 })),
  head: () => cached('b_head', headGeo),
  face: () => cached('b_face', () => faceDecalGeo(G.head())),
  uarm: () => cached('b_uarm', () => limbLathe(0.27, ARM_KEYS)),
  farm: () => cached('b_farm', () => limbLathe(0.235, FARM_KEYS)),
  hand: s => cached('b_hand' + s, () => mittenGeo(s)),
  thumb: () => cached('b_thumb', () => limbLathe(0.032, [[0, 0.0085], [0.032, 0.0068]], { segs: 12, samples: 8 })),
  thigh: () => cached('b_thigh', () => limbLathe(0.46, THIGH_KEYS)),
  shin: () => cached('b_shin', () => limbLathe(0.44, SHIN_KEYS)),
  foot: () => cached('b_foot', footGeo),
};

export function makeSkinMat(hex) {
  return new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.58, sheen: 0.5, sheenColor: new THREE.Color('#ffd0c6'), sheenRoughness: 0.5 });
}
const MANNEQUIN_MAT = new THREE.MeshStandardMaterial({ color: '#1d181f', roughness: 0.22, metalness: 0.05 });

/* slot rules: a dress replaces top + bottom; a top or bottom replaces a dress */
const CONFLICTS = { dress: ['dress', 'top', 'bottom'], top: ['top', 'dress'], bottom: ['bottom', 'dress'] };

/* person: { skin, iris[4], brow, crease, lash, nose } (+ optional look/lip)
   opts: { mannequin, faceRes } */
export function buildDoll(person, opts = {}) {
  const d = { person, bones: {}, worn: new Map(), locks: [], hairPanel: [], mannequin: !!opts.mannequin };
  const skin = d.skinMat = opts.mannequin ? MANNEQUIN_MAT : makeSkinMat(person.skin);
  const B = d.bones;
  const grp = (name, parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); parent.add(g); B[name] = g; return g; };
  const mesh = (geo, parent, part) => { const m = new THREE.Mesh(geo, skin); m.castShadow = !opts.mannequin; m.receiveShadow = true; m.userData.part = part; parent.add(m); return m; };
  d.root = new THREE.Group();
  const body = grp('body', d.root);
  const pelvis = grp('pelvis', body, 0, 0.975, 0);
  mesh(G.pelvis(), pelvis, 'pelvis');
  const chest = grp('chest', pelvis, 0, 0.19, 0);
  const breath = grp('breath', chest);
  mesh(G.chest(), breath, 'chest');
  const neck = grp('neck', chest, 0, 0.33, -0.006);
  mesh(G.neck(), neck, 'neck');
  const head = grp('head', neck, 0, 0.112, 0.012);
  const headC = grp('headC', head, 0, 0.112, 0.014);
  headC.scale.setScalar(1.1);
  const hm = mesh(G.head(), headC, 'head'); hm.receiveShadow = false;
  if (!opts.mannequin) {
    d.faceMat = new THREE.MeshPhysicalMaterial({ roughness: 1.0, sheen: 0.5, sheenColor: new THREE.Color('#ffd0c6'), sheenRoughness: 0.5,
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const decal = new THREE.Mesh(G.face(), d.faceMat); decal.renderOrder = 2; headC.add(decal);
    d.faceRes = opts.faceRes || 1024;
  }
  for (const s of [1, -1]) {
    const S = s > 0 ? 'L' : 'R';
    const sh = grp('uarm' + S, chest, s * 0.149, 0.256, -0.008);
    mesh(G.uarm(), sh, 'uarm');
    const fa = grp('farm' + S, sh, 0, -0.27, 0);
    mesh(G.farm(), fa, 'farm');
    const hd = grp('hand' + S, fa, 0, -0.235, 0);
    mesh(G.hand(-s), hd, 'hand');
    const th = mesh(G.thumb(), hd, 'hand'); th.position.set(-s * 0.006, -0.022, 0.018); th.rotation.set(0.55, 0, -s * 0.2);
    const t1 = grp('thigh' + S, pelvis, s * 0.068, -0.012, 0);
    mesh(G.thigh(), t1, 'leg');
    const sn = grp('shin' + S, t1, 0, -0.46, 0);
    mesh(G.shin(), sn, 'leg');
    const an = grp('ankle' + S, sn, 0, -0.44, 0);
    mesh(G.foot(), an, 'foot');
  }

  /* ---- face / makeup ---- */
  d.look = LOOKS[0]; d.lip = null;
  d.setLook = (look, lip) => {
    if (d.mannequin) return;
    if (look) d.look = look;
    d.lip = lip === undefined ? d.lip : lip;
    const old = d.face;
    d.face = faceTextures(faceParams(person, d.look, d.lip), d.faceRes);
    d.faceMat.map = d.face.open; d.faceMat.roughnessMap = d.face.rough; d.faceMat.needsUpdate = true;
    if (old) for (const t of [old.open, old.half, old.shut, old.rough]) t.dispose();
  };
  if (!d.mannequin) d.setLook(person.look || LOOKS[0], person.lip || null);

  /* ---- hair ---- */
  d.hair = null;
  d.setHair = (style, color) => {
    if (d.hair) { B.headC.remove(d.hair); disposeTree(d.hair); }
    d.locks = []; d.hairPanel = [];
    d.hairStyle = style; d.hairColor = color;
    d.hair = style.build(d, color);
    B.headC.add(d.hair);
  };

  /* ---- clothes ---- */
  d.equip = item => { for (const p of item.parts) B[p.bone].add(p.obj); d.worn.set(item.slot, item); item.wornBy = d; };
  d.unequip = item => { for (const p of item.parts) if (p.obj.parent) p.obj.parent.remove(p.obj); if (d.worn.get(item.slot) === item) d.worn.delete(item.slot); item.wornBy = null; };
  /* put an item on, taking off whatever it replaces; returns the items removed */
  d.wear = item => {
    const removed = [];
    for (const s of CONFLICTS[item.slot] || [item.slot]) { const w = d.worn.get(s); if (w && w !== item) { d.unequip(w); removed.push(w); } }
    d.equip(item);
    return removed;
  };

  d.anim = makeAnimState();
  return d;
}

export function disposeTree(o) {
  o.traverse(m => { if (m.isMesh && m.geometry && !m.geometry.userData.shared) { /* geometry may be cached; leave it */ } });
}

/* Hide body parts on a mannequin so it becomes a bust, hip form, head stand... */
export function mannequinShow(d, parts) {
  d.root.traverse(m => { if (m.isMesh && m.userData.part) m.visible = parts.includes(m.userData.part); });
}

/* ---------------- poses + procedural animation ---------------- */
function makeAnimState() {
  return { speed: 0, phase: 0, reach: 0, reachT: 0, pose: 0, blinkNext: 1 + Math.random() * 3, idleSeed: Math.random() * 10, turn: 0, wave: 0 };
}

/* Standing pose: relaxed fashion stance, left hand on hip. Values are Euler [x, y, z]. */
const IDLE = {
  pelvis: [0, 0, 0.06], chest: [0.02, -0.04, -0.09], neck: [0.05, 0.03, 0.03], head: [-0.03, 0.08, 0.05],
  uarmL: [0.26, 0, 0.8], farmL: [0, 0, -1.62], handL: [0, 0, 0.72],
  uarmR: [-0.08, 0.1, -0.16], farmR: [-0.38, 0, 0.08], handR: [-0.15, 0.3, 0.1],
  thighL: [0.02, 0, -0.1], shinL: [0, 0, 0], thighR: [-0.22, 0, -0.02], shinR: [0.42, 0, 0],
  ankleL: [-0.02, 0.28, 0.1], ankleR: [0.05, -0.1, 0.02],          // free foot: heel lifted, ball on the floor
};
/* Neutral (mannequin / walking base) */
const NEUTRAL = {
  pelvis: [0, 0, 0], chest: [0.02, 0, 0], neck: [0.04, 0, 0], head: [-0.02, 0, 0],
  uarmL: [0.02, 0, 0.12], farmL: [-0.18, 0, -0.02], handL: [0, 0, 0.08],
  uarmR: [0.02, 0, -0.12], farmR: [-0.18, 0, 0.02], handR: [0, 0, -0.08],
  thighL: [0, 0, -0.015], shinL: [0, 0, 0], thighR: [0, 0, 0.015], shinR: [0, 0, 0],
  ankleL: [0, 0, 0.015], ankleR: [0, 0, -0.015],
};
const JOINTS = Object.keys(IDLE);
export function setPose(d, P) { for (const k of JOINTS) d.bones[k].rotation.set(P[k][0], P[k][1], P[k][2]); }
export function poseNeutral(d) { setPose(d, NEUTRAL); groundDoll(d); }

const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _sole = [V3(0, -0.075, 0.105), V3(0, -0.075, -0.035)];
/* move the body up/down so the lowest sole point rests on the floor */
export function groundDoll(d) {
  const B = d.bones;
  B.body.position.y = 0;
  d.root.updateMatrixWorld(true);
  let min = Infinity;
  for (const S of ['L', 'R']) for (const p of _sole) { B['ankle' + S].localToWorld(_v.copy(p)); d.root.worldToLocal(_v); min = Math.min(min, _v.y); }
  B.body.position.y = -min;
}

/* d.anim.speed 0..1 (walk blend), phase advances with distance; reach 0..1 (arm to shelf); t = seconds */
export function animateDoll(d, t, dt) {
  const A = d.anim, B = d.bones, s = A.speed, ph = A.phase;
  const idle = d.mannequin ? NEUTRAL : IDLE;
  const out = {};
  const sinp = Math.sin(ph), cosp = Math.cos(ph);
  for (const k of JOINTS) out[k] = [...lerpArr(idle[k], NEUTRAL[k], s)];
  if (s > 0.001) {
    const amp = 0.46 * s, knee = 0.9 * s;
    for (const [S, sign] of [['L', 1], ['R', -1]]) {
      const phi = ph + (S === 'L' ? 0 : Math.PI), sw = Math.sin(phi), cw = Math.cos(phi);
      const thigh = -amp * sw;
      const flex = knee * Math.pow(Math.max(0, cw), 1.6) * smooth(-0.2, 0.6, -sw + 0.6) + 0.06 * s;
      out['thigh' + S][0] += thigh;
      out['shin' + S][0] += flex;
      out['ankle' + S][0] += -(thigh + flex) * 0.82 + 0.22 * s * Math.max(0, cw) * smooth(0, 1, sw + 0.3);
      out['uarm' + S][0] += 0.34 * s * sw;                 // arm swings opposite its leg
      out['farm' + S][0] += -0.18 * s - 0.16 * s * Math.max(0, -sw);
      out['uarm' + S][2] += sign * 0.04 * s;
    }
    out.pelvis[1] += 0.09 * s * sinp; out.pelvis[2] += 0.03 * s * Math.cos(2 * ph);
    out.chest[1] += -0.07 * s * sinp; out.chest[0] += 0.03 * s;
    out.head[1] += 0.03 * s * sinp;
  }
  // idle breathing + sway
  if (!d.mannequin) {
    const br = Math.sin(t * 1.7 + A.idleSeed);
    B.breath.scale.set(1 + 0.005 * br, 1 + 0.004 * br, 1 + 0.012 * br);
    out.head[2] += 0.02 * Math.sin(t * 0.7 + A.idleSeed) * (1 - s);
    out.head[0] += 0.015 * Math.sin(t * 0.9 + A.idleSeed + 1) * (1 - s);
  }
  // reach toward a shelf with the right arm (browsing / picking)
  if (A.reach > 0.001) {
    const r = smooth(0, 1, A.reach);
    blendInto(out.uarmR, [-1.15, 0.15, -0.25], r); blendInto(out.farmR, [-0.35, 0, 0.1], r); blendInto(out.handR, [-0.2, 0, 0], r);
    blendInto(out.head, [-0.08, 0, 0], r * 0.6);
  }
  // celebration wave (both arms up briefly)
  if (A.wave > 0.001) {
    const r = smooth(0, 1, A.wave), wig = 0.25 * Math.sin(t * 14);
    blendInto(out.uarmL, [-0.2, 0, 2.5 + wig], r); blendInto(out.farmL, [0, 0, 0.3], r);
    blendInto(out.uarmR, [-0.2, 0, -2.5 - wig], r); blendInto(out.farmR, [0, 0, -0.3], r);
  }
  for (const k of JOINTS) B[k].rotation.set(out[k][0], out[k][1], out[k][2]);
  groundDoll(d);
  // hair sway follows movement
  for (const piv of d.locks) { const q = piv.userData.phase || 0; piv.rotation.z = 0.03 * Math.sin(t * 1.25 + q) + 0.02 * s * Math.sin(ph * 2 + q); piv.rotation.x = 0.02 * Math.sin(t * 1.05 + q * 1.7) + 0.09 * s; }
  for (const m of d.hairPanel) m.rotation.x = 0.012 * Math.sin(t * 1.1 + A.idleSeed) + 0.06 * s;
  // blink
  if (d.face) {
    const bt = t - A.blinkNext, F = d.face;
    let want = F.open;
    if (bt > 0 && bt < 0.06) want = F.half; else if (bt >= 0.06 && bt < 0.15) want = F.shut; else if (bt >= 0.15 && bt < 0.21) want = F.half;
    else if (bt >= 0.21) A.blinkNext = t + 2.4 + Math.random() * 2.6;
    if (d.faceMat.map !== want) d.faceMat.map = want;
  }
}
function lerpArr(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function blendInto(o, target, r) { o[0] = lerp(o[0], target[0], r); o[1] = lerp(o[1], target[1], r); o[2] = lerp(o[2], target[2], r); }
