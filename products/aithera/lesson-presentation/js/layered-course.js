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

  // Which way the Learning Layer recomposes the path after the scenario.
  // Performance-driven (the scenario's score decides), with a presenter
  // override — the "Demo: flip outcome" control on the adjust step — stored
  // alongside the course record so it survives the scenario round-trip.
  function decideBranch() {
    try { var o = sessionStorage.getItem('ll-branch'); if (o === 'support' || o === 'accelerate') return o; } catch (e) {}
    var s = readCourse().scenario || {};
    var score = (typeof s.score === 'number') ? s.score : 82;
    return score >= 88 ? 'accelerate' : 'support';
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

  // Step 1 — the welcome "cover." Re-adds the run-time estimate as a single
  // detail pill, reusing the Marshall scene-setter's chip treatment
  // (.ll-scene-fact) so the two title slides read as one family.
  function introInit(ctx) {
    var wrap = document.createElement('div');
    wrap.className = 'll-scene-facts';
    wrap.innerHTML =
      '<span class="ll-scene-fact"><i class="fa-solid fa-clock"></i>' +
        '<span><b>Duration:</b> ≈ 10 minutes</span></span>';
    if (ctx.chrome) ctx.chrome.appendChild(wrap);
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
      '<p class="ll-eyebrow">Before we begin</p>' +
      '<h2>A quick baseline.</h2>' +
      '<p class="ll-sub">Two short questions — no grade, no trick. They give CLARA a starting picture, ' +
        'so at the end you can see how far you’ve come, not just where you landed.</p>' +
      '<ul class="bl-constructs" aria-label="What CLARA listens for">' +
        CONSTRUCTS.map(function (c) {
          return '<li class="bl-construct"><i class="fa-solid ' + c.icon + '" aria-hidden="true"></i>' +
                 '<span><b>' + esc(c.name) + '</b> ' + esc(c.listens) + '</span></li>';
        }).join('') +
      '</ul>' +
      '<p class="bl-note"><i class="fa-solid fa-circle-info"></i> These are the behavioral constructs this course was ' +
        'built to develop — from the Individual Determinants of Behavior framework. Every signal CLARA logs maps to one of them.</p>' +
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
      notice('Baseline profile captured — <b>5 constructs</b>');
      ctx.enableNext();
    }
  }

  // Step 5 — closing video, gated by a true/false knowledge check on the clip.
  // Same binary right/wrong mechanics as the (former) step-2 comprehension check:
  // a wrong pick is disabled with a nudge; the correct pick unlocks Continue.
  var CLOSING_QUESTION = {
    stem: 'True or false — <strong>Harassing or firing an employee because of their sexual orientation, ' +
          'gender identity, or departure from gender stereotypes violates federal law.</strong>',
    options: [
      { t: 'True', correct: true },
      { t: 'False', correct: false }
    ],
    correctReply: 'Correct — it’s true. Federal law protects employees from harassment or firing based on ' +
                  'sexual orientation, gender identity, or not conforming to gender stereotypes. Let’s see how you did.',
    wrongReply: 'Not quite — it’s actually true. All three are protected under federal law, so give it another look.'
  };
  function closingInit(ctx) {
    var video = document.getElementById('courseVideo');
    var asked = false, answered = false;
    preloadVideoFully(video);
    wireVideoSkip(video);
    video.addEventListener('play', function () { ctx.floatClose(); });
    video.addEventListener('ended', revealQuestion);

    function revealQuestion() {
      if (asked) return; asked = true;
      ctx.floatOpen();
      ctx.setCoachSay(CLOSING_QUESTION.stem);
      var bubble = ctx.els.bubble;
      var chips = document.createElement('div');
      chips.className = 'clara-chips vq-chips';
      CLOSING_QUESTION.options.forEach(function (opt) {
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
      var fb = ctx.els.bubble.querySelector('.vq-feedback');
      if (opt.correct) {
        answered = true;
        chips.querySelectorAll('.clara-chip').forEach(function (c) { c.disabled = true; });
        btn.classList.add('is-correct');
        fb.className = 'vq-feedback ok'; fb.textContent = CLOSING_QUESTION.correctReply;
        ctx.enableNext();
        saveResult('closing', { correct: true });
      } else {
        btn.classList.add('is-wrong'); btn.disabled = true;
        fb.className = 'vq-feedback bad'; fb.textContent = CLOSING_QUESTION.wrongReply;
        saveResult('closing', { correct: false, attempted: true });
      }
      ctx.positionOrb(true);
    }
  }

  // ==========================================================================
  //  Path adjustment — the Knowledge Layer moment. After the scenario, CLARA
  //  shows the course as a map of learning objects and the Learning Layer
  //  visibly recomposes it: mastery-based sequencing acting on SME-signed
  //  Know·Feel·Do objectives. Performance-driven (the scenario record decides),
  //  with a presenter override in the frame's ⋯ actions ("Demo: flip outcome").
  // ==========================================================================
  var ADJUST_CONTENT =
    '<main class="ll-object" id="adjustObject">' +
      '<p class="ll-eyebrow">The Knowledge Layer</p>' +
      '<h2 id="adjHeadline">Recomposing your path…</h2>' +
      '<p class="ll-sub" id="adjSub">Everything you’ve done so far has been scored against the course’s signed ' +
        'objectives — CLARA is deciding what you actually need next.</p>' +
      '<ol class="path-rail" id="pathRail" aria-label="Your learning path"></ol>' +
      '<div class="prov-card" id="provCard" hidden>' +
        '<div class="prov-head"><i class="fa-solid fa-diagram-project" aria-hidden="true"></i> Why this changed</div>' +
        '<ol class="prov-chain" id="provChain"></ol>' +
      '</div>' +
    '</main>';

  // The path map: the course's own learning objects, with the slot AFTER the
  // scenario as the recomposition target. `planned` is what the linear course
  // would have served; each branch swaps or removes it.
  var PATH_NODES = [
    { icon: 'fa-hand-sparkles', label: 'Welcome',            state: 'done' },
    { icon: 'fa-wave-square',   label: 'Baseline check',     state: 'done' },
    { icon: 'fa-circle-play',   label: 'Intro video',        state: 'done' },
    { icon: 'fa-comments',      label: 'The Marshall scenario', state: 'done', sub: 'construct-mapped' },
    { icon: 'fa-list-check',    label: 'Review: The Five Ds', state: 'planned', slot: true },
    { icon: 'fa-flag-checkered', label: 'Wrap-up video',      state: 'next' },
    { icon: 'fa-chart-simple',  label: 'Aptitude profile',   state: 'next' }
  ];
  var ADJUST_BRANCHES = {
    support: {
      headline: 'One change, made for you.',
      sub: 'The scenario showed exactly one construct that needs work — so the generic review is out, ' +
           'and two minutes of targeted practice are in. Same seat time, better spent.',
      swap: { icon: 'fa-comment-dots', label: 'Micro-practice: Say it out loud', tag: 'Added · 2 min', cls: 'is-added' },
      narration: [
        'Okay, Rob — I pulled three signals out of the Marshall scenario and mapped them to the course’s objectives.',
        'You read the situation well and you clearly believe stepping in matters. The one construct that came back “Practice Needed” was <b>behavioral skills</b> — the actual words, in the moment.',
        'So I’m swapping the generic review for a two-minute practice on exactly that. Here’s the change — and the paper trail behind it.'
      ],
      chain: [
        '<b>The signed objective.</b> “Name the behavior and check in with the target” — a <em>Do</em>-level objective in this course’s Know·Feel·Do mapping, SME-signed. <i class="fa-solid fa-circle-check prov-ok" aria-hidden="true"></i>',
        '<b>The evidence.</b> Marshall scenario, construct-mapped: <em>Behavioral skills — Practice Needed</em>. You named the problem to Jake, but the direct words and the follow-up check-in never landed.',
        '<b>The recomposition.</b> Mastery-based sequencing replaced the one-size review with a targeted practice on that objective. No new content was authored — every beat derives from the signed substrate.'
      ]
    },
    accelerate: {
      headline: 'You’ve earned a shorter path.',
      sub: 'You already demonstrated the review’s objectives inside the scenario — so it’s gone, ' +
           'and the wrap-up tightens to what you haven’t shown yet.',
      swap: null,   // the planned node is removed, not replaced
      narration: [
        'Okay, Rob — I pulled the signals out of the Marshall scenario and mapped them to the course’s objectives.',
        'You didn’t just pick right answers in there — you named the behavior, held your ground, and checked in afterward. That <em>is</em> the review, demonstrated.',
        'So the review is off your path, and the wrap-up tightens to the one objective you haven’t evidenced yet. Here’s the change — and the paper trail behind it.'
      ],
      chain: [
        '<b>The signed objectives.</b> The review covers three <em>Do</em>-level objectives from this course’s Know·Feel·Do mapping — all SME-signed. <i class="fa-solid fa-circle-check prov-ok" aria-hidden="true"></i>',
        '<b>The evidence.</b> Marshall scenario, construct-mapped: all three objectives scored <em>Good or above</em> — demonstrated in performance, not recall.',
        '<b>The recomposition.</b> Mastery-based sequencing tested you out of the review and kept your seat time for the objective still unevidenced. Nothing was waived — it was demonstrated.'
      ]
    }
  };

  function pathNodeHTML(n) {
    var state = n.state;
    var chip = state === 'done' ? '<span class="pn-chip pn-done"><i class="fa-solid fa-check"></i> Done</span>'
             : state === 'planned' ? '<span class="pn-chip pn-planned">Planned</span>'
             : state === 'added' ? '<span class="pn-chip pn-added"><i class="fa-solid fa-wand-magic-sparkles"></i> ' + esc(n.tag || 'Added') + '</span>'
             : '<span class="pn-chip pn-next">Up next</span>';
    return '<li class="path-node ' + (n.cls || '') + '" data-state="' + state + '">' +
             '<span class="pn-ico"><i class="fa-solid ' + n.icon + '" aria-hidden="true"></i></span>' +
             '<span class="pn-main"><span class="pn-label">' + esc(n.label) + '</span>' +
             (n.sub ? '<span class="pn-sub">' + esc(n.sub) + '</span>' : '') + '</span>' +
             chip +
           '</li>';
  }

  function adjustInit(ctx) {
    var branch = decideBranch();
    var B = ADJUST_BRANCHES[branch];
    var rail = document.getElementById('pathRail');
    rail.innerHTML = PATH_NODES.map(pathNodeHTML).join('');
    notice('Imported: <b>3 signals</b> from the Marshall scenario');

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
        if (i === lines.length - 1) { setTimeout(applySwap, T(700)); return; }
        var next = document.createElement('div');
        echo.appendChild(next);
        setTimeout(function () { bubble(i + 1, next); }, T(900));
      }, T(i === 0 ? 900 : 1300));
    }
    bubble(0, echo.querySelector('.clara-say') || echo.appendChild(document.createElement('div')));

    function applySwap() {
      var planned = rail.querySelector('.path-node[data-state="planned"]');
      document.getElementById('adjHeadline').textContent = B.headline;
      document.getElementById('adjSub').textContent = B.sub;
      if (planned) {
        planned.classList.add('is-leaving');
        setTimeout(function () {
          if (B.swap) {
            var holder = document.createElement('div');
            holder.innerHTML = pathNodeHTML({ icon: B.swap.icon, label: B.swap.label, state: 'added', tag: B.swap.tag });
            var added = holder.firstElementChild;
            added.classList.add('is-entering', B.swap.cls || '');
            planned.replaceWith(added);
            requestAnimationFrame(function () { requestAnimationFrame(function () { added.classList.remove('is-entering'); }); });
            notice('Path recomposed: <b>1 object swapped</b> — Behavioral skills');
          } else {
            planned.classList.add('is-skipped');
            planned.classList.remove('is-leaving');
            planned.querySelector('.pn-chip').outerHTML = '<span class="pn-chip pn-skipped"><i class="fa-solid fa-forward"></i> Skipped — already demonstrated</span>';
            var wrap = rail.children[5];
            if (wrap) {
              var c = wrap.querySelector('.pn-chip');
              if (c) c.outerHTML = '<span class="pn-chip pn-added"><i class="fa-solid fa-wand-magic-sparkles"></i> Tightened</span>';
            }
            notice('Path recomposed: <b>1 object skipped</b>, wrap-up tightened');
          }
          revealProvenance();
        }, T(650));
      } else { revealProvenance(); }
    }
    function revealProvenance() {
      var card = document.getElementById('provCard');
      document.getElementById('provChain').innerHTML =
        B.chain.map(function (li) { return '<li>' + li + '</li>'; }).join('');
      card.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.add('in'); }); });
      saveResult('adjust', { branch: branch });
      // Refresh the counters FIRST (the visible total may have changed —
      // accelerate removes a step), then unlock Continue: updateFooter re-arms
      // the gate, so enableNext must come after it.
      updateFooter(STEPS[idx]);
      updateFrame(STEPS[idx]);
      ctx.enableNext();
    }
    wireSidebarChat(ctx, [
      'Fair question. Nothing here was improvised — the swap picks from module structures the Learning Layer derived from this course’s SME-signed objectives.',
      branch === 'support'
        ? 'Because “knowing what to say” was the one construct the scenario scored Practice Needed — the other four came back Good or better.'
        : 'Because you evidenced the review’s objectives in performance. Skipping content you’ve demonstrated is the whole point of mastery-based sequencing.',
      'Your administrator sees the same chain you do: the objective, the evidence, and the change — nothing is silent.',
      'If you’d rather take the full path anyway, your organization can turn recomposition off per course — it’s a setting, not a mandate.'
    ]);
  }

  // ==========================================================================
  //  Micro-practice — the object the Learning Layer inserted (support branch).
  //  Two rehearsal beats on the weak construct: the words in the room, then
  //  the check-in afterward.
  // ==========================================================================
  var PRACTICE_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow"><i class="fa-solid fa-wand-magic-sparkles"></i> Added for you · 2 minutes</p>' +
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
    var branch = (course.adjust && course.adjust.branch) || decideBranch();
    var cl = course.closing || {}, v = course.video1 || {};
    var strong = score >= 88;
    var after = {
      knowledge: cl.correct === true ? 3 : cl.attempted ? 2 : Math.max(base.knowledge, 2),
      beliefs:   strong ? 3 : Math.max(base.beliefs, 2),
      norms:     strong ? 3 : 2,
      skills:    branch === 'support' ? ((course.practice && course.practice.done) ? 2 : base.skills) : 3,
      control:   strong ? 3 : Math.max(base.control, 2)
    };
    var evidence = {
      knowledge: cl.correct === true
        ? 'Closing check — protections for sexual orientation and gender identity, first try.'
        : cl.attempted ? 'Closing check — landed it on a second look.'
        : 'Recognized the “joking” pattern as harassment in the baseline check.',
      beliefs: '“Someone had to say it — better me than nobody.” — the Marshall scenario',
      norms: 'Read the break room’s silence as pressure — and acted anyway. — the Marshall scenario',
      skills: branch === 'support'
        ? ((course.practice && course.practice.done)
            ? '“That’s not okay, Jake. Drop it.” — micro-practice, first rep'
            : 'Named the problem, but the direct words never landed. — the Marshall scenario')
        : 'Named the behavior in the moment and checked in afterward. — the Marshall scenario',
      control: v.answered
        ? 'Self-rated “' + (v.choice || '') + '” at the start — then held up under real pushback.'
        : 'Held steady under Jake’s pushback in the scenario.'
    };
    var atGood = CONSTRUCTS.filter(function (c) { return after[c.key] >= 2; }).length;
    return { base: base, after: after, evidence: evidence, atGood: atGood,
             pass: atGood >= Math.ceil(CONSTRUCTS.length * 0.8), branch: branch };
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
    document.getElementById('aptPath').innerHTML = P.branch === 'support'
      ? '<i class="fa-solid fa-wand-magic-sparkles"></i> Your path was recomposed mid-course: one targeted practice added for <b>behavioral skills</b>.'
      : '<i class="fa-solid fa-wand-magic-sparkles"></i> Your path was recomposed mid-course: the review was skipped — you’d already demonstrated its objectives.';

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
      'Every band traces to something you actually said or did — ask me about any of them.'
    ]);
    document.getElementById('resBasis').innerHTML =
      '<i class="fa-solid fa-circle-info"></i> Scoring follows the AI Aptitude Assessment model: each construct is scored ' +
      'qualitatively (<strong>Practice Needed / Good / Excellent</strong>) and passing means at least Good on 80% of objectives. ' +
      'Scenario-derived bands here are <strong>representative</strong> — the live construct rubric slots in at <code>computeProfile()</code>.';
    ctx.positionOrb(false);
    wireSidebarChat(ctx, [
      'Your strongest signal was reading the room — you treated the others’ silence as pressure to resist, not permission to stay quiet.',
      'Behavioral skills started as your gap, and the two practice reps are what moved it — the words came out shorter and more direct each time.',
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
      b.textContent = text;
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
  //  The step manifest — nine steps; the scenario is external (its own page).
  //  Numbering is DYNAMIC: a step may carry when() and drop out of the path
  //  (the accelerate branch removes the micro-practice), so "Section n of N"
  //  is computed from the currently-visible list — the counter itself is part
  //  of the recomposition demo.
  // ==========================================================================
  var COURSE = 'Bystander Intervention';
  var STEPS = [
    { id: 'intro', mode: 'ambient', lesson: 'Welcome',
      caption: { title: 'Course intro · Ambient presence', note: 'CLARA fills the space to open the lesson.' },
      // Welcome screen reads as the "cover": the greeting is the warm eyebrow,
      // the course title is the hero. (The top band still carries course/lesson
      // for wayfinding — the big title here is deliberate cover emphasis.)
      coach: { eyebrow: "Hi, Rob. Ready to begin?", headline: COURSE,
        lede: "We'll be working through some sensitive scenarios today, related to sexual harassment in the workplace. " +
              "I'll guide you through each section and may ask a few questions as you progress through each." },
      init: introInit },

    { id: 'baseline', mode: 'floating', lesson: 'Baseline Check', gate: true,
      caption: { title: 'Adaptive pre-assessment · Floating companion', note: 'Two conversational probes before any content — the aptitude thread’s starting picture, so the closing profile can show growth.' },
      coach: { say: 'Loading…' },   // baselineInit swaps in Q1 immediately
      content: BASELINE_CONTENT, init: baselineInit },

    { id: 'video', mode: 'floating', lesson: 'See It Happen', gate: true,
      caption: { title: 'Gated video · Floating companion', note: 'The clip must play and the learner must answer CLARA’s check before Continue unlocks.' },
      coach: { say: 'Press play when you’re ready — I’ll have one quick question for you once it wraps.' },
      content: videoContent({ eyebrow: 'Watch', heading: 'Introduction',
        sub: 'First, let’s introduce you to the basics of sexual harassment, how to respond, and why this lesson matters.',
        src: '../../assets/videos/marshall-preroll.mp4' }),
      init: videoInit },

    { id: 'scene', mode: 'ambient', lesson: 'Setting the Scene', nextLabel: 'Enter scenario',
      caption: { title: 'Scene-setting · Ambient presence', note: 'CLARA hands off into the practice — establishing who/where/what. This is now the ONLY scene-setter; the scenario page skips its own establishing card and drops straight into the cold-open.' },
      coach: { eyebrow: "Let's practice", headline: '“The Marshall Scenario”',
        lede: "In a second you'll be in a real break-room exchange. Take in who's here and what's going on, " +
              "then it's your call how to respond. There's no perfect script here you need to follow." },
      init: sceneInit },

    { id: 'scenario', external: 'scenario.html', lesson: 'The Marshall Scenario' },

    { id: 'adjust', mode: 'sidebar', lesson: 'Your Path, Adjusted', gate: true,
      caption: { title: 'Knowledge Layer · Docked guide', note: 'The Learning Layer recomposes the path from the scenario’s construct-mapped evidence — mastery-based sequencing over SME-signed objectives, with the provenance chain on screen.' },
      coach: { say: '', ask: 'Ask CLARA about this change…' },   // narration is TYPED IN by adjustInit
      content: ADJUST_CONTENT, init: adjustInit },

    { id: 'practice', mode: 'floating', lesson: 'Quick Practice', gate: true,
      when: function () { return decideBranch() === 'support'; },
      caption: { title: 'Inserted micro-practice · Floating companion', note: 'The learning object the Learning Layer added — two rehearsal reps on the construct the scenario scored Practice Needed.' },
      coach: { say: 'Loading…' },   // practiceInit swaps in the first rep immediately
      content: PRACTICE_CONTENT, init: practiceInit },

    { id: 'closing', mode: 'floating', lesson: 'Wrapping Up', gate: true,
      caption: { title: 'Closing video · Floating companion', note: 'Watch the clip, then answer CLARA’s true/false knowledge check to unlock Continue.' },
      coach: { say: 'Press play for the last clip — I’ve got one quick true-or-false question for you when it wraps.' },
      content: videoContent({ eyebrow: 'Watch', heading: 'Wrapping up',
        sub: 'Let’s close the loop and look at a real case example.',
        src: '../../assets/videos/marshall-postscenario.mp4' }),
      init: closingInit },

    { id: 'results', mode: 'sidebar', lesson: 'Your Aptitude Profile',
      caption: { title: 'Aptitude profile · Docked guide', note: 'Construct-by-construct bands from baseline to now, with the evidence each one traces to — pass = at least Good on 80% of objectives.' },
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
    if (footCount) footCount.textContent = 'Section ' + pos.n + ' of ' + pos.total;
    if (footBar) footBar.setAttribute('value', String(pos.n / pos.total));
    if (skipBtn) skipBtn.style.display = step.gate ? 'inline-flex' : 'none';   // review-only, gated steps only
    if (branchBtn) branchBtn.style.display = (step.id === 'adjust') ? 'inline-flex' : 'none';
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
        else if (step && step.id === 'closing') saveResult('closing', { skipped: true });
        else if (step && step.id === 'baseline') saveResult('baseline', { skipped: true });
        else if (step && step.id === 'practice') saveResult('practice', { skipped: true });
        else if (step && step.id === 'adjust') saveResult('adjust', { branch: decideBranch(), skipped: true });
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
      branchBtn.title = 'Demo: replay this adjustment with the opposite scenario outcome';
      branchBtn.innerHTML = '<i class="fa-solid fa-shuffle"></i> Demo: flip outcome';
      branchBtn.style.display = 'none';
      branchBtn.addEventListener('click', function () {
        if (busy) return;
        var next = decideBranch() === 'support' ? 'accelerate' : 'support';
        try { sessionStorage.setItem('ll-branch', next); } catch (e) {}
        showStep(idx, 'fwd', false);              // replay the adjust step on the new branch
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
