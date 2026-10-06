/* ============================================================================
   dashboards.js · Build your own dashboards from Convergence + Vector EHS data
   ----------------------------------------------------------------------------
   Pattern ported from the Readiness Hub (Keystone) Agency Intelligence surface:
     · HOME     a published-dashboard container on the home page: picker between
                your dashboards, a docked "Ask" panel (text answers only, each
                one can be added as a widget), a 12-column widget grid
     · LIST     Dashboards page: searchable table (All / Draft / Published)
     · BUILD    two-pane canvas (Ask panel + grid), Edit / Preview, Add widget
                dialog over a metric catalog from BOTH products plus cross-
                product pairs, Publish to an audience
   Everything renders from the metric catalog below + window.SUITE_DATA.
   Vanilla JS; dialogs use vaadin-dialog renderers (slotted content is ignored
   in this core build). Per Bridge's CLAUDE.md: no AI branding on these
   surfaces, the panel is titled for what it does ("Ask").
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
  var TODAY = '2026-10-06';
  var PRODUCT = { ehs: { label: 'Vector EHS', chip: 'EHS' }, ct: { label: 'Convergence', chip: 'LMS' } };
  function srcChip(src, text) { return '<span class="src src-' + src + '">' + esc(text || PRODUCT[src].chip) + '</span>'; }

  /* ── Metric catalog: one entry per metric, with the viz it supports ─────── */
  var METRICS = [
    { id: 'trir',        src: 'ehs', cat: 'Incidents',          label: 'Incident rate (TRIR)',       icon: 'fa-triangle-exclamation', viz: ['kpi', 'bar', 'line', 'table'], def: 'kpi',  tone: 'err' },
    { id: 'incidents',   src: 'ehs', cat: 'Incidents',          label: 'Incidents by facility',      icon: 'fa-triangle-exclamation', viz: ['bar', 'table', 'kpi'],         def: 'bar',  tone: 'err' },
    { id: 'inc_types',   src: 'ehs', cat: 'Incidents',          label: 'Incidents by type',          icon: 'fa-chart-pie',            viz: ['donut', 'bar', 'table'],       def: 'donut' },
    { id: 'near_miss',   src: 'ehs', cat: 'Incidents',          label: 'Near misses',                icon: 'fa-bolt',                 viz: ['kpi', 'bar', 'line'],          def: 'bar',  tone: 'warn' },
    { id: 'open_ca',     src: 'ehs', cat: 'Corrective actions', label: 'Open corrective actions',    icon: 'fa-list-check',           viz: ['kpi', 'bar', 'table'],         def: 'kpi',  tone: 'warn' },
    { id: 'overdue_ca',  src: 'ehs', cat: 'Corrective actions', label: 'Past-due corrective actions',icon: 'fa-clock',                viz: ['kpi', 'bar'],                  def: 'bar',  tone: 'err' },
    { id: 'observations',src: 'ehs', cat: 'Inspections',        label: 'Observations logged',        icon: 'fa-eye',                  viz: ['kpi', 'line', 'bar'],          def: 'line' },
    { id: 'inspections', src: 'ehs', cat: 'Inspections',        label: 'Inspections completed',      icon: 'fa-clipboard-check',      viz: ['kpi', 'bar', 'table'],         def: 'kpi',  tone: 'ok' },
    { id: 'compliance',  src: 'ct',  cat: 'Training',           label: 'Training compliance',        icon: 'fa-graduation-cap',       viz: ['kpi', 'bar', 'line', 'table'], def: 'kpi',  tone: 'ok' },
    { id: 'overdue',     src: 'ct',  cat: 'Training',           label: 'Overdue training',           icon: 'fa-graduation-cap',       viz: ['bar', 'kpi', 'table'],         def: 'bar',  tone: 'err' },
    { id: 'courses',     src: 'ct',  cat: 'Training',           label: 'Overdue by course',          icon: 'fa-book-open',            viz: ['bar', 'donut', 'table'],       def: 'bar' },
    { id: 'quals',       src: 'ct',  cat: 'Qualifications',     label: 'Qualifications expiring',    icon: 'fa-id-badge',             viz: ['kpi', 'bar', 'table'],         def: 'kpi',  tone: 'warn' },
    { id: 'completions', src: 'ct',  cat: 'Training',           label: 'Completions per week',       icon: 'fa-circle-check',         viz: ['line', 'kpi'],                 def: 'line', tone: 'ok' }
  ];
  /* Cross-product pairs: the reason this surface exists */
  var PAIRS = [
    { id: 'trir_x_compliance', a: 'trir', b: 'compliance', label: 'Incident rate × Training compliance', hint: 'Do the facilities with the worst incident rate also have the lowest compliance?', viz: ['scatter', 'pair', 'table'], def: 'scatter' },
    { id: 'nearmiss_x_overdue', a: 'near_miss', b: 'overdue', label: 'Near misses × Overdue training', hint: 'Is the backlog where the close calls are?', viz: ['pair', 'scatter', 'table'], def: 'pair' },
    { id: 'ca_x_compliance', a: 'open_ca', b: 'compliance', label: 'Open corrective actions × Compliance', hint: 'Are retraining actions landing where compliance is low?', viz: ['pair', 'table'], def: 'pair' },
    { id: 'obs_x_overdue', a: 'observations', b: 'overdue', label: 'Observations × Overdue training', hint: 'More observations where training lapses?', viz: ['pair', 'scatter'], def: 'pair' }
  ];
  var VIZ = { kpi: ['Big number', 'fa-hashtag'], bar: ['Bar chart', 'fa-chart-bar'], line: ['Trend line', 'fa-chart-line'], donut: ['Donut', 'fa-chart-pie'], table: ['Table', 'fa-table'], pair: ['Paired bars', 'fa-chart-bar'], scatter: ['Scatter', 'fa-braille'], summary: ['Summary', 'fa-align-left'] };
  var SIZES = [[4, 'Third'], [6, 'Half'], [8, 'Two thirds'], [12, 'Full width']];
  function metric(id) { for (var i = 0; i < METRICS.length; i++) if (METRICS[i].id === id) return METRICS[i]; return null; }
  function pair(id) { for (var i = 0; i < PAIRS.length; i++) if (PAIRS[i].id === id) return PAIRS[i]; return null; }

  /* ── Metric values per facility (from data.js), so every widget is alive ─ */
  function perFacility(mid) {
    return D.facilities.map(function (f) {
      var v = { trir: f.trir, incidents: f.incidents, near_miss: f.nearMisses, open_ca: f.openCA, overdue_ca: f.overdueCA, observations: Math.round(f.incidents * 1.6 + f.nearMisses), inspections: Math.round(f.employees / 48), compliance: f.compliance, overdue: f.overdue, courses: f.topOverdueCount, quals: f.qualsExpiring, completions: Math.round(f.employees / 9) }[mid];
      return { id: f.id, label: short(f.name), full: f.name, value: v };
    });
  }
  function total(mid) {
    var rows = perFacility(mid), emp = D.facilities.reduce(function (a, f) { return a + f.employees; }, 0);
    if (mid === 'trir' || mid === 'compliance' || mid === 'overdue') { var s = 0; D.facilities.forEach(function (f, i) { s += rows[i].value * f.employees; }); return Math.round(s / emp * 10) / 10; }
    return rows.reduce(function (a, r) { return a + r.value; }, 0);
  }
  function unit(mid) { return (mid === 'compliance' || mid === 'overdue') ? '%' : ''; }
  function kpiMeta(mid) {
    var k = D.kpis.all;
    return { trir: ['vs. ' + k.trir.prev + ' prior 90 days', 'up'], open_ca: ['vs. ' + k.openCA.prev + ' prior 90 days', 'up'], overdue: ['vs. ' + k.overdue.prev + '% prior 90 days', 'up'], quals: ['vs. ' + k.quals.prev + ' prior 90 days', 'up'], compliance: ['vs. 88% prior 90 days', 'down'], incidents: ['vs. 41 prior 90 days', 'up'], near_miss: ['vs. 22 prior 90 days', 'up'], overdue_ca: ['vs. 9 prior 90 days', 'up'], observations: ['vs. 71 prior 90 days', 'up'], inspections: ['vs. 92 prior 90 days', 'down'], courses: ['vs. 380 prior 90 days', 'up'], completions: ['vs. 468 prior 90 days', 'up'] }[mid] || ['', 'flat'];
  }
  var WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
  function series(mid) {
    var t = total(mid), out = [];
    for (var i = 0; i < 12; i++) { var k = (i / 11); out.push(Math.round((t * (0.72 + 0.28 * k * k) + ((i * 7) % 5 - 2) * (t / 40)) * 10) / 10); }
    return out;
  }

  /* ── Viz renderers (SVG / HTML, theme tokens only) ─────────────────────── */
  var TONE = { err: 'var(--lumo-error-color)', warn: 'var(--lumo-warning-color)', ok: 'var(--lumo-success-color)', neutral: 'var(--lumo-primary-color)' };
  function vizKpi(mid) {
    var m = metric(mid), meta = kpiMeta(mid), t = total(mid);
    var bad = (meta[1] === 'up') === (m.tone === 'err' || m.tone === 'warn');
    return '<div class="dw-kpi"><div class="dw-kpi-val" style="color:' + (TONE[m.tone] || TONE.neutral) + '">' + esc(num(t)) + '<small>' + unit(mid) + '</small></div>' +
      (meta[0] ? '<div class="dw-kpi-delta ' + (bad ? 'bad' : 'good') + '"><i class="fa-solid ' + (meta[1] === 'up' ? 'fa-arrow-up-right' : meta[1] === 'down' ? 'fa-arrow-down-right' : 'fa-arrow-right') + '" aria-hidden="true"></i>' + esc(meta[0]) + '</div>' : '') + '</div>';
  }
  function vizBar(mid) {
    var rows = perFacility(mid).sort(function (a, b) { return b.value - a.value; }), max = Math.max.apply(null, rows.map(function (r) { return r.value; })) || 1, m = metric(mid);
    return '<div class="dw-bars">' + rows.map(function (r, i) {
      return '<div class="dw-bar" title="' + esc(r.full + ': ' + r.value + unit(mid)) + '"><span class="dw-bar-l">' + esc(r.label) + '</span><span class="dw-bar-t"><span class="dw-bar-f" style="width:' + (r.value / max * 100).toFixed(0) + '%;background:' + (i === 0 ? (TONE[m.tone] || TONE.neutral) : 'var(--lumo-contrast-30pct)') + '"></span></span><span class="dw-bar-v">' + esc(num(r.value)) + unit(mid) + '</span></div>';
    }).join('') + '</div>';
  }
  function vizLine(mid) {
    var vals = series(mid), w = 320, h = 110, pl = 34, pb = 20, min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), span = (max - min) || 1;
    var pts = vals.map(function (v, i) { return [pl + i * (w - pl - 8) / 11, 10 + (1 - (v - min) / span) * (h - pb - 14)]; });
    var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var last = pts[11];
    return '<svg class="dw-line" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(metric(mid).label) + ' over 12 weeks">' +
      '<line class="grid" x1="' + pl + '" y1="' + (h - pb) + '" x2="' + w + '" y2="' + (h - pb) + '"/><line class="grid" x1="' + pl + '" y1="10" x2="' + w + '" y2="10"/>' +
      '<text x="' + (pl - 6) + '" y="14" text-anchor="end">' + esc(num(max)) + '</text><text x="' + (pl - 6) + '" y="' + (h - pb + 4) + '" text-anchor="end">' + esc(num(min)) + '</text>' +
      '<path d="' + path + ' L' + last[0].toFixed(1) + ',' + (h - pb) + ' L' + pts[0][0].toFixed(1) + ',' + (h - pb) + ' Z" fill="var(--lumo-primary-color)" opacity=".08"/>' +
      '<path d="' + path + '" fill="none" stroke="var(--lumo-primary-color)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="4" fill="var(--lumo-primary-color)" stroke="#fff" stroke-width="2"/>' +
      '<text x="' + pl + '" y="' + (h - 4) + '">12 weeks ago</text><text x="' + w + '" y="' + (h - 4) + '" text-anchor="end">This week</text></svg>';
  }
  function vizDonut(mid) {
    var items = mid === 'inc_types' ? [['Forklift / PIT', 23], ['Slips and trips', 14], ['Lacerations', 9], ['Ergonomic strain', 7], ['Other', 5]]
      : [['Forklift Safety Refresher', 51], ['Lockout/Tagout', 308], ['Hazard Communication', 43], ['Walking-Working Surfaces', 31]];
    var cols = ['var(--lumo-primary-color)', 'var(--vwc-color-puerto-rico-500)', 'var(--vwc-color-ecstacy-500)', 'var(--vwc-color-vivid-violet-500)', 'var(--lumo-contrast-30pct)'];
    var sum = items.reduce(function (a, x) { return a + x[1]; }, 0), r = 40, c = 2 * Math.PI * r, off = 0, segs = '';
    items.forEach(function (it, i) { var len = it[1] / sum * c; segs += '<circle r="' + r + '" cx="50" cy="50" fill="none" stroke="' + cols[i] + '" stroke-width="14" stroke-dasharray="' + (len - 2).toFixed(1) + ' ' + (c - len + 2).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '"/>'; off += len; });
    return '<div class="dw-donut"><svg viewBox="0 0 100 100" role="img" aria-label="' + esc(metric(mid).label) + '">' + segs + '</svg><ul class="dw-legend">' + items.map(function (it, i) { return '<li><span class="sw" style="background:' + cols[i] + '"></span>' + esc(it[0]) + '<b>' + Math.round(it[1] / sum * 100) + '%</b></li>'; }).join('') + '</ul></div>';
  }
  function vizTable(mid) {
    var rows = perFacility(mid).sort(function (a, b) { return b.value - a.value; });
    return '<table class="dw-table"><thead><tr><th>Facility</th><th class="n">' + esc(metric(mid).label) + '</th><th class="n">Employees</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td>' + esc(r.full) + '</td><td class="n">' + esc(num(r.value)) + unit(mid) + '</td><td class="n">' + num(fac(r.id).employees) + '</td></tr>'; }).join('') + '</tbody></table>';
  }
  function vizPair(pid) {
    var p = pair(pid), A = perFacility(p.a), B = perFacility(p.b), maxA = Math.max.apply(null, A.map(function (r) { return r.value; })) || 1, maxB = Math.max.apply(null, B.map(function (r) { return r.value; })) || 1;
    var order = A.map(function (r, i) { return i; }).sort(function (x, y) { return A[y].value - A[x].value; });
    return '<div class="dw-pair"><div class="dw-plegend"><span><i class="sw" style="background:var(--lumo-error-color)"></i>' + esc(metric(p.a).label) + srcChip('ehs') + '</span><span><i class="sw" style="background:var(--lumo-primary-color)"></i>' + esc(metric(p.b).label) + srcChip(metric(p.b).src) + '</span></div>' +
      order.map(function (i) { return '<div class="dw-prow"><span class="dw-bar-l">' + esc(A[i].label) + '</span><span class="dw-ptracks"><span class="dw-bar-t"><span class="dw-bar-f" style="width:' + (A[i].value / maxA * 100).toFixed(0) + '%;background:var(--lumo-error-color)"></span></span><span class="dw-bar-t"><span class="dw-bar-f" style="width:' + (B[i].value / maxB * 100).toFixed(0) + '%;background:var(--lumo-primary-color)"></span></span></span><span class="dw-pvals"><b>' + esc(num(A[i].value)) + unit(p.a) + '</b><b>' + esc(num(B[i].value)) + unit(p.b) + '</b></span></div>'; }).join('') + '</div>';
  }
  function vizScatter(pid) {
    var p = pair(pid), A = perFacility(p.a), B = perFacility(p.b), w = 320, h = 150, pl = 40, pb = 26;
    var maxA = Math.max.apply(null, A.map(function (r) { return r.value; })) * 1.15, maxB = Math.max.apply(null, B.map(function (r) { return r.value; })) * 1.1, minB = Math.min.apply(null, B.map(function (r) { return r.value; })) * 0.9;
    var dots = A.map(function (r, i) {
      var x = pl + (B[i].value - minB) / (maxB - minB) * (w - pl - 12), y = 8 + (1 - r.value / maxA) * (h - pb - 10), hot = fac(r.id).signal === 'elevated';
      return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (hot ? 7 : 5) + '" fill="' + (hot ? 'var(--lumo-error-color)' : 'var(--lumo-primary-color)') + '" stroke="#fff" stroke-width="2"><title>' + esc(r.full + ': ' + r.value + unit(p.a) + ' / ' + B[i].value + unit(p.b)) + '</title></circle>' + (hot ? '<text x="' + (x + 10).toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" class="lbl">' + esc(r.label) + '</text>' : '');
    }).join('');
    return '<svg class="dw-scatter" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(p.label) + '"><line class="grid" x1="' + pl + '" y1="' + (h - pb) + '" x2="' + w + '" y2="' + (h - pb) + '"/><line class="grid" x1="' + pl + '" y1="6" x2="' + pl + '" y2="' + (h - pb) + '"/>' +
      '<text x="' + pl + '" y="' + (h - 6) + '">' + esc(metric(p.b).label) + ' →</text><text x="12" y="10" transform="rotate(-90 12 10)" text-anchor="end">' + esc(metric(p.a).label) + ' →</text>' + dots + '</svg>' +
      '<p class="dw-cap">Red dots are facilities flagged <strong>Elevated</strong>. Hover a dot for its values.</p>';
  }
  function vizSummary(w) {
    var p4 = fac('plant4');
    var text = w.text || ('Plant 4 – Riverside has the highest incident rate (' + p4.trir + ') and the second-lowest training compliance (' + p4.compliance + '%). The three facilities below 75% compliance account for 28 of 51 incidents this quarter. Facilities above 90% compliance average a TRIR of 1.8.');
    return '<p class="dw-summary">' + esc(text) + '</p>';
  }
  function widgetBody(w) {
    if (w.pair) { var p = pair(w.pair); return w.viz === 'scatter' ? vizScatter(w.pair) : w.viz === 'table' ? vizPairTable(w.pair) : vizPair(w.pair); }
    if (w.viz === 'summary') return vizSummary(w);
    switch (w.viz) { case 'kpi': return vizKpi(w.metric); case 'bar': return vizBar(w.metric); case 'line': return vizLine(w.metric); case 'donut': return vizDonut(w.metric); case 'table': return vizTable(w.metric); default: return vizBar(w.metric); }
  }
  function vizPairTable(pid) {
    var p = pair(pid), A = perFacility(p.a), B = perFacility(p.b);
    return '<table class="dw-table"><thead><tr><th>Facility</th><th class="n">' + esc(metric(p.a).label) + '</th><th class="n">' + esc(metric(p.b).label) + '</th></tr></thead><tbody>' + A.map(function (r, i) { return '<tr><td>' + esc(r.full) + '</td><td class="n">' + esc(num(r.value)) + unit(p.a) + '</td><td class="n">' + esc(num(B[i].value)) + unit(p.b) + '</td></tr>'; }).join('') + '</tbody></table>';
  }
  function widgetTitle(w) { return w.title || (w.pair ? pair(w.pair).label : w.viz === 'summary' ? 'Summary' : metric(w.metric).label); }
  function widgetIcon(w) { return w.pair ? 'fa-arrow-right-arrow-left' : w.viz === 'summary' ? 'fa-align-left' : metric(w.metric).icon; }
  function widgetSources(w) { if (w.pair) { var p = pair(w.pair); return [metric(p.a).src, metric(p.b).src].filter(function (s, i, a) { return a.indexOf(s) === i; }); } if (w.viz === 'summary') return ['ehs', 'ct']; return [metric(w.metric).src]; }
  function widgetRows(w) { return w.viz === 'kpi' ? 3 : (w.viz === 'summary' ? 3 : (w.viz === 'scatter' || w.viz === 'table' || w.viz === 'pair') ? 6 : 5); }

  /* ── Saved dashboards ──────────────────────────────────────────────────── */
  var seq = 100;
  function W(spec) { spec.id = 'w' + (seq++); spec.w = spec.w || 6; return spec; }
  var dashboards = [
    { id: 'd1', name: 'Plant 4 safety and training', icon: 'fa-industry-windows', owner: 'You', status: 'published', audience: { titles: ['Plant manager', 'EHS coordinator'], people: ['Priya Natarajan'] }, created: '2026-08-14', updated: '2026-10-04', range: '90',
      widgets: [W({ pair: 'trir_x_compliance', viz: 'scatter', w: 6 }), W({ metric: 'trir', viz: 'kpi', w: 3 }), W({ metric: 'overdue', viz: 'kpi', w: 3 }), W({ metric: 'incidents', viz: 'bar', w: 6 }), W({ metric: 'courses', viz: 'bar', w: 6 }), W({ viz: 'summary', w: 12 })] },
    { id: 'd2', name: 'Executive safety snapshot', icon: 'fa-chart-mixed', owner: 'You', status: 'published', audience: { titles: ['VP Operations', 'Regional director'], people: [] }, created: '2026-07-02', updated: '2026-09-30', range: '90',
      widgets: [W({ metric: 'trir', viz: 'kpi', w: 3 }), W({ metric: 'open_ca', viz: 'kpi', w: 3 }), W({ metric: 'compliance', viz: 'kpi', w: 3 }), W({ metric: 'quals', viz: 'kpi', w: 3 }), W({ metric: 'trir', viz: 'bar', w: 6 }), W({ metric: 'compliance', viz: 'bar', w: 6 })] },
    { id: 'd3', name: 'Forklift program', icon: 'fa-forklift', owner: 'Priya Natarajan', status: 'draft', audience: null, created: '2026-09-22', updated: '2026-10-02', range: '90',
      widgets: [W({ metric: 'inc_types', viz: 'donut', w: 6 }), W({ pair: 'nearmiss_x_overdue', viz: 'pair', w: 6 }), W({ metric: 'quals', viz: 'table', w: 12 })] },
    { id: 'd4', name: 'LOTO watch', icon: 'fa-lock', owner: 'You', status: 'draft', audience: null, created: '2026-10-01', updated: '2026-10-05', range: '30',
      widgets: [W({ pair: 'obs_x_overdue', viz: 'pair', w: 8 }), W({ metric: 'observations', viz: 'kpi', w: 4 })] }
  ];
  function dash(id) { for (var i = 0; i < dashboards.length; i++) if (dashboards[i].id === id) return dashboards[i]; return null; }
  var RANGES = { '30': 'Last 30 days', '90': 'Last 90 days', '365': 'Last 12 months', 'ytd': 'Year to date' };
  var TITLES = ['Plant manager', 'EHS coordinator', 'Training administrator', 'Regional director', 'VP Operations', 'Shift supervisor', 'Safety committee'];
  var PEOPLE = ['Priya Natarajan', 'Renee Ortiz', 'Marcus Bell', 'Jordan Ellis', 'Sam Okafor', 'Lena Fischer', 'Tomas Reyes', 'Aisha Whitaker'];

  /* ── State ─────────────────────────────────────────────────────────────── */
  var S = { view: 'home', homeDash: 'd1', homeAsk: false, active: null, mode: 'edit', menu: null, listQ: '', listFilter: 'all', renaming: false, saved: 'just now', ask: {} };
  var ui = {}, dlgKey = 0;

  /* ── Widget card ───────────────────────────────────────────────────────── */
  function cardHtml(w, editable) {
    var menu = S.menu === w.id ? '<div class="dw-menu"><div class="dw-menu-l">Width</div>' + SIZES.map(function (s) { return '<button type="button" data-wsize="' + s[0] + '" data-wid="' + w.id + '">' + s[1] + ((w.w || 6) === s[0] ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : '') + '</button>'; }).join('') + '<div class="dw-menu-d"></div><button type="button" data-wexport="' + w.id + '">Export as CSV</button><button type="button" class="danger" data-wremove="' + w.id + '">Remove widget</button></div>' : '';
    return '<article class="dw-card' + (editable ? ' is-editable' : '') + '" data-wid="' + w.id + '" style="grid-column:span ' + (w.w || 6) + ';grid-row:span ' + widgetRows(w) + '" tabindex="0">' +
      '<div class="dw-head">' + (editable ? '<span class="dw-grip" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span>' : '') + '<span class="dw-ic"><i class="fa-regular ' + widgetIcon(w) + '" aria-hidden="true"></i></span><span class="dw-title">' + esc(widgetTitle(w)) + '</span><span class="dw-srcs">' + widgetSources(w).map(function (s) { return srcChip(s); }).join('') + '</span>' +
      (editable ? '<span class="dw-kebab-wrap"><button type="button" class="dw-kebab" data-wmenu="' + w.id + '" aria-label="Widget options"><i class="fa-regular fa-ellipsis-vertical" aria-hidden="true"></i></button>' + menu + '</span>' : '') + '</div>' +
      '<div class="dw-body">' + widgetBody(w) + '</div></article>';
  }
  function addSlot() { return '<button type="button" class="dw-add" data-act="dash-add-widget"><span class="dw-add-mark"><i class="fa-regular fa-plus" aria-hidden="true"></i></span><span class="dw-add-t">Add widget</span><span class="dw-add-s">Chart a metric from either product, or pair one from each.</span></button>'; }

  /* ── Ask panel (text answers; each can be added as a widget) ──────────── */
  var PROMPTS = [
    { q: 'Which facility has the worst incident rate and lowest compliance?', a: 'Plant 4 – Riverside: TRIR 4.8 (highest) with 74% training compliance (second lowest). Shipping & Receiving carries most of it, with a TRIR of 9.1 and 58% compliance.', spec: { pair: 'trir_x_compliance', viz: 'scatter', w: 6 } },
    { q: 'Where is Lockout/Tagout training overdue?', a: 'Plant 2 – Columbus has 308 employees overdue on Lockout/Tagout, 27% of the site. LOTO-related observations there rose from 9 to 13 in the same 90 days.', spec: { metric: 'courses', viz: 'bar', w: 6, title: 'Overdue by course' } },
    { q: 'Compare near misses to overdue training by facility', a: 'DC East – Allentown and Plant 4 – Riverside lead on near misses (6 and 7) and both sit above the company average for overdue training. DC West – Reno has 2 near misses and 4% overdue.', spec: { pair: 'nearmiss_x_overdue', viz: 'pair', w: 6 } },
    { q: 'How many qualifications expire this month?', a: '63 qualifications expire within 30 days, 15 more than the prior period. Plant 2 – Columbus (14) and Plant 1 – Tulsa (12) have the most; 6 of Plant 4’s are forklift operators involved in recent incidents.', spec: { metric: 'quals', viz: 'kpi', w: 3 } }
  ];
  function askHtml(ctx) {
    var a = S.ask[ctx] || {};
    return '<section class="dw-ask" data-ctx="' + ctx + '"><div class="dw-ask-head"><span class="dw-ask-ic"><i class="fa-regular fa-message-lines" aria-hidden="true"></i></span><div><h3>Ask</h3><p>' + (ctx === 'build' ? 'Ask a question about either product; the answer comes back as text and can be added to this dashboard.' : 'Ask a question about safety or training data. Add an answer to your dashboard as a widget.') + '</p></div></div>' +
      '<div class="dw-ask-body">' + (a.q ? '<div class="dw-msg me">' + esc(a.q) + '</div><div class="dw-msg"><p>' + esc(a.a) + '</p><div class="dw-msg-src">' + srcChip('ehs') + srcChip('ct') + '<span>Sources: Vector EHS incidents, Convergence training records</span></div>' + (a.added ? '<div class="dw-msg-added"><i class="fa-regular fa-circle-check" aria-hidden="true"></i>Added to ' + esc(a.added) + '</div>' : '<vaadin-button theme="secondary small" data-act="dash-ask-add">Add as widget</vaadin-button>') + '</div>'
        : '<div class="dw-try">Try asking</div>' + PROMPTS.map(function (p, i) { return '<button type="button" class="dw-prompt" data-act="dash-ask" data-i="' + i + '">' + esc(p.q) + '</button>'; }).join('')) + '</div>' +
      '<div class="dw-ask-foot"><vaadin-text-field theme="outlined" placeholder="Ask about incidents, training, people or locations" data-askinput="' + ctx + '" clear-button-visible></vaadin-text-field><p>Answers are text only. Charts land on the dashboard, never in the thread.</p></div></section>';
  }

  /* ── HOME: published dashboard container ───────────────────────────────── */
  function renderHome() {
    var host = ui.myDash; if (!host) return;
    var d = dash(S.homeDash) || dashboards[0];
    var mine = dashboards.filter(function (x) { return x.owner === 'You' || x.status === 'published'; });
    host.innerHTML = '<div class="module-head"><div><h2>My dashboards</h2><p class="sub">Dashboards you built or that were published to you. Data from both products, scoped to the location above.</p></div>' +
      '<div class="head-tools"><vaadin-button theme="tertiary small" data-act="dash-ask-toggle"><i class="fa-regular fa-message-lines" aria-hidden="true" style="margin-right:6px"></i>' + (S.homeAsk ? 'Hide Ask' : 'Ask about this data') + '</vaadin-button><vaadin-button theme="secondary small" data-act="dash-list">All dashboards</vaadin-button><vaadin-button theme="primary small" data-act="dash-new">Build a dashboard</vaadin-button></div></div>' +
      '<div class="dw-pub"><div class="dw-pub-bar"><span class="dw-pub-ic"><i class="fa-regular ' + d.icon + '" aria-hidden="true"></i></span><div class="dw-pick"><button type="button" class="dw-pick-btn" data-act="dash-pick" aria-haspopup="listbox" aria-expanded="' + !!S.pickOpen + '">' + esc(d.name) + '<i class="fa-regular fa-chevron-down" aria-hidden="true"></i></button>' +
      (S.pickOpen ? '<div class="dw-pick-menu" role="listbox">' + mine.map(function (x) { return '<button type="button" role="option" data-act="dash-pick-set" data-id="' + x.id + '"' + (x.id === d.id ? ' aria-selected="true"' : '') + '><i class="fa-regular ' + x.icon + '" aria-hidden="true"></i><span>' + esc(x.name) + '</span><em>' + (x.status === 'published' ? 'Published' : 'Draft') + (x.owner === 'You' ? ' · yours' : ' · ' + esc(x.owner)) + '</em></button>'; }).join('') + '</div>' : '') + '</div>' +
      '<span class="dw-owner">' + (d.owner === 'You' ? '<i class="fa-regular fa-user" aria-hidden="true"></i>Your dashboard' : '<i class="fa-regular fa-share-nodes" aria-hidden="true"></i>Published to you by ' + esc(d.owner)) + '</span><span class="dw-range"><i class="fa-regular fa-calendar-range" aria-hidden="true"></i>' + esc(RANGES[d.range]) + '</span>' +
      '<div class="dw-pub-tools"><vaadin-button theme="tertiary small" data-act="dash-export"><i class="fa-regular fa-download" aria-hidden="true" style="margin-right:6px"></i>Export</vaadin-button>' + (d.owner === 'You' ? '<vaadin-button theme="tertiary small" data-act="dash-open" data-id="' + d.id + '"><i class="fa-regular fa-pen" aria-hidden="true" style="margin-right:6px"></i>Edit</vaadin-button>' : '') + '</div></div>' +
      '<div class="dw-pubbody' + (S.homeAsk ? ' has-ask' : '') + '">' + (S.homeAsk ? askHtml('home') : '') + '<div class="dw-grid" data-dash="' + d.id + '">' + d.widgets.map(function (w) { return cardHtml(w, false); }).join('') + '</div></div>' +
      '<div class="dw-pub-foot">' + (d.owner === 'You' ? '<i class="fa-regular fa-pen" aria-hidden="true"></i>You own this. Edit it in Dashboards.' : '<i class="fa-regular fa-lock" aria-hidden="true"></i>Published to you. Build your own copy from Dashboards.') + '</div></div>';
  }

  /* ── LIST view ─────────────────────────────────────────────────────────── */
  function statusBadge(d) { return d.status === 'published' ? '<span class="dw-status pub"><i class="fa-regular fa-bullhorn" aria-hidden="true"></i>Published</span>' : '<span class="dw-status draft"><i class="fa-regular fa-pen-line" aria-hidden="true"></i>Draft</span>'; }
  function dashSources(d) { var s = []; d.widgets.forEach(function (w) { widgetSources(w).forEach(function (x) { if (s.indexOf(x) < 0) s.push(x); }); }); return s; }
  function fmt(iso) { var p = iso.split('-'); return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(p[1]) - 1] + ' ' + Number(p[2]) + ', ' + p[0]; }
  function renderList() {
    var q = S.listQ.toLowerCase();
    var rows = dashboards.filter(function (d) { return (S.listFilter === 'all' || d.status === S.listFilter) && (!q || d.name.toLowerCase().indexOf(q) > -1 || d.owner.toLowerCase().indexOf(q) > -1); });
    var counts = { all: dashboards.length, draft: dashboards.filter(function (d) { return d.status === 'draft'; }).length, published: dashboards.filter(function (d) { return d.status === 'published'; }).length };
    ui.views.innerHTML = '<div class="dw-page"><div class="dw-page-head"><div><h1>Dashboards</h1><p>Dashboards built from Convergence and Vector EHS data. Open one to edit it, or publish it to the roles and people who need it.</p></div><vaadin-button theme="primary" data-act="dash-new"><i class="fa-regular fa-plus" aria-hidden="true" style="margin-right:8px"></i>New dashboard</vaadin-button></div>' +
      '<div class="dw-toolbar"><vaadin-text-field theme="outlined" id="dashSearch" placeholder="Search dashboards" clear-button-visible value="' + esc(S.listQ) + '"><i slot="prefix" class="fa-regular fa-magnifying-glass" aria-hidden="true"></i></vaadin-text-field><div class="dw-seg" role="tablist">' + [['all', 'All'], ['draft', 'Draft'], ['published', 'Published']].map(function (f) { return '<button type="button" role="tab" aria-selected="' + (S.listFilter === f[0]) + '" data-act="dash-filter" data-f="' + f[0] + '">' + f[1] + '<b>' + counts[f[0]] + '</b></button>'; }).join('') + '</div><span class="dw-count">' + rows.length + ' of ' + dashboards.length + ' dashboards</span></div>' +
      '<div class="card dw-tablecard"><table class="dw-list"><thead><tr><th>Dashboard</th><th>Owner</th><th>Sources</th><th class="n">Widgets</th><th>Status</th><th>Published to</th><th>Updated</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (d) { var aud = d.audience ? (d.audience.titles.length + ' job title' + (d.audience.titles.length === 1 ? '' : 's') + (d.audience.people.length ? ', ' + d.audience.people.length + ' people' : '')) : '<span class="muted">Not published</span>'; return '<tr tabindex="0" role="button" data-act="dash-open" data-id="' + d.id + '"><td><span class="dw-name"><span class="dw-ic"><i class="fa-regular ' + d.icon + '" aria-hidden="true"></i></span><span><b>' + esc(d.name) + '</b><small>Created ' + fmt(d.created) + '</small></span></span></td><td>' + esc(d.owner) + '</td><td><span class="dw-srcs">' + dashSources(d).map(function (s) { return srcChip(s, PRODUCT[s].label); }).join('') + '</span></td><td class="n">' + d.widgets.length + '</td><td>' + statusBadge(d) + '</td><td>' + aud + '</td><td>' + fmt(d.updated) + '</td><td><vaadin-button theme="icon small" aria-label="More" data-act="dash-row-menu"><i class="fa-regular fa-ellipsis" aria-hidden="true"></i></vaadin-button></td></tr>'; }).join('')
        : '<tr><td colspan="8" class="dw-empty">No dashboards match. <a href="#" data-act="dash-new">Build one</a>.</td></tr>') + '</tbody></table></div></div>';
  }

  /* ── BUILD view ────────────────────────────────────────────────────────── */
  function renderBuild() {
    var d = dash(S.active); if (!d) { S.view = 'list'; return renderList(); }
    var locked = S.mode !== 'edit', pub = d.status === 'published';
    ui.views.innerHTML = '<div class="dw-build"><div class="dw-build-bar">' +
      '<vaadin-button theme="secondary small" data-act="dash-list"><i class="fa-regular fa-arrow-left" aria-hidden="true" style="margin-right:6px"></i>Dashboards</vaadin-button><span class="dw-ic lg"><i class="fa-regular ' + d.icon + '" aria-hidden="true"></i></span>' +
      (S.renaming ? '<vaadin-text-field theme="outlined" id="dashName" value="' + esc(d.name) + '" style="width:380px" autofocus></vaadin-text-field>' : '<button type="button" class="dw-build-name" data-act="dash-rename" title="Rename"><span>' + esc(d.name) + '</span><i class="fa-regular fa-pen" aria-hidden="true"></i></button>') +
      '<div class="dw-build-tools"><vaadin-select theme="outlined" id="dashRange" aria-label="Date range" style="width:170px"></vaadin-select><span class="dw-saved"><i class="fa-regular fa-cloud-check" aria-hidden="true"></i>Saved · ' + esc(S.saved) + '</span><vaadin-button theme="secondary small" data-act="dash-export"><i class="fa-regular fa-download" aria-hidden="true" style="margin-right:6px"></i>Export</vaadin-button>' +
      (pub ? '<vaadin-button theme="secondary small" data-act="dash-publish"><i class="fa-regular fa-users" aria-hidden="true" style="margin-right:6px"></i>Manage audience</vaadin-button>' : '<vaadin-button theme="primary small" data-act="dash-publish"><i class="fa-regular fa-bullhorn" aria-hidden="true" style="margin-right:6px"></i>Publish</vaadin-button>') + statusBadge(d) +
      '<div class="dw-modes" role="tablist"><button type="button" role="tab" aria-selected="' + !locked + '" data-act="dash-mode" data-m="edit"><i class="fa-regular fa-pen" aria-hidden="true"></i>Edit</button><button type="button" role="tab" aria-selected="' + locked + '" data-act="dash-mode" data-m="preview"><i class="fa-regular fa-eye" aria-hidden="true"></i>Preview</button></div></div></div>' +
      (locked ? '<div class="dw-preview-note"><i class="fa-regular fa-eye" aria-hidden="true"></i>Preview: the dashboard as ' + (d.audience ? d.audience.titles.join(', ') : 'its audience') + ' will see it. Nothing is sent.</div>' : '') +
      '<div class="dw-panes' + (locked ? ' is-locked' : '') + '">' + (locked ? '' : askHtml('build')) + '<div class="dw-canvas"><div class="dw-grid" data-dash="' + d.id + '">' + d.widgets.map(function (w) { return cardHtml(w, !locked); }).join('') + (locked ? '' : addSlot()) + '</div></div></div></div>';
    var sel = $('#dashRange', ui.views); if (sel) { sel.items = Object.keys(RANGES).map(function (k) { return { label: RANGES[k], value: k }; }); sel.value = d.range; sel.addEventListener('value-changed', function (e) { if (e.detail.value) { d.range = e.detail.value; } }); }
    var nf = $('#dashName', ui.views); if (nf) { nf.addEventListener('keydown', function (e) { if (e.key === 'Enter') { d.name = nf.value || d.name; S.renaming = false; touch(d); render(); } if (e.key === 'Escape') { S.renaming = false; render(); } }); nf.addEventListener('blur', function () { d.name = nf.value || d.name; S.renaming = false; touch(d); render(); }); }
  }
  function touch(d) { d.updated = TODAY; S.saved = 'just now'; }

  /* ── Add-widget dialog ─────────────────────────────────────────────────── */
  var B = null;
  function openAdd() {
    B = { metric: null, pair: null, viz: null, q: '' };
    openDialog(ui.addDlg, function (root) {
      root.innerHTML = '<div class="dw-dlg wide"><div class="dw-dlg-head"><span class="dw-dlg-ic"><i class="fa-regular fa-chart-mixed" aria-hidden="true"></i></span><div><h2>Add a widget</h2><p>Pick a metric from either product, or a cross-product pair, then choose how to show it.</p></div><vaadin-button theme="icon" aria-label="Close" data-act="dlg-close"><i class="fa-regular fa-xmark" aria-hidden="true"></i></vaadin-button></div><div class="dw-dlg-body" id="dwAddBody"></div></div>';
      renderAdd(root);
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var act = b.dataset.act;
        if (act === 'dlg-close') ui.addDlg.opened = false;
        if (act === 'pick-metric') { B.metric = b.dataset.id; B.pair = null; B.viz = metric(B.metric).def; renderAdd(root); }
        if (act === 'pick-pair') { B.pair = b.dataset.id; B.metric = null; B.viz = pair(B.pair).def; renderAdd(root); }
        if (act === 'pick-viz') { B.viz = b.dataset.v; renderAdd(root); }
        if (act === 'add-confirm') { var d = dash(S.active), spec = W(B.pair ? { pair: B.pair, viz: B.viz, w: B.viz === 'scatter' || B.viz === 'pair' ? 6 : 12 } : { metric: B.metric, viz: B.viz, w: B.viz === 'kpi' ? 3 : 6 }); d.widgets.push(spec); touch(d); ui.addDlg.opened = false; render(); App.toast('Widget added', widgetTitle(spec) + ' is on the canvas.'); }
      });
      root.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('#dwMetricQ')) { B.q = e.target.value; renderAdd(root, true); } });
    });
  }
  function renderAdd(root, keepFocus) {
    var body = $('#dwAddBody', root), q = B.q.toLowerCase();
    var groups = [['ehs', 'Vector EHS'], ['ct', 'Convergence']];
    var left = '<div class="dw-step"><span class="n">1</span>Pick a metric</div><vaadin-text-field theme="outlined" id="dwMetricQ" placeholder="Find a metric" clear-button-visible value="' + esc(B.q) + '" style="width:100%"><i slot="prefix" class="fa-regular fa-magnifying-glass" aria-hidden="true"></i></vaadin-text-field>' +
      groups.map(function (g) { var ms = METRICS.filter(function (m) { return m.src === g[0] && (!q || m.label.toLowerCase().indexOf(q) > -1 || m.cat.toLowerCase().indexOf(q) > -1); }); if (!ms.length) return ''; return '<div class="dw-cat">' + srcChip(g[0], g[1]) + '</div>' + ms.map(function (m) { return '<button type="button" class="dw-mrow' + (B.metric === m.id ? ' is-on' : '') + '" data-act="pick-metric" data-id="' + m.id + '"><span class="dw-ic"><i class="fa-regular ' + m.icon + '" aria-hidden="true"></i></span><span>' + esc(m.label) + '<small>' + esc(m.cat) + '</small></span></button>'; }).join(''); }).join('') +
      '<div class="dw-cat"><span class="src">Cross-product pairs</span></div>' + PAIRS.filter(function (p) { return !q || p.label.toLowerCase().indexOf(q) > -1; }).map(function (p) { return '<button type="button" class="dw-mrow pair' + (B.pair === p.id ? ' is-on' : '') + '" data-act="pick-pair" data-id="' + p.id + '"><span class="dw-ic"><i class="fa-regular fa-arrow-right-arrow-left" aria-hidden="true"></i></span><span>' + esc(p.label) + '<small>' + esc(p.hint) + '</small></span></button>'; }).join('');
    var picked = B.metric ? metric(B.metric) : B.pair ? pair(B.pair) : null;
    var right = !picked ? '<div class="dw-prev-empty"><i class="fa-regular fa-chart-bar" aria-hidden="true"></i><b>Pick a metric to chart it</b><span>Choose one on the left, then pick how to show it.</span></div>'
      : '<div class="dw-step"><span class="n">2</span>Choose how to show it</div><div class="dw-vizchips">' + picked.viz.map(function (v) { return '<button type="button" class="dw-chip' + (B.viz === v ? ' is-on' : '') + '" data-act="pick-viz" data-v="' + v + '"><i class="fa-regular ' + VIZ[v][1] + '" aria-hidden="true"></i>' + VIZ[v][0] + '</button>'; }).join('') + '</div>' +
        '<div class="dw-step"><span class="n">3</span>Preview</div><div class="dw-grid preview">' + cardHtml({ id: 'prev', metric: B.metric, pair: B.pair, viz: B.viz, w: 12 }, false) + '</div><p class="field-hint">Follows the dashboard’s date range and the location filter on the home page.</p><div class="dw-dlg-foot"><vaadin-button theme="tertiary" data-act="dlg-close">Cancel</vaadin-button><vaadin-button theme="primary" data-act="add-confirm">Add to dashboard</vaadin-button></div>';
    body.innerHTML = '<div class="dw-add-l">' + left + '</div><div class="dw-add-r">' + right + '</div>';
    if (keepFocus) { var f = $('#dwMetricQ', body); if (f) { f.focus(); try { f.inputElement.setSelectionRange(B.q.length, B.q.length); } catch (e) {} } }
  }

  /* ── Publish dialog ────────────────────────────────────────────────────── */
  var P = null;
  function openPublish() {
    var d = dash(S.active); P = { titles: (d.audience ? d.audience.titles.slice() : []), people: (d.audience ? d.audience.people.slice() : []), q: '' };
    openDialog(ui.pubDlg, function (root) {
      function draw() {
        var q = P.q.toLowerCase(), n = P.titles.length + P.people.length;
        root.innerHTML = '<div class="dw-dlg"><div class="dw-dlg-head"><span class="dw-dlg-ic"><i class="fa-regular fa-bullhorn" aria-hidden="true"></i></span><div><h2>' + (d.status === 'published' ? 'Manage audience' : 'Publish') + ': ' + esc(d.name) + '</h2><p>Who sees this live on their home page. Job titles stay current as people change roles; named people are fixed.</p></div><vaadin-button theme="icon" aria-label="Close" data-act="dlg-close"><i class="fa-regular fa-xmark" aria-hidden="true"></i></vaadin-button></div>' +
          '<div class="dw-dlg-body col"><div class="dw-step"><span class="n">1</span>Job titles</div><div class="dw-titles">' + TITLES.map(function (t) { return '<button type="button" class="dw-chip' + (P.titles.indexOf(t) > -1 ? ' is-on' : '') + '" data-act="pub-title" data-t="' + esc(t) + '"><i class="fa-regular ' + (P.titles.indexOf(t) > -1 ? 'fa-square-check' : 'fa-square') + '" aria-hidden="true"></i>' + esc(t) + '</button>'; }).join('') + '</div>' +
          '<div class="dw-step"><span class="n">2</span>Named people</div><vaadin-text-field theme="outlined" id="pubQ" placeholder="Find a person" clear-button-visible value="' + esc(P.q) + '" style="width:320px"><i slot="prefix" class="fa-regular fa-magnifying-glass" aria-hidden="true"></i></vaadin-text-field><div class="dw-people">' + PEOPLE.filter(function (p) { return !q || p.toLowerCase().indexOf(q) > -1; }).map(function (p) { return '<button type="button" class="dw-chip' + (P.people.indexOf(p) > -1 ? ' is-on' : '') + '" data-act="pub-person" data-p="' + esc(p) + '"><i class="fa-regular ' + (P.people.indexOf(p) > -1 ? 'fa-square-check' : 'fa-square') + '" aria-hidden="true"></i>' + esc(p) + '</button>'; }).join('') + '</div>' +
          '<div class="dw-pub-sum"><i class="fa-regular fa-users" aria-hidden="true"></i>' + (n ? '<b>' + n + '</b> ' + (n === 1 ? 'audience entry' : 'audience entries') + '. People without a Convergence role see training widgets as locked.' : 'No audience yet. Pick at least one job title or person.') + '</div></div>' +
          '<div class="dw-dlg-foot">' + (d.status === 'published' ? '<vaadin-button theme="tertiary" data-act="pub-unpublish" style="margin-right:auto">Unpublish</vaadin-button>' : '') + '<vaadin-button theme="tertiary" data-act="dlg-close">Cancel</vaadin-button><vaadin-button theme="primary" data-act="pub-confirm"' + (n ? '' : ' disabled') + '>' + (d.status === 'published' ? 'Save audience' : 'Publish') + '</vaadin-button></div></div>';
      }
      draw();
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var act = b.dataset.act;
        if (act === 'dlg-close') ui.pubDlg.opened = false;
        if (act === 'pub-title') { var t = b.dataset.t, i = P.titles.indexOf(t); if (i > -1) P.titles.splice(i, 1); else P.titles.push(t); draw(); }
        if (act === 'pub-person') { var p = b.dataset.p, j = P.people.indexOf(p); if (j > -1) P.people.splice(j, 1); else P.people.push(p); draw(); }
        if (act === 'pub-confirm') { var was = d.status; d.status = 'published'; d.audience = { titles: P.titles, people: P.people }; touch(d); ui.pubDlg.opened = false; render(); App.toast(was === 'published' ? 'Audience saved' : 'Published', d.name + ' is live for ' + (P.titles.length + P.people.length) + ' audience entries.'); }
        if (act === 'pub-unpublish') { d.status = 'draft'; d.audience = null; touch(d); ui.pubDlg.opened = false; render(); App.toast('Unpublished', d.name + ' is a draft again.', { label: 'Undo', run: function () { d.status = 'published'; d.audience = { titles: P.titles, people: P.people }; render(); } }); }
      });
      root.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('#pubQ')) { P.q = e.target.value; draw(); var f = $('#pubQ', root); if (f) { f.focus(); } } });
    });
  }
  function openDialog(dlg, setup) {
    var key = ++dlgKey;
    dlg.renderer = function (root) { if (root.__k === key) return; root.__k = key; root.innerHTML = ''; setup(root); };
    dlg.opened = true;
  }

  /* ── Render / show ─────────────────────────────────────────────────────── */
  function render() {
    var home = S.view === 'home';
    ui.page.hidden = !home; ui.views.hidden = home;
    $$('.sidenav .nitem').forEach(function (a) { var on = (a.dataset.nav === 'home' && home) || (a.dataset.nav === 'dashboards' && !home); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (home) renderHome(); else if (S.view === 'list') renderList(); else renderBuild();
  }
  function show(view) { S.view = view; S.menu = null; S.pickOpen = false; render(); var m = $('#main'); if (m) m.scrollTop = 0; }
  function open(id, mode) { S.active = id; S.mode = mode || 'edit'; S.renaming = false; show('build'); }
  function newDash() {
    var d = { id: 'd' + (seq++), name: 'Untitled dashboard', icon: 'fa-table-cells-large', owner: 'You', status: 'draft', audience: null, created: TODAY, updated: TODAY, range: '90', widgets: [] };
    dashboards.unshift(d); open(d.id); openAdd();
  }

  /* ── Events ────────────────────────────────────────────────────────────── */
  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (S.menu && !(t.closest && t.closest('.dw-kebab-wrap'))) { S.menu = null; render(); }
      if (S.pickOpen && !(t.closest && t.closest('.dw-pick'))) { S.pickOpen = false; render(); }
      var wm = t.closest && t.closest('[data-wmenu]'); if (wm) { e.stopPropagation(); S.menu = S.menu === wm.dataset.wmenu ? null : wm.dataset.wmenu; render(); return; }
      var ws = t.closest && t.closest('[data-wsize]'); if (ws) { var d = dash(S.active), w = d.widgets.filter(function (x) { return x.id === ws.dataset.wid; })[0]; if (w) { w.w = Number(ws.dataset.wsize); touch(d); } S.menu = null; render(); return; }
      var wr = t.closest && t.closest('[data-wremove]'); if (wr) { var d2 = dash(S.active), idx = d2.widgets.map(function (x) { return x.id; }).indexOf(wr.dataset.wremove), gone = d2.widgets.splice(idx, 1)[0]; touch(d2); S.menu = null; render(); App.toast('Widget removed', widgetTitle(gone), { label: 'Undo', run: function () { d2.widgets.splice(idx, 0, gone); render(); } }); return; }
      var we = t.closest && t.closest('[data-wexport]'); if (we) { S.menu = null; render(); App.toast('Export started', 'A CSV of this widget’s rows is on its way.'); return; }
      var b = t.closest && t.closest('[data-act^="dash-"], [data-act="pub-"]'); if (!b) return;
      if (b.tagName === 'A') e.preventDefault();
      var act = b.dataset.act;
      switch (act) {
        case 'dash-list': show('list'); break;
        case 'dash-new': newDash(); break;
        case 'dash-open': open(b.dataset.id); break;
        case 'dash-row-menu': e.stopPropagation(); App.notYet('Row actions (duplicate, rename, delete)'); break;
        case 'dash-filter': S.listFilter = b.dataset.f; render(); break;
        case 'dash-mode': S.mode = b.dataset.m; S.menu = null; render(); break;
        case 'dash-rename': S.renaming = true; render(); break;
        case 'dash-add-widget': openAdd(); break;
        case 'dash-publish': openPublish(); break;
        case 'dash-export': App.toast('Export started', 'PDF and XLSX of this dashboard, scoped to the current range and location.'); break;
        case 'dash-pick': e.stopPropagation(); S.pickOpen = !S.pickOpen; render(); break;
        case 'dash-pick-set': S.homeDash = b.dataset.id; S.pickOpen = false; render(); break;
        case 'dash-ask-toggle': S.homeAsk = !S.homeAsk; render(); break;
        case 'dash-ask': { var ctx = b.closest('.dw-ask').dataset.ctx, p = PROMPTS[Number(b.dataset.i)]; S.ask[ctx] = { q: p.q, a: p.a, spec: p.spec }; render(); break; }
        case 'dash-ask-add': { var c2 = b.closest('.dw-ask').dataset.ctx, a = S.ask[c2]; var target = c2 === 'build' ? dash(S.active) : dash(S.homeDash); if (target.owner !== 'You') { App.toast('This dashboard was published to you', 'Build your own copy from Dashboards to add widgets.'); break; } var spec = W(Object.assign({}, a.spec)); target.widgets.push(spec); touch(target); a.added = target.name; render(); App.toast('Added as widget', widgetTitle(spec) + ' is on ' + target.name + '.'); break; }
        default: break;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var f = e.target.closest && e.target.closest('[data-askinput]'); if (f && f.value) { var ctx = f.dataset.askinput, q = f.value, hit = PROMPTS.filter(function (p) { return p.q.toLowerCase().indexOf(q.toLowerCase().split(' ')[0]) > -1; })[0] || PROMPTS[0]; S.ask[ctx] = { q: q, a: hit.a, spec: hit.spec }; render(); } }
      if (e.key === 'Escape') { if (S.menu || S.pickOpen) { S.menu = null; S.pickOpen = false; render(); } }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr[data-act="dash-open"]')) { e.preventDefault(); e.target.click(); }
    });
    document.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('#dashSearch')) { S.listQ = e.target.value; var f = e.target; render(); var g = $('#dashSearch'); if (g) { g.focus(); } } });
  }

  /* ── Flow-map states ───────────────────────────────────────────────────── */
  function reset() { S.view = 'home'; S.homeDash = 'd1'; S.homeAsk = false; S.active = null; S.mode = 'edit'; S.menu = null; S.pickOpen = false; S.renaming = false; S.ask = {}; S.listFilter = 'all'; S.listQ = ''; [ui.addDlg, ui.pubDlg].forEach(function (d) { if (d) d.opened = false; }); }
  var pendingState = null, ready = false;
  function applyState(id) {
    if (!ready) { if (KNOWN.indexOf(id) < 0) return false; pendingState = id; return true; }
    switch (id) {
      case 'my-dash': S.homeAsk = true; S.ask.home = { q: PROMPTS[0].q, a: PROMPTS[0].a, spec: PROMPTS[0].spec }; render(); setTimeout(function () { var m = $('#myDash'); if (m) m.scrollIntoView({ block: 'start' }); }, 50); return true;
      case 'dash-list': show('list'); return true;
      case 'build': open('d1'); return true;
      case 'build-preview': open('d1', 'preview'); return true;
      case 'build-ask': open('d4'); S.ask.build = { q: PROMPTS[2].q, a: PROMPTS[2].a, spec: PROMPTS[2].spec }; render(); return true;
      case 'add-widget': open('d4'); openAdd(); return true;
      case 'publish': open('d3'); openPublish(); return true;
      default: return false;
    }
  }
  var KNOWN = ['my-dash', 'dash-list', 'build', 'build-preview', 'build-ask', 'add-widget', 'publish'];
  function init() {
    if (ready) return;
    ui.page = $('#main .page-inner'); ui.views = $('#dashViews'); ui.myDash = $('#myDash'); ui.addDlg = $('#dashAddDlg'); ui.pubDlg = $('#dashPubDlg');
    if (!ui.views) return;
    bind(); ready = true; render();
    if (pendingState) { var p = pendingState; pendingState = null; applyState(p); }
  }
  window.Dash = { show: show, open: open, applyState: applyState, reset: reset, renderHome: renderHome, init: init };
  var whenReady = Promise.all(['vaadin-dialog', 'vaadin-select', 'vaadin-text-field'].map(function (t) { return customElements.whenDefined(t); }));
  var domReady = new Promise(function (res) { if (document.readyState !== 'loading') res(); else document.addEventListener('DOMContentLoaded', res); });
  Promise.all([whenReady, domReady]).then(init);
  domReady.then(function () { setTimeout(init, 9000); });
})();
