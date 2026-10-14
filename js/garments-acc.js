/* Builders for shoes, headwear, necklaces and gloves. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TAU, lerp, smooth, V3, gridGeo, ribbonTube, smoothSeams, cached, limbLathe, crSample } from './util.js?v=8bebf9f5';
import { CHEST_KEYS, ARM_KEYS, FARM_KEYS, ringAt, headShape, mittenGeo } from './doll.js?v=8bebf9f5';
import { fabric } from './clothes.js?v=8bebf9f5';
import { TEX } from './textures.js?v=8bebf9f5';
import { makeBow, shinTubeGeo } from './garment-shapes.js?v=8bebf9f5';

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
export const pearlMat = new THREE.MeshStandardMaterial({ color: '#fff4ec', roughness: 0.16, emissive: '#3a2a30', emissiveIntensity: 0.25 });
const silver = () => new THREE.MeshStandardMaterial({ color: '#f1f4fb', metalness: 1, roughness: 0.16 });
const gold = () => new THREE.MeshStandardMaterial({ color: '#e9c48a', metalness: 1, roughness: 0.25 });

/* ---------------- shoes ---------------- */
export function shoeGeo({ heelH = 0.034, wid = 0.054, upperH = 0.033, point = 0, round = 0 } = {}) {
  return cached(`shoe_${heelH}_${wid}_${upperH}_${point}_${round}`, () => gridGeo(26, 34, (u, v, out) => {
    const a = u * TAU, z = lerp(-0.044, 0.128 + point * 0.02 + round * 0.01, v);
    const yb = -0.075 + heelH * (1 - smooth(0.25, 0.62, v));
    const end = Math.sqrt(Math.max(0, 1 - Math.pow((v - 0.5) / 0.5, point ? 4 : 8)));
    const hw = wid / 2 * (0.78 + 0.3 * Math.sin(Math.PI * Math.min(1, v * 1.05))) * end * (point ? (1 - 0.35 * smooth(0.6, 1, v)) : 1);
    const top = upperH * (0.6 + 0.4 * smooth(0, 0.35, v)) * (1 - (0.55 - round * 0.4) * smooth(0.8, 1, v)) * end;
    const sy = Math.sin(a);
    out.set(Math.cos(a) * hw, yb + (sy > 0 ? sy * top : sy * 0.006), z);
  }, true));
}
export function buildShoes(p) {
  const sporty = p.style === 'sneakers' || p.style === 'hightops';
  const up = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: sporty ? 0.6 : 0.24 });
  const sole = new THREE.MeshStandardMaterial({ color: sporty ? '#ffffff' : '#f2b8c9', roughness: 0.55 });
  const parts = [], accent = [];
  for (const S of ['L', 'R']) {
    const grp = new THREE.Group(), side = S === 'L' ? 1 : -1;
    if (p.style === 'sandals') {
      grp.add(mesh(shoeGeo({ heelH: 0.008, wid: 0.062, upperH: 0.006, round: 1 }), sole));
      for (const [z, w] of [[0.06, 0.03], [-0.005, 0.026]]) {
        const curve = new THREE.CatmullRomCurve3([V3(-w, -0.068, z), V3(-w * 0.7, -0.045, z), V3(0, -0.038, z), V3(w * 0.7, -0.045, z), V3(w, -0.068, z)]);
        grp.add(mesh(cached('sandalstrap' + z, () => ribbonTube(curve, { width: () => 0.009, thick: () => 0.003, segs: 18, radial: 8, ref: (P, t, R) => R.set(P.x, P.y + 0.07, 0) })), up));
      }
      const flower = mesh(cached('sandalflower', () => new THREE.SphereGeometry(0.011, 10, 8)), pearlMat); flower.position.set(0, -0.036, 0.06); grp.add(flower);
    } else if (sporty) {
      grp.add(mesh(shoeGeo({ heelH: 0, wid: 0.064, upperH: 0.05, round: 1 }), up));
      const so = mesh(shoeGeo({ heelH: 0, wid: 0.07, upperH: 0.012, round: 1 }), sole); so.position.y = -0.002; so.scale.set(1, 1, 1.03); grp.add(so);
      for (let i = 0; i < 3; i++) { const l = mesh(cached('lace', () => new THREE.CylinderGeometry(0.0025, 0.0025, 0.04, 6)), sole); l.rotation.z = Math.PI / 2; l.position.set(0, -0.026 + i * 0.004, 0.045 + i * 0.016); grp.add(l); }
      // high-tops: a snug collar up over the ankle bone (pants legs go over it, like real ones)
      if (p.style === 'hightops') parts.push({ bone: 'shin' + S, obj: mesh(shinTubeGeo({ start: 0.36, end: 0.47, ease: 0.011, flare: 0.007 }), up) });
    } else {
      const point = p.style === 'heels' ? 1 : 0;
      grp.add(mesh(shoeGeo({ point }), up));
      const so = mesh(shoeGeo({ point, upperH: 0.004, wid: 0.06 }), sole); so.position.y = -0.0045; grp.add(so);
      const hh = 0.034;
      const hl = p.style === 'heels' ? mesh(cached('stiletto', () => new THREE.CylinderGeometry(0.0045, 0.003, hh + 0.004, 10)), up) : mesh(cached('blockheel', () => new RoundedBoxGeometry(0.026, hh + 0.004, 0.028, 2, 0.005)), sole);
      hl.position.set(0, -0.075 + hh / 2 - 0.002, -0.03); grp.add(hl);
      if (p.style === 'maryjanes') {
        const curve = new THREE.CatmullRomCurve3([V3(-0.028, -0.058, 0.02), V3(-0.02, -0.03, 0.018), V3(0, -0.022, 0.016), V3(0.02, -0.03, 0.018), V3(0.028, -0.058, 0.02)]);
        grp.add(mesh(cached('mjstrap', () => ribbonTube(curve, { width: () => 0.0075, thick: () => 0.0028, segs: 20, radial: 8, ref: (P, t, R) => R.set(P.x, P.y + 0.06, 0) })), up));
        const btn = mesh(cached('mjbtn', () => new THREE.SphereGeometry(0.0055, 12, 10)), pearlMat); btn.position.set(side * 0.029, -0.052, 0.02); grp.add(btn);
      }
      if (p.style === 'boots') {
        // the shaft is a little wider than a pants leg, so pants tuck into boots
        parts.push({ bone: 'shin' + S, obj: mesh(shinTubeGeo({ start: 0.13, end: 0.43, ease: 0.022, flare: 0.01 }), up) });
      }
    }
    parts.push({ bone: 'ankle' + S, obj: grp });
  }
  if (sporty) accent.push(sole);
  return { parts, main: [up], inner: [], accent: [], accentShade: 0 };
}

