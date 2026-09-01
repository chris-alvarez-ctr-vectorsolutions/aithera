/* ============================================================================
   layered-engine.js — the course SHELL, with no course in it.

   Everything here is true of any Layered Learning course: the production frame,
   the dark stage, the nav footer, CLARA's Möbius orb and her four presentation
   chromes, the step runner, dynamic section numbering, context lenses, and the
   canned chat. None of it knows what is being taught.

   A course is a CONTENT file that calls Layered.register({ … }) with its steps,
   its lens set and its copy. Load this file FIRST so the content file can use
   the helpers below at parse time; the engine boots itself on DOMContentLoaded,
   by which point the content has registered.

       <script src="../js/layered-engine.js?v=1"></script>
       <script src="../js/layered-course.js?v=1"></script>   <- Marshall
                                                                 …or any other

   The orb is the through-line: ONE element for the whole session that never
   restarts its WebGL animation. Between steps it bounces out where it stands
   and back in at its new slot rather than sliding across the page.

   Config accepted by register():
     course        string   — course title for the frame
     steps         array    — the step manifest (see any content file)
     storageKey    string   — sessionStorage key for the run record
     lenses        object   — id → lens data (optional)
     lensOrder     array    — cycle order for the lens control
     lensedSteps   object   — step id → truthy, where the lens control shows
     replies       array    — default canned chat replies for the floating bubble
     demoControls  array    — presenter buttons: { id, title, visibleOn(step),
                              label(), onClick({ step, idx, refresh, go, replay }) }
     backHref      string   — where the frame's back arrow points
   ========================================================================== */
(function () {
  'use strict';

  // Filled by register(); every engine function reads the course through this.
  var CFG = {
    course: '', steps: [], storageKey: 'll-course',
    lenses: null, lensOrder: [], lensedSteps: {}, replies: null,
    demoControls: [], backHref: '../index.html'
  };
  var STEPS = [];

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
  // --- Context lenses -------------------------------------------------------
  // Capability 2 of the four: the same objectives rendered into a different
  // working environment. The engine only knows how to hold and cycle one; what
  // a lens actually swaps is entirely the content file's business.
  function lensId() {
    if (!CFG.lenses) return null;
    try { var o = sessionStorage.getItem('ll-lens'); if (CFG.lenses[o]) return o; } catch (e) {}
    return CFG.lensOrder[0];
  }
  function lens() { return CFG.lenses ? CFG.lenses[lensId()] : null; }
  function cycleLens() {
    var i = CFG.lensOrder.indexOf(lensId());
    var next = CFG.lensOrder[(i + 1) % CFG.lensOrder.length];
    try { sessionStorage.setItem('ll-lens', next); } catch (e) {}
    return next;
  }
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
    wireChat(ctx, replies || CFG.replies || CLARA_REPLIES);
  }


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
  var stage, orbEl, chrome, object, footer, nextBtn, backBtn, footCount, footBar, pop, infoBtn, skipBtn, lensBtn;
  var demoBtns = [];
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
    demoBtns.forEach(function (d) {
      var on = !d.spec.visibleOn || d.spec.visibleOn(step);
      d.el.style.display = on ? 'inline-flex' : 'none';
      if (on && d.spec.label) d.el.innerHTML = d.spec.label();
    });
    if (lensBtn) {
      lensBtn.style.display = CFG.lensedSteps[step.id] ? 'inline-flex' : 'none';
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

    // An external step — one that lives on its own page — hands off with a
    // cross-document View Transition rather than a swap.
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
        // Skip the whole learning object → advance. WHAT that writes to the
        // record is the step's own business, so the step declares it.
        if (step && typeof step.onSkip === 'function') { try { step.onSkip(); } catch (e) { console.error('onSkip', step.id, e); } }
        go(1);
      });
      actions.appendChild(skipBtn);
    }

    // Review-only "Demo: context lens" — capability 2 made clickable. Swaps
    // the working environment and replays the current step: same objectives,
    // same beats, same assessment, different scene. Shown on every lensed
    // step so a reviewer can flip it wherever they happen to be standing.
    if (actions && CFG.lenses && !document.getElementById('llLensBtn')) {
      lensBtn = document.createElement('button');
      lensBtn.id = 'llLensBtn';
      lensBtn.type = 'button';
      lensBtn.title = 'Demo: re-render this module through a different context lens. ' +
        'The objectives and the structure are identical — only the context-sensitive content moves.';
      lensBtn.style.display = 'none';
      lensBtn.addEventListener('click', function () {
        if (busy) return;
        cycleLens();
        showStep(idx, 'fwd', false);              // replay this beat in the new lens
      });
      actions.appendChild(lensBtn);
    }

    // Review-only presenter controls DECLARED BY THE COURSE. The engine owns
    // the button and when it shows; what it means is content. Each entry is
    // { id, title, visibleOn(step), label(), onClick(api) }.
    CFG.demoControls.forEach(function (spec) {
      if (!actions || document.getElementById(spec.id)) return;
      var btn = document.createElement('button');
      btn.id = spec.id;
      btn.type = 'button';
      if (spec.title) btn.title = spec.title;
      btn.style.display = 'none';
      btn.addEventListener('click', function () {
        if (busy) return;
        spec.onClick({
          step: STEPS[idx],
          // Re-render the current step in place — for a control whose effect
          // is visible on the screen you are already looking at.
          replay: function () { showStep(idx, 'fwd', false); },
          // Move on — for a control whose effect REMOVES the current step.
          go: go,
          // Update the counters without disturbing an already-open gate.
          refresh: function () {
            var st = STEPS[idx];
            var wasOpen = !nextBtn.disabled;
            updateFooter(st); updateFrame(st);
            if (wasOpen) nextBtn.disabled = false;
          }
        });
      });
      actions.appendChild(btn);
      demoBtns.push({ spec: spec, el: btn });
    });
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

  // ==========================================================================
  //  Public surface. A content file uses the helpers at parse time and calls
  //  register() once at the end; the engine boots itself after the DOM is up,
  //  by which point every content file on the page has registered.
  // ==========================================================================
  var booted = false;
  function boot() { if (booted) return; booted = true; build(); }

  window.Layered = {
    // Helpers content files build their markup and beats with.
    T: T, esc: esc, readCourse: readCourse, saveResult: saveResult,
    pickGroup: pickGroup, wireChat: wireChat, typeFeedback: typeFeedback,
    lens: lens, lensId: lensId, cycleLens: cycleLens,
    // The engine's own nav, for content that changes the path mid-step and
    // needs the counters to catch up (compression, inserted remediation).
    refreshNav: function () { var st = STEPS[idx]; if (st) { updateFooter(st); updateFrame(st); } },
    // The path a learner will ACTUALLY walk, after when() has had its say —
    // a syllabus or a progress rail has to render from this, not from steps.
    visiblePath: visiblePath,
    sectionPos: sectionPos,
    stepById: function (id) {
      for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return STEPS[i];
      return null;
    },
    register: function (cfg) {
      Object.keys(cfg || {}).forEach(function (k) { CFG[k] = cfg[k]; });
      STEPS = CFG.steps || [];
      if (!CFG.lensOrder.length && CFG.lenses) CFG.lensOrder = Object.keys(CFG.lenses);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 0);   // let a same-tick register() land first
})();
