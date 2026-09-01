/* ============================================================================
   layered-course.js — the single-page SHELL for the end-to-end CLARA course.

   The whole point: the production frame, the dark stage, the course-nav footer,
   and CLARA's Möbius orb are built ONCE and never re-rendered. Moving between
   steps swaps only the content + the coach chrome in place, and the orb — the
   SAME element the entire time — GLIDES to its new resting spot (it never
   restarts its WebGL animation). No document reload between the light steps, so
   the flow is genuinely seamless.

   The five "light" steps (intro / video / scene / closing / results) render
   here as content modules. The heavyweight Marshall scenario is a full-screen
   app of its own, so it stays its own page (clara/scenario.html); the
   crossing into and out of it is a cross-document View Transition (see the CSS
   in clara/course.html). The scenario hands back by navigating to
   ?step=closing with its score already in sessionStorage['ll-course'].

   NOTE: both course pages live in the clara/ subdirectory, so page-relative
   paths (videos, the lesson index) resolve one level deeper than the rest of
   lesson-presentation — hence the ../../assets/… and ../index.html below.

   Reuses css/layered-learning.css (tokens, chrome, orb, footer classes) and
   js/mobius-orb.js. Include AFTER frame.js so the top frame exists to update.
   ========================================================================== */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function T(ms) { return RM ? 0 : ms; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // --- Cross-page course record (sessionStorage) ---------------------------
  function readCourse() {
    try { return JSON.parse(sessionStorage.getItem('ll-course') || '{}') || {}; }
    catch (e) { return {}; }
  }
  function saveResult(key, value) {
    var c = readCourse(); c[key] = value;
    try { sessionStorage.setItem('ll-course', JSON.stringify(c)); } catch (e) {}
    return c;
  }

  // --- The aptitude model (AI Aptitude Assessment vision doc) -----------------
  // Constructs come from the Individual Determinants of Behavior framework
  // (Intervention Mapping) — the same construct names the vision doc uses.
  // Five of the eight are assessed in this course; each is scored on the doc's
  // qualitative bands. 1 = Below Average / Practice Needed, 2 = Average / Good,
  // 3 = Above Average / Excellent. Pass = at least Average on 80% of objectives.
  var CONSTRUCTS = [
    { key: 'knowledge', name: 'Knowledge',                    icon: 'fa-book-open',      listens: 'Can you recognize the behavior — not just define it?' },
    { key: 'beliefs',   name: 'Attitudes & beliefs',          icon: 'fa-scale-balanced', listens: 'Do you believe stepping in matters?' },
    { key: 'norms',     name: 'Social norms',                 icon: 'fa-users',          listens: 'Can you read — and resist — the pressure to stay quiet?' },
    { key: 'skills',    name: 'Behavioral skills',            icon: 'fa-comment-dots',   listens: 'Do you know what to say, specifically?' },
    { key: 'control',   name: 'Perceived behavioral control', icon: 'fa-gauge-high',     listens: 'Do you feel able to act in the moment?' }
  ];
  var BANDS = {
    1: { label: 'Practice Needed', cls: 'band-warn' },
    2: { label: 'Good',            cls: 'band-ok'   },
    3: { label: 'Excellent',       cls: 'band-exc'  }
  };

  // The course runs the module contract literally: Entry → Learn → Check →
  // Perform → Record. Recomposition therefore has THREE contract-native
  // moments, each with its own decision:
  //   Entry   → entryStrength(): 'compressed' (test-out) or 'full' build,
  //             from the entry battery (presenter override: 'll-entry').
  //   Check   → checkMissed(): a miss on the sampled item inserts in-course
  //             remediation on the spot (the presenter just answers weakly).
  //   Perform → feeds the profile and paths the NEXT course (page 70's loop).
  function entryStrength() {
    try { var o = sessionStorage.getItem('ll-entry'); if (o === 'compressed' || o === 'full') return o; } catch (e) {}
    var b = readCourse().baseline;
    if (b && b.bands) return b.bands.knowledge >= 2 ? 'compressed' : 'full';
    return 'full';   // before the entry battery, the syllabus shows the full build
  }
  function testUp() {
    var b = readCourse().baseline;
    return entryStrength() === 'compressed' && !!(b && b.bands && b.bands.control === 3);
  }
  function checkMissed() {
    var c = readCourse().check;
    return !!(c && c.missed);
  }

  // --- "CLARA noticed" evidence toast ---------------------------------------
  // A quiet signal chip (bottom-right, above the footer) shown when CLARA logs
  // evidence against a construct — assessment as a continuous thread, not a
  // test moment. Auto-dismisses; stacks if several fire close together.
  function notice(html) {
    var wrap = document.getElementById('llNotices');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'llNotices'; wrap.className = 'll-notices'; wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    var chip = document.createElement('div');
    chip.className = 'll-notice';
    chip.innerHTML = '<i class="fa-solid fa-wave-square" aria-hidden="true"></i><span>' + html + '</span>';
    wrap.appendChild(chip);
    requestAnimationFrame(function () { requestAnimationFrame(function () { chip.classList.add('in'); }); });
    setTimeout(function () {
      chip.classList.remove('in');
      setTimeout(function () { chip.remove(); }, T(400) + 20);
    }, T(4600) + 400);
  }

  // ==========================================================================
  //  Content builders (the markup each step drops into the stage)
  // ==========================================================================
  function videoContent(opts) {
    return '' +
      '<main class="ll-object">' +
        '<p class="ll-eyebrow">' + esc(opts.eyebrow) + '</p>' +
        '<h2>' + esc(opts.heading) + '</h2>' +
        '<p class="ll-sub">' + esc(opts.sub) + '</p>' +
        '<div class="ll-media" id="videoWrap">' +
          '<video id="courseVideo" class="cv-video" controls playsinline data-src="' + esc(opts.src) + '"></video>' +
          '<div class="cv-loader" id="cvLoader">' +
            '<div class="cv-spinner" aria-hidden="true"></div>' +
            '<div>Loading video… <b id="cvPct">0%</b></div>' +
          '</div>' +
          // Prototype-only skip ON the video (matches the scenario\'s cold-open
          // .intro-skip): jumps past the clip so CLARA pops up.
          '<button class="cv-skip" id="cvSkip" type="button" aria-label="Skip video">Skip <i class="fa-solid fa-forward"></i></button>' +
        '</div>' +
      '</main>';
  }

  var RESULTS_CONTENT =
    '<main class="ll-object" id="resultsObject">' +
      '<p class="ll-eyebrow">Your aptitude profile</p>' +
      '<h2 id="resHeadline">Here\'s what you can do now.</h2>' +
      '<p class="ll-sub" id="resSub">Not a quiz score — a construct-by-construct picture of what you demonstrated, ' +
        'measured from your baseline to now.</p>' +
      '<div class="res-wrap">' +
        '<div class="res-ring">' +
          '<svg viewBox="0 0 180 180" role="img" aria-label="Objectives at Good or above">' +
            '<defs><linearGradient id="resGrad" x1="0" y1="0" x2="1" y2="1">' +
              '<stop offset="0%" stop-color="#46f0dc"/><stop offset="55%" stop-color="#16b8a6"/><stop offset="100%" stop-color="#0c8f83"/>' +
            '</linearGradient></defs>' +
            '<circle class="track" cx="90" cy="90" r="76"></circle>' +
            '<circle class="val" cx="90" cy="90" r="76" id="resArc" stroke-dasharray="477.5" stroke-dashoffset="477.5"></circle>' +
          '</svg>' +
          '<div class="res-center"><div class="res-score"><span id="resScoreNum">0</span><small id="resScoreOf">/5</small></div>' +
          '<div class="res-score-label">At Good or above</div></div>' +
        '</div>' +
        '<div class="apt-side">' +
          '<p class="apt-pass" id="aptPass"></p>' +
          '<p class="apt-path" id="aptPath"></p>' +
        '</div>' +
      '</div>' +
      '<ul class="apt-list" id="aptList" aria-label="Construct-by-construct profile"></ul>' +
      '<p class="res-basis" id="resBasis"></p>' +
    '</main>';

  // ==========================================================================
  //  Per-step init logic (ported from the old per-file pages)
  // ==========================================================================

  // Fetch the WHOLE clip up front → play from an in-memory blob (no mid-play
  // streaming, no stalls). Shows the loader's % while downloading.
  function preloadVideoFully(video) {
    var wrap = document.getElementById('videoWrap');
    var pctEl = document.getElementById('cvPct');
    var url = video.dataset.src;
    fetch(url).then(function (resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var total = +resp.headers.get('Content-Length') || 0;
      if (!resp.body || !total) return resp.blob();
      var reader = resp.body.getReader(), chunks = [], got = 0;
      return (function pump() {
        return reader.read().then(function (r) {
          if (r.done) return new Blob(chunks, { type: 'video/mp4' });
          chunks.push(r.value); got += r.value.length;
          if (pctEl) pctEl.textContent = Math.round(got / total * 100) + '%';
          return pump();
        });
      })();
    }).then(function (blob) {
      video.src = URL.createObjectURL(blob);
      if (wrap) wrap.classList.add('is-ready');
    }).catch(function () {
      video.src = url;                       // fallback: stream directly
      if (wrap) wrap.classList.add('is-ready');
    });
  }

  // Step 2 — gated pre-roll video with CLARA's comprehension check.
  var VIDEO_QUESTION = {
    stem: 'Quick check — <strong>After watching this video, how confident are you that you know the basics of sexual harassment?</strong>',
    // Self-report — this is the course intro, not the Marshall clip, so there is no
    // right answer. Any choice acknowledges the learner and unlocks Continue.
    options: [
      { t: 'Pretty confident',   reply: 'Love that. We’ll put it to work in a real moment in a bit.' },
      { t: 'Somewhat confident', reply: 'Good place to start — what’s coming up will help sharpen it.' },
      { t: 'Not very confident', reply: 'That’s completely okay — building that up is exactly what we’re here to do.' }
    ]
  };
  // Prototype-only on-video skip (mirrors the scenario's cold-open .intro-skip):
  // jump past the clip so CLARA's beat fires — her question on the pre-roll,
  // her reflection on the close.
  function wireVideoSkip(video) {
    var skip = document.getElementById('cvSkip');
    if (!skip) return;
    skip.addEventListener('click', function () {
      var wrap = document.getElementById('videoWrap');
      if (wrap) wrap.classList.add('is-ready');            // in case still buffering
      try { video.pause(); if (isFinite(video.duration) && video.duration > 0) video.currentTime = video.duration; } catch (e) {}
      video.dispatchEvent(new Event('ended'));             // reveal CLARA (idempotent guards)
    });
  }

  function videoInit(ctx) {
    var video = document.getElementById('courseVideo');
    var asked = false, answered = false;
    if (entryStrength() === 'compressed') {
      ctx.setCoachSay('This is the short cut — the beats you verified at entry are gone. Press play; one quick question at the end.');
    }
    preloadVideoFully(video);
    wireVideoSkip(video);
    video.addEventListener('play', function () { ctx.floatClose(); });
    video.addEventListener('ended', revealQuestion);

    function revealQuestion() {
      if (asked) return; asked = true;
      ctx.floatOpen();
      ctx.setCoachSay(VIDEO_QUESTION.stem);
      var bubble = ctx.els.bubble;
      var chips = document.createElement('div');
      chips.className = 'clara-chips vq-chips';
      VIDEO_QUESTION.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'clara-chip'; b.type = 'button'; b.textContent = opt.t;
        b.addEventListener('click', function () { choose(opt, b, chips); });
        chips.appendChild(b);
      });
      var fb = document.createElement('div'); fb.className = 'vq-feedback';
      bubble.appendChild(chips); bubble.appendChild(fb);
      ctx.positionOrb(true);
    }
    function choose(opt, btn, chips) {
      if (answered) return;
      answered = true;                                      // self-report: any answer is accepted
      var fb = ctx.els.bubble.querySelector('.vq-feedback');
      chips.querySelectorAll('.clara-chip').forEach(function (c) { c.disabled = true; });
      btn.classList.add('is-correct');
      fb.className = 'vq-feedback ok'; fb.textContent = opt.reply;
      ctx.enableNext();
      saveResult('video1', { answered: true, choice: opt.t });
      ctx.positionOrb(true);
    }
  }

  // Step 3 — ambient scene-setter with detail chips injected into the chrome.
  var SCENE_FACTS = [
    { icon: 'fa-id-badge', label: 'Your role', value: 'Shift lead' },
    { icon: 'fa-location-dot', label: 'Where', value: 'The break room' },
    { icon: 'fa-users', label: 'Who’s here', value: 'Marshall & Jake' },
    { icon: 'fa-clock', label: 'When', value: 'Monday, start of shift' }
  ];
  function sceneInit(ctx) {
    var wrap = document.createElement('div');
    wrap.className = 'll-scene-facts';
    wrap.innerHTML = SCENE_FACTS.map(function (f) {
      return '<span class="ll-scene-fact"><i class="fa-solid ' + f.icon + '"></i>' +
             '<span><b>' + esc(f.label) + ':</b> ' + esc(f.value) + '</span></span>';
    }).join('');
    if (ctx.chrome) ctx.chrome.appendChild(wrap);
    ctx.positionOrb(false);
  }

  // ==========================================================================
  //  Step 1 — the course TITLE PAGE: hero + live sections list + details rail,
  //  the standard LMS anatomy rendered on the CLARA stage. The sections list
  //  is generated from the ACTUAL path (visiblePath), so it foreshadows
  //  compression before the entry battery and stays honest on a return visit.
  // ==========================================================================
  var INTRO_CONTENT =
    '<main class="ll-object" id="coursePage">' +
      '<div class="cp-grid">' +
        '<div class="cp-hero">' +
          '<p class="ll-eyebrow">Workplace Conduct &amp; Harassment</p>' +
          '<h1>Bystander Intervention</h1>' +
          '<p class="cp-desc">Learn to read the moment, choose an intervention, and follow up with the ' +
            'targeted person.</p>' +
          '<div class="cp-chips">' +
            '<span class="cp-chip due"><i class="fa-solid fa-calendar"></i> Required · due Sep 15</span>' +
            '<span class="cp-chip"><i class="fa-solid fa-wand-magic-sparkles"></i> AI-guided · CLARA</span>' +
          '</div>' +
          '<section class="cp-sections" aria-label="Course sections">' +
            '<div class="cp-sec-head"><h2>Course sections</h2>' +
              '<span class="cp-progress"><span id="cpCount"></span><span class="cp-dots" id="cpDots"></span></span></div>' +
            '<div id="cpRows"></div>' +
            '<p class="cp-adapt-note" id="cpAdaptNote"><i class="fa-solid fa-wand-magic-sparkles"></i> Sections marked ' +
              '“adaptive” can be skipped based on your performance.</p>' +
          '</section>' +
        '</div>' +
        '<aside class="cp-rail">' +
          '<div class="cp-card"><h3>Competency requirement</h3>' +
            '<ul class="cp-req">' +
              '<li><i class="fa-solid fa-award"></i><span><b>Good (or above) on at least 80% of objectives.</b></span></li>' +
            '</ul></div>' +
          '<div class="cp-card"><h3>Time needed to complete</h3>' +
            '<div class="cp-kv">' +
              '<div class="kv"><b>Typical ≈ 25 minutes</b>Test well and save 6 minutes</div>' +
            '</div></div>' +
          '<div class="cp-card cp-res"><h3>Resources</h3>' +
            '<a href="#" onclick="return false" title="Mocked for the prototype"><i class="fa-solid fa-file-pdf"></i> Acme reporting policy <i class="fa-solid fa-arrow-up-right-from-square ext"></i></a>' +
            '<a href="#" onclick="return false" title="Mocked for the prototype"><i class="fa-solid fa-hand-holding-heart"></i> Employee Assistance Program <i class="fa-solid fa-arrow-up-right-from-square ext"></i></a>' +
            '<p class="cp-res-note">All resources open in a new window.</p></div>' +
          '<div class="cp-card"><h3>Course coordinator</h3>' +
            '<div class="cp-coord"><span class="ava">LM</span>' +
              '<span><b>Lena Moreau</b><small>Training Coordinator · training@acmemfg.com</small></span></div></div>' +
        '</aside>' +
      '</div>' +
    '</main>';

  // Which session-record key marks each section complete.
  var DONE_KEYS = { baseline: 'baseline', compress: 'entry', video: 'video1', audio: 'audio',
                    terms: 'terms', drill: 'drill', norms: 'norms', stepin: 'stepin',
                    casevideo: 'casevideo', check: 'check', practice: 'practice', scenario: 'scenario' };
  function introInit(ctx) {
    var course = readCourse();
    var entryDecided = !!course.entry;
    var rows = visiblePath().filter(function (st) { return st.id !== 'intro'; });
    var doneCount = 0;
    document.getElementById('cpRows').innerHTML = rows.map(function (st) {
      var done = !!course[DONE_KEYS[st.id]];
      if (done) doneCount++;
      var meta = [];
      if (st.stage) meta.push('<span class="stage">' + esc(st.stage) + '</span>');
      if (st.mins) meta.push('<span>About ' + st.mins + ' min' + (st.mins > 1 ? 's' : '') + '</span>');
      if (!entryDecided && st.when && st.id !== 'practice')
        meta.push('<span class="adapt"><i class="fa-solid fa-wand-magic-sparkles"></i>adaptive</span>');
      return '<div class="cp-row' + (done ? ' done' : '') + '">' +
        '<span class="cp-row-ico"><i class="fa-solid ' + (st.icon || 'fa-circle') + '" aria-hidden="true"></i></span>' +
        '<span class="cp-row-main"><b>' + esc(st.lesson) + '</b>' +
          '<span class="cp-row-meta">' + meta.join('') + '</span></span>' +
        '<span class="cp-row-state ' + (done ? 'done">Completed' : 'todo">Not started') + '</span>' +
      '</div>';
    }).join('');
    document.getElementById('cpCount').textContent = doneCount + ' of ' + rows.length + ' complete';
    document.getElementById('cpDots').innerHTML = rows.map(function (st) {
      return '<i class="' + (course[DONE_KEYS[st.id]] ? 'done' : '') + '"></i>';
    }).join('');
    if (entryDecided) document.getElementById('cpAdaptNote').hidden = true;
    // The Start CTA lives in the bottom nav on this step (see updateFooter);
    // on a return visit it reads Continue instead.
    if (doneCount > 0) nextBtn.innerHTML = 'Continue course <i class="fa-solid fa-arrow-right"></i>';
    ctx.floatClose();   // orb only — the page speaks for itself here
    ctx.positionOrb(false);
  }

  // ==========================================================================
  //  Baseline check (adaptive pre-assessment) — the aptitude thread's opening.
  //  Two quick conversational probes BEFORE any content, so the closing profile
  //  can show growth rather than a snapshot. The stage lists what CLARA listens
  //  for (the five constructs) while she asks in the floating bubble.
  // ==========================================================================
  var BASELINE_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Entry · before instruction begins</p>' +
      '<h2>First, a quick entry check.</h2>' +
      '<p class="ll-sub">Two short questions on what you know and how you see it — no grade, no trick. ' +
        'What you already prove here gets compressed out of your path, and the end can show how far you’ve come.</p>' +
      '<ul class="bl-constructs" aria-label="What CLARA listens for">' +
        CONSTRUCTS.map(function (c) {
          return '<li class="bl-construct"><i class="fa-solid ' + c.icon + '" aria-hidden="true"></i>' +
                 '<span><b>' + esc(c.name) + '</b> ' + esc(c.listens) + '</span></li>';
        }).join('') +
      '</ul>' +
      '<p class="bl-note"><i class="fa-solid fa-circle-info"></i> Entry checks cover Know and Feel only — skills are ' +
        'never quizzed here, because a skill can’t be tested out of, only shown. Every signal CLARA logs maps to one ' +
        'of these constructs from the Individual Determinants of Behavior framework.</p>' +
    '</main>';

  var BASELINE_Q1 = {
    stem: 'First one — <strong>a coworker keeps “joking” about a colleague’s body after being asked to stop. Is that harassment?</strong>',
    options: [
      { t: 'Yes — it’s unwelcome and repeated', band: 2,
        reply: 'Right — unwelcome and persisting after a clear “stop” is the line. Good starting knowledge.' },
      { t: 'Only if a manager does it', band: 1,
        reply: 'Common belief, but no — anyone can be the harasser. We’ll firm this up as we go.' },
      { t: 'Only if it gets physical', band: 1,
        reply: 'It doesn’t have to be physical — verbal conduct counts. That’s exactly what this course covers.' }
    ]
  };
  var BASELINE_Q2 = {
    stem: 'Last one, and be honest — <strong>if you saw it happen, what would make it hardest to step in?</strong>',
    options: [
      { t: 'Knowing what to actually say', bands: { skills: 1, control: 2 },
        reply: 'That’s the most common answer there is — and it’s a skill, not a trait. I’ll focus there.' },
      { t: 'Whether it’s my place', bands: { norms: 1, control: 2 },
        reply: 'Fair. Watch how the people around you shape that feeling — we’ll come back to it.' },
      { t: 'Nothing — I’d step in', bands: { control: 3, skills: 2 },
        reply: 'Love the confidence. Let’s pressure-test it with something real.' }
    ]
  };
  function baselineInit(ctx) {
    var bands = { knowledge: 2, beliefs: 2, norms: 2, skills: 2, control: 2 };
    var answers = {};
    ask(BASELINE_Q1, function (opt) {
      bands.knowledge = opt.band; answers.q1 = opt.t;
      notice('Logged: <b>Knowledge</b> — baseline ' + BANDS[opt.band].label);
      setTimeout(function () { ask(BASELINE_Q2, done); }, T(1400));
    });
    function ask(q, onPick) {
      ctx.setCoachSay(q.stem);
      var bubble = ctx.els.bubble;
      var old = bubble.querySelector('.vq-chips'); if (old) old.remove();
      var oldFb = bubble.querySelector('.vq-feedback'); if (oldFb) oldFb.remove();
      var chips = document.createElement('div');
      chips.className = 'clara-chips vq-chips';
      q.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'clara-chip'; b.type = 'button'; b.textContent = opt.t;
        b.addEventListener('click', function () {
          chips.querySelectorAll('.clara-chip').forEach(function (c) { c.disabled = true; });
          b.classList.add('is-correct');
          fb.className = 'vq-feedback ok'; fb.textContent = opt.reply;
          ctx.positionOrb(true);
          onPick(opt);
        });
        chips.appendChild(b);
      });
      var fb = document.createElement('div'); fb.className = 'vq-feedback';
      bubble.appendChild(chips); bubble.appendChild(fb);
      ctx.positionOrb(true);
    }
    function done(opt) {
      answers.q2 = opt.t;
      Object.keys(opt.bands || {}).forEach(function (k) { bands[k] = opt.bands[k]; });
      saveResult('baseline', { bands: bands, answers: answers });
      notice('Entry profile captured — <b>5 constructs</b>');
      if (bands.knowledge >= 2) {
        setTimeout(function () {
          notice('Verified at entry: <b>3 Know objectives</b> — matching instruction compressed');
        }, T(1200));
      }
      ctx.enableNext();
    }
  }

  // ==========================================================================
  //  CHECK — standalone mastery check, two items. Item 1 is the compliance-
  //  locked objective (asked of every learner, retry until right, served at
  //  the ADVANCED TIER when the entry battery was exceeded — test-up). Item 2
  //  is sampled (objective D4): a miss triggers in-course remediation on the
  //  spot — the path visibly grows a step.
  // ==========================================================================
  var CHECK_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Check · mastery items</p>' +
      '<h2>Two items. One is locked.</h2>' +
      '<p class="ll-sub">Must-pass items are asked of every learner — compression never touches them. ' +
        'The rest are sampled. And a miss gets fixed now, inside the module, not flagged for later.</p>' +
      '<div class="mp-scene">' +
        '<div class="mp-scene-tag"><i class="fa-solid fa-lock" aria-hidden="true"></i> Item 1 · compliance-locked</div>' +
        '<p>Asked of everyone, at the tier your entry result earned.</p>' +
      '</div>' +
      '<div class="mp-scene" style="margin-top:12px">' +
        '<div class="mp-scene-tag"><i class="fa-solid fa-shuffle" aria-hidden="true"></i> Item 2 · sampled — objective D4</div>' +
        '<p>The follow-up after the moment — the beat you just rehearsed with Priya.</p>' +
      '</div>' +
    '</main>';
  var CHECK_LOCKED_STD = {
    stem: 'The locked item — true or false: <strong>harassing or firing an employee because of their sexual orientation, ' +
          'gender identity, or departure from gender stereotypes violates federal law.</strong>',
    options: [ { t: 'True', correct: true }, { t: 'False', correct: false } ],
    correctReply: 'Correct — all three are protected under federal law. One more item, then the scenario.',
    wrongReply: 'Not quite — it’s actually true, and this one’s locked, so it has to land. Give it another look.'
  };
  var CHECK_LOCKED_ADV = {
    stem: 'The locked item, advanced tier — true or false: <strong>retaliation protections only apply after a formal, ' +
          'written complaint has been filed.</strong>',
    options: [ { t: 'True', correct: false }, { t: 'False', correct: true } ],
    correctReply: 'Right — false. Protections cover informal reports and witnesses too, from the moment conduct is raised in any form. One more item.',
    wrongReply: 'It’s actually false — protections aren’t gated on paperwork. This one’s locked, so look again.'
  };
  var CHECK_SAMPLED = {
    stem: 'Item two — <strong>you stepped in and the moment has passed. Priya’s back at her desk. What’s the strongest follow-up?</strong>',
    options: [
      { t: '“I saw what happened. You good? I’ve got your back if you want to report it.”', good: true,
        reply: 'That’s the full skill — witnessed, checked in, offered support without taking over. Nothing to fix. On to the scenario.' },
      { t: '“Ignore Jake — he’s harmless.”', good: false,
        reply: 'That minimizes it — and asks Priya to carry it alone. This matters, so we fix it now: I’m adding two minutes of rehearsal before we go on.' },
      { t: '“Want me to say something next time?”', good: false,
        reply: '“Next time” concedes there’ll be one — and you saw this time. We fix it now, not later: two minutes of rehearsal coming up.' }
    ]
  };
  function checkInit(ctx) {
    ctx.floatOpen();
    var locked = testUp() ? CHECK_LOCKED_ADV : CHECK_LOCKED_STD;
    if (testUp()) notice('Test-up: locked item served at the <b>advanced tier</b>');
    askLocked();

    function askLocked() {
      ctx.setCoachSay(locked.stem);
      var bubble = ctx.els.bubble;
      var chips = document.createElement('div'); chips.className = 'clara-chips vq-chips';
      var fb = document.createElement('div'); fb.className = 'vq-feedback';
      var done = false;
      locked.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'clara-chip'; b.type = 'button'; b.textContent = opt.t;
        b.addEventListener('click', function () {
          if (done) return;
          if (opt.correct) {
            done = true;
            chips.querySelectorAll('.clara-chip').forEach(function (c) { c.disabled = true; });
            b.classList.add('is-correct');
            fb.className = 'vq-feedback ok'; fb.textContent = locked.correctReply;
            setTimeout(askSampled, T(1600));
          } else {
            b.classList.add('is-wrong'); b.disabled = true;   // locked = retry until right
            fb.className = 'vq-feedback bad'; fb.textContent = locked.wrongReply;
          }
          ctx.positionOrb(true);
        });
        chips.appendChild(b);
      });
      bubble.appendChild(chips); bubble.appendChild(fb);
      ctx.positionOrb(true);
    }
    function askSampled() {
      ctx.setCoachSay(CHECK_SAMPLED.stem);
      var bubble = ctx.els.bubble;
      var old = bubble.querySelector('.vq-chips'); if (old) old.remove();
      var oldFb = bubble.querySelector('.vq-feedback'); if (oldFb) oldFb.remove();
      var chips = document.createElement('div'); chips.className = 'clara-chips vq-chips';
      var fb = document.createElement('div'); fb.className = 'vq-feedback';
      var done = false;
      CHECK_SAMPLED.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.addEventListener('click', function () {
          if (done) return; done = true;
          chips.querySelectorAll('.clara-chip').forEach(function (c) { c.disabled = true; });
          if (opt.good) {
            b.classList.add('is-correct');
            fb.className = 'vq-feedback ok'; fb.textContent = opt.reply;
            saveResult('check', { locked: true, item2: 'good', tier: testUp() ? 'advanced' : 'standard' });
            notice('Mastery check passed — <b>nothing to fix</b>');
          } else {
            b.classList.add('is-wrong');
            fb.className = 'vq-feedback bad'; fb.textContent = opt.reply;
            saveResult('check', { locked: true, item2: 'missed', missed: true, tier: testUp() ? 'advanced' : 'standard' });
            notice('Path recomposed: <b>remediation inserted</b> — objective D4');
          }
          // The denominator changes the moment remediation inserts —
          // refresh counters, then unlock (updateFooter re-arms the gate).
          updateFooter(STEPS[idx]); updateFrame(STEPS[idx]);
          ctx.enableNext();
          ctx.positionOrb(true);
        });
        b.className = 'clara-chip'; b.type = 'button'; b.textContent = opt.t;
        chips.appendChild(b);
      });
      bubble.appendChild(chips); bubble.appendChild(fb);
      ctx.positionOrb(true);
    }
  }

  // LEARN — "A real case": the former wrap-up clip, now a plain Learn beat
  // (no question; the mastery items moved to the Check step).
  function caseInit(ctx) {
    var video = document.getElementById('courseVideo');
    var ended = false;
    preloadVideoFully(video);
    wireVideoSkip(video);
    video.addEventListener('play', function () { ctx.floatClose(); });
    video.addEventListener('ended', function () {
      if (ended) return; ended = true;
      ctx.floatOpen();
      ctx.setCoachSay('That’s the real-world close — a case that went to court because nobody stepped in. Ready to keep moving.');
      saveResult('casevideo', { watched: true });
      ctx.enableNext();
      ctx.positionOrb(true);
    });
  }

  // ==========================================================================
  //  LEARN BEATS — real instruction, one beat per objective, using the Basic
  //  Interaction patterns (Terms to Remember, Peer Results, Conversation
  //  Step-In) with authored content. Know beats compress at entry; Feel and
  //  Do beats survive compression — beliefs and skills still need teaching.
  // ==========================================================================

  // LEARN · Know (K3/K4) — "Terms to Remember": the five Ds as flip cards.
  // Gate: every card flipped. Compressed away by a strong entry battery.
  var FIVE_DS = [
    { icon: 'fa-bullhorn', name: 'Direct',
      def: 'Name what’s happening and ask it to stop.',
      ex: '“That’s not okay — drop it.” Said to Jake, in the room.' },
    { icon: 'fa-arrows-split-up-and-left', name: 'Distract',
      def: 'Break the moment without confronting anyone.',
      ex: '“Jake — the forklift guy’s looking for you.” The joke dies on its own.' },
    { icon: 'fa-user-group', name: 'Delegate',
      def: 'Bring in someone better placed to act.',
      ex: 'Loop in the lead Jake actually listens to.' },
    { icon: 'fa-hourglass-half', name: 'Delay',
      def: 'Check in with the target once the moment passes.',
      ex: '“I saw that. You good?” — ten minutes later beats never.' },
    { icon: 'fa-file-lines', name: 'Document',
      def: 'Record what, when, who — so a report can act.',
      ex: 'Date, shift, exact words. Specifics move investigations.' }
  ];
  var TERMS_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Learn · Know</p>' +
      '<h2>The Five Ds.</h2>' +
      '<p class="ll-sub">Five ways to intervene — flip each one. You only ever need the one that fits the moment.</p>' +
      '<div class="tr-grid" id="trGrid">' +
        FIVE_DS.map(function (d, i) {
          return '<button class="tr-card" type="button" data-i="' + i + '" aria-label="Flip: ' + esc(d.name) + '">' +
            '<span class="tr-inner">' +
              '<span class="tr-face"><i class="fa-solid ' + d.icon + '" aria-hidden="true"></i><b>' + esc(d.name) + '</b><span class="hint">Tap to flip</span></span>' +
              '<span class="tr-face tr-back"><b>' + esc(d.name) + '</b><p>' + esc(d.def) + '</p><p class="ex">' + esc(d.ex) + '</p></span>' +
            '</span>' +
          '</button>';
        }).join('') +
      '</div>' +
      '<p class="tr-progress" id="trProgress"><b>0</b> of 5 flipped</p>' +
    '</main>';
  function termsInit(ctx) {
    var flipped = 0;
    document.querySelectorAll('.tr-card').forEach(function (card) {
      card.addEventListener('click', function () {
        if (card.classList.contains('flipped')) return;
        card.classList.add('flipped');
        flipped++;
        document.getElementById('trProgress').innerHTML = '<b>' + flipped + '</b> of 5 flipped';
        if (flipped === 2) ctx.setCoachSay('Direct gets the headlines, but every one of these counts as stepping in.');
        if (flipped === 5) {
          ctx.setCoachSay('All five. Remember: the goal isn’t the perfect move — it’s any move.');
          notice('Logged: <b>Knowledge</b> — the five Ds, reviewed');
          saveResult('terms', { done: true });
          ctx.enableNext();
          ctx.positionOrb(true);
        }
      });
    });
  }

  // LEARN · Know (K2 barriers) — "Audio Summary": narrated text with word
  // highlighting, and a Read-instead toggle — modality switching on demand.
  // TTS starts only on the learner's tap (never autoplays). Compressible.
  var AUDIO_TEXT =
    'Here’s the strange part: the more people who see something, the less likely any one of them is to act. ' +
    'Psychologists call it diffusion of responsibility — everyone assumes someone else will handle it. ' +
    'Add the fear of misreading the moment, and a room full of decent people can stay perfectly silent. ' +
    'That silence isn’t agreement. It’s a stalemate — and it breaks the instant one person moves. ' +
    'You’re learning to be that person. Not the loudest one. Just the first.';
  var AUDIO_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Learn · Know</p>' +
      '<h2>Why rooms stay quiet.</h2>' +
      '<p class="ll-sub">Listen, or read — your call. Same objective either way.</p>' +
      '<div class="aud-wrap">' +
        '<div class="aud-controls">' +
          '<button class="aud-play" id="audPlay" type="button"><i class="fa-solid fa-play"></i> Listen</button>' +
          '<button class="aud-mode" id="audMode" type="button"><i class="fa-solid fa-book-open"></i> Read instead</button>' +
        '</div>' +
        '<p class="aud-text" id="audText" aria-label="Narrated passage"></p>' +
        '<p class="aud-note"><i class="fa-solid fa-circle-info"></i> Narration uses your browser’s built-in speech — a stand-in for the produced voice track.</p>' +
      '</div>' +
    '</main>';
  function audioInit(ctx) {
    var words = AUDIO_TEXT.split(' ');
    var textEl = document.getElementById('audText');
    // Word spans + the char offset each one starts at (for boundary events).
    var offsets = []; var pos = 0;
    textEl.innerHTML = words.map(function (w, i) {
      offsets.push(pos); pos += w.length + 1;
      return '<span class="w" data-i="' + i + '">' + esc(w) + '</span>';
    }).join(' ');
    var spans = textEl.querySelectorAll('.w');
    var playBtn = document.getElementById('audPlay');
    var modeBtn = document.getElementById('audMode');
    var playing = false, finished = false;

    function wordAt(charIndex) {
      for (var i = offsets.length - 1; i >= 0; i--) if (charIndex >= offsets[i]) return i;
      return 0;
    }
    function highlight(i) {
      spans.forEach(function (sp, j) { sp.classList.toggle('hot', j === i); });
    }
    function finish(fromRead) {
      if (finished) return; finished = true;
      spans.forEach(function (sp) { sp.classList.remove('hot'); });
      ctx.setCoachSay(fromRead
        ? 'Read at your own pace — the point stands either way: the stalemate breaks the instant one person moves.'
        : 'That last line is the whole course: not the loudest one. Just the first.');
      notice('Taught: <b>Knowledge</b> — why bystanders freeze (K2)');
      saveResult('audio', { done: true, mode: fromRead ? 'read' : 'listen' });
      ctx.enableNext();
      ctx.positionOrb(true);
    }
    playBtn.addEventListener('click', function () {
      if (!('speechSynthesis' in window)) { finish(true); return; }
      if (playing) { speechSynthesis.cancel(); playing = false; playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Listen'; return; }
      var u = new SpeechSynthesisUtterance(AUDIO_TEXT);
      u.rate = 1.0;
      u.onboundary = function (e) { if (e.name === 'word' || e.charIndex != null) highlight(wordAt(e.charIndex)); };
      u.onend = function () { playing = false; playBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Replay'; finish(false); };
      playing = true;
      playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    });
    modeBtn.addEventListener('click', function () {
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      playing = false;
      textEl.classList.add('read-mode');
      playBtn.style.display = 'none';
      modeBtn.disabled = true;
      modeBtn.innerHTML = '<i class="fa-solid fa-check"></i> Reading';
      notice('Modality switched: <b>listen → read</b> — same objective, same credit');
      finish(true);
    });
  }

  // LEARN · Know (K4 select the tactic) — "Pick your move": four situations,
  // tap the D that fits. Some situations accept a second-best answer with a
  // coaching note. Compressible.
  var DRILL_SITS = [
    { text: 'Jake’s mid-“joke”, the room’s laughing, and you’re two feet away.',
      best: 'Direct', near: 'Distract',
      ok: 'Right — you’re close, it’s live, and naming it lands hardest in the moment.',
      nearMsg: 'Distract works too — but this close, Direct is stronger. Take it when you can.' },
    { text: 'You froze. The moment passed in seconds and everyone’s back to work.',
      best: 'Delay', near: null,
      ok: 'Exactly — the moment passing doesn’t end your options. The check-in is still an intervention.' },
    { text: 'The one doing it is your supervisor’s friend. You have zero leverage here.',
      best: 'Delegate', near: 'Document',
      ok: 'Right — power gaps are what Delegate is for. Find the person they’ll actually hear.',
      nearMsg: 'Documenting helps — but someone with standing needs to act. Delegate first, document alongside.' },
    { text: 'Third time this month. Same target, same “joke”, same room.',
      best: 'Document', near: 'Delegate',
      ok: 'Yes — a pattern needs a record. Dates, words, witnesses: that’s what moves an investigation.',
      nearMsg: 'Escalating is fair — but a pattern without a record is one person’s word. Document it too.' }
  ];
  var DRILL_DS = ['Direct', 'Distract', 'Delegate', 'Delay', 'Document'];
  var DRILL_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Learn · Know</p>' +
      '<h2>Pick your move.</h2>' +
      '<p class="ll-sub">Four moments, five Ds — tap the one that fits. There’s a best answer, and sometimes a decent second.</p>' +
      '<div class="dr-wrap">' +
        '<div class="dr-card"><span class="tag" id="drTag">Moment 1 of 4</span><p id="drText"></p></div>' +
        '<div class="dr-ds" id="drDs">' +
          DRILL_DS.map(function (d) { return '<button class="dr-d" type="button" data-d="' + d + '">' + d + '</button>'; }).join('') +
        '</div>' +
        '<p class="dr-fb" id="drFb"></p>' +
        '<p class="dr-progress" id="drProgress"><b>0</b> of 4 placed</p>' +
      '</div>' +
    '</main>';
  function drillInit(ctx) {
    var i = 0, settled = false;
    var textEl = document.getElementById('drText');
    var fb = document.getElementById('drFb');
    var btns = document.querySelectorAll('.dr-d');
    show();
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (settled) return;
        var sit = DRILL_SITS[i], d = b.dataset.d;
        if (d === sit.best) {
          settled = true; b.classList.add('hit');
          fb.className = 'dr-fb ok'; fb.textContent = sit.ok;
          advance();
        } else if (d === sit.near) {
          settled = true; b.classList.add('near');
          fb.className = 'dr-fb near'; fb.textContent = sit.nearMsg;
          advance();
        } else {
          b.classList.add('miss'); b.disabled = true;
          fb.className = 'dr-fb bad'; fb.textContent = 'Not this one — think about distance, power, and timing.';
        }
      });
    });
    function advance() {
      document.getElementById('drProgress').innerHTML = '<b>' + (i + 1) + '</b> of 4 placed';
      setTimeout(function () {
        i++;
        if (i >= DRILL_SITS.length) {
          ctx.setCoachSay('Four for four on judgment calls — choosing the move <em>is</em> the skill. Next: what the crew actually thinks.');
          notice('Logged: <b>Knowledge</b> — tactic selection (K4)');
          saveResult('drill', { done: true });
          ctx.enableNext();
          ctx.positionOrb(true);
        } else { show(); }
      }, T(2400));
    }
    function show() {
      settled = false;
      document.getElementById('drTag').textContent = 'Moment ' + (i + 1) + ' of 4';
      textEl.textContent = DRILL_SITS[i].text;
      fb.className = 'dr-fb'; fb.textContent = '';
      btns.forEach(function (b) { b.disabled = false; b.classList.remove('hit', 'near', 'miss'); });
    }
  }

  // LEARN · Feel (F1 social norms + F4 self-efficacy) — "Peer Results":
  // guess what the crew thinks, then see the actual norms data. The reveal is
  // the teaching. Survives compression on every path.
  var NORMS_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Learn · Feel</p>' +
      '<h2>Would they back you?</h2>' +
      '<p class="ll-sub">Before the numbers — your honest read of this crew.</p>' +
      '<div class="pr-wrap">' +
        '<div class="pr-choices" id="prChoices">' +
          '<button class="pr-choice" type="button" data-k="respect">Most would quietly respect it</button>' +
          '<button class="pr-choice" type="button" data-k="overreact">Most would think I overreacted</button>' +
          '<button class="pr-choice" type="button" data-k="notice">Most wouldn’t even notice</button>' +
        '</div>' +
        '<div class="pr-results" id="prResults" hidden></div>' +
        '<p class="pr-src" id="prSrc" hidden><i class="fa-solid fa-users" aria-hidden="true"></i> Anonymous survey · Acme Plant Operations · 214 responses · representative data</p>' +
      '</div>' +
    '</main>';
  var NORMS_DATA = [
    { k: 'respect',   label: 'Would quietly respect it', pct: 84 },
    { k: 'overreact', label: 'Would think it’s overreacting', pct: 11 },
    { k: 'notice',    label: 'Wouldn’t notice either way', pct: 5 }
  ];
  function normsInit(ctx) {
    ctx.floatOpen();
    ctx.setCoachSay('Quick gut check first — <strong>if you called out Jake’s “joke” in front of the crew, how would most of them react?</strong> Answer honestly; the real numbers come next.');
    var picked = null;
    document.querySelectorAll('.pr-choice').forEach(function (b) {
      b.addEventListener('click', function () {
        if (picked) return;
        picked = b.dataset.k;
        b.classList.add('picked');
        document.querySelectorAll('.pr-choice').forEach(function (c) { c.disabled = true; });
        reveal();
      });
    });
    function reveal() {
      var box = document.getElementById('prResults');
      box.innerHTML = NORMS_DATA.map(function (d) {
        return '<div class="pr-row' + (d.pct >= 50 ? ' is-top' : '') + '">' +
          '<div class="lab"><span>' + esc(d.label) + (d.k === picked ? ' <span class="you">· your guess</span>' : '') + '</span>' +
          '<span class="pct">' + d.pct + '%</span></div>' +
          '<div class="pr-track"><div class="pr-fill" data-w="' + d.pct + '"></div></div>' +
        '</div>';
      }).join('');
      box.hidden = false;
      document.getElementById('prSrc').hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        box.querySelectorAll('.pr-fill').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
      }); });
      setTimeout(function () {
        ctx.setCoachSay(picked === 'respect'
          ? 'You called it — <strong>84%</strong> say they’d respect it. Most people guess under half, and that gap is why rooms stay silent: everyone’s waiting for a first mover they’d already support.'
          : 'Here’s the part almost everyone gets wrong: <strong>84%</strong> say they’d respect it. The silence you’re reading as disapproval is usually agreement waiting for a first mover — and it doesn’t take perfect words to be that person.');
        notice('Taught: <b>Social norms</b> — the perception gap (F1)');
        saveResult('norms', { guess: picked });
        ctx.enableNext();
        ctx.positionOrb(true);
      }, T(1300));
    }
  }

  // LEARN · Do (D4 sustain) — "Conversation Step-In": Priya texts after the
  // incident and the learner takes the thread over. Rehearsal AS instruction —
  // this beat is what the mastery check's sampled item then tests.
  var STEPIN_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Learn · Do</p>' +
      '<h2>After the moment.</h2>' +
      '<p class="ll-sub">The step almost everyone skips: the follow-up. Priya just texted you — take over the thread.</p>' +
      '<div class="sms-wrap">' +
        '<div class="sms-thread" id="smsThread">' +
          '<div class="sms-head"><span class="sms-ava">P</span><b>Priya</b><small>now</small></div>' +
        '</div>' +
        '<div class="sms-replies" id="smsReplies" hidden></div>' +
        '<div class="sms-anatomy" id="smsAnatomy">' +
          '<div class="an-head"><i class="fa-solid fa-diagram-project"></i> What a strong follow-up contains</div>' +
          '<ul>' +
            '<li><i class="fa-solid fa-eye"></i><span><b>I witnessed it</b> — she isn’t carrying the memory alone.</span></li>' +
            '<li><i class="fa-solid fa-heart"></i><span><b>How are you</b> — a question, not a verdict.</span></li>' +
            '<li><i class="fa-solid fa-hand-holding-hand"></i><span><b>Your call, my support</b> — offer, don’t take over.</span></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
    '</main>';
  var STEPIN_OPENERS = [
    'hey. did everyone hear jake today or was it just loud in my head',
    'whatever. it’s fine.'
  ];
  var STEPIN_REPLIES = [
    { t: '“It wasn’t fine — I heard it too. You good? Your call what happens next, but I’ve got your back if you want to report it.”',
      good: true,
      priya: 'ok. honestly that helps. maybe tomorrow — but thanks for saying you heard it.',
      coach: 'That’s the whole skill in one message — witnessed, checked in, offered without taking over. This exact move is objective <b>D4</b>, and it shows up again very soon.' },
    { t: '“He’s like that with everyone, honestly. Don’t let him get to you.”',
      good: false,
      priya: 'yeah. sure.',
      coach: 'Feel that thread go cold? “He’s like that” tells her the room accepts it — and leaves her alone with it. Try again: what would you want someone to say to you?' },
    { t: '“You should report him RIGHT NOW. Want me to walk you to HR??”',
      good: false,
      priya: 'whoa — i don’t know. i wasn’t asking for that.',
      coach: 'Right instinct, wrong grip. Reporting is <em>her</em> call — pressure turns support into another thing happening <em>to</em> her. Offer it; don’t drive it.' }
  ];
  function stepinInit(ctx) {
    ctx.floatOpen();
    ctx.setCoachSay('Read the thread as it lands. When it’s your turn, pick the reply you’d actually send.');
    var thread = document.getElementById('smsThread');
    var replies = document.getElementById('smsReplies');
    STEPIN_OPENERS.forEach(function (m, i) {
      setTimeout(function () {
        addMsg('them', m);
        if (i === STEPIN_OPENERS.length - 1) setTimeout(showReplies, T(700));
      }, T(600 + i * 1400));
    });
    function addMsg(kind, text) {
      var d = document.createElement('div');
      d.className = 'sms-msg ' + kind; d.textContent = text;
      thread.appendChild(d);
      requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('in'); }); });
    }
    function showReplies() {
      var tag = document.createElement('div');
      tag.className = 'sms-takeover'; tag.textContent = 'You take it from here';
      thread.appendChild(tag);
      replies.hidden = false;
      STEPIN_REPLIES.forEach(function (r) {
        var b = document.createElement('button');
        b.className = 'sms-reply'; b.type = 'button'; b.textContent = r.t;
        b.addEventListener('click', function () { send(r, b); });
        replies.appendChild(b);
      });
      ctx.positionOrb(true);
    }
    function send(r, btn) {
      addMsg('you', r.t.replace(/^“|”$/g, ''));
      setTimeout(function () { addMsg('them', r.priya); }, T(900));
      setTimeout(function () {
        ctx.setCoachSay(r.coach);
        if (r.good) {
          replies.querySelectorAll('.sms-reply').forEach(function (b) { b.disabled = true; });
          document.getElementById('smsAnatomy').classList.add('show');
          notice('Taught: <b>Behavioral skills</b> — the follow-up (D4)');
          saveResult('stepin', { done: true });
          ctx.enableNext();
        } else {
          btn.disabled = true;   // weak reply spent — rehearse until it lands
        }
        ctx.positionOrb(true);
      }, T(1800));
    }
  }

  // ==========================================================================
  //  ENTRY COMPRESSION — the Knowledge Layer moment, at its contract-native
  //  position: immediately after the entry battery. The Learning Layer scores
  //  the battery against module BO-2's signed objectives and compresses the
  //  Learn beats the learner already verified (test-out). The compliance-
  //  locked item and the Perform stage are untouchable. Presenter override:
  //  "Demo: flip entry result".
  // ==========================================================================
  var COMPRESS_CONTENT =
    '<main class="ll-object" id="adjustObject">' +
      '<p class="ll-eyebrow">The Knowledge Layer</p>' +
      '<h2 id="adjHeadline">Scoring your entry battery…</h2>' +
      '<p class="ll-sub" id="adjSub">Your answers are being mapped to the module’s SME-signed objectives — ' +
        'what you’ve already proven decides what you skip.</p>' +
      '<ol class="path-rail" id="pathRail" aria-label="Your learning path"></ol>' +
      '<div class="prov-card" id="provCard" hidden>' +
        '<div class="prov-head"><i class="fa-solid fa-diagram-project" aria-hidden="true"></i> Why this changed</div>' +
        '<ol class="prov-chain" id="provChain"></ol>' +
      '</div>' +
    '</main>';

  // The path map in contract order. `compressible` marks the Learn beats a
  // strong entry battery removes; the Check carries the locked item; Perform
  // is the floor — it runs for everyone, always.
  var PATH_NODES = [
    { icon: 'fa-hand-sparkles', label: 'Welcome',              state: 'done' },
    { icon: 'fa-wave-square',   label: 'Entry battery',        state: 'done', sub: 'Entry · Know & Feel' },
    { icon: 'fa-circle-play',   label: 'Intro video',          state: 'next', sub: 'Learn · Know', shortcut: true },
    { icon: 'fa-headphones',    label: 'Why rooms stay quiet', state: 'next', sub: 'Learn · Know K2 · listen or read', compressible: true },
    { icon: 'fa-list-check',    label: 'The Five Ds',          state: 'next', sub: 'Learn · Know K3', compressible: true },
    { icon: 'fa-hand-pointer',  label: 'Pick your move',       state: 'next', sub: 'Learn · Know K4', compressible: true },
    { icon: 'fa-scale-balanced', label: 'A real case',         state: 'next', sub: 'Learn · Know', compressible: true },
    { icon: 'fa-users',         label: 'Would they back you?', state: 'next', sub: 'Learn · Feel F1 — never compresses' },
    { icon: 'fa-comment-dots',  label: 'After the moment',     state: 'next', sub: 'Learn · Do D4 — never compresses' },
    { icon: 'fa-clipboard-check', label: 'Mastery check',      state: 'next', sub: 'Check · one item locked', locked: true },
    { icon: 'fa-comments',      label: 'The Marshall scenario', state: 'next', sub: 'Perform · rubric-scored', floor: true },
    { icon: 'fa-chart-simple',  label: 'Aptitude profile',     state: 'next', sub: 'Record' }
  ];

  var COMPRESS_BRANCHES = {
    compressed: {
      headline: 'Your path just got shorter.',
      sub: 'Test-out: the entry battery verified the Know objectives, so four Learn beats compress out and the ' +
           'intro runs as the short cut. Your record still shows full coverage.',
      narration: [
        'Quick work, Rob — the entry battery just verified <b>K1–K4</b>: the bystander effect, the five Ds, and how to pick between them.',
        'So the Know beats compress out — you’ll never sit through them, and your record still shows full coverage. The Feel and Do beats stay: beliefs and skills can’t be verified by a quiz.',
        'One thing never compresses: the Marshall scenario. You can’t test out of a skill — you can only show it. Here’s your path, and the paper trail.'
      ],
      chain: [
        '<b>The signed objectives.</b> Module BO-2 “Step In” · <em>K1–K3 · Know / Remember & Understand</em> — the five Ds and the barriers to intervention. SME-signed once, at the spec. <i class="fa-solid fa-circle-check prov-ok" aria-hidden="true"></i>',
        '<b>The evidence.</b> The entry battery — Know & Feel items only; a skill is never quizzed. Both items correct, construct-mapped to <em>Knowledge</em> and <em>Perceived behavioral control</em>.',
        '<b>The recomposition.</b> Test-out: four Know beats compressed, the intro cut short. The Feel and Do beats, the locked mastery item and the Perform stage are untouched — compressed never, shown always.'
      ]
    },
    full: {
      headline: 'The full build — for now.',
      sub: 'Nothing verified at entry yet, so nothing compresses. The path can still change at the mastery check — ' +
           'and it ends at the scenario either way.',
      narration: [
        'Honest start, Rob — the entry battery didn’t verify anything yet, so nothing compresses.',
        'You get the full build: the narrated barriers piece, the five Ds and the tactic drill, the case study — plus the Feel and Do beats everyone gets. The path stays live, too: a miss at the mastery check gets fixed in the moment.',
        'Either way it ends the same place: the Marshall scenario. You can’t test out of a skill — you can only show it. Here’s your path.'
      ],
      chain: [
        '<b>The signed objectives.</b> Module BO-2 “Step In” · <em>K1–K3</em> — SME-signed, and not yet evidenced by you.',
        '<b>The evidence.</b> The entry battery missed the Knowledge item, so nothing suppresses. No penalty — the full build is the default, not a punishment.',
        '<b>The recomposition.</b> Still armed: a miss at the mastery check inserts in-course remediation on the spot, and the Perform stage feeds your profile and what comes next.'
      ]
    }
  };
  function pathNodeHTML(n) {
    var state = n.state;
    var chip = state === 'done' ? '<span class="pn-chip pn-done"><i class="fa-solid fa-check"></i> Done</span>'
             : state === 'planned' ? '<span class="pn-chip pn-planned">Planned</span>'
             : state === 'added' ? '<span class="pn-chip pn-added"><i class="fa-solid fa-wand-magic-sparkles"></i> ' + esc(n.tag || 'Added') + '</span>'
             : '<span class="pn-chip pn-next">Up next</span>';
    // Compliance-locked content rides in addition to the state chip —
    // recomposition can never remove it, only serve it harder.
    if (n.locked) chip += '<span class="pn-chip pn-locked" title="Compliance-locked — never compressed, served harder"><i class="fa-solid fa-lock"></i> Locked</span>';
    if (n.floor) chip += '<span class="pn-chip pn-floor" title="The culminating simulation is the minimum experience — it runs even at full test-out">Always runs</span>';
    return '<li class="path-node ' + (n.cls || '') + '" data-state="' + state + '">' +
             '<span class="pn-ico"><i class="fa-solid ' + n.icon + '" aria-hidden="true"></i></span>' +
             '<span class="pn-main"><span class="pn-label">' + esc(n.label) + '</span>' +
             (n.sub ? '<span class="pn-sub">' + esc(n.sub) + '</span>' : '') + '</span>' +
             chip +
           '</li>';
  }

  function compressInit(ctx) {
    var strength = entryStrength();
    var up = testUp();
    var B = COMPRESS_BRANCHES[strength];
    var rail = document.getElementById('pathRail');
    rail.innerHTML = PATH_NODES.map(pathNodeHTML).join('');
    notice('Entry battery scored against <b>module BO-2</b>’s signed objectives');

    // CLARA narrates in the docked panel; the map reacts on cue.
    var echo = ctx.chrome.querySelector('#claraEcho');
    var lines = B.narration;
    function bubble(i, el) {
      el.className = 'cbub clara typing';
      el.innerHTML = '<span></span><span></span><span></span>';
      echo.scrollTop = echo.scrollHeight;
      setTimeout(function () {
        el.className = 'cbub clara'; el.innerHTML = lines[i];
        echo.scrollTop = echo.scrollHeight;
        if (i === lines.length - 1) { setTimeout(applyCompression, T(700)); return; }
        var next = document.createElement('div');
        echo.appendChild(next);
        setTimeout(function () { bubble(i + 1, next); }, T(900));
      }, T(i === 0 ? 900 : 1300));
    }
    bubble(0, echo.querySelector('.clara-say') || echo.appendChild(document.createElement('div')));

    function applyCompression() {
      document.getElementById('adjHeadline').textContent = B.headline;
      document.getElementById('adjSub').textContent = B.sub;
      var nodes = [].slice.call(rail.children);
      if (strength === 'compressed') {
        // Strike the compressible Learn beats one after another, then mark the
        // short cut and (when earned) the advanced-tier check.
        var targets = nodes.filter(function (li, i) { return PATH_NODES[i].compressible; });
        targets.forEach(function (li, i) {
          setTimeout(function () {
            li.classList.add('is-skipped');
            var c = li.querySelector('.pn-chip');
            if (c) c.outerHTML = '<span class="pn-chip pn-skipped"><i class="fa-solid fa-forward"></i> Verified at entry — compressed</span>';
          }, T(300 + i * 550));
        });
        setTimeout(function () {
          nodes.forEach(function (li, i) {
            if (PATH_NODES[i].shortcut) {
              var c = li.querySelector('.pn-chip');
              if (c) c.outerHTML = '<span class="pn-chip pn-done"><i class="fa-solid fa-scissors"></i> Short cut · 4 min</span>';
            }
            if (PATH_NODES[i].locked && up) {
              li.querySelector('.pn-chip').outerHTML =
                '<span class="pn-chip pn-added"><i class="fa-solid fa-arrow-trend-up"></i> Test-up · advanced tier</span>';
            }
          });
          notice('Path recomposed: <b>' + targets.length + ' beats compressed</b>' + (up ? ', check served at the <b>advanced tier</b>' : ''));
          revealProvenance();
        }, T(300 + targets.length * 550 + 400));
      } else {
        notice('Nothing compressed — <b>full build</b>');
        revealProvenance();
      }
    }
    function revealProvenance() {
      var card = document.getElementById('provCard');
      document.getElementById('provChain').innerHTML =
        B.chain.map(function (li) { return '<li>' + li + '</li>'; }).join('');
      card.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.add('in'); }); });
      saveResult('entry', { strength: strength, up: up });
      // Refresh the counters FIRST (compression changes the visible total),
      // then unlock Continue: updateFooter re-arms the gate.
      updateFooter(STEPS[idx]);
      updateFrame(STEPS[idx]);
      ctx.enableNext();
    }
    wireSidebarChat(ctx, [
      'Nothing here was improvised — compression picks over module structures the Learning Layer derived from BO-2’s SME-signed objectives.',
      strength === 'compressed'
        ? 'Because you proved K1–K3 at entry. Test-out removes only what’s evidenced — the locked item and the scenario stay for everyone.'
        : 'Because nothing’s evidenced yet. The full build is the default — and the mastery check can still recompose the path in the moment.',
      'Your administrator sees the same chain you do: the objective, the evidence, and the change — nothing is silent.',
      'If you’d rather take the full path anyway, your organization can turn test-out off per course — it’s a setting, not a mandate.'
    ]);
  }

  // ==========================================================================
  //  IN-COURSE REMEDIATION — the object the mastery-check miss inserted, in
  //  the moment. Two rehearsal beats on objective D4: the words in the room,
  //  then the follow-up the check just showed was shaky.
  // ==========================================================================
  var PRACTICE_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow"><i class="fa-solid fa-wand-magic-sparkles"></i> In-course remediation · 2 minutes</p>' +
      '<h2>Say it out loud.</h2>' +
      '<p class="ll-sub">Knowing the right move isn’t the same as having the words ready. ' +
        'Two quick reps — the moment itself, then the follow-up.</p>' +
      '<div class="mp-scene" id="mpScene">' +
        '<div class="mp-scene-tag"><i class="fa-solid fa-clapperboard" aria-hidden="true"></i> Friday, shift meeting</div>' +
        '<p id="mpSceneText">Jake tries the same “joke” again — this time about Priya, in front of everyone. ' +
          'You’re standing right there, and a couple of people glance at you.</p>' +
      '</div>' +
    '</main>';
  var PRACTICE_Q1 = {
    stem: 'Right there, in the room — <strong>what do you say?</strong>',
    options: [
      { t: '“That’s not okay, Jake. Drop it.”', good: true,
        reply: 'That’s it — short, direct, names the behavior, no debate opened. That line works in any room.' },
      { t: '“Ha… anyway — about the schedule.”', good: false,
        reply: 'That’s a deflection — it changes the subject but tells the room the joke was fine. Try the direct version.' },
      { t: '“Come on — we’ve talked about this. Not cool.”', good: true,
        reply: 'Good — it names it and references the earlier conversation. Direct beats clever every time.' }
    ]
  };
  var PRACTICE_Q2 = {
    stem: 'Now the part almost everyone skips — <strong>Priya’s back at her desk. What’s your check-in?</strong>',
    options: [
      { t: '“I saw what happened. You good? I’ve got your back if you want to report it.”', good: true,
        reply: 'Exactly — you witnessed it, you checked in, and you offered support without taking over. That’s the full skill.' },
      { t: '“Ignore Jake — he’s harmless.”', good: false,
        reply: 'That minimizes it — and asks Priya to carry it alone. Acknowledge what you saw instead.' },
      { t: '“Want me to say something next time?”', good: false,
        reply: 'Kind instinct — but “next time” concedes there’ll be one, and you already saw this time. Lead with what you witnessed.' }
    ]
  };
  function practiceInit(ctx) {
    ctx.floatOpen();
    rep(PRACTICE_Q1, function () {
      setTimeout(function () {
        document.getElementById('mpSceneText').textContent =
          'The meeting breaks up. Priya heads back to her desk, quieter than usual.';
        document.querySelector('#mpScene .mp-scene-tag').innerHTML =
          '<i class="fa-solid fa-clapperboard" aria-hidden="true"></i> Ten minutes later';
        rep(PRACTICE_Q2, function () {
          notice('Logged: <b>Behavioral skills</b> — Practice Needed → Good');
          saveResult('practice', { done: true });
          ctx.enableNext();
        });
      }, T(1600));
    });
    function rep(q, onGood) {
      ctx.setCoachSay(q.stem);
      var bubble = ctx.els.bubble;
      var old = bubble.querySelector('.vq-chips'); if (old) old.remove();
      var oldFb = bubble.querySelector('.vq-feedback'); if (oldFb) oldFb.remove();
      var chips = document.createElement('div'); chips.className = 'clara-chips vq-chips';
      var fb = document.createElement('div'); fb.className = 'vq-feedback';
      var settled = false;
      q.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'clara-chip'; b.type = 'button'; b.textContent = opt.t;
        b.addEventListener('click', function () {
          if (settled) return;
          if (opt.good) {
            settled = true;
            chips.querySelectorAll('.clara-chip').forEach(function (c) { c.disabled = true; });
            b.classList.add('is-correct');
            fb.className = 'vq-feedback ok'; fb.textContent = opt.reply;
            onGood();
          } else {
            b.classList.add('is-wrong'); b.disabled = true;
            fb.className = 'vq-feedback bad'; fb.textContent = opt.reply;
          }
          ctx.positionOrb(true);
        });
        chips.appendChild(b);
      });
      bubble.appendChild(chips); bubble.appendChild(fb);
      ctx.positionOrb(true);
    }
  }

  // Step 9 — the aptitude profile: construct-by-construct, baseline → now.
  // Follows the AI Aptitude Assessment scoring model: qualitative bands per
  // construct, quantitative pass = at least Good on 80% of objectives (4 of 5).
  function computeProfile(course) {
    var base = (course.baseline && course.baseline.bands) ||
               { knowledge: 2, beliefs: 2, norms: 2, skills: 2, control: 2 };
    var s = course.scenario || {};
    var score = (typeof s.score === 'number') ? s.score : 82;
    var strength = (course.entry && course.entry.strength) || entryStrength();
    var up = (course.entry && course.entry.up) || testUp();
    var ck = course.check || {}, v = course.video1 || {};
    var remediated = !!(course.practice && course.practice.done);
    var strong = score >= 88;
    var after = {
      knowledge: base.knowledge >= 2 ? 3 : 2,     // entry-verified + locked item held → Excellent; full build → Good
      beliefs:   strong ? 3 : Math.max(base.beliefs, 2),
      norms:     strong ? 3 : 2,
      skills:    strong ? 3 : remediated ? 2 : (ck.item2 === 'good' ? 2 : (ck.missed ? 1 : 2)),
      control:   strong ? 3 : Math.max(base.control, 2)
    };
    var evidence = {
      knowledge: base.knowledge >= 2
        ? 'Verified K1–K3 at entry, then held the locked mastery item' + (up ? ' at the advanced tier' : '') + ' — first try.'
        : 'Built through the full path, then held the compliance-locked mastery item.',
      beliefs: '“Someone had to say it — better me than nobody.” — the Marshall scenario',
      norms: 'Read the break room’s silence as pressure — and acted anyway. — the Marshall scenario',
      skills: remediated
        ? '“I saw what happened. You good?” — the follow-up, rehearsed in remediation, then executed live in the scenario.'
        : ck.item2 === 'good'
          ? 'Picked the strong follow-up at the mastery check — then executed the tactic live under pushback.'
          : ck.missed
            ? 'The follow-up never landed — remediation still queued.'
            : 'Executed the chosen tactic live and held it under pushback. — the Marshall scenario',
      control: v.answered
        ? 'Self-rated “' + (v.choice || '') + '” at the start — then held up under real pushback.'
        : 'Held steady under Jake’s pushback in the scenario.'
    };
    var atGood = CONSTRUCTS.filter(function (c) { return after[c.key] >= 2; }).length;
    return { base: base, after: after, evidence: evidence, atGood: atGood, strength: strength, up: up,
             remediated: remediated, missed: !!ck.missed,
             pass: atGood >= Math.ceil(CONSTRUCTS.length * 0.8) };
  }

  function resultsInit(ctx) {
    var course = readCourse();
    var P = computeProfile(course);

    var C = 477.5;
    document.getElementById('resArc').style.strokeDashoffset =
      String(C * (1 - P.atGood / CONSTRUCTS.length));
    document.getElementById('resScoreNum').textContent = P.atGood;
    document.getElementById('resScoreOf').textContent = '/' + CONSTRUCTS.length;

    document.getElementById('resHeadline').textContent =
      P.pass ? 'Competency demonstrated, Rob.' : 'Real progress, Rob — one construct to go.';
    document.getElementById('aptPass').innerHTML = P.pass
      ? '<i class="fa-solid fa-circle-check"></i> <b>Pass</b> — you scored Good or above on ' +
        P.atGood + ' of ' + CONSTRUCTS.length + ' objectives (the bar is 80%). Not “right answers” — demonstrated behavior.'
      : '<i class="fa-solid fa-circle-half-stroke"></i> <b>Almost</b> — ' + P.atGood + ' of ' + CONSTRUCTS.length +
        ' objectives at Good or above; the bar is 80%. CLARA has queued targeted practice for the gap.';
    var pathBits = [];
    if (P.strength === 'compressed') pathBits.push('<b>2 beats compressed at entry</b> (test-out)');
    if (P.up) pathBits.push('check served at the <b>advanced tier</b> (test-up)');
    if (P.remediated || P.missed) pathBits.push('<b>remediation inserted</b> at the mastery check');
    document.getElementById('aptPath').innerHTML =
      '<i class="fa-solid fa-wand-magic-sparkles"></i> ' +
      (pathBits.length ? 'Your path was recomposed live: ' + pathBits.join(' · ') + '.'
                       : 'You ran the full build — no recomposition needed this time.');

    // Construct rows: baseline band → current band, with momentum + evidence.
    var list = document.getElementById('aptList');
    CONSTRUCTS.forEach(function (c) {
      var b = P.base[c.key], a = P.after[c.key];
      var mom = a > b ? ['up', 'fa-arrow-trend-up', 'Improved'] :
                a < b ? ['down', 'fa-arrow-trend-down', 'Declined'] : ['held', 'fa-arrows-left-right', 'Held'];
      var li = document.createElement('li'); li.className = 'apt-row';
      li.innerHTML =
        '<span class="apt-ico"><i class="fa-solid ' + c.icon + '" aria-hidden="true"></i></span>' +
        '<div class="apt-main">' +
          '<div class="apt-head"><h3>' + esc(c.name) + '</h3>' +
            '<span class="apt-mom ' + mom[0] + '"><i class="fa-solid ' + mom[1] + '"></i> ' + mom[2] + '</span></div>' +
          '<div class="apt-bands">' +
            '<span class="band ' + BANDS[b].cls + '">' + BANDS[b].label + '</span>' +
            '<i class="fa-solid fa-arrow-right-long apt-arrow" aria-hidden="true"></i>' +
            '<span class="band ' + BANDS[a].cls + '">' + BANDS[a].label + '</span>' +
          '</div>' +
          '<p class="apt-evidence"><i class="fa-solid fa-quote-left" aria-hidden="true"></i> ' + esc(P.evidence[c.key]) + '</p>' +
        '</div>';
      list.appendChild(li);
    });

    typeFeedback(ctx, [
      P.pass
        ? 'This is the part I like, Rob — not a pass mark, a profile. You demonstrated ' + P.atGood + ' of ' +
          CONSTRUCTS.length + ' constructs at Good or above.'
        : 'Here’s your profile, Rob — honest picture: ' + P.atGood + ' of ' + CONSTRUCTS.length +
          ' constructs at Good or above, and I’ve already queued practice for the gap.',
      'Every band traces to something you actually said or did — ask me about any of them.',
      'One more thing: your Perform evidence just pre-verified two objectives in <b>Hazard Communication</b>. Your next course got shorter before you ever opened it.'
    ]);
    try { sessionStorage.setItem('clara-next-recomposed', '1'); } catch (e) {}
    document.getElementById('resBasis').innerHTML =
      '<i class="fa-solid fa-circle-info"></i> Scoring follows the AI Aptitude Assessment model: each construct is scored ' +
      'qualitatively (<strong>Practice Needed / Good / Excellent</strong>) and passing means at least Good on 80% of objectives. ' +
      'Scenario-derived bands here are <strong>representative</strong> — the live construct rubric slots in at <code>computeProfile()</code>.';
    ctx.positionOrb(false);
    wireSidebarChat(ctx, [
      'Your strongest signal was reading the room — you treated the others’ silence as pressure to resist, not permission to stay quiet.',
      'Behavioral skills moved at the mastery check — the rehearsal reps made the follow-up automatic before the scenario ever tested it.',
      'Every band on this screen traces back to a specific thing you said or did — your administrator sees the same evidence chain, never just a number.',
      'If you want, you can rerun just the scenario from the course menu — your profile updates from whatever you demonstrate next.'
    ]);
  }

  // Type a sequence of CLARA bubbles into the sidebar thread: each shows a
  // typing indicator first, then reveals its text. The first message reuses the
  // chrome's own (empty) greeting bubble; the rest are appended after it lands.
  // Runs inside resultsInit → inside showStep's synchronous build, so the first
  // bubble becomes a typing indicator before the browser paints (no flash of an
  // empty/placeholder bubble). Near-instant under reduced motion (T() → 0).
  function typeFeedback(ctx, lines) {
    var echo = ctx.chrome.querySelector('#claraEcho');
    if (!echo || !lines.length) return;
    function showTyping(b) {
      b.className = 'cbub clara typing';
      b.innerHTML = '<span></span><span></span><span></span>';
      echo.scrollTop = echo.scrollHeight;
    }
    function reveal(b, text) {
      b.className = 'cbub clara';
      b.innerHTML = text;
      echo.scrollTop = echo.scrollHeight;
    }
    function run(i, bubble) {
      showTyping(bubble);
      setTimeout(function () {
        reveal(bubble, lines[i]);
        if (i + 1 < lines.length) {
          var next = document.createElement('div');
          echo.appendChild(next);
          run(i + 1, next);
        }
      }, T(i === 0 ? 750 : 900));
    }
    run(0, echo.querySelector('.clara-say') || echo.querySelector('.cbub.clara') || echo.appendChild(document.createElement('div')));
  }

  // Docked-CLARA chat (results step): a canned back-and-forth in the sidebar
  // panel — type a question, CLARA answers (no LLM yet). The thread auto-scrolls
  // to the newest message, following the coach-panel behavior. PLACEHOLDER
  // replies; swap the array (or hook a model) when ready.
  var CLARA_REPLIES = [
    "Great question. Your strongest moment was naming what happened plainly — that's what gives a bystander credibility.",
    "If you want to go one step further: the highest-impact move is checking in with the person one-on-one afterward.",
    "Totally normal to second-guess it. What matters is that you acted — staying silent is the only real miss here.",
    "You can replay any part of the scenario from the course menu whenever you'd like more practice."
  ];
  function wireSidebarChat(ctx, replies) {
    var input = ctx.chrome.querySelector('#claraAsk');
    var send  = ctx.chrome.querySelector('#claraAskSend');
    var echo  = ctx.chrome.querySelector('#claraEcho');
    if (!input || !send || !echo) return;
    var pool = replies || CLARA_REPLIES;
    var ri = 0;
    function addRow(kind, text) {
      var d = document.createElement('div');
      d.className = 'cbub ' + kind;                 // 'you' | 'clara' — styled as a speech bubble
      d.textContent = text;
      echo.appendChild(d);
      echo.scrollTop = echo.scrollHeight;          // follow the newest message
    }
    function submit() {
      var v = input.value.trim();
      if (!v) return;
      addRow('you', v);
      input.value = '';
      setTimeout(function () { addRow('clara', pool[ri % pool.length]); ri++; }, T(450));
    }
    send.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  }

  // ==========================================================================
  //  The step manifest — the module contract run literally:
  //  Entry → Learn → Check → Perform → Record. Numbering is DYNAMIC: steps
  //  carry when() and enter/leave the path live (entry compression removes two
  //  Learn beats; a check miss inserts remediation), so "Section n of N" is
  //  itself part of the recomposition demo.
  // ==========================================================================
  var COURSE = 'Bystander Intervention';
  var STEPS = [
    { id: 'intro', mode: 'floating', lesson: 'Welcome', cover: true, nextLabel: 'Start course',
      caption: { title: 'Course title page · Floating companion', note: 'The standard LMS anatomy — description, live sections list, requirements, coordinator — rendered from the actual path, so it foreshadows compression and stays honest on return visits. The bottom nav is the CTA: Start course, no back, no counter.' },
      coach: { say: 'Hi Rob — I’ll be with you the whole way. Start whenever you’re ready.' },
      content: INTRO_CONTENT, init: introInit },

    { id: 'baseline', icon: 'fa-wave-square', mins: 1, stage: 'Entry', mode: 'floating', lesson: 'Entry Check', gate: true,
      caption: { title: 'ENTRY · Floating companion', note: 'The module contract’s Entry stage: Know & Feel probes before any content. What a learner proves here is compressed out of the path (test-out); skills are never quizzed — the Perform stage is where they’re shown.' },
      coach: { say: 'Loading…' },   // baselineInit swaps in Q1 immediately
      content: BASELINE_CONTENT, init: baselineInit },

    { id: 'compress', icon: 'fa-diagram-project', mins: 1, stage: 'Entry', mode: 'sidebar', lesson: 'Your Path, Compressed', gate: true,
      caption: { title: 'ENTRY · Knowledge Layer · Docked guide', note: 'The Learning Layer scores the entry battery against module BO-2’s SME-signed objectives and compresses the Learn beats already verified. Locked items and the Perform stage are untouchable. Presenter control: Demo — flip entry result.' },
      coach: { say: '', ask: 'Ask CLARA about this change…' },   // narration is TYPED IN by compressInit
      content: COMPRESS_CONTENT, init: compressInit },

    { id: 'video', icon: 'fa-circle-play', mins: 2, stage: 'Learn', mode: 'floating', lesson: 'See It Happen', gate: true,
      caption: { title: 'LEARN · Gated video', note: 'The first Learn beat. On the compressed build CLARA frames it as the short cut; the clip must play and the learner answers CLARA’s check before Continue unlocks.' },
      coach: { say: 'Press play when you’re ready — I’ll have one quick question for you once it wraps.' },
      content: videoContent({ eyebrow: 'Learn · watch', heading: 'Introduction',
        sub: 'First, let’s introduce you to the basics of sexual harassment, how to respond, and why this lesson matters.',
        src: '../../assets/videos/marshall-preroll.mp4' }),
      init: videoInit },

    { id: 'audio', icon: 'fa-headphones', mins: 2, stage: 'Learn', mode: 'floating', lesson: 'Why Rooms Stay Quiet', gate: true,
      when: function () { return entryStrength() === 'full'; },
      caption: { title: 'LEARN · Know beat — Audio Summary', note: 'Narrated text with word-by-word highlighting (K2, diffusion of responsibility) and a Read-instead toggle — the modality-switching feature, live: listen or read, same objective, same credit. Compressible at entry.' },
      coach: { say: 'This one you can listen to or read — your call. Tap Listen when you’re ready.' },
      content: AUDIO_CONTENT, init: audioInit },

    { id: 'terms', icon: 'fa-list-check', mins: 1, stage: 'Learn', mode: 'floating', lesson: 'The Five Ds', gate: true,
      when: function () { return entryStrength() === 'full'; },
      caption: { title: 'LEARN · Know beat — Terms to Remember', note: 'The five Ds as flip cards (K3/K4) — one of the two beats a strong entry battery compresses away. Gate: every card flipped.' },
      coach: { say: 'Five moves, five cards — flip each one. You only ever need the one that fits the moment.' },
      content: TERMS_CONTENT, init: termsInit },

    { id: 'drill', icon: 'fa-hand-pointer', mins: 2, stage: 'Learn', mode: 'floating', lesson: 'Pick Your Move', gate: true,
      when: function () { return entryStrength() === 'full'; },
      caption: { title: 'LEARN · Know beat — tactic drill', note: 'Four situations, five Ds (K4, select the tactic) — best answers plus accepted seconds with coaching notes. Compressible at entry.' },
      coach: { say: 'You know the five moves — now pick the right one under real constraints.' },
      content: DRILL_CONTENT, init: drillInit },

    { id: 'norms', icon: 'fa-users', mins: 1, stage: 'Learn', mode: 'floating', lesson: 'Would They Back You?', gate: true,
      caption: { title: 'LEARN · Feel beat — Peer Results', note: 'The norms correction (F1, gap-fill content the base course never had): guess the crew’s reaction, then the real numbers land. Survives compression on every path — beliefs can’t be tested out of at entry.' },
      coach: { say: 'Loading…' },   // normsInit swaps in the question immediately
      content: NORMS_CONTENT, init: normsInit },

    { id: 'stepin', icon: 'fa-comment-dots', mins: 2, stage: 'Learn', mode: 'floating', lesson: 'After the Moment', gate: true,
      caption: { title: 'LEARN · Do beat — Conversation Step-In', note: 'Rehearsal as instruction (D4): Priya texts after the incident and the learner takes the thread over. Weak replies get Priya’s real reaction and another try. This beat is what the mastery check’s sampled item then tests.' },
      coach: { say: 'Loading…' },   // stepinInit runs the thread immediately
      content: STEPIN_CONTENT, init: stepinInit },

    { id: 'casevideo', icon: 'fa-scale-balanced', mins: 2, stage: 'Learn', mode: 'floating', lesson: 'A Real Case', gate: true,
      when: function () { return entryStrength() === 'full'; },
      caption: { title: 'LEARN · Case beat', note: 'The real-case close — the second beat entry compression removes. No question here; the mastery items live in the Check stage.' },
      coach: { say: 'One real case before the check — press play.' },
      content: videoContent({ eyebrow: 'Learn · watch', heading: 'A real case',
        sub: 'What it costs when nobody steps in — a case that went to court.',
        src: '../../assets/videos/marshall-postscenario.mp4' }),
      init: caseInit },

    { id: 'check', icon: 'fa-clipboard-check', mins: 1, stage: 'Check', mode: 'floating', lesson: 'Mastery Check', gate: true,
      caption: { title: 'CHECK · Floating companion', note: 'Two items: the compliance-locked objective (asked of everyone, retry until right, advanced tier on test-up) and a sampled D4 item. A weak answer on the sampled item inserts in-course remediation on the spot — the section counter grows live.' },
      coach: { say: 'Loading…' },   // checkInit swaps in item 1 immediately
      content: CHECK_CONTENT, init: checkInit },

    { id: 'practice', icon: 'fa-wand-magic-sparkles', mins: 2, stage: 'Check', mode: 'floating', lesson: 'Quick Practice', gate: true,
      when: function () { return checkMissed(); },
      caption: { title: 'CHECK · In-course remediation', note: 'The learning object the mastery-check miss inserted — two rehearsal reps on objective D4, fixed in the moment rather than flagged for later.' },
      coach: { say: 'Loading…' },   // practiceInit swaps in the first rep immediately
      content: PRACTICE_CONTENT, init: practiceInit },

    { id: 'scene', icon: 'fa-clapperboard', mins: 1, stage: 'Perform', mode: 'ambient', lesson: 'Setting the Scene', nextLabel: 'Enter scenario',
      caption: { title: 'PERFORM · Scene-setting', note: 'The establishing shot for the Perform stage. The scenario page skips its own establishing card and drops straight into the cold-open.' },
      coach: { eyebrow: "Perform — nobody tests out of this", headline: '“The Marshall Scenario”',
        lede: "In a second you'll be in a real break-room exchange. Take in who's here and what's going on, " +
              "then it's your call how to respond. There's no perfect script here you need to follow." },
      init: sceneInit },

    { id: 'scenario', icon: 'fa-comments', mins: 8, stage: 'Perform', external: 'scenario.html', lesson: 'The Marshall Scenario' },

    { id: 'results', icon: 'fa-chart-simple', mins: 2, stage: 'Record', mode: 'sidebar', lesson: 'Your Aptitude Profile',
      caption: { title: 'RECORD · Aptitude profile', note: 'Construct-by-construct bands from entry to close, the recompositions that happened live, and the cross-module payoff: Perform evidence pre-verifies objectives in the learner’s next course.' },
      coach: { say: '', ask: 'Ask CLARA about your profile…' },   // greeting is TYPED IN by resultsInit (typing bubble → text)
      content: RESULTS_CONTENT, init: resultsInit }
  ];

  // The currently-visible path (steps whose when() holds) and a step's place
  // in it. A hidden step reports the position of the step before it so the
  // frame never shows a phantom section.
  function visiblePath() {
    return STEPS.filter(function (s) { return !s.when || s.when(); });
  }
  function stepPos(step) {
    var path = visiblePath();
    var n = path.indexOf(step) + 1;
    if (n === 0) n = 1;
    return { n: n, total: path.length };
  }

  // ==========================================================================
  //  Coach-chrome builders (per mode) — ported from layered-learning.js
  // ==========================================================================
  function chromeHTML(mode, coach) {
    var slotAmbient = '<div class="clara-slot"><div class="clara-aura"></div></div>';
    var slot = '<div class="clara-slot"></div>';
    if (mode === 'ambient') {
      return slotAmbient +
        (coach.eyebrow ? '<div class="clara-eyebrow">' + esc(coach.eyebrow) + '</div>' : '') +
        '<h1>' + esc(coach.headline || "Hi, I'm CLARA.") + '</h1>' +
        (coach.lede ? '<p class="clara-lede">' + coach.lede + '</p>' : '');
    }
    if (mode === 'sidebar') {
      return slot +
        '<div class="clara-name">CLARA</div>' +
        '<div class="clara-echo" id="claraEcho">' +               // scrollable bubble thread
          '<div class="cbub clara clara-say">' + (coach.say || '') + '</div>' +   // greeting (setCoachSay targets .clara-say)
        '</div>' +
        '<div class="clara-composer">' +
          '<input id="claraAsk" type="text" placeholder="' + esc(coach.ask || 'Ask CLARA anything…') + '" aria-label="Ask CLARA">' +
          '<button class="clara-send" id="claraAskSend" type="button" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button>' +
        '</div>';
    }
    if (mode === 'floating') {
      return '<div class="clara-bubble"><span class="clara-name">CLARA</span>' +
        '<div class="clara-say">' + (coach.say || '') + '</div></div>' +
        '<div class="clara-slot"><span class="clara-hint" aria-hidden="true"></span></div>';
    }
    return slot;
  }

  // ==========================================================================
  //  Shell — built once; steps swap in place.
  // ==========================================================================
  var stage, orbEl, chrome, object, footer, nextBtn, backBtn, footCount, footBar, pop, infoBtn, skipBtn, branchBtn;
  var frameLesson, frameStep, frameBar;
  var idx = -1, busy = false, nextHref = null;

  function positionOrb(glide) {
    if (!chrome) return;
    var slot = chrome.querySelector('.clara-slot');
    if (!slot) return;
    var r = slot.getBoundingClientRect();
    orbEl.style.transition = glide
      ? 'left .55s var(--ll-ease), top .55s var(--ll-ease), width .55s var(--ll-ease), height .55s var(--ll-ease)'
      : 'none';
    orbEl.style.left = r.left + 'px';
    orbEl.style.top = r.top + 'px';
    orbEl.style.width = r.width + 'px';
    orbEl.style.height = r.height + 'px';
    if (!glide) requestAnimationFrame(function () { orbEl.style.transition = ''; });
  }

  function makeCtx() {
    return {
      stage: stage, chrome: chrome, orb: orbEl,
      els: { next: nextBtn, back: backBtn,
        bubble: chrome ? chrome.querySelector('.clara-bubble') : null,
        coachSay: chrome ? chrome.querySelector('.clara-say') : null },
      enableNext: function () { nextBtn.disabled = false; },
      disableNext: function () { nextBtn.disabled = true; },
      setCoachSay: function (html) { var s = chrome.querySelector('.clara-say'); if (s) s.innerHTML = html; },
      floatOpen: function () { stage.dataset.float = 'open'; },
      floatClose: function () { stage.dataset.float = 'closed'; },
      positionOrb: positionOrb, saveResult: saveResult, readCourse: readCourse
    };
  }

  function updateFrame(step) {
    var pos = stepPos(step);
    if (frameLesson) frameLesson.textContent = step.lesson;
    if (frameStep) frameStep.textContent = 'Section ' + pos.n + ' of ' + pos.total;
    if (frameBar) frameBar.setAttribute('value', String(pos.n / pos.total));
  }

  function updateFooter(step) {
    // Section counter + progress live in the bottom bar (the unified flow zone
    // with Back/Continue). Course + lesson stay in the top band, so there's no
    // duplication. Numbering comes from the VISIBLE path — recomposition can
    // shrink the denominator mid-course, and that's deliberate.
    var pos = stepPos(step);
    // The title page is a cover: no back, no counter — just the course CTA.
    if (step.cover) {
      if (footCount) footCount.textContent = 'Course overview';
      if (footBar) footBar.style.display = 'none';
      backBtn.style.display = 'none';
    } else {
      if (footCount) footCount.textContent = 'Section ' + pos.n + ' of ' + pos.total;
      if (footBar) { footBar.style.display = ''; footBar.setAttribute('value', String(pos.n / pos.total)); }
      backBtn.style.display = '';
    }
    if (skipBtn) skipBtn.style.display = step.gate ? 'inline-flex' : 'none';   // review-only, gated steps only
    if (branchBtn) branchBtn.style.display = (step.id === 'compress') ? 'inline-flex' : 'none';
    backBtn.disabled = (pos.n <= 1);
    var isLast = (pos.n >= pos.total);
    nextBtn.innerHTML = (step.nextLabel || (isLast ? 'Finish' : 'Continue')) + ' <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.disabled = !!step.gate;                 // gated steps re-enable via ctx.enableNext()
    // Popover caption
    if (step.caption) {
      pop.querySelector('.ll-pop-eyebrow').innerHTML =
        '<i class="fa-solid fa-layer-group"></i> Coach presentation · ' + pos.n + ' / ' + pos.total;
      pop.querySelector('.ll-pop-title').textContent = step.caption.title;
      pop.querySelector('.ll-pop-note').textContent = step.caption.note || '';
    }
  }

  // Render step `i`. dir 'fwd'|'back'. first=true skips the leave animation.
  function showStep(i, dir, first) {
    if (busy) return;
    var step = STEPS[i];
    if (!step) return;

    // External step (the Marshall scenario) → cross-document View Transition.
    if (step.external) {
      var loc = step.external + (step.external.indexOf('?') < 0 ? '' : '');
      try { sessionStorage.setItem('ll-dir', dir); } catch (e) {}
      window.location.href = step.external;         // @view-transition handles the animation
      return;
    }

    busy = true;
    var prevChrome = chrome, prevObject = object;
    var leaveMs = first ? 0 : T(240);

    if (!first) {
      if (prevChrome) prevChrome.classList.add('leaving');
      if (prevObject) prevObject.classList.add('leaving');
    }

    setTimeout(function () {
      if (prevChrome) prevChrome.remove();
      if (prevObject) prevObject.remove();

      stage.dataset.mode = step.mode;
      if (step.mode === 'floating') stage.dataset.float = 'open';

      // Learning-object content — append FIRST so the coach chrome sits ON TOP
      // for hit-testing. Otherwise the full-bleed (inset:0) .ll-object, though
      // transparent, intercepts mouse clicks on CLARA's chips/composer.
      object = null;
      if (step.content) {
        var holder = document.createElement('div');
        holder.innerHTML = step.content;
        object = holder.firstElementChild;
        if (!first) object.classList.add('pre-enter');
        stage.appendChild(object);
      }

      // Coach chrome (appended last → on top → its chips/composer are clickable)
      chrome = document.createElement('div');
      chrome.className = 'clara-chrome clara-chrome--' + step.mode + (first ? '' : ' pre-enter');
      chrome.innerHTML = chromeHTML(step.mode, step.coach || {});
      stage.appendChild(chrome);

      idx = i; nextHref = null;
      positionOrb(first ? false : true);            // glide to the new slot
      updateFooter(step); updateFrame(step);

      var ctx = makeCtx();
      if (step.init) { try { step.init(ctx); } catch (e) { console.error('step init', step.id, e); } }

      if (first) { busy = false; }
      else {
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          if (chrome) chrome.classList.remove('pre-enter');
          if (object) object.classList.remove('pre-enter');
          setTimeout(function () { busy = false; }, T(300));
        }); });
      }
    }, leaveMs);
  }

  function go(delta) {
    if (busy) return;
    var target = idx + delta;
    // Walk past steps the current branch hides (e.g. the micro-practice when
    // the learner tested out of it).
    while (target >= 0 && target < STEPS.length) {
      var st = STEPS[target];
      if (!st.when || st.when()) break;
      target += delta;
    }
    if (target < 0) return;
    if (target >= STEPS.length) { window.location.href = '../index.html'; return; }   // Finish → back to the lesson index
    showStep(target, delta < 0 ? 'back' : 'fwd', false);
  }

  function buildFooter() {
    footer = document.createElement('footer');
    footer.className = 'll-footer';
    // Bottom bar = the unified "flow" zone: the section counter + progress bar
    // ride here beside Back/Continue (moved down out of the top band), with the
    // "?" review aid tucked in right after the bar (bottom-left corner).
    footer.innerHTML =
      '<div class="ll-footer-meta">' +
        '<div class="ll-foot-progress">' +
          '<span class="ll-foot-count"></span>' +
          '<vaadin-progress-bar class="ll-foot-bar" value="0" aria-label="Course progress"></vaadin-progress-bar>' +
        '</div>' +
        '<button class="ll-info" id="llInfo" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="About this presentation">?</button>' +
      '</div>' +
      '<div class="ll-nav">' +
        '<button class="ll-btn ll-btn--ghost" id="llBack"><i class="fa-solid fa-arrow-left"></i> Back</button>' +
        '<button class="ll-btn ll-btn--primary" id="llNext">Continue <i class="fa-solid fa-arrow-right"></i></button>' +
      '</div>';
    document.body.appendChild(footer);
    backBtn = footer.querySelector('#llBack');
    nextBtn = footer.querySelector('#llNext');
    footCount = footer.querySelector('.ll-foot-count');
    footBar = footer.querySelector('.ll-foot-bar');
    infoBtn = footer.querySelector('#llInfo');
    backBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });

    // The "About this presentation" review popover, anchored to the footer "?".
    pop = document.createElement('div');
    pop.className = 'll-pop'; pop.id = 'llPop';
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'About this presentation');
    pop.innerHTML = '<div class="ll-pop-eyebrow"></div><div class="ll-pop-title"></div><div class="ll-pop-note"></div>';
    document.body.appendChild(pop);
    var closePop = function () { pop.classList.remove('open'); infoBtn.setAttribute('aria-expanded', 'false'); };
    infoBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      pop.classList.contains('open') ? closePop() : (pop.classList.add('open'), infoBtn.setAttribute('aria-expanded', 'true'));
    });
    document.addEventListener('click', function (e) { if (pop.classList.contains('open') && !infoBtn.contains(e.target)) closePop(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });
  }

  function buildOrb() {
    orbEl = document.createElement('div');
    orbEl.className = 'clara-orb'; orbEl.id = 'claraOrb';
    orbEl.setAttribute('role', 'img'); orbEl.setAttribute('aria-label', 'CLARA, your AI coach');
    document.body.appendChild(orbEl);
    if (window.MobiusOrb) window.MobiusOrb.create(orbEl);
    // In floating mode the orb is the launcher — tap to tuck/expand.
    orbEl.addEventListener('click', function () {
      if (stage.dataset.mode !== 'floating' || busy) return;
      stage.dataset.float = (stage.dataset.float === 'closed') ? 'open' : 'closed';
    });
  }

  function cacheFrame() {
    frameLesson = document.querySelector('.vt-frame .vt-lesson');
    frameStep = document.querySelector('.vt-frame .vt-progress .vt-step');
    frameBar = document.querySelector('.vt-frame .vt-progress vaadin-progress-bar');

    // Review-only "Skip (demo)" in the frame's actions slot — lets a reviewer
    // move past a gated video without watching/answering. NOT product UI;
    // shown only on gated steps (see updateFooter). Matches the scenario page's
    // skip control (same frame.css .vt-actions styling).
    var actions = document.querySelector('.vt-frame .vt-actions');
    if (actions && !document.getElementById('llStepSkip')) {
      skipBtn = document.createElement('button');
      skipBtn.id = 'llStepSkip';
      skipBtn.type = 'button';
      skipBtn.title = 'Skip this learning object';
      skipBtn.innerHTML = '<i class="fa-solid fa-forward"></i> Skip this learning object';
      skipBtn.style.display = 'none';
      skipBtn.addEventListener('click', function () {
        if (busy) return;
        var step = STEPS[idx];
        // Skip the whole learning object → advance to the next step (mirrors the
        // Marshall scenario's skip). Record it so the results reflect the skip.
        if (step && step.id === 'video') saveResult('video1', { skipped: true });
        else if (step && step.id === 'check') saveResult('check', { skipped: true });
        else if (step && step.id === 'baseline') saveResult('baseline', { skipped: true });
        else if (step && step.id === 'practice') saveResult('practice', { skipped: true });
        else if (step && step.id === 'casevideo') saveResult('casevideo', { skipped: true });
        else if (step && step.id === 'compress') saveResult('entry', { strength: entryStrength(), up: testUp(), skipped: true });
        go(1);
      });
      actions.appendChild(skipBtn);
    }

    // Review-only "Demo: flip outcome" — the presenter override for the path
    // adjustment. Flips the recomposition branch (struggled ↔ excelled) and
    // replays the adjust step so a reviewer can see both recompositions without
    // replaying the scenario. Shown only on the adjust step (see updateFooter).
    if (actions && !document.getElementById('llBranchBtn')) {
      branchBtn = document.createElement('button');
      branchBtn.id = 'llBranchBtn';
      branchBtn.type = 'button';
      branchBtn.title = 'Demo: replay this compression with the opposite entry result (compressed ↔ full build)';
      branchBtn.innerHTML = '<i class="fa-solid fa-shuffle"></i> Demo: flip entry result';
      branchBtn.style.display = 'none';
      branchBtn.addEventListener('click', function () {
        if (busy) return;
        var next = entryStrength() === 'compressed' ? 'full' : 'compressed';
        try { sessionStorage.setItem('ll-entry', next); } catch (e) {}
        showStep(idx, 'fwd', false);              // replay the compression on the new entry result
      });
      actions.appendChild(branchBtn);
    }
  }

  function build() {
    stage = document.querySelector('.ll-stage');
    if (!stage) return;
    buildFooter();
    buildOrb();
    cacheFrame();

    // Open at ?step=<id> if present (e.g. returning from the scenario), else 0.
    var start = 0;
    try {
      var want = new URLSearchParams(location.search).get('step');
      // Old deep links keep working across the contract-order restructure.
      if (want === 'adjust') want = 'compress';
      if (want === 'closing') want = 'check';
      if (want) { var f = STEPS.findIndex(function (s) { return s.id === want; }); if (f > -1) start = f; }
    } catch (e) {}

    // Keep the orb glued to its slot as the viewport changes.
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { positionOrb(false); }, 80); });
    window.addEventListener('load', function () { setTimeout(function () { positionOrb(false); }, 60); });

    showStep(start, 'fwd', true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
