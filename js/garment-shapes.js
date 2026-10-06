/* Garment geometry fitted to the doll's body profiles (chest, pelvis, limbs). */
import * as THREE from 'three';
import { TAU, lerp, smooth, V3, gridGeo, ribbonTube, arcUV, smoothSeams, cached, crSample, tubeLathe, bodyLathe } from './util.js?v=2271898f';
import { CHEST_KEYS, PELVIS_KEYS, ARM_KEYS, FARM_KEYS, THIGH_KEYS, SHIN_KEYS, ringAt } from './doll.js?v=2271898f';

/* neckline height around the chest; th: angle (0 = front), returns y in chest space */
function neckline(neck, s, c) {
  const front = smooth(-0.1, 0.6, c);
  if (neck === 'crew') return 0.335 - 0.022 * front;
  if (neck === 'square') return 0.24 + 0.05 * s * s + 0.03 * (1 - front);
  if (neck === 'v') return 0.31 - 0.11 * front * Math.exp(-((s / 0.28) ** 2));
  if (neck === 'halter') return 0.22 + 0.06 * s * s;
  // sweetheart
  return 0.2 + 0.05 * s * s + front * (0.026 * Math.exp(-(((Math.abs(s) - 0.42) / 0.2) ** 2)) - 0.028 * Math.exp(-((s / 0.09) ** 2)));
}

