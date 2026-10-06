/* ============================================================================
   builder.js · Build your dashboard (Settings) for the Bridge home
   ----------------------------------------------------------------------------
   Pattern from the Readiness Hub (Keystone) Agency Intelligence builder, with
   one difference the designer asked for: what you build IS the home page.
     · SETTINGS  a page reached from the side nav; "Build your dashboard" lives
                 there alongside the other settings rows
     · BUILD     the home page itself in edit mode: every module gets a chrome
                 bar (move up / down, hide), hidden modules wait in a tray, and
                 "Your modules" holds the comparisons you construct yourself
     · ADD       the Add-module dialog: scope (all locations or one facility),
                 a metric from either product, an optional metric to compare it
                 with, and how to show it, with a live preview
   Layout (module order + hidden set) and custom modules are in-memory state;
   the home renders from them. Vanilla JS; dialogs use vaadin-dialog renderers.
   Per Bridge's CLAUDE.md there is no AI branding on these surfaces.
   ========================================================================== */
(function () {
  'use strict';
  var D = window.SUITE_DATA;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(n) { return Number(n).toLocaleString('en-US'); }
  function fac(id) { for (var i = 0; i < D.facilities.length; i++) if (D.facilities[i].id === id) return D.facilities[i]; return null; }
  function short(name) { return name.split(' – ')[0]; }
  var PRODUCT = { ehs: { label: 'Vector EHS', chip: 'EHS' }, ct: { label: 'Convergence', chip: 'LMS' } };
  function srcChip(src, text) { return '<span class="src src-' + src + '">' + esc(text || PRODUCT[src].chip) + '</span>'; }

  /* ── Home modules (the things the page is made of) ─────────────────────── */
  var MODULES = [
    { id: 'kpis', name: 'Key metrics', desc: 'Incident rate, open corrective actions, overdue training, expiring qualifications.', src: ['ehs', 'ct'] },
    { id: 'recs', name: 'Recommended actions', desc: 'Cross-product recommendations ranked by severity.', src: ['ehs', 'ct'] },
    { id: 'custom', name: 'Your modules', desc: 'Comparisons you construct from either product’s data.', src: ['ehs', 'ct'] },
    { id: 'compare', name: 'Facility comparison', desc: 'Incident rate next to training compliance, one row per facility.', src: ['ehs', 'ct'] },
    { id: 'row4', name: 'Assigned to me and Compliance calendar', desc: 'Your tasks from both products and the shared calendar.', src: ['ehs', 'ct'] },
    { id: 'audit', name: 'OSHA audit readiness', desc: 'Injury logs and the related training records in one packet.', src: ['ehs', 'ct'] }
  ];
  function mod(id) { for (var i = 0; i < MODULES.length; i++) if (MODULES[i].id === id) return MODULES[i]; return null; }
  var DEFAULT_ORDER = ['kpis', 'recs', 'custom', 'compare', 'row4', 'audit'];

  /* ── Metric catalog ────────────────────────────────────────────────────── */
  var METRICS = [
    { id: 'trir',         src: 'ehs', label: 'Incident rate (TRIR)',      icon: 'fa-triangle-exclamation', unit: '', shape: 'up' },
    { id: 'incidents',    src: 'ehs', label: 'Incidents',                 icon: 'fa-triangle-exclamation', unit: '', shape: 'up', per: 'per week' },
    { id: 'near_miss',    src: 'ehs', label: 'Near misses',               icon: 'fa-bolt',                 unit: '', shape: 'up' },
    { id: 'observations', src: 'ehs', label: 'Observations logged',       icon: 'fa-eye',                  unit: '', shape: 'up' },
    { id: 'open_ca',      src: 'ehs', label: 'Open corrective actions',   icon: 'fa-list-check',           unit: '', shape: 'up' },
    { id: 'inspections',  src: 'ehs', label: 'Inspections completed',     icon: 'fa-clipboard-check',      unit: '', shape: 'flat' },
    { id: 'compliance',   src: 'ct',  label: 'Training compliance',       icon: 'fa-graduation-cap',       unit: '%', shape: 'down' },
    { id: 'overdue',      src: 'ct',  label: 'Overdue training',          icon: 'fa-graduation-cap',       unit: '%', shape: 'up' },
    { id: 'completions',  src: 'ct',  label: 'Training completions',      icon: 'fa-circle-check',         unit: '', shape: 'down' },
    { id: 'quals',        src: 'ct',  label: 'Qualifications expiring',   icon: 'fa-id-badge',             unit: '', shape: 'up' }
  ];
  function metric(id) { for (var i = 0; i < METRICS.length; i++) if (METRICS[i].id === id) return METRICS[i]; return null; }
  var VIZ = { trend: ['Trend, 12 weeks', 'fa-chart-line'], bars: ['Bars by location', 'fa-chart-bar'], scatter: ['Scatter by location', 'fa-braille'], kpi: ['Big numbers', 'fa-hashtag'], table: ['Table', 'fa-table'] };
  var SUGGESTIONS = [
    { label: 'Safety trend vs training at Plant 4', hint: 'Incidents and training completions, week by week', spec: { scope: 'plant4', a: 'incidents', b: 'completions', viz: 'trend', w: 8 } },
    { label: 'Incident rate vs compliance, all facilities', hint: 'Does low compliance sit where incidents are?', spec: { scope: 'all', a: 'trir', b: 'compliance', viz: 'scatter', w: 6 } },
    { label: 'Near misses vs overdue training at DC East', hint: 'By department', spec: { scope: 'dceast', a: 'near_miss', b: 'overdue', viz: 'bars', w: 6 } },
    { label: 'Open corrective actions, all facilities', hint: 'One product, one metric', spec: { scope: 'all', a: 'open_ca', b: null, viz: 'bars', w: 6 } }
  ];

  /* ── Values: per facility, per department, totals, weekly series ───────── */
  function facValue(f, mid) {
    return { trir: f.trir, incidents: f.incidents, near_miss: f.nearMisses, observations: Math.round(f.incidents * 1.6 + f.nearMisses), open_ca: f.openCA, inspections: Math.round(f.employees / 48), compliance: f.compliance, overdue: f.overdue, completions: Math.round(f.employees / 9), quals: f.qualsExpiring }[mid];
  }
  function deptValue(f, d, mid) {
    var share = d.employees / f.employees;
    return { trir: d.trir, incidents: d.incidents, near_miss: Math.max(0, Math.round(f.nearMisses * share * 1.3)), observations: Math.round((d.incidents * 1.6 + f.nearMisses * share)), open_ca: d.openCA, inspections: Math.round(d.employees / 48), compliance: d.compliance, overdue: d.overdue, completions: Math.round(d.employees / 9), quals: Math.round(f.qualsExpiring * share) }[mid];
  }
  function rows(scope, mid) {
    if (scope === 'all') return D.facilities.map(function (f) { return { label: short(f.name), full: f.name, value: facValue(f, mid), hot: f.signal === 'elevated' }; });
    var f = fac(scope);
    return f.departments.map(function (d) { return { label: d.name, full: d.name, value: deptValue(f, d, mid), hot: d.signal === 'elevated' }; });
  }
  function total(scope, mid) {
    if (scope !== 'all') return facValue(fac(scope), mid);
    var emp = D.facilities.reduce(function (a, f) { return a + f.employees; }, 0), m = metric(mid);
    if (mid === 'trir' || m.unit === '%') { var s = 0; D.facilities.forEach(function (f) { s += facValue(f, mid) * f.employees; }); return Math.round(s / emp * 10) / 10; }
    return D.facilities.reduce(function (a, f) { return a + facValue(f, mid); }, 0);
  }
  function series(scope, mid) {
    var t = total(scope, mid), m = metric(mid), f = scope === 'all' ? null : fac(scope), hot = f ? f.signal === 'elevated' : true;
    var weekly = (mid === 'trir' || m.unit === '%') ? t : t / 12, out = [];
    for (var i = 0; i < 12; i++) {
      var k = i / 11, shape = m.shape === 'up' ? (hot ? 0.6 + 0.8 * k : 0.9 + 0.2 * k) : m.shape === 'down' ? (hot ? 1.25 - 0.5 * k : 1.05 - 0.1 * k) : 1;
      var noise = ((i * 7 + mid.length) % 5 - 2) * 0.06;
      var v = weekly * (shape + noise);
      /* Small weekly counts keep one decimal (1.3 incidents a week), or rounding makes the line spike */
      out.push((mid === 'trir' || m.unit === '%' || weekly < 20) ? Math.round(v * 10) / 10 : Math.max(0, Math.round(v)));
    }
    return out;
  }
  function scopeLabel(scope) { return scope === 'all' ? 'All facilities' : fac(scope).name; }

  /* ── Viz renderers ─────────────────────────────────────────────────────── */
  var COL_A = 'var(--lumo-error-color)', COL_B = 'var(--lumo-primary-color)';
  function colorFor(mid, isB) { return isB ? COL_B : (metric(mid).src === 'ehs' ? COL_A : COL_B); }
  function legend(spec) {
    return '<div class="cw-legend"><span><i class="sw" style="background:' + colorFor(spec.a, false) + '"></i>' + esc(metric(spec.a).label) + srcChip(metric(spec.a).src) + '</span>' + (spec.b ? '<span><i class="sw" style="background:' + (metric(spec.a).src === 'ehs' && metric(spec.b).src === 'ehs' ? 'var(--lumo-contrast-40pct)' : COL_B) + '"></i>' + esc(metric(spec.b).label) + srcChip(metric(spec.b).src) + '</span>' : '') + '</div>';
  }
  function vizTrend(spec) {
    var A = series(spec.scope, spec.a), B = spec.b ? series(spec.scope, spec.b) : null, w = 360, h = 130, pl = 34, pb = 22;
    var idx = !!B, a = idx ? A.map(function (v) { return A[0] ? v / A[0] * 100 : 100; }) : A, b = idx && B ? B.map(function (v) { return B[0] ? v / B[0] * 100 : 100; }) : null;
    var all = b ? a.concat(b) : a, min = Math.min.apply(null, all), max = Math.max.apply(null, all), span = (max - min) || 1;
    function pts(vals) { return vals.map(function (v, i) { return [pl + i * (w - pl - 10) / 11, 10 + (1 - (v - min) / span) * (h - pb - 16)]; }); }
    function path(p) { return p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); }
    var pa = pts(a), pb2 = b ? pts(b) : null, colB = metric(spec.a).src === 'ehs' && spec.b && metric(spec.b).src === 'ehs' ? 'var(--lumo-contrast-40pct)' : COL_B;
    return legend(spec) + '<svg class="cw-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(title(spec)) + '">' +
      '<line class="grid" x1="' + pl + '" y1="' + (h - pb) + '" x2="' + w + '" y2="' + (h - pb) + '"/><line class="grid" x1="' + pl + '" y1="10" x2="' + w + '" y2="10"/>' +
      '<text x="' + (pl - 6) + '" y="14" text-anchor="end">' + (idx ? Math.round(max) : esc(num(max))) + '</text><text x="' + (pl - 6) + '" y="' + (h - pb + 4) + '" text-anchor="end">' + (idx ? Math.round(min) : esc(num(min))) + '</text>' +
      (pb2 ? '<path d="' + path(pb2) + '" fill="none" stroke="' + colB + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + pb2[11][0].toFixed(1) + '" cy="' + pb2[11][1].toFixed(1) + '" r="4" fill="' + colB + '" stroke="#fff" stroke-width="2"/>' : '') +
      '<path d="' + path(pa) + '" fill="none" stroke="' + colorFor(spec.a, false) + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + pa[11][0].toFixed(1) + '" cy="' + pa[11][1].toFixed(1) + '" r="4" fill="' + colorFor(spec.a, false) + '" stroke="#fff" stroke-width="2"/>' +
      '<text x="' + pl + '" y="' + (h - 5) + '">12 weeks ago</text><text x="' + w + '" y="' + (h - 5) + '" text-anchor="end">This week</text></svg>' +
      '<p class="cw-cap">' + (idx ? 'Both series indexed to 100 at week 1 so they share one axis. Weekly values: ' : 'Weekly values: ') + esc(metric(spec.a).label) + ': <strong>' + esc(num(A[0])) + ' → ' + esc(num(A[11])) + metric(spec.a).unit + '</strong>' + (B ? '. ' + esc(metric(spec.b).label) + ': <strong>' + esc(num(B[0])) + ' → ' + esc(num(B[11])) + metric(spec.b).unit + '</strong>' : '') + '.</p>';
  }
  function vizBars(spec) {
    var A = rows(spec.scope, spec.a), B = spec.b ? rows(spec.scope, spec.b) : null, maxA = Math.max.apply(null, A.map(function (r) { return r.value; })) || 1, maxB = B ? (Math.max.apply(null, B.map(function (r) { return r.value; })) || 1) : 1;
    var order = A.map(function (r, i) { return i; }).sort(function (x, y) { return A[y].value - A[x].value; }), ua = metric(spec.a).unit, ub = spec.b ? metric(spec.b).unit : '';
    var colB = spec.b && metric(spec.a).src === 'ehs' && metric(spec.b).src === 'ehs' ? 'var(--lumo-contrast-40pct)' : COL_B;
    return (B ? legend(spec) : '') + '<div class="cw-bars">' + order.map(function (i) {
      return '<div class="cw-row' + (B ? ' pair' : '') + '" title="' + esc(A[i].full) + '"><span class="cw-l">' + esc(A[i].label) + '</span><span class="cw-tracks"><span class="cw-t"><span class="cw-f" style="width:' + (A[i].value / maxA * 100).toFixed(0) + '%;background:' + (B ? colorFor(spec.a, false) : (A[i].hot ? colorFor(spec.a, false) : 'var(--lumo-contrast-30pct)')) + '"></span></span>' + (B ? '<span class="cw-t"><span class="cw-f" style="width:' + (B[i].value / maxB * 100).toFixed(0) + '%;background:' + colB + '"></span></span>' : '') + '</span><span class="cw-v"><b>' + esc(num(A[i].value)) + ua + '</b>' + (B ? '<b>' + esc(num(B[i].value)) + ub + '</b>' : '') + '</span></div>';
    }).join('') + '</div>';
  }
  function vizScatter(spec) {
    var A = rows(spec.scope, spec.a), B = rows(spec.scope, spec.b), w = 360, h = 160, pl = 40, pb = 26;
    var maxA = Math.max.apply(null, A.map(function (r) { return r.value; })) * 1.15 || 1, bs = B.map(function (r) { return r.value; }), maxB = Math.max.apply(null, bs) * 1.08 || 1, minB = Math.min.apply(null, bs) * 0.92;
    return '<svg class="cw-svg tall" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(title(spec)) + '"><line class="grid" x1="' + pl + '" y1="' + (h - pb) + '" x2="' + w + '" y2="' + (h - pb) + '"/><line class="grid" x1="' + pl + '" y1="6" x2="' + pl + '" y2="' + (h - pb) + '"/>' +
      '<text x="' + pl + '" y="' + (h - 6) + '">' + esc(metric(spec.b).label) + ' →</text><text x="12" y="10" transform="rotate(-90 12 10)" text-anchor="end">' + esc(metric(spec.a).label) + ' →</text>' +
      A.map(function (r, i) { var x = pl + (B[i].value - minB) / ((maxB - minB) || 1) * (w - pl - 12), y = 8 + (1 - r.value / maxA) * (h - pb - 10); return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r.hot ? 7 : 5) + '" fill="' + (r.hot ? COL_A : COL_B) + '" stroke="#fff" stroke-width="2"><title>' + esc(r.full + ': ' + r.value + metric(spec.a).unit + ' / ' + B[i].value + metric(spec.b).unit) + '</title></circle>' + (r.hot ? '<text x="' + (x + 10).toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" class="lbl">' + esc(r.label) + '</text>' : ''); }).join('') + '</svg>' +
      '<p class="cw-cap">Each dot is a ' + (spec.scope === 'all' ? 'facility' : 'department') + '. Red dots are flagged <strong>Elevated</strong>; hover for values.</p>';
  }
  function vizKpi(spec) {
    function one(mid, isB) { var m = metric(mid), s = series(spec.scope, mid), d = s[11] - s[0], bad = (d > 0) === (m.shape === 'up'); return '<div class="cw-kpi"><div class="cw-kpi-l">' + esc(m.label) + srcChip(m.src) + '</div><div class="cw-kpi-v" style="color:' + colorFor(mid, isB) + '">' + esc(num(total(spec.scope, mid))) + '<small>' + m.unit + '</small></div><div class="cw-kpi-d ' + (d === 0 ? '' : bad ? 'bad' : 'good') + '"><i class="fa-solid ' + (d > 0 ? 'fa-arrow-up-right' : d < 0 ? 'fa-arrow-down-right' : 'fa-arrow-right') + '" aria-hidden="true"></i>' + (d === 0 ? 'No change' : esc(num(Math.abs(Math.round(d * 10) / 10))) + m.unit + ' over 12 weeks') + '</div></div>'; }
    return '<div class="cw-kpis">' + one(spec.a, false) + (spec.b ? one(spec.b, true) : '') + '</div>';
  }
  function vizTable(spec) {
    var A = rows(spec.scope, spec.a), B = spec.b ? rows(spec.scope, spec.b) : null;
    return '<table class="cw-table"><thead><tr><th>' + (spec.scope === 'all' ? 'Facility' : 'Department') + '</th><th class="n">' + esc(metric(spec.a).label) + '</th>' + (B ? '<th class="n">' + esc(metric(spec.b).label) + '</th>' : '') + '</tr></thead><tbody>' + A.map(function (r, i) { return '<tr><td>' + esc(r.full) + '</td><td class="n">' + esc(num(r.value)) + metric(spec.a).unit + '</td>' + (B ? '<td class="n">' + esc(num(B[i].value)) + metric(spec.b).unit + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function body(spec) { switch (spec.viz) { case 'trend': return vizTrend(spec); case 'scatter': return spec.b ? vizScatter(spec) : vizBars(spec); case 'kpi': return vizKpi(spec); case 'table': return vizTable(spec); default: return vizBars(spec); } }
  function title(spec) { return spec.title || (metric(spec.a).label + (spec.b ? ' vs ' + metric(spec.b).label : '') + ', ' + scopeLabel(spec.scope)); }
  function sources(spec) { var s = [metric(spec.a).src]; if (spec.b && s.indexOf(metric(spec.b).src) < 0) s.push(metric(spec.b).src); return s; }
  function rowsFor(spec) { return spec.viz === 'kpi' ? 3 : spec.viz === 'trend' ? 5 : 6; }
  function vizAllowed(spec) { return spec.b ? ['trend', 'bars', 'scatter', 'kpi', 'table'] : ['trend', 'bars', 'kpi', 'table']; }

  /* ── State ─────────────────────────────────────────────────────────────── */
  var seq = 10;
  function W(spec) { spec.id = 'c' + (seq++); spec.w = spec.w || 6; return spec; }
  var S, ui = {}, dlgKey = 0, A = null;
  function fresh() { return { view: 'home', order: DEFAULT_ORDER.slice(), hidden: {}, menu: null, widgets: [W({ scope: 'plant4', a: 'incidents', b: 'completions', viz: 'trend', w: 8 }), W({ scope: 'all', a: 'trir', b: 'compliance', viz: 'kpi', w: 4 })] }; }
  S = fresh();

  /* ── Custom modules section ────────────────────────────────────────────── */
  function cardHtml(spec, editable) {
    var menu = S.menu === spec.id ? '<div class="dw-menu"><button type="button" data-cedit="' + spec.id + '">Edit module</button><div class="dw-menu-l">Width</div>' + [[4, 'Third'], [6, 'Half'], [8, 'Two thirds'], [12, 'Full width']].map(function (s) { return '<button type="button" data-csize="' + s[0] + '" data-cid="' + spec.id + '">' + s[1] + ((spec.w || 6) === s[0] ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : '') + '</button>'; }).join('') + '<div class="dw-menu-d"></div><button type="button" class="danger" data-cremove="' + spec.id + '">Remove module</button></div>' : '';
    return '<article class="dw-card' + (editable ? ' is-editable' : '') + '" data-cid="' + spec.id + '" style="grid-column:span ' + (spec.w || 6) + ';grid-row:span ' + rowsFor(spec) + '" tabindex="0"><div class="dw-head">' + (editable ? '<span class="dw-grip" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span>' : '') + '<span class="dw-ic"><i class="fa-regular ' + (spec.b ? 'fa-arrow-right-arrow-left' : metric(spec.a).icon) + '" aria-hidden="true"></i></span><span class="dw-title" title="' + esc(title(spec)) + '">' + esc(title(spec)) + '</span><span class="dw-srcs">' + sources(spec).map(function (s) { return srcChip(s); }).join('') + '</span>' + (editable ? '<span class="dw-kebab-wrap"><button type="button" class="dw-kebab" data-cmenu="' + spec.id + '" aria-label="Module options"><i class="fa-regular fa-ellipsis-vertical" aria-hidden="true"></i></button>' + menu + '</span>' : '') + '</div><div class="dw-body">' + body(spec) + '</div></article>';
  }
  function renderCustom() {
    var host = ui.custom; if (!host) return;
    var editing = S.view === 'build';
    host.innerHTML = '<div class="module-head"><div><h2>Your modules <span class="count">' + S.widgets.length + '</span></h2><p class="sub">Comparisons you built from Convergence and Vector EHS data.' + (editing ? '' : ' Change them in Settings, Build your dashboard.') + '</p></div>' + (editing ? '<div class="head-tools"><vaadin-button theme="secondary small" data-act="bld-add">Add module</vaadin-button></div>' : '') + '</div>' +
      '<div class="dw-grid cw-grid">' + S.widgets.map(function (w) { return cardHtml(w, editing); }).join('') + (editing ? '<button type="button" class="dw-add" data-act="bld-add"><span class="dw-add-mark"><i class="fa-regular fa-plus" aria-hidden="true"></i></span><span class="dw-add-t">Add module</span><span class="dw-add-s">Pick a metric from either product, compare it with another, and choose how to show it.</span></button>' : '') + '</div>' +
      (!S.widgets.length && !editing ? '<div class="empty" style="margin:0 20px 20px"><i class="fa-regular fa-table-cells-large" aria-hidden="true" style="color:var(--lumo-primary-color)"></i><h3>No modules yet</h3><p>Build comparisons like safety trends against training data for one facility.</p><vaadin-button theme="secondary small" data-act="bld-open">Build your dashboard</vaadin-button></div>' : '');
    host.hidden = !!S.hidden.custom && !editing;
  }

  /* ── Layout: order + hidden, plus the edit chrome ──────────────────────── */
  function moduleEl(id) { return id === 'row4' ? $('#main .page-inner .row4') : $('#' + id); }
  function applyLayout() {
    var page = ui.page; if (!page) return;
    var editing = S.view === 'build';
    S.order.forEach(function (id) { var el = moduleEl(id); if (!el) return; page.appendChild(el); el.hidden = !!S.hidden[id] && !editing; if (editing) el.classList.add('is-editing'); else el.classList.remove('is-editing'); el.classList.toggle('is-hidden-mod', !!S.hidden[id]); });
    $$('.mod-chrome', page).forEach(function (c) { c.remove(); });
    if (editing) {
      S.order.forEach(function (id, i) {
        var el = moduleEl(id), m = mod(id); if (!el) return;
        var c = document.createElement('div'); c.className = 'mod-chrome';
        c.innerHTML = '<span class="dw-grip" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span><span class="mod-name">' + esc(m.name) + '</span><span class="dw-srcs">' + m.src.map(function (s) { return srcChip(s); }).join('') + '</span><span class="mod-desc">' + esc(m.desc) + '</span><span class="mod-tools"><vaadin-button theme="icon small" aria-label="Move up" data-act="bld-up" data-id="' + id + '"' + (i === 0 ? ' disabled' : '') + '><i class="fa-regular fa-arrow-up" aria-hidden="true"></i></vaadin-button><vaadin-button theme="icon small" aria-label="Move down" data-act="bld-down" data-id="' + id + '"' + (i === S.order.length - 1 ? ' disabled' : '') + '><i class="fa-regular fa-arrow-down" aria-hidden="true"></i></vaadin-button><label class="mod-switch"><span>' + (S.hidden[id] ? 'Hidden' : 'Shown') + '</span><vwc-switch data-act="bld-toggle" data-id="' + id + '" accessible-name="Show ' + esc(m.name) + '"' + (S.hidden[id] ? '' : ' checked') + '></vwc-switch></label></span>';
        el.insertBefore(c, el.firstChild);
      });
    }
    var bar = ui.buildBar; if (bar) bar.hidden = !editing;
    document.body.classList.toggle('is-building', editing);
  }

  /* ── Settings page ─────────────────────────────────────────────────────── */
  function renderSettings() {
    var shown = S.order.filter(function (id) { return !S.hidden[id]; }).length;
    ui.settings.innerHTML = '<div class="dw-page"><div class="dw-page-head"><div><h1>Settings</h1><p>Your preferences for Vector Bridge. Product-level settings stay in each product.</p></div></div>' +
      '<div class="st-grid"><section class="card st-card st-hero"><div class="st-ic"><i class="fa-regular fa-table-cells-large" aria-hidden="true"></i></div><div class="st-body"><h2>Home dashboard</h2><p>Your home page is a dashboard you can build: turn the standard modules on or off, put them in the order you work in, and add your own comparisons from either product’s data.</p><p class="st-meta"><span>' + shown + ' of ' + S.order.length + ' modules shown</span><span class="dot"></span><span>' + S.widgets.length + ' of your own</span><span class="dot"></span><span>Last changed today</span></p></div><div class="st-actions"><vaadin-button theme="primary" data-act="bld-open"><i class="fa-regular fa-pen-ruler" aria-hidden="true" style="margin-right:8px"></i>Build your dashboard</vaadin-button><vaadin-button theme="tertiary" data-act="bld-reset">Reset to default</vaadin-button></div></section>' +
      [['fa-bell', 'Notifications', 'Which recommendations, tasks and deadlines reach you by email and in the app.'], ['fa-arrows-rotate', 'Data sync', 'When Convergence and Vector EHS data refresh, and who gets sync failure alerts.'], ['fa-sliders', 'Recommendation rules', 'Thresholds that create recommendations, like the near-miss cluster rule.'], ['fa-user', 'Profile', 'Name, email, job title and side nav text size.']].map(function (r) { return '<button type="button" class="card st-card st-row" data-act="bld-setting" data-name="' + esc(r[1]) + '"><span class="st-ic small"><i class="fa-regular ' + r[0] + '" aria-hidden="true"></i></span><span class="st-body"><h2>' + esc(r[1]) + '</h2><p>' + esc(r[2]) + '</p></span><i class="fa-regular fa-chevron-right st-chev" aria-hidden="true"></i></button>'; }).join('') + '</div></div>';
  }

  /* ── Add / edit module dialog ──────────────────────────────────────────── */
  function openAdd(existing) {
    A = existing ? { id: existing.id, scope: existing.scope, a: existing.a, b: existing.b, viz: existing.viz, w: existing.w } : { id: null, scope: 'all', a: null, b: null, viz: 'bars', w: 6 };
    openDialog(ui.addDlg, function (root) {
      root.innerHTML = '<div class="dw-dlg wide"><div class="dw-dlg-head"><span class="dw-dlg-ic"><i class="fa-regular fa-chart-mixed" aria-hidden="true"></i></span><div><h2>' + (A.id ? 'Edit module' : 'Add a module') + '</h2><p>Choose where, pick a metric from either product, compare it with another if you like, then choose how to show it.</p></div><vaadin-button theme="icon" aria-label="Close" data-act="dlg-close"><i class="fa-regular fa-xmark" aria-hidden="true"></i></vaadin-button></div><div class="dw-dlg-body" id="bldAddBody"></div></div>';
      draw(root);
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var act = b.dataset.act;
        if (act === 'dlg-close') ui.addDlg.opened = false;
        if (act === 'pick-a') { A.a = b.dataset.id; if (A.b === A.a) A.b = null; if (vizAllowed(A).indexOf(A.viz) < 0) A.viz = 'bars'; draw(root); }
        if (act === 'pick-b') { A.b = b.dataset.id === 'none' ? null : b.dataset.id; if (vizAllowed(A).indexOf(A.viz) < 0) A.viz = 'bars'; draw(root); }
        if (act === 'pick-viz') { A.viz = b.dataset.v; draw(root); }
        if (act === 'pick-sugg') { var sg = SUGGESTIONS[Number(b.dataset.i)].spec; A.scope = sg.scope; A.a = sg.a; A.b = sg.b; A.viz = sg.viz; A.w = sg.w; draw(root); }
        if (act === 'add-confirm') {
          var spec = { scope: A.scope, a: A.a, b: A.b, viz: A.viz, w: A.w || (A.viz === 'kpi' ? 4 : A.viz === 'trend' ? 8 : 6) };
          if (A.id) { var i = S.widgets.map(function (x) { return x.id; }).indexOf(A.id); spec.id = A.id; S.widgets[i] = spec; } else { S.widgets.push(W(spec)); }
          ui.addDlg.opened = false; renderCustom(); App.toast(A.id ? 'Module updated' : 'Module added', title(spec) + (A.id ? '' : ' is on your home page.'));
        }
      });
    });
  }
  function draw(root) {
    var bodyEl = $('#bldAddBody', root);
    var scopeSel = '<vaadin-select theme="outlined" id="bldScope" label="Where" style="width:100%"></vaadin-select>';
    function list(act, cur, allowNone, excl) {
      var out = allowNone ? '<button type="button" class="dw-mrow' + (cur == null ? ' is-on' : '') + '" data-act="' + act + '" data-id="none"><span class="dw-ic"><i class="fa-regular fa-ban" aria-hidden="true"></i></span><span>Nothing<small>Show one metric on its own</small></span></button>' : '';
      [['ehs', 'Vector EHS'], ['ct', 'Convergence']].forEach(function (g) { out += '<div class="dw-cat">' + srcChip(g[0], g[1]) + '</div>' + METRICS.filter(function (m) { return m.src === g[0] && m.id !== excl; }).map(function (m) { return '<button type="button" class="dw-mrow' + (cur === m.id ? ' is-on' : '') + '" data-act="' + act + '" data-id="' + m.id + '"><span class="dw-ic"><i class="fa-regular ' + m.icon + '" aria-hidden="true"></i></span><span>' + esc(m.label) + '</span></button>'; }).join(''); });
      return out;
    }
    var left = '<div class="dw-step"><span class="n">1</span>Where</div>' + scopeSel + '<div class="dw-step"><span class="n">2</span>Metric</div>' + list('pick-a', A.a, false, null) + (A.a ? '<div class="dw-step"><span class="n">3</span>Compare with</div>' + list('pick-b', A.b, true, A.a) : '');
    var right = !A.a ? '<div class="dw-step"><span class="n">0</span>Start from a comparison</div><div class="bld-sugg">' + SUGGESTIONS.map(function (s, i) { return '<button type="button" class="dw-mrow pair" data-act="pick-sugg" data-i="' + i + '"><span class="dw-ic"><i class="fa-regular fa-arrow-right-arrow-left" aria-hidden="true"></i></span><span>' + esc(s.label) + '<small>' + esc(s.hint) + '</small></span></button>'; }).join('') + '</div><div class="dw-prev-empty"><i class="fa-regular fa-chart-bar" aria-hidden="true"></i><b>Or build it yourself</b><span>Pick where, then a metric on the left.</span></div>'
      : '<div class="dw-step"><span class="n">4</span>Show as</div><div class="dw-vizchips">' + vizAllowed(A).map(function (v) { return '<button type="button" class="dw-chip' + (A.viz === v ? ' is-on' : '') + '" data-act="pick-viz" data-v="' + v + '"><i class="fa-regular ' + VIZ[v][1] + '" aria-hidden="true"></i>' + VIZ[v][0] + '</button>'; }).join('') + '</div><div class="dw-step"><span class="n">5</span>Preview</div><div class="dw-grid preview cw-grid">' + cardHtml({ id: 'prev', scope: A.scope, a: A.a, b: A.b, viz: A.viz, w: 12 }, false) + '</div><p class="field-hint">' + (A.scope === 'all' ? 'Breaks down by facility.' : 'Breaks down by department at ' + esc(scopeLabel(A.scope)) + '.') + ' Follows the home page’s date range.</p><div class="dw-dlg-foot"><vaadin-button theme="tertiary" data-act="dlg-close">Cancel</vaadin-button><vaadin-button theme="primary" data-act="add-confirm">' + (A.id ? 'Save module' : 'Add to my home') + '</vaadin-button></div>';
    bodyEl.innerHTML = '<div class="dw-add-l">' + left + '</div><div class="dw-add-r">' + right + '</div>';
    var sel = $('#bldScope', bodyEl); sel.items = [{ label: 'All facilities', value: 'all' }].concat(D.facilities.map(function (f) { return { label: f.name, value: f.id }; })); sel.value = A.scope;
    sel.addEventListener('value-changed', function (e) { if (e.detail.value && e.detail.value !== A.scope) { A.scope = e.detail.value; draw(root); } });
  }
  function openDialog(dlg, setup) { var key = ++dlgKey; dlg.renderer = function (root) { if (root.__k === key) return; root.__k = key; root.innerHTML = ''; setup(root); }; dlg.opened = true; }

  /* ── Views ─────────────────────────────────────────────────────────────── */
  function render() {
    var settings = S.view === 'settings';
    ui.page.hidden = settings; ui.settings.hidden = !settings;
    $$('.sidenav .nitem').forEach(function (a) { var on = (a.dataset.nav === 'home' && S.view === 'home') || (a.dataset.nav === 'settings' && settings); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (settings) renderSettings();
    renderCustom(); applyLayout();
  }
  function show(view) { S.view = view; S.menu = null; render(); var m = $('#main'); if (m) m.scrollTop = 0; }

  /* ── Events ────────────────────────────────────────────────────────────── */
  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (S.menu && !(t.closest && t.closest('.dw-kebab-wrap'))) { S.menu = null; renderCustom(); }
      var cm = t.closest && t.closest('[data-cmenu]'); if (cm) { e.stopPropagation(); S.menu = S.menu === cm.dataset.cmenu ? null : cm.dataset.cmenu; renderCustom(); return; }
      var cs = t.closest && t.closest('[data-csize]'); if (cs) { var w = S.widgets.filter(function (x) { return x.id === cs.dataset.cid; })[0]; if (w) w.w = Number(cs.dataset.csize); S.menu = null; renderCustom(); return; }
      var ce = t.closest && t.closest('[data-cedit]'); if (ce) { var w2 = S.widgets.filter(function (x) { return x.id === ce.dataset.cedit; })[0]; S.menu = null; renderCustom(); if (w2) openAdd(w2); return; }
      var cr = t.closest && t.closest('[data-cremove]'); if (cr) { var idx = S.widgets.map(function (x) { return x.id; }).indexOf(cr.dataset.cremove), gone = S.widgets.splice(idx, 1)[0]; S.menu = null; renderCustom(); App.toast('Module removed', title(gone), { label: 'Undo', run: function () { S.widgets.splice(idx, 0, gone); renderCustom(); } }); return; }
      var b = t.closest && t.closest('[data-act^="bld-"]'); if (!b) return;
      if (b.tagName === 'A') e.preventDefault();
      switch (b.dataset.act) {
        case 'bld-open': show('build'); break;
        case 'bld-done': show('home'); App.toast('Home page saved', 'Your layout and modules are kept for you on every device.'); break;
        case 'bld-settings': show('settings'); break;
        case 'bld-reset': { var keep = S.widgets; S = fresh(); S.widgets = keep; S.view = 'settings'; render(); App.toast('Layout reset', 'Standard modules are back in their default order. Your own modules are kept.'); break; }
        case 'bld-add': openAdd(null); break;
        case 'bld-up': case 'bld-down': { var i = S.order.indexOf(b.dataset.id), j = b.dataset.act === 'bld-up' ? i - 1 : i + 1; if (j < 0 || j >= S.order.length) break; var tmp = S.order[i]; S.order[i] = S.order[j]; S.order[j] = tmp; applyLayout(); var el = moduleEl(b.dataset.id); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); break; }
        case 'bld-setting': App.notYet(b.dataset.name + ' settings'); break;
        default: break;
      }
    });
    document.addEventListener('checked-change', function (e) {
      var sw = e.target.closest && e.target.closest('vwc-switch[data-act="bld-toggle"]'); if (!sw) return;
      S.hidden[sw.dataset.id] = !e.detail; applyLayout();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.menu) { S.menu = null; renderCustom(); } });
  }

  /* ── Flow-map states ───────────────────────────────────────────────────── */
  var KNOWN = ['custom', 'settings', 'build', 'add-module'], pendingState = null, ready = false;
  function reset() { var v = fresh(); S.view = v.view; S.order = v.order; S.hidden = {}; S.menu = null; S.widgets = v.widgets; if (ui.addDlg) ui.addDlg.opened = false; }
  function applyState(id) {
    if (!ready) { if (KNOWN.indexOf(id) < 0) return false; pendingState = id; return true; }
    switch (id) {
      case 'custom': show('home'); setTimeout(function () { var m = $('#custom'); if (m) m.scrollIntoView({ block: 'start' }); }, 50); return true;
      case 'settings': show('settings'); return true;
      case 'build': show('build'); return true;
      case 'add-module': show('build'); openAdd(null); return true;
      default: return false;
    }
  }
  function init() {
    if (ready) return;
    ui.page = $('#main .page-inner'); ui.settings = $('#settingsView'); ui.custom = $('#custom'); ui.buildBar = $('#buildBar'); ui.addDlg = $('#bldAddDlg');
    if (!ui.settings || !ui.page) return;
    bind(); ready = true; render();
    if (pendingState) { var p = pendingState; pendingState = null; applyState(p); }
  }
  window.Builder = { show: show, applyState: applyState, reset: reset, renderCustom: renderCustom, applyLayout: applyLayout, init: init };
  var whenReady = Promise.all(['vaadin-dialog', 'vaadin-select', 'vwc-switch'].map(function (t) { return customElements.whenDefined(t); }));
  var domReady = new Promise(function (res) { if (document.readyState !== 'loading') res(); else document.addEventListener('DOMContentLoaded', res); });
  Promise.all([whenReady, domReady]).then(init);
  domReady.then(function () { setTimeout(init, 9000); });
})();
