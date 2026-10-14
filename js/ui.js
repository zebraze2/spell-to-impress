/* HTML overlay: banner, nameplates, the "Spell it!" bubble, spelling card, colour / hair / makeup panels. */
import { dictate, dictatePhrase, sayWord, stopAudio, sayPattern } from './spell.js?v=8bebf9f5';

const $ = id => document.getElementById(id);
const SPEAKER = '<svg viewBox="0 0 24 24"><path d="M4 9.2h3.4L12 5v14l-4.6-4.2H4z" fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M15.2 9.2c1.1 1.6 1.1 4 0 5.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
const HANGER = '<svg viewBox="0 0 32 32"><path d="M16 9.5a2.6 2.6 0 1 1 2.6-2.6c0 1.5-1.4 2-2.3 2.8L16 10l-11.8 9.1a1.6 1.6 0 0 0 1 2.9h21.6a1.6 1.6 0 0 0 1-2.9L16 10" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SPARK = '<svg viewBox="0 0 24 24"><path d="M12 1C13 8 16 11 23 12 16 13 13 16 12 23 11 16 8 13 1 12 8 11 11 8 12 1Z" fill="#fff"/></svg>';
const LOCK = '<span class="lock"><svg viewBox="0 0 12 12"><rect x="2" y="5.2" width="8" height="5.8" rx="1.4" fill="#fff"/><path d="M3.9 5.4V4a2.1 2.1 0 0 1 4.2 0v1.4" fill="none" stroke="#fff" stroke-width="1.5"/></svg></span>';
export const heartSVG = c => `<svg viewBox="0 0 32 30"><path d="M16 28C5 20 1 14 1 9a7.5 7.5 0 0 1 15-2 7.5 7.5 0 0 1 15 2c0 5-4 11-15 19z" fill="${c}" stroke="rgba(120,40,80,.25)"/><ellipse cx="9" cy="8" rx="3.2" ry="2.2" fill="rgba(255,255,255,.6)" transform="rotate(-30 9 8)"/></svg>`;

