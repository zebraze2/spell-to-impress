/* The runway show: a separate hall, every model walks, the others vote 1–5 stars, top three take the podium. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TAU, rng, canvasTex, V3, lerp, smooth } from './util.js';
import { TEX } from './textures.js';
import { M } from './props.js';

export const RW = { x: 60, z: 0, top: 0.3, start: -7.4, end: 3.4 };     // hall origin, runway height, walk path (z)

function signTex(text, sub) {
  return canvasTex(1024, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff9fcb'); gr.addColorStop(1, '#e2488b');
    g.fillStyle = gr; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 60); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 6; g.setLineDash([18, 12]); g.beginPath(); g.roundRect(28, 28, w - 56, h - 56, 44); g.stroke();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '600 54px Fredoka, sans-serif'; g.fillText(sub, w / 2, 86);
    g.font = '700 84px Fredoka, sans-serif'; g.fillText(text, w / 2, 168);
  });
}
function numberTex(n) {
  return canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#fff6fa'; g.fillRect(0, 0, w, w);
    g.fillStyle = ['#e9b949', '#c9cfd8', '#d99a6c'][n - 1]; g.font = '700 190px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), w / 2, w / 2 + 12);
  });
}

export function buildRunway(theme) {
  const g = new THREE.Group(); g.position.set(RW.x, 0, RW.z);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 24), new THREE.MeshStandardMaterial({ color: '#4a2440', roughness: 0.4, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -1; floor.receiveShadow = true; g.add(floor);
  // the catwalk
  const len = RW.end - RW.start + 2.4, cz = (RW.end + RW.start) / 2 + 0.3;
  const walk = new THREE.Mesh(new RoundedBoxGeometry(2.2, RW.top, len, 3, 0.06), new THREE.MeshStandardMaterial({ color: '#f9cfe0', roughness: 0.18, metalness: 0.05 }));
  walk.position.set(0, RW.top / 2, cz); walk.receiveShadow = true; g.add(walk);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, len - 0.4), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, transparent: true, opacity: 0.55 }));
  stripe.rotation.x = -Math.PI / 2; stripe.position.set(0, RW.top + 0.003, cz); g.add(stripe);
  const bulb = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffe1b8', emissiveIntensity: 2 });
  for (let z = RW.start - 0.6; z <= RW.end + 0.9; z += 0.55) for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), bulb); b.position.set(s * 1.13, RW.top - 0.06, z); g.add(b); }
  // back wall with an entrance arch + theme sign
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 7), new THREE.MeshStandardMaterial({ color: '#f3dce6', map: TEX.damask, roughness: 0.9 }));
  wall.position.set(0, 3.5, RW.start - 1.6); g.add(wall);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.12, 14, 48, Math.PI), M.white); arch.position.set(0, 2.9, RW.start - 1.5); g.add(arch);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new RoundedBoxGeometry(0.26, 2.9, 0.26, 2, 0.05), M.white); p.position.set(s * 1.25, 1.45, RW.start - 1.5); g.add(p); }
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.9), new THREE.MeshStandardMaterial({ color: '#c2336f', roughness: 0.8 }));
  curtain.position.set(0, 1.95, RW.start - 1.58); g.add(curtain);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), new THREE.MeshStandardMaterial({ map: signTex(theme.name, 'Theme'), emissive: '#ff9fcb', emissiveIntensity: 0.25 }));
  sign.position.set(0, 5.0, RW.start - 1.55); g.add(sign);
  for (const x of [-6, -3.4, 3.4, 6]) { const c = new THREE.Mesh(new RoundedBoxGeometry(0.5, 4.8, 0.3, 2, 0.06), M.white); c.position.set(x, 2.4, RW.start - 1.5); g.add(c); }
  // audience chairs both sides
  const chairMat = new THREE.MeshStandardMaterial({ color: '#f4a9c4', roughness: 0.75 });
  for (const s of [-1, 1]) for (let row = 0; row < 2; row++) for (let z = RW.start + 1; z < RW.end + 1; z += 1.1) {
    const ch = new THREE.Group();
    const seat = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.12, 0.5, 2, 0.04), chairMat); seat.position.y = 0.45; ch.add(seat);
    const back = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.55, 0.1, 2, 0.04), chairMat); back.position.set(0, 0.75, -0.22); ch.add(back);
    for (const lx of [-0.2, 0.2]) for (const lz of [-0.2, 0.2]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), M.gold); l.position.set(lx, 0.22, lz); ch.add(l); }
    ch.position.set(s * (2.4 + row * 0.8), 0, z); ch.rotation.y = -s * Math.PI / 2; g.add(ch);
  }
  // spot lamps along the front
  for (const [x, z] of [[-2.0, 2.6], [2.0, 2.6], [-2.0, -2.5], [2.0, -2.5]]) {
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.4, 10), M.chrome); pole.position.y = 0.7; lamp.add(pole);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.3, 16), M.chrome); head.position.y = 1.45; head.rotation.x = 0.7; lamp.add(head);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: '#fff2dc', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(0.9, 0.9, 1); glow.position.set(0, 1.5, 0.12); lamp.add(glow);
    lamp.position.set(x, 0, z); lamp.rotation.set(0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0); g.add(lamp);
  }
  // podium (shown at the end)
  const podium = new THREE.Group(); podium.visible = false;
  const spots = [];
  [[2, -1.05, 0.42], [1, 0, 0.62], [3, 1.05, 0.3]].forEach(([n, x, h]) => {
    const block = new THREE.Mesh(new RoundedBoxGeometry(1.0, h, 0.9, 3, 0.05), [M.white, M.white, M.white, M.white, new THREE.MeshStandardMaterial({ map: numberTex(n) }), M.white]);
    block.position.set(x, RW.top + h / 2, RW.end - 0.2); podium.add(block);
    spots[n - 1] = V3(RW.x + x, RW.top + h, RW.z + RW.end - 0.2);
  });
  g.add(podium);
  // light for the hall (warm key + pink fill), no shadows needed
  const key = new THREE.SpotLight('#fff1e2', 60, 30, 0.55, 0.6, 1.6); key.position.set(0, 9, RW.end + 6); key.target.position.set(0, 1, RW.end - 3); g.add(key, key.target);
  const pink = new THREE.PointLight('#ff8fc0', 18, 20, 1.6); pink.position.set(0, 4, RW.start); g.add(pink);
  // confetti
  const N = 260, cg = new THREE.BufferGeometry(), cp = new Float32Array(N * 3), cc = new Float32Array(N * 3), cv = [];
  const r = rng(77), cols = ['#ff6fa8', '#ffd54a', '#8fd3c7', '#c9b3f2', '#ffffff', '#86c9e8'].map(c => new THREE.Color(c));
  for (let i = 0; i < N; i++) { cv.push([(r() - 0.5) * 0.6, -0.6 - r() * 0.8, r() * TAU]); const c = cols[i % cols.length]; cc.set([c.r, c.g, c.b], i * 3); }
  cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); cg.setAttribute('color', new THREE.BufferAttribute(cc, 3));
  const confetti = new THREE.Points(cg, new THREE.PointsMaterial({ size: 0.07, vertexColors: true }));
  confetti.visible = false; g.add(confetti);
  const resetConfetti = () => { for (let i = 0; i < N; i++) cp.set([(r() - 0.5) * 6, 4 + r() * 4, RW.end - 1.5 + (r() - 0.5) * 3], i * 3); cg.attributes.position.needsUpdate = true; };
  const tickConfetti = (dt, t) => {
    for (let i = 0; i < N; i++) { const v = cv[i]; cp[i * 3] += (v[0] + Math.sin(t * 2 + v[2]) * 0.3) * dt; cp[i * 3 + 1] += v[1] * dt; if (cp[i * 3 + 1] < 0) cp[i * 3 + 1] = 4 + Math.random() * 2; }
    cg.attributes.position.needsUpdate = true;
  };
  return { group: g, podium, spots, confetti, resetConfetti, tickConfetti };
}

/* ---------------- judging ---------------- */
/* 0..1: how well an outfit fits the theme (more on-theme pieces, a complete look, theme colours) */
export function outfitScore(d, theme) {
  const worn = [...d.worn.values()].filter(it => !it.starter);
  let s = 0;
  for (const it of worn) {
    const m = it.def.tags.filter(t => theme.tags.includes(t)).length;
    s += 0.5 + Math.min(3, m);
    if (theme.palette.includes(it.color)) s += 0.3;
  }
  const has = slot => worn.some(it => it.slot === slot);
  if (has('dress') || (has('top') && has('bottom'))) s += 1.5;
  if (has('shoes')) s += 0.6;
  if (has('head')) s += 0.6;
  if (has('neck')) s += 0.4;
  if (d.styled) s += 0.6;               // visited the salon / vanity
  return 1 - Math.exp(-s / 6.5);
}
export function judgeStars(score, r = Math.random) {
  return Math.max(1, Math.min(5, Math.round(1 + 4 * score + (r() - 0.5) * 1.6)));
}

