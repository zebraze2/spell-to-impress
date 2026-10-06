/* Spelling curriculum: each level introduces TWO new ideas, practised four ways
   (spell it, fill the sound, word sort, phrase dictation). A review level follows every three levels.
   Research behind the design:
   - Explicit, systematic phonics / spelling instruction beats incidental learning (NRP 2000; Graham & Santangelo 2014 meta-analysis).
   - Few new ideas at a time, practised to mastery before moving on (mastery learning; cognitive load).
   - Dictation + recall (hear it, spell it from memory) builds the orthographic memory that reading uses (Ehri: orthographic mapping).
   - Scaffolds that fade: fill in just the new sound first, then spell whole words (gradual release).
   - Word sorts make the pattern visible and connect spelling to reading (Bear et al., Words Their Way).
   - Immediate correction, then writing the word correctly from memory (Horn's "corrected test").
   - Missed words return later in the same round: spaced retrieval (Cepeda et al. 2006; Roediger & Karpicke 2006).
   - The two ideas are interleaved so she must choose which one a word needs (Rohrer 2012).
   - Review levels mix the last three levels (cumulative, interleaved review).
   Each word: w = word, idea = which idea it practises, chunk = the letters for that idea (highlighted, and blanked in "fill the sound"), s = dictation sentence. */

