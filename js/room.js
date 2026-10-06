/* The boutique: walls, shelves full of mannequins, dress forms, salon + vanity, runway doors.
   Returns colliders and "interactables" (things you can walk up to and use). */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { V3 } from './util.js?v=2271898f';
import { TEX } from './textures.js?v=2271898f';
import { M, makePalm, makeSconce, makeChandelier, makeSalonChair, makeVanity, makePouf, makeRunwayDoors, makeMirror } from './props.js?v=2271898f';
import { CATALOG, makeDisplay } from './catalog.js?v=2271898f';

export const ROOM = { x0: -7, x1: 7, z0: -5.5, z1: 5.5, h: 4.8 };
const rbox = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 2, r);

/* the back wall with arched niches; returns shelf slots in wall-local space */
function nicheWall(w, niches, h = ROOM.h) {
  const g = new THREE.Group(), NW = 1.7, NR = 1.25, NB = 0.5, ND = 0.55, T = 0.05;
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.closePath();
  const arch = (cx, shape) => { const p = shape ? new THREE.Shape() : new THREE.Path(); const hw = NW / 2; p.moveTo(cx - hw, NB); p.lineTo(cx + hw, NB); p.lineTo(cx + hw, NB + NR); p.absarc(cx, NB + NR, hw, 0, Math.PI, false); p.lineTo(cx - hw, NB); return p; };
  for (const n of niches) sh.holes.push(arch(n));
  const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 24 }), M.wall);
  wall.position.z = -T; wall.receiveShadow = true; g.add(wall);
  const shelfGeo = rbox(NW - 0.01, 0.045, ND - 0.02, 0.012), slots = [];
  for (const cx of niches) {
    const box = new THREE.Mesh(new THREE.ExtrudeGeometry(arch(cx, true), { depth: ND, bevelEnabled: false, curveSegments: 24 }), [M.hidden, M.nicheIn]);
    box.position.z = -T - ND; box.receiveShadow = true; g.add(box);
    const back = new THREE.Mesh(new THREE.ShapeGeometry(arch(cx, true), 24), M.nicheBack); back.position.z = -T - ND + 0.001; g.add(back);
    for (const y of [NB, 0.82, 1.48]) { const s = new THREE.Mesh(shelfGeo, M.shelf); s.position.set(cx, y + 0.0225 - (y === NB ? 0.02 : 0), -T - ND / 2); s.receiveShadow = true; g.add(s); }
    for (const y of [0.82, 1.48]) for (const dx of [-0.52, 0, 0.52]) slots.push({ x: cx + dx, y: y + 0.045, z: -T - ND / 2 + 0.03 });
    const trimPts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI; trimPts.push(V3(cx + Math.cos(a) * (NW / 2 + 0.03), NB + NR + Math.sin(a) * (NW / 2 + 0.03), 0.012)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trimPts), 48, 0.022, 8), M.trim));
    for (const s of [-1, 1]) { const col = new THREE.Mesh(rbox(0.06, NR, 0.04, 0.015), M.trim); col.position.set(cx + s * (NW / 2 + 0.03), NB + NR / 2, 0.012); g.add(col); }
    const sill = new THREE.Mesh(rbox(NW + 0.16, 0.06, 0.1, 0.02), M.trim); sill.position.set(cx, NB - 0.01, 0.02); g.add(sill);
  }
  return { g, slots };
}

function plainWall(len, h = ROOM.h) {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, h), M.wall); wall.position.y = h / 2; wall.receiveShadow = true; g.add(wall);
  const base = new THREE.Mesh(new THREE.BoxGeometry(len, 0.15, 0.04), M.trim); base.position.set(0, 0.075, 0.02); g.add(base);
  const rail = new THREE.Mesh(rbox(len, 0.05, 0.05, 0.02), M.trim); rail.position.set(0, 1.0, 0.02); g.add(rail);
  const crown = new THREE.Mesh(rbox(len, 0.14, 0.1, 0.03), M.trim); crown.position.set(0, 3.32, 0.03); g.add(crown);
  // wainscot panels
  for (let x = -len / 2 + 0.9; x < len / 2 - 0.5; x += 1.4) {
    const p = new THREE.Mesh(rbox(1.05, 0.6, 0.02, 0.01), M.trim); p.position.set(x + 0.2, 0.55, 0.012); g.add(p);
  }
  return g;
}

