/* ============================================================================
   Admin preview viewer — Keynote-style design and play.
   See the comment at the top of index.html for what this page is.
   ========================================================================== */
(function () {
  var SHARPS = '../../lesson-presentation/clara/sharps.html';
  var q = new URLSearchParams(location.search);
  var FORMATS = ['video', 'listen', 'article'];
  var FMT_LABEL = { video: 'Watch', listen: 'Listen', article: 'Read' };
  var FMT_ICON = { video: 'fa-circle-play', listen: 'fa-headphones', article: 'fa-book-open' };
  var W = 1280, H = 720;                       // every screen renders at this size, then scales

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
     place in the course; its versions are what can play there. `force` is the
     smallest change to a learner that serves a version, so a greyed screen
     still shows what that version really looks like. `opts` are the learner
     options that matter for that screen: the panel leads with them. -------- */
  var COLS = [
    { deps: [], key: 'intro', name: 'Course page', tag: ['n', 'Cover'], opts: ['lens', 'fmt'],
      about: 'The course home. It shows the sector version and the format the learner prefers.',
      vs: [{ id: 'intro', label: 'Course page' }] },
    { deps: [], key: 'battery', name: 'Pre-check', tag: ['n', 'K · F'], opts: ['k1', 'k2', 'f1', 'f3'],
      about: 'Four questions before the lessons. Their answers decide which versions play next. Flip one to see the strip change.',
      vs: [{ id: 'battery', label: 'Four questions' }] },
    { deps: ['k1', 'k2', 'f1', 'f3', 'test_up'], key: 'adjust', name: 'Your updated path', tag: ['n', 'Path'], opts: ['k1', 'k2', 'test_up'],
      about: 'Shows only when a pre-check answer moved the path, and lists what moved.',
      vs: [{ id: 'adjust', label: 'When an answer moves the path', force: { k1: '1', test_up: '1' } }] },
    { deps: [], key: 'podoffer', name: 'Choose a format', tag: ['n', 'Format'], opts: ['fmt'],
      about: 'Where the learner picks Watch, Listen or Read. Skipped when the assignment offers only one.',
      vs: [{ id: 'podoffer', label: 'Watch, Listen or Read', force: { formats: FORMATS.join(',') } }] },
    { deps: ['k1'], key: 'c1', name: 'Case 1', tag: ['k', 'K1'], opts: ['k1', 'test_up', 'c1', 'extra'],
      about: 'The first case. Question 1 picks the version; the check at the end can add a review.',
      vs: [{ id: 'c1base', label: 'Base', force: { k1: '0' } }, { id: 'c1up', label: 'Harder', force: { k1: '1', test_up: '1' } }] },
    { deps: ['k1'], key: 'c1rem', name: 'Case 1 review', tag: ['k', 'K1'], opts: ['c1', 'extra'],
      about: 'Only after a missed Case 1 check, when Extra practice is on. Re-teaches, then asks the question again.',
      vs: [{ id: 'c1rem', label: 'After a missed check', force: { c1: '0', extra: '1' } }] },
    { deps: ['k2'], key: 'c2', name: 'Case 2', tag: ['k', 'K2'], opts: ['k2', 'test_up', 'c2', 'extra'],
      about: 'The second case. Question 2 picks the version; the check at the end can add a review.',
      vs: [{ id: 'c2base', label: 'Base', force: { k2: '0' } }, { id: 'c2up', label: 'Harder', force: { k2: '1', test_up: '1' } }] },
    { deps: ['k2'], key: 'c2rem', name: 'Case 2 review', tag: ['k', 'K2'], opts: ['c2', 'extra'],
      about: 'Only after a missed Case 2 check, when Extra practice is on. Re-teaches, then asks the question again.',
      vs: [{ id: 'c2rem', label: 'After a missed check', force: { c2: '0', extra: '1' } }] },
    { deps: [], key: 'controls', name: 'Engineering controls', tag: ['f', 'F2'], opts: ['lens'],
      about: 'Every learner sees this. Only the sector changes it.',
      vs: [{ id: 'controls', label: 'Everyone' }] },
    { deps: [], key: 'case3', name: 'Case 3', tag: ['f', 'F1'], opts: ['f1'],
      about: 'Statement 1 picks the version. The same statement is asked again over it.',
      vs: [{ id: 'case3', label: 'Base', force: { f1: 'agree' } }, { id: 'case3rf', label: 'Longer story', force: { f1: 'disagree' } }] },
    { deps: [], key: 'debrief', name: 'Debrief', tag: ['f', 'F3'], opts: ['f3'],
      about: 'Statement 2 picks the version. The same statement is asked again over it.',
      vs: [{ id: 'debrief', label: 'Base', force: { f3: 'agree' } }, { id: 'debriefrf', label: 'More room', force: { f3: 'disagree' } }] },
    { deps: [], key: 'scene', name: 'A sharp decision', tag: ['d', 'D'], opts: ['lens'],
      about: 'The practice. Every learner gets it; only the sector changes it.',
      vs: [{ id: 'scene', label: 'Practice' }] },
    { deps: 'all', key: 'record', name: 'Your results', tag: ['n', 'Results'], opts: ['k1', 'k2', 'c1', 'c2', 'f1', 'f3'],
      about: 'Results reflect every answer, before and after.',
      vs: [{ id: 'record', label: 'Results' }] }
  ];
  // Screens off the video path (Listen and Read), named for play's strip.
  var OTHER = { podcast: ['Listen mode', 'n', 'Listen'], podcheck: ['Questions', 'n', 'Check'], listenreview: ['Review', 'n', 'Review'],
    listendone: ['Listen mode complete', 'n', 'Done'], reading: ['Reading', 'n', 'Read'], readcheck: ['Questions', 'n', 'Check'],
    readreview: ['Review', 'n', 'Review'], handoff: ['Live scenario', 'd', 'D'], enact: ['Live scenario', 'd', 'D'] };
  var BY_ID = {};
  COLS.forEach(function (c, ci) { c.vs.forEach(function (v) { BY_ID[v.id] = { col: c, ci: ci, v: v }; }); });
  function info(id) {
    if (BY_ID[id]) { var b = BY_ID[id]; return { name: b.col.name, variant: b.col.vs.length > 1 ? b.v.label : '', tag: b.col.tag, ci: b.ci, col: b.col }; }
    var o = OTHER[id] || [id, 'n', '—'];
    return { name: o[0], variant: '', tag: [o[1], o[2]], ci: -1, col: null };
  }

  /* ---- Learner options: what each does, in plain words ---------------------- */
  var RW = [['1', 'Right'], ['0', 'Wrong']], AD = [['agree', 'Agrees'], ['disagree', 'Disagrees']];
  var on = function (k) { return P[k] === '1'; };
  var OPTS = {
    lens: { label: 'Sector version', type: 'sector', effect: function () { return 'Examples, wording and the practice scenario follow the sector.'; } },
    fmt: { label: 'Format', type: 'fmt', effect: function () { return P.fmt === 'video' ? 'Each lesson is a short video with a question after it.' : FMT_LABEL[P.fmt] + ' changes the whole module. Play it to see.'; } },
    k1: { label: 'Question 1', sub: 'Safe handling steps', type: 'seg', vals: RW,
      effect: function () { return !on('k1') ? 'Case 1 plays its base version.' : on('test_up') ? 'Case 1 plays its harder version.' : 'Harder checks is off, so Case 1 stays the base version.'; } },
    k2: { label: 'Question 2', sub: 'Spotting hazards', type: 'seg', vals: RW,
      effect: function () { return !on('k2') ? 'Case 2 plays its base version.' : on('test_up') ? 'Case 2 plays its harder version.' : 'Harder checks is off, so Case 2 stays the base version.'; } },
    f1: { label: 'Statement 1', sub: 'Why it matters', type: 'seg', vals: AD,
      effect: function () { return P.f1 === 'disagree' ? 'Case 3 tells the longer story.' : 'Case 3 tells the base story.'; } },
    f3: { label: 'Statement 2', sub: 'What people really do', type: 'seg', vals: AD,
      effect: function () { return P.f3 === 'disagree' ? 'The debrief gives it more room.' : 'The debrief plays its base version.'; } },
    c1: { label: 'Case 1 check', sub: 'The question after Case 1', type: 'seg', vals: RW,
      effect: function () { return on('c1') ? 'Straight on to Case 2.' : on('extra') ? 'A short review follows, then the same question again.' : 'Extra practice is off, so the course moves straight on.'; } },
    c2: { label: 'Case 2 check', sub: 'The question after Case 2', type: 'seg', vals: RW,
      effect: function () { return on('c2') ? 'Straight on to Engineering controls.' : on('extra') ? 'A short review follows, then the same question again.' : 'Extra practice is off, so the course moves straight on.'; } },
    test_up: { label: 'Harder checks', sub: 'From your assignment', type: 'sw',
      effect: function () { return on('test_up') ? 'A right pre-check answer gets the harder case.' : 'Everyone gets the base cases.'; } },
    extra: { label: 'Extra practice', sub: 'From your assignment', type: 'sw',
      effect: function () { return on('extra') ? 'A missed check gets a short review.' : 'A missed check moves straight on.'; } },
    test_out: { label: 'Skip ahead', sub: 'From your assignment', type: 'sw',
      effect: function () { return 'Only changes Listen in this module.'; } }
  };
  var ALL_OPTS = ['lens', 'fmt', 'k1', 'k2', 'f1', 'f3', 'c1', 'c2', 'test_up', 'extra', 'test_out'];

  /* ---- Frame URLs -------------------------------------------------------- */
  function profFor(id, isLit) {
    var b = BY_ID[id], p = Object.assign({}, P);
    if (!isLit && b && b.v.force) Object.assign(p, b.v.force);
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
  var path = [], lit = {}, probeTok = 0;
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

  /* ---- Options panel: this screen's options first, then everything ----------- */
  var panel = document.getElementById('panel');
  function optHTML(k) {
    var o = OPTS[k], ctl;
    if (o.type === 'seg') {
      ctl = '<span class="mini-seg" role="radiogroup" aria-label="' + o.label + '">' + o.vals.map(function (v) {
        var sel = P[k] === v[0];
        return '<button type="button" role="radio" aria-checked="' + sel + '"' + (sel ? ' class="on"' : '') + ' data-k="' + k + '" data-v="' + v[0] + '">' + v[1] + '</button>';
      }).join('') + '</span>';
      return '<div class="lp-opt"><div class="lp-row"><span>' + o.label + '<small>' + o.sub + '</small></span>' + ctl + '</div>' + eff(k) + '</div>';
    }
    if (o.type === 'sw') {
      return '<div class="lp-opt"><div class="lp-switch"><span>' + o.label + '<small>' + o.sub + '</small></span>' +
        '<vwc-switch data-sw="' + k + '" accessible-name="' + o.label + '"' + (on(k) ? ' checked' : '') + '></vwc-switch></div>' + eff(k) + '</div>';
    }
    if (o.type === 'sector') {
      return '<div class="lp-opt"><div class="lp-row" style="grid-template-columns:1fr"><span>' + o.label + '</span></div>' +
        '<vaadin-select theme="outlined" class="lp-sector" data-sector aria-label="Sector version"></vaadin-select>' + eff(k) + '</div>';
    }
    return '<div class="lp-opt"><div class="lp-row" style="grid-template-columns:1fr"><span>' + o.label + '</span></div>' +
      '<span class="mini-seg lp-fmt" role="radiogroup" aria-label="Format">' + FORMATS.map(function (f) {
        var sel = P.fmt === f, ok = allowed.indexOf(f) > -1;
        return '<button type="button" role="radio" aria-checked="' + sel + '"' + (sel ? ' class="on"' : '') + ' data-k="fmt" data-v="' + f + '"' +
          (ok ? '' : ' disabled title="Not offered in this assignment"') + '><i class="fa-solid ' + FMT_ICON[f] + '"></i>' + FMT_LABEL[f] + '</button>';
      }).join('') + '</span>' + eff(k) + '</div>';
  }
  function eff(k) { return '<p class="lp-effect"><i class="fa-solid fa-arrow-turn-down-right"></i>' + OPTS[k].effect() + '</p>'; }
  function presetNow() {
    return Object.keys(PRESETS).filter(function (k) { var p = PRESETS[k]; return Object.keys(p).every(function (x) { return P[x] === p[x]; }); })[0] || null;
  }
  var allOpen = false;
  function drawPanel() {
    var c = sel && BY_ID[sel] ? BY_ID[sel].col : null, pre = presetNow();
    var here = c ? c.opts : [], rest = ALL_OPTS.filter(function (k) { return here.indexOf(k) < 0; });
    panel.innerHTML =
      '<div class="lp-sec"><h3>Try it as a learner who is…</h3><div class="lp-presets">' +
        [['new', 'New to this'], ['ahead', 'Already knows it'], ['struggles', 'Struggling']].map(function (p) {
          return '<button type="button" data-preset="' + p[0] + '"' + (pre === p[0] ? ' class="on"' : '') + '>' + p[1] + '</button>';
        }).join('') + '</div></div>' +
      (c ? '<div class="lp-here"><h2><b class="kfd ' + c.tag[0] + '">' + c.tag[1] + '</b>' + c.name + '</h2><p>' + c.about + '</p>' +
        here.map(optHTML).join('') + '</div>' : '') +
      '<vaadin-details class="lp-all"' + (allOpen ? ' opened' : '') + '><vaadin-details-summary slot="summary">All learner options</vaadin-details-summary>' +
        rest.map(optHTML).join('') + '<p class="lp-note">Assignment settings come from your assignment. Changes here are for this preview only.</p></vaadin-details>';

    panel.querySelectorAll('[data-sector]').forEach(function (s) {
      s.items = [{ label: 'Manufacturing', value: 'manufacturing' }, { label: 'Law enforcement', value: 'public' }];
      s.value = P.lens;
      s.addEventListener('change', function () { if (s.value && s.value !== P.lens) set({ lens: s.value }); });
    });
    panel.querySelectorAll('[data-k]').forEach(function (b) {
      b.addEventListener('click', function () { var o = {}; o[b.dataset.k] = b.dataset.v; set(o); });
    });
    panel.querySelectorAll('[data-preset]').forEach(function (b) { b.addEventListener('click', function () { set(PRESETS[b.dataset.preset]); }); });
    panel.querySelectorAll('vwc-switch[data-sw]').forEach(function (s) {
      s.addEventListener('checked-change', function () { var o = {}; o[s.dataset.sw] = s.checked ? '1' : '0'; if (o[s.dataset.sw] !== P[s.dataset.sw]) set(o); });
    });
    var det = panel.querySelector('.lp-all');
    det.addEventListener('opened-changed', function (e) { allOpen = e.detail.value; });
  }
  function set(changes) {
    if (!Object.keys(changes).some(function (k) { return P[k] !== changes[k]; })) return;
    Object.assign(P, changes);
    drawPanel();
    refresh();
  }

  /* ---- Stage: the selected screen, live ------------------------------------ */
  var sel = 'intro', mode = 'design';
  var stage = document.getElementById('stage'), stScroll = document.getElementById('stScroll'), sizer = document.getElementById('stSizer');
  var frame = document.getElementById('stFrame'), pan = document.getElementById('stPan');
  var zoom = 1, fitMode = true, panOn = false;
  function fit() { return Math.max(0.1, Math.min((stage.clientWidth - 4) / W, (stage.clientHeight - 4) / H)); }
  function applyZoom(animate) {
    if (fitMode) zoom = fit();
    sizer.classList.toggle('animate', !!animate);
    sizer.style.width = W * zoom + 'px'; sizer.style.height = H * zoom + 'px';
    frame.style.transform = 'scale(' + zoom + ')';
    document.getElementById('zoomPct').textContent = Math.round(zoom * 100) + '%';
    // Past "fit", dragging moves the view; at fit, the screen is clickable again.
    setPan(zoom > fit() + 0.01);
    if (animate) setTimeout(function () { sizer.classList.remove('animate'); }, 400);
  }
  function setZoom(z) { fitMode = false; zoom = Math.max(0.15, Math.min(2, z)); if (Math.abs(zoom - fit()) < 0.01) fitMode = true; applyZoom(true); }
  function setPan(v) { panOn = v; pan.hidden = !v; document.getElementById('panBtn').setAttribute('aria-pressed', String(v)); }
  document.getElementById('zoomIn').addEventListener('click', function () { setZoom(zoom * 1.25); });
  document.getElementById('zoomOut').addEventListener('click', function () { setZoom(zoom / 1.25); });
  document.getElementById('zoomFit').addEventListener('click', function () { fitMode = true; applyZoom(true); });
  document.getElementById('panBtn').addEventListener('click', function () { setPan(!panOn); });
  stage.addEventListener('wheel', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.93));
  }, { passive: false });
  dragScroll(pan, stScroll, 'both');
  window.addEventListener('resize', function () { drawLinks(); });
  // Re-fit whenever the stage changes size (window, the strip filling in, play hiding the chrome).
  new ResizeObserver(function () { if (fitMode) applyZoom(false); }).observe(stage);

  function loadStage() {
    var want = src(profFor(sel, !!lit[sel]), sel, false);
    if (frame.dataset.src !== want) { frame.dataset.src = want; frame.src = want; }
    drawWhere();
  }
  function select(id) {
    sel = id;
    loadStage();
    drawPanel();
    markNav();
  }
  // The learner can also move on inside the screen (Continue, Back): follow it.
  setInterval(function () {
    try {
      var s = new URLSearchParams(frame.contentWindow.location.search).get('step');
      if (s && s !== sel) { sel = s; frame.dataset.src = frame.contentWindow.location.href; drawWhere(); drawPanel(); markNav(); }
    } catch (e) {}
  }, 500);

  function neighbor(dir) {
    var i = path.indexOf(sel);
    if (i > -1) return path[i + dir] || null;
    var ci = info(sel).ci;                         // a greyed version: step to the lit path either side of it
    var list = path.filter(function (id) { var c = info(id).ci; return dir > 0 ? c > ci : (c > -1 && c < ci); });
    return dir > 0 ? list[0] || null : list.pop() || null;
  }
  function drawWhere() {
    var at = path.indexOf(sel), inf = info(sel), b = BY_ID[sel];
    document.getElementById('stWhere').innerHTML = '<b class="kfd ' + inf.tag[0] + '">' + inf.tag[1] + '</b><b>' + inf.name + (inf.variant ? ' · ' + inf.variant : '') + '</b>' +
      (at > -1 ? '<small>' + (at + 1) + ' of ' + path.length + '</small>'
        : '<small class="off">Not on this learner’s path</small>' + (b && b.v.force ? '<button type="button" class="use" id="useThis">Make this the learner</button>' : ''));
    var use = document.getElementById('useThis');
    if (use) use.addEventListener('click', function () { set(BY_ID[sel].v.force); });
    document.getElementById('prevBtn').disabled = !neighbor(-1);
    document.getElementById('nextBtn').disabled = !neighbor(1);
    drawStrip();
  }
  document.getElementById('prevBtn').addEventListener('click', function () { var n = neighbor(-1); if (n) select(n); });
  document.getElementById('nextBtn').addEventListener('click', function () { var n = neighbor(1); if (n) select(n); });

  /* ---- Thumbnail strip (design) -------------------------------------------- */
  var nvScroll = document.getElementById('nvScroll'), nvBoard = document.getElementById('nvBoard');
  var lastLit = {};
  // One thumbnail per place in the course. It shows the version being looked
  // at there: the selected one if it's in this column, else this learner's,
  // else the first. A column with more than one version carries a stacked
  // edge and a pill per version under it; the learner's own pill has a dot,
  // and Harder has its own arrow, so "a harder version exists" reads even
  // while Base is lit. A pill opens that version on the big screen.
  function viewing(c) {
    var ids = c.vs.map(function (v) { return v.id; });
    if (ids.indexOf(sel) > -1) return sel;
    var l = c.vs.filter(function (v) { return lit[v.id]; })[0];
    return (l || c.vs[0]).id;
  }
  /* A thumbnail's address carries only what that screen depends on: a fixed
     neutral learner, plus the options its column lists in `deps` (sector and
     format for every screen), plus the version's own `force`. So flipping
     Question 1 changes the address of Case 1 and "Your updated path" only,
     and only those reload; every other thumbnail keeps its loaded page. The
     big screen still gets the whole learner. */
  var NEUTRAL = { k1: '0', k2: '0', f1: 'agree', f3: 'agree', c1: '1', c2: '1', test_out: '1', test_up: '1', extra: '1' };
  var ALWAYS = ['lens', 'fmt'];
  function thumbProf(c, v) {
    var p = Object.assign({}, NEUTRAL, { formats: allowed.join(',') });
    (c.deps === 'all' ? Object.keys(P) : ALWAYS.concat(c.deps || [])).forEach(function (k) { p[k] = P[k]; });
    return Object.assign(p, v.force || {});
  }
  function pillsHTML(c, id) {
    return '<span class="th-vs" role="radiogroup" aria-label="Versions">' + c.vs.map(function (v) {
      var up = /harder/i.test(v.label);
      return '<button type="button" role="radio" aria-checked="' + (v.id === id) + '" class="th-v' + (v.id === id ? ' on' : '') + (lit[v.id] ? ' path' : '') + '" data-v="' + v.id + '" title="' +
        v.label + (lit[v.id] ? ' (this learner)' : '') + '">' + (up ? '<i class="fa-solid fa-arrow-trend-up"></i>' : '') + v.label + '</button>';
    }).join('') + '</span>';
  }
  // The column's shell is built once; updateCol() changes it in place from then
  // on. Rebuilding would mean new frames, and a new frame always reloads.
  function colHTML(c, ci) {
    var many = c.vs.length > 1;
    return '<section class="nv-col" data-col="' + ci + '">' +
      '<div class="nv-head"><span class="nv-num"></span><span class="nv-name">' + c.name + '</span></div>' +
      '<div class="th' + (many ? ' stack' : '') + '">' +
        '<span class="th-frame" role="button" tabindex="0">' +
          '<span class="ph"><i class="fa-solid fa-spinner fa-spin"></i></span><iframe tabindex="-1" title="" aria-hidden="true"></iframe>' +
          // The K/F/D tag sits on the thumbnail's top corner, so under it only the version pills remain.
          '<b class="kfd th-tag ' + c.tag[0] + '" title="' + ({ k: 'Knowledge', f: 'Feeling', d: 'Doing' }[c.tag[0]] || c.tag[1]) + '">' + c.tag[1] + '</b></span>' +
        (many ? '<span class="th-cap"></span>' : '') +
      '</div></section>';
  }
  function wireCol(el) {
    var th = el.querySelector('.th'), fr = th.querySelector('.th-frame');
    fr.addEventListener('click', function () { if (!nvScroll.classList.contains('dragged')) select(th.dataset.step); });
    fr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(th.dataset.step); } });
    var cap = th.querySelector('.th-cap');
    if (cap) cap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]');
      if (b && !nvScroll.classList.contains('dragged')) select(b.dataset.v);
    });
    io.observe(th); far.observe(th);
  }
  function updateCol(ci, num, pulse) {
    var c = COLS[ci], el = nvBoard.querySelector('.nv-col[data-col="' + ci + '"]'); if (!el) return;
    var shown = c.vs.some(function (v) { return lit[v.id]; }), id = viewing(c), isLit = !!lit[id], b = BY_ID[id];
    var th = el.querySelector('.th'), fr = th.querySelector('.th-frame');
    el.classList.toggle('skipped', !shown);
    el.classList.toggle('is-sel', id === sel);
    el.setAttribute('aria-label', c.name + (shown ? '' : ', not shown to this learner'));
    el.querySelector('.nv-num').textContent = shown ? num : '–';
    th.dataset.step = id;
    th.classList.toggle('lit', isLit); th.classList.toggle('dim', !isLit); th.classList.toggle('sel', id === sel);
    if (pulse && isLit) { th.classList.remove('changed'); void th.offsetWidth; th.classList.add('changed'); }
    fr.setAttribute('aria-label', c.name + (c.vs.length > 1 ? ', ' + b.v.label : '') + (isLit ? ', on this learner’s path' : ', not on this learner’s path'));
    var cap = th.querySelector('.th-cap'); if (cap) cap.innerHTML = pillsHTML(c, id);
    th.dataset.want = src(thumbProf(c, b.v), id, true);
    if (th.dataset.near === '1') load(th);          // in view: refresh now if its address changed
  }
  function drawNav(changedCols) {
    if (!nvBoard.querySelector('.nv-col')) {
      nvBoard.innerHTML = COLS.map(colHTML).join('') + '<svg class="nv-links" id="nvLinks" aria-hidden="true"></svg>';
      nvBoard.querySelectorAll('.nv-col').forEach(wireCol);
    }
    var n = 0;
    COLS.forEach(function (c, ci) {
      var shown = c.vs.some(function (v) { return lit[v.id]; });
      updateCol(ci, shown ? ++n : 0, changedCols[ci]);
    });
    markNav();
    drawLinks();
  }
  // Selecting updates only the columns whose thumbnail changes.
  function markNav() {
    var n = 0;
    COLS.forEach(function (c, ci) {
      var shown = c.vs.some(function (v) { return lit[v.id]; }); if (shown) n++;
      var el = nvBoard.querySelector('.nv-col[data-col="' + ci + '"]'); if (!el) return;
      var th = el.querySelector('.th');
      if (th.dataset.step !== viewing(c) || el.classList.contains('is-sel') !== (viewing(c) === sel)) updateCol(ci, shown ? n : 0, false);
    });
    var s = nvBoard.querySelector('.th.sel');
    if (s && mode === 'design') {
      var r = s.getBoundingClientRect(), v = nvScroll.getBoundingClientRect();
      if (r.left < v.left || r.right > v.right) nvScroll.scrollTo({ left: nvScroll.scrollLeft + r.left - v.left - v.width / 2 + r.width / 2, behavior: 'smooth' });
    }
  }
  // The line joining this learner's screens. Neighbours join straight, side
  // to side. Across screens this learner skips, it leaves the side of the last
  // shown card, dips under the skipped ones and comes back up into the next,
  // so it never runs behind a card it doesn't pass through.
  function drawLinks() {
    var svg = document.getElementById('nvLinks'); if (!svg) return;
    var b = nvBoard.getBoundingClientRect(), cols = [];
    COLS.forEach(function (c, ci) {
      var r = nvBoard.querySelector('.nv-col[data-col="' + ci + '"] .th-frame').getBoundingClientRect();
      cols.push({ shown: c.vs.some(function (x) { return lit[x.id]; }), l: r.left - b.left, r: r.right - b.left, y: r.top - b.top + r.height / 2, bottom: r.bottom - b.top });
    });
    var d = '', prev = null, low = 0;
    cols.forEach(function (c) {
      if (!c.shown) { if (prev) low = Math.max(low, c.bottom); return; }
      if (prev) {
        if (!low) d += 'M' + prev.r + ' ' + prev.y + ' L' + c.l + ' ' + c.y + ' ';
        else {
          var y = low + 12, r = 14;            // under the skipped cards, with rounded corners
          d += 'M' + prev.r + ' ' + prev.y + ' H' + (prev.r + 8 - r + r) +
            ' Q' + (prev.r + 8 + r) + ' ' + prev.y + ' ' + (prev.r + 8 + r) + ' ' + (prev.y + r) +
            ' V' + (y - r) + ' Q' + (prev.r + 8 + r) + ' ' + y + ' ' + (prev.r + 8 + 2 * r) + ' ' + y +
            ' H' + (c.l - 8 - 2 * r) + ' Q' + (c.l - 8 - r) + ' ' + y + ' ' + (c.l - 8 - r) + ' ' + (y - r) +
            ' V' + (c.y + r) + ' Q' + (c.l - 8 - r) + ' ' + c.y + ' ' + (c.l - 8) + ' ' + c.y + ' H' + c.l + ' ';
        }
      }
      prev = c; low = 0;
    });
    svg.setAttribute('width', nvBoard.scrollWidth); svg.setAttribute('height', nvBoard.offsetHeight);
    svg.innerHTML = '<path d="' + d + '"/>';
  }
  dragScroll(nvScroll, nvScroll, 'x');
  // A mouse wheel moves the strip sideways.
  nvScroll.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); nvScroll.scrollLeft += e.deltaY; }
  }, { passive: false });

  /* Thumbnails load as they come near the view, a few at a time, and unload
     once they're well out of it, so a long course never holds more than about
     a screenful and a half of live pages. */
  var queue = [], busy = 0;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.dataset.near = e.isIntersecting ? '1' : ''; if (e.isIntersecting) load(e.target); });
  }, { root: nvScroll, rootMargin: '0px 400px' });
  var far = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) unload(e.target); });
  }, { root: nvScroll, rootMargin: '0px 900px' });
  function unload(el) {
    var f = el.querySelector('iframe'), ph = el.querySelector('.ph');
    var i = queue.indexOf(el); if (i > -1) queue.splice(i, 1);
    if (!f.dataset.src) return;
    f.src = 'about:blank'; f.dataset.src = '';
    if (ph) ph.hidden = false;
  }
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

  /* Drag to move around: the zoomed screen (both ways) or the strip (sideways).
     A drag of a few pixels or more swallows the click that ends it. */
  function dragScroll(handle, box, axis) {
    var sx, sy, l, t, moved = false, down = false;
    handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sy = e.clientY; l = box.scrollLeft; t = box.scrollTop;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return;
      if (!moved) { moved = true; box.classList.add('dragging'); handle.classList.add('dragging'); }
      box.scrollLeft = l - dx; if (axis === 'both') box.scrollTop = t - dy;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      box.classList.remove('dragging'); handle.classList.remove('dragging');
      if (moved) { box.classList.add('dragged'); setTimeout(function () { box.classList.remove('dragged'); }, 0); }
    });
  }

  /* ---- Play: the path as chips ----------------------------------------------- */
  function drawStrip() {
    var strip = document.getElementById('plStrip');
    strip.innerHTML = path.map(function (id, i) {
      var f = info(id);
      return '<button type="button" class="pl-chip' + (id === sel ? ' on' : '') + '" data-go="' + id + '"><i>' + (i + 1) + '</i><b class="kfd ' + f.tag[0] + '">' + f.tag[1] + '</b>' + f.name + (f.variant ? ' · ' + f.variant : '') + '</button>';
    }).join('');
    strip.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { select(b.dataset.go); }); });
    var cur = strip.querySelector('.pl-chip.on'); if (cur && mode === 'play') cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  /* ---- Modes ------------------------------------------------------------------ */
  function setMode(m) {
    mode = m;
    document.body.classList.toggle('playing', m === 'play');
    document.body.classList.toggle('designing', m === 'design');
    document.querySelectorAll('[data-mode]').forEach(function (b) {
      var o = b.dataset.mode === m; b.classList.toggle('on', o); b.setAttribute('aria-checked', String(o));
    });
    // Play fills the space the light chrome leaves; the screen zooms up into it.
    fitMode = true;
    document.getElementById('stOff').hidden = P.fmt === 'video' || m === 'play';
    if (m === 'play' && !frame.dataset.src) loadStage();
    requestAnimationFrame(function () { applyZoom(true); drawLinks(); markNav(); drawStrip(); });
  }
  document.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  document.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input, textarea, vaadin-select, [contenteditable]')) return;
    if (e.key === 'ArrowRight') { var n = neighbor(1); if (n) select(n); }
    else if (e.key === 'ArrowLeft') { var p = neighbor(-1); if (p) select(p); }
    else if (e.key === 'Escape' && mode === 'play') setMode('design');
  });

  /* ---- Update everything for the current learner ---------------------------- */
  function refresh() {
    var off = document.getElementById('stOff'), designable = P.fmt === 'video';
    // Listen and Read get design views of their own later. Until then design
    // shows a card in place of the screen and the strip; play runs them.
    off.hidden = designable || mode === 'play';
    document.getElementById('nav').classList.toggle('blank', !designable);
    if (!designable) {
      off.innerHTML = '<div><h2>' + FMT_LABEL[P.fmt] + ' has its own design view, coming next</h2><p>' + FMT_LABEL[P.fmt] + ' takes a different shape from Watch, so it gets a layout of its own. You can play it now as this learner.</p>' +
        '<vaadin-button theme="primary" id="offPlay"><i class="fa-solid fa-play" style="margin-right:8px"></i>Play ' + FMT_LABEL[P.fmt] + '</vaadin-button></div>';
      document.getElementById('offPlay').addEventListener('click', function () { setMode('play'); refresh(); });
    }
    document.getElementById('pathInfo').textContent = 'Working out the path…';
    return readPath().then(function (ids) {
      var before = {};
      COLS.forEach(function (c, ci) { before[ci] = c.vs.filter(function (v) { return lit[v.id]; }).map(function (v) { return v.id; }).join(); });
      path = ids || [];
      lit = {}; path.forEach(function (id) { lit[id] = true; });
      var changed = {}, any = Object.keys(lastLit).length > 0;
      COLS.forEach(function (c, ci) { if (any && before[ci] !== c.vs.filter(function (v) { return lit[v.id]; }).map(function (v) { return v.id; }).join()) changed[ci] = true; });
      lastLit = lit;
      document.getElementById('pathInfo').textContent = ids ? 'This learner sees ' + path.length + ' screens' : 'Couldn’t read the path. Open this page from a web server.';
      // Keep the same place in the course: if the screen's version changed for this learner, show the new one.
      var b = BY_ID[sel];
      if (b && !lit[sel]) { var alt = b.col.vs.filter(function (v) { return lit[v.id]; })[0]; if (alt) sel = alt.id; }
      if (!b && path.indexOf(sel) < 0) sel = path[0] || 'intro';
      if (designable) drawNav(changed); else nvBoard.innerHTML = '';
      drawPanel();
      if (designable || mode === 'play') loadStage(); else { frame.src = 'about:blank'; frame.dataset.src = ''; drawWhere(); }
    });
  }

  document.getElementById('exitBtn').addEventListener('click', function () {
    var ok = false; try { ok = RET && new URL(RET, location.href).origin === location.origin; } catch (e) {}
    if (ok) location.href = RET; else if (history.length > 1) history.back(); else location.href = '../../bbp-admin/ver1/assign.html';
  });

  /* Flow-map states (index.html's applyFlowState). */
  var STATES = { design: 'intro', precheck: 'battery', case1: 'c1base' };
  window.AdminViewer = {
    state: function (id) {
      if (STATES[id]) { setMode('design'); select(BY_ID[STATES[id]] && !lit[STATES[id]] ? (BY_ID[STATES[id]].col.vs.filter(function (v) { return lit[v.id]; })[0] || {}).id || STATES[id] : STATES[id]); }
      else if (id === 'play') setMode('play');
    }
  };

  customElements.whenDefined('vaadin-select').then(function () {
    drawPanel(); setMode('design');
    refresh();
  });
})();
