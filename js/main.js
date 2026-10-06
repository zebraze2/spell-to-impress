/* Spell to Impress — Level 1.
   Dress phase (6 min): walk the boutique; spell to earn clothes (the first words of each idea are
   "fill the sound"); sort words to open the salon / vanity. Time's up: spell a phrase to walk the runway.
   Runway: every model walks, everyone votes 1–5 stars, top three take the podium, then results + the 80% unlock. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildRoom } from './room.js?v=2271898f';
import { buildDoll, animateDoll } from './doll.js?v=2271898f';
import { LOOKS, LIP_COLORS, lookPreview } from './face.js?v=2271898f';
import { HAIR_STYLES, HAIR_COLORS, hairStyle, hairColor } from './hair.js?v=2271898f';
import { CATALOG, PALETTE, makeItem } from './catalog.js?v=2271898f';
import { PRINTS, TEX } from './textures.js?v=2271898f';
import { makeController, stepDoll, steerDir, collide, WALK_SPEED } from './player.js?v=2271898f';
import { makeRivals, updateRival, person, STARTER } from './ai.js?v=2271898f';
import { makeSession, PASS, MIN_TRIES, loadProgress, saveProgress } from './spell.js?v=2271898f';
import { LEVELS } from './words.js?v=2271898f';
import { buildRunway, makeShow, RW } from './runway.js?v=2271898f';
import { UI } from './ui.js?v=2271898f';

const QS = new URLSearchParams(location.search);
const THEMES = [
  { name: 'Garden Party', tags: ['garden', 'party', 'floral', 'cute', 'summer'], palette: ['#f6a9c4', '#ffb3d0', '#a8e2cc', '#fff2d9', '#c9b3f2', '#86c9e8', '#ffd27a', '#ffffff'] },
  { name: 'Royal Ball', tags: ['royal', 'formal', 'glam', 'elegant', 'party'], palette: ['#24306e', '#c9b3f2', '#ffffff', '#e9c48a', '#f7b6d0', '#9b6ad8', '#e0457b'] },
  { name: 'Beach Day', tags: ['beach', 'summer', 'casual', 'sporty'], palette: ['#86c9e8', '#ffd27a', '#ff9a6a', '#ffffff', '#a8e2cc', '#f06aa0'] },
  { name: 'Cozy Day', tags: ['cozy', 'winter', 'casual', 'school'], palette: ['#c9b3f2', '#7a4a32', '#fff2d9', '#e86a8a', '#3b2a26', '#e9c48a'] },
  { name: 'School Day', tags: ['school', 'casual', 'cute'], palette: ['#7a8fd6', '#ffffff', '#c43b3b', '#ffd27a', '#5b7fc0', '#f6a9c4'] },
];
const THEME = THEMES.find(t => t.name.toLowerCase().replace(/ /g, '') === (QS.get('theme') || '').toLowerCase()) || THEMES[Math.floor(Math.random() * THEMES.length)];
const ROUND = Number(QS.get('seconds')) || 360;      // 6-minute rounds
const LEVEL = 0;

/* ---------------- renderer, scene, lights ---------------- */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#efe1da');
scene.fog = new THREE.Fog('#efdcd8', 12, 32);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.42;
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.05, 60);
function resize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
resize(); addEventListener('resize', resize);

scene.add(new THREE.HemisphereLight('#fff3f4', '#c99a80', 0.9));
const key = new THREE.DirectionalLight('#ffe7d2', 2.2);
key.position.set(-4, 9, 6); key.target.position.set(0, 0, -0.5);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -9.5, right: 9.5, top: 9, bottom: -9, near: 1, far: 26 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight('#ff9fcd', 1.1); rim.position.set(3, 4, -6); scene.add(rim);
const fill = new THREE.DirectionalLight('#e9e2ff', 0.45); fill.position.set(5, 3, 5); scene.add(fill);

