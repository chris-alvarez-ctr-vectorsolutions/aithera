/* ============================================================================
   layered-hazing.js — Hazing Awareness and Prevention, Module 5
   "Report Hazing Through Appropriate Channels", built on js/layered-engine.js.

   SCAFFOLD (2026-10-28). Forked from js/layered-sharps.js and cut down to
   what this module's structure map asks for. The shared machinery is
   Sharps' own, unchanged in behaviour: the pre-check card stack, the path
   update, the format offer, Listen mode (driven by data/hazing-listen/),
   one deck screen per chapter (Watch a video, or Read in the immersive
   reader), and the results screen. Sharps-only screens (the chain, hazard,
   procedure, cases, debrief, in-module simulation) are not here.

   Sources, all in ~/Downloads (not in the repo):
     Hazing Module 5 Structure Map v2 (PDF) — the permutations, policies and
       what plays in each mastery state;
     hazing-e7b8239e.led_Reviewed (PDF) — Outcome 5's objectives and every
       question, verbatim;
     Report-Hazing-narrations-LED-review-round2 (PDF) — the chapter
       narrations, verbatim. The Read carrier shows them as written.

   Placeholders: every Watch screen plays one placeholder clip; the Listen
   packages are machine-voiced stand-ins (assets/audio/hazing/). The two 5.1
   test-up chapters (M5-01B) have no narration yet; their screens say so.

   Two audiences, Athletes and Greek Life, run as the engine's context lenses
   (the same slot Sharps uses for sectors). Unlike a Sharps sector, an
   audience is its own storyline, so each one carries its own full set of
   chapters rather than a few differences laid over a shared one.

       When hazing is occurring, has occurred, or is suspected, call 911 or
       campus emergency services immediately if anyone shows signs of
       significant distress; otherwise, report the concern through one or
       more appropriate channels.

   Loads AFTER js/layered-engine.js. See clara/hazing.html.
   ========================================================================== */
