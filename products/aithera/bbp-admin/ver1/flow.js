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
  var W = 1000, PAD = 78, LANE = 36, BELOW = 112;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function n1(x) { return Math.round(x * 10) / 10; }

  function render(el, cfg) {
    var steps = cfg.steps, n = steps.length, cohort = cfg.counts != null;
    var taken = cfg.taken || {}, counts = cfg.counts || {}, off = cfg.off || {};
    var X = steps.map(function (_, i) { return PAD + i * (W - 2 * PAD) / (n - 1); });
    var WMAX = cohort ? 28 : 9;   // a cohort ribbon is fat so the share leaving at each branch is visible

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
    // A learner's own route shows only what happened: no ghost arches or chips for branches they never took.
    var onlyTaken = !!cfg.hideIdle && !cohort;
    if (onlyTaken) feats = feats.filter(function (ft) { return isTaken(ft.st.id, ft.v); });
    var laneEnd = [];
    feats.sort(function (p, q) { return p.a - q.a; }).forEach(function (ft) {
      var k = 0; while (laneEnd[k] != null && laneEnd[k] > ft.a) k++;
      ft.lane = k; laneEnd[k] = ft.b;
    });
    var L = onlyTaken ? laneEnd.length : Math.max(1, laneEnd.length);
    // Harder checks happen AT a station, not between two, so their chip rides one lane above the other
    // branch chips and a dashed stem ties it to its station.
    var hasHarder = steps.some(function (s) { return (s.variants || []).some(function (v) { return v.type === 'harder' && (!onlyTaken || isTaken(s.id, v)); }); });
    var Y0 = 114 + (Math.max(onlyTaken ? 0 : 1, L + (hasHarder ? 1 : 0)) - 1) * LANE, H = Y0 + BELOW;
    function laneY(k) { return Y0 - 70 - k * LANE; }

    // ---- ribbon geometry ----------------------------------------------------
    function line(x1, x2, dy) { var y = n1(Y0 + (dy || 0)); return 'M' + n1(x1) + ' ' + y + ' L' + n1(x2) + ' ' + y; }
    // A branch peels off the top edge of the main ribbon: it leaves flat, eases up, runs flat, and eases back down
    // into the ribbon. `sy` is where the branch's centre line sits on the ribbon, so a share reads as a slice of it.
    function ease(x0, y0, x1, y1) { var dx = x1 - x0; return ' C' + n1(x0 + .62 * dx) + ' ' + n1(y0) + ',' + n1(x0 + .38 * dx) + ' ' + n1(y1) + ',' + n1(x1) + ' ' + n1(y1); }
    function bypass(a, b, y, sy) {
      var xa = X[a], xb = X[b], lead = 24, S = Math.min(96, (xb - xa - 2 * lead) / 2 - 4);
      return 'M' + n1(xa) + ' ' + n1(sy) + ' L' + n1(xa + lead) + ' ' + n1(sy) + ease(xa + lead, sy, xa + lead + S, y) +
        ' L' + n1(xb - lead - S) + ' ' + n1(y) + ease(xb - lead - S, y, xb - lead, sy) + ' L' + n1(xb) + ' ' + n1(sy);
    }
    function detour(a, b, y, sy) {
      var xa = X[a], xb = X[b], lead = 18, S = 34;
      return 'M' + n1(xa) + ' ' + n1(sy) + ' L' + n1(xa + lead) + ' ' + n1(sy) + ease(xa + lead, sy, xa + lead + S, y) +
        ' L' + n1(xb - lead - S) + ' ' + n1(y) + ease(xb - lead - S, y, xb - lead, sy) + ' L' + n1(xb) + ' ' + n1(sy);
    }
    // Short, consistent chip copy: "Skipped · −8 min", "Harder · +2 min", "11 skipped".
    function chipText(v, on, isOff) {
      if (isOff) return v.tag + ' · off';
      if (cohort) return counts[v.key] + ' ' + v.short + (cfg.total ? ' · ' + Math.round(counts[v.key] / cfg.total * 100) + '%' : '');
      if (!on) return v.idle;
      return v.tag + ' · ' + (v.type === 'skip' ? '−' + v.saves : '+' + v.adds) + ' min';
    }

    // Hover text for a branch chip: the exact count against everyone who finished
    function chipTitle(v) {
      return cohort && cfg.total && counts[v.key] ? v.name + ': ' + counts[v.key] + ' of ' + cfg.total + ' who finished (' + Math.round(counts[v.key] / cfg.total * 100) + '%)' : v.name;
    }

    var track = '', ghost = '', lit = '', chips = '', extraNodes = '';
    var litSegWidth = [], segDy = [];
    for (var i = 0; i < n - 1; i++) litSegWidth[i] = WMAX;

    feats.forEach(function (ft) {
      var v = ft.v, idx = ft.idx, sh = share(v.key), on = isTaken(ft.st.id, v), isOff = !!off[v.key];
      var active = on || (cohort && sh > 0 && !isOff), cls = 'fl-' + v.type, ly = laneY(ft.lane);
      var skip = v.type === 'skip';
      var bw = on ? WMAX : (cohort && active ? Math.max(3, WMAX * sh) : 0), sy = bw ? Y0 - (WMAX - bw) / 2 : Y0;
      var d = skip ? bypass(ft.a, ft.b, ly, sy) : detour(ft.a, ft.b, ly + 8, sy);
      var segs = skip ? [idx - 1, idx] : [idx];
      var cx = skip ? (X[ft.a] + X[ft.b]) / 2 : (X[ft.a] + X[ft.b]) / 2;
      ghost += '<path class="fl-ghost' + (isOff ? ' off' : '') + '" d="' + d + '"/>';
      if (on) { segs.forEach(function (s) { litSegWidth[s] = 0; }); lit += '<path class="fl-rib ' + cls + '" style="stroke-width:' + WMAX + 'px" pathLength="1" d="' + d + '"/>'; }
      if (cohort && active) {
        segs.forEach(function (s) { litSegWidth[s] = Math.max(2.5, WMAX * (1 - sh)); segDy[s] = (WMAX - litSegWidth[s]) / 2; });
        lit += '<path class="fl-rib ' + cls + '" style="stroke-width:' + Math.max(3, WMAX * sh) + 'px" pathLength="1" d="' + d + '"/>';
      }
      if (!skip) extraNodes += '<span class="fl-sub-node ' + cls + (active ? ' on' : '') + (isOff ? ' off' : '') + '" style="left:' + n1(cx / W * 100) + '%;top:' + n1((ly + 8) / H * 100) + '%"><i class="fa-solid fa-wand-magic-sparkles"></i></span>';
      chips += chip(cx, ly - 25, cls, active, isOff, chipText(v, on, isOff), isOff ? 'fa-lock' : (skip ? 'fa-forward' : 'fa-wand-magic-sparkles'), chipTitle(v));
    });

    // backbone: a faint track under everything, then the lit segments over it
    for (var s = 0; s < n - 1; s++) {
      track += '<path class="fl-track" d="' + line(X[s], X[s + 1]) + '"/>';
      var future = steps[s + 1].future;
      if (litSegWidth[s] > 0) {
        lit += '<path class="fl-rib fl-main' + (future ? ' fl-future' : '') + '" style="stroke-width:' + n1(future ? 3 : litSegWidth[s]) + 'px" pathLength="1" d="' + line(X[s], X[s + 1], segDy[s]) + '"/>';
      }
    }

    var stems = '';
    steps.forEach(function (st, i) {
      (st.variants || []).forEach(function (v) {
        if (v.type === 'harder' && (!onlyTaken || isTaken(st.id, v))) stems += '<line class="fl-stem' + (off[v.key] ? ' off' : '') + '" x1="' + n1(X[i]) + '" x2="' + n1(X[i]) + '" y1="' + n1(laneY(L) - 25 + 12) + '" y2="' + n1(Y0 - 8) + '"/>';
      });
    });
    var svg = '<svg class="fl-svg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<defs><linearGradient id="flBlue" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + W + '" y2="0"><stop offset="0" stop-color="#0a5fb0"/><stop offset="1" stop-color="#3a93e8"/></linearGradient></defs>' +
      track + ghost + lit + stems + '</svg>';

    // ---- stations -------------------------------------------------------------
    var nodes = steps.map(function (st, i) {
      var v = (st.variants || []).filter(function (x) { return isTaken(st.id, x); })[0];
      var skipped = v && v.type === 'skip', hard = v && v.type === 'harder';
      var hardCohort = cohort && (st.variants || []).some(function (x) { return x.type === 'harder' && share(x.key) > 0 && !off[x.key]; });
      var cls = 'fl-node' + (skipped ? ' skip' : '') + (hard ? ' hard' : '') + (st.future ? ' future' + (cfg.follow === 'off' ? ' off' : '') : '') + (cfg.selected === st.id ? ' sel' : '') + (cfg.onPick ? ' pick' : '');
      var hardChip = '';
      (st.variants || []).forEach(function (x) {
        if (x.type !== 'harder' || (onlyTaken && !isTaken(st.id, x))) return;
        var isOff = !!off[x.key], on = isTaken(st.id, x), act = cohort && share(x.key) > 0 && !isOff;
        hardChip = chip(X[i], laneY(L) - 25, 'fl-harder', on || act, isOff, chipText(x, on, isOff), isOff ? 'fa-lock' : 'fa-angles-up', chipTitle(x));
      });
      var skV = (st.variants || []).filter(function (x) { return x.type === 'skip'; })[0];
      var skippableTaken = !cohort && !onlyTaken && skV && !skipped && !off[skV.key];
      var hardOn = hard || hardCohort;
      var dw = cfg.dwell && cfg.dwell[st.id], slow = !cohort && dw && !skipped && dw.actual / dw.typical >= 1.4 && dw.actual - dw.typical >= 2;
      // One status line at most, and only when something happened here.
      var status = skipped ? ['sk', 'Skipped']
        : (slow ? ['slow', (cohort ? 'Median ' : 'Took ') + dw.actual + ' min']
        : (st.future && cfg.follow === 'off' ? ['', 'Off'] : null));
      var tag = skippableTaken ? '<span class="fl-tag sk" title="Skippable, but taken"><i class="fa-solid fa-forward"></i></span>'
              : (hardOn && !cohort ? '<span class="fl-tag hd" title="Harder checks"><i class="fa-solid fa-angles-up"></i></span>'
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
      svg + '<div class="fl-html">' + nodes + extraNodes + chips + '</div></div></div>' +
      (cohort ? '<div class="fl-key"><span><i class="fa-solid fa-lock"></i>Required by the training standard</span>' +
        '<span><i class="fa-solid fa-wand-magic-sparkles k-extra"></i>Extra practice step</span>' +
        '<span><i class="k-rib"></i>Ribbon width = share of people who took that route</span></div>' : '');
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
    // Group view: the bar IS the median time per step, with the written length as a caption.
    // Single-learner view keeps the written-length bar with skips and additions.
    // Racing-style gap to target: +3, −1, 0
    function sd(d) { return d > 0 ? '+' + d : (d < 0 ? '−' + Math.abs(d) : '0'); }
    function seg(p) {
      var med = group && p.actual != null;
      var inner = p.kind === 'hard' ? '<span class="tb-base" style="flex:' + p.mins + '"></span><span class="tb-plus" style="flex:' + p.extra + '"></span>' : '';
      var tip = short(p.label) + ' · typical ' + p.typical + ' min' + (p.actual != null ? ' · ' + (group ? 'median ' : 'took ') + p.actual : '');
      var devHtml = med ? '<em class="tb-dev ' + (p.dev || 'same') + '">' + (p.dev === 'slow' ? p.actual + ' min · ' : '') + 'target ' + p.typical + '</em>'
        : (p.delta ? '<em class="tb-dev ' + (p.delta > 0 ? 'slow' : 'fast') + '">' + sd(p.delta) + ' min</em>' : '');
      return '<div class="tb-seg" style="flex:' + (med ? p.actual : p.mins + p.extra) + ' 1 0"><div class="tb-fill ' + p.kind + (p.delta > 0 ? ' over' : (p.delta < 0 ? ' under' : '')) + '" title="' + tip + '">' + inner +
        '<b class="tb-gap">' + (med ? sd(p.delta) : (p.kind === 'skip' ? '−' : (p.kind === 'add' ? '+' : '')) + p.mins + (p.extra ? '<i>+' + p.extra + '</i>' : '')) + '</b></div>' + devHtml + '</div>';
    }
    // Title sits above its bar, so it reads first and never collides with the number below.
    function segTop(p) { return seg(p).replace('<div class="tb-fill', '<small class="tb-lbl">' + p.label + '</small><div class="tb-fill'); }
    // Many steps: a segmented strip can't hold readable titles, so switch to one row per step.
    // Bars share one scale, so a long step still looks long.
    var listMode = group || parts.length > 7, maxV = 1;
    parts.forEach(function (p) {
      var v = group && p.actual != null ? p.actual : p.mins + p.extra;
      maxV = Math.max(maxV, v, group && p.actual != null ? p.typical : 0);
    });
    function row(p) {
      var med = group && p.actual != null, val = med ? p.actual : p.mins + p.extra;
      var inner = p.kind === 'hard' ? '<span class="tb-base" style="flex:' + p.mins + '"></span><span class="tb-plus" style="flex:' + p.extra + '"></span>' : '';
      var tick = med ? '<span class="tb-tick" style="left:' + (p.typical / maxV * 100).toFixed(1) + '%" title="Target ' + p.typical + ' min"></span>' : '';
      var txt = med ? '<b class="tb-delta ' + (p.delta > 0 ? 'over' : (p.delta < 0 ? 'under' : '')) + '">' + sd(p.delta) + '</b> <small>' + val + ' min · target ' + p.typical + '</small>'
        : '<b>' + (p.kind === 'skip' ? '−' : '') + val + ' min</b>';
      return '<div class="tb-row"><span class="tb-lbl">' + p.label + '</span><div class="tb-track"><div class="tb-fill ' + p.kind + (med ? (p.delta > 0 ? ' over' : (p.delta < 0 ? ' under' : '')) : (p.dev === 'slow' ? ' slow' : '')) + '" style="width:' + Math.max(2, val / maxV * 100).toFixed(1) + '%">' + inner + '</div>' + tick + '</div><span class="tb-rv">' + txt + '</span></div>';
    }
    var delta = '';
    if (saved) delta += '<span class="tb-d skip"><i class="fa-solid fa-minus"></i>' + saved + ' skipped</span>';
    if (added) delta += '<span class="tb-d add"><i class="fa-solid fa-plus"></i>' + added + ' added</span>';
    var slowParts = parts.filter(function (p) { return p.dev === 'slow'; });
    if (slowParts.length) delta += '<span class="tb-d slow"><i class="fa-solid fa-clock"></i>' + slowPhrase(slowParts.map(function (p) { return p.label; }), group) + '</span>';
    var head = dw
      ? '<span class="tb-now"><b>' + actualTotal + ' min</b>' + (group ? ' median · target ' + written : ' · typical ' + typicalNow + (typicalNow !== written ? ' · written ' + written : '')) + '</span>'
      : '<span class="tb-now"><b>' + typicalNow + ' min</b>' + (typicalNow !== written ? ' · written ' + written : '') + '</span>';
    el.innerHTML = '<div class="tb"><div class="tb-head"><b>' + (group ? 'Pacing' : 'Time') + '</b>' + head + '<span class="tb-ds">' + (delta || '<span class="tb-d">same as written</span>') + '</span></div>' +
      (listMode ? '<div class="tb-rows">' + parts.map(row).join('') + '</div>' : '<div class="tb-bar">' + parts.map(segTop).join('') + '</div>') +
      (group
        ? '<div class="tb-key"><span><i class="k-std"></i>On target</span><span><i class="k-over"></i>Over target</span><span><i class="k-under"></i>Under target</span><span><i class="k-tick"></i>Target</span><span><b class="k-gap">+3</b>Minutes over (+) or under (−)</span></div></div>'
        : '<div class="tb-key"><span><i class="k-std"></i>Typical time</span><span><i class="k-skip"></i>Skipped</span><span><i class="k-add"></i>Added</span>' + (dw ? '<span><i class="k-over"></i>Over typical</span><span><i class="k-under"></i>Under typical</span>' : '') + '</div></div>');
  }

  // "Slow at practice" / "Slow at practice and hazard" / "Slow at practice +2 more"
  function slowPhrase(names, group) {
    var l = names.map(function (x) { return x.toLowerCase(); });
    return (group ? 'Slow at ' : 'Slower at ') + (l.length === 1 ? l[0] : (l.length === 2 ? l[0] + ' and ' + l[1] : l[0] + ' +' + (l.length - 1) + ' more'));
  }

  window.Flow = { render: render, timeBar: timeBar, slowPhrase: slowPhrase };
})();