/* ---------------- world ---------------- */
const room = buildRoom();
scene.add(room.group);
const colliders = room.colliders;
const hall = buildRunway(THEME);
hall.group.visible = false; scene.add(hall.group);

const ME = person('#efb592', { blush: '#ff7d9b', lash: '#1b0c09', brow: '#4b2b1d', crease: '#9b5a52', nose: '#b4604f' });
const player = buildDoll(ME, { faceRes: 1024 });
player.setHair(hairStyle('waves'), hairColor('brown'));
const starter = Object.fromEntries(STARTER.map(([id, c]) => { const def = CATALOG.find(d => d.id === id); const it = makeItem(def, c, 'solid'); it.starter = true; return [def.slot, it]; }));
for (const it of Object.values(starter)) player.wear(it);
player.root.position.set(room.spawn.x, 0, room.spawn.z); player.root.rotation.y = room.spawn.heading;
scene.add(player.root);

const rivals = makeRivals(scene, room, THEME, 4);
const dolls = [player, ...rivals.map(a => a.d)];

/* contact shadows: soft blobs under every doll */
const blobMat = new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false });
for (const d of dolls) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.6), blobMat); b.rotation.x = -Math.PI / 2; b.position.y = 0.025; b.renderOrder = 1; scene.add(b); d.blob = b; }

/* ---------------- state ---------------- */
const C = makeController(canvas, camera);
C.yaw = room.spawn.heading - Math.PI;
const session = makeSession(LEVEL);
const level = LEVELS[LEVEL];
const earned = new Set(), owned = new Map();
let phase = 'start', remain = ROUND, t = 0, target = null, show = null;
UI.setLevel(level, THEME); UI.setTimer(ROUND); UI.setScore(0, 0);
document.getElementById('startMinutes').textContent = Math.max(1, Math.round(ROUND / 60));
const names = dolls.map((d, i) => i === 0 ? ['You', 'New Model'] : [rivals[i - 1].R.name, rivals[i - 1].R.title]);
const plates = names.map(([n, tt], i) => UI.plate(n, tt, i === 0));
for (const L of LOOKS) L.preview = lookPreview(ME, L, 110);

/* ---------------- helpers ---------------- */
const _v = new THREE.Vector3();
function toScreen(v) {
  _v.copy(v).project(camera);
  return { x: (_v.x + 1) / 2 * innerWidth, y: (1 - _v.y) / 2 * innerHeight, ok: _v.z < 1 && _v.z > -1 && Math.abs(_v.x) < 1.15 && Math.abs(_v.y) < 1.15 };
}
function sparkleAt(d) { const s = toScreen(d.bones.chest.localToWorld(new THREE.Vector3(0, 0.05, 0))); if (s.ok) UI.sparkle(s.x, s.y); }
function faceRoomCentre() { const p = player.root.position; player.root.rotation.y = Math.atan2(-p.x, 0.3 - p.z); }
function ensureBasics(d) {
  if (!d.worn.get('dress')) { if (!d.worn.get('top')) d.wear(starter.top); if (!d.worn.get('bottom')) d.wear(starter.bottom); }
  if (!d.worn.get('shoes')) d.wear(starter.shoes);
}
function openPanel(focus) { C.focus = focus; faceRoomCentre(); }
function closePanel() { C.focus = null; }
const score = () => UI.setScore(session.firstRight, session.firstTries);

function putOn(def) {
  let item = owned.get(def.id);
  if (!item) { item = makeItem(def); owned.set(def.id, item); }
  player.wear(item); ensureBasics(player); sparkleAt(player);
  openPanel({ dist: 3.8, pitch: 0.1, y: 0.86, side: 0.9 });
  UI.colors(item, PALETTE, PRINTS, closePanel);
}
/* each piece of clothing costs one word: a whole dictated word, or (early on) just the new sound */
function spellFor(forName, onEarn, onClose) {
  const { word, retry, fill } = session.next();
  UI.spell(word, 'for the ' + forName, {
    onFirst: right => { session.record(word, right, { retry, fill }); score(); },
    onEarn, onClose,
  }, { mode: fill ? 'fill' : 'word' });
}
function useItem(it) {
  const def = it.def;
  if (earned.has(def.id)) {
    const w = player.worn.get(def.slot);
    if (w && w.def.id === def.id) { player.unequip(w); ensureBasics(player); UI.toast('Took off the ' + def.name.toLowerCase()); }
    else putOn(def);
    return;
  }
  spellFor(def.name.toLowerCase(), () => { earned.add(def.id); putOn(def); });
}
/* the salon chair and the vanity open with a word sort; inside, everything is free.
   While she's there the computer models wait their turn. */