(function () {
  'use strict';

  var LE = window.Layered;
  var T = LE.T, esc = LE.esc, readCourse = LE.readCourse, saveResult = LE.saveResult,
      wireChat = LE.wireChat, typeFeedback = LE.typeFeedback,
      lens = LE.lens, visiblePath = LE.visiblePath;

  var COURSE = 'Hazing Awareness and Prevention';
  var MODULE = 'Report Hazing Through Appropriate Channels';

  // ==========================================================================
  //  THE OBJECTIVES — the structure map's three. Ids follow its subscale
  //  codes (K1, K2, F1). `policy` is the map's:
  //    remediate — a miss (Know) or a low pre-check score (Feel) adds or
  //                swaps in a remedial chapter
  //    ask       — always in the cut, measured, never remediates
  //  LO 5.4 (Choosing and Using a Reporting Channel, Do) is in the LED
  //  extract but not in the map, and the narration round leaves it out while
  //  the Scenario Simulator work goes on. Not built.
  // ==========================================================================
  var OBJECTIVES = [
    { id: 'K1', name: 'Where to report hazing', domain: 'Know', sub: 'Remember', policy: 'remediate', locked: false,
      where: 'Pre-module battery + in-flow', src: 'LO 5.1',
      text: 'Recall the available channels for reporting hazing: the National Anti-Hazing Hotline, institutional anonymous reporting, counseling and health services, the dean of students office, and emergency assistance when someone is in significant distress.' },
    { id: 'K2', name: 'Consequences of hazing', domain: 'Know', sub: 'Understand', policy: 'ask', locked: false,
      where: 'In-flow', src: 'LO 5.2',
      text: 'Explain the criminal, civil, and institutional consequences of hazing for individuals and organizations — including when hazing rises to felony level, how planners can be held liable even if not present, and how SCHA reporting requirements relate to Clery Act and VAWA offense reporting.' },
    { id: 'F1', name: 'Reporting is the right thing to do', domain: 'Feel', sub: 'Believe', policy: 'remediate', locked: false,
      where: 'Pre + post', src: 'LO 5.3',
      text: 'Agree: reporting hazing — even anonymously — is the responsible course of action, does not constitute betrayal of peers, and helps the institution improve rather than drags the reporter into an unwanted process.' }
  ];
  function obj(id) {
    for (var i = 0; i < OBJECTIVES.length; i++) if (OBJECTIVES[i].id === id) return OBJECTIVES[i];
    return null;
  }

  // ==========================================================================
  //  AUDIENCES — set at assignment, never by the pre-check. Each is a lens:
  //  the cover's labels here, and its own chapters in DECK below.
  // ==========================================================================
  var LENSES = {
    athletes: {
      label: 'Athletes', story: 'The swim team',
      org: 'Your institution', orgShort: 'Your institution',
      coord: { name: 'Course Coordinator', title: 'Dean of Students Office', email: 'coordinator@example.edu' }
    },
    greek: {
      label: 'Greek Life', story: 'The sorority',
      org: 'Your institution', orgShort: 'Your institution',
      coord: { name: 'Course Coordinator', title: 'Fraternity and Sorority Life', email: 'coordinator@example.edu' }
    }
  };
  var LENS_ORDER = ['athletes', 'greek'];
  function lensKey() { var l = LE.lensId(); return LENSES[l] ? l : 'athletes'; }

  // Design style: 'clara' (default) | 'vector-dark' | 'vector-light' — see
  // the html.ll-vector-style/html.ll-vector-light token overrides in
  // clara/sharps.html's <style>, and the boot snippet in its <head> that
  // applies the right class(es) before first paint. Mostly a CSS swap, so
  // the Demo menu control below never needs a replay/refresh — but the
  // Möbius orb (js/mobius-orb.js) is a WebGL canvas that reads no CSS
  // custom property, so its colours are re-set here too, live, via
  // LE.setOrbColors (MobiusOrb.setConfig — no recreate).
  //
  // The orb's default green/blue are tuned as glowing highlights against
  // CLARA's near-black stage — bright, light-value colour that pops out of
  // near-black. On Vector-light's near-white stage that relationship
  // inverts: the same light values read as pale and washed out, because
  // contrast against a light surface comes from lower value/more
  // saturation, not from brightness. So LIGHT_ORB_COLORS isn't a "brighter"
  // palette, it's a darker, more saturated one — Vector's own accent blue
  // (matches --ll-teal under html.ll-vector-style) and its documented
  // success green (--lumo-success-color fallback, interaction-style-
  // reference.html), leaving the shadow-toned `deep` channel alone since a
  // dark base tone reads fine against either surface.
  var LIGHT_ORB_COLORS = { blue: '#0271ce', green: '#158444' };
  function styleMode() {
    try {
      var v = sessionStorage.getItem('hz-style');
      return (v === 'vector-dark' || v === 'vector-light') ? v : 'clara';
    } catch (e) { return 'clara'; }
  }
  function applyStyleMode(mode) {
    var html = document.documentElement;
    html.classList.toggle('ll-vector-style', mode === 'vector-dark' || mode === 'vector-light');
    html.classList.toggle('ll-vector-light', mode === 'vector-light');
    if (LE.setOrbColors) LE.setOrbColors(mode === 'vector-light' ? LIGHT_ORB_COLORS : null);
  }
  // D11: the learner's name — in production it comes from SSO. Here it's a
  // stand-in, seeded from a launch link's ?name= or set from the Demo menu,
  // and "Chris" until either says otherwise. Cleared to empty, every reader
  // falls back to an unnamed line. Read by the path-ready line ("You're all
  // set, Chris").
  var DEFAULT_LEARNER_NAME = 'Chris';
  function savedName() {
    try {
      var v = sessionStorage.getItem('hz-name');
      return (v === null ? DEFAULT_LEARNER_NAME : v).trim().slice(0, 40);
    } catch (e) { return DEFAULT_LEARNER_NAME; }
  }
  // ==========================================================================
  //  REINFORCEMENT — one extra question laid OVER the content that motivates
  //  it, instead of stacked underneath it.
  //
  //  Three screens ask twice: the account then the belief re-rate, the budget
  //  choice then its rating, the cohort figures then where your own shift
  //  sits. Underneath, the second ask competed with everything above it —
  //  worst on the account, which is a six-paragraph read the learner has
  //  already scrolled through.
  //
  //  The content is HELD, not replaced: it stays legible behind a light blur
  //  so the connection is visible, which is the same language the Scenario
  //  Simulator uses when its coach panel comes forward over a scene
  //  (.stage.is-frozen). Only for screens whose context is still live —
  //  deliberately NOT the culminating decision, where the moment has passed and
  //  freezing it would imply the learner can still act on it.
  // ==========================================================================
  // The nearest ancestor that genuinely scrolls, or the window. Guessing at
  // this is what made the first footer fix a no-op: it scrolled .ll-stage
  // (overflow hidden) and the window (body does not overflow) while the real
  // container was main.ll-object all along.
  // Nudge `el` out from under the fixed footer bar. Called after a card opens
  // AND again whenever one grows — appending the read-back to part 2 pushed
  // its own closing line back under the bar.
  function clearFooter(el) {
    try {
      var bar = document.querySelector('.ll-footer');
      if (!bar || !el) return;
      var lip = el.getBoundingClientRect().bottom - bar.getBoundingClientRect().top;
      if (lip <= 0) return;
      scrollHost(el).scrollBy({ top: lip + 16, behavior: 'auto' });
    } catch (e) {}
  }

  function scrollHost(el) {
    var n = el.parentElement;
    while (n && n !== document.body) {
      var oy = getComputedStyle(n).overflowY;
      if (/(auto|scroll|overlay)/.test(oy) && n.scrollHeight > n.clientHeight + 1) return n;
      n = n.parentElement;
    }
    return window;
  }

  function reinforce(ctx, el, stepNo, stepOf, opts) {
    if (!el) return;
    opts = opts || {};
    // Tuck the coach. Their bubble is anchored bottom-right and the layer is
    // a card in the column, so an open bubble sat ON the layer and covered the
    // third option outright. They have nothing to say at this moment anyway —
    // they speak when the answer lands.
    if (ctx && ctx.floatClose) ctx.floatClose();
    // Retire the parts of the held content this question does not need. The
    // blur says HELD, but a tall screen still has to FIT: on the cohort
    // figures the recall block has already been answered by the time the
    // layer opens, and leaving it in the column pushed the chart the question
    // is actually about off the top of the screen.
    (opts.spent || []).forEach(function (x) { if (x) x.hidden = true; });

    el.hidden = false;
    el.classList.add('rf-layer');
    if (el.parentElement) el.parentElement.classList.add('rf-on');

    // Where you are in a screen that asks more than once. Added only when the
    // caller says there IS more than one part, so a single-ask layer does not
    // carry a "1 of 1" that answers a question nobody had.
    if (stepOf > 1 && !el.querySelector('.rf-step')) {
      var m = document.createElement('span');
      m.className = 'rf-step';
      m.textContent = 'Part ' + stepNo + ' of ' + stepOf;
      el.insertBefore(m, el.firstChild);
    }

    // Focus the card rather than the first control inside it: a screen reader
    // then reads the question before the options, and a keyboard learner lands
    // at the top of what just appeared instead of halfway into it. But a bare
    // tabindex="-1" div has no accessible name of its own — focus would move
    // there silently, leaving the learner to read forward to find the
    // question. Point it at its own heading instead, so landing on it reads
    // the question aloud immediately.
    var heading = el.querySelector('h1, h2, h3');
    if (heading) {
      if (!heading.id) heading.id = (el.id || 'rf') + '-h';
      el.setAttribute('role', 'group');
      el.setAttribute('aria-labelledby', heading.id);
    }
    el.setAttribute('tabindex', '-1');
    // The held content may be taller than the viewport, so the ask can land
    // below the fold — leaving the learner looking at blurred text with no
    // visible question. Bring it into view with the LEAST movement that does
    // it: 'center' parked the card mid-screen and dragged the held content up
    // with it, which on the cohort figures left under a third of the chart
    // visible. 'nearest' scrolls only as far as it has to, so what the
    // question refers to stays where the learner last saw it.
    var soft = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      el.scrollIntoView({ block: 'nearest', behavior: soft ? 'smooth' : 'auto' });
    } catch (e) { el.scrollIntoView(); }
    // scrollIntoView measures against the VIEWPORT, and the bottom 80px of it
    // is the fixed footer bar. A card whose last control sits in that band
    // reads as fully visible to the browser and is covered on the screen —
    // which hid the commit button under Continue on a 940px-tall window.
    // Nudge by however much runs under the bar.
    // ...and then clear the footer bar, which scrollIntoView cannot know about.
    // It measures against the VIEWPORT; the bottom 80px of that is a FIXED
    // footer, so a card whose last control lands in that band reads as fully
    // visible to the browser and is covered on the screen — it hid the commit
    // button under Continue on a 940px-tall window. Measured after the smooth
    // scroll settles, because the lip is meaningless mid-animation, and
    // applied to the element that actually scrolls: neither the window nor
    // .ll-stage does here, it is main.ll-object with overflow-y:auto.
    setTimeout(function () { clearFooter(el); }, soft ? 380 : 0);
    try { el.focus({ preventScroll: true }); } catch (e) {}
  }

  // Patch a result key rather than replace it — saveResult() overwrites the
  // whole value, and hazard in particular is written from three different
  // places (the explainer's carrier choice, hzcheck's pass, hzcheck's miss)
  // that each need to keep what the others already wrote.
  function mergeResult(key, patch) {
    var cur = readCourse()[key] || {};
    var out = {};
    for (var k in cur) out[k] = cur[k];
    for (var k2 in patch) out[k2] = patch[k2];
    saveResult(key, out);
  }
  // ==========================================================================
  //  TITLE PAGE — the same LMS anatomy as the Bystander module, rendered from
  //  the live path so it foreshadows compression honestly.
  // ==========================================================================
  // Durations are summed from the steps themselves so the rail can never
  // drift from the syllabus. `full` already includes remediation steps
  // (e.g. remk1) alongside every adaptive one — it's the worst-case total
  // with no test-out, which is exactly what "Max time" reports pre-battery.
  // Deck-aligned 2026-09-22: every case now has alternate versions (base /
  // test-up / reinforced) of which a learner sees ONE, so summing every step
  // double-counted them. Counts the path as it currently stands instead —
  // before the pre-check, that is the standard path.
  function pathMinutes() {
    var full = 0;
    STEPS.forEach(function (st) { if (st.mins && (!st.when || st.when())) full += st.mins; });
    return { full: full };
  }
  function initials(name) {
    return String(name || '').split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }
  // The course's modules. Only Module 5 is built; the four before it are
  // the course's earlier outcomes, named by number until the course map
  // names them, and shown as already taken (the module sits fifth).
  var COURSE_MODULES = [
    { id: 'm1', name: 'Module 1', icon: 'fa-circle-info', mins: 8, state: 'done' },
    { id: 'm2', name: 'Module 2', icon: 'fa-scale-balanced', mins: 8, state: 'done' },
    { id: 'm3', name: 'Module 3', icon: 'fa-people-group', mins: 8, state: 'done' },
    { id: 'm4', name: 'Module 4', icon: 'fa-list-check', mins: 8, state: 'done' },
    { id: 'm5', name: MODULE, icon: 'fa-bullhorn', mins: 12, current: true, adaptive: true, podcast: true }
  ];
  // The rows this cover lists. An admin preview shows only the modules the
  // assignment picked, as a new learner would meet them: nothing done yet,
  // and every module but this one marked as not in the preview, since only
  // Module 5 is built.
  function courseModules() {
    if (!AP) return COURSE_MODULES;
    return COURSE_MODULES.filter(function (m) { return AP.modules.indexOf(m.id) > -1; })
      .map(function (m) { return m.current ? m : { id: m.id, name: m.name, icon: m.icon, mins: m.mins, adaptive: m.adaptive, state: 'preview' }; });
  }
  // Tags only on modules still to take: they help a learner decide how to
  // take one, and on a finished module they're noise (2026-09-25 review).
  // No audio tag (2026-10-27): the preference card already says Listening
  // applies to modules that offer it, so the row doesn't repeat it.
  function moduleMeta(m) {
    var tags = m.state !== 'done';
    return '<span class="cp-row-meta"><span>About ' + m.mins + ' min' + (m.mins > 1 ? 's' : '') + '</span>' +
      (tags && m.adaptive ? '<span class="adapt"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>Adaptive</span>' : '') +
    '</span>';
  }
  function INTRO_CONTENT() { var L = lens(); return '' +
    '<main class="ll-object">' +
      '<div class="cp-page">' +
        '<header class="cp-hero-band">' +
          '<div class="cp-hero">' +
            '<p class="ll-eyebrow">' + courseModules().length + (courseModules().length === 1 ? ' Module' : ' Modules') + '</p>' +
            '<h1>' + esc(COURSE) + '</h1>' +
            // The LED extract's behavior statement for Outcome 5, standing in
            // until the course has an official description.
            '<p class="cp-desc" id="cpDesc">When hazing is occurring, has occurred, or is suspected, call 911 or ' +
              'campus emergency services immediately if anyone shows signs of significant distress; otherwise, ' +
              'report the concern through one or more appropriate channels—the National Anti-Hazing Hotline, ' +
              'institutional anonymous reporting, the counseling and health services department, or the dean ' +
              'of students office.</p>' +
            '<div class="cp-chips">' +
              '<span class="cp-chip due"><i class="fa-solid fa-calendar-day"></i> Required · due Oct 3</span>' +
              '<span class="cp-chip"><i class="fa-solid fa-people-group"></i> ' + esc(L.label) + '</span>' +
            '</div>' +
          '</div>' +
          // No header art yet: a placeholder panel holds the image's place.
          '<div class="cp-art cp-art--ph" aria-hidden="true"><i class="fa-solid fa-building-columns"></i></div>' +
        '</header>' +
        '<div class="cp-grid">' +
          '<section class="cp-sections">' +
            '<div class="cp-sec-head"><h2>Course modules</h2></div>' +
            '<div id="cpRows"></div>' +
          '</section>' +
          '<aside class="cp-rail">' +
            // 2026-09-29: the card sets the learner's MODE preference (the
            // one the "How do you prefer to learn?" screen reads), not a
            // per-screen format. 2026-10-27: it offers that screen's own
            // three options — Watching / Listening / Reading — rather than
            // Classic / Listen mode.
            '<div class="cp-card cp-format"><h3>How you prefer to learn</h3>' +
              // Collapsed to the current choice by default — a full four-way
              // picker on a page the learner has not started anything on yet
              // reads as a decision being demanded rather than a setting
              // already made on their behalf. "Change" expands the same
              // picker every in-beat screen uses (modalityDropdown — this
              // card is where that shape originated; hazardInit/
              // procedureInit below now share it rather than each rolling
              // their own), so all four options (including the declined
              // one, honestly labeled) are still one tap away.
              modalityDropdown({ now: 'introModNow', btn: 'introModChange', wrap: 'introModPickWrap',
                icon: 'introModNowIcon', label: 'introModNowLabel', pick: 'introModPick' },
                offeredKeys(), null, MODE_CARD) +
              // The current choice's one-line description, the same line the
              // "How do you prefer to learn?" screen shows under it (OFFER
              // sub). It replaced Listening's own note + help tooltip
              // (2026-10-27); Listening adds only its "modules that offer
              // it" caveat.
              '<p class="cp-format-note" id="introModNote" aria-live="polite"></p>' +
            '</div>' +
            // D11 → moved to the Demo menu: sector/role and the self-assigned
            // name are reviewer/demo-driver settings, not a choice a real
            // learner makes on every visit — an LMS assigns the sector, and a
            // real name comes from SSO. Role rides the engine's own Context
            // lens control (already in the Demo menu on this step, since
            // `intro` is in lensedSteps); name gets its own row below. Both
            // still work as before via ?role=/?name= launch params and
            // sessionStorage (ll-lens/sh-name) — only the learner-facing
            // rail cards are gone.
            '<div class="cp-card cp-res"><h3>Resources</h3>' +
              // The places the LED extract (LO 5.1) sends a learner to.
              '<a href="#" onclick="return false" title="Mocked for the prototype"><i class="fa-solid fa-phone"></i> National Anti-Hazing Hotline: 1-888-NOT-HAZE <i class="fa-solid fa-arrow-up-right-from-square ext"></i></a>' +
              '<a href="#" onclick="return false" title="Mocked for the prototype"><i class="fa-solid fa-file-lines"></i> Student handbook and code of conduct <i class="fa-solid fa-arrow-up-right-from-square ext"></i></a>' +
              '<a href="#" onclick="return false" title="Mocked for the prototype"><i class="fa-solid fa-user-secret"></i> Anonymous reporting <i class="fa-solid fa-arrow-up-right-from-square ext"></i></a>' +
            '</div>' +
            '<div class="cp-card"><h3>Course coordinator</h3>' +
              '<div class="cp-coord"><span class="ava">' + esc(initials(L.coord.name)) + '</span>' +
                '<span><b>' + esc(L.coord.name) + '</b><small>' + esc(L.coord.title) + ' · ' + esc(L.coord.email) + '</small></span></div></div>' +
          '</aside>' +
        '</div>' +
      '</div>' +
    '</main>'; }
  function introInit(ctx) {
    var course = readCourse();

    // 2026-10-24: a long course description (the official one is a full
    // paragraph) shows three lines, cut at a word with "… More" sitting at
    // the end of the third line; More expands it in place with "Less" at
    // the end. Fitted by measuring, not CSS line-clamp, so the button lands
    // exactly where the text stops. A short description shows no button.
    var desc = document.getElementById('cpDesc');
    if (desc) {
      var full = desc.textContent, words = full.split(' '), open = false;
      var more = document.createElement('button');
      more.type = 'button'; more.className = 'cp-desc-more';
      more.setAttribute('aria-controls', 'cpDesc');
      // offsetHeight, not the bounding box: the screen scales in on entry,
      // and a transformed box would under-count lines mid-animation.
      var lines = function () { return Math.round(desc.offsetHeight / parseFloat(getComputedStyle(desc).lineHeight)); };
      var fit = function () {
        desc.textContent = full;
        if (open) { desc.append(' '); }
        else if (lines() <= 3) { return; }
        else {
          // Longest run of whole words that still leaves room for "… More".
          var lo = 1, hi = words.length - 1;
          while (lo < hi) {
            var mid = Math.ceil((lo + hi) / 2);
            desc.textContent = words.slice(0, mid).join(' ').replace(/[,.;:]$/, '') + '\u2026 ';
            desc.appendChild(more);
            if (lines() <= 3) lo = mid; else hi = mid - 1;
          }
          desc.textContent = words.slice(0, lo).join(' ').replace(/[,.;:]$/, '') + '\u2026 ';
        }
        more.textContent = open ? 'Less' : 'More';
        more.setAttribute('aria-expanded', String(open));
        desc.appendChild(more);
      };
      more.addEventListener('click', function () { open = !open; fit(); more.focus(); });
      fit();
      // Again once the web font is in: it sets wider than the fallback.
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (document.body.contains(desc)) fit(); });
      var fitT, onResize = function () {
        if (!document.body.contains(desc)) { window.removeEventListener('resize', onResize); return; }
        clearTimeout(fitT); fitT = setTimeout(fit, 120);
      };
      window.addEventListener('resize', onResize);
    }

    // D11: resumable progress now lives on the Sharps row itself (see the
    // "resume" state below) instead of a banner above the page. Anything
    // past the cover counts as progress worth resuming. LE.goTo refuses a step the current path no longer contains
    // (a when()-excluded remediation, say), which here just means Resume
    // quietly does nothing rather than stranding anyone; Start over always
    // works regardless.
    var last = LE.lastStepId();
    var hasProgress = !!(last && last !== 'intro' && LE.stepById(last));


    document.getElementById('cpRows').innerHTML = courseModules().map(function (m) {
      if (!m.current) {
        return '<div class="cp-row' + (m.state === 'done' ? '' : ' is-locked') + '">' +
          '<span class="cp-row-ico"><i class="fa-solid ' + m.icon + '"></i></span>' +
          '<span class="cp-row-main"><b>' + esc(m.name) + '</b>' + moduleMeta(m) + '</span>' +
          '<span class="cp-row-state ' + (m.state === 'preview' ? 'locked' : m.state) + '">' +
            (m.state === 'done' ? 'Complete' : m.state === 'preview' ? 'Not in preview' : 'Locked') + '</span>' +
        '</div>';
      }
      // Sharps is the only module with real content behind it, so it's the
      // only row this page can act on. Resume gets two separate buttons
      // ("Resume" and "Start over" are different actions, neither should be
      // guessable from tapping the row body) — but up next has exactly ONE
      // possible action, so the whole row can safely be that action.
      var icoMain = '<span class="cp-row-ico"><i class="fa-solid ' + m.icon + '"></i></span>' +
        '<span class="cp-row-main"><b>' + esc(m.name) + '</b>' + moduleMeta(m) + '</span>';
      if (hasProgress) {
        return '<div class="cp-row is-current">' + icoMain +
          '<span class="cp-row-state-wrap">' +
            '<button class="cp-row-reset" type="button" data-action="reset" title="Start over" aria-label="Start over"><i class="fa-solid fa-rotate-left"></i></button>' +
            '<button class="cp-row-state resume" type="button" data-action="resume">Resume</button>' +
          '</span>' +
        '</div>';
      }
      return '<button class="cp-row is-current is-startable" type="button" data-action="start" aria-label="Start ' + esc(m.name) + '">' + icoMain +
        '<span class="cp-row-state todo">Start</span>' +
      '</button>';
    }).join('');

    document.getElementById('cpRows').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'resume') { LE.goTo(last); return; }
      if (btn.dataset.action === 'start') {
        // The same "one step forward" the footer's Start module button
        // does — found live off STEPS rather than hardcoded, so a reordered
        // syllabus can't strand this row on a step that moved.
        var introIdx = STEPS.findIndex(function (st) { return st.id === 'intro'; });
        var firstStep = STEPS[introIdx + 1];
        if (firstStep) LE.goTo(firstStep.id);
        return;
      }
      // Start over — the same reset the old welcome-back banner ran. ll-lens
      // and sh-name are Demo menu settings now (role, name), not this run's
      // progress — same reason Review mode survives a Start over. Only the
      // run itself and its learner-facing preferences reset.
      ['hz-course', 'hz-course-last', 'hz-battery', 'hz-feel', 'hz-modality']
        .forEach(function (k) { try { sessionStorage.removeItem(k); } catch (err) {} });
      location.reload();
    });

    // The rail's format setting. Reads as "here is your current setting",
    // not "make a choice" — collapsed to the current pick until "Change" is
    // tapped, which reveals the same four-option picker every in-beat
    // screen uses (initModalityDropdown owns the collapse/expand chrome and
    // the outside-click close; picking an option still writes the
    // preference here, since that write is this card's own job, not
    // something a shared helper should do on every caller's behalf).
    var introPick = document.getElementById('introModPick');
    if (introPick) {
      var introDD = initModalityDropdown(
        { btn: 'introModChange', wrap: 'introModPickWrap', icon: 'introModNowIcon', label: 'introModNowLabel' },
        MODE_CARD);
      // No saved preference reads as Watching, the default — the offer
      // screen still treats it as unsaved and offers to save one.
      var curMode = function () { var k = offerPref() || 'video'; return offeredKeys().indexOf(k) > -1 ? k : offeredKeys()[0]; };
      var markFmt = function (k) {
        [].forEach.call(introPick.querySelectorAll('.md-opt'), function (b) {
          var on = b.dataset.m === k;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      };
      var note = document.getElementById('introModNote');
      var showNote = function (k) {
        if (!note) return;
        var o = OFFER.filter(function (x) { return x.key === k; })[0];
        note.textContent = (o ? o.sub : '') + (k === 'listen' ? ' Applies to modules that offer it.' : '');
      };
      introDD.render(curMode());
      markFmt(curMode());
      showNote(curMode());
      introPick.addEventListener('click', function (e) {
        var b = e.target.closest('.md-opt');
        if (!b) return;
        setOfferPref(b.dataset.m);
        markFmt(b.dataset.m);
        showNote(b.dataset.m);
        introDD.render(b.dataset.m);
        introDD.collapse();
      });
    }

    // Role (sector) is now set from the Demo menu's Context lens control
    // only — see CFG.lensedSteps below. Name has its own Demo menu row
    // (shNameBtn in CFG.demoControls).

    ctx.floatClose();
    ctx.positionOrb(false);
  }

  // ==========================================================================
  //  THE CHAPTER SCREENS. One shape for every chapter: a Watch or Read
  //  carrier of the chapter's narration — whichever the learner chose on the
  //  format screen, the same one on every screen (see THE STAGE) — and, when
  //  the chapter has one, a question laid over it with the reinforcement
  //  layer once the carrier is finished. Watch finishes when the clip ends
  //  (no learner-facing way past it; Skip exists only in review mode), Read
  //  on the learner's own "Done reading" (the in-flow button on the last
  //  paragraph).
  // ==========================================================================

  // One placeholder clip for every chapter until the videos are drawn (the
  // narration review says pictures come after narration sign-off). Add a
  // chapter's real clip to DECK_VIDEOS, per audience, as it lands.
  var DECK_VIDEO = '../../assets/videos/hazing-placeholder.mp4';
  var DECK_VIDEOS = { athletes: {}, greek: {} };
  function deckVideo(id) { return DECK_VIDEOS[lensKey()][id] || DECK_VIDEO; }
  // Buffering ahead: while one screen plays, quietly fetch the NEXT Watch
  // video on the learner's path into the browser cache. One clip ahead, low
  // priority, never twice. Skipped on the Listen-mode path.
  var warmed = {};
  function warmNextVideo(afterId) {
    if (podcastPath()) return;
    var i = STEPS.findIndex(function (s) { return s.id === afterId; });
    for (var k = i + 1; k > 0 && k < STEPS.length; k++) {
      var st = STEPS[k];
      if (st.when && !st.when()) continue;
      if (!deckHas(st.id)) continue;
      var url = deckVideo(st.id);
      if (warmed[url]) return;
      warmed[url] = true;
      try {
        fetch(url, { priority: 'low' })
          .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
          .catch(function () { delete warmed[url]; });
      } catch (e) {}
      return;
    }
  }
  var LIKERT_ENDS = ['Strongly Disagree', 'Strongly Agree'];
  var LETTERS = 'ABCDEFGH';

  // ---- The question formats ------------------------------------------------
  // Two formats, shared by the pre-check stack and the questions laid over
  // the videos, so the same question looks the same wherever it is asked.
  // `live` false renders the static preview the battery stack peeks behind
  // the current card: same markup, no buttons, nothing focusable.
  function mcqHtml(options, live) {
    return '<div class="cs-opts dk-opts"' + (live ? ' role="radiogroup"' : '') + '>' +
      options.map(function (o, i) {
        var inner = '<span class="cs-mark dk-letter" aria-hidden="true">' + LETTERS.charAt(i) + '</span>' +
                    '<span class="cs-opt-t">' + esc(o.t) + '</span>';
        return live
          ? '<button class="cs-opt" type="button" role="radio" aria-checked="false" data-i="' + i + '" ' +
              'aria-label="' + esc(LETTERS.charAt(i) + '. ' + o.t) + '">' + inner + '</button>'
          : '<div class="cs-opt">' + inner + '</div>';
      }).join('') +
    '</div>';
  }
  function likertHtml(live) {
    var pts = '';
    for (var v = 1; v <= 5; v++) {
      var name = v + (v === 1 ? ', ' + LIKERT_ENDS[0] : v === 5 ? ', ' + LIKERT_ENDS[1] : '');
      pts += live
        ? '<button class="lk-pt" type="button" role="radio" aria-checked="false" data-v="' + v + '" ' +
            'aria-label="' + esc(name) + '">' + v + '</button>'
        : '<span class="lk-pt">' + v + '</span>';
    }
    return '<div class="lk"' + (live ? ' role="radiogroup" aria-label="' +
        esc('1, ' + LIKERT_ENDS[0] + ', to 5, ' + LIKERT_ENDS[1]) + '"' : '') + '>' +
      '<div class="lk-pts">' + pts + '</div>' +
      '<div class="lk-ends" aria-hidden="true"><span>' + esc(LIKERT_ENDS[0]) + '</span>' +
        '<span>' + esc(LIKERT_ENDS[1]) + '</span></div>' +
    '</div>';
  }
  // Wires a rendered question: a pick lights the choice and arms the submit
  // button, and only the submit counts — a mis-tap never scores anyone.
  // Calls onCommit(value, pickedEl), value being the option index (multiple
  // choice) or 1–5 (likert).
  function wireChoice(host, btn, onCommit) {
    var sel = null, settled = false;
    var radios = [].slice.call(host.querySelectorAll('[role="radio"]'));
    radios.forEach(function (r) {
      r.addEventListener('click', function () {
        if (settled) return;
        if (sel) sel.setAttribute('aria-checked', 'false');
        sel = r;
        r.setAttribute('aria-checked', 'true');
        btn.disabled = false;
      });
    });
    LE.pickGroup(host);
    btn.disabled = true;
    btn.onclick = function () {
      if (settled || !sel) return;
      settled = true;
      host.classList.add('answered');
      radios.forEach(function (r) { r.disabled = true; });
      onCommit(sel.dataset.v ? +sel.dataset.v : +sel.dataset.i, sel);
    };
  }

  // Answer marks, shared by every question card (from Sharps' case screens).
  // 'neutral' (item 16): a plain pick, no verdict — served harder, not
  // quizzed, so a check/minus/x would all overclaim.
  var CS_GLYPH = { ok: 'fa-check', near: 'fa-minus', bad: 'fa-xmark', neutral: 'fa-circle' };
  function csTag(b, text) {
    if (!b || b.querySelector('.cs-tag')) return;
    var t = document.createElement('span');
    t.className = 'cs-tag';
    t.textContent = text;
    b.appendChild(t);
    b.classList.add('has-tag');
    var name = b.getAttribute('aria-label');
    if (name) b.setAttribute('aria-label', name + ' (' + text + ')');
  }
  function csMark(b, grade) {
    b.classList.add('pick-' + grade);
    var m = b.querySelector('.cs-mark');
    if (m) m.innerHTML = '<i class="fa-solid ' + (CS_GLYPH[grade] || CS_GLYPH.bad) + '" aria-hidden="true"></i>';
  }

  // ---- The pre-check items ---------------------------------------------------
  // One knowledge question (5.1) that decides test-out / test-up, and the two
  // 5.3 agreement statements that set the Feel baseline. 5.2 has no pre-check
  // item (ask policy). All three are the LED extract's own items, verbatim:
  // the 5.1 item is its second practice question, so the in-flow check after
  // the chapter (its first) is a different question on the same objective.
  var K1_PRE = {
    obj: 'K1', type: 'mcq',
    stem: 'Which of the following is NOT an appropriate channel for reporting hazing?',
    correct: 0,
    options: [
      { t: 'Posting about it on social media' },
      { t: 'National Anti-Hazing Hotline at 1-888-NOT-HAZE' },
      { t: 'Institution’s anonymous online reporting system' },
      { t: 'Dean of students office' }
    ]
  };
  var F1_STATEMENT = 'Reporting hazing through available channels — including anonymously — is the ' +
    'responsible thing to do, not a betrayal of my peers.';
  var F1B_STATEMENT = 'Reporting hazing helps my organization identify problems and improve its policies ' +
    'and procedures, rather than just dragging me into an investigation I don’t want to be part of.';
  var F1_ITEM = { obj: 'F1', type: 'likert', stem: '“' + F1_STATEMENT + '”' };
  var F1B_ITEM = { obj: 'F1B', type: 'likert', stem: '“' + F1B_STATEMENT + '”' };

  // ---- Routing ---------------------------------------------------------------
  // The structure map's mastery states, per objective:
  //   5.1 correct + test-out on        → no 5.1 chapter at all
  //   5.1 correct + test-out off       → M5-01B (test-up) in place of 01A, no check
  //   otherwise                        → M5-01A and its check; a miss adds 01R
  //   5.2                              → M5-02A, always
  //   5.3 low agreement                → M5-03R in place of 03A
  // The Demo menu can force the knowledge answer (hz-battery) or the
  // agreement (hz-feel); otherwise the pre-check's own record decides.
  // Admin preview (js/preview-embed.js): the assignment's own settings. Off
  // for a learner, where every rule below runs as authored.
  var AP = window.AdminPreview || null;
  function testUpOn() { return !AP || AP.testUp; }
  function testOutOn() { return !AP || AP.testOut; }
  function extraOn() { return !AP || AP.extra; }
  function k1Correct() {
    try { var o = sessionStorage.getItem('hz-battery');
          if (o === 'proven') return true; if (o === 'unproven') return false; } catch (e) {}
    return !!(readCourse().battery || {}).k1up;
  }
  function k1Out() { return testOutOn() && k1Correct(); }
  function k1TestUp() { return !testOutOn() && testUpOn() && k1Correct(); }
  // The two statements' mean, on the 1–5 scale; neutral (3) or below is low.
  function feelScore() {
    try { var o = sessionStorage.getItem('hz-feel'); if (o === 'low') return 2; if (o === 'high') return 5; } catch (e) {}
    var b = readCourse().battery || {}, v = [b.f1, b.f1b].filter(function (x) { return x != null; });
    return v.length ? v.reduce(function (s, x) { return s + x; }, 0) / v.length : null;
  }
  function feelLow() { var s = feelScore(); return s != null && s <= 3; }
  function checkMissed(key) {
    var r = readCourse()[key];
    return !!(r && r.passed === false);
  }

  // ---- The chapters ------------------------------------------------------------
  // One entry per structure-map chapter, per audience. `narration` is the
  // round-2 narration review's text, verbatim (straight quotes and all), one
  // paragraph per P-number. It is what Read shows; Watch plays a placeholder
  // clip until the videos are drawn. `est` is the map's estimated running
  // time. Titles are the map's (marked "to be confirmed" there); where the
  // narration review titles a chapter differently, the comment says so.
  var DECK = {
    athletes: {
      m501a: { title: "Who Should Hear About Last Night", est: "3:00", narration: [
        "It's the morning after the rookie bonding night at the team house. Last night, paramedics took the teammate who was passed out on the bathroom floor to the hospital. Dana, a freshman swimmer, is shaken but okay. Now Dana's roommate wants to know who on campus should hear about what happened.",
        "That question has a real answer. Actually, more than one.",
        "The roommate already used the first one last night. When someone is showing signs of significant distress, like being unconscious, struggling to breathe, or showing signs of alcohol poisoning, you call 911 or campus emergency services immediately. That comes before the hotline, before any form, before anything else.",
        "That's the one case where the order is set. The channels you'll hear next are for reporting when no one needs emergency help right now, or after an emergency has already been handled.",
        "So now that everyone is safe, what are the actual options for reporting what led to that night? There are four.",
        "The National Anti-Hazing Hotline is one of them. The number is 1-888-NOT-HAZE, which is 1-888-668-4293. You can leave an anonymous message describing what happened, or give your information if you want someone to respond to you directly. A representative from the law firm of Manley Burke monitors that hotline, and forwards every message to the right organization, along with the hazing laws for that jurisdiction.",
        "Most institutions also have an anonymous reporting option on their website. That's the second channel, separate from the hotline. And it's the kind of message the sophomore in the group chat was typing last night, the kind that can wait until everyone is safe.",
        "The third is your institution's counseling and health services department. They offer confidential services for hazing concerns. Confidential, which is not the same as anonymous.",
        "And the dean of students office rounds out the four. They can explain the options for addressing what happened.",
        "Now, you might be thinking that if you report this, people will know it was you, and you'll be the one who got the team in trouble. It doesn't have to work that way. The hotline takes anonymous messages, most schools offer anonymous reporting online, and counseling and health services are confidential.",
        "Want to know the actual rules this team is bound by? Your hazing policies live in the student handbook or code of conduct. And if your team is part of a nationally affiliated organization, visit their website and search for hazing. You'll find their hazing policy or resources for members.",
        "So back to that team house, the morning after. The 911 call already happened, and it came first. Now Dana's roommate knows the four places to turn next, and you do too."
      ] },
      m501b: { title: "Who Should Hear About Last Night", est: "TBC", placeholder: true, narration: [
        "Placeholder. This test-up narration is being rewritten (the morning-after story, covered in more depth). It replaces “Who Should Hear About Last Night” for a learner who answered the pre-check’s channel question correctly when skipping ahead is off."
      ] },
      m501r: { title: "Where to Report Without the Team Knowing", est: "4:20", narration: [
        "It's a week after rookie night. Practice just ended, and the pool deck is emptying out. Another freshman catches Dana's roommate by the bleachers. The rookies have been told that what happens at rookie night stays there. So the question comes out quietly: where could someone report this without the team knowing?",
        "That's a fair question. And it has real answers. You have four reporting channels. Each one is built for a different need. We'll go through them slowly, one at a time.",
        "But one call comes before any of them. We'll get to it, because it isn't one of the four.",
        "The first channel is the National Anti-Hazing Hotline. The number is 1-888-NOT-HAZE. In digits, that's 1-888-668-4293. You use it if you or someone you know might be hazed, or has been hazed.",
        "Here's the part that answers the freshman's question. You can leave an anonymous message detailing your concern. Or you can give your personal information if you want a direct response. You choose.",
        "Who hears that message? A representative from the law firm of Manley Burke monitors the hotline. Every message gets forwarded to the appropriate organization. It goes along with the hazing laws from the relevant jurisdiction. So the freshman could call, describe rookie night, and never give a name.",
        "The second channel lives on your school's website. Most institutions have anonymous reporting options there for hazing concerns. Same idea as the hotline's anonymous message. But it's run through your own campus.",
        "Think about the freshman at the bleachers again. That website option is another way to report without saying who you are. Two channels so far. Both let you report anonymously.",
        "The third channel is your institution's counseling and health services department. It can offer confidential services related to hazing concerns. Notice the word there. Confidential. That's a place to talk through what happened, for yourself or a teammate.",
        "The fourth channel is your institution's dean of students office. It can explain your options for addressing hazing. If the freshman isn't sure what reporting would even look like, that office can lay out the options.",
        "So that's the four. The National Anti-Hazing Hotline. Your school's anonymous reporting option online. Counseling and health services. And the dean of students office.",
        "Now, about that worry behind the freshman's question. It's easy to assume reporting means your name gets out. And that the team will freeze you out for it. That's not how these channels are set up. The hotline accepts anonymous messages. Most schools' website options are anonymous too. And counseling and health services are confidential.",
        "You'll also want to know where the written rules live. Your college or university's hazing policies are in the student handbook or the code of conduct. And if your team or organization is nationally affiliated, visit its website. Search for hazing. You'll find its hazing policy or resources for members.",
        "Now, the call that comes first. Sometimes a person shows signs of significant distress. They're unconscious. They're having trouble breathing. They show signs of alcohol poisoning. Then you call 911 or campus emergency services. Immediately.",
        "That call isn't a fifth channel. It takes priority over the hotline, the anonymous options, and every other non-emergency channel. The four channels are for non-emergencies, or for reporting after the fact. A week after rookie night, at practice, nobody's in danger right now. So the four channels fit.",
        "Let's bring it back together. The hotline number is 1-888-NOT-HAZE, or 1-888-668-4293. Your four reporting channels are the hotline, your school's anonymous reporting option, counseling and health services, and the dean of students office. And when someone is in significant distress, 911 or campus emergency services comes before all of them.",
        "So Dana's roommate has an answer for the freshman at the bleachers. Call 1-888-NOT-HAZE and leave an anonymous message. Or use the school's anonymous form online. What happened at rookie night doesn't have to stay there."
      ] },
      m502a: { title: "When Planning Is the Crime", est: "3:50", narration: [
        "The team meeting room is quiet. The athletic director and someone from the compliance office are standing at the front, and everyone knows why. A freshman teammate is in the hospital. The captain who organized rookie night, the one who picked the location and set the rules in the group chat, keeps saying the same thing: he wasn't even there when it happened, so how can this be on him?",
        "Hold that question. It matters more than he thinks.",
        "Hazing isn't just a team problem or a campus problem. It's a legal one. Individuals found guilty of hazing can face criminal consequences, civil consequences, and academic consequences — three separate tracks, not one.",
        "Start with criminal. Most states with antihazing laws treat hazing as a misdemeanor. But a handful of states go further: if hazing causes significant injury or death, it can be charged as a felony. Not every state has an antihazing law at all — but hazing happens in every state regardless.",
        "Now back to the captain's question. He wasn't in the room. Does that let him off?",
        "In at least one state, no. That state holds hazing activity planners responsible for their behavior even if they're not actively involved in the actual act. Setting the rules, picking the time and place, building the plan in a group chat — that can be enough for criminal liability on its own. A teammate pulls up a news story: a planner in another state, charged, even though he never touched anyone. The room goes quiet. That's the captain's situation, almost exactly.",
        "College students can be held accountable for hazing directed at new members or anyone changing status in the group, like freshmen joining the team.",
        "So criminal charges are one track. Civil suits are another — the injured freshman's family could sue separately from any criminal case. And then there's the team itself. Colleges can impose their own consequences on teams, clubs, or groups found responsible for hazing. That can mean forfeiting games. It can mean suspending the organization for a set number of years. And for Greek organizations, colleges have gone as far as completely eliminating Greek life. These are additional consequences — not instead of criminal and civil liability, but on top of it.",
        "Why does any of this carry so much weight now? Hazing has drawn more public attention since the late 1970s, and the reason is grim: hazing deaths are what pushed it into the national spotlight.",
        "There's one more thing the compliance officer brings up, and it's easy to miss. Certain hazing incidents have to show up in the campus's annual security report under the Clery Act, the same way other reportable offenses do. SCHA's requirement for Clery Act annual security reports is built to mirror the reporting structure schools already use for Violence Against Women Act offenses. So a hazing incident reportable under SCHA follows a similar reporting framework to those VAWA-covered offenses — it's not a separate, lesser paperwork trail off to the side.",
        "Back in that meeting room, the captain's defense — I wasn't there — isn't holding up the way he hoped. Planning the event can be enough. The freshman is still in the hospital. The team could be facing forfeited games or a multi-year suspension. And the captain is looking at a possible charge that doesn't require his hands to have touched anyone at all. Not being in the room doesn't mean not being responsible. Legal and Institutional Consequences of Hazing — Greek Life — base Audience: Education › Higher Ed / Greek Life Treatment: Base — the standard version every learner in this audience gets. Where it applies (Chapter house meeting room, after an advisor-called exec board meeting): Jordan is the new-member educator who built the entire new-member week schedule, including a late-night 'line-up' in the chapter basement, but she was off campus at a family event the night it happened and never saw what the new members went through. Now the chapter advisor and the fraternity and sorority life office are asking whether the chapter's charter will survive, whether the injured new member's family will sue, and whether what happened meets the state's threshold for a felony hazing charge. Jordan assumed that because she wasn't in the room she couldn't be the one held responsible, until the advisor explains that planners can face criminal liability on their own. Meanwhile the exec board worries the incident has to go into the campus's annual security report the same way other reportable offenses do. Unchanged since round 1 (no comments). permutation_id 1bbce0fa-5d06-423f-90b9-60963c2f3bf4 revision_id 3f15335f-e477-4513-9f70-3a0f5edf3f84 lo_id / lo_version_id 2998facd-ce42-4598-80bb-c4b1f8f4c989 / d09d46f8-df0f-46cc-aa83-fed5c7cafcd3 replaces (round 1) - status at 2026-10-20 at storyboard review narration passes 1"
      ] },
      m503a: { title: "Reporting Isn’t Snitching", est: "2:56", narration: [
        "You're standing in the team house, and you already know what's happening tomorrow night. The captains have planned a rookie initiation — freshmen chugging mystery mixes until someone throws up.",
        "You did this last year, back when you were Dana's roommate. You remember how it felt. And you know one freshman on the roster has a heart condition he never talks about.",
        "You want to tell the athletic trainer, or compliance. But something's holding you back. It's easy to assume reporting makes you a snitch, that it betrays the team. It doesn't.",
        "Hazing causes real and lasting harm — it can be deadly. Telling someone protects your teammates. That's not betrayal. That's what caring about the people in your locker room actually looks like.",
        "Here's another fear running through your head: if you report, you'll be exposed, and the group chat will come for you. But you don't have to put your name on it.",
        "The National Anti-Hazing Hotline takes anonymous messages. And most schools have an anonymous online reporting option too, so check whether yours does. You don't need to reveal your identity to report.",
        "And there's another worry, maybe the biggest one: that reporting means getting pulled into some long investigation, missing the bus for your next meet. That's not how this works.",
        "Using the hotline, reporting anonymously online, or talking to a counselor doesn't drag you into a formal process. Institutions use these reports to catch safety problems and act on them — not to put the person who spoke up through the wringer.",
        "One more thing worth knowing: reporting isn't a dead end. When a team or an organization gets this kind of information, it helps them see where their policies and procedures are falling short. That's how programs actually change — fewer freshmen pushed into the same situation you were in last year.",
        "Think about what's really being asked of a new member here. Making the team should never require getting hurt. Watch for any initiation designed to humiliate, degrade, abuse, or endanger someone — especially with alcohol involved.",
        "No rookie initiation, no bonding tradition, should put someone's health on the line, especially not for a freshman whose heart condition you already know about.",
        "You get to choose what kind of teammate you are tonight. Keeping your squad safe means not promoting or taking part in dangerous, illegal hazing, and not staying quiet about it either.",
        "So pick up your phone. Reach out to the National Anti-Hazing Hotline, or file that anonymous report through your institution's system — before the mystery mixes get poured, not after someone ends up in the back of an ambulance."
      ] },
      m503r: { title: "Speaking Up Without Your Name on It", est: "5:24", narration: [
        "You're standing in the team house the night before the captains' planned rookie initiation. You already know what's coming, because it happened to you last year. A year ago, you and your roommate Dana were the freshmen, and you were made to chug mystery mixes until someone threw up.",
        "This year, one of the freshmen has a heart condition he never talks about. You know it. Nobody else on the team does.",
        "So what do you do with that? Three fears stand between you and saying something. Let's take them one at a time.",
        "The first fear is the loudest. Telling the athletic trainer or the compliance office feels like turning on your own team. That feeling is real, but the idea behind it is wrong.",
        "Hazing causes real and lasting harm, and it can be deadly. Think about who gets protected by your silence. It isn't the freshman with the heart condition. It's the night itself.",
        "Reporting it protects your peers. That's not betrayal. That's what caring about your teammates actually looks like, especially the freshman nobody but you is thinking about tonight.",
        "The second fear comes right behind it. If you report, won't the team chat figure out it was you, and freeze you out before you even get to the meet? You don't have to put your name on it.",
        "The National Anti-Hazing Hotline takes anonymous messages. Most schools also have anonymous online reporting. You don't need to reveal your identity to report. And an anonymous report isn't a lesser one. It's still you looking out for a teammate.",
        "There's a third fear, and it might be the biggest. You picture getting pulled into some long investigation and losing your spot on the bus for the next meet. Hold that picture up against what's actually true.",
        "Reporting through the hotline, through anonymous online reporting, or through confidential counseling doesn't require you to join a formal investigation. Institutions use reports to protect students and address safety concerns. They don't use them to drag the person who reported into a drawn-out process.",
        "And maybe there's a quieter thought under all three. That none of it matters, because the captains will plan the next rookie night no matter what you say. That one's wrong too.",
        "Reporting helps organizations find the gaps in their policies and procedures and improve them. That cuts the chance that next year's freshmen are harmed the same way. Silence does the opposite. It hands the night down, unchanged.",
        "Membership on this team was never supposed to require getting hurt. Part of keeping yourself and your classmates safe is choosing not to promote or take part in dangerous, illegal hazing behaviors. That means not planning them, not cheering them on, and not filming them for the group chat.",
        "And whenever you size up a club, a group, or a team you might join, the same awareness applies. Watch for initiation rituals designed to humiliate, degrade, abuse, or endanger someone's well-being, especially ones involving alcohol. Report those activities through the proper channels.",
        "So before the initiation starts tonight, you pick up your phone in the team house and report it anonymously, through your school's anonymous online reporting. You give that freshman a chance to stay out of a night nobody should go through to make a roster.",
        "Now a second night, later in the season, on the same team. It's after lift, and a video lands in the team chat. The captains ran the freshmen through a late punishment workout, no coaches there, until one of them was bent over a trash can.",
        "You don't need anyone to tell you what that is. The real question is what you do next. And this time, you can see both roads clearly.",
        "If you stay quiet, the video gets a few laughing emojis and scrolls away. The freshmen learn that this is how you earn your spot. Next fall, some of them could be the ones running it, because nobody ever said it wasn't normal.",
        "If you report, you break that chain at the one link you control. You're not betraying the vets. You're refusing to let a teammate's harm become a tradition.",
        "You also remember what your report from the rookie night did and didn't ask of you. You didn't sign anything. Nobody called you into an office. You still had your seat on the bus.",
        "So you set your phone face down for a second, then pick it back up. You open the National Anti-Hazing Hotline and send an anonymous message about the workout in the video. Then you mute the chat.",
        "Two nights, one team, the same fears each time. Reporting isn't betrayal, it doesn't have to cost you your name or your season, and it can change what gets handed down.",
        "Last year, nobody spoke up for you and Dana. This year, someone did. It was you."
      ] }
    },
    greek: {
      m501a: { title: "Who to Call When Hazing Happens", est: "3:48", narration: [
        "Priya's been quiet all through dinner. Shaky, even. Maya's noticed. Meanwhile, in the group chat, the sophomores are already planning the next late-night lineup. Maya doesn't want to blow things up or get Priya labeled a snitch. But she also doesn't want to just wait and hope Priya feels better tomorrow. So what does she actually do with her phone right now?",
        "Start with the question that decides everything else: is Priya in danger right now? If someone is unconscious, having trouble breathing, or showing signs of alcohol poisoning, none of the other options come first. You call 911 or campus emergency services immediately. That's not one choice among several — it's the one that overrides every other channel the moment someone is in that kind of distress.",
        "But say Priya's shaken, not in medical danger. She just won't talk about last night. That's not a 911 moment. That's a reporting moment. And there are four channels for exactly this. The hotline, anonymous reporting, counseling and health services, and the dean of students office are all for non-emergency or after-the-fact concerns. None of them replaces calling 911 when someone is in distress.",
        "The first is the National Anti-Hazing Hotline. The number is 1-888-NOT-HAZE — that's 1-888-668-4293. You can leave an anonymous message describing what you saw, or give your name if you want a direct response. A representative from the law firm Manley Burke monitors that hotline. They forward every message to the right organization, along with the hazing laws for that jurisdiction.",
        "The second is anonymous reporting through the institution itself. Most schools have an anonymous reporting option built right into their website for exactly this kind of concern.",
        "The third is counseling and health services. If Priya — or Maya, for that matter — needs to talk to someone confidentially, that department offers confidential services around hazing concerns.",
        "The fourth is the dean of students office. They can explain the actual options available for addressing what happened.",
        "Here's where it's easy to get stuck, and it's worth naming directly: the fear that reporting means getting exposed. It feels like the second you say something, everyone will know it was you, and you'll be the one who ratted out the chapter. But that's not how these channels work. The hotline takes anonymous messages. The website's reporting option is anonymous too. And counseling and health services are confidential. Maya can use any of these without her name ending up in the group chat.",
        "There's one more place worth knowing about, separate from who to call: where the actual policies live. The school's hazing policies are in the student handbook or code of conduct. And if the sorority is nationally affiliated, Maya can visit the national organization's website and search for hazing to find its hazing policy and resources for members.",
        "So back to Maya, phone in hand. Priya isn't unconscious, isn't struggling to breathe — this isn't a 911 situation. But she's clearly not okay, and she won't say why. Maya doesn't have to confront the group chat and she doesn't have to guess. She can leave a message on the hotline, or use the anonymous form on the school's site. She could just as easily reach out to counseling and health services, or the dean of students office. That's not snitching. That's just picking up the phone and letting someone who actually handles this take it from there."
      ] },
      m501b: { title: "What Each Channel Offers", est: "3:34", placeholder: true, narration: [
        "Placeholder. This test-up narration (3:34 in the structure map) isn’t in the narration review yet. It covers the same dinner as the base chapter, in more depth, and replaces “Who to Call When Hazing Happens” for a learner who answered the pre-check’s channel question correctly when skipping ahead is off."
      ] },
      // Narration review title: "Where to Report Hazing"
      m501r: { title: "Somewhere to Talk Without the Chapter Knowing", est: "4:04", narration: [
        "Two days after that dinner, Priya finds Maya alone in the chapter house kitchen. Her question is quiet. Where could she talk to someone without the chapter finding out?",
        "That's a real question, and it has real answers. Before any of them, there's one call that comes first. We'll get to the channels Priya's asking about. But this call sits apart from all of them.",
        "If anyone is showing signs of significant distress, call 911 or campus emergency services immediately. That means someone unconscious, someone with difficulty breathing, or someone showing signs of alcohol poisoning. That call takes priority over everything else.",
        "Priya's standing in the kitchen, talking. Nobody's in that kind of danger right now. So this isn't the 911 moment. It's a reporting moment.",
        "For a reporting moment, there are four channels. Let's take them slowly, one at a time.",
        "The channel that answers Priya's question most directly is counseling and health services. Your institution's counseling and health services department can offer confidential services related to hazing concerns. Confidential. That's the word Priya needs.",
        "So Maya can tell her plainly. If she wants to talk about what happened at the house, counseling and health services is a confidential place to do it. Nothing has to go through the group chat.",
        "Now, the fear behind Priya's question is a common one. It's easy to believe that reporting means your identity gets exposed, and social consequences follow. It doesn't have to. The National Anti-Hazing Hotline accepts anonymous messages. Most institutions also have anonymous reporting options on their websites. And counseling and health services offers confidential services.",
        "That settles the fear. Now the other three channels, each with its own job.",
        "The National Anti-Hazing Hotline is for when you or someone you know might be hazed or has been hazed. The number is 1-888-NOT-HAZE. That's 1-888-668-4293. You can leave an anonymous message detailing your concern, or give your personal information for a direct response.",
        "Who hears that message? A representative from the law firm of Manley Burke monitors the hotline. They forward every message to the appropriate organization, along with the hazing laws from the relevant jurisdiction.",
        "The next channel lives on your school's own website. Most institutions have anonymous reporting options there for hazing concerns. Maya could pull it up on her phone right there in the kitchen.",
        "The last of the four is the dean of students office. Your institution's dean of students office can explain options for addressing hazing. If Priya isn't sure what she even wants to happen, that office can lay out the options.",
        "Two more resources help you understand the rules themselves. Your college or university hazing policies are located in the student handbook or code of conduct. And if your chapter is nationally affiliated, visit the national organization's website and search for hazing. You'll find their hazing policy or resources for membership.",
        "So what does Maya actually tell Priya? Nobody's unconscious or struggling to breathe, so no 911 call tonight. For a place to talk without the chapter finding out, Maya points her to counseling and health services, where the services are confidential. And if Priya wants to report what happened, Maya reminds her of the hotline and the school's anonymous reporting page.",
        "Here's what to hold onto. Significant distress means 911 or campus emergency services, before anything else. Otherwise, you have four channels. The National Anti-Hazing Hotline, at 1-888-NOT-HAZE, or 1-888-668-4293. Your institution's anonymous reporting on its website. Counseling and health services, for confidential help. And the dean of students office, to explain your options.",
        "Priya asked where she could talk without the chapter finding out. Now you know exactly where to send her."
      ] },
      m502a: { title: "When Planning Counts as Hazing", est: "4:05", narration: [
        "Jordan built the whole new-member week schedule herself, including a late-night line-up in the chapter basement. She wasn't even there when it happened. She was off campus at a family event. So when the chapter advisor calls an exec board meeting and the fraternity and sorority life office joins in, Jordan assumes she's in the clear. She didn't touch anyone. She wasn't in the room. Here's where that assumption breaks.",
        "At least one state holds hazing activity planners responsible for their behavior even if they weren't actively involved in the act itself. Planning the event can be enough on its own. Jordan designed the night, set the location, set the expectations. That's planning. In that kind of state, criminal liability doesn't require her presence.",
        "Now back up to what's actually on the table here, because consequences come in more than one form. Someone found guilty of hazing can face criminal, civil, and academic consequences — three separate tracks, not one. Criminal law might charge the people involved. A civil suit could come from the injured new member's family, separately. And the chapter and its members can face academic or institutional consequences on top of both.",
        "It's easy to assume hazing is just a campus conduct issue — something the fraternity and sorority life office handles internally and nothing more. It isn't. Hazing is prosecutable under criminal law in most states. Whether it's a misdemeanor or a felony depends on the state, and on what happened.",
        "Most states with antihazing laws classify hazing as a misdemeanor. But a handful of states classify it as a felony when there's significant injury or death. One new member is hurt badly enough to need real medical attention. That's exactly the kind of injury that pushes a case toward that felony threshold in the states that recognize one. Not every state has an antihazing law at all — but hazing happens in every state regardless.",
        "There's also the chapter itself to think about. Colleges can impose consequences on teams, clubs, or groups found responsible for hazing. That can mean forfeiting games, suspending an organization for a set number of years, or — in the broadest cases — eliminating Greek life entirely. The chapter president and the exec board aren't just worried about Jordan. They're worried about the charter.",
        "And there's a reporting piece sitting underneath all of this. SCHA's institutional reporting requirement for Clery Act annual security reports is designed to mirror the reporting structure used for Violence Against Women Act offenses. Hazing incidents reportable under SCHA follow a similar framework to how VAWA-covered offenses get reported. That's why the exec board isn't just asking what happens to Jordan — they're asking whether this incident has to show up in the campus's annual security report, the same way other reportable offenses do.",
        "None of this is new, exactly. Hazing has drawn more public and national attention since the late nineteen-seventies — tragically, because of hazing deaths. The attention came from real harm, not from paperwork.",
        "So where does that leave Jordan? She built the schedule. She set the line-up in motion. She wasn't in the basement that night, but in a state that holds planners accountable on their own, that doesn't matter. The advisor lays it out plainly: criminal liability can attach to the planning itself, civil liability can come from the family's suit, and the chapter's charter is a separate question entirely from either one. Jordan sits with that. She stops treating her absence that night as an alibi, and starts answering the advisor's questions about exactly what she planned, and when — because that's the account the office, and possibly the courts, are going to want."
      ] },
      m503a: { title: "Reporting Hazing Isn’t Betrayal", est: "3:00", narration: [
        "You're standing in the kitchen of the chapter house during new-member week, and your little is being made to drink shot after shot while reciting chapter history, and she's shaking, and now she's throwing up — and someone's filming it for the group chat. Your gut says tell someone. Your gut also says if you do, your sisters will call you a snitch and freeze you out before initiation. That second feeling is the one worth questioning.",
        "Here's what's actually true: hazing causes real and lasting harm, and it can be deadly. Reporting it protects your little and the other new members — that's not betrayal, that's exactly what caring about your sisters looks like. And whatever you decide about reporting, you can choose right now not to be part of it — don't pour, don't film, don't push.",
        "So if reporting isn't the problem, what's stopping you? Probably the fear of being exposed. But you don't have to be. There are anonymous options built for exactly this moment.",
        "The National Anti-Hazing Hotline accepts anonymous messages. Most campuses also have an anonymous online reporting option. You do not need to reveal who you are to report what you saw.",
        "Maybe you're also picturing something bigger — a hearing, a formal investigation, your name in a file, weeks of being pulled into something you didn't ask for. That isn't required. Reporting through the hotline, an anonymous online form, or confidential counseling doesn't drag you into a formal investigation. The campus uses reports to keep students safe, not to put the reporter through a process.",
        "One more thing worth knowing: this isn't a report that disappears into nothing. Reports help chapters and the campus spot gaps and improve their policies and procedures, which lowers the chance the next new-member class gets hurt the same way.",
        "This matters beyond tonight, too. Before you ever join a group, watch for dangerous, illegal rituals built to humiliate, degrade, abuse, or endanger someone — especially ones built around alcohol, like the one happening right now in this kitchen. Those are signs to report through the proper channels, not traditions to accept.",
        "So picture it again. Your little, pale, sick, phone cameras up around her. The exec board calls this tradition. It isn't. Membership in your chapter was never supposed to require being injured.",
        "You pull out your phone — not for the group chat, but to open the hotline's anonymous reporting page. You type what you saw. No name attached. You hit send.",
        "That's the whole act. You didn't betray your sisters. You looked out for the one who needed it most, and you gave the people responsible what they need to help make next year safer."
      ] },
      m503r: { title: "What Loyalty Actually Looks Like", est: "5:35", narration: [
        "You're Maya, and it's the morning after a new-member event. You open the chapter group chat. There's a video of your little being made to down drinks and recite chapter history while sisters laugh.",
        "Last year you were the new member. This fall she's your little. She's fine, but she's embarrassed, and she won't talk about it.",
        "You want to tell someone. Maybe the chapter advisor. Maybe the campus fraternity and sorority life office. But one word stops you. Snitch.",
        "You're afraid your sisters will freeze you out. And you've heard there's an anonymous hotline. So does using it still count as betraying your chapter?",
        "Hold that question. We'll answer it, and then we'll watch it play out at a chapter meeting later that fall.",
        "Start with what's in that video. Hazing causes real and lasting harm. It can be deadly. And it shows up in initiation rituals designed to humiliate, degrade, abuse, or endanger well-being. The ones involving alcohol deserve special attention.",
        "Look at what the night was built from. She's made to drink. She's made to keep reciting. And she's filmed so the whole group chat can watch. Each piece humiliates her, and the alcohol puts her well-being at risk.",
        "So here's the standard. Membership into any club, organization, or team should not require being injured or harmed. Not a chapter. Not anyone.",
        "Think about your little. Her embarrassment was never part of what membership should cost her. And her silence doesn't mean it didn't happen.",
        "That changes the snitching question. Calling a report betrayal assumes the thing you'd be exposing is worth protecting. But what's really being protected is the harm. Reporting through available channels protects your peers.",
        "It's consistent with genuine care for the people in your community. That includes your little. It includes the sisters who laughed, too, because hazing puts them at risk as well. Loyalty means wanting your sisters safe, not keeping their secrets.",
        "Now the fear underneath. Being exposed.",
        "You don't need to reveal your identity to report. Multiple anonymous options exist. The National Anti-Hazing Hotline accepts anonymous messages. And most institutions have anonymous online reporting.",
        "So the sisters in that video don't have to learn your name from your report. You can protect your little without putting yourself in front of the room.",
        "That's one fear handled. There's a second one people rarely say out loud.",
        "You might worry that reporting drags you into a big investigation you never asked for. It doesn't have to. Reporting through the hotline, anonymous online reporting, or confidential counseling does not require you to participate in a formal investigation.",
        "Institutions use reports to protect students and address safety concerns. They don't use them to force you into a drawn-out process. Put simply, you can say what you saw without signing up for more.",
        "Which leaves one last doubt. Will it even change anything?",
        "It can. Reporting hazing helps organizations identify gaps and improve their policies and procedures. That reduces the chance that future members are harmed the same way. Your report isn't just about one night.",
        "So picture that chapter meeting at the house, later in the fall. The new-member educator lays out a plan for a scavenger hunt. Any new member who misses an item takes a drink at each stop. Someone says it's tradition. Someone else says everyone did it.",
        "Notice where that plan came from. Nobody spoke up about the last event. So the same habit is back on the plan, aimed at the next new members. That's what silence leads to. Nothing breaks the pattern, so it repeats.",
        "Now run it the other way. A report about the video gives the institution and the chapter something to work with. It points to a gap. Why is forced drinking still part of new-member events? Fixing that can protect new members you'll never meet.",
        "And in that meeting, you still have a choice. Keep yourself and your sisters safe by not promoting and not participating in dangerous, illegal hazing behaviors. You can decline to help run the hunt. Every sister who declines is one fewer person promoting it.",
        "You don't have to stand up and call anyone out. You can file an anonymous online report that night. Or send an anonymous message to the National Anti-Hazing Hotline. Either way, your name stays off it.",
        "Notice, too, who you're loyal to. The new members on that hunt are your sisters too. Staying silent is what would let them down.",
        "Back to that morning. The video is still in the group chat. Your little still won't talk about it. And you're holding your phone.",
        "So does reporting anonymously count as betraying your chapter? No. It's the responsible thing to do. It protects your little, it keeps your name out, it doesn't sign you up for a process you never wanted, and it gives the chapter a chance to do better.",
        "So you open the National Anti-Hazing Hotline, leave your name off, and type what you saw. That's what loyalty actually looks like."
      ] }
    }
  };
  // The question each chapter ends on, the same for both audiences (the LED
  // extract's items are audience-neutral). One per screen, as in Sharps; the
  // extract's other items (5.1's second, 5.2's other three) aren't asked yet.
  // No feedback lines: the extract has none, so a verdict shows on its own.
  var CHECKS = {
    m501a: { kind: 'mcq', key: 'k1check', variant: 'base',
      stem: 'What is the phone number for the National Anti-Hazing Hotline?',
      correct: 0,
      options: [
        { t: '1-888-NOT-HAZE (1-888-668-4293)' },
        { t: '1-800-CAMPUS-SAFE' },
        { t: '9-1-1' },
        { t: 'There is no national hotline.' }
      ] },
    m502a: { kind: 'mcq', key: 'k2check', variant: 'base',
      stem: 'A student planned a fraternity hazing event but was not present when a pledge was seriously injured. Can the student face criminal charges?',
      correct: 1,
      options: [
        { t: 'No — criminal liability requires direct physical involvement.' },
        { t: 'Yes — at least one state holds hazing planners criminally responsible even without direct involvement.' },
        { t: 'Only if the injured person files a civil suit.' },
        { t: 'Only if the state classifies hazing as a felony.' }
      ] },
    m503a: { kind: 'likert', key: 'f1post', stem: '“' + F1_STATEMENT + '”' },
    m503r: { kind: 'likert', key: 'f1post', stem: '“' + F1_STATEMENT + '”' }
  };
  // The remedial chapter re-asks the check that was missed, once, under its
  // own key so the first answer is kept.
  var RECHECK = {
    m501r: { of: 'k1check', key: 'k1recheck', base: 'm501a', up: 'm501a' }
  };
  function deckHas(id) { return !!DECK.athletes[id]; }
  // This audience's version of a screen, with its question.
  function deckFor(id) {
    var base = DECK[lensKey()][id], d = {}, k;
    for (k in base) d[k] = base[k];
    if (CHECKS[id]) d.check = CHECKS[id];
    if (RECHECK[id]) d.recheck = RECHECK[id];
    return d;
  }
  function articleFor(id) { return deckFor(id).narration || []; }

  // Read steps through the text a run of paragraphs at a time, gathered
  // until a step holds at least READ_STEP_MIN characters, so a one-line
  // paragraph rides along with what's around it instead of being its own
  // two-second step. A short leftover at the end joins the step before it.
  var READ_STEP_MIN = 240;
  function readSteps(items, len) {
    var steps = [], cur = [], n = 0;
    items.forEach(function (l) {
      cur.push(l); n += len(l);
      if (n >= READ_STEP_MIN) { steps.push(cur); cur = []; n = 0; }
    });
    if (cur.length) {
      if (steps.length && n < READ_STEP_MIN / 2) steps[steps.length - 1] = steps[steps.length - 1].concat(cur);
      else steps.push(cur);
    }
    return steps;
  }

  // ---- The screen ------------------------------------------------------------
  // One template for every chapter above. Every id is fixed — only one
  // step is ever mounted at a time — so the template needs no per-screen
  // prefixes.
  var DK_IDS = { wrap: 'dkMedia', video: 'dkVideo', note: 'dkVfall', pct: 'dkPct', skip: 'dkSkip' };

  // A remedial screen re-asks whichever version's question was missed (base
  // or test-up), saved under its own key so the first answer is kept.
  function deckCheck(d) {
    if (!d.recheck) return d.check;
    var r = d.recheck, missed = readCourse()[r.of] || {};
    var src = deckFor(missed.variant === 'up' ? r.up : r.base).check, q = {};
    for (var k in src) q[k] = src[k];
    q.key = r.key;
    return q;
  }
  // The question card. The outer node is the reinforcement layer itself,
  // stretched over the stage; the card inside it is what reads as the ask.
  function deckCheckHtml(q) {
    return '<div class="dk-check" id="dkCheck" hidden><div class="dk-card">' +
      (q.label ? '<p class="ll-eyebrow">' + esc(q.label) + '</p>' : '') +
      '<h2 class="cs-q cs-q--lead">' + esc(q.stem) + '</h2>' +
      (q.kind === 'likert'
        ? likertHtml(true)
        : mcqHtml(q.options, true)) +
      '<button class="bl-check dk-submit" id="dkSubmit" type="button" disabled>' +
        (q.kind === 'mcq' ? 'Check answer' : 'Submit answer') + '</button>' +
      '<p class="dk-fb" id="dkFb" role="status" hidden></p>' +
    '</div></div>';
  }

  // ---- THE STAGE (2026-09-22) ------------------------------------------------
  // Video is the most immersive carrier, so it gets the room: a 16:9 stage
  // sized to whatever fits between the header and the footer. Read plays on
  // the SAME stage — one frame, one title row above it, and one progress rail
  // along its bottom edge (clip time, or reading position).
  //
  //  Read   — an immersive reader: large type, one paragraph in focus at a
  //           time with the rest dimmed, text size, and paragraph stepping.
  //
  // ONE CARRIER PER RUN (2026-10-27). The learner picks Watching, Listening
  // or Reading once, on "How do you prefer to learn?" after the pre-check,
  // and every screen after it is that format. The per-screen Watch / Read /
  // Read to me switch is gone, and with it the per-screen narration ("Read
  // to me") — Listening is the whole-module Listen mode, not a screen's
  // audio. Listen mode only reaches these screens for a remedial version,
  // which plays as Watch (the episode is the base content only, 2026-09-25).
  //
  // The question rises over the stage itself when the carrier finishes; the
  // held content blurs behind it (the reinforcement layer).
  function deckCarrier() {
    return !podcastPath() && modalityId() === 'article' ? 'article' : 'video';
  }
  function mmss(t) {
    t = Math.max(0, Math.round(t || 0));
    return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2);
  }
  function readSize() {
    try { var v = +sessionStorage.getItem('hz-read-size'); if (v >= 0 && v <= 3) return v; } catch (e) {}
    return 1;
  }

  // The Listen waveform: the track's real loudness (30 Hz envelope, base-36)
  // scrolling right-to-left past a fixed playhead — what has been said is
  // lit, what is coming is dim. Shared by the per-screen Listen carrier and
  // the podcast path's continuous episode, so the two can't drift apart.
  var WAVE_HZ = 30, WAVE_BAR = 4, WAVE_GAP = 3;   // CSS px per bar and gap
  function drawEnvelope(canvas, g, env, t) {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    // Re-fit whenever the box changed (the caption rows settle after the
    // first frame, and the window can resize) — a stale bitmap stretches
    // and leaves ghost bars.
    var dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    g.clearRect(0, 0, w, h);
    var cs = getComputedStyle(document.documentElement);
    function tok(name, fb) { return (cs.getPropertyValue(name) || fb).trim(); }
    var mid = h / 2, cx = w / 2, pitch = WAVE_BAR + WAVE_GAP;
    var pos = t * WAVE_HZ;                    // playhead, in samples
    var first = Math.floor(pos - cx / pitch) - 1, last = Math.ceil(pos + cx / pitch) + 1;
    var lit = tok('--ll-teal', '#2ee6cf'), dim = 'rgba(' + tok('--ll-surface-rgb', '255,255,255') + ',.16)';
    for (var i = first; i <= last; i++) {
      if (i < 0 || i >= env.length) continue;
      var v = parseInt(env.charAt(i), 36) / 35;
      var bh = Math.max(3, v * (h * .92));
      var x = cx + (i - pos) * pitch - WAVE_BAR / 2;
      g.fillStyle = i <= pos ? lit : dim;
      g.globalAlpha = i <= pos ? .35 + .65 * (1 - Math.min(1, (pos - i) / (cx / pitch))) : 1;
      var r = WAVE_BAR / 2, y = mid - bh / 2;
      g.beginPath();
      if (g.roundRect) g.roundRect(x, y, WAVE_BAR, bh, r); else g.rect(x, y, WAVE_BAR, bh);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  function deckContent(id) {
    return function () {
      var d = deckFor(id);
      var q = deckCheck(d);
      var m = deckCarrier();
      return '<main class="ll-object dk-object"><div class="dk-theater">' +
        '<header class="dk-head">' +
          '<div class="dk-head-t">' +
            '<h1 class="dk-title">' + esc(d.title) + '</h1>' +
          '</div>' +
        '</header>' +

        '<div class="dk-stagewrap">' +
          '<div class="dk-stage" id="dkStage" data-mode="' + m + '">' +

            // Watch
            (m === 'video'
              ? '<section class="dk-layer dk-layer--video" id="dkVideoWrap" aria-label="Video">' +
                  videoFrame({ ids: DK_IDS, src: deckVideo(id), poster: videoPoster('', d.title, '') }) +
                '</section>'
              : '') +

            // Read
            (m !== 'article' ? '' :
            '<section class="dk-layer dk-layer--read" id="dkRead" aria-label="Reading view" data-size="' + readSize() + '">' +
              '<div class="dk-read-scroll" id="dkReadScroll"><article class="dk-read-col">' +
                // The chapter's narration. A reading step is a run of
                // paragraphs, never one short line (readSteps). Every step
                // gets a fixed-height slot for the button, so moving it
                // between steps never shifts the text.
                readSteps(articleFor(id), function (t) { return t.length; }).map(function (grp) {
                  return grp.map(function (t) { return '<p class="dk-ppar">' + esc(t) + '</p>'; }).join('');
                }).map(function (html, i) {
                  return '<div class="dk-para dk-step" data-i="' + i + '">' + html + '</div><div class="dk-slot"></div>';
                }).join('') +
              '</article></div>' +
              '<div class="dk-tools" role="toolbar" aria-label="Reading controls">' +
                '<button class="dk-tool" type="button" id="dkParaPrev" aria-label="Previous paragraph"><i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button>' +
                '<span class="dk-tool-n" id="dkParaN" aria-live="polite"></span>' +
                '<button class="dk-tool" type="button" id="dkParaNext" aria-label="Next paragraph"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
                '<span class="dk-tool-sep" aria-hidden="true"></span>' +
                '<button class="dk-tool" type="button" id="dkSizeDown" aria-label="Smaller text"><span class="dk-a sm">A</span></button>' +
                '<button class="dk-tool" type="button" id="dkSizeUp" aria-label="Larger text"><span class="dk-a lg">A</span></button>' +
              '</div>' +
            '</section>') +

            // The rail every carrier drives.
            '<div class="dk-rail" aria-hidden="true"><span class="dk-rail-fill" id="dkRail"></span></div>' +
          '</div>' +
          (q ? deckCheckHtml(q) : '') +
        '</div>' +
      '</div></main>';
    };
  }

  function deckInit(id) {
    return function (ctx) {
      var d = deckFor(id);
      var q = deckCheck(d);
      var stage = document.getElementById('dkStage');
      var rail = document.getElementById('dkRail');
      var video = document.getElementById(DK_IDS.video);
      var showing = stage.dataset.mode, handed = false;
      ctx.setCoachSay('');
      ctx.floatClose();

      function setRail(f) { rail.style.transform = 'scaleX(' + Math.max(0, Math.min(1, f || 0)) + ')'; }

      // ---- Read: the immersive reader --------------------------------------
      var read = (function () {
        var box = document.getElementById('dkRead');
        if (!box) return { enter: function () {}, sync: function () {} };
        var scroller = document.getElementById('dkReadScroll');
        var paras = [].slice.call(box.querySelectorAll('.dk-para'));
        var nEl = document.getElementById('dkParaN');
        var at = 0;
        // The way forward, in flow: one button that follows the paragraph in
        // focus. "Next" steps on; on the last paragraph it is the same "Done
        // reading" (the only one — the footer doesn't offer it), and once the question has been handed
        // over it has nothing left to do and goes away.
        var next = document.createElement('button');
        next.type = 'button';
        next.className = 'dk-next';
        next.addEventListener('click', function () {
          if (at < paras.length - 1) { focus(at + 1, true); next.focus({ preventScroll: true }); }
          else if (!handed) finished();
        });
        function placeNext() {
          var last = at === paras.length - 1;
          next.hidden = last && handed;
          next.innerHTML = last
            ? '<i class="fa-solid fa-check" aria-hidden="true"></i><span>Done reading</span>'
            : '<span>Next</span><i class="fa-solid fa-arrow-down" aria-hidden="true"></i>';
          var slot = paras[at].nextElementSibling;
          if (next.parentNode !== slot) {
            slot.appendChild(next);
            // Re-run the entrance so the move reads as the control following along.
            next.style.animation = 'none'; void next.offsetWidth; next.style.animation = '';
          }
        }
        // Which paragraph is lit, and everything that follows from it — the
        // button, the count, the arrows, the rail. No scrolling here, so the
        // scroll handler below can call it too.
        function light(i) {
          at = Math.max(0, Math.min(paras.length - 1, i));
          paras.forEach(function (p, j) { p.classList.toggle('is-on', j === at); p.classList.toggle('is-past', j < at); });
          placeNext();
          nEl.textContent = (at + 1) + ' / ' + paras.length;
          document.getElementById('dkParaPrev').disabled = at === 0;
          document.getElementById('dkParaNext').disabled = at === paras.length - 1;
          setRail((at + 1) / paras.length);
        }
        // Light a paragraph and bring it (with its button) to the middle.
        var auto = false, autoT = 0;
        function focus(i, smooth) {
          light(i);
          var p = paras[at];
          var slot = p.nextElementSibling;
          var h = slot.offsetTop + slot.offsetHeight - p.offsetTop;
          var top = Math.max(0, p.offsetTop - (scroller.clientHeight - h) / 2);
          // Our own scroll must not be read back as the learner's (see below).
          if (smooth && Math.abs(scroller.scrollTop - top) > 1) {
            auto = true;
            clearTimeout(autoT);
            autoT = setTimeout(function () { auto = false; }, 700);
          }
          scroller.scrollTo({ top: top, behavior: smooth ? 'smooth' : 'auto' });
        }
        scroller.addEventListener('scrollend', function () { auto = false; clearTimeout(autoT); });
        // Scrolling IS reading. The text used to scroll freely while the lit
        // paragraph stayed put, so a learner could scroll it (and its button)
        // out of view and be left in all-dimmed text with no way on. Now the
        // paragraph at the reading line is the lit one, and the button follows.
        // "Reading line" = the last paragraph whose top has passed ~45% of the
        // view; moving the button shifts later text in the direction that
        // keeps the choice stable, so there's no flicker at a boundary. The
        // ends are pinned so the first and last paragraphs are always reachable
        // (the last one carries "Done reading").
        scroller.addEventListener('scroll', function () {
          if (auto) return;
          var y = scroller.scrollTop, max = scroller.scrollHeight - scroller.clientHeight;
          var pick;
          if (y >= max - 2) pick = paras.length - 1;
          else if (y <= 2) pick = 0;
          else {
            var line = y + scroller.clientHeight * 0.45;
            pick = 0;
            paras.forEach(function (p, j) { if (p.offsetTop <= line) pick = j; });
          }
          if (pick !== at) light(pick);
        }, { passive: true });
        paras.forEach(function (p, j) { p.addEventListener('click', function () { focus(j, true); }); });
        document.getElementById('dkParaPrev').addEventListener('click', function () { focus(at - 1, true); });
        document.getElementById('dkParaNext').addEventListener('click', function () { focus(at + 1, true); });
        function size(delta) {
          var v = Math.max(0, Math.min(3, (+box.dataset.size || 0) + delta));
          box.dataset.size = v;
          try { sessionStorage.setItem('hz-read-size', v); } catch (e) {}
          document.getElementById('dkSizeDown').disabled = v === 0;
          document.getElementById('dkSizeUp').disabled = v === 3;
          requestAnimationFrame(function () { focus(at, false); });
        }
        document.getElementById('dkSizeDown').addEventListener('click', function () { size(-1); });
        document.getElementById('dkSizeUp').addEventListener('click', function () { size(1); });
        // Arrow keys step paragraphs while the reader is showing and focus is
        // not in a control that owns them.
        box.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); focus(at + 1, true); }
          if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); focus(at - 1, true); }
        });
        size(0);
        return {
          enter: function () { requestAnimationFrame(function () { focus(at, false); }); },
          sync: placeNext
        };
      })();

      // The carrier is done. With no question, Continue opens. With one, the
      // question rises over the stage and Continue stays shut until it is
      // answered.
      function finished() {
        if (handed) return; handed = true;
        read.sync();
        if (!q) { ctx.enableNext(); return; }
        ctx.disableNext();
        if (video) try { video.pause(); } catch (e) {}
        var el = document.getElementById('dkCheck');
        reinforce(ctx, el, 1, 1);
        // Over the whole page: lifted out of the stage onto <body> (a fixed
        // layer inside the step would be trapped by any transformed or
        // filtered ancestor), and taken away again when the step is torn
        // down, since the engine only clears its own stage. Moved AFTER
        // reinforce(), which marks the layer's parent as held — done on
        // <body> that would blur the footer too.
        el.classList.add('dk-check--page');
        document.body.appendChild(el);
        try { el.focus({ preventScroll: true }); } catch (e) {}
        var stageRoot = document.querySelector('.ll-stage');
        if (stageRoot && window.MutationObserver) {
          var gone = new MutationObserver(function () {
            if (document.body.contains(stage)) return;
            gone.disconnect();
            if (el.parentNode) el.parentNode.removeChild(el);
          });
          gone.observe(stageRoot, { childList: true, subtree: true });
        }
        var host = el.querySelector('.dk-opts, .lk');
        var fb = document.getElementById('dkFb');
        wireChoice(host, document.getElementById('dkSubmit'), function (v, picked) {
          document.getElementById('dkSubmit').classList.add('is-spent');
          if (q.kind === 'mcq') {
            var ok = v === q.correct;
            // 2026-09-24 live review: say the verdict in words, both ways.
            // A first miss does NOT reveal the right answer: the learner
            // goes into the remedial content next and meets this question
            // again, so the feedback only says what happens next. A second
            // miss (the re-ask on the remedial screen) is the last time
            // they see it, so that one still names the right answer.
            // The incorrect line is Rob's wording, standing in until
            // Jessica's authored feedback lands in the deck (q.noFb).
            var last = !!d.recheck;
            csMark(picked, ok ? 'ok' : 'bad');
            if (!ok) csTag(picked, 'Your answer');
            if (!ok && last) {
              // Names both rows, so the right answer can't be mistaken
              // for a second pick (colour + mark + words).
              var right = host.querySelectorAll('.cs-opt')[q.correct];
              csMark(right, 'ok');
              csTag(right, 'Correct answer');
            }
            var body = ok ? q.okFb
              : last ? ''
              : (q.noFb || 'Let\u2019s dig into this again from a slightly different lens.');
            fb.innerHTML = '<strong class="dk-fb-h"><i class="fa-solid ' + (ok ? 'fa-circle-check' : 'fa-circle-xmark') +
                '" aria-hidden="true"></i> ' + (ok ? 'Correct' : 'Not quite') + '</strong>' +
              (body ? '<span class="dk-fb-b">' + esc(body) + '</span>' : '');
            fb.className = 'dk-fb ' + (ok ? 'is-ok' : 'is-bad');
            fb.hidden = false;
            clearFooter(fb);
            saveResult(q.key, { variant: q.variant, passed: ok, picked: v, carrier: showing });
          } else if (q.kind === 'insight') {
            csMark(picked, 'neutral');
            saveResult(q.key, { picked: v, answer: q.options[v].t, carrier: showing });
            markRecorded();
          } else {
            picked.classList.add('is-picked');
            saveResult(q.key, { score: v, carrier: showing });
            markRecorded();
          }
          ctx.enableNext();
          // Ungraded items have no verdict to show, so after Submit the card
          // just went quiet and it wasn't clear the screen was done (2026-10-23
          // review). A plain status line takes the spent button's place — same
          // height, so nothing on the card shifts.
          function markRecorded() {
            var btn = document.getElementById('dkSubmit');
            var line = document.createElement('p');
            line.className = 'dk-recorded';
            line.setAttribute('role', 'status');
            line.style.minHeight = btn.offsetHeight + 'px';
            line.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Answer recorded';
            btn.replaceWith(line);
          }
        });
      }

      // The run's one carrier (deckCarrier), chosen on the offer screen.
      if (showing === 'video') {
        // mountVideo unlocks Continue on 'ended' by itself; finished()
        // shuts it again on a screen whose question is still to come.
        mountVideo(ctx, { ids: DK_IDS, src: deckVideo(id), onFallback: finished, onEnded: finished });
        video.addEventListener('timeupdate', function () {
          if (video.duration) setRail(video.currentTime / video.duration);
        });
        setRail(0);
      } else {
        // No footer "Done reading": the in-flow Next button walks the text
        // and becomes "Done reading" on the last paragraph.
        read.enter();
      }
      // Warm the next screen's video, but not while this one is still
      // loading — they'd split the bandwidth.
      if (video && showing === 'video') {
        video.addEventListener('canplaythrough', function () { warmNextVideo(id); }, { once: true });
      } else {
        warmNextVideo(id);
      }
    };
  }

  // `extra.deck` serves a DECK entry under a different step id — the podcast
  // step id (Listen mode once ran the remedial screens again this way),
  // and two steps can't share an id.
  //
  // `served` is the step's own routing rule (base vs harder vs reinforced),
  // kept apart from `when` because the podcast path skips every non-remedial
  // screen yet still needs to know which version this learner is served —
  // the Listen mode post-check asks the question of whichever version played.
  function deckStep(id, extra) {
    var deck = (extra && extra.deck) || id;
    // The blue bar carries the module name; the screen's own title sits above
    // the video, so showing it in both places just repeated it.
    var s = { id: id, icon: 'fa-circle-play', mins: 3, stage: 'Learn', lesson: MODULE,
              mode: 'floating', gate: true, coach: { say: '' },
              content: deckContent(deck), init: deckInit(deck) };
    for (var k in extra) if (k !== 'deck') s[k] = extra[k];
    if (!RECHECK[deck]) {
      var served = s.when || function () { return true; };
      s.served = served;
      s.when = function () { return served() && !podcastPath(); };
    }
    return s;
  }

  // ==========================================================================
  //  LISTEN MODE (2026-09-25; renamed from "the podcast path" 2026-09-29;
  //  rebuilt on the recorded audio package 2026-10-01). No learner surface
  //  says "podcast"; internal names — podcastPath(), the podpath/podpos
  //  keys — keep the old word.
  //
  //    pre-check → the offer → ONE continuous listen → the questions →
  //    review set (missed knowledge questions only) → completion → simulation
  //
  //  NOTHING content-specific lives here. Two kinds of data drive it:
  //    data/sharps-listen/config.json — which package each sector plays,
  //        trigger rules (testOut / harder / reinforce), chapter titles,
  //        which question goes with each topic, speed options, the review
  //        set's retry rule;
  //    assets/audio/sharps/listenModeAudio-<sector>/ — the Listen Mode
  //        Studio's "Prototype package", unzipped as is: manifest.json (the
  //        fixed topic order, versions, bridges and closers) plus audio/ and
  //        its WebVTT captions, which the page turns into timed sentences
  //        itself (no build step; tools/listen-mode/build.py belongs to the
  //        earlier hand-made package and is no longer needed).
  //  A new export for a sector means replacing that sector's folder (and
  //  bumping config.audioVersion) and nothing else.
  //
  //  The pre-check answers are SNAPSHOTTED when the learner chooses Listen
  //  mode (podpath.results), and the listen is always resolved from that
  //  snapshot — a resume or replay rebuilds the same listen even if the
  //  answers changed since.
  //
  //  Playback: every file this learner needs is fetched and decoded, then
  //  the listen is assembled on an OfflineAudioContext — each piece
  //  scheduled back to back on its clock (sample-accurate joins, a short
  //  gain ramp at every edge) — and the rendered result plays through ONE
  //  <audio> element. Web Audio does the joining; the media element is what
  //  keeps playing on a locked phone, shows lock-screen controls, does
  //  speed, and resumes by time. Needs the page served over http(s): fetch
  //  and decode don't work from a double-clicked file.
  // ==========================================================================
  var LISTEN_CONFIG_URL = '../data/hazing-listen/config.json';
  // Caption speaker names; a package's voices are otherwise shown title-cased.
  var PODCAST_WHO = {};
  function podcastPath() {
    // Admin preview with one format allowed: the format screen is skipped,
    // so that format decides the path.
    if (AP && AP.only()) return AP.only() === 'listen';
    return !!(readCourse().podpath || {}).podcast;
  }

  // ---- The data ------------------------------------------------------------
  // One package per audience (config.sectors → that package's manifest.json),
  // fetched at script load and again if the Demo menu's Context lens moves to
  // the other audience. LD() is always the CURRENT audience's data, or null
  // while it loads; nothing else holds on to a package.
  var listenCache = {}, listenPending = {};
  function listenSectorKey() { return lensKey(); }
  function LD() { return listenCache[listenSectorKey()] || null; }
  function fetchListen(url, as) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Couldn’t load ' + url + ' (' + r.status + ')');
      return as === 'text' ? r.text() : r.json();
    });
  }

  // A package's captions are WebVTT files, one per audio file. Their cues are
  // regrouped into whole sentences (the player shows one at a time): words
  // spread across their cue by character share, a speaker change or sentence
  // end closes a sentence, [stage directions] drop out, and an ALL-CAPS word
  // is spoken emphasis (shown in lower case, flagged in `em`).
  function vttSeconds(x) {
    var p = x.replace(',', '.').split(':').map(Number);
    while (p.length < 3) p.unshift(0);
    return p[0] * 3600 + p[1] * 60 + p[2];
  }
  function parseVtt(text) {
    var words = [];
    text.replace(/\r/g, '').split(/\n\s*\n/).forEach(function (block) {
      var m = block.match(/([0-9:.,]+)\s*-->\s*([0-9:.,]+)/);
      if (!m) return;
      var s = vttSeconds(m[1]), e = vttSeconds(m[2]), body = block.slice(m.index + m[0].length).trim();
      var v = body.match(/^<v\s+([^>]+)>/), who = v ? v[1].trim().toUpperCase() : '';
      var ws = body.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').replace(/\[[^\]]*\]\s*/g, '').trim().split(/\s+/)
        .filter(Boolean).map(function (w) {
          var core = w.replace(/[^A-Za-z]/g, ''), em = core.length >= 2 && core === core.toUpperCase() && w.indexOf('-') < 0;
          return { w: em ? w.toLowerCase() : w, em: em };
        });
      var total = ws.reduce(function (n, x) { return n + x.w.length + 1; }, 0) || 1, acc = 0;
      ws.forEach(function (x) {
        var a = s + (e - s) * acc / total;
        acc += x.w.length + 1;
        words.push({ w: x.w, em: x.em, who: who, s: a, e: s + (e - s) * acc / total });
      });
    });
    var sents = [], cur = [];
    function flush() {
      if (!cur.length) return;
      var em = [];
      cur.forEach(function (x, i) { if (x.em) em.push(i); });
      sents.push({ w: cur[0].who, t: cur.map(function (x) { return x.w; }).join(' '), em: em,
                   s: +cur[0].s.toFixed(3), e: +cur[cur.length - 1].e.toFixed(3) });
    }
    words.forEach(function (x) {
      if (cur.length && x.who !== cur[0].who) { flush(); cur = []; }
      cur.push(x);
      if (/[.?!]["”’)]*$/.test(x.w)) { flush(); cur = []; }
    });
    flush();
    return sents;
  }

  // Every audio entry a manifest names: topic versions, bridges, closers.
  function manifestEntries(m) {
    var out = [];
    Object.keys(m.topics || {}).forEach(function (t) {
      Object.keys(m.topics[t]).forEach(function (k) { var e = m.topics[t][k]; if (e && typeof e === 'object' && e.file) out.push(e); });
    });
    ['bridges', 'closers'].forEach(function (g) {
      var seams = (m.seams || {})[g] || {};
      Object.keys(seams).forEach(function (k) { out.push(seams[k]); });
    });
    return out;
  }
  // The names the resolver plays by: a package from the studio says `base`
  // (or `universal` for a one-version topic) and `testup`; the hand-made one
  // before it said `normal` and `harder`. Both play.
  function normalizeManifest(m) {
    Object.keys(m.topics || {}).forEach(function (t) {
      var d = m.topics[t];
      if (!d.normal) d.normal = d.base || d.universal;
      if (!d.harder && d.testup) d.harder = d.testup;
    });
    return m;
  }

  function loadListenData() {
    var key = listenSectorKey();
    if (listenCache[key]) return Promise.resolve(listenCache[key]);
    if (listenPending[key]) return listenPending[key];
    var p = fetchListen(LISTEN_CONFIG_URL).then(function (config) {
      var url = (config.sectors || {})[key] || (config.sectors || {})[config.defaultSector] || config.manifest;
      var base = url.replace(/[^\/]*$/, '');
      var reviews = config.review && config.review.topics || {}, cardsBase = LISTEN_CONFIG_URL.replace(/[^\/]*$/, '');
      return fetchListen(url).then(function (manifest) {
        normalizeManifest(manifest);
        var timing = {};
        // Captions come with the package; no build step.
        var captioned = Promise.all(manifestEntries(manifest).map(function (e) {
          timing[e.file] = { dur: e.duration, sents: [] };
          if (!e.captions) return null;
          return fetchListen(base + e.captions, 'text').then(function (txt) { timing[e.file].sents = parseVtt(txt); })
            .catch(function () {});   // a missing caption file leaves that part uncaptioned, not unplayable
        }));
        var hb = config.handBack;
        if (hb) timing[hb.file] = { dur: hb.dur, sents: hb.sents || [] };
        var cards = Promise.all(Object.keys(reviews).map(function (k) {
          return fetchListen(cardsBase + reviews[k].cards.replace('{sector}', key)).then(function (c) { return [k, c]; });
        }));
        return Promise.all([captioned, cards]).then(function (r) {
          var byTopic = {};
          r[1].forEach(function (c) { byTopic[c[0]] = c[1]; });
          return (listenCache[key] = { sector: key, config: config, manifest: manifest, timing: timing, base: base, cards: byTopic });
        });
      });
    });
    listenPending[key] = p;
    p.catch(function () { delete listenPending[key]; });   // let a retry try again
    return p;
  }
  if (location.protocol !== 'file:') loadListenData().catch(function () {});

  // ---- The learner's answers, as the rules read them -------------------------
  // The Demo menu's Battery/Feel overrides count, as everywhere else. f1 is
  // the two 5.3 statements' mean (feelScore, under Routing).
  function listenResultsLive() {
    return { k1: { correct: k1Correct() }, f1: { score: feelScore() } };
  }
  // The snapshot taken when Listen mode was chosen (older runs, saved before
  // there was one, fall back to the live answers).
  function listenResults() {
    var p = readCourse().podpath;
    return (p && p.results) || listenResultsLive();
  }
  function ruleHolds(rule, results) {
    if (!rule) return false;
    var r = results[rule.item] || {};
    if (rule.rule === 'correct') return r.correct === true && r.confident !== false;
    if (rule.rule === 'scoreAtMost') return r.score != null && r.score <= rule.value;
    return false;
  }
  function ruleWhy(rule, results) {
    var r = results[rule.item] || {}, item = rule.item.toUpperCase();
    if (rule.rule === 'correct') return item + ' pre-check answered correctly';
    return item + ' agreement ' + r.score + ' (at or below ' + rule.value + ')';
  }

  // Splice point for a topic — the manifest's, unless a reviewer has nudged
  // it in the splice test this session.
  function seamFor(t, data) {
    try { var o = sessionStorage.getItem('hz-seam-' + t); if (o != null && o !== '') return +o; } catch (e) {}
    return data.manifest.topics[t].seamAt;
  }
  // Every audio request carries a version (the manifest's, else the config's
  // `audioVersion`: the studio's manifests have none, and re-exports reuse the
  // same names), so replacing audio reaches browsers that cached the old take.
  function audioUrl(file, data) {
    var v = data.manifest.version || data.config.audioVersion || data.manifest.ledgerVersion;
    return data.base + file + (v ? '?v=' + encodeURIComponent(v) : '');
  }
  function fileDur(file, data) {
    var t = data.timing[file];
    return t ? t.dur : null;
  }

  // ---- The resolver ----------------------------------------------------------
  // One way to play each topic, in the manifest's fixed order:
  //   0. skipped, if the pre-check tests the learner out of it
  //      (config.triggers.testOut — the package's K1: routing "testOut");
  //   1. a `reinforced` whole file, if the topic has one and the learner
  //      needs reinforcement;
  //   2. else, needing reinforcement with an `addon` and a valid seamAt:
  //      normal[0 → seam], the add-on, normal[seam → end], no gap (the old
  //      hand-made package; the studio's packages swap whole files instead);
  //   3. else `harder` (the studio's `testup`) when the learner qualifies;
  //   4. else `normal` (the studio's `base` or `universal`).
  // Each entry carries `why`, the plain-language trace a reviewer sees.
  function resolveListen(results, data) {
    var m = data.manifest, trig = data.config.triggers || {};
    return m.order.map(function (t) {
      var def = m.topics[t];
      if (!def) throw new Error('The manifest’s order names “' + t + '”, which it doesn’t define.');
      var out = (trig.testOut || {})[t], reinforce = (trig.reinforce || {})[t], harder = (trig.harder || {})[t];
      if (testOutOn() && ruleHolds(out, results)) return { topic: t, how: 'skip', why: ruleWhy(out, results) + ' → tested out, part skipped' };
      var needs = ruleHolds(reinforce, results), up = testUpOn() && ruleHolds(harder, results);
      if (needs && def.reinforced) return { topic: t, how: 'reinforced', why: ruleWhy(reinforce, results) + ' → reinforced version' };
      if (needs && def.addon) {
        var seam = seamFor(t, data), d = fileDur(def.normal.file, data);
        if (seam > 0 && (d == null || seam < d))
          return { topic: t, how: 'addon', seam: seam, why: ruleWhy(reinforce, results) + ' → add-on spliced in at ' + seam + 's' };
      }
      if (up && def.harder) return { topic: t, how: 'harder', why: ruleWhy(harder, results) + ' → harder version' };
      var why = out && !testOutOn() ? 'normal (skip ahead is off for this assignment)'
        : harder && !testUpOn() ? 'normal (harder checks are off for this assignment)'
        : out ? 'normal (' + out.item.toUpperCase() + ' pre-check not answered correctly)'
        : harder && !up ? 'normal (' + harder.item.toUpperCase() + ' pre-check not answered correctly)'
        : reinforce && !needs ? 'normal (no reinforcement needed)'
        : 'normal (single version)';
      return { topic: t, how: 'normal', why: why };
    });
  }
  // The plan as playback pieces on one timeline. Each piece carries the
  // silence before it (`gap`, the sting's placeholder): the manifest's
  // gapBetweenPartsSec between every two parts, a topic's own gapBeforeSec
  // overriding it for the join into that topic, none inside a spliced topic.
  // Seams, when the package has them, are the studio's rules:
  //   · a bridge plays between two topics that are both in the listen,
  //     named for the pair (the topic just heard > the next one played, so a
  //     skipped topic between them is already accounted for);
  //   · the closer written for the last topic heard plays in place of the
  //     close, when the package has one for it.
  // A package without `seams` plays exactly the topics, as before.
  function gapBefore(topic, data) {
    var d = data.manifest.topics[topic];
    return d && d.gapBeforeSec != null ? d.gapBeforeSec : (data.manifest.gapBetweenPartsSec || 0);
  }
  function listenPieces(plan, data) {
    var m = data.manifest, seams = m.seams || {}, t = 0, out = [], last = null;
    function piece(topic, file, offset, dur, gap, kind) {
      var full = fileDur(file, data);
      if (dur == null) dur = (full == null ? null : full - offset);
      if (out.length) t += gap; else gap = 0;
      out.push({ topic: topic, file: file, offset: offset, dur: dur, at: t, gap: gap, kind: kind });
      t += dur || 0;
    }
    plan.forEach(function (p) {
      var def = m.topics[p.topic];
      if (p.how === 'skip') return;
      var content = def.objective != null, gap = gapBefore(p.topic, data);
      if (content && last) {
        var bridge = (seams.bridges || {})[last + '>' + p.topic];
        if (bridge) piece(last, bridge.file, 0, null, m.gapBetweenPartsSec || 0, 'bridge');
      }
      if (p.topic === 'close' && last && (seams.closers || {})[last]) {
        piece(p.topic, seams.closers[last].file, 0, null, gap, 'closer');
      } else if (p.how === 'reinforced') piece(p.topic, def.reinforced.file, 0, null, gap, 'topic');
      else if (p.how === 'addon') {
        piece(p.topic, def.normal.file, 0, p.seam, gap, 'topic');
        piece(p.topic, def.addon.file, 0, null, 0, 'topic');
        piece(p.topic, def.normal.file, p.seam, null, 0, 'topic');
      } else piece(p.topic, (p.how === 'harder' ? def.harder : def.normal).file, 0, null, gap, 'topic');
      if (content) last = p.topic;
    });
    // The hand-back to the screen ("You may now continue the lesson."), for a
    // package that doesn't carry its own `continue` topic.
    var hb = data.config.handBack;
    if (hb && out.length && m.order.indexOf('continue') < 0) piece('close', hb.file, 0, null, hb.gap || 0, 'handback');
    return { pieces: out, dur: t };
  }
  // A chapter's name: the manifest's, or the config's (the studio's packages
  // don't carry titles).
  function topicTitle(t, data) {
    var def = data.manifest.topics[t] || {};
    return def.title || (data.config.titles || {})[t] || t;
  }
  function listenMinutes() {
    if (!LD()) return null;
    try { return Math.max(1, Math.round(listenPieces(resolveListen(listenResults(), LD()), LD()).dur / 60)); }
    catch (e) { return null; }
  }
  // Reviewer trace for the captions: which answer put each part here.
  function listenTrace() {
    if (!LD()) return 'Loading the audio manifest…';
    try {
      return resolveListen(listenResults(), LD()).map(function (p) { return p.topic + ': ' + p.why; }).join(' · ');
    } catch (e) { return String(e.message || e); }
  }

  // ---- The offer -------------------------------------------------------------
  // After the pre-check, because the pre-check is what builds the listen.
  // Two modes: Listen mode, or Standard mode (the screen-by-screen path in
  // whatever format each screen offers — so not "Watch", which every screen
  // lets them change). How Listen mode works sits behind its own toggle.
  //
  // 2026-09-29: the page reflects the learner's saved mode preference. With
  // one saved, that mode is preselected ("Continue in…", tagged Your
  // preference) and the other reads "Switch to…"; picking the other offers
  // to make it the new preference. With none saved, whichever they pick can
  // be saved for future modules. Select, then Continue — the choice no
  // longer advances on its own, since a checkbox now travels with it.
  //
  // The preference is a learner PROFILE setting, not this run's progress, so
  // it lives in localStorage and survives Start over. PROTOTYPE: a real
  // build reads and writes it on the learner's profile. Demo → "Mode
  // preference" sets or clears it.
  var MODE_PREF_KEY = 'hz-mode-pref';
  function modePref() {
    try { var v = localStorage.getItem(MODE_PREF_KEY); return v === 'listen' || v === 'standard' ? v : null; }
    catch (e) { return null; }
  }
  function setModePref(v) {
    try { if (v) localStorage.setItem(MODE_PREF_KEY, v); else localStorage.removeItem(MODE_PREF_KEY); } catch (e) {}
  }
  var MODES = {
    listen:   { icon: 'fa-headphones', name: 'Listen mode',
                // No runtime here on purpose: Standard mode shows none, and a time
                // on one option only reads as a reason to pick it.
                sub: function () { return 'An audio podcast with questions at the end.'; } },
    standard: { icon: 'fa-display', name: 'Classic mode',
                sub: function () { return 'Videos and articles with questions after each.'; } }
  };
  // "How do you prefer to learn?" (2026-10-20, DLE alignment): the learner's
  // answer sets the modality. Listening = Listen mode; Watching and Reading are
  // Classic mode with the video or the article as the default carrier
  // (sh-modality, the key every beat's modalityDefault reads). The saved
  // MODE preference stays listen | standard; a saved Classic learner also
  // keeps which of the two (sh-format-pref).
  var FORMAT_PREF_KEY = 'hz-format-pref';
  function formatPref() {
    try { var v = localStorage.getItem(FORMAT_PREF_KEY); return v === 'video' || v === 'article' ? v : null; }
    catch (e) { return null; }
  }
  function setFormatPref(v) {
    try { if (v) localStorage.setItem(FORMAT_PREF_KEY, v); else localStorage.removeItem(FORMAT_PREF_KEY); } catch (e) {}
  }
  var OFFER = [
    { key: 'video',   name: 'Watching',  icon: 'fa-circle-play', sub: 'Videos with questions after each.' },
    { key: 'listen',  name: 'Listening', icon: 'fa-headphones',  sub: 'An audio podcast with questions at the end.' },
    { key: 'article', name: 'Reading',   icon: 'fa-file-lines',  sub: 'Short reads with questions after each.' }
  ];
  // The title page's preference card, in the picker's own shape: the same
  // three options, names, icons and order as the offer above (2026-10-27),
  // so the setting reads the same wherever the learner meets it.
  var MODE_CARD = {};
  OFFER.forEach(function (o) { MODE_CARD[o.key] = { icon: o.icon, label: o.name }; });
  // The formats this run may offer: all three, or in an admin preview only
  // the ones the assignment allows ("Formats people can choose").
  function offered() { return AP ? OFFER.filter(function (o) { return AP.allows(o.key); }) : OFFER; }
  function offeredKeys() { return offered().map(function (o) { return o.key; }); }
  // Saving an offer key writes the mode, and for Classic, which format.
  function setOfferPref(k) {
    setModePref(k === 'listen' ? 'listen' : 'standard');
    if (k !== 'listen') setFormatPref(k);
  }
  // The offer key a saved preference stands for, or null.
  function offerPref() {
    var m = modePref();
    return m === 'listen' ? 'listen' : m === 'standard' ? (formatPref() || 'video') : null;
  }
  function PODOFFER_CONTENT() {
    var pref = offerPref();
    return '<main class="ll-object po-object"><div class="po">' +
      '<h1 class="po-head">How do you prefer to learn?</h1>' +
      '<div class="po-opts" role="radiogroup" aria-label="How do you prefer to learn?">' +
        offered().map(function (o) {
          var k = o.key;
          // The visual is a quiet picture of the experience's shape: one long
          // listen then a short quiz, versus three watch/read-then-answer pairs.
          // Reading is one long read then the quiz, the same shape as Listening.
          var vis = k === 'listen'
            ? '<span class="po-wave" data-wave></span><span class="po-kz"></span>'
            : k === 'article'
            ? '<span class="po-doc"></span><span class="po-kz"></span>'
            : '<span class="po-pair"><i class="w"></i><i class="k"></i></span>'.repeat(3);
          // Three tall cards side by side, each with its description showing. A
          // div, not a button, so each can hold richer content.
          return '<div class="po-opt" tabindex="0" role="radio" aria-checked="false" data-pick="' + k + '">' +
            '<span class="po-opt-top">' +
              '<span class="po-ico"><i class="fa-solid ' + o.icon + '" aria-hidden="true"></i></span>' +
              '<span class="po-radio" aria-hidden="true"></span>' +
            '</span>' +
            '<span class="po-txt"><b>' + esc(o.name) + '</b>' +
              (k === pref ? '<span class="po-tag">Your preference</span>' : '') +
              '<small>' + esc(o.sub) + '</small></span>' +
            '<span class="po-vis' + (k === 'video' ? ' po-vis--std' : '') + '" aria-hidden="true">' + vis + '</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<label class="po-save" id="poSave" hidden>' +
        '<input type="checkbox" id="poSaveBox" />' +
        '<span id="poSaveLabel"></span>' +
      '</label>' +
    '</div></main>';
  }
  function podofferInit(ctx) {
    ctx.setCoachSay('');
    ctx.floatClose();
    var pref = offerPref();
    var opts = [].slice.call(document.querySelectorAll('.po-opt'));
    var save = document.getElementById('poSave'), box = document.getElementById('poSaveBox');
    var saveLabel = document.getElementById('poSaveLabel');
    var picked = null;

    // Deterministic waveform that fills whatever width its box has.
    var wave = document.querySelector('[data-wave]');
    function drawWave() {
      if (!wave || !wave.isConnected) return;
      var n = Math.max(16, Math.floor(wave.clientWidth / 6)), h = [];
      for (var i = 0; i < n; i++) h.push(18 + Math.round(60 * Math.abs(Math.sin(i * .55) * Math.cos(i * .21 + 1))));
      wave.innerHTML = h.map(function (v) { return '<i style="height:' + v + '%"></i>'; }).join('');
    }
    drawWave();
    window.addEventListener('resize', drawWave);

    // Commit the pick for this module: which path runs, which carrier the
    // Classic beats open on, and (for Listen mode) the frozen cut.
    function commit(k) {
      var pod = k === 'listen';
      if (!pod) { try { sessionStorage.setItem('hz-modality', k); } catch (e) {} }
      var was = readCourse().podpath;
      // A fresh choice (or a changed one) starts the listen from the top.
      if (!was || !!was.podcast !== pod) { saveResult('podpos', null); saveResult('podcast', null); }
      // Listen mode freezes the pre-check answers it was built from.
      saveResult('podpath', { podcast: pod, results: pod ? listenResultsLive() : null });
      LE.refreshNav();
    }
    function pick(k) {
      picked = k;
      opts.forEach(function (b) { b.setAttribute('aria-checked', b.dataset.pick === k ? 'true' : 'false'); });
      commit(k);
      // The checkbox: save a first preference, or replace a different one.
      // Picking the mode that's already the preference needs neither.
      var offer = !pref || pref !== k;
      save.hidden = !offer;
      box.checked = false;
      saveLabel.textContent = 'Save preference';
      ctx.enableNext();
    }
    opts.forEach(function (b) { b.addEventListener('click', function () { pick(b.dataset.pick); }); });
    opts.forEach(function (b) {
      b.addEventListener('keydown', function (e) {
        if (e.target !== b || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault(); pick(b.dataset.pick);
      });
    });
    // An unchecked box never changes what was saved; a checked one saves the
    // mode and, for Classic, which format.
    box.addEventListener('change', function () {
      if (!box.checked) return;
      setOfferPref(picked);
    });

    // Back from later in the module: this run's own pick wins. Otherwise the
    // saved preference is preselected, so Continue carries straight on.
    var chosen = readCourse().podpath;
    if (chosen) pick(chosen.podcast ? 'listen' : (modalityId() === 'article' ? 'article' : 'video'));
    else if (pref) pick(pref);
    else ctx.disableNext();
  }

  // ---- The player --------------------------------------------------------------
  // The Read to me player's look (stage, waveform, word-by-word captions)
  // over the whole assembled listen. Chapters are TOPICS, not files — an
  // add-on belongs to its topic's chapter. The page never scrolls; the
  // chapter list opens over the stage. Play/pause, back 15 s, and (config)
  // speed on screen; play/pause on the lock screen; no scrubbing ahead.

  // Fetch + decode every file the pieces need (once each), then schedule the
  // pieces back to back on an OfflineAudioContext and render. A failed fetch
  // or decode rejects naming the file — a part is never skipped silently.
  function renderListen(data, pieces, onProgress) {
    var rate = data.config.renderSampleRate || 24000;
    var files = [];
    pieces.forEach(function (p) { if (files.indexOf(p.file) < 0) files.push(p.file); });
    var probe = new OfflineAudioContext(1, rate, rate), done = 0, bufs = {};
    return Promise.all(files.map(function (f) {
      return fetch(audioUrl(f, data)).then(function (r) {
        if (!r.ok) throw new Error('missing ' + f + ' (' + r.status + ')');
        return r.arrayBuffer();
      }).then(function (ab) {
        return new Promise(function (res, rej) {
          probe.decodeAudioData(ab, res, function () { rej(new Error('could not decode ' + f)); });
        });
      }).then(function (b) {
        bufs[f] = b; done++; onProgress(done / files.length);
      }).catch(function (e) { e.file = f; throw e; });
    })).then(function () {
      // Durations from the DECODED audio, not the timing file: they are
      // what the clock actually schedules.
      var t = 0;
      pieces.forEach(function (p, i) {
        if (i) t += p.gap || 0;
        var b = bufs[p.file];
        p.dur = Math.max(0, Math.min(p.dur == null ? Infinity : p.dur, b.duration - p.offset));
        p.at = t; t += p.dur;
      });
      var total = t, ctx = new OfflineAudioContext(1, Math.ceil(total * rate) + rate, rate);
      var fade = (data.manifest.spliceFadeMs || 25) / 1000;
      pieces.forEach(function (p) {
        var src = ctx.createBufferSource(), g = ctx.createGain(), f = Math.min(fade, p.dur / 4);
        src.buffer = bufs[p.file];
        g.gain.setValueAtTime(0, p.at);
        g.gain.linearRampToValueAtTime(1, p.at + f);
        g.gain.setValueAtTime(1, p.at + p.dur - f);
        g.gain.linearRampToValueAtTime(0, p.at + p.dur);
        src.connect(g); g.connect(ctx.destination);
        src.start(p.at, p.offset, p.dur);
      });
      return ctx.startRendering().then(function (out) { return { buffer: out, dur: total }; });
    });
  }
  // 16-bit mono WAV from the rendered buffer, so one <audio> element plays it.
  function wavBlob(buf, dur) {
    var rate = buf.sampleRate, n = Math.min(buf.length, Math.ceil(dur * rate)), ch = buf.getChannelData(0);
    var ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab);
    function str(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, n * 2, true);
    for (var i = 0, o = 44; i < n; i++, o += 2) {
      var x = Math.max(-1, Math.min(1, ch[i]));
      v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true);
    }
    return new Blob([ab], { type: 'audio/wav' });
  }
  // The waveform's loudness, measured from the rendered listen itself.
  function envFromBuffer(buf, dur) {
    var ch = buf.getChannelData(0), step = Math.round(buf.sampleRate / WAVE_HZ), n = Math.ceil(dur * WAVE_HZ), raw = [];
    for (var k = 0; k < n; k++) {
      var s = 0, a = k * step, b = Math.min(ch.length, a + step);
      for (var i = a; i < b; i++) s += ch[i] * ch[i];
      raw.push(Math.sqrt(s / Math.max(1, b - a)));
    }
    var peak = Math.max.apply(null, raw.concat([1e-6]));
    return raw.map(function (x) { return '0123456789abcdefghijklmnopqrstuvwxyz'.charAt(Math.min(35, Math.floor(35 * Math.pow(x / peak, .7)))); }).join('');
  }
  // Captions on the listen's own clock: each piece contributes the sentences
  // that fall inside its slice of its file, shifted to where it plays.
  function listenSentences(pieces, data) {
    var out = [];
    pieces.forEach(function (p) {
      var tm = data.timing[p.file];
      if (!tm) return;
      tm.sents.forEach(function (st) {
        if (st.s < p.offset - .05 || st.s >= p.offset + p.dur) return;
        out.push({ w: st.w, t: st.t, em: st.em || [], s: p.at + (st.s - p.offset),
                   e: p.at + Math.min(st.e, p.offset + p.dur) - p.offset });
      });
    });
    return out;
  }
  // Chapters by topic: numbered in order, spanning all of a topic's pieces.
  function listenChapters(pieces, data) {
    var out = [];
    pieces.forEach(function (p) {
      var def = data.manifest.topics[p.topic];
      var last = out[out.length - 1];
      if (last && last.topic === p.topic) { last.end = p.at + p.dur; return; }
      out.push({ topic: p.topic, title: topicTitle(p.topic, data), chapter: def.chapter !== false, start: p.at, end: p.at + p.dur });
    });
    var n = 0;
    out.forEach(function (c) { if (c.chapter) c.n = ++n; });
    out.total = n;
    return out;
  }

  function EPISODE_CONTENT() {
    return '<main class="ll-object dk-object ep-object"><div class="dk-theater">' +
      '<header class="dk-head"><div class="dk-head-t">' +
        '<p class="ll-eyebrow" id="epEyebrow">Listen mode</p>' +
        '<h1 class="dk-title" id="epTitle">' + esc(MODULE) + '</h1>' +
      '</div>' +
        '<button class="ep-ch-btn" type="button" id="epChBtn" aria-label="Chapters" aria-expanded="false" aria-controls="epChPanel" disabled>' +
          '<i class="fa-solid fa-list-ul" aria-hidden="true"></i><span>Chapters</span></button>' +
      '</header>' +
      '<div class="dk-stagewrap"><div class="dk-stage" id="epStage" data-mode="podcast">' +
        '<section class="dk-layer dk-layer--listen" aria-label="Listen mode">' +
          '<audio id="epAudio" preload="auto"></audio>' +
          '<div class="dk-wave-wrap ep-wave-wrap"><canvas class="dk-wave" id="epWave" aria-hidden="true"></canvas>' +
            '<span class="dk-playhead" aria-hidden="true"></span></div>' +
          '<div class="dk-caps" aria-live="off">' +
            '<p class="dk-cap-who" id="epCapWho"></p>' +
            '<p class="dk-cap-now" id="epCapNow"></p>' +
          '</div>' +
          '<div class="dk-player">' +
            '<span class="ep-player-start">' +
              '<button class="ep-back" type="button" id="epBack" aria-label="Back 15 seconds" disabled>' +
                '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span>15</span></button>' +
              '<button class="ep-back ep-speed" type="button" id="epSpeed" aria-label="Playback speed" hidden disabled>1×</button>' +
            '</span>' +
            '<button class="dk-play" type="button" id="epPlay" aria-label="Play" disabled><i class="fa-solid fa-play" aria-hidden="true"></i></button>' +
            '<span class="dk-player-end">' +
              '<button class="dk-skip" id="epSkip" type="button" hidden aria-label="Skip to the end">Skip <i class="fa-solid fa-forward" aria-hidden="true"></i></button>' +
              '<span class="dk-time" id="epTime">0:00 / –:––</span>' +
            '</span>' +
          '</div>' +
        '</section>' +
        // Preparing (fetch + decode + assemble), and any failure, over the stage.
        '<div class="ep-prep" id="epPrep" role="status">' +
          '<p class="ep-prep-t" id="epPrepT">Preparing your listen…</p>' +
          '<div class="pu-track ep-prep-track"><div class="pu-fill" id="epPrepFill"></div></div>' +
          '<button class="bl-check ep-prep-retry" type="button" id="epRetry" hidden>Try again</button>' +
        '</div>' +
        '<div class="ep-ch-panel" id="epChPanel" hidden>' +
          '<div class="ep-ch-head"><h2>Chapters</h2>' +
            '<button class="ep-ch-close" type="button" id="epChClose" aria-label="Close chapters">' +
              '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
          '<ol class="ep-chapters" id="epChapters"></ol>' +
        '</div>' +
        '<div class="dk-rail" aria-hidden="true"><span class="dk-rail-fill" id="epRail"></span></div>' +
      '</div></div>' +
    '</div></main>';
  }
  function episodeInit(ctx) {
    ctx.setCoachSay('');
    ctx.floatClose();
    ctx.disableNext();
    var $ = function (id) { return document.getElementById(id); };
    var audio = $('epAudio'), stage = $('epStage'), canvas = $('epWave'), g = canvas.getContext('2d');
    var play = $('epPlay'), back = $('epBack'), speed = $('epSpeed'), timeEl = $('epTime'), rail = $('epRail');
    var capNow = $('epCapNow'), capWho = $('epCapWho'), eyebrow = $('epEyebrow'), titleEl = $('epTitle');
    var prep = $('epPrep'), prepT = $('epPrepT'), prepFill = $('epPrepFill'), retry = $('epRetry');
    var chBtn = $('epChBtn'), chPanel = $('epChPanel'), chList = $('epChapters');
    var ms = 'mediaSession' in navigator ? navigator.mediaSession : null;
    // Lock-screen art: none yet for this course.
    var art = null;
    var L = null, url = null, raf = 0, lastSent = -1, spans = [], lastCh = -1, lastSave = 0;
    var done = !!(readCourse().podcast || {}).done, finishedOnce = done;
    var torn = false;

    function fail(e) {
      if (torn) return;
      var msg = location.protocol === 'file:'
        ? 'Listen mode needs this page served from a web server (localhost or GitHub Pages). It can’t load audio from a double-clicked file.'
        : 'Part of this listen couldn’t be loaded' + (e && e.file ? ' (' + e.file + ')' : '') + '. Check your connection and try again.';
      prepT.textContent = msg;
      prep.classList.add('is-error');
      retry.hidden = location.protocol === 'file:';
      if (window.console) console.error('[listen mode]', e);
    }
    function build() {
      prep.hidden = false; prep.classList.remove('is-error'); retry.hidden = true;
      prepT.textContent = 'Preparing your listen…'; prepFill.style.width = '0%';
      if (location.protocol === 'file:') { fail(); return; }
      loadListenData().then(function (data) {
        var plan = resolveListen(listenResults(), data);
        var lp = listenPieces(plan, data);
        // Admin preview thumbnail (js/preview-embed.js): the player laid out at
        // its chapter, nothing downloaded or assembled. Times come from the
        // package's timing data; the waveform is drawn from where the
        // sentences fall rather than from the audio.
        if (PE && PE.thumb) { still(data, plan, lp.pieces); return; }
        return renderListen(data, lp.pieces, function (f) { prepFill.style.width = Math.round(f * 100) + '%'; })
          .then(function (r) {
            if (torn) return;
            L = { data: data, plan: plan, pieces: lp.pieces, dur: r.dur,
                  env: envFromBuffer(r.buffer, r.dur), sents: listenSentences(lp.pieces, data),
                  chapters: listenChapters(lp.pieces, data) };
            url = URL.createObjectURL(wavBlob(r.buffer, r.dur));
            ready();
          });
      }).catch(fail);
    }
    retry.addEventListener('click', build);

    var PE = window.PreviewEmbed || null, stillT = null;
    // Where an admin preview asked this screen to open (?chapter=<topic>).
    function chapterStart() {
      var want = PE && PE.chapter, c = want && L.chapters.filter(function (x) { return x.topic === want; })[0];
      return c ? c.start : null;
    }
    function still(data, plan, pieces) {
      var sents = listenSentences(pieces, data), last = pieces[pieces.length - 1];
      var dur = last ? last.at + (last.dur || 0) : 0, n = Math.ceil(dur * WAVE_HZ), env = '';
      for (var k = 0; k < n; k++) {
        var t = k / WAVE_HZ, inSent = sents.some(function (st) { return t >= st.s && t < st.e; });
        env += inSent ? 'hijklmnopqrstu'.charAt((k * 7 + (k >> 2) * 3) % 14) : '2';
      }
      L = { data: data, plan: plan, pieces: pieces, dur: dur, env: env, sents: sents, chapters: listenChapters(pieces, data) };
      prep.hidden = true;
      var at = chapterStart();
      stillT = at == null ? 0 : at + .05;
      requestAnimationFrame(tick);
    }

    function chapterAt(t) {
      var c = L.chapters[0];
      L.chapters.forEach(function (x) { if (t >= x.start - .01) c = x; });
      return c;
    }
    function sentenceAt(t) {
      for (var i = L.sents.length - 1; i >= 0; i--) if (t >= L.sents[i].s) return i;
      return -1;
    }
    function setSentence(i) {
      if (i === lastSent) return;
      lastSent = i;
      var st = L.sents[i];
      capWho.textContent = st && st.w ? (PODCAST_WHO[st.w] || (st.w.charAt(0) + st.w.slice(1).toLowerCase())) : '';
      capWho.dataset.who = st && st.w ? st.w.toLowerCase() : '';
      capNow.innerHTML = st ? st.t.split(' ').map(function (w, k) {
        return '<span' + (st.em.indexOf(k) > -1 ? ' class="is-em"' : '') + '>' + esc(w) + '</span>';
      }).join(' ') : '';
      spans = [].slice.call(capNow.children);
      capNow.classList.remove('is-in'); void capNow.offsetWidth; capNow.classList.add('is-in');
    }
    function words(t) {
      var st = L.sents[lastSent];
      if (!st) return;
      var f = (t - st.s) / Math.max(.01, st.e - st.s), total = st.t.length, acc = 0;
      spans.forEach(function (sp) {
        var mid = (acc + sp.textContent.length / 2) / total;
        acc += sp.textContent.length + 1;
        sp.classList.toggle('is-said', mid <= f);
      });
    }
    function setChapter(c) {
      if (!c || c === lastCh) return;
      lastCh = c;
      eyebrow.textContent = c.chapter ? 'Listen mode · Chapter ' + c.n + ' of ' + L.chapters.total : 'Listen mode';
      titleEl.textContent = c.title;
      [].forEach.call(chList.children, function (li) {
        var n = +li.dataset.n;
        li.classList.toggle('is-now', c.chapter && n === c.n && !done);
        li.classList.toggle('is-done', done || (c.chapter ? n < c.n : n <= (c.start > 0 ? L.chapters.total : 0)));
        if (c.chapter && n === c.n) li.setAttribute('aria-current', 'true'); else li.removeAttribute('aria-current');
      });
      if (ms && window.MediaMetadata) {
        try {
          ms.metadata = new MediaMetadata({
            title: c.title,
            artist: c.chapter ? 'Chapter ' + c.n + ' of ' + L.chapters.total : MODULE,
            album: 'Bloodborne Pathogens · Module 4',
            artwork: art ? [{ src: art, sizes: '1200x675', type: 'image/jpeg' }] : []
          });
        } catch (e) {}
      }
    }
    function tick() {
      if (!L) return;
      var t = stillT != null ? stillT : (audio.currentTime || 0);
      drawEnvelope(canvas, g, L.env, t);
      setSentence(sentenceAt(t));
      words(t);
      setChapter(chapterAt(t));
      timeEl.textContent = mmss(t) + ' / ' + mmss(L.dur);
      rail.style.transform = 'scaleX(' + Math.max(0, Math.min(1, t / L.dur)) + ')';
      if (!audio.paused) raf = requestAnimationFrame(tick);
    }
    function setPlaying(on) {
      play.innerHTML = '<i class="fa-solid ' + (on ? 'fa-pause' : 'fa-play') + '" aria-hidden="true"></i>';
      play.setAttribute('aria-label', on ? 'Pause' : 'Play');
      stage.classList.toggle('is-playing', on);
      if (ms) try { ms.playbackState = on ? 'playing' : 'paused'; } catch (e) {}
    }
    function save(force) {
      if (!L || done) return;
      var now = Date.now();
      if (!force && now - lastSave < 2000) return;
      lastSave = now;
      saveResult('podpos', { t: Math.round(audio.currentTime * 10) / 10 });
    }
    function finish() {
      if (!finishedOnce) {
        finishedOnce = true;
        saveResult('podcast', { done: true, plan: L.plan.map(function (p) { return p.topic + ':' + p.how; }) });
        saveResult('podpos', null);
      }
      done = true;
      lastCh = -1; setChapter(chapterAt(L.dur));
      setPlaying(false);
      ctx.enableNext();
    }

    function ready() {
      prep.hidden = true;
      LE.refreshNav();   // the caption's "why each part" trace, now the manifest is in
      [play, back, speed, chBtn].forEach(function (b) { b.disabled = false; });
      chList.innerHTML = L.chapters.filter(function (c) { return c.chapter; }).map(function (c) {
        return '<li class="ep-ch" data-n="' + c.n + '">' +
          '<span class="ep-ch-n" aria-hidden="true">' + c.n + '</span>' +
          '<span class="ep-ch-t">' + esc(c.title) + '</span>' +
          '<span class="ep-ch-d">' + mmss(c.end - c.start) + '</span>' +
        '</li>';
      }).join('');
      // Speed (config). Kept for the session.
      var sp = L.data.config.speed || {};
      if (sp.enabled && sp.options && sp.options.length) {
        speed.hidden = false;
        var rate = 1;
        try { rate = +sessionStorage.getItem('hz-listen-rate') || 1; } catch (e) {}
        if (sp.options.indexOf(rate) < 0) rate = 1;
        var setRate = function (r) {
          rate = r; audio.playbackRate = r; audio.defaultPlaybackRate = r;
          speed.textContent = (r === 1 ? '1' : String(r)) + '×';
          speed.setAttribute('aria-label', 'Playback speed, ' + r + ' times');
          try { sessionStorage.setItem('hz-listen-rate', r); } catch (e) {}
        };
        speed.addEventListener('click', function () {
          var i = sp.options.indexOf(rate);
          setRate(sp.options[(i + 1) % sp.options.length]);
        });
        audio.addEventListener('loadedmetadata', function () { audio.playbackRate = rate; }, { once: true });
        setRate(rate);
      }
      audio.src = url;
      var startAt = 0, pos = readCourse().podpos, at = chapterStart();
      if (done) startAt = L.dur;
      else if (at != null) startAt = at;
      else if (pos && pos.t != null) {
        // Pick up at the start of the sentence that was playing.
        startAt = pos.t;
        L.sents.forEach(function (st) { if (st.s <= pos.t) startAt = st.s; });
      }
      audio.addEventListener('loadedmetadata', function () {
        try { audio.currentTime = Math.min(startAt, L.dur); } catch (e) {}
        tick();
        // In the admin preview's design view the big screen waits for Play.
        var auto = !PE || PE.autoplay;
        if (!done && auto) audio.play().catch(function () { setPlaying(false); });
      }, { once: true });
      if (done) ctx.enableNext();
    }

    play.addEventListener('click', function () {
      if (!L) return;
      if (audio.paused) {
        if (audio.ended || audio.currentTime >= L.dur - .05) audio.currentTime = 0;   // replay the same listen
        audio.play().catch(function () {});
      } else audio.pause();
    });
    back.addEventListener('click', function () { audio.currentTime = Math.max(0, audio.currentTime - 15); tick(); });
    audio.addEventListener('play', function () { setPlaying(true); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); });
    audio.addEventListener('pause', function () { setPlaying(false); save(true); tick(); });
    audio.addEventListener('timeupdate', function () { save(false); });
    audio.addEventListener('ended', finish);
    window.addEventListener('pagehide', function () { save(true); });
    window.addEventListener('resize', function () { if (canvas.isConnected) tick(); });

    // Chapters: over the stage, closed by the same button, its own ×, or Esc.
    function chapters(open) {
      chPanel.hidden = !open;
      chBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      stage.classList.toggle('is-ch-open', open);
      (open ? $('epChClose') : chBtn).focus({ preventScroll: true });
    }
    chBtn.addEventListener('click', function () { chapters(chPanel.hidden); });
    $('epChClose').addEventListener('click', function () { chapters(false); });
    chPanel.addEventListener('keydown', function (e) { if (e.key === 'Escape') chapters(false); });

    // Review-mode skip: to the last 5 seconds.
    var skip = $('epSkip');
    skip.hidden = !LE.reviewMode();
    skip.addEventListener('click', function () {
      if (!L) return;
      audio.currentTime = Math.max(0, L.dur - 5); audio.play().catch(function () {});
    });

    // The lock screen: play and pause, nothing that moves the playhead
    // forward.
    if (ms) {
      try {
        ms.setActionHandler('play', function () { audio.play().catch(function () {}); });
        ms.setActionHandler('pause', function () { audio.pause(); });
        ['seekforward', 'seekto', 'nexttrack', 'previoustrack', 'seekbackward'].forEach(function (a) {
          try { ms.setActionHandler(a, null); } catch (e) {}
        });
      } catch (e) {}
    }

    // Stop, let go of the lock screen and free the rendered file when the
    // step is torn down.
    var stageRoot = document.querySelector('.ll-stage');
    if (stageRoot && window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (document.body.contains(audio)) return;
        mo.disconnect(); torn = true; save(true); audio.pause(); cancelAnimationFrame(raf);
        if (url) { audio.removeAttribute('src'); URL.revokeObjectURL(url); }
        if (ms) try { ms.metadata = null; ms.setActionHandler('play', null); ms.setActionHandler('pause', null); } catch (e) {}
      });
      mo.observe(stageRoot, { childList: true });
    }
    build();
  }

  // ---- The questions ---------------------------------------------------------
  // Every chapter's question, straight after the episode, as ONE stack in the
  // pre-check's own card-stack look (2026-09-25 review) — its own screen with
  // its own purpose, rather than walking back through each chapter's page
  // with a question laid over it. The questions, their answers and feedback
  // are the deck's (deckCheck), saved under the same keys the screen-by-
  // screen path uses, so remediation routes off them unchanged.
  //
  // Knowledge questions give the deck's verdict in the card and wait for
  // "Next question"; agreement and insight items have no verdict and move on
  // by themselves, like the pre-check. The last card hands straight on to
  // the next step. The stack mechanics mirror batteryInit's (same markup,
  // same depth classes), trimmed to the two formats the deck's checks use.
  function PODCHECK_CONTENT() {
    // .sh-podcheck: these are the deck's long scenario stems, not the
    // pre-check's one-liners, so they take the deck question card's type
    // size (clara/sharps.html) rather than the pre-check's headline size.
    return BATTERY_CONTENT.replace('<main class="ll-object">', '<main class="ll-object sh-podcheck">').replace(
      '<button class="bl-check" id="blCheck"',
      '<p class="dk-fb bl-fb" id="blFb" role="status" hidden></p><button class="bl-check" id="blCheck"');
  }
  // One question per topic that has one (config.checks), in the order the
  // topics played, using the deck screen that matches the version that
  // played (k2 harder → the harder case's question). Titles are the
  // manifest's chapter titles, so the stack names what the learner heard.
  function podcheckItems() {
    if (!LD()) return [];
    var checks = LD().config.checks || {}, topics = LD().manifest.topics;
    return resolveListen(listenResults(), LD()).map(function (p) {
      var c = checks[p.topic];
      if (!c || p.how === 'skip') return null;   // a part the learner tested out of asks nothing
      var deckId = c[p.how] || c.normal;
      return { id: deckId, topic: p.topic, role: c.role, title: topicTitle(p.topic, LD()),
               q: deckHas(deckId) ? deckCheck(deckFor(deckId)) : null };
    }).filter(function (it) { return it && it.q; });
  }
  function podcheckInit(ctx) {
    ctx.setCoachSay('');
    ctx.floatClose();
    ctx.disableNext();
    if (!LD()) {
      loadListenData().then(function () { if (document.getElementById('blAsk')) podcheckInit(ctx); })
        .catch(function () { document.getElementById('blQ').textContent = 'The questions couldn\u2019t be loaded. Reload the page to try again.'; });
      return;
    }
    checkStack(ctx, podcheckItems(), 'podcast', 'podcheck');
  }
  // The stack itself, shared by Listening and Reading (readcheckInit): the
  // items, the carrier saved with each answer, and the key marking it done.
  // An item without a title shows just "Question N of M".
  function checkStack(ctx, items, carrier, doneKey) {
    var n = items.length;
    var askEl = document.getElementById('blAsk');
    var stepEl = document.getElementById('blStep');
    var qEl = document.getElementById('blQ');
    var optsEl = document.getElementById('blOptions');
    var checkEl = document.getElementById('blCheck');
    var fbEl = document.getElementById('blFb');
    var dotsEl = document.getElementById('blDots');
    var near = document.getElementById('blPeek1');
    var far = document.getElementById('blPeek2');
    var MISS = 'Let’s dig into this again from a slightly different lens.';

    function eyebrow(i) { return 'Question ' + (i + 1) + ' of ' + n + (items[i].title ? ' · ' + items[i].title : ''); }
    function answerHtml(q, live) {
      return q.kind === 'likert' ? likertHtml(live) : mcqHtml(q.options, live);
    }
    function setPeekContent(el, i, withFb) {
      if (!el) return;
      var it = items[i];
      if (!it) { el.hidden = true; return; }
      el.hidden = false;
      el.innerHTML = '<p class="ll-eyebrow">' + esc(eyebrow(i)) + '</p>' +
        '<h2 class="bl-q">' + esc(it.q.stem) + '</h2>' +
        answerHtml(it.q, false) +
        // Measuring only: the tallest card is a knowledge question WITH its
        // feedback showing, and the stage has to hold that without moving.
        (withFb && it.q.kind === 'mcq'
          ? '<p class="dk-fb"><strong class="dk-fb-h">Correct</strong><span class="dk-fb-b">' + esc(it.q.okFb || MISS) + '</span></p>'
          : '') +
        '<button class="bl-check" type="button" disabled>Submit answer</button>';
    }
    // Same as batteryInit's: the stage is pinned to its tallest card, so the
    // page never re-centres as cards of different heights come forward.
    function pinStageHeight() {
      var stageEl = document.getElementById('blStage');
      var ruler = document.createElement('div');
      ruler.className = 'bl-peek sh-battery bl-ruler';
      ruler.setAttribute('aria-hidden', 'true');
      stageEl.appendChild(ruler);
      var max = 0;
      for (var k = 0; k < n; k++) {
        setPeekContent(ruler, k, true);
        max = Math.max(max, ruler.getBoundingClientRect().height);
      }
      stageEl.removeChild(ruler);
      var padTop = parseFloat(getComputedStyle(stageEl).paddingTop) || 0;
      stageEl.style.minHeight = Math.ceil(padTop + max + 8) + 'px';
    }
    function renderDots(i) {
      dotsEl.innerHTML = items.map(function (_, k) {
        return '<span class="bl-dot' + (k < i ? ' is-done' : k === i ? ' is-now' : '') + '"></span>';
      }).join('');
    }
    function arm(el) {
      el.classList.remove('is-spent');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('tabindex');
    }
    function spend(el) {
      el.classList.add('is-spent');
      el.disabled = true;
      el.setAttribute('aria-hidden', 'true');
      el.tabIndex = -1;
    }
    function advance(i) {
      if (i + 1 < n) swapTo(i + 1); else done();
    }
    function render(i) {
      var q = items[i].q;
      renderDots(i);
      stepEl.textContent = eyebrow(i);
      qEl.textContent = q.stem;
      fbEl.hidden = true; fbEl.className = 'dk-fb bl-fb'; fbEl.innerHTML = '';
      optsEl.removeAttribute('role');
      optsEl.className = 'bl-deck';
      optsEl.innerHTML = answerHtml(q, true);
      optsEl.firstChild.setAttribute('aria-labelledby', 'blQ');
      arm(checkEl);
      checkEl.hidden = false;
      checkEl.textContent = q.kind === 'mcq' ? 'Check answer' : 'Submit answer';
      // A long stem plus four options can run past the footer on a short
      // window; once an answer is picked, bring Check answer up into view.
      optsEl.onclick = function () { if (!checkEl.disabled) clearFooter(checkEl); };
      wireChoice(optsEl.firstChild, checkEl, function (v, picked) {
        if (q.kind === 'mcq') {
          // The deck screen's own verdict: in words both ways, the right
          // answer not revealed on a miss (the remedial content comes next).
          var ok = v === q.correct;
          csMark(picked, ok ? 'ok' : 'bad');
          if (!ok) csTag(picked, 'Your answer');
          var body = ok ? q.okFb : (q.noFb || MISS);
          fbEl.innerHTML = '<strong class="dk-fb-h"><i class="fa-solid ' + (ok ? 'fa-circle-check' : 'fa-circle-xmark') +
              '" aria-hidden="true"></i> ' + (ok ? 'Correct' : 'Not quite') + '</strong>' +
            (body ? '<span class="dk-fb-b">' + esc(body) + '</span>' : '');
          fbEl.className = 'dk-fb bl-fb ' + (ok ? 'is-ok' : 'is-bad');
          fbEl.hidden = false;
          // On a short window the verdict (and Next question under it) can
          // land under the fixed footer — bring them up into view.
          clearFooter(checkEl);
          saveResult(q.key, { variant: q.variant, passed: ok, picked: v, carrier: carrier });
          checkEl.textContent = i + 1 < n ? 'Next question' : 'Continue';
          checkEl.disabled = false;
          checkEl.onclick = function () { checkEl.onclick = null; spend(checkEl); advance(i); };
          checkEl.focus({ preventScroll: true });
          return;
        }
        spend(checkEl);
        if (q.kind === 'insight') {
          csMark(picked, 'neutral');
          saveResult(q.key, { picked: v, answer: q.options[v].t, carrier: carrier });
        } else {
          picked.classList.add('is-picked');
          saveResult(q.key, { score: v, carrier: carrier });
        }
        setTimeout(function () { advance(i); }, T(700));
      });
    }
    function snapDepth(el, depthClass) {
      el.className = 'bl-peek sh-battery no-anim ' + depthClass;
      void el.offsetWidth;
      el.classList.remove('no-anim');
    }
    function swapTo(i) {
      askEl.classList.add('is-leaving');
      near.classList.remove('depth1'); near.classList.add('depth0');
      far.classList.remove('depth2'); far.classList.add('depth1');
      setTimeout(function () {
        if (!askEl.isConnected) return;
        render(i);
        // The last answer may have scrolled the page to show its verdict —
        // the next question starts from the top, not halfway down.
        var host = document.querySelector('.ll-object.sh-podcheck');
        if (host) host.scrollTop = 0;
        askEl.classList.add('no-anim');
        askEl.classList.remove('is-leaving');
        void askEl.offsetWidth;
        askEl.classList.remove('no-anim');
        snapDepth(near, 'depth2');
        setPeekContent(near, i + 2);
        var tmp = near; near = far; far = tmp;
      }, T(440));
    }
    // Like the pre-check's last card: it drops off, and the module moves on.
    function done() {
      saveResult(doneKey, { done: true });
      askEl.classList.add('is-dropping');
      dotsEl.classList.add('is-gone');
      ctx.enableNext();
      setTimeout(function () { if (askEl.isConnected) ctx.els.next.click(); }, T(380));
    }

    render(0);
    setPeekContent(near, 1); near.className = 'bl-peek sh-battery depth1';
    setPeekContent(far, 2); far.className = 'bl-peek sh-battery depth2';
    pinStageHeight();
    // Rotating a phone or resizing the window changes how tall every card is.
    window.addEventListener('resize', function () { if (document.getElementById('blStage')) pinStageHeight(); });
  }

  // ---- The review set ----------------------------------------------------------
  // After the questions, for each KNOWLEDGE question missed (config.checks
  // role "knowledge"): that topic's fact cards (data/sharps-listen/review/),
  // an optional recap (the manifest's quickTakes — the only audio on this
  // screen, and only when pressed), then a retry of the same question.
  // Exit rule from config.review.retries: one retry, then on either way. The
  // retry is recorded under the topic's retryKey; the original miss stays.
  //
  // LISTEN_FEEL_HOOK: belief/norm misses (f1, f3 — role "belief") get no
  // review yet. When they do, add their topics to config.review.topics and
  // widen listenMissed() below past role "knowledge".
  function listenMissed() {
    if (!LD()) {
      // Before the manifest is in (a reload straight onto this step): any
      // saved check marked failed.
      var c = readCourse();
      return Object.keys(c).filter(function (k) { return /check$/.test(k) && c[k] && c[k].passed === false; });
    }
    var topics = (LD().config.review || {}).topics || {};
    return podcheckItems().filter(function (it) {
      var r = readCourse()[it.q.key];
      return it.role === 'knowledge' && topics[it.topic] && r && r.passed === false;
    });
  }
  function REVIEW_CONTENT() {
    return '<main class="ll-object po-object rv-object"><div class="po rv" id="rv" aria-live="polite"></div></main>';
  }
  function reviewInit(ctx) {
    ctx.setCoachSay('');
    ctx.floatClose();
    ctx.disableNext();
    var root = document.getElementById('rv');
    if (!LD()) {
      root.innerHTML = '<p class="rv-note">Loading…</p>';
      loadListenData().then(function () { if (root.isConnected) reviewInit(ctx); })
        .catch(function () { root.innerHTML = '<p class="rv-note">The review couldn’t be loaded. Reload the page to try again.</p>'; });
      return;
    }
    LE.refreshNav(); ctx.disableNext();   // the caption's trace, now the data is in
    var cfg = LD().config.review || {}, queue = listenMissed(), qi = 0;
    var recapAudio = null;
    function stopRecap() { if (recapAudio) { recapAudio.pause(); recapAudio = null; } }
    function next() {
      stopRecap();
      qi++;
      if (qi < queue.length) cards(); else { ctx.enableNext(); ctx.els.next.click(); }
    }
    function head(it) {
      return '<p class="ll-eyebrow">Review' + (queue.length > 1 ? ' · ' + (qi + 1) + ' of ' + queue.length : '') + '</p>' +
        '<h1 class="po-head">' + esc(it.title) + '</h1>';
    }
    // The fact cards, and the way to the retry.
    function cards() {
      var it = queue[qi], set = LD().cards[it.topic] || { cards: [] };
      var qt = (LD().manifest.quickTakes || {})[it.topic];
      root.innerHTML = head(it) +
        '<ol class="rv-cards">' + set.cards.map(function (c, i) {
          return '<li class="rv-card"><span class="rv-n" aria-hidden="true">' + (i + 1) + '</span><div>' +
            (c.head ? '<h2 class="rv-card-h">' + esc(c.head) + '</h2>' : '') +
            '<p>' + esc(c.body) + '</p></div></li>';
        }).join('') + '</ol>' +
        '<div class="rv-actions">' +
          (set.recap && qt ? '<button class="ep-back rv-recap" type="button" id="rvRecap">' +
            '<i class="fa-solid fa-volume-high" aria-hidden="true"></i><span>Hear a quick recap</span></button>' : '') +
          '<button class="bl-check rv-go" type="button" id="rvGo">Try the question again</button>' +
        '</div>';
      var rb = document.getElementById('rvRecap');
      if (rb) rb.addEventListener('click', function () {
        if (recapAudio && !recapAudio.paused) { recapAudio.pause(); return; }
        if (!recapAudio) {
          recapAudio = new Audio(audioUrl(qt.file, LD()));
          recapAudio.addEventListener('play', function () { rb.querySelector('span').textContent = 'Pause the recap'; rb.querySelector('i').className = 'fa-solid fa-pause'; });
          recapAudio.addEventListener('pause', function () { rb.querySelector('span').textContent = 'Hear a quick recap'; rb.querySelector('i').className = 'fa-solid fa-volume-high'; });
          recapAudio.addEventListener('error', function () { rb.querySelector('span').textContent = 'Recap unavailable'; rb.disabled = true; });
        }
        recapAudio.play().catch(function () {});
      });
      document.getElementById('rvGo').addEventListener('click', function () { stopRecap(); ask(0); });
      try { root.querySelector('.po-head').focus({ preventScroll: true }); } catch (e) {}
    }
    // The retry: the same question, saved under the topic's retryKey.
    function ask(attempt) {
      var it = queue[qi], q = it.q, key = ((cfg.topics || {})[it.topic] || {}).retryKey || (q.key + '-retry');
      var allowed = cfg.retries == null ? 1 : cfg.retries;
      root.innerHTML = head(it) +
        '<div class="rv-q">' +
          '<h2 class="cs-q cs-q--lead">' + esc(q.stem) + '</h2>' +
          mcqHtml(q.options, true) +
          '<p class="dk-fb rv-fb" id="rvFb" role="status" hidden></p>' +
          '<button class="bl-check" type="button" id="rvCheck" disabled>Check answer</button>' +
        '</div>';
      var host = root.querySelector('.dk-opts'), btn = document.getElementById('rvCheck'), fb = document.getElementById('rvFb');
      wireChoice(host, btn, function (v, picked) {
        var ok = v === q.correct, last = ok || attempt + 1 >= allowed;
        csMark(picked, ok ? 'ok' : 'bad');
        if (!ok) csTag(picked, 'Your answer');
        if (!ok && last) {
          var right = host.querySelectorAll('.cs-opt')[q.correct];
          csMark(right, 'ok'); csTag(right, 'Correct answer');
        }
        var body = ok ? q.okFb : last ? '' : (q.noFb || 'Let’s dig into this again from a slightly different lens.');
        fb.innerHTML = '<strong class="dk-fb-h"><i class="fa-solid ' + (ok ? 'fa-circle-check' : 'fa-circle-xmark') +
            '" aria-hidden="true"></i> ' + (ok ? 'Correct' : 'Not quite') + '</strong>' +
          (body ? '<span class="dk-fb-b">' + esc(body) + '</span>' : '');
        fb.className = 'dk-fb rv-fb ' + (ok ? 'is-ok' : 'is-bad');
        fb.hidden = false;
        saveResult(key, { variant: q.variant, passed: ok, picked: v, attempt: attempt + 1, carrier: 'listen-review' });
        btn.textContent = last ? (qi + 1 < queue.length ? 'Next review' : 'Continue') : 'Try again';
        btn.disabled = false;
        btn.onclick = function () { if (last) next(); else ask(attempt + 1); };
        btn.focus({ preventScroll: true });
      });
    }
    if (!queue.length) { ctx.enableNext(); root.innerHTML = '<p class="rv-note">Nothing to review.</p>'; return; }
    cards();
    var stageRoot = document.querySelector('.ll-stage');
    if (stageRoot && window.MutationObserver) {
      var mo = new MutationObserver(function () { if (!root.isConnected) { mo.disconnect(); stopRecap(); } });
      mo.observe(stageRoot, { childList: true });
    }
  }

  // ---- Completion ---------------------------------------------------------------
  // The listen hands back to the screen here; the results come next.
  function LISTENDONE_CONTENT() {
    return '<main class="ll-object po-object"><div class="po">' +
      '<div class="po-top">' +
        '<h1 class="po-head">Listen mode complete</h1>' +
        '<p class="po-sub">Your results are next.</p>' +
      '</div>' +
    '</div></main>';
  }
  function listendoneInit(ctx) { ctx.setCoachSay(''); ctx.floatClose(); ctx.enableNext(); }

  // ---- Reviewer tools ------------------------------------------------------------
  // Scenario switcher: the listens the pre-check can build, as Demo-menu
  // values — 5.1 answered right or not (skipped, or the test-up when Skip
  // ahead is off), 5.3 agreement low or not — and 0–1 missed knowledge checks.
  var LISTEN_COMBOS = [
    { value: 'n',  label: 'Full listen', results: { k1: { correct: false }, f1: { score: 4 } } },
    { value: 'T',  label: '5.1 right · skipped or test-up', results: { k1: { correct: true }, f1: { score: 4 } } },
    { value: 'R',  label: '5.3 low · remedial chapter', results: { k1: { correct: false }, f1: { score: 2 } } },
    { value: 'TR', label: '5.1 right and 5.3 low', results: { k1: { correct: true }, f1: { score: 2 } } }
  ];
  function listenComboNow() {
    var r = listenResults();
    return ((r.k1 || {}).correct ? 'T' : '') + ((r.f1 || {}).score != null && r.f1.score <= 3 ? 'R' : '') || 'n';
  }
  var LISTEN_RESULT_KEYS = ['k1check', 'k2check', 'f1post', 'k1recheck', 'podcheck', 'podcast', 'podpos'];
  function setListenCombo(v) {
    var c = LISTEN_COMBOS.filter(function (x) { return x.value === v; })[0];
    if (!c) return;
    LISTEN_RESULT_KEYS.forEach(function (k) { saveResult(k, null); });
    saveResult('podpath', { podcast: true, results: c.results });
    LE.goTo('podcast');
  }
  function setListenMisses(v) {
    if (!LD()) return;
    var miss = v === 'k1' ? ['k1'] : [];
    saveResult('k1recheck', null);
    podcheckItems().forEach(function (it) {
      var q = it.q;
      if (q.kind === 'mcq') saveResult(q.key, { variant: q.variant, passed: miss.indexOf(it.topic) < 0,
        picked: miss.indexOf(it.topic) < 0 ? q.correct : (q.correct + 1) % q.options.length, carrier: 'podcast' });
      else if (q.kind === 'insight') saveResult(q.key, { picked: 0, answer: q.options[0].t, carrier: 'podcast' });
      else saveResult(q.key, { score: 4, carrier: 'podcast' });
    });
    saveResult('podcast', { done: true });
    saveResult('podcheck', { done: true });
    if (!LE.goTo(miss.length ? 'listenreview' : 'listendone')) LE.goTo('record');
  }

  // Splice test: about 8 s either side of each join of a spliced topic, with
  // seamAt nudgeable and shown in manifest form to copy back. "Use for this
  // listen" applies the value for this session only (sh-seam-<topic>).
  function spliceTest(api) {
    var old = document.getElementById('spPanel');
    if (old) { old.remove(); return; }
    loadListenData().then(function (data) {
      var topics = Object.keys(data.manifest.topics).filter(function (t) {
        var d = data.manifest.topics[t]; return d.addon && d.seamAt != null;
      });
      if (!topics.length) return;
      var ac = null, bufs = {}, playing = [];
      var el = document.createElement('div');
      el.id = 'spPanel'; el.className = 'sp-panel';
      el.innerHTML =
        '<div class="sp-head"><b>Splice test</b><span>Review only</span>' +
          '<button type="button" class="ep-ch-close" id="spClose" aria-label="Close splice test"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
        '<label class="sp-row">Topic <select id="spTopic">' + topics.map(function (t) {
          return '<option value="' + t + '">' + esc(t + ' — ' + (data.manifest.topics[t].title || '')) + '</option>';
        }).join('') + '</select></label>' +
        '<label class="sp-row">seamAt <input id="spSeam" type="number" step="0.05" min="0" />' +
          '<button type="button" class="ep-back" data-n="-0.1">−0.1</button><button type="button" class="ep-back" data-n="0.1">+0.1</button></label>' +
        '<div class="sp-row sp-btns">' +
          '<button type="button" class="ep-back" id="spIn"><i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> Into the add-on</button>' +
          '<button type="button" class="ep-back" id="spOut"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Out of the add-on</button>' +
          '<button type="button" class="ep-back" id="spStop">Stop</button></div>' +
        '<code class="sp-code" id="spCode"></code>' +
        '<div class="sp-row sp-btns">' +
          '<button type="button" class="ep-back" id="spUse">Use for this listen</button>' +
          '<button type="button" class="ep-back" id="spReset">Back to the manifest</button></div>' +
        '<p class="sp-note" id="spNote"></p>';
      document.body.appendChild(el);
      var topicEl = el.querySelector('#spTopic'), seamEl = el.querySelector('#spSeam');
      var code = el.querySelector('#spCode'), note = el.querySelector('#spNote');
      function show() {
        var t = topicEl.value, man = data.manifest.topics[t].seamAt;
        if (seamEl.dataset.t !== t) { seamEl.value = seamFor(t, data); seamEl.dataset.t = t; }
        code.textContent = '"seamAt": ' + (+seamEl.value).toFixed(2);
        var o = null; try { o = sessionStorage.getItem('hz-seam-' + t); } catch (e) {}
        note.textContent = 'Manifest: ' + man + 's' + (o != null ? ' · this session uses ' + o + 's' : '');
      }
      function load(f) {
        if (bufs[f]) return Promise.resolve(bufs[f]);
        return fetch(audioUrl(f, data)).then(function (r) { return r.arrayBuffer(); })
          .then(function (ab) { return ac.decodeAudioData(ab); }).then(function (b) { bufs[f] = b; return b; });
      }
      function stop() { playing.forEach(function (s) { try { s.stop(); } catch (e) {} }); playing = []; }
      function hear(into) {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        stop();
        var d = data.manifest.topics[topicEl.value], seam = +seamEl.value, fade = (data.manifest.spliceFadeMs || 25) / 1000;
        Promise.all([load(d.normal.file), load(d.addon.file)]).then(function (b) {
          var n = b[0], a = b[1], t0 = ac.currentTime + .1, parts;
          parts = into ? [[n, Math.max(0, seam - 8), Math.min(8, seam)], [a, 0, Math.min(6, a.duration)]]
                       : [[a, Math.max(0, a.duration - 6), Math.min(6, a.duration)], [n, seam, Math.min(8, n.duration - seam)]];
          parts.forEach(function (p) {
            var s = ac.createBufferSource(), g = ac.createGain();
            s.buffer = p[0];
            g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + fade);
            g.gain.setValueAtTime(1, t0 + p[2] - fade); g.gain.linearRampToValueAtTime(0, t0 + p[2]);
            s.connect(g); g.connect(ac.destination); s.start(t0, p[1], p[2]);
            playing.push(s); t0 += p[2];
          });
        });
      }
      topicEl.addEventListener('change', show);
      seamEl.addEventListener('input', show);
      [].forEach.call(el.querySelectorAll('[data-n]'), function (b) {
        b.addEventListener('click', function () { seamEl.value = Math.max(0, +seamEl.value + +b.dataset.n).toFixed(2); show(); });
      });
      el.querySelector('#spIn').addEventListener('click', function () { hear(true); });
      el.querySelector('#spOut').addEventListener('click', function () { hear(false); });
      el.querySelector('#spStop').addEventListener('click', stop);
      el.querySelector('#spUse').addEventListener('click', function () {
        try { sessionStorage.setItem('hz-seam-' + topicEl.value, (+seamEl.value).toFixed(2)); } catch (e) {}
        show(); stop(); if (api) api.replay();
      });
      el.querySelector('#spReset').addEventListener('click', function () {
        try { sessionStorage.removeItem('hz-seam-' + topicEl.value); } catch (e) {}
        seamEl.dataset.t = ''; show(); stop(); if (api) api.replay();
      });
      el.querySelector('#spClose').addEventListener('click', function () { stop(); el.remove(); });
      show();
    }).catch(function () {});
  }

  // ==========================================================================
  //  PRE-MODULE BATTERY — four items, and the composition is the point:
  //  gate-flagged Know and remediate-flagged Feel. NEVER a Do objective,
  //  because a question cannot credibly measure behavior.
  // ==========================================================================
  var BATTERY_CONTENT =
    '<main class="ll-object">' +
      // Card-STACK shell (sharps-only — see the CSS comment in
      // clara/sharps.html for why this doesn't live in the shared
      // css/layered-beats.css .bl-* pattern). Dots read the set size up
      // front. Two static preview cards sit behind #blAsk, receding
      // (smaller/dimmer/higher, Time-Machine style) — see swapTo() for how
      // their roles ping-pong as the stack advances.
      '<div class="bl-carousel" id="blCarousel">' +
        '<div class="bl-dots" id="blDots" role="presentation"></div>' +
        '<div class="bl-stage" id="blStage">' +
          '<div class="bl-ask sh-battery" id="blAsk">' +
            '<p class="ll-eyebrow" id="blStep">Quick question: 1 of 5</p>' +
            // The situation, when there is one. The module's case screens already
            // separate the setup from the question it leads to; a stem carrying
            // both broke across two lines mid-sentence, which is what this fixes.
            '<p class="bl-scene" id="blScene" hidden></p>' +
            '<h2 class="bl-q" id="blQ"></h2>' +
            '<p class="bl-hint" id="blHint" hidden></p>' +
            '<div class="bl-options" id="blOptions" role="radiogroup" aria-labelledby="blQ"></div>' +
            // Choosing and answering are two acts. Shown DISABLED from the start
            // rather than appearing on selection, so the second step is visible
            // before the learner commits to anything — the point is that a tap
            // cannot score them by accident.
            '<button class="bl-check" id="blCheck" type="button" hidden disabled></button>' +
          '</div>' +
          // Static previews of the ACTUAL upcoming questions — same
          // classes as #blAsk (via setPeekContent), so each is
          // pixel-identical in content and typography to what it becomes.
          // Never interactive: options render as plain elements, not
          // buttons, and aria-hidden keeps them out of the accessibility
          // tree — a question only becomes real (and reachable) once it's
          // promoted into #blAsk. Which node holds "one behind" vs "two
          // behind" ping-pongs each turn; see swapTo().
          '<div class="bl-peek sh-battery" id="blPeek1" aria-hidden="true" hidden></div>' +
          '<div class="bl-peek sh-battery" id="blPeek2" aria-hidden="true" hidden></div>' +
        '</div>' +
      '</div>' +
    '</main>';
  // The 5.1 question, then the two 5.3 agreement statements — each its own
  // card in the stack.
  var BATTERY = [K1_PRE, F1_ITEM, F1B_ITEM];
  function batteryInit(ctx) {
    var res = { k1up: false, f1: null, f1b: null };
    var askEl = document.getElementById('blAsk');
    var stepEl = document.getElementById('blStep');
    var qEl = document.getElementById('blQ');
    var hintEl = document.getElementById('blHint');
    var optsEl = document.getElementById('blOptions');
    var checkEl = document.getElementById('blCheck');
    var sceneEl = document.getElementById('blScene');
    var dotsEl = document.getElementById('blDots');
    var k1 = [];
    // Time-machine stack: #blAsk is always the live, interactive depth-0
    // card. The two preview nodes are fixed DOM elements but their ROLE
    // (which one currently sits "one behind" vs "two behind") ping-pongs
    // every turn \u2014 see swapTo(). `near` always holds the question ABOUT to
    // be promoted (current index + 1); `far` holds the one behind that
    // (current index + 2).
    var near = document.getElementById('blPeek1');
    var far = document.getElementById('blPeek2');

    render(0);
    setPeekContent(near, 1); near.className = 'bl-peek sh-battery depth1';
    setPeekContent(far, 2); far.className = 'bl-peek sh-battery depth2';
    pinStageHeight();
    // Rotating a phone or resizing the window changes how tall every card is.
    window.addEventListener('resize', function () { if (document.getElementById('blStage')) pinStageHeight(); });

    // .ll-object (the page's own wrapper) vertically centres on its TOTAL
    // content height — fine for a static screen, but the order task (K1)
    // renders noticeably taller than the three multiple-choice items, so
    // without this the whole page visibly re-centres, not just the card,
    // every time a turn promotes a differently-sized question. Measured
    // once against the real BATTERY content rather than hardcoded, so a
    // future copy edit that makes some question taller can't silently
    // reintroduce the jump. #blStage stays this height regardless of which
    // question is live; align-items:flex-start (added alongside this in
    // the CSS) keeps #blAsk at its own natural height inside it rather
    // than stretching to fill the reserved space.
    function pinStageHeight() {
      var stageEl = document.getElementById('blStage');
      if (!stageEl) return;
      var ruler = document.createElement('div');
      ruler.className = 'bl-peek sh-battery bl-ruler';
      ruler.setAttribute('aria-hidden', 'true');
      stageEl.appendChild(ruler);
      var max = 0;
      for (var n = 0; n < BATTERY.length; n++) {
        setPeekContent(ruler, n);
        max = Math.max(max, ruler.getBoundingClientRect().height);
      }
      stageEl.removeChild(ruler);
      var padTop = parseFloat(getComputedStyle(stageEl).paddingTop) || 0;
      stageEl.style.minHeight = Math.ceil(padTop + max + 8) + 'px';
    }

    // One dot per question \u2014 filled for what's answered, enlarged on the
    // current one, hollow for what's ahead. Lives outside .bl-stage so it
    // never moves with the cards; it is the one piece of "where am I in
    // the set" chrome that stays put while the stack advances underneath it.
    function renderDots(i) {
      if (!dotsEl) return;
      dotsEl.innerHTML = BATTERY.map(function (_, n) {
        return '<span class="bl-dot' + (n < i ? ' is-done' : n === i ? ' is-now' : '') + '"></span>';
      }).join('');
    }

    // Fills a preview node with the ACTUAL question `i` \u2014 same
    // stem/hint/options markup as #blAsk, so at whatever depth it's sitting
    // at it reads as a real card glimpsed from behind, not a stand-in.
    // Every option renders as a plain element, never a <button>, so
    // nothing inside is a tab stop even though the node's own aria-hidden
    // already pulls it out of the accessibility tree. Hidden outright once
    // there's no such question (the set is short, or we're near the end).
    function setPeekContent(el, i) {
      if (!el) return;
      var q = BATTERY[i];
      if (!q) { el.hidden = true; return; }
      el.hidden = false;
      var html = '<p class="ll-eyebrow">Quick question: ' + (i + 1) + ' of ' + BATTERY.length + '</p>';
      if (q.scene) html += '<p class="bl-scene">' + esc(q.scene) + '</p>';
      html += '<h2 class="bl-q">' + esc(q.stem) + '</h2>';
      if (q.hint) html += '<p class="bl-hint">' + esc(q.hint) + '</p>';
      if (q.type === 'mcq' || q.type === 'likert') {
        html += (q.type === 'mcq' ? mcqHtml(q.options, false) : likertHtml(false)) +
          '<button class="bl-check" type="button" disabled>Submit answer</button>';
      } else if (q.type === 'order') {
        // Numbered and with its own disabled "Check order" button — the
        // real render() shows both from the first frame (the list starts
        // in its unsolved, authored order; the button is visible-but-
        // disabled, not absent). Matching that here means promotion never
        // has to grow a control the learner didn't see coming.
        html += '<div class="ord-wrap"><ol class="ord-list">' + q.actions.map(function (a, n) {
          return '<li class="ord-item"><span class="ord-n">' + (n + 1) + '</span>' +
            '<i class="fa-solid fa-grip-vertical ord-grip" aria-hidden="true"></i>' +
            '<i class="fa-solid ' + a.icon + ' ord-ico" aria-hidden="true"></i>' +
            '<span class="ord-t">' + esc(a.t) + '</span>' +
            '<span class="ord-mv">' +
              '<button type="button" tabindex="-1"><i class="fa-solid fa-chevron-up"></i></button>' +
              '<button type="button" tabindex="-1"><i class="fa-solid fa-chevron-down"></i></button>' +
            '</span></li>';
        }).join('') + '</ol>' +
          '<button class="ord-check" type="button" disabled>Check order</button></div>';
      } else {
        // Same reasoning: the real check button is visible-but-disabled
        // from render(), never absent until a pick is made, so the preview
        // carries it too.
        html += '<div class="bl-options">' + q.options.map(function (o) {
          return '<div class="bl-option"><i class="fa-solid ' + o.icon + '" aria-hidden="true"></i>' +
            '<span class="bl-option-label">' + esc(o.t) + '</span></div>';
        }).join('') + '</div>' +
          '<button class="bl-check" type="button" disabled>' + esc(q.cta || 'Check answer') + '</button>';
      }
      el.innerHTML = html;
    }

    // A spent control keeps its space. Hiding it outright (or removing it)
    // shortened a centred column and shifted every line on the screen at the
    // exact moment the learner was reading the verdict.
    function spend(el) {
      if (!el) return;
      el.classList.add('is-spent');
      el.disabled = true;
      el.setAttribute('aria-hidden', 'true');
      el.tabIndex = -1;
    }
    // The counterpart. render() reuses the same button for every question, so
    // without this the spent state (and its visibility:hidden) rode straight
    // into the next one and the control rendered blank.
    function arm(el) {
      if (!el) return;
      el.classList.remove('is-spent');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('tabindex');
    }

    function render(i) {
      var q = BATTERY[i];
      renderDots(i);
      stepEl.textContent = 'Quick question: ' + (i + 1) + ' of ' + BATTERY.length;
      sceneEl.textContent = q.scene || '';
      sceneEl.hidden = !q.scene;
      qEl.textContent = q.stem;
      hintEl.textContent = q.hint || '';
      hintEl.hidden = !q.hint;
      // The ordering item carries its own commit control inside its markup.
      checkEl.hidden = true;
      if (q.type === 'order') { renderOrder(i, q); return; }
      if (q.type === 'mcq' || q.type === 'likert') { renderDeckItem(i, q); return; }
      optsEl.className = 'bl-options';
      optsEl.innerHTML = '';
      // `sel` is the pick BEFORE it counts. Nothing is recorded, nothing is
      // disabled and CLARA says nothing until the commit — the selected-state
      // CSS already lights the choice, so the learner can see what they have
      // chosen and change it. The old behaviour scored the first tap, which
      // made a mis-tap on an attitude item route content in with no undo.
      var sel = null, settled = false;
      arm(checkEl);
      checkEl.hidden = false;
      checkEl.disabled = true;
      checkEl.textContent = q.cta || 'Check answer';
      q.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'bl-option'; b.type = 'button';
        b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
        b.setAttribute('aria-label', opt.t);
        b.innerHTML = '<i class="fa-solid ' + opt.icon + '" aria-hidden="true"></i>' +
                      '<span class="bl-option-label">' + esc(opt.t) + '</span>';
        b.addEventListener('click', function () {
          if (settled) return;
          if (sel) sel.btn.setAttribute('aria-checked', 'false');
          sel = { btn: b, opt: opt };
          b.setAttribute('aria-checked', 'true');
          checkEl.disabled = false;
        });
        optsEl.appendChild(b);
      });
      LE.pickGroup(optsEl);
      // Assigned rather than added: render() runs once per question on the
      // same node, and a listener per question would fire for every earlier
      // one as well.
      checkEl.onclick = function () {
        if (settled || !sel) return;
        settled = true;
        spend(checkEl);
        optsEl.classList.add('answered');
        optsEl.querySelectorAll('.bl-option').forEach(function (o) {
          if (o !== sel.btn) o.disabled = true;
        });
        if (q.obj === 'K1') k1.push(sel.opt.score);
        if (q.obj === 'F1') res.f1 = sel.opt.score;
        if (q.obj === 'F1B') res.f1b = sel.opt.score;
        // This step carries no CLARA (noCoach, always — see the STEPS
        // entry): there's no reply to read between an answer and the next
        // card, so one click answers it. A brief pause shows the pick
        // register, then it advances on its own — select, confirm, next
        // question loads.
        setTimeout(function () {
          if (i + 1 < BATTERY.length) swapTo(i + 1); else done();
        }, T(700));
      };
    }
    // The deck's formats: a lettered multiple-choice list (slides 2–3) or a
    // 1–5 agreement scale (slide 4). No verdict on the pre-check — select,
    // submit, and the next card comes forward.
    function renderDeckItem(i, q) {
      optsEl.removeAttribute('role');
      optsEl.className = 'bl-deck';
      optsEl.innerHTML = q.type === 'mcq' ? mcqHtml(q.options, true) : likertHtml(true);
      optsEl.firstChild.setAttribute('aria-labelledby', 'blQ');
      arm(checkEl);
      checkEl.hidden = false;
      checkEl.textContent = 'Submit answer';
      wireChoice(optsEl.firstChild, checkEl, function (v) {
        spend(checkEl);
        if (q.obj === 'K1') res.k1up = v === q.correct;
        if (q.obj === 'F1') res.f1 = v;
        if (q.obj === 'F1B') res.f1b = v;
        setTimeout(function () {
          if (i + 1 < BATTERY.length) swapTo(i + 1); else done();
        }, T(700));
      });
    }
    // The three actions are on screen from the start, in the wrong order, and
    // the learner rearranges them. Nothing to place, so nothing to explain:
    // a drag handles a mouse, the arrow pair handles touch and keyboard, and
    // the order lives in the DOM rather than in a parallel array.
    function renderOrder(i, q) {
      optsEl.className = 'ord-wrap';
      var settled = false;
      optsEl.innerHTML =
        '<ol class="ord-list" id="ordList">' +
          q.actions.map(function (a) {
            return '<li class="ord-item" draggable="true" data-id="' + a.id + '">' +
              '<span class="ord-n"></span>' +
              '<i class="fa-solid fa-grip-vertical ord-grip" aria-hidden="true"></i>' +
              '<i class="fa-solid ' + a.icon + ' ord-ico" aria-hidden="true"></i>' +
              '<span class="ord-t">' + esc(a.t) + '</span>' +
              '<span class="ord-mv">' +
                '<button type="button" data-mv="-1" aria-label="Move “' + esc(a.t) + '” earlier"><i class="fa-solid fa-chevron-up"></i></button>' +
                '<button type="button" data-mv="1" aria-label="Move “' + esc(a.t) + '” later"><i class="fa-solid fa-chevron-down"></i></button>' +
              '</span></li>';
          }).join('') +
        '</ol>' +
        '<button class="ord-check" id="ordCheck" type="button">Check order</button>';

      var list = document.getElementById('ordList');
      var rows = function () { return [].slice.call(list.children); };
      renumber();

      // Renumbering after every move keeps the badges honest and parks the
      // arrows that would do nothing at the ends of the list.
      function renumber() {
        rows().forEach(function (li, n, all) {
          li.querySelector('.ord-n').textContent = n + 1;
          li.querySelector('[data-mv="-1"]').disabled = settled || n === 0;
          li.querySelector('[data-mv="1"]').disabled = settled || n === all.length - 1;
        });
      }
      list.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-mv]');
        if (!btn || settled) return;
        var li = btn.closest('.ord-item');
        if (btn.dataset.mv === '-1') list.insertBefore(li, li.previousElementSibling);
        else list.insertBefore(li, li.nextElementSibling.nextElementSibling);
        renumber();
        // Moving a row to an end disables the arrow you just pressed, which
        // would drop keyboard focus; hand it to the row's other arrow.
        (btn.disabled ? li.querySelector('[data-mv]:not(:disabled)') : btn).focus();
      });

      // Drag: move the node itself rather than re-rendering, or the element
      // under the cursor disappears mid-gesture.
      var dragging = null;
      list.addEventListener('dragstart', function (e) {
        var li = e.target.closest('.ord-item');
        if (!li || settled) { e.preventDefault(); return; }
        dragging = li; li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', li.dataset.id); } catch (err) {}
      });
      list.addEventListener('dragend', function () {
        if (dragging) dragging.classList.remove('dragging');
        dragging = null; renumber();
      });
      list.addEventListener('dragover', function (e) {
        if (!dragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        var after = null;
        rows().forEach(function (li) {
          if (li === dragging) return;
          var box = li.getBoundingClientRect();
          if (e.clientY < box.top + box.height / 2 && !after) after = li;
        });
        if (after) list.insertBefore(dragging, after);
        else list.appendChild(dragging);
        renumber();
      });
      list.addEventListener('drop', function (e) { e.preventDefault(); });

      document.getElementById('ordCheck').addEventListener('click', grade);

      function grade() {
        if (settled) return;
        settled = true;
        var right = true;
        rows().forEach(function (li, n) {
          var ok = q.correct[n] === li.dataset.id;
          if (!ok) right = false;
          li.classList.add(ok ? 'is-right' : 'is-wrong');
          li.draggable = false;
        });
        // Item 23: on a miss, show the correct order rather than leaving the
        // learner's own wrong arrangement on screen — the amber mark stays on
        // whichever rows they had misplaced, now sitting where they actually
        // belong, so the miss is legible against the right answer instead of
        // against nothing.
        if (!right) {
          var byId = {};
          rows().forEach(function (li) { byId[li.dataset.id] = li; });
          q.correct.forEach(function (id) { list.appendChild(byId[id]); });
        }
        list.classList.add('settled');
        renumber();
        spend(document.getElementById('ordCheck'));
        k1.push(right ? 2 : 0);
        // See the matching comment in checkEl.onclick above — same reasoning,
        // and this item is always BATTERY[0], so there is always a next card.
        setTimeout(function () { swapTo(i + 1); }, T(700));
      }
    }

    // Sets `el`'s depth class WITHOUT animating there — used to snap a
    // recycled preview node straight to its new resting depth the instant
    // a turn finishes, rather than animating a second time from wherever
    // it just arrived. Standard disable/reflow/re-enable dance.
    function snapDepth(el, depthClass) {
      el.classList.add('no-anim');
      el.className = 'bl-peek sh-battery no-anim ' + depthClass;
      void el.offsetWidth;
      el.classList.remove('no-anim');
    }

    function swapTo(i) {
      // Time-machine turn: `near` is ALREADY showing the real upcoming
      // question at depth 1 (one behind, smaller/dimmer/higher); `far`
      // already shows the one after that at depth 2. Advancing moves every
      // card exactly one depth step on the SAME transition — near to
      // depth0 (i.e., #blAsk's own resting look), far to depth1 — so
      // nothing changes format mid-flight, only scale/position/opacity.
      // #blAsk (just answered) isn't part of that motion, only what it
      // reveals: it simply fades out of the stack.
      askEl.classList.add('is-leaving');
      near.classList.remove('depth1'); near.classList.add('depth0');
      far.classList.remove('depth2'); far.classList.add('depth1');
      setTimeout(function () {
        // `near` has finished landing exactly at #blAsk's resting pose.
        // Render real, interactive content into #blAsk (still invisible)
        // and swap everything in the SAME tick: #blAsk snaps to visible at
        // depth 0 exactly as `near` snaps away — same content, same
        // position, so the handoff has nothing to show. `near` is then
        // recycled as the new depth-2 card (two behind); `far`, having
        // just arrived at depth 1, simply stays there. Their roles
        // ping-pong every turn.
        render(i);
        askEl.classList.add('no-anim');
        askEl.classList.remove('is-leaving');
        void askEl.offsetWidth;
        askEl.classList.remove('no-anim');
        snapDepth(near, 'depth2');
        setPeekContent(near, i + 2);
        var tmp = near; near = far; far = tmp;
      }, T(440));
    }
    function done() {
      // K1 → case 1 test-up, K2 → case 2 test-up, each from its own item
      // (already set in renderDeckItem). F1/F3 are the baselines the same
      // statements are compared against after case 3 and the debrief.
      stepEl.textContent = 'Quick questions: all ' + BATTERY.length + ' done';
      saveResult('battery', res);
      // 2026-09-25 (from Riff 07): the last card drops off the stack and the
      // module moves straight on to the path screen — the footer's Continue
      // was easy to miss once the last Submit had been pressed.
      askEl.classList.add('is-dropping');
      if (dotsEl) dotsEl.classList.add('is-gone');
      // The answers now decide the first Watch screen — start loading it.
      warmNextVideo('battery');
      ctx.enableNext();
      setTimeout(function () {
        if (askEl.isConnected) ctx.els.next.click();
      }, T(380));
    }
  }

  // ==========================================================================
  //  YOUR UPDATED PATH — 2026-09-24 live review: the row list is gone.
  //  Learners saw "Skipped" / "Adapted" beside section names and had no idea
  //  what adapted meant or why it happened (Chuck), and Rob agreed. The
  //  learner doesn't need to know what moved, only that something did. Two
  //  treatments, from experiments/sharps-riffs 03 and 02, picked from the
  //  Demo menu ("Path update style"):
  //
  //   calibrate (default) — "Calibrating your path…" over a progress bar,
  //                          then "You're all set, <name>" / "Let's continue…".
  //                          Says nothing about what moved.
  //   celebrate           — the same bar, then a playful reward: a flash,
  //                          one short confetti burst, a "Nice work" chip.
  //
  //  Celebrate only fires on a PROVEN knowledge answer (a harder case). When
  //  the only move is a longer case 3 / debrief (low agreement), the path got
  //  longer, and confetti for "here's more" would be wrong, so it falls back
  //  to calibrate. It carries no "time saved" figure: in this module a correct
  //  answer swaps a case for a harder one of about the same length and skips
  //  nothing, so there is no saved time to report.
  //
  //  The screen still only appears when something actually moved (adjustMoved).
  // ==========================================================================
  var ADJUST_CONTENT =
    '<main class="ll-object ll-object--crowned" id="adjustObject">' +
      '<canvas class="pu-confetti" id="puConfetti" aria-hidden="true"></canvas>' +
      '<div class="pu">' +
        '<div class="pu-load" id="puLoad">' +
          '<p class="pu-status">Calibrating your path…</p>' +
          '<div class="pu-track" role="progressbar" aria-label="Calibrating your path" ' +
            'aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="puTrack">' +
            '<div class="pu-fill" id="puFill"></div></div>' +
          '<p class="pu-pct" id="puPct" aria-hidden="true">0%</p>' +
        '</div>' +
        '<div class="pu-flash" id="puFlash" aria-hidden="true"></div>' +
        '<div class="pu-result" id="puResult" role="status"></div>' +
      '</div>' +
    '</main>';
  // One lookup per treatment: what lands once the bar fills.
  var PU_RESULT = {
    // A function, so it reads the learner's name at reveal time.
    calibrate: function () {
      var name = savedName();
      return '<p class="ll-eyebrow pu-eyebrow">You\u2019re all set' + (name ? ', ' + esc(name) : '') + '</p>' +
        '<h2 class="pu-head">Let\u2019s continue\u2026</h2>' +
        '<p class="pu-sub">This module has adapted to your answers.</p>';
    },
    celebrate:
      '<p class="pu-chip"><i class="fa-solid fa-trophy" aria-hidden="true"></i> Nice work</p>' +
      '<h2 class="pu-head">You already know the basics.</h2>' +
      '<p class="pu-sub">This module has adapted to your answers.</p>'
  };
  function pathUpdateStyle() {
    try { return sessionStorage.getItem('hz-path-style') === 'celebrate' ? 'celebrate' : 'calibrate'; }
    catch (e) { return 'calibrate'; }
  }
  // One row per routing decision the pre-check made (deck slides 2–4): a
  // correct knowledge answer swaps that case for its harder version, and a
  // low agreement swaps case 3 / the debrief for its longer version. Nothing
  // on screen lists these any more; they decide whether the screen runs at
  // all, and whether the celebrate treatment has earned its confetti.
  var ADJUST_ROWS = [
    { id: 'm501a', state: function () { return k1Out() ? 'skipped' : k1TestUp() ? 'harder' : 'kept'; } },
    { id: 'm503r', state: function () { return feelLow() ? 'expanded' : 'kept'; } }
  ];
  function adjustRows() {
    return ADJUST_ROWS.map(function (r) { return { id: r.id, state: r.state() }; });
  }

  // Did anything actually move? When the answer is no, this screen has no news
  // and the step drops out of the path — the same call the Bystander module
  // makes on its own version ("silence is the right output of an adaptive
  // system that decided not to act"). Without it, the learner on the LONGER
  // path pays an extra screen to be told that nothing happened.
  function adjustMoved() {
    return adjustRows().some(function (r) { return r.state !== 'kept'; });
  }

  function adjustInit(ctx) {
    var proven = adjustRows().some(function (r) { return r.state === 'harder' || r.state === 'skipped'; });
    var style = (pathUpdateStyle() === 'celebrate' && proven) ? 'celebrate' : 'calibrate';
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var load = document.getElementById('puLoad');
    var track = document.getElementById('puTrack');
    var fill = document.getElementById('puFill');
    var pct = document.getElementById('puPct');
    var result = document.getElementById('puResult');
    var DUR = T(1900);

    ctx.floatClose();
    ctx.setCoachSay('');

    // The bar and the number move together; ease-out so it settles rather
    // than ticking linearly toward 100.
    var t0 = null;
    function tick(ts) {
      if (!fill.isConnected) return;            // learner already moved on
      if (t0 === null) t0 = ts;
      var t = Math.min(1, (ts - t0) / DUR), v = Math.round((1 - Math.pow(1 - t, 3)) * 100);
      fill.style.width = v + '%';
      pct.textContent = v + '%';
      track.setAttribute('aria-valuenow', v);
      if (t < 1) requestAnimationFrame(tick); else setTimeout(reveal, T(180));
    }
    requestAnimationFrame(tick);

    function reveal() {
      if (!result.isConnected) return;
      load.classList.add('is-done');
      result.innerHTML = typeof PU_RESULT[style] === 'function' ? PU_RESULT[style]() : PU_RESULT[style];
      result.classList.add('in');
      if (style === 'celebrate' && !still) {
        document.getElementById('puFlash').classList.add('pop');
        puConfetti(document.getElementById('puConfetti'));
      }
      LE.refreshNav();
      ctx.enableNext();
    }
  }

  // One short burst from the two bottom corners, no library. Ported from
  // experiments/sharps-riffs/02-path-update-celebratory.html, where the
  // count and spread were already tuned down from "blizzard" to "two modest
  // fountains that stay mostly on their own side". The canvas sits under the
  // text, so particles frame the reward rather than covering it.
  function puConfetti(canvas) {
    if (!canvas || !canvas.getContext) return;
    var c = canvas.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    var COLORS = ['#2ee6cf', '#5aa9f6', '#f1b34a', '#c4b5fd', '#ff8fa8', '#ffffff'];
    var DURATION = 2500, per = Math.max(30, Math.min(60, Math.round(w / 22)));
    function burst(x0, dir) {
      var out = [];
      for (var i = 0; i < per; i++) {
        var speed = 13 + Math.random() * 13;
        var rad = (90 - (14 + Math.random() * 34)) * Math.PI / 180;
        var streamer = Math.random() < 0.25;
        out.push({ x: x0, y: h, vx: dir * Math.cos(rad) * speed, vy: -Math.sin(rad) * speed,
                   size: streamer ? 9 + Math.random() * 8 : 4 + Math.random() * 5, streamer: streamer,
                   rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.4,
                   color: COLORS[(Math.random() * COLORS.length) | 0],
                   rect: streamer || Math.random() < 0.55 });
      }
      return out;
    }
    var ps = burst(w * 0.06, 1).concat(burst(w * 0.94, -1)), start = null;
    function frame(ts) {
      if (!canvas.isConnected) return;
      if (start === null) start = ts;
      var el = ts - start, a = el > DURATION - 800 ? Math.max(0, (DURATION - el) / 800) : 1;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.scale(dpr, dpr);
      ps.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.vx *= 0.985; p.rot += p.vr;
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        c.globalAlpha = a; c.fillStyle = p.color;
        if (p.rect) {
          var len = p.streamer ? p.size * 2 : p.size;
          c.fillRect(-len / 2, -p.size * 0.28, len, p.size * 0.42);
        } else { c.beginPath(); c.arc(0, 0, p.size / 2, 0, Math.PI * 2); c.fill(); }
        c.restore();
      });
      if (el < DURATION) requestAnimationFrame(frame);
      else { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height); }
    }
    requestAnimationFrame(frame);
  }

  // ==========================================================================
  //  MODALITIES — capability 4, Transformation. The wrapper never moves: the
  //  battery, the cases, the simulation and the record are identical in all
  //  four. What varies is the INSTRUCTION in the middle, which in this module
  //  is exactly one beat — so the toggle doubles as proof of the invariant.
  //
  //  Podcast is DECLINED rather than rendered. This module carries under a
  //  minute of expository Know content, and a sixty-second audio file is not a
  //  podcast, it is a clip. Audio's honest unit is the COURSE — six modules
  //  assembled into one listen, carried by the sector narratives — which is
  //  Assembly, not Transformation. Declining is the stronger demonstration: a
  //  system that refuses to render badly is more credible than four green cells.
  // ==========================================================================

  // ==========================================================================
  //  THE VIDEO CARRIER — one implementation, two beats. Was inline in the
  //  procedure beat; the hazard beat needs the identical behaviour, and a
  //  second copy of a loader with this many failure modes is a second copy of
  //  its bugs.
  //
  //  Do NOT stream these. A <video> reading at playback rate dies against the
  //  preview server with MEDIA_ERR_NETWORK about two seconds in, every time,
  //  while curl and fetch pull the whole file in milliseconds. So fetch it
  //  whole and play it from a blob — after that the network is out of the
  //  picture. Same approach as the Bystander course's preloadVideoFully.
  //
  //  A missing clip is a NORMAL state here, not an error: placeholder paths
  //  are how a beat gets built before its video exists, so a 404 reveals the
  //  written version and unlocks Continue rather than stranding anyone.
  // ==========================================================================
  function videoFrame(o) {
    return '<div class="ll-media" id="' + o.ids.wrap + '">' +
        '<video id="' + o.ids.video + '" class="cv-video" controls playsinline ' +
          (o.poster ? 'poster="' + esc(o.poster) + '" ' : '') +
          'data-src="' + esc(o.src) + '"></video>' +
        '<div class="cv-loader" id="' + o.ids.wrap + 'Loader">' +
          '<div class="cv-spinner" aria-hidden="true"></div>' +
          '<div>Loading video… <b id="' + o.ids.pct + '">0%</b></div>' +
        '</div>' +
        '<button class="cv-skip" id="' + o.ids.skip + '" type="button" aria-label="Skip video">Skip <i class="fa-solid fa-forward"></i></button>' +
      '</div>' +
      '<p class="pr-vfall" id="' + o.ids.note + '" hidden></p>';
  }
  function mountVideo(ctx, o) {
    var v = document.getElementById(o.ids.video);
    var wrap = document.getElementById(o.ids.wrap);
    var note = document.getElementById(o.ids.note);
    var fallback = o.ids.fallback ? document.getElementById(o.ids.fallback) : null;

    function ready() { if (wrap) wrap.classList.add('is-ready'); }
    function toText(msg) {
      if (note) {
        note.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + msg;
        note.hidden = false;
      }
      if (fallback) fallback.hidden = false;
      if (wrap) wrap.hidden = true;
      ctx.enableNext();            // never strand someone behind a broken beat
      if (o.onFallback) o.onFallback();
    }

    if (!v) { toText('Showing the written version.'); return; }
    // A small slide in the admin preview viewer (js/preview-embed.js): the
    // titled poster stands in, and nothing downloads.
    if (window.PreviewEmbed && window.PreviewEmbed.thumb) { ready(); return; }

    var pct = document.getElementById(o.ids.pct);
    var url = v.dataset.src;

    // Fetching the whole file before playing is right for a short clip and
    // wrong for a long one: a 145 MB section video is a minutes-long spinner
    // and 145 MB of memory before a single frame. So ask how big it is first
    // and STREAM anything over the threshold. Streaming was avoided here
    // originally because it died with MEDIA_ERR_NETWORK against the preview
    // server; that no longer reproduces, and the blob path is still the
    // fallback if a stream errors, so the small-clip behaviour is unchanged.
    var STREAM_OVER = 25 * 1024 * 1024;
    // A clip on another origin (the CloudFront-hosted deck videos) always
    // streams: a CDN serves range requests properly, and downloading ~12 MB
    // whole before the first frame was a 10–15 second wait.
    var remote = /^https?:\/\//.test(url) && url.indexOf(location.origin) !== 0;
    fetch(url, { method: 'HEAD' }).then(function (h) {
      if (h.status === 404) { var e = new Error('missing'); e.missing = true; throw e; }
      return +h.headers.get('Content-Length') || 0;
    }).then(function (size) {
      if (remote || size > STREAM_OVER) { stream(size); return; }
      blobLoad();
    }).catch(function (err) {
      if (err && err.missing) { toText('No clip at <code>' + esc(o.src) + '</code> yet — showing the written version instead.'); return; }
      blobLoad();                // HEAD blocked or unsupported: old path
    });

    // Play as it arrives. One error and we fall back to downloading it whole.
    function stream(size) {
      var fellBack = false;
      v.addEventListener('error', function () {
        if (fellBack) return; fellBack = true;
        blobLoad();
      });
      // 'auto', not 'metadata': buffer ahead of the playhead from the start
      // instead of fetching only as playback reaches each part (a remote clip
      // streams; see `remote` above).
      v.preload = 'auto';
      v.src = url;
      ready();
      if (pct) pct.textContent = Math.round(size / 1048576) + ' MB';
    }

    function blobLoad() {
    fetch(url).then(function (resp) {
      if (resp.status === 404) { var e = new Error('missing'); e.missing = true; throw e; }
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var total = +resp.headers.get('Content-Length') || 0;
      if (!resp.body || !total) return resp.blob();
      var reader = resp.body.getReader(), chunks = [], got = 0;
      return (function pump() {
        return reader.read().then(function (r) {
          if (r.done) return new Blob(chunks, { type: 'video/mp4' });
          chunks.push(r.value); got += r.value.length;
          if (pct) pct.textContent = Math.round(got / total * 100) + '%';
          return pump();
        });
      })();
    }).then(function (blob) {
      v.src = URL.createObjectURL(blob);
      ready();
    }).catch(function (err) {
      if (err && err.missing) {
        toText('No clip at <code>' + esc(o.src) + '</code> yet — showing the written version instead.');
        return;
      }
      v.src = url;                 // last resort: stream it and hope
      ready();
    });
    }

    // Continue stays shut until the clip finishes. The skip is the prototype's
    // way past that, and is not a learner affordance — hidden unless review
    // mode is on, same as the S-key skip.
    v.addEventListener('play', function () { ctx.floatClose(); });
    v.addEventListener('ended', function () { ctx.enableNext(); if (o.onEnded) o.onEnded(); });
    var skip = document.getElementById(o.ids.skip);
    if (skip) skip.hidden = !LE.reviewMode();
    if (skip) skip.addEventListener('click', function () {
      ready();
      try { v.pause(); if (isFinite(v.duration) && v.duration > 0) v.currentTime = v.duration; } catch (e) {}
      v.dispatchEvent(new Event('ended'));
    });
  }

  //  ONE modality vocabulary, shared by every beat that offers a choice, so
  //  the labels and icons cannot drift between them. `label` is what a
  //  LEARNER sees on the picker button. `cost`/`tradeoff` are authored but
  //  currently unrendered — the picker used to state each carrier's length
  //  next to its label, which read as clutter once the control got this
  //  compact (see modalityDropdown below). Left in the table rather than
  //  deleted, since it's still true and may still be useful somewhere else
  //  (the Learning Layer view, a dev note) even though this UI stopped
  //  showing it.
  var MODALITIES = {
    video:   { label: 'Watch', icon: 'fa-circle-play',
               cost: '2 min',
               tradeoff: 'Two minutes, but you have to be looking at it.',
               note: 'The reference rendering — the point in the variant space the SME signed.' },
    article: { label: 'Read', icon: 'fa-file-lines',
               cost: '1 min',
               tradeoff: 'About a minute, skimmable, and you set the pace.',
               note: 'Pre-rendered. The same content, read rather than watched.' },
    // Label shortened to "Step" \u2014 the four-word version was the only one
    // of the four that didn't fit the compact picker/dropdown on one line.
    tutor:   { label: 'Step', icon: 'fa-comments',
               cost: 'Self-paced \u00b7 recall checks',
               tradeoff: 'Self-paced \u2014 CLARA checks your recall on each step instead of just telling you the next one.',
               note: 'CLARA walks the procedure one step at a time, pausing to check what you remember.' },
    podcast: { label: 'Read to me', icon: 'fa-volume-high',
               cost: 'Longest \u00b7 hands free',
               tradeoff: 'Runs while you do something else, but takes longer and stops to ask you things.',
               note: 'The narration read aloud, word-highlighted as it plays.' }
  };

  //  The chooser. One implementation, so a second beat offering a choice
  //  cannot invent a different one. A beat declares which keys it offers and
  //  in what order; every label comes from the table above.
  //
  //  It PERSISTS rather than gating. A one-shot chooser would either hide the
  //  default carrier behind a click or vanish once used, and both are worse:
  //  the learner arrives on the default and can still see, at any point,
  //  what the other option is.
  // `table` defaults to MODALITIES; the title page's mode card passes its own
  // (MODE_CARD — Watching / Listening / Reading) through the same picker.
  function modalityPicker(id, keys, table) {
    table = table || MODALITIES;
    return '<div class="md-pick" id="' + id + '" role="group" ' +
        'aria-label="How do you want to take this?">' +
      keys.map(function (k) {
        var m = table[k];
        return '<button class="md-opt" type="button" data-m="' + k + '" aria-pressed="false">' +
          '<i class="fa-solid ' + m.icon + '" aria-hidden="true"></i>' +
          '<span class="md-opt-t"><b>' + esc(m.label) + '</b></span>' +
        '</button>';
      }).join('') +
    '</div>';
  }

  //  THE DROPDOWN — same picker, collapsed. The three-way toggle used to sit
  //  open on every screen, which on the video carrier pushed a 16:9 player
  //  most of the way down the viewport. First fix reopened the exact same
  //  wide row behind a "Change" button, which still read as a full-width tab
  //  bar reappearing and still put real distance between the current pick
  //  and the control that changes it. This one instead REUSES the title-page
  //  rail's own "Preferred format" card verbatim — .cp-format-now/
  //  .cp-format-change/.cp-format-picker, the same markup and CSS, not a
  //  lookalike — and stacks the revealed list in a single compact column
  //  (.md-now .md-pick below) instead of the wide segmented row. .md-now
  //  only exists to opt OUT of .pr-wrap's stretch-to-680px so the control
  //  hugs its own content width the way it already does inside the rail's
  //  narrow card; the rail keeps using this same function so there is
  //  exactly one implementation, not three.
  //
  //  opts.corner pins the whole control to the top-right of the beat, over
  //  the content rather than in its own row — hazardInit/procedureInit pass
  //  it, the title-page rail (a setting among several cards, not a global
  //  page control) does not. See .md-now--corner in sharps.html.
  function modalityDropdown(ids, keys, opts, table) {
    var corner = opts && opts.corner;
    return '<div class="md-now' + (corner ? ' md-now--corner' : '') + '">' +
        '<div class="cp-format-now" id="' + ids.now + '">' +
          '<span class="cp-format-now-t"><i class="fa-solid" id="' + ids.icon + '" aria-hidden="true"></i>' +
            '<b id="' + ids.label + '"></b></span>' +
          '<button class="cp-format-change" type="button" id="' + ids.btn + '" ' +
            'aria-expanded="false" aria-controls="' + ids.wrap + '">' +
            'Change<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
        '</div>' +
        '<div class="cp-format-picker" id="' + ids.wrap + '" hidden>' + modalityPicker(ids.pick, keys, table) + '</div>' +
      '</div>';
  }
  // Wires the collapse/expand chrome only — picking an option still runs
  // through the caller's own click handling on the picker (show(m) for the
  // in-beat carriers, the rail's own sessionStorage write for the title
  // page); this just keeps the collapsed summary in sync, folds the list
  // back down once a pick lands, and closes it on an outside click.
  //
  // One document-level listener total, registered lazily and shared by
  // every dropdown this runs for (keyed by ids.wrap) — three separate
  // listeners would be harmless individually, but a beat revisited after
  // Back re-runs its init and would otherwise stack a fresh one per visit,
  // the exact trap the title-page rail's own outside-click code used to
  // guard against with a one-off flag. Re-registering the same key on a
  // revisit just replaces the stale DOM refs with the current ones.
  var modalityDropdowns = {};
  function initModalityDropdown(ids, table) {
    table = table || MODALITIES;
    var btn = document.getElementById(ids.btn), wrap = document.getElementById(ids.wrap);
    var icon = document.getElementById(ids.icon), label = document.getElementById(ids.label);
    function setOpen(v) { wrap.hidden = !v; btn.setAttribute('aria-expanded', v ? 'true' : 'false'); }
    btn.addEventListener('click', function () { setOpen(wrap.hidden); });
    modalityDropdowns[ids.wrap] = { btn: btn, wrap: wrap, close: function () { setOpen(false); } };
    if (!window.__modDropdownOutsideBound) {
      window.__modDropdownOutsideBound = true;
      document.addEventListener('click', function (e) {
        Object.keys(modalityDropdowns).forEach(function (key) {
          var d = modalityDropdowns[key];
          if (d.wrap.hidden || d.wrap.contains(e.target) || d.btn.contains(e.target)) return;
          d.close();
        });
      });
    }
    return {
      render: function (k) {
        var m = table[k];
        icon.className = 'fa-solid ' + m.icon;
        label.textContent = m.label;
      },
      collapse: function () { setOpen(false); }
    };
  }

  //  A titled poster rather than a black rectangle. Deliberately does NOT
  //  state the mechanism: the check at the foot of this page tests it, and a
  //  poster that answers it is the same defect the objective-statement
  //  subtitle had.
  function videoPoster(chip, title, line) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">' +
        '<rect width="1280" height="720" fill="#0b1220"/>' +
        '<rect width="1280" height="5" fill="#2ee6cf"/>' +
        '<g font-family="Open Sans, Helvetica, Arial, sans-serif">' +
          '<text x="82" y="286" fill="#2ee6cf" font-size="19" font-weight="700" letter-spacing="5">' +
            esc(chip) + '</text>' +
          '<text x="82" y="368" fill="#ffffff" font-size="52" font-weight="700">' + esc(title) + '</text>' +
          '<text x="82" y="422" fill="#9fb0c4" font-size="23">' + esc(line) + '</text>' +
        '</g>' +
        '<g transform="translate(82 470)" opacity=".5">' +
          '<circle cx="25" cy="25" r="24" fill="none" stroke="#2ee6cf" stroke-width="2"/>' +
          '<path d="M19 15 L37 25 L19 35 Z" fill="#2ee6cf"/>' +
        '</g>' +
      '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
  // Item 26: 'hz-modality' persists which carrier actually served the
  // procedure beat — read by remk1Modality() ("a different way in") and by
  // this beat's own default on arrival. It used to be written only by the
  // Demo menu's Modality control (a reviewer-only cycle through all four);
  // the learner-facing picker in procedureInit was the writer, and the
  // title page's "Preferred format" card (introInit) now writes it first,
  // before any beat has run.
  var MODALITY_ORDER = ['video', 'article', 'tutor', 'podcast'];
  function modalityId() {
    try { var m = sessionStorage.getItem('hz-modality'); if (MODALITIES[m]) return m; } catch (e) {}
    return MODALITY_ORDER[0];
  }
  // Filters the preference against what THIS beat actually offers, so a
  // beat with its own constraints (hazard's placeholder-gated video; no
  // beat but procedure offers tutor) doesn't hand back a carrier it can't
  // render. Falls back to that beat's own default rather than teaching
  // this helper every beat's exceptions.
  function modalityDefault(offered, fallback) {
    var pref = modalityId();
    return offered.indexOf(pref) > -1 ? pref : fallback;
  }

  // ==========================================================================
  //  THE RECORD — the two knowledge checks scored, the 5.3 views reported
  //  as views (never graded: a low one only ever served the longer chapter).
  // ==========================================================================
  var RECORD_CONTENT =
    '<main class="ll-object" id="recordObject">' +
      '<span class="rs-badge" aria-hidden="true"><i class="fa-solid fa-check"></i></span>' +
      '<p class="ll-eyebrow">Your results</p>' +
      '<h2 id="recHead">Module complete!</h2>' +
      '<p class="ll-sub">Based on your answers.</p>' +
      '<div class="rs-wrap" id="recList"></div>' +
    '</main>';
  var MOVE = {
    up:   { cls: 'up',   icon: 'fa-arrow-trend-up',   label: 'Moved up' },
    held: { cls: 'held', icon: 'fa-minus',            label: 'Held' },
    down: { cls: 'down', icon: 'fa-arrow-trend-down', label: 'Moved down' }
  };
  function recordInit(ctx) {
    var c = readCourse();
    var b = c.battery || {};
    // Labels are plain topic nouns, not the objective names.
    var TOPIC = {
      K1: { name: 'Where to report hazing', kind: 'Knowledge check' },
      K2: { name: 'Consequences of hazing', kind: 'Knowledge check' }
    };
    function knowTopic(id, chk, re) {
      if (!chk) return null;
      if (chk.passed) return { id: id, ok: true, line: 'Answered correctly.' };
      if (re && re.passed) return { id: id, ok: true, line: 'Answered correctly on the second try.' };
      return { id: id, ok: false, line: re ? 'Missed on both tries.' : 'Missed this question.' };
    }
    // 5.1 answered right on the pre-check and skipped (or served the
    // test-up, which has no check): the pre-check answer is the evidence.
    var k1 = knowTopic('K1', c.k1check, c.k1recheck);
    if (!k1 && !b.skipped && b.k1up) k1 = { id: 'K1', ok: true, line: 'Answered correctly on the pre-check.' };
    var topics = [k1, knowTopic('K2', c.k2check, null)].filter(Boolean);

    function finalPass(chk, re) { return !!(chk && (chk.passed || (re && re.passed))); }
    var changes = [];
    if (!b.skipped && c.k1check && b.k1up != null) changes.push({ id: 'K1', before: !!b.k1up, after: finalPass(c.k1check, c.k1recheck) });
    function changeOf(ch) {
      var k = ch.after && !ch.before ? 'up' : !ch.after && ch.before ? 'down' : 'held';
      return { icon: MOVE[k].icon, cls: k === 'up' ? 'rs-ok' : k === 'down' ? 'rs-warn' : 'rs-flat',
        label: k === 'up' ? 'Improved' : k === 'down' ? 'Dropped' : ch.after ? 'Already strong' : 'No change' };
    }
    function yesNo(v) { return v ? 'Correct' : 'Incorrect'; }

    // Views: the statement, rated at the start and (statement 1) again after
    // the 5.3 chapter. Neutral marks only — there is no right rating.
    var views = [
      { stmt: F1_STATEMENT, before: b.f1, after: c.f1post && c.f1post.score },
      { stmt: F1B_STATEMENT, before: b.f1b, after: null }
    ].filter(function (v) { return v.before != null || v.after != null; });
    function viewLine(v) {
      if (v.before != null && v.after != null) return 'At the start: ' + v.before + ' of 5 · Later: ' + v.after + ' of 5';
      return 'You rated this ' + (v.after != null ? v.after : v.before) + ' of 5';
    }

    function nameList(list, icon) {
      return '<ul class="rs-names">' + list.map(function (t) {
        return '<li><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' + esc(TOPIC[t.id].name) + '</li>';
      }).join('') + '</ul>';
    }
    var strong = topics.filter(function (t) { return t.ok; });
    var work = topics.filter(function (t) { return !t.ok; });

    var html = '';
    if (topics.length) {
      html += '<section class="rs-summary' + (strong.length ? '' : ' rs-summary--one') + '">' +
        (strong.length ? '<div class="rs-col rs-col--strong"><h3 class="rs-head">Strengths</h3>' +
          nameList(strong, 'fa-circle-check') + '</div>' : '') +
        '<div class="rs-col rs-col--work"><h3 class="rs-head">Worth a review</h3>' +
          (work.length ? nameList(work, 'fa-circle-exclamation') : '<p class="rs-empty">Nothing — nice work</p>') + '</div>' +
      '</section>';
    }
    var more = '';
    if (topics.length) {
      more += '<h4 class="rs-sub">How you did</h4><ul class="rs-rows">' + topics.map(function (t) {
        return '<li><i class="fa-solid ' + (t.ok ? 'fa-circle-check rs-ok' : 'fa-circle-exclamation rs-warn') + '" aria-hidden="true"></i>' +
          '<span class="rs-topic"><span class="rs-kind">' + esc(TOPIC[t.id].kind) + '</span>' + esc(TOPIC[t.id].name) + '</span>' +
          '<span class="rs-val">' + esc(t.line) + '</span></li>';
      }).join('') + '</ul>';
    }
    if (changes.length) {
      more += '<h4 class="rs-sub">Since the pre-check</h4><ul class="rs-rows">' + changes.map(function (ch) {
        var m = changeOf(ch);
        return '<li><i class="fa-solid ' + m.icon + ' ' + m.cls + '" aria-hidden="true"></i>' +
          '<span class="rs-topic">' + esc(TOPIC[ch.id].name) + '</span>' +
          '<span class="rs-val">' + esc(m.label) + ': ' + yesNo(ch.before) +
            ' <i class="fa-solid fa-arrow-right rs-arrow" aria-hidden="true"></i> ' + yesNo(ch.after) + '</span></li>';
      }).join('') + '</ul>';
    }
    if (views.length) {
      more += '<h4 class="rs-sub">Your views <span class="rs-note">Not scored</span></h4><ul class="rs-rows rs-views">' + views.map(function (v) {
        return '<li><i class="fa-regular fa-comment rs-flat" aria-hidden="true"></i>' +
          '<q class="rs-stmt">' + esc(v.stmt) + '</q><span class="rs-val">' + esc(viewLine(v)) + '</span></li>';
      }).join('') + '</ul>';
    }
    if (more) {
      html += '<details class="rs-more"' + (topics.length ? '' : ' open') + '><summary>Show details<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary>' +
        '<div class="rs-more-body">' + more + '</div></details>';
    }
    if (!html) html = '<p class="rs-empty">No results yet. Finish the module to see them here.</p>';
    document.getElementById('recList').innerHTML = html;
  }

  // ==========================================================================
  //  THE PATH. Entry → Learn → Check → Record, with the assessment policy
  //  deciding what is here at all. Every chapter screen is one structure-map
  //  permutation; its caption names the permutation ID.
  // ==========================================================================
  function est(id) { return DECK[lensKey()][id].est; }
  var STEPS = [
    { id: 'intro', mode: 'floating', lesson: 'Welcome', cover: true, nextLabel: 'Start module',
      caption: { title: 'Course title page', note: 'Module 5 of Hazing Awareness and Prevention (Higher Ed). Only Module 5 is built; Modules 1–4 are numbered stand-ins. The audience (Athletes or Greek Life) is set at assignment: Demo → Context lens, or ?role=athletes|greek.' },
      coach: { say: '' },
      content: INTRO_CONTENT, init: introInit },

    { id: 'battery', icon: 'fa-list-check', mins: 1, stage: 'Entry', lesson: 'Progress assessment', mode: 'floating', gate: true,
      noCoach: true,
      caption: { title: 'ENTRY · Pre-module battery', note: 'Three items, verbatim from the LED extract: the 5.1 channel question (correct → 5.1 tested out, or tested up when Skip ahead is off), then the two 5.3 agreement statements (mean of 3 or below → M5-03R). 5.2 has no pre-battery item (ask policy).' },
      content: BATTERY_CONTENT, init: batteryInit,
      onSkip: function () { saveResult('battery', { k1up: false, f1: null, f1b: null, skipped: true }); } },

    { id: 'adjust', icon: 'fa-diagram-project', mins: 1, stage: 'Entry', lesson: 'Your Updated Path', mode: 'crown', gate: true, interstitial: true,
      when: adjustMoved,
      caption: { title: 'ENTRY · Knowledge Layer', note: 'Only when the pre-check moved the path: 5.1 tested out or up, or the 5.3 remedial swapped in.' },
      coach: { say: '' },
      content: ADJUST_CONTENT, init: adjustInit },

    // ---- Listen mode ----------------------------------------------------------
    { id: 'podoffer', icon: 'fa-headphones', stage: 'Entry', lesson: 'Choose a format', mode: 'floating', gate: true,
      noCoach: true, coach: { say: '' },
      when: function () { return offered().length > 1; },
      caption: { title: 'ENTRY · Choose a format', note: 'After the pre-check, because the pre-check is what builds the listen.' },
      content: PODOFFER_CONTENT, init: podofferInit },
    { id: 'podcast', icon: 'fa-headphones', stage: 'Learn', lesson: MODULE, mode: 'floating', gate: true,
      noCoach: true, coach: { say: '' },
      get mins() { return listenMinutes() || 12; },
      when: function () { return podcastPath(); },
      get caption() { return { title: 'LEARN · The listen (Listen mode)', note: 'Assembled from the audience’s audio package (data/hazing-listen/config.json → assets/audio/hazing/listenModeAudio-<audience>/). PLACEHOLDER AUDIO: machine-voiced stand-ins, replace with the produced package. ' + listenTrace() }; },
      content: EPISODE_CONTENT, init: episodeInit },
    { id: 'podcheck', icon: 'fa-list-check', stage: 'Check', lesson: 'Questions', mode: 'floating', gate: true,
      noCoach: true, coach: { say: '' },
      get mins() { return Math.max(1, Math.round((podcheckItems().length || 3) / 2)); },
      when: function () { return podcastPath(); },
      caption: { title: 'CHECK · The listen’s questions (Listen mode)', note: 'One question per chapter that played (config.checks), the same question its chapter screen asks. The 5.1 test-up has no question.' },
      content: PODCHECK_CONTENT, init: podcheckInit },
    { id: 'listenreview', icon: 'fa-rotate', stage: 'Check', lesson: 'Review', mode: 'floating', gate: true,
      noCoach: true, coach: { say: '' }, mins: 2, adaptive: true, variant: 'Review set',
      when: function () { return extraOn() && podcastPath() && listenMissed().length > 0; },
      caption: { title: 'CHECK · Review set (Listen mode)', note: 'Only after a missed 5.1 question: the M5-01R narration as fact cards (data/hazing-listen/review/k1-<audience>.json), then the same question once more.' },
      content: REVIEW_CONTENT, init: reviewInit },
    { id: 'listendone', icon: 'fa-flag-checkered', stage: 'Check', lesson: 'Listen mode complete', mode: 'floating',
      noCoach: true, coach: { say: '' }, mins: 0, nextLabel: 'See your results',
      when: function () { return podcastPath(); },
      caption: { title: 'CHECK · Completion (Listen mode)', note: 'Hands the learner from the listen to the results.' },
      content: LISTENDONE_CONTENT, init: listendoneInit },

    // ---- The chapters (Watch or Read) ----------------------------------------
    deckStep('m501a', { when: function () { return !k1Out() && !k1TestUp(); },
      get mins() { return Math.ceil(parseFloat(est('m501a'))) || 4; },
      caption: { title: 'LEARN · M5-01A, 5.1 base (Remediate)', note: 'Standard 5.1 pass, with its check (the LED extract’s hotline-number question). Removed when 5.1 tests out; replaced by M5-01B on test-up. A miss adds M5-01R.' } }),
    deckStep('m501b', { adaptive: true, variant: 'Test-up version', when: function () { return k1TestUp(); },
      caption: { title: 'LEARN · M5-01B, 5.1 test-up', note: 'Replaces 01A when the 5.1 pre-check item was right and Skip ahead is off. No check afterward. PLACEHOLDER: no narration yet (Athletes: being rewritten; Greek Life: not in the narration review).' } }),
    deckStep('m501r', { adaptive: true, variant: 'Remedial version',
      when: function () { return extraOn() && checkMissed('k1check') && !podcastPath(); },
      get mins() { return Math.ceil(parseFloat(est('m501r'))) || 5; },
      caption: { title: 'LEARN · M5-01R, 5.1 remedial', note: 'Only after a missed 5.1 check. A new scene in the same storyline, slower, then the missed question once more (k1recheck). One retry.' } }),
    deckStep('m502a', {
      get mins() { return Math.ceil(parseFloat(est('m502a'))) || 4; },
      caption: { title: 'LEARN · M5-02A, 5.2 base (Ask)', note: 'Always in the cut. No pre-battery item; never remediates. Its self-check is the LED extract’s first 5.2 question (the other three aren’t asked yet).' } }),
    deckStep('m503a', { when: function () { return !feelLow(); },
      get mins() { return Math.ceil(parseFloat(est('m503a'))) || 3; },
      caption: { title: 'LEARN · M5-03A, 5.3 base (Remediate)', note: 'Standard Feel case, for a favorable pre-battery score (mean of the two statements above 3). Statement 1 is asked again over it (f1post).' } }),
    deckStep('m503r', { adaptive: true, variant: 'Remedial version', when: function () { return feelLow(); },
      get mins() { return Math.ceil(parseFloat(est('m503r'))) || 6; },
      caption: { title: 'LEARN · M5-03R, 5.3 remedial', note: 'Replaces 03A on a low Feel pre-battery score. Carries everything 03A does, plus a second incident. Statement 1 is asked again over it.' } }),

    { id: 'record', icon: 'fa-chart-simple', mins: 1, stage: 'Record', lesson: 'Your Results', mode: 'floating', noCoach: true,
      caption: { title: 'RECORD · Results', note: 'The 5.1 and 5.2 checks scored (5.1 credited from the pre-check when it was tested out or up); the 5.3 statements shown as views, never graded.' },
      coach: { say: '' },
      content: RECORD_CONTENT, init: recordInit }
  ];

  // Admin preview (js/preview-embed.js): which listen chapters play for this
  // learner, from the same rules the listen itself uses. Embed only. Kept
  // under the Sharps name: the admin preview viewer reads it for any course.
  if (window.PreviewEmbed) {
    window.SharpsListenPlan = function () {
      return loadListenData().then(function (data) {
        return resolveListen(listenResults(), data).map(function (p) {
          return { topic: p.topic, how: p.how, title: topicTitle(p.topic, data), chapter: (data.manifest.topics[p.topic] || {}).chapter !== false };
        });
      });
    };
  }

  // ==========================================================================
  //  D11: URL-prefillable launch params — role (sector), name, media (format).
  //  A stamped link (an LMS enrollment, a shared demo link) can hand the
  //  learner a pre-set context without them touching anything on arrival.
  //  Seeds the SAME session values the in-module pickers already read and
  //  write (ll-lens, sh-modality, sh-name) rather than a second, competing
  //  source of truth — an in-module change afterward still wins over this.
  // ==========================================================================
  (function applyLaunchParams() {
    var p;
    try { p = new URLSearchParams(location.search); } catch (e) { return; }
    var role = p.get('role');
    if (role && LENSES[role]) { try { sessionStorage.setItem('ll-lens', role); } catch (e) {} }
    var media = p.get('media');
    // Podcast is declined at module level (item 26) — not a valid launch
    // value either, the same reason it is hidden from the picker itself.
    if (media && offeredKeys().indexOf(media) > -1 && media !== 'listen') {
      try { sessionStorage.setItem('hz-modality', media); } catch (e) {}
    }
    var name = p.get('name');
    if (name) { try { sessionStorage.setItem('hz-name', name.trim().slice(0, 40)); } catch (e) {} }
    // Admin preview (js/preview-embed.js): one allowed Watch/Read format is
    // the carrier from the start, since the format screen is skipped. Just
    // Module 5 assigned: skip the cover and open the module itself.
    if (AP) {
      var one = AP.only();
      if (one && one !== 'listen') { try { sessionStorage.setItem('hz-modality', one); } catch (e) {} }
      if (AP.modules.length === 1 && AP.modules[0] === 'm5' && !p.get('step')) {
        var at = STEPS.findIndex(function (st) { return st.id === 'intro'; });
        if (at > -1 && STEPS[at + 1]) {
          try {
            var u = new URL(location.href);
            u.searchParams.set('step', STEPS[at + 1].id);
            history.replaceState(null, '', u.pathname + u.search + u.hash);
          } catch (e) {}
        }
      }
    }
  })();

  // ==========================================================================
  //  Hand it to the engine.
  // ==========================================================================
  // On the adjustment screen a forced result can leave nothing to report,
  // which removes the screen itself — advancing IS the demonstration then.
  function adjustReplay(api) {
    if (api.step && api.step.id === 'adjust') {
      if (!adjustMoved()) { api.go(1); return; }
      api.replay();
      return;
    }
    api.refresh();
  }
  LE.register({
    course: COURSE,
    steps: STEPS,
    storageKey: 'hz-course',
    onOrbReady: function () { applyStyleMode(styleMode()); },
    coachHint: window.PreviewEmbed && window.PreviewEmbed.thumb ? null : { delay: 7000 },
    reviewGate: true,
    coverLabel: '',
    reviewCaptions: true,
    lenses: LENSES,
    lensOrder: LENS_ORDER,
    // The cover and every chapter move with the audience.
    lensedSteps: { intro: 1, m501a: 1, m501b: 1, m501r: 1, m502a: 1, m503a: 1, m503r: 1 },
    // Canned Ask CLARA replies: the LED extract's own facts, verbatim or close.
    replies: [
      'If someone is unconscious, having difficulty breathing, or showing signs of alcohol poisoning, call 911 or campus emergency services immediately. That comes before any other channel.',
      'The National Anti-Hazing Hotline is 1-888-NOT-HAZE (1-888-668-4293). You can leave an anonymous message, or give your information if you want a direct response.',
      'Counseling and health services can offer confidential services related to hazing concerns. The dean of students office can explain your options for addressing hazing.',
      'Reporting through the hotline, anonymous online reporting, or confidential counseling does not require you to participate in a formal investigation.'
    ],
    demoControls: [{
      id: 'hzBatteryBtn', icon: 'fa-shuffle', name: '5.1 pre-check correct',
      note: 'Force the 5.1 pre-check question right (5.1 tested out, or tested up when Skip ahead is off) or wrong (the base chapter), and replay the routing',
      visibleOn: function (step) { return step.id === 'adjust' || step.id === 'battery'; },
      type: 'toggle', on: k1Correct,
      onClick: function (api) {
        var up = !k1Correct();
        try { sessionStorage.setItem('hz-battery', up ? 'proven' : 'unproven'); } catch (e) {}
        var b = readCourse().battery || {};
        saveResult('battery', { k1up: up, f1: b.f1 == null ? null : b.f1, f1b: b.f1b == null ? null : b.f1b });
        adjustReplay(api);
      }
    }, {
      id: 'hzPathStyleBtn', icon: 'fa-wand-magic-sparkles', name: 'Path update style',
      note: 'Simple progress bar, or a playful reward. The reward only shows when the 5.1 question was answered correctly',
      visibleOn: function (step) { return step.id === 'adjust'; },
      type: 'select', value: pathUpdateStyle,
      options: [
        { value: 'calibrate', label: 'Calibrating (simple)' },
        { value: 'celebrate', label: 'Nice work (playful)' }
      ],
      onChange: function (v, api) {
        try { sessionStorage.setItem('hz-path-style', v); } catch (e) {}
        api.replay();
      }
    }, {
      id: 'hzFeelBtn', icon: 'fa-heart', name: 'Low agreement',
      note: 'Force both 5.3 statements low (M5-03R) or high (M5-03A)',
      visibleOn: function (step) { return step.id === 'adjust' || step.id === 'battery'; },
      type: 'toggle', on: feelLow,
      onClick: function (api) {
        var low = !feelLow();
        try { sessionStorage.setItem('hz-feel', low ? 'low' : 'high'); } catch (e) {}
        var b = readCourse().battery || {};
        saveResult('battery', { k1up: !!b.k1up, f1: low ? 2 : 5, f1b: low ? 2 : 5 });
        adjustReplay(api);
      }
    }, {
      id: 'hzNameBtn', icon: 'fa-signature', name: 'Learner name',
      note: 'Stand-in for the SSO name — shown on the path-ready screen. Clear it for the unnamed version',
      visibleOn: function (step) { return step.id === 'intro' || step.id === 'adjust'; },
      state: function () { return savedName() || 'Not set'; },
      onClick: function (api) {
        var next = window.prompt('Learner name (optional):', savedName());
        if (next === null) return;
        try { sessionStorage.setItem('hz-name', next.trim().slice(0, 40)); } catch (e) {}
        api.replay();
      }
    }, {
      id: 'hzListenComboBtn', icon: 'fa-shuffle', name: 'Listen combination',
      note: 'The listens the pre-check can build. Restarts the listen from the top',
      visibleOn: function (step) { return ['podcast', 'podcheck', 'listenreview', 'listendone'].indexOf(step.id) > -1; },
      type: 'select', value: function () { return LD() ? listenComboNow() : 'n'; },
      options: LISTEN_COMBOS.map(function (c) { return { value: c.value, label: c.label }; }),
      onChange: function (v) { setListenCombo(v); }
    }, {
      id: 'hzListenMissBtn', icon: 'fa-circle-xmark', name: 'Missed checks',
      note: 'Answer the listen’s questions for you, missing 0 or 1 knowledge questions, then go to the review set (or past it)',
      visibleOn: function (step) { return ['podcast', 'podcheck', 'listenreview', 'listendone'].indexOf(step.id) > -1; },
      type: 'select', value: function () { return 'pick'; },
      options: [ { value: 'pick', label: 'Choose…' }, { value: 'none', label: 'None missed' },
                 { value: 'k1', label: '5.1 missed' } ],
      onChange: function (v) { if (v !== 'pick') setListenMisses(v); }
    }, {
      id: 'hzModePrefBtn', icon: 'fa-headphones', name: 'Mode preference',
      note: 'The learner’s saved format preference, which the offer screen reflects',
      visibleOn: function (step) { return step.id === 'podoffer'; },
      type: 'select', value: function () { return modePref() || 'none'; },
      options: [
        { value: 'none', label: 'None saved' },
        { value: 'listen', label: 'Listen mode' },
        { value: 'standard', label: 'Classic mode' }
      ],
      onChange: function (v, api) {
        setModePref(v === 'none' ? null : v);
        saveResult('podpath', null);
        api.replay();
      }
    }, {
      id: 'hzAskBtn', icon: 'fa-comment-dots', name: 'Ask CLARA',
      note: 'Show the bottom-right Ask CLARA launcher. Off by default, so the standard module runs without it',
      type: 'toggle', on: function () { return !document.documentElement.classList.contains('sh-ask-off'); },
      onClick: function () {
        var on = !document.documentElement.classList.toggle('sh-ask-off');
        try { sessionStorage.setItem('hz-ask', on ? 'on' : 'off'); } catch (e) {}
      }
    }, {
      id: 'hzStyleBtn', icon: 'fa-palette', name: 'Design style',
      note: 'Swap CLARA’s teal for Vector’s own palette + control shape, dark or light',
      type: 'select', value: styleMode,
      options: [
        { value: 'clara', label: 'CLARA (teal, dark)' },
        { value: 'vector-dark', label: 'Vector, dark' },
        { value: 'vector-light', label: 'Vector, light' }
      ],
      onChange: function (mode) {
        try { sessionStorage.setItem('hz-style', mode); } catch (e) {}
        applyStyleMode(mode);
      }
    }]
  });
})();