/* fitted bodice following the torso; yBot in chest space */
export function bodiceGeo({ off = 0.0065, yBot = -0.04, neck = 'sweetheart' } = {}) {
  return cached(`bod_${off}_${yBot}_${neck}`, () => {
    const nu = 72, nv = 24;
    const g = gridGeo(nu, nv, (u, v, out) => {
      const th = Math.PI + u * TAU, s = Math.sin(th), c = Math.cos(th);
      const y = lerp(yBot, neckline(neck, s, c), v), r = ringAt(CHEST_KEYS, Math.min(y, 0.36));
      out.set(s * (r.rx + off), y, r.zo + c * (r.rz + off));
    }, true);
    return arcUV(g, nu, nv, 0.3);
  });
}
export function strapGeo(s, { w = 0.011, th = 0.003, off = 0.008 } = {}) {
  return cached(`strap_${s}_${w}_${off}`, () => {
    const fr = ringAt(CHEST_KEYS, 0.226), bk = ringAt(CHEST_KEYS, 0.215);
    const pts = [[s * 0.07, 0.226, fr.zo + (fr.rz + off) * 0.78], [s * 0.088, 0.29, 0.034], [s * 0.094, 0.318, -0.004], [s * 0.088, 0.29, -0.042], [s * 0.07, 0.215, bk.zo - (bk.rz + off) * 0.8]];
    const curve = new THREE.CatmullRomCurve3(pts.map(p => V3(...p)));
    return ribbonTube(curve, { width: () => w, thick: () => th, segs: 24, radial: 8, ref: (P, t, R) => R.set(P.x * 0.3, P.y - 0.2, P.z) });
  });
}
/* flared skirt from the waist (pelvis space) */
export function skirtGeo({ yTop = 0.215, yHem = -0.56, rHem = [0.40, 0.34], folds = 11, foldAmp = 0.022, hemWave = 0.012, off = 0.009, zShift = 0.03, flare = 0.82 } = {}) {
  return cached(`skirt_${yTop}_${yHem}_${rHem}_${folds}_${foldAmp}_${off}_${flare}`, () => {
    const nu = 132, nv = 40;
    const hipTop = ringAt(PELVIS_KEYS, 0.02);
    const g = gridGeo(nu, nv, (u, v, out) => {
      const th = Math.PI + u * TAU, s = Math.sin(th), c = Math.cos(th);
      const y0 = lerp(yTop, yHem, v);
      let rx, rz, zo, tf = 0;
      if (y0 >= 0.02) { const r = ringAt(PELVIS_KEYS, y0); rx = r.rx + off; rz = r.rz + off; zo = r.zo; }
      else {
        tf = (0.02 - y0) / (0.02 - yHem); const e = Math.pow(tf, flare);
        rx = lerp(hipTop.rx + off, rHem[0], e); rz = lerp(hipTop.rz + off, rHem[1], e); zo = lerp(hipTop.zo, zShift, e);
      }
      const fold = foldAmp * Math.pow(tf, 1.25) * Math.sin(folds * th + 0.9 * Math.sin(3 * th));
      const y = y0 + hemWave * Math.pow(v, 6) * Math.sin(folds * th + 1.3);
      out.set(s * (rx + fold), y, zo + c * (rz + fold));
    });
    return arcUV(g, nu, nv, 0.3);
  });
}
export function frillGeo({ y = -0.5, r = [0.36, 0.32], drop = 0.04, n = 44, zShift = 0.03 } = {}) {
  return cached(`frill_${y}_${r}_${drop}_${n}`, () => gridGeo(176, 6, (u, v, out) => {
    const th = Math.PI + u * TAU, s = Math.sin(th), c = Math.cos(th);
    const rr = 1 + 0.12 * v, w = 0.012 * v * Math.sin(n * th);
    out.set(s * (r[0] * rr + w), y - drop * v + 0.006 * v * Math.sin(n * th + 1), zShift + c * (r[1] * rr + w));
  }));
}
export function puffSleeveGeo() {
  return cached('puffsleeve', () => {
    const top = 0.056, bot = -0.1, bulge = 0.069, cuff = 0.0425, pts = [];
    for (let j = 0; j <= 24; j++) {
      const t = j / 24, y = lerp(bot, top, t);
      let r = lerp(cuff, 0.03, t) + (bulge - 0.034) * Math.sin(Math.PI * Math.pow(t, 0.8));
      if (t > 0.85) r *= Math.sqrt(Math.max(0.02, 1 - Math.pow((t - 0.85) / 0.15, 2)));
      pts.push(new THREE.Vector2(Math.max(r, 1e-3), y));
    }
    const g = new THREE.LatheGeometry(pts, 40), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(x, z), k = 1 + 0.06 * Math.sin(16 * a) * Math.sin(Math.PI * Math.min(1, Math.max(0, (y - bot) / (top - bot))));
      p.setXYZ(i, x * k, y, z * k);
    }
    return smoothSeams(g);
  });
}
/* upper sleeve tube on the upper arm: from shoulder cap down `len` */
export function upperSleeveGeo(len = 0.12, ease = 0.012, flare = 0) {
  return cached(`usleeve_${len}_${ease}_${flare}`, () => {
    const pts = [];
    for (let k = 0; k <= 6; k++) { const a = (k / 6) * (Math.PI / 2); pts.push([Math.cos(a), Math.sin(a)]); }
    const prof = [];
    for (let j = 18; j >= 0; j--) { const d = len * j / 18; prof.push(new THREE.Vector2(crSample(ARM_KEYS, Math.min(d, 0.27))[0] + ease + flare * (d / len) ** 2, -d)); }
    // dome over the shoulder
    const r0 = crSample(ARM_KEYS, 0)[0] + ease;
    for (let k = 1; k <= 6; k++) { const a = (k / 6) * (Math.PI / 2); prof.push(new THREE.Vector2(Math.max(1e-3, Math.cos(a) * r0), Math.sin(a) * r0 * 0.9)); }
    return smoothSeams(new THREE.LatheGeometry(prof, 32));
  });
}
export function forearmSleeveGeo(len = 0.2, ease = 0.01, flare = 0) {
  return cached(`fsleeve_${len}_${ease}_${flare}`, () => tubeLathe(len + 0.03, [[0, crSample(FARM_KEYS, 0)[0] + ease + 0.004], [0.1, crSample(FARM_KEYS, 0.07)[0] + ease], [len + 0.03, crSample(FARM_KEYS, Math.min(len, 0.235))[0] + ease + flare]], { y0: 0.03 }));
}
export function cuffGeo(r = 0.034) { return cached('cuff' + r, () => new THREE.TorusGeometry(r, 0.006, 8, 32)); }

