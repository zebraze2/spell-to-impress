/* HTML overlay: banner, nameplates, the "Spell it!" bubble, spelling card, colour / hair / makeup panels. */
import { dictate, sayWord, stopAudio, sayPattern } from './spell.js';

const $ = id => document.getElementById(id);
const SPEAKER = '<svg viewBox="0 0 24 24"><path d="M4 9.2h3.4L12 5v14l-4.6-4.2H4z" fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M15.2 9.2c1.1 1.6 1.1 4 0 5.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
const HANGER = '<svg viewBox="0 0 32 32"><path d="M16 9.5a2.6 2.6 0 1 1 2.6-2.6c0 1.5-1.4 2-2.3 2.8L16 10l-11.8 9.1a1.6 1.6 0 0 0 1 2.9h21.6a1.6 1.6 0 0 0 1-2.9L16 10" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SPARK = '<svg viewBox="0 0 24 24"><path d="M12 1C13 8 16 11 23 12 16 13 13 16 12 23 11 16 8 13 1 12 8 11 11 8 12 1Z" fill="#fff"/></svg>';
const LOCK = '<span class="lock"><svg viewBox="0 0 12 12"><rect x="2" y="5.2" width="8" height="5.8" rx="1.4" fill="#fff"/><path d="M3.9 5.4V4a2.1 2.1 0 0 1 4.2 0v1.4" fill="none" stroke="#fff" stroke-width="1.5"/></svg></span>';
export const heartSVG = c => `<svg viewBox="0 0 32 30"><path d="M16 28C5 20 1 14 1 9a7.5 7.5 0 0 1 15-2 7.5 7.5 0 0 1 15 2c0 5-4 11-15 19z" fill="${c}" stroke="rgba(120,40,80,.25)"/><ellipse cx="9" cy="8" rx="3.2" ry="2.2" fill="rgba(255,255,255,.6)" transform="rotate(-30 9 8)"/></svg>`;

export const UI = {
  /* something is open on top of the game (read from the page, so nested cards can't get out of step) */
  get busy() { return ['spellCard', 'panel', 'startCard', 'endCard'].some(id => !$(id).hidden); },
  toast(msg, ms = 2400) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), ms); },
  setTimer(sec) { const c = $('clock'); c.textContent = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); $('timer').classList.toggle('low', sec <= 30); },
  setScore(right, tries) { $('score').innerHTML = `Spelled <b>${right}</b> of <b>${tries}</b> on the first try`; },
  setLevel(level, theme) { $('levelName').textContent = `Level ${level.n} · ${level.title}`; $('themeName').textContent = theme.name; },
  plate(name, title, me) {
    const el = document.createElement('div'); el.className = 'plate' + (me ? ' me' : '');
    el.innerHTML = `<div class="n">${name}</div><div class="tt">${title}</div>`; $('plates').appendChild(el); return el;
  },
  pin(el, s, dy = 0) { if (!s.ok) { el.style.visibility = 'hidden'; return; } el.style.visibility = 'visible'; el.style.transform = `translate(${s.x}px,${s.y + dy}px) translate(-50%,-100%)`; },
  bubble(s, label, owned) {
    const b = $('bubble');
    if (!s || !s.ok || UI.busy) { b.classList.remove('on'); return; }
    b.classList.add('on'); b.classList.toggle('owned', !!owned);
    if (b._label !== label) { b.querySelector('.lbl').textContent = label; b.querySelector('.ic').innerHTML = owned ? HANGER : SPEAKER; b._label = label; }
    b.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-100%)`;
  },
  sparkle(x, y, n = 14) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div'); s.className = 'spk-fx'; s.innerHTML = SPARK;
      const a = i / n * Math.PI * 2 + Math.random() * 0.4, r = 70 + Math.random() * 110;
      Object.assign(s.style, { position: 'absolute', left: x + 'px', top: (y - 30 + Math.random() * 60) + 'px', width: '24px', height: '24px', margin: '-12px 0 0 -12px', pointerEvents: 'none' });
      s.animate([{ transform: 'translate(0,0) scale(.2) rotate(0deg)', opacity: 0 }, { opacity: 1, offset: 0.25 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r * 1.2}px) scale(${0.6 + Math.random() * 0.8}) rotate(90deg)`, opacity: 0 }],
        { duration: 900, delay: Math.random() * 120, easing: 'ease-out', fill: 'forwards' });
      $('ui').appendChild(s); setTimeout(() => s.remove(), 1200);
    }
  },
};