/* ---------------- headwear ---------------- */
function sunHatGeo() {
  return cached('sunhat', () => {
    const P = [[0.172, -0.012], [0.25, -0.024], [0.33, -0.04], [0.372, -0.052], [0.381, -0.046], [0.377, -0.036], [0.33, -0.024], [0.25, -0.006], [0.18, 0.006], [0.172, 0.03], [0.166, 0.075], [0.155, 0.105], [0.12, 0.13], [0.06, 0.142], [0.0005, 0.145]];
    const curve = new THREE.CatmullRomCurve3(P.map(p => V3(p[0], p[1], 0)), false, 'centripetal');
    const prof = []; for (let i = 0; i <= 90; i++) { const q = curve.getPoint(i / 90); prof.push(new THREE.Vector2(q.x, q.y)); }
    const geo = new THREE.LatheGeometry(prof, 96), p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i), r = Math.hypot(x, z), a = Math.atan2(x, z);
      p.setY(i, y + smooth(0.18, 0.37, r) * (0.014 * Math.sin(3 * a + 0.6) - 0.008 * Math.cos(a)));
      if (r > 0.176) uv.setXY(i, x * 4.2, z * 4.2); else uv.setXY(i, a / TAU * 6, y * 4.2);
    }
    return smoothSeams(geo);
  });
}
export function buildHat(p) {
  const grp = new THREE.Group(), main = [], accent = [];
  let fit = null;                             // for hats the hair tucks into (see fitHair in doll.js)
  if (p.style === 'sun') {
    const straw = new THREE.MeshStandardMaterial({ map: TEX.straw, color: '#fff6e4', roughness: 0.82, side: THREE.DoubleSide });
    const ribbon = fabric(0.32);
    grp.add(mesh(sunHatGeo(), straw));
    const bandPts = []; for (let i = 0; i <= 6; i++) bandPts.push(new THREE.Vector2(0.1755 - i / 6 * 0.0025, 0.004 + i / 6 * 0.04));
    grp.add(mesh(cached('hatband', () => smoothSeams(new THREE.LatheGeometry(bandPts, 64))), ribbon));
    const bow = makeBow(ribbon, 1.3); bow.position.set(-0.135, 0.03, 0.115); bow.rotation.set(0, -0.86, 0); grp.add(bow);
    grp.position.set(0.004, 0.105, -0.012); grp.rotation.set(-0.16, 0, -0.1);
    fit = { obj: grp, c: [0, 0, 0], r: [0.16, 0.13, 0.16] };
    main.push(ribbon);
  } else if (p.style === 'beret') {
    const m = fabric(0.92);
    const b = mesh(cached('beret', () => new THREE.SphereGeometry(0.19, 32, 18)), m); b.scale.set(1, 0.36, 1); grp.add(b);
    const nub = mesh(cached('beretnub', () => new THREE.SphereGeometry(0.014, 10, 8)), m); nub.position.set(0.01, 0.068, 0); grp.add(nub);
    grp.position.set(0.03, 0.15, -0.01); grp.rotation.set(-0.1, 0, -0.32);
    fit = { obj: grp, c: [0, -0.03, 0], r: [0.17, 0.085, 0.17] };
    main.push(m);
  } else if (p.style === 'tiara') {
    const met = silver(), gem = new THREE.MeshStandardMaterial({ color: '#ffd6ef', metalness: 0.2, roughness: 0.05, emissive: '#ff8fcf', emissiveIntensity: 0.25 });
    const clear = new THREE.MeshStandardMaterial({ color: '#f2f8ff', metalness: 0.3, roughness: 0.04, emissive: '#cfe3ff', emissiveIntensity: 0.2 });
    const v = new THREE.Vector3(), lat = 0.66, pts = [];
    const at = (psi, lift = 0) => { headShape(Math.sin(psi) * Math.cos(lat), Math.sin(lat), Math.cos(psi) * Math.cos(lat), v, 0.026 + lift); return v.clone(); };
    for (let i = 0; i <= 40; i++) pts.push(at(-1.25 + 2.5 * i / 40));
    grp.add(mesh(cached('tiaraband', () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.0055, 8)), met));
    [-1.0, -0.66, -0.33, 0, 0.33, 0.66, 1.0].forEach((psi, i) => {
      const h = [0.026, 0.036, 0.048, 0.07, 0.048, 0.036, 0.026][i];
      const base = at(psi), nrm = at(psi, 0.02).sub(base).normalize().add(V3(0, 1.4, 0)).normalize();
      const arcPts = [base.clone().add(V3(Math.cos(psi) * -0.014, 0, Math.sin(psi) * 0.014)), base.clone().addScaledVector(nrm, h * 0.7), base.clone().add(V3(Math.cos(psi) * 0.014, 0, -Math.sin(psi) * 0.014))];
      grp.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), 12, 0.0034, 6), met));
      const gm = mesh(cached('gem' + (i === 3), () => new THREE.OctahedronGeometry(i === 3 ? 0.018 : 0.011, 0)), i % 2 === 1 ? clear : gem);
      gm.position.copy(base).addScaledVector(nrm, h); gm.scale.set(1, 1.45, 0.7); gm.lookAt(gm.position.clone().add(nrm)); gm.rotateX(Math.PI / 2); grp.add(gm);
    });
    main.push(gem);
    return { parts: [{ bone: 'headC', obj: grp }], main, inner: [], accent: [], onColor: c => gem.emissive.set(c) };
  } else if (p.style === 'crown') {           // flower crown: leafy band + blossoms
    const leaf = new THREE.MeshStandardMaterial({ color: '#6fae6a', roughness: 0.6 }), petal = fabric(0.5), mid = new THREE.MeshStandardMaterial({ color: '#ffd54a', roughness: 0.5 });
    const v = new THREE.Vector3(), lat = 0.5, pts = [];
    for (let i = 0; i <= 48; i++) { const psi = i / 48 * TAU; headShape(Math.sin(psi) * Math.cos(lat), Math.sin(lat), Math.cos(psi) * Math.cos(lat), v, 0.02); pts.push(v.clone()); }
    grp.add(mesh(cached('crownband', () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.008, 6, true)), leaf));
    for (let i = 0; i < 9; i++) {
      const psi = -1.4 + i / 8 * 2.8; headShape(Math.sin(psi) * Math.cos(lat), Math.sin(lat), Math.cos(psi) * Math.cos(lat), v, 0.03);
      const f = new THREE.Group(); f.position.copy(v); f.lookAt(v.clone().multiplyScalar(2));
      for (let k = 0; k < 5; k++) { const pe = mesh(cached('petal', () => new THREE.SphereGeometry(0.013, 10, 8)), petal); const a = k / 5 * TAU; pe.position.set(Math.cos(a) * 0.013, Math.sin(a) * 0.013, 0); pe.scale.set(1, 1, 0.45); f.add(pe); }
      const c = mesh(cached('fmid', () => new THREE.SphereGeometry(0.007, 8, 6)), mid); c.position.z = 0.004; f.add(c);
      const s = i % 2 ? 0.8 : 1.1; f.scale.setScalar(s); grp.add(f);
      const lf = mesh(cached('crownleaf', () => new THREE.SphereGeometry(0.012, 8, 6)), leaf); lf.position.copy(v).multiplyScalar(1.01); lf.position.y -= 0.012; lf.scale.set(1.6, 0.5, 1); grp.add(lf);
    }
    main.push(petal);
  } else if (p.style === 'bucket') {          // bucket hat
    const m = fabric(0.85); m.side = THREE.DoubleSide;
    const P = [[0.0005, 0.118], [0.08, 0.12], [0.14, 0.113], [0.16, 0.095], [0.167, 0.05], [0.172, 0.004], [0.2, -0.016], [0.245, -0.042], [0.256, -0.05], [0.25, -0.056], [0.2, -0.028], [0.168, -0.006]];
    const curve = new THREE.CatmullRomCurve3(P.map(q => V3(q[0], q[1], 0)), false, 'centripetal');
    const prof = []; for (let i = 0; i <= 60; i++) { const q = curve.getPoint(i / 60); prof.push(new THREE.Vector2(Math.max(0.0005, q.x), q.y)); }
    grp.add(mesh(cached('buckethat', () => smoothSeams(new THREE.LatheGeometry(prof, 64))), m));
    const band = mesh(cached('bucketband', () => new THREE.CylinderGeometry(0.17, 0.172, 0.026, 48, 1, true)), fabric(0.5)); band.position.y = 0.016; band.material.side = THREE.DoubleSide; grp.add(band);
    accent.push(band.material);
    grp.position.set(0.0, 0.1, -0.012); grp.rotation.set(-0.12, 0, -0.05);
    main.push(m);
    return { parts: [{ bone: 'headC', obj: grp }], main, inner: [], accent, accentShade: -0.25, fit: { obj: grp, c: [0, 0, 0], r: [0.158, 0.105, 0.158] } };
  } else if (p.style === 'beanie') {          // knit beanie with a pom-pom
    const m = fabric(0.95);
    const shell = mesh(cached('beanie', () => { const g = new THREE.SphereGeometry(0.205, 40, 20, 0, TAU, 0, Math.PI * 0.52); g.scale(1, 0.95, 1.04); return g; }), m); grp.add(shell);
    const cuff = mesh(cached('beaniecuff', () => new THREE.CylinderGeometry(0.21, 0.212, 0.06, 48, 1, true)), m); cuff.position.y = -0.005; grp.add(cuff);
    const pom = mesh(cached('beaniepom', () => new THREE.SphereGeometry(0.05, 18, 14)), fabric(0.95)); pom.position.y = 0.205; grp.add(pom);
    accent.push(pom.material);
    grp.position.set(0.0, 0.05, -0.008); grp.rotation.set(-0.12, 0, 0);
    main.push(m);
    return { parts: [{ bone: 'headC', obj: grp }], main, inner: [], accent, accentShade: 0.45, fit: { obj: grp, c: [0, -0.035, 0], r: [0.195, 0.222, 0.2], blend: 0.035 } };
  } else if (p.style === 'cap') {             // baseball cap
    const m = fabric(0.8);
    const crown = mesh(cached('capcrown', () => { const g = new THREE.SphereGeometry(0.198, 40, 18, 0, TAU, 0, Math.PI * 0.46); g.scale(1, 0.9, 1.05); return g; }), m); grp.add(crown);
    // the visor: a half-ellipse whose straight edge tucks inside the crown, sticking out over the forehead
    const vs = new THREE.Shape(); vs.moveTo(-0.15, 0); vs.absellipse(0, 0, 0.15, 0.2, Math.PI, TAU, false); vs.lineTo(-0.15, 0);
    const visor = mesh(cached('capvisor', () => { const g = new THREE.ExtrudeGeometry(vs, { depth: 0.006, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.003, bevelSegments: 2 }); g.rotateX(-Math.PI / 2); return g; }), m);
    visor.position.set(0, 0.02, 0.09); visor.rotation.x = 0.3; grp.add(visor);
    const btn = mesh(cached('capbtn', () => new THREE.SphereGeometry(0.014, 10, 8)), m); btn.position.y = 0.18; grp.add(btn);
    grp.position.set(0.0, 0.06, -0.012); grp.rotation.set(0.05, 0, 0);
    fit = { obj: grp, c: [0, 0.015, 0], r: [0.186, 0.158, 0.196] };
    main.push(m);
  } else if (p.style === 'royalcrown') {      // gold crown with points and jewels
    const metal = gold(), gem = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.05, metalness: 0.2, emissiveIntensity: 0.25 });
    const velvet = new THREE.MeshStandardMaterial({ color: '#c2336f', roughness: 0.9 });
    const cband = mesh(cached('crownband2', () => new THREE.CylinderGeometry(0.128, 0.122, 0.055, 48, 1, true)), metal); metal.side = THREE.DoubleSide; grp.add(cband);
    const inner = mesh(cached('crownvelvet', () => { const g = new THREE.SphereGeometry(0.124, 32, 12, 0, TAU, 0, Math.PI / 2); g.scale(1, 0.75, 1); return g; }), velvet); inner.position.y = 0.01; grp.add(inner);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU, tall = i % 2 === 0;
      const pt = mesh(cached('crownpt' + tall, () => new THREE.ConeGeometry(0.026, tall ? 0.09 : 0.06, 4)), metal);
      pt.position.set(Math.sin(a) * 0.124, 0.027 + (tall ? 0.045 : 0.03), Math.cos(a) * 0.124); pt.rotation.y = a; grp.add(pt);
      const ball = mesh(cached('crownball', () => new THREE.SphereGeometry(0.011, 10, 8)), metal); ball.position.set(Math.sin(a) * 0.124, 0.027 + (tall ? 0.092 : 0.062), Math.cos(a) * 0.124); grp.add(ball);
      const g = mesh(cached('crowngem', () => new THREE.OctahedronGeometry(0.014, 0)), gem); g.position.set(Math.sin(a) * 0.129, 0.0, Math.cos(a) * 0.129); g.lookAt(Math.sin(a), 0, Math.cos(a)); grp.add(g);
    }
    grp.position.set(0.0, 0.2, -0.01); grp.rotation.set(-0.1, 0, 0.04);
    main.push(gem);
    return { parts: [{ bone: 'headC', obj: grp }], main, inner: [], accent: [], onColor: c => gem.emissive.set(c), fit: { obj: grp, c: [0, -0.0275, 0], r: [0.116, 0.115, 0.116], blend: 0.05 } };
  } else if (p.style === 'party') {           // cone party hat with a pom-pom
    const m = fabric(0.45), white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 });
    const cone = mesh(cached('partycone', () => { const g = new THREE.ConeGeometry(0.075, 0.2, 32, 1, true); g.translate(0, 0.1, 0); return g; }), m); m.side = THREE.DoubleSide; grp.add(cone);
    const pom = mesh(cached('partypom', () => new THREE.SphereGeometry(0.026, 14, 10)), white); pom.position.y = 0.205; grp.add(pom);
    const ruff = mesh(cached('partyruff', () => new THREE.TorusGeometry(0.075, 0.012, 8, 28)), white); ruff.rotation.x = Math.PI / 2; ruff.position.y = 0.005; grp.add(ruff);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, y = 0.05 + (i % 3) * 0.045, r = 0.075 * (1 - y / 0.2) + 0.002; const d = mesh(cached('partydot', () => new THREE.SphereGeometry(0.009, 8, 6)), white); d.position.set(Math.cos(a) * r, y, Math.sin(a) * r); grp.add(d); }
    grp.position.set(0.035, 0.168, 0.0); grp.rotation.set(-0.08, 0, -0.26);
    main.push(m);
  } else if (p.style === 'bows') {            // a pair of big hair bows
    const m = fabric(0.35);
    for (const s of [-1, 1]) { const b = makeBow(m, 1.6); b.position.set(s * 0.12, 0.17, -0.02); b.rotation.set(-0.3, s * 0.9, s * -0.25); grp.add(b); }
    main.push(m);
  }
  return { parts: [{ bone: 'headC', obj: grp }], main, inner: [], accent, fit };
}

