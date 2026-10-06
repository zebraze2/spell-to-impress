/* Canvas-painted textures: room surfaces, fabric prints (re-tintable), hair strands, sparkles. */
import * as THREE from 'three';
import { TAU, rng, canvasTex, hexA, shade } from './util.js?v=2271898f';

export const TEX = {};

TEX.wood = canvasTex(1024, 1024, (g, w, h) => {
  const r = rng(7), cols = 8, pw = w / cols;
  for (let c = 0; c < cols; c++) {
    let y = -r() * 400;
    while (y < h) {
      const len = 380 + r() * 520, hue = 21 + r() * 7, l = 57 + r() * 8, s = 27 + r() * 9;
      g.fillStyle = `hsl(${hue},${s}%,${l}%)`; g.fillRect(c * pw, y, pw, len);
      for (let k = 0; k < 26; k++) {
        const x = c * pw + r() * pw; g.strokeStyle = `hsla(${hue - 4},${s + 8}%,${l - 14 - r() * 10}%,${0.10 + r() * 0.16})`;
        g.lineWidth = 0.6 + r() * 1.6; g.beginPath(); g.moveTo(x, y);
        for (let yy = y; yy < y + len; yy += 24) g.lineTo(x + Math.sin(yy * 0.012 + k) * (2 + r() * 3), yy);
        g.stroke();
      }
      const gr = g.createLinearGradient(c * pw, 0, c * pw + pw, 0);
      gr.addColorStop(0, 'rgba(255,240,225,.10)'); gr.addColorStop(.5, 'rgba(255,240,225,0)'); gr.addColorStop(1, 'rgba(60,25,10,.10)');
      g.fillStyle = gr; g.fillRect(c * pw, y, pw, len);
      g.fillStyle = 'rgba(70,35,20,.55)'; g.fillRect(c * pw, y + len - 2, pw, 3);
      y += len;
    }
    g.fillStyle = 'rgba(70,35,20,.6)'; g.fillRect(c * pw, 0, 2.5, h);
  }
}, { repeat: [7, 5] });

TEX.rug = canvasTex(1024, 1024, (g, w) => {
  const c = w / 2, r = rng(3);
  g.fillStyle = '#f4b3c8'; g.fillRect(0, 0, w, w);
  const rad = g.createRadialGradient(c, c, 0, c, c, c);
  rad.addColorStop(0, '#ffd2e0'); rad.addColorStop(.55, '#f8bdd0'); rad.addColorStop(1, '#ef9fbb');
  g.fillStyle = rad; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
  g.fillStyle = '#fff1f6';
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; g.beginPath(); g.arc(c + Math.cos(a) * 452, c + Math.sin(a) * 452, 34, 0, TAU); g.fill(); }
  g.fillStyle = '#f7b5ca'; g.beginPath(); g.arc(c, c, 440, 0, TAU); g.fill();
  g.strokeStyle = '#fff1f6'; g.lineWidth = 7; g.beginPath(); g.arc(c, c, 405, 0, TAU); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(c, c, 392, 0, TAU); g.stroke();
  g.fillStyle = '#ffe6ef';
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * TAU, x = c + Math.cos(a) * 350, y = c + Math.sin(a) * 350;
    g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.beginPath();
    g.moveTo(0, 9); g.bezierCurveTo(-16, -3, -8, -16, 0, -7); g.bezierCurveTo(8, -16, 16, -3, 0, 9); g.fill(); g.restore();
  }
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 4; g.beginPath(); g.arc(c, c, 300, 0, TAU); g.stroke();
  for (let i = 0; i < 26000; i++) { const x = r() * w, y = r() * w; g.fillStyle = r() < .5 ? 'rgba(255,255,255,.10)' : 'rgba(190,80,120,.07)'; g.fillRect(x, y, 2, 2); }
});

