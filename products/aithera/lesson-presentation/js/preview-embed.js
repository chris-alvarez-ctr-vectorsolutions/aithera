/* ==========================================================================
   Preview embed (2026-10-27)

   The admin preview viewer (products/aithera/admin-preview) shows this module
   as a sorter of small slides and plays any one of them full size. Each of
   those is this page in an iframe, loaded with `embed=1` and a learner
   profile on its URL. Without `embed`, nothing here runs: a learner never
   meets any of it.

   With it:
   - Storage is the frame's own. sessionStorage and the two saved format
     preferences live in memory, seeded from the profile, so a slide for "got
     question 1 wrong" can't overwrite the one beside it for "got it right"
     (frames on one site otherwise share a tab's sessionStorage), and nothing
     an admin clicks lands in a real learner's record.
   - The profile is the learner's answers:
       lens=manufacturing|public       sector version
       fmt=video|listen|article        the format they took
       k1=1|0  k2=1|0                  pre-check knowledge questions right/wrong
       f1=agree|disagree  f3=…         pre-check belief statements
       c1=1|0  c2=1|0                  case 1 / case 2 mastery check right/wrong
     plus the assignment's settings, which become window.AdminPreview (read by
     layered-sharps.js): formats=video,listen,article  test_out  test_up  extra
     modules=m1,…,m6 (the cover lists only these; default all six).
     chapter=<topic> opens Listen mode at that chapter; autoplay=1 lets it play.
   - The white Vector Solutions site bar is hidden; the viewer has its own.
   - thumb=1 is a quiet slide: no video download (the titled poster shows),
     no CLARA orb or hint, no motion, Demo hidden, not clickable.

   Load BEFORE layered-engine.js and layered-sharps.js.
   ========================================================================== */
(function () {
  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
  if (!q || q.get('embed') !== '1') { window.PreviewEmbed = null; return; }

  function memStore(seed) {
    var d = {};
    Object.keys(seed || {}).forEach(function (k) { d[k] = String(seed[k]); });
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null; },
      setItem: function (k, v) { d[k] = String(v); },
      removeItem: function (k) { delete d[k]; },
      clear: function () { d = {}; },
      key: function (i) { var ks = Object.keys(d); return i < ks.length ? ks[i] : null; },
      get length() { return Object.keys(d).length; }
    };
  }
  function yes(k, dflt) { var v = q.get(k); return v == null ? dflt : v === '1' || v === 'true'; }
  function opt(k) { var v = q.get(k); return v === '1' ? true : v === '0' ? false : null; }

  var FORMATS = ['video', 'listen', 'article'];
  var formats = (q.get('formats') || FORMATS.join(',')).split(',').filter(function (f) { return FORMATS.indexOf(f) > -1; });
  if (!formats.length) formats = FORMATS.slice();
  var fmt = FORMATS.indexOf(q.get('fmt')) > -1 ? q.get('fmt') : 'video';
  var lens = q.get('lens') || 'manufacturing';
  // Agreement on the 1–5 scale the pre-check records; 3 and below counts as low.
  var score = function (k) { var v = q.get(k); return v === 'disagree' ? 2 : v === 'agree' ? 5 : null; };

  var course = {
    battery: { k1up: yes('k1', false), k2up: yes('k2', false), f1: score('f1'), f3: score('f3') },
    podpath: { podcast: fmt === 'listen', results: null }
  };
  var c1 = opt('c1'), c2 = opt('c2');
  if (c1 != null) course.k1check = { passed: c1 };
  if (c2 != null) course.k2check = { passed: c2 };

  var session = { 'll-lens': lens, 'll-review': '0', 'sh-course': JSON.stringify(course) };
  if (fmt !== 'listen') session['sh-modality'] = fmt;
  try { Object.defineProperty(window, 'sessionStorage', { value: memStore(session), configurable: true }); } catch (e) {}
  try { Object.defineProperty(window, 'localStorage', { value: memStore({}), configurable: true }); } catch (e) {}

  window.AdminPreview = {
    formats: formats,
    allows: function (f) { return formats.indexOf(f) > -1; },
    only: function () { return formats.length === 1 ? formats[0] : null; },
    testOut: yes('test_out', true),
    testUp: yes('test_up', true),
    extra: yes('extra', true),
    modules: (q.get('modules') || 'm1,m2,m3,m4,m5,m6').split(','),
    exit: function () {}
  };
  var thumb = q.get('thumb') === '1';
  // chapter: a Listen mode screen opens at that chapter (topic id).
  // autoplay: Listen mode starts playing on its own (the viewer's Play mode);
  // otherwise it waits for the play button.
  window.PreviewEmbed = { thumb: thumb, chapter: q.get('chapter') || null, autoplay: q.get('autoplay') === '1' };

  // Every embed, large or small: no white Vector Solutions site bar. The
  // viewer has its own chrome, and the course frame sizes everything off
  // --vt-bar-h, so zero collapses it cleanly.
  document.documentElement.classList.add('pe-embed');
  var base = document.createElement('style');
  base.textContent = 'html.pe-embed { --vt-bar-h: 0px !important; } html.pe-embed .vt-bar { display: none !important; }';
  document.head.appendChild(base);

  if (thumb) {
    document.documentElement.classList.add('pe-thumb');
    var css = document.createElement('style');
    css.textContent =
      'html.pe-thumb *, html.pe-thumb *::before, html.pe-thumb *::after { animation: none !important; transition: none !important; }' +
      'html.pe-thumb body { pointer-events: none; overflow: hidden; }' +
      'html.pe-thumb #llDemoBtn, html.pe-thumb .ll-variant-tag, html.pe-thumb .ll-demo-menu { visibility: hidden !important; }';
    document.head.appendChild(css);
    // No CLARA orb at all: each one opens a WebGL context, and Chrome keeps
    // only ~16 per page, dropping the oldest past that (the big screen's,
    // say). The engine skips the orb when window.MobiusOrb is missing, so
    // mobius-orb.js's assignment is swallowed here and it never starts.
    try { Object.defineProperty(window, 'MobiusOrb', { configurable: true, get: function () { return undefined; }, set: function () {} }); } catch (e) {}
    // Any other loop draws a few frames, then holds still: twenty
    // live slides each spinning a WebGL orb would bring the viewer to a crawl.
    var raf = window.requestAnimationFrame.bind(window);
    var until = Date.now() + 1500;
    window.requestAnimationFrame = function (fn) { return Date.now() < until ? raf(fn) : 0; };
  }
})();