function useStation(it) {
  it.busy = 'player';
  const done = () => { it.busy = null; closePanel(); };
  const open = () => {
    player.styled = true;
    if (it.kind === 'hair') {
      openPanel({ dist: 1.7, pitch: 0.08, y: 1.55, side: 0.38 });
      UI.hair(HAIR_STYLES, HAIR_COLORS, { style: player.hairStyle, color: player.hairColor }, cur => { player.setHair(cur.style, cur.color); }, done);
    } else {
      openPanel({ dist: 0.95, pitch: 0.03, y: 1.66, side: 0.2 });
      UI.makeup(LOOKS, LIP_COLORS, { look: player.look, lip: player.lip }, cur => player.setLook(cur.look, cur.lip), done);
    }
  };
  UI.sort('Sort the words to open the ' + (it.kind === 'hair' ? 'hair salon' : 'makeup vanity'), level.ideas, session.sortSet(), ok => { if (ok) open(); else it.busy = null; });
}
function use(it) {
  if (!it || UI.busy || phase !== 'dress') return;
  if (it.kind === 'item') useItem(it);
  else if (it.kind === 'hair' || it.kind === 'makeup') useStation(it);
  else if (it.kind === 'door') UI.toast('The runway opens when the timer runs out!');
}
function findTarget() {
  const p = player.root.position, h = player.root.rotation.y, fx = Math.sin(h), fz = Math.cos(h);
  let best = null, bestS = Infinity;
  for (const it of room.interact) {
    const dx = it.at.x - p.x, dz = it.at.z - p.z, d = Math.hypot(dx, dz);
    if (d > 1.9) continue;
    const dot = (dx * fx + dz * fz) / (d || 1);
    if (dot < 0.2) continue;
    const s = d + (1 - dot) * 0.9;
    if (s < bestS) { bestS = s; best = it; }
  }
  return best;
}
function walkTo(it) {
  C.moveTo = { x: it.approach.x, z: it.approach.z, heading: it.approach.heading };
  C.onArrive = () => use(it);
}

/* clicks: on a thing -> walk there and use it; on the floor -> walk there */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const pickRoots = room.interact.map(it => it.obj);
C.clickHandler = e => {
  if (UI.busy || phase !== 'dress') return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(pickRoots, true)[0];
  if (hit) {
    let o = hit.object; while (o && !pickRoots.includes(o)) o = o.parent;
    const it = room.interact.find(x => x.obj === o);
    if (it) { walkTo(it); return; }
  }
  const fh = ray.intersectObject(room.group.getObjectByName('floor'))[0];
  if (fh) { C.moveTo = { x: fh.point.x, z: fh.point.z }; C.onArrive = null; }
};
addEventListener('keydown', e => {
  if (UI.busy || e.target.tagName === 'INPUT') return;
  if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && target) { e.preventDefault(); use(target); }
});
document.getElementById('bubble').addEventListener('click', () => use(target));

