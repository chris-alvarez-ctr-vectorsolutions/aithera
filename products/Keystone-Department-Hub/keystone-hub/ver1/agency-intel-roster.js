/* global KEYSTONE, AGENCY_INTEL */
/* =====================================================================
   agency-intel-roster.js — the department roster, the audience rule
   engine, and the plain-language parser behind AI dynamic groups.

   Pure data + logic. No DOM, no rendering — agency-intel-audience.js
   owns all of that and talks to this module through the API at the
   bottom of the file.

   Three things live here:
     • ROSTER   — a 113-person department. The 14 people in K.PEOPLE are
                  seeds and carry through verbatim; the other 99 are
                  generated deterministically so the per-title totals
                  match AGENCY_INTEL.JOB_TITLES exactly.
     • evaluate — turn a rule (a flat AND of clauses) into matched people.
     • parse    — turn a sentence into clauses, merged into a standing
                  rule, with clarifying questions when a phrase is
                  genuinely ambiguous.

   Determinism matters: no Math.random() anywhere. Every reviewer who
   opens the prototype sees the same roster and the same counts.
   ===================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;
  var CP = window.AGENCY_INTEL;

  // NB: CP.APP_TODAY is a Date object, not an ISO string — concatenating it
  // with 'T00:00:00' yields an invalid date and NaN tenures.
  var TODAY_DATE = (CP.APP_TODAY instanceof Date)
    ? CP.APP_TODAY
    : new Date(String(CP.APP_TODAY || '2026-05-07') + 'T00:00:00');
  var TODAY_MS = TODAY_DATE.getTime();
  var TODAY_YEAR = TODAY_DATE.getFullYear();
  var TODAY_ISO = TODAY_DATE.getFullYear() + '-' +
    String(TODAY_DATE.getMonth() + 1).padStart(2, '0') + '-' +
    String(TODAY_DATE.getDate()).padStart(2, '0');

  /* =====================================================================
     ATTRIBUTE VOCABULARY
     Each entry declares how a person is described, which is also what
     the parser matches against and what the chips render. Keeping the
     labels here means the UI never hard-codes a value name.
     ===================================================================== */

  var GRADES_BY_TITLE = {
    battalion_chief:  ['BC-1'],
    captain:          ['CPT-1', 'CPT-2'],
    lieutenant:       ['LT-1', 'LT-2'],
    training_officer: ['TO-1'],
    fleet_manager:    ['FM-1'],
    engineer:         ['ENG-1', 'ENG-2'],
    paramedic:        ['FF-2', 'FF-3'],
    firefighter:      ['FF-1', 'FF-2', 'FF-3']
  };

  var CERTS = {
    paramedic:          'Paramedic',
    emt:                'EMT',
    hazmat:             'HazMat',
    evoc:               'EVOC',
    cpr:                'CPR',
    'technical-rescue': 'Technical Rescue',
    arff:               'ARFF'
  };

  var TYPES = { career: 'Career', volunteer: 'Volunteer', 'part-time': 'Part-time' };

  var ASSIGNMENTS = {
    suppression: 'Suppression', ems: 'EMS', prevention: 'Prevention',
    training: 'Training', fleet: 'Fleet', admin: 'Admin'
  };

  /* =====================================================================
     ROSTER GENERATION
     ===================================================================== */

  // Name pools — fixed lists, walked by index. Large enough that the 99
  // generated people don't visibly repeat a full name.
  var FIRST = ['Avery', 'Bennett', 'Camila', 'Darius', 'Elena', 'Ford', 'Greta', 'Hassan',
    'Imani', 'Jonah', 'Kendra', 'Luca', 'Mira', 'Nolan', 'Odette', 'Pablo', 'Quinn', 'Rosa',
    'Sasha', 'Tomas', 'Uma', 'Vince', 'Willa', 'Xavier', 'Yara', 'Zane', 'Adele', 'Bruno',
    'Colette', 'Dmitri', 'Esme', 'Felix', 'Gwen', 'Hugo', 'Isla', 'Jasper', 'Kira', 'Leo',
    'Maya', 'Nico', 'Oona', 'Pierce', 'Rhea', 'Silas', 'Tessa', 'Ulric', 'Vera', 'Wes',
    'Xenia', 'Yusuf'];
  var LAST = ['Alvarez', 'Boone', 'Castellanos', 'Delgado', 'Everly', 'Fairbanks', 'Gallagher',
    'Holloway', 'Ibarra', 'Jennings', 'Kowalski', 'Lindqvist', 'Moreau', 'Nakamura', 'Ortega',
    'Pemberton', 'Quintero', 'Rasmussen', 'Sandoval', 'Thornbury', 'Underwood', 'Valdez',
    'Whitaker', 'Yolen', 'Zamora', 'Ashford', 'Braddock', 'Crenshaw', 'Duvall', 'Ellington',
    'Fontaine', 'Granger', 'Hawthorne', 'Ingram', 'Jarvis'];

  var STATION_IDS = (K.STATIONS || []).map(function (s) { return s.id; });

  function stationMeta(id) {
    var s = (K.STATIONS || []).find(function (x) { return x.id === id; });
    return s || { id: id, name: id, battalion: '', label: '' };
  }

  // Certifications are deliberately NOT uniform: ARFF concentrates at the
  // Airport house and Technical Rescue at Industrial, so a query that
  // combines a location and a certification returns something interesting
  // rather than a flat slice.
  // IMPORTANT: people are dealt to stations with `n % 6`, so any modulus
  // sharing a factor with 6 (2, 3, 4, 6…) correlates with station and
  // produces degenerate data — e.g. "every ARFF holder is also the only
  // person at that house". Every modulus below is coprime with 6.
  function certsFor(titleId, stationId, i) {
    var out = ['cpr'];
    if (titleId === 'paramedic') out.push('paramedic', 'emt');
    else if (i % 5 === 0) out.push('emt');
    // Dual-role firefighter/paramedics are common in real departments — and
    // without them "paramedic-certified firefighters" matches nobody.
    if (titleId === 'firefighter' && i % 7 === 1) out.push('paramedic', 'emt');

    if (titleId === 'engineer' || titleId === 'fleet_manager' || i % 5 === 1) out.push('evoc');
    if (stationId === 'st14' && i % 5 < 3) out.push('arff');
    if (stationId === 'st9' && i % 5 < 3) out.push('technical-rescue');
    if (stationId === 'st7' || stationId === 'st9') { if (i % 7 !== 6) out.push('hazmat'); }
    else if (i % 7 === 0) out.push('hazmat');

    return out.filter(function (c, ix, a) { return a.indexOf(c) === ix; });
  }

  function assignmentFor(titleId, i) {
    if (titleId === 'training_officer') return 'training';
    if (titleId === 'fleet_manager') return 'fleet';
    if (titleId === 'paramedic') return 'ems';
    if (titleId === 'battalion_chief') return 'admin';
    if (i % 7 === 0) return 'prevention';
    if (i % 5 === 0) return 'ems';
    return 'suppression';
  }

  function typeFor(titleId, i) {
    if (titleId === 'battalion_chief' || titleId === 'captain') return 'career';
    if (i % 7 === 3) return 'volunteer';        // coprime with the 6-station cycle
    if (i % 11 === 5) return 'part-time';
    return 'career';
  }

  // Hire dates fan out from 1998 → 2026 so tenure questions ("new hires",
  // "hired before 2020", "20-year veterans") all have real answers.
  function hiredFor(titleId, i) {
    var seniority = { battalion_chief: 22, captain: 16, lieutenant: 12, training_officer: 14,
      fleet_manager: 15, engineer: 9, paramedic: 6, firefighter: 4 }[titleId] || 5;
    var yearsAgo = seniority + ((i * 5) % 11) - 5;         // ±5 years of spread
    if (yearsAgo < 0) yearsAgo = (i % 3) * 0.5;            // a few true rookies
    var month = ((i * 5) % 12) + 1;
    var day = ((i * 11) % 27) + 1;
    var year = TODAY_YEAR - Math.floor(yearsAgo);
    // Rookies must land *before* today, or tenure clamps to a meaningless 0.
    if (yearsAgo < 1) { year = TODAY_YEAR; month = Math.min(month, TODAY_DATE.getMonth() + 1); }
    return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  function tenureFrom(hired) {
    var ms = TODAY_MS - new Date(hired + 'T00:00:00').getTime();
    return Math.max(0, Math.round((ms / (365.25 * 24 * 3600 * 1000)) * 10) / 10);
  }

  function decorate(base, titleId, stationId, shift, i) {
    var st = stationMeta(stationId);
    var grades = GRADES_BY_TITLE[titleId] || ['FF-1'];
    var hired = base.hired || hiredFor(titleId, i);
    return {
      id: base.id,
      name: base.name,
      titleId: titleId,
      rank: base.rank || (CP.titleById(titleId) || {}).label || titleId,
      station: stationId,
      stationName: st.name,
      stationLabel: st.label,
      battalion: st.battalion,
      shift: shift,
      grade: grades[i % grades.length],
      hired: hired,
      tenureYrs: tenureFrom(hired),
      type: typeFor(titleId, i),
      assignment: assignmentFor(titleId, i),
      certs: certsFor(titleId, stationId, i),
      entitlements: (CP.titleById(titleId) || {}).entitlements || []
    };
  }

  // Build the department: seeds first (they count against the title
  // totals), then generate only the shortfall per title.
  function buildRoster() {
    var out = [];
    var used = {};
    var seeds = CP.INDIVIDUALS || [];

    seeds.forEach(function (p, i) {
      var person = (K.PEOPLE || []).find(function (x) { return x.id === p.id; }) || {};
      var titleId = p.titleId;
      used[titleId] = (used[titleId] || 0) + 1;
      out.push(decorate(
        { id: p.id, name: p.name, rank: p.rank },
        titleId, person.station || STATION_IDS[i % STATION_IDS.length],
        person.shift || 'A', i
      ));
    });

    var n = 0;
    (CP.JOB_TITLES || []).forEach(function (t) {
      var need = (t.count || 0) - (used[t.id] || 0);
      for (var j = 0; j < need; j++) {
        var stationId = STATION_IDS[n % STATION_IDS.length];
        // Shift must advance on a different cycle than station, or each
        // house ends up staffed by exactly one shift.
        var shift = ['A', 'B', 'C'][Math.floor(n / STATION_IDS.length) % 3];
        // Non-shift roles don't sit on a rotation.
        if (t.id === 'training_officer' || t.id === 'fleet_manager') shift = '—';
        var name = FIRST[n % FIRST.length] + ' ' + LAST[(n * 3) % LAST.length];
        out.push(decorate({ id: 'r' + n, name: name }, t.id, stationId, shift, n));
        n++;
      }
    });

    return out;
  }

  var ROSTER = buildRoster();
  function personById(id) { return ROSTER.find(function (p) { return p.id === id; }) || null; }

  /* =====================================================================
     RULE ENGINE
     A rule is a flat AND of clauses; each clause ORs its values and may
     be negated. Flat (not a nested tree) so every clause maps to exactly
     one removable chip — the chips are how the user audits what the AI
     inferred about who receives a dashboard.
     ===================================================================== */

  function clauseMatches(p, c) {
    var v = c.values || [];
    var hit;
    switch (c.op) {
      case 'has':                                       // array field
        hit = v.some(function (x) { return (p[c.field] || []).indexOf(x) !== -1; });
        break;
      case 'gte': hit = Number(p[c.field]) >= Number(v[0]); break;
      case 'lte': hit = Number(p[c.field]) <= Number(v[0]); break;
      case 'before': hit = String(p[c.field]) < String(v[0]); break;
      case 'after':  hit = String(p[c.field]) > String(v[0]); break;
      default:                                          // 'in'
        hit = v.indexOf(p[c.field]) !== -1;
    }
    return c.negate ? !hit : hit;
  }

  // `required` scopes the coverage warning to the sources THIS dashboard
  // actually reads. Without it we'd warn that engineers lack TargetSolutions
  // on a dashboard that never touches TargetSolutions — noise that trains
  // people to ignore the warning.
  function evaluate(rule, required) {
    var clauses = (rule && rule.clauses) || [];
    var people = clauses.length
      ? ROSTER.filter(function (p) { return clauses.every(function (c) { return clauseMatches(p, c); }); })
      : [];
    return { people: people, count: people.length, coverage: coverageOf(people, required) };
  }

  // Which required sources is at least one matched person missing? Mirrors
  // how the job-title rows already warn about entitlement gaps.
  function coverageOf(people, required) {
    var srcs = (required && required.length) ? required : [];
    var missing = [];
    srcs.forEach(function (src) {
      var lacking = people.filter(function (p) { return p.entitlements.indexOf(src) === -1; });
      if (lacking.length) missing.push({ source: src, count: lacking.length });
    });
    return { missing: missing };
  }

  // Human-readable label for one clause — what the chip shows.
  function clauseLabel(c) {
    var pre = c.negate ? 'not ' : '';
    var v = c.values || [];
    switch (c.field) {
      case 'titleId':
        return pre + v.map(function (id) { return (CP.titleById(id) || {}).label || id; }).join(' or ');
      case 'certs':
        return pre + v.map(function (id) { return CERTS[id] || id; }).join(' or ');
      case 'battalion': return pre + 'Battalion ' + v.join(' or ');
      case 'station':
        return pre + v.map(function (id) { return stationMeta(id).name; }).join(' or ');
      case 'shift': return pre + v.join('/') + ' shift';
      case 'grade': return pre + v.join(' or ');
      case 'type': return pre + v.map(function (t) { return TYPES[t] || t; }).join(' or ');
      case 'assignment': return pre + v.map(function (a) { return ASSIGNMENTS[a] || a; }).join(' or ');
      case 'tenureYrs':
        // Fold the negation into the wording rather than emitting a double
        // negative: "exclude probationary" reads "over 1 yr", not
        // "not under 1 yr".
        if (c.op === 'lte') {
          return c.negate
            ? 'over ' + v[0] + ' yr' + (v[0] === 1 ? '' : 's')
            : 'under ' + v[0] + ' yr' + (v[0] === 1 ? '' : 's');
        }
        return c.negate ? 'under ' + v[0] + ' yrs' : v[0] + '+ yrs';
      case 'hired':
        return pre + 'hired ' + (c.op === 'before' ? 'before ' : 'after ') + String(v[0]).slice(0, 4);
      default: return pre + c.field + ' ' + v.join(', ');
    }
  }

  // Auto-name a group from its clauses — pre-fills the save field.
  function suggestName(rule) {
    var cl = (rule.clauses || []).slice(0, 3);
    if (!cl.length) return 'Untitled group';
    var parts = cl.map(function (c) {
      if (c.field === 'certs') return (CERTS[c.values[0]] || c.values[0]);
      if (c.field === 'titleId') return ((CP.titleById(c.values[0]) || {}).label || '') + 's';
      if (c.field === 'battalion') return c.values[0];
      if (c.field === 'station') return stationMeta(c.values[0]).label || stationMeta(c.values[0]).name;
      return clauseLabel(c);
    });
    return parts.join(' · ');
  }

  /* =====================================================================
     PARSER — plain language → clauses
     Same technique as the page's existing response engine: a vocabulary
     of synonyms, matched deterministically. No model call.
     ===================================================================== */

  var NEGATORS = /\b(exclude|excluding|except|without|not|minus|drop the|no)\b/;

  function titlePatterns() {
    return (CP.JOB_TITLES || []).map(function (t) {
      var base = t.label.toLowerCase();
      var alts = [base, base + 's'];
      if (t.id === 'paramedic') alts.push('medic', 'medics');
      if (t.id === 'firefighter') alts.push('ff', 'ffs');
      if (t.id === 'battalion_chief') alts.push('bc', 'chief', 'chiefs');
      if (t.id === 'lieutenant') alts.push('lt', 'lts');
      if (t.id === 'captain') alts.push('capt', 'capts');
      return { id: t.id, alts: alts };
    });
  }

  function findAll(text, alts) {
    return alts.some(function (a) {
      return new RegExp('\\b' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(text);
    });
  }

  // Is this phrase negated? True when a negator appears shortly before it.
  function negatedNear(text, phrase) {
    var ix = text.indexOf(phrase);
    if (ix === -1) return false;
    var before = text.slice(Math.max(0, ix - 28), ix);
    return NEGATORS.test(before);
  }

  function parseClauses(text) {
    var t = ' ' + text.toLowerCase().replace(/[,]/g, ' ') + ' ';
    var found = [];
    var ambiguities = [];

    // --- job titles
    var titles = [];
    titlePatterns().forEach(function (tp) {
      if (findAll(t, tp.alts)) titles.push(tp.id);
    });

    // "paramedic-certified firefighters" names the certification, not the
    // rank — don't also match Paramedic as a job title.
    if (/paramedic-?certified/.test(t)) {
      titles = titles.filter(function (x) { return x !== 'paramedic'; });
    }

    // "medics" is both a rank and a certification — worth asking about.
    if (/\bmedics?\b/.test(t) && !/paramedic-?certified/.test(t)) {
      ambiguities.push({
        kind: 'medic',
        question: 'Paramedics by rank, or anyone paramedic-certified?',
        choices: [
          { label: 'By rank', clauses: [{ field: 'titleId', op: 'in', values: ['paramedic'] }] },
          { label: 'Paramedic-certified', clauses: [{ field: 'certs', op: 'has', values: ['paramedic'] }] }
        ]
      });
      titles = titles.filter(function (x) { return x !== 'paramedic'; });
    }
    if (titles.length) {
      found.push({ field: 'titleId', op: 'in', values: titles,
        negate: titles.some(function (id) { return negatedNear(t, ((CP.titleById(id) || {}).label || '').toLowerCase()); }) });
    }

    // --- certifications
    var certs = [];
    if (/\bhaz-?mat\b/.test(t)) certs.push('hazmat');
    if (/\bevoc\b|\bdriver'?s? cert/.test(t)) certs.push('evoc');
    if (/\barff\b|aircraft rescue/.test(t)) certs.push('arff');
    if (/technical rescue|tech rescue|\brope\b/.test(t)) certs.push('technical-rescue');
    if (/\bemt\b/.test(t)) certs.push('emt');
    if (/\bcpr\b/.test(t)) certs.push('cpr');
    if (/paramedic-?certified/.test(t)) certs.push('paramedic');
    if (certs.length) {
      found.push({ field: 'certs', op: 'has', values: certs,
        negate: certs.some(function (c) { return negatedNear(t, (CERTS[c] || c).toLowerCase()); }) });
    }

    // --- battalion + station (and the ambiguity between them)
    var battalions = [];
    var bm = t.match(/\bb-?([123])\b/g) || [];
    bm.forEach(function (m) { battalions.push('B-' + m.replace(/\D/g, '')); });
    (t.match(/battalion\s*([123])/g) || []).forEach(function (m) {
      battalions.push('B-' + m.replace(/\D/g, ''));
    });
    battalions = battalions.filter(function (b, i, a) { return a.indexOf(b) === i; });

    var stations = [];
    (K.STATIONS || []).forEach(function (s) {
      var num = s.id.replace('st', '');
      var label = (s.label || '').toLowerCase().split(' / ')[0];
      if (new RegExp('\\bstation\\s*' + num + '\\b').test(t)) stations.push(s.id);
      else if (label && label.length > 3 && t.indexOf(label) !== -1) stations.push(s.id);
      else if (/\bhq\b/.test(t) && s.id === 'st1') stations.push(s.id);
    });
    stations = stations.filter(function (s, i, a) { return a.indexOf(s) === i; });

    // A station named alongside its own battalion: which did they mean?
    var conflict = stations.filter(function (sid) {
      return battalions.indexOf(stationMeta(sid).battalion) !== -1;
    });
    if (conflict.length && battalions.length) {
      var sid = conflict[0];
      var bat = stationMeta(sid).battalion;
      ambiguities.push({
        kind: 'location',
        question: stationMeta(sid).name + ' only, or all of ' + bat + '?',
        choices: [
          { label: stationMeta(sid).name + ' only', clauses: [{ field: 'station', op: 'in', values: [sid] }] },
          { label: 'All of ' + bat, clauses: [{ field: 'battalion', op: 'in', values: [bat] }] }
        ]
      });
    } else {
      if (battalions.length) found.push({ field: 'battalion', op: 'in', values: battalions });
      if (stations.length) found.push({ field: 'station', op: 'in', values: stations });
    }

    // --- shift
    var shifts = [];
    (t.match(/\b([abc])[- ]shift\b|\bshift\s*([abc])\b/g) || []).forEach(function (m) {
      var ch = m.replace(/[^abc]/g, '').toUpperCase();
      if (ch) shifts.push(ch[0]);
    });
    shifts = shifts.filter(function (s, i, a) { return a.indexOf(s) === i; });
    if (shifts.length) found.push({ field: 'shift', op: 'in', values: shifts });

    // --- pay grade
    var grades = [];
    (t.match(/\b(ff|eng|lt|cpt|bc|to|fm)-?([123])\b/g) || []).forEach(function (m) {
      grades.push(m.toUpperCase().replace(/-/, '').replace(/([A-Z]+)(\d)/, '$1-$2'));
    });
    if (grades.length) found.push({ field: 'grade', op: 'in', values: grades });

    // --- employment type + assignment
    var types = [];
    if (/\bvolunteers?\b/.test(t)) types.push('volunteer');
    if (/\bcareer\b/.test(t)) types.push('career');
    if (/part[- ]time/.test(t)) types.push('part-time');
    if (types.length) found.push({ field: 'type', op: 'in', values: types,
      negate: negatedNear(t, types[0]) });

    var asg = [];
    Object.keys(ASSIGNMENTS).forEach(function (a) {
      if (new RegExp('\\b' + a + '\\b').test(t)) asg.push(a);
    });
    if (asg.length) found.push({ field: 'assignment', op: 'in', values: asg });

    // --- tenure
    if (/\bnew hires?\b|\brookies?\b|\bprobationary\b|first year/.test(t)) {
      found.push({ field: 'tenureYrs', op: 'lte', values: [1],
        negate: NEGATORS.test(t.slice(0, Math.max(0, t.search(/new hires?|rookies?|probationary|first year/)))) });
    }
    var hb = t.match(/hired before (\d{4})/);
    if (hb) found.push({ field: 'hired', op: 'before', values: [hb[1] + '-01-01'] });
    var ha = t.match(/hired (?:after|since) (\d{4})/);
    if (ha) found.push({ field: 'hired', op: 'after', values: [ha[1] + '-12-31'] });
    var yrs = t.match(/(\d+)\+?\s*(?:or more\s*)?years?/);
    if (yrs && !hb && !ha) {
      var more = /more than|over|at least|\+/.test(t);
      found.push({ field: 'tenureYrs', op: more ? 'gte' : 'lte', values: [Number(yrs[1])] });
    }

    return { clauses: found, ambiguities: ambiguities };
  }

  // Fold new clauses into the standing rule. Same field unions its values;
  // "only"/"just" replaces; "remove"/"drop" deletes. This is what makes it
  // a conversation instead of repeated one-shot queries.
  function mergeClauses(rule, incoming, text) {
    var t = (text || '').toLowerCase();
    var replace = /\bonly\b|\bactually just\b|\bjust\b|\binstead\b/.test(t);
    var removing = /\bremove\b|\bdrop\b|\bforget\b|\bclear\b/.test(t);
    var next = (rule.clauses || []).slice();

    incoming.forEach(function (c) {
      var ix = next.findIndex(function (x) { return x.field === c.field && !!x.negate === !!c.negate; });
      if (removing) { if (ix !== -1) next.splice(ix, 1); return; }
      if (ix === -1) { next.push(c); return; }
      if (replace || c.op !== next[ix].op) { next[ix] = c; return; }
      var merged = next[ix].values.concat(c.values).filter(function (v, i, a) { return a.indexOf(v) === i; });
      next[ix] = Object.assign({}, next[ix], { values: merged });
    });

    return Object.assign({}, rule, { clauses: next });
  }

  // Which single clause is emptying the result? Used to make a zero-match
  // reply actionable instead of a bare "0 people".
  function blamedClause(rule) {
    var clauses = rule.clauses || [];
    if (clauses.length < 2) return null;
    for (var i = 0; i < clauses.length; i++) {
      var without = clauses.filter(function (_, j) { return j !== i; });
      if (evaluate({ clauses: without }).count > 0) return clauses[i];
    }
    return null;
  }

  var FIELD_LIST = 'rank, station, battalion, shift, pay grade, tenure, certifications, ' +
    'employment type and assignment';

  // One conversational turn: returns the updated rule plus what to say.
  function respond(text, rule) {
    var parsed = parseClauses(text);

    if (parsed.ambiguities.length) {
      var amb = parsed.ambiguities[0];
      var staged = mergeClauses(rule, parsed.clauses, text);
      return { rule: staged, text: amb.question, choices: amb.choices, pending: true };
    }

    if (!parsed.clauses.length) {
      return {
        rule: rule,
        text: 'I can’t filter on that. I can work with ' + FIELD_LIST + '.'
      };
    }

    var next = mergeClauses(rule, parsed.clauses, text);
    var res = evaluate(next);

    if (res.count === 0) {
      var blame = blamedClause(next);
      return {
        rule: next,
        text: blame
          ? 'No one matches — ' + clauseLabel(blame) + ' has no overlap with the rest. Drop it?'
          : 'No one matches that. Try loosening a criterion.',
        offerDrop: blame || null
      };
    }

    return {
      rule: next,
      text: 'Updated — ' + res.count + ' ' + (res.count === 1 ? 'person' : 'people') + ' match.'
    };
  }

  /* =====================================================================
     SAVED GROUPS
     Seeded so the reusable story is legible on first open. New groups
     live in memory for the session — deliberately no localStorage, so
     every reviewer opens to the same state.
     ===================================================================== */

  var GROUPS = [
    { id: 'grp_hazmat_b2', name: 'HazMat · B-2 engineers', createdAt: '2026-04-12', clauses: [
      { field: 'titleId', op: 'in', values: ['engineer'] },
      { field: 'certs', op: 'has', values: ['hazmat'] },
      { field: 'battalion', op: 'in', values: ['B-2'] }
    ] },
    { id: 'grp_new_hires', name: 'New hires · first year', createdAt: '2026-05-02', clauses: [
      { field: 'tenureYrs', op: 'lte', values: [1] }
    ] },
    { id: 'grp_airport_c', name: 'Airport · C shift', createdAt: '2026-03-20', clauses: [
      { field: 'station', op: 'in', values: ['st14'] },
      { field: 'shift', op: 'in', values: ['C'] }
    ] }
  ];

  var GID = 0;
  function saveGroup(name, clauses) {
    GID += 1;
    var g = { id: 'grp_new_' + GID, name: name || 'Untitled group',
      createdAt: TODAY_ISO, clauses: clauses.slice() };
    GROUPS.unshift(g);
    return g;
  }
  function groupById(id) { return GROUPS.find(function (g) { return g.id === id; }) || null; }

  // Edit a saved group in place. Because a group is a live rule, this
  // changes the audience of every dashboard already published to it —
  // the dialog surfaces that usage count before the user commits.
  function updateGroup(id, name, clauses) {
    var g = groupById(id);
    if (!g) return null;
    if (name) g.name = name;
    if (clauses) g.clauses = clauses.slice();
    return g;
  }

  /* =====================================================================
     AUDIENCE RESOLUTION
     Titles report counts while groups resolve to people, so reach has to
     resolve everything to person ids and de-duplicate — otherwise a
     Captain who is also in an AI group gets counted twice.
     ===================================================================== */

  function resolveAudience(a) {
    var ids = {};
    if (!a) return [];
    (a.titles || []).forEach(function (tid) {
      ROSTER.forEach(function (p) { if (p.titleId === tid) ids[p.id] = 1; });
    });
    (a.individuals || []).forEach(function (pid) { ids[pid] = 1; });
    (a.groups || []).forEach(function (gid) {
      var g = groupById(gid);
      if (g) evaluate(g).people.forEach(function (p) { ids[p.id] = 1; });
    });
    return Object.keys(ids);
  }

  function audienceCount(a) { return resolveAudience(a).length; }

  window.AGENCY_INTEL_ROSTER = {
    ROSTER: ROSTER,
    CERTS: CERTS,
    TYPES: TYPES,
    ASSIGNMENTS: ASSIGNMENTS,
    personById: personById,
    stationMeta: stationMeta,
    evaluate: evaluate,
    clauseLabel: clauseLabel,
    suggestName: suggestName,
    respond: respond,
    mergeClauses: mergeClauses,
    GROUPS: GROUPS,
    groupById: groupById,
    saveGroup: saveGroup,
    updateGroup: updateGroup,
    resolveAudience: resolveAudience,
    audienceCount: audienceCount,
    FIELD_LIST: FIELD_LIST
  };
})();
