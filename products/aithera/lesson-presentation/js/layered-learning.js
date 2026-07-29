/* ============================================================================
   layered-learning.js — the shared CLARA engine (see css/layered-learning.css).

   Each "Layered Learning" page is a thin file that:
     1. declares one presentation via window.LAYERED, and
     2. drops its learning-object markup inside <div class="ll-stage" data-mode>.

   This engine supplies everything else — the persistent CLARA orb, the coach
   "chrome" for the declared mode, the bottom course-navigation, the design
   caption, and the exit→enter choreography that carries CLARA between pages.

   Per-page config:
     window.LAYERED = {
       mode:   'ambient' | 'sidebar' | 'floating' | 'overlay',
       index:  1, total: 4,             // position in the flow (drives progress)
       prev:   'layered-ambient.html',  // or null on the first page
       next:   'layered-sidebar.html',  // or null on the last page (→ Finish)
       course: 'Difficult Conversations at Work',
       lesson: 'Getting Started',
       caption:{ title: 'Ambient presence', note: 'One line for reviewers.' },
       coach:  {                        // CLARA's words on this page
         eyebrow, headline, lede,       // ambient
         say,                           // sidebar / floating / overlay message (HTML ok)
         ask,                           // sidebar composer placeholder
         placeholder, chips:[…], reply, // overlay composer
       },
     };

   Include AFTER window.LAYERED and BEFORE js/frame.js — this file seeds
   window.LESSON_FRAME (course / lesson / step / progress) so the production
   frame renders with the right labels.
   ========================================================================== */
