/* Computer models: they plan an outfit for the theme, walk to shelves, browse, put things on,
   and drop by the salon chair and the vanity. */
import * as THREE from 'three';
import { rng, shade } from './util.js';
import { buildDoll } from './doll.js';
import { LOOKS } from './face.js';
import { HAIR_STYLES, HAIR_COLORS, hairStyle, hairColor } from './hair.js';
import { CATALOG, makeItem } from './catalog.js';
import { stepDoll, steerDir } from './player.js';

export function person(skin, o = {}) {
  return {
    skin, blush: '#ff7d9b', crease: shade(skin, -0.42), lash: '#1b0c09', nose: shade(skin, -0.3),
    brow: o.brow || '#4b2b1d', iris: o.iris || ['#8e5d35', '#57321a', '#2c170b', '#b8834f'], ...o,
  };
}
export const RIVALS = [
  { name: 'Aria', title: 'Fashion Maven', style: ['glam', 'formal', 'royal'], person: person('#7b4631', { brow: '#2a160e', iris: ['#8a5a34', '#4d2c15', '#26140a', '#b07a45'] }), hair: ['buns', 'platinum'], look: 'glam' },
  { name: 'Mia', title: 'Runway Queen', style: ['cute', 'coquette', 'school'], person: person('#f6cfb4', { brow: '#8a3a1c', iris: ['#6fae8a', '#3f7a5a', '#1f3b2c', '#a8d8b8'] }), hair: ['ponytail', 'red'], look: 'natural' },
  { name: 'Zoe', title: 'Aspiring Model', style: ['casual', 'sporty', 'summer'], person: person('#c98c64', { brow: '#1a1210', iris: ['#6a4a2e', '#3e2a18', '#1e140a', '#9a7a52'] }), hair: ['bob', 'black'], look: 'berry' },
  { name: 'Lila', title: 'Style Star', style: ['elegant', 'floral', 'beach'], person: person('#e9b08c', { brow: '#7a5a34', iris: ['#6a9ad8', '#3e6aa8', '#1e3458', '#a8c8f0'] }), hair: ['waves', 'blonde'], look: 'sparkle' },
];
export const STARTER = [['tee', '#f4f0ee'], ['shorts', '#d9d3cf'], ['sneakers', '#ffffff']];

export function dressStarter(d) { for (const [id, c] of STARTER) { const it = makeItem(CATALOG.find(x => x.id === id), c, 'solid'); it.starter = true; d.wear(it); } }

/* choose an outfit that suits the theme (with some personality/randomness) */
function planOutfit(theme, r, style = []) {
  // theme fit + her personal style + a dash of randomness; then a random pick among her top three
  const score = def => def.tags.filter(t => theme.tags.includes(t)).length * 1.2 + def.tags.filter(t => style.includes(t)).length * 1.5 + r() * 2.5;
  const best = slot => {
    const ranked = CATALOG.filter(d => d.slot === slot).map(d => [d, score(d)]).sort((a, b) => b[1] - a[1]);
    const k = r(); return ranked[Math.min(ranked.length - 1, k < 0.55 ? 0 : k < 0.85 ? 1 : 2)][0];
  };
  const plan = [];
  if (r() < 0.55) plan.push(best('dress')); else plan.push(best('top'), best('bottom'));
  plan.push(best('shoes'));
  if (r() < 0.85) plan.push(best('head'));
  if (r() < 0.6) plan.push(best('neck'));
  if (r() < 0.25) plan.push(best('hands'));
  const steps = plan.map(def => ({ kind: 'item', def }));
  if (r() < 0.7) steps.splice(Math.floor(r() * steps.length), 0, { kind: 'hair' });
  if (r() < 0.6) steps.splice(Math.floor(r() * steps.length), 0, { kind: 'makeup' });
  return steps;
}

export function makeRivals(scene, room, theme, count = 4) {
  const rivals = [];
  RIVALS.slice(0, count).forEach((R, i) => {
    const d = buildDoll(R.person, { faceRes: 512 });
    d.setLook(LOOKS.find(l => l.id === R.look));
    d.setHair(hairStyle(R.hair[0]), hairColor(R.hair[1]));
    dressStarter(d);
    const w = room.wander[(i * 2 + 1) % room.wander.length];
    d.root.position.set(w.x, 0, w.z); d.root.rotation.y = Math.random() * 6.28;
    scene.add(d.root);
    const r = rng(1000 + i * 77 + Math.floor(Math.random() * 1000));
    rivals.push({ R, d, r, steps: planOutfit(theme, r, R.style), state: 'idle', timer: 0.5 + i * 0.9, target: null, speed: 0.85 + r() * 0.25, stuck: 0, theme });
  });
  return rivals;
}

