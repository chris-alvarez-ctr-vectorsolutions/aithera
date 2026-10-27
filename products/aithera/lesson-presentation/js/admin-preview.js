/* ==========================================================================
   Admin preview (2026-10-27)

   An admin assigning a course clicks "Admin preview" in the assignment flow
   (bbp-admin's assign page, or le-launch) and lands here: the real learner
   view, run with the settings they just chose, plus one extra control beside
   the Demo button, "Exit admin preview", that takes them back to the flow.

   The link that starts a preview carries:
     adminPreview=1             required; without it nothing here runs
     return=<url>               same-origin page that "Exit admin preview" opens
     role=manufacturing|public  sector version (read by layered-sharps.js)
     formats=video,listen,article   formats the learner may choose (default all)
     test_out=0|1               skip ahead            (default on)
     test_up=0|1                harder checks         (default on)
     extra=0|1                  extra practice        (default on)
     modules=m1,…,m6            modules assigned; the cover lists only these

   A learner link never carries adminPreview, so a learner never sees the
   control. Load this BEFORE layered-engine.js: on entry it sets aside this
   tab's run (and the saved format preference) so the admin starts fresh,
   and Exit puts them back, so a preview never leaves a "Resume" behind.
   ========================================================================== */
(function () {
  var KEY = 'admin-preview', STASH = 'admin-preview-stash';
  var FORMATS = ['video', 'listen', 'article'];
  var MODULES = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
  var PREFS = ['sh-mode-pref', 'sh-format-pref'];    // learner profile prefs (localStorage)
  var URL_KEYS = ['adminPreview', 'return', 'formats', 'test_out', 'test_up', 'extra', 'modules'];

  function ss(k, v) {
    try {
      if (v === undefined) return sessionStorage.getItem(k);
      if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v);
    } catch (e) { return null; }
  }
  // This tab's run: every Sharps/engine key plus the course index's progress.
  function runKeys() {
    var out = [];
    try {
      for (var i = 0; i < sessionStorage.length; i++) {
        var k = sessionStorage.key(i);
        if (/^(sh-|ll-)/.test(k) || k === 'bo-progress') out.push(k);
      }
    } catch (e) {}
    return out;
  }
  function list(v, allowed) {
    if (v == null) return allowed.slice();
    var got = v.split(',').filter(function (x) { return allowed.indexOf(x) > -1; });
    return got.length ? got : allowed.slice();
  }
  function flag(v) { return v !== '0' && v !== 'false'; }
  function sameOrigin(u) {
    try { return new URL(u, location.href).origin === location.origin; } catch (e) { return false; }
  }

  // ---- Entry: a link with adminPreview=1 starts a fresh preview ------------
  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
  if (q && q.get('adminPreview') === '1') {
    var ret = q.get('return');
    var cfg = {
      ret: ret && sameOrigin(ret) ? new URL(ret, location.href).href : null,
      formats: list(q.get('formats'), FORMATS),
      testOut: flag(q.get('test_out')),
      testUp: flag(q.get('test_up')),
      extra: flag(q.get('extra')),
      modules: list(q.get('modules'), MODULES)
    };
    // Set aside the tab's own run once; a second preview in a row keeps the
    // first stash, which is the learner's, not the earlier preview's.
    if (!ss(KEY)) {
      var stash = { session: {}, local: {} };
      runKeys().forEach(function (k) { stash.session[k] = ss(k); });
      PREFS.forEach(function (k) { try { stash.local[k] = localStorage.getItem(k); } catch (e) {} });
      ss(STASH, JSON.stringify(stash));
    }
    runKeys().forEach(function (k) { ss(k, null); });
    PREFS.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    ss('ll-review', '0');                            // the learner's view, no reviewer captions
    ss(KEY, JSON.stringify(cfg));
    // Off the URL, so a refresh carries on with the preview instead of
    // starting it over. role stays: layered-sharps.js reads it.
    try {
      var u = new URL(location.href);
      URL_KEYS.forEach(function (k) { u.searchParams.delete(k); });
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {}
  }

  var cfgNow = null;
  try { cfgNow = JSON.parse(ss(KEY) || 'null'); } catch (e) {}
  if (!cfgNow) { window.AdminPreview = null; return; }

  function exit() {
    var stash = null;
    try { stash = JSON.parse(ss(STASH) || 'null'); } catch (e) {}
    runKeys().forEach(function (k) { ss(k, null); });
    if (stash) {
      Object.keys(stash.session).forEach(function (k) { ss(k, stash.session[k]); });
      Object.keys(stash.local).forEach(function (k) {
        try { if (stash.local[k] == null) localStorage.removeItem(k); else localStorage.setItem(k, stash.local[k]); } catch (e) {}
      });
    }
    ss(STASH, null); ss(KEY, null);
    location.href = cfgNow.ret || 'index.html';
  }

  window.AdminPreview = {
    formats: cfgNow.formats,
    allows: function (f) { return cfgNow.formats.indexOf(f) > -1; },
    only: function () { return cfgNow.formats.length === 1 ? cfgNow.formats[0] : null; },
    testOut: cfgNow.testOut,
    testUp: cfgNow.testUp,
    extra: cfgNow.extra,
    modules: cfgNow.modules,
    exit: exit
  };

  // ---- The control: just left of Demo in the frame's top band --------------
  // Waits for the engine to build the Demo button (or, on a page without one,
  // for the frame's actions slot) and sits immediately before it.
  function mount() {
    if (document.getElementById('apExitBtn')) return true;
    var demo = document.getElementById('llDemoBtn');
    var actions = demo ? demo.parentNode : document.querySelector('.vt-frame .vt-actions');
    if (!actions) return false;
    var b = document.createElement('button');
    b.id = 'apExitBtn';
    b.type = 'button';
    b.className = 'ap-exit';
    b.title = 'You are previewing this course as a learner would see it. Only admins see this.';
    b.innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i> Exit admin preview';
    b.addEventListener('click', exit);
    if (demo) actions.insertBefore(b, demo); else actions.appendChild(b);
    return true;
  }
  var style = document.createElement('style');
  style.textContent =
    '.vt-actions button.ap-exit { background: #fff; color: #0b3a66; border-color: #fff; }' +
    '.vt-actions button.ap-exit:hover { background: #e8f1fb; border-color: #e8f1fb; }';
  document.head.appendChild(style);
  function watch() {
    if (mount()) return;
    var mo = new MutationObserver(function () { if (mount()) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
})();
