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

   A link is BROKEN when:
     • a products.json `rel` doesn't resolve to a real file —
         rel "."           → products/<folder>/index.html
         rel "…/foo.html"  → products/<folder>/…/foo.html
         rel "feature"     → products/<folder>/feature/index.html
     • any versions.json under products/ lists a `path` that doesn't exist
       in its feature folder.

   GRANDFATHERING (--grandfather <ref>): only breakage that is NEW relative
   to <ref> fails the check. Dead links that were already dead at <ref> are
   reported as warnings and never block — so one person's stale rename can't
   red-X everyone else's pushes. The push that INTRODUCES a dead link still
   fails, which is the signal to fix products.json in the same change.

   Runs from the pre-commit hook only (Guard A, with check-mock-structure.sh,
   grandfathered against HEAD) — it no longer runs or fails in CI. In CI,
   renamed files are relinked automatically instead (scripts/relink-catalog.js
   in the dashboards workflow). Bypass, if you truly must commit a dangling
   link: SKIP_MOCK_GUARD=1 git commit ...

   Usage:  node scripts/check-catalog-links.js [--grandfather <git-ref>]
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const PRODUCTS_DIR = 'products';

// ---------------------------------------------------------------------------
// Worlds — the same checks run against the live filesystem (the state being
// committed/pushed) and, for grandfathering, against a past git ref.
// ---------------------------------------------------------------------------

function liveWorld() {
  return {
    exists: (rel) => fs.existsSync(path.join(REPO_ROOT, rel)),
    readFile: (rel) => {
      try { return fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'); }
      catch { return null; }
    },
    versionManifests: () => {
      const out = [];
      (function walk(rel) {
        let entries;
        try { entries = fs.readdirSync(path.join(REPO_ROOT, rel), { withFileTypes: true }); }
        catch { return; }
        for (const e of entries) {
          const p = `${rel}/${e.name}`;
          if (e.isDirectory()) walk(p);
          else if (e.name === 'versions.json') out.push(p);
        }
      })(PRODUCTS_DIR);
      return out;
    },
  };
}

function gitWorld(ref) {
  const ls = execFileSync('git', ['ls-tree', '-r', '--name-only', ref], {
    cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  const files = new Set(ls.split('\n').filter(Boolean));
  return {
    exists: (rel) => files.has(rel),
    readFile: (rel) => {
      if (!files.has(rel)) return null;
      try {
        return execFileSync('git', ['show', `${ref}:${rel}`], {
          cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
        });
      } catch { return null; }
    },
    versionManifests: () =>
      [...files].filter((f) => f.startsWith(`${PRODUCTS_DIR}/`) && f.endsWith('/versions.json')),
  };
}

// ---------------------------------------------------------------------------
// The checks — return problems as { msg, target } where target is the
// repo-relative missing path (the stable key used for grandfathering).
// ---------------------------------------------------------------------------

function flattenItems(items, out = []) {
  for (const it of items || []) {
    if (it && Array.isArray(it.items)) flattenItems(it.items, out);
    else if (it && it.rel) out.push(it);
  }
  return out;
}

function collectProblems(world) {
  const problems = [];

  // 1. products.json rel targets
  const rawCatalog = world.readFile('products.json');
  if (rawCatalog == null) {
    problems.push({ msg: 'products.json: file not found', target: 'products.json' });
    return problems;
  }
  let catalog;
  try { catalog = JSON.parse(rawCatalog); }
  catch (e) {
    problems.push({ msg: `products.json: unparseable JSON (${e.message})`, target: 'products.json:parse' });
    return problems;
  }

  for (const product of catalog.products || []) {
    if (!product || !product.folder) continue;
    for (const it of flattenItems(product.items)) {
      const rel = it.rel;
      const target = rel === '.'
        ? `${PRODUCTS_DIR}/${product.folder}/index.html`
        : rel.endsWith('.html')
          ? `${PRODUCTS_DIR}/${product.folder}/${rel}`
          : `${PRODUCTS_DIR}/${product.folder}/${rel}/index.html`;
      if (!world.exists(target)) {
        problems.push({
          msg: `products.json → "${it.name || rel}" (product "${product.folder}"): rel "${rel}" → missing ${target}`,
          target,
        });
      }
    }
  }

  // 2. versions.json manifests — every version path must exist
  for (const manifest of world.versionManifests()) {
    const raw = world.readFile(manifest);
    let versions;
    try { versions = JSON.parse(raw); }
    catch (err) {
      problems.push({ msg: `${manifest}: unparseable JSON (${err.message})`, target: `${manifest}:parse` });
      continue;
    }
    const dir = path.posix.dirname(manifest);
    for (const v of Array.isArray(versions) ? versions : []) {
      if (!v || !v.path) continue;
      const target = `${dir}/${v.path}`;
      if (!world.exists(target)) {
        problems.push({ msg: `${manifest}: version "${v.id || v.label}" → missing ${v.path}`, target });
      }
    }
  }

  return problems;
}

// ---------------------------------------------------------------------------
// Run: check the live state; with --grandfather, demote pre-existing
// breakage to warnings so only NEW breakage blocks.
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
let grandfatherRef = null;
const gfIdx = args.indexOf('--grandfather');
if (gfIdx !== -1) grandfatherRef = args[gfIdx + 1] || null;

const problems = collectProblems(liveWorld());

let grandfathered = new Set();
if (grandfatherRef && problems.length) {
  try {
    execFileSync('git', ['cat-file', '-e', `${grandfatherRef}^{commit}`], { cwd: REPO_ROOT });
    grandfathered = new Set(collectProblems(gitWorld(grandfatherRef)).map((p) => p.target));
  } catch {
    console.error(`  ⚠ --grandfather ref "${grandfatherRef}" not found; treating all problems as new.`);
  }
}

const fresh = problems.filter((p) => !grandfathered.has(p.target));
const legacy = problems.filter((p) => grandfathered.has(p.target));

if (legacy.length) {
  console.error('\n  ⚠ pre-existing dead link(s) — grandfathered, NOT blocking this change');
  console.error('    (they were already broken before it; fix products.json / versions.json when convenient):\n');
  for (const p of legacy) {
    console.error(`  ⚠ ${p.msg}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::warning::Pre-existing dead catalog link: ${p.msg}`);
  }
  console.error('');
}

if (fresh.length) {
  console.error('\n  ✋ BLOCKED — this change introduces dashboard/loader link(s) that don\'t resolve:\n');
  for (const p of fresh) {
    console.error(`  ✗ ${p.msg}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error::Dead catalog link introduced: ${p.msg}`);
  }
  console.error(
    '\n  If you moved or renamed a mock, update its `rel` in products.json (and\n' +
    '  any versions.json path) in the SAME change — the dashboards and landing\n' +
    '  page render these links directly. Old shared URLs still 404 for anyone\n' +
    '  holding them; re-share the new link. Comments relink automatically in CI.\n'
  );
  process.exit(1);
}

console.log(
  legacy.length
    ? `✓ no NEW dead links (${legacy.length} pre-existing grandfathered — see warnings above).`
    : '✓ catalog links OK — every products.json rel and versions.json path resolves.'
);
