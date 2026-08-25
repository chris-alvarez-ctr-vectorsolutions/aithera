#!/usr/bin/env node
/* =========================================================================
   ROUND-TRIP CONFORMANCE CHECK — is the JSON contract still intact?

   The question it answers: if an LXD opens a PRODUCTION scenario in the Editor
   and exports it again WITHOUT EDITING ANYTHING, is the file that comes out the
   same file that went in?

   That question is load-bearing. The Editor is the authoring path for the
   production engine, and the two systems are joined by nothing but this JSON.
   Their schema sets "additionalProperties": false at every level, so a field we
   invent is a hard load failure, and a field we silently drop is content an
   author loses without being told. Neither shows up in the UI.

   It runs the REAL export chain — type.merge (what loading a document does),
   then prune(withoutShellKeys(...)), then ScenarioV4.stripExtensions, which is
   exactly what the Export panel builds — and diffs the result against the input.

   USAGE
     node tools/roundtrip-check.js                 # PINNED documents — no credentials
     node tools/roundtrip-check.js --live          # fetch the live documents instead
     node tools/roundtrip-check.js path/*.lo.json  # specific local files
     node tools/roundtrip-check.js --update-pinned # refresh the pins, then READ THE DIFF

   TWO JOBS, TWO CREDENTIAL NEEDS — this is why the default is pinned.

     "Did WE break the editor's fidelity?"   the regression guard. Wants to run on
                                             every push, forever, depending on
                                             nobody. Needs real content, not
                                             necessarily live content.
     "Did THEIR content or schema move?"     drift detection. Naturally periodic,
                                             and genuinely needs to reach their
                                             repo — which is private, so a
                                             cross-repo credential.

   Bundling those two meant the valuable half could not run at all without the
   credential, so the pinned copies under tools/pinned/ are now the default and
   the live fetch is the drift alarm layered on top. When the fetch is not
   available the drift section says so, once, and the regression guard still runs.

   The original objection to vendoring stands and is answered rather than ignored:
   a committed copy goes stale and then reports a green check against content
   nobody runs. That is exactly what the drift section is for, and it is the same
   pattern the pinned schema already uses. A pin without its diff is worse than no
   pin — so refresh deliberately, and read what moved.

   Exit code is 1 if any document fails to round-trip, so this can gate a change.
   ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const HERE = path.join(__dirname, '..');
const POC_REPO = 'VectorLearning/scenario-simulator-poc';
const V4 = require(path.join(HERE, 'js/scenario-v4.js'));

/* prune() is closure-private in the type — legitimately so, nothing in the app
   needs it. The check loads a PATCHED COPY that also exposes it; the repo file
   is never touched. If this patch ever fails to apply, the export chain has been
   restructured and this harness needs rereading, not silencing. */
function loadType() {
  let src = fs.readFileSync(path.join(HERE, 'js/scenario-types/v4-universal.js'), 'utf8');
  const patched = src.replace('    normalize,\n', '    normalize,\n    prune,\n');
  if (patched === src) {
    console.error('Could not expose prune() — the type\'s export list changed. Read the export chain before trusting this check.');
    process.exit(2);
  }
  const sandbox = { console, JSON, Object, Array, String, Number, Boolean, Math, RegExp, Date };
  sandbox.window = sandbox;
  sandbox.ScenarioV4 = V4;
  const ctx = vm.createContext(sandbox);

  /* Load exactly what the EDITOR PAGE loads, in the same order. This is not
     tidiness — it is the difference between a real check and a green one.
     The first version of this harness loaded only scenario-v4.js, so
     ScenarioV4Templates was absent, so the type's DEFAULT fell back to blank()
     instead of the Mix & Match demo template it is in a browser. It reported
     11/11 while the real editor was grafting that template's prose onto every
     imported document that omitted a content key. A harness that loads less than
     the page can only tell you about a path nobody runs. */
  ['js/scenario-v4-runtime.js', 'js/scenario-v4-templates.js', 'js/scenario-types/mix-arc.js']
    .forEach(function (f) {
      try { vm.runInContext(fs.readFileSync(path.join(HERE, f), 'utf8'), ctx); }
      catch (e) { console.error('WARNING  could not load ' + f + ' — ' + String(e.message).split('\n')[0]); }
    });
  vm.runInContext(patched, ctx);
  const T = sandbox.AitheraV4Universal;
  if (!T || !T.prune) { console.error('v4-universal.js did not load'); process.exit(2); }
  /* Fail loudly rather than silently testing a blank-DEFAULT world. */
  if (!sandbox.ScenarioV4Templates) {
    console.error('Templates module did not register — DEFAULT would be blank here and populated in the browser. Refusing to report a result.');
    process.exit(2);
  }
  const tplCount = (sandbox.ScenarioV4Templates.list() || []).length;
  console.log('loaded ' + tplCount + ' templates; DEFAULT matches the browser\n');
  return T;
}

