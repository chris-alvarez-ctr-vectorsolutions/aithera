#!/usr/bin/env node
/* =========================================================================
   check-dev-handoff.js — a dev handoff must go through the standard
   process, not be approximated by hand.
   =========================================================================

   Why this exists: the EHS "Mobile App — Main" handoff (Jul 2026) froze a
   legacy flat mock into a standalone dev_handoff file floating loose in the
   product folder, added a SEPARATE products.json card pointing straight at
   it, and hand-pinned "status": "ready-for-dev". Nothing failed —
   check-mock-structure.sh deliberately skips *dev_handoff*.html — but the
   result silently lost what the process guarantees developers: the flow
   map (toolbox with comments off) in the dev build, and the dashboard's
   Ready-for-Dev treatment (Dev Page + Dev HTML GitHub links, View Dev
   Build button, designer file in the drawer), which build-dashboards.js
   can only produce for a dev_handoff.html sitting beside a feature's
   index.html.

   The policy (CLAUDE.md → "Dev Handoff Process"): legacy flat mocks are
   left alone until handoff — then they are folded into a standard feature
   folder (Step 0.5) and handed off like any other mock. So every NEW dev
   build must have the standard shape:

   A. Every NEW *dev_handoff*.html under products/ must:
        1. sit beside an index.html (a feature root build-dashboards can
           detect) — never float loose in the product folder;
        2. include designtoolbox/toolbox.js (the flow map stays ON);
        3. set comments: false (the comment widget goes OFF);
        4. have a DEV-NOTES*.md in the same folder (the flow map's dev
           annotations).

   B. products.json must not encode a hand-rolled handoff (NEW entries):
        5. no item's `rel` may point at a *dev_handoff*.html — a handoff is
           a STATE of the existing mock's card, never its own card;
        6. no "ready-for-dev" on a standalone-file rel (ends in .html) —
           the automation cannot back it; fold the mock into a feature
           folder first (Step 0.5);
        7. "ready-for-dev" on a folder-style rel requires an actual
           dev_handoff*.html in that feature folder.

   GRANDFATHERING (--grandfather <ref>): anything already in this shape at
   <ref> is skipped SILENTLY — pre-guard handoffs (EHS mobile, Convergence
   CRUD) and legacy flat mocks are intentionally not flagged. Only
   violations INTRODUCED since <ref> fail.

   Runs from the pre-commit hook (grandfathered against HEAD) and from CI
   (check-mock-structure.yml, grandfathered against the push base).
   Bypass for a genuine exception: SKIP_MOCK_GUARD=1 git commit ...

   Usage:  node scripts/check-dev-handoff.js [--grandfather <git-ref>]
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const PRODUCTS_DIR = 'products';

const isDevBuild = (name) =>
  name.toLowerCase().includes('dev_handoff') && name.toLowerCase().endsWith('.html');

// ---------------------------------------------------------------------------
// Grandfather ref — violations that already existed at <ref> are skipped
// silently (legacy handoffs are deliberately not flagged).
// ---------------------------------------------------------------------------

let grandfatherRef = null;
{
  const i = process.argv.indexOf('--grandfather');
  if (i !== -1 && process.argv[i + 1]) grandfatherRef = process.argv[i + 1];
}

// Files present at the grandfather ref (empty set = nothing grandfathered).
let refFiles = new Set();
// products.json items at the grandfather ref, keyed by "<product> <rel>".
let refItems = new Map();

if (grandfatherRef) {
  try {
    const ls = execFileSync('git', ['ls-tree', '-r', '--name-only', grandfatherRef], {
      cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
    refFiles = new Set(ls.split('\n').filter(Boolean));
  } catch {
    console.error(`  ⚠ check-dev-handoff: cannot read ref "${grandfatherRef}"; nothing grandfathered.`);
  }
  try {
    const raw = execFileSync('git', ['show', `${grandfatherRef}:products.json`], {
      cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    });
    refItems = indexCatalogItems(JSON.parse(raw));
  } catch {
    /* no parseable products.json at ref — treat all items as new */
  }
}

// ---------------------------------------------------------------------------
// Catalog helpers — flatten folder groups (they nest to any depth)
// ---------------------------------------------------------------------------

function flattenItems(items, out = []) {
  for (const it of items || []) {
    if (it && it.folder) flattenItems(it.items, out);
    else if (it && it.rel) out.push(it);
  }
  return out;
}

function indexCatalogItems(catalog) {
  const map = new Map();
  for (const product of catalog.products || []) {
    const slug = product.folder || product.slug || product.label || '';
    for (const it of flattenItems(product.items)) {
      map.set(`${slug} ${it.rel}`, it);
    }
  }
  return map;
}

const violations = [];

// ---------------------------------------------------------------------------
// A. dev_handoff files on disk — only ones NEW since the grandfather ref
// ---------------------------------------------------------------------------

