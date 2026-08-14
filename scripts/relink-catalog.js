#!/usr/bin/env node
/* =========================================================================
   relink-catalog.js — when a mock file is renamed/moved, follow the rename
   in products.json and versions.json automatically.
   =========================================================================

   The product dashboards and feature loaders render links straight from
   products.json / versions.json. Renaming a mock file used to leave those
   entries pointing at the old path (a dead card) until someone edited the
   catalog by hand. This script makes the catalog self-healing:

     1. Ask git which files under products/ were RENAMED between two commits
        (git diff -M --diff-filter=R, so moves across folders count too).
     2. Rewrite every products.json `rel` and versions.json `path` that
        resolved to an old name so it points at the new one.

   It runs in two places, both auto-fixing renames instead of blocking:
     • CI from .github/workflows/dashboards.yml (the same job that regenerates
       meta.json), over the pushed range — the changes ride the existing
       silent "[skip ci]" bot commit.
     • The local pre-commit hook in `--staged` mode, over the STAGED index —
       it rewrites the catalog and `git add`s the fix so it joins the commit
       being made, so a rename never blocks the commit.
   Renames that cross product folders, or deletions, can't be auto-fixed and
   are only logged (the hook's warn-only link check surfaces those).

   Usage:
     node scripts/relink-catalog.js <base-ref> <head-ref>   # CI: a commit range
     node scripts/relink-catalog.js --staged                # pre-commit: index vs HEAD
     node scripts/relink-catalog.js --heal                  # CI safety net: fix ANY
                                                            # dangling catalog link by
                                                            # chasing git rename history

   HEAL MODE (the bulletproof net): the range/staged modes above only follow a
   rename that Git pairs WITHIN the scanned commits. A folder renamed in Finder
   whose rename Git didn't detect, or one that landed outside the scanned range,
   can still leave a card pointing at a path that no longer exists. --heal fixes
   that after the fact: for every products.json `rel` / versions.json `path` that
   does NOT resolve on disk, it walks the FULL git rename history (reachable from
   HEAD) to find where that file was renamed to, and rewrites the entry to the
   live path. It only ever touches links that are already broken, and only to a
   destination git actually recorded a rename to — so it cannot mis-link a
   working card. Silent and non-failing by design: it exits 0 no matter what and
   emits at most a `::notice::` (never a warning/error), so it never turns a
   green run red or sends a workflow-failure email.

   Exits 0 always; prints what it relinked.
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const stagedMode = argv[0] === '--staged';
const healMode = argv[0] === '--heal';
const [baseRef, headRef] = (stagedMode || healMode) ? [] : argv;

if (!stagedMode && !healMode && (!baseRef || !headRef)) {
  console.error('usage: node scripts/relink-catalog.js <base-ref> <head-ref>  |  --staged  |  --heal');
  process.exit(1);
}

function git(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// --heal is a self-contained pass (see runHeal at the bottom). It never throws
// out and always exits 0, so it can't fail a CI step or trigger a run-failure
// email — exactly what "fix it silently" needs.
if (healMode) {
  try { runHeal(); }
  catch (e) { console.log(`relink-catalog --heal: skipped (${e.message}).`); }
  process.exit(0);
}

// Range mode only: refuse quietly when the base is unknown (first push / force push).
if (!stagedMode) {
  try { git(['cat-file', '-e', `${baseRef}^{commit}`]); }
  catch { console.log(`relink-catalog: base ref ${baseRef} not found — nothing to do.`); process.exit(0); }
}

// ---------------------------------------------------------------------------
// 1. Renames (old repo-relative path -> new repo-relative path). Range mode
//    diffs base..head; staged mode diffs HEAD against the index (--cached),
//    so a rename staged for the current commit is followed before it lands.
// ---------------------------------------------------------------------------

const diffArgs = stagedMode
  ? ['diff', '-M', '--diff-filter=R', '--name-status', '--cached']
  : ['diff', '-M', '--diff-filter=R', '--name-status', `${baseRef}..${headRef}`];

const renames = new Map();
for (const line of git(diffArgs).split('\n')) {
  const parts = line.split('\t');
  if (parts.length === 3 && parts[0].startsWith('R') && parts[1].startsWith('products/')) {
    renames.set(parts[1], parts[2]);
  }
}

// Files this run rewrote — in staged mode they get re-added so the fix is
// part of the commit being made.
const changedFiles = [];

if (!renames.size) {
  console.log('relink-catalog: no renames under products/ in this push — nothing to do.');
  process.exit(0);
}

const relinked = [];
const unfixable = [];

// ---------------------------------------------------------------------------
// 2. products.json rels — resolve each rel the same way the dashboards do,
//    and if its target was renamed, rewrite the rel to the new location.
// ---------------------------------------------------------------------------

function flattenItems(items, out = []) {
  for (const it of items || []) {
    if (it && Array.isArray(it.items)) flattenItems(it.items, out);
    else if (it && it.rel) out.push(it);
  }
  return out;
}

const catalogPath = path.join(REPO_ROOT, 'products.json');
const catalogRaw = fs.readFileSync(catalogPath, 'utf8');
const catalog = JSON.parse(catalogRaw);
let catalogChanged = false;

for (const product of catalog.products || []) {
  if (!product || !product.folder) continue;
  const productPrefix = `products/${product.folder}/`;
  for (const it of flattenItems(product.items)) {
    const rel = it.rel;
    const target = rel === '.'
      ? `${productPrefix}index.html`
      : rel.endsWith('.html')
        ? `${productPrefix}${rel}`
        : `${productPrefix}${rel}/index.html`;
    const moved = renames.get(target);
    if (!moved) continue;
    if (!moved.startsWith(productPrefix)) {
      unfixable.push(`products.json "${it.name || rel}": ${target} moved OUTSIDE product "${product.folder}" (→ ${moved}) — update by hand.`);
      continue;
    }
    let newRel = moved.slice(productPrefix.length);
    // keep the folder-style rel form when the target is a folder's index.html
    if (newRel.endsWith('/index.html')) newRel = newRel.slice(0, -'/index.html'.length);
    else if (newRel === 'index.html') newRel = '.';
    relinked.push(`products.json "${it.name || rel}": rel "${it.rel}" → "${newRel}"`);
    it.rel = newRel;
    catalogChanged = true;
  }
}

if (catalogChanged) {
  // preserve the file's 2-space formatting
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  changedFiles.push('products.json');
}

// ---------------------------------------------------------------------------
// 3. versions.json paths — same idea inside each feature folder.
// ---------------------------------------------------------------------------

(function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(path.join(REPO_ROOT, dir), { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) { walk(p); continue; }
    if (e.name !== 'versions.json') continue;
    let versions;
    try { versions = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, p), 'utf8')); }
    catch { continue; }
    if (!Array.isArray(versions)) continue;
    let changed = false;
    for (const v of versions) {
      if (!v || !v.path) continue;
      const moved = renames.get(`${dir}/${v.path}`);
      if (!moved) continue;
      if (!moved.startsWith(`${dir}/`)) {
        unfixable.push(`${p} "${v.id || v.label}": target moved outside the feature folder (→ ${moved}) — update by hand.`);
        continue;
      }
      const newPath = moved.slice(dir.length + 1);
      relinked.push(`${p} "${v.id || v.label}": path "${v.path}" → "${newPath}"`);
      v.path = newPath;
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(path.join(REPO_ROOT, p), JSON.stringify(versions, null, 2) + '\n');
      changedFiles.push(p);
    }
  }
})('products');

// ---------------------------------------------------------------------------

if (relinked.length) {
  console.log(`relink-catalog: followed ${renames.size} rename(s), updated ${relinked.length} catalog link(s):`);
  for (const r of relinked) console.log(`  ✎ ${r}`);
} else {
  console.log(`relink-catalog: ${renames.size} rename(s) in push, but no catalog entry pointed at them — nothing to update.`);
}
for (const u of unfixable) {
  console.log(`  ⚠ ${u}`);
  if (process.env.GITHUB_ACTIONS) console.log(`::notice::relink-catalog could not auto-fix: ${u}`);
}

// Staged mode: re-stage the rewritten catalog files so the relink is part of
// the very commit that carried the rename — the commit self-heals, no block.
if (stagedMode && changedFiles.length) {
  try {
    git(['add', '--', ...changedFiles]);
    console.log(`relink-catalog: re-staged ${changedFiles.join(', ')} into this commit.`);
  } catch (e) {
    console.error(`relink-catalog: could not re-stage relinked files (${e.message}).`);
  }
}

// ===========================================================================
// --heal — full-history safety net (see the header's HEAD MODE note).
// ===========================================================================
//
// Fixes any catalog link that no longer resolves on disk by chasing git's
// rename history to the file's current path. Reuses flattenItems (hoisted) and
// the same rel→target resolution the dashboards use. Only rewrites links that
// are ALREADY broken, and only to a path git recorded a rename to — so it can
// never mis-link a working card. Writes products.json / versions.json in place;
// the CI job's own commit step picks the changes up.
function runHeal() {
  // Full rename graph reachable from HEAD: source path -> the path it became.
  // `git log` is newest-first, so first-seen per source is the most recent
  // rename of that path. Chains (a→b→c) are followed at lookup time.
  const graph = new Map();
  const logOut = git(['log', '--diff-filter=R', '-M', '--name-status', '--format=']);
  for (const line of logOut.split('\n')) {
    const parts = line.split('\t');
    if (parts.length === 3 && parts[0][0] === 'R' && parts[1].startsWith('products/')) {
      if (!graph.has(parts[1])) graph.set(parts[1], parts[2]);
    }
  }
  if (!graph.size) { console.log('relink-catalog --heal: no renames in history — nothing to do.'); return; }

  const existsOnDisk = (rel) => fs.existsSync(path.join(REPO_ROOT, rel));

  // Walk the rename chain from a now-missing path to a file that exists on disk.
  // Returns the live destination, or null if the trail doesn't end at a real
  // file (then we leave the link untouched rather than guess).
  function chase(startTarget) {
    let cur = startTarget;
    const seen = new Set();
    while (graph.has(cur) && !seen.has(cur)) {
      seen.add(cur);
      cur = graph.get(cur);
      if (existsOnDisk(cur)) return cur;
    }
    return null;
  }

  const relinked = [];
  const notices = [];

  // ---- products.json rels ----
  const catalogPath = path.join(REPO_ROOT, 'products.json');
  let catalog = null;
  try { catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')); } catch { /* leave alone */ }
  if (catalog) {
    let catalogChanged = false;
    for (const product of catalog.products || []) {
      if (!product || !product.folder) continue;
      const productPrefix = `products/${product.folder}/`;
      for (const it of flattenItems(product.items)) {
        const rel = it.rel;
        const target = rel === '.'
          ? `${productPrefix}index.html`
          : rel.endsWith('.html')
            ? `${productPrefix}${rel}`
            : `${productPrefix}${rel}/index.html`;
        if (existsOnDisk(target)) continue;            // link works — nothing to heal
        const dest = chase(target);
        if (!dest) continue;                            // no recorded rename to a live file — leave quietly
        if (!dest.startsWith(productPrefix)) {
          // moved to a different product — automation can't own the rel across
          // products (a human must). Informational only; never a warning/error.
          notices.push(`products.json "${it.name || rel}": ${target} moved to another product (${dest}) — update by hand.`);
          continue;
        }
        let newRel = dest.slice(productPrefix.length);
        if (newRel.endsWith('/index.html')) newRel = newRel.slice(0, -'/index.html'.length);
        else if (newRel === 'index.html') newRel = '.';
        relinked.push(`products.json "${it.name || rel}": rel "${it.rel}" → "${newRel}"`);
        it.rel = newRel;
        catalogChanged = true;
      }
    }
    if (catalogChanged) fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  }

  // ---- versions.json paths ----
  (function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(path.join(REPO_ROOT, dir), { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) { walk(p); continue; }
      if (e.name !== 'versions.json') continue;
      let versions;
      try { versions = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, p), 'utf8')); } catch { continue; }
      if (!Array.isArray(versions)) continue;
      let changed = false;
      for (const v of versions) {
        if (!v || !v.path) continue;
        const target = `${dir}/${v.path}`;
        if (existsOnDisk(target)) continue;
        const dest = chase(target);
        if (!dest || !dest.startsWith(`${dir}/`)) continue;
        const newPath = dest.slice(dir.length + 1);
        relinked.push(`${p} "${v.id || v.label}": path "${v.path}" → "${newPath}"`);
        v.path = newPath;
        changed = true;
      }
      if (changed) fs.writeFileSync(path.join(REPO_ROOT, p), JSON.stringify(versions, null, 2) + '\n');
    }
  })('products');

  if (relinked.length) {
    console.log(`relink-catalog --heal: healed ${relinked.length} dangling catalog link(s):`);
    for (const r of relinked) console.log(`  ✎ ${r}`);
  } else {
    console.log('relink-catalog --heal: no dangling catalog links to heal.');
  }
  for (const n of notices) {
    console.log(`  · ${n}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::notice::relink-catalog: ${n}`);
  }
}