export function buildRoom() {
  const room = new THREE.Group(), colliders = [], interact = [];
  const W = ROOM.x1 - ROOM.x0, D = ROOM.z1 - ROOM.z0;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: TEX.wood, roughness: 0.36 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.name = 'floor'; room.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: '#fbf1ee', roughness: 1 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = ROOM.h; room.add(ceil);

  // back wall with 4 niches
  const back = nicheWall(W, [-4.2, -1.4, 1.4, 4.2]);
  back.g.position.z = ROOM.z0; room.add(back.g);
  const slots = back.slots.map(s => ({ x: s.x, y: s.y, z: s.z + ROOM.z0 }));
  for (const x of [-2.8, 0, 2.8]) {
    const pil = new THREE.Mesh(rbox(0.3, 2.95, 0.07, 0.02), M.trim); pil.position.set(x, 1.6, ROOM.z0 + 0.03); room.add(pil);
    const sc = makeSconce(); sc.position.set(x, 2.3, ROOM.z0 + 0.08); room.add(sc);
  }
  const crownB = new THREE.Mesh(rbox(W, 0.14, 0.1, 0.03), M.trim); crownB.position.set(0, 3.32, ROOM.z0 + 0.03); room.add(crownB);
  // side + front walls
  const left = plainWall(D); left.position.set(ROOM.x0, 0, 0); left.rotation.y = Math.PI / 2; room.add(left);
  const right = plainWall(D); right.position.set(ROOM.x1, 0, 0); right.rotation.y = -Math.PI / 2; room.add(right);
  const front = plainWall(W); front.position.set(0, 0, ROOM.z1); front.rotation.y = Math.PI; room.add(front);
  for (const z of [-3, 0, 3]) for (const [x, ry] of [[ROOM.x0 + 0.05, Math.PI / 2], [ROOM.x1 - 0.05, -Math.PI / 2]]) { const sc = makeSconce(); sc.position.set(x, 2.3, z); sc.rotation.y = ry; room.add(sc); }

  // shelf displays: tops, bottoms, shoes, hats, jewellery
  const order = ['blouse', 'tee', 'cami', 'sweater', 'bowtop', 'gloves', 'aline', 'mini', 'tutu', 'jeans', 'shorts', 'heart', 'maryjanes', 'heels', 'sneakers', 'boots', 'pearls', 'beret', 'sunhat', 'tiara', 'crown', 'bows'];
  const SCALE = { bust: 0.52, hips: 0.5, head: 0.62, shoes: 0.95, neck: 0.52, hands: 0.5 };
  order.forEach((id, i) => {
    const def = CATALOG.find(d => d.id === id), s = slots[i];
    if (!def || !s) return;
    const disp = makeDisplay(def, SCALE[def.display] || 0.5);
    disp.position.set(s.x, s.y, s.z); room.add(disp);
    interact.push({ kind: 'item', def, obj: disp, at: V3(s.x, s.y, s.z), top: s.y + disp.userData.size.y + 0.12, approach: { x: s.x, z: ROOM.z0 + 1.05, heading: Math.PI } });
  });

  // dress forms along the left wall on a low platform
  const plat = new THREE.Mesh(rbox(1.5, 0.12, 8.6, 0.04), M.white); plat.position.set(ROOM.x0 + 0.75, 0.06, 0); plat.receiveShadow = true; room.add(plat);
  const runner = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.01, 8.4), M.velvet); runner.position.set(ROOM.x0 + 0.75, 0.125, 0); room.add(runner);
  colliders.push({ box: [ROOM.x0, -4.35, ROOM.x0 + 1.55, 4.35] });
  CATALOG.filter(d => d.display === 'form').forEach((def, i) => {
    const z = -3.6 + i * 1.44, disp = makeDisplay(def, 0.94);
    disp.position.set(ROOM.x0 + 0.78, 0.125, z); disp.rotation.y = Math.PI / 2; room.add(disp);
    interact.push({ kind: 'item', def, obj: disp, at: V3(ROOM.x0 + 0.78, 1, z), top: 0.125 + disp.userData.size.y + 0.18, approach: { x: ROOM.x0 + 2.05, z, heading: -Math.PI / 2 } });
  });

  // salon chair (hair) + vanity (makeup) on the right wall
  const chair = makeSalonChair(); chair.position.set(ROOM.x1 - 0.85, 0, -2.6); chair.rotation.y = -Math.PI / 2; room.add(chair);
  colliders.push({ box: [ROOM.x1 - 1.45, -3.05, ROOM.x1, -2.15] });
  interact.push({ kind: 'hair', obj: chair, at: V3(ROOM.x1 - 0.85, 1, -2.6), top: 2.05, approach: { x: ROOM.x1 - 1.95, z: -2.6, heading: Math.PI / 2 } });
  const van = makeVanity(); van.position.set(ROOM.x1 - 0.32, 0, 1.7); van.rotation.y = -Math.PI / 2; room.add(van);
  colliders.push({ box: [ROOM.x1 - 0.6, 1.0, ROOM.x1, 2.4] }, { circle: [ROOM.x1 - 0.94, 1.7, 0.24] });
  interact.push({ kind: 'makeup', obj: van, at: V3(ROOM.x1 - 0.5, 1.4, 1.7), top: 2.15, approach: { x: ROOM.x1 - 1.45, z: 1.7, heading: Math.PI / 2 } });
  const pal2 = makePalm(); pal2.position.set(ROOM.x1 - 0.5, 0, -0.5); room.add(pal2); colliders.push({ circle: [ROOM.x1 - 0.5, -0.5, 0.35] });

  // runway doors, mirrors, palms on the front wall
  const doors = makeRunwayDoors(); doors.position.set(0, 0, ROOM.z1 - 0.05); doors.rotation.y = Math.PI; room.add(doors);
  interact.push({ kind: 'door', obj: doors, at: V3(0, 1.3, ROOM.z1 - 0.2), top: 3.5, approach: { x: 0, z: ROOM.z1 - 1.0, heading: 0 } });
  for (const x of [-3.4, 3.4]) { const m = makeMirror(); m.position.set(x, 0.12, ROOM.z1 - 0.06); m.rotation.y = Math.PI; room.add(m); }
  for (const [x, z] of [[ROOM.x0 + 0.55, ROOM.z1 - 0.55], [ROOM.x1 - 0.55, ROOM.z1 - 0.55], [ROOM.x1 - 0.55, ROOM.z0 + 0.75]]) {
    const p = makePalm(); p.position.set(x, 0, z); p.scale.setScalar(1.2); room.add(p); colliders.push({ circle: [x, z, 0.38] });
  }

  // centrepiece: tufted pouf with a palm, rug, chandelier
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.34, 0.02, 96), [new THREE.MeshStandardMaterial({ color: '#e993b0', roughness: 0.95 }), new THREE.MeshStandardMaterial({ map: TEX.rug, roughness: 0.95 }), new THREE.MeshStandardMaterial({ color: '#e993b0' })]);
  rug.position.set(0, 0.01, 0.3); rug.receiveShadow = true; room.add(rug);
  const pouf = makePouf(); pouf.position.set(0, 0.02, 0.3); room.add(pouf); colliders.push({ circle: [0, 0.3, 1.08] });
  const ch = makeChandelier(); ch.position.set(0, ROOM.h - 1.1, 0.3); room.add(ch);

  room.traverse(o => { if (o.isMesh && o.castShadow === undefined) o.castShadow = false; });
  for (const o of [chair, van, pouf, doors]) o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

  // open-floor waypoints the computer models wander between
  const wander = [V3(-3, 0, -2.5), V3(3, 0, -2.5), V3(-3.5, 0, 2.5), V3(3.5, 0, 2.6), V3(0, 0, -3.3), V3(-1.8, 0, 3.6), V3(1.8, 0, 3.6), V3(4.6, 0, 0.2), V3(-4.4, 0, 0.3)];
  return { group: room, colliders, interact, spawn: { x: 0, z: 2.5, heading: Math.PI }, wander };
}
