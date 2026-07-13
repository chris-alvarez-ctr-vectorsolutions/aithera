#!/usr/bin/env node
/*
  relink-comments.js — re-link feedback-widget comments after a mock is renamed/moved.

  WHY THIS EXISTS
  ---------------
  Comments are NOT stored in the HTML file. They live in the Cloudflare KV store
  behind the feedback widget, keyed by the page's canonical URL:

      pins:<encodeURIComponent(pageUrl)>          // the comment pins for a page
      settings:<encodeURIComponent(pageUrl)>       // per-page admin settings
      log:<iso-ts>:<rand>                          // activity-log events; the page
                                                   //   they point at is a `url` field
                                                   //   INSIDE the JSON value

  (See designtoolbox/worker/index.js and feedback-widget.js `canonicalPageUrl()`.)

  So the key (and, for log entries, the stored `url`) is derived from the
  /products/... path. If you rename or move a mock folder — e.g.
  "versioning test" -> "versioning-test" — every page under it gets a NEW key and
  the existing comments are orphaned under the OLD key. The activity log's page
  links also keep pointing at the old (now dead) URL. Nothing is lost, just
  unreachable, because the widget now looks up the new path.

  A space in a folder name is doubly nasty: the browser encodes it as %20 in the
  URL, so the old key contains "versioning%2520test" (the %20, itself encoded).
  Working in DECODED url-space (as this script does) hides that: you just pass the
  human folder names and the substring swap does the right thing.

  WHAT IT DOES
  ------------
  • pins:/settings: keys  — COPIES each matching key to the key for the same URL
    with --from replaced by --to. Originals are LEFT IN PLACE as a backup.
  • log: entries          — REWRITES the `url` field in place (same key) so the
    activity-log links point at the new path. TTL is refreshed to 90 days.
  Dry-run by default; pass --apply to actually write.

  MODES
  -----
    # 1) INSPECT — see what's in KV for a folder (diagnose missing comments).
    #    Lists pins:/settings: keys whose page URL contains the text, with counts.
    node relink-comments.js --inspect "versioning"

    # 2) RELINK — after a rename. Dry-run first, then --apply.
    node relink-comments.js --from "versioning test" --to "versioning-test"
    node relink-comments.js --from "versioning test" --to "versioning-test" --apply

  Run from designtoolbox/worker (so wrangler reads wrangler.toml for the KV id),
  or pass --namespace-id. You must be logged in: `wrangler login` (one-time).

  FLAGS
    --inspect <s>       list keys whose page URL contains <s>, with pin counts, then exit
    --from <s>          path fragment to look for (required unless --inspect)
    --to <s>            replacement path fragment (required unless --inspect)
    --apply             actually write (default is a dry run that only prints)
    --namespace-id <id> KV namespace id (defaults to the one in wrangler.toml)
    --no-settings       skip settings: keys (default: copy them)
    --no-log            skip rewriting log: link URLs (default: rewrite them)
*/

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ----- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
function flag(name) { return argv.indexOf(name) !== -1; }
function opt(name, def) { const i = argv.indexOf(name); return i !== -1 ? argv[i + 1] : def; }

const INSPECT = opt('--inspect');
const FROM = opt('--from');
const TO = opt('--to');
const APPLY = flag('--apply');
const DO_SETTINGS = !flag('--no-settings');
const DO_LOG = !flag('--no-log');
const LOG_TTL = 90 * 24 * 60 * 60; // match worker's LOG_TTL_SECONDS

if (!INSPECT && (!FROM || !TO)) {
  console.error('ERROR: provide --inspect <text>, OR both --from and --to.\n');
  console.error('  node relink-comments.js --inspect "versioning"');
  console.error('  node relink-comments.js --from "versioning test" --to "versioning-test" [--apply]');
  process.exit(1);
}

// Namespace id: --namespace-id wins, else parse wrangler.toml next to the worker.
function nsFromToml() {
  try {
    const txt = fs.readFileSync(path.resolve(__dirname, '..', 'worker', 'wrangler.toml'), 'utf8');
    const m = txt.match(/id\s*=\s*"([0-9a-f]{32})"/i);
    return m ? m[1] : null;
  } catch { return null; }
}
const NS = opt('--namespace-id', nsFromToml());
if (!NS) { console.error('ERROR: no --namespace-id and none found in worker/wrangler.toml'); process.exit(1); }

