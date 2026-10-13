/* ============================================================================
   builder.js · The home page is a dashboard of widgets the user controls
   ----------------------------------------------------------------------------
   Pattern from the Readiness Hub (Keystone) Agency Intelligence builder, with
   one difference the designer asked for: what you build IS the home page.
     · WIDGETS    standard widgets (Key metrics, Recommended actions, …) and
                  reporting widgets the user built share one order
     · ADD WIDGET full-screen takeover: Create a new widget (chat | parameters
                  | preview) and Existing widgets (On/Off, Preview, Edit, Remove)
     · SETTINGS   Arrange your dashboard: move up/down, Shown/Hidden
     · DRILL-IN   click a number on the dashboard or the preview and a drawer
                  lists the records behind it (who, which course, due when)
   Two behaviours sit behind the Prototype pill (bottom right) so they can be
   compared with and without: "Be specific" dropdowns on each parameter, and
   "Click into metrics". Vanilla JS; no AI branding (Bridge CLAUDE.md).
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

  /* ── Standard widgets (the things the page is made of) ─────────────────── */
  var MODULES = [
    { id: 'kpis', name: 'Key metrics', desc: 'Incident rate, open corrective actions, overdue training, expiring qualifications.', src: ['ehs', 'ct'] },
    { id: 'recs', name: 'Recommended actions', desc: 'Cross-product recommendations ranked by severity.', src: ['ehs', 'ct'] },
    { id: 'compare', name: 'Facility comparison', desc: 'Incident rate next to training compliance, one row per facility.', src: ['ehs', 'ct'] },
    { id: 'row4', name: 'Assigned to me and Compliance calendar', desc: 'Your tasks from both products and the shared calendar.', src: ['ehs', 'ct'] },
    { id: 'audit', name: 'OSHA audit readiness', desc: 'Injury logs and the related training records in one packet.', src: ['ehs', 'ct'] }
  ];
  function mod(id) { for (var i = 0; i < MODULES.length; i++) if (MODULES[i].id === id) return MODULES[i]; return null; }

  /* ── Metric catalog. `detail` is the "be specific" dimension per metric. ── */
  var COURSES = ['Forklift Safety Refresher', 'Lockout/Tagout', 'Hazard Communication', 'Walking-Working Surfaces', 'Safe Lifting & Ergonomics'];
  var INC_TYPES = ['Forklift / PIT', 'Slips and trips', 'Lacerations', 'Ergonomic strain'];
  var QUALS = ['Powered Industrial Truck Operator', 'Confined Space Entry', 'First Aid / CPR', 'Crane and Hoist Operator'];
  var METRICS = [
    { id: 'trir',         src: 'ehs', label: 'Incident rate (TRIR)',      icon: 'fa-triangle-exclamation', unit: '', shape: 'up',   kind: 'rate',  detail: { label: 'Incident type', options: INC_TYPES } },
    { id: 'incidents',    src: 'ehs', label: 'Incidents',                 icon: 'fa-triangle-exclamation', unit: '', shape: 'up',   kind: 'count', detail: { label: 'Incident type', options: INC_TYPES } },
    { id: 'near_miss',    src: 'ehs', label: 'Near misses',               icon: 'fa-bolt',                 unit: '', shape: 'up',   kind: 'count', detail: { label: 'Type', options: ['Slips and trips', 'Forklift / PIT', 'Struck-by', 'Chemical'] } },
    { id: 'observations', src: 'ehs', label: 'Observations logged',       icon: 'fa-eye',                  unit: '', shape: 'up',   kind: 'count', detail: { label: 'Category', options: ['Lockout/Tagout', 'Housekeeping', 'PPE', 'Walking surfaces'] } },
    { id: 'open_ca',      src: 'ehs', label: 'Open corrective actions',   icon: 'fa-list-check',           unit: '', shape: 'up',   kind: 'count', detail: { label: 'Source', options: ['From incidents', 'From observations', 'From inspections'] } },
    { id: 'inspections',  src: 'ehs', label: 'Inspections completed',     icon: 'fa-clipboard-check',      unit: '', shape: 'flat', kind: 'count', detail: { label: 'Inspection type', options: ['Fire extinguisher', 'Racking', 'PIT pre-shift', 'LOTO audit'] } },
    { id: 'compliance',   src: 'ct',  label: 'Training compliance',       icon: 'fa-graduation-cap',       unit: '%', shape: 'down', kind: 'pct',  detail: { label: 'Course', options: COURSES } },
    { id: 'overdue',      src: 'ct',  label: 'Overdue training',          icon: 'fa-graduation-cap',       unit: '%', shape: 'up',   kind: 'pct',  detail: { label: 'Course', options: COURSES } },
    { id: 'completions',  src: 'ct',  label: 'Training completions',      icon: 'fa-circle-check',         unit: '', shape: 'down', kind: 'count', detail: { label: 'Course', options: COURSES } },
    { id: 'quals',        src: 'ct',  label: 'Qualifications expiring',   icon: 'fa-id-badge',             unit: '', shape: 'up',   kind: 'count', detail: { label: 'Qualification', options: QUALS } }
  ];
  function metric(id) { for (var i = 0; i < METRICS.length; i++) if (METRICS[i].id === id) return METRICS[i]; return null; }
  var VIZ = { trend: ['Trend', 'fa-chart-line'], bars: ['Bars by location', 'fa-chart-bar'], scatter: ['Scatter by location', 'fa-braille'], kpi: ['Big numbers', 'fa-hashtag'], table: ['Table', 'fa-table'] };
  var RANGES = [['dash', 'Same as the dashboard'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['365', 'Last 12 months'], ['ytd', 'Year to date']];
  var RANGE_SCALE = { dash: 1, '30': 0.36, '90': 1, '365': 3.9, ytd: 3.1 };
  function rangeLabel(r) { for (var i = 0; i < RANGES.length; i++) if (RANGES[i][0] === r) return RANGES[i][1]; return RANGES[0][1]; }
  function rangeAxis(r) { return { '30': ['4 weeks ago', 'This week'], '365': ['12 months ago', 'This month'], ytd: ['January', 'This week'] }[r] || ['12 weeks ago', 'This week']; }
  var SUGGESTIONS = [
    { label: 'Safety trend vs training at Plant 4', hint: 'Incidents and training completions, week by week', spec: { scope: 'plant4', m: ['incidents', 'completions'], viz: 'trend' } },
    { label: 'Incident rate vs compliance, all facilities', hint: 'Does low compliance sit where incidents are?', spec: { scope: 'all', m: ['trir', 'compliance'], viz: 'scatter' } },
    { label: 'Near misses vs overdue training at DC East', hint: 'By department', spec: { scope: 'dceast', m: ['near_miss', 'overdue'], viz: 'bars' } },
    { label: 'Open corrective actions, all facilities', hint: 'One product, one metric', spec: { scope: 'all', m: ['open_ca'], viz: 'bars' } }
  ];

  /* ── Values: per facility / department, totals, series. `detail` narrows. ─ */
  var DETAIL_SHARE = [0.44, 0.27, 0.17, 0.08, 0.04];
  function detailFactor(spec, mid) { var d = spec.detail && spec.detail[mid]; if (!d) return 1; var m = metric(mid), i = m.detail.options.indexOf(d); return i < 0 ? 1 : DETAIL_SHARE[i] || 0.05; }
  function scaleFor(spec, mid) { var m = metric(mid); return (m.kind === 'count' ? RANGE_SCALE[spec.range || 'dash'] : 1) * detailFactor(spec, mid); }
  function facValue(f, mid) {
    return { trir: f.trir, incidents: f.incidents, near_miss: f.nearMisses, observations: Math.round(f.incidents * 1.6 + f.nearMisses), open_ca: f.openCA, inspections: Math.round(f.employees / 48), compliance: f.compliance, overdue: f.overdue, completions: Math.round(f.employees / 9), quals: f.qualsExpiring }[mid];
  }
  function deptValue(f, d, mid) {
    var share = d.employees / f.employees;
    return { trir: d.trir, incidents: d.incidents, near_miss: Math.max(0, Math.round(f.nearMisses * share * 1.3)), observations: Math.round((d.incidents * 1.6 + f.nearMisses * share)), open_ca: d.openCA, inspections: Math.round(d.employees / 48), compliance: d.compliance, overdue: d.overdue, completions: Math.round(d.employees / 9), quals: Math.round(f.qualsExpiring * share) }[mid];
  }
  function fmtVal(mid, v) { var m = metric(mid); return (m.kind === 'count') ? Math.max(0, Math.round(v)) : Math.round(v * 10) / 10; }
  function rows(spec, mid) {
    var k = scaleFor(spec, mid);
    if (spec.scope === 'all') return D.facilities.map(function (f) { return { id: f.id, label: short(f.name), full: f.name, value: fmtVal(mid, facValue(f, mid) * k), hot: f.signal === 'elevated' }; });
    var f = fac(spec.scope);
    return f.departments.map(function (d) { return { id: f.id, dept: d.name, label: d.name, full: d.name, value: fmtVal(mid, deptValue(f, d, mid) * k), hot: d.signal === 'elevated' }; });
  }
  function total(spec, mid) {
    var k = scaleFor(spec, mid);
    if (spec.scope !== 'all') return fmtVal(mid, facValue(fac(spec.scope), mid) * k);
    var emp = D.facilities.reduce(function (a, f) { return a + f.employees; }, 0), m = metric(mid);
    if (m.kind !== 'count') { var s = 0; D.facilities.forEach(function (f) { s += facValue(f, mid) * f.employees; }); return fmtVal(mid, s / emp * k); }
    return fmtVal(mid, D.facilities.reduce(function (a, f) { return a + facValue(f, mid); }, 0) * k);
  }
  function series(spec, mid) {
    var t = total(spec, mid), m = metric(mid), f = spec.scope === 'all' ? null : fac(spec.scope), hot = f ? f.signal === 'elevated' : true;
    var weekly = m.kind !== 'count' ? t : t / 12, out = [];
    for (var i = 0; i < 12; i++) {
      var k = i / 11, shape = m.shape === 'up' ? (hot ? 0.6 + 0.8 * k : 0.9 + 0.2 * k) : m.shape === 'down' ? (hot ? 1.25 - 0.5 * k : 1.05 - 0.1 * k) : 1;
      var noise = ((i * 7 + mid.length) % 5 - 2) * 0.06, v = weekly * (shape + noise);
      out.push((m.kind !== 'count' || weekly < 20) ? Math.round(v * 10) / 10 : Math.max(0, Math.round(v)));
    }
    return out;
  }
  function scopeLabel(scope) { return scope === 'all' ? 'All facilities' : fac(scope).name; }

  /* ── Viz renderers. A widget holds a LIST of metrics (spec.m), any number. ─ */
  var SERIES = ['var(--lumo-error-color)', 'var(--lumo-primary-color)', 'var(--vwc-color-puerto-rico-600)', 'var(--vwc-color-ecstacy-600)', 'var(--vwc-color-vivid-violet-600)', 'var(--vwc-color-conifer-700)', 'var(--vwc-color-picton-blue-400)', 'var(--vwc-color-cinnabar-800)', 'var(--vwc-color-ecstacy-300)', 'var(--lumo-contrast-60pct)'];
  function mids(spec) { return (spec.m && spec.m.length) ? spec.m : [spec.a, spec.b].filter(Boolean); }
  function mlabel(spec, mid) { var m = metric(mid), d = spec.detail && spec.detail[mid]; return m.label + (d ? ' (' + d + ')' : ''); }
  function drillAttr(spec, mid, row) { return ' data-drill="' + esc(mid) + '" data-drill-loc="' + esc(row ? (row.dept ? row.id + '|' + row.dept : row.id) : (spec.scope === 'all' ? 'all' : spec.scope)) + '"'; }
  function legend(spec) {
    return '<div class="cw-legend">' + mids(spec).map(function (id, i) { return '<span class="cw-lg"' + drillAttr(spec, id) + '><i class="sw" style="background:' + SERIES[i] + '"></i>' + esc(mlabel(spec, id)) + srcChip(metric(id).src) + '</span>'; }).join('') + '</div>';
  }
  function vizTrend(spec) {
    var ids = mids(spec), raw = ids.map(function (id) { return series(spec, id); }), w = 360, h = 130, pl = 34, pb = 22, idx = ids.length > 1, ax = rangeAxis(spec.range);
    var vals = idx ? raw.map(function (s) { return s.map(function (v) { return s[0] ? v / s[0] * 100 : 100; }); }) : raw;
    var all = [].concat.apply([], vals), min = Math.min.apply(null, all), max = Math.max.apply(null, all), span = (max - min) || 1;
    function pts(v) { return v.map(function (x, i) { return [pl + i * (w - pl - 10) / 11, 10 + (1 - (x - min) / span) * (h - pb - 16)]; }); }
    function path(p) { return p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); }
    var lines = vals.map(function (v, i) { var p = pts(v); return '<path d="' + path(p) + '" fill="none" stroke="' + SERIES[i] + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + p[11][0].toFixed(1) + '" cy="' + p[11][1].toFixed(1) + '" r="4" fill="' + SERIES[i] + '" stroke="#fff" stroke-width="2"/>'; }).reverse().join('');
    return legend(spec) + '<svg class="cw-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(title(spec)) + '">' +
      '<line class="grid" x1="' + pl + '" y1="' + (h - pb) + '" x2="' + w + '" y2="' + (h - pb) + '"/><line class="grid" x1="' + pl + '" y1="10" x2="' + w + '" y2="10"/>' +
      '<text x="' + (pl - 6) + '" y="14" text-anchor="end">' + (idx ? Math.round(max) : esc(num(max))) + '</text><text x="' + (pl - 6) + '" y="' + (h - pb + 4) + '" text-anchor="end">' + (idx ? Math.round(min) : esc(num(min))) + '</text>' + lines +
      '<text x="' + pl + '" y="' + (h - 5) + '">' + esc(ax[0]) + '</text><text x="' + w + '" y="' + (h - 5) + '" text-anchor="end">' + esc(ax[1]) + '</text></svg>' +
      '<p class="cw-cap">' + (idx ? 'Series indexed to 100 at the start so they share one axis. ' : '') + 'Period values: ' + ids.map(function (id, i) { var m = metric(id); return esc(mlabel(spec, id)) + ' <strong>' + esc(num(raw[i][0])) + ' → ' + esc(num(raw[i][11])) + m.unit + '</strong>'; }).join(', ') + '.' + (S.demo.drill ? ' Click a series to see the records behind it.' : '') + '</p>';
  }
  function vizBars(spec) {
    var ids = mids(spec), R = ids.map(function (id) { return rows(spec, id); }), multi = ids.length > 1;
    var maxes = R.map(function (r) { return Math.max.apply(null, r.map(function (x) { return x.value; })) || 1; });
    var order = R[0].map(function (r, i) { return i; }).sort(function (x, y) { return R[0][y].value - R[0][x].value; });
    return (multi ? legend(spec) : '') + '<div class="cw-bars">' + order.map(function (i) {
      return '<div class="cw-row' + (multi ? ' pair' : '') + '" title="' + esc(R[0][i].full) + '"><span class="cw-l">' + esc(R[0][i].label) + '</span><span class="cw-tracks">' +
        R.map(function (r, k) { return '<span class="cw-t"' + drillAttr(spec, ids[k], r[i]) + '><span class="cw-f" style="width:' + (r[i].value / maxes[k] * 100).toFixed(0) + '%;background:' + (multi ? SERIES[k] : (r[i].hot ? SERIES[0] : 'var(--lumo-contrast-30pct)')) + '"></span></span>'; }).join('') +
        '</span><span class="cw-v">' + R.map(function (r, k) { return '<b' + drillAttr(spec, ids[k], r[i]) + '>' + esc(num(r[i].value)) + metric(ids[k]).unit + '</b>'; }).join('') + '</span></div>';
    }).join('') + '</div>';
  }
  function vizScatter(spec) {
    var ids = mids(spec), A = rows(spec, ids[0]), B = rows(spec, ids[1]), w = 360, h = 160, pl = 40, pb = 26;
    var maxA = Math.max.apply(null, A.map(function (r) { return r.value; })) * 1.15 || 1, bs = B.map(function (r) { return r.value; }), maxB = Math.max.apply(null, bs) * 1.08 || 1, minB = Math.min.apply(null, bs) * 0.92;
    return '<svg class="cw-svg tall" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(title(spec)) + '"><line class="grid" x1="' + pl + '" y1="' + (h - pb) + '" x2="' + w + '" y2="' + (h - pb) + '"/><line class="grid" x1="' + pl + '" y1="6" x2="' + pl + '" y2="' + (h - pb) + '"/>' +
      '<text x="' + pl + '" y="' + (h - 6) + '">' + esc(mlabel(spec, ids[1])) + ' →</text><text x="12" y="10" transform="rotate(-90 12 10)" text-anchor="end">' + esc(mlabel(spec, ids[0])) + ' →</text>' +
      A.map(function (r, i) { var x = pl + (B[i].value - minB) / ((maxB - minB) || 1) * (w - pl - 12), y = 8 + (1 - r.value / maxA) * (h - pb - 10); return '<circle class="cw-dot" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r.hot ? 7 : 5) + '" fill="' + (r.hot ? SERIES[0] : SERIES[1]) + '" stroke="#fff" stroke-width="2"' + drillAttr(spec, ids[0], r) + '><title>' + esc(r.full + ': ' + r.value + metric(ids[0]).unit + ' / ' + B[i].value + metric(ids[1]).unit) + '</title></circle>' + (r.hot ? '<text x="' + (x + 10).toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" class="lbl">' + esc(r.label) + '</text>' : ''); }).join('') + '</svg>' +
      '<p class="cw-cap">Each dot is a ' + (spec.scope === 'all' ? 'facility' : 'department') + '. Red dots are flagged <strong>Elevated</strong>; hover for values' + (S.demo.drill ? ', click to see the records' : '') + '.</p>';
  }
  function vizKpi(spec) {
    function one(mid, i) { var m = metric(mid), s = series(spec, mid), d = s[11] - s[0], bad = (d > 0) === (m.shape === 'up'); return '<div class="cw-kpi"' + drillAttr(spec, mid) + '><div class="cw-kpi-l">' + esc(mlabel(spec, mid)) + srcChip(m.src) + '</div><div class="cw-kpi-v" style="color:' + SERIES[i] + '">' + esc(num(total(spec, mid))) + '<small>' + m.unit + '</small></div><div class="cw-kpi-d ' + (d === 0 ? '' : bad ? 'bad' : 'good') + '"><i class="fa-solid ' + (d > 0 ? 'fa-arrow-up-right' : d < 0 ? 'fa-arrow-down-right' : 'fa-arrow-right') + '" aria-hidden="true"></i>' + (d === 0 ? 'No change' : esc(num(Math.abs(Math.round(d * 10) / 10))) + m.unit + ' over the period') + '</div></div>'; }
    return '<div class="cw-kpis">' + mids(spec).map(one).join('') + '</div>';
  }
  function vizTable(spec) {
    var ids = mids(spec), R = ids.map(function (id) { return rows(spec, id); });
    return '<table class="cw-table"><thead><tr><th>' + (spec.scope === 'all' ? 'Facility' : 'Department') + '</th>' + ids.map(function (id) { return '<th class="n">' + esc(mlabel(spec, id)) + '</th>'; }).join('') + '</tr></thead><tbody>' + R[0].map(function (r, i) { return '<tr><td>' + esc(r.full) + '</td>' + R.map(function (x, k) { return '<td class="n"><span' + drillAttr(spec, ids[k], x[i]) + '>' + esc(num(x[i].value)) + metric(ids[k]).unit + '</span></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function body(spec) { switch (spec.viz) { case 'trend': return vizTrend(spec); case 'scatter': return mids(spec).length === 2 ? vizScatter(spec) : vizBars(spec); case 'kpi': return vizKpi(spec); case 'table': return vizTable(spec); default: return vizBars(spec); } }
  function labelList(spec) { var l = mids(spec).map(function (id) { return mlabel(spec, id); }); if (l.length < 3) return l.join(' vs '); if (l.length === 3) return l[0] + ', ' + l[1] + ' and ' + l[2]; return l[0] + ', ' + l[1] + ' and ' + (l.length - 2) + ' more'; }
  function title(spec) { return (spec.title && spec.title.trim()) || (labelList(spec) + ', ' + scopeLabel(spec.scope)); }
  function sources(spec) { var s = []; mids(spec).forEach(function (id) { var src = metric(id).src; if (s.indexOf(src) < 0) s.push(src); }); return s; }
  function vizAllowed(spec) { return mids(spec).length === 2 ? ['trend', 'bars', 'scatter', 'kpi', 'table'] : ['trend', 'bars', 'kpi', 'table']; }
  function iconFor(spec) { return mids(spec).length > 1 ? 'fa-arrow-right-arrow-left' : metric(mids(spec)[0]).icon; }
  function kindFor(spec) { return mids(spec).length > 1 ? 'Comparison' : 'Report'; }
  function subFor(spec) { return kindFor(spec) + ' you built, ' + VIZ[spec.viz][0].toLowerCase() + '. ' + (spec.range && spec.range !== 'dash' ? rangeLabel(spec.range) + '.' : 'Follows the date range above.') + ' Follows the location above.'; }

  /* ── Build a widget from a description (Keystone intent match + parser) ── */
  var STOP = ['the', 'and', 'a', 'in', 'on', 'to', 'is', 'of', 'how', 'what', 'where', 'when', 'do', 'does', 'with', 'for', 'are', 'by', 'an', 'at', 'its', 'my', 'me', 'show', 'compare', 'vs', 'versus'];
  function norm(s) { return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(function (w) { return w && STOP.indexOf(w) === -1; }); }
  function keywordOverlap(a, b) { var sb = norm(b); return norm(a).filter(function (w) { return sb.indexOf(w) !== -1; }).length; }
  var FAC_WORDS = { plant4: ['plant 4', 'riverside'], plant2: ['plant 2', 'columbus'], dceast: ['dc east', 'allentown'], plant1: ['plant 1', 'tulsa'], plant7: ['plant 7', 'greenville'], dcwest: ['dc west', 'reno'] };
  var METRIC_WORDS = [
    ['near_miss', ['near miss', 'near-miss', 'close call']], ['trir', ['incident rate', 'trir', 'rate of incident']], ['incidents', ['incident', 'injur', 'safety trend', 'safety']],
    ['observations', ['observation']], ['open_ca', ['corrective', 'action']], ['inspections', ['inspection', 'audit']],
    ['overdue', ['overdue', 'past due', 'late training', 'lapsed']], ['compliance', ['compliance', 'compliant']], ['completions', ['completion', 'completed', 'training data', 'training']], ['quals', ['qualification', 'certif', 'expir']]
  ];
  function findDetails(t, m) {
    var out = {};
    m.forEach(function (id) { var md = metric(id); md.detail.options.forEach(function (o) { var key = o.toLowerCase().split(/[\s\/]+/)[0]; if (key.length > 3 && t.indexOf(key) > -1) out[id] = o; }); });
    if (t.indexOf('loto') > -1 || t.indexOf('lockout') > -1) m.forEach(function (id) { if (metric(id).detail.options.indexOf('Lockout/Tagout') > -1) out[id] = 'Lockout/Tagout'; });
    return out;
  }
  function rangeFrom(t) { return /30 days|last month|this month/.test(t) ? '30' : /year to date|ytd/.test(t) ? 'ytd' : /12 months|last year|annual/.test(t) ? '365' : /90 days|quarter/.test(t) ? '90' : null; }
  function describeToSpec(text) {
    var t = text.toLowerCase(), scope = 'all';
    Object.keys(FAC_WORDS).forEach(function (id) { FAC_WORDS[id].forEach(function (w) { if (t.indexOf(w) > -1) scope = id; }); });
    var range = rangeFrom(t) || 'dash';
    var hit = SUGGESTIONS.filter(function (s) { return keywordOverlap(text, s.label + ' ' + s.hint) >= 2; })[0];
    if (hit) { var sp = { via: 'example', scope: hit.spec.scope, m: hit.spec.m.slice(), viz: hit.spec.viz, range: range }; sp.detail = findDetails(t, sp.m); return sp; }
    var found = [];
    METRIC_WORDS.forEach(function (pair) { if (pair[1].some(function (w) { return t.indexOf(w) > -1; }) && found.indexOf(pair[0]) < 0) found.push(pair[0]); });
    if (found.indexOf('incidents') > -1 && found.indexOf('trir') > -1) found.splice(found.indexOf('incidents'), 1);
    if (found.indexOf('overdue') > -1 && found.indexOf('completions') > -1 && t.indexOf('completion') < 0) found.splice(found.indexOf('completions'), 1);
    var m = found.length ? found : [t.indexOf('training') > -1 ? 'completions' : 'incidents'];
    if (m.length === 1 && /\b(compare|vs|versus|against|with|and)\b/.test(t)) m.push(metric(m[0]).src === 'ehs' ? 'completions' : 'incidents');
    var viz = /trend|over time|week|month|history/.test(t) ? 'trend' : /scatter|correlat|relationship/.test(t) ? (m.length === 2 ? 'scatter' : 'bars') : /table|list|rows|who /.test(t) ? 'table' : /number|total|how many|kpi/.test(t) ? 'kpi' : (m.length > 1 && scope !== 'all' ? 'trend' : 'bars');
    return { via: 'parsed', scope: scope, m: m, viz: viz, range: range, detail: findDetails(t, m) };
  }
  function readBack(spec) { var ids = mids(spec); return ids.map(function (id) { return '**' + mlabel(spec, id) + '**'; }).join(ids.length > 2 ? ', ' : ' compared with ') + ' for **' + scopeLabel(spec.scope) + '**, ' + rangeLabel(spec.range || 'dash').toLowerCase() + ', shown as ' + VIZ[spec.viz][0].toLowerCase() + '.'; }
  function bold(text) { return String(text).split('**').map(function (p, i) { return i % 2 ? '<strong>' + esc(p) + '</strong>' : esc(p); }).join(''); }

  /* ── State ─────────────────────────────────────────────────────────────── */
  var seq = 10;
  function W(spec) { spec.id = 'c' + (seq++); return spec; }
  var S, ui = {}, A = null, dlgKey = 0;
  function fresh() {
    var w = [W({ scope: 'plant4', m: ['incidents', 'near_miss', 'completions'], viz: 'trend', range: 'dash', detail: {} }), W({ scope: 'all', m: ['trir', 'compliance'], viz: 'kpi', range: 'dash', detail: {} })];
    return { view: 'home', order: ['kpis', 'recs', 'w:' + w[0].id, 'compare', 'w:' + w[1].id, 'row4', 'audit'], hidden: {}, menu: null, widgets: w, studio: false, chatMin: false, exOpen: {}, demo: { specific: true, drill: true } };
  }
  S = fresh();
  (function () { var p = new URLSearchParams(location.search); if (p.get('specific') === '0') S.demo.specific = false; if (p.get('drill') === '0') S.demo.drill = false; })();
  function widget(id) { return S.widgets.filter(function (x) { return x.id === id; })[0]; }
  function modMeta(id) {
    if (id.indexOf('w:') === 0) { var w = widget(id.slice(2)); return w ? { id: id, name: title(w), desc: kindFor(w) + ' you built, ' + VIZ[w.viz][0].toLowerCase() + '.', src: sources(w), custom: true } : null; }
    return mod(id);
  }

  /* ── Reporting widgets the user built: each is a page-level widget ─────── */
  function customHtml(w) {
    var menu = S.menu === w.id ? '<div class="dw-menu"><button type="button" data-cedit="' + w.id + '">Edit widget</button><button type="button" data-cmove="up" data-cid="' + w.id + '">Move up</button><button type="button" data-cmove="down" data-cid="' + w.id + '">Move down</button><div class="dw-menu-d"></div><button type="button" class="danger" data-cremove="' + w.id + '">Remove from dashboard</button></div>' : '';
    return '<div class="module-head"><div><h2><span class="dw-ic"><i class="fa-regular ' + iconFor(w) + '" aria-hidden="true"></i></span>' + esc(title(w)) + '</h2><p class="sub">' + esc(subFor(w)) + '</p></div>' +
      '<div class="head-tools">' + (w.range && w.range !== 'dash' ? '<span class="dw-range-chip"><i class="fa-regular fa-calendar-range" aria-hidden="true"></i>' + esc(rangeLabel(w.range)) + '</span>' : '') + '<span class="dw-srcs">' + sources(w).map(function (s) { return srcChip(s, PRODUCT[s].label); }).join('') + '</span><span class="dw-kebab-wrap"><button type="button" class="dw-kebab" data-cmenu="' + w.id + '" aria-label="Widget options"><i class="fa-regular fa-ellipsis-vertical" aria-hidden="true"></i></button>' + menu + '</span></div></div>' +
      '<div class="module-body cm-body cm-' + w.viz + '">' + body(w) + '</div>';
  }
  function previewHtmlOf(w) { return '<div class="module card cm ms-live" data-preview="1">' + customHtml(w).replace(/<span class="dw-kebab-wrap">[\s\S]*?<\/span><\/div><\/div>/, '</div></div>') + '</div>'; }
  function renderCustom() {
    var page = ui.page; if (!page) return;
    S.widgets.forEach(function (w) {
      var el = document.getElementById('cm-' + w.id);
      if (!el) { el = document.createElement('section'); el.className = 'module card cm'; el.id = 'cm-' + w.id; page.appendChild(el); }
      el.setAttribute('aria-label', title(w)); el.innerHTML = customHtml(w);
    });
    $$('.module.cm', page).forEach(function (el) { if (!widget(el.id.slice(3))) el.remove(); });
    $$('[data-drill]', page).forEach(function (x) { x.setAttribute('tabindex', '0'); });
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
    document.body.classList.toggle('demo-drill', !!S.demo.drill);
    renderDemoPill();
  }
  function move(id, dir) { var i = S.order.indexOf(id), j = dir === 'up' ? i - 1 : i + 1; if (i < 0 || j < 0 || j >= S.order.length) return; var t = S.order[i]; S.order[i] = S.order[j]; S.order[j] = t; applyLayout(); var el = moduleEl(id); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }

  /* ── Prototype pill (demo controls, bottom right) ──────────────────────── */
  var pillDrawn = false;
  function renderDemoPill() {
    var el = ui.demo; if (!el || pillDrawn) return; pillDrawn = true;
    el.innerHTML = '<span class="demo-pill-l"><i class="fa-regular fa-sliders" aria-hidden="true"></i>Prototype</span>' +
      [['specific', 'Be specific dropdowns'], ['drill', 'Click into metrics']].map(function (p) { return '<label class="demo-sw"><span>' + p[1] + '</span><vwc-switch data-demo="' + p[0] + '" accessible-name="' + p[1] + '"' + (S.demo[p[0]] ? ' checked' : '') + '></vwc-switch></label>'; }).join('');
  }

  /* ── Drill-in: the records behind a number ──────────────────────────────── */
  var DR = { open: false };
  function dateBack(days) { var d = new Date(2026, 9, 12); d.setDate(d.getDate() - days); return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' ' + d.getDate(); }
  function recordsFor(mid, loc, dept, detail, count) {
    var m = metric(mid), f = loc && loc !== 'all' ? fac(loc) : null, out = [], n = Math.max(1, Math.min(count, 40));
    var people = D.employees, facs = D.facilities;
    for (var i = 0; i < n; i++) {
      var p = people[(i * 7 + mid.length) % people.length], ff = f || facs[(i * 5 + 1) % facs.length], dp = dept || (f ? f.departments[(i * 3) % f.departments.length].name : p.dept);
      var opt = detail || m.detail.options[(i * 2 + mid.length) % m.detail.options.length], where = dp + ' · ' + short(ff.name);
      switch (mid) {
        case 'overdue': out.push({ cells: [p.name, opt, dp, short(ff.name), dateBack(90 - i * 4), (18 + i * 3) + ' days'], id: p.id }); break;
        case 'compliance': out.push({ cells: [p.name, opt, dp, short(ff.name), i % 4 === 0 ? 'Overdue' : 'Current', i % 4 === 0 ? dateBack(30 + i) : dateBack(-120 + i * 9)], id: p.id }); break;
        case 'completions': out.push({ cells: [p.name, opt, dp, short(ff.name), dateBack(i * 2), (78 + (i * 7) % 22) + '%'], id: p.id }); break;
        case 'quals': out.push({ cells: [p.name, opt, dp, short(ff.name), dateBack(-(3 + i * 2)), (3 + i * 2) + ' days'], id: p.id }); break;
        case 'incidents': case 'trir': out.push({ cells: ['INC-' + (4482 - i * 3), opt, p.name, where, dateBack(2 + i * 5), i % 3 === 0 ? 'Open' : 'Closed'], id: 'INC-' + (4482 - i * 3) }); break;
        case 'near_miss': out.push({ cells: ['NM-' + (1187 - i * 2), opt, where, dateBack(1 + i * 4), p.name, i % 2 ? 'Reviewed' : 'New'], id: 'NM-' + (1187 - i * 2) }); break;
        case 'observations': out.push({ cells: ['OBS-' + (2210 - i * 3), opt, where, dateBack(i * 2), p.name, i % 3 === 0 ? 'Open' : 'Closed'], id: 'OBS-' + (2210 - i * 3) }); break;
        case 'open_ca': out.push({ cells: ['CA-' + (2291 - i * 2), ['Replace damaged dock plate', 'Retrain operator on safe lifting', 'Post LOTO procedure at Line 3', 'Repair guard on press 5', 'Restripe pedestrian lane'][i % 5], opt, p.name, where, dateBack(-(2 + i * 3))], id: 'CA-' + (2291 - i * 2) }); break;
        default: out.push({ cells: ['INS-' + (912 - i), opt, where, dateBack(i * 3), p.name, i % 5 === 0 ? '2 findings' : 'Pass'], id: 'INS-' + (912 - i) }); break;
      }
    }
    return out;
  }
  var DR_COLS = { overdue: ['Employee', 'Course', 'Department', 'Facility', 'Due', 'Overdue by'], compliance: ['Employee', 'Course', 'Department', 'Facility', 'Status', 'Due'], completions: ['Employee', 'Course', 'Department', 'Facility', 'Completed', 'Score'], quals: ['Employee', 'Qualification', 'Department', 'Facility', 'Expires', 'In'], incidents: ['Incident', 'Type', 'Employee', 'Where', 'Date', 'Status'], trir: ['Incident', 'Type', 'Employee', 'Where', 'Date', 'Status'], near_miss: ['Near miss', 'Type', 'Where', 'Date', 'Reported by', 'Status'], observations: ['Observation', 'Category', 'Where', 'Date', 'Logged by', 'Status'], open_ca: ['Action', 'Title', 'Source', 'Owner', 'Where', 'Due'], inspections: ['Inspection', 'Type', 'Where', 'Date', 'Inspector', 'Result'] };
  function openDrill(mid, locKey, spec) {
    var parts = (locKey || 'all').split('|'), loc = parts[0], dept = parts[1] || null, m = metric(mid), detail = spec && spec.detail ? spec.detail[mid] : null;
    var sp = spec || { scope: loc, range: 'dash', detail: {} }, v, people;
    if (dept) { var f = fac(loc), d = f.departments.filter(function (x) { return x.name === dept; })[0]; v = fmtVal(mid, deptValue(f, d, mid) * scaleFor(sp, mid)); people = d.employees; }
    else { v = total(Object.assign({}, sp, { scope: loc }), mid); people = loc === 'all' ? D.facilities.reduce(function (a, x) { return a + x.employees; }, 0) : fac(loc).employees; }
    var count = m.kind === 'count' ? v : m.kind === 'pct' ? Math.round(people * v / 100 * (mid === 'compliance' ? 0.08 : 1) * detailFactor(sp, mid)) : Math.round(v * 3);
    DR = { open: true, mid: mid, loc: loc, dept: dept, detail: detail, value: v, count: count, q: '', records: recordsFor(mid, loc, dept, detail, count), spec: sp };
    document.body.classList.add('drill-open'); renderDrill(); setTimeout(function () { var x = $('#drillQ', ui.drill); if (x) x.focus(); }, 60);
  }
  function closeDrill() { DR = { open: false }; document.body.classList.remove('drill-open'); renderDrill(); }
  function drillRows(recs, cols) { return recs.length ? recs.map(function (r) { return '<tr tabindex="0" data-act="drill-row" data-id="' + esc(r.id) + '">' + r.cells.map(function (c, i) { return '<td' + (i === 0 ? ' class="first"' : '') + '>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + cols.length + '" class="drill-empty">No records match.</td></tr>'; }
  function drillFiltered() { var q = DR.q.toLowerCase(); return DR.records.filter(function (r) { return !q || r.cells.join(' ').toLowerCase().indexOf(q) > -1; }); }
  function renderDrill() {
    var el = ui.drill; if (!el) return;
    if (!DR.open) { el.hidden = true; el.innerHTML = ''; return; }
    var m = metric(DR.mid), where = (DR.loc === 'all' ? 'All facilities' : fac(DR.loc).name) + (DR.dept ? ' › ' + DR.dept : '');
    var recs = drillFiltered(), cols = DR_COLS[DR.mid];
    var actions = m.src === 'ct' ? '<vaadin-button theme="primary small" data-act="drill-assign">Assign training</vaadin-button><vaadin-button theme="secondary small" data-act="drill-open">Open in Convergence</vaadin-button>' : '<vaadin-button theme="primary small" data-act="drill-open">Open in Vector EHS</vaadin-button>';
    var what = m.kind === 'pct' ? esc(num(DR.count)) + ' ' + (DR.mid === 'compliance' ? 'people not current' : 'people overdue') : m.kind === 'rate' ? esc(num(DR.count)) + ' recordable cases behind the rate' : esc(num(DR.count)) + ' records';
    el.hidden = false;
    el.innerHTML = '<div class="drill-head"><div class="drill-flow">' + srcChip(m.src, PRODUCT[m.src].label) + '<span class="drill-where"><i class="fa-regular fa-location-dot" aria-hidden="true"></i>' + esc(where) + '</span>' + (DR.spec.range && DR.spec.range !== 'dash' ? '<span class="drill-where"><i class="fa-regular fa-calendar-range" aria-hidden="true"></i>' + esc(rangeLabel(DR.spec.range)) + '</span>' : '') + '</div>' +
      '<h2>' + esc(m.label) + (DR.detail ? ': ' + esc(DR.detail) : '') + '</h2><div class="drill-big"><b>' + esc(num(DR.value)) + m.unit + '</b><span>' + what + '</span></div>' +
      '<button type="button" class="rd-close" data-act="drill-close" aria-label="Close"><i class="fa-regular fa-xmark" aria-hidden="true"></i></button></div>' +
      '<div class="drill-tools"><vaadin-text-field theme="outlined" id="drillQ" placeholder="Filter these records" clear-button-visible value="' + esc(DR.q) + '"><i slot="prefix" class="fa-regular fa-magnifying-glass" aria-hidden="true"></i></vaadin-text-field><span class="drill-count">' + recs.length + ' of ' + DR.records.length + '</span></div>' +
      '<div class="drill-body"><table class="drill-table"><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + drillRows(recs, cols) + '</tbody></table>' + (DR.count > DR.records.length ? '<p class="drill-more">Showing the first ' + DR.records.length + ' of ' + esc(num(DR.count)) + '. Open in ' + esc(PRODUCT[m.src].label) + ' for the full list.</p>' : '') + '</div>' +
      '<div class="drill-foot">' + actions + '<vaadin-button theme="tertiary small" data-act="drill-export">Export CSV</vaadin-button></div>';
  }

  /* ── Settings page ─────────────────────────────────────────────────────── */
  function renderSettings() {
    var shown = S.order.filter(function (id) { return !S.hidden[id]; }).length;
    ui.settings.innerHTML = '<div class="dw-page"><div class="dw-page-head"><div><h1>Settings</h1><p>Your preferences for Vector Bridge. Product-level settings stay in each product.</p></div></div>' +
      '<div class="st-grid"><section class="card st-card st-hero"><div class="st-ic"><i class="fa-regular fa-table-cells-large" aria-hidden="true"></i></div><div class="st-body"><h2>Home dashboard</h2><p>Your home page is made of widgets: the standard ones and the reports you build. Arrange them here, or add widgets from the home page.</p><p class="st-meta"><span>' + shown + ' of ' + S.order.length + ' widgets shown</span><span class="dot"></span><span>' + S.widgets.length + ' you built</span><span class="dot"></span><span>Last changed today</span></p></div><div class="st-actions"><vaadin-button theme="primary" data-act="bld-open"><i class="fa-regular fa-pen-ruler" aria-hidden="true" style="margin-right:8px"></i>Arrange your dashboard</vaadin-button><vaadin-button theme="tertiary" data-act="bld-reset">Reset to default</vaadin-button></div></section>' +
      [['fa-bell', 'Notifications', 'Which recommendations, tasks and deadlines reach you by email and in the app.'], ['fa-arrows-rotate', 'Data sync', 'When Convergence and Vector EHS data refresh, and who gets sync failure alerts.'], ['fa-sliders', 'Recommendation rules', 'Thresholds that create recommendations, like the near-miss cluster rule.'], ['fa-user', 'Profile', 'Name, email, job title and side nav text size.']].map(function (r) { return '<button type="button" class="card st-card st-row" data-act="bld-setting" data-name="' + esc(r[1]) + '"><span class="st-ic small"><i class="fa-regular ' + r[0] + '" aria-hidden="true"></i></span><span class="st-body"><h2>' + esc(r[1]) + '</h2><p>' + esc(r[2]) + '</p></span><i class="fa-regular fa-chevron-right st-chev" aria-hidden="true"></i></button>'; }).join('') + '</div></div>';
  }

  /* ── Add widget: full-screen takeover ──────────────────────────────────── */
  var TRY = ['Compare safety trends at Plant 4 with its training data', 'Who is overdue on Lockout/Tagout at Plant 2, as a table', 'Incident rate vs training compliance across all facilities', 'Forklift incidents vs forklift refresher completions, last 12 months'];
  function openAdd(opts) {
    opts = opts || {};
    var ex = opts.edit ? widget(opts.edit) : null;
    A = ex ? { id: ex.id, scope: ex.scope, m: mids(ex).slice(), viz: ex.viz, range: ex.range || 'dash', detail: Object.assign({}, ex.detail || {}), name: ex.title || '', tab: 'create', thread: [], q: '', thinking: false }
           : { id: null, scope: 'all', m: [], viz: 'bars', range: 'dash', detail: {}, name: '', tab: opts.tab || 'create', q: opts.q || '', thread: [], thinking: false };
    S.chatMin = !!opts.chatMin; S.studio = true; renderStudio();
    if (opts.q) setTimeout(function () { ask(opts.q); }, 60);
  }
  function closeStudio() { S.studio = false; ui.studio.hidden = true; ui.studio.innerHTML = ''; document.body.classList.remove('is-studio'); }
  function specOf() { return { scope: A.scope, m: A.m.slice(), viz: A.viz, range: A.range, detail: Object.assign({}, A.detail), title: A.name || '' }; }
  function interpret(q) {
    var t = q.toLowerCase(), hasMetric = METRIC_WORDS.some(function (p) { return p[1].some(function (w) { return t.indexOf(w) > -1; }); });
    if (A.m.length && !hasMetric) {
      var viz = /trend|over time|week/.test(t) ? 'trend' : /scatter|correlat/.test(t) ? 'scatter' : /table|list|rows|who /.test(t) ? 'table' : /number|total|kpi/.test(t) ? 'kpi' : /bar/.test(t) ? 'bars' : null;
      var scope = null; Object.keys(FAC_WORDS).forEach(function (id) { FAC_WORDS[id].forEach(function (w) { if (t.indexOf(w) > -1) scope = id; }); }); if (/all facilit|every facilit|company/.test(t)) scope = 'all';
      var range = rangeFrom(t);
      var det = findDetails(t, A.m); Object.keys(det).forEach(function (k) { A.detail[k] = det[k]; });
      if (viz && vizAllowed(A).indexOf(viz) > -1) A.viz = viz; if (scope) A.scope = scope; if (range) A.range = range;
      return (viz || scope || range || Object.keys(det).length) ? 'Updated: now ' + readBack(specOf()) : 'I kept the widget as it is. Try a location, a metric, a date range, or a chart type, like "show it as a table".';
    }
    var sp = describeToSpec(q); A.scope = sp.scope; A.m = sp.m; A.viz = sp.viz; A.range = sp.range; A.detail = sp.detail || {};
    return 'Read as ' + readBack(specOf()) + (sp.via === 'example' ? ' That matches one of the examples.' : '') + ' The parameters are filled in; change anything, or ask me to adjust it.';
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
      : '<div class="ms-ai"><span class="ms-mark sm"><i class="fa-regular fa-message-lines" aria-hidden="true"></i></span><div class="bubble">Tell me what you want to see: a location, the metrics to compare, a date range, and how to show it. I will fill in the parameters and you can adjust them.</div></div><div class="ms-try"><div class="ms-try-l">Try asking</div>' + TRY.map(function (q) { return '<button type="button" class="ms-choice" data-act="ms-try" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>';
    return '<section class="ms-chat" aria-label="Describe the widget"><div class="ms-chat-head"><div class="ms-chat-row"><span class="ms-mark"><i class="fa-regular fa-message-lines" aria-hidden="true"></i></span><div class="ms-chat-title">Describe it</div><button type="button" class="ms-iconbtn" data-act="ms-chat-reset" title="New conversation" aria-label="New conversation"><i class="fa-regular fa-rotate-left" aria-hidden="true"></i></button><button type="button" class="ms-iconbtn" data-act="ms-chat-min" title="Minimize the chat" aria-label="Minimize the chat"><i class="fa-regular fa-angles-left" aria-hidden="true"></i></button></div><p class="ms-chat-note">Ask in plain language and refine as you go, like "make it a table", "only Lockout/Tagout" or "last 30 days".</p></div>' +
      '<div class="ms-thread" role="log" aria-live="polite">' + thread + (A.thinking ? '<div class="ms-ai"><span class="ms-mark sm"><i class="fa-regular fa-message-lines" aria-hidden="true"></i></span><div class="bubble ms-thinking"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span><em>Reading both products…</em></div></div>' : '') + '</div>' +
      '<div class="ms-input-wrap"><div class="ms-input"><textarea id="msAsk" rows="2" placeholder="e.g. Who is overdue on Lockout/Tagout at Plant 2" aria-label="Describe the widget">' + esc(A.q || '') + '</textarea><button type="button" class="ms-send" data-act="ms-send" aria-label="Send"' + (A.thinking ? ' disabled' : '') + '><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button></div><p class="ms-input-note">Charts land on the preview and your dashboard, never in the thread.</p></div></section>';
  }
  function paramsHtml() {
    var list = [['ehs', 'Vector EHS'], ['ct', 'Convergence']].map(function (g) {
      return '<div class="dw-cat-t">' + g[1] + '</div>' + METRICS.filter(function (m) { return m.src === g[0]; }).map(function (m) {
        var i = A.m.indexOf(m.id), on = i > -1, specific = on && S.demo.specific;
        return '<div class="ms-mwrap' + (specific ? ' is-on' : '') + '"><button type="button" class="dw-mrow ms-check' + (on ? ' is-on' : '') + '" role="checkbox" aria-checked="' + on + '" data-act="toggle-m" data-id="' + m.id + '"><span class="ms-box" aria-hidden="true">' + (on ? '<i class="fa-solid fa-check"></i>' : '') + '</span><span class="dw-ic"><i class="fa-regular ' + m.icon + '" aria-hidden="true"></i></span><span class="ms-mlabel">' + esc(m.label) + '</span>' + (on ? '<i class="sw ms-sw" style="background:' + SERIES[i] + '" title="Series color"></i>' : '') + '</button>' +
          (specific ? '<div class="ms-detail"><vaadin-select theme="outlined" data-detail="' + m.id + '" label="' + esc(m.detail.label) + '" style="width:100%"></vaadin-select></div>' : '') + '</div>';
      }).join('');
    }).join('');
    return '<section class="ms-params" aria-label="Parameters"><div class="ms-col-head"><h2>Parameters</h2><p>Filled in from the chat, or set them yourself.</p></div><div class="ms-params-body">' +
      '<vaadin-text-field theme="outlined" id="msName" label="Widget name" placeholder="' + esc(A.m.length ? title(specOf()) : 'Named for what it shows') + '" value="' + esc(A.name || '') + '" style="width:100%"></vaadin-text-field>' +
      '<div class="dw-step"><span class="n">1</span>Where</div><vaadin-select theme="outlined" id="msScope" aria-label="Where" style="width:100%"></vaadin-select>' +
      '<div class="dw-step"><span class="n">2</span>Date range</div><vaadin-select theme="outlined" id="msRange" aria-label="Date range" style="width:100%"></vaadin-select>' +
      '<div class="dw-step"><span class="n">3</span>Metrics<span class="ms-count">' + A.m.length + ' selected</span>' + (A.m.length ? '<button type="button" class="ms-clear" data-act="clear-m">Clear</button>' : '') + '</div>' +
      '<p class="ms-hint">Pick as many as you like from either product to compare them.' + (S.demo.specific ? ' Each one can be narrowed to a course, type or qualification.' : '') + '</p><div role="group" aria-label="Metrics">' + list + '</div>' +
      (A.m.length ? '<div class="dw-step"><span class="n">4</span>Show as</div><div class="dw-vizchips">' + vizAllowed(A).map(function (v) { return '<button type="button" class="dw-chip' + (A.viz === v ? ' is-on' : '') + '" data-act="pick-viz" data-v="' + v + '"><i class="fa-regular ' + VIZ[v][1] + '" aria-hidden="true"></i>' + VIZ[v][0] + '</button>'; }).join('') + '</div>' + (A.m.length !== 2 ? '<p class="ms-hint">Scatter needs exactly two metrics.</p>' : '') : '') +
      '</div></section>';
  }
  function previewHtml() {
    var spec = A.m.length ? specOf() : null;
    return '<section class="ms-preview" aria-label="Preview"><div class="ms-col-head"><h2>Preview</h2><p>' + (spec ? 'How it will look on your dashboard. ' + (A.scope === 'all' ? 'Breaks down by facility. ' : 'Breaks down by department at ' + esc(scopeLabel(A.scope)) + '. ') + esc(rangeLabel(A.range)) + '.' + (S.demo.drill ? ' Click any number to see the records behind it.' : '') : 'Describe the widget in the chat, or pick metrics in Parameters.') + '</p></div>' +
      (spec ? '<div class="ms-canvas"><div class="ms-ghost">Key metrics</div>' + previewHtmlOf(Object.assign({ id: 'preview' }, spec)) + '<div class="ms-ghost">Recommended actions</div><p class="ms-where"><i class="fa-regular fa-arrow-turn-down-right" aria-hidden="true"></i>' + (A.id ? 'Stays where it is on your dashboard.' : 'Lands directly under Key metrics. Move it any time from its menu.') + '</p></div>'
        : '<div class="dw-prev-empty ms-empty"><i class="fa-regular fa-chart-mixed" aria-hidden="true"></i><b>Nothing to preview yet</b><span>Try "Who is overdue on Lockout/Tagout at Plant 2, as a table".</span></div>') + '</section>';
  }
  var EX_ICON = { kpis: 'fa-hashtag', recs: 'fa-lightbulb', compare: 'fa-table', row4: 'fa-calendar-check', audit: 'fa-file-shield' };
  function existingHtml() {
    var hiddenIds = S.order.filter(function (id) { return S.hidden[id]; });
    return '<div class="ms-existing"><div class="ms-col-head"><h2>Existing widgets</h2><p>' + (hiddenIds.length ? hiddenIds.length + ' widget' + (hiddenIds.length === 1 ? ' is' : 's are') + ' off your dashboard. Switch one on to add it back.' : 'Every widget is on your dashboard. Switch one off to hide it, or create a new one.') + ' Preview shows a widget as it renders right now.</p></div><ul class="ex-list">' +
      S.order.map(function (id) {
        var m = modMeta(id); if (!m) return ''; var on = !S.hidden[id], open = !!S.exOpen[id];
        return '<li class="ex-item"><div class="ex-row' + (on ? '' : ' is-off') + '"><span class="st-ic small"><i class="fa-regular ' + (m.custom ? 'fa-chart-mixed' : EX_ICON[id]) + '" aria-hidden="true"></i></span><span class="ex-main"><b>' + esc(m.name) + '</b><small>' + esc(m.desc) + '</small></span><span class="dw-srcs">' + m.src.map(function (s) { return srcChip(s); }).join('') + '</span>' +
          '<vaadin-button theme="tertiary small" data-act="ex-preview" data-id="' + id + '" aria-expanded="' + open + '"><i class="fa-regular ' + (open ? 'fa-chevron-up' : 'fa-eye') + '" aria-hidden="true" style="margin-right:6px"></i>' + (open ? 'Hide preview' : 'Preview') + '</vaadin-button>' +
          (m.custom ? '<vaadin-button theme="tertiary small" data-act="ex-edit" data-id="' + id.slice(2) + '">Edit</vaadin-button><vaadin-button theme="tertiary small" data-act="ex-remove" data-id="' + id.slice(2) + '">Remove</vaadin-button>' : '') +
          '<label class="mod-switch"><span>' + (on ? 'On' : 'Off') + '</span><vwc-switch data-act="ex-toggle-sw" data-id="' + id + '" accessible-name="Show ' + esc(m.name) + '"' + (on ? ' checked' : '') + '></vwc-switch></label></div>' +
          (open ? '<div class="ex-preview" data-ex-preview="' + id + '">' + (m.custom ? previewHtmlOf(widget(id.slice(2))) : '<div class="ex-clone"></div>') + '</div>' : '') + '</li>';
      }).join('') + '</ul></div>';
  }
  function mountClones() {
    $$('.ex-clone', ui.studio).forEach(function (box) {
      var id = box.closest('[data-ex-preview]').dataset.exPreview, src = moduleEl(id); if (!src) return;
      var c = src.cloneNode(true); c.hidden = false; c.classList.remove('is-editing', 'is-hidden-mod'); $$('.mod-chrome', c).forEach(function (x) { x.remove(); }); c.removeAttribute('id'); $$('[id]', c).forEach(function (x) { x.removeAttribute('id'); });
      box.innerHTML = ''; box.appendChild(c);
    });
  }
  function renderStudio() {
    var el = ui.studio, create = A.tab === 'create';
    el.hidden = false; document.body.classList.add('is-studio');
    var keep = {}; $$('.ms-params-body, .ms-thread, .ms-existing', el).forEach(function (x) { keep[x.className.split(' ')[0]] = x.scrollTop; });
    el.innerHTML = '<header class="ms-bar"><vaadin-button theme="secondary small" data-act="ms-close"><i class="fa-regular fa-arrow-left" aria-hidden="true" style="margin-right:6px"></i>Dashboard</vaadin-button><span class="ms-bar-ic"><i class="fa-regular fa-table-cells-large" aria-hidden="true"></i></span><h1>' + (A.id ? 'Edit widget' : 'Add a widget') + '</h1>' +
      (A.id ? '' : '<div class="ms-tabs" role="tablist"><button type="button" role="tab" data-act="ms-tab" data-tab="create" aria-selected="' + create + '"><i class="fa-regular fa-plus" aria-hidden="true"></i>Create a new widget</button><button type="button" role="tab" data-act="ms-tab" data-tab="existing" aria-selected="' + !create + '"><i class="fa-regular fa-layer-group" aria-hidden="true"></i>Existing widgets</button></div>') +
      '<div class="ms-bar-tools">' + (create ? '<vaadin-button theme="tertiary" data-act="ms-close">Cancel</vaadin-button><vaadin-button theme="primary" data-act="add-confirm"' + (A.m.length ? '' : ' disabled') + '>' + (A.id ? 'Save widget' : 'Add to dashboard') + '</vaadin-button>' : '<vaadin-button theme="primary" data-act="ms-close">Done</vaadin-button>') + '</div></header>' +
      (create ? '<div class="ms-cols' + (S.chatMin ? ' chat-min' : '') + '">' + chatHtml() + paramsHtml() + previewHtml() + '</div>' : existingHtml());
    $$('.ms-params-body, .ms-thread, .ms-existing', el).forEach(function (x) { var k = x.className.split(' ')[0]; if (keep[k] != null) x.scrollTop = keep[k]; });
    var th = $('.ms-thread', el); if (th && A.thread.length) th.scrollTop = th.scrollHeight;
    var sel = $('#msScope', el); if (sel) { sel.items = [{ label: 'All facilities', value: 'all' }].concat(D.facilities.map(function (f) { return { label: f.name, value: f.id }; })); sel.value = A.scope; sel.addEventListener('value-changed', function (e) { if (e.detail.value && e.detail.value !== A.scope) { A.scope = e.detail.value; renderStudio(); } }); }
    var rs = $('#msRange', el); if (rs) { rs.items = RANGES.map(function (r) { return { label: r[1], value: r[0] }; }); rs.value = A.range; rs.addEventListener('value-changed', function (e) { if (e.detail.value && e.detail.value !== A.range) { A.range = e.detail.value; renderStudio(); } }); }
    $$('vaadin-select[data-detail]', el).forEach(function (ds) { var m = metric(ds.dataset.detail); ds.items = [{ label: 'All ' + m.detail.label.toLowerCase() + 's', value: 'all' }].concat(m.detail.options.map(function (o) { return { label: o, value: o }; })); ds.value = A.detail[m.id] || 'all'; ds.addEventListener('value-changed', function (e) { var v = e.detail.value; if (!v || (A.detail[m.id] || 'all') === v) return; if (v === 'all') delete A.detail[m.id]; else A.detail[m.id] = v; renderStudio(); }); });
    var nm = $('#msName', el); if (nm) nm.addEventListener('change', function () { A.name = nm.value.trim(); renderStudio(); });
    if (!create) mountClones();
    $$('[data-drill]', el).forEach(function (x) { x.setAttribute('tabindex', '0'); });
  }
  function openConfirm(wid) {
    var w = widget(wid); if (!w) return;
    var key = ++dlgKey, dlg = ui.confirm;
    dlg.renderer = function (root) {
      if (root.__k === key) return; root.__k = key;
      root.innerHTML = '<div class="dlg dlg-confirm"><div class="dlg-head"><div><h2>Remove this widget?</h2><p>' + esc(title(w)) + '</p></div></div><div class="dlg-body"><p class="field-hint" style="margin:0">It comes off your dashboard for you only. You can undo from the toast for a few seconds; after that you would build it again.</p></div><div class="dlg-foot"><vaadin-button theme="tertiary" data-act="cf-cancel">Cancel</vaadin-button><vaadin-button theme="error primary" data-act="cf-remove">Remove widget</vaadin-button></div></div>';
      root.onclick = function (e) { var b = e.target.closest('[data-act]'); if (!b) return; dlg.opened = false; if (b.dataset.act === 'cf-remove') removeWidget(wid); };
    };
    dlg.opened = true;
  }
  function removeWidget(wid) {
    var idx = S.widgets.map(function (x) { return x.id; }).indexOf(wid); if (idx < 0) return;
    var gone = S.widgets.splice(idx, 1)[0], pos = S.order.indexOf('w:' + wid); S.order.splice(pos, 1); S.menu = null;
    renderCustom(); applyLayout(); if (S.studio) renderStudio();
    App.toast('Widget removed', title(gone), { label: 'Undo', run: function () { S.widgets.splice(idx, 0, gone); S.order.splice(pos, 0, 'w:' + gone.id); renderCustom(); applyLayout(); if (S.studio) renderStudio(); } });
  }
  function bindStudio() {
    ui.studio.addEventListener('click', function (e) {
      var dr = e.target.closest('[data-drill]'); if (dr && S.demo.drill) { e.preventDefault(); var sec = dr.closest('[data-ex-preview]'); var w = sec ? widget(sec.dataset.exPreview.slice(2)) : null; openDrill(dr.dataset.drill, dr.dataset.drillLoc, w || (A.tab === 'create' ? specOf() : null)); return; }
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'ms-close') { closeStudio(); return; }
      if (act === 'ms-tab') { A.tab = b.dataset.tab; renderStudio(); return; }
      if (act === 'ms-chat-min') { S.chatMin = true; renderStudio(); return; }
      if (act === 'ms-chat-open') { S.chatMin = false; renderStudio(); var t = $('#msAsk', ui.studio); if (t) t.focus(); return; }
      if (act === 'ms-chat-reset') { A.thread = []; A.q = ''; renderStudio(); return; }
      if (act === 'ms-try') { ask(b.dataset.q); return; }
      if (act === 'ms-send') { ask(($('#msAsk', ui.studio) || {}).value); return; }
      if (act === 'toggle-m') { var id = b.dataset.id, i = A.m.indexOf(id); if (i > -1) { A.m.splice(i, 1); delete A.detail[id]; } else A.m.push(id); if (vizAllowed(A).indexOf(A.viz) < 0) A.viz = 'bars'; renderStudio(); var again = ui.studio.querySelector('[data-act="toggle-m"][data-id="' + id + '"]'); if (again) again.focus(); return; }
      if (act === 'clear-m') { A.m = []; A.detail = {}; renderStudio(); return; }
      if (act === 'pick-viz') { A.viz = b.dataset.v; renderStudio(); return; }
      if (act === 'ex-preview') { var pid = b.dataset.id; S.exOpen[pid] = !S.exOpen[pid]; renderStudio(); return; }
      if (act === 'ex-edit') { openAdd({ edit: b.dataset.id }); return; }
      if (act === 'ex-remove') { openConfirm(b.dataset.id); return; }
      if (act === 'add-confirm' && A.m.length) {
        var spec = specOf(); if (!A.name) delete spec.title;
        if (A.id) { var k = S.widgets.map(function (x) { return x.id; }).indexOf(A.id); spec.id = A.id; S.widgets[k] = spec; } else { S.widgets.push(W(spec)); S.order.splice(S.order.indexOf('kpis') + 1, 0, 'w:' + spec.id); }
        var wasEdit = !!A.id; closeStudio(); renderCustom(); applyLayout();
        var el = document.getElementById('cm-' + spec.id); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        App.toast(wasEdit ? 'Widget updated' : 'Widget added to your dashboard', title(spec) + (wasEdit ? '' : ' sits under Key metrics.'));
      }
    });
    ui.studio.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'msAsk') { e.preventDefault(); ask(e.target.value); } });
    ui.studio.addEventListener('input', function (e) { if (e.target.id === 'msAsk') A.q = e.target.value; });
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
  var KPI_METRIC = { 'Incident rate report': 'trir', 'Corrective actions': 'open_ca', 'Training status report': 'overdue', 'Expiring qualifications': 'quals' };
  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target; if (!t.closest) return;
      var dd = t.closest('#drillDrawer [data-act]');
      if (dd) { var a = dd.dataset.act; if (a === 'drill-close') closeDrill(); else if (a === 'drill-assign') { closeDrill(); if (window.App && App.openAssign) App.openAssign(); else App.notYet('Assign training from this list'); } else if (a === 'drill-open') App.notYet('Opening these ' + metric(DR.mid).label.toLowerCase() + ' records in ' + PRODUCT[metric(DR.mid).src].label); else if (a === 'drill-export') App.toast('Export started', 'A CSV of ' + DR.records.length + ' records is on its way.'); else if (a === 'drill-row') App.notYet('The record ' + dd.dataset.id); return; }
      if (t.closest('#drillDrawer') || t.closest('vaadin-dialog-overlay, vaadin-select-overlay, vaadin-notification-card')) return;
      if (DR.open && !t.closest('[data-drill]') && !t.closest('#demoPill')) closeDrill();
      if (t.closest('#moduleStudio')) return;
      if (S.demo.drill) {
        var dr = t.closest('#main [data-drill]'); if (dr) { e.preventDefault(); var sec = dr.closest('.module.cm'), w = sec ? widget(sec.id.slice(3)) : null; openDrill(dr.dataset.drill, dr.dataset.drillLoc, w || null); return; }
        var kp = t.closest('#kpis .kpi[data-report]'); if (kp && KPI_METRIC[kp.dataset.report]) { e.preventDefault(); e.stopImmediatePropagation(); var sc = (window.App && App.state) ? App.state().scope : 'all'; openDrill(KPI_METRIC[kp.dataset.report], sc, null); return; }
      }
      if (S.menu && !t.closest('.dw-kebab-wrap')) { S.menu = null; renderCustom(); }
      var cm = t.closest('[data-cmenu]'); if (cm) { e.stopPropagation(); S.menu = S.menu === cm.dataset.cmenu ? null : cm.dataset.cmenu; renderCustom(); return; }
      var mv = t.closest('[data-cmove]'); if (mv) { S.menu = null; renderCustom(); move('w:' + mv.dataset.cid, mv.dataset.cmove); return; }
      var ce = t.closest('[data-cedit]'); if (ce) { S.menu = null; renderCustom(); openAdd({ edit: ce.dataset.cedit }); return; }
      var cr = t.closest('[data-cremove]'); if (cr) { S.menu = null; renderCustom(); openConfirm(cr.dataset.cremove); return; }
      var b = t.closest('[data-act^="bld-"]'); if (!b) return;
      if (b.tagName === 'A') e.preventDefault();
      switch (b.dataset.act) {
        case 'bld-open': show('build'); break;
        case 'bld-done': show('home'); App.toast('Dashboard saved', 'Your layout and widgets are kept for you on every device.'); break;
        case 'bld-settings': show('settings'); break;
        case 'bld-reset': { var keep = S.widgets; S.order = ['kpis', 'recs', 'compare', 'row4', 'audit'].concat(keep.map(function (w) { return 'w:' + w.id; })); S.hidden = {}; S.view = 'settings'; render(); App.toast('Layout reset', 'Standard widgets are back in their default order. The widgets you built are kept.'); break; }
        case 'bld-add': openAdd({ tab: 'create' }); break;
        case 'bld-existing': openAdd({ tab: 'existing' }); break;
        case 'bld-up': case 'bld-down': move(b.dataset.id, b.dataset.act === 'bld-up' ? 'up' : 'down'); break;
        case 'bld-setting': App.notYet(b.dataset.name + ' settings'); break;
        default: break;
      }
    }, true);
    document.addEventListener('checked-change', function (e) {
      var dm = e.target.closest && e.target.closest('vwc-switch[data-demo]'); if (dm) { S.demo[dm.dataset.demo] = !!e.detail; document.body.classList.toggle('demo-drill', !!S.demo.drill); if (!S.demo.drill) closeDrill(); renderCustom(); if (S.studio) renderStudio(); return; }
      var sw = e.target.closest && e.target.closest('vwc-switch[data-act="bld-toggle"], vwc-switch[data-act="ex-toggle-sw"]'); if (!sw) return;
      S.hidden[sw.dataset.id] = !e.detail; applyLayout();
      if (sw.dataset.act === 'ex-toggle-sw') { var lbl = sw.closest('label').querySelector('span'); if (lbl) lbl.textContent = e.detail ? 'On' : 'Off'; sw.closest('.ex-row').classList.toggle('is-off', !e.detail); }
    });
    document.addEventListener('input', function (e) {
      if (e.target.id !== 'drillQ' || !DR.open) return;
      DR.q = e.target.value; var recs = drillFiltered(), cols = DR_COLS[DR.mid];
      var tb = $('.drill-table tbody', ui.drill); if (tb) tb.innerHTML = drillRows(recs, cols);
      var cnt = $('.drill-count', ui.drill); if (cnt) cnt.textContent = recs.length + ' of ' + DR.records.length;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { if (DR.open) { closeDrill(); return; } if (S.menu) { S.menu = null; renderCustom(); return; } if (S.studio && !document.querySelector('vaadin-select-overlay[opened], vaadin-dialog-overlay[opened]')) closeStudio(); }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-drill]') && S.demo.drill) { e.preventDefault(); e.target.click(); }
    });
  }

  /* ── Flow-map states ───────────────────────────────────────────────────── */
  var KNOWN = ['settings', 'build', 'add-module', 'create-module', 'describe', 'create-min', 'existing-modules', 'specific', 'drill', 'existing-preview', 'confirm-remove'], pendingState = null, ready = false;
  function reset() { var v = fresh(); S.view = v.view; S.order = v.order; S.hidden = {}; S.menu = null; S.widgets = v.widgets; S.exOpen = {}; closeDrill(); if (ui.studio) closeStudio(); if (ui.confirm) ui.confirm.opened = false; }
  function applyState(id) {
    if (!ready) { if (KNOWN.indexOf(id) < 0) return false; pendingState = id; return true; }
    switch (id) {
      case 'settings': show('settings'); return true;
      case 'build': show('build'); return true;
      case 'add-module': case 'create-module': show('home'); openAdd({ tab: 'create' }); return true;
      case 'existing-modules': show('home'); openAdd({ tab: 'existing' }); return true;
      case 'existing-preview': show('home'); S.exOpen = {}; S.exOpen['w:' + S.widgets[0].id] = true; S.exOpen.compare = true; openAdd({ tab: 'existing' }); return true;
      case 'confirm-remove': show('home'); openAdd({ tab: 'existing' }); setTimeout(function () { openConfirm(S.widgets[0].id); }, 300); return true;
      case 'describe': show('home'); openAdd({ tab: 'create', q: 'Compare safety trends at Plant 4 with its training data' }); return true;
      case 'specific': show('home'); openAdd({ tab: 'create', q: 'Who is overdue on Lockout/Tagout at Plant 2, as a table' }); return true;
      case 'create-min': show('home'); openAdd({ tab: 'create', q: 'Compare safety trends at Plant 4 with its training data', chatMin: true }); return true;
      case 'drill': show('home'); openDrill('overdue', 'plant2', { scope: 'plant2', range: 'dash', detail: { overdue: 'Lockout/Tagout' } }); return true;
      default: return false;
    }
  }
  function init() {
    if (ready) return;
    ui.page = $('#main .page-inner'); ui.settings = $('#settingsView'); ui.buildBar = $('#buildBar'); ui.studio = $('#moduleStudio'); ui.drill = $('#drillDrawer'); ui.demo = $('#demoPill'); ui.confirm = $('#bldConfirmDlg');
    if (!ui.settings || !ui.page || !ui.studio) return;
    bind(); bindStudio(); ready = true; render();
    if (pendingState) { var p = pendingState; pendingState = null; applyState(p); }
  }
  window.Builder = { show: show, applyState: applyState, reset: reset, renderCustom: renderCustom, applyLayout: applyLayout, init: init, openDrill: openDrill };
  var whenReady = Promise.all(['vaadin-select', 'vaadin-text-field', 'vaadin-dialog', 'vwc-switch'].map(function (t) { return customElements.whenDefined(t); }));
  var domReady = new Promise(function (res) { if (document.readyState !== 'loading') res(); else document.addEventListener('DOMContentLoaded', res); });
  Promise.all([whenReady, domReady]).then(init);
  domReady.then(function () { setTimeout(init, 9000); });
})();