export const UI = {
  /* something is open on top of the game (read from the page, so nested cards can't get out of step) */
  get busy() { return ['spellCard', 'panel', 'startCard', 'endCard', 'homeCard', 'quizCard'].some(id => { const e = $(id); return e && !e.hidden; }); },
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
/* the word with its pattern letters highlighted (chunk can be one string or several) */
export function revealHTML(word) {
  const chunks = [].concat(word.chunk || word.team || []), w = word.w, marks = new Array(w.length).fill(false);
  for (const c of chunks) { const i = w.indexOf(c); if (i >= 0) for (let k = i; k < i + c.length; k++) marks[k] = true; }
  let out = '', open = false;
  for (let k = 0; k < w.length; k++) {
    if (marks[k] && !open) { out += `<span class="team${word.heart ? ' heart' : ''}">`; open = true; }
    if (!marks[k] && open) { out += '</span>'; open = false; }
    out += w[k];
  }
  return out + (open ? '</span>' : '');
}
function phraseHTML(p, words) {
  return p.split(' ').map(t => { const w = words.find(x => x.w === t); return w ? revealHTML(w) : t; }).join(' ');
}
/* The spelling card.
   mode 'word'   : hear it, spell the whole word
   mode 'fill'   : see the word with the new sound missing, type just those letters (scaffold)
   mode 'phrase' : hear a short phrase, spell all of it
   cb: { onFirst(right) – the scored first try, onEarn(), onClose(earned) } */
UI.spell = (word, forName, cb, { mode = 'word', phrase = '', words = [], quiz = false } = {}) => {
  const card = $('spellCard'), input = $('spellInput'), prompt = $('spellPrompt'), reveal = $('spellReveal'), speak = $('spellSpeak'), fillRow = $('spellFill');
  const target = mode === 'phrase' ? phrase : mode === 'fill' ? word.chunk : word.w;
  const nWords = mode === 'phrase' ? phrase.split(' ').length : 1;
  const ask = { word: 'Spell the missing word.', fill: 'Type the letters for the missing sound.', phrase: `Spell the whole phrase: ${nWords} words.` }[mode];
  // what to spell, made obvious without showing the spelling: the sentence with a blank, or one box per phrase word
  const cloze = $('spellCloze');
  if (mode === 'phrase') cloze.innerHTML = '<span class="pbox"></span>'.repeat(nWords);
  else cloze.innerHTML = word.s.replace(new RegExp('\\b' + word.w + '\\b', 'i'), '<span class="blank"></span>');
  card.hidden = false; card.querySelector('.card').classList.remove('right'); card.querySelector('.row').style.visibility = '';
  card.querySelector('.card').classList.toggle('wide', mode === 'phrase');
  $('spellFor').textContent = forName;
  input.maxLength = mode === 'phrase' ? 40 : 16;
  let state = 'ask', first = true, box = null;
  const showAsk = () => {
    reveal.hidden = true; prompt.textContent = state === 'retype' ? (mode === 'fill' ? 'Now fill it in again.' : 'Now spell it from memory.') : ask;
    if (mode === 'fill') {
      const i = word.w.indexOf(word.chunk);
      fillRow.innerHTML = `<span>${word.w.slice(0, i)}</span><input class="chunk" maxlength="3" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"><span>${word.w.slice(i + word.chunk.length)}</span>`;
      fillRow.hidden = false; input.hidden = true; box = fillRow.querySelector('input');
    } else { fillRow.hidden = true; input.hidden = false; input.value = ''; box = input; }
    box.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); check(); } e.stopPropagation(); };
    box.oninput = () => { box.value = mode === 'phrase' ? box.value.toLowerCase().replace(/[^a-z ]/g, '').replace(/ {2,}/g, ' ') : box.value.replace(/[^a-zA-Z]/g, '').toLowerCase(); };
    setTimeout(() => box.focus(), 50);
  };
  const play = () => {
    speak.classList.add('playing');
    (mode === 'phrase' ? dictatePhrase(phrase) : dictate(word, { fill: mode === 'fill' })).then(() => speak.classList.remove('playing'));
  };
  const showAnswer = () => { reveal.innerHTML = mode === 'phrase' ? phraseHTML(phrase, words) : revealHTML(word); reveal.hidden = false; input.hidden = true; fillRow.hidden = true; };
  showAsk(); play();
  // letters always land in the answer box, even if she clicked somewhere else on the screen
  const keyCatch = e => {
    if (card.hidden || !box || document.activeElement === box || state === 'show' || state === 'done') return;
    if (e.key.length === 1 && /[a-z ]/i.test(e.key)) { e.preventDefault(); box.focus(); box.value += e.key.toLowerCase(); box.oninput && box.oninput(); }
    else if (e.key === 'Backspace') { e.preventDefault(); box.focus(); box.value = box.value.slice(0, -1); }
    else if (e.key === 'Enter') { e.preventDefault(); check(); }
  };
  document.addEventListener('keydown', keyCatch, true);
  card.onpointerdown = e => { if (box && e.target.tagName !== 'BUTTON' && e.target !== box) setTimeout(() => box.focus(), 0); };
  const close = earned => {
    stopAudio(); card.hidden = true;
    document.removeEventListener('keydown', keyCatch, true); card.onpointerdown = null;
    speak.onclick = $('spellCheck').onclick = $('spellCancel').onclick = null;
    if (earned) cb.onEarn(); cb.onClose && cb.onClose(earned);
  };
  const check = () => {
    if (state === 'show' || state === 'done') return;
    const guess = box.value.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!guess) { box.focus(); return; }
    if (guess === '?') box.value = '';
    const right = guess === target;
    if (first) { cb.onFirst(right); first = false; }
    if (right) {
      state = 'done';
      card.querySelector('.card').classList.add('right');
      showAnswer();
      card.querySelector('.row').style.visibility = 'hidden';
      prompt.textContent = mode === 'phrase' ? 'Yes! Off to the runway!' : 'Yes! You spelled it!';
      if (mode !== 'phrase') sayWord(word);
      setTimeout(() => close(true), mode === 'phrase' ? 1800 : 1400);
      return;
    }
    // corrected test: look at it, hear it, then write it again from memory
    state = 'show';
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    setTimeout(() => {
      showAnswer();
      prompt.textContent = quiz ? 'This one is spelled like this. We will practice it!' : 'It is spelled like this. Look at the pink letters.';
      if (mode === 'phrase') dictatePhrase(phrase); else sayWord(word);
    }, 350);
    if (quiz) setTimeout(() => close(false), 2100);          // the quiz just notes it and moves on
    else setTimeout(() => { state = 'retype'; showAsk(); }, mode === 'phrase' ? 4200 : 3000);
  };
  const skip = () => { if (state !== 'ask') return; box.value = '?'; check(); };
  speak.onclick = play;
  $('spellCheck').onclick = check;
  $('spellCancel').onclick = quiz ? skip : () => close(false);
  $('spellCancel').textContent = quiz ? 'Skip this one' : 'Not now';
  $('spellCancel').hidden = !!cb.noCancel;
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