/* ---------------- spelling card ---------------- */
function revealHTML(word) {
  const w = word.w, t = word.team, i = t ? w.indexOf(t) : -1;
  if (i < 0) return w;
  return `${w.slice(0, i)}<span class="team${word.heart ? ' heart' : ''}">${w.slice(i, i + t.length)}</span>${w.slice(i + t.length)}`;
}
/* cb: { onFirst(right) – scored try, onEarn() – item earned, onClose(earned) } */
UI.spell = (word, forName, cb) => {
  const card = $('spellCard'), input = $('spellInput'), prompt = $('spellPrompt'), reveal = $('spellReveal'), speak = $('spellSpeak');
  card.hidden = false; card.querySelector('.card').classList.remove('right'); card.querySelector('.row').style.visibility = '';
  $('spellFor').textContent = 'for the ' + forName;
  reveal.hidden = true; input.hidden = false; input.value = ''; prompt.textContent = 'Listen, then spell the word.';
  let state = 'ask', first = true;
  const play = () => { speak.classList.add('playing'); dictate(word).then(() => speak.classList.remove('playing')); };
  setTimeout(() => input.focus(), 50);
  play();
  const close = earned => {
    stopAudio(); card.hidden = true;
    input.onkeydown = speak.onclick = $('spellCheck').onclick = $('spellCancel').onclick = null;
    if (earned) cb.onEarn(); cb.onClose && cb.onClose(earned);
  };
  const check = () => {
    if (state === 'show' || state === 'done') return;
    const guess = input.value.trim().toLowerCase();
    if (!guess) { input.focus(); return; }
    const right = guess === word.w;
    if (first) { cb.onFirst(right); first = false; }
    if (right) {
      state = 'done';
      card.querySelector('.card').classList.add('right');
      reveal.innerHTML = revealHTML(word); reveal.hidden = false; input.hidden = true;
      card.querySelector('.row').style.visibility = 'hidden';
      prompt.textContent = word.heart ? 'Yes! (that one is a heart word)' : 'Yes! You spelled it!';
      sayWord(word);
      setTimeout(() => close(true), 1400);
      return;
    }
    // corrected test: look at it, hear it, then write it again from memory
    state = 'show';
    input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
    reveal.innerHTML = revealHTML(word); reveal.hidden = false; input.hidden = true;
    prompt.textContent = word.heart ? 'It is spelled like this. The purple part is the tricky part.' : 'It is spelled like this. Look at the pink letters.';
    sayWord(word);
    setTimeout(() => {
      state = 'retype'; reveal.hidden = true; input.hidden = false; input.value = '';
      prompt.textContent = 'Now spell it from memory.'; input.focus();
    }, 2800);
  };
  input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); check(); } e.stopPropagation(); };
  input.oninput = () => { input.value = input.value.replace(/[^a-zA-Z]/g, '').toLowerCase(); };
  speak.onclick = play;
  $('spellCheck').onclick = check;
  $('spellCancel').onclick = () => close(false);
};

/* ---------------- side panel (colours, hair, makeup) ---------------- */
function openPanel(title, onDone) {
  const p = $('panel'); p.hidden = false; $('panelTitle').textContent = title;
  $('panelA').innerHTML = ''; $('panelB').innerHTML = '';
  $('panelDone').onclick = () => { if (!$('spellCard').hidden) return; p.hidden = true; onDone(); };
}
function hearts(host, colors, sel, onPick) {
  const h = document.createElement('div'); h.className = 'hearts';
  for (const c of colors) {
    const b = document.createElement('button'); b.type = 'button'; b.innerHTML = heartSVG(c); b.title = c;
    if (c === sel) b.classList.add('sel');
    b.onclick = () => { h.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); onPick(c); };
    h.appendChild(b);
  }
  host.appendChild(h);
}
/* a choice button that may be locked: tapping a locked one asks for a spelled word first.
   gate = { owned(it) -> bool, earn(it, done(ok)) } */
