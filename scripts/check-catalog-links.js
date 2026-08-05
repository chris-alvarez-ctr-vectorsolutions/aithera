#!/usr/bin/env node
/* =========================================================================
   check-catalog-links.js — no dashboard or loader link may point at a
   file that doesn't exist.
   =========================================================================

   The product dashboards and the landing page both render links straight
   from products.json (via the generated meta.json), and every feature
   loader renders from its versions.json. When a mock is moved, renamed, or
   restructured into verN/ folders, any entry left pointing at the old path
   becomes a silent 404 on the live site — the card still renders, the link
   is just dead. (This happened when the Keystone hub pages moved into
   ver1/: the Agency Intelligence card 404'd until products.json caught up.)

   This guard fails when:
     • a products.json `rel` doesn't resolve to a real file —
         rel "."           → products/<folder>/index.html
         rel "…/foo.html"  → products/<folder>/…/foo.html
         rel "feature"     → products/<folder>/feature/index.html
     • any versions.json under products/ lists a `path` that doesn't exist
       in its feature folder.

   Runs from the pre-commit hook (Guard A, with check-mock-structure.sh) and
   in CI (.github/workflows/check-mock-structure.yml). Bypass, if you truly
   must commit a dangling link: SKIP_MOCK_GUARD=1 git commit ...

   Usage:  node scripts/check-catalog-links.js
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const PRODUCTS_DIR = path.join(REPO_ROOT, 'products');

const problems = [];

// ---------------------------------------------------------------------------
// 1. products.json rel targets
// ---------------------------------------------------------------------------

function flattenItems(items, out = []) {
  for (const it of items || []) {
    if (it && Array.isArray(it.items)) flattenItems(it.items, out);
    else if (it && it.rel) out.push(it);
  }
  return out;
}

let catalog;
try {
  catalog = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'products.json'), 'utf8'));
} catch (e) {
  console.error(`✗ Could not read products.json: ${e.message}`);
  process.exit(1);
}

for (const product of catalog.products || []) {
  if (!product || !product.folder) continue;
  const productDir = path.join(PRODUCTS_DIR, product.folder);
  for (const it of flattenItems(product.items)) {
    const rel = it.rel;
    const target = rel === '.'
      ? path.join(productDir, 'index.html')
      : rel.endsWith('.html')
        ? path.join(productDir, rel)
        : path.join(productDir, rel, 'index.html');
    if (!fs.existsSync(target)) {
      problems.push(
        `products.json → "${it.name || rel}" (product "${product.folder}"): ` +
        `rel "${rel}" → missing ${path.relative(REPO_ROOT, target)}`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. versions.json manifests — every version path must exist
// ---------------------------------------------------------------------------

function walkForManifests(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkForManifests(p);
    else if (e.name === 'versions.json') {
      let versions;
      try { versions = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (err) {
        problems.push(`${path.relative(REPO_ROOT, p)}: unparseable JSON (${err.message})`);
        continue;
      }
      for (const v of Array.isArray(versions) ? versions : []) {
        if (!v || !v.path) continue;
        if (!fs.existsSync(path.join(dir, v.path))) {
          problems.push(
            `${path.relative(REPO_ROOT, p)}: version "${v.id || v.label}" ` +
            `→ missing ${v.path}`
          );
        }
      }
    }
  }
}
walkForManifests(PRODUCTS_DIR);

// ---------------------------------------------------------------------------

if (problems.length) {
  console.error('\n  ✋ BLOCKED — dashboard/loader link(s) point at files that don\'t exist:\n');
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error(
    '\n  If you moved or renamed a mock, update its `rel` in products.json (and\n' +
    '  any versions.json path) in the SAME change — the dashboards and landing\n' +
    '  page render these links directly. Old shared URLs still 404 for anyone\n' +
    '  holding them; re-share the new link. Comments relink automatically in CI.\n'
  );
  process.exit(1);
}

console.log('✓ catalog links OK — every products.json rel and versions.json path resolves.');