const SHELL_KEYS = ['contextSource', 'previousLO'];
function exportDoc(T, loaded) {
  const d = JSON.parse(JSON.stringify(loaded));
  SHELL_KEYS.forEach((k) => delete d[k]);
  return V4.stripExtensions(T.prune(d)).doc;
}

function diff(a, b, p, out) {
  out = out || []; p = p || '';
  const t = (v) => Array.isArray(v) ? 'array' : (v === null ? 'null' : typeof v);
  if (t(a) !== t(b)) { out.push({ path: p || '(root)', kind: 'type ' + t(a) + '→' + t(b) }); return out; }
  if (t(a) === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    ka.filter((k) => !kb.includes(k)).forEach((k) => out.push({ path: p + '.' + k, kind: 'DROPPED', was: a[k] }));
    kb.filter((k) => !ka.includes(k)).forEach((k) => out.push({ path: p + '.' + k, kind: 'ADDED', now: b[k] }));
    ka.filter((k) => kb.includes(k)).forEach((k) => diff(a[k], b[k], p + '.' + k, out));
  } else if (t(a) === 'array') {
    if (a.length !== b.length) out.push({ path: p, kind: 'length ' + a.length + '→' + b.length });
    for (let i = 0; i < Math.min(a.length, b.length); i++) diff(a[i], b[i], p + '[' + i + ']', out);
  } else if (a !== b) {
    out.push({ path: p, kind: 'CHANGED', was: a, now: b });
  }
  return out;
}

/* The pinned documents, read off disk. Named for their file stem exactly as the
   live fetch does, so everything downstream is identical either way. */
function readPinnedDocs() {
  const dir = path.join(__dirname, 'pinned', 'content');
  if (!fs.existsSync(dir)) {
    console.error('No pinned documents at tools/pinned/content/.\n'
      + '  Seed them once with:  node tools/roundtrip-check.js --update-pinned\n'
      + '  (that needs `gh` authenticated for ' + POC_REPO + ')');
    process.exit(2);
  }
  const files = fs.readdirSync(dir).filter((f) => /\.lo\.json$/.test(f)).sort();
  if (!files.length) {
    console.error('tools/pinned/content/ is empty — run --update-pinned to seed it.');
    process.exit(2);
  }
  return files.map((f) => ({
    name: path.basename(f, '.lo.json'),
    doc: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')),
  }));
}

function fetchLiveDocs() {
  const gh = (args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  let paths;
  try {
    paths = JSON.parse(gh(['api', `repos/${POC_REPO}/git/trees/main?recursive=1`]))
      .tree.filter((n) => n.type === 'blob' && /^app\/content\/[^/]+\.lo\.json$/.test(n.path))
      .map((n) => n.path);
  } catch (e) {
    console.error('Could not reach ' + POC_REPO + ' — is `gh` authenticated?\n  ' + String(e.message).split('\n')[0]);
    process.exit(2);
  }
  return paths.map((p) => {
    const b64 = JSON.parse(gh(['api', `repos/${POC_REPO}/contents/${p}`])).content;
    return { name: path.basename(p, '.lo.json'), doc: JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) };
  });
}

