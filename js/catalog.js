/* The shop catalog for the first wing, and how each item is shown on a mannequin. */
import * as THREE from 'three';
import { wrapItem } from './clothes.js';
import { buildDress, buildGown, buildTop, buildSkirt, buildPants } from './garments-body.js';
import { buildShoes, buildHat, buildNecklace, buildGloves } from './garments-acc.js';
import { buildDoll, mannequinShow, poseNeutral } from './doll.js';

const KINDS = { dress: buildDress, gown: buildGown, top: buildTop, skirt: buildSkirt, pants: buildPants, shoes: buildShoes, hat: buildHat, neck: buildNecklace, gloves: buildGloves };

/* slot: what it replaces; display: how it sits in the shop; tags: what themes it suits */
export const CATALOG = [
  // dresses + gowns (on full-size dress forms)
  { id: 'sundress', name: 'Floral sundress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#f497b6', print: 'floral', p: { skirt: { yHem: -0.53, rHem: [0.4, 0.35] } }, tags: ['garden', 'party', 'cute', 'summer', 'floral'] },
  { id: 'coquette', name: 'Bow dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#c6a8f0', p: { chestBow: true, skirtBows: true, sleeveWhite: true, frill: { y: -0.47, r: [0.37, 0.33], drop: 0.045 }, skirt: { yHem: -0.47, rHem: [0.37, 0.33], folds: 13 } }, tags: ['cute', 'party', 'garden', 'coquette'] },
  { id: 'picnic', name: 'Gingham dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#e86a8a', print: 'gingham', p: { neck: 'square', sleeves: 'short', sashBow: false, skirt: { yHem: -0.5, rHem: [0.36, 0.31] } }, tags: ['garden', 'picnic', 'casual', 'cute'] },
  { id: 'maxi', name: 'Maxi dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#86c9e8', print: 'floral', p: { neck: 'v', sleeves: 'none', sashBow: false, skirt: { yHem: -0.9, rHem: [0.36, 0.32], folds: 9, flare: 1.1 } }, tags: ['garden', 'beach', 'elegant', 'summer', 'floral'] },
  { id: 'gown', name: 'Ruffle ball gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#24306e', print: 'sparkle', p: {}, tags: ['formal', 'royal', 'glam', 'party'] },
  { id: 'princess', name: 'Princess gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#f7b6d0', print: 'sparkle', p: { tiers: 1, sleeves: 'puff' }, tags: ['formal', 'royal', 'cute', 'party'] },
  // tops (on busts)
  { id: 'blouse', name: 'Puff blouse', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#ffffff', p: { neck: 'square', sleeves: 'puff' }, tags: ['cute', 'garden', 'school'] },
  { id: 'tee', name: 'Tee', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#ffd27a', p: { neck: 'crew', sleeves: 'short' }, tags: ['casual', 'sporty', 'summer'] },
  { id: 'cami', name: 'Cami', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#f6a9c4', p: { neck: 'sweetheart', sleeves: 'straps' }, tags: ['summer', 'party', 'cute'] },
  { id: 'sweater', name: 'Cozy sweater', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#c9b3f2', print: 'knit', p: { neck: 'crew', sleeves: 'long', loose: true, rough: 0.95 }, tags: ['cozy', 'winter', 'school', 'casual'] },
  { id: 'bowtop', name: 'Bow top', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#a8e2cc', p: { neck: 'v', sleeves: 'puff', bow: true }, tags: ['cute', 'coquette', 'party', 'garden'] },
  // bottoms (on hip forms)
  { id: 'aline', name: 'A-line skirt', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#f6a9c4', p: { skirt: { yHem: -0.42, rHem: [0.33, 0.29] } }, tags: ['cute', 'garden', 'party'] },
  { id: 'mini', name: 'Pleated mini', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#7a8fd6', print: 'gingham', p: { skirt: { yHem: -0.2, rHem: [0.23, 0.2], folds: 24, foldAmp: 0.012, flare: 0.9 } }, tags: ['school', 'cute', 'casual'] },
  { id: 'tutu', name: 'Tutu skirt', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#ffc2dc', p: { tutu: true, skirt: { yHem: -0.28, rHem: [0.3, 0.27], folds: 16 } }, tags: ['party', 'cute', 'dance'] },
  { id: 'jeans', name: 'Flared jeans', slot: 'bottom', kind: 'pants', display: 'hips', printable: true, color: '#5b7fc0', print: 'denim', p: { flare: 0.014 }, tags: ['casual', 'school'] },
  { id: 'shorts', name: 'Shorts', slot: 'bottom', kind: 'pants', display: 'hips', printable: true, color: '#fff2d9', p: { shorts: true }, tags: ['summer', 'beach', 'sporty', 'casual'] },
  // shoes
  { id: 'maryjanes', name: 'Mary Janes', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#fff8f6', p: { style: 'maryjanes' }, tags: ['cute', 'garden', 'school', 'party'] },
  { id: 'heels', name: 'Pointy heels', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#f06aa0', p: { style: 'heels' }, tags: ['glam', 'formal', 'party'] },
  { id: 'boots', name: 'Boots', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#7a4a32', p: { style: 'boots' }, tags: ['cozy', 'winter', 'casual'] },
  { id: 'sneakers', name: 'Sneakers', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#ffffff', p: { style: 'sneakers' }, tags: ['sporty', 'casual', 'school'] },
  // headwear
  { id: 'sunhat', name: 'Sun hat', slot: 'head', kind: 'hat', display: 'head', color: '#f27aa8', p: { style: 'sun' }, tags: ['garden', 'summer', 'beach', 'party'] },
  { id: 'tiara', name: 'Tiara', slot: 'head', kind: 'hat', display: 'head', color: '#ffd6ef', p: { style: 'tiara' }, tags: ['royal', 'formal', 'glam', 'party'] },
  { id: 'crown', name: 'Flower crown', slot: 'head', kind: 'hat', display: 'head', color: '#ffb3d0', p: { style: 'crown' }, tags: ['garden', 'floral', 'cute', 'party'] },
  { id: 'beret', name: 'Beret', slot: 'head', kind: 'hat', display: 'head', color: '#e86a8a', p: { style: 'beret' }, tags: ['cute', 'school', 'cozy'] },
  { id: 'bows', name: 'Hair bows', slot: 'head', kind: 'hat', display: 'head', color: '#ff8fb8', p: { style: 'bows' }, tags: ['cute', 'coquette', 'party'] },
  // necklaces, gloves
  { id: 'pearls', name: 'Pearls', slot: 'neck', kind: 'neck', display: 'neck', color: '#fff4ec', p: { style: 'pearls' }, tags: ['elegant', 'garden', 'formal', 'party'] },
  { id: 'heart', name: 'Heart necklace', slot: 'neck', kind: 'neck', display: 'neck', color: '#ff5f9e', p: { style: 'heart' }, tags: ['cute', 'party', 'casual'] },
  { id: 'gloves', name: 'Long gloves', slot: 'hands', kind: 'gloves', display: 'hands', color: '#ffffff', p: {}, tags: ['formal', 'royal', 'glam'] },
];
export const byId = id => CATALOG.find(d => d.id === id);

/* DTI-style heart palette */
export const PALETTE = ['#ffffff', '#fff2d9', '#ffd27a', '#ff9a6a', '#ffb3d0', '#f6a9c4', '#f06aa0', '#e0457b', '#c43b3b', '#a8e2cc', '#6fcf97', '#86c9e8', '#5b7fc0', '#24306e', '#c9b3f2', '#9b6ad8', '#e9c48a', '#7a4a32', '#3b2a26', '#1d181f'];

export function makeItem(def, color, print) {
  return wrapItem(def, KINDS[def.kind](def.p || {}), color, print);
}

/* which mannequin parts are visible for each display */
const SHOW = { form: ['pelvis', 'chest', 'neck', 'uarm'], bust: ['chest', 'neck', 'uarm'], hips: ['pelvis', 'leg'], head: ['head', 'neck'], shoes: [], neck: ['chest', 'neck'], hands: ['chest', 'neck'] };

function visibleBox(root) {
  const box = new THREE.Box3(), tmp = new THREE.Box3();
  root.updateMatrixWorld(true);
  root.traverse(o => {
    if (!o.isMesh) return;
    for (let p = o; p; p = p.parent) if (!p.visible) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); box.union(tmp);
  });
  return box;
}

const STAND_MAT = new THREE.MeshStandardMaterial({ color: '#e9c48a', metalness: 1, roughness: 0.28 });
/* a mannequin wearing one item; returns { group, item, footprint } with the group's base at y = 0 */
export function makeDisplay(def, scale = 1) {
  const m = buildDoll({}, { mannequin: true });
  poseNeutral(m);
  const item = makeItem(def);
  m.equip(item);
  mannequinShow(m, SHOW[def.display]);
  const inner = new THREE.Group(); inner.add(m.root);
  const box = visibleBox(m.root), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const group = new THREE.Group();
  const lift = def.display === 'form' ? 0 : def.display === 'shoes' ? 0.01 : 0.09;
  // full-size dress forms stand on the floor at their natural height; everything else sits on a stand
  if (def.display === 'form') inner.position.set(-c.x, 0, -c.z);
  else inner.position.set(-c.x, -box.min.y + lift, -c.z);
  group.add(inner);
  group.scale.setScalar(scale);
  if (lift > 0.02) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, lift, 10), STAND_MAT); pole.position.y = lift / 2; group.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.016, 24), STAND_MAT); base.position.y = 0.008; group.add(base);
  }
  if (def.display === 'form') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.9, 10), STAND_MAT); pole.position.y = 0.45; group.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.03, 32), STAND_MAT); base.position.y = 0.015; group.add(base);
  }
  group.traverse(o => { if (o.isMesh) { o.castShadow = def.display === 'form'; o.receiveShadow = true; } });
  group.userData = { def, item, size: size.multiplyScalar(scale) };
  return group;
}
