/* Clothing items. An item = meshes on named bones + "dyeable" materials.
   item.setColor(hex, print) recolours it (prints are regenerated from the base colour). */
import * as THREE from 'three';
import { printTex } from './textures.js';
import { shade } from './util.js';

export const SLOTS = ['dress', 'top', 'bottom', 'shoes', 'head', 'neck', 'hands'];

export function fabric(rough = 0.75, extra = {}) { return new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: rough, ...extra }); }
export function innerFabric() { return new THREE.MeshStandardMaterial({ color: '#888888', roughness: 0.9, side: THREE.BackSide }); }

/* Wrap a built garment into an item.
   built = { parts: [{bone, obj}], main: [materials that take the colour/print], inner: [back faces, darker], accent: [materials tinted a lighter/darker shade] } */
export function wrapItem(def, built, color, print) {
  const item = { def, id: def.id, slot: def.slot, parts: built.parts, main: built.main || [], inner: built.inner || [], accent: built.accent || [], color: null, print: null };
  for (const p of item.parts) p.obj.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  item.setColor = (c, pr) => {
    item.color = c; item.print = pr === undefined ? item.print : pr;
    const map = def.printable ? printTex(item.print, c) : null;
    for (const m of item.main) {
      const had = !!m.map;
      if (map) { m.map = map; m.color.set('#ffffff'); } else { m.map = def.keepMap ? m.map : null; m.color.set(c); }
      if (had !== !!m.map) m.needsUpdate = true;
    }
    for (const m of item.inner) m.color.set(shade(c, -0.35));
    const as = built.accentShade ?? def.accentShade;
    for (const m of item.accent) m.color.set(as ? shade(c, as) : c);
    if (built.sheen) built.sheen.sheenColor.set(shade(c, 0.5));
    if (built.onColor) built.onColor(c);
  };
  item.setColor(color || def.color, print === undefined ? (def.print || 'solid') : print);
  return item;
}
