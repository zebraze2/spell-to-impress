/* Spelling session: serves words in curriculum order, brings missed words back a few words later,
   and scores FIRST tries (that's what counts toward the 80% needed to unlock the next wing). */
import { LEVELS } from './words.js';

export const PASS = 0.8;
const KEY = 'sti-progress-v1';

export function loadProgress() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function saveProgress(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ } }

export function makeSession(levelIndex = 0) {
  const L = LEVELS[levelIndex], prog = loadProgress(), lp = prog[L.id] || { next: 0 };
  const S = {
    level: L, queue: [], firstTries: 0, firstRight: 0, missed: [], cursor: lp.next || 0, done: new Set(),
  };
  /* the next word to spell: due retries first, otherwise the next new word */
  S.next = () => {
    const due = S.queue.findIndex(q => q.dueIn <= 0);
    if (due >= 0) return { word: S.queue.splice(due, 1)[0].word, retry: true };
    const w = L.words[S.cursor % L.words.length]; S.cursor++;
    return { word: w, retry: false };
  };
  /* record the result of a FIRST try for a word */
  S.record = (word, right, retry) => {
    S.queue.forEach(q => q.dueIn--);
    if (retry) return;
    S.firstTries++; if (right) S.firstRight++;
    if (!right) { S.missed.push(word.w); S.queue.push({ word, dueIn: 3 }); }
  };
  S.score = () => S.firstTries ? S.firstRight / S.firstTries : 0;
  S.save = () => { const p = loadProgress(); p[L.id] = { ...(p[L.id] || {}), next: S.cursor % L.words.length }; saveProgress(p); };
  return S;
}

/* --- dictation audio: recorded clips (natural voice); falls back to the browser voice if a clip is missing --- */
const cache = new Map();
let current = null;
function clip(id) {
  if (!cache.has(id)) { const a = new Audio('audio/' + id + '.m4a'); a.preload = 'auto'; cache.set(id, a); }
  return cache.get(id);
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
function speak(text) {
  return new Promise(res => {
    if (!('speechSynthesis' in window)) return res();
    const u = new SpeechSynthesisUtterance(text); u.rate = 0.9; u.onend = res; u.onerror = res;
    speechSynthesis.speak(u);
  });
}
let token = 0;
export function stopAudio() { token++; if (current) { current.pause(); current = null; } if ('speechSynthesis' in window) speechSynthesis.cancel(); }
/* "rain. The rain taps on the window. rain." */
export async function dictate(word) {
  stopAudio(); const my = ++token;
  await playOne('w_' + word.w, word.w); if (my !== token) return;
  await new Promise(r => setTimeout(r, 350)); if (my !== token) return;
  await playOne('s_' + word.w, word.s); if (my !== token) return;
  await new Promise(r => setTimeout(r, 350)); if (my !== token) return;
  await playOne('w_' + word.w, word.w);
}
export function sayWord(word) { stopAudio(); token++; return playOne('w_' + word.w, word.w); }
export function sayPattern(level) { stopAudio(); token++; return playOne('p_' + level.id, level.say); }
