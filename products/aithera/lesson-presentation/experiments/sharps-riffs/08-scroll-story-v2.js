/* Riff 08 · V2 — "The Next Pair of Hands". Logic for 08-scroll-story-v2.html.
   1 scene drawings  2 page chrome  3 stepped scenes  4 components  5 decisions */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;
  const reduced = () => root.classList.contains('rm');

  /* ======================================================================
     1 · SCENE DRAWINGS. Placeholders for V01–V03 and V09: one collection
     area, reused for the opening and the alternate ending, so the two read
     as the same shot (same framing, lighting and movement).
     ====================================================================== */
  const collection = ART.collection, workspace = ART.workspace;

  const sceneSVG = (kind) => kind === 'alt' ? `
    <svg class="art" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect x="-2400" y="-1400" width="5600" height="3400" fill="url(#wp)"/>
      ${collection(true)}
      <text class="tl tr0" x="24" y="60">LATER, DURING WASTE COLLECTION</text>
      <text class="tl tr1" x="24" y="60" fill="#2ee6cf">ALTERNATE ENDING: DISPOSAL PLANNED IN ADVANCE.</text>
      <g class="inset"><rect x="500" y="44" width="276" height="118" rx="12" fill="rgba(7,11,20,.84)" stroke="#2ee6cf"/><use href="#bin" x="520" y="64" width="54" height="68"/>
        <text x="592" y="88" font-family="Open Sans,sans-serif" font-size="12" font-weight="700" fill="#2ee6cf">EARLIER</text><text x="592" y="110" font-family="Open Sans,sans-serif" font-size="13" fill="#eaf0fb">Chris used the designated</text><text x="592" y="128" font-family="Open Sans,sans-serif" font-size="13" fill="#eaf0fb">sharps container.</text></g>
    </svg><div class="stage-cap"><span class="cap"></span><span class="pips"></span></div>` : `
    <svg class="art" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect x="-2400" y="-1400" width="5600" height="3400" fill="url(#wp)"/>
      ${collection(false)}
      ${workspace()}
      <text class="tl t0" x="24" y="60">WASTE COLLECTION</text>
      <text class="tl t2 flash" x="24" y="60">↺ EARLIER THAT DAY</text>
      <text class="tl t3 flash" x="24" y="60">↺ EARLIER THAT DAY</text>
    </svg><div class="stage-cap"><span class="cap"></span><span class="pips"></span></div>`;

  /* kit-drawn art that lives in static markup */
  $('#shVid').innerHTML = ART.sheathScene();
  $('#gloveFig').innerHTML = ART.gloves();
  $('#p5').innerHTML = '<span class="atag">P05 · generic diagram</span>' + ART.sheathStill(false, '', true);
  $('#p6').innerHTML = '<span class="atag">P06 · generic diagram</span>' + ART.sheathStill(true, '', true);
  $('#stageI').insertAdjacentHTML('afterbegin', ART.instr());
  $('#stageK').insertAdjacentHTML('afterbegin', ART.anatomy());

  $$('[data-scene]').forEach(f => { f.insertAdjacentHTML('afterbegin', '<span class="atag"></span>'); f.insertAdjacentHTML('beforeend', sceneSVG(f.dataset.scene)); });
  $('#stageS').insertAdjacentHTML('beforeend', '<div class="rw-veil" aria-hidden="true"></div><div class="vhs" aria-hidden="true"><div class="vhs-noise"></div><div class="vhs-lines"></div><div class="vhs-bar"></div><div class="vhs-ui"><span class="ic">◀◀</span><span>REWIND</span><span class="tc vhs-tc">0:24</span></div></div>');

  /* container with a marked fill line (V07 still) */
  const fillArt = ART.fill;
  $('#fillviz1').innerHTML = `<div class="frame"><span class="atag">V07 · illustrated</span>${ART.fillTall()}</div>`;
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { $('#fillviz1').classList.add('go'); o.disconnect(); } }), { threshold: .5 }).observe($('#fillviz1'));

  /* G03 grid: 40 injuries; the first 34 are one category, the last 6 the other */
  $('#grid40').innerHTML = Array.from({ length: 40 }, (_, i) => `<i class="mk ${i < 34 ? 'a' : 'b'}"></i>`).join('');

  /* ======================================================================
     2 · PAGE CHROME
     ====================================================================== */
  const rmBtn = $('#rmBtn'), tagBtn = $('#tagBtn');
  const setRM = (on) => { root.classList.toggle('rm', on); rmBtn.setAttribute('aria-pressed', String(on)); };
  setRM(matchMedia('(prefers-reduced-motion: reduce)').matches);
  rmBtn.addEventListener('click', () => setRM(!reduced()));
  tagBtn.addEventListener('click', () => { const on = document.body.classList.toggle('notags'); tagBtn.setAttribute('aria-pressed', String(!on)); });

  const expo = $('#expo'), expoBtn = $('#expoBtn');
  const setExpo = (open) => { expo.classList.toggle('open', open); expoBtn.setAttribute('aria-expanded', String(open)); if (open) $('#expoX').focus(); else expoBtn.focus(); };
  expoBtn.addEventListener('click', () => setExpo(!expo.classList.contains('open')));
  $('#expoX').addEventListener('click', () => setExpo(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && expo.classList.contains('open')) setExpo(false); });

  const rvIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  const watchRv = () => $$('.rv:not(.in)').forEach(el => rvIO.observe(el));

  /* hero video: never plays. currentTime eases toward the scroll position. */
  const heroEl = $('#top'), heroCopy = $('#heroCopy'), heroCue = $('#heroCue'), vid = $('#heroVid');
  const heroFade = $('.hero-fade'), heroVig = $('.hero-vig');
  let vidTarget = 0, vidCur = 0, vidReady = false, vidBusy = false;
  const primeVid = () => { vid.play().then(() => vid.pause()).catch(() => {}); };   // iOS: unlocks seeking
  const vidLoop = () => {
    if (!vidReady || !vid.duration) return;
    if (reduced()) { vid.currentTime = 0; vidBusy = false; return; }
    vidCur += (vidTarget - vidCur) * 0.18;
    if (Math.abs(vidTarget - vidCur) < 0.004) vidCur = vidTarget;
    if (Math.abs(vid.currentTime - vidCur) > 0.01) vid.currentTime = vidCur;
    if (vidCur !== vidTarget) requestAnimationFrame(vidLoop); else vidBusy = false;
  };
  vid.addEventListener('loadedmetadata', () => { vidReady = true; primeVid(); vidLoop(); });
  addEventListener('touchstart', primeVid, { once: true, passive: true });
  const updateHero = () => {
    const hp = clamp(scrollY / (heroEl.offsetHeight - innerHeight));
    if (vid.duration) { vidTarget = hp * vid.duration; if (!vidBusy) { vidBusy = true; requestAnimationFrame(vidLoop); } }
    const tp = clamp(hp / .32);
    heroCopy.style.opacity = (1 - tp).toFixed(2);
    heroCopy.style.transform = reduced() ? '' : `translate3d(0,${(-tp * 70).toFixed(0)}px,0)`;
    heroCue.style.opacity = (1 - clamp(hp / .12)).toFixed(2);
    heroVig.style.opacity = (1 - tp * .85).toFixed(2);
    heroFade.style.opacity = (0.25 + clamp((hp - .78) / .22) * .75).toFixed(2);
  };

  const prog = $('#prog'); let ticking = false;
  const frame = () => { ticking = false; const m = document.documentElement.scrollHeight - innerHeight; prog.style.transform = `scaleX(${m > 0 ? clamp(scrollY / m) : 0})`; updateHero(); };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });

  /* ======================================================================
     3 · STEPPED SCENES: the card in the middle of the screen sets the picture
     ====================================================================== */
  const TAGS = {
    stageS: ['V01 · illustrated scene', 'V01 + G01 · illustrated cutaway', 'V02 · rewind prompt', 'V02 · illustrated scene', 'V03 · illustrated scene'],
    stageR: ['V09 · illustrated scene', 'V09 · alternate ending', 'V09 · alternate ending'],
    stageD: ['G03 · chart', 'G03 · chart', 'G03 · chart', 'EPINet · separate dataset'],
    stageK: ['P04 + G02 · annotated photo', 'P04 + G02', 'P04 + G02', 'P04 + G02', 'P04 + G02']
  };
  const hooks = {};
  $$('.qt').forEach(p => { let n = 0; p.innerHTML = p.textContent.split(' ').map(w => `<span class="w" style="--i:${n++}">${w}</span>`).join(' '); });
  $$('.scrolly').forEach(sc => {
    const stage = $('.frame', sc), steps = $$('.step', sc), real = steps.filter(s => !s.classList.contains('lead-step') && !s.classList.contains('quote-step'));
    const cap = $('.cap', stage), pips = $('.pips', stage), tag = $('.atag', stage);
    pips.innerHTML = real.map(() => '<i></i>').join('');
    const set = (el) => {
      const lead = el.classList.contains('lead-step'), quote = el.classList.contains('quote-step'), i = lead ? 0 : quote ? real.length - 1 : real.indexOf(el), card = $('.card', el);
      stage.dataset.quote = quote ? '1' : '0';
      stage.dataset.step = i; stage.dataset.lead = lead ? '1' : '0';
      steps.forEach(s => s.classList.toggle('on', s === el));
      $$('i', pips).forEach((p, k) => p.classList.toggle('on', !lead && k <= i));
      cap.innerHTML = quote || lead ? '' : '<b>' + (i + 1) + ' / ' + real.length + '</b>' + card.dataset.cap;
      const t = (TAGS[stage.id] && TAGS[stage.id][i]) || card.dataset.tag;
      if (tag && t) tag.textContent = t;
      if (hooks[stage.id]) hooks[stage.id](i);
    };
    set(steps[0]);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(e.target); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
  });

  /* wide layout: centre each pinned card on the same horizontal midline as the scene */
  const centreCards = () => {
    const narrow = matchMedia('(max-width:1100px)').matches, bar = 56;
    $$('.step .card:not(.quote-card)').forEach(c => {
      if (narrow) { c.style.top = ''; c.style.removeProperty('--lt'); return; }
      const top = Math.max(bar + 12, bar + (innerHeight - bar - c.offsetHeight) / 2);
      if (c.classList.contains('lead-card')) c.style.setProperty('--lt', top + 'px'); else c.style.top = top + 'px';
    });
  };
  centreCards(); addEventListener('resize', centreCards); if (document.fonts) document.fonts.ready.then(centreCards);

  /* ======================================================================
     4 · V05 PLAYER: normal-speed playback with replay, never scroll-scrubbed,
     because the physical technique shouldn't depend on trackpad speed.
     ====================================================================== */
  const DUR = 9; let plT = 0, plRun = false, plLast = 0;
  const fmt = s => '0:0' + Math.floor(s);
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const shDraw = (t) => {
    const q = id => document.getElementById(id); if (!q('shSheath')) return;
    q('shSheath').setAttribute('transform', `translate(${(46 * ease(clamp((t - 2) / 3))).toFixed(2)} 0)`);
    q('shHalo').style.opacity = t < 2.6 ? 1 : 0;
    q('shL1').style.opacity = t < 2 ? 1 : 0; q('shL2').style.opacity = (t >= 2 && t < 5) ? 1 : 0; q('shL3').style.opacity = t >= 5 ? 1 : 0;
    q('shLock').style.opacity = t >= 5 ? 1 : 0; q('shCap').style.opacity = t >= 6.2 ? 1 : 0;
  };
  const plDraw = () => { shDraw(plT); $('#plBar').style.width = (plT / DUR * 100) + '%'; $('#plTc').textContent = fmt(plT) + ' / ' + fmt(DUR); $('#plPlay').textContent = plRun ? '❚❚ Pause' : '▶ Play'; };
  const plLoop = (t) => { if (!plRun) return; plT = Math.min(DUR, plT + (t - plLast) / 1000); plLast = t; plDraw(); if (plT >= DUR) { plRun = false; plDraw(); return; } requestAnimationFrame(plLoop); };
  const plStart = () => { if (plT >= DUR) plT = 0; plRun = true; plLast = performance.now(); requestAnimationFrame(plLoop); plDraw(); };
  $('#plPlay').addEventListener('click', () => { if (plRun) { plRun = false; plDraw(); } else plStart(); });
  $('#plRe').addEventListener('click', () => { plT = 0; plStart(); });
  /* the rewind: the learner chooses when it happens. The "go back" card waits on the opening scene; pressing its
     button plays the opening backwards under VHS static, then cuts to the earlier scene (never a crossfade) */
  const frameS = $('#stageS'), tcEl = $('.vhs-tc', frameS);
  const scS = $('#scS');
  let rewound = false, curI = 0, rwTimer = 0, tcRaf = 0;
  /* once the scene has changed, carry the reader on to Chris's card instead of leaving them on the prompt */
  const toChris = () => setTimeout(() => $$('.step', scS)[4].scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }), 300);
  const playRewind = () => {
    clearTimeout(rwTimer); cancelAnimationFrame(tcRaf); scS.removeAttribute('data-hold'); scS.setAttribute('data-hide-rw', '');   // no card while it plays
    if (reduced()) { frameS.dataset.step = '3'; rewound = true; toChris(); return; }
    frameS.dataset.step = '0'; frameS.dataset.lead = '0'; frameS.dataset.rw = '1';
    const t0 = performance.now(), TOTAL = 2300;
    const tick = (t) => { const k = clamp((t - t0) / TOTAL); tcEl.textContent = '0:' + String(Math.round(24 * (1 - k))).padStart(2, '0'); if (k < 1) tcRaf = requestAnimationFrame(tick); };
    tcRaf = requestAnimationFrame(tick);
    rwTimer = setTimeout(() => { frameS.dataset.step = '3'; delete frameS.dataset.rw; rewound = true; toChris(); }, TOTAL);
  };
  hooks.stageS = (i) => {
    clearTimeout(rwTimer); cancelAnimationFrame(tcRaf); delete frameS.dataset.rw;
    scS.removeAttribute('data-hide-rw');
    const prev = curI; curI = i;
    if (i < 2 || (i === 2 && prev >= 3)) rewound = false;
    scS.toggleAttribute('data-hold', i === 2 && !rewound);
    if (i === 2 && !rewound) frameS.dataset.step = '1';   // hold on the opening scene until they press Rewind
    if (i >= 3) rewound = true;
  };
  $('#rewindBtn').addEventListener('click', () => { if (curI === 2) playRewind(); });
  hooks.stageI = (i) => { if (i !== 1) { plRun = false; plT = 0; plDraw(); } };
  plDraw();

  /* ======================================================================
     5 · THE THREE DECISIONS. Change an answer any time; nothing locks.
     Wrong answers get an explanation, never a video of the mistake.
     ====================================================================== */
  const OPT = ['A', 'B', 'C'];
  const visD1 = ART.decD1(), visD3 = ART.decD3();
  const DECS = [
    { part: 'Situation 1', tag: '', vis: visD1,
      sit: `<p>You have just used the safety-equipped needle shown in this article. The loose cap has rolled under a counter. A designated sharps container is across the room.</p>`, ask: 'What should you do next?',
      opts: [
        ['Activate the built-in safety sheath and take the device to the sharps container.', true, 'Correct. Use the device’s applicable safety feature and complete disposal in the designated container. For the next task, plan the disposal route before starting.'],
        ['Retrieve the cap and recap the needle before carrying it.', false, 'Recapping is not the step demonstrated here. The built-in safety sheath and the loose cap are different. Activate the safety feature and use the designated container.'],
        ['Wrap the needle in paper towel until a container is easier to reach.', false, 'Soft wrapping is not an acceptable substitute. Do not put the needle in general waste or use improvised wrapping. Use its safety feature and a proper sharps container.']],
      after: `<div class="stillfig">${ART.sheathStill(true, 'Safety feature activated, then straight to the container', false, false)}</div>` },
    { part: 'Situation 2', tag: '<span class="rev">Researched addition · CDC</span>', vis: null,
      sit: `<p>You have finished using the needle. The nearby sharps container has reached its marked fill line.</p><p>There appears to be enough space for one more item.</p>`, ask: 'What should you do?',
      opts: [
        ['Add the needle because it appears to fit.', false, 'The fill line is the limit. Visible headspace does not make further filling appropriate.'],
        ['Push the contents down to make room.', false, 'Do not compress or manipulate the contents to create space. Follow the replacement process instead.'],
        ['Use the device’s safety feature, use another suitable designated container, and notify the person responsible for replacement.', true, 'Correct for this scenario. Do not overfill the existing container. Follow your workplace procedure if an alternative container is not available.']],
      after: '' },
    { part: 'Situation 3', tag: '<span class="rev">Researched addition · OSHA</span>', vis: visD3,
      sit: `<p>You are trained and equipped to clean up broken glass that may be contaminated with blood.</p>`, ask: 'Which approach should you use?',
      opts: [
        ['Pick up the larger pieces with gloved hands.', false, 'Not by hand—even with gloves. Use mechanical collection methods.'],
        ['Use appropriate tools, such as a brush and dustpan or tongs, and the designated disposal process.', true, 'Correct. Keep your hands away from the glass and follow the workplace’s cleanup procedure.'],
        ['Wrap the pieces in a soft bag before putting them in regular trash.', false, 'That does not provide the required sharps containment. Use the designated process for contaminated sharps.']],
      after: ART.glassStrip() }
  ];
  $('#decs').innerHTML = DECS.map((d, di) => `
    <article class="dec" data-d="${di}"${di ? ' hidden' : ''}>
      <div class="vis">${d.vis || `<div class="frame" style="--arn:2.2;position:absolute;inset:0;width:100%;aspect-ratio:auto;border:0;border-radius:0;box-shadow:none">${fillArt(true)}</div>`}</div>
      <div class="body"><span class="part">${d.part}</span>${d.tag}
        <h3>${di === 0 ? 'A cap falls' : di === 1 ? 'A container is full' : 'The cleanup is more complicated'}</h3>
        <div class="sit">${d.sit}</div><p class="ask">${d.ask}</p>
        <div class="opts" role="radiogroup" aria-label="${d.part}">${d.opts.map((o, i) => `<button class="opt ${o[1] ? 'ok' : 'no'}" role="radio" aria-checked="false" data-i="${i}"><i>${OPT[i]}</i><span>${o[0]}</span></button>`).join('')}</div>
        <div class="fb" hidden aria-live="polite"></div><div class="after" hidden>${d.after}</div>
      </div></article>`).join('');
  $$('.dec').forEach(el => {
    const d = DECS[+el.dataset.d], fb = $('.fb', el), after = $('.after', el);
    $$('.opt', el).forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i, o = d.opts[i];
      $$('.opt', el).forEach(x => x.setAttribute('aria-checked', String(x === b)));
      fb.hidden = false; fb.innerHTML = `<b class="h ${o[1] ? 'ok' : 'no'}">${o[1] ? 'Correct' : 'Not that one'}</b>${o[2].replace(/^Correct[.,]? ?/, '').replace(/^Correct for this scenario\. ?/, '')}`;
      after.hidden = !(o[1] && d.after);
    }));
  });

  /* seams: report how far through its pinned run each one is (0 to 1) so the line can drift and fade */
  const seams = $$('.seam');
  const paintSeams = () => seams.forEach(s => {
    const r = s.getBoundingClientRect(), run = r.height - innerHeight;
    s.style.setProperty('--sp', run > 0 ? clamp(-r.top / run).toFixed(3) : '.5');
  });
  addEventListener('scroll', paintSeams, { passive: true }); addEventListener('resize', paintSeams); paintSeams();

  /* practice mode: one situation at a time. Back and Next are the only navigation; nothing about the
     answers is scored. The rest of the article opens once every situation has a response. */
  const decEls = $$('.dec'), answered = new Set();
  let cur = 0, unlocked = false;
  /* the pane sits in the middle of the screen while it's pinned; the spacer below it gives the page enough
     length to keep it pinned until the learner is done (and collapses once they are) */
  const stage = $('#prStage'), runEl = $('#prRun');
  function pinLayout(release) {
    const bar = 56, maxH = innerHeight - bar - 52, h = Math.min(stage.scrollHeight, maxH);
    const top = Math.max(bar + 12, bar + (innerHeight - bar - h) / 2);
    stage.style.setProperty('--prTop', top + 'px');
    runEl.style.setProperty('--prRun', (release || unlocked) ? '0px' : Math.max(0, innerHeight - 28 - top - h) + 'px');
  }
  pinLayout();
  new ResizeObserver(() => pinLayout()).observe(stage); addEventListener('resize', () => pinLayout());
  const head = $('#prHead');
  const fadeHead = () => {
    const r = head.getBoundingClientRect(), gone = clamp(((56 + 30) - r.top) / (r.height * .55));
    head.style.opacity = (1 - gone).toFixed(2);
  };
  addEventListener('scroll', fadeHead, { passive: true }); fadeHead();
  const unlock = (scroll) => {
    if (unlocked) return; unlocked = true;
    const rest = $('#afterGate'); rest.hidden = false; rest.classList.add('opening');
    $('#gate').hidden = true;
    document.body.classList.remove('locked');
    pinLayout(true);
    watchRv(); centreCards();
    if (scroll) setTimeout(() => $('#s8').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }), 450);
  };
  const GATE_LOCK = $('#gateIc').innerHTML;
  const paintGate = () => {
    $$('#gateDots i').forEach((d, k) => d.classList.toggle('on', k < answered.size));
    $('#gateCount').textContent = answered.size + ' of ' + decEls.length + ' complete';
    const done = answered.size === decEls.length;
    $('#gateCard').classList.toggle('done', done);
    $('#gateTitle').textContent = done ? 'Activity complete' : 'Complete the activity to continue';
    $('#gateText').textContent = done ? 'Select Continue to move on to the rest of the article.' : 'The rest of the article opens when you’ve finished the activity above.';
    $('#gateIc').innerHTML = done
      ? '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
      : GATE_LOCK;
  };
  const showDec = (i) => {
    cur = i;
    decEls.forEach((d, k) => { d.hidden = k !== i; });
    $('#prCount').textContent = 'Situation ' + (i + 1) + ' of ' + decEls.length;
    $('#prBack').disabled = i === 0;
    $('#prNext').textContent = i === decEls.length - 1 ? (answered.size === decEls.length ? 'Continue →' : 'Finish') : 'Next situation →';
    $('#prNext').disabled = !answered.has(i);   // an answer is required before moving on
  };
  $('#prBack').addEventListener('click', () => showDec(Math.max(0, cur - 1)));
  $('#prNext').addEventListener('click', () => {
    if (cur < decEls.length - 1) { showDec(cur + 1); return; }
    if (answered.size < decEls.length) return;
    unlock(true);
  });
  decEls.forEach((d, i) => $$('.opt', d).forEach(b => b.addEventListener('click', () => {
    answered.add(i); paintGate(); showDec(cur);
  })));
  $('#gateSkip').addEventListener('click', () => unlock(true));   // review shortcut, only visible with review marks on
  paintGate(); showDec(0); pinLayout();

  watchRv();
  frame();
})();
