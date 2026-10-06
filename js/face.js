/* DTI-style face, painted onto a canvas and wrapped on the front of the head.
   A face = the person's own features (skin, iris, brows) + a makeup look (shadow, liner, lips, blush, extras).
   Three frames (open, half, shut) make the blink. */
import { TAU, lerp, rng, canvasTex, hexA, shade } from './util.js';

export const FACE = { W: 0.30, Y0: -0.03 };   // decal covers 0.30 x 0.30 of the head front, centred 0.03 below head centre

/* Makeup looks offered at the vanity (the first is the default). */
export const LOOKS = [
  { id: 'glam', name: 'Pink Glam', shadow: '#d987a6', shadowAmt: 1, wing: 1, lip: '#e0628c', blush: '#ff7d9b', blushAmt: 0.5 },
  { id: 'natural', name: 'Natural', shadow: '#c39488', shadowAmt: 0.55, wing: 0.45, lip: '#cf7f8b', blush: '#ff9aa8', blushAmt: 0.35 },
  { id: 'sparkle', name: 'Sparkle', shadow: '#b48ae4', shadowAmt: 1, wing: 0.9, lip: '#ef7aae', blush: '#ff8fb8', blushAmt: 0.45, glitter: '#ffffff' },
  { id: 'berry', name: 'Berry Bold', shadow: '#8e4a6e', shadowAmt: 1, wing: 1.35, lip: '#a8234d', blush: '#e86a8a', blushAmt: 0.42 },
  { id: 'sunset', name: 'Sunset', shadow: '#f09a5c', shadowAmt: 0.95, wing: 0.6, lip: '#e8664f', blush: '#ff9070', blushAmt: 0.5, freckles: true },
  { id: 'fairy', name: 'Fairy', shadow: '#86d1c4', shadowAmt: 0.95, wing: 0.7, lip: '#f48fb5', blush: '#ffa3c4', blushAmt: 0.45, glitter: '#d6ecff', sticker: 'heart' },
];
export const LIP_COLORS = ['#e0628c', '#ff8fb1', '#cf7f8b', '#a8234d', '#e8664f', '#c43b3b', '#b06ad8', '#f2a3a0'];

/* merge a person's features with a look into the flat object the painter reads */
export function faceParams(person, look, lipOverride) {
  const L = look || LOOKS[0], lip = lipOverride || L.lip;
  return {
    ...person,
    shadow: L.shadow, shadowAmt: L.shadowAmt ?? 1, wing: L.wing ?? 1,
    crease: person.crease, blush: L.blush, blushAmt: L.blushAmt ?? 0.5,
    lip: [shade(lip, -0.14), shade(lip, 0.24)], lipLine: shade(lip, -0.42),
    glitter: L.glitter || null, freckles: !!L.freckles, sticker: L.sticker || null,
  };
}

