#!/usr/bin/env node
/* =========================================================================
   RESEED THE TEMPLATE GALLERY FROM THE LOCKED PRODUCTION DOCUMENTS

   `js/scenario-v4-templates.js` is generated. This is what generates it.

   WHAT CHANGED, AND WHY THIS SCRIPT EXISTS
   The gallery used to carry documents PORTED from our own shipped exemplars.
   Porting could only bring across what the source contained, so each template
   arrived with 8-24 required fields empty (conversion policy D6: never invent
   prose) — an honest starting point, and a bad demo. An LXD picking "Guided Arc"
   was promised the Marshall scenario and got a form with red rows in it.

   The dev team's own documents are RIGHT HERE, pinned under tools/pinned/content
   for the round-trip check: eleven production Scenario CML v4 files, every one of
   them valid under their loader. Six of them match the six gallery shapes
   exactly. So a template is no longer a port — it is the locked production
   document, seeded verbatim, with four things added on top:

     · implementation_id  → a readable `template-…` id. NEVER ship a production
                            UUID in a starting point: an export made from it
                            would address the real record in their system.
                            (Since ids became generated, the editor re-derives
                            this one from the title the moment the template
                            loads — so what an author sees is a slug of the
                            scenario name. The value here is what the raw file
                            carries, and the point stands either way: no
                            production UUID leaves this gallery.)
     · landing_cta_label  → for the two documents that carry none.
     · previousLO {…}     → the shell's prior-scenario context (a shell key,
                            stripped at export). Authored here, because a blank
                            "what came before" card is the first thing an author
                            sees on page one.
     · exhibit.src        → repointed at the image vendored into assets/media/,
                            so an Observe step previews instead of showing a
                            broken frame. Their path is relative to their own
                            media root, which does not exist in this repo.

   Everything else is theirs, untouched — which is the point. The template is
   real content, it validates green, and nothing in it was made up.

   USAGE
     node tools/reseed-templates.js           # rewrite the gallery, then verify
     node tools/reseed-templates.js --check   # verify only, change nothing

   It rewrites only the `doc:` block and the `shape:` line of each entry, so the
   comments explaining each template's naming and history survive intact.
   ====================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'js/scenario-v4-templates.js');
const PINNED = path.join(ROOT, 'tools/pinned/content');
const CHECK_ONLY = process.argv.includes('--check');
const V4 = require(path.join(ROOT, 'js/scenario-v4.js'));

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

/* ---- the mapping ------------------------------------------------------------
   template id → the production document that IS that shape, plus what we add.
   `media` repoints their media paths at the vendored copies: { their src → ours },
   rewritten by value everywhere in the document. */
