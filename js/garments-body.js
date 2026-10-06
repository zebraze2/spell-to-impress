/* Builders for body garments: dresses, gowns, tops, skirts, trousers.
   Each returns { parts, main, inner, accent } for wrapItem(). */
import * as THREE from 'three';
import { TAU, lerp, smooth, gridGeo, arcUV, cached, V3 } from './util.js';
import { PELVIS_KEYS, CHEST_KEYS, ringAt } from './doll.js';
import { fabric, innerFabric } from './clothes.js';
import { TEX } from './textures.js';
import { bodiceGeo, strapGeo, skirtGeo, frillGeo, puffSleeveGeo, upperSleeveGeo, forearmSleeveGeo, cuffGeo, hipShellGeo, thighTubeGeo, shinTubeGeo, makeBow, waistbandGeo } from './garment-shapes.js';

const WHITE_TRIM = () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, side: THREE.DoubleSide });
const g = (...objs) => { const o = new THREE.Group(); objs.forEach(x => o.add(x)); return o; };
const mesh = (geo, mat) => new THREE.Mesh(geo, mat);

function sleeves(kind, mat, trim, parts) {
  for (const S of ['L', 'R']) {
    if (kind === 'puff') {
      const c = mesh(cuffGeo(0.0428), trim); c.rotation.x = Math.PI / 2; c.position.y = -0.1;
      parts.push({ bone: 'uarm' + S, obj: g(mesh(puffSleeveGeo(), mat), c) });
    } else if (kind === 'short') {
      parts.push({ bone: 'uarm' + S, obj: mesh(upperSleeveGeo(0.13, 0.012, 0.012), mat) });
    } else if (kind === 'long') {
      parts.push({ bone: 'uarm' + S, obj: mesh(upperSleeveGeo(0.29, 0.012), mat) });
      parts.push({ bone: 'farm' + S, obj: mesh(forearmSleeveGeo(0.2, 0.011, 0.006), mat) });
    }
  }
}

/* sundress / party dress: bodice + flared skirt (+ sleeves, sash, bows, frill) */
export function buildDress(p) {
  const outer = fabric(0.78), inner = innerFabric(), sash = fabric(0.34), trim = WHITE_TRIM();
  const parts = [];
  const bod = g(mesh(bodiceGeo({ neck: p.neck || 'sweetheart' }), outer));
  if (p.straps !== false && (p.neck || 'sweetheart') !== 'crew') for (const s of [-1, 1]) bod.add(mesh(strapGeo(s), outer));
  parts.push({ bone: 'breath', obj: bod });
  const sk = g();
  const sg = skirtGeo(p.skirt || {});
  sk.add(mesh(sg, outer), mesh(sg, inner));
  if (p.frill) sk.add(mesh(frillGeo(p.frill), trim));
  sk.add(mesh(waistbandGeo(), sash));
  if (p.sashBow !== false) { const bow = makeBow(sash, 1.05); bow.position.set(-0.075, 0.2, 0.062); bow.rotation.set(0, -0.75, 0.15); sk.add(bow); }
  parts.push({ bone: 'pelvis', obj: sk });
  sleeves(p.sleeves || 'puff', p.sleeveWhite ? trim : outer, trim, parts);
  if (p.chestBow) { const b = makeBow(sash, 0.8); const r = ringAt(CHEST_KEYS, 0.2); b.position.set(0, 0.196, r.zo + r.rz + 0.012); parts.push({ bone: 'breath', obj: b }); }
  if (p.skirtBows) {
    const sp = p.skirt || {}, yH = sp.yHem ?? -0.56, rH = sp.rHem || [0.4, 0.34];
    for (const a of [-0.9, 0, 0.9]) {
      const b = makeBow(sash, 0.7), y = yH + 0.07, t = (0.02 - y) / (0.02 - yH);
      b.position.set(Math.sin(a) * (lerp(0.136, rH[0], t) + 0.008), y, 0.03 + Math.cos(a) * (lerp(0.099, rH[1], t) + 0.008)); b.rotation.y = a;
      parts.push({ bone: 'pelvis', obj: b });
    }
  }
  return { parts, main: [outer], inner: [inner], accent: [sash] };
}

