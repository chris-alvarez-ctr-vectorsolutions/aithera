/* Hazing riff 01 · "After Rookie Night". Logic for 01-after-rookie-night.html.
   1 routing (which chapters are in the cut)  2 scene drawings  3 page chrome and hero
   4 stepped scenes  5 activities  6 the three checks  7 "Your turn"  8 scroll-driven panels */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;
  const BAR = root.classList.contains('embed') ? 0 : 56;
  const reduced = () => root.classList.contains('rm');
  const smooth = () => (reduced() ? 'auto' : 'smooth');
  const A = window.HZART;
  $('#artdefs defs').innerHTML = A.defsHTML;

  /* ======================================================================
     1 · ROUTING. The pre-check result decides the cut, per objective:
       k1 = full | out | up   (5.1: base with check · tested out · tested up)
       f1 = std | low         (5.3: favorable · low Feel, 03R replaces 03A)
     5.2 always plays its base. Remedials 01R and 03R open from the checks.
     ====================================================================== */
  const P = new URLSearchParams(location.search);
  const K1 = ['out', 'up'].includes(P.get('k1')) ? P.get('k1') : 'full';
  const F1 = P.get('f1') === 'low' ? 'low' : 'std';
  $$('[data-perm="01A"]').forEach(el => { el.hidden = K1 !== 'full'; });
  $$('[data-perm="01B"]').forEach(el => { el.hidden = K1 !== 'up'; });
  const s4r = $('#s4r'), f1Host = $('#f1');
  if (F1 === 'low') {   // 03R carries everything 03A does, plus the second incident, before the attitude check
    f1Host.parentNode.insertBefore(s4r, f1Host);
    s4r.hidden = false;
    $('#f1Tag').textContent = 'M5-03R';
    $('#f1TagText').textContent = 'Speaking Up Without Your Name on It · F1 Feel / Believe · remedial · low Feel pre-check: all of 03A, then the second incident';
  }
  const LBL = { full: 'Full', out: 'Tested out', up: 'Tested up', std: 'Favorable', low: 'Low (remedial)' };
  const cut = [
    ...(K1 === 'full' ? ['M5-01A', '5.1 check', ['M5-01R on a miss, then one retry']] : K1 === 'up' ? ['M5-01B · no check afterward'] : []),
    'M5-02A', '5.2 self-check',
    ...(F1 === 'low' ? ['M5-03R (03A + second incident)', '5.3 attitude check'] : ['M5-03A', '5.3 attitude check', ['M5-03R if the answer isn’t agree']]),
    'Your turn · 5.4 items', 'Reprise + keep-this card'];
  $('#pathStrip').innerHTML = `<b>This cut</b> · 5.1 ${LBL[K1]} · 5.3 ${LBL[F1]}. Change the pre-check result under Options.
    <ol>${cut.map(c => Array.isArray(c) ? `<li class="opt">${c[0]}</li>` : `<li>${c}</li>`).join('')}</ol>
    ${K1 === 'out' ? 'The 5.1 narration is not in the cut. ' : ''}Section 5.4 is in the extract but not the structure map; its mastery items are the “Your turn” activity.`;
  $$('.seg').forEach(seg => {
    const cur = seg.dataset.key === 'k1' ? K1 : F1;
    $$('button', seg).forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.v === cur));
      b.addEventListener('click', () => {
        const u = new URL(location.href), def = seg.dataset.key === 'k1' ? 'full' : 'std';
        if (b.dataset.v === def) u.searchParams.delete(seg.dataset.key); else u.searchParams.set(seg.dataset.key, b.dataset.v);
        u.hash = ''; location.href = u.toString();
      });
    });
  });

  /* ======================================================================
     2 · SCENE DRAWINGS
     ====================================================================== */
  const svgWrap = (inner, cls = 'art') => `<svg class="${cls}" viewBox="0 0 800 520" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${inner}</svg>`;
  const capHTML = '<div class="stage-cap"><span class="cap"></span><span class="pips"></span></div>';
  $('#stageD').insertAdjacentHTML('afterbegin', svgWrap(A.dorm('base')) + capHTML +
    '<div class="tchip" aria-hidden="true"><span class="c0 night">Rookie night · 1:40 a.m.</span><span class="c1">The next morning</span></div>');
  $('#stageC').insertAdjacentHTML('afterbegin', svgWrap(A.corridor()) + capHTML);
  $('#stageC .plate > div').innerHTML = A.route();
  $('#stageF').insertAdjacentHTML('afterbegin', svgWrap(A.corridor(true)) + capHTML);
  $('#stageT').insertAdjacentHTML('afterbegin', svgWrap(A.dorm('trio')) + capHTML);
  $('#stageR').insertAdjacentHTML('afterbegin', svgWrap(A.dorm('reprise')) + capHTML +
    '<div class="tchip" aria-hidden="true"><span class="c0 good">The morning after, again</span></div>');
  $('#stageL').insertAdjacentHTML('afterbegin', A.timeline());
  $('#poolFig').innerHTML = `<svg viewBox="0 64 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${A.pool()}</svg>`;
  $$('.routeFig').forEach(f => { f.innerHTML = A.route(); });
  $('#tracksFig').innerHTML = A.tracks();
  /* day-lit scenes keep their chips visible; the dorm's chips switch with the night */
  $$('#stageR .tchip span, #stageD .tchip .c0').forEach(s => { s.style.opacity = 1; });

  /* ======================================================================
     3 · PAGE CHROME AND HERO
     ====================================================================== */
  const rmBtn = $('#rmBtn'), tagBtn = $('#tagBtn');
  const setRM = (on) => { root.classList.toggle('rm', on); rmBtn.setAttribute('aria-pressed', String(on)); };
  setRM(matchMedia('(prefers-reduced-motion: reduce)').matches);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => setRM(e.matches));
  rmBtn.addEventListener('click', () => { setRM(!reduced()); drawWater(performance.now() / 1000); });
  tagBtn.addEventListener('click', () => { const on = document.body.classList.toggle('notags'); tagBtn.setAttribute('aria-pressed', String(!on)); requestAnimationFrame(layoutAll); });
  if (P.get('marks') === '1') tagBtn.click();

  const toolsBtn = $('#toolsBtn'), toolsMenu = $('#toolsMenu');
  const setTools = (open) => { toolsMenu.hidden = !open; toolsBtn.setAttribute('aria-expanded', String(open)); };
  toolsBtn.addEventListener('click', (e) => { e.stopPropagation(); setTools(toolsMenu.hidden); });
  document.addEventListener('click', (e) => { if (!toolsMenu.hidden && !toolsMenu.contains(e.target)) setTools(false); });
  const expo = $('#expo'), expoBtn = $('#expoBtn');
  const setExpo = (open) => { expo.classList.toggle('open', open); expoBtn.setAttribute('aria-expanded', String(open)); if (open) $('#expoX').focus(); else expoBtn.focus(); };
  expoBtn.addEventListener('click', () => setExpo(!expo.classList.contains('open')));
  $('#expoX').addEventListener('click', () => setExpo(false));
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!toolsMenu.hidden) { setTools(false); toolsBtn.focus(); }
    else if (expo.classList.contains('open')) setExpo(false);
  });

  const rvIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  const watchRv = () => $$('.rv:not(.in)').forEach(el => { if (el.offsetParent !== null) rvIO.observe(el); });

  /* the hero's water: a small canvas of moving caustic light, blurred up to full screen.
     Drawn only while the hero is on screen; one still frame under reduced motion. */
  const cv = $('#water'), cx = cv.getContext('2d'), W = cv.width, H = cv.height, img = cx.createImageData(W, H);
  /* the classic iterated-distortion caustic: each pass bends the sample point, and the light
     gathers where the bends converge into thin, cell-shaped lines */
  function drawWater(time) {
    const d = img.data, TAU = Math.PI * 2, IN = .005; let k = 0;
    const tt = time * .45 + 23;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const px = (x / W) * TAU * 1.6 - 250, py = (y / H) * TAU * .9 - 250;
      let ix = px, iy = py, c = 1;
      for (let n = 0; n < 4; n++) {
        const t = tt * (1 - 3.5 / (n + 1));
        const nx = px + Math.cos(t - ix) + Math.sin(t + iy), ny = py + Math.sin(t - iy) + Math.cos(t + ix);
        ix = nx; iy = ny;
        c += 1 / Math.hypot(px / (Math.sin(ix + t) / IN), py / (Math.cos(iy + t) / IN));
      }
      c = 1.17 - Math.pow(c / 4, 1.4);
      const v = Math.min(1, Math.pow(Math.abs(c), 7));
      d[k++] = 4 + v * 70; d[k++] = 26 + v * 200; d[k++] = 48 + v * 180; d[k++] = 255;
    }
    cx.putImageData(img, 0, 0);
  }
  let heroOn = true, wLast = 0;
  const wLoop = (now) => { if (heroOn && !reduced()) { if (now - wLast > 33) { drawWater(now / 1000); wLast = now; } requestAnimationFrame(wLoop); } };
  new IntersectionObserver(es => es.forEach(e => { const was = heroOn; heroOn = e.isIntersecting; if (heroOn && !was) requestAnimationFrame(wLoop); })).observe($('#top'));
  drawWater(0); requestAnimationFrame(wLoop);
  new MutationObserver(() => { if (!reduced() && heroOn) requestAnimationFrame(wLoop); }).observe(root, { attributes: true, attributeFilter: ['class'] });

  const heroEl = $('#top'), heroCopy = $('#heroCopy'), heroCue = $('#heroCue'), n1 = $('.hero-note.n1'), n2 = $('.hero-note.n2');
  const updateHero = () => {
    const hp = clamp(scrollY / Math.max(1, heroEl.offsetHeight - innerHeight));
    const tp = clamp((hp - .34) / .34);
    heroCopy.style.opacity = (1 - tp).toFixed(2);
    heroCopy.style.transform = reduced() ? '' : `translate3d(0,${(-tp * 70).toFixed(0)}px,0)`;
    heroCue.style.opacity = (1 - clamp(hp / .1)).toFixed(2);
    n1.classList.toggle('on', hp > .08); n2.classList.toggle('on', hp > .22);
    cv.style.opacity = (1 - hp * .55).toFixed(2);
  };
  const prog = $('#prog'); let ticking = false;
  const frame = () => { ticking = false; const m = document.documentElement.scrollHeight - innerHeight; prog.style.transform = `scaleX(${m > 0 ? clamp(scrollY / m) : 0})`; updateHero(); };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });

  /* ======================================================================
     4 · STEPPED SCENES: the card in the middle of the screen sets the picture
     ====================================================================== */
  const hooks = {};
  $$('.qt').forEach(p => { let n = 0; p.innerHTML = p.textContent.split(' ').map(w => `<span class="w" style="--i:${n++}">${w}</span>`).join(' '); });
  $$('.scrolly').forEach(sc => {
    const stage = $('.frame', sc), steps = $$('.step', sc), real = steps.filter(s => !s.classList.contains('lead-step') && !s.classList.contains('quote-step'));
    const cap = $('.cap', stage), pips = $('.pips', stage);
    pips.innerHTML = real.map(() => '<i></i>').join('');
    const set = (el) => {
      const lead = el.classList.contains('lead-step'), quote = el.classList.contains('quote-step'), i = lead ? 0 : quote ? real.length - 1 : real.indexOf(el), card = $('.card', el);
      stage.dataset.quote = quote ? '1' : '0';
      stage.dataset.step = i; stage.dataset.lead = lead ? '1' : '0';
      steps.forEach(s => s.classList.toggle('on', s === el));
      $$('i', pips).forEach((p, k) => p.classList.toggle('on', !lead && k <= i));
      cap.innerHTML = quote || lead ? '' : '<b>' + (i + 1) + ' / ' + real.length + '</b>' + card.dataset.cap;
      if (hooks[stage.id]) hooks[stage.id](i, lead, quote);
    };
    set(steps[0]);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(e.target); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
  });

  /* wide layout: centre each pinned card on the scene's horizontal midline. Narrow layout: cards sit under
     the scene (CSS), except one too tall to fit there, which rises just enough to clear the screen's bottom */
  const centreCards = () => {
    const narrow = matchMedia('(max-width:1100px)').matches;
    $$('.step .card:not(.quote-card)').forEach(c => {
      if (narrow) {
        c.style.removeProperty('--lt');
        const fit = innerHeight - 16 - c.offsetHeight;
        c.style.top = !c.classList.contains('lead-card') && BAR + innerHeight * .62 - 12 > fit ? Math.max(BAR + 12, fit) + 'px' : '';
        return;
      }
      const top = Math.max(BAR + 12, BAR + (innerHeight - BAR - c.offsetHeight) / 2);
      if (c.classList.contains('lead-card')) c.style.setProperty('--lt', top + 'px'); else c.style.top = top + 'px';
    });
  };

  /* the dorm: night (ambulance light) on the lead and the 1:40 card, morning after that */
  hooks.stageD = (i, lead) => {
    const night = lead || i === 0;
    $('#stageD').dataset.night = night ? '1' : '0';
    $('#stageD .tchip .c0').style.opacity = night ? 1 : 0;
    $('#stageD .tchip .c1').style.opacity = night ? 0 : 1;
  };

  /* the corridor: each card opens its door and the camera walks to it; doors stay open behind you */
  const DOOR_AT = [0, 1, 1, 2, 3, 4];
  const doorEls = $$('#stageC .door');
  hooks.stageC = (i, lead, quote) => {
    const at = lead ? -1 : quote ? 4 : DOOR_AT[i];
    doorEls.forEach((d, k) => { d.classList.toggle('open', k <= at); d.classList.toggle('focus', !quote && k === at); });
  };

  /* the team chat: messages arrive, then each worry is typed into the reply box and deleted */
  const DRAFTS = ['should someone say something? idk, I’m not a snitch', 'if I report it they’ll know it was me', 'I don’t want to get dragged into some investigation', 'it won’t change anything anyway'];
  const draftEl = $('#phDraft'), msgs = $$('#phLog .msg'), wList = $$('#worries li');
  let typeTok = 0;
  const typeDraft = (text) => {
    const tok = ++typeTok;
    draftEl.textContent = '';
    if (!text) return;
    if (reduced()) { draftEl.textContent = text; return; }
    let n = 0;
    const out = () => { if (tok !== typeTok) return; n++; draftEl.textContent = text.slice(0, n); if (n < text.length) setTimeout(out, 34); else setTimeout(back, 1500); };
    const back = () => { if (tok !== typeTok) return; n--; draftEl.textContent = text.slice(0, Math.max(0, n)); if (n > 0) setTimeout(back, 14); };
    setTimeout(out, 500);
  };
  let lastP = -9;
  hooks.stageP = (i, lead, quote) => {
    const s = lead ? -1 : i;
    msgs.forEach(m => m.classList.toggle('on', s >= +m.dataset.at));
    const w = quote ? 9 : s - 1;
    wList.forEach((li, k) => { li.classList.toggle('now', k === w); li.classList.toggle('done', k < w); });
    const key = lead ? -1 : quote ? 99 : i;
    if (key !== lastP) { lastP = key; typeDraft(!lead && !quote && i >= 1 ? DRAFTS[i - 1] : ''); }
  };

  /* ======================================================================
     5 · ACTIVITIES
     ====================================================================== */
  const CH = {
    em:   { ic: 'fa-truck-medical',     name: '911 or campus emergency', sub: 'Significant distress, right now' },
    hot:  { ic: 'fa-phone',             name: 'National Anti-Hazing Hotline', sub: '<span class="nw">1-888-NOT-HAZE</span> · anonymous option' },
    web:  { ic: 'fa-laptop',            name: 'Anonymous online reporting', sub: 'On your institution’s website' },
    care: { ic: 'fa-comments',          name: 'Counseling and health services', sub: 'Confidential' },
    dean: { ic: 'fa-building-columns',  name: 'Dean of students office', sub: 'Explains your options' }};

  /* holds: an activity can stop the article until it's done or skipped. Everything after the first
     unfinished one (up to the end of <main>) gets .held, and that panel shows a bar with a Skip button.
     A deep link (#…) turns holds off so reviewers can land anywhere. */
  const holds = [];
  const hold = (el, msg, { skip = true, station = true, barIn = el } = {}) => {
    if (station) el.classList.add('station');
    barIn.insertAdjacentHTML('beforeend', `<div class="hold-bar"><i class="fa-solid fa-lock" aria-hidden="true"></i><span>${msg}</span>${skip ? '<button class="btn sm" type="button">Skip</button>' : ''}</div>`);
    if (skip) $('.hold-bar .btn', barIn).addEventListener('click', () => release(el));
    holds.push({ el, done: !!location.hash });
  };
  // a check that's taken again (retry) holds the article again until it's answered
  const rehold = (el) => { const h = holds.find(x => x.el === el); if (h && !location.hash) { h.done = false; applyHolds(); requestAnimationFrame(layoutAll); } };
  // while an activity holds, a spacer under it lets it settle mid-screen at the end of the page,
  // the way the Sharps "Your turn" pane docks
  const holdSpacer = document.createElement('div'); holdSpacer.className = 'hold-spacer'; holdSpacer.setAttribute('aria-hidden', 'true');
  function dockHold() {
    const here = $('.hold-here');
    if (!here) { holdSpacer.remove(); return; }
    if (here.nextElementSibling !== holdSpacer) here.after(holdSpacer);
    // a stop that pops out fills the screen itself, so it needs no room under it
    holdSpacer.style.height = here.dataset.pop ? '0px' : Math.max(0, (innerHeight - BAR - here.getBoundingClientRect().height) / 2 - 24) + 'px';
  }
  function applyHolds() {
    $$('.held').forEach(e => e.classList.remove('held'));
    $$('.hold-here').forEach(e => e.classList.remove('hold-here'));
    holds.sort((a, b) => a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    const h = holds.find(x => !x.done && x.el.offsetParent !== null);
    document.body.classList.toggle('holding', !!h);
    if (!h) { dockHold(); return; }
    h.el.classList.add('hold-here');
    for (let n = h.el; n && n.tagName !== 'MAIN'; n = n.parentElement) {
      for (let sib = n.nextElementSibling; sib; sib = sib.nextElementSibling) if (sib !== holdSpacer) sib.classList.add('held');
    }
    dockHold();
  }
  function release(el) {
    const h = holds.find(x => x.el === el);
    if (!h || h.done) return;
    h.done = true;
    const was = $$('.held');
    applyHolds();
    const opened = was.find(e => !e.classList.contains('held') && e.offsetParent !== null);
    if (opened) opened.classList.add('hold-opened');
    watchRv(); requestAnimationFrame(layoutAll);
  }

  /* keypad: spell N-O-T-H-A-Z-E; each letter lands with its digit */
  const KEYS = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
  const WORD = 'NOTHAZE', digitOf = (ch) => KEYS.find(k => k[1].includes(ch))[0];
  const kp = $('#kp'), kpL = $('#kpLetters'), kpOut = $('#kpOut');
  kp.innerHTML = KEYS.map(([d, l]) => `<button type="button" data-d="${d}" aria-label="${d}${l ? ' ' + l.split('').join(' ') : ''}"><b>${d}</b><small>${l}</small></button>`).join('');
  kpL.innerHTML = '<span class="pre">1-888-</span>' + WORD.split('').map((c, i) => (i === 3 ? '<span class="dash">-</span>' : '') + `<span class="slot"><b>${c}</b><i></i></span>`).join('');
  const slots = $$('.slot', kpL);
  let kpPos = 0, kpMiss = 0, kpAuto = 0;
  const kpPaint = () => {
    slots.forEach((s, i) => { s.classList.toggle('on', i < kpPos); s.classList.toggle('next', i === kpPos); $('i', s).textContent = i < kpPos ? digitOf(WORD[i]) : ''; });
    $$('button', kp).forEach(b => b.classList.remove('hint'));
    kpOut.innerHTML = kpPos >= WORD.length
      ? 'That’s the hotline: <b>1-888-668-4293</b>.'
      : `Next letter: <b>${WORD[kpPos]}</b>. Which key has ${WORD[kpPos]}?`;
  };
  const kpPress = (d) => {
    if (kpPos >= WORD.length) return;
    const b = $(`button[data-d="${CSS.escape(d)}"]`, kp);
    if (digitOf(WORD[kpPos]) === d) {
      kpPos++; kpMiss = 0; b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 320); kpPaint();
    } else {
      b.classList.remove('miss'); void b.offsetWidth; b.classList.add('miss');
      if (++kpMiss >= 2) $(`button[data-d="${digitOf(WORD[kpPos])}"]`, kp).classList.add('hint');
    }
  };
  kp.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { clearInterval(kpAuto); kpPress(b.dataset.d); } });
  $('#kpReset').addEventListener('click', () => { clearInterval(kpAuto); kpPos = 0; kpMiss = 0; kpPaint(); });
  $('#kpShow').addEventListener('click', () => { clearInterval(kpAuto); kpPos = 0; kpPaint(); kpAuto = setInterval(() => { if (kpPos >= WORD.length) { clearInterval(kpAuto); return; } kpPress(digitOf(WORD[kpPos])); }, reduced() ? 60 : 480); });

  /* the sixth door: a second walk down the corridor. Between the first card and the last, the camera
     slides with the scroll from the first door to the sixth, opening each door as it passes. On the last
     card the sixth door is the activity: tried, the knob turns and the door rattles but stays shut, its
     sign flickers on (social media), caution tape snaps across it, and the five real doors light up. */
  const stageF = $('#stageF'), camF = $('#stageF .cam'), sixEl = $('#stageF .six'), sixBtn = $('#sixTry');
  const doorsF = $$('#stageF .door'), stepsF = $$('#scF .step');
  const camAt = (k) => `translate(${(170 - 368 * k).toFixed(1)}px,-60px) scale(1.15)`;
  const panF = () => {
    if (stageF.offsetParent === null) return;
    // the first card stands at the first door; the walk runs from the second card's arrival to the last's
    const top1 = stepsF[1].getBoundingClientRect().top, top2 = stepsF[2].getBoundingClientRect().top;
    const k = stageF.classList.contains('try') ? 5 : clamp((innerHeight * .9 - top1) / Math.max(1, top2 - top1 + innerHeight * .4)) * 5;
    camF.style.transform = camAt(k);
    if (stageF.classList.contains('done')) return;
    doorsF.forEach((d, n) => { d.classList.toggle('open', n <= k + .4); d.classList.toggle('focus', Math.abs(n - k) < .5); });
  };
  addEventListener('scroll', panF, { passive: true });
  const trySix = () => {
    if (stageF.classList.contains('try')) return;
    const t = reduced() ? 0 : 1;
    stageF.classList.add('try'); sixBtn.disabled = true; sixEl.setAttribute('aria-disabled', 'true'); panF();
    setTimeout(() => stageF.classList.add('lit'), 950 * t);
    setTimeout(() => {
      stageF.classList.add('done');
      doorsF.forEach(d => d.classList.add('open', 'focus'));
      sixEl.setAttribute('aria-label', 'The sixth door is marked Social media, and it doesn’t open. It isn’t a reporting channel.');
      $('.six-do').hidden = true; $('.six-reveal').hidden = false;
      layoutAll();
      setTimeout(() => release($('#scF')), 1400 * t);
    }, 1700 * t);
  };
  sixBtn.addEventListener('click', trySix);
  sixEl.addEventListener('click', trySix);
  sixEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trySix(); } });
  // the hold line sits up in the scene's corner, not in the card, so the card keeps its height when it goes
  hold($('#scF'), 'Try the sixth door to continue the story.', { station: false, barIn: $('#scF .stage') });

  hold($('#kpPanel'), 'Spell the number to continue the story.');
  new MutationObserver(() => { if (kpPos >= WORD.length) setTimeout(() => release($('#kpPanel')), reduced() ? 0 : 900); }).observe(kpOut, { childList: true });
  kpPaint();

  /* triage: "emergency or not?" Four situations, one at a time. The channel list is the choice: it comes in
     two groups, "someone is in danger" (911) and "no one is in danger" (the other four), and the reader
     answers by choosing a group, so what they pick and where the report goes are the same thing. The
     signs of distress are the extract's. */
  const SIT = [
    { s: 'After a drinking game, a pledge is slumped on the couch and won’t wake up.', em: true,
      why: 'Unconsciousness is a sign of significant distress. Call 911 or campus emergency services immediately.' },
    { s: 'Rookies were made to do a punishment workout last week. Everyone’s sore, but okay.', em: false,
      why: 'No one is in danger right now. Report it through whichever channel fits: the hotline, anonymous online reporting, counseling, or the dean of students office.' },
    { s: 'A rookie is breathing slowly and unevenly after being made to drink.', em: true,
      why: 'Difficulty breathing is a sign of significant distress, and so are signs of alcohol poisoning. Call 911 or campus emergency services immediately.' },
    { s: 'The captains are planning a rookie initiation for next Friday.', em: false,
      why: 'No one is in danger yet. This is the time to report it, through whichever channel fits.' }];
  $$('.triage-host').forEach((host) => {
    const card = (k, sub) => `<span class="tcard" data-ch="${k}"><span class="ic"><i class="fa-solid ${CH[k].ic}"></i></span><span class="tc-t"><b>${k === 'em' ? '911 or campus emergency services' : CH[k].name}</b><span>${sub || CH[k].sub}</span></span></span>`;
    host.innerHTML = `
      <div class="tri">
        <header class="tri-head">
          <p class="k">Activity · ${SIT.length} situations</p>
          <h3 class="tri-title">911, or another channel?</h3>
          <p class="tri-how">For each situation, choose where the report goes: 911, or any of the other four channels.</p>
        </header>
        <div class="tri-left">
          <div class="tri-meta k"><div class="tri-dots" aria-hidden="true">${SIT.map(() => '<i></i>').join('')}</div><p class="tri-n"></p></div>
          <p class="tri-q"></p>
          <p class="tri-note" aria-live="polite"></p>
          <div class="tri-nav" hidden><button type="button" class="btn pri sm tri-next"></button></div>
        </div>
        <div class="tri-stack" role="group" aria-label="Where does it go?">
          <button type="button" class="tri-opt" data-em="1" aria-label="Someone is in danger: call 911 or campus emergency services">
            <span class="tri-opt-h"><span class="dot" aria-hidden="true"></span><b>Someone is in danger</b><small>Call 911 now</small></span>
            ${card('em', 'Comes first if anyone shows signs of significant distress')}
          </button>
          <button type="button" class="tri-opt" data-em="0" aria-label="No one is in danger: use the hotline, anonymous online reporting, counseling, or the dean of students office">
            <span class="tri-opt-h"><span class="dot" aria-hidden="true"></span><b>No one is in danger</b><small>Any of these four</small></span>
            ${['hot', 'web', 'care', 'dean'].map(k => card(k)).join('')}
          </button>
        </div>
      </div>`;
    const note = $('.tri-note', host), opts = $$('.tri-opt', host), nav = $('.tri-nav', host), next = $('.tri-next', host);
    const dots = $$('.tri-dots i', host);
    let cur = 0;
    const show = (k) => {
      cur = k; const it = SIT[k];
      $('.tri-n', host).textContent = `Situation ${k + 1} of ${SIT.length}`;
      $('.tri-q', host).textContent = it.s;
      opts.forEach(o => { o.disabled = false; o.classList.remove('picked', 'ok', 'no', 'dim'); });
      dots.forEach((d, n) => d.classList.toggle('cur', n === k));
      note.innerHTML = ''; nav.hidden = true;
      const q = $('.tri-q', host); q.classList.remove('tri-in'); void q.offsetWidth; q.classList.add('tri-in');
    };
    opts.forEach(o => o.addEventListener('click', () => {
      const it = SIT[cur], saidEm = o.dataset.em === '1', right = saidEm === it.em;
      // the right group lights teal; a wrong pick is marked amber; whatever isn't the answer falls back
      opts.forEach(x => { x.disabled = true; const isAns = (x.dataset.em === '1') === it.em; x.classList.toggle('ok', isAns); x.classList.toggle('dim', !isAns && x !== o); });
      o.classList.add('picked'); if (!right) o.classList.add('no');
      dots[cur].classList.add(right ? 'ok' : 'no');
      note.innerHTML = `<b class="${right ? 'ok' : 'no'}">${right ? 'Right.' : (it.em ? 'This one is an emergency.' : 'This one isn’t an emergency.')}</b> ${it.why}`;
      next.innerHTML = cur < SIT.length - 1 ? 'Next situation <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>' : 'Done <i class="fa-solid fa-check" aria-hidden="true"></i>';
      nav.hidden = false;
      next.focus({ preventScroll: true });
      // stacked on a phone the feedback sits under the choices; bring it up if the tap left it off screen
      if (nav.getBoundingClientRect().bottom > innerHeight) nav.scrollIntoView({ behavior: smooth(), block: 'nearest' });
    }));
    next.addEventListener('click', () => {
      if (cur < SIT.length - 1) { show(cur + 1); opts[0].focus({ preventScroll: true }); return; }
      nav.hidden = true; dots.forEach(d => d.classList.remove('cur'));
      host.dataset.done = '1';
      note.innerHTML = '<b>That’s the rule.</b> Signs of significant distress mean 911 first. Otherwise, any of the four other channels is the right place to report.';
      release(host);
    });
    show(0);
    hold(host, 'Sort all four situations to continue the story.');
  });

  /* match (test-up): a need, then a channel. Right pairs are joined by a line; wrong ones explain */
  const NEEDS = [
    { k: 'dana', who: 'Dana', s: '“I want to talk to someone. I don’t want to file anything.”', ok: ['care'],
      yes: 'Counseling and health services offers confidential services. Talking there isn’t filing a report.',
      no: { em: 'No one is in danger this morning. 911 is for significant distress, right now.', hot: 'The hotline takes reports. To talk without filing anything, counseling and health services fits.', web: 'Anonymous online reporting files a report. To talk without filing anything, counseling and health services fits.', dean: 'The dean of students office explains the formal options. To talk without filing anything, counseling and health services fits.' } },
    { k: 'soph', who: 'The sophomore', s: '“I want to report it, but not with my name on it.”', ok: ['hot', 'web'],
      yes: { hot: 'The hotline accepts anonymous messages. Contact information is only needed for a direct response.', web: 'Most institutions’ websites have an anonymous reporting option.' },
      no: { em: 'No one is in danger this morning. 911 is for significant distress, right now.', care: 'Counseling offers confidential support rather than a report. For a report without a name, use the hotline or anonymous online reporting.', dean: 'The dean of students office explains the formal options. For a report without a name, use the hotline or anonymous online reporting.' } },
    { k: 'room', who: 'The roommate', s: '“What can the school actually do?”', ok: ['dean'],
      yes: 'The dean of students office can explain the options for addressing hazing.',
      no: { em: 'No one is in danger this morning. 911 is for significant distress, right now.', hot: 'The hotline forwards a report. To understand the school’s formal options, the dean of students office explains them.', web: 'That files a report. To understand the school’s formal options, the dean of students office explains them.', care: 'Counseling is confidential support. To understand the school’s formal options, the dean of students office explains them.' } }];
  const mt = $('#match'), mtFb = $('#matchFb');
  mt.innerHTML = `<svg class="lines" aria-hidden="true"></svg>
    <div class="mt-col"><p>Who needs what</p>${NEEDS.map(n => `<button type="button" class="need" data-k="${n.k}" aria-pressed="false"><div><b>${n.who}</b><span>${n.s}</span></div></button>`).join('')}</div>
    <div class="mt-col"><p>Where it can go</p>${Object.keys(CH).map(k => `<button type="button" class="dtok" data-ch="${k}"><span class="ic"><i class="fa-solid ${CH[k].ic}"></i></span><b>${CH[k].name}</b></button>`).join('')}</div>`;
  const matched = {}; let sel = null;
  const drawLines = () => {
    const svg = $('svg.lines', mt), base = mt.getBoundingClientRect();
    svg.innerHTML = Object.entries(matched).map(([nk, ch]) => {
      const a = $(`.need[data-k="${nk}"]`, mt).getBoundingClientRect(), b = $(`.dtok[data-ch="${ch}"]`, mt).getBoundingClientRect();
      const x1 = a.right - base.left, y1 = a.top + a.height / 2 - base.top, x2 = b.left - base.left, y2 = b.top + b.height / 2 - base.top, mx = (x1 + x2) / 2;
      return `<path d="M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" stroke="#2ee6cf" stroke-width="2.5" fill="none"/><circle cx="${x1}" cy="${y1}" r="4.5" fill="#2ee6cf"/><circle cx="${x2}" cy="${y2}" r="4.5" fill="#2ee6cf"/>`;
    }).join('');
  };
  $$('.need', mt).forEach(b => b.addEventListener('click', () => {
    sel = b.dataset.k; $$('.need', mt).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    mtFb.innerHTML = `Now choose where <b>${NEEDS.find(n => n.k === sel).who.replace(/^The /, 'the ')}</b> should go.`;
  }));
  hold(mt.closest('.fig'), 'Match all three needs to continue the story.');
  $$('.dtok', mt).forEach(b => b.addEventListener('click', () => {
    if (!sel) { mtFb.textContent = 'Choose a person first.'; return; }
    const n = NEEDS.find(x => x.k === sel), ch = b.dataset.ch, ok = n.ok.includes(ch);
    if (ok) {
      matched[sel] = ch; $(`.need[data-k="${sel}"]`, mt).classList.add('done');
      const yes = typeof n.yes === 'string' ? n.yes : n.yes[ch];
      const all = Object.keys(matched).length === NEEDS.length;
      mtFb.innerHTML = `<b class="ok">Good fit.</b> ${yes}${all ? ' All three needs have somewhere to go.' : ''}`;
      drawLines();
      if (all) setTimeout(() => release(mt.closest('.fig')), reduced() ? 0 : 1600);
    } else mtFb.innerHTML = `<b class="no">Not the best fit.</b> ${n.no[ch]}`;
  }));

  /* misdemeanor or felony */
  const sev = $('#sev'), sevOut = $('#sevOut'), ticks = $$('.sev-ticks button');
  const SEV = [['No significant injury', 'Misdemeanor', 'In most states with antihazing laws.'], ['Significant injury', 'Felony', 'In a handful of states.'], ['Death', 'Felony', 'In a handful of states.']];
  const paintSev = () => { const v = +sev.value; sevOut.dataset.lvl = v; $('#sevB').textContent = SEV[v][1]; $('#sevP').textContent = SEV[v][2]; sev.setAttribute('aria-valuetext', SEV[v][0]); ticks.forEach((t, k) => t.classList.toggle('on', k === v)); };
  // every outcome the reader lands on ticks off; once all three are seen, the story continues
  const sevSeen = new Set([0]);
  const sevVisit = () => { sevSeen.add(+sev.value); ticks.forEach((t, k) => t.classList.toggle('seen', sevSeen.has(k))); if (sevSeen.size === SEV.length) setTimeout(() => release($('#sevPanel')), reduced() ? 0 : 900); };
  sev.addEventListener('input', () => { paintSev(); sevVisit(); });
  ticks.forEach(t => t.addEventListener('click', () => { sev.value = t.dataset.v; paintSev(); sevVisit(); }));
  paintSev(); sevVisit();
  hold($('#sevPanel'), 'Move the slider to each outcome to continue the story.');

  /* one season, then the next two, then the program */
  const DATES = [['Oct 4', 'Home'], ['Oct 18', 'Away'], ['Nov 1', 'Home'], ['Nov 15', 'Away'], ['Jan 10', 'Home'], ['Jan 24', 'Away']];
  $('#seas').innerHTML = ['This season', 'Next season', 'The season after'].map((r, ri) =>
    `<div class="srow"><span>${r}</span><div class="sgrid">${DATES.map(([d, h]) => `<i><b>${d}</b>${h}</i>`).join('')}</div>${ri ? '<div class="sband">Suspended</div>' : ''}</div>`).join('');
  const seasCells = $$('#seas .srow:first-child i'), seasEl = $('#seas'), seasCap = $('#seasCap');

  /* focus: when the reader stops scrolling with a stop all but fully on screen and its middle near the
     middle of the screen, it pops out of the article: the article falls back and the keypad spreads
     across both rails. A stop already fills the screen (CSS: [data-pop]), so popping out moves nothing
     around it. It lets go once less than half of it is on screen. It pops out on the first arrival, and
     again on a return only while the article is still stopped there. */
  const focusables = [];
  const focusable = (el) => { el.dataset.pop = '1'; focusables.push({ el, on: false, seen: false }); };
  const setPageW = () => document.documentElement.style.setProperty('--pagew', document.documentElement.clientWidth + 'px');
  // the page eases a popped-out stop the last few pixels to sit just under the bar. Any input from the
  // reader (wheel, touch, keys, a grab of the scrollbar) stops the easing at once, so it never fights them
  let aligning = 0;
  const stopAlign = () => { aligning = 0; };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(t => addEventListener(t, stopAlign, { passive: true }));
  const alignTo = (el) => {
    const tok = aligning = performance.now();
    const step = (now) => {
      if (aligning !== tok) return;
      const gap = el.getBoundingClientRect().top - BAR;
      // each frame jumps (not smooth-scrolls: the page's scroll-behavior would restart a smooth scroll
      // every frame and stall it) a fifth of the way, which reads as one ease-out
      if (Math.abs(gap) > .5) scrollTo({ top: scrollY + (reduced() || Math.abs(gap) < 2 ? gap : gap * .2), behavior: 'instant' });
      if (!reduced() && Math.abs(gap) > .5 && now - tok < 1200) requestAnimationFrame(step);
      else { aligning = 0; layoutAll(); }
    };
    requestAnimationFrame(step);
  };
  const setFocus = (f, on) => {
    if (on === f.on) return;
    f.on = on;
    if (on) { // how far the left rail reaches, so a stop can open out across it
      f.seen = true;
      const tx = $(':scope > .tx', f.el.parentElement);
      f.el.style.setProperty('--railw', (tx ? tx.getBoundingClientRect().left - f.el.getBoundingClientRect().left : 0) + 'px');
    }
    f.el.classList.toggle('focus', on);
    // a stop taller than the screen isn't lined up under the bar: its bottom would be off screen anyway,
    // and the easing would fight the reader's own scrolling through it
    if (on && f.el.offsetHeight <= innerHeight - BAR + 2) alignTo(f.el);
    else if (!on) { aligning = 0; requestAnimationFrame(layoutAll); }
  };
  let idle = 0;
  const focusCheck = (settled) => {
    if (aligning) return; // the page is moving itself; judge where things are once it settles
    const room = innerHeight - BAR;
    focusables.forEach((f) => {
      if (f.el.offsetParent === null) { if (f.on) setFocus(f, false); return; }
      const r = f.el.getBoundingClientRect();
      const seen = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, BAR)) / Math.min(r.height, room);
      const mid = ((r.top + r.bottom) / 2 - BAR) / room;
      // at the very end of the page (the article stopped here) a stop can't reach the middle, so it pops out there
      const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
      const wanted = !f.seen || f.el.classList.contains('hold-here');
      if (!f.on) { if (settled && wanted && seen > .9 && ((mid > .4 && mid < .6) || atEnd) && !focusables.some(o => o.on)) setFocus(f, true); }
      else if (seen < .5) setFocus(f, false);
    });
  };
  // letting go is judged on every scroll; popping out waits until the reader has paused for a moment
  const onScrollFocus = () => { focusCheck(false); clearTimeout(idle); idle = setTimeout(() => focusCheck(true), 260); };
  focusable($('#kpPanel'));
  $$('.triage-host').forEach(h => focusable(h));
  $$('.qz-host').forEach(h => focusable(h));
  setPageW();
  addEventListener('resize', setPageW);
  addEventListener('scroll', onScrollFocus, { passive: true });

  /* ======================================================================
     6 · THE THREE CHECKS. One renderer: 'check' (scored, locks, retry from the
     remedial), 'self' (low-stakes, reveals as you go), 'scale' (agreement 1–5).
     ====================================================================== */
  const LET = ['A', 'B', 'C', 'D'];
  function quiz(host, cfg) {
    let attempt = 1, answers = [], picks = [], cur = 0;
    const SCALE = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
    const render = () => {
      answers = cfg.items.map(() => null); picks = cfg.items.map(() => null); cur = 0;
      host.classList.add('one'); host.classList.remove('all');
      host.innerHTML = `${attempt > 1 ? '<span class="rev">Retry · attempt 2 of 2</span>' : ''}
        <div class="qz-dots" aria-hidden="true">${cfg.items.map(() => '<i></i>').join('')}</div>
        <h2>${attempt > 1 ? cfg.retryTitle || cfg.title : cfg.title}<span class="qz-at"></span></h2><p class="qz-sub">${cfg.sub}</p>
        ${cfg.items.map((it, qi) => `<div class="qz-q" data-q="${qi}"><p class="qz-n">${cfg.mode === 'scale' ? 'Statement' : 'Question'} ${qi + 1} of ${cfg.items.length}</p><p class="qz-stem">${it.stem}</p>
          ${cfg.mode === 'scale'
            ? `<div class="scale" role="radiogroup" aria-label="Statement ${qi + 1}">${['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'].map((l, v) => `<button type="button" role="radio" aria-checked="false" data-v="${v + 1}"><b>${v + 1}</b><span>${l}</span></button>`).join('')}</div>`
            : `<div class="opts" role="radiogroup" aria-label="Question ${qi + 1}">${it.opts.map((o, oi) => `<button type="button" class="opt ${o[1] ? 'ok' : 'no'}" role="radio" aria-checked="false" data-i="${oi}"><i>${LET[oi]}</i><span>${o[0]}</span></button>`).join('')}</div><div class="fb" hidden></div>`}
          <div class="qz-nav" hidden><button class="btn pri sm qz-next" type="button">${qi < cfg.items.length - 1 ? `Next ${cfg.mode === 'scale' ? 'statement' : 'question'}` : 'Finish'} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div>
        </div>`).join('')}
        <div class="qz-res" hidden></div>
        <div class="qz-foot" hidden aria-live="polite"></div>`;
      paintAt();
      $$('.qz-q', host).forEach(q => {
        const qi = +q.dataset.q, it = cfg.items[qi];
        q.classList.toggle('cur', qi === 0);
        $('.qz-next', q).addEventListener('click', () => next(qi));
        if (cfg.mode === 'scale') {
          $$('.scale button', q).forEach(b => b.addEventListener('click', () => {
            $$('.scale button', q).forEach(x => x.setAttribute('aria-checked', String(x === b)));
            answers[qi] = +b.dataset.v; $('.qz-nav', q).hidden = false;
          }));
          return;
        }
        $$('.opt', q).forEach(b => b.addEventListener('click', () => {
          const oi = +b.dataset.i, o = it.opts[oi]; picks[qi] = oi;
          $$('.opt', q).forEach(x => x.setAttribute('aria-checked', String(x === b)));
          if (cfg.mode === 'check') $$('.opt', q).forEach(x => { x.disabled = true; });   // scored: the first answer counts
          q.classList.add('done'); if (cfg.mode === 'self' || o[1]) q.classList.add('reveal');
          const fb = $('.fb', q); fb.hidden = false;
          fb.innerHTML = `<b class="h ${o[1] ? 'ok' : 'no'}">${o[1] ? 'Correct' : 'Not quite'}</b>${o[2] || (o[1] ? it.yes : it.no)}`;
          answers[qi] = o[1]; $('.qz-nav', q).hidden = false;
        }));
      });
    };
    // the dots and the "· 1 of 2" after the title follow the question on screen
    const paintAt = () => {
      $$('.qz-dots i', host).forEach((d, n) => { d.classList.toggle('cur', n === cur); d.classList.toggle('done', answers[n] !== null && n !== cur); });
      const at = $('.qz-at', host); if (at) at.textContent = ` · ${cur + 1} of ${cfg.items.length}`;
    };
    // Next shows the following question; Finish lays every answer out for review and reports
    const next = (qi) => {
      if (answers[qi] === null) return;
      const qs = $$('.qz-q', host);
      if (qi < qs.length - 1) {
        cur = qi + 1; qs.forEach((q, n) => q.classList.toggle('cur', n === cur)); paintAt();
        if (host.getBoundingClientRect().top < 0) host.scrollIntoView({ behavior: smooth(), block: 'start' });
        const first = $('.opt, .scale button', qs[cur]); if (first) first.focus({ preventScroll: true });
        requestAnimationFrame(layoutAll);
        return;
      }
      // Finish: the questions step aside and only the result shows: the score, then one line per
      // question (what you answered, and the right answer where it wasn't)
      host.classList.remove('one'); host.classList.add('all');
      const at = $('.qz-at', host); if (at) at.textContent = '';
      const res = $('.qz-res', host), plain = (h) => h.replace(/<[^>]+>/g, '');
      const lines = cfg.items.map((it, n) => {
        if (cfg.mode === 'scale') return `<li><span class="mk sc">${answers[n]}</span><div><b>${it.stem}</b><span>You answered ${SCALE[answers[n] - 1].toLowerCase()}.</span></div></li>`;
        const ok = answers[n], mine = it.opts[picks[n]][0], right = it.opts.find(o => o[1])[0];
        return `<li class="${ok ? 'ok' : 'no'}"><i class="mk fa-solid ${ok ? 'fa-check' : 'fa-xmark'}" aria-label="${ok ? 'Correct' : 'Incorrect'}"></i><div><b>${it.stem}</b><span>${ok ? `You answered ${plain(mine)}.` : `You answered ${plain(mine)}. The answer is ${plain(right)}.`}</span></div></li>`;
      }).join('');
      const score = cfg.mode === 'scale' ? '' : `<p class="qz-score"><b>${answers.filter(Boolean).length}</b> of ${answers.length} correct</p>`;
      res.innerHTML = `${score}<ul class="qz-sum">${lines}</ul>`; res.hidden = false;
      $$('.qz-nav', host).forEach(n => { n.hidden = true; });
      if (cfg.mode === 'scale') $$('.scale button', host).forEach(b => { b.disabled = true; });
      const foot = $('.qz-foot', host); foot.hidden = false;
      cfg.done({ answers, attempt, foot, reveal: () => $$('.qz-q', host).forEach(q => q.classList.add('reveal')) });
      if (cfg.onFinish) cfg.onFinish();
      requestAnimationFrame(layoutAll);
    };
    render();
    return { retry() { attempt++; render(); if (cfg.onRetry) cfg.onRetry(); requestAnimationFrame(layoutAll); }, get attempt() { return attempt; } };
  }

  /* 5.1 · practice with feedback, scored. A miss opens M5-01R, which offers one retry. */
  const s1r = $('#s1r');
  let k1;
  if (K1 === 'full') k1 = quiz($('#qzK1'), {
    mode: 'check', title: 'Quick check: where to report hazing', retryTitle: 'Quick check: where to report hazing, once more', sub: 'Two questions, one at a time.',
    onFinish: () => release($('#k1')), onRetry: () => rehold($('#k1')),
    items: [
      { stem: 'What is the phone number for the National Anti-Hazing Hotline?', yes: '<span class="nw">1-888-NOT-HAZE</span> spells out <span class="nw">1-888-668-4293</span>.',
        opts: [['<span class="nw">1-888-NOT-HAZE</span> (<span class="nw">1-888-668-4293</span>)', true], ['1-800-CAMPUS-SAFE', false, 'That isn’t the hotline. The National Anti-Hazing Hotline is <span class="nw">1-888-NOT-HAZE</span> (<span class="nw">1-888-668-4293</span>).'], ['9-1-1', false, '911 is for emergencies, when someone shows signs of significant distress. The hotline is a different number: <span class="nw">1-888-NOT-HAZE</span>.'], ['There is no national hotline.', false, 'There is one: the National Anti-Hazing Hotline, <span class="nw">1-888-NOT-HAZE</span> (<span class="nw">1-888-668-4293</span>).']] },
      { stem: 'Which of the following is NOT an appropriate channel for reporting hazing?', yes: 'A post isn’t a report. The hotline, anonymous online reporting, counseling and health services, and the dean of students office are channels.', no: 'That one is an appropriate channel. Posting about it on social media is not.',
        opts: [['Posting about it on social media', true], ['National Anti-Hazing Hotline at <span class="nw">1-888-NOT-HAZE</span>', false], ['Institution’s anonymous online reporting system', false], ['Dean of students office', false]] }],
    done({ answers, attempt, foot, reveal }) {
      const right = answers.filter(Boolean).length;
      if (right === answers.length) { foot.className = 'qz-foot'; foot.innerHTML = ''; return; }
      if (attempt === 1) {
        foot.className = 'qz-foot miss';
        foot.innerHTML = `<p>Here’s one more look at where hazing can be reported, then you can try the check again.</p><button class="btn pri sm" type="button">Go over it <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></button>`;
        s1r.hidden = false; watchRv(); requestAnimationFrame(layoutAll);
        hold($('#retryK1').closest('section'), 'Try the check again to continue the story.', { skip: false });
        $('button', foot).addEventListener('click', () => s1r.scrollIntoView({ behavior: smooth(), block: 'start' }));
        return;
      }
      reveal(); foot.className = 'qz-foot miss'; foot.innerHTML = '';
    } });
  $('#retryK1').addEventListener('click', () => { if (!k1) return; $('#retryK1').parentElement.hidden = true; release($('#retryK1').closest('section')); k1.retry(); $('#k1').scrollIntoView({ behavior: smooth(), block: 'start' }); });

  /* 5.2 · self-check: scored, low-stakes, never remediates */
  const PLAN = 'At least one state holds hazing planners criminally responsible even if they aren’t actively involved.';
  const FEL = 'In states that distinguish the two, hazing becomes a felony when there is significant injury or death.';
  const INST = 'Colleges can forfeit games, suspend the organization for years, or eliminate it entirely.';
  quiz($('#qzK2'), {
    mode: 'self', title: 'Check yourself: the consequences of hazing', sub: 'Four questions, one at a time, for your own benefit.',
    onFinish: () => release($('#k2')),
    items: [
      { stem: 'A student planned a fraternity hazing event but was not present when a pledge was seriously injured. Can the student face criminal charges?', yes: PLAN, no: PLAN,
        opts: [['No — criminal liability requires direct physical involvement.', false], ['Yes — at least one state holds hazing planners criminally responsible even without direct involvement.', true], ['Only if the injured person files a civil suit.', false], ['Only if the state classifies hazing as a felony.', false]] },
      { stem: 'Under what circumstances does hazing rise from a misdemeanor to a felony in states that distinguish the two?', yes: FEL, no: FEL,
        opts: [['When the hazing involves alcohol', false], ['When there is significant injury or death', true], ['When the hazing takes place off-campus', false], ['When more than five people are involved', false]] },
      { stem: 'What institutional consequences can colleges impose on a group found responsible for hazing?', yes: INST, no: INST,
        opts: [['Only a written warning to the group’s advisor', false], ['Forfeiting games, suspending the organization for years, or eliminating the organization entirely', true], ['Institutional consequences are limited to academic probation for members.', false], ['Only mandatory hazing-prevention training for all members', false]] },
      { stem: 'Depending on the state’s laws, it is possible to be charged with hazing even if you are not actively involved in the act.', yes: PLAN, no: PLAN,
        opts: [['True', true], ['False', false]] }],
    done({ foot }) { foot.className = 'qz-foot'; foot.innerHTML = ''; } });

  /* 5.3 · attitude check: agreement 1–5, healthy = agree. One round of remediation, never a gate. */
  let f1Rem = F1 === 'low';   // on a low pre-check 03R has already played, so there's no second round
  const f1 = quiz($('#qzF1'), {
    mode: 'scale', title: 'Where you stand on reporting hazing', retryTitle: 'Where you stand on reporting hazing, once more', sub: 'How much do you agree with each? There are no right or wrong scores here.',
    onFinish: () => release($('#f1')), onRetry: () => rehold($('#f1')),
    items: [
      { stem: '“Reporting hazing through available channels — including anonymously — is the responsible thing to do, not a betrayal of my peers.”' },
      { stem: '“Reporting hazing helps my organization identify problems and improve its policies and procedures, rather than just dragging me into an investigation I don’t want to be part of.”' }],
    done({ answers, foot }) {
      const healthy = answers.every(v => v >= 4);
      if (healthy || f1Rem) { foot.className = 'qz-foot'; foot.innerHTML = '<p>Thanks for your answers.</p>'; return; }
      f1Rem = true;
      s4r.hidden = false; $('#retryF1Wrap').hidden = false; watchRv(); requestAnimationFrame(layoutAll);
      hold($('#retryF1').closest('section'), 'Answer the two statements again to continue the story.', { skip: false });
      foot.className = 'qz-foot'; foot.innerHTML = '<p>Thanks. Before you move on, here’s one more moment from that season.</p><button class="btn pri sm" type="button">Read it <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></button>';
      $('button', foot).addEventListener('click', () => s4r.scrollIntoView({ behavior: smooth(), block: 'start' }));
    } });
  $('#retryF1').addEventListener('click', () => { $('#retryF1Wrap').hidden = true; release($('#retryF1').closest('section')); f1.retry(); $('#f1').scrollIntoView({ behavior: smooth(), block: 'start' }); });

  // each check holds the article until it's answered; checks can't be skipped
  hold($('#k1'), 'Answer both questions to continue the story.', { skip: false });
  hold($('#k2'), 'Answer all four questions to continue the story.', { skip: false });
  hold($('#f1'), 'Answer both statements to continue the story.', { skip: false });
  applyHolds();

  /* ======================================================================
     7 · YOUR TURN: the three 5.4 situations, one at a time (as in Sharps V2).
     Change an answer any time; the rest of the article opens once all three have one.
     ====================================================================== */
  const AFTER = 'The hotline and other non-emergency channels are the right choice only after the immediate danger is addressed.';
  const DECS = [
    { t: 'You saw it, and you’d rather not be named', ask: 'You witnessed hazing at an off-campus event. You want to report it but do not want to be identified. What is the BEST reporting option?',
      opts: [['Go to the dean of students office in person and ask to remain anonymous.', false, 'The dean of students office can explain your options, but going in person isn’t how you stay unidentified. The hotline and most institutions’ websites accept anonymous reports.'],
             ['Call the National Anti-Hazing Hotline at <span class="nw">1-888-NOT-HAZE</span> and leave an anonymous message.', true, 'The hotline accepts anonymous messages. Leave your contact information only if you want a direct response.'],
             ['Post about what you saw on social media to raise awareness.', false, 'A post isn’t a report, and it doesn’t keep you unidentified. Call the hotline and leave an anonymous message.'],
             ['Do nothing — you can’t report without being identified.', false, 'You can. The hotline and most institutions’ websites accept anonymous reports. You can take action without revealing your identity.']] },
    { t: 'You lived it, and you want to talk', ask: 'A student experienced hazing during initiation and wants to talk to someone confidentially without filing a formal complaint. Which resource is MOST appropriate?',
      opts: [['The dean of students office', false, 'The dean of students office explains the formal options. To talk confidentially without filing, go to counseling and health services.'],
             ['The institution’s counseling and health services department', true, 'Counseling and health services offers confidential services related to hazing concerns, for talking about what happened rather than filing a report.'],
             ['Campus security', false, 'Campus security isn’t the confidential option. Counseling and health services is.'],
             ['The National Anti-Hazing Hotline', false, 'The hotline takes reports. For a confidential conversation instead of a report, go to counseling and health services.']] },
    { t: 'Someone isn’t responding', ask: 'At a hazing event, you see a peer who is unconscious and unresponsive after being forced to drink alcohol. What should you do FIRST?',
      opts: [['Call 911 or campus emergency services immediately.', true, 'Unconscious and unresponsive is significant distress. Call 911 or campus emergency services immediately, before any other channel.'],
             ['Call the National Anti-Hazing Hotline and leave an anonymous message.', false, AFTER],
             ['Wait until morning and report it to the dean of students office.', false, AFTER],
             ['Document it and report through the institution’s anonymous online system later.', false, AFTER]] }];
  $('#decs').innerHTML = DECS.map((d, di) => `
    <article class="dec" data-d="${di}"${di ? ' hidden' : ''}>
      <div class="vis">${A.decVis(di)}</div>
      <div class="body"><span class="part">Situation ${di + 1}</span><h3>${d.t}</h3><p class="ask">${d.ask}</p>
        <div class="opts" role="radiogroup" aria-label="Situation ${di + 1}">${d.opts.map((o, i) => `<button type="button" class="opt ${o[1] ? 'ok' : 'no'}" role="radio" aria-checked="false" data-i="${i}"><i>${LET[i]}</i><span>${o[0]}</span></button>`).join('')}</div>
        <div class="fb" hidden aria-live="polite"></div></div></article>`).join('');
  const decEls = $$('.dec'), done = new Set();
  let cur = 0, unlocked = false;
  decEls.forEach((el, di) => $$('.opt', el).forEach(b => b.addEventListener('click', () => {
    const o = DECS[di].opts[+b.dataset.i];
    $$('.opt', el).forEach(x => x.setAttribute('aria-checked', String(x === b)));
    const fb = $('.fb', el); fb.hidden = false; fb.innerHTML = `<b class="h ${o[1] ? 'ok' : 'no'}">${o[1] ? 'Correct' : 'Not that one'}</b>${o[2]}`;
    done.add(di); paintGate(); showDec(cur);
  })));
  const stage = $('#prStage'), runEl = $('#prRun');
  function pinLayout(release) {
    const maxH = innerHeight - BAR - 52, h = Math.min(stage.scrollHeight, maxH);
    const top = Math.max(BAR + 12, BAR + (innerHeight - BAR - h) / 2);
    stage.style.setProperty('--prTop', top + 'px');
    runEl.style.setProperty('--prRun', (release || unlocked) ? '0px' : Math.max(0, innerHeight - 28 - top - h) + 'px');
  }
  new ResizeObserver(() => pinLayout()).observe(stage);
  const head = $('#prHead');
  addEventListener('scroll', () => { const r = head.getBoundingClientRect(); head.style.opacity = (1 - clamp(((BAR + 30) - r.top) / (r.height * .55))).toFixed(2); }, { passive: true });
  const unlock = (scroll) => {
    if (unlocked) return; unlocked = true;
    const rest = $('#afterGate'); rest.hidden = false; rest.classList.add('opening');
    $('#gate').hidden = true; document.body.classList.remove('locked');
    pinLayout(true); watchRv(); layoutAll();
    // land on the reprise's chapter break with its line showing, rather than flying past it to #s6
    if (scroll) setTimeout(() => {
      const seam = $('.seam', rest);
      if (reduced()) { seam.scrollIntoView({ block: 'start' }); return; }
      scrollTo({ top: seam.getBoundingClientRect().top + scrollY + (seam.offsetHeight - innerHeight) * .35, behavior: 'smooth' });
    }, 450);
  };
  const LOCK = $('#gateIc').innerHTML;
  function paintGate() {
    $$('#gateDots i').forEach((d, k) => d.classList.toggle('on', k < done.size));
    $('#gateCount').textContent = done.size + ' of ' + decEls.length + ' complete';
    const all = done.size === decEls.length;
    $('#gateCard').classList.toggle('done', all);
    $('#gateTitle').textContent = all ? 'Activity complete. Select Continue to move on.' : 'Complete the activity to continue';
    $('#gateIc').innerHTML = all ? '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : LOCK;
  }
  function showDec(i) {
    cur = i; decEls.forEach((d, k) => { d.hidden = k !== i; });
    $('#prCount').textContent = 'Situation ' + (i + 1) + ' of ' + decEls.length;
    $('#prBack').disabled = i === 0;
    $('#prNext').textContent = i === decEls.length - 1 ? (done.size === decEls.length ? 'Continue →' : 'Finish') : 'Next situation →';
    $('#prNext').disabled = !done.has(i);
  }
  $('#prBack').addEventListener('click', () => showDec(Math.max(0, cur - 1)));
  $('#prNext').addEventListener('click', () => { if (cur < decEls.length - 1) { showDec(cur + 1); return; } if (done.size === decEls.length) unlock(true); });
  $('#gateSkip').addEventListener('click', () => unlock(true));
  paintGate(); showDec(0);

  /* ======================================================================
     8 · SCROLL-DRIVEN FIGURES: seams drift and fade; the tracks draw; the season
     gets forfeited, suspended and finally eliminated
     ====================================================================== */
  const tkPaths = $$('#tracksFig .tk'), tkLbls = $$('#tracksFig .tl');
  // seams run on their own tall scroll; the tracks and seasons are ordinary figures in the article that
  // play out as they rise from the bottom of the screen (top at 85%) to near the top (top at 10%)
  const paintRuns = () => $$('.seam, #tracksRun, #seasonRun').forEach(s => {
    if (s.offsetParent === null) return;
    const r = s.getBoundingClientRect(), run = r.height - innerHeight;
    const p = s.classList.contains('fig') ? clamp((innerHeight * .85 - r.top) / (innerHeight * .75)) : run > 0 ? clamp(-r.top / run) : .5;
    s.style.setProperty('--sp', p.toFixed(3));
    if (s.id === 'tracksRun') {
      tkPaths.forEach((t, k) => { t.style.strokeDashoffset = (k === 0 ? 1 - clamp((p - .04) / .16) : 1 - clamp((p - .2 - (k - 1) * .05) / .2)).toFixed(3); });
      tkLbls.forEach((t, k) => { t.style.opacity = clamp((p - .4 - k * .06) / .08).toFixed(2); });
    }
    if (s.id === 'seasonRun') {
      const n = Math.round(clamp((p - .08) / .26) * seasCells.length);
      seasCells.forEach((c, k) => c.classList.toggle('ff', k < n));
      seasEl.classList.toggle('sus', p > .44); seasEl.classList.toggle('gone', p > .68);
      seasCap.textContent = p > .68 ? 'Or eliminating the organization entirely.' : p > .44 ? 'Suspending the organization for a certain number of years.' : n ? 'Forfeiting games.' : '';
    }
  });
  addEventListener('scroll', paintRuns, { passive: true });

  function layoutAll() { centreCards(); pinLayout(); paintRuns(); drawLines(); dockHold(); panF(); }
  addEventListener('resize', layoutAll);
  if (document.fonts) document.fonts.ready.then(layoutAll);
  $('#startBtn').addEventListener('click', (e) => { const first = $$('#s1, #s1b, #s3').find(el => el.offsetParent !== null); if (first) { e.preventDefault(); first.scrollIntoView({ behavior: smooth(), block: 'start' }); } });

  watchRv(); layoutAll(); frame();
})();
