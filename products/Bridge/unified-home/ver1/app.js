/* ============================================================================
   Unified Home Dashboard · app.js
   ----------------------------------------------------------------------------
   Vanilla JS. Renders every module from window.SUITE_DATA (data.js) and keeps
   one small state object (scope, date range, role, sync). All screens the
   deliverables ask for are reachable through App.applyState(id), which the
   Design Toolbox flow map and #fm= deep links call.

   App shell (rail, top bar, side nav, location picker) is the V3 app-rail
   shell: markup in index.html, styles in shell.css, behaviour in shell.js.

   Component notes (verified against core v1.22.3 CONTEXT.md):
     vaadin-dialog   content must come from a renderer (slotted markup is
                     ignored in this build), so templates are cloned in
     vaadin-select   items = [{label, value}]
     vwc-stepper     activeStepId + `complete` attribute on steps
   ========================================================================== */
(function () {
  'use strict';

  var D = window.SUITE_DATA;
  var SEV = { high: 0, medium: 1, low: 2 };
  var SEV_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };
  var SEV_ICON = { high: 'fa-circle-exclamation', medium: 'fa-triangle-exclamation', low: 'fa-circle-info' };
  var SIGNAL = { elevated: ['Elevated', 'fa-arrow-trend-up', 'signal-elevated'], watch: ['Watch', 'fa-eye', 'signal-watch'], stable: ['Stable', 'fa-check', 'signal-stable'] };
  /* Primary actions that create something in Convergence (training side) */
  var TRAINING_ACTIONS = { 'assign': 1, 'assign-threshold': 1, 'assign-ca': 1, 'assign-hazcom': 1, 'schedule-eval': 1 };
  var RANGES = [
    { value: '30', label: 'Last 30 days', prior: 'prior 30 days' },
    { value: '90', label: 'Last 90 days', prior: 'prior 90 days' },
    { value: '365', label: 'Last 12 months', prior: 'prior 12 months' },
    { value: 'ytd', label: 'Year to date', prior: 'same period last year' }
  ];

  /* ── State ─────────────────────────────────────────────────────────────── */
  var DEFAULT = { scope: 'all', dept: null, range: '90', role: 'both', sync: 'ok', mineTab: 'all', loading: false, calMonth: '2026-10' };
  var S = {};
  var recStatus = {};      // rec id -> { status: 'assigned'|'sent'|'snoozed'|'dismissed', ... }
  var removedTasks = {};   // task id -> true
  var extraEvents = [];    // calendar events created by the assign flow
  var overrides = {};      // facility id -> { signal }
  var sort = { key: 'trir', dir: 'desc' };
  var wiz = null;          // wizard runtime
  var ready = false, pendingState = null, refreshTimer = null, dialogKey = 0;
  var ui = {};

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(n) { return Number(n).toLocaleString('en-US'); }
  function sum(arr, fn) { return arr.reduce(function (a, x) { return a + fn(x); }, 0); }
  function facilityById(id) { for (var i = 0; i < D.facilities.length; i++) if (D.facilities[i].id === id) return D.facilities[i]; return null; }
  function regionById(id) { for (var i = 0; i < D.regions.length; i++) if (D.regions[i].id === id) return D.regions[i]; return null; }
  function recById(id) { for (var i = 0; i < D.recommendations.length; i++) if (D.recommendations[i].id === id) return D.recommendations[i]; return null; }
  function courseById(id) { for (var i = 0; i < D.courses.length; i++) if (D.courses[i].id === id) return D.courses[i]; return D.courses[0]; }
  function rangeMeta() { for (var i = 0; i < RANGES.length; i++) if (RANGES[i].value === S.range) return RANGES[i]; return RANGES[1]; }
  function parseDate(iso) { var p = iso.split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function isoDate(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function fmtDate(iso, withYear) { var d = parseDate(iso); return MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate() + (withYear ? ', ' + d.getFullYear() : ''); }
  function daysBetween(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 86400000); }
  function addDays(iso, n) { var d = parseDate(iso); d.setDate(d.getDate() + n); return isoDate(d); }

  function scopeInfo() {
    if (S.scope === 'all') return { kind: 'all', label: 'All locations', facilities: D.facilities, path: [D.company.name] };
    var r = regionById(S.scope);
    if (r) return { kind: 'region', region: r, label: r.name, facilities: D.facilities.filter(function (f) { return f.region === r.id; }), path: [D.company.name, r.name] };
    var f = facilityById(S.scope);
    if (f) return { kind: 'facility', facility: f, label: f.name, facilities: [f], path: [D.company.name, regionById(f.region).name, f.name] };
    return { kind: 'all', label: 'All locations', facilities: D.facilities, path: [D.company.name] };
  }
  function inScope(facilityId, info) {
    if (facilityId == null) return true;
    if (info.kind === 'all') return true;
    return info.facilities.some(function (f) { return f.id === facilityId; });
  }
  function srcChip(src, text) { return '<span class="src src-' + src + '">' + esc(text || (src === 'ehs' ? 'EHS' : 'LMS')) + '</span>'; }
  function delta(value, prev, mode, upIsBad) {
    var diff = value - prev, dir = diff > 0 ? 'up' : (diff < 0 ? 'down' : 'flat');
    var text;
    if (mode === 'pct') text = (prev ? Math.round(Math.abs(diff) / prev * 100) : 0) + '%';
    else if (mode === 'pts') text = Math.abs(Math.round(diff * 10) / 10) + ' pts';
    else text = num(Math.abs(Math.round(diff * 10) / 10));
    var cls = dir === 'flat' ? 'flat' : ((dir === 'up') === !!upIsBad ? 'bad' : 'good');
    var icon = dir === 'up' ? 'fa-arrow-up-right' : (dir === 'down' ? 'fa-arrow-down-right' : 'fa-arrow-right');
    var sr = dir === 'flat' ? 'no change' : (dir + ' ' + text + (cls === 'bad' ? ', worse' : ', better'));
    return { cls: cls, icon: icon, text: dir === 'flat' ? 'No change' : text, sr: sr, dir: dir };
  }

  /* ── Toast (vaadin-notification with a renderer) ───────────────────────── */
  function toast(title, sub, action) {
    var n = ui.toast;
    n.renderer = function (root) {
      root.innerHTML = '';
      var wrap = document.createElement('div'); wrap.className = 'toast';
      wrap.innerHTML = '<i class="fa-regular fa-circle-check" aria-hidden="true"></i><div><div class="toast-title"></div><div class="toast-sub"></div></div>';
      $('.toast-title', wrap).textContent = title;
      $('.toast-sub', wrap).textContent = sub || '';
      if (!sub) $('.toast-sub', wrap).remove();
      if (action) {
        var b = document.createElement('vaadin-button'); b.setAttribute('theme', 'tertiary small'); b.textContent = action.label;
        b.addEventListener('click', function () { n.opened = false; action.run(); });
        wrap.appendChild(b);
      }
      root.appendChild(wrap);
    };
    n.opened = false;
    n.opened = true;
  }
  function notYet(what) { toast(what + ' is not part of this prototype', 'It would open the matching page in the product.'); }

  /* ── Dialog helper: fresh clone of a template on every open ───────────── */
  function openDialog(dlg, tplId, setup) {
    var key = ++dialogKey;
    dlg.renderer = function (root) {
      if (root.__key === key) return;
      root.__key = key;
      root.innerHTML = '';
      root.appendChild($(tplId).content.cloneNode(true));
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act="close"]');
        if (b) dlg.opened = false;
      });
      if (setup) setup(root);
    };
    dlg.opened = true;
  }
  function closeDialogs() { [ui.assignDlg, ui.snoozeDlg, ui.ruleDlg, ui.askRecDlg].forEach(function (d) { if (d) d.opened = false; }); if (ui.toast) ui.toast.opened = false; }

  /* ── Header: greeting, sync, scope chip, location picker, range ────────── */
  function renderHeader() {
    var info = scopeInfo();
    var h = new Date().getHours();
    var part = h < 12 ? 'morning' : (h < 17 ? 'afternoon' : 'evening');
    var first = D.user.name.split(' ')[0];
    ui.greeting.textContent = 'Good ' + part + ', ' + first + '. Here is what needs attention' + (S.role === 'ehs' ? ' across your sites.' : ' across safety and training.');

    ui.syncStatus.innerHTML =
      '<span class="sync-item"><span class="sync-dot"></span>EHS synced 4 min ago</span>' +
      (S.role === 'ehs' ? '' : (S.sync === 'error'
        ? '<span class="sync-item is-error"><span class="sync-dot"></span><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>Training sync failed 3 h ago</span>'
        : '<span class="sync-item"><span class="sync-dot"></span>Training synced 2 min ago</span>'));

    /* Location picker (in the side nav, and in any live peek copy of it) */
    var locName = info.kind === 'all' ? 'All locations' : (S.dept || info.label);
    $$('.loc-cur > span:first-child').forEach(function (el) { el.textContent = locName; });
    ui.filterLocText.textContent = info.kind === 'all' ? 'All locations' : info.path.slice(1).join(' › ') + (S.dept ? ' › ' + S.dept : '');
    ui.filterLocClear.hidden = info.kind === 'all';
    renderLocTree();

    ui.roleBanner.hidden = S.role !== 'ehs';
    ui.syncBanner.hidden = !(S.sync === 'error' && S.role !== 'ehs');
    document.body.classList.toggle('role-ehs', S.role === 'ehs');
  }

