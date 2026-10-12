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
    { id: 'compare', name: 'Facility comparison', desc: 'Incident rate next to training compliance, one row per facility.', src: ['ehs', 'ct'] },
    { id: 'row4', name: 'Assigned to me and Compliance calendar', desc: 'Your tasks from both products and the shared calendar.', src: ['ehs', 'ct'] },
    { id: 'audit', name: 'OSHA audit readiness', desc: 'Injury logs and the related training records in one packet.', src: ['ehs', 'ct'] }
  ];
  function mod(id) { for (var i = 0; i < MODULES.length; i++) if (MODULES[i].id === id) return MODULES[i]; return null; }
  var DEFAULT_ORDER = ['kpis', 'recs', 'compare', 'row4', 'audit'];

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
  /* A module holds a LIST of metrics (spec.m, any number), from either
     product. Series take colors in selection order, never by value, so a
     metric keeps its color when others are added or removed. Older specs
     with a / b still render through mids(). */
  /* No cap on selections: one distinct color per metric in the catalog. */
  var SERIES = ['var(--lumo-error-color)', 'var(--lumo-primary-color)', 'var(--vwc-color-puerto-rico-600)', 'var(--vwc-color-ecstacy-600)', 'var(--vwc-color-vivid-violet-600)', 'var(--vwc-color-conifer-700)', 'var(--vwc-color-picton-blue-400)', 'var(--vwc-color-cinnabar-800)', 'var(--vwc-color-ecstacy-300)', 'var(--lumo-contrast-60pct)'];
  var MAX_M = SERIES.length;
  var COL_A = SERIES[0], COL_B = SERIES[1];
  function mids(spec) { return (spec.m && spec.m.length) ? spec.m.slice(0, MAX_M) : [spec.a, spec.b].filter(Boolean); }
  function legend(spec) {
    return '<div class="cw-legend">' + mids(spec).map(function (id, i) { var m = metric(id); return '<span><i class="sw" style="background:' + SERIES[i] + '"></i>' + esc(m.label) + srcChip(m.src) + '</span>'; }).join('') + '</div>';
  }
  function vizTrend(spec) {
    var ids = mids(spec), raw = ids.map(function (id) { return series(spec.scope, id); }), w = 360, h = 130, pl = 34, pb = 22, idx = ids.length > 1;
    var vals = idx ? raw.map(function (s) { return s.map(function (v) { return s[0] ? v / s[0] * 100 : 100; }); }) : raw;
    var all = [].concat.apply([], vals), min = Math.min.apply(null, all), max = Math.max.apply(null, all), span = (max - min) || 1;
    function pts(v) { return v.map(function (x, i) { return [pl + i * (w - pl - 10) / 11, 10 + (1 - (x - min) / span) * (h - pb - 16)]; }); }
    function path(p) { return p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); }
    var lines = vals.map(function (v, i) { var p = pts(v); return '<path d="' + path(p) + '" fill="none" stroke="' + SERIES[i] + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + p[11][0].toFixed(1) + '" cy="' + p[11][1].toFixed(1) + '" r="4" fill="' + SERIES[i] + '" stroke="#fff" stroke-width="2"/>'; }).reverse().join('');
    return legend(spec) + '<svg class="cw-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(title(spec)) + '">' +
      '<line class="grid" x1="' + pl + '" y1="' + (h - pb) + '" x2="' + w + '" y2="' + (h - pb) + '"/><line class="grid" x1="' + pl + '" y1="10" x2="' + w + '" y2="10"/>' +
      '<text x="' + (pl - 6) + '" y="14" text-anchor="end">' + (idx ? Math.round(max) : esc(num(max))) + '</text><text x="' + (pl - 6) + '" y="' + (h - pb + 4) + '" text-anchor="end">' + (idx ? Math.round(min) : esc(num(min))) + '</text>' + lines +
      '<text x="' + pl + '" y="' + (h - 5) + '">12 weeks ago</text><text x="' + w + '" y="' + (h - 5) + '" text-anchor="end">This week</text></svg>' +
      '<p class="cw-cap">' + (idx ? 'Series indexed to 100 at week 1 so they share one axis. ' : '') + 'Weekly values: ' + ids.map(function (id, i) { var m = metric(id); return esc(m.label) + ' <strong>' + esc(num(raw[i][0])) + ' → ' + esc(num(raw[i][11])) + m.unit + '</strong>'; }).join(', ') + '.</p>';
  }
  function vizBars(spec) {
    var ids = mids(spec), R = ids.map(function (id) { return rows(spec.scope, id); }), multi = ids.length > 1;
    var maxes = R.map(function (r) { return Math.max.apply(null, r.map(function (x) { return x.value; })) || 1; });
    var order = R[0].map(function (r, i) { return i; }).sort(function (x, y) { return R[0][y].value - R[0][x].value; });
    return (multi ? legend(spec) : '') + '<div class="cw-bars">' + order.map(function (i) {
      return '<div class="cw-row' + (multi ? ' pair' : '') + '" title="' + esc(R[0][i].full) + '"><span class="cw-l">' + esc(R[0][i].label) + '</span><span class="cw-tracks">' +
        R.map(function (r, k) { return '<span class="cw-t"><span class="cw-f" style="width:' + (r[i].value / maxes[k] * 100).toFixed(0) + '%;background:' + (multi ? SERIES[k] : (r[i].hot ? SERIES[0] : 'var(--lumo-contrast-30pct)')) + '"></span></span>'; }).join('') +
        '</span><span class="cw-v">' + R.map(function (r, k) { return '<b>' + esc(num(r[i].value)) + metric(ids[k]).unit + '</b>'; }).join('') + '</span></div>';
    }).join('') + '</div>';
  }
  function vizScatter(spec) {
    var ids = mids(spec), A = rows(spec.scope, ids[0]), B = rows(spec.scope, ids[1]), w = 360, h = 160, pl = 40, pb = 26;
    var maxA = Math.max.apply(null, A.map(function (r) { return r.value; })) * 1.15 || 1, bs = B.map(function (r) { return r.value; }), maxB = Math.max.apply(null, bs) * 1.08 || 1, minB = Math.min.apply(null, bs) * 0.92;
    return '<svg class="cw-svg tall" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(title(spec)) + '"><line class="grid" x1="' + pl + '" y1="' + (h - pb) + '" x2="' + w + '" y2="' + (h - pb) + '"/><line class="grid" x1="' + pl + '" y1="6" x2="' + pl + '" y2="' + (h - pb) + '"/>' +
      '<text x="' + pl + '" y="' + (h - 6) + '">' + esc(metric(ids[1]).label) + ' →</text><text x="12" y="10" transform="rotate(-90 12 10)" text-anchor="end">' + esc(metric(ids[0]).label) + ' →</text>' +
      A.map(function (r, i) { var x = pl + (B[i].value - minB) / ((maxB - minB) || 1) * (w - pl - 12), y = 8 + (1 - r.value / maxA) * (h - pb - 10); return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r.hot ? 7 : 5) + '" fill="' + (r.hot ? COL_A : COL_B) + '" stroke="#fff" stroke-width="2"><title>' + esc(r.full + ': ' + r.value + metric(ids[0]).unit + ' / ' + B[i].value + metric(ids[1]).unit) + '</title></circle>' + (r.hot ? '<text x="' + (x + 10).toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" class="lbl">' + esc(r.label) + '</text>' : ''); }).join('') + '</svg>' +
      '<p class="cw-cap">Each dot is a ' + (spec.scope === 'all' ? 'facility' : 'department') + '. Red dots are flagged <strong>Elevated</strong>; hover for values.</p>';
  }
  function vizKpi(spec) {
    function one(mid, i) { var m = metric(mid), s = series(spec.scope, mid), d = s[11] - s[0], bad = (d > 0) === (m.shape === 'up'); return '<div class="cw-kpi"><div class="cw-kpi-l">' + esc(m.label) + srcChip(m.src) + '</div><div class="cw-kpi-v" style="color:' + SERIES[i] + '">' + esc(num(total(spec.scope, mid))) + '<small>' + m.unit + '</small></div><div class="cw-kpi-d ' + (d === 0 ? '' : bad ? 'bad' : 'good') + '"><i class="fa-solid ' + (d > 0 ? 'fa-arrow-up-right' : d < 0 ? 'fa-arrow-down-right' : 'fa-arrow-right') + '" aria-hidden="true"></i>' + (d === 0 ? 'No change' : esc(num(Math.abs(Math.round(d * 10) / 10))) + m.unit + ' over 12 weeks') + '</div></div>'; }
    return '<div class="cw-kpis">' + mids(spec).map(one).join('') + '</div>';
  }
  function vizTable(spec) {
    var ids = mids(spec), R = ids.map(function (id) { return rows(spec.scope, id); });
    return '<table class="cw-table"><thead><tr><th>' + (spec.scope === 'all' ? 'Facility' : 'Department') + '</th>' + ids.map(function (id) { return '<th class="n">' + esc(metric(id).label) + '</th>'; }).join('') + '</tr></thead><tbody>' + R[0].map(function (r, i) { return '<tr><td>' + esc(r.full) + '</td>' + R.map(function (x, k) { return '<td class="n">' + esc(num(x[i].value)) + metric(ids[k]).unit + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function body(spec) { switch (spec.viz) { case 'trend': return vizTrend(spec); case 'scatter': return mids(spec).length === 2 ? vizScatter(spec) : vizBars(spec); case 'kpi': return vizKpi(spec); case 'table': return vizTable(spec); default: return vizBars(spec); } }
  function labelList(ids) { var l = ids.map(function (id) { return metric(id).label; }); if (l.length < 3) return l.join(' vs '); if (l.length === 3) return l[0] + ', ' + l[1] + ' and ' + l[2]; return l[0] + ', ' + l[1] + ' and ' + (l.length - 2) + ' more'; }
  function title(spec) { return (spec.title && spec.title.trim()) || (labelList(mids(spec)) + ', ' + scopeLabel(spec.scope)); }
  function sources(spec) { var s = []; mids(spec).forEach(function (id) { var src = metric(id).src; if (s.indexOf(src) < 0) s.push(src); }); return s; }
  function vizAllowed(spec) { return mids(spec).length === 2 ? ['trend', 'bars', 'scatter', 'kpi', 'table'] : ['trend', 'bars', 'kpi', 'table']; }
  function iconFor(spec) { return mids(spec).length > 1 ? 'fa-arrow-right-arrow-left' : metric(mids(spec)[0]).icon; }
  function kindFor(spec) { return mids(spec).length > 1 ? 'Comparison' : 'Report'; }

  /* ── Build a module from a description ─────────────────────────────────
     Ported from the Readiness Hub's Agency Intelligence panel: the typed
     sentence is matched against the example comparisons first (keyword
     overlap >= 2, Keystone's intent match), otherwise a keyword parser reads
     the location, one or two metrics and the chart type. The interpretation
     is read back in the thread so the user can adjust before adding. */
  var STOP = ['the', 'and', 'a', 'in', 'on', 'to', 'is', 'of', 'how', 'what', 'where', 'when', 'do', 'does', 'with', 'for', 'are', 'by', 'an', 'at', 'its', 'my', 'me', 'show', 'compare', 'vs', 'versus'];
  function norm(s) { return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(function (w) { return w && STOP.indexOf(w) === -1; }); }
  function keywordOverlap(a, b) { var sb = norm(b); return norm(a).filter(function (w) { return sb.indexOf(w) !== -1; }).length; }
  var FAC_WORDS = { plant4: ['plant 4', 'riverside'], plant2: ['plant 2', 'columbus'], dceast: ['dc east', 'allentown'], plant1: ['plant 1', 'tulsa'], plant7: ['plant 7', 'greenville'], dcwest: ['dc west', 'reno'] };
  var METRIC_WORDS = [
    ['near_miss', ['near miss', 'near-miss', 'close call']], ['trir', ['incident rate', 'trir', 'rate of incident']], ['incidents', ['incident', 'injur', 'safety trend', 'safety']],
    ['observations', ['observation']], ['open_ca', ['corrective', 'action']], ['inspections', ['inspection', 'audit']],
    ['overdue', ['overdue', 'past due', 'late training', 'lapsed']], ['compliance', ['compliance', 'compliant']], ['completions', ['completion', 'completed', 'training data', 'training']], ['quals', ['qualification', 'certif', 'expir']]
  ];
  function describeToSpec(text) {
    var hit = SUGGESTIONS.filter(function (s) { return keywordOverlap(text, s.label + ' ' + s.hint) >= 2; })[0];
    if (hit) return { via: 'example', scope: hit.spec.scope, m: [hit.spec.a, hit.spec.b].filter(Boolean), viz: hit.spec.viz };
    var t = text.toLowerCase(), scope = 'all';
    Object.keys(FAC_WORDS).forEach(function (id) { FAC_WORDS[id].forEach(function (w) { if (t.indexOf(w) > -1) scope = id; }); });
    var found = [];
    METRIC_WORDS.forEach(function (pair) { if (pair[1].some(function (w) { return t.indexOf(w) > -1; }) && found.indexOf(pair[0]) < 0) found.push(pair[0]); });
    if (found.indexOf('incidents') > -1 && found.indexOf('trir') > -1) found.splice(found.indexOf('incidents'), 1);
    var m = found.slice(0, MAX_M);
    if (!m.length) m = [t.indexOf('training') > -1 ? 'completions' : 'incidents'];
    if (m.length === 1 && /\b(compare|vs|versus|against|with|and)\b/.test(t)) m.push(metric(m[0]).src === 'ehs' ? 'completions' : 'incidents');
    var viz = /trend|over time|week|month|history/.test(t) ? 'trend' : /scatter|correlat|relationship/.test(t) ? (m.length === 2 ? 'scatter' : 'bars') : /table|list|rows/.test(t) ? 'table' : /number|total|how many|kpi/.test(t) ? 'kpi' : (m.length > 1 && scope !== 'all' ? 'trend' : 'bars');
    return { via: 'parsed', scope: scope, m: m, viz: viz };
  }
  function readBack(spec) { var ids = mids(spec); return ids.map(function (id) { return '**' + metric(id).label + '**'; }).join(ids.length > 2 ? ', ' : ' compared with ') + ' for **' + scopeLabel(spec.scope) + '**, shown as ' + VIZ[spec.viz][0].toLowerCase() + '.'; }
  function bold(text) { return String(text).split('**').map(function (p, i) { return i % 2 ? '<strong>' + esc(p) + '</strong>' : esc(p); }).join(''); }
  function thinkingHtml(label) { return '<div class="ai-turn"><div class="ai-bubble ai-thinking"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span><em>' + esc(label || 'Reading your data…') + '</em></div></div>'; }

  /* ── State ─────────────────────────────────────────────────────────────── */
  /* The dashboard IS the user's modules: standard modules (kpis, recs, …) and
     reporting modules they built ('w:<id>') share one order. */
  var seq = 10;
  function W(spec) { spec.id = 'c' + (seq++); return spec; }
  var S, ui = {}, dlgKey = 0, A = null;
  function fresh() {
    var w = [W({ scope: 'plant4', m: ['incidents', 'near_miss', 'completions'], viz: 'trend' }), W({ scope: 'all', m: ['trir', 'compliance'], viz: 'kpi' })];
    return { view: 'home', order: ['kpis', 'recs', 'w:' + w[0].id, 'compare', 'w:' + w[1].id, 'row4', 'audit'], hidden: {}, menu: null, widgets: w };
  }
  S = fresh();
  function widget(id) { return S.widgets.filter(function (x) { return x.id === id; })[0]; }
  function modMeta(id) {
    if (id.indexOf('w:') === 0) { var w = widget(id.slice(2)); return w ? { id: id, name: title(w), desc: kindFor(w) + ' you built, ' + VIZ[w.viz][0].toLowerCase() + '.', src: sources(w), custom: true } : null; }
    return mod(id);
  }

  /* ── Reporting modules the user built: each is a page-level module ─────── */
  function customHtml(w) {
    var menu = S.menu === w.id ? '<div class="dw-menu"><button type="button" data-cedit="' + w.id + '">Edit module</button><button type="button" data-cmove="up" data-cid="' + w.id + '">Move up</button><button type="button" data-cmove="down" data-cid="' + w.id + '">Move down</button><div class="dw-menu-d"></div><button type="button" class="danger" data-cremove="' + w.id + '">Remove from dashboard</button></div>' : '';
    return '<div class="module-head"><div><h2><span class="dw-ic"><i class="fa-regular ' + iconFor(w) + '" aria-hidden="true"></i></span>' + esc(title(w)) + '</h2><p class="sub">' + kindFor(w) + ' you built, ' + VIZ[w.viz][0].toLowerCase() + '. Follows the date range and location above.</p></div>' +
      '<div class="head-tools"><span class="dw-srcs">' + sources(w).map(function (s) { return srcChip(s, PRODUCT[s].label); }).join('') + '</span><span class="dw-kebab-wrap"><button type="button" class="dw-kebab" data-cmenu="' + w.id + '" aria-label="Module options"><i class="fa-regular fa-ellipsis-vertical" aria-hidden="true"></i></button>' + menu + '</span></div></div>' +
      '<div class="module-body cm-body cm-' + w.viz + '">' + body(w) + '</div>';
  }
  function renderCustom() {
    var page = ui.page; if (!page) return;
    S.widgets.forEach(function (w) {
      var el = document.getElementById('cm-' + w.id);
      if (!el) { el = document.createElement('section'); el.className = 'module card cm'; el.id = 'cm-' + w.id; el.setAttribute('aria-label', title(w)); page.appendChild(el); }
      el.innerHTML = customHtml(w);
    });
    $$('.module.cm', page).forEach(function (el) { if (!widget(el.id.slice(3))) el.remove(); });
  }
  function previewCard(spec) {
    return '<article class="dw-card" style="min-height:240px"><div class="dw-head"><span class="dw-ic"><i class="fa-regular ' + iconFor(spec) + '" aria-hidden="true"></i></span><span class="dw-title">' + esc(title(spec)) + '</span><span class="dw-srcs">' + sources(spec).map(function (s) { return srcChip(s); }).join('') + '</span></div><div class="dw-body">' + body(spec) + '</div></article>';
  }

  /* ── Layout: order + hidden, plus the edit chrome ──────────────────────── */
  function moduleEl(id) { return id === 'row4' ? $('#main .page-inner .row4') : id.indexOf('w:') === 0 ? document.getElementById('cm-' + id.slice(2)) : document.getElementById(id); }
  function applyLayout() {
    var page = ui.page; if (!page) return;
    var editing = S.view === 'build';
    S.order = S.order.filter(function (id) { return !!modMeta(id); });
    S.widgets.forEach(function (w) { if (S.order.indexOf('w:' + w.id) < 0) S.order.push('w:' + w.id); });
    S.order.forEach(function (id) { var el = moduleEl(id); if (!el) return; page.appendChild(el); el.hidden = !!S.hidden[id] && !editing; el.classList.toggle('is-editing', editing); el.classList.toggle('is-hidden-mod', !!S.hidden[id]); });
    $$('.mod-chrome', page).forEach(function (c) { c.remove(); });
    if (editing) {
      S.order.forEach(function (id, i) {
        var el = moduleEl(id), m = modMeta(id); if (!el || !m) return;
        var c = document.createElement('div'); c.className = 'mod-chrome';
        c.innerHTML = '<span class="dw-grip" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span><span class="mod-name">' + esc(m.name) + '</span><span class="dw-srcs">' + m.src.map(function (s) { return srcChip(s); }).join('') + '</span><span class="mod-desc">' + esc(m.desc) + '</span><span class="mod-tools"><vaadin-button theme="icon small" aria-label="Move up" data-act="bld-up" data-id="' + id + '"' + (i === 0 ? ' disabled' : '') + '><i class="fa-regular fa-arrow-up" aria-hidden="true"></i></vaadin-button><vaadin-button theme="icon small" aria-label="Move down" data-act="bld-down" data-id="' + id + '"' + (i === S.order.length - 1 ? ' disabled' : '') + '><i class="fa-regular fa-arrow-down" aria-hidden="true"></i></vaadin-button><label class="mod-switch"><span>' + (S.hidden[id] ? 'Hidden' : 'Shown') + '</span><vwc-switch data-act="bld-toggle" data-id="' + id + '" accessible-name="Show ' + esc(m.name) + '"' + (S.hidden[id] ? '' : ' checked') + '></vwc-switch></label></span>';
        el.insertBefore(c, el.firstChild);
      });
    }
    if (ui.buildBar) ui.buildBar.hidden = !editing;
    document.body.classList.toggle('is-building', editing);
  }
  function move(id, dir) { var i = S.order.indexOf(id), j = dir === 'up' ? i - 1 : i + 1; if (i < 0 || j < 0 || j >= S.order.length) return; var t = S.order[i]; S.order[i] = S.order[j]; S.order[j] = t; applyLayout(); var el = moduleEl(id); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }

  /* ── Settings page ─────────────────────────────────────────────────────── */
  function renderSettings() {
    var shown = S.order.filter(function (id) { return !S.hidden[id]; }).length;
    ui.settings.innerHTML = '<div class="dw-page"><div class="dw-page-head"><div><h1>Settings</h1><p>Your preferences for Vector Bridge. Product-level settings stay in each product.</p></div></div>' +
      '<div class="st-grid"><section class="card st-card st-hero"><div class="st-ic"><i class="fa-regular fa-table-cells-large" aria-hidden="true"></i></div><div class="st-body"><h2>Home dashboard</h2><p>Your home page is made of modules: the standard ones and the reports you build. Arrange them here, or add modules from the home page.</p><p class="st-meta"><span>' + shown + ' of ' + S.order.length + ' modules shown</span><span class="dot"></span><span>' + S.widgets.length + ' you built</span><span class="dot"></span><span>Last changed today</span></p></div><div class="st-actions"><vaadin-button theme="primary" data-act="bld-open"><i class="fa-regular fa-pen-ruler" aria-hidden="true" style="margin-right:8px"></i>Arrange your dashboard</vaadin-button><vaadin-button theme="tertiary" data-act="bld-reset">Reset to default</vaadin-button></div></section>' +
      [['fa-bell', 'Notifications', 'Which recommendations, tasks and deadlines reach you by email and in the app.'], ['fa-arrows-rotate', 'Data sync', 'When Convergence and Vector EHS data refresh, and who gets sync failure alerts.'], ['fa-sliders', 'Recommendation rules', 'Thresholds that create recommendations, like the near-miss cluster rule.'], ['fa-user', 'Profile', 'Name, email, job title and side nav text size.']].map(function (r) { return '<button type="button" class="card st-card st-row" data-act="bld-setting" data-name="' + esc(r[1]) + '"><span class="st-ic small"><i class="fa-regular ' + r[0] + '" aria-hidden="true"></i></span><span class="st-body"><h2>' + esc(r[1]) + '</h2><p>' + esc(r[2]) + '</p></span><i class="fa-regular fa-chevron-right st-chev" aria-hidden="true"></i></button>'; }).join('') + '</div></div>';
  }

  /* ── Add module: full-screen takeover (Keystone build view) ────────────
     Header bar: back, title, tabs (Create a new module | Existing modules),
     Cancel + Add to dashboard. Create tab is three columns:
       left    chat, Keystone's docked panel (thread, Try asking, input with
               send, note); minimizes to a 56px rail and expands again
       middle  parameters (name, where, metric, compare with, show as, size)
       right   live preview at dashboard scale + where it will land
     Chat and parameters are one model (A): an answer fills the parameters,
     editing a parameter updates the preview. */
  var TRY = ['Compare safety trends at Plant 4 with its training data', 'Near misses against overdue training at DC East, by department', 'Incident rate vs training compliance across all facilities', 'Open corrective actions by facility as a table'];
  function openAdd(opts) {
    opts = opts || {};
    var existing = opts.edit ? widget(opts.edit) : null;
    A = existing ? { id: existing.id, scope: existing.scope, m: mids(existing), viz: existing.viz, name: existing.title || '', tab: 'create', thread: [], q: '' }
                 : { id: null, scope: 'all', m: [], viz: 'bars', name: '', tab: opts.tab || 'existing', q: opts.q || '', thread: [], thinking: false };
    S.chatMin = !!opts.chatMin;
    S.studio = true; renderStudio();
    if (opts.q) setTimeout(function () { ask(opts.q); }, 60);
  }
  function closeStudio() { S.studio = false; ui.studio.hidden = true; ui.studio.innerHTML = ''; document.body.classList.remove('is-studio'); }
  function interpret(q) {
    var t = q.toLowerCase(), refine = A.m.length && !METRIC_WORDS.some(function (p) { return p[1].some(function (w) { return t.indexOf(w) > -1; }); });
    if (refine) {
      var viz = /trend|over time|week/.test(t) ? 'trend' : /scatter|correlat/.test(t) ? 'scatter' : /table|list|rows/.test(t) ? 'table' : /number|total|kpi/.test(t) ? 'kpi' : /bar/.test(t) ? 'bars' : null;
      var scope = null; Object.keys(FAC_WORDS).forEach(function (id) { FAC_WORDS[id].forEach(function (w) { if (t.indexOf(w) > -1) scope = id; }); }); if (/all facilit|every facilit|company/.test(t)) scope = 'all';
      if (viz && vizAllowed(A).indexOf(viz) > -1) A.viz = viz; if (scope) A.scope = scope;
      return (viz || scope) ? 'Updated: now ' + readBack(A) : 'I kept the module as it is. Try naming a location, a metric, or a chart type, like "show it as a table".';
    }
    var sp = describeToSpec(q); A.scope = sp.scope; A.m = sp.m; A.viz = sp.viz;
    return 'Read as ' + readBack(sp) + (sp.via === 'example' ? ' That matches one of the examples.' : '') + ' The parameters are filled in; change anything, or ask me to adjust it.';
  }
  function ask(q) {
    q = (q || '').trim(); if (!q || A.thinking) return;
    A.thread.push({ role: 'user', text: q }); A.thinking = true; A.q = ''; renderStudio();
    setTimeout(function () { var reply = interpret(q); A.thinking = false; A.thread.push({ role: 'assistant', text: reply }); renderStudio(); }, 620);
  }
  function chatHtml() {
    if (S.chatMin) return '<button type="button" class="ms-rail" data-act="ms-chat-open" title="Open the chat"><span class="ms-mark"><i class="fa-regular fa-message-lines" aria-hidden="true"></i></span><span class="vlabel">Describe it</span>' + (A.thread.length ? '<span class="ms-rail-count">' + A.thread.length + '</span>' : '') + '<i class="fa-solid fa-angles-right ms-rail-chev" aria-hidden="true"></i></button>';
    var thread = A.thread.length
      ? A.thread.map(function (m) { return m.role === 'user' ? '<div class="ms-user"><div class="bubble">' + esc(m.text) + '</div></div>' : '<div class="ms-ai"><span class="ms-mark sm"><i class="fa-regular fa-message-lines" aria-hidden="true"></i></span><div class="bubble">' + bold(m.text) + '</div></div>'; }).join('')
      : '<div class="ms-ai"><span class="ms-mark sm"><i class="fa-regular fa-message-lines" aria-hidden="true"></i></span><div class="bubble">Tell me what you want to see: a location, one or two things to compare, and how to show it. I will fill in the parameters and you can adjust them.</div></div><div class="ms-try"><div class="ms-try-l">Try asking</div>' + TRY.map(function (q) { return '<button type="button" class="ms-choice" data-act="ms-try" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>';
    return '<section class="ms-chat" aria-label="Describe the module"><div class="ms-chat-head"><div class="ms-chat-row"><span class="ms-mark"><i class="fa-regular fa-message-lines" aria-hidden="true"></i></span><div class="ms-chat-title">Describe it</div><button type="button" class="ms-iconbtn" data-act="ms-chat-reset" title="New conversation" aria-label="New conversation"><i class="fa-regular fa-rotate-left" aria-hidden="true"></i></button><button type="button" class="ms-iconbtn" data-act="ms-chat-min" title="Minimize the chat" aria-label="Minimize the chat"><i class="fa-regular fa-angles-left" aria-hidden="true"></i></button></div><p class="ms-chat-note">Ask in plain language and refine as you go, like "make it a table" or "just Plant 2".</p></div>' +
      '<div class="ms-thread" role="log" aria-live="polite">' + thread + (A.thinking ? '<div class="ms-ai"><span class="ms-mark sm"><i class="fa-regular fa-message-lines" aria-hidden="true"></i></span><div class="bubble ms-thinking"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span><em>Reading both products…</em></div></div>' : '') + '</div>' +
      '<div class="ms-input-wrap"><div class="ms-input"><textarea id="msAsk" rows="2" placeholder="e.g. Compare safety trends at Plant 4 with its training data" aria-label="Describe the module">' + esc(A.q || '') + '</textarea><button type="button" class="ms-send" data-act="ms-send" aria-label="Send"' + (A.thinking ? ' disabled' : '') + '><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button></div><p class="ms-input-note">Charts land on the preview and your dashboard, never in the thread.</p></div></section>';
  }
function paramsHtml() {
  var list = [['ehs', 'Vector EHS'], ['ct', 'Convergence']].map(function (g) {
    return '<div class="dw-cat-t">' + g[1] + '</div>' + METRICS.filter(function (m) { return m.src === g[0]; }).map(function (m) {
      var i = A.m.indexOf(m.id), on = i > -1;
      return '<button type="button" class="dw-mrow ms-check' + (on ? ' is-on' : '') + '" role="checkbox" aria-checked="' + on + '" data-act="toggle-m" data-id="' + m.id + '"' + '><span class="ms-box" aria-hidden="true">' + (on ? '<i class="fa-solid fa-check"></i>' : '') + '</span><span class="dw-ic"><i class="fa-regular ' + m.icon + '" aria-hidden="true"></i></span><span class="ms-mlabel">' + esc(m.label) + '</span>' + (on ? '<i class="sw ms-sw" style="background:' + SERIES[i] + '" title="Series color"></i>' : '') + '</button>';
    }).join('');
  }).join('');
  return '<section class="ms-params" aria-label="Parameters"><div class="ms-col-head"><h2>Parameters</h2><p>Filled in from the chat, or set them yourself.</p></div><div class="ms-params-body">' +
    '<vaadin-text-field theme="outlined" id="msName" label="Module name" placeholder="' + esc(A.m.length ? title({ scope: A.scope, m: A.m }) : 'Named for what it shows') + '" value="' + esc(A.name || '') + '" style="width:100%"></vaadin-text-field>' +
    '<div class="dw-step"><span class="n">1</span>Where</div><vaadin-select theme="outlined" id="msScope" aria-label="Where" style="width:100%"></vaadin-select>' +
    '<div class="dw-step"><span class="n">2</span>Metrics<span class="ms-count">' + A.m.length + ' selected</span>' + (A.m.length ? '<button type="button" class="ms-clear" data-act="clear-m">Clear</button>' : '') + '</div>' +
    '<p class="ms-hint">Pick as many as you like from either product to compare them.</p><div role="group" aria-label="Metrics">' + list + '</div>' +
    (A.m.length ? '<div class="dw-step"><span class="n">3</span>Show as</div><div class="dw-vizchips">' + vizAllowed(A).map(function (v) { return '<button type="button" class="dw-chip' + (A.viz === v ? ' is-on' : '') + '" data-act="pick-viz" data-v="' + v + '"><i class="fa-regular ' + VIZ[v][1] + '" aria-hidden="true"></i>' + VIZ[v][0] + '</button>'; }).join('') + '</div>' + (A.m.length !== 2 ? '<p class="ms-hint">Scatter needs exactly two metrics.</p>' : '') : '') +
    '</div></section>';
}
  function previewHtml() {
    var spec = A.m.length ? { scope: A.scope, m: A.m.slice(), viz: A.viz, title: A.name || '' } : null;
    return '<section class="ms-preview" aria-label="Preview"><div class="ms-col-head"><h2>Preview</h2><p>' + (spec ? 'How it will look on your dashboard. ' + (A.scope === 'all' ? 'Breaks down by facility.' : 'Breaks down by department at ' + esc(scopeLabel(A.scope)) + '.') + ' Follows the dashboard’s date range.' : 'Describe the module in the chat, or pick metrics in Parameters.') + '</p></div>' +
      (spec ? '<div class="ms-canvas"><div class="ms-ghost">Key metrics</div><div class="module card cm ms-live">' + customHtml(Object.assign({ id: 'preview' }, spec)).replace(/<span class="dw-kebab-wrap">[\s\S]*?<\/span><\/div><\/div>/, '</div></div>') + '</div><div class="ms-ghost">Recommended actions</div><p class="ms-where"><i class="fa-regular fa-arrow-turn-down-right" aria-hidden="true"></i>' + (A.id ? 'Stays where it is on your dashboard.' : 'Lands directly under Key metrics. Move it any time from its menu.') + '</p></div>'
        : '<div class="dw-prev-empty ms-empty"><i class="fa-regular fa-chart-mixed" aria-hidden="true"></i><b>Nothing to preview yet</b><span>Try "Compare safety trends at Plant 4 with its training data".</span></div>') + '</section>';
  }
  function existingHtml() {
    var hiddenIds = S.order.filter(function (id) { return S.hidden[id]; });
    return '<div class="ms-existing"><div class="ms-col-head"><h2>Existing modules</h2><p>' + (hiddenIds.length ? hiddenIds.length + ' module' + (hiddenIds.length === 1 ? ' is' : 's are') + ' off your dashboard. Switch one on to add it back.' : 'Every module is on your dashboard. Switch one off to hide it, or create a new one.') + '</p></div><ul class="ex-list">' +
      S.order.map(function (id) { var m = modMeta(id); if (!m) return ''; var on = !S.hidden[id]; return '<li class="ex-row' + (on ? '' : ' is-off') + '"><span class="st-ic small"><i class="fa-regular ' + (m.custom ? 'fa-chart-mixed' : { kpis: 'fa-hashtag', recs: 'fa-lightbulb', compare: 'fa-table', row4: 'fa-calendar-check', audit: 'fa-file-shield' }[id]) + '" aria-hidden="true"></i></span><span class="ex-main"><b>' + esc(m.name) + '</b><small>' + esc(m.desc) + '</small></span><span class="dw-srcs">' + m.src.map(function (s) { return srcChip(s); }).join('') + '</span>' + (m.custom ? '<vaadin-button theme="tertiary small" data-act="ex-edit" data-id="' + id.slice(2) + '">Edit</vaadin-button><vaadin-button theme="tertiary small" data-act="ex-remove" data-id="' + id.slice(2) + '">Remove</vaadin-button>' : '') + '<label class="mod-switch"><span>' + (on ? 'On' : 'Off') + '</span><vwc-switch data-act="ex-toggle-sw" data-id="' + id + '" accessible-name="Show ' + esc(m.name) + '"' + (on ? ' checked' : '') + '></vwc-switch></label></li>'; }).join('') + '</ul></div>';
  }
  function renderStudio() {
    var el = ui.studio, create = A.tab === 'create';
    el.hidden = false; document.body.classList.add('is-studio');
    var keepScroll = {}; $$('.ms-params-body, .ms-thread, .ms-existing', el).forEach(function (x) { keepScroll[x.className.split(' ')[0]] = x.scrollTop; });
    el.innerHTML = '<header class="ms-bar"><vaadin-button theme="secondary small" data-act="ms-close"><i class="fa-regular fa-arrow-left" aria-hidden="true" style="margin-right:6px"></i>Dashboard</vaadin-button><span class="ms-bar-ic"><i class="fa-regular fa-table-cells-large" aria-hidden="true"></i></span><h1>' + (A.id ? 'Edit module' : 'Add a module') + '</h1>' +
      (A.id ? '' : '<div class="ms-tabs" role="tablist"><button type="button" role="tab" data-act="ms-tab" data-tab="create" aria-selected="' + create + '"><i class="fa-regular fa-plus" aria-hidden="true"></i>Create a new module</button><button type="button" role="tab" data-act="ms-tab" data-tab="existing" aria-selected="' + !create + '"><i class="fa-regular fa-layer-group" aria-hidden="true"></i>Existing modules</button></div>') +
      '<div class="ms-bar-tools">' + (create ? '<vaadin-button theme="tertiary" data-act="ms-close">Cancel</vaadin-button><vaadin-button theme="primary" data-act="add-confirm"' + (A.m.length ? '' : ' disabled') + '>' + (A.id ? 'Save module' : 'Add to dashboard') + '</vaadin-button>' : '<vaadin-button theme="primary" data-act="ms-close">Done</vaadin-button>') + '</div></header>' +
      (create ? '<div class="ms-cols' + (S.chatMin ? ' chat-min' : '') + '">' + chatHtml() + paramsHtml() + previewHtml() + '</div>' : existingHtml());
    $$('.ms-params-body, .ms-thread, .ms-existing', el).forEach(function (x) { var k = x.className.split(' ')[0]; if (keepScroll[k] != null) x.scrollTop = keepScroll[k]; });
    var th = $('.ms-thread', el); if (th && A.thinking !== undefined && A.thread.length) th.scrollTop = th.scrollHeight;
    var sel = $('#msScope', el); if (sel) { sel.items = [{ label: 'All facilities', value: 'all' }].concat(D.facilities.map(function (f) { return { label: f.name, value: f.id }; })); sel.value = A.scope; sel.addEventListener('value-changed', function (e) { if (e.detail.value && e.detail.value !== A.scope) { A.scope = e.detail.value; renderStudio(); } }); }
    var nm = $('#msName', el); if (nm) nm.addEventListener('change', function () { A.name = nm.value.trim(); renderStudio(); });
  }
  function bindStudio() {
    ui.studio.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'ms-close') { closeStudio(); return; }
      if (act === 'ms-tab') { A.tab = b.dataset.tab; renderStudio(); return; }
      if (act === 'ms-chat-min') { S.chatMin = true; renderStudio(); return; }
      if (act === 'ms-chat-open') { S.chatMin = false; renderStudio(); var t = $('#msAsk', ui.studio); if (t) t.focus(); return; }
      if (act === 'ms-chat-reset') { A.thread = []; A.q = ''; renderStudio(); return; }
      if (act === 'ms-try') { ask(b.dataset.q); return; }
      if (act === 'ms-send') { ask(($('#msAsk', ui.studio) || {}).value); return; }
      if (act === 'toggle-m') { var id = b.dataset.id, i = A.m.indexOf(id); if (i > -1) A.m.splice(i, 1); else A.m.push(id); if (vizAllowed(A).indexOf(A.viz) < 0) A.viz = 'bars'; renderStudio(); var again = ui.studio.querySelector('[data-act="toggle-m"][data-id="' + id + '"]'); if (again) again.focus(); return; }
      if (act === 'clear-m') { A.m = []; renderStudio(); return; }
      if (act === 'pick-viz') { A.viz = b.dataset.v; renderStudio(); return; }
      if (act === 'ex-edit') { openAdd({ edit: b.dataset.id }); return; }
      if (act === 'ex-remove') { var wid = b.dataset.id, idx = S.widgets.map(function (x) { return x.id; }).indexOf(wid), gone = S.widgets.splice(idx, 1)[0], pos = S.order.indexOf('w:' + wid); S.order.splice(pos, 1); renderCustom(); applyLayout(); renderStudio(); App.toast('Module removed', title(gone), { label: 'Undo', run: function () { S.widgets.splice(idx, 0, gone); S.order.splice(pos, 0, 'w:' + gone.id); renderCustom(); applyLayout(); if (S.studio) renderStudio(); } }); return; }
      if (act === 'add-confirm' && A.m.length) {
        var spec = { scope: A.scope, m: A.m.slice(), viz: A.viz }; if (A.name) spec.title = A.name;
        if (A.id) { var i = S.widgets.map(function (x) { return x.id; }).indexOf(A.id); spec.id = A.id; S.widgets[i] = spec; } else { S.widgets.push(W(spec)); S.order.splice(S.order.indexOf('kpis') + 1, 0, 'w:' + spec.id); }
        closeStudio(); renderCustom(); applyLayout();
        var el = document.getElementById('cm-' + spec.id); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        App.toast(A.id ? 'Module updated' : 'Module added to your dashboard', title(spec) + (A.id ? '' : ' sits under Key metrics.'));
      }
    });
    ui.studio.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'msAsk') { e.preventDefault(); ask(e.target.value); }
    });
    ui.studio.addEventListener('input', function (e) { if (e.target.id === 'msAsk') A.q = e.target.value; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.studio && !document.querySelector('vaadin-select-overlay[opened]')) closeStudio(); });
  }

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
      var mv = t.closest && t.closest('[data-cmove]'); if (mv) { S.menu = null; renderCustom(); move('w:' + mv.dataset.cid, mv.dataset.cmove); return; }
      var ce = t.closest && t.closest('[data-cedit]'); if (ce) { S.menu = null; renderCustom(); openAdd({ edit: ce.dataset.cedit }); return; }
      if (t.closest && t.closest('#moduleStudio')) return;
      var cr = t.closest && t.closest('[data-cremove]'); if (cr) { var idx = S.widgets.map(function (x) { return x.id; }).indexOf(cr.dataset.cremove), gone = S.widgets.splice(idx, 1)[0], pos = S.order.indexOf('w:' + gone.id); S.order.splice(pos, 1); S.menu = null; renderCustom(); applyLayout(); App.toast('Module removed', title(gone), { label: 'Undo', run: function () { S.widgets.splice(idx, 0, gone); S.order.splice(pos, 0, 'w:' + gone.id); renderCustom(); applyLayout(); } }); return; }
      var b = t.closest && t.closest('[data-act^="bld-"]'); if (!b) return;
      if (b.tagName === 'A') e.preventDefault();
      switch (b.dataset.act) {
        case 'bld-open': show('build'); break;
        case 'bld-done': show('home'); App.toast('Dashboard saved', 'Your layout and modules are kept for you on every device.'); break;
        case 'bld-settings': show('settings'); break;
        case 'bld-reset': { var keep = S.widgets, v = fresh(); S.order = ['kpis', 'recs', 'compare', 'row4', 'audit'].concat(keep.map(function (w) { return 'w:' + w.id; })); S.hidden = {}; S.widgets = keep; S.view = 'settings'; render(); App.toast('Layout reset', 'Standard modules are back in their default order. The modules you built are kept.'); break; }
        case 'bld-add': openAdd({ tab: 'create' }); break;
        case 'bld-existing': openAdd({ tab: 'existing' }); break;
        case 'bld-create': openAdd({ tab: 'create' }); break;
        case 'bld-up': case 'bld-down': move(b.dataset.id, b.dataset.act === 'bld-up' ? 'up' : 'down'); break;
        case 'bld-setting': App.notYet(b.dataset.name + ' settings'); break;
        default: break;
      }
    });
    document.addEventListener('checked-change', function (e) {
      var sw = e.target.closest && e.target.closest('vwc-switch[data-act="bld-toggle"], vwc-switch[data-act="ex-toggle-sw"]'); if (!sw) return;
      S.hidden[sw.dataset.id] = !e.detail; applyLayout();
      if (sw.dataset.act === 'ex-toggle-sw') { var lbl = sw.closest('label').querySelector('span'); if (lbl) lbl.textContent = e.detail ? 'On' : 'Off'; sw.closest('.ex-row').classList.toggle('is-off', !e.detail); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.menu) { S.menu = null; renderCustom(); } });
  }

  /* ── Flow-map states ───────────────────────────────────────────────────── */
  var KNOWN = ['settings', 'build', 'add-module', 'create-module', 'describe', 'create-min', 'existing-modules'], pendingState = null, ready = false;
  function reset() { var v = fresh(); S.view = v.view; S.order = v.order; S.hidden = {}; S.menu = null; S.widgets = v.widgets; if (ui.studio) closeStudio(); }
  function applyState(id) {
    if (!ready) { if (KNOWN.indexOf(id) < 0) return false; pendingState = id; return true; }
    switch (id) {
      case 'settings': show('settings'); return true;
      case 'build': show('build'); return true;
      case 'add-module': case 'create-module': show('home'); openAdd({ tab: 'create' }); return true;
      case 'existing-modules': show('home'); openAdd({ tab: 'existing' }); return true;
      case 'describe': show('home'); openAdd({ tab: 'create', q: 'Compare safety trends at Plant 4 with its training data' }); return true;
      case 'create-min': show('home'); openAdd({ tab: 'create', q: 'Compare safety trends at Plant 4 with its training data', chatMin: true }); return true;
      default: return false;
    }
  }
  function init() {
    if (ready) return;
    ui.page = $('#main .page-inner'); ui.settings = $('#settingsView'); ui.buildBar = $('#buildBar'); ui.studio = $('#moduleStudio');
    if (!ui.settings || !ui.page || !ui.studio) return;
    bind(); bindStudio(); ready = true; render();
    if (pendingState) { var p = pendingState; pendingState = null; applyState(p); }
  }
  window.Builder = { show: show, applyState: applyState, reset: reset, renderCustom: renderCustom, applyLayout: applyLayout, init: init };
  var whenReady = Promise.all(['vaadin-select', 'vaadin-text-field', 'vwc-switch'].map(function (t) { return customElements.whenDefined(t); }));
  var domReady = new Promise(function (res) { if (document.readyState !== 'loading') res(); else document.addEventListener('DOMContentLoaded', res); });
  Promise.all([whenReady, domReady]).then(init);
  domReady.then(function () { setTimeout(init, 9000); });
})();
