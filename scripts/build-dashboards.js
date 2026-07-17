#!/usr/bin/env node
/* =========================================================================
   build-dashboards.js — regenerate each enrolled product's dashboard meta.json
   =========================================================================

   The product dashboards (designtoolbox/dashboard.js) render from a per-product
   `dashboard/meta.json`. Because the repo is private, the browser can't list
   folders — so meta.json has to carry the list. This script keeps that list (and
   more) CURRENT AUTOMATICALLY so nobody hand-maintains it:

     • Mock folders   — discovered by scanning products/<Product>/ for index.html
                        (added when created, removed when deleted/renamed).
     • Dev handoffs   — set `devHandoff` automatically when a dev_handoff.html
                        exists next to a mock's index.html (cleared when removed).
     • Recent activity — rebuilt from `git log` (date + path + commit subject).

   It is ADDITIVE / non-destructive for human-curated fields: any `title`,
   `description`, `status`, `ticket`, `ticketUrl`, or `extraLinks` already set on
   a mock in meta.json is preserved. So designers never have to touch meta.json,
   but may optionally enrich a card and the script won't clobber it.

   Usage:  node scripts/build-dashboards.js
   Runs in CI on every push (see .github/workflows/dashboards.yml) and can be run
   locally from the repo root.
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

// Products that use the shared product dashboard. Add a slug here to enroll one.
const ENROLLED = ['SafeLMS', 'Scheduling'];

// Each dashboard card now shows its OWN commit log, so we keep a deeper history
// than the old single bottom-of-page list needed — enough that every mock has a
// meaningful per-card log. The card UI caps how many it shows at once.
const MAX_RECENT = 300;

// ---------------------------------------------------------------------------
// Filesystem discovery
// ---------------------------------------------------------------------------

// Recursively collect every directory that contains an index.html, returned as
// keys relative to the product directory (forward slashes). The product's own
// `dashboard/` folder is excluded — it isn't a tracked mock.
function discoverMockKeys(productDir) {
  const keys = [];

  function walk(absDir, relParts) {
    let entries;
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }

    // A directory with an index.html is a mock (unless it's the dashboard).
    const rel = relParts.join('/');
    if (rel && rel !== 'dashboard' && entries.some(e => e.isFile() && e.name === 'index.html')) {
      keys.push(rel);
    }

    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith('.')) continue;           // skip hidden
      if (relParts.length === 0 && e.name === 'dashboard') continue; // skip dashboard subtree
      walk(path.join(absDir, e.name), relParts.concat(e.name));
    }
  }

  walk(productDir, []);
  return keys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

// Detect a dev-handoff file for a mock. Honors a custom filename if the existing
// entry specified one as a string; otherwise looks for the default.
function detectDevHandoff(productDir, key, existing) {
  const custom = (existing && typeof existing.devHandoff === 'string' && existing.devHandoff.trim())
    ? existing.devHandoff.trim()
    : null;
  const candidate = custom || 'dev_handoff.html';
  const exists = fs.existsSync(path.join(productDir, key, candidate));
  if (!exists) return null;
  return custom || true; // preserve a custom filename, else `true`
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

    const files = body.split('\n').map(f => f.trim()).filter(Boolean);
    // First changed file under this product that isn't in the dashboard folder.
    const file = files.find(f => f.startsWith(productPrefix) && !f.startsWith(productPrefix + 'dashboard/'));
    if (!file) continue; // commit only touched dashboard/ — skip

    changes.push({
      date,
      path: file.slice(productPrefix.length),
      summary: (subject || '').trim(),
    });
    if (changes.length >= MAX_RECENT) break;
  }

  return changes;
}

// ---------------------------------------------------------------------------
// Per-product build
// ---------------------------------------------------------------------------

function buildProduct(productSlug) {
  const productDir = path.join(REPO_ROOT, 'products', productSlug);
  const metaPath = path.join(productDir, 'dashboard', 'meta.json');

  if (!fs.existsSync(productDir)) {
    console.warn(`! ${productSlug}: products/${productSlug} not found — skipping.`);
    return null;
  }

  // Load existing meta to preserve human-curated fields + jiraBaseUrl.
  let prev = {};
  if (fs.existsSync(metaPath)) {
    try {
      prev = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (e) {
      console.warn(`! ${productSlug}: existing meta.json is invalid JSON — rebuilding from scratch. (${e.message})`);
      prev = {};
    }
  }
  const prevMocks = (prev && typeof prev.mocks === 'object' && prev.mocks) || {};

  const keys = discoverMockKeys(productDir);

  const mocks = {};
  for (const key of keys) {
    // Start from any curated entry so titles/descriptions/statuses survive.
    const entry = { ...(prevMocks[key] || {}) };

    // Auto-manage devHandoff based on whether the file actually exists.
    const dev = detectDevHandoff(productDir, key, prevMocks[key]);
    if (dev) entry.devHandoff = dev;
    else delete entry.devHandoff;

    mocks[key] = entry;
  }

  const meta = {
    version: 1,
    _generated: 'Auto-generated by scripts/build-dashboards.js — do not edit the folder list or recentChanges by hand. Curated per-mock fields (title/description/status/ticket/extraLinks) are preserved across regenerations.',
    jiraBaseUrl: typeof prev.jiraBaseUrl === 'string' ? prev.jiraBaseUrl : '',
    recentChanges: gitRecentChanges(productSlug),
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
    product: productSlug,
    mockCount: keys.length,
    devCount: Object.values(mocks).filter(m => m.devHandoff).length,
    recentCount: meta.recentChanges.length,
    changed: before !== json,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

let anyChanged = false;
for (const slug of ENROLLED) {
  const r = buildProduct(slug);
  if (!r) continue;
  anyChanged = anyChanged || r.changed;
  console.log(
    `${r.changed ? '✓ updated' : '· no change'}  ${r.product}: ` +
    `${r.mockCount} mocks, ${r.devCount} dev-ready, ${r.recentCount} recent changes`
  );
}

if (!anyChanged) console.log('All dashboards already up to date.');