/* colours and patterns each unlock with one spelled word (per item). unlock(kind, done(ok)) asks for the word.
   While a section is locked nothing in it changes the item: tapping a colour or pattern there asks for the word
   too (like the lock button), and spelling it gives her the one she tapped. */
UI.colors = (item, palette, prints, onDone, unlock) => {
  openPanel(item.def.name, onDone);
  const again = () => UI.colors(item, palette, prints, onDone, unlock);
  const section = (host, title, open, kind, label, fill) => {
    h3(host, title);
    const box = document.createElement('div'); box.className = 'sec' + (open ? '' : ' locked'); host.appendChild(box);
    const ask = then => unlock(kind, ok => { if (ok && then) then(); again(); });     // redraw either way (clears a tapped highlight)
    fill(box, pick => open ? pick : v => ask(() => pick(v)));
    if (!open) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'unlockbtn'; b.innerHTML = LOCK + `<span>${label}</span>`;
      b.onclick = () => ask();
      box.appendChild(b);
    }
  };
  section($('panelA'), 'Color', !unlock || item.colorsOpen, 'colors', 'Spell a word to change the color',
    (box, guard) => hearts(box, palette, item.color, guard(c => item.setColor(c))));
  if (item.def.printable) section($('panelB'), 'Pattern', !unlock || item.printsOpen, 'prints', 'Spell a word to change the pattern',
    (box, guard) => chips(box, prints, item.print || 'solid', p => p[0].toUpperCase() + p.slice(1), guard(p => item.setColor(item.color, p))));
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
  $('startTeach').textContent = level.review ? `A review of levels ${level.review[0]}–${level.review[level.review.length - 1]}: no new ideas, just practice.` : 'Two new spelling ideas:';
  $('startPoints').innerHTML = level.ideas.map(i => `<div><b>${i.label}</b><span>${i.rule} <i>${i.eg}</i></span></div>`).join('');
  $('startTheme').textContent = theme.name;
  $('startCard').hidden = false;
  $('startListen').onclick = () => sayPattern(level);
  $('startGo').onclick = () => { stopAudio(); $('startCard').hidden = true; onGo(); };
};
UI.end = (title, text, next, buttons) => {
  $('bubble').classList.remove('on');
  $('endTitle').textContent = title;
  $('endText').innerHTML = text; $('endNext').innerHTML = next; $('endCard').hidden = false;
  const row = $('endButtons'); row.innerHTML = '';
  for (const [label, fn, ghost] of buttons) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (ghost ? ' ghost' : ''); b.textContent = label; b.onclick = fn; row.appendChild(b); }
};