const SEED = {
  'mix-arc': {
    doc: 'floor-lead',
    implementation_id: 'template-first-week-on-the-floor',
    media: { 'demo/floor-lead.jpg': 'assets/media/demo/floor-lead.jpg' },
    previousLO: {
      title: 'New Supervisor Basics: Safety Is a Leadership Job',
      covered: 'A supervisor owns the conditions and the behaviour on their floor; how to run a '
        + 'correction conversation without making it a reprimand; and the authority to stop work.',
      handoff: 'The learner has the model in the abstract. This is the first week they have to hold it '
        + 'in front of people who were doing the job before they arrived.',
    },
  },
  'guided-arc': {
    doc: 'marshall',
    implementation_id: 'template-bystander-intervention-marshall',
    landing_cta_label: 'Take a first read',
    previousLO: {
      title: 'Preventing Harassment: What the Law Actually Covers',
      covered: 'Title VII\'s protected classes; quid pro quo versus a hostile work environment; '
        + 'gender-stereotype conduct as sex-based harassment; and that same-sex harassment is fully covered.',
      handoff: 'The learner has just been told that a witness can report independently of the person '
        + 'being targeted. They have not yet had to decide what to do while it is happening.',
    },
  },
  'branching-arc': {
    doc: 'wpv',
    implementation_id: 'template-reading-the-warning-signs',
    landing_cta_label: 'Start your shift',
    previousLO: {
      title: 'Workplace Violence Prevention: The Levels of Concerning Behaviour',
      covered: 'The level-by-level markers of concerning behaviour; the duty to document and report up '
        + 'rather than handle it alone; and what separates a performance problem from a behaviour of concern.',
      handoff: 'The learner can name the levels on a slide. They have not yet had to act on a pattern '
        + 'that has not broken a rule yet.',
    },
  },
  'ensemble-arc': {
    doc: 'bullying',
    implementation_id: 'template-responding-to-bullying-call-from-home',
    previousLO: {
      title: 'Bullying and Harassment: Policy, Duty and Documentation',
      covered: 'How the policy defines bullying; the reporting duty the moment a report reaches staff; '
        + 'and why a disclosure from a minor changes what happens next.',
      handoff: 'The learner knows the policy. They have not yet taken the call from a parent who is '
        + 'upset and expects an answer today.',
    },
  },
  'scene-sweep': {
    doc: 'hazcom',
    implementation_id: 'template-spot-the-hazard-hazcom',
    media: { 'hazcom/finishing-bench.jpg': 'assets/media/hazcom/finishing-bench.jpg' },
    previousLO: {
      title: 'Hazard Communication: Labels, Safety Data Sheets and the Right to Know',
      covered: 'The six required label elements; the sixteen-section safety data sheet; secondary-container '
        + 'labelling; and the employee\'s right to know what is in the workplace.',
      handoff: 'The learner can recite the label elements. They have not yet had to notice a missing one '
        + 'on a bench in front of them.',
    },
  },
  'observe-react': {
    doc: 'dock-walk',
    implementation_id: 'template-dock-check-walkaround',
    media: { 'demo/dock-walk.jpg': 'assets/media/demo/dock-walk.jpg' },
    previousLO: {
      title: 'Powered Industrial Trucks and Dock Safety',
      covered: 'Unattended-forklift rules; separating travel lanes from pedestrian routes; safe stacking '
        + 'height; and keeping exits, extinguishers and eyewash clear.',
      handoff: 'The learner has read the rules. This is the first time they walk a dock and have to say '
        + 'out loud what is wrong with it.',
    },
  },
};

const MODE_LETTER = { coach_inquiry: 'C', roleplay: 'R', observe_react: 'O' };

function buildDoc(id) {
  const spec = SEED[id];
  const file = path.join(PINNED, spec.doc + '.lo.json');
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));

  doc.implementation_id = spec.implementation_id;
  if (spec.landing_cta_label) doc.content.landing_cta_label = spec.landing_cta_label;
  /* EVERY src in the document, not just the Observe step's. The Scene Sweep and
     Mix & Match documents also hang the same photo off a later coach step as its
     ambient reference image, and repointing one and not the other left a path
     that resolves nowhere — the exact silent-blank-frame failure the drop zone's
     thumbnail exists to catch. So this walks the whole document and rewrites by
     VALUE, and then insists every rewritten file is really on disk. */
  const rewrites = spec.media || {};
  let hit = 0;
  (function walk(v) {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach(walk); return; }
    Object.keys(v).forEach((k) => {
      if (k === 'src' && typeof v[k] === 'string' && rewrites[v[k]]) { v[k] = rewrites[v[k]]; hit += 1; }
      else walk(v[k]);
    });
  }(doc.content));
  const stillTheirs = JSON.stringify(doc.content).match(/"src": "(?!assets\/)[^"]+"/g);
  if (stillTheirs) throw new Error(`${id}: ${stillTheirs.join(', ')} points outside this repo — add it to media`);
  Object.values(rewrites).forEach((src) => {
    if (!fs.existsSync(path.join(ROOT, src))) {
      throw new Error(`${id}: ${src} is not in this repo — vendor the image first`);
    }
  });
  if (Object.keys(rewrites).length && !hit) throw new Error(`${id}: no src matched a rewrite`);

  /* The shell's own keys, so page one's "what came before" card arrives written.
     Stripped from every export (withoutShellKeys) — this is prompt context, not
     a v4 field, which is also why validation below removes them first. */
  doc.contextSource = 'previous-lo';
  doc.previousLO = spec.previousLO;

  const shape = doc.content.phases
    .map((p) => MODE_LETTER[p.practice && p.practice.mode] || '?').join('');
  return { doc, shape, source: spec.doc };
}

