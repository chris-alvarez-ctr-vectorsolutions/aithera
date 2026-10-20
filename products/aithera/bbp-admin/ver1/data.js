/* ============================================================================
   data.js — one dataset for every admin page (overview, courses, course report,
   learners, learner record, settings, assign, preview), so the numbers agree
   everywhere. All figures are representative prototype data.

   The prototype is sector-generic: everything a page shows (org name, how the
   org is layered, which roles exist, which version of Bloodborne Pathogens
   people receive) comes from SECTORS[sector]. Manufacturing is the default.
   A real admin only ever sees their own sector; the DEMO bar at the top of
   every page flips sectors so a reviewer can see role-based versions of the
   same course side by side.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     Sectors. `tree` is the org, any depth; `levels` names each depth in the
     customer's own words (a plant has Plants and Teams; an agency has
     Divisions and Units). Leaves carry headcount `n`.
     ---------------------------------------------------------------------- */
  var SECTORS = {
    mfg: {
      key: 'mfg', label: 'Manufacturing', short: 'Manufacturing',
      org: 'Acme Manufacturing', learnerWord: 'employees',
      levels: ['Company', 'Plant', 'Team'],
      tree: { id: 'acme', name: 'Acme Manufacturing', kids: [
        { id: 'dayton', name: 'Dayton Plant', kids: [
          { id: 'dayA', name: 'Line A', n: 24 }, { id: 'dayB', name: 'Line B', n: 22 },
          { id: 'dayM', name: 'Maintenance', n: 14 }, { id: 'dayS', name: 'Shipping', n: 12 } ] },
        { id: 'tulsa', name: 'Tulsa Plant', kids: [
          { id: 'tul1', name: 'Line 1', n: 30 }, { id: 'tul2', name: 'Line 2', n: 26 } ] }
      ] },
      roles: ['Line lead', 'Operator', 'Maintenance tech', 'Sanitation', 'Shipping clerk'],
      versionNote: 'Written for the plant floor: box-cutter blades, plant-clinic waste, end-of-shift changeover.',
      // Org-level settings, as assigned. Everything else inherits.
      seed: { acme: { on: { skip: true, harder: true, extra: true, followup: true }, lock: { extra: true } },
              tulsa: { on: { skip: false } } },
      roster: [
        ['Rob Keller',     'Line lead',        'dayA', [3,2,3,2,2], 'extra', 'demo',       'Oct 16', 24],
        ['Dana Whitfield', 'Line lead',        'dayB', [3,3,3,3,3], 'short', 'demo',       'Oct 15', 17],
        ['Marcus Osei',    'Operator',         'dayA', [2,2,2,2,2], 'extra', 'demo',       'Oct 15', 28],
        ['Priya Raman',    'Maintenance tech', 'dayM', [3,2,3,3,2], 'std',   'demo',       'Oct 14', 26],
        ['Tom Gallagher',  'Sanitation',       'tul1', [2,1,2,1,1], 'extra', 'followup',   'Oct 14', 31],
        ['Elena Vasquez',  'Operator',         'tul2', [2,2,2,2,2], 'std',   'demo',       'Oct 13', 29],
        ['Jae-won Park',   'Maintenance tech', 'dayM', [3,3,3,2,3], 'up',    'demo',       'Oct 12', 19],
        ['Sandra Iwu',     'Sanitation',       'tul1', [2,2,1,1,1], 'extra', 'followup',   'Oct 12', 30],
        ['Grace Okafor',   'Line lead',        'tul2', [3,3,3,2,3], 'std',   'demo',       'Oct 10', 25],
        ['Miguel Santos',  'Shipping clerk',   'dayS', null,        null,    'progress',   null,     null],
        ['Lena Kovacs',    'Operator',         'dayB', [3,2,2,2,2], 'short', 'demo',       'Oct 9',  18],
        ['Alex Romero',    'Shipping clerk',   'dayS', null,        null,    'notstarted', null,     null]
      ],
      // What the same three lessons look like on this job.
      scenes: {
        l1: 'You change a box-cutter blade at the line and set the old one on the bench. You mean to walk it to the container after this run.',
        l2: 'The sharps container in the plant clinic is three fingers above its fill line, and the spare box is in the supply room.',
        l3: 'You find contaminated glass from the clinic bagged into general waste at the dock. Later, a sanitation worker compresses that bag by hand.',
        practice: 'A coworker on second shift says, “Just toss the blade in the bin. Nobody checks.” Respond out loud, in your own words.'
      },
      evidence: {
        k1: 'Named all four steps in order; the used blade went straight to the container.',
        k2: 'Flagged the full container and the blade left on the bench without a prompt.',
        f1: 'Agreed that safe disposal protects the person who empties the bin.',
        f3: 'Moved from “most people set it down” to “most people walk it over.”',
        d2: '“I’m walking this to the container now. Give me ten seconds.”',
        d2gap: 'Agreed with the shortcut in the live practice and did not recover it.'
      }
    },

    le: {
      key: 'le', label: 'Law enforcement', short: 'Law enforcement',
      org: 'Riverside County Sheriff’s Office', learnerWord: 'staff',
      levels: ['Agency', 'Division', 'Unit'],
      tree: { id: 'rcso', name: 'Riverside County Sheriff’s Office', kids: [
        { id: 'patrol', name: 'Patrol Division', kids: [
          { id: 'north', name: 'North Precinct', n: 26 }, { id: 'south', name: 'South Precinct', n: 26 } ] },
        { id: 'corr', name: 'Corrections Division', kids: [
          { id: 'intake', name: 'Intake', n: 22 }, { id: 'housing', name: 'Housing', n: 22 } ] }
      ] },
      roles: ['Patrol officer', 'Corrections officer', 'Sergeant', 'Evidence technician'],
      versionNote: 'Written for booking and property work: recovered needles, the intake counter, the station processing area.',
      seed: { rcso: { on: { skip: true, harder: true, extra: true, followup: true }, lock: { extra: true } },
              corr: { on: { skip: false } } },
      roster: [
        ['Dana Reyes',     'Patrol officer',      'north',   [3,2,3,2,2], 'extra', 'demo',       'Oct 16', 24],
        ['Marcus Bell',    'Sergeant',            'south',   [3,3,3,3,3], 'short', 'demo',       'Oct 15', 17],
        ['Priya Nair',     'Evidence technician', 'north',   [2,2,2,2,2], 'extra', 'demo',       'Oct 15', 28],
        ['Tom Hargrove',   'Patrol officer',      'south',   [3,2,3,3,2], 'std',   'demo',       'Oct 14', 26],
        ['Elena Ruiz',     'Corrections officer', 'intake',  [2,1,2,1,1], 'extra', 'followup',   'Oct 14', 31],
        ['Jae Kim',        'Corrections officer', 'housing', [2,2,2,2,2], 'std',   'demo',       'Oct 13', 29],
        ['Grace Dunn',     'Sergeant',            'intake',  [3,3,3,2,3], 'up',    'demo',       'Oct 12', 19],
        ['Sam Oduya',      'Corrections officer', 'housing', [2,2,1,1,1], 'extra', 'followup',   'Oct 12', 30],
        ['Lena Park',      'Patrol officer',      'north',   [3,2,2,2,2], 'short', 'demo',       'Oct 10', 18],
        ['Miguel Ortega',  'Evidence technician', 'south',   null,        null,    'progress',   null,     null],
        ['Rob Alvarez',    'Corrections officer', 'intake',  [3,3,2,2,3], 'std',   'demo',       'Oct 9',  25],
        ['Alex Romero',    'Patrol officer',      'south',   null,        null,    'notstarted', null,     null]
      ],
      scenes: {
        l1: 'You’ve just recovered a used needle from a subject’s property at the booking counter. The sharps container is across the intake area and the needle is still in your gloved hand.',
        l2: 'You’re carrying a recovered needle to the container in the station’s processing area. As you approach, you see it has reached its fill line.',
        l3: 'An officer drops a used needle into the station trash “just this once.” Later, a custodian collecting the bag is stuck through it.',
        practice: 'A fellow officer, mid-intake, says, “Just drop it in the trash. We’ll deal with it later.” Respond out loud, in your own words.'
      },
      evidence: {
        k1: 'Named all four steps in order; the needle went straight to the container.',
        k2: 'Flagged the full container and the needle left on the counter without a prompt.',
        f1: 'Agreed that safe disposal protects the custodian who collects the bag.',
        f3: 'Moved from “most officers set it down” to “most officers walk it over.”',
        d2: '“I’m walking this to the container now. Cover the counter for ten seconds.”',
        d2gap: 'Agreed with the shortcut in the live practice and did not recover it.'
      }
    }
  };

  /* ------------------------------------------------------------------------
     The four things Learning Engine can do, in an admin's words.
     ---------------------------------------------------------------------- */
  var BEHAVIORS = [
    { key: 'skip',     icon: 'fa-forward',            label: 'Let people skip what they already know',
      help: 'If someone answers the opening questions correctly, they skip that lesson. It still counts as covered on their record.' },
    { key: 'harder',   icon: 'fa-arrow-trend-up',     label: 'Give stronger learners harder questions',
      help: 'People who are clearly ahead get tougher scenarios instead of the standard ones.' },
    { key: 'extra',    icon: 'fa-wand-magic-sparkles', label: 'Add extra practice after a miss',
      help: 'Someone who misses a check gets a short, targeted round before moving on.' },
    { key: 'followup', icon: 'fa-calendar-check',     label: 'Check in again after 30 days',
      help: 'A five-minute follow-up to see whether the habit stuck.' }
  ];

  /* The five areas the report tracks (one dot each). */
  var AREAS = [
    { key: 'k1', name: 'Safe handling steps',   icon: 'fa-list-check' },
    { key: 'k2', name: 'Spotting hazards',      icon: 'fa-magnifying-glass' },
    { key: 'f1', name: 'Why it matters',        icon: 'fa-people-group' },
    { key: 'f3', name: 'What people really do', icon: 'fa-users' },
    { key: 'd2', name: 'Doing it right',        icon: 'fa-hand' }
  ];
  var BAND = {
    1: { label: 'Practice Needed', chip: 'band-warn', dot: 'dot-warn' },
    2: { label: 'Good',            chip: 'band-ok',   dot: 'dot-ok' },
    3: { label: 'Excellent',       chip: 'band-exc',  dot: 'dot-exc' }
  };

  /* ------------------------------------------------------------------------
     Persistence: sector, scope, and edited settings survive page changes.
     Every read/write is guarded; the prototype works with storage blocked.
     ---------------------------------------------------------------------- */
  function load(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var qs = new URLSearchParams(location.search);
  var sectorKey = qs.get('sector') || load('bbp.sector', 'mfg');
  if (!SECTORS[sectorKey]) sectorKey = 'mfg';
  if (qs.get('sector')) save('bbp.sector', sectorKey);
  var S = SECTORS[sectorKey];

  /* ------------------------------------------------------------------------
     Org tree helpers.
     ---------------------------------------------------------------------- */
  var INDEX = {};   // id -> { node, parent, depth }
  (function walk(node, parent, depth) {
    INDEX[node.id] = { node: node, parent: parent, depth: depth };
    (node.kids || []).forEach(function (k) { walk(k, node, depth + 1); });
  })(S.tree, null, 0);

  function node(id) { return INDEX[id] && INDEX[id].node; }
  function pathTo(id) {            // root … id
    var out = [], e = INDEX[id];
    while (e) { out.unshift(e.node); e = e.parent ? INDEX[e.parent.id] : null; }
    return out;
  }
  function leaves(id) {
    var n = node(id), out = [];
    (function go(x) { if (x.kids) x.kids.forEach(go); else out.push(x); })(n);
    return out;
  }
  function headcount(id) { return leaves(id).reduce(function (a, l) { return a + l.n; }, 0); }
  function levelName(id) { return S.levels[INDEX[id].depth] || ''; }

  /* ------------------------------------------------------------------------
     Settings inheritance. Most specific wins, unless a level above locked it.
     cfg = { <nodeId>: { on: {key: bool}, lock: {key: true} } }
     effective(id, cfg) -> { key: { value, from, lockedBy } }
     ---------------------------------------------------------------------- */
  function liveCfg() { return load('bbp.cfg.' + sectorKey, JSON.parse(JSON.stringify(S.seed))); }
  function saveCfg(c) { save('bbp.cfg.' + sectorKey, c); }
  function resetCfg() { try { localStorage.removeItem('bbp.cfg.' + sectorKey); } catch (e) {} }

  function effective(id, cfg) {
    cfg = cfg || liveCfg();
    var chain = pathTo(id), out = {};
    BEHAVIORS.forEach(function (b) {
      var value = true, from = chain[0], lockedBy = null;
      chain.forEach(function (n) {
        var c = cfg[n.id] || {};
        if (lockedBy) return;                              // a level above locked it
        if (c.on && c.on[b.key] != null) { value = c.on[b.key]; from = n; }
        if (c.lock && c.lock[b.key]) lockedBy = n;
      });
      out[b.key] = { value: value, from: from, lockedBy: lockedBy };
    });
    return out;
  }

  /* ------------------------------------------------------------------------
     Report figures. Derived leaf by leaf from the settings AS ASSIGNED (the
     seed), never the live edits — changing a setting today must not rewrite
     last month's results.
     ---------------------------------------------------------------------- */
  function stats(scopeId) {
    var t = { assigned: 0, completed: 0, demonstrated: 0, skipped: 0, extra: 0, harder: 0, followup: 0 };
    leaves(scopeId).forEach(function (l) {
      var eff = effective(l.id, S.seed), n = l.n, done = Math.round(n * 0.94);
      t.assigned += n;
      t.completed += done;
      t.demonstrated += Math.round(n * 0.71);
      t.skipped += eff.skip.value ? Math.round(done * 0.16) : 0;
      t.extra += eff.extra.value ? Math.round(done * 0.30) : 0;
      t.harder += eff.harder.value ? Math.round(done * 0.12) : 0;
      t.followup += Math.round(done * 0.28);
    });
    t.adjusted = t.skipped + t.extra + t.harder;
    t.strong = Math.round(t.completed * 0.33);                    // representative share of finishers
    t.support = t.followup;                                       // one or more areas still open
    t.unfinished = t.assigned - t.completed;
    return t;
  }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }

  /* ------------------------------------------------------------------------
     Roster + the course's step list.
     ---------------------------------------------------------------------- */
  // Time is planned minutes for the route taken: as written, minus what was
  // skipped, plus what was added (harder checks and extra practice).
  function plannedMins(path) { return 33 - (path === 'short' ? 8 : 0) + (path === 'up' ? 2 : 0) + (path === 'extra' ? 2 : 0); }
  /* Time actually spent per step, against what's typical for the route taken.
     Deterministic per person, so the prototype is stable. People who were at
     Practice Needed on an area spend longer on the step that teaches it, and a
     missed live practice takes longer than usual. */
  var AREA_STEP = { k1: 'l1', k2: 'l2', f1: 'l3', f3: 'l3', d2: 'practice' };
  function hash(str) { var h = 0; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 997; return h; }
  function dwell(l) {
    var path = l.path, typical = {}, actual = {};
    typical.open = 3;
    if (path !== 'short') typical.l1 = 8;
    typical.l2 = 7 + (path === 'up' ? 2 : 0);
    typical.l3 = 5; typical.practice = 7;
    if (path === 'extra') typical.extra = 2;
    typical.close = 3;
    var jitter = ((hash(l.name) % 25) - 12) / 100;                 // -12% .. +12%
    Object.keys(typical).forEach(function (id) {
      var f = 1 + jitter;
      B_AREAS.forEach(function (a, i) { if (l.profile && l.profile[i] === 1 && AREA_STEP[a.key] === id) f *= 1.45; });
      if (path === 'extra' && id === 'practice') f *= 1.3;
      actual[id] = Math.max(1, Math.round(typical[id] * f));
    });
    return { typical: typical, actual: actual };
  }
  var B_AREAS = AREAS;
  var LEARNERS = S.roster.map(function (r) {
    var l = { name: r[0], role: r[1], unit: r[2], profile: r[3], path: r[4], status: r[5], completed: r[6] };
    if (r[4]) {
      l.dwell = dwell(l);
      l.mins = Object.keys(l.dwell.actual).reduce(function (a, k) { return a + l.dwell.actual[k]; }, 0);
      l.typicalMins = plannedMins(r[4]);
    }
    return l;
  });
  /* Where a whole group slows down (representative): median minutes per step
     against typical, and the share who took 50% longer. */
  var GROUP_DWELL = { open: [3, 3, 4], l1: [8, 8, 6], l2: [7, 8, 11], l3: [5, 5, 5], practice: [7, 10, 21], close: [3, 3, 3] };
  function inScope(l, scopeId) { return leaves(scopeId).some(function (x) { return x.id === l.unit; }); }

  /* The steps of Bloodborne Pathogens, as an admin would describe them. */
  function steps() {
    return {
      open:  { title: 'Opening questions',            what: 'Four quick questions tell the course what this person already knows.' },
      l1:    { title: 'Lesson 1 · Put it away right away', what: 'The correct handling steps, in a realistic moment.', scene: S.scenes.l1 },
      l2:    { title: 'Lesson 2 · Spot the hazard',   what: 'Recognizing a full container or a sharp left in the wrong place.', scene: S.scenes.l2, required: true },
      l3:    { title: 'Lesson 3 · The shortcut that hurts someone else', what: 'A short story about who gets hurt when a sharp is left behind.', scene: S.scenes.l3 },
      practice: { title: 'Practice · Say it out loud', what: 'A live conversation with an AI coworker who pushes back.', scene: S.scenes.practice, required: true },
      extra: { title: 'Extra practice',               what: 'A short, targeted round added after a miss.' },
      close: { title: 'Closing check',                what: 'The same questions again, to measure what changed.' },
      follow:{ title: '30-day check-in',              what: 'Five minutes, a month later, to see if it stuck.' }
    };
  }


  /* ------------------------------------------------------------------------
     The module as a route: ordered steps, each with the variants the engine
     can apply to it. The route graphic is drawn from this, so a module with a
     different shape only needs a different list.
       type: skip   = bypass the step          (key = a settings toggle)
             harder = same step, tougher checks
             insert = a step added after this one
     ---------------------------------------------------------------------- */
  var MODULE = {
    name: 'Bloodborne Pathogens', fullMins: 33,
    steps: [
      { id: 'open',     label: 'Opening questions', short: 'Opening', sub: 'Where they start',  icon: 'fa-clipboard-question', mins: 3 },
      { id: 'l1',       label: 'Handling steps',    short: 'Handling', sub: 'Lesson 1',    icon: 'fa-list-check',         mins: 8,
        variants: [{ key: 'skip', type: 'skip', label: 'Skipped ahead', name: 'Skip ahead', tag: 'Skipped', short: 'skipped', idle: 'Skippable', saves: 8 }] },
      { id: 'l2',       label: 'Spot the hazard',   short: 'Hazard', sub: 'Lesson 2',   icon: 'fa-magnifying-glass',   mins: 7, required: true,
        variants: [{ key: 'harder', type: 'harder', label: 'Harder checks', name: 'Harder checks', tag: 'Harder', short: 'harder', idle: 'Harder checks', adds: 2 }] },
      { id: 'l3',       label: 'The shortcut',      short: 'Shortcut', sub: 'Lesson 3',      icon: 'fa-people-arrows',      mins: 5 },
      { id: 'practice', label: 'Live practice',     short: 'Practice', sub: 'Say it out loud',   icon: 'fa-microphone',         mins: 7, required: true,
        variants: [{ key: 'extra', type: 'insert', label: 'Extra practice', name: 'Extra practice', tag: 'Extra', short: 'extra', idle: 'Extra practice', adds: 2 }] },
      { id: 'close',    label: 'Closing check',     short: 'Closing', sub: 'Same questions',    icon: 'fa-flag-checkered',     mins: 3 },
      { id: 'follow',   label: '30-day check-in',   short: '30-day', sub: 'Did it stick?',     icon: 'fa-calendar-check',     mins: 5, future: true, settingKey: 'followup' }
    ]
  };

  /* ------------------------------------------------------------------------
     Beyond this course. A role's requirements are a handful of courses; some
     objectives are shared, so proving one here counts toward the others.
     `in` lists the courses an objective belongs to; `proof` is the area of
     this module that proves it. REPRESENTATIVE: the real overlaps must be
     confirmed with the content team before anyone treats them as fact.
     ---------------------------------------------------------------------- */
  var CATALOGS = {
    mfg: {
      goal: 'requirements',
      courses: [
        { id: 'bbp', name: 'Bloodborne Pathogens',   color: '#0271ce', icon: 'fa-droplet' },
        { id: 'haz', name: 'Hazard Communication',   color: '#e0782e', icon: 'fa-triangle-exclamation' },
        { id: 'xtr', name: 'Lockout/Tagout',         color: '#6d28d9', icon: 'fa-bolt' },
        { id: 'har', name: 'Harassment Prevention',  color: '#0f8b8d', icon: 'fa-comments' }
      ],
      pool: [
        { id: 'p1', name: 'Safe handling steps',               in: ['bbp'],               proof: 'k1' },
        { id: 'p2', name: 'Why it matters',                    in: ['bbp'],               proof: 'f1' },
        { id: 's1', name: 'Spotting hazards on the floor',     in: ['bbp', 'haz'],        proof: 'k2' },
        { id: 's2', name: 'Speaking up in the moment',         in: ['bbp', 'xtr', 'har'], proof: 'd2' },
        { id: 's3', name: 'What your team really does',        in: ['bbp', 'har'],        proof: 'f3' },
        { id: 's4', name: 'Acting while the moment is open',   in: ['bbp', 'haz'],        proof: 'd2' },
        { id: 'h1', name: 'Read a safety data sheet',          in: ['haz'] },
        { id: 'h2', name: 'Decode a chemical label',           in: ['haz'] },
        { id: 'x1', name: 'Name the energy sources',           in: ['xtr'] },
        { id: 'x2', name: 'Apply a lock and tag',              in: ['xtr'] },
        { id: 'r1', name: 'Name the behavior',                 in: ['har'] },
        { id: 'r2', name: 'Know the reporting options',        in: ['har'] }
      ]
    },
    le: {
      goal: 'requirements',
      courses: [
        { id: 'bbp', name: 'Bloodborne Pathogens',   color: '#0271ce', icon: 'fa-droplet' },
        { id: 'haz', name: 'Hazard Communication',   color: '#e0782e', icon: 'fa-triangle-exclamation' },
        { id: 'xtr', name: 'Evidence Handling',      color: '#6d28d9', icon: 'fa-box-archive' },
        { id: 'har', name: 'Harassment Prevention',  color: '#0f8b8d', icon: 'fa-comments' }
      ],
      pool: [
        { id: 'p1', name: 'Safe handling steps',               in: ['bbp'],               proof: 'k1' },
        { id: 'p2', name: 'Why it matters',                    in: ['bbp'],               proof: 'f1' },
        { id: 's1', name: 'Spotting hazards at intake',        in: ['bbp', 'haz'],        proof: 'k2' },
        { id: 's2', name: 'Speaking up in the moment',         in: ['bbp', 'xtr', 'har'], proof: 'd2' },
        { id: 's3', name: 'What your unit really does',        in: ['bbp', 'har'],        proof: 'f3' },
        { id: 's4', name: 'Acting while the moment is open',   in: ['bbp', 'haz'],        proof: 'd2' },
        { id: 'h1', name: 'Read a safety data sheet',          in: ['haz'] },
        { id: 'h2', name: 'Decode a chemical label',           in: ['haz'] },
        { id: 'x1', name: 'Keep the chain of custody',         in: ['xtr'] },
        { id: 'x2', name: 'Seal and label an item',            in: ['xtr'] },
        { id: 'r1', name: 'Name the behavior',                 in: ['har'] },
        { id: 'r2', name: 'Know the reporting options',        in: ['har'] }
      ]
    }
  };
  var PROOF_RATE = { k1: 0.86, k2: 0.90, f1: 0.94, f3: 0.90, d2: 0.91 };   // share of completers who proved each area

  function catalog() { return CATALOGS[sectorKey]; }

  /* One learner's credit: which pool objectives they've proven (via this
     module's areas) and how that adds up per course and overall. */
  function credit(l) {
    var cat = catalog(), keys = AREAS.map(function (a) { return a.key; });
    function proven(o) { return o.proof && l.profile && l.profile[keys.indexOf(o.proof)] >= 2; }
    var courses = cat.courses.map(function (c) {
      var items = cat.pool.filter(function (o) { return o.in.indexOf(c.id) >= 0; })
        .map(function (o) { return { id: o.id, name: o.name, proof: o.proof, shared: o.in.length > 1, credited: !!proven(o) }; });
      return { id: c.id, name: c.name, color: c.color, icon: c.icon, items: items,
               done: items.filter(function (i) { return i.credited; }).length, total: items.length };
    });
    var all = cat.pool, done = all.filter(proven).length;
    return { courses: courses, overall: { done: done, total: all.length } };
  }
  /* A cohort's credit: how many people each shared objective already covers. */
  function creditCohort(scopeId) {
    var cat = catalog(), t = stats(scopeId), n = t.completed;
    var courses = cat.courses.map(function (c) {
      var items = cat.pool.filter(function (o) { return o.in.indexOf(c.id) >= 0; })
        .map(function (o) { return { id: o.id, name: o.name, proof: o.proof, shared: o.in.length > 1,
                                     people: o.proof ? Math.round(n * PROOF_RATE[o.proof]) : 0 }; });
      var cred = items.filter(function (i) { return i.people > 0; }).length;
      return { id: c.id, name: c.name, color: c.color, icon: c.icon, items: items, done: cred, total: items.length, completers: n };
    });
    return { courses: courses, completers: n };
  }

  /* Where someone stands, from what they can demonstrate at the end of the
     course. Deliberately NOT based on speed, route or number of tries: skipping
     ahead is how someone got there, and extra practice is the engine working,
     so neither should count for or against a person.
       strong  = nothing at Practice Needed, and Excellent in 3+ areas
       support = at least one area still at Practice Needed
       open    = hasn't finished */
  function standing(l) {
    if (!l.profile) return 'open';
    var open = l.profile.filter(function (b) { return b === 1; }).length;
    var exc = l.profile.filter(function (b) { return b === 3; }).length;
    return open ? 'support' : (exc >= 3 ? 'strong' : 'ontrack');
  }
  function standingReason(l) {
    var st = standing(l);
    if (st === 'strong') return 'Excellent in ' + l.profile.filter(function (b) { return b === 3; }).length + ' of 5 areas';
    if (st === 'support') {
      var names = AREAS.filter(function (a, i) { return l.profile[i] === 1; }).map(function (a) { return a.name; });
      var rushed = l.mins && l.typicalMins && l.mins <= l.typicalMins * 0.8 && names.length >= 2;
      return (rushed ? 'Finished fast with ' + names.length + ' areas open' : 'Still open: ' + names.slice(0, 2).join(', ') + (names.length > 2 ? ' +' + (names.length - 2) : ''));
    }
    if (st === 'open') return l.status === 'progress' ? 'Mid-course · no activity in 6 days' : 'Not started · due Nov 6';
    return 'On track';
  }

  /* Where the people who haven't finished are right now (representative): how many
     haven't started, and how many are sitting at each step. Sums to `unfinished`. */
  var NOW_WEIGHTS = [['start', .30], ['open', .06], ['l1', .10], ['l2', .14], ['l3', .08], ['practice', .32]];
  function whereNow(unfinished) {
    var out = {}, left = unfinished;
    NOW_WEIGHTS.forEach(function (w, i) {
      var n = i === NOW_WEIGHTS.length - 1 ? left : Math.round(unfinished * w[1]);
      out[w[0]] = n; left -= n;
    });
    return out;
  }

  window.BBP = {
    sector: S, sectorKey: sectorKey, SECTORS: SECTORS,
    BEHAVIORS: BEHAVIORS, AREAS: AREAS, BAND: BAND,
    node: node, pathTo: pathTo, leaves: leaves, headcount: headcount, levelName: levelName,
    liveCfg: liveCfg, saveCfg: saveCfg, resetCfg: resetCfg, effective: effective,
    stats: stats, pct: pct, whereNow: whereNow, standing: standing, standingReason: standingReason, GROUP_DWELL: GROUP_DWELL, MODULE: MODULE, catalog: catalog, credit: credit, creditCohort: creditCohort, PROOF_RATE: PROOF_RATE, LEARNERS: LEARNERS, inScope: inScope, steps: steps,
    load: load, save: save, setSector: function (k) { save('bbp.sector', k); }
  };
})();
