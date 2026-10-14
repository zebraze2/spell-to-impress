/* Dev tool: plays one level by itself to check the whole flow — pop quiz, spelling for clothes (one miss on
   purpose), a colour unlock, a word for the hair salon, the runway word, the show and the unlock.
   Open e.g. http://localhost:5177/?reset&unlock&level=3&go=1&seconds=40 and run in the console:
     import('/tools/autoplay.js').then(m => m.run())
   The log of what happened builds up in window.__autolog (window.__autodone is set at the end).
   Nothing here ships with the game. */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
const visible = id => !!$(id) && !$(id).hidden;
const text = id => $(id).innerText.replace(/\s+/g, ' ').trim();
async function until(fn, ms, what) {
  const t0 = performance.now();
  while (!fn()) { if (performance.now() - t0 > ms) throw new Error('timed out waiting for ' + what); await sleep(80); }
}

export async function run({ quizWrong = 4, words = 9 } = {}) {
  const log = window.__autolog = []; window.__autodone = false;
  try {
    await until(() => window.__game, 20000, 'the game to load');
    const G = window.__game, UI = G.UI;
    let last = null;
    const orig = UI.spell;
    UI.spell = (word, forName, cb, opts = {}) => { last = { word, opts }; return orig(word, forName, cb, opts); };
    const enter = box => box.onkeydown({ key: 'Enter', preventDefault() {}, stopPropagation() {} });
    async function answer(right) {
      await until(() => visible('spellCard') && last, 8000, 'a spelling card');
      const { word, opts } = last; last = null;
      const fill = opts.mode === 'fill', target = fill ? word.chunk : word.w;
      const box = () => fill ? document.querySelector('#spellFill input') : $('spellInput');
      log.push(`${opts.quiz ? 'quiz' : fill ? 'fill' : 'word'}: ${word.w}${fill ? ' [' + word.chunk + ']' : ''} ${right ? 'right' : 'wrong'} · "${text('spellCloze')}"`);
      box().value = right ? target : target + 'x'; enter(box());
      if (!right && !opts.quiz) { await sleep(3300); box().value = target; enter(box()); }   // look, then spell it again
      await until(() => !visible('spellCard'), 6000, 'the card to close');
    }

    // 1. pop quiz
    if (visible('quizCard')) {
      log.push('quiz intro: ' + text('quizCard').slice(0, 160));
      $('quizGo').click();
      for (let i = 0; i < 12; i++) { await answer(i < 12 - quizWrong); await sleep(350); }
      await until(() => visible('quizCard') && /boutique/i.test($('quizGo').textContent), 10000, 'quiz results');
      log.push('quiz results: ' + text('quizCard').slice(0, 400));
      $('quizGo').click();
    }
    await until(() => visible('startCard'), 8000, 'the start card');
    log.push('start card: ' + text('startCard').slice(0, 400));
    $('startGo').click();
    await until(() => G.phase === 'dress', 5000, 'the round');

    // 2. spell for clothes
    const items = G.room.interact.filter(it => it.kind === 'item');
    log.push(`room: ${items.length} items · ${G.level.wing} · theme ${G.THEME.name}`);
    for (let i = 0; i < words && i < items.length; i++) {
      G.use(items[i]);
      await answer(i !== 1);
      await until(() => visible('panel'), 5000, 'the colour panel');
      if (i === 0) {
        document.querySelector('#panel .unlockbtn').click();
        await answer(true);
        await until(() => visible('panel') && !visible('spellCard'), 5000, 'the panel again');
        log.push('colours unlocked: ' + !document.querySelector('#panelA .sec.locked'));
      }
      $('panelDone').click(); await sleep(150);
    }
    log.push(`wearing: ${[...G.player.worn.values()].map(w => w.def.id).join(', ')}`);

    // 3. a spelled word opens the hair salon
    G.use(G.room.interact.find(it => it.kind === 'hair'));
    await until(() => visible('spellCard') && last, 5000, 'the salon word');
    log.push('salon: ' + text('spellFor'));
    await answer(true);
    await until(() => visible('panel'), 5000, 'the salon');
    log.push('salon opened: ' + text('panelTitle'));
    $('panelDone').click(); await sleep(150);

    // 4. time's up -> runway word -> show
    for (let k = 0; k < 200 && G.phase === 'dress'; k++) G.advance(1);
    await until(() => visible('spellCard') && last, 8000, 'the runway word');
    log.push('runway: ' + text('spellFor'));
    await answer(true);
    for (let k = 0; k < 600 && G.phase !== 'results'; k++) {
      const star = document.querySelector('#voteBar:not([hidden]) .stars button[data-n="4"]');
      if (star) star.click();
      G.advance(0.5); await sleep(15);
    }
    await until(() => visible('endCard'), 10000, 'the end card');
    log.push('end: ' + text('endCard'));
    const prog = JSON.parse(localStorage.getItem('sti-progress-v3'));
    const counts = {};
    for (const v of Object.values(prog.levels[G.level.id].words)) counts[v] = (counts[v] || 0) + 1;
    log.push(`saved: unlocked=${prog.unlocked} · marks ${JSON.stringify(counts)} · score ${G.session.firstRight}/${G.session.firstTries}`);
  } catch (e) { log.push('FAILED: ' + e.message); }
  window.__autodone = true;
  return log;
}