/* ---------------- necklaces ---------------- */
export function buildNecklace(p) {
  if (p.style === 'scarf') {                  // chunky knit scarf: a wrap round the neck + two hanging ends
    const m = fabric(0.95), grp = new THREE.Group();
    const r = ringAt(CHEST_KEYS, 0.33);
    const wrap = mesh(cached('scarfwrap', () => { const g = new THREE.TorusGeometry(0.078, 0.034, 14, 40); g.rotateX(Math.PI / 2); g.scale(1.12, 1, 1.05); return g; }), m);
    wrap.position.set(0, 0.338, r.zo + 0.004); grp.add(wrap);
    const end = (x, len, rot) => {
      const e = mesh(cached('scarfend' + len, () => new RoundedBoxGeometry(0.075, len, 0.026, 3, 0.012)), m);
      e.position.set(x, 0.32 - len / 2, r.zo + r.rz + 0.045); e.rotation.set(-0.12, 0, rot); grp.add(e);
      for (let i = 0; i < 6; i++) { const f = mesh(cached('scarffringe', () => new THREE.CylinderGeometry(0.004, 0.003, 0.03, 5)), m); f.position.set(x + (i - 2.5) * 0.012 + Math.sin(rot) * len * 0.5, 0.32 - len - 0.012, r.zo + r.rz + 0.045 - 0.06 * len); grp.add(f); }
    };
    end(0.03, 0.26, 0.06); end(-0.035, 0.2, -0.08);
    return { parts: [{ bone: 'breath', obj: grp }], main: [m], inner: [], accent: [] };
  }
  if (p.style === 'pearls') {
    const mat = pearlMat.clone();
    const n = 30, im = new THREE.InstancedMesh(cached('pearl', () => new THREE.SphereGeometry(1, 14, 10)), mat, n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i + 0.5) / n * TAU, s = Math.sin(a), c = Math.cos(a), front = Math.max(0, c);
      const y = 0.312 - 0.042 * Math.pow(front, 2.2), r = ringAt(CHEST_KEYS, y), rad = 0.0078 + 0.0018 * front;
      const ex = y > 0.32 ? 0.052 : r.rx, ez = y > 0.32 ? 0.046 : r.rz;
      m.compose(V3(s * (ex + rad * 0.75), y, r.zo + c * (ez + rad * 0.75)), q, sc.setScalar(rad)); im.setMatrixAt(i, m);
    }
    return { parts: [{ bone: 'breath', obj: im }], main: [mat], inner: [], accent: [] };
  }
  // pendant: fine gold chain + a puffy heart
  const chain = gold(), heartMat = new THREE.MeshStandardMaterial({ color: '#ff5f9e', roughness: 0.15, metalness: 0.2 });
  const pts = [];
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * TAU, s = Math.sin(a), c = Math.cos(a), front = Math.max(0, c); const y = 0.315 - 0.07 * Math.pow(front, 2), r = ringAt(CHEST_KEYS, y); pts.push(V3(s * (r.rx + 0.006), y, r.zo + c * (r.rz + 0.006))); }
  const grp = new THREE.Group();
  grp.add(mesh(cached('chain', () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 80, 0.0016, 5, true)), chain));
  const hs = new THREE.Shape(); hs.moveTo(0, -0.012); hs.bezierCurveTo(-0.02, 0.0, -0.012, 0.016, 0, 0.007); hs.bezierCurveTo(0.012, 0.016, 0.02, 0.0, 0, -0.012);
  const heart = mesh(cached('heart', () => new THREE.ExtrudeGeometry(hs, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 3 })), heartMat);
  const r = ringAt(CHEST_KEYS, 0.235); heart.position.set(0, 0.233, r.zo + r.rz + 0.008); grp.add(heart);
  return { parts: [{ bone: 'breath', obj: grp }], main: [heartMat], inner: [], accent: [] };
}

