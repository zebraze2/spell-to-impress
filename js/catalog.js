/* The shop catalog for the first wing, and how each item is shown on a mannequin. */
import * as THREE from 'three';
import { wrapItem } from './clothes.js?v=36d70f72';
import { buildDress, buildGown, buildTop, buildSkirt, buildPants } from './garments-body.js?v=36d70f72';
import { buildShoes, buildHat, buildNecklace, buildGloves } from './garments-acc.js?v=36d70f72';
import { buildDoll, mannequinShow, poseNeutral } from './doll.js?v=36d70f72';

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
  // ---- Party Wing (Level 2): new pieces built from the same garment shapes ----
  { id: 'partydress', name: 'Party dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#e0457b', print: 'sparkle', p: { sleeves: 'none', chestBow: true, skirt: { yHem: -0.38, rHem: [0.4, 0.35], folds: 15, foldAmp: 0.03 }, frill: { y: -0.38, r: [0.4, 0.35], drop: 0.05, n: 48 } }, tags: ['party', 'birthday', 'glam', 'cute', 'disco'] },
  { id: 'stargown', name: 'Star gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#9b6ad8', print: 'sparkle', p: { tiers: 1 }, tags: ['royal', 'formal', 'glam', 'party', 'elegant'] },
  { id: 'disco', name: 'Disco dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#c9d2e8', print: 'sparkle', p: { neck: 'halter', sleeves: 'none', sashBow: false, skirt: { yHem: -0.3, rHem: [0.3, 0.27], folds: 20, foldAmp: 0.012, flare: 0.9 } }, tags: ['disco', 'glam', 'party'] },
  { id: 'sparklecami', name: 'Sparkle top', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#e9c48a', print: 'sparkle', p: { neck: 'sweetheart', sleeves: 'straps' }, tags: ['glam', 'party', 'disco'] },
  { id: 'stripetop', name: 'Striped top', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#e0457b', print: 'stripes', p: { neck: 'crew', sleeves: 'long' }, tags: ['birthday', 'casual', 'cute', 'school'] },
  { id: 'maxiskirt', name: 'Maxi skirt', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#c9b3f2', print: 'dots', p: { skirt: { yHem: -0.9, rHem: [0.34, 0.3], folds: 9, flare: 1.1 } }, tags: ['party', 'elegant', 'cute', 'birthday'] },
  { id: 'partypants', name: 'Party pants', slot: 'bottom', kind: 'pants', display: 'hips', printable: true, color: '#3b2a66', print: 'sparkle', p: { flare: 0.02 }, tags: ['glam', 'disco', 'party'] },
  { id: 'goldheels', name: 'Gold heels', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#e9c48a', p: { style: 'heels' }, tags: ['glam', 'formal', 'party', 'disco', 'royal'] },
  { id: 'partyhat', name: 'Party hat', slot: 'head', kind: 'hat', display: 'head', color: '#ff8fb8', p: { style: 'party' }, tags: ['birthday', 'party', 'cute'] },
  // ---- Beach Wing (Level 3) ----
  { id: 'coverup', name: 'Beach cover-up', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#86c9e8', print: 'stripes', p: { neck: 'v', sleeves: 'none', sashBow: false, skirt: { yHem: -0.62, rHem: [0.36, 0.31], folds: 10, flare: 1.0 } }, tags: ['beach', 'summer', 'casual', 'tropical'] },
  { id: 'tropicdress', name: 'Tropical dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#ff9a6a', print: 'floral', p: { neck: 'square', sleeves: 'none', skirt: { yHem: -0.45, rHem: [0.38, 0.33] } }, tags: ['tropical', 'beach', 'summer', 'party', 'floral'] },
  { id: 'swimdress', name: 'Swim dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#6fcfc4', print: 'dots', p: { neck: 'square', sleeves: 'none', sashBow: false, skirt: { yHem: -0.24, rHem: [0.27, 0.24], folds: 12 } }, tags: ['pool', 'beach', 'summer', 'sporty'] },
  { id: 'tank', name: 'Tank top', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#5b7fc0', print: 'stripes', p: { neck: 'square', sleeves: 'straps' }, tags: ['beach', 'summer', 'casual', 'sporty', 'surf'] },
  { id: 'boardshorts', name: 'Board shorts', slot: 'bottom', kind: 'pants', display: 'hips', printable: true, color: '#ff9a6a', print: 'floral', p: { shorts: true }, tags: ['surf', 'beach', 'summer', 'sporty'] },
  { id: 'sarong', name: 'Wrap skirt', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#f06aa0', print: 'floral', p: { skirt: { yHem: -0.7, rHem: [0.33, 0.29], folds: 8, flare: 1.0 } }, tags: ['tropical', 'beach', 'summer', 'pool'] },
  { id: 'sandals', name: 'Sandals', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#e9c48a', p: { style: 'sandals' }, tags: ['beach', 'summer', 'pool', 'tropical', 'casual'] },
  { id: 'bucket', name: 'Bucket hat', slot: 'head', kind: 'hat', display: 'head', color: '#ffd27a', p: { style: 'bucket' }, tags: ['beach', 'summer', 'surf', 'casual', 'sporty'] },
  // ---- Gala Wing (Level 4, review) ----
  { id: 'mermaid', name: 'Mermaid gown', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#c43b3b', print: 'sparkle', p: { neck: 'sweetheart', sleeves: 'none', sashBow: false, skirt: { yHem: -0.95, rHem: [0.5, 0.44], folds: 16, foldAmp: 0.03, flare: 1.6, off: 0.022 } }, tags: ['gala', 'glam', 'formal', 'elegant'] },
  { id: 'velvetgown', name: 'Velvet gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#7a1f3d', print: 'sparkle', p: {}, tags: ['gala', 'royal', 'formal', 'glam'] },
  { id: 'silvergown', name: 'Silver gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#c9d2e8', print: 'sparkle', p: { tiers: 1, sleeves: 'puff' }, tags: ['gala', 'glam', 'formal', 'elegant', 'winter'] },
  // ---- Royal Wing (Level 5) ----
  { id: 'royalgown', name: 'Royal gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#e9c48a', print: 'sparkle', p: {}, tags: ['royal', 'formal', 'fairytale', 'elegant', 'glam'] },
  { id: 'fairygown', name: 'Fairy gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#a8e2cc', print: 'sparkle', p: { tiers: 1, sleeves: 'puff' }, tags: ['fairytale', 'fairy', 'royal', 'cute'] },
  { id: 'rosegown', name: 'Rose gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#f6a9c4', print: 'floral', p: {}, tags: ['royal', 'fairytale', 'garden', 'elegant', 'floral'] },
  { id: 'royalcrown', name: 'Royal crown', slot: 'head', kind: 'hat', display: 'head', color: '#ff5f9e', p: { style: 'royalcrown' }, tags: ['royal', 'fairytale', 'formal', 'glam', 'gala'] },
  // ---- Winter Wing (Level 6) ----
  { id: 'sweaterdress', name: 'Sweater dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#c9b3f2', print: 'knit', p: { neck: 'crew', sleeves: 'long', sashBow: false, skirt: { yHem: -0.4, rHem: [0.3, 0.27], folds: 8, flare: 1.0 } }, tags: ['winter', 'cozy', 'casual', 'school'] },
  { id: 'holidaydress', name: 'Holiday dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#c43b3b', print: 'sparkle', p: { neck: 'sweetheart', sleeves: 'long', chestBow: true, skirt: { yHem: -0.48, rHem: [0.38, 0.33] } }, tags: ['holiday', 'party', 'winter', 'glam'] },
  { id: 'snowgown', name: 'Snow gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#e3edfa', print: 'sparkle', p: { tiers: 1, sleeves: 'long' }, tags: ['winter', 'royal', 'formal', 'holiday', 'icy'] },
  { id: 'turtleneck', name: 'Turtleneck', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#fff2d9', print: 'knit', p: { neck: 'crew', sleeves: 'long', loose: true, rough: 0.95 }, tags: ['winter', 'cozy', 'school', 'casual'] },
  { id: 'leggings', name: 'Leggings', slot: 'bottom', kind: 'pants', display: 'hips', printable: true, color: '#1d181f', p: {}, tags: ['sporty', 'winter', 'dance', 'casual'] },
  { id: 'cozypants', name: 'Cozy pants', slot: 'bottom', kind: 'pants', display: 'hips', printable: true, color: '#e86a8a', print: 'knit', p: { flare: 0.012 }, tags: ['cozy', 'winter', 'casual'] },
  { id: 'snowboots', name: 'Snow boots', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#ffffff', p: { style: 'boots' }, tags: ['winter', 'cozy', 'icy'] },
  { id: 'beanie', name: 'Beanie', slot: 'head', kind: 'hat', display: 'head', printable: true, color: '#e86a8a', print: 'knit', p: { style: 'beanie' }, tags: ['winter', 'cozy', 'sporty', 'casual'] },
  { id: 'scarf', name: 'Scarf', slot: 'neck', kind: 'neck', display: 'neck', printable: true, color: '#c43b3b', print: 'knit', p: { style: 'scarf' }, tags: ['winter', 'cozy', 'holiday'] },
  // ---- Sport Wing (Level 7) ----
  { id: 'tennisdress', name: 'Tennis dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#ffffff', p: { neck: 'v', sleeves: 'none', sashBow: false, skirt: { yHem: -0.22, rHem: [0.26, 0.22], folds: 22, foldAmp: 0.012, flare: 0.9 } }, tags: ['tennis', 'sporty', 'school'] },
  { id: 'dancedress', name: 'Dance dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#f6a9c4', print: 'sparkle', p: { neck: 'sweetheart', sleeves: 'straps', skirt: { yHem: -0.26, rHem: [0.36, 0.32], folds: 18 }, frill: { y: -0.26, r: [0.36, 0.32], drop: 0.06, n: 50 } }, tags: ['dance', 'party', 'cute', 'sporty'] },
  { id: 'sportydress', name: 'Sporty dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#5b7fc0', print: 'stripes', p: { neck: 'crew', sleeves: 'short', sashBow: false, skirt: { yHem: -0.35, rHem: [0.3, 0.27] } }, tags: ['sporty', 'team', 'casual', 'school'] },
  { id: 'jersey', name: 'Jersey', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#c43b3b', print: 'stripes', p: { neck: 'crew', sleeves: 'short' }, tags: ['sporty', 'team', 'school'] },
  { id: 'sweatshirt', name: 'Sweatshirt', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#7a8fd6', p: { neck: 'crew', sleeves: 'long', loose: true, rough: 0.9 }, tags: ['sporty', 'cozy', 'casual', 'team'] },
  { id: 'tennisskirt', name: 'Tennis skirt', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#ffffff', p: { skirt: { yHem: -0.2, rHem: [0.23, 0.2], folds: 24, foldAmp: 0.012, flare: 0.9 } }, tags: ['tennis', 'sporty', 'school'] },
  { id: 'trackpants', name: 'Track pants', slot: 'bottom', kind: 'pants', display: 'hips', printable: true, color: '#24306e', print: 'stripes', p: { flare: 0.008 }, tags: ['sporty', 'team', 'casual'] },
  { id: 'hightops', name: 'High-tops', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#f06aa0', p: { style: 'hightops' }, tags: ['sporty', 'dance', 'casual', 'team'] },
  { id: 'cap', name: 'Baseball cap', slot: 'head', kind: 'hat', display: 'head', color: '#5b7fc0', p: { style: 'cap' }, tags: ['sporty', 'team', 'casual', 'school'] },
  // ---- Starlight Wing (Level 8): pop star ----
  { id: 'popdress', name: 'Pop star dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#9b6ad8', print: 'stars', p: { neck: 'sweetheart', sleeves: 'none', sashBow: false, frill: { y: -0.27, r: [0.31, 0.28], drop: 0.04 }, skirt: { yHem: -0.27, rHem: [0.31, 0.28], folds: 18, foldAmp: 0.016, flare: 0.7 } }, tags: ['popstar', 'glam', 'disco', 'party'] },
  { id: 'startop', name: 'Star tee', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#1d181f', print: 'stars', p: { neck: 'crew', sleeves: 'short' }, tags: ['popstar', 'space', 'casual', 'party'] },
  { id: 'sequinskirt', name: 'Sequin skirt', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#e0457b', print: 'sparkle', p: { skirt: { yHem: -0.24, rHem: [0.27, 0.24], folds: 20, foldAmp: 0.012, flare: 0.8 } }, tags: ['popstar', 'disco', 'glam', 'party'] },
  { id: 'silverboots', name: 'Silver boots', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#c9d2e8', p: { style: 'boots' }, tags: ['popstar', 'space', 'glam', 'disco'] },
  { id: 'starband', name: 'Star headband', slot: 'head', kind: 'hat', display: 'head', color: '#ffd27a', p: { style: 'starband' }, tags: ['popstar', 'space', 'party', 'cute'] },
  // ---- Space Wing (Level 9) ----
  { id: 'galaxydress', name: 'Galaxy dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#24306e', print: 'stars', p: { neck: 'sweetheart', sleeves: 'puff', sashBow: false, skirt: { yHem: -0.55, rHem: [0.41, 0.36] } }, tags: ['space', 'galaxy', 'glam', 'party'] },
  { id: 'galaxygown', name: 'Galaxy gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#3b2a66', print: 'stars', p: { tiers: 1 }, tags: ['space', 'galaxy', 'formal', 'elegant', 'glam'] },
  { id: 'shinyleggings', name: 'Shiny leggings', slot: 'bottom', kind: 'pants', display: 'hips', printable: true, color: '#c9d2e8', print: 'sparkle', p: { rough: 0.35 }, tags: ['space', 'popstar', 'dance', 'sporty'] },
  { id: 'moonboots', name: 'Moon boots', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#ffffff', p: { style: 'boots', chunky: true }, tags: ['space', 'winter', 'sporty', 'casual'] },
  { id: 'antennae', name: 'Alien antennae', slot: 'head', kind: 'hat', display: 'head', color: '#6fcf97', p: { style: 'antennae' }, tags: ['space', 'alien', 'party', 'cute'] },
  // ---- Western Wing (Level 10) ----
  { id: 'prairiedress', name: 'Prairie dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#86c9e8', print: 'gingham', p: { neck: 'square', sleeves: 'puff', frill: { y: -0.7, r: [0.47, 0.42], drop: 0.05 }, skirt: { yHem: -0.7, rHem: [0.47, 0.42], folds: 12 } }, tags: ['western', 'picnic', 'cute', 'casual'] },
  { id: 'plaidshirt', name: 'Plaid shirt', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#c43b3b', print: 'plaid', p: { neck: 'v', sleeves: 'long', loose: true }, tags: ['western', 'autumn', 'casual', 'cozy'] },
  { id: 'denimskirt', name: 'Denim skirt', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#5b7fc0', print: 'denim', p: { skirt: { yHem: -0.3, rHem: [0.27, 0.24], folds: 6, foldAmp: 0.008, flare: 1.0 } }, tags: ['western', 'casual', 'school'] },
  { id: 'cowgirlboots', name: 'Cowgirl boots', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#7a4a32', p: { style: 'boots', western: true }, tags: ['western', 'autumn', 'casual'] },
  { id: 'cowgirlhat', name: 'Cowgirl hat', slot: 'head', kind: 'hat', display: 'head', color: '#e9c48a', p: { style: 'cowboy' }, tags: ['western', 'casual', 'sporty'] },
  { id: 'bandana', name: 'Bandana', slot: 'neck', kind: 'neck', display: 'neck', printable: true, color: '#c43b3b', print: 'dots', p: { style: 'bandana' }, tags: ['western', 'casual', 'sporty'] },
  // ---- Candy Wing (Level 11) ----
  { id: 'candydress', name: 'Candy dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#ffb3d0', print: 'hearts', p: { neck: 'sweetheart', sleeves: 'puff', chestBow: true, frill: { y: -0.42, r: [0.38, 0.34], drop: 0.045 }, skirt: { yHem: -0.42, rHem: [0.38, 0.34], folds: 14 } }, tags: ['candy', 'cute', 'party', 'coquette'] },
  { id: 'teadress', name: 'Tea party dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#a8e2cc', print: 'floral', p: { neck: 'square', sleeves: 'puff', skirt: { yHem: -0.62, rHem: [0.43, 0.38] } }, tags: ['candy', 'elegant', 'garden', 'coquette', 'cute'] },
  { id: 'candytop', name: 'Candy stripe top', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#f06aa0', print: 'stripes', p: { neck: 'square', sleeves: 'puff', bow: true }, tags: ['candy', 'cute', 'party'] },
  { id: 'sprinkleskirt', name: 'Sprinkle tutu', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#86c9e8', print: 'dots', p: { tutu: true, skirt: { yHem: -0.28, rHem: [0.3, 0.27], folds: 16 } }, tags: ['candy', 'cute', 'party', 'birthday'] },
  { id: 'chefhat', name: 'Chef hat', slot: 'head', kind: 'hat', display: 'head', color: '#ffffff', p: { style: 'chef' }, tags: ['candy', 'cute', 'casual'] },
  // ---- Sleepover Wing (Level 12) ----
  { id: 'pjtop', name: 'Pajama top', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#c9b3f2', print: 'stars', p: { neck: 'crew', sleeves: 'long', loose: true, rough: 0.9 }, tags: ['pajama', 'cozy', 'cute'] },
  { id: 'pjpants', name: 'Pajama pants', slot: 'bottom', kind: 'pants', display: 'hips', printable: true, color: '#c9b3f2', print: 'stars', p: { flare: 0.012, rough: 0.9 }, tags: ['pajama', 'cozy'] },
  { id: 'nightgown', name: 'Nightgown', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#ffb3d0', print: 'hearts', p: { neck: 'crew', sleeves: 'puff', sashBow: false, skirt: { yHem: -0.82, rHem: [0.4, 0.36], folds: 10, flare: 1.1 } }, tags: ['pajama', 'cozy', 'cute', 'fairytale'] },
  { id: 'slippers', name: 'Fuzzy slippers', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#ffb3d0', p: { style: 'slippers' }, tags: ['pajama', 'cozy', 'cute'] },
  { id: 'bonnet', name: 'Sleep bonnet', slot: 'head', kind: 'hat', display: 'head', color: '#c9b3f2', p: { style: 'bonnet' }, tags: ['pajama', 'cozy', 'cute'] },
  // ---- Safari Wing (Level 13) ----
  { id: 'leoparddress', name: 'Leopard dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#d9a05b', print: 'leopard', p: { neck: 'v', sleeves: 'none', sashBow: false, skirt: { yHem: -0.42, rHem: [0.34, 0.3], folds: 10 } }, tags: ['safari', 'glam', 'party', 'jungle'] },
  { id: 'safarishirt', name: 'Safari shirt', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#e9c48a', p: { neck: 'v', sleeves: 'short', loose: true }, tags: ['safari', 'casual', 'sporty'] },
  { id: 'cargoshorts', name: 'Cargo shorts', slot: 'bottom', kind: 'pants', display: 'hips', printable: true, color: '#7a4a32', p: { shorts: true }, tags: ['safari', 'casual', 'sporty', 'summer'] },
  { id: 'leopardskirt', name: 'Leopard skirt', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#d9a05b', print: 'leopard', p: { skirt: { yHem: -0.24, rHem: [0.26, 0.23], folds: 10, foldAmp: 0.01, flare: 0.9 } }, tags: ['safari', 'glam', 'party'] },
  { id: 'safarihat', name: 'Safari hat', slot: 'head', kind: 'hat', display: 'head', color: '#e9c48a', p: { style: 'bucket' }, tags: ['safari', 'casual', 'sporty'] },
  { id: 'catears', name: 'Kitty ears', slot: 'head', kind: 'hat', display: 'head', color: '#e9c48a', p: { style: 'ears' }, tags: ['safari', 'cute', 'party', 'jungle', 'pajama'] },
  // ---- Ocean Wing (Level 14) ----
  { id: 'wavegown', name: 'Wave gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#86c9e8', print: 'sparkle', p: {}, tags: ['ocean', 'mermaid', 'formal', 'elegant'] },
  { id: 'seadress', name: 'Sea breeze dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#6fcfc4', print: 'stripes', p: { neck: 'halter', sleeves: 'none', sashBow: false, skirt: { yHem: -0.6, rHem: [0.42, 0.37] } }, tags: ['ocean', 'beach', 'summer', 'casual'] },
  { id: 'shelltop', name: 'Seashell top', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#ffb3d0', print: 'sparkle', p: { neck: 'sweetheart', sleeves: 'straps' }, tags: ['mermaid', 'ocean', 'glam', 'party', 'beach'] },
  { id: 'tailskirt', name: 'Mermaid tail skirt', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#6fcfc4', print: 'sparkle', p: { skirt: { yHem: -0.95, rHem: [0.5, 0.44], folds: 16, foldAmp: 0.03, flare: 1.6, off: 0.022 } }, tags: ['mermaid', 'ocean', 'glam', 'elegant'] },
  { id: 'pearlcrown', name: 'Pearl crown', slot: 'head', kind: 'hat', display: 'head', color: '#fff4ec', p: { style: 'tiara', pearls: true }, tags: ['ocean', 'mermaid', 'royal', 'elegant'] },
  // ---- Autumn Wing (Level 15) ----
  { id: 'harvestdress', name: 'Harvest dress', slot: 'dress', kind: 'dress', display: 'form', printable: true, color: '#ff9a6a', print: 'floral', p: { neck: 'square', sleeves: 'long', skirt: { yHem: -0.58, rHem: [0.41, 0.36] } }, tags: ['autumn', 'cozy', 'picnic', 'floral'] },
  { id: 'cardigan', name: 'Cardigan', slot: 'top', kind: 'top', display: 'bust', printable: true, color: '#e9c48a', print: 'knit', p: { neck: 'v', sleeves: 'long', loose: true, rough: 0.95 }, tags: ['autumn', 'cozy', 'school', 'casual'] },
  { id: 'plaidskirt', name: 'Plaid skirt', slot: 'bottom', kind: 'skirt', display: 'hips', printable: true, color: '#c43b3b', print: 'plaid', p: { skirt: { yHem: -0.22, rHem: [0.25, 0.22], folds: 22, foldAmp: 0.012, flare: 0.9 } }, tags: ['autumn', 'school', 'cozy', 'casual'] },
  { id: 'ankleboots', name: 'Ankle boots', slot: 'shoes', kind: 'shoes', display: 'shoes', color: '#7a4a32', p: { style: 'boots', short: true }, tags: ['autumn', 'cozy', 'casual', 'western'] },
  { id: 'leafcrown', name: 'Autumn crown', slot: 'head', kind: 'hat', display: 'head', color: '#ff9a6a', p: { style: 'crown' }, tags: ['autumn', 'floral', 'cute', 'garden'] },
  // ---- Fashion Week Wing (Level 16) ----
  { id: 'couturegown', name: 'Couture gown', slot: 'dress', kind: 'gown', display: 'form', printable: true, color: '#1d181f', print: 'sparkle', p: { sleeves: 'puff' }, tags: ['runway', 'glam', 'formal', 'elegant'] },
  { id: 'runwayhat', name: 'Runway hat', slot: 'head', kind: 'hat', display: 'head', color: '#1d181f', p: { style: 'sun', felt: true, big: true }, tags: ['runway', 'glam', 'elegant'] },
];
/* what each wing's shop shows: 6 dress forms + 4 shelf niches of 6 (null = empty spot) */
export const WINGS = [
  { name: 'Garden Wing', forms: ['sundress', 'coquette', 'picnic', 'maxi', 'gown', 'princess'],
    shelves: ['blouse', 'tee', 'cami', 'sweater', 'bowtop', 'gloves', 'aline', 'mini', 'tutu', 'jeans', 'shorts', null, 'maryjanes', 'heels', 'sneakers', 'boots', 'pearls', 'heart', 'sunhat', 'tiara', 'crown', 'beret', 'bows', null] },
  { name: 'Party Wing', tint: { wall: '#ece2f8', niche: '#cbb4ee', velvet: '#c9a8f0', rug: '#e6d6ff' }, forms: ['partydress', 'stargown', 'disco', 'princess', 'gown', 'coquette'],
    shelves: ['sparklecami', 'stripetop', 'bowtop', 'blouse', 'cami', 'gloves', 'maxiskirt', 'partypants', 'tutu', 'mini', 'aline', null, 'goldheels', 'heels', 'maryjanes', 'sneakers', 'pearls', 'heart', 'partyhat', 'tiara', 'bows', 'crown', 'beret', null] },
  { name: 'Beach Wing', tint: { wall: '#e2f3f1', niche: '#a8dcd6', velvet: '#7cc9c0', rug: '#d6f2ee' }, forms: ['coverup', 'tropicdress', 'swimdress', 'maxi', 'sundress', 'picnic'],
    shelves: ['tank', 'tee', 'cami', 'blouse', 'bowtop', null, 'boardshorts', 'sarong', 'shorts', 'aline', 'mini', null, 'sandals', 'sneakers', 'maryjanes', 'pearls', 'heart', null, 'bucket', 'sunhat', 'crown', 'bows', null, null] },
  { name: 'Gala Wing', tint: { wall: '#f1e6da', niche: '#dcc09a', velvet: '#b8325f', rug: '#f6dccd' }, forms: ['mermaid', 'velvetgown', 'silvergown', 'stargown', 'gown', 'princess'],
    shelves: ['sparklecami', 'blouse', 'cami', 'bowtop', 'gloves', null, 'partypants', 'maxiskirt', 'aline', 'tutu', null, null, 'goldheels', 'heels', 'maryjanes', 'pearls', 'heart', null, 'royalcrown', 'tiara', 'bows', 'crown', null, null] },
  { name: 'Royal Wing', tint: { wall: '#e7e5f7', niche: '#b9b4e8', velvet: '#7c6fd0', rug: '#ddd9ff' }, forms: ['royalgown', 'fairygown', 'rosegown', 'princess', 'stargown', 'coquette'],
    shelves: ['blouse', 'bowtop', 'sparklecami', 'cami', 'gloves', null, 'tutu', 'maxiskirt', 'aline', 'mini', null, null, 'goldheels', 'maryjanes', 'heels', 'pearls', 'heart', null, 'royalcrown', 'tiara', 'crown', 'bows', null, null] },
  { name: 'Winter Wing', tint: { wall: '#e6eef7', niche: '#bcd2ea', velvet: '#8fb3e0', rug: '#e3edfa' }, forms: ['sweaterdress', 'holidaydress', 'snowgown', 'picnic', 'silvergown', 'gown'],
    shelves: ['sweater', 'turtleneck', 'stripetop', 'blouse', 'gloves', null, 'jeans', 'leggings', 'cozypants', 'aline', 'mini', null, 'boots', 'snowboots', 'sneakers', 'scarf', 'pearls', 'heart', 'beanie', 'beret', 'tiara', 'bows', null, null] },
  { name: 'Sport Wing', tint: { wall: '#eef6e6', niche: '#c4e6b0', velvet: '#6fbf7e', rug: '#e4f5d8' }, forms: ['tennisdress', 'dancedress', 'sportydress', 'swimdress', 'picnic', 'sundress'],
    shelves: ['jersey', 'sweatshirt', 'tee', 'tank', 'sweater', null, 'tennisskirt', 'trackpants', 'leggings', 'shorts', 'tutu', null, 'sneakers', 'hightops', 'sandals', 'heart', null, null, 'cap', 'bucket', 'beanie', 'bows', null, null] },

  { name: 'Starlight Wing', tint: { wall: '#ece6f6', niche: '#c8b8ee', velvet: '#7a4fc0', rug: '#e6dcfb' }, forms: ['popdress', 'disco', 'partydress', 'stargown', 'silvergown', 'mermaid'],
    shelves: ['startop', 'sparklecami', 'stripetop', 'cami', 'tee', 'gloves', 'sequinskirt', 'partypants', 'leggings', 'mini', 'tutu', 'jeans', 'silverboots', 'goldheels', 'hightops', 'heels', 'heart', 'pearls', 'starband', 'tiara', 'cap', 'bows', 'partyhat', null] },
  { name: 'Space Wing', tint: { wall: '#e3e6f3', niche: '#a9b3e0', velvet: '#3b4a9a', rug: '#dde2f7' }, forms: ['galaxydress', 'galaxygown', 'silvergown', 'stargown', 'popdress', 'sportydress'],
    shelves: ['startop', 'sparklecami', 'tee', 'sweatshirt', 'turtleneck', 'gloves', 'shinyleggings', 'leggings', 'trackpants', 'partypants', 'mini', null, 'moonboots', 'silverboots', 'sneakers', 'hightops', 'heart', 'pearls', 'antennae', 'starband', 'beanie', 'tiara', 'cap', null] },
  { name: 'Western Wing', tint: { wall: '#f3e9dc', niche: '#d9bf98', velvet: '#a5603a', rug: '#f2e2cc' }, forms: ['prairiedress', 'picnic', 'sundress', 'holidaydress', 'sweaterdress', 'maxi'],
    shelves: ['plaidshirt', 'blouse', 'tee', 'tank', 'sweater', null, 'denimskirt', 'jeans', 'shorts', 'aline', 'mini', null, 'cowgirlboots', 'boots', 'sneakers', 'bandana', 'scarf', 'heart', 'cowgirlhat', 'bucket', 'cap', 'crown', 'bows', null] },
  { name: 'Candy Wing', tint: { wall: '#fbe8f0', niche: '#f6bcd2', velvet: '#ef7fae', rug: '#ffe1ec' }, forms: ['candydress', 'teadress', 'coquette', 'partydress', 'princess', 'picnic'],
    shelves: ['candytop', 'bowtop', 'blouse', 'cami', 'stripetop', 'gloves', 'sprinkleskirt', 'tutu', 'aline', 'mini', 'maxiskirt', null, 'maryjanes', 'sneakers', 'heels', 'pearls', 'heart', null, 'chefhat', 'bows', 'crown', 'partyhat', 'tiara', null] },
  { name: 'Sleepover Wing', tint: { wall: '#e8eef8', niche: '#b9c8ec', velvet: '#7d8fd0', rug: '#e2e9fb' }, forms: ['nightgown', 'sweaterdress', 'candydress', 'coquette', 'fairygown', 'picnic'],
    shelves: ['pjtop', 'sweatshirt', 'sweater', 'tee', 'bowtop', null, 'pjpants', 'cozypants', 'leggings', 'shorts', 'tutu', null, 'slippers', 'sneakers', 'snowboots', 'heart', 'scarf', null, 'bonnet', 'beanie', 'bows', 'catears', 'starband', null] },
  { name: 'Safari Wing', tint: { wall: '#f2ecd9', niche: '#d6c48f', velvet: '#6f8a3a', rug: '#ece3c6' }, forms: ['leoparddress', 'coverup', 'tropicdress', 'maxi', 'sundress', 'sportydress'],
    shelves: ['safarishirt', 'tank', 'tee', 'blouse', 'cami', null, 'cargoshorts', 'leopardskirt', 'shorts', 'boardshorts', 'jeans', null, 'boots', 'sandals', 'sneakers', 'cowgirlboots', 'bandana', 'heart', 'safarihat', 'catears', 'bucket', 'sunhat', 'cap', null] },
  { name: 'Ocean Wing', tint: { wall: '#dfeef6', niche: '#8ccbe0', velvet: '#2a7f9e', rug: '#d0e8f4' }, forms: ['wavegown', 'seadress', 'mermaid', 'swimdress', 'coverup', 'silvergown'],
    shelves: ['shelltop', 'cami', 'tank', 'sparklecami', 'bowtop', null, 'tailskirt', 'sarong', 'maxiskirt', 'shorts', 'tutu', null, 'sandals', 'goldheels', 'maryjanes', 'pearls', 'heart', null, 'pearlcrown', 'tiara', 'crown', 'sunhat', 'bows', null] },
  { name: 'Autumn Wing', tint: { wall: '#f6e9df', niche: '#e3b48f', velvet: '#c4673b', rug: '#f5dfcf' }, forms: ['harvestdress', 'sweaterdress', 'prairiedress', 'picnic', 'holidaydress', 'velvetgown'],
    shelves: ['cardigan', 'plaidshirt', 'turtleneck', 'sweater', 'blouse', null, 'plaidskirt', 'jeans', 'cozypants', 'denimskirt', 'mini', null, 'ankleboots', 'boots', 'cowgirlboots', 'maryjanes', 'scarf', 'pearls', 'leafcrown', 'beret', 'beanie', 'cowgirlhat', 'bows', null] },
  { name: 'Fashion Week Wing', tint: { wall: '#efefef', niche: '#cfcfcf', velvet: '#1d181f', rug: '#ebe6e6' }, forms: ['couturegown', 'mermaid', 'velvetgown', 'galaxygown', 'royalgown', 'leoparddress'],
    shelves: ['sparklecami', 'startop', 'plaidshirt', 'shelltop', 'blouse', 'gloves', 'tailskirt', 'sequinskirt', 'leopardskirt', 'partypants', 'shinyleggings', 'plaidskirt', 'goldheels', 'heels', 'silverboots', 'cowgirlboots', 'pearls', 'heart', 'runwayhat', 'royalcrown', 'tiara', 'starband', 'cowgirlhat', 'pearlcrown'] },
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