function renderLocTree() {
  var info = scopeInfo();
  function row(depth, opts) {
    var sel = opts.selected ? ' selected' : '';
    var tgl = opts.children != null
      ? '<button type="button" class="loc-tgl" aria-expanded="' + (opts.expanded ? 'true' : 'false') + '" aria-label="Toggle ' + esc(opts.name) + '"><svg class="ic"><use href="#i-chev-r"/></svg></button>'
      : '<span class="loc-spacer" aria-hidden="true"></span>';
    return '<div class="loc-node' + (opts.expanded ? ' expanded' : '') + '"><div class="loc-row' + sel + '" style="--d:' + depth + '">' + tgl +
      '<button type="button" class="loc-pick" data-scope="' + esc(opts.scope) + '"' + (opts.dept ? ' data-dept="' + esc(opts.dept) + '"' : '') + '><strong>' + esc(opts.name) + '</strong></button>' +
      '<svg class="ic loc-ck"><use href="#i-check"/></svg></div>' +
      (opts.children != null ? '<div class="loc-children"' + (opts.expanded ? '' : ' hidden') + '>' + opts.children + '</div>' : '') + '</div>';
  }
  var regionsHtml = D.regions.map(function (r) {
    var fs = D.facilities.filter(function (f) { return f.region === r.id; });
    var regionActive = info.kind === 'region' ? info.region.id === r.id : (info.kind === 'facility' && info.facility.region === r.id);
    var facs = fs.map(function (f) {
      var active = info.kind === 'facility' && info.facility.id === f.id;
      var depts = f.departments.map(function (d) {
        return row(3, { name: d.name, level: 'Department · ' + num(d.employees) + ' employees', scope: f.id, dept: d.name, selected: active && S.dept === d.name });
      }).join('');
      return row(2, { name: f.name, level: 'Facility · ' + num(f.employees) + ' employees', scope: f.id, selected: active && !S.dept, expanded: active, children: depts });
    }).join('');
    return row(1, { name: r.name, level: 'Region · ' + fs.length + (fs.length === 1 ? ' facility' : ' facilities'), scope: r.id, selected: info.kind === 'region' && info.region.id === r.id, expanded: regionActive || info.kind === 'all', children: facs });
  }).join('');
  ui.locTree.innerHTML = row(0, { name: D.company.name, level: 'Company · ' + num(sum(D.facilities, function (f) { return f.employees; })) + ' employees', scope: 'all', selected: S.scope === 'all', expanded: true, children: regionsHtml });
}

  /* ── Row 1: KPI tiles ──────────────────────────────────────────────────── */
  var KPI_DEFS = [
    { key: 'trir', label: 'Incident rate (TRIR)', icon: 'fa-triangle-exclamation', tone: 'tone-err', src: 'ehs', mode: 'pct', fmt: function (v) { return Number(v).toFixed(1); }, note: function () { return 'Recordable cases per 200,000 hours'; }, report: 'Incident rate report' },
    { key: 'openCA', label: 'Open corrective actions', icon: 'fa-list-check', tone: 'tone-warn', src: 'ehs', mode: 'abs', fmt: function (v) { return num(Math.round(v)); }, note: function (k) { return num(k.overdue) + ' past due'; }, report: 'Corrective actions' },
    { key: 'overdue', label: 'Overdue training', icon: 'fa-graduation-cap', tone: 'tone-blue', src: 'ct', ct: true, mode: 'pts', fmt: function (v) { return Math.round(v) + '<small>%</small>'; }, fmtPlain: function (v) { return Math.round(v) + '%'; }, note: function () { return 'Required courses past their due date'; }, report: 'Training status report' },
    { key: 'quals', label: 'Expiring qualifications', icon: 'fa-id-badge', tone: 'tone-blue', src: 'ct', ct: true, mode: 'abs', fmt: function (v) { return num(Math.round(v)); }, note: function () { return 'Within 30 days, certificates and evaluations'; }, report: 'Expiring qualifications' }
  ];
  function kpiSet(info) {
    if (info.kind === 'all') return D.kpis.all;
    if (info.kind === 'facility') return D.kpis[info.facility.id];
    var fs = info.facilities, emp = sum(fs, function (f) { return f.employees; });
    function agg(key, weighted) {
      var pick = function (f) { return D.kpis[f.id][key]; };
      var value = weighted ? sum(fs, function (f) { return pick(f).value * f.employees; }) / emp : sum(fs, function (f) { return pick(f).value; });
      var prev = weighted ? sum(fs, function (f) { return pick(f).prev * f.employees; }) / emp : sum(fs, function (f) { return pick(f).prev; });
      var spark = [];
      for (var i = 0; i < 12; i++) spark.push(weighted ? sum(fs, function (f) { return pick(f).spark[i] * f.employees; }) / emp : sum(fs, function (f) { return pick(f).spark[i]; }));
      var out = { value: Math.round(value * 10) / 10, prev: Math.round(prev * 10) / 10, spark: spark };
      if (key === 'openCA') out.overdue = sum(fs, function (f) { return f.overdueCA; });
      return out;
    }
    return { trir: agg('trir', true), openCA: agg('openCA', false), overdue: agg('overdue', true), quals: agg('quals', false) };
  }
  function sparkline(vals) {
    var w = 96, h = 36, pad = 5, min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), span = (max - min) || 1;
    var pts = vals.map(function (v, i) { return [pad + i * (w - 2 * pad) / (vals.length - 1), h - pad - (v - min) / span * (h - 2 * pad)]; });
    var line = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var last = pts[pts.length - 1];
    var area = 'M' + pts[0][0].toFixed(1) + ',' + h + ' ' + pts.map(function (p) { return 'L' + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + ' L' + last[0].toFixed(1) + ',' + h + ' Z';
    var cur = pts.slice(-3).map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    return '<svg class="kpi-spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' +
      '<path d="' + area + '" fill="var(--lumo-primary-color)" opacity=".08"/>' +
      '<polyline points="' + line + '" fill="none" stroke="var(--lumo-contrast-40pct)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<polyline points="' + cur + '" fill="none" stroke="var(--lumo-primary-color)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="4" fill="var(--lumo-primary-color)" stroke="#fff" stroke-width="2"/></svg>';
  }
  function renderKpis() {
    var info = scopeInfo(), k = kpiSet(info), prior = rangeMeta().prior;
    if (S.loading) {
      ui.kpis.innerHTML = [1, 2, 3, 4].map(function () { return '<div class="kpi card" aria-busy="true"><div class="skel skel-block short"></div><div class="skel skel-block tall"></div><div class="skel skel-block"></div></div>'; }).join('');
      return;
    }
    var html = KPI_DEFS.filter(function (d) { return !(d.ct && S.role === 'ehs'); }).map(function (d) {
      var v = k[d.key], dl = delta(v.value, v.prev, d.mode, true);
      var err = d.ct && S.sync === 'error';
      var body = err
        ? '<div class="kpi-body"><div class="kpi-val">' + d.fmt(v.value) + '</div></div>' +
          '<div class="kpi-err"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><span>Last good value, 3 h old</span></div>'
        : '<div class="kpi-body"><div class="kpi-val">' + d.fmt(v.value) + '</div>' +
          '<span class="kpi-delta ' + dl.cls + '"><i class="fa-solid ' + dl.icon + '" aria-hidden="true"></i>' + esc(dl.text) + '<span class="sr-only"> ' + esc(dl.sr) + '</span></span>' + sparkline(v.spark) + '</div>' +
          '<div class="kpi-foot"><span>vs. ' + (d.fmtPlain || d.fmt)(v.prev) + ' ' + esc(prior) + '</span><span class="kpi-note">' + esc(d.note(v)) + '</span></div>';
      return '<article class="kpi card' + (err ? ' is-error' : '') + '" role="button" tabindex="0" data-act="open-kpi" data-report="' + esc(d.report) + '" aria-label="' + esc(d.label) + ', open ' + esc(d.report) + '">' +
        '<div class="kpi-head"><i class="fa-regular ' + d.icon + ' kpi-ic ' + d.tone + '" aria-hidden="true"></i><span class="kpi-label">' + esc(d.label) + '</span>' + srcChip(d.src) + '</div>' + body + '</article>';
    }).join('');
    if (S.role === 'ehs') {
      html += '<div class="kpi card is-locked" style="grid-column: span 2"><div class="kpi-lock-title"><i class="fa-regular fa-lock-keyhole" aria-hidden="true"></i>Overdue training and expiring qualifications</div><p>Need a Convergence role.</p></div>';
    }
    ui.kpis.innerHTML = html;
  }

  /* ── Row 2: Recommended actions ────────────────────────────────────────── */
  /* Three short cards per row: severity, where, a one-line attention call and
     a one-line stat. The action row (Pin / Details + the ONE primary CTA)
     appears on hover, focus, or while the card is open. Where the details
     open is the version switch (window.REC_DETAIL_MODE, set in index.html):
       below   V1: hover previews a panel under the row; Pin keeps it open
       panel   V2: click the card, details slide in as a right-hand side panel
       column  V3: click the card, details take a column and the cards shrink */
  var DETAIL_MODE = window.REC_DETAIL_MODE || 'below';
  var expandedRec = null;   // open (pinned / selected) card
  var previewRec = null;    // V1 only: card whose details show on hover
  var CT_ONLY_ACTIONS = { 'view-quals': 1 };
  function visibleRecs() {
    var info = scopeInfo();
    return D.recommendations.filter(function (r) {
      var st = recStatus[r.id];
      if (st && (st.status === 'dismissed' || st.status === 'snoozed')) return false;
      return inScope(r.facility, info);
    }).sort(function (a, b) {
      var sa = recStatus[a.id] && recStatus[a.id].status !== 'open' ? 1 : 0, sb = recStatus[b.id] && recStatus[b.id].status !== 'open' ? 1 : 0;
      return (sa - sb) || (SEV[a.severity] - SEV[b.severity]) || (a.rank - b.rank);
    });
  }
  function trendSvg(ev) {
    var vals = ev.values, n = vals.length, w = 240, h = 64, base = 52, gap = 2, bw = (w - (n - 1) * gap) / n, max = Math.max.apply(null, vals) || 1;
    var bars = vals.map(function (v, i) {
      var bh = Math.max(v ? 3 : 0, v / max * 40), x = i * (bw + gap), y = base - bh;
      var wk = n - i;
      return '<rect class="bar' + (i >= ev.currentFrom ? ' is-current' : '') + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="2"><title>' + (wk === 1 ? 'This week' : wk + ' weeks ago') + ': ' + v + '</title></rect>';
    }).join('');
    return '<svg class="viz" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(ev.title) + '">' + bars +
      '<line class="grid" x1="0" y1="' + (base + 0.5) + '" x2="' + w + '" y2="' + (base + 0.5) + '"/>' +
      '<text x="0" y="62">' + n + ' weeks ago</text><text x="' + w + '" y="62" text-anchor="end">This week</text></svg>';
  }
  function evidenceHtml(ev, rec) {
    var ctBlocked = ev.src === 'ct' && (S.role === 'ehs' || S.sync === 'error');
    if (ctBlocked) {
      var msg = S.role === 'ehs' ? 'Needs a Convergence role. Included when you send the recommendation.' : 'Training data has not synced for 3 hours.';
      return '<div class="ev ev-unavail"><i class="fa-regular ' + (S.role === 'ehs' ? 'fa-lock-keyhole' : 'fa-triangle-exclamation') + '" aria-hidden="true"></i><div><strong style="display:block;color:var(--lumo-body-text-color)">' + esc(ev.title) + '</strong>' + esc(msg) + '</div>' + srcChip('ct', 'Training · Convergence') + '</div>';
    }
    var body = '';
    if (ev.type === 'trend') body = trendSvg(ev);
    else if (ev.type === 'hbars') {
      var max = Math.max.apply(null, ev.items.map(function (it) { return it[1]; }));
      body = '<div class="hbars">' + ev.items.map(function (it) {
        return '<div class="hbar' + (it[2] ? ' is-current' : '') + '" title="' + esc(it[0]) + ': ' + it[1] + '"><span class="hbar-label">' + esc(it[0]) + '</span><span class="hbar-track"><span class="hbar-fill" style="width:' + (it[1] / max * 100).toFixed(0) + '%"></span></span><span class="hbar-val">' + it[1] + '</span></div>';
      }).join('') + '</div>';
    } else if (ev.type === 'meter') {
      body = '<div class="ev-big">' + esc(ev.big) + '<small>' + esc(ev.bigSmall) + '</small></div><div class="meter meter-' + ev.tone + '" role="img" aria-label="' + esc(ev.big + ' ' + ev.bigSmall) + '"><span style="width:' + ev.pct + '%"></span></div><div class="meter-legend"><span>' + esc(ev.left) + '</span><span>' + esc(ev.right) + '</span></div>';
    } else if (ev.type === 'list') {
      body = '<ul class="ev-list">' + ev.items.map(function (it) { return '<li><span>' + esc(it[0]) + '</span><span>' + esc(it[1]) + '</span></li>'; }).join('') + '</ul>';
    }
    return '<div class="ev"><div class="ev-head"><span class="ev-title">' + esc(ev.title) + '</span>' + srcChip(ev.src, ev.src === 'ehs' ? 'EHS' : 'Convergence') + '</div>' + body + '<div class="ev-cap">' + ev.caption + '</div></div>';
  }
  function primaryCta(r) {
    var st = recStatus[r.id];
    if (st && st.status === 'assigned') return '<vaadin-button theme="secondary" data-act="view-assignment">View assignment</vaadin-button>';
    if (st && st.status === 'sent') return '<vaadin-button theme="secondary" data-act="view-handoff">View request</vaadin-button>';
    if (S.role === 'ehs' && TRAINING_ACTIONS[r.primary.action]) return '<vaadin-button theme="primary" data-act="send-admin">Send to Training admin</vaadin-button>';
    return '<vaadin-button theme="primary" data-act="' + r.primary.action + '">' + esc(r.primary.label) + '</vaadin-button>';
  }
  function secondaryActions(r) {
    var st = recStatus[r.id];
    if (st && st.status === 'assigned') return '<vaadin-button theme="tertiary" data-act="open-trend">Open incident trend</vaadin-button>';
    if (st && st.status === 'sent') return '<vaadin-button theme="tertiary" data-act="dismiss">Dismiss</vaadin-button>';
    if (st && st.status === 'flagged') return '<vaadin-button theme="secondary" data-act="unflag-risk">Remove risk flag</vaadin-button><vaadin-button theme="tertiary" data-act="dismiss">Dismiss</vaadin-button>';
    var hideSec = S.role === 'ehs' && (TRAINING_ACTIONS[r.secondary.action] || CT_ONLY_ACTIONS[r.secondary.action]);
    var sec = hideSec ? '<vaadin-button theme="secondary" data-act="snooze">Snooze</vaadin-button>' : '<vaadin-button theme="secondary" data-act="' + r.secondary.action + '">' + esc(r.secondary.label) + '</vaadin-button>';
    return sec + '<vaadin-button theme="tertiary" data-act="dismiss">Dismiss</vaadin-button>';
  }
  function statLine(r) {
    var st = recStatus[r.id];
    if (st && st.status === 'assigned') return '<p class="rec-stat is-status"><i class="fa-regular fa-circle-check" aria-hidden="true"></i>In progress: 0 of ' + st.count + ' complete, due ' + esc(fmtDate(st.due)) + '</p>';
    if (st && st.status === 'sent') return '<p class="rec-stat is-status"><i class="fa-regular fa-paper-plane" aria-hidden="true"></i>Sent to ' + esc(D.trainingAdmin.name) + ' today</p>';
    if (st && st.status === 'flagged') return '<p class="rec-stat is-status is-flag"><i class="fa-regular fa-flag" aria-hidden="true"></i>Flagged as elevated risk</p>';
    return '<p class="rec-stat">' + esc(r.stat) + '</p>';
  }
  function recStatusHtml(r) {
    var st = recStatus[r.id];
    if (!st) return '';
    if (st.status === 'assigned') {
      return '<div class="rec-status"><i class="fa-regular fa-circle-check" aria-hidden="true"></i><div><strong>In progress.</strong> ' + esc(courseById(st.course).label) + ' assigned to ' + st.count + ' employees, due ' + esc(fmtDate(st.due, true)) + '. This card now tracks completion against the incident trend.</div><vaadin-progress-bar value="0" aria-label="0 of ' + st.count + ' complete"></vaadin-progress-bar><span class="rec-status-pct">0 of ' + st.count + ' complete</span></div>';
    }
    if (st.status === 'sent') return '<div class="rec-status"><i class="fa-regular fa-paper-plane" aria-hidden="true"></i><div><strong>Sent to ' + esc(D.trainingAdmin.name) + '</strong> today with the evidence attached. The assignment shows here once it is created in Convergence.</div></div>';
    if (st.status === 'flagged') return '<div class="rec-status" style="background:var(--lumo-error-color-10pct)"><i class="fa-regular fa-flag" aria-hidden="true" style="color:var(--lumo-error-color)"></i><div><strong>Flagged as elevated risk</strong> in Vector EHS. The flag shows in the comparison table and on the location page until you remove it.</div></div>';
    return '';
  }
  function recCardHtml(r) {
    var f = facilityById(r.facility), open = expandedRec === r.id, below = DETAIL_MODE === 'below';
    var more = below
      ? '<button type="button" class="rec-more' + (open ? ' is-pinned' : '') + '" data-act="toggle-details" aria-expanded="' + open + '" aria-controls="rd-' + r.id + '" title="' + (open ? 'Unpin the details' : 'Pin the details open') + '">' + (open ? '<i class="fa-solid fa-thumbtack" aria-hidden="true"></i>Pinned' : '<i class="fa-regular fa-thumbtack" aria-hidden="true"></i>Pin') + '</button>'
      : '<button type="button" class="rec-more' + (open ? ' is-pinned' : '') + '" data-act="toggle-details" aria-expanded="' + open + '" aria-controls="rd-' + r.id + '">' + (open ? 'Close details' : 'Details') + '<i class="fa-regular ' + (open ? 'fa-xmark' : 'fa-chevron-right') + '" aria-hidden="true"></i></button>';
    return '<article class="rec sev-' + r.severity + (open ? ' is-expanded' : '') + '" data-id="' + r.id + '" aria-labelledby="rh-' + r.id + '"' + (below ? '' : ' tabindex="0" role="button" aria-expanded="' + open + '"') + '>' +
      '<div class="rec-top"><span class="sev sev-' + r.severity + '"><i class="fa-solid ' + SEV_ICON[r.severity] + '" aria-hidden="true"></i>' + SEV_LABEL[r.severity] + '</span>' + (r.requested ? '<span class="rec-req" title="' + esc(r.question) + '"><i class="fa-regular fa-message-lines" aria-hidden="true"></i>From your question</span>' : '') + '<span class="rec-loc"><i class="fa-regular fa-location-dot" aria-hidden="true"></i>' + esc(f ? f.name : 'All locations') + '</span></div>' +
      '<h3 class="rec-headline" id="rh-' + r.id + '">' + esc(r.headline) + '</h3>' +
      statLine(r) +
      '<div class="rec-cta">' + more + primaryCta(r) + '</div>' +
    '</article>';
  }
  /* The detail content, chunked: what changed · rule · suggested action · status · why */
  function recDetailChunks(r) {
    var st = recStatus[r.id], f = facilityById(r.facility);
    var rule = r.rule ? '<section class="rd-sec"><div class="rd-label">Rule</div><div class="rec-rule"><i class="fa-regular fa-bolt" aria-hidden="true"></i><div><strong>' + esc(r.rule.name) + '.</strong> When ' + r.rule.count + ' or more near-misses are reported in ' + r.rule.days + ' days in ' + esc(r.rule.scope) + ', retrain everyone assigned there on ' + esc(r.rule.course) + '.</div><button type="button" class="rule-edit" data-act="edit-rule">Edit rule</button></div></section>' : '';
    var suggest = (st && st.status !== 'flagged') ? '' : '<section class="rd-sec rd-suggest"><div class="rd-label"><i class="fa-regular fa-lightbulb" aria-hidden="true"></i>Suggested action</div><p>' + esc(r.suggestion) + '</p></section>';
    var status = recStatusHtml(r);
    return '<div class="rd-head"><div class="rec-flow">' + srcChip(r.from.src, r.from.label) + '<i class="fa-regular fa-arrow-right" aria-hidden="true"></i>' + srcChip(r.to.src, r.to.label) + '</div>' +
      '<h3 class="rd-title">' + esc(r.title) + '</h3>' +
      '<div class="rd-meta"><span class="sev sev-' + r.severity + '"><i class="fa-solid ' + SEV_ICON[r.severity] + '" aria-hidden="true"></i>' + SEV_LABEL[r.severity] + '</span><span><i class="fa-regular fa-location-dot" aria-hidden="true"></i>' + esc(f ? f.name : 'All locations') + '</span><span>Updated ' + esc(r.updated) + '</span></div></div>' +
      '<section class="rd-sec"><div class="rd-label">What changed</div><p class="rd-body">' + esc(r.body) + '</p></section>' +
      rule + suggest + (status ? '<section class="rd-sec">' + status + '</section>' : '') +
      '<section class="rd-sec"><div class="rd-label">Why you are seeing this</div><div class="evidence">' + r.evidence.map(function (ev) { return evidenceHtml(ev, r); }).join('') + '</div></section>';
  }
  function recDetailBelowHtml(r, pinned) {
    return '<div class="rec-detail' + (pinned ? '' : ' is-preview') + '" id="rd-' + r.id + '" data-id="' + r.id + '">' +
      '<div class="rec-detail-main">' + recDetailChunks(r) + '</div>' +
      '<div class="rec-detail-actions">' + primaryCta(r) + secondaryActions(r) + '<button type="button" class="rec-more' + (pinned ? ' is-pinned' : '') + '" data-act="toggle-details" aria-expanded="true"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i>' + (pinned ? 'Unpin' : 'Pin open') + '</button></div>' +
    '</div>';
  }
  function recDetailAsideHtml(r) {
    return '<div class="rd" id="rd-' + r.id + '" data-id="' + r.id + '">' +
      '<button type="button" class="rd-close" data-act="close-detail" aria-label="Close details"><i class="fa-regular fa-xmark" aria-hidden="true"></i></button>' +
      recDetailChunks(r) +
      '<div class="rd-actions">' + primaryCta(r) + secondaryActions(r) + '</div>' +
    '</div>';
  }
  function mountDetail(id, pinned) {
    unmountDetail();
    var cards = $$('.rec', ui.recList), card = cards.filter(function (c) { return c.dataset.id === id; })[0];
    if (!card) return;
    var r = recById(id);
    if (DETAIL_MODE === 'panel') {
      ui.recPanel.innerHTML = recDetailAsideHtml(r); ui.recPanel.hidden = false; ui.recPanel.scrollTop = 0;
    } else if (DETAIL_MODE === 'column') {
      ui.recCol.innerHTML = recDetailAsideHtml(r); ui.recCol.hidden = false; ui.recBody.classList.add('has-col');
    } else {
      var idx = cards.indexOf(card), rowEnd = cards[Math.min(cards.length - 1, Math.floor(idx / 3) * 3 + 2)];
      rowEnd.insertAdjacentHTML('afterend', recDetailBelowHtml(r, pinned));
    }
    card.classList.add(pinned ? 'is-expanded' : 'is-preview');
    if (DETAIL_MODE !== 'below') card.setAttribute('aria-expanded', 'true');
  }
  function unmountDetail() {
    $$('.rec-detail', ui.recList).forEach(function (d) { d.remove(); });
    $$('.rec', ui.recList).forEach(function (c) { c.classList.remove('is-expanded', 'is-preview'); if (c.hasAttribute('aria-expanded')) c.setAttribute('aria-expanded', 'false'); });
    ui.recPanel.hidden = true; ui.recPanel.innerHTML = '';
    ui.recCol.hidden = true; ui.recCol.innerHTML = ''; ui.recBody.classList.remove('has-col');
  }
  var hoverTimer = null, leaveTimer = null;
  function bindRecHover() {
    document.body.classList.add('rec-mode-' + DETAIL_MODE);
    if (DETAIL_MODE !== 'below') {
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && expandedRec) { expandedRec = null; renderRecs(); } });
      return;
    }
    ui.recList.addEventListener('mouseover', function (e) {
      var panel = e.target.closest && e.target.closest('.rec-detail');
      if (panel) { clearTimeout(leaveTimer); return; }
      var card = e.target.closest && e.target.closest('.rec');
      if (!card || !card.dataset.id) return;
      clearTimeout(leaveTimer);
      if (expandedRec || previewRec === card.dataset.id) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(function () { previewRec = card.dataset.id; mountDetail(previewRec, false); }, 160);
    });
    ui.recList.addEventListener('mouseout', function (e) {
      var to = e.relatedTarget;
      if (to && to.closest && (to.closest('.rec-detail') || (to.closest('.rec') && to.closest('.rec').dataset.id === previewRec))) return;
      clearTimeout(hoverTimer);
      if (previewRec && !expandedRec) { clearTimeout(leaveTimer); leaveTimer = setTimeout(function () { previewRec = null; unmountDetail(); }, 260); }
    });
  }
  function renderRecs() {
    var info = scopeInfo();
    if (S.loading) {
      unmountDetail();
      ui.recList.innerHTML = [1, 2, 3].map(function () { return '<div class="rec skel-card" aria-busy="true"><div class="skel skel-block short"></div><div class="skel skel-block" style="width:90%"></div><div class="skel skel-block" style="width:70%"></div><div class="skel skel-block tall" style="width:50%;margin-top:14px"></div></div>'; }).join('');
      ui.recEmpty.hidden = true; ui.recCount.textContent = '…';
      return;
    }
    var recs = visibleRecs();
    if (expandedRec && !recs.some(function (r) { return r.id === expandedRec; })) expandedRec = null;
    var open = recs.filter(function (r) { return !recStatus[r.id]; }).length;
    ui.recCount.textContent = String(open);
    var snoozed = D.recommendations.filter(function (r) { return recStatus[r.id] && recStatus[r.id].status === 'snoozed'; }).length;
    ui.snoozedBtn.textContent = 'Snoozed (' + snoozed + ')';
    previewRec = null;
    unmountDetail();
    ui.recList.innerHTML = recs.map(recCardHtml).join('');
    if (expandedRec) mountDetail(expandedRec, true);
    ui.recEmpty.hidden = recs.length > 0;
    ui.recEmptyText.textContent = (info.kind === 'all' ? 'No open recommendations right now.' : 'No open recommendations for ' + info.label + '.') + ' New ones appear when a rule or trend threshold is crossed.';
  }

  /* ── Row 3: Facility / department comparison ───────────────────────────── */
  function heatTrir(v) { return v >= 6 ? 4 : v >= 4 ? 3 : v >= 3 ? 2 : v >= 2 ? 1 : 0; }
  function heatOverdue(v) { return v >= 35 ? 4 : v >= 25 ? 3 : v >= 15 ? 2 : v >= 8 ? 1 : 0; }
  function renderCompare() {
    var info = scopeInfo();
    var rows, isDept = info.kind === 'facility';
    if (isDept) {
      rows = info.facility.departments.map(function (d) { return Object.assign({ id: null, region: null, isDept: true }, d); });
      ui.cmpTitle.textContent = 'Department comparison';
      ui.cmpSub.textContent = 'Departments at ' + info.facility.name + ' for the ' + rangeMeta().label.toLowerCase() + '. Incident rate next to training compliance.';
    } else {
      rows = info.facilities.map(function (f) { return Object.assign({}, f, overrides[f.id] || {}); });
      ui.cmpTitle.textContent = 'Facility comparison';
      ui.cmpSub.textContent = 'Incident rate next to training compliance for the ' + rangeMeta().label.toLowerCase() + '. Click a facility to drill in.';
    }
    if (S.loading) {
      ui.cmpBody.innerHTML = [1, 2, 3, 4, 5, 6].map(function () { return '<tr aria-busy="true">' + '<td colspan="8"><div class="skel skel-block"></div></td></tr>'; }).join('');
      return;
    }
    var key = sort.key, dir = sort.dir === 'asc' ? 1 : -1;
    rows.sort(function (a, b) { var x = a[key], y = b[key]; if (typeof x === 'string') return x.localeCompare(y) * dir; return (x - y) * dir; });
    ui.cmpBody.innerHTML = rows.map(function (r) {
      var sig = SIGNAL[r.signal] || SIGNAL.stable;
      var trirDelta = r.trirPrev != null ? delta(r.trir, r.trirPrev, 'pct', true) : null;
      var active = (isDept && S.dept === r.name);
      var region = r.region ? regionById(r.region).name : '';
      return '<tr tabindex="0" role="button" data-scope="' + (r.id || '') + '" data-dept="' + (r.isDept ? esc(r.name) : '') + '" class="' + (active ? 'is-active' : '') + '">' +
        '<td><span class="cmp-fac">' + esc(r.name) + (r.isDept ? '' : '<i class="fa-regular fa-chevron-right" aria-hidden="true"></i>') + '</span>' + (region ? '<span class="cmp-sub">' + esc(region) + '</span>' : '') + '</td>' +
        '<td class="num">' + num(r.employees) + '</td>' +
        '<td class="num"><span class="heat heat-' + heatTrir(r.trir) + '">' + r.trir.toFixed(1) + '</span>' + (trirDelta ? '<span class="delta-inline ' + trirDelta.cls + '" title="vs. ' + r.trirPrev.toFixed(1) + ' ' + esc(rangeMeta().prior) + '"><i class="fa-solid ' + trirDelta.icon + '" aria-hidden="true"></i>' + esc(trirDelta.text) + '</span>' : '') + '</td>' +
        '<td class="num">' + r.incidents + (r.recordables != null ? '<span class="cmp-sub">' + r.recordables + ' recordable</span>' : '') + '</td>' +
        '<td class="num">' + r.openCA + (r.overdueCA != null ? '<span class="cmp-sub">' + r.overdueCA + ' past due</span>' : '') + '</td>' +
        '<td class="ct-only"><span class="cmp-meter"><span class="meter' + (r.compliance < 75 ? ' meter-err' : r.compliance < 90 ? ' meter-warn' : '') + '" role="img" aria-label="' + r.compliance + '% compliant"><span style="width:' + r.compliance + '%"></span></span><span class="cmp-meter-val">' + r.compliance + '%</span></span></td>' +
        '<td class="num ct-only"><span class="heat heat-' + heatOverdue(r.overdue) + '">' + r.overdue + '%</span><span class="cmp-sub">' + esc(r.topOverdue) + (r.topOverdueCount ? ' (' + r.topOverdueCount + ')' : '') + '</span></td>' +
        '<td><span class="signal ' + sig[2] + '"><i class="fa-solid ' + sig[1] + '" aria-hidden="true"></i>' + sig[0] + '</span></td>' +
      '</tr>';
    }).join('');
    $$('vwc-sortable-header', ui.cmpTable).forEach(function (h) { h.sortDirection = h.dataset.key === sort.key ? sort.dir : null; });
  }

  /* ── Row 4a: Assigned to me ────────────────────────────────────────────── */
  function dueLabel(iso) {
    var d = daysBetween(D.today, iso);
    if (d < 0) return { cls: 'is-overdue', text: (-d) + (d === -1 ? ' day' : ' days') + ' overdue', icon: 'fa-triangle-exclamation' };
    if (d === 0) return { cls: 'is-overdue', text: 'Due today', icon: 'fa-clock' };
    if (d === 1) return { cls: 'is-soon', text: 'Due tomorrow', icon: 'fa-clock' };
    if (d <= 4) return { cls: 'is-soon', text: 'Due in ' + d + ' days', icon: 'fa-clock' };
    return { cls: '', text: 'Due ' + fmtDate(iso), icon: 'fa-calendar' };
  }
  function visibleTasks() {
    var info = scopeInfo();
    return D.tasks.filter(function (t) {
      if (removedTasks[t.id]) return false;
      if (S.role === 'ehs' && t.src === 'ct') return false;
      if (S.mineTab !== 'all' && t.src !== S.mineTab) return false;
      return inScope(t.facility, info);
    }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
  }
  function renderMine() {
    var all = D.tasks.filter(function (t) { return !removedTasks[t.id] && !(S.role === 'ehs' && t.src === 'ct') && inScope(t.facility, scopeInfo()); });
    ui.mineCount.textContent = String(all.length);
    var tasks = visibleTasks();
    if (!tasks.length) { ui.taskList.innerHTML = '<li class="task-empty">Nothing assigned to you here. Tasks from both products land in this list.</li>'; return; }
    ui.taskList.innerHTML = tasks.map(function (t) {
      var due = dueLabel(t.due);
      return '<li class="task" data-task="' + t.id + '" tabindex="0" role="button">' +
        '<span class="task-ic b-' + t.bucket + '"><i class="fa-regular ' + t.icon + '" aria-hidden="true"></i></span>' +
        '<span class="task-main"><span class="task-title" title="' + esc(t.title) + '">' + esc(t.title) + '</span><span class="task-meta">' + srcChip(t.src, t.kind) + '<span>' + esc(t.ref) + ' · ' + esc(t.where) + '</span></span></span>' +
        '<span class="task-due ' + due.cls + '"><i class="fa-regular ' + due.icon + '" aria-hidden="true"></i>' + esc(due.text) + '</span></li>';
    }).join('');
  }

  /* ── Row 4b: Compliance calendar ───────────────────────────────────────── */
  function allEvents() {
    var evs = D.calendar.concat(extraEvents);
    D.deadlines.forEach(function (dl) { if (dl.iso) evs.push({ date: dl.iso, src: 'ehs', kind: 'osha', bucket: 'err', icon: 'fa-file-shield', title: dl.title, facility: null }); });
    return evs;
  }
  function renderCalendar() {
    var info = scopeInfo();
    var parts = S.calMonth.split('-'), y = Number(parts[0]), m = Number(parts[1]) - 1;
    ui.calMonth.textContent = MONTHS[m] + ' ' + y;
    var first = new Date(y, m, 1), start = new Date(y, m, 1 - first.getDay());
    var byDate = {};
    allEvents().forEach(function (e) {
      if (S.role === 'ehs' && e.src === 'ct') return;
      if (!inScope(e.facility, info)) return;
      (byDate[e.date] = byDate[e.date] || []).push(e);
    });
    var html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (d) { return '<div class="cal-dow" role="columnheader">' + d + '</div>'; }).join('');
    var cells = 42, lastRowEmpty = true;
    var cellHtml = [];
    for (var i = 0; i < cells; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), iso = isoDate(d);
      var other = d.getMonth() !== m, today = iso === D.today, evs = byDate[iso] || [];
      if (i >= 35 && !other) lastRowEmpty = false;
      var evHtml = evs.slice(0, 2).map(function (e) {
        return '<div class="cal-ev b-' + e.bucket + (e.isNew ? ' is-new' : '') + '" title="' + esc(e.title) + '" data-act="cal-event"><i class="fa-regular ' + e.icon + '" aria-hidden="true"></i><span>' + esc(e.title) + '</span></div>';
      }).join('') + (evs.length > 2 ? '<div class="cal-more" data-act="cal-more">+' + (evs.length - 2) + ' more</div>' : '');
      cellHtml.push('<div class="cal-cell' + (other ? ' is-other' : '') + (today ? ' is-today' : '') + '" role="gridcell" aria-label="' + esc(MONTHS[d.getMonth()] + ' ' + d.getDate()) + '"><span class="cal-day">' + d.getDate() + '</span>' + evHtml + '</div>');
    }
    if (lastRowEmpty) cellHtml = cellHtml.slice(0, 35);
    ui.calGrid.innerHTML = html + cellHtml.join('');
    ui.calDeadlines.innerHTML = D.deadlines.map(function (dl) { return '<li><span>' + esc(dl.title) + '</span><span>' + esc(dl.date) + '</span></li>'; }).join('');
  }

  /* ── Row 5: OSHA audit readiness ───────────────────────────────────────── */
  function renderAudit() {
    var info = scopeInfo();
    var a = info.kind === 'facility' && D.audit[info.facility.id] ? D.audit[info.facility.id] : D.audit.all;
    var items = a.items.map(function (it) { return Object.assign({}, it); });
    if (S.role === 'ehs') items.forEach(function (it) { if (it.src === 'ct') { it.state = 'locked'; it.sub = 'Held in Convergence. Ask ' + D.trainingAdmin.name + ' to add these records to the packet.'; it.action = 'Request records'; } });
    var scopeNote = info.kind === 'region' ? ' Showing the company packet; the region packet is built per establishment.' : '';
    ui.auditSub.textContent = 'Injury logs from Vector EHS and the related training records from Convergence, checked together so an inspector gets one packet.' + scopeNote;
    var gaps = items.filter(function (it) { return it.state === 'warn'; }).length;
    var locked = items.filter(function (it) { return it.state === 'locked'; }).length;
    var score = S.role === 'ehs' ? a.score - 4 : a.score;
    ui.auditChipScore.textContent = score + '%';
    ui.auditBody.innerHTML =
      '<div class="audit-score"><div class="score">' + score + '<small>%</small></div><div class="score-label">' + (S.role === 'ehs' ? 'EHS records ready. Training records are held by your Training administrator.' : (gaps ? gaps + ' items need attention before an inspector asks.' : 'Everything an inspector asks for is in one packet.')) + '</div>' +
        '<div class="audit-btns"><vaadin-button theme="primary" data-act="open-audit">Open audit view</vaadin-button><vaadin-button theme="secondary" data-act="export-audit"><i class="fa-regular fa-file-export" aria-hidden="true" style="margin-right:8px"></i>Export packet (PDF, XLSX)</vaadin-button></div></div>' +
      '<ul class="audit-list">' + items.map(function (it) {
        var ic = it.state === 'ok' ? ['ai-ok', 'fa-check'] : it.state === 'warn' ? ['ai-warn', 'fa-exclamation'] : ['ai-locked', 'fa-lock-keyhole'];
        return '<li class="audit-item"><span class="ai-ic ' + ic[0] + '"><i class="fa-solid ' + ic[1] + '" aria-hidden="true"></i></span><span><span class="ai-title">' + esc(it.title) + '</span><span class="ai-sub">' + esc(it.sub) + '</span></span>' + srcChip(it.src, it.src === 'ehs' ? 'Vector EHS' : 'Convergence') + '<span class="ai-action"><a href="#" data-act="audit-item">' + esc(it.action) + '</a></span></li>';
      }).join('') + '</ul>';
  }

  function renderAll() {
    renderHeader(); renderKpis(); renderRecs(); renderCompare(); renderMine(); renderCalendar(); renderAudit();
    if (window.Builder) { Builder.renderCustom(); Builder.applyLayout(); }
    ui.main.classList.toggle('is-loading', !!S.loading);
  }

  /* ── Scope / role / sync setters (with a short refresh state) ──────────── */
  function refresh(fn) {
    ui.main.classList.add('is-refreshing');
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { fn(); ui.main.classList.remove('is-refreshing'); }, 420);
  }
  function setScope(id, dept) {
    S.scope = id; S.dept = dept || null;
    if (window.Shell) Shell.setLoc(false);
    refresh(renderAll);
  }
  function setRole(role) { S.role = role; renderAll(); }
  function setSync(v) { S.sync = v; renderAll(); }

  /* ── Review & assign wizard ────────────────────────────────────────────── */
  function makeEmployees(n, dept, seed) {
    var out = [], base = D.employees;
    for (var i = 0; i < n; i++) {
      var a = base[(i * 7 + seed) % base.length], b = base[(i * 11 + seed * 3) % base.length];
      out.push({ id: 'x' + seed + '-' + (i + 1), name: a.name.split(' ')[0] + ' ' + b.name.split(' ')[1], dept: dept, lastCompleted: base[(i + seed) % base.length].lastCompleted, incident: null, selected: true });
    }
    return out;
  }
  function presetFor(rec) {
    switch (rec.id) {
      case 'r2': return { course: 'wws', due: addDays(D.today, 14), employees: makeEmployees(18, 'Line B', 2), facility: 'dceast', ehsLine: '3 slips reported on Line B in the last 30 days',
        intro: 'These <strong>18 employees</strong> are assigned to Line B at DC East – Allentown, where the near-miss rule was triggered. Remove anyone who should not be included, or add others.',
        sub: 'DC East – Allentown · Triggered by the Near-miss cluster rule',
        note: 'Three slips were reported on Line B in the last 30 days, all near the wrap station. Nobody was hurt, and we want to keep it that way. Everyone assigned to Line B is being asked to complete Walking-Working Surfaces (about 30 minutes) by the due date. Report wet floors right away; the floor scrubber schedule has been changed too.' };
      case 'r4': return { course: 'lifting', due: '2026-10-10', employees: [{ id: 'mb', name: 'Marcus Bell', dept: 'Shipping & Receiving', lastCompleted: 'Never', incident: 'INC-4471', selected: true }], facility: 'plant1', ehsLine: 'Corrective action CA-2291 from incident INC-4471',
        intro: 'This assignment comes from corrective action <strong>CA-2291</strong>. Completing the course closes the action automatically.',
        sub: 'Plant 1 – Tulsa · From corrective action CA-2291',
        note: 'Following the incident on Sep 18, the investigation recommended a refresher on safe lifting. This 35-minute course covers the techniques and the lifting aids available in Shipping and Receiving. Please complete it by Oct 10; your supervisor will walk through the practical part with you afterward.' };
      case 'r6': return { course: 'hazcom', due: addDays(D.today, 28), employees: makeEmployees(112, 'Assembly, Lines 1 and 2', 6), facility: 'plant7', ehsLine: '3 new chemicals added to the Plant 7 SDS library on Sep 8',
        intro: 'These <strong>112 employees</strong> work in Plant 7 areas that store or use the adhesives added to the SDS library this month.',
        sub: 'Plant 7 – Greenville · New chemicals in the SDS library',
        note: 'Plant 7 started using new adhesives and a solvent cleaner this month. This short update module (about 15 minutes) covers the hazards, the labels, and where to find the safety data sheets. Please complete it by the due date.' };
      default: return { course: 'forklift', due: addDays(D.today, 30), employees: D.employees.map(function (e) { return Object.assign({}, e); }), facility: 'plant4', ehsLine: '11 forklift-related incidents at Plant 4 since June',
        intro: 'These <strong>42 employees</strong> at Plant 4 – Riverside operate powered industrial trucks and have not completed Forklift Safety Refresher in the last 12 months. Remove anyone who should not be included, or add others.',
        sub: 'Plant 4 – Riverside · Suggested because forklift / PIT incidents are up 38%',
        note: D.learnerNote };
    }
  }
  function openAssign(rec, step) {
    var p = presetFor(rec);
    wiz = { rec: rec, step: step || 1, maxStep: step || 1, employees: p.employees, course: p.course, due: p.due, type: 'required', note: p.note, preset: p,
      notifySup: true, link: true, handsOn: false, email: true, include: true, deptFilter: 'all', newCount: 0 };
    openDialog(ui.assignDlg, '#tplAssign', function (root) { wiz.root = root; bindWizard(root); renderWizard(); });
  }
  function selCount() { return wiz.employees.filter(function (e) { return e.selected; }).length; }
  function wizFacilityName() { var f = facilityById(wiz.preset.facility); return f ? f.name : ''; }
  function bindWizard(root) {
    var course = $('#wizCourse', root), type = $('#wizType', root), due = $('#wizDue', root), note = $('#wizNote', root), dept = $('#wizDeptFilter', root);
    course.items = D.courses.map(function (c) { return { label: c.label + ' (' + c.duration + ')', value: c.id }; }); course.value = wiz.course;
    type.items = [{ label: 'Required', value: 'required' }, { label: 'Recommended', value: 'recommended' }]; type.value = wiz.type;
    due.value = wiz.due; note.value = wiz.note;
    var depts = []; wiz.employees.forEach(function (e) { if (depts.indexOf(e.dept) < 0) depts.push(e.dept); });
    dept.items = [{ label: 'All departments', value: 'all' }].concat(depts.map(function (d) { return { label: d, value: d }; })); dept.value = 'all';
    $('#wizEyebrow', root).innerHTML = srcChip(wiz.rec.from.src, 'From ' + wiz.rec.from.label) + '<i class="fa-regular fa-arrow-right" aria-hidden="true"></i>' + srcChip(wiz.rec.to.src, 'To ' + wiz.rec.to.label);
    $('#wizTitle', root).textContent = 'Review & assign: ' + courseById(wiz.course).label;
    $('#wizSub', root).textContent = wiz.preset.sub;
    $('#wizIntro', root).innerHTML = wiz.preset.intro;

    course.addEventListener('value-changed', function (e) { if (e.detail.value && e.detail.value !== wiz.course) { wiz.course = e.detail.value; $('#wizTitle', root).textContent = 'Review & assign: ' + courseById(wiz.course).label; renderWizard(); } });
    type.addEventListener('value-changed', function (e) { wiz.type = e.detail.value; renderWizard(); });
    due.addEventListener('value-changed', function (e) { if (e.detail.value) { wiz.due = e.detail.value; renderWizard(); } });
    note.addEventListener('value-changed', function (e) { wiz.note = e.detail.value; renderPreview(root); renderSummary(root); });
    dept.addEventListener('value-changed', function (e) { wiz.deptFilter = e.detail.value; renderEmpTable(root); });
    [['wizNotifySup', 'notifySup'], ['wizLink', 'link'], ['wizHandsOn', 'handsOn'], ['wizEmail', 'email'], ['wizInclude', 'include']].forEach(function (pair) {
      var sw = $('#' + pair[0], root);
      sw.checked = wiz[pair[1]];
      sw.addEventListener('checked-change', function (e) { wiz[pair[1]] = !!e.detail; if (pair[1] === 'include') renderPreview(root); });
    });
    $('#wizAll', root).addEventListener('checked-changed', function (e) {
      if (wiz.suppress) return;
      wiz.employees.forEach(function (emp) { emp.selected = !!e.detail.value; }); renderEmpTable(root); renderSummary(root);
    });
    var add = $('#wizAddEmp', root);
    add.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || !add.value.trim()) return;
      wiz.newCount++;
      wiz.employees.unshift({ id: 'new' + wiz.newCount, name: add.value.trim(), dept: 'Added manually', lastCompleted: 'Unknown', incident: null, selected: true, added: true });
      add.value = ''; renderEmpTable(root); renderSummary(root);
      toast('Added ' + wiz.employees[0].name + ' to the assignment');
    });
    root.addEventListener('checked-changed', function (e) {
      var cb = e.target.closest && e.target.closest('vaadin-checkbox[data-emp]');
      if (!cb) return;
      wiz.employees.forEach(function (emp) { if (emp.id === cb.dataset.emp) emp.selected = !!e.detail.value; });
      renderEmpTable(root, true); renderSummary(root);
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'next') { if (wiz.step < 4) { wiz.step++; wiz.maxStep = Math.max(wiz.maxStep, wiz.step); renderWizard(); } else finishAssign(); }
      else if (act === 'back') { if (wiz.step > 1) { wiz.step--; renderWizard(); } }
      else if (act === 'goto') { wiz.step = Number(b.dataset.step); renderWizard(); }
      else if (act === 'remove' || act === 'restore') { wiz.employees.forEach(function (emp) { if (emp.id === b.dataset.emp) emp.selected = act === 'restore'; }); renderEmpTable(root, true); renderSummary(root); }
    });
    var stepper = $('#wizStepper', root);
    stepper.addEventListener('active-step-change', function (e) {
      var id = (e.detail && (e.detail.activeStepId || e.detail.id || e.detail.stepId)) || (typeof e.detail === 'string' ? e.detail : null);
      var n = id ? Number(String(id).replace('ws', '')) : NaN;
      if (!n || n === wiz.step) return;
      if (n > wiz.maxStep) { e.preventDefault(); return; }
      wiz.step = n; setTimeout(function () { renderWizard(); }, 0);
    });
  }
  function renderEmpTable(root, keepScroll) {
    var wrap = $('.emp-wrap', root), top = keepScroll ? wrap.scrollTop : 0;
    var rows = wiz.employees.filter(function (e) { return wiz.deptFilter === 'all' || e.dept === wiz.deptFilter; });
    $('#wizEmpBody', root).innerHTML = rows.map(function (e) {
      return '<tr class="' + (e.selected ? '' : 'is-removed') + '">' +
        '<td><vaadin-checkbox data-emp="' + e.id + '" aria-label="Include ' + esc(e.name) + '"' + (e.selected ? ' checked' : '') + '></vaadin-checkbox></td>' +
        '<td><span class="emp-name">' + esc(e.name) + '</span><span class="cmp-sub">' + (e.added ? 'Added by you' : 'ID ' + esc(e.id.toUpperCase())) + '</span></td>' +
        '<td>' + esc(e.dept) + '</td>' +
        '<td class="' + (e.lastCompleted === 'Never' ? 'emp-never' : '') + '">' + esc(e.lastCompleted) + '</td>' +
        '<td>' + (e.incident ? '<span class="emp-flag"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' + esc(e.incident) + '</span>' : '<span style="color:var(--lumo-tertiary-text-color)">None</span>') + '</td>' +
        '<td><vaadin-button theme="tertiary small" data-act="' + (e.selected ? 'remove' : 'restore') + '" data-emp="' + e.id + '">' + (e.selected ? 'Remove' : 'Add back') + '</vaadin-button></td></tr>';
    }).join('');
    var all = $('#wizAll', root), sel = selCount();
    wiz.suppress = true; all.checked = sel === wiz.employees.length; all.indeterminate = sel > 0 && sel < wiz.employees.length; wiz.suppress = false;
    $('#wizSelCount', root).textContent = String(sel);
    $('#wizIncCount', root).textContent = String(wiz.employees.filter(function (e) { return e.selected && e.incident; }).length);
    wrap.scrollTop = top;
  }
  function renderPreview(root) {
    var c = courseById(wiz.course);
    var f = facilityById(wiz.preset.facility);
    $('#wizPreview', root).innerHTML =
      '<div class="lp-bar"><img src="../../../../assets/vector-solutions-logo.svg" alt=""> My training plan · as seen by a learner at ' + esc(f ? f.name : '') + '</div>' +
      '<div class="lp-body"><div class="lp-card"><div class="lp-kicker"><span class="lp-req">' + (wiz.type === 'required' ? 'Required' : 'Recommended') + '</span> New assignment · Due ' + esc(fmtDate(wiz.due, true)) + '</div>' +
      '<h4>' + esc(c.label) + '</h4><div class="lp-meta">' + esc(c.duration) + ' · ' + esc(c.format) + '</div>' +
      '<div class="lp-why"><strong><i class="fa-regular fa-circle-info" aria-hidden="true"></i>Why you are being assigned this</strong><p></p>' + (wiz.include ? '<div class="lp-from"><i class="fa-regular fa-helmet-safety" aria-hidden="true"></i> From Vector EHS: ' + esc(wiz.preset.ehsLine) + '.</div>' : '') + '</div>' +
      '<div class="lp-from">Assigned by ' + esc(D.user.name) + ', ' + esc(D.user.role) + '</div>' +
      '<div class="lp-btn"><vaadin-button theme="primary small">Start course</vaadin-button></div></div></div>';
    $('.lp-why p', root).textContent = wiz.note || 'Your note appears here.';
  }
  function renderSummary(root) {
    var c = courseById(wiz.course);
    $('#wizSummary', root).innerHTML = '<strong>' + selCount() + ' employees</strong><span class="dot"></span>' + esc(c.label) + '<span class="dot"></span>Due ' + esc(fmtDate(wiz.due, true)) + '<span class="dot"></span>' + (wiz.type === 'required' ? 'Required' : 'Recommended');
    var next = $('#wizNextBtn', root);
    next.textContent = ['Next: Course and due date', 'Next: Message to learners', 'Next: Review and confirm', 'Assign to ' + selCount() + ' employees'][wiz.step - 1];
    next.disabled = wiz.step === 1 && selCount() === 0;
  }
  function renderWizard() {
    var root = wiz.root, c = courseById(wiz.course);
    $$('.wiz-panel', root).forEach(function (p) { p.hidden = Number(p.dataset.step) !== wiz.step; });
    var stepper = $('#wizStepper', root);
    $$('vwc-stepper-step', stepper).forEach(function (s, i) { s.toggleAttribute('complete', i + 1 < wiz.step); });
    stepper.activeStepId = 'ws' + wiz.step;
    $('#wizBack', root).hidden = wiz.step === 1;
    if (wiz.step === 1) renderEmpTable(root);
    if (wiz.step === 2) {
      $('#wizDueHint', root).textContent = daysBetween(D.today, wiz.due) + ' days from today. Learners are reminded 7 days and 1 day before.';
      $('#wizCourseCard', root).innerHTML = '<h4><i class="fa-regular fa-graduation-cap" aria-hidden="true" style="color:var(--lumo-primary-color)"></i>' + esc(c.label) + '</h4><dl><dt>Duration</dt><dd>' + esc(c.duration) + '</dd><dt>Format</dt><dd>' + esc(c.format) + '</dd><dt>Version</dt><dd>' + esc(c.version) + ', revised ' + esc(c.revised) + '</dd><dt>Passing score</dt><dd>' + esc(c.passing) + '</dd></dl><ul style="margin-top:10px"><li>Counts toward the Powered Industrial Truck Operator qualification.</li><li>Completions sync to Vector EHS within an hour when tracking is on.</li></ul>';
    }
    if (wiz.step === 3) renderPreview(root);
    if (wiz.step === 4) {
      var f = wizFacilityName();
      $('#wizConfirm', root).innerHTML = [
        ['Employees', selCount() + ' at ' + f + (wiz.employees.filter(function (e) { return e.selected && e.incident; }).length ? ' · ' + wiz.employees.filter(function (e) { return e.selected && e.incident; }).length + ' involved in a recent incident' : ''), 1],
        ['Course', c.label + ' · ' + c.version + ' · ' + c.duration, 2],
        ['Due date', fmtDate(wiz.due, true) + ' · ' + (wiz.type === 'required' ? 'Required' : 'Recommended') + (wiz.handsOn ? ' · hands-on sign-off required' : ''), 2],
        ['Notifications', 'Learners in Convergence' + (wiz.email ? ' and by email' : '') + (wiz.notifySup ? ' · supervisors get a summary' : ''), 2],
        ['Message', (wiz.note.length > 110 ? wiz.note.slice(0, 110) + '…' : wiz.note) || 'No note', 3],
        ['Safety link', wiz.link ? 'Completions are recorded on the related records in Vector EHS' : 'Not linked to EHS records', 2]
      ].map(function (row) { return '<li><span class="cl-label">' + esc(row[0]) + '</span><span class="cl-val">' + esc(row[1]) + '</span><button type="button" class="cl-edit" data-act="goto" data-step="' + row[2] + '">Edit</button></li>'; }).join('');
      $('#wizNextList', root).innerHTML = [
        'Assignments are created in Convergence now and appear in each learner’s training plan today.',
        'This recommendation moves to In progress and tracks completion against the ' + f + ' trend.',
        wiz.link ? 'The assignment is noted on the related records in Vector EHS, with a link back here.' : 'Nothing is written to Vector EHS.',
        'The due date lands on the shared compliance calendar.'
      ].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    }
    renderSummary(root);
    $('.wiz-body', root).scrollTop = 0;
  }
  function finishAssign(silent) {
    var rec = wiz.rec, count = selCount(), c = courseById(wiz.course), f = facilityById(wiz.preset.facility);
    recStatus[rec.id] = { status: 'assigned', count: count, due: wiz.due, course: wiz.course };
    D.tasks.forEach(function (t) { if (t.linkedRec === rec.id) removedTasks[t.id] = true; });
    extraEvents = extraEvents.filter(function (e) { return e.rec !== rec.id; });
    extraEvents.push({ date: wiz.due, src: 'ct', kind: 'training', bucket: 'blue', icon: 'fa-graduation-cap', title: c.label + ' due · ' + count + ' learners, ' + (f ? f.name.split(' – ')[0] : ''), facility: wiz.preset.facility, isNew: true, rec: rec.id });
    ui.assignDlg.opened = false;
    renderAll();
    if (!silent) toast('Assigned ' + c.label + ' to ' + count + ' employees', 'Due ' + fmtDate(wiz.due, true) + '. Learners are being notified now.', { label: 'View assignment', run: function () { notYet('The assignment page'); } });
  }

  /* ── Ask for a recommendation ──────────────────────────────────────────
     Ported from the Readiness Hub's Agency Intelligence thread (respondTo /
     send in hub-agency-intel.js): the question is a user bubble, a 620ms beat
     shows "thinking" dots, the answer is a headline + body in bold markup with
     action buttons, and an epoch guard drops a stale answer. Keystone's
     "Discover actionable opportunities" supplies the shape of the answer:
     the metric moving the wrong way, where it concentrates, one action. */
  var TOPICS = [
    { key: 'forklift', words: ['forklift', 'pit', 'powered industrial', 'truck'], course: 'Forklift Safety Refresher', type: 'Forklift / PIT', ehs: 'Incidents', action: 'assign' },
    { key: 'loto', words: ['loto', 'lockout', 'tagout', 'energy'], course: 'Lockout/Tagout', type: 'LOTO', ehs: 'Observations', action: 'schedule-inspection' },
    { key: 'slips', words: ['slip', 'trip', 'fall', 'wet floor', 'near miss', 'near-miss'], course: 'Walking-Working Surfaces', type: 'Slips and trips', ehs: 'Near-misses', action: 'assign' },
    { key: 'hazcom', words: ['chemical', 'sds', 'hazcom', 'hazard comm', 'adhesive', 'solvent'], course: 'Hazard Communication', type: 'Chemical exposure', ehs: 'Chemicals', action: 'assign' },
    { key: 'ergo', words: ['lift', 'ergonomic', 'strain', 'back', 'sprain'], course: 'Safe Lifting & Ergonomics', type: 'Ergonomic strain', ehs: 'Incidents', action: 'assign' }
  ];
  var FAC_WORDS = { plant4: ['plant 4', 'riverside'], plant2: ['plant 2', 'columbus'], dceast: ['dc east', 'allentown'], plant1: ['plant 1', 'tulsa'], plant7: ['plant 7', 'greenville'], dcwest: ['dc west', 'reno'] };
  var askSeq = 0, askEpoch = 0;
  function composeRecommendation(text, facilityId) {
    var t = text.toLowerCase();
    if (!facilityId || facilityId === 'auto') { facilityId = null; Object.keys(FAC_WORDS).forEach(function (id) { FAC_WORDS[id].forEach(function (w) { if (t.indexOf(w) > -1) facilityId = id; }); }); }
    var f = facilityById(facilityId) || D.facilities.slice().sort(function (a, b) { return b.trir - a.trir; })[0];
    var topic = TOPICS.filter(function (tp) { return tp.words.some(function (w) { return t.indexOf(w) > -1; }); })[0] || { key: 'general', course: f.topOverdue, type: 'Recordable incidents', ehs: 'Incidents', action: 'assign' };
    var sev = f.signal === 'elevated' ? 'high' : f.signal === 'watch' ? 'medium' : 'low';
    var overdueCount = Math.max(6, Math.round(f.employees * f.overdue / 100 * 0.35));
    var dept = f.departments.slice().sort(function (a, b) { return b.trir - a.trir; })[0];
    var inspection = topic.action === 'schedule-inspection';
    var suggestion = inspection ? 'Schedule a ' + topic.type + ' inspection in ' + dept.name + ' and assign ' + topic.course + ' to the ' + overdueCount + ' employees who are overdue.' : 'Assign ' + topic.course + ' to the ' + overdueCount + ' employees at ' + f.name + ' who are overdue, starting with ' + dept.name + '.';
    return {
      id: 'rq' + (++askSeq), rank: 0, severity: sev, pattern: 'requested', facility: f.id, requested: true,
      from: { src: 'ehs', label: topic.ehs + ' · Vector EHS' }, to: inspection ? { src: 'ehs', label: 'Inspections · Vector EHS' } : { src: 'ct', label: 'Training · Convergence' },
      updated: 'just now', question: text,
      headline: (inspection ? topic.type + ' observations' : topic.type + ' risk') + ' at ' + f.name,
      stat: inspection ? f.overdue + '% overdue on ' + topic.course + ', ' + f.nearMisses + ' near misses in 90 days' : overdueCount + ' employees overdue on ' + topic.course + ', TRIR ' + f.trir,
      title: 'What you described at ' + f.name + ' lines up with ' + (f.signal === 'elevated' ? 'an elevated' : f.signal === 'watch' ? 'a rising' : 'a stable') + ' incident picture and a ' + topic.course + ' gap',
      body: f.name + ' has ' + f.incidents + ' incidents and ' + f.nearMisses + ' near misses in the last 90 days (TRIR ' + f.trir + ', ' + (f.trir > f.trirPrev ? 'up' : 'down') + ' from ' + f.trirPrev + '). ' + dept.name + ' carries most of it (TRIR ' + dept.trir + ', ' + dept.compliance + '% compliance). Training compliance at the site is ' + f.compliance + '% with ' + f.overdue + '% overdue, mostly ' + f.topOverdue + '.',
      /* the chat answer, Keystone-style bold markup */
      reply: 'At **' + f.name + '**, ' + topic.type.toLowerCase() + ' lines up with the data: **' + f.incidents + ' incidents** and **' + f.nearMisses + ' near misses** in 90 days (TRIR ' + f.trir + '), concentrated in **' + dept.name + '**. On the training side, **' + overdueCount + ' employees** are overdue on ' + topic.course + '. Recommended: ' + suggestion,
      suggestion: suggestion,
      primary: inspection ? { label: 'Schedule inspection', action: 'schedule-inspection' } : { label: 'Review & assign', action: 'assign' },
      secondary: { label: 'Snooze', action: 'snooze' }, expanded: false,
      evidence: [
        { type: 'list', src: 'ehs', title: 'Safety picture, last 90 days', items: [['Incidents', String(f.incidents)], ['Near misses', String(f.nearMisses)], ['Open corrective actions', String(f.openCA)], ['Highest-risk department', dept.name]], caption: 'TRIR <strong>' + f.trir + '</strong> vs. ' + f.trirPrev + ' prior period' },
        { type: 'meter', src: 'ct', title: topic.course + ', ' + f.name, pct: Math.max(0, 100 - f.overdue), tone: f.overdue > 20 ? 'err' : f.overdue > 10 ? 'warn' : 'ok', big: (100 - f.overdue) + '%', bigSmall: 'current', left: num(f.employees - overdueCount) + ' current', right: overdueCount + ' overdue', caption: 'Company average is <strong>84%</strong>' },
        { type: 'list', src: 'ehs', title: 'What you told us', items: [['Your note', text.length > 60 ? text.slice(0, 60) + '…' : text], ['Matched topic', topic.type], ['Location', f.name]], caption: 'Ask again with more detail for a different recommendation' }
      ]
    };
  }
  function boldText(text) { return String(text).split('**').map(function (p, i) { return i % 2 ? '<strong>' + esc(p) + '</strong>' : esc(p); }).join(''); }
  function openAskRec(prefill) {
    var thread = [], thinking = false, pending = null;
    openDialog(ui.askRecDlg, '#tplAskRec', function (root) {
      var sel = $('#askFac', root), ta = $('#askText', root), log = $('#askThread', root);
      sel.items = [{ label: 'Pick from what I describe', value: 'auto' }].concat(D.facilities.map(function (f) { return { label: f.name, value: f.id }; }));
      sel.value = 'auto';
      if (prefill) ta.value = prefill;
      function paint() {
        log.innerHTML = thread.map(function (m) {
          if (m.role === 'user') return '<div class="ai-turn me"><div class="ai-bubble">' + esc(m.text) + '</div></div>';
          return '<div class="ai-turn"><div class="ai-bubble"><div class="ai-head"><span class="sev sev-' + m.rec.severity + '"><i class="fa-solid ' + SEV_ICON[m.rec.severity] + '" aria-hidden="true"></i>' + SEV_LABEL[m.rec.severity] + '</span><b>' + esc(m.rec.headline) + '</b></div><p>' + boldText(m.rec.reply) + '</p><div class="ai-src">' + srcChip('ehs') + srcChip('ct') + '<span>Vector EHS incidents and observations, Convergence training records</span></div><div class="ai-actions"><vaadin-button theme="primary small" data-act="ask-rec-add">Add to Recommended actions</vaadin-button><vaadin-button theme="tertiary small" data-act="ask-rec-refine">Ask differently</vaadin-button></div></div></div>';
        }).join('') + (thinking ? '<div class="ai-turn"><div class="ai-bubble ai-thinking"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span><em>Checking both products…</em></div></div>' : '');
        log.hidden = !thread.length && !thinking;
        $('.ask-form', root).hidden = !!thread.length || thinking;
        log.scrollTop = log.scrollHeight;
      }
      root.addEventListener('click', function (e) {
        var chip = e.target.closest('[data-chip]'); if (chip) { ta.value = (ta.value ? ta.value.replace(/\s*$/, ' ') : '') + chip.dataset.chip; return; }
        var b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'ask-rec-go') {
          var q = ta.value.trim(); if (!q) { ta.focus(); return; }
          askEpoch += 1; var epoch = askEpoch;
          thread.push({ role: 'user', text: q }); thinking = true; paint();
          setTimeout(function () { if (epoch !== askEpoch) return; pending = composeRecommendation(q, sel.value); thinking = false; thread.push({ role: 'assistant', rec: pending }); paint(); }, 620);
        }
        if (b.dataset.act === 'ask-rec-refine') { thread = []; pending = null; paint(); ta.focus(); }
        if (b.dataset.act === 'ask-rec-add' && pending) {
          var rec = pending; D.recommendations.unshift(rec); ui.askRecDlg.opened = false;
          expandedRec = rec.id; renderRecs();
          var card = document.querySelector('#recList .rec[data-id="' + rec.id + '"]'); if (card) card.scrollIntoView({ block: 'center', behavior: 'smooth' });
          toast('Recommendation added', rec.headline + '. It is marked as coming from your question.', { label: 'Remove', run: function () { D.recommendations = D.recommendations.filter(function (r) { return r.id !== rec.id; }); expandedRec = null; renderRecs(); } });
        }
      });
      paint();
    });
  }

  /* ── Dismiss / snooze / rule dialogs ───────────────────────────────────── */
  function openSnooze(rec) {
    openDialog(ui.snoozeDlg, '#tplSnooze', function (root) {
      $('#snoozeSub', root).textContent = rec.title;
      $('#snoozeFor', root).value = '14';
      var sel = $('#snoozeReason', root);
      sel.items = [{ label: 'Waiting on budget or approval', value: 'approval' }, { label: 'Training already scheduled', value: 'scheduled' }, { label: 'Investigation still open', value: 'investigation' }, { label: 'Something else', value: 'other' }];
      sel.value = 'scheduled';
      root.addEventListener('click', function (e) {
        if (!e.target.closest('[data-act="confirm-snooze"]')) return;
        var days = $('#snoozeFor', root).value;
        recStatus[rec.id] = { status: 'snoozed', days: days, reason: sel.value };
        ui.snoozeDlg.opened = false;
        leaveAndRender(rec.id, 'Snoozed for ' + days + ' days', 'It comes back on ' + fmtDate(addDays(D.today, Number(days)), true) + ', or sooner if the trend gets worse.');
      });
    });
  }
  function openRule(rec) {
    openDialog(ui.ruleDlg, '#tplRule', function (root) {
      var count = $('#ruleCount', root), days = $('#ruleDays', root), course = $('#ruleCourse', root), hint = $('#ruleHint', root);
      count.value = String(rec.rule.count); days.value = String(rec.rule.days);
      course.items = D.courses.map(function (c) { return { label: c.label, value: c.id }; });
      course.value = D.courses.filter(function (c) { return c.label === rec.rule.course; }).map(function (c) { return c.id; })[0] || 'wws';
      function update() { var n = Number(count.value) || 3, d = Number(days.value) || 30; hint.textContent = 'With ' + n + ' in ' + d + ' days this rule would have fired ' + (n <= 3 ? '4 times' : n === 4 ? 'twice' : 'once') + ' across all facilities in the last 12 months.'; }
      count.addEventListener('value-changed', update); days.addEventListener('value-changed', update); update();
      root.addEventListener('click', function (e) {
        if (!e.target.closest('[data-act="confirm-rule"]')) return;
        rec.rule.count = Number(count.value) || rec.rule.count; rec.rule.days = Number(days.value) || rec.rule.days; rec.rule.course = courseById(course.value).label;
        ui.ruleDlg.opened = false; renderRecs();
        toast('Rule saved', 'Near-miss cluster: ' + rec.rule.count + ' in ' + rec.rule.days + ' days, assign ' + rec.rule.course + '.');
      });
    });
  }
  function leaveAndRender(recId, title, sub) {
    var card = $('.rec[data-id="' + recId + '"]', ui.recList);
    var done = function () { renderRecs(); toast(title, sub, { label: 'Undo', run: function () { delete recStatus[recId]; renderRecs(); } }); };
    if (card) { card.classList.add('is-leaving'); setTimeout(done, 240); } else done();
  }

  /* ── Global click handling (delegated) ─────────────────────────────────── */
  function onRecAction(act, rec, target) {
    switch (act) {
      case 'toggle-details': {
        clearTimeout(hoverTimer); clearTimeout(leaveTimer);
        expandedRec = expandedRec === rec.id ? null : rec.id; renderRecs();
        if (expandedRec && DETAIL_MODE === 'below') { var d = document.getElementById('rd-' + rec.id); if (d) d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
        break;
      }
      case 'close-detail': expandedRec = null; renderRecs(); break;
      case 'assign': case 'assign-threshold': case 'assign-ca': case 'assign-hazcom': openAssign(rec, 1); break;
      case 'snooze': openSnooze(rec); break;
      case 'dismiss':
        recStatus[rec.id] = { status: 'dismissed' };
        leaveAndRender(rec.id, 'Recommendation dismissed', 'It stays in the recommendation log.');
        break;
      case 'edit-rule': openRule(rec); break;
      case 'send-admin':
        recStatus[rec.id] = { status: 'sent' }; renderRecs();
        toast('Sent to ' + D.trainingAdmin.name, 'The recommendation and its evidence are in their Assigned to me list.', { label: 'Undo', run: function () { delete recStatus[rec.id]; renderRecs(); } });
        break;
      case 'flag-risk':
        overrides[rec.facility] = { signal: 'elevated' }; recStatus[rec.id] = { status: 'flagged' }; renderRecs(); renderCompare();
        toast(facilityById(rec.facility).name + ' flagged as elevated risk', 'The flag shows in Vector EHS and in the comparison table.');
        break;
      case 'unflag-risk': delete overrides[rec.facility]; delete recStatus[rec.id]; renderRecs(); renderCompare(); toast('Risk flag removed'); break;
      case 'schedule-inspection': notYet('Scheduling an inspection in Vector EHS'); break;
      case 'schedule-eval': notYet('Scheduling qualification evaluations'); break;
      case 'view-ca': notYet('The corrective action CA-2291'); break;
      case 'view-quals': notYet('The qualifications page'); break;
      case 'view-assignment': notYet('The assignment page'); break;
      case 'view-handoff': notYet('The request sent to ' + D.trainingAdmin.name); break;
      case 'open-trend': notYet('The incident trend report'); break;
      default: notYet('This action'); break;
    }
  }
  function bindGlobal() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      var actEl = t.closest && t.closest('[data-act]');
      if (!actEl) {
        var recCard = DETAIL_MODE !== 'below' && t.closest && t.closest('#recList .rec');
        if (recCard && recCard.dataset.id) { onRecAction('toggle-details', recById(recCard.dataset.id), recCard); return; }
        var row = t.closest && t.closest('#cmpBody tr');
        if (row) { if (row.dataset.scope) setScope(row.dataset.scope); else if (row.dataset.dept) { S.dept = row.dataset.dept; renderHeader(); renderCompare(); } return; }
        var task = t.closest && t.closest('.task');
        if (task) { var tk = D.tasks.filter(function (x) { return x.id === task.dataset.task; })[0]; if (tk && tk.linkedRec) openAssign(recById(tk.linkedRec), 1); else notYet('The ' + (tk ? tk.kind.toLowerCase() : 'task') + ' page'); return; }
        return;
      }
      var act = actEl.dataset.act;
      if (actEl.tagName === 'A') e.preventDefault();
      var card = actEl.closest('.rec, .rec-detail, .rd');
      if (card) { onRecAction(act, recById(card.dataset.id), actEl); return; }
      switch (act) {
        case 'clear-scope': setScope('all'); break;
        case 'open-loc': if (window.Shell) Shell.setLoc(true, document.querySelector('.topbar .loc')); break;
        case 'audit-jump': document.getElementById('audit').scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
        case 'retry-sync': setSync('ok'); toast('Training data synced', 'Convergence responded. All training figures are current.'); break;
        case 'sync-log': notYet('The sync log'); break;
        case 'request-access': toast('Request sent to your administrator', 'You will get an email when a Convergence role is added.'); break;
        case 'manage-rules': notYet('Rule management'); break;
        case 'ask-rec': openAskRec(''); break;
        case 'show-snoozed': {
          var sn = D.recommendations.filter(function (r) { return recStatus[r.id] && recStatus[r.id].status === 'snoozed'; });
          if (!sn.length) toast('Nothing snoozed', 'Snoozed recommendations show here until they come back.');
          else toast(sn.length + ' snoozed recommendation' + (sn.length > 1 ? 's' : ''), sn.map(function (r) { return r.title; }).join(' · '), { label: 'Bring back', run: function () { sn.forEach(function (r) { delete recStatus[r.id]; }); renderRecs(); } });
          break;
        }
        case 'open-report': notYet('The facility comparison report'); break;
        case 'open-kpi': notYet(actEl.dataset.report); break;
        case 'view-all-tasks': notYet('The full task list'); break;
        case 'cal-prev': case 'cal-next': {
          var p = S.calMonth.split('-'), d = new Date(Number(p[0]), Number(p[1]) - 1 + (act === 'cal-next' ? 1 : -1), 1);
          S.calMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); renderCalendar(); break;
        }
        case 'cal-event': notYet('The event ' + (actEl.title ? '“' + actEl.title + '”' : '')); break;
        case 'cal-more': notYet('The day view'); break;
        case 'open-audit': notYet('The audit view'); break;
        case 'export-audit': toast('Export started', 'OSHA 300 Log, 300A, 301 reports, and the training records for each case, as PDF and XLSX. You will get a link when it is ready.'); break;
        case 'audit-item': notYet(actEl.textContent.trim()); break;
        default: break;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var row = e.target.closest && (e.target.closest('#cmpBody tr') || e.target.closest('.task') || e.target.closest('.kpi[role=button]') || (e.target.matches && e.target.matches('#recList .rec[role=button]') ? e.target : null));
      if (row) { e.preventDefault(); row.click(); }
    });
    ui.cmpTable.addEventListener('sort-direction-change', function (e) {
      var h = e.target.closest('vwc-sortable-header'); if (!h) return;
      var dirn = e.detail && e.detail.direction;
      sort = dirn ? { key: h.dataset.key, dir: dirn } : { key: 'trir', dir: 'desc' };
      renderCompare();
    });
    ui.mineTabs.addEventListener('selected-changed', function (e) {
      var tab = ui.mineTabs.querySelectorAll('vaadin-tab')[e.detail.value];
      if (tab) { S.mineTab = tab.dataset.tab; renderMine(); }
    });
    ui.rangeSel.addEventListener('value-changed', function (e) { if (e.detail.value && e.detail.value !== S.range) { S.range = e.detail.value; refresh(renderAll); } });
  }

  /* ── Flow-map states ───────────────────────────────────────────────────── */
  function reset() {
    S = Object.assign({}, DEFAULT); recStatus = {}; removedTasks = {}; extraEvents = []; overrides = {}; sort = { key: 'trir', dir: 'desc' }; expandedRec = null;
    D.recommendations = D.recommendations.filter(function (r) { return !r.requested; });
    closeDialogs(); if (window.Shell) Shell.closeAll(); if (window.Builder) Builder.reset();
    if (ui.mineTabs) ui.mineTabs.selected = 0;
  }
  function applyState(id, opts) {
    if (!ready) { pendingState = [id, opts]; return; }
    reset();
    switch (id) {
      case 'plant4': S.scope = 'plant4'; expandedRec = 'r1'; break;
      case 'rec-detail': expandedRec = 'r1'; break;
      case 'assign1': case 'assign2': case 'assign3': case 'assign4':
        S.scope = 'plant4'; renderAll(); openAssign(recById('r1'), Number(id.slice(-1))); return;
      case 'assigned':
        S.scope = 'plant4'; renderAll();
        wiz = null; openAssign(recById('r1'), 4); ui.assignDlg.opened = false;
        finishAssign(false); return;
      case 'ask-rec': renderAll(); openAskRec('Forklift near misses at Plant 4 have picked up this month, and two new operators started in Shipping'); setTimeout(function () { var go = document.querySelector('vaadin-dialog-overlay [data-act="ask-rec-go"]'); if (go) go.click(); }, 400); return;
      case 'asked': renderAll(); D.recommendations.unshift(composeRecommendation('Forklift near misses at Plant 4 have picked up this month, and two new operators started in Shipping', 'auto')); expandedRec = D.recommendations[0].id; renderRecs(); return;
      case 'dismissed': recStatus.r1 = { status: 'dismissed' }; renderAll(); toast('Recommendation dismissed', 'It stays in the recommendation log.', { label: 'Undo', run: function () { delete recStatus.r1; renderRecs(); } }); return;
      case 'ehs-only': S.role = 'ehs'; break;
      case 'loading': S.loading = true; break;
      case 'error': S.sync = 'error'; break;
      case 'empty': D.recommendations.forEach(function (r) { recStatus[r.id] = { status: 'dismissed' }; }); break;
      default: renderAll(); if (window.Builder && Builder.applyState(id)) return; break;
    }
    renderAll();
    if (window.Builder) Builder.show('home');
  }

  /* ── Init ──────────────────────────────────────────────────────────────── */
  function init() {
    if (ready) return;
    ['main', 'greeting', 'syncStatus', 'auditChipScore', 'locTree', 'filterLocText', 'filterLocClear', 'rangeSel', 'roleBanner', 'syncBanner',
     'kpis', 'recList', 'recBody', 'recCol', 'recPanel', 'recEmpty', 'recEmptyText', 'recCount', 'snoozedBtn', 'cmpTitle', 'cmpSub', 'cmpTable', 'cmpBody', 'mineCount', 'mineTabs', 'taskList',
     'calMonth', 'calGrid', 'calDeadlines', 'auditSub', 'auditBody', 'assignDlg', 'snoozeDlg', 'ruleDlg', 'askRecDlg', 'toast']
      .forEach(function (id) { ui[id] = document.getElementById(id); });

    S = Object.assign({}, DEFAULT);
    var q = new URLSearchParams(location.search);
    if (q.get('role') === 'ehs') S.role = 'ehs';
    if (q.get('scope')) S.scope = q.get('scope');

    /* Filters */
    ui.rangeSel.items = RANGES.map(function (r) { return { label: r.label, value: r.value }; });
    ui.rangeSel.value = S.range;

    bindGlobal();
    bindRecHover();
    renderAll();
    ready = true;
    if (pendingState) { var p = pendingState; pendingState = null; applyState(p[0], p[1]); }
  }

  window.App = { applyState: applyState, setScope: setScope, setRole: setRole, setSync: setSync, toast: toast, notYet: notYet, state: function () { return S; } };

  var defs = ['vaadin-select', 'vaadin-dialog', 'vaadin-tabs', 'vwc-sortable-header', 'vwc-stepper', 'vaadin-notification', 'vaadin-text-field'];
  var whenReady = Promise.all(defs.map(function (t) { return customElements.whenDefined(t); }));
  var domReady = new Promise(function (res) { if (document.readyState !== 'loading') res(); else document.addEventListener('DOMContentLoaded', res); });
  Promise.all([whenReady, domReady]).then(init);
  /* Fallback so the page still renders if the CDN is unreachable (file://, offline) */
  domReady.then(function () { setTimeout(init, 9000); });
})();
