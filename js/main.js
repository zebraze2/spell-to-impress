/* Spell to Impress — step 1: walk the boutique, spell to earn clothes, dress up, recolour,
   hair + makeup, while computer models shop for the same theme. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildRoom, ROOM } from './room.js';
import { buildDoll, animateDoll } from './doll.js';
import { LOOKS, LIP_COLORS, lookPreview } from './face.js';
import { HAIR_STYLES, HAIR_COLORS, hairStyle, hairColor } from './hair.js';
import { CATALOG, PALETTE, makeItem } from './catalog.js';
import { PRINTS, TEX } from './textures.js';
import { makeController, stepDoll, steerDir, collide, WALK_SPEED } from './player.js';
import { makeRivals, updateRival, person, STARTER } from './ai.js';
import { makeSession, PASS, loadProgress, saveProgress } from './spell.js';
import { LEVELS } from './words.js';
import { UI } from './ui.js';

const QS = new URLSearchParams(location.search);
const THEME = { name: 'Garden Party', tags: ['garden', 'party', 'floral', 'cute', 'summer'], palette: ['#f6a9c4', '#ffb3d0', '#a8e2cc', '#fff2d9', '#c9b3f2', '#86c9e8', '#ffd27a', '#ffffff'] };
const ROUND = Number(QS.get('seconds')) || 600;
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

const ME = person('#efb592', { blush: '#ff7d9b', lash: '#1b0c09', brow: '#4b2b1d', crease: '#9b5a52', nose: '#b4604f' });
const player = buildDoll(ME, { faceRes: 1024 });
player.setHair(hairStyle('waves'), hairColor('brown'));
const starter = Object.fromEntries(STARTER.map(([id, c]) => { const def = CATALOG.find(d => d.id === id); return [def.slot, makeItem(def, c, 'solid')]; }));
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
const earned = new Set(), owned = new Map();
let phase = 'start', remain = ROUND, t = 0, target = null;
UI.setLevel(LEVELS[LEVEL], THEME); UI.setTimer(ROUND); UI.setScore(0, 0);
const plates = dolls.map((d, i) => i === 0 ? UI.plate('You', 'New Model', true) : UI.plate(rivals[i - 1].R.name, rivals[i - 1].R.title));
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

function putOn(def) {
  let item = owned.get(def.id);
  if (!item) { item = makeItem(def); owned.set(def.id, item); }
  player.wear(item); ensureBasics(player); sparkleAt(player);
  openPanel({ dist: 3.8, pitch: 0.1, y: 0.86, side: 0.9 });
  UI.colors(item, PALETTE, PRINTS, closePanel);
}
function useItem(it) {
  const def = it.def;
  if (earned.has(def.id)) {
    const w = player.worn.get(def.slot);
    if (w && w.def.id === def.id) { player.unequip(w); ensureBasics(player); UI.toast('Took off the ' + def.name.toLowerCase()); }
    else putOn(def);
    return;
  }
  const { word, retry } = session.next();
  UI.spell(word, def.name.toLowerCase(), {
    onFirst: right => { session.record(word, right, retry); UI.setScore(session.firstRight, session.firstTries); },
    onEarn: () => { earned.add(def.id); putOn(def); },
  });
}
function use(it) {
  if (!it || UI.busy || phase !== 'dress') return;
  if (it.kind === 'item') useItem(it);
  else if (it.kind === 'hair') {
    openPanel({ dist: 1.7, pitch: 0.08, y: 1.55, side: 0.38 });
    UI.hair(HAIR_STYLES, HAIR_COLORS, { style: player.hairStyle, color: player.hairColor }, cur => { player.setHair(cur.style, cur.color); }, closePanel);
  } else if (it.kind === 'makeup') {
    openPanel({ dist: 0.95, pitch: 0.03, y: 1.66, side: 0.2 });
    UI.makeup(LOOKS, LIP_COLORS, { look: player.look, lip: player.lip }, cur => player.setLook(cur.look, cur.lip), closePanel);
  } else if (it.kind === 'door') UI.toast('The runway opens when the timer runs out!');
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

/* ---------------- round ---------------- */
function startRound() {
  phase = 'dress'; remain = ROUND; UI.setTimer(ROUND);
  setTimeout(() => document.getElementById('help').classList.add('gone'), 12000);
}
function endRound() {
  phase = 'end'; session.save();
  const pct = Math.round(session.score() * 100), pass = session.firstTries > 0 && session.score() >= PASS;
  if (pass) { const p = loadProgress(); p.unlocked = Math.max(p.unlocked || 1, LEVEL + 2); saveProgress(p); }
  const next = LEVELS[LEVEL + 1];
  UI.end(`You spelled <b>${session.firstRight}</b> of <b>${session.firstTries}</b> words right on the first try: <b>${pct}%</b>.`,
    (pass ? `You unlocked the <b>${next.wing}</b>!` : `You need 80% to unlock the next wing. Play the ${LEVELS[LEVEL].wing} again!`) + '<br><br>(The runway, voting and podium come in the next step.)',
    () => location.reload());
}
UI.start(LEVELS[LEVEL], THEME, startRound);
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
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = Math.max(last, now); t += dt;
  // player movement
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
        if (!moving) { C.moveTo = null; C.onArrive = null; }
      }
    }
  }
  player.anim.speed += ((moving ? 1 : 0) - player.anim.speed) * (1 - Math.exp(-dt * 10));
  // computer models
  if (phase === 'dress') for (const a of rivals) { const ev = updateRival(a, room, dt, t, colliders); if (ev) sparkleAt(ev.doll); }
  separate();
  for (const d of dolls) { animateDoll(d, t, dt); d.blob.position.x = d.root.position.x; d.blob.position.z = d.root.position.z; }
  // timer
  if (phase === 'dress') {
    remain -= dt;
    const s = Math.max(0, Math.ceil(remain));
    if (s !== shownSec) { shownSec = s; UI.setTimer(s); if (s === 60) UI.toast('One minute left!'); }
    if (remain <= 0) endRound();
  }
  // camera, then everything pinned to the screen
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
  renderer.render(scene, camera);
  if (++frames === 2) UI.loaded();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__game = { scene, camera, player, rivals, room, session, C, UI, earned };