TEX.straw = canvasTex(256, 256, (g, w) => {
  const r = rng(5); g.fillStyle = '#d9b36e'; g.fillRect(0, 0, w, w);
  const cs = 32;
  for (let y = 0; y < w; y += cs) for (let x = 0; x < w; x += cs) {
    const hor = ((x + y) / cs) % 2 === 0;
    for (let k = 0; k < 3; k++) {
      const gr = hor ? g.createLinearGradient(0, y + k * cs / 3, 0, y + (k + 1) * cs / 3) : g.createLinearGradient(x + k * cs / 3, 0, x + (k + 1) * cs / 3, 0);
      gr.addColorStop(0, '#b98d4c'); gr.addColorStop(.35, '#f3dba4'); gr.addColorStop(.7, '#e4c487'); gr.addColorStop(1, '#a87c3e');
      g.fillStyle = gr;
      if (hor) g.fillRect(x + 1, y + k * cs / 3 + .5, cs - 2, cs / 3 - 1); else g.fillRect(x + k * cs / 3 + .5, y + 1, cs / 3 - 1, cs - 2);
    }
  }
  for (let i = 0; i < 500; i++) { g.strokeStyle = r() < .5 ? 'rgba(255,245,215,.25)' : 'rgba(120,80,30,.2)'; g.lineWidth = .7; const x = r() * w, y = r() * w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 14, y + (r() - .5) * 14); g.stroke(); }
}, { repeat: [1, 1] });

TEX.leaf = canvasTex(256, 512, (g, w, h) => {      // pinnate palm frond: tip at the top of the texture
  g.clearRect(0, 0, w, h);
  const cx = w / 2, r = rng(17);
  for (let y = h - 30; y > 14; y -= 13) {
    const t = 1 - y / h, L = 118 * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)) + 8;
    for (const s of [-1, 1]) {
      const ang = s * (0.62 + 0.25 * t) + (r() - .5) * 0.08, ex = cx + s * 3 + Math.sin(ang) * L, ey = y - Math.cos(ang) * L * 0.62;
      const gr = g.createLinearGradient(cx, y, ex, ey); gr.addColorStop(0, '#2f7a48'); gr.addColorStop(.5, '#58aa62'); gr.addColorStop(1, '#3d8a50');
      g.fillStyle = gr; g.beginPath(); g.moveTo(cx + s * 2, y + 3);
      g.quadraticCurveTo((cx + ex) / 2 + s * 4, (y + ey) / 2 + 9, ex, ey);
      g.quadraticCurveTo((cx + ex) / 2 - s * 2, (y + ey) / 2 - 4, cx + s * 2, y - 6); g.fill();
      g.strokeStyle = 'rgba(205,245,190,.45)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, y); g.quadraticCurveTo((cx + ex) / 2 + s * 2, (y + ey) / 2 + 2, ex, ey); g.stroke();
    }
  }
  g.strokeStyle = '#6aa865'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, h); g.lineTo(cx, 10); g.stroke();
});

TEX.sparkle = canvasTex(128, 128, (g, w) => {
  const c = w / 2, rg = g.createRadialGradient(c, c, 0, c, c, c);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(.12, 'rgba(255,245,252,.9)'); rg.addColorStop(.35, 'rgba(255,200,230,.25)'); rg.addColorStop(1, 'rgba(255,200,230,0)');
  g.fillStyle = rg; g.fillRect(0, 0, w, w);
  g.fillStyle = 'rgba(255,255,255,.95)';
  for (const rot of [0, Math.PI / 2]) { g.save(); g.translate(c, c); g.rotate(rot); g.beginPath(); g.moveTo(-c, 0); g.quadraticCurveTo(0, -5, c, 0); g.quadraticCurveTo(0, 5, -c, 0); g.fill(); g.restore(); }
});
TEX.glow = canvasTex(128, 128, (g, w) => {
  const c = w / 2, rg = g.createRadialGradient(c, c, 0, c, c, c);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(.3, 'rgba(255,240,230,.55)'); rg.addColorStop(1, 'rgba(255,230,220,0)');
  g.fillStyle = rg; g.fillRect(0, 0, w, w);
});
TEX.blob = canvasTex(128, 128, (g, w) => {
  const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(70,25,40,.5)'); rg.addColorStop(.5, 'rgba(70,25,40,.2)'); rg.addColorStop(1, 'rgba(70,25,40,0)');
  g.fillStyle = rg; g.fillRect(0, 0, w, w);
});
TEX.stripe = canvasTex(256, 256, (g, w) => {
  g.fillStyle = '#f6d3d9'; g.fillRect(0, 0, w, w);
  for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(x, 0, 12, w); g.fillStyle = 'rgba(214,150,170,.18)'; g.fillRect(x + 12, 0, 2, w); }
}, { repeat: [3, 3] });
TEX.damask = canvasTex(256, 256, (g, w) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, w);
  const motif = (cx, cy, sc) => {
    g.save(); g.translate(cx, cy); g.scale(sc, sc);
    g.fillStyle = 'rgba(214,170,170,.16)';
    g.beginPath(); g.moveTo(0, -46); g.bezierCurveTo(18, -30, 22, -8, 0, 8); g.bezierCurveTo(-22, -8, -18, -30, 0, -46); g.fill();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(s * 30, -6, s * 44, 14, s * 26, 30); g.bezierCurveTo(s * 18, 18, s * 10, 14, 0, 18); g.fill(); }
    g.beginPath(); g.ellipse(0, 30, 6, 12, 0, 0, TAU); g.fill();
    g.restore();
  };
  for (const [x, y] of [[64, 64], [192, 192], [192 - 256, 192], [64 + 256, 64], [64, 64 + 256], [192, 192 - 256]]) motif(x, y, 0.95);
}, { repeat: [0.42, 0.42] });
TEX.mirror = canvasTex(256, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, '#f3f6fb'); gr.addColorStop(.45, '#d9e2ef'); gr.addColorStop(.55, '#eef3fa'); gr.addColorStop(1, '#c9d4e4');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 10;
  for (const x of [60, 95]) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 90, 200); g.stroke(); }
});

