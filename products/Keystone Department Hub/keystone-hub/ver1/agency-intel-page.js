/* global window, document, KEYSTONE, KX, KXCharts, KXCanvas, AGENCY_INTEL, AGENCY_INTEL_AI */
/* ========================================================================
   agency-intel-page.js — the Agency Intelligence page. Vanilla JS.
   ------------------------------------------------------------------------
   Two views:
     · home  — Dashboards tab (management table / card grid) + AI access tab
     · build — two-pane canvas + Agency Intelligence (the docked, text-only chat)

   All the data and decision logic lives in agency-intel-page-data.js
   (window.AGENCY_INTEL) and agency-intel-ai-data.js (window.AGENCY_INTEL_AI), ported
   verbatim from the prototype: status derivation, delivery metadata, access
   reconciliation, and Agency Intelligence's response engine.

   Principle from the PRD: the chat stays a clean TEXT conversation. Every
   visual output lands on the canvas, never in the chat.
   ======================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var CC = window.KEYSTONE_CUSTOM;
  var CP = window.AGENCY_INTEL;
  var AI = window.AGENCY_INTEL_AI;
  var esc = KX.esc, micon = KX.micon;

  var TODAY = CP.APP_TODAY || '2026-05-07';
  var SRC_ORDER = ['ts', 'ci', 'gt', 'sched', 'ev'];
  var PAGE_SIZE = 12;

  // Baked-in prototype defaults (the design tool's tweak block).
  var DEFAULTS = { homeState: 'populated', chatDock: 'left', aiState: 'populated' };

  /* =====================================================================
     STATE
     ===================================================================== */

  // Builder state, reset every time the builder opens. `tab` is the
  // Simple/Advanced pill; `mode` is which Advanced option is drilled into
  // (null = showing the option list).
  function freshBuilder() {
    return {
      tab: 'simple', mode: null,
      metric: null, viz: null, range: CP.DEFAULT_RANGE, include: [],
      a: null, b: null, corrViz: 'scatter',
      ideas: [],
      tableIds: [], tableHeading: '',
      textHeading: '', textBody: ''
    };
  }

  var state = {
    view: 'home',
    homeTab: 'dashboards',
    dashboards: DEFAULTS.homeState === 'empty' ? [] : CP.seedDashboards(),
    activeId: null,
    role: 'chief',

    // Dashboards table
    sort: { field: 'updated', dir: 'desc' },
    query: '',
    filter: 'all',
    page: 1,
    viewMode: (function () {
      try { return localStorage.getItem('kx-agency-intel-dash-view') || 'table'; } catch (e) { return 'table'; }
    })(),

    // Build view
    thread: [],
    draft: '',
    thinking: false,
    collapsed: false,
    mode: 'edit',            // edit | preview | report
    selectedId: null,
    editingName: false,
    exportMenu: false,
    lastSavedAt: Date.now() - 7 * 60 * 1000,
    saving: false,
    builder: freshBuilder(),

    // AI access
    aiGrants: DEFAULTS.aiState === 'empty' ? { titles: [], individuals: [] } : AI.seedGrants(),
    aiLog: DEFAULTS.aiState === 'empty' ? [] : AI.seedLog()
  };

  function active() {
    return state.dashboards.find(function (d) { return d.id === state.activeId; }) || null;
  }

  function patchActive(fn) {
    state.dashboards = state.dashboards.map(function (d) {
      if (d.id !== state.activeId) return d;
      var n = typeof fn === 'function' ? fn(d) : Object.assign({}, d, fn);
      return Object.assign({}, n, { updatedAt: TODAY });
    });
    state.saving = true;
    state.lastSavedAt = Date.now();
    render();
    setTimeout(function () { state.saving = false; renderSavedChip(); }, 750);
  }

  function setWidgets(fn) {
    patchActive(function (d) {
      return Object.assign({}, d, { widgets: typeof fn === 'function' ? fn(d.widgets) : fn });
    });
  }

  /* =====================================================================
     SHARED BITS
     ===================================================================== */

  function agencyIntelMark(size) {
    size = size || 30;
    return '<span class="agency-intel-mark" style="width:' + size + 'px;height:' + size + 'px">' +
      micon('auto_awesome', { size: Math.round(size * 0.56), fill: 1 }) + '</span>';
  }

  function fmtDate(s) {
    var d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Relative "last saved" label.
  function formatSaved(ts) {
    var diff = Date.now() - ts;
    if (diff < 45000) return 'Just now';
    var mins = Math.round(diff / 60000);
    if (mins < 60) return mins + (mins === 1 ? ' min ago' : ' mins ago');
    var d = new Date(ts);
    var time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    var today = new Date();
    var yest = new Date(); yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return time;
    if (d.toDateString() === yest.toDateString()) return 'Yesterday · ' + time;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + time;
  }

  function dashSources(d) {
    var set = {};
    (d.widgets || []).forEach(function (w) {
      CP.widgetSources(w).forEach(function (s) { set[s] = true; });
    });
    return set;
  }

  // Headcount across job titles + named individuals + AI groups. Resolved
  // through the roster and de-duplicated by person: titles report counts
  // while groups resolve to people, so summing the two would double-count
  // anyone who is both (a Captain who is also in the HazMat group).
  function reachOf(d) {
    var a = d.assignedTo;
    if (!a) return 0;
    if (window.AGENCY_INTEL_ROSTER) return AGENCY_INTEL_ROSTER.audienceCount(a);
    var n = (a.individuals || []).length;
    (a.titles || []).forEach(function (id) {
      var t = CP.titleById(id);
      if (t) n += (t.count || 0);
    });
    return n;
  }

  function statusBadge(status) {
    var m = CP.dashStatusMeta(status);
    return '<span class="cp-status" style="background:' + m.bg + ';color:' + m.fg +
      ';border:1px solid ' + m.border + '">' + micon(m.icon, { size: 12, fill: 1 }) + ' ' + esc(m.label) + '</span>';
  }

  function deliveryPill(d) {
    var del = CP.deliveryOf(d);
    if (!del) {
      return '<span style="font-size:13px;color:var(--ink-300)">—</span>';
    }
    var m = CP.deliveryMeta ? CP.deliveryMeta(d) : null;
    var cad = CP.cadenceMeta(del.cadence);
    var fmt = CP.formatMeta(del.format);
    return '<span class="cp-pill-count" style="background:var(--lumo-primary-color-10pct);' +
      'border-color:rgba(2,113,206,0.25);color:var(--lumo-primary-text-color)" title="' +
      KX.attr((m && m.label) || (cad.label + ' · ' + fmt.label)) + '">' +
      micon(del.paused ? 'pause_circle' : 'schedule_send', { size: 13, fill: 1 }) +
      esc(cad.short + ' ' + fmt.short) + '</span>';
  }

  function sourcesCell(d) {
    var set = dashSources(d);
    var used = SRC_ORDER.filter(function (k) { return set[k]; });
    if (!used.length) return '<span style="font-size:13px;color:var(--ink-300)">—</span>';
    return '<span class="cp-pill-count" title="' +
      KX.attr('Pulling from: ' + used.map(function (k) { return K.SOURCES[k].name; }).join(', ')) + '">' +
      micon('dataset', { size: 13, color: 'var(--ink-500)' }) +
      '<span style="font-family:var(--font-numeric);font-variant-numeric:tabular-nums">' + used.length + '</span></span>';
  }

  function audienceCell(d) {
    var a = d.assignedTo;
    var titles = (a && a.titles) || [];
    var inds = (a && a.individuals) || [];
    var groups = (a && a.groups) || [];
    if (!titles.length && !inds.length && !groups.length) {
      return '<span style="font-size:13px;color:var(--ink-300)">—</span>';
    }
    var RS = window.AGENCY_INTEL_ROSTER;
    var tip = titles.map(function (id) {
      var t = CP.titleById(id);
      return t ? t.label + ' (' + t.count + ' ppl)' : id;
    }).concat(groups.map(function (id) {
      var g = RS && RS.groupById(id);
      return g ? g.name + ' (live rule)' : id;
    })).concat(inds.map(function (id) {
      var p = CP.INDIVIDUALS.find(function (x) { return x.id === id; });
      return p ? p.name : ((RS && RS.personById(id)) || {}).name || id;
    })).join(', ');
    return '<span style="display:inline-flex;align-items:center;gap:6px" title="' + KX.attr(tip) + '">' +
      (groups.length ? '<span class="cp-aud-title" style="background:var(--amber-50);' +
        'border-color:var(--amber-400);color:var(--amber-700)">' +
        micon('auto_awesome', { size: 12, fill: 1 }) + ' ' + groups.length +
        ' group' + (groups.length === 1 ? '' : 's') + '</span>' : '') +
      (titles.length ? '<span class="cp-aud-title">' + micon('badge', { size: 12, fill: 1 }) + ' ' +
        titles.length + ' title' + (titles.length === 1 ? '' : 's') + '</span>' : '') +
      (inds.length ? '<span class="cp-aud-ind">' + micon('person', { size: 12 }) + ' ' + inds.length + '</span>' : '') +
      '</span>';
  }

  /* =====================================================================
     HOME — DASHBOARDS TAB
     ===================================================================== */

  var FILTERS = [
    { id: 'all', label: 'All', fg: 'var(--ink-900)', bg: 'var(--surface-1)' },
    { id: 'draft', label: 'Draft', fg: 'var(--amber-600)', bg: 'var(--amber-50)' },
    { id: 'private', label: 'Private', fg: 'var(--ink-700)', bg: 'var(--surface-3)' },
    { id: 'scheduled', label: 'Scheduled', fg: 'var(--lumo-primary-text-color)', bg: 'var(--lumo-primary-color-10pct)' },
    { id: 'published', label: 'Published', fg: 'var(--teal-600)', bg: 'var(--teal-50)' }
  ];

  function filteredDashboards() {
    var list = state.dashboards;
    if (state.filter !== 'all') {
      list = list.filter(function (d) { return CP.statusOf(d) === state.filter; });
    }
    var q = state.query.trim().toLowerCase();
    if (q) list = list.filter(function (d) { return d.name.toLowerCase().indexOf(q) !== -1; });

    var dir = state.sort.dir === 'asc' ? 1 : -1;
    var val = function (d) {
      if (state.sort.field === 'name') return d.name.toLowerCase();
      if (state.sort.field === 'widgets') return (d.widgets || []).length;
      if (state.sort.field === 'status') return CP.STATUS_RANK[CP.statusOf(d)] || 0;
      if (state.sort.field === 'reach') return reachOf(d);
      if (state.sort.field === 'updated') return d.updatedAt;
      return 0;
    };
    return list.slice().sort(function (a, b) {
      var va = val(a), vb = val(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }

  function statusCounts() {
    var c = { all: state.dashboards.length, draft: 0, private: 0, scheduled: 0, published: 0 };
    state.dashboards.forEach(function (d) {
      var s = CP.statusOf(d);
      if (c[s] != null) c[s]++;
    });
    return c;
  }

  function sortTh(label, field, opts) {
    opts = opts || {};
    var isActive = state.sort.field === field;
    return '<th' + (opts.num ? ' class="is-num"' : '') +
      (isActive ? ' aria-sort="' + (state.sort.dir === 'asc' ? 'ascending' : 'descending') + '"' : '') + '>' +
      '<vwc-sortable-header data-cp-sort="' + field + '"' +
      (isActive ? ' sortDirection="' + state.sort.dir + '"' : '') +
      ' accessibleName="' + KX.attr('Sort by ' + label) + '">' + esc(label) + '</vwc-sortable-header></th>';
  }

  function dashRow(d) {
    var st = CP.statusOf(d);
    var accent = CP.dashStatusMeta(st).accent;
    var reach = reachOf(d);
    return '<tr class="cp-row" data-open-dash="' + KX.attr(d.id) + '" tabindex="0">' +
      '<td style="border-left-color:' + accent + '">' +
      '<div class="cp-dash-name"><span class="cp-dash-icon">' +
      micon(d.icon || 'dashboard', { size: 18, fill: 1 }) + '</span>' +
      '<div style="min-width:0"><div class="t">' + esc(d.name) + '</div>' +
      '<div class="s">Created ' + esc(fmtDate(d.createdAt)) + '</div></div></div></td>' +
      '<td>' + sourcesCell(d) + '</td>' +
      '<td class="cp-num">' + (d.widgets || []).length + '</td>' +
      '<td>' + statusBadge(st) + '</td>' +
      '<td>' + deliveryPill(d) + '</td>' +
      '<td>' + audienceCell(d) + '</td>' +
      '<td class="cp-num" title="Estimated people reached"' +
      (reach ? '' : ' style="color:var(--ink-300)"') + '>' + (reach || '—') + '</td>' +
      '<td class="cp-num" style="font-family:inherit;font-size:12px;color:var(--ink-600);font-weight:400">' +
      esc(fmtDate(d.updatedAt)) + '</td></tr>';
  }

  function dashCard(d) {
    var st = CP.statusOf(d);
    var accent = CP.dashStatusMeta(st).accent;
    var reach = reachOf(d);
    var stat = function (label, value, muted) {
      return '<div style="flex:1"><div style="font-size:10px;font-weight:700;letter-spacing:0.5px;' +
        'text-transform:uppercase;color:var(--ink-500);margin-bottom:3px">' + label + '</div>' +
        '<div style="font-family:var(--font-numeric);font-size:18px;font-weight:700;color:' +
        (muted ? 'var(--ink-300)' : 'var(--ink-800)') + ';font-variant-numeric:tabular-nums">' + value + '</div></div>';
    };
    return '<div class="cp-dcard" data-open-dash="' + KX.attr(d.id) + '" tabindex="0" ' +
      'style="border-top:3px solid ' + accent + '">' +
      '<div style="display:flex;align-items:flex-start;gap:11px;padding:14px 16px 12px">' +
      '<span class="cp-dash-icon" style="width:38px;height:38px;border-radius:9px">' +
      micon(d.icon || 'dashboard', { size: 21, fill: 1 }) + '</span>' +
      '<div style="min-width:0;flex:1"><div style="font-size:15px;font-weight:700;color:var(--ink-900);' +
      'line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(d.name) + '</div>' +
      '<div style="font-size:11.5px;color:var(--ink-500);margin-top:2px">Created ' + esc(fmtDate(d.createdAt)) + '</div></div>' +
      statusBadge(st) + '</div>' +
      '<div style="display:flex;align-items:center;padding:0 16px 14px">' +
      stat('Widgets', (d.widgets || []).length) +
      stat('Reach', reach || '—', !reach) +
      '<div style="flex:1.3;min-width:0"><div style="font-size:10px;font-weight:700;letter-spacing:0.5px;' +
      'text-transform:uppercase;color:var(--ink-500);margin-bottom:5px">Sources</div>' + sourcesCell(d) + '</div>' +
      '</div>' +
      '<div class="cp-dcard-foot">' +
      '<span style="display:inline-flex;align-items:center;gap:6px;min-width:0;flex-wrap:wrap">' +
      deliveryPill(d) + audienceCell(d) + '</span>' +
      '<span style="font-size:11.5px;color:var(--ink-500);white-space:nowrap">Updated ' + esc(fmtDate(d.updatedAt)) + '</span>' +
      '</div></div>';
  }

  function emptyMatch() {
    return '<div class="cp-empty-table">' + micon('search_off', { size: 30, color: 'var(--ink-300)' }) +
      '<div style="font-size:14px;font-weight:600;margin-top:8px;color:var(--ink-700)">No dashboards match</div>' +
      '<div style="font-size:12.5px;color:var(--ink-500);margin-top:3px">Try a different search or filter.</div></div>';
  }

  function dashboardsTab() {
    if (!state.dashboards.length) {
      return '<div class="cp-first-run">' + agencyIntelMark(64) +
        '<h2>Build your first dashboard</h2>' +
        '<p>Ask Agency Intelligence a question in plain language and pin the answer. Your dashboards refresh ' +
        'automatically and live here, ready to publish to your team.</p>' +
        '<vaadin-button theme="primary large" id="cpNewDash">' + micon('add', { size: 18 }) +
        '<span class="kx-btn-label">Create your first dashboard</span></vaadin-button></div>';
    }

    var list = filteredDashboards();
    var counts = statusCounts();
    var totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    var cur = Math.min(state.page, totalPages);
    var start = (cur - 1) * PAGE_SIZE;
    var rows = list.slice(start, start + PAGE_SIZE);

    var toolbar = '<div class="cp-toolbar">' +
      '<vaadin-text-field theme="outlined" class="cp-search" id="cpSearch" placeholder="Search dashboards…" ' +
      'clear-button-visible value="' + KX.attr(state.query) + '"></vaadin-text-field>' +
      '<div class="cp-seg" role="group" aria-label="Filter by status">' +
      FILTERS.map(function (f) {
        var on = state.filter === f.id;
        return '<button data-cp-filter="' + f.id + '" class="' + (on ? 'is-on' : '') + '"' +
          (on ? ' style="background:' + f.bg + ';color:' + f.fg + ';box-shadow:inset 0 -2px 0 ' + f.fg + '"' : '') +
          ' aria-pressed="' + on + '"><span>' + f.label + '</span>' +
          '<span class="n">' + counts[f.id] + '</span></button>';
      }).join('') + '</div>' +
      '<div style="margin-left:auto;display:inline-flex;align-items:center;gap:14px">' +
      '<span style="font-size:12.5px;color:var(--ink-500);font-weight:500">' + list.length +
      ' dashboard' + (list.length === 1 ? '' : 's') + '</span>' +
      '<div class="cp-seg" role="group" aria-label="View">' +
      [['table', 'Table', 'table_rows'], ['cards', 'Cards', 'grid_view']].map(function (o) {
        var on = state.viewMode === o[0];
        return '<button data-cp-view="' + o[0] + '" class="' + (on ? 'is-on' : '') + '"' +
          (on ? ' style="color:var(--ink-900);box-shadow:inset 0 -2px 0 var(--lumo-primary-color)"' : '') +
          ' title="' + o[1] + ' view" aria-pressed="' + on + '">' +
          micon(o[2], { size: 17, fill: on ? 1 : 0 }) + '<span>' + o[1] + '</span></button>';
      }).join('') + '</div></div></div>';

    var body;
    if (!rows.length) body = emptyMatch();
    else if (state.viewMode === 'cards') body = '<div class="cp-cardgrid">' + rows.map(dashCard).join('') + '</div>';
    else {
      body = '<div class="cp-table-card"><div class="cp-table-scroll"><table class="cp-table"><thead><tr>' +
        sortTh('Dashboard', 'name') +
        '<th>Sources</th>' +
        sortTh('Widgets', 'widgets', { num: true }) +
        sortTh('Status', 'status') +
        '<th>Delivery</th><th>Published to</th>' +
        sortTh('Reach', 'reach', { num: true }) +
        sortTh('Updated', 'updated', { num: true }) +
        '</tr></thead><tbody>' + rows.map(dashRow).join('') + '</tbody></table></div></div>';
    }

    var pager = list.length
      ? '<div class="cp-pager-row">' +
        '<span style="font-size:12.5px;color:var(--ink-500)">Showing ' + (start + 1) + '–' +
        Math.min(start + PAGE_SIZE, list.length) + ' of ' + list.length + '</span>' +
        (totalPages > 1
          ? '<vwc-paginator id="cpPager" total="' + list.length + '" page="' + (cur - 1) +
            '" pageSize="' + PAGE_SIZE + '"></vwc-paginator>'
          : '') +
        '</div>'
      : '';

    return toolbar + body + pager;
  }

  /* =====================================================================
     HOME — AI ACCESS TAB
     ===================================================================== */

  function entitlementDots(ents) {
    return '<span class="cp-ent-dots">' + SRC_ORDER.map(function (k) {
      var on = ents && ents.indexOf(k) !== -1;
      var s = K.SOURCES[k];
      return '<span class="d" title="' + KX.attr(s.name + (on ? ' — allowed' : ' — no access')) + '" style="' +
        (on ? 'background:' + s.color : 'background:transparent;box-shadow:inset 0 0 0 1.5px var(--ink-200)') +
        '"></span>';
    }).join('') + '</span>';
  }

  var OUTCOME_TONES = {
    answered: { fg: 'var(--teal-600)', bg: 'var(--teal-50)', label: 'Answered', icon: 'check_circle' },
    denied: { fg: 'var(--lumo-error-text-color)', bg: 'var(--lumo-error-color-10pct)', label: 'Declined', icon: 'block' },
    partial: { fg: 'var(--amber-700)', bg: 'var(--amber-50)', label: 'Partial', icon: 'info' },
    nodata: { fg: 'var(--ink-600)', bg: 'var(--surface-3)', label: 'No data', icon: 'search_off' }
  };

  function outcomeBadge(o) {
    var t = OUTCOME_TONES[o] || OUTCOME_TONES.answered;
    return '<span class="cp-outcome" style="background:' + t.bg + ';color:' + t.fg + '">' +
      micon(t.icon, { size: 11, fill: 1 }) + esc(t.label) + '</span>';
  }

  // AI grants are stored as { id, grantedAt, grantedBy } records, unlike a
  // dashboard's assignedTo which holds bare id strings. Normalize so the
  // renderer and the revoke handlers can treat both shapes the same way.
  function grantId(g) { return (g && typeof g === 'object') ? g.id : g; }
  function grantMeta(g) { return (g && typeof g === 'object') ? g : null; }

  function aiAccessTab() {
    var g = state.aiGrants;
    var titles = (g.titles || []);
    var inds = (g.individuals || []);
    var reach = AI.grantReach ? AI.grantReach(g) : 0;
    var declined = state.aiLog.filter(function (e) { return e.outcome === 'denied' && !e.flagged; }).length;

    var grantRows = titles.map(function (entry) {
      var id = grantId(entry);
      var meta = grantMeta(entry);
      var t = CP.titleById(id);
      if (!t) return '';
      var ents = AI.titleEntitlements ? AI.titleEntitlements(id) : [];
      return '<div class="cp-grant-row">' +
        '<span style="width:30px;height:30px;border-radius:8px;background:var(--teal-50);color:var(--teal-600);' +
        'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
        micon('badge', { size: 16, fill: 1 }) + '</span>' +
        '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink-900)">' +
        esc(t.label) + '</div>' +
        '<div style="font-size:11.5px;color:var(--ink-500)">' + t.count + ' people · job title' +
        (meta && meta.grantedAt ? ' · granted ' + esc(fmtDate(meta.grantedAt)) : '') + '</div></div>' +
        entitlementDots(ents) +
        '<vaadin-button theme="icon tertiary small" data-ai-revoke-title="' + KX.attr(id) + '" ' +
        'aria-label="Revoke access" title="Revoke Agency Intelligence access">' + micon('close', { size: 16 }) + '</vaadin-button>' +
        '</div>';
    }).join('') +
    inds.map(function (entry) {
      var id = grantId(entry);
      var meta = grantMeta(entry);
      var p = CP.INDIVIDUALS.find(function (x) { return x.id === id; });
      if (!p) return '';
      var ents = AI.personEntitlements ? AI.personEntitlements(id) : (p.entitlements || []);
      return '<div class="cp-grant-row">' +
        '<span style="width:30px;height:30px;border-radius:8px;background:var(--surface-3);color:var(--ink-600);' +
        'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
        micon('person', { size: 16 }) + '</span>' +
        '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink-900)">' +
        esc(p.name) + '</div>' +
        '<div style="font-size:11.5px;color:var(--ink-500)">' + esc(p.rank || 'Individual') +
        (meta && meta.grantedAt ? ' · granted ' + esc(fmtDate(meta.grantedAt)) : '') + '</div></div>' +
        entitlementDots(ents) +
        '<vaadin-button theme="icon tertiary small" data-ai-revoke-ind="' + KX.attr(id) + '" ' +
        'aria-label="Revoke access" title="Revoke Agency Intelligence access">' + micon('close', { size: 16 }) + '</vaadin-button>' +
        '</div>';
    }).join('');

    var grantsPanel = '<div class="cp-panel">' +
      '<div class="cp-panel-head" style="display:flex;align-items:flex-start;gap:12px">' +
      '<div style="flex:1"><h3>Homepage Agency Intelligence</h3>' +
      '<p>Who gets an assistant on their homepage. Agency Intelligence can only answer from the apps a ' +
      'person is already entitled to — the dots show each grant\'s reach.</p></div>' +
      '<vaadin-button theme="secondary small" id="cpAiGrant">' + micon('add', { size: 16 }) +
      '<span class="kx-btn-label">Grant</span></vaadin-button></div>' +
      '<div style="display:flex;align-items:center;gap:14px;padding:12px 18px;background:var(--surface-2);' +
      'border-bottom:1px solid var(--ink-100)">' +
      '<span style="font-size:12px;color:var(--ink-600)"><b style="font-family:var(--font-numeric);font-size:15px">' +
      (titles.length + inds.length) + '</b> grant' + (titles.length + inds.length === 1 ? '' : 's') + '</span>' +
      '<span style="font-size:12px;color:var(--ink-600)"><b style="font-family:var(--font-numeric);font-size:15px">' +
      reach + '</b> people reached</span>' +
      '<span style="margin-left:auto;font-size:11px;color:var(--ink-500)">Entitlements: ' +
      SRC_ORDER.map(function (k) { return K.SOURCES[k].short; }).join(' · ') + '</span></div>' +
      (grantRows ||
        '<div style="padding:36px 20px;text-align:center">' + micon('person_off', { size: 28, color: 'var(--ink-300)' }) +
        '<div style="font-size:13.5px;font-weight:600;margin-top:8px;color:var(--ink-700)">No one has Agency Intelligence yet</div>' +
        '<div style="font-size:12.5px;color:var(--ink-500);margin-top:3px">Grant a job title or an individual to start.</div></div>') +
      '</div>';

    var logRows = state.aiLog.slice(0, 40).map(function (e) {
      return '<div class="cp-log-row">' +
        '<div style="display:flex;align-items:center;gap:9px;margin-bottom:5px">' +
        '<span style="font-size:12.5px;font-weight:600;color:var(--ink-900)">' + esc(e.who || 'Unknown') + '</span>' +
        '<span style="font-size:11px;color:var(--ink-400)">' + esc(e.title || '') + '</span>' +
        '<span style="margin-left:auto;display:inline-flex;align-items:center;gap:8px">' +
        outcomeBadge(e.outcome) +
        '<span style="font-size:11px;color:var(--ink-400);white-space:nowrap;font-variant-numeric:tabular-nums">' +
        esc(AI.fmtTs ? AI.fmtTs(e.at) : '') + '</span></span></div>' +
        '<div style="font-size:12.5px;color:var(--ink-700);line-height:1.45">' + esc(e.q || '') + '</div>' +
        (e.outcome === 'denied'
          ? '<div style="display:flex;align-items:center;gap:8px;margin-top:7px">' +
            '<span style="font-size:11.5px;color:var(--lumo-error-text-color)">' +
            esc(e.reason || 'Outside this person\'s data permissions.') + '</span>' +
            '<vaadin-button theme="tertiary small" data-ai-fix="' + KX.attr(e.id) + '" ' +
            'style="margin-left:auto">Review access</vaadin-button></div>'
          : '') +
        '</div>';
    }).join('');

    var logPanel = '<div class="cp-panel">' +
      '<div class="cp-panel-head" style="display:flex;align-items:flex-start;gap:12px">' +
      '<div style="flex:1"><h3>Audit log</h3>' +
      '<p>Every question Agency Intelligence answered on a homepage, and every one it declined. ' +
      'Declined asks are the signal for what people need but can\'t reach.</p></div>' +
      (declined
        ? '<span class="cp-outcome" style="background:var(--lumo-error-color-10pct);color:var(--lumo-error-text-color)">' +
          declined + ' to review</span>'
        : '') +
      '</div>' +
      '<div style="max-height:620px;overflow-y:auto">' +
      (logRows ||
        '<div style="padding:36px 20px;text-align:center">' + micon('history', { size: 28, color: 'var(--ink-300)' }) +
        '<div style="font-size:13.5px;font-weight:600;margin-top:8px;color:var(--ink-700)">Nothing asked yet</div>' +
        '<div style="font-size:12.5px;color:var(--ink-500);margin-top:3px">' +
        'Questions appear here as soon as someone with access uses Agency Intelligence.</div></div>') +
      '</div></div>';

    return '<div class="cp-ai-grid">' + grantsPanel + logPanel + '</div>';
  }

  /* =====================================================================
     HOME SHELL
     ===================================================================== */

  function homeHtml() {
    var isAdmin = !!(K.ROLES[state.role] && K.ROLES[state.role].admin);
    var declined = state.aiLog.filter(function (e) { return e.outcome === 'denied' && !e.flagged; }).length;
    // Data Explorer is admin-only; if a non-admin lands on it, fall back.
    var tab = (state.homeTab === 'explore' && !isAdmin) ? 'dashboards' : state.homeTab;

    var subtitle = tab === 'ai'
      ? 'Control who gets an Agency Intelligence assistant on their homepage, and audit every question it answers.'
      : tab === 'explore'
        ? 'Explore your data with Agency Intelligence — follow any thread. Exploration doesn\'t have to become a dashboard.'
        : 'Dashboards you\'ve built with Agency Intelligence. Open one to edit with AI, publish it live to a role, ' +
          'or schedule it out as a report — same widgets, your choice of destination.';

    var TABS = [{ id: 'dashboards', label: 'Dashboards', icon: 'space_dashboard' }]
      .concat(isAdmin ? [{ id: 'explore', label: 'Data Explorer', icon: 'travel_explore' }] : [])
      .concat([{ id: 'ai', label: 'AI access', icon: 'auto_awesome' }]);

    return '<div class="cp-page">' +
      '<div class="cp-page-head"><div style="flex:1;min-width:0">' +
      // Mark scales with the page title, now a 40px H1.
      '<div style="display:flex;align-items:center;gap:12px">' + agencyIntelMark(40) + '<h1>Agency Intelligence</h1></div>' +
      '<p>' + esc(subtitle) + '</p></div>' +
      (tab === 'dashboards' && state.dashboards.length
        ? '<vaadin-button theme="primary" id="cpNewDash">' + micon('add', { size: 18 }) +
          '<span class="kx-btn-label">New dashboard</span></vaadin-button>'
        : '') +
      '</div>' +

      '<div class="cp-tabs" role="tablist" aria-label="Agency Intelligence sections">' +
      TABS.map(function (t) {
        var on = tab === t.id;
        return '<button class="cp-tab' + (on ? ' is-on' : '') + '" data-cp-tab="' + t.id +
          '" role="tab" aria-selected="' + on + '">' + micon(t.icon, { size: 17 }) + esc(t.label) +
          (t.id === 'ai' && declined
            ? '<span class="attn" title="' + declined + ' declined asks to review">' + declined + '</span>'
            : '') + '</button>';
      }).join('') + '</div>' +

      (tab === 'ai' ? aiAccessTab()
        : tab === 'explore' ? (window.KXExplore ? window.KXExplore.html() : '')
        : dashboardsTab()) +
      '</div>';
  }

  /* =====================================================================
     BUILD VIEW — AGENCY INTELLIGENCE PANEL
     ===================================================================== */

  function agencyIntelBubble(text) {
    return String(text).split('**').map(function (p, i) {
      return i % 2 ? '<strong style="color:var(--ink-900)">' + esc(p) + '</strong>' : esc(p);
    }).join('');
  }

  function agencyIntelTurn(msg, idx) {
    if (msg.role === 'user') {
      return '<div class="cpv-user"><div class="bubble">' + esc(msg.text) + '</div></div>';
    }
    return '<div class="cpv-ai">' + agencyIntelMark(26) +
      '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px">' +
      '<div class="bubble">' + agencyIntelBubble(msg.text) + '</div>' +
      (msg.added
        ? '<div class="cpv-added">' + micon('add_chart', { size: 14, fill: 1 }) +
          ' Added “' + esc(msg.added) + '” to the canvas</div>'
        : '') +
      (msg.choices
        ? '<div style="display:flex;gap:6px;flex-wrap:wrap">' + msg.choices.map(function (c, i) {
            return '<button class="cpv-choice" data-cpv-choice="' + idx + '" data-cpv-choice-i="' + i + '">' +
              esc(c.label) + '</button>';
          }).join('') + '</div>'
        : '') +
      '</div></div>';
  }

  function agencyIntelPanel() {
    if (state.collapsed) {
      return '<button class="cpv-collapsed" id="cpvExpand" title="Open Agency Intelligence">' +
        agencyIntelMark(32) + '<span class="vlabel">Agency Intelligence</span>' +
        micon('chevron_left', { size: 18, color: 'var(--ink-400)', style: 'margin-top:auto' }) + '</button>';
    }
    var ready = state.draft.trim() && !state.thinking;
    return '<div class="cpv-panel">' +
      '<div class="cpv-head">' + agencyIntelMark(30) +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-weight:700;font-size:15px;color:var(--ink-900);line-height:1.1">Agency Intelligence</div>' +
      '<div style="font-size:11.5px;color:var(--ink-500)">Building “this dashboard” with you</div></div>' +
      '<vaadin-button theme="icon tertiary small" id="cpvNewChat" title="New chat" aria-label="New chat">' +
      micon('restart_alt', { size: 17 }) + '</vaadin-button>' +
      '<vaadin-button theme="icon tertiary small" id="cpvCollapse" title="Collapse Agency Intelligence" ' +
      'aria-label="Collapse Agency Intelligence">' + micon('chevron_right', { size: 18 }) + '</vaadin-button></div>' +

      '<div class="cpv-thread" id="cpvThread">' +
      state.thread.map(agencyIntelTurn).join('') +
      (state.thinking
        ? '<div class="cpv-ai" style="align-items:center">' + agencyIntelMark(26) +
          '<div style="display:inline-flex;align-items:center;gap:6px;padding:9px 13px;background:var(--surface-2);' +
          'border:1px solid var(--ink-100);border-radius:14px 14px 14px 4px">' +
          '<span class="cpv-dot"></span><span class="cpv-dot" style="animation-delay:140ms"></span>' +
          '<span class="cpv-dot" style="animation-delay:280ms"></span>' +
          '<span style="font-size:11.5px;color:var(--ink-500);margin-left:4px;font-style:italic">' +
          'Querying your apps…</span></div></div>'
        : '') +
      '</div>' +

      '<div class="cpv-input-wrap"><div class="cpv-input">' +
      '<textarea id="cpvDraft" rows="3" placeholder="Ask Agency Intelligence — e.g. show overtime risk for the next 30 days">' +
      esc(state.draft) + '</textarea>' +
      '<button class="cp-send' + (ready ? ' is-ready' : '') + '" id="cpvSend" title="Send" aria-label="Send"' +
      (ready ? '' : ' disabled') + ' style="width:32px;height:32px;border-radius:var(--radius-pill);border:none;flex-shrink:0;' +
      'display:inline-flex;align-items:center;justify-content:center;background:' +
      (ready ? 'var(--ink-900)' : 'var(--ink-200)') + ';color:' + (ready ? 'white' : 'var(--ink-500)') + ';cursor:' +
      (ready ? 'pointer' : 'default') + '">' + micon('arrow_upward', { size: 18, weight: 500 }) + '</button>' +
      '</div>' +
      '<div style="font-size:10px;color:var(--ink-400);margin-top:6px;padding-left:4px">' +
      'Charts render on the canvas, never in chat. Agency Intelligence can be wrong — verify before acting.</div>' +
      '</div></div>';
  }

  /* =====================================================================
     BUILD VIEW — WIDGET BUILDER (empty canvas)
     ===================================================================== */

  function builderPreviewWidget() {
    var b = state.builder;
    if (b.tab === 'simple') {
      if (!b.metric) return null;
      return { id: 'preview', metricId: b.metric, viz: b.viz, dateRange: b.range,
               include: b.include.length ? b.include : undefined, state: 'live' };
    }
    if (b.a && b.b && b.a !== b.b && CC.sharedBarLabels([b.a, b.b]).length >= 3) {
      return { id: 'preview', metricIds: [b.a, b.b], viz: b.corrViz, state: 'live' };
    }
    return null;
  }

  function metricPickerHtml() {
    var byCat = {}, cats = [];
    CC.AVAILABLE_METRICS.forEach(function (m) {
      if (!byCat[m.category]) { byCat[m.category] = []; cats.push(m.category); }
      byCat[m.category].push(m);
    });
    return cats.map(function (cat) {
      return '<div><div style="font-size:10.5px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;' +
        'color:var(--ink-400);margin-bottom:6px">' + esc(cat) + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:5px">' +
        byCat[cat].map(function (m) {
          var on = state.builder.metric === m.id;
          return '<button class="cp-metric-btn' + (on ? ' is-on' : '') + '" data-b-metric="' + KX.attr(m.id) + '">' +
            '<span class="ic">' + micon(m.icon, { size: 14, fill: 1 }) + '</span>' +
            '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(m.label) + '</span>' +
            (on ? '<span style="margin-left:auto">' + micon('check', { size: 15, color: 'var(--amber-600)' }) + '</span>' : '') +
            '</button>';
        }).join('') + '</div></div>';
    }).join('');
  }

  function paramPanelHtml() {
    var b = state.builder;
    var supportsRange = CP.widgetSupportsRange({ viz: b.viz });
    var cats = CC.metricCategories(b.metric, b.viz);
    if (!supportsRange && !cats) return '';
    var allOn = !b.include || !b.include.length;
    var lbl = 'font-size:10.5px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:var(--ink-400);margin-bottom:6px';
    return '<div class="cp-param-panel">' +
      '<div class="cp-step"><span class="n">3</span><span class="t">Set parameters</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:14px">' +
      (supportsRange
        ? '<div><div style="' + lbl + '">Date range</div>' +
          '<vaadin-select theme="outlined" id="cpBRange" style="width:100%"></vaadin-select></div>'
        : '') +
      (cats
        ? '<div><div style="' + lbl + ';display:flex;align-items:center;gap:8px">' +
          '<span>' + esc(cats.name) + ' shown</span>' +
          (!allOn ? '<button data-b-cats-all style="margin-left:auto;background:none;border:none;' +
            'color:var(--lumo-primary-text-color);font-size:10.5px;font-weight:700;cursor:pointer;' +
            'font-family:inherit;text-transform:none">Select all</button>' : '') +
          '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
          cats.values.map(function (v) {
            var on = allOn || b.include.indexOf(v) !== -1;
            return '<button class="cp-cat-chip' + (on ? ' is-on' : '') + '" data-b-cat="' + KX.attr(v) + '">' +
              (on ? micon('check', { size: 13 }) : '') + ' ' + esc(v) + '</button>';
          }).join('') + '</div>' +
          (!allOn ? '<div style="font-size:11px;color:var(--ink-500);margin-top:7px">Showing ' +
            b.include.length + ' of ' + cats.values.length + '.</div>' : '') +
          '</div>'
        : '') +
      '</div></div>';
  }

  function widgetPreviewHtml(w) {
    return '<div style="background:var(--surface-1);border:1px solid var(--ink-100);border-radius:12px;' +
      'box-shadow:var(--elev-1);padding:14px">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
      '<span class="cpw-icon">' + micon(CP.widgetIcon(w), { size: 14, fill: 1 }) + '</span>' +
      '<span class="cpw-title">' + esc(CP.widgetTitle(w)) + '</span>' +
      '<span style="margin-left:auto;display:flex;gap:6px;flex-shrink:0">' +
      CP.widgetSources(w).map(function (s) { return KX.srcChip(s); }).join('') + '</span></div>' +
      KXCanvas.widgetBody(w) + '</div>';
  }

  function simpleBuilderHtml() {
    var b = state.builder;
    var preview = builderPreviewWidget();
    return '<div style="display:grid;grid-template-columns:minmax(0, 0.85fr) minmax(0, 1.15fr);gap:20px;align-items:start">' +
      '<div><div class="cp-step"><span class="n">1</span><span class="t">Pick a metric</span></div>' +
      '<div style="max-height:340px;overflow-y:auto;padding-right:4px;margin-right:-4px;' +
      'display:flex;flex-direction:column;gap:12px">' + metricPickerHtml() + '</div></div>' +
      '<div>' +
      (!b.metric
        ? '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;' +
          'min-height:260px;gap:10px;border:1px dashed var(--ink-200);border-radius:14px;padding:24px;color:var(--ink-500)">' +
          micon('bar_chart', { size: 30, color: 'var(--ink-300)' }) +
          '<div style="font-size:13.5px;font-weight:600;color:var(--ink-600)">Pick a metric to chart it</div>' +
          '<div style="font-size:12.5px;line-height:1.5;max-width:260px">You\'ll get a live preview here, ' +
          'and can set the chart type and parameters.</div></div>'
        : '<div class="cp-step"><span class="n">2</span><span class="t">Choose a chart type</span></div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
          CC.VIZ_TYPES.map(function (t) {
            return '<button class="cp-chip' + (b.viz === t.id ? ' is-on' : '') + '" data-b-viz="' + KX.attr(t.id) +
              '" title="' + KX.attr(t.hint) + '">' + micon(t.icon, { size: 14 }) + ' ' + esc(t.label) + '</button>';
          }).join('') + '</div>' +
          paramPanelHtml() +
          (preview ? '<div style="margin-top:14px">' + widgetPreviewHtml(preview) + '</div>' : '') +
          '<div style="display:flex;align-items:center;gap:12px;margin-top:14px">' +
          '<vaadin-button theme="primary" id="cpBAdd">' + micon('add', { size: 16 }) +
          '<span class="kx-btn-label">Add to dashboard</span></vaadin-button>' +
          '<span style="font-size:12px;color:var(--ink-500)">You can fine-tune all of this later, too.</span></div>'
      ) + '</div></div>';
  }

  function correlationBuilderHtml() {
    var b = state.builder;
    // Only offer pairings that actually share a categorical axis — two metrics
    // reported on different breakdowns have no common ground to plot against.
    var ids = CC.AVAILABLE_METRICS.map(function (m) { return m.id; });
    var pairable = ids.filter(function (id) {
      return ids.some(function (o) { return o !== id && CC.metricsCorrelatable([id, o]); });
    });
    var compatible = b.a
      ? pairable.filter(function (id) { return id !== b.a && CC.metricsCorrelatable([b.a, id]); })
      : pairable;
    var picked = b.a && b.b && b.a !== b.b;
    var shared = picked ? CC.sharedBarLabels([b.a, b.b]) : [];
    var ready = picked && shared.length >= 3;
    var preview = builderPreviewWidget();
    var suggestions = CC.CORRELATION_SUGGESTIONS.filter(function (s) { return CC.metricsCorrelatable(s.metricIds); });
    var CORR_VIZ = [
      { id: 'scatter', label: 'Scatter + trend', icon: 'scatter_plot' },
      { id: 'pair', label: 'Paired bars', icon: 'bar_chart' },
      { id: 'line', label: 'Dual line', icon: 'show_chart' }
    ];
    var axLbl = 'font-size:10.5px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:var(--ink-400);margin-bottom:5px;display:block';

    return '<div>' +
      '<div style="font-size:13px;font-weight:700;color:var(--ink-800);margin-bottom:3px">Correlate two metrics</div>' +
      '<div style="font-size:12.5px;color:var(--ink-500);margin-bottom:14px;line-height:1.5">' +
      'Plot one metric against another to see how they relate. The first is the X axis, the second is the Y axis — ' +
      'only measures that break down the same way can be paired.</div>' +
      '<div style="display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap">' +
      '<div style="flex:1;min-width:180px"><label style="' + axLbl + '">X axis</label>' +
      '<vaadin-select theme="outlined" id="cpCorrA" style="width:100%"></vaadin-select></div>' +
      '<span style="font-size:12px;font-weight:700;color:var(--ink-400);padding-bottom:9px">vs</span>' +
      '<div style="flex:1;min-width:180px"><label style="' + axLbl + '">Y axis</label>' +
      '<vaadin-select theme="outlined" id="cpCorrB" style="width:100%"></vaadin-select></div></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">' +
      suggestions.slice(0, 6).map(function (s) {
        return '<button data-b-sugg="' + KX.attr(s.id) + '" title="' + KX.attr(s.hint) + '" ' +
          'style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;' +
          'background:var(--surface-1);border:1px solid var(--ink-200);color:var(--ink-600);font-size:11.5px;' +
          'font-weight:600;cursor:pointer;font-family:inherit">' +
          micon('auto_awesome', { size: 12 }) + ' ' + esc(s.title) + '</button>';
      }).join('') + '</div>' +
      (picked && !ready
        ? '<div style="display:flex;gap:9px;align-items:flex-start;margin-top:14px;padding:12px 14px;' +
          'border-radius:11px;background:var(--amber-50);border:1px solid var(--amber-200)">' +
          micon('info', { size: 16, fill: 1, color: 'var(--amber-700)' }) +
          '<span style="font-size:12.5px;color:var(--ink-800);line-height:1.5">These two don\'t share a breakdown — ' +
          'they\'re reported on different axes, so there\'s nothing to plot them against. Pick a pair that breaks ' +
          'down the same way, or use one of the suggestions above.</span></div>'
        : '') +
      (ready
        ? '<div style="margin-top:14px">' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">' +
          CORR_VIZ.map(function (t) {
            return '<button class="cp-chip' + (b.corrViz === t.id ? ' is-on' : '') + '" data-b-corrviz="' +
              KX.attr(t.id) + '">' + micon(t.icon, { size: 14 }) + ' ' + esc(t.label) + '</button>';
          }).join('') + '</div>' +
          (preview ? widgetPreviewHtml(preview) : '') +
          '<div style="margin-top:14px"><vaadin-button theme="primary" id="cpBAddCorr">' +
          micon('add', { size: 16 }) + '<span class="kx-btn-label">Add correlation</span></vaadin-button></div>' +
          '</div>'
        : '') +
      '<input type="hidden" id="cpCorrCompat" value="' + KX.attr(compatible.join(',')) + '">' +
      '<input type="hidden" id="cpCorrPairable" value="' + KX.attr(pairable.join(',')) + '">' +
      '</div>';
  }

  function ideasBuilderHtml() {
    var ideas = CP.IDEA_PROMPTS || [];
    return '<div>' +
      '<div style="font-size:13px;font-weight:700;color:var(--ink-800);margin-bottom:3px">Start from an idea</div>' +
      '<div style="font-size:12.5px;color:var(--ink-500);margin-bottom:14px;line-height:1.5">' +
      'Pick as many as you want — Agency Intelligence builds them all onto the canvas at once.</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      ideas.map(function (idea) {
        var on = state.builder.ideas.indexOf(idea.id) !== -1;
        return '<button class="cp-idea' + (on ? ' is-on' : '') + '" data-b-idea="' + KX.attr(idea.id) + '">' +
          '<span class="box">' + (on ? micon('check', { size: 15 }) : '') + '</span>' +
          '<span style="flex:1;min-width:0">' +
          '<span style="display:flex;align-items:center;gap:7px">' +
          '<span style="width:26px;height:26px;border-radius:7px;background:var(--amber-100);color:var(--amber-700);' +
          'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
          micon(idea.icon, { size: 15, fill: 1 }) + '</span>' +
          '<span style="font-size:13.5px;font-weight:600;color:var(--ink-900);line-height:1.35">' +
          esc(idea.prompt) + '</span></span></span></button>';
      }).join('') + '</div>' +
      (state.builder.ideas.length
        ? '<div style="margin-top:14px"><vaadin-button theme="primary" id="cpBGenerate">' +
          micon('auto_awesome', { size: 16 }) + '<span class="kx-btn-label">Build ' +
          state.builder.ideas.length + ' widget' + (state.builder.ideas.length === 1 ? '' : 's') +
          '</span></vaadin-button></div>'
        : '') +
      '</div>';
  }

  // ---- ADVANCED · summary table: several metrics, one compact table ----
  // The block that lets a dashboard read as a report instead of a wall of charts.
  function metricsTableBuilderHtml() {
    var b = state.builder;
    var cats = [];
    var byCat = {};
    CC.AVAILABLE_METRICS.forEach(function (m) {
      if (!byCat[m.category]) { byCat[m.category] = []; cats.push(m.category); }
      byCat[m.category].push(m);
    });
    var preview = b.tableIds.length
      ? { id: 'preview', kind: 'metrics_table', viz: 'metrics_table', metricIds: b.tableIds,
          heading: b.tableHeading || 'Summary table', state: 'live' }
      : null;

    return '<div>' +
      '<div style="font-size:13px;font-weight:700;color:var(--ink-800);margin-bottom:3px">Summary table</div>' +
      '<div style="font-size:12.5px;color:var(--ink-500);margin-bottom:14px;line-height:1.5">' +
      'Pick the measures that belong in one at-a-glance table. Each becomes a row with its current value, ' +
      'its change and a plain status word.</div>' +
      '<input class="cp-b-field" id="cpBTableHeading" style="margin-bottom:12px" ' +
      'placeholder="Table heading — e.g. Readiness at a glance" value="' + KX.attr(b.tableHeading) + '">' +
      '<div style="max-height:210px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-right:4px">' +
      cats.map(function (cat) {
        return '<div><div style="font-size:10.5px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;' +
          'color:var(--ink-400);margin-bottom:6px">' + esc(cat) + '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
          byCat[cat].map(function (m) {
            var on = b.tableIds.indexOf(m.id) !== -1;
            return '<button class="cp-cat-chip' + (on ? ' is-on' : '') + '" data-b-tmetric="' + KX.attr(m.id) + '">' +
              micon(on ? 'check' : m.icon, { size: 13, fill: on ? 0 : 1 }) + ' ' + esc(m.label) + '</button>';
          }).join('') + '</div></div>';
      }).join('') + '</div>' +
      (preview
        ? '<div style="margin-top:16px">' + widgetPreviewHtml(preview) +
          '<div style="margin-top:14px"><vaadin-button theme="primary" id="cpBAddTable">' +
          micon('add', { size: 16 }) + '<span class="kx-btn-label">Add summary table</span></vaadin-button></div>' +
          '</div>'
        : '') +
      '</div>';
  }

  // ---- ADVANCED · written commentary ----
  function textBlockBuilderHtml() {
    var b = state.builder;
    var ready = !!(b.textHeading.trim() || b.textBody.trim());
    return '<div>' +
      '<div style="font-size:13px;font-weight:700;color:var(--ink-800);margin-bottom:3px">Written commentary</div>' +
      '<div style="font-size:12.5px;color:var(--ink-500);margin-bottom:14px;line-height:1.5">' +
      'Your own words alongside the numbers — what happened, why it matters, what you\'re asking for. ' +
      'This is what turns a dashboard into a report someone reads.</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
      '<input class="cp-b-field" id="cpBTextHeading" style="font-size:14px;font-weight:600" ' +
      'placeholder="Section heading — e.g. What we\'re asking the council for" value="' +
      KX.attr(b.textHeading) + '">' +
      '<textarea class="cp-b-field" id="cpBTextBody" rows="6" placeholder="Write the commentary…">' +
      esc(b.textBody) + '</textarea></div>' +
      '<div style="display:flex;align-items:center;gap:12px;margin-top:14px">' +
      '<vaadin-button theme="primary" id="cpBAddText"' + (ready ? '' : ' disabled') + '>' +
      micon('add', { size: 16 }) + '<span class="kx-btn-label">Add text block</span></vaadin-button>' +
      '<span style="font-size:12px;color:var(--ink-500)">You can keep editing it right on the canvas.</span></div>' +
      '</div>';
  }

  // ---- ADVANCED · open-ended chooser: correlate, table, commentary, ideas,
  //      or hand the whole thing to Agency Intelligence in the chat dock.
  function advancedBuilderHtml() {
    var b = state.builder;
    var OPTIONS = [
      { id: 'correlate', icon: 'scatter_plot', title: 'Correlate metrics',
        desc: 'Plot two metrics against each other to see how they relate, with a trend line.' },
      { id: 'table', icon: 'table_chart', title: 'Summary table',
        desc: 'Several measures in one compact table — value, change and status per row.' },
      { id: 'text', icon: 'notes', title: 'Written commentary',
        desc: 'A heading and prose block, so the numbers arrive with your read on them.' },
      { id: 'ideas', icon: 'auto_awesome', title: 'Start from an idea',
        desc: 'Pick from ready-made questions Agency Intelligence can chart in one click.' },
      { id: 'ask', icon: 'forum', title: 'Describe it to Agency Intelligence',
        desc: 'Ask in your own words and let Agency Intelligence build it on the canvas.' }
    ];

    if (!b.mode) {
      return '<div class="cp-adv-list">' +
        OPTIONS.map(function (o) {
          return '<button class="cp-adv-opt" data-b-mode="' + o.id + '">' +
            '<span class="ico">' + micon(o.icon, { size: 20, fill: 1 }) + '</span>' +
            '<span class="txt"><span class="t">' + esc(o.title) + '</span>' +
            '<span class="d">' + esc(o.desc) + '</span></span>' +
            '<span class="chev">' + micon('chevron_right', { size: 20 }) + '</span></button>';
        }).join('') + '</div>';
    }

    return '<div><button class="cp-adv-back" data-b-mode-back="1">' +
      micon('arrow_back', { size: 14 }) + ' All options</button>' +
      (b.mode === 'correlate' ? correlationBuilderHtml()
        : b.mode === 'table' ? metricsTableBuilderHtml()
        : b.mode === 'text' ? textBlockBuilderHtml()
        : ideasBuilderHtml()) +
      '</div>';
  }

  // "Describe it to Agency Intelligence" / "just ask" — hand the job to the
  // chat dock instead of a form. Closes the Add-widget dialog if it's open and
  // expands the dock, so the caret always lands somewhere visible.
  function focusChat() {
    Array.prototype.forEach.call(document.querySelectorAll('vaadin-dialog'), function (d) {
      if (d.opened) d.opened = false;
    });
    if (state.collapsed) { state.collapsed = false; render(); }
    setTimeout(function () {
      var ta = document.getElementById('cpvDraft');
      if (ta) { ta.focus(); ta.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }, 60);
  }

  // Shell with Simple / Advanced tabs. `modal` drops the big header and the
  // "just ask" footer — those belong to the empty state, not the dialog.
  function widgetBuilderHtml(modal) {
    var b = state.builder;
    var TABS = [
      { id: 'simple', label: 'Simple', icon: 'tune' },
      { id: 'advanced', label: 'Advanced', icon: 'insights' }
    ];
    var subtitle = b.tab === 'simple'
      ? 'Pick one metric and choose how to show it.'
      : 'Correlate metrics, build a summary table, write commentary, or ask Agency Intelligence.';

    return '<div class="cp-builder' + (modal ? ' is-modal' : '') + '">' +
      (modal ? '' : '<div class="cp-builder-head">' + agencyIntelMark(52) +
        '<h2>Let’s build your first widget</h2></div>') +
      '<div class="cp-builder-tabs"><div class="cp-builder-modes">' +
      TABS.map(function (t) {
        return '<button data-b-tab="' + t.id + '" style="display:inline-flex;align-items:center;gap:6px;' +
          'padding:7px 18px;border-radius:var(--radius-pill);border:none;cursor:pointer;font-size:12.5px;font-weight:600;' +
          'font-family:inherit;background:' + (b.tab === t.id ? 'var(--surface-1)' : 'transparent') + ';color:' +
          (b.tab === t.id ? 'var(--ink-900)' : 'var(--ink-500)') + ';box-shadow:' +
          (b.tab === t.id ? 'var(--elev-1)' : 'none') + '">' +
          micon(t.icon, { size: 15 }) + ' ' + esc(t.label) + '</button>';
      }).join('') + '</div>' +
      '<div class="cp-builder-sub">' + esc(subtitle) + '</div></div>' +
      (b.tab === 'simple' ? simpleBuilderHtml() : advancedBuilderHtml()) +
      (modal ? '' : '<div class="cp-builder-foot">or <button id="cpBAskFocus">' +
        'just ask Agency Intelligence →</button></div>') +
      '</div>';
  }

  /* =====================================================================
     BUILD VIEW SHELL
     ===================================================================== */

  function statusControl(d) {
    var st = CP.statusOf(d);
    var m = CP.dashStatusMeta(st);
    return '<button id="cpStatusBtn" class="cp-status" title="Change where this lands" ' +
      'style="background:' + m.bg + ';color:' + m.fg + ';border:1px solid ' + m.border +
      ';cursor:pointer;font-family:inherit;padding:5px 10px">' +
      micon(m.icon, { size: 13, fill: 1 }) + ' ' + esc(m.label) + micon('expand_more', { size: 14 }) + '</button>';
  }

  function buildHtml() {
    var d = active();
    if (!d) return homeHtml();
    var locked = state.mode !== 'edit';
    var widgets = d.widgets || [];
    var st = CP.statusOf(d);
    var published = st === 'published' || st === 'scheduled';
    var delivery = CP.deliveryOf(d);

    var bar = '<div class="cp-build-bar">' +
      (!locked
        ? '<vaadin-button theme="secondary small" id="cpBack" title="Back to Agency Intelligence">' +
          micon('arrow_back', { size: 15 }) + '<span class="kx-btn-label">Agency Intelligence</span></vaadin-button>' +
          '<span class="cp-dash-icon">' + micon(d.icon || 'dashboard', { size: 18, fill: 1 }) + '</span>'
        : '<span style="font-family:var(--font-display);font-weight:600;font-size:13px;letter-spacing:0.4px;' +
          'text-transform:uppercase;color:var(--ink-400)">Preview</span>') +
      (locked
        ? ''
        : state.editingName
          ? '<vaadin-text-field theme="outlined" id="cpNameField" value="' + KX.attr(d.name) +
            '" style="flex:0 1 460px" autofocus></vaadin-text-field>'
          : '<button id="cpRename" title="Rename" style="display:inline-flex;align-items:center;gap:8px;' +
            'background:none;border:none;cursor:text;padding:0;min-width:0">' +
            '<span class="cp-build-name">' + esc(d.name) + '</span>' +
            micon('edit', { size: 15, color: 'var(--ink-300)' }) + '</button>') +
      '<div style="margin-left:auto;display:flex;align-items:center;gap:8px">' +
      (widgets.length && !locked
        ? '<span class="cp-saved" id="cpSavedChip" title="Last auto-saved">' +
          (state.saving
            ? '<span class="spinner" style="width:13px;height:13px;border-top-color:var(--teal-500)"></span> Saving…'
            : micon('cloud_done', { size: 15, fill: 1, color: 'var(--teal-500)' }) +
              ' Saved · ' + esc(formatSaved(state.lastSavedAt))) + '</span>' +
          statusControl(d) +
          (delivery
            ? '<vaadin-button theme="secondary small" id="cpEditSchedule" title="Edit the report schedule">' +
              micon(delivery.paused ? 'pause_circle' : 'schedule_send', { size: 14, fill: 1 }) +
              '<span class="kx-btn-label">' + esc(CP.cadenceMeta(delivery.cadence).short + ' ' +
              CP.formatMeta(delivery.format).short) + '</span></vaadin-button>'
            : '') +
          exportControl() +
          (published
            ? '<vaadin-button theme="secondary" id="cpPublish">' + micon('group', { size: 16 }) +
              '<span class="kx-btn-label">Manage delivery</span></vaadin-button>'
            : '<vaadin-button theme="primary" id="cpPublish">' + micon('campaign', { size: 16 }) +
              '<span class="kx-btn-label">Publish</span></vaadin-button>')
        : '') +
      '<div class="cp-modes">' +
      [['edit', 'Edit', 'edit'], ['preview', 'Preview', 'visibility']].map(function (o) {
        var on = o[0] === 'edit' ? state.mode === 'edit' : locked;
        return '<button data-cp-mode="' + o[0] + '" class="' + (on ? 'is-on' : '') + '" title="' +
          (o[0] === 'edit' ? 'Edit mode' : 'Preview this dashboard as your audience sees it') + '">' +
          micon(o[2], { size: 14 }) + ' ' + o[1] + '</button>';
      }).join('') + '</div></div></div>';

    var previewBanner = locked
      ? '<div style="padding:4px 0 20px;margin-bottom:6px;border-bottom:1px solid var(--ink-100)">' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
        '<span style="font-family:var(--font-display);font-weight:600;font-size:26px;color:var(--ink-900);' +
        'letter-spacing:-0.3px">' + esc(d.name) + '</span>' +
        (state.mode === 'preview'
          ? '<span class="cp-status" style="background:var(--teal-50);color:var(--teal-600);' +
            'border:1px solid var(--teal-100)">' + micon('campaign', { size: 12, fill: 1 }) + ' Published to you</span>'
          : '<span class="cp-status" style="background:var(--surface-3);color:var(--ink-600);' +
            'border:1px solid var(--ink-100)">' + micon('visibility', { size: 12, fill: 1 }) +
            ' Preview only — nothing is sent</span>') +
        '<div style="margin-left:auto;display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:11.5px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;' +
        'color:var(--ink-400)">Viewing as</span>' +
        '<div class="cp-modes">' +
        [['preview', 'Live dashboard', 'space_dashboard'], ['report', 'Delivered report', 'description']].map(function (o) {
          return '<button data-cp-mode="' + o[0] + '" class="' + (state.mode === o[0] ? 'is-on' : '') + '">' +
            micon(o[2], { size: 14 }) + ' ' + o[1] + '</button>';
        }).join('') + '</div></div></div></div>'
      : '';

    var canvas;
    if (state.mode === 'report') canvas = reportPreviewHtml(d);
    else if (!widgets.length) canvas = '<div class="cp-canvas-empty">' + widgetBuilderHtml() + '</div>';
    else {
      canvas = '<div class="cp-grid">' + widgets.map(function (w) {
        return KXCanvas.widgetCard(w, { editable: !locked, selected: state.selectedId === w.id });
      }).join('') + '</div>' +
      (!locked
        ? '<div style="margin-top:14px"><vaadin-button theme="secondary" id="cpAddWidget">' +
          micon('add', { size: 16 }) + '<span class="kx-btn-label">Add widget</span></vaadin-button></div>'
        : '');
    }

    return '<div class="cp-build">' + bar + previewBanner +
      '<div class="cp-panes' + (DEFAULTS.chatDock === 'left' ? ' dock-left' : '') + '">' +
      '<div class="cp-canvas">' + canvas + '</div>' +
      (locked ? '' : agencyIntelPanel()) +
      '</div></div>';
  }

  // Export the whole dashboard — PDF (print) or CSV. Sits beside Publish.
  function exportControl() {
    return '<div style="position:relative">' +
      '<vaadin-button theme="secondary" id="cpExport" title="Export this dashboard">' +
      micon('download', { size: 16 }) + '<span class="kx-btn-label">Export</span>' +
      micon('expand_more', { size: 14 }) + '</vaadin-button>' +
      (state.exportMenu
        ? '<div class="kx-menu kx-menu--right" style="width:230px">' +
          '<button class="kx-menu-row" data-cp-export="pdf">' +
          micon('picture_as_pdf', { size: 16 }) +
          '<span class="label">Export as PDF</span></button>' +
          '<button class="kx-menu-row" data-cp-export="csv">' +
          micon('table_view', { size: 16 }) +
          '<span class="label">Export as CSV</span></button>' +
          '</div>'
        : '') + '</div>';
  }

  // A single widget printed on its own page — same framing as the report
  // so a widget PDF and a dashboard PDF look like the same document.
  function widgetDocHtml(d, w) {
    return '<div style="background:var(--surface-1);padding:32px;max-width:840px;margin:0 auto">' +
      '<div style="display:flex;align-items:flex-start;gap:14px;padding-bottom:18px;margin-bottom:22px;' +
      'border-bottom:2px solid var(--ink-900)">' +
      '<div style="flex:1"><div style="font-family:var(--font-display);font-weight:600;font-size:24px;' +
      'color:var(--ink-900);letter-spacing:-0.4px">' + esc(CP.widgetTitle(w)) + '</div>' +
      '<div style="font-size:12.5px;color:var(--ink-500);margin-top:4px">' +
      esc(d.name) + ' · Keystone · ' + esc(fmtDate(TODAY)) + '</div></div>' +
      agencyIntelMark(34) + '</div>' +
      '<div class="cp-grid">' + KXCanvas.widgetCard(Object.assign({}, w, { w: 12 }), { editable: false }) +
      '</div>' +
      '<div style="margin-top:26px;padding-top:14px;border-top:1px solid var(--ink-100);font-size:11.5px;' +
      'color:var(--ink-400)">Generated by Keystone Agency Intelligence · data as of ' +
      esc(fmtDate(TODAY)) + '</div></div>';
  }

  // The delivered document: the same widgets, laid out as a report page.
  function reportPreviewHtml(d) {
    var del = CP.deliveryOf(d);
    var summary = CP.reportSummary ? CP.reportSummary(d) : null;
    return '<div style="background:var(--surface-1);border:1px solid var(--ink-100);border-radius:16px;' +
      'box-shadow:var(--elev-1);padding:32px;max-width:840px;margin:0 auto">' +
      '<div style="display:flex;align-items:flex-start;gap:14px;padding-bottom:18px;margin-bottom:22px;' +
      'border-bottom:2px solid var(--ink-900)">' +
      '<div style="flex:1"><div style="font-family:var(--font-display);font-weight:600;font-size:28px;' +
      'color:var(--ink-900);letter-spacing:-0.4px">' + esc(d.name) + '</div>' +
      '<div style="font-size:12.5px;color:var(--ink-500);margin-top:4px">' +
      'Keystone · ' + esc(fmtDate(TODAY)) +
      (del ? ' · ' + esc(CP.cadenceMeta(del.cadence).label + ' ' + CP.formatMeta(del.format).label) : '') +
      '</div></div>' + agencyIntelMark(34) + '</div>' +
      // reportSummary() returns { lead, rows } — `lead` is the prose.
      (summary && summary.lead
        ? '<div style="font-size:13px;color:var(--ink-700);line-height:1.6;margin-bottom:24px;padding:14px 16px;' +
          'background:var(--surface-2);border-radius:10px;border-left:3px solid var(--amber-400)">' +
          esc(summary.lead) + '</div>'
        : '') +
      '<div class="cp-grid">' + (d.widgets || []).map(function (w) {
        return KXCanvas.widgetCard(w, { editable: false });
      }).join('') + '</div>' +
      '<div style="margin-top:26px;padding-top:14px;border-top:1px solid var(--ink-100);font-size:11.5px;' +
      'color:var(--ink-400);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
      '<span>Generated by Keystone Agency Intelligence · data as of ' + esc(fmtDate(TODAY)) + '</span>' +
      '<span>' + (del ? esc('Delivered ' + CP.cadenceMeta(del.cadence).label.toLowerCase()) : 'Not scheduled') +
      '</span></div></div>';
  }

  /* =====================================================================
     PUBLISH / ASSIGN DIALOG
     ===================================================================== */

  // The audience picker (job titles / named individuals / AI groups) lives
  // in agency-intel-audience.js — this is just the hand-off.
  function openAssignDialog(d) {
    AGENCY_INTEL_AUDIENCE.open({
      dashboard: d,
      // How many OTHER dashboards ride on this group — editing a live rule
      // changes their audience too, so the dialog warns before saving.
      groupUsage: function (gid) {
        return state.dashboards.filter(function (x) {
          return x.id !== d.id && x.assignedTo &&
            (x.assignedTo.groups || []).indexOf(gid) !== -1;
        }).length;
      },
      onPublish: function (out) {
        assignDash(d.id, out.audience, out.delivery);
        var live = !!out.audience;
        KX.pushToast({
          title: live ? 'Dashboard published' : out.delivery ? 'Report scheduled' : 'Set to private',
          body: live
            ? 'Live for ' + out.reach + ' ' + (out.reach === 1 ? 'person' : 'people') + '.'
            : out.delivery
              ? CP.cadenceMeta(out.delivery.cadence).label + ' · ' + CP.formatMeta(out.delivery.format).label
              : 'Only you can see this now.',
          icon: 'campaign', tone: 'success'
        });
      }
    });
  }

  // Publishing to a homepage releases those targets from any other dashboard
  // (a user holds only one live dashboard); report delivery is additive.
  function assignDash(id, audience, delivery) {
    state.dashboards = state.dashboards.map(function (d) {
      if (d.id === id) {
        var live = !!(audience && ((audience.titles || []).length ||
          (audience.individuals || []).length || (audience.groups || []).length));
        return Object.assign({}, d, {
          assignedTo: live ? audience : null,
          delivery: delivery || null,
          status: live ? 'published' : (delivery ? 'draft' : 'private'),
          updatedAt: TODAY
        });
      }
      if (!d.assignedTo || !audience) return d;
      var titles = (d.assignedTo.titles || []).filter(function (t) { return (audience.titles || []).indexOf(t) === -1; });
      var inds = (d.assignedTo.individuals || []).filter(function (i) { return (audience.individuals || []).indexOf(i) === -1; });
      var groups = (d.assignedTo.groups || []).filter(function (g) { return (audience.groups || []).indexOf(g) === -1; });
      var still = titles.length || inds.length || groups.length;
      return Object.assign({}, d, {
        assignedTo: still ? { titles: titles, individuals: inds, groups: groups } : null,
        status: still ? d.status : 'private'
      });
    });
    render();
  }

  /* =====================================================================
     BUILD-VIEW ACTIONS
     ===================================================================== */

  function resolveWidgetSoon(id, finalState) {
    setTimeout(function () {
      setWidgets(function (ws) {
        return ws.map(function (w) { return w.id === id ? Object.assign({}, w, { state: finalState || 'live' }) : w; });
      });
    }, 720);
  }

  function pushAgencyIntel(msg) {
    state.thread.push(Object.assign({ role: 'agency-intel' }, msg));
    render();
  }

  function agencyIntelSend(textArg) {
    var text = (typeof textArg === 'string' ? textArg : state.draft).trim();
    if (!text || state.thinking) return;
    state.thread.push({ role: 'user', text: text });
    state.draft = '';
    state.thinking = true;
    render();

    setTimeout(function () {
      var d = active();
      var widgets = (d && d.widgets) || [];
      var resp = CP.agencyIntelRespond(text, { hasWidgets: widgets.length > 0 });
      state.thinking = false;

      if (resp.kind === 'refine') {
        var targetId = state.selectedId || (widgets.length ? widgets[widgets.length - 1].id : null);
        if (!targetId) { pushAgencyIntel({ text: 'Add a widget first, then I can change it.' }); return; }
        setWidgets(function (ws) {
          return ws.map(function (w) {
            return w.id === targetId ? Object.assign({}, w, resp.patch, { state: 'refreshing' }) : w;
          });
        });
        resolveWidgetSoon(targetId, 'live');
        pushAgencyIntel({ text: resp.text });
      } else if (resp.kind === 'widget' || resp.kind === 'nodata') {
        var w = Object.assign({}, resp.widget, { state: resp.kind === 'nodata' ? 'nodata' : 'loading' });
        setWidgets(function (ws) { return ws.concat([w]); });
        if (resp.kind === 'widget') resolveWidgetSoon(w.id, 'live');
        pushAgencyIntel({ text: resp.text, added: resp.kind === 'widget' ? CP.widgetTitle(w) : null });
      } else if (resp.kind === 'choice') {
        pushAgencyIntel({ text: resp.text, choices: resp.choices });
      } else {
        pushAgencyIntel({ text: resp.text });
      }
    }, 850 + Math.random() * 500);
  }

  function addWidget(spec) {
    var w = Object.assign({}, CP.newWidget(spec), { state: 'loading' });
    setWidgets(function (ws) { return ws.concat([w]); });
    var title = CP.widgetTitle(w);
    state.thread.push({ role: 'user', text: 'Add ' + title });
    state.thread.push({ role: 'agency-intel', text: 'Added “' + title + '”. Want to tweak it, or add another?' });
    resolveWidgetSoon(w.id, 'live');
    render();
  }

  function generateIdeas(ids) {
    var ideas = (CP.IDEA_PROMPTS || []).filter(function (i) { return ids.indexOf(i.id) !== -1; });
    var made = ideas.map(function (i) { return Object.assign({}, i.make(), { state: 'loading' }); });
    setWidgets(function (ws) { return ws.concat(made); });
    state.thread.push({ role: 'user', text: 'Build: ' + ideas.map(function (i) { return i.prompt; }).join('; ') });
    state.thread.push({
      role: 'agency-intel',
      text: 'Generating ' + made.length + ' widget' + (made.length === 1 ? '' : 's') +
        ' now — they\'ll land on the canvas as each query resolves.'
    });
    state.builder.ideas = [];
    render();
    made.forEach(function (w, i) {
      setTimeout(function () {
        setWidgets(function (ws) {
          return ws.map(function (x) { return x.id === w.id ? Object.assign({}, x, { state: 'live' }) : x; });
        });
      }, 600 + i * 380);
    });
  }

  function openDash(id) {
    state.activeId = id;
    state.view = 'build';
    state.mode = 'edit';
    state.selectedId = null;
    var d = active();
    state.thread = [{
      role: 'agency-intel',
      text: (d.widgets || []).length
        ? 'Editing “' + d.name + '”. Tell me what to add, or ask me to change any widget.'
        : 'Ask me anything across your apps and I\'ll put the answer on the canvas. ' +
          'Pick a few starter ideas above, or just type below.'
    }];
    window.scrollTo({ top: 0 });
    render();
  }

  function newDash(widgets) {
    var id = 'dash_' + Date.now().toString(36);
    state.dashboards = [{
      id: id, name: 'Untitled dashboard', icon: 'space_dashboard',
      widgets: widgets || [], status: 'draft', assignedTo: null, delivery: null,
      owner: 'You', createdAt: TODAY, updatedAt: TODAY
    }].concat(state.dashboards);
    state.builder = freshBuilder();
    openDash(id);
  }

  function goHome() {
    state.view = 'home';
    state.activeId = null;
    window.scrollTo({ top: 0 });
    render();
  }

  /* =====================================================================
     RENDER
     ===================================================================== */

  function render() {
    document.getElementById('root').innerHTML =
      '<div class="kx-app"><div class="kx-shell"><div class="kx-main kx-main--wide">' +
      '<main class="kx-content">' +
      (state.view === 'build' ? buildHtml() : homeHtml()) +
      '</main></div></div></div>';

    // The "Add widget" builder lives in a dialog overlay outside #root, so it
    // needs its own re-render pass whenever builder state changes.
    var host = document.getElementById('cpAddWidgetHost');
    if (host && host.isConnected) host.innerHTML = widgetBuilderHtml(true);

    // Both passes above re-created Vector components, which in Safari come back
    // unthemed unless the theme stylesheet is re-announced — see KX.reapplyTheme.
    KX.reapplyTheme();

    hydrate();
  }

  function renderSavedChip() {
    var el = document.getElementById('cpSavedChip');
    if (!el) return;
    el.innerHTML = state.saving
      ? '<span class="spinner" style="width:13px;height:13px;border-top-color:var(--teal-500)"></span> Saving…'
      : micon('cloud_done', { size: 15, fill: 1, color: 'var(--teal-500)' }) + ' Saved · ' + esc(formatSaved(state.lastSavedAt));
  }

  // Post-render wiring for component instances that need properties set.
  function hydrate() {
    var search = document.getElementById('cpSearch');
    if (search) search.value = state.query;

    var pager = document.getElementById('cpPager');
    if (pager) {
      pager.total = filteredDashboards().length;
      pager.pageSize = PAGE_SIZE;
      pager.page = state.page - 1;
      pager.addEventListener('page-change', function (e) {
        var p = (e.detail && e.detail.page != null) ? e.detail.page + 1 : 1;
        if (p !== state.page) { state.page = p; render(); }
      });
    }

    // Builder selects
    var range = document.getElementById('cpBRange');
    if (range) {
      range.items = CP.DATE_RANGES.map(function (r) { return { label: r.label, value: r.value }; });
      range.value = state.builder.range;
      range.addEventListener('value-changed', function (e) {
        if (e.detail.value && e.detail.value !== state.builder.range) {
          state.builder.range = e.detail.value;
          render();
        }
      });
    }
    var ca = document.getElementById('cpCorrA');
    var cb = document.getElementById('cpCorrB');
    if (ca && cb) {
      var pairable = (document.getElementById('cpCorrPairable').value || '').split(',').filter(Boolean);
      var compatible = (document.getElementById('cpCorrCompat').value || '').split(',').filter(Boolean);
      var opt = function (id) {
        var m = CC.metricById(id);
        return { label: m ? m.label : id, value: id };
      };
      ca.items = [{ label: 'Choose X…', value: '' }].concat(pairable.map(opt));
      ca.value = state.builder.a || '';
      cb.items = [{ label: state.builder.a ? 'Choose Y…' : 'Pick X first…', value: '' }]
        .concat((state.builder.a ? compatible : []).map(opt));
      cb.value = state.builder.b || '';
      ca.addEventListener('value-changed', function (e) {
        var v = e.detail.value || null;
        if (v === state.builder.a) return;
        state.builder.a = v;
        if (v && state.builder.b && !CC.metricsCorrelatable([v, state.builder.b])) state.builder.b = null;
        render();
      });
      cb.addEventListener('value-changed', function (e) {
        var v = e.detail.value || null;
        if (v === state.builder.b) return;
        state.builder.b = v;
        render();
      });
    }

    // Rename field
    var nameField = document.getElementById('cpNameField');
    if (nameField) {
      nameField.focus();
      nameField.addEventListener('value-changed', function (e) {
        var d = active();
        if (d) d.name = e.detail.value;
      });
      nameField.addEventListener('blur', function () { state.editingName = false; render(); });
      nameField.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { state.editingName = false; render(); }
      });
    }

    // Keep the transcript pinned to the newest turn.
    var thread = document.getElementById('cpvThread');
    if (thread) thread.scrollTop = thread.scrollHeight;

    // Data Explorer prompt — restore the in-progress question after a re-render.
    var exq = document.getElementById('exQuery');
    if (exq && window.KXExplore) exq.value = window.KXExplore.state.query;
  }

  /* =====================================================================
     WIRING — delegated once on #root
     ===================================================================== */

  function wire() {
    // Delegate on `document`, not `#root`: vaadin-dialog renders its content
    // into an overlay attached to <body>, so #root-scoped delegation would
    // never see clicks inside the "Add widget" builder. Every handler below is
    // keyed on a specific data attribute, so a document-wide listener is safe.
    var root = document;

    root.addEventListener('click', function (e) {
      /* ---- home: tabs / filters / view mode ---- */
      var tab = e.target.closest('[data-cp-tab]');
      if (tab) { state.homeTab = tab.getAttribute('data-cp-tab'); render(); return; }

      var f = e.target.closest('[data-cp-filter]');
      if (f) { state.filter = f.getAttribute('data-cp-filter'); state.page = 1; render(); return; }

      var vm = e.target.closest('[data-cp-view]');
      if (vm) {
        state.viewMode = vm.getAttribute('data-cp-view');
        try { localStorage.setItem('kx-agency-intel-dash-view', state.viewMode); } catch (err) {}
        render();
        return;
      }

      if (e.target.closest('#cpNewDash')) { newDash(); return; }

      var openRow = e.target.closest('[data-open-dash]');
      if (openRow) { openDash(openRow.getAttribute('data-open-dash')); return; }

      /* ---- AI access ---- */
      var rt = e.target.closest('[data-ai-revoke-title]');
      if (rt) {
        var tid = rt.getAttribute('data-ai-revoke-title');
        state.aiGrants = Object.assign({}, state.aiGrants, {
          titles: state.aiGrants.titles.filter(function (x) { return grantId(x) !== tid; })
        });
        KX.pushToast({ title: 'Access revoked', body: 'Agency Intelligence removed from that job title\'s homepage.', icon: 'block' });
        render();
        return;
      }
      var ri = e.target.closest('[data-ai-revoke-ind]');
      if (ri) {
        var iid = ri.getAttribute('data-ai-revoke-ind');
        state.aiGrants = Object.assign({}, state.aiGrants, {
          individuals: state.aiGrants.individuals.filter(function (x) { return grantId(x) !== iid; })
        });
        render();
        return;
      }
      var fix = e.target.closest('[data-ai-fix]');
      if (fix) {
        var eid = fix.getAttribute('data-ai-fix');
        state.aiLog = state.aiLog.map(function (x) {
          return x.id === eid ? Object.assign({}, x, { flagged: true }) : x;
        });
        KX.pushToast({
          title: 'Flagged for review',
          body: 'Queued for a data-permission change.',
          icon: 'flag', tone: 'success'
        });
        render();
        return;
      }
      if (e.target.closest('#cpAiGrant')) {
        KX.pushToast({
          title: 'Grant flow',
          body: 'Pick job titles or individuals to give a homepage assistant.',
          icon: 'auto_awesome'
        });
        return;
      }

      /* ---- build view chrome ---- */
      if (e.target.closest('#cpBack')) { goHome(); return; }
      if (e.target.closest('#cpRename')) { state.editingName = true; render(); return; }
      var mode = e.target.closest('[data-cp-mode]');
      if (mode) { state.mode = mode.getAttribute('data-cp-mode'); render(); return; }
      if (e.target.closest('#cpPublish') || e.target.closest('#cpEditSchedule') || e.target.closest('#cpStatusBtn')) {
        openAssignDialog(active());
        return;
      }

      /* ---- export ---- */
      if (e.target.closest('#cpExport')) {
        state.exportMenu = !state.exportMenu;
        KXCanvas.setOpenMenu(null);        // only one menu open at a time
        render();
        return;
      }
      var xp = e.target.closest('[data-cp-export]');
      if (xp) {
        var kind = xp.getAttribute('data-cp-export');
        var dash = active();
        state.exportMenu = false;
        render();
        if (!dash) return;
        if (kind === 'csv') {
          AGENCY_INTEL_EXPORT.csv(dash.name, AGENCY_INTEL_EXPORT.tablesForDashboard(dash));
        } else {
          AGENCY_INTEL_EXPORT.print(reportPreviewHtml(dash));
        }
        return;
      }
      var wpdf = e.target.closest('[data-w-pdf]');
      if (wpdf) {
        var pid = wpdf.getAttribute('data-w-pdf');
        var pw = (active().widgets || []).find(function (x) { return x.id === pid; });
        KXCanvas.setOpenMenu(null);
        render();
        if (pw) AGENCY_INTEL_EXPORT.print(widgetDocHtml(active(), pw));
        return;
      }
      var wcsv = e.target.closest('[data-w-csv]');
      if (wcsv) {
        var cid = wcsv.getAttribute('data-w-csv');
        var cw = (active().widgets || []).find(function (x) { return x.id === cid; });
        KXCanvas.setOpenMenu(null);
        render();
        if (cw) AGENCY_INTEL_EXPORT.csv(CP.widgetTitle(cw), AGENCY_INTEL_EXPORT.tablesForWidget(cw));
        return;
      }
      if (e.target.closest('#cpAddWidget')) {
        // Reuse the builder in a dialog once the canvas already has widgets.
        openAddWidgetDialog();
        return;
      }

      /* ---- Agency Intelligence ---- */
      if (e.target.closest('#cpvSend')) { agencyIntelSend(); return; }
      if (e.target.closest('#cpvCollapse')) { state.collapsed = true; render(); return; }
      if (e.target.closest('#cpvExpand')) { state.collapsed = false; render(); return; }
      if (e.target.closest('#cpvNewChat')) {
        state.thread = [{ role: 'agency-intel', text: 'Fresh start. What should we look at?' }];
        render();
        return;
      }
      var ch = e.target.closest('[data-cpv-choice]');
      if (ch) {
        var msg = state.thread[+ch.getAttribute('data-cpv-choice')];
        var c = msg && msg.choices && msg.choices[+ch.getAttribute('data-cpv-choice-i')];
        if (c) agencyIntelSend(c.send);
        return;
      }

      /* ---- widget card chrome ---- */
      var wm = e.target.closest('[data-w-menu]');
      if (wm) {
        var wid = wm.getAttribute('data-w-menu');
        KXCanvas.setOpenMenu(KXCanvas.getOpenMenu() === wid ? null : wid);
        state.exportMenu = false;          // only one menu open at a time
        render();
        return;
      }
      var wask = e.target.closest('[data-w-ask]');
      if (wask) {
        var aid = wask.getAttribute('data-w-ask');
        var aw = (active().widgets || []).find(function (x) { return x.id === aid; });
        state.selectedId = aid;
        KXCanvas.setOpenMenu(null);
        state.collapsed = false;
        pushAgencyIntel({
          text: 'What should I change about “' + CP.widgetTitle(aw) + '”? ' +
            'Try “make it a bar chart”, “by station”, or “last 90 days”.'
        });
        return;
      }
      var wsz = e.target.closest('[data-w-size]');
      if (wsz) {
        var sid = wsz.getAttribute('data-w-size');
        var sw = +wsz.getAttribute('data-w-size-val');
        KXCanvas.setOpenMenu(null);
        setWidgets(function (ws) {
          return ws.map(function (x) { return x.id === sid ? Object.assign({}, x, { w: sw }) : x; });
        });
        return;
      }
      var wrm = e.target.closest('[data-w-remove]');
      if (wrm) {
        var rid = wrm.getAttribute('data-w-remove');
        KXCanvas.setOpenMenu(null);
        setWidgets(function (ws) { return ws.filter(function (x) { return x.id !== rid; }); });
        if (state.selectedId === rid) state.selectedId = null;
        return;
      }

      /* ---- widget date range ---- */
      var ro = e.target.closest('[data-range-open]');
      if (ro) {
        var roid = ro.getAttribute('data-range-open');
        KXCanvas.setOpenRange(KXCanvas.getOpenRange() === roid ? null : roid);
        render();
        return;
      }
      var rs = e.target.closest('[data-range-set]');
      if (rs) {
        var rsid = rs.getAttribute('data-range-set');
        var val = rs.getAttribute('data-range-val');
        KXCanvas.setOpenRange(null);
        if (state.mode === 'edit') {
          KXCanvas.setLocalRange(rsid, null);
          setWidgets(function (ws) {
            return ws.map(function (x) { return x.id === rsid ? Object.assign({}, x, { dateRange: val }) : x; });
          });
        } else {
          KXCanvas.setLocalRange(rsid, val);   // viewer: explore only
          render();
        }
        return;
      }
      var rc = e.target.closest('[data-range-clear]');
      if (rc) { KXCanvas.setLocalRange(rc.getAttribute('data-range-clear'), null); render(); return; }

      /* ---- builder ---- */
      var bt = e.target.closest('[data-b-tab]');
      if (bt) {
        state.builder.tab = bt.getAttribute('data-b-tab');
        state.builder.mode = null;          // Advanced always opens on its option list
        render();
        return;
      }
      // Advanced: drill into an option, or hand off to the chat dock.
      var bmo = e.target.closest('[data-b-mode]');
      if (bmo) {
        var mode = bmo.getAttribute('data-b-mode');
        if (mode === 'ask') { focusChat(); return; }
        state.builder.mode = mode;
        render();
        return;
      }
      if (e.target.closest('[data-b-mode-back]')) { state.builder.mode = null; render(); return; }
      if (e.target.closest('#cpBAskFocus')) { focusChat(); return; }
      var bm = e.target.closest('[data-b-metric]');
      if (bm) {
        var mid = bm.getAttribute('data-b-metric');
        state.builder.metric = mid;
        state.builder.viz = CC.DEFAULT_VIZ[mid] || 'kpi';
        state.builder.include = [];
        render();
        return;
      }
      var bv = e.target.closest('[data-b-viz]');
      if (bv) { state.builder.viz = bv.getAttribute('data-b-viz'); state.builder.include = []; render(); return; }
      var bc = e.target.closest('[data-b-cat]');
      if (bc) {
        var cats = CC.metricCategories(state.builder.metric, state.builder.viz);
        var v = bc.getAttribute('data-b-cat');
        var allOn = !state.builder.include.length;
        var base = allOn ? cats.values.slice() : state.builder.include.slice();
        var bi = base.indexOf(v);
        if (bi === -1) base.push(v); else base.splice(bi, 1);
        if (!base.length) return;                                 // never allow an empty chart
        state.builder.include = base.length === cats.values.length ? [] : base;
        render();
        return;
      }
      if (e.target.closest('[data-b-cats-all]')) { state.builder.include = []; render(); return; }
      if (e.target.closest('#cpBAdd')) {
        addWidget({
          metricId: state.builder.metric, viz: state.builder.viz,
          dateRange: state.builder.range,
          include: state.builder.include.length ? state.builder.include : undefined
        });
        return;
      }
      var bs = e.target.closest('[data-b-sugg]');
      if (bs) {
        var sg = CC.CORRELATION_SUGGESTIONS.find(function (x) { return x.id === bs.getAttribute('data-b-sugg'); });
        if (sg) {
          state.builder.a = sg.metricIds[0];
          state.builder.b = sg.metricIds[1];
          state.builder.corrViz = 'scatter';
          render();
        }
        return;
      }
      var bcv = e.target.closest('[data-b-corrviz]');
      if (bcv) { state.builder.corrViz = bcv.getAttribute('data-b-corrviz'); render(); return; }
      if (e.target.closest('#cpBAddCorr')) {
        addWidget({ metricIds: [state.builder.a, state.builder.b], viz: state.builder.corrViz });
        return;
      }
      // Summary-table builder: toggle a measure, then add the table.
      var btm = e.target.closest('[data-b-tmetric]');
      if (btm) {
        var tmid = btm.getAttribute('data-b-tmetric');
        var tix = state.builder.tableIds.indexOf(tmid);
        if (tix === -1) state.builder.tableIds.push(tmid); else state.builder.tableIds.splice(tix, 1);
        render();
        return;
      }
      if (e.target.closest('#cpBAddTable')) {
        addWidget({
          kind: 'metrics_table', viz: 'metrics_table',
          metricIds: state.builder.tableIds.slice(),
          heading: state.builder.tableHeading.trim() || 'Summary table'
        });
        return;
      }
      if (e.target.closest('#cpBAddText')) {
        if (!state.builder.textHeading.trim() && !state.builder.textBody.trim()) return;
        addWidget({
          kind: 'text', viz: 'text', w: 12,
          heading: state.builder.textHeading.trim(),
          body: state.builder.textBody.trim()
        });
        return;
      }

      var bi2 = e.target.closest('[data-b-idea]');
      if (bi2) {
        var iid2 = bi2.getAttribute('data-b-idea');
        var ix = state.builder.ideas.indexOf(iid2);
        if (ix === -1) state.builder.ideas.push(iid2); else state.builder.ideas.splice(ix, 1);
        render();
        return;
      }
      if (e.target.closest('#cpBGenerate')) { generateIdeas(state.builder.ideas.slice()); return; }

      /* ---- select a widget by clicking it ---- */
      var card = e.target.closest('.cpw-card');
      if (card && state.mode === 'edit') {
        var cid = card.getAttribute('data-widget-id');
        state.selectedId = state.selectedId === cid ? null : cid;
        render();
      }
    });

    /* ---- search + chat input ---- */
    root.addEventListener('input', function (e) {
      // Builder text fields update state WITHOUT a re-render, so the caret
      // stays put. Anything that depends on them is patched in place below.
      if (e.target.id === 'cpBTableHeading') {
        state.builder.tableHeading = e.target.value;
        var pv = document.querySelector('.cp-builder .cpw-title');
        if (pv) pv.textContent = state.builder.tableHeading.trim() || 'Summary table';
        return;
      }
      if (e.target.id === 'cpBTextHeading' || e.target.id === 'cpBTextBody') {
        if (e.target.id === 'cpBTextHeading') state.builder.textHeading = e.target.value;
        else state.builder.textBody = e.target.value;
        var addText = document.getElementById('cpBAddText');
        if (addText) {
          if (state.builder.textHeading.trim() || state.builder.textBody.trim()) addText.removeAttribute('disabled');
          else addText.setAttribute('disabled', '');
        }
        return;
      }
      if (e.target.id === 'cpvDraft') {
        state.draft = e.target.value;
        var btn = document.getElementById('cpvSend');
        if (btn) {
          var ready = state.draft.trim() && !state.thinking;
          btn.style.background = ready ? 'var(--ink-900)' : 'var(--ink-200)';
          btn.style.color = ready ? 'white' : 'var(--ink-500)';
          btn.style.cursor = ready ? 'pointer' : 'default';
          if (ready) btn.removeAttribute('disabled'); else btn.setAttribute('disabled', '');
        }
      }
    });

    root.addEventListener('value-changed', function (e) {
      // Commentary widgets are edited in place on the canvas. Write straight
      // into the active dashboard rather than going through patchActive() —
      // that re-renders, which would drop the caret on every keystroke.
      var tw = e.target.closest && e.target.closest('[data-text-widget]');
      if (tw) {
        var twid = tw.getAttribute('data-text-widget');
        var val = e.detail.value || '';
        var dash = active();
        if (dash) {
          dash.widgets = dash.widgets.map(function (w) {
            return w.id === twid ? Object.assign({}, w, { body: val }) : w;
          });
          dash.updatedAt = TODAY;
          state.lastSavedAt = Date.now();
          renderSavedChip();
        }
        return;
      }
      if (e.target.id === 'cpSearch') {
        state.query = e.detail.value || '';
        state.page = 1;
        // Re-render the list but keep focus in the field.
        render();
        var s = document.getElementById('cpSearch');
        if (s) { s.focus(); }
      }
    });

    root.addEventListener('keydown', function (e) {
      if (e.target.id === 'cpvDraft' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        agencyIntelSend();
      }
      var row = e.target.closest && e.target.closest('[data-open-dash]');
      if (row && e.key === 'Enter') openDash(row.getAttribute('data-open-dash'));
    });

    /* ---- sortable headers ---- */
    root.addEventListener('sort-direction-change', function (e) {
      var h = e.target.closest('[data-cp-sort]');
      if (!h) return;
      var field = h.getAttribute('data-cp-sort');
      var dir = e.detail && e.detail.direction;
      state.sort = dir ? { field: field, dir: dir } : { field: 'updated', dir: 'desc' };
      state.page = 1;
      render();
    });

    // Close widget menus / range popovers on an outside click.
    document.addEventListener('mousedown', function (e) {
      var changed = false;
      // NB: never re-render on mousedown over a menu trigger. Doing so
      // replaces the element between mousedown and click, and the click is
      // swallowed — the button appears dead. Each trigger closes the other
      // menu in its own click handler instead.
      var onTrigger = e.target.closest('[data-w-menu]') || e.target.closest('#cpExport');
      if (KXCanvas.getOpenMenu() && !e.target.closest('.kx-menu') && !onTrigger) {
        KXCanvas.setOpenMenu(null); changed = true;
      }
      if (state.exportMenu && !e.target.closest('.kx-menu') && !onTrigger) {
        state.exportMenu = false; changed = true;
      }
      if (KXCanvas.getOpenRange() && !e.target.closest('.kx-menu') && !e.target.closest('[data-range-open]')) {
        KXCanvas.setOpenRange(null); changed = true;
      }
      if (changed) render();
    });
  }

  // "Add widget" once the canvas is populated — the same builder, in a dialog.
  function openAddWidgetDialog() {
    state.builder = freshBuilder();
    KX.openDialog({
      title: 'Add a widget',
      subtitle: 'Chart one metric, or go Advanced — correlate, tabulate, write, or ask.',
      icon: 'add_chart',
      accent: 'var(--amber-500)',
      width: '860px',
      body: '<div id="cpAddWidgetHost">' + widgetBuilderHtml(true) + '</div>',
      onMount: function (body, dlg) {
        // The builder's own Add buttons close the dialog once a widget lands.
        body.addEventListener('click', function (e) {
          if (e.target.closest('#cpBAdd') || e.target.closest('#cpBAddCorr') ||
              e.target.closest('#cpBGenerate') || e.target.closest('#cpBAddTable') ||
              e.target.closest('#cpBAddText')) {
            setTimeout(function () { dlg.opened = false; }, 0);
          }
        });
      }
    });
  }

  /* =====================================================================
     BOOT
     ===================================================================== */

  // Deep links, so the Hub's Agency Intelligence card hand-off keeps working.
  (function deepLink() {
    var p = new URLSearchParams(location.search);
    if (p.get('tab') === 'ai') { state.homeTab = 'ai'; return; }
    if (p.get('new')) { newDash(); return; }
    var did = p.get('dashboard') || p.get('custom');
    if (did) {
      // A dashboard published from the Hub's Agency Intelligence card lives in the shared
      // custom-dashboards store; adapt it into this page's shape.
      var existing = state.dashboards.find(function (d) { return d.id === did; });
      if (existing) { openDash(did); return; }
      var custom = CC.findDashboard(did);
      if (custom) {
        state.dashboards = [{
          id: custom.id, name: custom.name, icon: 'space_dashboard',
          widgets: (custom.metrics || []).map(function (m) {
            return CP.newWidget({ metricId: m.id, viz: m.viz });
          }),
          status: 'draft', assignedTo: null, delivery: null, owner: 'You',
          createdAt: TODAY, updatedAt: TODAY
        }].concat(state.dashboards);
        openDash(custom.id);
      }
    }
  })();

  render();
  wire();

  KX.mountPrototypeFab({
    role: state.role,
    onRoleChange: function (r) { state.role = r; render(); }
  });
  KX.onFlagsChange(function () { render(); });

  window.KXAgencyIntelPage = {
    state: state,
    render: render,
    // Used by the Data Explorer's "Pin to dashboard": an exploration becomes a
    // real, editable dashboard seeded with that finding.
    createDashboardWith: function (widgets) {
      newDash(widgets);
      KX.pushToast({
        title: 'Pinned to a new dashboard',
        body: 'Your exploration is now an editable dashboard.',
        icon: 'push_pin', tone: 'success'
      });
    }
  };
})();
