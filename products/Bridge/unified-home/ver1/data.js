/* ============================================================================
   Sample data for the Unified Home Dashboard (Convergence + Vector EHS).
   Everything on the page renders from this object, so a designer can retune
   the story by editing numbers here without touching app.js.
   Conventions:
     src: 'ehs' | 'ct'   which product a number or item comes from
     bucket: 'blue' | 'warn' | 'err'   EHS module colour bucket for calendar/tasks
   ========================================================================== */
window.SUITE_DATA = (function () {
  'use strict';

  var TODAY = '2026-09-25';

  /* ── Location hierarchy: Company > Region > Facility > Department ─────── */
  var company = { id: 'all', name: 'Northwind Manufacturing' };
  var regions = [
    { id: 'midwest',   name: 'Midwest' },
    { id: 'northeast', name: 'Northeast' },
    { id: 'south',     name: 'South' },
    { id: 'west',      name: 'West' }
  ];

  /* Facility metrics are for the selected date range (default: last 90 days).
     trirPrev / overduePrev are the prior period so the page can show deltas. */
  var facilities = [
    { id: 'plant4', name: 'Plant 4 – Riverside', region: 'midwest', employees: 860,
      trir: 4.8, trirPrev: 3.5, incidents: 16, recordables: 9, nearMisses: 7,
      openCA: 11, overdueCA: 4, openCAPrev: 7,
      compliance: 74, overdue: 22, overduePrev: 16, topOverdue: 'Forklift Safety Refresher', topOverdueCount: 42,
      qualsExpiring: 9, qualsExpiringPrev: 6, signal: 'elevated',
      departments: [
        { name: 'Shipping & Receiving', employees: 140, trir: 9.1, incidents: 7, openCA: 5, compliance: 58, overdue: 34, topOverdue: 'Forklift Safety Refresher', signal: 'elevated' },
        { name: 'Warehouse',            employees: 210, trir: 6.2, incidents: 5, openCA: 3, compliance: 66, overdue: 27, topOverdue: 'Forklift Safety Refresher', signal: 'elevated' },
        { name: 'Maintenance',          employees:  90, trir: 4.4, incidents: 2, openCA: 1, compliance: 79, overdue: 18, topOverdue: 'Lockout/Tagout',            signal: 'watch' },
        { name: 'Assembly',             employees: 320, trir: 3.0, incidents: 2, openCA: 2, compliance: 82, overdue: 14, topOverdue: 'Hazard Communication',       signal: 'watch' },
        { name: 'Quality',              employees: 100, trir: 1.2, incidents: 0, openCA: 0, compliance: 92, overdue:  6, topOverdue: 'Walking-Working Surfaces',   signal: 'stable' }
      ] },
    { id: 'plant2', name: 'Plant 2 – Columbus', region: 'midwest', employees: 1140,
      trir: 3.1, trirPrev: 3.0, incidents: 12, recordables: 8, nearMisses: 5,
      openCA: 9, overdueCA: 2, openCAPrev: 8,
      compliance: 71, overdue: 27, overduePrev: 19, topOverdue: 'Lockout/Tagout', topOverdueCount: 308,
      qualsExpiring: 14, qualsExpiringPrev: 11, signal: 'watch' },
    { id: 'dceast', name: 'DC East – Allentown', region: 'northeast', employees: 620,
      trir: 2.9, trirPrev: 2.6, incidents: 8, recordables: 4, nearMisses: 6,
      openCA: 7, overdueCA: 1, openCAPrev: 6,
      compliance: 88, overdue: 9, overduePrev: 8, topOverdue: 'Walking-Working Surfaces', topOverdueCount: 31,
      qualsExpiring: 11, qualsExpiringPrev: 9, signal: 'watch' },
    { id: 'plant1', name: 'Plant 1 – Tulsa', region: 'south', employees: 980,
      trir: 2.2, trirPrev: 2.4, incidents: 7, recordables: 5, nearMisses: 3,
      openCA: 8, overdueCA: 2, openCAPrev: 9,
      compliance: 91, overdue: 6, overduePrev: 7, topOverdue: 'Hazard Communication', topOverdueCount: 24,
      qualsExpiring: 12, qualsExpiringPrev: 10, signal: 'stable' },
    { id: 'plant7', name: 'Plant 7 – Greenville', region: 'south', employees: 730,
      trir: 1.8, trirPrev: 2.0, incidents: 5, recordables: 3, nearMisses: 4,
      openCA: 6, overdueCA: 1, openCAPrev: 5,
      compliance: 93, overdue: 5, overduePrev: 5, topOverdue: 'Hazard Communication', topOverdueCount: 19,
      qualsExpiring: 9, qualsExpiringPrev: 7, signal: 'stable' },
    { id: 'dcwest', name: 'DC West – Reno', region: 'west', employees: 410,
      trir: 1.4, trirPrev: 1.5, incidents: 3, recordables: 1, nearMisses: 2,
      openCA: 6, overdueCA: 2, openCAPrev: 4,
      compliance: 95, overdue: 4, overduePrev: 4, topOverdue: 'Forklift Safety Refresher', topOverdueCount: 9,
      qualsExpiring: 8, qualsExpiringPrev: 5, signal: 'stable' }
  ];

  /* Generic departments for facilities that have no hand-written breakdown.
     Numbers are scaled from the facility so a drill-down always has content. */
  var GENERIC_DEPTS = [
    { name: 'Production',           share: .42, k: 1.15 },
    { name: 'Shipping & Receiving', share: .18, k: 1.35 },
    { name: 'Maintenance',          share: .12, k: 1.05 },
    { name: 'Warehouse',            share: .18, k: 0.85 },
    { name: 'Quality & Admin',      share: .10, k: 0.45 }
  ];
  facilities.forEach(function (f) {
    if (f.departments) return;
    f.departments = GENERIC_DEPTS.map(function (d) {
      var trir = Math.round(f.trir * d.k * 10) / 10;
      var overdue = Math.max(2, Math.round(f.overdue * d.k));
      return {
        name: d.name, employees: Math.round(f.employees * d.share), trir: trir,
        incidents: Math.round(f.incidents * d.share * d.k), openCA: Math.round(f.openCA * d.share * 1.2),
        compliance: Math.min(99, Math.max(50, Math.round(f.compliance - (d.k - 1) * 20))),
        overdue: overdue, topOverdue: f.topOverdue,
        signal: trir >= 4 ? 'elevated' : (trir >= 2.5 ? 'watch' : 'stable')
      };
    });
  });

  /* ── KPI tiles: company roll-up + per-facility (12-point sparklines) ──── */
  var kpis = {
    all: {
      trir:     { value: 2.9, prev: 2.6, spark: [2.3, 2.4, 2.5, 2.4, 2.6, 2.5, 2.7, 2.6, 2.8, 2.9, 2.8, 2.9] },
      openCA:   { value: 47, prev: 39, overdue: 12, spark: [36, 38, 37, 39, 41, 40, 43, 42, 45, 44, 46, 47] },
      overdue:  { value: 14, prev: 11, spark: [10, 10, 11, 11, 12, 11, 12, 13, 13, 14, 14, 14] },
      quals:    { value: 63, prev: 48, spark: [44, 46, 45, 48, 50, 52, 55, 54, 58, 60, 61, 63] }
    }
  };
  facilities.forEach(function (f) {
    function ramp(from, to) { var out = []; for (var i = 0; i < 12; i++) { var t = i / 11; out.push(Math.round((from + (to - from) * (t * t)) * 10) / 10); } return out; }
    kpis[f.id] = {
      trir:    { value: f.trir, prev: f.trirPrev, spark: ramp(f.trirPrev, f.trir) },
      openCA:  { value: f.openCA, prev: f.openCAPrev, overdue: f.overdueCA, spark: ramp(f.openCAPrev, f.openCA) },
      overdue: { value: f.overdue, prev: f.overduePrev, spark: ramp(f.overduePrev, f.overdue) },
      quals:   { value: f.qualsExpiring, prev: f.qualsExpiringPrev, spark: ramp(f.qualsExpiringPrev, f.qualsExpiring) }
    };
  });

  /* ── Recommended actions (ranked by severity, then rank) ─────────────── */
  var recommendations = [
    {
      id: 'r1', headline: 'Forklift incidents up 38% at Plant 4 – Riverside', stat: '42 PIT operators haven’t refreshed in 12 months', rank: 1, severity: 'high', pattern: 'incident-training', facility: 'plant4',
      from: { src: 'ehs', label: 'Incidents · Vector EHS' }, to: { src: 'ct', label: 'Training · Convergence' },
      updated: '2 h ago',
      title: 'Incident rate at Plant 4 – Riverside is up 38% over the last 90 days',
      body: '11 of 16 incidents involved forklifts or other powered industrial trucks. Only 61% of the plant’s 108 PIT operators have completed Forklift Safety Refresher in the last 12 months.',
      suggestion: 'Assign Forklift Safety Refresher to the 42 employees at Plant 4 who haven’t completed it in the last 12 months.',
      primary: { label: 'Review & assign', action: 'assign' },
      secondary: { label: 'Snooze', action: 'snooze' },
      expanded: true,
      evidence: [
        { type: 'trend', src: 'ehs', title: 'Incidents per week, last 26 weeks',
          values: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1], currentFrom: 13,
          caption: '<strong>16 incidents</strong> in the last 13 weeks vs. 9 in the prior 13' },
        { type: 'hbars', src: 'ehs', title: 'Incident types, last 90 days',
          items: [['Forklift / PIT', 11, true], ['Slips and trips', 3], ['Lacerations', 1], ['Ergonomic strain', 1]],
          caption: 'Forklift / PIT is <strong>69%</strong> of incidents, up from 33%' },
        { type: 'meter', src: 'ct', title: 'Forklift Safety Refresher, Plant 4 PIT operators', pct: 61, tone: 'err',
          big: '61%', bigSmall: 'completed in last 12 months', left: '66 completed', right: '42 not completed',
          caption: 'Company average is <strong>84%</strong>' }
      ]
    },
    {
      id: 'r2', headline: 'Line B near-misses triggered your retraining rule', stat: '3 slips in 30 days, 18 employees on Line B', rank: 2, severity: 'high', pattern: 'threshold', facility: 'dceast',
      from: { src: 'ehs', label: 'Near-misses · Vector EHS' }, to: { src: 'ct', label: 'Training · Convergence' },
      updated: '5 h ago',
      title: '3 near-misses in 30 days on Line B at DC East – Allentown triggered your retraining rule',
      body: 'All three near-misses were slips on wet floor near the Line B wrap station (Sep 4, Sep 15, Sep 22). The rule matches everyone assigned to Line B.',
      rule: { count: 3, days: 30, scope: 'one line or work area', course: 'Walking-Working Surfaces', name: 'Near-miss cluster' },
      suggestion: 'Assign Walking-Working Surfaces to the 18 employees assigned to Line B, due in 14 days.',
      primary: { label: 'Assign to 18 employees', action: 'assign-threshold' },
      secondary: { label: 'Edit threshold', action: 'edit-rule' },
      expanded: false,
      evidence: [
        { type: 'list', src: 'ehs', title: 'Near-misses matched by the rule',
          items: [['NM-1187 · Slip near wrap station', 'Sep 22'], ['NM-1172 · Slip, wet floor Line B', 'Sep 15'], ['NM-1158 · Slip, Line B aisle', 'Sep 4']],
          caption: 'Rule threshold: <strong>3 in 30 days</strong>. Reached Sep 22.' },
        { type: 'meter', src: 'ehs', title: 'Rule progress', pct: 100, tone: 'warn', big: '3 of 3', bigSmall: 'near-misses in 30 days',
          left: 'Window opened Aug 24', right: 'Threshold met', caption: 'Rule: <strong>Near-miss cluster</strong>, edited by you on Jun 2' },
        { type: 'list', src: 'ct', title: 'People affected (18 on Line B)',
          items: [['Completed in last 12 months', '7'], ['Completed 12 to 24 months ago', '8'], ['Never completed', '3']],
          caption: 'Course: <strong>Walking-Working Surfaces</strong>, 30 min' }
      ]
    },
    {
      id: 'r3', headline: 'LOTO training overdue at Plant 2 while LOTO observations rise', stat: '308 employees overdue, observations up 45%', rank: 3, severity: 'medium', pattern: 'training-risk', facility: 'plant2',
      from: { src: 'ct', label: 'Training · Convergence' }, to: { src: 'ehs', label: 'Inspections · Vector EHS' },
      updated: 'Yesterday',
      title: 'Plant 2 – Columbus has 27% overdue Lockout/Tagout training, and LOTO-related observations are up',
      body: '308 of 1,140 employees are overdue on Lockout/Tagout. Observations tagged LOTO rose from 9 to 13 in the same 90 days, mostly on Lines 3 and 5.',
      suggestion: 'Schedule a LOTO inspection at Plant 2 and flag the facility as elevated risk until overdue training drops below 10%.',
      primary: { label: 'Schedule inspection', action: 'schedule-inspection' },
      secondary: { label: 'Flag as elevated risk', action: 'flag-risk' },
      expanded: false,
      evidence: [
        { type: 'meter', src: 'ct', title: 'Lockout/Tagout, Plant 2 employees', pct: 73, tone: 'warn', big: '27%', bigSmall: 'overdue',
          left: '832 current', right: '308 overdue', caption: 'Up from <strong>19%</strong> in the prior period' },
        { type: 'trend', src: 'ehs', title: 'LOTO-related observations per week',
          values: [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2], currentFrom: 13,
          caption: '<strong>13 observations</strong> in the last 13 weeks vs. 9 in the prior 13' },
        { type: 'list', src: 'ehs', title: 'Where the observations are',
          items: [['Line 5 · Press area', '5'], ['Line 3 · Conveyor', '4'], ['Maintenance shop', '3'], ['Other', '1']],
          caption: 'Last LOTO inspection at Plant 2: <strong>Feb 12</strong>' }
      ]
    },
    {
      id: 'r4', headline: 'Corrective action CA-2291 calls for retraining', stat: 'Marcus Bell, Safe Lifting & Ergonomics, due Oct 10', rank: 4, severity: 'medium', pattern: 'corrective-action', facility: 'plant1',
      from: { src: 'ehs', label: 'Corrective actions · Vector EHS' }, to: { src: 'ct', label: 'Training · Convergence' },
      updated: 'Yesterday',
      title: 'Corrective action CA-2291 calls for retraining an operator after incident INC-4471',
      body: 'INC-4471 (ergonomic strain, Plant 1 – Tulsa, Sep 18) was investigated and closed with a corrective action: retrain the operator on safe lifting. The corrective action is due Oct 10.',
      suggestion: 'Assign Safe Lifting & Ergonomics to Marcus Bell from the corrective action, with the same Oct 10 due date, so completion closes the action automatically.',
      primary: { label: 'Assign from corrective action', action: 'assign-ca' },
      secondary: { label: 'View corrective action', action: 'view-ca' },
      expanded: false,
      evidence: [
        { type: 'list', src: 'ehs', title: 'Corrective action CA-2291',
          items: [['Owner', 'Renee Ortiz'], ['Due', 'Oct 10, 2026'], ['Status', 'Open'], ['Source', 'INC-4471 investigation']],
          caption: 'Action text: <strong>Retrain operator on safe lifting technique</strong>' },
        { type: 'list', src: 'ehs', title: 'Incident INC-4471',
          items: [['Type', 'Ergonomic strain'], ['Employee', 'Marcus Bell'], ['Department', 'Shipping & Receiving'], ['Days away', '2']],
          caption: 'Recordable. Logged on the OSHA 300 Log.' },
        { type: 'list', src: 'ct', title: 'Marcus Bell, training record',
          items: [['Safe Lifting & Ergonomics', 'Never'], ['Hazard Communication', 'Current'], ['Forklift Safety Refresher', 'Current']],
          caption: 'Assigning from here links the completion back to <strong>CA-2291</strong>' }
      ]
    },
    {
      id: 'r5', headline: '6 forklift qualifications at Plant 4 expire in 30 days', stat: '4 of the 6 operators were in recent incidents', rank: 5, severity: 'medium', pattern: 'quals-incidents', facility: 'plant4',
      from: { src: 'ct', label: 'Qualifications · Convergence' }, to: { src: 'ehs', label: 'Incidents · Vector EHS' },
      updated: '3 d ago',
      title: '6 forklift operator qualifications at Plant 4 expire in the next 30 days, and 4 of those operators were involved in recent incidents',
      body: 'Renewing on paper alone would keep four operators certified who were involved in PIT incidents since July.',
      suggestion: 'Schedule hands-on re-evaluations for the 6 operators before their Oct 20 expiry instead of auto-renewing.',
      primary: { label: 'Schedule evaluations', action: 'schedule-eval' },
      secondary: { label: 'View qualifications', action: 'view-quals' },
      expanded: false,
      evidence: [
        { type: 'list', src: 'ct', title: 'Expiring PIT qualifications',
          items: [['J. Alvarez', 'Oct 3'], ['T. Nguyen', 'Oct 9'], ['D. Reyes', 'Oct 14'], ['+3 more', 'by Oct 20']],
          caption: 'Qualification: <strong>Powered Industrial Truck Operator</strong>' },
        { type: 'list', src: 'ehs', title: 'Incident involvement since July',
          items: [['J. Alvarez', 'INC-4402'], ['T. Nguyen', 'INC-4418'], ['D. Reyes', 'INC-4433, INC-4460'], ['A. Brooks', 'INC-4455']],
          caption: '4 of 6 operators appear on incident reports' },
        { type: 'meter', src: 'ct', title: 'Plant 4 PIT qualifications current', pct: 94, tone: 'ok', big: '94%', bigSmall: 'current',
          left: '102 current', right: '6 expiring', caption: 'Company average is <strong>96%</strong>' }
      ]
    },
    {
      id: 'r6', headline: 'New chemicals at Plant 7 aren’t covered by HazCom', stat: '112 employees work with the new adhesives', rank: 6, severity: 'low', pattern: 'hazcom', facility: 'plant7',
      from: { src: 'ehs', label: 'Chemicals · Vector EHS' }, to: { src: 'ct', label: 'Training · Convergence' },
      updated: '4 d ago',
      title: '3 new chemicals were added to the SDS library at Plant 7 – Greenville this month',
      body: 'Hazard Communication completion at Plant 7 is 95%, but the annual module doesn’t cover the new isocyanate-based adhesives introduced on Sep 8.',
      suggestion: 'Assign the Hazard Communication update module to the 112 employees at Plant 7 who work in areas that use the new adhesives.',
      primary: { label: 'Review & assign', action: 'assign-hazcom' },
      secondary: { label: 'Snooze', action: 'snooze' },
      expanded: false,
      evidence: [
        { type: 'list', src: 'ehs', title: 'New SDS entries',
          items: [['Bondrite 2K adhesive', 'Sep 8'], ['Bondrite activator', 'Sep 8'], ['Solvent cleaner SC-40', 'Sep 12']],
          caption: 'Added by <strong>Priya Natarajan</strong>, Plant 7 EHS coordinator' },
        { type: 'meter', src: 'ct', title: 'Hazard Communication, Plant 7', pct: 95, tone: 'ok', big: '95%', bigSmall: 'current',
          left: '694 current', right: '36 overdue', caption: 'Annual module, last revised <strong>Jan 2026</strong>' },
        { type: 'list', src: 'ct', title: 'Suggested audience',
          items: [['Assembly, Lines 1 and 2', '84'], ['Maintenance', '18'], ['Quality', '10']],
          caption: 'Based on where the chemicals are stored and used' }
      ]
    }
  ];

  /* ── Employees for the Review & assign flow (Plant 4, 42 people) ───────── */
  var FIRST = ['Maria', 'James', 'Luis', 'Aisha', 'Derek', 'Hannah', 'Tomas', 'Priya', 'Kevin', 'Sofia', 'Andre', 'Grace', 'Omar', 'Chloe', 'Victor', 'Nadia', 'Ethan', 'Rosa', 'Malik', 'Elena', 'Brandon', 'Yuki', 'Carlos', 'Leah', 'Samuel', 'Ingrid', 'Devon', 'Amara', 'Patrick', 'Mei', 'Jorge', 'Tessa', 'Isaiah', 'Farah', 'Logan', 'Bianca', 'Ravi', 'Kayla', 'Hector', 'Simone', 'Wyatt', 'Zara'];
  var LAST = ['Alvarez', 'Whitaker', 'Nguyen', 'Okafor', 'Brooks', 'Lindqvist', 'Reyes', 'Natarajan', 'Doyle', 'Marchetti', 'Sullivan', 'Park', 'Haddad', 'Fischer', 'Mendes', 'Petrov', 'Coleman', 'Delgado', 'Johnson', 'Vasquez', 'Kowalski', 'Tanaka', 'Ortiz', 'Bennett', 'Osei', 'Larsen', 'Carter', 'Diallo', 'Murphy', 'Chen', 'Castillo', 'Novak', 'Wright', 'Rahman', 'Pierce', 'Romero', 'Iyer', 'Foster', 'Salazar', 'Baptiste', 'Hughes', 'Malik'];
  var DEPTS = ['Shipping & Receiving', 'Shipping & Receiving', 'Warehouse', 'Warehouse', 'Warehouse', 'Maintenance', 'Assembly'];
  var LAST_DONE = ['Aug 2025', 'Jul 2025', 'Jun 2025', 'May 2025', 'Mar 2025', 'Jan 2025', 'Nov 2024', 'Never', 'Sep 2024', 'Apr 2025'];
  var INCIDENT_IDS = { 0: 'INC-4402', 2: 'INC-4418', 6: 'INC-4433', 4: 'INC-4455', 13: 'INC-4460', 21: 'INC-4471' };
  var employees = [];
  for (var i = 0; i < 42; i++) {
    employees.push({
      id: 'e' + (i + 1),
      name: FIRST[i] + ' ' + LAST[i],
      dept: DEPTS[i % DEPTS.length],
      lastCompleted: LAST_DONE[(i * 7) % LAST_DONE.length],
      incident: INCIDENT_IDS[i] || null,
      selected: true
    });
  }

  var courses = [
    { id: 'forklift', label: 'Forklift Safety Refresher', duration: '45 min', format: 'Online, with hands-on sign-off', version: 'v3.2', revised: 'May 2026', passing: '80%' },
    { id: 'loto',     label: 'Lockout/Tagout', duration: '60 min', format: 'Online', version: 'v5.0', revised: 'Feb 2026', passing: '80%' },
    { id: 'hazcom',   label: 'Hazard Communication', duration: '40 min', format: 'Online', version: 'v4.1', revised: 'Jan 2026', passing: '80%' },
    { id: 'wws',      label: 'Walking-Working Surfaces', duration: '30 min', format: 'Online', version: 'v2.3', revised: 'Aug 2025', passing: '80%' },
    { id: 'lifting',  label: 'Safe Lifting & Ergonomics', duration: '35 min', format: 'Online', version: 'v1.8', revised: 'Jun 2025', passing: '80%' }
  ];

  var learnerNote = 'Plant 4 has had 11 forklift-related incidents in the last 90 days, more than double the previous quarter. We’re asking every powered industrial truck operator who hasn’t taken Forklift Safety Refresher in the past year to complete it by the due date. It takes about 45 minutes. If you have questions, talk to your supervisor or the Plant 4 safety team.';

  /* ── Assigned to me: tasks from both products ───────────────────────────── */
  var tasks = [
    { id: 't1', src: 'ehs', kind: 'Corrective action', bucket: 'warn', icon: 'fa-list-check', title: 'Approve corrective action CA-2287: Replace damaged dock plate', where: 'Plant 4 – Riverside', facility: 'plant4', due: '2026-09-27', ref: 'CA-2287' },
    { id: 't2', src: 'ehs', kind: 'Inspection', bucket: 'blue', icon: 'fa-clipboard-check', title: 'Sign off monthly fire extinguisher inspection', where: 'DC East – Allentown', facility: 'dceast', due: '2026-09-23', ref: 'INS-0912' },
    { id: 't3', src: 'ct', kind: 'Assignment approval', bucket: 'blue', icon: 'fa-graduation-cap', title: 'Review pending assignment: Forklift Safety Refresher (42 learners)', where: 'Plant 4 – Riverside', facility: 'plant4', due: '2026-09-29', ref: 'ASG-3310', linkedRec: 'r1' },
    { id: 't4', src: 'ehs', kind: 'Investigation', bucket: 'err', icon: 'fa-triangle-exclamation', title: 'Complete investigation INC-4482: Forklift contact with racking', where: 'Plant 4 – Riverside', facility: 'plant4', due: '2026-09-30', ref: 'INC-4482' },
    { id: 't5', src: 'ct', kind: 'Your training', bucket: 'blue', icon: 'fa-graduation-cap', title: 'Complete your training: Hazard Communication annual refresher', where: 'All locations', facility: null, due: '2026-10-31', ref: 'Own training' },
    { id: 't6', src: 'ehs', kind: 'Corrective action', bucket: 'warn', icon: 'fa-list-check', title: 'Verify closure evidence CA-2260: LOTO procedure posted at Line 3', where: 'Plant 2 – Columbus', facility: 'plant2', due: '2026-10-02', ref: 'CA-2260' },
    { id: 't7', src: 'ct', kind: 'Qualification', bucket: 'blue', icon: 'fa-id-badge', title: 'Evaluate 3 forklift operators for qualification renewal', where: 'DC West – Reno', facility: 'dcwest', due: '2026-10-06', ref: 'QUAL-PIT' },
    { id: 't8', src: 'ehs', kind: 'Observation', bucket: 'blue', icon: 'fa-eye', title: 'Follow up observation OBS-2210: Blocked eyewash station', where: 'Plant 7 – Greenville', facility: 'plant7', due: '2026-10-08', ref: 'OBS-2210' }
  ];

  /* ── Shared compliance calendar (October 2026 shown) ────────────────────── */
  var calendar = [
    { date: '2026-10-01', src: 'ehs', kind: 'inspection', bucket: 'blue', icon: 'fa-clipboard-check', title: 'Monthly fire extinguisher inspections', facility: null },
    { date: '2026-10-02', src: 'ehs', kind: 'ca', bucket: 'warn', icon: 'fa-list-check', title: 'CA-2260 due · Plant 2', facility: 'plant2' },
    { date: '2026-10-06', src: 'ct', kind: 'training', bucket: 'blue', icon: 'fa-graduation-cap', title: 'Lockout/Tagout due · 84 learners, Plant 2', facility: 'plant2' },
    { date: '2026-10-09', src: 'ct', kind: 'training', bucket: 'blue', icon: 'fa-graduation-cap', title: 'Walking-Working Surfaces due · Line B, DC East', facility: 'dceast' },
    { date: '2026-10-10', src: 'ehs', kind: 'ca', bucket: 'warn', icon: 'fa-list-check', title: 'CA-2291 due · Plant 1', facility: 'plant1' },
    { date: '2026-10-14', src: 'ehs', kind: 'inspection', bucket: 'blue', icon: 'fa-clipboard-check', title: 'Quarterly LOTO audit · Plant 2', facility: 'plant2' },
    { date: '2026-10-15', src: 'ehs', kind: 'inspection', bucket: 'blue', icon: 'fa-clipboard-check', title: 'PIT pre-shift inspection review · Plant 4', facility: 'plant4' },
    { date: '2026-10-20', src: 'ehs', kind: 'osha', bucket: 'err', icon: 'fa-file-shield', title: 'OSHA 300 Log Q3 review', facility: null },
    { date: '2026-10-20', src: 'ct', kind: 'qual', bucket: 'blue', icon: 'fa-id-badge', title: '6 PIT qualifications expire · Plant 4', facility: 'plant4' },
    { date: '2026-10-22', src: 'ehs', kind: 'inspection', bucket: 'blue', icon: 'fa-clipboard-check', title: 'Racking inspection · DC East', facility: 'dceast' },
    { date: '2026-10-28', src: 'ct', kind: 'training', bucket: 'blue', icon: 'fa-graduation-cap', title: 'Hazard Communication annual window closes', facility: null },
    { date: '2026-10-30', src: 'ehs', kind: 'inspection', bucket: 'blue', icon: 'fa-clipboard-check', title: 'Emergency drill · Plant 7', facility: 'plant7' }
  ];
  var deadlines = [
    { title: 'OSHA 300 Log Q3 review', date: 'Oct 20, 2026', facility: null },
    { title: 'OSHA 300A summary: certify and post (posting window Feb 1 to Apr 30)', date: 'Feb 1, 2027', facility: null },
    { title: 'OSHA 300A electronic submission (ITA)', date: 'Mar 2, 2027', facility: null }
  ];

  /* ── OSHA audit readiness ───────────────────────────────────────────────── */
  var audit = {
    all: {
      score: 86, gaps: 3,
      items: [
        { src: 'ehs', state: 'warn', title: 'OSHA 300 Log', sub: '14 recordable cases in 2026. 2 entries are missing days-away counts.', action: 'Fix 2 entries' },
        { src: 'ehs', state: 'ok',   title: '301 incident reports', sub: '14 of 14 complete within 7 days of the case.', action: 'Open' },
        { src: 'ehs', state: 'ok',   title: '300A annual summary', sub: 'Draft is current. Certify and post by Feb 1, 2027.', action: 'Preview' },
        { src: 'ct',  state: 'warn', title: 'Training records for injured employees', sub: '11 of 14 had required training current at the time of injury. 3 gaps flagged.', action: 'Review 3 gaps' },
        { src: 'ct',  state: 'ok',   title: 'Powered industrial truck operator records', sub: '96% of 412 operators hold a current evaluation and certificate.', action: 'Open' }
      ]
    },
    plant4: {
      score: 83, gaps: 3,
      items: [
        { src: 'ehs', state: 'warn', title: 'OSHA 300 Log', sub: '9 recordable cases in 2026 at Plant 4. 2 entries are missing days-away counts.', action: 'Fix 2 entries' },
        { src: 'ehs', state: 'warn', title: '301 incident reports', sub: '8 of 9 complete. INC-4482 investigation is still open.', action: 'Open INC-4482' },
        { src: 'ehs', state: 'ok',   title: '300A annual summary', sub: 'Plant 4 establishment summary is current.', action: 'Preview' },
        { src: 'ct',  state: 'warn', title: 'Training records for injured employees', sub: '6 of 9 had required training current at the time of injury. 3 gaps, all Forklift Safety Refresher.', action: 'Review 3 gaps' },
        { src: 'ct',  state: 'ok',   title: 'Powered industrial truck operator records', sub: '94% of 108 operators hold a current evaluation and certificate.', action: 'Open' }
      ]
    }
  };

  var notifications = [
    { id: 'n1', title: 'Retraining rule triggered', body: 'Near-miss cluster on Line B, DC East – Allentown', read: false },
    { id: 'n2', title: 'Corrective action approved', body: 'CA-2281 approved by Renee Ortiz', read: false },
    { id: 'n3', title: 'Assignment completed', body: 'Lockout/Tagout: 12 learners completed at Plant 2', read: true }
  ];

  return {
    today: TODAY, company: company, regions: regions, facilities: facilities, kpis: kpis,
    recommendations: recommendations, employees: employees, courses: courses, learnerNote: learnerNote,
    tasks: tasks, calendar: calendar, deadlines: deadlines, audit: audit, notifications: notifications,
    user: { name: 'Dana Whitfield', email: 'dana.whitfield@northwind.example', role: 'Safety and Training Administrator', initials: 'DW' },
    trainingAdmin: { name: 'Priya Natarajan', role: 'Training administrator' }
  };
})();