/* ---------------- round flow ---------------- */
function startRound() {
  phase = 'dress'; remain = ROUND; UI.setTimer(ROUND);
  setTimeout(() => document.getElementById('help').classList.add('gone'), 12000);
}
/* time's up: once any open card is finished, spell a phrase to walk the runway */
function phraseForRunway() {
  phase = 'phrase'; C.moveTo = null; C.focus = null;
  if (level.phrases && level.phrases.length) {          // later levels: a short phrase
    const p = session.phrase();
    UI.spell(null, 'Time\'s up! Spell this to walk the runway', {
      onFirst: right => { session.recordPhrase(right); score(); },
      onEarn: startShow, noCancel: true,
    }, { mode: 'phrase', phrase: p, words: level.words });
  } else {                                               // Level 1: one word that uses both ideas
    const w = session.capstone();
    UI.spell(w, 'Time\'s up! Spell one more word to walk the runway', {
      onFirst: right => { session.record(w, right); score(); },
      onEarn: startShow, noCancel: true,
    }, { mode: 'word' });
  }
}
function startShow() {
  phase = 'show';
  room.group.visible = false; hall.group.visible = true;
  for (const p of plates) p.style.visibility = 'hidden';
  document.getElementById('level').style.display = 'none'; document.getElementById('banner').style.display = 'none';
  scene.background.set('#2b1426'); scene.fog.color.set('#2b1426'); scene.fog.near = 18; scene.fog.far = 40;
  key.castShadow = false;
  show = makeShow({
    hall, camera, theme: THEME,
    models: dolls.map((d, i) => ({ d, name: names[i][0], mine: i === 0, i })),
    ui: { bar: UI.runwayBar, time: UI.voteTime, hideBar: UI.runwayHide },
    finish: results,
  });
}
const ordinal = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || 'th');
function results(ranked) {
  phase = 'podium';
  // nameplates over the podium: name + stars
  ranked.forEach((r, k) => {
    const el = plates[r.m.i];
    el.innerHTML = `<div class="n">${r.m.name}<span class="stars-avg">★ ${r.avg.toFixed(1)}</span></div><div class="tt">${ordinal(k + 1)} place</div>`;
  });
  const place = ranked.findIndex(r => r.m.mine) + 1, mine = ranked[place - 1];
  setTimeout(() => {
    phase = 'results';
    session.save();
    const pct = Math.round(session.score() * 100), enough = session.firstTries >= MIN_TRIES, pass = enough && session.score() >= PASS;
    if (pass) { const p = loadProgress(); p.unlocked = Math.max(p.unlocked || 1, LEVEL + 2); saveProgress(p); }
    const title = place === 1 ? 'You won 1st place!' : place <= 3 ? `You placed ${ordinal(place)}!` : `You placed ${ordinal(place)}`;
    const text = `The judges gave your ${THEME.name} look <b>★ ${mine.avg.toFixed(1)}</b>.<br>You spelled <b>${session.firstRight}</b> of <b>${session.firstTries}</b> right on the first try: <b>${pct}%</b>.`;
    const next = pass ? `You unlocked the <b>${LEVELS[LEVEL + 1].wing}</b>! Level 2 is coming next.`
      : !enough ? `Spell at least ${MIN_TRIES} words in a round (and get 80% right) to unlock the next wing.`
      : 'Spell 80% right on the first try to unlock the next wing. You can do it!';
    UI.end(title, text, next, [['Play again', () => location.reload()]]);
  }, 3200);
}
UI.start(level, THEME, startRound);
if (QS.has('skipstart')) document.getElementById('startGo').click();

