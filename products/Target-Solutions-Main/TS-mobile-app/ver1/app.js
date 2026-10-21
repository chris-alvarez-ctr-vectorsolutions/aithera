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
     fill, 'dark' = navy on a pale fill). `supervisorOnly` marks activities some
     departments restrict to admins/supervisors: in the "limited" Quick Links
     mode a firefighter sees them grayed out and gets a message on tap. */
  var QUICK_LINKS = {
    title: 'Quick Links',
    groups: [
      { title: 'Station-based Trainings', tiles: [
        { name: 'EMT Basics',              color: '#F2B72A', ink: 'dark',  icon: 'fa-kit-medical',        launch: 'rca' },
        { name: 'Extinguisher Training',   color: '#C62E5B', ink: 'light', icon: 'fa-fire-extinguisher',  launch: 'rca', supervisorOnly: true },
        { name: 'Fire Basics',             color: '#E8402A', ink: 'light', icon: 'fa-fire',               launch: 'rca' },
        { name: 'Firewalls',               color: '#6B2C91', ink: 'light', icon: 'fa-fire-flame-curved',  launch: 'rca' },
        { name: 'Hydrant Training',        color: '#2F3A9E', ink: 'light', icon: 'fa-fire-hydrant',       launch: 'rca', supervisorOnly: true },
        { name: 'Sprinkler System Basics', color: '#1668D6', ink: 'light', icon: 'fa-sprinkler-ceiling',  launch: 'rca' },
        { name: 'Vehicle Stabilization',   color: '#0F7B9C', ink: 'light', icon: 'fa-car-burst',          launch: 'rca', supervisorOnly: true },
        { name: 'Physical Fitness',        color: '#C3D934', ink: 'dark',  icon: 'fa-dumbbell',           launch: 'selfAssign' }
      ]},
      { title: 'Field-based Trainings', tiles: [
        { name: 'Facilities Training',     color: '#C5DDF5', ink: 'dark',  icon: 'fa-building',           launch: 'rca', supervisorOnly: true },
        { name: 'Harbor Familiar\u00ADization', /* soft hyphen: breaks cleanly in a narrow tile */ color: '#CBD5F5', ink: 'dark',  icon: 'fa-ship',               launch: 'rca' },
        { name: 'Ladder Training',         color: '#DCCFF0', ink: 'dark',  icon: 'fa-truck-ladder',       launch: 'rca', supervisorOnly: true },
        { name: 'Offshore Basics',         color: '#F7D3DE', ink: 'dark',  icon: 'fa-life-ring',          launch: 'rca' },
        { name: 'Sprinkler Systems',       color: '#FBE0C6', ink: 'dark',  icon: 'fa-sprinkler-ceiling',  launch: 'rca' },
        { name: 'Dumpster Fires',          color: '#FBD3B4', ink: 'dark',  icon: 'fa-dumpster-fire',      launch: 'rca', supervisorOnly: true },
        { name: 'Wildland Policy',         color: '#FBEFC0', ink: 'dark',  icon: 'fa-file-pdf',           launch: 'file' },
        { name: 'State Training Portal',   color: '#D3EBD0', ink: 'dark',  icon: 'fa-graduation-cap',     launch: 'url' }
      ]}
    ]
  };

  /* Quick Links mode — a UX-tools switch (bottom of the page), not product:
       'all'     every tile is live (default)
       'limited' the signed-in user lacks access to the supervisorOnly tiles:
                 they stay visible but grayed out, and a tap explains why
       'none'    the department has not configured any Quick Links — there is
                 NO Home tab: sign-in lands on Record Completions (which keeps
                 the tab bar and loses its X), and every route to Home goes to
                 Record instead. See hasHome() / goTo().
     Driven by APP.setQuickLinksMode() and the flow map's home-* nodes. */
  var quickLinksMode = 'all';
  function hasHome() { return quickLinksMode !== 'none'; }
  var QUICK_LINKS_LOCKED = {
    body:  'Your account doesn’t have access to record this activity. Ask your supervisor or training officer to record it for you.'
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
    profile:       { tab: 'more',   title: 'Profile',               back: 'more' }, // reached from the account row in More
    privacy:       { tab: 'more',   title: 'Privacy Policy',        back: 'more' }  // small link at the foot of More
  };

  /* Two demo users, switched from the UX tools dock (no second login needed).
     `role` is NOT shown anywhere in the app — title data is not available at
     launch — it only labels the dock button. The firefighter exists to demo
     the "limited" Quick Links mode and the shared-device "Welcome back" screen. */
  var USERS = {
    captain:     { id: 'captain',     initials: 'JL', name: 'Jordan Lee', role: 'Captain',     username: 'j.lee',    department: 'Springfield Fire Department' },
    firefighter: { id: 'firefighter', initials: 'SR', name: 'Sam Rivera', role: 'Firefighter', username: 's.rivera', department: 'Springfield Fire Department' }
  };
  var USER = USERS.captain;

  /* Shared-device mode (station tablets, rig iPads). Chosen once on first launch,
     right after the country, and remembered on the device the same way. It is a
     property of the DEVICE, set by whoever configures it — not a question every
     person answers at every login. Everything shared mode changes hangs off the
     one `deviceId` flag:
       • no Face ID opt-in and no prefilled username on the login form
       • the push pre-prompt is skipped (alerts are personal; the device is not)
       • an identity strip above every in-app screen, with a Switch action
       • after an hour idle, a "Welcome back" screen: continue as the same
         person (nothing lost) or sign in as someone else — no auto sign-out,
         because a rig iPad is picked up at the start of a 12-hour shift and
         must not kick the captain out mid-shift
       • any Record Completions draft is thrown away on sign-out
     Personal devices ("Just me") have no timer at all: they stay signed in for
     weeks, like any other app on the phone. */
  var DEVICES = { personal: { name: 'Just me',               icon: 'fa-mobile-screen-button' },
                  shared:   { name: 'Shared station device', icon: 'fa-users' } };
  var deviceId = null;
  /* Inactivity rule for shared devices. After `label` of no touches the app
     shows the "Welcome back" screen instead of signing out. The prototype fires
     after 45 s so reviewers can see it without waiting. */
  var IDLE = { afterMs: 45000, label: '1 hour' };

  /* ===========================================================================
     ELEMENTS
     ======================================================================== */
  var $  = function (sel) { return document.querySelector(sel); };
  var app        = $('#app');
  var region     = $('#screen-region');
  var device     = $('#screen-device');
  var login      = $('#screen-login');
  var who        = $('#who');            // shared-device identity strip
  var prompt     = $('#screen-prompt');
  var header     = $('#app-header');
  var statusBar  = $('#status-bar');
  var sheet      = $('#sheet');
  var unreadCount = 0;   // drives the Alerts tab badge
  var currentScreen = 'region';
  /* Which database to sign in against. US and Canada accounts live in separate
     databases with no cross-database username uniqueness, so this has to be
     known before the credentials are sent. null = not chosen yet; once chosen
     it is remembered across log-outs, and only the "Change" link on the login
     form leads back to the picker. */
  var REGIONS = { us: { name: 'United States', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
                  ca: { name: 'Canada',        flag: '\uD83C\uDDE8\uD83C\uDDE6' } };
  var regionId = null;
  var faceIdEnabled = false;    // set by the opt-in switch on the login form
  var pushPromptSeen = false;   // the opt-in pre-prompt is a first-run screen

  /* ===========================================================================
     RENDER
     ======================================================================== */

  function renderQuickLinks() {
    $('#ql-title').textContent = QUICK_LINKS.title;
    // No Home tab without Quick Links (see hasHome); the tab bar, the task's X
    // and the "Go to Home" buttons all key off this class.
    app.classList.toggle('app--no-home', !hasHome());
    $('#ql-groups').innerHTML = QUICK_LINKS.groups.map(function (group) {
      var tiles = group.tiles.map(function (tile) {
        // Limited mode: supervisor-only tiles stay visible (the user can see
        // what exists) but are grayed out, carry a lock, and explain on tap.
        var locked = quickLinksMode === 'limited' && tile.supervisorOnly;
        return '<button class="ql-tile' + (locked ? ' ql-tile--locked' : '') + '" type="button" data-ink="' + tile.ink + '"' +
               ' style="--tile:' + tile.color + '"' +
               (locked ? ' data-locked="true" aria-disabled="true"' : '') +
               ' data-launch="' + tile.launch + '" data-name="' + tile.name + '">' +
               (locked ? '<i class="fa-solid fa-lock ql-tile__lock" aria-hidden="true"></i>' : '') +
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
    // A screen may override its bar title via data-title (record.js does for the
    // confirmation: "Record Completion" after a self-assign, plural after a group).
    var screenEl = $('#screen-' + id);
    var title = (screenEl && screenEl.dataset.title) || meta.title || '';
    header.innerHTML =
      (meta.back
        ? '<button class="app-header__btn" data-goto="' + meta.back + '" type="button" ' +
          'aria-label="Back"><i class="fa-solid fa-arrow-left"></i></button>'
        : '') +
      '<span class="app-header__title">' + title + '</span>';
  }

  /* Account row at the top of More — the route to Profile / Log Out now that the
     header no longer carries an avatar. */
  function renderAccount() {
    $('#more-account').innerHTML =
      '<button class="more-account" data-goto="profile" type="button">' +
      '<span class="t-Avatar t-Avatar--md">' + USER.initials + '</span>' +
      '<span class="more-account__main"><span class="more-account__name">' + USER.name + '</span>' +
      '<span class="more-account__sub">' + USER.department + '</span></span>' +
      '<i class="fa-solid fa-chevron-right t-ListItem__after"></i></button>';
  }

  /* Profile card: name and department only — no title/role, that data is not
     available at launch. */
  function renderProfile() {
    $('#profile-card').innerHTML =
      '<div class="t-Card__body t-YStack" style="align-items:center;gap:var(--space-3);text-align:center">' +
      '<div class="t-Avatar t-Avatar--lg">' + USER.initials + '</div>' +
      '<h2 class="t-H3">' + USER.name + '</h2>' +
      '<hr class="t-Separator" style="width:100%">' +
      '<div><p class="t-Label">Department</p>' +
      '<p class="t-H4" style="margin-top:var(--space-1)">' + USER.department + '</p></div></div>';
  }

  /* Switch the signed-in demo user (UX tools dock). Re-renders everything that
     names the person; the screen the reviewer is on stays put. */
  function setUser(id) {
    if (!USERS[id] || USERS[id] === USER) return;
    USER = USERS[id];
    renderAccount(); renderProfile(); renderWho(); renderQuickLinks();
    if (!isShared()) $('#username').value = USER.username;
    document.dispatchEvent(new CustomEvent('ts:user', { detail: { id: id } }));
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
    var outside = id === 'region' || id === 'device' || id === 'login' || id === 'sso' || id === 'prompt';
    region.classList.toggle('is-active', id === 'region');
    device.classList.toggle('is-active', id === 'device');
    login.classList.toggle('is-active', id === 'login');
    sso.classList.toggle('is-active', id === 'sso');
    prompt.classList.toggle('is-active', id === 'prompt');
    statusBar.classList.toggle('status-bar--light', id === 'prompt' || id === 'sso');
    // On a shared device the status bar stays navy so it and the identity strip
    // read as one block of system chrome above the (brand-colored) app.
    statusBar.classList.toggle('status-bar--brand', !outside && !isShared());

    if (id === 'login') {   // deep links land here with defaults
      if (!regionId) regionId = 'us';
      if (!deviceId) setDevice('personal');
      showLoginPane();
    }
    // No Quick Links → no Home tab: anything headed Home lands on Record.
    if (id === 'home' && !hasHome()) id = 'record';
    // The pre-prompt has been answered. Shared devices skip it entirely, so a
    // tablet later switched to "Just me" still gets to see it.
    if (!outside && !isShared()) pushPromptSeen = true;

    var inApp = !outside;
    app.hidden = !inApp;
    who.hidden = !(inApp && isShared());
    if (inApp && isShared()) idleStart(); else idleStop();
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
    // Full-screen tasks (Record Completions) hide the tab bar while open —
    // except when there is no Home tab: Record is then the landing screen and
    // the only way to the other tabs, so the bar stays.
    app.classList.toggle('app--task', !!SCREENS[id].task && hasHome());
    header.classList.toggle('is-none', !!SCREENS[id].noHeader);
    renderHeader(id);

    var active = $('#screen-' + id);
    if (active) active.scrollTop = 0;
    setWhoMini(false);   // a new screen starts at the top, so the strip is open
  }
  window.goTo = goTo;   // consumed by the Design Toolbox flow map

  /* ---------------------------------------------------------------------------
     Identity strip collapses with the scroll (shared devices)
     ---------------------------------------------------------------------------
     The full strip (avatar, name, Switch) is tall. Once the user scrolls down
     it shrinks to a one-line ribbon that still says who is signed in; pulling
     back up, reaching the top, or tapping the ribbon opens it again. Every
     scroller in the app (.screen, .js-scroll) reports through one capture-
     phase listener, with the last position kept per element so direction can
     be read.
     ------------------------------------------------------------------------ */
  var whoLastY = new WeakMap();
  var whoSettle = 0;   // ignore scroll events until this time (see below)
  function setWhoMini(on) {
    on = !!on;
    if (who.classList.contains('who--mini') === on) return;
    who.classList.toggle('who--mini', on);
    // Changing the strip's height resizes the scroller beneath it, and the
    // browser may clamp that scroller's position in response — which fires a
    // scroll event that would read as "the user pulled up" and reopen the
    // strip, forever. So after every toggle, scroll events are ignored for the
    // length of the height transition (only the last position is recorded).
    whoSettle = Date.now() + 320;
  }
  $('.device-screen').addEventListener('scroll', function (e) {
    var el = e.target;
    if (!el.classList || !(el.classList.contains('screen') || el.classList.contains('js-scroll'))) return;
    if (!isShared()) return;
    var y = el.scrollTop, last = whoLastY.get(el) || 0;
    whoLastY.set(el, y);
    if (Date.now() < whoSettle) return;                 // our own layout change
    if (y <= 8)                      setWhoMini(false); // at the top: always open
    else if (y > last + 4 && y > 24) setWhoMini(true);  // scrolling down: collapse
    else if (y < last - 4)           setWhoMini(false); // pulling back up: open
  }, true);
  who.addEventListener('click', function () { if (who.classList.contains('who--mini')) setWhoMini(false); });

  /* ---------------------------------------------------------------------------
     Face ID
     ---------------------------------------------------------------------------
     Opting in on the password form swaps the NEXT sign-in to the Face ID pane.
     The scan is simulated on a timer — there is no real biometric API here.
     ------------------------------------------------------------------------ */
  function showLoginPane() {
    var r = REGIONS[regionId], d = DEVICES[deviceId], shared = isShared();
    $('#region-current-flag').textContent = r.flag;
    $('#region-current-name').textContent = r.name;
    $('#device-current-icon').className = 'fa-solid ' + d.icon + ' region-current__icon';
    $('#device-current-name').textContent = d.name;
    // Shared devices never get the Face ID pane, the opt-in, or a remembered username.
    var faceId = faceIdEnabled && !shared;
    $('#login-password').hidden = faceId;
    $('#login-faceid').hidden   = !faceId;
    $('#login-agency').hidden   = true;
    $('.faceid-optin').hidden   = shared;
    $('#login-shared-note').hidden = !shared;
    $('#username').value = shared ? '' : USER.username;
    $('#password').value = shared ? '' : 'password';
    clearLoginError();
    resetFaceScan();
    resetAgencyPane();
  }

  /* ---------------------------------------------------------------------------
     Log in with your agency (SSO)
     ---------------------------------------------------------------------------
     Phase 1 has no forgot-password flow, but it does have SSO. The link under
     Log In swaps the form for one field: the agency's site path, handed out by
     the administrator. Continue opens the agency's own sign-in page embedded
     in the app (the `sso` screen) — faked here as a generic identity-provider
     login branded with the agency the path resolves to.
     ------------------------------------------------------------------------ */
  /* Site path → agency name. Unknown paths just show the path itself. */
  var AGENCIES = { springfd: 'Springfield Fire Department', springpd: 'Springfield Police Department' };
  var sso = $('#screen-sso');
  function resetAgencyPane() {
    var input = $('#agency-path');
    input.value = ''; input.classList.remove('is-invalid');
    $('#agency-help').hidden = true;
    $('#btn-agency').disabled = false;
    $('#btn-agency').innerHTML = 'Continue';
  }
  function openSso(path) {
    var org = AGENCIES[path] || path;
    $('#sso-domain').textContent = 'login.' + path + '.gov';
    $('#sso-org').textContent = org;
    $('#sso-org2').textContent = org;
    $('#sso-user').value = ''; $('#sso-pass').value = '';
    $('#btn-sso-login').disabled = false;
    $('#btn-sso-login').innerHTML = 'Sign in';
    goTo('sso');
  }
  $('#btn-sso-login').addEventListener('click', function () {
    var btn = this;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in\u2026';
    setTimeout(signIn, 900);
  });
  // Cancel goes back to the site-path field, not all the way to the password form.
  $('#btn-sso-cancel').addEventListener('click', function () {
    goTo('login');
    $('#btn-login-agency').click();
  });
  $('#btn-login-agency').addEventListener('click', function () {
    $('#login-password').hidden = true;
    $('#login-faceid').hidden = true;
    $('#login-agency').hidden = false;
    resetAgencyPane();
    $('#agency-path').focus();
  });
  $('#btn-agency-back').addEventListener('click', showLoginPane);
  $('#agency-path').addEventListener('input', function () {
    this.classList.remove('is-invalid');
    $('#agency-help').hidden = true;
  });
  $('#agency-path').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#btn-agency').click(); });
  $('#btn-agency').addEventListener('click', function () {
    var path = $('#agency-path').value.trim().toLowerCase();
    if (!path) {
      $('#agency-path').classList.add('is-invalid');
      $('#agency-help').textContent = 'Enter your agency\u2019s site path.';
      $('#agency-help').hidden = false;
      $('#agency-path').focus();
      return;
    }
    // Brief "opening" beat, then the agency's sign-in page.
    var btn = $('#btn-agency');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Opening ' + path + '\u2026';
    setTimeout(function () { openSso(path); }, 700);
  });

  /* ---------------------------------------------------------------------------
     Failed sign-in
     ---------------------------------------------------------------------------
     The credentials error plus a country nudge. US and Canada accounts are two
     databases, so the first thing to check after a failure is the country —
     the nudge names the one in use and switches to the other in one tap.
     Prototype rule: a blank username or password fails; anything else works.
     ------------------------------------------------------------------------ */
  var OTHER_REGION = { us: 'ca', ca: 'us' };
  function showLoginError() {
    var r = REGIONS[regionId], o = REGIONS[OTHER_REGION[regionId]];
    $('#login-hint-flag').textContent  = r.flag;
    $('#login-hint-name').textContent  = r.name;
    $('#login-hint-other').textContent = o.name;
    $('#login-error').hidden = false;
    $('#username').classList.add('is-invalid');
    $('#password').classList.add('is-invalid');
  }
  function clearLoginError() {
    $('#login-error').hidden = true;
    $('#username').classList.remove('is-invalid');
    $('#password').classList.remove('is-invalid');
  }
  $('#username').addEventListener('input', clearLoginError);
  $('#password').addEventListener('input', clearLoginError);
  // "Switch" flips the country in place (no trip back to the picker) and
  // leaves whatever was typed so the user can just tap Log In again.
  $('#btn-wrong-country').addEventListener('click', function () {
    var u = $('#username').value, p = $('#password').value;
    regionId = OTHER_REGION[regionId];
    showLoginPane();
    $('#username').value = u; $('#password').value = p;
    $('#username').focus();
  });

  function isShared() { return deviceId === 'shared'; }
  function setDevice(id) {
    if (id === deviceId) return;
    deviceId = id;
    $('#profile-shared').hidden = !isShared();   // the rules card on Profile
    // Changing the device type is a setup event; a draft from the other mode
    // (and its rendered "Recording as" line) should not carry across.
    if (window.RC && window.RC.reset) window.RC.reset();
  }

  /* Identity strip + the shared-device notes. Re-run when the demo user changes. */
  function renderWho() {
    $('#who-avatar').textContent = USER.initials;
    $('#who-name').textContent   = USER.name;
    $('#login-idle-label').textContent = IDLE.label;
    document.querySelectorAll('.idle-label').forEach(function (el) { el.textContent = IDLE.label; });
  }

  /* Sign out from anywhere: Profile → Log Out, the strip's Switch, or "Sign in
     to a different account" on the Welcome back screen. On a shared device the
     Record Completions draft is discarded too — it must never carry over to the
     next person who picks up the tablet. */
  function signOut() {
    idleStop();
    closeIdleWarning();
    if (isShared() && window.RC && window.RC.reset) window.RC.reset();
    goTo('login');
  }

  /* ---------------------------------------------------------------------------
     Inactivity check (shared devices only)
     ---------------------------------------------------------------------------
     Any touch or key press inside the phone resets the clock. When it runs out
     the app does NOT sign out — a rig iPad is picked up at the start of a
     12-hour shift and the captain must not be kicked out mid-shift. Instead a
     full-screen "Welcome back" asks who is holding the device: continue as the
     same person (straight back to where they were, nothing lost) or sign in
     as someone else. There is no countdown; the screen waits.
     ------------------------------------------------------------------------ */
  var idleTimer = null;
  function idleStart() { idleStop(); idleTimer = setTimeout(showIdleWarning, IDLE.afterMs); }
  function idleStop()  { clearTimeout(idleTimer); idleTimer = null; }

  function showIdleWarning() {
    idleStop();
    var first = USER.name.split(' ')[0];
    $('#idle-lock').innerHTML =
      '<div class="idle-lock__card">' +
      '<span class="t-Avatar t-Avatar--lg idle-lock__avatar" aria-hidden="true">' + USER.initials + '</span>' +
      '<h2 class="idle-lock__title" id="idle-title">Welcome back</h2>' +
      '<p class="idle-lock__body">This shared device has been idle for over ' + IDLE.label +
      '. Confirm who\u2019s using it before continuing.</p>' +
      '<button class="t-Button t-Button--primary idle-lock__continue" data-idle="stay" type="button">' +
      '<i class="fa-solid fa-arrow-right-to-bracket"></i> Continue as ' + USER.name + '</button>' +
      '<button class="t-Button t-Button--secondary idle-lock__alt" data-idle="out" type="button">' +
      '<i class="fa-solid fa-user-group"></i> Sign in to a different account</button>' +
      '<p class="idle-lock__hint">Continuing picks up right where ' + first + ' left off \u2014 nothing is lost.</p>' +
      '</div>';
    $('#idle-lock').classList.add('is-open');
  }
  function closeIdleWarning() { $('#idle-lock').classList.remove('is-open'); }
  $('#idle-lock').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-idle]');
    if (!btn) return;
    closeIdleWarning();
    if (btn.dataset.idle === 'out') signOut(); else idleStart();   // continue: app untouched
  });
  // Activity resets the clock — but only while it is running. Once the
  // Welcome back screen is up, only its two buttons count.
  ['pointerdown', 'keydown'].forEach(function (ev) {
    $('.device-screen').addEventListener(ev, function () { if (idleTimer) idleStart(); }, true);
  });

  function resetFaceScan() {
    var scan = $('#btn-faceid');
    scan.classList.remove('is-scanning', 'is-done');
    scan.innerHTML = '<i class="fa-solid fa-face-viewfinder"></i>';
    $('#faceid-status').textContent = 'Tap to sign in with Face ID';
  }

  // Shared devices skip the push pre-prompt: alerts are personal to an account,
  // and a station tablet is not — so there is nothing to opt in to.
  function signIn() { goTo(pushPromptSeen || isShared() ? 'home' : 'prompt'); }

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
    // already added; Self Assign tiles open the single-activity self-assign form
    // for the signed-in user; the other launch types still explain themselves in a sheet.
    var tile = e.target.closest('.ql-tile');
    if (tile) {
      if (tile.dataset.locked) { openSheet(tile.dataset.name, QUICK_LINKS_LOCKED.body); return; }
      if (tile.dataset.launch === 'rca' && window.RC) { window.RC.openWith(tile.dataset.name); return; }
      if (tile.dataset.launch === 'selfAssign' && window.RC) { window.RC.openSelf(tile.dataset.name); return; }
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

  // Country picker → device picker (first launch) or straight to the login form.
  // Either tap is a full choice; nothing to confirm.
  document.querySelectorAll('.region-btn[data-region]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      regionId = btn.dataset.region;
      goTo(deviceId ? 'login' : 'device');
    });
  });
  // Device picker → login form. Same one-tap pattern.
  document.querySelectorAll('.region-btn[data-device]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setDevice(btn.dataset.device);
      goTo('login');
    });
  });
  $('#btn-change-region').addEventListener('click', function () { goTo('region'); });
  $('#btn-change-device').addEventListener('click', function () { goTo('device'); });
  $('#btn-switch-user').addEventListener('click', signOut);

  $('#btn-login').addEventListener('click', function () {
    if (!$('#username').value.trim() || !$('#password').value) { showLoginError(); return; }
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
  // Log out keeps the remembered country and device type — only the "Change"
  // links on the login form lead back to the pickers.
  $('#btn-logout').addEventListener('click', signOut);

  // The simulated scan stands in for the printed QR code outside the workout
  // room: it resolves straight to the Physical Fitness self-assign. (A real code
  // could point at any activity, course, or Record Completions entry.)
  $('#btn-scan').addEventListener('click', function () {
    if (window.RC) window.RC.openSelf('Physical Fitness', { scanned: true });
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
  renderProfile();
  renderWho();
  unreadCount = renderNotifications();
  renderTabBadge();

  /* Shared-device hooks for record.js (the "Recording as" line, draft reset on
     sign-out) and the Design Toolbox flow map (shared-state thumbnails). */
  window.APP = {
    get user() { return USER; },   // live — the dock can switch demo users
    users: USERS,
    userId: function () { return USER.id; },
    setUser: setUser,
    isShared: isShared,
    signOut: signOut,
    showIdleWarning: showIdleWarning,
    setDevice: setDevice,
    openSso: openSso,
    // Quick Links mode: 'all' | 'limited' | 'none' (see quickLinksMode above).
    // Driven by the UX tools dock and the flow map's home / home-limited /
    // home-empty nodes.
    quickLinksMode: function () { return quickLinksMode; },
    hasHome: hasHome,
    setQuickLinksMode: function (mode) {
      if (mode !== 'all' && mode !== 'limited' && mode !== 'none') return;
      if (mode === quickLinksMode) return;
      quickLinksMode = mode;
      renderQuickLinks();
      // Re-run the current screen so the tab bar / task chrome follow the mode
      // (and a Home that no longer exists becomes Record).
      if (!app.hidden) goTo(currentScreen, { instant: true });
      document.dispatchEvent(new CustomEvent('ts:quicklinks', { detail: { mode: mode } }));
    }
  };

  // UX-tools URL flags (?user=firefighter, ?ql=limited|off) are applied here,
  // before the flow map's #fm= boot, so a deep link renders the right person.
  var qs = location.search;
  var um = qs.match(/[?&]user=(captain|firefighter)\b/);  if (um) window.APP.setUser(um[1]);
  var qm = qs.match(/[?&]ql=(all|limited|off|none)\b/);   if (qm) window.APP.setQuickLinksMode(qm[1] === 'off' ? 'none' : qm[1]);

  // First launch asks for the country, then the device type; later launches remember both.
  goTo(regionId ? (deviceId ? 'login' : 'device') : 'region');
})();
