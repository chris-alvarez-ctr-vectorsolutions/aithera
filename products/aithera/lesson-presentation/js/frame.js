/* ============================================================================
   frame.js — builds the course-delivery frame (see css/frame.css).

   Zero-config rollout: include this after css/frame.css and it will read the
   experiment's existing <header class="lesson-header"> for the course / lesson
   / step / progress values, render the production-style chrome, and remove the
   old header so nothing double-stacks. To override any value, set:

       <script>
         window.LESSON_FRAME = {
           course:   'Supporting Recovery in the Workplace',
           lesson:   'A Quick Check-In',
           step:     'Step 2 of 6',      // pass '' to hide the step label
           progress: 0.333,              // 0–1, or null to hide the bar
         };
       </script>
       <script src="js/frame.js?v=1"></script>

   The experiment body and its .lesson-footer (Back/Next) are never touched.
   ========================================================================== */
(function () {
  'use strict';

  // --- Resolve config: window.LESSON_FRAME wins, else read old .lesson-header
  function readConfig() {
    var cfg = Object.assign({}, window.LESSON_FRAME || {});
    var oldHeader = document.querySelector('.lesson-header');

    if (oldHeader) {
      var course = oldHeader.querySelector('.crumb-course');
      var lesson = oldHeader.querySelector('.crumb-lesson');
      var step   = oldHeader.querySelector('.progress-label');
      var bar    = oldHeader.querySelector('vaadin-progress-bar');

      if (cfg.course   == null && course) cfg.course = course.textContent.trim();
      if (cfg.lesson   == null && lesson) cfg.lesson = lesson.textContent.trim();
      if (cfg.step     == null && step)   cfg.step   = step.textContent.trim();
      if (cfg.progress == null && bar)    cfg.progress = parseFloat(bar.getAttribute('value'));
    }

    // App-shell fallback: the live/sim experiments name themselves in
    // #scenarioName as "Course: Lesson" — split it so those pages adopt the
    // frame with no per-file labels (embed mode). By build time (DOMContentLoaded)
    // the app's JS has already set the runtime title on #scenarioName.
    if (cfg.course == null || cfg.lesson == null) {
      var scen = document.getElementById('scenarioName');
      if (scen) {
        var text = scen.textContent.trim();
        var i = text.indexOf(': ');
        if (i > -1) {
          if (cfg.course == null) cfg.course = text.slice(0, i).trim();
          if (cfg.lesson == null) cfg.lesson = text.slice(i + 2).trim();
        } else if (cfg.lesson == null) {
          cfg.lesson = text;   // no delimiter — whole thing is the lesson
        }
      }
    }

    // Sensible fallbacks so the frame never renders empty.
    if (cfg.lesson == null) cfg.lesson = document.title.replace(/\s*[—-].*$/, '').trim() || 'Lesson';
    return cfg;
  }

  // --- Production site-chrome values (from the real course player) ----------
  var SITE = {
    logo:     'https://a.trainingcdn.com/static/images/market_logos/MARKET-GUID-SAFESCHOOLS/TRAIN_long.png',
    language: 'English',
    initials: 'CA',
    coordinatorName:  'Iñtërnâtiônàlizætiøn Arnold',
    coordinatorPhone: '123-456-7890',
    uiVersion: 'Version 4',
    links: [
      { label: 'Troubleshooting Tips', icon: 'fa-circle-info',   href: '#', kind: 'troubleshoot' },
      { label: 'Sitemap',              icon: 'fa-sitemap',        href: '#' },
      { label: 'Terms of Use',         icon: 'fa-file-lines',     href: '#' },
      { label: 'Privacy Policy',       icon: 'fa-shield-halved',  href: '#', ext: true },
      { label: 'Contact',              icon: 'fa-address-book',   href: '#' },
    ],
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function buildProgress(cfg) {
    if (cfg.progress == null || isNaN(cfg.progress)) return '';
    var stepHtml = cfg.step
      ? '<span class="vt-step">' + esc(cfg.step) + '</span>'
      : '';
    return (
      '<div class="vt-progress">' +
        stepHtml +
        '<vaadin-progress-bar value="' + cfg.progress + '" ' +
          'aria-label="Lesson progress"></vaadin-progress-bar>' +
      '</div>'
    );
  }

  function buildSheet() {
    var links = SITE.links.map(function (l) {
      var ext  = l.ext ? '<span class="vt-ext"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>' : '';
      return (
        '<a class="vt-sheet-link" href="' + esc(l.href) + '"' +
          (l.kind === 'troubleshoot' ? ' data-vt-troubleshoot="1"' : '') +
          (l.ext ? ' target="_blank" rel="noopener"' : '') + '>' +
          '<i class="fa-solid ' + l.icon + ' fa-fw" aria-hidden="true"></i>' +
          '<span>' + esc(l.label) + '</span>' + ext +
        '</a>'
      );
    }).join('');

    return (
      '<div class="vt-sheet" id="vtSheet" role="menu" aria-label="Help and site links">' +
        '<div class="vt-sheet-section">' +
          '<p class="vt-sheet-eyebrow">Course Coordinator</p>' +
          '<div class="vt-sheet-coord">' +
            '<i class="fa-regular fa-address-card fa-fw" aria-hidden="true"></i>' +
            '<span>' +
              '<span class="vt-coord-name">' + esc(SITE.coordinatorName) + '</span><br>' +
              '<span class="vt-coord-phone">' + esc(SITE.coordinatorPhone) + '</span>' +
            '</span>' +
          '</div>' +
        '</div>' +
        '<hr class="vt-sheet-divider">' +
        links +
        '<hr class="vt-sheet-divider">' +
        '<div class="vt-sheet-link" style="cursor:default">' +
          '<i class="fa-solid fa-code-branch fa-fw" aria-hidden="true"></i>' +
          '<span>UI ' + esc(SITE.uiVersion) + '</span>' +
          '<span class="vt-sheet-uiver">© 2026 Vector Solutions</span>' +
        '</div>' +
      '</div>'
    );
  }

  function build() {
    var cfg = readConfig();

    var frame = document.createElement('div');
    frame.className = 'vt-frame';
    frame.innerHTML =
      // ---- white function-bar --------------------------------------------
      '<div class="vt-bar">' +
        '<a class="vt-logo" href="#" title="Home">' +
          '<img src="' + SITE.logo + '" alt="Vector Solutions">' +
        '</a>' +
        '<div class="vt-bar-spacer"></div>' +
        '<div class="vt-bar-actions">' +
          '<button class="vt-lang" type="button" id="vtLang">' +
            '<i class="fa-solid fa-globe vt-globe" aria-hidden="true"></i>' +
            '<span class="vt-lang-label">' + esc(SITE.language) + '</span>' +
            '<i class="fa-solid fa-chevron-down vt-caret" aria-hidden="true"></i>' +
          '</button>' +
          '<span class="vt-avatar" aria-hidden="true">' + esc(SITE.initials) + '</span>' +
          '<button class="vt-menu-btn" type="button" id="vtMenuBtn" ' +
            'aria-haspopup="true" aria-expanded="false" aria-controls="vtSheet" ' +
            'aria-label="Help and site links">' +
            '<i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i>' +
          '</button>' +
        '</div>' +
      '</div>' +
      // ---- blue course-title band ----------------------------------------
      '<div class="vt-band">' +
        '<button class="vt-back" type="button" id="vtBack" ' +
          'aria-label="Back to table of contents">' +
          '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i>' +
        '</button>' +
        '<div class="vt-title">' +
          (cfg.course ? '<div class="vt-course">' + esc(cfg.course) + '</div>' : '') +
          '<h1 class="vt-lesson">' + esc(cfg.lesson) + '</h1>' +
        '</div>' +
        buildProgress(cfg) +
        // Actions slot: pages relocate an existing app control here (see README).
        '<div class="vt-actions" id="vtActions"></div>' +
      '</div>' +
      buildSheet();

    // Mount: default = fixed overlay on <body>; embed = first flex child of a
    // full-viewport app shell (window.LESSON_FRAME.mount), so it flows in the
    // app's column instead of overlaying its fixed panels.
    var mount = cfg.mount
      ? (typeof cfg.mount === 'string' ? document.querySelector(cfg.mount) : cfg.mount)
      : null;
    if (mount) {
      frame.classList.add('vt-embed');
      mount.insertBefore(frame, mount.firstChild);
    } else {
      document.body.insertBefore(frame, document.body.firstChild);
    }

    // Remove the old header now that the band carries its content.
    var oldHeader = document.querySelector('.lesson-header');
    if (oldHeader) oldHeader.remove();

    wire(frame);
  }

  function wire(frame) {
    var menuBtn = frame.querySelector('#vtMenuBtn');
    var sheet   = frame.querySelector('#vtSheet');

    function closeSheet() {
      sheet.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    function openSheet() {
      sheet.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
    }

    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      sheet.classList.contains('open') ? closeSheet() : openSheet();
    });
    // Click-away + Escape to dismiss.
    document.addEventListener('click', function (e) {
      if (sheet.classList.contains('open') && !sheet.contains(e.target)) closeSheet();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSheet();
    });

    // Prototype-only affordances.
    frame.querySelector('#vtBack').addEventListener('click', function () {
      console.log('Frame: back');
    });
    frame.querySelector('#vtLang').addEventListener('click', function () {
      console.log('Frame: language selector');
    });
    var trouble = sheet.querySelector('[data-vt-troubleshoot]');
    if (trouble) {
      trouble.addEventListener('click', function (e) {
        e.preventDefault();
        closeSheet();
        if (window.Lesson && Lesson.modal) {
          Lesson.modal.open({
            title: 'Troubleshooting Tips',
            icon: 'fa-circle-info',
            body:
              'If the course isn’t loading:\n\n' +
              '• Use a recent version of Chrome, Firefox, Edge, or Safari.\n' +
              '• Clear your browser cache, then restart the browser.\n' +
              '• Disable pop-up blockers / extensions, or try an incognito window.\n\n' +
              'Still stuck? Contact your Course Coordinator, listed in this menu.',
            cta: 'Got it',
          });
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