const T = loadType();
/* Flags are not documents. Every non-flag argv entry is read as a file path,
   so a bare --flag was opened as one and the run died on ENOENT. */
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const LIVE = process.argv.includes('--live') || process.argv.includes('--update-pinned');
const docs = args.length
  ? args.map((f) => ({ name: path.basename(f).replace(/\.lo\.json$/, ''), doc: JSON.parse(fs.readFileSync(f, 'utf8')) }))
  : (LIVE ? fetchLiveDocs() : readPinnedDocs());

console.log('Round-tripping ' + docs.length + ' document(s) through the export chain'
  + (args.length ? '' : LIVE ? '  [live]' : '  [pinned]') + '\n');
let failed = 0;
docs.forEach(({ name, doc }) => {
  const report = V4.validate(doc);
  const loaded = T.merge(JSON.parse(JSON.stringify(doc)));
  const out = exportDoc(T, loaded);
  const d = diff(doc, out);
  const load = report.ok ? 'loads' : report.errors.length + ' validation error(s)';
  if (!d.length) { console.log('  ok    ' + name.padEnd(18) + load); return; }
  failed++;
  console.log('  FAIL  ' + name.padEnd(18) + load + ' — ' + d.length + ' difference(s) after an edit-free export');
  d.slice(0, 10).forEach((x) => {
    const v = (val) => { const s = JSON.stringify(val); return s && s.length > 80 ? s.slice(0, 80) + '…' : s; };
    console.log('          ' + x.kind.padEnd(14) + x.path
      + (x.kind === 'ADDED' ? '  now=' + v(x.now) : '')
      + (x.kind === 'DROPPED' ? '  was=' + v(x.was) : '')
      + (x.kind === 'CHANGED' ? '  ' + v(x.was) + ' → ' + v(x.now) : ''));
  });
  if (d.length > 10) console.log('          … ' + (d.length - 10) + ' more');
});
console.log('\n' + (docs.length - failed) + '/' + docs.length + ' documents survive an edit-free round trip.');
if (failed) console.log('A difference here is content an author loses, or a field their loader rejects. Neither is visible in the UI.');
/* =========================================================================
   FIELD COVERAGE — can the editor SHOW every leaf a real document contains?
   -------------------------------------------------------------------------
   The round trip above proves the editor does not CORRUPT a document. It says
   nothing about whether the editor can DISPLAY it, and those are two different
   questions wearing one green tick.

   That gap shipped. Two lists were bound as `<path>.0`, so the editor rendered
   the first entry of each and hid the rest — 91 teaching points and 61
   expert-answer components across these same eleven documents, invisible and
   un-editable. Every one of them round-tripped byte-identically, because
   untouched data survives an export perfectly well. The check above was green
   the entire time.

   Worth knowing: the dev team's own guard has the identical blind spot.
   `tests/test_authoring_roundtrip.py` asserts a byte-identical GET/PUT over the
   same files, against a docstring naming "a save that looks fine in the studio
   but drops a field" as the top risk. It would have passed on this too. Neither
   side had the other half; this is the other half.

   HOW IT WORKS. The editor's inputs are declared, not discovered — a field is
   `tf('<path>', …)`, `subRows('<path>', …)` or `rowsBlock('<path>', …)`. So the
   bound paths can be read straight out of the type module and matched against
   the leaves real content actually carries.

   It is a STATIC read, so it cannot see a path bound imperatively (a checkbox
   flipping a key, a numeric field writing through a closure). Those are listed
   in IMPERATIVE below. A missing entry there surfaces as a false positive —
   the safe direction: the check tells you, you look, you add it.
   ========================================================================= */
const TYPE_SRC = fs.readFileSync(path.join(HERE, 'js/scenario-types/v4-universal.js'), 'utf8');

/* Bound outside tf/subRows/rowsBlock: the safety-flag checkboxes, the
   answer_shape toggle, the mode chips, and every numField(), which writes
   through a getter/setter pair rather than a path string. Keep this in step with
   the type — a stale entry is a leaf this check silently forgives. */
