/* global window */
// agency-intel-ai-data.js — data + logic for Homepage AI (Agency Intelligence) access
// management and its audit log.
//
//   • seedGrants()  — who currently has Agency Intelligence on their homepage
//   • seedLog()     — ~10 days of realistic Q&A activity, incl. declined asks
//   • coveredPeople(grants) — resolve grants → named people (with "via")
//   • personEntitlements(person, overrides) — title entitlements + admin fixes
//   • homepageRespond(question, person) — the homepage-flavored answer engine
//     (text only — no canvas on the homepage; charts live in Agency Intelligence)
//
// Plain JS (no JSX) so it loads before the Babel layer.

(function () {
  const K = window.KEYSTONE;
  const CP = function () { return window.AGENCY_INTEL; }; // loaded just before this file

  // ---------- Question corpus ----------
  // Each entry: phrasing variants + the metric it resolves to. Sources come
  // from AGENCY_INTEL.METRIC_SOURCE, so access checks stay consistent with the
  // dashboard reconciliation logic.
  const QUESTIONS = [
    { metricId: 'training_completion',    q: ['What’s our training completion this quarter?', 'Which stations are behind on training?', 'Show my crew’s training compliance'], ret: { label: 'Training completion — QTD, by station', rows: 6 } },
    { metricId: 'credential_expirations', q: ['Whose paramedic cert expires in the next 60 days?', 'Any credentials lapsing before July?', 'Who’s at risk on re-certs?'], ret: { label: 'Credential expirations — next 60 days', rows: 11 } },
    { metricId: 'ot_trend',               q: ['How many overtime hours did we log last month?', 'Is overtime trending up?', 'Forecast overtime for next month'], ret: { label: 'Overtime hours — last 12 months', rows: 12 } },
    { metricId: 'open_shifts',            q: ['Which shifts are open next week?', 'Do we have coverage gaps this weekend?', 'Show open shifts for the next 14 days'], ret: { label: 'Open shifts — next 14 days', rows: 9 } },
    { metricId: 'pto_pending',            q: ['How many PTO requests are waiting on approval?', 'Any time-off requests pending for my shift?'], ret: { label: 'Pending PTO requests', rows: 6 } },
    { metricId: 'sick_leave',             q: ['Is sick leave up this month?', 'Sick leave hours by shift?'], ret: { label: 'Sick leave hours — last 30 days', rows: 3 } },
    { metricId: 'trade_requests',         q: ['Any shift trades awaiting approval?'], ret: { label: 'Shift trade requests — open', rows: 8 } },
    { metricId: 'apparatus_downtime',     q: ['How long was Engine 4 out of service?', 'Apparatus downtime by month?', 'Which rigs are out of service right now?'], ret: { label: 'Apparatus downtime — by month', rows: 12 } },
    { metricId: 'equipment_failures',     q: ['What equipment failed inspection most?', 'Any SCBA failures this month?'], ret: { label: 'Equipment failures — by type', rows: 5 } },
    { metricId: 'overdue_inspections',    q: ['Which inspections are overdue at Station 4?', 'How many inspections are past due?'], ret: { label: 'Overdue inspections — by station', rows: 14 } },
    { metricId: 'response_time',          q: ['What’s our average response time this quarter?', 'Response time trend for B-2?'], ret: { label: 'Response time — monthly median', rows: 12 } },
    { metricId: 'incident_volume',        q: ['How many calls did Station 7 run last month?', 'Incident volume year over year?'], ret: { label: 'Incident volume — by month', rows: 12 } },
    { metricId: 'policy_acks',            q: ['Who hasn’t acknowledged the new SOG?', 'Policy acknowledgment rate?'], ret: { label: 'Policy acknowledgments — YTD', rows: 4 } },
    { metricId: 'ceu_progress',           q: ['How’s CEU progress for the paramedic cohort?', 'CEU completion by station?'], ret: { label: 'CEU progress — by station', rows: 6 } },
    { metricId: 'tasks_by_app',           q: ['What’s open across all our apps?', 'Where is most of our open work?'], ret: { label: 'Open work — by source app', rows: 5 } },
  ];

  // Recognised-but-no-data asks (mirrors AGENCY_INTEL.NO_DATA territory).
  const NODATA_QUESTIONS = [
    'What’s the hydrant flow rate on Route 9?',
    'What’s our fuel spend this quarter?',
  ];

  // Homepage-flavored answers (text only; no canvas on the homepage).
  const ANSWERS = {
    training_completion: 'Training completion is at **79%**, down 4 points this quarter. Sta. 4 and Sta. 7 are the only houses below 75%.',
    credential_expirations: '**11 credentials** expire within 60 days — 4 are paramedic re-certs. Three seats are open in Q3 Cohort A that match the window.',
    ot_trend: 'Overtime is climbing — **412 projected hours** next month vs. 348 in May. Sta. 7 drives about 60% of the increase.',
    open_shifts: '**Nine open shifts** in the next 14 days, six at Sta. 7. Two have no coverage path yet — Jun 2 (engineer) and Jun 6 (lieutenant).',
    pto_pending: '**Six PTO requests** are pending. Three fall inside coverage-critical windows Jun 2–9.',
    sick_leave: 'Sick leave reached **184 hours** last month, up 22%. B-shift accounts for over half.',
    trade_requests: '**23 shift-trade requests** this period — 8 are still awaiting approval.',
    apparatus_downtime: 'Apparatus downtime hit **42 hours** in May, up 12 from April. Engine 4-A’s pump rebuild is the biggest block.',
    equipment_failures: '**17 equipment failures** last month, led by SCBA regulators (6). Two are still open work orders.',
    overdue_inspections: '**14 inspections** are overdue, concentrated at Sta. 4. Ten are apparatus checks; four are facility.',
    response_time: 'Median response time is **6:42**, up 18 seconds this quarter. The drift is concentrated in the Airport district.',
    incident_volume: 'Incident volume is up **9%** year over year. Sta. 7 ran 212 calls last month — highest in the battalion.',
    policy_acks: 'Policy acknowledgments are at **88%**, up 5 points. 14 people still haven’t signed the new SOG.',
    ceu_progress: 'CEU progress averages **64%**, slipping 6 points. The paramedic cohort is furthest behind.',
    tasks_by_app: 'You have **57 open items** across five apps — TargetSolutions and Check It carry the bulk.',
  };

  // ---------- Grants ----------
  // A grant targets a job title or a named individual, same audience model as
  // publishing a dashboard.
  function seedGrants() {
    return {
      titles: [
        { id: 'battalion_chief', grantedAt: '2026-04-02', grantedBy: 'You' },
        { id: 'captain',         grantedAt: '2026-04-21', grantedBy: 'You' },
      ],
      individuals: [
        { id: 'u12', grantedAt: '2026-05-01', grantedBy: 'You' }, // Naima Whitfield — Training Officer
        { id: 'u14', grantedAt: '2026-04-28', grantedBy: 'You' }, // Cassidy Park — Lieutenant
      ],
    };
  }

  // Resolve grants → the named people covered (via title or named directly).
  function coveredPeople(grants) {
    const out = [];
    const seen = {};
    (grants.individuals || []).forEach(function (g) {
      const ind = CP().INDIVIDUALS.find(function (x) { return x.id === g.id; });
      if (ind && !seen[ind.id]) { seen[ind.id] = true; out.push({ person: ind, via: 'individual', grant: g }); }
    });
    (grants.titles || []).forEach(function (g) {
      CP().INDIVIDUALS.forEach(function (ind) {
        if (ind.titleId === g.id && !seen[ind.id]) { seen[ind.id] = true; out.push({ person: ind, via: 'title', grant: g }); }
      });
    });
    return out;
  }

  // Estimated homepage reach (title headcounts + named individuals not
  // already inside a granted title).
  function grantReach(grants) {
    let n = 0;
    const titleSet = {};
    (grants.titles || []).forEach(function (g) {
      const t = CP().titleById(g.id);
      if (t) { n += t.count; titleSet[g.id] = true; }
    });
    (grants.individuals || []).forEach(function (g) {
      const ind = CP().INDIVIDUALS.find(function (x) { return x.id === g.id; });
      if (!ind || !titleSet[ind.titleId]) n += 1;
    });
    return n;
  }

  // Effective entitlements = job-title entitlements + admin session overrides.
  // overrides = { titleId: { src: true } }
  function personEntitlements(person, overrides) {
    const base = (CP().titleById(person.titleId) || {}).entitlements || [];
    const extra = (overrides || {})[person.titleId] || {};
    const out = base.slice();
    Object.keys(extra).forEach(function (s) { if (extra[s] && out.indexOf(s) === -1) out.push(s); });
    return out;
  }
  function titleEntitlements(titleId, overrides) {
    const base = (CP().titleById(titleId) || {}).entitlements || [];
    const extra = (overrides || {})[titleId] || {};
    const out = base.slice();
    Object.keys(extra).forEach(function (s) { if (extra[s] && out.indexOf(s) === -1) out.push(s); });
    return out;
  }

  // ---------- Audit log ----------
  // Entry: { id, ts, personId, question, metricId, sources[], outcome:
  //          'answered'|'denied'|'nodata', returned:{label,rows}|null,
  //          deniedSources[], flagged, channel:'homepage'|'preview' }
  let LID = 0;
  function makeEntry(base) {
    LID += 1;
    return Object.assign({ id: 'log_' + Date.now().toString(36) + '_' + LID, flagged: false, channel: 'homepage' }, base);
  }

  function seedLog() {
    // Deterministic RNG so the log is stable across reloads.
    let s = 0x51ed2701;
    const rnd = function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pick = function (arr) { return arr[Math.floor(rnd() * arr.length)]; };

    const grants = seedGrants();
    const people = coveredPeople(grants).map(function (c) { return c.person; });
    // Weight: chiefs and captains ask the most.
    const weighted = [];
    people.forEach(function (p) {
      const w = p.titleId === 'battalion_chief' ? 5 : p.titleId === 'captain' ? 4 : 2;
      for (let i = 0; i < w; i++) weighted.push(p);
    });

    // Timestamps: spread over the last 10 days, denser recently. TODAY = May 7 2026.
    const DAY = 86400000;
    const now = new Date('2026-05-07T14:20:00').getTime();
    const N = 74;
    const out = [];
    for (let i = 0; i < N; i++) {
      const person = pick(weighted);
      const ent = personEntitlements(person, null);

      let entry;
      const roll = rnd();
      if (roll < 0.045) {
        // no-data ask
        entry = { question: pick(NODATA_QUESTIONS), metricId: null, sources: [], outcome: 'nodata', returned: null, deniedSources: [] };
      } else {
        // Battalion chiefs gravitate to scheduling questions. They hold every
        // source, so these resolve as answered — the log's denials come from the
        // roles that are genuinely short a source app (Training Officer: no
        // Compliance & Inspections, no Scheduling; Engineer, Firefighter, etc.).
        let qd;
        if (person.titleId === 'battalion_chief' && rnd() < 0.3) {
          qd = pick(QUESTIONS.filter(function (x) { return (CP().metricSources(x.metricId) || []).indexOf('sched') !== -1; }));
        } else {
          qd = pick(QUESTIONS);
        }
        const sources = CP().metricSources(qd.metricId);
        const lacking = sources.filter(function (src) { return ent.indexOf(src) === -1; });
        if (lacking.length) {
          entry = { question: pick(qd.q), metricId: qd.metricId, sources: sources, outcome: 'denied', returned: null, deniedSources: lacking };
        } else {
          entry = { question: pick(qd.q), metricId: qd.metricId, sources: sources, outcome: 'answered', returned: qd.ret, deniedSources: [] };
        }
      }

      // Recency bias: sqrt pushes mass toward "now".
      const back = Math.pow(rnd(), 1.7) * 10 * DAY;
      const ts = new Date(now - back);
      // keep asks inside plausible hours (06:00–22:00; earlier than "now" today)
      const sameDay = new Date(now).toDateString() === ts.toDateString();
      ts.setHours(6 + Math.floor(rnd() * (sameDay ? 8 : 16)), Math.floor(rnd() * 60), 0, 0);
      entry.ts = ts.toISOString();
      entry.personId = person.id;
      out.push(makeEntry(entry));
    }
    out.sort(function (a, b) { return a.ts < b.ts ? 1 : -1; });
    // Pre-flag a couple of denied entries so the Flagged filter isn't empty.
    let flagged = 0;
    out.forEach(function (e) { if (e.outcome === 'denied' && flagged < 2) { e.flagged = true; flagged++; } });
    return out;
  }

  // ---------- Homepage answer engine ----------
  // Text-only. Checks the asker's entitlements before answering; a denial is
  // the guardrail the audit log records.
  function matchQuestion(q) {
    const t = String(q || '').toLowerCase();
    const has = function (re) { return re.test(t); };
    if (has(/hydrant|water flow|fuel|budget|dollar|spend|weather|social media/)) return { kind: 'nodata' };
    if (has(/\b(joke|poem|sing|who are you|your name|hello|hi there|hey agency)\b/)) return { kind: 'cant' };
    if (has(/credential|cert|expir|renew/) && !has(/inspection/)) return { kind: 'metric', metricId: 'credential_expirations' };
    if (has(/overtime|\bot\b/)) return { kind: 'metric', metricId: 'ot_trend' };
    if (has(/open shift|understaff|coverage|vacan|shifts/)) return { kind: 'metric', metricId: 'open_shifts' };
    if (has(/pto|time off/)) return { kind: 'metric', metricId: 'pto_pending' };
    if (has(/sick/)) return { kind: 'metric', metricId: 'sick_leave' };
    if (has(/trade/)) return { kind: 'metric', metricId: 'trade_requests' };
    if (has(/downtime|apparatus|rig|engine|out of service|fleet/)) return { kind: 'metric', metricId: 'apparatus_downtime' };
    if (has(/equipment|scba|failure/)) return { kind: 'metric', metricId: 'equipment_failures' };
    if (has(/inspection|overdue/)) return { kind: 'metric', metricId: 'overdue_inspections' };
    if (has(/response time/)) return { kind: 'metric', metricId: 'response_time' };
    if (has(/incident|call volume|calls/)) return { kind: 'metric', metricId: 'incident_volume' };
    if (has(/policy|acknowledg|sog/)) return { kind: 'metric', metricId: 'policy_acks' };
    if (has(/ceu/)) return { kind: 'metric', metricId: 'ceu_progress' };
    if (has(/training|complet|compliance/)) return { kind: 'metric', metricId: 'training_completion' };
    if (has(/across|all apps|open work|everything/)) return { kind: 'metric', metricId: 'tasks_by_app' };
    return { kind: 'unknown' };
  }

  // Returns { text, entry } — entry is the audit-log record to append (null
  // for small talk, which isn't a data access).
  function homepageRespond(question, person, overrides) {
    const now = new Date('2026-05-07T14:20:00');
    // keep prototype timestamps in-world but ordered after the seed
    now.setMinutes(now.getMinutes() + Math.floor(Math.random() * 4) + 1);
    const m = matchQuestion(question);
    const base = { ts: now.toISOString(), personId: person.id, question: question, channel: 'preview' };

    if (m.kind === 'cant') {
      return { text: 'I’m Agency Intelligence — I answer questions from your department’s connected Vector apps, so I can’t help with that. Try training, credentials, scheduling, or apparatus.', entry: null };
    }
    if (m.kind === 'nodata') {
      return {
        text: 'I understood the question, but none of your connected apps carry that data yet. Your admin can connect a source for it.',
        entry: makeEntry(Object.assign(base, { metricId: null, sources: [], outcome: 'nodata', returned: null, deniedSources: [] })),
      };
    }
    if (m.kind === 'unknown') {
      return { text: 'I didn’t catch which data you’re after. Try something like “show open shifts next week” or “whose certs expire soon?”', entry: null };
    }
    const sources = CP().metricSources(m.metricId);
    const ent = personEntitlements(person, overrides);
    const lacking = sources.filter(function (s) { return ent.indexOf(s) === -1; });
    if (lacking.length) {
      const names = lacking.map(function (s) { return (K.SOURCES[s] || {}).name || s; }).join(', ');
      return {
        text: 'That comes from **' + names + '**, which your account doesn’t have access to — so I can’t answer it. Your administrator can grant access if this should be part of your view.',
        denied: true,
        entry: makeEntry(Object.assign(base, { metricId: m.metricId, sources: sources, outcome: 'denied', returned: null, deniedSources: lacking })),
      };
    }
    const qd = QUESTIONS.find(function (x) { return x.metricId === m.metricId; });
    return {
      text: ANSWERS[m.metricId] || 'Here’s what I found.',
      entry: makeEntry(Object.assign(base, { metricId: m.metricId, sources: sources, outcome: 'answered', returned: qd ? qd.ret : null, deniedSources: [] })),
    };
  }

  // ---------- Formatting ----------
  function fmtTs(iso) {
    const d = new Date(iso);
    const now = new Date('2026-05-07T14:20:00');
    const mins = Math.round((now - d) / 60000);
    let rel;
    if (mins < 1) rel = 'Just now';
    else if (mins < 60) rel = mins + 'm ago';
    else if (mins < 60 * 24 && d.getDate() === now.getDate()) rel = Math.round(mins / 60) + 'h ago';
    else {
      const days = Math.round((now.setHours(0,0,0,0) - new Date(d).setHours(0,0,0,0)) / 86400000);
      rel = days === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return { rel: rel, time: time, full: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + time };
  }

  window.AGENCY_INTEL_AI = {
    QUESTIONS: QUESTIONS,
    ANSWERS: ANSWERS,
    seedGrants: seedGrants,
    seedLog: seedLog,
    coveredPeople: coveredPeople,
    grantReach: grantReach,
    personEntitlements: personEntitlements,
    titleEntitlements: titleEntitlements,
    homepageRespond: homepageRespond,
    makeEntry: makeEntry,
    fmtTs: fmtTs,
  };
})();
