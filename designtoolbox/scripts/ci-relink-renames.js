#!/usr/bin/env node
/*
  ci-relink-renames.js — CI glue that auto-runs relink-comments.js when a mock
  folder/file under products/ is renamed in a push.

  WHY THIS IS SAFE FOR THE KV WRITE BUDGET
  ----------------------------------------
  KV free tier allows ~1,000 writes/day (see FEEDBACK-WIDGET.md). This script is
  designed to cost ZERO KV operations on an ordinary push:

    1. It first asks GIT whether any products/** files were RENAMED between the
       two commits. That's a local diff — no network, no KV.
    2. If nothing was renamed, it prints a note and exits. relink-comments.js is
       never invoked, so wrangler never runs and KV is never touched.
    3. Only when a real rename is found does it call relink-comments.js --apply,
       which then does exactly the writes the manual fix would have done.

  So the workflow can safely trigger on every products/** push: the common case
  (no rename) is free, and the rare case (a rename) does only the necessary work.

  USAGE (from repo root, in CI):
    node designtoolbox/scripts/ci-relink-renames.js <beforeSha> <afterSha>

  Requires wrangler auth via env: CLOUDFLARE_API_TOKEN (+ CLOUDFLARE_ACCOUNT_ID).
*/

const { execFileSync } = require('child_process');
const path = require('path');

const [beforeSha, afterSha] = process.argv.slice(2);
const RELINK = path.resolve(__dirname, 'relink-comments.js');

// Guard: a fresh branch / first push has an all-zero "before" SHA — nothing to diff.
const ZERO = /^0{40}$/;
if (!beforeSha || !afterSha || ZERO.test(beforeSha)) {
  console.log('No usable before/after SHA range (first push?) — skipping rename check. No KV ops.');
  process.exit(0);
}

// ----- 1) Ask git for renamed files under products/ (FREE — no KV) ----------
let diff;
try {
  diff = execFileSync('git', [
    'diff', '--name-status', '-M', '--diff-filter=R',
    `${beforeSha}..${afterSha}`, '--', 'products/',
  ], { encoding: 'utf8' });
} catch (e) {
  console.error('git diff failed:', String(e.stderr || e.message || e));
  process.exit(1);
}

// Parse "R100\told/path\tnew/path" lines.
const renames = [];
for (const line of diff.split('\n')) {
  if (!line.trim()) continue;
  const parts = line.split('\t');
  if (parts.length < 3 || !parts[0].startsWith('R')) continue;
  renames.push({ old: parts[1], neu: parts[2] });
}

if (!renames.length) {
  console.log('No renamed files under products/ in this push — nothing to relink. No KV ops.');
  process.exit(0);
}

// ----- 2) Collapse file renames into FOLDER-level fragment pairs -------------
// A folder rename shows up as N renamed files that all share the same one changed
// path segment. Relinking on the folder fragment (e.g. "Scheduling/old" ->
// "Scheduling/new") catches every page under it in one call — the versioned
// verN pages AND the loader's folder-form key (…/folder/), which a per-file
// path would miss. If more than one segment differs (an odd move), fall back to
// the full old->new file path so we at least relink that exact page.
function fragmentPair(oldPath, newPath) {
  const a = oldPath.split('/'), b = newPath.split('/');
  if (a.length === b.length) {
    const diffIdx = [];
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diffIdx.push(i);
    if (diffIdx.length === 1) {
      const i = diffIdx[0];
      return { from: a.slice(0, i + 1).join('/'), to: b.slice(0, i + 1).join('/') };
    }
  }
  return { from: oldPath, to: newPath };
}

const pairs = new Map(); // "from\tto" -> {from,to}
for (const r of renames) {
  const p = fragmentPair(r.old, r.neu);
  pairs.set(`${p.from}\t${p.to}`, p);
}

console.log(`Detected ${renames.length} renamed file(s) → ${pairs.size} mock rename(s) to relink:\n`);

// ----- 3) Relink each (THIS is the only step that touches KV) ----------------
let failures = 0;
for (const { from, to } of pairs.values()) {
  console.log(`\n=== relink: "${from}"  ->  "${to}" ===`);
  try {
    execFileSync('node', [RELINK, '--from', from, '--to', to, '--apply'], { stdio: 'inherit' });
  } catch (e) {
    failures++;
    console.error(`relink failed for "${from}" -> "${to}" (exit ${e.status ?? '?'})`);
  }
}

if (failures) { console.error(`\n${failures} relink(s) failed.`); process.exit(1); }
console.log('\nAll renames relinked.');
