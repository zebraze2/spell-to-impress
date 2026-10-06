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
    // warm-up: one vowel, short sound (closed syllables), with the spelling rules that go with short vowels
    id: 'short', n: 1, title: 'Short Vowels', wing: 'Garden Wing', grade: 'Grade 2',
    teach: 'One vowel in a short word usually says its short sound.',
    points: [
      ['a e i o u', 'short sounds: hat, bed, pig, dog, sun'],
      ['ck', 'after a short vowel: sock, truck'],
      ['ff ll ss', 'double them after a short vowel: dress, shell'],
      ['sh ch th', 'two letters, one sound: fish, chin, cloth'],
      ['heart words', 'was, said, what: learn the tricky part by heart'],
    ],
    say: 'In a short word with one vowel, the vowel usually says its short sound, like the a in hat. At the end of a short word, the k sound is spelled c, k, like sock. And f, l, and s are doubled, like dress and shell.',
    words: [
      { w: 'hat', team: 'a', s: 'She wore a pink hat.' },
      { w: 'bed', team: 'e', s: 'It is time for bed.' },
      { w: 'pig', team: 'i', s: 'The pig rolled in the mud.' },
      { w: 'dog', team: 'o', s: 'The dog wagged its tail.' },
      { w: 'sun', team: 'u', s: 'The sun is hot today.' },
      { w: 'bag', team: 'a', s: 'She packed her bag for the trip.' },
      { w: 'red', team: 'e', s: 'She has a red ball.' },
      { w: 'bus', team: 'u', s: 'We ride the bus to school.' },
      { w: 'fish', team: 'sh', s: 'The fish swam in the pond.' },
      { w: 'sock', team: 'ck', s: 'I lost my left sock.' },
      { w: 'dress', team: 'ss', s: 'She wore a pretty dress to the party.' },
      { w: 'was', team: 'a', heart: true, s: 'It was a sunny day.' },
      { w: 'frog', team: 'o', s: 'The frog hopped on a log.' },
      { w: 'clap', team: 'a', s: 'Clap your hands to the music.' },
      { w: 'belt', team: 'e', s: 'He wore a brown belt.' },
      { w: 'milk', team: 'i', s: 'I drink milk with lunch.' },
      { w: 'jump', team: 'u', s: 'Can you jump over the puddle?' },
      { w: 'shell', team: 'll', s: 'I found a shell at the beach.' },
      { w: 'chin', team: 'ch', s: 'She rested her chin on her hand.' },
      { w: 'truck', team: 'ck', s: 'The truck was big and loud.' },
      { w: 'stamp', team: 'a', s: 'Put a stamp on the letter.' },
      { w: 'box', team: 'o', s: 'The gift is in the box.' },
      { w: 'said', team: 'ai', heart: true, s: 'Mom said it was time for bed.' },
      { w: 'nest', team: 'e', s: 'The bird sat on its nest.' },
      { w: 'pink', team: 'nk', s: 'Her shoes are pink.' },
      { w: 'drum', team: 'u', s: 'He played the drum in the band.' },
      { w: 'black', team: 'ck', s: 'The cat is black.' },
      { w: 'pond', team: 'o', s: 'Ducks swim in the pond.' },
      { w: 'gift', team: 'i', s: 'I wrapped a gift for my friend.' },
      { w: 'brush', team: 'sh', s: 'Brush your hair before school.' },
      { w: 'desk', team: 'e', s: 'Put your books on the desk.' },
      { w: 'spot', team: 'o', s: 'The puppy has a white spot.' },
      { w: 'swim', team: 'i', s: 'We swim in the summer.' },
      { w: 'cloth', team: 'th', s: 'Wipe the table with a cloth.' },
      { w: 'skunk', team: 'nk', s: 'The skunk has a white stripe.' },
      { w: 'what', team: 'a', heart: true, s: 'What is your name?' },
      { w: 'hand', team: 'a', s: 'Hold my hand.' },
      { w: 'sled', team: 'e', s: 'We rode the sled down the hill.' },
      { w: 'picnic', team: 'ic', s: 'We had a picnic in the park.' },
      { w: 'sunset', team: 'u', s: 'The sunset was orange and pink.' },
    ],
  },
  {
    id: 'teams', n: 2, title: 'Vowel Teams', wing: 'Party Wing', grade: 'Grade 2',
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
  { id: 'double', n: 3, title: 'Double It', wing: 'Beach Wing', grade: 'Grade 2', teach: 'Short vowel + one consonant: double it before -ing or -ed (hop, hopping).', points: [], say: '', words: [] },
  { id: 'drop', n: 4, title: 'Drop the E', wing: 'Royal Wing', grade: 'Grade 2', teach: 'Drop the silent e before -ing or -ed (make, making).', points: [], say: '', words: [] },
  { id: 'ytoi', n: 5, title: 'Y to I', wing: 'Winter Wing', grade: 'Grade 3', teach: 'Change y to i before -es or -ed (cry, cried).', points: [], say: '', words: [] },
  { id: 'unre', n: 6, title: 'Un- and Re-', wing: 'Sport Wing', grade: 'Grade 3', teach: 'A prefix goes in front and changes the meaning (un = not, re = again).', points: [], say: '', words: [] },
  { id: 'dispre', n: 7, title: 'Dis- and Pre-', wing: 'Fairy Wing', grade: 'Grade 3', teach: 'dis = not or opposite, pre = before.', points: [], say: '', words: [] },
  { id: 'fulless', n: 8, title: '-ful and -less', wing: 'Gala Wing', grade: 'Grade 3', teach: 'A suffix goes at the end (-ful = full of, -less = without).', points: [], say: '', words: [] },
  { id: 'lyness', n: 9, title: '-ly and -ness', wing: 'Star Wing', grade: 'Grade 3', teach: '-ly tells how; -ness makes a thing (kindly, kindness).', points: [], say: '', words: [] },
];

/* every spoken line, by clip id (used by tools/make-audio.py) */
export const CLIPS = {};
for (const L of LEVELS) {
  if (L.say) CLIPS['p_' + L.id] = L.say;
  for (const w of L.words) { CLIPS['w_' + w.w] = w.w; CLIPS['s_' + w.w] = w.s; }
}