const IMPERATIVE = [
  'content.elevated_stakes', 'content.involves_minors', 'content.threat_content',
  'content.phases.0.practice.answer_shape',
  'content.phases.0.practice.mode',
  'content.phases.0.practice.exit.when.turns',
  'content.phases.0.debrief.follow_up_turns',
  'content.phases.0.practice.interaction.help_turns',
  'content.phases.0.practice.interaction.spot_target',
  /* enumField, same closure-bound shape as numField: a closed two-value set
     that is REQUIRED whenever its object exists. */
  'content.phases.0.practice.interaction.exhibit.type',
  'content.phases.0.practice.interaction.media.type',
  /* Identity and trace metadata the shell owns rather than the type. */
  'implementation_id', 'modality', 'schema_version',
];

/* The quality-levels editor binds FOUR sites through one shared helper
   (`levelsBlock` in the type), so its paths are built by concatenation and a
   static read cannot see them. Declared here rather than reverted to four
   copy-pasted blocks: three of these four sites had no editor at all until the
   helper existed, which is exactly the kind of gap copy-paste produces.

   A hole matches one array index or one named key, so `${t}` covers the three
   tiers and `${i}` covers every phase. */
[
  'content.phases.${i}.practice.interaction',   // roleplay / coach / observe
  'content.phases.${i}.debrief',                // how the coach reads the attempt
  'content.phases.${i}.debrief.probe',          // how it reads the answer to the probe
  'content.opening',                            // partial by design — at least one tier
].forEach(function (base) {
  ['look_for', 'response', 'progression', 'example.learner', 'example.reply']
    .forEach(function (leaf) { IMPERATIVE.push(base + '.levels.${t}.' + leaf); });
});

/* A path template becomes a MATCHER, not a string, because a `${…}` hole is not
   always the same kind of thing. In `content.phases.${i}.practice` it is an
   array index and the leaf reads `content.phases[*].practice`; in
   `levels.${key}.look_for` it is an OBJECT KEY and the leaf reads
   `levels.unthoughtful.look_for`. The first version of this check collapsed both
   to `[*]` and reported 84 false positives — every quality-level field in the
   editor, all of them perfectly editable. A hole matches either form. */
const HOLE = ' ';
function pathMatcher(raw) {
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const src = String(raw)
    .replace(/\.(\d+)(?=\.|$)/g, '[*]')          // a literal index, written .0
    .replace(/\[\d+\]/g, '[*]')                  // or written [0]
    .replace(/\.?\$\{[^}]*\}/g, HOLE);           // the dot travels with the hole
  const body = src.split(HOLE).map(esc).join('(?:\\[\\*\\]|\\.[A-Za-z0-9_-]+)');
  return new RegExp('^' + body + '$');
}

/* Some templates start from a variable rather than a literal — the step editor
   builds `${base}.opening_messages.${k}.text` off
   `const base = `content.phases.${i}.practice.interaction``. Substituting those
   assignments is worth the twenty lines: the alternative is matching a leading
   hole with `.*`, which would quietly mark unrelated leaves as covered, and a
   coverage check that over-forgives is the one failure mode that makes it
   useless. Only simple `const x = `…`` template literals are resolved; anything
   else stays a hole. */
function resolveBases(raw) {
  const vars = {};
  const re = /const\s+([A-Za-z_$][\w$]*)\s*=\s*`([^`]*)`/g;
  let m;
  while ((m = re.exec(TYPE_SRC))) {
    if (/^(content|implementation_id)/.test(m[2])) vars[m[1]] = m[2];
  }
  let out = String(raw), passes = 0;
  while (/\$\{([A-Za-z_$][\w$]*)\}/.test(out) && passes++ < 4) {
    out = out.replace(/\$\{([A-Za-z_$][\w$]*)\}/g, (whole, name) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : whole);
  }
  return out;
}

function boundMatchers() {
  const out = [];
  const re = /\b(?:tf|subRows|rowsBlock)\(\s*([`'"])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m;
  while ((m = re.exec(TYPE_SRC))) out.push(pathMatcher(resolveBases(m[2])));
  IMPERATIVE.forEach((p2) => out.push(pathMatcher(p2)));
  return out;
}

