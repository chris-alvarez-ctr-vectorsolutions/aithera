/* =============================================================================
   TargetSolutions Mobile App (v2) — prototype behavior
   =============================================================================
   Vanilla JS, no build step. Everything a designer is likely to want to change
   lives in the DATA block at the top; the rendering and navigation below it
   rarely needs touching.
   ========================================================================== */
(function () {
  'use strict';

  /* ===========================================================================
     DATA — edit these to change the prototype's content
     ======================================================================== */

  /* The four Quick Link launch behaviors the PRD defines. Rather than build all
     four workflows in a rough prototype, every tile opens a sheet naming which
     behavior it would trigger. */
  var LAUNCH = {
    rca:        { title: 'Record Completions',
                  body: 'This is an RCA-targeted Quick Link. It would open Record Completions in the app with “{name}” already selected, skipping activity search.' },
    selfAssign: { title: 'Self Assign',
                  body: 'This is a Self Assign Quick Link. It would open the Self Assign workflow for “{name}” in the app — falling back to the mobile browser, already signed in, if an in-app launch is not possible.' },
    file:       { title: 'File Center',
                  body: 'This is a File Center Quick Link. It would open “{name}” in the app, or hand off to the mobile browser depending on the file type.' },
    url:        { title: 'External Link',
                  body: '“{name}” is an external URL. It would open in your default mobile browser with no authentication required.' }
  };

  /* Quick Links: ONE customer-named card, holding customer-named group
     sub-headers, each with its own ordered tiles. Tile color is admin-chosen,
     so `ink` sets label/icon contrast per tile ('light' = white on a saturated
     fill, 'dark' = navy on a pale fill). */
  var QUICK_LINKS = {
    title: 'Quick Links',
    groups: [
      { title: 'Station-based Trainings', tiles: [
        { name: 'EMT Basics',              color: '#F2B72A', ink: 'dark',  icon: 'fa-kit-medical',        launch: 'rca' },
        { name: 'Extinguisher Training',   color: '#C62E5B', ink: 'light', icon: 'fa-fire-extinguisher',  launch: 'rca' },
        { name: 'Fire Basics',             color: '#E8402A', ink: 'light', icon: 'fa-fire',               launch: 'rca' },
        { name: 'Firewalls',               color: '#6B2C91', ink: 'light', icon: 'fa-fire-flame-curved',  launch: 'rca' },
        { name: 'Hydrant Training',        color: '#2F3A9E', ink: 'light', icon: 'fa-fire-hydrant',       launch: 'rca' },
        { name: 'Sprinkler System Basics', color: '#1668D6', ink: 'light', icon: 'fa-sprinkler-ceiling',  launch: 'rca' },
        { name: 'Vehicle Stabilization',   color: '#0F7B9C', ink: 'light', icon: 'fa-car-burst',          launch: 'rca' },
        { name: 'SCBA Refresher',          color: '#C3D934', ink: 'dark',  icon: 'fa-helmet-safety',      launch: 'selfAssign' }
      ]},
      { title: 'Field-based Trainings', tiles: [
        { name: 'Facilities Training',     color: '#C5DDF5', ink: 'dark',  icon: 'fa-building',           launch: 'rca' },
        { name: 'Harbor Familiar\u00ADization', /* soft hyphen: breaks cleanly in a narrow tile */ color: '#CBD5F5', ink: 'dark',  icon: 'fa-ship',               launch: 'rca' },
        { name: 'Ladder Training',         color: '#DCCFF0', ink: 'dark',  icon: 'fa-truck-ladder',       launch: 'rca' },
        { name: 'Offshore Basics',         color: '#F7D3DE', ink: 'dark',  icon: 'fa-life-ring',          launch: 'rca' },
        { name: 'Sprinkler Systems',       color: '#FBE0C6', ink: 'dark',  icon: 'fa-sprinkler-ceiling',  launch: 'rca' },
        { name: 'Dumpster Fires',          color: '#FBD3B4', ink: 'dark',  icon: 'fa-dumpster-fire',      launch: 'rca' },
        { name: 'Wildland Policy',         color: '#FBEFC0', ink: 'dark',  icon: 'fa-file-pdf',           launch: 'file' },
        { name: 'State Training Portal',   color: '#D3EBD0', ink: 'dark',  icon: 'fa-graduation-cap',     launch: 'url' }
      ]}
    ]
  };

  /* "More" tab. Only built features are listed — the below-the-line PRD
     features are deliberately absent rather than shown as "coming soon". */
  var MORE_PRIMARY = [
    { icon: 'fa-arrow-up-right-from-square', title: 'Open Web Platform',
      sub: 'Full TargetSolutions in your browser',
      sheet: { title: 'Web Browser Shortcut',
               body: 'This launches the full TargetSolutions web platform in your default mobile browser, landing on your Home page in this same account. Your app session carries over — no second login.' } }
  ];

  /* Example notifications the app might surface. Read-only by design — there is
     no in-app editing of notification preferences in this release; alerts stay
     configured in the web platform. Types are limited to what the PRD scopes:
     assignments, credentials, events and messages. */
  var NOTIFICATION_FEED = [
    { type: 'Overdue',    icon: 'fa-triangle-exclamation', fg: '#ca150c', bg: '#fdeaea', unread: true,  time: '2h',
      title: 'Bloodborne Pathogens is overdue',
      body:  'Was due Mar 22 · assigned by Training Division.' },
    { type: 'Credential', icon: 'fa-id-badge',             fg: '#995211', bg: '#fdf1dc', unread: true,  time: '5h',
      title: 'EMT-B expires in 30 days',
      body:  'Renew before Oct 10 to stay compliant.' },
    { type: 'Message',    icon: 'fa-envelope-open-text',   fg: '#0a7637', bg: '#e3f3e9', unread: true,  time: 'Yesterday',
      title: 'New message from BC Ruiz',
      body:  'Re: Ladder 12 drill schedule for next shift.' },
    { type: 'Event',      icon: 'fa-calendar-days',        fg: '#4a3fb5', bg: '#e9e7fa', unread: false, time: 'Tue',
      title: 'Live Fire Training starts in 2 days',
      body:  'Fri, Sep 12 · 08:00 · Training Grounds.' },
    { type: 'Assignment', icon: 'fa-list-check',           fg: '#0b5fbf', bg: '#eaf2fc', unread: false, time: 'Tue',
      title: 'Wildland Refresher is now available',
      body:  'Due in 30 days.' },
    { type: 'Assignment', icon: 'fa-list-check',           fg: '#0b5fbf', bg: '#eaf2fc', unread: false, time: 'Sep 3',
      title: 'Hazmat Awareness is due in 1 week',
      body:  'Due Sep 17.' }
  ];

  /* Screen metadata — drives the header and which tab reads as active. */
  var SCREENS = {
    /* Home draws the brand bar INSIDE its scroll content (see index.html), so it
       scrolls away like a native large title — nothing in it needs to stay pinned. */
    home:          { tab: 'home',   noHeader: true },
    /* `task` hides the tab bar; `noHeader` drops the app bar too — the screen
       draws its own title row (record.js does, with the X that keeps the draft). */
    record:        { tab: 'record', title: 'Record Completions', task: true, noHeader: true },
    'record-done': { tab: 'record', title: 'Record Completions' },
    scan:          { tab: 'scan',   title: 'Scan' },
    more:          { tab: 'more',   title: 'More' },
    notifications: { tab: 'notifications', title: 'Alerts' },   // its own tab, with the unread count
    profile:       { tab: 'more',   title: 'Profile',               back: 'more' }  // reached from the account row in More
  };

  /* The signed-in user — shown on the account row in More and on Profile. */
  var USER = { initials: 'JL', name: 'Jordan Lee', role: 'Company Officer', department: 'Springfield Fire Department' };

  /* ===========================================================================
     ELEMENTS
     ======================================================================== */
  var $  = function (sel) { return document.querySelector(sel); };
  var app        = $('#app');
  var login      = $('#screen-login');
  var prompt     = $('#screen-prompt');
  var header     = $('#app-header');
  var statusBar  = $('#status-bar');
  var sheet      = $('#sheet');
  var unreadCount = 0;   // drives the Alerts tab badge
  var currentScreen = 'login';
  var faceIdEnabled = false;    // set by the opt-in switch on the login form
  var pushPromptSeen = false;   // the opt-in pre-prompt is a first-run screen

  /* ===========================================================================
     RENDER
     ======================================================================== */

  function renderQuickLinks() {
    $('#ql-title').textContent = QUICK_LINKS.title;
    $('#ql-groups').innerHTML = QUICK_LINKS.groups.map(function (group) {
      var tiles = group.tiles.map(function (tile) {
        return '<button class="ql-tile" type="button" data-ink="' + tile.ink + '"' +
               ' style="--tile:' + tile.color + '"' +
               ' data-launch="' + tile.launch + '" data-name="' + tile.name + '">' +
               '<i class="fa-solid ' + tile.icon + '"></i><span>' + tile.name + '</span></button>';
      }).join('');
      return '<div class="ql-group">' +
             '<h3 class="ql-group__title">' + group.title + '</h3>' +
             '<div class="ql-grid">' + tiles + '</div></div>';
    }).join('');
  }

  function renderMore() {
    $('#more-primary').innerHTML = MORE_PRIMARY.map(function (item) {
      return '<button class="t-ListItem" type="button" data-more="' + item.title + '">' +
             '<span class="t-ListItem__icon"><i class="fa-solid ' + item.icon + '"></i></span>' +
             '<span><span class="t-ListItem__title">' + item.title + '</span>' +
             '<span class="t-ListItem__sub" style="display:block">' + item.sub + '</span></span>' +
             '<span class="t-ListItem__after"><i class="fa-solid fa-chevron-right"></i></span>' +
             '</button>';
    }).join('<hr class="t-Separator">');
  }

  function renderNotifications() {
    $('#notif-list').innerHTML = NOTIFICATION_FEED.map(function (n, idx) {
      return '<button class="notif' + (n.unread ? ' notif--unread' : '') + '" type="button" data-notif="' + idx + '">' +
             '<span class="notif__icon" style="color:' + n.fg + ';background:' + n.bg + '">' +
             '<i class="fa-solid ' + n.icon + '"></i></span>' +
             '<span class="notif__main">' +
             '<span class="notif__top"><span class="notif__title">' + n.title + '</span>' +
             '<span class="notif__time">' + n.time + '</span></span>' +
             '<span class="notif__body">' + n.body + '</span></span>' +
             (n.unread ? '<span class="notif__dot" aria-label="Unread"></span>' : '') +
             '</button>';
    }).join('<hr class="t-Separator">');

    // Unread count drives the bell badge on Home.
    var unread = NOTIFICATION_FEED.filter(function (n) { return n.unread; }).length;
    $('#notif-empty').hidden = NOTIFICATION_FEED.length > 0;
    return unread;
  }

  function renderHeader(id) {
    var meta = SCREENS[id] || {};
    if (meta.noHeader) { header.innerHTML = ''; return; }   // the screen draws its own title row / brand bar
    header.innerHTML =
      (meta.back
        ? '<button class="app-header__btn" data-goto="' + meta.back + '" type="button" ' +
          'aria-label="Back"><i class="fa-solid fa-arrow-left"></i></button>'
        : '') +
      '<span class="app-header__title">' + (meta.title || '') + '</span>';
  }

  /* Account row at the top of More — the route to Profile / Log Out now that the
     header no longer carries an avatar. */
  function renderAccount() {
    $('#more-account').innerHTML =
      '<button class="more-account" data-goto="profile" type="button">' +
      '<span class="t-Avatar t-Avatar--md">' + USER.initials + '</span>' +
      '<span class="more-account__main"><span class="more-account__name">' + USER.name + '</span>' +
      '<span class="more-account__sub">' + USER.role + ' \u00b7 ' + USER.department + '</span></span>' +
      '<i class="fa-solid fa-chevron-right t-ListItem__after"></i></button>';
  }

  /* Unread count on the Alerts tab */
  function renderTabBadge() {
    var b = $('#tab-alerts-badge');
    b.textContent = unreadCount;
    b.hidden = !unreadCount;
  }

  /* ===========================================================================
     NAVIGATION
     ======================================================================== */
  function goTo(id, opts) {
    opts = opts || {};

    // Screens that live outside the tabbed shell
    login.classList.toggle('is-active', id === 'login');
    prompt.classList.toggle('is-active', id === 'prompt');
    statusBar.classList.toggle('status-bar--light', id === 'prompt');
    statusBar.classList.toggle('status-bar--brand', id !== 'login' && id !== 'prompt');

    if (id === 'login') showLoginPane();
    if (id === 'home') pushPromptSeen = true;   // the pre-prompt has been answered

    var inApp = id !== 'login' && id !== 'prompt';
    app.hidden = !inApp;
    if (!inApp) {
      // Clear the in-app screens on the way out so logging back in never
      // resumes on a stale one.
      document.querySelectorAll('.screen, .scanner').forEach(function (el) {
        el.classList.remove('is-active');
      });
      closeSheet();
      return;
    }

    if (!SCREENS[id]) id = 'home';
    currentScreen = id;

    document.querySelectorAll('.screen, .scanner').forEach(function (el) {
      el.classList.toggle('is-active', el.id === 'screen-' + id);
    });
    var activeTab = SCREENS[id].tab;
    document.querySelectorAll('.t-Tabs__tab').forEach(function (tab) {
      tab.classList.toggle('is-active', tab.dataset.tab === activeTab);
    });
    // Full-screen tasks (Record Completions) hide the tab bar while open.
    app.classList.toggle('app--task', !!SCREENS[id].task);
    header.classList.toggle('is-none', !!SCREENS[id].noHeader);
    renderHeader(id);

    var active = $('#screen-' + id);
    if (active) active.scrollTop = 0;
  }
  window.goTo = goTo;   // consumed by the Design Toolbox flow map

  /* ---------------------------------------------------------------------------
     Face ID
     ---------------------------------------------------------------------------
     Opting in on the password form swaps the NEXT sign-in to the Face ID pane.
     The scan is simulated on a timer — there is no real biometric API here.
     ------------------------------------------------------------------------ */
  function showLoginPane() {
    $('#login-password').hidden = faceIdEnabled;
    $('#login-faceid').hidden   = !faceIdEnabled;
    resetFaceScan();
  }

  function resetFaceScan() {
    var scan = $('#btn-faceid');
    scan.classList.remove('is-scanning', 'is-done');
    scan.innerHTML = '<i class="fa-solid fa-face-viewfinder"></i>';
    $('#faceid-status').textContent = 'Tap to sign in with Face ID';
  }

  function signIn() { goTo(pushPromptSeen ? 'home' : 'prompt'); }

  function openSheet(title, body) {
    $('#sheet-title').textContent = title;
    $('#sheet-body').textContent  = body;
    sheet.classList.add('is-open');
  }
  function closeSheet() { sheet.classList.remove('is-open'); }

  /* ===========================================================================
     EVENTS
     ======================================================================== */

  // Anything carrying data-goto navigates.
  document.addEventListener('click', function (e) {
    var nav = e.target.closest('[data-goto]');
    if (nav) { goTo(nav.dataset.goto); return; }

    // Header X on a full-screen task: leave, keeping the draft.
    if (e.target.closest('[data-task-leave]')) { if (window.RC) window.RC.leave(false); return; }

    // Quick Link tile. RCA tiles open Record Completions with that activity
    // already added; the other launch types still explain themselves in a sheet.
    var tile = e.target.closest('.ql-tile');
    if (tile) {
      if (tile.dataset.launch === 'rca' && window.RC) { window.RC.openWith(tile.dataset.name); return; }
      var spec = LAUNCH[tile.dataset.launch];
      openSheet(spec.title, spec.body.replace('{name}', tile.dataset.name));
      return;
    }

    // "More" rows that carry their own sheet copy
    var row = e.target.closest('[data-more]');
    if (row) {
      var item = MORE_PRIMARY.filter(function (i) { return i.title === row.dataset.more; })[0];
      if (item && item.sheet) { openSheet(item.sheet.title, item.sheet.body); return; }
      if (item && item.goto)  { goTo(item.goto); return; }
    }

    // Switches (the Face ID opt-in) toggle their own state.
    var sw = e.target.closest('.t-Switch');
    if (sw) {
      sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') !== 'true');
      return;
    }

    // Notification tap — the PRD routes these out to the web platform
    var notif = e.target.closest('[data-notif]');
    if (notif) {
      var n = NOTIFICATION_FEED[+notif.dataset.notif];
      openSheet('Deep link',
        '“' + n.title + '” would open the matching page in your default mobile ' +
        'browser, already signed in through your app session.');
      return;
    }

    // Bottom tabs
    var tab = e.target.closest('.t-Tabs__tab');
    if (tab) { goTo(tab.dataset.tab); return; }
  });

  $('#btn-login').addEventListener('click', function () {
    faceIdEnabled = $('#faceid-toggle').getAttribute('aria-checked') === 'true';
    signIn();
  });

  $('#btn-faceid').addEventListener('click', function () {
    var scan = this;
    if (scan.classList.contains('is-scanning') || scan.classList.contains('is-done')) return;
    scan.classList.add('is-scanning');
    $('#faceid-status').textContent = 'Looking for you…';
    setTimeout(function () {
      scan.classList.remove('is-scanning');
      scan.classList.add('is-done');
      scan.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      $('#faceid-status').textContent = 'Face recognized';
      setTimeout(signIn, 500);
    }, 1100);
  });

  // Escape hatch back to the password form (also turns the opt-in back off).
  $('#btn-use-password').addEventListener('click', function () {
    faceIdEnabled = false;
    $('#faceid-toggle').setAttribute('aria-checked', 'false');
    showLoginPane();
  });
  $('#btn-logout').addEventListener('click', function () { goTo('login'); });

  $('#btn-scan').addEventListener('click', function () {
    openSheet('Scanned',
      'This is where the scanned QR or barcode would launch whatever it points to — ' +
      'an activity, a course, or a Record Completions entry. Resolving real codes ' +
      'comes in a later iteration.');
  });

  $('#sheet-close').addEventListener('click', closeSheet);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });

  /* ---------------------------------------------------------------------------
     Wheel forwarding (prototype chrome, not part of the app)
     ---------------------------------------------------------------------------
     The phone renders at native size, so on a short window the page scrolls to
     reach the tab bar. The problem: with the cursor over the phone, the app's
     own scroll area takes the wheel. Chrome only chains to the page once that
     area hits its limit — and during a continuous trackpad gesture it LATCHES
     to the first scroller and refuses to chain until you lift your fingers. The
     result feels like the page simply will not scroll.

     So: if the pane under the cursor has nothing left to give in that direction
     (or there is no pane), scroll the page ourselves.
     ------------------------------------------------------------------------ */
  window.addEventListener('wheel', function (e) {
    var doc = document.documentElement;
    if (doc.scrollHeight <= doc.clientHeight) return;      // page doesn't scroll

    // .js-scroll marks inner scrollers (the Record Completions form, picker lists)
    var pane = e.target && e.target.closest ? e.target.closest('.js-scroll, .screen') : null;
    if (pane) {
      var atTop = pane.scrollTop <= 0;
      var atEnd = pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 1;
      var paneCanTake = (e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atEnd);
      if (paneCanTake) return;                             // let the app scroll
    }

    window.scrollBy(0, e.deltaY);
    e.preventDefault();
  }, { passive: false });

  /* ===========================================================================
     INIT
     ======================================================================== */
  renderQuickLinks();
  renderMore();
  renderAccount();
  unreadCount = renderNotifications();
  renderTabBadge();
  goTo('login');
})();