// ----- wrangler shell helpers -----------------------------------------------
function wrangler(args) {
  return execFileSync('npx', ['wrangler', ...args, '--namespace-id', NS, '--remote'], {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
}
function kvList() { return JSON.parse(wrangler(['kv', 'key', 'list'])).map((k) => k.name); }
function kvGet(key) { return wrangler(['kv', 'key', 'get', key]); }
function kvPut(key, value, ttl) {
  const tmp = path.join(os.tmpdir(), 'relink-' + Buffer.from(key).toString('hex').slice(0, 24) + '.json');
  fs.writeFileSync(tmp, value);
  try {
    const extra = ttl ? ['--expiration-ttl', String(ttl)] : [];
    wrangler(['kv', 'key', 'put', key, '--path', tmp, ...extra]);
  } finally { try { fs.unlinkSync(tmp); } catch {} }
}

function decodeBody(body) { try { return decodeURIComponent(body); } catch { return null; } }
function pinCount(value) {
  try { const a = JSON.parse(value); return Array.isArray(a) ? a.filter((p) => !p.deleted).length : 0; }
  catch { return '?'; }
}

let allKeys;
try { allKeys = kvList(); }
catch (e) {
  console.error('Failed to list KV keys. Are you logged in? Run `wrangler login` (or set CLOUDFLARE_API_TOKEN).\n');
  console.error(String(e.stderr || e.message || e));
  process.exit(1);
}

// ============================================================================
// INSPECT MODE — show what exists, so you can see V1 vs V2, old vs new path.
// ============================================================================
if (INSPECT) {
  console.log(`Namespace: ${NS}`);
  console.log(`Inspecting keys whose page URL contains: "${INSPECT}"\n`);
  const rows = [];
  for (const key of allKeys) {
    const prefix = ['pins:', 'settings:'].find((p) => key.startsWith(p));
    if (!prefix) continue;
    const url = decodeBody(key.slice(prefix.length));
    if (!url || !url.includes(INSPECT)) continue;
    let detail = '';
    if (prefix === 'pins:') detail = `${pinCount(kvGet(key))} active comment(s)`;
    rows.push({ prefix, url, detail });
  }
  if (!rows.length) { console.log('No pins:/settings: keys matched.'); process.exit(0); }
  rows.sort((a, b) => a.url.localeCompare(b.url));
  for (const r of rows) console.log(`• [${r.prefix.replace(':', '')}] ${r.url}${r.detail ? '  — ' + r.detail : ''}`);
  console.log(`\n${rows.length} key(s). Old (renamed-away) paths still holding comments are the ones to relink.`);
  process.exit(0);
}

// ============================================================================
// RELINK MODE
// ============================================================================
// Match/rewrite in DECODED url-space. The browser encodes a space as %20, so
// match the URL form (encodeURI("versioning test") === "versioning%20test").
const fromFrag = encodeURI(FROM);
const toFrag = encodeURI(TO);
const copyPrefixes = DO_SETTINGS ? ['pins:', 'settings:'] : ['pins:'];

// pins:/settings: — key carries the url; copy to the rewritten key.
function rewriteKey(key) {
  const prefix = copyPrefixes.find((p) => key.startsWith(p));
  if (!prefix) return null;
  const url = decodeBody(key.slice(prefix.length));
  if (url == null || !url.includes(fromFrag)) return null;
  const newUrl = url.split(fromFrag).join(toFrag);
  return { prefix, oldKey: key, oldUrl: url, newUrl, newKey: prefix + encodeURIComponent(newUrl) };
}

console.log(`Namespace: ${NS}`);
console.log(`Match:     "${fromFrag}"  ->  "${toFrag}"  (in decoded page URLs)`);
console.log(`Mode:      ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes — add --apply to copy)'}\n`);

// ---- 1) copy pins:/settings: keys -----------------------------------------
const matches = allKeys.map(rewriteKey).filter(Boolean);
let copied = 0, skipped = 0;
if (!matches.length) {
  console.log('No pins:/settings: keys matched. (Check --from against the OLD path — try --inspect.)\n');
} else {
  console.log(`Comment/settings keys to copy (${matches.length}):`);
  for (const m of matches) {
    console.log(`• [${m.prefix.replace(':', '')}] ${m.oldUrl}\n    -> ${m.newUrl}`);
    if (!APPLY) { console.log('    (dry run)'); continue; }
    const value = kvGet(m.oldKey);
    let existing = null;
    try { existing = kvGet(m.newKey); } catch { existing = null; }
    const t = (existing || '').trim();
    if (t && t !== '[]' && t !== 'null') { console.log('    SKIPPED — destination already has data.'); skipped++; continue; }
    kvPut(m.newKey, value);
    console.log('    copied ✓'); copied++;
  }
  console.log('');
}

// ---- 2) rewrite log: link URLs in place -----------------------------------
let logHits = 0, logWritten = 0;
if (DO_LOG) {
  const logKeys = allKeys.filter((k) => k.startsWith('log:'));
  const pending = [];
  for (const key of logKeys) {
    let evt;
    try { evt = JSON.parse(kvGet(key)); } catch { continue; }
    if (!evt || typeof evt.url !== 'string' || !evt.url.includes(fromFrag)) continue;
    pending.push({ key, evt, newUrl: evt.url.split(fromFrag).join(toFrag) });
  }
  logHits = pending.length;
  if (pending.length) {
    console.log(`Activity-log links to repoint (${pending.length}):`);
    for (const p of pending) {
      console.log(`• ${p.key}\n    ${p.evt.url}\n    -> ${p.newUrl}`);
      if (!APPLY) { console.log('    (dry run)'); continue; }
      p.evt.url = p.newUrl;
      kvPut(p.key, JSON.stringify(p.evt), LOG_TTL);
      console.log('    updated ✓'); logWritten++;
    }
    console.log('');
  } else {
    console.log('Activity-log: no link URLs matched.\n');
  }
}

// ---- summary ---------------------------------------------------------------
if (APPLY) {
  console.log(`Done. Comments copied: ${copied} (skipped ${skipped}). Log links updated: ${logWritten}.`);
  console.log('Original comment keys left in place as backup. Reload the renamed mock on GitHub Pages.');
} else {
  console.log(`Dry run complete — would copy ${matches.length} comment/settings key(s) and repoint ${logHits} log link(s). Re-run with --apply.`);
}