/* ---- splice one entry's `doc:` block and `shape:` line --------------------
   A brace matcher rather than a regex: the documents contain braces inside
   strings, and a greedy match would end the block in the middle of a sentence. */
function endOfObject(src, open) {
  let depth = 0;
  let inStr = false;
  for (let i = open; i < src.length; i += 1) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') { i += 1; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') depth += 1;
    else if (c === '}') { depth -= 1; if (!depth) return i; }
  }
  throw new Error('unbalanced braces after index ' + open);
}

function indent(json, spaces) {
  const pad = ' '.repeat(spaces);
  return json.split('\n').map((line, i) => (i ? pad + line : line)).join('\n');
}

function reseed(src, id, built) {
  const entry = src.indexOf(`\n  "${id}": {`);
  if (entry < 0) throw new Error(`entry "${id}" not found`);
  const nextEntry = src.indexOf('\n  "', entry + 5);
  const scopeEnd = nextEntry < 0 ? src.length : nextEntry;

  /* shape + the now-gone toFill live on one line: `shape: "CCR", toFill: 24,` */
  const shapeLine = /(\n\s*)shape: "[A-Z?]*",(?: toFill: \d+,)?/;
  const scope = src.slice(entry, scopeEnd);
  /* Test the match, do not compare before/after: re-running the tool with the
     shape unchanged writes the same characters back, and an equality check reads
     that as "there was no shape line" and aborts a perfectly good re-seed. */
  if (!shapeLine.test(scope)) throw new Error(`${id}: no shape: line to update`);
  const shaped = scope.replace(shapeLine, `$1shape: "${built.shape}",`);
  src = src.slice(0, entry) + shaped + src.slice(scopeEnd);

  const docAt = src.indexOf('\n    doc: ', entry);
  if (docAt < 0) throw new Error(`${id}: no doc: block`);
  const open = src.indexOf('{', docAt);
  const close = endOfObject(src, open);
  const json = indent(JSON.stringify(built.doc, null, 2), 4);
  return src.slice(0, open) + json + src.slice(close + 1);
}

/* ---- run ---------------------------------------------------------------- */
let src = fs.readFileSync(TARGET, 'utf8');
const report = [];
let failed = 0;

Object.keys(SEED).forEach((id) => {
  const built = buildDoc(id);
  const forValidation = JSON.parse(JSON.stringify(built.doc));
  delete forValidation.contextSource;
  delete forValidation.previousLO;
  const res = V4.validate(forValidation);
  const errs = (res.errors || []).length;
  if (errs) failed += 1;
  report.push({ id, source: built.source, shape: built.shape, errs, cap: res.cap,
    errors: (res.errors || []).slice(0, 6) });
  if (!CHECK_ONLY) src = reseed(src, id, built);
});

if (!CHECK_ONLY) {
  fs.writeFileSync(TARGET, src);
  /* Reload what we just wrote and prove the module still parses and still hands
     back every template — a splice that lands mid-string would sail through the
     write and fail in the browser. */
  delete require.cache[require.resolve(TARGET)];
  const TPL = require(TARGET);
  const missing = TPL.ORDER.filter((k) => !TPL.get(k));
  if (missing.length) {
    console.error(red('The rewritten module does not resolve: ' + missing.join(', ')));
    process.exit(2);
  }
}

console.log('');
report.forEach((r) => {
  const tag = r.errs ? red(r.errs + ' error(s)') : green('valid');
  console.log(`  ${r.id.padEnd(14)} ← ${r.source.padEnd(12)} shape ${r.shape.padEnd(5)} ${tag}`
    + dim(`  cap=${r.cap == null ? '?' : r.cap}`));
  r.errors.forEach((e) => console.log(dim('      ' + e.path + ' — ' + (e.message || e.msg))));
});
console.log('');
console.log(failed
  ? red(`${failed} template(s) do not validate — the gallery must never ship one.`)
  : green(`All ${report.length} templates validate under the production loader.`)
  + dim(CHECK_ONLY ? '  (--check: nothing written)' : '  (js/scenario-v4-templates.js rewritten)'));
process.exit(failed ? 1 : 0);
