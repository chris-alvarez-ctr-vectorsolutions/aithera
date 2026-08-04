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
      table: { cols: ['Apparatus', 'Station', 'Days late'], rows: [['Engine 4-A', 'Sta. 4', '8'], ['Ladder 7', 'Sta. 7', '5'], ['Engine 4-B', 'Sta. 4', '4'], ['Medic 11', 'Sta. 11', '3'], ['Engine 1', 'Sta. 1', '2']] },
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
      table: { cols: ['Date', 'Station', 'Role', 'Status'], rows: [['Jun 2', 'Sta. 7', 'Engineer', 'No coverage'], ['Jun 4', 'Sta. 7', 'FF × 2',  'Voluntary OT'], ['Jun 6', 'Sta. 7', 'Lieutenant', 'Mutual aid'], ['Jun 9', 'Sta. 4', 'FF × 1', 'Trade pending']] },
      unit:  'shifts',
    },
    credential_expirations: {
      kpi:   { num: '11', delta: 'expire in 60 days', tone: 'warn' },
      bar:   [{ label: 'Paramedic', value: 4 }, { label: 'EVOC', value: 3 }, { label: 'HazMat', value: 2 }, { label: 'Pump Op', value: 1 }, { label: 'CPR/AED', value: 1 }],
      line:  [{ x: 'Jul', y: 6 }, { x: 'Aug', y: 9 }, { x: 'Sep', y: 11 }, { x: 'Oct', y: 14 }, { x: 'Nov', y: 18 }],
      stack: { legend: ['At risk', 'On track'], rows: [{ label: 'Paramedic', a: 4, b: 2 }, { label: 'EVOC', a: 3, b: 6 }, { label: 'HazMat', a: 2, b: 4 }, { label: 'CPR/AED', a: 1, b: 11 }] },
      donut: [{ label: 'Paramedic', value: 4, color: 'var(--coral-400)' }, { label: 'EVOC', value: 3, color: 'var(--amber-400)' }, { label: 'HazMat', value: 2, color: 'var(--teal-300)' }, { label: 'Other', value: 2, color: 'var(--ink-300)' }],
      table: { cols: ['Person', 'Credential', 'Expires', 'CEU %'], rows: [['Brennan, Riley', 'Paramedic', 'Jul 12', '38%'], ['Maguire, Owen', 'Paramedic', 'Jul 19', '41%'], ['Shah, Priya', 'EVOC', 'Jun 30', '12%'], ['Okafor, Jamal', 'HazMat', 'Jul 04', '25%']] },
      unit:  'people',
    },
    pto_pending: {
      kpi:   { num: '6', delta: '3 in coverage-critical windows', tone: 'warn' },
      bar:   [{ label: 'Sta. 7', value: 3 }, { label: 'Sta. 4', value: 2 }, { label: 'Sta. 1', value: 1 }, { label: 'Sta. 9', value: 0 }],
      line:  [{ x: 'Jan', y: 3 }, { x: 'Feb', y: 4 }, { x: 'Mar', y: 5 }, { x: 'Apr', y: 6 }, { x: 'May', y: 6 }],
      stack: { legend: ['Conflicts coverage', 'Clean'], rows: [{ label: 'Jun', a: 3, b: 1 }, { label: 'Jul', a: 1, b: 4 }, { label: 'Aug', a: 0, b: 6 }] },
      donut: [{ label: 'Vacation', value: 4, color: 'var(--teal-300)' }, { label: 'Medical', value: 1, color: 'var(--amber-400)' }, { label: 'Family',   value: 1, color: 'var(--coral-400)' }],
      table: { cols: ['Person', 'Dates', 'Station', 'Coverage'], rows: [['Maguire, Owen', 'Jun 6–9', 'Sta. 7', 'No backfill'], ['Shah, Priya', 'Jun 18–21', 'Sta. 7', 'Pending'], ['Okafor, Jamal', 'Jul 1–7', 'Sta. 4', 'Trade approved']] },
      unit:  'requests',
    },
    apparatus_downtime: {
      kpi:   { num: '42 hrs', delta: '+12 hrs vs. last month', tone: 'bad' },
      bar:   [{ label: 'Engine 4-A', value: 14 }, { label: 'Ladder 7', value: 11 }, { label: 'Engine 4-B', value: 8 }, { label: 'Medic 11', value: 5 }, { label: 'Engine 1', value: 4 }],
      line:  [{ x: 'Jan', y: 18 }, { x: 'Feb', y: 24 }, { x: 'Mar', y: 22 }, { x: 'Apr', y: 30 }, { x: 'May', y: 42 }],
      stack: { legend: ['Scheduled', 'Unscheduled'], rows: [{ label: 'Jan', a: 10, b: 8 }, { label: 'Feb', a: 12, b: 12 }, { label: 'Mar', a: 14, b: 8 }, { label: 'Apr', a: 12, b: 18 }, { label: 'May', a: 16, b: 26 }] },
      donut: [{ label: 'Pump',  value: 18, color: 'var(--coral-400)' }, { label: 'Aerial',value: 14, color: 'var(--amber-400)' }, { label: 'Other', value: 10, color: 'var(--teal-300)' }],
      table: { cols: ['Apparatus', 'Reason', 'Hours', 'Status'], rows: [['Engine 4-A', 'Pump rebuild', '14', 'In shop'], ['Ladder 7', 'Aerial cert.', '11', 'Pending'], ['Engine 4-B', 'Brake job', '8', 'Returned'], ['Medic 11', 'Cab electrical', '5', 'Returned']] },
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
      donut: [{ label: 'TargetSolutions', value: 54, color: 'var(--src-ts)' }, { label: 'Check It',     value: 38, color: 'var(--src-ci)' }, { label: 'Scheduling',   value: 24, color: 'var(--src-sched)' }, { label: 'Guardian',     value: 17, color: 'var(--src-gt)' }, { label: 'EV+',          value: 10, color: 'var(--src-ev)' }],
      table: { cols: ['Source', 'Open', 'Closed (7d)', 'Median age'], rows: [['TargetSolutions', '54', '142', '2.3 d'], ['Check It', '38', '95', '4.1 d'], ['Scheduling', '24', '76', '1.6 d'], ['Guardian', '17', '24', '3.0 d'], ['EV+', '10', '38', '1.9 d']] },
      unit:  'tasks',
    },

    // ---- expanded metric data ----
    ceu_progress: {
      kpi:   { num: '64%', delta: '−6 pts vs. last quarter', tone: 'warn' },
      bar:   [{ label: 'Sta. 1', value: 82 }, { label: 'Sta. 4', value: 51 }, { label: 'Sta. 7', value: 48 }, { label: 'Sta. 9', value: 77 }, { label: 'Sta. 11', value: 70 }],
      line:  [{ x: 'Jan', y: 71 }, { x: 'Feb', y: 70 }, { x: 'Mar', y: 68 }, { x: 'Apr', y: 66 }, { x: 'May', y: 64 }],
      stack: { legend: ['On track', 'At risk'], rows: [{ label: 'Paramedic', a: 6, b: 4 }, { label: 'EVOC', a: 8, b: 3 }, { label: 'HazMat', a: 5, b: 2 }, { label: 'CPR/AED', a: 12, b: 1 }] },
      donut: [{ label: 'On track', value: 64, color: 'var(--teal-300)' }, { label: 'Slipping', value: 24, color: 'var(--amber-300)' }, { label: 'At risk', value: 12, color: 'var(--coral-400)' }],
      table: { cols: ['Person', 'Credential', 'CEU %', 'Cohort'], rows: [['Brennan, Riley', 'Paramedic', '38%', 'Unassigned'], ['Maguire, Owen', 'Paramedic', '41%', 'Q3 Cohort A'], ['Shah, Priya', 'EVOC', '12%', 'Unassigned'], ['Okafor, Jamal', 'HazMat', '25%', 'Unassigned']] },
      unit:  '%',
    },
    policy_acks: {
      kpi:   { num: '88%', delta: '+5 pts vs. last month', tone: 'good' },
      bar:   [{ label: 'Sta. 1', value: 100 }, { label: 'Sta. 4', value: 71 }, { label: 'Sta. 7', value: 78 }, { label: 'Sta. 9', value: 96 }, { label: 'Sta. 11', value: 92 }],
      line:  [{ x: 'Jan', y: 78 }, { x: 'Feb', y: 81 }, { x: 'Mar', y: 84 }, { x: 'Apr', y: 86 }, { x: 'May', y: 88 }],
      stack: { legend: ['Acknowledged', 'Outstanding'], rows: [{ label: 'PPE SOP v3', a: 88, b: 12 }, { label: 'Mayday update', a: 73, b: 27 }, { label: 'EV decon', a: 91, b: 9 }] },
      donut: [{ label: 'Acknowledged', value: 88, color: 'var(--teal-300)' }, { label: 'Outstanding', value: 12, color: 'var(--amber-400)' }],
      table: { cols: ['Policy', 'Issued', 'Acks', 'Open'], rows: [['PPE SOP v3', 'May 02', '88', '12'], ['Mayday update', 'Apr 21', '73', '27'], ['EV decon', 'Apr 10', '91', '9']] },
      unit:  '%',
    },
    equipment_failures: {
      kpi:   { num: '17', delta: '+4 vs. last month', tone: 'bad' },
      bar:   [{ label: 'SCBA', value: 6 }, { label: 'Pump', value: 4 }, { label: 'Hose', value: 3 }, { label: 'Radio', value: 2 }, { label: 'AED', value: 2 }],
      line:  [{ x: 'Jan', y: 9 }, { x: 'Feb', y: 11 }, { x: 'Mar', y: 12 }, { x: 'Apr', y: 13 }, { x: 'May', y: 17 }],
      stack: { legend: ['In-service', 'OOS'], rows: [{ label: 'Sta. 4', a: 3, b: 4 }, { label: 'Sta. 7', a: 4, b: 3 }, { label: 'Sta. 1', a: 6, b: 1 }] },
      donut: [{ label: 'SCBA', value: 6, color: 'var(--coral-400)' }, { label: 'Pump', value: 4, color: 'var(--amber-400)' }, { label: 'Other', value: 7, color: 'var(--teal-300)' }],
      table: { cols: ['Item', 'Station', 'Reason', 'Status'], rows: [['SCBA #142', 'Sta. 4', 'Reg fault', 'OOS'], ['Pump E4-A', 'Sta. 4', 'Pressure loss', 'In shop'], ['Hose 2.5"', 'Sta. 7', 'Coupling', 'Replaced']] },
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
      table: { cols: ['Date', 'Station', 'Trade', 'Status'], rows: [['Jun 4', 'Sta. 7', 'Maguire ↔ Brennan', 'Approved'], ['Jun 6', 'Sta. 7', 'Shah ↔ Okafor', 'Pending'], ['Jun 9', 'Sta. 4', 'Vega ↔ Lin', 'Approved']] },
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
    if (viz === 'table') { out.cols = m.table.cols; out.rows = inc ? m.table.rows.filter(function (r) { return keep(r[0]); }) : m.table.rows; return out; }
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