/* ---------------- loop ---------------- */
const _dir = new THREE.Vector3(), _goal = new THREE.Vector3();
let last = performance.now(), shownSec = ROUND, frames = 0;
function separate() {
  for (let i = 0; i < dolls.length; i++) for (let j = i + 1; j < dolls.length; j++) {
    const a = dolls[i].root.position, b = dolls[j].root.position, dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), m = 0.56;
    if (d < m && d > 1e-4) { const k = (m - d) / d / 2; a.x -= dx * k; a.z -= dz * k; b.x += dx * k; b.z += dz * k; }
  }
  for (const d of dolls) collide(d.root.position, 0.26, colliders);
}
function boutique(dt) {
  let moving = false;
  if (phase === 'dress' && !UI.busy) {
    const kd = C.keyDir(_dir);
    if (kd) { C.moveTo = null; C.onArrive = null; moving = stepDoll(player, kd, WALK_SPEED, dt, colliders) > 1e-4; }
    else if (C.moveTo) {
      const p = player.root.position, dist = Math.hypot(C.moveTo.x - p.x, C.moveTo.z - p.z);
      if (dist < 0.1) {
        if (C.moveTo.heading !== undefined) player.root.rotation.y = C.moveTo.heading;
        const f = C.onArrive; C.moveTo = null; C.onArrive = null; if (f) f();
      } else {
        _goal.set(C.moveTo.x, 0, C.moveTo.z); steerDir(p, _goal, colliders, _dir);
        const moved = stepDoll(player, _dir, WALK_SPEED * Math.min(1, dist / 0.4 + 0.3), dt, colliders);
        moving = moved > 1e-4;
        C.stuck = moved < dt * 0.25 ? (C.stuck || 0) + dt : 0;          // only give up after being truly stuck
        if (C.stuck > 0.8) { C.moveTo = null; C.onArrive = null; C.stuck = 0; }
      }
    }
  }
  player.anim.speed += ((moving ? 1 : 0) - player.anim.speed) * (1 - Math.exp(-dt * 10));
  if (phase === 'dress') for (const a of rivals) { const ev = updateRival(a, room, dt, t, colliders); if (ev) sparkleAt(ev.doll); }
  else for (const a of rivals) a.d.anim.speed *= Math.exp(-dt * 8);
  separate();
  for (const d of dolls) { d.blob.position.x = d.root.position.x; d.blob.position.z = d.root.position.z; }
  // timer: when it runs out, wait for any open card, then the runway phrase
  if (phase === 'dress') {
    remain -= dt;
    const s = Math.max(0, Math.ceil(remain));
    if (s !== shownSec) { shownSec = s; UI.setTimer(s); if (s === 60) UI.toast('One minute left!'); }
    if (remain <= 0) { phase = 'timeup'; UI.toast('Time\'s up!'); }
  }
  if (phase === 'timeup' && !UI.busy) { C.focus = null; phraseForRunway(); }
  C.updateCamera(player.root.position, player.root.rotation.y, dt);
  scene.updateMatrixWorld();
  target = phase === 'dress' && !UI.busy && !moving ? findTarget() : null;
  if (target) {
    const s = toScreen(_v.set(target.at.x, target.top, target.at.z).clone());
    const label = target.kind === 'item' ? (earned.has(target.def.id) ? (player.worn.get(target.def.slot)?.def.id === target.def.id ? 'Take off' : 'Put on') : 'Spell it!')
      : target.kind === 'hair' ? 'Hair salon' : target.kind === 'makeup' ? 'Makeup' : 'Runway';
    UI.bubble(s, label, target.kind === 'item' && earned.has(target.def.id));
  } else UI.bubble(null);
  dolls.forEach((d, i) => {
    const far = d.root.position.distanceTo(camera.position) > 11;
    const s = toScreen(d.bones.headC.localToWorld(_v.set(0, 0.34, 0)));
    if (far || C.focus || s.y < 118) s.ok = false;      // never under the theme banner
    UI.pin(plates[i], s);
  });
}
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = Math.max(last, now); t += dt;
  if (show) {
    show.update(dt, t);
    scene.updateMatrixWorld();
    if (phase === 'podium' || phase === 'results') dolls.forEach((d, i) => UI.pin(plates[i], d.root.visible ? toScreen(d.bones.headC.localToWorld(_v.set(0, 0.36, 0))) : { ok: false }));
    UI.bubble(null);
  } else boutique(dt);
  for (const d of dolls) if (d.root.visible) animateDoll(d, t, dt);
  renderer.render(scene, camera);
  if (++frames === 2) UI.loaded();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__game = { scene, camera, player, rivals, room, session, C, UI, earned, get phase() { return phase; }, get show() { return show; }, THEME };