/* Every leaf a document carries. A leaf is a primitive; an empty array or
   object holds nothing to show. */
function leafPaths(node, prefix, out) {
  out = out || new Set(); prefix = prefix || '';
  if (Array.isArray(node)) {
    node.forEach((v) => leafPaths(v, prefix + '[*]', out));
  } else if (node && typeof node === 'object') {
    Object.keys(node).forEach((k) => leafPaths(node[k], prefix ? prefix + '.' + k : k, out));
  } else if (prefix) {
    out.add(prefix);
  }
  return out;
}

const MATCHERS = boundMatchers();
/* Covered when a matcher hits the leaf, or hits the list it sits in — a
   subRows/rowsBlock bound to `x.y` is the editor for every `x.y[*]`. */
function covered(leaf) {
  const asList = leaf.replace(/\[\*\]$/, '');
  return MATCHERS.some((re) => re.test(leaf) || (asList !== leaf && re.test(asList)));
}

console.log('\nField coverage — can the editor show every leaf these documents carry?\n');
const missing = new Map();
docs.forEach(({ name, doc }) => {
  leafPaths(doc).forEach((leaf) => {
    if (covered(leaf)) return;
    if (!missing.has(leaf)) missing.set(leaf, []);
    missing.get(leaf).push(name);
  });
});

/* A BASELINE, not a wall. Turning this check on found ~50 leaf paths that real
   content uses and the editor cannot show — genuine gaps, and more than one
   sitting's work to close. A check that is red on day one gets muted, so the
   known set is recorded in field-coverage-baseline.json and only a leaf OUTSIDE
   it fails the run. The list is meant to shrink: anything fixed is reported so
   the baseline can be trimmed, and it can never silently grow.

   Regenerate with --update-coverage-baseline after DELIBERATELY accepting a new
   gap. Doing that to turn a red build green is the one use it is not for. */
const BASELINE_PATH = path.join(__dirname, 'field-coverage-baseline.json');
const baseline = new Set(
  fs.existsSync(BASELINE_PATH)
    ? (JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')).knownMissing || [])
    : []
);

const found = [...missing.entries()].sort((a, b) => b[1].length - a[1].length);
const fresh = found.filter(([leaf]) => !baseline.has(leaf));
const fixed = [...baseline].filter((leaf) => !missing.has(leaf));

if (process.argv.includes('--update-coverage-baseline')) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify({
    note: 'Leaf paths real content carries that the editor has no field for. Shrink this list; never grow it to go green.',
    knownMissing: found.map(([leaf]) => leaf).sort(),
  }, null, 2) + '\n');
  console.log('  baseline rewritten with ' + found.length + ' known gap(s)');
  process.exit(0);
}

if (!found.length) {
  console.log('  ok    every leaf in ' + docs.length + ' document(s) has a field that can edit it');
} else {
  console.log('  ' + found.length + ' leaf path(s) have no editor field'
    + (baseline.size ? ' — ' + (found.length - fresh.length) + ' known, ' + fresh.length + ' new' : '') + '\n');
  const show = fresh.length ? fresh : found;
  show.slice(0, 20).forEach(([leaf, where]) => {
    console.log('  ' + (baseline.has(leaf) ? 'known ' : 'NEW   ') + '  ' + leaf
      + '   (' + where.length + ' doc' + (where.length > 1 ? 's' : '') + ': '
      + where.slice(0, 4).join(', ') + (where.length > 4 ? ', …' : '') + ')');
  });
  if (show.length > 20) console.log('  … ' + (show.length - 20) + ' more');
  console.log('\n  A leaf with no field is content an author cannot see or change, and it');
  console.log('  round-trips perfectly while they cannot. If a path here IS editable it is');
  console.log('  bound imperatively — add it to IMPERATIVE in this file.');
}
if (fixed.length) {
  console.log('\n  ' + fixed.length + ' baseline gap(s) now covered — trim the baseline:');
  fixed.slice(0, 10).forEach((leaf) => console.log('    fixed  ' + leaf));
}

