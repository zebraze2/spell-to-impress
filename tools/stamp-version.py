"""Stamp every script/style link and every relative ES-module import with one version
taken from the contents of all the game's code. GitHub Pages caches files for 10 minutes,
so without this a browser could mix old and new modules after an update.
All imports get the SAME version, so each module is still loaded only once.
Run before every commit that gets pushed:

    python3 tools/stamp-version.py
"""
import glob, hashlib, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
files = sorted(glob.glob(os.path.join(ROOT, 'js', '*.js')) + glob.glob(os.path.join(ROOT, 'css', '*.css')))
strip = re.compile(r'\?v=\w+')
digest = hashlib.sha1()
for f in files:
    digest.update(strip.sub('', open(f, encoding='utf-8').read()).encode())
version = digest.hexdigest()[:8]

# index.html: <script src="js/main.js"> and <link href="css/game.css">
index = os.path.join(ROOT, 'index.html')
html = open(index, encoding='utf-8').read()
html = re.sub(r'((?:src|href)=")((?:js|css)/[\w-]+\.(?:js|css))(?:\?v=\w+)?(")', lambda m: f'{m.group(1)}{m.group(2)}?v={version}{m.group(3)}', html)
open(index, 'w', encoding='utf-8').write(html)

# js modules: from './x.js'  /  import('./x.js')
imp = re.compile(r"""((?:from|import\()\s*['"])(\./[\w-]+\.js)(?:\?v=\w+)?(['"])""")
for f in glob.glob(os.path.join(ROOT, 'js', '*.js')):
    src = open(f, encoding='utf-8').read()
    out = imp.sub(lambda m: f'{m.group(1)}{m.group(2)}?v={version}{m.group(3)}', src)
    if out != src: open(f, 'w', encoding='utf-8').write(out)
print('stamped', version)
