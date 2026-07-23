#!/usr/bin/env node
/* =========================================================================
   build-dashboards.js — regenerate each enrolled product's dashboard meta.json
   =========================================================================

   The product dashboards (designtoolbox/dashboard.js) render from a per-product
   `dashboard/meta.json`. Because the repo is private, the browser can't list
   folders — so meta.json has to carry the list. This script regenerates every
   enrolled product's meta.json from the CURATED source, `products.json` at the
   repo root, so nobody hand-maintains meta.json:

     • Mock list      — the prototypes listed for each product in products.json
                        (rel key + name + optional jira/status). products.json is
                        also what the landing page renders, so cards and dashboards
                        always agree.
     • Dev handoffs   — set `devHandoff` automatically when a dev_handoff.html
                        exists in a folder mock (cleared when removed).
     • Recent activity — rebuilt from `git log` (date + path + commit subject).

   meta.json is fully derived — DO NOT hand-edit it. To add/rename/retitle a
   prototype, or set a status, edit products.json; the change flows to both the
   product card and the dashboard on the next push.

   Usage:  node scripts/build-dashboards.js
   Runs in CI on every push (see .github/workflows/dashboards.yml) and can be run
   locally from the repo root.
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

// The curated prototype list lives in products.json at the repo root — the SINGLE
// source of truth shared by the landing page (index.html) and every dashboard.
// Every product listed there gets a dashboard; add/rename a prototype in one
// place and both the landing card and its dashboard update on the next push.
const PRODUCTS_JSON = path.join(REPO_ROOT, 'products.json');

// Each dashboard card now shows its OWN commit log, so we keep a deeper history
// than the old single bottom-of-page list needed — enough that every mock has a
// meaningful per-card log. The card UI caps how many it shows at once.
const MAX_RECENT = 300;

// ---------------------------------------------------------------------------
// Curated list (products.json)
// ---------------------------------------------------------------------------

// Flatten a product's items (which may contain `folder` groups) into the leaf
// prototypes, preserving each one's curated fields. Returns [{ rel, name, jira,
// status }]. `rel` is the mock key: "." for the product root, "foo" for a folder
// mock, or "path/foo.html" for a standalone-file mock.
//
// Each leaf also carries `_folder`: the path of enclosing curated `folder`
// groups as an ARRAY of display names (["Phase 2", "Content Workflow"]), or
// null when the mock sits at the product's top level. It stays an array all
// the way into meta.json — folder names may themselves contain " / " (e.g.
// "AI Chat Widget (Vectoria / Fin)"), so a joined string would be ambiguous.
// The dashboard renders these paths as a collapsible folder tree.
function flattenItems(items, folderPath = []) {
  const out = [];
  for (const it of items || []) {
    if (it && Array.isArray(it.items)) {
      const next = it.folder ? folderPath.concat(it.folder) : folderPath;
      out.push(...flattenItems(it.items, next));
    } else if (it && it.rel) {
      out.push({ ...it, _folder: folderPath.length ? folderPath.slice() : null });
    }
  }
  return out;
}

// Detect a dev-handoff file for a mock — the artifact the dev-handoff process
// produces. Only folder-style mocks (product root "." or a folder key) can have
// one; standalone-file mocks (rel ends in .html) never do.
function detectDevHandoff(productDir, rel) {
  if (rel.endsWith('.html')) return null;
  const dir = rel === '.' ? productDir : path.join(productDir, rel);
  const candidate = 'dev_handoff.html';
  return fs.existsSync(path.join(dir, candidate)) ? true : null;
}

// ---------------------------------------------------------------------------
// Git-derived recent activity
// ---------------------------------------------------------------------------

const SEP_REC = ''; // record separator
const SEP_FLD = ''; // field separator

function gitRecentChanges(productSlug) {
  const productPrefix = `products/${productSlug}/`;
  let out;
  try {
    out = execFileSync('git', [
      'log',
      '--no-merges',
      '-n', '400',
      '--date=iso-strict',
      `--pretty=format:${SEP_REC}%ad${SEP_FLD}%s`,
      '--name-only',
      '--', `products/${productSlug}`,
    ], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch {
    return []; // no git history available (e.g. shallow checkout) — degrade gracefully
  }

  const changes = [];
  const records = out.split(SEP_REC).map(r => r.trim()).filter(Boolean);

  for (const rec of records) {
    const nl = rec.indexOf('\n');
    const head = nl === -1 ? rec : rec.slice(0, nl);
    const body = nl === -1 ? '' : rec.slice(nl + 1);
    const [date, subject] = head.split(SEP_FLD);
    if (!date) continue;

    // Skip automated dashboard-maintenance commits — they aren't real design
    // activity and would otherwise flood the log (and falsely trigger the
    // "recently updated" highlight). Covers the build script's own regenerate
    // commits and anything tagged [skip ci].
    const subj = (subject || '').trim();
    if (/^chore\(dashboards\)/i.test(subj) || /\[skip ci\]/i.test(subj)) continue;

    const files = body.split('\n').map(f => f.trim()).filter(Boolean);
    // Every changed file under this product that isn't in the dashboard folder.
    // One entry per file so a commit touching several mocks credits ALL of them
    // (the dashboard dedupes same-commit rows within a single card's log).
    const matched = files.filter(f => f.startsWith(productPrefix) && !f.startsWith(productPrefix + 'dashboard/'));
    if (!matched.length) continue; // commit only touched dashboard/ — skip

    for (const file of matched) {
      changes.push({
        date,
        path: file.slice(productPrefix.length),
        summary: subj,
      });
      if (changes.length >= MAX_RECENT) break;
    }
    if (changes.length >= MAX_RECENT) break;
  }

  return changes;
}

// ---------------------------------------------------------------------------
// Per-product build
// ---------------------------------------------------------------------------

function buildProduct(product, jiraBase) {
  const folder = product.folder;
  const productDir = path.join(REPO_ROOT, 'products', folder);
  const metaPath = path.join(productDir, 'dashboard', 'meta.json');

  if (!fs.existsSync(productDir)) {
    console.warn(`! ${folder}: products/${folder} not found — skipping.`);
    return null;
  }

  // Build the mock map straight from the curated items — products.json is the
  // source of truth for the list, titles, tickets, and any hand-set status.
  const mocks = {};
  for (const it of flattenItems(product.items)) {
    const entry = {};
    if (it.name) entry.title = it.name;
    if (it.desc) entry.description = it.desc;
    if (it._folder) entry.folder = it._folder;
    if (it.jira) entry.ticket = it.jira;
    if (it.status) entry.status = it.status;
    // Curated last-modified date — the dashboard's fallback when no commit in
    // recentChanges can be attributed to this mock.
    if (it.modified) entry.modified = it.modified;

    // Auto-manage devHandoff from the file actually present on disk.
    const dev = detectDevHandoff(productDir, it.rel);
    if (dev) entry.devHandoff = dev;

    mocks[it.rel] = entry;
  }

  const meta = {
    version: 1,
    _generated: 'Auto-generated by scripts/build-dashboards.js from products.json (the curated source). Do not edit by hand — edit products.json instead.',
    jiraBaseUrl: jiraBase || '',
    recentChanges: gitRecentChanges(folder),
    mocks,
  };

  const json = JSON.stringify(meta, null, 2) + '\n';
  const existed = fs.existsSync(metaPath);
  const before = existed ? fs.readFileSync(metaPath, 'utf8') : '';
  if (before !== json) {
    fs.mkdirSync(path.dirname(metaPath), { recursive: true });
    fs.writeFileSync(metaPath, json);
  }

  return {
    product: folder,
    mockCount: Object.keys(mocks).length,
    devCount: Object.values(mocks).filter(m => m.devHandoff).length,
    recentCount: meta.recentChanges.length,
    changed: before !== json,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

let catalog;
try {
  catalog = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
} catch (e) {
  console.error(`Could not read products.json at ${PRODUCTS_JSON}: ${e.message}`);
  process.exit(1);
}
const jiraBase = typeof catalog.jiraBase === 'string' ? catalog.jiraBase : '';
const productList = Array.isArray(catalog.products) ? catalog.products : [];

let anyChanged = false;
for (const product of productList) {
  if (!product || !product.folder) continue;
  const r = buildProduct(product, jiraBase);
  if (!r) continue;
  anyChanged = anyChanged || r.changed;
  console.log(
    `${r.changed ? '✓ updated' : '· no change'}  ${r.product}: ` +
    `${r.mockCount} mocks, ${r.devCount} dev-ready, ${r.recentCount} recent changes`
  );
}

if (!anyChanged) console.log('All dashboards already up to date.');