function choice(group, b, it, gate, pick) {
  const lock = () => { if (gate && !gate.owned(it)) { b.classList.add('locked'); b.insertAdjacentHTML('beforeend', LOCK); } };
  lock();
  b.onclick = () => {
    const take = () => { group.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); pick(it); };
    if (gate && !gate.owned(it)) gate.earn(it, ok => { if (!ok) return; b.classList.remove('locked'); b.querySelector('.lock')?.remove(); take(); });
    else take();
  };
}
function chips(host, items, sel, label, onPick, gate) {
  const c = document.createElement('div'); c.className = 'chips';
  for (const it of items) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label(it);
    if (it === sel) b.classList.add('sel');
    choice(c, b, it, gate, onPick);
    c.appendChild(b);
  }
  host.appendChild(c);
}
const h3 = (host, t) => { const e = document.createElement('h3'); e.textContent = t; host.appendChild(e); };
const note = (host, t) => { const e = document.createElement('p'); e.className = 'pnote'; e.textContent = t; host.appendChild(e); };

UI.colors = (item, palette, prints, onDone) => {
  openPanel(item.def.name, onDone);
  h3($('panelA'), 'Color');
  hearts($('panelA'), palette, item.color, c => item.setColor(c));
  if (item.def.printable) {
    h3($('panelB'), 'Pattern');
    chips($('panelB'), prints, item.print || 'solid', p => p[0].toUpperCase() + p.slice(1), p => item.setColor(item.color, p));
  }
};
UI.hair = (styles, colors, cur, onPick, onDone, gate) => {
  openPanel('Hair salon', onDone);
  h3($('panelA'), 'Style');
  chips($('panelA'), styles, cur.style, s => s.name, s => { cur.style = s; onPick(cur); }, gate);
  if (gate) note($('panelA'), 'Spell a word to unlock a new style.');
  h3($('panelB'), 'Color');
  hearts($('panelB'), colors.map(c => c.mid), cur.color.mid, m => { cur.color = colors.find(c => c.mid === m); onPick(cur); });
};
UI.makeup = (looks, lips, cur, onPick, onDone, gate) => {
  openPanel('Makeup', onDone);
  h3($('panelA'), 'Look');
  const t = document.createElement('div'); t.className = 'tiles';
  for (const L of looks) {
    const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `<img src="${L.preview}" alt="">${L.name}`;
    if (L === cur.look) b.classList.add('sel');
    choice(t, b, L, gate, () => { cur.look = L; cur.lip = null; onPick(cur); });
    t.appendChild(b);
  }
  $('panelA').appendChild(t);
  if (gate) note($('panelA'), 'Spell a word to unlock a new look.');
  h3($('panelB'), 'Lip color');
  hearts($('panelB'), lips, cur.lip, c => { cur.lip = c; onPick(cur); });
};

/* ---------------- start + end cards ---------------- */
UI.start = (level, theme, onGo) => {
  $('startKicker').textContent = `Level ${level.n} · ${level.wing}`;
  $('startTitle').textContent = level.title;
  $('startTeach').textContent = level.teach;
  $('startPoints').innerHTML = level.points.map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join('');
  $('startTheme').textContent = theme.name;
  $('startCard').hidden = false;
  $('startListen').onclick = () => sayPattern(level);
  $('startGo').onclick = () => { stopAudio(); $('startCard').hidden = true; onGo(); };
};
UI.end = (text, next, onAgain) => {
  $('bubble').classList.remove('on');
  $('endText').innerHTML = text; $('endNext').innerHTML = next; $('endCard').hidden = false;
  $('endAgain').onclick = onAgain;
};
UI.loaded = () => { const l = $('loading'); if (!l) return; l.classList.add('gone'); setTimeout(() => l.remove(), 700); };