/* -------- fabric prints (re-tintable: every print is generated from a base colour) -------- */
const PRINT_CACHE = new Map();
function mkPrint(key, fn) { let t = PRINT_CACHE.get(key); if (!t) PRINT_CACHE.set(key, t = fn()); return t; }

function floral(base, seed = 11) {
  const light = new THREE.Color(base).getHSL({}).l > 0.6;
  const petal = light ? '#ffffff' : shade(base, 0.55), center = '#ffd54a', leaf = '#7fbf8a';
  return canvasTex(512, 512, (g, w) => {
    const r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 1400; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(60,20,40,.04)'; g.fillRect(r() * w, r() * w, 2, 2); }
    const flower = (x, y, s, rot, col, cc) => {
      for (const ox of [-w, 0, w]) for (const oy of [-w, 0, w]) {
        const X = x + ox, Y = y + oy; if (X < -30 || X > w + 30 || Y < -30 || Y > w + 30) continue;
        g.save(); g.translate(X, Y); g.rotate(rot);
        g.fillStyle = leaf; g.beginPath(); g.ellipse(s * 1.25, s * .55, s * .6, s * .25, .6, 0, TAU); g.fill();
        g.fillStyle = col;
        for (let k = 0; k < 5; k++) { g.rotate(TAU / 5); g.beginPath(); g.ellipse(0, -s * .62, s * .42, s * .6, 0, 0, TAU); g.fill(); }
        g.fillStyle = cc; g.beginPath(); g.arc(0, 0, s * .32, 0, TAU); g.fill();
        g.restore();
      }
    };
    for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 8; gx++) {
      const x = (gx + .5 + (gy % 2) * .5) * 64 + (r() - .5) * 26, y = (gy + .5) * 64 + (r() - .5) * 26;
      if (r() < .62) flower(x, y, 9 + r() * 4, r() * TAU, petal, center);
      else flower(x, y, 6 + r() * 2, r() * TAU, center, '#fff6c8');
    }
  }, { repeat: [1, 1] });
}
function dots(base) {
  const dot = new THREE.Color(base).getHSL({}).l > 0.7 ? shade(base, -0.35) : '#ffffff';
  return canvasTex(256, 256, (g, w) => {
    g.fillStyle = base; g.fillRect(0, 0, w, w);
    g.fillStyle = dot;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(x * 64 + 32 + (y % 2) * 32, y * 64 + 32, 11, 0, TAU); g.fill(); }
    for (const ox of [-256, 256]) for (let y = 1; y < 4; y += 2) { g.beginPath(); g.arc(ox + 3 * 64 + 32 + 32, y * 64 + 32, 11, 0, TAU); g.fill(); }
  }, { repeat: [1, 1] });
}
function gingham(base) {
  return canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, w);
    g.fillStyle = hexA(base, 0.55);
    for (let i = 0; i < 4; i++) { g.fillRect(i * 64, 0, 32, w); g.fillRect(0, i * 64, w, 32); }
    g.fillStyle = hexA(shade(base, -0.15), 0.5);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.fillRect(i * 64, j * 64, 32, 32);
  }, { repeat: [1, 1] });
}
function stripes(base) {
  return canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#fffaf6'; g.fillRect(0, 0, w, w);
    g.fillStyle = base;
    for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 30, w);
  }, { repeat: [1, 1] });
}
function sparkleFabric(base) {
  return canvasTex(512, 512, (g, w) => {
    const r = rng(21); g.fillStyle = base; g.fillRect(0, 0, w, w);
    const light = shade(base, 0.45);
    for (let i = 0; i < 2600; i++) { const a = r(); g.fillStyle = a < .7 ? hexA(light, .15 + r() * .3) : `rgba(255,255,255,${.3 + r() * .5})`; const s = r() < .9 ? 1.5 : 2.5; g.fillRect(r() * w, r() * w, s, s); }
  }, { repeat: [3, 2] });
}
function denim(base) {
  return canvasTex(256, 256, (g, w) => {
    const r = rng(4); g.fillStyle = base; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 3000; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,30,.08)'; g.fillRect(r() * w, r() * w, 3, 1); }
    for (let x = -w; x < w; x += 6) { g.strokeStyle = 'rgba(255,255,255,.05)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, w); g.stroke(); }
  }, { repeat: [2, 2] });
}
function knit(base) {
  return canvasTex(256, 256, (g, w) => {
    g.fillStyle = base; g.fillRect(0, 0, w, w);
    const dk = hexA(shade(base, -0.25), 0.35), lt = hexA(shade(base, 0.3), 0.35);
    for (let y = 0; y < w; y += 16) for (let x = 0; x < w; x += 16) {
      g.strokeStyle = dk; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 2, y + 2); g.lineTo(x + 8, y + 14); g.lineTo(x + 14, y + 2); g.stroke();
      g.strokeStyle = lt; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 3, y + 1); g.lineTo(x + 8, y + 11); g.stroke();
    }
  }, { repeat: [3, 3] });
}