function eyeCurves(k) {
  const N = 30, up = [], lo = [], I = [-100, 8], O = [102, -10];
  for (let i = 0; i <= N; i++) {
    const s = i / N, x = lerp(I[0], O[0], s), b = lerp(I[1], O[1], s);
    const U = b - 72 * Math.sin(Math.PI * Math.pow(s, 0.85)) * (1 - 0.12 * s);
    const L = b + 42 * Math.sin(Math.PI * Math.pow(s, 1.2));
    const C = b + 24 * Math.sin(Math.PI * s);
    up.push([x, lerp(U, C, k)]); lo.push([x, lerp(L, C, k)]);
  }
  return { up, lo };
}
function softEllipse(g, cx, cy, rx, ry, col, stops, rot = 0) {   // soft-edged ellipse (no canvas blur filter)
  g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(1, ry / rx);
  const rg = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  for (const [t, a] of stops) rg.addColorStop(t, hexA(col, a));
  g.fillStyle = rg; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
}
function drawEye(g, o, cx, cy, sx, k) {
  g.save(); g.translate(cx, cy); g.scale(sx, 1);
  const { up, lo } = eyeCurves(k), N = up.length - 1, open = eyeCurves(0).up, sa = o.shadowAmt;
  softEllipse(g, 16, -58, 124, 50, o.shadow, [[0, .6 * sa], [.55, .32 * sa], [1, 0]], -0.05);
  if (k < .6) { g.strokeStyle = hexA(o.crease, .32); g.lineWidth = 3.5; g.beginPath(); for (let i = 3; i <= N - 2; i++) g.lineTo(open[i][0] * 1.02, open[i][1] - 25 - 6 * Math.sin(Math.PI * i / N)); g.stroke(); }
  if (k < 0.97) {
    g.save(); g.beginPath();
    for (const p of up) g.lineTo(p[0], p[1]);
    for (let i = N; i >= 0; i--) g.lineTo(lo[i][0], lo[i][1]);
    g.closePath(); g.clip();
    g.fillStyle = '#fbf5f3'; g.fillRect(-130, -110, 260, 220);
    const cs = g.createRadialGradient(0, 0, 40, 0, 0, 110); cs.addColorStop(0, 'rgba(200,150,150,0)'); cs.addColorStop(1, 'rgba(190,130,130,.45)');
    g.fillStyle = cs; g.fillRect(-130, -110, 260, 220);
    const ix = 6, iy = 4 + k * 12, ir = 57;
    const ig = g.createRadialGradient(ix, iy + 14, 6, ix, iy, ir);
    ig.addColorStop(0, o.iris[0]); ig.addColorStop(.45, o.iris[1]); ig.addColorStop(.86, o.iris[2]); ig.addColorStop(1, '#170a05');
    g.fillStyle = ig; g.beginPath(); g.arc(ix, iy, ir, 0, TAU); g.fill();
    g.strokeStyle = hexA(o.iris[3], .28); g.lineWidth = 2.2;
    for (let a = 0; a < TAU; a += TAU / 44) { g.beginPath(); g.moveTo(ix + Math.cos(a) * 26, iy + Math.sin(a) * 26); g.lineTo(ix + Math.cos(a) * 51, iy + Math.sin(a) * 51); g.stroke(); }
    const lg = g.createLinearGradient(0, iy, 0, iy + ir); lg.addColorStop(0, hexA(o.iris[3], 0)); lg.addColorStop(1, hexA(o.iris[3], .7));
    g.fillStyle = lg; g.beginPath(); g.arc(ix, iy, ir - 5, 0, Math.PI); g.fill();
    g.fillStyle = '#100502'; g.beginPath(); g.arc(ix, iy, 24, 0, TAU); g.fill();
    const ts = g.createLinearGradient(0, -80, 0, 12); ts.addColorStop(0, 'rgba(50,15,8,.85)'); ts.addColorStop(1, 'rgba(50,15,8,0)');
    g.fillStyle = ts; g.fillRect(-130, -110, 260, 122);
    const hx = -22 * sx;
    g.fillStyle = 'rgba(255,255,255,.96)'; g.beginPath(); g.ellipse(ix + hx, iy - 19, 17, 14, -0.3 * sx, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.88)'; g.beginPath(); g.arc(ix - hx * 0.95, iy + 21, 7.5, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 5; g.beginPath(); g.arc(ix, iy, 42, 0.35 * Math.PI, 0.75 * Math.PI); g.stroke();
    g.restore();
  }
  // thick upper lash line + wing (wing length comes from the look)
  const wg = o.wing;
  g.fillStyle = o.lash; g.beginPath();
  for (let i = 0; i <= N; i++) { const s = i / N, t = lerp(6, 20, Math.pow(s, 1.2)); g.lineTo(up[i][0], up[i][1] - t * .8); }
  const L = up[N];
  g.lineTo(L[0] + 44 * wg, L[1] - 36 * wg + k * 46 * wg); g.lineTo(L[0] + 2, L[1] + 5);
  for (let i = N; i >= 0; i--) { const s = i / N, t = lerp(6, 20, Math.pow(s, 1.2)); g.lineTo(up[i][0], up[i][1] + t * .3 + 1); }
  g.closePath(); g.fill();
  g.fillStyle = o.lash;
  for (let s = 0.3; s <= 1.0001; s += 0.0875) {
    const i = Math.round(s * N), p = up[i], ang = lerp(-1.85, -0.5, s), len = lerp(22, 42, Math.pow(s, 0.8)), wb = lerp(7, 10, s);
    const dir = k > .5 ? [Math.cos(-ang), Math.sin(-ang) * .5] : [Math.cos(ang), Math.sin(ang)];
    const nx = -dir[1], ny = dir[0], tx = p[0] + dir[0] * len + 10, ty = p[1] + dir[1] * len - 2;
    const mx = p[0] + dir[0] * len * .5 + 7, my = p[1] + dir[1] * len * .55 + 3;
    g.beginPath(); g.moveTo(p[0] - nx * wb / 2, p[1] - 6 - ny * wb / 2);
    g.quadraticCurveTo(mx - nx * wb * .35, my - ny * wb * .35, tx, ty);
    g.quadraticCurveTo(mx + nx * wb * .25, my + ny * wb * .25, p[0] + nx * wb / 2, p[1] - 6 + ny * wb / 2); g.fill();
  }
  if (k < .6) {
    g.strokeStyle = hexA(o.lash, .5); g.lineWidth = 3; g.beginPath();
    for (let i = Math.round(N * .4); i <= N; i++) g.lineTo(lo[i][0], lo[i][1] + 2);
    g.stroke();
    g.lineWidth = 2.4;
    for (const s of [.62, .76, .9]) { const p = lo[Math.round(s * N)]; g.beginPath(); g.moveTo(p[0], p[1] + 2); g.lineTo(p[0] + 6, p[1] + 13); g.stroke(); }
  }
  g.restore();
}
function drawBrow(g, o, cx, cy, sx) {
  g.save(); g.translate(cx, cy); g.scale(sx, 1);
  const pts = [], N = 28;
  for (let i = 0; i <= N; i++) { const s = i / N; pts.push([lerp(-88, 118, s), -116 - 26 * Math.sin(Math.PI * Math.pow(s, .75)) + s * 16]); }
  const gr = g.createLinearGradient(-90, 0, 120, 0);
  gr.addColorStop(0, hexA(o.brow, .35)); gr.addColorStop(.25, hexA(o.brow, .82)); gr.addColorStop(1, hexA(o.brow, .9));
  g.fillStyle = gr; g.beginPath();
  for (let i = 0; i <= N; i++) { const s = i / N, t = lerp(21, 5, Math.pow(s, 1.1)); g.lineTo(pts[i][0], pts[i][1] - t * .55); }
  for (let i = N; i >= 0; i--) { const s = i / N, t = lerp(21, 5, Math.pow(s, 1.1)); g.lineTo(pts[i][0], pts[i][1] + t * .45); }
  g.closePath(); g.fill();
  g.strokeStyle = hexA(o.brow, .5); g.lineWidth = 1.8;
  for (let i = 1; i < N; i++) { const p = pts[i], t = lerp(16, 4, i / N); g.beginPath(); g.moveTo(p[0] - 4, p[1] + t * .4); g.lineTo(p[0] + 6, p[1] - t * .5); g.stroke(); }
  g.restore();
}
function drawLips(g, o, cx, cy) {
  g.save(); g.translate(cx, cy);
  const up = new Path2D();
  up.moveTo(-88, 5); up.bezierCurveTo(-64, -12, -42, -31, -22, -29); up.bezierCurveTo(-10, -28, -4, -20, 0, -15);
  up.bezierCurveTo(4, -20, 10, -28, 22, -29); up.bezierCurveTo(42, -31, 64, -12, 88, 5);
  up.bezierCurveTo(50, 9, 22, 5, 0, 9); up.bezierCurveTo(-22, 5, -50, 9, -88, 5); up.closePath();
  const lo = new Path2D();
  lo.moveTo(-88, 5); lo.bezierCurveTo(-50, 9, -22, 7, 0, 10); lo.bezierCurveTo(22, 7, 50, 9, 88, 5);
  lo.bezierCurveTo(72, 36, 38, 52, 0, 52); lo.bezierCurveTo(-38, 52, -72, 36, -88, 5); lo.closePath();
  softEllipse(g, 0, 60, 66, 15, '#8c323c', [[0, .2], [1, 0]]);
  let gr = g.createLinearGradient(0, -30, 0, 10); gr.addColorStop(0, o.lip[1]); gr.addColorStop(1, o.lip[0]);
  g.fillStyle = gr; g.fill(up);
  gr = g.createLinearGradient(0, 5, 0, 52); gr.addColorStop(0, o.lip[0]); gr.addColorStop(.45, o.lip[1]); gr.addColorStop(1, o.lip[0]);
  g.fillStyle = gr; g.fill(lo);
  g.strokeStyle = hexA(o.lipLine, .85); g.lineWidth = 3.5; g.beginPath(); g.moveTo(-86, 5); g.bezierCurveTo(-50, 9, -22, 6, 0, 9.5); g.bezierCurveTo(22, 6, 50, 9, 86, 5); g.stroke();
  g.strokeStyle = hexA(o.lipLine, .3); g.lineWidth = 2; g.stroke(up); g.stroke(lo);
  const hg = g.createRadialGradient(-8, 26, 2, -8, 26, 40); hg.addColorStop(0, 'rgba(255,255,255,.95)'); hg.addColorStop(.5, 'rgba(255,255,255,.45)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hg; g.beginPath(); g.ellipse(-8, 26, 40, 12, -0.05, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-32, -12, 13, 5, -0.35, 0, TAU); g.fill(); g.beginPath(); g.ellipse(30, -13, 9, 4, 0.35, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(18, 30, 3.5, 0, TAU); g.fill();
  g.restore();
}
function heart(g, x, y, s, col) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.beginPath();
  g.moveTo(0, 9); g.bezierCurveTo(-16, -3, -8, -16, 0, -7); g.bezierCurveTo(8, -16, 16, -3, 0, 9); g.fill(); g.restore();
}
export const FL = { eyeX: 206, eyeY: 408, eyeS: 1.24, lipY: 668, lipS: 1.22, noseY: 566 };
function drawFace(g, o, k) {
  g.clearRect(0, 0, 1024, 1024);
  for (const sx of [-1, 1]) softEllipse(g, 512 + sx * 262, 566, 134, 90, o.blush, [[0, o.blushAmt], [.5, o.blushAmt * 0.48], [1, 0]], sx * -0.12);
  if (o.freckles) {
    const r = rng(5);
    for (let i = 0; i < 46; i++) { const sx = r() < .5 ? -1 : 1, x = 512 + sx * (90 + r() * 230), y = 500 + r() * 110 - Math.abs(x - 512) * 0.12; g.fillStyle = hexA(o.nose, .22 + r() * .2); g.beginPath(); g.arc(x, y, 3 + r() * 3.5, 0, TAU); g.fill(); }
  }
  g.lineCap = 'round'; g.strokeStyle = hexA(o.nose, .1); g.lineWidth = 12; g.beginPath(); g.moveTo(492, 445); g.quadraticCurveTo(485, 515, 492, FL.noseY - 10); g.stroke();
  g.strokeStyle = hexA(o.nose, .08); g.lineWidth = 6; g.stroke();
  softEllipse(g, 512, FL.noseY + 16, 48, 18, o.nose, [[0, .55], [1, 0]]);
  g.fillStyle = hexA(o.nose, .62); for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(512 + sx * 15, FL.noseY + 11, 7, 3.8, sx * .45, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(508, FL.noseY - 12, 11, 8, 0, 0, TAU); g.fill();
  g.save(); g.translate(512, FL.lipY); g.scale(FL.lipS, FL.lipS); drawLips(g, o, 0, 0); g.restore();
  for (const sx of [-1, 1]) {
    g.save(); g.translate(512 + sx * FL.eyeX, FL.eyeY); g.scale(FL.eyeS, FL.eyeS);
    drawBrow(g, o, 0, 12, sx); drawEye(g, o, 0, 0, sx, k);
    g.restore();
  }
  if (o.glitter) {
    const r = rng(12);
    for (const sx of [-1, 1]) for (let i = 0; i < 26; i++) {
      const a = r(), x = 512 + sx * (150 + a * 150), y = 470 + r() * 50 + a * 20;
      g.fillStyle = hexA(o.glitter, .55 + r() * .45); g.beginPath(); g.arc(x, y, 2 + r() * 4, 0, TAU); g.fill();
    }
  }
  if (o.sticker === 'heart') { heart(g, 512 + 360, 500, 1.6, '#ff6fa8'); heart(g, 512 + 395, 455, 1.0, '#ffb3d0'); }
}

/* res: canvas size (1024 for the player, 512 for computer models farther away) */
export function faceTextures(o, res = 1024) {
  const mk = k => canvasTex(res, res, g => { g.scale(res / 1024, res / 1024); drawFace(g, o, k); });
  const rough = canvasTex(256, 256, g => {      // glossy eyes + lips via roughness map
    g.fillStyle = 'rgb(150,150,150)'; g.fillRect(0, 0, 256, 256);
    g.scale(0.25, 0.25);
    g.fillStyle = 'rgb(40,40,40)';
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(512 + sx * FL.eyeX, FL.eyeY, 124, 68, 0, 0, TAU); g.fill(); }
    g.fillStyle = 'rgb(50,50,50)'; g.beginPath(); g.ellipse(512, FL.lipY + 12, 108, 50, 0, 0, TAU); g.fill();
  }, { srgb: false });
  return { open: mk(0), half: mk(0.55), shut: mk(1), rough };
}

/* small square preview of a look for the makeup menu (draws the eye + lips region) */
export function lookPreview(person, look, size = 120) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), o = faceParams(person, look);
  g.fillStyle = person.skin; g.fillRect(0, 0, size, size);
  g.scale(size / 620, size / 620); g.translate(-202, -210);
  drawFace(g, o, 0);
  return c.toDataURL();
}