(function () {
  'use strict';

  var cfg = window.LAYERED || {};
  var coach = cfg.coach || {};
  var index = cfg.index || 1;
  var total = cfg.total || 1;

  // --- Seed the production course-frame (frame.js reads this at build) ------
  if (!window.LESSON_FRAME) {
    window.LESSON_FRAME = {
      course:   cfg.course || 'Lesson',
      lesson:   cfg.lesson || document.title,
      step:     'Step ' + index + ' of ' + total,
      progress: index / total
    };
  }

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function T(ms) { return RM ? 0 : ms; }        // collapse timings when motion is reduced
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Refs filled during build()
  var stage, orb, chrome, object, footer;

  // ------------------------------------------------------------------------
  // Coach chrome — one builder per presentation. Returns the inner HTML for a
  // .clara-chrome--<mode> element (always includes the .clara-slot the orb
  // docks onto).
  // ------------------------------------------------------------------------
  var SLOT = '<div class="clara-slot"' +
             (cfg.mode === 'ambient' ? '><div class="clara-aura"></div></div>' : '></div>');

  function chromeHTML(mode) {
    if (mode === 'ambient') {
      return SLOT +
        (coach.eyebrow  ? '<div class="clara-eyebrow">' + esc(coach.eyebrow) + '</div>' : '') +
        '<h1>' + esc(coach.headline || "Hi, I'm CLARA.") + '</h1>' +
        (coach.lede ? '<p class="clara-lede">' + coach.lede + '</p>' : '');
    }
    if (mode === 'sidebar') {
      return SLOT +
        '<div class="clara-name">' + esc(cfg.name || 'CLARA') + '</div>' +
        '<div class="clara-say">' + (coach.say || '') + '</div>' +
        '<div class="clara-ask"><i class="fa-solid fa-microphone-lines"></i>' +
          '<span>' + esc(coach.ask || 'Ask CLARA anything…') + '</span></div>';
    }
    if (mode === 'floating') {
      return '<div class="clara-bubble">' +
          '<span class="clara-name">' + esc(cfg.name || 'CLARA') + '</span>' +
          '<div class="clara-say">' + (coach.say || '') + '</div>' +
        '</div>' +
        '<div class="clara-slot"><span class="clara-hint" aria-hidden="true"></span></div>';
    }
    if (mode === 'overlay') {
      var chips = (coach.chips || []).map(function (c) {
        return '<button class="clara-chip" type="button" data-fill="' + esc(c) + '">' + esc(c) + '</button>';
      }).join('');
      return SLOT +
        '<div class="clara-overlay-body">' +
          '<span class="clara-name">' + esc(cfg.name || 'CLARA') + '</span>' +
          '<div class="clara-say">' + (coach.say || '') + '</div>' +
          '<div class="clara-echo" id="claraEcho"></div>' +
          (chips ? '<div class="clara-chips">' + chips + '</div>' : '') +
          '<div class="clara-composer">' +
            '<input id="claraInput" type="text" ' +
              'placeholder="' + esc(coach.placeholder || 'Type your response…') + '" ' +
              'aria-label="Your response to CLARA">' +
            '<button class="clara-send" id="claraSend" type="button" aria-label="Send">' +
              '<i class="fa-solid fa-paper-plane"></i></button>' +
          '</div>' +
        '</div>';
    }
    return SLOT;
  }

  // ------------------------------------------------------------------------
  // Orb positioning — park the (fixed) orb exactly over the active slot so it
  // reads as part of whatever chrome is on screen. `glide` toggles the smooth
  // transition (off for resize snaps, on when the overlay card grows).
  // ------------------------------------------------------------------------
  function positionOrb(glide) {
    var slot = chrome.querySelector('.clara-slot');
    if (!slot) return;
    var r = slot.getBoundingClientRect();
    if (!glide) { orb.style.transition = 'none'; }
    orb.style.left   = r.left + 'px';
    orb.style.top    = r.top  + 'px';
    orb.style.width  = r.width + 'px';
    orb.style.height = r.height + 'px';
    orb.style.setProperty('--orb-size', r.width + 'px');
    if (!glide) { requestAnimationFrame(function () { orb.style.transition = ''; }); }
  }

  // ------------------------------------------------------------------------
  // Enter (page load) and Leave (Continue / Back).
  // ------------------------------------------------------------------------
  var entered = false;
  function finishEnter() {                       // land in the final state (no stagger)
    if (entered) return;
    entered = true;
    orb.classList.remove('pre-enter');
    if (object) object.classList.remove('pre-enter');
    if (chrome) chrome.classList.remove('pre-enter');
    positionOrb(false);
  }

  function playEnter() {
    orb.classList.add('pre-enter');
    if (chrome) chrome.classList.add('pre-enter');
    if (object) object.classList.add('pre-enter');
    positionOrb(false);                          // place, then bloom from the drift offset
    if (RM) { finishEnter(); return; }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        orb.classList.remove('pre-enter');
        if (object) object.classList.remove('pre-enter');
        // chrome blooms a beat after the orb has arrived
        setTimeout(function () { if (chrome) chrome.classList.remove('pre-enter'); entered = true; }, T(190));
      });
    });

    // Safety net: if the tab is backgrounded at load, rAF/timers are paused and
    // the orb would stay hidden. Force the final state on a fallback timer and
    // the moment the page becomes visible again.
    setTimeout(finishEnter, 900);
    document.addEventListener('visibilitychange', function onVis() {
      if (document.visibilityState === 'visible') {
        finishEnter();
        document.removeEventListener('visibilitychange', onVis);
      }
    });
  }

  function playLeave(done) {
    if (chrome) chrome.classList.add('leaving');   // chrome collapses first…
    if (object) object.classList.add('leaving');
    setTimeout(function () { orb.classList.add('leaving'); }, T(150));  // …orb drifts out after
    setTimeout(done, T(640));
  }

  var navigating = false;
  function go(href, dir) {
    if (navigating || !href) return;
    navigating = true;
    // Hand the travel direction to the next file so its orb enters from the
    // matching side, and set this page's exit offset to match.
    document.body.style.setProperty('--in-x',  dir === 'back' ? '64px'  : '-64px');
    document.body.style.setProperty('--out-x', dir === 'back' ? '-64px' : '64px');
    try { sessionStorage.setItem('ll-dir', dir); } catch (e) {}
    playLeave(function () { location.href = href; });
  }

  // ------------------------------------------------------------------------
  // Overlay composer — a lightweight, canned back-and-forth so the coaching
  // presentation feels alive (no real AI; this is a flow scaffold).
  // ------------------------------------------------------------------------
  function wireComposer() {
    var input = chrome.querySelector('#claraInput');
    var send  = chrome.querySelector('#claraSend');
    var echo  = chrome.querySelector('#claraEcho');
    if (!input || !send || !echo) return;

    function row(kind, who, text) {
      var d = document.createElement('div');
      d.className = 'row ' + kind;
      d.innerHTML = '<span class="who">' + esc(who) + '</span>' + esc(text);
      echo.appendChild(d);
      positionOrb(true);                         // card grew upward — let the orb follow
    }
    var replied = false;
    function submit() {
      var v = input.value.trim();
      if (!v) return;
      row('you', 'You', v);
      input.value = '';
      if (!replied) {                            // one canned coach reaction is enough to show the pattern
        replied = true;
        setTimeout(function () {
          row('clara', cfg.name || 'CLARA',
              coach.reply || "Good — you led with what you understood before defending yourself. Keep going.");
        }, T(560));
      }
    }
    send.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    chrome.querySelectorAll('.clara-chip').forEach(function (chip) {
      chip.addEventListener('click', function () { input.value = chip.dataset.fill; input.focus(); });
    });
  }

  // ------------------------------------------------------------------------
  // Build everything, then play the entrance.
  // ------------------------------------------------------------------------
  function build() {
    stage = document.querySelector('.ll-stage');
    if (!stage) return;
    stage.dataset.mode = cfg.mode;
    object = stage.querySelector('.ll-object');
    if (cfg.mode === 'floating') stage.dataset.float = 'open';   // companion starts open

    // Coach chrome for this mode.
    chrome = document.createElement('div');
    chrome.className = 'clara-chrome clara-chrome--' + cfg.mode;
    chrome.innerHTML = chromeHTML(cfg.mode);
    stage.appendChild(chrome);

    // The persistent orb (a body-level fixed element so it floats over the
    // stage). The reusable Möbius component mounts a transparent canvas inside.
    orb = document.createElement('div');
    orb.className = 'clara-orb';
    orb.id = 'claraOrb';
    orb.setAttribute('role', 'img');
    orb.setAttribute('aria-label', (cfg.name || 'CLARA') + ', your AI coach');
    document.body.appendChild(orb);
    if (window.MobiusOrb) window.MobiusOrb.create(orb);

    // In floating mode the orb is the launcher — click to tuck/expand the bubble.
    orb.addEventListener('click', function () {
      if (cfg.mode !== 'floating' || navigating) return;
      stage.dataset.float = (stage.dataset.float === 'closed') ? 'open' : 'closed';
    });

    // Course-navigation footer.
    footer = document.createElement('footer');
    footer.className = 'll-footer';
    var nextHref  = cfg.next || 'index.html';
    var nextLabel = cfg.continueLabel || (cfg.next ? 'Continue' : 'Finish');
    footer.innerHTML =
      '<div class="ll-footer-meta">' +
        '<span class="ll-foot-course">' + esc(cfg.course || '') + '</span>' +
        '<span class="ll-foot-step">' + esc(cfg.lesson || '') + (cfg.lesson ? ' · ' : '') +
          'Step ' + index + ' of ' + total +
          (cfg.caption ? ' <button class="ll-info" id="llInfo" type="button" ' +
            'aria-haspopup="dialog" aria-expanded="false" aria-label="About this presentation">?</button>' : '') +
        '</span>' +
      '</div>' +
      '<div class="ll-nav">' +
        '<button class="ll-btn ll-btn--ghost" id="llBack"' + (cfg.prev ? '' : ' disabled') + '>' +
          '<i class="fa-solid fa-arrow-left"></i> Back</button>' +
        '<button class="ll-btn ll-btn--primary" id="llNext">' + esc(nextLabel) +
          ' <i class="fa-solid fa-arrow-right"></i></button>' +
      '</div>';
    document.body.appendChild(footer);

    footer.querySelector('#llBack').addEventListener('click', function () { go(cfg.prev, 'back'); });
    footer.querySelector('#llNext').addEventListener('click', function () { go(nextHref, 'fwd'); });

    if (cfg.mode === 'overlay') wireComposer();

    // "?" popover by the step indicator — carries the presentation label that
    // used to sit on the stage (a design-review aid, kept out of the way).
    if (cfg.caption) {
      var pop = document.createElement('div');
      pop.className = 'll-pop';
      pop.id = 'llPop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', 'About this presentation');
      pop.innerHTML =
        '<div class="ll-pop-eyebrow"><i class="fa-solid fa-layer-group"></i> Coach presentation · ' +
          index + ' / ' + total + '</div>' +
        '<div class="ll-pop-title">' + esc(cfg.caption.title) + '</div>' +
        (cfg.caption.note ? '<div class="ll-pop-note">' + esc(cfg.caption.note) + '</div>' : '');
      document.body.appendChild(pop);

      var infoBtn = footer.querySelector('#llInfo');
      var closePop = function () { pop.classList.remove('open'); infoBtn.setAttribute('aria-expanded', 'false'); };
      var openPop  = function () { pop.classList.add('open');  infoBtn.setAttribute('aria-expanded', 'true'); };
      infoBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        pop.classList.contains('open') ? closePop() : openPop();
      });
      document.addEventListener('click', function (e) {
        if (pop.classList.contains('open') && !pop.contains(e.target) && e.target !== infoBtn) closePop();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });
    }

    // Seed enter-drift direction from how we arrived (default forward).
    var dir = 'fwd';
    try { dir = sessionStorage.getItem('ll-dir') || 'fwd'; } catch (e) {}
    document.body.style.setProperty('--in-x',  dir === 'back' ? '64px'  : '-64px');
    document.body.style.setProperty('--out-x', dir === 'back' ? '-64px' : '64px');

    // Keep the orb glued to its slot as the viewport changes.
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { positionOrb(false); }, 80);
    });

    playEnter();
    // Re-park once late web-fonts/layout settle (avoids a first-paint mis-align).
    window.addEventListener('load', function () { setTimeout(function () { positionOrb(false); }, 60); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