const devBuilds = [];
(function walk(rel) {
  let entries;
  try { entries = fs.readdirSync(path.join(REPO_ROOT, rel), { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    const p = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(p);
    else if (isDevBuild(e.name)) devBuilds.push(p);
  }
})(PRODUCTS_DIR);

let checkedBuilds = 0;
for (const f of devBuilds) {
  if (refFiles.has(f)) continue; // existed at ref — grandfathered, silently
  checkedBuilds++;
  const dir = path.dirname(f);
  let content = '';
  try { content = fs.readFileSync(path.join(REPO_ROOT, f), 'utf8'); } catch { continue; }

  if (!fs.existsSync(path.join(REPO_ROOT, dir, 'index.html'))) {
    violations.push(`${f} — floating loose (no index.html beside it). A dev build lives at a feature root, or build-dashboards.js can never flip the card to Ready for Dev. If this mock is a legacy flat file, fold it into a feature folder first (Dev Handoff Process, Step 0.5).`);
  }
  if (!/designtoolbox\/toolbox\.js/.test(content)) {
    violations.push(`${f} — missing the Design Toolbox include. Dev builds keep toolbox.js (the flow map + dev notes are FOR developers); only comments go off.`);
  }
  if (!/comments\s*:\s*false/.test(content)) {
    violations.push(`${f} — does not set window.TOOLBOX = { comments: false }. Dev builds must switch the comment widget off (add it before the toolbox.js include).`);
  }
  let hasNotes = false;
  try {
    hasNotes = fs.readdirSync(path.join(REPO_ROOT, dir)).some((n) => /dev-notes[^/]*\.md$/i.test(n));
  } catch { /* ignore */ }
  if (!hasNotes) {
    violations.push(`${f} — no DEV-NOTES*.md in ${dir}/. The flow map reads its per-screen developer annotations from a committed DEV-NOTES.md (Dev Handoff Process, Step 2).`);
  }
}

// ---------------------------------------------------------------------------
// B. products.json semantics — only entries NEW/CHANGED since the ref
// ---------------------------------------------------------------------------

let catalog = null;
try { catalog = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'products.json'), 'utf8')); }
catch { console.error('  ⚠ check-dev-handoff: cannot parse products.json; skipping catalog checks.'); }

if (catalog) {
  for (const product of catalog.products || []) {
    const slug = product.folder || product.slug || product.label || '';
    for (const it of flattenItems(product.items)) {
      const refItem = refItems.get(`${slug} ${it.rel}`);

      if (isDevBuild(path.basename(it.rel))) {
        if (refItem) continue; // pre-guard card (e.g. EHS mobile) — grandfathered
        violations.push(`products.json [${slug}] "${it.name}" → rel "${it.rel}" points straight at a dev build. A handoff is a state of the EXISTING mock's card (build-dashboards flips it when dev_handoff.html appears at the feature root) — never a separate card.`);
        continue;
      }

      if (it.status === 'ready-for-dev') {
        if (refItem && refItem.status === 'ready-for-dev') continue; // grandfathered
        if (it.rel.toLowerCase().endsWith('.html')) {
          violations.push(`products.json [${slug}] "${it.name}" — "ready-for-dev" is hand-pinned on a standalone-file mock ("${it.rel}"). The dashboard automation only works for feature folders; fold the mock into one first (Dev Handoff Process, Step 0.5), then hand off normally.`);
        } else {
          const featureDir = it.rel === '.'
            ? path.join(PRODUCTS_DIR, slug)
            : path.join(PRODUCTS_DIR, slug, it.rel);
          let hasBuild = false;
          try {
            hasBuild = fs.readdirSync(path.join(REPO_ROOT, featureDir)).some(isDevBuild);
          } catch { /* missing dir is check-catalog-links' problem */ }
          if (!hasBuild) {
            violations.push(`products.json [${slug}] "${it.name}" — status "ready-for-dev" but no *dev_handoff*.html in ${featureDir}/. Produce the dev build (Dev Handoff Process, Step 3) instead of pinning the status.`);
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (violations.length) {
  console.error(`
  ✋ BLOCKED — dev handoff done outside the standard process:
`);
  for (const v of violations) console.error(`  ✗ ${v}\n`);
  console.error(`  Handoffs follow the ux-wrapup skill: pick the version (Phase 0), fold a
  legacy flat mock into a feature folder first (Phase 0.5), confirm components
  with audit-mock-vwc, write mock-definition.md + DEV-NOTES.md, copy the version
  file to dev_handoff.html at the FEATURE ROOT with comments off + flow map on,
  and let build-dashboards.js flip the card.
  Bypass for a genuine exception:  SKIP_MOCK_GUARD=1 git commit ...
`);
  process.exit(1);
}

if (checkedBuilds) {
  console.error(`  ✓ dev-handoff check passed (${checkedBuilds} new dev build(s) verified).`);
}
process.exit(0);
