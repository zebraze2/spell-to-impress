"""Records every spoken line in Spell to Impress with Kokoro (the same natural-sounding
local neural voice as Wordhollow) and writes audio/<id>.m4a + audio/manifest.json.
Reuses Wordhollow's Python venv and Kokoro model files (no second copy).

  cd spell-to-impress
  ../wordhollow/tools/.venv/bin/python tools/make-audio.py --verify
  tools/.venv/bin/python tools/make-audio.py            # record new/changed lines
  tools/.venv/bin/python tools/make-audio.py --force    # re-record everything
  tools/.venv/bin/python tools/make-audio.py --only w_cat,s_cat --voice af_bella

Setup (once): see tools/README.md.
[[ipa|text]] in a line is voiced from the IPA, so letter sounds come out exact.
"""
import argparse, json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.tokenizer import Tokenizer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, 'audio')
MODELS = os.path.join(os.path.dirname(ROOT), 'wordhollow', 'tools', 'models')

ap = argparse.ArgumentParser()
ap.add_argument('--force', action='store_true')
ap.add_argument('--voice', default='af_heart')
ap.add_argument('--only', default='')
ap.add_argument('--verify', action='store_true', help='for single words, try small variations until Whisper hears the right word')
args = ap.parse_args()

# ---- the clip catalog comes from the game's own data file ----
js = "import(process.argv[1]).then(m => process.stdout.write(JSON.stringify(m.CLIPS)))"
words = 'file://' + os.path.join(ROOT, 'js', 'words.js')
clips = {k: {'text': v} for k, v in json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js, words])).items()}

kokoro = Kokoro(os.path.join(MODELS, 'kokoro-v1.0.onnx'), os.path.join(MODELS, 'voices-v1.0.bin'))
tok = Tokenizer()
IPA_FIX = {'ɝ': 'ɜɹ'}
# said-alone pronunciations, stressed the way a teacher says a dictation word
PRON = {'peach': 'pˈitʃ.', 'her': 'hˈɜɹ.', 'to': 'tˈuː.', 'snowman': 'snˈoʊmˌæn.', 'cup': 'kˈʌp.', 'pot': 'pˈɑːt.', 'five': 'fˈaɪv.', 'the': 'ðˈʌ.', 'of': 'ˈʌv.'}

def speed_for(cid):
    if cid.startswith('w_'): return 1.0    # slowing single words down distorts them (checked with Whisper)
    if cid.startswith('s_'): return 0.9
    return 0.95

def synth(cid, text):
    parts = re.split(r'\[\[([^|\]]*)\|[^\]]*\]\]', text)
    if cid.startswith('w_') and text in PRON:
        return kokoro.create(PRON[text], voice=args.voice, speed=speed_for(cid), lang='en-us', is_phonemes=True)
    if len(parts) == 1:
        # a lone word reads more naturally as a short statement
        say = text + '.' if cid.startswith('w_') else text
        return kokoro.create(say, voice=args.voice, speed=speed_for(cid), lang='en-us')
    ph = []
    for i, p in enumerate(parts):
        if i % 2:  # IPA
            for a, b in IPA_FIX.items(): p = p.replace(a, b)
            ph.append(p if 'ˈ' in p else 'ˈ' + p)
        elif p.strip():
            ph.append(tok.phonemize(p, 'en-us'))
    return kokoro.create(' '.join(ph), voice=args.voice, speed=speed_for(cid), lang='en-us', is_phonemes=True)

def tidy(s, sr):
    """trim silence, short fades, and even out loudness so words and sentences match"""
    # gentle trim: soft sounds like f, s and th start very quietly and must not be cut
    thr = 0.003
    idx = np.where(np.abs(s) > thr)[0]
    if len(idx): s = s[max(0, idx[0] - int(.08 * sr)): idx[-1] + int(.12 * sr)]
    rms = np.sqrt(np.mean(s ** 2)) or 1
    s = s * (0.1 / rms)
    peak = np.max(np.abs(s))
    if peak > 0.95: s = s * (0.95 / peak)
    f = int(.01 * sr); s[:f] *= np.linspace(0, 1, f); s[-f:] *= np.linspace(1, 0, f)
    return np.concatenate([np.zeros(int(.04 * sr)), s, np.zeros(int(.06 * sr))]).astype(np.float32)

whisper = None
def heard(s, sr):
    global whisper
    if whisper is None:
        from faster_whisper import WhisperModel
        whisper = WhisperModel('small.en', device='cpu', compute_type='int8')
    from scipy.signal import resample_poly
    a = resample_poly(tidy(s, sr), 2, 3).astype(np.float32)
    a = np.concatenate([np.zeros(8000, np.float32), a, np.zeros(8000, np.float32)])
    segs, _ = whisper.transcribe(a, language='en', beam_size=5)
    return re.sub(r"[^a-z' ]", '', ' '.join(x.text for x in segs).lower()).strip()

def best_take(word, first, sr):
    """same voice, tiny variations in phrasing/speed; keep the first Whisper hears as the word"""
    if heard(first, sr) == word: return first
    if word in PRON:
        for sp in [0.95, 1.08, 0.9, 1.15]:
            s, _ = kokoro.create(PRON[word], voice=args.voice, speed=sp, lang='en-us', is_phonemes=True)
            if heard(s, sr) == word:
                print(f'    {word}: using /{PRON[word]}/ @ {sp}', flush=True); return s
        print(f'    {word}: no variation passed, keeping /{PRON[word]}/', flush=True)
        return first
    for say, sp in [(word, 1.0), (word + '!', 1.0), (word + '.', 1.08), (word + '.', 0.95), (word.capitalize() + '.', 1.0),
                    (word + ',', 1.0), (word + '...', 1.0), (word + '.', 1.15)]:
        s, _ = kokoro.create(say, voice=args.voice, speed=sp, lang='en-us')
        if heard(s, sr) == word:
            print(f'    {word}: using "{say}" @ {sp}', flush=True); return s
    print(f'    {word}: no variation passed, keeping the default', flush=True)
    return first

man_path = os.path.join(AUDIO, 'manifest.json')
man = json.load(open(man_path)) if os.path.exists(man_path) else {}
texts = man.get('texts', {})
voice_id = 'kokoro:' + args.voice
same_voice = man.get('voices', {}).get('en') == voice_id
only = set(filter(None, args.only.split(',')))
os.makedirs(AUDIO, exist_ok=True)

done = skipped = 0
for cid in sorted(clips):
    if only and not any(cid == o or (o.endswith('*') and cid.startswith(o[:-1])) for o in only): continue
    text = clips[cid]['text']
    m4a = os.path.join(AUDIO, cid + '.m4a')
    if not args.force and not only and same_voice and texts.get(cid) == text and os.path.exists(m4a):
        skipped += 1; continue
    s, sr = synth(cid, text)
    if args.verify and cid.startswith('w_'):
        s = best_take(text, s, sr)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        sf.write(tmp.name, tidy(s, sr), sr, subtype='PCM_16')
        subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '64000', tmp.name, m4a], check=True)
        os.unlink(tmp.name)
    texts[cid] = text; done += 1
    if done % 25 == 0: print(f'  {done} recorded…', flush=True)

files = sorted(c for c in clips if os.path.exists(os.path.join(AUDIO, c + '.m4a')))
json.dump({'voices': {'en': voice_id}, 'files': files, 'texts': {k: texts[k] for k in files if k in texts}},
          open(man_path, 'w'), indent=2, sort_keys=True, ensure_ascii=False)
print(f'recorded {done}, unchanged {skipped}; manifest lists {len(files)} clips ({voice_id})')