/* ---------------- gloves ---------------- */
export function buildGloves() {
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.38 });
  const parts = [];
  for (const S of ['L', 'R']) {
    const pts = [];
    for (let k = 0; k <= 6; k++) { const a = -Math.PI / 2 + k / 6 * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * 0.0332, -0.27 + Math.sin(a) * 0.0332)); }
    for (let j = 1; j <= 12; j++) { const dd = 0.27 - j / 12 * 0.15; pts.push(new THREE.Vector2(crSample(ARM_KEYS, dd)[0] + 0.004 + (j > 10 ? 0.0025 : 0), -dd)); }
    pts[0].x = 1e-4;
    parts.push({ bone: 'uarm' + S, obj: mesh(cached('gloveup', () => smoothSeams(new THREE.LatheGeometry(pts, 28))), mat) });
    parts.push({ bone: 'farm' + S, obj: mesh(cached('glovefa', () => limbLathe(0.235, FARM_KEYS.map(k => [k[0], k[1] + 0.0038]))), mat) });
    const hand = new THREE.Group(), side = S === 'L' ? 1 : -1;
    const hm = mesh(cached('glovehand' + side, () => mittenGeo(-side)), mat); hm.scale.set(1.18, 1.04, 1.12); hand.add(hm);
    const th = mesh(cached('glovethumb', () => limbLathe(0.033, [[0, 0.0105], [0.033, 0.0085]], { segs: 12, samples: 8 })), mat);
    th.position.set(-side * 0.006, -0.022, 0.019); th.rotation.set(0.55, 0, -side * 0.2); hand.add(th);
    parts.push({ bone: 'hand' + S, obj: hand });
  }
  return { parts, main: [mat], inner: [], accent: [] };
}
