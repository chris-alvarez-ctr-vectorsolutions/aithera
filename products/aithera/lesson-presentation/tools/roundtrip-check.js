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
     node tools/roundtrip-check.js                 # fetch live documents from the POC repo
     node tools/roundtrip-check.js path/*.lo.json  # check local files instead

   Fixtures are FETCHED rather than vendored, on purpose: a committed copy goes
   stale against their repo and then reports a green check against content nobody
   is running any more. Needs `gh` authenticated for the default mode.

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
const args = process.argv.slice(2);
const docs = args.length
  ? args.map((f) => ({ name: path.basename(f).replace(/\.lo\.json$/, ''), doc: JSON.parse(fs.readFileSync(f, 'utf8')) }))
  : fetchLiveDocs();

console.log('Round-tripping ' + docs.length + ' document(s) through the export chain\n');
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
process.exit(failed ? 1 : 0);