/* ---------------- runway: voting stars, pose buttons, podium labels ---------------- */
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 1.6l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.6 1.4-7.1-5.3-5 7.2-.9z"/></svg>';
UI.runwayBar = (theme, name, mine, onVote, onPose) => {
  let bar = $('voteBar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'voteBar'; $('ui').appendChild(bar); }
  bar.hidden = false; bar.className = mine ? 'mine' : '';
  bar.innerHTML = `<div class="vtop"><div class="vtheme">Theme: <b>${theme}</b></div><div class="vname">${mine ? 'Your turn! Strike a pose!' : name + ' is walking'}</div><div class="vtime" id="voteTime"></div></div>`
    + (mine ? `<div class="poses"><button type="button" data-p="hip">Hand on hip</button><button type="button" data-p="wave">Wave</button><button type="button" data-p="twirl">Twirl</button></div>`
      : `<div class="stars">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}">${STAR}</button>`).join('')}</div>`);
  bar.querySelectorAll('.stars button').forEach(b => b.onclick = () => {
    const n = +b.dataset.n; bar.querySelectorAll('.stars button').forEach(x => x.classList.toggle('on', +x.dataset.n <= n)); onVote(n);
  });
  bar.querySelectorAll('.poses button').forEach(b => b.onclick = () => onPose(b.dataset.p));
};
UI.voteTime = s => { const t = $('voteTime'); if (t) t.textContent = s > 0 ? `You have ${s}s to vote!` : ''; };
UI.runwayHide = () => { const b = $('voteBar'); if (b) b.hidden = true; };
UI.flashStars = (x, y, avg) => {
  const s = document.createElement('div'); s.className = 'starpop'; s.innerHTML = `${STAR}<b>${avg.toFixed(1)}</b>`;
  Object.assign(s.style, { left: x + 'px', top: y + 'px' }); $('ui').appendChild(s); setTimeout(() => s.remove(), 2600);
};
UI.loaded = () => { const l = $('loading'); if (!l) return; l.classList.add('gone'); setTimeout(() => l.remove(), 700); };

/* ---------------- home: pick a wing ---------------- */
UI.home = (levels, stats, unlocked, onPick) => {
  const host = $('homeLevels'); host.innerHTML = '';
  levels.forEach((L, i) => {
    const st = stats[i], open = L.n <= unlocked, b = document.createElement('button');
    b.type = 'button'; b.className = 'lvl' + (open ? '' : ' locked');
    const pct = Math.round(st.known / st.n * 100);
    b.innerHTML = `<div class="ln">Level ${L.n}${L.review ? ' · review' : ''}</div><div class="lw">${L.wing}</div><div class="li">${L.review ? 'Everything from levels ' + L.review[0] + '–' + L.review[L.review.length - 1] : L.ideas.map(x => x.label).join('  +  ')}</div>`
      + (open ? `<div class="bar"><i style="width:${pct}%"></i></div><div class="lp">${st.quiz ? `${st.known} of ${st.n} words known` : 'Starts with a pop quiz'}</div><div class="go">Play</div>`
        : `<div class="lp">${LOCK} Spell 80% right in Level ${L.n - 1} to unlock</div>`);
    if (open) b.onclick = () => { $('homeCard').hidden = true; onPick(i); };
    host.appendChild(b);
  });
  $('homeCard').hidden = false;
};

/* ---------------- pop quiz ---------------- */
const GEM = '<svg viewBox="0 0 24 24"><path d="M12 2l7 6-7 14L5 8z"/><path d="M5 8h14M9 8l3-6 3 6-3 14z" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1"/></svg>';
function quizCard(html) {
  let m = $('quizCard');
  if (!m) { m = document.createElement('div'); m.className = 'modal'; m.id = 'quizCard'; $('ui').appendChild(m); }
  m.innerHTML = `<div class="card big quiz">${html}</div>`; m.hidden = false; return m;
}
UI.quizIntro = (level, n, onGo) => {
  const m = quizCard(`<div class="marquee">POP QUIZ</div><h1>What do you already know?</h1>
    <p class="teach">Spell ${n} words from <b>${level.title}</b>. Every word you get right is one you don't have to practice!</p>
    <p class="rule">Don't know one? Tap <b>Skip this one</b>. Those are just the words we'll practice.</p>
    <div class="row"><button class="btn" id="quizGo" type="button">Start the quiz!</button></div>`);
  $('quizGo').onclick = () => { m.hidden = true; onGo(); };
};
/* the scoreboard along the top while the quiz runs */
UI.quizHud = (results, total, streak) => {
  let h = $('quizHud');
  if (!h) { h = document.createElement('div'); h.id = 'quizHud'; $('ui').appendChild(h); }
  h.hidden = false;
  h.innerHTML = `<div class="qtitle">POP QUIZ</div><div class="gems">${Array.from({ length: total }, (_, i) => `<span class="gem ${results[i] === true ? 'on' : results[i] === false ? 'off' : i === results.length ? 'now' : ''}">${GEM}</span>`).join('')}</div>`
    + `<div class="qcount">Word ${Math.min(total, results.length + 1)} of ${total}</div>` + (streak >= 2 ? `<div class="streak">${streak} in a row!</div>` : '');
};
UI.quizHudHide = () => { const h = $('quizHud'); if (h) h.hidden = true; };
UI.quizResults = (level, results, onGo) => {
  const right = results.filter(r => r.right).length, missed = results.filter(r => !r.right);
  const line = (label, rs) => rs.length ? `<div><b>${label}</b><span>${rs.filter(r => r.right).length} of ${rs.length}</span></div>` : '';
  const lines = level.ideas.map(idea => line(idea.label, results.filter(r => r.word.idea === idea.id))).join('') + line('both in one word', results.filter(r => r.word.idea === 'both'));
  const m = quizCard(`<div class="marquee">QUIZ DONE</div><h1>You already know ${right} of ${results.length}!</h1>
    <div class="points">${lines}</div>
    ${missed.length ? `<p class="teach">We'll practice these first:</p><div class="chipsrow">${missed.map(r => `<span class="wchip">${revealHTML(r.word)}</span>`).join('')}</div>` : '<p class="teach">Wow, a perfect quiz! We will practice the rest of the words in this wing.</p>'}
    <div class="row"><button class="btn" id="quizGo" type="button">Go to the boutique!</button></div>`);
  $('quizGo').onclick = () => { m.hidden = true; onGo(); };
};
