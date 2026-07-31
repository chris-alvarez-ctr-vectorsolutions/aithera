/* global window, document, KEYSTONE, KX, KXHero, KXAgencyIntel */
/* ========================================================================
   hub.js — Keystone Department Hub. Vanilla JS.
   ------------------------------------------------------------------------
   The role-adaptive readiness surface:
     · Greeting header with vital-sign tiles (always)
     · Role hero — Battalion Pulse / Compliance / published dashboards (v2)
     · Filter bar — status buckets, filter popovers, chips, saved views (v2)
     · Task table — sortable, expandable, with per-type detail
     · Reminder / Reassign dialogs (v2)

   Persisted prototype defaults, baked in from the design tool's tweak block.
   The design tool's own Tweaks panel is host chrome, not product UI, so its
   values live here as constants instead.
   ======================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var esc = KX.esc, micon = KX.micon;

  var DEFAULTS = {
    defaultRole: 'chief',
    density: 'compact',
    theme: 'slate',
    accent: '#f5a524'
  };

  /* ---------------------------------------------------------------------
     FILTER LOGIC
     --------------------------------------------------------------------- */

  function applyFilter(tasks, filter, search) {
    var out = tasks;
    if (filter) {
      if (filter.types && filter.types.length) out = out.filter(function (t) { return filter.types.indexOf(t.type) !== -1; });
      if (filter.statuses && filter.statuses.length) out = out.filter(function (t) { return filter.statuses.indexOf(t.status) !== -1; });
      if (filter.bands && filter.bands.length) out = out.filter(function (t) { return filter.bands.indexOf(t.priorityBand) !== -1; });
      if (filter.sources && filter.sources.length) out = out.filter(function (t) { return filter.sources.indexOf(t.source) !== -1; });
      if (filter.stations && filter.stations.length) out = out.filter(function (t) { return filter.stations.indexOf(t.station) !== -1; });
      if (filter.battalions && filter.battalions.length) {
        out = out.filter(function (t) {
          var s = K.helpers.stationById(t.station);
          return s && filter.battalions.indexOf(s.battalion) !== -1;
        });
      }
      if (filter.assignees && filter.assignees.length) {
        out = out.filter(function (t) {
          return t.assignees.some(function (a) { return filter.assignees.indexOf(a) !== -1; });
        });
      }
      if (filter.shifts && filter.shifts.length) {
        out = out.filter(function (t) {
          return t.assignees.some(function (aId) {
            var p = K.helpers.personById(aId);
            return p && filter.shifts.indexOf(p.shift) !== -1;
          });
        });
      }
      if (filter.dueWithinHours) {
        out = out.filter(function (t) {
          return t.dueAt && (t.dueAt - K.NOW) / 3600000 <= filter.dueWithinHours && (t.dueAt - K.NOW) >= -24;
        });
      }
      if (filter.mandatory) out = out.filter(function (t) { return t.meta && t.meta.mandatory; });
    }
    if (search && search.trim()) {
      var q = search.trim().toLowerCase();
      out = out.filter(function (t) {
        if (t.title.toLowerCase().indexOf(q) !== -1) return true;
        if (t.typeLabel.toLowerCase().indexOf(q) !== -1) return true;
        var station = K.helpers.stationById(t.station);
        if (station && (station.name.toLowerCase().indexOf(q) !== -1 || station.label.toLowerCase().indexOf(q) !== -1)) return true;
        var people = t.assignees.map(function (id) { return K.helpers.personById(id); }).filter(Boolean);
        return people.some(function (p) { return (p.first + ' ' + p.last).toLowerCase().indexOf(q) !== -1; });
      });
    }
    return out;
  }

  // Four buckets, multi-selectable. "All" clears the status filter; the others
  // toggle and union with each other.
  var STATUS_BUCKETS = [
    { id: 'all',   label: 'All',      statuses: null,                       tip: 'Every open task in the current view' },
    { id: 'late',  label: 'Late',     statuses: ['overdue', 'past_sla'],    tip: 'Overdue or past SLA', tone: 'coral' },
    { id: 'risk',  label: 'At Risk',  statuses: ['at_risk'],                tip: 'Within 24h of due, or 3+ days past SLA cushion', tone: 'amber' },
    { id: 'track', label: 'On Track', statuses: ['on_track', 'within_sla'], tip: 'Progressing as planned', tone: 'teal' }
  ];
  var BUCKET_TONES = {
    coral: { fg: 'var(--coral-500)', bg: 'var(--coral-50)' },
    amber: { fg: 'var(--amber-600)', bg: 'var(--amber-50)' },
    teal:  { fg: 'var(--teal-500)',  bg: 'var(--teal-50)' },
    none:  { fg: 'var(--ink-900)',   bg: 'var(--surface-1)' }
  };

  function bucketCounts(tasks) {
    var c = { all: 0, late: 0, risk: 0, track: 0 };
    tasks.forEach(function (t) {
      if (t.status === 'completed') return;
      c.all++;
      if (t.status === 'overdue' || t.status === 'past_sla') c.late++;
      else if (t.status === 'at_risk') c.risk++;
      else if (t.status === 'on_track' || t.status === 'within_sla') c.track++;
    });
    return c;
  }

  /* ---------------------------------------------------------------------
     STATE
     --------------------------------------------------------------------- */

  var state = {
    role: DEFAULTS.defaultRole,
    density: DEFAULTS.density,
    search: '',
    filter: {},
    activeViewId: null,
    sortField: 'priority',
    sortDir: 'desc',
    expanded: {},          // task id → true
    filterOpen: false,
    openMenu: null,        // 'views' | 'bands' | 'sources' | 'types' | 'battalions'
    customViews: [],
    userDefaultView: {}
  };

  try { state.customViews = JSON.parse(localStorage.getItem('keystone.customViews') || '[]'); } catch (e) {}
  try { state.userDefaultView = JSON.parse(localStorage.getItem('keystone.userDefaultViews') || '{}'); } catch (e) {}

  // Sibling pages read this so the theme stays in sync.
  try { localStorage.setItem('keystone.theme', DEFAULTS.theme); } catch (e) {}
  if (DEFAULTS.theme && DEFAULTS.theme !== 'ember') document.body.setAttribute('data-theme', DEFAULTS.theme);

  var SORT_DEFAULT_DIR = {
    priority: 'desc', due: 'asc', app: 'asc', task: 'asc',
    assignee: 'asc', status: 'asc', station: 'asc'
  };
  var STATUS_ORDER = {
    overdue: 0, past_sla: 0, at_risk: 1, due_soon: 2,
    in_progress: 3, awaiting: 4, scheduled: 5, ok: 6
  };

  function allSavedViews() { return K.SAVED_VIEWS.concat(state.customViews); }

  // Firefighter is hard-scoped to the signed-in user: they see only their own
  // tasks regardless of which saved view is active.
  function roleScope() {
    var r = K.ROLES[state.role];
    return (r && r.hardScoped && r.selfId) ? { assignees: [r.selfId] } : null;
  }

  // Battalion/station scopes are gated in v1 — strip them defensively at the
  // apply point so a stale saved view can't sneak through when the flag is off.
  function scrubFilter(f) {
    var out = Object.assign({}, f);
    if (!KX.getFlags().futureOn) { delete out.battalions; delete out.stations; }
    return out;
  }

  function visibleTasks() {
    var f = scrubFilter(state.filter);
    return applyFilter(K.TASKS, Object.assign({}, f, roleScope() || {}, { search: undefined }), state.search);
  }

  function sortTasks(tasks) {
    var field = state.sortField;
    if (!KX.getFlags().futureOn && field === 'station') field = 'priority';
    var arr = tasks.slice();
    arr.sort(function (a, b) {
      var r = 0;
      if (field === 'priority') r = a.priorityScore - b.priorityScore;
      else if (field === 'due') {
        var ax = a.dueAt ? a.dueAt.getTime() : Number.MAX_SAFE_INTEGER;
        var bx = b.dueAt ? b.dueAt.getTime() : Number.MAX_SAFE_INTEGER;
        r = ax - bx;
      }
      else if (field === 'station') r = a.station.localeCompare(b.station) || b.priorityScore - a.priorityScore;
      else if (field === 'app') r = a.source.localeCompare(b.source) || b.priorityScore - a.priorityScore;
      else if (field === 'task') r = a.title.localeCompare(b.title);
      else if (field === 'assignee') {
        var pa = a.assignees[0] ? K.helpers.personById(a.assignees[0]) : null;
        var pb = b.assignees[0] ? K.helpers.personById(b.assignees[0]) : null;
        r = ((pa ? pa.last + ' ' + pa.first : '~~~')).localeCompare(pb ? pb.last + ' ' + pb.first : '~~~');
      }
      else if (field === 'status') {
        r = (STATUS_ORDER[a.status] == null ? 99 : STATUS_ORDER[a.status]) -
            (STATUS_ORDER[b.status] == null ? 99 : STATUS_ORDER[b.status]);
      }
      return state.sortDir === 'desc' ? -r : r;
    });
    return arr;
  }

  /* ---------------------------------------------------------------------
     GREETING HEADER
     --------------------------------------------------------------------- */

  function greetingTime(d) {
    var h = d.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function greetingFor(r, c) {
    var late = c.overdue + (c.past_sla || 0);
    if (late > 0) {
      if (r.hero === 'crew') return 'Your crew has ' + late + ' late item' + (late === 1 ? '' : 's') + '.';
      if (r.hero === 'personal') return 'You\'re behind on ' + late + ' task' + (late === 1 ? '' : 's') + '.';
      return late + ' item' + (late === 1 ? '' : 's') + ' need attention today.';
    }
    if (c.at_risk > 0) return c.at_risk + ' task' + (c.at_risk === 1 ? '' : 's') + ' at risk — but on the rails.';
    return 'You\'re clear. Nothing\'s on fire.';
  }

  // RETIRED — the descriptive per-role sentence cost two lines in the greeting.
  // The slim header shows the role's scope + inline task counts instead. Kept
  // because the copy is worth restoring if the header ever gets its height back.
  function subtitleFor(r) {
    if (r.hero === 'coverage') return 'Coverage and apparatus status across your battalion. Late shifts, gear, and inspections surface here first.';
    if (r.hero === 'compliance') return 'Department-wide credential health, cohort progress, and mandatory training completion.';
    if (r.hero === 'crew') return 'What your crew owes, today and tomorrow. Your shift, your station, your watch list.';
    if (r.hero === 'personal') return 'Just your stuff — inspections, training, and shift confirmations assigned to you. Knock these out before end-of-shift.';
    return '';
  }

  function countsOf(tasks) {
    var c = { overdue: 0, at_risk: 0, due_soon: 0, on_track: 0, past_sla: 0, total: tasks.length, late_or_risk: 0, p0: 0 };
    tasks.forEach(function (t) {
      c[t.status] = (c[t.status] || 0) + 1;
      if (t.status === 'overdue' || t.status === 'past_sla' || t.status === 'at_risk') c.late_or_risk++;
      if (t.priorityBand === 'P0') c.p0++;
    });
    return c;
  }

  var VITAL_TONES = {
    bad:  { bg: 'var(--coral-50)', fg: 'var(--coral-500)', border: 'var(--coral-100)' },
    warn: { bg: 'var(--amber-50)', fg: 'var(--amber-600)', border: 'var(--amber-100)' },
    ink:  { bg: 'var(--surface-3)', fg: 'var(--ink-800)', border: 'var(--ink-100)' }
  };

  // The day overview, inline. Replaces the old right-hand rail of three big-number
  // tiles (~70px) with a single ~20px line, freeing the fold for the published
  // dashboard. These are TASK-QUEUE counts — deliberately a different data layer
  // from the dashboard's readiness metrics, so the two don't say the same thing.
  function vitalLine(tiles) {
    var shown = tiles.filter(function (t) { return t.n > 0; });
    if (!shown.length) return '';
    return '<span class="kx-vitalline">' + shown.map(function (t) {
      var c = VITAL_TONES[t.tone];
      return '<span class="kx-vitalline__stat" title="' + KX.attr(t.label) + '">' +
        '<span class="dot" style="background:' + c.fg + '"></span>' +
        '<span class="n" style="color:' + c.fg + '">' + t.n + '</span>' +
        '<span class="lbl">' + esc(t.label.toLowerCase()) + '</span></span>';
    }).join('<span class="kx-vitalline__sep">·</span>') + '</span>';
  }

  function greetingHeader(tasks) {
    var r = K.ROLES[state.role];
    var c = countsOf(tasks);
    // The greeting date/time shows real time, even though task data stays
    // anchored to a fixed NOW for deterministic relative dates.
    var TODAY = new Date();
    var late = c.overdue + (c.past_sla || 0);
    var attention = late + c.at_risk;
    var headlineN = attention || c.due_soon || c.total;
    var headlineWord = attention
      ? (r.hero === 'crew' ? 'need your crew' : r.hero === 'personal' ? 'need you' : 'need attention')
      : 'in flight';

    var tiles = r.hero === 'coverage' ? [
      { n: late, label: 'Late', tone: 'bad', icon: 'priority_high' },
      { n: c.at_risk, label: 'At risk', tone: 'warn', icon: 'warning' },
      { n: c.p0, label: 'P0 / P1', tone: 'ink', icon: 'flag' }
    ] : r.hero === 'compliance' ? [
      { n: late, label: 'Mandatory late', tone: 'bad', icon: 'priority_high' },
      { n: c.at_risk, label: 'Expiring < 30d', tone: 'warn', icon: 'event_busy' },
      { n: c.total, label: 'In your queue', tone: 'ink', icon: 'inventory_2' }
    ] : r.hero === 'personal' ? [
      { n: late, label: 'Late', tone: 'bad', icon: 'priority_high' },
      { n: c.at_risk + c.due_soon, label: 'Due soon', tone: 'warn', icon: 'schedule' },
      { n: c.total, label: 'My tasks', tone: 'ink', icon: 'assignment_ind' }
    ] : [
      { n: late, label: 'Late on shift', tone: 'bad', icon: 'priority_high' },
      { n: c.at_risk, label: 'Slipping', tone: 'warn', icon: 'warning' },
      { n: c.due_soon, label: 'Due today', tone: 'ink', icon: 'schedule' }
    ];

    var pip = late > 0 ? 'var(--coral-400)' : c.at_risk > 0 ? 'var(--amber-400)' : 'var(--teal-400)';
    var glow = late > 0 ? 'rgba(232,90,79,0.7)' : c.at_risk > 0 ? 'rgba(245,158,11,0.7)' : 'rgba(127,192,179,0.7)';

    var headline = attention > 0
      ? '<span class="num" style="color:' + (late > 0 ? 'var(--coral-500)' : 'var(--amber-500)') + '">' +
        headlineN + '</span> items ' + esc(headlineWord) + ' <span class="muted">today.</span>'
      : esc(greetingFor(r, c));

    // Single column now — the published dashboard below is what we want the eye to
    // land on, so the greeting gives back its right-hand rail and most of its height.
    var stats = vitalLine(tiles);
    return '<div class="kx-greeting">' +
      '<div class="kx-eyebrow"><span class="pip" style="background:' + pip + ';box-shadow:0 0 8px ' + glow + '"></span>' +
      '<span class="txt">' + esc(greetingTime(TODAY)) + ' · ' +
      esc(TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })) + '</span></div>' +
      '<h1>' + headline + '</h1>' +
      '<div class="kx-greeting-sub">' +
      '<span class="kx-greeting-scope">' + esc(r.sub || '') + '</span>' +
      (stats ? '<span class="kx-vitalline__sep">·</span>' + stats : '') +
      '</div></div>';
  }

  /* ---------------------------------------------------------------------
     FILTER BAR
     --------------------------------------------------------------------- */

  var FILTER_SECTIONS = function () {
    return [
      { key: 'bands', label: 'Priority', icon: 'signal_cellular_alt', options: [
        { value: 'P0', label: 'P0 — Critical' }, { value: 'P1', label: 'P1 — High' },
        { value: 'P2', label: 'P2 — Medium' }, { value: 'P3', label: 'P3 — Low' }
      ] },
      { key: 'sources', label: 'App', icon: 'apps', options: Object.keys(K.SOURCES).map(function (id) {
        return { value: id, label: K.SOURCES[id].name };
      }) },
      { key: 'types', label: 'Task Type', icon: 'category', options: Object.keys(K.TASK_TYPES).map(function (k) {
        return { value: k, label: K.TASK_TYPES[k].label };
      }) },
      { key: 'battalions', label: 'Battalion', icon: 'apartment', futureOnly: true, options: [
        { value: 'B-1', label: 'B-1' }, { value: 'B-2', label: 'B-2' }, { value: 'B-3', label: 'B-3' }
      ] }
    ];
  };

  function activeChips() {
    var flags = KX.getFlags();
    var f = state.filter;
    var hardScoped = !!(K.ROLES[state.role] && K.ROLES[state.role].hardScoped);
    var chips = [];
    var has = function (k) { return f[k] && f[k].length > 0; };
    // Status is shown via the segmented control, so it's omitted here.
    if (has('bands')) chips.push({ key: 'bands', kind: 'Priority', label: f.bands.join(' · ') });
    if (has('sources')) chips.push({ key: 'sources', kind: 'App', label: f.sources.map(function (s) { return K.SOURCES[s].short; }).join(', ') });
    if (has('types')) chips.push({ key: 'types', kind: 'Type', label: f.types.length + ' type' + (f.types.length === 1 ? '' : 's') });
    if (flags.futureOn && has('battalions')) chips.push({ key: 'battalions', kind: 'Battalion', label: f.battalions.join(', ') });
    if (flags.futureOn && has('stations')) chips.push({ key: 'stations', kind: 'Station', label: f.stations.map(function (s) {
      var st = K.helpers.stationById(s); return st ? st.name : s;
    }).join(', ') });
    // For hard-scoped roles the assignee scope is implicit and permanent, so
    // it's never surfaced as a removable chip.
    if (has('assignees') && !hardScoped) chips.push({ key: 'assignees', kind: 'Assignee', label: f.assignees.length + ' person' + (f.assignees.length === 1 ? '' : 's') });
    if (f.dueWithinHours) chips.push({ key: 'dueWithinHours', kind: 'Due in', label: '≤ ' + f.dueWithinHours + 'h' });
    if (f.mandatory) chips.push({ key: 'mandatory', kind: 'Mandatory', label: 'mandatory' });
    return chips;
  }

  function filterDropdown(sec) {
    var sel = state.filter[sec.key] || [];
    var isOpen = state.openMenu === sec.key;
    return '<div style="position:relative">' +
      '<button class="kx-pill kx-btn-elev' + (sel.length ? ' is-on' : '') + '" data-menu-toggle="' + sec.key + '" ' +
      'style="padding:6px 12px">' + micon(sec.icon, { size: 14 }) + esc(sec.label) +
      (sel.length ? '<span class="count">' + sel.length + '</span>' : '') +
      micon('expand_more', { size: 14 }) + '</button>' +
      (isOpen ? '<div class="kx-menu kx-menu--left" style="max-height:320px;overflow-y:auto">' +
        sec.options.map(function (o) {
          return '<label class="kx-menu-check">' +
            '<vaadin-checkbox data-filter-key="' + KX.attr(sec.key) + '" data-filter-val="' + KX.attr(o.value) + '"' +
            (sel.indexOf(o.value) !== -1 ? ' checked' : '') + '></vaadin-checkbox>' +
            '<span>' + esc(o.label) + '</span></label>';
        }).join('') + '</div>' : '') +
      '</div>';
  }

  function filterBar(filtered) {
    var flags = KX.getFlags();
    var r = K.ROLES[state.role] || {};
    var hardScoped = !!r.hardScoped;
    var currentUserId = r.selfId;
    var chips = activeChips();
    var count = filtered.length;

    // Bucket counts ignore the status filter itself, so the segmented control
    // always shows the full breakdown of the current scope.
    var counts = bucketCounts(applyFilter(
      K.TASKS,
      Object.assign({}, scrubFilter(state.filter), roleScope() || {}, { statuses: undefined }),
      state.search
    ));

    var activeBucketIds = (!state.filter.statuses || !state.filter.statuses.length)
      ? ['all']
      : STATUS_BUCKETS.filter(function (b) {
          return b.statuses && b.statuses.some(function (s) { return state.filter.statuses.indexOf(s) !== -1; });
        }).map(function (b) { return b.id; });

    // `selected` is assigned as a property after upgrade — see setToggleGroup.
    var buckets = '<vwc-toggle-button-group class="kx-buckets" multiple id="kxBuckets" ' +
      'aria-label="Filter by status">' +
      STATUS_BUCKETS.map(function (b) {
        var tone = BUCKET_TONES[b.tone || 'none'];
        var on = activeBucketIds.indexOf(b.id) !== -1;
        // NB: never set `checked` on vwc-toggle-button from markup — the
        // setter writes through to a light-DOM input the component hasn't
        // created yet at parse time, which throws. The group's `selected`
        // property (set in syncBucketGroup) is the only supported route.
        return '<vwc-toggle-button value="' + b.id + '" title="' + KX.attr(b.tip) + '"' +
          ' style="' + (on ? 'color:' + tone.fg : '') + '">' +
          esc(b.label) + '<span class="bn">' + counts[b.id] + '</span></vwc-toggle-button>';
      }).join('') + '</vwc-toggle-button-group>';

    // "My tasks" quick filter — admin/supervisor roles only. Active when the
    // current user is the *only* assignee in the filter, so multi-person
    // drill-downs don't light it up.
    var myActive = Array.isArray(state.filter.assignees) &&
      state.filter.assignees.length === 1 && state.filter.assignees[0] === currentUserId;
    var myTasks = (currentUserId && !hardScoped)
      ? '<button class="kx-pill kx-btn-elev kx-desktop-only' + (myActive ? ' is-on' : '') + '" id="kxMyTasks" ' +
        'aria-pressed="' + myActive + '" title="' + (myActive ? 'Showing only tasks assigned to you' : 'Filter to tasks assigned to you') + '"' +
        (myActive ? ' style="background:var(--amber-500);border-color:var(--amber-500);color:var(--ink-900)"' : '') + '>' +
        micon(myActive ? 'person' : 'person_outline', { size: 14, fill: myActive ? 1 : 0 }) + 'My tasks' +
        (myActive ? micon('check', { size: 12 }) : '') + '</button>'
      : '';

    var sections = FILTER_SECTIONS().filter(function (s) { return flags.futureOn || !s.futureOnly; });

    return '<div class="kx-filterbar">' +
      '<div class="kx-filterbar-row">' +
      '<span class="kx-count">' + count + ' <span>task' + (count === 1 ? '' : 's') + '</span></span>' +
      myTasks + buckets +
      '<button class="kx-pill kx-btn-elev kx-desktop-only' + (state.filterOpen ? ' is-on' : '') + '" id="kxFilterToggle" ' +
      'aria-expanded="' + state.filterOpen + '">' + micon('tune', { size: 14 }) + 'Filter' +
      (chips.length ? '<span class="count">' + chips.length + '</span>' : '') +
      micon(state.filterOpen ? 'expand_less' : 'expand_more', { size: 14 }) + '</button>' +
      '<div style="display:flex;align-items:center;gap:6px;margin-left:auto">' +
      // Saved-view management on the table is a phase-2 surface.
      (flags.futureOn ? viewsKebab() : '') +
      (flags.futureOn
        ? '<button class="kx-pill kx-pill--icon kx-btn-elev" id="kxDensity" title="Toggle density">' +
          micon(state.density === 'compact' ? 'density_small' : 'density_medium', { size: 16 }) + '</button>'
        : '') +
      // Prioritization settings — admin-only, icon-only.
      (r.admin
        ? '<a class="kx-pill kx-pill--icon kx-btn-elev" href="prioritization-settings.html" ' +
          'title="Prioritization settings" aria-label="Prioritization settings" style="text-decoration:none;color:var(--ink-700)">' +
          micon('settings', { size: 16 }) + '</a>'
        : '') +
      '</div></div>' +

      (state.filterOpen
        ? '<div class="kx-filter-panel kx-desktop-only">' +
          sections.map(filterDropdown).join('') +
          (chips.length ? '<button class="kx-clear-all" data-clear-all>' + micon('close', { size: 14 }) + ' Clear all</button>' : '') +
          '</div>'
        : '') +

      (chips.length
        ? '<div class="kx-chips kx-desktop-only">' +
          chips.map(function (c) {
            return '<span class="kx-chip"><span class="kind">' + esc(c.kind) + '</span><span>' + esc(c.label) + '</span>' +
              '<button data-chip-remove="' + KX.attr(c.key) + '" aria-label="Remove filter">' + micon('close', { size: 11 }) + '</button></span>';
          }).join('') +
          (!state.filterOpen ? '<button class="kx-clear-all" data-clear-all>' + micon('close', { size: 14 }) + ' Clear all</button>' : '') +
          '</div>'
        : '') +
      '</div>';
  }

  function viewsKebab() {
    var flags = KX.getFlags();
    var roleViews = allSavedViews().filter(function (v) { return v.role === state.role; })
      .filter(function (v) { return flags.futureOn || !v.requiresFuture; });
    var builtIns = roleViews.filter(function (v) { return !v.custom; });
    var customs = roleViews.filter(function (v) { return v.custom; });
    var activeView = roleViews.find(function (v) { return v.id === state.activeViewId; });
    var userDef = state.userDefaultView[state.role];
    var open = state.openMenu === 'views';
    var filterDirty = Object.keys(state.filter || {}).length > 0;

    var rows = '';
    rows += menuRow({ icon: 'bookmark_add', label: 'Save View As…', action: 'save-view',
      disabled: !filterDirty, hint: filterDirty ? null : 'Apply a filter first' });
    if (state.activeViewId) {
      rows += menuRow({
        icon: userDef === state.activeViewId ? 'star' : 'star_outline',
        label: userDef === state.activeViewId ? 'Default view ✓' : 'Set as my default',
        action: 'set-default'
      });
    }
    if (userDef) rows += menuRow({ icon: 'restart_alt', label: 'Clear my default', action: 'clear-default' });
    rows += '<div class="kx-menu-divider"></div><div class="kx-menu-label">Load View</div>';
    rows += '<div style="max-height:240px;overflow-y:auto;padding:2px 0">';
    rows += builtIns.map(function (v) {
      return menuRow({ icon: v.icon, label: v.name, action: 'pick-view', id: v.id,
        active: state.activeViewId === v.id, badge: userDef === v.id ? 'default' : null });
    }).join('');
    if (customs.length) rows += '<div class="kx-menu-divider"></div>';
    rows += customs.map(function (v) {
      return menuRow({ icon: v.icon, label: v.name, action: 'pick-view', id: v.id,
        active: state.activeViewId === v.id, badge: userDef === v.id ? 'default' : 'custom', deletable: true });
    }).join('');
    if (!customs.length) {
      rows += '<div style="padding:6px 12px 10px;font-size:11px;color:var(--ink-500);font-style:italic">' +
        'Your saved views will appear here.</div>';
    }
    rows += '</div>';

    return '<div style="position:relative">' +
      '<button class="kx-pill kx-btn-elev' + (open ? ' is-on' : '') + '" data-menu-toggle="views" ' +
      'title="Saved views" style="max-width:240px">' +
      micon('bookmarks', { size: 14, fill: activeView ? 1 : 0 }) +
      '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
      esc(activeView ? activeView.name : 'Saved Views') + '</span>' +
      micon(open ? 'expand_less' : 'expand_more', { size: 14 }) + '</button>' +
      (open ? '<div class="kx-menu kx-menu--right" style="min-width:260px;max-width:320px">' + rows + '</div>' : '') +
      '</div>';
  }

  function menuRow(o) {
    return '<button class="kx-menu-row' + (o.active ? ' is-active' : '') + '"' +
      ' data-view-action="' + KX.attr(o.action) + '"' + (o.id ? ' data-view-id="' + KX.attr(o.id) + '"' : '') +
      (o.disabled ? ' disabled' : '') + '>' +
      micon(o.icon, { size: 16, fill: o.active ? 1 : 0 }) +
      '<span class="label">' + esc(o.label) + '</span>' +
      (o.hint ? '<span class="hint">' + esc(o.hint) + '</span>' : '') +
      (o.badge === 'default' ? '<span class="kx-menu-badge">DEFAULT</span>' : '') +
      (o.badge === 'custom' && !o.deletable ? '<span style="font-size:9px;font-weight:700;letter-spacing:0.6px;' +
        'text-transform:uppercase;color:var(--ink-400)">CUSTOM</span>' : '') +
      (o.deletable ? '<span role="button" data-view-delete="' + KX.attr(o.id) + '" title="Delete saved view" ' +
        'style="padding:2px;border-radius:4px;cursor:pointer;display:inline-flex;color:var(--ink-400)">' +
        micon('close', { size: 13 }) + '</span>' : '') +
      '</button>';
  }

  /* ---------------------------------------------------------------------
     TASK TABLE
     --------------------------------------------------------------------- */

  var COLUMNS = [
    { key: null,       label: '',         w: 34 },
    { key: 'app',      label: 'App',      w: 56 },
    { key: 'task',     label: 'Task',     w: null },
    { key: 'assignee', label: 'Assignee', w: 180 },
    { key: 'due',      label: 'Due',      w: 130 },
    { key: 'status',   label: 'Status',   w: 110 },
    { key: 'priority', label: 'Priority', w: 88, num: true }
  ];

  function tableHead() {
    var flags = KX.getFlags();
    var field = state.sortField;
    if (!flags.futureOn && field === 'station') field = 'priority';
    return '<colgroup>' + COLUMNS.map(function (c) {
      return '<col' + (c.w ? ' style="width:' + c.w + 'px"' : '') + '>';
    }).join('') + '</colgroup>' +
      '<thead><tr>' + COLUMNS.map(function (c) {
        if (!c.key) return '<th></th>';
        var label = c.key === 'assignee' && flags.futureOn ? 'Assignee · Station' : c.label;
        var isActive = field === c.key;
        // vwc-sortable-header owns the aria-sort on its <th> and cycles
        // null → asc → desc → null. A null cycle drops back to the default
        // sort (priority, desc) so the list is never in an undefined order.
        return '<th' + (c.num ? ' class="is-num"' : '') + (isActive ? ' aria-sort="' + (state.sortDir === 'asc' ? 'ascending' : 'descending') + '"' : '') + '>' +
          '<vwc-sortable-header data-sort="' + c.key + '"' +
          (isActive ? ' sortDirection="' + state.sortDir + '"' : '') +
          ' accessibleName="' + KX.attr('Sort by ' + label) + '">' + esc(label) + '</vwc-sortable-header></th>';
      }).join('') + '</tr></thead>';
  }

  function assigneeCell(task, dense) {
    var flags = KX.getFlags();
    var station = K.helpers.stationById(task.station);
    var people = task.assignees.map(function (id) { return K.helpers.personById(id); }).filter(Boolean);
    var shown = people.slice(0, dense ? 1 : 2);
    var extra = people.length - shown.length;
    if (!people.length) {
      return '<div class="kx-assignees"><div class="none">' +
        (flags.futureOn ? esc(station.name) + ' watch' : 'Unassigned') + '</div></div>';
    }
    return '<div class="kx-assignees">' +
      shown.map(function (p) {
        return '<div style="min-width:0;line-height:1.2"><div class="nm">' + esc(p.first + ' ' + p.last) + '</div>' +
          (dense ? '' : '<div class="rk">' + esc(p.rank) + '</div>') + '</div>';
      }).join('') +
      (extra > 0 ? '<div class="more">+' + extra + ' more</div>' : '') +
      (!dense && flags.futureOn
        ? '<div class="st" style="margin-top:2px">' + esc(station.name) + ' · <span style="font-weight:400">' + esc(station.battalion) + '</span></div>'
        : '') +
      '</div>';
  }

  function taskRow(task, dense) {
    var isLate = task.status === 'overdue' || task.status === 'past_sla';
    var isRisk = task.status === 'at_risk';
    var open = !!state.expanded[task.id];
    var cls = 'kx-task-row' + (open ? ' is-open' : '') + (isLate ? ' is-late' : isRisk ? ' is-risk' : '');

    var row = '<tr class="' + cls + '" data-task="' + KX.attr(task.id) + '" role="link" tabindex="0">' +
      '<td><button class="kx-chevron" data-toggle="' + KX.attr(task.id) + '" aria-expanded="' + open + '" ' +
      'aria-label="' + (open ? 'Collapse details' : 'Expand details') + '">' + micon('chevron_right', { size: 20 }) + '</button></td>' +
      '<td>' + KX.srcTile(task.source) + '</td>' +
      '<td><div class="kx-task-cell">' + KX.typeIcon(task) +
      '<div style="min-width:0;flex:1"><div class="kx-task-title"><span>' + esc(task.title) + '</span>' +
      (dense && task.meta && task.meta.mandatory ? '<span class="kx-mandatory">MANDATORY</span>' : '') + '</div>' +
      (!dense ? '<div class="kx-task-type">' + esc(task.typeLabel) +
        (task.meta && task.meta.mandatory ? '<span class="kx-mandatory" style="margin-left:6px">MANDATORY</span>' : '') + '</div>' : '') +
      '</div></div></td>' +
      '<td>' + assigneeCell(task, dense) + '</td>' +
      '<td>' + KX.dueCell(task, dense) + '</td>' +
      '<td>' + KX.statusText(task.status) + '</td>' +
      '<td>' + KX.prioBadge(task) + '</td>' +
      '</tr>';

    if (open) {
      row += '<tr class="kx-detail-row"><td colspan="' + COLUMNS.length + '">' + expandedDetail(task) + '</td></tr>';
    }
    return row;
  }

  /* ---- Type-specific metadata ---- */
  function field(label, value, o) {
    if (value == null || value === '') return '';
    o = o || {};
    return '<div><div class="kx-field-lbl">' + esc(label) + '</div>' +
      '<div class="kx-field-val' + (o.big ? ' is-big' : '') + (o.mono ? ' is-mono' : '') + '">' + esc(value) + '</div></div>';
  }

  function typeMeta(t) {
    var m = t.meta || {};
    var fmt = KX.fmtDate;
    var grid = function (inner) { return '<div class="kx-meta-grid">' + inner + '</div>'; };

    switch (t.type) {
      case 'vehicle_inspect':
        return grid(
          field('Apparatus', m.unit, { big: true }) + field('Vehicle', m.vehicle) +
          field('VIN', m.vin, { mono: true }) + field('Checklist items', m.checklistItems, { mono: true }) +
          field('Last completed', fmt(m.lastCompleted)) + field('At-risk window', m.atRiskHours + 'h before due')
        ) + checklistVisual(m.checklistItems, t.status === 'overdue' ? 0 : 0);
      case 'course':
      case 'elective':
        return grid(
          field('Course code', m.courseCode, { mono: true }) + field('Duration', m.durationMin + ' min') +
          field('Attempts', (m.attempts || 0) + ' so far') +
          (m.enrolled ? field('Cohort progress', m.completed + ' of ' + m.enrolled, { mono: true }) : '') +
          field('Mandatory', m.mandatory ? 'Yes — annual compliance' : 'No — elective')
        );
      case 'credential':
        return grid(
          field('Credential', m.credential, { big: true }) + field('Expires', fmt(m.expires)) +
          field('CEUs', m.CEUs, { mono: true })
        ) + ceuProgress(m.CEUs);
      case 'equip_inspect':
      case 'ppe_inspect':
        return grid(
          field('Pool', m.pool || '—') + field('Asset count', m.assetCount, { mono: true }) +
          '<div style="grid-column:span 2">' + field('Last finding', m.lastFinding) + '</div>'
        );
      case 'open_ticket':
        return grid(
          field('Ticket ID', m.ticketId, { mono: true }) + field('Priority', m.priority) + field('Created by', m.createdBy)
        );
      case 'doc_approval':
        return grid(
          field('Category', m.category) + field('Author', m.author) +
          field('Approval step', m.step, { mono: true }) + field('SLA', m.sla)
        );
      case 'flag_review':
        return grid(field('Trigger rule', m.rule) + field('Subject', m.subject) + field('SLA', m.sla));
      case 'open_shift':
      case 'shift_confirm':
        return grid(
          field('Shift date', fmt(m.shiftDate)) +
          field('Seats', m.seats || (m.confirmed ? 'Confirmed' : 'Awaiting'))
        );
      case 'pto_request':
        return grid(field('Days requested', m.days) + field('Coverage', m.coverageStatus));
      case 'evaluation':
        return grid(field('Template', m.template) + field('Sections signed', m.signedSections, { mono: true }));
      default:
        return '<div style="font-size:13px;color:var(--ink-500)">No additional metadata.</div>';
    }
  }

  function checklistVisual(items, doneRatio) {
    items = items || 30;
    var cells = '';
    for (var i = 0; i < items; i++) cells += '<span' + (i < items * doneRatio ? ' class="is-done"' : '') + '></span>';
    return '<div style="margin-top:14px"><div class="kx-field-lbl" style="margin-bottom:6px">Checklist preview</div>' +
      '<div class="kx-checklist">' + cells + '</div></div>';
  }

  function ceuProgress(label) {
    var m = (label || '0 / 1').match(/(\d+)\s*\/\s*(\d+)/);
    var cur = m ? +m[1] : 0, max = m ? +m[2] : 1;
    var pct = (cur / max) * 100;
    return '<div style="margin-top:14px">' +
      '<div class="kx-field-lbl" style="margin-bottom:6px">Continuing Education Units</div>' +
      '<div class="kx-progress-track"><div class="kx-progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div style="font-size:11px;color:var(--ink-600);margin-top:4px;font-family:var(--font-mono)">' +
      cur + ' of ' + max + ' CEUs (' + Math.round(pct) + '%)</div></div>';
  }

  function activityFeed(t) {
    var created = t.created || new Date(K.NOW.getTime() - 86400000 * 3);
    var items = [{ icon: 'add_circle', text: 'Task created', when: created }];
    if (t.assignees.length) {
      var p0 = K.helpers.personById(t.assignees[0]);
      items.push({
        icon: 'person_add', text: 'Assigned', when: new Date(created.getTime() + 60000),
        who: t.assignees.length === 1 ? p0.first + ' ' + p0.last.charAt(0) + '.' : t.assignees.length + ' people'
      });
    }
    if (t.status === 'overdue' || t.status === 'past_sla') {
      items.push({ icon: 'priority_high', text: 'Marked late', when: t.dueAt || K.NOW, tone: 'bad' });
    }
    return '<div class="kx-activity">' + items.map(function (it) {
      return '<div class="kx-activity-row' + (it.tone === 'bad' ? ' is-bad' : '') + '"><span class="pip"></span>' +
        '<span class="txt">' + esc(it.text) +
        (it.who ? '<span style="color:var(--ink-500)"> · ' + esc(it.who) + '</span>' : '') + '</span>' +
        '<span class="when">' + esc(KX.relTime(it.when)) + '</span></div>';
    }).join('') + '</div>';
  }

  function expandedDetail(t) {
    var flags = KX.getFlags();
    var station = K.helpers.stationById(t.station);
    var people = t.assignees.map(function (id) { return K.helpers.personById(id); }).filter(Boolean);
    var src = K.SOURCES[t.source];

    var assignees = people.length === 0
      ? '<div class="kx-info-note">' + micon('info', { size: 16, color: 'var(--amber-600)' }) +
        (flags.futureOn ? 'Unassigned · routed to ' + esc(station.name) + ' watch' : 'Unassigned') + '</div>'
      : '<div style="display:flex;flex-direction:column;gap:6px">' + people.map(function (p) {
          return '<div class="kx-assignee-card">' + KX.avatar(p, 28) +
            '<div style="flex:1;line-height:1.2"><div style="font-weight:600;font-size:13px">' +
            esc(p.first + ' ' + p.last) + '</div>' +
            '<div style="font-size:11px;color:var(--ink-500)">' + esc(p.rank) + ' · Shift ' + esc(p.shift) + '</div></div>' +
            (flags.futureOn
              ? '<vaadin-button theme="icon tertiary small" data-nudge="' + KX.attr(p.id) + '" ' +
                'title="Send to this person" aria-label="Send reminder">' + micon('send', { size: 13 }) + '</vaadin-button>'
              : '') +
            '</div>';
        }).join('') + '</div>';

    var actions = '<vaadin-button theme="primary small" data-open-src="' + KX.attr(t.id) + '">' +
      micon('open_in_new', { size: 16 }) + '<span style="margin-left:6px">Open in ' + esc(src.name) + '</span></vaadin-button>';
    if (flags.futureOn) {
      actions += '<vaadin-button theme="secondary small" data-remind="' + KX.attr(t.id) + '">' +
        micon('send', { size: 16 }) + '<span style="margin-left:6px">Send Reminder</span></vaadin-button>' +
        '<vaadin-button theme="tertiary small" data-reassign="' + KX.attr(t.id) + '">' +
        micon('person_add', { size: 16 }) + '<span style="margin-left:6px">Reassign</span></vaadin-button>';
    }

    return '<div class="kx-detail">' +
      '<div class="kx-detail-left">' +
      '<div class="kx-detail-eyebrow">' + KX.srcChip(t.source) + '<span>·</span><span>' + esc(t.typeLabel) + ' detail</span></div>' +
      typeMeta(t) + '</div>' +
      '<div class="kx-detail-right">' +
      '<div class="kx-field-lbl" style="letter-spacing:1px;margin-bottom:10px">Assignees</div>' + assignees +
      '<div class="kx-field-lbl" style="letter-spacing:1px;margin:18px 0 10px">Activity</div>' + activityFeed(t) +
      '<div style="margin-top:18px;display:flex;gap:8px;flex-wrap:wrap">' + actions + '</div>' +
      '</div></div>';
  }

  function mobileCard(task) {
    var flags = KX.getFlags();
    var isLate = task.status === 'overdue' || task.status === 'past_sla';
    var station = K.helpers.stationById(task.station);
    return '<div class="kx-mcard' + (isLate ? ' is-late' : task.status === 'at_risk' ? ' is-risk' : '') + '" ' +
      'data-toggle="' + KX.attr(task.id) + '">' +
      '<div style="display:flex;gap:8px;align-items:flex-start">' + KX.typeIcon(task, 36) +
      '<div style="flex:1;min-width:0">' +
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
      KX.srcChip(task.source) + KX.prioBadge(task) + '</div>' +
      '<div style="font-weight:400;font-size:16px;margin-top:6px;line-height:1.25">' + esc(task.title) + '</div>' +
      '<div style="font-size:11px;color:var(--ink-500);margin-top:2px">' + esc(task.typeLabel) +
      (flags.futureOn ? ' · ' + esc(station.name) + ' (' + esc(station.battalion) + ')' : '') + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">' +
      KX.avatarStack(task.assignees, { size: 20, max: 3 }) + KX.statusText(task.status) + '</div>' +
      '</div></div>' +
      (state.expanded[task.id] ? '<div style="margin-top:12px">' + expandedDetail(task) + '</div>' : '') +
      '</div>';
  }

  function taskTable(tasks) {
    if (tasks.length === 0) return emptyState();
    var dense = state.density === 'compact';
    var sorted = sortTasks(tasks);
    return '<div class="kx-table-card">' +
      '<table class="kx-table' + (dense ? ' is-compact' : '') + '">' + tableHead() +
      '<tbody>' + sorted.map(function (t) { return taskRow(t, dense); }).join('') + '</tbody></table>' +
      '<div class="kx-mobile-cards">' + sorted.map(mobileCard).join('') + '</div>' +
      '</div>';
  }

  // Hard-scoped users (the Firefighter line view) own a personal queue. When
  // it's empty that's a win, not an error — so it gets a warm "all clear"
  // state instead of a flat dashed placeholder.
  function emptyState() {
    var roleCfg = K.ROLES[state.role] || {};
    if (roleCfg.hardScoped) {
      var me = roleCfg.selfId ? K.helpers.personById(roleCfg.selfId) : null;
      return '<div class="kx-allclear"><div class="kx-allclear-inner">' +
        '<div class="kx-clear-medallion">' +
        '<span class="kx-clear-medallion__ring"></span><span class="kx-clear-medallion__ring"></span>' +
        '<div class="kx-clear-medallion__fill">' +
        micon('task_alt', { size: 48, fill: 1, color: 'var(--teal-400)' }) + '</div></div>' +
        '<h2>' + (me ? 'All clear, ' + esc(me.first) + '.' : 'All clear.') + '</h2>' +
        '<p>You have no open tasks right now. Every readiness item assigned to you is signed off — ' +
        'nothing needs your attention today.</p>' +
        (roleCfg.sub ? '<div class="badge">' +
          micon('verified_user', { size: 18, fill: 1, color: 'var(--teal-400)' }) +
          '<span>' + esc(roleCfg.sub) + '</span>' +
          '<span style="width:3px;height:3px;border-radius:999px;background:var(--teal-300)"></span>' +
          '<span>nothing due</span></div>' : '') +
        '</div></div>';
    }
    return '<div class="kx-empty">' + micon('filter_alt_off', { size: 36, color: 'var(--ink-300)' }) +
      '<div class="t">No tasks match these filters.</div>' +
      '<div class="s">Try clearing filters or switching to a different saved view.</div></div>';
  }

  /* ---------------------------------------------------------------------
     RENDER
     --------------------------------------------------------------------- */

  function render() {
    var flags = KX.getFlags();
    var r = K.ROLES[state.role];
    var scoped = roleScope() ? applyFilter(K.TASKS, roleScope()) : K.TASKS;
    var filtered = visibleTasks();

    // Role heroes are phase-2: v1 ships the greeting + task table only.
    // The Chief's Battalion Pulse hero is RETIRED — a published dashboard replaces
    // it, so the top of the task list stays above the fold.
    var hero = '';
    if (flags.futureOn && window.KXHero) {
      if (r.hero === 'coverage') hero = KXHero.publishedDashboard('chief');
      else if (r.hero === 'compliance') hero = KXHero.complianceHero(scoped);
      else if (r.hero === 'crew') hero = KXHero.publishedDashboard('lieutenant');
      else if (r.hero === 'personal') hero = KXHero.publishedDashboard('firefighter');
    }

    document.getElementById('root').innerHTML =
      '<div class="kx-app" data-accent="' + DEFAULTS.accent + '"><div class="kx-shell"><div class="kx-main">' +
      '<main class="kx-content">' +
      '<section class="kx-hero"><div class="kx-hero-inner">' +
      greetingHeader(scoped) + hero +
      '</div></section>' +
      '<div style="height:6px"></div>' +
      filterBar(filtered) +
      taskTable(filtered) +
      '</main></div></div></div>';

    // The Agency Intelligence chat card used to mount inside the retired coverage
    // hero's right column. The hub now links out to it from the published
    // dashboard's header instead — no in-page mount, no height cost.
    if (window.KXHero) KXHero.wire();
    syncBucketGroup();
  }

  function syncBucketGroup() {
    var g = document.getElementById('kxBuckets');
    if (!g) return;
    var ids = (!state.filter.statuses || !state.filter.statuses.length)
      ? ['all']
      : STATUS_BUCKETS.filter(function (b) {
          return b.statuses && b.statuses.some(function (s) { return state.filter.statuses.indexOf(s) !== -1; });
        }).map(function (b) { return b.id; });
    KX.setToggleGroup(g, ids);
  }

  /* ---------------------------------------------------------------------
     ACTIONS
     --------------------------------------------------------------------- */

  function setFilter(patch) {
    Object.keys(patch).forEach(function (k) {
      if (patch[k] === undefined) delete state.filter[k];
      else state.filter[k] = patch[k];
    });
    render();
  }

  function clearFilter() { state.filter = {}; state.activeViewId = null; render(); }

  function toggleBucket(bucketId) {
    var b = STATUS_BUCKETS.find(function (x) { return x.id === bucketId; });
    if (!b) return;
    if (b.id === 'all') { setFilter({ statuses: undefined }); return; }
    var cur = (state.filter.statuses || []).slice();
    var has = b.statuses.every(function (s) { return cur.indexOf(s) !== -1; });
    b.statuses.forEach(function (s) {
      var i = cur.indexOf(s);
      if (has) { if (i !== -1) cur.splice(i, 1); }
      else if (i === -1) cur.push(s);
    });
    setFilter({ statuses: cur.length ? cur : undefined });
  }

  // Switching roles resets the saved view to the role's default (a user-set
  // default wins over the role's built-in one).
  function setRole(roleId) {
    state.role = roleId;
    var r = K.ROLES[roleId];
    var userDef = state.userDefaultView[roleId];
    state.activeViewId = userDef || (r && r.defaultView) || null;
    applyActiveView();
  }

  function applyActiveView() {
    if (!state.activeViewId) { state.filter = {}; render(); return; }
    var v = allSavedViews().find(function (x) { return x.id === state.activeViewId; });
    if (!v) { render(); return; }
    state.filter = scrubFilter(v.filter || {});
    render();
  }

  function persistCustomViews() {
    try { localStorage.setItem('keystone.customViews', JSON.stringify(state.customViews)); } catch (e) {}
  }
  function persistDefaults() {
    try { localStorage.setItem('keystone.userDefaultViews', JSON.stringify(state.userDefaultView)); } catch (e) {}
  }

  /* ---- Save-view dialog ---- */
  var VIEW_ICONS = ['bookmark','star','flag_circle','priority_high','crisis_alert','schedule','today','visibility','group','shield','verified','fire_truck'];

  function openSaveViewDialog() {
    var chosenIcon = 'bookmark';
    var f = state.filter;
    var summary = [];
    if (f.bands && f.bands.length) summary.push(f.bands.length + ' priority');
    if (f.sources && f.sources.length) summary.push(f.sources.length + ' app');
    if (f.types && f.types.length) summary.push(f.types.length + ' type');
    if (f.statuses && f.statuses.length) summary.push(f.statuses.length + ' status');
    if (f.assignees && f.assignees.length) summary.push('assignees');
    if (f.dueWithinHours) summary.push('time window');
    if (f.mandatory) summary.push('mandatory');

    var existing = allSavedViews().map(function (v) { return v.name.toLowerCase(); });

    KX.openDialog({
      title: 'Save this view as…',
      subtitle: 'Captures the current filter so you can return to it later.' +
        (summary.length ? ' Includes: ' + summary.join(' · ') + '.' : ''),
      icon: 'bookmark_add',
      accent: 'var(--amber-500)',
      width: '480px',
      body:
        '<vaadin-text-field theme="outlined" id="svName" label="Name" style="width:100%" ' +
        'placeholder="e.g. Late renewals — B-1" required></vaadin-text-field>' +
        '<div id="svDup" style="display:none;font-size:11px;color:var(--coral-500);margin-top:6px">' +
        'A view with that name already exists.</div>' +
        '<div class="kx-field-lbl" style="margin:14px 0 6px">Icon</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px" id="svIcons">' +
        VIEW_ICONS.map(function (n) {
          return '<button data-icon="' + n + '" style="width:36px;height:36px;border-radius:8px;' +
            'background:' + (n === chosenIcon ? 'var(--ink-900)' : 'var(--surface-2)') + ';' +
            'color:' + (n === chosenIcon ? 'white' : 'var(--ink-700)') + ';' +
            'border:1px solid ' + (n === chosenIcon ? 'var(--ink-900)' : 'var(--ink-200)') + ';' +
            'display:inline-flex;align-items:center;justify-content:center;cursor:pointer">' +
            micon(n, { size: 18, fill: n === chosenIcon ? 1 : 0 }) + '</button>';
        }).join('') + '</div>',
      onMount: function (body) {
        body.querySelector('#svIcons').addEventListener('click', function (e) {
          var b = e.target.closest('[data-icon]');
          if (!b) return;
          chosenIcon = b.getAttribute('data-icon');
          body.querySelectorAll('#svIcons [data-icon]').forEach(function (el) {
            var on = el.getAttribute('data-icon') === chosenIcon;
            el.style.background = on ? 'var(--ink-900)' : 'var(--surface-2)';
            el.style.color = on ? 'white' : 'var(--ink-700)';
            el.style.borderColor = on ? 'var(--ink-900)' : 'var(--ink-200)';
          });
        });
      },
      actions: [
        { label: 'Cancel', theme: 'tertiary' },
        { label: 'Save view', theme: 'primary', onClick: function (dlg) {
          var input = dlg.querySelector ? null : null;
          var nameEl = document.querySelector('#svName');
          var name = (nameEl && nameEl.value || '').trim();
          if (!name) return false;                                   // keep open
          if (existing.indexOf(name.toLowerCase()) !== -1) {
            var dup = document.querySelector('#svDup');
            if (dup) dup.style.display = 'block';
            return false;
          }
          var id = 'sv-c-' + Date.now().toString(36);
          state.customViews.push({
            id: id, role: state.role, name: name, icon: chosenIcon,
            filter: Object.assign({}, state.filter), custom: true
          });
          persistCustomViews();
          state.activeViewId = id;
          render();
          KX.pushToast({ title: 'View saved', body: '"' + name + '" is in your saved views.', icon: 'bookmark_add', tone: 'success' });
        } }
      ]
    });
  }

  /* ---- Reminder dialog ---- */
  function openReminderDialog(task) {
    var people = task.assignees.map(function (id) { return K.helpers.personById(id); }).filter(Boolean);
    var station = K.helpers.stationById(task.station);
    var fallback = (station ? station.name : 'station') + ' watch';
    var sel = { recipients: people.map(function (p) { return p.id; }), channels: { push: true, sms: true, email: false }, tone: 'standard', escalate: false };

    var presets = {
      standard: 'Quick reminder — ' + task.title + ' is open. Please complete when able.',
      urgent: task.title + ' is overdue. Please complete this shift or reply with a status.',
      soft: 'Heads up — ' + task.title + ' is on your list. Anything blocking it?'
    };

    var recipientsHtml = people.length === 0
      ? '<div class="kx-info-note">' + micon('info', { size: 16, color: 'var(--amber-600)' }) +
        'No direct assignees. Reminder will be sent to ' + esc(fallback) + '.</div>'
      : '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' + people.map(function (p) {
          return '<label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;' +
            'border:1px solid var(--amber-400);background:var(--amber-50);cursor:pointer" data-recip-wrap="' + p.id + '">' +
            '<vaadin-checkbox data-recip="' + KX.attr(p.id) + '" checked></vaadin-checkbox>' +
            KX.avatar(p, 26) +
            '<span style="min-width:0;flex:1;line-height:1.15">' +
            '<span style="display:block;font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
            esc(p.first + ' ' + p.last) + '</span>' +
            '<span style="font-size:11px;color:var(--ink-500)">' + esc(p.rank) + ' · ' + esc(p.shift) + '-shift</span></span></label>';
        }).join('') + '</div>';

    KX.openDialog({
      title: 'Send reminder',
      subtitle: 'A nudge with channel + escalation control.',
      icon: 'send',
      accent: 'var(--amber-500)',
      note: 'Logged to task activity · audit-trail visible to ' + (station ? station.battalion : 'battalion') + ' chief.',
      body:
        taskBlurb(task) +
        '<div style="margin-top:16px"><div class="kx-field-lbl" style="margin-bottom:6px">Recipients</div>' + recipientsHtml + '</div>' +
        '<div style="margin-top:16px"><div class="kx-field-lbl" style="margin-bottom:6px">Channels</div>' +
        '<vwc-toggle-button-group multiple id="rmChannels" style="width:100%">' +
        '<vwc-toggle-button value="push">' + micon('notifications', { size: 16 }) + ' Push</vwc-toggle-button>' +
        '<vwc-toggle-button value="sms">' + micon('sms', { size: 16 }) + ' SMS</vwc-toggle-button>' +
        '<vwc-toggle-button value="email">' + micon('mail', { size: 16 }) + ' Email</vwc-toggle-button>' +
        '</vwc-toggle-button-group></div>' +
        '<div style="margin-top:16px"><div class="kx-field-lbl" style="margin-bottom:6px">Tone</div>' +
        '<vwc-toggle-button-group id="rmTone" style="width:100%">' +
        '<vwc-toggle-button value="soft">Soft</vwc-toggle-button>' +
        '<vwc-toggle-button value="standard">Standard</vwc-toggle-button>' +
        '<vwc-toggle-button value="urgent">Urgent</vwc-toggle-button>' +
        '</vwc-toggle-button-group>' +
        '<div id="rmPreset" style="font-size:11px;color:var(--ink-500);margin-top:6px;font-style:italic">' +
        esc(presets.standard) + '</div></div>' +
        '<div style="margin-top:16px">' +
        '<vaadin-text-area theme="outlined" id="rmMsg" label="Personal message · optional" style="width:100%" ' +
        'maxlength="240" placeholder="Add context, e.g. \'Engine 7 is back in service after 14:00, please run inspection before EOS.\'">' +
        '</vaadin-text-area></div>' +
        '<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;margin-top:16px;' +
        'border:1px solid var(--ink-100);background:var(--surface-2);cursor:pointer">' +
        '<vaadin-checkbox id="rmEscalate"></vaadin-checkbox>' +
        '<span style="flex:1"><span style="display:block;font-weight:600;font-size:13px">Escalate if unread for 4 hours</span>' +
        '<span style="font-size:11px;color:var(--ink-500)">CC Battalion Chief and re-send via SMS.</span></span>' +
        micon('trending_up', { size: 18, color: 'var(--ink-300)' }) + '</label>',
      onMount: function (body) {
        KX.setToggleGroup(body.querySelector('#rmChannels'), ['push', 'sms']);
        KX.setToggleGroup(body.querySelector('#rmTone'), 'standard');
        var toneGroup = body.querySelector('#rmTone');
        toneGroup.addEventListener('selection-change', function (e) {
          sel.tone = e.detail;
          body.querySelector('#rmPreset').textContent = presets[e.detail] || '';
        });
        body.querySelector('#rmChannels').addEventListener('selection-change', function (e) {
          var on = e.detail || [];
          sel.channels = { push: on.indexOf('push') !== -1, sms: on.indexOf('sms') !== -1, email: on.indexOf('email') !== -1 };
        });
        body.addEventListener('change', function (e) {
          var cb = e.target.closest('vaadin-checkbox[data-recip]');
          if (cb) {
            var id = cb.getAttribute('data-recip');
            var i = sel.recipients.indexOf(id);
            if (cb.checked && i === -1) sel.recipients.push(id);
            if (!cb.checked && i !== -1) sel.recipients.splice(i, 1);
            var wrap = body.querySelector('[data-recip-wrap="' + id + '"]');
            if (wrap) {
              wrap.style.borderColor = cb.checked ? 'var(--amber-400)' : 'var(--ink-200)';
              wrap.style.background = cb.checked ? 'var(--amber-50)' : 'var(--surface-1)';
            }
          }
          if (e.target.id === 'rmEscalate') sel.escalate = !!e.target.checked;
        });
      },
      actions: [
        { label: 'Cancel', theme: 'tertiary' },
        { label: 'Send reminder', theme: 'primary', icon: 'send', onClick: function () {
          var channelList = Object.keys(sel.channels).filter(function (k) { return sel.channels[k]; })
            .map(function (k) { return k.toUpperCase(); }).join(' + ');
          if (!channelList) return false;                     // no channel → keep open
          var label;
          if (sel.recipients.length === 0) label = fallback;
          else if (sel.recipients.length === 1) {
            var p = people.find(function (x) { return x.id === sel.recipients[0]; });
            label = p ? p.first + ' ' + p.last : fallback;
          } else label = sel.recipients.length + ' assignees';
          KX.pushToast({
            title: 'Reminder sent',
            body: 'Notified ' + label + ' via ' + channelList + '.' +
              (sel.escalate ? ' Will escalate to Battalion if unread in 4h.' : ''),
            icon: 'send', tone: 'success'
          });
        } }
      ]
    });
  }

  function taskBlurb(task) {
    var station = K.helpers.stationById(task.station);
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface-2);' +
      'border-radius:10px;border:1px solid var(--ink-100)">' + KX.typeIcon(task) +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-weight:600;font-size:13px;color:var(--ink-900);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
      esc(task.title) + '</div>' +
      '<div style="font-size:11px;color:var(--ink-500);margin-top:1px">' + esc(task.typeLabel) + ' · ' +
      esc(station.name) + ' · ' + esc(station.battalion) + '</div></div>' + KX.srcChip(task.source) + '</div>';
  }

  /* ---- Reassign dialog ---- */
  function openReassignDialog(task) {
    var station = K.helpers.stationById(task.station);
    var currentIds = task.assignees;
    var st = { scope: 'station', search: '', target: null, reason: 'coverage', notify: true };

    var reasonPresets = {
      coverage: 'Coverage gap — original assignee unavailable.',
      skills: 'Skill match — target is more qualified for this task.',
      workload: 'Workload balance — current assignee is over-allocated.',
      discipline: 'Performance follow-up — moving to direct supervisor.'
    };

    function candidates() {
      var out = K.PEOPLE.filter(function (p) { return currentIds.indexOf(p.id) === -1; });
      if (st.scope === 'station') out = out.filter(function (p) { return p.station === task.station; });
      else if (st.scope === 'battalion') {
        var ids = K.STATIONS.filter(function (s) { return s.battalion === station.battalion; }).map(function (s) { return s.id; });
        out = out.filter(function (p) { return ids.indexOf(p.station) !== -1; });
      }
      if (st.search.trim()) {
        var q = st.search.toLowerCase();
        out = out.filter(function (p) { return (p.first + ' ' + p.last + ' ' + p.rank).toLowerCase().indexOf(q) !== -1; });
      }
      return out;
    }

    function candidateRows() {
      var list = candidates();
      var rows = candidateRow({
        kind: 'station', id: 'station:' + station.id, icon: 'local_fire_department',
        label: station.name + ' watch', sub: 'Shared task — anyone on shift can claim'
      });
      rows += list.length === 0
        ? '<div style="padding:14px 16px;font-size:12px;color:var(--ink-500);font-style:italic">' +
          'No people match. Try widening the scope.</div>'
        : list.slice(0, 12).map(function (p) {
            return candidateRow({ kind: 'person', id: p.id, person: p });
          }).join('');
      return rows;
    }

    function candidateRow(o) {
      var on = st.target === o.id;
      return '<button data-cand="' + KX.attr(o.id) + '" style="width:100%;display:flex;align-items:center;gap:10px;' +
        'padding:10px 14px;background:' + (on ? 'var(--teal-50)' : 'transparent') + ';border:none;' +
        'border-bottom:1px solid var(--ink-100);cursor:pointer;text-align:left;font-family:inherit">' +
        (o.kind === 'person' ? KX.avatar(o.person, 30)
          : '<span style="width:30px;height:30px;border-radius:8px;background:var(--amber-100);color:var(--amber-700);' +
            'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
            micon(o.icon, { size: 16, fill: 1 }) + '</span>') +
        '<span style="flex:1;min-width:0;line-height:1.2">' +
        '<span style="display:block;font-weight:600;font-size:13px;color:var(--ink-900)">' +
        esc(o.kind === 'person' ? o.person.first + ' ' + o.person.last : o.label) + '</span>' +
        '<span style="font-size:11px;color:var(--ink-500)">' +
        esc(o.kind === 'person' ? o.person.rank + ' · ' + o.person.shift + '-shift' : o.sub) + '</span></span>' +
        (on ? micon('check_circle', { size: 20, fill: 1, color: 'var(--teal-500)' }) : '') + '</button>';
    }

    KX.openDialog({
      title: 'Reassign task',
      subtitle: 'Move ownership — to a person or a station\'s watch.',
      icon: 'person_add',
      accent: 'var(--teal-400)',
      note: 'Reassignments are reversible for 1 hour.',
      body:
        taskBlurb(task) +
        '<div style="margin-top:16px"><div class="kx-field-lbl" style="margin-bottom:6px">Currently assigned</div>' +
        (task.assignees.length === 0
          ? '<div style="font-size:12px;color:var(--ink-500);font-style:italic">Unassigned — routed to ' +
            esc(station.name) + ' watch.</div>'
          : '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
            KX.avatarStack(task.assignees, { size: 24, max: 5 }) +
            '<span style="font-size:12px;color:var(--ink-600)">' +
            esc(task.assignees.map(function (id) { return K.helpers.personById(id).first; }).join(', ')) +
            '</span></div>') + '</div>' +
        '<div style="margin-top:16px"><div class="kx-field-lbl" style="margin-bottom:6px">Scope</div>' +
        '<vwc-toggle-button-group id="raScope">' +
        '<vwc-toggle-button value="station">' + esc(station.name) + '</vwc-toggle-button>' +
        '<vwc-toggle-button value="battalion">' + esc(station.battalion) + '</vwc-toggle-button>' +
        '<vwc-toggle-button value="all">Department</vwc-toggle-button>' +
        '</vwc-toggle-button-group></div>' +
        '<div style="margin-top:16px"><div class="kx-field-lbl" style="margin-bottom:6px">Reassign to</div>' +
        '<vaadin-text-field theme="outlined" id="raSearch" placeholder="Search people…" style="width:100%" ' +
        'clear-button-visible></vaadin-text-field>' +
        '<div id="raList" style="max-height:220px;overflow:auto;border:1px solid var(--ink-100);border-radius:10px;' +
        'background:var(--surface-1);margin-top:8px">' + candidateRows() + '</div></div>' +
        '<div style="margin-top:16px"><div class="kx-field-lbl" style="margin-bottom:6px">Reason</div>' +
        '<vaadin-select theme="outlined" id="raReason" style="width:100%"></vaadin-select>' +
        '<div id="raPreset" style="font-size:11px;color:var(--ink-500);margin-top:6px;font-style:italic">' +
        esc(reasonPresets.coverage) + '</div></div>' +
        '<div style="margin-top:16px">' +
        '<vaadin-text-area theme="outlined" id="raMsg" label="Personal message · optional" style="width:100%" ' +
        'maxlength="240" placeholder="Add context for the new owner."></vaadin-text-area></div>' +
        '<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;margin-top:16px;' +
        'border:1px solid var(--ink-100);background:var(--surface-2);cursor:pointer">' +
        '<vaadin-checkbox id="raNotify" checked></vaadin-checkbox>' +
        '<span style="flex:1"><span style="display:block;font-weight:600;font-size:13px">Notify previous &amp; new owner</span>' +
        '<span style="font-size:11px;color:var(--ink-500)">Push + SMS to both parties; logged in audit trail.</span></span></label>',
      onMount: function (body) {
        KX.setToggleGroup(body.querySelector('#raScope'), 'station');
        var listEl = body.querySelector('#raList');
        var sel = body.querySelector('#raReason');
        sel.items = Object.keys(reasonPresets).map(function (k) {
          return { label: { coverage: 'Coverage gap', skills: 'Better skill match', workload: 'Workload balance', discipline: 'Performance follow-up' }[k], value: k };
        });
        sel.value = 'coverage';
        sel.addEventListener('value-changed', function (e) {
          st.reason = e.detail.value;
          body.querySelector('#raPreset').textContent = reasonPresets[st.reason] || '';
        });
        body.querySelector('#raScope').addEventListener('selection-change', function (e) {
          st.scope = e.detail; listEl.innerHTML = candidateRows();
        });
        body.querySelector('#raSearch').addEventListener('value-changed', function (e) {
          st.search = e.detail.value || ''; listEl.innerHTML = candidateRows();
        });
        listEl.addEventListener('click', function (e) {
          var b = e.target.closest('[data-cand]');
          if (!b) return;
          st.target = b.getAttribute('data-cand');
          listEl.innerHTML = candidateRows();
        });
        body.addEventListener('change', function (e) {
          if (e.target.id === 'raNotify') st.notify = !!e.target.checked;
        });
      },
      actions: [
        { label: 'Cancel', theme: 'tertiary' },
        { label: 'Reassign', theme: 'primary', icon: 'person_add', onClick: function () {
          if (!st.target) return false;
          var label;
          if (st.target.indexOf('station:') === 0) {
            var s = K.helpers.stationById(st.target.slice(8));
            label = (s ? s.name : 'Station') + ' watch';
          } else {
            var p = K.PEOPLE.find(function (x) { return x.id === st.target; });
            label = p ? p.first + ' ' + p.last : 'new owner';
          }
          KX.pushToast({
            title: 'Task reassigned',
            body: task.title + ' → ' + label + '.' + (st.notify ? ' Both parties notified.' : ''),
            icon: 'person_add', tone: 'success'
          });
        } }
      ]
    });
  }

  /* ---------------------------------------------------------------------
     WIRING — delegated once on #root (which survives every re-render)
     --------------------------------------------------------------------- */
  function wire() {
    var root = document.getElementById('root');

    root.addEventListener('click', function (e) {
      /* -- expand / collapse -- */
      var toggle = e.target.closest('[data-toggle]');
      if (toggle) {
        e.stopPropagation();
        var tid = toggle.getAttribute('data-toggle');
        if (state.expanded[tid]) delete state.expanded[tid]; else state.expanded[tid] = true;
        render();
        return;
      }

      /* -- menus -- */
      var menuToggle = e.target.closest('[data-menu-toggle]');
      if (menuToggle) {
        var key = menuToggle.getAttribute('data-menu-toggle');
        state.openMenu = state.openMenu === key ? null : key;
        render();
        return;
      }

      /* -- saved views -- */
      var del = e.target.closest('[data-view-delete]');
      if (del) {
        e.stopPropagation();
        var delId = del.getAttribute('data-view-delete');
        var v = state.customViews.find(function (x) { return x.id === delId; });
        if (v && window.confirm('Delete "' + v.name + '"?')) {
          state.customViews = state.customViews.filter(function (x) { return x.id !== delId; });
          persistCustomViews();
          if (state.activeViewId === delId) { state.activeViewId = null; state.filter = {}; }
          render();
        }
        return;
      }
      var va = e.target.closest('[data-view-action]');
      if (va) {
        if (va.hasAttribute('disabled')) return;
        var action = va.getAttribute('data-view-action');
        state.openMenu = null;
        if (action === 'save-view') { render(); openSaveViewDialog(); return; }
        if (action === 'set-default') {
          state.userDefaultView[state.role] = state.activeViewId;
          persistDefaults(); render(); return;
        }
        if (action === 'clear-default') { delete state.userDefaultView[state.role]; persistDefaults(); render(); return; }
        if (action === 'pick-view') { state.activeViewId = va.getAttribute('data-view-id'); applyActiveView(); return; }
      }

      /* -- filter bar -- */
      if (e.target.closest('#kxFilterToggle')) { state.filterOpen = !state.filterOpen; render(); return; }
      if (e.target.closest('#kxMyTasks')) {
        var uid = K.ROLES[state.role].selfId;
        var active = Array.isArray(state.filter.assignees) && state.filter.assignees.length === 1 &&
          state.filter.assignees[0] === uid;
        setFilter({ assignees: active ? undefined : [uid] });
        return;
      }
      if (e.target.closest('#kxDensity')) {
        state.density = state.density === 'compact' ? 'comfortable' : 'compact';
        render();
        return;
      }
      var chipRemove = e.target.closest('[data-chip-remove]');
      if (chipRemove) { setFilter(defineUndefined(chipRemove.getAttribute('data-chip-remove'))); return; }
      if (e.target.closest('[data-clear-all]')) { clearFilter(); return; }

      /* -- expanded-detail actions -- */
      var remind = e.target.closest('[data-remind]');
      if (remind) { e.stopPropagation(); openReminderDialog(taskById(remind.getAttribute('data-remind'))); return; }
      var reassign = e.target.closest('[data-reassign]');
      if (reassign) { e.stopPropagation(); openReassignDialog(taskById(reassign.getAttribute('data-reassign'))); return; }
      var nudge = e.target.closest('[data-nudge]');
      if (nudge) {
        e.stopPropagation();
        var p = K.helpers.personById(nudge.getAttribute('data-nudge'));
        KX.pushToast({ title: 'Reminder sent', body: p.first + ' ' + p.last + ' notified.', icon: 'send', tone: 'success' });
        return;
      }
      var openSrc = e.target.closest('[data-open-src]');
      if (openSrc) {
        e.stopPropagation();
        var t1 = taskById(openSrc.getAttribute('data-open-src'));
        KX.pushToast({ title: 'Opening ' + K.SOURCES[t1.source].name + '…', body: 'Deep-link to ' + t1.title + '.', icon: 'open_in_new' });
        return;
      }

      /* -- whole-row click navigates into the task's source app -- */
      var row = e.target.closest('tr[data-task]');
      if (row) {
        var t2 = taskById(row.getAttribute('data-task'));
        var src = K.SOURCES[t2.source];
        KX.pushToast({
          title: 'Opening ' + src.name + '…',
          body: 'Deep-linking to ' + t2.title + '. Returns to Keystone after completion.',
          icon: 'open_in_new'
        });
      }
    });

    // Keyboard: Enter navigates, Space expands (matches the prototype).
    root.addEventListener('keydown', function (e) {
      var row = e.target.closest && e.target.closest('tr[data-task]');
      if (!row) return;
      if (e.key === 'Enter') row.click();
      else if (e.key === ' ') {
        e.preventDefault();
        var tid = row.getAttribute('data-task');
        if (state.expanded[tid]) delete state.expanded[tid]; else state.expanded[tid] = true;
        render();
      }
    });

    /* -- status buckets -- */
    root.addEventListener('selection-change', function (e) {
      if (e.target.id !== 'kxBuckets') return;
      var next = e.detail || [];
      var prev = (!state.filter.statuses || !state.filter.statuses.length)
        ? ['all']
        : STATUS_BUCKETS.filter(function (b) {
            return b.statuses && b.statuses.some(function (s) { return state.filter.statuses.indexOf(s) !== -1; });
          }).map(function (b) { return b.id; });
      // Translate the group's set-based selection into a bucket toggle.
      var added = next.filter(function (id) { return prev.indexOf(id) === -1; });
      var removed = prev.filter(function (id) { return next.indexOf(id) === -1; });
      var changed = added.length ? added[0] : removed[0];
      if (changed) toggleBucket(changed);
    });

    /* -- filter checkboxes -- */
    root.addEventListener('change', function (e) {
      var cb = e.target.closest && e.target.closest('vaadin-checkbox[data-filter-key]');
      if (!cb) return;
      var key = cb.getAttribute('data-filter-key');
      var val = cb.getAttribute('data-filter-val');
      var cur = (state.filter[key] || []).slice();
      var i = cur.indexOf(val);
      if (cb.checked && i === -1) cur.push(val);
      if (!cb.checked && i !== -1) cur.splice(i, 1);
      // Keep the menu open while the user ticks several boxes.
      var keepOpen = state.openMenu;
      setFilter(defineValue(key, cur.length ? cur : undefined));
      state.openMenu = keepOpen;
      render();
    });

    /* -- sortable headers -- */
    root.addEventListener('sort-direction-change', function (e) {
      var h = e.target.closest('[data-sort]');
      if (!h) return;
      var dir = e.detail && e.detail.direction;
      if (!dir) {
        // Third click clears this column — fall back to the default order.
        state.sortField = 'priority';
        state.sortDir = SORT_DEFAULT_DIR.priority;
      } else {
        state.sortField = h.getAttribute('data-sort');
        state.sortDir = dir;
      }
      render();
    });

    // Close menus on an outside click.
    document.addEventListener('mousedown', function (e) {
      if (!state.openMenu) return;
      if (e.target.closest('.kx-menu') || e.target.closest('[data-menu-toggle]')) return;
      state.openMenu = null;
      render();
    });

    // Station / facet drill-downs dispatched by the v2 hero.
    window.addEventListener('kx-drill-station', function (e) {
      var sid = e.detail && e.detail.stationId;
      if (!sid) return;
      state.activeViewId = null;
      state.filter = { stations: [sid] };
      render();
      requestAnimationFrame(function () { window.scrollTo({ top: 520, behavior: 'smooth' }); });
    });
    window.addEventListener('kx-drill-filter', function (e) {
      var f = e.detail && e.detail.filter;
      if (!f) return;
      state.activeViewId = null;
      state.filter = f;
      render();
      requestAnimationFrame(function () { window.scrollTo({ top: 520, behavior: 'smooth' }); });
    });
    window.addEventListener('kx-jump-view', function (e) {
      state.activeViewId = e.detail && e.detail.viewId;
      applyActiveView();
      window.scrollTo({ top: 480, behavior: 'smooth' });
    });
  }

  function taskById(id) { return K.TASKS.find(function (t) { return t.id === id; }); }
  function defineUndefined(key) { var o = {}; o[key] = undefined; return o; }
  function defineValue(key, val) { var o = {}; o[key] = val; return o; }

  /* ---------------------------------------------------------------------
     BOOT
     --------------------------------------------------------------------- */
  setRole(DEFAULTS.defaultRole);
  wire();

  KX.mountPrototypeFab({
    role: state.role,
    onRoleChange: function (roleId) { setRole(roleId); }
  });

  // Gated roles are phase-2 only. If the flag goes off while we're on one,
  // fall back to Chief so we never sit in a role the switcher can't reach.
  KX.onFlagsChange(function (flags) {
    var r = K.ROLES[state.role];
    if (!flags.futureOn && r && r.gated) setRole('chief');
    else render();
  });

  // Expose for the hero/agency-intelligence layers and for debugging.
  window.KXHub = { applyFilter: applyFilter, bucketCounts: bucketCounts, render: render, state: state };
})();
