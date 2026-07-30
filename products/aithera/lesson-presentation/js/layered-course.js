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
   app of its own, so it stays its own page (layered-course-scenario.html); the
   crossing into and out of it is a cross-document View Transition (see the CSS
   in layered-course.html). The scenario hands back by navigating to
   ?step=closing with its score already in sessionStorage['ll-course'].

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
      '<p class="ll-eyebrow">Your results</p>' +
      '<h2 id="resHeadline">Here\'s how you did.</h2>' +
      '<p class="ll-sub" id="resSub">A quick summary across the whole lesson.</p>' +
      '<div class="res-wrap">' +
        '<div class="res-ring" aria-hidden="true">' +
          '<svg viewBox="0 0 180 180" role="img" aria-label="Overall score">' +
            '<defs><linearGradient id="resGrad" x1="0" y1="0" x2="1" y2="1">' +
              '<stop offset="0%" stop-color="#46f0dc"/><stop offset="55%" stop-color="#16b8a6"/><stop offset="100%" stop-color="#0c8f83"/>' +
            '</linearGradient></defs>' +
            '<circle class="track" cx="90" cy="90" r="76"></circle>' +
            '<circle class="val" cx="90" cy="90" r="76" id="resArc" stroke-dasharray="477.5" stroke-dashoffset="477.5"></circle>' +
          '</svg>' +
          '<div class="res-center"><div class="res-score"><span id="resScoreNum">0</span><small>/100</small></div>' +
          '<div class="res-score-label">Overall</div></div>' +
        '</div>' +
        '<ul class="res-breakdown" id="resBreakdown"></ul>' +
      '</div>' +
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

  // Step 6 — results: assemble the score from the cross-page record.
  function computeCourseScore(v, s) {
    var videoPts = v.answered ? 100 : 80;   // self-report: full credit for answering, else participation floor
    var scenPts = (typeof s.score === 'number') ? s.score
                  : (s.status === 'complete') ? 88 : (s.status === 'skipped') ? 80 : 82;
    return { overall: Math.round(videoPts * 0.3 + scenPts * 0.7), scenPts: scenPts };
  }
  function resultsInit(ctx) {
    var course = readCourse();
    var v = course.video1 || {}, s = course.scenario || {};
    var sc = computeCourseScore(v, s), overall = sc.overall;

    var C = 477.5;
    document.getElementById('resArc').style.strokeDashoffset = String(C * (1 - overall / 100));
    document.getElementById('resScoreNum').textContent = overall;

    var band = overall >= 90 ? 'Excellent work' : overall >= 75 ? 'Nicely done' : 'Good start';
    document.getElementById('resHeadline').textContent = band + ', Rob.';
    // CLARA's feedback TYPES IN as two bubbles (typing indicator → text) rather
    // than rendering statically on load — see typeFeedback().
    typeFeedback(ctx, [
      (overall >= 90)
        ? 'That was strong, Rob. Here’s how you did overall.'
        : 'Solid work, Rob. Here’s how you did overall.',
      'I’m here if you have any questions.'
    ]);

    var cards = [];
    cards.push(card('fa-gauge-high', 'Confidence check',
      v.answered ? 'You rated your starting confidence: “' + esc(v.choice) + '.”'
        : v.skipped ? 'Skipped (demo).' : 'Not recorded this run.',
      v.answered ? ['ok', 'Logged'] : v.skipped ? ['warn', 'Skipped'] : ['mut', '—']));

    var scenBody, scenPill;
    if (s.status === 'complete') { scenBody = 'You worked the full arc with CLARA and reached the debrief.'; scenPill = ['ok', 'Completed']; }
    else if (s.status === 'skipped') { scenBody = 'Advanced past the live scenario (demo skip).'; scenPill = ['warn', 'Skipped']; }
    else { scenBody = 'Not recorded this run.'; scenPill = ['mut', '—']; }
    var scenCard = card('fa-comments', 'The Marshall scenario', scenBody, scenPill);
    var rep = s.report || {}, tags = [];
    (rep.strengths || []).slice(0, 3).forEach(function (x) { tags.push('✓ ' + (x.title || x)); });
    (rep.growthAreas || []).slice(0, 2).forEach(function (x) { tags.push('→ ' + (x.title || x)); });
    if (tags.length) {
      var tagWrap = document.createElement('div'); tagWrap.className = 'res-tags';
      tagWrap.innerHTML = tags.map(function (t) { return '<span class="res-tag">' + esc(t) + '</span>'; }).join('');
      scenCard.querySelector('.res-card-main').appendChild(tagWrap);
    }
    cards.push(scenCard);

    var cl = course.closing || {};
    cards.push(card('fa-flag-checkered', 'Knowledge check',
      cl.correct === true ? 'You answered the closing true/false correctly on the first try.'
        : cl.attempted ? 'You landed the closing true/false after another look — that counts.'
        : cl.skipped ? 'Skipped (demo).' : 'Not recorded this run.',
      cl.correct === true ? ['ok', 'Passed'] : cl.attempted ? ['warn', 'Retried'] : cl.skipped ? ['warn', 'Skipped'] : ['mut', '—']));

    var list = document.getElementById('resBreakdown');
    cards.forEach(function (c) { list.appendChild(c); });
    document.getElementById('resBasis').innerHTML =
      '<i class="fa-solid fa-circle-info"></i> Prototype scoring: the scenario portion is a <strong>representative</strong> value (' +
      sc.scenPts + '/100) blended with the comprehension check — the real per-phase rubric slots in at <code>computeCourseScore()</code>.';
    ctx.positionOrb(false);
    wireSidebarChat(ctx);

    function card(icon, title, body, pill) {
      var li = document.createElement('li'); li.className = 'res-card';
      li.innerHTML =
        '<span class="res-ico"><i class="fa-solid ' + icon + '"></i></span>' +
        '<div class="res-card-main"><h3>' + esc(title) + '</h3><p>' + esc(body) + '</p></div>' +
        '<span class="res-pill ' + pill[0] + '">' + esc(pill[1]) + '</span>';
      return li;
    }
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
  function wireSidebarChat(ctx) {
    var input = ctx.chrome.querySelector('#claraAsk');
    var send  = ctx.chrome.querySelector('#claraAskSend');
    var echo  = ctx.chrome.querySelector('#claraEcho');
    if (!input || !send || !echo) return;
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
      setTimeout(function () { addRow('clara', CLARA_REPLIES[ri % CLARA_REPLIES.length]); ri++; }, T(450));
    }
    send.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  }

  // ==========================================================================
  //  The step manifest — six steps; the scenario is external (its own page).
  // ==========================================================================
  var COURSE = 'Bystander Intervention';
  var STEPS = [
    { id: 'intro', n: 1, mode: 'ambient', lesson: 'Welcome',
      caption: { title: 'Course intro · Ambient presence', note: 'CLARA fills the space to open the lesson.' },
      coach: { eyebrow: 'Duration ≅ 10 minutes', headline: "Hi, Rob. Ready to begin?",
        lede: "We'll be working through some sensitive scenarios today, related to sexual harassment in the workplace. " +
              "I'll guide you through each section and may ask a few questions as you progress through each." } },

    { id: 'video', n: 2, mode: 'floating', lesson: 'See It Happen', gate: true,
      caption: { title: 'Gated video · Floating companion', note: 'The clip must play and the learner must answer CLARA’s check before Continue unlocks.' },
      coach: { say: 'Press play when you’re ready — I’ll have one quick question for you once it wraps.' },
      content: videoContent({ eyebrow: 'Watch', heading: 'Introduction',
        sub: 'First, let’s introduce you to the basics of sexual harassment, how to respond, and why this lesson matters.',
        src: '../assets/videos/marshall-preroll.mp4' }),
      init: videoInit },

    { id: 'scene', n: 3, mode: 'ambient', lesson: 'Setting the Scene', nextLabel: 'Enter scenario',
      caption: { title: 'Scene-setting · Ambient presence', note: 'CLARA hands off into the practice — establishing who/where/what. This is now the ONLY scene-setter; the scenario page skips its own establishing card and drops straight into the cold-open.' },
      coach: { eyebrow: 'Before you step in', headline: "Here's the moment you're walking into.",
        lede: "In a second you'll be in a real break-room exchange. Take in who's here and what's going on — " +
              "then it's your call how to respond. There's no perfect script; I'll be right here as you work through it." },
      init: sceneInit },

    { id: 'scenario', n: 4, external: 'layered-course-scenario.html', lesson: 'The Marshall Scenario' },

    { id: 'closing', n: 5, mode: 'floating', lesson: 'Wrapping Up', gate: true,
      caption: { title: 'Closing video · Floating companion', note: 'Watch the clip, then answer CLARA’s true/false knowledge check to unlock Continue.' },
      coach: { say: 'Press play for the last clip — I’ve got one quick true-or-false question for you when it wraps.' },
      content: videoContent({ eyebrow: 'Watch', heading: 'Wrapping up',
        sub: 'Let’s close the loop and look at a real case example.',
        src: '../assets/videos/marshall-postscenario.mp4' }),
      init: closingInit },

    { id: 'results', n: 6, mode: 'sidebar', lesson: 'Your Results',
      caption: { title: 'Course results · Docked guide', note: 'An overall score ring plus a per-section breakdown from the record each step wrote.' },
      coach: { say: '', ask: 'Ask CLARA about your results…' },   // greeting is TYPED IN by resultsInit (typing bubble → text)
      content: RESULTS_CONTENT, init: resultsInit }
  ];
  var TOTAL = STEPS.length;

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
  var stage, orbEl, chrome, object, footer, nextBtn, backBtn, footStep, pop, infoBtn, skipBtn;
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
    if (frameLesson) frameLesson.textContent = step.lesson;
    if (frameStep) frameStep.textContent = 'Step ' + step.n + ' of ' + TOTAL;
    if (frameBar) frameBar.setAttribute('value', String(step.n / TOTAL));
  }

  function updateFooter(step) {
    footer.querySelector('.ll-foot-course').textContent = COURSE;
    var lessonSpan = footer.querySelector('.ll-foot-lesson');
    lessonSpan.textContent = step.lesson + ' · Step ' + step.n + ' of ' + TOTAL + ' ';
    if (skipBtn) skipBtn.style.display = step.gate ? 'inline-flex' : 'none';   // review-only, gated steps only
    backBtn.disabled = (step.n <= 1);
    var isLast = (step.n >= TOTAL);
    nextBtn.innerHTML = (step.nextLabel || (isLast ? 'Finish' : 'Continue')) + ' <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.disabled = !!step.gate;                 // gated steps re-enable via ctx.enableNext()
    // Popover caption
    if (step.caption) {
      pop.querySelector('.ll-pop-eyebrow').innerHTML =
        '<i class="fa-solid fa-layer-group"></i> Coach presentation · ' + step.n + ' / ' + TOTAL;
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
    if (target < 0 || target >= TOTAL) {
      if (target >= TOTAL) window.location.href = 'index.html';   // Finish → back to the lesson index
      return;
    }
    showStep(target, delta < 0 ? 'back' : 'fwd', false);
  }

  function buildFooter() {
    footer = document.createElement('footer');
    footer.className = 'll-footer';
    footer.innerHTML =
      '<div class="ll-footer-meta">' +
        '<span class="ll-foot-course"></span>' +
        '<span class="ll-foot-step"><span class="ll-foot-lesson"></span>' +
          '<button class="ll-info" id="llInfo" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="About this presentation">?</button>' +
        '</span>' +
      '</div>' +
      '<div class="ll-nav">' +
        '<button class="ll-btn ll-btn--ghost" id="llBack"><i class="fa-solid fa-arrow-left"></i> Back</button>' +
        '<button class="ll-btn ll-btn--primary" id="llNext">Continue <i class="fa-solid fa-arrow-right"></i></button>' +
      '</div>';
    document.body.appendChild(footer);
    backBtn = footer.querySelector('#llBack');
    nextBtn = footer.querySelector('#llNext');
    infoBtn = footer.querySelector('#llInfo');
    backBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });

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
    document.addEventListener('click', function (e) { if (pop.classList.contains('open') && !pop.contains(e.target) && e.target !== infoBtn) closePop(); });
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
        go(1);
      });
      actions.appendChild(skipBtn);
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