/* =========================================================================
   SCHEMA DRIFT — has their contract moved without us noticing?
   -------------------------------------------------------------------------
   `js/scenario-v4.js` hand-writes their schema's rules in JavaScript, and that
   is a deliberate trade: its messages are written for an author ("must have at
   least one entry — omit the field rather than authoring an empty array"), and a
   generic JSON-Schema walker produces messages written for a developer. But a
   transcription drifts, silently, and this is the drift we already have: the
   optional `neutral` tier the 18 August meeting granted is in neither their
   schema nor their spec, because neither file has been touched since before that
   meeting. Whichever side moves first without telling the other breaks the other.

   So the schema is vendored under tools/pinned/ and compared against the live
   file on every run. Not a validator — an alarm. Refresh deliberately with
   --update-pinned and read the diff, because a schema change IS a contract
   change and wants a conversation, not a commit.
   ========================================================================= */
const PINNED_DIR = path.join(__dirname, 'pinned');
const PINNED = [{ local: 'lo_cml_v4.schema.json', remote: 'app/lo_schema/lo_cml_v4.schema.json' }];
/* Every pinned document is checked too, and so is the SET of them — if they add a
   twelfth scenario, a list derived from our own directory would never notice it. */
const CONTENT_DIR = path.join(PINNED_DIR, 'content');

function fetchUpstream(remotePath) {
  const raw = execFileSync('gh', ['api', `repos/${POC_REPO}/contents/${remotePath}`],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return Buffer.from(JSON.parse(raw).content, 'base64').toString('utf8');
}

console.log('\nUpstream contract — are our pinned copies still current?\n');
let drifted = 0;

/* One reachability probe, not one per file. Without the credential this section
   is the only thing that cannot run, and it says so once instead of printing a
   dozen identical skips that read like a broken tool. */
let reachable = true;
try { fetchUpstream('app/lo_schema/lo_cml_v4.schema.json'); }
catch (e) {
  reachable = false;
  console.log('  skip    drift checking — cannot reach ' + POC_REPO);
  console.log('          The regression guard above ran against the PINNED copies and is');
  console.log('          unaffected. What is not being checked is whether their content or');
  console.log('          schema has moved since the pins were taken.');
  console.log('          Needs `gh` authenticated locally, or the SCENSIM_POC_TOKEN secret in CI.');
}

/* The document set, before the file-by-file compare: an added or removed scenario
   is a bigger deal than a changed field and would otherwise show up as nothing. */
if (reachable) {
  try {
    const liveNames = JSON.parse(execFileSync('gh',
      ['api', `repos/${POC_REPO}/git/trees/main?recursive=1`],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }))
      .tree.filter((n) => n.type === 'blob' && /^app\/content\/[^/]+\.lo\.json$/.test(n.path))
      .map((n) => path.basename(n.path, '.lo.json')).sort();
    const mineNames = fs.existsSync(CONTENT_DIR)
      ? fs.readdirSync(CONTENT_DIR).filter((f) => /\.lo\.json$/.test(f)).map((f) => path.basename(f, '.lo.json')).sort()
      : [];
    const added = liveNames.filter((n) => !mineNames.includes(n));
    const gone = mineNames.filter((n) => !liveNames.includes(n));
    if (added.length) { drifted++; console.log('  DRIFT   ' + added.length + ' new scenario(s) upstream, not pinned: ' + added.join(', ')); }
    if (gone.length) { drifted++; console.log('  DRIFT   ' + gone.length + ' pinned scenario(s) no longer upstream: ' + gone.join(', ')); }
    if (!added.length && !gone.length) console.log('  ok      the same ' + liveNames.length + ' scenario document(s) upstream');
    if (process.argv.includes('--update-pinned')) {
      if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });
      gone.forEach((n) => fs.unlinkSync(path.join(CONTENT_DIR, n + '.lo.json')));
      liveNames.forEach((n) => {
        fs.writeFileSync(path.join(CONTENT_DIR, n + '.lo.json'), fetchUpstream('app/content/' + n + '.lo.json'));
      });
      console.log('  pinned  ' + liveNames.length + ' document(s) refreshed — READ THE DIFF before committing');
    } else {
      let contentDrift = 0;
      liveNames.filter((n) => mineNames.includes(n)).forEach((n) => {
        const mine = fs.readFileSync(path.join(CONTENT_DIR, n + '.lo.json'), 'utf8');
        if (mine !== fetchUpstream('app/content/' + n + '.lo.json')) { contentDrift++; console.log('  DRIFT   ' + n + '.lo.json has changed upstream'); }
      });
      if (contentDrift) { drifted += contentDrift; console.log('          Refresh with --update-pinned, then re-run: a changed document can');
        console.log('          reveal a field the editor cannot show.'); }
      else console.log('  ok      every pinned document matches upstream');
    }
  } catch (e) {
    console.log('  skip    document drift — ' + String(e.message).split('\n')[0]);
  }
}

