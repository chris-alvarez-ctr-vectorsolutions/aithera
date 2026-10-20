/* ============================================================================
   flow.js — the route graphic. Draws a module as a line of stations with the
   branches the engine can take, from data (BBP.MODULE), not hand-placed art.

     Flow.render(el, {
       steps,                // BBP.MODULE.steps
       taken:  { l1: 'skip' },   // step id -> variant key actually taken (one learner)
       counts: { skip: 11 },     // variant key -> people (cohort); with total
       total:  120,              // cohort size; presence of counts switches to cohort mode
       off:    { skip: true },   // variant keys switched off by settings
       follow: 'queued' | 'off' | 'done',
       selected, onPick
     })

   One learner: the route taken is a lit ribbon, everything else a faint ghost.
   A cohort: the same picture, but ribbon width is the share of people who took
   each branch — so the same graphic reads for one person or a whole plant.
   Stations are HTML (real buttons, real type); only the ribbons are SVG.
   ========================================================================== */
(function () {
  'use strict';
  var W = 1000, PAD = 78, LANE = 36, BELOW = 150;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function n1(x) { return Math.round(x * 10) / 10; }

  function render(el, cfg) {
    var steps = cfg.steps, n = steps.length, cohort = cfg.counts != null;
    var taken = cfg.taken || {}, counts = cfg.counts || {}, off = cfg.off || {};
    var X = steps.map(function (_, i) { return PAD + i * (W - 2 * PAD) / (n - 1); });
    var WMAX = cohort ? 15 : 9;

    function share(key) { return cohort && cfg.total ? Math.min(1, (counts[key] || 0) / cfg.total) : 0; }
    function isTaken(stepId, v) { return !cohort && taken[stepId] === v.key; }

    // ---- lanes ----------------------------------------------------------------
    // Skips and inserts run above the line. Two that would overlap get their own
    // lane, so a busier module stacks upward instead of colliding.
    var feats = [];
    steps.forEach(function (st, idx) {
      (st.variants || []).forEach(function (v) {
        if (v.type === 'skip' && idx > 0 && idx < n - 1) feats.push({ st: st, idx: idx, v: v, a: idx - 1, b: idx + 1 });
        if (v.type === 'insert' && idx < n - 1) feats.push({ st: st, idx: idx, v: v, a: idx, b: idx + 1 });
      });
    });
    var laneEnd = [];
    feats.sort(function (p, q) { return p.a - q.a; }).forEach(function (ft) {
      var k = 0; while (laneEnd[k] != null && laneEnd[k] > ft.a) k++;
      ft.lane = k; laneEnd[k] = ft.b;
    });
    var L = Math.max(1, laneEnd.length);
    var Y0 = 114 + (L - 1) * LANE, H = Y0 + BELOW;
    function laneY(k) { return Y0 - 70 - k * LANE; }

    // ---- ribbon geometry ----------------------------------------------------
    function line(x1, x2) { return 'M' + n1(x1) + ' ' + Y0 + ' L' + n1(x2) + ' ' + Y0; }
    function bypass(a, b, y) {
      var xa = X[a], xb = X[b], r = 56;
      return 'M' + n1(xa) + ' ' + Y0 + ' C' + n1(xa + r) + ' ' + Y0 + ',' + n1(xa + r) + ' ' + y + ',' + n1(xa + 2 * r) + ' ' + y +
        ' L' + n1(xb - 2 * r) + ' ' + y + ' C' + n1(xb - r) + ' ' + y + ',' + n1(xb - r) + ' ' + Y0 + ',' + n1(xb) + ' ' + Y0;
    }
    function detour(a, b, y) {
      var xa = X[a], xb = X[b], xm = (xa + xb) / 2;
      return 'M' + n1(xa) + ' ' + Y0 + ' C' + n1(xa + 46) + ' ' + Y0 + ',' + n1(xm - 52) + ' ' + y + ',' + n1(xm) + ' ' + y +
        ' C' + n1(xm + 52) + ' ' + y + ',' + n1(xb - 46) + ' ' + Y0 + ',' + n1(xb) + ' ' + Y0;
    }
    // Short, consistent chip copy: "Skipped · −8 min", "Harder · +2 min", "11 skipped".
    function chipText(v, on, isOff) {
      if (isOff) return v.tag + ' · off';
      if (cohort) return counts[v.key] + ' ' + v.short;
      if (!on) return v.idle;
      return v.tag + ' · ' + (v.type === 'skip' ? '−' + v.saves : '+' + v.adds) + ' min';
    }

    var track = '', ghost = '', lit = '', chips = '', extraNodes = '';
    var litSegWidth = [];
    for (var i = 0; i < n - 1; i++) litSegWidth[i] = WMAX;

    feats.forEach(function (ft) {
      var v = ft.v, idx = ft.idx, sh = share(v.key), on = isTaken(ft.st.id, v), isOff = !!off[v.key];
      var active = on || (cohort && sh > 0 && !isOff), cls = 'fl-' + v.type, ly = laneY(ft.lane);
      var skip = v.type === 'skip';
      var d = skip ? bypass(ft.a, ft.b, ly) : detour(ft.a, ft.b, ly + 8);
      var segs = skip ? [idx - 1, idx] : [idx];
      var cx = skip ? (X[ft.a] + X[ft.b]) / 2 : (X[ft.a] + X[ft.b]) / 2;
      ghost += '<path class="fl-ghost' + (isOff ? ' off' : '') + '" d="' + d + '"/>';
      if (on) { segs.forEach(function (s) { litSegWidth[s] = 0; }); lit += '<path class="fl-rib ' + cls + '" style="stroke-width:' + WMAX + 'px" pathLength="1" d="' + d + '"/>'; }
      if (cohort && active) {
        segs.forEach(function (s) { litSegWidth[s] = Math.max(2.5, WMAX * (1 - sh)); });
        lit += '<path class="fl-rib ' + cls + '" style="stroke-width:' + Math.max(3, WMAX * sh) + 'px" pathLength="1" d="' + d + '"/>';
      }
      if (!skip) extraNodes += '<span class="fl-sub-node ' + cls + (active ? ' on' : '') + (isOff ? ' off' : '') + '" style="left:' + n1(cx / W * 100) + '%;top:' + n1((ly + 8) / H * 100) + '%"><i class="fa-solid fa-wand-magic-sparkles"></i></span>';
      chips += chip(cx, ly - 25, cls, active, isOff, chipText(v, on, isOff), isOff ? 'fa-lock' : (skip ? 'fa-forward' : 'fa-wand-magic-sparkles'), v.name);
    });

    // backbone: a faint track under everything, then the lit segments over it
    for (var s = 0; s < n - 1; s++) {
      track += '<path class="fl-track" d="' + line(X[s], X[s + 1]) + '"/>';
      var future = steps[s + 1].future;
      if (litSegWidth[s] > 0) {
        lit += '<path class="fl-rib fl-main' + (future ? ' fl-future' : '') + '" style="stroke-width:' + n1(future ? 3 : litSegWidth[s]) + 'px" pathLength="1" d="' + line(X[s], X[s + 1]) + '"/>';
      }
    }

    var svg = '<svg class="fl-svg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<defs><linearGradient id="flBlue" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + W + '" y2="0"><stop offset="0" stop-color="#0a5fb0"/><stop offset="1" stop-color="#3a93e8"/></linearGradient></defs>' +
      track + ghost + lit + '</svg>';

    // ---- stations -------------------------------------------------------------
    var nodes = steps.map(function (st, i) {
      var v = (st.variants || []).filter(function (x) { return isTaken(st.id, x); })[0];
      var skipped = v && v.type === 'skip', hard = v && v.type === 'harder';
      var hardCohort = cohort && (st.variants || []).some(function (x) { return x.type === 'harder' && share(x.key) > 0 && !off[x.key]; });
      var cls = 'fl-node' + (skipped ? ' skip' : '') + ((hard || hardCohort) ? ' hard' : '') + (st.future ? ' future' + (cfg.follow === 'off' ? ' off' : '') : '') + (cfg.selected === st.id ? ' sel' : '') + (cfg.onPick ? ' pick' : '');
      var hardChip = '';
      (st.variants || []).forEach(function (x) {
        if (x.type !== 'harder') return;
        var isOff = !!off[x.key], on = isTaken(st.id, x), act = cohort && share(x.key) > 0 && !isOff;
        hardChip = chip(X[i], Y0 + 116, 'fl-harder', on || act, isOff, chipText(x, on, isOff), isOff ? 'fa-lock' : 'fa-angles-up', x.name);
      });
      var skV = (st.variants || []).filter(function (x) { return x.type === 'skip'; })[0];
      var skippableTaken = !cohort && skV && !skipped && !off[skV.key];
      var hardOn = hard || hardCohort;
      var dw = cfg.dwell && cfg.dwell[st.id], slow = dw && !skipped && dw.actual / dw.typical >= 1.4 && dw.actual - dw.typical >= 2;
      // One status line at most, and only when something happened here.
      var status = skipped ? ['sk', 'Skipped']
        : (slow ? ['slow', (cohort ? 'Median ' : 'Took ') + dw.actual + ' min']
        : (st.future && cfg.follow === 'off' ? ['', 'Off'] : null));
      var tag = skippableTaken ? '<span class="fl-tag sk" title="Skippable, but taken"><i class="fa-solid fa-forward"></i></span>'
              : (hardOn ? '<span class="fl-tag hd" title="Harder checks"><i class="fa-solid fa-angles-up"></i></span>'
              : (slow ? '<span class="fl-tag slow" title="Took longer than typical"><i class="fa-solid fa-clock"></i></span>' : ''));
      // People who haven't finished, shown where they are right now.
      var here = cfg.now && cfg.now[st.id], wait = cfg.now && i === 0 && cfg.now.start;
      var nowHtml = (here ? '<span class="fl-now"><i></i>' + here + ' here now</span>' : '') + (wait ? '<span class="fl-now wait">' + wait + ' not started</span>' : '');
      var tip = st.label + (st.sub ? ' · ' + st.sub : '') + (skippableTaken ? ' · skippable, but taken' : '');
      return '<button type="button" class="' + cls + (slow ? ' slowed' : '') + '" data-id="' + st.id + '" title="' + esc(tip) + '" style="left:' + n1(X[i] / W * 100) + '%;top:' + n1(Y0 / H * 100) + '%" ' +
        'aria-label="' + esc(tip) + '">' +
        '<span class="fl-dot"><i class="fa-solid ' + (skipped ? 'fa-forward' : st.icon) + '"></i></span>' +
        tag + (st.required ? '<span class="fl-lock" title="Required by the training standard"><i class="fa-solid fa-lock"></i></span>' : '') +
        '<span class="fl-lbl"><b>' + esc(st.label) + '</b>' + (status ? '<small class="' + status[0] + '">' + esc(status[1]) + '</small>' : '') + nowHtml + '</span></button>' + hardChip;
    }).join('');

    // Labels size themselves to the space between stations (container query),
    // and the stage grows rather than squeezes when a module has many steps.
    el.innerHTML = '<div class="fl-wrap"><div class="fl-stage" style="aspect-ratio:' + W + '/' + n1(H) + ';min-width:' + Math.max(880, n * 128) + 'px;--gap:' + ((W - 2 * PAD) / ((n - 1) * W)).toFixed(4) + '">' +
      svg + '<div class="fl-html">' + nodes + extraNodes + chips + '</div></div></div>';
    if (cfg.onPick) {
      el.querySelectorAll('.fl-node').forEach(function (b) { b.addEventListener('click', function () { cfg.onPick(b.dataset.id); }); });
    }
    function chip(x, y, cls, active, isOff, text, icon, name) {
      return '<span class="fl-chip ' + cls + (active ? ' on' : '') + (isOff ? ' off' : '') + '" title="' + esc(name || text) + '" style="left:' + n1(x / W * 100) + '%;top:' + n1(y / H * 100) + '%"><i class="fa-solid ' + icon + '"></i><span>' + esc(text) + '</span></span>';
    }
  }

  /* ---- Time bar ---------------------------------------------------------------
     The course as a strip of minutes. Skipped steps stay in the strip as hatched
     ghosts (time saved); harder checks and extra practice are added segments
     (time added). Same data as the route above, read as time instead of order. */
  function timeBar(el, cfg) {
    var taken = cfg.taken || {}, dw = cfg.dwell || null, group = !!cfg.group;
    var parts = [], written = 0, saved = 0, added = 0, actualTotal = 0, typicalNow = 0;
    function short(l) { return l; }
    cfg.steps.forEach(function (st) {
      if (st.future) return;
      written += st.mins;
      var v = (st.variants || []).filter(function (x) { return taken[st.id] === x.key; })[0];
      var kind = 'std', extra = 0;
      if (v && v.type === 'skip') { kind = 'skip'; saved += st.mins; }
      if (v && v.type === 'harder') { kind = 'hard'; extra = v.adds; added += v.adds; }
      parts.push({ id: st.id, label: st.short || st.label, mins: st.mins, kind: kind, extra: extra });
      if (v && v.type === 'insert') { added += v.adds; parts.push({ id: 'extra', label: 'Extra', mins: v.adds, kind: 'add', extra: 0 }); }
    });
    parts.forEach(function (p) {
      p.typical = p.kind === 'skip' ? 0 : p.mins + p.extra;
      typicalNow += p.typical;
      var a = dw && dw.actual[p.id];
      p.actual = (a == null || p.kind === 'skip') ? null : a;
      if (p.actual != null) actualTotal += p.actual;
      var ratio = p.actual != null && p.typical ? p.actual / p.typical : 1, dev = p.actual != null ? p.actual - p.typical : 0;
      p.dev = ratio >= 1.4 && dev >= 2 ? 'slow' : (ratio <= 0.65 && dev <= -2 ? 'fast' : null);
      p.delta = dev;
    });
    var total = written + added;
    function seg(p) {
      var inner = p.kind === 'hard' ? '<span class="tb-base" style="flex:' + p.mins + '"></span><span class="tb-plus" style="flex:' + p.extra + '"></span>' : '';
      var tip = short(p.label) + ' · typical ' + p.typical + ' min' + (p.actual != null ? ' · ' + (group ? 'median ' : 'took ') + p.actual : '');
      var devHtml = p.dev ? '<em class="tb-dev ' + p.dev + '">' + (p.delta > 0 ? '+' : '−') + Math.abs(p.delta) + ' min</em>' : '';
      return '<div class="tb-seg" style="flex:' + (p.mins + p.extra) + ' 1 0"><div class="tb-fill ' + p.kind + (p.dev === 'slow' ? ' slow' : '') + '" title="' + tip + '">' + inner +
        '<b>' + (p.kind === 'skip' ? '−' : (p.kind === 'add' ? '+' : '')) + p.mins + (p.extra ? '<i>+' + p.extra + '</i>' : '') + '</b></div><small>' + p.label + '</small>' + devHtml + '</div>';
    }
    var delta = '';
    if (saved) delta += '<span class="tb-d skip"><i class="fa-solid fa-minus"></i>' + saved + ' skipped</span>';
    if (added) delta += '<span class="tb-d add"><i class="fa-solid fa-plus"></i>' + added + ' added</span>';
    var slowParts = parts.filter(function (p) { return p.dev === 'slow'; });
    if (slowParts.length) delta += '<span class="tb-d slow"><i class="fa-solid fa-clock"></i>' + (group ? 'Slow at ' : 'Slower at ') + slowParts.map(function (p) { return p.label.toLowerCase(); }).join(', ') + '</span>';
    var head = dw
      ? '<span class="tb-now"><b>' + actualTotal + ' min</b>' + (group ? ' median' : '') + ' · typical ' + typicalNow + (typicalNow !== written ? ' · written ' + written : '') + '</span>'
      : '<span class="tb-now"><b>' + typicalNow + ' min</b>' + (typicalNow !== written ? ' · written ' + written : '') + '</span>';
    el.innerHTML = '<div class="tb"><div class="tb-head"><b>Time</b>' + head + '<span class="tb-ds">' + (delta || '<span class="tb-d">same as written</span>') + '</span></div>' +
      '<div class="tb-bar">' + parts.map(seg).join('') + '</div>' +
      '<div class="tb-key"><span><i class="k-std"></i>Typical time</span><span><i class="k-skip"></i>Skipped</span><span><i class="k-add"></i>Added</span>' + (dw ? '<span><i class="k-slow"></i>Slower than typical</span>' : '') + '</div></div>';
  }

  window.Flow = { render: render, timeBar: timeBar };
})();
