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
                        exists in a folder mock (cleared when removed), plus a
                        `handoff` record: when it was handed off (the commit
                        that added the file), when it was last re-synced, and
                        which version (the file's DEV-HANDOFF marker). The card
                        uses it for "Changed since handoff". Nothing locks.
     • Review doc     — `reviewDoc` when a mock-definition.md sits at the
                        feature root (In Review / Ready for Dev cards link it).
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

// Handoff record for a dev build. A handoff is a timestamped checkpoint, not a
// lock: the date comes from git (the most recent commit that ADDED the file, so
// a delete + re-add counts as a fresh handoff), `syncedAt` is the last commit
// that touched it (a re-sync after a post-handoff fix), and the version comes
// from the `<!-- DEV-HANDOFF version="ver1" label="V1" -->` marker the ux-wrapup
// skill writes into the build. Older builds have no marker; the card then just
// omits the version.
function gitDate(args) {
  try {
    const out = execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    return out.split('\n')[0] || null;
  } catch { return null; }
}
function detectHandoff(productDir, rel) {
  const file = path.join(productDir, rel === '.' ? '' : rel, 'dev_handoff.html');
  const relPath = path.relative(REPO_ROOT, file);
  const rec = {};
  const at = gitDate(['log', '--diff-filter=A', '-n', '1', '--date=iso-strict', '--format=%ad', '--', relPath]);
  const synced = gitDate(['log', '-n', '1', '--date=iso-strict', '--format=%ad', '--', relPath]);
  if (at) rec.at = at;
  if (synced && synced !== at) rec.syncedAt = synced;
  try {
    const head = fs.readFileSync(file, 'utf8').slice(0, 4000);
    const m = head.match(/<!--\s*DEV-HANDOFF\b([^>]*)-->/i);
    if (m) {
      const v = m[1].match(/version\s*=\s*"([^"]+)"/i);
      const l = m[1].match(/label\s*=\s*"([^"]+)"/i);
      if (v) rec.version = v[1];
      if (l) rec.label = l[1];
    }
  } catch { /* unreadable — leave the version off */ }

  // Every commit to the mock after the handoff, read from the mock's OWN git
  // history (the product-wide recentChanges window is capped and can end
  // before an older handoff). Also flag when a design file moved past the dev
  // build's last sync: docs and the dev build don't count, and when the marker
  // names a version only that version's folder does — a new spun-off version
  // doesn't make the handed-off build stale.
  if (rec.at) {
    const featureRel = path.relative(REPO_ROOT, path.dirname(file));
    const atMs = Date.parse(rec.at);
    const syncMs = Date.parse(rec.syncedAt || rec.at);
    // No marker (builds from before it existed): infer the version from the
    // verN/ folder committed alongside the dev build's latest sync. If that
    // isn't unambiguous, skip the "behind" warning rather than risk a false one.
    let ver = rec.version || null;
    if (!ver) {
      try {
        const files = execFileSync('git', ['log', '-n', '1', '--format=', '--name-only', '--', relPath],
          { cwd: REPO_ROOT, encoding: 'utf8' }).split('\n').map(f => f.trim()).filter(Boolean);
        const vers = [...new Set(files
          .filter(f => f.startsWith(featureRel + '/'))
          .map(f => f.slice(featureRel.length + 1).split('/'))
          .filter(parts => parts.length > 1 && /^ver[\w.-]*$/i.test(parts[0]))
          .map(parts => parts[0]))];
        if (vers.length === 1) ver = vers[0];
      } catch { /* leave it unknown */ }
    }
    if (!ver) {
      // A feature with exactly one version was necessarily handed off from it.
      try {
        const list = JSON.parse(fs.readFileSync(path.join(path.dirname(file), 'versions.json'), 'utf8'));
        if (Array.isArray(list) && list.length === 1 && list[0].path) {
          const seg = String(list[0].path).split('/')[0];
          if (seg && seg !== list[0].path) ver = seg;
        }
      } catch { /* no versions.json */ }
    }
    const hasVersions = fs.existsSync(path.join(path.dirname(file), 'versions.json'));
    const verPrefix = ver ? `${featureRel}/${ver}/` : null;
    const isDoc = f => /(^|\/)(dev_handoff[^/]*\.html|[^/]*\.md|versions\.json)$/i.test(f);
    let out = '';
    try {
      out = execFileSync('git', ['log', '--no-merges', '--date=iso-strict',
        `--pretty=format:${SEP_REC}%ad${SEP_FLD}%s`, '--name-status', '-M', '--', featureRel],
        { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    } catch { /* no history — leave the list off */ }
    const changes = [];
    let behind = false;
    for (const r of out.split(SEP_REC).map(x => x.trim()).filter(Boolean)) {
      const nl = r.indexOf('\n');
      const [date, subject] = (nl === -1 ? r : r.slice(0, nl)).split(SEP_FLD);
      const ms = Date.parse(date);
      if (!(ms > atMs)) continue;
      const subj = (subject || '').trim();
      if (/^chore\(dashboards\)/i.test(subj) || /\[skip ci\]/i.test(subj)) continue;
      // --name-status lines: "M\tpath", "A\tpath", "R087\told\tnew". Only an
      // EDIT to an existing design file means the dev build is behind: added
      // files (a restructure copying the design into verN/) and pure moves
      // (R100) don't change what devs are building.
      const files = (nl === -1 ? '' : r.slice(nl + 1)).split('\n').map(f => f.trim()).filter(Boolean)
        .map(l => l.split('\t'))
        .filter(parts => parts.length > 1 && (parts[0] === 'M' || (/^R\d+$/.test(parts[0]) && parts[0] !== 'R100')))
        .map(parts => parts[parts.length - 1]);
      changes.push({ date, summary: subj });
      // Versioned feature with an unknown handed-off version: can't tell which
      // edits matter, so don't warn. Unversioned (single-file) features: any
      // design edit counts.
      if (ms > syncMs && (verPrefix || !hasVersions) &&
          files.some(f => !isDoc(f) && (verPrefix ? f.startsWith(verPrefix) : true))) behind = true;
    }
    rec.changes = changes.slice(0, 50);
    if (changes.length > rec.changes.length) rec.changesTotal = changes.length;
    if (behind) rec.behind = true;
  }
  return Object.keys(rec).length ? rec : null;
}

// A card must NEVER point at the product's own dashboard. The dashboard app
// always lives at products/<Product>/dashboard/, so any rel that resolves into
// that folder is a self-link — it renders a redundant "go to the dashboard"
// card on the dashboard the user is already viewing. Skip it structurally so a
// hand-added or duplicated "Dashboard" entry in products.json can never render
// (designers do edit products.json by hand, and this kind of entry kept coming
// back). Real mocks that merely have "dashboard" in their name (e.g.
// "ai-search-engine-dashboard") are unaffected — only the dashboard/ folder is.
function isDashboardSelfLink(rel) {
  const norm = String(rel || '').replace(/^\.\//, '').replace(/\/+$/, '');
  return norm === 'dashboard' || norm.startsWith('dashboard/');
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
    // Every changed file under this product that isn't in the dashboard folder
    // or a _planning folder.
    // One entry per file so a commit touching several mocks credits ALL of them
    // (the dashboard dedupes same-commit rows within a single card's log).
    //
    // _planning/ holds PRDs and source docs — working INPUTS, not design
    // output. They are usually confidential, so listing them here (by filename,
    // on a public site) was a small disclosure with no upside: nobody reading a
    // dashboard is looking for "someone added a PRD". Most _planning content is
    // git-ignored, but this filter also covers anything committed before that
    // rule existed, or force-added since.
    const matched = files.filter(f =>
      f.startsWith(productPrefix) &&
      !f.startsWith(productPrefix + 'dashboard/') &&
      !/(^|\/)_planning\//.test(f));
    if (!matched.length) continue; // commit only touched dashboard/ or _planning/ — skip

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
    // Never render a card that links back to this product's own dashboard.
    if (isDashboardSelfLink(it.rel)) continue;
    const entry = {};
    if (it.name) entry.title = it.name;
    if (it.desc) entry.description = it.desc;
    if (it._folder) entry.folder = it._folder;
    if (it.jira) entry.ticket = it.jira;
    // Optional design ticket on the User Experience board (UX-1234), shown as its
    // own badge beside the product ticket. `false` means the designer declined one.
    if (typeof it.designJira === 'string' && it.designJira) entry.designTicket = it.designJira;
    // Optional full URL to the requirements doc (Confluence PRD, etc.); the
    // dashboard renders it as a "PRD" link badge beside the Jira ticket.
    if (it.prd) entry.prd = it.prd;
    if (it.status) entry.status = it.status;
    // Optional annotation shown in the card's Designer Versions drawer
    // (e.g. "Blue sky UI design") — what the working file represents.
    if (it.designerNote) entry.designerNote = it.designerNote;
    // Optional extra links shown as their own rows on the card (e.g. a later phase's
    // version: [{ "label": "Phase 2 (TBD)", "file": "ver2/index.html" }]), paths
    // relative to the mock's folder.
    if (Array.isArray(it.extraLinks) && it.extraLinks.length) entry.extraLinks = it.extraLinks;
    // Curated last-modified date — the dashboard's fallback when no commit in
    // recentChanges can be attributed to this mock.
    if (it.modified) entry.modified = it.modified;

    // Auto-manage devHandoff from the file actually present on disk.
    const dev = detectDevHandoff(productDir, it.rel);
    if (dev) {
      entry.devHandoff = dev;
      const handoff = detectHandoff(productDir, it.rel);
      if (handoff) entry.handoff = handoff;
    }

    // Review/build brief written by the ux-wrapup skill at the feature root.
    if (!it.rel.endsWith('.html') &&
        fs.existsSync(path.join(productDir, it.rel === '.' ? '' : it.rel, 'mock-definition.md'))) {
      entry.reviewDoc = 'mock-definition.md';
    }

    mocks[it.rel] = entry;
  }

  const meta = {
    version: 1,
    _generated: 'Auto-generated by scripts/build-dashboards.js from products.json (the curated source). Do not edit by hand — edit products.json instead.',
    // Product identity for the dashboard banner — the SAME Font Awesome icon
    // and brand color the landing page card uses, so the two always match.
    product: {
      label: product.label || folder,
      icon: product.icon || null,
      color: product.color || null,
    },
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

// ---------------------------------------------------------------------------
// Cache-busting: stamp each dashboard's <script src=".../dashboard.js"> with a
// content hash of the shared script. GitHub Pages caches JS for ~10 minutes,
// so without this a just-deployed dashboard.js change keeps serving stale UI
// to anyone who loaded a dashboard recently. The stamp only changes when
// dashboard.js itself changes, so this is a no-op on most pushes.
// ---------------------------------------------------------------------------

const crypto = require('crypto');
try {
  const dashSrc = fs.readFileSync(path.join(REPO_ROOT, 'designtoolbox', 'dashboard.js'));
  const stamp = crypto.createHash('sha256').update(dashSrc).digest('hex').slice(0, 8);
  for (const product of productList) {
    if (!product || !product.folder) continue;
    const page = path.join(REPO_ROOT, 'products', product.folder, 'dashboard', 'index.html');
    if (!fs.existsSync(page)) continue;
    const before = fs.readFileSync(page, 'utf8');
    const after = before.replace(
      /(src="[^"]*designtoolbox\/dashboard\.js)(\?v=[0-9a-f]*)?"/g,
      `$1?v=${stamp}"`
    );
    if (after !== before) {
      fs.writeFileSync(page, after);
      anyChanged = true;
      console.log(`✓ updated  ${product.folder}: dashboard.js cache stamp → ${stamp}`);
    }
  }
} catch (e) {
  console.warn(`! cache stamp skipped: ${e.message}`);
}

if (!anyChanged) console.log('All dashboards already up to date.');
