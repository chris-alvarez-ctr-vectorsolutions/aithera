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
  // The two frameworks aren't rivals — one is a FIELD of the other. Know·Feel·Do
  // with its sub-level is the classification the SME signs (and the thing the
  // Knowledge Layer stores as a first-class object); the theoretical construct
  // is the semantic anchor hung on it, which is where the Individual
  // Determinants of Behavior names live. So every row here carries both: the
  // learner reads the plain name, and the record carries the classification
  // the objective was signed under.
  var CONSTRUCTS = [
    { key: 'knowledge', name: 'Knowing what to do',      icon: 'fa-book-open',
      domain: 'Know', sub: 'Remember & Evaluate', theory: 'Response Knowledge' },
    { key: 'norms',     name: 'Reading the room',        icon: 'fa-users',
      domain: 'Feel', sub: 'Perceive',            theory: 'Social Norm Perception' },
    { key: 'beliefs',   name: 'Believing it matters',    icon: 'fa-scale-balanced',
      domain: 'Feel', sub: 'Value',               theory: 'Outcome Expectancy' },
    { key: 'control',   name: 'Believing you can',       icon: 'fa-gauge-high',
      domain: 'Feel', sub: 'Can',                 theory: 'Self-Efficacy (Bandura)' },
    { key: 'activate',  name: 'Moving while it’s open',  icon: 'fa-bolt',
      domain: 'Do',   sub: 'Activate',            theory: 'Behavioral Cueing' },
    { key: 'skills',    name: 'Having the words',        icon: 'fa-comment-dots',
      domain: 'Do',   sub: 'Apply',               theory: 'Behavioral Capability (Bandura)' }
  ];
  var DOMAIN_CLS = { Know: 'dom-know', Feel: 'dom-feel', Do: 'dom-do' };
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

  // ==========================================================================
  //  CONTEXT LENSES — capability 2 of the four the module has to survive.
  //
  //  The same module, the same objectives, the same beats, applied to a
  //  different working environment. NOTHING here is a second course: every
  //  lensed string is derived from the objective's context-sensitivity
  //  metadata, which is why the tactic examples and the drill situations move
  //  while the tactics, the ordering and the assessment do not.
  //
  //  Two lenses rather than three, deliberately. A lens is only worth having
  //  if its scene, its tactics and its evidence all genuinely differ — a
  //  find-and-replace on the room name is the thing this capability is
  //  supposed to disprove. Adding a third is data entry once these two hold.
  //  Presenter control: "Demo: context lens".
  // ==========================================================================
  var LENSES = {
    plant: {
      label: 'Plant floor',
      role: 'Shift lead',
      where: 'The tool crib, shift change',
      when: 'Monday, start of shift',
      org: 'Acme Plant Operations',
      // The scene the Perform stage opens on.
      lede: 'In a second you’ll be at the tool crib as the shift changes over. Take in who’s here ' +
            'and what’s going on, then it’s your call how to respond. There’s no perfect script to follow.',
      // The five tactics, shown in this environment's terms.
      ds: {
        Direct:   '“That’s not okay — drop it.” Said to Jake, in front of the crew.',
        Distract: '“Jake — the forklift guy’s looking for you.” The joke dies on its own.',
        Delegate: 'Loop in the shift lead Jake actually listens to.',
        Delay:    '“I saw that. You good?” — catching them at the clock-out beats never.',
        Document: 'Date, shift, exact words. Specifics move investigations.'
      },
      drill: [
        'Jake’s mid-“joke”, the crew’s laughing, and you’re two feet away at the crib window.',
        'You froze. The shift changed over and everyone’s already on the floor.',
        'The one doing it is your supervisor’s friend, and he runs the line you work.',
        'Third shift running. Same target, same “joke”, same handover.'
      ],
      // The remediation scene, when a check miss inserts it.
      remediationWhen: 'Friday, shift meeting',
      remediationText: 'Jake tries the same “joke” again — this time about Priya, in front of the whole shift. ' +
                       'The room goes quiet and waits to see what you do.'
    },
    office: {
      label: 'Office',
      role: 'Team lead',
      where: 'The Monday stand-up',
      when: 'Monday, 9am',
      org: 'Acme Corporate Services',
      lede: 'In a second you’ll be in a Monday stand-up that goes sideways. Take in who’s here ' +
            'and what’s going on, then it’s your call how to respond. There’s no perfect script to follow.',
      ds: {
        Direct:   '“That’s not okay — drop it.” Said to Jake, with the room listening.',
        Distract: '“Jake — can you pull up the numbers?” The joke dies on its own.',
        Delegate: 'Take it to the manager Jake actually listens to.',
        Delay:    '“I saw that. You good?” — catching them after the call beats never.',
        Document: 'Date, meeting, exact words. Specifics move investigations.'
      },
      drill: [
        'Jake’s mid-“joke”, half the table is laughing, and you’re sitting right next to him.',
        'You froze. The stand-up moved on and everyone’s back at their desks.',
        'The one doing it is your supervisor’s friend, and he assigns your work.',
        'Third stand-up in a row. Same target, same “joke”, same table.'
      ],
      remediationWhen: 'Friday, team meeting',
      remediationText: 'Jake tries the same “joke” again — this time about Priya, in front of the whole team. ' +
                       'The room goes quiet and waits to see what you do.'
    }
  };
  var LENS_ORDER = ['plant', 'office'];
  // The steps whose content genuinely moves with the lens. Everywhere else the
  // control is hidden rather than shown doing nothing.
  var LENSED_STEPS = { terms: 1, drill: 1, norms: 1, practice: 1, scene: 1 };
  function lensId() {
    try { var o = sessionStorage.getItem('ll-lens'); if (LENSES[o]) return o; } catch (e) {}
    return 'plant';
  }
  function lens() { return LENSES[lensId()]; }

  // --- Single-select option group (keyboard) --------------------------------
  // Arrow/Home/End move FOCUS only; Enter or Space commits, the way any button
  // does. A strict radiogroup selects on arrow, which here would lock in an
  // answer the learner was only scrolling past — these picks are one-way.
  function pickGroup(group) {
    if (!group) return;
    group.addEventListener('keydown', function (e) {
      var list = Array.prototype.filter.call(
        group.querySelectorAll('[role="radio"]'), function (r) { return !r.disabled; });
      var i = list.indexOf(document.activeElement);
      if (i === -1) return;
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = list[(i + 1) % list.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = list[(i - 1 + list.length) % list.length];
      else if (e.key === 'Home') next = list[0];
      else if (e.key === 'End') next = list[list.length - 1];
      if (!next) return;
      e.preventDefault();
      next.focus();
    });
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
      '<h2 id="resHeadline">Here\'s what you can do now.</h2>' +
      '<p class="ll-sub" id="resSub">Not a quiz score — a picture of what you actually showed, ' +
        'from your first answer to your last.</p>' +
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
      // She leads here: nothing on the page explains why this build is shorter.
      ctx.setCoachSay('This is the short cut — the lessons you already showed me are gone. Press play; one quick question at the end.');
      ctx.floatOpen();
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
  function sceneFacts() {
    var L = lens();
    return [
      { icon: 'fa-id-badge', label: 'Your role', value: L.role },
      { icon: 'fa-location-dot', label: 'Where', value: L.where },
      { icon: 'fa-users', label: 'Who’s here', value: 'Marshall & Jake' },
      { icon: 'fa-clock', label: 'When', value: L.when }
    ];
  }
  function sceneInit(ctx) {
    var wrap = document.createElement('div');
    wrap.className = 'll-scene-facts';
    wrap.innerHTML = sceneFacts().map(function (f) {
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
      '<div class="cp-page">' +
        // Full-width hero band: title block left, course art right (a still
        // from the course's own break-room footage), fading into the stage.
        '<header class="cp-hero-band">' +
          '<div class="cp-hero">' +
            '<p class="ll-eyebrow">Workplace Conduct &amp; Harassment</p>' +
            '<h1>Bystander Intervention</h1>' +
            '<p class="cp-desc">Learn to read the moment, choose an intervention, and follow up with the ' +
              'targeted person.</p>' +
            '<div class="cp-chips">' +
              '<span class="cp-chip due"><i class="fa-solid fa-calendar"></i> Required · due Sep 15</span>' +
              '<span class="cp-chip"><i class="fa-solid fa-wand-magic-sparkles"></i> AI-guided · CLARA</span>' +
            '</div>' +
          '</div>' +
          '<div class="cp-hero-img" role="img" aria-label="The break room from the course’s practice scenario"></div>' +
        '</header>' +
      '<div class="cp-grid">' +
        '<div>' +
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
      '</div>' +
    '</main>';

  // Which session-record key marks each section complete.
  var DONE_KEYS = { baseline: 'baseline', compress: 'entry', video: 'video1', audio: 'audio',
                    terms: 'terms', drill: 'drill', norms: 'norms', efficacy: 'efficacy',
                    activate: 'activate', stepin: 'stepin',
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
  //  Entry check (adaptive pre-assessment) — the aptitude thread's opening.
  //  Two quick probes BEFORE any content, so the closing profile can show
  //  growth rather than a snapshot.
  //
  //  Presentation follows the "Quick Question" Basic Interaction: ONE question
  //  at a time, centered on the stage as the headline, with large blocky
  //  choices. The learner reads a question, not a briefing — the framework
  //  rationale (which constructs this maps to, why skills are never quizzed)
  //  is presenter material and lives in the step caption behind the footer "?".
  //  CLARA keeps the floating bubble for a short reaction after each pick;
  //  she no longer carries the stem or the options.
  // ==========================================================================
  var BASELINE_CONTENT =
    '<main class="ll-object">' +
      '<div class="bl-ask" id="blAsk">' +
        '<p class="ll-eyebrow" id="blStep">Answer: 2 questions</p>' +
        '<h2 class="bl-q" id="blQ" aria-live="polite"></h2>' +
        '<p class="bl-hint" id="blHint" hidden></p>' +
        '<div class="bl-options" id="blOptions" role="radiogroup" aria-labelledby="blQ"></div>' +
        '<p class="bl-next" id="blNext" aria-hidden="true">Next question' +
          '<span class="bl-next-track"><span class="bl-next-fill" id="blNextFill"></span></span></p>' +
      '</div>' +
    '</main>';

  // Q1 asks what you'd DO, not what counts as harassment — because what a right
  // answer here buys is the tactics lessons, and a definition question doesn't
  // evidence those. Choosing the strongest move shows both halves at once: that
  // the moves exist, and that you can pick the one this moment calls for.
  // The options are three of the five Ds, so the near-miss is a real tactic
  // rather than a wrong answer — the same best/near shape the drill teaches.
  var BASELINE_Q1 = {
    stem: 'A coworker won’t stop “joking” about a colleague’s body. You’re right there. What’s the strongest move?',
    hint: 'No grade, no trick — this just sets where you start.',
    options: [
      { t: 'Name it — ask them to stop', icon: 'fa-bullhorn', band: 2,
        reply: 'That’s the strongest one: closest to the moment, hardest to ignore. You already know the moves.' },
      { t: 'Check in with them after', icon: 'fa-hourglass-half', band: 1,
        reply: 'That’s a real move, and it beats nothing — but you’re right there. Choosing between them is what we’ll practise.' },
      { t: 'Nothing — not my place', icon: 'fa-ban', band: 1,
        reply: 'It is your place — and there are five ways to step in, most of them quieter than you’d expect. We’ll walk through them.' }
    ]
  };
  var BASELINE_Q2 = {
    stem: 'If you saw it happen, what would make it hardest to step in?',
    hint: 'Be honest — there’s no wrong answer to this one.',
    options: [
      { t: 'Knowing what to actually say', icon: 'fa-comment-dots', bands: { skills: 1, control: 2 },
        reply: 'That’s the most common answer there is — and it’s a skill, not a trait. I’ll focus there.' },
      { t: 'Whether it’s my place', icon: 'fa-users', bands: { norms: 1, control: 2 },
        reply: 'Fair. Watch how the people around you shape that feeling — we’ll come back to it.' },
      { t: 'Nothing — I’d step in', icon: 'fa-bolt', bands: { control: 3, skills: 2 },
        reply: 'Love the confidence. Let’s pressure-test it with something real.' }
    ]
  };
  function baselineInit(ctx) {
    var bands = { knowledge: 2, beliefs: 2, norms: 2, skills: 2, control: 2, activate: 2 };
    var answers = {};
    var askEl = document.getElementById('blAsk');
    var stepEl = document.getElementById('blStep');
    var qEl = document.getElementById('blQ');
    var hintEl = document.getElementById('blHint');
    var optsEl = document.getElementById('blOptions');
    var nextEl = document.getElementById('blNext');
    var fillEl = document.getElementById('blNextFill');

    // While a question is up, CLARA is the orb only — one thing on screen to
    // read. Her line waits behind it for anyone who taps, and she rises with a
    // reaction the moment an answer lands.
    ctx.setCoachSay('No grade here, and no trick — I just want to know where to aim.');
    ctx.floatClose();

    render(BASELINE_Q1, 1, function (opt) {
      bands.knowledge = opt.band; answers.q1 = opt.t;
      var dwell = T(2600);
      countdown(dwell);
      setTimeout(function () { swapTo(BASELINE_Q2, 2, done); }, dwell);
    });

    // The beat between the two questions is the one moment nothing is
    // clickable: the learner has answered, CLARA is replying, and Continue is
    // still gated. With no signal that reads as a broken page — so the wait
    // says what it's waiting for and shows how much of it is left.
    function countdown(ms) {
      if (!ms) return;                              // reduced motion: no dwell to show
      nextEl.classList.add('in');
      fillEl.style.transition = 'none';
      fillEl.style.width = '0%';
      void fillEl.offsetWidth;                      // commit the reset before animating
      fillEl.style.transition = 'width ' + ms + 'ms linear';
      fillEl.style.width = '100%';
    }
    // Snapped away, not faded: this runs inside the swap, while the whole
    // block is already invisible, so there's nothing to animate — and a fade
    // would leave "Next question" and a full bar under question 2, where
    // neither is true any more.
    function clearCountdown() {
      nextEl.style.transition = 'none';
      nextEl.classList.remove('in');
      fillEl.style.transition = 'none';
      fillEl.style.width = '0%';
      void nextEl.offsetWidth;
      nextEl.style.transition = '';
    }

    // Fade the answered question out, drop the next one into the same slot —
    // and tuck CLARA back to the orb as it lands, so question 2 gets the same
    // clean stage question 1 had.
    function swapTo(q, n, onPick) {
      askEl.classList.add('swapping');
      setTimeout(function () {
        render(q, n, onPick);
        askEl.classList.remove('swapping');
        clearCountdown();
        ctx.floatClose();
        ctx.positionOrb(true);
      }, T(320));
    }

    function render(q, n, onPick) {
      stepEl.textContent = 'Answer: question ' + n + ' of 2';
      qEl.textContent = q.stem;
      hintEl.textContent = q.hint || '';
      hintEl.hidden = !q.hint;
      optsEl.className = 'bl-options';
      optsEl.innerHTML = '';
      var picked = false;
      q.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'bl-option'; b.type = 'button';
        b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
        b.innerHTML = '<i class="fa-solid ' + opt.icon + '" aria-hidden="true"></i>' +
                      '<span class="bl-option-label">' + esc(opt.t) + '</span>';
        b.addEventListener('click', function () {
          if (picked) return; picked = true;
          b.setAttribute('aria-checked', 'true');
          optsEl.classList.add('answered');
          optsEl.querySelectorAll('.bl-option').forEach(function (o) { if (o !== b) o.disabled = true; });
          ctx.floatOpen();
          ctx.setCoachSay(esc(opt.reply));
          ctx.positionOrb(true);
          onPick(opt);
        });
        optsEl.appendChild(b);
      });
      pickGroup(optsEl);
    }

    function done(opt) {
      answers.q2 = opt.t;
      Object.keys(opt.bands || {}).forEach(function (k) { bands[k] = opt.bands[k]; });
      stepEl.textContent = 'Answer: 2 of 2 done';
      saveResult('baseline', { bands: bands, answers: answers });
      // Record the result here, not on the adjustment screen — that screen
      // only appears when something compressed, and the profile, the title
      // page and the counters all need the result on either path.
      saveResult('entry', { strength: entryStrength(), up: testUp() });
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
      '<p class="ll-eyebrow">Check: 2 questions</p>' +
      '<h2>Let’s check what stuck.</h2>' +
      '<p class="ll-sub">Anything you miss gets fixed here, not flagged on a report.</p>' +
      '<div class="mp-scene">' +
        '<div class="mp-scene-tag"><i class="fa-solid fa-lock" aria-hidden="true"></i> Question 1</div>' +
        '<p>Everyone answers this one, whatever path they took.</p>' +
      '</div>' +
      '<div class="mp-scene" style="margin-top:12px">' +
        '<div class="mp-scene-tag"><i class="fa-solid fa-shuffle" aria-hidden="true"></i> Question 2</div>' +
        '<p>The part after the moment — what you just practised with Priya.</p>' +
      '</div>' +
    '</main>';
  var CHECK_LOCKED_STD = {
    stem: 'First one, and everyone gets this one — true or false: <strong>harassing or firing an employee because of their sexual orientation, ' +
          'gender identity, or departure from gender stereotypes violates federal law.</strong>',
    options: [ { t: 'True', correct: true }, { t: 'False', correct: false } ],
    correctReply: 'Correct — all three are protected under federal law. One more item, then the scenario.',
    wrongReply: 'Not quite — it’s actually true, and this is the one everybody has to get. Give it another look.'
  };
  var CHECK_LOCKED_ADV = {
    stem: 'First one, and I’ve made it a hard one — true or false: <strong>retaliation protections only apply after a formal, ' +
          'written complaint has been filed.</strong>',
    options: [ { t: 'True', correct: false }, { t: 'False', correct: true } ],
    correctReply: 'Right — false. Protections cover informal reports and witnesses too, from the moment conduct is raised in any form. One more item.',
    wrongReply: 'It’s actually false — protections aren’t gated on paperwork. This is the one everybody has to get, so look again.'
  };
  var CHECK_SAMPLED = {
    stem: 'Last one — <strong>you stepped in and the moment has passed. Priya’s back at her desk. What’s the strongest follow-up?</strong>',
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
          } else {
            b.classList.add('is-wrong');
            fb.className = 'vq-feedback bad'; fb.textContent = opt.reply;
            saveResult('check', { locked: true, item2: 'missed', missed: true, tier: testUp() ? 'advanced' : 'standard' });
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
  // The tactic and its definition are the objective and never move. Only the
  // worked example is lensed — that's the context-sensitive half.
  var FIVE_DS = [
    { icon: 'fa-bullhorn', name: 'Direct',
      def: 'Name what’s happening and ask it to stop.' },
    { icon: 'fa-arrows-split-up-and-left', name: 'Distract',
      def: 'Break the moment without confronting anyone.' },
    { icon: 'fa-user-group', name: 'Delegate',
      def: 'Bring in someone better placed to act.' },
    { icon: 'fa-hourglass-half', name: 'Delay',
      def: 'Check in with the target once the moment passes.' },
    { icon: 'fa-file-lines', name: 'Document',
      def: 'Record what, when, who — so a report can act.' }
  ];
  function TERMS_CONTENT() { return '' +
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Review: 5 flip cards</p>' +
      '<h2>The Five Ds.</h2>' +
      '<p class="ll-sub">Five ways to step in. Flip each card for what it means and what it sounds like.</p>' +
      '<div class="tr-grid" id="trGrid">' +
        FIVE_DS.map(function (d, i) {
          return '<button class="tr-card" type="button" data-i="' + i + '" aria-label="Flip: ' + esc(d.name) + '">' +
            '<span class="tr-inner">' +
              '<span class="tr-face"><i class="fa-solid ' + d.icon + '" aria-hidden="true"></i><b>' + esc(d.name) + '</b><span class="hint">Tap to flip</span></span>' +
              '<span class="tr-face tr-back"><b>' + esc(d.name) + '</b><p>' + esc(d.def) + '</p><p class="ex">' + esc(lens().ds[d.name]) + '</p></span>' +
            '</span>' +
          '</button>';
        }).join('') +
      '</div>' +
      '<p class="tr-progress" id="trProgress"><b>0</b> of 5 flipped</p>' +
    '</main>'; }
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
          saveResult('terms', { done: true });
          ctx.enableNext();
          ctx.positionOrb(true);
        }
      });
    });
  }

  // LEARN · Know (K2 barriers) — "A quick read": the passage IS the beat, so it
  // gets the type weight and the header steps back out of its way (no subtitle,
  // lighter title — see .ll-object.is-read in course.html). Reading is the
  // default state; narration is the option, on one "Read to me" control that
  // starts browser TTS with word-by-word highlighting. Nothing autoplays, and
  // nothing is gated: a self-paced read has no completion event to wait for, so
  // Continue is live from the first frame (step.gate is false). Compressible.
  var AUDIO_TEXT =
    'Here’s the strange part: the more people who see something, the less likely any one of them is to act. ' +
    'Psychologists call it diffusion of responsibility — everyone assumes someone else will handle it. ' +
    'Add the fear of misreading the moment, and a room full of decent people can stay perfectly silent. ' +
    'That silence isn’t agreement. It’s a stalemate — and it breaks the instant one person moves. ' +
    'You’re learning to be that person. Not the loudest one. Just the first.';
  var AUDIO_CONTENT =
    '<main class="ll-object is-read">' +
      '<p class="ll-eyebrow">Read or listen: 2 minutes</p>' +
      '<h2>Why rooms stay quiet.</h2>' +
      '<p class="ll-sub">Read it at your own pace, or tap “Read to me” to hear it read aloud.</p>' +
      '<div class="aud-wrap">' +
        // Above the passage, not below it: someone who would rather listen than
        // read shouldn't have to read the whole thing to find the audio option.
        '<button class="aud-play" id="audPlay" type="button"><i class="fa-solid fa-volume-high"></i> Read to me</button>' +
        '<p class="aud-text" id="audText"></p>' +
        // Prototype disclaimer — kept out of the way until narration is used.
        '<p class="aud-note" id="audNote"><i class="fa-solid fa-circle-info"></i> Narration uses your browser’s built-in speech — a stand-in for the produced voice track.</p>' +
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
    var noteEl = document.getElementById('audNote');
    var playing = false, heard = false;

    // The read counts as delivered on arrival — the learner sets the pace and
    // Continue is already live, so there's no event left to credit it against.
    saveResult('audio', { done: true, mode: 'read' });

    function wordAt(charIndex) {
      for (var i = offsets.length - 1; i >= 0; i--) if (charIndex >= offsets[i]) return i;
      return 0;
    }
    function highlight(i) {
      spans.forEach(function (sp, j) { sp.classList.toggle('hot', j === i); });
    }
    function label(icon, text) {
      playBtn.innerHTML = '<i class="fa-solid ' + icon + '"></i> ' + text;
    }
    function stop(icon, text) {
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      playing = false;
      playBtn.classList.remove('on');
      spans.forEach(function (sp) { sp.classList.remove('hot'); });
      label(icon, text);
    }
    playBtn.addEventListener('click', function () {
      if (noteEl) noteEl.classList.add('show');
      if (!('speechSynthesis' in window)) {         // no voice on this browser
        playBtn.disabled = true;
        label('fa-circle-exclamation', 'Narration unavailable');
        return;
      }
      if (playing) { stop('fa-volume-high', 'Read to me'); return; }
      var u = new SpeechSynthesisUtterance(AUDIO_TEXT);
      u.rate = 1.0;
      u.onboundary = function (e) { if (e.name === 'word' || e.charIndex != null) highlight(wordAt(e.charIndex)); };
      u.onend = function () {
        stop('fa-rotate-left', 'Read it again');
        if (heard) return;
        heard = true;
        saveResult('audio', { done: true, mode: 'listen' });
        ctx.setCoachSay('That last line is the whole course: not the loudest one. Just the first.');
        ctx.positionOrb(true);
      };
      playing = true;
      playBtn.classList.add('on');
      label('fa-pause', 'Pause');
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    });

    // Steps have no teardown hook, so a running utterance would keep talking
    // over the next screen: stop the voice when the passage leaves the DOM.
    var stageEl = document.querySelector('.ll-stage');
    if (stageEl && window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (document.body.contains(textEl)) return;
        mo.disconnect();
        if ('speechSynthesis' in window) speechSynthesis.cancel();
      });
      mo.observe(stageEl, { childList: true });
    }
  }

  // LEARN · Know (K4 select the tactic) — "Pick your move": four situations,
  // tap the D that fits. Some situations accept a second-best answer with a
  // coaching note. Compressible.
  var DRILL_SITS = [
    { best: 'Direct', near: 'Distract',
      ok: 'Right — you’re close, it’s live, and naming it lands hardest in the moment.',
      nearMsg: 'Distract works too — but this close, Direct is stronger. Take it when you can.' },
    { best: 'Delay', near: null,
      ok: 'Exactly — the moment passing doesn’t end your options. The check-in is still an intervention.' },
    { best: 'Delegate', near: 'Document',
      ok: 'Right — power gaps are what Delegate is for. Find the person they’ll actually hear.',
      nearMsg: 'Documenting helps — but someone with standing needs to act. Delegate first, document alongside.' },
    { best: 'Document', near: 'Delegate',
      ok: 'Yes — a pattern needs a record. Dates, words, witnesses: that’s what moves an investigation.',
      nearMsg: 'Escalating is fair — but a pattern without a record is one person’s word. Document it too.' }
  ];
  var DRILL_DS = ['Direct', 'Distract', 'Delegate', 'Delay', 'Document'];
  function DRILL_CONTENT() { return '' +
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Practice: 4 questions</p>' +
      '<h2>Pick your move.</h2>' +
      '<p class="ll-sub">Four moments, five moves. Pick the one that fits; you’ll see the stronger option if there was one.</p>' +
      '<div class="dr-wrap">' +
        '<div class="dr-card"><span class="tag" id="drTag">Moment 1 of 4</span><p id="drText"></p></div>' +
        '<div class="dr-ds" id="drDs">' +
          DRILL_DS.map(function (d) { return '<button class="dr-d" type="button" data-d="' + d + '">' + d + '</button>'; }).join('') +
        '</div>' +
        '<p class="dr-fb" id="drFb"></p>' +
        '<p class="dr-progress" id="drProgress"><b>0</b> of 4 placed</p>' +
      '</div>' +
    '</main>'; }
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
          saveResult('drill', { done: true });
          ctx.enableNext();
          ctx.positionOrb(true);
        } else { show(); }
      }, T(2400));
    }
    function show() {
      settled = false;
      document.getElementById('drTag').textContent = 'Moment ' + (i + 1) + ' of 4';
      textEl.textContent = lens().drill[i];   // the situation is lensed; the tactic that fits it isn't
      fb.className = 'dr-fb'; fb.textContent = '';
      btns.forEach(function (b) { b.disabled = false; b.classList.remove('hit', 'near', 'miss'); });
    }
  }

  // LEARN · Feel (F1 social norms + F4 self-efficacy) — "Peer Results":
  // guess what the crew thinks, then see the actual norms data. The reveal is
  // the teaching. Survives compression on every path.
  // One list, used twice: the three things a learner can guess AND the three
  // real numbers. The choices don't get replaced by a chart — each choice IS
  // its own result row, so the answer lands on the thing the learner clicked.
  var NORMS_DATA = [
    { k: 'respect',   label: 'Most would quietly respect it', pct: 84 },
    { k: 'overreact', label: 'Most would think I overreacted', pct: 11 },
    { k: 'notice',    label: 'Most wouldn’t even notice', pct: 5 }
  ];
  function NORMS_CONTENT() { return '' +
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Compare: 1 question</p>' +
      '<h2>Would they back you?</h2>' +
      '<p class="ll-sub">Answer honestly and then we’ll display the real numbers for each.</p>' +
      '<div class="pr-wrap">' +
        '<div class="pr-choices" id="prChoices">' +
          NORMS_DATA.map(function (d) {
            return '<button class="pr-choice" type="button" data-k="' + d.k + '">' +
              '<span class="pr-head">' +
                '<span class="pr-lab">' + esc(d.label) + '</span>' +
                '<span class="pr-tag">Your guess</span>' +
                '<span class="pr-pct">' + d.pct + '%</span>' +
              '</span>' +
              '<span class="pr-track"><span class="pr-fill" data-w="' + d.pct + '"></span></span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<p class="pr-src" id="prSrc" hidden><i class="fa-solid fa-users" aria-hidden="true"></i> Anonymous survey · ' + esc(lens().org) + ' · 214 responses · representative data</p>' +
      '</div>' +
    '</main>'; }
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
      // The rows the learner just chose from become the results — same labels,
      // same order, same position on screen. Nothing is replaced or repeated,
      // so their pick stays under their eye while the real number lands on it.
      var choices = document.getElementById('prChoices');
      choices.classList.add('answered');
      NORMS_DATA.forEach(function (d) {
        var b = choices.querySelector('.pr-choice[data-k="' + d.k + '"]');
        if (b && d.pct >= 50) b.classList.add('is-top');
      });
      document.getElementById('prSrc').hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        choices.querySelectorAll('.pr-fill').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
      }); });
      setTimeout(function () {
        ctx.setCoachSay(picked === 'respect'
          ? 'You called it — <strong>84%</strong> say they’d respect it. Most people guess under half, and that gap is why rooms stay silent: everyone’s waiting for a first mover they’d already support.'
          : 'Here’s the part almost everyone gets wrong: <strong>84%</strong> say they’d respect it. The silence you’re reading as disapproval is usually agreement waiting for a first mover — and it doesn’t take perfect words to be that person.');
        saveResult('norms', { guess: picked });
        ctx.enableNext();
        ctx.positionOrb(true);
      }, T(1300));
    }
  }

  // ==========================================================================
  //  LEARN · Feel — self-efficacy. "Believe you can intervene without
  //  escalating or damaging your standing."
  //
  //  A Feel objective cannot be taught by telling someone to feel it, so this
  //  beat does what the deck's Feel domain actually asks for: surface the
  //  belief the learner already holds, then put evidence against it. The
  //  slider is the measurement; the reframe is the instruction. Never
  //  compressible — a quiz cannot verify a belief.
  // ==========================================================================
  var EFFICACY_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Rate: 1 question</p>' +
      '<h2>Could you pull it off?</h2>' +
      '<p class="ll-sub">Not whether you should — whether you could, without it blowing up on you.</p>' +
      '<div class="ef-wrap">' +
        '<p class="ef-q">If you said something to Jake in front of everyone, how confident are you that it would go ' +
          '<em>fine</em> — no scene, no fallout for you?</p>' +
        '<div class="ef-slider">' +
          '<input type="range" id="efRange" min="0" max="100" value="50" step="1" ' +
            'aria-label="How confident are you that speaking up would go fine?">' +
          '<div class="ef-scale"><span>Not at all</span><span>Completely</span></div>' +
        '</div>' +
        '<div class="ef-readout" id="efReadout"><b id="efVal">50</b><span id="efWord">Somewhere in the middle</span></div>' +
        '<button class="ef-lock" id="efLock" type="button">That’s my answer</button>' +
        '<div class="ef-after" id="efAfter" hidden>' +
          '<p class="ef-real" id="efReal"></p>' +
          '<ul class="ef-evidence">' +
            '<li><i class="fa-solid fa-comment" aria-hidden="true"></i><span>Most interventions are <b>one sentence long</b>. “That’s not okay — drop it.” Nothing to escalate.</span></li>' +
            '<li><i class="fa-solid fa-users" aria-hidden="true"></i><span>You already saw the number: <b>84%</b> of the room would back you.</span></li>' +
            '<li><i class="fa-solid fa-shield-halved" aria-hidden="true"></i><span>Retaliation for stepping in is <b>itself a violation</b> — the protection covers witnesses, not just targets.</span></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
    '</main>';
  function efficacyWord(v) {
    return v < 25 ? 'Not confident' : v < 50 ? 'Doubtful' : v < 75 ? 'Fairly confident' : 'Very confident';
  }
  function efficacyInit(ctx) {
    ctx.floatOpen();
    ctx.setCoachSay('Be honest with this one — I’m not scoring it. I just want to know what you think you’re capable of.');
    var range = document.getElementById('efRange');
    var val = document.getElementById('efVal');
    var word = document.getElementById('efWord');
    var lock = document.getElementById('efLock');
    var locked = false;
    range.addEventListener('input', function () {
      val.textContent = range.value;
      word.textContent = efficacyWord(+range.value);
    });
    lock.addEventListener('click', function () {
      if (locked) return; locked = true;
      var v = +range.value;
      range.disabled = true;
      lock.hidden = true;
      document.getElementById('efReal').innerHTML = v >= 70
        ? 'Good — and worth knowing your read is <b>well-founded</b>, not just optimism:'
        : 'That’s the most common answer there is. Here’s what it’s usually missing:';
      var after = document.getElementById('efAfter');
      after.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { after.classList.add('in'); }); });
      ctx.setCoachSay(v >= 70
        ? 'That confidence is the thing that actually predicts stepping in — more than knowing the five moves does.'
        : 'That gap between “I should” and “I could” is the real barrier here — not knowledge. Which is why we practise it rather than explain it.');
      saveResult('efficacy', { confidence: v });
      ctx.enableNext();
      ctx.positionOrb(true);
    });
  }

  // ==========================================================================
  //  LEARN · Do — activate. "Recognize and act on the cue to intervene while
  //  the moment is still open."
  //
  //  The one beat in the module a question could not stand in for. The scene
  //  runs in real time and the window closes on its own; the learner either
  //  moves inside it or watches it shut. Missing is a legitimate outcome and
  //  is NOT retried — the moment genuinely passing is the teaching, and it
  //  hands off to Delay, which is what the drill already taught. Gates on
  //  having taken the run, not on having caught it. Never compressible.
  // ==========================================================================
  var ACTIVATE_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Do it: 1 moment</p>' +
      '<h2>Say it while it’s open.</h2>' +
      '<p class="ll-sub">This one runs in real time. When you see something worth stopping, stop it — the moment won’t wait.</p>' +
      '<div class="ac-wrap">' +
        '<div class="ac-stage" id="acStage">' +
          '<div class="ac-lines" id="acLines"></div>' +
        '</div>' +
        '<div class="ac-window" id="acWindow" hidden>' +
          '<div class="ac-track"><div class="ac-fill" id="acFill"></div></div>' +
        '</div>' +
        '<button class="ac-go" id="acGo" type="button" disabled>' +
          '<i class="fa-solid fa-hand" aria-hidden="true"></i> Say something</button>' +
        '<p class="ac-verdict" id="acVerdict" hidden></p>' +
      '</div>' +
    '</main>';
  // The cue is line 3. Everything before it is the room filling in; the window
  // opens on the line that makes intervening warranted.
  var ACTIVATE_SCENE = [
    { who: 'Jake',   at: 0,    text: 'Alright, who’s on the crib tonight?' },
    { who: 'Room',   at: 1400, text: '(general shuffling, someone laughs at something else)', mute: true },
    { who: 'Jake',   at: 3000, text: 'Oh — Priya’s on. Hey Priya, still doing that thing with the—', cue: true },
    { who: 'Room',   at: 4600, text: '(a couple of people laugh. Someone glances at you.)', mute: true },
    { who: 'Jake',   at: 6400, text: 'What? It’s a compliment. Relax.' }
  ];
  var ACTIVATE_WINDOW = 6200;   // ms the cue stays actionable, from the cue line
  function activateInit(ctx) {
    ctx.floatOpen();
    ctx.setCoachSay('Watch it play. The second you think “someone should say something” — that’s you. Hit the button.');
    var lines = document.getElementById('acLines');
    var go = document.getElementById('acGo');
    var win = document.getElementById('acWindow');
    var fill = document.getElementById('acFill');
    var verdict = document.getElementById('acVerdict');
    var cueAt = null, done = false, timers = [];

    ACTIVATE_SCENE.forEach(function (l) {
      timers.push(setTimeout(function () {
        var d = document.createElement('p');
        d.className = 'ac-line' + (l.mute ? ' is-mute' : '');
        d.innerHTML = l.mute ? esc(l.text)
          : '<b>' + esc(l.who) + '</b> ' + esc(l.text);
        lines.appendChild(d);
        lines.scrollTop = lines.scrollHeight;
        if (l.cue) openWindow();
      }, T(l.at)));
    });

    function openWindow() {
      cueAt = Date.now();
      go.disabled = false;
      win.hidden = false;
      fill.style.transition = 'none'; fill.style.width = '100%';
      void fill.offsetWidth;
      fill.style.transition = 'width ' + T(ACTIVATE_WINDOW) + 'ms linear';
      fill.style.width = '0%';
      timers.push(setTimeout(missed, T(ACTIVATE_WINDOW)));
    }

    go.addEventListener('click', function () {
      if (done || cueAt === null) return;
      done = true;
      var ms = Date.now() - cueAt;
      timers.forEach(clearTimeout);
      go.disabled = true;
      win.hidden = true;
      settle(true, ms);
    });

    function missed() {
      if (done) return; done = true;
      timers.forEach(clearTimeout);
      go.disabled = true;
      win.hidden = true;
      settle(false, null);
    }

    function settle(inTime, ms) {
      document.getElementById('acStage').classList.add(inTime ? 'is-hit' : 'is-missed');
      verdict.hidden = false;
      verdict.className = 'ac-verdict ' + (inTime ? 'ok' : 'late');
      verdict.innerHTML = inTime
        ? '<i class="fa-solid fa-circle-check"></i> You moved <b>' + (ms / 1000).toFixed(1) + ' seconds</b> after the line landed — while the room was still deciding what it thought.'
        : '<i class="fa-solid fa-clock"></i> The moment closed. Jake moved on and the room settled — which is exactly how most of them end.';
      ctx.setCoachSay(inTime
        ? 'That’s the whole skill. Not the wording — the timing. You spoke while it was still one comment instead of a pattern everyone had agreed to ignore.'
        : 'That’s honest, and it’s the common outcome — the window is genuinely short. It doesn’t end your options, though: this is exactly where Delay earns its place. Catch Priya afterwards.');
      saveResult('activate', { acted: inTime, ms: ms });
      ctx.enableNext();
      ctx.positionOrb(true);
    }
  }

  // LEARN · Do (D4 sustain) — "Conversation Step-In": Priya texts after the
  // incident and the learner takes the thread over. Rehearsal AS instruction —
  // this beat is what the mastery check's sampled item then tests.
  var STEPIN_CONTENT =
    '<main class="ll-object">' +
      '<p class="ll-eyebrow">Practice: text conversation</p>' +
      '<h2>After the moment.</h2>' +
      '<p class="ll-sub">The step almost everyone skips: the follow-up. Priya just texted you — pick the reply you’d actually send.</p>' +
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
  //  PATH ADJUSTMENT — the one screen whose whole job is showing the learner
  //  what their own answers just did to the course. So it shows ONLY that.
  //
  //  Off this screen deliberately: the fixed beats (Welcome, the entry check
  //  itself, the Feel and Do work, the scenario, the profile) — they never
  //  change, so listing them buries the four rows that did. Also gone: the
  //  "entry battery" framing, the SME/objective vocabulary and the audit
  //  chain. None of that is a learner's language or a learner's question;
  //  it's presenter material and lives in the step caption behind the "?".
  //
  //  CLARA crowns the stack rather than sitting in a rail: she says WHY in a
  //  sentence, the rows say WHAT, and they arrive one at a time so the change
  //  reads as something happening rather than a list that was always there.
  //  Presenter override: "Demo: flip entry result".
  // ==========================================================================
  var ADJUST_CONTENT =
    '<main class="ll-object ll-object--crowned" id="adjustObject">' +
      '<div class="adj">' +
        '<p class="ll-eyebrow" id="adjEyebrow">Your path</p>' +
        '<h2 class="adj-head" id="adjHead">Reading your answers…</h2>' +
        '<ol class="adj-stack" id="adjStack" aria-live="polite"></ol>' +
        '<p class="adj-saved" id="adjSaved">&nbsp;</p>' +
      '</div>' +
    '</main>';

  // The only rows worth a screen: lessons whose presence, length or difficulty
  // depends on how the learner answered. `step` links each row to the real
  // step, so the minutes below are the course's own numbers, not a claim.
  // Two questions can only buy what two questions evidence. The tactics
  // cluster goes together — showing you can pick the right move demonstrates
  // you know the moves — and the intro clip shortens because recognising the
  // behaviour is exactly what it's there to teach. Everything else stays.
  var ADJUST_ROWS = [
    { step: 'terms',     icon: 'fa-list-check',      label: 'The Five Ds',   kind: 'drop'   },
    { step: 'drill',     icon: 'fa-hand-pointer',    label: 'Pick your move', kind: 'drop'  },
    { step: 'video',     icon: 'fa-circle-play',     label: 'Intro video',   kind: 'short'  },
    { step: 'check',     icon: 'fa-clipboard-check', label: 'Mastery check', kind: 'harder' }
  ];

  // The verdict copy. The WORKING state is the eyebrow and headline already in
  // ADJUST_CONTENT — branch-independent on purpose, so the learner can't read
  // the outcome off the page before the rows have actually resolved.
  var ADJUST_BRANCHES = {
    compressed: {
      eyebrow: 'Your path just changed',
      head: 'You can skip ahead.'
    },
    full: {
      eyebrow: 'Your path',
      head: 'Nothing to skip yet.'
    }
  };

  function minsFor(id) {
    for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return STEPS[i].mins || 0;
    return 0;
  }

  var ADJUST_CHIPS = {
    dropped: '<span class="adj-chip adj-chip--drop"><i class="fa-solid fa-forward"></i> Skipped</span>',
    shorter: '<span class="adj-chip adj-chip--short"><i class="fa-solid fa-scissors"></i> Shorter</span>',
    harder:  '<span class="adj-chip adj-chip--harder"><i class="fa-solid fa-arrow-trend-up"></i> Harder</span>',
    kept:    '<span class="adj-chip adj-chip--keep">Kept</span>'
  };

  function compressInit(ctx) {
    var strength = entryStrength();
    var up = testUp();
    var B = ADJUST_BRANCHES[strength];
    var stack = document.getElementById('adjStack');
    var compressed = strength === 'compressed';

    // Build the row set for THIS result. The mastery check only earns a row
    // when it actually changed (test-up) — an unchanged row is just noise.
    var rows = ADJUST_ROWS.filter(function (r) {
      return r.kind !== 'harder' || (compressed && up);
    }).map(function (r) {
      var mins = minsFor(r.step);
      if (!compressed)        return { row: r, state: 'kept',    note: mins + ' min' };
      if (r.kind === 'drop')  return { row: r, state: 'dropped', note: mins + ' min saved' };
      if (r.kind === 'short') return { row: r, state: 'shorter', note: 'the short cut' };
      return { row: r, state: 'harder', note: 'you earned the tougher version' };
    });

    var saved = rows.reduce(function (n, r) {
      return n + (r.state === 'dropped' ? minsFor(r.row.step) : 0);
    }, 0);
    var dropped = rows.filter(function (r) { return r.state === 'dropped'; }).length;

    // EVERY row is on screen from the first frame, spinner where its verdict
    // will go — and the summary line holds its space with a blank. Only the
    // verdicts resolve, so no part of this page ever moves under the reader.
    stack.innerHTML = rows.map(function (r) {
      return '<li class="adj-row" data-state="pending">' +
               '<span class="adj-ico"><i class="fa-solid ' + r.row.icon + '" aria-hidden="true"></i></span>' +
               '<span class="adj-main"><span class="adj-label">' + esc(r.row.label) + '</span>' +
               '<span class="adj-note">' + minsFor(r.row.step) + ' min</span></span>' +
               '<span class="adj-state"><span class="adj-spin" aria-hidden="true"></span></span>' +
             '</li>';
    }).join('');

    var els = [].slice.call(stack.children);
    rows.forEach(function (r, i) {
      setTimeout(function () {
        var li = els[i];
        li.dataset.state = r.state;
        li.querySelector('.adj-note').textContent = r.note;
        li.querySelector('.adj-state').innerHTML = ADJUST_CHIPS[r.state];
      }, T(900 + i * 480));
    });
    setTimeout(finish, T(900 + rows.length * 480 + 300));

    function finish() {
      document.getElementById('adjEyebrow').textContent = B.eyebrow;
      document.getElementById('adjHead').textContent = B.head;
      var savedEl = document.getElementById('adjSaved');
      savedEl.textContent = compressed
        ? dropped + ' lessons off your path — about ' + saved + ' minutes.'
        : 'Nothing removed. You’ll see all of it.';
      savedEl.classList.add('in');
      saveResult('entry', { strength: strength, up: up });
      // Refresh the counters FIRST (compression changes the visible total),
      // then unlock Continue: updateFooter re-arms the gate.
      updateFooter(STEPS[idx]);
      updateFrame(STEPS[idx]);
      ctx.enableNext();
    }
  }

  // ==========================================================================
  //  IN-COURSE REMEDIATION — the object the mastery-check miss inserted, in
  //  the moment. Two rehearsal beats on objective D4: the words in the room,
  //  then the follow-up the check just showed was shaky.
  // ==========================================================================
  function PRACTICE_CONTENT() { return '' +
    '<main class="ll-object">' +
      '<p class="ll-eyebrow"><i class="fa-solid fa-wand-magic-sparkles"></i> Practice: 2 minutes</p>' +
      '<h2>Say it out loud.</h2>' +
      '<p class="ll-sub">Knowing the right move isn’t the same as having the words ready. ' +
        'Two quick run-throughs — the moment itself, then the follow-up.</p>' +
      '<div class="mp-scene" id="mpScene">' +
        '<div class="mp-scene-tag"><i class="fa-solid fa-clapperboard" aria-hidden="true"></i> ' + esc(lens().remediationWhen) + '</div>' +
        '<p id="mpSceneText">' + esc(lens().remediationText) + '</p>' +
      '</div>' +
    '</main>'; }
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
    if (typeof base.activate !== 'number') base.activate = 2;   // not probed at entry — no Do items there
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
      control:   strong ? 3 : Math.max(base.control, 2),
      // Missing the window is instruction, not failure — it bands at Good and
      // only catching it earns Excellent.
      activate:  (course.activate && course.activate.acted) ? 3 : 2
    };
    var evidence = {
      knowledge: base.knowledge >= 2
        ? 'Verified the intervention tactics at entry, then held the locked mastery item' + (up ? ' at the advanced tier' : '') + ' — first try.'
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
      control: (course.efficacy && typeof course.efficacy.confidence === 'number')
        ? 'Rated your own odds at ' + course.efficacy.confidence + '/100 before the practice — then held up under real pushback.'
        : 'Held steady under Jake’s pushback in the scenario.',
      activate: (course.activate && course.activate.acted)
        ? 'Spoke ' + (course.activate.ms / 1000).toFixed(1) + 's after the cue landed, while the window was still open.'
        : 'The window closed before you moved — the most common outcome, and the reason Delay is taught alongside.'
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
        P.atGood + ' of ' + CONSTRUCTS.length + ' constructs (the bar is 80%). Not “right answers” — demonstrated behavior.'
      : '<i class="fa-solid fa-circle-half-stroke"></i> <b>Almost</b> — ' + P.atGood + ' of ' + CONSTRUCTS.length +
        ' constructs at Good or above; the bar is 80%. CLARA has queued targeted practice for the gap.';
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
          // The classification the objective was signed under, and the
          // theoretical construct anchoring it — the record's language, kept
          // visibly subordinate to the plain-English name above it.
          '<div class="apt-class">' +
            '<span class="apt-dom ' + DOMAIN_CLS[c.domain] + '">' + esc(c.domain) + ' / ' + esc(c.sub) + '</span>' +
            '<span class="apt-theory">' + esc(c.theory) + '</span>' +
          '</div>' +
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
    wireChat(ctx, [
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
  // Answers that hold up anywhere in the course, for the floating bubble —
  // the docked steps pass their own, step-specific pool.
  var CLARA_COURSE_REPLIES = [
    "Short version: you don’t have to fix the whole situation. You just have to not leave the person alone in it.",
    "If you’re not sure it counts, that uncertainty is the normal part. Say something anyway — a check-in costs you almost nothing.",
    "You can go back to any section from the menu. Nothing here locks you out once you’ve seen it.",
    "I’m reading your answers as we go, not scoring you — and nothing you say to me in here goes on your record."
  ];

  // One chat, both chromes: the docked rail and the floating bubble use the
  // same ids, and only one chrome exists at a time.
  function wireChat(ctx, replies) {
    var input = ctx.chrome.querySelector('#claraAsk');
    var send  = ctx.chrome.querySelector('#claraAskSend');
    var echo  = ctx.chrome.querySelector('#claraEcho');
    if (!input || !send || !echo) return;
    var pool = replies || CLARA_REPLIES;
    var ri = 0, busyReply = false;
    function addRow(kind, text) {
      var d = document.createElement('div');
      d.className = 'cbub ' + kind;                 // 'you' | 'clara' — styled as a speech bubble
      d.textContent = text;
      echo.appendChild(d);
      echo.scrollTop = echo.scrollHeight;          // follow the newest message
      return d;
    }
    function submit() {
      var v = input.value.trim();
      if (!v || busyReply) return;
      busyReply = true;
      addRow('you', v);
      input.value = '';
      // She thinks before she answers — the same three-dot beat the docked
      // panel uses, so a canned reply doesn't land instantly and read as fake.
      var dots = addRow('clara', '');
      dots.className = 'cbub clara typing';
      dots.innerHTML = '<span></span><span></span><span></span>';
      setTimeout(function () {
        dots.className = 'cbub clara';
        dots.textContent = pool[ri % pool.length];
        ri++; busyReply = false;
        echo.scrollTop = echo.scrollHeight;
      }, T(900));
    }
    send.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  }

  // The floating bubble's Reply / collapse toggle. Wired for every floating
  // step, so the companion is a way IN to CLARA on every page that has her —
  // not a tooltip you can only read.
  function wireFloatingChat(ctx, replies) {
    var bubble = ctx.chrome.querySelector('#claraBubble');
    var reply  = ctx.chrome.querySelector('#claraReply');
    var close  = ctx.chrome.querySelector('#claraCollapse');
    if (!bubble || !reply) return;
    reply.addEventListener('click', function () {
      bubble.classList.add('is-chat');
      ctx.floatOpen();
      var input = ctx.chrome.querySelector('#claraAsk');
      if (input) input.focus();
      ctx.positionOrb(true);
    });
    if (close) close.addEventListener('click', function () {
      bubble.classList.remove('is-chat');
      ctx.positionOrb(true);
    });
    wireChat(ctx, replies || CLARA_COURSE_REPLIES);
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
      caption: { title: 'ENTRY · Floating companion', note: 'The module contract’s Entry stage: Know & Feel probes before any content, presented as Quick Questions — one question, large choices, nothing else on screen. SCALE: the real battery is 17 items spanning all four modules of the course; these two stand in for it, so treat the compression they buy as illustrative of the mechanism rather than of how much a two-question check could actually evidence. What a learner proves here is compressed out of the path (test-out); skills are never quizzed, because a skill can’t be tested out of, only shown — that’s the Perform stage. Every signal CLARA logs maps to one of the five constructs from the Individual Determinants of Behavior framework, and the closing profile reads back against these same five.' },
      coach: { say: 'Loading…' },   // baselineInit swaps in Q1 immediately
      content: BASELINE_CONTENT, init: baselineInit },

    // Only on the branch where something actually changed. A learner who
    // proved nothing gets no screen — telling them "nothing was removed" is a
    // non-event, and it would land as an EXTRA screen on the longer path: a
    // tax on the person already doing more work. Silence is the right output
    // of an adaptive system that decided not to act.
    { id: 'compress', icon: 'fa-diagram-project', mins: 1, stage: 'Entry', mode: 'crown', lesson: 'What You Can Skip', gate: true, interstitial: true,
      when: function () { return entryStrength() === 'compressed'; },
      caption: { title: 'ENTRY · Knowledge Layer · Crowned guide', note: 'Runs ONLY when compression fired — a learner who proved nothing skips this screen entirely, because “nothing was removed” is a non-event and would land as an extra screen on the longer path. The Learning Layer scores the entry check against module BO-2’s SME-signed objectives and compresses only the beats that check actually evidences (test-out): the tactics cluster (K3 the five Ds + K4 selecting one — they stand or fall together) and the intro clip, which shortens because its “how to respond” half is exactly what the item evidences. The barriers beat and the closing case are NOT compressible — nothing at entry probes them. Two questions buy two lessons, not four. The screen shows the learner ONLY what changed — fixed beats, the objective vocabulary and the audit chain are deliberately absent, because none of it answers a learner’s question. The audit chain still exists for administrators: objective → evidence → change, nothing silent. Locked items and the Perform stage are untouchable. Presenter control: Demo — flip entry result.' },
      coach: {},   // the crown is the orb alone — no narration on this step
      content: ADJUST_CONTENT, init: compressInit },

    { id: 'video', icon: 'fa-circle-play', mins: 2, stage: 'Learn', mode: 'floating', lesson: 'See It Happen', gate: true,
      caption: { title: 'LEARN · Gated video', note: 'The first Learn beat. On the compressed build CLARA frames it as the short cut; the clip must play and the learner answers CLARA’s check before Continue unlocks.' },
      coach: { say: 'Press play when you’re ready — I’ll have one quick question for you once it wraps.' },
      content: videoContent({ eyebrow: 'Watch: 2 minute video', heading: 'Introduction',
        sub: 'What harassment looks like, how to respond, and why this one matters. One question at the end.',
        src: '../../assets/videos/marshall-preroll.mp4' }),
      init: videoInit },

    // Not compressible: the entry check never probes WHY bystanders freeze, so
    // there's no evidence to test out of it. Runs on every path.
    { id: 'audio', icon: 'fa-book-open-reader', mins: 1, stage: 'Learn', mode: 'floating', lesson: 'Why Rooms Stay Quiet',
      caption: { title: 'LEARN · Know beat — a short read', note: 'A read-first Know beat (K2, diffusion of responsibility): the passage carries the objective, so it carries the type weight — no subtitle, lighter title, no panel around the text. Modality switching is still live, but as an option rather than a fork: one “Read to me” control narrates the same words with word-by-word highlighting, same objective, same credit. Ungated on purpose — a self-paced read has no completion event, so Continue is live and the learner sets the pace. NOT compressible: nothing at entry probes why bystanders freeze.' },
      coach: { say: 'Short one — read it at your own pace. If you’d rather hear it, tap “Read to me”.' },
      content: AUDIO_CONTENT, init: audioInit },

    { id: 'terms', icon: 'fa-list-check', mins: 1, stage: 'Learn', mode: 'floating', lesson: 'The Five Ds', gate: true,
      when: function () { return entryStrength() === 'full'; },
      caption: { title: 'LEARN · Know beat — Terms to Remember', note: 'The five Ds as flip cards (K3) — one of the two beats the entry check compresses away, paired with the tactic drill: they stand or fall together. Gate: every card flipped.' },
      coach: { say: 'Notice what separates them — distance, power, timing. That’s what decides which one you’d reach for.' },
      content: TERMS_CONTENT, init: termsInit },

    { id: 'drill', icon: 'fa-hand-pointer', mins: 2, stage: 'Learn', mode: 'floating', lesson: 'Pick Your Move', gate: true,
      when: function () { return entryStrength() === 'full'; },
      caption: { title: 'LEARN · Know beat — tactic drill', note: 'Four situations, five Ds (K4, select the tactic) — best answers plus accepted seconds with coaching notes. The other half of the compressible tactics cluster.' },
      coach: { say: 'You know the five moves — now pick the right one under real constraints.' },
      content: DRILL_CONTENT, init: drillInit },

    { id: 'norms', icon: 'fa-users', mins: 1, stage: 'Learn', mode: 'floating', lesson: 'Would They Back You?', gate: true,
      caption: { title: 'LEARN · Feel beat — Peer Results', note: 'The norms correction (F1, gap-fill content the base course never had): guess the crew’s reaction, then the real numbers land. Survives compression on every path — beliefs can’t be tested out of at entry.' },
      coach: { say: 'Loading…' },   // normsInit swaps in the question immediately
      content: NORMS_CONTENT, init: normsInit },

    // Feel · self-efficacy. Never compressible — a belief can't be quizzed out of.
    { id: 'efficacy', icon: 'fa-gauge-high', mins: 1, stage: 'Learn', mode: 'floating', lesson: 'Could You Pull It Off?', gate: true,
      caption: { title: 'LEARN · Feel beat — self-efficacy', note: 'Objective F4 (Feel / Can): believe you can intervene without escalating or damaging your standing. Gap-fill — the base course had no Feel objective for this outcome. The slider is the measurement and the reframe is the instruction; it reads back the norms figure the learner just saw, so the Feel beats compound rather than sitting side by side. Survives compression on every path.' },
      coach: { say: 'Loading…' },
      content: EFFICACY_CONTENT, init: efficacyInit },

    // Do · activate. The beat no question could stand in for.
    { id: 'activate', icon: 'fa-bolt', mins: 1, stage: 'Learn', mode: 'floating', lesson: 'Say It While It’s Open', gate: true,
      caption: { title: 'LEARN · Do beat — activate', note: 'Objective D1 (Do / Activate): recognize and act on the cue while the moment is still open. This is the deck’s “a question cannot credibly measure behavior” made literal — the scene runs in real time and the window closes on its own. Missing is a legitimate outcome and is NOT retried: the moment passing is the teaching, and it hands off to Delay. Gates on having taken the run, not on catching it. Survives compression on every path.' },
      coach: { say: 'Loading…' },
      content: ACTIVATE_CONTENT, init: activateInit },

    { id: 'stepin', icon: 'fa-comment-dots', mins: 2, stage: 'Learn', mode: 'floating', lesson: 'After the Moment', gate: true,
      caption: { title: 'LEARN · Do beat — Conversation Step-In', note: 'Rehearsal as instruction (D4): Priya texts after the incident and the learner takes the thread over. Weak replies get Priya’s real reaction and another try. This beat is what the mastery check’s sampled item then tests.' },
      coach: { say: 'Loading…' },   // stepinInit runs the thread immediately
      content: STEPIN_CONTENT, init: stepinInit },

    // Not compressible either — the closing case is the emotional anchor, and
    // nothing at entry evidences it. Runs on every path.
    { id: 'casevideo', icon: 'fa-scale-balanced', mins: 2, stage: 'Learn', mode: 'floating', lesson: 'A Real Case', gate: true,
      caption: { title: 'LEARN · Case beat', note: 'The real-case close, on every path — it’s the emotional anchor and nothing at entry evidences it. No question here; the mastery items live in the Check stage.' },
      coach: { say: 'One real case before the check — press play.' },
      content: videoContent({ eyebrow: 'Watch: 2 minute video', heading: 'A real case',
        sub: 'A real case that ended up in court, and what it cost.',
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
      coach: { eyebrow: 'Practice scenario', headline: '“The Marshall Scenario”', lede: true },   // lede text comes from the lens
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
  // "Section n of N" counts LEARNING OBJECTS, not screens. The title page is a
  // cover and the path adjustment is a system moment — neither is a section, so
  // neither is numbered and neither pads the denominator. Returns null for
  // those, which is the signal to hide the counter and bar entirely.
  function countedPath() {
    return visiblePath().filter(function (s) { return !s.cover && !s.interstitial; });
  }
  function sectionPos(step) {
    if (step.cover || step.interstitial) return null;
    var path = countedPath();
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
        (coach.lede ? '<p class="clara-lede">' + esc(coach.lede === true ? lens().lede : coach.lede) + '</p>' : '');
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
    // Crown: the orb sits ABOVE the content, centred, with one line under it.
    // For screens where CLARA has something short to say about what the page
    // is showing — she introduces it rather than sitting beside it.
    if (mode === 'crown') {
      // The orb alone — no name, no line. On a screen whose whole job is
      // showing what changed, the rows and the total say it; a coach
      // narrating the same thing above them was a second voice for one point.
      return '<div class="clara-slot"></div>';
    }
    if (mode === 'floating') {
      // Two states in one bubble. Compact is the tooltip it has always been —
      // CLARA says a line and that's that. "Reply" opens the same bubble into
      // a conversation: her line stays at the top, a thread grows under it and
      // a composer appears. Anything a step appends (answer chips, feedback)
      // orders ABOVE the chat block, so a question is never pushed below it.
      return '<div class="clara-bubble" id="claraBubble">' +
          '<span class="clara-name">CLARA</span>' +
          '<button class="clara-collapse" id="claraCollapse" type="button" aria-label="Close chat">' +
            '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
          '<div class="clara-say">' + (coach.say || '') + '</div>' +
          '<div class="clara-chat">' +
            '<div class="clara-echo" id="claraEcho"></div>' +
            '<div class="clara-composer">' +
              '<input id="claraAsk" type="text" placeholder="' + esc(coach.ask || 'Ask CLARA anything…') + '" aria-label="Ask CLARA">' +
              '<button class="clara-send" id="claraAskSend" type="button" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button>' +
            '</div>' +
          '</div>' +
          '<button class="clara-reply" id="claraReply" type="button" ' +
            'aria-label="Reply to CLARA" title="Reply to CLARA">' +
            '<i class="fa-solid fa-reply" aria-hidden="true"></i></button>' +
        '</div>' +
        '<div class="clara-slot"><span class="clara-hint" aria-hidden="true"></span></div>';
    }
    return slot;
  }

  // ==========================================================================
  //  Shell — built once; steps swap in place.
  // ==========================================================================
  var stage, orbEl, chrome, object, footer, nextBtn, backBtn, footCount, footBar, pop, infoBtn, skipBtn, branchBtn, lensBtn;
  // True only while a step's own init() is running. It's what separates CLARA's
  // opening line for a screen (narration — stays behind the orb) from a line
  // that lands later in response to the learner (a reaction — raises her).
  var inInit = false;

  // --- Where CLARA shows up ---------------------------------------------------
  // She does NOT arrive talking on every screen. A coach who speaks on all
  // fourteen sections stops being read, and most of these screens teach fine on
  // their own — a line restating the page is a second voice for one point. So
  // the default is TUCKED: the orb sits in its slot carrying the unread dot, and
  // her line for that screen waits one tap behind it.
  //
  // She surfaces on her own in exactly two cases:
  //
  //   1. She LEADS the screen — the page can't do its job without her. She's
  //      asking the question (checkInit, normsInit, stepinInit and practiceInit
  //      each open her at init), or she's explaining something written nowhere
  //      on the page (why this build is shorter than the full one). A step
  //      declares that by opening her itself, or by setting coach.lead; a step
  //      with no learning object of its own always counts, since she'd be the
  //      only thing on the screen.
  //   2. She REACTS — see setFloat/setCoachSay. That's why the flip cards, the
  //      tactic drill and the read need no wiring: their coach lines arrive
  //      after the screen has settled, so they raise her by themselves.
  function coachLeads(step) {
    if (step.mode !== 'floating') return true;    // sidebar/ambient/crown ARE her
    if (!step.content) return true;               // nothing else on screen to read
    return !!(step.coach && step.coach.lead);
  }

  // One door for the tuck state, so "she's been read" can't drift out of sync
  // with "she's open": opening her is what clears the unread dot.
  function setFloat(state) {
    if (!stage) return;
    stage.dataset.float = state;
    if (state === 'open') delete stage.dataset.unread;
  }
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

  // ---- Orb travel between steps -------------------------------------------
  // The orb used to GLIDE from its old slot to its new one. When two steps put
  // it in very different places — the bottom-right companion to the crown at
  // top-centre — that reads as a long diagonal slide across the page. It now
  // leaves and arrives IN PLACE instead: a small swell, out to nothing, then
  // back at the new spot with a slight overshoot. Same handoff, no travel.
  // (Repositioning WITHIN a step still glides — those are short moves, e.g.
  // the orb following its bubble as the bubble grows.)
  function orbLeave() {
    if (!orbEl) return;
    orbEl.classList.remove('is-orb-in');
    void orbEl.offsetWidth;                        // restart the animation
    orbEl.classList.add('is-orb-out');
  }
  function orbArrive() {
    if (!orbEl) return;
    orbEl.classList.remove('is-orb-out');
    void orbEl.offsetWidth;
    orbEl.classList.add('is-orb-in');
    // Drop the class once it lands so the orb goes back to its resting,
    // un-animated state (scale(1) either way — nothing moves). The timer is a
    // backstop, not the mechanism: the animation's fill holds the orb at
    // scale 0 until it plays, so anywhere it DOESN'T play — a paused
    // background tab, a browser that skips it — the orb would sit invisible.
    // Comfortably longer than the 460ms animation, so it never cuts one short.
    var done = function () {
      clearTimeout(orbInTimer);
      orbEl.classList.remove('is-orb-in');
      orbEl.removeEventListener('animationend', done);
    };
    orbEl.addEventListener('animationend', done);
    var orbInTimer = setTimeout(done, 700);
  }

  function makeCtx() {
    return {
      stage: stage, chrome: chrome, orb: orbEl,
      els: { next: nextBtn, back: backBtn,
        bubble: chrome ? chrome.querySelector('.clara-bubble') : null,
        coachSay: chrome ? chrome.querySelector('.clara-say') : null },
      enableNext: function () { nextBtn.disabled = false; },
      disableNext: function () { nextBtn.disabled = true; },
      setCoachSay: function (html) {
        var s = chrome.querySelector('.clara-say'); if (s) s.innerHTML = html;
        // A line that lands after the screen has settled is a reaction to
        // something the learner just did — the one thing that raises her
        // without being asked. Her opening line, set during init, does not.
        if (!inInit && stage.dataset.mode === 'floating') setFloat('open');
      },
      floatOpen: function () { setFloat('open'); },
      floatClose: function () { setFloat('closed'); },
      positionOrb: positionOrb, saveResult: saveResult, readCourse: readCourse
    };
  }

  function updateFrame(step) {
    var sec = sectionPos(step);
    if (frameLesson) frameLesson.textContent = step.lesson;
    if (frameStep) frameStep.textContent = sec ? 'Section ' + sec.n + ' of ' + sec.total : '';
    if (frameBar) frameBar.setAttribute('value', sec ? String(sec.n / sec.total) : '0');
  }

  // The demo control names the ARMED result rather than the action, so it says
  // the same thing on the entry check (where you set it) and on the adjustment
  // screen (where you see it). Clicking flips it.
  function labelBranchBtn() {
    if (!branchBtn) return;
    var armed = entryStrength() === 'compressed' ? 'can skip' : 'full build';
    branchBtn.innerHTML = '<i class="fa-solid fa-shuffle"></i> Demo: entry result — ' + armed;
  }

  function updateFooter(step) {
    // Section counter + progress live in the bottom bar (the unified flow zone
    // with Back/Continue). Course + lesson stay in the top band, so there's no
    // duplication. Numbering comes from the VISIBLE path — recomposition can
    // shrink the denominator mid-course, and that's deliberate.
    var pos = stepPos(step);
    var sec = sectionPos(step);
    // The title page is a cover: no back, no counter — just the course CTA.
    if (step.cover) {
      if (footCount) footCount.textContent = 'Course overview';
      if (footBar) footBar.style.display = 'none';
      backBtn.style.display = 'none';
    } else if (!sec) {
      // An interstitial isn't a section, so it gets no number and no bar —
      // claiming progress through a screen that teaches nothing would be a lie,
      // and a numbered gap either side of it reads as a bug.
      if (footCount) footCount.textContent = '';
      if (footBar) footBar.style.display = 'none';
      backBtn.style.display = '';
    } else {
      if (footCount) footCount.textContent = 'Section ' + sec.n + ' of ' + sec.total;
      if (footBar) { footBar.style.display = ''; footBar.setAttribute('value', String(sec.n / sec.total)); }
      backBtn.style.display = '';
    }
    if (skipBtn) skipBtn.style.display = step.gate ? 'inline-flex' : 'none';   // review-only, gated steps only
    if (branchBtn) {
      branchBtn.style.display = (step.id === 'compress' || step.id === 'baseline') ? 'inline-flex' : 'none';
      labelBranchBtn();
    }
    if (lensBtn) {
      lensBtn.style.display = LENSED_STEPS[step.id] ? 'inline-flex' : 'none';
      lensBtn.innerHTML = '<i class="fa-solid fa-layer-group"></i> Demo: context lens — ' + esc(lens().label);
    }
    backBtn.disabled = (pos.n <= 1);
    var isLast = (pos.n >= pos.total);
    nextBtn.innerHTML = (step.nextLabel || (isLast ? 'Finish' : 'Continue')) + ' <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.disabled = !!step.gate;                 // gated steps re-enable via ctx.enableNext()
    // Popover caption
    if (step.caption) {
      pop.querySelector('.ll-pop-eyebrow').innerHTML =
        // "screen" not "section": this counts every screen including the cover
        // and the interstitial, so it deliberately differs from the learner's
        // section count. Saying which is which stops that reading as a bug.
        '<i class="fa-solid fa-layer-group"></i> Coach presentation · screen ' + pos.n + ' / ' + pos.total;
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
      orbLeave();
    }

    setTimeout(function () {
      if (prevChrome) prevChrome.remove();
      if (prevObject) prevObject.remove();

      stage.dataset.mode = step.mode;
      if (step.mode === 'floating') {
        var leads = coachLeads(step);
        setFloat(leads ? 'open' : 'closed');
        // A queued line she hasn't shown yet is the only thing the dot means.
        if (!leads && (step.coach || {}).say) stage.dataset.unread = 'true';
      }

      // Learning-object content — append FIRST so the coach chrome sits ON TOP
      // for hit-testing. Otherwise the full-bleed (inset:0) .ll-object, though
      // transparent, intercepts mouse clicks on CLARA's chips/composer.
      object = null;
      if (step.content) {
        var holder = document.createElement('div');
        // A lensed beat supplies a FUNCTION so it re-renders against whichever
        // context lens is active; a fixed beat is still a plain string.
        holder.innerHTML = (typeof step.content === 'function') ? step.content() : step.content;
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
      positionOrb(false);                           // land in the new slot, no travel
      if (!first) orbArrive();
      updateFooter(step); updateFrame(step);

      var ctx = makeCtx();
      // Every floating step gets the Reply affordance, before its own init
      // runs — the companion should be a way in to CLARA on every page she's
      // on, not a line you can only read. Steps can supply their own answers
      // via coach.replies.
      if (step.mode === 'floating') wireFloatingChat(ctx, (step.coach || {}).replies);
      if (step.init) {
        inInit = true;
        try { step.init(ctx); } catch (e) { console.error('step init', step.id, e); }
        inInit = false;
      }

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
      setFloat(stage.dataset.float === 'closed' ? 'open' : 'closed');
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

    // Review-only "Demo: context lens" — capability 2 made clickable. Swaps
    // the working environment and replays the current step: same objectives,
    // same beats, same assessment, different scene. Shown on every lensed
    // step so a reviewer can flip it wherever they happen to be standing.
    if (actions && !document.getElementById('llLensBtn')) {
      lensBtn = document.createElement('button');
      lensBtn.id = 'llLensBtn';
      lensBtn.type = 'button';
      lensBtn.title = 'Demo: re-render this module through a different context lens. ' +
        'The objectives and the structure are identical — only the context-sensitive content moves.';
      lensBtn.style.display = 'none';
      lensBtn.addEventListener('click', function () {
        if (busy) return;
        var i = LENS_ORDER.indexOf(lensId());
        var next = LENS_ORDER[(i + 1) % LENS_ORDER.length];
        try { sessionStorage.setItem('ll-lens', next); } catch (e) {}
        showStep(idx, 'fwd', false);              // replay this beat in the new lens
      });
      actions.appendChild(lensBtn);
    }

    // Review-only "Demo: flip outcome" — the presenter override for the path
    // adjustment. Flips the recomposition branch (struggled ↔ excelled) and
    // replays the adjust step so a reviewer can see both recompositions without
    // replaying the scenario. Shown only on the adjust step (see updateFooter).
    if (actions && !document.getElementById('llBranchBtn')) {
      branchBtn = document.createElement('button');
      branchBtn.id = 'llBranchBtn';
      branchBtn.type = 'button';
      branchBtn.title = 'Demo: force the entry result (can skip ↔ full build). ' +
        'On the full build there is nothing to report, so the adjustment screen doesn’t run at all.';
      branchBtn.style.display = 'none';
      branchBtn.addEventListener('click', function () {
        if (busy) return;
        var step = STEPS[idx];
        var next = entryStrength() === 'compressed' ? 'full' : 'compressed';
        try { sessionStorage.setItem('ll-entry', next); } catch (e) {}
        if (readCourse().baseline) saveResult('entry', { strength: next, up: testUp() });

        if (step && step.id === 'compress') {
          // This screen only exists when something compressed, so flipping to
          // the full build deletes it out from under us — advancing IS the
          // demonstration. Flipping the other way replays it.
          if (next === 'full') { go(1); return; }
          showStep(idx, 'fwd', false);
          return;
        }
        // On the entry check: just re-arm and relabel. Replaying would wipe
        // the learner's answers and re-gate Continue for no reason — the
        // effect shows on the next Continue either way. The counters move
        // now, though: the denominator is a different number on each branch.
        var wasOpen = !nextBtn.disabled;
        updateFooter(step); updateFrame(step);
        if (wasOpen) nextBtn.disabled = false;
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