/* ---------------- the show director ---------------- */
/* models: [{ d, name, mine }]; calls ui hooks; finish(results) when the podium is done */
export function makeShow({ hall, camera, models, theme, ui, finish }) {
  const order = models.slice().sort(() => Math.random() - 0.5);
  const votes = new Map(models.map(m => [m, []]));
  const scores = new Map(models.map(m => [m, outfitScore(m.d, theme)]));
  for (const m of models) { m.d.root.visible = false; if (m.d.blob) m.d.blob.visible = false; }
  let i = -1, cur = null, t = 0, stage = 'next', playerVote = 0, poseWant = null, poseT = 0, twirl = 0, podiumT = 0;
  const camLook = V3(RW.x, 1.4, RW.z), camPos = V3(RW.x, 1.75, RW.z + RW.end + 6.2);
  const walkSpeed = 1.7;
  function begin() {
    i++;
    if (i >= order.length) { stage = 'podium'; podiumT = 0; return toPodium(); }
    cur = order[i]; t = 0; stage = 'walk'; playerVote = 0; poseWant = null; twirl = 0;
    const d = cur.d; d.root.visible = true; if (d.blob) d.blob.visible = true;
    d.root.position.set(RW.x, RW.top, RW.z + RW.start); d.root.rotation.y = 0;
    d.anim.speed = 1; d.anim.reach = 0; d.anim.wave = 0;
    ui.bar(theme.name, cur.name, cur.mine, n => { playerVote = n; }, p => { poseWant = p; if (stage === 'pose') startPose(p); });
  }
  function startPose(p) {
    const d = cur.d; poseT = 0;
    d.anim.wave = 0; twirl = 0;
    if (p === 'wave') d.anim.waveT = 1.4;
    if (p === 'twirl') twirl = 0.0001;
  }
  function settleVotes() {
    const list = votes.get(cur), r = Math.random;
    for (const judge of models) {
      if (judge === cur) continue;
      if (judge.mine) { if (playerVote) list.push(playerVote); continue; }
      list.push(judgeStars(scores.get(cur), r));
    }
  }
  function toPodium() {
    ui.hideBar();
    const boost = new Map();
    const avg = m => { if (boost.has(m)) return boost.get(m); const v = votes.get(m); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 1; };
    const ranked = models.slice().sort((a, b) => avg(b) - avg(a) || scores.get(b) - scores.get(a));
    // she always makes the podium: if the votes put her 4th or 5th, she edges just past 3rd place
    const me = ranked.findIndex(m => m.mine);
    if (me > 2) {
      const mine = ranked.splice(me, 1)[0];
      boost.set(mine, Math.min(5, Math.round((avg(ranked[2]) + 0.1 + Math.random() * 0.3) * 10) / 10));
      ranked.splice(2, 0, mine);
      ranked.sort((a, b) => avg(b) - avg(a) || (b.mine ? 1 : 0) - (a.mine ? 1 : 0));   // stars and places always agree
    }
    hall.podium.visible = true; hall.confetti.visible = true; hall.resetConfetti();
    ranked.slice(0, 3).forEach((m, k) => {
      const d = m.d, p = hall.spots[k]; d.root.visible = true; if (d.blob) d.blob.visible = false;
      d.root.position.copy(p); d.root.rotation.y = 0; d.anim.speed = 0; d.anim.wave = 0;
    });
    for (const m of ranked.slice(3)) m.d.root.visible = false;
    stage = 'podium';
    cur = null;
    setTimeout(() => finish(ranked.map(m => ({ m, avg: avg(m), score: scores.get(m) }))), 4200);
  }
  const update = (dt, time) => {
    if (stage === 'next') begin();
    if (cur) {
      const d = cur.d; t += dt;
      if (stage === 'walk') {
        d.root.position.z += walkSpeed * dt; d.anim.speed = 1; d.anim.phase += walkSpeed * dt * TAU / 1.15;
        if (d.root.position.z >= RW.z + RW.end) { d.root.position.z = RW.z + RW.end; stage = 'pose'; poseT = 0; startPose(poseWant || (cur.mine ? 'hip' : ['hip', 'wave', 'twirl'][Math.floor(Math.random() * 3)])); }
      } else if (stage === 'pose') {
        d.anim.speed = Math.max(0, d.anim.speed - dt * 4); poseT += dt;
        if (d.anim.waveT > 0) { d.anim.waveT -= dt; d.anim.wave = Math.min(1, d.anim.wave + dt * 4); } else d.anim.wave = Math.max(0, d.anim.wave - dt * 4);
        if (twirl > 0) { twirl += dt / 1.1; d.root.rotation.y = smooth(0, 1, Math.min(1, twirl)) * TAU; if (twirl >= 1) { twirl = 0; d.root.rotation.y = 0; } }
        if (poseT > 2.6) { settleVotes(); stage = 'back'; ui.hideBar(); }
      } else if (stage === 'back') {
        d.anim.wave = 0;
        d.root.rotation.y += (Math.PI - d.root.rotation.y) * (1 - Math.exp(-dt * 8));
        if (Math.abs(Math.PI - d.root.rotation.y) < 0.3) { d.root.position.z -= walkSpeed * 1.2 * dt; d.anim.speed = 1; d.anim.phase += walkSpeed * 1.2 * dt * TAU / 1.15; }
        if (d.root.position.z < RW.z + RW.end - 3.2) { d.root.visible = false; if (d.blob) d.blob.visible = false; stage = 'next'; }
      }
      if (d.blob) { d.blob.position.set(d.root.position.x, RW.top + 0.02, d.root.position.z); }
      const left = Math.max(0, Math.ceil((RW.end - RW.start) / walkSpeed + 2.6 - t));
      if (!cur.mine && stage !== 'back') ui.time(left);
      camLook.lerp(V3(d.root.position.x, RW.top + 1.25, d.root.position.z), 1 - Math.exp(-dt * 4));
      camPos.lerp(V3(RW.x, 1.85, Math.min(RW.z + RW.end + 6.2, d.root.position.z + 6.5)), 1 - Math.exp(-dt * 2));
    } else if (stage === 'podium') {
      podiumT += dt; hall.tickConfetti(dt, time);
      camLook.lerp(V3(RW.x, RW.top + 1.35, RW.z + RW.end - 0.2), 1 - Math.exp(-dt * 3));
      camPos.lerp(V3(RW.x, 2.0, RW.z + RW.end + 4.6), 1 - Math.exp(-dt * 2));
    }
    camera.position.copy(camPos); camera.lookAt(camLook);
  };
  return { update, models };
}
