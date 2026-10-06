# Spell to Impress

A spelling version of Roblox's *Dress to Impress*. Walk around a 3D boutique and spell dictated words to earn each piece of clothing. Sort words to open the hair salon or makeup vanity. When time runs out, spell a phrase to walk the runway. Four computer models shop, walk and vote alongside you, and the top three take the podium.

Getting 80% right on the first try unlocks the next wing.

**Play:** https://zebraze2.github.io/spell-to-impress/

## Run it locally

No build step is needed. Serve the folder with any static server:

```
python3 tools/serve.py 5177
```

Then open http://localhost:5177/.

URL options:
- `?skipstart` skips the start card
- `?seconds=60` makes a short round
- `?theme=royalball` picks a theme

## Curriculum

The curriculum is in `js/words.js`. Each level introduces two new spelling ideas, practiced four ways:
- spell the word
- fill in the sound
- sort the words
- spell a phrase

A review level follows every three levels.

## Voice

The dictation is recorded with Kokoro, the same local voice as Wordhollow:

```
../wordhollow/tools/.venv/bin/python tools/make-audio.py --verify
```
