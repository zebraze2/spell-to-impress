/* Spelling session + what she already knows.
   - Every word has a mastery mark saved in the browser:
       -1 needs practice (missed)   0 not seen yet   1 spelled right once   2 knows it
   - A pop quiz before each level marks the words she already knows (test - study - test: practise what the
     pretest shows she needs). Practice then focuses on the rest.
   - In a round: missed words first, then unseen ones; a known word is mixed in now and then (spaced review).
     The first words of each idea are "fill the sound"; a missed word comes back a few words later.
   - First tries count toward the 80% that unlocks the next wing. */
import { LEVELS, phraseId } from './words.js?v=93c772a3';

export const PASS = 0.8;
export const MIN_TRIES = 8;          // need at least this many scored tries in a round to unlock the next wing
export const QUIZ_SIZE = 12;
const KEY = 'sti-progress-v3';
const FILL_PER_IDEA = 2;

export function loadProgress() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
export function resetProgress() { try { localStorage.removeItem(KEY); } catch { /* private mode */ } }
export function saveProgress(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ } }
function shuffle(a, r = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------------- what she knows ---------------- */
function levelRec(p, id) { p.levels = p.levels || {}; return (p.levels[id] = p.levels[id] || { quiz: false, words: {} }); }
export function mastery(levelId) { return levelRec(loadProgress(), levelId); }
export function markWord(levelId, w, right, { quiz = false } = {}) {
  const p = loadProgress(), L = levelRec(p, levelId), m = L.words[w] ?? 0;
  // right on the quiz = she already knows it; in practice it takes two first-try rights (one after a miss counts as one)
  L.words[w] = right ? (quiz ? 2 : m === -1 ? 1 : Math.min(2, m + 1)) : -1;
  saveProgress(p);
}
export function markQuizDone(levelId) { const p = loadProgress(); levelRec(p, levelId).quiz = true; saveProgress(p); }
/* word -> mastery mark for a level; a review level falls back to the marks from the levels it reviews */
export function marks(level) {
  const p = loadProgress(), own = levelRec(p, level.id).words;
  if (!level.review) return own;
  const merged = {};
  for (const n of level.review) Object.assign(merged, levelRec(p, LEVELS[n - 1].id).words);
  return Object.assign(merged, own);
}
export function levelStats(level) {
  const m = marks(level), n = level.words.length;
  let known = 0, practice = 0;
  for (const w of level.words) { const v = m[w.w] ?? 0; if (v >= 2) known++; else if (v === -1) practice++; }
  return { n, known, practice, quiz: mastery(level.id).quiz };
}
export function unlockedLevel() { return loadProgress().unlocked || 1; }
export function unlock(n) { const p = loadProgress(); p.unlocked = Math.max(p.unlocked || 1, n); saveProgress(p); }

/* the pop quiz: a spread of words across both ideas, with every spelling inside an idea represented */
export function quizSet(level, size = QUIZ_SIZE) {
  const both = shuffle(level.words.filter(w => w.idea === 'both'));
  const nBoth = level.review ? 0 : Math.min(both.length, 2);
  const per = Math.floor((size - nBoth) / level.ideas.length), out = [];
  for (const idea of level.ideas) {
    const groups = {};
    for (const w of level.words.filter(w => w.idea === idea.id)) (groups[w.chunk] = groups[w.chunk] || []).push(w);
    const lists = Object.values(groups).map(g => shuffle(g));
    for (let k = 0, taken = 0; taken < per && lists.some(l => l.length); k++) { const l = lists[k % lists.length]; if (l.length) { out.push(l.shift()); taken++; } }
  }
  const spare = shuffle(level.words.filter(w => w.idea !== 'both' && !out.includes(w)));
  while (out.length < size - nBoth && spare.length) out.push(spare.shift());
  return shuffle(out).concat(both.slice(0, size - out.length));      // the two-idea words come last
}

/* ---------------- one round ---------------- */
export function makeSession(levelIndex = 0) {
  const L = LEVELS[levelIndex];
  const S = {
    level: L, queue: [], firstTries: 0, firstRight: 0, missed: [], served: new Set(), picks: 0, lastIdea: null,
    fills: Object.fromEntries((L.ideas || []).map(i => [i.id, 0])),   // correct fill-ins so far, per idea
  };
  const band = (m, w) => { const v = m[w.w] ?? 0; return v === -1 ? 0 : v === 0 ? 1 : v === 1 ? 2 : 3; };   // 0 = most urgent
  /* choose the next word: missed first, then unseen, then once-right; every 5th pick is a known word for review */
  function pick() {
    const m = marks(L);
    let pool = L.words.filter(w => w.idea !== 'both' && !S.served.has(w.w));
    if (!pool.length) { S.served.clear(); pool = L.words.filter(w => w.idea !== 'both'); }
    S.picks++;
    const known = pool.filter(w => band(m, w) === 3), rest = pool.filter(w => band(m, w) < 3);
    let cands;
    if (!rest.length || (known.length && S.picks % 5 === 0)) cands = known;
    else { const best = Math.min(...rest.map(w => band(m, w))); cands = rest.filter(w => band(m, w) === best); }
    const alt = cands.filter(w => w.idea !== S.lastIdea);            // alternate the two ideas when we can
    const word = (alt.length ? alt : cands)[0];
    S.lastIdea = word.idea; S.served.add(word.w);
    return word;
  }
  /* next thing to spell: a due retry, else a tailored pick (as a fill-in while that idea still needs the scaffold) */
  S.next = () => {
    const due = S.queue.findIndex(q => q.dueIn <= 0);
    if (due >= 0) return { word: S.queue.splice(due, 1)[0].word, retry: true, fill: false };
    const word = pick(), m = marks(L)[word.w] ?? 0;
    const fill = !L.review && m <= 0 && word.idea in S.fills && S.fills[word.idea] < FILL_PER_IDEA && typeof word.chunk === 'string' && word.chunk.length < word.w.length;
    return { word, retry: false, fill };
  };
  /* record the first try at a served word */
  S.record = (word, right, { retry = false, fill = false } = {}) => {
    S.queue.forEach(q => q.dueIn--);
    if (!fill || !right) markWord(L.id, word.w, right);              // a fill-in alone doesn't prove the whole word
    if (!right) S.queue.push({ word, dueIn: fill ? 2 : 3 });
    if (retry) return;                                               // its miss was already counted
    S.firstTries++; if (right) S.firstRight++;
    if (fill && right) S.fills[word.idea]++;
    if (!right) S.missed.push(word.w);
  };
  S.recordPhrase = right => { S.firstTries++; if (right) S.firstRight++; };
  S.score = () => S.firstTries ? S.firstRight / S.firstTries : 0;
  /* a word sort: two words for each idea (words that use both ideas are left out) */
  S.sortIdeas = () => L.ideas.length > 2 ? shuffle(L.ideas).slice(0, 2) : L.ideas;
  S.sortSet = ideas => {
    const out = [];
    for (const idea of ideas) out.push(...shuffle(L.words.filter(w => w.idea === idea.id)).slice(0, 2));
    return shuffle(out);
  };
  S.phrase = () => L.phrases[Math.floor(Math.random() * L.phrases.length)];
  /* the runway word: one that uses both of the level's ideas (check, shock, thick) */
  S.capstone = () => { const both = L.words.filter(w => w.idea === 'both'); return both.length ? both[Math.floor(Math.random() * both.length)] : S.next().word; };
  S.save = () => {};
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
