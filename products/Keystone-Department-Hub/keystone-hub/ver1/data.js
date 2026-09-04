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
  // `badge` is the department ID number. It exists because names do not
  // identify a person: this department has three Smiths and two Brennans in
  // the seed data alone, and the generated DIRECTORY below has more of both.
  // Every surface that has to tell two same-named people apart shows the badge.
  const PEOPLE = [
    { id: 'u1',  first: 'Jamie',    last: 'Smith',     rank: 'Battalion Chief',  station: 'st1',  shift: 'A', badge: '01042' },
    { id: 'u2',  first: 'Devon',    last: 'Hartwell',  rank: 'Captain',          station: 'st4',  shift: 'A', badge: '02184' },
    { id: 'u3',  first: 'Sloane',   last: 'Kim',       rank: 'Lieutenant',       station: 'st4',  shift: 'B', badge: '03357' },
    { id: 'u4',  first: 'Jamal',    last: 'Okafor',    rank: 'Engineer',         station: 'st4',  shift: 'A', badge: '04120' },
    { id: 'u5',  first: 'Riley',    last: 'Brennan',   rank: 'Firefighter/EMT',  station: 'st4',  shift: 'A', badge: '04871' },
    { id: 'u6',  first: 'Priya',    last: 'Shah',      rank: 'Firefighter',      station: 'st7',  shift: 'C', badge: '05233' },
    { id: 'u7',  first: 'Owen',     last: 'Maguire',   rank: 'Lieutenant',       station: 'st7',  shift: 'A', badge: '06018' },
    { id: 'u8',  first: 'Alex',     last: 'Tanaka',    rank: 'Paramedic',        station: 'st9',  shift: 'B', badge: '06744' },
    { id: 'u9',  first: 'Marisol',  last: 'Vega',      rank: 'Firefighter',      station: 'st9',  shift: 'A', badge: '07391' },
    { id: 'u10', first: 'Kai',      last: 'Brennan',   rank: 'Captain',          station: 'st12', shift: 'B', badge: '08290' },
    { id: 'u11', first: 'Theo',     last: 'Iverson',   rank: 'Firefighter/EMT',  station: 'st12', shift: 'C', badge: '09115' },
    { id: 'u12', first: 'Naima',    last: 'Whitfield', rank: 'Training Officer', station: 'st1',  shift: '—', badge: '09802' },
    { id: 'u13', first: 'Eli',      last: 'Rosenfeld', rank: 'Firefighter',      station: 'st14', shift: 'A', badge: '10466' },
    { id: 'u14', first: 'Cassidy',  last: 'Park',      rank: 'Lieutenant',       station: 'st14', shift: 'B', badge: '11238' },
  ];

  /* ---------- Department directory ---------------------------------------
     PEOPLE above is the cast that holds tasks in this prototype — 14 of them.
     A real department the Hub has to serve is two to three orders of magnitude
     larger, and that is the entire design problem for any "filter to a person"
     control: a checkbox list is unusable at that size, and a NAME IS NOT AN
     IDENTIFIER. DIRECTORY is that department.

     It supersets PEOPLE (the 14 carry through verbatim, badges and all) and
     generates the remainder deterministically — no Math.random() anywhere, so
     every reviewer who opens the prototype sees the same 2,431 people, the same
     badge numbers, and the same search results. (Same house rule as
     agency-intel-roster.js, for the same reason.)

     Three same-name collisions are PLANTED rather than left to chance, because
     they are precisely the case the design has to answer for:
       • two Stephen Smiths — different rank, station and shift; neither holds
         a task, so only the badge separates them
       • a second Riley Brennan — same rank AND same shift as the seed Riley
         Brennan, who holds a queue of tasks. This one holds none. The badge is
         the only thing that tells an admin which Riley they are looking at.
     Common surnames sit in the pool on purpose too, so searching "smith" or
     "brennan" returns the ~17 people it would in a real department rather than
     a conveniently tidy one or two.
     ---------------------------------------------------------------------- */

  // 90 first names x 140 surnames. The walk below is injective over this space
  // for any n < 12600, so no full name repeats by accident — every duplicate in
  // the directory is one of the three planted above.
  const DIR_FIRST = [
    'Aaron', 'Abigail', 'Adrian', 'Alana', 'Alberto', 'Alicia', 'Amara', 'Amos', 'Anders', 'Angela',
    'Anton', 'Ariana', 'Arjun', 'Ashley', 'Aurora', 'Barrett', 'Beatriz', 'Blake', 'Bridget', 'Caleb',
    'Camille', 'Carlos', 'Cecilia', 'Chandra', 'Clara', 'Cormac', 'Damian', 'Daniela', 'Darnell', 'David',
    'Delia', 'Desmond', 'Dominic', 'Edith', 'Eduardo', 'Elias', 'Ellery', 'Emmett', 'Erika', 'Ezra',
    'Fatima', 'Fernando', 'Fiona', 'Franklin', 'Gabriela', 'Gerald', 'Gloria', 'Grant', 'Hannah', 'Harold',
    'Heidi', 'Hector', 'Ines', 'Isaac', 'Ivan', 'Jacinta', 'Janelle', 'Javier', 'Jerome', 'Josefina',
    'Julian', 'Karina', 'Keegan', 'Lorena', 'Lucas', 'Madeline', 'Malik', 'Manuel', 'Margot', 'Mateo',
    'Meredith', 'Miriam', 'Nadia', 'Nathaniel', 'Noelle', 'Omar', 'Patrice', 'Rafael', 'Regina', 'Rosalind',
    'Rowan', 'Salvador', 'Simone', 'Stephen', 'Sylvia', 'Terrence', 'Valeria', 'Victor', 'Wanda', 'Yolanda'
  ];
  const DIR_LAST = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
    'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
    'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
    'Watson', 'Brooks', 'Chavez', 'Wood', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price',
    'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez', 'Powell',
    'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes', 'Fisher',
    'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham', 'Reynolds', 'Griffin',
    'Brennan', 'Maguire', 'Okafor', 'Tanaka', 'Hartwell', 'Rosenfeld', 'Whitfield', 'Iverson', 'Vega', 'Shah',
    'Okonkwo', 'Delacroix', 'Vandenberg', 'Kowalski', 'Nakamura', 'Fitzgerald', 'Abernathy', 'Castellanos', 'Thornbury', 'Beaumont'
  ];

  const DIR_GENERATED = 2417;                 // + the 14 seeds = 2,431 people

  // Rank is drawn from a bijective scatter of 0..2416, which makes the head
  // count per rank EXACT (6 battalion chiefs, 40 captains, 94 lieutenants, …)
  // instead of approximately-right. 2417 is prime and 17 is not a factor of it,
  // so (n * 17) % 2417 visits every value once — and, being coprime with the
  // 6-station and 3-shift cycles, rank never correlates with either.
  function dirRank(n) {
    const m = (n * 17) % DIR_GENERATED;
    if (m < 6)    return 'Battalion Chief';
    if (m < 46)   return 'Captain';
    if (m < 140)  return 'Lieutenant';
    if (m < 160)  return 'Training Officer';
    if (m < 300)  return 'Engineer';
    if (m < 560)  return 'Paramedic';
    if (m < 1200) return 'Firefighter/EMT';
    return 'Firefighter';
  }

  function buildDirectory() {
    const stationIds = STATIONS.map((s) => s.id);
    // Seeds first: same objects PEOPLE exposes, so a badge or a rank edited
    // above shows up in the directory too and the two can never disagree.
    const out = PEOPLE.map((p) => Object.assign({}, p));

    for (let n = 0; n < DIR_GENERATED; n++) {
      const a = n % DIR_LAST.length;                 // surname slot
      const b = Math.floor(n / DIR_LAST.length);     // 0..17 over this range
      const rank = dirRank(n);
      out.push({
        id: 'd' + n,
        first: DIR_FIRST[(b * 5 + a * 13) % DIR_FIRST.length],
        last: DIR_LAST[a],
        rank: rank,
        station: stationIds[n % stationIds.length],
        // Shift advances on a different cycle than station, or every house ends
        // up staffed by exactly one shift. Training officers aren't on a rota.
        shift: rank === 'Training Officer' ? '—' : ['A', 'B', 'C'][Math.floor(n / stationIds.length) % 3],
        badge: String(12000 + n * 7)                 // all above the seeds' 11238
      });
    }

    // The planted collisions. Overwriting names at a generated index (rather
    // than appending new people) keeps every badge unique for free.
    const plant = (n, first, last) => {
      const row = out[PEOPLE.length + n];
      row.first = first;
      row.last = last;
    };
    plant(427, 'Stephen', 'Smith');    // Captain · Station 4 · C-shift · #14989
    plant(1685, 'Stephen', 'Smith');   // Firefighter · Station 14 · B-shift · #23795
    plant(903, 'Riley', 'Brennan');    // Firefighter/EMT · Station 9 · A-shift · #18321

    return out;
  }

  const DIRECTORY = buildDirectory();

  /* Search the directory. Returns { total, rows } — the FULL match count plus
     the ranked matches, so a caller that caps its list can still say "8 of 47"
     honestly. Ranking order, best first:
        0  exact badge         1  exact full name      2  surname prefix
        3  first-name prefix   4  badge substring      5  name substring
        6  matched on rank / station / shift only
     Within a tier, anyone in `boost` (in practice: people who actually hold
     tasks) sorts first — an admin hunting "Stephen Smith" almost always wants
     the Stephen Smith with work outstanding, not the one with an empty queue. */
  function searchDirectory(query, opts) {
    const o = opts || {};
    const boost = o.boost || [];
    const q = String(query || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!q) return { total: 0, rows: [] };

    const tokens = q.split(' ');
    const qDigits = q.replace(/\D/g, '');
    const scored = [];

    for (let i = 0; i < DIRECTORY.length; i++) {
      const p = DIRECTORY[i];
      const st = STATIONS.find((s) => s.id === p.station) || { name: '', label: '' };
      const first = p.first.toLowerCase();
      const last = p.last.toLowerCase();
      const full = first + ' ' + last;
      const badge = p.badge;
      // "Brennan, Riley" is how a roster prints a name, so accept it as typed.
      const hay = full + ' ' + last + ', ' + first + ' ' + badge + ' ' +
        String(Number(badge)) + ' ' + p.rank.toLowerCase() + ' ' +
        st.name.toLowerCase() + ' ' + st.label.toLowerCase() + ' ' + p.shift.toLowerCase();

      // Every token must land somewhere, so "stephen smith" narrows instead of
      // widening the way an OR would.
      let all = true;
      for (let t = 0; t < tokens.length; t++) {
        if (hay.indexOf(tokens[t]) === -1) { all = false; break; }
      }
      if (!all) continue;

      let tier;
      if (qDigits && (badge === qDigits || String(Number(badge)) === String(Number(qDigits)))) tier = 0;
      else if (full === q || (last + ', ' + first) === q) tier = 1;
      else if (last.indexOf(tokens[0]) === 0) tier = 2;
      else if (first.indexOf(tokens[0]) === 0) tier = 3;
      else if (qDigits && badge.indexOf(qDigits) !== -1) tier = 4;
      else if (full.indexOf(q) !== -1 || full.indexOf(tokens[0]) !== -1) tier = 5;
      else tier = 6;

      scored.push({ p: p, tier: tier, hot: boost.indexOf(p.id) !== -1 ? 0 : 1 });
    }

    /* Same-name people must travel TOGETHER, or the control quietly fails at
       the exact case it exists for. Ranked purely on merit, a search for
       "brennan" put the Riley Brennan holding eight tasks at the top and left
       the OTHER Riley Brennan twelve rows down, past the visible cut — so an
       admin would pick one and never learn there were two. Every member of a
       same-name group therefore sorts at the position of its best-ranked
       member, which lands them adjacent. */
    const best = {};
    const key = (x) => (x.p.first + ' ' + x.p.last).toLowerCase();
    scored.forEach((x) => {
      const k = key(x);
      const cur = best[k];
      if (!cur || x.tier < cur.tier || (x.tier === cur.tier && x.hot < cur.hot)) {
        best[k] = { tier: x.tier, hot: x.hot };
      }
    });

    scored.sort((x, y) => {
      const gx = best[key(x)];
      const gy = best[key(y)];
      return gx.tier - gy.tier ||
        gx.hot - gy.hot ||
        x.p.last.localeCompare(y.p.last) ||
        x.p.first.localeCompare(y.p.first) ||
        // Inside one same-name group: whoever holds work leads, then by badge
        // so the order never wobbles between renders.
        x.hot - y.hot ||
        String(x.p.badge).localeCompare(String(y.p.badge));
    });

    // How many matches share each full name, so a row can warn that its name
    // alone does not identify anyone. Only genuine collisions are reported.
    const dupes = {};
    scored.forEach((x) => { const k = key(x); dupes[k] = (dupes[k] || 0) + 1; });
    Object.keys(dupes).forEach((k) => { if (dupes[k] < 2) delete dupes[k]; });

    return { total: scored.length, rows: scored.map((x) => x.p), dupes };
  }

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
    NOW, SOURCES, STATIONS, PEOPLE, DIRECTORY, TASK_TYPES, TASKS, SAVED_VIEWS, ROLES,
    helpers: { priorityScore, priorityBand, statusOf, timeWeight, hours, days,
               // personById covers the 14 task-holders; anyone the person filter
               // can reach lives in the directory, so fall through to it.
               personById: (id) => PEOPLE.find(p => p.id === id) || DIRECTORY.find(p => p.id === id),
               directoryById: (id) => DIRECTORY.find(p => p.id === id),
               searchDirectory,
               stationById: (id) => STATIONS.find(s => s.id === id),
               sourceById: (id) => SOURCES[id],
               typeById: (id) => TASK_TYPES[id],
             }
  };
})();