export const LEVELS = [
  {
    id: 'ck-sh', n: 1, title: 'ck and sh · ch · th', wing: 'Garden Wing',
    ideas: [
      { id: 'ck', label: 'ck', rule: 'After a short vowel, the k sound at the end is spelled ck.', eg: 'sock, duck, black' },
      { id: 'dig', label: 'sh · ch · th', rule: 'Two letters team up to make one new sound.', eg: 'fish, chin, bath' },
    ],
    say: 'Two new ideas today. First: at the end of a short word, after a short vowel, the k sound is spelled c, k, like sock and duck. Second: some letters team up to make one new sound. S, H says [[ʃ|sh]], like fish. C, H says [[tʃ|ch]], like chin. And T, H says [[θ|th]], like bath.',
    words: [
      { w: 'sock', idea: 'ck', chunk: 'ck', s: 'I lost my left sock.' },
      { w: 'fish', idea: 'dig', chunk: 'sh', s: 'The fish swam in the pond.' },
      { w: 'duck', idea: 'ck', chunk: 'ck', s: 'The duck swam across the lake.' },
      { w: 'chin', idea: 'dig', chunk: 'ch', s: 'She rested her chin on her hand.' },
      { w: 'back', idea: 'ck', chunk: 'ck', s: 'Put the book back on the shelf.' },
      { w: 'bath', idea: 'dig', chunk: 'th', s: 'The baby splashed in the bath.' },
      { w: 'kick', idea: 'ck', chunk: 'ck', s: 'Kick the ball to me!' },
      { w: 'ship', idea: 'dig', chunk: 'sh', s: 'The big ship sailed across the sea.' },
      { w: 'lock', idea: 'ck', chunk: 'ck', s: 'Lock the door when you go out.' },
      { w: 'chop', idea: 'dig', chunk: 'ch', s: 'Dad will chop the carrots.' },
      { w: 'neck', idea: 'ck', chunk: 'ck', s: 'The giraffe has a long neck.' },
      { w: 'path', idea: 'dig', chunk: 'th', s: 'We walked along the path.' },
      { w: 'truck', idea: 'ck', chunk: 'ck', s: 'The truck was big and loud.' },
      { w: 'shop', idea: 'dig', chunk: 'sh', s: 'We went to the shop to buy shoes.' },
      { w: 'black', idea: 'ck', chunk: 'ck', s: 'The cat is black.' },
      { w: 'chip', idea: 'dig', chunk: 'ch', s: 'I ate a potato chip.' },
      { w: 'rock', idea: 'ck', chunk: 'ck', s: 'I found a smooth rock.' },
      { w: 'moth', idea: 'dig', chunk: 'th', s: 'A moth flew around the light.' },
      { w: 'pack', idea: 'ck', chunk: 'ck', s: 'Pack your bag for the trip.' },
      { w: 'shed', idea: 'dig', chunk: 'sh', s: 'The tools are in the shed.' },
      { w: 'stick', idea: 'ck', chunk: 'ck', s: 'The dog fetched the stick.' },
      { w: 'lunch', idea: 'dig', chunk: 'ch', s: 'We ate lunch at noon.' },
      { w: 'clock', idea: 'ck', chunk: 'ck', s: 'The clock says it is time for bed.' },
      { w: 'thin', idea: 'dig', chunk: 'th', s: 'The paper is very thin.' },
      { w: 'snack', idea: 'ck', chunk: 'ck', s: 'We ate a snack after school.' },
      { w: 'wish', idea: 'dig', chunk: 'sh', s: 'Make a wish and blow out the candles.' },
      { w: 'brick', idea: 'ck', chunk: 'ck', s: 'The house is made of brick.' },
      { w: 'bench', idea: 'dig', chunk: 'ch', s: 'We sat on the bench in the park.' },
      { w: 'deck', idea: 'ck', chunk: 'ck', s: 'We sat on the deck in the sun.' },
      { w: 'math', idea: 'dig', chunk: 'th', s: 'I like math at school.' },
      { w: 'brush', idea: 'dig', chunk: 'sh', s: 'Brush your hair before school.' },
      { w: 'chat', idea: 'dig', chunk: 'ch', s: 'We like to chat at lunch.' },
      { w: 'with', idea: 'dig', chunk: 'th', s: 'Can I come with you?' },
      { w: 'shut', idea: 'dig', chunk: 'sh', s: 'Please shut the door.' },
      { w: 'chest', idea: 'dig', chunk: 'ch', s: 'The pirate found a treasure chest.' },
      { w: 'cloth', idea: 'dig', chunk: 'th', s: 'Wipe the table with a cloth.' },
      { w: 'crash', idea: 'dig', chunk: 'sh', s: 'The waves crash on the sand.' },
      // both ideas in one word: saved for later in the list
      { w: 'check', idea: 'both', chunk: ['ch', 'ck'], s: 'Check your answer.' },
      { w: 'shock', idea: 'both', chunk: ['sh', 'ck'], s: 'The loud pop gave me a shock.' },
      { w: 'thick', idea: 'both', chunk: ['th', 'ck'], s: 'The book is very thick.' },
    ],
    // phrase dictation to open the runway: only Level 1 patterns + tiny common words
    phrases: ['a black duck', 'a fish and a duck', 'a thick brick', 'a chick on a rock', 'lunch on the deck', 'a thin moth', 'check the clock', 'a ship with a deck'],
  },
  // ---- the rest of the plan (agreed 2026-10-05); words are written when each level is built ----
  { id: 'bossy-r', n: 2, title: 'Bossy r', wing: 'Party Wing', ideas: [{ id: 'aror', label: 'ar · or', eg: 'star, horn' }, { id: 'erirur', label: 'er · ir · ur', eg: 'her, bird, fur' }], words: [] },
  { id: 'double', n: 3, title: 'Double it + heart words', wing: 'Beach Wing', ideas: [{ id: 'floss', label: 'ff · ll · ss · zz', eg: 'puff, shell, dress, buzz' }, { id: 'heart', label: 'heart words', eg: 'said, was, what' }], words: [] },
  { id: 'review-1', n: 4, title: 'Review: levels 1–3', review: [1, 2, 3], words: [] },
  { id: 'silent-e', n: 5, title: 'Silent e + soft c and g', ideas: [{ id: 'vce', label: 'silent e', eg: 'cake, smile, rope' }, { id: 'soft', label: 'soft c · g', eg: 'ice, city, page' }], words: [] },
  { id: 'ng-tch', n: 6, title: 'ng · nk and tch · dge', ideas: [{ id: 'ngnk', label: 'ng · nk', eg: 'ring, pink' }, { id: 'tchdge', label: 'tch · dge', eg: 'match, badge' }], words: [] },
  { id: 'teams', n: 7, title: 'Vowel teams', ideas: [{ id: 'ae', label: 'ai ay · ee ea', eg: 'rain, play, leaf' }, { id: 'oi', label: 'oa ow · igh ie', eg: 'boat, snow, light' }], words: [] },
  { id: 'review-2', n: 8, title: 'Review: levels 5–7', review: [5, 6, 7], words: [] },
  { id: 'prefix', n: 9, title: 'Prefixes', ideas: [{ id: 'unre', label: 'un- · re-', eg: 'unzip, redo' }, { id: 'dispre', label: 'dis- · pre-', eg: 'dislike, preheat' }], words: [] },
  { id: 'oi-ou', n: 10, title: 'oi · oy and ou · ow', ideas: [{ id: 'oioy', label: 'oi · oy', eg: 'coin, toy' }, { id: 'ouow', label: 'ou · ow', eg: 'cloud, crown' }], words: [] },
  { id: 'endings', n: 11, title: '-ing and -ed', ideas: [{ id: 'dbl', label: 'double it', eg: 'hopping, clapped' }, { id: 'drop', label: 'drop the e', eg: 'baking, smiled' }], words: [] },
  { id: 'review-3', n: 12, title: 'Review: levels 9–11', review: [9, 10, 11], words: [] },
  { id: 'ytoi', n: 13, title: 'y to i and -s · -es', ideas: [{ id: 'yi', label: 'y to i', eg: 'cried, babies' }, { id: 'ses', label: '-s or -es', eg: 'boxes, dresses' }], words: [] },
  { id: 'suffix', n: 14, title: 'Suffixes', ideas: [{ id: 'fulless', label: '-ful · -less', eg: 'helpful, careless' }, { id: 'lyness', label: '-ly · -ness', eg: 'softly, kindness' }], words: [] },
  { id: 'syllables', n: 15, title: 'Two-syllable words + consonant-le', ideas: [{ id: 'twosyl', label: 'two syllables', eg: 'rabbit, picnic' }, { id: 'cle', label: 'consonant + le', eg: 'table, purple' }], words: [] },
  { id: 'review-4', n: 16, title: 'Review: levels 13–15', review: [13, 14, 15], words: [] },
];

export const phraseId = p => 'f_' + p.replace(/[^a-z]+/g, '_');

/* every spoken line, by clip id (used by tools/make-audio.py) */
export const CLIPS = {};
for (const L of LEVELS) {
  if (L.say) CLIPS['p_' + L.id] = L.say;
  for (const w of L.words) { CLIPS['w_' + w.w] = w.w; CLIPS['s_' + w.w] = w.s; }
  for (const p of L.phrases || []) CLIPS[phraseId(p)] = p;
}
