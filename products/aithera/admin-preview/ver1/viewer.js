/* ============================================================================
   Admin preview viewer — design mode (slide sorter) and play mode.
   See the comment at the top of index.html for what this page is.
   ========================================================================== */
(function () {
  var SHARPS = '../../lesson-presentation/clara/sharps.html';
  var q = new URLSearchParams(location.search);
  var FORMATS = ['video', 'listen', 'article'];
  var FMT_LABEL = { video: 'Watch', listen: 'Listen', article: 'Read' };
  var FMT_ICON = { video: 'fa-circle-play', listen: 'fa-headphones', article: 'fa-book-open' };

  /* ---- From the assign flow ------------------------------------------------ */
  var allowed = (q.get('formats') || FORMATS.join(',')).split(',').filter(function (f) { return FORMATS.indexOf(f) > -1; });
  if (!allowed.length) allowed = FORMATS.slice();
  var MODULES = q.get('modules') || '';
  var RET = q.get('return');

  /* ---- The learner being previewed. Starts as someone new to this. -------- */
  var PRESETS = {
    new:       { k1: '0', k2: '0', f1: 'agree', f3: 'agree', c1: '1', c2: '1' },
    ahead:     { k1: '1', k2: '1', f1: 'agree', f3: 'agree', c1: '1', c2: '1' },
    struggles: { k1: '0', k2: '0', f1: 'disagree', f3: 'disagree', c1: '0', c2: '0' }
  };
  var P = {
    lens: q.get('role') === 'public' ? 'public' : 'manufacturing',
    fmt: allowed.indexOf('video') > -1 ? 'video' : allowed[0],
    test_out: q.get('test_out') || '1', test_up: q.get('test_up') || '1', extra: q.get('extra') || '1'
  };
  Object.assign(P, PRESETS.new);

  /* ---- The module's screens on the video path, in order. Each column is one
     place in the course; its variants are the versions that can play there.
     `force` is the smallest change to a learner that serves a version, so a
     greyed slide still shows what that version really looks like. ---------- */
  var COLS = [
    { name: 'Course page', tag: ['n', 'Cover'], vs: [{ id: 'intro', label: 'Course page' }] },
    { name: 'Pre-check', tag: ['n', 'K · F'], vs: [{ id: 'battery', label: 'Four questions' }] },
    { name: 'Your updated path', tag: ['n', 'Path'], vs: [{ id: 'adjust', label: 'When an answer moves the path', force: { k1: '1', test_up: '1' } }] },
    { name: 'Choose a format', tag: ['n', 'Format'], vs: [{ id: 'podoffer', label: 'Watch, Listen or Read', force: { formats: FORMATS.join(',') } }] },
    { name: 'Case 1', tag: ['k', 'K1'], vs: [
      { id: 'c1base', label: 'Base', force: { k1: '0' } },
      { id: 'c1up', label: 'Harder', force: { k1: '1', test_up: '1' } }] },
    { name: 'Case 1 review', tag: ['k', 'K1'], vs: [{ id: 'c1rem', label: 'After a missed check', force: { c1: '0', extra: '1' } }] },
    { name: 'Case 2', tag: ['k', 'K2'], vs: [
      { id: 'c2base', label: 'Base', force: { k2: '0' } },
      { id: 'c2up', label: 'Harder', force: { k2: '1', test_up: '1' } }] },
    { name: 'Case 2 review', tag: ['k', 'K2'], vs: [{ id: 'c2rem', label: 'After a missed check', force: { c2: '0', extra: '1' } }] },
    { name: 'Engineering controls', tag: ['f', 'F2'], vs: [{ id: 'controls', label: 'Everyone' }] },
    { name: 'Case 3', tag: ['f', 'F1'], vs: [
      { id: 'case3', label: 'Base', force: { f1: 'agree' } },
      { id: 'case3rf', label: 'Longer story', force: { f1: 'disagree' } }] },
    { name: 'Debrief', tag: ['f', 'F3'], vs: [
      { id: 'debrief', label: 'Base', force: { f3: 'agree' } },
      { id: 'debriefrf', label: 'More room', force: { f3: 'disagree' } }] },
    { name: 'A sharp decision', tag: ['d', 'D'], vs: [{ id: 'scene', label: 'Practice' }] },
    { name: 'Your results', tag: ['n', 'Results'], vs: [{ id: 'record', label: 'Results' }] }
  ];
  // Screens off the video path (Listen and Read), named for play mode's strip.
  var OTHER = { podcast: ['Listen mode', 'n', 'Listen'], podcheck: ['Questions', 'n', 'Check'], listenreview: ['Review', 'n', 'Review'],
    listendone: ['Listen mode complete', 'n', 'Done'], reading: ['Reading', 'n', 'Read'], readcheck: ['Questions', 'n', 'Check'],
    readreview: ['Review', 'n', 'Review'], handoff: ['Live scenario', 'd', 'D'], enact: ['Live scenario', 'd', 'D'] };
  var BY_ID = {};
  COLS.forEach(function (c, ci) { c.vs.forEach(function (v) { BY_ID[v.id] = { col: c, ci: ci, v: v }; }); });
  function info(id) {
    if (BY_ID[id]) { var b = BY_ID[id]; return { name: b.col.name, variant: b.col.vs.length > 1 ? b.v.label : '', tag: b.col.tag, ci: b.ci }; }
    var o = OTHER[id] || [id, 'n', '—'];
    return { name: o[0], variant: '', tag: [o[1], o[2]], ci: -1 };
  }

  /* ---- Frame URLs -------------------------------------------------------- */
  function profFor(id, lit) {
    var b = BY_ID[id], p = Object.assign({}, P);
    if (!lit && b && b.v.force) Object.assign(p, b.v.force);
    return p;
  }
  function src(p, step, thumb) {
    var u = new URLSearchParams({ embed: '1', lens: p.lens, fmt: p.fmt, k1: p.k1, k2: p.k2, f1: p.f1, f3: p.f3, c1: p.c1, c2: p.c2,
      test_out: p.test_out, test_up: p.test_up, extra: p.extra, formats: p.formats || allowed.join(',') });
    if (MODULES) u.set('modules', MODULES);
    if (thumb) u.set('thumb', '1');
    if (step) u.set('step', step);
    return SHARPS + '?' + u.toString();
  }

  /* ---- The path, as the module itself reports it -------------------------- */
  var path = [], probeTok = 0;
  var probe = document.createElement('iframe');
  probe.setAttribute('aria-hidden', 'true'); probe.tabIndex = -1;
  probe.style.cssText = 'position:absolute;width:1280px;height:720px;left:-99999px;top:0;visibility:hidden';
  document.body.appendChild(probe);
  function readPath() {
    var tok = ++probeTok, want = src(P, 'intro', true);
    probe.src = want;
    return new Promise(function (done) {
      var t0 = Date.now();
      (function poll() {
        if (tok !== probeTok) return;
        try {
          var w = probe.contentWindow;
          if (w.location.href.indexOf(want.split('?')[1]) > -1 && w.Layered && w.Layered.visiblePath) {
            return done(w.Layered.visiblePath().map(function (s) { return s.id; }));
          }
        } catch (e) {}
        if (Date.now() - t0 > 10000) return done(null);
        setTimeout(poll, 120);
      })();
    });
  }

  /* ---- Learner panel -------------------------------------------------------- */
  var panel = document.getElementById('panel');
  function seg(key, opts) {
    return '<span class="mini-seg" role="radiogroup">' + opts.map(function (o) {
      var on = P[key] === o[0];
      return '<button type="button" role="radio" aria-checked="' + on + '"' + (on ? ' class="on"' : '') + ' data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + '</button>';
    }).join('') + '</span>';
  }
  function row(label, sub, key, opts) {
    return '<div class="lp-row"><span>' + label + '<small>' + sub + '</small></span>' + seg(key, opts) + '</div>';
  }
  var RW = [['1', 'Right'], ['0', 'Wrong']], AD = [['agree', 'Agrees'], ['disagree', 'Disagrees']];
  function presetNow() {
    return Object.keys(PRESETS).filter(function (k) { var p = PRESETS[k]; return Object.keys(p).every(function (x) { return P[x] === p[x]; }); })[0] || null;
  }
  function drawPanel() {
    var pre = presetNow();
    panel.innerHTML =
      '<div class="lp-sec" style="border-top:0;padding-top:0"><h3>Start from</h3><div class="lp-presets">' +
        [['new', 'New to this'], ['ahead', 'Already knows it'], ['struggles', 'Struggles']].map(function (p) {
          return '<button type="button" data-preset="' + p[0] + '"' + (pre === p[0] ? ' class="on"' : '') + '>' + p[1] + '</button>';
        }).join('') + '</div></div>' +
      '<div class="lp-sec"><h3>Sector version</h3><vaadin-select theme="outlined" id="lpSector" class="lp-sector" aria-label="Sector version"></vaadin-select></div>' +
      '<div class="lp-sec"><h3>Format</h3><span class="mini-seg lp-fmt" role="radiogroup" aria-label="Format">' + FORMATS.map(function (f) {
          var on = P.fmt === f, ok = allowed.indexOf(f) > -1;
          return '<button type="button" role="radio" aria-checked="' + on + '"' + (on ? ' class="on"' : '') + ' data-k="fmt" data-v="' + f + '"' +
            (ok ? '' : ' disabled title="Not offered in this assignment"') + '><i class="fa-solid ' + FMT_ICON[f] + '"></i>' + FMT_LABEL[f] + '</button>';
        }).join('') + '</span>' +
        (P.fmt !== 'video' ? '<p class="lp-note">Design view for ' + FMT_LABEL[P.fmt] + ' is coming next. Play runs it now.</p>' : '') + '</div>' +
      '<div class="lp-sec"><h3>Pre-check answers</h3>' +
        row('Question 1', 'Safe handling steps', 'k1', RW) +
        row('Question 2', 'Spotting hazards', 'k2', RW) +
        row('Statement 1', 'Why it matters', 'f1', AD) +
        row('Statement 2', 'What people really do', 'f3', AD) + '</div>' +
      '<div class="lp-sec"><h3>Checks in the lesson</h3>' +
        row('Case 1 check', 'After the first case', 'c1', RW) +
        row('Case 2 check', 'After the second case', 'c2', RW) + '</div>' +
      '<div class="lp-sec"><h3>This assignment</h3>' +
        sw('test_up', 'Harder checks', 'A right pre-check answer gets the harder case') +
        sw('extra', 'Extra practice', 'A missed check gets a review') +
        sw('test_out', 'Skip ahead', 'Only changes Listen in this module') +
        '<p class="lp-note">From your assignment. Changes here are for this preview only.</p></div>';

    var sel = document.getElementById('lpSector');
    sel.items = [{ label: 'Manufacturing', value: 'manufacturing' }, { label: 'Law enforcement', value: 'public' }];
    sel.value = P.lens;
    sel.addEventListener('change', function () { if (sel.value && sel.value !== P.lens) set({ lens: sel.value }); });
    panel.querySelectorAll('[data-k]').forEach(function (b) {
      b.addEventListener('click', function () { var o = {}; o[b.dataset.k] = b.dataset.v; set(o); });
    });
    panel.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () { set(PRESETS[b.dataset.preset]); });
    });
    panel.querySelectorAll('vwc-switch[data-sw]').forEach(function (s) {
      s.addEventListener('checked-change', function () { var o = {}; o[s.dataset.sw] = s.checked ? '1' : '0'; if (o[s.dataset.sw] !== P[s.dataset.sw]) set(o); });
    });
  }
  function sw(key, label, sub) {
    return '<div class="lp-switch"><span>' + label + '<small>' + sub + '</small></span>' +
      '<vwc-switch data-sw="' + key + '" accessible-name="' + label + '"' + (P[key] === '1' ? ' checked' : '') + '></vwc-switch></div>';
  }
  function set(changes) {
    var moved = Object.keys(changes).some(function (k) { return P[k] !== changes[k]; });
    if (!moved) return;
    Object.assign(P, changes);
    drawPanel();
    refresh();
  }

  /* ---- Design mode: the board --------------------------------------------- */
  var board = document.getElementById('board'), sizer = document.getElementById('sizer'), scroll = document.getElementById('scroll');
  var zoom = 0.6, ZOOMS = [0.25, 0.35, 0.45, 0.6, 0.75, 1, 1.25];
  var lit = {};
  function drawBoard() {
    var n = 0;
    board.innerHTML = COLS.map(function (c) {
      var shown = c.vs.some(function (v) { return lit[v.id]; });
      return '<section class="col' + (shown ? '' : ' skipped') + '" aria-label="' + c.name + '">' +
        '<div class="col-head">' + (shown ? '<span class="col-num">' + (++n) + '</span>' : '<span class="col-num">–</span>') + '<span>' + c.name + '</span>' +
          (shown ? '' : '<span class="col-skip">Not shown</span>') + '</div>' +
        c.vs.map(function (v) {
          var on = !!lit[v.id];
          return '<div class="slide ' + (on ? 'lit' : 'dim') + '" role="button" tabindex="0" data-step="' + v.id + '" aria-label="' + c.name + (c.vs.length > 1 ? ', ' + v.label : '') + (on ? ', on this learner’s path' : ', not on this learner’s path') + '">' +
            '<span class="slide-frame"><span class="ph"><i class="fa-solid fa-spinner fa-spin"></i></span><iframe tabindex="-1" title="" aria-hidden="true"></iframe></span>' +
            (on && c.vs.length > 1 ? '<span class="slide-you">This learner</span>' : '') +
            '<span class="slide-cap"><b class="kfd ' + c.tag[0] + '">' + c.tag[1] + '</b><b>' + (c.vs.length > 1 || v.force ? v.label : c.name) + '</b></span></div>';
        }).join('') + '</section>';
    }).join('') + '<svg class="av-links" id="links" aria-hidden="true"></svg>';
    board.querySelectorAll('.slide').forEach(function (el) {
      var id = el.dataset.step;
      el.dataset.want = src(profFor(id, !!lit[id]), id, true);
      el.addEventListener('click', function () { openPlay(id); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlay(id); } });
      watch(el);
    });
    applyZoom();
    drawLinks();
  }
  function drawLinks() {
    var svg = document.getElementById('links'); if (!svg) return;
    var pts = [], b = board.getBoundingClientRect();
    COLS.forEach(function (c) {
      var v = c.vs.filter(function (x) { return lit[x.id]; })[0]; if (!v) return;
      var r = board.querySelector('.slide[data-step="' + v.id + '"]').getBoundingClientRect();
      pts.push({ l: (r.left - b.left) / zoom, r: (r.right - b.left) / zoom, y: (r.top - b.top) / zoom + 72 });
    });
    svg.setAttribute('width', board.offsetWidth); svg.setAttribute('height', board.offsetHeight);
    var d = '';
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], z = pts[i], mx = (a.r + z.l) / 2;
      d += 'M' + a.r + ' ' + a.y + ' C' + mx + ' ' + a.y + ' ' + mx + ' ' + z.y + ' ' + z.l + ' ' + z.y + ' ';
    }
    svg.innerHTML = '<path d="' + d + '"/>';
  }

  /* Slides load as they scroll into view, a few at a time. */
  var queue = [], busy = 0, seen = new Set();
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { seen.add(e.target); load(e.target); } else seen.delete(e.target); });
  }, { root: scroll, rootMargin: '300px' });
  function watch(el) { io.observe(el); }
  function load(el) { if (queue.indexOf(el) < 0) queue.push(el); pump(); }
  function pump() {
    while (busy < 3 && queue.length) {
      var el = queue.shift(), f = el.querySelector('iframe');
      if (!el.isConnected || f.dataset.src === el.dataset.want) continue;
      busy++;
      f.dataset.src = el.dataset.want;
      (function (f, ph) {
        var done = false, fin = function () { if (done) return; done = true; busy--; if (ph) ph.hidden = true; pump(); };
        f.addEventListener('load', function () { setTimeout(fin, 500); }, { once: true });
        setTimeout(fin, 8000);
        f.src = f.dataset.src;
      })(f, el.querySelector('.ph'));
    }
  }

  /* Zoom: like a slide sorter. Buttons, Fit, or ctrl/⌘ + scroll. */
  function applyZoom() {
    board.style.transform = 'scale(' + zoom + ')';
    sizer.style.width = board.offsetWidth * zoom + 'px';
    sizer.style.height = board.offsetHeight * zoom + 'px';
    document.getElementById('zoomPct').textContent = Math.round(zoom * 100) + '%';
  }
  function fitZoom() { return Math.max(0.2, Math.min(1, scroll.clientWidth / board.offsetWidth, scroll.clientHeight / board.offsetHeight)); }
  function setZoom(z) { zoom = Math.max(0.2, Math.min(1.25, z)); applyZoom(); }
  function stepZoom(dir) {
    var next = dir > 0 ? ZOOMS.filter(function (z) { return z > zoom + .001; })[0] : ZOOMS.filter(function (z) { return z < zoom - .001; }).pop();
    if (next) setZoom(next);
  }
  document.getElementById('zoomIn').addEventListener('click', function () { stepZoom(1); });
  document.getElementById('zoomOut').addEventListener('click', function () { stepZoom(-1); });
  document.getElementById('zoomFit').addEventListener('click', function () { setZoom(fitZoom()); });
  scroll.addEventListener('wheel', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.93));
  }, { passive: false });

  /* ---- Play mode ------------------------------------------------------------- */
  var mode = 'design', playing = null, frame = document.getElementById('plFrame');
  function setMode(m) {
    mode = m;
    document.querySelectorAll('[data-mode]').forEach(function (b) {
      var on = b.dataset.mode === m; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on));
    });
    document.getElementById('design').hidden = m !== 'design';
    document.getElementById('play').hidden = m !== 'play';
    if (m === 'play' && !playing) openPlay(path[0] || 'intro');
    if (m === 'design') { frame.src = 'about:blank'; playing = null; requestAnimationFrame(function () { applyZoom(); drawLinks(); }); }
  }
  document.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  document.getElementById('toDesign').addEventListener('click', function () { setMode('design'); });

  function openPlay(id) {
    playing = id;
    if (mode !== 'play') setMode('play');
    frame.src = src(profFor(id, !!lit[id]), id, false);
    drawPlay();
  }
  function neighbor(dir) {
    var i = path.indexOf(playing);
    if (i > -1) return path[i + dir] || null;
    var ci = info(playing).ci;                     // a greyed version: step to the lit path either side of it
    var list = path.filter(function (id) { var c = info(id).ci; return dir > 0 ? c > ci : (c > -1 && c < ci); });
    return dir > 0 ? list[0] || null : list.pop() || null;
  }
  function drawPlay() {
    if (!playing) return;
    var on = path.indexOf(playing), inf = info(playing);
    document.getElementById('plWhere').innerHTML = '<b class="kfd ' + inf.tag[0] + '">' + inf.tag[1] + '</b><b>' + inf.name + (inf.variant ? ' · ' + inf.variant : '') + '</b>' +
      '<small>' + (on > -1 ? (on + 1) + ' of ' + path.length : 'Not on this learner’s path') + '</small>';
    document.getElementById('plPrev').disabled = !neighbor(-1);
    document.getElementById('plNext').disabled = !neighbor(1);
    document.getElementById('plStrip').innerHTML = path.map(function (id, i) {
      var f = info(id);
      return '<button type="button" class="pl-chip' + (id === playing ? ' on' : '') + '" data-go="' + id + '"><i>' + (i + 1) + '</i><b class="kfd ' + f.tag[0] + '">' + f.tag[1] + '</b>' + f.name + (f.variant ? ' · ' + f.variant : '') + '</button>';
    }).join('');
    document.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { openPlay(b.dataset.go); }); });
    var cur = document.querySelector('.pl-chip.on'); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  document.getElementById('plPrev').addEventListener('click', function () { var n = neighbor(-1); if (n) openPlay(n); });
  document.getElementById('plNext').addEventListener('click', function () { var n = neighbor(1); if (n) openPlay(n); });
  // The learner can also move on inside the screen (Continue, Back): follow it.
  setInterval(function () {
    if (mode !== 'play') return;
    try {
      var s = new URLSearchParams(frame.contentWindow.location.search).get('step');
      if (s && s !== playing) { playing = s; drawPlay(); }
    } catch (e) {}
  }, 500);

  /* ---- Update everything for the current learner ---------------------------- */
  function refresh() {
    var empty = document.getElementById('empty');
    var designable = P.fmt === 'video';
    empty.hidden = designable; scroll.hidden = !designable;
    if (!designable) {
      empty.innerHTML = '<div><h2>' + FMT_LABEL[P.fmt] + ' has its own design view, coming next</h2><p>' + FMT_LABEL[P.fmt] + ' takes a different shape from Watch, so it gets a layout of its own. You can play it now as this learner.</p>' +
        '<vaadin-button theme="primary" id="emptyPlay"><i class="fa-solid fa-play" style="margin-right:8px"></i>Play ' + FMT_LABEL[P.fmt] + '</vaadin-button></div>';
      document.getElementById('emptyPlay').addEventListener('click', function () { openPlay(path[0] || 'intro'); });
    }
    document.getElementById('pathInfo').textContent = 'Working out the path…';
    return readPath().then(function (ids) {
      path = ids || [];
      lit = {}; path.forEach(function (id) { lit[id] = true; });
      document.getElementById('pathInfo').textContent = ids ? 'This learner sees ' + path.length + ' screens' : 'Couldn’t read the path. Open this page from a web server.';
      if (designable) drawBoard();
      if (mode === 'play' && playing) {
        if (!lit[playing] && BY_ID[playing]) {          // same place, the version this learner now gets
          var ci = info(playing).ci, alt = COLS[ci].vs.filter(function (v) { return lit[v.id]; })[0];
          if (alt) playing = alt.id;
        }
        openPlay(playing);
      }
    });
  }

  document.getElementById('exitBtn').addEventListener('click', function () {
    var ok = false; try { ok = RET && new URL(RET, location.href).origin === location.origin; } catch (e) {}
    if (ok) location.href = RET; else if (history.length > 1) history.back(); else location.href = '../../bbp-admin/ver1/assign.html';
  });
  window.addEventListener('resize', function () { if (mode === 'design') drawLinks(); });

  /* Flow-map states (index.html's applyFlowState). */
  window.AdminViewer = {
    state: function (id) {
      if (PRESETS[id === 'design' ? 'new' : id]) { set(PRESETS[id === 'design' ? 'new' : id]); setMode('design'); }
      else if (id === 'play') setMode('play');
    }
  };

  customElements.whenDefined('vaadin-select').then(function () {
    drawPanel(); setMode('design');
    refresh().then(function () { setZoom(Math.max(0.45, fitZoom())); drawLinks(); });
  });
})();
