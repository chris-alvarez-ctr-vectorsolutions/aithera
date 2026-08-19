/* global window */
// agency-intel-page-data.js — data + logic specific to the Agency Intelligence page.
//
// Builds on window.KEYSTONE (sources, people, stations) and
// window.KEYSTONE_CUSTOM (metric catalog + viz specs). Adds:
//   • metric → source-app mapping (drives access reconciliation)
//   • job titles + per-title data entitlements (the assignment audience model)
//   • named individuals (people with a resolved job title)
//   • seeded dashboards for the populated Agency Intelligence home
//   • Agency Intelligence — a small plain-language response engine that turns a prompt into
//     either text, an inline choice, a widget spec, or a "no data / can't
//     answer" outcome. The principle: Agency Intelligence only ever returns *text* for the
//     chat; widgets are produced as specs the canvas renders.
//
// Plain JS (no JSX) so it loads before the Babel layer.

(function () {
  const K = window.KEYSTONE;
  const CC = window.KEYSTONE_CUSTOM;

  // ---------- Which source app backs each metric ----------
  // Used by access reconciliation: a widget requires its metric's source(s),
  // and we check those against the audience's entitlements.
  const METRIC_SOURCE = {
    overdue_inspections:    ['ci'],
    apparatus_downtime:     ['ci'],
    equipment_failures:     ['ci'],
    training_completion:    ['ts'],
    credential_expirations: ['ts'],
    policy_acks:            ['ts'],
    ceu_progress:           ['ev'],
    open_shifts:            ['sched'],
    pto_pending:            ['sched'],
    ot_trend:               ['sched'],
    sick_leave:             ['sched'],
    trade_requests:         ['sched'],
    response_time:          ['gt'],
    incident_volume:        ['gt'],
    tasks_by_app:           ['ts', 'ci', 'gt', 'sched', 'ev'],
  };

  function metricSources(metricId) {
    return METRIC_SOURCE[metricId] || [];
  }

  // Sources a whole widget spec depends on (handles correlation = 2+ metrics).
  function widgetSources(spec) {
    const ids = spec.metricIds || (spec.metricId ? [spec.metricId] : []);
    const set = {};
    ids.forEach(function (id) { metricSources(id).forEach(function (s) { set[s] = true; }); });
    return Object.keys(set);
  }

  // ---------- Job titles + entitlements ----------
  // entitlements = the set of source apps that role can see data from.
  // The Battalion Chief holds all five sources. That is deliberate: the Chief's
  // home dashboard ends in a tasks_by_app donut whose five slices ARE the five
  // source apps (ts/ci/sched/gt/ev — see the comment on CHIEF_DASH in
  // hub-hero.js), so an assistant sitting beside it that refused Scheduling
  // questions would contradict the surface it lives on.
  // The PRD's access-reconciliation example ("don't have access to Scheduling
  // shift data") consequently lives with the six roles below that hold fewer
  // than all five sources. Exhaustively, what each one is missing:
  //   · Captain            — nothing; holds all five, like the Chief
  //   · Lieutenant         — EV+
  //   · Training Officer   — Check It, Scheduling
  //   · Fleet Manager      — TargetSolutions, EV+
  //   · Engineer           — TargetSolutions, Guardian, EV+
  //   · Paramedic          — Scheduling, Guardian
  //   · Firefighter        — Scheduling, Guardian
  // The seeded audit log's declined asks come from those roles. seedLog() uses a
  // fixed RNG seed, so the split is stable and countable: of its 74 entries, 7
  // are denials — 5 the Training Officer's (4 for Scheduling, 1 for Check It)
  // and 2 the Lieutenant's (both for EV+). No other role happens to draw a
  // question it lacks a source for. (An earlier version of this comment listed
  // only three roles, omitted the Lieutenant entirely, and under-counted what
  // the Engineer and Firefighter were missing; the list above is derived from
  // the JOB_TITLES entries immediately below, so keep the two in sync.)
  const JOB_TITLES = [
    { id: 'battalion_chief',  label: 'Battalion Chief',  count: 4,  entitlements: ['ts', 'ci', 'sched', 'gt', 'ev'] },
    { id: 'captain',          label: 'Captain',          count: 9,  entitlements: ['ts', 'ci', 'sched', 'gt', 'ev'] },
    { id: 'lieutenant',       label: 'Lieutenant',       count: 14, entitlements: ['ts', 'ci', 'sched', 'gt'] },
    { id: 'training_officer', label: 'Training Officer', count: 3,  entitlements: ['ts', 'ev', 'gt'] },
    { id: 'fleet_manager',    label: 'Fleet Manager',    count: 2,  entitlements: ['ci', 'sched', 'gt'] },
    { id: 'engineer',         label: 'Engineer',         count: 11, entitlements: ['ci', 'sched'] },
    { id: 'paramedic',        label: 'Paramedic',        count: 8,  entitlements: ['ts', 'ev', 'ci'] },
    { id: 'firefighter',      label: 'Firefighter',      count: 62, entitlements: ['ts', 'ci', 'ev'] },
  ];
  function titleById(id) { return JOB_TITLES.find(function (t) { return t.id === id; }) || null; }

  // Map a person's free-text rank → a job-title id (for individual targeting).
  const RANK_TO_TITLE = {
    'Battalion Chief': 'battalion_chief',
    'Captain': 'captain',
    'Lieutenant': 'lieutenant',
    'Training Officer': 'training_officer',
    'Engineer': 'engineer',
    'Paramedic': 'paramedic',
    'Firefighter': 'firefighter',
    'Firefighter/EMT': 'firefighter',
  };

  // Named individuals = the department roster, each carrying a resolved title.
  const INDIVIDUALS = (K.PEOPLE || []).map(function (p) {
    const titleId = RANK_TO_TITLE[p.rank] || 'firefighter';
    const st = K.helpers.stationById(p.station);
    return {
      id: p.id,
      name: p.first + ' ' + p.last,
      rank: p.rank,
      titleId: titleId,
      station: st ? st.name : '',
      entitlements: (titleById(titleId) || {}).entitlements || [],
    };
  });

  // Resolve the combined entitlements available to an audience (the
  // intersection — a source is "covered" only if every selected target has it,
  // because reconciliation is about who is *missing* access).
  // We instead report, per missing source, exactly which titles/individuals lack it.
  function reconcileAccess(spec_or_widgets, audience) {
    const widgets = Array.isArray(spec_or_widgets) ? spec_or_widgets : [spec_or_widgets];
    const required = {};
    widgets.forEach(function (w) {
      widgetSources(w).forEach(function (s) {
        if (!required[s]) required[s] = [];
        required[s].push(w);
      });
    });
    const targets = [];
    (audience.titles || []).forEach(function (id) {
      const t = titleById(id);
      if (t) targets.push({ kind: 'title', id: id, label: t.label, entitlements: t.entitlements });
    });
    (audience.individuals || []).forEach(function (id) {
      const ind = INDIVIDUALS.find(function (x) { return x.id === id; });
      if (ind) targets.push({ kind: 'individual', id: id, label: ind.name, entitlements: ind.entitlements });
    });
    // AI groups resolve to people through the roster module. Each matched
    // person is a target in their own right, so a group whose members lack
    // a source raises the same gap a named individual would.
    (audience.groups || []).forEach(function (id) {
      const RS = window.AGENCY_INTEL_ROSTER;
      const g = RS && RS.groupById(id);
      if (!g) return;
      RS.evaluate(g).people.forEach(function (p) {
        targets.push({ kind: 'group', id: p.id, label: p.name + ' (' + g.name + ')',
          entitlements: p.entitlements });
      });
    });

    const gaps = [];
    Object.keys(required).forEach(function (src) {
      const lacking = targets.filter(function (t) { return t.entitlements.indexOf(src) === -1; });
      if (lacking.length) {
        const source = K.SOURCES[src];
        gaps.push({
          source: src,
          sourceName: source ? source.name : src,
          lacking: lacking,
          widgets: required[src],
        });
      }
    });
    return gaps; // [] = clean
  }

  // ---------- Date ranges ----------
  // Every data widget carries a default date range the owner sets when it's
  // created. Viewers can change it to explore, but only the owner's choice
  // persists as the saved default.
  const DATE_RANGES = [
    { value: 'last_7',    label: 'Last 7 days' },
    { value: 'last_30',   label: 'Last 30 days' },
    { value: 'last_90',   label: 'Last 90 days' },
    { value: 'qtd',       label: 'Quarter to date' },
    { value: 'ytd',       label: 'Year to date' },
    { value: 'last_12mo', label: 'Last 12 months' },
    { value: 'next_14',   label: 'Next 14 days' },
    { value: 'next_30',   label: 'Next 30 days' },
  ];
  const DEFAULT_RANGE = 'last_30';
  function rangeLabel(v) { const r = DATE_RANGES.find(function (x) { return x.value === v; }); return r ? r.label : 'Last 30 days'; }
  // A date range only makes sense for time-bounded data — the narrative
  // 'summary' read, author-written text, and the cross-metric summary table
  // aren't scoped to an arbitrary window, so they opt out.
  const NO_RANGE_VIZ = { summary: 1, text: 1, metrics_table: 1 };
  function widgetSupportsRange(spec) {
    if (!spec) return false;
    return !NO_RANGE_VIZ[spec.kind] && !NO_RANGE_VIZ[spec.viz];
  }

  // ---------- Report delivery ----------
  // A dashboard is ONE object with two possible destinations: it can sit LIVE
  // on someone's homepage, and/or be DELIVERED as a formatted report on a
  // cadence. Both can be on at once — that's the point of the combined flow:
  // build the view once, let it land in two places without drifting apart.
  const APP_TODAY = new Date(2026, 4, 7);
  function isoDate(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  const CADENCES = [
    { id: 'once',      label: 'One time',  short: 'One-time', icon: 'send',                hint: 'Send it once, right now' },
    { id: 'weekly',    label: 'Weekly',    short: 'Weekly',   icon: 'event_repeat',        hint: 'Every Monday, 7:00 AM' },
    { id: 'monthly',   label: 'Monthly',   short: 'Monthly',  icon: 'calendar_month',      hint: 'First business day of the month' },
    { id: 'quarterly', label: 'Quarterly', short: 'Quarterly',icon: 'calendar_view_month', hint: 'First day of each quarter' },
  ];
  function cadenceMeta(id) { return CADENCES.find(function (c) { return c.id === id; }) || CADENCES[2]; }

  const REPORT_FORMATS = [
    { id: 'pdf',    label: 'PDF attachment', short: 'PDF',   icon: 'picture_as_pdf', hint: 'A formatted document — best for forwarding to council or command staff' },
    { id: 'xlsx',   label: 'Spreadsheet',    short: 'XLSX',  icon: 'table_view',     hint: 'Every widget as its own data tab' },
    { id: 'inline', label: 'In the email',   short: 'Email', icon: 'mail',           hint: 'Charts rendered right in the message body' },
  ];
  function formatMeta(id) { return REPORT_FORMATS.find(function (f) { return f.id === id; }) || REPORT_FORMATS[0]; }

  // Next occurrence of a cadence, counting from the app's today.
  function nextSendFrom(cadence, fromISO) {
    const d = fromISO ? new Date(fromISO + 'T00:00:00') : new Date(APP_TODAY);
    if (cadence === 'once') return isoDate(d);
    if (cadence === 'weekly') { const n = new Date(d); n.setDate(n.getDate() + ((8 - n.getDay()) % 7 || 7)); return isoDate(n); }
    if (cadence === 'quarterly') {
      const q = Math.floor(d.getMonth() / 3) + 1;
      return isoDate(new Date(d.getFullYear() + (q > 3 ? 1 : 0), (q % 4) * 3, 1));
    }
    const n = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    while (n.getDay() === 0 || n.getDay() === 6) n.setDate(n.getDate() + 1);
    return isoDate(n);
  }

  function defaultDelivery() {
    return {
      on: true, cadence: 'monthly', format: 'pdf', includeSummary: true, paused: false,
      recipients: { titles: [], individuals: [], emails: [] },
      nextSend: nextSendFrom('monthly'),
    };
  }

  function hasHomeAudience(d) {
    const a = d && d.assignedTo;
    return !!(a && (((a.titles || []).length) || ((a.individuals || []).length) || ((a.displays || []).length)));
  }
  // NOT IN V1 — emailed dashboard updates are a follow-up feature, so the whole
  // report-delivery surface sits behind the Future-functionality flag. This is
  // the single choke point: with the flag off deliveryOf() reports every
  // dashboard as undelivered, which is what removes the Scheduled status and
  // filter, the Delivery column and card pill, the build view's schedule
  // button, and the publish dialog's "deliver it as a report" step. The seeded
  // delivery objects are left untouched, so flipping the flag on restores the
  // full feature with its data intact.
  function deliveryEnabled() {
    return !!(window.KX && window.KX.getFlags().futureOn);
  }
  function deliveryOf(d) {
    if (!deliveryEnabled()) return null;
    return (d && d.delivery && d.delivery.on) ? d.delivery : null;
  }

  /* ---------- Static or dynamic access list? ----------
     `titles` and AI `groups` are ATTRIBUTE-DRIVEN: a promotion, a transfer or a
     shift change moves someone in or out of the audience with nobody editing the
     dashboard. The audience picker already calls saved groups "live rules —
     people who match later receive this automatically"; this is the same fact,
     surfaced in the list so you can see it without opening the dashboard.
     `individuals` are hand-picked and change only when a person edits the list.

     Three modes, not two, because "rule plus a few named exceptions" is the
     common real case — 23 of the 36 published dashboards — and folding it into
     `dynamic` would label almost every published dashboard identically and say
     nothing. */
  const AUDIENCE_MODES = {
    dynamic: { id: 'dynamic', label: 'Dynamic', dot: 'var(--lumo-primary-color)',
      hint: 'Membership follows job titles and live rules. Promotions, transfers and shift changes update it automatically.' },
    mixed:   { id: 'mixed',   label: 'Mixed',   dot: 'var(--amber-500)',
      hint: 'Rule-driven membership plus named individuals. The rule part keeps itself current; the named people stay put until someone edits them.' },
    static:  { id: 'static',  label: 'Static',  dot: 'var(--ink-400)',
      hint: 'A fixed list of named people. It changes only when someone edits it — a promotion or shift change will not.' }
  };

  function audienceMode(d) {
    const a = d && d.assignedTo;
    if (!a) return null;
    const byRule  = ((a.titles || []).length + (a.groups || []).length) > 0;
    const byName  = (a.individuals || []).length > 0;
    if (!byRule && !byName) return null;      // assigned to nobody — nothing to say
    if (byRule && byName) return 'mixed';
    return byRule ? 'dynamic' : 'static';
  }

  function audienceModeMeta(d) {
    const m = audienceMode(d);
    return m ? AUDIENCE_MODES[m] : null;
  }

  function reportReach(dl) {
    if (!dl) return 0;
    const r = dl.recipients || {};
    let n = (r.individuals || []).length + (r.emails || []).length;
    (r.titles || []).forEach(function (id) { const t = titleById(id); if (t) n += (t.count || 0); });
    return n;
  }

  // Where does this dashboard land? Drives the management table's Delivery
  // column and the build view's delivery chip.
  function deliveryMeta(d) {
    const live = hasHomeAudience(d);
    const dl = deliveryOf(d);
    if (!live && !dl) return null;
    const rep = dl ? (cadenceMeta(dl.cadence).short + ' ' + formatMeta(dl.format).short) : null;
    const paused = !!(dl && dl.paused);
    let text;
    if (live && rep) text = 'Live + ' + rep;
    else if (rep) text = rep;
    else text = 'Live';
    return {
      live: live, report: dl || null, paused: paused, text: paused ? text + ' (paused)' : text,
      icon: dl ? (paused ? 'pause_circle' : 'schedule_send') : 'bolt',
      nextSend: dl && !paused && dl.cadence !== 'once' ? dl.nextSend : null,
    };
  }

  // ---------- Agency Intelligence's report cover summary ----------
  // Reads every metric on the dashboard and writes the lead paragraph plus the
  // at-a-glance rows that head a delivered report.
  function reportSummary(dash) {
    const ids = [];
    (dash.widgets || []).forEach(function (w) {
      (w.metricIds || (w.metricId ? [w.metricId] : [])).forEach(function (id) { if (ids.indexOf(id) === -1) ids.push(id); });
    });
    const rank = { bad: 0, warn: 1, flat: 2, good: 3 };
    const rows = ids.map(function (id) {
      const meta = CC.metricById(id);
      const data = CC.METRIC_DATA[id];
      if (!meta || !data || !data.kpi) return null;
      const tone = data.kpi.tone || 'flat';
      return { id: id, label: meta.label, icon: meta.icon, num: data.kpi.num, delta: data.kpi.delta || '', tone: tone };
    }).filter(Boolean).sort(function (a, b) { return (rank[a.tone] == null ? 2 : rank[a.tone]) - (rank[b.tone] == null ? 2 : rank[b.tone]); });
    const watch = rows.filter(function (r) { return r.tone === 'bad' || r.tone === 'warn'; });
    let lead;
    if (!rows.length) lead = 'This report covers the widgets on “' + (dash.name || 'this dashboard') + '”. Add a metric widget and Agency Intelligence will summarize the period here.';
    else if (watch.length) lead = watch.length + ' of ' + rows.length + ' tracked measures moved the wrong way this period. ' + watch[0].label + ' is the one to watch — currently ' + watch[0].num + (watch[0].delta ? ' (' + watch[0].delta + ')' : '') + '. The rest are holding.';
    else lead = 'All ' + rows.length + ' tracked measures are steady or improving this period. Nothing on this report needs escalation.';
    return { lead: lead, rows: rows };
  }

  // ---------- Widget spec helpers ----------
  let WID = 0;
  function defaultWidth(spec) {
    if (spec.viz === 'text' || spec.kind === 'text') return 12;
    if (spec.viz === 'metrics_table') return 8;
    if (spec.viz === 'kpi' || spec.viz === 'summary') return 4;
    if (spec.viz === 'table') return 8;
    return 6;
  }
  function newWidget(spec) {
    WID += 1;
    const base = { id: 'w' + Date.now().toString(36) + '_' + WID, state: 'live', w: defaultWidth(spec) };
    const out = Object.assign(base, spec);
    if (widgetSupportsRange(out) && !out.dateRange) out.dateRange = DEFAULT_RANGE;
    return out;
  }

  function widgetTitle(spec) {
    if (spec.kind === 'text' || spec.viz === 'text') return spec.heading || 'Text block';
    if (spec.viz === 'metrics_table') return spec.heading || 'Summary table';
    if (spec.kind === 'summary') {
      const m = CC.metricById(spec.metricId);
      return m ? (m.label + ' — summary') : 'Summary';
    }
    if (spec.metricIds && spec.metricIds.length >= 2) {
      return spec.metricIds.map(function (id) { var m = CC.metricById(id); return m ? m.label : id; }).join(' × ');
    }
    const m = CC.metricById(spec.metricId || (spec.metricIds || [])[0]);
    return m ? m.label : 'Metric';
  }

  function widgetIcon(spec) {
    if (spec.kind === 'text' || spec.viz === 'text') return 'notes';
    if (spec.viz === 'metrics_table') return 'table_chart';
    const m = CC.metricById(spec.metricId || (spec.metricIds || [])[0]);
    return m ? m.icon : 'insights';
  }

  // ---------- Seeded text summaries (for the 'summary' widget) ----------
  const SUMMARIES = {
    training_completion: 'Battalion training completion sits at <b>79%</b>, down 4 points this quarter. <b>Sta. 4</b> and <b>Sta. 7</b> are the only houses below 75% — the same crews carrying the most overdue apparatus inspections. This reads as a crew-capacity bottleneck, not a process gap.',
    credential_expirations: '<b>11 personnel</b> hold a credential expiring within 60 days while under 50% CEU progress. Four are paramedic re-certs (~$8K each to replace, plus two weeks out of service). Three open seats in Q3 Cohort A match the paramedic window.',
    ot_trend: 'Projected overtime for B-1 next month is <b>412 hours</b> (vs. 348 in May). <b>Sta. 7</b> drives ~60% of the increase — four unfilled vacancies overlapping three approved PTO blocks Jun 2–9. Filling two of the four brings OT back under baseline.',
    open_shifts: 'Nine open shifts in the next 14 days; six are at <b>Sta. 7</b>. Two have no coverage path at all — a Jun 2 engineer seat and a Jun 6 lieutenant seat that would need mutual aid.',
    apparatus_downtime: 'Apparatus downtime reached <b>42 hours</b> in May, up 12 from April. <b>Engine 4-A</b> (pump rebuild) and <b>Ladder 7</b> (aerial cert) account for the bulk. Unscheduled downtime is now outpacing scheduled.',
  };
  function summaryText(metricId) {
    return SUMMARIES[metricId] || 'Here is a short read on this metric across the battalion, refreshed live from the connected source apps.';
  }

  // ---------- Widget → tabular data ----------
  // Flattens any widget (chart or table) into { title, columns, rows } so the
  // export flow can present one editable grid regardless of how the widget is
  // drawn. Rows are arrays of primitive cells. Widgets without resolvable data
  // (loading / access / no-data) come back with an empty rows array + a note.
  function widgetToTable(widget) {
    const title = widgetTitle(widget);
    if (widget.state === 'loading' || widget.state === 'access' || widget.state === 'nodata') {
      return { title: title, columns: [], rows: [], note: widget.state === 'access' ? 'Access required — no exportable data.' : (widget.state === 'nodata' ? 'No data for this query.' : 'Still loading.') };
    }
    if (widget.kind === 'summary' || widget.viz === 'summary') {
      const txt = String(summaryText(widget.metricId)).replace(/<[^>]+>/g, '');
      return { title: title, columns: ['Narrative summary'], rows: [[txt]] };
    }
    if (widget.kind === 'text' || widget.viz === 'text') {
      return { title: title, columns: ['Section', 'Text'], rows: [[widget.heading || '', widget.body || '']] };
    }
    if (widget.viz === 'metrics_table') {
      const ms = CC.buildMetricsTableSpec(widget.metricIds || []);
      return { title: title, columns: ['Measure', 'Current', 'Change', 'Status'], rows: (ms.rows || []).map(function (r) { return [r.label, r.num, r.delta, r.status]; }) };
    }
    let spec;
    if (widget.metricIds && widget.metricIds.length >= 2) {
      if (widget.viz === 'pair') spec = CC.buildCorrelationSpec(widget.metricIds, 'pair') || CC.buildSpec(widget.metricIds[0], 'bar');
      else if (widget.viz === 'line') spec = CC.buildCorrelationSpec(widget.metricIds, 'line');
      // A scatter is TWO metrics aligned on their shared categories, which only
      // buildCorrelationSpec knows how to pair up. It used to fall to
      // buildSpec(metricIds[0], 'scatter') — a viz that builder does not make —
      // so every correlation widget exported "No exportable data", on this page
      // and on the Hub's published dashboards alike.
      else if (widget.viz === 'scatter') spec = CC.buildCorrelationSpec(widget.metricIds, 'scatter');
      else spec = CC.buildSpec(widget.metricIds[0], widget.viz);
    } else {
      spec = CC.buildSpec(widget.metricId, widget.viz);
    }
    if (!spec) return { title: title, columns: [], rows: [], note: 'No exportable data.' };

    // One row per plotted point: the shared category and both measures. That is
    // the correlation as data — the trend line is drawn from it, not stored.
    if (spec.kind === 'scatter') {
      const xu = spec.xUnit ? ' (' + spec.xUnit + ')' : '';
      const yu = spec.yUnit ? ' (' + spec.yUnit + ')' : '';
      return { title: title, columns: ['Category', spec.xLabel + xu, spec.yLabel + yu],
        rows: (spec.points || []).map(function (p) { return [p.label, p.x, p.y]; }) };
    }

    const unitSuffix = (spec.unit && spec.unit !== '%' && spec.unit !== '') ? ' (' + spec.unit + ')' : '';

    if (spec.kind === 'bar-pair') {
      const labels = spec.labels || ['A', 'B'];
      return { title: title, columns: ['Category', labels[0], labels[1]], rows: (spec.data || []).map(function (d) { return [d.label, d.a, d.b]; }) };
    }
    if (spec.kind === 'line-dual') {
      const series = spec.series || [];
      const cols = ['Period'].concat(series.map(function (s) { return s.label; }));
      const n = series[0] ? series[0].data.length : 0;
      const rows = [];
      for (let i = 0; i < n; i++) {
        rows.push([series[0].data[i].x].concat(series.map(function (s) { return s.data[i] ? s.data[i].y : ''; })));
      }
      return { title: title, columns: cols, rows: rows };
    }
    if (spec.viz === 'kpi') {
      const r = [spec.label, spec.num];
      const cols = ['Metric', 'Value'];
      if (spec.delta) { cols.push('Change'); r.push(spec.delta); }
      return { title: title, columns: cols, rows: [r] };
    }
    if (spec.viz === 'bar') {
      return { title: title, columns: ['Category', spec.label + unitSuffix], rows: (spec.data || []).map(function (d) { return [d.label, d.value]; }) };
    }
    if (spec.viz === 'line') {
      return { title: title, columns: ['Period', spec.label + unitSuffix], rows: (spec.data || []).map(function (d) { return [d.x + (d.projected ? ' (proj.)' : ''), d.y]; }) };
    }
    if (spec.viz === 'stack') {
      const legend = spec.legend || ['A', 'B', 'C'];
      const rows = (spec.data || []).map(function (r) {
        const out = [r.label];
        if (legend[0] != null) out.push(r.a != null ? r.a : '');
        if (legend[1] != null) out.push(r.b != null ? r.b : '');
        if (legend[2] != null) out.push(r.c != null ? r.c : '');
        return out;
      });
      return { title: title, columns: ['Category'].concat(legend), rows: rows };
    }
    if (spec.viz === 'donut') {
      return { title: title, columns: ['Segment', 'Value'], rows: (spec.data || []).map(function (d) { return [d.label, d.value]; }) };
    }
    if (spec.viz === 'table') {
      return { title: title, columns: (spec.cols || []).slice(), rows: (spec.rows || []).map(function (r) { return r.slice(); }) };
    }
    // Fallback: whatever `data` looks like.
    if (spec.data) {
      return { title: title, columns: ['Category', spec.label || 'Value'], rows: spec.data.map(function (d) { return [d.label || d.x, d.value != null ? d.value : d.y]; }) };
    }
    return { title: title, columns: [], rows: [], note: 'No exportable data.' };
  }


  // ---------- Dashboard lifecycle status ----------
  // draft     — work in progress, not shared anywhere
  // private   — finished, shows only on the creator's home (no team audience)
  // published — pushed to job titles / individuals (team sees it)
  // scheduled — delivered as a report on a cadence, but not live on any homepage
  const DASH_STATUSES = [
    { id: 'draft',     label: 'Draft',     icon: 'edit_note',     fg: 'var(--amber-700)', bg: 'var(--amber-50)',  border: 'var(--amber-100)', accent: 'var(--amber-400)' },
    { id: 'private',   label: 'Private',   icon: 'lock',          fg: 'var(--ink-700)',   bg: 'var(--surface-3)', border: 'var(--ink-200)',   accent: 'var(--ink-300)' },
    { id: 'scheduled', label: 'Scheduled', icon: 'schedule_send', fg: 'var(--lumo-primary-text-color)', bg: 'var(--lumo-primary-color-10pct)', border: 'rgba(2,113,206,0.3)', accent: 'var(--lumo-primary-color)' },
    { id: 'published', label: 'Published', icon: 'campaign',      fg: 'var(--teal-600)',  bg: 'var(--teal-50)',   border: 'var(--teal-100)',  accent: 'var(--teal-300)' },
  ];
  const STATUS_RANK = { draft: 0, private: 1, scheduled: 2, published: 3 };
  function dashStatusMeta(id) { return DASH_STATUSES.find(function (s) { return s.id === id; }) || DASH_STATUSES[0]; }
  // Source of truth is d.status; a report-only dashboard reads as 'scheduled',
  // and a legacy audience with no status infers 'published'. Goes through
  // deliveryOf(), so with the Future-functionality flag off no dashboard ever
  // reads as 'scheduled' — it falls back to its own draft/private/published.
  function statusOf(d) {
    if (deliveryOf(d) && !hasHomeAudience(d)) return 'scheduled';
    if (d && d.status) return d.status;
    const a = d && d.assignedTo;
    return (a && ((a.titles || []).length || (a.individuals || []).length)) ? 'published' : 'draft';
  }

  // ---------- Seeded dashboards (populated home) ----------
  function W(spec) { return newWidget(Object.assign({ kind: spec.metricIds ? 'correlation' : (spec.viz === 'summary' ? 'summary' : 'metric') }, spec)); }

  function seedDashboards() {
    return [
      {
        id: 'dash_readiness',
        name: 'Battalion Readiness — B-1',
        icon: 'shield',
        owner: 'You',
        createdAt: '2026-04-18',
        updatedAt: '2026-05-06',
        status: 'published',
        assignedTo: { titles: ['battalion_chief'], individuals: [] },
        // Live for the chiefs AND a monthly PDF to the city manager — one
        // object, two destinations. This is the combined flow's whole point.
        delivery: {
          on: true, cadence: 'monthly', format: 'pdf', includeSummary: true, paused: false,
          recipients: { titles: ['battalion_chief'], individuals: [], emails: ['city.manager@keystone.gov'] },
          nextSend: nextSendFrom('monthly'), lastSent: '2026-05-01',
        },
        widgets: [
          W({ metricId: 'training_completion', viz: 'kpi', w: 3, dateRange: 'qtd' }),
          W({ metricId: 'open_shifts', viz: 'kpi', w: 3, dateRange: 'next_14' }),
          W({ metricIds: ['training_completion', 'overdue_inspections'], viz: 'pair', w: 6, dateRange: 'last_90' }),
          W({ metricId: 'ot_trend', viz: 'line', w: 6, dateRange: 'last_12mo' }),
          W({ metricId: 'open_shifts', viz: 'table', w: 6, dateRange: 'next_14' }),
          W({ metricId: 'training_completion', viz: 'summary', w: 12 }),
        ],
      },
      {
        id: 'dash_fleet',
        name: 'Fleet Status',
        icon: 'fire_truck',
        owner: 'You',
        createdAt: '2026-04-29',
        updatedAt: '2026-05-05',
        // Published to an AI group (a live rule) rather than fixed titles —
        // so the dashboards table shows that state on first load.
        status: 'published',
        assignedTo: { titles: [], individuals: [], groups: ['grp_airport_c'] },
        widgets: [
          W({ metricId: 'apparatus_downtime', viz: 'kpi', w: 3, dateRange: 'last_30' }),
          W({ metricId: 'equipment_failures', viz: 'kpi', w: 3, dateRange: 'last_30' }),
          W({ metricId: 'apparatus_downtime', viz: 'line', w: 6, dateRange: 'last_12mo' }),
          W({ metricId: 'overdue_inspections', viz: 'bar', w: 6, dateRange: 'last_90' }),
          W({ metricId: 'overdue_inspections', viz: 'table', w: 6 }),
        ],
      },
      {
        id: 'dash_compliance',
        name: 'Compliance Pulse',
        icon: 'verified',
        owner: 'You',
        createdAt: '2026-05-01',
        updatedAt: '2026-05-04',
        status: 'draft',
        assignedTo: null,
        widgets: [
          W({ metricId: 'policy_acks', viz: 'kpi', w: 3, dateRange: 'ytd' }),
          W({ metricId: 'credential_expirations', viz: 'kpi', w: 3, dateRange: 'next_30' }),
          W({ metricId: 'credential_expirations', viz: 'stack', w: 6, dateRange: 'next_30' }),
          W({ metricId: 'ceu_progress', viz: 'bar', w: 6, dateRange: 'qtd' }),
          W({ metricId: 'credential_expirations', viz: 'summary', w: 12 }),
        ],
      },
      {
        id: 'dash_council',
        name: 'Quarterly Council Brief',
        icon: 'gavel',
        owner: 'You',
        createdAt: '2026-03-02',
        updatedAt: '2026-05-02',
        // Report-only: nobody's homepage carries it, it just goes out.
        status: 'draft',
        assignedTo: null,
        delivery: {
          on: true, cadence: 'quarterly', format: 'pdf', includeSummary: true, paused: false,
          recipients: { titles: [], individuals: [], emails: ['city.manager@keystone.gov', 'council.clerk@keystone.gov'] },
          nextSend: nextSendFrom('quarterly'), lastSent: '2026-04-01',
        },
        widgets: [
          W({ kind: 'text', viz: 'text', w: 12, heading: 'Where the department stands', body: 'This quarter the department held response times inside the target window while absorbing a 9% rise in call volume. Training completion slipped four points, concentrated at Stations 4 and 7 — the same two houses carrying the inspection backlog. We are requesting two additional line positions at Station 7 to break the overtime cycle documented below.' }),
          W({ kind: 'metrics_table', viz: 'metrics_table', w: 12, heading: 'Readiness at a glance', metricIds: ['training_completion', 'overdue_inspections', 'response_time', 'ot_trend', 'incident_volume'] }),
          W({ metricId: 'ot_trend', viz: 'line', w: 6, dateRange: 'last_12mo' }),
          W({ metricId: 'incident_volume', viz: 'bar', w: 6, dateRange: 'qtd' }),
        ],
      },
    ].concat(generateSeededDashboards());
  }

  // Deterministic large set so the management table reflects a real chief's
  // volume (big-city departments run into the hundreds). Seeded RNG keeps the
  // list stable across reloads so pagination doesn't reshuffle.
  function generateSeededDashboards() {
    let s = 0x9e3779b9;
    const rnd = function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pick = function (arr) { return arr[Math.floor(rnd() * arr.length)]; };
    const pickN = function (arr, n) {
      const c = arr.slice(); const out = [];
      while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]);
      return out;
    };
    const metricIds = CC.AVAILABLE_METRICS.map(function (m) { return m.id; });
    const titleIds = JOB_TITLES.map(function (t) { return t.id; });
    const indIds = INDIVIDUALS.map(function (i) { return i.id; });
    const icons = ['shield', 'fire_truck', 'verified', 'local_fire_department', 'medical_services', 'engineering', 'school', 'workspace_premium', 'event_available', 'groups', 'inventory_2', 'health_and_safety', 'water_drop', 'build', 'speed', 'apartment', 'emergency', 'construction'];
    const areas = ['Downtown', 'Riverside', 'East Hills', 'Industrial', 'North', 'South', 'Midtown', 'Lakeside', 'Airport', 'Westgate', 'Harbor', 'Cedar Park', 'Millbrook', 'Oakridge'];
    const batts = ['B-1', 'B-2', 'B-3', 'B-4', 'B-5'];
    const shifts = ['A', 'B', 'C'];
    const qtrs = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2025', 'Annual 2026'];
    const cohorts = ['Paramedic Cohort A', 'EVOC Group 2', 'HazMat 2026', 'Officer Track', 'CPR/AED Renewal'];
    const templates = [
      function (p) { return 'Station ' + p.stn + ' Readiness'; },
      function (p) { return 'Station ' + p.stn + ' Apparatus Check'; },
      function (p) { return p.shift + '-Shift Coverage — ' + p.batt; },
      function (p) { return 'EMS Response — ' + p.area; },
      function (p) { return 'Credential Tracker — ' + p.cohort; },
      function (p) { return 'Hazmat Team Readiness — ' + p.batt; },
      function (p) { return 'Training Compliance — ' + p.qtr; },
      function (p) { return 'Overtime Watch — ' + p.batt; },
      function (p) { return 'Fleet Maintenance — ' + p.area; },
      function (p) { return 'PPE Inventory — ' + p.area; },
      function (p) { return 'Inspections Backlog — ' + p.area; },
      function (p) { return 'Wellness & Sick Leave — ' + p.batt; },
      function (p) { return 'Incident Volume — ' + p.area; },
      function (p) { return 'Policy Acknowledgment — ' + p.qtr; },
      function (p) { return 'Shift Trades — ' + p.batt; },
      function (p) { return 'Recruit Academy — ' + p.cohort; },
    ];
    const months = [['2025', 9], ['2025', 10], ['2025', 11], ['2025', 12], ['2026', 1], ['2026', 2], ['2026', 3], ['2026', 4], ['2026', 5]];
    const iso = function (m, d) { return m[0] + '-' + String(m[1]).padStart(2, '0') + '-' + String(d).padStart(2, '0'); };

    const COUNT = 65;
    const out = [];
    const seen = {};
    for (let i = 0; i < COUNT; i++) {
      const tpl = templates[i % templates.length];
      const params = { stn: 1 + Math.floor(rnd() * 28), area: pick(areas), batt: pick(batts), shift: pick(shifts), qtr: pick(qtrs), cohort: pick(cohorts) };
      let name = tpl(params);
      if (seen[name]) name = name + ' · ' + params.batt + '-' + (1 + Math.floor(rnd() * 9));
      seen[name] = true;

      const nWidgets = 2 + Math.floor(rnd() * 6); // 2..7
      const widgets = [];
      for (let k = 0; k < nWidgets; k++) {
        // Only pair metrics that share a categorical axis — otherwise the
        // correlation has no common ground and would render empty.
        const pair = rnd() < 0.16 ? pickCorrelatablePair(metricIds, pickN) : null;
        if (pair) {
          widgets.push(W({ metricIds: pair, viz: 'pair' }));
        } else {
          const mid = pick(metricIds);
          widgets.push(W({ metricId: mid, viz: CC.DEFAULT_VIZ[mid] || 'bar' }));
        }
      }

      let assignedTo = null;
      let status;
      if (rnd() < 0.5) {
        assignedTo = { titles: pickN(titleIds, 1 + Math.floor(rnd() * 3)), individuals: rnd() < 0.55 ? pickN(indIds, 1 + Math.floor(rnd() * 4)) : [] };
        // Every fourth published dashboard that already carries named people
        // drops its titles and becomes a hand-picked list, so the management
        // list shows Static beside Dynamic and Mixed instead of one value
        // everywhere. Keyed off the loop index and NOT rnd(): rnd() is a seeded
        // stream, so an extra draw here would reshuffle every dashboard's name,
        // dates and widgets. Reusing individuals already drawn costs no draw.
        if (i % 4 === 1 && assignedTo.individuals.length) assignedTo.titles = [];
        status = 'published';
      } else {
        status = rnd() < 0.5 ? 'draft' : 'private';
      }

      // Roughly a third of views also (or only) go out as a report.
      let delivery = null;
      if (rnd() < 0.32) {
        const cad = pick(['weekly', 'monthly', 'monthly', 'quarterly']);
        delivery = {
          on: true, cadence: cad, format: pick(['pdf', 'pdf', 'xlsx', 'inline']),
          includeSummary: rnd() < 0.7, paused: rnd() < 0.12,
          recipients: {
            titles: pickN(titleIds, 1 + Math.floor(rnd() * 2)),
            individuals: rnd() < 0.3 ? pickN(indIds, 1 + Math.floor(rnd() * 2)) : [],
            emails: rnd() < 0.35 ? ['city.manager@keystone.gov'] : [],
          },
          nextSend: nextSendFrom(cad),
        };
      }

      const ci = Math.floor(rnd() * months.length);
      const ui = Math.min(months.length - 1, ci + Math.floor(rnd() * 2));
      out.push({
        id: 'dash_gen_' + i,
        name: name,
        icon: pick(icons),
        owner: 'You',
        createdAt: iso(months[ci], 1 + Math.floor(rnd() * 27)),
        updatedAt: iso(months[ui], 1 + Math.floor(rnd() * 27)),
        status: status,
        assignedTo: assignedTo,
        delivery: delivery,
        widgets: widgets,
      });
    }
    return out;
  }

  // Try a handful of random pairs and keep the first that shares an axis.
  function pickCorrelatablePair(metricIds, pickN) {
    for (let i = 0; i < 8; i++) {
      const p = pickN(metricIds, 2);
      if (p.length === 2 && CC.metricsCorrelatable(p)) return p;
    }
    return null;
  }

  // Job titles that already hold an assigned dashboard (drives the override
  // confirmation). Seeded so 'battalion_chief' already has one.
  const PRE_ASSIGNED = {
    titles: { battalion_chief: 'Battalion Readiness — B-1' },
    individuals: {},
  };

  // ---------- Idea gallery (new-dashboard empty state) ----------
  // Each idea is a checkbox the user can multi-select; "Go" generates them all.
  const IDEA_PROMPTS = [
    { id: 'idea_training', icon: 'school',        prompt: 'Show on-time certification renewals this month',          make: function () { return W({ metricId: 'training_completion', viz: 'kpi', w: 4 }); } },
    { id: 'idea_corr',     icon: 'compare_arrows', prompt: 'Where is training dragging down apparatus inspections?',  make: function () { return W({ metricIds: ['training_completion', 'overdue_inspections'], viz: 'pair', w: 6 }); } },
    { id: 'idea_ot',       icon: 'trending_up',   prompt: 'Forecast overtime risk for the next 30 days',             make: function () { return W({ metricId: 'ot_trend', viz: 'line', w: 6 }); } },
    { id: 'idea_shifts',   icon: 'event_busy',    prompt: 'Which shifts are understaffed in the next 14 days?',       make: function () { return W({ metricId: 'open_shifts', viz: 'table', w: 8 }); } },
    { id: 'idea_creds',    icon: 'workspace_premium', prompt: 'Which credentials expire before CEUs are in place?',  make: function () { return W({ metricId: 'credential_expirations', viz: 'stack', w: 6 }); } },
    { id: 'idea_downtime', icon: 'fire_truck',    prompt: 'Show apparatus downtime trend by month',                  make: function () { return W({ metricId: 'apparatus_downtime', viz: 'line', w: 6 }); } },
    // ---- second batch (revealed by "View more ideas") ----
    { id: 'idea_pto',      icon: 'event_busy',    prompt: 'Compare pending PTO against open shifts',                 make: function () { return W({ metricIds: ['pto_pending', 'open_shifts'], viz: 'pair', w: 6 }); } },
    { id: 'idea_sick',     icon: 'sick',          prompt: 'Is sick leave driving overtime?',                         make: function () { return W({ metricIds: ['sick_leave', 'ot_trend'], viz: 'pair', w: 6 }); } },
    { id: 'idea_response', icon: 'speed',         prompt: 'Track average response time over the year',               make: function () { return W({ metricId: 'response_time', viz: 'line', w: 6 }); } },
    { id: 'idea_incidents',icon: 'local_fire_department', prompt: 'Show incident volume by station',                 make: function () { return W({ metricId: 'incident_volume', viz: 'bar', w: 6 }); } },
    { id: 'idea_equip',    icon: 'report',        prompt: 'Which equipment is failing most?',                        make: function () { return W({ metricId: 'equipment_failures', viz: 'bar', w: 6 }); } },
    { id: 'idea_policy',   icon: 'fact_check',    prompt: 'How are policy acknowledgments trending?',                make: function () { return W({ metricId: 'policy_acks', viz: 'kpi', w: 4 }); } },
    { id: 'idea_apps',     icon: 'apps',          prompt: 'Show open work across every source app',                  make: function () { return W({ metricId: 'tasks_by_app', viz: 'bar', w: 6 }); } },
    { id: 'idea_ceu',      icon: 'school',        prompt: 'Show CEU progress by station',                            make: function () { return W({ metricId: 'ceu_progress', viz: 'bar', w: 6 }); } },
  ];

  // ---------- Agency Intelligence — plain-language response engine ----------
  // Returns one of:
  //   { kind:'widget',  text, widget }              → text reply + 1 canvas widget
  //   { kind:'choice',  text, choices:[{label,send}]} → text reply + inline buttons
  //   { kind:'refine',  text, patch }               → modify an existing widget
  //   { kind:'nodata',  text, widget(state:nodata) } → recognised, but no data
  //   { kind:'cant',    text }                       → can't answer
  //   { kind:'text',    text }                       → plain reply
  function lc(s) { return String(s || '').toLowerCase(); }
  function has(s, re) { return re.test(lc(s)); }

  // Map an intent to a metric/viz; null if unmatched.
  function matchMetric(q) {
    if (has(q, /training/) && has(q, /inspection/)) return { metricIds: ['training_completion', 'overdue_inspections'], viz: 'pair' };
    if (has(q, /credential|cert/) && has(q, /ceu|expir|renew/)) return { metricId: 'credential_expirations', viz: 'stack' };
    if (has(q, /overtime|\bot\b|ot hours/)) return { metricId: 'ot_trend', viz: 'line' };
    if (has(q, /open shift|understaff|coverage|vacan/)) return { metricId: 'open_shifts', viz: 'table' };
    if (has(q, /pto|time off|leave/)) return { metricId: 'pto_pending', viz: 'table' };
    if (has(q, /downtime|apparatus|fleet|out of service/)) return { metricId: 'apparatus_downtime', viz: 'line' };
    if (has(q, /equipment|scba|gear failure|failure/)) return { metricId: 'equipment_failures', viz: 'bar' };
    if (has(q, /response time/)) return { metricId: 'response_time', viz: 'line' };
    if (has(q, /incident|call volume/)) return { metricId: 'incident_volume', viz: 'line' };
    if (has(q, /sick/)) return { metricId: 'sick_leave', viz: 'line' };
    if (has(q, /trade/)) return { metricId: 'trade_requests', viz: 'bar' };
    if (has(q, /policy|acknowledg/)) return { metricId: 'policy_acks', viz: 'kpi' };
    if (has(q, /credential|cert|expir/)) return { metricId: 'credential_expirations', viz: 'kpi' };
    if (has(q, /training|complet/)) return { metricId: 'training_completion', viz: 'kpi' };
    if (has(q, /inspection|overdue/)) return { metricId: 'overdue_inspections', viz: 'bar' };
    if (has(q, /by app|source app|across|all apps/)) return { metricId: 'tasks_by_app', viz: 'bar' };
    return null;
  }

  // Recognised-but-no-data topics, and out-of-scope topics.
  const NO_DATA = /hydrant|water flow|fuel (price|cost)|budget|dollar|email|nozzle pressure|tornado|weather|social media/;
  const CANT = /\b(joke|poem|sing|who are you|your name|love|meaning of life|hello|hi there|hey agency)\b/;

  function vText(metricId) {
    const phrases = {
      training_completion: 'Training completion is at 79% and trending down. Pulled it onto the canvas as a headline figure.',
      overdue_inspections: '14 inspections are overdue, concentrated at Sta. 4. Charted by station on the canvas.',
      credential_expirations: '11 credentials expire within 60 days. Broke it out as at-risk vs. on-track on the canvas.',
      ot_trend: 'Projected overtime is climbing — 412 hours next month. Trend line is on the canvas.',
      open_shifts: 'Nine open shifts in the next 14 days, six at Sta. 7. Listed them as a table on the canvas.',
      apparatus_downtime: 'Apparatus downtime hit 42 hours in May. Plotted the monthly trend on the canvas.',
      pto_pending: 'Six PTO requests are pending; three fall in coverage-critical windows. Table is on the canvas.',
      response_time: 'Median response time is 6:42, up 18 seconds this quarter. Trend is on the canvas.',
      incident_volume: 'Incident volume is up 9% year over year. Monthly trend added to the canvas.',
      sick_leave: 'Sick leave reached 184 hours last month, up 22%. Trend is on the canvas.',
      equipment_failures: '17 equipment failures last month, led by SCBA. Charted by type on the canvas.',
      policy_acks: 'Policy acknowledgments are at 88%, up 5 points. Added the figure to the canvas.',
      trade_requests: '23 shift-trade requests this period, 8 awaiting approval. Charted on the canvas.',
      tasks_by_app: 'Here is open work across all five source apps, charted on the canvas.',
      ceu_progress: 'CEU progress averages 64%, slipping 6 points. Charted by station on the canvas.',
    };
    return phrases[metricId] || 'Here is what I found, on the canvas.';
  }

  function agencyIntelRespond(prompt, ctx) {
    ctx = ctx || {};
    const q = lc(prompt);

    // Refinement intents act on an existing widget (the most-recent, or a
    // referenced one). Detect viz changes + scope phrasing.
    const refineViz =
      has(q, /\bbar\b|bar chart/) ? 'bar' :
      has(q, /line|trend over time|over time/) ? 'line' :
      has(q, /stacked|stack|at[- ]risk vs/) ? 'stack' :
      has(q, /table|list|rows/) ? 'table' :
      has(q, /big number|single number|headline|kpi/) ? 'kpi' :
      has(q, /donut|pie|share of/) ? 'donut' : null;
    const isRefinePhrasing = has(q, /^(make|turn|show|change|switch|render)\b/) || has(q, /\b(instead|that|this|it) (as|to|into)\b/) || has(q, /^as a /);
    if (refineViz && (ctx.hasWidgets) && (isRefinePhrasing || ctx.forceRefine)) {
      return { kind: 'refine', patch: { viz: refineViz }, text: 'Done — switched it to a ' + ({ bar: 'bar chart', line: 'trend line', stack: 'stacked bar', table: 'table', kpi: 'headline number', donut: 'donut' }[refineViz]) + '.' };
    }
    if (ctx.hasWidgets && has(q, /by station|per station|break.*station|break it out/)) {
      return { kind: 'refine', patch: { scope: 'by station', viz: 'bar' }, text: 'Broke it out by station and switched to a bar chart so the houses are comparable.' };
    }
    if (ctx.hasWidgets && has(q, /last 90|90 days|last quarter|past quarter/)) {
      return { kind: 'refine', patch: { scope: 'last 90 days' }, text: 'Re-scoped the widget to the last 90 days. The trend held — Sta. 7 is still the driver.' };
    }
    if (ctx.hasWidgets && has(q, /last 30|30 days|this month/)) {
      return { kind: 'refine', patch: { scope: 'last 30 days' }, text: 'Narrowed it to the last 30 days.' };
    }

    if (CANT.test(q)) {
      return { kind: 'cant', text: "I'm Agency Intelligence — I build reports from your connected Vector apps, so I can't help with that. Try asking about training, inspections, scheduling, credentials, or apparatus." };
    }
    if (NO_DATA.test(q)) {
      const spec = W({ metricId: 'tasks_by_app', viz: 'kpi', w: 4 });
      spec.state = 'nodata';
      spec.kind = 'metric';
      return { kind: 'nodata', text: "I understood the question, but none of your connected apps carry that data yet. If you connect a source for it, I can build this automatically.", widget: spec };
    }

    // Ambiguous: a bare "chart it" with no metric and no widget context.
    if (!matchMetric(q) && has(q, /chart|graph|visuali|show me something/)) {
      return {
        kind: 'choice',
        text: 'Happy to. What should I chart?',
        choices: [
          { label: 'Training completion', send: 'Show training completion' },
          { label: 'Open shifts', send: 'Show open shifts in the next 14 days' },
          { label: 'Overtime forecast', send: 'Forecast overtime for the next 30 days' },
        ],
      };
    }

    const m = matchMetric(q);
    if (m) {
      const spec = W(Object.assign({}, m));
      // Offer a viz choice for single-metric asks where two framings make sense.
      const text = vText(m.metricId || m.metricIds[0]);
      return { kind: 'widget', text: text, widget: spec };
    }

    // Generic fallback — still produce a widget so the surface stays alive.
    const spec = W({ metricId: 'tasks_by_app', viz: 'bar', w: 6 });
    return { kind: 'widget', text: "Here's a cross-app read on your open work. Ask me to narrow it — by app, by station, or over time.", widget: spec };
  }

  window.AGENCY_INTEL = {
    METRIC_SOURCE: METRIC_SOURCE,
    metricSources: metricSources,
    widgetSources: widgetSources,
    JOB_TITLES: JOB_TITLES,
    titleById: titleById,
    INDIVIDUALS: INDIVIDUALS,
    reconcileAccess: reconcileAccess,
    PRE_ASSIGNED: PRE_ASSIGNED,
    DASH_STATUSES: DASH_STATUSES,
    STATUS_RANK: STATUS_RANK,
    dashStatusMeta: dashStatusMeta,
    statusOf: statusOf,
    AUDIENCE_MODES: AUDIENCE_MODES,
    audienceMode: audienceMode,
    audienceModeMeta: audienceModeMeta,
    seedDashboards: seedDashboards,
    DATE_RANGES: DATE_RANGES,
    DEFAULT_RANGE: DEFAULT_RANGE,
    rangeLabel: rangeLabel,
    widgetSupportsRange: widgetSupportsRange,
    CADENCES: CADENCES,
    cadenceMeta: cadenceMeta,
    REPORT_FORMATS: REPORT_FORMATS,
    formatMeta: formatMeta,
    nextSendFrom: nextSendFrom,
    defaultDelivery: defaultDelivery,
    hasHomeAudience: hasHomeAudience,
    deliveryEnabled: deliveryEnabled,
    deliveryOf: deliveryOf,
    deliveryMeta: deliveryMeta,
    reportReach: reportReach,
    reportSummary: reportSummary,
    APP_TODAY: APP_TODAY,
    IDEA_PROMPTS: IDEA_PROMPTS,
    newWidget: newWidget,
    widgetTitle: widgetTitle,
    widgetIcon: widgetIcon,
    summaryText: summaryText,
    widgetToTable: widgetToTable,
    agencyIntelRespond: agencyIntelRespond,
  };
})();