PINNED.forEach(({ local, remote }) => {
  if (!reachable) return;
  const localPath = path.join(PINNED_DIR, local);
  let live;
  try { live = fetchUpstream(remote); }
  catch (e) {
    console.log('  skip  ' + local + ' — could not reach ' + POC_REPO + ' (is `gh` authenticated?)');
    return;
  }
  if (process.argv.includes('--update-pinned')) {
    /* Say whether it actually MOVED. Printing the "their schema has changed"
       explanation on every refresh — including one that rewrote identical bytes —
       trains the reader to skip the one line that matters. */
    const before = fs.existsSync(localPath) ? fs.readFileSync(localPath, 'utf8') : '';
    fs.writeFileSync(localPath, live);
    console.log(before === live
      ? '  ok      ' + local + ' re-pinned, unchanged'
      : '  pinned  ' + local + ' refreshed AND IT MOVED — read the diff before committing');
    return;
  }
  const mine = fs.existsSync(localPath) ? fs.readFileSync(localPath, 'utf8') : '';
  if (mine === live) { console.log('  ok      ' + local + ' matches upstream'); return; }
  drifted++;
  /* Name what moved, at the level that matters: which definitions gained or lost
     required fields. A whole-file diff would bury the one line that changes what
     an author is allowed to leave blank. */
  const req = (src) => {
    const out = {};
    const walk = (node, at) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node.required)) out[at || '(root)'] = node.required.slice().sort().join(',');
      Object.keys(node).forEach((k) => {
        const v = node[k];
        if (k === 'properties' || k === '$defs' || k === 'definitions') {
          Object.keys(v || {}).forEach((kk) => walk(v[kk], at ? at + '.' + kk : kk));
        } else if (k === 'items') walk(v, at + '[]');
        else if (Array.isArray(v) && /^(oneOf|anyOf|allOf)$/.test(k)) v.forEach((vv, i) => walk(vv, at + '<' + k + i + '>'));
      });
    };
    try { walk(JSON.parse(src), ''); } catch (e) { /* unparseable — the byte diff already said enough */ }
    return out;
  };
  const a = req(mine), b = req(live);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const moved = keys.filter((k) => a[k] !== b[k]);
  console.log('  DRIFT   ' + local + ' differs from upstream'
    + (moved.length ? ' — ' + moved.length + ' required-field list(s) changed' : ' (no required-field change; formatting or descriptions)'));
  moved.slice(0, 12).forEach((k) => {
    console.log('            ' + k + ':  [' + (a[k] || '—') + ']  →  [' + (b[k] || '—') + ']');
  });
  if (moved.length > 12) console.log('            … ' + (moved.length - 12) + ' more');
});
if (drifted) {
  console.log('\n  Their schema has moved and ours has not. js/scenario-v4.js transcribes these');
  console.log('  rules by hand, so a change here is a change an author will hit before we do.');
  console.log('  Update the transcription, then `--update-pinned` to re-pin.');
}

process.exit(failed || fresh.length || drifted ? 1 : 0);

