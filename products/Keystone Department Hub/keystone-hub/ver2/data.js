/* global React */
// data.js — fixture data for the Readiness Hub prototype.
// Seeded with realistic Fire department content. All dates are relative to "now"
// so the prototype always feels fresh.

(function () {
  const NOW = new Date('2026-05-07T09:30:00-05:00'); // Anchor for deterministic relative dates.
  window.__KEYSTONE_NOW = NOW;

  const hours = (h) => new Date(NOW.getTime() + h * 3600 * 1000);
  const days  = (d) => new Date(NOW.getTime() + d * 86400 * 1000);

  // ---------- Source-app metadata ----------
  const SOURCES = {
    ts:    { id: 'ts',    name: 'TargetSolutions', short: 'TS',    color: 'var(--src-ts)',    bg: 'var(--src-ts-bg)' },
    ci:    { id: 'ci',    name: 'Check It',        short: 'CI',    color: 'var(--src-ci)',    bg: 'var(--src-ci-bg)' },
    gt:    { id: 'gt',    name: 'Guardian Tracking', short: 'GT',    color: 'var(--src-gt)',    bg: 'var(--src-gt-bg)' },
    sched: { id: 'sched', name: 'Scheduling',      short: 'Sched', color: 'var(--src-sched)', bg: 'var(--src-sched-bg)' },
    ev:    { id: 'ev',    name: 'EV+',             short: 'EV+',   color: 'var(--src-ev)',    bg: 'var(--src-ev-bg)' },
  };

  // ---------- Stations (Fire department: Ladder Co + Engine Co per house) ----------
  const STATIONS = [
    { id: 'st1', name: 'Station 1',  battalion: 'B-1', label: 'Downtown / HQ' },
    { id: 'st4', name: 'Station 4',  battalion: 'B-1', label: 'Riverside' },
    { id: 'st7', name: 'Station 7',  battalion: 'B-2', label: 'East Hills' },
    { id: 'st9', name: 'Station 9',  battalion: 'B-2', label: 'Industrial' },
    { id: 'st12',name: 'Station 12', battalion: 'B-3', label: 'North' },
    { id: 'st14',name: 'Station 14', battalion: 'B-3', label: 'Airport' },
  ];

  // ---------- People ----------
  const PEOPLE = [
    { id: 'u1',  first: 'Jamie',    last: 'Smith',     rank: 'Battalion Chief',  station: 'st1',  shift: 'A' },
    { id: 'u2',  first: 'Devon',    last: 'Hartwell',  rank: 'Captain',          station: 'st4',  shift: 'A' },
    { id: 'u3',  first: 'Sloane',   last: 'Kim',       rank: 'Lieutenant',       station: 'st4',  shift: 'B' },
    { id: 'u4',  first: 'Jamal',    last: 'Okafor',    rank: 'Engineer',         station: 'st4',  shift: 'A' },
    { id: 'u5',  first: 'Riley',    last: 'Brennan',   rank: 'Firefighter/EMT',  station: 'st4',  shift: 'A' },
    { id: 'u6',  first: 'Priya',    last: 'Shah',      rank: 'Firefighter',      station: 'st7',  shift: 'C' },
    { id: 'u7',  first: 'Owen',     last: 'Maguire',   rank: 'Lieutenant',       station: 'st7',  shift: 'A' },
    { id: 'u8',  first: 'Alex',     last: 'Tanaka',    rank: 'Paramedic',        station: 'st9',  shift: 'B' },
    { id: 'u9',  first: 'Marisol',  last: 'Vega',      rank: 'Firefighter',      station: 'st9',  shift: 'A' },
    { id: 'u10', first: 'Kai',      last: 'Brennan',   rank: 'Captain',          station: 'st12', shift: 'B' },
    { id: 'u11', first: 'Theo',     last: 'Iverson',   rank: 'Firefighter/EMT',  station: 'st12', shift: 'C' },
    { id: 'u12', first: 'Naima',    last: 'Whitfield', rank: 'Training Officer', station: 'st1',  shift: '—' },
    { id: 'u13', first: 'Eli',      last: 'Rosenfeld', rank: 'Firefighter',      station: 'st14', shift: 'A' },
    { id: 'u14', first: 'Cassidy',  last: 'Park',      rank: 'Lieutenant',       station: 'st14', shift: 'B' },
  ];

  // ---------- Task type registry — drives icons, importance defaults, expansion fields ----------
  const TASK_TYPES = {
    course:           { source: 'ts',    label: 'Mandatory Training',   icon: 'school',         importance: 1.0 },
    elective:         { source: 'ts',    label: 'Elective Course',      icon: 'auto_stories',   importance: 0.4 },
    credential:       { source: 'ts',    label: 'Credential Renewal',   icon: 'verified',       importance: 0.95 },
    vehicle_inspect:  { source: 'ci',    label: 'Vehicle Inspection',   icon: 'fire_truck',     importance: 1.0 },
    equip_inspect:    { source: 'ci',    label: 'Equipment Inspection', icon: 'precision_manufacturing', importance: 0.8 },
    ppe_inspect:      { source: 'ci',    label: 'PPE Inspection',       icon: 'health_and_safety', importance: 0.9 },
    open_ticket:      { source: 'ci',    label: 'Outstanding Ticket',   icon: 'build_circle',   importance: 0.7 },
    doc_approval:     { source: 'gt',    label: 'Document Approval',    icon: 'fact_check',     importance: 0.5 },
    flag_review:      { source: 'gt',    label: 'Flag Review',          icon: 'flag_circle',    importance: 0.85 },
    open_shift:       { source: 'sched', label: 'Open Shift',           icon: 'event_busy',     importance: 0.9 },
    pto_request:      { source: 'sched', label: 'PTO / Leave Request',  icon: 'beach_access',   importance: 0.4 },
    shift_confirm:    { source: 'sched', label: 'Shift Confirmation',   icon: 'event_available',importance: 0.4 },
    evaluation:       { source: 'ev',    label: 'Evaluation Signature', icon: 'rate_review',    importance: 0.75 },
  };

  // ---------- Tasks (rich, hand-crafted) ----------
  // dueOffset is in hours from NOW (negative = overdue). null = no due date (Guardian, EV+).
  const RAW_TASKS = [
    // ===== STATION 4 =====
    { id:'t01', type:'vehicle_inspect', title:'Engine 4 — Daily Apparatus Check', station:'st4', assignees:['u4'], dueOffset: -16, effort: 0.2, meta:{ unit:'Engine 4', vehicle:'2022 Pierce Velocity', vin:'4P1CT01F7N…421', checklistItems:38, lastCompleted: days(-1), atRiskHours: 24 } },
    { id:'t02', type:'course', title:'NFPA 1500 — Bloodborne Pathogens (Annual)', station:'st4', assignees:['u5'], dueOffset: -38, effort: 0.6, meta:{ courseCode:'TS-1500-BBP', durationMin:45, attempts:0, mandatory: true } },
    { id:'t03', type:'course', title:'Hazmat Awareness Refresher', station:'st4', assignees:['u3','u5'], dueOffset: 96, effort: 0.7, meta:{ courseCode:'TS-HZ-200', durationMin:90, attempts:1, mandatory: true } },
    { id:'t04', type:'ppe_inspect', title:'Turnout Gear — Q2 Audit', station:'st4', assignees:['u4','u5'], dueOffset: 14*24, effort: 0.5, meta:{ assetCount:6, lastFinding:'Hood seam wear — ladder co' } },
    { id:'t05', type:'open_shift', title:'B-Shift Engineer — coverage gap', station:'st4', assignees:[], dueOffset: 22, effort: 0.3, meta:{ shiftDate: days(1), seats: '0/1 confirmed', preferredAssignees:['u4'] } },
    { id:'t06', type:'doc_approval', title:'Performance recognition — Brennan, R.', station:'st4', assignees:['u2'], dueOffset: null, openDays: 4.2, effort: 0.9, meta:{ category:'Recognition', author:'Hartwell, D.', step:'2 of 2', sla:'3 days' } },
    { id:'t07', type:'evaluation', title:'Q2 Probationary Eval — R. Brennan', station:'st4', assignees:['u2'], dueOffset: 4*24, effort: 0.6, meta:{ template:'Probationary 90d', signedSections:'4 of 6' } },

    // ===== STATION 7 =====
    { id:'t08', type:'vehicle_inspect', title:'Ladder 7 — Weekly Operational', station:'st7', assignees:['u7'], dueOffset: 6, effort: 0.4, meta:{ unit:'Ladder 7', vehicle:'2019 Pierce Arrow XT', checklistItems:62, lastCompleted: days(-7), atRiskHours: 24 } },
    { id:'t09', type:'equip_inspect', title:'SCBA Bottle Hydro — Pool 7B', station:'st7', assignees:[], dueOffset: -3*24, effort: 0.3, meta:{ assetCount:8, pool:'Pool 7B', lastFinding:'2 bottles past hydro window' } },
    { id:'t10', type:'flag_review', title:'EI Flag — Late report submission', station:'st7', assignees:['u7'], dueOffset: null, openDays: 5.8, effort: 1.0, meta:{ rule:'Reports >24h late', subject:'Shah, P.', sla:'72h' } },
    { id:'t11', type:'credential', title:'Paramedic Cert — Renewal Window', station:'st7', assignees:['u6'], dueOffset: 21*24, effort: 0.4, meta:{ credential:'NREMT-P', expires: days(28), CEUs:'42 / 60' } },
    { id:'t12', type:'open_ticket', title:'Bay door — sensor recalibration', station:'st7', assignees:['u7'], dueOffset: 48, effort: 0.7, meta:{ ticketId:'CI-T-3091', priority:'Medium', createdBy:'Auto' } },

    // ===== STATION 1 — HQ / training =====
    { id:'t13', type:'course', title:'Quarterly OSHA Refresher (cohort)', station:'st1', assignees:['u12'], dueOffset: 6*24, effort: 0.8, meta:{ courseCode:'TS-OSHA-Q2', enrolled: 47, completed: 19, mandatory: true } },
    { id:'t14', type:'doc_approval', title:'Policy update — Mayday procedures', station:'st1', assignees:['u1','u12'], dueOffset: null, openDays: 1.1, effort: 0.8, meta:{ category:'Policy', author:'Whitfield, N.', step:'1 of 3', sla:'5 days' } },
    { id:'t15', type:'pto_request', title:'PTO Request — Hartwell, D.', station:'st4', assignees:['u1'], dueOffset: 36, effort: 1.0, meta:{ days:'Jun 12–14', coverageStatus:'Auto-fill ready' } },

    // ===== STATION 9 =====
    { id:'t16', type:'vehicle_inspect', title:'Medic 9 — Daily', station:'st9', assignees:['u8'], dueOffset: 2, effort: 0.3, meta:{ unit:'Medic 9', vehicle:'2024 Horton Type I', checklistItems:44, lastCompleted: days(-1), atRiskHours: 24 } },
    { id:'t17', type:'course', title:'CPR / BLS Re-cert', station:'st9', assignees:['u9'], dueOffset: -7*24, effort: 0.5, meta:{ courseCode:'TS-BLS-25', durationMin:120, attempts:0, mandatory: true } },
    { id:'t18', type:'evaluation', title:'Annual Eval — A. Tanaka', station:'st9', assignees:['u10'], dueOffset: 9*24, effort: 0.6, meta:{ template:'Annual', signedSections:'0 of 8' } },
    { id:'t19', type:'open_shift', title:'A-Shift Paramedic — open seat', station:'st9', assignees:[], dueOffset: 16, effort: 0.3, meta:{ shiftDate: days(0.7), seats:'0/1 confirmed', preferredAssignees:['u8'] } },

    // ===== STATION 12 =====
    { id:'t20', type:'equip_inspect', title:'Thermal Imaging Cameras — Q2', station:'st12', assignees:['u10'], dueOffset: 12*24, effort: 0.6, meta:{ assetCount:4, pool:'TIC Pool 12', lastFinding:'Battery cycle warning — TIC-3' } },
    { id:'t21', type:'flag_review', title:'PR Flag — Commendation eligible', station:'st12', assignees:['u10'], dueOffset: null, openDays: 0.4, effort: 0.9, meta:{ rule:'Save / rescue', subject:'Iverson, T.', sla:'72h' } },
    { id:'t22', type:'shift_confirm', title:'Shift confirmation — overnight 5/8', station:'st12', assignees:['u11'], dueOffset: 20, effort: 1.0, meta:{ shiftDate: days(0.85), confirmed: false } },
    { id:'t23', type:'course', title:'Aerial Operations Refresher', station:'st12', assignees:['u11'], dueOffset: 5*24, effort: 0.7, meta:{ courseCode:'TS-AER-301', durationMin:75, attempts:0, mandatory: true } },

    // ===== STATION 14 — airport =====
    { id:'t24', type:'vehicle_inspect', title:'ARFF 14 — ARFF Index C check', station:'st14', assignees:['u13'], dueOffset: -5, effort: 0.5, meta:{ unit:'ARFF 14', vehicle:'2021 Oshkosh Striker 4x4', checklistItems:71, lastCompleted: days(-2), atRiskHours: 12 } },
    { id:'t25', type:'credential', title:'ARFF Endorsement — Renewal', station:'st14', assignees:['u14'], dueOffset: 30*24, effort: 0.5, meta:{ credential:'ARFF Driver/Op', expires: days(35), CEUs:'18 / 24' } },
    { id:'t26', type:'doc_approval', title:'Incident report — Hangar 3 fuel spill', station:'st14', assignees:['u14'], dueOffset: null, openDays: 2.4, effort: 0.8, meta:{ category:'Incident', author:'Rosenfeld, E.', step:'2 of 3', sla:'5 days' } },
    { id:'t27', type:'ppe_inspect', title:'Proximity Suit Audit', station:'st14', assignees:['u13','u14'], dueOffset: 7*24, effort: 0.5, meta:{ assetCount:3, lastFinding:'No findings (Q1)' } },
    { id:'t28', type:'open_shift', title:'C-Shift firefighter — open seat', station:'st14', assignees:[], dueOffset: 8, effort: 0.3, meta:{ shiftDate: days(0.4), seats:'0/2 confirmed', preferredAssignees:[] } },

    // a few more for breadth
    { id:'t29', type:'elective', title:'Mental Health First Aid (recommended)', station:'st4', assignees:['u3'], dueOffset: 30*24, effort: 0.6, meta:{ courseCode:'TS-MHFA', durationMin:240, attempts:0, mandatory:false } },
    { id:'t30', type:'open_ticket', title:'Compressor — pressure drift', station:'st9', assignees:['u8'], dueOffset: -2*24, effort: 0.6, meta:{ ticketId:'CI-T-3098', priority:'High', createdBy:'Tanaka, A.' } },
    { id:'t31', type:'shift_confirm', title:'A-Shift roll call — 5/8', station:'st4', assignees:['u4'], dueOffset: 18, effort: 1.0, meta:{ shiftDate: days(0.75), confirmed: true } },
    { id:'t32', type:'flag_review', title:'EI Flag — repeated tardiness', station:'st4', assignees:['u2'], dueOffset: null, openDays: 7.1, effort: 1.0, meta:{ rule:'3+ tardies in 30d', subject:'Brennan, R.', sla:'72h' } },

    // ===== Additional tasks for the firefighter (line-level) view =====
    // Riley Brennan (u5) — Sta. 4, A-shift. Their personal to-do.
    { id:'t33', type:'shift_confirm',  title:'Confirm A-Shift roll call — 5/8',  station:'st4', assignees:['u5'], dueOffset: 18, effort: 1.0, meta:{ shiftDate: days(0.75), confirmed: false } },
    { id:'t34', type:'equip_inspect',  title:'SCBA personal check — bottle 4-12', station:'st4', assignees:['u5'], dueOffset: 8, effort: 0.2, meta:{ assetCount:1, pool:'Sta. 4 SCBA', lastFinding:'No findings' } },
    { id:'t35', type:'course',         title:'EVOC Refresher — annual',           station:'st4', assignees:['u5'], dueOffset: 12*24, effort: 0.6, meta:{ courseCode:'TS-EVOC-A', durationMin:60, attempts:0, mandatory: true } },
    { id:'t36', type:'credential',     title:'EMT Recertification window',        station:'st4', assignees:['u5'], dueOffset: 45*24, effort: 0.4, meta:{ credential:'NREMT-B', expires: days(52), CEUs:'24 / 40' } },
    { id:'t37', type:'doc_approval',   title:'Sign off — turnout gear receipt',   station:'st4', assignees:['u5'], dueOffset: null, openDays: 1.6, effort: 0.9, meta:{ category:'Acknowledgement', author:'Hartwell, D.', step:'1 of 1', sla:'3 days' } },
  ];

  // ---------- Materialize tasks with computed fields ----------
  function timeWeight(dueAt, openDays) {
    if (!dueAt) {
      // No due date → SLA-based. Heuristic: 1.0 once openDays > 5
      if (openDays == null) return 0.1;
      if (openDays >= 5) return 1.0;
      if (openDays >= 3) return 0.85;
      if (openDays >= 1) return 0.5;
      return 0.2;
    }
    const ms = dueAt.getTime() - NOW.getTime();
    if (ms < 0) return 1.0;
    const hours = ms / 3600000;
    if (hours <= 24) return 0.85;
    if (hours <= 24 * 7) return 0.6;
    return 0.25;
  }

  function statusOf(dueAt, openDays, atRiskHours = 24) {
    if (!dueAt) {
      // SLA semantics
      if (openDays != null && openDays >= 5) return 'past_sla';
      if (openDays != null && openDays >= 3) return 'at_risk';
      return 'within_sla';
    }
    const ms = dueAt.getTime() - NOW.getTime();
    if (ms < 0) return 'overdue';
    const h = ms / 3600000;
    if (h <= atRiskHours) return 'at_risk';
    if (h <= 24 * 3) return 'due_soon';
    return 'on_track';
  }

  function priorityScore(t, weights = { time: 50, importance: 40, effort: 10 }) {
    const tt = TASK_TYPES[t.type];
    const time = timeWeight(t.dueAt, t.openDays);
    const imp = tt.importance;
    const eff = t.effort != null ? t.effort : 0;
    const score = weights.time * time + weights.importance * imp + weights.effort * eff;
    return { score: Math.round(score), time, importance: imp, effort: eff };
  }

  function priorityBand(score) {
    if (score >= 80) return 'P0';
    if (score >= 65) return 'P1';
    if (score >= 45) return 'P2';
    return 'P3';
  }

  const TASKS = RAW_TASKS.map(t => {
    const dueAt = t.dueOffset != null ? hours(t.dueOffset) : null;
    const openDays = t.openDays != null ? t.openDays
                     : (dueAt ? null : (t.meta && t.meta.openDays) || 0);
    const status = statusOf(dueAt, openDays, t.meta && t.meta.atRiskHours);
    const created = days(-Math.max(1, Math.round((openDays || 1) + Math.random() * 4)));
    const tt = TASK_TYPES[t.type];
    const out = {
      ...t,
      dueAt,
      openDays,
      created,
      status,
      source: tt.source,
      typeLabel: tt.label,
      icon: tt.icon,
    };
    const p = priorityScore(out);
    out.priorityScore = p.score;
    out.priorityBreakdown = p;
    out.priorityBand = priorityBand(p.score);
    return out;
  });

  // ---------- Saved views (per role) ----------
  const SAVED_VIEWS = [
    // Battalion Chief
    { id:'sv-cov',    role:'chief',    name:'Coverage at Risk',     icon:'crisis_alert', filter:{ types:['open_shift','shift_confirm','vehicle_inspect'], statuses:['overdue','at_risk','due_soon'] } },
    { id:'sv-late',   role:'chief',    name:'All Late',             icon:'schedule',     filter:{ statuses:['overdue','past_sla'] } },
    { id:'sv-bat',    role:'chief',    name:'My Battalion (B-1)',   icon:'shield',       filter:{ battalions:['B-1'] }, requiresFuture:true },
    { id:'sv-rdy',    role:'chief',    name:'Apparatus Status',     icon:'fire_truck',   filter:{ types:['vehicle_inspect','equip_inspect','open_ticket'] } },
    // Training Officer
    { id:'sv-mand',   role:'training', name:'Mandatory Overdue',    icon:'priority_high',filter:{ types:['course','credential'], statuses:['overdue'], mandatory:true } },
    { id:'sv-cred',   role:'training', name:'Credentials 60 days',  icon:'verified',     filter:{ types:['credential'] } },
    { id:'sv-cohort', role:'training', name:'Cohort Trainings',     icon:'groups',       filter:{ types:['course'] } },
    { id:'sv-evals',  role:'training', name:'Evaluations Due',      icon:'rate_review',  filter:{ types:['evaluation'] } },
    // Lieutenant
    { id:'sv-crew',   role:'lt',       name:'My Crew (Sta. 4 / A)', icon:'group',        filter:{ stations:['st4'], shifts:['A'] }, requiresFuture:true },
    { id:'sv-flag',   role:'lt',       name:'Flags & Approvals',    icon:'flag_circle',  filter:{ types:['flag_review','doc_approval'] } },
    { id:'sv-shift',  role:'lt',       name:'Today + Tomorrow',     icon:'today',        filter:{ dueWithinHours: 48 } },
    { id:'sv-prob',   role:'lt',       name:'Watch List',           icon:'visibility',   filter:{ assignees:['u5'] } }, // problem-employee surfacing
    // Firefighter (line-level, end user) — Riley Brennan, Sta. 4 / A-shift
    { id:'sv-mine-all',   role:'ff', name:'All my tasks',     icon:'assignment_ind', filter:{ assignees:['u5'] } },
    { id:'sv-mine-due',   role:'ff', name:'Due this week',    icon:'today',          filter:{ assignees:['u5'], dueWithinHours: 24*7 } },
    { id:'sv-mine-late',  role:'ff', name:'Late & at risk',   icon:'priority_high',  filter:{ assignees:['u5'], statuses:['overdue','past_sla','at_risk'] } },
    { id:'sv-mine-train', role:'ff', name:'My training',      icon:'school',         filter:{ assignees:['u5'], types:['course','credential','elective','evaluation'] } },
  ];

  // ---------- Roles ----------
  // v1 ships Firefighter + Chief. Training Officer and Lieutenant are
  // `gated:true` — they only appear in the role switcher when the
  // "Future functionality" flag is on (phase 2).
  const ROLES = {
    chief:    { id:'chief',    title:'Chief',            who:'Jamie Smith',     sub:'B-1 Downtown',     accent:'amber',  hero:'coverage',   selfId:'u1', admin: true },
    training: { id:'training', title:'Training Officer', who:'Naima Whitfield', sub:'Department-wide',  accent:'teal',   hero:'compliance', selfId:'u12', gated: true, admin: true },
    lt:       { id:'lt',       title:'Lieutenant',       who:'Sloane Kim',      sub:'Sta. 4 — B-Shift', accent:'coral',  hero:'crew',       selfId:'u3',  gated: true },
    ff:       { id:'ff',       title:'Firefighter',      who:'Riley Brennan',   sub:'Sta. 4 — A-Shift', accent:'coral',  hero:'personal',   selfId:'u5', hardScoped: true, defaultView:'sv-mine-all' },
  };

  // Export everything to window for cross-script access
  window.KEYSTONE = {
    NOW, SOURCES, STATIONS, PEOPLE, TASK_TYPES, TASKS, SAVED_VIEWS, ROLES,
    helpers: { priorityScore, priorityBand, statusOf, timeWeight, hours, days,
               personById: (id) => PEOPLE.find(p => p.id === id),
               stationById: (id) => STATIONS.find(s => s.id === id),
               sourceById: (id) => SOURCES[id],
               typeById: (id) => TASK_TYPES[id],
             }
  };
})();