/* ball gown: fitted bodice + tiers of ruffles to the floor */
export function buildGown(p) {
  const outer = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.42, sheen: 1, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.3, clearcoat: 0.3, clearcoatRoughness: 0.32 });
  const inner = innerFabric();
  const silver = new THREE.MeshStandardMaterial({ color: '#eef2fa', metalness: 1, roughness: 0.2 });
  const parts = [];
  const bod = g(mesh(bodiceGeo({ off: 0.0075, neck: p.neck || 'sweetheart' }), outer));
  if (p.straps !== false) for (const s of [-1, 1]) bod.add(mesh(strapGeo(s, { w: 0.008 }), outer));
  parts.push({ bone: 'breath', obj: bod });
  const tiers = p.tiers || 4;
  const T = [
    { yTop: 0.215, yHem: -0.12, r0: [0.1, 0.08], r1: [0.24, 0.21], n: 15, amp: 0.022 },
    { yTop: 0.02, yHem: -0.36, r0: [0.16, 0.13], r1: [0.36, 0.32], n: 18, amp: 0.028 },
    { yTop: -0.2, yHem: -0.63, r0: [0.25, 0.22], r1: [0.5, 0.45], n: 21, amp: 0.034 },
    { yTop: -0.47, yHem: -0.968, r0: [0.34, 0.3], r1: [0.67, 0.6], n: 24, amp: 0.04 }];
  const sk = g();
  T.forEach((t, k) => {
    if (tiers === 1 && k < 3) return;
    const geo = cached('gowntier' + k + (tiers === 1 ? 's' : ''), () => {
      const tt = tiers === 1 ? { ...t, yTop: 0.215, r0: [0.1, 0.08], amp: 0.03 } : t;
      const gg = gridGeo(176, 28, (u, v, out) => {
        const th = Math.PI + u * TAU, s = Math.sin(th), c = Math.cos(th), y0 = lerp(tt.yTop, tt.yHem, v), e = Math.sin(v * Math.PI / 2);
        let rx = lerp(tt.r0[0], tt.r1[0], e), rz = lerp(tt.r0[1], tt.r1[1], e);
        if (y0 > 0.02) { const r = ringAt(PELVIS_KEYS, y0); rx = Math.max(rx, r.rx + 0.012); rz = Math.max(rz, r.rz + 0.012); }
        const mod = 0.75 + 0.25 * Math.sin(3 * th + k * 1.7), ph = tt.n * th + 0.8 * Math.sin(5 * th + k);
        const ruf = tt.amp * mod * Math.pow(v, 2.0) * (Math.sin(ph) + 0.3 * Math.sin(1.7 * ph + 0.6));
        const y = y0 + (k === 3 ? 0.004 : tt.amp * 0.5) * Math.pow(v, 4) * Math.sin(ph + 1.1) + (k === 3 ? 0 : 0.012 * smooth(0.88, 1, v));
        out.set(s * (rx + ruf), Math.max(y, -0.972), 0.012 * e * (k + 1) + c * (rz + ruf));
      });
      return arcUV(gg, 176, 28, 0.35);
    });
    sk.add(mesh(geo, outer), mesh(geo, inner));
  });
  sk.add(mesh(waistbandGeo(0.012), silver));
  parts.push({ bone: 'pelvis', obj: sk });
  if (p.sleeves) sleeves(p.sleeves, outer, outer, parts);
  return { parts, main: [outer], inner: [inner], accent: [] , sheen: outer };
}

/* tops: bodice to the waist + sleeves */
export function buildTop(p) {
  const outer = fabric(p.rough ?? 0.75), trim = WHITE_TRIM();
  const parts = [];
  const neck = p.neck || 'crew';
  const bod = g(mesh(bodiceGeo({ neck, off: p.loose ? 0.014 : 0.008, yBot: -0.06 }), outer));
  if (p.sleeves === 'straps') for (const s of [-1, 1]) bod.add(mesh(strapGeo(s, { off: p.loose ? 0.014 : 0.009 }), outer));
  parts.push({ bone: 'breath', obj: bod });
  sleeves(p.sleeves, outer, trim, parts);
  const accent = [];
  if (p.bow) { const bm = fabric(0.35); accent.push(bm); const b = makeBow(bm, 0.8); const r = ringAt(CHEST_KEYS, 0.27); b.position.set(0, 0.29, r.zo + r.rz + 0.016); parts.push({ bone: 'breath', obj: b }); }
  return { parts, main: [outer], inner: [], accent };
}

/* skirts: A-line, mini, tutu, maxi */
export function buildSkirt(p) {
  const outer = fabric(0.78), inner = innerFabric(), band = fabric(0.5);
  const sk = g();
  const sg = skirtGeo(p.skirt || {});
  sk.add(mesh(sg, outer), mesh(sg, inner), mesh(waistbandGeo(0.012), band));
  if (p.tutu) {
    const yH = p.skirt.yHem, rH = p.skirt.rHem;
    for (let i = 0; i < 3; i++) sk.add(mesh(frillGeo({ y: lerp(0.02, yH, 0.45 + i * 0.25), r: [rH[0] * (0.75 + i * 0.13), rH[1] * (0.75 + i * 0.13)], drop: 0.05, n: 36 + i * 6 }), outer));
  }
  return { parts: [{ bone: 'pelvis', obj: sk }], main: [outer], inner: [inner], accent: [band], accentShade: -0.18 };
}

/* trousers / shorts */
export function buildPants(p) {
  const outer = fabric(p.rough ?? 0.85), band = fabric(0.6);
  const parts = [{ bone: 'pelvis', obj: g(mesh(hipShellGeo(0.012), outer), mesh(waistbandGeo(0.016), band)) }];
  for (const S of ['L', 'R']) {
    if (p.shorts) parts.push({ bone: 'thigh' + S, obj: mesh(thighTubeGeo(0.17, 0.02, 0.012), outer) });
    else {
      parts.push({ bone: 'thigh' + S, obj: mesh(thighTubeGeo(0.48, 0.016, p.flare ? 0.01 : 0), outer) });
      parts.push({ bone: 'shin' + S, obj: mesh(shinTubeGeo({ start: -0.03, end: 0.42, ease: 0.018, flare: p.flare || 0.004 }), outer) });
    }
  }
  return { parts, main: [outer], inner: [], accent: [band], accentShade: -0.2 };
}
