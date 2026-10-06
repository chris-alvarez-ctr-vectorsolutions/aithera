/* ============================================================================
   App shell behaviour · ported from design-system/navigation/v3-app-rail.html
   ----------------------------------------------------------------------------
   Launcher open/close + filter · side-nav collapse (top-bar toggle only) ·
   hover-peek overlay (clone-based, 16px halo, 100ms in / 500ms out, dock by
   clicking the toggle while peeking) · search centred on the bar and clamped
   clear of the left group / right group · scoped search results · profile
   menu with nav text size · in-nav location picker (delegated, so it works
   inside the peek copy). Deep links: ?nav=closed · ?state=peek · ?launcher ·
   ?location · ?search · ?profile · ?density=compact|comfortable · ?logopos=bottom
   ========================================================================== */
(function () {
  'use strict';
  var body = document.body;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function notYet(what) { if (window.App && App.notYet) App.notYet(what); }

  /* 1) Launcher (app switcher) */
  var lBtn = $('#launcherBtn'), panel = $('#launcher'), scrim = $('#launcherScrim');
  function setLauncher(o) { panel.hidden = !o; scrim.hidden = !o; lBtn.setAttribute('aria-expanded', String(o)); }
  lBtn.addEventListener('click', function (e) { e.stopPropagation(); setLauncher(panel.hidden); });
  document.addEventListener('click', function (e) { if (!panel.hidden && !panel.contains(e.target)) setLauncher(false); });
  var lSearch = $('#lSearch');
  lSearch.addEventListener('input', function () {
    var q = lSearch.value.trim().toLowerCase();
    $$('#launcher .l-row').forEach(function (r) { var n = r.querySelector('.l-name'); r.style.display = (n && n.textContent.toLowerCase().indexOf(q) > -1) ? '' : 'none'; });
    $$('#launcher .l-sec').forEach(function (sec) {
      var any = false, el = sec.nextElementSibling;
      while (el && !el.classList.contains('l-sec') && !el.classList.contains('l-div')) { if (el.classList.contains('l-row') && el.style.display !== 'none') any = true; el = el.nextElementSibling; }
      sec.style.display = any ? '' : 'none';
    });
  });
  $$('#launcher .l-row, .apprail .rapp[data-app]').forEach(function (t) {
    t.addEventListener('click', function (e) {
      e.preventDefault();
      if (t.dataset.app === 'bridge') { setLauncher(false); return; }
      setLauncher(false);
      var name = t.querySelector('.l-name') ? t.querySelector('.l-name').textContent : t.dataset.tip;
      notYet(t.classList.contains('buy') ? 'The ' + name + ' product page' : name);
    });
  });

  /* 2) Side nav collapse + hover peek */
  var nBtn = $('#navToggle');
  var PEEK_HALO = 16, PEEK_IN = 100, PEEK_OUT = 500;
  var peekEl = null, peekClosing = false, peekIn = null, peekOut = null;
  function setNav(open) {
    var snap = !!peekEl && open;
    if (snap) body.classList.add('nav-snap');
    killPeek();
    body.classList.toggle('nav-hidden', !open);
    if (snap) requestAnimationFrame(function () { requestAnimationFrame(function () { body.classList.remove('nav-snap'); }); });
    nBtn.setAttribute('aria-pressed', String(open));
    nBtn.setAttribute('aria-label', open ? 'Collapse navigation' : 'Expand navigation');
  }
  nBtn.addEventListener('click', function () { setNav(body.classList.contains('nav-hidden')); });
  function collapsedNav() { var n = $('.sidenav:not(.peek-clone)'); if (!n) return null; var r = n.getBoundingClientRect(); return (r.width > 0 && r.height > 0) ? n : null; }
  function nearPeek(e, stay) {
    var t = e.target;
    if (t && t.closest && (t.closest('.peek-clone') || (stay && t.closest('#navToggle')))) return true;
    var el = peekEl || collapsedNav(); if (!el) return false;
    var r = el.getBoundingClientRect();
    var inX = e.clientX >= r.left - PEEK_HALO && e.clientX <= r.right + PEEK_HALO;
    return inX && e.clientY <= r.bottom && (stay || e.clientY >= r.top);
  }
  function openPeek() {
    clearTimeout(peekIn); peekIn = null;
    if (peekEl || !body.classList.contains('nav-hidden')) return;
    var src = collapsedNav(); if (!src) return;
    var r = src.getBoundingClientRect();
    var c = src.cloneNode(true);
    c.classList.add('peek-clone');
    c.setAttribute('aria-label', (src.getAttribute('aria-label') || 'Navigation') + ' (preview)');
    $$('[id]', c).forEach(function (n) { n.removeAttribute('id'); });
    c.style.left = Math.round(r.left) + 'px'; c.style.top = Math.round(r.top) + 'px';
    body.appendChild(c); peekEl = c; peekClosing = false;
    body.classList.add('nav-peek');
  }
  function killPeek() {
    clearTimeout(peekIn); clearTimeout(peekOut); peekIn = peekOut = null;
    if (peekEl && peekEl.parentNode) peekEl.parentNode.removeChild(peekEl);
    peekEl = null; peekClosing = false;
    body.classList.remove('nav-peek', 'peek-out');
  }
  function closePeek() {
    clearTimeout(peekOut); peekOut = null;
    if (!peekEl || peekClosing) return;
    peekClosing = true;
    var c = peekEl; c.classList.add('peek-out'); body.classList.add('peek-out');
    setTimeout(function () { if (peekEl === c) killPeek(); }, 210);
  }
  document.addEventListener('pointermove', function (e) {
    if (peekEl) {
      if (peekClosing) return;
      if (nearPeek(e, true)) { clearTimeout(peekOut); peekOut = null; }
      else if (peekOut === null) { peekOut = setTimeout(closePeek, PEEK_OUT); }
      return;
    }
    if (body.classList.contains('nav-hidden')) {
      if (nearPeek(e, false)) { if (peekIn === null) peekIn = setTimeout(openPeek, PEEK_IN); }
      else { clearTimeout(peekIn); peekIn = null; }
    }
  });
  document.documentElement.addEventListener('mouseleave', function () { clearTimeout(peekIn); peekIn = null; if (peekEl && peekOut === null) peekOut = setTimeout(closePeek, PEEK_OUT); });
  document.addEventListener('focusin', function (e) {
    if (peekEl) { if (e.target.closest('.peek-clone') || e.target.id === 'navToggle') { clearTimeout(peekOut); peekOut = null; } return; }
    var src = e.target.closest && e.target.closest('.sidenav'); if (!src || !body.classList.contains('nav-hidden')) return;
    var idx = [].indexOf.call(src.querySelectorAll('a,button,summary,input'), e.target);
    openPeek();
    if (peekEl && idx > -1) { var tgt = peekEl.querySelectorAll('a,button,summary,input')[idx]; if (tgt) tgt.focus(); }
  });
  document.addEventListener('focusout', function (e) {
    if (!peekEl) return;
    var to = e.relatedTarget;
    if (to && (to.closest('.peek-clone') || to.id === 'navToggle')) return;
    if (peekOut === null) peekOut = setTimeout(closePeek, PEEK_OUT);
  });

  /* 3) Nav items (delegated so the peek copy works): Home is this page */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.sidenav .nitem');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.nav === 'home') { if (window.Dash) Dash.show('home'); var m = $('#main'); if (m) m.scrollTop = 0; return; }
    if (a.dataset.nav === 'dashboards') { if (window.Dash) Dash.show('list'); return; }
    notYet('The ' + a.querySelector('.nlabel').textContent.trim() + ' page');
  });

  /* 4) Search: centred on the bar, clamped clear of the groups either side */
  var gs = $('#gsearch'), gsInput = $('#gsInput'), gsResults = $('#gsResults'), gsScope = $('#gsScope'), gsScopeMenu = $('#gsScopeMenu'), gsScopeLbl = $('#gsScopeLbl');
  var SCOPE_NAMES = { all: 'All', lms: 'Vector LMS', ehs: 'Vector EHS' };
  function layoutSearch() {
    var bar = $('.topbar'); if (!bar || !gs) return;
    var br = bar.getBoundingClientRect();
    var left = gs.previousElementSibling, right = gs.nextElementSibling;
    while (left && left.getBoundingClientRect().width === 0) left = left.previousElementSibling;
    while (right && right.getBoundingClientRect().width === 0) right = right.nextElementSibling;
    var minL = (left ? left.getBoundingClientRect().right : br.left) + 16 - br.left;
    var maxR = (right ? right.getBoundingClientRect().left : br.right) - 16 - br.left;
    var W = Math.max(220, Math.min(420, maxR - minL));
    var ideal = br.width / 2 - W / 2;
    var x = Math.max(minL, Math.min(ideal, maxR - W));
    gs.style.left = Math.round(x) + 'px'; gs.style.width = Math.round(W) + 'px';
  }
  var lsRaf = null; function layoutSearchSoon() { if (lsRaf) return; lsRaf = requestAnimationFrame(function () { lsRaf = null; layoutSearch(); }); }
  window.addEventListener('resize', layoutSearchSoon);
  new MutationObserver(layoutSearchSoon).observe(body, { attributes: true, attributeFilter: ['class', 'data-density'] });
  layoutSearch(); setTimeout(layoutSearch, 300); setTimeout(layoutSearch, 1500);
  function gsOpen(o) { gsResults.hidden = !o; }
  function gsPlaceholder() {
    var s = body.dataset.searchscope || 'all';
    gsScopeLbl.textContent = SCOPE_NAMES[s];
    gsInput.placeholder = s === 'all' ? 'Search people, incidents, courses, locations' : 'Search ' + SCOPE_NAMES[s];
  }
  gsInput.addEventListener('input', function () { gsOpen(!!gsInput.value); });
  gsInput.addEventListener('focus', function () { if (gsInput.value) gsOpen(true); });
  gsScope.addEventListener('click', function (e) { e.stopPropagation(); gsScopeMenu.hidden = !gsScopeMenu.hidden; gsScope.setAttribute('aria-expanded', String(!gsScopeMenu.hidden)); });
  $$('button[data-scope]', gsScopeMenu).forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      body.dataset.searchscope = b.dataset.scope;
      $$('button', gsScopeMenu).forEach(function (x) { x.removeAttribute('aria-current'); });
      b.setAttribute('aria-current', 'true');
      gsScopeMenu.hidden = true; gsPlaceholder();
      if (gsInput.value) gsOpen(true);
    });
  });
  document.addEventListener('click', function (e) { if (!gs.contains(e.target)) { gsOpen(false); gsScopeMenu.hidden = true; } });
  gsPlaceholder();

  /* 5) Profile menu + side-nav text size */
  var avBtn = $('#avatarBtn'), uMenu = $('#userMenu');
  function setUMenu(o) { uMenu.hidden = !o; avBtn.setAttribute('aria-expanded', String(o)); }
  avBtn.addEventListener('click', function (e) { e.stopPropagation(); setUMenu(uMenu.hidden); });
  document.addEventListener('click', function (e) { if (!uMenu.hidden && !uMenu.contains(e.target)) setUMenu(false); });
  function setDensity(d) {
    if (d === 'default') delete body.dataset.density; else body.dataset.density = d;
    $$('.u-opt[data-density]', uMenu).forEach(function (o) { if (o.dataset.density === d) o.setAttribute('aria-current', 'true'); else o.removeAttribute('aria-current'); });
  }
  $$('.u-opt[data-density]', uMenu).forEach(function (o) { o.addEventListener('click', function (e) { e.stopPropagation(); setDensity(o.dataset.density); }); });
  $$('.u-item', uMenu).forEach(function (o) { o.addEventListener('click', function (e) { e.preventDefault(); setUMenu(false); notYet(o.textContent.trim()); }); });
  $$('.topbar [data-shell]').forEach(function (b) { b.addEventListener('click', function () { notYet(b.dataset.shell); }); });

  /* 6) Location picker in the nav (delegated; the tree itself is rendered by app.js) */
  function setLoc(open, wrap) {
    $$('.loc').forEach(function (w) {
      var m = w.querySelector('.loc-menu'), b = w.querySelector('.loc-btn');
      var on = open && (!wrap || w === wrap);
      if (m) m.hidden = !on;
      if (b) b.setAttribute('aria-expanded', String(on));
    });
    if (open && wrap) {
      var b = wrap.querySelector('.loc-btn').getBoundingClientRect(), m2 = wrap.querySelector('.loc-menu');
      m2.style.top = Math.round(b.bottom + 6) + 'px'; m2.style.left = Math.round(b.left) + 'px';
      var f = wrap.querySelector('.loc-find input'); if (f) { f.value = ''; filterLoc(wrap, ''); }
    }
  }
  function filterLoc(wrap, q) {
    q = q.trim().toLowerCase();
    $$('.loc-node', wrap).forEach(function (n) { n.style.display = ''; });
    if (!q) return;
    $$('.loc-node', wrap).forEach(function (n) {
      var txt = n.textContent.toLowerCase();
      n.style.display = txt.indexOf(q) > -1 ? '' : 'none';
      if (txt.indexOf(q) > -1) { var kids = n.querySelector(':scope > .loc-children'); if (kids) kids.hidden = false; n.classList.add('expanded'); }
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    var btn = t.closest && t.closest('.loc-btn');
    if (btn) { e.stopPropagation(); var wrap = btn.closest('.loc'); setLoc(wrap.querySelector('.loc-menu').hidden, wrap); return; }
    var tgl = t.closest && t.closest('.loc-tgl');
    if (tgl) {
      e.stopPropagation();
      var node = tgl.closest('.loc-node'), open = !node.classList.contains('expanded');
      node.classList.toggle('expanded', open); tgl.setAttribute('aria-expanded', String(open));
      var kids = node.querySelector(':scope > .loc-children'); if (kids) kids.hidden = !open;
      return;
    }
    var pick = t.closest && t.closest('.loc-pick');
    if (pick) {
      e.stopPropagation(); setLoc(false); killPeek();
      if (window.App) App.setScope(pick.dataset.scope, pick.dataset.dept || null);
      return;
    }
    if (t.closest && t.closest('.loc-menu')) { e.stopPropagation(); return; }
    if (!(t.closest && t.closest('.loc'))) setLoc(false);
  });
  document.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('.loc-find input')) filterLoc(e.target.closest('.loc'), e.target.value); });
  document.addEventListener('scroll', function (e) { if (e.target && e.target.closest && e.target.closest('.sidenav')) setLoc(false); }, true);
  window.addEventListener('resize', function () {
    $$('.loc').forEach(function (w) { var m = w.querySelector('.loc-menu'); if (m && !m.hidden) { var b = w.querySelector('.loc-btn').getBoundingClientRect(); m.style.top = Math.round(b.bottom + 6) + 'px'; m.style.left = Math.round(b.left) + 'px'; } });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    setLauncher(false); setLoc(false); gsOpen(false); gsScopeMenu.hidden = true; setUMenu(false);
    if (peekEl) closePeek();
  });

  window.Shell = {
    setNav: setNav, openPeek: openPeek, closeAll: function () { setLauncher(false); setLoc(false); gsOpen(false); gsScopeMenu.hidden = true; setUMenu(false); killPeek(); },
    setLauncher: setLauncher, setLoc: setLoc, layoutSearch: layoutSearch
  };

  /* 7) Deep links */
  var p = new URLSearchParams(location.search);
  if (p.get('nav') === 'closed') setNav(false);
  if (p.get('state') === 'peek') { setNav(false); setTimeout(openPeek, 80); }
  if (p.has('launcher')) setLauncher(true);
  if (p.has('location')) setTimeout(function () { setLoc(true, $('.sidenav:not(.peek-clone) .loc')); }, 400);
  if (p.has('search')) { gsInput.value = 'forklift'; gsOpen(true); }
  if (p.has('profile')) setUMenu(true);
  var dd = p.get('density'); if (dd === 'compact' || dd === 'comfortable') setDensity(dd);
  if (p.get('logopos') === 'bottom') body.classList.add('logo-bottom');
  if (p.get('logo') === 'off') body.classList.add('logo-off');
})();
