/* global window */
// custom-dashboards.js — Catalog of metrics + viz types for the Agency Intelligence
// "Create a custom dashboard" wizard, plus storage helpers used by both the
// Hub (copilot.jsx) and the standalone Agency Intelligence Dashboard page.
//
// Plain ES5-ish JS, no JSX, no framework — so it can be loaded by both the
// Babel-transpiled React surface and the vanilla dashboard page.

(function () {
  // ---------- Available metrics ----------
  // Curated list the wizard exposes. Each has its own seeded mock dataset so
  // the resulting dashboard always looks alive even before real data wiring.
  const AVAILABLE_METRICS = [
    { id: 'overdue_inspections',    label: 'Overdue inspections',         icon: 'build',              category: 'Operations' },
    { id: 'training_completion',    label: 'Training completion',         icon: 'school',             category: 'Compliance' },
    { id: 'open_shifts',            label: 'Open shifts · next 14 days',  icon: 'event_busy',         category: 'Scheduling' },
    { id: 'credential_expirations', label: 'Credentials expiring',        icon: 'workspace_premium',  category: 'Compliance' },
    { id: 'pto_pending',            label: 'Pending PTO requests',        icon: 'beach_access',       category: 'Scheduling' },
    { id: 'apparatus_downtime',     label: 'Apparatus downtime',          icon: 'fire_truck',         category: 'Operations' },
    { id: 'response_time',          label: 'Avg response time',           icon: 'speed',              category: 'Operations' },
    { id: 'ot_trend',               label: 'Overtime hours',              icon: 'trending_up',        category: 'Scheduling' },
    { id: 'tasks_by_app',           label: 'Tasks by source app',         icon: 'apps',               category: 'Operations' },
    // ---- expanded catalog (May 2026): more correlation surface area ----
    { id: 'ceu_progress',           label: 'CEU progress',                icon: 'school',             category: 'Compliance' },
    { id: 'policy_acks',            label: 'Policy acknowledgments',      icon: 'fact_check',         category: 'Compliance' },
    { id: 'equipment_failures',     label: 'Equipment failures',          icon: 'report',             category: 'Operations' },
    { id: 'incident_volume',        label: 'Incident volume',             icon: 'local_fire_department', category: 'Operations' },
    { id: 'sick_leave',             label: 'Sick leave hours',            icon: 'sick',               category: 'Scheduling' },
    { id: 'trade_requests',         label: 'Shift trade requests',        icon: 'swap_horiz',         category: 'Scheduling' },
  ];

  // ---------- Correlation suggestions ----------
  // One-click pairs the Agency Intelligence surfaces in the wizard so the user can jump
  // straight to a meaningful two-metric story without hunting through the
  // grid. Each entry references metric IDs from AVAILABLE_METRICS.
  const CORRELATION_SUGGESTIONS = [
    { id: 'training_x_inspection',  title: 'Training × Inspection drag',     metricIds: ['training_completion', 'overdue_inspections'], hint: 'Crew-capacity bottleneck' },
    { id: 'ceu_x_training',         title: 'CEU progress × Training',        metricIds: ['ceu_progress', 'training_completion'],        hint: 'Are the same houses behind on both?' },
    { id: 'pto_x_open_shifts',      title: 'PTO × Open shifts',              metricIds: ['pto_pending', 'open_shifts'],                 hint: 'Coverage-gap forecast' },
    { id: 'sick_x_ot',              title: 'Sick leave × Overtime',          metricIds: ['sick_leave', 'ot_trend'],                     hint: 'Burnout feedback loop' },
    { id: 'incidents_x_response',   title: 'Incident volume × Response',     metricIds: ['incident_volume', 'response_time'],           hint: 'Demand vs. arrival window' },
    { id: 'sick_x_inspections',     title: 'Sick leave × Inspections',       metricIds: ['sick_leave', 'overdue_inspections'],          hint: 'Does absence drive the backlog?' },
    { id: 'policy_x_compliance',    title: 'Policy acks × Training',         metricIds: ['policy_acks', 'training_completion'],         hint: 'Engagement signal' },
    { id: 'trades_x_open_shifts',   title: 'Trades × Open shifts',           metricIds: ['trade_requests', 'open_shifts'],              hint: 'Self-resolution rate' },
  ];

  // ---------- Viz types ----------
  const VIZ_TYPES = [
    { id: 'kpi',   label: 'Big number',  icon: 'pin',                 hint: 'Headline figure with trend' },
    { id: 'line',  label: 'Trend line',  icon: 'show_chart',          hint: 'Over time' },
    { id: 'bar',   label: 'Bar chart',   icon: 'bar_chart',           hint: 'By station or category' },
    { id: 'stack', label: 'Stacked bar', icon: 'stacked_bar_chart',   hint: 'At-risk vs. on-track' },
    { id: 'donut', label: 'Donut',       icon: 'donut_large',         hint: 'Share of total' },
    { id: 'table', label: 'Table',       icon: 'table_rows',          hint: 'Detailed rows' },
  ];

  // Sensible default viz per metric — used to pre-fill the wizard.
  const DEFAULT_VIZ = {
    overdue_inspections:    'bar',
    training_completion:    'kpi',
    open_shifts:            'table',
    credential_expirations: 'stack',
    pto_pending:            'kpi',
    apparatus_downtime:     'line',
    response_time:          'line',
    ot_trend:               'line',
    tasks_by_app:           'donut',
    ceu_progress:           'stack',
    policy_acks:            'kpi',
    equipment_failures:     'bar',
    incident_volume:        'line',
    sick_leave:             'line',
    trade_requests:         'bar',
  };

  /* ---------- Detail rows at department scale ----------
     A table widget is only worth filtering, sorting and paging if it carries
     more than a handful of rows, so the ENTITY-LIST metrics below seed at the
     scale a real department runs at, and every set reconciles with its own
     headline: 14 overdue inspections is 14 rows, 23 trade requests is 23 rows,
     and the CEU roster's station averages are computed FROM the roster so the
     bar chart can't drift away from it.

     What deliberately did NOT grow: the aggregate tables. Response time by
     station is four rows because there are four stations; overtime by month is
     five because it's five months. Padding those would mean inventing stations
     and months, which is worse than a table that fits on one page. */

  const ROSTER_LAST = [
    'Brennan', 'Maguire', 'Shah', 'Okafor', 'Vega', 'Iverson', 'Whitfield', 'Rosenfeld', 'Park', 'Hartwell',
    'Kim', 'Tanaka', 'Delgado', 'Novak', 'Ashby', 'Cortez', 'Lindqvist', 'Mbeki', 'Ferraro', 'Sandoval',
    'Prewitt', 'Nakamura', 'Ellery', 'Boone', 'Vasquez', 'Hollis', 'Amari', 'Redgrave', 'Sutton', 'Calloway'
  ];
  const ROSTER_FIRST = [
    'Riley', 'Owen', 'Priya', 'Jamal', 'Marisol', 'Theo', 'Kai', 'Naima', 'Eli', 'Cassidy',
    'Devon', 'Sloane', 'Alex', 'Jamie', 'Rosa', 'Miles', 'Nadia', 'Grant', 'Iris', 'Tomas',
    'Elena', 'Bryce', 'Simone', 'Hector', 'Lena', 'Cole', 'Farida', 'Duncan', 'Maya', 'Roland'
  ];
  // Two co-prime strides so 92 people get 92 distinct names without a shuffle.
  function rosterName(i) {
    return ROSTER_LAST[i % ROSTER_LAST.length] + ', ' +
      ROSTER_FIRST[(i * 7 + Math.floor(i / ROSTER_LAST.length)) % ROSTER_FIRST.length];
  }

  // Headcount and target CEU average per house. The weighted mean of these is
  // the metric's headline figure — Stations 4 and 7 sit well below the rest,
  // which is the story every other surface tells about those two houses.
  const CEU_HOUSES = [
    { station: 'Sta. 1',  n: 18, avg: 82 },
    { station: 'Sta. 4',  n: 22, avg: 51 },
    { station: 'Sta. 7',  n: 20, avg: 48 },
    { station: 'Sta. 9',  n: 17, avg: 77 },
    { station: 'Sta. 11', n: 15, avg: 70 }
  ];
  const CEU_CREDENTIALS = ['Paramedic', 'EMT-B', 'EVOC', 'HazMat', 'Pump Op', 'CPR/AED'];
  const CEU_COHORTS = ['Q3 Cohort A', 'Q3 Cohort B', 'Q4 Cohort A', 'Unassigned'];

  // Spread each house's people around its average with offsets that sum to
  // zero, so the house average lands exactly on target rather than near it.
  function buildCeuRoster() {
    const rows = [];
    let i = 0;
    CEU_HOUSES.forEach(function (h) {
      const offsets = [];
      for (let k = 0; k < h.n; k++) {
        const mag = 4 + ((k * 9) % 22);           // 4–25 points of spread
        offsets.push(k % 2 ? -mag : mag);
      }
      // Fold the residue back in so the offsets cancel exactly.
      const drift = offsets.reduce(function (a, b) { return a + b; }, 0);
      offsets[offsets.length - 1] -= drift;
      offsets.forEach(function (off, k) {
        const pct = Math.max(4, Math.min(100, h.avg + off));
        rows.push([
          rosterName(i),
          h.station,
          CEU_CREDENTIALS[(i * 5) % CEU_CREDENTIALS.length],
          pct + '%',
          // Anyone under half way is the one nobody has scheduled yet — that
          // pairing is the point of the column.
          pct < 50 ? 'Unassigned' : CEU_COHORTS[(i * 3) % (CEU_COHORTS.length - 1)]
        ]);
        i++;
      });
    });
    return rows;
  }
  const CEU_ROWS = buildCeuRoster();

  // Derived, not hand-typed: the bar and the headline read off the roster, so
  // a later edit to a person's CEU % can't leave the chart telling a different
  // story from the table underneath it.
  function ceuHouseAverage(station) {
    const mine = CEU_ROWS.filter(function (r) { return r[1] === station; });
    return Math.round(mine.reduce(function (a, r) { return a + parseInt(r[3], 10); }, 0) / mine.length);
  }
  const CEU_BAR = CEU_HOUSES.map(function (h) {
    return { label: h.station, value: ceuHouseAverage(h.station) };
  });
  const CEU_OVERALL = Math.round(
    CEU_ROWS.reduce(function (a, r) { return a + parseInt(r[3], 10); }, 0) / CEU_ROWS.length
  );

  // ---------- Seeded mock data per metric ----------
  // Each entry carries enough fields to render any viz type the user might
  // pick. Numbers were chosen to look believable, not random.
  const METRIC_DATA = {
    overdue_inspections: {
      kpi:   { num: '14', delta: '+3 vs. last week', tone: 'bad' },
      bar:   [{ label: 'Sta. 4', value: 7 }, { label: 'Sta. 7', value: 4 }, { label: 'Sta. 11', value: 2 }, { label: 'Sta. 1', value: 1 }, { label: 'Sta. 9', value: 0 }],
      line:  [{ x: 'Jan', y: 8 }, { x: 'Feb', y: 9 }, { x: 'Mar', y: 11 }, { x: 'Apr', y: 10 }, { x: 'May', y: 14 }],
      stack: { legend: ['Overdue', 'In window'], rows: [{ label: 'Engine', a: 8, b: 22 }, { label: 'Ladder', a: 4, b: 11 }, { label: 'Medic', a: 2, b: 14 }] },
      donut: [{ label: 'Engine',  value: 8, color: 'var(--coral-400)' }, { label: 'Ladder', value: 4, color: 'var(--amber-400)' }, { label: 'Medic',  value: 2, color: 'var(--teal-300)' }],
      // 14 rows — one per overdue inspection, matching the headline count and
      // the bar's 7 / 4 / 2 / 1 / 0 split across the houses.
      table: { cols: ['Apparatus', 'Station', 'Inspection', 'Days late'], rows: [
        ['Engine 4-A',  'Sta. 4',  'Annual pump test',   '8'],
        ['Engine 4-A',  'Sta. 4',  'Ladder/aerial',      '6'],
        ['Engine 4-B',  'Sta. 4',  'Hose service test',  '5'],
        ['Engine 4-B',  'Sta. 4',  'SCBA flow test',     '4'],
        ['Medic 4',     'Sta. 4',  'Drug box audit',     '4'],
        ['Medic 4',     'Sta. 4',  'Annual pump test',   '3'],
        ['Rescue 4',    'Sta. 4',  'Extrication tools',  '2'],
        ['Ladder 7',    'Sta. 7',  'Aerial certification', '5'],
        ['Ladder 7',    'Sta. 7',  'Hose service test',  '3'],
        ['Engine 7',    'Sta. 7',  'Annual pump test',   '3'],
        ['Medic 7',     'Sta. 7',  'Drug box audit',     '1'],
        ['Medic 11',    'Sta. 11', 'SCBA flow test',     '3'],
        ['Engine 11',   'Sta. 11', 'Hose service test',  '2'],
        ['Engine 1',    'Sta. 1',  'Annual pump test',   '2']
      ] },
      unit:  'inspections',
    },
    training_completion: {
      kpi:   { num: '79%', delta: '−4 pts vs. last quarter', tone: 'bad' },
      bar:   [{ label: 'Sta. 1', value: 91 }, { label: 'Sta. 4', value: 68 }, { label: 'Sta. 7', value: 71 }, { label: 'Sta. 9', value: 88 }, { label: 'Sta. 11', value: 82 }],
      line:  [{ x: 'Jan', y: 84 }, { x: 'Feb', y: 82 }, { x: 'Mar', y: 81 }, { x: 'Apr', y: 80 }, { x: 'May', y: 79 }],
      stack: { legend: ['Compliant', 'Lapsed'], rows: [{ label: 'Sta. 1', a: 22, b: 2 }, { label: 'Sta. 4', a: 14, b: 7 }, { label: 'Sta. 7', a: 16, b: 6 }, { label: 'Sta. 9', a: 21, b: 3 }] },
      donut: [{ label: 'Compliant', value: 73, color: 'var(--teal-300)' }, { label: 'In window', value: 18, color: 'var(--amber-300)' }, { label: 'Lapsed', value: 9, color: 'var(--coral-400)' }],
      table: { cols: ['Station', 'Compliant', 'In window', 'Lapsed'], rows: [['Sta. 1', '22', '2', '0'], ['Sta. 4', '14', '4', '3'], ['Sta. 7', '16', '4', '2'], ['Sta. 9', '21', '2', '1']] },
      unit:  '%',
    },
    open_shifts: {
      kpi:   { num: '9', delta: '6 unfilled at Sta. 7', tone: 'warn' },
      bar:   [{ label: 'Sta. 7', value: 6 }, { label: 'Sta. 4', value: 2 }, { label: 'Sta. 1', value: 1 }, { label: 'Sta. 9', value: 0 }],
      line:  [{ x: 'Wk 1', y: 4 }, { x: 'Wk 2', y: 5 }, { x: 'Wk 3', y: 7 }, { x: 'Wk 4', y: 9 }],
      stack: { legend: ['Unfilled', 'Backfill pending'], rows: [{ label: 'Sta. 7', a: 4, b: 2 }, { label: 'Sta. 4', a: 1, b: 1 }, { label: 'Sta. 1', a: 1, b: 0 }] },
      donut: [{ label: 'A-shift', value: 4, color: 'var(--coral-400)' }, { label: 'B-shift', value: 3, color: 'var(--amber-400)' }, { label: 'C-shift', value: 2, color: 'var(--teal-300)' }],
      // 9 rows — the 9 open shifts in the headline, split 6 / 2 / 1 across
      // Sta. 7 / 4 / 1 exactly as the bar reads it.
      table: { cols: ['Date', 'Station', 'Role', 'Shift', 'Status'], rows: [
        ['Jun 2',  'Sta. 7', 'Engineer',   'A', 'No coverage'],
        ['Jun 4',  'Sta. 7', 'FF × 2',     'C', 'Voluntary OT'],
        ['Jun 6',  'Sta. 7', 'Lieutenant', 'A', 'Mutual aid'],
        ['Jun 8',  'Sta. 7', 'Paramedic',  'B', 'No coverage'],
        ['Jun 11', 'Sta. 7', 'FF × 1',     'C', 'Backfill pending'],
        ['Jun 13', 'Sta. 7', 'Engineer',   'A', 'Voluntary OT'],
        ['Jun 9',  'Sta. 4', 'FF × 1',     'B', 'Trade pending'],
        ['Jun 12', 'Sta. 4', 'Paramedic',  'A', 'Backfill pending'],
        ['Jun 10', 'Sta. 1', 'FF × 1',     'C', 'Voluntary OT']
      ] },
      unit:  'shifts',
    },
    credential_expirations: {
      kpi:   { num: '11', delta: 'expire in 60 days', tone: 'warn' },
      bar:   [{ label: 'Paramedic', value: 4 }, { label: 'EVOC', value: 3 }, { label: 'HazMat', value: 2 }, { label: 'Pump Op', value: 1 }, { label: 'CPR/AED', value: 1 }],
      line:  [{ x: 'Jul', y: 6 }, { x: 'Aug', y: 9 }, { x: 'Sep', y: 11 }, { x: 'Oct', y: 14 }, { x: 'Nov', y: 18 }],
      stack: { legend: ['At risk', 'On track'], rows: [{ label: 'Paramedic', a: 4, b: 2 }, { label: 'EVOC', a: 3, b: 6 }, { label: 'HazMat', a: 2, b: 4 }, { label: 'CPR/AED', a: 1, b: 11 }] },
      donut: [{ label: 'Paramedic', value: 4, color: 'var(--coral-400)' }, { label: 'EVOC', value: 3, color: 'var(--amber-400)' }, { label: 'HazMat', value: 2, color: 'var(--teal-300)' }, { label: 'Other', value: 2, color: 'var(--ink-300)' }],
      // 11 rows — the 11 credentials in the 60-day window, split by type the
      // way the bar reads it: 4 Paramedic, 3 EVOC, 2 HazMat, 1 Pump Op, 1 CPR.
      table: { cols: ['Person', 'Station', 'Credential', 'Expires', 'CEU %'], rows: [
        ['Brennan, Riley',   'Sta. 4',  'Paramedic', 'Jul 12', '38%'],
        ['Maguire, Owen',    'Sta. 7',  'Paramedic', 'Jul 19', '41%'],
        ['Tanaka, Alex',     'Sta. 9',  'Paramedic', 'Jul 26', '64%'],
        ['Delgado, Rosa',    'Sta. 4',  'Paramedic', 'Aug 02', '47%'],
        ['Shah, Priya',      'Sta. 7',  'EVOC',      'Jun 30', '12%'],
        ['Vega, Marisol',    'Sta. 9',  'EVOC',      'Jul 08', '55%'],
        ['Novak, Miles',     'Sta. 4',  'EVOC',      'Jul 22', '31%'],
        ['Okafor, Jamal',    'Sta. 4',  'HazMat',    'Jul 04', '25%'],
        ['Iverson, Theo',    'Sta. 11', 'HazMat',    'Jul 30', '68%'],
        ['Park, Cassidy',    'Sta. 1',  'Pump Op',   'Jul 15', '72%'],
        ['Rosenfeld, Eli',   'Sta. 7',  'CPR/AED',   'Aug 05', '19%']
      ] },
      unit:  'people',
    },
    pto_pending: {
      kpi:   { num: '6', delta: '3 in coverage-critical windows', tone: 'warn' },
      bar:   [{ label: 'Sta. 7', value: 3 }, { label: 'Sta. 4', value: 2 }, { label: 'Sta. 1', value: 1 }, { label: 'Sta. 9', value: 0 }],
      line:  [{ x: 'Jan', y: 3 }, { x: 'Feb', y: 4 }, { x: 'Mar', y: 5 }, { x: 'Apr', y: 6 }, { x: 'May', y: 6 }],
      stack: { legend: ['Conflicts coverage', 'Clean'], rows: [{ label: 'Jun', a: 3, b: 1 }, { label: 'Jul', a: 1, b: 4 }, { label: 'Aug', a: 0, b: 6 }] },
      donut: [{ label: 'Vacation', value: 4, color: 'var(--teal-300)' }, { label: 'Medical', value: 1, color: 'var(--amber-400)' }, { label: 'Family',   value: 1, color: 'var(--coral-400)' }],
      // 6 rows — the 6 pending requests, 3 / 2 / 1 across Sta. 7 / 4 / 1, and
      // the 3 in coverage-critical windows the KPI calls out.
      table: { cols: ['Person', 'Dates', 'Station', 'Days', 'Coverage'], rows: [
        ['Maguire, Owen',  'Jun 6–9',   'Sta. 7', '4',  'No backfill'],
        ['Shah, Priya',    'Jun 18–21', 'Sta. 7', '4',  'No backfill'],
        ['Rosenfeld, Eli', 'Jul 3–5',   'Sta. 7', '3',  'Pending'],
        ['Okafor, Jamal',  'Jul 1–7',   'Sta. 4', '7',  'Trade approved'],
        ['Delgado, Rosa',  'Jun 24–26', 'Sta. 4', '3',  'No backfill'],
        ['Park, Cassidy',  'Jul 10–17', 'Sta. 1', '8',  'Trade approved']
      ] },
      unit:  'requests',
    },
    apparatus_downtime: {
      kpi:   { num: '42 hrs', delta: '+12 hrs vs. last month', tone: 'bad' },
      bar:   [{ label: 'Engine 4-A', value: 14 }, { label: 'Ladder 7', value: 11 }, { label: 'Engine 4-B', value: 8 }, { label: 'Medic 11', value: 5 }, { label: 'Engine 1', value: 4 }],
      line:  [{ x: 'Jan', y: 18 }, { x: 'Feb', y: 24 }, { x: 'Mar', y: 22 }, { x: 'Apr', y: 30 }, { x: 'May', y: 42 }],
      stack: { legend: ['Scheduled', 'Unscheduled'], rows: [{ label: 'Jan', a: 10, b: 8 }, { label: 'Feb', a: 12, b: 12 }, { label: 'Mar', a: 14, b: 8 }, { label: 'Apr', a: 12, b: 18 }, { label: 'May', a: 16, b: 26 }] },
      donut: [{ label: 'Pump',  value: 18, color: 'var(--coral-400)' }, { label: 'Aerial',value: 14, color: 'var(--amber-400)' }, { label: 'Other', value: 10, color: 'var(--teal-300)' }],
      // One row per downtime EVENT rather than per apparatus — a pump rebuild
      // spans several visits, and the per-apparatus totals are what the bar
      // already shows. Hours sum to the headline 42, and per apparatus they
      // sum to the bar: Engine 4-A 14, Ladder 7 11, Engine 4-B 8, Medic 11 5,
      // Engine 1 4.
      table: { cols: ['Apparatus', 'Date', 'Reason', 'Hours', 'Status'], rows: [
        ['Engine 4-A', 'May 04', 'Pump rebuild',      '6', 'Returned'],
        ['Engine 4-A', 'May 12', 'Pump rebuild',      '5', 'Returned'],
        ['Engine 4-A', 'May 27', 'Pressure retest',   '3', 'In shop'],
        ['Ladder 7',   'May 06', 'Aerial cert.',      '7', 'Pending'],
        ['Ladder 7',   'May 21', 'Hydraulic leak',    '4', 'In shop'],
        ['Engine 4-B', 'May 09', 'Brake job',         '5', 'Returned'],
        ['Engine 4-B', 'May 24', 'Relief valve',      '3', 'Returned'],
        ['Medic 11',   'May 08', 'Cab electrical',    '3', 'Returned'],
        ['Medic 11',   'May 22', 'Suction unit',      '2', 'Returned'],
        ['Engine 1',   'May 11', 'Gauge drift',       '2', 'Returned'],
        ['Engine 1',   'May 19', 'Foam system flush', '1', 'Returned'],
        ['Engine 1',   'May 29', 'Light bar',         '1', 'Pending']
      ] },
      unit:  'hours',
    },
    response_time: {
      kpi:   { num: '6:42', delta: '+18 sec vs. last quarter', tone: 'warn' },
      bar:   [{ label: 'Sta. 1', value: 5.4 }, { label: 'Sta. 4', value: 6.1 }, { label: 'Sta. 7', value: 7.8 }, { label: 'Sta. 9', value: 6.2 }, { label: 'Sta. 11', value: 7.0 }],
      line:  [{ x: 'Jan', y: 6.4 }, { x: 'Feb', y: 6.5 }, { x: 'Mar', y: 6.7 }, { x: 'Apr', y: 6.6 }, { x: 'May', y: 6.7 }],
      stack: { legend: ['< 5 min', '5–8 min', '> 8 min'], rows: [{ label: 'Sta. 1', a: 60, b: 35, c: 5 }, { label: 'Sta. 7', a: 25, b: 45, c: 30 }] },
      donut: [{ label: '< 5 min', value: 48, color: 'var(--teal-300)' }, { label: '5–8 min', value: 38, color: 'var(--amber-300)' }, { label: '> 8 min', value: 14, color: 'var(--coral-400)' }],
      table: { cols: ['Station', 'P50', 'P90', 'Trend'], rows: [['Sta. 1', '5:24', '7:10', '↘'], ['Sta. 4', '6:08', '8:22', '→'], ['Sta. 7', '7:48', '11:02', '↗'], ['Sta. 9', '6:12', '8:00', '→']] },
      unit:  'min',
    },
    ot_trend: {
      kpi:   { num: '412 hrs', delta: '+18 % MoM (projected)', tone: 'bad' },
      bar:   [{ label: 'Sta. 7', value: 248 }, { label: 'Sta. 4', value: 92 }, { label: 'Sta. 1', value: 42 }, { label: 'Sta. 9', value: 30 }],
      line:  [{ x: 'Feb', y: 286 }, { x: 'Mar', y: 312 }, { x: 'Apr', y: 305 }, { x: 'May', y: 348 }, { x: 'Jun*', y: 412, projected: true }],
      stack: { legend: ['Voluntary', 'Forced'], rows: [{ label: 'Sta. 7', a: 140, b: 108 }, { label: 'Sta. 4', a: 60, b: 32 }, { label: 'Sta. 1', a: 30, b: 12 }] },
      donut: [{ label: 'Voluntary', value: 240, color: 'var(--teal-300)' }, { label: 'Forced',    value: 172, color: 'var(--coral-400)' }],
      table: { cols: ['Month', 'Hours', 'Cost', 'Driver'], rows: [['Feb', '286', '$21.4K', '—'], ['Mar', '312', '$23.6K', 'Sta. 4 vacancies'], ['Apr', '305', '$23.0K', '—'], ['May', '348', '$26.4K', 'Sta. 4 sick leave'], ['Jun (proj.)', '412', '$31.2K', 'Sta. 7 vacancies × PTO']] },
      unit:  'hours',
    },
    tasks_by_app: {
      kpi:   { num: '143', delta: 'open across 5 apps', tone: 'neutral' },
      bar:   [{ label: 'TS',         value: 54 }, { label: 'Check It',   value: 38 }, { label: 'Scheduling', value: 24 }, { label: 'Guardian',   value: 17 }, { label: 'EV+',        value: 10 }],
      line:  [{ x: 'Mon', y: 132 }, { x: 'Tue', y: 138 }, { x: 'Wed', y: 144 }, { x: 'Thu', y: 141 }, { x: 'Fri', y: 143 }],
      stack: { legend: ['Open', 'Closed today'], rows: [{ label: 'TS', a: 54, b: 22 }, { label: 'Check It', a: 38, b: 9 }, { label: 'Scheduling', a: 24, b: 12 }, { label: 'Guardian', a: 17, b: 4 }, { label: 'EV+', a: 10, b: 3 }] },
      // These five slices ARE the five source apps, in SOURCES order, so they use
      // the per-source tokens (styles.css) rather than the raw hex they used to
      // carry — the same tokens that color the source chips beside them wherever
      // this donut renders. Every other donut in this file was already tokenised.
      donut: [{ label: 'TargetSolutions', value: 54, color: 'var(--src-ts)' }, { label: 'Check It',     value: 38, color: 'var(--src-ci)' }, { label: 'Scheduling',   value: 24, color: 'var(--src-sched)' }, { label: 'Guardian Tracking', value: 17, color: 'var(--src-gt)' }, { label: 'EV+',          value: 10, color: 'var(--src-ev)' }],
      table: { cols: ['Source', 'Open', 'Closed (7d)', 'Median age'], rows: [['TargetSolutions', '54', '142', '2.3 d'], ['Check It', '38', '95', '4.1 d'], ['Scheduling', '24', '76', '1.6 d'], ['Guardian Tracking', '17', '24', '3.0 d'], ['EV+', '10', '38', '1.9 d']] },
      unit:  'tasks',
    },

    // ---- expanded metric data ----
    ceu_progress: {
      // Headline and breakdown both computed from the 92-person roster below.
      kpi:   { num: CEU_OVERALL + '%', delta: '−6 pts vs. last quarter', tone: 'warn' },
      bar:   CEU_BAR,
      line:  [{ x: 'Jan', y: 71 }, { x: 'Feb', y: 70 }, { x: 'Mar', y: 68 }, { x: 'Apr', y: 66 }, { x: 'May', y: 64 }],
      stack: { legend: ['On track', 'At risk'], rows: [{ label: 'Paramedic', a: 6, b: 4 }, { label: 'EVOC', a: 8, b: 3 }, { label: 'HazMat', a: 5, b: 2 }, { label: 'CPR/AED', a: 12, b: 1 }] },
      donut: [{ label: 'On track', value: 64, color: 'var(--teal-300)' }, { label: 'Slipping', value: 24, color: 'var(--amber-300)' }, { label: 'At risk', value: 12, color: 'var(--coral-400)' }],
      // Whole roster — 92 rows, the table that actually needs a pager.
      table: { cols: ['Person', 'Station', 'Credential', 'CEU %', 'Cohort'], rows: CEU_ROWS },
      unit:  '%',
    },
    policy_acks: {
      kpi:   { num: '88%', delta: '+5 pts vs. last month', tone: 'good' },
      bar:   [{ label: 'Sta. 1', value: 100 }, { label: 'Sta. 4', value: 71 }, { label: 'Sta. 7', value: 78 }, { label: 'Sta. 9', value: 96 }, { label: 'Sta. 11', value: 92 }],
      line:  [{ x: 'Jan', y: 78 }, { x: 'Feb', y: 81 }, { x: 'Mar', y: 84 }, { x: 'Apr', y: 86 }, { x: 'May', y: 88 }],
      stack: { legend: ['Acknowledged', 'Outstanding'], rows: [{ label: 'PPE SOP v3', a: 88, b: 12 }, { label: 'Mayday update', a: 73, b: 27 }, { label: 'EV decon', a: 91, b: 9 }] },
      donut: [{ label: 'Acknowledged', value: 88, color: 'var(--teal-300)' }, { label: 'Outstanding', value: 12, color: 'var(--amber-400)' }],
      // 12 policies in circulation. Acks total 1,057 of 1,200 sent = 88%,
      // the headline rate.
      table: { cols: ['Policy', 'Issued', 'Sent', 'Acks', 'Open'], rows: [
        ['PPE SOP v3',           'May 02', '100', '88',  '12'],
        ['Mayday update',        'Apr 21', '100', '73',  '27'],
        ['EV decon',             'Apr 10', '100', '91',  '9'],
        ['Rehab guidelines',     'Apr 02', '100', '95',  '5'],
        ['Hydrant testing SOP',  'Mar 24', '100', '89',  '11'],
        ['Fit-test policy',      'Mar 17', '100', '84',  '16'],
        ['Radio discipline',     'Mar 05', '100', '79',  '21'],
        ['Apparatus checkout',   'Feb 26', '100', '93',  '7'],
        ['Bloodborne pathogens', 'Feb 14', '100', '97',  '3'],
        ['Rope rescue rev. 2',   'Feb 03', '100', '82',  '18'],
        ['Fatigue management',   'Jan 22', '100', '90',  '10'],
        ['Records retention',    'Jan 09', '100', '96',  '4']
      ] },
      unit:  '%',
    },
    equipment_failures: {
      kpi:   { num: '17', delta: '+4 vs. last month', tone: 'bad' },
      bar:   [{ label: 'SCBA', value: 6 }, { label: 'Pump', value: 4 }, { label: 'Hose', value: 3 }, { label: 'Radio', value: 2 }, { label: 'AED', value: 2 }],
      line:  [{ x: 'Jan', y: 9 }, { x: 'Feb', y: 11 }, { x: 'Mar', y: 12 }, { x: 'Apr', y: 13 }, { x: 'May', y: 17 }],
      stack: { legend: ['In-service', 'OOS'], rows: [{ label: 'Sta. 4', a: 3, b: 4 }, { label: 'Sta. 7', a: 4, b: 3 }, { label: 'Sta. 1', a: 6, b: 1 }] },
      donut: [{ label: 'SCBA', value: 6, color: 'var(--coral-400)' }, { label: 'Pump', value: 4, color: 'var(--amber-400)' }, { label: 'Other', value: 7, color: 'var(--teal-300)' }],
      // 17 rows — the 17 failures behind the headline, by type: 6 SCBA,
      // 4 Pump, 3 Hose, 2 Radio, 2 AED.
      table: { cols: ['Item', 'Type', 'Station', 'Reason', 'Status'], rows: [
        ['SCBA #142',   'SCBA',  'Sta. 4',  'Regulator fault',   'OOS'],
        ['SCBA #118',   'SCBA',  'Sta. 4',  'Low-pressure alarm', 'In shop'],
        ['SCBA #207',   'SCBA',  'Sta. 7',  'Facepiece seal',    'OOS'],
        ['SCBA #093',   'SCBA',  'Sta. 7',  'Cylinder hydro due', 'In shop'],
        ['SCBA #164',   'SCBA',  'Sta. 1',  'Regulator fault',   'Replaced'],
        ['SCBA #221',   'SCBA',  'Sta. 9',  'Harness wear',      'Returned'],
        ['Pump E4-A',   'Pump',  'Sta. 4',  'Pressure loss',     'In shop'],
        ['Pump E4-B',   'Pump',  'Sta. 4',  'Relief valve',      'OOS'],
        ['Pump E7',     'Pump',  'Sta. 7',  'Primer failure',    'In shop'],
        ['Pump E1',     'Pump',  'Sta. 1',  'Gauge drift',       'Returned'],
        ['Hose 2.5"',   'Hose',  'Sta. 7',  'Coupling',          'Replaced'],
        ['Hose 1.75"',  'Hose',  'Sta. 4',  'Failed service test', 'Replaced'],
        ['Hose 5"',     'Hose',  'Sta. 11', 'Jacket abrasion',   'OOS'],
        ['Radio 7-12',  'Radio', 'Sta. 7',  'Battery fault',     'Returned'],
        ['Radio 4-03',  'Radio', 'Sta. 4',  'No transmit',       'In shop'],
        ['AED Medic 4', 'AED',   'Sta. 4',  'Pad expiry',        'Returned'],
        ['AED Engine 9', 'AED',  'Sta. 9',  'Self-test fail',    'OOS']
      ] },
      unit:  'items',
    },
    incident_volume: {
      kpi:   { num: '1,284', delta: '+9% YoY', tone: 'neutral' },
      bar:   [{ label: 'Sta. 1', value: 188 }, { label: 'Sta. 4', value: 312 }, { label: 'Sta. 7', value: 401 }, { label: 'Sta. 9', value: 214 }, { label: 'Sta. 11', value: 169 }],
      line:  [{ x: 'Jan', y: 232 }, { x: 'Feb', y: 248 }, { x: 'Mar', y: 261 }, { x: 'Apr', y: 271 }, { x: 'May', y: 272 }],
      stack: { legend: ['EMS', 'Fire', 'Other'], rows: [{ label: 'Sta. 7', a: 280, b: 78, c: 43 }, { label: 'Sta. 4', a: 210, b: 62, c: 40 }, { label: 'Sta. 1', a: 132, b: 38, c: 18 }] },
      donut: [{ label: 'EMS', value: 880, color: 'var(--teal-300)' }, { label: 'Fire', value: 244, color: 'var(--coral-400)' }, { label: 'Other', value: 160, color: 'var(--amber-300)' }],
      table: { cols: ['Station', 'EMS', 'Fire', 'Total'], rows: [['Sta. 7', '280', '78', '401'], ['Sta. 4', '210', '62', '312'], ['Sta. 9', '142', '38', '214'], ['Sta. 1', '132', '38', '188']] },
      unit:  'calls',
    },
    sick_leave: {
      kpi:   { num: '184 hrs', delta: '+22% vs. last month', tone: 'bad' },
      bar:   [{ label: 'Sta. 4', value: 72 }, { label: 'Sta. 7', value: 56 }, { label: 'Sta. 1', value: 28 }, { label: 'Sta. 9', value: 18 }, { label: 'Sta. 11', value: 10 }],
      line:  [{ x: 'Feb', y: 120 }, { x: 'Mar', y: 132 }, { x: 'Apr', y: 151 }, { x: 'May', y: 184 }],
      stack: { legend: ['Approved', 'Unverified'], rows: [{ label: 'Sta. 4', a: 60, b: 12 }, { label: 'Sta. 7', a: 44, b: 12 }, { label: 'Sta. 1', a: 24, b: 4 }] },
      donut: [{ label: 'Sta. 4', value: 72, color: 'var(--coral-400)' }, { label: 'Sta. 7', value: 56, color: 'var(--amber-400)' }, { label: 'Other', value: 56, color: 'var(--teal-300)' }],
      table: { cols: ['Station', 'Hours', 'Incidents', 'Trend'], rows: [['Sta. 4', '72', '11', '↗'], ['Sta. 7', '56', '8', '↗'], ['Sta. 1', '28', '5', '→']] },
      unit:  'hours',
    },
    trade_requests: {
      kpi:   { num: '23', delta: '8 awaiting approval', tone: 'neutral' },
      bar:   [{ label: 'Sta. 7', value: 9 }, { label: 'Sta. 4', value: 6 }, { label: 'Sta. 1', value: 4 }, { label: 'Sta. 9', value: 3 }, { label: 'Sta. 11', value: 1 }],
      line:  [{ x: 'Jan', y: 14 }, { x: 'Feb', y: 17 }, { x: 'Mar', y: 19 }, { x: 'Apr', y: 21 }, { x: 'May', y: 23 }],
      stack: { legend: ['Approved', 'Pending'], rows: [{ label: 'Sta. 7', a: 6, b: 3 }, { label: 'Sta. 4', a: 4, b: 2 }, { label: 'Sta. 1', a: 3, b: 1 }] },
      donut: [{ label: 'Approved', value: 15, color: 'var(--teal-300)' }, { label: 'Pending', value: 8, color: 'var(--amber-400)' }],
      // 23 rows — every trade request behind the headline. Station split
      // matches the bar (9 / 6 / 4 / 3 / 1) and 8 sit in Pending, which is
      // what the KPI's "8 awaiting approval" is counting.
      table: { cols: ['Date', 'Station', 'Trade', 'Shift', 'Status'], rows: [
        ['Jun 2',  'Sta. 7',  'Maguire ↔ Brennan',   'A → C', 'Approved'],
        ['Jun 4',  'Sta. 7',  'Shah ↔ Okafor',       'C → A', 'Pending'],
        ['Jun 5',  'Sta. 7',  'Rosenfeld ↔ Park',    'A → B', 'Approved'],
        ['Jun 7',  'Sta. 7',  'Iverson ↔ Vega',      'C → A', 'Approved'],
        ['Jun 9',  'Sta. 7',  'Novak ↔ Cortez',      'B → C', 'Pending'],
        ['Jun 11', 'Sta. 7',  'Ferraro ↔ Boone',     'A → B', 'Approved'],
        ['Jun 13', 'Sta. 7',  'Hollis ↔ Amari',      'C → A', 'Pending'],
        ['Jun 16', 'Sta. 7',  'Sutton ↔ Redgrave',   'B → C', 'Approved'],
        ['Jun 18', 'Sta. 7',  'Ashby ↔ Mbeki',       'A → C', 'Approved'],
        ['Jun 3',  'Sta. 4',  'Vega ↔ Lin',          'A → B', 'Approved'],
        ['Jun 6',  'Sta. 4',  'Delgado ↔ Kim',       'B → A', 'Pending'],
        ['Jun 8',  'Sta. 4',  'Brennan ↔ Hartwell',  'A → C', 'Approved'],
        ['Jun 12', 'Sta. 4',  'Okafor ↔ Sandoval',   'C → B', 'Approved'],
        ['Jun 15', 'Sta. 4',  'Prewitt ↔ Nakamura',  'B → A', 'Pending'],
        ['Jun 19', 'Sta. 4',  'Ellery ↔ Vasquez',    'A → C', 'Approved'],
        ['Jun 5',  'Sta. 1',  'Whitfield ↔ Calloway', 'A → B', 'Approved'],
        ['Jun 10', 'Sta. 1',  'Tanaka ↔ Lindqvist',  'B → C', 'Pending'],
        ['Jun 14', 'Sta. 1',  'Park ↔ Novak',        'C → A', 'Approved'],
        ['Jun 20', 'Sta. 1',  'Boone ↔ Ferraro',     'A → B', 'Pending'],
        ['Jun 7',  'Sta. 9',  'Vasquez ↔ Amari',     'B → A', 'Approved'],
        ['Jun 13', 'Sta. 9',  'Cortez ↔ Sutton',     'A → C', 'Approved'],
        ['Jun 17', 'Sta. 9',  'Mbeki ↔ Hollis',      'C → B', 'Pending'],
        ['Jun 11', 'Sta. 11', 'Redgrave ↔ Ashby',    'B → A', 'Approved']
      ] },
      unit:  'requests',
    },
  };

  function metricById(id) {
    for (let i = 0; i < AVAILABLE_METRICS.length; i++) {
      if (AVAILABLE_METRICS[i].id === id) return AVAILABLE_METRICS[i];
    }
    for (let i = 0; i < CUSTOM_METRICS.length; i++) {
      if (CUSTOM_METRICS[i].id === id) return CUSTOM_METRICS[i];
    }
    return null;
  }

  // ---------- Custom (user-typed) metrics ----------
  // The wizard exposes a freeform text field so the user can describe a
  // metric the catalog doesn't cover. We register it here so it shows up in
  // the picker for the rest of the session, and synthesize a generic mock
  // dataset on demand so any viz the user picks still renders.
  const CUSTOM_METRICS = [];
  const CUSTOM_DATA = {};

  function slugify(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  }

  // Deterministic-ish "random" so the same custom metric renders identically
  // between picks (hash on id, not Math.random).
  function seededInts(seed, n, lo, hi) {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    const out = [];
    for (let i = 0; i < n; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      out.push(lo + (s % (hi - lo + 1)));
    }
    return out;
  }

  function synthesizeData(id, label) {
    if (CUSTOM_DATA[id]) return CUSTOM_DATA[id];
    const stations = ['Sta. 1', 'Sta. 4', 'Sta. 7', 'Sta. 9', 'Sta. 11'];
    const months   = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const ba = seededInts(id + ':bar', 5, 4, 42);
    const ln = seededInts(id + ':line', 5, 20, 90);
    const sa = seededInts(id + ':stk-a', 4, 6, 22);
    const sb = seededInts(id + ':stk-b', 4, 2, 14);
    const total = ba.reduce(function (a, b) { return a + b; }, 0);
    const data = {
      kpi:   { num: String(total), delta: 'Estimated from your description', tone: 'neutral' },
      bar:   stations.map(function (s, i) { return { label: s, value: ba[i] }; }),
      line:  months.map(function (m, i) { return { x: m, y: ln[i] }; }),
      stack: { legend: ['Primary', 'Secondary'], rows: stations.slice(0, 4).map(function (s, i) { return { label: s, a: sa[i], b: sb[i] }; }) },
      donut: stations.slice(0, 4).map(function (s, i) {
        return { label: s, value: ba[i], color: ['var(--coral-400)', 'var(--amber-400)', 'var(--teal-300)', 'var(--ink-300)'][i] };
      }),
      table: { cols: ['Bucket', 'Value', 'Trend'], rows: stations.map(function (s, i) { return [s, String(ba[i]), i % 2 ? '↗' : '→']; }) },
      unit:  '',
      _label: label,
      _synthesized: true,
    };
    CUSTOM_DATA[id] = data;
    return data;
  }

  function registerCustomMetric(spec) {
    const label = (spec && spec.label || '').trim();
    if (!label) return null;
    const baseId = 'custom_' + slugify(label);
    // de-dupe: if a custom metric with this label already exists, reuse it.
    for (let i = 0; i < CUSTOM_METRICS.length; i++) {
      if (CUSTOM_METRICS[i].id === baseId) return CUSTOM_METRICS[i];
    }
    const meta = {
      id: baseId,
      label: label,
      icon: 'auto_awesome',
      category: 'Your custom metrics',
      custom: true,
      description: (spec.description || '').trim(),
    };
    CUSTOM_METRICS.push(meta);
    synthesizeData(baseId, label);
    return meta;
  }

  // The categorical axis for a given viz — the values a user can bound a
  // widget to. kpi/line/summary have no category axis (line is time-based).
  function metricCategories(metricId, viz) {
    const meta = metricById(metricId);
    if (!meta) return null;
    const m = METRIC_DATA[metricId] || (meta.custom ? synthesizeData(metricId, meta.label) : null);
    if (!m) return null;
    let values = null, name = 'Categories';
    if (viz === 'bar' && m.bar) values = m.bar.map(function (d) { return d.label; });
    else if (viz === 'stack' && m.stack) values = m.stack.rows.map(function (r) { return r.label; });
    else if (viz === 'donut' && m.donut) values = m.donut.map(function (d) { return d.label; });
    else if (viz === 'table' && m.table) { values = m.table.rows.map(function (r) { return r[0]; }); name = m.table.cols[0] || 'Rows'; }
    if (!values || !values.length) return null;
    if (name === 'Categories' && values.every(function (v) { return /^Sta\.?\s/i.test(v); })) name = 'Stations';
    return { name: name, values: values };
  }

  // Returns a render spec the host can pass to its renderer. `opts.include`
  // (array of category labels) bounds the chart to just those rows/slices.
  function buildSpec(metricId, viz, opts) {
    const meta = metricById(metricId);
    if (!meta) return null;
    const m = METRIC_DATA[metricId] || (meta.custom ? synthesizeData(metricId, meta.label) : null);
    if (!m) return null;
    const inc = opts && opts.include && opts.include.length ? opts.include : null;
    const keep = function (label) { return !inc || inc.indexOf(label) !== -1; };
    const out = { metric: metricId, label: meta.label, icon: meta.icon, viz: viz, unit: m.unit, synthesized: !!m._synthesized };
    if (viz === 'kpi')   { Object.assign(out, m.kpi); return out; }
    if (viz === 'bar')   { out.data = inc ? m.bar.filter(function (d) { return keep(d.label); }) : m.bar; return out; }
    if (viz === 'line')  { out.data = m.line;  return out; }
    if (viz === 'stack') { out.data = inc ? m.stack.rows.filter(function (r) { return keep(r.label); }) : m.stack.rows; out.legend = m.stack.legend; return out; }
    if (viz === 'donut') { out.data = inc ? m.donut.filter(function (d) { return keep(d.label); }) : m.donut; return out; }
    if (viz === 'table') {
      out.cols = m.table.cols;
      // The category filter comes from the BAR's labels (stations, credential
      // types), which may sit in any column of a detail table — the CEU roster
      // is keyed by person with the station second. Match any cell, or picking
      // "Sta. 4" silently empties the table.
      out.rows = inc
        ? m.table.rows.filter(function (r) { return r.some(function (c) { return keep(c); }); })
        : m.table.rows;
      return out;
    }
    return out;
  }

  // ---------- Summary table spec ----------
  // A cross-metric read: one row per metric with its current value, its change
  // and a plain status word. This is the block that lets a dashboard read as a
  // report — a compact table instead of a wall of charts.
  function buildMetricsTableSpec(metricIds) {
    const rows = (metricIds || []).map(function (id) {
      const meta = metricById(id);
      if (!meta) return null;
      const m = METRIC_DATA[id] || (meta.custom ? synthesizeData(id, meta.label) : null);
      if (!m || !m.kpi) return null;
      const tone = m.kpi.tone || 'flat';
      return {
        id: id, label: meta.label, icon: meta.icon, num: m.kpi.num, delta: m.kpi.delta || '', tone: tone,
        status: tone === 'bad' ? 'Attention' : tone === 'warn' ? 'Watch' : tone === 'good' ? 'On track' : 'Steady',
      };
    }).filter(Boolean);
    return { kind: 'metrics-table', viz: 'metrics_table', rows: rows };
  }

  // Categorical labels two or more metrics actually have in common. Two
  // metrics can only be correlated if they break down along the same axis —
  // "by station" vs "by station" works, "by credential type" vs "by equipment
  // type" has no shared ground and must not produce a chart.
  function sharedBarLabels(metricIds) {
    if (!metricIds || metricIds.length < 2) return [];
    const datas = metricIds.map(function (id) {
      const meta = metricById(id);
      if (!meta) return null;
      return METRIC_DATA[id] || (meta.custom ? synthesizeData(id, meta.label) : null);
    });
    if (datas.some(function (d) { return !d || !d.bar; })) return [];
    return datas[0].bar.map(function (d) { return d.label; })
      .filter(function (l) { return datas.every(function (d) { return d.bar.some(function (x) { return x.label === l; }); }); });
  }
  function metricsCorrelatable(metricIds) { return sharedBarLabels(metricIds).length >= 3; }

  // ---------- Correlation spec ----------
  // For widgets that combine 2+ metrics into a single chart. Aligns the
  // metrics on their shared categorical labels (or shared x-axis for line)
  // and emits a paired-bar / dual-line spec.
  function buildCorrelationSpec(metricIds, viz) {
    if (!metricIds || metricIds.length < 2) {
      return buildSpec(metricIds[0], viz);
    }
    const metas = metricIds.map(metricById).filter(Boolean);
    const datas = metricIds.map(function (id) {
      const meta = metricById(id);
      return METRIC_DATA[id] || (meta && meta.custom ? synthesizeData(id, meta.label) : null);
    }).filter(Boolean);
    if (metas.length < 2 || datas.length < 2) return null;

    if (viz === 'scatter') {
      // Independent variable (X) = metric A; dependent (Y) = metric B. One
      // plotted point per shared category (station), for a scatter + trend.
      const labelsA = datas[0].bar.map(d => d.label);
      const common = labelsA.filter(l => datas.every(d => d.bar.some(x => x.label === l)));
      if (common.length < 3) return null; // no shared axis — not correlatable
      const points = common.map(label => ({
        label: label,
        x: datas[0].bar.find(x => x.label === label).value,
        y: datas[1].bar.find(x => x.label === label).value,
      }));
      return {
        metricIds: metricIds,
        viz: 'scatter',
        xLabel: metas[0].label,
        yLabel: metas[1].label,
        xUnit: datas[0].unit,
        yUnit: datas[1].unit,
        points: points,
        kind: 'scatter',
      };
    }

    if (viz === 'bar' || viz === 'pair') {
      // Intersect bar labels in the order of metric A
      const labelsA = datas[0].bar.map(d => d.label);
      const common = labelsA.filter(l => datas.every(d => d.bar.some(x => x.label === l)));
      if (common.length < 2) return null; // no shared axis — nothing to pair
      const data = common.map(label => {
        const point = { label };
        datas.forEach((d, i) => {
          point[String.fromCharCode(97 + i)] = d.bar.find(x => x.label === label).value;
        });
        return point;
      });
      return {
        metricIds: metricIds,
        viz: 'pair',
        labels: metas.map(m => m.label),
        data: data,
        kind: 'bar-pair',
      };
    }

    if (viz === 'line') {
      const xsA = datas[0].line.map(d => d.x);
      const common = xsA.filter(x => datas.every(d => d.line.some(p => p.x === x)));
      if (common.length < 2) return null;
      const series = datas.map((d, i) => ({
        label: metas[i].label,
        data: common.map(x => ({ x, y: d.line.find(p => p.x === x).y })),
      }));
      return {
        metricIds: metricIds,
        viz: 'line',
        labels: metas.map(m => m.label),
        series: series,
        kind: 'line-dual',
      };
    }

    // Fall through: build the first metric's spec.
    return buildSpec(metricIds[0], viz);
  }

  // ---------- Storage ----------
  const STORAGE_KEY = 'keystone.customDashboards';
  const CHANGE_EVENT = 'kx-custom-dashboards-changed';

  // Widgets are single-metric chart tiles pinned to the Battalion Chief V2
  // hero. They share the metric catalog with dashboards; storage is separate
  // so deleting a dashboard doesn't drop someone's pinned at-a-glance tile.
  const WIDGETS_KEY = 'keystone.customWidgets';
  const WIDGETS_EVENT = 'kx-custom-widgets-changed';

  function loadDashboards() {
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveDashboards(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  function publishDashboard(dashboard) {
    const list = loadDashboards();
    list.unshift(dashboard);
    saveDashboards(list);
  }
  function deleteDashboard(id) {
    saveDashboards(loadDashboards().filter(function (d) { return d.id !== id; }));
  }
  function findDashboard(id) {
    const list = loadDashboards();
    for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function loadWidgets() {
    try {
      const list = JSON.parse(localStorage.getItem(WIDGETS_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveWidgets(list) {
    try { localStorage.setItem(WIDGETS_KEY, JSON.stringify(list)); } catch (e) {}
    window.dispatchEvent(new Event(WIDGETS_EVENT));
  }
  function addWidget(widget) {
    const list = loadWidgets();
    list.push(widget);
    saveWidgets(list);
  }
  function deleteWidget(id) {
    saveWidgets(loadWidgets().filter(function (w) { return w.id !== id; }));
  }

  window.KEYSTONE_CUSTOM = {
    AVAILABLE_METRICS: AVAILABLE_METRICS,
    CORRELATION_SUGGESTIONS: CORRELATION_SUGGESTIONS,
    CUSTOM_METRICS: CUSTOM_METRICS,
    registerCustomMetric: registerCustomMetric,
    VIZ_TYPES: VIZ_TYPES,
    DEFAULT_VIZ: DEFAULT_VIZ,
    buildMetricsTableSpec: buildMetricsTableSpec,
    sharedBarLabels: sharedBarLabels,
    metricsCorrelatable: metricsCorrelatable,
    METRIC_DATA: METRIC_DATA,
    buildSpec: buildSpec,
    metricCategories: metricCategories,
    buildCorrelationSpec: buildCorrelationSpec,
    metricById: metricById,
    loadDashboards: loadDashboards,
    saveDashboards: saveDashboards,
    publishDashboard: publishDashboard,
    deleteDashboard: deleteDashboard,
    findDashboard: findDashboard,
    loadWidgets: loadWidgets,
    saveWidgets: saveWidgets,
    addWidget: addWidget,
    deleteWidget: deleteWidget,
    CHANGE_EVENT: CHANGE_EVENT,
    WIDGETS_EVENT: WIDGETS_EVENT,
  };
})();