const _dir = new THREE.Vector3(), _goal = new THREE.Vector3();
/* one AI tick: returns an event when a model puts something on (for sparkles) */
export function updateRival(a, room, dt, t, colliders) {
  const d = a.d, p = d.root.position;
  let moving = false, ev = null;
  a.timer -= dt;
  if (a.state === 'idle' && a.timer <= 0) {
    const step = a.steps.shift();
    if (step) {
      const pool = room.interact.filter(it => step.kind === 'item' ? it.kind === 'item' && it.def.id === step.def.id : it.kind === step.kind);
      const it = pool[0];
      if (it && !it.busy) { a.target = it; a.step = step; it.busy = a; a.state = 'walk'; a.stuck = 0; }
      else if (it) { a.steps.push(step); a.timer = 1 + a.r() * 2; }
    } else {             // outfit done: stroll and admire it
      const w = room.wander[Math.floor(a.r() * room.wander.length)];
      a.target = { approach: { x: w.x + (a.r() - 0.5), z: w.z + (a.r() - 0.5), heading: a.r() * 6.28 }, stroll: true }; a.state = 'walk';
    }
  }
  if (a.state === 'walk') {
    const ap = a.target.approach; _goal.set(ap.x, 0, ap.z);
    const dist = Math.hypot(ap.x - p.x, ap.z - p.z);
    if (dist < 0.14) { a.state = a.target.stroll ? 'idle' : 'browse'; a.timer = a.target.stroll ? 3 + a.r() * 4 : (a.step.kind === 'item' ? 1.8 + a.r() * 1.6 : 3.5 + a.r() * 2); }
    else {
      steerDir(p, _goal, colliders, _dir);
      const moved = stepDoll(d, _dir, 1.7 * a.speed * Math.min(1, dist / 0.5 + 0.35), dt, colliders);
      moving = moved > 1e-4;
      a.stuck = moved < dt * 0.2 ? a.stuck + dt : 0;
      if (a.stuck > 2.5) { if (a.target.busy === a) a.target.busy = null; if (a.step) a.steps.push(a.step); a.state = 'idle'; a.timer = 1; }
    }
  }
  if (a.state === 'browse') {
    const want = a.target.approach.heading;
    d.root.rotation.y += Math.atan2(Math.sin(want - d.root.rotation.y), Math.cos(want - d.root.rotation.y)) * (1 - Math.exp(-dt * 6));
    d.anim.reach = Math.min(1, d.anim.reach + dt * 2.2) * (a.timer > 0.4 ? 1 : a.timer / 0.4);
    if (a.timer <= 0) {
      d.anim.reach = 0;
      if (a.step.kind === 'item') {
        const def = a.step.def, color = a.r() < 0.55 ? def.color : a.theme.palette[Math.floor(a.r() * a.theme.palette.length)];
        const item = makeItem(def, color, def.printable && a.r() < 0.35 ? ['floral', 'dots', 'gingham', 'solid'][Math.floor(a.r() * 4)] : def.print);
        d.wear(item); ev = { doll: d, kind: 'wear' };
      } else if (a.step.kind === 'hair') {
        d.setHair(HAIR_STYLES[Math.floor(a.r() * HAIR_STYLES.length)], HAIR_COLORS[Math.floor(a.r() * HAIR_COLORS.length)]); d.styled = true; ev = { doll: d, kind: 'wear' };
      } else if (a.step.kind === 'makeup') {
        d.setLook(LOOKS[Math.floor(a.r() * LOOKS.length)]); d.styled = true; ev = { doll: d, kind: 'wear' };
      }
      if (a.target.busy === a) a.target.busy = null;
      a.state = 'idle'; a.timer = 0.8 + a.r() * 2.5; a.target = null;
    }
  }
  d.anim.speed += ((moving ? 1 : 0) - d.anim.speed) * (1 - Math.exp(-dt * 8));
  return ev;
}
