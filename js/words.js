/* Spelling curriculum. One spelling pattern per level, taught up front, practised by dictation.
   Research behind the design:
   - Explicit, systematic phonics / spelling instruction beats incidental learning (NRP 2000; Graham & Santangelo 2014 meta-analysis).
   - Dictation + recall (hear it, spell it from memory) builds the orthographic memory that reading uses (Ehri: orthographic mapping).
   - Immediate correction, then writing the word correctly, is one of the strongest spelling effects (Horn's "corrected test").
   - Missed words return later in the same round: spaced retrieval (Cepeda et al. 2006; Roediger & Karpicke 2006).
   - Patterns are interleaved so she must CHOOSE (ai vs ay, oa vs ow) - interleaving improves discrimination (Rohrer 2012).
   - Irregular "heart words" are taught as such: regular letters + the part to remember by heart (Farrell et al.).
   - A few review words from earlier patterns keep learning cumulative.
   Each word: w = word, team = letters highlighted after she spells it (sound -> letters), s = dictation sentence. */

export const LEVELS = [
  {
    id: 'teams', n: 1, title: 'Vowel Teams', wing: 'Garden Wing', grade: 'Grade 2',
    teach: 'Two vowels together often make one long sound.',
    points: [
      ['ai · ay', 'long a: ai in the middle (rain), ay at the end (play)'],
      ['ee · ea', 'long e: tree, leaf'],
      ['oa · ow', 'long o: oa in the middle (boat), ow at the end (snow)'],
      ['igh · ie', 'long i: light, pie'],
      ['heart words', 'said, again, great: learn the tricky part by heart'],
    ],
    say: 'Vowel teams are two letters that make one long sound. In the middle of a word, long a is spelled a, i, like rain. At the end, it is a, y, like play. Long o is o, a in the middle, like boat, and o, w at the end, like snow.',
    words: [
      { w: 'rain', team: 'ai', s: 'The rain taps on the window.' },
      { w: 'play', team: 'ay', s: 'Can we play dress-up after lunch?' },
      { w: 'tree', team: 'ee', s: 'A bird sat in the tall tree.' },
      { w: 'boat', team: 'oa', s: 'The little boat floats on the lake.' },
      { w: 'snow', team: 'ow', s: 'Soft snow covered the yard.' },
      { w: 'light', team: 'igh', s: 'Please turn on the light.' },
      { w: 'said', team: 'ai', heart: true, s: 'Mom said it was time for bed.' },
      { w: 'day', team: 'ay', s: 'It was a sunny day at the beach.' },
      { w: 'leaf', team: 'ea', s: 'A red leaf fell from the tree.' },
      { w: 'coat', team: 'oa', s: 'Zip up your coat when it is cold.' },
      { w: 'green', team: 'ee', s: 'The grass is green.' },
      { w: 'braid', team: 'ai', s: 'She wore her hair in a long braid.' },
      { w: 'night', team: 'igh', s: 'The stars come out at night.' },
      { w: 'pie', team: 'ie', s: 'We baked an apple pie.' },
      { w: 'stay', team: 'ay', s: 'Can my friend stay for dinner?' },
      { w: 'beads', team: 'ea', s: 'She made a necklace with pink beads.' },
      { w: 'soap', team: 'oa', s: 'Wash your hands with soap.' },
      { w: 'sheep', team: 'ee', s: 'The sheep has soft white wool.' },
      { w: 'grow', team: 'ow', s: 'Flowers grow in the garden.' },
      { w: 'paint', team: 'ai', s: 'Let us paint a picture of a flower.' },
      { w: 'bright', team: 'igh', s: 'The sun is very bright today.' },
      { w: 'star', team: 'ar', review: true, s: 'She made a wish on a shining star.' },
      { w: 'tray', team: 'ay', s: 'Put the cups on the tray.' },
      { w: 'dream', team: 'ea', s: 'I had a happy dream.' },
      { w: 'goat', team: 'oa', s: 'The goat ate the grass.' },
      { w: 'queen', team: 'ee', s: 'The queen wore a sparkly crown.' },
      { w: 'again', team: 'ai', heart: true, s: 'Can we read that book again?' },
      { w: 'chain', team: 'ai', s: 'Her necklace has a gold chain.' },
      { w: 'glow', team: 'ow', s: 'The stickers glow in the dark.' },
      { w: 'tie', team: 'ie', s: 'Can you tie your shoes?' },
      { w: 'team', team: 'ea', s: 'Our team won the game.' },
      { w: 'toast', team: 'oa', s: 'I ate toast with jam.' },
      { w: 'sweet', team: 'ee', s: 'The candy was very sweet.' },
      { w: 'spray', team: 'ay', s: 'The hose made a cool spray of water.' },
      { w: 'tights', team: 'igh', s: 'She wore pink tights with her dress.' },
      { w: 'skirt', team: 'ir', review: true, s: 'Her skirt twirled when she spun around.' },
      { w: 'clean', team: 'ea', s: 'Please clean up your room.' },
      { w: 'train', team: 'ai', s: 'We rode the train to the city.' },
      { w: 'yellow', team: 'ow', s: 'The sun is big and yellow.' },
      { w: 'great', team: 'ea', heart: true, s: 'You did a great job!' },
      { w: 'dressing', team: 'ing', review: true, s: 'She is dressing up for the party.' },
    ],
  },
  // the rest of the climb (words come later): mid grade 2 -> grade 3
  { id: 'double', n: 2, title: 'Double It', wing: 'Party Wing', grade: 'Grade 2', teach: 'Short vowel + one consonant: double it before -ing or -ed (hop, hopping).', points: [], say: '', words: [] },
  { id: 'drop', n: 3, title: 'Drop the E', wing: 'Beach Wing', grade: 'Grade 2', teach: 'Drop the silent e before -ing or -ed (make, making).', points: [], say: '', words: [] },
  { id: 'ytoi', n: 4, title: 'Y to I', wing: 'Royal Wing', grade: 'Grade 3', teach: 'Change y to i before -es or -ed (cry, cried).', points: [], say: '', words: [] },
  { id: 'unre', n: 5, title: 'Un- and Re-', wing: 'Winter Wing', grade: 'Grade 3', teach: 'A prefix goes in front and changes the meaning (un = not, re = again).', points: [], say: '', words: [] },
  { id: 'dispre', n: 6, title: 'Dis- and Pre-', wing: 'Sport Wing', grade: 'Grade 3', teach: 'dis = not or opposite, pre = before.', points: [], say: '', words: [] },
  { id: 'fulless', n: 7, title: '-ful and -less', wing: 'Fairy Wing', grade: 'Grade 3', teach: 'A suffix goes at the end (-ful = full of, -less = without).', points: [], say: '', words: [] },
  { id: 'lyness', n: 8, title: '-ly and -ness', wing: 'Gala Wing', grade: 'Grade 3', teach: '-ly tells how; -ness makes a thing (kindly, kindness).', points: [], say: '', words: [] },
];

/* every spoken line, by clip id (used by tools/make-audio.py) */
export const CLIPS = {};
for (const L of LEVELS) {
  if (L.say) CLIPS['p_' + L.id] = L.say;
  for (const w of L.words) { CLIPS['w_' + w.w] = w.w; CLIPS['s_' + w.w] = w.s; }
}