/* trousers: hip shell + leg tubes */
export function hipShellGeo(off = 0.01, yBot = -0.09) {
  return cached(`hips_${off}_${yBot}`, () => bodyLathe(PELVIS_KEYS.filter(k => k[0] >= yBot - 0.02).map(k => [k[0], k[1] + off, k[2] + off, k[3]]), { segs: 48, samples: 24 }));
}
export function thighTubeGeo(len = 0.48, ease = 0.014, flare = 0) {
  return cached(`thightube_${len}_${ease}_${flare}`, () => {
    // starts just above the hip joint, narrower at the top so it stays tucked inside the hip shell
    const top = 0.03, keys = [[0, crSample(THIGH_KEYS, 0)[0] + ease * 0.4]];
    for (let i = 1; i <= 8; i++) { const d = i / 8 * len; keys.push([d + top, crSample(THIGH_KEYS, Math.min(d, 0.46))[0] + ease + flare * (d / len) ** 2]); }
    return tubeLathe(len + top, keys, { y0: top });
  });
}
/* tube around the shin from `start` to `end` (distances down from the knee; start < 0 begins above the knee) */
export function shinTubeGeo({ start = -0.03, end = 0.42, ease = 0.014, flare = 0 } = {}) {
  return cached(`shintube_${start}_${end}_${ease}_${flare}`, () => {
    const len = end - start, keys = [];
    for (let i = 0; i <= 10; i++) {
      const d = i / 10 * len, dd = start + d;
      keys.push([d, crSample(SHIN_KEYS, Math.min(Math.max(dd, 0), 0.44))[0] + ease + (dd < 0 ? 0.006 : 0) + flare * (d / len) ** 1.6]);
    }
    return tubeLathe(len, keys, { y0: -start });
  });
}

export function makeBow(mat, size = 1) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const C = V3(s * 0.034, 0.002, 0);
    const pts = [V3(s * 0.006, 0.004, 0.002), V3(s * 0.028, 0.024, 0.006), V3(s * 0.055, 0.02, 0.002), V3(s * 0.064, 0.0, -0.002), V3(s * 0.052, -0.017, 0.0), V3(s * 0.026, -0.013, 0.004), V3(s * 0.006, -0.003, 0.003)];
    g.add(new THREE.Mesh(cached('bowloop' + s, () => ribbonTube(new THREE.CatmullRomCurve3(pts, true), { width: () => 0.0105, thick: () => 0.0028, segs: 40, radial: 8, ref: (P, t, R) => R.copy(P).sub(C).setZ(0) })), mat));
    const tail = [V3(s * 0.004, -0.004, 0.004), V3(s * 0.016, -0.024, 0.008), V3(s * 0.022, -0.05, 0.004), V3(s * 0.03, -0.072, 0.0)];
    g.add(new THREE.Mesh(cached('bowtail' + s, () => ribbonTube(new THREE.CatmullRomCurve3(tail), { width: t => 0.009 * (1 + 0.25 * t), thick: () => 0.0024, segs: 16, radial: 6, ref: () => V3(0, 0, 1) })), mat));
  }
  const knot = new THREE.Mesh(cached('knot', () => new THREE.SphereGeometry(0.012, 16, 12)), mat); knot.scale.set(1, 1.15, 0.75); g.add(knot);
  g.scale.setScalar(size);
  return g;
}
export function waistbandGeo(off = 0.014) {
  return cached('waistband' + off, () => bodyLathe([[0.165, 0.096 + off, 0.074 + off, 0.002], [0.2, 0.09 + off, 0.07 + off, 0.002], [0.235, 0.086 + off, 0.066 + off, 0.002]], { segs: 48, samples: 6 }));
}