export const PRINTS = ['solid', 'floral', 'dots', 'gingham', 'stripes', 'sparkle'];
export function printTex(kind, base) {
  if (!kind || kind === 'solid') return null;
  const fn = { floral, dots, gingham, stripes, sparkle: sparkleFabric, denim, knit }[kind];
  return fn ? mkPrint(kind + base, () => fn(base)) : null;
}

/* hair strand texture: dark roots, coloured lengths, a glossy sheen band */
export function hairTex({ base, mid, hi, band = [0.10, 0.26], seed = 1 }) {
  return canvasTex(256, 512, (g, w, h) => {
    const r = rng(seed);
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, base); gr.addColorStop(.5, mid); gr.addColorStop(1, base);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) {
      const x = r() * w, light = r();
      g.strokeStyle = light < .45 ? `rgba(0,0,0,${.10 + r() * .16})` : light < .85 ? hexA(mid, .30 + r() * .35) : hexA(hi, .28 + r() * .35);
      g.lineWidth = .6 + r() * 2.2; g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y * .02 + i) * 2.5, y);
      g.stroke();
    }
    const y0 = band[0] * h, y1 = band[1] * h, b = g.createLinearGradient(0, y0, 0, y1);
    b.addColorStop(0, hexA(hi, 0)); b.addColorStop(.5, hexA(hi, .55)); b.addColorStop(1, hexA(hi, 0));
    g.fillStyle = b; g.fillRect(0, y0, w, y1 - y0);
    for (let i = 0; i < 90; i++) { g.strokeStyle = 'rgba(255,255,255,' + (.10 + r() * .22) + ')'; g.lineWidth = .7; const x = r() * w; g.beginPath(); g.moveTo(x, y0 + (y1 - y0) * .2); g.lineTo(x, y1 - (y1 - y0) * .2); g.stroke(); }
  }, { repeat: [1, 1] });
}
