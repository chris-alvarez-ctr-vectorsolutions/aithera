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

   It runs in CI from .github/workflows/dashboards.yml (the same job that
   regenerates meta.json), and the changes ride the existing silent
   "[skip ci]" bot commit — no failed runs, no warning emails. Renames that
   cross product folders, or deletions, can't be auto-fixed and are only
   logged to the job output.

   Usage:  node scripts/relink-catalog.js <base-ref> <head-ref>
   Exits 0 always; prints what it relinked.
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const [baseRef, headRef] = process.argv.slice(2);

if (!baseRef || !headRef) {
  console.error('usage: node scripts/relink-catalog.js <base-ref> <head-ref>');
  process.exit(1);
}

function git(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// refuse quietly when the base is unknown (first push / force push)
try { git(['cat-file', '-e', `${baseRef}^{commit}`]); }
catch { console.log(`relink-catalog: base ref ${baseRef} not found — nothing to do.`); process.exit(0); }

// ---------------------------------------------------------------------------
// 1. Renames in the range (old repo-relative path -> new repo-relative path)
// ---------------------------------------------------------------------------

const renames = new Map();
for (const line of git(['diff', '-M', '--diff-filter=R', '--name-status', `${baseRef}..${headRef}`]).split('\n')) {
  const parts = line.split('\t');
  if (parts.length === 3 && parts[0].startsWith('R') && parts[1].startsWith('products/')) {
    renames.set(parts[1], parts[2]);
  }
}

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
    if (changed) fs.writeFileSync(path.join(REPO_ROOT, p), JSON.stringify(versions, null, 2) + '\n');
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
