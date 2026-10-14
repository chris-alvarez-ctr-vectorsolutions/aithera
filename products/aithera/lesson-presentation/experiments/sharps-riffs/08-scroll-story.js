/* Riff 08 — Contain the Sharp, scroll story. Logic for 08-scroll-story.html.
   Sections: 1 sector text  2 shared helpers  3 components  4 scroll engine.
   Wording follows the Contain the Sharp Manufacturing / Law Enforcement scripts. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;
  let ticking = false;

  /* ==========================================================================
     1 · SECTOR TEXT. Everything that differs by sector. The rest is shared.
     ========================================================================== */
  const SECTORS = {
    'manufacturing': {
      sectorLabel: `Manufacturing`,
      h1: `The blade at the bench`,
      dek: `A used blade, a line about to restart, and a sharps container at the other end of it.`,
      defineP:
        `<p>You’ve just changed out a used box-cutter blade at your bench. The designated sharps container is down at the end of the line, and the used blade is still at your bench.</p>` +
        `<p>Like a needle or other sharp object, the blade is considered a sharp because it can puncture or cut the skin. Whether or not it’s visibly contaminated, an exposed blade left on a surface is a hazard to the next person who reaches for that spot — which is why the safe-handling procedure applies to every sharp, every time.</p>`,
      scopeP:
        `<p>A used medical needle is dangerous because it retains a small amount of blood after use, and its extreme sharpness makes it likely to penetrate someone else’s skin. Accidental needlestick injuries are especially common in healthcare, and they are a real and growing risk in manufacturing and other industries, as more people with diabetes, allergies, and other conditions use syringes to give themselves medicine.</p>`,
      h2pause: `The container is a walk away`,
      n0: `The change-out`,
      bubble: `Coworker: “Need you back here!”`,
      lbl0: `Used blade, left at the bench`,
      a0: `<p>You’ve just changed out a used box-cutter blade at your bench. The designated sharps container is <strong>several workstations away</strong>, and the used blade is still at your bench.</p>`,
      a1: `<p>Your line is about to restart, and a coworker is waving you back to your station.</p>`,
      a2: `<p>Nothing about setting the blade down at your own workstation feels careless: you can see exactly where it is, and you’re planning to carry it down on your next scheduled break.</p>`,
      a3: `<p class="warn">Leaving the blade at your workstation, even temporarily, creates a hazard for anyone who reaches for that spot before you return.</p>`,
      a4: `<p>The safe-handling procedure doesn’t change when work gets busy. Once a sharp is used, don’t recap, bend, or break it, and don’t set it aside for later. It should go <strong>directly</strong> into a designated sharps container.</p>`,
      w1: `Scroll down. You’re holding the blade, and the container is several workstations away.`,
      w2: `Past the line. A coworker is waving you back to your station.`,
      shortWrap: `Depending on your facility’s procedures, you may need to wrap the exposed edge before disposal. That is never a reason to put it in general waste.`,
      rem1: `<p>You’re cleaning up your workstation after changing a cutting blade. The used blade is still in your hand, and you’re deciding how to handle it before moving on. Snapping it or setting it aside might seem like ways to make it safer, but they don’t properly contain the sharp.</p><p>Once a sharp is used, don’t recap, bend, or break it, and don’t leave it on a work surface or place it in general waste. The safe-handling procedure is to move it directly to a designated sharps container.</p>`,
      fillP:
        `<p>You’re carrying a used sharp to a designated sharps container on the production floor. As you approach, you notice the container is full. On the way there, you also pass a piece of contaminated glass sitting in a general-waste bin.</p>` +
        `<p>Both are sharps hazards, even though they look very different.</p>`,
      binCould: `contaminated glass`,
      binHidden: `It looks like it could be a piece of contaminated glass, but you can’t tell without disturbing the contents.`,
      benchName: `A used blade left on the work surface`,
      n1s: `Manages diabetes with insulin`, n3s: `Collects the bag for sanitation`,
      s0: `<p>Chris works on the line and manages his diabetes with insulin.</p>`,
      s1: `<p>One afternoon, he can’t find a sharps container nearby. He’s in the middle of a task, so just this once, he tosses the used needle into the general trash.</p>`,
      s2: `<p>Later, Jacob collects the bag for sanitation. <strong>The needle sticks him through the bag.</strong></p>`,
      s3: `<p>Jacob never used the needle. He never even saw it.</p><p>But a needlestick can expose someone to bloodborne pathogens such as HIV, hepatitis B, and hepatitis C.</p>`,
      cl4: `, and so did the people who love him.`,
      engP: `<p>A facility is looking for ways to better protect employees who may come into contact with used sharps. One option is to provide heavier protective gloves. Another is to make designated sharps containers more accessible throughout the facility.</p><p>Both can provide protection, but they don’t control the hazard in the same way.</p>`,
      accessP: `Making containers more accessible means one at every line station and in every break room, not one at the far end of the bay.`,
      cmpL: `Container at the end of the line`, cmpR: `Container at every line station`,
      h2poll: `What you’ve seen on the floor`,
      simH: `A blade you didn’t put there`,
      simSetup: `<p>You’re replacing a cutting blade at a workstation on the production floor when you notice a used blade sitting on the edge of the neighboring workbench. You didn’t put it there, and you don’t know who did.</p>`,
      simDecision: `<p>You pick up the used blade from the workbench. Before you can deal with it, a coworker calls for your help with a problem on the line. They need you now. The blade is still in your hand. What do you do?</p>`,
      simWalk: `<p>The used blade still has to be dealt with, and the designated sharps container is at the end of the line. Describe what you do next, step by step, until the blade is disposed of.</p>`
    },
    'law-enforcement': {
      sectorLabel: `Public Sector · Law enforcement`,
      h1: `The needle at the counter`,
      dek: `A recovered needle, a booking queue backing up, and a sharps container across the intake area.`,
      defineP:
        `<p>You’ve just recovered a used hypodermic needle from a subject’s property at the booking counter. The designated sharps container is across the intake area, and the needle is still in your gloved hand.</p>` +
        `<p>A used needle retains a small amount of blood after use, and its sharpness makes it likely to penetrate someone else’s skin and expose them to that retained blood. Whether or not it looks contaminated, a needle left on the counter or dropped into a property tray is a hazard to the next person who reaches for that spot — which is why the safe-handling procedure applies to every sharp, every time.</p>`,
      scopeP:
        `<p>In this work, the sharp usually isn’t yours. It’s recovered: from a subject’s property, during a search, or from a patrol vehicle. Accidental needlestick injuries are especially common in healthcare, and they are a real risk in other industries too.</p>`,
      h2pause: `The container is across the room`,
      n0: `The recovery`,
      bubble: `Officer: “Need a hand in here!”`,
      lbl0: `Recovered needle, still in your hand`,
      a0: `<p>You’ve just recovered a used hypodermic needle from a subject’s property at the booking counter. The designated sharps container is <strong>at the far end of the intake area</strong>, and the needle is still in your gloved hand.</p>`,
      a1: `<p>The queue behind you is backing up, and another officer is calling you over to help with a subject in the next room.</p>`,
      a2: `<p>Nothing about setting the needle down on the counter feels careless: you can see exactly where it is, and you’re planning to deal with it as soon as you’re back.</p>`,
      a3: `<p class="warn">Leaving the needle on the counter, even briefly, creates a hazard for anyone who reaches for that spot before you return.</p>`,
      a4: `<p>The safe-handling procedure doesn’t change when the room gets busy. Once a sharp is used, don’t recap, bend, or break it, and don’t set it aside for later. It should go <strong>directly</strong> into a designated sharps container.</p>`,
      w1: `Scroll down. You’re holding the needle, and the container is at the far end of the intake area.`,
      w2: `Past the queue. Another officer is calling you over to help with a subject.`,
      shortWrap: `If no designated sharps container is immediately available, don’t place the needle in general waste, and don’t improvise a wrapping out of soft material such as a paper towel or a plastic bag.`,
      rem1: `<p>You’ve recovered a used needle during a property search, and it’s still in your gloved hand while you decide how to handle it before moving on. Recapping it or setting it aside might seem like ways to make it safer, but they don’t properly contain the sharp.</p><p>If no designated sharps container is immediately available, don’t place the needle in general waste, and don’t improvise a wrapping out of soft material such as a paper towel or a plastic bag. Once a sharp is used, don’t recap, bend, or break it, and don’t leave it on a work surface or place it in general waste. Seek a designated sharps container and move the sharp directly into it.</p>`,
      fillP:
        `<p>You’re carrying a used needle recovered during a property search to the designated sharps container in the station’s processing area. As you approach, you notice the container has reached its fill line. On the way there, you also pass a used syringe sitting in a general-waste bin.</p>` +
        `<p>Both situations present a sharps hazard, but for different reasons.</p>`,
      binCould: `a used syringe`,
      binHidden: `It looks like it could be a used syringe, but you can’t tell without disturbing the contents.`,
      benchName: `A used needle left on the work surface`,
      n1s: `Recovers a needle during an arrest`, n3s: `Collects the bag for custodial pickup`,
      s0: `<p>Chris recovers a used needle from a subject’s property during an arrest.</p>`,
      s1: `<p>He can’t find a sharps container nearby. He’s in the middle of the intake, so just this once, he drops the used needle into the general trash at the station.</p>`,
      s2: `<p>Later, Jacob collects the bag for custodial pickup. <strong>The needle sticks him through the bag.</strong></p>`,
      s3: `<p>Jacob never handled the arrest. He never even saw the needle.</p><p>But a needlestick can expose someone to bloodborne pathogens such as HIV, hepatitis B, and hepatitis C.</p>`,
      cl4: `, along with the people who love him.`,
      engP: `<p>An agency is looking for ways to better protect officers who may come into contact with used sharps. One option is to issue heavier protective gloves. Another is to make designated sharps containers more accessible throughout its stations and intake areas.</p><p>Both can provide protection, but they don’t control the hazard in the same way.</p>`,
      accessP: `Making containers more accessible means one at the intake counter and in the processing area, not one across the room.`,
      cmpL: `Container across the intake area`, cmpR: `Container at the intake counter`,
      h2poll: `What you’ve seen on shift`,
      simH: `A needle you didn’t put there`,
      simSetup: `<p>You’re clearing your patrol vehicle at the end of shift when you find a used hypodermic needle wedged into the back seat. You didn’t put it there, and you don’t know who did.</p>`,
      simDecision: `<p>You lift the used needle clear of the seat. Before you can deal with it, another officer calls for your help across the lot. They need you now. The needle is still in your gloved hand. What do you do?</p>`,
      simWalk: `<p>The used needle still has to be dealt with, and the designated sharps container is inside the station. Describe what you do next, step by step, until the needle is disposed of.</p>`
    }
  };
  const SK = root.dataset.sector;
  const S = SECTORS[SK];
  $$('[data-k]').forEach(el => { const v = S[el.dataset.k]; if (v != null) el.innerHTML = v; });
  document.title = S.h1 + ' — Contain the Sharp (Riff 08)';

  /* sector switch (review control) */
  const setSector = (k) => { const u = new URL(location.href); u.searchParams.set('sector', k); location.href = u.toString(); };
  $('#secM').setAttribute('aria-pressed', String(SK === 'manufacturing'));
  $('#secLE').setAttribute('aria-pressed', String(SK === 'law-enforcement'));
  $('#secM').addEventListener('click', () => setSector('manufacturing'));
  $('#secLE').addEventListener('click', () => setSector('law-enforcement'));

  /* ==========================================================================
     2 · motion preference + chapters
     ========================================================================== */
  const rmBtn = $('#rmBtn');
  const reduced = () => root.classList.contains('rm');
  const setRM = (on) => { root.classList.toggle('rm', on); rmBtn.setAttribute('aria-pressed', String(on)); schedule(); };
  rmBtn.addEventListener('click', () => setRM(!reduced()));

  const chapters = $$('[data-chapter]');
  const dots = $('#dots'), chap = $('#chap');
  chapters.forEach(s => {
    const a = document.createElement('a');
    a.href = '#' + s.id; a.title = s.dataset.chapter; a.setAttribute('aria-label', s.dataset.chapter);
    dots.appendChild(a);
  });
  const dotEls = $$('a', dots);
  const chapIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const i = chapters.indexOf(e.target);
    chap.innerHTML = '<b>' + String(i + 1).padStart(2, '0') + '</b>' + e.target.dataset.chapter;
    dotEls.forEach((d, k) => d.classList.toggle('on', k === i));
  }), { rootMargin: '-45% 0px -50% 0px' });
  chapters.forEach(s => chapIO.observe(s));
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { chap.innerHTML = '<b>00</b>Start'; dotEls.forEach(d => d.classList.remove('on')); }
  }), { threshold: .5 }).observe($('#top'));

  const rvIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => rvIO.observe(el));

  /* ==========================================================================
     3 · COMPONENTS
     ========================================================================== */

  /* ---- stepped scenes: the card in the middle of the screen sets the picture --- */
  const sceneHooks = {};
  $$('.scrolly').forEach(sc => {
    const stage = $('.frame', sc), steps = $$('.step', sc), cap = $('.cap', stage), pips = $('.pips', stage);
    pips.innerHTML = steps.map(() => '<i></i>').join('');
    const set = (i) => {
      stage.dataset.step = i;
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      $$('i', pips).forEach((p, k) => p.classList.toggle('on', k <= i));
      const card = $('.card', steps[i]);
      cap.innerHTML = '<b>' + (i + 1) + ' / ' + steps.length + '</b>' + card.dataset.cap;
      if (sceneHooks[stage.id]) sceneHooks[stage.id](i, card);
    };
    set(0);
    const narrow = matchMedia('(max-width:1100px)').matches;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(steps.indexOf(e.target)); }),
      { rootMargin: narrow ? '-72% 0px -14% 0px' : '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
  });

  /* the weeks after the stick: ring + dots follow the card */
  const arc = $('#arc'), ticks = $('#ticks'), RING = 2 * Math.PI * 150;
  const fr = $$('#scE .card').map(c => parseFloat(c.dataset.f));
  fr.forEach(f => {
    const a = f * 2 * Math.PI - Math.PI / 2, c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('class', 'tick'); c.setAttribute('r', 9);
    c.setAttribute('cx', 200 + 150 * Math.cos(a)); c.setAttribute('cy', 200 + 150 * Math.sin(a));
    ticks.appendChild(c);
  });
  sceneHooks.stageE = (i, card) => {
    arc.style.strokeDashoffset = String(RING * (1 - fr[i]));
    $$('.tick', ticks).forEach((t, k) => t.classList.toggle('on', k <= i));
    $('#clkSm').textContent = card.dataset.sm; $('#clkBig').textContent = card.dataset.big;
  };
  sceneHooks.stageE(0, $('#scE .card'));

  /* ---- tempting shortcuts ----------------------------------------------------------- */
  const TEMPT = [
    { t: `Recap it, carefully`, why: `Once a sharp is used, don’t recap, bend, or break it. Recapping might seem like a way to make it safer, but it doesn’t properly contain the sharp.` },
    { t: `Bend or break it so it can’t hurt anyone`, why: `Snapping a sharp might seem safer, but it doesn’t properly contain it. It goes directly into a designated sharps container.` },
    { t: `Wrap it and drop it in the trash`, why: S.shortWrap },
    { t: `Set it down where I can see it`, why: `You can see exactly where it is, but anyone who reaches for that spot before you return can’t. Don’t leave it on a work surface, even temporarily.` },
    { t: `Keep it in my hand until I’m done helping`, why: `A few extra steps don’t change the procedure. Plan the disposal route before you handle the sharp, then put the used sharp directly into a designated sharps container.` }
  ];
  $('#tempt').innerHTML = TEMPT.map((x, i) =>
    `<button class="tp" aria-expanded="false" data-i="${i}"><small>It feels safer</small><b>${x.t}</b><span class="more">Tap to see why not</span><span class="why">${x.why}</span></button>`).join('');
  $$('.tp').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-expanded', String(b.getAttribute('aria-expanded') !== 'true'))));

  /* ---- quick checks: unscored. A miss shows the reteach, then lets you try again. ------------ */
  const OPT = ['A', 'B', 'C', 'D'];
  const QC = {
    k1: {
      q: `You have a used sharp to deal with, and the designated sharps container is at the other end of your work area. What do you do with it right now?`,
      opts: [`Dispose of it in the sharps container following your workplace’s approved procedure.`, `Set it down where you’re working and get back to the task.`, `Wrap it and drop it in the general-waste bin.`, `Bend or break it so it can’t cut anyone, then put it in the regular bin.`],
      ok: 0, fb: `<p>Plan the disposal route before you handle the sharp, then place the used sharp directly into a designated sharps container following your workplace’s approved procedure.</p>`, rem: S.rem1
    },
    k1up: {
      q: `You have a used sharp to deal with. The designated sharps container is a walk away, and someone is calling you over to help with something that can’t wait. What do you do right now?`,
      opts: [`Make the walk to the sharps container before taking the other task.`, `Set it down where you can see it and carry it down on your next break.`, `Ask a coworker to keep an eye on it until you can get back to it.`, `Keep it in your hand for now and deal with it after you’ve helped.`],
      ok: 0, fb: `<p>A few extra steps don’t change the procedure. Plan the disposal route before you handle the sharp, then put the used sharp directly into a designated sharps container.</p>`, rem: S.rem1
    },
    k2: {
      q: `The sharps container is nearing its fill line. Nearby, you notice something partially concealed in a general-waste bin that could be ${S.binCould}. What should you recognize?`,
      opts: [`Both conditions could present a sharps hazard, even though neither is immediately obvious.`, `Only the container is a concern because the object in the bin hasn’t been confirmed as a sharp.`, `Only the object in the bin is a concern because the container hasn’t reached its fill line.`, `Neither is a concern yet because the container still has room and the object hasn’t been identified.`],
      ok: 0, fb: `<p>Sharps hazards aren’t always obvious. A container nearing its fill line leaves less room for safe disposal, while something that could be a sharp concealed in general waste may put someone at risk if the contents are disturbed or handled.</p>`,
      rem: `<p>You arrive at a designated sharps container and notice that several used sharps are already crowded near the top. One is resting near the opening, leaving little room to add another safely. Pressing the sharps down or trying to fit another one in could bring your hand into contact with a used sharp. When a container reaches its fill line, it should be treated as full and should not be used. Use another designated sharps container instead.</p><p>A sharp can also become a hazard when it is left somewhere it doesn’t belong. A sharp left on a work surface, concealed in other material, or placed in general waste can expose someone who doesn’t expect it to be there. Whether the hazard is a full container or a misplaced sharp, recognizing the unsafe condition is the first step in preventing a sharps injury.</p>`
    },
    poll: {
      q: `In the last 12 months, how many times have you come across a sharp that was improperly disposed of?`,
      opts: [`Never`, `Once or twice`, `Three to five times`, `More than five times`], ok: -1,
      fb: `<p>Thank you. This isn’t scored, and it’s reported only as a group-level picture.</p>`
    }
  };
  $$('[data-qc]').forEach(box => {
    const d = QC[box.dataset.qc], poll = d.ok < 0;
    const paint = () => {
      box.innerHTML = `<div class="tagline">${poll ? 'A question for you' : 'Quick check'}<span>Not scored</span></div><h4>${d.q}</h4>` +
        `<div class="opts">${d.opts.map((o, i) => `<button class="opt" data-i="${i}"><i>${OPT[i]}</i><span>${o}</span></button>`).join('')}</div><div class="fb" hidden></div>`;
      $$('.opt', box).forEach(b => b.addEventListener('click', () => answer(+b.dataset.i)));
    };
    const answer = (i) => {
      const fb = $('.fb', box);
      $$('.opt', box).forEach((b, k) => {
        b.disabled = true;
        if (poll) { b.classList.toggle('picked', k === i); return; }
        if (k === d.ok) b.classList.add('ok');
        else if (k === i) b.classList.add('no');
      });
      fb.hidden = false;
      if (poll) fb.innerHTML = d.fb;
      else if (i === d.ok) fb.innerHTML = `<b class="h ok">That’s the one</b>${d.fb}`;
      else fb.innerHTML = `<b class="h no">Not quite. Here’s the idea again</b>${d.rem}<button class="again">Try again</button>`;
      const again = $('.again', fb); if (again) again.addEventListener('click', paint);
    };
    paint();
  });

  /* ---- agreement scales (unscored) ----------------------------------------------------------------- */
  const scaleBox = (id, onPick) => {
    const box = $(id), row = $('.scale', box);
    row.innerHTML = [1, 2, 3, 4, 5].map(n => `<button aria-pressed="false" data-n="${n}">${n}</button>`).join('');
    $$('button', row).forEach(b => b.addEventListener('click', () => {
      $$('button', row).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      onPick(+b.dataset.n, box);
    }));
  };
  scaleBox('#f1', (n, box) => { $('.after', box).hidden = false; });
  scaleBox('#f3', (n, box) => {
    $('.after', box).hidden = false; $('#f3text').hidden = false;
    $$('.rv', $('#f3text')).forEach(el => el.classList.add('in'));
    const fill = $('#barFill'), mark = $('#barMark'), big = $('#bigN');
    mark.style.left = ((n - 1) / 4 * 96) + '%';
    fill.style.width = '0%'; big.textContent = '0.0';
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = '92.7%'; }));
    const t0 = performance.now(), dur = reduced() ? 1 : 1600;
    const tick = (t) => { const k = clamp((t - t0) / dur); big.textContent = (92.7 * (1 - Math.pow(1 - k, 3))).toFixed(1); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });

  /* ---- hot spots: what is, and isn't, a hazard -------------------------------------------------------------- */
  const SPOTS = [
    { t: `A sealed spare, still in its packaging`, haz: false, p: [`Not a hazard. It isn’t in use. It’s the replacement you reach for when another container fills.`] },
    { t: `A wall-mounted container, about a quarter full`, haz: false, p: [`Not a hazard. There’s room, and nothing is near the opening.`] },
    { t: `A container at its fill line`, haz: true, p: [
      `Once a sharps container reaches its marked fill line, it should be treated as full and should not be used. Trying to add another sharp could bring you into contact with the sharps already inside.`,
      `A container nearing its fill line leaves less room too. There may appear to be room, but contents already crowded near the top are the warning sign.`,
      `Use another designated sharps container instead.`] },
    { t: S.benchName, haz: true, p: [`A sharp left where it doesn’t belong, whether on a work surface, concealed in other material, or mixed into general waste, can put the next person who encounters it at risk.`] },
    { t: `Something partly hidden in the general waste`, haz: true, p: [S.binHidden, `Sharps hazards aren’t always obvious. A possible sharp concealed in general waste can put someone at risk if the material is disturbed or handled without recognizing what may be inside.`] },
    { t: `A general-waste bin, emptied and relined`, haz: false, p: [`Not a hazard. It was emptied and relined at the start of the shift, so there is nothing in it to find.`] }
  ];
  const seen = new Set(), hsEls = $$('.hs'), note = $('#note');
  hsEls.forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i, n = SPOTS[i];
    hsEls.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    seen.add(i); b.classList.add('seen', n.haz ? 'haz' : 'fine');
    note.innerHTML = `<span class="verdict ${n.haz ? 'haz' : 'fine'}">${n.haz ? 'Sharps hazard' : 'Not a hazard'}</span><h3>${n.t}</h3>${n.p.map(x => `<p>${x}</p>`).join('')}` +
      `<div class="tally"><span class="pips">${SPOTS.map((_, k) => `<i class="${seen.has(k) ? 'on' : ''}"></i>`).join('')}</span>${seen.size} of ${SPOTS.length} looked at</div>`;
  }));

  /* ---- gloves vs container ---------------------------------------------------------------------------------- */
  const gl = $('#gl'), glv = $('#glv'), layers = $('#glovelayers');
  const drawGloves = () => {
    const n = +gl.value; glv.textContent = n;
    layers.innerHTML = Array.from({ length: n }, (_, i) => `<rect x="252" y="${256 - i * 15}" width="296" height="17" rx="8" fill="rgba(46,230,207,.26)" stroke="#2ee6cf" stroke-width="1.5"/>`).join('');
  };
  gl.addEventListener('input', drawGloves); drawGloves();
  $$('#demo .tabs button').forEach(b => b.addEventListener('click', () => {
    const box = b.dataset.t === 'box';
    $$('#demo .tabs button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    $('#gloveScene').hidden = box; $('#boxScene').hidden = !box; $('#glovectl').hidden = box;
    $('#demoOut').innerHTML = box
      ? `A designated sharps container is an <strong>engineering control</strong>. It contains the sharp after disposal, reducing the chance that another person will come into contact with it.`
      : `<strong>Heavy-duty gloves</strong> can help protect against cuts, punctures, and exposure, but even thick gloves can be penetrated by a needle.`;
  }));

  /* ---- compare slider ---------------------------------------------------------------------------------------- */
  const cmp = $('#cmp'), cmpIn = $('#cmpIn');
  const setCmp = () => cmp.style.setProperty('--x', cmpIn.value + '%');
  cmpIn.addEventListener('input', setCmp); setCmp();
  new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting || reduced()) return;
    o.disconnect();
    let t = 0; const tick = () => { t++; cmpIn.value = 50 + Math.sin(t / 14) * 22 * (1 - t / 70); setCmp(); if (t < 70) requestAnimationFrame(tick); else { cmpIn.value = 50; setCmp(); } };
    requestAnimationFrame(tick);
  }), { threshold: .7 }).observe(cmp);

  /* ---- simulation preview ---------------------------------------------------------------------------------------- */
  const choice = (boxId, fbId, opts, okIdx, okMsg, noMsg) => {
    const box = $(boxId), fb = $(fbId);
    box.innerHTML = opts.map((o, i) => `<button class="opt" data-i="${i}"><i>${OPT[i]}</i><span>${o}</span></button>`).join('');
    $$('.opt', box).forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      $$('.opt', box).forEach((x, k) => { x.disabled = true; if (k === okIdx) x.classList.add('ok'); else if (k === i) x.classList.add('no'); });
      fb.hidden = false; fb.innerHTML = i === okIdx ? okMsg : noMsg;
    }));
  };
  choice('#simOpts', '#simFb',
    [`Make the walk to the sharps container before taking the other task.`, `Set it down where I can see it and carry it down on my next break.`, `Ask a coworker to keep an eye on it until I can get back to it.`, `Keep it in my hand for now and deal with it after I’ve helped.`], 0,
    `<p>That’s the call. A few extra steps don’t change the procedure.</p><p>The real scene looks at whether you act, and how quickly.</p>`,
    `<p>Setting the sharp down on any surface it wasn’t disposed into is the shortcut. The moment it leaves your hand, the next person is the one at risk.</p><p>The real scene looks at whether you act, and how quickly.</p>`);
  choice('#simOpts3', '#simFb3',
    [`Find another designated sharps container.`, `Improvise: press it in, or wrap it and put it in general waste.`], 0,
    `<p>Use another designated sharps container. Pressing sharps down or fitting another one in could bring your hand into contact with a used sharp.</p>`,
    `<p>When a container reaches its fill line, it should be treated as full and should not be used. Don’t place the sharp in general waste, and don’t improvise a wrapping. Use another designated sharps container.</p>`);
  $('#worstBtn').addEventListener('click', () => { $('#simFb4').hidden = false; });
  $('#replay').addEventListener('click', () => scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }));

  /* ==========================================================================
     4 · SCROLL ENGINE. One rAF-throttled loop drives the progress bar, the hero
     video, the walk, and the pull-quote.
     ========================================================================== */
  const walk = $('#walk'), brk = $('#brk');
  const wSteps = $('#wSteps'), wSec = $('#wSec'), wPeople = $('#wPeople');
  const wCaps = $$('#wCaps p'), npcs = $$('.npc', walk), words = $$('#quote span');
  const scrub = (sec) => { const r = sec.getBoundingClientRect(), vh = innerHeight; return clamp(-(r.top - 56) / (r.height - vh + 56)); };

  function updateWalk() {
    const p = scrub(walk);
    walk.style.setProperty('--p', p.toFixed(4));
    wSteps.textContent = Math.round(p * 14);
    wSec.textContent = (p * 11).toFixed(1);
    const youX = 11 + p * 68; let passed = 0;
    npcs.forEach(n => { const x = parseFloat(n.style.getPropertyValue('--x')); if (youX > x) passed++; n.classList.toggle('near', Math.abs(youX - x) < 8); });
    wPeople.textContent = passed;
    const idx = p < .28 ? 0 : p < .78 ? 1 : 2;
    wCaps.forEach((c, k) => c.classList.toggle('on', k === idx));
  }
  function updateBreak() {
    const p = scrub(brk);
    brk.style.setProperty('--p', p.toFixed(4));
    const lit = Math.floor(clamp((p - .12) / .66) * (words.length + 0.999));
    words.forEach((w, i) => w.classList.toggle('lit', i < lit));
  }

  /* hero video: never plays. currentTime eases toward the scroll position. */
  const heroEl = $('#top'), heroCopy = $('#heroCopy'), heroCue = $('#heroCue'), vid = $('#heroVid');
  const heroFade = $('.hero-fade'), heroVig = $('.hero-vig');
  let vidTarget = 0, vidCur = 0, vidReady = false, vidBusy = false;
  const primeVid = () => { vid.play().then(() => vid.pause()).catch(() => {}); };   // iOS: unlocks seeking
  vid.addEventListener('loadedmetadata', () => { vidReady = true; primeVid(); vidLoop(); });
  addEventListener('touchstart', primeVid, { once: true, passive: true });
  function vidLoop() {
    if (!vidReady || !vid.duration) return;
    if (reduced()) { vid.currentTime = 0; vidBusy = false; return; }
    vidCur += (vidTarget - vidCur) * 0.18;
    if (Math.abs(vidTarget - vidCur) < 0.004) vidCur = vidTarget;
    if (Math.abs(vid.currentTime - vidCur) > 0.01) vid.currentTime = vidCur;
    if (vidCur !== vidTarget) requestAnimationFrame(vidLoop); else vidBusy = false;
  }
  function updateHero() {
    const hp = clamp(scrollY / (heroEl.offsetHeight - innerHeight));
    if (vid.duration) { vidTarget = hp * vid.duration; if (!vidBusy) { vidBusy = true; requestAnimationFrame(vidLoop); } }
    const tp = clamp(hp / .32);
    heroCopy.style.opacity = (1 - tp).toFixed(2);
    heroCopy.style.transform = reduced() ? '' : `translate3d(0,${(-tp * 70).toFixed(0)}px,0)`;
    heroCue.style.opacity = (1 - clamp(hp / .12)).toFixed(2);
    heroVig.style.opacity = (1 - tp * .85).toFixed(2);
    heroFade.style.opacity = (0.25 + clamp((hp - .78) / .22) * .75).toFixed(2);
  }

  const prog = $('#prog');
  function frame() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max) : 0})`;
    updateHero(); updateWalk(); updateBreak();
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);

  setRM(matchMedia('(prefers-reduced-motion: reduce)').matches);
  frame();
})();
