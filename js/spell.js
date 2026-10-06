/* Spelling session for one round of one level.
   - Words come in curriculum order; the first two of each idea are "fill the sound" (a fading scaffold).
   - Missed words come back three words later (spaced retrieval).
   - Only independent, first-try spellings of whole words and phrases count toward the 80%. */
import { LEVELS, phraseId } from './words.js?v=2271898f';

export const PASS = 0.8;
export const MIN_TRIES = 8;          // need at least this many scored tries in a round to unlock the next wing
const KEY = 'sti-progress-v2';
const FILL_PER_IDEA = 2;

export function loadProgress() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
export function saveProgress(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ } }

function shuffle(a, r = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function makeSession(levelIndex = 0) {
  const L = LEVELS[levelIndex], prog = loadProgress(), lp = prog[L.id] || {};
  const S = {
    level: L, queue: [], firstTries: 0, firstRight: 0, missed: [], cursor: lp.next || 0,
    fills: Object.fromEntries((L.ideas || []).map(i => [i.id, 0])),   // correct fill-ins so far, per idea
  };
  /* next thing to spell: a due retry, else the next word (as a fill-in while that idea still needs the scaffold) */
  S.next = () => {
    const due = S.queue.findIndex(q => q.dueIn <= 0);
    if (due >= 0) return { word: S.queue.splice(due, 1)[0].word, retry: true, fill: false };
    const word = L.words[S.cursor % L.words.length]; S.cursor++;
    const fill = word.idea in S.fills && S.fills[word.idea] < FILL_PER_IDEA && typeof word.chunk === 'string';
    return { word, retry: false, fill };
  };
  /* record the FIRST try at something */
  S.record = (word, right, { retry = false, fill = false } = {}) => {
    S.queue.forEach(q => q.dueIn--);
    if (retry) return;
    S.firstTries++; if (right) S.firstRight++;           // fill-ins count too: they test exactly the new sound
    if (fill && right) S.fills[word.idea]++;
    if (!right) { S.missed.push(word.w); S.queue.push({ word, dueIn: fill ? 2 : 3 }); }
  };
  S.recordPhrase = right => { S.firstTries++; if (right) S.firstRight++; };
  S.score = () => S.firstTries ? S.firstRight / S.firstTries : 0;
  /* a word sort: two words for each idea (words that use both ideas are left out) */
  S.sortSet = () => {
    const out = [];
    for (const idea of L.ideas) out.push(...shuffle(L.words.filter(w => w.idea === idea.id)).slice(0, 2));
    return shuffle(out);
  };
  S.phrase = () => L.phrases[Math.floor(Math.random() * L.phrases.length)];
  /* the runway word: one that uses both of the level's ideas (check, shock, thick) */
  S.capstone = () => { const both = L.words.filter(w => w.idea === 'both'); return both.length ? both[Math.floor(Math.random() * both.length)] : S.next().word; };
  S.save = () => { const p = loadProgress(); p[L.id] = { ...(p[L.id] || {}), next: S.cursor % L.words.length }; saveProgress(p); };
  return S;
}

/* --- audio: recorded clips (natural voice); falls back to the browser voice if a clip is missing --- */
const cache = new Map();
let current = null, token = 0;
function clip(id) {
  if (!cache.has(id)) { const a = new Audio('audio/' + id + '.m4a'); a.preload = 'auto'; cache.set(id, a); }
  return cache.get(id);
}
function speak(text) {
  return new Promise(res => {
    if (!('speechSynthesis' in window)) return res();
    const u = new SpeechSynthesisUtterance(text.replace(/\[\[[^|\]]*\|([^\]]*)\]\]/g, '$1')); u.rate = 0.9; u.onend = res; u.onerror = res;
    speechSynthesis.speak(u);
  });
}
function playOne(id, fallbackText) {
  return new Promise(res => {
    const a = clip(id); current = a;
    a.currentTime = 0;
    const done = () => { a.onended = a.onerror = null; res(); };
    a.onended = done;
    a.onerror = () => { done(); speak(fallbackText).then(res); };
    a.play().catch(() => { speak(fallbackText).then(res); });
  });
}
const pause = ms => new Promise(r => setTimeout(r, ms));
export function stopAudio() { token++; if (current) { current.pause(); current = null; } if ('speechSynthesis' in window) speechSynthesis.cancel(); }
/* "sock. I lost my left sock. sock." */
export async function dictate(word, { fill = false } = {}) {
  stopAudio(); const my = ++token;
  await playOne('w_' + word.w, word.w); if (my !== token) return;
  await pause(350); if (my !== token) return;
  await playOne('s_' + word.w, word.s); if (my !== token) return;
  await pause(450); if (my !== token) return;
  if (fill) await playOne('w_' + word.w, word.w);
  else await playOne('t_' + word.w, 'Spell ' + word.w + '.');      // "Spell sock." makes the target word unmistakable
}
/* phrases are said twice, a little apart */
export async function dictatePhrase(p) {
  stopAudio(); const my = ++token;
  await playOne('g_phrase', 'Spell this whole phrase.'); if (my !== token) return;
  await pause(300); if (my !== token) return;
  await playOne(phraseId(p), p); if (my !== token) return;
  await pause(900); if (my !== token) return;
  await playOne(phraseId(p), p);
}
export function sayWord(word) { stopAudio(); token++; return playOne('w_' + word.w, word.w); }
export function sayPattern(level) { stopAudio(); token++; return playOne('p_' + level.id, level.say); }
